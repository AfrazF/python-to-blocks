# Python to Blocks — Overview

## Goal
A browser tool that shows Pybricks Python (LEGO SPIKE Prime, FLL robot) as Blockly blocks.
v1 is **read-only**: Python → blocks. Editing and Python-out is v2.
Mainly for a teammate who prefers blocks.

## Robot and code
- SPIKE Prime hub, Pybricks MicroPython, FLL robot.
- **robot.py**: hub, motors (left A, right B, attachment1 C, attachment2 D), DriveBase,
  speed presets `normal()` / `fast()` / `precise()`, `reset_drive()`, `async home(motor, speed, duty=40)`.
- **run.py**: shared boilerplate `async def run_missions(*missions)` — shows an icon, waits for a button, runs the mission. Wraps each mission in `try/except` for safe mid-competition failure.
- **attachment files** (`a1.py`, `a2.py`...): one per attachment. Each holds several `async def missionN()` functions and a `main()` that calls `run_missions(mission1, mission2, ...)`. Adding a mission means writing one function and adding one argument.
- **main.py**: menu that lists attachments. Uses a custom `pick()` loop instead of `hub_menu` so the next attachment is pre-selected after each run.
- Attached files are the source of truth for style: `robot.py`, `run.py`, `main.py`, `exampleattach.py`, `BEST_PRACTICES.md`.

## v1 scope (locked)
- Parser: **@lezer/python** (verified 1.1.18, MIT, plain JS, no WASM).
- **Vite + TypeScript**, **Blockly (Zelos renderer)**, **Vitest** (dev only).
- Upload whole project, one tab per file, one Blockly workspace per file.
- Blocks for Pybricks calls, own functions, basics (if/for/while/vars/math).
- Everything unmapped → raw-code block, kept exactly as written.
- v1 is done when **robot.py** and **exampleattach.py** render with **0 raw-code blocks**, enforced by `src/acceptance.test.ts`. `run.py` and `main.py` are infrastructure and may contain raw blocks in v1 (v1.5 adds control-flow blocks to close this).
- Separate test: `src/acceptance.test.ts` asserts zero raw blocks in `robot.py` and `exampleattach.py`. Currently uses an independent AST counter; v1.5 upgrades it to `collectBlocks` from `walk.ts` before the control-flow work.
- No Monaco, no text panel, no click-to-Python in v1.
- No icons on blocks in v1.

## Block rules
See **docs/BLOCK_DESIGN.md** for colors, node mappings, and verified-vs-inference markers.

## Cross-file resolution (the point of this tool)
Pybricks Code treats each file in isolation. We do not.
1. Parse **robot.py** first, build a symbol table (what `drive`, `attachment1`, `home`, etc. are).
2. When parsing an attachment file, resolve imports against that table.
3. So `from robot import attachment1 as attachment_a` means `attachment_a` is a Motor,
   and calls like `await home(...)` can find `home`'s parameter names from its `def`.

## Hosting
- Static build served by **nginx in Docker** on the dev LXC (Ubuntu, Docker + compose installed).
- NPM (Nginx Proxy Manager) runs on a different LXC/VM with Cloudflare DDNS; publishes a port, NPM points at it.
- Site is **open** (no access protection) — it is only a viewer.
- Code lives in a **private GitHub repo**.

## Workflow
- Claude plans and writes short prompts.
- **GitHub Copilot in VS Code** is the coding agent.
- **$2 OpenRouter credit** via Copilot BYO-key (chat + agent mode; model must support tool calling).
- Beginner-readable TypeScript: clear names, small functions, comments where the logic is non-obvious.

## Status
- **Block rendering complete.** `robot.py` and `exampleattach.py` render with zero raw blocks.
- **Done:** parsing foundation (Steps 1–4), Blockly rendering (Steps 5–10), Pybricks blocks (Steps 11a–16.5), restructure + `multitask` + `pass` + docstrings (Steps 17–18.5).
- **Tests:** 6 Vitest tests pass. `npm run build` succeeds with a large-chunk advisory (Blockly is ~860 kB — accepted for v1).
- **Next (v1 closeout):** Step 18.75 (docs update), Step 19 (tabs UI), Step 20 (file upload), Step 21 (Docker deploy), Step 22 (Chromebook verification).
- **Post-v1 (v1.5):** control-flow blocks, nested member dispatch, hub API blocks — makes `run.py` and `main.py` legible. See `docs/ROADMAP.md`.