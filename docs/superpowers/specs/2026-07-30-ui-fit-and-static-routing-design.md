# UI fit-to-screen + static directory routing — design

**Date:** 2026-07-30
**Status:** approved (chat), pending written-spec review

## Problem

The frontend does not reliably fit the browser viewport, and advertised URLs 404:

1. **No viewport meta** — none of the three HTML shells (`public/{client,host,admin}/index.html`) declare `<meta name="viewport">`. On smaller/zoomed viewports the page renders at desktop width and shrinks; nothing adapts.
2. **No responsive CSS** — `public/styles.css` has fixed two-column grids (`.play`, `.admin-grid`) and a hard `height: 100vh`, with zero `@media` rules. Narrow windows overflow or clip; `100vh` overflows past mobile/browser chrome.
3. **Directory paths 404** — `serveStatic` (`src/http/static.ts`) only maps `/` → `/client/index.html`. A request for `/host/` (a directory) fails the `isFile()` check and falls through to 404. Only `/host/index.html` works, yet the startup banner and docs advertise `/host/`, `/client/`, `/admin/`.

## Scope

Target: **desktop-first** (host, players, admin all on laptops/desktops); resilient to window resizing; graceful (not pixel-perfect) down to narrow widths. Out of scope (separate TODOs): broad visual redesign, `.env` loader, Korean localization.

## Design

### A. Static directory routing (server) — TDD

`serveStatic` resolves a directory-style request to its `index.html`:

- A request path ending in `/` (e.g. `/host/`) → append `index.html` → `/host/index.html`.
- A request path that resolves to an existing directory (e.g. `/host` with no trailing slash) → try `<path>/index.html`.
- Keep the existing `/` → `/client/index.html` default and the `..` traversal guard.
- Preserve current behavior for real files and genuinely-missing paths (still returns `false` → 404).

Unit tests (node:test) assert `/host/`, `/client/`, `/admin/` and `/host` all serve the corresponding `index.html`, `/` still serves the client, a nonexistent path still 404s, and `..` is still rejected.

### B. Viewport + base layout (shells + CSS)

- Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to all three shells.
- `styles.css`: replace `100vh` with `100dvh`; make `html, body` full-height; add one narrow-width breakpoint (`@media (max-width: 720px)`) that collapses two-column grids to one column as a safety net.

### C. Player editor + host dashboard — app-like fixed fit

- `.play` fills `100dvh`, no page scroll; timer/header fixed; target iframe and prompt textarea flex-grow to fill remaining space; collapses to one column under the breakpoint (each pane then scrolls internally instead of overflowing the page).
- Host dashboard (`.dash`/`.grid`) sits in a fixed-fit page: the header stays put and the player-card grid (already `auto-fill minmax`) scrolls within its own region rather than growing the page past the viewport.

### D. Results screen — horizontal

- `.results-wrap` becomes a **horizontal row** of player result cards, ordered by rank left→right (currently a vertical stack). Cards have a fixed sensible width; when they exceed the viewport width the row scrolls horizontally (`overflow-x: auto`). Each card keeps rank, score subtotals, per-item verdicts, and the generated-UI iframe, sized to fit the card.
- Requires a small change in `public/host/results.js` (container/card structure) plus CSS.

### E. Admin console — scroll allowed

- Minimal: viewport meta (from B) makes it usable; the `.admin-grid` two-column collapses to one under the breakpoint. Vertical page scroll remains acceptable — no fixed-fit requirement.

## Testing / verification

- **A** is covered by node:test unit tests (TDD) plus the existing suite staying green.
- **B–E** are visual; there is no automated visual-test harness. Verify by running the server (`npm start`) and loading each screen (`/client/`, `/host/`, `/admin/`, and a completed round's results) at a few window sizes, confirming fit and the horizontal results layout. `npm run typecheck` stays clean.

## Risks

- Results-screen JS change touches the render path that also embeds the generated-UI iframe (wired in a prior cycle); keep the `genToken`/iframe plumbing intact.
- `serveStatic` change must not weaken the `..` traversal guard or start serving directory listings.
