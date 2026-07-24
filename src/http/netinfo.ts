import type { NetworkInterfaceInfo } from 'node:os';

// Non-internal IPv4 addresses from an os.networkInterfaces()-shaped object.
// (Node reports `family` as 'IPv4' on modern versions, 4 on some; accept both.)
export function lanHosts(
  ifaces: Record<string, NetworkInterfaceInfo[] | undefined>,
): string[] {
  const out: string[] = [];
  for (const list of Object.values(ifaces)) {
    for (const ni of list ?? []) {
      const isV4 = ni.family === 'IPv4' || (ni.family as unknown) === 4;
      if (isV4 && !ni.internal) out.push(ni.address);
    }
  }
  return out;
}

// Human-facing startup banner: the three entry-point URLs for localhost plus
// each LAN address (so a host can tell same-network players where to connect).
export function startupBanner(port: number, hosts: string[]): string {
  const urls = (host: string) => [
    `    Player: http://${host}:${port}/client/`,
    `    Host:   http://${host}:${port}/host/`,
    `    Admin:  http://${host}:${port}/admin/index.html`,
  ];
  const rows = [
    '',
    'Prompt Battle server running.',
    '',
    '  Local (this machine):',
    ...urls('localhost'),
  ];
  if (hosts.length) {
    rows.push('', '  LAN (same-network devices — share these):');
    for (const h of hosts) rows.push(...urls(h));
    rows.push('', '  If a device cannot connect, allow this port through the OS firewall.');
  }
  return rows.join('\n');
}
