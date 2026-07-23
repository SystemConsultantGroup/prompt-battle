import { connect } from '/shared/ws.js';
import { el, mount } from '/shared/dom.js';

const app = document.getElementById('app');
let state = { phase: 'AUTH', room: null };
const bus = connect(onMsg);

function onMsg(msg) {
  if (msg.type === 'ERROR') { alert(msg.message); return; }
  if (msg.type === 'STATE') { state.phase = msg.room.phase; state.room = msg.room; }
  if (msg.type === 'PLAYER_JOINED') state.room.players.push({ username: msg.username });
  if (msg.type === 'PLAYER_LEFT') state.room.players = state.room.players.filter(p => p.username !== msg.username);
  render();
}
function render() {
  if (state.phase === 'AUTH') {
    const pw = el('input', { type: 'password', placeholder: 'Admin password' });
    return mount(app, el('div', { class: 'card' },
      el('h1', {}, 'Host'),
      pw,
      el('button', { onClick: () => bus.send({ type: 'HOST_AUTH', adminPassword: pw.value }) }, 'Enter')));
  }
  mount(app, el('div', { class: 'card' },
    el('h2', {}, `Room ${state.room ? location.hash : ''}`),
    el('p', {}, `Players: ${state.room?.players.length ?? 0}`),
    el('ul', {}, ...(state.room?.players ?? []).map(p => el('li', {}, p.username)))));
}
render();
