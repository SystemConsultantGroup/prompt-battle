import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = (path: string) => readFileSync(new URL(`../../public/${path}`, import.meta.url), 'utf8');

// Run the actual browser modules with a minimal DOM and deterministic timers.
// No browser or additional runtime dependency is required for these regressions.
class Element {
  nodeType = 1;
  className = '';
  classList = {
    toggle: (name: string, enabled: boolean) => {
      const names = this.className.split(' ').filter(item => item && item !== name);
      if (enabled) names.push(name);
      this.className = names.join(' ');
    },
  };
  value = '';
  disabled = false;
  parent: Element | null = null;
  children: (Element | string)[] = [];
  attributes: Record<string, string> = {};
  listeners: Record<string, (event?: unknown) => void> = {};
  constructor(public tagName: string) {}
  setAttribute(key: string, value: string) { this.attributes[key] = value; }
  append(...children: (Element | string)[]) {
    for (const child of children) {
      if (child instanceof Element) child.parent = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children: (Element | string)[]) {
    for (const child of this.children) if (child instanceof Element) child.parent = null;
    this.children = [];
    this.append(...children);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }
  insertBefore(child: Element, before: Element | string | undefined) {
    child.parent = this;
    const index = this.children.indexOf(before!);
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
  }
  get firstChild() { return this.children[0]; }
  addEventListener(name: string, callback: (event?: unknown) => void) { this.listeners[name] = callback; }
  focus() {}
  get textContent(): string {
    return this.children.map(child => typeof child === 'string' ? child : child.textContent).join('');
  }
  set textContent(text: string) { this.replaceChildren(text); }
}

function find(root: Element, className: string): Element | undefined {
  if (root.className.split(' ').includes(className)) return root;
  for (const child of root.children) {
    if (child instanceof Element) {
      const match = find(child, className);
      if (match) return match;
    }
  }
}

function browser(role: 'client' | 'host') {
  const body = new Element('body');
  const app = new Element('div');
  body.append(app);
  let receive: (message: unknown) => void = () => {};
  let now = 0;
  let sequence = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const sent: any[] = [];
  const context = {
    document: { body, createElement: (tag: string) => new Element(tag), getElementById: () => app },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    connect(callback: typeof receive) { receive = callback; return { send: (msg: unknown) => sent.push(msg) }; },
    setTimeout(callback: () => void, delay: number) {
      const id = ++sequence;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout(id: number) { timers.delete(id); },
    renderLobbyBoard(_app: Element, view: any) {
      const card = new Element('div');
      card.className = 'card wide';
      if (view.decoration) card.append(view.decoration);
      app.replaceChildren(card);
    },
    renderDashboard() {},
    renderGrading() { app.replaceChildren(new Element('grading')); },
    renderResults() { app.replaceChildren(new Element('results')); },
  };
  const stripModule = (js: string) => js.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  runInNewContext([
    source('shared/dom.js'), source('shared/start-guide.js'), source(`${role}/${role}.js`),
  ].map(stripModule).join('\n'), context);
  function advance(ms: number) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].callback();
    }
    now = end;
  }
  const snapshot = (phase: string, yourPrompt = '') => receive({
    type: 'STATE', yourPrompt,
    room: { phase, code: 'ABCD', players: [], problemId: 1, deadline: Date.now() + 60000 },
  });
  const start = () => receive({ type: 'GAME_START', problemId: 1, variationId: null });
  return { app, body, receive, advance, snapshot, start, sent, timers };
}

for (const role of ['client', 'host'] as const) {
  test(`${role}: start guide lasts 3 seconds, survives ticks, and does not replay on reconnect`, () => {
    const b = browser(role);
    b.snapshot('LOBBY');
    assert.equal(find(b.body, 'start-guide'), undefined);
    b.start();
    const guide = find(b.body, 'start-guide')!;
    assert.ok(guide);
    assert.equal(guide.attributes.role, 'status');
    assert.match(guide.textContent, /왼쪽의 웹페이지를 보고, 프롬프트를 써서 똑같이 만들어보세요!/);
    const textarea = find(b.app, 'prompt');
    b.advance(1000);
    b.receive({ type: 'TICK', remainingSec: 59 });
    if (role === 'host') b.receive({ type: 'PROMPT_MIRROR', username: 'player', text: '초록색 배경' });
    assert.equal(find(b.body, 'start-guide'), guide);
    if (textarea) assert.equal(find(b.app, 'prompt'), textarea);
    b.advance(1999);
    assert.equal(find(b.body, 'start-guide'), guide);
    b.advance(1);
    assert.equal(find(b.body, 'start-guide'), undefined);
    b.receive({ type: 'TICK', remainingSec: 57 });
    b.snapshot('PLAYING', '기존 프롬프트');
    assert.equal(find(b.body, 'start-guide'), undefined);
    if (role === 'client') assert.equal(find(b.app, 'prompt')!.value, '기존 프롬프트');
    b.snapshot('LOBBY');
    b.start();
    assert.ok(find(b.body, 'start-guide'), 'a new round gets a fresh announcement');
  });

  for (const type of ['GAME_END', 'ROOM_CLOSED', 'RESULT']) {
    test(`${role}: ${type} immediately clears the start guide and its timeout`, () => {
      const b = browser(role);
      b.snapshot('LOBBY');
      b.start();
      b.advance(1000);
      b.receive({ type, ranking: [] });
      assert.equal(find(b.body, 'start-guide'), undefined);
      assert.equal(b.timers.size, 0);
      // The old timeout must not remove a subsequent round's guide.
      b.snapshot('LOBBY');
      b.start();
      b.advance(2000);
      assert.ok(find(b.body, 'start-guide'));
      b.advance(1000);
      assert.equal(find(b.body, 'start-guide'), undefined);
    });
  }
}

