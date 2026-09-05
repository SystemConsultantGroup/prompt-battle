import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';
import { renderDashboard } from '/host/dashboard.js';
import { renderResults } from '/host/results.js';
import { renderGrading } from '/shared/grading.js';
import { renderLobbyBoard } from '/shared/lobby.js';

const HOST_KEY = 'pb_host';
const app = document.getElementById('app');
let state = {
  phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null,
  ranking: null, variationId: null, timeLimitSec: null,
};
const bus = connect(onMsg, onOpen);
state.bus = bus;

// Difficulty labels for display (DB stores English identifiers).
const DIFF_KO = { easy: '쉬움', normal: '보통', hard: '어려움' };
const diffKo = (d) => DIFF_KO[d] ?? d;
// Known server error codes → Korean; fall back to the raw message.
const ERR_KO = {
  'bad admin password': '관리자 비밀번호가 올바르지 않습니다.',
  'not host': '호스트만 할 수 있는 동작입니다.',
  'no problem': '문제를 먼저 선택하세요.',
  'not in lobby': '로비에서만 할 수 있습니다.',
  'unknown problem': '존재하지 않는 문제입니다.',
  'empty pool': '선택할 문제가 없습니다.',
};
const koErr = (m) => ERR_KO[m] ?? m;

// ---- Inline toast helper -----------------------------------------------
// Shows a non-blocking banner.
// If target is provided it is prepended into that element (inline in card).
// If target is null, a fixed top-center overlay is shown and auto-dismissed.
function showToast(msg, kind = 'error', target = null) {
  const t = el('div', { class: `toast ${kind}` }, msg);
  if (target) {
    // Remove any existing inline banner first to avoid stacking.
    target.querySelector('.toast:not(.toast-fixed)')?.remove();
    target.prepend(t);
  } else {
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

function storedHost() {
  try {
    const raw = sessionStorage.getItem(HOST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearStoredHost() {
  try { sessionStorage.removeItem(HOST_KEY); } catch { /* ignore */ }
}

function onOpen() {
  const saved = storedHost();
  if (saved) {
    state.pw = saved.pw;
    bus.send({ type: 'HOST_AUTH', adminPassword: saved.pw, roomCode: saved.roomCode });
  }
}

// Ref to the auth card DOM node — used to show inline errors.
let _authCard = null;
// Last typed password — kept so auth errors don't wipe the field.
let _pendingPw = '';

function onMsg(msg) {
  if (msg.type === 'ERROR') {
    // A bad admin password can arrive at any phase, not just AUTH: a mid-game
    // socket drop→reopen auto-sends HOST_AUTH via onOpen, and if the stored
    // password is stale/wrong the server rejects it while phase is still
    // PLAYING/GRADING/etc. Detect the failure by message (server sends this
    // exact string), not by current phase, so the stored session always
    // gets cleared and the host lands back on the password screen instead
    // of freezing on stale data and retrying forever.
    if (msg.message === 'bad admin password') {
      clearStoredHost();
      state.phase = 'AUTH';
      render(koErr(msg.message));
      return;
    }
    // Other errors (not-host, no-problem, etc.): show as fixed toast so the
    // current screen isn't replaced.
    showToast(koErr(msg.message), 'error', null);
    return;
  }
  if (msg.type === 'ROOM_CLOSED') {
    clearStoredHost();
    state = { phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null, ranking: null, bus };
    render('방이 종료되었습니다.');
    return;
  }
  if (msg.type === 'STATE') {
    state.phase = msg.room.phase; state.room = msg.room;
    state.problemId = msg.room.problemId;
    // Carry the round length and active variation across a host reclaim so the
    // lobby shows the real armed pick and the dashboard renders the real goal.
    state.timeLimitSec = msg.room.timeLimitSec ?? null;
    state.problemTitle = msg.room.problemTitle ?? null;
    state.variationId = msg.room.activeVariationId ?? null;
    // A reclaim during RESULT gets the finished board back from the summary;
    // a reclaim into any other phase clears it so a stale board can't linger.
    state.ranking = msg.room.ranking ?? null;
    if (msg.room.phase !== 'GRADING') state.progress = null;
    // Restore the countdown immediately on reclaim so the dashboard timer
    // isn't blank until the next TICK arrives (which then corrects skew).
    state.remaining = (msg.room.deadline != null && msg.room.phase === 'PLAYING')
      ? Math.max(0, Math.ceil((msg.room.deadline - Date.now()) / 1000))
      : state.remaining;
    if (msg.role === 'host') {
      try { sessionStorage.setItem(HOST_KEY, JSON.stringify({ pw: state.pw, roomCode: msg.room.code })); } catch { /* ignore */ }
    }
  }
  if (msg.type === 'PLAYER_JOINED') state.room.players.push({ username: msg.username });
  if (msg.type === 'PLAYER_LEFT') state.room.players = state.room.players.filter(p => p.username !== msg.username);
  if (msg.type === 'PROBLEM_SELECTED') {
    state.problemId = msg.problemId; state.timeLimitSec = msg.timeLimitSec;
    state.problemTitle = msg.title;
    // The server says which modes spin and hands over the pool, so host and
    // players run the identical reel off the identical data.
    state.spin = msg.reelPool ? { pool: msg.reelPool, winnerId: msg.problemId } : null;
  }
  if (msg.type === 'TIME_LIMIT_SET') state.timeLimitSec = msg.timeLimitSec;
  if (msg.type === 'GAME_START') {
    state.phase = 'PLAYING'; state.problemId = msg.problemId;
    // The dashboard renders the same goal the players see — including the
    // variation the server rolled, not the base target.
    state.variationId = msg.variationId ?? null;
    state.mirror = {}; state.ending = false;
  }
  if (msg.type === 'TICK') state.remaining = msg.remainingSec;
  if (msg.type === 'PROMPT_MIRROR') state.mirror[msg.username] = msg.text;
  // Same jump as the players make, so host and room show the identical
  // grading screen from the moment the round ends.
  if (msg.type === 'GAME_END') { state.remaining = 0; state.phase = 'GRADING'; state.progress = null; }
  if (msg.type === 'GRADING_PROGRESS') { state.phase = 'GRADING'; state.progress = msg; }
  if (msg.type === 'RESULT') { state.phase = 'RESULT'; state.ranking = msg.ranking; }
  render();
}

function renderAuth(errMsg) {
  const pw = el('input', { type: 'password', placeholder: '관리자 비밀번호', id: 'host-pw' });
  // Restore previously typed password so auth errors don't wipe the field.
  pw.value = _pendingPw;

  const card = el('div', { class: 'card' },
    el('h1', {}, '호스트'),
    pw,
    el('button', { id: 'host-login-btn', onClick: doAuth }, '입장'));

  // Show inline error banner if provided.
  if (errMsg) {
    const banner = el('div', { class: 'toast error' }, errMsg);
    card.insertBefore(banner, card.firstChild);
  }

  _authCard = card;
  mount(app, card);

  // Focus the password field; select existing text so user can retype easily.
  pw.focus();
  if (pw.value) pw.select();

  // Enter key triggers auth.
  pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth(); });

  function doAuth() {
    _pendingPw = pw.value;
    state.pw = pw.value;
    bus.send({ type: 'HOST_AUTH', adminPassword: pw.value });
  }
  return card;
}

async function fetchProblems() {
  const res = await fetch('/api/problems', { headers: { 'x-admin-password': state.pw } });
  return res.ok ? await res.json() : [];
}

function renderLobby() {
  const startBtn = el('button', {}, '시작하기');
  startBtn.disabled = state.problemId == null;
  startBtn.addEventListener('click', () => state.bus.send({ type: 'START' }));

  // The mode buttons fill the reel slot with their own menu; the shared board
  // hands that element back so this stays the host's only extra wiring.
  let reel;
  const menu = (nodes) => mount(reel, ...nodes);

  const pickDirect = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    menu(ps.map(p => el('button', {
      onClick: () => state.bus.send({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: p.id }),
    }, `${p.title} (${diffKo(p.difficulty)}, ${p.timeLimitSec}초)`)));
  } }, '직접 선택');

  const pickVariation = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    menu(ps.map(p => el('button', {
      onClick: () => state.bus.send({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: p.id }),
    }, `${p.title} (${diffKo(p.difficulty)}, ${p.timeLimitSec}초)`)));
  } }, '문제 + 랜덤 변형');

  const spinBtn = el('button', {
    onClick: () => state.bus.send({ type: 'SELECT_PROBLEM', mode: 'roulette' }),
  }, '룰렛');

  const catBtn = el('button', { onClick: async () => {
    const cats = await (await fetch('/api/categories', { headers: { 'x-admin-password': state.pw } })).json();
    menu(cats.map(c => el('button', {
      onClick: () => state.bus.send({ type: 'SELECT_PROBLEM', mode: 'category', category: c }),
    }, c)));
  } }, '카테고리 룰렛');

  reel = renderLobbyBoard(app, {
    roomCode: state.room?.code,
    players: state.room?.players ?? [],
    problemId: state.problemId,
    problemTitle: state.problemTitle,
    timeLimitSec: state.timeLimitSec,
    onPickTime: (sec) => state.bus.send({ type: 'SET_TIME_LIMIT', seconds: sec }),
    controls: el('div', { class: 'modes' }, pickDirect, pickVariation, spinBtn, catBtn),
    footer: startBtn,
    spin: state.spin,
  });
  // One spin per selection: clear it so a later re-render (a player joining,
  // a time-limit change) doesn't replay the reel.
  state.spin = null;
}

function handleResults() {
  return renderResults(app, state);
}

function render(errMsg) {
  if (state.phase === 'AUTH') return renderAuth(errMsg);
  // For full-screen phases, pass the error as a fixed toast.
  if (errMsg) showToast(errMsg, 'warn', null);
  if (state.phase === 'PLAYING') return renderDashboard(app, state);
  if (state.phase === 'GRADING') return renderGrading(app, state);
  if (state.phase === 'RESULT') return handleResults();
  return renderLobby();
}

render();
