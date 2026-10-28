# Roadmap

**Current version: v1.75.0 (shipped 2026-10-28).** v1.75 is complete — UI polish bridge between v1.5 and v2. Canvas controls (zoom in/out/fit/sound), hide-blocks toggle, dedicated `wait` block, and Material-style morph animations for code / volume / hide-blocks icons. No Docker deploy — tag + GitHub release only.

**Milestones:**

- v1.5 — finish the viewer (control flow, hub blocks) — shipped as v1.5.0
- v1.75 — UI polish (bridge) — shipped as v1.75.0
- v2a — Monaco + tabs — next
- v2b — Editable blocks (the big one)
- v2c — Intellisense (pyodide + jedi + ide-docs)
- v2d — Polish (icons, comments, categories, snap-to-grid)
- v2e — Full Pybricks API coverage (PID, getters, sensors)
- v2 wrap-up — PWA + Tauri
- v3 — Hardware integration, terminal, remaining API surface

Realistic effort from v1.1.0 to end of v2: **~3–5 months** of focused work at a sustainable pace. v2b alone (full round-trip editing) is the bulk of it.

Steps are listed in build order. Each step is a self-contained Copilot prompt.

**Mark a step ✅ only when the code is present AND `npm run test` passes.**

Step numbers follow `git log --oneline`. Do not renumber to close gaps; add a suffix instead.

## Parsing foundation

- ✅ **Steps 1–4** — Vite/TypeScript scaffold, `@lezer/python` parser, symbol table (`src/symbols.ts`), object table (`src/objects.ts`), cross-file resolution (`src/resolve.ts`)

## Blockly rendering

- ✅ **Steps 5–10** — Blockly shell (`src/blockly.ts`), raw-code walker (`src/walk.ts`), `set up` hat (`src/blocks/setup.ts`), task/function blocks (`src/blocks/task.ts`, `src/blocks/function.ts`), import blocks (`src/blocks/importBlock.ts`), call blocks + await wrapper (`src/blocks/call.ts`, `src/blocks/await.ts`)

## Pybricks blocks

- ✅ **Step 11a** — DriveBase blocks: `straight`, `turn`, `reset`, `use_gyro` (`src/blocks/driveBase.ts`)
- ✅ **Step 11a.5** — DriveBase `settings()` → up to four `configure` blocks (`collectDriveSettingsBlocks` in `src/walk.ts`)
- ✅ **Step 11b** — Motor blocks: `run_target`, `run_angle`, `run_until_stalled`, `reset_angle`, `stop` (`src/blocks/motor.ts`)
- ✅ **Step 12** — Variable blocks: `create variable X = value`, `set X to value` (`src/blocks/variable.ts`)
- ✅ **Step 13** — Comment blocks (grey) + inline comment attachment (`src/blocks/comment.ts`, `collectBody` in `src/walk.ts`)
- ✅ **Step 14** — Hardware setup blocks: `PrimeHub`, `Motor`, `DriveBase` (`src/blocks/hardware.ts`)
- ✅ **Step 14.5** — Hardware wording pass + DriveBase `NAME` field
- ✅ **Step 15** — Top-level expressions verified, star-args fallback confirmed
- ✅ **Step 16** — Variable chips in Pybricks block args (`applyArgument` in `src/walk.ts`, `src/blocks/variable.ts`)
- ✅ **Step 16.5** — Chip text colour, cursor polish (`src/pybricks.css`)
- ✅ **Step 17** — `multitask` block with statement slots + mutator (`src/blocks/multitask.ts`)
- ✅ **Step 17.5** — `pass` block (`src/blocks/pass.ts`)
- ✅ **Step 18** — Docstrings as comment icons on the parent block (`docstringConsumed` in `src/walk.ts`)
- ✅ **Step 18.5** — Acceptance test: 0 raw blocks in `robot.py` and `exampleattach.py` (`src/acceptance.test.ts`)

---

## v1 — production-ready viewer

**Goal:** a working viewer on real deployment targets. `robot.py` and `exampleattach.py`
render with zero raw blocks. The user can switch files, upload their own project, open
the app offline as a single `.html`, and reach a hosted URL.

### Closeout

