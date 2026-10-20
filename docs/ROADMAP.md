# Roadmap

Steps are listed in build order. Each step is a self-contained Copilot prompt.
Mark a step ✅ only when it renders correctly in the browser and tests pass.

## Parsing foundation

- ✅ **Steps 1–4** — Vite/TypeScript scaffold, `@lezer/python` parser, symbol table, object table, cross-file resolution

## Blockly rendering

- ✅ **Steps 5–10** — Blockly shell, raw-code walker, `set up` hat, task/function blocks, import blocks, call blocks + await wrapper

## Pybricks blocks

- ✅ **Step 11a** — DriveBase blocks: `straight`, `turn`, `reset`, `use_gyro`
- ✅ **Step 11a.5** — DriveBase `settings()` → four chained `configure` blocks
- ✅ **Step 11b** — Motor blocks: `run_target`, `run_angle`, `run_until_stalled`, `reset_angle`, `stop`
- ✅ **Step 12** — Variable blocks: `create variable X = value`, `set X to value`
- ✅ **Step 13** — Comment blocks (grey) + inline comment attachment
- ✅ **Step 14** — Hardware setup blocks: `PrimeHub`, `Motor`, `DriveBase`
- ✅ **Step 14.5** — Hardware wording pass + DriveBase `NAME` field
- ✅ **Step 15** — Top-level expressions verified, star-args fallback confirmed
- ✅ **Step 16** — Variable chips in Pybricks block args
- ✅ **Step 16.5** — Chip text colour, cursor polish
- ✅ **Step 17** — `multitask` block with statement slots (+ fixture rename)
- ✅ **Step 17.5** — `pass` block
- ✅ **Step 18** — Docstrings as comment icons on the parent block
- ✅ **Step 18.5** — Acceptance test: 0 raw blocks in `robot.py` and `exampleattach.py`

---

## v1 — production-ready viewer

**Goal:** a working viewer on real deployment targets. `robot.py` and `exampleattach.py` render with zero raw blocks. The user can switch files, open it offline, and use it without your Docker server.

### File switching

- ✅ **Step 18.75** — Update `docs/OVERVIEW.md` with revised v1 criterion
- ⬜ **Step 19** — Refresh fixtures to current project files; add a left sidebar listing files; click to load; opens on `main.py`

### Deployment targets (in order of probability)

- ⬜ **Step 20** — Single-file HTML export (`vite-plugin-singlefile`). Test on school Windows before doing more.
- ⬜ **Step 21** — PWA (`vite-plugin-pwa`). Offline cache, install prompt. Only worth configuring if Step 20 didn't already solve school access.
- ⬜ **Step 22** — File upload via browser File API. Pick `.py` files, resolve whole project, works offline.
- ⬜ **Step 23** — Docker deploy: nginx container on dev LXC, NPM proxy. For the hosted version at home.
- ⬜ **Step 24** — Verification: your Ubuntu Chromebook + school Windows. Real devices, real network policies.

**v1 is done when** you can open the tool on at least one target your teammate can actually reach, upload their files, and read them as blocks.

---

## v1.25 — editor integration

**Goal:** read-only Monaco panel beside the blocks, with bidirectional highlighting. This is the feature that makes the tool more than a viewer.

### Prerequisite (do first, or highlighting drifts)

- ⬜ **Step 25** — Refactor `walk.ts` to attach `{ sourceStart, sourceEnd }` to every block via `extraState`. Also upgrade the acceptance test to use `collectBlocks` (deferred from Step 18.5).

### Monaco panel

- ⬜ **Step 26** — Add Monaco as a read-only panel to the right of the blocks, with a toggle button. Plain syntax highlighting, no editing.
- ⬜ **Step 27** — Click a block → Monaco selects and reveals its source range.
- ⬜ **Step 28** — Click in Monaco → Blockly highlights the block whose range contains the cursor.

### Tabs (only if sidebar alone isn't enough)

- ⬜ **Step 29** — Optional: add horizontal tabs on top of the sidebar (VS Code style). Do this only if the sidebar becomes painful with more files.

---

## v1.5 — make infrastructure legible

**Goal:** `run.py` and `main.py` render mostly as blocks.

### Control flow

- ⬜ **Step 30** — `for` loops (needed for `run.py`'s mission loop)
- ⬜ **Step 31** — `while` loops (needed for `main.py`'s menu loop)
- ⬜ **Step 32** — `if`/`elif`/`else` upgrade: `in` operator support

### Expression depth

- ⬜ **Step 33** — Nested member expression dispatch (enables `hub.display.image`, `hub.buttons.pressed`, `hub.light.on`)
- ⬜ **Step 34** — `return` block, `pass` inside `try/except`

### Hub API blocks

- ⬜ **Step 35** — Hub display blocks: `.image`, `.off`, `.char`, `.text`
- ⬜ **Step 36** — Hub button block: `.pressed`
- ⬜ **Step 37** — Hub light blocks: `.on`, `.off`
- ⬜ **Step 38** — `wait` block
- ⬜ **Step 39** — `try/except` blocks

---

## v2 — editable blocks and native app

- Editable blocks → Python generation (round-trip)
- Tauri desktop build (per-user NSIS install, no admin) — if school Windows policy allows running unsigned exes
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chips
- Multiline raw-code rendering
- Lists as real blocks