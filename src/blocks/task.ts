import * as Blockly from "blockly";

Blockly.Blocks["pybricks_task"] = {
  init() {
    this.jsonInit({
      type: "pybricks_task",
      message0: "task %1(%2)",
      args0: [
        { type: "field_input", name: "NAME", text: "run1" },
        { type: "field_input", name: "PARAMS", text: "" },
      ],
      message1: "%1",
      args1: [{ type: "input_statement", name: "BODY" }],
      colour: "#9a72a2",
      nextStatement: null,
    });
  },
};
