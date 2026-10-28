# Halloween theme verification

## Scope and isolation

- Implementation: `public/themes/halloween.css` and six self-contained, local SVG decorations in `public/themes/halloween/`.
- `public/styles.css` still hashes to `cb54d5541c3e417baa950825b705c014db83ea079c7cd0057530b4793a547fd9`.
- No changes to cartoon CSS, client/host/shared/admin rendering scripts, game/server/DB behaviour, entry HTML or runtime dependencies in this theme redesign. The registry description is updated.
- See `PRODUCT.md` / `DESIGN.md` for requirements and `docs/theme-qa.md` for reproduction commands and exact test limits.

## Automated results

- `npm test`: **149 passed, 0 failed** (includes local SVG requests and 10 WCAG AA palette-pair assertions).
- `npm run typecheck`: passed.
- `node --check scripts/check-themes-browser.mjs`: passed.
- `git diff --check`: passed.
- All six SVG files parsed successfully with an XML parser.

## Real-browser results

Executed `scripts/check-themes-browser.mjs` with headless Chrome and a temporary SQLite database:

- **36** original/cartoon comparisons: exact computed CSS and geometry for the original elements in every case. Admin comparison excludes the newly added settings panel and document-height extension.
- **31** comparisons were pixel-exact in the final run. Five had sparse rotated-edge antialias differences: 1–17 pixels per image, maximum RGB channel delta 6. No CSS/geometry tolerance was used. The browser suite repaints and retries at most twice before failing its documented pixel threshold.
- **66 Halloween screenshots** across **1280px / 768px / 375px**, including login, focus, error, lobby, editor/dashboard, warning/danger, grading, results, admin, reduced motion and forced-colors.
- Every captured Halloween phase: no horizontal overflow, visible buttons at least 44px tall. Authentication fits the viewport without unintended vertical scroll.
- Runtime checks: actual arched entrance with ghost/crest layers, pumpkin scenery behind the UI, pumpkin-shaped decorative button layers with stems/ribs while hit/focus boxes remain unclipped, ribs/stem preserved on hover, disabled opacity, keyboard focus, disabled timer pulse, reduced-motion movement removal, native forced-colors controls.
- Saving a theme keeps current-page appearance and unsaved admin edits; an existing player keeps its prompt, focus and iframe identity; fresh/reloaded documents read the new selection.
- Stylesheet failure falls back to cartoon; failed save is retryable; settings/accounts/problems survive a full isolated server restart.
- Browser page errors and theme-asset HTTP errors: **none**.

Final-run local artifacts (temporary, not committed): `/tmp/pb-theme-visual-GfLs1P/`, including `report.json` and `screenshots/`.

## Visual inspection and targeted fixes

Reviewed desktop/mobile authentication, host lobby/dashboard, tablet editor, mobile standings, mobile administrator console, danger state and forced-colors screenshots.

1. Unintended vertical space below authentication: fixed Halloween-only body margin collapsing with `display: flow-root` and automatic height; viewport-fit assertions now pass.
2. Settings helper text competed with its corner cobweb: reduced only that panel's web to 64px at 0.28 opacity; final mobile screenshot inspected.
3. Verified that primary actions, time selection, room code, timer, participant cards and rank badges differ in shape, not just hue; original target UI remains visibly separate from the skin.
4. Added friendly paper-cut ghosts to the entrance and desktop scenery, plus paired jack-o'-lanterns at the forest edge. Mobile uses one smaller pumpkin pair; all scenery remains static, non-interactive and behind controls.
5. Changed coffin buttons to softly rounded pumpkin bodies with a small sage stem and subtle curved ribs, preserving secondary/selected colours. Reviewed current desktop host lobby and mobile player login screenshots. Fixed percentage-based corner radii after the first screenshot made wide actions look like flat ovals; final fixed radii keep long buttons readable and button-like.

## Limits

Screens are driven by deterministic synthetic WebSocket messages; persistence/admin requests use the real HTTP server. This is not an end-to-end LLM generation run. Tested in local headless Chrome, not Safari/Firefox or an actual mobile device. No production deployment or push was performed.
