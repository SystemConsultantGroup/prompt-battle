import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 3, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };

// Fake scheduler covering both interval (game tick) and timeout (host-evict
// grace) — the full Scheduler surface GameManager now requires.
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
    advance: (ms: number) => { t += ms; for (const fn of [...intervals]) fn(); },
  };
}

function setupPlaying() {
  const c = fakeClock();
  const mgr = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice' || u === 'bob',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [problem],
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
  assert.equal(mgr.summary(code).phase, 'PLAYING');
  return { c, mgr, hub, mk, code, host, alice };
}

// --- GameManager unit-level coverage ---------------------------------

test('markDisconnected flips connected but preserves the prompt', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPrompt(code, 'alice', 'a button');
  mgr.setPhase(code, 'PLAYING');

  mgr.markDisconnected(code, 'alice');

  const p = mgr.getRoom(code)!.players.get('alice')!;
  assert.equal(p.connected, false);
  assert.equal(p.prompt, 'a button');
});

test('markDisconnected on an absent player/room is a no-op', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  assert.doesNotThrow(() => mgr.markDisconnected('NOPE', 'alice'));
  const code = mgr.createRoom({ maxPlayers: 4 });
  assert.doesNotThrow(() => mgr.markDisconnected(code, 'ghost'));
});

test('joinPlayer reclaims a disconnected player mid-game, keeping their prompt', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPrompt(code, 'alice', 'a button');
  mgr.setPhase(code, 'PLAYING');
  mgr.markDisconnected(code, 'alice');

  const res = mgr.joinPlayer(code, 'alice', true);

  assert.equal(res.ok, true);
  assert.equal(res.reconnected, true);
  assert.equal(mgr.getPrompt(code, 'alice'), 'a button');
  assert.equal(mgr.getRoom(code)!.players.get('alice')!.connected, true);
});

test('joinPlayer rejects a NEW username while the game is in progress', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.setPhase(code, 'PLAYING');

  const res = mgr.joinPlayer(code, 'bob', true);

  assert.equal(res.ok, false);
  assert.equal(res.error, 'game in progress');
});

test('joinPlayer rejects a duplicate JOIN while the existing slot is still connected', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.joinPlayer(code, 'alice', true); // still connected

  const res = mgr.joinPlayer(code, 'alice', true);

  assert.equal(res.ok, false);
  assert.equal(res.error, 'name in use');
});

// --- Hub integration coverage ------------------------------------------

test('player drop mid-game keeps the slot (no PLAYER_LEFT); a same-name JOIN reclaims it with yourPrompt restored', () => {
  const { mgr, hub, mk, code, host, alice } = setupPlaying();
  hub.handle(alice, JSON.stringify({ type: 'PROMPT_UPDATE', text: 'a red button' }));
  host.out.length = 0;

  hub.drop(alice);

  // Slot preserved, not broadcast as a departure.
  assert.equal(mgr.getRoom(code)!.players.has('alice'), true);
  assert.equal(mgr.getRoom(code)!.players.get('alice')!.connected, false);
  assert.equal(mgr.getRoom(code)!.players.get('alice')!.prompt, 'a red button');
  assert.ok(!host.out.some(m => m.type === 'PLAYER_LEFT'));

  const rejoined = mk(); hub.register(rejoined);
  hub.handle(rejoined, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));

  assert.equal(rejoined.role, 'player');
  const state = rejoined.out.find(m => m.type === 'STATE');
  assert.ok(state && state.type === 'STATE');
  assert.equal((state as { yourPrompt?: string }).yourPrompt, 'a red button');
  assert.equal(mgr.getRoom(code)!.players.get('alice')!.connected, true);
  // Reconnect must not look like a fresh join to the rest of the room.
  assert.ok(!host.out.some(m => m.type === 'PLAYER_JOINED' && m.username === 'alice'));
});

test('a brand-new username cannot JOIN once the game is PLAYING', () => {
  const { hub, mk, code } = setupPlaying();
  const bob = mk(); hub.register(bob);

  hub.handle(bob, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'bob' }));

  assert.equal(bob.role, null);
  const err = bob.out.find(m => m.type === 'ERROR');
  assert.ok(err && err.type === 'ERROR' && err.message === 'game in progress');
});

test('a duplicate JOIN while the player connection is still live is rejected as name in use', () => {
  const { hub, mk, code } = setupPlaying();
  const impostor = mk(); hub.register(impostor);

  hub.handle(impostor, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));

  assert.equal(impostor.role, null);
  const err = impostor.out.find(m => m.type === 'ERROR');
  assert.ok(err && err.type === 'ERROR' && err.message === 'name in use');
});
