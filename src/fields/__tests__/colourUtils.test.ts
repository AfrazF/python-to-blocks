import { describe, expect, it } from "vitest";
import { COLOUR_MAP, getFieldColours, scaleColour } from "../colourUtils";

/**
 * The two lightness rules from `docs/FIELD_DESIGN.md`:
 *
 * - field fill (pill only) = block × 0.85
 * - block stroke           = block × 0.75
 *
 * Applied per RGB channel, rounded to nearest, formatted `#rrggbb`.
 */
describe("scaleColour", () => {
  it("applies the ×0.85 field-fill rule", () => {
    expect(scaleColour("#4c97ff", 0.85)).toBe("#4180d9");
    expect(scaleColour("#ff6680", 0.85)).toBe("#d9576d");
    expect(scaleColour("#ffab19", 0.85)).toBe("#d99115");
  });

  it("applies the ×0.75 block-stroke rule", () => {
    expect(scaleColour("#4c97ff", 0.75)).toBe("#3971bf");
    expect(scaleColour("#ff6680", 0.75)).toBe("#bf4d60");
    expect(scaleColour("#ffab19", 0.75)).toBe("#bf8013");
  });

  it("expands three-digit hex before scaling", () => {
    expect(scaleColour("#fff", 0.85)).toBe("#d9d9d9");
  });

  it("falls back to the default blue for an unparseable colour", () => {
    expect(scaleColour("not-a-colour", 0.85)).toBe("#4180d9");
  });
});

describe("getFieldColours", () => {
  it("derives fill and stroke from the block colour", () => {
    const block = { getColour: () => "#4c97ff" };
    expect(getFieldColours(block as never)).toEqual({
      fill: "#4180d9",
      stroke: "#3971bf",
    });
  });

  it("falls back to the default blue when there is no block", () => {
    expect(getFieldColours(null)).toEqual({
      fill: "#4180d9",
      stroke: "#3971bf",
    });
  });
});

describe("COLOUR_MAP", () => {
  it("holds the twelve Pybricks colour constants", () => {
    expect(Object.keys(COLOUR_MAP)).toEqual([
      "RED",
      "ORANGE",
      "YELLOW",
      "GREEN",
      "CYAN",
      "BLUE",
      "VIOLET",
      "MAGENTA",
      "WHITE",
      "GRAY",
      "BLACK",
      "NONE",
    ]);
  });

  it("uses the documented hexes", () => {
    expect(COLOUR_MAP.RED).toBe("#ff0000");
    expect(COLOUR_MAP.VIOLET).toBe("#8000ff");
    expect(COLOUR_MAP.BLACK).toBe("#1a1a1a");
    expect(COLOUR_MAP.NONE).toBe("#000000");
  });
});
