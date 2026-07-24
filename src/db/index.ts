import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type Database = DatabaseSync;
export type Account = { id: number; username: string; createdAt: string };
export type Problem = {
  id: number; title: string; category: string; difficulty: string;
  timeLimitSec: number; targetHtml: string; targetCss: string; targetJs: string;
  detailWeight: number; createdAt: string;
};
export type Criterion = {
  id: number; problemId: number; kind: 'basic' | 'detail';
  description: string; sortOrder: number;
};
export type NewProblem = Omit<Problem, 'id' | 'createdAt'>;
export type NewCriterion = Omit<Criterion, 'id'>;
export type Variation = {
  id: number; problemId: number; label: string;
  targetHtml: string; targetCss: string; targetJs: string; sortOrder: number;
};
export type NewVariation = Omit<Variation, 'id'>;

const SCHEMA = readFileSync(
  fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');

export function openDb(path: string): Database {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

const now = () => new Date().toISOString();

export function createAccount(db: Database, username: string): Account {
  const r = db.prepare(
    'INSERT INTO accounts(username, created_at) VALUES(?, ?)')
    .run(username, now());
  return { id: Number(r.lastInsertRowid), username, createdAt: now() };
}
export function listAccounts(db: Database): Account[] {
  return db.prepare('SELECT id, username, created_at AS createdAt FROM accounts ORDER BY username')
    .all() as Account[];
}
export function deleteAccount(db: Database, id: number): void {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
}

export function createProblem(db: Database, p: NewProblem): number {
  const r = db.prepare(`INSERT INTO problems
    (title, category, difficulty, time_limit_sec, target_html, target_css,
     target_js, detail_weight, created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(
    p.title, p.category, p.difficulty, p.timeLimitSec, p.targetHtml,
    p.targetCss, p.targetJs, p.detailWeight, now());
  return Number(r.lastInsertRowid);
}
const PROBLEM_COLS = `id, title, category, difficulty,
  time_limit_sec AS timeLimitSec, target_html AS targetHtml,
  target_css AS targetCss, target_js AS targetJs,
  detail_weight AS detailWeight, created_at AS createdAt`;
export function getProblem(db: Database, id: number): Problem | undefined {
  return db.prepare(`SELECT ${PROBLEM_COLS} FROM problems WHERE id = ?`)
    .get(id) as Problem | undefined;
}
export function listProblems(db: Database): Problem[] {
  return db.prepare(`SELECT ${PROBLEM_COLS} FROM problems ORDER BY id`)
    .all() as Problem[];
}
export function listCategories(db: Database): string[] {
  return (db.prepare('SELECT DISTINCT category FROM problems ORDER BY category')
    .all() as { category: string }[]).map(r => r.category);
}
export function deleteProblem(db: Database, id: number): void {
  db.prepare('DELETE FROM problems WHERE id = ?').run(id);
}
export function updateProblem(db: Database, id: number, p: NewProblem): void {
  db.prepare(`UPDATE problems SET
    title = ?, category = ?, difficulty = ?, time_limit_sec = ?,
    target_html = ?, target_css = ?, target_js = ?, detail_weight = ?
    WHERE id = ?`).run(
    p.title, p.category, p.difficulty, p.timeLimitSec, p.targetHtml,
    p.targetCss, p.targetJs, p.detailWeight, id);
}

export function addCriterion(db: Database, c: NewCriterion): number {
  const r = db.prepare(`INSERT INTO criteria
    (problem_id, kind, description, sort_order) VALUES(?,?,?,?)`)
    .run(c.problemId, c.kind, c.description, c.sortOrder);
  return Number(r.lastInsertRowid);
}
export function replaceCriteria(
  db: Database, problemId: number, criteria: Omit<NewCriterion, 'problemId'>[],
): void {
  db.prepare('DELETE FROM criteria WHERE problem_id = ?').run(problemId);
  criteria.forEach((c, i) => {
    db.prepare(`INSERT INTO criteria
      (problem_id, kind, description, sort_order) VALUES(?,?,?,?)`)
      .run(problemId, c.kind, c.description, c.sortOrder ?? i);
  });
}
export function listCriteria(db: Database, problemId: number): Criterion[] {
  return db.prepare(`SELECT id, problem_id AS problemId, kind, description,
    sort_order AS sortOrder FROM criteria WHERE problem_id = ? ORDER BY sort_order`)
    .all(problemId) as Criterion[];
}

const VARIATION_COLS = `id, problem_id AS problemId, label,
  target_html AS targetHtml, target_css AS targetCss, target_js AS targetJs,
  sort_order AS sortOrder`;
export function addVariation(db: Database, v: NewVariation): number {
  const r = db.prepare(`INSERT INTO problem_variations
    (problem_id, label, target_html, target_css, target_js, sort_order)
    VALUES(?,?,?,?,?,?)`).run(
    v.problemId, v.label, v.targetHtml, v.targetCss, v.targetJs, v.sortOrder);
  return Number(r.lastInsertRowid);
}
export function listVariations(db: Database, problemId: number): Variation[] {
  return db.prepare(`SELECT ${VARIATION_COLS} FROM problem_variations
    WHERE problem_id = ? ORDER BY sort_order`).all(problemId) as Variation[];
}
export function getVariation(db: Database, id: number): Variation | undefined {
  return db.prepare(`SELECT ${VARIATION_COLS} FROM problem_variations WHERE id = ?`)
    .get(id) as Variation | undefined;
}
export function deleteVariation(db: Database, id: number): void {
  db.prepare('DELETE FROM problem_variations WHERE id = ?').run(id);
}
