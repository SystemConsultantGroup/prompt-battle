import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;
const TOP = `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const layout: ProblemSeed[] = [
  {
    title: '히어로 섹션',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<section class="hero">
  <h1>아이디어를 현실로</h1>
  <p>팀과 함께 더 빠르게, 더 스마트하게 만드세요.</p>
  <div class="actions">
    <button class="cta">시작하기</button>
    <button class="ghost">더 알아보기</button>
  </div>
</section>`,
    targetCss: `${TOP}
.hero{max-width:640px;margin:10vh auto;padding:0 24px;text-align:center}
h1{font-size:48px;font-weight:800;color:#111827;margin:0 0 16px;line-height:1.1}
p{font-size:18px;color:#6b7280;margin:0 0 32px}
.actions{display:flex;gap:12px;justify-content:center}
.cta{background:#5b7cfa;color:#fff;border:0;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer}
.ghost{background:transparent;color:#5b7cfa;border:1px solid #5b7cfa;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '큰 헤딩(h1)과 서브 텍스트(p)가 있다' },
      { kind: 'basic', description: '주 CTA 버튼이 있다' },
      { kind: 'basic', description: '콘텐츠가 중앙 정렬된다' },
      { kind: 'detail', description: '두 번째 고스트/아웃라인 버튼이 있다' },
      { kind: 'detail', description: 'h1의 폰트 크기가 현저히 크다(36px 이상)' },
      { kind: 'detail', description: '버튼들이 가로로 나란히 배치된다(flex)' },
    ],
  },
  {
    title: '두 열 레이아웃',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="two-col">
  <aside class="sidebar">
    <h3>필터</h3>
    <ul>
      <li>카테고리 A</li>
      <li>카테고리 B</li>
      <li>카테고리 C</li>
    </ul>
  </aside>
  <main class="content">
    <h2>검색 결과</h2>
    <p>여기에 콘텐츠가 표시됩니다.</p>
  </main>
</div>`,
    targetCss: `${TOP}
.two-col{display:grid;grid-template-columns:220px 1fr;gap:24px;max-width:900px;margin:32px auto;padding:0 24px}
.sidebar{background:#fff;border-radius:10px;padding:20px;border:1px solid #e5e7eb}
.sidebar h3{margin:0 0 12px;font-size:14px;font-weight:600;color:#374151}
.sidebar ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.sidebar li{font-size:13px;color:#6b7280;cursor:pointer}
.content{background:#fff;border-radius:10px;padding:24px;border:1px solid #e5e7eb}
.content h2{margin:0 0 8px;font-size:18px;color:#111827}
.content p{margin:0;font-size:14px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '좁은 사이드바와 넓은 메인 콘텐츠 영역의 두 열 레이아웃이다' },
      { kind: 'basic', description: '사이드바에 필터/목록 항목이 있다' },
      { kind: 'basic', description: '메인 영역에 제목과 콘텐츠가 있다' },
      { kind: 'detail', description: '레이아웃이 CSS grid 또는 flex로 구현된다' },
      { kind: 'detail', description: '사이드바가 메인보다 좁다' },
    ],
  },
  {
    title: '반응형 카드 그리드',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="grid">
  <div class="card"><h4>카드 1</h4><p>짧은 설명 텍스트.</p></div>
  <div class="card"><h4>카드 2</h4><p>짧은 설명 텍스트.</p></div>
  <div class="card"><h4>카드 3</h4><p>짧은 설명 텍스트.</p></div>
  <div class="card"><h4>카드 4</h4><p>짧은 설명 텍스트.</p></div>
</div>`,
    targetCss: `${TOP}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;max-width:900px;margin:32px auto;padding:0 24px}
.card{background:#fff;border-radius:10px;padding:20px;border:1px solid #e5e7eb}
.card h4{margin:0 0 8px;font-size:15px;color:#111827}
.card p{margin:0;font-size:13px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '카드 요소가 4개 이상 있다' },
      { kind: 'basic', description: '카드들이 그리드 또는 flex-wrap으로 배치된다' },
      { kind: 'basic', description: '각 카드에 제목과 설명이 있다' },
      { kind: 'detail', description: 'auto-fill이나 repeat로 반응형 열 배치가 된다' },
      { kind: 'detail', description: '카드들 사이에 일관된 간격(gap)이 있다' },
    ],
  },
  {
    title: '스티키 헤더',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<header class="header">
  <span class="logo">BrandName</span>
  <nav class="nav">
    <a href="#">제품</a>
    <a href="#">가격</a>
    <a href="#">문의</a>
  </nav>
</header>
<main class="page-content">
  <p>스크롤 테스트용 콘텐츠</p>
  <p>더 내려보세요...</p>
</main>`,
    targetCss: `body{margin:0;font-family:system-ui,-apple-system,sans-serif;min-height:200vh;background:#f4f5f7}
.header{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:56px;background:#fff;border-bottom:1px solid #e5e7eb;z-index:10}
.logo{font-weight:700;font-size:17px;color:#111827}
.nav{display:flex;gap:20px}
.nav a{font-size:14px;color:#374151;text-decoration:none}
.page-content{padding:32px 24px;font-size:14px;color:#6b7280}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '로고와 내비 링크가 있는 헤더가 있다' },
      { kind: 'basic', description: '헤더가 position:sticky 또는 position:fixed로 고정된다' },
      { kind: 'basic', description: '페이지 아래에 스크롤 가능한 콘텐츠가 있다' },
      { kind: 'detail', description: '헤더에 배경색이 있어 콘텐츠 위에서도 보인다' },
      { kind: 'detail', description: '헤더 하단에 구분선이 있다' },
    ],
  },
  {
    title: '구독 가격 카드',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="card">
  <div class="plan">Pro 플랜</div>
  <div class="price"><span class="amount">29,000</span><span class="period">원/월</span></div>
  <ul class="features">
    <li>무제한 프로젝트</li>
    <li>고급 분석</li>
    <li>팀 협업</li>
  </ul>
  <button class="subscribe">구독하기</button>
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
      { kind: 'basic', description: '플랜 이름이 제목으로 표시된다' },
      { kind: 'basic', description: '가격이 표시된다' },
      { kind: 'basic', description: '기능 목록이 최소 3개 있다' },
      { kind: 'basic', description: '구독 버튼이 있다' },
      { kind: 'detail', description: '가격이 주변 텍스트보다 눈에 띄게 큰 폰트 크기를 사용한다' },
      { kind: 'detail', description: '카드에 둥근 모서리와 그림자(border-radius + box-shadow)가 있다' },
      { kind: 'detail', description: '기능 목록이 <ul>/<li> 마크업을 사용한다' },
    ],
  },
  {
    title: '쿠키 동의 배너',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="cookie-banner" id="banner">
  <p>더 나은 서비스 제공을 위해 쿠키를 사용합니다. 사이트 이용 시 쿠키 정책에 동의하는 것으로 간주됩니다.</p>
  <div class="actions">
    <button id="decline" class="btn-ghost">거부</button>
    <button id="accept" class="btn-primary">동의</button>
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
      { kind: 'basic', description: '메시지와 "동의", "거부" 버튼이 모두 있다' },
      { kind: 'basic', description: '배너가 화면 하단에 고정된다(fixed position)' },
      { kind: 'basic', description: '"동의" 클릭 시 배너가 사라진다' },
      { kind: 'basic', description: '"거부" 클릭 시 배너가 사라진다' },
      { kind: 'detail', description: '"동의"와 "거부" 버튼이 시각적으로 구분된다' },
      { kind: 'detail', description: '배너가 화면 전체 폭에 걸쳐 표시된다(left:0;right:0)' },
    ],
  },
  {
    title: '타임라인',
    category: 'layout',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<ul class="timeline">
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>계정 생성</h4>
      <p>회원가입 후 이메일을 인증했습니다.</p>
    </div>
  </li>
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>프로젝트 시작</h4>
      <p>첫 번째 프로젝트가 공개되었습니다.</p>
    </div>
  </li>
  <li class="item">
    <span class="dot"></span>
    <div class="content">
      <h4>마일스톤 달성</h4>
      <p>사용자 1,000명을 달성했습니다.</p>
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
      { kind: 'basic', description: '제목과 짧은 설명이 있는 타임라인 항목이 3개 있다' },
      { kind: 'basic', description: '각 항목에 점/마커 요소가 있다' },
      { kind: 'basic', description: '항목들이 세로로 쌓인 목록으로 배치된다' },
      { kind: 'detail', description: '점들 사이를 세로선이 연결한다(border-left 등)' },
      { kind: 'detail', description: '점 마커가 원형(border-radius:50%)이다' },
    ],
  },
];
