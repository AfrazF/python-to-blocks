import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";
const PILL_HEIGHT = 32;
const PILL_RADIUS = 16;
const PILL_EXTRA_WIDTH = 7.78947448730469;

export class FieldPillDropdown extends Blockly.FieldDropdown {
  private pillPath?: SVGPathElement;
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

    this.pillPath = document.createElementNS(SVG_NS, "path");
    root.insertBefore(this.pillPath, root.firstChild);
    root.style.fill = "#ffffff";
    this.updatePill();
  }

  override getSize(): Blockly.utils.Size {
    const size = super.getSize();
    const rect = this.getSvgRoot()?.querySelector<SVGRectElement>(
      "rect.blocklyDropdownRect",
    );
    const width = Number(rect?.getAttribute("width") ?? size.width);
    return new Blockly.utils.Size(width + PILL_EXTRA_WIDTH, PILL_HEIGHT);
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.updatePill();
  }

  override applyColour(): void {
    super.applyColour();
    this.updatePill();
  }

  private updatePill(): void {
    if (!this.pillPath) {
      return;
    }

    const root = this.getSvgRoot();
    if (!root) {
      return;
    }
    const text = root.querySelector<SVGTextElement>("text.blocklyDropdownText");
    const baseWidth = Number(this.defaultRect?.getAttribute("width") ?? 0);
    const width = baseWidth + PILL_EXTRA_WIDTH;
    const innerWidth = Math.max(0, width - 2 * PILL_RADIUS);
    const arrow = root.querySelectorAll("image").item(1);
    const { fill, stroke } = getFieldColours(this.sourceBlock_);
    this.pillPath.setAttribute(
      "d",
      `M ${PILL_RADIUS},0 h ${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},${PILL_RADIUS} V ${PILL_HEIGHT} h -${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},-${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},-${PILL_RADIUS} z`,
    );
    this.pillPath.setAttribute("fill", fill);
    this.pillPath.setAttribute("stroke", stroke);
    text?.setAttribute("x", "12");
    text?.setAttribute("y", "16");
    arrow?.setAttribute("transform", `translate(${width - 24},10)`);
  }
}
