import type { ProblemSeed } from '../types.ts';

// Shared body reset so the smaller components render centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const navigation: ProblemSeed[] = [
  {
    title: 'Top Navbar',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<nav class="navbar">
  <div class="brand">Acme</div>
  <div class="nav-links">
    <a href="#" class="link">Home</a>
    <a href="#" class="link">Products</a>
    <a href="#" class="link">Pricing</a>
    <a href="#" class="link">About</a>
  </div>
</nav>`,
    targetCss: `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}
.navbar{display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;padding:14px 32px;background:#fff;border-bottom:1px solid #e5e7eb}
.brand{font-size:20px;font-weight:700;color:#111827}
.nav-links{display:flex;gap:24px}
.link{color:#374151;text-decoration:none;font-size:15px}
.link:hover{color:#5b7cfa}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <nav> element contains a brand/logo and a set of links' },
      { kind: 'basic', description: '3 or 4 nav links are present' },
      { kind: 'basic', description: 'The brand sits on one side and the links are grouped on the other (e.g. justify-content:space-between)' },
      { kind: 'detail', description: 'The nav links have no underline (text-decoration:none)' },
      { kind: 'detail', description: 'A hover state changes the link color (:hover rule)' },
      { kind: 'detail', description: 'The navbar spans the full width of the page' },
    ],
  },
  {
    title: 'Tabs',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="tabs">
  <div class="tab-list" role="tablist">
    <button class="tab active" data-tab="1">Overview</button>
    <button class="tab" data-tab="2">Specs</button>
    <button class="tab" data-tab="3">Reviews</button>
  </div>
  <div class="panel" data-panel="1">Overview content goes here.</div>
  <div class="panel" data-panel="2" hidden>Specs content goes here.</div>
  <div class="panel" data-panel="3" hidden>Reviews content goes here.</div>
</div>`,
    targetCss: `${CENTER}
.tabs{width:320px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.tab-list{display:flex;border-bottom:1px solid #e5e7eb}
.tab{flex:1;background:transparent;border:0;padding:12px;font-size:14px;cursor:pointer;color:#6b7280}
.tab.active{color:#5b7cfa;border-bottom:2px solid #5b7cfa;font-weight:600}
.panel{padding:16px;font-size:14px;color:#374151}`,
    targetJs: `const tabs=document.querySelectorAll('.tab');
const panels=document.querySelectorAll('.panel');
tabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const id=tab.getAttribute('data-tab');
    panels.forEach(p=>{
      p.hidden = p.getAttribute('data-panel') !== id;
    });
  });
});`,
    criteria: [
      { kind: 'basic', description: 'Three tab buttons are present ("Overview", "Specs", "Reviews")' },
      { kind: 'basic', description: 'Three corresponding content panels exist, one per tab' },
      { kind: 'basic', description: 'Only one panel is visible at a time on load (the others hidden)' },
      { kind: 'basic', description: 'Clicking a tab shows its panel and hides the others' },
      { kind: 'detail', description: 'The active tab is visually distinct from inactive tabs (border/background/color/font-weight)' },
      { kind: 'detail', description: 'The first tab and panel are active by default before any click' },
    ],
  },
  {
    title: 'Breadcrumbs',
    category: 'navigation',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="#" class="crumb">Home</a>
  <span class="sep">/</span>
  <a href="#" class="crumb">Category</a>
  <span class="sep">/</span>
  <span class="crumb current" aria-current="page">Product</span>
</nav>`,
    targetCss: `${CENTER}
.breadcrumbs{display:flex;align-items:center;gap:8px;font-size:14px}
.crumb{color:#5b7cfa;text-decoration:none}
.crumb:hover{text-decoration:underline}
.crumb.current{color:#6b7280;font-weight:600}
.sep{color:#9ca3af}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A breadcrumb trail with "Home", "Category", and "Product" is present in order' },
      { kind: 'basic', description: 'Separators appear between each breadcrumb item' },
      { kind: 'basic', description: 'The last item ("Product") is plain text/span, not a clickable link' },
      { kind: 'detail', description: 'The last item is visually distinct from the earlier links (e.g. different color/weight)' },
      { kind: 'detail', description: 'The earlier crumbs ("Home", "Category") are anchor (<a>) links' },
    ],
  },
  {
    title: 'Pagination',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<nav class="pagination" aria-label="Pagination">
  <button class="page-btn">Prev</button>
  <button class="page-num">1</button>
  <button class="page-num active" aria-current="page">2</button>
  <button class="page-num">3</button>
  <button class="page-btn">Next</button>
</nav>`,
    targetCss: `${CENTER}
.pagination{display:flex;align-items:center;gap:6px}
.page-btn,.page-num{background:#fff;border:1px solid #d1d5db;color:#374151;padding:8px 12px;border-radius:6px;font-size:14px;cursor:pointer}
.page-num.active{background:#5b7cfa;border-color:#5b7cfa;color:#fff;font-weight:600}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'Prev and Next buttons are present' },
      { kind: 'basic', description: 'Page numbers 1, 2, and 3 are present' },
      { kind: 'basic', description: 'Page 2 is visually highlighted as the active/current page' },
      { kind: 'detail', description: 'The active page has a different background/border color from the inactive pages' },
      { kind: 'detail', description: 'The active page is marked with aria-current="page" (or equivalent)' },
    ],
  },
  {
    title: 'Sidebar Menu',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<nav class="sidebar" aria-label="Sidebar">
  <a href="#" class="item">
    <span class="icon">🏠</span> Dashboard
  </a>
  <a href="#" class="item active">
    <span class="icon">📁</span> Projects
  </a>
  <a href="#" class="item">
    <span class="icon">👥</span> Team
  </a>
  <a href="#" class="item">
    <span class="icon">⚙️</span> Settings
  </a>
</nav>`,
    targetCss: `${CENTER}
.sidebar{display:flex;flex-direction:column;width:200px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px;gap:2px}
.item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:6px;color:#374151;text-decoration:none;font-size:14px}
.item:hover{background:#f4f5f7}
.item.active{background:#eef1ff;color:#5b7cfa;font-weight:600}
.icon{font-size:16px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A vertical menu with exactly 4 items is present' },
      { kind: 'basic', description: 'Each item shows both an icon and a text label' },
      { kind: 'basic', description: 'One item ("Projects") is visually highlighted as active' },
      { kind: 'detail', description: 'The items are stacked vertically (flex-direction:column or block layout)' },
      { kind: 'detail', description: 'The active item’s background or text color differs from the other items' },
    ],
  },
  {
    title: 'Stepper',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="stepper">
  <div class="step completed">
    <div class="circle">✓</div>
    <div class="label">Account</div>
  </div>
  <div class="connector completed"></div>
  <div class="step current">
    <div class="circle">2</div>
    <div class="label">Shipping</div>
  </div>
  <div class="connector"></div>
  <div class="step">
    <div class="circle">3</div>
    <div class="label">Payment</div>
  </div>
</div>`,
    targetCss: `${CENTER}
.stepper{display:flex;align-items:flex-start}
.step{display:flex;flex-direction:column;align-items:center;gap:6px;width:88px}
.circle{width:32px;height:32px;border-radius:50%;background:#e5e7eb;color:#6b7280;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600}
.step.completed .circle{background:#22c55e;color:#fff}
.step.current .circle{background:#5b7cfa;color:#fff}
.label{font-size:13px;color:#6b7280}
.step.current .label{color:#111827;font-weight:600}
.connector{height:2px;background:#e5e7eb;width:40px;margin-top:16px}
.connector.completed{background:#22c55e}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'Three numbered steps are arranged horizontally' },
      { kind: 'basic', description: 'Step 1 is marked completed with a checkmark or other distinct completed style' },
      { kind: 'basic', description: 'Step 2 is marked as the current step, visually distinct from the others' },
      { kind: 'detail', description: 'A connector/line visually links the steps together' },
      { kind: 'detail', description: 'The completed step uses a different color from the current and upcoming steps' },
    ],
  },
  {
    title: 'Dropdown Menu',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="dropdown">
  <button class="dd-btn" id="ddBtn" aria-haspopup="true" aria-expanded="false">Options ▾</button>
  <div class="dd-menu" id="ddMenu" hidden>
    <a href="#" class="dd-item">Edit</a>
    <a href="#" class="dd-item">Duplicate</a>
    <a href="#" class="dd-item">Delete</a>
  </div>
</div>`,
    targetCss: `${CENTER}
.dropdown{position:relative;display:inline-block}
.dd-btn{background:#fff;border:1px solid #d1d5db;color:#374151;padding:10px 16px;border-radius:6px;font-size:14px;cursor:pointer}
.dd-menu{position:absolute;top:calc(100% + 4px);left:0;min-width:140px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.12);overflow:hidden}
.dd-item{display:block;padding:10px 14px;color:#374151;text-decoration:none;font-size:14px}
.dd-item:hover{background:#f4f5f7}`,
    targetJs: `const btn=document.getElementById('ddBtn');
const menu=document.getElementById('ddMenu');
btn.addEventListener('click',()=>{
  const open=!menu.hidden;
  menu.hidden=open;
  btn.setAttribute('aria-expanded', String(!open));
});`,
    criteria: [
      { kind: 'basic', description: 'A button toggles a menu of exactly 3 items' },
      { kind: 'basic', description: 'The menu is hidden by default before any interaction' },
      { kind: 'basic', description: 'Clicking the button shows the menu; clicking it again hides the menu' },
      { kind: 'detail', description: 'The button’s aria-expanded attribute reflects the open/closed state' },
      { kind: 'detail', description: 'The menu is positioned relative to the button (e.g. position:absolute inside a position:relative wrapper)' },
    ],
  },
];
