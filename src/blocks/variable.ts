import * as Blockly from "blockly";

Blockly.Blocks["pybricks_var_declare"] = {
  init() {
    this.jsonInit({
      type: "pybricks_var_declare",
      message0: "create variable %1 = %2",
      args0: [
        { type: "field_input", name: "NAME", text: "" },
        { type: "field_input", name: "VALUE", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};

Blockly.Blocks["pybricks_var_set"] = {
  init() {
    this.jsonInit({
      type: "pybricks_var_set",
      message0: "set %1 to %2",
      args0: [
        { type: "field_input", name: "NAME", text: "" },
        { type: "field_input", name: "VALUE", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};
