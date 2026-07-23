import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serveStatic } from './http/static.ts';

const PUBLIC_ROOT = fileURLToPath(new URL('../public', import.meta.url));

export function startServer(opts: { port: number }) {
  const server = http.createServer((req, res) => {
    if (serveStatic(PUBLIC_ROOT, req, res)) return;
    res.writeHead(404).end('not found');
  });
  server.listen(opts.port);
  return {
    server,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

if (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('server.ts')) {
  const port = Number(process.env.PORT ?? 3000);
  startServer({ port });
  console.log(`Prompt Battle on http://localhost:${port}`);
}
