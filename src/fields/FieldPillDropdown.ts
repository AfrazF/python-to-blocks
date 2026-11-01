import * as Blockly from "blockly";

const SVG_NS = "http://www.w3.org/2000/svg";

export class FieldPillDropdown extends Blockly.FieldDropdown {
  private pillPath?: SVGPathElement;
  private defaultRect?: SVGRectElement;
  private dropdownText?: SVGTextElement;

  override initView(): void {
    super.initView();
    const root = this.getSvgRoot();
    if (!root) {
      return;
    }
    root.classList.add("pybricks-custom-field");
    this.defaultRect = root.querySelector("rect") ?? undefined;
    this.dropdownText =
      root.querySelector("text.blocklyDropdownText") ?? undefined;
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }

    this.pillPath = document.createElementNS(SVG_NS, "path");
    root.insertBefore(this.pillPath, root.firstChild);
    root.style.fill = "#ffffff";
    this.updatePill();
  }

  protected override render_(): void {
    super.render_();
    if (this.defaultRect) {
      this.defaultRect.style.visibility = "hidden";
    }
    this.updatePill();
  }

  private updatePill(): void {
    if (!this.pillPath) {
      return;
    }

    const x = Number(this.defaultRect?.getAttribute("x") ?? 0);
    const width = Number(this.defaultRect?.getAttribute("width") ?? 0) + 8;
    const radius = 16;
    const pillHeight = 32;
    this.pillPath.setAttribute(
      "d",
      `M ${x + radius} 0 H ${x + width - radius} A ${radius} ${radius} 0 0 1 ${x + width - radius} ${pillHeight} H ${x + radius} A ${radius} ${radius} 0 0 1 ${x + radius} 0 Z`,
    );
    this.pillPath.setAttribute("fill", "#4180d9");
    this.pillPath.setAttribute("stroke", "#3971bf");
    this.dropdownText?.setAttribute("x", "12");
    this.dropdownText?.setAttribute("y", "16");
  }
}
