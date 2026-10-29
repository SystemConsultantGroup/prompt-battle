import type { GradeResult } from '../game/types.ts';

// Pull the first JSON object out of a model's text response. Providers ask for
// pure JSON, but some wrap it in prose or code fences; grabbing the outermost
// braces tolerates that. Throws if no object is present.
export function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('no json in response');
  return JSON.parse(text.slice(start, end + 1));
}

const MAX_LEVEL = 4;

/**
 * Turn a grader response into verdicts. The rubric asks for an integer
 * `level` 0–4; it is snapped and clamped so a model answering 3.6 or 7 can't
 * produce an off-scale rate. A legacy `rate` (0..1) is still accepted and
 * snapped to the same quarter grid, so every verdict lands on one of five
 * values no matter which shape the model used.
 */
export function parseGradeResult(text: string): GradeResult {
  const obj = extractJson(text);
  if (!Array.isArray(obj.items)) throw new Error('bad grade shape');
  return { items: obj.items.map((it: any) => {
    const raw = it.level != null ? Number(it.level)
      : it.rate != null ? Number(it.rate) * MAX_LEVEL
      : it.passed ? MAX_LEVEL : 0;
    const level = Number.isFinite(raw) ? Math.max(0, Math.min(MAX_LEVEL, Math.round(raw))) : 0;
    return {
      id: Number(it.id), passed: level >= 3, rate: level / MAX_LEVEL,
      reason: String(it.evidence ?? it.reason ?? '').slice(0, 200),
    };
  }) };
}
