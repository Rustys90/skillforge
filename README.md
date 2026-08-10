[![Header](https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=200&section=header&text=SkillForge&fontSize=46&fontColor=f5f3ee&animation=fadeIn&fontAlignY=38&desc=The%20Agent%20Skill%20Registry&descAlignY=58&descSize=16&descColor=c9a961)](https://github.com/Rustys90/skillforge)

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=C9A961&center=true&vCenter=true&width=650&lines=Find+the+right+skill+for+your+agent;Indexed+from+public+GitHub+repos%2C+updated+daily;Safety-scanned+before+anything+goes+live;npx+skillforge+add+owner%2Frepo%2Fskill" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-scaffold--complete-c9a961?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-1D4ED8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/stack-Next.js%20%2B%20Postgres-0a0a0b?style=for-the-badge" />
</p>

---

### 🗝️ What this is

A searchable registry of AI agent skills (`SKILL.md` files), indexed from public GitHub repos — think a package manager for agent capabilities. Search, preview, and install a skill in one command.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### ⚙️ Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,postgres,vercel,nodejs,threejs&theme=dark" />
</p>

- **Next.js (App Router)** on Vercel — frontend + API routes together
- **Postgres via Neon** — full-text search through `tsvector` + GIN index
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
```bash
psql "$DATABASE_URL" -f db/schema.sql
```

**2. Environment**
Copy `.env.example` → `.env.local`, fill in every value.

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

**5. Deploy**
Push to GitHub → import into Vercel → add env vars → deploy.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### ⏱️ Crawler scheduling

Vercel's free Hobby tier caps built-in Cron at **once per day**, and Hobby is non-commercial-only. The crawler route doesn't care who triggers it — point any scheduler (GitHub Actions, cron-job.org) at:

```
GET /api/cron/crawl
Header: x-cron-secret: <your CRON_SECRET>
```

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0a0a0b,50:1D4ED8,100:c9a961&height=3&section=header"/>
</p>

### 🛡️ Safety, honestly

New skills from untrusted/low-star owners land in a review queue (`/admin/review`), not live. Pattern-based static scanning catches common red flags — but like npm or PyPI, this is risk reduction, not a guarantee. See `lib/safety-scan.js`.

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
