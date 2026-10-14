import * as Blockly from "blockly";

Blockly.Blocks["pybricks_hub"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub",
      message0: "prime hub %1",
      args0: [{ type: "field_input", name: "NAME", text: "" }],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_motor_setup"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_setup",
      message0: "%1 on %2 with %3",
      args0: [
        { type: "field_input", name: "NAME", text: "" },
        {
          type: "field_dropdown",
          name: "PORT",
          options: [
            ["A", "A"],
            ["B", "B"],
            ["C", "C"],
            ["D", "D"],
            ["E", "E"],
            ["F", "F"],
          ],
        },
        {
          type: "field_dropdown",
          name: "DIRECTION",
          options: [
            ["clockwise", "clockwise"],
            ["counterclockwise", "counterclockwise"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_drivebase_setup"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drivebase_setup",
      message0: "drive base left %1 right %2 with %3 mm and %4 mm",
      args0: [
        { type: "field_input", name: "LEFT", text: "" },
        { type: "field_input", name: "RIGHT", text: "" },
        { type: "field_input", name: "WHEEL", text: "" },
        { type: "field_input", name: "TRACK", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};
