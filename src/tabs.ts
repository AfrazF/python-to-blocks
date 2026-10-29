import type * as monaco from "monaco-editor/editor/editor.api.js";

type ViewState = monaco.editor.ICodeEditorViewState;

/**
 * A Blockly workspace viewport snapshot. Block IDs regenerate on every render,
 * so scroll offset and zoom are the only state worth carrying across a tab
 * switch.
 */
export interface BlocklyViewState {
  scrollX: number;
  scrollY: number;
  scale: number;
}

/**
 * Options for {@link createTabBar}. The tab bar owns the open-file list, the
 * active file, and each file's Monaco and Blockly view state. It knows nothing
 * about Blockly or the walker: the caller supplies the callbacks.
 */
export interface TabBarOptions {
  /** Host element for the tab strip (`.tab-bar`). */
  container: HTMLElement;
  /** The Monaco host. */
  editorContainer: HTMLElement;
  /**
   * Host for the blank-state overlay. This is `#workspace-row`, not the Monaco
   * panel: the message must stay visible when the code panel is closed, and
   * when the blocks panel is closed too.
   */
  emptyStateContainer: HTMLElement;
  /** Snapshot of the current cursor + scroll, or null with no model. */
  saveViewState: () => ViewState | null;
  /** Re-applies a snapshot produced by `saveViewState`. */
  restoreViewState: (state: ViewState) => void;
  /** Snapshot of the Blockly scroll offset + zoom, or null with no workspace. */
  saveBlocklyViewState: () => BlocklyViewState | null;
  /** Re-applies a snapshot produced by `saveBlocklyViewState`. */
  restoreBlocklyViewState: (state: BlocklyViewState) => void;
  /** Materialise a file: clear the workspace, render blocks, set Monaco text. */
  loadFile: (name: string) => void;
  /** Empty the workspace and the editor for the blank state. */
  clearFile: () => void;
  /**
   * Runs after every render. The tab strip appears and disappears, which
   * changes the height available to the blocks canvas; automaticLayout is off,
   * so both panels need an explicit relayout.
   */
  onLayout: () => void;
}

export interface TabBar {
  /** Opens a file as a tab, or focuses it when it is already open. */
  open: (name: string) => void;
  /** Closes a tab; a closed active tab hands over to its left neighbour. */
  close: (name: string) => void;
  /** Drops tabs whose files no longer exist, fixing up the active tab. */
  retain: (names: string[]) => void;
  /** Closes every tab and returns to the blank state. */
  reset: () => void;
  /** The file whose blocks are on screen, or null in the blank state. */
  activeFile: () => string | null;
}

/**
 * VS Code-style tab strip above the blocks + Monaco row.
 *
 * State is three plain values (open files, active file, per-file view state);
 * rendering rebuilds the strip from that state. Clicks are handled by one
 * delegate on the container, so rebuilding never leaks listeners.
 */
