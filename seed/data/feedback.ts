import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const feedback: ProblemSeed[] = [
  {
    title: '경고 배너',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="banner" id="banner">
  <span class="icon">⚠️</span>
  <span class="msg">저장되지 않은 변경 사항이 있습니다.</span>
  <button class="dismiss" aria-label="닫기" id="close">✕</button>
</div>`,
    targetCss: `${CENTER}
.banner{display:flex;align-items:center;gap:12px;background:#fefce8;border:1px solid #fde047;color:#854d0e;padding:12px 16px;border-radius:8px;max-width:360px;width:100%}
.msg{flex:1;font-size:14px}
.dismiss{background:transparent;border:0;color:#854d0e;font-size:16px;cursor:pointer;padding:0;width:auto;margin:0;line-height:1}`,
    targetJs: `document.getElementById('close').addEventListener('click',()=>{document.getElementById('banner').style.display='none';});`,
    criteria: [
      { kind: 'basic', description: '경고/알림 아이콘, 메시지 텍스트, 닫기 버튼이 모두 있다' },
      { kind: 'basic', description: '닫기 버튼 클릭 시 배너가 사라진다' },
      { kind: 'basic', description: '배너에 노란/경고 계열 배경 또는 테두리 색이 있다' },
      { kind: 'detail', description: '배너 내용이 아이콘, 메시지, 버튼이 가로 한 줄로 flex 배치된다' },
      { kind: 'detail', description: '닫기 버튼에 aria-label이 있다' },
      { kind: 'detail', description: '배너에 둥근 모서리(border-radius)가 있다' },
    ],
  },
  {
    title: '알림 배지',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 60,
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
      { kind: 'basic', description: '종 모양(또는 유사한) 아이콘이 있다' },
      { kind: 'basic', description: '숫자 "3"을 표시하는 작은 배지 버블이 있다' },
      { kind: 'basic', description: '배지가 아이콘 모서리에 absolute positioning으로 배치된다' },
      { kind: 'detail', description: '배지에 빨간/액센트 색 배경이 있다' },
      { kind: 'detail', description: '배지가 알약/원형 모양(높이 절반 이상의 border-radius)이다' },
      { kind: 'detail', description: '배지 텍스트가 버블 안에 중앙 정렬된다' },
    ],
  },
  {
    title: '토스트 알림',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<div class="toast">
  <span class="icon">✓</span>
  <span class="msg">변경 사항이 저장되었습니다</span>
</div>`,
    targetCss: `body{margin:0;min-height:100vh;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}
.toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.25);font-size:14px}
.icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#22c55e;color:#fff;font-size:12px;font-weight:700}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '성공 아이콘과 "변경 사항이 저장되었습니다" 메시지가 있는 토스트가 있다' },
      { kind: 'basic', description: '토스트가 화면 하단에 떠있다(position:fixed)' },
      { kind: 'basic', description: '토스트에 페이지 배경과 다른 진한 배경색이 있다' },
      { kind: 'detail', description: '토스트에 그림자(box-shadow)가 있다' },
      { kind: 'detail', description: '성공 아이콘이 녹색 배경의 채워진 원이다' },
      { kind: 'detail', description: '아이콘과 메시지가 flex + gap으로 가로 정렬된다' },
    ],
  },
  {
    title: '진행 바',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 60,
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
      { kind: 'basic', description: '트랙 요소 안에 채워진 바가 있다' },
      { kind: 'basic', description: '채움 너비가 트랙의 약 65%이다' },
      { kind: 'basic', description: '"65%" 텍스트 레이블이 표시된다' },
      { kind: 'detail', description: 'role="progressbar"와 aria-valuenow가 65를 반영한다' },
      { kind: 'detail', description: '트랙에 완전히 둥근 모서리(border-radius)가 있다' },
      { kind: 'detail', description: '채움이 트랙 배경과 다른 액센트 색을 사용한다' },
    ],
  },
  {
    title: '로딩 스피너',
    category: 'feedback',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<div class="spinner"></div>`,
    targetCss: `${CENTER}
.spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#5b7cfa;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '원형 스피너 요소가 있다' },
      { kind: 'basic', description: '스피너가 화면 중앙에 있다' },
      { kind: 'basic', description: '스피너가 CSS 애니메이션으로 계속 회전한다(@keyframes + animation)' },
      { kind: 'detail', description: '애니메이션이 linear이고 infinite로 반복된다' },
      { kind: 'detail', description: '스피너가 완전한 원형(같은 width/height, 50% border-radius)이다' },
      { kind: 'detail', description: '한쪽 테두리(border-top-color 등)가 다른 색이어서 회전이 보인다' },
    ],
  },
  {
    title: '호버 툴팁',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="tip-wrap">
  <button class="trigger">마우스를 올려보세요</button>
  <span class="tooltip">링크를 클립보드에 복사합니다</span>
</div>`,
    targetCss: `${CENTER}
.tip-wrap{position:relative;display:inline-block}
.trigger{background:#5b7cfa;color:#fff;border:0;padding:10px 20px;border-radius:8px;font-size:15px;cursor:pointer}
.tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#111827;color:#fff;font-size:12px;padding:6px 10px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s}
.tip-wrap:hover .tooltip{opacity:1}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '트리거 요소와 설명 텍스트가 있는 툴팁 버블이 모두 있다' },
      { kind: 'basic', description: '기본 상태에서 툴팁이 숨겨져 있다(opacity:0 등)' },
      { kind: 'basic', description: ':hover CSS 규칙으로 트리거 호버 시 툴팁이 표시된다' },
      { kind: 'detail', description: '툴팁이 absolute positioning으로 트리거 위에 배치된다' },
      { kind: 'detail', description: '툴팁 표시/숨김이 opacity에 CSS transition이 적용된다' },
      { kind: 'detail', description: '툴팁에 밝은 배경 대비 어두운 배경이 사용된다' },
    ],
  },
  {
    title: '빈 상태 화면',
    category: 'feedback',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="empty">
  <div class="icon">🔍</div>
  <h2>결과가 없습니다</h2>
  <p>필터나 검색어를 조정해 보세요.</p>
  <button class="btn">필터 초기화</button>
</div>`,
    targetCss: `${CENTER}
.empty{text-align:center;max-width:320px;padding:32px;background:#fff;border-radius:12px}
.icon{font-size:40px;margin-bottom:12px}
h2{margin:0 0 8px;font-size:18px;color:#111827}
p{margin:0 0 20px;font-size:14px;color:#6b7280}
.btn{background:#5b7cfa;color:#fff;border:0;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '아이콘, 제목, 설명 텍스트, 버튼이 하나의 카드에 모두 있다' },
      { kind: 'basic', description: '제목이 "결과가 없습니다"이다' },
      { kind: 'basic', description: '행동 유도 레이블이 있는 버튼(예: "필터 초기화")이 있다' },
      { kind: 'detail', description: '카드 내용이 중앙 정렬(text-align:center)된다' },
      { kind: 'detail', description: '제목과 설명이 시각적으로 구분되는 폰트 크기/색을 사용한다' },
      { kind: 'detail', description: '카드에 패딩과 둥근 모서리(border-radius)가 있다' },
    ],
  },
];
