import * as Blockly from "blockly";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 40.2;
const PILL_RADIUS = PILL_HEIGHT / 2;
const INPUT_X = 12;
const INPUT_Y = 4;
const INPUT_HEIGHT = 32.2;
const INPUT_TEXT_X = 8;
const INPUT_TEXT_Y = INPUT_HEIGHT / 2;
const SUFFIX_GAP = 8;
const PILL_RIGHT_PADDING = 12;

export class FieldWhiteInPill extends Blockly.FieldTextInput {
  private suffix = "";
  private outerPath?: SVGPathElement;
  private innerRect?: SVGRectElement;
  private suffixText?: SVGTextElement;
  private defaultRect?: SVGRectElement;

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

    this.outerPath = document.createElementNS(SVG_NS, "path");
    this.innerRect = document.createElementNS(SVG_NS, "rect");
    this.suffixText = document.createElementNS(SVG_NS, "text");
    this.suffixText.setAttribute("dominant-baseline", "middle");
    this.suffixText.style.fill = "#ffffff";
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

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin);
    this.size_.width +=
      INPUT_X +
      PILL_RIGHT_PADDING +
      (this.suffixText && this.suffix
        ? this.suffixText.getComputedTextLength() + SUFFIX_GAP
        : 0);
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
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
    const text = root.querySelector<SVGTextElement>("text:not(:last-child)");
    const width = Number(this.defaultRect?.getAttribute("width") ?? 0);
    const suffixWidth = this.suffix
      ? this.suffixText.getComputedTextLength()
      : 0;
    const suffixSpace = this.suffix ? SUFFIX_GAP + suffixWidth : 0;
    const outerWidth = INPUT_X + width + suffixSpace + PILL_RIGHT_PADDING;

    this.outerPath.setAttribute(
      "d",
      `M ${PILL_RADIUS} 0 H ${outerWidth - PILL_RADIUS} A ${PILL_RADIUS} ${PILL_RADIUS} 0 0 1 ${outerWidth - PILL_RADIUS} ${PILL_HEIGHT} H ${PILL_RADIUS} A ${PILL_RADIUS} ${PILL_RADIUS} 0 0 1 ${PILL_RADIUS} 0 Z`,
    );
    this.outerPath.setAttribute("fill", "#4180d9");
    this.outerPath.setAttribute("stroke", "#3971bf");
    this.innerRect.setAttribute("x", String(INPUT_X));
    this.innerRect.setAttribute("y", String(INPUT_Y));
    this.innerRect.setAttribute("width", String(width));
    this.innerRect.setAttribute("height", String(INPUT_HEIGHT));
    this.innerRect.setAttribute("rx", "4");
    this.innerRect.setAttribute("fill", "#ffffff");
    this.innerRect.setAttribute("stroke", "#3971bf");

    text?.setAttribute("x", String(INPUT_X + INPUT_TEXT_X));
    text?.setAttribute("y", String(INPUT_Y + INPUT_TEXT_Y));
    this.suffixText.setAttribute("x", String(INPUT_X + width + SUFFIX_GAP));
    this.suffixText.setAttribute("y", String(INPUT_Y + INPUT_TEXT_Y));
  }
}
