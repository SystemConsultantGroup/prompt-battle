// The results board now lives in /shared/results.js so players see the exact
// same screen; the host's variant is that board plus the restart control.
import { renderResults as renderShared } from '/shared/results.js';

export function renderResults(app, state) {
  return renderShared(app, state, { showRestart: true });
}
