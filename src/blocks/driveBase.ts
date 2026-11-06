import * as Blockly from "blockly";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";
import { FieldWhiteInPill } from "../fields/FieldWhiteInPill";

const thenOptions: [string, string][] = [
  ["hold", "hold"],
  ["coast", "coast"],
  ["brake", "brake"],
];

const driveBasePlaceholder: [string, string][] = [["drive", "drive"]];

const configureOptions: [string, string][] = [
  ["drive speed", "drive speed"],
  ["drive acceleration", "drive acceleration"],
  ["turn speed", "turn speed"],
  ["turn acceleration", "turn acceleration"],
];

/** Suffix for the configure VALUE slot, keyed by the WHAT dropdown value. */
export const configureSuffixes: Record<string, string> = {
  "drive speed": "mm/s",
  "drive acceleration": "mm/s²",
  "turn speed": "°/s",
  "turn acceleration": "°/s²",
};

/**
 * Shared extra-state plumbing for the drive base command blocks.
 *
 * The DRIVEBASE field is a pill dropdown whose options are the drive bases
 * resolved for the current file. Parsed blocks get them from the walker's
 * `extraState`; a block dragged from the toolbox gets them from the
 * BLOCK_CREATE listener in `main.ts`. Until then the placeholder `drive` keeps
 * the block valid.
 */
function driveBaseExtraState(block: Blockly.Block): {
  saveExtraState: () => { drivebases: string[] };
  loadExtraState: (state: { drivebases?: string[] }) => void;
} {
  return {
    saveExtraState() {
      const self = block as Blockly.Block & { drivebases?: string[] };
      return { drivebases: self.drivebases || [] };
    },
    loadExtraState(state: { drivebases?: string[] }) {
      const self = block as Blockly.Block & { drivebases?: string[] };
      self.drivebases = state.drivebases || [];
      const options: [string, string][] =
        self.drivebases.length > 0
          ? self.drivebases.map((name) => [name, name])
          : driveBasePlaceholder;
      (self.getField("DRIVEBASE") as any)?.setOptions(options);
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

const turnModeOptions: [string, string][] = [
  ["by", "by"],
  ["to", "to"],
];

/**
 * Rebuilds the `drive base` row so the turn-mode dropdown and the AMOUNT
 * suffix match the selected mode.
 *
 * `straight` shows `drive [straight ▾] for (AMOUNT) mm`; `turn` inserts a
 * second transparent square dropdown and drops the `for` label —
 * `drive [turn ▾] [by ▾] (AMOUNT) °`. Blockly has no conditional field
 * visibility in its public API, so the row is torn down and rebuilt on every
 * mode change.
 *
 * The row is a single named `appendDummyInput("DRIVE_ROW")`. `removeInput()`
 * disposes the row and its fields properly; assigning `inputList = []` leaks
 * the old fields, which keeps their SVG roots alive and makes the new fields
 * overlap them. `appendValueInput()` is not used because it starts a new row
 * per call, stacking every field on its own line.
 *
 * The rebuild is wrapped in an event group so undo treats it as one step, and
 * `lastMode` guards against re-entry — `setFieldValue` inside the callback
 * fires `onchange` again.
 */
Blockly.Extensions.register(
  "DRIVE_MOVE_MUTATOR",
  function (this: Blockly.Block) {
    // `jsonInit` runs extensions BEFORE `init()` returns, so the row built from
    // `message0` is still unnamed here. Name it now, or the first rebuild's
    // `removeInput("DRIVE_ROW")` finds nothing and appends a second row.
    if (this.inputList.length > 0 && !this.inputList[0].name) {
      this.inputList[0].name = "DRIVE_ROW";
    }

    const self = this as Blockly.Block & { lastMode?: string };

    const rebuild = (): void => {
      const mode = self.getFieldValue("MODE");
      if (mode === self.lastMode) {
        return;
      }
      self.lastMode = mode;

      const driveBase = self.getFieldValue("DRIVEBASE");
      const turnMode = self.getField("TURN_MODE")?.getValue();
      const amount = self.getField("AMOUNT")?.getValue();
      const thenValue = self.getFieldValue("THEN");

      const group = Blockly.Events.getGroup();
      Blockly.Events.setGroup(true);
      try {
        if (self.getInput("DRIVE_ROW")) {
          self.removeInput("DRIVE_ROW");
        }

        const driveBaseField = new FieldPillDropdown(driveBasePlaceholder);
        // Transparent square dropdown, per the Pybricks SVG.
        const modeField = new Blockly.FieldDropdown([
          ["straight", "straight"],
          ["turn", "turn"],
        ]);
        const amountField = new FieldWhiteInPill(0);
        amountField.setSuffix(mode === "turn" ? "°" : "mm");
        const thenField = new FieldPillDropdown(thenOptions);

        // Mirrors `message0` exactly: `drive base | %1 drive %2 for %3 then %4`.
        // The `|` is part of the row, so the rebuild must re-add it — replacing
        // the row drops whatever `message0` built.
        const row = self.appendDummyInput("DRIVE_ROW");
        row
          .appendField("drive base |")
          .appendField(driveBaseField, "DRIVEBASE");
        row.appendField("drive").appendField(modeField, "MODE");

        if (mode === "turn") {
          const turnModeField = new Blockly.FieldDropdown(turnModeOptions);
          row.appendField(turnModeField, "TURN_MODE");
        } else {
          // Only `straight` reads `for`; `turn` puts the amount straight after
          // the by/to dropdown, per the Pybricks block.
          row.appendField("for");
        }

        row.appendField(amountField, "AMOUNT");
        row.appendField("then").appendField(thenField, "THEN");

        // Restore the captured values. DRIVEBASE options come from extraState,
        // so re-apply them before setting the value.
        const drivebases = (self as Blockly.Block & { drivebases?: string[] })
          .drivebases;
        if (drivebases && drivebases.length > 0) {
          driveBaseField.setOptions(
            drivebases.map((name): [string, string] => [name, name]),
          );
        }
        if (driveBase) driveBaseField.setValue(driveBase);
        modeField.setValue(mode);
        if (mode === "turn" && turnMode) {
          (self.getField("TURN_MODE") as Blockly.FieldDropdown).setValue(
            turnMode,
          );
        }
        if (amount !== null && amount !== undefined) {
          (self.getField("AMOUNT") as FieldWhiteInPill).setValue(amount);
        }
        if (thenValue) thenField.setValue(thenValue);

        (self as Blockly.BlockSvg).render?.();
      } finally {
        Blockly.Events.setGroup(group);
      }
    };

    this.setOnChange(rebuild);
  },
);

/**
 * Swaps the VALUE suffix when WHAT changes: `mm/s`, `mm/s²`, `°/s`, `°/s²`.
 */
Blockly.Extensions.register(
  "DRIVE_CONFIGURE_SUFFIX",
  function (this: Blockly.Block) {
    const self = this as Blockly.Block & { lastWhat?: string };

    const update = (): void => {
      const what = self.getFieldValue("WHAT");
      if (what === self.lastWhat) {
        return;
      }
      self.lastWhat = what;
      const suffix = configureSuffixes[what];
      if (suffix) {
        (self.getField("VALUE") as FieldWhiteInPill | null)?.setSuffix(suffix);
      }
    };

    this.setOnChange(update);
  },
);

Blockly.Blocks["pybricks_drive_move"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_move",
      message0: "drive base | %1 drive %2 for %3 then %4",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "DRIVEBASE",
          options: driveBasePlaceholder,
        },
        {
          // Transparent square dropdown, per the Pybricks SVG.
          type: "field_dropdown",
          name: "MODE",
          options: [
            ["straight", "straight"],
            ["turn", "turn"],
          ],
        },
        { type: "field_white_in_pill", name: "AMOUNT", value: 0 },
        { type: "field_pill_dropdown", name: "THEN", options: thenOptions },
      ],
      extensions: ["DRIVE_MOVE_MUTATOR"],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { AMOUNT: "mm" });
    Object.assign(this, driveBaseExtraState(this));
  },
};

