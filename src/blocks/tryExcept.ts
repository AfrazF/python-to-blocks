import * as Blockly from "blockly";

Blockly.Blocks["pybricks_try_except"] = {
  init() {
    this.jsonInit({
      type: "pybricks_try_except",
      message0: "try",
      args0: [],
      message1: "%1",
      args1: [{ type: "input_statement", name: "TRY" }],
      message2: "except %1 as %2",
      args2: [
        { type: "field_input", name: "EXCEPTION", text: "Exception" },
        { type: "field_input", name: "AS_NAME", text: "" },
      ],
      message3: "%1",
      args3: [{ type: "input_statement", name: "EXCEPT" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
