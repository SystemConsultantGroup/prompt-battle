import type { Phase, RoomSummary } from './types.ts';
import type { Problem } from '../db/index.ts';

export type PlayerState = { username: string; prompt: string };
export type Room = {
  code: string;
  phase: Phase;
  maxPlayers: number;
  players: Map<string, PlayerState>;
  problemId: number | null;
  deadline: number | null;
};
export type GameDeps = {
  now(): number;
  getProblem(id: number): Problem | undefined;
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class GameManager {
  private rooms = new Map<string, Room>();
  private codeFactory: () => string;
  constructor(private deps: GameDeps) {
    this.codeFactory = () => {
      let s = '';
      for (let i = 0; i < 4; i++) {
        s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      return s;
    };
  }
  setRoomCodeFactory(fn: () => string) { this.codeFactory = fn; }

  createRoom(opts: { maxPlayers: number }): string {
    let code = this.codeFactory();
    while (this.rooms.has(code)) code = this.codeFactory();
    this.rooms.set(code, {
      code, phase: 'LOBBY', maxPlayers: opts.maxPlayers,
      players: new Map(), problemId: null, deadline: null,
    });
    return code;
  }
  getRoom(code: string): Room | undefined { return this.rooms.get(code); }

  joinPlayer(code: string, username: string, allowed: boolean): { ok: boolean; error?: string } {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (!allowed) return { ok: false, error: 'unknown account' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'game in progress' };
    if (room.players.has(username)) return { ok: false, error: 'name in use' };
    if (room.players.size >= room.maxPlayers) return { ok: false, error: 'room full' };
    room.players.set(username, { username, prompt: '' });
    return { ok: true };
  }
  removePlayer(code: string, username: string): void {
    this.rooms.get(code)?.players.delete(username);
  }

  summary(code: string): RoomSummary {
    const room = this.rooms.get(code);
    if (!room) throw new Error('unknown room');
    const remainingSec = room.deadline == null ? null
      : Math.max(0, Math.ceil((room.deadline - this.deps.now()) / 1000));
    return {
      phase: room.phase,
      players: [...room.players.values()].map(p => ({ username: p.username })),
      maxPlayers: room.maxPlayers,
      remainingSec,
      problemId: room.problemId,
    };
  }
}
