import type { Criterion } from '../db/index.ts';
import type { ItemVerdict, ResultItem, PlayerResult } from '../game/types.ts';

export function computeScore(
  criteria: Criterion[], verdicts: ItemVerdict[], detailWeight: number,
): { basicScore: number; detailScore: number; total: number; items: ResultItem[] } {
  const byId = new Map(verdicts.map(v => [v.id, v]));
  const items: ResultItem[] = criteria.map(c => {
    const v = byId.get(c.id);
    const rate = v ? Math.max(0, Math.min(1, v.rate)) : 0;
    return { description: c.description, kind: c.kind, passed: v?.passed ?? false, rate };
  });
  const avg = (kind: 'basic' | 'detail') => {
    const xs = items.filter(i => i.kind === kind);
    if (xs.length === 0) return 0;
    return xs.reduce((s, i) => s + i.rate, 0) / xs.length;
  };
  const basicScore = avg('basic');
  const detailScore = avg('detail');
  const total = basicScore * (1 - detailWeight) + detailScore * detailWeight;
  return { basicScore, detailScore, total, items };
}

export function rankResults(results: PlayerResult[]): PlayerResult[] {
  return [...results].sort((a, b) =>
    b.total - a.total || b.detailScore - a.detailScore);
}
