export type Phase = 'LOBBY' | 'PLAYING' | 'GRADING' | 'RESULT';
export type SelectMode = 'direct' | 'roulette' | 'category' | 'variation';

export type GeneratedCode = { html: string; css: string; js: string };
export type ItemVerdict = { id: number; passed: boolean; rate: number; reason: string };
export type GradeResult = { items: ItemVerdict[] };
export type ResultItem = {
  description: string; kind: 'basic' | 'detail'; passed: boolean; rate: number;
};
export type PlayerResult = {
  username: string; total: number; basicScore: number; detailScore: number;
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
  deadline: number | null;
};

// client -> server
export type ClientMsg =
  | { type: 'JOIN'; roomCode: string; username: string }
  | { type: 'HOST_AUTH'; adminPassword: string; roomCode?: string }
  | { type: 'PROMPT_UPDATE'; text: string }
  | { type: 'SELECT_PROBLEM'; mode: SelectMode; problemId?: number; category?: string }
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
  | { type: 'GAME_START'; problemId: number; deadline: number; variationId: number | null }
  | { type: 'TICK'; remainingSec: number }
  | { type: 'GAME_END' }
  | { type: 'GRADING_PROGRESS'; done: number; total: number }
  | { type: 'RESULT'; ranking: PlayerResult[] }
  | { type: 'ROOM_CLOSED' };
