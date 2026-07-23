import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serveStatic } from './http/static.ts';
import { renderDoc, GenStore } from './http/render.ts';
import { handleApi } from './admin/routes.ts';
import { WebSocketServer } from 'ws';
import { openDb, listAccounts, getProblem, listCriteria, type Database } from './db/index.ts';
import { GameManager } from './game/GameManager.ts';
import { Hub, type Conn } from './game/hub.ts';
import { gradeRoom } from './grading/pipeline.ts';
import { ClaudeProvider } from './llm/claude.ts';
import { FakeProvider } from './llm/fake.ts';
import type { LLMProvider } from './llm/provider.ts';

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
  const provider: LLMProvider = process.env.ANTHROPIC_API_KEY
    ? new ClaudeProvider({ apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.CLAUDE_MODEL ?? 'claude-opus-4-8' })
    : (console.warn('No ANTHROPIC_API_KEY — using FakeProvider'), new FakeProvider());

  const mgr = new GameManager({
    now: () => Date.now(),
    getProblem: (id) => getProblem(db, id),
  });

  let hub: Hub;
  const onGradingStart = async (code: string) => {
    try {
      const room = mgr.getRoom(code);
      if (!room || room.problemId == null) return;
      const problem = getProblem(db, room.problemId);
      if (!problem) throw new Error(`problem ${room.problemId} not found for room ${code}`);
      const criteria = listCriteria(db, problem.id);
      const subs = [...room.players.values()].map(p => ({ username: p.username, prompt: p.prompt }));
      genStore.clear();
      const results = await gradeRoom({
        provider, problem, criteria, submissions: subs,
        onProgress: (done, total) => hub.broadcast(code, { type: 'GRADING_PROGRESS', done, total }),
      });
      mgr.setPhase(code, 'RESULT');
      hub.broadcast(code, { type: 'RESULT', ranking: results });
    } catch (err) {
      // Grading must never leave an unhandled rejection: this hook is invoked
      // fire-and-forget from Hub (see src/game/hub.ts), so any throw here
      // would crash the whole process. Log and unstick the room instead.
      console.error('[grading] failed for room', code, err);
      mgr.setPhase(code, 'RESULT');
      hub.broadcast(code, { type: 'RESULT', ranking: [] });
    }
  };

  hub = new Hub(mgr, {
    accountExists: (u) => listAccounts(db).some(a => a.username === u),
    adminPassword: opts.adminPassword,
    onGradingStart,
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
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'change-me';
  const { server } = startServer({
    port,
    onRequest: (req, res) => {
      if ((req.url ?? '').startsWith('/api/')) {
        handleApi(db, adminPassword, req, res).catch(() =>
          res.writeHead(500).end('err'));
        return true;
      }
      return router?.(req, res) ?? false;
    },
  });
  const { db, genStore } = attachWs(server, {
    dbPath: 'data/app.sqlite',
    adminPassword,
  });
  router = makeRouter(db, genStore);

  console.log(`Prompt Battle on http://localhost:${port}`);
}
