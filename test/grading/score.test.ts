import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, rankResults, FIDELITY_WEIGHT } from '../../src/grading/score.ts';

const crit = (id: number, kind: 'basic' | 'detail', d: string) =>
  ({ id, problemId: 1, kind, description: d, sortOrder: 0 });

test('computeScore averages per kind and weights total', () => {
  const criteria = [crit(1, 'basic', 'a'), crit(2, 'basic', 'b'), crit(3, 'detail', 'c')];
  const verdicts = [
    { id: 1, passed: true, rate: 1, reason: '' },
    { id: 2, passed: false, rate: 0, reason: '' },
    { id: 3, passed: true, rate: 1, reason: '' },
  ];
  const r = computeScore(criteria, verdicts, 0.3, 0.5);
  assert.equal(r.basicScore, 0.5);
  assert.equal(r.detailScore, 1);
  assert.equal(r.fidelityScore, 0.5);
  const rubric = 0.5 * 0.7 + 1 * 0.3;
  assert.ok(Math.abs(r.total - (rubric * (1 - FIDELITY_WEIGHT) + 0.5 * FIDELITY_WEIGHT)) < 1e-9);
  assert.equal(r.items.length, 3);
});

test('missing verdict counts as zero', () => {
  const criteria = [crit(1, 'basic', 'a'), crit(2, 'detail', 'b')];
  const r = computeScore(criteria, [], 0.3);
  assert.equal(r.basicScore, 0);
  assert.equal(r.detailScore, 0);
  assert.equal(r.total, 0);
});

const mk = (u: string, total: number, detail: number, fidelity = 0, basic = 0) =>
  ({ username: u, total, basicScore: basic, detailScore: detail, fidelityScore: fidelity,
     rank: 0, prompt: '', items: [] });

test('rankResults sorts by total then detail tiebreaker', () => {
  const ranked = rankResults([mk('a', 0.5, 0.1), mk('b', 0.5, 0.9), mk('c', 0.8, 0)]);
  assert.deepEqual(ranked.map(r => r.username), ['c', 'b', 'a']);
  assert.deepEqual(ranked.map(r => r.rank), [1, 2, 3]);
});

test('rankResults breaks a total+detail tie on fidelity, then basic', () => {
  const ranked = rankResults([
    mk('lowfid', 0.7, 0.5, 0.2, 0.9), mk('hifid', 0.7, 0.5, 0.8, 0.1),
    mk('basic-lo', 0.6, 0.5, 0.5, 0.2), mk('basic-hi', 0.6, 0.5, 0.5, 0.4),
  ]);
  assert.deepEqual(ranked.map(r => r.username), ['hifid', 'lowfid', 'basic-hi', 'basic-lo']);
});

test('players equal on every key share a rank (competition ranking)', () => {
  // 0.1 + 0.2 !== 0.3 in floating point; that noise must not split a tie.
  const ranked = rankResults([mk('a', 0.9, 0.5), mk('b', 0.1 + 0.2, 0.5), mk('c', 0.3, 0.5), mk('d', 0.2, 0)]);
  assert.deepEqual(ranked.map(r => r.rank), [1, 2, 2, 4]);
});

test('rubric levels make close submissions distinguishable', () => {
  // Old lenient grading: both "roughly right" → 100%. Under the rubric one
  // off-by-a-shade color (level 3) costs points and the two are ordered.
  const criteria = [crit(1, 'basic', 'a'), crit(2, 'detail', 'b')];
  const perfect = computeScore(criteria, [
    { id: 1, passed: true, rate: 1, reason: '' }, { id: 2, passed: true, rate: 1, reason: '' }], 0.3, 0.9);
  const close = computeScore(criteria, [
    { id: 1, passed: true, rate: 1, reason: '' }, { id: 2, passed: true, rate: 0.75, reason: '' }], 0.3, 0.9);
  assert.ok(perfect.total > close.total);
});
