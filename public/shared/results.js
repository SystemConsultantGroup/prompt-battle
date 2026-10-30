import { el, mount } from '/shared/dom.js';

const KIND_KO = { basic: '기본', detail: '디테일' };

/** 0..1 → "87.3". One decimal so close finishes read as different scores. */
const pts = (x) => (Math.round(x * 1000) / 10).toFixed(1);

/**
 * The final standings board. Host and players render the *same* screen — the
 * only differences are the restart control (host-only) and the badge marking
 * the viewer's own card, so everyone in the room is looking at identical
 * ranks, scores, prompts and renders.
 *
 * opts.showRestart — draw the "다시 시작" button (host).
 * opts.me          — username whose card gets the "나" badge (player).
 */
export function renderResults(app, state, opts = {}) {
  const { showRestart = false, me = null } = opts;
  const ranking = state.ranking ?? [];
  const tied = (r) => r.rank != null && ranking.filter(x => x.rank === r.rank).length > 1;
  const rows = ranking.map((r, i) => {
    const items = r.items.map(it => {
      const isPartial = it.rate > 0 && it.rate < 1;
      const cls = it.passed && !isPartial ? 'ok' : isPartial ? 'partial' : 'no';
      const icon = it.passed && !isPartial ? 'O' : isPartial ? '△' : 'X';
      // The grader's evidence ("gen #5b7cfa vs ref #4a6ae8") explains *why*
      // an item lost points. Text only — it echoes model output.
      const reason = (it.reason ?? '').trim();
      return el('li', { class: cls },
        `${icon} [${KIND_KO[it.kind] ?? it.kind}] ${it.description} (${Math.round(it.rate * 100)}%)`,
        ...(reason ? [el('span', { class: 'ritem-reason' }, reason)] : []));
    });
    const frame = r.genToken
      ? el('iframe', { class: 'result-frame', src: `/render/gen/${r.genToken}`, sandbox: 'allow-scripts' })
      : null;
    // The submitted prompt, so the room can see what actually earned the
    // score. Set as text (never innerHTML) — it is untrusted player input.
    const promptText = (r.prompt ?? '').trim();
    const prompt = el('div', { class: 'rprompt' },
      el('div', { class: 'rprompt-label' }, '작성한 프롬프트'),
      el('pre', { class: promptText ? '' : 'empty' }, promptText || '(작성 안 함)'));
    const isMine = me != null && r.username === me;
    return el('div', { class: isMine ? 'result mine' : 'result' },
      el('div', { class: 'rhead' },
        el('span', { class: 'rank' }, `${r.rank ?? i + 1}`),
        el('span', { class: 'ruser' }, r.username),
        ...(isMine ? [el('span', { class: 'rme' }, '나')] : []),
        el('span', { class: 'rtotal' }, `${pts(r.total)}점`)),
      el('div', { class: 'rsub' },
        `기본 ${pts(r.basicScore)} · 디테일 ${pts(r.detailScore)} · 정밀도 ${pts(r.fidelityScore ?? 0)}`
        + (tied(r) ? ' · 공동 순위' : '')),
      prompt,
      el('ul', { class: 'ritems' }, ...items),
      ...(frame ? [frame] : []));
  });
  mount(app, el('div', { class: 'results-wrap' },
    el('h2', {}, '최종 순위'),
    rows.length
      ? el('div', { class: 'results-row' }, ...rows)
      : el('div', { class: 'results-row' },
          el('div', { class: 'result' }, el('p', {}, '채점된 결과가 없습니다.'))),
    ...(showRestart
      ? [el('button', { onClick: () => state.bus.send({ type: 'RESTART' }) }, '다시 시작')]
      : [el('p', { class: 'eyebrow' }, '호스트가 다음 라운드를 시작할 때까지 기다려 주세요.')])));
}
