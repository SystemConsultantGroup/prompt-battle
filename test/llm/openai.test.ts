import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIProvider } from '../../src/llm/openai.ts';

function responseBody(payloadText: string) {
  return {
    status: 'completed',
    output: [
      { type: 'reasoning', summary: [] },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: payloadText }] },
    ],
  };
}

function stubResponse(body: unknown, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}

function stubFetch(payloadText: string, status = 200) {
  return stubResponse(responseBody(payloadText), status);
}

const code = { html: '', css: '', js: '' };
const criteria = [{ id: 1, problemId: 1, kind: 'basic' as const, description: 'x', sortOrder: 0 }];

test('implement parses Responses JSON after a reasoning item', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano',
    fetchImpl: stubFetch('{"html":"<b>","css":"x","js":""}') });
  assert.deepEqual(await p.implement('make bold', { systemPrompt: 's' }),
    { html: '<b>', css: 'x', js: '' });
});

test('grade parses verdict JSON', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano',
    fetchImpl: stubFetch('{"items":[{"id":1,"passed":true,"rate":1,"reason":"ok"}]}') });
  const g = await p.grade(code, criteria);
  assert.equal(g.items[0].id, 1);
  assert.equal(g.items[0].passed, true);
});

test('grade throws on a malformed verdict (items not an array)', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano',
    fetchImpl: stubFetch('{"result":"good"}') });
  await assert.rejects(() => p.grade(code, criteria), /bad grade shape/);
});

test('a non-2xx response throws (surfacing auth/other errors)', async () => {
  const p = new OpenAIProvider({ apiKey: 'bad', model: 'gpt-5-nano',
    fetchImpl: stubFetch('{}', 401) });
  await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), /openai 401/);
});

test('400 includes the API message, type, code and offending parameter', async () => {
  const p = new OpenAIProvider({ apiKey: 'secret-key', model: 'gpt-5-nano',
    fetchImpl: stubResponse({ error: {
      message: 'Unsupported parameter: temperature', type: 'invalid_request_error',
      code: 'unsupported_parameter', param: 'temperature',
    } }, 400) });
  await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), {
    message: 'openai 400: message: Unsupported parameter: temperature; type: invalid_request_error; code: unsupported_parameter; param: temperature',
  });
});

for (const [name, body, expected] of [
  ['plain text', 'Bad gateway', 'openai 502: Bad gateway'],
  ['empty body', '', 'openai 502'],
  ['redacted key', 'Invalid key secret-key', 'openai 502: Invalid key [REDACTED]'],
  ['bounded body', 'x'.repeat(3000), `openai 502: ${'x'.repeat(2000)}`],
] as const) {
  test(`handles ${name} in an error response`, async () => {
    const p = new OpenAIProvider({ apiKey: 'secret-key', model: 'gpt-5-nano',
      fetchImpl: async () => new Response(body, { status: 502 }) });
    await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), { message: expected });
  });
}

test('preserves HTTP status when the error body cannot be read', async () => {
  const p = new OpenAIProvider({ apiKey: 'secret-key', model: 'gpt-5-nano',
    fetchImpl: async () => {
      return new Response(new ReadableStream({
        start(controller) { controller.error(new Error('read failed')); },
      }), { status: 400 });
    } });
  await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), { message: 'openai 400' });
});

for (const model of ['gpt-5-nano', 'gpt-4o-mini']) {
  test(`sends a stateless Responses JSON request for ${model}`, async () => {
    let capturedUrl: unknown;
    let capturedInit: RequestInit | undefined;
    const spy: typeof fetch = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return stubFetch(JSON.stringify(code))('https://unused.test');
    };
    const p = new OpenAIProvider({ apiKey: 'secret-key', model, fetchImpl: spy });
    await p.implement('build request', { systemPrompt: 'Return JSON' });
    assert.equal(capturedUrl, 'https://api.openai.com/v1/responses');
    assert.equal(capturedInit?.method, 'POST');
    assert.equal(new Headers(capturedInit?.headers).get('authorization'), 'Bearer secret-key');
    const body = JSON.parse(String(capturedInit?.body));
    assert.deepEqual(body, {
      model, max_output_tokens: 16384, store: false,
      instructions: 'Return JSON', input: [{ role: 'user', content: 'build request' }],
      text: { format: { type: 'json_object' } },
    });
  });
}

test('grade accepts a rubric level without unsupported sampling parameters', async () => {
  let body: any;
  const fetchImpl: typeof fetch = async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return stubFetch('{"items":[{"id":1,"evidence":"gen 4px vs ref 8px","level":2}]}')('https://unused.test');
  };
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano', fetchImpl });
  const g = await p.grade(code, criteria, { html: '<b>ref</b>', css: '', js: '' });
  assert.equal(g.items[0].rate, 0.5);
  assert.equal(g.items[0].passed, false);
  assert.equal(g.items[0].reason, 'gen 4px vs ref 8px');
  assert.equal(body.temperature, undefined);
  assert.equal(body.seed, undefined);
  assert.match(body.input[0].content, /<b>ref<\/b>/);
  assert.match(body.instructions, /grading judge/);
});

test('concatenates output_text parts and ignores non-message items', async () => {
  const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano', fetchImpl: stubResponse({
    status: 'completed', output: [
      { type: 'reasoning', content: [{ type: 'output_text', text: 'not the answer' }] },
      { type: 'message', role: 'assistant', content: [
        { type: 'output_text', text: '{"html":"ok",' },
        { type: 'output_text', text: '"css":"","js":""}' },
      ] },
    ],
  }) });
  assert.equal((await p.implement('x', { systemPrompt: 's' })).html, 'ok');
});

for (const reason of ['max_output_tokens', 'content_filter']) {
  test(`rejects incomplete output (${reason}) even when JSON looks valid`, async () => {
    const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano', fetchImpl: stubResponse({
      ...responseBody(JSON.stringify(code)), status: 'incomplete', incomplete_details: { reason },
    }) });
    await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), new RegExp(reason));
  });
}

for (const [name, body, expected] of [
  ['refusal', { status: 'completed', output: [{ type: 'message', role: 'assistant',
    content: [{ type: 'refusal', refusal: 'Cannot comply' }] }] }, /refused/],
  ['empty output', { status: 'completed', output: [] }, /missing output text/],
  ['missing output', { status: 'completed' }, /missing output text/],
  ['failed response', { status: 'failed', error: { code: 'server_error' } }, /failed: server_error/],
  ['invalid response', {}, /response invalid/],
] as const) {
  test(`rejects ${name}`, async () => {
    const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-5-nano', fetchImpl: stubResponse(body) });
    await assert.rejects(() => p.implement('x', { systemPrompt: 's' }), expected);
  });
}
