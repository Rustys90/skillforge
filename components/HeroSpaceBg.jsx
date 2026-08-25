"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematic Orbis-style hero background.
 * Uses a dark abstract motion clip (not the cherry footage) + deep navy/neon grade.
 * CSS base always shows so mobile never looks blank while video buffers.
 */
const HERO_CLIP =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_125119_8e5ae31c-0021-4396-bc08-f7aebeb877a2.mp4";

export default function HeroSpaceBg() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData;
    const slow = /2g|slow-2g/.test(navigator.connection?.effectiveType || "");
    if (reduce || saveData || slow) {
      setFailed(true);
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      v.play().catch(() => {
        /* autoplay blocked — poster grade still shows */
      });
    };

    v.addEventListener("loadeddata", () => {
      setReady(true);
      tryPlay();
    });
    v.addEventListener("error", () => setFailed(true));

    // Kick load
    v.load();
    tryPlay();
  }, []);

  return (
    <div className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      {/* Rich static base — always visible first impression */}
      <div className="hero-cinematic-base" />

      {!failed && (
        <video
          ref={videoRef}
          className={`hero-cinematic-video ${ready ? "is-ready" : ""}`}
          src={HERO_CLIP}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
      )}

      {/* Orbis liquid-glass grade */}
      <div className="hero-cinematic-grade" />
    </div>
  );
}
