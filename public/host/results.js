import { el, mount } from '/shared/dom.js';

export function renderResults(app, state) {
  const rows = (state.ranking ?? []).map((r, i) => {
    const items = r.items.map(it => el('li', { class: it.passed ? 'ok' : 'no' },
      `${it.passed ? 'O' : 'X'} [${it.kind}] ${it.description} (${Math.round(it.rate * 100)}%)`));
    const frame = r.genToken
      ? el('iframe', { class: 'result-frame', src: `/render/gen/${r.genToken}`, sandbox: 'allow-scripts' })
      : null;
    return el('div', { class: 'result' },
      el('div', { class: 'rhead' },
        el('span', { class: 'rank' }, `#${i + 1}`),
        el('span', { class: 'ruser' }, r.username),
        el('span', { class: 'rtotal' }, `${Math.round(r.total * 100)}%`)),
      el('div', { class: 'rsub' }, `basic ${Math.round(r.basicScore * 100)}% · detail ${Math.round(r.detailScore * 100)}%`),
      el('ul', { class: 'ritems' }, ...items),
      ...(frame ? [frame] : []));
  });
  mount(app, el('div', { class: 'results-wrap' },
    el('h2', {}, 'Final Ranking'),
    ...rows,
    el('button', { onClick: () => state.bus.send({ type: 'RESTART' }) }, 'Restart')));
}
