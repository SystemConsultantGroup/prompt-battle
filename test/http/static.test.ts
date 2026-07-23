import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentType, isSafePath } from '../../src/http/static.ts';

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
