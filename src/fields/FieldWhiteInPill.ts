import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 40.2;
const PILL_RADIUS = 20.1;
const INPUT_X = 12;
const INPUT_Y = 4;
const INPUT_HEIGHT = 32.2;
const INPUT_WIDTH_ADJUSTMENT = 0.3157901763916;
const INPUT_TEXT_X = 8;
const INPUT_TEXT_Y = 16.1;
const SUFFIX_GAP = 8;
const PILL_RIGHT_PADDING = 12;

export class FieldWhiteInPill extends Blockly.FieldNumber {
  private suffix = "";
  private outerPath?: SVGPathElement;
  private innerRect?: SVGRectElement;
  private suffixText?: SVGTextElement;
  private defaultRect?: SVGRectElement;
  // Width Blockly last wrote to defaultRect. updateShapes() overwrites that
  // rect, so it must read the width from here instead of from the rect itself
  // or repeated calls (applyColour, initView) would shrink it every time.
  private baseWidth = 0;

  override initView(): void {
    super.initView();
    const root = this.getSvgRoot();
    if (!root) {
      return;
    }
    root.classList.add("pybricks-custom-field");
    root.style.cursor = "default";
    this.defaultRect = root.querySelector("rect") ?? undefined;
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }

    this.outerPath = document.createElementNS(SVG_NS, "path");
    this.innerRect = document.createElementNS(SVG_NS, "rect");
    this.suffixText = document.createElementNS(SVG_NS, "text");
    this.suffixText.classList.add("blocklyText");
    this.suffixText.setAttribute("dominant-baseline", "middle");
    this.suffixText.style.fill = "#ffffff";
    this.suffixText.style.pointerEvents = "none";
    this.suffixText.textContent = this.suffix;

    root.insertBefore(this.outerPath, root.firstChild);
    root.insertBefore(this.innerRect, this.outerPath.nextSibling);
    root.appendChild(this.suffixText);
    this.updateShapes();
  }

  setSuffix(text: string): void {
    this.suffix = text;
    if (this.suffixText) {
      this.suffixText.textContent = text;
      this.forceRerender();
    }
  }

  protected override getClickTarget_(): Element | null {
    return this.innerRect ?? super.getClickTarget_();
  }

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin);
    this.size_.width +=
      INPUT_X +
      PILL_RIGHT_PADDING +
      (this.suffixText && this.suffix
        ? this.suffixText.getComputedTextLength() + SUFFIX_GAP
        : 0);
    this.size_.height = PILL_HEIGHT;
  }

  override getSize(): Blockly.utils.Size {
    const size = super.getSize();
    return new Blockly.utils.Size(
      size.width - INPUT_WIDTH_ADJUSTMENT,
      PILL_HEIGHT,
    );
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    // super.render_() -> positionBorderRect_() rewrites the rect from size_, so
    // this is the authoritative width. Reading it here (before updateShapes
    // overwrites the rect) keeps repeated renders from shrinking the field.
    this.baseWidth = this.size_.width;
    this.updateShapes();
  }

  override applyColour(): void {
    super.applyColour();
    this.updateShapes();
  }

  private updateShapes(): void {
    if (!this.outerPath || !this.innerRect || !this.suffixText) {
      return;
    }

    const root = this.getSvgRoot();
    if (!root) {
      return;
    }
    const text =
      this.textElement_ ??
      root.querySelector<SVGTextElement>("text:not(:last-child)");
    if (text) {
      text.style.pointerEvents = "none";
    }
    const defaultRect =
      root.querySelector<SVGRectElement>("rect.blocklyFieldRect") ??
      this.defaultRect;
    if (defaultRect && !this.baseWidth) {
      this.baseWidth = Number(defaultRect.getAttribute("width") ?? 0);
    }
    const suffixWidth = this.suffix
      ? this.suffixText.getComputedTextLength()
      : 0;
    const suffixSpace = this.suffix ? SUFFIX_GAP + suffixWidth : 0;
    // baseWidth already includes the pill padding and the suffix, because
    // updateSize_ added them to size_. Subtract them back out to get the width
    // of just the white square.
    const addedPadding = INPUT_X + PILL_RIGHT_PADDING + suffixSpace;
    const width = Math.max(0, this.baseWidth - addedPadding);
    const outerWidth = INPUT_X + width + suffixSpace + PILL_RIGHT_PADDING;
    // Before updateSize_ has run baseWidth can be 0, which makes
    // outerWidth - 2 * PILL_RADIUS negative. Clamp it so the path emits `h 0`
    // instead of `h --8.2`, which is an invalid SVG number.
    const innerWidth = Math.max(0, outerWidth - 2 * PILL_RADIUS);
    const { fill, stroke } = getFieldColours(this.sourceBlock_);

    this.outerPath.setAttribute(
      "d",
      `M ${PILL_RADIUS},0 h ${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},${PILL_RADIUS} V ${PILL_HEIGHT} h -${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},-${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},-${PILL_RADIUS} z`,
    );
    this.outerPath.setAttribute("fill", fill);
    this.outerPath.setAttribute("stroke", stroke);
    // The pill is decorative: let the pointer through to the white square.
    this.outerPath.style.pointerEvents = "none";
    this.innerRect.setAttribute("x", String(INPUT_X));
    this.innerRect.setAttribute("y", String(INPUT_Y));
    this.innerRect.setAttribute("width", String(width));
    this.innerRect.setAttribute("height", String(INPUT_HEIGHT));
    this.innerRect.setAttribute("rx", "4");
    this.innerRect.setAttribute("fill", "#ffffff");
    this.innerRect.setAttribute("stroke", stroke);
    this.innerRect.style.cursor = "text";
    // Blockly positions the HTML input editor from the hidden defaultRect, so it
    // must track the visible inner square exactly or the editor lands offset.
    if (this.defaultRect) {
      this.defaultRect.setAttribute("x", String(INPUT_X));
      this.defaultRect.setAttribute("y", String(INPUT_Y));
      this.defaultRect.setAttribute("width", String(width));
      this.defaultRect.setAttribute("height", String(INPUT_HEIGHT));
      this.defaultRect.style.visibility = "hidden";
    }

    text?.setAttribute("x", String(INPUT_X + INPUT_TEXT_X));
    text?.setAttribute("y", String(INPUT_Y + INPUT_TEXT_Y));
    this.suffixText.setAttribute("x", String(INPUT_X + width + SUFFIX_GAP));
    this.suffixText.setAttribute("y", String(INPUT_Y + INPUT_TEXT_Y));
  }
}
