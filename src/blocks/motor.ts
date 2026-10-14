import * as Blockly from "blockly";

const thenOptions = [
  ["hold", "hold"],
  ["coast", "coast"],
  ["brake", "brake"],
];

Blockly.Blocks["pybricks_motor_run_target"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_target",
      message0: "motor %1 run at %2 °/s towards %3 then %4",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        { type: "field_input", name: "SPEED", text: "" },
        { type: "field_input", name: "TARGET", text: "" },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_motor_run_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_angle",
      message0: "motor %1 run at %2 °/s by %3 ° then %4",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        { type: "field_input", name: "SPEED", text: "" },
        { type: "field_input", name: "ANGLE", text: "" },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_motor_run_until_stalled"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_until_stalled",
      message0:
        "motor %1 run at %2 °/s to end stop with power limit %3 then %4",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        { type: "field_input", name: "SPEED", text: "" },
        { type: "field_input", name: "DUTY", text: "" },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_motor_reset_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_reset_angle",
      message0: "motor %1 reset angle to %2 °",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        { type: "field_input", name: "VALUE", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_motor_stop"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_stop",
      message0: "motor %1 stop %2",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        {
          type: "field_dropdown",
          name: "MODE",
          options: [
            ["coast", "coast"],
            ["brake", "brake"],
            ["hold", "hold"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};
