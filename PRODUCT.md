# Prompt Battle — seasonal theme brief

## Product
A Korean-language, room-based prompt-writing game. Players join, write a prompt against a target UI, and see graded results; hosts control the room and administrators manage content and the site theme.

## Current request
Make Halloween a full visual theme, not a palette swap: change surface shapes, controls, frames and decorative details across player, host and administrator screens. Direction: a playful, paper-cut haunted arcade, not horror/gore.

## Non-negotiable contracts
- The original cartoon theme must remain byte-for-byte and visually unchanged. Never edit `public/styles.css` or add rules to `public/themes/cartoon.css`.
- Theme-specific visuals live under `public/themes/`. No game state, WebSocket, form or iframe changes for decoration.
- Administrator selection remains SQLite-backed and only applies to newly opened/refreshed documents. Existing documents keep their theme, input, focus and game state.
- Target/generated UI documents must not inherit the Halloween skin.
- All controls remain usable on mobile and with keyboard navigation. Respect reduced motion. No decorative element may intercept input.

## Scope
Player/host/admin authentication, lobby and selection controls, player editor, host dashboard, grading and results. No new frameworks, network font services or runtime dependencies.
