import type * as Blockly from "blockly";

/**
 * v2b.2: clone-on-hover for the continuous-toolbox flyout.
 *
 * The flyout is 250px wide and clips its overflow, so wide blocks are cut off.
 * Instead of widening the flyout (which fights `ContinuousFlyout.show()` —
 * it copies the main workspace scale onto the flyout workspace every reflow),
 * we render a clone of the hovered block into a fixed, pointer-transparent
 * overlay above the whole app. The flyout itself is untouched.
 */

const OVERLAY_ID = "block-clone-overlay";

/** Fade timings, in ms. */
const FADE_IN_MS = 150;
const FADE_OUT_MS = 120;

/** Class Blockly uses for both real selection and flyout hover. */
const SELECTED_CLASS = "blocklySelected";

/** Strip ids so the clone cannot collide with the live block in the document. */
function stripIds(node: Element): void {
  node.removeAttribute("id");
  node.removeAttribute("data-id");
  node.removeAttribute("tabindex");
  for (const child of Array.from(node.querySelectorAll("[id], [data-id]"))) {
    child.removeAttribute("id");
    child.removeAttribute("data-id");
  }
}

/** Nearest flyout block for an event target, or null. */
function flyoutBlockFrom(
  target: EventTarget | null,
  flyoutSvg: SVGElement,
): SVGGElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const block = target.closest<SVGGElement>(".blocklyDraggable");
  if (!block || !flyoutSvg.contains(block)) {
    return null;
  }
  return block;
}

/**
 * Builds a `transform` string that places the clone exactly where the block is
 * on screen, at exactly the size it appears.
 *
 * The block's combined screen matrix already includes every ancestor transform
 * — the block's own `translate(x, y)`, the flyout canvas scroll, and the flyout
 * zoom — and resolves to viewport pixels. The overlay is `position: fixed;
 * inset: 0`, so viewport pixels are exactly its coordinate space. Using the
 * matrix verbatim reproduces the block one-for-one, with no scale arithmetic.
 */
function screenTransform(screenCtm: DOMMatrix): string {
  const { a, b, c, d, e, f } = screenCtm;
  return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
}

/**
 * The inline opacity state of a source block that is currently crossfaded out.
 *
 * Suppression is done purely with `style.opacity` — never `classList` — so
 * Blockly's own DOM observer never sees a mutation and its hover state machine
 * cannot be driven into a feedback loop.
 */
interface SourceFade {
  el: SVGGElement;
  prevTransition: string;
  prevOpacity: string;
}

/**
 * Attaches the hover-clone behaviour and returns a disposer.
 *
 * `container` is the element Blockly was injected into; the flyout SVG lives
 * inside it. `flyout` is the live flyout.
 */
