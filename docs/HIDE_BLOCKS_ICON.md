# Hide-blocks toggle icon — shipped design (v1.75.2)

The v1.75.3 `visibility_off` / `visibility` ligature toggle was replaced
with an inline SVG in v1.75.2. This was a design revision, not a bug fix.

## Icon

The base is the Material `code_blocks` path from `docs/icons/code_blocks.svg`.
The hidden state draws a diagonal slash over the blocks; the shown state
retracts it. The slash uses the same angle and visual weight as the slash in
`docs/icons/volume_off.svg`.

## Motion

- The slash draws/retracts via `stroke-dashoffset`.
- Duration: 250ms.
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`.
- Slash stroke cap and join match the code-panel and volume slashes.

## Constraints

- One inline SVG, viewBox `0 -960 960 960`, rendered at 22px.
- `currentColor` supplies the icon color in both themes.
- CSS transitions only; no JavaScript animation or library.

## Related

- v1.75.2 — code-panel and volume slash animations use the same motion rules.
- v1.75.3 — the original visibility-symbol toggle, revised here.
