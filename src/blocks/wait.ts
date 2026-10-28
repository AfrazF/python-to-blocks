import * as Blockly from "blockly";

// Pybricks draws this block as `wait (1000) ms` — the number sits in a pill and
// `ms` is a separate static label after it (verified against
// `docs/pybricks-blocks/flow/pybricks_blockWaitTime.svg`). v1.75.5 ships a plain
// `field_input`; v2b.2b converts it to the pill-with-white-square shape plus the
// `ms` suffix, following the recipe in `docs/FIELD_DESIGN.md`.
Blockly.Blocks["pybricks_wait"] = {
  init() {
    this.jsonInit({
      type: "pybricks_wait",
      message0: "wait %1 ms",
      args0: [{ type: "field_input", name: "TIME", text: "0" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
