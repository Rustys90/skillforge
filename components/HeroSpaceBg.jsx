"use client";

import { useEffect, useRef } from "react";

/**
 * Unique Orbis hero — liquid aurora + particle field (not a page video reuse).
 * Canvas 2D so it works everywhere; dense, cinematic, neon-accented.
 */
export default function HeroSpaceBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let t0 = performance.now();

    const stars = [];
    const ribbons = [];

    const resize = () => {
      const parent = canvas.parentElement;
      w = Math.max(parent?.clientWidth || 0, window.innerWidth || 360);
      h = Math.max(parent?.clientHeight || 0, window.innerHeight || 640);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars.length = 0;
      const n = reduce ? 80 : 180;
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.3,
          a: Math.random() * 0.7 + 0.25,
          s: Math.random() * 0.35 + 0.05,
          neon: Math.random() > 0.82,
        });
      }

      ribbons.length = 0;
      for (let i = 0; i < (reduce ? 3 : 5); i++) {
        ribbons.push({
          y: h * (0.15 + i * 0.16),
          amp: 28 + i * 12,
          freq: 0.004 + i * 0.0012,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + i * 0.00015,
          color:
            i % 2 === 0
              ? "rgba(40, 100, 220, 0.14)"
              : "rgba(111, 255, 0, 0.08)",
        });
      }
    };

    const draw = (now) => {
      const t = (now - t0) / 1000;
      // Deep space base
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#020b2e");
      g.addColorStop(0.45, "#010828");
      g.addColorStop(1, "#00040f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Soft nebula orbs
      const orbs = [
        { x: w * 0.2, y: h * 0.25, r: w * 0.35, c: "rgba(30, 80, 200, 0.22)" },
        { x: w * 0.8, y: h * 0.55, r: w * 0.3, c: "rgba(20, 60, 160, 0.18)" },
        { x: w * 0.55, y: h * 0.15, r: w * 0.22, c: "rgba(111, 255, 0, 0.05)" },
      ];
      for (const o of orbs) {
        const og = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        og.addColorStop(0, o.c);
        og.addColorStop(1, "transparent");
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Liquid ribbons
      if (!reduce) {
        for (const rb of ribbons) {
          ctx.beginPath();
          ctx.moveTo(0, rb.y);
          for (let x = 0; x <= w; x += 8) {
            const y =
              rb.y +
              Math.sin(x * rb.freq + t * rb.speed * 60 + rb.phase) * rb.amp +
              Math.sin(x * rb.freq * 2.1 - t * 0.4) * (rb.amp * 0.35);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fillStyle = rb.color;
          ctx.fill();
        }
      }

      // Stars / neon sparks
      for (const s of stars) {
        if (!reduce) {
          s.y += s.s;
          if (s.y > h + 4) {
            s.y = -4;
            s.x = Math.random() * w;
          }
        }
        ctx.beginPath();
        ctx.fillStyle = s.neon
          ? `rgba(111, 255, 0, ${s.a})`
          : `rgba(239, 244, 255, ${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vignette
      const vg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        h * 0.15,
        w * 0.5,
        h * 0.5,
        h * 0.85
      );
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(1, 8, 40, 0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-cinematic-base" />
      <canvas ref={canvasRef} className="hero-canvas-field" />
      <div className="hero-cinematic-grade" />
    </div>
  );
}
