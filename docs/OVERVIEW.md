# Python to Blocks — Overview

## Goal
A browser tool that shows Pybricks Python (LEGO SPIKE Prime, FLL robot) as Blockly blocks.
v1 is **read-only**: Python → blocks. Editing and Python-out is v2.
Mainly for a teammate who prefers blocks.

## Robot and code
- SPIKE Prime hub, Pybricks MicroPython, FLL robot.
- **robot.py**: hub, motors (left A, right B, attachment1 C, attachment2 D), DriveBase,
  speed presets `normal()` / `fast()` / `precise()`, `reset_drive()`, `async home(motor, speed, duty=40)`.
- **run files**: `async def runN()`, every move uses `await`, `multitask()` for parallel moves.
- **main.py**: `hub_menu` loop that starts runs with `run_task(run())`.
- Attached files are the source of truth for style: `robot.py`, `main.py`, `examplerun.py`, `BEST_PRACTICES.md`.

## v1 scope (locked)
- Parser: **@lezer/python** (verified 1.1.18, MIT, plain JS, no WASM).
- **Vite + TypeScript**, **Blockly (Zelos renderer)**, **Vitest** (dev only).
- Upload whole project, one tab per file, one Blockly workspace per file.
- Blocks for Pybricks calls, own functions, basics (if/for/while/vars/math).
- Everything unmapped → raw-code block, kept exactly as written.
- v1 is done when **robot.py, main.py, examplerun.py** all render with **0 raw-code blocks**.
- Separate test: a file with a class and try/except must fall back to raw safely, not crash.
- No Monaco, no text panel, no click-to-Python in v1.
- No icons on blocks in v1.

## Block rules
See **docs/BLOCK_DESIGN.md** for colors, node mappings, and verified-vs-inference markers.

## Cross-file resolution (the point of this tool)
Pybricks Code treats each file in isolation. We do not.
1. Parse **robot.py** first, build a symbol table (what `drive`, `attachment1`, `home`, etc. are).
2. When parsing a run file, resolve imports against that table.
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
- Parser smoke test (Step 1) ✅ — all three files parse clean, all needed node types present.
- Symbol table (Step 2) — in progress.
- Next: cross-file resolution (Step 3), then Blockly rendering (Step 4+).