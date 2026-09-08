# Verification results

Verification performed on macOS with Node.js 26.0.0 and Python 3.14.2, September 8–9, 2026.

| Check | Result |
| --- | --- |
| Production build | Passed; Worker ESM and browser assets generated |
| TypeScript type check | Passed |
| Production dependency audit | Zero known vulnerabilities after framework and undici patches |
| Backend integration tests | 14 passed |
| Evidence and lab HTTP tests | 9 passed |
| Compiled-server HTTP smoke checks | 32 passed |
| Browser registration and team creation | Passed with local test account |
| Browser incorrect/correct flag submission | Passed; solve persisted and score was 90 after a 10-point hint |
| Browser mobile menu | Passed; selecting Leaderboard closes menu |
| Browser responsive check | 390px mobile inspected; header overflow found, corrected and verified at exactly 390px page width; desktop layout checked at 1440px |
| WebMCP | Both tools registered; valid list/duplicate submit and invalid inputs verified |
| Public JavaScript secret scan | No flag hashes, password implementation, organizer answer or locked-hint text found |
| Docker build and network isolation | Not run: Docker is not installed |
| Full lint policy | Not passed; see below |
| Hosted publication | Blocked: existing Sites project returns NOT_FOUND and current account lists no sites |

The API tests exercise real SQLite with the production handler and a small D1 adapter; they do not emulate Cloudflare platform throttling. The smoke tests use the compiled Worker under Wrangler, not an in-memory mock. The two vulnerable lab services were started separately and exercised over HTTP: direct unauthorized paths failed, and the intended exploit chains retrieved their test flags.

The browser checks verified actual persisted player behavior. They are manual agent-driven checks, not a committed Playwright regression suite. WebMCP duplicate submission reported already solved and did not award points twice. Invalid tool arguments failed intentionally.

## Lint gap

The generated strict Oxlint configuration still reports explicit-any boundary types in application code and accessibility/compiler warnings in the bundled UI catalog. The resumed pass resolved application hook/dependency, promise-handling, semantic feedback, form-label and navigation diagnostics without relaxing rules. TypeScript compilation and functional tests pass, but the stricter lint gate remains failing. The rules were not relaxed to hide this. Replacing loose API/view types with fully typed contracts and resolving the remaining hook/catalog warnings is required before adopting lint as a release gate.

## Scope not claimed

No independent penetration test, public adversarial event, sustained load test, Docker escape assessment, backup restore drill, screen-reader audit, or cloud lab provisioning was performed. The production preview is not evidence of production-scale capacity. Test accounts were created only in the local SQLite database.

## Resumed verification

The continuation preserved existing source and local SQLite state. Fixed zero-cost hints incorrectly displaying a fallback penalty; a new integration test verifies repeated free-hint unlocks and full points after solving. Associated author selectors with their labels, used semantic live status output, stabilized refresh effects, and switched mobile media-query state to an external-store subscription. Keyboard activation of Leaderboard was checked in the mobile sidebar; navigation completed and the dialog closed.

Production build, TypeScript, all 14 API tests, all 9 Python tests and 32 HTTP smoke checks passed. Python socket tests required the localhost-capable execution context. Rebuilding underneath the older preview left its asset responses stale; restarting the compiled preview on port 4177 restored all evidence downloads and all smoke checks passed. Full lint remains failing for the documented types and bundled component issues.
