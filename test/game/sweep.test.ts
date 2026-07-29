import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 3, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };

// Fake scheduler with manual timeout firing.
function fakeClock() {
  let t = 0;
  const intervals = new Set<() => void>();
  const timeouts = new Map<number, () => void>();
  let nextId = 1;
  return {
    now: () => t,
    scheduler: {
      setInterval: (fn: () => void) => { intervals.add(fn); return fn; },
      clearInterval: (h: unknown) => { intervals.delete(h as () => void); },
      setTimeout: (fn: () => void) => { const id = nextId++; timeouts.set(id, fn); return id; },
      clearTimeout: (h: unknown) => { timeouts.delete(h as number); },
    },
    fireTimeouts: () => { for (const fn of [...timeouts.values()]) fn(); },
    pendingTimeouts: () => timeouts.size,
  };
}

// --- GameManager unit-level coverage ---------------------------------

test('markDisconnected with a grace schedules a sweep that removes the abandoned slot', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPhase(code, 'PLAYING');

  const swept: string[] = [];
  mgr.markDisconnected(code, 'alice', { graceMs: 1000, onSweep: (_c, u) => swept.push(u) });
  assert.equal(mgr.getRoom(code)!.players.has('alice'), true); // still there before grace

  c.fireTimeouts();

  assert.equal(mgr.getRoom(code)!.players.has('alice'), false);
  assert.deepEqual(swept, ['alice']);
});

test('reconnecting before the sweep cancels it and keeps the slot', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPrompt(code, 'alice', 'a button');
  mgr.setPhase(code, 'PLAYING');

  const swept: string[] = [];
  mgr.markDisconnected(code, 'alice', { graceMs: 1000, onSweep: (_c, u) => swept.push(u) });
  const res = mgr.joinPlayer(code, 'alice', true); // reconnect
  assert.equal(res.reconnected, true);
  assert.equal(c.pendingTimeouts(), 0); // timer cancelled

  c.fireTimeouts();

  assert.equal(mgr.getRoom(code)!.players.has('alice'), true);
  assert.equal(mgr.getPrompt(code, 'alice'), 'a button');
  assert.deepEqual(swept, []);
});

test('the sweep does not fire if the player already reconnected (defensive)', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPhase(code, 'PLAYING');
  const swept: string[] = [];
  mgr.markDisconnected(code, 'alice', { graceMs: 1000, onSweep: (_c, u) => swept.push(u) });
  // Force-mark connected without cancelling (simulates a race)
  mgr.getRoom(code)!.players.get('alice')!.connected = true;

  c.fireTimeouts();

  assert.equal(mgr.getRoom(code)!.players.has('alice'), true);
  assert.deepEqual(swept, []);
});

test('markDisconnected without a grace (legacy 2-arg) does not schedule any timer', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPhase(code, 'PLAYING');

  mgr.markDisconnected(code, 'alice');

  assert.equal(c.pendingTimeouts(), 0);
  assert.equal(mgr.getRoom(code)!.players.get('alice')!.connected, false);
});

test('removeRoom clears pending player sweep timers', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPhase(code, 'PLAYING');
  mgr.markDisconnected(code, 'alice', { graceMs: 1000, onSweep: () => {} });

  mgr.removeRoom(code);

  assert.equal(c.pendingTimeouts(), 0);
});

// --- Hub integration coverage ------------------------------------------

test('a player who drops mid-game and never returns is swept, broadcasting PLAYER_LEFT', () => {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [problem],
    listVariations: () => [],
    playerSweepGraceMs: 1000,
  });
  const mk = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  const alice = mk(); hub.register(alice);
  hub.handle(alice, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  host.out.length = 0;

  hub.drop(alice);
  assert.equal(mgr.getRoom(code)!.players.has('alice'), true); // preserved during grace
  c.fireTimeouts();

  assert.equal(mgr.getRoom(code)!.players.has('alice'), false);
  assert.ok(host.out.some(m => m.type === 'PLAYER_LEFT' && m.username === 'alice'));
});
