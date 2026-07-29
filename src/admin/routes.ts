import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from '../db/index.ts';
import { createAccount, listAccounts, deleteAccount, createProblem, getProblem,
  listProblems, listCategories, deleteProblem, updateProblem, replaceCriteria,
  addCriterion, listCriteria, addVariation, listVariations, deleteVariation } from '../db/index.ts';
import { constantTimeEqual } from '../util/secure.ts';

async function readBody(req: IncomingMessage): Promise<any> {
  let raw = '';
  for await (const chunk of req as any) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
function json(res: ServerResponse, code: number, obj: unknown) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

export async function handleApi(
  db: Database, adminPassword: string, req: IncomingMessage, res: ServerResponse,
): Promise<boolean> {
  const url = (req.url ?? '').split('?')[0];
  if (!url.startsWith('/api/')) return false;
  const providedPassword = req.headers['x-admin-password'];
  if (typeof providedPassword !== 'string' || !constantTimeEqual(providedPassword, adminPassword)) {
    json(res, 401, { error: 'unauthorized' }); return true;
  }
  const method = req.method ?? 'GET';

  if (url === '/api/accounts' && method === 'GET') { json(res, 200, listAccounts(db)); return true; }
  if (url === '/api/accounts' && method === 'POST') {
    const b = await readBody(req);
    if (typeof b.username !== 'string' || b.username.trim() === '') {
      json(res, 400, { error: 'username required' }); return true;
    }
    try { json(res, 200, createAccount(db, b.username)); }
    catch { json(res, 400, { error: 'duplicate or invalid' }); }
    return true;
  }
  let m = url.match(/^\/api\/accounts\/(\d+)$/);
  if (m && method === 'DELETE') { deleteAccount(db, Number(m[1])); json(res, 200, { ok: true }); return true; }

  if (url === '/api/categories' && method === 'GET') { json(res, 200, listCategories(db)); return true; }
  if (url === '/api/problems' && method === 'GET') { json(res, 200, listProblems(db)); return true; }
  if (url === '/api/problems' && method === 'POST') {
    const b = await readBody(req);
    const id = createProblem(db, b.problem);
    for (const c of (b.criteria ?? [])) addCriterion(db, { ...c, problemId: id });
    json(res, 200, { id }); return true;
  }
  m = url.match(/^\/api\/problems\/(\d+)$/);
  if (m && method === 'GET') {
    const p = getProblem(db, Number(m[1]));
    if (!p) { json(res, 404, { error: 'not found' }); return true; }
    json(res, 200, { ...p, criteria: listCriteria(db, p.id), variations: listVariations(db, p.id) }); return true;
  }
  if (m && method === 'DELETE') { deleteProblem(db, Number(m[1])); json(res, 200, { ok: true }); return true; }
  if (m && method === 'PUT') {
    const id = Number(m[1]);
    if (!getProblem(db, id)) { json(res, 404, { error: 'not found' }); return true; }
    const b = await readBody(req);
    updateProblem(db, id, b.problem);
    replaceCriteria(db, id, b.criteria ?? []);
    json(res, 200, { ok: true }); return true;
  }

  m = url.match(/^\/api\/problems\/(\d+)\/variations$/);
  if (m && method === 'POST') {
    const problemId = Number(m[1]);
    const base = getProblem(db, problemId);
    if (!base) { json(res, 404, { error: 'not found' }); return true; }
    const b = await readBody(req);
    // `fromBase` seeds the variation's code from the base problem so the admin
    // edits a copy instead of authoring from scratch; any field explicitly
    // provided in the body still wins over the base value.
    const seed = b.fromBase ? base : { targetHtml: '', targetCss: '', targetJs: '' };
    const id = addVariation(db, {
      problemId, label: b.label,
      targetHtml: b.targetHtml ?? seed.targetHtml,
      targetCss: b.targetCss ?? seed.targetCss,
      targetJs: b.targetJs ?? seed.targetJs,
      sortOrder: b.sortOrder ?? 0,
    });
    json(res, 200, { id }); return true;
  }

  m = url.match(/^\/api\/variations\/(\d+)$/);
  if (m && method === 'DELETE') {
    deleteVariation(db, Number(m[1]));
    json(res, 200, { ok: true }); return true;
  }

  json(res, 404, { error: 'no route' }); return true;
}
