#!/usr/bin/env node
// cli/bin/skillforge.js

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";

const API_BASE = process.env.SKILLFORGE_API_URL || "https://skillforge.example.com/api";

const program = new Command();
program.name("skillforge").description("Find and install AI agent skills from the SkillForge registry.").version("0.1.0");

program
  .command("find <query>")
  .description("Search the SkillForge registry")
  .action(async (query) => {
    try {
      const res = await fetch(`${API_BASE}/skills/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const { results } = await res.json();

      if (results.length === 0) {
        console.log("No skills found.");
        return;
      }

      for (const s of results) {
        console.log(`\n${s.name}  (${s.owner}/${s.repo})  \u2605${s.stars}`);
        console.log(`  ${s.description}`);
        console.log(`  install: npx skillforge add ${s.owner}/${s.repo}/${s.path.replace(/\/?SKILL\.md$/, "")}`);
      }
    } catch (err) {
      console.error("Search failed:", err.message);
      process.exit(1);
    }
  });

program
  .command("add <target>")
  .description("Install a skill, e.g. skillforge add owner/repo/path/to/skill")
  .action(async (target) => {
    const parts = target.split("/");
    if (parts.length < 3) {
      console.error("Expected format: owner/repo/skill-path");
      process.exit(1);
    }
    const [owner, repo, ...pathParts] = parts;
    const skillPath = pathParts.join("/");
    const skillName = pathParts[pathParts.length - 1] || repo;

    const destDir = path.join(process.cwd(), ".claude", "skills", skillName);
    if (fs.existsSync(destDir)) {
      console.error(`${destDir} already exists \u2014 remove it first if you want to reinstall.`);
      process.exit(1);
    }

    try {
      const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${skillPath}`;
      const skillMdRes = await fetch(`${rawBase}/SKILL.md`);
      if (!skillMdRes.ok) throw new Error(`Could not fetch SKILL.md (${skillMdRes.status})`);
      const skillMd = await skillMdRes.text();

      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, "SKILL.md"), skillMd);

      console.log(`Installed ${skillName} to ${destDir}`);

      try {
        await fetch(`${API_BASE}/skills/track-install`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ owner, repo, path: `${skillPath}/SKILL.md` }),
        });
      } catch {
        // silently ignore \u2014 tracking is not critical to the install succeeding
      }
    } catch (err) {
      console.error("Install failed:", err.message);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List locally installed skills")
  .action(() => {
    const skillsDir = path.join(process.cwd(), ".claude", "skills");
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
