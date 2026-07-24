import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

function setup() {
  const mgr = new GameManager({ now: () => 0, getProblem: () => undefined });
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice' || u === 'bob',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [],
  });
  const mkConn = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  return { mgr, hub, mkConn };
}

test('host auth creates a room and receives STATE', () => {
  const { hub, mkConn } = setup();
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  assert.equal(host.role, 'host');
  assert.ok(host.out.some(m => m.type === 'STATE'));
});

test('wrong admin password is rejected', () => {
  const { hub, mkConn } = setup();
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'nope' }));
  assert.equal(host.role, null);
  assert.ok(host.out.some(m => m.type === 'ERROR'));
});

test('HOST_AUTH with no adminPassword field does not throw and returns an ERROR', () => {
  const { hub, mkConn } = setup();
  const host = mkConn();
  hub.register(host);
  assert.doesNotThrow(() => {
    hub.handle(host, JSON.stringify({ type: 'HOST_AUTH' }));
  });
  assert.equal(host.role, null);
  assert.ok(host.out.some(m => m.type === 'ERROR'));
});

test('player join broadcasts PLAYER_JOINED to host', () => {
  const { hub, mkConn } = setup();
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  const player = mkConn();
  hub.register(player);
  hub.handle(player, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  assert.equal(player.role, 'player');
  assert.ok(host.out.some(m => m.type === 'PLAYER_JOINED' && m.username === 'alice'));
});

test('joining player does not receive their own PLAYER_JOINED broadcast', () => {
  const { hub, mkConn } = setup();
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  const alice = mkConn();
  hub.register(alice);
  hub.handle(alice, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  assert.ok(!alice.out.some(m => m.type === 'PLAYER_JOINED'));
  // but a second joiner still sees it, and so does alice
  alice.out.length = 0;
  const bob = mkConn();
  hub.register(bob);
  hub.handle(bob, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'bob' }));
  assert.ok(alice.out.some(m => m.type === 'PLAYER_JOINED' && m.username === 'bob'));
  assert.ok(!bob.out.some(m => m.type === 'PLAYER_JOINED'));
});

test('host disconnect evicts the room: broadcasts ROOM_CLOSED, removes the room, and notifies onRoomClosed', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => undefined });
  let closedCode: string | undefined;
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice' || u === 'bob',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [],
    onRoomClosed: (code) => { closedCode = code; },
  });
  const mkConn = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;

  const alice = mkConn();
  hub.register(alice);
  hub.handle(alice, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  alice.out.length = 0;

  hub.drop(host);

  assert.ok(alice.out.some(m => m.type === 'ROOM_CLOSED'));
  assert.equal(mgr.getRoom(code), undefined);
  assert.equal(closedCode, code);
});
