// Register supported themes here; IDs must match public/themes/<id>.css.
// Only these IDs may be persisted or interpolated into the public CSS URL.
export const THEMES = [
  { id: 'cartoon', label: '카툰', description: '선명한 색상과 굵은 테두리의 기본 테마' },
  { id: 'halloween', label: '할로윈', description: '귀여운 유령과 잭오랜턴, 호박 모양 버튼과 묘비형 카드의 할로윈 밤 테마' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'cartoon';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some(theme => theme.id === value);
}
