import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const overlays: ProblemSeed[] = [
  {
    title: 'Modal Dialog',
    category: 'overlays',
    difficulty: 'hard',
    timeLimitSec: 420,
    targetHtml: `<button id="openBtn" class="open-btn">Open</button>
<div class="overlay" id="overlay">
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="close-btn" id="closeBtn" aria-label="Close">&times;</button>
    </div>
    <p class="modal-body">This is the modal content.</p>
  </div>
</div>`,
    targetCss: `${CENTER}
.open-btn{background:#5b7cfa;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer}
.overlay{display:none;position:fixed;inset:0;background:rgba(17,24,39,.5);align-items:center;justify-content:center}
.overlay.open{display:flex}
.modal{background:#fff;border-radius:12px;padding:24px;width:320px;box-shadow:0 20px 40px rgba(0,0,0,.25)}
.modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.modal-header h2{margin:0;font-size:18px}
.close-btn{background:transparent;border:0;font-size:22px;line-height:1;cursor:pointer;color:#6b7280}
.modal-body{margin:0;color:#374151;font-size:14px}`,
    targetJs: `const openBtn=document.getElementById('openBtn');
const overlay=document.getElementById('overlay');
const closeBtn=document.getElementById('closeBtn');
openBtn.addEventListener('click',()=>{
  overlay.classList.add('open');
});
closeBtn.addEventListener('click',()=>{
  overlay.classList.remove('open');
});
overlay.addEventListener('click',(e)=>{
  if(e.target===overlay){ overlay.classList.remove('open'); }
});`,
    criteria: [
      { kind: 'basic', description: 'An "Open" button element is present' },
      { kind: 'basic', description: 'A modal container with a title and a close button exists' },
      { kind: 'basic', description: 'The modal is hidden by default on page load (e.g. display:none or missing an "open"/visible class)' },
      { kind: 'basic', description: 'Clicking the Open button reveals the modal (adds a class or changes display so it becomes visible)' },
      { kind: 'detail', description: 'Clicking the close button hides the modal again' },
      { kind: 'detail', description: 'A backdrop/overlay layer covers the page behind the modal' },
      { kind: 'detail', description: 'Clicking the backdrop (outside the modal box) also closes the modal' },
    ],
  },
  {
    title: 'Accordion',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="accordion">
  <div class="item">
    <button class="header">Section One</button>
    <div class="panel"><p>Content for section one.</p></div>
  </div>
  <div class="item">
    <button class="header">Section Two</button>
    <div class="panel"><p>Content for section two.</p></div>
  </div>
  <div class="item">
    <button class="header">Section Three</button>
    <div class="panel"><p>Content for section three.</p></div>
  </div>
</div>`,
    targetCss: `${CENTER}
.accordion{width:320px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.item{border-bottom:1px solid #e5e7eb}
.item:last-child{border-bottom:0}
.header{width:100%;text-align:left;background:#fff;border:0;padding:14px 16px;font-size:15px;cursor:pointer}
.header:hover{background:#f9fafb}
.panel{max-height:0;overflow:hidden;transition:max-height .2s ease;background:#fafafa}
.panel p{margin:0;padding:0 16px 14px}
.item.open .panel{max-height:200px}`,
    targetJs: `document.querySelectorAll('.header').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.parentElement.classList.toggle('open');
  });
});`,
    criteria: [
      { kind: 'basic', description: 'Three section headers are present, reading "Section One", "Section Two", and "Section Three"' },
      { kind: 'basic', description: 'Each header has an associated content panel' },
      { kind: 'basic', description: 'All panels are collapsed on initial load, before any click' },
      { kind: 'detail', description: 'Collapsed panels are hidden via a measurable style (max-height:0 or display:none), not just visually covered' },
      { kind: 'detail', description: 'Clicking a header expands only that section’s panel via a per-item class toggle (e.g. "open")' },
      { kind: 'detail', description: 'A transition/animation smooths the expand (a transition property on the panel)' },
    ],
  },
  {
    title: 'Star Rating',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="rating" id="rating">
  <span class="star" data-value="1">&#9733;</span>
  <span class="star" data-value="2">&#9733;</span>
  <span class="star" data-value="3">&#9733;</span>
  <span class="star" data-value="4">&#9733;</span>
  <span class="star" data-value="5">&#9733;</span>
</div>`,
    targetCss: `${CENTER}
.rating{display:flex;gap:4px;font-size:32px}
.star{color:#d1d5db;cursor:pointer;transition:color .1s}
.star.filled{color:#f59e0b}`,
    targetJs: `const stars=document.querySelectorAll('.star');
stars.forEach(star=>{
  star.addEventListener('click',()=>{
    const value=Number(star.dataset.value);
    stars.forEach(s=>{
      s.classList.toggle('filled', Number(s.dataset.value)<=value);
    });
  });
});`,
    criteria: [
      { kind: 'basic', description: 'Five star elements are present' },
      { kind: 'basic', description: 'Clicking star N fills that star and all stars before it (1..N)' },
      { kind: 'basic', description: 'Unfilled stars use a muted/gray color while filled stars use a distinct accent color' },
      { kind: 'detail', description: 'Filled state is tracked via a class (e.g. "filled") toggled on click, not just inline styles set once' },
      { kind: 'detail', description: 'Clicking a lower star after a higher one un-fills the stars after it (the rating can decrease)' },
      { kind: 'detail', description: 'Stars are laid out in a horizontal row with spacing between them (flex + gap)' },
    ],
  },
  {
    title: 'Range Slider',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="slider-wrap">
  <input type="range" id="slider" min="0" max="100" value="50">
  <div class="value-label" id="valueLabel">50</div>
</div>`,
    targetCss: `${CENTER}
.slider-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;width:280px}
#slider{width:100%}
.value-label{font-size:20px;font-weight:600;color:#111827}`,
    targetJs: `const slider=document.getElementById('slider');
const label=document.getElementById('valueLabel');
slider.addEventListener('input',()=>{
  label.textContent = slider.value;
});`,
    criteria: [
      { kind: 'basic', description: 'A native <input type="range"> element is present' },
      { kind: 'basic', description: 'A separate label element displays the current numeric value' },
      { kind: 'basic', description: "The label's initial text matches the slider's initial value" },
      { kind: 'basic', description: 'The slider has min and max attributes defining its range' },
      { kind: 'detail', description: "The label updates live as the slider moves, bound to the slider's input event" },
      { kind: 'detail', description: 'The slider and label are visually grouped together (e.g. a flex column with gap)' },
    ],
  },
  {
    title: 'Carousel Dots',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="carousel">
  <div class="slide" id="slide">Slide 1</div>
  <div class="dots">
    <button class="dot active" data-index="0"></button>
    <button class="dot" data-index="1"></button>
    <button class="dot" data-index="2"></button>
    <button class="dot" data-index="3"></button>
  </div>
</div>`,
    targetCss: `${CENTER}
.carousel{width:280px;display:flex;flex-direction:column;align-items:center;gap:14px}
.slide{width:100%;height:140px;background:#5b7cfa;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:18px}
.dots{display:flex;gap:8px}
.dot{width:10px;height:10px;border-radius:50%;border:0;background:#d1d5db;cursor:pointer;padding:0}
.dot.active{background:#5b7cfa}`,
    targetJs: `const dots=document.querySelectorAll('.dot');
const slide=document.getElementById('slide');
dots.forEach(dot=>{
  dot.addEventListener('click',()=>{
    dots.forEach(d=>d.classList.remove('active'));
    dot.classList.add('active');
    slide.textContent = 'Slide ' + (Number(dot.dataset.index)+1);
  });
});`,
    criteria: [
      { kind: 'basic', description: 'A slide area and four indicator dots are present' },
      { kind: 'basic', description: 'Exactly one dot is marked active at a time, the first one initially' },
      { kind: 'basic', description: 'Clicking a dot marks it active and removes the active state from the other dots' },
      { kind: 'detail', description: 'The active dot has a visually distinct fill color from inactive dots' },
      { kind: 'detail', description: 'Dots are circular (border-radius 50%) and arranged in a row' },
      { kind: 'detail', description: 'Clicking a dot updates the visible slide content/label to match it' },
    ],
  },
  {
    title: 'Quantity Stepper',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="stepper">
  <button class="step-btn" id="dec" aria-label="Decrease">−</button>
  <span class="qty" id="qty">0</span>
  <button class="step-btn" id="inc" aria-label="Increase">+</button>
</div>`,
    targetCss: `${CENTER}
.stepper{display:flex;align-items:center;border:1px solid #d1d5db;border-radius:8px;overflow:hidden}
.step-btn{width:36px;height:36px;border:0;background:#fff;font-size:18px;cursor:pointer}
.step-btn:hover{background:#f3f4f6}
.qty{min-width:40px;text-align:center;font-size:16px;font-weight:600}`,
    targetJs: `let count=0;
const qty=document.getElementById('qty');
document.getElementById('inc').addEventListener('click',()=>{
  count++;
  qty.textContent = count;
});
document.getElementById('dec').addEventListener('click',()=>{
  count = Math.max(0, count-1);
  qty.textContent = count;
});`,
    criteria: [
      { kind: 'basic', description: 'A minus button, a numeric value, and a plus button are present' },
      { kind: 'basic', description: 'The quantity starts at 0' },
      { kind: 'basic', description: 'Clicking the plus button increases the displayed quantity by one' },
      { kind: 'basic', description: 'Clicking the minus button decreases the displayed quantity by one' },
      { kind: 'detail', description: 'The quantity does not go below 0 when the minus button is clicked repeatedly' },
      { kind: 'detail', description: 'The three controls are joined into a single grouped control (shared border/rounded container)' },
    ],
  },
  {
    title: 'Popover Menu',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="popover-wrap">
  <button class="trigger" id="trigger">Actions ▾</button>
  <div class="popover" id="popover">
    <button class="action">Edit</button>
    <button class="action">Duplicate</button>
    <button class="action">Delete</button>
  </div>
</div>`,
    targetCss: `${CENTER}
.popover-wrap{position:relative;display:inline-block}
.trigger{background:#fff;border:1px solid #d1d5db;padding:10px 16px;border-radius:8px;font-size:14px;cursor:pointer}
.popover{display:none;position:absolute;top:calc(100% + 6px);left:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.15);min-width:140px;flex-direction:column;padding:4px}
.popover.open{display:flex}
.action{background:transparent;border:0;text-align:left;padding:8px 10px;font-size:14px;border-radius:6px;cursor:pointer}
.action:hover{background:#f3f4f6}`,
    targetJs: `const trigger=document.getElementById('trigger');
const popover=document.getElementById('popover');
trigger.addEventListener('click',(e)=>{
  e.stopPropagation();
  popover.classList.toggle('open');
});
document.addEventListener('click',(e)=>{
  if(!popover.contains(e.target) && e.target!==trigger){
    popover.classList.remove('open');
  }
});`,
    criteria: [
      { kind: 'basic', description: 'A trigger button and a popover containing three action items are present' },
      { kind: 'basic', description: 'The popover is hidden by default' },
      { kind: 'basic', description: 'Clicking the trigger button toggles the popover open' },
      { kind: 'detail', description: 'The popover is positioned relative to the trigger (position:absolute within a relatively positioned wrapper)' },
      { kind: 'detail', description: 'The popover has a visible container style (border and/or shadow) distinguishing it from the page' },
      { kind: 'detail', description: 'Clicking outside the popover closes it' },
    ],
  },
];
