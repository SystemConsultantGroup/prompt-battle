import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serveStatic } from './http/static.ts';
import { renderDoc, GenStore } from './http/render.ts';
import { WebSocketServer } from 'ws';
import { openDb, listAccounts, getProblem, type Database } from './db/index.ts';
import { GameManager } from './game/GameManager.ts';
import { Hub, type Conn } from './game/hub.ts';

const PUBLIC_ROOT = fileURLToPath(new URL('../public', import.meta.url));

export function startServer(opts: {
  port: number;
  onRequest?: (req: http.IncomingMessage, res: http.ServerResponse) => boolean;
}) {
  const server = http.createServer((req, res) => {
    if (opts.onRequest?.(req, res)) return;
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
  const genStore = new GenStore();
  const mgr = new GameManager({
    now: () => Date.now(),
    getProblem: (id) => getProblem(db, id),
  });
  const hub = new Hub(mgr, {
    accountExists: (u) => listAccounts(db).some(a => a.username === u),
    adminPassword: opts.adminPassword,
    onGradingStart: () => {},
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
  return { db, mgr, hub, genStore };
}

export function makeRouter(db: Database, genStore: GenStore) {
  return (req: http.IncomingMessage, res: http.ServerResponse): boolean => {
    const url = (req.url ?? '').split('?')[0];
    let m = url.match(/^\/render\/target\/(\d+)$/);
    if (m) {
      const p = getProblem(db, Number(m[1]));
      if (!p) { res.writeHead(404).end('no problem'); return true; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderDoc({ html: p.targetHtml, css: p.targetCss, js: p.targetJs }));
      return true;
    }
    m = url.match(/^\/render\/gen\/([a-z0-9]+)$/);
    if (m) {
      const code = genStore.get(m[1]);
      if (!code) { res.writeHead(404).end('no render'); return true; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderDoc(code));
      return true;
    }
    return false;
  };
}

if (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('server.ts')) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync('data', { recursive: true });
  const port = Number(process.env.PORT ?? 3000);

  // The HTTP request router depends on `db`/`genStore`, which only exist
  // once `attachWs` runs — but `attachWs` needs the `http.Server` that
  // `startServer` creates. Start the server with an indirection closure so
  // both share the same instances, then wire the real router in once ready.
  let router: ((req: http.IncomingMessage, res: http.ServerResponse) => boolean) | undefined;
  const { server } = startServer({ port, onRequest: (req, res) => router?.(req, res) ?? false });
  const { db, genStore } = attachWs(server, {
    dbPath: 'data/app.sqlite',
    adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me',
  });
  router = makeRouter(db, genStore);

  console.log(`Prompt Battle on http://localhost:${port}`);
}
