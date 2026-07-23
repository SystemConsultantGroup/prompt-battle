import { el, mount } from '/shared/dom.js';

// Renders a horizontal reel of problem cards, scrolls fast then eases to the winner.
export function spinReel(container, pool, winnerId, onDone) {
  const cards = [];
  // repeat pool several times so the reel has length to scroll through
  const strip = el('div', { class: 'reel-strip' });
  const REPEAT = 8;
  for (let r = 0; r < REPEAT; r++) {
    for (const p of pool) {
      const c = el('div', { class: 'reel-card' }, p.title);
      cards.push({ el: c, id: p.id, rep: r });
      strip.append(c);
    }
  }
  mount(container, strip);
  // target: a winner card near the end of the strip
  const target = cards.find(c => c.id === winnerId && c.rep === REPEAT - 2);
  if (!target) { onDone?.(); return; }
  const cardW = 180; // must match CSS width + gap
  const targetX = target.el.offsetLeft - (container.clientWidth / 2 - cardW / 2);
  const start = performance.now();
  const duration = 3200;
  function frame(t) {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    strip.style.transform = `translateX(${-eased * targetX}px)`;
    if (p < 1) requestAnimationFrame(frame);
    else { target.el.classList.add('reel-win'); onDone?.(); }
  }
  requestAnimationFrame(frame);
}
