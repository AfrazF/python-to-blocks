import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 32;
const PILL_RADIUS = 16;

// Swatch geometry, taken from the Pybricks reference SVG
// (docs/pybricks-blocks/hub/pybricks_variables_get_color.svg).
//
// These are relative to the field group, which Blockly already positions at
// translate(12, 4) inside the block. The reference SVG puts the swatch at
// x=0 within its own translate(12, 9.3333) group, so the x here must be 0 —
// using 12 would double-count the group offset and shift everything right.
const SWATCH_X = 0;
const SWATCH_Y = 5.33;
const SWATCH_WIDTH = 26.67;
const SWATCH_HEIGHT = 21.33;
const SWATCH_STROKE = "#4585a1";
// Where the dropdown label starts, so it clears the swatch. Reference: the
// text group sits at x=46.6667 absolute, i.e. 34.6667 inside the field group.
const TEXT_X = 34.67;
// Arrow geometry and the gap between the label and it.
const ARROW_WIDTH = 12;
const ARROW_HEIGHT = 8.79;
const ARROW_GAP = 8;
const PILL_RIGHT_PADDING = 12;
// Floor so a one-letter label still reads as a pill, not a circle.
const MIN_PILL_WIDTH = 88;

/**
 * The Pybricks colour palette: label shown in the pill, hex stored as value.
 *
 * Values match the swatches on
 * https://docs.pybricks.com/en/stable/parameters/color.html — each is the RGB
 * form of the documented HSV triple. `violet` is `Color(h=270, s=100, v=100)`,
 * whose red channel is 127.5 and rounds to 128 (`#80`), not 127 (`#7f`).
 */
const COLOURS: [string, string][] = [
  ["red", "#ff0000"],
  ["orange", "#ff8000"],
  ["yellow", "#ffff00"],
  ["green", "#00ff00"],
  ["cyan", "#00ffff"],
  ["blue", "#0000ff"],
  ["violet", "#8000ff"],
  ["magenta", "#ff00ff"],
  ["white", "#ffffff"],
  ["gray", "#808080"],
  ["black", "#1a1a1a"],
  ["none", "#000000"],
];

/**
 * A pill dropdown that shows a colour swatch before its label.
 *
 * Blockly 13 has no `FieldColour` in core — it lives in the separate
 * `@blockly/field-colour` plugin, which this project does not depend on. So
 * this extends `FieldDropdown` exactly like `FieldPillDropdown` does, and adds
 * one thing: an inner `<rect>` filled with the selected colour.
 *
 * Two shapes are supported:
 *
 * - **Wrapped** (default): the field draws its own darker pill `<path>` inside
 *   the block, matching the Pybricks colour-sensor blocks.
 * - **Unwrapped** (`noWrapper: true`): no pill path. The swatch and label sit
 *   directly on the block, which is already a cyan pill — this is the
 *   standalone `pybricks_colour` value block, per
 *   `docs/pybricks-blocks/hub/pybricks_variables_get_color.svg`.
 */
export class FieldColourPill extends Blockly.FieldDropdown {
  private pillPath?: SVGPathElement;
  private swatchRect?: SVGRectElement;
  private defaultRect?: SVGRectElement;
  /** True for the standalone value block, whose own path is the pill. */
  private noWrapper = false;

  constructor() {
    super(COLOURS);
  }

  /**
   * The palette is hardcoded in the constructor, so the JSON config carries no
   * `options`. `FieldDropdown.fromJson` requires them and throws otherwise, so
   * bypass it entirely.
   */
  static override fromJson(config: Record<string, unknown>): FieldColourPill {
    const field = new FieldColourPill();
    field.noWrapper = config.noWrapper === true;
    return field;
  }

  /**
   * The label shown in the pill, e.g. `red`.
   *
   * `FieldDropdown` derives this from the selected option's display text, but
   * it is also what `updateShapes()` writes into the SVG, so it must never
   * return an empty string for a valid value.
   */
  override getText_(): string {
    const value = this.getValue();
    const match = COLOURS.find(([, hex]) => hex === value);
    return match ? match[0] : String(value ?? "");
  }

  override initView(): void {
    super.initView();
    const root = this.getSvgRoot();
    if (!root) {
      return;
    }
    root.classList.add("pybricks-custom-field");
    this.defaultRect = root.querySelector("rect") ?? undefined;
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }

    this.pillPath = document.createElementNS(SVG_NS, "path");
    this.swatchRect = document.createElementNS(SVG_NS, "rect");
    this.swatchRect.setAttribute("rx", "4");
    this.swatchRect.setAttribute("ry", "4");
    this.swatchRect.setAttribute("x", String(SWATCH_X));
    this.swatchRect.setAttribute("y", String(SWATCH_Y));
    this.swatchRect.setAttribute("width", String(SWATCH_WIDTH));
    this.swatchRect.setAttribute("height", String(SWATCH_HEIGHT));
    this.swatchRect.setAttribute("stroke", SWATCH_STROKE);
    this.swatchRect.style.setProperty("fill-opacity", "1");

