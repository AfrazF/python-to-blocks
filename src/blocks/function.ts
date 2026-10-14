import * as Blockly from "blockly";

Blockly.Blocks["pybricks_function"] = {
  init() {
    this.jsonInit({
      type: "pybricks_function",
      message0: "function %1(%2)",
      args0: [
        { type: "field_input", name: "NAME", text: "normal" },
        { type: "field_input", name: "PARAMS", text: "" },
      ],
      message1: "%1",
      args1: [{ type: "input_statement", name: "BODY" }],
      colour: "#ff6680",
      nextStatement: null,
    });
  },
};
