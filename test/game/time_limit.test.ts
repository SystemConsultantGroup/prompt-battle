import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import { TIME_LIMIT_OPTIONS, type ServerMsg } from '../../src/game/types.ts';

// The problem's own default is 3s; every assertion below that expects
// something else is exercising the host's override.
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
  const hostIn = () => {
    const host = mk(); hub.register(host);
    hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
    return host;
  };
  return { mgr, hub, mk, hostIn, now: () => t };
}

test('selecting a problem seeds the round length from that problem', () => {
  const { mgr, hub, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.equal(mgr.getRoom(code)!.timeLimitSec, 3);
  assert.equal(mgr.summary(code).timeLimitSec, 3);
});

test('SET_TIME_LIMIT overrides the problem default and drives the real deadline', () => {
  const { mgr, hub, hostIn, now } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 120 }));

  assert.ok(host.out.some(m => m.type === 'TIME_LIMIT_SET' && m.timeLimitSec === 120));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  // 120s override wins over the problem's 3s.
  assert.equal(mgr.getRoom(code)!.deadline, now() + 120_000);
});

test('every offered option is accepted', () => {
  for (const seconds of TIME_LIMIT_OPTIONS) {
    const { mgr, hub, hostIn } = setup();
    const host = hostIn();
    const code = host.roomCode!;
    hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
    hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds }));
    assert.equal(mgr.getRoom(code)!.timeLimitSec, seconds);
  }
});

test('a value outside the offered set is rejected and leaves the round length alone', () => {
  const { mgr, hub, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  host.out.length = 0;

  for (const bad of [0, -60, 45, 3600, 1e9, '60', null, NaN]) {
    hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: bad }));
  }
  assert.equal(mgr.getRoom(code)!.timeLimitSec, 3);
  assert.ok(host.out.every(m => m.type !== 'TIME_LIMIT_SET'));
  assert.ok(host.out.some(m => m.type === 'ERROR' && m.message === 'bad time limit'));
});

test('SET_TIME_LIMIT is refused once the round is running', () => {
  const { mgr, hub, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  const deadline = mgr.getRoom(code)!.deadline;
  host.out.length = 0;

  hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 150 }));
  // Changing it mid-round would desync every client's countdown.
  assert.equal(mgr.getRoom(code)!.deadline, deadline);
  assert.ok(host.out.some(m => m.type === 'ERROR' && m.message === 'not in lobby'));
});

test('a player cannot set the round length', () => {
  const { mgr, hub, mk, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  const player = mk(); hub.register(player);
  hub.handle(player, JSON.stringify({ type: 'JOIN', roomCode: code, username: 'alice' }));
  player.out.length = 0;

  hub.handle(player, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 150 }));
  assert.equal(mgr.getRoom(code)!.timeLimitSec, 3);
  assert.ok(player.out.some(m => m.type === 'ERROR' && m.message === 'not host'));
});

test('re-picking a problem resets an earlier override to that problem default', () => {
  const { mgr, hub, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 150 }));
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.equal(mgr.getRoom(code)!.timeLimitSec, 3);
});

test('RESTART clears the override so the next round starts from the problem default', () => {
  const { mgr, hub, hostIn } = setup();
  const host = hostIn();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  hub.handle(host, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 150 }));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  hub.handle(host, JSON.stringify({ type: 'RESTART' }));
  assert.equal(mgr.getRoom(code)!.timeLimitSec, null);
});
