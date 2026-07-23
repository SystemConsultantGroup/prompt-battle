import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, createAccount, listAccounts, deleteAccount,
  createProblem, getProblem, listProblems, listCategories,
  addCriterion, listCriteria } from '../../src/db/index.ts';

function freshDb() { return openDb(':memory:'); }

test('accounts: create, list unique, delete', () => {
  const db = freshDb();
  const a = createAccount(db, 'alice');
  assert.equal(a.username, 'alice');
  assert.equal(listAccounts(db).length, 1);
  assert.throws(() => createAccount(db, 'alice'));
  deleteAccount(db, a.id);
  assert.equal(listAccounts(db).length, 0);
});

test('problems + criteria: create and read back with cascade', () => {
  const db = freshDb();
  const id = createProblem(db, {
    title: 'Login form', category: 'form', difficulty: 'easy',
    timeLimitSec: 300, targetHtml: '<form></form>', targetCss: 'form{}',
    targetJs: '', detailWeight: 0.3,
  });
  addCriterion(db, { problemId: id, kind: 'basic', description: 'has button', sortOrder: 0 });
  addCriterion(db, { problemId: id, kind: 'detail', description: 'blue button', sortOrder: 1 });
  const p = getProblem(db, id);
  assert.equal(p?.title, 'Login form');
  assert.equal(p?.timeLimitSec, 300);
  assert.equal(listProblems(db).length, 1);
  assert.deepEqual(listCategories(db), ['form']);
  assert.equal(listCriteria(db, id).length, 2);
});
