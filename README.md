[![Header](https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0b,50:1c1813,100:c9a961&height=200&section=header&text=SkillForge&fontSize=42&fontColor=f5f3ee&animation=fadeIn&fontAlignY=38&desc=The%20agent%20skill%20registry&descAlignY=58&descSize=16&descColor=c9a961)](https://github.com/Rustys90/skillforge)

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=20&pause=1200&color=C9A961&center=true&vCenter=true&width=650&lines=Search+and+install+AI+agent+skills+in+one+command;Indexed+from+public+GitHub+repos%2C+updated+daily;Next.js+%2B+Postgres+%2B+Three.js+%2B+a+CLI+that+ships;Safety-scanned+before+anything+goes+live" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-pre--launch-c9a961?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-1c1813?style=for-the-badge" />
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20Postgres%20%7C%20Three.js-0a0a0b?style=for-the-badge" />
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## What this is

A searchable registry of AI agent skills — `SKILL.md` files pulled from public GitHub repositories — with a website to browse them and a CLI to install one in a single command:

```
npx skillforge add owner/repo/skill-name
```

<p align="center">
  <img src="https://img.shields.io/badge/1%2C406-seed%20skills-c9a961?style=flat-square" />
  <img src="https://img.shields.io/badge/crawler-daily-1c1813?style=flat-square&labelColor=0a0a0b" />
  <img src="https://img.shields.io/badge/safety-scanned-1c1813?style=flat-square&labelColor=0a0a0b" />
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,postgres,threejs,tailwind,nodejs,vercel&theme=dark" />
</p>

| Layer | Choice |
|---|---|
| Frontend + API | Next.js (App Router) on Vercel |
| Database | Postgres via Neon, full-text search via `tsvector` + GIN |
| 3D hero | Vanilla Three.js — wireframe icosahedra core, orbiting particle field |
| Crawler | GitHub code search API, rate-limit aware, resumable via cursor |
| Safety | Static pattern scanning + trusted-owner/star-threshold auto-publish + human review queue |
| CLI | Separate publishable npm package (`commander`-based) |

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## Quick start

```bash
# 1. install
npm install

# 2. env
cp .env.example .env.local   # fill in DATABASE_URL, GITHUB_TOKEN, etc.

# 3. schema
psql "$DATABASE_URL" -f db/schema.sql

# 4. seed (optional — place your archive at data/seed/skills-archive.zip first)
npm run import-seed

# 5. run
npm run dev
```

Full deployment walkthrough (Neon → Vercel → cron scheduling → review queue) is in [`docs/SETUP.md`](./docs/SETUP.md).

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## How a skill gets published

```
GitHub code search  →  parse + hash + license lookup  →  safety scan
        │                                                     │
        │                                            clean + trusted/high-star?
        │                                                     │
        └───────────────────── yes ──────────────────→  live on site
                                 │
                                 no
                                 │
                                 ▼
                        pending_skills queue  →  human review at /admin/review
```

Nothing publishes automatically without passing the scan or the review queue. See [Known limitations](#known-limitations) for what this does and doesn't guarantee.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## Project structure

```
skillforge/
  app/            → Next.js pages, API routes, admin review UI
  db/             → schema, migrations, query layer
  lib/            → GitHub client, safety scanner, parser, rate limiter
  scripts/        → seed archive importer
  cli/            → the separate publishable skillforge CLI package
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

## Known limitations

- Rate limiting is in-memory per instance — fine for now, swap for Upstash Redis at real scale
- Safety scanning is risk reduction, not a guarantee — same honest caveat every package registry operates under
- Download/install counts are a placeholder until a real tracking table is wired up
- Confirm Neon free-tier backup retention before relying on it for anything irreplaceable

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:c9a961,100:0a0a0b&height=2&section=header"/>

<p align="center">
  <img src="https://img.shields.io/badge/MIT-licensed-c9a961?style=flat-square" />
</p>

[![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:c9a961,50:1c1813,100:0a0a0b&height=100&section=footer)](https://github.com/Rustys90/skillforge)
