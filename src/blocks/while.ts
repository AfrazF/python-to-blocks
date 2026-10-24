import * as Blockly from "blockly";

Blockly.Blocks["pybricks_while"] = {
  init() {
    this.jsonInit({
      type: "pybricks_while",
      message0: "while %1 do",
      args0: [{ type: "field_input", name: "CONDITION", text: "True" }],
      message1: "%1",
      args1: [{ type: "input_statement", name: "BODY" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
