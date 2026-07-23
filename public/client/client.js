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
  render();
}
function render() {
  if (state.phase === 'JOIN') return renderJoin();
  return renderLobby();
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
render();
