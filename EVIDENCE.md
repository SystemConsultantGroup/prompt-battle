# Halloween theme verification

## Current gameplay and client Halloween update

- Both player and host show the same large live-status instruction for 3000ms on `GAME_START`, not on `STATE` reconnects or timer ticks. Leaving play cancels the guide immediately. Prompt and iframe nodes survive guide dismissal and ordinary ticks.
- Common player text size is now 18px, with an explanatory autosave/grading placeholder; Halloween notebook line spacing is 30px. These requested common changes are in a separate player/host stylesheet; the original stylesheet hash and empty cartoon skin remain unchanged.
- The client-only lobby scene has five decorative objects: two drifting ghosts, two flying bats and rocking pumpkins. A keyboard-operable 44px pause button stops the objects and retains the choice across lobby rebuilds. Reduced motion makes them static and hides the unnecessary pause button. The scene is hidden in cartoon and absent on the host board.
- The player's timer has a pumpkin-ribbed plaque, pumpkin/ghost icons, yellow warning and red danger states. Only the ghost moves briefly on entering danger; the digits remain stationary. The host timer retains its hourglass styling.
- `npm test`: **160 passed, 0 failed**. New regressions exercise the actual browser JS through a minimal DOM and deterministic timers, including the three-second lifecycle, reconnects, phase cleanup, editor identity/autosave and lobby pause persistence. Local-asset serving now includes the seventh SVG, `bat.svg`.
- `npm run typecheck` and `git diff --check`: passed.
- Actual headless Chrome checked desktop player **1920×1080, 1440×900 and 1280×720**, player 390×844 with reduced motion, host 1440×900, and cartoon fallback. Verified object transforms change while running, pause toggles stop motion, reduced-motion animations are off, target/prompt identity is stable across ticks, 18px text/30px line-height, timer icons, automatic guide dismissal, no desktop lobby horizontal/vertical overflow, no overlap between target/editor/timer, at least 400×400px desktop prompt area and no JavaScript exceptions.
- Visually inspected desktop/mobile lobby and active-editor screenshots plus the desktop start guide, including desktop normal, warning and danger timer states. Desktop inspection found and fixed a small 1280×720 lobby overflow via compact-window spacing, and an orphaned placeholder word by shortening the instruction. Temporary browser driver: `/tmp/prompt-battle-browser.mjs`; temporary screenshots: `/tmp/pb-lobby-{1440,390}.png`, `/tmp/pb-playing-{1440,390}.png`, `/tmp/pb-guide-{client-1440,client-390,host-1440}.png`. These checks use synthetic WebSocket messages and a local HTTP server, not a live LLM run.

The sections below record the earlier theme-only baseline; its original visual-preservation claims predate the explicitly requested common gameplay changes above.

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
