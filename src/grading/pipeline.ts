import type { LLMProvider } from '../llm/provider.ts';
import { IMPLEMENT_SYSTEM_PROMPT, wrapUserPrompt } from '../llm/sanitize.ts';
import { computeScore, rankResults } from './score.ts';
import { computeFidelity } from './fidelity.ts';
import type { Problem, Criterion } from '../db/index.ts';
import type { PlayerResult, GeneratedCode } from '../game/types.ts';

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers);
  return out;
}

export async function gradeRoom(args: {
  provider: LLMProvider;
  problem: Problem;
  criteria: Criterion[];
  submissions: { username: string; prompt: string }[];
  /** The target the room actually played — the active variation's code when
   *  one was drawn. Defaults to the base problem's target. */
  reference?: GeneratedCode;
  onProgress?: (done: number, total: number) => void;
  storeCode?: (code: GeneratedCode) => string;
}): Promise<PlayerResult[]> {
  const { provider, problem, criteria, submissions } = args;
  const reference = args.reference
    ?? { html: problem.targetHtml, css: problem.targetCss, js: problem.targetJs };
  let done = 0;
  const results = await mapLimit(submissions, 3, async (sub) => {
    let code, verdict;
    try {
      code = await provider.implement(wrapUserPrompt(sub.prompt),
        { systemPrompt: IMPLEMENT_SYSTEM_PROMPT });
      verdict = await provider.grade(code, criteria, reference);
    } catch (err) {
      // Don't swallow silently: an LLM/auth/parse failure here otherwise looks
      // identical to a legitimate zero score. Log it so misconfig (e.g. a bad
      // API key) is diagnosable; the player still gets an empty verdict.
      console.error(`[grading] failed for "${sub.username}":`,
        err instanceof Error ? err.message : err);
      verdict = { items: [] };
    }
    const genToken = code && args.storeCode ? args.storeCode(code) : undefined;
    // No code (provider failure) means nothing was reproduced: fidelity 0,
    // matching the empty verdict rather than rewarding a blank page.
    const fidelity = code ? computeFidelity(reference, code).score : 0;
    const s = computeScore(criteria, verdict.items, problem.detailWeight, fidelity);
    done++; args.onProgress?.(done, submissions.length);
    return { username: sub.username, total: s.total, prompt: sub.prompt,
      basicScore: s.basicScore, detailScore: s.detailScore, fidelityScore: s.fidelityScore,
      rank: 0, items: s.items, genToken };
  });
  return rankResults(results);
}
