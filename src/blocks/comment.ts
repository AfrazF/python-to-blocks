import * as Blockly from "blockly";

Blockly.Blocks["pybricks_comment"] = {
  init() {
    this.jsonInit({
      type: "pybricks_comment",
      message0: "%1",
      args0: [{ type: "field_input", name: "TEXT", text: "" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#bfbfbf",
      colourSecondary: "#8f8f8f",
      colourTertiary: "#8f8f8f",
    });
  },
};
