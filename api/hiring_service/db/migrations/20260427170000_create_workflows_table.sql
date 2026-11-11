-- migrate:up
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation_id VARCHAR(100) NOT NULL DEFAULT '',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  job_description_file_name TEXT NOT NULL DEFAULT '',
  job_description_url TEXT NOT NULL DEFAULT '',
  job_description_key TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_company_name ON workflows(company_id, name);

-- migrate:down
DROP INDEX IF EXISTS idx_workflows_company_name;
DROP INDEX IF EXISTS idx_workflows_company_id;
DROP TABLE IF EXISTS workflows;
