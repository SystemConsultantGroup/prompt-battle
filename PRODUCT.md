# Prompt Battle — seasonal theme brief

## Product
A Korean-language, room-based prompt-writing game. Players join, write a prompt against a target UI, and see graded results; hosts control the room and administrators manage content and the site theme.

## Current request
Show a large gameplay instruction for approximately three seconds immediately after a round starts, on both player and host screens. Use the Halloween theme's friendly pumpkin/ghost assets and a short animation on its instruction screen. Enlarge prompt input text slightly and provide placeholder instructions explaining how to describe the target and how automatic saving/grading works. Also make the waiting client's Halloween lobby more dynamic with extra moving decorative objects, and strengthen the in-game player's Halloween countdown styling. Keep the existing paper-cut haunted arcade direction and pumpkin-shaped controls; no horror/gore.

The existing seasonal theme changes surface shapes, controls, frames and decorative details across player, host and administrator screens, not just the palette.

## Non-negotiable contracts
- Keep `public/styles.css` byte-for-byte unchanged and `public/themes/cartoon.css` empty. The requested common gameplay changes live in `public/shared/gameplay.css`, loaded only by player/host pages, and apply to both themes.
- Theme-specific visuals live under `public/themes/`. The start announcement responds only to a fresh `GAME_START`, never ordinary ticks or reconnect snapshots; it must not reset the editor, change the server deadline or steal focus.
- Administrator selection remains SQLite-backed and only applies to newly opened/refreshed documents. Existing documents keep their theme, input, focus and game state.
- Target/generated UI documents must not inherit the Halloween skin.
- All controls remain usable on mobile and with keyboard navigation. Respect reduced motion. Provide a pause toggle for ambient lobby motion; keep animated objects out of the active editor. No decorative element may intercept input.

## Scope
Player/host/admin authentication, lobby and selection controls, player editor, host dashboard, grading and results. No new frameworks, network font services or runtime dependencies.
