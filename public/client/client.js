import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';

const JOIN_KEY = 'pb_join';
const app = document.getElementById('app');
let state = { phase: 'JOIN', players: [], promptText: '' };
const bus = connect(onMsg, onOpen);

function storedJoin() {
  try {
    const raw = sessionStorage.getItem(JOIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearStoredJoin() {
  try { sessionStorage.removeItem(JOIN_KEY); } catch { /* ignore */ }
}

function onOpen() {
  const saved = storedJoin();
  if (saved) bus.send({ type: 'JOIN', roomCode: saved.roomCode, username: saved.username });
}

function onMsg(msg) {
  if (msg.type === 'ERROR') {
    // Avoid auto-rejoin loops: if the stored session no longer works
    // (evicted room, name taken, game already running), drop it and
    // fall back to a manual JOIN screen instead of retrying forever.
    clearStoredJoin();
    alert(msg.message);
    state = { phase: 'JOIN', players: [], promptText: '' };
    currentScreen = null;
    render();
    return;
  }
  if (msg.type === 'ROOM_CLOSED') {
    clearStoredJoin();
    alert('The host closed the room');
    state = { phase: 'JOIN', players: [], promptText: '' };
    currentScreen = null;
    render();
    return;
  }
  if (msg.type === 'STATE') {
    const room = msg.room;
    state.phase = room.phase;
    state.players = room.players;
    state.problemId = room.problemId;
    // A lobby means no active prompt — mirror the server's per-round reset
    // so stale text from a prior round can't bleed into the next editor.
    if (room.phase === 'LOBBY') state.promptText = '';
    state.promptText = msg.yourPrompt ?? state.promptText ?? '';
    state.remaining = room.deadline != null
      ? Math.max(0, Math.ceil((room.deadline - Date.now()) / 1000))
      : null;
    state.locked = (room.phase === 'GRADING' || room.phase === 'RESULT');
    // A STATE-driven reconnect into PLAYING should build the editor fresh
    // once (it may not currently be mounted), so drop the "already on
    // PLAYING" fast path for this specific transition.
    currentScreen = null;
  }
  if (msg.type === 'PLAYER_JOINED') state.players.push({ username: msg.username });
  if (msg.type === 'PLAYER_LEFT') state.players = state.players.filter(p => p.username !== msg.username);
  if (msg.type === 'GAME_START') { state.phase = 'PLAYING'; state.problemId = msg.problemId; state.promptText = ''; state.remaining = null; state.locked = false; }
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
      const roomCode = code.value.toUpperCase().trim();
      const username = name.value.trim();
      try { sessionStorage.setItem(JOIN_KEY, JSON.stringify({ roomCode, username })); } catch { /* ignore */ }
      bus.send({ type: 'JOIN', roomCode, username });
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
  ta.value = state.promptText ?? '';
  ta.disabled = !!state.locked;
  ta.addEventListener('input', () => {
    state.promptText = ta.value;
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
