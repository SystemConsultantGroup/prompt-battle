import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';

function fakeClock() {
  let t = 0; const timers = new Set<() => void>();
  return {
    now: () => t,
    scheduler: {
      setInterval: (fn: () => void) => { timers.add(fn); return fn as any; },
      clearInterval: (h: any) => { timers.delete(h); },
    },
    advance: (ms: number) => { t += ms; for (const fn of timers) fn(); },
  };
}
const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 3, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };

test('select → start → auto-end at deadline', () => {
  const c = fakeClock();
  const m = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = m.createRoom({ maxPlayers: 4 });
  assert.equal(m.selectProblem(code, 1).timeLimitSec, 3);
  const ticks: number[] = []; let ended = false;
  const r = m.startGame(code, (s) => ticks.push(s), () => { ended = true; });
  assert.equal(r.ok, true);
  assert.equal(m.summary(code).phase, 'PLAYING');
  c.advance(1000); c.advance(1000); c.advance(1000);
  assert.equal(ended, true);
  assert.equal(m.summary(code).phase, 'GRADING');
  assert.deepEqual(ticks, [2, 1, 0]);
});

test('forceEnd moves PLAYING to GRADING early', () => {
  const c = fakeClock();
  const m = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = m.createRoom({ maxPlayers: 4 });
  m.selectProblem(code, 1);
  m.startGame(code, () => {}, () => {});
  m.forceEnd(code);
  assert.equal(m.summary(code).phase, 'GRADING');
});

test('restart returns to LOBBY and clears prompts', () => {
  const c = fakeClock();
  const m = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = m.createRoom({ maxPlayers: 4 });
  m.joinPlayer(code, 'alice', true);
  m.setPrompt(code, 'alice', 'hello');
  m.selectProblem(code, 1);
  m.startGame(code, () => {}, () => {});
  m.forceEnd(code);
  m.restart(code);
  assert.equal(m.summary(code).phase, 'LOBBY');
  assert.equal(m.getRoom(code)!.players.get('alice')!.prompt, '');
});

test('removeRoom clears the running timer and deletes the room', () => {
  const c = fakeClock();
  const m = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  const code = m.createRoom({ maxPlayers: 4 });
  m.selectProblem(code, 1);
  m.startGame(code, () => {}, () => {});
  assert.equal(m.getRoom(code)!.timer !== null, true);

  m.removeRoom(code);

  assert.equal(m.getRoom(code), undefined);
  // Advancing the clock must not invoke any lingering timer callback.
  assert.doesNotThrow(() => c.advance(1000));
});

test('removeRoom on an unknown room is a no-op', () => {
  const c = fakeClock();
  const m = new GameManager({ now: c.now, getProblem: () => problem, scheduler: c.scheduler });
  assert.doesNotThrow(() => m.removeRoom('NOPE'));
});
