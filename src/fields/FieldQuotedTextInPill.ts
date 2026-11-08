import * as Blockly from "blockly";
import { getFieldColours } from "./colourUtils";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Geometry taken from
 * `docs/pybricks-blocks/output/pybricks_blockPrint_print_basic.svg` and
 * `docs/pybricks-blocks/output/drivebase/pybricks_blockDriveBaseConfigure_drivebase_straight_acceleration.svg`.
 *
 * The pill is 37.2 tall with an 18.6 radius. The white rect sits at x=12, y=4
 * and is 29.2 tall, so it is inset 4 from the pill's top and bottom. The text
 * baseline is 14.6 from the rect's top, which is the same inset
 * `FieldWhiteInPill` uses.
 */
const PILL_HEIGHT = 37.2;
const PILL_RADIUS = 18.6;
const RECT_Y = 4;
const RECT_HEIGHT = 29.2;
const RECT_RADIUS = 4;
const TEXT_INSET_X = 8;
const TEXT_BASELINE_Y = 14.6;
/** Gap between a quote glyph and the white rect. */
const QUOTE_GAP = 8;
/** Padding between the pill's left edge and the open quote. */
const PILL_LEFT_PADDING = 12;
/** Padding between the close quote and the pill's right edge. */
const PILL_RIGHT_PADDING = 12;
/** Minimum white-rect width so an empty field is still clickable. */
const MIN_RECT_WIDTH = 24;
/**
 * Quote glyph size. The reference SVG draws the quotes as 12x12px images, but a
 * curly-quote glyph only fills a fraction of its em box, so a 12px font renders
 * far smaller than the 12px image. 24px makes the glyph's ink roughly match the
 * reference image height.
 */
const QUOTE_FONT_SIZE = 24;
const QUOTE_OPEN = "\u201C";
const QUOTE_CLOSE = "\u201D";

/**
 * A white text field wrapped in a darker pill with a curly quote on each side:
 * `( " [abc] " )`. Used by the print block, where the quotes are part of the
 * block's appearance rather than part of the stored value.
 *
 * This is deliberately NOT a subclass of `FieldWhiteInPill`. That field is a
 * `FieldNumber` with an optional suffix and no prefix; print needs free text
 * and quotes on both sides. Keeping the two separate means the numeric
 * white-in-pill fields keep their existing layout untouched.
 *
 * `getValue()` returns the raw string with no quotes. `setValue()` accepts any
 * string. The quotes are drawn, never stored.
 */
export class FieldQuotedTextInPill extends Blockly.FieldTextInput {
  private outerPath?: SVGPathElement;
  private innerRect?: SVGRectElement;
  private openQuote?: SVGTextElement;
  private closeQuote?: SVGTextElement;
  private defaultRect?: SVGRectElement;
  /**
   * Width Blockly last wrote to the field. `updateShapes()` overwrites the
   * default rect, so it must read the width from here instead of from the rect
   * itself or repeated calls (applyColour, initView) would shrink it.
   */
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
    this.openQuote = this.createQuote(QUOTE_OPEN);
    this.closeQuote = this.createQuote(QUOTE_CLOSE);

