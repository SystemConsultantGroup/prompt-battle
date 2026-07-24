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

test('non-string first argument returns false instead of throwing', () => {
  assert.equal(constantTimeEqual(undefined as any, 'pw'), false);
});

test('non-string (number) first argument returns false instead of throwing', () => {
  assert.equal(constantTimeEqual(123 as any, 'pw'), false);
});

test('non-string second argument returns false instead of throwing', () => {
  assert.equal(constantTimeEqual('pw', undefined as any), false);
});
