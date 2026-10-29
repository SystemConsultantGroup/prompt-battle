import type { Criterion } from '../db/index.ts';
import type { ItemVerdict, ResultItem, PlayerResult } from '../game/types.ts';

/** Share of the total taken by the deterministic fidelity metric. The rest is
 *  the LLM rubric (basic/detail split by the problem's detailWeight). */
export const FIDELITY_WEIGHT = 0.2;

/** Rubric levels the grader picks from; rate = level / RUBRIC_MAX_LEVEL. */
export const RUBRIC_MAX_LEVEL = 4;

export function computeScore(
  criteria: Criterion[], verdicts: ItemVerdict[], detailWeight: number, fidelity = 0,
): {
  basicScore: number; detailScore: number; fidelityScore: number; total: number; items: ResultItem[];
} {
  const byId = new Map(verdicts.map(v => [v.id, v]));
  const items: ResultItem[] = criteria.map(c => {
    const v = byId.get(c.id);
    const rate = v ? Math.max(0, Math.min(1, v.rate)) : 0;
    return { description: c.description, kind: c.kind, passed: v?.passed ?? false, rate,
      reason: v?.reason ?? '' };
  });
  const avg = (kind: 'basic' | 'detail') => {
    const xs = items.filter(i => i.kind === kind);
    if (xs.length === 0) return 0;
    return xs.reduce((s, i) => s + i.rate, 0) / xs.length;
  };
  const basicScore = avg('basic');
  const detailScore = avg('detail');
  const fidelityScore = Math.max(0, Math.min(1, fidelity));
  const rubric = basicScore * (1 - detailWeight) + detailScore * detailWeight;
  const total = rubric * (1 - FIDELITY_WEIGHT) + fidelityScore * FIDELITY_WEIGHT;
  return { basicScore, detailScore, fidelityScore, total, items };
}

// Scores are floats built from sums of fractions; compare on a fixed grid so
// 0.1 + 0.2 vs 0.3 noise can't split (or order) two genuinely equal players.
const key = (x: number) => Math.round(x * 1e6);

/** Ranking keys, most significant first. */
const KEYS: ((r: PlayerResult) => number)[] = [
  r => r.total, r => r.detailScore, r => r.fidelityScore, r => r.basicScore,
];

function compare(a: PlayerResult, b: PlayerResult): number {
  for (const k of KEYS) {
    const d = key(k(b)) - key(k(a));
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Order by total, then detail, then fidelity, then basic. Players equal on
 * every key share a rank (1, 1, 3 …) rather than being split arbitrarily by
 * name or join order.
 */
export function rankResults(results: PlayerResult[]): PlayerResult[] {
  const sorted = [...results].sort(compare);
  const out: PlayerResult[] = [];
  sorted.forEach((r, i) => {
    const tied = i > 0 && compare(sorted[i - 1], r) === 0;
    out.push({ ...r, rank: tied ? out[i - 1].rank : i + 1 });
  });
  return out;
}
