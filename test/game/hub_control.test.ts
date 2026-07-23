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
    scheduler: { setInterval: (fn) => (timers.add(fn), fn), clearInterval: (h) => timers.delete(h as any) } });
  const hub = new Hub(mgr, { accountExists: () => true, adminPassword: 'pw',
    onGradingStart: () => {}, listProblems: () => [problem] });
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

test('select + start broadcasts GAME_START', () => {
  const { hub, mk } = setup();
  const host = mk(); hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  hub.handle(host, JSON.stringify({ type: 'SELECT_PROBLEM', mode: 'direct', problemId: 1 }));
  assert.ok(host.out.some(m => m.type === 'PROBLEM_SELECTED' && m.timeLimitSec === 3));
  hub.handle(host, JSON.stringify({ type: 'START' }));
  assert.ok(host.out.some(m => m.type === 'GAME_START' && m.problemId === 1));
});
