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
    alert(msg.message);
    return;
  }
  if (msg.type === 'ROOM_CLOSED') {
    clearStoredHost();
    alert('Room closed');
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
    if (state.pendingMode !== 'direct') state.animateWinner = msg.problemId;
  }
  if (msg.type === 'GAME_START') { state.phase = 'PLAYING'; state.problemId = msg.problemId; state.mirror = {}; }
  if (msg.type === 'TICK') state.remaining = msg.remainingSec;
  if (msg.type === 'PROMPT_MIRROR') state.mirror[msg.username] = msg.text;
  if (msg.type === 'GAME_END') state.remaining = 0;
  if (msg.type === 'GRADING_PROGRESS') { state.phase = 'GRADING'; state.progress = msg; }
  if (msg.type === 'RESULT') { state.phase = 'RESULT'; state.ranking = msg.ranking; }
  render();
}

function renderAuth() {
  const pw = el('input', { type: 'password', placeholder: 'Admin password' });
  return mount(app, el('div', { class: 'card' },
    el('h1', {}, 'Host'),
    pw,
    el('button', {
      onClick: () => { state.pw = pw.value; bus.send({ type: 'HOST_AUTH', adminPassword: pw.value }); },
    }, 'Enter')));
}

async function fetchProblems() {
  const res = await fetch('/api/problems', { headers: { 'x-admin-password': state.pw } });
  return res.ok ? res.json() : [];
}

function renderLobby() {
  const info = el('div', {},
    el('h2', {}, `Room ${state.room?.code ?? ''}`),
    el('p', {}, `Players: ${state.room?.players.length ?? 0} — ${(state.room?.players ?? []).map(p => p.username).join(', ')}`));
  const reel = el('div', { class: 'reel' });
  const startBtn = el('button', {}, 'Start');
  startBtn.disabled = state.problemId == null;
  startBtn.addEventListener('click', () => state.bus.send({ type: 'START' }));

  const pickDirect = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    mount(reel, ...ps.map(p => el('button', { onClick: () => {
      state.pendingMode = 'direct'; state.bus.send({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: p.id });
    } }, `${p.title} (${p.difficulty}, ${p.timeLimitSec}s)`)));
  } }, 'Direct pick');

  const spinBtn = el('button', { onClick: async () => {
    const ps = await fetchProblems();
    state.reelPool = ps;
    state.pendingMode = 'roulette';
    state.bus.send({ type: 'SELECT_PROBLEM', mode: 'roulette' });
  } }, 'Roulette');

  const catBtn = el('button', { onClick: async () => {
    const cats = await (await fetch('/api/categories', { headers: { 'x-admin-password': state.pw } })).json();
    mount(reel, ...cats.map(c => el('button', { onClick: async () => {
      state.reelPool = (await fetchProblems()).filter(p => p.category === c);
      state.pendingMode = 'category';
      state.bus.send({ type: 'SELECT_PROBLEM', mode: 'category', category: c });
    } }, c)));
  } }, 'Category roulette');

  mount(app, el('div', { class: 'card wide' }, info,
    el('div', { class: 'modes' }, pickDirect, spinBtn, catBtn),
    reel,
    el('p', {}, state.problemId != null ? `Selected problem #${state.problemId} — ${state.timeLimitSec}s` : 'No problem selected'),
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
    el('h2', {}, 'Grading…'), el('p', {}, state.progress ? `${state.progress.done}/${state.progress.total}` : '')));
  if (state.phase === 'RESULT') return handleResults();
  return renderLobby();
}

render();
