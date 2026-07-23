import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';

export class FakeProvider implements LLMProvider {
  async implement(userPrompt: string, _c: SystemConstraints): Promise<GeneratedCode> {
    return { html: `<div>${userPrompt}</div>`, css: '', js: '' };
  }
  async grade(code: GeneratedCode, criteria: Criterion[]): Promise<GradeResult> {
    const hay = `${code.html} ${code.css} ${code.js}`.toLowerCase();
    return {
      items: criteria.map(c => {
        const passed = c.description.toLowerCase().split(/\s+/).every(w => hay.includes(w));
        return { id: c.id, passed, rate: passed ? 1 : 0, reason: passed ? 'found' : 'missing' };
      }),
    };
  }
}
