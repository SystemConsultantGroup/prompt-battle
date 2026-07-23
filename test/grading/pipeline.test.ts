import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FakeProvider } from '../../src/llm/fake.ts';
import { gradeRoom } from '../../src/grading/pipeline.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 60, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };
const criteria = [
  { id: 1, problemId: 1, kind: 'basic' as const, description: 'button', sortOrder: 0 },
  { id: 2, problemId: 1, kind: 'detail' as const, description: 'rounded', sortOrder: 1 },
];

test('gradeRoom ranks submissions and reports progress', async () => {
  const progress: number[] = [];
  const results = await gradeRoom({
    provider: new FakeProvider(),
    problem, criteria,
    submissions: [
      { username: 'alice', prompt: 'a button that is rounded' },
      { username: 'bob', prompt: 'just text' },
    ],
    onProgress: (done) => progress.push(done),
  });
  assert.equal(results[0].username, 'alice');
  assert.ok(results[0].total > results[1].total);
  // Progress order under concurrency is not guaranteed in general; assert the
  // robust invariant instead of an exact [1,2] sequence: called once per
  // submission, and the final call reports completion.
  assert.equal(progress.length, 2);
  assert.equal(progress[progress.length - 1], 2);
});
