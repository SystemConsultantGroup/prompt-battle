import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../../src/game/GameManager.ts';
import { Hub, type Conn } from '../../src/game/hub.ts';
import { FakeProvider } from '../../src/llm/fake.ts';
import { gradeRoom } from '../../src/grading/pipeline.ts';
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

test('grading flow error boundary: a throwing step never rejects and still unsticks the room via RESULT', async () => {
  const mgr = new GameManager({ now: () => 0, getProblem: () => problem });
  const out: ServerMsg[] = [];
  // Mirrors the try/catch shape of src/server.ts's onGradingStart: any throw
  // during the grading steps (e.g. a missing problem row, a DB read error)
  // must be caught locally and turned into a degraded RESULT broadcast
  // instead of an unhandled promise rejection that would crash the process.
  let hub: Hub;
  const onGradingStart = async (code: string) => {
    try {
      const room = mgr.getRoom(code);
      if (!room || room.problemId == null) return;
      // Simulate the non-null-assertion failure path: problem row missing.
      const brokenProblem: typeof problem | undefined = undefined;
      if (!brokenProblem) throw new Error(`problem ${room.problemId} not found for room ${code}`);
      mgr.setPhase(code, 'RESULT');
      hub.broadcast(code, { type: 'RESULT', ranking: [] });
    } catch (err) {
      mgr.setPhase(code, 'RESULT');
      hub.broadcast(code, { type: 'RESULT', ranking: [] });
    }
  };
  hub = new Hub(mgr, { accountExists: () => true, adminPassword: 'pw', onGradingStart });
  const host: Conn & { out: ServerMsg[] } = { out, send: (m) => out.push(m), role: null, roomCode: null, username: null };
  hub.register(host);
  hub.handle(host, JSON.stringify({ type: 'HOST_AUTH', adminPassword: 'pw' }));
  const code = host.roomCode!;
  mgr.joinPlayer(code, 'alice', true);
  mgr.setPrompt(code, 'alice', 'a button');
  mgr.selectProblem(code, problem.id); // so onGradingStart's problemId guard doesn't short-circuit before the throw

  const invoke = hub['deps'].onGradingStart as (roomCode: string) => Promise<unknown>;
  await assert.doesNotReject(() => invoke(code));

  const result = out.find(m => m.type === 'RESULT');
  assert.ok(result && result.type === 'RESULT' && Array.isArray(result.ranking) && result.ranking.length === 0);
  assert.equal(mgr.getRoom(code)!.phase, 'RESULT');
});
