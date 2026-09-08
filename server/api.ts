import { catalog, categories } from '../lib/catalog';
import {readJsonBody} from './request';
import secrets from './evidence-secrets.json';
import {
  token,
  sha,
  passwordHash,
  passwordValid,
  safeEqual,
  instanceFlag,
  principal,
  ApiError,
  check,
} from './security';
type DB = {
  prepare: (sql: string) => any;
  batch: (statements: any[]) => Promise<any[]>;
};
type Config = {
  FLAG_KEY?: string;
  RUNNER_URL?: string;
  RUNNER_TOKEN?: string;
  ADMIN_BOOTSTRAP_TOKEN?: string;
};
const json = (data: any, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      ...headers,
    },
  });
export function createApi(db: DB, config: Config = {}) {
  const stmt = (s: string, ...args: any[]) => db.prepare(s).bind(...args);
  const first = (s: string, ...args: any[]) => stmt(s, ...args).first();
  const all = async (s: string, ...args: any[]): Promise<any[]> =>
    (await stmt(s, ...args).all()).results;
  const run = (s: string, ...args: any[]) => stmt(s, ...args).run();
  async function audit(
    user: string | null,
    event: string,
    target: string | null = null,
  ) {
    await run(
      'INSERT INTO audit(id,user_id,event,target,created) VALUES(?,?,?,?,?)',
      token(),
      user,
      event,
      target,
      Date.now(),
    );
  }
  async function rate(key: string, max: number, window = 60000) {
    const now = Date.now(),
      bucket = Math.floor(now / window);
    const r = await first(
      'INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
      sha(key) + ':' + bucket,
      now + window,
    );
    check(
      r.count <= max,
      429,
      'Too many attempts. Please try again in a minute.',
    );
  }
  async function seed() {
    const existing = await first('SELECT id FROM challenges LIMIT 1');
    if (existing) return;
    await db.batch(
      catalog.map((c) =>
        stmt(
          'INSERT OR IGNORE INTO challenges(id,title,category,difficulty,points,summary,description,tags,artifact,environment,prerequisite,featured,flag_hash,hint,hint_cost,published) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
          c.id,
          c.title,
          c.category,
          c.difficulty,
          c.points,
          c.summary,
          c.description,
          JSON.stringify(c.tags),
          c.artifact,
          c.environment || null,
          c.prerequisite || null,
          c.featured ? 1 : 0,
          (secrets.flags as any)[c.id] || 'instance',
          (secrets.hints as any)[c.id],
          Math.max(10, Math.round(c.points * 0.1)),
        ),
      ),
    );
  }
  const publicChallenge = (c: any) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    points: c.points,
    summary: c.summary,
    description: c.description,
    tags: JSON.parse(c.tags),
    artifact: c.artifact,
    environment: c.environment,
    prerequisite: c.prerequisite,
    featured: !!c.featured,
    solves: c.solves || 0,
    hintCost: c.hint_cost,
    published: !!c.published,
    authorId: c.author_id,
  });
  const cookie = (value: string, req: Request, age: number) =>
    `cg_session=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
  return async function handle(req: Request) {
    let actor: string | null = null;
    const started = Date.now();
    const url = new URL(req.url),
      path = url.pathname.replace(/^\/api\/?/, '');
    try {
      check(
        ['GET', 'POST', 'PATCH'].includes(req.method),
        405,
        'Method not allowed',
      );
      if (req.method !== 'GET') {
        check(
          req.headers.get('origin') === url.origin,
          403,
          'Request origin rejected',
        );
        check(
          req.headers.get('content-type')?.startsWith('application/json'),
          415,
          'JSON content required',
        );
      }
      const ip = req.headers.get('cf-connecting-ip') || 'local';
      if (path === 'health') {
        await first('SELECT COUNT(*) AS ok FROM challenges');
        return json({ status: 'ok', database: 'connected' });
      }
      await seed();
      const session = req.headers
        .get('cookie')
        ?.match(/(?:^|;\s*)cg_session=([a-f0-9]{64})(?:;|$)/)?.[1];
      const user = session
        ? await first(
            'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.id=? AND s.expires>?',
            sha(session),
            Date.now(),
          )
        : null;
      actor = user?.id || null;
      let body: any = {};
      if (req.method !== 'GET') {
        body = await readJsonBody(req);
        check(
          body && typeof body === 'object' && !Array.isArray(body),
          400,
          'JSON object required',
        );
      }
      if (path === 'auth/register' || path === 'auth/login') {
        check(req.method === 'POST', 405, 'Use POST');
        await rate('auth:' + ip, 15);
        const email = String(body.email || '')
            .trim()
            .toLowerCase(),
          password = String(body.password || '');
        check(
          email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
          400,
          'Enter a valid email address',
        );
        check(
          password.length >= 12 && password.length <= 128,
          400,
          'Use a password between 12 and 128 characters',
        );
        await rate('account:' + email, 10);
        let account = await first('SELECT * FROM users WHERE email=?', email);
        if (path.endsWith('register')) {
          const name = String(body.name || '').trim();
          check(
            /^[a-zA-Z0-9_-]{3,24}$/.test(name),
            400,
            'Handle must be 3–24 letters, numbers, underscores or hyphens',
          );
          check(!account, 409, 'Unable to create account with these details');
          try {
            const id = token();
            await run(
              'INSERT INTO users(id,email,name,password,role,created) VALUES(?,?,?,?,?,?)',
              id,
              email,
              name,
              passwordHash(password),
              'player',
              Date.now(),
            );
            account = await first('SELECT * FROM users WHERE id=?', id);
          } catch (e) {
            if (String(e).includes('UNIQUE'))
              throw new ApiError(409, 'Handle or email unavailable');
            throw e;
          }
          await audit(account.id, 'account.created');
        } else {
          const fallback = 'scrypt$dummy-salt$' + '0'.repeat(64);
          check(
            passwordValid(password, account?.password || fallback) && account,
            401,
            'Email or password is incorrect',
          );
        }
        const value = token();
        await db.batch([
          stmt('DELETE FROM sessions WHERE expires<?', Date.now()),
          stmt(
            'INSERT INTO sessions(id,user_id,expires) VALUES(?,?,?)',
            sha(value),
            account.id,
            Date.now() + 7 * 86400000,
          ),
        ]);
        return json({ ok: true }, 200, {
          'Set-Cookie': cookie(value, req, 604800),
        });
      }
      if (path === 'auth/logout') {
        check(req.method === 'POST', 405, 'Use POST');
        if (session) await run('DELETE FROM sessions WHERE id=?', sha(session));
        return json({ ok: true }, 200, { 'Set-Cookie': cookie('', req, 0) });
      }
      if (path === 'state' && req.method === 'GET') {
        const cs = await all(
          'SELECT c.*, (SELECT COUNT(*) FROM solves s WHERE s.challenge_id=c.id) AS solves FROM challenges c WHERE published=1 ORDER BY rowid',
        );
        const p = user ? principal(user) : '';
        const solved = user
          ? await all(
              'SELECT challenge_id,points,created FROM solves WHERE principal=?',
              p,
            )
          : [];
        const hints = user
          ? await all(
              'SELECT challenge_id,cost FROM unlocks WHERE principal=?',
              p,
            )
          : [];
        const team = user?.team_id
          ? await first(
              'SELECT id,name,owner_id FROM teams WHERE id=?',
              user.team_id,
            )
          : null;
        return json({
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null,
          team,
          challenges: cs.map((c) => ({
            ...publicChallenge(c),
            solved: solved.some((s) => s.challenge_id === c.id),
          })),
          solved,
          hints,
          points:
            solved.reduce((a, s) => a + s.points, 0) -
            hints.reduce((a, h) => a + h.cost, 0),
          runnerAvailable: !!(
            config.FLAG_KEY &&
            config.RUNNER_URL &&
            config.RUNNER_TOKEN
          ),
        });
      }
      if (path === 'leaderboard' && req.method === 'GET') {
        const rows = await all(
          `SELECT s.principal,COALESCE(t.name,u.name,'Challenger') AS name,CASE WHEN t.id IS NULL THEN 'solo' ELSE 'team' END AS type,COUNT(*) AS solves,SUM(s.points)-COALESCE((SELECT SUM(cost) FROM unlocks WHERE principal=s.principal),0) AS points,MAX(s.created) AS last_solve FROM solves s LEFT JOIN teams t ON s.principal='team:'||t.id LEFT JOIN users u ON s.principal='user:'||u.id GROUP BY s.principal ORDER BY points DESC,last_solve ASC,s.principal ASC LIMIT 100`,
        );
        return json({ rows });
      }
      check(user, 401, 'Sign in to continue');
      const p = principal(user);
      if (path === 'submissions' && req.method === 'GET') {
        return json({
          rows: await all(
            'SELECT s.id,s.correct,s.created,c.title,c.category,u.name FROM submissions s JOIN challenges c ON c.id=s.challenge_id JOIN users u ON u.id=s.user_id WHERE s.principal=? ORDER BY s.created DESC LIMIT 100',
            p,
          ),
        });
      }
      if (path === 'team' && req.method === 'GET') {
        return json({
          team: user.team_id
            ? await first(
                'SELECT id,name,owner_id FROM teams WHERE id=?',
                user.team_id,
              )
            : null,
          members: user.team_id
            ? await all(
                'SELECT name,id,role FROM users WHERE team_id=? ORDER BY created',
                user.team_id,
              )
            : [],
        });
      }
      if (path.startsWith('team/') && req.method === 'POST') {
        await rate('team:' + user.id, 10);
        check(!user.team_id, 409, 'You already belong to a team');
        const participation = await first(
          'SELECT 1 AS yes FROM solves WHERE principal=? UNION ALL SELECT 1 FROM unlocks WHERE principal=? LIMIT 1',
          p,
          p,
        );
        check(
          !participation,
          409,
          'Team membership is locked after your first solve or hint purchase to keep scoring fair',
        );
        if (path === 'team/create') {
          const name = String(body.name || '').trim();
          check(
            /^[\w -]{3,32}$/.test(name),
            400,
            'Team name must be 3–32 letters, numbers, spaces or hyphens',
          );
          const id = token(),
            invite = token();
          try {
            await db.batch([
              stmt(
                'INSERT INTO teams(id,name,owner_id,invite_hash,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND team_id IS NULL) AND NOT EXISTS(SELECT 1 FROM solves WHERE principal=?) AND NOT EXISTS(SELECT 1 FROM unlocks WHERE principal=?)',
                id,
                name,
                user.id,
                sha(invite),
                Date.now(),
                user.id,
                p,
                p,
              ),
              stmt(
                'UPDATE users SET team_id=? WHERE id=? AND team_id IS NULL AND EXISTS(SELECT 1 FROM teams WHERE id=?)',
                id,
                user.id,
                id,
              ),
            ]);
          } catch (e) {
            if (String(e).includes('UNIQUE'))
              throw new ApiError(409, 'Team name is taken');
            throw e;
          }
          check(
            await first(
              'SELECT id FROM users WHERE id=? AND team_id=?',
              user.id,
              id,
            ),
            409,
            'Membership changed during this request; refresh and try again',
          );
          await audit(user.id, 'team.created', id);
          return json({ invite, name }, 201);
        }
        if (path === 'team/join') {
          const team = await first(
            'SELECT * FROM teams WHERE invite_hash=?',
            sha(String(body.invite || '')),
          );
          check(team, 404, 'Invalid invite code');
          const result = await run(
            'UPDATE users SET team_id=? WHERE id=? AND team_id IS NULL AND (SELECT COUNT(*) FROM users WHERE team_id=?)<5 AND NOT EXISTS(SELECT 1 FROM solves WHERE principal=?) AND NOT EXISTS(SELECT 1 FROM unlocks WHERE principal=?)',
            team.id,
            user.id,
            team.id,
            p,
            p,
          );
          check(result.meta.changes, 409, 'Team is full');
          await audit(user.id, 'team.joined', team.id);
          return json({ ok: true });
        }
      }
      if (path === 'team/rotate-invite' && req.method === 'PATCH') {
        check(user.team_id, 400, 'Create a team first');
        const team = await first(
          'SELECT * FROM teams WHERE id=? AND owner_id=?',
          user.team_id,
          user.id,
        );
        check(team, 403, 'Only the captain can rotate invites');
        const invite = token();
        await run(
          'UPDATE teams SET invite_hash=? WHERE id=?',
          sha(invite),
          team.id,
        );
        return json({ invite });
      }
      const match = path.match(
        /^challenges\/([a-z0-9-]+)\/(submit|hint|instance)$/,
      );
      if (match) {
        const [, id, action] = match;
        check(req.method === 'POST', 405, 'Use POST');
        await rate('challenge:' + user.id, 30);
        const c = await first(
          'SELECT * FROM challenges WHERE id=? AND published=1',
          id,
        );
        check(c, 404, 'Challenge not found');
        if (c.prerequisite)
          check(
            await first(
              'SELECT id FROM solves WHERE principal=? AND challenge_id=?',
              p,
              c.prerequisite,
            ),
            403,
            'Solve the prerequisite challenge first',
          );
        if (action === 'hint') {
          check(
            !(await first(
              'SELECT id FROM solves WHERE principal=? AND challenge_id=?',
              p,
              id,
            )),
            409,
            'Already solved; no hint needed',
          );
          await run(
            "INSERT OR IGNORE INTO unlocks(id,principal,challenge_id,cost,created) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM solves WHERE principal=? AND challenge_id=?) AND EXISTS(SELECT 1 FROM users WHERE id=? AND COALESCE(team_id,'')=?)",
            token(),
            p,
            id,
            c.hint_cost,
            Date.now(),
            p,
            id,
            user.id,
            user.team_id || '',
          );
          check(
            await first(
              'SELECT id FROM unlocks WHERE principal=? AND challenge_id=?',
              p,
              id,
            ),
            409,
            'Participation changed during this request; refresh and try again',
          );
          return json({ hint: c.hint, cost: c.hint_cost });
        }
        if (action === 'instance') {
          check(
            c.environment,
            400,
            'This challenge uses downloadable evidence',
          );
          check(
            config.FLAG_KEY && config.RUNNER_URL && config.RUNNER_TOKEN,
            503,
            'The isolated lab runner is not configured. See the deployment guide.',
          );
          await rate('instance:' + p, 3, 60000);
          const result = await fetch(config.RUNNER_URL + '/instances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + config.RUNNER_TOKEN,
            },
            body: JSON.stringify({
              principal: sha(p),
              challenge: id,
              mode: c.environment,
              flag: instanceFlag(config.FLAG_KEY, p, id),
            }),
            signal: AbortSignal.timeout(20000),
          });
          check(
            result.ok,
            503,
            'Lab runner is unavailable; please try again shortly',
          );
          const data: any = await result.json();
          check(
            typeof data.url === 'string' && /^https?:\/\//.test(data.url),
            502,
            'Invalid runner response',
          );
          await audit(user.id, 'instance.started', id);
          return json({ url: data.url, expires: data.expires });
        }
        const flag = String(body.flag || '').trim();
        check(
          flag.length > 0 && flag.length <= 256,
          400,
          'Enter a flag of at most 256 characters',
        );
        await rate('flags:' + p, 12);
        check(
          !c.environment || config.FLAG_KEY,
          503,
          'Instance flags are not configured',
        );
        const expected = c.environment
          ? sha(instanceFlag(config.FLAG_KEY!, p, id))
          : c.flag_hash;
        const correct = safeEqual(sha(flag), expected);
        const results = await db.batch([
          stmt(
            "INSERT INTO submissions(id,principal,user_id,challenge_id,correct,created) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND COALESCE(team_id,'')=?)",
            token(),
            p,
            user.id,
            id,
            correct ? 1 : 0,
            Date.now(),
            user.id,
            user.team_id || '',
          ),
          ...(correct
            ? [
                stmt(
                  "INSERT OR IGNORE INTO solves(id,principal,user_id,challenge_id,points,created) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND COALESCE(team_id,'')=?)",
                  token(),
                  p,
                  user.id,
                  id,
                  c.points,
                  Date.now(),
                  user.id,
                  user.team_id || '',
                ),
              ]
            : []),
        ]);
        check(
          results[0].meta.changes,
          409,
          'Membership changed during this request; refresh and try again',
        );
        return json({
          correct,
          alreadySolved: correct && !results[1].meta.changes,
          message: correct
            ? results[1].meta.changes
              ? 'Flag captured. Well played!'
              : 'Your team has already solved this challenge.'
            : 'That flag is not correct. Revisit the evidence.',
        });
      }
      if (path === 'admin/claim' && req.method === 'POST') {
        await rate('claim:' + user.id, 3);
        check(
          config.ADMIN_BOOTSTRAP_TOKEN &&
            String(body.token || '').length >= 32 &&
            safeEqual(String(body.token), config.ADMIN_BOOTSTRAP_TOKEN),
          403,
          'Invalid administrator bootstrap token',
        );
        await run('UPDATE users SET role=? WHERE id=?', 'admin', user.id);
        await audit(user.id, 'admin.claimed');
        return json({ ok: true });
      }
      if (path.startsWith('admin/')) {
        check(
          ['admin', 'author'].includes(user.role),
          403,
          'Author access required',
        );
        if (path === 'admin/challenges' && req.method === 'GET') {
          return json({
            rows: (await all('SELECT * FROM challenges ORDER BY rowid'))
              .filter((c) => user.role === 'admin' || c.author_id === user.id)
              .map((c) => ({
                ...publicChallenge(c),
                hint: c.hint,
                hintCost: c.hint_cost,
              })),
          });
        }
        if (path === 'admin/audit' && req.method === 'GET') {
          check(user.role === 'admin', 403, 'Administrator access required');
          return json({
            rows: await all(
              'SELECT a.event,a.target,a.created,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created DESC LIMIT 100',
            ),
            metrics: await first(
              'SELECT (SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM submissions) AS submissions,(SELECT COUNT(*) FROM solves) AS solves,(SELECT COUNT(*) FROM teams) AS teams',
            ),
          });
        }
        if (path === 'admin/challenges' && req.method === 'POST') {
          const {
            id,
            title,
            category,
            difficulty,
            summary,
            description,
            flag,
            hint,
          } = body;
          check(
            typeof id === 'string' && /^[a-z0-9][a-z0-9-]{2,63}$/.test(id),
            400,
            'Use a lowercase URL slug (3–64 characters)',
          );
          check(
            categories.slice(1).includes(category) &&
              ['Easy', 'Medium', 'Hard'].includes(difficulty),
            400,
            'Invalid category or difficulty',
          );
          for (const [k, v, max] of [
            ['title', title, 80],
            ['summary', summary, 160],
            ['description', description, 8000],
            ['hint', hint, 1000],
          ] as const)
            check(
              typeof v === 'string' && v.trim().length > 0 && v.length <= max,
              400,
              'Invalid ' + k,
            );
          check(
            Number.isInteger(body.points) &&
              body.points >= 50 &&
              body.points <= 1000,
            400,
            'Points must be 50–1000',
          );
          check(
            Number.isInteger(body.hintCost) &&
              body.hintCost >= 0 &&
              body.hintCost < body.points,
            400,
            'Hint cost must be less than points',
          );
          check(
            typeof flag === 'string' && /^CTF\{.{1,240}\}$/.test(flag),
            400,
            'Flag must use CTF{...} format',
          );
          check(
            Array.isArray(body.tags) &&
              body.tags.length <= 5 &&
              body.tags.every(
                (t: any) => typeof t === 'string' && t.length <= 30,
              ),
            400,
            'Use up to five short tags',
          );
          check(
            typeof body.published === 'boolean',
            400,
            'Published must be boolean',
          );
          try {
            await run(
              'INSERT INTO challenges(id,title,category,difficulty,points,summary,description,tags,artifact,flag_hash,hint,hint_cost,published,author_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
              id,
              title,
              category,
              difficulty,
              body.points,
              summary,
              description,
              JSON.stringify(body.tags),
              '',
              sha(flag),
              hint,
              body.hintCost,
              body.published ? 1 : 0,
              user.id,
            );
          } catch (e) {
            if (String(e).includes('UNIQUE'))
              throw new ApiError(409, 'That URL slug is already in use');
            throw e;
          }
          await audit(user.id, 'challenge.created', id);
          return json({ ok: true }, 201);
        }
        if (path === 'admin/publish' && req.method === 'PATCH') {
          check(
            typeof body.published === 'boolean',
            400,
            'Published must be boolean',
          );
          const c = await first('SELECT * FROM challenges WHERE id=?', body.id);
          check(c, 404, 'Challenge not found');
          check(
            user.role === 'admin' || c.author_id === user.id,
            403,
            'Not your challenge',
          );
          await run(
            'UPDATE challenges SET published=? WHERE id=?',
            body.published ? 1 : 0,
            body.id,
          );
          await audit(
            user.id,
            body.published ? 'challenge.published' : 'challenge.hidden',
            body.id,
          );
          return json({ ok: true });
        }
        if (path === 'admin/role' && req.method === 'PATCH') {
          check(user.role === 'admin', 403, 'Administrator access required');
          check(
            ['player', 'author'].includes(body.role),
            400,
            'Role must be player or author',
          );
          const target = await first(
            'SELECT * FROM users WHERE name=?',
            body.name,
          );
          check(
            target && target.role !== 'admin',
            400,
            'Cannot change this account',
          );
          await run('UPDATE users SET role=? WHERE id=?', body.role, target.id);
          await audit(user.id, 'role.changed', target.id);
          return json({ ok: true });
        }
        if (path === 'admin/maintenance' && req.method === 'POST') {
          check(user.role === 'admin', 403, 'Administrator access required');
          await db.batch([
            stmt('DELETE FROM limits WHERE expires<?', Date.now()),
            stmt('DELETE FROM sessions WHERE expires<?', Date.now()),
          ]);
          return json({ ok: true });
        }
      }
      throw new ApiError(404, 'Endpoint not found');
    } catch (e) {
      if (e instanceof ApiError)
        return json(
          { error: e.message },
          e.status,
          e.status === 429 ? { 'Retry-After': '60' } : {},
        );
      console.error(
        JSON.stringify({
          event: 'api.error',
          path,
          actor,
          error: e instanceof Error ? e.message : 'unknown',
        }),
      );
      return json(
        { error: 'An unexpected error occurred. Please retry.' },
        500,
      );
    } finally {
      console.log(
        JSON.stringify({
          event: 'api.request',
          method: req.method,
          path,
          actor,
          durationMs: Date.now() - started,
        }),
      );
    }
  };
}
