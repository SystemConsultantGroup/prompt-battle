import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const mkProblem = (id: number, title: string, category: string) => ({
  id, title, category, difficulty: 'easy', timeLimitSec: 3,
  targetHtml: '<b>secret</b>', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '',
});
const problems = [
  mkProblem(1, 'login card', 'forms'),
  mkProblem(2, 'nav bar', 'navigation'),
];

function setup() {
  const mgr = new GameManager({
    now: () => 0,
    getProblem: (id) => problems.find(p => p.id === id),
    scheduler: {
      setInterval: (fn) => fn, clearInterval: () => {},
      setTimeout: () => null, clearTimeout: () => {},
    },
  });
  const hub = new Hub(mgr, {
    accountExists: () => true, adminPassword: 'pw', onGradingStart: () => {},
    listProblems: () => problems, listVariations: () => [],
  });
  const mk = (): Conn & { out: ServerMsg[] } => {
    const out: ServerMsg[] = [];
    return { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  };
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const player = mk(); hub.register(player);
  hub.handle(player, JSON.stringify({ type: 'JOIN', roomCode: host.roomCode!, username: 'alice' }));
  host.out.length = 0; player.out.length = 0;
  return { hub, host, player, mgr };
}
const selected = (c: { out: ServerMsg[] }) =>
  c.out.find(m => m.type === 'PROBLEM_SELECTED') as
    Extract<ServerMsg, { type: 'PROBLEM_SELECTED' }> | undefined;

test('players get the same problem pick as the host, with its title', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.deepEqual(selected(player), selected(host));
  assert.equal(selected(player)?.title, 'login card');
});

test('a spinning mode ships the reel pool so every screen animates alike', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'roulette' }));
  const msg = selected(player)!;
  assert.equal(msg.mode, 'roulette');
  assert.deepEqual(msg.reelPool, [
    { id: 1, title: 'login card' }, { id: 2, title: 'nav bar' },
  ]);
});

test('a category spin only pools that category', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'category', category: 'forms' }));
  assert.deepEqual(selected(player)?.reelPool, [{ id: 1, title: 'login card' }]);
});

test('a direct pick ships no pool — nothing to reveal, nothing leaked', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.equal(selected(player)?.reelPool, undefined);
});

test('the reel pool carries titles only, never the target code', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'roulette' }));
  for (const card of selected(player)!.reelPool!) {
    assert.deepEqual(Object.keys(card).sort(), ['id', 'title']);
  }
});

test('the summary names the armed problem, and a restart clears it', () => {
  const { hub, host, mgr } = setup();
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 2 }));
  assert.equal(mgr.summary(code).problemTitle, 'nav bar');
  hub.handle(host, JSON.stringify({ type: 'RESTART' }));
  assert.equal(mgr.summary(code).problemTitle, null);
});

test('a player cannot drive the lobby — selection stays host-only', () => {
  const { hub, host, player } = setup();
  hub.handle(player, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.ok(player.out.some(m => m.type === 'ERROR' && m.message === 'not host'));
  assert.equal(selected(host), undefined);
});

test('a player cannot change the round length', () => {
  const { hub, host, player } = setup();
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  player.out.length = 0;
  hub.handle(player, JSON.stringify({ type: 'SET_TIME_LIMIT', seconds: 120 }));
  assert.ok(player.out.some(m => m.type === 'ERROR' && m.message === 'not host'));
  assert.ok(!player.out.some(m => m.type === 'TIME_LIMIT_SET'));
});
