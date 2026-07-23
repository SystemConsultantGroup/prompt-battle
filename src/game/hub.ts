import type { GameManager } from './GameManager.ts';
import type { ClientMsg, ServerMsg } from './types.ts';

export interface Conn {
  send(msg: ServerMsg): void;
  role: 'host' | 'player' | null;
  roomCode: string | null;
  username: string | null;
}
export type HubDeps = {
  accountExists(username: string): boolean;
  adminPassword: string;
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
    // later tasks extend: PROMPT_UPDATE, SELECT_PROBLEM, START, FORCE_END, RESTART
    conn.send({ type: 'ERROR', message: `unhandled: ${msg.type}` });
  }
}
