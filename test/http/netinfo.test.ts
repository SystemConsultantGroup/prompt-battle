import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lanHosts, startupBanner } from '../../src/http/netinfo.ts';

test('lanHosts returns non-internal IPv4 addresses only', () => {
  const ifaces = {
    lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true } as any],
    eth0: [
      { address: '192.168.0.42', family: 'IPv4', internal: false } as any,
      { address: 'fe80::1', family: 'IPv6', internal: false } as any,
    ],
    wlan0: [{ address: '10.0.0.7', family: 4, internal: false } as any], // numeric family
  };
  assert.deepEqual(lanHosts(ifaces as any), ['192.168.0.42', '10.0.0.7']);
});

test('lanHosts tolerates undefined interface entries', () => {
  assert.deepEqual(lanHosts({ down: undefined } as any), []);
});

test('startupBanner always lists localhost entry points', () => {
  const b = startupBanner(3000, []);
  assert.match(b, /localhost:3000\/client\//);
  assert.match(b, /localhost:3000\/host\//);
  assert.match(b, /localhost:3000\/admin\//);
  assert.ok(!b.includes('LAN'));
});

test('startupBanner lists LAN hosts when present', () => {
  const b = startupBanner(3000, ['192.168.0.42']);
  assert.match(b, /LAN/);
  assert.match(b, /192\.168\.0\.42:3000\/client\//);
  assert.match(b, /firewall/i);
});
