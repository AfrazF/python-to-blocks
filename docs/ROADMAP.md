# Roadmap

Steps are listed in build order. Each step is a self-contained Copilot prompt.
Mark a step ✅ only when it renders correctly in the browser and tests pass.

## Parsing foundation

- ✅ **Step 1** — Vite + TypeScript scaffold, `@lezer/python` parser smoke test on fixtures
- ✅ **Step 2** — Symbol table (`buildSymbolTable`): functions, async-functions, variables
- ✅ **Step 3** — Object table (`buildObjectTable`): Motor, DriveBase, PrimeHub, literals
- ✅ **Step 4** — Cross-file resolution (`resolveProject`): aliased imports, project imports, external imports

## Blockly rendering

- ✅ **Step 5** — Blockly shell: Zelos renderer, Pybricks theme, zoom, dotted grid
- ✅ **Step 6** — Raw-code block + walker: top-level statements as one stack
- ✅ **Step 7** — `set up` hat (orange, one per file)
- ✅ **Step 8** — Task (purple) and function (pink) blocks with nested bodies
- ✅ **Step 9** — Import blocks (one per imported name, aliases supported)
- ✅ **Step 10** — Call blocks (pink) and await wrapper (purple)

## Pybricks blocks (robot.py era)

- ✅ **Step 11a** — DriveBase blocks: `straight`, `turn`, `reset`, `use_gyro`
- ✅ **Step 11a.5** — DriveBase `settings()` → four chained `configure` blocks
- ✅ **Step 11b** — Motor blocks: `run_target`, `run_angle`, `run_until_stalled`, `reset_angle`, `stop`
- ✅ **Step 12** — Variable blocks: `create variable X = value`, `set X to value`
- ✅ **Step 13** — Comment blocks (grey) + inline comment attachment
- ✅ **Step 14** — Hardware setup blocks: `PrimeHub`, `Motor`, `DriveBase` constructors
- ✅ **Step 14.5** — Hardware wording pass + DriveBase `NAME` field
- ✅ **Step 15** — Top-level expressions verified, star-args fallback confirmed
- ✅ **Step 16** — Variable chips in Pybricks block args
- ✅ **Step 16.5** — Chip text colour, cursor polish

## Restructure to attachment-based files

The Python project moved from "one file per run" to "one file per attachment"
(a1.py, a2.py...) with a shared `run.py` boilerplate helper and a `main.py`
menu that lists attachments. New files introduce constructs the tool doesn't
handle yet — this section closes those gaps.

The plan is **Path C** (small stuff first, defer control flow), then **Path A**
(redefine v1 scope) if `run.py` and `main.py` stay readable with raw blocks.

- ⬜ **Step 17** — `multitask` block with statement slots (already prompted)
- ⬜ **Step 17.5** — `pass` block + nested member expression dispatch in walker
  - Enables `hub.display.image(...)`, `hub.buttons.pressed()`, `hub.light.on(...)`
  - Renders `pass` in `exampleattach.py`'s placeholder mission
- ⬜ **Step 17.6** — Hub display blocks: `.image`, `.off`, `.char`, `.text`
  - Icon dropdown with common `Image.*` options + "other" fallback
- ⬜ **Step 17.7** — Hub button block (`.pressed`) and hub light blocks (`.on`, `.off`)
- ⬜ **Step 18** — `wait` block (Flow orange)
- ⬜ **Step 19** — Docstrings: `"""..."""` at top of file → comment on `set up` hat

### Path A decision point

After Step 17.7, decide whether `run.py` and `main.py` are readable enough with
large raw blocks (the `for i, mission` loop in `run.py`, the `while True` in
`main.py`). If yes, go to Path A below and skip Steps 20–21.

### Deferred (do only if Path A is not acceptable)

- ⬜ **Step 20** — Control flow: `for`, `while`, `if` upgrade for `in` operator
  - Makes `run.py`'s mission loop and `main.py`'s button-polling loop readable
- ⬜ **Step 21** — `try/except` blocks
  - Needed for `run.py`'s error handling to render

## Application chrome

- ⬜ **Step 22** — Tabs UI: one workspace per file, switch between files
- ⬜ **Step 23** — File upload: drag-and-drop or file picker, resolve whole project
- ⬜ **Step 24** — Docker deploy: nginx container on dev LXC, NPM proxy
- ⬜ **Step 25** — Chromebook verification: real device test, performance check

## v1 done when

**Revised** for the attachment-based restructure:

- `robot.py` renders with **zero raw-code blocks** (only docstrings remain — closed by Step 19)
- `exampleattach.py` renders with **zero raw-code blocks** (only `pass` remains — closed by Step 17.5)
- `a1.py` (the first real attachment) renders with **zero raw-code blocks** if its missions use only drive/motor blocks — which they will, since missions are straight-line sequences
- `run.py` and `main.py` may contain large raw blocks; these are infrastructure, not reader-facing mission code

Plus:
- Vitest tests pass on all fixtures
- Deployed on the dev LXC, reachable through NPM
- Verified on a Chromebook

## v2 ideas (post-v1)

- Editable blocks → Python generation (round-trip)
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chip styling
- Multiline raw-code rendering
- Control flow + try/except (if skipped under Path A)
- Lists as real blocks (`ICONS`, `ATTACHMENTS`)