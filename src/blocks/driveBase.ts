import * as Blockly from "blockly";
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

/**
 * Swaps the AMOUNT suffix between `mm` (straight) and `°` (turn) when MODE
 * changes. `lastMode` guards against re-entry: setFieldValue inside the
 * callback fires onchange again.
 */
Blockly.Extensions.register(
  "DRIVE_MOVE_SUFFIX",
  function (this: Blockly.Block) {
    const self = this as Blockly.Block & { lastMode?: string };

    const update = (): void => {
      const mode = self.getFieldValue("MODE");
      if (mode === self.lastMode) {
        return;
      }
      self.lastMode = mode;
      (self.getField("AMOUNT") as FieldWhiteInPill | null)?.setSuffix(
        mode === "turn" ? "°" : "mm",
      );
    };

    this.setOnChange(update);
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
      extensions: ["DRIVE_MOVE_SUFFIX"],
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
