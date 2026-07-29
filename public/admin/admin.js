import { el, mount } from '/shared/dom.js';

const app = document.getElementById('app');
let pw = '';

function api(path, opts = {}) {
  return fetch(path, { ...opts, headers: { 'x-admin-password': pw, 'content-type': 'application/json', ...(opts.headers || {}) } });
}

function renderLogin() {
  const input = el('input', { type: 'password', placeholder: '관리자 비밀번호' });
  mount(app, el('div', { class: 'card' }, el('h1', {}, '관리자'),
    input,
    el('button', { onClick: async () => {
      pw = input.value;
      const res = await api('/api/accounts');
      if (res.status === 401) { alert('비밀번호가 올바르지 않습니다.'); return; }
      renderConsole();
    } }, '로그인')));
}

async function renderConsole() {
  const accounts = await (await api('/api/accounts')).json();
  const problems = await (await api('/api/problems')).json();

  // Accounts panel
  const newName = el('input', { placeholder: '새 이름' });
  const accList = el('ul', {}, ...accounts.map(a =>
    el('li', {}, `${a.username} `,
      el('button', { onClick: async () => { await api(`/api/accounts/${a.id}`, { method: 'DELETE' }); renderConsole(); } }, '삭제'))));
  const accountsPanel = el('div', { class: 'card' }, el('h2', {}, '계정'),
    newName, el('button', { onClick: async () => {
      await api('/api/accounts', { method: 'POST', body: JSON.stringify({ username: newName.value.trim() }) });
      renderConsole();
    } }, '추가'), accList);

  // Problem creation panel
  const f = {
    title: el('input', { placeholder: '제목' }),
    category: el('input', { placeholder: '카테고리' }),
    difficulty: el('input', { placeholder: '난이도 (easy|normal|hard)', value: 'easy' }),
    time: el('input', { placeholder: '제한시간(초)', value: '300' }),
    detail: el('input', { placeholder: '디테일 가중치 (0~1)', value: '0.3' }),
    html: el('textarea', { placeholder: '목표 HTML' }),
    css: el('textarea', { placeholder: '목표 CSS' }),
    js: el('textarea', { placeholder: '목표 JS' }),
  };
  const critRows = [];
  const critBox = el('div', {});
  const addCrit = (kindVal = 'basic', descVal = '') => {
    const kind = el('select', {}); kind.append(new Option('기본', 'basic'), new Option('디테일', 'detail'));
    kind.value = kindVal;
    const desc = el('input', { placeholder: '채점 기준 설명', value: descVal });
    critRows.push({ kind, desc });
    critBox.append(el('div', { class: 'crit-row' }, kind, desc));
  };
  addCrit();

  let editId = null;
  const formHeading = el('h2', {}, '새 문제');
  const variationsBox = el('div', { class: 'variations-box' });
  renderVariationsBox(null, [], null);

  function renderVariationsBox(id, variations, base) {
    variationsBox.replaceChildren();
    if (id === null) {
      variationsBox.append(el('p', { class: 'hint' }, '변형을 추가하려면 먼저 문제를 저장하세요.'));
      return;
    }
    const list = el('ul', {}, ...variations.map(v => el('li', {}, v.label, ' ',
      el('button', { onClick: async () => {
        await api(`/api/variations/${v.id}`, { method: 'DELETE' });
        await enterEditMode(id);
      } }, '삭제'))));
    const vf = {
      label: el('input', { placeholder: '변형 이름' }),
      html: el('textarea', { placeholder: '변형 목표 HTML' }),
      css: el('textarea', { placeholder: '변형 목표 CSS' }),
      js: el('textarea', { placeholder: '변형 목표 JS' }),
    };
    // Copy the base problem's code into the form so the admin edits a copy
    // rather than authoring a variation from a blank slate.
    const prefillBtn = el('button', { onClick: () => {
      vf.html.value = base?.targetHtml ?? '';
      vf.css.value = base?.targetCss ?? '';
      vf.js.value = base?.targetJs ?? '';
    } }, 'base에서 가져오기');
    const addVariationBtn = el('button', { onClick: async () => {
      await api(`/api/problems/${id}/variations`, {
        method: 'POST',
        body: JSON.stringify({ label: vf.label.value, targetHtml: vf.html.value, targetCss: vf.css.value, targetJs: vf.js.value }),
      });
      await enterEditMode(id);
    } }, '변형 추가');
    variationsBox.append(
      el('h3', {}, '변형'), list,
      el('h4', {}, '변형 추가'),
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
  } }, '문제 생성');
  const cancelEditBtn = el('button', { onClick: () => { renderConsole(); } }, '편집 취소');
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
    formHeading.textContent = `문제 #${id} 편집`;
    submitBtn.textContent = '문제 수정';
    cancelEditBtn.style.display = '';
    renderVariationsBox(id, p.variations ?? [], p);
  }

  const problemsPanel = el('div', { class: 'card' }, formHeading,
    f.title, f.category, f.difficulty, f.time, f.detail, f.html, f.css, f.js,
    el('h3', {}, '채점 기준'), critBox,
    el('button', { onClick: () => addCrit() }, '+ 기준'),
    submitBtn, cancelEditBtn,
    variationsBox,
    el('h3', {}, '기존 문제'),
    el('ul', {}, ...problems.map(p => el('li', {}, `${p.title} (${p.category}, ${p.timeLimitSec}초) `,
      el('button', { onClick: () => enterEditMode(p.id) }, '편집'), ' ',
      el('button', { onClick: async () => { await api(`/api/problems/${p.id}`, { method: 'DELETE' }); renderConsole(); } }, '삭제')))));

  mount(app, el('div', { class: 'admin-grid' }, accountsPanel, problemsPanel));
}

renderLogin();
