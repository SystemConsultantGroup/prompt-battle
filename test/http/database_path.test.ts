import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  return address.port;
}

// Exercise the actual entry point, not just openDb(): both the app and seed
// runner must target DB_PATH for a mounted volume to preserve the selection.
test('server honours DB_PATH, creates its directory, and preserves settings across restart', { timeout: 20_000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-db-path-'));
  const dbPath = join(dir, 'volume', 'nested', 'app.sqlite');
  let child: ChildProcess | undefined;
  let logs = '';
  const headers = { 'x-admin-password': 'test-pw', 'content-type': 'application/json' };
  async function stop() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise<void>(resolve => child!.once('exit', () => resolve()));
    child.kill('SIGTERM');
    await exited;
  }
  async function boot() {
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      env: { ...process.env, PORT: String(port), DB_PATH: dbPath, ADMIN_PASSWORD: 'test-pw',
        OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', data => { logs += data; });
    child.stderr?.on('data', data => { logs += data; });
    for (let i = 0; i < 100; i++) {
      assert.equal(child.exitCode, null, logs);
      try {
        const res = await fetch(`${base}/theme.css`);
        if (res.ok) return base;
      } catch { /* Wait for startup. */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`server did not start: ${logs}`);
  }
  try {
    let base = await boot();
    assert.equal(existsSync(dbPath), true);
    assert.match(await (await fetch(`${base}/theme.css`)).text(), /cartoon/);
    let res = await fetch(`${base}/api/accounts`, {
      method: 'POST', headers, body: JSON.stringify({ username: 'persisted-player' }),
    });
    assert.equal(res.status, 200);
    await res.text();
    res = await fetch(`${base}/api/settings/theme`, {
      method: 'PUT', headers, body: JSON.stringify({ theme: 'halloween' }),
    });
    assert.equal(res.status, 200);
    await res.text();
    await stop();

    base = await boot();
    res = await fetch(`${base}/api/settings/theme`, { headers });
    assert.equal((await res.json() as { theme: string }).theme, 'halloween');
    assert.match(await (await fetch(`${base}/theme.css`)).text(), /halloween/);
    res = await fetch(`${base}/api/accounts`, { headers });
    assert.equal((await res.json() as { username: string }[])[0].username, 'persisted-player');
  } finally {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
