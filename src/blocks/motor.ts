import * as Blockly from "blockly";
import { FieldWhiteInPill } from "../fields/FieldWhiteInPill";

const thenOptions = [
  ["hold", "hold"],
  ["coast", "coast"],
  ["brake", "brake"],
];

const motorPlaceholder: [string, string][] = [
  ["left", "left"],
  ["right", "right"],
];

/**
 * Shared extra-state plumbing for the motor command blocks.
 *
 * The MOTOR field is a pill dropdown whose options are the motors resolved for
 * the current file. Parsed blocks get them from the walker's `extraState`; a
 * block dragged from the toolbox gets them from the BLOCK_CREATE listener in
 * `main.ts`. Until then the placeholder left/right pair keeps the block valid.
 */
function motorExtraState(block: Blockly.Block): {
  saveExtraState: () => { motors: string[] };
  loadExtraState: (state: { motors?: string[] }) => void;
} {
  return {
    saveExtraState() {
      const self = block as Blockly.Block & { motors?: string[] };
      return { motors: self.motors || [] };
    },
    loadExtraState(state: { motors?: string[] }) {
      const self = block as Blockly.Block & { motors?: string[] };
      self.motors = state.motors || [];
      const options: [string, string][] =
        self.motors.length > 0
          ? self.motors.map((motor) => [motor, motor])
          : motorPlaceholder;
      (self.getField("MOTOR") as any)?.setOptions(options);
    },
  };
}

function setSuffixes(
  block: Blockly.Block,
  suffixes: Record<string, string>,
): void {
  for (const [name, suffix] of Object.entries(suffixes)) {
    (block.getField(name) as FieldWhiteInPill | null)?.setSuffix(suffix);
  }
}

Blockly.Blocks["pybricks_motor_run_target"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_target",
      message0: "motor %1 run at %2 towards %3 then %4",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        { type: "field_white_in_pill", name: "SPEED", value: 0 },
        { type: "field_white_in_pill", name: "TARGET", value: 0 },
        { type: "field_pill_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { SPEED: "°/s", TARGET: "°" });
    Object.assign(this, motorExtraState(this));
  },
};

Blockly.Blocks["pybricks_motor_run_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_angle",
      message0: "motor %1 run at %2 by %3 then %4",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        { type: "field_white_in_pill", name: "SPEED", value: 0 },
        { type: "field_white_in_pill", name: "ANGLE", value: 0 },
        { type: "field_pill_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { SPEED: "°/s", ANGLE: "°" });
    Object.assign(this, motorExtraState(this));
  },
};

Blockly.Blocks["pybricks_motor_run_until_stalled"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run_until_stalled",
      message0: "motor %1 run at %2 to end stop with power limit %3 then %4",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        { type: "field_white_in_pill", name: "SPEED", value: 0 },
        { type: "field_white_in_pill", name: "DUTY", value: 0 },
        { type: "field_pill_dropdown", name: "THEN", options: thenOptions },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { SPEED: "°/s", DUTY: "%" });
    Object.assign(this, motorExtraState(this));
  },
};

Blockly.Blocks["pybricks_motor_reset_angle"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_reset_angle",
      message0: "motor %1 reset angle to %2",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        { type: "field_white_in_pill", name: "VALUE", value: 0 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { VALUE: "°" });
    Object.assign(this, motorExtraState(this));
  },
};

Blockly.Blocks["pybricks_motor_stop"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_stop",
      message0: "motor %1 stop %2",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        {
          type: "field_pill_dropdown",
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
    Object.assign(this, motorExtraState(this));
  },
};
