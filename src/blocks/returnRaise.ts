import * as Blockly from "blockly";

Blockly.Blocks["pybricks_return"] = {
  init() {
    this.jsonInit({
      type: "pybricks_return",
      message0: "return %1",
      args0: [{ type: "field_input", name: "VALUE", text: "" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};

Blockly.Blocks["pybricks_raise"] = {
  init() {
    this.jsonInit({
      type: "pybricks_raise",
      message0: "raise %1",
      args0: [{ type: "field_input", name: "VALUE", text: "" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#ffab19",
    });
  },
};
