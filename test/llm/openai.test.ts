import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIProvider } from '../../src/llm/openai.ts';

// OpenAI chat/completions response shape: choices[].message.content
function stubFetch(payloadText: string, status = 200) {
  return async () => new Response(JSON.stringify({
    choices: [{ message: { role: 'assistant', content: payloadText } }],
  }), { status, headers: { 'content-type': 'application/json' } });
}

test('implement parses generated code JSON', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-4o',
    fetchImpl: stubFetch('{"html":"<b>","css":"x","js":""}') as any });
  const code = await p.implement('make bold', { systemPrompt: 's' });
  assert.equal(code.html, '<b>');
  assert.equal(code.css, 'x');
});

test('grade parses verdict JSON', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-4o',
    fetchImpl: stubFetch('{"items":[{"id":1,"passed":true,"rate":1,"reason":"ok"}]}') as any });
  const g = await p.grade({ html: '', css: '', js: '' },
    [{ id: 1, problemId: 1, kind: 'basic', description: 'x', sortOrder: 0 }]);
  assert.equal(g.items[0].id, 1);
  assert.equal(g.items[0].passed, true);
});

test('a non-2xx response throws (surfacing auth/other errors)', async () => {
  const p = new OpenAIProvider({ apiKey: 'bad', model: 'gpt-4o',
    fetchImpl: stubFetch('{}', 401) as any });
  await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), /openai 401/);
});

test('sends a Bearer auth header and the configured model', async () => {
  let captured: any = null;
  const spy = (async (_url: string, init: any) => {
    captured = { url: _url, init };
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"html":"","css":"","js":""}' } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } });
  }) as any;
  const p = new OpenAIProvider({ apiKey: 'secret-key', model: 'gpt-4o-mini', fetchImpl: spy });
  await p.implement('x', { systemPrompt: 's' });
  assert.match(captured.url, /openai\.com\/v1\/chat\/completions/);
  assert.equal(captured.init.headers['authorization'], 'Bearer secret-key');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.equal(body.response_format.type, 'json_object');
});
