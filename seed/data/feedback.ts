import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const feedback: ProblemSeed[] = [
  {
    title: 'Alert Banner',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="banner" id="banner" role="alert">
  <span class="icon">⚠</span>
  <span class="msg">Your session will expire in 5 minutes.</span>
  <button class="dismiss" id="dismiss" aria-label="Dismiss">×</button>
</div>`,
    targetCss: `${CENTER}
.banner{display:flex;align-items:center;gap:12px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;max-width:420px}
.icon{font-size:18px}
.msg{flex:1;font-size:14px}
.dismiss{background:transparent;border:0;font-size:18px;line-height:1;color:#92400e;cursor:pointer;padding:0 4px}`,
    targetJs: `const dismiss=document.getElementById('dismiss');
dismiss.addEventListener('click',()=>{
  document.getElementById('banner').style.display='none';
});`,
    criteria: [
      { kind: 'basic', description: 'A banner element containing an icon, a message, and a dismiss "×" button is present' },
      { kind: 'basic', description: 'The message text reads "Your session will expire in 5 minutes."' },
      { kind: 'basic', description: 'Clicking the dismiss button hides or removes the banner' },
      { kind: 'basic', description: 'The banner has a solid warning-colored (non-white) background' },
      { kind: 'detail', description: 'The banner content is laid out on one row with flex and a gap between icon, message, and button' },
      { kind: 'detail', description: 'The dismiss button has an aria-label or otherwise accessible name' },
      { kind: 'detail', description: 'The banner has rounded corners (border-radius)' },
    ],
  },
  {
    title: 'Notification Badge',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="bell-wrap">
  <span class="bell">🔔</span>
  <span class="badge">3</span>
</div>`,
    targetCss: `${CENTER}
.bell-wrap{position:relative;display:inline-flex}
.bell{font-size:32px}
.badge{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A bell (or similar) icon is present' },
      { kind: 'basic', description: 'A small badge bubble showing the count "3" is present' },
      { kind: 'basic', description: 'The badge is positioned at a corner of the icon using absolute positioning' },
      { kind: 'detail', description: 'The badge has a red/accent solid background color' },
      { kind: 'detail', description: 'The badge is pill/circle-shaped (border-radius roughly half its height)' },
      { kind: 'detail', description: 'The badge text is centered within the bubble (flex align/justify center)' },
    ],
  },
  {
    title: 'Toast Notification',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="toast">
  <span class="icon">✓</span>
  <span class="msg">Changes saved successfully</span>
</div>`,
    targetCss: `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}
.toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.25);font-size:14px}
.icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#22c55e;color:#fff;font-size:12px;font-weight:700}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A toast element contains a success icon and the message "Changes saved successfully"' },
      { kind: 'basic', description: 'The toast floats near the bottom of the screen (position:fixed)' },
      { kind: 'basic', description: 'The toast has a solid background color distinct from the page background' },
      { kind: 'detail', description: 'The toast casts a drop shadow (box-shadow)' },
      { kind: 'detail', description: 'The success icon is a filled circle with a green/accent background' },
      { kind: 'detail', description: 'The icon and message are aligned horizontally using flex with a gap' },
    ],
  },
  {
    title: 'Progress Bar',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="progress-wrap">
  <div class="progress" role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">
    <div class="fill" style="width:65%"></div>
  </div>
  <span class="label">65%</span>
</div>`,
    targetCss: `${CENTER}
.progress-wrap{width:280px}
.progress{background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden}
.fill{height:100%;background:#5b7cfa;border-radius:999px}
.label{display:block;margin-top:6px;font-size:13px;color:#374151;text-align:right}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A track element containing a filled inner bar is present' },
      { kind: 'basic', description: 'The fill width is approximately 65% of the track width' },
      { kind: 'basic', description: 'A text label showing "65%" is displayed' },
      { kind: 'detail', description: 'The progress element uses role="progressbar" with aria-valuenow reflecting 65' },
      { kind: 'detail', description: 'The track has fully rounded corners (border-radius)' },
      { kind: 'detail', description: 'The fill uses an accent color distinct from the track background' },
    ],
  },
  {
    title: 'Spinner / Loader',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="spinner"></div>`,
    targetCss: `${CENTER}
.spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#5b7cfa;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A circular spinner element is present' },
      { kind: 'basic', description: 'The spinner is centered on the page' },
      { kind: 'basic', description: 'The spinner rotates continuously via a CSS animation (@keyframes + animation)' },
      { kind: 'detail', description: 'The animation is linear and set to repeat infinitely' },
      { kind: 'detail', description: 'The spinner is a perfect circle (equal width/height, 50% border-radius)' },
      { kind: 'detail', description: 'One border edge (e.g. border-top-color) is a different color than the rest, so rotation is visible' },
    ],
  },
  {
    title: 'Tooltip on Hover',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="tip-wrap">
  <button class="trigger">Hover me</button>
  <span class="tooltip">Copies the link to your clipboard</span>
</div>`,
    targetCss: `${CENTER}
.tip-wrap{position:relative;display:inline-block}
.trigger{background:#5b7cfa;color:#fff;border:0;padding:10px 20px;border-radius:8px;font-size:15px;cursor:pointer}
.tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#111827;color:#fff;font-size:12px;padding:6px 10px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s}
.tip-wrap:hover .tooltip{opacity:1}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A trigger element and a tooltip bubble with descriptive text are both present' },
      { kind: 'basic', description: 'The tooltip is hidden by default (opacity:0 or similar) without interaction' },
      { kind: 'basic', description: 'The tooltip becomes visible when hovering the trigger, via a :hover CSS rule' },
      { kind: 'detail', description: 'The tooltip is positioned above the trigger using absolute positioning' },
      { kind: 'detail', description: 'The tooltip visibility change uses a CSS transition on opacity rather than an abrupt jump' },
      { kind: 'detail', description: 'The tooltip has a dark background that contrasts with the light page background' },
    ],
  },
  {
    title: 'Empty State',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="empty">
  <div class="icon">🗂️</div>
  <h2>No results found</h2>
  <p>Try adjusting your filters or search terms.</p>
  <button class="btn">Clear filters</button>
</div>`,
    targetCss: `${CENTER}
.empty{text-align:center;max-width:320px;padding:32px;background:#fff;border-radius:12px}
.icon{font-size:40px;margin-bottom:12px}
h2{margin:0 0 8px;font-size:18px;color:#111827}
p{margin:0 0 20px;font-size:14px;color:#6b7280}
.btn{background:#5b7cfa;color:#fff;border:0;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'An icon, a heading, subtext, and a button are all present in one card' },
      { kind: 'basic', description: 'The heading reads "No results found"' },
      { kind: 'basic', description: 'A button with a call-to-action label (e.g. "Clear filters") is present' },
      { kind: 'detail', description: 'The card content is center-aligned (text-align:center)' },
      { kind: 'detail', description: 'The heading and subtext use visually distinct font sizes/colors for hierarchy' },
      { kind: 'detail', description: 'The card has padding and rounded corners (border-radius)' },
    ],
  },
];
