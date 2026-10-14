import * as Blockly from "blockly";
import { setNumberShadows } from "./shadows";

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
        {
          type: "input_value",
          name: "SPEED",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        {
          type: "input_value",
          name: "TARGET",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["SPEED", "TARGET"]);
  },
};

Blockly.Blocks["pybricks_motor_run_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_angle",
      message0: "motor %1 run at %2 °/s by %3 ° then %4",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        {
          type: "input_value",
          name: "SPEED",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        {
          type: "input_value",
          name: "ANGLE",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["SPEED", "ANGLE"]);
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
        {
          type: "input_value",
          name: "SPEED",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        {
          type: "input_value",
          name: "DUTY",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        { type: "field_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["SPEED", "DUTY"]);
  },
};

Blockly.Blocks["pybricks_motor_reset_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_reset_angle",
      message0: "motor %1 reset angle to %2 °",
      args0: [
        { type: "field_input", name: "MOTOR", text: "" },
        {
          type: "input_value",
          name: "VALUE",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["VALUE"]);
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
