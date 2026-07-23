import { el, mount } from '/shared/dom.js';

const app = document.getElementById('app');
let pw = '';

function api(path, opts = {}) {
  return fetch(path, { ...opts, headers: { 'x-admin-password': pw, 'content-type': 'application/json', ...(opts.headers || {}) } });
}

function renderLogin() {
  const input = el('input', { type: 'password', placeholder: 'Admin password' });
  mount(app, el('div', { class: 'card' }, el('h1', {}, 'Admin'),
    input,
    el('button', { onClick: async () => {
      pw = input.value;
      const res = await api('/api/accounts');
      if (res.status === 401) { alert('wrong password'); return; }
      renderConsole();
    } }, 'Enter')));
}

async function renderConsole() {
  const accounts = await (await api('/api/accounts')).json();
  const problems = await (await api('/api/problems')).json();

  // Accounts panel
  const newName = el('input', { placeholder: 'new username' });
  const accList = el('ul', {}, ...accounts.map(a =>
    el('li', {}, `${a.username} `,
      el('button', { onClick: async () => { await api(`/api/accounts/${a.id}`, { method: 'DELETE' }); renderConsole(); } }, 'x'))));
  const accountsPanel = el('div', { class: 'card' }, el('h2', {}, 'Accounts'),
    newName, el('button', { onClick: async () => {
      await api('/api/accounts', { method: 'POST', body: JSON.stringify({ username: newName.value.trim() }) });
      renderConsole();
    } }, 'Add'), accList);

  // Problem creation panel
  const f = {
    title: el('input', { placeholder: 'title' }),
    category: el('input', { placeholder: 'category' }),
    difficulty: el('input', { placeholder: 'easy|normal|hard', value: 'easy' }),
    time: el('input', { placeholder: 'time limit sec', value: '300' }),
    detail: el('input', { placeholder: 'detail weight 0..1', value: '0.3' }),
    html: el('textarea', { placeholder: 'target HTML' }),
    css: el('textarea', { placeholder: 'target CSS' }),
    js: el('textarea', { placeholder: 'target JS' }),
  };
  const critRows = [];
  const critBox = el('div', {});
  const addCrit = () => {
    const kind = el('select', {}); kind.append(new Option('basic', 'basic'), new Option('detail', 'detail'));
    const desc = el('input', { placeholder: 'criterion description' });
    critRows.push({ kind, desc });
    critBox.append(el('div', { class: 'crit-row' }, kind, desc));
  };
  addCrit();

  const problemsPanel = el('div', { class: 'card' }, el('h2', {}, 'New problem'),
    f.title, f.category, f.difficulty, f.time, f.detail, f.html, f.css, f.js,
    el('h3', {}, 'Criteria'), critBox,
    el('button', { onClick: addCrit }, '+ criterion'),
    el('button', { onClick: async () => {
      const body = {
        problem: { title: f.title.value, category: f.category.value, difficulty: f.difficulty.value,
          timeLimitSec: Number(f.time.value), targetHtml: f.html.value, targetCss: f.css.value,
          targetJs: f.js.value, detailWeight: Number(f.detail.value) },
        criteria: critRows.map((r, i) => ({ kind: r.kind.value, description: r.desc.value, sortOrder: i })),
      };
      await api('/api/problems', { method: 'POST', body: JSON.stringify(body) });
      renderConsole();
    } }, 'Create problem'),
    el('h3', {}, 'Existing'),
    el('ul', {}, ...problems.map(p => el('li', {}, `${p.title} (${p.category}, ${p.timeLimitSec}s) `,
      el('button', { onClick: async () => { await api(`/api/problems/${p.id}`, { method: 'DELETE' }); renderConsole(); } }, 'x')))));

  mount(app, el('div', { class: 'admin-grid' }, accountsPanel, problemsPanel));
}

renderLogin();
