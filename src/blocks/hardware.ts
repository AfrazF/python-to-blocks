import * as Blockly from "blockly";

Blockly.Blocks["pybricks_hub"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub",
      message0: "new prime hub %1",
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
      message0: "new motor %1 on port %2 (%3)",
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
      message0:
        "new drive base | %1 left %2 right %3 with wheel diameter %4 and axle track %5",
      args0: [
        { type: "field_dark_square", name: "NAME", text: "drive" },
        {
          type: "field_pill_dropdown",
          name: "LEFT",
          options: [["left", "left"]],
        },
        {
          type: "field_pill_dropdown",
          name: "RIGHT",
          options: [["right", "right"]],
        },
        { type: "field_white_in_pill", name: "WHEEL", value: 56 },
        { type: "field_white_in_pill", name: "TRACK", value: 112 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
  saveExtraState() {
    const block = this as Blockly.Block & { motors?: string[] };
    return { motors: block.motors || [] };
  },
  loadExtraState(state: { motors?: string[] }) {
    const block = this as Blockly.Block & { motors?: string[] };
    block.motors = state.motors || [];
    const options: [string, string][] =
      block.motors.length > 0
        ? block.motors.map((motor) => [motor, motor])
        : [
            ["left", "left"],
            ["right", "right"],
          ];
    (block.getField("LEFT") as any).setOptions(options);
    (block.getField("RIGHT") as any).setOptions(options);
  },
};
