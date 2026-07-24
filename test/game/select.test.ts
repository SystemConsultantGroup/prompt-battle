import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSelection, pickVariation } from '../../src/game/select.ts';

const P = (id: number, category: string) => ({ id, title: `p${id}`, category,
  difficulty: 'easy', timeLimitSec: 60, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' });
const problems = [P(1, 'form'), P(2, 'form'), P(3, 'nav')];

test('direct selects by id', () => {
  const r = resolveSelection(problems, 'direct', { problemId: 2 });
  assert.ok('problem' in r && r.problem.id === 2);
});

test('roulette picks from full pool using rng', () => {
  const r = resolveSelection(problems, 'roulette', { rng: () => 0.99 });
  assert.ok('problem' in r && r.problem.id === 3);
  assert.ok('pool' in r && r.pool.length === 3);
});

test('category filters pool then picks', () => {
  const r = resolveSelection(problems, 'category', { category: 'form', rng: () => 0 });
  assert.ok('problem' in r && r.problem.category === 'form');
  assert.ok('pool' in r && r.pool.length === 2);
});

test('errors on empty category', () => {
  const r = resolveSelection(problems, 'category', { category: 'nope' });
  assert.ok('error' in r);
});

test('pickVariation: rng=0 picks the base render (null)', () => {
  assert.equal(pickVariation([10, 20, 30], () => 0), null);
});

test('pickVariation: rng near 1 picks the last variation id', () => {
  assert.equal(pickVariation([10, 20, 30], () => 0.9999), 30);
});

test('pickVariation: empty variation list always yields the base render (null)', () => {
  assert.equal(pickVariation([], () => 0), null);
  assert.equal(pickVariation([], () => 0.9999), null);
  assert.equal(pickVariation([], () => 0.5), null);
});

test('pickVariation: uniformly covers all n+1 outcomes across the rng range', () => {
  const ids = [10, 20, 30];
  // 4 outcomes total (base + 3 variations); rng in [0,1) maps to buckets of 0.25.
  assert.equal(pickVariation(ids, () => 0.0), null);
  assert.equal(pickVariation(ids, () => 0.26), 10);
  assert.equal(pickVariation(ids, () => 0.51), 20);
  assert.equal(pickVariation(ids, () => 0.76), 30);
});
