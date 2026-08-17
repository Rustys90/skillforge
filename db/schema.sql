-- SkillForge database schema (Postgres / Supabase)
-- Run this once against your DATABASE_URL before the first crawl or import.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS skills (
  id                BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  has_real_desc     BOOLEAN NOT NULL DEFAULT true,
  owner             TEXT NOT NULL,
  repo              TEXT NOT NULL,
  path              TEXT NOT NULL,
  stars             INTEGER NOT NULL DEFAULT 0,
  license_spdx_id   TEXT,
  content_hash      TEXT NOT NULL,
  duplicate_of      BIGINT REFERENCES skills(id),
  raw_url           TEXT NOT NULL,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  source            TEXT NOT NULL DEFAULT 'crawler',
  downloads         BIGINT NOT NULL DEFAULT 0,
  repo_updated_at   TIMESTAMPTZ,
  indexed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_crawled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector     TSVECTOR,
  UNIQUE (owner, repo, path)
);

CREATE INDEX IF NOT EXISTS idx_skills_search ON skills USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills (stars DESC);
CREATE INDEX IF NOT EXISTS idx_skills_downloads ON skills (downloads DESC);
CREATE INDEX IF NOT EXISTS idx_skills_content_hash ON skills (content_hash);
CREATE INDEX IF NOT EXISTS idx_skills_owner_repo ON skills (owner, repo);

CREATE OR REPLACE FUNCTION skills_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.tags, '{}'), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_skills_search_vector ON skills;
CREATE TRIGGER trg_skills_search_vector
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION skills_search_vector_update();

CREATE TABLE IF NOT EXISTS pending_skills (
  id                BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  has_real_desc     BOOLEAN NOT NULL DEFAULT true,
  owner             TEXT NOT NULL,
  repo              TEXT NOT NULL,
  path              TEXT NOT NULL,
  stars             INTEGER NOT NULL DEFAULT 0,
  license_spdx_id   TEXT,
  content_hash      TEXT NOT NULL,
  raw_url           TEXT NOT NULL,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  source            TEXT NOT NULL DEFAULT 'crawler',
  raw_content       TEXT,
  flag_reasons      TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ,
  UNIQUE (owner, repo, path)
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_skills (status);

CREATE TABLE IF NOT EXISTS crawl_state (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Real install tracking, replacing the old placeholder skills.downloads counter.
-- One row per install event; lets "trending" filter by real time windows
-- (daily/weekly) instead of an all-time static count.
CREATE TABLE IF NOT EXISTS installs (
  id          BIGSERIAL PRIMARY KEY,
  skill_id    BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installs_skill_id ON installs (skill_id);
CREATE INDEX IF NOT EXISTS idx_installs_created_at ON installs (created_at DESC);
