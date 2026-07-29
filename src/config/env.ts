import { existsSync } from 'node:fs';

/**
 * Load a `.env` file into `process.env` if it exists, using Node's built-in
 * parser (Node >= 24; no dependency). Returns false and does nothing when the
 * file is absent, so tests/CI without a `.env` — and the FakeProvider
 * fallback — keep working. Real shell env vars set before this runs still take
 * effect; the file just fills in what isn't already provided by the caller's
 * environment where the platform allows.
 */
export function loadEnv(path = '.env'): boolean {
  if (!existsSync(path)) return false;
  process.loadEnvFile(path);
  return true;
}
