#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";

const API_BASE = process.env.SKILLFORGE_API_URL || "https://skillforge-jet-chi.vercel.app/api";
const program = new Command();

program
  .name("skillforge")
  .description("Find and install AI agent skills from the SkillForge registry")
  .version("0.1.1");

program
  .command("find")
  .description("Search the registry")
  .argument("<query>", "search query")
  .option("-n, --limit <n>", "max results", "10")
  .action(async (query, opts) => {
    const limit = opts.limit;
    const res = await fetch(`${API_BASE}/skills/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) {
      console.error("Search failed:", res.status);
      process.exit(1);
    }
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) {
      console.log("No skills found.");
      return;
    }
    for (const s of results) {
      console.log(`${s.owner}/${s.repo}/${(s.path || "").replace(/\/?SKILL\.md$/i, "") || s.name}`);
      console.log(`  ${s.description || ""}\n`);
    }
    if (data.total != null) console.log(`(${results.length} of ${data.total})`);
  });

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

program
  .command("add")
  .description("Install a skill into .claude/skills (or --dir)")
  .argument("<target>", "owner/repo/skill-path")
  .option("--dir <path>", "install root", path.join(process.cwd(), ".claude", "skills"))
  .action(async (target, opts) => {
    const parts = target.split("/");
    if (parts.length < 3) {
      console.error("Expected format: owner/repo/skill-path");
      process.exit(1);
    }
    const [owner, repo, ...pathParts] = parts;
    const skillPath = pathParts.join("/").replace(/\/?SKILL\.md$/i, "");
    const skillName = pathParts[pathParts.length - 1] || repo;

    const destDir = path.join(opts.dir, skillName);
    if (fs.existsSync(destDir)) {
      console.error(`${destDir} already exists — remove it first if you want to reinstall.`);
      process.exit(1);
    }

    try {
      const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${skillPath}`;
      const skillMd = await fetchText(`${rawBase}/SKILL.md`);
      if (!skillMd) throw new Error(`Could not fetch SKILL.md`);

      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, "SKILL.md"), skillMd);

      const siblingCandidates = [
        "README.md",
        "package.json",
        "index.js",
        "main.py",
        "requirements.txt",
      ];
      const linkRe = /\]\((?!https?:)([^)#]+)/g;
      let m;
      while ((m = linkRe.exec(skillMd)) !== null) {
        const rel = m[1].replace(/^\.\//, "").trim();
        if (rel && !rel.startsWith("#")) siblingCandidates.push(rel);
      }

      const saved = ["SKILL.md"];
      for (const rel of [...new Set(siblingCandidates)]) {
        if (rel === "SKILL.md" || rel.endsWith("/")) continue;
        const body = await fetchText(`${rawBase}/${rel}`);
        if (!body) continue;
        const out = path.join(destDir, rel);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, body);
        saved.push(rel);
      }

      console.log(`Installed ${skillName} to ${destDir}`);
      console.log(`  files: ${saved.join(", ")}`);

      try {
        await fetch(`${API_BASE}/skills/track-install`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ owner, repo, path: `${skillPath}/SKILL.md` }),
        });
      } catch {
        /* tracking optional */
      }
    } catch (err) {
      console.error("Install failed:", err.message);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List locally installed skills")
  .option("--dir <path>", "install root", path.join(process.cwd(), ".claude", "skills"))
  .action((opts) => {
    const skillsDir = opts.dir;
    if (!fs.existsSync(skillsDir)) {
      console.log("No skills installed yet.");
      return;
    }
    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    if (dirs.length === 0) {
      console.log("No skills installed yet.");
      return;
    }
    for (const d of dirs) console.log(`- ${d.name}`);
  });

program.parse();
