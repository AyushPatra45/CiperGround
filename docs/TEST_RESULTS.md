# Verification results

Verification performed on macOS with Node.js 26.0.0 and Python 3.14.2, September 8–10, 2026.

| Check | Result |
| --- | --- |
| Production build | Passed; Worker ESM and browser assets generated |
| TypeScript type check | Passed |
| Production dependency audit | Zero known vulnerabilities after framework and undici patches |
| Backend integration tests | 15 passed |
| Evidence, lab/gateway HTTP and runner regression tests | 16 passed |
| Compiled-server HTTP smoke checks | 32 passed |
| Browser registration and team creation | Passed with local test account |
| Browser incorrect/correct flag submission | Passed; solve persisted and score was 90 after a 10-point hint |
| Browser mobile menu | Passed; selecting Leaderboard closes menu |
| Browser responsive check | 390px mobile inspected; header overflow found, corrected and verified at exactly 390px page width; desktop layout checked at 1440px |
| WebMCP | Both tools registered; valid list/duplicate submit and invalid inputs verified |
| Public JavaScript secret scan | No flag hashes, password implementation, organizer answer or locked-hint text found |
| Docker build, isolation and lifecycle | Passed on GitHub Linux runner; Docker remains absent locally |
| Full lint policy | Passed; typed API contracts and component fixes |
| Public Cloudflare deployment | Passed; Worker, assets, secrets and APAC D1 binding published on workers.dev |
| Live production journey | 29 checks passed; pages, headers, D1 health, registration, login, admin claim, flag validation, persistence and ten artifacts |

The API tests exercise real SQLite with the production handler and a small D1 adapter; they do not emulate Cloudflare platform throttling. The smoke tests use the compiled Worker under Wrangler, not an in-memory mock. The two vulnerable lab services were started separately and exercised over HTTP: direct unauthorized paths failed, and the intended exploit chains retrieved their test flags.

The browser checks verified actual persisted player behavior. They are manual agent-driven checks, not a committed Playwright regression suite. WebMCP duplicate submission reported already solved and did not award points twice. Invalid tool arguments failed intentionally.

## Lint validation

`npm run lint` and TypeScript now pass. Application and server boundaries use explicit types, including unknown JSON validation and typed database rows. Shared component fixes cover native group elements, labels, status output, carousel listener cleanup and chart payload keys. Three small source-scoped exceptions retain valid ARIA carousel/list composition and the input addon's pointer focus convenience; no application diagnostics or project-wide rules are disabled.

## Scope not claimed

No independent penetration test, public adversarial event, sustained load test, Docker escape assessment, backup restore drill, screen-reader audit, or cloud lab provisioning was performed. The production deployment is not evidence of production-scale capacity. The temporary production launch-check account and its submissions were removed after verification.

## Resumed verification

The continuation preserved existing source and local SQLite state. Fixed zero-cost hints incorrectly displaying a fallback penalty; a new integration test verifies repeated free-hint unlocks and full points after solving. Associated author selectors with their labels, used semantic live status output, stabilized refresh effects, and switched mobile media-query state to an external-store subscription. Keyboard activation of Leaderboard was checked in the mobile sidebar; navigation completed and the dialog closed.

Production build, TypeScript, all 14 API tests, all 9 Python tests and 32 HTTP smoke checks passed. Python socket tests required the localhost-capable execution context. Rebuilding underneath the older preview left its asset responses stale; restarting the compiled preview on port 4177 restored all evidence downloads and all smoke checks passed. The subsequent GitHub-readiness pass resolved the remaining lint errors.

## GitHub-readiness pass

The remote `main` and `codex/cipherground-platform` refs were verified at `c74f8718e0471acf72e5a8a27934124707fe6e44`, matching the user's local README/license commit. Tracked files contained no actual local runtime secrets, and Git history contained no `.dev.vars`, `.wrangler`, `node_modules`, or `outputs` paths. The sample solutions are intentionally present in source; these examples should not be used as secret live competition material.

Added pinned, read-only GitHub Actions jobs for the platform and real Docker integration. The Docker job exercises configuration limits, unauthorized requests, reuse, capacity, cross-instance networking, intended flag retrieval, hard-crash recovery and TTL cleanup. Local runner regression tests mock Docker and are reported separately from real isolation tests. The real Docker run subsequently passed after the ingress correction described below.

Verified the deployment helper rejects missing IDs, preserves asset/module configuration, explicitly enables the workers.dev route, and disables preview URLs. The production deployment uses the authenticated Cloudflare account and its real D1 database.

## Public deployment verification

CipherGround was published at [cipherground.cipherground.workers.dev](https://cipherground.cipherground.workers.dev/) with Worker observability enabled. The live health endpoint returned HTTP 200 with `database: connected`, the expected CSP and hardening headers were present, all eight main routes rendered, all twelve challenges loaded, and all ten downloadable artifacts were reachable.

A temporary production account completed registration, administrator bootstrap, wrong and correct flag submissions, submission-history persistence, logout and login. All 29 checks passed. Its sessions, audit events, solve, submissions and user row were then removed; a D1 query confirmed zero remaining launch-check users. The isolated runner remains intentionally disabled until a separate hardened Docker host is provisioned.

## Real Docker verification

[GitHub Actions run 34385687549](https://github.com/AyushPatra45/CiperGround/actions/runs/34385687549) passed both `platform` and `docker-isolation` on commit `de64904`. The first run exposed missing published ports for internal-only containers; the fix introduced per-instance fixed-upstream gateways. The successful rerun verified two reachable labs on separate internal networks, denied cross-instance TCP access, container UID/read-only/capability/CPU/RAM/PID settings, authentication and malformed input, instance reuse, capacity rejection, the intended cache exploit, gateway rejection of absolute-form proxy requests, recovery after a hard runner crash, and automatic expiry cleanup. This proves the tested Linux CI configuration, not an arbitrary production host firewall or resistance to Docker escapes.

Three additional local real-HTTP gateway regression tests passed: both intended challenge chains, plus fixed-destination/request-framing enforcement. The repository now has 15 API tests and 16 Python tests, plus 32 compiled-server HTTP checks and the separate Docker integration script. Browser sign-in restored the persisted team and 90-point score, and the typed WebMCP flag tool rejected malformed input and prevented duplicate points.
