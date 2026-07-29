import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 3, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };
const variation = { id: 7, problemId: 1, label: 'dark',
  targetHtml: '<b>v</b>', targetCss: '', targetJs: '', sortOrder: 0 };

test('summary carries activeVariationId (null by default)', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  assert.equal(mgr.summary(code).activeVariationId, null);
});

test('summary reflects the active variation once set', () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const code = mgr.createRoom({ maxPlayers: 4 });
  mgr.selectProblem(code, 1);
  mgr.setActiveVariation(code, 7);
  assert.equal(mgr.summary(code).activeVariationId, 7);
});

test('reconnecting mid-variation-round restores the variation via STATE', () => {
  // Inject a no-op scheduler so START's interval doesn't keep the process alive.
  const scheduler = {
    setInterval: (fn: () => void) => fn,
    clearInterval: () => {},
    setTimeout: (fn: () => void) => fn,
    clearTimeout: () => {},
  };
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem, scheduler });
  const hub = new Hub(mgr, {
    accountExists: (u) => u === 'alice',
    adminPassword: 'pw',
    onGradingStart: () => {},
    listProblems: () => [problem],
    listVariations: () => [variation],
    rng: () => 0.99, // deterministic: picks the variation (idx 1), not base
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
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  const chosen = mgr.getRoom(code)!.activeVariationId;
  assert.equal(chosen, 7); // rng 0.99 + [7] → variation 7

  // alice drops and rejoins mid-game
  hub.drop(alice);
  const rejoined = mk(); hub.register(rejoined);
  hub.handle(rejoined, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));

  const state = rejoined.out.find(m => m.type === 'STATE');
  assert.ok(state && state.type === 'STATE');
  assert.equal(state.room.activeVariationId, 7);
});
