import type { GameManager } from './GameManager.ts';
import type { ClientMsg, ServerMsg } from './types.ts';
import { resolveSelection } from './select.ts';

export interface Conn {
  send(msg: ServerMsg): void;
  role: 'host' | 'player' | null;
  roomCode: string | null;
  username: string | null;
}
export type HubDeps = {
  accountExists(username: string): boolean;
  adminPassword: string;
  onGradingStart(roomCode: string): void; // Task 17 wires the grading pipeline
  listProblems(): import('../db/index.ts').Problem[];
};

export class Hub {
  private conns = new Set<Conn>();
  constructor(private mgr: GameManager, private deps: HubDeps) {}

  register(conn: Conn) { this.conns.add(conn); }
  drop(conn: Conn) {
    this.conns.delete(conn);
    if (conn.role === 'player' && conn.roomCode && conn.username) {
      this.mgr.removePlayer(conn.roomCode, conn.username);
      this.broadcast(conn.roomCode, { type: 'PLAYER_LEFT', username: conn.username });
    }
  }

  broadcast(roomCode: string, msg: ServerMsg, opts: { hostOnly?: boolean } = {}) {
    for (const c of this.conns) {
      if (c.roomCode !== roomCode) continue;
      if (opts.hostOnly && c.role !== 'host') continue;
      c.send(msg);
    }
  }

  handle(conn: Conn, raw: string) {
    let msg: ClientMsg;
    try { msg = JSON.parse(raw) as ClientMsg; }
    catch { conn.send({ type: 'ERROR', message: 'bad json' }); return; }

    if (msg.type === 'HOST_AUTH') {
      if (msg.adminPassword !== this.deps.adminPassword) {
        conn.send({ type: 'ERROR', message: 'bad admin password' }); return;
      }
      const code = this.mgr.createRoom({ maxPlayers: 8 });
      conn.role = 'host'; conn.roomCode = code;
      conn.send({ type: 'STATE', room: this.mgr.summary(code), role: 'host' });
      return;
    }
    if (msg.type === 'JOIN') {
      const res = this.mgr.joinPlayer(msg.roomCode, msg.username,
        this.deps.accountExists(msg.username));
      if (!res.ok) { conn.send({ type: 'ERROR', message: res.error! }); return; }
      conn.role = 'player'; conn.roomCode = msg.roomCode; conn.username = msg.username;
      conn.send({ type: 'STATE', room: this.mgr.summary(msg.roomCode), role: 'player' });
      this.broadcast(msg.roomCode, { type: 'PLAYER_JOINED', username: msg.username });
      return;
    }
    if (conn.role === 'player' && msg.type === 'PROMPT_UPDATE') {
      if (!conn.roomCode || !conn.username) return;
      this.mgr.setPrompt(conn.roomCode, conn.username, msg.text);
      this.broadcast(conn.roomCode,
        { type: 'PROMPT_MIRROR', username: conn.username, text: msg.text },
        { hostOnly: true });
      return;
    }
    if (conn.role !== 'host' || !conn.roomCode) {
      conn.send({ type: 'ERROR', message: 'not host' }); return;
    }
    const code = conn.roomCode;
    if (msg.type === 'SELECT_PROBLEM') {
      const sel = resolveSelection(this.deps.listProblems(), msg.mode,
        { problemId: msg.problemId, category: msg.category });
      if ('error' in sel) { conn.send({ type: 'ERROR', message: sel.error }); return; }
      const res = this.mgr.selectProblem(code, sel.problem.id);
      if (!res.ok) { conn.send({ type: 'ERROR', message: res.error! }); return; }
      this.broadcast(code, { type: 'PROBLEM_SELECTED', problemId: sel.problem.id, timeLimitSec: res.timeLimitSec! });
      return;
    }
    if (msg.type === 'START') {
      const room = this.mgr.getRoom(code);
      const res = this.mgr.startGame(code,
        (s) => this.broadcast(code, { type: 'TICK', remainingSec: s }),
        () => { this.broadcast(code, { type: 'GAME_END' }); this.deps.onGradingStart(code); });
      if (!res.ok) { conn.send({ type: 'ERROR', message: res.error! }); return; }
      this.broadcast(code, { type: 'GAME_START', problemId: room!.problemId!, deadline: res.deadline! });
      return;
    }
    if (msg.type === 'FORCE_END') {
      this.mgr.forceEnd(code);
      this.broadcast(code, { type: 'GAME_END' });
      this.deps.onGradingStart(code);
      return;
    }
    if (msg.type === 'RESTART') {
      this.mgr.restart(code);
      this.broadcast(code, { type: 'STATE', room: this.mgr.summary(code), role: 'host' });
      // players also need fresh STATE:
      this.broadcast(code, { type: 'STATE', room: this.mgr.summary(code), role: 'player' });
      return;
    }
    conn.send({ type: 'ERROR', message: `unhandled: ${msg.type}` });
  }
}
