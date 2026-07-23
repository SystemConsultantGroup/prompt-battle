import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';
import { buildGradePrompt } from './sanitize.ts';

type Opts = { apiKey: string; model: string; fetchImpl?: typeof fetch };

function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('no json in response');
  return JSON.parse(text.slice(start, end + 1));
}

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

  async grade(code: GeneratedCode, criteria: Criterion[]): Promise<GradeResult> {
    const text = await this.call(
      'You are a strict, fair UI grader. Respond only with the requested JSON.',
      buildGradePrompt(code, criteria));
    const obj = extractJson(text);
    if (!Array.isArray(obj.items)) throw new Error('bad grade shape');
    return { items: obj.items.map((it: any) => ({
      id: Number(it.id), passed: Boolean(it.passed),
      rate: Number(it.rate ?? (it.passed ? 1 : 0)), reason: String(it.reason ?? ''),
    })) };
  }
}
