import * as Blockly from "blockly";

Blockly.Blocks["pybricks_if"] = {
  init() {
    this.jsonInit({
      type: "pybricks_if",
      message0: "if %1 then",
      args0: [{ type: "field_input", name: "CONDITION", text: "True" }],
      message1: "%1",
      args1: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};

Blockly.Blocks["pybricks_if_else"] = {
  init() {
    this.jsonInit({
      type: "pybricks_if_else",
      message0: "if %1 then",
      args0: [{ type: "field_input", name: "CONDITION", text: "True" }],
      message1: "%1",
      args1: [{ type: "input_statement", name: "DO" }],
      message2: "else",
      message3: "%1",
      args3: [{ type: "input_statement", name: "ELSE" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
