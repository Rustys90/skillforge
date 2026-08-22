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
  { label: "Trending", href: "#trending" },
  { label: "Install", href: "#install" },
  { label: "GitHub", href: "https://github.com/Rustys90/skillforge", external: true },
];

const TAGS = ["pdf", "xlsx", "api", "browser", "git", "testing"];

function skillPath(s) {
  return (s.path || "").replace(/\/?SKILL\.md$/i, "");
}
function skillHref(s) {
  return `/skills/${s.owner}/${s.repo}/${skillPath(s)}`;
}
function installCmd(s) {
  return `npx skillforge add ${s.owner}/${s.repo}/${skillPath(s) || s.name}`;
}

function SkillDialog({ skill, open, onOpenChange }) {
  if (!skill) return null;
  const cmd = installCmd(skill);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-space/95 text-cream sm:rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="font-grotesk text-2xl uppercase tracking-wide text-cream">
            {skill.name}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs uppercase text-cream/60">
            {skill.owner}/{skill.repo} · {skill.stars ?? 0}★
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-cream/80">{skill.description}</p>
        {skill.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-neon/40 bg-neon/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neon"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="liquid-glass rounded-[1rem] p-4">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
            <Terminal className="h-3 w-3" /> Install
          </div>
          <code className="break-all font-mono text-sm text-cream/90">{cmd}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={skillHref(skill)}
            className="inline-flex items-center gap-1 rounded-full bg-neon px-4 py-2 font-grotesk text-sm uppercase tracking-wide text-space transition hover:opacity-90"
          >
            Open skill <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={`https://github.com/${skill.owner}/${skill.repo}`}
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
  const [totalResults, setTotalResults] = useState(null);
  const [tab, setTab] = useState("weekly");
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const url = query.trim()
      ? `/api/skills/search?q=${encodeURIComponent(query)}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
      : activeTag
        ? `/api/skills/search?tag=${encodeURIComponent(activeTag)}&limit=20`
        : "/api/skills/trending?limit=6";
    const t = setTimeout(() => {
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          setResults(d.results || []);
          setTotalResults(d.total ?? null);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, activeTag]);

  useEffect(() => {
    setTrendingLoading(true);
    fetch(`/api/skills/trending?window=${tab}&limit=20`)
      .then((r) => r.json())
      .then((d) => setTrending(d.results || []))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, [tab]);

  const openSkill = (s) => {
    setSelected(s);
    setDialogOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-space text-cream">
      <div className="texture-overlay" aria-hidden />

      <section className="relative min-h-screen overflow-hidden rounded-b-[32px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
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
              Indexed from public GitHub. Safety-scanned. Install in one command.
            </p>

            <div className="relative mt-10 w-full max-w-lg lg:ml-16">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search skills, pdf, xlsx, api…"
                className="liquid-glass h-14 w-full rounded-[1.25rem] pl-12 pr-4 font-mono text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-1 focus:ring-neon/50"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:ml-16">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((cur) => (cur === tag ? "" : tag))}
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition",
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
          className="absolute inset-0 h-full w-full object-cover"
          src={ABOUT_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
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

      <section id="browse" className="bg-space py-20 sm:py-24 lg:py-28">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <article
                key={s.id || `${s.owner}-${s.name}`}
                onClick={() => openSkill(s)}
                className="liquid-glass cursor-pointer rounded-[32px] p-[18px] transition hover:bg-white/10"
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
                    {s.description || "Open-source agent skill from GitHub."}
                  </p>
                </div>
                <div className="liquid-glass mt-4 flex items-center justify-between rounded-[20px] px-5 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-cream/60">Stars</p>
                    <p className="font-grotesk text-[16px] text-cream">
                      <Star className="mr-1 inline h-3.5 w-3.5 text-neon" />
                      {s.stars ?? 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`View ${s.name}`}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-neon to-emerald-600 shadow-lg shadow-neon/30 transition hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 text-space" />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {results.length === 0 && (
            <p className="py-12 text-center font-mono text-sm uppercase text-cream/50">
              No skills match.
            </p>
          )}
        </div>
      </section>

      <section id="trending" className="border-t border-white/5 bg-space py-20">
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
              <p className="p-8 font-mono text-sm uppercase text-cream/50">Loading…</p>
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
                    <div className="flex items-center gap-3 font-mono text-xs text-cream/60">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-neon" /> {s.stars ?? 0}
                      </span>
                      <span>{s.downloads ?? 0} installs</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="install" className="relative w-full overflow-hidden bg-space">
        <video className="block h-auto w-full" src={CTA_VIDEO} autoPlay loop muted playsInline />
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

      <footer className="border-t border-white/5 px-6 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-cream/40">
          SkillForge · agent skills from public GitHub · MIT
        </p>
      </footer>

      <SkillDialog skill={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
