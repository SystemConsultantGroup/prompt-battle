import { isTimeLimitOption, type Phase, type PlayerResult, type RoomSummary } from './types.ts';
import type { Problem } from '../db/index.ts';

export type PlayerState = {
  username: string; prompt: string; connected: boolean;
  /** Pending abandonment-sweep timer (set while disconnected mid-game). */
  sweepTimer?: unknown | null;
};
export type Scheduler = {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};
export type Room = {
  code: string;
  phase: Phase;
  maxPlayers: number;
  players: Map<string, PlayerState>;
  problemId: number | null;
  activeVariationId: number | null;
  /** Effective round length. Seeded from the problem on selection, then
   *  replaced by `setTimeLimit` if the host picks a different one. */
  timeLimitSec: number | null;
  /** Title of the armed problem, mirrored here so the summary can name it
   *  without every client needing admin-gated access to the catalogue. */
  problemTitle: string | null;
  deadline: number | null;
  /** Standings of the last graded round, kept for the whole RESULT phase so a
   *  reconnecting host or player can be handed the board in their STATE. */
  ranking: PlayerResult[] | null;
  timer: unknown | null;
  evictTimer: unknown | null;
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
      players: new Map(), problemId: null, activeVariationId: null,
      timeLimitSec: null, problemTitle: null, deadline: null, ranking: null,
      timer: null, evictTimer: null,
    });
    return code;
  }
  getRoom(code: string): Room | undefined { return this.rooms.get(code); }

  joinPlayer(code: string, username: string, allowed: boolean):
      { ok: boolean; error?: string; reconnected?: boolean } {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (!allowed) return { ok: false, error: 'unknown account' };
    const existing = room.players.get(username);
    if (existing) {
      if (existing.connected) return { ok: false, error: 'name in use' };
      existing.connected = true;
      if (existing.sweepTimer) {
        this.sched().clearTimeout(existing.sweepTimer);
        existing.sweepTimer = null;
      }
      return { ok: true, reconnected: true };
    }
    if (room.phase !== 'LOBBY') return { ok: false, error: 'game in progress' };
    if (room.players.size >= room.maxPlayers) return { ok: false, error: 'room full' };
    room.players.set(username, { username, prompt: '', connected: true });
    return { ok: true };
  }
  removePlayer(code: string, username: string): void {
    this.rooms.get(code)?.players.delete(username);
  }
  /**
   * Flip a player to disconnected. When `opts` is given, also schedule an
   * abandonment sweep: if they don't reconnect within `graceMs`, drop the
   * slot entirely and invoke `onSweep`. Reconnecting cancels the sweep (see
   * `joinPlayer`). The 2-arg form is a plain flag flip with no timer.
   */
  markDisconnected(
    code: string, username: string,
    opts?: { graceMs: number; onSweep: (code: string, username: string) => void },
  ): void {
    const room = this.rooms.get(code);
    const p = room?.players.get(username);
    if (!p || !room) return;
    p.connected = false;
    if (!opts) return;
    if (p.sweepTimer) this.sched().clearTimeout(p.sweepTimer);
    p.sweepTimer = this.sched().setTimeout(() => {
      // The real reconnect path (joinPlayer) already cancels this timer; the
      // guard is belt-and-suspenders. Clear our handle either way so no stale
      // reference lingers on a slot that survives.
      const pl = room.players.get(username);
      if (!pl || pl.connected) { if (pl) pl.sweepTimer = null; return; }
      pl.sweepTimer = null;
      room.players.delete(username);
      opts.onSweep(code, username);
    }, opts.graceMs);
  }
  getPrompt(code: string, username: string): string {
    return this.rooms.get(code)?.players.get(username)?.prompt ?? '';
  }

  summary(code: string): RoomSummary {
    const room = this.rooms.get(code);
    if (!room) throw new Error('unknown room');
    const remainingSec = room.deadline == null ? null
      : Math.max(0, Math.ceil((room.deadline - this.deps.now()) / 1000));
    return {
      code: room.code,
      phase: room.phase,
      players: [...room.players.values()].map(p => ({ username: p.username, connected: p.connected })),
      maxPlayers: room.maxPlayers,
      remainingSec,
      problemId: room.problemId,
      activeVariationId: room.activeVariationId,
      timeLimitSec: room.timeLimitSec,
      problemTitle: room.problemTitle,
      deadline: room.deadline,
      ranking: room.ranking,
    };
  }

  private sched(): Scheduler {
    return this.deps.scheduler ?? { setInterval, clearInterval, setTimeout, clearTimeout };
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
    room.problemTitle = problem.title;
    room.activeVariationId = null;
    // Picking a problem re-seeds the round length from that problem's default.
    // A host who wants something else picks it again after selecting — this
    // way the displayed time always belongs to the problem now on screen.
    room.timeLimitSec = problem.timeLimitSec;
    return { ok: true, timeLimitSec: problem.timeLimitSec, title: problem.title };
  }
  /**
   * Override the round length for the next round. Lobby-only (changing it
   * mid-round would desync every client's countdown against `deadline`), and
   * restricted to the offered options.
   */
  setTimeLimit(code: string, seconds: number):
      { ok: boolean; error?: string; timeLimitSec?: number } {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'not in lobby' };
    if (!isTimeLimitOption(seconds)) return { ok: false, error: 'bad time limit' };
    room.timeLimitSec = seconds;
    return { ok: true, timeLimitSec: seconds };
  }
  /** Record the finished round's standings so they survive a reconnect. */
  setResults(code: string, ranking: PlayerResult[]): void {
    const room = this.rooms.get(code);
    if (room) room.ranking = ranking;
  }
  setActiveVariation(code: string, variationId: number | null): void {
    const room = this.rooms.get(code);
    if (room) room.activeVariationId = variationId;
  }
  startGame(code: string, onTick: (s: number) => void, onEnd: () => void) {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'unknown room' };
    if (room.problemId == null) return { ok: false, error: 'no problem' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'not in lobby' };
    const problem = this.deps.getProblem(room.problemId)!;
    room.phase = 'PLAYING';
    // A new round supersedes the old board — drop it now so a mid-round
    // reconnect can't be handed last round's results.
    room.ranking = null;
    const seconds = room.timeLimitSec ?? problem.timeLimitSec;
    room.deadline = this.deps.now() + seconds * 1000;
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
  /** End a PLAYING round early. Returns true only if it actually transitioned
   *  (idempotent): a second call once the room is already GRADING is a no-op,
   *  so a double-clicked "End now" can't kick off grading twice. */
  forceEnd(code: string): boolean {
    const room = this.rooms.get(code);
    if (room && room.phase === 'PLAYING') { this.endGame(code); return true; }
    return false;
  }
  setPhase(code: string, phase: Phase) {
    const room = this.rooms.get(code); if (room) room.phase = phase;
  }
  restart(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.timer) { this.sched().clearInterval(room.timer); room.timer = null; }
    room.phase = 'LOBBY'; room.problemId = null; room.problemTitle = null;
    room.activeVariationId = null;
    room.timeLimitSec = null; room.deadline = null; room.ranking = null;
    for (const p of room.players.values()) p.prompt = '';
  }
  removeRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.timer) { this.sched().clearInterval(room.timer); room.timer = null; }
    if (room.evictTimer) { this.sched().clearTimeout(room.evictTimer); room.evictTimer = null; }
    for (const p of room.players.values()) {
      if (p.sweepTimer) { this.sched().clearTimeout(p.sweepTimer); p.sweepTimer = null; }
    }
    this.rooms.delete(code);
  }

  /**
   * Host connection dropped: start a grace-period timer instead of evicting
   * immediately, so a brief reconnect (see `hostReclaimed`) can save the
   * room. If a grace timer is already pending, restart it.
   */
  hostDisconnected(code: string, graceMs: number, onEvict: (code: string) => void): void {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.evictTimer) { this.sched().clearTimeout(room.evictTimer); room.evictTimer = null; }
    room.evictTimer = this.sched().setTimeout(() => {
      const r = this.rooms.get(code);
      if (!r) return;
      r.evictTimer = null;
      this.removeRoom(code);
      onEvict(code);
    }, graceMs);
  }
  /** Host reconnected before the grace period elapsed: cancel the pending eviction. */
  hostReclaimed(code: string): void {
    const room = this.rooms.get(code);
    if (room?.evictTimer) { this.sched().clearTimeout(room.evictTimer); room.evictTimer = null; }
  }
}
