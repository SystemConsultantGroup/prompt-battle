import type { ProblemSeed } from '../types.ts';

const CENTER = `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif}`;

export const forms: ProblemSeed[] = [
  {
    title: '로그인 폼',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<form class="login">
  <h2>로그인</h2>
  <label for="email">이메일</label>
  <input id="email" type="email" placeholder="you@example.com">
  <label for="pw">비밀번호</label>
  <input id="pw" type="password" placeholder="••••••••">
  <button type="submit">로그인</button>
</form>`,
    targetCss: `${CENTER}
.login{width:320px;background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:8px}
.login h2{margin:0 0 12px;font-size:20px;color:#111827}
.login label{font-size:13px;font-weight:600;color:#374151}
.login input{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
.login input:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}
.login button{background:#5b7cfa;color:#fff;border:0;padding:12px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:4px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '이메일 입력 필드와 비밀번호 입력 필드가 각각 있다' },
      { kind: 'basic', description: '각 입력 필드에 레이블이 연결되어 있다' },
      { kind: 'basic', description: '제출 버튼이 있다' },
      { kind: 'detail', description: '비밀번호 필드가 type="password"이다' },
      { kind: 'detail', description: '폼이 카드 형태(배경, 패딩, 그림자)로 표시된다' },
    ],
  },
  {
    title: '체크박스',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<label class="checkbox">
  <input type="checkbox" checked>
  <span>뉴스레터 구독</span>
</label>`,
    targetCss: `${CENTER}
.checkbox{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;color:#111827}
.checkbox input{width:18px;height:18px;accent-color:#5b7cfa;cursor:pointer}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '<input type="checkbox">가 있다' },
      { kind: 'basic', description: '체크박스가 기본으로 체크된 상태이다' },
      { kind: 'basic', description: '"뉴스레터 구독" 텍스트가 체크박스의 레이블이다' },
      { kind: 'detail', description: '체크박스와 레이블 텍스트가 같은 가로줄에 정렬된다' },
      { kind: 'detail', description: '체크박스가 기본 브라우저 스타일보다 크거나 색이 변경되었다' },
    ],
  },
  {
    title: '라디오 버튼 그룹',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<fieldset class="radio-group">
  <legend>요금제 선택</legend>
  <label><input type="radio" name="plan" value="basic"> 기본</label>
  <label><input type="radio" name="plan" value="pro" checked> 프로</label>
  <label><input type="radio" name="plan" value="enterprise"> 엔터프라이즈</label>
</fieldset>`,
    targetCss: `${CENTER}
.radio-group{border:1px solid #d1d5db;border-radius:10px;padding:16px 20px;display:flex;flex-direction:column;gap:10px;background:#fff}
.radio-group legend{font-size:13px;font-weight:600;color:#111827;padding:0 4px}
.radio-group label{display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;cursor:pointer}
.radio-group input{accent-color:#5b7cfa;width:16px;height:16px}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '같은 name 속성을 공유하는 라디오 버튼이 3개 있다' },
      { kind: 'basic', description: '세 옵션이 "기본", "프로", "엔터프라이즈"로 레이블되어 있다' },
      { kind: 'basic', description: '"프로" 옵션이 기본으로 선택되어 있다' },
      { kind: 'detail', description: '옵션들이 일정한 세로 간격으로 배치된다' },
      { kind: 'detail', description: '그룹에 페이지와 구분되는 테두리/배경이 있다' },
    ],
  },
  {
    title: '토글 스위치',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 60,
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
      { kind: 'basic', description: '트랙과 둥근 thumb이 있는 스위치가 있다' },
      { kind: 'basic', description: '클릭 시 켬/끔 상태가 전환된다' },
      { kind: 'basic', description: '스위치가 기본적으로 끔 상태이다' },
      { kind: 'detail', description: '켤 때 thumb이 반대쪽으로 이동한다' },
      { kind: 'detail', description: '켬/끔 상태에 따라 트랙 배경색이 변경된다' },
      { kind: 'detail', description: '상태 변경에 CSS transition 애니메이션이 있다' },
    ],
  },
  {
    title: '아이콘 검색 바',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<label class="search">
  <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
  <input type="search" placeholder="검색...">
</label>`,
    targetCss: `${CENTER}
.search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d1d5db;border-radius:999px;padding:8px 16px;width:240px}
.search .icon{color:#9ca3af;flex-shrink:0}
.search input{border:0;outline:0;font-size:14px;flex:1;background:transparent}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '"검색..." placeholder가 있는 검색 입력 필드가 있다' },
      { kind: 'basic', description: '같은 컨테이너 안 입력 필드 왼쪽에 아이콘이 있다' },
      { kind: 'basic', description: '아이콘과 입력 필드가 같은 행에 위치한다' },
      { kind: 'detail', description: '입력 필드 자체에 기본 브라우저 테두리가 없다' },
      { kind: 'detail', description: '컨테이너가 알약형 혹은 둥근 모양이다' },
    ],
  },
  {
    title: '글자 수 카운터 텍스트에어리어',
    category: 'forms',
    difficulty: 'normal',
    timeLimitSec: 60,
    targetHtml: `<div class="field">
  <label for="bio">자기소개</label>
  <textarea id="bio" maxlength="200" placeholder="자신을 소개해 주세요"></textarea>
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
      { kind: 'basic', description: 'maxlength="200"인 <textarea>와 "N/200" 카운터가 있다' },
      { kind: 'basic', description: '카운터가 처음에 "0/200"으로 시작한다' },
      { kind: 'basic', description: '입력 시 카운터가 현재 글자 수를 반영한다' },
      { kind: 'detail', description: '카운터가 더 작고 흐린 색으로 오른쪽 정렬된다' },
      { kind: 'detail', description: '텍스트에어리어에 테두리가 있고 세로로 크기 조절 가능하다' },
    ],
  },
  {
    title: '셀렉트 드롭다운',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<div class="field">
  <label for="country">국가</label>
  <select id="country">
    <option value="">국가를 선택하세요</option>
    <option value="kr">대한민국</option>
    <option value="us">미국</option>
    <option value="jp">일본</option>
  </select>
</div>`,
    targetCss: `${CENTER}
.field{display:flex;flex-direction:column;gap:6px;width:240px}
.field label{font-size:13px;font-weight:600;color:#111827}
.field select{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;color:#111827}
.field select:focus{outline:2px solid #5b7cfa;border-color:#5b7cfa}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '<label>과 연결된 native <select> 요소가 있다' },
      { kind: 'basic', description: '실제 국가 옵션이 3개 이상 있다' },
      { kind: 'basic', description: '"국가를 선택하세요" 같은 빈 값의 placeholder 옵션이 첫 번째에 있다' },
      { kind: 'detail', description: '셀렉트에 테두리와 둥근 모서리가 있다' },
      { kind: 'detail', description: '셀렉트에 내부 패딩이 있다' },
    ],
  },
  {
    title: '파일 업로드 영역',
    category: 'forms',
    difficulty: 'easy',
    timeLimitSec: 60,
    targetHtml: `<label class="dropzone" for="file">
  <span class="icon">📁</span>
  <span class="msg">파일을 드래그하거나 <u>클릭하여 업로드</u></span>
  <input type="file" id="file">
</label>`,
    targetCss: `${CENTER}
.dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:280px;height:140px;border:2px dashed #d1d5db;border-radius:12px;background:#fff;cursor:pointer;text-align:center}
.dropzone:hover{border-color:#5b7cfa;background:#eef1ff}
.icon{font-size:28px}
.msg{font-size:14px;color:#6b7280}
.dropzone input{display:none}`,
    targetJs: '',
    criteria: [
      { kind: 'basic', description: '파일 업로드 드롭존 영역이 있다' },
      { kind: 'basic', description: '아이콘과 업로드 안내 텍스트가 있다' },
      { kind: 'basic', description: '실제 <input type="file">이 숨겨져 있다' },
      { kind: 'detail', description: '영역에 점선 테두리(dashed border)가 있다' },
      { kind: 'detail', description: '호버 시 테두리/배경색이 변경된다' },
    ],
  },
];
