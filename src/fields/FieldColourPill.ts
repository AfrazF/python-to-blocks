import * as Blockly from "blockly";
import { COLOUR_MAP, getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 32;
const PILL_RADIUS = 16;

// Swatch geometry, taken from the Pybricks reference SVGs:
//
// - `hub/pybricks_blockLightOnColor_primehub_on.svg` — pill `m 16,0 h 71.5651
//   … V 32` (103.57 × 32, radius 16), swatch group `translate(12, 5.3333)`,
//   text group `translate(46.6667, 7)`.
// - `hub/pybricks_variables_get_color.svg` — block `m 20,0 h 63.5651 … V 40`
//   (103.57 × 40, radius 20), swatch group `translate(12, 9.3333)`, text group
//   `translate(46.6667, 11)`.
//
// In BOTH references the swatch sits 12px in from the pill's left edge and the
// text starts at 46.6667. The pill path is drawn inside this field's own group
// starting at x=0, so those are the numbers to use verbatim — the field group's
// own `translate(12, 4)` is outside the pill and must not be subtracted.
//
// Putting the swatch at x=0 (as an earlier revision did) leaves its square
// corners outside the pill's rounded left edge, which is the clipping bug.
const SWATCH_X = 12;
const SWATCH_Y = 5.33;
const SWATCH_WIDTH = 26.67;
const SWATCH_HEIGHT = 21.33;
// Where the dropdown label starts, so it clears the swatch.
const TEXT_X = 46.67;
// Arrow geometry and the gap between the label and it.
const ARROW_WIDTH = 12;
const ARROW_HEIGHT = 8.79;
const ARROW_GAP = 8;
const PILL_RIGHT_PADDING = 12;
// Floor so a short label still reads as a pill, not a circle. The reference
// pill is 103.57 wide; this floor reproduces that for the shortest labels and
// lets longer ones grow from the measured text width.
const MIN_PILL_WIDTH = 104;

/**
 * The Pybricks colour palette: label shown in the pill, hex stored as value.
 *
 * The hexes live in `COLOUR_MAP` (`colourUtils.ts`) so the hub light walker can
 * validate `Color.<NAME>` against the same table. Here the labels are
 * lowercased, matching the reference SVG (`red`, not `RED`).
 */
const COLOURS: [string, string][] = Object.entries(COLOUR_MAP).map(
  ([name, hex]) => [name.toLowerCase(), hex],
);

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
  /**
   * Enum mode: name → hex. When set, the field stores the *name* (`"RED"`)
   * instead of the hex, and the swatch is painted from this table. Undefined
   * keeps the original hex-storing behaviour used by `pybricks_colour`.
   */
  private enumMap?: Record<string, string>;

  constructor(enumMap?: Record<string, string>) {
    // Enum mode: the popup shows the lowercase label (`red`) but stores the
    // uppercase name (`RED`), matching Pybricks' rendering and Python's
    // `Color.RED`.
    super(
      enumMap
        ? Object.keys(enumMap).map((name) => [name.toLowerCase(), name])
        : COLOURS,
    );
    this.enumMap = enumMap;
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
    if (this.enumMap) {
      // Enum mode stores the uppercase name (`"RED"`) so codegen can emit
      // `Color.RED`, but Pybricks renders the label lowercase (`red`) — see
      // `docs/pybricks-blocks/hub/pybricks_blockLightOnColor_primehub_on.svg`.
      return String(value ?? "").toLowerCase();
    }
    const match = COLOURS.find(([, hex]) => hex === value);
    return match ? match[0] : String(value ?? "");
  }

  /** The hex to paint the swatch with, for either storage mode. */
  private swatchColour(): string {
    const value = String(this.getValue() ?? "");
    if (this.enumMap) {
      return this.enumMap[value] ?? Object.values(this.enumMap)[0] ?? "#000000";
    }
    return value;
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
    // The stroke is set in `updateShapes()` from the block colour — a literal
    // here would pin every swatch to the reference SVG's blue.
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

    // Hex mode: `getValue()` is the hex from the option pair, e.g. "#ff0000".
    // Enum mode: `getValue()` is the name, so the hex comes from `enumMap`.
    this.swatchRect.style.setProperty("fill", this.swatchColour(), "important");
    // The swatch outline follows the block colour like every other field
    // border (block × 0.75), not the reference SVG's fixed blue.
    this.swatchRect.setAttribute("stroke", stroke);

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
