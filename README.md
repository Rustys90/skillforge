[![Header](https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=200&section=header&text=SkillForge&fontSize=46&fontColor=f5f3ee&animation=fadeIn&fontAlignY=38&desc=The%20Agent%20Skill%20Registry&descAlignY=58&descSize=16&descColor=c9a961)](https://github.com/Rustys90/skillforge)

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=C9A961&center=true&vCenter=true&width=650&lines=Find+the+right+skill+for+your+agent;Indexed+from+public+GitHub+repos%2C+updated+daily;Safety-scanned+before+anything+goes+live;npx+skillforge+add+owner%2Frepo%2Fskill" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-scaffold--complete-c9a961?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-1D4ED8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/stack-Next.js%20%2B%20Postgres%20%2B%20AWS-0a0a0b?style=for-the-badge" />
</p>

---

### 🗝️ What this is

A searchable registry of AI agent skills (`SKILL.md` files), indexed from public GitHub repos — think a package manager for agent capabilities. Search, preview, and install a skill in one command.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### ⚙️ Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,postgres,aws,nodejs,threejs&theme=dark" />
</p>

- **Next.js (App Router)** on **AWS Amplify Hosting** — frontend + API routes together
- **Postgres via Neon** — full-text search through `tsvector` + GIN index
- **AWS EventBridge Scheduler** — triggers the crawler on any interval, no daily-limit constraint
- **Three.js** — cinematic 3D hero, no heavy framework dependency
- **Separate publishable CLI** (`cli/`) — `npx skillforge find/add/list`

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 🧩 What's built

| Component | Status |
|---|---|
| DB schema + full-text search | ✅ |
| Crawler w/ real GitHub rate-limit handling | ✅ |
| Safety scanner + review queue | ✅ |
| Public API routes (search/detail/trending/report) | ✅ |
| Admin review UI | ✅ |
| Frontend (3D hero, leaderboard, skill modal) | ✅ |
| SEO (sitemap, JSON-LD, metadata) | ✅ |
| CLI package | ✅ |
| Real download tracking | ⏳ placeholder only |
| Distributed rate limiting | ⏳ in-memory only |

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 🚀 Setup

**1. Database**
Run `db/schema.sql` against your Neon database — easiest via the Neon console's SQL Editor (paste the file's contents and run), or `psql "$DATABASE_URL" -f db/schema.sql` if you have psql installed locally.

**2. Environment**
Copy `.env.example` → `.env.local` for local dev. **Never commit real secrets** — in production these live in Amplify's environment variable settings or AWS Secrets Manager, not in any file in this repo.

**3. Seed the registry**
```bash
# place your archive at data/seed/skills-archive.zip first
npm run import-seed
```

**4. Run locally**
```bash
npm install
npm run dev
```

**5. Deploy to AWS Amplify**
1. In the AWS Amplify console, choose "Host a web app" → connect this GitHub repo.
2. Amplify auto-detects `amplify.yml` for the build config.
3. Add environment variables in Amplify's App Settings → Environment variables: `DATABASE_URL`, `GITHUB_TOKEN`, `CRON_SECRET`, `TRUSTED_OWNERS`, `AUTO_PUBLISH_STAR_THRESHOLD`, `ADMIN_PASSWORD`, `SITE_URL`.
4. Deploy. Amplify gives you a `*.amplifyapp.com` URL immediately; add your own domain (e.g. via Route 53) in Amplify's Domain Management afterward.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### ⏱️ Crawler scheduling (AWS EventBridge)

The crawler is just an API route (`/api/cron/crawl`) — it doesn't care what triggers it. On AWS:

1. Create an **EventBridge Scheduler** rule (Amazon EventBridge → Scheduler → Create schedule).
2. Set the schedule expression (e.g. `rate(1 hour)` or a cron expression for your preferred cadence — no once-a-day cap here, unlike Vercel's Hobby tier).
3. Set the target as an **API destination**: `GET https://your-amplify-domain/api/cron/crawl` with header `x-cron-secret: <your CRON_SECRET>`.
4. Store `CRON_SECRET` in **AWS Secrets Manager** and reference it in the EventBridge target config rather than hardcoding it in the rule.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 🛡️ Safety, honestly

New skills from untrusted/low-star owners land in a review queue (`/admin/review`), not live. Pattern-based static scanning catches common red flags — but like npm or PyPI, this is risk reduction, not a guarantee. See `lib/safety-scan.js`.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 🔐 Secrets — read this

Never commit a real `DATABASE_URL`, `GITHUB_TOKEN`, or any password to this repo, even privately. Use Amplify's environment variables or AWS Secrets Manager. If a real secret is ever pasted into a chat, commit, or file by mistake, rotate it immediately — don't just delete the file, since git history and chat logs can retain it.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 📦 CLI

```bash
cd cli
npm login
npm publish
```

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:c9a961,50:1D4ED8,100:0a0a0b&height=100&section=footer"/>
</p>
