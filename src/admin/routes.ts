import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from '../db/index.ts';
import { createAccount, listAccounts, deleteAccount, createProblem, getProblem,
  listProblems, listCategories, deleteProblem, addCriterion, listCriteria } from '../db/index.ts';

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
  if (req.headers['x-admin-password'] !== adminPassword) { json(res, 401, { error: 'unauthorized' }); return true; }
  const method = req.method ?? 'GET';

  if (url === '/api/accounts' && method === 'GET') { json(res, 200, listAccounts(db)); return true; }
  if (url === '/api/accounts' && method === 'POST') {
    const b = await readBody(req);
    try { json(res, 200, createAccount(db, String(b.username))); }
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
    json(res, 200, { ...p, criteria: listCriteria(db, p.id) }); return true;
  }
  if (m && method === 'DELETE') { deleteProblem(db, Number(m[1])); json(res, 200, { ok: true }); return true; }

  json(res, 404, { error: 'no route' }); return true;
}
