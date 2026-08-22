import HomeClient from "./HomeClient.jsx";
import { getTrending } from "../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SkillForge — find the right skill for your agent",
  description:
    "Search and install AI agent skills (SKILL.md) for Claude, Cursor, and coding agents. Indexed from public GitHub, safety-scanned, updated daily.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillForge — the agent skill registry",
    description: "Search and install AI agent skills in one command.",
    url: SITE_URL,
    type: "website",
    siteName: "SkillForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge — the agent skill registry",
    description: "Search and install AI agent skills in one command.",
  },
};

export default async function Page() {
  let initialTrending = [];
  try {
    initialTrending = await getTrending({ limit: 6 });
  } catch (err) {
    console.error("[page] initial trending fetch failed:", err.message);
  }

  return <HomeClient initialTrending={initialTrending} />;
}
