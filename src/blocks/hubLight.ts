import * as Blockly from "blockly";
import { FieldColourPill } from "../fields/FieldColourPill";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";
import { COLOUR_MAP } from "../fields/colourUtils";
import { HUB_COLOUR, HUB_COLOUR_SECONDARY, hubOptions } from "./hub";

/**
 * Hub light block (Step v2b.2b.d.2).
 *
 * One block covers both Pybricks shapes:
 *
 * - `pybricks_blockLightOnColor_primehub_on.svg` —
 *   `(hub ▾) light [on ▾] (● red ▾)`
 * - `pybricks_blockLightOnColor_primehub_off.svg` —
 *   `(hub ▾) light [off ▾]`
 *
 * The leading HUB is a pill dropdown, matching the `HUB` field on the
 * `pybricks_hub_display_*` blocks. MODE is a transparent square dropdown (block
 * colour shows through, visible stroke; the transparency is a `style.css` rule
 * on `.blocklyDropdownRect`, not local to this file). COLOUR is a
 * `FieldColourPill` in enum mode, so it stores `"RED"` rather than `"#ff0000"`.
 * See `docs/FIELD_DESIGN.md`.
 *
 * Colour is Light & Sound purple (`#9b6af6`), not the Pybricks SVG blue — see
 * "Deliberate deviation from Pybricks" in `docs/FIELD_DESIGN.md`. Field fills
 * and strokes are derived from the block colour by `colourUtils.ts`.
 *
 * The COLOUR field is added and removed by the MODE validator, which is the
 * only thing that changes the block's shape. `loadExtraState` re-runs the same
 * function so a parsed block lands in the right shape before `initSvg()`.
 */

type HubLightState = { mode: "on" | "off" };

/**
 * The block's own state, attached to the instance so `saveExtraState` and
 * `loadExtraState` can reach it. Declared here rather than cast at each use.
 */
declare module "blockly" {
  interface Block {
    __hubLightState?: HubLightState;
    __hubLightUpdateShape?: () => void;
  }
}

Blockly.Blocks["pybricks_hub_light"] = {
  init() {
    const mode = new Blockly.FieldDropdown([
      ["on", "on"],
      ["off", "off"],
    ]);
    this.appendDummyInput("MODE_ROW")
      .appendField(new FieldPillDropdown(hubOptions), "HUB")
      .appendField("light")
      .appendField(mode, "MODE");

    const state: HubLightState = { mode: "on" };
    // The COLOUR pill lives on the SAME row as HUB/light/MODE — the reference
    // SVG is one row, `(hub ▾) light [on ▾] (● red ▾)`. `appendDummyInput`
    // always starts a new row, so the field is appended to `MODE_ROW` and
    // removed from it, never to an input of its own.
    const updateShape = () => {
      const wantColour = state.mode === "on";
      const hasColour = Boolean(this.getField("COLOUR"));
      if (wantColour && !hasColour) {
        this.getInput("MODE_ROW")?.appendField(
          new FieldColourPill(COLOUR_MAP),
          "COLOUR",
        );
      } else if (!wantColour && hasColour) {
        // MODE_ROW is created unconditionally in init(); ! is safe here.
        this.getInput("MODE_ROW")!.removeField("COLOUR", true);
      }
    };
    mode.setValidator((value: string) => {
      state.mode = value === "off" ? "off" : "on";
      updateShape();
      return value;
    });

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(HUB_COLOUR);
    // Blockly 13 has no public setColourSecondary; jsonInit accepts it,
    // imperative init does not.
    (
      this as unknown as { setColourSecondary?: (c: string) => void }
    ).setColourSecondary?.(HUB_COLOUR_SECONDARY);

    this.__hubLightState = state;
    this.__hubLightUpdateShape = updateShape;
    updateShape();
  },

  saveExtraState(): HubLightState {
    return { mode: this.__hubLightState?.mode ?? "on" };
  },

  loadExtraState(state: HubLightState) {
    const stored = this.__hubLightState;
    if (stored) {
      stored.mode = state?.mode === "off" ? "off" : "on";
    }
    this.__hubLightUpdateShape?.();
    this.getField("MODE")?.setValue(stored?.mode ?? "on");
  },
};
