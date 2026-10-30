import type { LLMProvider, SystemConstraints } from './provider.ts';
import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';
import { buildGradePrompt, GRADE_SYSTEM_PROMPT } from './sanitize.ts';
import { extractJson, parseGradeResult } from './extract.ts';

type Opts = { apiKey: string; model: string; fetchImpl?: typeof fetch };

/**
 * Stateless Responses API provider. Prompts and JSON parsing are shared with
 * ClaudeProvider. JSON mode uses text.format; prompts must mention "JSON".
 */
export class OpenAIProvider implements LLMProvider {
  private f: typeof fetch;
  constructor(private opts: Opts) { this.f = opts.fetchImpl ?? fetch; }

  private async call(system: string, user: string): Promise<string> {
    const res = await this.f('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model,
        // Includes reasoning tokens as well as the visible JSON output.
        max_output_tokens: 16384,
        store: false,
        instructions: system,
        // JSON mode validates input messages, not just top-level instructions.
        input: [
          { role: 'developer', content: 'Respond only with a JSON object.' },
          { role: 'user', content: user },
        ],
        text: { format: { type: 'json_object' } },
      }),
    });
    if (!res.ok) {
      // Fetch does not include the API's diagnostic body in its status error.
      // Keep the useful fields, but bound output and never echo our API key.
      let detail = '';
      try {
        const body = await res.text();
        detail = body;
        try {
          const error = JSON.parse(body)?.error;
          if (error && typeof error === 'object') {
            detail = ['message', 'type', 'code', 'param']
              .filter(key => typeof error[key] === 'string' && error[key])
              .map(key => `${key}: ${error[key]}`).join('; ');
          }
        } catch { /* Non-JSON error bodies are still useful diagnostics. */ }
      } catch { /* Preserve the HTTP status even if reading the body fails. */ }
      if (this.opts.apiKey) detail = detail.split(this.opts.apiKey).join('[REDACTED]');
      detail = detail.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 2000);
      throw new Error(`openai ${res.status}${detail ? `: ${detail}` : ''}`);
    }
    const data = await res.json() as {
      status?: string;
      incomplete_details?: { reason?: string };
      error?: { code?: string };
      output?: {
        type: string;
        role?: string;
        content?: { type: string; text?: string }[];
      }[];
    };
    if (data.status !== 'completed') {
      throw new Error(`openai response ${data.status ?? 'invalid'}: ${
        data.incomplete_details?.reason ?? data.error?.code ?? 'not completed'}`);
    }
    // Raw REST responses have no SDK output_text helper. Reasoning/tool items
    // may precede the assistant message, so never assume output[0] is text.
    const content = (data.output ?? [])
      .filter(item => item.type === 'message' && item.role === 'assistant')
      .flatMap(item => item.content ?? []);
    if (content.some(part => part.type === 'refusal')) {
      throw new Error('openai response refused');
    }
    const text = content.filter(part => part.type === 'output_text')
      .map(part => part.text ?? '').join('');
    if (!text.trim()) throw new Error('openai response missing output text');
    return text;
  }

  async implement(userPrompt: string, c: SystemConstraints): Promise<GeneratedCode> {
    const text = await this.call(c.systemPrompt, userPrompt);
    const obj = extractJson(text);
    return { html: String(obj.html ?? ''), css: String(obj.css ?? ''), js: String(obj.js ?? '') };
  }

  async grade(code: GeneratedCode, criteria: Criterion[], reference?: GeneratedCode): Promise<GradeResult> {
    // Responses has no seed parameter; GPT-5 nano also rejects temperature.
    // Consistency relies on the anchored rubric, not deterministic sampling.
    const text = await this.call(GRADE_SYSTEM_PROMPT,
      buildGradePrompt(code, criteria, reference));
    return parseGradeResult(text);
  }
}
