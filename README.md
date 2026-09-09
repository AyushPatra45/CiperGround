<div align="center">

# 🔐 CipherGround

### A Full-Stack Capture The Flag (CTF) Competition Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A dark-themed, responsive CTF arena with secure player accounts, persistent scoring, team management, author tools, and **12 example challenges (10 downloadable, 2 requiring a Docker runner)** across 6 categories.

</div>

---

## ✨ Features

| Category | Highlights |
|---|---|
| 🎯 **Challenges** | 12 investigations across Web, Forensics, Cryptography, OSINT, Reverse Engineering & Misc |
| 👤 **Auth** | Email/password registration, hashed sessions, protected roles |
| 🏆 **Scoring** | Server-validated flags, one-time hint penalties, persistent leaderboard with tie-breaking |
| 👥 **Teams** | Teams of 5, hashed invite codes, captain rotation, shared solves |
| ✍️ **Author Studio** | Draft/publish challenges, author grants, audit events & metrics |
| 🐳 **Web Labs** | 2 intentionally vulnerable Docker labs with per-principal flags |
| 🔒 **Security** | Rate-limited API, security headers, constant-time flag comparison |
| 🧪 **Tests** | Automated backend, evidence, lab-HTTP & compiled server smoke tests |

---

## 🏗️ Architecture

```
Browser ──► React 19 App (Vinext/RSC)
                │
                ▼
         Cloudflare Worker API
                │
        ┌───────┴────────┐
        ▼                ▼
   D1 / SQLite      Lab Runner (Docker)
  (Drizzle ORM)    Isolated Web Labs
```

- **Frontend**: React 19 + TypeScript, Vinext App Router, Tailwind CSS 4, Base UI / Shadcn components
- **Backend**: Cloudflare Worker with `nodejs_compat`, same-origin API
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM versioned migrations
- **Labs**: Docker-isolated vulnerable web apps on a separate host

> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full trust-boundary and data-model details.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22.13 (Node 24 LTS recommended)
- **npm**
- **Python** ≥ 3.10 (for tests & lab runner)

### 1. Install dependencies

```sh
npm ci
```

### 2. Set up local environment

Generate local secrets without overwriting an existing setup:

```sh
npm run setup:local
```

This creates ignored `.dev.vars` with unique keys. Do not copy placeholder secrets from `.env.example`. If `.dev.vars` already exists, the helper preserves it; replace any template values manually before use.

### 3. Run database migrations

```sh
npm run db:migrate
```

### 4. Start the dev server

```sh
npm run dev -- --hostname 127.0.0.1
```

Open the printed Local URL in your browser, then create an account.

---

## 👑 Admin Setup

After running the setup helper above, find `ADMIN_BOOTSTRAP_TOKEN` in your local `.dev.vars` file. The helper does not change existing secrets. Restart the dev server, register your organizer account, open **Author Studio**, and enter the bootstrap token. Your account becomes administrator. Remove the token afterward and restart.

---

## 🐳 Local Web Labs (Optional)

Requires Docker Engine or Docker Desktop running.

```sh
npm run lab:build
export RUNNER_TOKEN="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
npm run lab:runner
```

Set `RUNNER_TOKEN` and `RUNNER_URL=http://127.0.0.1:9090` in `.dev.vars`. The two Web challenges can then spin up their own temporary containers.

---

## 🏭 Production Build

```sh
npm run build
npm run start -- --ip 127.0.0.1 --port 4173
```

Run smoke tests against the compiled server:

```sh
TEST_BASE_URL=http://127.0.0.1:4173 npm run test:smoke
```

---

## ☁️ Deploy to Cloudflare

Use the [complete deployment guide](docs/DEPLOYMENT.md). It covers authentication, the real D1 database binding, migrations, runtime secrets and the compiled Worker. The generated local database ID is a placeholder and must never be used for production.

---

## 🗺️ Routes

