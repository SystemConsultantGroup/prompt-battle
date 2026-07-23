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
