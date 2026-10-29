import type { GeneratedCode } from '../game/types.ts';

/**
 * Deterministic "how close is the generated code to the target code" score.
 *
 * The LLM rubric judges each criterion on a coarse 0–4 scale, so two decent
 * submissions often land on the same total. This metric is the fine-grained,
 * reproducible complement: it compares the reference (target) code against
 * the generated code directly, with no model in the loop, so the same pair of
 * documents always yields the same number. Three parts:
 *
 *  - style:     every CSS declaration in the reference is matched against the
 *               generated declarations of the same property; values score by
 *               closeness (colors by RGB distance, lengths by ratio).
 *  - text:      visible-text token overlap (F1).
 *  - structure: element tag multiset overlap (F1).
 *
 * Selectors and class names are ignored on purpose: players describe a look,
 * not our class names, so only *what* is rendered counts.
 */
export const FIDELITY_PARTS = { style: 0.5, text: 0.3, structure: 0.2 } as const;

export type Fidelity = { style: number; text: number; structure: number; score: number };

export function computeFidelity(reference: GeneratedCode, generated: GeneratedCode): Fidelity {
  const style = styleSimilarity(reference, generated);
  const text = f1(textTokens(reference.html), textTokens(generated.html));
  const structure = f1(tagTokens(reference.html), tagTokens(generated.html));
  const score = style * FIDELITY_PARTS.style + text * FIDELITY_PARTS.text
    + structure * FIDELITY_PARTS.structure;
  return { style, text, structure, score };
}

// ---------------------------------------------------------------- multisets

function counts(xs: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

/** Multiset F1. Two empty sides are a perfect match (nothing to reproduce). */
function f1(ref: string[], gen: string[]): number {
  if (ref.length === 0 && gen.length === 0) return 1;
  if (ref.length === 0 || gen.length === 0) return 0;
  const a = counts(ref), b = counts(gen);
  let hit = 0;
  for (const [k, n] of a) hit += Math.min(n, b.get(k) ?? 0);
  const p = hit / gen.length, r = hit / ref.length;
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

// ---------------------------------------------------------------- html

const NON_VISUAL = /<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi;
const IGNORED_TAGS = new Set(['html', 'head', 'body', 'meta', 'title', 'link', 'script', 'style', 'template']);

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

export function textTokens(html: string): string[] {
  const text = stripComments(html).replace(NON_VISUAL, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .toLowerCase();
  // Letters/digits in any script (Korean included) form words; everything
  // else is a separator. Single symbols like "+" or "×" are kept as tokens.
  return text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

export function tagTokens(html: string): string[] {
  const out: string[] = [];
  for (const m of stripComments(html).replace(NON_VISUAL, ' ').matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\b/g)) {
    const tag = m[1].toLowerCase();
    if (!IGNORED_TAGS.has(tag)) out.push(tag);
  }
  return out;
}

// ---------------------------------------------------------------- css

type Decl = { prop: string; value: string };

/** All declarations from the stylesheet plus inline style="" attributes. */
export function declarations(code: GeneratedCode): Decl[] {
  const inline = [...code.html.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)]
    .map(m => m[2] ?? m[3] ?? '');
  const css = code.css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bodies = [...css.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
  const out: Decl[] = [];
  for (const body of [...bodies, ...inline]) {
    for (const part of body.split(';')) {
      const i = part.indexOf(':');
      if (i < 0) continue;
      const prop = part.slice(0, i).trim().toLowerCase();
      const value = part.slice(i + 1).replace(/!important/i, '').trim().toLowerCase();
      if (!prop || !value || prop.startsWith('--')) continue;
      out.push({ prop, value });
    }
  }
  return out;
}

function styleSimilarity(reference: GeneratedCode, generated: GeneratedCode): number {
  const ref = declarations(reference);
  if (ref.length === 0) return 1;
  const byProp = new Map<string, string[]>();
  for (const d of declarations(generated)) {
    const xs = byProp.get(d.prop) ?? [];
    xs.push(d.value);
    byProp.set(d.prop, xs);
  }
  let sum = 0;
  for (const d of ref) {
    const candidates = byProp.get(d.prop) ?? [];
    let best = 0;
    for (const v of candidates) {
      best = Math.max(best, valueSimilarity(d.value, v));
      if (best === 1) break;
    }
    sum += best;
  }
  return sum / ref.length;
}

/** Split a CSS value into top-level tokens (spaces/commas outside parens). */
function valueTokens(v: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ' ' || ch === ',' || ch === '/')) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function valueSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ta = valueTokens(a), tb = valueTokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  // Token-wise best alignment, averaged over the reference tokens and
  // penalised for a different token count (e.g. "0 4px 12px #000" vs "none").
  let sum = 0;
  for (const x of ta) {
    let best = 0;
    for (const y of tb) best = Math.max(best, tokenSimilarity(x, y));
    sum += best;
  }
  const lenPenalty = Math.min(ta.length, tb.length) / Math.max(ta.length, tb.length);
  return (sum / ta.length) * (0.5 + 0.5 * lenPenalty);
}

function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ca = parseColor(a), cb = parseColor(b);
  if (ca && cb) return colorSimilarity(ca, cb);
  const la = parseLength(a), lb = parseLength(b);
  if (la && lb && la.unit === lb.unit) return lengthSimilarity(la.n, lb.n);
  return 0;
}

// Lengths: equal → 1, linear fall-off to 0 at a 2x (or ½x) ratio. Zero only
// matches zero. rem/em are folded to px at 16 so "1rem" and "16px" agree.
function parseLength(t: string): { n: number; unit: string } | null {
  const m = t.match(/^(-?\d*\.?\d+)([a-z%]*)$/);
  if (!m) return null;
  let n = Number(m[1]);
  let unit = m[2];
  if (unit === 'rem' || unit === 'em') { n *= 16; unit = 'px'; }
  if (n === 0) unit = '';  // 0, 0px, 0% are all "zero"
  return { n, unit };
}

function lengthSimilarity(a: number, b: number): number {
  if (a === b) return 1;
  if (a === 0 || b === 0 || Math.sign(a) !== Math.sign(b)) return 0;
  const ratio = Math.max(Math.abs(a), Math.abs(b)) / Math.min(Math.abs(a), Math.abs(b));
  return Math.max(0, 1 - (ratio - 1));
}

// Colors: compared in RGB(A). Identical → 1, linear fall-off to 0 at a
// Euclidean distance of 160 (≈ "clearly a different color").
type RGBA = [number, number, number, number];

const NAMED: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff',
  yellow: '#ffff00', orange: '#ffa500', purple: '#800080', gray: '#808080', grey: '#808080',
  silver: '#c0c0c0', navy: '#000080', teal: '#008080', pink: '#ffc0cb', transparent: '#00000000',
};

export function parseColor(t: string): RGBA | null {
  const s = NAMED[t] ?? t;
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const ch = (x: string) => x.endsWith('%') ? Number(x.slice(0, -1)) * 2.55 : Number(x);
    const alpha = p[3] == null ? 1 : p[3].endsWith('%') ? Number(p[3].slice(0, -1)) / 100 : Number(p[3]);
    const c: RGBA = [ch(p[0]), ch(p[1]), ch(p[2]), alpha];
    return c.every(Number.isFinite) ? c : null;
  }
  return null;
}

function colorSimilarity(a: RGBA, b: RGBA): number {
  const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], (a[3] - b[3]) * 255);
  return Math.max(0, 1 - d / 160);
}
