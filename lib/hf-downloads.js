/**
 * Map SkillForge agent skills → Hugging Face model IDs when a real Hub model exists.
 * Agent SKILL.md packages are usually GitHub-only; only show HF downloads when mapped.
 */

/** Explicit skill-name → HF model id */
const NAME_MAP = {
  "openai-whisper": "openai/whisper-large-v3",
  whisper: "openai/whisper-large-v3",
  "whisper-base": "openai/whisper-base",
  "whisper-tiny": "openai/whisper-tiny",
  "whisper-small": "openai/whisper-small",
  "whisper-medium": "openai/whisper-medium",
  "whisper-large": "openai/whisper-large-v3",
  llama: "meta-llama/Llama-3.2-1B",
  "llama-3": "meta-llama/Llama-3.2-1B",
  "llama-3.2": "meta-llama/Llama-3.2-1B",
  bert: "google-bert/bert-base-uncased",
  "bert-base": "google-bert/bert-base-uncased",
  gpt2: "openai-community/gpt2",
  "gpt-2": "openai-community/gpt2",
  clip: "openai/clip-vit-base-patch32",
  "stable-diffusion": "stabilityai/stable-diffusion-xl-base-1.0",
  sdxl: "stabilityai/stable-diffusion-xl-base-1.0",
  "sentence-transformers": "sentence-transformers/all-MiniLM-L6-v2",
  minilm: "sentence-transformers/all-MiniLM-L6-v2",
  t5: "google-t5/t5-base",
  whispercpp: "openai/whisper-large-v3",
};

/**
 * Resolve a candidate Hugging Face model id for a skill, or null.
 * @param {{ name?: string, owner?: string, repo?: string, path?: string }} skill
 */
export function resolveHfModelId(skill) {
  if (!skill) return null;
  const name = String(skill.name || "")
    .toLowerCase()
    .trim();
  if (!name) return null;

  if (NAME_MAP[name]) return NAME_MAP[name];

  // Fuzzy: skill name contains a known key
  for (const [key, modelId] of Object.entries(NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) return modelId;
  }

  // owner/name as model id (e.g. openai/whisper-*) — only when name looks model-like
  const owner = String(skill.owner || "").toLowerCase();
  if (
    owner &&
    name &&
    /^(openai|meta-llama|google|facebook|microsoft|stabilityai|huggingface)$/i.test(owner)
  ) {
    return `${skill.owner}/${skill.name}`;
  }

  return null;
}

/**
 * Fetch public Hub model metadata (downloads, likes).
 * Uses unauthenticated Hub API; gated models may still return download counts.
 * @returns {Promise<{ modelId: string, downloads: number, likes: number } | null>}
 */
export async function fetchHfDownloads(modelId) {
  if (!modelId || !modelId.includes("/")) return null;
  const [namespace, ...rest] = modelId.split("/");
  const repo = rest.join("/");
  if (!namespace || !repo) return null;

  const url = `https://huggingface.co/api/models/${encodeURIComponent(namespace)}/${encodeURIComponent(repo)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const downloads = Number(data.downloads ?? data.downloadsAllTime ?? 0);
    const likes = Number(data.likes ?? 0);
    if (!Number.isFinite(downloads)) return null;
    return {
      modelId: data.id || modelId,
      downloads,
      likes,
      url: `https://huggingface.co/${data.id || modelId}`,
    };
  } catch {
    return null;
  }
}

/**
 * Attach hf_* fields onto a skill object when a mapping exists.
 */
export async function enrichSkillWithHf(skill) {
  if (!skill) return skill;
  const modelId = resolveHfModelId(skill);
  if (!modelId) return skill;
  const hf = await fetchHfDownloads(modelId);
  if (!hf) return { ...skill, hf_model_id: modelId, hf_downloads: null };
  return {
    ...skill,
    hf_model_id: hf.modelId,
    hf_downloads: hf.downloads,
    hf_likes: hf.likes,
    hf_url: hf.url,
  };
}
