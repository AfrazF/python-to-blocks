import * as Blockly from "blockly";

Blockly.Blocks["pybricks_for"] = {
  init() {
    this.jsonInit({
      type: "pybricks_for",
      message0: "for %1 in %2 do",
      args0: [
        { type: "field_input", name: "LOOP_VAR", text: "i" },
        { type: "field_input", name: "ITERABLE", text: "" },
      ],
      message1: "%1",
      args1: [{ type: "input_statement", name: "BODY" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
