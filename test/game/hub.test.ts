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

function fakeTimeoutScheduler() {
  const pending = new Map<number, () => void>();
  let nextId = 1;
  return {
    scheduler: {
      // interval isn't exercised by these tests, but GameManager's Scheduler
      // type requires all four members.
      setInterval: () => { throw new Error('unexpected setInterval'); },
      clearInterval: () => {},
      setTimeout: (fn: () => void) => {
        const id = nextId++;
        pending.set(id, fn);
        return id;
      },
      clearTimeout: (h: unknown) => { pending.delete(h as number); },
    },
    // Fires (and removes) every timer currently pending — mirrors a single
    // real-timer tick, since a fired one-shot timer never fires again.
    advance: () => { const fns = [...pending.values()]; pending.clear(); for (const fn of fns) fn(); },
    pendingCount: () => pending.size,
  };
}

test('host disconnect grace: room survives immediately after drop, and is only evicted once the grace timer fires', () => {
  const clock = fakeTimeoutScheduler();
  const mgr = new GameManager({ now: () => 0, getProblem: () => undefined, scheduler: clock.scheduler });
  let closedCode: string | undefined;
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice' || u === 'bob',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [],
    onRoomClosed: (code) => { closedCode = code; },
    hostEvictGraceMs: 5000,
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

  // Grace period just started: room must still be alive, nothing broadcast yet.
  assert.equal(mgr.getRoom(code) !== undefined, true);
  assert.ok(!alice.out.some(m => m.type === 'ROOM_CLOSED'));
  assert.equal(closedCode, undefined);

  clock.advance();

  assert.ok(alice.out.some(m => m.type === 'ROOM_CLOSED'));
  assert.equal(mgr.getRoom(code), undefined);
  assert.equal(closedCode, code);
});

test('host reclaim (HOST_AUTH with roomCode) before the grace timer fires cancels the eviction', () => {
  const clock = fakeTimeoutScheduler();
  const mgr = new GameManager({ now: () => 0, getProblem: () => undefined, scheduler: clock.scheduler });
  let closedCode: string | undefined;
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice' || u === 'bob',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [],
    onRoomClosed: (code) => { closedCode = code; },
    hostEvictGraceMs: 5000,
  });
  const mkConn = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  const host = mkConn();
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;

  hub.drop(host);
  assert.equal(clock.pendingCount(), 1);

  const rehost = mkConn();
  hub.register(rehost);
  hub.handle(rehost, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw', roomCode: code }));
  assert.equal(rehost.role, 'host');
  assert.equal(rehost.roomCode, code);
  assert.equal(clock.pendingCount(), 0);

  // The grace timer was cancelled — even "advancing" it must not evict.
  clock.advance();

  assert.equal(mgr.getRoom(code) !== undefined, true);
  assert.equal(closedCode, undefined);
  assert.ok(!rehost.out.some(m => m.type === 'ROOM_CLOSED'));
});
