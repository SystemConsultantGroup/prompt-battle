import { el, mount } from '/shared/dom.js';
import { spinReel } from '/shared/roulette.js';

// Must stay in sync with TIME_LIMIT_OPTIONS in src/game/types.ts — the server
// rejects anything outside that set, so a drift here shows up as an error toast.
export const TIME_LIMITS = [30, 60, 90, 120, 150];

/**
 * The pre-game board, shared by host and players so the whole room watches the
 * same roulette spin and reads the same armed problem and round length. The
 * host passes the controls; players get the identical board with none, which
 * makes their copy read-only by construction rather than by disabling things
 * after the fact.
 *
 * view.onPickTime — omit to render the round-length chips read-only.
 * view.spin       — { pool, winnerId } to run the reel animation on mount.
 * view.controls   — host's problem-picking buttons, drawn above the reel.
 * view.footer     — host's start button, or the players' waiting note.
 */
export function renderLobbyBoard(app, view) {
  const {
    roomCode, players = [], problemTitle = null, problemId = null,
    timeLimitSec = null, onPickTime = null, controls = null,
    footer = null, spin = null,
  } = view;

  const info = el('div', {},
    el('p', { class: 'eyebrow' }, '방 코드'),
    el('div', { class: 'roomcode' }, roomCode ?? '----'),
    el('p', { class: 'eyebrow', style: 'margin-top:20px' }, `참가자 ${players.length}명`),
    players.length
      ? el('div', { class: 'modes' }, ...players.map(p => el('span', { class: 'chip' }, p.username)))
      : el('p', {}, '아직 아무도 안 들어왔습니다.'));

  const reel = el('div', { class: 'reel' });

  const timeBtns = TIME_LIMITS.map(sec => {
    const b = el('button', {
      class: timeLimitSec === sec ? 'on' : '',
      ...(onPickTime ? { onClick: () => onPickTime(sec) } : {}),
    }, `${sec}초`);
    // Read-only for players, and for a host who hasn't armed a problem yet
    // (picking one re-seeds the length and would discard an earlier choice).
    b.disabled = !onPickTime || problemId == null;
    return b;
  });

  const selection = problemId != null
    ? el('div', { class: 'selection' },
        `선택된 문제: ${problemTitle ?? `#${problemId}`} — 제한시간 ${timeLimitSec ?? '?'}초`)
    : el('div', { class: 'selection none' }, '아직 문제를 고르지 않았습니다.');

  mount(app, el('div', { class: 'card wide' }, info,
    ...(controls
      ? [el('p', { class: 'eyebrow', style: 'margin-top:20px' }, '문제 고르기'), controls]
      : []),
    reel,
    el('p', { class: 'eyebrow' }, '제한시간'),
    el('div', { class: 'timeopts' }, ...timeBtns),
    selection,
    ...(footer ? [footer] : [])));

  // Spin after mount so the reel has its real width to centre the winner on.
  if (spin) spinReel(reel, spin.pool, spin.winnerId, () => {});
  return reel;
}
