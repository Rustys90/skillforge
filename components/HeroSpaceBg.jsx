"use client";

import dynamic from "next/dynamic";
import "@designcodeio/threeui/style.css";

const SylvaLivingWorldScene = dynamic(
  () =>
    import("@designcodeio/threeui/components/SylvaLivingWorldScene").then(
      (m) => m.SylvaLivingWorldScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0" style={{ background: "#0b0710" }} aria-hidden />
    ),
  }
);

export default function HeroSpaceBg() {
  return (
    <div className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 70%, rgba(26,18,36,0.92) 0%, #0b0710 72%)",
        }}
      />
      <div className="absolute inset-0 min-h-full min-w-full">
        <SylvaLivingWorldScene className="hero-sylva-scene" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,7,16,0.55) 0%, rgba(11,7,16,0.22) 38%, rgba(11,7,16,0.75) 100%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(107,255,0,0.08), transparent 55%)",
        }}
      />
    </div>
  );
}
