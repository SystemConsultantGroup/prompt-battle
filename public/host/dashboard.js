import { el, mount, timerClass, timerText } from '/shared/dom.js';

// The dashboard re-renders on every TICK (once a second). It now contains an
// iframe showing the goal, and re-mounting that would reload the target — and
// re-hit the server — every second, so the DOM is built once per round and
// patched in place afterwards. `built.key` changes only when the goal itself
// changes, which is the one case that must rebuild.
let built = null;
let latest = null;

export function renderDashboard(app, state) {
  latest = state;
  const key = `${state.problemId ?? ''}:${state.variationId ?? ''}`;
  if (!built || built.key !== key || !built.root.isConnected) build(app, state, key);
  patch(state);
}

function build(app, state, key) {
  const timer = el('div', { class: 'timer' }, '- -');
  const count = el('span', { class: 'chip' }, '');
  const endBtn = el('button', {
    onClick: () => {
      // Disable + relabel on click so the host gets immediate feedback and
      // can't fire FORCE_END repeatedly during the gap before the grading
      // screen appears. `state.ending` survives the per-second patches.
      if (!latest || latest.ending) return;
      latest.ending = true;
      endBtn.disabled = true; endBtn.textContent = '종료 중…';
      latest.bus.send({ type: 'FORCE_END' });
    }
  }, '지금 종료');

  // The goal the players are racing to reproduce, mirrored onto the host
  // screen — the projector otherwise shows prompts with no visible brief.
  // Renders the variation the server actually rolled, so host and players
  // are looking at the same thing.
  const goal = state.problemId == null ? null : el('div', { class: 'dash-goal' },
    el('h3', {}, '목표 화면'),
    el('iframe', {
      class: 'goal-frame',
      src: state.variationId != null
        ? `/render/variation/${state.variationId}`
        : `/render/target/${state.problemId}`,
      sandbox: 'allow-scripts',
    }));

  const grid = el('div', { class: 'grid' });
  const main = goal
    ? el('div', { class: 'dash-main' }, goal, grid)
    : el('div', { class: 'dash-main', style: 'grid-template-columns:1fr' }, grid);

  const root = el('div', { class: 'dash' },
    el('div', { class: 'dash-top' }, timer, count, endBtn),
    main);

  mount(app, root);
  built = { key, root, timer, count, endBtn, grid, cards: new Map() };
}

function patch(state) {
  const b = built;
  b.timer.textContent = timerText(state.remaining);
  b.timer.className = timerClass(state.remaining);
  b.endBtn.disabled = !!state.ending;
  b.endBtn.textContent = state.ending ? '종료 중…' : '지금 종료';

  const players = state.room?.players ?? [];
  b.count.textContent = `${players.length}명 참가`;

  // Reuse each player's card so their prompt box keeps its scroll position
  // while they type; only the mutable text/class is written.
  const seen = new Set();
  for (const p of players) {
    seen.add(p.username);
    let card = b.cards.get(p.username);
    if (!card) {
      const name = el('div', { class: 'pname' }, p.username);
      const text = el('pre', { class: 'ptext' }, '…');
      card = { node: el('div', { class: 'pcard' }, name, text), name, text };
      b.cards.set(p.username, card);
      b.grid.append(card.node);
    }
    const off = p.connected === false;
    card.node.className = off ? 'pcard disconnected' : 'pcard';
    card.name.textContent = off ? `${p.username} (연결 끊김)` : p.username;
    card.text.textContent = state.mirror?.[p.username] || '…';
  }
  for (const [username, card] of b.cards) {
    if (seen.has(username)) continue;
    card.node.remove();
    b.cards.delete(username);
  }
}
