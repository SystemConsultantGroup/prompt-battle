import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import type { PlayerResult } from '../../src/game/types.ts';

const problem = {
  id: 1, title: 't', category: 'c', difficulty: 'easy', timeLimitSec: 60,
  targetHtml: '', targetCss: '', targetJs: '',
} as never;

function mgr() {
  let t = 1000;
  const m = new GameManager({
    now: () => t,
    getProblem: () => problem,
    scheduler: {
      setInterval: () => 1, clearInterval: () => {},
      setTimeout: () => 1, clearTimeout: () => {},
    },
  });
  return m;
}

const ranking: PlayerResult[] = [
  { username: 'alice', total: 0.9, basicScore: 1, detailScore: 0.8, prompt: 'p', items: [] },
];

test('the summary carries the finished board so a reconnect restores it', () => {
  const m = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  assert.equal(m.summary(code).ranking, null);
  m.setResults(code, ranking);
  assert.deepEqual(m.summary(code).ranking, ranking);
});

test('a new round clears the previous board', () => {
  const m = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  m.selectProblem(code, 1);
  m.setResults(code, ranking);
  m.startGame(code, () => {}, () => {});
  assert.equal(m.summary(code).ranking, null);
});

test('restart clears the board so players fall back to the lobby screen', () => {
  const m = mgr();
  const code = m.createRoom({ maxPlayers: 4 });
  m.setResults(code, ranking);
  m.restart(code);
  const s = m.summary(code);
  assert.equal(s.phase, 'LOBBY');
  assert.equal(s.ranking, null);
});
