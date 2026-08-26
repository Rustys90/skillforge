"use client";

import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";

export default function SkillPageActions({ installCmd, shareUrl, skillName }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: skillName, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={copy} className="pressable inline-flex items-center gap-2 rounded-full bg-neon px-5 py-2.5 font-grotesk text-sm uppercase tracking-wide text-space">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy install"}
      </button>
      <button type="button" onClick={share} className="pressable liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs uppercase text-cream">
        <Share2 className="h-3.5 w-3.5" />
        {shared ? "Link copied" : "Share"}
      </button>
    </div>
  );
}
