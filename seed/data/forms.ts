import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const forms: ProblemSeed[] = [
  {
    title: 'Login Form',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<form class="login">
  <h2>Sign in</h2>
  <label for="email">Email</label>
  <input type="email" id="email" placeholder="you@example.com">
  <label for="password">Password</label>
  <input type="password" id="password" placeholder="••••••••">
  <button type="submit">Log in</button>
</form>`,
    targetCss: `${CENTER}
.login{display:flex;flex-direction:column;gap:6px;background:#fff;padding:28px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);width:280px}
.login h2{margin:0 0 10px;font-size:20px}
.login label{font-size:13px;color:#374151;margin-top:6px}
.login input{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
.login input:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}
.login button{margin-top:14px;background:#5b7cfa;color:#fff;border:0;padding:11px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <form> contains an <input type="email"> and an <input type="password">' },
      { kind: 'basic', description: 'A submit button (button/input type="submit") with text like "Log in" is present' },
      { kind: 'basic', description: 'Each input has an associated label (via for/id or wrapping)' },
      { kind: 'basic', description: 'The fields and button are stacked vertically as a single column' },
      { kind: 'detail', description: 'The form sits inside a card-like container with padding, rounded corners, and a shadow' },
      { kind: 'detail', description: 'The inputs have a visible border and internal padding' },
      { kind: 'detail', description: 'The submit button has a distinct solid background color' },
    ],
  },
  {
    title: 'Text Input with Label',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="field">
  <label for="username">Username</label>
  <input type="text" id="username" placeholder="Enter your username">
  <span class="hint">This will be visible to other users.</span>
</div>`,
    targetCss: `${CENTER}
.field{display:flex;flex-direction:column;gap:6px;width:260px}
.field label{font-size:13px;font-weight:600;color:#111827}
.field input{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
.field input:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}
.hint{font-size:12px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'An <input type="text"> is present with a <label> associated to it (for/id or wrapping)' },
      { kind: 'basic', description: 'Helper text below the input reads "This will be visible to other users."' },
      { kind: 'basic', description: 'The label appears above the input' },
      { kind: 'detail', description: 'The helper text is styled smaller and in a muted color than the label' },
      { kind: 'detail', description: 'The input has a visible border and rounded corners' },
    ],
  },
  {
    title: 'Checkbox with Label',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<label class="checkbox">
  <input type="checkbox" checked>
  <span>Subscribe to newsletter</span>
</label>`,
    targetCss: `${CENTER}
.checkbox{display:inline-flex;align-items:center;gap:10px;font-size:15px;color:#111827;cursor:pointer}
.checkbox input{width:18px;height:18px;accent-color:#5b7cfa;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'An <input type="checkbox"> is present' },
      { kind: 'basic', description: 'The checkbox has the checked attribute/state set' },
      { kind: 'basic', description: 'The text "Subscribe to newsletter" is associated with the checkbox as its label' },
      { kind: 'detail', description: 'The checkbox and its label text are aligned on the same horizontal row' },
      { kind: 'detail', description: 'The checkbox is enlarged or colored beyond the unstyled browser default (e.g. width/height or accent-color set)' },
    ],
  },
  {
    title: 'Radio Button Group',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<fieldset class="radio-group">
  <legend>Choose a plan</legend>
  <label><input type="radio" name="plan" value="basic"> Basic</label>
  <label><input type="radio" name="plan" value="pro" checked> Pro</label>
  <label><input type="radio" name="plan" value="enterprise"> Enterprise</label>
</fieldset>`,
    targetCss: `${CENTER}
.radio-group{border:1px solid #d1d5db;border-radius:10px;padding:16px 20px;display:flex;flex-direction:column;gap:10px;background:#fff}
.radio-group legend{font-size:13px;font-weight:600;color:#111827;padding:0 4px}
.radio-group label{display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;cursor:pointer}
.radio-group input{accent-color:#5b7cfa;width:16px;height:16px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'Three <input type="radio"> elements share the same name attribute, forming one group' },
      { kind: 'basic', description: 'The three options are labelled "Basic", "Pro", and "Enterprise"' },
      { kind: 'basic', description: 'Exactly one radio option ("Pro") is checked by default' },
      { kind: 'detail', description: 'The options are laid out with consistent vertical spacing between them' },
      { kind: 'detail', description: 'The group has a visible container border/background distinguishing it from the page' },
    ],
  },
  {
    title: 'Toggle Switch',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<button class="switch" id="sw" role="switch" aria-checked="false">
  <span class="thumb"></span>
</button>`,
    targetCss: `${CENTER}
.switch{position:relative;width:48px;height:26px;border-radius:999px;border:0;background:#d1d5db;cursor:pointer;padding:0;transition:background .15s}
.switch[aria-checked="true"]{background:#22c55e}
.thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.switch[aria-checked="true"] .thumb{transform:translateX(22px)}`,
    targetJs: `const sw=document.getElementById('sw');
sw.addEventListener('click',()=>{
  const on=sw.getAttribute('aria-checked')==='true';
  sw.setAttribute('aria-checked', String(!on));
});`,
    criteria: [
      { kind: 'basic', description: 'A switch element (role="switch" or similarly recognizable) with a pill-shaped track and a round thumb is present' },
      { kind: 'basic', description: 'Clicking the switch toggles its on/off state (e.g. aria-checked flips between true and false)' },
      { kind: 'basic', description: 'The switch starts in the off state by default' },
      { kind: 'detail', description: 'The thumb visually moves to the opposite side when switched on (transform/position change)' },
      { kind: 'detail', description: 'The track background color changes between the on and off states' },
      { kind: 'detail', description: 'The state change is animated with a CSS transition' },
    ],
  },
  {
    title: 'Search Bar with Icon',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<label class="search">
  <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
  <input type="search" placeholder="Search...">
</label>`,
    targetCss: `${CENTER}
.search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d1d5db;border-radius:999px;padding:8px 16px;width:240px}
.search .icon{color:#9ca3af;flex-shrink:0}
.search input{border:0;outline:0;font-size:14px;flex:1;background:transparent}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'An <input type="search"> (or type="text" acting as a search field) with a "Search..." placeholder is present' },
      { kind: 'basic', description: 'An icon element (svg or icon glyph) is present to the left of the input, inside the same container' },
      { kind: 'basic', description: 'The icon and input sit on the same row (flex/inline layout)' },
      { kind: 'detail', description: 'The input has no default browser border (border removed/none on the input itself)' },
      { kind: 'detail', description: 'The container has a pill or rounded shape (large border-radius)' },
    ],
  },
  {
    title: 'Textarea with Character Counter',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="field">
  <label for="bio">Bio</label>
  <textarea id="bio" maxlength="200" placeholder="Tell us about yourself"></textarea>
  <div class="counter"><span id="count">0</span>/200</div>
</div>`,
    targetCss: `${CENTER}
.field{display:flex;flex-direction:column;gap:6px;width:280px}
.field label{font-size:13px;font-weight:600;color:#111827}
.field textarea{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:inherit;min-height:90px;resize:vertical}
.field textarea:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}
.counter{align-self:flex-end;font-size:12px;color:#6b7280}`,
    targetJs: `const ta=document.getElementById('bio');
const count=document.getElementById('count');
ta.addEventListener('input',()=>{
  count.textContent = String(ta.value.length);
});`,
    criteria: [
      { kind: 'basic', description: 'A <textarea> with maxlength="200" is present alongside a counter element showing "N/200"' },
      { kind: 'basic', description: 'The counter starts at "0/200" before any input' },
      { kind: 'basic', description: 'Typing in the textarea updates the counter to reflect the current character count (an input event listener)' },
      { kind: 'detail', description: 'The counter text is styled smaller and in a muted color, aligned to the right' },
      { kind: 'detail', description: 'The textarea has a visible border and can be resized vertically (resize:vertical)' },
    ],
  },
  {
    title: 'Select Dropdown',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 180,
    targetHtml: `<div class="field">
  <label for="country">Country</label>
  <select id="country">
    <option value="">Select a country</option>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <option value="uk">United Kingdom</option>
  </select>
</div>`,
    targetCss: `${CENTER}
.field{display:flex;flex-direction:column;gap:6px;width:240px}
.field label{font-size:13px;font-weight:600;color:#111827}
.field select{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;color:#111827}
.field select:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A native <select> element is present with a <label> associated to it (for/id)' },
      { kind: 'basic', description: 'The select contains at least 3 real country options ("United States", "Canada", "United Kingdom")' },
      { kind: 'basic', description: 'A non-selectable placeholder option ("Select a country") appears first with an empty value' },
      { kind: 'detail', description: 'The select has a visible border and rounded corners' },
      { kind: 'detail', description: 'The select has internal padding rather than sitting flush against its border' },
    ],
  },
];