export function attachFlyoutCloneHover(
  container: HTMLElement,
  // Kept in the signature for the caller. Positioning now comes from the
  // block's own screen CTM, so the flyout's scale is no longer read here.
  _flyout: Blockly.IFlyout,
): () => void {
  // The flyout has no public accessor for its SVG root in Blockly 13. Query it
  // off the injection container; the trashcan flyout is a separate element, so
  // the .blocklyToolboxFlyout class is what keeps us on the toolbox flyout.
  const flyoutSvg = container.querySelector<SVGSVGElement>(
    ".blocklyFlyout.blocklyToolboxFlyout",
  );
  if (!flyoutSvg) {
    return () => {};
  }

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:9999;" +
      "overflow:hidden;display:none;opacity:0;will-change:opacity;";
    document.body.appendChild(overlay);
  }
  const overlayEl = overlay;

  // The OS "reduce motion" setting turns the fades off.
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Blockly's block styling (fonts, text fill, path colours, field styling) is
  // all scoped under `.injectionDiv.<renderer>.<theme>` — e.g.
  // `.zelos-renderer.pybricks-dark-theme .blocklyText`. The overlay lives
  // outside that wrapper, so a bare clone renders in the browser default font.
  // Copy the theme classes onto our wrapper to bring the CSS into scope.
  const injectionDiv = container.querySelector<HTMLElement>(".injectionDiv");
  const themeClasses = injectionDiv
    ? Array.from(injectionDiv.classList).filter((c) => c !== "injectionDiv")
    : [];

  // The theme classes alone are not enough: Blockly also sets its filter and
  // pattern references as CSS custom properties in the injection div's INLINE
  // style (`--blocklySelectedGlowFilter: url(#…)`). Those do not inherit into
  // the overlay, so `filter: var(--blocklySelectedGlowFilter)` on the clone
  // would resolve to nothing and the selected block would render without its
  // glow. Copy every custom property across so the clone's styling context is
  // a faithful replica of the workspace's.
  const themeVars: Array<[string, string]> = [];
  if (injectionDiv) {
    const inline = injectionDiv.style;
    for (let i = 0; i < inline.length; i++) {
      const prop = inline.item(i);
      if (prop.startsWith("--")) {
        themeVars.push([prop, inline.getPropertyValue(prop)]);
      }
    }
  }

  let shownBlock: SVGGElement | null = null;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;
  let fadeFrame: number | null = null;
  /** The source block currently crossfaded out, if any. */
  let sourceFade: SourceFade | null = null;
  /** A source block whose inline style still needs restoring after a fade-out. */
  let pendingRestore: SourceFade | null = null;
  /** Timer that restores a source block's inline style after a fade-out. */
  let sourceRestoreTimer: ReturnType<typeof setTimeout> | null = null;

  const clearFade = (): void => {
    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
    if (fadeTimer !== null) {
      clearTimeout(fadeTimer);
      fadeTimer = null;
    }
  };

  /**
   * Puts a crossfaded-out source block back to full opacity immediately, with
   * no transition, and restores its original inline style.
   *
   * Used on hide() (after the fade-out has run) and on swap (before the next
   * block is cloned), so a fast A → B → A traversal never leaves the wrong
   * block invisible.
   */
  const snapSourceBack = (fade: SourceFade): void => {
    fade.el.style.transition = "none";
    fade.el.style.opacity = "1";
    // Flush so the snap is committed before the transition is restored.
    void fade.el.getBoundingClientRect();
    fade.el.style.transition = fade.prevTransition;
    fade.el.style.opacity = fade.prevOpacity;
  };

  /** Cancels any pending source restore and snaps the block back. */
  const clearSourceFade = (): void => {
    if (sourceRestoreTimer !== null) {
      clearTimeout(sourceRestoreTimer);
      sourceRestoreTimer = null;
    }
    // A block whose fade-out already started still carries inline
    // `transition`/`opacity`; restore it now rather than leaving it behind.
    if (pendingRestore) {
      pendingRestore.el.style.transition = pendingRestore.prevTransition;
      pendingRestore.el.style.opacity = pendingRestore.prevOpacity;
      pendingRestore = null;
    }
    if (sourceFade) {
      snapSourceBack(sourceFade);
      sourceFade = null;
    }
  };

  /**
   * Starts the source block's crossfade to transparent.
   *
   * The clone is opaque and covers the source exactly, so the source is
   * invisible for as long as the clone is up. Fading the source out at the same
   * rate the clone fades in also removes the "doubled highlight" artefact: the
   * two are never both visible at full strength.
   */
  const startSourceFade = (source: SVGGElement): void => {
    // A previous source must be fully restored before this one starts.
    clearSourceFade();
    const fade: SourceFade = {
      el: source,
      prevTransition: source.style.transition,
      prevOpacity: source.style.opacity,
    };
    sourceFade = fade;
    source.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
    // Force a style flush so the transition runs from 1 → 0 rather than being
    // collapsed into a single computed-value change.
    void source.getBoundingClientRect();
    source.style.opacity = "0";
  };

  const hide = (): void => {
    if (!shownBlock) {
      return;
    }
    shownBlock = null;
    clearFade();

    if (reduceMotion) {
      clearSourceFade();
      overlayEl.style.display = "none";
      overlayEl.style.opacity = "0";
      overlayEl.replaceChildren();
      return;
    }

    // Crossfade back: the source comes up as the clone goes down, so the block
    // underneath is never visibly unhighlighted during the fade-out.
    if (sourceFade) {
      const fade = sourceFade;
      sourceFade = null;
      pendingRestore = fade;
      fade.el.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
      void fade.el.getBoundingClientRect();
      fade.el.style.opacity = "1";
      sourceRestoreTimer = setTimeout(() => {
        sourceRestoreTimer = null;
        pendingRestore = null;
        fade.el.style.transition = fade.prevTransition;
        fade.el.style.opacity = fade.prevOpacity;
      }, FADE_OUT_MS + 20);
    }

    overlayEl.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
    overlayEl.style.opacity = "0";
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      // A fresh block may have been shown while we were fading out.
      if (shownBlock) {
        return;
      }
      overlayEl.style.display = "none";
      overlayEl.replaceChildren();
    }, FADE_OUT_MS + 20);
  };

  const show = (block: SVGGElement): void => {
    if (block === shownBlock && overlayEl.style.display === "block") {
      return;
    }
    // True when this is a swap between two blocks rather than a fresh appear.
    const isSwap = overlayEl.style.display === "block";

    // A block with no rendered size (collapsed or not yet laid out) would
    // produce a zero-size clone.
    const rect = block.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      hide();
      return;
    }

    // Rebuild the transform the block inherited from its ancestors. Blockly
    // draws a block at `translate(x, y)` inside `.blocklyBlockCanvas`, whose
    // own transform carries both the flyout scroll and the flyout zoom
    // ("translate(0, -275.4) scale(0.9)"). The combined screen CTM folds all of
    // that into viewport pixels, which is precisely the overlay's coordinate
    // space, so the clone lands at the block's exact position and size.
    const ctm = block.getScreenCTM();
    if (!ctm) {
      hide();
      return;
    }

    const clone = block.cloneNode(true) as SVGGElement;
    stripIds(clone);

    // The clone is the visual stand-in for a HOVERED block, so it must look
    // "picked up" — but it must still look like the block, blue body and all.
    //
    // Blockly's own selection style is
    // `.blocklySelected > .blocklyPath.blocklyPathSelected { fill: none;
    // filter: var(--blocklySelectedGlowFilter) }`. That filter is a yellow
    // silhouette (feFlood + composite), so applying it to the block's own path
    // replaces its colour with a flat yellow outline — the "transparent block,
    // no blue background" artefact.
    //
    // Instead, keep the block's path untouched and insert a DUPLICATE of it
    // directly behind, carrying `blocklyPathSelected` so Blockly's own glow
    // rule paints the halo. The original path paints the block on top, so both
    // are visible: highlighted, and still blue.
    clone.classList.add(SELECTED_CLASS);

    for (const path of Array.from(
      clone.querySelectorAll<SVGElement>(".blocklyPath"),
    )) {
      const glow = path.cloneNode(true) as SVGElement;
      glow.removeAttribute("id");
      glow.classList.add("blocklyPathSelected");
      // Drop the inline styling so the copied CSS variables take over.
      glow.style.removeProperty("stroke");
      glow.style.removeProperty("stroke-width");
      glow.style.removeProperty("filter");
      glow.style.removeProperty("fill");
      path.parentNode?.insertBefore(glow, path);
    }

    clone.setAttribute("transform", screenTransform(ctm));

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;left:0;top:0;";
    for (const cls of themeClasses) {
      wrapper.classList.add(cls);
    }
    // Bring Blockly's filter/pattern custom properties into the overlay's
    // scope, so `var(--blocklySelectedGlowFilter)` resolves on the clone.
    for (const [prop, value] of themeVars) {
      wrapper.style.setProperty(prop, value);
    }

    // An <svg> with no width/height defaults to 100%x100% of its parent, and
    // the wrapper is a 0x0 empty div, so the clone would paint into a
    // zero-size viewport and nothing would appear. Give the SVG the full
    // viewport in pixels — the clone's own matrix handles position and size.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(window.innerWidth));
    svg.setAttribute("height", String(window.innerHeight));
    // Purely a container: the block carries its own transform, and
    // overflow:visible lets shadows and protruding fields render.
    svg.style.cssText = "position:absolute;left:0;top:0;overflow:visible;";
    svg.appendChild(clone);
    wrapper.appendChild(svg);

    clearFade();
    // Place the clone at opacity 0 with no transition, then flush, so the
    // fade-in below actually runs instead of being collapsed into one paint.
    overlayEl.style.transition = "none";
    overlayEl.style.opacity = "0";
    overlayEl.replaceChildren(wrapper);
    overlayEl.style.display = "block";
    shownBlock = block;
    void overlayEl.getBoundingClientRect();

    // A swap keeps the overlay already visible, so it snaps rather than fades
    // and must not blink. The previous source is snapped back to full opacity
    // before the new one starts fading out.
    if (reduceMotion || isSwap) {
      clearSourceFade();
      overlayEl.style.transition = "none";
      overlayEl.style.opacity = "1";
      if (!reduceMotion) {
        startSourceFade(block);
      }
      return;
    }

    // Fresh appear: start the overlay fade-in and the source crossfade on the
    // same frame, so the two are never both visible at full strength.
    fadeFrame = requestAnimationFrame(() => {
      fadeFrame = null;
      // A hide() may have landed before this frame ran.
      if (!shownBlock) {
        return;
      }
      overlayEl.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
      overlayEl.style.opacity = "1";
      startSourceFade(block);
    });
  };

  const onMouseOver = (event: MouseEvent): void => {
    const block = flyoutBlockFrom(event.target, flyoutSvg);
    if (block) {
      show(block);
    }
  };

  const onMouseOut = (event: MouseEvent): void => {
    const block = flyoutBlockFrom(event.target, flyoutSvg);
    if (!block) {
      return;
    }
    const related = event.relatedTarget as Node | null;
    // Leaving the flyout entirely (or the window) — always drop the clone.
    if (!related || !flyoutSvg.contains(related)) {
      hide();
      return;
    }
    // Moving between two blocks: keep the clone up, `mouseover` will swap it.
    // Moving onto a heading or the flyout background: nothing left to hover.
    if (!flyoutBlockFrom(related, flyoutSvg)) {
      hide();
    }
  };

  // The clone is positioned in viewport coordinates, so it goes stale the
  // moment the flyout scrolls, the canvas moves, or the window resizes.
  // Capture phase so the original is restored before Blockly starts a drag:
  // the block the user then drags is the real one, drawn at the same spot the
  // clone was, so dragging "the clone" works without any extra machinery.
  const onMouseDown = (): void => hide();
  const onLeave = (): void => hide();
  const onScroll = (): void => hide();
  const onResize = (): void => hide();
  const onWheel = (): void => hide();

  // Defensive teardown: any of these can strand the overlay on screen when the
  // pointer never produces a mouseout (alt-tab, window blur, touch, context
  // menu). None of them re-show; if the pointer is still over the block the
  // clone stays gone until it moves, which is the correct behaviour.
  const onWindowBlur = (): void => hide();
  const onDocMouseLeave = (): void => hide();
  const onDocMouseOut = (e: MouseEvent): void => {
    if (!e.relatedTarget) {
      hide();
    }
  };
  const onVisibilityChange = (): void => {
    if (document.hidden) {
      hide();
    }
  };
  const onKeyDown = (): void => hide();
  const onPointerDown = (): void => hide();
  const onContextMenu = (): void => hide();

  flyoutSvg.addEventListener("mouseover", onMouseOver);
  flyoutSvg.addEventListener("mouseout", onMouseOut);
  flyoutSvg.addEventListener("mousedown", onMouseDown, true);
  flyoutSvg.addEventListener("mouseleave", onLeave);
  flyoutSvg.addEventListener("wheel", onWheel, { passive: true });
  flyoutSvg.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("mouseleave", onDocMouseLeave);
  document.addEventListener("mouseout", onDocMouseOut);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("pointerdown", onPointerDown, true);

  return () => {
    flyoutSvg.removeEventListener("mouseover", onMouseOver);
    flyoutSvg.removeEventListener("mouseout", onMouseOut);
    flyoutSvg.removeEventListener("mousedown", onMouseDown, true);
    flyoutSvg.removeEventListener("mouseleave", onLeave);
    flyoutSvg.removeEventListener("wheel", onWheel);
    flyoutSvg.removeEventListener("contextmenu", onContextMenu);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("blur", onWindowBlur);
    window.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("mouseleave", onDocMouseLeave);
    document.removeEventListener("mouseout", onDocMouseOut);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("pointerdown", onPointerDown, true);
    hide();
    // hide() only schedules the source restore; on teardown it must be
    // immediate so no block is left transparent.
    clearSourceFade();
  };
}
