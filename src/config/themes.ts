// Register supported themes here; IDs must match public/themes/<id>.css.
// Only these IDs may be persisted or interpolated into the public CSS URL.
export const THEMES = [
  { id: 'cartoon', label: '카툰', description: '선명한 색상과 굵은 테두리의 기본 테마' },
  { id: 'halloween', label: '할로윈', description: '호박색 포인트와 거미줄 장식의 어두운 테마' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'cartoon';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some(theme => theme.id === value);
}