export function createTabBar(options: TabBarOptions): TabBar {
  const { container, emptyStateContainer } = options;

  const openFiles: string[] = [];
  const buttons = new Map<string, HTMLElement>();
  const viewStateByFile = new Map<string, ViewState>();
  const blocklyViewStateByFile = new Map<string, BlocklyViewState>();
  // The viewport the workspace was injected with (Blockly's startScale and a
  // zero scroll). Captured before the first file renders, and reapplied when a
  // file is opened for the first time so it never inherits the previous file's
  // zoom and scroll.
  const defaultBlocklyViewState = options.saveBlocklyViewState();
  let activeFile: string | null = null;
  // The file whose content is actually in the workspace and the editor. It
  // trails `activeFile` by one frame because the content swap is deferred, and
  // it is what view state must be captured against: during that frame the
  // panels still hold the previous file's blocks and text.
  let loadedFile: string | null = null;
  // Pending deferred content swap. Cancelled when another tab is activated
  // before the frame runs, so rapid clicks never double-render.
  let pendingFrame: number | null = null;

  // Blank state message. Sits over the whole workspace row rather than inside
  // the Monaco panel, so it is still visible when the code panel is closed —
  // and when the blocks panel is closed as well, which would otherwise leave
  // the page completely blank.
  const emptyState = document.createElement("div");
  emptyState.id = "empty-state";
  emptyState.textContent = "To get started, open a file";
  emptyStateContainer.appendChild(emptyState);

  // The underline is a single persistent node so it can animate between tabs.
  const underline = document.createElement("div");
  underline.className = "tab-underline";

  const positionUnderline = (): void => {
    const active = activeFile ? buttons.get(activeFile) : undefined;
    if (!active) {
      underline.style.width = "0px";
      return;
    }
    // The underline is an absolutely positioned child of the scrolling strip,
    // so it scrolls with the content and offsetLeft alone keeps it aligned.
    underline.style.left = `${active.offsetLeft}px`;
    underline.style.width = `${active.offsetWidth}px`;
  };

  /**
   * Snapshots both panels for `name`. Callers pass the file whose content is
   * currently on screen, which is `loadedFile` rather than `activeFile` while a
   * deferred swap is in flight.
   */
  const captureViewState = (name: string): void => {
    const monacoState = options.saveViewState();
    if (monacoState) {
      viewStateByFile.set(name, monacoState);
    }
    const blocklyState = options.saveBlocklyViewState();
    if (blocklyState) {
      blocklyViewStateByFile.set(name, blocklyState);
    }
  };

  const cancelPendingFrame = (): void => {
    if (pendingFrame !== null) {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
    }
  };

  const render = (): void => {
    const blank = openFiles.length === 0;
    container.hidden = blank;
    document.body.classList.toggle("no-tab-open", blank);
    // Rebuilding the strip resets its horizontal scroll, which would shunt the
    // tabs sideways every time one is clicked. Restore it after the swap.
    const scrollLeft = container.scrollLeft;

    buttons.clear();
    const nodes: HTMLElement[] = openFiles.map((name) => {
      const isActive = name === activeFile;

      const tab = document.createElement("div");
      tab.className = "tab";
      tab.classList.toggle("tab-active", isActive);
      tab.dataset.file = name;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(isActive));
      tab.title = name;

      const label = document.createElement("span");
      label.className = "tab-label";
      label.textContent = name;
      tab.appendChild(label);

      const close = document.createElement("button");
      close.type = "button";
      close.className = "tab-close";
      close.dataset.close = name;
      close.title = `Close ${name}`;
      close.setAttribute("aria-label", `Close ${name}`);

      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "close";
      close.appendChild(icon);
      tab.appendChild(close);

      buttons.set(name, tab);
      return tab;
    });

    container.replaceChildren(...nodes, underline);
    container.scrollLeft = scrollLeft;
    positionUnderline();
    // The blank state toggles `display` on the panels, so the DOM must settle
    // before Monaco and Blockly measure their containers. A synchronous
    // layout() here reads the pre-toggle sizes — and zero while the panels are
    // display:none — which is what left Monaco transparent after an
    // empty → non-empty → empty round trip.
    requestAnimationFrame(() => options.onLayout());
  };

  const activate = (name: string): void => {
    if (activeFile === name) {
      positionUnderline();
      return;
    }
    // Capture the outgoing file's view state synchronously: the workspace and
    // the editor still hold its content right now, and the deferred swap below
    // is about to replace it.
    if (loadedFile) {
      captureViewState(loadedFile);
    }
    activeFile = name;
    // Paint the tab strip first. The active class and the underline move on
    // this frame, so the click feels immediate.
    render();
    // Then defer the heavy work (workspace.clear + renderFile + setValue) to
    // the next frame, letting the browser paint the tab change before the main
    // thread blocks. rAF rather than setTimeout: no artificial latency.
    cancelPendingFrame();
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      options.loadFile(name);
      loadedFile = name;
      const restored = viewStateByFile.get(name);
      if (restored) {
        options.restoreViewState(restored);
      }
      // A file with no saved viewport starts at the workspace default rather
      // than inheriting the previous file's scroll and zoom.
      const blocklyRestored =
        blocklyViewStateByFile.get(name) ?? defaultBlocklyViewState;
      if (blocklyRestored) {
        options.restoreBlocklyViewState(blocklyRestored);
      }
      // The blocks changed, so the canvas needs a resize after the render.
      options.onLayout();
    });
  };

  const blank = (): void => {
    cancelPendingFrame();
    activeFile = null;
    loadedFile = null;
    options.clearFile();
    render();
  };

  const open = (name: string): void => {
    if (!openFiles.includes(name)) {
      openFiles.push(name);
    }
    activate(name);
    // activate() renders, except when the tab was already active; a newly
    // pushed tab is never the active one, so the strip is always up to date.
  };

  const close = (name: string): void => {
    const index = openFiles.indexOf(name);
    if (index === -1) {
      return;
    }
    const wasActive = name === activeFile;
    if (wasActive) {
      // Keep the snapshot: reopening the file should come back where it was.
      // Capture against the file actually on screen — if a deferred swap is
      // still pending, the panels hold the previous file, not this one.
      cancelPendingFrame();
      if (loadedFile) {
        captureViewState(loadedFile);
      }
    }
    openFiles.splice(index, 1);
    buttons.delete(name);

    if (!wasActive) {
      render();
      return;
    }
    // The tab that slid into `index` was on the right; the left neighbour is
    // `index - 1`, clamped to 0 when the closed tab was the first one.
    activeFile = null;
    const survivor = openFiles[Math.max(0, index - 1)];
    if (survivor) {
      activate(survivor);
    } else {
      blank();
    }
  };

  const retain = (names: string[]): void => {
    if (openFiles.length === 0) {
      return;
    }
    const before = [...openFiles];
    const valid = before.filter((name) => names.includes(name));
    if (valid.length === before.length) {
      return;
    }
    const oldActive = activeFile;
    const oldIndex = oldActive ? before.indexOf(oldActive) : -1;
    const activeMissing =
      oldActive !== null && oldIndex !== -1 && !names.includes(oldActive);

    if (activeMissing && oldActive) {
      cancelPendingFrame();
      if (loadedFile) {
        captureViewState(loadedFile);
      }
    }

    openFiles.length = 0;
    openFiles.push(...valid);
    buttons.clear();

    if (!activeMissing) {
      render();
      return;
    }

    // Hand over to the nearest surviving tab to the left of the closed one,
    // matching manual close. Falls back to the rightmost survivor.
    let survivor: string | null = null;
    for (let i = oldIndex - 1; i >= 0; i--) {
      if (valid.includes(before[i])) {
        survivor = before[i];
        break;
      }
    }
    if (!survivor) {
      survivor = valid[0] ?? null;
    }
    activeFile = null;
    if (survivor) {
      activate(survivor);
    } else {
      blank();
    }
  };

  const reset = (): void => {
    openFiles.length = 0;
    buttons.clear();
    viewStateByFile.clear();
    blocklyViewStateByFile.clear();
    blank();
  };

  container.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as Element | null;
    const closeButton = target?.closest<HTMLElement>("[data-close]");
    if (closeButton) {
      const name = closeButton.dataset.close;
      if (name) {
        close(name);
      }
      return;
    }
    const tab = target?.closest<HTMLElement>(".tab");
    const name = tab?.dataset.file;
    if (name) {
      open(name);
    }
  });

  // A horizontal scroll or a window resize moves every tab's offsetLeft
  // without changing the active file, so the underline has to follow.
  container.addEventListener("scroll", positionUnderline);

  return {
    open,
    close,
    retain,
    reset,
    activeFile: () => activeFile,
  };
}
