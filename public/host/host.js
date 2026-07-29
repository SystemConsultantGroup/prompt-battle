import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';
import { renderDashboard } from '/host/dashboard.js';
import { renderResults } from '/host/results.js';
import { spinReel } from '/host/roulette.js';

const HOST_KEY = 'pb_host';
const app = document.getElementById('app');
let state = { phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null, ranking: null };
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
      render();
    }
    alert(koErr(msg.message));
    return;
  }
  if (msg.type === 'ROOM_CLOSED') {
    clearStoredHost();
    alert('방이 종료되었습니다.');
    state = { phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null, ranking: null, bus };
    render();
    return;
  }
  if (msg.type === 'STATE') {
    state.phase = msg.room.phase; state.room = msg.room;
    state.problemId = msg.room.problemId; state.timeLimitSec = null;
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
  if (msg.type === 'GAME_START') { state.phase = 'PLAYING'; state.problemId = msg.problemId; state.mirror = {}; state.ending = false; }
  if (msg.type === 'TICK') state.remaining = msg.remainingSec;
  if (msg.type === 'PROMPT_MIRROR') state.mirror[msg.username] = msg.text;
  if (msg.type === 'GAME_END') state.remaining = 0;
  if (msg.type === 'GRADING_PROGRESS') { state.phase = 'GRADING'; state.progress = msg; }
  if (msg.type === 'RESULT') { state.phase = 'RESULT'; state.ranking = msg.ranking; }
  render();
}

function renderAuth() {
  const pw = el('input', { type: 'password', placeholder: '관리자 비밀번호' });
  return mount(app, el('div', { class: 'card' },
    el('h1', {}, '호스트'),
    pw,
    el('button', {
      onClick: () => { state.pw = pw.value; bus.send({ type: 'HOST_AUTH', adminPassword: pw.value }); },
    }, '입장')));
}

async function fetchProblems() {
  const res = await fetch('/api/problems', { headers: { 'x-admin-password': state.pw } });
  return res.ok ? res.json() : [];
}

function renderLobby() {
  const info = el('div', {},
    el('h2', {}, `방 ${state.room?.code ?? ''}`),
    el('p', {}, `참가자: ${state.room?.players.length ?? 0}명 — ${(state.room?.players ?? []).map(p => p.username).join(', ')}`));
  const reel = el('div', { class: 'reel' });
  const startBtn = el('button', {}, '시작');
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

  mount(app, el('div', { class: 'card wide' }, info,
    el('div', { class: 'modes' }, pickDirect, pickVariation, spinBtn, catBtn),
    reel,
    el('p', {}, state.problemId != null ? `선택된 문제 #${state.problemId} — ${state.timeLimitSec}초` : '선택된 문제 없음'),
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

function render() {
  if (state.phase === 'AUTH') return renderAuth();
  if (state.phase === 'PLAYING') return renderDashboard(app, state);
  if (state.phase === 'GRADING') return mount(app, el('div', { class: 'card' },
    el('h2', {}, '채점 중…'), el('p', {}, state.progress ? `${state.progress.done}/${state.progress.total}` : '')));
  if (state.phase === 'RESULT') return handleResults();
  return renderLobby();
}

render();
