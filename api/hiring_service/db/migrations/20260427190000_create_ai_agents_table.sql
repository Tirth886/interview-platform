-- migrate:up
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  context_markdown TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ai_agents_company_name UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_company_id ON ai_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_company_enabled ON ai_agents(company_id, is_enabled);

-- migrate:down
DROP INDEX IF EXISTS idx_ai_agents_company_enabled;
DROP INDEX IF EXISTS idx_ai_agents_company_id;
DROP TABLE IF EXISTS ai_agents;
