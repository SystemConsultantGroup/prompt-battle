import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FakeProvider } from '../../src/llm/fake.ts';
import { gradeRoom } from '../../src/grading/pipeline.ts';
import { GenStore } from '../../src/http/render.ts';
import type { LLMProvider, SystemConstraints } from '../../src/llm/provider.ts';
import type { GeneratedCode, GradeResult } from '../../src/game/types.ts';
import type { Criterion } from '../../src/db/index.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 60, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };
const criteria = [
  { id: 1, problemId: 1, kind: 'basic' as const, description: 'button', sortOrder: 0 },
  { id: 2, problemId: 1, kind: 'detail' as const, description: 'rounded', sortOrder: 1 },
];

test('gradeRoom ranks submissions and reports progress', async () => {
  const progress: number[] = [];
  const genStore = new GenStore();
  const results = await gradeRoom({
    provider: new FakeProvider(),
    problem, criteria,
    submissions: [
      { username: 'alice', prompt: 'a button that is rounded' },
      { username: 'bob', prompt: 'just text' },
    ],
    onProgress: (done) => progress.push(done),
    storeCode: (code) => genStore.put(code),
  });
  assert.equal(results[0].username, 'alice');
  assert.ok(results[0].total > results[1].total);
  // Progress order under concurrency is not guaranteed in general; assert the
  // robust invariant instead of an exact [1,2] sequence: called once per
  // submission, and the final call reports completion.
  assert.equal(progress.length, 2);
  assert.equal(progress[progress.length - 1], 2);
  // Fix A: graded submissions must carry a genToken pointing at the stored
  // generated UI so the host results screen can render it in an iframe.
  assert.equal(typeof results[0].genToken, 'string');
  assert.ok(genStore.get(results[0].genToken!));
});

test('gradeRoom leaves genToken undefined for a submission whose provider call throws', async () => {
  // A provider that fails to implement one specific submission (simulating an
  // LLM/network error) must not produce any generated code — and therefore
  // must not be stored — for that submission, while other submissions still
  // succeed normally.
  const failingProvider: LLMProvider = {
    async implement(userPrompt: string, _c: SystemConstraints): Promise<GeneratedCode> {
      if (userPrompt.includes('boom')) throw new Error('provider exploded');
      return { html: `<div>${userPrompt}</div>`, css: '', js: '' };
    },
    async grade(_code: GeneratedCode, criteria: Criterion[]): Promise<GradeResult> {
      return { items: criteria.map(c => ({ id: c.id, passed: false, rate: 0, reason: 'n/a' })) };
    },
  };
  const genStore = new GenStore();
  const results = await gradeRoom({
    provider: failingProvider,
    problem, criteria,
    submissions: [
      { username: 'alice', prompt: 'a button that is rounded' },
      { username: 'boomer', prompt: 'boom' },
    ],
    storeCode: (code) => genStore.put(code),
  });
  const boomer = results.find(r => r.username === 'boomer');
  const alice = results.find(r => r.username === 'alice');
  assert.equal(boomer?.genToken, undefined);
  assert.equal(typeof alice?.genToken, 'string');
  assert.ok(genStore.get(alice!.genToken!));
});
