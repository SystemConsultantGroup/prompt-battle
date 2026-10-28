import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('CONTRACT: original cartoon stylesheet remains byte-for-byte unchanged', () => {
  // Baseline: bb4b943d755a0e529d585cc7ca0cd98c40907777 public/styles.css.
  // Do not update this hash to make a change pass: add new theme styles instead.
  const original = readFileSync(new URL('../../public/styles.css', import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'),
    'cb54d5541c3e417baa950825b705c014db83ea079c7cd0057530b4793a547fd9');
});

test('CONTRACT: selecting cartoon adds no CSS rules or overrides', () => {
  const skin = readFileSync(new URL('../../public/themes/cartoon.css', import.meta.url), 'utf8');
  assert.equal(skin.replace(/\/\*[\s\S]*?\*\//g, '').trim(), '');
});

test('new admin panel styles are scoped and cannot restyle original components', () => {
  const css = readFileSync(new URL('../../public/admin/theme-settings.css', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of css.matchAll(/([^{}]+)\{/g)) {
    for (const selector of rule[1].split(',')) {
      assert.match(selector.trim(), /^\.theme-settings(?:[\s.[]|$)/);
    }
  }
});
