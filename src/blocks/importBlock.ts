import * as Blockly from "blockly";

Blockly.Blocks["pybricks_import"] = {
  init() {
    this.jsonInit({
      type: "pybricks_import",
      message0: "from %1 import %2",
      args0: [
        { type: "field_input", name: "MODULE", text: "" },
        { type: "field_input", name: "NAME", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};

Blockly.Blocks["pybricks_import_as"] = {
  init() {
    this.jsonInit({
      type: "pybricks_import_as",
      message0: "from %1 import %2 as %3",
      args0: [
        { type: "field_input", name: "MODULE", text: "" },
        { type: "field_input", name: "NAME", text: "" },
        { type: "field_input", name: "ALIAS", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#ff6680",
    });
  },
};
