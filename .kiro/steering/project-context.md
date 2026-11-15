---
inclusion: always
---

# Project context — Python to Blocks

A **read-only Pybricks Python viewer** for FLL / SPIKE Prime teams that is growing into an
editable block IDE. It parses Pybricks Python with `@lezer/python`, renders it as Blockly blocks
on the **Zelos** renderer, resolves imports across files, and shows the source in Monaco with
bidirectional highlighting.

Editing is gated behind `?editable=1`. **The default on `main` is read-only, always.**

---

## 1. Non-negotiables

| Rule                                                                                   | Why                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `readOnly: true` by default on both Blockly and Monaco                                 | v1 contract. Only `?editable=1` flips it          |
| The build must stay a single `dist/index.html`                                         | Opens via `file://` on school machines            |
| Monaco imported **only** via `monaco-editor/editor/editor.api.js`                      | Workers break the single-file build               |
| Block colours come from each block's own definition, never the theme                   | `AGENTS.md` rule                                  |
| Every block type must be imported for side effects in `src/main.ts`                    | Otherwise `Unknown block type` at render          |
| `pybricks_setup` hat is skipped in both sync directions                                | It spans the whole file; highlighting it is noise |
| Source ranges are plain block properties (`sourceStart`/`sourceEnd`), not `extraState` | Read by both sync directions                      |
| No block icons before v2d.1                                                            | v2b ships text placeholders                       |
| No screenshots as AI verification                                                      | DOM assertions only                               |

## 2. Stack and commands

- TypeScript, Vite, **Blockly 13** (Zelos), Monaco (API entry only), `@lezer/python`, `@blockly/continuous-toolbox`, Vitest
- `npm run test` — currently **8 files / 33 tests**, all green
- `npm run build` — `tsc` + Vite, writes `dist/index.html` (~3.9 MB)
- `tsc` runs with `noUnusedLocals` / `noUnusedParameters` — an unused import fails the build even when tests pass

## 3. File map

