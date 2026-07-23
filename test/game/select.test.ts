import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSelection } from '../../src/game/select.ts';

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
