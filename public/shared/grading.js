import { el, mount } from '/shared/dom.js';

/**
 * The "grading in progress" screen, shared by host and players so the whole
 * room watches the same counter tick up between GAME_END and RESULT.
 */
export function renderGrading(app, state) {
  const p = state.progress;
  const total = p?.total ?? 0;
  const done = p?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  mount(app, el('div', { class: 'card' },
    el('h2', {}, '채점 중…'),
    el('p', {}, p ? `${done}/${total}` : ''),
    el('div', { class: 'gradebar' },
      el('div', { class: 'gradebar-fill', style: `width:${pct}%` }))));
}
