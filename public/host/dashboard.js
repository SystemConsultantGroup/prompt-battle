import { el, mount } from '/shared/dom.js';

export function renderDashboard(app, state) {
  const cards = (state.room?.players ?? []).map(p => {
    const text = state.mirror?.[p.username] ?? '';
    return el('div', { class: 'pcard' },
      el('div', { class: 'pname' }, p.username),
      el('pre', { class: 'ptext' }, text || '…'));
  });
  mount(app, el('div', { class: 'dash' },
    el('div', { class: 'timer' }, state.remaining == null ? '…' : `${state.remaining}s`),
    el('button', { onClick: () => state.bus.send({ type: 'FORCE_END' }) }, 'End now'),
    el('div', { class: 'grid' }, ...cards)));
}
