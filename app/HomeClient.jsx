"use client";
// app/HomeClient.jsx
// Ports the approved demo design, wired to real API routes instead of sample data.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FONT = {
  display: { fontFamily: "'Fraunces', Georgia, serif" },
  mono: { fontFamily: "'JetBrains Mono', ui-monospace, monospace" },
  body: { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" },
};

function useDeviceTier() {
  // Always load the full Three.js hero on every device
  return "high";
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

function StaticFallback() {
  return (
    <div className="absolute inset-0" style={{
      background: "radial-gradient(ellipse at 50% 40%, rgba(201,169,97,0.14), transparent 60%), radial-gradient(circle at 20% 80%, rgba(201,169,97,0.06), transparent 50%)",
    }} />
  );
}

const TABS = [
  { key: "overall", label: "Overall" },
  { key: "hot", label: "Hot" },
  { key: "weekly", label: "Weekly" },
  { key: "daily", label: "Daily" },
];
const PAGE_SIZE = 10;

function Leaderboard({ onSelect }) {
  const [tab, setTab] = useState("weekly");
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/skills/trending?window=${tab}&limit=100`)
      .then((r) => r.json())
      .then((d) => setItems(d.results || []))
      .finally(() => setLoading(false));
    setVisible(PAGE_SIZE);
  }, [tab]);

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <section className="relative px-6 md:px-12 py-28 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-12">
        <div>
          <span style={FONT.mono} className="text-[11px] uppercase tracking-[0.3em] text-[#c9a961]">Ranked</span>
          <h2 style={FONT.display} className="text-4xl md:text-5xl text-[#f5f3ee] font-light mt-2">The leaderboard</h2>
        </div>
      </div>

      <div className="flex gap-8 mb-10 border-b border-[#2a2825]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={FONT.mono}
            className={`pb-4 text-xs uppercase tracking-[0.15em] transition-colors relative ${
              tab === t.key ? "text-[#c9a961]" : "text-[#6b6860] hover:text-[#a8a49a]"
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-px bg-[#c9a961]" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={FONT.mono} className="text-center py-16 text-[#6b6860] text-xs uppercase tracking-widest">Loading</div>
      ) : (
        <>
          <ol className="divide-y divide-[#1c1b19]">
            {shown.map((s, i) => (
              <li key={s.id} onClick={() => onSelect(s)} className="flex items-center gap-6 py-6 group cursor-pointer">
                <span style={FONT.display} className={`w-12 shrink-0 text-right font-light text-2xl ${i < 3 ? "text-[#c9a961]" : "text-[#4a4740]"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={FONT.body} className="text-lg text-[#f5f3ee] truncate">{s.name}</div>
                  <div style={FONT.mono} className="text-[12px] text-[#8a8579] truncate mt-1">{s.owner}/{s.repo}</div>
                </div>
                <span style={FONT.mono} className="text-xs text-[#8a8579] shrink-0 hidden sm:block">
                  {(s.downloads || 0).toLocaleString()} installs
                </span>
              </li>
            ))}
          </ol>
          <div className="pt-12 text-center">
            {hasMore ? (
              <button
                onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, items.length))}
                style={FONT.mono}
                className="text-xs uppercase tracking-[0.2em] text-[#c9a961] border border-[#c9a961]/40 rounded-full px-8 py-3 hover:bg-[#c9a961]/10 transition-colors"
              >
                Load more
              </button>
            ) : (
              <span style={FONT.mono} className="text-[11px] tracking-widest text-[#4a4740] uppercase">End of index</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function SkillModal({ skill, onClose }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!skill) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [skill, onClose]);

  if (!skill) return null;
  const skillPath = (skill.path || "").replace(/\/?SKILL\.md$/, "");
  const installCmd = `npx skillforge add ${skill.owner}/${skill.repo}/${skillPath || skill.name}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = installCmd; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-8" onClick={onClose}>
      <div
        className="relative bg-[#141310] border border-[#2a2825] rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
        <div className="p-7 md:p-9">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <div style={FONT.display} className="text-2xl text-[#f5f3ee] font-light truncate">{skill.name}</div>
              <div style={FONT.mono} className="text-[11px] text-[#6b6860] mt-2 truncate">{skill.owner} / {skill.repo}</div>
            </div>
            <button onClick={onClose} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-[#2a2825] text-[#6b6860] hover:text-[#f5f3ee] hover:border-[#c9a961] transition-all">✕</button>
          </div>

          {!skill.has_real_desc && (
            <span style={FONT.mono} className="inline-block text-[10px] px-2.5 py-1 rounded-full border border-[#c9a961]/40 text-[#c9a961] uppercase tracking-wide mb-4">
              description generated
            </span>
          )}
          <p style={FONT.body} className="text-[15px] text-[#c9c5bc] leading-relaxed mb-8 font-light">{skill.description}</p>

          <div className="rounded-xl border border-[#2a2825] bg-[#0f0e0c] p-6">
            <div style={FONT.mono} className="text-[10px] uppercase tracking-[0.25em] text-[#c9a961] mb-5">Installation</div>
            <div className="flex flex-col gap-2 bg-black/40 border border-[#2a2825] rounded-lg px-4 py-3 mb-2">
              <code style={FONT.mono} className="text-[13px] text-[#e8d5a0] break-all leading-relaxed">{installCmd}</code>
              <button
                onClick={copy}
                style={FONT.mono}
                className={`self-start text-[11px] px-3 py-2 rounded-md transition-colors border ${copied ? "bg-[#c9a961]/10 border-[#c9a961] text-[#c9a961]" : "border-[#2a2825] text-[#c9c5bc] hover:border-[#c9a961]"}`}
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <a href={`/skills/${skill.owner}/${skill.repo}/${(skill.path || "").replace(/\/?SKILL\.md$/i, "")}`}
             style={FONT.mono} className="inline-flex items-center gap-1.5 mt-7 mr-4 text-[11px] text-[#c9a961] hover:text-[#e8d5a0] transition-colors uppercase tracking-wide">
          Open skill page →
        </a>
        <a href={`https://github.com/${skill.owner}/${skill.repo}`} target="_blank" rel="noopener noreferrer"
             style={FONT.mono} className="inline-flex items-center gap-1.5 mt-7 text-[11px] text-[#6b6860] hover:text-[#c9a961] transition-colors uppercase tracking-wide">
            View source repository →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({ initialTrending = [] }) {
  const tier = useDeviceTier();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [totalResults, setTotalResults] = useState(null);
  const [results, setResults] = useState(initialTrending);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const url = query.trim()
        ? `/api/skills/search?q=${encodeURIComponent(query)}${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`
        : activeTag
          ? `/api/skills/search?tag=${encodeURIComponent(activeTag)}&limit=20`
          : "/api/skills/trending?limit=6";
      fetch(url).then((r) => r.json()).then((d) => { setResults(d.results || []); setTotalResults(d.total ?? null); });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, activeTag]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f5f3ee]" style={FONT.body}>
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-6 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <span style={FONT.display} className="text-lg tracking-tight text-[#f5f3ee]">SkillForge</span>
      </nav>

      <section className="relative h-screen min-h-[640px] overflow-hidden" style={{ position: "relative", minHeight: "640px", height: "100vh", overflow: "hidden" }}>
        <HeroScene tier="high" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0b]" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <span style={FONT.mono} className="text-[11px] uppercase tracking-[0.4em] text-[#c9a961] mb-6">The agent skill registry</span>
          <h1 style={FONT.display} className="text-6xl md:text-8xl font-light leading-[0.95] tracking-tight max-w-4xl">
            Find the right<br /><span className="italic">skill</span> for your agent
          </h1>
          <div className="mt-12 w-full max-w-lg">
            <div className="flex items-center gap-3 border-b border-[#3a372f] pb-4 focus-within:border-[#c9a961] transition-colors">
              <span style={FONT.mono} className="text-[#6b6860] text-sm">/</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search skills, pdf, xlsx, api client..."
                style={FONT.mono}
                className="bg-transparent outline-none flex-1 text-sm placeholder:text-[#5a574f] text-[#f5f3ee]"
              />
            
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["pdf", "xlsx", "api", "browser", "git", "testing"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((cur) => (cur === tag ? "" : tag))}
                  style={FONT.mono}
                  className={`text-[10px] uppercase tracking-wide px-3 py-1 rounded-full border transition-colors ${
                    activeTag === tag
                      ? "border-[#c9a961] text-[#c9a961] bg-[#c9a961]/10"
                      : "border-[#2a2825] text-[#6b6860] hover:border-[#c9a961]/40 hover:text-[#a8a49a]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
</div>
          </div>
        </div>
      </section>

      <Leaderboard onSelect={setSelectedSkill} />

      <section className="relative px-6 md:px-12 py-28 max-w-6xl mx-auto border-t border-[#1c1b19]">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span style={FONT.mono} className="text-[11px] uppercase tracking-[0.3em] text-[#c9a961]">{query ? "Search" : "Featured"}</span>
            <h2 style={FONT.display} className="text-4xl md:text-5xl font-light mt-2">{query ? `"${query}"` : "Trending now"}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1c1b19]">
          {results.map((s, i) => (
            <div key={s.id} onClick={() => setSelectedSkill(s)} className="bg-[#0c0c0e] p-8 border border-white/5 hover:border-[#c9a961]/30 transition-all cursor-pointer group rounded-xl">
              <div className="flex items-start justify-between mb-7">
                <span style={FONT.mono} className="text-[11px] text-[#4a4740] tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                <span style={FONT.mono} className="text-xs text-[#c9a961]">{s.stars}★</span>
              </div>
              <div style={FONT.display} className="text-3xl font-light mb-2 group-hover:text-[#e8d5a0] transition-colors">{s.name}</div>
              <div style={FONT.mono} className="text-xs text-[#8a8579] mb-6">{s.owner}/{s.repo}</div>
              <p style={FONT.body} className="text-[15px] text-[#a8a49a] leading-relaxed font-light mb-7">{s.description}</p>
            </div>
          ))}
          {results.length === 0 && (
            <div style={FONT.mono} className="md:col-span-2 bg-[#0a0a0b] text-center py-20 text-[#6b6860] text-sm">No skills match. Try a different query.</div>
          )}
        </div>
      </section>

      <footer style={FONT.mono} className="border-t border-[#1c1b19] px-6 md:px-12 py-10 text-center text-[11px] text-[#4a4740] tracking-wide">
        SkillForge — indexed from public GitHub repositories
      </footer>

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
