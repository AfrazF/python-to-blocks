import * as Blockly from "blockly";
import { FieldWhiteInPill } from "../fields/FieldWhiteInPill";

// Pybricks draws this block as `{wait icon} | wait ([1000] ms)` — the number
// sits in a white square inside a darker pill, with `ms` as white text to its
// right, still inside the pill. Verified against
// `docs/pybricks-blocks/flow/pybricks_blockWaitTime.svg`.
//
// The leading icon and divider are text placeholders (`wait |`) until v2d.1
// ships real block icons. The `wait` after the divider is the block's own
// label — the placeholder and the label are two separate words, matching the
// reference SVG's icon-then-`wait` layout. The pill is a `FieldWhiteInPill`
// with the `ms` suffix, following `docs/FIELD_DESIGN.md`.
Blockly.Blocks["pybricks_wait"] = {
  init() {
    const time = new FieldWhiteInPill(0);
    time.setSuffix("ms");

    this.appendDummyInput("WAIT_ROW")
      .appendField("wait |")
      .appendField("wait")
      .appendField(time, "TIME");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#ffab19");
  },
};
