# API reference

All endpoints are under `/api`. Responses are JSON with `Cache-Control: no-store`. Errors use `{ "error": "message" }` and the appropriate status. Mutation requests require JSON and an `Origin` matching the request origin. Browser clients use the HttpOnly `cg_session` cookie with same-origin credentials.

| Method | Path | Access / body |
| --- | --- | --- |
| GET | `/health` | Database health, no sensitive details |
| GET | `/state` | Published challenges, current user/team, solves, hint costs, score, runner availability |
| POST | `/auth/register` | `{name,email,password}`; 3–24 character handle, 12–128 character password |
| POST | `/auth/login` | `{email,password}` |
| POST | `/auth/logout` | `{}`; revokes session |
| GET | `/leaderboard` | Top 100 scoring principals |
| POST | `/challenges/:id/submit` | Player; `{flag}`; case-sensitive, surrounding whitespace ignored |
| POST | `/challenges/:id/hint` | Player; `{}`; first call charges once, later calls retrieve the same hint |
| POST | `/challenges/:id/instance` | Player; `{}`; allowlisted web labs only |
| GET | `/submissions` | Player; latest 100 principal attempts, without submitted flags |
| GET | `/team` | Player; own team and roster |
| POST | `/team/create` | Player; `{name}`; returns a one-time displayed invite |
| POST | `/team/join` | Player; `{invite}` |
| PATCH | `/team/rotate-invite` | Captain; `{}`; invalidates previous invite |
| POST | `/admin/claim` | Signed-in organizer; `{token}` matching environment bootstrap secret |
| GET | `/admin/challenges` | Admin: all; author: own challenges |
| POST | `/admin/challenges` | Admin/author; challenge fields below |
| PATCH | `/admin/publish` | Admin/own author; `{id,published}` |
| PATCH | `/admin/role` | Admin; `{name,role}` where role is `player` or `author` |
| GET | `/admin/audit` | Admin; metrics and 100 recent audit events |
| POST | `/admin/maintenance` | Admin; `{}`; remove expired rate buckets and sessions |

New challenge body: `{id,title,category,difficulty,points,summary,description,tags,flag,hint,hintCost,published}`. Points must be integers 50–1000; hint cost must be a nonnegative integer smaller than points. New author-created challenges hold their evidence in their description. Arbitrary file uploads and user-provided Docker images are deliberately not exposed.

12 flag attempts per minute per scoring principal; 30 challenge actions per minute per account; 15 authentication requests per minute per source IP and 10 per email; 3 instance starts per minute per principal. D1 atomic counters apply across Worker isolates. Responses include HTTP 429 and `Retry-After: 60`. A public deployment also needs an edge-wide abuse rule for anonymous traffic.

Feature-detected WebMCP tools: `list_ctf_challenges` reads safe state; `submit_ctf_flag` submits through the same authenticated endpoint and refreshes visible state. WebMCP provides no shortcut around authentication, prerequisites, or rate limits.
