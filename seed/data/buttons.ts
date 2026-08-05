import type { ProblemSeed } from '../types.ts';

// Shared body reset so each target renders centered on a neutral canvas.
const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const buttons: ProblemSeed[] = [
  {
    title: '기본 버튼',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<button class="btn">시작하기</button>`,
    targetCss: `${CENTER}
.btn{background:#5b7cfa;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:background .15s}
.btn:hover{background:#4a6ae8}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '<button> 요소가 존재한다' },
      { kind: 'basic', description: '버튼 텍스트가 "시작하기"이다' },
      { kind: 'basic', description: '버튼에 불투명한 배경색이 있다' },
      { kind: 'basic', description: '버튼에 가로·세로 패딩이 있다' },
      { kind: 'detail', description: '버튼에 둥근 모서리(border-radius)가 있다' },
      { kind: 'detail', description: ':hover 상태에서 버튼 외관이 변경된다' },
      { kind: 'detail', description: '버튼 텍스트의 font-weight가 굵다(600 이상)' },
    ],
  },
  {
    title: '아이콘 버튼',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<button class="icon-btn" aria-label="추가">
  <span class="icon">+</span>
  <span>항목 추가</span>
</button>`,
    targetCss: `${CENTER}
.icon-btn{display:inline-flex;align-items:center;gap:8px;background:#111827;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:15px;cursor:pointer}
.icon{font-size:20px;line-height:1}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '<button> 안에 아이콘/기호와 텍스트 레이블이 모두 있다' },
      { kind: 'basic', description: '레이블 텍스트가 "항목 추가"이다' },
      { kind: 'basic', description: '아이콘과 레이블이 같은 가로줄에 위치한다' },
      { kind: 'detail', description: '아이콘과 레이블 사이에 간격(gap)이 있다' },
      { kind: 'detail', description: '버튼이 inline-flex이고 세로 중앙 정렬(align-items)이 적용된다' },
      { kind: 'detail', description: '버튼에 aria-label 또는 접근 가능한 이름이 있다' },
    ],
  },
  {
    title: '버튼 그룹 (세그먼트)',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="group" role="group">
  <button class="seg active">일</button>
  <button class="seg">주</button>
  <button class="seg">월</button>
</div>`,
    targetCss: `${CENTER}
.group{display:inline-flex;border:1px solid #d1d5db;border-radius:8px;overflow:hidden}
.seg{background:#fff;border:0;border-right:1px solid #d1d5db;padding:8px 18px;font-size:14px;cursor:pointer}
.seg:last-child{border-right:0}
.seg.active{background:#5b7cfa;color:#fff}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"일", "주", "월" 세 버튼이 있다' },
      { kind: 'basic', description: '세 버튼이 하나의 세그먼트 컨트롤처럼 나란히 붙어있다' },
      { kind: 'basic', description: '첫 번째("일") 버튼이 활성(active) 상태로 강조된다' },
      { kind: 'detail', description: '활성 버튼의 배경색이 비활성 버튼과 다르다' },
      { kind: 'detail', description: '그룹 전체에 공유된 외곽 둥근 테두리가 있다' },
      { kind: 'detail', description: '인접한 버튼 사이에 구분선(border)이 있다' },
    ],
  },
  {
    title: '토글 버튼',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<button class="toggle" id="tg" aria-pressed="false">
  <span class="dot"></span> 알림 끔
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
  t.lastChild.textContent = on ? ' 알림 끔' : ' 알림 켬';
});`,
    criteria: [
      { kind: 'basic', description: '상태 점과 텍스트 레이블이 있는 토글 버튼이 하나 있다' },
      { kind: 'basic', description: '버튼 클릭 시 켬/끔 상태가 전환된다' },
      { kind: 'basic', description: '레이블 텍스트가 "알림 끔"과 "알림 켬" 사이에서 전환된다' },
      { kind: 'detail', description: '켬/끔 상태에 따라 버튼 배경/글색이 변경된다' },
      { kind: 'detail', description: '상태 점의 색이 상태에 따라 변경된다' },
      { kind: 'detail', description: 'aria-pressed 속성이 눌림 상태를 반영한다' },
    ],
  },
  {
    title: '플로팅 액션 버튼 (FAB)',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<button class="fab" aria-label="작성">+</button>`,
    targetCss: `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,sans-serif}
.fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:0;background:#ef4444;color:#fff;font-size:28px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25)}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"+" 기호가 있는 둥근 버튼이 존재한다' },
      { kind: 'basic', description: '버튼이 완전한 원형이다(width=height, 50% 반지름)' },
      { kind: 'basic', description: '버튼이 화면 하단 모서리에 고정된다(fixed/absolute)' },
      { kind: 'detail', description: '버튼에 그림자(box-shadow)가 있다' },
      { kind: 'detail', description: '버튼에 뚜렷한 액센트 배경색이 사용된다' },
      { kind: 'detail', description: '버튼에 aria-label이 있다' },
    ],
  },
  {
    title: '로딩 버튼',
    category: 'buttons',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<button class="btn" disabled>
  <span class="spinner"></span> 저장 중…
</button>`,
    targetCss: `${CENTER}
.btn{display:inline-flex;align-items:center;gap:10px;background:#5b7cfa;color:#fff;border:0;padding:12px 24px;border-radius:8px;font-size:15px;opacity:.85;cursor:not-allowed}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '버튼 안에 스피너와 "저장 중…" 텍스트가 있다' },
      { kind: 'basic', description: '버튼이 비활성(disabled) 상태이다' },
      { kind: 'basic', description: '텍스트 옆에 원형 스피너 요소가 있다' },
      { kind: 'detail', description: '스피너가 CSS 애니메이션(@keyframes + animation)으로 회전한다' },
      { kind: 'detail', description: '비활성 버튼이 시각적으로 흐리게(opacity 감소) 표시된다' },
      { kind: 'detail', description: '커서가 비상호작용 상태(cursor:not-allowed)를 나타낸다' },
    ],
  },
  {
    title: '고스트 버튼 (아웃라인)',
    category: 'buttons',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<button class="ghost">더 알아보기 →</button>`,
    targetCss: `${CENTER}
.ghost{background:transparent;color:#5b7cfa;border:1px solid #5b7cfa;padding:10px 20px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s}
.ghost:hover{background:#5b7cfa;color:#fff}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"더 알아보기"와 화살표가 있는 버튼이 있다' },
      { kind: 'basic', description: '버튼의 기본 배경이 투명/채우기 없음이다' },
      { kind: 'basic', description: '버튼에 유색 아웃라인/테두리가 있다' },
      { kind: 'detail', description: '호버 시 버튼이 액센트 색으로 채워진다(:hover 규칙)' },
      { kind: 'detail', description: '테두리 색과 텍스트 색이 일치한다' },
      { kind: 'detail', description: '버튼에 둥근 모서리가 있다' },
    ],
  },
];
