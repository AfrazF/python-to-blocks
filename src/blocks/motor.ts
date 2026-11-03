import * as Blockly from "blockly";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";
import { FieldWhiteInPill } from "../fields/FieldWhiteInPill";

const thenOptions: [string, string][] = [
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

const runModeOptions: [string, string][] = [
  ["towards", "towards"],
  ["by", "by"],
  ["to end stop", "to end stop"],
];

/**
 * Rebuilds the `motor run` row so the value slot matches the selected mode.
 *
 * `towards` / `by` show `(VALUE) °`; `to end stop` shows
 * `with power limit (DUTY) %` instead. Blockly has no conditional field
 * visibility in its public API, so the row is torn down and rebuilt on every
 * mode change.
 *
 * The row is a single named `appendDummyInput("MOTOR_ROW")`. `removeInput()`
 * disposes the row and its fields properly; assigning `inputList = []` leaks
 * the old fields, which keeps their SVG roots alive and makes the new fields
 * overlap them. `appendValueInput()` is not used because it starts a new row
 * per call, stacking every field on its own line.
 *
 * The rebuild is wrapped in an event group so undo treats it as one step, and
 * `lastMode` guards against re-entry — `setFieldValue` inside the callback
 * fires `onchange` again.
 */
Blockly.Extensions.register("MOTOR_RUN_DUTY", function (this: Blockly.Block) {
  // `jsonInit` runs extensions BEFORE `init()` returns, so the row built from
  // `message0` is still unnamed here. Name it now, or the first rebuild's
  // `removeInput("MOTOR_ROW")` finds nothing and appends a second row — the
  // duplicate "motor" label.
  if (this.inputList.length > 0 && !this.inputList[0].name) {
    this.inputList[0].name = "MOTOR_ROW";
  }

  const self = this as Blockly.Block & { lastMode?: string };

  const rebuild = (): void => {
    const mode = self.getFieldValue("MODE");
    if (mode === self.lastMode) {
      return;
    }
    self.lastMode = mode;

    const motor = self.getFieldValue("MOTOR");
    const speed = self.getFieldValue("SPEED");
    const thenValue = self.getFieldValue("THEN");
    const value = self.getField("VALUE")?.getValue();
    const duty = self.getField("DUTY")?.getValue();

    const group = Blockly.Events.getGroup();
    Blockly.Events.setGroup(true);
    try {
      if (self.getInput("MOTOR_ROW")) {
        self.removeInput("MOTOR_ROW");
      }

      const motorField = new FieldPillDropdown(motorPlaceholder);
      const speedField = new FieldWhiteInPill(0);
      speedField.setSuffix("°/s");
      // Transparent square dropdown, per the Pybricks SVG.
      const modeField = new Blockly.FieldDropdown(runModeOptions);
      const thenField = new FieldPillDropdown(thenOptions);

      const row = self.appendDummyInput("MOTOR_ROW");
      row.appendField("motor").appendField(motorField, "MOTOR");
      row.appendField("run at").appendField(speedField, "SPEED");
      row.appendField(modeField, "MODE");

      if (mode === "to end stop") {
        const dutyField = new FieldWhiteInPill(50);
        dutyField.setSuffix("%");
        row.appendField("with power limit").appendField(dutyField, "DUTY");
      } else {
        const valueField = new FieldWhiteInPill(0);
        valueField.setSuffix("°");
        row.appendField(valueField, "VALUE");
      }

      row.appendField("then").appendField(thenField, "THEN");

      // Restore the captured values. MOTOR options come from extraState, so
      // re-apply them before setting the value.
      const motors = (self as Blockly.Block & { motors?: string[] }).motors;
      if (motors && motors.length > 0) {
        motorField.setOptions(motors.map((m): [string, string] => [m, m]));
      }
      if (motor) motorField.setValue(motor);
      if (speed !== null) speedField.setValue(speed);
      modeField.setValue(mode);
      if (thenValue) thenField.setValue(thenValue);
      if (mode === "to end stop") {
        if (duty !== null && duty !== undefined) {
          (self.getField("DUTY") as FieldWhiteInPill).setValue(duty);
        }
      } else if (value !== null && value !== undefined) {
        (self.getField("VALUE") as FieldWhiteInPill).setValue(value);
      }

      (self as Blockly.BlockSvg).render?.();
    } finally {
      Blockly.Events.setGroup(group);
    }
  };

  this.setOnChange(rebuild);
});

Blockly.Blocks["pybricks_motor_run"] = {
  init() {
    this.jsonInit({
      type: "pybricks_motor_run",
      message0: "motor %1 run at %2 %3 %4 then %5",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "MOTOR",
          options: motorPlaceholder,
        },
        { type: "field_white_in_pill", name: "SPEED", value: 0 },
        {
          // Transparent square dropdown, per the Pybricks SVG.
          type: "field_dropdown",
          name: "MODE",
          options: runModeOptions,
        },
        { type: "field_white_in_pill", name: "VALUE", value: 0 },
        { type: "field_pill_dropdown", name: "THEN", options: thenOptions },
      ],
      extensions: ["MOTOR_RUN_DUTY"],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { SPEED: "°/s", VALUE: "°" });
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
