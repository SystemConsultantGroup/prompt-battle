import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';
import { buildGradePrompt, GRADE_SYSTEM_PROMPT } from './sanitize.ts';
import { extractJson, parseGradeResult } from './extract.ts';

type Opts = { apiKey: string; model: string; fetchImpl?: typeof fetch };

export class ClaudeProvider implements LLMProvider {
  private f: typeof fetch;
  constructor(private opts: Opts) { this.f = opts.fetchImpl ?? fetch; }

  private async call(system: string, user: string): Promise<string> {
    const res = await this.f('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.opts.model, max_tokens: 4096,
        system, messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`claude ${res.status}`);
    const data = await res.json() as { content: { type: string; text?: string }[] };
    return data.content.filter(c => c.type === 'text').map(c => c.text ?? '').join('');
  }

  async implement(userPrompt: string, c: SystemConstraints): Promise<GeneratedCode> {
    const text = await this.call(c.systemPrompt, userPrompt);
    const obj = extractJson(text);
    return { html: String(obj.html ?? ''), css: String(obj.css ?? ''), js: String(obj.js ?? '') };
  }

  async grade(code: GeneratedCode, criteria: Criterion[], reference?: GeneratedCode): Promise<GradeResult> {
    // No temperature here: current Claude models reject sampling parameters.
    // Consistency comes from the anchored rubric in buildGradePrompt instead.
    const text = await this.call(GRADE_SYSTEM_PROMPT, buildGradePrompt(code, criteria, reference));
    return parseGradeResult(text);
  }
}
