"use client";

import dynamic from "next/dynamic";
import "@designcodeio/threeui/style.css";

/**
 * ThreeUI LiquidFormBackground — liquid metal / glass field.
 * Orbis-aligned: deep navy tint + subtle neon. Not a reused page video.
 */
const LiquidFormBackground = dynamic(
  () =>
    import("@designcodeio/threeui/components/LiquidFormBackground").then(
      (m) => m.LiquidFormBackground
    ),
  { ssr: false, loading: () => <div className="hero-cinematic-base absolute inset-0" /> }
);

export default function HeroSpaceBg() {
  return (
    <div className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-cinematic-base" />
      <div className="absolute inset-0 min-h-full min-w-full">
        <LiquidFormBackground
          className="hero-threeui-liquid"
          speed={0.85}
          morph={1.15}
          noiseScale={1.05}
          mouseAmount={0.14}
          metal={1.25}
          camera={5.2}
          tintHue={215}
          tintAmount={0.42}
        />
      </div>
      {/* Soft navy veil + neon edge so type stays readable */}
      <div className="hero-cinematic-grade" />
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "linear-gradient(180deg, rgba(1,8,40,0.45) 0%, rgba(1,8,40,0.15) 42%, rgba(1,8,40,0.7) 100%), radial-gradient(ellipse 70% 45% at 50% 100%, rgba(111,255,0,0.07), transparent 55%)",
        }}
      />
    </div>
  );
}
