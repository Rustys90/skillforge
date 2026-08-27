<!--
  SkillForge — Agent Skill Registry
  Orbis visual system: #010828 · #EFF4FF · #6FFF00
-->

<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:010828,35:0a1a3a,70:112240,100:6FFF00&text=SkillForge&fontSize=54&fontColor=EFF4FF&animation=twinkling&fontAlignY=34&desc=The%20Agent%20Skill%20Registry&descAlignY=54&descSize=18&descColor=6FFF00&section=header" width="100%" alt="SkillForge header" />

  <br/>

  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=20&duration=3000&pause=800&color=6FFF00&center=true&vCenter=true&width=700&lines=Find+the+right+SKILL.md+for+your+agent;Crawled+from+public+GitHub+%C2%B7+safety-scanned;npx+skillforge+add+owner%2Frepo%2Fskill;Orbis+UI+%C2%B7+liquid+glass+%C2%B7+neon+accents" alt="typing" />

  <br/><br/>

  <a href="https://skillforge-jet-chi.vercel.app"><img src="https://img.shields.io/badge/Live_Site-skillforge-6FFF00?style=for-the-badge&logo=vercel&logoColor=010828&labelColor=010828" /></a>
  <img src="https://img.shields.io/badge/Stack-Next.js_15-EFF4FF?style=for-the-badge&logo=nextdotjs&logoColor=6FFF00&labelColor=010828" />
  <img src="https://img.shields.io/badge/DB-Postgres-EFF4FF?style=for-the-badge&logo=postgresql&logoColor=6FFF00&labelColor=010828" />
  <img src="https://img.shields.io/badge/License-MIT-6FFF00?style=for-the-badge&labelColor=010828" />
  <img src="https://img.shields.io/github/last-commit/Rustys90/skillforge?style=for-the-badge&color=6FFF00&labelColor=010828" />

</div>

---

### What it is

**SkillForge** is a searchable registry of AI agent skills (`SKILL.md`) discovered on public GitHub — closer to a package index than a blog of prompts.

| Capability | Detail |
|---|---|
| **Discovery** | Multi-strategy GitHub code search (paths, stars, size, language) |
| **Quality** | Auto-publish rules + pending queue + safety pattern scan |
| **Install** | One command: `npx skillforge add owner/repo/skill` |
| **Product UI** | Orbis dark navy · neon accents · liquid glass · Three.js hero |
| **SEO / AEO** | Sitemap, robots, `llms.txt`, skill pages, AI discovery routes |

<p align="center">
  <a href="https://skillforge-jet-chi.vercel.app"><strong>Open SkillForge →</strong></a>
</p>

---

### Quick start

```bash
# Install a skill into your agent workspace
npx skillforge add anthropics/skills/skills/pdf

# Browse the live catalog
open https://skillforge-jet-chi.vercel.app
```

---

### Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,nodejs,postgres,vercel,threejs,tailwind,github&theme=dark" alt="stack" />
</p>

- **Next.js 15 (App Router)** on **Vercel**
- **Postgres** (Supabase) — full-text search, installs, crawl state
- **GitHub Code Search API** — authenticated crawl with backoff
- **ThreeUI / Three.js** — procedural hero scene
- **Tailwind** — Orbis liquid-glass system

---

### Architecture (high level)

```text
GitHub code search ──► crawl cron (daily)
                           │
              safety scan + auto-publish policy
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
         skills table              pending_skills
              │
              ▼
     Search API · skill pages · sitemap · CLI install
```

- **Crawl** — `/api/cron/crawl` (promote pending → thin refresh → multi-strategy discovery)
- **Backfill** — `/api/cron/backfill` (fill missing `raw_content` for thin pages)
- **Search** — ranked by quality (real descriptions/bodies first)

---

### Local development

```bash
git clone https://github.com/Rustys90/skillforge.git
cd skillforge
cp .env.example .env.local   # DATABASE_URL, GITHUB_TOKEN, CRON_SECRET, ...
npm install
npm run dev
```

Required env (see `.env.example`): `DATABASE_URL`, `GITHUB_TOKEN`, `CRON_SECRET`, `SITE_URL`, admin secrets, `TRUSTED_OWNERS`.

---

### Project links

| | |
|---|---|
| Production | https://skillforge-jet-chi.vercel.app |
| Issues | https://github.com/Rustys90/skillforge/issues |
| Profile | https://github.com/Rustys90 |

---

<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:010828,50:112240,100:6FFF00&section=footer" width="100%" alt="footer" />

  <sub>MIT License · Built by <a href="https://github.com/Rustys90">@Rustys90</a></sub>

</div>
