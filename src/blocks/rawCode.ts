import * as Blockly from "blockly";

Blockly.Blocks["pybricks_raw_code"] = {
  init() {
    this.jsonInit({
      type: "pybricks_raw_code",
      message0: "%1",
      args0: [{ type: "field_input", name: "CODE", text: "" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#6b7280",
    });
  },
};
