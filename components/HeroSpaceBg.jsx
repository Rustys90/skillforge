"use client";

import dynamic from "next/dynamic";
import "@designcodeio/threeui/style.css";

/**
 * ThreeUI WarpFieldBackground — hyperspace variant.
 * Distinct from LiquidForm; dark tunnel / streak field for registry energy.
 */
const WarpFieldBackground = dynamic(
  () =>
    import("@designcodeio/threeui/components/WarpFieldBackground").then(
      (m) => m.WarpFieldBackground
    ),
  {
    ssr: false,
    loading: () => <div className="hero-cinematic-base absolute inset-0" />,
  }
);

export default function HeroSpaceBg() {
  return (
    <div className="hero-space-bg absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-cinematic-base" />
      <div className="absolute inset-0 min-h-full min-w-full">
        <WarpFieldBackground
          className="hero-threeui-warp"
          variant="hyperspace"
          speed={0.9}
          streakOpacity={0.85}
          tileOpacity={0.35}
          fov={70}
          brightness={0.95}
          hue={205}
          saturation={1.15}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "linear-gradient(180deg, rgba(1,8,40,0.5) 0%, rgba(1,8,40,0.18) 40%, rgba(1,8,40,0.78) 100%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(111,255,0,0.06), transparent 55%)",
        }}
      />
    </div>
  );
}
