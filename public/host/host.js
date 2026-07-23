import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';
import { renderDashboard } from '/host/dashboard.js';
import { renderResults } from '/host/results.js';
import { spinReel } from '/host/roulette.js';

const app = document.getElementById('app');
let state = { phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null, ranking: null };
const bus = connect(onMsg);
state.bus = bus;

function onMsg(msg) {
  if (msg.type === 'ERROR') { alert(msg.message); return; }
  if (msg.type === 'STATE') { state.phase = msg.room.phase; state.room = msg.room; }
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
