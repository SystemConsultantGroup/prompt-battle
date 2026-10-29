import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, getTheme, setTheme, listAccounts } from '../../src/db/index.ts';
import type { ThemeId } from '../../src/config/themes.ts';

test('theme defaults to cartoon, supports both themes, and rejects arbitrary values', () => {
  const db = openDb(':memory:');
  try {
    assert.equal(getTheme(db), 'cartoon');
    setTheme(db, 'halloween');
    assert.equal(getTheme(db), 'halloween');
    assert.throws(() => setTheme(db, '../../evil' as ThemeId), /unknown theme/);
    assert.equal(getTheme(db), 'halloween');
    setTheme(db, 'cartoon');
    assert.equal(getTheme(db), 'cartoon');
  } finally { db.close(); }
});

test('unknown persisted themes fall back safely without mutating the setting', () => {
  const db = openDb(':memory:');
  try {
    db.prepare('INSERT INTO app_settings(key, value) VALUES(?, ?)').run('theme', 'retired-theme');
    assert.equal(getTheme(db), 'cartoon');
    assert.deepEqual(db.prepare('SELECT value FROM app_settings').get()?.value, 'retired-theme');
  } finally { db.close(); }
});

test('opening a legacy database adds settings without deleting data; theme survives reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-theme-db-'));
  const path = join(dir, 'app.sqlite');
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`CREATE TABLE accounts (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
    ); INSERT INTO accounts(username, created_at) VALUES('alice', '2026-01-01');`);
    legacy.close();

    const db = openDb(path);
    try {
      assert.equal(getTheme(db), 'cartoon');
      assert.equal(listAccounts(db)[0].username, 'alice');
      setTheme(db, 'halloween');
    } finally { db.close(); }

    const reopened = openDb(path);
    try {
      assert.equal(getTheme(reopened), 'halloween');
      assert.equal(listAccounts(reopened)[0].username, 'alice');
    } finally { reopened.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
