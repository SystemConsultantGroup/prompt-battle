import { el, mount } from '/shared/dom.js';

const KIND_KO = { basic: '기본', detail: '디테일' };

export function renderResults(app, state) {
  const rows = (state.ranking ?? []).map((r, i) => {
    const items = r.items.map(it => el('li', { class: it.passed ? 'ok' : 'no' },
      `${it.passed ? 'O' : 'X'} [${KIND_KO[it.kind] ?? it.kind}] ${it.description} (${Math.round(it.rate * 100)}%)`));
    const frame = r.genToken
      ? el('iframe', { class: 'result-frame', src: `/render/gen/${r.genToken}`, sandbox: 'allow-scripts' })
      : null;
    return el('div', { class: 'result' },
      el('div', { class: 'rhead' },
        el('span', { class: 'rank' }, `#${i + 1}`),
        el('span', { class: 'ruser' }, r.username),
        el('span', { class: 'rtotal' }, `${Math.round(r.total * 100)}%`)),
      el('div', { class: 'rsub' }, `기본 ${Math.round(r.basicScore * 100)}% · 디테일 ${Math.round(r.detailScore * 100)}%`),
      el('ul', { class: 'ritems' }, ...items),
      ...(frame ? [frame] : []));
  });
  mount(app, el('div', { class: 'results-wrap' },
    el('h2', {}, '최종 순위'),
    el('div', { class: 'results-row' }, ...rows),
    el('button', { onClick: () => state.bus.send({ type: 'RESTART' }) }, '다시 시작')));
}
