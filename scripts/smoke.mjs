import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
assert.ok(
  ['127.0.0.1', 'localhost'].includes(new URL(base).hostname),
  'Smoke tests create data and only run on localhost',
);
let cookie = '';
let checks = 0;
async function request(path, body) {
  const r = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: base,
      Cookie: cookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.headers.has('set-cookie'))
    cookie = r.headers.get('set-cookie').split(';')[0];
  return r;
}
for (const path of [
  '/',
  '/account',
  '/team',
  '/leaderboard',
  '/submissions',
  '/studio',
  '/guide',
  '/challenges/the-last-commit',
  '/labs/red-console',
  '/labs/last-screening',
  '/labs/baker-street-packet',
]) {
  const r = await request(path);
  assert.equal(r.status, 200, path);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok((await r.text()).includes('Cipherground'));
  checks++;
}
let r = await request('/api/health');
assert.equal(r.status, 200);
assert.equal((await r.json()).database, 'connected');
checks++;
let lab = await request('/api/labs/baker-street/dispatch');
assert.equal(lab.status, 200);
assert.equal(lab.headers.get('x-dispatch-year'), '1895');
checks++;
lab = await request('/api/labs/baker-street/ledger?case=violet-9');
assert.equal(lab.status, 200);
assert.equal(
  lab.headers.get('x-required-headers'),
  'X-Case-Id, X-Evidence-Order',
);
checks++;
lab = await fetch(base + '/api/labs/baker-street/vault?year=1895', {
  headers: {
    'X-Case-Id': 'violet-9',
    'X-Evidence-Order': 'CAB,WINDOW,LAMP',
  },
});
assert.equal(lab.status, 200);
assert.equal((await lab.json()).flag, 'CTF{THE_HEADER_WAS_THE_FOOTPRINT}');
checks++;
lab = await request('/api/labs/last-screening/verify', {
  code: '0419-BETA-23',
});
assert.equal(lab.status, 200);
assert.equal((await lab.json()).flag, 'CTF{REWIND_THE_FINAL_FRAME}');
checks++;
const name = 'smoke_' + randomBytes(4).toString('hex');
r = await request('/api/auth/register', {
  name,
  email: name + '@example.test',
  password: 'Local-smoke-test-only-42!',
});
assert.equal(r.status, 200, await r.text());
checks++;
r = await request('/api/team/create', { name: 'Smoke ' + name });
assert.equal(r.status, 201, await r.text());
checks++;
for (let i = 0; i < 2; i++) {
  r = await request('/api/challenges/the-last-commit/hint', {});
  assert.equal(r.status, 200);
  assert.ok((await r.json()).hint);
}
assert.equal((await (await request('/api/state')).json()).points, -10);
checks++;
r = await request('/api/challenges/the-last-commit/submit', {
  flag: 'CTF{wrong}',
});
assert.equal((await r.json()).correct, false);
checks++;
r = await request('/api/challenges/the-last-commit/submit', {
  flag: 'CTF{b22:observe}',
});
assert.equal((await r.json()).correct, true);
checks++;
r = await request('/api/challenges/the-last-commit/submit', {
  flag: 'CTF{b22:observe}',
});
assert.equal((await r.json()).alreadySolved, true);
checks++;
const state = await (await request('/api/state')).json();
assert.equal(state.points, 90);
assert.equal(state.solved.length, 1);
checks++;
assert.equal((await (await request('/api/submissions')).json()).rows.length, 3);
checks++;
assert.ok(
  (await (await request('/api/leaderboard')).json()).rows.some(
    (r) => r.name === 'Smoke ' + name && r.points === 90,
  ),
);
checks++;
await request('/api/auth/logout', {});
assert.equal((await (await request('/api/state')).json()).user, null);
checks++;
await request('/api/auth/login', {
  email: name + '@example.test',
  password: 'Local-smoke-test-only-42!',
});
assert.equal((await (await request('/api/state')).json()).points, 90);
checks++;
for (const id of [
  'ghost-in-the-cache',
  'packet-whisperer',
  'nonce-sense',
  'paper-trail',
  'dead-drop',
  'the-last-commit',
  'signed-sealed',
  'afterimage',
  'common-ground',
  'off-the-grid',
  'signal-lost',
  'dependency-hell',
  'hawkins-fourth-signal',
  'nevermore-murder-board',
  'ravens-of-the-seven-realms',
  'pensieve-missing-hour',
]) {
  const r = await request(
    '/artifacts/' +
      id +
      ([
        'hawkins-fourth-signal',
        'nevermore-murder-board',
        'ravens-of-the-seven-realms',
        'pensieve-missing-hour',
      ].includes(id)
        ? '.zip'
        : '.txt'),
  );
  assert.equal(r.status, 200);
  assert.ok((await r.text()).length > 150);
  checks++;
}
console.log(
  `${checks} compiled-server smoke checks passed. Test account: ${name}.`,
);
