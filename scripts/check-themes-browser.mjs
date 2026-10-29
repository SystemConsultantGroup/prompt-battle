import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Optional browser QA; no production dependencies. See docs/theme-qa.md.
const root = fileURLToPath(new URL('../', import.meta.url));
const tools = createRequire(join(process.env.THEME_BROWSER_TOOLS ?? root, 'package.json'));
const { chromium } = tools('playwright-core');
const { PNG } = tools('pngjs');
const dir = mkdtempSync(join(tmpdir(), 'pb-theme-visual-'));
const screenshots = join(dir, 'screenshots');
mkdirSync(screenshots);
const serverPort = await new Promise(resolve => {
  const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
});
const base = `http://127.0.0.1:${serverPort}`;
const dbPath = join(dir, 'nested', 'persistent', 'app.sqlite');
let server;
let serverLogs = '';
async function boot() {
  server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: root, env: { ...process.env, PORT: String(serverPort), DB_PATH: dbPath, ADMIN_PASSWORD: 'theme-test', OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', d => { serverLogs += d; });
  server.stderr.on('data', d => { serverLogs += d; });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null || server.signalCode !== null) throw new Error(`server exited: ${serverLogs}`);
    try { if ((await fetch(`${base}/theme.css`)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`server startup timeout: ${serverLogs}`);
}
async function stop() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM'); await exited;
}
const headers = { 'x-admin-password': 'theme-test', 'content-type': 'application/json' };
async function api(path, method = 'GET', body) {
  const res = await fetch(`${base}/api/${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal(res.status, 200, await res.clone().text()); return res.json();
}
const setTheme = theme => api('settings/theme', 'PUT', { theme });
const colors = page => page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, button: document.querySelector('button') ? getComputedStyle(document.querySelector('button')).backgroundColor : null }));
let browser;
let checks = [];
try {
  await boot();
  await api('accounts', 'POST', { username: 'alice' });
  await api('accounts', 'POST', { username: 'bob' });
  const { id } = await api('problems', 'POST', {
    problem: { title: 'Browser test', category: 'test', difficulty: 'easy', timeLimitSec: 120,
      targetHtml: '<main><span>UI TARGET</span><h1>Make something<br>worth a second look.</h1><p>A quiet place for your next idea.</p><button>Start creating</button></main>', targetCss: 'body{margin:0;background:#f7f8f5;color:#17251b;font-family:system-ui}main{padding:32px}span{font-size:11px;letter-spacing:.16em}h1{font-size:30px;line-height:1.12;letter-spacing:-.04em;margin:32px 0 16px}p{font-size:14px;color:#566950}button{background:#17251b;color:#fff;border:0;border-radius:6px;padding:12px 20px;margin-top:12px}', targetJs: '', detailWeight: .3 },
    criteria: [{ kind: 'basic', description: '버튼이 있다', sortOrder: 0 }],
  });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-threaded-animation', '--disable-gpu'] });
  const errors = [];
  const room = { code: 'BOO4', phase: 'LOBBY', players: [{ username: 'alice', connected: true }, { username: 'bob', connected: false }],
    maxPlayers: 8, remainingSec: null, problemId: id, activeVariationId: null, deadline: null, timeLimitSec: 120, problemTitle: '작은 아이디어를 위한 랜딩 페이지', ranking: null };
  const ranking = [
    { username: 'alice', total: .9, basicScore: 1, detailScore: .6, prompt: '하얀색 버튼을 만들어 주세요.', items: [
      { description: '버튼이 있다', kind: 'basic', passed: true, rate: 1 },
      { description: '색상 일치', kind: 'detail', passed: false, rate: .6 },
    ] },
    { username: 'bob', total: .5, basicScore: .6, detailScore: .3, prompt: 'A simple button', items: [
      { description: '버튼이 있다', kind: 'basic', passed: false, rate: 0 },
    ] },
  ];
  const baselineCommit = 'bb4b943d755a0e529d585cc7ca0cd98c40907777';
  async function pageFor({ baseline = false, path = 'client', width = 1280, height = 900, reducedMotion = 'no-preference' } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', res => { if (res.status() >= 400 && new URL(res.url()).pathname.startsWith('/themes/')) errors.push(`asset ${res.status()}: ${res.url()}`); });
    let socket;
    await page.routeWebSocket('**/*', ws => { socket = ws; });
    if (baseline) {
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        let pathname = url.pathname;
        if (pathname === '/') pathname = '/client/index.html';
        else if (pathname.endsWith('/')) pathname += 'index.html';
        if (pathname.startsWith('/api/') || pathname.startsWith('/render/')) return route.continue();
        try {
          const body = execFileSync('git', ['show', `${baselineCommit}:public${pathname}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
          const contentType = pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.js') ? 'text/javascript' : 'text/html';
          return route.fulfill({ status: 200, contentType, body });
        } catch { return route.continue(); }
      });
    }
    await page.goto(`${base}/${path}/`);
    await page.locator('button').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    return { page, context, send: msg => socket.send(JSON.stringify(msg)) };
  }
  async function settle(page) {
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      document.activeElement?.blur();
      for (const animation of document.getAnimations()) {
        await animation.ready;
        animation.pause();
        await animation.ready;
        animation.currentTime = animation.effect.getTiming().iterations === Infinity ? 0 : animation.effect.getTiming().duration;
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }
  async function identical(a, b, name) {
    await settle(a); await settle(b);
    await a.screenshot(); await b.screenshot();
    let differing = 0, max = 0, pixelCount = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const aa = await a.screenshot({ animations: 'allow', path: join(screenshots, `${name}-original.png`) });
      const bb = await b.screenshot({ animations: 'allow', path: join(screenshots, `${name}-current.png`) });
      const ap = PNG.sync.read(aa), bp = PNG.sync.read(bb);
      differing = 0; max = 0; pixelCount = ap.width * ap.height;
      for (let i = 0; i < ap.data.length; i += 4) {
        const delta = Math.max(...[0, 1, 2, 3].map(c => Math.abs(ap.data[i + c] - bp.data[i + c])));
        if (delta) { differing++; max = Math.max(max, delta); }
      }
      if (max <= 8 && differing / pixelCount < .001) break;
      // Repaint before retrying sparse headless-AA mismatches; do not loosen
      // either the pixel threshold or the exact CSS/geometry assertion below.
      if (attempt < 2) for (const page of [a, b]) {
        const viewport = page.viewportSize();
        await page.setViewportSize({ ...viewport, width: viewport.width + 1 });
        await page.setViewportSize(viewport);
        await settle(page);
      }
    }
    // Rotated-card antialiasing may differ by <=8 RGB levels in headless Chrome.
    // Require exact computed CSS + element geometry, and matching screenshot pixels
    // apart from that tiny rasterisation tolerance (never layout/color tolerance).
    const snapshot = p => p.evaluate(() => [...document.querySelectorAll('body, #app, #app *')]
      .filter(el => !el.closest('.theme-settings')).map(el => {
        const css = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, id: el.id, class: el.className, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          css: Object.fromEntries([...css].map(k => [k, css.getPropertyValue(k)])) };
      }));
    // New admin settings extend the page height; do not compare the container's
    // total height, but all existing child geometry and CSS remain contractual.
    const normalize = items => items.map(item => {
      if (item.class === 'admin-grid' || item.tag === 'BODY' || item.id === 'app') {
        if (name.startsWith('admin-') && name.endsWith('console')) {
          delete item.height; delete item.css.height; delete item.css['block-size']; delete item.css['grid-template-rows'];
          delete item.css['transform-origin']; delete item.css['perspective-origin'];
        }
      }
      return item;
    });
    assert.deepEqual(normalize(await snapshot(b)), normalize(await snapshot(a)), `CSS/geometry identical: ${name}`);
    assert.ok(max <= 8 && differing / pixelCount < .001,
      `cartoon screenshot ${name}: max channel delta=${max}, different pixels=${differing}`);
    checks.push(`${name}: exact original CSS/geometry; screenshot ${differing === 0 ? 'pixel-exact' : `${differing} antialias pixels, max delta ${max}`}`);
    console.log(`PASS ${name}`);
  }
  // All original game phases, including hover/focus, warning colors and motion.
  for (const width of [1280, 375]) {
    for (const path of ['client', 'host']) {
      const old = await pageFor({ baseline: true, path, width });
      const now = await pageFor({ path, width });
      await identical(old.page, now.page, `${path}-${width}-login`);
      await old.page.locator('button').first().hover(); await now.page.locator('button').first().hover();
      await identical(old.page, now.page, `${path}-${width}-hover`);
      const state = { type: 'STATE', room, role: path === 'host' ? 'host' : 'player' };
      old.send(state); now.send(state);
      await identical(old.page, now.page, `${path}-${width}-lobby`);
      old.send({ type: 'GAME_START', problemId: id, deadline: Date.now() + 120000, variationId: null });
      now.send({ type: 'GAME_START', problemId: id, deadline: Date.now() + 120000, variationId: null });
      old.send({ type: 'TICK', remainingSec: 90 }); now.send({ type: 'TICK', remainingSec: 90 });
      await identical(old.page, now.page, `${path}-${width}-playing`);
      old.send({ type: 'TICK', remainingSec: 25 }); now.send({ type: 'TICK', remainingSec: 25 });
      await identical(old.page, now.page, `${path}-${width}-warn`);
      old.send({ type: 'TICK', remainingSec: 8 }); now.send({ type: 'TICK', remainingSec: 8 });
      await identical(old.page, now.page, `${path}-${width}-danger`);
      old.send({ type: 'GRADING_PROGRESS', done: 1, total: 2 }); now.send({ type: 'GRADING_PROGRESS', done: 1, total: 2 });
      await identical(old.page, now.page, `${path}-${width}-grading`);
      old.send({ type: 'RESULT', ranking }); now.send({ type: 'RESULT', ranking });
      await identical(old.page, now.page, `${path}-${width}-results`);
      await old.context.close(); await now.context.close();
    }
  }
  for (const width of [1280, 375]) {
    const old = await pageFor({ baseline: true, path: 'admin', width });
    const now = await pageFor({ path: 'admin', width });
    await identical(old.page, now.page, `admin-${width}-login`);
    for (const p of [old.page, now.page]) { await p.locator('#admin-pw').fill('theme-test'); await p.locator('#admin-login-btn').click(); await p.locator('.admin-grid').waitFor(); }
    await now.page.locator('#site-theme:enabled').waitFor();
    await identical(old.page, now.page, `admin-${width}-console`);
    await old.context.close(); await now.context.close();
  }
  // Admin save must not change the active theme or remount the editor.
  const admin = await pageFor({ path: 'admin' });
  await admin.page.locator('#admin-pw').fill('theme-test'); await admin.page.locator('#admin-login-btn').click();
  await admin.page.locator('#site-theme:enabled').waitFor();
  await admin.page.locator('input[placeholder="제목"]').fill('unsaved title');
  const adminBefore = await colors(admin.page);
  await admin.page.locator('#site-theme').selectOption('halloween');
  await admin.page.getByRole('button', { name: '테마 저장', exact: true }).click();
  await admin.page.getByRole('status').filter({ hasText: '할로윈 테마를 저장했습니다' }).waitFor();
  assert.deepEqual(await colors(admin.page), adminBefore);
  assert.equal(await admin.page.locator('input[placeholder="제목"]').inputValue(), 'unsaved title');
  checks.push('admin saves without changing current theme or unsaved editor');
  await admin.page.screenshot({ path: join(screenshots, 'admin-settings-saved.png'), fullPage: true });

  async function capture(page, name) {
    await settle(page);
    // Trigger any scroll-dependent content before capturing the whole page.
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    await page.evaluate(() => { window.scrollTo(0, 0); });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: horizontal overflow`);
    if (name.endsWith('-login')) assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight), true, `${name}: entrance must fit without scrolling`);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.getClientRects().length).every(b => b.getBoundingClientRect().height >= 44)), true, `${name}: button hit area`);
    await page.screenshot({ path: join(screenshots, `${name}.png`), fullPage: true });
  }
  for (const width of [1280, 768, 375]) {
    for (const path of ['client', 'host', 'admin']) {
      const p = await pageFor({ path, width });
      assert.equal((await colors(p.page)).bg, 'rgb(16, 23, 20)');
      const shape = await p.page.evaluate(() => {
        const card = document.querySelector('.card'), button = document.querySelector('button');
        return { arch: getComputedStyle(card).borderTopLeftRadius,
          crest: getComputedStyle(card, '::before').backgroundImage,
          scenery: getComputedStyle(document.body, '::after').backgroundImage,
          sceneryPointerEvents: getComputedStyle(document.body, '::after').pointerEvents,
          sceneryZIndex: getComputedStyle(document.body, '::after').zIndex,
          buttonClip: getComputedStyle(button).clipPath,
          decorationRadius: getComputedStyle(button, '::after').borderTopLeftRadius,
          decorationRibs: getComputedStyle(button, '::after').backgroundImage,
          stem: getComputedStyle(button).backgroundImage };
      });
      assert.match(shape.arch, /(?:180px 112px|140px 96px)/);
      assert.match(shape.crest, /crest\.svg/);
      assert.match(shape.crest, /ghost\.svg/);
      assert.match(shape.scenery, /pumpkins\.svg/);
      if (width > 720) assert.match(shape.scenery, /ghost\.svg/);
      else assert.doesNotMatch(shape.scenery, /ghost\.svg/);
      assert.equal(shape.sceneryPointerEvents, 'none');
      assert.equal(shape.sceneryZIndex, '-1');
      assert.equal(shape.buttonClip, 'none'); // Focus/hit target must not be clipped.
      assert.equal(shape.decorationRadius, '28px 20px');
      assert.match(shape.decorationRibs, /radial-gradient/);
      assert.match(shape.stem, /linear-gradient/);
      await capture(p.page, `halloween-${path}-${width}-login`);
      await p.page.locator('button').first().focus();
      await p.page.keyboard.press('Shift+Tab'); await p.page.keyboard.press('Tab');
      assert.equal(await p.page.locator('button').first().evaluate(el => getComputedStyle(el).outlineWidth), '3px');
      await p.page.screenshot({ path: join(screenshots, `halloween-${path}-${width}-focus.png`) });
      const button = p.page.locator('button').first();
      await button.hover();
      assert.match(await button.evaluate(el => getComputedStyle(el, '::after').backgroundImage), /radial-gradient/);
      assert.match(await button.evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
      await button.evaluate(el => { el.disabled = true; });
      assert.equal(await button.evaluate(el => getComputedStyle(el).opacity), '0.55');
      await button.evaluate(el => { el.disabled = false; });
      await p.page.mouse.move(0, 0);
      if (path !== 'admin') {
        p.send({ type: 'ERROR', message: path === 'host' ? 'bad admin password' : 'unknown room' });
        await capture(p.page, `halloween-${path}-${width}-error`);
        p.send({ type: 'STATE', room, role: path === 'host' ? 'host' : 'player' });
        await capture(p.page, `halloween-${path}-${width}-lobby`);
        p.send({ type: 'GAME_START', problemId: id, deadline: Date.now() + 120000, variationId: null });
        p.send({ type: 'TICK', remainingSec: 90 });
        if (path === 'client') await p.page.locator('.prompt').fill('아이디어를 소개하는 작은 랜딩 페이지를 만들어 주세요.\n흰 배경과 짙은 녹색 버튼을 사용하고, 여백은 넉넉하게 해 주세요.');
        if (path === 'host') p.send({ type: 'PROMPT_MIRROR', username: 'alice', text: '흰 배경과 짙은 녹색 버튼.\n여백이 넉넉한 작은 랜딩 페이지.' });
        await capture(p.page, `halloween-${path}-${width}-playing`);
        p.send({ type: 'TICK', remainingSec: 25 });
        await capture(p.page, `halloween-${path}-${width}-warn`);
        p.send({ type: 'TICK', remainingSec: 8 });
        await capture(p.page, `halloween-${path}-${width}-danger`);
        assert.equal(await p.page.locator('.timer').evaluate(el => getComputedStyle(el).animationName), 'none');
        p.send({ type: 'GRADING_PROGRESS', done: 1, total: 2 });
        await capture(p.page, `halloween-${path}-${width}-grading`);
        p.send({ type: 'RESULT', ranking });
        await capture(p.page, `halloween-${path}-${width}-results`);
      } else {
        await p.page.locator('#admin-pw').fill('theme-test');
        await p.page.locator('#admin-login-btn').click();
        await p.page.locator('#site-theme:enabled').waitFor();
        await capture(p.page, `halloween-${path}-${width}-console`);
      }
      await p.context.close();
    }
  }
  checks.push('Halloween 1280/768/375px: arched entrance, ghost/crest decorations, pumpkin scenery, unclipped pumpkin buttons with stems/ribs, keyboard focus, 44px hit areas, error/lobby/play/warning/danger/grading/results/admin; no overflow');
  for (const width of [1280, 375]) {
    const p = await pageFor({ path: 'client', width, reducedMotion: 'reduce' });
    assert.equal(await p.page.locator('.card').evaluate(el => getComputedStyle(el).animationName), 'none');
    await p.page.locator('button').hover();
    assert.equal(await p.page.locator('button').evaluate(el => getComputedStyle(el).transform), 'none');
    await capture(p.page, `halloween-client-${width}-reduced-motion`);
    await p.context.close();
  }
  const highContrast = await pageFor({ path: 'client', width: 375 });
  await highContrast.page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await highContrast.page.locator('body').evaluate(el => getComputedStyle(el, '::after').display), 'none');
  assert.equal(await highContrast.page.locator('button').evaluate(el => getComputedStyle(el, '::after').display), 'none');
  assert.equal(await highContrast.page.locator('button').evaluate(el => getComputedStyle(el).borderTopWidth), '2px');
  await capture(highContrast.page, 'halloween-client-375-forced-colors');
  await highContrast.context.close();
  checks.push('reduced motion disables entrance/hover movement; forced-colors restores native visible controls');
  // A loaded player stays Halloween after the global setting switches back.
  const player = await pageFor({ path: 'client' });
  player.send({ type: 'STATE', room, role: 'player' });
  player.send({ type: 'GAME_START', problemId: id, deadline: Date.now() + 120000, variationId: null });
  await player.page.locator('.prompt').fill('keep this prompt');
  await player.page.locator('.prompt').focus();
  await player.page.evaluate(() => { window.promptNode = document.querySelector('.prompt'); window.targetNode = document.querySelector('iframe'); });
  await setTheme('cartoon');
  await player.page.waitForTimeout(200);
  assert.equal((await colors(player.page)).bg, 'rgb(16, 23, 20)');
  assert.equal(await player.page.locator('.prompt').inputValue(), 'keep this prompt');
  assert.equal(await player.page.evaluate(() => document.querySelector('.prompt') === window.promptNode && document.querySelector('iframe') === window.targetNode && document.activeElement === window.promptNode), true);
  const fresh = await pageFor({ path: 'client' });
  assert.equal((await colors(fresh.page)).bg, 'rgb(30, 8, 56)');
  await player.page.reload();
  assert.equal((await colors(player.page)).bg, 'rgb(30, 8, 56)');
  checks.push('existing page/input/focus/iframe preserved; new page and reload pick up changed theme');
  await fresh.context.close(); await player.context.close();

  // Endpoint failure falls back to the unchanged original cartoon CSS.
  const fallback = await browser.newPage();
  await fallback.route('**/theme.css', route => route.abort());
  await fallback.goto(`${base}/client/`);
  assert.equal((await colors(fallback)).bg, 'rgb(30, 8, 56)');
  await fallback.close(); checks.push('theme loading failure falls back to original cartoon');

  // Failed save has inline feedback and retains selection/editor for retry.
  await admin.page.route('**/api/settings/theme', route => route.request().method() === 'PUT'
    ? route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }) : route.continue());
  await admin.page.locator('#site-theme').selectOption('cartoon');
  await admin.page.getByRole('button', { name: '테마 저장', exact: true }).click();
  await admin.page.getByRole('status').filter({ hasText: '테마 저장 결과를 확인하지 못했습니다' }).waitFor();
  assert.equal(await admin.page.getByRole('button', { name: '테마 저장', exact: true }).isEnabled(), true);
  assert.equal(await admin.page.locator('input[placeholder="제목"]').inputValue(), 'unsaved title');
  await admin.context.close(); checks.push('failed admin save is recoverable and preserves editor');

  await setTheme('halloween'); await stop(); await boot();
  assert.equal((await api('settings/theme')).theme, 'halloween');
  assert.equal((await api('accounts')).length, 2);
  assert.equal((await api('problems')).length, 1);
  checks.push('DB_PATH nested directory honored; theme/accounts/problems survive full server restart');
  assert.deepEqual(errors, []);
  const report = { checks, screenshots, dbPath, errors };
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close(); await stop();
  console.log(`Artifacts: ${dir}`);
}
