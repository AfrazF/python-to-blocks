# Field design — match Pybricks exactly

Every shape and hex below was verified against a real Pybricks block SVG
captured from docs.pybricks.com or the live Pybricks app. Where a hex is
marked `(derived)`, it was computed by the ×0.85 rule from a confirmed
block fill.

## Notation

| Notation                       | Means                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `plain text`                   | Static label, not editable                                                                                      |
| `[name]`                       | White square field, dark text                                                                                   |
| `[transparent, name ▾]`        | Square dropdown — fill `transparent` (block colour shows through), visible block stroke, dark text, white arrow |
| `(darker color, name ▾)`       | Pill dropdown — fill = block × 0.85, white text, white arrow                                                    |
| `(darker color, [num] suffix)` | Pill wrapping a white square number field plus a suffix label inside the pill                                   |
| `(●)`                          | Colour chit (v2b.2b only)                                                                                       |
| `{icon}`                       | Icon, no text                                                                                                   |
| `\|`                           | Divider between leading icon and block body                                                                     |

## Two lightness rules

| Rule                   | Formula      | Verified samples                                                    |
| ---------------------- | ------------ | ------------------------------------------------------------------- |
| Field fill (pill only) | block × 0.85 | `#4c97ff` → `#4180d9`, `#ff6680` → `#d9576d`, `#ffab19` → `#d99115` |
| Block stroke           | block × 0.75 | `#4c97ff` → `#3971bf`, `#ff6680` → `#bf4d60`, `#ffab19` → `#bf8013` |

Apply per RGB channel, round to nearest integer, format `#rrggbb`.

Square dropdowns and square fields are NOT darker. They use
`fill="transparent"` so the block colour shows through, with a visible
block stroke.

## Two dropdown styles (verified from SVG)

### Pill dropdown

`<path>` with `rx` = half the pill's height (full pill). Fill = block
× 0.85. Outer stroke is present in the SVG (`#3971bf`) but visually
invisible at Pybricks' CSS. White text, white dropdown arrow, no inner
rect. Used for enum values: `hold`, `A`, `HAPPY`, `drive base`, `motor`,
rotation-direction icon.

### Transparent square dropdown

`<rect rx="4">` with `fill="transparent"`, `stroke="#3971bf"` visible.
Text reads the block colour through (visually same as the block). White
dropdown arrow, no inner rect. Used for inline keywords: `drive speed`,
`towards`, `straight`.

## Pill with white square and suffix (nested, verified)

Layer by layer, from outside in:

1. **Outer pill** — `rx` = half its height, fill = block × 0.85, stroke
   `#3971bf` in SVG but visually invisible.
2. **Inner white square** — `rx=4`, white fill, dark text, stroke
   `#3971bf` in SVG but visually invisible.
3. **Number** — dark text inside the white square.
4. **Suffix** — white text to the right of the white square, still
   inside the pill (`mm/s`, `°/s`, `°/s²`, `mm/s²`, `°`, `mm`, `ms`).

**Only the inner white square is interactive.** The pill and the suffix
are decorative. They exist so the reader sees "150 mm/s" as one visual
unit inside a pill.

## Verified block examples (canonical)

1. `drive configure`
   `{drive base icon} | (darker blue, drive base ▾) configure [transparent, drive speed ▾] (darker blue, [150] mm/s)`

2. `motor run_target`
   `{motor icon} | (darker blue, motor ▾) run at (darker blue, [500] °/s) [transparent, towards ▾] (darker blue, [360] °) then (darker blue, hold ▾)`

3. `motor setup`
   `{motor icon} | [left] on (darker blue, A ▾) with forward (darker blue, {clockwise motor icon} ▾)`

4. `drive straight`
   `{drive base icon} | drive [transparent, straight ▾] for (darker blue, [500] mm) then (darker blue, hold ▾)`

## Deliberate deviation from Pybricks

Pybricks uses two Flow oranges: `if` = `#ff8c1a`, `wait` = `#ffab19`.
We use one Flow orange (`#ffab19`) for `if`, `elif`, `else`, `wait`,
`for`, `while`. Spike Prime's control category is one colour, and the
two-shade split is confusing to beginners. User decision.

## Field lookup table

One row per field registered in `src/blocks/`. Verified by reading each
block file on 2026-10-26. Columns: `Block | Field | Python example | Style | Fill | Text | Suffix | Source`.

Styles: `white-square`, `pill-dropdown`, `transparent-square-dropdown`,
`white-in-pill`, `colour-chit`.
Fill: `white`, `darker`, `transparent`, `value`.
Text: `white`, `dark`, `icon`.
Source: `pybricks-svg`, `user`, `derived`, `ours`.

