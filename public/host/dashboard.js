import { el, mount } from '/shared/dom.js';

export function renderDashboard(app, state) {
  const cards = (state.room?.players ?? []).map(p => {
    const text = state.mirror?.[p.username] ?? '';
    return el('div', { class: p.connected === false ? 'pcard disconnected' : 'pcard' },
      el('div', { class: 'pname' }, p.connected === false ? `${p.username} (연결 끊김)` : p.username),
      el('pre', { class: 'ptext' }, text || '…'));
  });
  mount(app, el('div', { class: 'dash' },
    el('div', { class: 'timer' }, state.remaining == null ? '…' : `${state.remaining}초`),
    el('button', { onClick: () => state.bus.send({ type: 'FORCE_END' }) }, '지금 종료'),
    el('div', { class: 'grid' }, ...cards)));
}
