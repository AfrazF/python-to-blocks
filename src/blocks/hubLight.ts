import * as Blockly from "blockly";
import { FieldColourPill } from "../fields/FieldColourPill";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";
import { COLOUR_MAP } from "../fields/colourUtils";

/**
 * Hub light block (Step v2b.2b.d.2).
 *
 * One block covers both Pybricks shapes:
 *
 * - `pybricks_blockLightOnColor_primehub_on.svg` —
 *   `(hub ▾) light [on ▾] (● RED ▾)`
 * - `pybricks_blockLightOnColor_primehub_off.svg` —
 *   `(hub ▾) light [off ▾]`
 *
 * The leading HUB is a pill dropdown, matching the `HUB` field on the
 * `pybricks_hub_display_*` blocks. MODE is a transparent square dropdown (block
 * colour shows through, visible stroke). COLOUR is a `FieldColourPill` in enum
 * mode, so it stores `"RED"` rather than `"#ff0000"`. See
 * `docs/FIELD_DESIGN.md`.
 *
 * Colour is Light & Sound purple (`#9b6af6`), not the Pybricks SVG blue — see
 * "Deliberate deviation from Pybricks" in `docs/FIELD_DESIGN.md`. Field fills
 * and strokes are derived from the block colour by `colourUtils.ts`.
 *
 * The COLOUR row is added and removed by the MODE validator, which is the only
 * thing that changes the block's shape. `loadExtraState` re-runs the same
 * function so a parsed block lands in the right shape before `initSvg()`.
 */

const HUB_COLOUR = "#9b6af6";
const HUB_COLOUR_SECONDARY = "#691ff0";

/**
 * The hub object dropdown. Purely aesthetic in v2b — a project has exactly one
 * hub, so the list holds a single entry and nothing reads the selection.
 * v2d.6a fills this from the object table.
 */
const hubOptions: [string, string][] = [["hub", "hub"]];

type HubLightState = { mode: "on" | "off" };

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
        this.getInput("MODE_ROW")?.removeField("COLOUR", true);
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
    (
      this as unknown as { setColourSecondary?: (c: string) => void }
    ).setColourSecondary?.(HUB_COLOUR_SECONDARY);

    (this as unknown as { __state?: HubLightState }).__state = state;
    (this as unknown as { __updateShape?: () => void }).__updateShape =
      updateShape;
    updateShape();
  },

  saveExtraState(): HubLightState {
    const state = (this as unknown as { __state?: HubLightState }).__state;
    return { mode: state?.mode ?? "on" };
  },

  loadExtraState(state: HubLightState) {
    const stored = (this as unknown as { __state?: HubLightState }).__state;
    if (stored) {
      stored.mode = state?.mode === "off" ? "off" : "on";
    }
    (this as unknown as { __updateShape?: () => void }).__updateShape?.();
    this.getField("MODE")?.setValue(stored?.mode ?? "on");
  },
};
