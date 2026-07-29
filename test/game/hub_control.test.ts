import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 3, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };

function setup() {
  const timers = new Set<() => void>(); let t = 0;
  const mgr = new GameManager({ now: () => t, getProblem: () => problem,
    scheduler: {
      setInterval: (fn) => (timers.add(fn), fn), clearInterval: (h) => timers.delete(h as any),
      setTimeout: (_fn) => null, clearTimeout: (_h) => {},
    } });
  const hub = new Hub(mgr, { accountExists: () => true, adminPassword: 'pw',
    onGradingStart: () => {}, listProblems: () => [problem], listVariations: () => [] });
  const mk = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  return { hub, mk, advance: (ms: number) => { t += ms; timers.forEach(f => f()); } };
}

test('prompt update mirrors to host only', () => {
  const { hub, mk } = setup();
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  const player = mk(); hub.register(player);
  hub.handle(player, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  host.out.length = 0; player.out.length = 0;
  hub.handle(player, JSON.stringify({ type: 'PROMPT_UPDATE', text: 'hi' }));
  assert.ok(host.out.some(m => m.type === 'PROMPT_MIRROR' && m.text === 'hi'));
  assert.ok(!player.out.some(m => m.type === 'PROMPT_MIRROR'));
});

test('prompt update is ignored outside PLAYING (post-deadline / lobby lock)', () => {
  const { hub, mk } = setup();
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  const player = mk(); hub.register(player);
  hub.handle(player, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  host.out.length = 0; player.out.length = 0;
  // room is still LOBBY: no SELECT_PROBLEM/START yet
  hub.handle(player, JSON.stringify({ type: 'PROMPT_UPDATE', text: 'sneaky' }));
  assert.ok(!host.out.some(m => m.type === 'PROMPT_MIRROR'));
});

test('repeated FORCE_END triggers grading only once (no duplicate generation)', () => {
  const timers = new Set<() => void>(); let t = 0;
  const mgr = new GameManager({ now: () => t, getProblem: () => problem,
    scheduler: {
      setInterval: (fn) => (timers.add(fn), fn), clearInterval: (h) => timers.delete(h as any),
      setTimeout: (_fn) => null, clearTimeout: (_h) => {},
    } });
  let gradingCalls = 0;
  const hub = new Hub(mgr, { accountExists: () => true, adminPassword: 'pw',
    onGradingStart: () => { gradingCalls++; }, listProblems: () => [problem], listVariations: () => [] });
  const mk = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));

  hub.handle(host, JSON.stringify({ type: 'FORCE_END' }));
  hub.handle(host, JSON.stringify({ type: 'FORCE_END' }));
  hub.handle(host, JSON.stringify({ type: 'FORCE_END' }));

  assert.equal(gradingCalls, 1);
});

test('select + start broadcasts GAME_START', () => {
  const { hub, mk } = setup();
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.ok(host.out.some(m => m.type === 'PROBLEM_SELECTED' && m.timeLimitSec === 3));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  assert.ok(host.out.some(m => m.type === 'GAME_START' && m.problemId === 1 && m.variationId === null));
});

// --- variation select mode ------------------------------------------------

const variations = [
  { id: 100, problemId: 1, label: 'v1', targetHtml: '', targetCss: '', targetJs: '', sortOrder: 0 },
  { id: 200, problemId: 1, label: 'v2', targetHtml: '', targetCss: '', targetJs: '', sortOrder: 1 },
];

function setupVariation(opts: { rng?: () => number; variations?: typeof variations } = {}) {
  const timers = new Set<() => void>(); let t = 0;
  const mgr = new GameManager({ now: () => t, getProblem: () => problem,
    scheduler: {
      setInterval: (fn) => (timers.add(fn), fn), clearInterval: (h) => timers.delete(h as any),
      setTimeout: (_fn) => null, clearTimeout: (_h) => {},
    } });
  const hub = new Hub(mgr, {
    accountExists: () => true, adminPassword: 'pw', onGradingStart: () => {},
    listProblems: () => [problem],
    listVariations: () => opts.variations ?? variations,
    rng: opts.rng,
  });
  const mk = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  return { mgr, hub, mk };
}

test('SELECT_PROBLEM mode=variation with rng picking base sets activeVariationId to null, and GAME_START carries it', () => {
  const { mgr, hub, mk } = setupVariation({ rng: () => 0 }); // 3 outcomes: idx 0 = base
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;

  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: 1 }));
  assert.ok(host.out.some(m => m.type === 'PROBLEM_SELECTED' && m.problemId === 1));
  assert.equal(mgr.getRoom(code)!.activeVariationId, null);

  hub.handle(host, JSON.stringify({ type: 'START' }));
  const start = host.out.find(m => m.type === 'GAME_START');
  assert.ok(start && start.type === 'GAME_START' && start.variationId === null);
});

test('SELECT_PROBLEM mode=variation with rng picking a specific variation sets activeVariationId, and GAME_START carries it', () => {
  const { mgr, hub, mk } = setupVariation({ rng: () => 0.99 }); // last of 3 outcomes -> id 200
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;

  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: 1 }));
  assert.equal(mgr.getRoom(code)!.activeVariationId, 200);

  hub.handle(host, JSON.stringify({ type: 'START' }));
  const start = host.out.find(m => m.type === 'GAME_START');
  assert.ok(start && start.type === 'GAME_START' && start.variationId === 200);
});

test('SELECT_PROBLEM mode=variation on a problem with NO variations always yields variationId null', () => {
  const { mgr, hub, mk } = setupVariation({ rng: () => 0.99, variations: [] });
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;

  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'variation', problemId: 1 }));
  assert.equal(mgr.getRoom(code)!.activeVariationId, null);

  hub.handle(host, JSON.stringify({ type: 'START' }));
  const start = host.out.find(m => m.type === 'GAME_START');
  assert.ok(start && start.type === 'GAME_START' && start.variationId === null);
});

test('SELECT_PROBLEM mode=variation without problemId is rejected', () => {
  const { hub, mk } = setupVariation();
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));

  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'variation' }));
  assert.ok(host.out.some(m => m.type === 'ERROR'));
});