    root.insertBefore(this.outerPath, root.firstChild);
    root.insertBefore(this.innerRect, this.outerPath.nextSibling);
    root.appendChild(this.openQuote);
    root.appendChild(this.closeQuote);
    this.updateShapes();
  }

  private createQuote(glyph: string): SVGTextElement {
    const text = document.createElementNS(SVG_NS, "text");
    text.classList.add("blocklyText");
    text.setAttribute("dominant-baseline", "middle");
    text.style.fill = "#ffffff";
    text.style.pointerEvents = "none";
    text.style.fontSize = `${QUOTE_FONT_SIZE}px`;
    text.textContent = glyph;
    return text;
  }

  protected override getClickTarget_(): Element | null {
    return this.innerRect ?? super.getClickTarget_();
  }

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin);
    // Left side: PILL_LEFT_PADDING, then the open quote, then QUOTE_GAP.
    // Right side: QUOTE_GAP, then the close quote, then PILL_RIGHT_PADDING.
    // Both sides are symmetric, so the pill looks balanced around the rect.
    const quoteSpace = this.quoteSpace();
    this.size_.width += PILL_LEFT_PADDING + PILL_RIGHT_PADDING + quoteSpace;
    this.size_.height = PILL_HEIGHT;
  }

  override getSize(): Blockly.utils.Size {
    const size = super.getSize();
    return new Blockly.utils.Size(size.width, PILL_HEIGHT);
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

  /** Width taken by both quote glyphs plus their gaps. */
  private quoteSpace(): number {
    const open = this.openQuote?.getComputedTextLength() ?? 0;
    const close = this.closeQuote?.getComputedTextLength() ?? 0;
    return open + close + 2 * QUOTE_GAP;
  }

  private updateShapes(): void {
    if (
      !this.outerPath ||
      !this.innerRect ||
      !this.openQuote ||
      !this.closeQuote
    ) {
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

    const openWidth = this.openQuote.getComputedTextLength();
    const closeWidth = this.closeQuote.getComputedTextLength();
    const quoteSpace = openWidth + closeWidth + 2 * QUOTE_GAP;
    // baseWidth already includes the pill padding and the quotes, because
    // updateSize_ added them to size_. Subtract them back out to get the width
    // of just the white rect.
    const addedPadding = PILL_LEFT_PADDING + PILL_RIGHT_PADDING + quoteSpace;
    const rectWidth = Math.max(MIN_RECT_WIDTH, this.baseWidth - addedPadding);
    const outerWidth =
      PILL_LEFT_PADDING +
      openWidth +
      QUOTE_GAP +
      rectWidth +
      QUOTE_GAP +
      closeWidth +
      PILL_RIGHT_PADDING;
    const innerWidth = Math.max(0, outerWidth - 2 * PILL_RADIUS);
    const { fill, stroke } = getFieldColours(this.sourceBlock_);

    this.outerPath.setAttribute(
      "d",
      `M ${PILL_RADIUS},0 h ${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},${PILL_RADIUS} V ${PILL_HEIGHT} h -${innerWidth} a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 -${PILL_RADIUS},-${PILL_RADIUS} v 0 a ${PILL_RADIUS} ${PILL_RADIUS} 0 0,1 ${PILL_RADIUS},-${PILL_RADIUS} z`,
    );
    this.outerPath.setAttribute("fill", fill);
    this.outerPath.setAttribute("stroke", stroke);
    // The pill is decorative: let the pointer through to the white rect.
    this.outerPath.style.pointerEvents = "none";

    // Left side mirrors the right: PILL_LEFT_PADDING, open quote, gap, rect.
    const rectX = PILL_LEFT_PADDING + openWidth + QUOTE_GAP;
    this.innerRect.setAttribute("x", String(rectX));
    this.innerRect.setAttribute("y", String(RECT_Y));
    this.innerRect.setAttribute("width", String(rectWidth));
    this.innerRect.setAttribute("height", String(RECT_HEIGHT));
    this.innerRect.setAttribute("rx", String(RECT_RADIUS));
    this.innerRect.setAttribute("fill", "#ffffff");
    this.innerRect.setAttribute("stroke", stroke);
    this.innerRect.style.cursor = "text";
    // Blockly positions the HTML input editor from the hidden defaultRect, so it
    // must track the visible inner rect exactly or the editor lands offset.
    if (this.defaultRect) {
      this.defaultRect.setAttribute("x", String(rectX));
      this.defaultRect.setAttribute("y", String(RECT_Y));
      this.defaultRect.setAttribute("width", String(rectWidth));
      this.defaultRect.setAttribute("height", String(RECT_HEIGHT));
      this.defaultRect.style.visibility = "hidden";
    }

    text?.setAttribute("x", String(rectX + TEXT_INSET_X));
    text?.setAttribute("y", String(RECT_Y + TEXT_BASELINE_Y));
    this.openQuote.setAttribute("x", String(PILL_LEFT_PADDING));
    this.openQuote.setAttribute("y", String(RECT_Y + TEXT_BASELINE_Y));
    this.closeQuote.setAttribute("x", String(rectX + rectWidth + QUOTE_GAP));
    this.closeQuote.setAttribute("y", String(RECT_Y + TEXT_BASELINE_Y));
  }
}
