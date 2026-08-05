import { el, mount } from '/shared/dom.js';

export function renderDashboard(app, state) {
  const cards = (state.room?.players ?? []).map(p => {
    const text = state.mirror?.[p.username] ?? '';
    return el('div', { class: p.connected === false ? 'pcard disconnected' : 'pcard' },
      el('div', { class: 'pname' }, p.connected === false ? `${p.username} (연결 끊김)` : p.username),
      el('pre', { class: 'ptext' }, text || '…'));
  });
  // Disable + relabel on click so the host gets immediate feedback and can't
  // fire FORCE_END repeatedly during the gap before the grading screen appears.
  // `state.ending` persists the disabled state across the per-second re-renders.
  const endBtn = el('button', {
    onClick: () => {
      if (state.ending) return;
      state.ending = true;
      endBtn.disabled = true; endBtn.textContent = '종료 중…';
      state.bus.send({ type: 'FORCE_END' });
    }
  }, state.ending ? '종료 중…' : '지금 종료');
  endBtn.disabled = !!state.ending;
  mount(app, el('div', { class: 'dash' },
    el('div', { class: 'timer' }, state.remaining == null ? '…' : `${state.remaining}초`),
    endBtn,
    el('div', { class: 'grid' }, ...cards)));
}
