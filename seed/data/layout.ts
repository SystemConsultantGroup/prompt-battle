import type { ProblemSeed } from '../types.ts';

// Full-width sections render top-aligned on a neutral canvas.
const TOP = `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,sans-serif}`;

// Contained cards render centered on a neutral canvas, matching buttons.ts's CENTER.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const layout: ProblemSeed[] = [
  {
    title: 'Hero Section',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<section class="hero">
  <h1>Build faster with Nova</h1>
  <p class="sub">The all-in-one platform for shipping products your customers love.</p>
  <button class="cta">Get Started Free</button>
</section>`,
    targetCss: `${TOP}
.hero{text-align:center;padding:96px 24px}
.hero h1{margin:0 0 12px;font-size:40px;color:#111827}
.sub{margin:0 0 28px;font-size:18px;color:#6b7280}
.cta{background:#5b7cfa;color:#fff;border:0;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A heading with the hero title text is present' },
      { kind: 'basic', description: 'A subheading paragraph beneath the heading is present' },
      { kind: 'basic', description: 'A primary call-to-action button is present' },
      { kind: 'basic', description: 'The hero content is horizontally centered (text-align:center)' },
      { kind: 'detail', description: 'The heading uses a noticeably larger font-size than the subheading' },
      { kind: 'detail', description: 'The CTA button has a solid background color and padding' },
      { kind: 'detail', description: 'The hero section has generous vertical padding (top and bottom)' },
    ],
  },
  {
    title: 'Footer',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<footer class="site-footer">
  <div class="cols">
    <div class="col">
      <h4>Product</h4>
      <a href="#">Features</a>
      <a href="#">Pricing</a>
    </div>
    <div class="col">
      <h4>Company</h4>
      <a href="#">About</a>
      <a href="#">Careers</a>
    </div>
    <div class="col">
      <h4>Resources</h4>
      <a href="#">Blog</a>
      <a href="#">Support</a>
    </div>
  </div>
  <p class="copyright">© 2026 Nova Inc. All rights reserved.</p>
</footer>`,
    targetCss: `${TOP}
.site-footer{background:#111827;color:#d1d5db;padding:48px 24px 24px}
.cols{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;margin:0 0 32px}
.col h4{margin:0 0 12px;font-size:14px;color:#fff}
.col a{display:block;margin-bottom:8px;font-size:14px;color:#9ca3af;text-decoration:none}
.copyright{margin:0;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #374151;padding-top:16px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'A <footer> element is present' },
      { kind: 'basic', description: 'The footer has at least 2 columns of links' },
      { kind: 'basic', description: 'Each column has a heading label above its links' },
      { kind: 'basic', description: 'A copyright line with a © symbol is present' },
      { kind: 'detail', description: 'The columns are laid out side by side (display:flex or grid)' },
      { kind: 'detail', description: 'The copyright line is visually separated from the columns (e.g. border-top)' },
    ],
  },
  {
    title: 'Pricing Card',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="card">
  <h3 class="plan">Pro</h3>
  <p class="price"><span class="amount">$29</span><span class="period">/mo</span></p>
  <ul class="features">
    <li>Unlimited projects</li>
    <li>Priority support</li>
    <li>Advanced analytics</li>
    <li>Team collaboration</li>
  </ul>
  <button class="subscribe">Subscribe</button>
</div>`,
    targetCss: `${CENTER}
.card{width:280px;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.08);text-align:center}
.plan{margin:0 0 8px;font-size:18px;color:#374151}
.price{margin:0 0 24px}
.amount{font-size:40px;font-weight:700;color:#111827}
.period{font-size:14px;color:#9ca3af}
.features{list-style:none;margin:0 0 24px;padding:0;text-align:left}
.features li{padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#4b5563}
.subscribe{width:100%;background:#5b7cfa;color:#fff;border:0;padding:12px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'The plan name is shown as a heading' },
      { kind: 'basic', description: 'A price is displayed' },
      { kind: 'basic', description: 'At least 3 feature bullets are listed' },
      { kind: 'basic', description: 'A subscribe button is present' },
      { kind: 'detail', description: 'The price uses a noticeably larger font-size than the surrounding text' },
      { kind: 'detail', description: 'The card has rounded corners and a drop shadow (border-radius + box-shadow)' },
      { kind: 'detail', description: 'The feature bullets use list markup (<ul>/<li>)' },
    ],
  },
  {
    title: 'Cookie Consent Banner',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="cookie-banner" id="banner">
  <p>We use cookies to improve your experience. By using our site, you agree to our cookie policy.</p>
  <div class="actions">
    <button id="decline" class="btn-ghost">Decline</button>
    <button id="accept" class="btn-primary">Accept</button>
  </div>
</div>`,
    targetCss: `${TOP}
.cookie-banner{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:#111827;color:#f3f4f6;padding:16px 24px}
.cookie-banner p{margin:0;max-width:520px;font-size:14px}
.actions{display:flex;gap:12px}
.btn-primary{background:#5b7cfa;color:#fff;border:0;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer}
.btn-ghost{background:transparent;color:#d1d5db;border:1px solid #4b5563;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer}`,
    targetJs: `const banner=document.getElementById('banner');
document.getElementById('accept').addEventListener('click',()=>{banner.style.display='none';});
document.getElementById('decline').addEventListener('click',()=>{banner.style.display='none';});`,
    criteria: [
      { kind: 'basic', description: 'A message and both an Accept and a Decline button are present' },
      { kind: 'basic', description: 'The banner is pinned to the bottom of the viewport (fixed position)' },
      { kind: 'basic', description: 'Clicking Accept hides the banner' },
      { kind: 'basic', description: 'Clicking Decline hides the banner' },
      { kind: 'detail', description: 'The Accept and Decline buttons are visually distinguished from each other' },
      { kind: 'detail', description: 'The banner spans the full width of the viewport (e.g. left:0;right:0)' },
    ],
  },
  {
    title: 'Timeline',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<ul class="timeline">
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>Account created</h4>
      <p>You signed up and verified your email.</p>
    </div>
  </li>
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>Project launched</h4>
      <p>Your first project went live.</p>
    </div>
  </li>
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>Milestone reached</h4>
      <p>You hit 1,000 users.</p>
    </div>
  </li>
</ul>`,
    targetCss: `${CENTER}
.timeline{list-style:none;width:320px;margin:0;padding:0}
.item{position:relative;padding:0 0 32px 28px;border-left:2px solid #e5e7eb}
.item:last-child{border-left:2px solid transparent;padding-bottom:0}
.dot{position:absolute;left:-7px;top:0;width:12px;height:12px;border-radius:50%;background:#5b7cfa;border:2px solid #fff}
.content h4{margin:0 0 4px;font-size:15px;color:#111827}
.content p{margin:0;font-size:13px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '3 timeline items are present, each with a title and a short description' },
      { kind: 'basic', description: 'Each item has a dot/marker element' },
      { kind: 'basic', description: 'The items are arranged vertically as a stacked list' },
      { kind: 'detail', description: 'A connecting line runs along the vertical axis between the dots (e.g. border-left)' },
      { kind: 'detail', description: 'The dot markers are circular (border-radius:50%)' },
    ],
  },
  {
    title: 'Skeleton Loader',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<div class="skeleton-card">
  <div class="sk-avatar shimmer"></div>
  <div class="sk-line shimmer" style="width:70%"></div>
  <div class="sk-line shimmer" style="width:90%"></div>
  <div class="sk-line shimmer" style="width:50%"></div>
</div>`,
    targetCss: `${CENTER}
.skeleton-card{width:260px;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.sk-avatar{width:56px;height:56px;border-radius:50%;margin-bottom:16px}
.sk-line{height:12px;border-radius:6px;margin-bottom:12px}
.sk-line:last-child{margin-bottom:0}
.shimmer{background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:400% 100%;animation:shimmer 1.4s ease infinite}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:0 0}}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: 'An avatar-circle placeholder block is present' },
      { kind: 'basic', description: 'At least 2 line placeholder blocks are present' },
      { kind: 'basic', description: 'The placeholder blocks use a gray/neutral fill color rather than real content' },
      { kind: 'detail', description: 'The placeholders animate via a CSS @keyframes shimmer animation' },
      { kind: 'detail', description: 'The avatar placeholder is circular (border-radius:50%)' },
      { kind: 'detail', description: 'The line placeholders vary in width rather than all being identical' },
    ],
  },
  {
    title: 'Feature Grid',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 300,
    targetHtml: `<section class="features">
  <div class="feature">
    <div class="icon icon-blue"></div>
    <h4>Fast</h4>
    <p>Optimized for speed out of the box.</p>
  </div>
  <div class="feature">
    <div class="icon icon-green"></div>
    <h4>Secure</h4>
    <p>Encrypted end-to-end by default.</p>
  </div>
  <div class="feature">
    <div class="icon icon-purple"></div>
    <h4>Scalable</h4>
    <p>Grows with your team effortlessly.</p>
  </div>
</section>`,
    targetCss: `${TOP}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:960px;margin:0 auto;padding:64px 24px}
.feature{text-align:center}
.icon{width:48px;height:48px;border-radius:12px;margin:0 auto 16px}
.icon-blue{background:#5b7cfa}
.icon-green{background:#22c55e}
.icon-purple{background:#a855f7}
.feature h4{margin:0 0 8px;font-size:16px;color:#111827}
.feature p{margin:0;font-size:14px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '3 feature cells are present, each with an icon block, a title, and a description' },
      { kind: 'basic', description: 'The icon blocks use distinct background colors from each other' },
      { kind: 'basic', description: 'The cells are arranged in a 3-column grid' },
      { kind: 'detail', description: 'The layout uses CSS grid or flexbox (display:grid or display:flex)' },
      { kind: 'detail', description: 'The icon blocks have rounded corners (border-radius)' },
      { kind: 'detail', description: 'The content within each feature cell is centered (text-align:center)' },
    ],
  },
];
