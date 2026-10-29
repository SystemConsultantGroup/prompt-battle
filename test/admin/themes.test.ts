import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../../src/admin/routes.ts';
import { openDb, getTheme, setTheme } from '../../src/db/index.ts';
import { THEMES } from '../../src/config/themes.ts';

function request(method: string, body?: string, password: string | undefined = 'pw') {
  const req: any = {
    method, url: '/api/settings/theme', headers: { 'x-admin-password': password },
    [Symbol.asyncIterator]: async function* () { if (body !== undefined) yield Buffer.from(body); },
  };
  const res: any = {
    code: 0, body: '', headers: {},
    setHeader(k: string, v: string) { this.headers[k] = v; },
    writeHead(code: number, headers: object) { this.code = code; Object.assign(this.headers, headers); return this; },
    end(body = '') { this.body = body; },
  };
  return { req, res };
}

test('theme API lists the selected theme and registered options, and saves a valid selection', async () => {
  const db = openDb(':memory:');
  try {
    let r = request('GET');
    assert.equal(await handleApi(db, 'pw', r.req, r.res), true);
    assert.equal(r.res.code, 200);
    assert.equal(r.res.headers['cache-control'], 'no-store');
    assert.deepEqual(JSON.parse(r.res.body), { theme: 'cartoon', themes: THEMES });
    r = request('PUT', JSON.stringify({ theme: 'halloween' }));
    await handleApi(db, 'pw', r.req, r.res);
    assert.equal(r.res.code, 200);
    assert.deepEqual(JSON.parse(r.res.body), { theme: 'halloween' });
    assert.equal(getTheme(db), 'halloween');
  } finally { db.close(); }
});

test('theme API authenticates before parsing or mutating a setting', async () => {
  const db = openDb(':memory:');
  try {
    for (const password of ['wrong', '']) {
      for (const method of ['GET', 'PUT']) {
        const r = request(method, '{invalid json', password);
        await handleApi(db, 'pw', r.req, r.res);
        assert.equal(r.res.code, 401);
        assert.equal(getTheme(db), 'cartoon');
      }
    }
    const r = request('PUT', '{"theme":"halloween"}');
    delete r.req.headers['x-admin-password'];
    await handleApi(db, 'pw', r.req, r.res);
    assert.equal(r.res.code, 401);
    assert.equal(getTheme(db), 'cartoon');
  } finally { db.close(); }
});

test('invalid theme bodies return 400 and preserve the current setting', async () => {
  const db = openDb(':memory:');
  try {
    setTheme(db, 'halloween');
    const invalid = [undefined, '', '{broken', 'null', '[]', '"cartoon"', '{}',
      '{"theme":null}', '{"theme":1}', '{"theme":"../../evil"}', '{"theme":"unknown"}'];
    for (const body of invalid) {
      const r = request('PUT', body);
      await handleApi(db, 'pw', r.req, r.res);
      assert.equal(r.res.code, 400, `body: ${body}`);
      assert.equal(getTheme(db), 'halloween');
    }
  } finally { db.close(); }
});
