import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';
import { buildGradePrompt, GRADE_SYSTEM_PROMPT } from './sanitize.ts';
import { extractJson, parseGradeResult } from './extract.ts';

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

  private async call(
    system: string, user: string, sampling: { temperature?: number; seed?: number } = {},
  ): Promise<string> {
    const res = await this.f('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model, max_tokens: 4096, ...sampling,
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

  async grade(code: GeneratedCode, criteria: Criterion[], reference?: GeneratedCode): Promise<GradeResult> {
    // temperature 0 + fixed seed: the same code must get the same verdict, so
    // a re-grade (or two identical submissions) can't swap places by chance.
    const text = await this.call(GRADE_SYSTEM_PROMPT,
      buildGradePrompt(code, criteria, reference), { temperature: 0, seed: 7 });
    return parseGradeResult(text);
  }
}
