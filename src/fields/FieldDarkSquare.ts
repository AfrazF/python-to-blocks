import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";

export class FieldDarkSquare extends Blockly.FieldDropdown {
  private squareRect?: SVGRectElement;
  private defaultRect?: SVGRectElement;

  static override fromJson(
    options: Parameters<typeof Blockly.FieldDropdown.fromJson>[0],
  ): FieldDarkSquare {
    if (!options.options) {
      throw new TypeError("FieldDarkSquare requires dropdown options.");
    }
    return new FieldDarkSquare(options.options);
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

    this.squareRect = document.createElementNS(SVG_NS, "rect");
    this.squareRect.classList.add("blocklyDropdownRect");
    root.insertBefore(this.squareRect, root.firstChild);
    this.updateSquare();
  }

  override getSize(): Blockly.utils.Size {
    const size = super.getSize();
    return new Blockly.utils.Size(size.width, 32.2);
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.updateSquare();
  }

  override applyColour(): void {
    super.applyColour();
    this.updateSquare();
  }

  private updateSquare(): void {
    if (!this.squareRect) {
      return;
    }

    const { stroke } = getFieldColours(this.sourceBlock_);

    const defaultRect = this.defaultRect;
    this.squareRect.setAttribute("x", defaultRect?.getAttribute("x") ?? "0");
    this.squareRect.setAttribute("y", defaultRect?.getAttribute("y") ?? "0");
    this.squareRect.setAttribute(
      "width",
      defaultRect?.getAttribute("width") ?? "0",
    );
    this.squareRect.setAttribute("height", "32.2");
    this.squareRect.setAttribute("rx", "4");
    this.squareRect.setAttribute("fill", "transparent");
    this.squareRect.setAttribute("stroke", stroke);
    if (this.textElement_) {
      this.textElement_.style.fill = "#ffffff";
      this.textElement_.setAttribute("y", "16.1");
    }
  }
}
