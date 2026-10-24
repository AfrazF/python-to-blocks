# Python to Blocks

> **For AI agents:** read `AGENTS.md` before making any changes.

A read-only viewer that shows Pybricks Python (LEGO SPIKE Prime, FLL robots) as Pybricks-style Blockly blocks.

Built for teammates who prefer blocks, and for reading unfamiliar code fast.

## Quick start

Download the latest `index.html` from [Releases](../../releases) → double-click → upload your `.py` files → see blocks.

No server, no install, works offline.

## What it does

- Parses any Python with `@lezer/python`
- Resolves imports across files (`attachment1 as attachment_a` → known Motor)
- Maps Pybricks calls (drive, motor, multitask) to real blocks
- Everything unmapped falls back to a raw-code block (nothing is lost)
- Zero raw blocks in `robot.py` and `exampleattach.py` — enforced by `src/acceptance.test.ts`

## Development

```bash
npm install
npm run dev        # dev server
npm run test       # Vitest (6 tests)
npm run build      # single-file dist/index.html
```

## Status

**v1.1.0 shipped** — read-only viewer with a Monaco panel and bidirectional highlighting. See [Releases](../../releases).
**v1.5** — control flow + hub display blocks.
**v2** — editable blocks → Python.

## Docs

- [`docs/OVERVIEW.md`](docs/OVERVIEW.md) — scope and architecture
- [`docs/BLOCK_DESIGN.md`](docs/BLOCK_DESIGN.md) — colors, block mappings
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — all steps, done and planned
- [`docs/GIT.md`](docs/GIT.md) — commit conventions