| Path                                                 | Role                                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`                                        | Bootstrap, fixtures, file switching, upload merge, theme, both sync directions, toolbox `BLOCK_CREATE` listener |
| `src/walk.ts`                                        | `@lezer/python` walk → `BlockDescriptor` → `materialize` into Blockly                                           |
| `src/resolve.ts`, `src/symbols.ts`, `src/objects.ts` | Cross-file name resolution (`Motor`, `DriveBase`, `ColorSensor`, async kinds)                                   |
| `src/blockly.ts`                                     | `Blockly.inject` options + `toolboxXml`                                                                         |
| `src/theme.ts`                                       | Light/dark Blockly themes (`pybricksTheme`)                                                                     |
| `src/editor.ts`                                      | Monaco wrapper (`PyEditor`)                                                                                     |
| `src/sidebar.ts`, `src/tabs.ts`                      | File list / upload / drag-drop / resize; open-file tabs                                                         |
| `src/blocks/*.ts`                                    | One file per block family; registers `Blockly.Blocks[...]`                                                      |
| `src/fields/*.ts`                                    | Custom field classes + `colourUtils.ts`                                                                         |
| `src/flyoutClone.ts`                                 | Flyout clone-on-hover overlay (v2b.2)                                                                           |
| `src/blocks/shadows.ts`                              | Shared helper — sets `math_number` shadow on value inputs                                                       |
| `src/themes/one-dark.json`, `one-light.json`         | Atom One Dark/Light Monaco token themes (v2a.2)                                                                 |
| `src/style.css`, `src/pybricks.css`                  | App chrome; Blockly field/comment styling                                                                       |
| `fixtures/*.py`                                      | Four demo files imported with `?raw`                                                                            |
| `docs/BLOCK_DESIGN.md`                               | Palette + Python→block mapping (source of truth for colours)                                                    |
| `docs/FIELD_DESIGN.md`                               | Field shapes, lightness rules, dropdown semantics (source of truth for shapes)                                  |
| `docs/ROADMAP.md`                                    | Step ledger. Only ✅ when code exists **and** tests pass                                                        |
| `AGENTS.md`                                          | Read-only contract, fragility list, testing rules                                                               |

## 4. Colour palette (`docs/BLOCK_DESIGN.md`)

Fill = block colour. Field fill (pills only) = **block × 0.85**. Stroke = **block × 0.75**.
Square fields and square dropdowns are `transparent`, never darker.

| Family              | Fill      | Stroke    | Members                                                     |
| ------------------- | --------- | --------- | ----------------------------------------------------------- |
| Setup hat           | `#ffbf00` | `#bf8f00` | `set up` hat                                                |
| Python functions    | `#9a72a2` | `#74567a` | task, await, multitask, print                               |
| Output              | `#4c97ff` | `#3971bf` | motor, drive base, setup, drive.settings                    |
| Input               | `#5cb1d6` | `#4585a1` | sensor blocks (colour sensor, and future distance/force)    |
| Flow                | `#ffab19` | `#bf8013` | if/elif/else, wait, for, while                              |
| Variables / Calls   | `#ff6680` | `#bf4d60` | variables, imports, plain `def`, call blocks                |
| Hub display / light | `#9b6af6` | `#691ff0` | `hub.display.*`, `hub.light.*`                              |
| Data                | `#00cc99` | `#009973` | lists, geometry, **string literals**                        |
| Math                | `#59c059` | `#439043` | numbers, arithmetic (stroke corrected from stock `#467e46`) |
| Logic               | `#21a176` | `#197959` | booleans, comparisons, and/or (was wrongly `#5cb1d6`)       |

Hardware-object cyan `#46BAEC` is defined but never renders — chips are forced pink until v2d.1.

## 5. Custom fields (`src/fields/`)

| Class                   | Shape                                                             | Used for                                                                                                     |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `FieldPillDropdown`     | dark pill + arrow                                                 | selecting a **value** (variable, enum, port, hub, drive base)                                                |
| `FieldDarkSquare`       | square, `white` flag for light mode                               | creating a **name** (hub, motor, drive base, task, function, variable, ICON text)                            |
| `FieldWhiteInPill`      | `FieldNumber` subclass — white square inside darker pill + suffix | numeric literal with unit (`150 mm/s`, `20 ms`)                                                              |
| `FieldColourPill`       | `FieldDropdown` subclass — swatch + label + arrow                 | colour. Hex mode + **enum mode** (`COLOUR_MAP`, uppercase keys). `noWrapper` for the standalone colour block |
| `FieldQuotedTextInPill` | quote glyphs around a white field                                 | `print` argument only                                                                                        |

`colourUtils.ts` → `getFieldColours(block)` derives fill/stroke from the parent block colour.
`COLOUR_MAP` holds the 12 Pybricks colours with **uppercase keys** (`VIOLET` = `#8000ff`, rounded
up from 127.5 per the docs).

### Dropdown semantics (this is the rule; `FIELD_DESIGN.md` has two stale rows being fixed)

- **Transparent square dropdown = a verb / method / mode.** Which operation runs or how it runs:
  `straight`, `towards`, `icon`, `on`/`off`, `drive speed`.
- **Pill dropdown = a noun / value argument.** `Stop.HOLD`, `Port.A`, `Direction.CLOCKWISE`, `hub`,
  `drive base`, a variable name.

### Frozen class

`FieldWhiteInPill` must not be modified. A previous attempt to add prefix support widened the field
and raised the text baseline on all 10+ existing call sites. New shapes get new sibling classes.

## 6. Block inventory (shipped)

Setup hat · task · function · call · method_call · await · multitask · import / import_as ·
var_reporter (broken, see v2d.6b) · var_declare · var_set · comment · pass · raw_code ·
hub · motor_setup · drivebase_setup · drive_move · drive_reset · drive_use_gyro · drive_configure ·
motor_run · motor_reset_angle · motor_stop · for · while · if / if_else · try_except · return ·
raise · hub_display_icon / \_char / \_number / \_off · wait · print · hub_light ·
<<<<<<< HEAD
color_sensor_setup · color_sensor_color / \_reflection / \_ambient · colour ·
number (shadow only) · string · boolean
=======
color_sensor_setup · color_sensor_color / \_reflection / \_ambient · colour

> > > > > > > 4a5b045ca6cf87af238f74706b93a258375e05f7

**Toolbox** uses `kind: "label"` sub-headers inside categories — never a new top-level category for
one block.

## 7. Walker conventions

- Dispatch order matters. Three-level members (`hub.light.on`, `hub.display.icon`) are checked
  **before** two-level DriveBase/Motor dispatch. First match wins.
- Multi-level member reads have dedicated helpers (`readMember`, `readCallExpression`).
- Anything unrecognised becomes `pybricks_raw_code` — never dropped.
- `collectWaitCall` has a numeric gate; non-numeric falls back to the await wrapper.
- `collectPrintCall` accepts one positional arg; **multi-arg falls through to `pybricks_call`**,
  not raw — `run.py` contains `print("Mission error:", e)`.
- `collectVariableBlock` classifies RHS as `Number` / `String` / `Boolean`; anything else
  <<<<<<< HEAD
  (identifier, call, expression) returns `undefined` from `collectValueReporter` and the whole
  assignment falls to raw. The variable block is never emitted for non-literal RHS.
- Value children (`pybricks_number`, `pybricks_string`, `pybricks_boolean`) are connected via
  `descriptor.inputs` and materialised by `materializeInputs`. `setShadow(true)` is called on
  each connected value child so Zelos uses compressed shadow geometry (`r=16/h=32`).
  =======
  (identifier, call, expression) is expected to fall to raw until call/variable reporters exist.
  > > > > > > > 4a5b045ca6cf87af238f74706b93a258375e05f7
- `collectColorSensorRead` handles the variable form only; `hub.port.X.device.*` is deferred to v2e.
- `multitask` uses `loadExtraState({ taskCount })` **before** `initSvg()`.
- Mutators are removed after load with `block.removeIcon(Blockly.icons.IconType.MUTATOR)` —
  `setVisible` does not exist in Blockly 13.

## 8. Fragile code — do not "clean up" without a test

- `collectBody`: no `lastBlock`; inline comments attach via `statements.at(-1)` guarded by
  `statements.length > 0`. `await` is a transparent wrapper for comment attachment.
- Docstring consumption: the first bare string expression in a body becomes the parent's comment
  and is consumed. `docstringConsumed` is never reset mid-body.
- Comment-bubble clicks walk up to the nearest `data-id`. Do **not** add a `revealRange` branch for
  comment icons — it steals focus and closes the bubble.
- Reverse sync: 50 ms debounce, narrow ranges first, then `statementStart`/`statementEnd` fallback.
  Uses `workspace.highlightBlock(id)` only — never `select`/`setSelected` (would loop).
- Forward sync: reads clicks off the SVG `data-id` because `readOnly` suppresses gesture `SELECTED`.
- `revealRange` builds an **inverted** selection (anchor at end, caret at start) so `await home()`
  maps to the await wrapper. Do not "fix" the argument order.
- `clearSelection` suppresses `onCursorChange` for 100 ms — removing it re-glows the cleared block.
- `materialize` measures the bounding box **before** creating each block, so floating functions land
  below existing content.
- `applyFieldValue` falls back to the shadow block when the named field is absent.
- File switching order: `workspace.clear()` → `renderFile` → `editor.setValue` → `setActive`.
- `applyTheme` must call `workspace.setTheme`, `workspace.render()`, and `editor.setTheme`.
- Upload merge: `hasUploaded` — first upload replaces fixtures, later uploads merge.
- `resolveProject` is recomputed on upload only.
- `highlightSubtree` must skip the next-sibling (`includeNext` flag) or a task glows the whole file.
- `getMultitaskComments` matches by start offset, not node-type counting.
- Click listener exists on **both** `.blocklyMainBackground` and the canvas — they are siblings.

## 9. Testing and acceptance

- `src/acceptance.test.ts` is the product contract: raw-block counts per fixture.
- **Baselines:** `robot.py = 0`, `exampleattach.py = 0`, `run.py = 0`, `main.py = 1`
  (the tuple-unpacking55 hub light · #56 colour sensor · #57 print · #58 wait · #59 variables · #62 value slots. assignment, deferred to Step 38.5).
- Baselines may **rise** when a step honestly refuses to render something it cannot represent.
  Record the delta and the reason in the roadmap. Never lower a baseline to hide a regression.
- Every new block gets a test: the cheapest places are `src/walk.test.ts` (descriptor assertions
  with a stub workspace) and `src/acceptance.test.ts`.

## 10. Git, PR and roadmap conventions

- Commit: `Step <ID>: <one line>` — no trailing period, no `feat:` prefix.
- Checkpoints: `Step <ID> (WIP): <what works>`.
- Roadmap is updated **in the same PR**: flip the step to ✅, cite the files/functions, and never
  check off a step whose commit isn't in `git log`.
- Superseded steps are marked ✅ with "Superseded by <step>" — never deleted, never renumbered.
- The coding agent writes its own PR title and description. **The human runs the merge.**
- Start-of-step commands given to the human are exactly two lines:
  `git checkout main && git pull` then `git checkout -b <branch>`.
- Temporary fixtures are added for verification and **removed in the final commit before the PR**.

## 11. Status at handoff

**Shipped:** v1.0.0 · v1.1.0 · v1.5.0 · v1.75.0 · v2a.1 · v2a.2 · v2b.1 · v2b.2 ·
v2b.2b.a/b/c · c-fix-a/b/c · d.2 (hub light) · d.3 (colour sensor) · d.4 (wait) ·
d.5 (variable name fields) · v2b.2c.a (print) · v2b.2b.e (value slots + reporters).

**Latest merged PRs:** #54 colour pill · #55 hub light · #56 colour sensor · #57 print ·
#58 wait · #59 variables · #62 value slots.

### Immediate next action — v2b.2b.e.1 (code)

Next branch: `v2b-2b-e-1-slot-migration`.

### Then — v2b.2b.e.1

- Apply the same field→slot pattern to the remaining `FieldWhiteInPill` call sites: `wait.TIME`, `drive_move.AMOUNT`, `drive_reset.DISTANCE/ANGLE`, `drive_configure.VALUE`, `motor_run.SPEED/VALUE/DUTY`, `motor_reset_angle.VALUE`
- `FieldWhiteInPill` stays untouched; the migration replaces its use at the block level

### After that

`v2b.2b.e.1` → `v2b.2c.b` (stop/run) → `v2b.2c.c` (drive) → `v2b.2c.e` (Logic+Math rebuild) →
`v2b.2c.f`/`g` (call reporters) → `v2b.3` (gestures, undo) → `v2b.4` (blocks → Python) →
`v2b.5` (reverse sync) → `v2b.6` (save/load) → `v2b.7` (error recovery)

### Docs ownership

Post-merge, Kiro Crew opens a separate `chore/docs-<step>` branch, updates ROADMAP/FIELD_DESIGN/BLOCK_DESIGN/project-context §7-11, and opens a docs PR. Scope limited by §14.

## 12. Locked decisions and deferrals

| Decision                                                                                                                             | Where                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Variable default slot = **new white-pill number shadow**, not `math_number`; shadow-only, no toolbox entry                           | v2b.2b.e                     |
| String reporter = Data green `#00cc99`, toolbox Operators → Text                                                                     | v2b.2b.e                     |
| Boolean reporter = Logic green `#21a176`, toolbox Operators → Logic; stock `logic_boolean` stays visible until v2b.2c.e              | v2b.2b.e                     |
| `pybricks_var_reporter` is **out of spec** (fixed NAME, forced pink). Not wired into slots. Rebuild = v2d.6b                         | v2d.6b                       |
| Import MODULE/NAME pill dropdowns (a static table would be hardcoded) → **v3**                                                       | v3                           |
| Block icons, real SVG quotes, real separators → **v2d.1**                                                                            | v2d.1                        |
| `hub.port.X.device.*` reads and the `detectable_colors` setter → **v2e**                                                             | v2e                          |
| Control-flow conditions become `input_value` with hexagonal booleans (Scratch/SPIKE convention) and `check: null` so numbers connect | future step, decision locked |
| `print(x)` and `print("x")` currently render identically; v2b.4 must disambiguate via the resolved table                             | v2b.4                        |

## 13. Human preferences (learned the hard way)

- **No screenshots.** DOM only. Screenshots are a known AI weak spot.
- **No invented sub-steps.** Use the roadmap's own numbering; add suffixes when splitting.
- **Plain language.** Never expose Blockly internals in human-facing text.
- **Always use references.** If an SVG isn't on disk, stop and ask.
- **No icons before v2d.1.** Text placeholders are correct, not a bug.
- **Never modify a verified shared field class** to satisfy one new block.
- **Never tell the agent to merge.** It opens the PR; the human merges.
- **Honest baselines.** A rising raw-block count is information, not failure.
- The human says "defaults" when they trust the proposed choices — proceed without re-asking.

## 14. Editing this file

When updating `project-context.md` after a merge:

- ✅ Update §7 (walker conventions), §8 (fragile code), §9 (baselines), §11 (status).
- ❌ Do NOT edit §1 (non-negotiables), §12 (locked decisions), §13 (human preferences).
- ❌ Do NOT edit `.kiro/agents/copilot-planner.md` — that file is human-owned.
- If a fact in §1–§6 or §12–§13 looks stale, say so and stop. Do not fix it.
