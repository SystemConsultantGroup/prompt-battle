import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startServer } from '../../src/server.ts';

test('Halloween skin serves every decoration locally as a self-contained SVG', async () => {
  const css = readFileSync(new URL('../../public/themes/halloween.css', import.meta.url), 'utf8');
  const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
  for (const asset of ['night', 'crest', 'web', 'hourglass', 'ghost', 'pumpkins', 'bat']) {
    assert.ok(urls.includes(`/themes/halloween/${asset}.svg`), `${asset} must be used by the skin`);
  }
  const { server, close } = startServer({ port: 0 });
  try {
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    for (const url of new Set(urls)) {
      assert.match(url, /^\/themes\/halloween\/[a-z-]+\.svg$/, 'no remote asset/font dependency');
      const res = await fetch(`${base}${url}`);
      assert.equal(res.status, 200, url);
      assert.equal(res.headers.get('content-type'), 'image/svg+xml');
      const svg = await res.text();
      assert.match(svg, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.match(svg, /viewBox="[\d .-]+"/);
      assert.doesNotMatch(svg, /<(?:script|foreignObject|image)\b|\bon\w+\s*=/i);
      assert.doesNotMatch(svg, /\b(?:href|src)\s*=|@import|url\(/i, 'SVGs must be self-contained');
    }
  } finally { await close(); }
});

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

test('Halloween body, form, button and status palette combinations meet WCAG AA', () => {
  const css = readFileSync(new URL('../../public/themes/halloween.css', import.meta.url), 'utf8');
  const colors = Object.fromEntries([...css.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})/g)]
    .map(match => [match[1], match[2]]));
  for (const [text, background] of [
    ['text', 'surface'], ['muted', 'surface'], ['faint', 'surface-2'],
    ['on-accent', 'pink'], ['on-accent', 'pink-hot'],
    ['text', 'elevated'], ['text', 'h-border'],
    ['no', 'surface'], ['cyan', 'surface-2'], ['ink', 'lime'],
  ]) {
    const a = luminance(colors[`--${text}`]), b = luminance(colors[`--${background}`]);
    const contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    assert.ok(contrast >= 4.5, `${text} on ${background}: ${contrast.toFixed(2)}:1`);
  }
});
