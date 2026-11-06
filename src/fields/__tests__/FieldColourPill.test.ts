import { describe, expect, it } from "vitest";
import { FieldColourPill } from "../FieldColourPill";
import { COLOUR_MAP } from "../colourUtils";

/**
 * Two storage modes:
 *
 * - hex mode (no `enumMap`): `pybricks_colour` stores `"#ff0000"` and the pill
 *   label is the lowercased palette name (`red`).
 * - enum mode (`enumMap`): `pybricks_hub_light` stores `"RED"` and the label is
 *   the name itself.
 *
 * These tests exercise the value/label/swatch contract without an SVG root —
 * `getText_` and the option list are pure functions of the stored value.
 */
describe("FieldColourPill (hex mode)", () => {
  it("stores hex and labels with the lowercase palette name", () => {
    const field = new FieldColourPill();
    field.setValue("#ff0000");
    expect(field.getValue()).toBe("#ff0000");
    expect(field.getText_()).toBe("red");
  });

  it("lists all twelve palette entries", () => {
    const field = new FieldColourPill();
    const options = field.getOptions(false);
    expect(options).toHaveLength(12);
    expect(options[0]).toEqual(["red", "#ff0000"]);
  });
});

describe("FieldColourPill (enum mode)", () => {
  it("stores the uppercase enum name but labels it lowercase", () => {
    const field = new FieldColourPill(COLOUR_MAP);
    field.setValue("RED");
    // Python is `Color.RED`, so the stored value stays uppercase...
    expect(field.getValue()).toBe("RED");
    // ...but Pybricks renders the label lowercase (`red`).
    expect(field.getText_()).toBe("red");
  });

  it("lists every enum key with a lowercase label and uppercase value", () => {
    const field = new FieldColourPill(COLOUR_MAP);
    const options = field.getOptions(false);
    expect(options).toHaveLength(12);
    expect(options[0]).toEqual(["red", "RED"]);
    expect(options.map(([label]) => label)).toContain("violet");
    expect(options.map(([, value]) => value)).toContain("VIOLET");
  });

  it("keeps the hex table available for the swatch", () => {
    const field = new FieldColourPill(COLOUR_MAP);
    field.setValue("VIOLET");
    // The swatch colour is derived from the map, not from the stored value.
    expect(COLOUR_MAP[String(field.getValue())]).toBe("#8000ff");
  });
});
