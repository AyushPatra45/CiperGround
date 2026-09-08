# Cipherground

A working CTF arena with a dark responsive interface, secure player accounts, persistent scoring, teams, author tools and twelve evidence-driven challenges across Web, Forensics, Cryptography, OSINT, Reverse Engineering and Misc.

## Quick start

```sh
npm ci
npm run db:migrate
npm run dev -- --hostname 127.0.0.1
```

Open the printed Local URL and create an account. For a compiled preview, use `npm run build` followed by `npm run start -- --ip 127.0.0.1 --port 4173`.

## Features

- Responsive challenge library with category, difficulty, search and solve-status filters.
- Shareable challenge URLs, evidence downloads, prerequisite chains and flag submissions.
- Email/password registration, login, hashed opaque sessions, protected roles and logout.
- Server-validated flags, one reward per challenge, points snapshots, one-time hint penalties.
- Persisted leaderboard, tie-breaking and automatic 30-second refresh.
- Teams of five, hashed invite codes, captain rotation, shared solves/hints and roster.
- Submission history without storing raw submitted flags.
- Author studio with draft creation, publish/unpublish, author grants, audit events and metrics.
- Twelve example investigations, organizer solutions and reproducible evidence generator.
- Two intentionally vulnerable web labs, Dockerfile, bounded temporary runner and per-principal flags.
- REST API, D1 database, Drizzle migrations, database-backed rate limiting and security headers.
- Automated backend, evidence, lab-HTTP and compiled-server smoke tests.

## Documentation

- [Architecture and technology](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Local setup and deployment](docs/DEPLOYMENT.md)
- [Security analysis and known limits](docs/SECURITY.md)
- [Test results](docs/TEST_RESULTS.md)
- [Organizer solutions — keep private](docs/SOLUTIONS.md)

## Important limits

Docker infrastructure is included but not provisioned or verified on this machine. Ten downloadable challenges work without it; two Web instances require the dedicated runner. The starter evidence is intentionally compact. This project needs production load testing, lab isolation validation, email verification/recovery, backups and operational monitoring before a public hostile competition. It does not claim to be AI-proof or independently security-audited.

## Next improvements

Richer PCAP/disk/binary artifacts and per-team variants; reviewed write-up submissions; scheduled events and scoreboard freeze; challenge editing and scanned uploads; MFA and account recovery; isolated per-instance networks or microVMs; distributed runner capacity; telemetry dashboards and restore drills.
