import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, rankResults } from '../../src/grading/score.ts';

const crit = (id: number, kind: 'basic' | 'detail', d: string) =>
  ({ id, problemId: 1, kind, description: d, sortOrder: 0 });

test('computeScore averages per kind and weights total', () => {
  const criteria = [crit(1, 'basic', 'a'), crit(2, 'basic', 'b'), crit(3, 'detail', 'c')];
  const verdicts = [
    { id: 1, passed: true, rate: 1, reason: '' },
    { id: 2, passed: false, rate: 0, reason: '' },
    { id: 3, passed: true, rate: 1, reason: '' },
  ];
  const r = computeScore(criteria, verdicts, 0.3);
  assert.equal(r.basicScore, 0.5);
  assert.equal(r.detailScore, 1);
  assert.ok(Math.abs(r.total - (0.5 * 0.7 + 1 * 0.3)) < 1e-9);
  assert.equal(r.items.length, 3);
});

test('missing verdict counts as zero', () => {
  const criteria = [crit(1, 'basic', 'a'), crit(2, 'detail', 'b')];
  const r = computeScore(criteria, [], 0.3);
  assert.equal(r.basicScore, 0);
  assert.equal(r.detailScore, 0);
  assert.equal(r.total, 0);
});

test('rankResults sorts by total then detail tiebreaker', () => {
  const mk = (u: string, total: number, detail: number) =>
    ({ username: u, total, basicScore: 0, detailScore: detail, items: [] });
  const ranked = rankResults([mk('a', 0.5, 0.1), mk('b', 0.5, 0.9), mk('c', 0.8, 0)]);
  assert.deepEqual(ranked.map(r => r.username), ['c', 'b', 'a']);
});
