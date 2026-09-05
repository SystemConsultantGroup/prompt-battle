import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';
import { renderDashboard } from '/host/dashboard.js';
import { renderResults } from '/host/results.js';
import { renderGrading } from '/shared/grading.js';
import { spinReel } from '/host/roulette.js';

const HOST_KEY = 'pb_host';
const app = document.getElementById('app');
let state = {
  phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null,
  ranking: null, variationId: null, timeLimitSec: null,
};
// Must stay in sync with TIME_LIMIT_OPTIONS in src/game/types.ts — the server
// rejects anything outside that set, so a drift here shows up as an error toast.
const TIME_LIMITS = [30, 60, 90, 120, 150];
// Problem titles, cached from /api/problems so the lobby can name the armed
// problem instead of showing a bare id.
const problemTitles = new Map();
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
    // Only roulette/category picks are hidden-then-revealed via the spinning
    // reel; direct and variation picks are chosen explicitly by the host and
    // should just update the selection display immediately.
    if (state.pendingMode === 'roulette' || state.pendingMode === 'category') state.animateWinner = msg.problemId;
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
  const ps = res.ok ? await res.json() : [];
  for (const p of ps) problemTitles.set(p.id, p.title);
  return ps;
}

function renderLobby() {
  const players = state.room?.players ?? [];
  const info = el('div', {},
    el('p', { class: 'eyebrow' }, '방 코드'),
    el('div', { class: 'roomcode' }, state.room?.code ?? '----'),
    el('p', { class: 'eyebrow', style: 'margin-top:20px' }, `참가자 ${players.length}명`),
    players.length
      ? el('div', { class: 'modes' }, ...players.map(p => el('span', { class: 'chip' }, p.username)))
      : el('p', {}, '아직 아무도 안 들어왔습니다.'));
  const reel = el('div', { class: 'reel' });
  const startBtn = el('button', {}, '시작하기');
  startBtn.disabled = state.problemId == null;
  startBtn.addEventListener('click', () => state.bus.send({ type: 'START' }));

  const pickDirect = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    mount(reel, ...ps.map(p => el('button', { onClick: () => {
      state.pendingMode = 'direct'; state.bus.send({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: p.id });
    } }, `${p.title} (${diffKo(p.difficulty)}, ${p.timeLimitSec}초)`)));
  } }, '직접 선택');

  const pickVariation = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    mount(reel, ...ps.map(p => el('button', { onClick: () => {
      state.pendingMode = 'variation'; state.bus.send({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: p.id });
    } }, `${p.title} (${diffKo(p.difficulty)}, ${p.timeLimitSec}초)`)));
  } }, '문제 + 랜덤 변형');

  const spinBtn = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    state.reelPool = ps;
    state.pendingMode = 'roulette';
    state.bus.send({ type: 'SELECT_PROBLEM', mode: 'roulette' });
  } }, '룰렛');

  const catBtn = el('button', { onClick: async () => {
    const cats = await (await fetch('/api/categories', { headers: { 'x-admin-password': state.pw } })).json();
    mount(reel, ...cats.map(c => el('button', { onClick: async () => {
      state.reelPool = (await fetchProblems()).filter(p => p.category === c);
      state.pendingMode = 'category';
      state.bus.send({ type: 'SELECT_PROBLEM', mode: 'category', category: c });
    } }, c)));
  } }, '카테고리 룰렛');

  // Round length. Disabled until a problem is armed, because selecting one
  // re-seeds the length from that problem and would discard an earlier pick.
  const timeBtns = TIME_LIMITS.map(sec => {
    const b = el('button', {
      class: state.timeLimitSec === sec ? 'on' : '',
      onClick: () => state.bus.send({ type: 'SET_TIME_LIMIT', seconds: sec }),
    }, `${sec}초`);
    b.disabled = state.problemId == null;
    return b;
  });

  // After a host reclaim the title cache is empty but a problem may already be
  // armed. Backfill once (the flag stops a fetch→render→fetch loop when the
  // id genuinely isn't in the list).
  if (state.problemId != null && !problemTitles.has(state.problemId) && !state.titlesFetched) {
    state.titlesFetched = true;
    fetchProblems().then(() => { if (state.phase === 'LOBBY') render(); });
  }
  const title = state.problemId != null ? problemTitles.get(state.problemId) : null;
  const selection = state.problemId != null
    ? el('div', { class: 'selection' },
        `선택된 문제: ${title ?? `#${state.problemId}`} — 제한시간 ${state.timeLimitSec ?? '?'}초`)
    : el('div', { class: 'selection none' }, '아직 문제를 고르지 않았습니다.');

  mount(app, el('div', { class: 'card wide' }, info,
    el('p', { class: 'eyebrow', style: 'margin-top:20px' }, '문제 고르기'),
    el('div', { class: 'modes' }, pickDirect, pickVariation, spinBtn, catBtn),
    reel,
    el('p', { class: 'eyebrow' }, '제한시간'),
    el('div', { class: 'timeopts' }, ...timeBtns),
    selection,
    startBtn));

  // if a roulette selection just arrived, animate then reveal
  if (state.animateWinner && state.reelPool) {
    spinReel(reel, state.reelPool, state.animateWinner, () => {});
    state.animateWinner = null;
  }
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
