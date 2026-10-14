import * as Blockly from "blockly";

Blockly.Blocks["pybricks_await"] = {
  init() {
    this.jsonInit({
      type: "pybricks_await",
      message0: "await %1",
      args0: [{ type: "input_statement", name: "INNER" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#9a72a2",
    });
  },
};
