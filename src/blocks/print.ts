import * as Blockly from "blockly";
import { FieldQuotedTextInPill } from "../fields/FieldQuotedTextInPill";

/**
 * Print block (Step v2b.2c.a).
 *
 * Pybricks draws this as `terminal | print ( " [abc] " )` — a leading icon and
 * divider, the static label `print`, then a darker-blue pill holding a curly
 * open quote, a white text field and a curly close quote. Verified against
 * `docs/pybricks-blocks/output/pybricks_blockPrint_print_basic.svg`.
 *
 * The trailing chevron in the reference SVG is the multi-argument affordance;
 * multi-arg print is deferred, so this block has no chevron.
 *
 * The pill is a `FieldQuotedTextInPill`: the quotes are part of the field's
 * render, not configurable prefix/suffix text, and the stored value is the raw
 * string with no quotes. See `docs/FIELD_DESIGN.md`.
 *
 * Colour is Output blue (`#4c97ff`).
 */
Blockly.Blocks["pybricks_print"] = {
  init() {
    this.appendDummyInput("PRINT_ROW")
      .appendField("terminal |")
      .appendField("print")
      .appendField(new FieldQuotedTextInPill(""), "TEXT");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4c97ff");
  },
};
