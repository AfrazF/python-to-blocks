import { describe, expect, it } from "vitest";
import { FieldDarkSquare } from "../FieldDarkSquare";

/**
 * `FieldDarkSquare.fromJson` is the only way a block definition reaches this
 * field, so it is the contract that matters: `pybricks_hub_display_char` and
 * `pybricks_test_fields` rely on the default (dark) shape, and
 * `pybricks_hub_display_icon` relies on `white: true`.
 *
 * The rendered fill needs an SVG root, which jsdom does not give a field
 * outside a workspace, so these tests assert the flag `fromJson` sets. That is
 * the input to `updateSquare()`'s fill choice.
 */
type FieldInternals = { white: boolean };

describe("FieldDarkSquare.fromJson", () => {
  it("defaults to the dark square for existing callers", () => {
    const field = FieldDarkSquare.fromJson({
      type: "field_dark_square",
      name: "CHAR",
    });
    expect(field).toBeInstanceOf(FieldDarkSquare);
    expect((field as unknown as FieldInternals).white).toBe(false);
  });

  it("honours white: true for the hub display ICON field", () => {
    const field = FieldDarkSquare.fromJson({
      type: "field_dark_square",
      name: "NAME",
      white: true,
    });
    expect(field).toBeInstanceOf(FieldDarkSquare);
    expect((field as unknown as FieldInternals).white).toBe(true);
  });
});
