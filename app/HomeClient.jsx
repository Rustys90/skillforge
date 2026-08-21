"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { Search, Star, Terminal, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

function useDeviceTier() {
  const [tier, setTier] = useState("mid");
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return setTier("low");
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    if (mem >= 6 && cores >= 6) setTier("high");
    else if (mem >= 2 && cores >= 2) setTier("mid");
    else setTier("low");
  }, []);
  return tier;
}

function HeroScene({ tier }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const isHigh = tier === "high";
    const particleCount = isHigh ? 2200 : 900;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.045);
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: isHigh, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.4));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    const goldColors = [0xc9a961, 0x9c7d3e, 0xe8d5a0];
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.IcosahedronGeometry(3.2 + i * 0.9, 1);
      const wire = new THREE.WireframeGeometry(geo);
      const mat = new THREE.LineBasicMaterial({ color: goldColors[i], transparent: true, opacity: 0.22 - i * 0.05 });
      coreGroup.add(new THREE.LineSegments(wire, mat));
    }
    scene.add(coreGroup);

    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xe8d5a0, size: isHigh ? 0.045 : 0.06, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let raf;
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (isHigh) window.addEventListener("pointermove", onMove);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      coreGroup.rotation.y = t * 0.09;
      coreGroup.rotation.x = Math.sin(t * 0.05) * 0.15;
      particles.rotation.y = -t * 0.03;
      tx += (mx - tx) * 0.03;
      ty += (my - ty) * 0.03;
      camera.position.x = tx * 1.4;
      camera.position.y = -ty * 0.9;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (isHigh) window.removeEventListener("pointermove", onMove);
      coreGroup.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
      pGeo.dispose(); pMat.dispose(); renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [tier]);
  return <div ref={mountRef} className="absolute inset-0" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}


function skillPath(s) {
  return (s.path || "").replace(/\/?SKILL\.md$/i, "");
}
function skillHref(s) {
  return `/skills/${s.owner}/${s.repo}/${skillPath(s)}`;
}
function installCmd(s) {
  return `npx skillforge add ${s.owner}/${s.repo}/${skillPath(s) || s.name}`;
}

function Leaderboard({ onSelect }) {
  const [tab, setTab] = useState("weekly");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/skills/trending?window=${tab}&limit=100`)
      .then((r) => r.json())
      .then((d) => setItems(d.results || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Leaderboard</p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight">Trending skills</h2>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="hot">Hot</TabsTrigger>
            <TabsTrigger value="overall">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardContent className="p-0">
          {loading && <p className="p-8 text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="p-8 text-sm text-muted-foreground">No installs yet — be the first.</p>
          )}
          <ul className="divide-y divide-border/50">
            {items.map((s, i) => (
              <li key={s.id || `${s.owner}-${s.repo}-${i}`}>
                <button type="button" onClick={() => onSelect(s)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]">
                  <span className="w-8 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{s.owner}/{s.repo}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {s.stars ?? 0}</span>
                    <span>{s.downloads ?? 0} installs</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function SkillDialog({ skill, open, onOpenChange }) {
  if (!skill) return null;
  const cmd = installCmd(skill);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/60 bg-popover sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{skill.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {skill.owner}/{skill.repo} · {skill.stars ?? 0}★
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">{skill.description}</p>
        {skill.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((t) => (
              <Badge key={t} variant="gold">{t}</Badge>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-border/60 bg-background/60 p-4">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <Terminal className="h-3 w-3" /> Install
          </div>
          <code className="break-all font-mono text-sm text-primary/90">{cmd}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm">
            <Link href={skillHref(skill)}>Open skill page</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`https://github.com/${skill.owner}/${skill.repo}`} target="_blank" rel="noopener noreferrer">
              Source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TAGS = ["pdf", "xlsx", "api", "browser", "git", "testing"];

export default function HomeClient({ initialTrending = [] }) {
  const tier = useDeviceTier();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [results, setResults] = useState(initialTrending);
  const [totalResults, setTotalResults] = useState(null);
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

  const openSkill = (s) => { setSelected(s); setDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-lg tracking-tight">SkillForge</Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="font-mono text-xs">
              <a href="#browse">Browse</a>
            </Button>
            <Button asChild variant="outline" size="sm" className="font-mono text-xs">
              <a href="https://github.com/Rustys90/skillforge" target="_blank" rel="noopener noreferrer">GitHub</a>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-14">
        <div className="absolute inset-0">
          <HeroScene tier={tier === "checking" ? "mid" : tier} />
        </div>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <Badge variant="gold" className="mb-6 font-mono text-[10px] uppercase tracking-[0.25em]">
            The agent skill registry
          </Badge>
          <h1 className="font-serif text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Find the right <span className="italic text-primary">skill</span> for your agent
          </h1>
          <p className="mt-5 max-w-md text-sm text-muted-foreground">
            Indexed from public GitHub repos. Safety-scanned. Install in one command.
          </p>
          <div className="relative mt-10 w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search skills, pdf, xlsx, api client…"
              className="h-12 border-border/80 bg-background/50 pl-10 font-mono text-sm backdrop-blur focus-visible:ring-primary"
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => setActiveTag((cur) => (cur === tag ? "" : tag))}>
                <Badge
                  variant={activeTag === tag ? "default" : "outline"}
                  className={cn("cursor-pointer font-mono text-[10px] uppercase tracking-wide",
                    activeTag === tag && "bg-primary text-primary-foreground")}
                >{tag}</Badge>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="browse" className="border-t border-border/40 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-light">{query || activeTag ? "Results" : "Featured"}</h2>
            {totalResults != null && (
              <span className="font-mono text-xs text-muted-foreground">{totalResults} total</span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <Card
                key={s.id || `${s.owner}-${s.name}`}
                className="cursor-pointer border-border/50 bg-card/90 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                onClick={() => openSkill(s)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">{s.name}</CardTitle>
                  <CardDescription className="font-mono text-[11px]">{s.owner}/{s.repo}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {s.stars ?? 0}</span>
                    {s.tags?.[0] && <Badge variant="outline">{s.tags[0]}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {results.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No skills match.</p>
          )}
        </div>
      </section>

      <Separator className="opacity-40" />
      <Leaderboard onSelect={openSkill} />

      <footer className="border-t border-border/40 px-6 py-10 text-center">
        <p className="font-mono text-xs text-muted-foreground">SkillForge · agent skills from public GitHub · MIT</p>
      </footer>

      <SkillDialog skill={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
