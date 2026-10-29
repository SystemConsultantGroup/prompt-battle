import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGradeResult } from '../../src/llm/extract.ts';

test('levels map onto the five-step rate grid', () => {
  const g = parseGradeResult(JSON.stringify({ items: [0, 1, 2, 3, 4].map(level => ({ id: level, level, evidence: 'e' })) }));
  assert.deepEqual(g.items.map(i => i.rate), [0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual(g.items.map(i => i.passed), [false, false, false, true, true]);
});

test('off-scale or fractional levels are snapped and clamped', () => {
  const g = parseGradeResult('{"items":[{"id":1,"level":3.6},{"id":2,"level":9},{"id":3,"level":-2},{"id":4,"level":"x"}]}');
  assert.deepEqual(g.items.map(i => i.rate), [1, 1, 0, 0]);
});

test('a legacy rate is snapped to the same grid', () => {
  const g = parseGradeResult('{"items":[{"id":1,"rate":0.83,"reason":"old"},{"id":2,"passed":true}]}');
  assert.equal(g.items[0].rate, 0.75);
  assert.equal(g.items[0].reason, 'old');
  assert.equal(g.items[1].rate, 1);
});

test('non-array items throws', () => {
  assert.throws(() => parseGradeResult('{"items":"nope"}'), /bad grade shape/);
});
