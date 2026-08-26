# Improvements applied (2026-08-26)

Mapped from the professional audit (12 criteria).

| # | Area | What shipped |
|---|---|---|
| 1 | Product clarity | Prefer real descriptions on crawl; backfill restores bodies |
| 2 | Data quality | Log-damped ranking (`db/queries.js`); path-aware seeds; backfill cron |
| 3 | Technical SEO | Already had sitemap/robots/llms; AI discovery endpoints |
| 4 | Content depth | Backfill `/api/cron/backfill` + store `raw_content` on publish |
| 5 | GEO/AEO | `llms.txt`, `ai.txt`, `/ai/summary`, `/ai/faq` (prior + kept) |
| 6 | UX | Ranking no longer clones mega-repo stars onto every path |
| 7 | Visual | Deferred (needs HomeClient split in follow-up) |
| 8 | Performance | Lighthouse CI workflow; hero still client-deferred via dynamic import |
| 9 | Security | Cron secret on crawl+backfill; admin still disallowed in robots |
| 10 | Crawler | Multi-strategy rotation (path/size/priority); hourly cron |
| 11 | Codebase | `lib/skill-rank.js`, `lib/skill-url.js`, `db/backfill-helpers.js` |
| 12 | Growth/CI | `.github/workflows/ci-seo.yml` build + Lighthouse |

## Ops notes

- Trigger backfill: `GET /api/cron/backfill` with `Authorization: Bearer $CRON_SECRET`
- Trigger crawl: `GET /api/cron/crawl` with same secret
- Vercel Hobby may limit cron frequency; external scheduler can hit the same routes
- Custom domain still manual in Vercel project settings
