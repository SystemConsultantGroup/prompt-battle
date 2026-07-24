import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constantTimeEqual } from '../../src/util/secure.ts';

test('equal strings return true', () => {
  assert.equal(constantTimeEqual('pw', 'pw'), true);
});

test('different strings of the same length return false', () => {
  assert.equal(constantTimeEqual('pwpw', 'pwxx'), false);
});

test('different-length strings return false', () => {
  assert.equal(constantTimeEqual('short', 'a-much-longer-string'), false);
});