- ✅ **Step 18.75** — Update `docs/OVERVIEW.md` with revised v1 criterion
- ✅ **Step 19** — Resizable file sidebar (`src/sidebar.ts`); fixtures refreshed; opens on `main.py`
- ✅ **Step 20** — Single-file HTML export (`vite-plugin-singlefile` in `vite.config.ts`). `dist/index.html` opens via `file://`.
- ✅ **Step 21** — File upload and drag-and-drop to sidebar; first upload clears fixtures, subsequent uploads merge

### Deploy

- ✅ **Step 22** — Docker deployment files (`Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`). No local build — the LXC builds on `docker compose up --build`.
- ✅ **Step 22.5** — Release: `npm version 1.0.0`, tag `v1.0.0`, push to GitHub. Then the LXC does `git checkout v1.0.0 && docker compose up -d --build`.
- ⬜ **Step 23** — NPM: create proxy host pointing at `LXC-IP:8080`, SSL via Let's Encrypt, confirm the public URL loads. No code in this repo; cannot be verified from the tree.
- ⬜ **Step 24** — Verify on real targets: school Windows (single-file `index.html` via USB/email, and hosted URL if the domain isn't blocked) and Ubuntu Chromebook (both single-file and hosted URL). Manual check; cannot be verified from the tree.

**v1 is done when** any of these works for your teammate:

- The single-file `index.html` opens via `file://` on a school Windows machine, files upload, blocks render
- The hosted URL (via NPM) loads and works the same way

### Deferred from v1 (moved to v1.25 or v2)

- **PWA** — single-file already covers offline; PWA adds install-from-domain which needs Docker first. Reassess after Docker + school test if a hosted installable app is still wanted.
- **Tauri desktop** — only relevant if school Windows blocks `file://` execution. If school test fails, escalate to v2 planning.

---

## v1.25 — editor integration

**Goal:** read-only Monaco panel beside the blocks, with bidirectional highlighting. This is the feature that makes the tool more than a viewer.

### Prerequisite (do first, or highlighting drifts)

- ✅ **Step 25a** — Refactor `renderFile` through `collectBlocks` + `materialize`; attach `sourceStart`/`sourceEnd` as direct block properties (`src/walk.ts`)
- ✅ **Step 25b** — Acceptance test uses `collectBlocks` instead of its independent counter

### Monaco panel

- ✅ **Step 26** — Read-only Monaco panel to the right of the blocks, with a toggle button (`src/editor.ts`, `#toggle-editor-btn` in `index.html`)
- ✅ **Step 26.5** — Draggable splitter, Pybricks dark theme, floating controls (`#editor-splitter` in `src/style.css`, `pybricksDark` in `src/theme.ts`, `#app-controls`)
- ✅ **Step 26.5b** — Material Symbols variable font with FILL animation (font link in `index.html`, `font-variation-settings` in `src/style.css`)
- ✅ **Step 26.5c** — SVG morph code button with exact path slide animation (three paths `code-chevron-left` / `code-slash` / `code-chevron-right` in `index.html`, transform + `--reveal` mask rules in `src/style.css`)
- ✅ **Step 26.6** — Sun/moon ligature animation + smooth theme transition (`theme-icon-sun` / `theme-icon-moon` in `src/style.css`)
- ✅ **Step 26.7** — Blockly background transition, splitter gap fix, Monaco transition attempt (`.blocklySvg` transition in `src/style.css`)
- ✅ **Step 26.8** — Linear easing for theme-colour transitions; Monaco internal element transitions (`src/style.css`)
- ✅ **Step 27** — Click a block → Monaco selects and reveals its source range (`revealBlockSource` in `src/main.ts`)
- ✅ **Step 27.5** — Native click handler for read-only Blockly (`data-id` walk in `src/main.ts`)
- ✅ **Step 27.6** — Per-name source ranges for import blocks (`statementStart`/`statementEnd` in `src/walk.ts`)
- ✅ **Step 28** — Click in Monaco → Blockly highlights the block whose range contains the cursor (`onCursorChange` in `src/main.ts`)
- ✅ **Step 28.1** — Import-line fallback + deselect on blank canvas click (`src/main.ts`)
- ✅ **Step 28.2** (partial) — Background click clears both panels (`.blocklyMainBackground` listener in `src/main.ts`); await/task reverse-sync precision (`revealRange` anchors at the end and puts the caret at the start via `new monaco.Selection(endLine, endCol, startLine, startCol)` in `src/editor.ts`); cascade glow to descendants (`highlightSubtree` in `src/main.ts`)
- ✅ **Step 28.5** — Multitask argument comments + hide the mutator gear (`getMultitaskComments` and `block.removeIcon(Blockly.icons.IconType.MUTATOR)` in `src/walk.ts`)
- ✅ **Step 28.5b** — Per-argument comment icons on multitask inner blocks (`getMultitaskComments` returns `{ multitask, perArg }`; argument descriptors receive `commentText` in `collectExpressionStatement`)

**v1.25 is done when** the Monaco panel and both sync directions work on every fixture. Every step above is done and shipped as **v1.1.0**. Step 29 was optional and was not needed.

### Tabs (only if the sidebar alone isn't enough)

- ⬜ **Step 29** — Optional: horizontal tabs on top of the sidebar (VS Code style). Do this only if the sidebar becomes painful with more files.

---

## v1.5 — make infrastructure legible

**v1.5 is done when** `robot.py`, `exampleattach.py`, and `run.py` render with 0 raw blocks, and `main.py` renders with at most 1 raw block (the tuple-unpacking assignment, deferred to optional Step 38.5). Rule: no _simple_ construct becomes a raw block. Simple = literal, variable reference, call, method call, binary arithmetic, enum reference, subscript, list literal. Anything more complex may remain raw until a later milestone.

**Recommended batching:** 2–3 steps per PR. The walker is fragile and control flow is the highest-risk change. Do not attempt all steps in one branch.

### Control flow

- ✅ **Step 30** — `for` loops (`src/blocks/for.ts`, `collectForBlock` in `src/walk.ts`). `run.py` has `for i, mission in enumerate(missions):` — needs tuple unpacking in the loop target.
- ✅ **Step 31** — `while` loops (`src/blocks/while.ts`, `collectWhileBlock` in `src/walk.ts`). `main.py` has `while True:` at module level and inside `pick()`.
- ✅ **Step 32** — `if` / `elif` / `else` with `in` operator support (`src/blocks/if.ts`, `collectIfBlock` in `src/walk.ts`). `main.py` has `if Button.LEFT in pressed:` / `elif` / `elif`.
- ✅ **Step 33** — `try` / `except` blocks (`src/blocks/tryExcept.ts`, `collectTryExceptBlock` in `src/walk.ts`). `run.py` has `try: await mission() except Exception:`. **Limitation:** the exception text is kept verbatim and only a single `VariableName` is read, so `except ValueError as e:` (an `AsPattern`) is not handled — the `as e` binding is dropped.
- ✅ **Step 34** — `return` block (tuple values: `return i, ATTACHMENTS[i][1]`) and `raise` block (`run.py` re-raises) (`src/blocks/returnRaise.ts`).

### Expression depth

- ✅ **Step 35** — Hub display blocks: `hub.display.icon`, `.char`, `.off`, `.number` (`src/blocks/hub.ts`, `collectHubDisplayCall` in `src/walk.ts`). `readMember` only reads a direct `VariableName` child, so the three-level `hub.display.icon` chain needed its own reader. Blocks render as `[hub ▾] display [method ▾] <arg>` in SPIKE purple. `hub.display.number` is not used by any fixture — it ships for future code. `hub.buttons.pressed()` is v2b.2b; `hub.light.*` is v2e. `hub.display.image` and `.text` are v2e.7.
- ✅ **Step 36** — Acceptance test extension. Baseline raw-block count for `main.py` and `run.py`; hard-fail regression guard. (Subscripts stay as text inside existing fields in v1.5 — see v2b.2b.) (`src/acceptance.test.ts`, commit `5548520`)
- ⬜ **Step 38** — Non-literal assignment RHS. `collectVariableBlock` accepts any expression as the RHS, not just `Number`/`String`/`Boolean`. Fixes `i = start`, `pressed = hub.buttons.pressed()`, `i = (i-1) % len(ATT)`, and `NEXT_ICON = Icon.LEFT + Icon.RIGHT`. List literals render inside the existing VALUE field as text — not as a new block type — because Pybricks' own ListCreate block (`docs/pybricks-blocks/data/pybricks_blockListCreate_list_3.svg`) uses +/- mutator buttons that are v2b.2b work. Tuple unpacking is deliberately excluded (see Step 38.5).
- ⬜ **Step 38.5** — Tuple unpacking (`index, attach_main = pick(...)`). Needs a new `pybricks_var_unpack` block that mirrors Pybricks' `pybricks_blockListUnpack` block (`docs/pybricks-blocks/data/pybricks_blockListUnpack.svg` — statement block, `unpack list [▾] to >`, expandable right side). Deferred from v1.5 because the block needs a mutator (variable count), which is v2b.2b scope. After Step 38+41 land, `main.py` has exactly 1 raw block (this tuple unpack) and `run.py` has 0. **Optional for v1.5** — if the mutator complexity is not worth it, v1.5 can ship without this step and the block stays raw indefinitely.

### Hub API blocks

- ✅ **Step 41** — `except X as e:` renders as a block. The parser emits the clause as three flat siblings (`VariableName`, `as`, `VariableName`) — there is no `AsPattern` node — so `collectTryExceptBlock` tracks an `as` flag and fills both `EXCEPTION` and `AS_NAME`. `run.py` drops to 0 raw blocks. (`src/blocks/tryExcept.ts`, `collectTryExceptBlock` in `src/walk.ts`, commit `f10fbde`)
- ✅ **Step 42** — Final v1.5 sweep (`src/acceptance.test.ts`). v1.5 goal met: robot.py = 0, exampleattach.py = 0, run.py = 0, main.py = 1 (tuple unpack, deferred to optional Step 38.5).

**Step 37 was skipped.** Chained call member (`run_task(attach_main()).wait()`) is not needed for v1.5: `fixtures/main.py` no longer calls `.wait()` — `run_task` is itself the blocking call. The step moved to **v2e.6** so the capability is not lost, but nothing in v1.5 depends on it. Step numbers are not renumbered; the gap is intentional.

**Steps 39 and 40 were reclassified.** The `hub.buttons.pressed()` value block (was Step 39) and the dedicated `wait` block (was Step 40) were never part of the v1.5 goal: both render as non-raw blocks today (a generic method-call block and an await-wrapped call block). The `wait` block moved to v1.75 as polish work — see v1.75.5. The `hub.buttons.pressed()` block moved to v2b.2b, because it needs `input_value` slots that v1.75 does not add.

---

## v1.75 — UI polish (bridge)

**Goal:** Close the remaining v1.5 polish work and visual gaps identified after v1.5 shipped, before v2 editable work begins. No editable features, no v2 dependencies. Three DeepSeek-implementable steps (v1.75.1, v1.75.3, v1.75.5) plus one Copilot animation fix (v1.75.2). Ships as **v1.75.0** — tag + GitHub release, **no Docker deploy**.

- ✅ **Step v1.75.1** — Blockly canvas controls. Hide Blockly's built-in zoom buttons and add Material Symbol buttons in the top-right of the block canvas: zoom in, zoom out, zoom to fit, sound mute. Uses `workspace.zoomCenter(±1)`, `workspace.zoomToFit()`, `workspace.getAudioManager().setMuted()`. Fixes missing zoom icons on Ubuntu Chromebook. (`src/main.ts`, `src/style.css`, `src/blockly.ts`, commit `782a991`)

- ✅ **Step v1.75.2** — Refine the code SVG morph, animate the volume slash, and replace the v1.75.3 hide-blocks visibility ligatures with the Material `code_blocks` icon and matching slash. All three SVGs use a 250ms Material-eased dash-offset slash animation. The hide-blocks change is a design revision, not a bug fix. See `docs/HIDE_BLOCKS_ICON.md`. (`index.html`, `src/style.css`, `src/main.ts`, commit `2d315d5`)

- ✅ **Step v1.75.3** — Hide-blocks toggle. A button that hides the Blockly canvas and the splitter, leaving only the sidebar and Monaco. Toggling back restores both. Coexists with the existing code-panel toggle at bottom-right. (`index.html`, `src/main.ts`, `src/style.css`, commit `d6c6f18`)

- ✅ **Step v1.75.5** — `wait` block. Add a dedicated `pybricks_wait` statement block for `await wait(ms)`. Currently renders as an await-wrapped `pybricks_call NAME=wait` block; upgrade it to a proper Pybricks-style block with a numeric field. `run.py` uses `await wait(20)` twice. (`src/blocks/wait.ts`, `collectWaitCall` in `src/walk.ts`, commit `077cfb3`)

**Step v1.75.4 moved to v2b.2b.** The `hub.buttons.pressed()` value block was reclassified — routing it as a proper value block requires `input_value` slots on `var_set`, `while`, and `if`, which are part of the field-shape work (v2b.2b). v1.75 ships with 3 steps plus the Copilot animation fix (v1.75.2).

---

## v2 — Editable IDE (feature-flagged on `main`)

**v2 is gated behind `?editable=1`.** `readOnly: true` remains the default on `main` throughout v2 development. The flag flips to default-on when v2 ships. Individual steps land on short-lived feature branches and merge to `main` normally — no persistent v2-dev branch, no second ruleset.

**Sequence:** v2a → v2b → v2c → v2d → v2e → wrap-up. No skipping.

---

### v2a — Monaco + Tabs (est. 1–2 weeks)

VS Code pattern: sidebar keeps file list, clicking a file opens it as a tab, tabs can be closed, clicking an already-open file just focuses its tab.

- ⬜ **Step v2a.1** — Tab bar UI above Monaco; clicking a sidebar file opens it as a tab; close button per tab; state persists across file switches
- ⬜ **Step v2a.2** — Token colors match block palette at **category level**: every DriveBase call is Output blue, every Motor call is Output blue, every Flow block is Flow orange. Not method-level — `drive.straight(...)` and `drive.settings(...)` share the same blue because both are DriveBase calls. Categories and hex values come from `docs/BLOCK_DESIGN.md` (the source of truth), not from this file. Uses `monaco.editor.defineTheme`. Does not require pyodide.
- ⬜ **Step v2a.3** — Split editor (two Monaco panes side-by-side, optional)

---

### v2b — Editable blocks (est. 6–10 weeks, the biggest cluster)

Full round-trip: any block change produces correct Python, any Python change produces correct blocks, both stay in sync.

**Feature flag:** `?editable=1` flips `readOnly: false`, shows toolbox, enables gesture editing.

- ⬜ **Step v2b.1** — Feature flag infrastructure: `editable=1` param flips `readOnly`, shows a "readonly/editable" indicator, gates all v2b features
- ⬜ **Step v2b.2** — Toolbox: read-only palette grouped by category (Setup, Output, Flow, Tasks, Data, Variables), drag-to-workspace enabled
- ⬜ **Step v2b.2b** — Input shapes: four field styles so a slot's expected type is visible without reading the Python. **Shape is fixed by the parameter's expected type, not by the current contents.**
  - **Circular slot** — numeric literal (`500` in `drive.straight(500)`)
  - **Circular dropdown** — numeric enum or numeric variable (`Icon.HAPPY`, `Button.LEFT`, `Port.A`)
  - **Square dropdown** — text enum (`Stop.COAST` → `coast`, `Direction.CLOCKWISE` → `clockwise`)
  - **Square slot** — free text or complex expression (`print("hello")`, `(i - 1) % len(ATTACHMENTS)`, f-strings, variables used as values)
  - **Colour field** — a circular chit filled with the chosen colour and carrying no text, `(●)`. Clicking it opens a **grid of colour swatches** (SPIKE Prime pattern), not a text list. `Color.RED` → a red circle. This is a fifth shape, not a circular dropdown, so a reader knows "this is a colour" without reading the text.
  - **Unit suffixes are static text after the field, never inside it.** Pybricks renders `{drive base icon} \| (drive base ▾) configure [drive speed ▾] (150) mm/s` — the number sits in a circular field and `mm/s` is plain text after it. Suffixes vary by parameter: `mm/s`, `mm/s²`, `°/s`, `°/s²`, `mm`, `°`, `ms`. Verified against `docs/images/drive-settings-blocks.png`.
  - **Field fill is not white.** `()` is circular, `[]` is square, `{}` is an icon. Every circular dropdown and editable field uses a **darker shade of the block's own colour** with white text — Output's is `#4180d9` and Variables/Calls' is `#d9576d` (both confirmed), and the same rule applies to the `mm/s` / `°/s` value fields in `drive.settings()`. The `configure` parameter dropdown uses the **same** blue as the block. A number typed into a circular field renders as a **white square with dark text** inside a dark-blue circle with **no stroke**. Today every field is a white rect with dark text (`src/pybricks.css`), so this is a CSS + theme change, not just a shape change. Verified against `docs/images/setup-blocks.png`, `docs/images/drive-settings-blocks.png`, and `docs/images/variable-set-blocks.png`.
  - **The parameter-name dropdown in `drive.settings()` uses the same blue as the block**, not the darker field shade — it reads as part of the block body rather than as a field.
  - **Scope is selective:** migrate the Pybricks blocks first (`driveBase`, `motor`, `hardware`, `pid`). `call`, `rawCode`, `comment`, and `importBlock` fields are out of scope for the first pass.
  - **`hub.buttons.pressed()` value block.** Reclassified from v1.75.4. Needs `input_value` slots on `var_set`, `while`, and `if` so a value block can plug in. When those slots exist, add a cyan `pybricks_hub_button_is_pressed` value block and route `Button.LEFT in hub.buttons.pressed()` to it. See `docs/pybricks-blocks/hub/pybricks_blockButtonIsPressed_PrimeHub.svg` for the reference shape.
  - **Subscript expressions** (`ATTACHMENTS[i][0]`) become real Data-green reporter blocks once `CHAR` / `VALUE` fields are `input_value` slots. Currently text in v1.5.
  - **Every new block from here on follows this design.** A block added in v1.5 or v2e uses the darker field fill, the correct shape per parameter type, and unit suffixes where Pybricks has them — not a white `field_input`. The v1.5 hub blocks (Steps 39–41) ship with `field_input` because v1.5 is blocks-only, and v2b.2b converts them.
  - **Raw-code blocks keep the current white text field** — raw code is unclassified and does not claim a shape. No separate raw block type.
  - **Variables are square.** Parse time cannot know a variable's type, so it never claims a numeric shape. Variable chips can be dropped into any slot; the slot keeps its parameter's shape.
  - See the "Field types" section in `docs/BLOCK_DESIGN.md` for the full mapping.
- ⬜ **Step v2b.3** — Block drag, connect, delete, undo/redo. Basic gesture editing working end-to-end.
- ⬜ **Step v2b.4** — Python generator: blocks → Python, exact output, verified against all fixtures byte-for-byte
- ⬜ **Step v2b.5** — Reverse sync: Python edits in Monaco re-render blocks (the hardest step — potentially splits into 2b.5a–2b.5c)
- ⬜ **Step v2b.6** — Save/load: download edited `.py` files, upload to replace project state
- ⬜ **Step v2b.7** — Error recovery: invalid block arrangements block the generator and show clear errors

**Note:** Full round-trip is the single largest workstream in the project. Pybricks' own `python-program-analysis` library is one-directional and took years. Realistic timeline assumes scope reduction may be needed (e.g., blocks→Python only) if v2b.5 proves too large.

---

### v2c — Intellisense (est. 2–4 weeks)

Pyodide + Pybricks' official Python tools. Combined download ~29 MB, cached after first fetch.

**Architecture:** Hosted version preloads pyodide; single-file version lazy-loads on demand via a "Enable intellisense" button (requires network).

- ⬜ **Step v2c.1** — Pyodide bootstrap in a Web Worker; feature-detect and lazy-load from the "Enable intellisense" button
- ⬜ **Step v2c.2** — Wire `@pybricks/jedi` (5.2 MB) for autocomplete, hover, signature help
- ⬜ **Step v2c.3** — Wire `@pybricks/ide-docs` (22.2 MB) for inline documentation
- ⬜ **Step v2c.4** — Wire `@pybricks/python-program-analysis` (1.9 MB, pure TS) for parse-time error checking
- ⬜ **Step v2c.5** — Error markers on blocks that don't round-trip correctly (integration with v2b)

---

### v2d — Polish (est. 2–3 weeks)

- ⬜ **Step v2d.1** — Block icons (replaces the current comment question mark with a proper icon set; consider Pybricks' actual icons or MD symbols). Reference: `docs/images/setup-blocks.png` shows the spike prime, motor, drive-base, wheel-diameter, axle-length, and rotation-direction icons. Target shape for the drive base setup block is `docs/images/drivebase-setup-mockup.svg` (approved 2026-10-25). Once icons land, drop the `new` prefix from the setup blocks so they read `{spike prime icon} \| [hub name]` and `{motor icon} \| [left] on (A ▾) with forward ({clockwise motor icon}▾)` like Pybricks. Also: drop the Hardware objects color mismatch — object chips are `pybricks_var_reporter` blocks hardcoded to `#ff6680` in `src/blocks/variable.ts` and forced pink by `src/pybricks.css`, so the cyan `#46BAEC` in `src/theme.ts` never renders. Chips should inherit the Hardware objects cyan once icons land.
- ⬜ **Step v2d.2** — Comment revamp: TurboWarp-style speech-bubble shape, subtle shadow, small rounded corners; matches modern Blockly feel rather than the current yellow default
- ⬜ **Step v2d.3** — Snap-to-grid for dragged blocks
- ⬜ **Step v2d.4** — "Clean up blocks" + "Clean up blocks+" in the right-click context menu (TurboWarp has both — basic stacks top-blocks, + also aligns within nested groups)
- ⬜ **Step v2d.5** — Block categories properly assigned; category colors verified against `docs/BLOCK_DESIGN.md`
- ⬜ **Step v2d.6a** — Argument dropdowns: motors as dropdowns instead of chips (dropdown arrow visible; values changeable in editable mode). Pybricks also puts a **drive base name dropdown** at the front of every configure block (`{drive base icon} \| (drive base ▾) configure [drive speed ▾] (150) mm/s` — `docs/images/drive-settings-blocks.png`), and lists variables in the `left`/`right`/`wheel diameter`/`axle length` slots of the drive-base setup block. **Keeps one chit per variable** — this step is mechanical, no serialization change.
- ⬜ **Step v2d.6b** — Unified variable chit: **one chit with a dropdown**, not one chit per variable (`docs/images/variable-chit.png`): `{variable icon} \| (WHEEL_DIAMETER ▾)`. The dropdown lists every variable in scope; picking a different one changes the chit in place. This replaces the v1.1.0 `pybricks_var_reporter` block, which hardcodes a single `NAME` field per variable. Because the chit is a dropdown, it can be dropped into any slot regardless of that slot's shape.
  - **Why this is split from 6a:** it is architecturally heavier. The walker must pass the full variable list to every reporter at render time; adding a variable in editable mode must update every chit's dropdown; and serialization stores a _selection reference_ rather than a name. That deserves its own PR and its own test, not a ride-along on mechanical dropdown work.
- ⬜ **Step v2d.7** — Sounds: connect, disconnect, delete, snap. Use default Blockly sounds initially; optionally Pybricks/SPIKE audio if licensing permits
- ⬜ **Step v2d.8** — Keyboard shortcuts: Ctrl+Z/Y undo/redo, Ctrl+C/V copy/paste, Delete to remove, Ctrl+A select all, Escape to deselect
- ⬜ **Step v2d.9** — Multi-select blocks (rectangular selection, drag-move, cut, copy)
- ⬜ **Step v2d.10** — Synchronized scrolling between blocks and Monaco. Anchor by source position, not by pixel scroll: find the block whose `sourceStart` is closest to the top of the Blockly viewport, look up its line number, scroll Monaco to that line. Reverse for the other direction. Must suppress the feedback loop — reuse the `suppressCursorChangesUntil` pattern from `src/editor.ts`. Test both directions against `exampleattach.py`.
- ⬜ **Step v2d.11** — Sync visibility improvements. Novice usability test found two problems: (a) the `.blocklyHighlighted` glow is invisible on a busy workspace, (b) reverse-sync does not scroll the block into view when it is off-screen. Fix: scroll the block into view when reverse sync fires, and strengthen the glow or draw a visible connector line from the Monaco selection to the block. Test with a fixture that has blocks off-screen.
- ⬜ **Step v2d.12** — Monaco panel discoverability. The same test found the panel was not noticed as interactive — the user had to be pointed at it three times. Fix: add a first-run hint ("click a line in the code to find its block") that dismisses after one use, or a persistent affordance (subtle arrow, panel border accent, etc.).
- ⬜ **Step v2d.15** — Preserve open comment bubbles across tab switches. Block IDs regenerate on every render, so tracking which block's bubble was open requires storing the source range and looking up the matching block after re-render. Deferred from v2a.1 polish.
- ⬜ **Step v2d.17** — Extend Monaco tokenizer with `support.function` and `support.constant` emissions. The existing tokenizer in `src/editor.ts` emits `keyword`, `string`, `number`, `comment`, `identifier`, `function` (after `def`), `type.identifier` (after `class`), `operator`, and `@brackets`. Missing: builtin function names (currently rendered as `identifier`) and ALL_CAPS constants (also `identifier`). Adding these two tokens lets `print` and `NEXT_ICON` look distinct from user identifiers.

---

### v2e — Full Pybricks API coverage (est. 2–3 weeks)

Every feasible Pybricks API call gets a block. Uses `@pybricks/ide-docs` to auto-generate block definitions from the current API where practical.

- ⬜ **Step v2e.1** — PID blocks (`src/blocks/pid.ts`). Pybricks' `Control.pid(kp, ki, kd, integral_deadzone, integral_rate)` sets or gets PID constants, reachable through `drive.heading_control`, `drive.distance_control`, and `motor.control`.
  - **Mirrors the `drive.settings()` pattern** (Step 11a.5): one block per parameter, a dropdown picks the parameter, a value slot holds the number. `collectDriveSettingsBlocks` in `src/walk.ts` is the dispatch shape to copy — it splits one Python call into several descriptors, each with its own `WHAT` field.
  - Block: `pid of [heading/distance/motor] [proportional/integral/derivative/integral deadzone/integral rate] set to (__)`. The value slot is **circular** (numeric literal).
  - Friendly parameter names map to the API: proportional → `kp`, integral → `ki`, derivative → `kd`, integral deadzone → `integral_deadzone`, integral rate → `integral_rate`. The mapping table lives in `docs/BLOCK_DESIGN.md`.
  - New block file, imported for side effects in `src/main.ts` (AGENTS.md: an unimported block file throws `Unknown block type` at render time).
- ⬜ **Step v2e.2** — Control getters. `kp, ki, kd = drive.heading_control.pid()` needs tuple-unpacking support that `collectVariableBlock` does not have (it only accepts `Number`/`String`/`Boolean` RHS). **Deferred: these stay raw until this step.**
- ⬜ **Step v2e.3** — Sensor blocks: color, distance, force
- ⬜ **Step v2e.4** — Sound and Light Matrix blocks
- ⬜ **Step v2e.5** — Remaining API surface not covered by v1.5 or v2e.1–v2e.4
- ⬜ **Step v2e.6** — Chained call member. `run_task(attach_main()).wait()` — a `CallExpression` whose callee is itself a `CallExpression`'s `MemberExpression`. Moved here from v1.5 Step 37: the current fixtures no longer use `.wait()`, so nothing in v1.5 depends on it, but real Pybricks code does.
- ⬜ **Step v2e.7** — Hub display `.image` and `.text`. Not used by any fixture; moved out of v1.5.

---

### v2 wrap-up — PWA + Tauri (est. 1–2 weeks)

- ⬜ **Step v2w.1** — PWA: install prompt, offline cache (intellisense excluded — requires network), service worker
- ⬜ **Step v2w.2** — Tauri: per-user NSIS installer, no admin, targets Windows (school) and Linux (Ubuntu Chromebook)
- ⬜ **Step v2w.3** — v2.0.0 release: flip feature flag default-on, tag, publish to GitHub Releases

---

## v3 — Full IDE replacement

Pybricks Code parity for FLL teams. Realistic effort: 2–4 months.

- ⬜ Bluetooth: Web Bluetooth connection to the hub, live file upload/download
- ⬜ Terminal: stdout/stderr capture, REPL, program output display
- ⬜ Menu / program-picker integration (select run from the tool, send to hub)
- ⬜ Any other Pybricks Code feature not yet covered

Full API coverage and PID blocks moved to **v2e** (2026-10-25) — they are block work, not hardware work.
