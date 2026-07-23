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
export function serveStatic(root: string, req: IncomingMessage, res: ServerResponse): boolean {
  const urlPath = (req.url ?? '/').split('?')[0];
  if (!isSafePath(urlPath)) { res.writeHead(400).end('bad path'); return true; }
  let rel = urlPath === '/' ? '/client/index.html' : urlPath;
  const file = join(root, rel);
  if (!existsSync(file) || !statSync(file).isFile()) return false;
  res.writeHead(200, { 'content-type': contentType(file) });
  createReadStream(file).pipe(res);
  return true;
}
