import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeRouter } from '../../src/server.ts';
import { openDb, setTheme, createProblem } from '../../src/db/index.ts';
import { readFileSync } from 'node:fs';
import { THEMES } from '../../src/config/themes.ts';
import { GenStore } from '../../src/http/render.ts';

test('public theme stylesheet snapshots the current selection without authentication or caching', async () => {
  const db = openDb(':memory:');
  const store = new GenStore();
  const problemId = createProblem(db, {
    title: 'Unaffected target', category: 'test', difficulty: 'easy', timeLimitSec: 30,
    targetHtml: '<b>target</b>', targetCss: 'b{color:red}', targetJs: '', detailWeight: 0.3,
  });
  const genToken = store.put({ html: '<b>generated</b>', css: 'b{color:blue}', js: '' });
  const router = makeRouter(db, store);
  const { server, close } = startServer({ port: 0, onRequest: router });
  try {
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const first = await fetch(`${base}/theme.css`);
    const oldDocumentCss = await first.text();
    assert.equal(first.status, 200);
    assert.match(first.headers.get('content-type')!, /text\/css/);
    assert.equal(first.headers.get('cache-control'), 'no-store');
    assert.equal(first.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(oldDocumentCss, '@import url("/themes/cartoon.css");\n');

    const targetBefore = await (await fetch(`${base}/render/target/${problemId}`)).text();
    const genBefore = await (await fetch(`${base}/render/gen/${genToken}`)).text();
    setTheme(db, 'halloween');
    assert.equal(await (await fetch(`${base}/render/target/${problemId}`)).text(), targetBefore);
    assert.equal(await (await fetch(`${base}/render/gen/${genToken}`)).text(), genBefore);
    assert.doesNotMatch(targetBefore + genBefore, /theme\.css|themes\//);
    assert.equal(await (await fetch(`${base}/theme.css?fresh=1`)).text(), '@import url("/themes/halloween.css");\n');
    assert.match(oldDocumentCss, /cartoon/); // A previously delivered stylesheet is not rewritten.
    for (const path of ['/', '/client', '/client/', '/client/index.html', '/host/', '/admin/']) {
      const html = await (await fetch(`${base}${path}`)).text();
      assert.match(html, /href="\/theme\.css"/);
      assert.ok(html.indexOf('/styles.css') < html.indexOf('/theme.css'));
      assert.ok(html.indexOf('/theme.css') < html.indexOf('<script'));
    }
    for (const theme of THEMES) {
      const asset = await fetch(`${base}/themes/${theme.id}.css`);
      assert.equal(asset.status, 200);
      assert.match(asset.headers.get('content-type')!, /text\/css/);
      assert.ok((await asset.text()).length > 0);
    }
    const head = await fetch(`${base}/theme.css`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const post = await fetch(`${base}/theme.css`, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET, HEAD');
  } finally { await close(); db.close(); }
});

test('entry points keep the original stylesheet as the fallback before the selected skin', () => {
  for (const page of ['client', 'host', 'admin']) {
    const html = readFileSync(new URL(`../../public/${page}/index.html`, import.meta.url), 'utf8');
    assert.match(html, /href="\/styles\.css"/);
    assert.ok(html.indexOf('/styles.css') < html.indexOf('/theme.css'));
  }
});
