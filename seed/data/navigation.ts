import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const navigation: ProblemSeed[] = [
  {
    title: '상단 내비게이션 바',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<nav class="navbar">
  <div class="logo">MyApp</div>
  <div class="links">
    <a href="#">홈</a>
    <a href="#">소개</a>
    <a href="#">연락처</a>
  </div>
</nav>`,
    targetCss: `body{margin:0;font-family:system-ui,-apple-system,sans-serif}
.navbar{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:60px;background:#fff;border-bottom:1px solid #e5e7eb}
.logo{font-size:18px;font-weight:700;color:#111827}
.links{display:flex;gap:24px}
.links a{color:#374151;text-decoration:none;font-size:14px}
.links a:hover{color:#5b7cfa}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '로고/브랜드 텍스트와 내비게이션 링크가 모두 있다' },
      { kind: 'basic', description: '내비 링크가 최소 3개 있다' },
      { kind: 'basic', description: '내비바가 페이지 상단에 가로로 전체 폭으로 표시된다' },
      { kind: 'detail', description: '로고와 링크가 양 끝에 배치된다(space-between 등)' },
      { kind: 'detail', description: '내비바 하단에 구분선/경계(border-bottom 등)가 있다' },
    ],
  },
  {
    title: '탭 내비게이션',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="tabs">
  <button class="tab active" data-panel="overview">개요</button>
  <button class="tab" data-panel="specs">사양</button>
  <button class="tab" data-panel="reviews">리뷰</button>
</div>
<div class="panels">
  <div class="panel" id="overview">개요 내용</div>
  <div class="panel" id="specs" hidden>사양 내용</div>
  <div class="panel" id="reviews" hidden>리뷰 내용</div>
</div>`,
    targetCss: `${CENTER}
.tabs{display:flex;border-bottom:2px solid #e5e7eb}
.tab{background:transparent;border:0;padding:10px 20px;font-size:14px;color:#6b7280;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px}
.tab.active{color:#5b7cfa;border-bottom-color:#5b7cfa;font-weight:600}
.panels{padding:16px 0;font-size:14px;color:#374151}`,
    targetJs: `document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.hidden=true);
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).hidden=false;
  });
});`,
    criteria: [
      { kind: 'basic', description: '"개요", "사양", "리뷰" 세 탭 버튼이 있다' },
      { kind: 'basic', description: '탭마다 대응하는 콘텐츠 패널이 있다' },
      { kind: 'basic', description: '로드 시 하나의 패널만 보이고 나머지는 숨겨진다' },
      { kind: 'basic', description: '탭 클릭 시 해당 패널이 표시되고 나머지가 숨겨진다' },
      { kind: 'detail', description: '활성 탭이 비활성 탭과 시각적으로 다르다(테두리/배경/색/굵기)' },
      { kind: 'detail', description: '첫 번째 탭과 패널이 기본으로 활성 상태이다' },
    ],
  },
  {
    title: '브레드크럼',
    category: 'navigation',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="#" class="crumb">홈</a>
  <span class="sep">/</span>
  <a href="#" class="crumb">카테고리</a>
  <span class="sep">/</span>
  <span class="crumb current" aria-current="page">제품</span>
</nav>`,
    targetCss: `${CENTER}
.breadcrumbs{display:flex;align-items:center;gap:8px;font-size:14px}
.crumb{color:#5b7cfa;text-decoration:none}
.crumb:hover{text-decoration:underline}
.crumb.current{color:#6b7280;font-weight:600}
.sep{color:#9ca3af}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"홈", "카테고리", "제품" 순서의 브레드크럼이 있다' },
      { kind: 'basic', description: '각 항목 사이에 구분자가 있다' },
      { kind: 'basic', description: '마지막 항목("제품")이 링크가 아닌 텍스트/span이다' },
      { kind: 'detail', description: '마지막 항목이 앞의 링크들과 시각적으로 다르다(색/굵기 등)' },
      { kind: 'detail', description: '"홈", "카테고리"가 <a> 링크 요소이다' },
    ],
  },
  {
    title: '페이지네이션',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<nav class="pagination" aria-label="Pagination">
  <button class="page-btn">이전</button>
  <button class="page-num">1</button>
  <button class="page-num active" aria-current="page">2</button>
  <button class="page-num">3</button>
  <button class="page-btn">다음</button>
</nav>`,
    targetCss: `${CENTER}
.pagination{display:flex;align-items:center;gap:6px}
.page-btn,.page-num{background:#fff;border:1px solid #d1d5db;color:#374151;padding:8px 12px;border-radius:6px;font-size:14px;cursor:pointer}
.page-num.active{background:#5b7cfa;border-color:#5b7cfa;color:#fff;font-weight:600}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"이전"과 "다음" 버튼이 있다' },
      { kind: 'basic', description: '페이지 번호 1, 2, 3이 있다' },
      { kind: 'basic', description: '2페이지가 현재 활성 페이지로 강조 표시된다' },
      { kind: 'detail', description: '활성 페이지의 배경/테두리 색이 비활성과 다르다' },
      { kind: 'detail', description: '활성 페이지에 aria-current="page"가 있다' },
    ],
  },
  {
    title: '사이드바 메뉴',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<nav class="sidebar" aria-label="Sidebar">
  <a href="#" class="item">
    <span class="icon">🏠</span> 대시보드
  </a>
  <a href="#" class="item active">
    <span class="icon">📁</span> 프로젝트
  </a>
  <a href="#" class="item">
    <span class="icon">👥</span> 팀
  </a>
  <a href="#" class="item">
    <span class="icon">⚙️</span> 설정
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
      { kind: 'basic', description: '정확히 4개의 항목이 있는 세로 메뉴가 있다' },
      { kind: 'basic', description: '각 항목에 아이콘과 텍스트 레이블이 모두 있다' },
      { kind: 'basic', description: '"프로젝트" 항목이 활성 상태로 강조된다' },
      { kind: 'detail', description: '항목들이 세로로 쌓인다(flex-direction:column 등)' },
      { kind: 'detail', description: '활성 항목의 배경 또는 텍스트 색이 나머지와 다르다' },
    ],
  },
  {
    title: '단계 표시기 (스테퍼)',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="stepper">
  <div class="step completed">
    <div class="circle">✓</div>
    <div class="label">계정</div>
  </div>
  <div class="connector completed"></div>
  <div class="step current">
    <div class="circle">2</div>
    <div class="label">배송</div>
  </div>
  <div class="connector"></div>
  <div class="step">
    <div class="circle">3</div>
    <div class="label">결제</div>
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
      { kind: 'basic', description: '번호가 매겨진 3개의 단계가 가로로 배치된다' },
      { kind: 'basic', description: '1단계가 완료(체크마크 등) 스타일로 표시된다' },
      { kind: 'basic', description: '2단계가 현재 단계로 시각적으로 구분된다' },
      { kind: 'detail', description: '단계들을 연결하는 선/커넥터가 있다' },
      { kind: 'detail', description: '완료된 단계가 현재/미완료 단계와 다른 색이다' },
    ],
  },
  {
    title: '드롭다운 메뉴',
    category: 'navigation',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="dropdown">
  <button class="dd-btn" id="ddBtn" aria-haspopup="true" aria-expanded="false">옵션 ▾</button>
  <div class="dd-menu" id="ddMenu" hidden>
    <a href="#" class="dd-item">수정</a>
    <a href="#" class="dd-item">복제</a>
    <a href="#" class="dd-item">삭제</a>
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
      { kind: 'basic', description: '버튼 클릭으로 정확히 3개 항목의 메뉴가 토글된다' },
      { kind: 'basic', description: '메뉴가 기본으로 숨겨져 있다' },
      { kind: 'basic', description: '버튼 클릭으로 메뉴가 열리고, 다시 클릭하면 닫힌다' },
      { kind: 'detail', description: 'aria-expanded 속성이 열림/닫힘 상태를 반영한다' },
      { kind: 'detail', description: '메뉴가 버튼에 상대적으로 위치한다(position:absolute)' },
    ],
  },
];
