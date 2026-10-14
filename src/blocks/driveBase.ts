import * as Blockly from "blockly";
import { setNumberShadows } from "./shadows";

Blockly.Blocks["pybricks_drive_move"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_move",
      message0: "drive base %1 for %2 then %3",
      args0: [
        {
          type: "field_dropdown",
          name: "MODE",
          options: [
            ["straight", "straight"],
            ["turn", "turn"],
          ],
        },
        {
          type: "input_value",
          name: "AMOUNT",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        {
          type: "field_dropdown",
          name: "THEN",
          options: [
            ["hold", "hold"],
            ["coast", "coast"],
            ["brake", "brake"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["AMOUNT"]);
  },
};

Blockly.Blocks["pybricks_drive_reset"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_reset",
      message0: "drive base reset distance %1 mm angle %2",
      args0: [
        {
          type: "input_value",
          name: "DISTANCE",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
        {
          type: "input_value",
          name: "ANGLE",
          shadow: { type: "math_number", fields: { NUM: 0 } },
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setNumberShadows(this, ["DISTANCE", "ANGLE"]);
  },
};

Blockly.Blocks["pybricks_drive_use_gyro"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_use_gyro",
      message0: "drive base use %1",
      args0: [
        {
          type: "field_dropdown",
          name: "VALUE",
          options: [
            ["gyro", "gyro"],
            ["no gyro", "no gyro"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
  },
};

Blockly.Blocks["pybricks_drive_configure"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_configure",
      message0: "configure %1 to %2",
      args0: [
        {
          type: "field_dropdown",
          name: "WHAT",
          options: [
            ["drive speed", "drive speed"],
            ["drive acceleration", "drive acceleration"],
            ["turn speed", "turn speed"],
            ["turn acceleration", "turn acceleration"],
          ],
        },
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
