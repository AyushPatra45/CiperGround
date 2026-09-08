import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createApi } from '../.test-build/api.mjs';
console.log = () => {};
function harness() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  for (const f of readdirSync('drizzle')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    sql.exec(readFileSync('drizzle/' + f, 'utf8'));
  const db = {
    prepare(s) {
      let args = [];
      const result = {
        bind(...a) {
          args = a;
          return result;
        },
        first() {
          return sql.prepare(s).get(...args) || null;
        },
        all() {
          return { results: sql.prepare(s).all(...args) };
        },
        run() {
          return {
            meta: { changes: Number(sql.prepare(s).run(...args).changes) },
          };
        },
      };
      return result;
    },
    async batch(stmts) {
      sql.exec('BEGIN');
      try {
        const r = stmts.map((s) => s.run());
        sql.exec('COMMIT');
        return r;
      } catch (e) {
        sql.exec('ROLLBACK');
        throw e;
      }
    },
  };
  const api = createApi(db, {
    ADMIN_BOOTSTRAP_TOKEN: 'a'.repeat(64),
    FLAG_KEY: 'f'.repeat(64),
  });
  let cookie = '';
  async function call(path, body, opts = {}) {
    const r = await api(
      new Request('http://localhost/api/' + path, {
        method: opts.method || (body === undefined ? 'GET' : 'POST'),
        headers: {
          origin: opts.origin || 'http://localhost',
          'content-type': 'application/json',
          cookie: opts.cookie ?? cookie,
          'cf-connecting-ip': opts.ip || 'test-ip',
          ...opts.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    const set = r.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return {
      status: r.status,
      data: await r.json(),
      cookie,
      headers: r.headers,
    };
  }
  async function register(name = 'tester') {
    return call('auth/register', {
      name,
      email: name + '@example.com',
      password: 'correct-horse-battery-42',
    });
  }
  return {
    sql,
    call,
    register,
    get cookie() {
      return cookie;
    },
    close: () => sql.close(),
  };
}
const challenge = {
  id: 'custom-challenge',
  title: 'Evidence Lab',
  summary: 'Follow the audit trail.',
  description: 'Calculate the answer from the evidence.',
  category: 'Forensics',
  difficulty: 'Medium',
  points: 250,
  tags: ['Logs'],
  flag: 'CTF{correct}',
  hint: 'Look at the UTC timestamps.',
  hintCost: 25,
  published: false,
};
test('registration uses hashed sessions, private cookies, durable accounts and redacted state', async () => {
  const h = harness();
  try {
    const r = await h.register();
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /HttpOnly/);
    assert.match(r.headers.get('set-cookie'), /SameSite=Lax/);
    const state = await h.call('state');
    assert.equal(state.data.challenges.length, 12);
    assert.equal(state.data.user.name, 'tester');
    const text = JSON.stringify(state.data);
    assert.ok(!text.includes('flag_hash'));
    assert.ok(!text.includes('password'));
    assert.ok(!text.includes('hint"'));
    const s = h.sql.prepare('SELECT id FROM sessions').get();
    assert.notEqual(s.id, h.cookie.split('=')[1]);
    const u = h.sql.prepare('SELECT password FROM users').get();
    assert.match(u.password, /^scrypt\$/);
  } finally {
    h.close();
  }
});
test('wrong login rejected, logout revokes session, correct login restores state', async () => {
  const h = harness();
  try {
    await h.register();
    const old = h.cookie;
    await h.call('auth/logout', {});
    assert.equal(
      (await h.call('team', undefined, { cookie: old })).status,
      401,
    );
    assert.equal(
      (
        await h.call('auth/login', {
          email: 'tester@example.com',
          password: 'wrong-password-long',
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await h.call('auth/login', {
          email: 'tester@example.com',
          password: 'correct-horse-battery-42',
        })
      ).status,
      200,
    );
  } finally {
    h.close();
  }
});
test('CSRF, missing authentication and unauthorized administrator requests rejected', async () => {
  const h = harness();
  try {
    assert.equal(
      (await h.call('auth/register', {}, { origin: 'https://evil.example' }))
        .status,
      403,
    );
    assert.equal(
      (
        await h.call('challenges/the-last-commit/submit', {
          flag: 'CTF{b22:observe}',
        })
      ).status,
      401,
    );
    await h.register();
    assert.equal((await h.call('admin/challenges')).status, 403);
    assert.equal(
      (await h.call('admin/claim', { token: 'x'.repeat(64) })).status,
      403,
    );
  } finally {
    h.close();
  }
});
test('incorrect flags are recorded without raw contents; correct and duplicate solves score once', async () => {
  const h = harness();
  try {
    await h.register();
    assert.equal(
      (
        await h.call('challenges/the-last-commit/submit', {
          flag: 'CTF{wrong}',
        })
      ).data.correct,
      false,
    );
    assert.equal(
      (
        await h.call('challenges/the-last-commit/submit', {
          flag: ' CTF{b22:observe} ',
        })
      ).data.correct,
      true,
    );
    assert.equal(
      (
        await h.call('challenges/the-last-commit/submit', {
          flag: 'CTF{b22:observe}',
        })
      ).data.alreadySolved,
      true,
    );
    const s = (await h.call('state')).data;
    assert.equal(s.points, 100);
    assert.equal(s.solved.length, 1);
    assert.equal((await h.call('submissions')).data.rows.length, 3);
    assert.ok(
      !JSON.stringify(
        h.sql.prepare('SELECT * FROM submissions').all(),
      ).includes('CTF{'),
    );
  } finally {
    h.close();
  }
});
test('hint charges once and preserves deduction after solve', async () => {
  const h = harness();
  try {
    await h.register();
    const a = await h.call('challenges/the-last-commit/hint', {});
    assert.equal(a.status, 200);
    await h.call('challenges/the-last-commit/hint', {});
    assert.equal((await h.call('state')).data.points, -10);
    await h.call('challenges/the-last-commit/submit', {
      flag: 'CTF{b22:observe}',
    });
    assert.equal((await h.call('state')).data.points, 90);
    assert.equal(
      (await h.call('challenges/the-last-commit/hint', {})).status,
      409,
    );
  } finally {
    h.close();
  }
});
test('prerequisite gates flag submissions and paid hints', async () => {
  const h = harness();
  try {
    await h.register();
    assert.equal((await h.call('challenges/afterimage/hint', {})).status, 403);
    assert.equal(
      (
        await h.call('challenges/afterimage/submit', {
          flag: 'CTF{req-72:927:140506}',
        })
      ).status,
      403,
    );
    const guide = readFileSync('docs/SOLUTIONS.md', 'utf8');
    const flag = guide.match(/CTF\{cedar:[a-f0-9]+\}/)[0];
    await h.call('challenges/packet-whisperer/submit', { flag });
    assert.equal(
      (
        await h.call('challenges/afterimage/submit', {
          flag: 'CTF{req-72:927:140506}',
        })
      ).data.correct,
      true,
    );
  } finally {
    h.close();
  }
});
test('teams share solves and hints, invite rotation invalidates previous invite', async () => {
  const h = harness();
  try {
    await h.register('captain');
    const cap = h.cookie;
    const created = (await h.call('team/create', { name: 'Null Collective' }))
      .data;
    assert.equal(created.invite.length, 64);
    await h.register('member');
    const member = h.cookie;
    assert.equal(
      (await h.call('team/join', { invite: created.invite })).status,
      200,
    );
    await h.call('challenges/the-last-commit/hint', {}, { cookie: cap });
    await h.call('challenges/the-last-commit/hint', {}, { cookie: member });
    await h.call(
      'challenges/the-last-commit/submit',
      { flag: 'CTF{b22:observe}' },
      { cookie: member },
    );
    assert.equal(
      (await h.call('state', undefined, { cookie: cap })).data.points,
      90,
    );
    const lb = (await h.call('leaderboard')).data.rows;
    assert.equal(lb.length, 1);
    assert.equal(lb[0].name, 'Null Collective');
    assert.equal(lb[0].type, 'team');
    const rotated = await h.call(
      'team/rotate-invite',
      {},
      { cookie: cap, method: 'PATCH' },
    );
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.data.invite, created.invite);
    await h.register('latecomer');
    assert.equal(
      (await h.call('team/join', { invite: created.invite })).status,
      404,
    );
  } finally {
    h.close();
  }
});
test('participation locks membership and team cap is enforced', async () => {
  const h = harness();
  try {
    await h.register('solo');
    await h.call('challenges/the-last-commit/hint', {});
    assert.equal(
      (await h.call('team/create', { name: 'Too Late' })).status,
      409,
    );
    await h.register('captain');
    const invite = (await h.call('team/create', { name: 'Five Only' })).data
      .invite;
    for (let i = 0; i < 4; i++) {
      await h.register('member' + i);
      assert.equal((await h.call('team/join', { invite })).status, 200);
    }
    await h.register('sixth');
    assert.equal((await h.call('team/join', { invite })).status, 409);
  } finally {
    h.close();
  }
});
test('database-backed flag rate limit blocks the thirteenth attempt', async () => {
  const h = harness();
  try {
    await h.register();
    for (let i = 0; i < 12; i++)
      assert.equal(
        (await h.call('challenges/the-last-commit/submit', { flag: 'wrong' }))
          .status,
        200,
      );
    const r = await h.call('challenges/the-last-commit/submit', {
      flag: 'wrong',
    });
    assert.equal(r.status, 429);
    assert.equal(r.headers.get('retry-after'), '60');
  } finally {
    h.close();
  }
});
test('administrator drafts, publication and role assignment work with server authorization', async () => {
  const h = harness();
  try {
    await h.register('organizer');
    assert.equal(
      (await h.call('admin/claim', { token: 'a'.repeat(64) })).status,
      200,
    );
    const admin = h.cookie;
    assert.equal((await h.call('admin/challenges', challenge)).status, 201);
    assert.ok(
      !(await h.call('state')).data.challenges.some(
        (c) => c.id === challenge.id,
      ),
    );
    assert.equal(
      (
        await h.call(
          'admin/publish',
          { id: challenge.id, published: true },
          { method: 'PATCH' },
        )
      ).status,
      200,
    );
    assert.ok(
      (await h.call('state')).data.challenges.some(
        (c) => c.id === challenge.id,
      ),
    );
    await h.register('writer');
    assert.equal(
      (
        await h.call(
          'admin/role',
          { name: 'writer', role: 'author' },
          { method: 'PATCH', cookie: admin },
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await h.call(
          'admin/publish',
          { id: challenge.id, published: false },
          { method: 'PATCH' },
        )
      ).status,
      403,
    );
    assert.equal((await h.call('admin/audit')).status, 403);
    assert.equal(
      (await h.call('admin/audit', undefined, { cookie: admin })).status,
      200,
    );
  } finally {
    h.close();
  }
});
test('input validation, SQL metacharacters and unknown endpoints fail safely', async () => {
  const h = harness();
  try {
    assert.equal((await h.register("' OR 1=1 --")).status, 400);
    await h.register();
    assert.equal(
      (await h.call('challenges/missing/submit', { flag: 'anything' })).status,
      404,
    );
    assert.equal(
      (
        await h.call('challenges/the-last-commit/submit', {
          flag: 'x'.repeat(257),
        })
      ).status,
      400,
    );
    assert.equal((await h.call('missing')).status, 404);
    assert.equal(
      (await h.call('admin/claim', { token: 'a'.repeat(64) })).status,
      200,
    );
    assert.equal(
      (await h.call('admin/challenges', { ...challenge, points: -100 })).status,
      400,
    );
  } finally {
    h.close();
  }
});
test('unconfigured runner fails explicitly instead of pretending to launch', async () => {
  const h = harness();
  try {
    await h.register();
    assert.equal(
      (await h.call('challenges/ghost-in-the-cache/instance', {})).status,
      503,
    );
    assert.equal((await h.call('state')).data.runnerAvailable, false);
  } finally {
    h.close();
  }
});

test('oversized JSON body rejected before mutation', async () => {
  const h = harness();
  try {
    await h.register();
    assert.equal(
      (await h.call('team/create', { name: 'x'.repeat(17000) })).status,
      413,
    );
    assert.equal(
      h.sql.prepare('SELECT COUNT(*) AS count FROM teams').get().count,
      0,
    );
  } finally {
    h.close();
  }
});
