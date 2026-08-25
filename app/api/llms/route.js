import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-static";

export function GET() {
  let body = "";
  try {
    body = readFileSync(join(process.cwd(), "public", "llms.txt"), "utf8");
  } catch {
    body = "# SkillForge\n\n> Public AI agent skill registry.\n";
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
