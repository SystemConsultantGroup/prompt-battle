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

test('renderDoc neutralizes all HTML5-recognized script/style end-tag forms', () => {
  const doc = renderDoc({ html: '', css: 'body{}</style ><style>x', js: 'a</script >b</script>' });
  // Only the wrapper's own real closers should remain recognizable by the
  // HTML tokenizer (end tag = "</script" or "</style" followed by
  // whitespace, "/", or ">").
  assert.equal(doc.match(/<\/script[\s/>]/gi)?.length, 1);
  assert.equal(doc.match(/<\/style[\s/>]/gi)?.length, 1);
  // The user-injected closers must have been backslash-neutralized.
  assert.ok(doc.includes('<\\/script'));
  assert.ok(doc.includes('<\\/style'));
});

test('GenStore stores and retrieves by token', () => {
  const s = new GenStore();
  const t = s.put({ html: 'a', css: '', js: '' });
  assert.equal(s.get(t)?.html, 'a');
  assert.equal(s.get('nope'), undefined);
});
