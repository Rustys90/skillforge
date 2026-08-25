"use client";

import { useEffect, useRef, useState } from "react";

/** Cherry / Orbis hero clip — optimized load + pause when offscreen for smooth scroll */
const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_115329_5e00c9c5-4d69-49b7-94c3-9c31c60bb644.mp4";

export default function HeroSpaceBg() {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [showVideo, setShowVideo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData;
    const slow = /2g|slow-2g/.test(navigator.connection?.effectiveType || "");
    if (reduce || saveData || slow) return;

    // Defer video mount so first paint + scroll stay light
    const boot = window.setTimeout(() => setShowVideo(true), 280);
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap || !showVideo) return;

    const tryPlay = () => {
      v.play().catch(() => {});
    };

    const onReady = () => {
      setReady(true);
      tryPlay();
    };
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("canplay", onReady);

    // Pause when scrolled away — biggest scroll smoothness win
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.12) {
          tryPlay();
        } else {
          v.pause();
        }
      },
      { threshold: [0, 0.12, 0.35], rootMargin: "40px 0px" }
    );
    io.observe(wrap);

    return () => {
      io.disconnect();
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("canplay", onReady);
      v.pause();
    };
  }, [showVideo]);

  return (
    <div ref={wrapRef} className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      {/* Instant paint — no blank frame */}
      <div className="hero-cinematic-base" />

      {showVideo && (
        <video
          ref={videoRef}
          className={`hero-cherry-video ${ready ? "is-ready" : ""}`}
          src={HERO_VIDEO}
          muted
          loop
          playsInline
          preload="metadata"
          // @ts-expect-error webkit
          webkit-playsinline="true"
        />
      )}

      <div className="hero-cherry-grade" />
    </div>
  );
}
