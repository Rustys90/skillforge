"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Star, Terminal, ExternalLink, ChevronRight, Copy, Share2, Shield, Github, Command, X, GitCompare, HelpCircle, Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const HeroSpaceBg = dynamic(() => import("@/components/HeroSpaceBg"), {
  ssr: false,
  loading: () => (
    <div className="hero-space-bg absolute inset-0" style={{ background: "#0a0a0a" }} aria-hidden />
  ),
});

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
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "GitHub", href: "https://github.com/Rustys90/skillforge", external: true },
];

const TAGS = ["pdf", "xlsx", "csv", "api", "browser", "git", "testing", "deploy", "docker", "sql", "email", "security", "docs"];

const COLLECTIONS = [
  { id: "docs", title: "Documents", tag: "pdf", blurb: "PDF, docs, and file skills" },
  { id: "web", title: "Browser & API", tag: "browser", blurb: "Fetch, browse, and API agents" },
  { id: "git", title: "Git & ship", tag: "git", blurb: "Repos, deploy, and shipping" },
  { id: "data", title: "Data", tag: "sql", blurb: "SQL, CSV, and tables" },
];

const POPULAR_QUERIES = ["pdf", "browser", "git", "deploy", "docker", "whisper", "sql"];

const FAQ_ITEMS = [
  {
    q: "What is a skill?",
    a: "A skill is a SKILL.md (and helpers) that teaches an agent how to do a task. Browse the catalog, then install with one npx command.",
    href: "#browse",
  },
  {
    q: "Are skills safe?",
    a: "We scan public GitHub skills before they surface, but scanning is best-effort. Always review upstream source before production use.",
    href: "#trust",
  },
  {
    q: "How do I install?",
    a: "Open a skill, copy the install command, and run it in your project terminal. Your agent can then load the skill from that path.",
    href: "#install",
  },
  {
    q: "Where do rankings come from?",
    a: "Daily, weekly, hot, and overall use install activity when volume is high enough; otherwise time-aware estimates from stars keep boards moving.",
    href: "#trending",
  },
];

function relativeTime(iso) {
  if (!iso) return "recent";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "recent";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}