test('player editor explains the game and preserves prompt/autosave across guide dismissal', () => {
  const b = browser('client');
  b.start();
  const textarea = find(b.app, 'prompt')!;
  assert.equal(textarea.attributes['aria-label'], '내 프롬프트');
  assert.match(textarea.attributes.placeholder, /목표 화면.*프롬프트/);
  assert.match(textarea.attributes.placeholder, /배경색.*글자 크기.*버튼.*위치.*간격/);
  assert.match(textarea.attributes.placeholder, /자동으로 저장.*제한 시간.*채점/s);
  textarea.value = '주황색 버튼과 초록색 배경을 만들어주세요.';
  textarea.listeners.input();
  b.advance(300);
  assert.equal(b.sent.at(-1).type, 'PROMPT_UPDATE');
  assert.equal(b.sent.at(-1).text, textarea.value);
  b.advance(2700);
  assert.equal(find(b.app, 'prompt'), textarea);
  assert.equal(textarea.value, '주황색 버튼과 초록색 배경을 만들어주세요.');
  assert.equal(textarea.disabled, false);
});

test('player/host load common gameplay CSS before the selected theme; animations respect reduced motion', () => {
  for (const page of ['client', 'host']) {
    const html = source(`${page}/index.html`);
    assert.ok(html.indexOf('/styles.css') < html.indexOf('/shared/gameplay.css'));
    assert.ok(html.indexOf('/shared/gameplay.css') < html.indexOf('/theme.css'));
  }
  assert.doesNotMatch(source('admin/index.html'), /gameplay\.css/);
  const common = source('shared/gameplay.css');
  const halloween = source('themes/halloween.css');
  assert.match(common, /\.play \.prompt\s*\{\s*font-size: 18px/);
  assert.match(common, /prefers-reduced-motion: reduce/);
  assert.match(halloween, /\.start-guide-icons::before, \.start-guide-icons::after,[^{}]+\{\s*animation: none/);
  assert.match(halloween, /halloween-guide-float 1200ms ease-in-out 2 alternate/);
  assert.match(halloween, /\.lobby-object, \.play \.timer.danger::after\s*\{\s*animation: none/);
});

test('only the player lobby has decorative objects; pausing persists across lobby updates', () => {
  const player = browser('client');
  player.snapshot('LOBBY');
  const scene = find(player.app, 'lobby-haunt')!;
  assert.ok(scene);
  assert.equal(scene.children.filter(child => child instanceof Element && child.className.includes('lobby-object')).length, 5);
  for (const child of scene.children) {
    if (child instanceof Element && child.className.includes('lobby-object')) {
      assert.equal(child.attributes['aria-hidden'], 'true');
    }
  }
  const toggle = find(scene, 'lobby-motion-toggle')!;
  assert.equal(toggle.attributes['aria-pressed'], 'false');
  toggle.listeners.click();
  assert.match(scene.className, /is-paused/);
  assert.equal(toggle.textContent, '장식 움직이기');
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  player.snapshot('LOBBY');
  const rebuilt = find(player.app, 'lobby-haunt')!;
  assert.match(rebuilt.className, /is-paused/);
  find(rebuilt, 'lobby-motion-toggle')!.listeners.click();
  assert.doesNotMatch(rebuilt.className, /is-paused/);
  player.start();
  assert.equal(find(player.app, 'lobby-haunt'), undefined);
  const host = browser('host');
  host.snapshot('LOBBY');
  assert.equal(find(host.app, 'lobby-haunt'), undefined);
});
