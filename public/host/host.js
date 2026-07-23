import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';
import { renderDashboard } from '/host/dashboard.js';
import { renderResults } from '/host/results.js';

const app = document.getElementById('app');
let state = { phase: 'AUTH', room: null, mirror: {}, remaining: null, progress: null, ranking: null };
const bus = connect(onMsg);
state.bus = bus;

function onMsg(msg) {
  if (msg.type === 'ERROR') { alert(msg.message); return; }
  if (msg.type === 'STATE') { state.phase = msg.room.phase; state.room = msg.room; }
  if (msg.type === 'PLAYER_JOINED') state.room.players.push({ username: msg.username });
  if (msg.type === 'PLAYER_LEFT') state.room.players = state.room.players.filter(p => p.username !== msg.username);
  if (msg.type === 'PROBLEM_SELECTED') { state.problemId = msg.problemId; state.timeLimitSec = msg.timeLimitSec; }
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
    el('button', { onClick: () => bus.send({ type: 'HOST_AUTH', adminPassword: pw.value }) }, 'Enter')));
}

function renderLobby() {
  return mount(app, el('div', { class: 'card' },
    el('h2', {}, `Room ${state.room ? location.hash : ''}`),
    el('p', {}, `Players: ${state.room?.players.length ?? 0}`),
    el('ul', {}, ...(state.room?.players ?? []).map(p => el('li', {}, p.username)))));
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
