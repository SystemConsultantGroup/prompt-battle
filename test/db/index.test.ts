import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, createAccount, listAccounts, deleteAccount,
  createProblem, getProblem, listProblems, listCategories,
  addCriterion, listCriteria, addVariation, listVariations, getVariation,
  deleteVariation, deleteProblem } from '../../src/db/index.ts';

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

test('variations: create, list, get, delete, and read back fields', () => {
  const db = freshDb();
  const problemId = createProblem(db, {
    title: 'Login form', category: 'form', difficulty: 'easy',
    timeLimitSec: 300, targetHtml: '<form></form>', targetCss: 'form{}',
    targetJs: '', detailWeight: 0.3,
  });
  const vid = addVariation(db, {
    problemId, label: 'dark theme', targetHtml: '<form class="dark"></form>',
    targetCss: 'form.dark{background:#000}', targetJs: 'console.log(1)', sortOrder: 0,
  });
  const v = getVariation(db, vid);
  assert.equal(v?.label, 'dark theme');
  assert.equal(v?.problemId, problemId);
  assert.equal(v?.targetCss, 'form.dark{background:#000}');
  assert.equal(listVariations(db, problemId).length, 1);

  deleteVariation(db, vid);
  assert.equal(listVariations(db, problemId).length, 0);
  assert.equal(getVariation(db, vid), undefined);
});

test('variations: deleting a problem cascades to its variations', () => {
  const db = freshDb();
  const problemId = createProblem(db, {
    title: 'Login form', category: 'form', difficulty: 'easy',
    timeLimitSec: 300, targetHtml: '<form></form>', targetCss: '',
    targetJs: '', detailWeight: 0.3,
  });
  addVariation(db, { problemId, label: 'v1', targetHtml: '', targetCss: '', targetJs: '', sortOrder: 0 });
  addVariation(db, { problemId, label: 'v2', targetHtml: '', targetCss: '', targetJs: '', sortOrder: 1 });
  assert.equal(listVariations(db, problemId).length, 2);

  deleteProblem(db, problemId);

  assert.equal(listVariations(db, problemId).length, 0);
});
