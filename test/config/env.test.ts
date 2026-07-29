import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadEnv } from '../../src/config/env.ts';

test('loadEnv loads variables from an existing .env file into process.env', () => {
  const p = join(tmpdir(), `pb-env-${process.pid}.env`);
  writeFileSync(p, 'PB_TEST_VAR=hello123\n');
  try {
    const ok = loadEnv(p);
    assert.equal(ok, true);
    assert.equal(process.env.PB_TEST_VAR, 'hello123');
  } finally {
    rmSync(p, { force: true });
    delete process.env.PB_TEST_VAR;
  }
});

test('loadEnv is a no-op returning false when the file is absent', () => {
  const p = join(tmpdir(), `pb-env-missing-${process.pid}.env`);
  assert.equal(loadEnv(p), false);
});

test('loadEnv does not throw on an unreadable/invalid path; returns false', () => {
  // A directory exists but cannot be parsed as a .env — must warn+continue,
  // never crash server boot.
  assert.doesNotThrow(() => loadEnv(tmpdir()));
  assert.equal(loadEnv(tmpdir()), false);
});
