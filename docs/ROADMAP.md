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

---

## v1 — ship the viewer

**Goal:** `robot.py` and `exampleattach.py` render with **zero raw-code blocks**. `run.py` and `main.py` may remain as large raw blocks — they are infrastructure, not mission code. Tabs, upload, and deployment work so a teammate can use it.

### Closeout

- ✅ **Step 17.5** — `pass` block (for `exampleattach.py`'s placeholder `mission3()`)
- ✅ **Step 18** — Docstrings as comment icons on the parent block
- ✅ **Step 18.5** — Automated acceptance test: Vitest asserts 0 raw blocks in `robot.py` and `exampleattach.py`
- ⬜ **Step 18.75** — Update `docs/OVERVIEW.md` with the revised v1 criterion
- ⬜ **Step 19** — Tabs UI: one workspace per file, switch between files
- ⬜ **Step 20** — File upload: drag-and-drop or file picker, resolve whole project
- ⬜ **Step 21** — Docker deploy: nginx container on dev LXC, NPM proxy
- ⬜ **Step 22** — Chromebook verification: real device test, performance check

**v1 is done when** Steps 17.5–22 are ✅ and the teammate can open the URL, upload their files, and read them as blocks.

---

## v1.5 — make infrastructure legible

**Goal:** `run.py` and `main.py` also render mostly as blocks. Not blocking v1, but improves the tool for whoever maintains the menu and button handling.

### Control flow

- ⬜ **Step 22.5** — Upgrade acceptance test to `collectBlocks` (Option A from Step 18.5). Prerequisite for v1.5 — the control-flow work changes `walk.ts` heavily, and the independent counter will drift.
- ⬜ **Step 23** — `for` loops (needed for `run.py`'s mission loop)
- ⬜ **Step 24** — `while` loops (needed for `main.py`'s menu loop)
- ⬜ **Step 25** — `if`/`elif`/`else` upgrade: `in` operator support (for `Button.LEFT in pressed`)

### Expression depth

- ⬜ **Step 26** — Nested member expression dispatch in walker (enables `hub.display.image`, `hub.buttons.pressed`, `hub.light.on`)
- ⬜ **Step 27** — `return` block, `pass` handling in `try/except` context

### Hub API blocks

- ⬜ **Step 28** — Hub display blocks: `.image`, `.off`, `.char`, `.text` (with icon dropdown)
- ⬜ **Step 29** — Hub button block: `.pressed`
- ⬜ **Step 30** — Hub light blocks: `.on`, `.off`
- ⬜ **Step 31** — `wait` block (Flow orange) — only if `await wait(ms)` appears in mission code
- ⬜ **Step 32** — `try/except` blocks (needed for `run.py`'s error handling)

---

## v2 — editable blocks

- Editable blocks → Python generation (round-trip)
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chip styling
- Multiline raw-code rendering
- Lists as real blocks (`ICONS`, `ATTACHMENTS`)
- `run.py` and `main.py` final polish if not fully closed by v1.5
