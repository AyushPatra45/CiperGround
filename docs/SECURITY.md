# Security review

## Implemented controls

- Passwords use salted scrypt (N=16384, r=8, p=5, 32-byte output). Passwords are 12–128 characters. Each session uses a new random 256-bit opaque token, persisted only as a hash, expires after seven days, and is revoked on logout.
- Cookies are HttpOnly and SameSite=Lax, with Secure on HTTPS. No authentication or flag is stored in localStorage. Application roles are checked on every privileged API call.
- JSON mutation requests require a matching Origin. SQL is parameterized. Text rendering uses React escaping; there is no HTML or Markdown execution surface.
- Prepared-statement batches and unique constraints prevent duplicate scoring. Team membership and hint/solve writes check the current principal in SQL, preventing stale membership writes.
- The server stores flag hashes and constant-time compares them. Submission logs omit flag contents. Unpublished challenges and locked hint text are removed from public API representations.
- Database-backed rate counters apply to sign-in, flag submissions, hints, team operations and instance launches. Public API errors are sanitized. Auth responses avoid confirming whether a login email exists.
- Structured request logs contain event, method, path, account ID and duration; no passwords, session tokens, raw flags or request bodies. Administrator audit events cover account creation, roles, publishing, teams and lab launches.
- CSP restricts scripts/styles to same-origin and inline framework assets, disables plugins, restricts base and form origins, and limits framing to the app and ChatGPT. `nosniff`, referrer and permissions headers are included. Inline scripts remain allowed for the framework; nonce-based CSP is future work.
- Vulnerable labs run outside the platform. Container configuration uses non-root UID 65534, dropped capabilities, no-new-privileges, read-only filesystem, bounded tmpfs, 64 MB RAM, 0.5 CPU, 32 PIDs and 30-minute TTL. Image and lab modes are allowlisted.

## Findings fixed during development

1. The paid-hint confirmation did not close after purchase; the action now closes it before requesting the hint.
2. The scheduling challenge expected an incorrect vault-ready time. Exhaustive scheduling validation corrected the answer to 12:11.
3. The production preview used a different default SQLite persistence directory from migrations. The start and migration scripts now explicitly share `.wrangler/state`.
4. Production configuration initially duplicated the DB binding. The migration-only Wrangler configuration is now separate from the application build configuration.
5. Team enrollment could race a solve/hint request. SQL predicates now reject stale membership and atomically preserve the scoring principal.
6. The scaffold contained high-severity dependency advisories. React/RSC, Vinext, Vite and undici were patched; the final production audit reports zero known vulnerabilities.
7. Dynamically authored challenge URLs were not opened after state loaded. Deferred URL resolution now opens them and reports unavailable IDs.

8. Runner input validation could throw for non-string fields and startup failures could orphan networks. Requests now reject malformed types, failed starts clean up, and regression tests cover these paths. Independent runners use ownership labels so restart cleanup does not remove another runner's labs.
9. Explicit API contracts and unknown-input validation replace loose boundary types; the full lint gate now passes.

## Remaining production requirements and limits

This is a working application foundation, not a completed independent penetration test or an assurance of hostile multi-tenant safety.

- Docker is not installed in the build environment. The two lab applications were tested through real HTTP requests; Docker isolation, network policy, TTL/restart behavior and multi-host capacity have not been executed here.
- The runner validates JSON field types, bounds request bodies and read time, cleans failed starts, creates a separate internal network per instance, and scopes restart cleanup to its `RUNNER_ID` label. Validate this policy on the actual host, including host-service and metadata access. A dedicated VM per high-risk challenge is stronger than Docker alone.
- The runner is privileged through Docker and must live on a dedicated disposable host. Do not mount the Docker socket into the platform or expose the runner directly to the public Internet. Place its authenticated control API behind TLS and a network allowlist.
- Application registration does not include email verification, self-service password reset, MFA or recovery codes. Bootstrap administration uses a server-configured secret; remove that environment value after claiming the organizer account.
- No competition scheduling/freeze, account suspension UI, team leave/transfer, challenge-edit form, file-upload scanning or per-event tenancy is implemented. Authors can create and publish/unpublish challenges; existing evidence/metadata can be updated through reviewed source/data migrations.
- Most starter artifacts are small text fixtures. They are suitable for functional demonstration and education, but need richer evidence and fresh variants before a serious public competition. Repository readers can see the organizer solutions.
- The API limits mutation bodies to 16 KB while streaming, including requests without Content-Length. Configure global edge rate limiting for an Internet-facing event. Add CAPTCHA or verification only if abuse requires it.
- Authentication uses synchronous scrypt; size the paid Worker CPU budget for its cost and load-test concurrency. No large-scale load or DDoS test was run.
- Health checks verify DB/schema availability. Configure uptime checks, centralized log retention, billing alerts, D1 backups and restore drills before a public launch.
- Dependency scan and final validation results are recorded in `TEST_RESULTS.md`; a passing scan is not a guarantee of vulnerability absence.

## Docker ingress correction

Linux CI exposed that an internal-only container had no published port. Each lab now uses a trusted fixed-upstream gateway with a separate ingress bridge. The vulnerable app remains internal and has no host-published port; the gateway rejects absolute-form proxy requests, bounds bodies/responses, strips hop-by-hop headers and never accepts an arbitrary destination. Gateways add 32 MB and 0.25 CPU per active instance. The test checks both apps are reachable through their gateways before probing cross-instance connectivity, preventing a stopped listener from falsely appearing isolated.
