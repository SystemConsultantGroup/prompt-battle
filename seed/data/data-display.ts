import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const dataDisplay: ProblemSeed[] = [
  {
    title: '사용자 프로필 카드',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="card">
  <div class="avatar">JK</div>
  <div class="name">김지훈</div>
  <div class="role">프론트엔드 개발자</div>
  <div class="stats">
    <div class="stat"><div class="num">128</div><div class="lbl">게시물</div></div>
    <div class="stat"><div class="num">4.2k</div><div class="lbl">팔로워</div></div>
    <div class="stat"><div class="num">312</div><div class="lbl">팔로잉</div></div>
  </div>
</div>`,
    targetCss: `${CENTER}
.card{width:240px;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);text-align:center}
.avatar{width:64px;height:64px;border-radius:50%;background:#5b7cfa;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.name{font-size:17px;font-weight:700;color:#111827}
.role{font-size:13px;color:#6b7280;margin:4px 0 16px}
.stats{display:flex;gap:16px;justify-content:center}
.stat{text-align:center}
.num{font-size:16px;font-weight:700;color:#111827}
.lbl{font-size:11px;color:#9ca3af;margin-top:2px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '이름, 역할, 아바타가 포함된 사용자 카드가 있다' },
      { kind: 'basic', description: '게시물, 팔로워, 팔로잉과 같은 통계 수치가 3개 있다' },
      { kind: 'basic', description: '카드 콘텐츠가 중앙 정렬된다' },
      { kind: 'detail', description: '아바타가 원형(border-radius:50%)이다' },
      { kind: 'detail', description: '통계 수치가 가로로 배열된다' },
      { kind: 'detail', description: '카드에 그림자와 둥근 모서리가 있다' },
    ],
  },
  {
    title: '제품 카드',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="card">
  <div class="img-area"></div>
  <div class="info">
    <div class="title">무선 헤드폰</div>
    <div class="price">89,000원</div>
    <button class="btn">장바구니 담기</button>
  </div>
</div>`,
    targetCss: `${CENTER}
.card{width:220px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
.img-area{height:160px;background:#e0e7ff}
.info{padding:16px}
.title{font-size:15px;font-weight:600;color:#111827;margin-bottom:6px}
.price{font-size:18px;font-weight:700;color:#5b7cfa;margin-bottom:14px}
.btn{width:100%;background:#5b7cfa;color:#fff;border:0;padding:10px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '제품 이미지 영역(색 블록)이 있다' },
      { kind: 'basic', description: '제품 이름 "무선 헤드폰"과 가격이 표시된다' },
      { kind: 'basic', description: '"장바구니 담기" 버튼이 있다' },
      { kind: 'detail', description: '이미지 블록이 텍스트 위에 직사각형 형태로 고정 높이를 가진다' },
      { kind: 'detail', description: '카드에 둥근 모서리와 그림자가 있다' },
      { kind: 'detail', description: '가격과 제목이 시각적으로 구분된다(다른 크기/색)' },
    ],
  },
  {
    title: '상태 표시 아바타',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 60,
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
      { kind: 'basic', description: '이니셜 "AK"가 있는 원형 아바타가 있다' },
      { kind: 'basic', description: '아바타 위에 작은 상태 점이 있다' },
      { kind: 'basic', description: '상태 점에 녹색 배경색이 있다' },
      { kind: 'detail', description: '아바타가 border-radius:50%로 원형이다' },
      { kind: 'detail', description: '상태 점이 absolute positioning으로 아바타 모서리에 있다' },
      { kind: 'detail', description: '상태 점에 아바타와 구분되는 테두리/외곽이 있다' },
    ],
  },
  {
    title: 'KPI 타일',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<div class="tile">
  <div class="label">매출</div>
  <div class="value">4,820만원</div>
  <div class="delta">+12%</div>
</div>`,
    targetCss: `${CENTER}
.tile{background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 2px 10px rgba(0,0,0,.08);width:180px}
.label{font-size:13px;color:#6b7280}
.value{font-size:32px;font-weight:700;color:#111827;margin-top:6px}
.delta{display:inline-block;margin-top:8px;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"매출" 레이블과 큰 수치가 표시된다' },
      { kind: 'basic', description: '"+12%" 증감 표시가 있다' },
      { kind: 'basic', description: '증감 텍스트에 녹색 계열 색(텍스트 또는 배경)이 사용된다' },
      { kind: 'detail', description: '수치가 레이블보다 눈에 띄게 큰 폰트 크기(28px 이상)이다' },
      { kind: 'detail', description: '증감 표시가 작은 둥근 배지/알약 형태로 구분된다' },
      { kind: 'detail', description: '레이블→수치→증감 순서로 읽기 순서에 배치된다' },
    ],
  },
  {
    title: '메타 정보가 있는 목록 항목',
    category: 'data-display',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<div class="item">
  <div class="avatar">RS</div>
  <div class="text">
    <div class="title">이지현</div>
    <div class="subtitle">게시물에 댓글을 달았습니다</div>
  </div>
  <div class="meta">2시간 전</div>
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
      { kind: 'basic', description: '이니셜이 있는 원형 아바타가 앞에 있다' },
      { kind: 'basic', description: '이름과 부제 텍스트가 표시된다' },
      { kind: 'basic', description: '"2시간 전" 같은 시간 메타 텍스트가 끝에 있다' },
      { kind: 'detail', description: '아바타, 텍스트, 메타가 flex로 가로 배치된다' },
      { kind: 'detail', description: '아바타가 원형(border-radius:50%)이다' },
      { kind: 'detail', description: '이름과 부제가 폰트 크기/굵기/색으로 구분된다' },
    ],
  },
  {
    title: '간단한 데이터 테이블',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<table class="table">
  <thead>
    <tr><th>이름</th><th>역할</th><th>상태</th></tr>
  </thead>
  <tbody>
    <tr><td>김민준</td><td>개발자</td><td><span class="badge active">활성</span></td></tr>
    <tr><td>이서연</td><td>디자이너</td><td><span class="badge active">활성</span></td></tr>
    <tr><td>박지호</td><td>매니저</td><td><span class="badge inactive">초대됨</span></td></tr>
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
      { kind: 'basic', description: '"이름", "역할", "상태" 헤더가 있는 <table>이 있다' },
      { kind: 'basic', description: '테이블 본문에 정확히 3개의 데이터 행이 있다' },
      { kind: 'basic', description: '각 행에 이름, 역할, 상태 값이 표시된다' },
      { kind: 'detail', description: '상태 값이 둥근 배지/알약 형태로 스타일링된다' },
      { kind: 'detail', description: '헤더 행이 본문 행과 시각적으로 구분된다(배경색/굵기)' },
      { kind: 'detail', description: '행 사이에 구분선(border-bottom)이 있다' },
    ],
  },
  {
    title: '태그/칩 목록',
    category: 'data-display',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="chips">
  <span class="chip">디자인</span>
  <span class="chip">프론트엔드</span>
  <span class="chip">원격근무</span>
  <span class="chip removable">긴급 <button class="remove" aria-label="태그 제거">×</button></span>
</div>`,
    targetCss: `${CENTER}
.chips{display:flex;flex-wrap:wrap;gap:8px;width:280px}
.chip{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;color:#4338ca;font-size:13px;font-weight:500;padding:6px 14px;border-radius:999px}
.remove{background:transparent;border:0;color:#4338ca;font-size:14px;line-height:1;cursor:pointer;padding:0}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '알약 형태(border-radius 큰 값)의 칩 요소가 3개 이상 있다' },
      { kind: 'basic', description: '"디자인", "프론트엔드", "원격근무" 레이블이 포함된다' },
      { kind: 'basic', description: '"긴급" 칩에 "×" 제거 컨트롤이 있다' },
      { kind: 'detail', description: '칩들이 flex + gap으로 가로 배열된다' },
      { kind: 'detail', description: '"×" 제거 컨트롤이 클릭 가능한 별도 요소(<button>)이다' },
      { kind: 'detail', description: '칩들이 일관된 알약 배경/색 스타일을 공유한다' },
    ],
  },
];
