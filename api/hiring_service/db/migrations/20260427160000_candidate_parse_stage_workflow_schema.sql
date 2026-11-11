-- migrate:up

-- Stage catalog (enable/disable from DB)
CREATE TABLE IF NOT EXISTS stage_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  stage_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_stage_definitions_company_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_stage_definitions_company_id ON stage_definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_stage_definitions_enabled ON stage_definitions(is_enabled);

-- Seed platform-default stages (company_id NULL)
INSERT INTO stage_definitions (id, company_id, code, name, stage_type, is_enabled, is_system, config)
VALUES
  ('11111111-1111-1111-1111-111111111101', NULL, 'ats', 'ATS Screening', 'ats', TRUE, TRUE, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111102', NULL, 'coding_screening', 'Coding Screening', 'coding', TRUE, TRUE, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111103', NULL, 'system_design', 'System Design', 'system_design', TRUE, TRUE, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111104', NULL, 'evaluation', 'Evaluation', 'evaluation', TRUE, TRUE, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Stages belonging to a workflow (order + per-workflow enable)
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  stage_definition_id UUID NOT NULL REFERENCES stage_definitions(id),
  node_id VARCHAR(100),
  order_index INT NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow_id ON workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_company_id ON workflow_stages(company_id);

-- Candidate ↔ workflow applications (history; no duplicate person per workflow)
CREATE TABLE IF NOT EXISTS candidate_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  batch_name VARCHAR(255),
  current_stage_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resume_url TEXT NOT NULL DEFAULT '',
  latest_parse_id UUID,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_candidate_workflows_candidate_workflow UNIQUE (candidate_id, workflow_id),
  CONSTRAINT chk_candidate_workflows_status CHECK (
    status IN ('pending', 'active', 'hold', 'rejected', 'selected')
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_workflows_candidate_id ON candidate_workflows(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_workflows_workflow_id ON candidate_workflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_candidate_workflows_company_id ON candidate_workflows(company_id);

-- Resume parse history (source of truth for structured parse + URLs)
CREATE TABLE IF NOT EXISTS candidate_resume_parses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100),
  resume_key TEXT,
  resume_url TEXT,
  file_name TEXT,
  parser_version VARCHAR(50) NOT NULL DEFAULT 'resume_parser@1',
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  error_message TEXT,
  personal_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  professional_summary TEXT,
  total_experience VARCHAR(100),
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  internships JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_candidate_resume_parses_status CHECK (
    status IN ('pending', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_resume_parses_candidate_id
  ON candidate_resume_parses(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_resume_parses_company_id
  ON candidate_resume_parses(company_id);

-- Stage attempts (ATS, coding, system design, evaluation, …)
CREATE TABLE IF NOT EXISTS candidate_stage_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  candidate_workflow_id UUID REFERENCES candidate_workflows(id) ON DELETE SET NULL,
  workflow_stage_id VARCHAR(100),
  stage_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  score INT,
  max_score INT NOT NULL DEFAULT 100,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  resume_parse_id UUID REFERENCES candidate_resume_parses(id) ON DELETE SET NULL,
  jd_key TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  evaluated_by VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_candidate_stage_attempts_status CHECK (
    status IN ('pending', 'in_progress', 'passed', 'failed', 'skipped', 'completed')
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_stage_attempts_candidate_workflow
  ON candidate_stage_attempts(candidate_id, workflow_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_attempts_stage_type
  ON candidate_stage_attempts(workflow_id, stage_type);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_attempts_candidate_created
  ON candidate_stage_attempts(candidate_id, created_at DESC);

-- Sparse extras (notice period, CTC, etc.)
CREATE TABLE IF NOT EXISTS candidate_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  meta_key VARCHAR(100) NOT NULL,
  meta_value TEXT,
  value_type VARCHAR(20) NOT NULL DEFAULT 'string',
  source VARCHAR(40) NOT NULL DEFAULT 'manual',
  parse_id UUID REFERENCES candidate_resume_parses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_candidate_metadata_key UNIQUE (candidate_id, meta_key)
);

CREATE INDEX IF NOT EXISTS idx_candidate_metadata_candidate_id ON candidate_metadata(candidate_id);

-- Pointers on candidates (keep row lean; parse/ATS history elsewhere)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS latest_parse_id UUID REFERENCES candidate_resume_parses(id) ON DELETE SET NULL;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS latest_ats_attempt_id UUID REFERENCES candidate_stage_attempts(id) ON DELETE SET NULL;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS latest_ats_score INT;

-- Backfill candidate_workflows from existing candidates that have a workflow
INSERT INTO candidate_workflows (
  company_id,
  candidate_id,
  workflow_id,
  batch_name,
  current_stage_id,
  status,
  resume_url,
  applied_at,
  updated_at
)
SELECT
  c.company_id,
  c.id,
  c.workflow_id,
  c.batch_name,
  c.current_stage_id,
  c.status,
  COALESCE(c.resume_url, ''),
  c.applied_at,
  c.updated_at
FROM candidates c
WHERE c.workflow_id IS NOT NULL
ON CONFLICT (candidate_id, workflow_id) DO NOTHING;

-- migrate:down
ALTER TABLE candidates DROP COLUMN IF EXISTS latest_ats_score;
ALTER TABLE candidates DROP COLUMN IF EXISTS latest_ats_attempt_id;
ALTER TABLE candidates DROP COLUMN IF EXISTS latest_parse_id;

DROP TABLE IF EXISTS candidate_metadata;
DROP TABLE IF EXISTS candidate_stage_attempts;
DROP TABLE IF EXISTS candidate_resume_parses;
DROP TABLE IF EXISTS candidate_workflows;
DROP TABLE IF EXISTS workflow_stages;
DROP TABLE IF EXISTS stage_definitions;
