import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const dataDisplay: ProblemSeed[] = [
  {
    title: 'Profile Card',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="card">
  <div class="avatar">JD</div>
  <div class="name">Jane Doe</div>
  <div class="role">Product Designer</div>
  <button class="follow">Follow</button>
</div>`,
    targetCss: `${CENTER}
.card{background:#fff;border-radius:12px;padding:28px 24px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.08);width:220px}
.avatar{width:64px;height:64px;border-radius:50%;background:#5b7cfa;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;margin:0 auto 14px}
.name{font-size:17px;font-weight:600;color:#111827}
.role{font-size:13px;color:#6b7280;margin-top:2px}
.follow{margin-top:16px;background:#5b7cfa;color:#fff;border:0;padding:8px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'Initials "JD" appear inside a circular avatar' },
      { kind: 'basic', description: 'The name "Jane Doe" and role "Product Designer" are both shown' },
      { kind: 'basic', description: 'A "Follow" button is present' },
      { kind: 'detail', description: 'The avatar has border-radius:50% making it circular' },
      { kind: 'detail', description: 'The card is a distinct container with a background and box-shadow' },
      { kind: 'detail', description: 'The name and role/subtitle are visually differentiated (different font-size or color)' },
    ],
  },
  {
    title: 'Product Card',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="card">
  <div class="image"></div>
  <div class="title">Wireless Headphones</div>
  <div class="price">$89.00</div>
  <button class="add">Add to cart</button>
</div>`,
    targetCss: `${CENTER}
.card{background:#fff;border-radius:12px;overflow:hidden;width:220px;box-shadow:0 2px 10px rgba(0,0,0,.08)}
.image{height:140px;background:#a5b4fc}
.title{font-size:15px;font-weight:600;color:#111827;padding:14px 16px 0}
.price{font-size:14px;color:#6b7280;padding:4px 16px 0}
.add{display:block;width:calc(100% - 32px);margin:14px 16px 16px;background:#111827;color:#fff;border:0;padding:10px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A colored block represents the product image area (no real <img>)' },
      { kind: 'basic', description: 'The product title "Wireless Headphones" and a price "$89.00" are shown' },
      { kind: 'basic', description: 'An "Add to cart" button is present' },
      { kind: 'detail', description: 'The image block has a fixed height forming a rectangle above the text' },
      { kind: 'detail', description: 'The card has rounded corners and a shadow grouping it as one unit' },
      { kind: 'detail', description: 'The price and title are visually separated (different font-size or color)' },
    ],
  },
  {
    title: 'Avatar with Status',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="avatar-wrap">
  <div class="avatar">AK</div>
  <span class="status"></span>
</div>`,
    targetCss: `${CENTER}
.avatar-wrap{position:relative;width:56px;height:56px}
.avatar{width:56px;height:56px;border-radius:50%;background:#f59e0b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600}
.status{position:absolute;right:2px;bottom:2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A circular avatar with initials "AK" is present' },
      { kind: 'basic', description: 'A small status dot is present on/over the avatar' },
      { kind: 'basic', description: 'The status dot is styled with a green background color' },
      { kind: 'detail', description: 'The avatar uses border-radius:50% to form a circle' },
      { kind: 'detail', description: 'The status dot is absolutely positioned at a corner of the avatar' },
      { kind: 'detail', description: 'The status dot has a border/outline separating it from the avatar' },
    ],
  },
  {
    title: 'Stat / KPI Tile',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="tile">
  <div class="label">Revenue</div>
  <div class="value">$48.2k</div>
  <div class="delta">+12%</div>
</div>`,
    targetCss: `${CENTER}
.tile{background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 2px 10px rgba(0,0,0,.08);width:180px}
.label{font-size:13px;color:#6b7280}
.value{font-size:32px;font-weight:700;color:#111827;margin-top:6px}
.delta{display:inline-block;margin-top:8px;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A label "Revenue" and a large value "$48.2k" are shown' },
      { kind: 'basic', description: 'A "+12%" delta indicator is present' },
      { kind: 'basic', description: 'The delta text is styled with green coloring (text and/or background)' },
      { kind: 'detail', description: 'The value uses a noticeably larger font-size than the label (28px or greater)' },
      { kind: 'detail', description: 'The delta is set apart as a small rounded badge/pill' },
      { kind: 'detail', description: 'The label appears above the value, and the value above the delta, in reading order' },
    ],
  },
  {
    title: 'List Item with Meta',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="item">
  <div class="avatar">RS</div>
  <div class="text">
    <div class="title">Rachel Simmons</div>
    <div class="subtitle">Commented on your post</div>
  </div>
  <div class="meta">2h ago</div>
</div>`,
    targetCss: `${CENTER}
.item{display:flex;align-items:center;background:#fff;border-radius:12px;padding:12px 16px;box-shadow:0 2px 10px rgba(0,0,0,.08);width:320px;gap:12px}
.avatar{width:40px;height:40px;border-radius:50%;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0}
.text{flex:1;min-width:0}
.title{font-size:14px;font-weight:600;color:#111827}
.subtitle{font-size:12px;color:#6b7280;margin-top:2px}
.meta{font-size:12px;color:#9ca3af;flex-shrink:0}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A leading circular avatar with initials is present' },
      { kind: 'basic', description: 'A title "Rachel Simmons" and subtitle "Commented on your post" are shown' },
      { kind: 'basic', description: 'A trailing meta/time text "2h ago" is shown at the end of the row' },
      { kind: 'detail', description: 'The row uses a flex layout placing avatar, text, and meta horizontally' },
      { kind: 'detail', description: 'The avatar is circular (border-radius:50%)' },
      { kind: 'detail', description: 'The title and subtitle are visually differentiated (different font-size, weight, or color)' },
    ],
  },
  {
    title: 'Simple Data Table',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<table class="table">
  <thead>
    <tr><th>Name</th><th>Role</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice Kim</td><td>Engineer</td><td><span class="badge active">Active</span></td></tr>
    <tr><td>Ben Ortiz</td><td>Designer</td><td><span class="badge active">Active</span></td></tr>
    <tr><td>Casey Lin</td><td>Manager</td><td><span class="badge inactive">Invited</span></td></tr>
  </tbody>
</table>`,
    targetCss: `${CENTER}
.table{border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);width:420px}
.table th{text-align:left;font-size:12px;color:#6b7280;background:#f9fafb;padding:10px 16px;border-bottom:1px solid #e5e7eb}
.table td{padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f3f4f6}
.table tr:last-child td{border-bottom:0}
.badge{font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px}
.badge.active{background:#dcfce7;color:#166534}
.badge.inactive{background:#fef3c7;color:#92400e}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <table> with a header row containing "Name", "Role", and "Status" is present' },
      { kind: 'basic', description: 'The table body has exactly 3 data rows' },
      { kind: 'basic', description: 'Each row shows a name, a role, and a status value' },
      { kind: 'detail', description: 'The status values are styled as rounded badges/pills' },
      { kind: 'detail', description: 'The header row is visually distinguished from body rows (background color and/or bold text)' },
      { kind: 'detail', description: 'Rows are separated by borders/dividers (border-bottom on cells or rows)' },
    ],
  },
  {
    title: 'Tag / Chip List',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="chips">
  <span class="chip">Design</span>
  <span class="chip">Frontend</span>
  <span class="chip">Remote</span>
  <span class="chip removable">Urgent <button class="remove" aria-label="Remove tag">×</button></span>
</div>`,
    targetCss: `${CENTER}
.chips{display:flex;flex-wrap:wrap;gap:8px;width:280px}
.chip{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;color:#4338ca;font-size:13px;font-weight:500;padding:6px 14px;border-radius:999px}
.remove{background:transparent;border:0;color:#4338ca;font-size:14px;line-height:1;cursor:pointer;padding:0}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'At least 3 chip/tag elements with a rounded pill shape (border-radius 999px or similar) are present' },
      { kind: 'basic', description: 'The chip labels include "Design", "Frontend", and "Remote"' },
      { kind: 'basic', description: 'One chip shows "Urgent" plus a visible "×" remove control' },
      { kind: 'detail', description: 'The chips lay out in a row using flex with a gap between them' },
      { kind: 'detail', description: 'The removable chip’s "×" is a distinct clickable element (e.g. a <button>)' },
      { kind: 'detail', description: 'The chips share a consistent pill background/color style' },
    ],
  },
];