    // The pill path is only drawn for the wrapped shape. The standalone value
    // block is already a pill, so a second one would show as a darker inset.
    if (this.noWrapper) {
      root.insertBefore(this.swatchRect, root.firstChild);
    } else {
      root.insertBefore(this.pillPath, root.firstChild);
      root.insertBefore(this.swatchRect, this.pillPath.nextSibling);
    }
    root.style.fill = "#ffffff";
    this.updateShapes();
  }

  /**
   * Returns the field's size, repainting first.
   *
   * `getSize()` is the only place Blockly calls `render_()` from — see the
   * `Field.render_` docs: "Used by getSize() to move/resize any DOM elements,
   * and get the new size." Returning a cached `size_` without rendering means a
   * value change never repaints the swatch, so the pill keeps showing the old
   * colour until something else forces a re-layout (which is why picking a
   * colour with a different label width appeared to work, and picking one with
   * the same width did not).
   */
  override getSize(): Blockly.utils.Size {
    this.render_();
    return new Blockly.utils.Size(this.size_.width || 100, PILL_HEIGHT);
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.updateShapes();
  }

  override applyColour(): void {
    super.applyColour();
    this.updateShapes();
  }

  /**
   * Paints the pill, the swatch, the label and the arrow.
   *
   * This cannot lean on Blockly's own measurements. A dropdown whose label is
   * empty gets `width="0"` written onto its border rect, and its `<text>` is
   * left with no content and no `blocklyDropdownText` class — so reading the
   * rect width or querying for that class both come back empty and the pill
   * collapses to a circle. Instead the label is written here and the width is
   * derived from the swatch, the measured label and the arrow.
   */
  private updateShapes(): void {
    if (!this.swatchRect) {
      return;
    }

    const root = this.getSvgRoot();
    if (!root) {
      return;
    }

    const label = this.getText_() ?? "";
    const text = root.querySelector<SVGTextElement>("text");
    if (text) {
      if (text.textContent !== label) {
        text.textContent = label;
      }
      // `blockimg.css` gives `.blocklyEditableText > text` a dark fill and
      // `.blocklyDropdownText` a white one with !important. Without this class
      // the label renders #575E75 on the coloured pill.
      text.classList.add("blocklyDropdownText");
      text.setAttribute("x", String(TEXT_X));
      text.setAttribute("y", String(PILL_HEIGHT / 2));
      text.setAttribute("dominant-baseline", "central");
    }

    // Measure the label now that it has content. Fall back to a rough estimate
    // when the field is not yet in the document (getComputedTextLength throws).
    let labelWidth = 0;
    try {
      labelWidth = text?.getComputedTextLength() ?? 0;
    } catch {
      labelWidth = label.length * 7;
    }
    if (!labelWidth) {
      labelWidth = label.length * 7;
    }

    const width = Math.max(
      MIN_PILL_WIDTH,
      TEXT_X + labelWidth + ARROW_GAP + ARROW_WIDTH + PILL_RIGHT_PADDING,
    );
    // Clamp so a short label never produces a negative horizontal run.
    const innerWidth = Math.max(0, width - 2 * PILL_RADIUS);
    const { fill, stroke } = getFieldColours(this.sourceBlock_);

    if (!this.noWrapper && this.pillPath) {
      this.pillPath.setAttribute(
        "d",
        `M ${PILL_RADIUS},0 h ${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},${PILL_RADIUS} V ${PILL_HEIGHT} h -${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},-${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},-${PILL_RADIUS} z`,
      );
      this.pillPath.setAttribute("fill", fill);
      this.pillPath.setAttribute("stroke", stroke);
    }

    // `getValue()` is the hex string from the option pair, e.g. "#ff0000".
    this.swatchRect.style.setProperty(
      "fill",
      String(this.getValue()),
      "important",
    );

    // The arrow is the second <image>; the first is Blockly's hidden spacer.
    // Centre it vertically and pin it to the right edge.
    const arrow = root.querySelectorAll("image").item(1);
    arrow?.setAttribute(
      "transform",
      `translate(${width - ARROW_WIDTH - PILL_RIGHT_PADDING},${(PILL_HEIGHT - ARROW_HEIGHT) / 2})`,
    );

    // Keep size_ in step so the block's path grows with the pill.
    this.size_.width = width;
    this.size_.height = PILL_HEIGHT;
  }
}
