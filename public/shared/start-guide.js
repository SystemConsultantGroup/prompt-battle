import { el } from '/shared/dom.js';

// Keep the guide outside #app so timer/mirror updates cannot restart it or
// remount the editor. Only GAME_START calls show; reconnects never replay it.
export function createStartGuide(root = document.body) {
  let guide = null;
  let timeout = null;

  function hide() {
    clearTimeout(timeout);
    timeout = null;
    guide?.remove();
    guide = null;
  }

  function show() {
    hide();
    guide = el('div', { class: 'start-guide', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
      el('div', { class: 'start-guide-panel' },
        el('div', { class: 'start-guide-icons', 'aria-hidden': 'true' }),
        el('p', { class: 'start-guide-label' }, '게임 시작!'),
        el('p', { class: 'start-guide-message' }, '왼쪽의 웹페이지를 보고, 프롬프트를 써서 똑같이 만들어보세요!')));
    root.append(guide);
    timeout = setTimeout(hide, 3000);
  }

  return { show, hide };
}
