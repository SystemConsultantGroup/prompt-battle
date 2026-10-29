import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFidelity, parseColor, valueSimilarity, textTokens, tagTokens } from '../../src/grading/fidelity.ts';

const target = {
  html: '<button class="btn">시작하기</button>',
  css: '.btn{background:#5b7cfa;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600}',
  js: '',
};

test('identical code scores 1 on every part', () => {
  const f = computeFidelity(target, target);
  assert.deepEqual([f.style, f.text, f.structure, f.score], [1, 1, 1, 1]);
});

test('class names and selectors do not matter, only rendered values', () => {
  const gen = {
    html: '<button id="go">시작하기</button>',
    css: '#go{font-weight:600;border-radius:.5rem;padding:12px 24px;color:white;background:rgb(91,124,250)}',
    js: '',
  };
  assert.equal(computeFidelity(target, gen).score, 1);
});

test('closer values score strictly higher (fine-grained ordering)', () => {
  const at = (radius: string, bg: string) => computeFidelity(target, {
    html: target.html, css: `.b{background:${bg};color:#fff;padding:12px 24px;border-radius:${radius};font-weight:600}`, js: '',
  }).score;
  const exact = at('8px', '#5b7cfa');
  const nearRadius = at('10px', '#5b7cfa');
  const farRadius = at('20px', '#5b7cfa');
  const nearColor = at('8px', '#4a6ae8');
  const wrongColor = at('8px', '#ef4444');
  assert.ok(exact > nearRadius && nearRadius > farRadius);
  assert.ok(exact > nearColor && nearColor > wrongColor);
});

test('wrong text and missing elements lower text/structure', () => {
  const f = computeFidelity(target, { html: '<div>시작</div>', css: target.css, js: '' });
  assert.equal(f.text, 0);
  assert.equal(f.structure, 0);
  assert.equal(f.style, 1);
});

test('is deterministic', () => {
  const gen = { html: '<button>시작하기 지금</button><p>x</p>', css: '.a{padding:10px 20px;color:#eee}', js: '' };
  assert.equal(computeFidelity(target, gen).score, computeFidelity(target, gen).score);
});

test('helpers: colors, value tokens, text and tags', () => {
  assert.deepEqual(parseColor('#fff'), [255, 255, 255, 1]);
  assert.deepEqual(parseColor('rgba(0, 0, 0, .5)'), [0, 0, 0, 0.5]);
  assert.equal(parseColor('calc(1px)'), null);
  assert.equal(valueSimilarity('12px 24px', '12px 24px'), 1);
  assert.ok(valueSimilarity('12px 24px', '12px') < 1);
  assert.deepEqual(textTokens('<p>안녕 <b>세계</b></p><script>ignored()</script><!-- hi -->'), ['안녕', '세계']);
  assert.deepEqual(tagTokens('<div><span>a</span><!-- <em> --></div>'), ['div', 'span']);
});
