# Hide-blocks toggle icon — design brief (v2d.14)

Status: not yet implemented. v1.75.3 ships with Material Symbols
`visibility_off` / `visibility`. This doc describes the eventual custom
morph icon that replaces them in v2d.14.

## Concept

Same pattern as the code-panel toggle's SVG morph (Step 26.5c): one
`<svg>` with two path groups that crossfade / slide between states,
driven by CSS `:checked` or a `data-state` attribute.

## States

**Blocks visible (default):** reads as "blocks are visible, click to
hide". Candidate design: a small grid of squares (representing blocks),
static.

**Blocks hidden:** the same grid, with a diagonal slash drawn across it
(grayed), plus an eye-slash overlay if the grid alone doesn't read as
"hidden".

The two states must be distinguishable at 24×24px without text.

## Animation

- Duration: 300ms (matches the theme toggle crossfade)
- Easing: match Step 26.5c — linear for path transforms,
  cubic-bezier(0.4, 0, 0.2, 1) for opacity
- The grid stays static; only the eye / slash overlay morphs
- Slash draws from top-right to bottom-left (matches the Material
  Symbols `visibility_off` slash direction, so the transition doesn't
  feel like it flips orientation)

## Constraints

- viewBox 24×24 (Material Symbols grid)
- Icon uses `fill: currentColor` so it inherits from the button
- No JS animation — CSS transitions only, matching Step 26.5c
- Must be legible at the button's 22px rendered size

## Mockup

NOT YET DRAWN. A mockup SVG is required in v2d.14 prep — do not start
implementation until it's approved. Reference:

- `docs/mockups/drivebase-setup-mockup.svg` — the pattern we use for
  mockups (hand-drawn, approved before implementation)
- The code-panel toggle's morph icon (three paths,
  chevron-left / code-slash / chevron-right)

## Related

- v1.75.2 — the code-panel morph animation fix; the approach used there
  should be the model for this
- v2d.7 — sounds (unrelated but same polish milestone)
- v2d.14 — where this lands
