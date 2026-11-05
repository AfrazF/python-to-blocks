import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 32;
const PILL_RADIUS = 16;

// Swatch geometry, taken from the Pybricks reference SVG
// (docs/pybricks-blocks/hub/pybricks_variables_get_color.svg).
const SWATCH_X = 12;
const SWATCH_Y = 5.33;
const SWATCH_WIDTH = 26.67;
const SWATCH_HEIGHT = 21.33;
const SWATCH_STROKE = "#4585a1";
// Where the dropdown label starts, so it clears the swatch.
const TEXT_X = 46.67;
// Arrow geometry and the gap between the label and it.
const ARROW_WIDTH = 12;
const ARROW_HEIGHT = 8.79;
const ARROW_GAP = 8;
const PILL_RIGHT_PADDING = 12;
// Floor so a one-letter label still reads as a pill, not a circle.
const MIN_PILL_WIDTH = 88;

/** The Pybricks colour palette: label shown in the pill, hex stored as value. */
const COLOURS: [string, string][] = [
  ["red", "#ff0000"],
  ["orange", "#ff8000"],
  ["yellow", "#ffff00"],
  ["green", "#00ff00"],
  ["cyan", "#00ffff"],
  ["blue", "#0000ff"],
  ["violet", "#7f00ff"],
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
 * The label text and the dropdown arrow are Blockly's own; only their position
 * is adjusted so the text clears the swatch.
 */
export class FieldColourPill extends Blockly.FieldDropdown {
  private pillPath?: SVGPathElement;
  private swatchRect?: SVGRectElement;
  private defaultRect?: SVGRectElement;

  constructor() {
    super(COLOURS);
  }

  /**
   * The palette is hardcoded in the constructor, so the JSON config carries no
   * `options`. `FieldDropdown.fromJson` requires them and throws otherwise, so
   * bypass it entirely.
   */
  static override fromJson(_config: Record<string, unknown>): FieldColourPill {
    return new FieldColourPill();
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

    root.insertBefore(this.pillPath, root.firstChild);
    root.insertBefore(this.swatchRect, this.pillPath.nextSibling);
    root.style.fill = "#ffffff";
    this.updateShapes();
  }

  override getSize(): Blockly.utils.Size {
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
    if (!this.pillPath || !this.swatchRect) {
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

    this.pillPath.setAttribute(
      "d",
      `M ${PILL_RADIUS},0 h ${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},${PILL_RADIUS} V ${PILL_HEIGHT} h -${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},-${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},-${PILL_RADIUS} z`,
    );
    this.pillPath.setAttribute("fill", fill);
    this.pillPath.setAttribute("stroke", stroke);

    // `getValue()` is the hex string from the option pair, e.g. "#ff0000".
    this.swatchRect.style.setProperty(
      "fill",
      String(this.getValue()),
      "important",
    );

    // The arrow is the second <image>; the first is Blockly's hidden spacer.
    const arrow = root.querySelectorAll("image").item(1);
    arrow?.setAttribute(
      "transform",
      `translate(${width - PILL_RIGHT_PADDING - ARROW_WIDTH},${(PILL_HEIGHT - ARROW_HEIGHT) / 2})`,
    );

    // Keep size_ in step so the block's path grows with the pill.
    this.size_.width = width;
    this.size_.height = PILL_HEIGHT;
  }
}
