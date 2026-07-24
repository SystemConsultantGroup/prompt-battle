import type { Problem } from '../db/index.ts';
import type { SelectMode } from './types.ts';

export function resolveSelection(
  problems: Problem[], mode: SelectMode,
  opts: { problemId?: number; category?: string; rng?: () => number },
): { problem: Problem; pool: Problem[] } | { error: string } {
  const rng = opts.rng ?? Math.random;
  if (mode === 'direct') {
    const problem = problems.find(p => p.id === opts.problemId);
    return problem ? { problem, pool: [problem] } : { error: 'unknown problem' };
  }
  const pool = mode === 'category'
    ? problems.filter(p => p.category === opts.category)
    : problems;
  if (pool.length === 0) return { error: 'empty pool' };
  const problem = pool[Math.floor(rng() * pool.length)];
  return { problem, pool };
}

/**
 * Uniformly picks among {base render, one render per variation}: n
 * variations means n+1 equally-likely outcomes. Index 0 = base, encoded
 * as `null`; any other index maps to that variation's id.
 */
export function pickVariation(
  variationIds: number[], rng: () => number = Math.random,
): number | null {
  const outcomes = variationIds.length + 1;
  const idx = Math.floor(rng() * outcomes);
  return idx === 0 ? null : variationIds[idx - 1];
}