| Block                              | Field       | Python example         | Style                       | Fill        | Text  | Suffix     | Source       |
| ---------------------------------- | ----------- | ---------------------- | --------------------------- | ----------- | ----- | ---------- | ------------ |
| `pybricks_hub`                     | `NAME`      | `hub`                  | white-square                | white       | dark  |            | ours         |
| `pybricks_motor_setup`             | `NAME`      | `left`                 | white-square                | white       | dark  |            | ours         |
| `pybricks_motor_setup`             | `PORT`      | `Port.A`               | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_setup`             | `DIRECTION` | `Direction.CLOCKWISE`  | pill-dropdown               | darker      | icon  |            | pybricks-svg |
| `pybricks_drivebase_setup`         | `NAME`      | `drive`                | white-square                | white       | dark  |            | ours         |
| `pybricks_drivebase_setup`         | `LEFT`      | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drivebase_setup`         | `RIGHT`     | `right`                | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drivebase_setup`         | `WHEEL`     | `WHEEL_DIAMETER`       | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drivebase_setup`         | `TRACK`     | `AXLE_TRACK`           | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drive_move`              | `MODE`      | `straight`             | transparent-square-dropdown | transparent | dark  |            | pybricks-svg |
| `pybricks_drive_move`              | `AMOUNT`    | `500`                  | white-in-pill               | darker      | white | `mm` / `°` | pybricks-svg |
| `pybricks_drive_move`              | `THEN`      | `Stop.HOLD`            | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drive_reset`             | `DISTANCE`  | `0`                    | white-in-pill               | darker      | white | `mm`       | pybricks-svg |
| `pybricks_drive_reset`             | `ANGLE`     | `0`                    | white-in-pill               | darker      | white | `°`        | pybricks-svg |
| `pybricks_drive_use_gyro`          | `VALUE`     | `True`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_drive_configure`         | `WHAT`      | `straight_speed`       | transparent-square-dropdown | transparent | dark  |            | pybricks-svg |
| `pybricks_drive_configure`         | `VALUE`     | `150`                  | white-in-pill               | darker      | white | varies     | pybricks-svg |
| `pybricks_motor_run_target`        | `MOTOR`     | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_target`        | `SPEED`     | `500`                  | white-in-pill               | darker      | white | `°/s`      | pybricks-svg |
| `pybricks_motor_run_target`        | `TARGET`    | `360`                  | white-in-pill               | darker      | white | `°`        | pybricks-svg |
| `pybricks_motor_run_target`        | `THEN`      | `Stop.HOLD`            | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_angle`         | `MOTOR`     | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_angle`         | `SPEED`     | `500`                  | white-in-pill               | darker      | white | `°/s`      | pybricks-svg |
| `pybricks_motor_run_angle`         | `ANGLE`     | `-90`                  | white-in-pill               | darker      | white | `°`        | pybricks-svg |
| `pybricks_motor_run_angle`         | `THEN`      | `Stop.HOLD`            | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_until_stalled` | `MOTOR`     | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_until_stalled` | `SPEED`     | `500`                  | white-in-pill               | darker      | white | `°/s`      | pybricks-svg |
| `pybricks_motor_run_until_stalled` | `DUTY`      | `40`                   | white-in-pill               | darker      | white |            | pybricks-svg |
| `pybricks_motor_run_until_stalled` | `THEN`      | `Stop.COAST`           | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_reset_angle`       | `MOTOR`     | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_reset_angle`       | `VALUE`     | `0`                    | white-in-pill               | darker      | white | `°`        | pybricks-svg |
| `pybricks_motor_stop`              | `MOTOR`     | `left`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_motor_stop`              | `MODE`      | `Stop.COAST`           | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_icon`        | `HUB`       | `hub`                  | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_icon`        | `METHOD`    | `icon`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_icon`        | `ICON`      | `NEXT_ICON`            | white-square                | white       | dark  |            | ours         |
| `pybricks_hub_display_char`        | `HUB`       | `hub`                  | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_char`        | `METHOD`    | `char`                 | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_char`        | `CHAR`      | `ATTACHMENTS[i][0]`    | white-square                | white       | dark  |            | ours         |
| `pybricks_hub_display_number`      | `HUB`       | `hub`                  | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_number`      | `METHOD`    | `number`               | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_number`      | `NUMBER`    | `42`                   | white-in-pill               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_off`         | `HUB`       | `hub`                  | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_hub_display_off`         | `METHOD`    | `off`                  | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_var_reporter`            | `NAME`      | `WHEEL_DIAMETER`       | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_var_declare`             | `NAME`      | `X`                    | white-square                | white       | dark  |            | pybricks-svg |
| `pybricks_var_declare`             | `VALUE`     | `56`                   | white-in-pill               | darker      | white |            | pybricks-svg |
| `pybricks_var_set`                 | `NAME`      | `X`                    | white-square                | white       | dark  |            | pybricks-svg |
| `pybricks_var_set`                 | `VALUE`     | `57`                   | white-in-pill               | darker      | white |            | pybricks-svg |
| `pybricks_if`                      | `CONDITION` | `i > 0`                | white-square                | white       | dark  |            | ours         |
| `pybricks_if_else`                 | `CONDITION` | `i > 0`                | white-square                | white       | dark  |            | ours         |
| `pybricks_while`                   | `CONDITION` | `True`                 | white-square                | white       | dark  |            | ours         |
| `pybricks_for`                     | `LOOP_VAR`  | `i`                    | white-square                | white       | dark  |            | ours         |
| `pybricks_for`                     | `ITERABLE`  | `missions`             | white-square                | white       | dark  |            | ours         |
| `pybricks_try_except`              | `EXCEPTION` | `Exception`            | white-square                | white       | dark  |            | ours         |
| `pybricks_try_except`              | `AS_NAME`   | `e`                    | white-square                | white       | dark  |            | user         |
| `pybricks_return`                  | `VALUE`     | `i, ATTACHMENTS[i][1]` | white-square                | white       | dark  |            | ours         |
| `pybricks_raise`                   | `VALUE`     | `Exception`            | white-square                | white       | dark  |            | ours         |
| `pybricks_task`                    | `NAME`      | `run1`                 | white-square                | white       | dark  |            | ours         |
| `pybricks_task`                    | `PARAMS`    | `a, b`                 | white-square                | white       | dark  |            | ours         |
| `pybricks_function`                | `NAME`      | `normal`               | white-square                | white       | dark  |            | ours         |
| `pybricks_function`                | `PARAMS`    | `speed`                | white-square                | white       | dark  |            | ours         |
| `pybricks_multitask`               | `MODE`      | `race=True`            | pill-dropdown               | darker      | white |            | pybricks-svg |
| `pybricks_call`                    | `ARGS`      | `20`                   | white-square                | white       | dark  |            | ours         |
| `pybricks_method_call`             | `ARGS`      | `20`                   | white-square                | white       | dark  |            | ours         |
| `pybricks_wait`                    | `TIME`      | `20`                   | white-square                | white       | dark  | `ms`       | pybricks-svg |
| `pybricks_import`                  | `MODULE`    | `pybricks.tools`       | white-square                | white       | dark  |            | ours         |
| `pybricks_import`                  | `NAME`      | `wait`                 | white-square                | white       | dark  |            | ours         |
| `pybricks_import_as`               | `MODULE`    | `robot`                | white-square                | white       | dark  |            | ours         |
| `pybricks_import_as`               | `NAME`      | `attachment1`          | white-square                | white       | dark  |            | ours         |
| `pybricks_import_as`               | `ALIAS`     | `attachment_a`         | white-square                | white       | dark  |            | ours         |
| `pybricks_comment`                 | `TEXT`      | `# note`               | white-square                | white       | dark  |            | ours         |
| `pybricks_raw_code`                | `CODE`      | `ATTACHMENTS = [`      | white-square                | white       | dark  |            | ours         |

