// lib/github.js
// GitHub REST API wrapper. Code search is rate-limited to 10 req/min authenticated —
// this module queues requests and backs off on 403/429 using the real response headers.

const GITHUB_API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN && process.env.NODE_ENV !== "test") {
  console.warn("[github] GITHUB_TOKEN is not set — search API calls will fail or hit anonymous limits.");
}

function headers(extra = {}) {
  return {
    Authorization: TOKEN ? `Bearer ${TOKEN}` : undefined,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...extra,
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with GitHub-aware rate limit backoff.
 * Honors Retry-After and X-RateLimit-Remaining, retries up to 3 times.
 */
async function ghFetch(url, options = {}, attempt = 1) {
  const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });

  if (res.status === 403 || res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    const remaining = res.headers.get("x-ratelimit-remaining");
    const resetAt = res.headers.get("x-ratelimit-reset");

    if (attempt > 3) {
      throw new Error(`GitHub API rate limited after ${attempt} attempts: ${url}`);
    }

    let waitMs;
    if (retryAfter) {
      waitMs = parseInt(retryAfter, 10) * 1000;
    } else if (remaining === "0" && resetAt) {
      waitMs = Math.max(0, parseInt(resetAt, 10) * 1000 - Date.now()) + 1000;
    } else {
      waitMs = 2 ** attempt * 1000;
    }

    console.warn(`[github] rate limited, waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}`);
    await sleep(Math.min(waitMs, 60_000));
    return ghFetch(url, options, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Search for SKILL.md files. GitHub code search caps at 10 req/min authenticated
 * and 1000 results per query — callers should space out calls and split by
 * qualifiers (language, stars) if a single query saturates.
 */
export async function searchSkillFiles({ query: extraQualifiers = "", page = 1, perPage = 30 } = {}) {
  const q = encodeURIComponent(`filename:SKILL.md ${extraQualifiers}`.trim());
  const url = `${GITHUB_API}/search/code?q=${q}&page=${page}&per_page=${perPage}`;
  return ghFetch(url);
}

export async function getFileContent(owner, repo, path) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const data = await ghFetch(url);
  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return data.content;
}

export async function getRepoInfo(owner, repo) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}`;
  const data = await ghFetch(url);
  return {
    stars: data.stargazers_count,
    updatedAt: data.updated_at,
    defaultBranch: data.default_branch,
    license: data.license?.spdx_id || null,
  };
}

/** List sibling files in the same folder as a SKILL.md, for the CLI's `add` command. */
export async function listFolderContents(owner, repo, dirPath) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${dirPath}`;
  const data = await ghFetch(url);
  return Array.isArray(data) ? data : [data];
}

/** Space out calls to respect the 10 req/min code-search limit within one cron run. */
export async function throttle(ms = 6500) {
  await sleep(ms);
}