| Route | Description |
|---|---|
| `/` | Challenge library — search, filter by category, difficulty & solve status |
| `/challenges/:id` | Shareable challenge page, evidence downloads, hints, flag submission |
| `/leaderboard` | Live persistent rankings, auto-refreshed every 30 s |
| `/team` | Create / join team, manage roster, rotate invite code |
| `/submissions` | Your last 100 flag attempts |
| `/account` | Register, sign in, profile, sign out |
| `/studio` | Author challenge creation, publishing, metrics & audit *(restricted)* |
| `/guide` | Competition rules, scoring, hints & scope |

---

## 🧪 Testing

GitHub Actions runs lint, types, unit/integration tests, dependency audit, the production build, compiled HTTP checks, and a separate real Docker isolation job on pushes and pull requests.

```sh
# Run all tests (API + Python evidence tests)
npm test

# API tests only
npm run test:api

# Smoke tests against compiled server
TEST_BASE_URL=http://127.0.0.1:4173 npm run test:smoke

# Real Docker isolation and lifecycle checks (Docker must be running)
npm run lab:build
npm run test:docker

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📁 Project Structure

```
cipherground/
├── app/                  # React pages, layouts, API routes
│   ├── api/              # Cloudflare Worker API handlers
│   ├── challenges/       # Challenge detail pages
│   └── arena.tsx         # Main challenge arena
├── challenges/           # Lab runners & vulnerable web apps
│   └── web/              # Docker-based CTF web labs
├── components/           # Reusable UI components (Shadcn/Base UI)
├── db/                   # Drizzle schema & Wrangler DB config
├── docs/                 # Full documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   └── TEST_RESULTS.md
├── drizzle/              # Migration files
├── hooks/                # React custom hooks
├── lib/                  # Shared utilities, auth, scoring logic
├── public/               # Static assets
├── scripts/              # Test & setup scripts
├── server/               # Worker entry point
├── tests/                # Python evidence & integration tests
├── .env.example          # Environment variable template
├── compose.yaml          # Docker Compose for web labs
├── drizzle.config.ts     # Drizzle ORM config
├── next.config.ts        # Vinext config
└── vite.config.ts        # Vite + Cloudflare plugin config
```

---

## 📚 Documentation

| Doc | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, trust model, data model, routes |
| [API Reference](docs/API.md) | REST API endpoints & request/response schemas |
| [Deployment](docs/DEPLOYMENT.md) | Local setup, Cloudflare deploy, lab host setup |
| [Security](docs/SECURITY.md) | Security analysis & known limits |
| [Test Results](docs/TEST_RESULTS.md) | Automated test output |
| [Solutions](docs/SOLUTIONS.md) | 🔒 Organizer-only — keep private during competition |

---

## ⚠️ Known Limits & Roadmap

**Current limitations (pre-production):**
- Docker lab infrastructure and CI isolation checks are included; provision and validate your actual host before public use
- No email verification or account recovery yet
- Needs production load testing before a hostile public competition
- Not independently security-audited

**Planned improvements:**
- Richer PCAP / disk / binary artifacts & per-team variants
- Reviewed write-up submission system
- Scheduled events & scoreboard freeze
- MFA and account recovery
- MicroVM isolation for higher-risk challenge environments
- Telemetry dashboards and restore drills

---

## 🔐 Security

The repository contains example solutions and reproducible answer generation. Treat these as training challenges; create fresh private challenge content for scored competitions. Never commit `.dev.vars`, production databases or runtime secrets.

Session tokens and invite codes are 256-bit random values — only SHA-256 digests are stored. Flag comparisons are constant-time. Lab flags are HMAC-derived per-principal. No user-provided code, SQL, or container images are ever executed by the platform Worker.

> See [`docs/SECURITY.md`](docs/SECURITY.md) for the full security analysis.

---

## 📄 License

MIT © [AyushPatra45](https://github.com/AyushPatra45)
