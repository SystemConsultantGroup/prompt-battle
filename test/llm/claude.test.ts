import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClaudeProvider } from '../../src/llm/claude.ts';

function stubFetch(payloadText: string) {
  return async () => new Response(JSON.stringify({
    content: [{ type: 'text', text: payloadText }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('implement parses generated code JSON', async () => {
  const p = new ClaudeProvider({ apiKey: 'k', model: 'm',
    fetchImpl: stubFetch('{"html":"<b>","css":"x","js":""}') as any });
  const code = await p.implement('make bold', { systemPrompt: 's' });
  assert.equal(code.html, '<b>');
  assert.equal(code.css, 'x');
});

test('grade parses verdict JSON even with surrounding prose', async () => {
  const p = new ClaudeProvider({ apiKey: 'k', model: 'm',
    fetchImpl: stubFetch('Here you go:\n{"items":[{"id":1,"passed":true,"rate":1,"reason":"ok"}]}') as any });
  const g = await p.grade({ html: '', css: '', js: '' },
    [{ id: 1, problemId: 1, kind: 'basic', description: 'x', sortOrder: 0 }]);
  assert.equal(g.items[0].id, 1);
  assert.equal(g.items[0].passed, true);
});

test('bad JSON throws', async () => {
  const p = new ClaudeProvider({ apiKey: 'k', model: 'm',
    fetchImpl: stubFetch('no json here') as any });
  await assert.rejects(() => p.implement('x', { systemPrompt: 's' }));
});
