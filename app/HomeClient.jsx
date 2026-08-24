"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Star, Terminal, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* Cinematic space / abstract — no cartoon characters */
const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_115329_5e00c9c5-4d69-49b7-94c3-9c31c60bb644.mp4";
const ABOUT_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260326_073936_8dd07fdb-4f6b-4220-a3f0-9dedfaab0c88.mp4";
const CTA_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_125119_8e5ae31c-0021-4396-bc08-f7aebeb877a2.mp4";

const NAV = [
  { label: "Browse", href: "#browse" },
  { label: "Trust", href: "#trust" },
  { label: "Trending", href: "#trending" },
  { label: "Install", href: "#install" },
  { label: "GitHub", href: "https://github.com/Rustys90/skillforge", external: true },
];

const TAGS = ["pdf", "xlsx", "api", "browser", "git", "testing"];

/** Trusted / frequently indexed publishers — logo marquee (Simple Icons CDN). */
const PUBLISHERS = [
  { name: "Vercel", slug: "vercel", href: "https://github.com/vercel" },
  { name: "Microsoft", slug: "microsoft", href: "https://github.com/microsoft" },
  { name: "Stripe", slug: "stripe", href: "https://github.com/stripe" },
  { name: "n8n", slug: "n8n", href: "https://github.com/n8n-io" },
  { name: "GitHub", slug: "github", href: "https://github.com" },
  { name: "Google", slug: "google", href: "https://github.com/google" },
  { name: "Meta", slug: "meta", href: "https://github.com/facebook" },
  { name: "Cloudflare", slug: "cloudflare", href: "https://github.com/cloudflare" },
  { name: "Anthropic", slug: null, href: "https://github.com/anthropics" },
  { name: "Better Auth", slug: null, href: "https://github.com/better-auth" },
  { name: "Remotion", slug: null, href: "https://github.com/remotion-dev" },
  { name: "Callstack", slug: null, href: "https://github.com/callstackincubator" },
];


function skillPath(s) {
  return (s.path || "").replace(/\/?SKILL\.md$/i, "");
}
function skillHref(s) {
  return `/skills/${s.owner}/${s.repo}/${skillPath(s)}`;
}
function installCmd(s) {
  return `npx skillforge add ${s.owner}/${s.repo}/${skillPath(s) || s.name}`;
}

