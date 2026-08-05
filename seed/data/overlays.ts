import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const overlays: ProblemSeed[] = [
  {
    title: '확인 모달',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 240,
    targetHtml: `<div class="overlay" id="overlay">
  <div class="modal">
    <h3>정말 삭제하시겠습니까?</h3>
    <p>이 작업은 되돌릴 수 없습니다.</p>
    <div class="actions">
      <button class="cancel" id="cancel">취소</button>
      <button class="confirm">삭제</button>
    </div>
  </div>
</div>`,
    targetCss: `body{margin:0;font-family:system-ui,-apple-system,sans-serif}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.modal{background:#fff;border-radius:12px;padding:24px 28px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal h3{margin:0 0 8px;font-size:17px;color:#111827}
.modal p{margin:0 0 20px;font-size:14px;color:#6b7280}
.actions{display:flex;gap:12px;justify-content:flex-end}
.cancel{background:#fff;border:1px solid #d1d5db;color:#374151;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}
.confirm{background:#ef4444;border:0;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}`,
    targetJs: `document.getElementById('cancel').addEventListener('click',()=>{document.getElementById('overlay').style.display='none';});`,
    criteria: [
      { kind: 'basic', description: '제목과 설명 텍스트가 있는 모달 대화상자가 있다' },
      { kind: 'basic', description: '"취소"와 "삭제" 버튼이 모두 있다' },
      { kind: 'basic', description: '반투명 오버레이가 배경을 덮는다' },
      { kind: 'detail', description: '"취소"와 "삭제" 버튼이 시각적으로 구분된다(색/스타일)' },
      { kind: 'detail', description: '모달이 오버레이 중앙에 배치된다' },
      { kind: 'detail', description: '모달에 그림자가 있다' },
    ],
  },
  {
    title: '별점 평가',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="rating">
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
      { kind: 'basic', description: '별 요소 5개가 있다' },
      { kind: 'basic', description: 'N번째 별 클릭 시 1~N번 별이 모두 채워진다' },
      { kind: 'basic', description: '채워지지 않은 별은 회색, 채워진 별은 다른 색이다' },
      { kind: 'detail', description: '"filled" 클래스 토글로 채움 상태를 관리한다' },
      { kind: 'detail', description: '낮은 별 클릭 시 그 이후 별의 채움이 해제된다' },
      { kind: 'detail', description: '별들이 가로로 flex + gap 배열된다' },
    ],
  },
  {
    title: '범위 슬라이더',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
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
      { kind: 'basic', description: 'native <input type="range"> 요소가 있다' },
      { kind: 'basic', description: '현재 값을 표시하는 별도 레이블 요소가 있다' },
      { kind: 'basic', description: '레이블의 초기 텍스트가 슬라이더의 초기값과 일치한다' },
      { kind: 'basic', description: '슬라이더에 min/max 속성이 있다' },
      { kind: 'detail', description: '슬라이더 이동 시 레이블이 실시간으로 업데이트된다(input 이벤트)' },
      { kind: 'detail', description: '슬라이더와 레이블이 flex column으로 함께 묶인다' },
    ],
  },
  {
    title: '캐러셀 도트',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="carousel">
  <div class="slide" id="slide">슬라이드 1</div>
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
    slide.textContent = '슬라이드 ' + (Number(dot.dataset.index)+1);
  });
});`,
    criteria: [
      { kind: 'basic', description: '슬라이드 영역과 4개의 인디케이터 도트가 있다' },
      { kind: 'basic', description: '한 번에 하나의 도트만 활성 상태이고, 처음에는 첫 번째가 활성이다' },
      { kind: 'basic', description: '도트 클릭 시 해당 도트가 활성화되고 나머지는 비활성화된다' },
      { kind: 'detail', description: '활성 도트가 비활성 도트와 다른 채움 색을 가진다' },
      { kind: 'detail', description: '도트들이 원형(border-radius 50%)이고 가로로 배열된다' },
      { kind: 'detail', description: '도트 클릭 시 슬라이드 콘텐츠/레이블이 업데이트된다' },
    ],
  },
  {
    title: '수량 스텝퍼',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="stepper">
  <button class="step-btn" id="dec" aria-label="감소">−</button>
  <span class="qty" id="qty">0</span>
  <button class="step-btn" id="inc" aria-label="증가">+</button>
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
      { kind: 'basic', description: '빼기 버튼, 숫자 값, 더하기 버튼이 있다' },
      { kind: 'basic', description: '수량이 0으로 시작한다' },
      { kind: 'basic', description: '+ 버튼 클릭 시 수량이 1 증가한다' },
      { kind: 'basic', description: '- 버튼 클릭 시 수량이 1 감소한다' },
      { kind: 'detail', description: '수량이 0 미만으로 내려가지 않는다' },
      { kind: 'detail', description: '세 컨트롤이 하나의 그룹 컨트롤(공유 테두리/둥근 컨테이너)로 묶인다' },
    ],
  },
  {
    title: '팝오버 메뉴',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="popover-wrap">
  <button class="trigger" id="trigger">동작 ▾</button>
  <div class="popover" id="popover">
    <button class="action">수정</button>
    <button class="action">복제</button>
    <button class="action">삭제</button>
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
      { kind: 'basic', description: '트리거 버튼과 3개의 동작 항목이 있는 팝오버가 있다' },
      { kind: 'basic', description: '팝오버가 기본으로 숨겨져 있다' },
      { kind: 'basic', description: '트리거 버튼 클릭 시 팝오버가 토글된다' },
      { kind: 'detail', description: '팝오버가 트리거에 상대적으로 위치한다(position:absolute)' },
      { kind: 'detail', description: '팝오버에 테두리/그림자가 있어 페이지와 구분된다' },
      { kind: 'detail', description: '팝오버 바깥 클릭 시 팝오버가 닫힌다' },
    ],
  },
  {
    title: '사이드 서랍 (드로어)',
    category: 'overlays',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<button class="open-btn" id="openBtn">메뉴 열기</button>
<div class="overlay" id="overlay">
  <div class="drawer" id="drawer">
    <button class="close-btn" id="closeBtn">✕</button>
    <h3>메뉴</h3>
    <a href="#">홈</a>
    <a href="#">소개</a>
    <a href="#">연락처</a>
  </div>
</div>`,
    targetCss: `body{margin:0;font-family:system-ui,-apple-system,sans-serif}
.open-btn{position:fixed;top:16px;left:16px;background:#5b7cfa;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4)}
.overlay.open{display:block}
.drawer{position:fixed;top:0;left:0;height:100%;width:240px;background:#fff;padding:24px;display:flex;flex-direction:column;gap:16px;box-shadow:4px 0 20px rgba(0,0,0,.15)}
.close-btn{align-self:flex-end;background:transparent;border:0;font-size:18px;cursor:pointer;padding:0;width:auto;margin:0}
.drawer h3{margin:0;font-size:16px}
.drawer a{color:#374151;text-decoration:none;font-size:14px}`,
    targetJs: `const openBtn=document.getElementById('openBtn');
const closeBtn=document.getElementById('closeBtn');
const overlay=document.getElementById('overlay');
openBtn.addEventListener('click',()=>overlay.classList.add('open'));
closeBtn.addEventListener('click',()=>overlay.classList.remove('open'));
overlay.addEventListener('click',(e)=>{if(e.target===overlay)overlay.classList.remove('open');});`,
    criteria: [
      { kind: 'basic', description: '버튼 클릭으로 열리는 사이드 드로어가 있다' },
      { kind: 'basic', description: '드로어 안에 닫기 버튼과 내비게이션 링크가 있다' },
      { kind: 'basic', description: '드로어가 기본으로 숨겨져 있다' },
      { kind: 'detail', description: '드로어가 화면 한쪽에 고정 위치로 슬라이드 인된다' },
      { kind: 'detail', description: '오버레이 배경이 드로어 뒤를 반투명하게 덮는다' },
      { kind: 'detail', description: '오버레이 클릭 시 드로어가 닫힌다' },
    ],
  },
];