Blockly.Blocks["pybricks_drive_reset"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_reset",
      message0: "drive base | %1 reset distance %2 angle %3",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "DRIVEBASE",
          options: driveBasePlaceholder,
        },
        { type: "field_white_in_pill", name: "DISTANCE", value: 0 },
        { type: "field_white_in_pill", name: "ANGLE", value: 0 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { DISTANCE: "mm", ANGLE: "°" });
    Object.assign(this, driveBaseExtraState(this));
  },
};

Blockly.Blocks["pybricks_drive_use_gyro"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_use_gyro",
      message0: "drive base | %1 use %2",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "DRIVEBASE",
          options: driveBasePlaceholder,
        },
        {
          type: "field_pill_dropdown",
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
    Object.assign(this, driveBaseExtraState(this));
  },
};

Blockly.Blocks["pybricks_drive_configure"] = {
  init() {
    this.jsonInit({
      type: "pybricks_drive_configure",
      message0: "drive base | %1 configure %2 %3",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "DRIVEBASE",
          options: driveBasePlaceholder,
        },
        {
          // Transparent square dropdown, per the Pybricks SVG.
          type: "field_dropdown",
          name: "WHAT",
          options: configureOptions,
        },
        { type: "field_white_in_pill", name: "VALUE", value: 0 },
      ],
      extensions: ["DRIVE_CONFIGURE_SUFFIX"],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    setSuffixes(this, { VALUE: "mm/s" });
    Object.assign(this, driveBaseExtraState(this));
  },
};