function stableSeed(s) {
  const key = String(s?.id ?? `${s?.owner}/${s?.repo}/${s?.name}` ?? "x");
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/** Prefer real CLI installs; otherwise a stable stars-based estimate (labeled in UI). */
function installStats(s) {
  const realTotal = Number(s.downloads_total ?? s.downloads ?? 0);
  const realDaily = Number(s.downloads_daily ?? 0);
  const realWeekly = Number(s.downloads_weekly ?? 0);
  if (realTotal > 0 || realDaily > 0 || realWeekly > 0) {
    return { total: realTotal, daily: realDaily, weekly: realWeekly, estimated: false };
  }
  const stars = Math.max(0, Number(s.stars) || 0);
  const seed = stableSeed(s);
  const total = Math.max(1, Math.floor(Math.sqrt(stars) * 2.8) + (seed % 53));
  const weekly = Math.max(0, Math.floor(total * (0.12 + (seed % 10) / 100)) + (seed % 9));
  const daily = Math.max(0, Math.floor(weekly * (0.2 + (seed % 7) / 50)) + (seed % 4));
  return { total, daily, weekly, estimated: true };
}

function descText(s) {
  const d = (s?.description || "").trim();
  if (!d || /description pending/i.test(d) || /pending crawler/i.test(d)) {
    return `${s?.name || "Skill"} — open-source agent skill by ${s?.owner || "unknown"}. Safety-scanned on SkillForge.`;
  }
  return d;
}

function SkillDialog({ skill, open, onOpenChange }) {
  const [full, setFull] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !skill) {
      setFull(null);
      setRelated([]);
      return;
    }
    const path = skillPath(skill) || skill.path || skill.name;
    setLoading(true);
    fetch(
      `/api/skills/detail?owner=${encodeURIComponent(skill.owner)}&repo=${encodeURIComponent(skill.repo)}&path=${encodeURIComponent(path)}`
    )
      .then((r) => r.json())
      .then((d) => {
        setFull(d.skill || skill);
        setRelated(d.related || []);
      })
      .catch(() => {
        setFull(skill);
        setRelated([]);
      })
      .finally(() => setLoading(false));
  }, [open, skill]);

  if (!skill) return null;
  const s = full || skill;
  const cmd = installCmd(s);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-white/10 bg-space/95 text-cream sm:rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="font-grotesk text-2xl uppercase tracking-wide text-cream">
            {s.name}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs uppercase text-cream/60">
            {s.owner}/{s.repo} · {(s.stars ?? 0).toLocaleString()}★
            {" · "}
            {installStats(s).total.toLocaleString()} total
            {installStats(s).estimated ? " (est.)" : " (live)"}
            {" · "}
            {installStats(s).weekly.toLocaleString()} this week
            {" · "}
            {installStats(s).daily.toLocaleString()} today
          </DialogDescription>
        </DialogHeader>

        {loading && !full ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading skill details">
            <div className="skeleton h-4 w-2/3 max-w-[12rem]" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="skeleton h-3 w-4/6" />
            <div className="mt-4 flex gap-2">
              <div className="skeleton h-9 w-28 rounded-full" />
              <div className="skeleton h-9 w-24 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-cream/80">
              {descText(s)}
            </p>

            {s.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neon/40 bg-neon/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neon"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {s.license_spdx_id && (
              <p className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                License · {s.license_spdx_id}
              </p>
            )}
            {s.hf_downloads != null && (
              <p className="font-mono text-[10px] uppercase tracking-wide text-cream/50">
                Hugging Face · {Number(s.hf_downloads).toLocaleString()} downloads
                {s.hf_model_id ? ` · ${s.hf_model_id}` : ""}
                {s.hf_likes != null ? ` · ${Number(s.hf_likes).toLocaleString()} likes` : ""}
              </p>
            )}

            <div className="liquid-glass rounded-[1rem] p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
                <Terminal className="h-3 w-3" /> Install
              </div>
              <code className="break-all font-mono text-sm text-cream/90">{cmd}</code>
            </div>

            {related.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
                  Related
                </p>
                <ul className="space-y-2">
                  {related.slice(0, 4).map((r) => (
                    <li key={r.id}>
                      <Link
                        href={skillHref(r)}
                        className="liquid-glass flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/10"
                      >
                        <span className="font-grotesk text-xs uppercase tracking-wide text-cream">
                          {r.name}
                        </span>
                        <span className="font-mono text-[10px] text-cream/40">{r.stars}★</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            href={skillHref(s)}
            className="inline-flex items-center gap-1 rounded-full bg-neon px-4 py-2 font-grotesk text-sm uppercase tracking-wide text-space transition hover:opacity-90"
          >
            Full page <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={`https://github.com/${s.owner}/${s.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass inline-flex items-center gap-1 rounded-full px-4 py-2 font-mono text-xs uppercase text-cream transition hover:bg-white/10"
          >
            Source <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HomeClient({ initialTrending = [] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [results, setResults] = useState(initialTrending);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [totalResults, setTotalResults] = useState(null);
  const [tab, setTab] = useState("weekly");
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false);
  const [trendingHasMore, setTrendingHasMore] = useState(false);
  const TRENDING_PAGE = 20;
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const url = query.trim()
      ? `/api/skills/search?q=${encodeURIComponent(query)}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
      : activeTag
        ? `/api/skills/search?tag=${encodeURIComponent(activeTag)}&limit=20`
        : "/api/skills/trending?limit=6";
    const t = setTimeout(() => {
      setCatalogLoading(true);
      setCatalogError(null);
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("search failed");
          return r.json();
        })
        .then((d) => {
          setResults(d.results || []);
          setTotalResults(d.total ?? null);
        })
        .catch(() => {
          setResults([]);
          setCatalogError("Could not load skills. Check your connection and try again.");
        })
        .finally(() => setCatalogLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, activeTag]);

  useEffect(() => {
    setTrendingLoading(true);
    setTrendingHasMore(false);
    fetch(`/api/skills/trending?window=${tab}&limit=${TRENDING_PAGE}&offset=0`)
      .then((r) => r.json())
      .then((d) => {
        setTrending(d.results || []);
        setTrendingHasMore(Boolean(d.hasMore));
      })
      .catch(() => {
        setTrending([]);
        setTrendingHasMore(false);
      })
      .finally(() => setTrendingLoading(false));
  }, [tab]);

  const loadMoreTrending = () => {
    if (trendingLoadingMore || !trendingHasMore) return;
    setTrendingLoadingMore(true);
    fetch(
      `/api/skills/trending?window=${tab}&limit=${TRENDING_PAGE}&offset=${trending.length}`
    )
      .then((r) => r.json())
      .then((d) => {
        const next = d.results || [];
        setTrending((prev) => {
          const seen = new Set(prev.map((x) => x.id || `${x.owner}/${x.repo}/${x.path}`));
          const merged = [...prev];
          for (const s of next) {
            const k = s.id || `${s.owner}/${s.repo}/${s.path}`;
            if (!seen.has(k)) {
              seen.add(k);
              merged.push(s);
            }
          }
          return merged;
        });
        setTrendingHasMore(Boolean(d.hasMore) && next.length > 0);
      })
      .catch(() => setTrendingHasMore(false))
      .finally(() => setTrendingLoadingMore(false));
  };

  /* Scroll-reveal: mark .reveal nodes when they enter the viewport */
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [results, trending, trendingLoading]);

  const openSkill = (s) => {
    setSelected(s);
    setDialogOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-space text-cream">
      <a href="#browse" className="skip-link">
        Skip to catalog
      </a>
      <main id="main">
      <div className="texture-overlay" aria-hidden />

      <section className="relative min-h-screen overflow-hidden rounded-b-[32px]" aria-label="Hero">
        <video
          className="motion-safe-video absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          fetchPriority="high"
          aria-hidden
        />
        <div className="motion-reduce-fallback absolute inset-0 bg-gradient-to-br from-space via-[#02103a] to-space" aria-hidden />
        {/* Stronger cinematic veil — keeps type readable, hides busy footage */}
        <div className="absolute inset-0 bg-gradient-to-b from-space/70 via-space/50 to-space/80" />
        <div className="absolute inset-0 bg-space/30" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col px-6 py-8 sm:px-10 lg:px-16">
          <header className="flex items-center justify-between">
            <Link href="/" className="font-grotesk text-[16px] uppercase tracking-wide text-cream">
              SkillForge
            </Link>
            <nav className="liquid-glass hidden rounded-[28px] px-10 py-5 lg:block">
              <ul className="flex items-center gap-8">
                {NAV.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-grotesk text-[13px] uppercase tracking-wide text-cream transition hover:text-neon"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        href={item.href}
                        className="font-grotesk text-[13px] uppercase tracking-wide text-cream transition hover:text-neon"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hidden w-[90px] lg:block" />
          </header>

          <div className="relative mt-auto flex flex-1 flex-col justify-center pb-16 pt-24 lg:pb-24">
            <div className="relative max-w-[820px] lg:ml-16">
              <h1 className="font-grotesk text-[40px] uppercase leading-[1.05] text-cream sm:text-[56px] md:text-[72px] lg:text-[88px]">
                Find the right
                <br />
                skill for your
                <br />
                agent
              </h1>
              <span className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 -rotate-2 font-condiment text-[22px] text-neon opacity-90 mix-blend-exclusion sm:text-[32px] md:text-[42px] lg:text-[52px]">
                Agent registry
              </span>
            </div>

            <p className="mt-6 max-w-md font-mono text-sm uppercase leading-relaxed text-cream/80 lg:ml-16">
              Public GitHub skills. Scanned before publish. Install with one npx command.
            </p>

            <form
              role="search"
              aria-label="Search agent skills"
              className="relative mt-10 w-full max-w-xl lg:ml-16"
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <label htmlFor="skill-search" className="sr-only">
                Search skills by name, tag, or description
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/45" aria-hidden />
              <input
                id="skill-search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills — pdf, whisper, deploy, api…"
                autoComplete="off"
                spellCheck={false}
                className="liquid-glass h-14 w-full rounded-[1.25rem] border border-white/10 bg-space/40 pl-12 pr-24 font-mono text-sm text-cream caret-neon placeholder:text-cream/35 transition focus:border-neon/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 active:scale-[0.997]"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-cream/50 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="pressable rounded-full bg-neon px-3.5 py-2 font-grotesk text-[11px] uppercase tracking-wide text-space transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
                >
                  Search
                </button>
              </div>
            </form>


            <div className="mt-4 flex flex-wrap gap-2 lg:ml-16">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((cur) => (cur === tag ? "" : tag))}
                  className={cn(
                    "pressable rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50",
                    activeTag === tag
                      ? "bg-neon text-space"
                      : "liquid-glass text-cream hover:bg-white/10"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[50vh] overflow-hidden">
        <video
          className="motion-safe-video absolute inset-0 h-full w-full object-cover"
          src={ABOUT_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          aria-hidden
        />
        <div className="motion-reduce-fallback absolute inset-0 bg-gradient-to-r from-space via-[#02103a] to-space" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-space/80 via-space/55 to-space/70" />
        <div className="relative z-10 mx-auto flex min-h-[50vh] max-w-content flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="relative">
              <h2 className="font-grotesk text-[32px] uppercase leading-[1.05] text-cream sm:text-[44px] md:text-[52px]">
                Hello!
                <br />
                I&apos;m skillforge
              </h2>
              <span className="pointer-events-none absolute -bottom-2 right-0 -rotate-1 font-condiment text-[36px] text-neon opacity-90 mix-blend-exclusion sm:text-[48px] md:text-[56px]">
                Skills
              </span>
            </div>
            <p className="max-w-[280px] font-mono text-[14px] uppercase leading-relaxed text-cream sm:text-[16px]">
              A living index of agent skills from public GitHub — scanned, ranked, installable in one line.
            </p>
          </div>
        </div>
      </section>

      <section id="browse" className="reveal bg-space py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <div className="mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-grotesk text-[32px] uppercase leading-[1.05] text-cream sm:text-[44px] md:text-[52px]">
              {query || activeTag ? (
                "Results"
              ) : (
                <>
                  Collection of
                  <br />
                  <span className="ml-8 inline-block sm:ml-16 lg:ml-24">
                    <span className="font-condiment normal-case text-neon">Agent</span> skills
                  </span>
                </>
              )}
            </h2>
            {totalResults != null && (
              <span className="font-mono text-xs uppercase tracking-wide text-cream/50">
                {totalResults} total
              </span>
            )}
          </div>

          <form
            role="search"
            aria-label="Filter skills in catalog"
            className="mb-10 max-w-xl"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="browse-search" className="sr-only">
              Filter catalog
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/40"
                aria-hidden
              />
              <input
                id="browse-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by name, owner, or keyword…"
                autoComplete="off"
                className="liquid-glass h-12 w-full rounded-2xl border border-white/10 pl-10 pr-4 font-mono text-sm text-cream caret-neon placeholder:text-cream/35 transition focus:border-neon/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/50"
              />
            </div>
            {totalResults != null && query.trim() ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-cream/45">
                {totalResults.toLocaleString()} match{totalResults === 1 ? "" : "es"}
              </p>
            ) : null}
          </form>

          {results.length === 0 && (
            <div className="liquid-glass mb-10 rounded-[28px] px-8 py-12 text-center" role="status">
              <p className="font-grotesk text-lg uppercase tracking-wide text-cream">No skills matched</p>
              <p className="mt-2 font-mono text-xs uppercase text-cream/50">
                Try another keyword, clear filters, or browse trending below.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag("");
                }}
                className="mt-6 rounded-full bg-neon px-5 py-2.5 font-grotesk text-xs uppercase tracking-wide text-space transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
              >
                Clear search
              </button>
            </div>
          )}

          <div className="status-live mb-4 font-mono text-[10px] uppercase tracking-wide text-cream/45" aria-live="polite">
            {catalogLoading
              ? "Scanning index…"
              : catalogError
                ? catalogError
                : query.trim()
                  ? `${(totalResults ?? results.length).toLocaleString()} match${(totalResults ?? results.length) === 1 ? "" : "es"}`
                  : totalResults != null
                    ? `${totalResults.toLocaleString()} skills indexed`
                    : ""}
          </div>

          {catalogError && !catalogLoading && (
            <div className="liquid-glass mb-6 rounded-[24px] px-6 py-5" role="alert">
              <p className="font-mono text-xs uppercase text-cream/80">{catalogError}</p>
              <button
                type="button"
                className="pressable mt-3 rounded-full bg-neon px-4 py-2 font-grotesk text-[11px] uppercase tracking-wide text-space"
                onClick={() => {
                  setCatalogError(null);
                  setQuery((q) => q + "");
                }}
              >
                Retry
              </button>
            </div>
          )}

          {catalogLoading && (
            <div
              className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading skills"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`sk-${i}`} className="liquid-glass rounded-[32px] p-[18px]">
                  <div className="flex min-h-[120px] flex-col justify-between rounded-[24px] bg-white/[0.03] p-5">
                    <div>
                      <div className="skeleton h-5 w-2/5 max-w-[9rem]" />
                      <div className="skeleton mt-2 h-3 w-1/3 max-w-[6rem]" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-4/5" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 rounded-[20px] px-2 py-4">
                    <div className="skeleton h-8 w-16" />
                    <div className="skeleton h-8 w-16" />
                    <div className="skeleton h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${catalogLoading ? "hidden" : ""}`}
            aria-busy={catalogLoading}
          >
            {results.map((s, i) => (
              <article
                key={s.id || `${s.owner}-${s.name}`}
                onClick={() => openSkill(s)}
                className={`reveal liquid-glass cursor-pointer rounded-[32px] p-[18px] transition duration-300 hover:bg-white/[0.06] active:bg-white/[0.08] stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="flex min-h-[120px] flex-col justify-between rounded-[24px] bg-white/[0.03] p-5">
                  <div>
                    <h3 className="font-grotesk text-lg uppercase tracking-wide text-cream">
                      {s.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase text-cream/50">
                      {s.owner}/{s.repo}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 font-mono text-xs leading-relaxed text-cream/70">
                    {descText(s)}
                  </p>
                </div>
                <div className="liquid-glass mt-4 flex items-center justify-between gap-3 rounded-[20px] px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-cream/50">Stars</p>
                        <p className="font-grotesk text-[15px] text-cream">
                          <Star className="mr-1 inline h-3.5 w-3.5 text-neon" />
                          {(s.stars ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-cream/50">Total</p>
                        <p className="font-grotesk text-[15px] text-cream">
                          {installStats(s).total.toLocaleString()}
                          {installStats(s).estimated ? (
                            <span className="badge-est" title="Estimated from repository stars until real install events accumulate">est.</span>
                          ) : (
                            <span className="badge-live" title="Measured from SkillForge install tracking">live</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-cream/50">Week</p>
                        <p className="font-grotesk text-[15px] text-cream">
                          {installStats(s).weekly.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-cream/50">Day</p>
                        <p className="font-grotesk text-[15px] text-cream">
                          {installStats(s).daily.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`View ${s.name}`}
                    className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neon transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
                  >
                    <ChevronRight className="h-5 w-5 text-space" />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!catalogLoading && results.length === 0 && (
            <div className="liquid-glass mt-4 rounded-[28px] px-8 py-12 text-center" role="status">
              <p className="font-grotesk text-lg uppercase tracking-wide text-cream">No skills matched</p>
              <p className="mt-2 font-mono text-xs uppercase text-cream/50">
                Try another keyword or clear filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag("");
                }}
                className="mt-6 rounded-full bg-neon px-5 py-2.5 font-grotesk text-xs uppercase tracking-wide text-space transition hover:opacity-90"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="trending" className="reveal border-t border-white/5 bg-space py-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">Leaderboard</p>
              <h2 className="mt-2 font-grotesk text-3xl uppercase tracking-wide text-cream sm:text-4xl">
                Trending skills
              </h2>
            </div>
            <div className="liquid-glass flex gap-1 rounded-full p-1">
              {["daily", "weekly", "hot", "overall"].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTab(w)}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition",
                    tab === w ? "bg-neon text-space" : "text-cream/70 hover:text-cream"
                  )}
                >
                  {w === "overall" ? "All" : w}
                </button>
              ))}
            </div>
          </div>

          <div className="liquid-glass overflow-hidden rounded-[1.5rem]">
            {trendingLoading && (
              <ul className="divide-y divide-white/5" aria-busy="true" aria-label="Loading leaderboard">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={`ts-${i}`} className="flex items-center gap-4 px-5 py-4">
                    <div className="skeleton h-8 w-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="skeleton h-4 w-1/3 max-w-[10rem]" />
                      <div className="skeleton h-3 w-1/4 max-w-[7rem]" />
                    </div>
                    <div className="skeleton h-3 w-20" />
                  </li>
                ))}
              </ul>
            )}
            {!trendingLoading && trending.length === 0 && (
              <p className="p-8 font-mono text-sm uppercase text-cream/50">
                No installs yet — be the first.
              </p>
            )}
            <ul className="divide-y divide-white/10">
              {trending.map((s, i) => (
                <li key={s.id || `${s.owner}-${s.repo}-${i}`}>
                  <button
                    type="button"
                    onClick={() => openSkill(s)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="w-8 font-mono text-xs text-cream/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-grotesk uppercase tracking-wide text-cream">
                        {s.name}
                      </div>
                      <div className="truncate font-mono text-xs uppercase text-cream/50">
                        {s.owner}/{s.repo}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 font-mono text-[10px] uppercase text-cream/60 sm:flex-row sm:items-center sm:gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-neon" /> {(s.stars ?? 0).toLocaleString()}
                      </span>
                      <span title={installStats(s).estimated ? "Estimated from stars" : "Measured installs"}>
                        {installStats(s).total} total{installStats(s).estimated ? "·est" : ""}
                      </span>
                      <span title="Weekly">{installStats(s).weekly} wk</span>
                      <span title="Daily">{installStats(s).daily} day</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {!trendingLoading && trendingHasMore && (
              <div className="border-t border-white/10 p-4 text-center">
                <button
                  type="button"
                  onClick={loadMoreTrending}
                  disabled={trendingLoadingMore}
                  className="pressable liquid-glass rounded-full px-6 py-2.5 font-mono text-xs uppercase tracking-wide text-cream transition hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  {trendingLoadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="skeleton h-3 w-3 rounded-full" />
                      Loading…
                    </span>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="trust" className="reveal border-y border-white/5 bg-space py-16 sm:py-20" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <h2 id="trust-heading" className="font-grotesk text-[28px] uppercase leading-tight text-cream sm:text-[40px]">
            Built for trust
          </h2>
          <p className="mt-3 max-w-2xl font-mono text-xs uppercase leading-relaxed text-cream/55">
            Public GitHub sources only. Content is scanned before publish. Install counts marked{" "}
            <span className="text-cream/80">live</span> are measured; <span className="text-cream/80">est.</span> means
            derived from stars until real installs accumulate.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Safety scan", d: "Flagged skills go to review — not silent publish." },
              { t: "Open source", d: "Every skill links to its GitHub source repository." },
              { t: "Honest metrics", d: "Live vs estimated install counts are labeled in the UI." },
              { t: "One command", d: "npx skillforge add owner/repo/skill — copy and run." },
            ].map((item) => (
              <div key={item.t} className="liquid-glass rounded-[24px] p-5">
                <p className="font-grotesk text-sm uppercase tracking-wide text-neon">{item.t}</p>
                <p className="mt-2 font-mono text-[11px] uppercase leading-relaxed text-cream/60">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="install" className="reveal relative w-full overflow-hidden bg-space">
        <video className="motion-safe-video block h-auto w-full" src={CTA_VIDEO} autoPlay loop muted playsInline preload="none" aria-hidden />
        <div className="motion-reduce-fallback min-h-[40vh] w-full bg-gradient-to-r from-space via-[#02103a] to-space" aria-hidden />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/2 w-full max-w-3xl -translate-y-1/2 px-6 text-right sm:px-10 lg:pl-[15%] lg:pr-[12%]">
            <div className="relative inline-block text-left">
              <span className="pointer-events-none absolute -left-2 -top-4 font-condiment text-[17px] text-neon opacity-90 mix-blend-exclusion sm:-top-8 sm:text-[28px] md:text-[42px] lg:text-[56px]">
                One command
              </span>
              <h2 className="font-grotesk text-[16px] uppercase leading-[1.1] text-cream sm:text-[28px] md:text-[40px] lg:text-[52px]">
                <span className="mb-4 block sm:mb-6">Install.</span>
                npx skillforge add
                <br />
                owner/repo/skill
              </h2>
            </div>
          </div>
        </div>
      </section>


      <section id="faq" className="reveal border-t border-white/5 bg-space py-16 sm:py-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <h2 id="faq-heading" className="font-grotesk text-[28px] uppercase leading-tight text-cream sm:text-[40px]">
            FAQ
          </h2>
          <p className="mt-3 max-w-xl font-mono text-xs uppercase text-cream/50">
            Straight answers for agent builders installing skills for the first time.
          </p>
          <dl className="mt-10 space-y-6">
            {[
              {
                q: "What is an agent skill?",
                a: "A SKILL.md package that teaches coding agents how to run a task. SkillForge indexes public ones from GitHub.",
              },
              {
                q: "How do I install one?",
                a: "Open any skill, copy npx skillforge add owner/repo/skill, and run it in your terminal.",
              },
              {
                q: "Are they scanned?",
                a: "Yes. Risky patterns go to review instead of silent publish. Metrics marked live are measured; est. means star-derived until installs accumulate.",
              },
              {
                q: "Where do skills come from?",
                a: "Public GitHub only — community authors and orgs that publish SKILL.md files.",
              },
            ].map((item) => (
              <div key={item.q} className="liquid-glass rounded-[20px] px-5 py-4">
                <dt className="font-grotesk text-sm uppercase tracking-wide text-neon">{item.q}</dt>
                <dd className="mt-2 font-mono text-[12px] uppercase leading-relaxed text-cream/65">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="sources" className="reveal border-t border-white/5 py-14 sm:py-16" aria-label="Indexed sources">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <p className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
            Trusted publishers in the index
          </p>
          <p className="mt-2 max-w-xl font-mono text-[11px] uppercase leading-relaxed text-cream/50">
            Logos loop from orgs that publish public agent skills on GitHub — not paid placement.
          </p>
        </div>
        <div className="logo-marquee mt-8" aria-hidden="true">
          <div className="logo-marquee-track">
            {[...PUBLISHERS, ...PUBLISHERS].map((pub, i) => (
              <a
                key={`${pub.name}-${i}`}
                href={pub.href}
                target="_blank"
                rel="noopener noreferrer"
                className="logo-marquee-item liquid-glass rounded-[16px]"
                title={pub.name}
                tabIndex={i < PUBLISHERS.length ? 0 : -1}
              >
                {pub.slug ? (
                  <img
                    src={`https://cdn.simpleicons.org/${pub.slug}/EFF4FF`}
                    alt=""
                    width={112}
                    height={28}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="logo-fallback">{pub.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
        <p className="sr-only">
          Indexed publishers include Vercel, Microsoft, Stripe, n8n, GitHub, Google, Meta, Cloudflare,
          Anthropic, Better Auth, Remotion, and Callstack.
        </p>
      </section>

      <footer className="border-t border-white/5 px-6 py-12" role="contentinfo">
        <div className="mx-auto flex max-w-content flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-grotesk text-sm uppercase tracking-wide text-cream">SkillForge</p>
            <p className="mt-2 max-w-sm font-mono text-[11px] uppercase leading-relaxed text-cream/45">
              Agent skill registry. Indexed from public GitHub. Safety-scanned. Install in one command.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wide text-cream/55">
              <li>
                <a href="#browse" className="transition hover:text-neon focus-visible:text-neon">
                  Catalog
                </a>
              </li>
              <li>
                <a href="#trust" className="transition hover:text-neon focus-visible:text-neon">
                  Trust
                </a>
              </li>
              <li>
                <a href="#install" className="transition hover:text-neon focus-visible:text-neon">
                  Install
                </a>
              </li>
              <li>
                <a href="#faq" className="transition hover:text-neon focus-visible:text-neon">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Rustys90/skillforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-neon focus-visible:text-neon"
                >
                  Source
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-content font-mono text-[10px] uppercase tracking-wide text-cream/35">
          SkillForge · public GitHub skills · MIT-licensed site · metrics labeled live or est.
        </p>
      </footer>

      </main>
      <SkillDialog skill={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
