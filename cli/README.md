# SkillForge

A searchable registry of AI agent skills (SKILL.md files) indexed from public GitHub repos.

## Stack
- Next.js (App Router) on AWS Amplify Hosting
- Postgres via Supabase, full-text search via `tsvector` + GIN index
- Three.js for the hero background (vanilla, no R3F)
- Separate publishable CLI package in `cli/`

## Setup

### 1. Database
1. Create a project at supabase.com (or reuse an existing one), copy the connection string from Project Settings → Database.
2. Run the schema — easiest via Supabase's SQL Editor (paste `db/schema.sql` and run), or:
   ```
   psql "$DATABASE_URL" -f db/schema.sql
   ```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in every value. See that file for what each one does.

### 3. Seed the registry
Place your skills archive zip at `data/seed/skills-archive.zip`, then:
```
npm run import-seed
```

### 4. Run locally
```
npm install
npm run dev
```

### 5. Deploy to AWS Amplify
1. Push this repo to GitHub.
2. In the AWS Amplify console: Create app → Host web app → connect this repo, branch `main`.
3. Amplify auto-detects `amplify.yml` for the build config.
4. Add all the env vars from `.env.example` in Amplify's App Settings → Environment variables.
5. Deploy.

### 6. Crawler scheduling (AWS EventBridge)
The crawler is a normal API route (`/api/cron/crawl`) — it doesn't care what triggers it.
1. AWS Console → EventBridge → Scheduler → Create schedule.
2. Set the interval you want (e.g. every hour) — no daily-limit constraint like some platforms' free-tier cron.
3. Target: API destination → `GET https://<your-amplify-url>/api/cron/crawl`
4. Add header `x-cron-secret` set to your `CRON_SECRET` value.

### 7. Review queue
New skills from untrusted/low-star owners land in `pending_skills`, not live.
Review them at `/admin/review` (password from `ADMIN_PASSWORD`).

### 8. CLI
The `cli/` folder is a separate npm package. To publish it later:
```
cd cli
npm login
npm publish
```
Update `SKILLFORGE_API_URL` in the CLI's default or via env var to point at your
deployed site before publishing.

## Known limitations (honest list)
- **Rate limiting** (`lib/rate-limit.js`) is in-memory, per serverless instance —
  fine for moderate traffic, but not a real distributed limiter. Swap for
  Upstash Redis if this gets serious traffic.
- **Safety scanning** is pattern-based static analysis across 12 threat
  categories. It reduces risk, it does not guarantee any skill is
  malware-free — the same honest caveat every package registry (npm, PyPI)
  operates under.
- **Supabase free tier backup/PITR**: confirm current retention on Supabase's
  pricing page before relying on this for anything you can't afford to lose;
  consider periodic manual `pg_dump` exports as a cheap extra safety net.
- **Downloads/install counts** are tracked via a real `installs` event table,
  incremented from the CLI's `add` command hitting `/api/skills/track-install`.
  Trending windows (daily/weekly/hot/overall) are computed from real event
  timestamps, not a static placeholder.
- Seed data sourced from the Open Skills dataset (see Attribution below) uses
  synthetic `content_hash` values until the crawler re-verifies each skill
  against live GitHub data — this is expected and handled automatically via
  the upsert logic.

## Attribution
Some seed data is sourced from the [Open Skills dataset](https://huggingface.co/datasets/open-index/open-skills)
(open-index, Hugging Face), licensed under **ODC-By v1.0**. Original skill
content belongs to each skill's respective author. Records from this source
are tagged `source: 'seed-open-index'` in the database and are re-verified
against live GitHub data by the crawler over time.
