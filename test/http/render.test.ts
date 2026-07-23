import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDoc, GenStore } from '../../src/http/render.ts';

test('renderDoc inlines code and sets a locked-down CSP', () => {
  const html = renderDoc({ html: '<b>hi</b>', css: 'b{color:red}', js: 'console.log(1)' });
  assert.match(html, /<b>hi<\/b>/);
  assert.match(html, /color:red/);
  assert.match(html, /Content-Security-Policy/i);
  assert.match(html, /default-src 'none'/);
});

test('renderDoc neutralizes closing script tags in js', () => {
  const html = renderDoc({ html: '', css: '', js: 'x = "</script>"' });
  assert.ok(!html.includes('</script><'));
});

test('GenStore stores and retrieves by token', () => {
  const s = new GenStore();
  const t = s.put({ html: 'a', css: '', js: '' });
  assert.equal(s.get(t)?.html, 'a');
  assert.equal(s.get('nope'), undefined);
});
