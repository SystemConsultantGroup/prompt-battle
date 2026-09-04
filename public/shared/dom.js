export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'onClick') node.addEventListener('click', v);
    else if (k === 'class') node.className = v;
    else if (k === 'value') node.value = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c?.nodeType ? c : String(c));
  return node;
}
export function mount(root, ...nodes) { root.replaceChildren(...nodes); }

// Countdown urgency → class name. Mirrors .timer.warn / .timer.danger in
// styles.css so the player editor and the host dashboard escalate together.
export function timerClass(remainingSec) {
  if (remainingSec == null) return 'timer';
  if (remainingSec <= 10) return 'timer danger';
  if (remainingSec <= 30) return 'timer warn';
  return 'timer';
}
export const timerText = (remainingSec) =>
  remainingSec == null ? '- -' : `${remainingSec}초`;
