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
