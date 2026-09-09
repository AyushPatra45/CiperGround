# Run and deploy Cipherground

## Local platform

Use Node.js 22.13+ (Node 24 LTS recommended), npm and Python 3.10+. The shipped lockfile is the source of dependency versions.

```sh
npm ci
npm run setup:local
npm run db:migrate
npm run dev -- --hostname 127.0.0.1
```

Open the Local URL printed by the server. Port 3000 is the default; it selects another if occupied. Registration creates a durable local account. There are no default administrator credentials and no production seed players. Local test scripts create accounts with `example.test` email addresses.

Compile and run the production Worker locally:

```sh
npm run build
npm run start -- --ip 127.0.0.1 --port 4173
```

Both the migration and start commands use `.wrangler/state`. Do not copy this development database into production.

## Administrator setup

```sh
npm run setup:local
```

This writes unique local secrets to ignored `.dev.vars` without printing them. Restart the development server, register your organizer account, open Author studio, and enter that token. The account becomes administrator. Remove the bootstrap value afterward and restart. Use the studio to grant author access to registered handles. Never add `.dev.vars` to Git.

## Local isolated web labs

Docker Engine or Docker Desktop must be installed and running. Run `npm run test:docker` after building to verify resource settings, per-instance connectivity isolation, crash recovery, and expiry cleanup. This requires an actual Docker daemon. The separate integration job passed on GitHub Linux CI; normal Python runner tests mock Docker and do not prove isolation.

```sh
npm run lab:build
export RUNNER_TOKEN="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
npm run lab:runner
```

Set the same `RUNNER_TOKEN` in `.dev.vars`, `RUNNER_URL=http://127.0.0.1:9090`, and an independently generated `FLAG_KEY`. Restart the app. The two Web challenges can now request their own temporary containers. The runner only listens on loopback by default, returns loopback lab URLs, and removes expired instances every ten seconds.

The runner defaults to 20 concurrent instances and 30-minute lifetimes. Relevant runner variables: `RUNNER_TOKEN`, `RUNNER_PORT`, `RUNNER_BIND_IP`, `LAB_PUBLIC_HOST`, `LAB_BIND_IP`, `MAX_LABS`, `LAB_IMAGE`, `RUNNER_ID`, `LAB_TTL_SECONDS`. Keep a stable, unique `RUNNER_ID` per runner (default `default`); restart cleanup only reclaims its own labeled resources. `LAB_TTL_SECONDS` defaults to 1800 and must be 1–3600. If upgrading the original runner, remove its legacy `cipherground.lab=true` containers and networks during a maintenance window; they have no runner-ownership label. These configure the separate runner process, not the Worker.

## Hosted Sites deployment

Current delivery status: publication could not complete because the existing project returns `NOT_FOUND` from the current Sites connection, which lists no sites. The original project ID is preserved. Reconnect to the account/workspace that owns that project before resuming publication. The local application and deployment archive remain usable.

`.openai/hosting.json` records the existing Cipherground project and logical DB binding. Reuse its project ID; do not initialize another Site. The hosting workflow packages `dist/server`, `dist/client`, the hosting manifest and generated `drizzle` migrations, saves a version from the committed source, and publishes that version. Sites applies D1 migrations before uploading the Worker.

Manage production `FLAG_KEY`, `RUNNER_URL`, `RUNNER_TOKEN`, and the temporary `ADMIN_BOOTSTRAP_TOKEN` through the Sites environment-variable tools as secret values where appropriate. These are runtime values, never `NEXT_PUBLIC_*` variables or hosting-manifest entries. Deploy a new version after changing them.

The initial deployment is owner-private. Sharing the platform with a public competition requires explicitly changing the audience after its operational checks are complete. The Sites outer identity gate and the platform’s player accounts are distinct.

## Deploy on your own Cloudflare account

Use your own Cloudflare account. Wrangler login opens an authorization flow you must complete.

```sh
npx wrangler login
npx wrangler d1 create cipherground
```

Copy the returned **database ID** (not an API token) into the environment for the deployment preparation command:

```sh
CF_D1_DATABASE_ID=YOUR_DATABASE_UUID CF_WORKER_NAME=cipherground npm run deploy:prepare
```

This creates `dist/server/wrangler.deploy.json` from the built Worker configuration, preserving module rules and assets while binding the real database and enabling Worker observability. It rejects missing and placeholder database IDs. The configuration lives in ignored build output; regenerate it after each build.

Review the configuration, then run:

```sh
npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.deploy.json
npx wrangler secret put FLAG_KEY --config dist/server/wrangler.deploy.json
npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN --config dist/server/wrangler.deploy.json
npx wrangler deploy --config dist/server/wrangler.deploy.json
```

Use separately generated 32-byte random secrets; enter them at Wrangler's prompt, never in Git or shell command arguments. After claiming your organizer account, delete the bootstrap secret with `npx wrangler secret delete ADMIN_BOOTSTRAP_TOKEN --config dist/server/wrangler.deploy.json`. Add `RUNNER_URL` and `RUNNER_TOKEN` using the same `secret put` command when a dedicated lab host is ready. Ten downloadable challenges work while the runner is disabled.

A workers.dev deployment exposes the website publicly. Before deploying, verify that you intend public access or configure Cloudflare Access for staging. Configure HTTPS domain routing, edge rate rules, request-size limits, uptime monitoring, billing alerts and D1 backups. Perform a staging smoke test before admitting competitors; the bundled state-mutating smoke script is deliberately restricted to localhost.

## GitHub verification

`.github/workflows/ci.yml` runs on pushes and pull requests with read-only repository permissions and pinned official actions. Its two jobs validate the platform and real Docker behavior on an isolated Linux CI runner. No deployment credentials are required. Require both jobs in GitHub branch protection before merging release changes. Passing CI is not a substitute for validating the public lab host firewall and network policy.

## Public lab host

Use a separate disposable Linux VM with a patched Docker daemon. Build the allowlisted image locally on that host. Protect the runner control endpoint with TLS, a network allowlist and its bearer secret. Expose lab services on a different origin from the platform, never under the platform’s cookie scope. The simple runner returns HTTP host-port URLs; put a TLS gateway in front and adapt the returned URL mapping for public HTTPS labs. Do not simply open every Docker port to the Internet.

See the runner isolation limitations in `SECURITY.md`. Prove network isolation, metadata blocking, expiry cleanup, host resource bounds and restart recovery before inviting untrusted users. The website can be deployed while the runner is disabled; ten downloadable investigations remain usable.

## Maintenance

- `npm run typecheck`, `npm test`, `npm run build` verify code, logic, evidence and compilation.
- `TEST_BASE_URL=http://127.0.0.1:4173 npm run test:smoke` exercises the compiled server. It only accepts localhost targets and creates test records.
- `/api/health` is suitable for an uptime probe. Use Worker logs and Author studio metrics/audit for initial monitoring.
- Call `POST /api/admin/maintenance` periodically with an admin session to remove expired sessions and rate-limit buckets.
- Back up D1 before migrations. Version migrations are append-only after deployment. Practice restoring into a separate database.
- Keep organizer solutions and the source repository private while challenges are active.
