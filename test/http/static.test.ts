import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { contentType, isSafePath, resolveFile } from '../../src/http/static.ts';

const PUBLIC_ROOT = fileURLToPath(new URL('../../public', import.meta.url));

test('contentType maps by extension', () => {
  assert.equal(contentType('a.html'), 'text/html; charset=utf-8');
  assert.equal(contentType('a.js'), 'text/javascript; charset=utf-8');
  assert.equal(contentType('a.css'), 'text/css; charset=utf-8');
  assert.equal(contentType('a.bin'), 'application/octet-stream');
});

test('isSafePath rejects traversal', () => {
  assert.equal(isSafePath('/client/app.js'), true);
  assert.equal(isSafePath('/../secret'), false);
  assert.equal(isSafePath('/..%2fsecret'), false);
});

const norm = (p: string | null) => (p == null ? null : p.replace(/\\/g, '/'));

test('resolveFile maps "/" to the client index', () => {
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/'))!, /public\/client\/index\.html$/);
});

test('resolveFile resolves a trailing-slash directory to its index.html', () => {
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/host/'))!, /public\/host\/index\.html$/);
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/client/'))!, /public\/client\/index\.html$/);
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/admin/'))!, /public\/admin\/index\.html$/);
});

test('resolveFile resolves a directory without trailing slash to its index.html', () => {
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/host'))!, /public\/host\/index\.html$/);
});

test('resolveFile returns a real file path unchanged', () => {
  assert.match(norm(resolveFile(PUBLIC_ROOT, '/styles.css'))!, /public\/styles\.css$/);
});

test('resolveFile returns null for a missing path', () => {
  assert.equal(resolveFile(PUBLIC_ROOT, '/does/not/exist'), null);
});

test('resolveFile rejects traversal', () => {
  assert.equal(resolveFile(PUBLIC_ROOT, '/../secret'), null);
});
