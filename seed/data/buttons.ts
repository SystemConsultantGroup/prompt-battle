import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const buttons: ProblemSeed[] = [
  {
    title: 'Primary Button',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<button class="btn">Get Started</button>`,
    targetCss: `${CENTER}
.btn{background:#5b7cfa;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:background .15s}
.btn:hover{background:#4a6ae8}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <button> element is present' },
      { kind: 'basic', description: 'The button text reads "Get Started"' },
      { kind: 'basic', description: 'The button has a solid (non-transparent) background color' },
      { kind: 'basic', description: 'The button has horizontal and vertical padding' },
      { kind: 'detail', description: 'The button has rounded corners (border-radius)' },
      { kind: 'detail', description: 'A hover state changes the button appearance (:hover rule)' },
      { kind: 'detail', description: 'The button text uses a bold / 600+ font weight' },
    ],
  },
  {
    title: 'Icon Button',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<button class="icon-btn" aria-label="Add">
  <span class="icon">+</span>
  <span>Add item</span>
</button>`,
    targetCss: `${CENTER}
.icon-btn{display:inline-flex;align-items:center;gap:8px;background:#111827;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:15px;cursor:pointer}
.icon{font-size:20px;line-height:1}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <button> contains both an icon/symbol and a text label' },
      { kind: 'basic', description: 'The label text reads "Add item"' },
      { kind: 'basic', description: 'The icon and label sit on the same horizontal line' },
      { kind: 'detail', description: 'There is spacing/gap between the icon and the label' },
      { kind: 'detail', description: 'The button uses inline-flex (or flin) with vertical centering (align-items)' },
      { kind: 'detail', description: 'The button has an aria-label or otherwise accessible name' },
    ],
  },
  {
    title: 'Button Group (Segmented)',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="group" role="group">
  <button class="seg active">Day</button>
  <button class="seg">Week</button>
  <button class="seg">Month</button>
</div>`,
    targetCss: `${CENTER}
.group{display:inline-flex;border:1px solid #d1d5db;border-radius:8px;overflow:hidden}
.seg{background:#fff;border:0;border-right:1px solid #d1d5db;padding:8px 18px;font-size:14px;cursor:pointer}
.seg:last-child{border-right:0}
.seg.active{background:#5b7cfa;color:#fff}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'Three buttons labelled "Day", "Week", and "Month" are present' },
      { kind: 'basic', description: 'The three buttons are joined side-by-side as one segmented control' },
      { kind: 'basic', description: 'One button (the first, "Day") is visually highlighted as active' },
      { kind: 'detail', description: 'The active button has a different background from the inactive ones' },
      { kind: 'detail', description: 'The group has a shared rounded outer border' },
      { kind: 'detail', description: 'Dividers separate adjacent buttons (border between segments)' },
    ],
  },
  {
    title: 'Toggle Button',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<button class="toggle" id="tg" aria-pressed="false">
  <span class="dot"></span> Notifications off
</button>`,
    targetCss: `${CENTER}
.toggle{display:inline-flex;align-items:center;gap:10px;background:#e5e7eb;color:#374151;border:0;padding:10px 18px;border-radius:999px;font-size:14px;cursor:pointer}
.toggle[aria-pressed="true"]{background:#dcfce7;color:#166534}
.dot{width:10px;height:10px;border-radius:50%;background:#9ca3af}
.toggle[aria-pressed="true"] .dot{background:#22c55e}`,
    targetJs: `const t=document.getElementById('tg');
t.addEventListener('click',()=>{
  const on=t.getAttribute('aria-pressed')==='true';
  t.setAttribute('aria-pressed', String(!on));
  t.lastChild.textContent = on ? ' Notifications off' : ' Notifications on';
});`,
    criteria: [
      { kind: 'basic', description: 'A single toggle button is present with a status dot and a text label' },
      { kind: 'basic', description: 'Clicking the button flips it between an on and off state' },
      { kind: 'basic', description: 'The label text switches between "Notifications off" and "Notifications on"' },
      { kind: 'detail', description: 'The button background/color changes between the on and off states' },
      { kind: 'detail', description: 'The status dot changes color between states' },
      { kind: 'detail', description: 'The pressed state is reflected via aria-pressed' },
    ],
  },
  {
    title: 'Floating Action Button',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<button class="fab" aria-label="Compose">+</button>`,
    targetCss: `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,sans-serif}
.fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:0;background:#ef4444;color:#fff;font-size:28px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25)}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A round button with a "+" symbol is present' },
      { kind: 'basic', description: 'The button is a perfect circle (equal width/height, 50% radius)' },
      { kind: 'basic', description: 'The button is pinned to a bottom corner of the screen (fixed/absolute position)' },
      { kind: 'detail', description: 'The button casts a drop shadow (box-shadow)' },
      { kind: 'detail', description: 'The button uses a distinct accent background color' },
      { kind: 'detail', description: 'The button has an accessible label (aria-label)' },
    ],
  },
  {
    title: 'Loading Button',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<button class="btn" disabled>
  <span class="spinner"></span> Saving…
</button>`,
    targetCss: `${CENTER}
.btn{display:inline-flex;align-items:center;gap:10px;background:#5b7cfa;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-size:15px;opacity:.85;cursor:not-allowed}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A button contains a spinner and the text "Saving…"' },
      { kind: 'basic', description: 'The button is disabled' },
      { kind: 'basic', description: 'A circular spinner element is present next to the text' },
      { kind: 'detail', description: 'The spinner rotates via a CSS animation (@keyframes + animation)' },
      { kind: 'detail', description: 'The disabled button is visually dimmed (reduced opacity)' },
      { kind: 'detail', description: 'The cursor indicates a non-interactive state (cursor:not-allowed)' },
    ],
  },
  {
    title: 'Link Button (Ghost)',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<button class="ghost">Learn more →</button>`,
    targetCss: `${CENTER}
.ghost{background:transparent;color:#5b7cfa;border:1px solid #5b7cfa;padding:10px 20px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s}
.ghost:hover{background:#5b7cfa;color:#fff}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A button with the text "Learn more" and an arrow is present' },
      { kind: 'basic', description: 'The button has a transparent/no fill background by default' },
      { kind: 'basic', description: 'The button has a colored outline/border' },
      { kind: 'detail', description: 'On hover the button fills with the accent color (:hover rule)' },
      { kind: 'detail', description: 'The border color matches the text color' },
      { kind: 'detail', description: 'The button has rounded corners' },
    ],
  },
];
