import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';

function mgr() {
  let t = 1000;
  const m = new GameManager({ now: () => t, getProblem: () => undefined });
  return { m, tick: (ms: number) => { t += ms; } };
}

test('createRoom returns a code and starts in LOBBY', () => {
  const { m } = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  assert.equal(typeof code, 'string');
  assert.equal(m.summary(code).phase, 'LOBBY');
  assert.equal(m.summary(code).code, code);
});

test('joinPlayer enforces existence, capacity, duplicates', () => {
  const { m } = mgr();
  const code = m.createRoom({ maxPlayers: 1 });
  assert.equal(m.joinPlayer(code, 'ghost', false).error, 'unknown account');
  assert.equal(m.joinPlayer(code, 'alice', true).ok, true);
  assert.equal(m.joinPlayer(code, 'alice', true).error, 'name in use');
  assert.equal(m.joinPlayer(code, 'bob', true).error, 'room full');
  assert.equal(m.joinPlayer('ZZZZ', 'x', true).error, 'unknown room');
});

test('removePlayer drops from summary', () => {
  const { m } = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  m.joinPlayer(code, 'alice', true);
  m.removePlayer(code, 'alice');
  assert.equal(m.summary(code).players.length, 0);
});

test('selectProblem refuses to run outside LOBBY', () => {
  const { m } = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  m.selectProblem(code, 1);
  // Flip the phase directly (no real timers involved — startGame() would
  // schedule a genuine setInterval here since this suite's GameManager has
  // no fake scheduler, and that interval would never clear because `now()`
  // is effectively frozen relative to the deadline, hanging the process).
  m.setPhase(code, 'PLAYING');
  const res = m.selectProblem(code, 1);
  assert.equal(res.ok, false);
  assert.equal(res.error, 'not in lobby');
});
