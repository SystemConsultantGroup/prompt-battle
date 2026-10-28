import { el } from '/shared/dom.js';

// Keep this panel independent from the problem editor: saving a theme must not
// remount the console, lose an in-progress edit, or restyle the current page.
export function renderThemeSettings(api) {
  const select = el('select', { id: 'site-theme', 'aria-describedby': 'theme-help' });
  select.disabled = true;
  const status = el('p', { class: 'theme-status', role: 'status', 'aria-live': 'polite' }, '테마 설정을 불러오는 중…');
  const description = el('p', { class: 'theme-description' });
  const save = el('button', { onClick: saveTheme }, '테마 저장');
  save.disabled = true;
  const retry = el('button', { class: 'ghost', onClick: load }, '다시 불러오기');
  retry.hidden = true;
  const panel = el('section', { class: 'card theme-settings', 'aria-labelledby': 'theme-heading' },
    el('h2', { id: 'theme-heading' }, '사이트 테마'),
    el('p', { id: 'theme-help', class: 'theme-help' },
      '저장 후 새로 열거나 새로고침한 플레이어·호스트·관리자 화면에 적용됩니다. 이미 열린 화면은 바뀌지 않습니다.'),
    el('label', { for: 'site-theme' }, '새 화면에 적용할 테마'),
    select, description, save, retry, status);
  let themes = [];
  let savedTheme;

  select.addEventListener('change', () => {
    updateDescription();
    save.disabled = select.value === savedTheme;
    status.className = 'theme-status';
    status.textContent = select.value === savedTheme ? '현재 저장된 테마입니다.' : '변경한 테마를 저장해 주세요.';
  });

  function updateDescription() {
    description.textContent = themes.find(t => t.id === select.value)?.description ?? '';
  }

  async function load() {
    retry.hidden = true;
    save.disabled = true;
    select.disabled = true;
    status.className = 'theme-status';
    status.textContent = '테마 설정을 불러오는 중…';
    try {
      const res = await api('/api/settings/theme', { cache: 'no-store' });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      themes = data.themes;
      select.replaceChildren(...themes.map(t => new Option(t.label, t.id)));
      select.value = savedTheme = data.theme;
      select.disabled = false;
      updateDescription();
      status.textContent = `현재 저장된 테마: ${themes.find(t => t.id === savedTheme)?.label}`;
    } catch {
      status.className = 'theme-status error';
      status.textContent = '테마 설정을 불러오지 못했습니다. 연결과 관리자 인증을 확인한 뒤 다시 시도해 주세요.';
      retry.hidden = false;
    }
  }

  async function saveTheme() {
    save.disabled = true;
    select.disabled = true;
    status.className = 'theme-status';
    status.textContent = '테마를 저장하는 중…';
    try {
      const res = await api('/api/settings/theme', {
        method: 'PUT', body: JSON.stringify({ theme: select.value }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      select.value = savedTheme = data.theme;
      updateDescription();
      status.textContent = `${themes.find(t => t.id === savedTheme)?.label} 테마를 저장했습니다. 새로 열거나 새로고침한 화면부터 적용됩니다.`;
    } catch {
      status.className = 'theme-status error';
      status.textContent = '테마 저장 결과를 확인하지 못했습니다. 연결과 관리자 인증을 확인한 뒤 다시 저장하거나 페이지를 새로고침해 주세요.';
    } finally {
      select.disabled = false;
      save.disabled = select.value === savedTheme;
    }
  }

  load();
  return panel;
}