/** Trusted / frequently indexed publishers — logo marquee (Simple Icons CDN). */
const PUBLISHERS = [
  { name: "Vercel", logo: "https://github.com/vercel.png", href: "https://github.com/vercel" },
  { name: "Microsoft", logo: "https://github.com/microsoft.png", href: "https://github.com/microsoft" },
  { name: "Stripe", logo: "https://github.com/stripe.png", href: "https://github.com/stripe" },
  { name: "n8n", logo: "https://github.com/n8n-io.png", href: "https://github.com/n8n-io" },
  { name: "GitHub", logo: "https://github.com/github.png", href: "https://github.com" },
  { name: "Google", logo: "https://github.com/google.png", href: "https://github.com/google" },
  { name: "Meta", logo: "https://github.com/facebook.png", href: "https://github.com/facebook" },
  { name: "Cloudflare", logo: "https://github.com/cloudflare.png", href: "https://github.com/cloudflare" },
  { name: "Anthropic", logo: "https://github.com/anthropics.png", href: "https://github.com/anthropics" },
  { name: "Better Auth", logo: "https://github.com/better-auth.png", href: "https://github.com/better-auth" },
  { name: "Remotion", logo: "https://github.com/remotion-dev.png", href: "https://github.com/remotion-dev" },
  { name: "Callstack", logo: "https://github.com/callstackincubator.png", href: "https://github.com/callstackincubator" },
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

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function skillShareUrl(s) {
  if (typeof window === "undefined") return skillHref(s);
  return `${window.location.origin}${skillHref(s)}`;
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

/** Mirror server stats: live only after meaningful install volume; else time-shifting estimates. */
const LIVE_INSTALL_THRESHOLD = 25;

function installStats(s) {
  const realTotal = Number(s.downloads_total ?? s.downloads ?? 0);
  const realDaily = Number(s.downloads_daily ?? 0);
  const realWeekly = Number(s.downloads_weekly ?? 0);
  // API may already have applied estimates
  if (s.downloads_estimated === false && realTotal >= LIVE_INSTALL_THRESHOLD) {
    return { total: realTotal, daily: realDaily, weekly: realWeekly, estimated: false };
  }
  if (s.downloads_estimated === true && Number(s.downloads_total) > 0) {
    return {
      total: Number(s.downloads_total),
      daily: Number(s.downloads_daily ?? 0),
      weekly: Number(s.downloads_weekly ?? 0),
      estimated: true,
    };
  }
  if (realTotal >= LIVE_INSTALL_THRESHOLD) {
    return { total: realTotal, daily: realDaily, weekly: realWeekly, estimated: false };
  }
  const stars = Math.max(0, Number(s.stars) || 0);
  const baseKey = String(s?.id ?? `${s?.owner}/${s?.repo}/${s?.name}` ?? "x");
  const seed = stableSeed({ id: baseKey });
  const day = Math.floor(Date.now() / 86_400_000);
  const week = Math.floor(day / 7);
  let dayH = 2166136261;
  const dayKey = `${baseKey}:d:${day}`;
  for (let i = 0; i < dayKey.length; i++) {
    dayH ^= dayKey.charCodeAt(i);
    dayH = Math.imul(dayH, 16777619);
  }
  dayH = Math.abs(dayH >>> 0);
  let weekH = 2166136261;
  const weekKey = `${baseKey}:w:${week}`;
  for (let i = 0; i < weekKey.length; i++) {
    weekH ^= weekKey.charCodeAt(i);
    weekH = Math.imul(weekH, 16777619);
  }
  weekH = Math.abs(weekH >>> 0);
  const total = Math.max(1, Math.floor(Math.sqrt(stars) * 3.2) + (seed % 97) + Math.floor(stars / 500));
  const weekly = Math.max(1, Math.floor(total * (0.1 + (weekH % 15) / 100)) + (weekH % 11));
  const daily = Math.max(0, Math.floor(weekly * (0.12 + (dayH % 12) / 100)) + (dayH % 5));
  return {
    total: Math.max(total, realTotal),
    daily: Math.max(daily, realDaily),
    weekly: Math.max(weekly, realWeekly),
    estimated: true,
  };
}

function descText(s) {
  const d = (s?.description || "").trim();
  if (!d || /description pending/i.test(d) || /pending crawler/i.test(d)) {
    return `${s?.name || "Skill"} — open-source agent skill by ${s?.owner || "unknown"}. Safety-scanned on SkillForge.`;
  }
  return d;
}

export default function HomeClient({ initialTrending = [], initialWeekly = [], initialMeta = null }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [results, setResults] = useState(initialTrending);
  const [catalogLoading, setCatalogLoading] = useState(!(initialTrending && initialTrending.length));
  const [catalogError, setCatalogError] = useState(null);
  const [totalResults, setTotalResults] = useState(null);
  const [tab, setTab] = useState("weekly");
  const [trending, setTrending] = useState(initialWeekly.length ? initialWeekly : []);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [meta, setMeta] = useState(initialMeta);
  const [toast, setToast] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cliOpen, setCliOpen] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [typedCmd, setTypedCmd] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const searchRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2800);
  };
  const pushRecent = useCallback((q) => {
    const v = String(q || "").trim();
    if (!v) return;
    setRecentSearches((prev) => {
      const next = [v, ...prev.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem("sf_recent_q", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const skillKey = (s) => String(s.id ?? `${s.owner}/${s.repo}/${s.name}`);
  const featuredList = meta?.featuredPool?.length ? meta.featuredPool : (meta?.featured ? [meta.featured] : []);
  const activeFeatured = featuredList.length
    ? featuredList[((featuredIdx % featuredList.length) + featuredList.length) % featuredList.length]
    : null;
  const tagCountMap = useMemo(() => {
    const m = {};
    for (const row of meta?.tagCounts || []) m[row.tag] = row.count;
    return m;
  }, [meta]);

  const compareIds = new Set(compareList.map(skillKey));
  const toggleCompare = (s) => {
    setCompareList((prev) => {
      const k = skillKey(s);
      const exists = prev.some((x) => skillKey(x) === k);
      if (exists) return prev.filter((x) => skillKey(x) !== k);
      if (prev.length >= 2) return [prev[1], s];
      return [...prev, s];
    });
  };
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false);
  const [trendingHasMore, setTrendingHasMore] = useState(false);
  const TRENDING_PAGE = 20;

  useEffect(() => {
    let url = query.trim()
      ? `/api/skills/search?q=${encodeURIComponent(query)}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
      : activeTag
        ? `/api/skills/search?tag=${encodeURIComponent(activeTag)}&limit=20`
        : "/api/skills/trending?window=overall&limit=12";
    if (ownerFilter) {
      url = `/api/skills/search?q=${encodeURIComponent(ownerFilter)}&limit=24`;
    }
    // Show skeletons immediately — don't wait for debounce
    setCatalogLoading(true);
    setCatalogError(null);
    const t = setTimeout(() => {
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
    }, 200);
    return () => clearTimeout(t);
  }, [query, activeTag, ownerFilter]);

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

  /* Scroll-reveal for cards — fail-safe so content never stays invisible */
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal:not(.is-visible)"));
    if (!nodes.length) return;

    // Immediate: anything already on screen
    const mark = (el) => el.classList.add("is-visible");
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 1.05 && r.bottom > -40;
    };
    nodes.forEach((n) => {
      if (inView(n)) mark(n);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            mark(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "80px 0px 80px 0px" }
    );
    nodes.forEach((n) => {
      if (!n.classList.contains("is-visible")) io.observe(n);
    });

    // Failsafe: if still hidden after 600ms (slow IO / mobile quirks), show all
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(mark);
    }, 600);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [results, trending, trendingLoading, catalogLoading, meta]);

  const openSkill = (s) => {
    if (!s) return;
    // Full skill page only — no intermediate partial dialog
    window.location.assign(skillHref(s));
  };

  // Pause background videos when offscreen — keeps scroll smooth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vids = Array.from(document.querySelectorAll("video.motion-safe-video, video.hero-cherry-video"));
    if (!vids.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target;
          if (!(v instanceof HTMLVideoElement)) continue;
          if (e.isIntersecting && e.intersectionRatio > 0.1) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: [0, 0.1, 0.25], rootMargin: "60px 0px" }
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [results.length, trending.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sf_recent_q");
      if (raw) setRecentSearches(JSON.parse(raw).slice(0, 6));
    } catch {}
  }, []);


  // Keep total skills / installs / newest in sync as the crawler publishes
  useEffect(() => {
    let cancelled = false;
    const loadMeta = () => {
      fetch("/api/skills/meta", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d && !d.error) setMeta(d);
        })
        .catch(() => {});
    };
    loadMeta();
    const id = window.setInterval(loadMeta, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") loadMeta();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (!typing && e.key === "/" ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (!typing && e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const full = "npx skillforge add owner/repo/skill";
    let i = 0;
    setTypedCmd("");
    const id = window.setInterval(() => {
      i += 1;
      setTypedCmd(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen bg-space text-cream">
      <a href="#browse" className="skip-link">
        Skip to catalog
      </a>
      <main id="main">
      <div className="texture-overlay" aria-hidden />

      {/* Slim stats + install ticker */}
      <div className="relative z-[60] border-b border-white/5 bg-space/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-content items-center gap-4 px-4 py-1.5 sm:px-10">
          <div className="flex shrink-0 items-center gap-2 font-ui text-[11px] font-medium uppercase tracking-wide text-cream/60">
            <span className="text-neon/90">
              <span className="tabular-nums transition-opacity duration-300">
                {meta?.totalSkills != null ? Number(meta.totalSkills).toLocaleString() : "—"}
              </span>{" "}
              skills
            </span>
            <span className="hidden text-cream/30 sm:inline">·</span>
            {(meta?.installsToday ?? 0) > 0 ? (
              <span className="hidden sm:inline">
                {(meta?.installsToday ?? 0).toLocaleString()} today
                <span className="badge-live ml-1">live</span>
              </span>
            ) : (
              <span className="hidden text-cream/40 sm:inline">installs warming up</span>
            )}
          </div>
          <div className="logo-marquee min-w-0 flex-1" id="live-ticker" aria-label="Recent installs">
            <div className="logo-marquee-track" style={{ animationDuration: "28s" }}>
              {[
                ...(meta?.recentInstalls || []).map((item) => ({ ...item, _kind: "install" })),
                ...(meta?.newest || []).slice(0, 6).map((item) => ({ ...item, _kind: "new" })),
              ]
                .concat([])
                .flatMap((x) => [x, x])
                .map((item, i) => (
                <span
                  key={`inst-${i}-${item.name}-${item._kind}`}
                  className="logo-marquee-item !min-w-0 !h-auto !py-0.5 font-mono text-[10px] uppercase tracking-wide text-cream/60"
                >
                  {item._kind === "new" ? (
                    <>indexed <span className="text-neon">{item.name}</span></>
                  ) : (
                    <>installed <span className="text-neon">{item.name}</span></>
                  )}
                </span>
              ))}
              {!(meta?.recentInstalls?.length) && (
                <span className="logo-marquee-item !min-w-0 font-mono text-[10px] uppercase text-cream/40">
                  Install ticker warming up…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      <section className="relative min-h-[100svh] overflow-hidden rounded-b-[24px] sm:rounded-b-[32px]" aria-label="Hero">
        <HeroSpaceBg />
        {/* Light veil only — cinematic grade lives inside HeroSpaceBg */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-space/25 via-transparent to-space/55" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-content flex-col px-4 py-6 sm:px-10 sm:py-8 lg:px-16">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="group flex items-center gap-2.5 text-cream" aria-label="SkillForge home">
                <img
                  src="/logo.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-[10px] ring-1 ring-white/10 transition group-hover:ring-neon/40"
                />
                <span className="font-grotesk text-[16px] uppercase tracking-wide">SkillForge</span>
              </Link>
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className="pressable rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70"
                >
                  ⌘K
                </button>
                <button
                  type="button"
                  onClick={() => setCliOpen(true)}
                  className="pressable rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70"
                >
                  CLI
                </button>
              </div>
            </div>
            <nav className="mobile-nav-strip flex flex-wrap gap-1.5 lg:hidden" aria-label="Mobile">
              {NAV.filter((n) => !n.external).map((item) => (
                <a
                  key={`m-${item.label}`}
                  href={item.href}
                  className="tag-chip rounded-full border border-white/10 px-3 py-1 font-ui text-[10px] font-medium uppercase tracking-wide text-cream/70"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <nav className="liquid-glass hidden rounded-[var(--radius-bezel)] px-6 py-3 lg:block" aria-label="Primary">
              <ul className="flex items-center gap-6">
                {NAV.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-ui text-[13px] font-semibold uppercase tracking-wide text-cream transition hover:text-neon"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        href={item.href}
                        className="font-ui text-[13px] font-semibold uppercase tracking-wide text-cream transition hover:text-neon"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setCmdOpen(true)}
                    className="pressable rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70 hover:text-neon"
                  >
                    ⌘K
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setCliOpen(true)}
                    className="pressable rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70 hover:text-neon"
                  >
                    CLI
                  </button>
                </li>
              </ul>
            </nav>
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

            <p className="font-body mt-6 max-w-md text-sm leading-relaxed text-cream/80 lg:ml-16">
              Public GitHub skills. Scanned before publish. Install with one npx command.
            </p>

            <form
              role="search"
              aria-label="Search agent skills"
              className="relative mt-10 w-full max-w-xl lg:ml-16"
              onSubmit={(e) => {
                e.preventDefault();
                pushRecent(query);
                setOwnerFilter("");
                document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <label htmlFor="skill-search" className="sr-only">
                Search skills by name, tag, or description
              </label>
              <div className={cn("search-orbit liquid-glass rounded-[1.25rem]", searchFocused && "is-focused")}>
                <Search className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-neon/80" aria-hidden />
                <input
                  ref={searchRef}
                  id="skill-search"
                  name="q"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOwnerFilter("");
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
                  placeholder={`Search skills — try “${POPULAR_QUERIES[placeholderIdx]}”…`}
                  autoComplete="off"
                  spellCheck={false}
                  className="search-placeholder-anim relative z-[1] h-14 w-full rounded-[1.25rem] border-0 bg-transparent pl-12 pr-28 font-mono text-sm text-cream caret-neon placeholder:text-cream/40 focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 z-[1] flex -translate-y-1/2 items-center gap-1">
                  <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-cream/35 sm:inline">/</kbd>
                  {query ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setQuery("");
                        setOwnerFilter("");
                      }}
                      className="rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-cream/50 transition hover:bg-white/10 hover:text-cream"
                    >
                      Clear
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    className="pressable rounded-full bg-neon px-3.5 py-2 font-grotesk text-[11px] uppercase tracking-wide text-space transition hover:opacity-90"
                  >
                    Search
                  </button>
                </div>
              </div>
              {(searchFocused || query) && (
                <div className="panel absolute left-0 right-0 z-20 mt-2 p-3 shadow-xl">
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-cream/40">Recent</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70 hover:border-neon/40 hover:text-neon"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery(r);
                              setOwnerFilter("");
                              pushRecent(r);
                              document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <Clock className="mr-1 inline h-3 w-3" />
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-cream/40">Popular</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_QUERIES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cream/70 hover:border-neon/40 hover:text-neon"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuery(r);
                          setOwnerFilter("");
                          pushRecent(r);
                          document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>


            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:ml-16" style={{ scrollbarWidth: "thin" }}>
              {(activeTag || ownerFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTag("");
                    setOwnerFilter("");
                  }}
                  className="tag-chip pressable inline-flex items-center gap-1 rounded-full border border-neon/40 bg-neon/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-neon"
                >
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setOwnerFilter("");
                    setActiveTag((cur) => (cur === tag ? "" : tag));
                  }}
                  className={cn(
                    "tag-chip pressable rounded-full px-3.5 py-1.5 font-ui text-[11px] font-medium uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50",
                    activeTag === tag
                      ? "bg-neon text-space"
                      : "border border-white/10 bg-white/[0.04] text-cream hover:bg-white/10"
                  )}
                >
                  {tag}
                  {tagCountMap[tag] != null && (
                    <span className={cn("ml-1 opacity-70", activeTag === tag ? "text-space/70" : "text-cream/45")}>
                      {tagCountMap[tag]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      
      <div className="section-band border-b border-white/5 py-3">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-6 sm:px-10 lg:px-16">
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Shield, label: "Safety scanned" },
              { icon: Github, label: "Public GitHub" },
              { icon: Star, label: "Live / est. metrics" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-ui text-[10px] font-medium uppercase tracking-wide text-cream/70"
              >
                <Icon className="h-3 w-3 text-neon" /> {label}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/Rustys90/skillforge"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable liquid-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-cream/80 transition hover:text-neon"
          >
            <Github className="h-3.5 w-3.5" /> Open source · MIT
          </a>
        </div>
      </div>

<section className="relative min-h-[36vh] overflow-hidden sm:min-h-[50vh]">
        <video
          className="motion-safe-video absolute inset-0 h-full w-full object-cover"
          src={ABOUT_VIDEO}
          preload="none"
          muted
          loop
          playsInline
          loop
          muted
          playsInline
          preload="metadata"
          preload="none"
          poster=""
          aria-hidden
        />
        <div className="motion-reduce-fallback absolute inset-0 bg-gradient-to-r from-space via-[#02103a] to-space" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-space/80 via-space/55 to-space/70" />
        <div className="relative z-10 mx-auto flex min-h-[36vh] max-w-content flex-col justify-center px-6 py-12 sm:min-h-[50vh] sm:px-10 sm:py-16 lg:px-16">
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
            <p className="font-body max-w-[300px] text-[15px] leading-relaxed text-cream/85 sm:text-[16px]">
              A living index of agent skills from public GitHub — scanned, ranked, installable in one line.
            </p>
          </div>
        </div>
      </section>

      {/* GEO/AEO citable prose — server-friendly facts */}
      

      <section id="browse" className="section-contain bg-space py-20 sm:py-24 lg:py-28">
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
            <div className="liquid-glass mb-10 rounded-[var(--radius-bezel)] px-8 py-12 text-center" role="status">
              <p className="font-grotesk text-xl uppercase tracking-wide text-cream">No skills matched</p>
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
            <div className="liquid-glass mb-6 rounded-[var(--radius-bezel)] px-6 py-5" role="alert">
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

          
          {/* Featured skill of the day — mobile-first */}
          {activeFeatured && (
            <article
              id="featured"
              className="featured-card parallax-card mb-8 cursor-pointer overflow-hidden p-4 sm:p-6 lg:p-8"
              onClick={() => openSkill(activeFeatured)}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 flex-1">
                  <p className="font-condiment text-lg text-neon sm:text-xl lg:text-2xl">Skill of the day</p>
                  <h3 className="mt-1 break-words font-grotesk text-[22px] uppercase leading-tight tracking-wide text-cream sm:text-3xl lg:text-4xl">
                    {activeFeatured.name}
                  </h3>
                  <p className="mt-2 break-all font-mono text-[10px] uppercase tracking-wide text-cream/50 sm:text-[11px]">
                    {activeFeatured.owner}/{activeFeatured.repo} · {(activeFeatured.stars ?? 0).toLocaleString()}★
                  </p>
                  <p className="font-body mt-3 line-clamp-4 text-[14px] leading-relaxed text-cream/80 sm:mt-4 sm:line-clamp-none sm:text-[15px]">
                    {descText(activeFeatured)}
                  </p>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[13.5rem]">
                  <p className="font-body text-[12px] leading-snug text-cream/55 lg:max-w-[14rem]">
                    Why featured: high stars, clear description, and a strong fit for agent workflows.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="pressable flex-1 rounded-full border border-white/15 px-3 py-2 font-mono text-[10px] uppercase text-cream/70 sm:flex-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturedIdx((i) => i - 1);
                      }}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="pressable flex-1 rounded-full border border-white/15 px-3 py-2 font-mono text-[10px] uppercase text-cream/70 sm:flex-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturedIdx((i) => i + 1);
                      }}
                    >
                      Next
                    </button>
                  </div>
                  <button
                    type="button"
                    className="pressable w-full rounded-full bg-neon px-4 py-2.5 font-grotesk text-[11px] uppercase text-space"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await copyText(installCmd(activeFeatured));
                      showToast(ok ? "Copied · paste in terminal · reload agent" : "Copy failed");
                    }}
                  >
                    Copy install
                  </button>
                  <button
                    type="button"
                    className="pressable w-full rounded-full border border-white/15 px-4 py-2.5 font-mono text-[11px] uppercase text-cream"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await copyText(skillShareUrl(activeFeatured));
                      showToast(ok ? "Skill link copied" : "Copy failed");
                    }}
                  >
                    Share
                  </button>
                  <Link
                    href={skillHref(activeFeatured)}
                    className="pressable block w-full rounded-full border border-white/15 px-4 py-2.5 text-center font-mono text-[11px] uppercase text-cream"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open skill
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* Collections */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  window.location.href = `/categories/${encodeURIComponent(c.tag)}`;
                }}
                className="parallax-card panel flex gap-3 p-4 text-left transition hover:bg-white/[0.05]"
              >
                <span className="collection-accent" aria-hidden />
                <span>
                  <p className="font-display-alt text-sm font-semibold uppercase tracking-wide text-cream">{c.title}</p>
                  <p className="font-body mt-1 text-[13px] leading-snug text-cream/55">{c.blurb}</p>
                  {tagCountMap[c.tag] != null && (
                    <p className="mt-2 font-mono text-[10px] uppercase text-neon/80">{tagCountMap[c.tag]} skills</p>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* New this week rail */}
          {(meta?.newest?.length > 0) && (
            <div className="mb-10">
              <h3 className="mb-3 font-display-alt text-lg font-semibold uppercase tracking-wide text-cream">New in the index</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {meta.newest.map((s) => (
                  <button
                    key={skillKey(s)}
                    type="button"
                    onClick={() => openSkill(s)}
                    className="parallax-card panel w-[220px] shrink-0 p-4 text-left transition hover:bg-white/[0.05]"
                  >
                    <p className="truncate font-grotesk text-sm uppercase tracking-wide text-cream">{s.name}</p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase text-cream/45">
                      {s.owner} · {(s.stars ?? 0).toLocaleString()}★ · {relativeTime(s.indexed_at || s.last_crawled_at)}
                    </p>
                    {Array.isArray(s.tags) && s.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.slice(0, 3).map((tg) => (
                          <span key={tg} className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cream/45">
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {catalogLoading && (
            <div
              className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading skills"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`sk-${i}`} className="liquid-glass rounded-[var(--radius-bezel)] p-[18px]">
                  <div className="flex min-h-[132px] flex-col justify-between rounded-[var(--radius-bezel)] bg-white/[0.04] p-5">
                    <div className="w-full">
                      <div className="skeleton h-5 w-36" />
                      <div className="skeleton mt-2 h-3 w-24" />
                    </div>
                    <div className="mt-4 w-full space-y-2">
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-4/5 max-w-[14rem]" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 px-2 py-3">
                    <div className="skeleton h-9 w-16" />
                    <div className="skeleton h-9 w-16" />
                    <div className="skeleton h-9 w-16" />
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
                className={`group reveal liquid-glass cursor-pointer rounded-[var(--radius-bezel)] p-[18px] transition duration-300 hover:bg-white/[0.06] active:bg-white/[0.08] stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="flex min-h-[120px] flex-col justify-between rounded-[var(--radius-bezel)] bg-white/[0.03] p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-grotesk text-xl uppercase tracking-wide text-cream">
                        <Link
                          href={`/skills/${s.owner}/${s.repo}/${skillPath(s)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-neon"
                        >
                          {s.name}
                        </Link>
                      </h3>
                      <span className="shrink-0 rounded-full border border-neon/25 bg-neon/10 px-2 py-0.5 font-ui text-[9px] font-semibold uppercase tracking-wide text-neon">
                        Scanned
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] uppercase text-cream/50">
                      <button
                        type="button"
                        className="hover:text-neon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOwnerFilter(s.owner);
                          setQuery(s.owner);
                          setActiveTag("");
                        }}
                      >
                        {s.owner}
                      </button>
                      /{s.repo}
                    </p>
                  </div>
                  <p className="font-body mt-3 line-clamp-2 text-[13px] leading-relaxed text-cream/70">
                    {descText(s)}
                  </p>
                  <div className="skill-card-actions mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="pressable rounded-full bg-neon px-3 py-1 font-grotesk text-[10px] uppercase text-space"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await copyText(installCmd(s));
                        showToast(ok ? "Copied · paste in terminal · reload agent" : "Copy failed");
                      }}
                    >
                      <Copy className="mr-1 inline h-3 w-3" /> Copy
                    </button>
                    <button
                      type="button"
                      className="pressable rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase text-cream/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(s);
                      }}
                    >
                      Compare
                    </button>
                  </div>
                </div>
                <div className="liquid-glass mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-bezel)] px-5 py-4">
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
            <div className="liquid-glass mt-4 rounded-[var(--radius-bezel)] px-8 py-12 text-center" role="status">
              <p className="font-grotesk text-xl uppercase tracking-wide text-cream">No skills matched</p>
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

      <section id="trending" className="section-contain border-t border-white/5 bg-space py-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-neon">Leaderboard</p>
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
                      <div className="skeleton h-4 w-40" />
                      <div className="skeleton h-3 w-28" />
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
            <ul className="divide-y divide-white/10" key={`trend-${tab}`}>
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
                      <span className="inline-flex items-center gap-1 text-cream/40">
                        <Star className="h-3 w-3" /> {(s.stars ?? 0).toLocaleString()}
                      </span>
                      {tab === "daily" && (
                        <span className="text-neon">
                          {installStats(s).daily.toLocaleString()} today
                          {installStats(s).estimated ? " ·est" : ""}
                        </span>
                      )}
                      {tab === "weekly" && (
                        <span className="text-neon">
                          {installStats(s).weekly.toLocaleString()} this week
                          {installStats(s).estimated ? " ·est" : ""}
                        </span>
                      )}
                      {tab === "hot" && (
                        <span className="text-neon">
                          {(Number(s.downloads_hot) || Math.max(installStats(s).daily, installStats(s).weekly)).toLocaleString()} hot
                          {installStats(s).estimated ? " ·est" : ""}
                        </span>
                      )}
                      {tab === "overall" && (
                        <span className="text-neon">
                          {installStats(s).total.toLocaleString()} total
                          {installStats(s).estimated ? " ·est" : ""}
                        </span>
                      )}
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

      <section id="trust" className="border-y border-white/5 bg-space py-16 sm:py-20" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <p className="font-condiment text-2xl text-neon sm:text-3xl">Trust</p>
          <h2 id="trust-heading" className="font-grotesk text-[28px] uppercase leading-tight text-cream sm:text-[40px]">
            Built for operators
          </h2>
          <p className="font-body mt-3 max-w-2xl text-[14px] leading-relaxed text-cream/60">
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
              <div key={item.t} className="liquid-glass rounded-[var(--radius-bezel)] p-5">
                <p className="font-grotesk text-sm uppercase tracking-wide text-neon">{item.t}</p>
                <p className="font-body mt-2 text-[13px] leading-relaxed text-cream/60">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="changelog" className="border-b border-white/5 py-10" aria-labelledby="changelog-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <h2 id="changelog-heading" className="font-display-alt text-xl font-semibold uppercase tracking-wide text-cream">Index updates</h2>
          <p className="mt-2 font-mono text-[11px] uppercase text-cream/50">
            Crawler runs continuously. Latest cursor snapshot from the registry.
          </p>
          <div className="mt-4 liquid-glass rounded-[var(--radius-bezel)] px-4 py-3 font-mono text-[11px] uppercase text-cream/65">
            {meta?.crawlNote?.updated_at
              ? `Last crawl state update · ${new Date(meta.crawlNote.updated_at).toLocaleString()}`
              : "Crawl state will appear after the next indexed run."}
            {meta?.totalSkills != null && (
              <span className="mt-1 block text-neon/80">{meta.totalSkills.toLocaleString()} skills currently indexed</span>
            )}
          </div>
        </div>
      </section>

      <section id="install" className="section-contain relative w-full overflow-hidden bg-space">
        <video className="motion-safe-video block h-auto w-full brightness-75 contrast-110 saturate-50" src={CTA_VIDEO} autoPlay loop muted playsInline preload="none" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-space/40" aria-hidden />
        <div className="motion-reduce-fallback min-h-[40vh] w-full bg-gradient-to-r from-space via-[#02103a] to-space" aria-hidden />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/2 w-full max-w-3xl -translate-y-1/2 px-6 text-right sm:px-10 lg:pl-[15%] lg:pr-[12%]">
            <div className="relative inline-block text-left">
              <span className="pointer-events-none absolute -left-2 -top-4 font-condiment text-[17px] text-neon opacity-90 mix-blend-exclusion sm:-top-8 sm:text-[28px] md:text-[42px] lg:text-[56px]">
                One command
              </span>
              <h2 className="font-grotesk text-[16px] uppercase leading-[1.1] text-cream sm:text-[28px] md:text-[40px] lg:text-[52px]">
                <span className="mb-4 block sm:mb-6">Install.</span>
                <span className="font-mono text-[0.55em] normal-case tracking-normal text-neon sm:text-[0.45em]">
                  {typedCmd}
                  <span className="animate-pulse">▋</span>
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setCliOpen(true)}
                className="pressable pointer-events-auto mt-4 rounded-full bg-neon px-4 py-2 font-grotesk text-[11px] uppercase text-space"
              >
                CLI quickstart
              </button>
            </div>
          </div>
        </div>
      </section>


      <section id="faq" className="border-t border-white/5 py-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <p className="font-condiment text-2xl text-neon sm:text-3xl">Questions</p>
          <h2 id="faq-heading" className="font-grotesk text-[28px] uppercase leading-tight text-cream sm:text-[40px]">
            FAQ
          </h2>
          <p className="font-body mt-3 max-w-xl text-[14px] leading-relaxed text-cream/55">
            Straight answers for agent builders installing skills for the first time.
          </p>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={item.q} className="panel overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq((cur) => (cur === idx ? -1 : idx))}
                  aria-expanded={openFaq === idx}
                >
                  <span className="font-ui text-sm font-semibold uppercase tracking-wide text-cream">{item.q}</span>
                  <ChevronRight className={cn("h-4 w-4 text-neon transition", openFaq === idx && "rotate-90")} />
                </button>
                <div className={cn("faq-answer", openFaq === idx && "is-open")}>
                  <div>
                    <p className="font-body px-5 pb-4 text-[14px] leading-relaxed text-cream/65">{item.a}</p>
                    {item.href && (
                      <a href={item.href} className="mb-4 ml-5 inline-block font-mono text-[10px] uppercase text-neon hover:underline">
                        Jump to section →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sources" className="border-t border-white/5 py-14 sm:py-16" aria-label="Indexed sources">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <p className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
            Trusted publishers in the index
          </p>
          <p className="mt-2 max-w-xl font-mono text-[11px] uppercase leading-relaxed text-cream/50">
            Logos loop from orgs that publish public agent skills on GitHub — not paid placement.
          </p>
        </div>
        <div className="logo-marquee mt-8" role="region" aria-label="Indexed publishers">
          <div className="logo-marquee-track">
            {[...PUBLISHERS, ...PUBLISHERS].map((pub, i) => (
              <a
                key={`${pub.name}-${i}`}
                href={pub.href}
                target="_blank"
                rel="noopener noreferrer"
                className="logo-marquee-item liquid-glass rounded-[var(--radius-bezel)]"
                title={pub.name}
                tabIndex={i < PUBLISHERS.length ? 0 : -1}
              >
                <img
                  src={pub.logo}
                  alt={`${pub.name} logo`}
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-9 rounded-full object-cover bg-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.nextElementSibling;
                    if (fb) fb.hidden = false;
                  }}
                />
                <span className="logo-fallback font-ui text-[11px] font-semibold text-cream" hidden>
                  {pub.name}
                </span>
              </a>
            ))}
          </div>
        </div>
        <div className="logo-marquee mt-3" aria-hidden="true">
          <div className="logo-marquee-track logo-marquee-reverse">
            {[...PUBLISHERS].reverse().concat([...PUBLISHERS].reverse()).map((pub, i) => (
              <a
                key={`rev-${pub.name}-${i}`}
                href={pub.href}
                target="_blank"
                rel="noopener noreferrer"
                className="logo-marquee-item liquid-glass rounded-[var(--radius-bezel)]"
                title={pub.name}
                tabIndex={-1}
              >
                <img
                  src={pub.logo}
                  alt={`${pub.name} logo`}
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-9 rounded-full object-cover bg-white/10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.nextElementSibling;
                    if (fb) fb.hidden = false;
                  }}
                />
                <span className="logo-fallback font-ui text-[11px] font-semibold text-cream" hidden>
                  {pub.name}
                </span>
              </a>
            ))}
          </div>
        </div>
        <p className="sr-only">
          Indexed publishers include Vercel, Microsoft, Stripe, n8n, GitHub, Google, Meta, Cloudflare,
          Anthropic, Better Auth, Remotion, and Callstack.
        </p>
      </section>

      
      <section id="what-is" className="border-t border-white/5 bg-space/80 py-12 sm:py-14" aria-labelledby="what-is-heading">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <h2 id="what-is-heading" className="font-display-alt text-lg font-semibold uppercase tracking-wide text-cream/90 sm:text-xl">
            What SkillForge indexes
          </h2>
          <div className="font-body mt-3 max-w-3xl space-y-2 text-[13px] leading-relaxed text-cream/55 sm:text-[14px]">
            <p>
              SkillForge is a living index of <strong className="text-cream/80">AI agent skills</strong> published
              as public <code className="rounded bg-white/10 px-1 font-mono text-[11px] text-neon">SKILL.md</code>{" "}
              files on GitHub. As of the latest crawl, the registry holds{" "}
              <strong className="text-cream/80">{(meta?.totalSkills ?? "thousands of").toLocaleString?.() ?? meta?.totalSkills ?? "thousands of"}</strong>{" "}
              skills. Each entry is safety-scanned for high-risk patterns before auto-publish.
            </p>
            <p>
              Install with{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-[11px] text-neon">npx skillforge add owner/repo/skill</code>.
              Rankings use real CLI installs when volume is meaningful; otherwise time-aware estimates from
              repository stars are labeled clearly. Explore{" "}
              <a href="/categories/pdf" className="text-neon hover:underline">PDF</a>,{" "}
              <a href="/categories/browser" className="text-neon hover:underline">browser</a>,{" "}
              <a href="/categories/git" className="text-neon hover:underline">git</a>,{" "}
              <a href="/faq" className="text-neon hover:underline">FAQ</a>, and{" "}
              <a href="/trust" className="text-neon hover:underline">trust</a>.
            </p>
          </div>
        </div>
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
            <ul className="flex flex-wrap gap-4 font-ui text-[11px] font-medium uppercase tracking-wide text-cream/55">
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
                <a href="#faq" className="transition hover:text-neon focus-visible:text-neon">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/privacy" className="transition hover:text-neon focus-visible:text-neon">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="transition hover:text-neon focus-visible:text-neon">
                  Terms
                </a>
              </li>
              <li>
                <a href="/acceptable-use" className="transition hover:text-neon focus-visible:text-neon">
                  Acceptable use
                </a>
              </li>
              <li>
                <a href="/about" className="transition hover:text-neon focus-visible:text-neon">About</a>
              </li>
              <li>
                <a href="/faq" className="transition hover:text-neon focus-visible:text-neon">FAQ</a>
              </li>
              <li>
                <a href="/trust" className="transition hover:text-neon focus-visible:text-neon">Trust</a>
              </li>
              <li>
                <a href="https://github.com/Rustys90/skillforge/issues" target="_blank" rel="noopener noreferrer" className="transition hover:text-neon focus-visible:text-neon">
                  Report a skill
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
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-[80] flex w-[min(96vw,28rem)] -translate-x-1/2 flex-col gap-2 rounded-[var(--radius-bezel)] border border-white/10 bg-space/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase text-cream/70">Compare {compareList.length}/2</span>
            <button type="button" className="text-cream/50 hover:text-cream" onClick={() => setCompareList([])} aria-label="Clear compare">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((slot) => {
              const s = compareList[slot];
              return (
                <div key={slot} className="panel min-h-[3.5rem] px-2 py-2">
                  {s ? (
                    <p className="truncate font-mono text-[10px] uppercase text-neon">{s.name}</p>
                  ) : (
                    <p className="font-mono text-[10px] uppercase text-cream/35">Pick skill {slot + 1}</p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={compareList.length < 2}
            className="pressable rounded-full bg-neon px-3 py-2 font-grotesk text-[10px] uppercase text-space disabled:opacity-40"
            onClick={() => setCompareOpen(true)}
          >
            Open compare
          </button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-neon px-4 py-2 font-mono text-[11px] uppercase text-space shadow-lg"
        >
          {toast}
        </div>
      )}

      {/* ⌘K command palette */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[15vh]" onClick={() => setCmdOpen(false)}>
          <div
            className="liquid-glass w-full max-w-lg rounded-[var(--radius-bezel)] p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Search skills"
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="h-4 w-4 text-neon" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills…"
                className="w-full bg-transparent font-mono text-sm text-cream outline-none placeholder:text-cream/40"
              />
              <kbd className="font-mono text-[10px] text-cream/40">ESC</kbd>
            </div>
            {recentSearches.length > 0 && (
              <div className="mb-2 border-b border-white/10 pb-2">
                <p className="mb-1 font-mono text-[9px] uppercase text-cream/40">Recent searches</p>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((r) => (
                    <button
                      key={`cmd-${r}`}
                      type="button"
                      className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cream/70"
                      onClick={() => {
                        setQuery(r);
                        setCmdOpen(false);
                        document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {(results || []).slice(0, 8).map((s) => (
                <li key={skillKey(s)}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-white/5"
                    onClick={() => {
                      setCmdOpen(false);
                      openSkill(s);
                    }}
                  >
                    <span className="font-grotesk text-sm uppercase text-cream">{s.name}</span>
                    <span className="font-mono text-[10px] text-cream/45">{s.owner}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CLI modal */}
      {cliOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" onClick={() => setCliOpen(false)}>
          <div className="liquid-glass w-full max-w-md rounded-[var(--radius-bezel)] p-6" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between">
              <h3 className="font-grotesk text-xl uppercase text-cream">CLI quickstart</h3>
              <button type="button" onClick={() => setCliOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-cream/60" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 font-mono text-[12px] uppercase leading-relaxed text-cream/70">
              <li>1. Open a skill and copy the install command.</li>
              <li>2. Run it in your project terminal.</li>
              <li>3. Your agent can load the skill from the install path.</li>
            </ol>
            <pre className="mt-4 overflow-x-auto rounded-[var(--radius-bezel)] bg-black/40 px-3 py-2 text-[11px] text-neon">npx skillforge add owner/repo/skill</pre>
            <button
              type="button"
              className="pressable mt-4 w-full rounded-full bg-neon py-2.5 font-grotesk text-[11px] uppercase text-space"
              onClick={async () => {
                const ok = await copyText("npx skillforge add owner/repo/skill");
                showToast(ok ? "Example command copied" : "Copy failed");
              }}
            >
              Copy example
            </button>
          </div>
        </div>
      )}

      {/* Compare dialog */}
      {compareOpen && compareList.length === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" onClick={() => setCompareOpen(false)}>
          <div className="liquid-glass grid w-full max-w-3xl gap-4 rounded-[var(--radius-bezel)] p-6 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            {compareList.map((s) => (
              <div key={skillKey(s)}>
                <h3 className="font-grotesk text-lg uppercase text-cream">{s.name}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase text-cream/50">
                  {s.owner}/{s.repo} · {(s.stars ?? 0).toLocaleString()}★
                </p>
                <p className="mt-3 text-sm text-cream/75">{descText(s)}</p>
                <button
                  type="button"
                  className="pressable mt-4 rounded-full bg-neon px-3 py-1.5 font-grotesk text-[10px] uppercase text-space"
                  onClick={async () => {
                    const ok = await copyText(installCmd(s));
                    showToast(ok ? `Copied ${s.name}` : "Copy failed");
                  }}
                >
                  Copy install
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Keyboard help"
        className="fixed bottom-4 right-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-space/90 text-neon shadow-lg backdrop-blur transition hover:border-neon/40"
        onClick={() => setHelpOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {helpOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4" onClick={() => setHelpOpen(false)}>
          <div className="liquid-glass w-full max-w-md rounded-[var(--radius-bezel)] p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
            <div className="flex items-center justify-between">
              <h3 className="font-grotesk text-xl uppercase text-cream">Shortcuts</h3>
              <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close"><X className="h-4 w-4 text-cream/60" /></button>
            </div>
            <ul className="mt-4 space-y-2 font-mono text-[12px] uppercase text-cream/70">
              <li><kbd className="text-neon">/</kbd> Focus search</li>
              <li><kbd className="text-neon">⌘K</kbd> Command palette</li>
              <li><kbd className="text-neon">?</kbd> This help</li>
              <li><kbd className="text-neon">Esc</kbd> Close overlays</li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
