import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
export function contentType(path: string): string {
  return TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}
export function isSafePath(urlPath: string): boolean {
  const decoded = decodeURIComponent(urlPath);
  return !decoded.includes('..');
}

/**
 * Resolve a URL path to an existing file under `root`, or null. Directory
 * requests resolve to their `index.html` so the advertised entry points
 * (`/host/`, `/client/`, `/admin/`, and bare `/host`) work, not just the
 * explicit `.../index.html`. Returns null for traversal, missing files, and
 * directories without an index.
 */
export function resolveFile(root: string, urlPath: string): string | null {
  if (!isSafePath(urlPath)) return null;
  if (urlPath === '/') urlPath = '/client/';
  const candidate = join(root, urlPath);
  // Trailing slash or an existing directory → its index.html.
  if (urlPath.endsWith('/')) {
    const index = join(candidate, 'index.html');
    return existsSync(index) && statSync(index).isFile() ? index : null;
  }
  if (existsSync(candidate)) {
    if (statSync(candidate).isFile()) return candidate;
    if (statSync(candidate).isDirectory()) {
      const index = join(candidate, 'index.html');
      return existsSync(index) && statSync(index).isFile() ? index : null;
    }
  }
  return null;
}

export function serveStatic(root: string, req: IncomingMessage, res: ServerResponse): boolean {
  const urlPath = (req.url ?? '/').split('?')[0];
  if (!isSafePath(urlPath)) { res.writeHead(400).end('bad path'); return true; }
  const file = resolveFile(root, urlPath);
  if (!file) return false;
  res.writeHead(200, { 'content-type': contentType(file) });
  createReadStream(file).pipe(res);
  return true;
}
