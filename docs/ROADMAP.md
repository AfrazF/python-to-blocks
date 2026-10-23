# Roadmap

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

### Tabs (only if the sidebar alone isn't enough)

- ⬜ **Step 29** — Optional: horizontal tabs on top of the sidebar (VS Code style). Do this only if the sidebar becomes painful with more files.

---

## v1.5 — make infrastructure legible

**Goal:** `run.py` and `main.py` render mostly as blocks. Both currently fall back to `pybricks_raw_code` for every construct listed below.

### Control flow

- ⬜ **Step 30** — `for` loops. `run.py` has `for i, mission in enumerate(missions):` — needs tuple unpacking in the loop target.
- ⬜ **Step 31** — `while` loops. `main.py` has `while True:` at module level and inside `pick()`.
- ⬜ **Step 32** — `if` / `elif` / `else` with `in` operator support. `main.py` has `if Button.LEFT in pressed:` / `elif` / `elif`.
- ⬜ **Step 33** — `try` / `except` blocks. `run.py` has `try: await mission() except Exception:`.
- ⬜ **Step 34** — `return` block (tuple values: `return i, ATTACHMENTS[i][1]`) and `raise` block (`run.py` re-raises).

### Expression depth

- ⬜ **Step 35** — Nested member expression dispatch. `readMember` in `src/walk.ts` only reads a direct `VariableName` child, so `hub.display.image(...)`, `hub.display.off()`, `hub.display.char(...)`, `hub.buttons.pressed()`, `hub.light.on(...)`, `hub.light.off()` all fall through to raw.
- ⬜ **Step 36** — Subscript expressions. Needed for `ATTACHMENTS[i][0]` and `ICONS[i % len(ICONS)]`.
- ⬜ **Step 37** — Chained call member. Needed for `run_task(attach_main()).wait()`.
- ⬜ **Step 38** — Non-literal assignment RHS and tuple unpacking. `collectVariableBlock` only accepts `Number`/`String`/`Boolean`, so `next_index = (index + 1) % len(ATTACHMENTS)`, `i = (i - 1) % len(ATTACHMENTS)`, and `index, attach_main = pick(next_index)` are raw.

### Hub API blocks

- ⬜ **Step 39** — Hub display blocks: `.image`, `.off`, `.char`, `.text`
- ⬜ **Step 40** — Hub button block: `.pressed`
- ⬜ **Step 41** — Hub light blocks: `.on`, `.off`
- ⬜ **Step 42** — `wait` block. Not used by the current fixtures; `main.py` only mentions `wait(10)` in a comment.

---

## v2 — editable blocks and native app

- Editable blocks → Python generation (round-trip)
- Tauri desktop build (per-user NSIS install, no admin) — if school Windows policy allows running unsigned exes
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chips
- Multiline raw-code rendering
- Lists as real blocks
