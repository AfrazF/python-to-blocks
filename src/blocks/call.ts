import * as Blockly from "blockly";

Blockly.Blocks["pybricks_call"] = {
  init() {
    this.jsonInit({
      type: "pybricks_call",
      message0: "%1(%2)",
      args0: [
        { type: "field_label", name: "NAME", text: "" },
        { type: "field_input", name: "ARGS", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};

Blockly.Blocks["pybricks_method_call"] = {
  init() {
    this.jsonInit({
      type: "pybricks_method_call",
      message0: "%1.%2(%3)",
      args0: [
        { type: "field_label", name: "OBJ", text: "" },
        { type: "field_label", name: "METHOD", text: "" },
        { type: "field_input", name: "ARGS", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};
