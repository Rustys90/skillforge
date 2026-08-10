// scripts/import-seed.js
// One-time import of the pre-collected skill archive.
// Usage: DATABASE_URL=... node scripts/import-seed.js
//
// Expects the zip at data/seed/skills-archive.zip — walks the extracted tree
// for any SKILL.md files and upserts them with source: "seed".

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parseSkillContent, hashContent } from "../lib/parse-skill.js";
import { upsertSkill } from "../db/queries.js";

const ZIP_PATH = path.resolve("data/seed/skills-archive.zip");
const EXTRACT_DIR = path.resolve("data/seed/extracted");

function extractZip() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`Seed zip not found at ${ZIP_PATH}. Place it there first.`);
    process.exit(1);
  }
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  console.log("Extracting seed archive...");
  execSync(`unzip -o -q "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
}

function findSkillFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSkillFiles(full, results);
    } else if (entry.name === "SKILL.md") {
      results.push(full);
    }
  }
  return results;
}

function inferProvenance(filePath) {
  const rel = path.relative(EXTRACT_DIR, filePath);
  const parts = rel.split(path.sep);
  const skillDirName = parts[parts.length - 2] || "unknown-skill";
  return {
    owner: "seed-archive",
    repo: skillDirName,
    path: "SKILL.md",
  };
}

async function main() {
  extractZip();
  const files = findSkillFiles(EXTRACT_DIR);
  console.log(`Found ${files.length} SKILL.md files in the archive.`);

  let imported = 0;
  let failed = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const { owner, repo, path: relPath } = inferProvenance(filePath);
      const parsed = parseSkillContent(content, repo);

      await upsertSkill({
        name: parsed.name,
        description: parsed.description,
        has_real_desc: parsed.hasRealDesc,
        owner,
        repo,
        path: relPath,
        stars: 0,
        license_spdx_id: null,
        content_hash: hashContent(content),
        raw_url: null,
        tags: parsed.tags,
        source: "seed",
        repo_updated_at: null,
      });
      imported++;
    } catch (err) {
      failed++;
      console.error(`Failed to import ${filePath}:`, err.message);
    }
  }

  console.log(`\nDone. Imported: ${imported}, Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
