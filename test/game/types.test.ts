import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ClientMsg, ServerMsg } from '../../src/game/types.ts';

test('message unions are usable', () => {
  const c: ClientMsg = { type: 'JOIN', roomCode: 'ABCD', username: 'a' };
  const s: ServerMsg = { type: 'TICK', remainingSec: 5 };
  assert.equal(c.type, 'JOIN');
  assert.equal(s.type, 'TICK');
});
