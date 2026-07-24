import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison, used for secret comparisons (e.g. admin
 * password checks) to avoid leaking information via response-time
 * differences. `timingSafeEqual` throws on unequal-length buffers, so we
 * short-circuit on length first — that early return is length-only (a
 * standard, accepted leak) and never touches the buffer contents.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
