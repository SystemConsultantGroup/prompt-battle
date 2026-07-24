import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../../src/db/index.ts';
import { handleApi } from '../../src/admin/routes.ts';

function mockReqRes(method: string, url: string, body?: any, pw = 'pw') {
  const chunks: any[] = body ? [Buffer.from(JSON.stringify(body))] : [];
  const req: any = {
    method, url, headers: { 'x-admin-password': pw },
    [Symbol.asyncIterator]: async function* () { for (const c of chunks) yield c; },
  };
  const res: any = { code: 0, body: '', headers: {},
    writeHead(c: number, h: any) { this.code = c; Object.assign(this.headers, h); return this; },
    end(b?: string) { this.body = b ?? ''; } };
  return { req, res };
}

test('rejects wrong admin password', async () => {
  const db = openDb(':memory:');
  const { req, res } = mockReqRes('GET', '/api/accounts', undefined, 'wrong');
  const handled = await handleApi(db, 'pw', req, res);
  assert.equal(handled, true);
  assert.equal(res.code, 401);
});

test('create and list accounts', async () => {
  const db = openDb(':memory:');
  let r = mockReqRes('POST', '/api/accounts', { username: 'alice' });
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 200);
  r = mockReqRes('GET', '/api/accounts');
  await handleApi(db, 'pw', r.req, r.res);
  assert.match(r.res.body, /alice/);
});

test('rejects empty/missing username on account creation', async () => {
  const db = openDb(':memory:');
  let r = mockReqRes('POST', '/api/accounts', { username: '' });
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 400);
  r = mockReqRes('POST', '/api/accounts', {});
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 400);
  r = mockReqRes('GET', '/api/accounts');
  await handleApi(db, 'pw', r.req, r.res);
  assert.doesNotMatch(r.res.body, /undefined/);
});

test('create problem with criteria and read back', async () => {
  const db = openDb(':memory:');
  let r = mockReqRes('POST', '/api/problems', {
    problem: { title: 'T', category: 'ui', difficulty: 'easy', timeLimitSec: 60,
      targetHtml: '<b>', targetCss: '', targetJs: '', detailWeight: 0.3 },
    criteria: [{ kind: 'basic', description: 'bold', sortOrder: 0 }],
  });
  await handleApi(db, 'pw', r.req, r.res);
  const { id } = JSON.parse(r.res.body);
  r = mockReqRes('GET', `/api/problems/${id}`);
  await handleApi(db, 'pw', r.req, r.res);
  const p = JSON.parse(r.res.body);
  assert.equal(p.title, 'T');
  assert.equal(p.criteria.length, 1);
});

test('PUT /api/problems/:id updates problem fields and replaces criteria', async () => {
  const db = openDb(':memory:');
  let r = mockReqRes('POST', '/api/problems', {
    problem: { title: 'T', category: 'ui', difficulty: 'easy', timeLimitSec: 60,
      targetHtml: '<b>', targetCss: '', targetJs: '', detailWeight: 0.3 },
    criteria: [
      { kind: 'basic', description: 'bold', sortOrder: 0 },
      { kind: 'detail', description: 'shiny', sortOrder: 1 },
    ],
  });
  await handleApi(db, 'pw', r.req, r.res);
  const { id } = JSON.parse(r.res.body);

  r = mockReqRes('PUT', `/api/problems/${id}`, {
    problem: { title: 'Updated', category: 'ui', difficulty: 'hard', timeLimitSec: 120,
      targetHtml: '<i>', targetCss: 'x{}', targetJs: '', detailWeight: 0.5 },
    criteria: [{ kind: 'basic', description: 'italic', sortOrder: 0 }],
  });
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 200);

  r = mockReqRes('GET', `/api/problems/${id}`);
  await handleApi(db, 'pw', r.req, r.res);
  const p = JSON.parse(r.res.body);
  assert.equal(p.title, 'Updated');
  assert.equal(p.criteria.length, 1);
  assert.equal(p.criteria[0].description, 'italic');
});

test('PUT /api/problems/:id rejects wrong/missing admin password before mutating', async () => {
  const db = openDb(':memory:');
  let r = mockReqRes('POST', '/api/problems', {
    problem: { title: 'T', category: 'ui', difficulty: 'easy', timeLimitSec: 60,
      targetHtml: '', targetCss: '', targetJs: '', detailWeight: 0.3 },
    criteria: [],
  });
  await handleApi(db, 'pw', r.req, r.res);
  const { id } = JSON.parse(r.res.body);

  r = mockReqRes('PUT', `/api/problems/${id}`, {
    problem: { title: 'Hacked', category: 'ui', difficulty: 'easy', timeLimitSec: 60,
      targetHtml: '', targetCss: '', targetJs: '', detailWeight: 0.3 },
    criteria: [],
  }, 'wrong');
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 401);

  r = mockReqRes('GET', `/api/problems/${id}`);
  await handleApi(db, 'pw', r.req, r.res);
  const p = JSON.parse(r.res.body);
  assert.equal(p.title, 'T');
});

test('PUT /api/problems/:id on non-existent id returns 404', async () => {
  const db = openDb(':memory:');
  const r = mockReqRes('PUT', '/api/problems/999', {
    problem: { title: 'X', category: 'ui', difficulty: 'easy', timeLimitSec: 60,
      targetHtml: '', targetCss: '', targetJs: '', detailWeight: 0.3 },
    criteria: [],
  });
  await handleApi(db, 'pw', r.req, r.res);
  assert.equal(r.res.code, 404);
});
