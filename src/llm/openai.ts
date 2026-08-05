import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';
import { buildGradePrompt } from './sanitize.ts';
import { extractJson } from './extract.ts';

type Opts = { apiKey: string; model: string; fetchImpl?: typeof fetch };

/**
 * OpenAI-backed provider (Chat Completions API). Shares the prompt-building
 * and JSON-extraction logic with ClaudeProvider; the only differences are the
 * endpoint, Bearer auth, and the choices[].message.content response shape.
 * Requests JSON mode (`response_format: json_object`) so the response is valid
 * JSON — the prompts already contain the word "JSON", which that mode requires.
 */
export class OpenAIProvider implements LLMProvider {
  private f: typeof fetch;
  constructor(private opts: Opts) { this.f = opts.fetchImpl ?? fetch; }

  private async call(system: string, user: string): Promise<string> {
    const res = await this.f('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model, max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}`);
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? '';
  }

  async implement(userPrompt: string, c: SystemConstraints): Promise<GeneratedCode> {
    const text = await this.call(c.systemPrompt, userPrompt);
    const obj = extractJson(text);
    return { html: String(obj.html ?? ''), css: String(obj.css ?? ''), js: String(obj.js ?? '') };
  }

  async grade(code: GeneratedCode, criteria: Criterion[]): Promise<GradeResult> {
    const text = await this.call(
      'You are a lenient, generous UI grader. Respond only with the requested JSON.',
      buildGradePrompt(code, criteria));
    const obj = extractJson(text);
    if (!Array.isArray(obj.items)) throw new Error('bad grade shape');
    return { items: obj.items.map((it: any) => ({
      id: Number(it.id), passed: Boolean(it.passed),
      rate: Number(it.rate ?? (it.passed ? 1 : 0)), reason: String(it.reason ?? ''),
    })) };
  }
}
