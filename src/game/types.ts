export type Phase = 'LOBBY' | 'PLAYING' | 'GRADING' | 'RESULT';
export type SelectMode = 'direct' | 'roulette' | 'category' | 'variation';

/**
 * Round lengths the host may pick in the lobby. The problem's own
 * `timeLimitSec` is the default; an explicit pick here overrides it for the
 * next round only (a RESTART clears it). Kept as a closed set so a crafted
 * SET_TIME_LIMIT can't hand a room a 10-hour — or zero-second — round.
 */
export const TIME_LIMIT_OPTIONS = [30, 60, 90, 120, 150] as const;
export type TimeLimitOption = (typeof TIME_LIMIT_OPTIONS)[number];
export const isTimeLimitOption = (n: unknown): n is TimeLimitOption =>
  typeof n === 'number' && (TIME_LIMIT_OPTIONS as readonly number[]).includes(n);

export type GeneratedCode = { html: string; css: string; js: string };
export type ItemVerdict = { id: number; passed: boolean; rate: number; reason: string };
export type GradeResult = { items: ItemVerdict[] };
export type ResultItem = {
  description: string; kind: 'basic' | 'detail'; passed: boolean; rate: number;
};
export type PlayerResult = {
  username: string; total: number; basicScore: number; detailScore: number;
  /** The prompt this player submitted — echoed back so the result screen can
   *  show what actually earned the score. */
  prompt: string;
  items: ResultItem[]; genToken?: string;
};
export type PlayerView = { username: string; connected: boolean };

export type RoomSummary = {
  code: string;
  phase: Phase;
  players: PlayerView[];
  maxPlayers: number;
  remainingSec: number | null;
  problemId: number | null;
  activeVariationId: number | null;
  deadline: number | null;
  /** Round length for the *next* round: the host's override if they picked
   *  one, otherwise the selected problem's default. Null until a problem is
   *  selected. Carried in the summary so a host reclaim restores the pick. */
  timeLimitSec: number | null;
  /** The standings of the round that just finished, so a host reclaim — or a
   *  player who refreshes on the result screen — gets the board back instead
   *  of an empty one. Null outside RESULT. */
  ranking: PlayerResult[] | null;
};

// client -> server
export type ClientMsg =
  | { type: 'JOIN'; roomCode: string; username: string }
  | { type: 'HOST_AUTH'; adminPassword: string; roomCode?: string }
  | { type: 'PROMPT_UPDATE'; text: string }
  | { type: 'SELECT_PROBLEM'; mode: SelectMode; problemId?: number; category?: string }
  | { type: 'SET_TIME_LIMIT'; seconds: number }
  | { type: 'START' }
  | { type: 'FORCE_END' }
  | { type: 'RESTART' };

// server -> client
export type ServerMsg =
  | { type: 'STATE'; room: RoomSummary; role: 'host' | 'player'; yourPrompt?: string }
  | { type: 'ERROR'; message: string }
  | { type: 'PLAYER_JOINED'; username: string }
  | { type: 'PLAYER_LEFT'; username: string }
  | { type: 'PROMPT_MIRROR'; username: string; text: string }
  | { type: 'PROBLEM_SELECTED'; problemId: number; timeLimitSec: number }
  | { type: 'TIME_LIMIT_SET'; timeLimitSec: number }
  | { type: 'GAME_START'; problemId: number; deadline: number; variationId: number | null }
  | { type: 'TICK'; remainingSec: number }
  | { type: 'GAME_END' }
  | { type: 'GRADING_PROGRESS'; done: number; total: number }
  | { type: 'RESULT'; ranking: PlayerResult[] }
  | { type: 'ROOM_CLOSED' };
