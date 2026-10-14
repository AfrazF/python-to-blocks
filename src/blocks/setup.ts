import * as Blockly from "blockly";

Blockly.Blocks["pybricks_setup"] = {
  init() {
    this.jsonInit({
      type: "pybricks_setup",
      message0: "set up",
      nextStatement: null,
      colour: "#ffbf00",
    });
  },
};
