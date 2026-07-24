// Seed the problem database from seed/index.ts.
//   npx tsx scripts/seed.ts            insert problems whose title doesn't exist yet
//   npx tsx scripts/seed.ts --reset    delete ALL problems first, then insert everything
//
// DB path follows the app default (data/app.sqlite) or DB_PATH env override.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  openDb, listProblems, createProblem, addCriterion, deleteProblem,
} from '../src/db/index.ts';
import { allProblems } from '../seed/index.ts';

const dbPath = process.env.DB_PATH ?? 'data/app.sqlite';
const reset = process.argv.includes('--reset');

mkdirSync(dirname(dbPath), { recursive: true });
const db = openDb(dbPath);

if (reset) {
  const existing = listProblems(db);
  for (const p of existing) deleteProblem(db, p.id);
  console.log(`--reset: removed ${existing.length} existing problem(s)`);
}

const existingTitles = new Set(listProblems(db).map((p) => p.title));

let inserted = 0;
let skipped = 0;
for (const p of allProblems) {
  if (existingTitles.has(p.title)) {
    skipped++;
    continue;
  }
  const id = createProblem(db, {
    title: p.title,
    category: p.category,
    difficulty: p.difficulty,
    timeLimitSec: p.timeLimitSec,
    targetHtml: p.targetHtml,
    targetCss: p.targetCss,
    targetJs: p.targetJs,
    detailWeight: p.detailWeight ?? 0.3,
  });
  p.criteria.forEach((c, i) =>
    addCriterion(db, {
      problemId: id,
      kind: c.kind,
      description: c.description,
      sortOrder: i,
    }),
  );
  existingTitles.add(p.title);
  inserted++;
}

const byCat = allProblems.reduce<Record<string, number>>((m, p) => {
  m[p.category] = (m[p.category] ?? 0) + 1;
  return m;
}, {});

console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped (already present).`);
console.log(`Total in data set: ${allProblems.length}`);
console.log('By category:', byCat);
console.log(`DB: ${dbPath}`);
