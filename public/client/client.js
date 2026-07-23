import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';

const app = document.getElementById('app');
let state = { phase: 'JOIN', players: [] };
const bus = connect(onMsg);

function onMsg(msg) {
  if (msg.type === 'ERROR') { alert(msg.message); return; }
  if (msg.type === 'STATE') { state.phase = msg.room.phase; state.players = msg.room.players; }
  if (msg.type === 'PLAYER_JOINED') state.players.push({ username: msg.username });
  if (msg.type === 'PLAYER_LEFT') state.players = state.players.filter(p => p.username !== msg.username);
  if (msg.type === 'GAME_START') { state.phase = 'PLAYING'; state.problemId = msg.problemId; state.remaining = null; state.locked = false; }
  if (msg.type === 'TICK') state.remaining = msg.remainingSec;
  if (msg.type === 'GAME_END') { state.locked = true; }
  if (msg.type === 'GRADING_PROGRESS') { state.phase = 'GRADING'; state.progress = msg; }
  if (msg.type === 'RESULT') { state.phase = 'RESULT'; state.ranking = msg.ranking; }
  render();
}
let currentScreen = null;
function render() {
  const target = state.phase;
  if (target === 'PLAYING' && currentScreen === 'PLAYING') {
    updateEditor();
    return;
  }
  currentScreen = target;
  if (target === 'JOIN') return renderJoin();
  if (target === 'LOBBY') return renderLobby();
  if (target === 'PLAYING') return renderEditor();
  if (target === 'GRADING') return renderGrading();
  if (target === 'RESULT') return renderResult();
}
function renderJoin() {
  const code = el('input', { placeholder: 'Room code' });
  const name = el('input', { placeholder: 'Your name' });
  mount(app, el('div', { class: 'card' },
    el('h1', {}, 'Prompt Battle'),
    code, name,
    el('button', { onClick: () => {
      bus.send({ type: 'JOIN', roomCode: code.value.toUpperCase().trim(), username: name.value.trim() });
      state.phase = 'LOBBY';
    } }, 'Join')));
}
function renderLobby() {
  mount(app, el('div', { class: 'card' },
    el('h2', {}, 'Waiting for host…'),
    el('ul', {}, ...state.players.map(p => el('li', {}, p.username)))));
}
let debounce;
let editorTimerEl = null;
let editorTextareaEl = null;
function renderEditor() {
  const frame = el('iframe', { class: 'target', src: `/render/target/${state.problemId}`, sandbox: 'allow-scripts' });
  const ta = el('textarea', { class: 'prompt', placeholder: 'Describe the UI to build…' });
  ta.disabled = !!state.locked;
  ta.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => bus.send({ type: 'PROMPT_UPDATE', text: ta.value }), 300);
  });
  const timer = el('div', { class: 'timer' }, state.remaining == null ? '…' : `${state.remaining}s`);
  editorTimerEl = timer;
  editorTextareaEl = ta;
  mount(app, el('div', { class: 'play' },
    el('div', { class: 'goal' }, el('h3', {}, 'Goal'), frame),
    el('div', { class: 'work' }, timer, ta)));
}
// PLAYING is already mounted (e.g. TICK/GAME_END arrived) — patch only the
// mutable bits in place so the textarea/iframe are never destroyed.
function updateEditor() {
  if (editorTimerEl) editorTimerEl.textContent = state.remaining == null ? '…' : `${state.remaining}s`;
  if (editorTextareaEl) editorTextareaEl.disabled = !!state.locked;
}
function renderGrading() {
  const p = state.progress;
  mount(app, el('div', { class: 'card' }, el('h2', {}, 'Grading…'),
    el('p', {}, p ? `${p.done}/${p.total}` : '')));
}
function renderResult() {
  mount(app, el('div', { class: 'card' }, el('h2', {}, 'Results'),
    el('ol', {}, ...(state.ranking ?? []).map(r =>
      el('li', {}, `${r.username} — ${Math.round(r.total * 100)}%`)))));
}
render();
