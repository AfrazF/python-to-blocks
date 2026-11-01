import * as Blockly from "blockly";

const SVG_NS = "http://www.w3.org/2000/svg";

export class FieldDarkSquare extends Blockly.FieldTextInput {
  private squareRect?: SVGRectElement;
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

    this.squareRect = document.createElementNS(SVG_NS, "rect");
    root.insertBefore(this.squareRect, root.firstChild);
    root.style.fill = "#ffffff";
    this.updateSquare();
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.updateSquare();
  }

  private updateSquare(): void {
    if (!this.squareRect) {
      return;
    }

    this.squareRect.setAttribute(
      "x",
      this.defaultRect?.getAttribute("x") ?? "-4",
    );
    this.squareRect.setAttribute(
      "y",
      this.defaultRect?.getAttribute("y") ?? "-8",
    );
    this.squareRect.setAttribute(
      "width",
      this.defaultRect?.getAttribute("width") ?? "0",
    );
    this.squareRect.setAttribute(
      "height",
      this.defaultRect?.getAttribute("height") ?? "16",
    );
    this.squareRect.setAttribute("rx", "4");
    this.squareRect.setAttribute("fill", "#4180d9");
    this.squareRect.setAttribute("stroke", "#3971bf");
  }
}
