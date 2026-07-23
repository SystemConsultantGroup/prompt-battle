import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serveStatic } from './http/static.ts';
import { WebSocketServer } from 'ws';
import { openDb, listAccounts, getProblem } from './db/index.ts';
import { GameManager } from './game/GameManager.ts';
import { Hub, type Conn } from './game/hub.ts';

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

export function attachWs(server: http.Server, opts: {
  dbPath: string; adminPassword: string;
}) {
  const db = openDb(opts.dbPath);
  const mgr = new GameManager({
    now: () => Date.now(),
    getProblem: (id) => getProblem(db, id),
  });
  const hub = new Hub(mgr, {
    accountExists: (u) => listAccounts(db).some(a => a.username === u),
    adminPassword: opts.adminPassword,
  });
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    const conn: Conn = {
      role: null, roomCode: null, username: null,
      send: (m) => ws.send(JSON.stringify(m)),
    };
    hub.register(conn);
    ws.on('message', (d) => hub.handle(conn, d.toString()));
    ws.on('close', () => hub.drop(conn));
  });
  return { db, mgr, hub };
}

if (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('server.ts')) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync('data', { recursive: true });
  const port = Number(process.env.PORT ?? 3000);
  const { server } = startServer({ port });
  attachWs(server, {
    dbPath: 'data/app.sqlite',
    adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me',
  });
  console.log(`Prompt Battle on http://localhost:${port}`);
}
