import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import { FakeProvider } from '../../src/llm/fake.ts';
import { gradeRoom } from '../../src/grading/pipeline.ts';
import { attachWs } from '../../src/server.ts';
import type { ServerMsg } from '../../src/game/types.ts';

const problem = { id: 1, title: 't', category: 'c', difficulty: 'easy',
  timeLimitSec: 1, targetHtml: '', targetCss: '', targetJs: '',
  detailWeight: 0.3, createdAt: '' };
const criteria = [{ id: 1, problemId: 1, kind: 'basic' as const, description: 'button', sortOrder: 0 }];

test('grading flow broadcasts progress then RESULT', async () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const out: ServerMsg[] = [];
  const hub = new Hub(mgr, {
    accountExists: () => true, adminPassword: 'pw',
    onGradingStart: async (code) => {
      const room = mgr.getRoom(code)!;
      const subs = [...room.players.values()].map(p => ({ username: p.username, prompt: p.prompt }));
      const results = await gradeRoom({ provider: new FakeProvider(), problem, criteria,
        submissions: subs, onProgress: (d, t) => hub.broadcast(code, { type: 'GRADING_PROGRESS', done: d, total: t }) });
      mgr.setPhase(code, 'RESULT');
      hub.broadcast(code, { type: 'RESULT', ranking: results });
    },
  });
  const host: Conn & { out: ServerMsg[] } = { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPrompt(code, 'alice', 'a button');
  await hub['deps'].onGradingStart(code);
  assert.ok(out.some(m => m.type === 'GRADING_PROGRESS'));
  const result = out.find(m => m.type === 'RESULT');
  assert.ok(result && result.type === 'RESULT' && result.ranking[0].username === 'alice');
});

test('onGradingStart error boundary: missing problem does not reject and unsticks room with RESULT[]', async () => {
  // Drives the REAL onGradingStart closure from src/server.ts's attachWs
  // (not a hand-rolled copy), so removing the try/catch there would make
  // this test fail: the missing-problem throw would surface as an
  // unhandled rejection and no recovery RESULT[] would be broadcast.
  const server = http.createServer(); // do NOT call server.listen()
  const { mgr, hub, db } = attachWs(server, { dbPath: ':memory:', adminPassword: 'pw' });

  const out: ServerMsg[] = [];
  const conn: Conn = { send: (m) => out.push(m), role: null, roomCode: null, username: null };
  hub.register(conn);
  hub.handle(conn, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = conn.roomCode!; // room created by HOST_AUTH

  // Force the failure branch: point the room at a problemId with no DB row,
  // so the real onGradingStart's `getProblem(db, room.problemId)` returns
  // undefined and its `if (!problem) throw ...` fires.
  mgr.getRoom(code)!.problemId = 99999;

  out.length = 0; // ignore the STATE broadcast from HOST_AUTH
  const invoke = hub['deps'].onGradingStart as (roomCode: string) => Promise<unknown>;
  await assert.doesNotReject(() => invoke(code));

  const result = out.find(m => m.type === 'RESULT');
  assert.ok(result && result.type === 'RESULT' && Array.isArray(result.ranking) && result.ranking.length === 0);
  assert.equal(mgr.getRoom(code)!.phase, 'RESULT');

  server.close();
  db.close();
});
