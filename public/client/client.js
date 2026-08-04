import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';

const JOIN_KEY = 'pb_join';
const app = document.getElementById('app');
let state = { phase: 'JOIN', players: [], promptText: '', variationId: null };
const bus = connect(onMsg, onOpen);

// Map known server error codes (English) to Korean for display; fall back to
// the raw message so unmapped errors are still shown.
const ERR_KO = {
  'unknown room': '존재하지 않는 방입니다.',
  'unknown account': '등록되지 않은 이름입니다.',
  'name in use': '이미 사용 중인 이름입니다.',
  'game in progress': '게임이 이미 진행 중입니다.',
  'room full': '방이 가득 찼습니다.',
  'bad json': '잘못된 요청입니다.',
};
const koErr = (m) => ERR_KO[m] ?? m;

// ---- Inline toast helper -----------------------------------------------
// Shows a non-blocking banner inside a target element (prepended at top).
// kind: 'error' | 'warn' | 'info'
// If target is null, shows a fixed overlay that auto-dismisses after 5 s.
function showToast(msg, kind = 'error', target = null) {
  const t = el('div', { class: `toast ${kind}` }, msg);
  if (target) {
    // Inline: prepend into the given container element.
    target.prepend(t);
  } else {
    // Fixed overlay for full-screen views (PLAYING / GRADING / RESULT).
    t.classList.add('toast-fixed');
    document.body.appendChild(t);
    const remove = () => {
      t.classList.add('toast-out');
      t.addEventListener('animationend', () => t.remove(), { once: true });
    };
    setTimeout(remove, 5000);
    t.addEventListener('click', remove);
  }
}

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

// Pending join inputs — kept across ERROR so values are not wiped.
let _pendingCode = '';
let _pendingName = '';

function onMsg(msg) {
  if (msg.type === 'ERROR') {
    // Avoid auto-rejoin loops: if the stored session no longer works
    // (evicted room, name taken, game already running), drop it and
    // fall back to a manual JOIN screen instead of retrying forever.
    clearStoredJoin();
    const errText = koErr(msg.message);
    state = { phase: 'JOIN', players: [], promptText: '', variationId: null };
    currentScreen = null;
    render(errText);          // pass error so renderJoin can display it inline
    return;
  }
  if (msg.type === 'ROOM_CLOSED') {
    clearStoredJoin();
    state = { phase: 'JOIN', players: [], promptText: '', variationId: null };
    currentScreen = null;
    render('호스트가 방을 닫았습니다.');
    return;
  }
  if (msg.type === 'STATE') {
    const room = msg.room;
    state.phase = room.phase;
    state.players = room.players;
    state.problemId = room.problemId;
    // Restore the active variation on reconnect so a mid-round refresh shows
    // the actual (possibly variant) target, not the base render.
    state.variationId = room.activeVariationId ?? null;
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
  if (msg.type === 'GAME_START') { state.phase = 'PLAYING'; state.problemId = msg.problemId; state.variationId = msg.variationId; state.promptText = ''; state.remaining = null; state.locked = false; }
  if (msg.type === 'TICK') state.remaining = msg.remainingSec;
  if (msg.type === 'GAME_END') { state.locked = true; }
  if (msg.type === 'GRADING_PROGRESS') { state.phase = 'GRADING'; state.progress = msg; }
  if (msg.type === 'RESULT') { state.phase = 'RESULT'; state.ranking = msg.ranking; }
  render();
}
let currentScreen = null;
function render(errMsg) {
  const target = state.phase;
  if (target === 'PLAYING' && currentScreen === 'PLAYING') {
    // Propagate error as a fixed toast on the full-screen editor.
    if (errMsg) showToast(errMsg, 'error', null);
    updateEditor();
    return;
  }
  currentScreen = target;
  if (target === 'JOIN') return renderJoin(errMsg);
  if (target === 'LOBBY') return renderLobby();
  if (target === 'PLAYING') return renderEditor();
  if (target === 'GRADING') return renderGrading();
  if (target === 'RESULT') return renderResult();
}
function renderJoin(errMsg) {
  const code = el('input', { placeholder: '방 코드', id: 'join-code' });
  const name = el('input', { placeholder: '이름', id: 'join-name' });
  // Restore previously typed values so a server error doesn't wipe the fields.
  code.value = _pendingCode;
  name.value = _pendingName;

  const card = el('div', { class: 'card' },
    el('h1', {}, 'Prompt Battle'),
    code, name,
    el('button', { id: 'join-btn', onClick: doJoin }, '입장'));

  // Show inline error banner at the top of the card.
  if (errMsg) {
    const banner = el('div', { class: 'toast error' }, errMsg);
    card.insertBefore(banner, card.firstChild);
  }

  mount(app, card);

  // Focus the appropriate field.
  if (!code.value) code.focus();
  else if (!name.value) name.focus();

  // Enter key on either field triggers join.
  function doJoin() {
    _pendingCode = code.value.toUpperCase().trim();
    _pendingName = name.value.trim();
    try { sessionStorage.setItem(JOIN_KEY, JSON.stringify({ roomCode: _pendingCode, username: _pendingName })); } catch { /* ignore */ }
    bus.send({ type: 'JOIN', roomCode: _pendingCode, username: _pendingName });
    state.phase = 'LOBBY';
  }
  code.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
  name.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
}
function renderLobby() {
  mount(app, el('div', { class: 'card' },
    el('h2', {}, '호스트를 기다리는 중…'),
    el('ul', {}, ...state.players.map(p => el('li', {}, p.username)))));
}
let debounce;
let editorTimerEl = null;
let editorTextareaEl = null;
function renderEditor() {
  const targetSrc = state.variationId != null
    ? `/render/variation/${state.variationId}`
    : `/render/target/${state.problemId}`;
  const frame = el('iframe', { class: 'target', src: targetSrc, sandbox: 'allow-scripts' });
  const ta = el('textarea', { class: 'prompt', placeholder: '만들 UI를 설명하세요…' });
  ta.value = state.promptText ?? '';
  ta.disabled = !!state.locked;
  ta.addEventListener('input', () => {
    state.promptText = ta.value;
    clearTimeout(debounce);
    debounce = setTimeout(() => bus.send({ type: 'PROMPT_UPDATE', text: ta.value }), 300);
  });
  const timer = el('div', { class: 'timer' }, state.remaining == null ? '…' : `${state.remaining}초`);
  editorTimerEl = timer;
  editorTextareaEl = ta;
  mount(app, el('div', { class: 'play' },
    el('div', { class: 'goal' }, el('h3', {}, '목표'), frame),
    el('div', { class: 'work' }, timer, ta)));
}
// PLAYING is already mounted (e.g. TICK/GAME_END arrived) — patch only the
// mutable bits in place so the textarea/iframe are never destroyed.
function updateEditor() {
  if (editorTimerEl) editorTimerEl.textContent = state.remaining == null ? '…' : `${state.remaining}초`;
  if (editorTextareaEl) editorTextareaEl.disabled = !!state.locked;
}
function renderGrading() {
  const p = state.progress;
  mount(app, el('div', { class: 'card' }, el('h2', {}, '채점 중…'),
    el('p', {}, p ? `${p.done}/${p.total}` : '')));
}
function renderResult() {
  mount(app, el('div', { class: 'card' }, el('h2', {}, '결과'),
    el('ol', {}, ...(state.ranking ?? []).map(r =>
      el('li', {}, `${r.username} — ${Math.round(r.total * 100)}%`)))));
}
render();
