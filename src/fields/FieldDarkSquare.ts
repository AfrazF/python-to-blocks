import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";

export class FieldDarkSquare extends Blockly.FieldTextInput {
  private squareRect?: SVGRectElement;
  private defaultRect?: SVGRectElement;
  /**
   * `white` draws a white square with dark text instead of the darker
   * block-coloured square with white text. Used where the value is free text
   * the user must read clearly — the hub display `ICON` field, whose icons are
   * project-defined names rather than a fixed enum.
   */
  private white = false;

  /**
   * The palette is hardcoded, so the JSON config carries no `options`.
   * `FieldTextInput.fromJson` would build a plain field, so bypass it to read
   * the `white` flag.
   */
  static override fromJson(config: Record<string, unknown>): FieldDarkSquare {
    const field = new FieldDarkSquare();
    field.white = config.white === true;
    return field;
  }

  override initView(): void {
    super.initView();
    const root = this.getSvgRoot();
    if (!root) return;
    root.classList.add("pybricks-custom-field");
    this.defaultRect = root.querySelector("rect") ?? undefined;
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.squareRect = document.createElementNS(SVG_NS, "rect");
    root.insertBefore(this.squareRect, root.firstChild);
    this.updateSquare();
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.textElement_?.style.setProperty(
      "fill",
      this.white ? "#575e75" : "#ffffff",
      "important",
    );
    this.updateSquare();
  }

  override applyColour(): void {
    super.applyColour();
    this.updateSquare();
  }

  private updateSquare(): void {
    if (!this.squareRect) return;
    const { fill, stroke } = getFieldColours(this.sourceBlock_);
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
    this.squareRect.style.setProperty(
      "fill",
      this.white ? "#ffffff" : fill,
      "important",
    );
    this.squareRect.style.setProperty("stroke", stroke, "important");
  }
}
