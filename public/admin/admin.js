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
  const addCrit = (kindVal = 'basic', descVal = '') => {
    const kind = el('select', {}); kind.append(new Option('basic', 'basic'), new Option('detail', 'detail'));
    kind.value = kindVal;
    const desc = el('input', { placeholder: 'criterion description', value: descVal });
    critRows.push({ kind, desc });
    critBox.append(el('div', { class: 'crit-row' }, kind, desc));
  };
  addCrit();

  let editId = null;
  const formHeading = el('h2', {}, 'New problem');
  const variationsBox = el('div', { class: 'variations-box' });
  renderVariationsBox(null, [], null);

  function renderVariationsBox(id, variations, base) {
    variationsBox.replaceChildren();
    if (id === null) {
      variationsBox.append(el('p', { class: 'hint' }, 'Save the problem first to add variations'));
      return;
    }
    const list = el('ul', {}, ...variations.map(v => el('li', {}, v.label, ' ',
      el('button', { onClick: async () => {
        await api(`/api/variations/${v.id}`, { method: 'DELETE' });
        await enterEditMode(id);
      } }, 'Delete'))));
    const vf = {
      label: el('input', { placeholder: 'variation label' }),
      html: el('textarea', { placeholder: 'variation target HTML' }),
      css: el('textarea', { placeholder: 'variation target CSS' }),
      js: el('textarea', { placeholder: 'variation target JS' }),
    };
    // Copy the base problem's code into the form so the admin edits a copy
    // rather than authoring a variation from a blank slate.
    const prefillBtn = el('button', { onClick: () => {
      vf.html.value = base?.targetHtml ?? '';
      vf.css.value = base?.targetCss ?? '';
      vf.js.value = base?.targetJs ?? '';
    } }, 'Prefill from base');
    const addVariationBtn = el('button', { onClick: async () => {
      await api(`/api/problems/${id}/variations`, {
        method: 'POST',
        body: JSON.stringify({ label: vf.label.value, targetHtml: vf.html.value, targetCss: vf.css.value, targetJs: vf.js.value }),
      });
      await enterEditMode(id);
    } }, 'Add variation');
    variationsBox.append(
      el('h3', {}, 'Variations'), list,
      el('h4', {}, 'Add variation'),
      vf.label, prefillBtn, vf.html, vf.css, vf.js, addVariationBtn);
  }
  const submitBtn = el('button', { onClick: async () => {
    const body = {
      problem: { title: f.title.value, category: f.category.value, difficulty: f.difficulty.value,
        timeLimitSec: Number(f.time.value), targetHtml: f.html.value, targetCss: f.css.value,
        targetJs: f.js.value, detailWeight: Number(f.detail.value) },
      criteria: critRows.map((r, i) => ({ kind: r.kind.value, description: r.desc.value, sortOrder: i })),
    };
    if (editId === null) {
      await api('/api/problems', { method: 'POST', body: JSON.stringify(body) });
    } else {
      await api(`/api/problems/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
    }
    renderConsole();
  } }, 'Create problem');
  const cancelEditBtn = el('button', { onClick: () => { renderConsole(); } }, 'Cancel edit');
  cancelEditBtn.style.display = 'none';

  async function enterEditMode(id) {
    const p = await (await api(`/api/problems/${id}`)).json();
    editId = id;
    f.title.value = p.title;
    f.category.value = p.category;
    f.difficulty.value = p.difficulty;
    f.time.value = String(p.timeLimitSec);
    f.detail.value = String(p.detailWeight);
    f.html.value = p.targetHtml;
    f.css.value = p.targetCss;
    f.js.value = p.targetJs;
    critRows.length = 0;
    critBox.replaceChildren();
    const sorted = [...p.criteria].sort((a, b) => a.sortOrder - b.sortOrder);
    if (sorted.length === 0) { addCrit(); }
    else { for (const c of sorted) addCrit(c.kind, c.description); }
    formHeading.textContent = `Edit problem #${id}`;
    submitBtn.textContent = 'Update problem';
    cancelEditBtn.style.display = '';
    renderVariationsBox(id, p.variations ?? [], p);
  }

  const problemsPanel = el('div', { class: 'card' }, formHeading,
    f.title, f.category, f.difficulty, f.time, f.detail, f.html, f.css, f.js,
    el('h3', {}, 'Criteria'), critBox,
    el('button', { onClick: () => addCrit() }, '+ criterion'),
    submitBtn, cancelEditBtn,
    variationsBox,
    el('h3', {}, 'Existing'),
    el('ul', {}, ...problems.map(p => el('li', {}, `${p.title} (${p.category}, ${p.timeLimitSec}s) `,
      el('button', { onClick: () => enterEditMode(p.id) }, 'Edit'), ' ',
      el('button', { onClick: async () => { await api(`/api/problems/${p.id}`, { method: 'DELETE' }); renderConsole(); } }, 'x')))));

  mount(app, el('div', { class: 'admin-grid' }, accountsPanel, problemsPanel));
}

renderLogin();
