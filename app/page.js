// app/page.js
import HomeClient from "./HomeClient.jsx";
import { getTrending } from "../db/queries.js";

// This page depends on live DB data (trending skills) — without this, Next.js
// may statically pre-render it at build time and serve a frozen cached copy
// forever, regardless of later env var or database changes.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "SkillForge — find the right skill for your agent",
  description: "Search and install AI agent skills (SKILL.md files) for Claude, Cursor, and other coding agents. Indexed from public GitHub repos, updated daily.",
  openGraph: {
    title: "SkillForge — the agent skill registry",
    description: "Search and install AI agent skills in one command.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
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
