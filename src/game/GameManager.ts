import type { Phase, RoomSummary } from './types.ts';
import type { Problem } from '../db/index.ts';

export type PlayerState = { username: string; prompt: string };
export type Scheduler = {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
};
export type Room = {
  code: string;
  phase: Phase;
  maxPlayers: number;
  players: Map<string, PlayerState>;
  problemId: number | null;
  deadline: number | null;
  timer: unknown | null;
};
export type GameDeps = {
  now(): number;
  getProblem(id: number): Problem | undefined;
  scheduler?: Scheduler;
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
      players: new Map(), problemId: null, deadline: null, timer: null,
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
      code: room.code,
      phase: room.phase,
      players: [...room.players.values()].map(p => ({ username: p.username })),
      maxPlayers: room.maxPlayers,
      remainingSec,
      problemId: room.problemId,
    };
  }

  private sched(): Scheduler {
    return this.deps.scheduler ?? { setInterval, clearInterval };
  }
  setPrompt(code: string, username: string, text: string) {
    const p = this.rooms.get(code)?.players.get(username);
    if (p) p.prompt = text;
  }
  selectProblem(code: string, problemId: number) {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'not in lobby' };
    const problem = this.deps.getProblem(problemId);
    if (!problem) return { ok: false, error: 'unknown problem' };
    room.problemId = problemId;
    return { ok: true, timeLimitSec: problem.timeLimitSec };
  }
  startGame(code: string, onTick: (s: number) => void, onEnd: () => void) {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (room.problemId == null) return { ok: false, error: 'no problem' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'not in lobby' };
    const problem = this.deps.getProblem(room.problemId)!;
    room.phase = 'PLAYING';
    room.deadline = this.deps.now() + problem.timeLimitSec * 1000;
    room.timer = this.sched().setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.deadline! - this.deps.now()) / 1000));
      onTick(remaining);
      if (this.deps.now() >= room.deadline!) { this.endGame(code); onEnd(); }
    }, 1000);
    return { ok: true, deadline: room.deadline };
  }
  private endGame(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.timer) { this.sched().clearInterval(room.timer); room.timer = null; }
    room.phase = 'GRADING';
  }
  forceEnd(code: string) {
    const room = this.rooms.get(code);
    if (room && room.phase === 'PLAYING') this.endGame(code);
  }
  setPhase(code: string, phase: Phase) {
    const room = this.rooms.get(code); if (room) room.phase = phase;
  }
  restart(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.timer) { this.sched().clearInterval(room.timer); room.timer = null; }
    room.phase = 'LOBBY'; room.problemId = null; room.deadline = null;
    for (const p of room.players.values()) p.prompt = '';
  }
}