`field_label` fields (`pybricks_call.NAME`, `pybricks_method_call.OBJ` / `METHOD`) are static text, not editable fields, so they have no row.

`pybricks_wait`'s `TIME` field ships as a plain white `field_input` in v1.75.5. Pybricks renders it as a number inside a pill with `ms` as a separate static label after it (`docs/pybricks-blocks/flow/pybricks_blockWaitTime.svg`), so v2b.2b converts it to the pill-with-white-square shape plus the `ms` suffix.

## Not yet implemented

BLOCK_DESIGN.md and the roadmap name blocks that no file registers today. No rows exist for these — their fields are unknown until the block lands.

- `pybricks_hub_light_on` — `hub.light.*` is v2e; no block file, no fixture usage.
- `pybricks_hub_display_text` / `.image` — v2e.7.
- `pybricks_pid` — v2e.1.
- `pybricks_hub_button` — Step 39.

## Implementation recipe for v2b.2b

Order matters. Do not skip.

1. **Confirm mechanism.** Pybricks draws pills as `<path>` with `rx =
height / 2` arcs, not as `<rect rx="...">`. Two feasible approaches:
   (a) subclass the field class and replace `borderRect_` with a `<path>`
   in `initView()`, or (b) write a custom renderer that draws pill shapes
   for specific field types. Ship one test rendering each shape and
   asserting the rendered path.

2. **Convert white-in-pill fields first.** Numeric literals in
   `drive.straight` / `drive.turn` `AMOUNT` and `drive configure` `VALUE`.
   Verify against the `150 mm/s` example above.

3. **Convert pill dropdowns second.** Every `field_dropdown` whose value
   is an enum.

4. **Convert transparent square dropdowns third.** `drive speed`,
   `towards`, `straight`.

5. **Colour chit last.** `Color.RED` → `(●)` circle with swatch-grid
   picker. Not used by any current block; wait for `hub.light`.

6. **Verify against Pybricks screenshots.** Each converted block
   compared side-by-side before merging.

## Deferred from v1.5

Every v1.5 block ships with a plain white `field_input` — no pills, no
transparent squares. This file describes the v2b.2b target. Do not change
shadow rendering or field rendering in v1.5.
