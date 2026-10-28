# Theme regression QA

## Always-on tests

```sh
npm test
npm run typecheck
git diff --check
```

The cartoon contract test pins the original `public/styles.css` SHA-256 and requires `public/themes/cartoon.css` to contain no rules. Do **not** update that hash to accommodate theme work. Halloween asset tests request every local SVG referenced by the skin and check text/control palette contrast against WCAG AA.

## Optional real-browser regression suite

`scripts/check-themes-browser.mjs` starts an isolated server with a temporary, nested SQLite path. It never reads or changes the application's real database. It uses synthetic WebSocket game messages for deterministic screen states; HTTP/admin persistence requests use the real server. This is a UI regression test, not an end-to-end LLM/generation test.

Install optional tooling outside the project to avoid adding production dependencies:

```sh
npm install --prefix /tmp/prompt-battle-theme-tools --no-save playwright-core pngjs
THEME_BROWSER_TOOLS=/tmp/prompt-battle-theme-tools \
CHROME_PATH="$(command -v google-chrome || command -v chromium)" \
node scripts/check-themes-browser.mjs
```

`THEME_BROWSER_TOOLS` must be an absolute path containing `node_modules/playwright-core` and `node_modules/pngjs`. `CHROME_PATH` is the installed Chrome/Chromium executable. If omitted, Playwright's default browser location is used. The script prints its artifact directory and retains screenshots plus `report.json` for inspection. It requires the original baseline commit `bb4b943d755a0e529d585cc7ca0cd98c40907777` to be available locally.

### Coverage

- 36 original/cartoon comparisons at 1280px and 375px: client/host login, hover, lobby, playing, warning, danger, grading, results, plus admin login/console. Existing elements must have identical computed CSS and geometry. The new admin settings panel and its effect on document height are excluded from the original-component comparison.
- Screenshot pixels are compared after pausing animations at deterministic positions. The suite permits only sparse rasterisation differences (at most 8 RGB channel levels on fewer than 0.1% of pixels), because rotated cards can have headless-Chrome antialiasing variance. The suite repaints and retries a screenshot mismatch at most twice without widening the threshold. The computed-style/geometry comparison has no such tolerance.
- Halloween at 1280px, 768px and 375px: authentication, errors, lobby, player editor, host dashboard, all timer states, grading, results and administrator console. Each phase checks horizontal overflow and visible button height (minimum 44px).
- Actual computed arch/crest/coffin decoration, unclipped interactive button boxes, keyboard focus outline, login viewport fit, reduced motion and forced-colors fallback.
- Administrator save/error behaviour, preservation of unsaved problem edits, current-page theme/input/focus/iframe identity, fresh-document theme changes and stylesheet-failure fallback.
- Full server restart preserves theme, accounts and problems at `DB_PATH`.

### Visual inspection checklist

Review the generated desktop/mobile images, not just the assertions:

- Tombstone panel arch and pumpkin/bat crest fit without covering text.
- Scenery stays behind controls. Web stitching does not reduce legibility.
- Angular buttons remain readable and their focus outline is not clipped.
- Target/generated iframe content remains independent from the application theme.
- Host participant cards and result rank seals are recognisably seasonal, but names, scores and status colours remain easy to read.
- Admin forms remain usable, including narrow criterion rows and inline actions.
