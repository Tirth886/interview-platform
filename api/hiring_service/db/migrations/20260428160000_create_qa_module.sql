-- migrate:up

CREATE TABLE IF NOT EXISTS qa_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_banks_company_id ON qa_banks (company_id);
CREATE INDEX IF NOT EXISTS idx_qa_banks_company_active
  ON qa_banks (company_id)
  WHERE is_delete = FALSE;

CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  qa_bank_id UUID NOT NULL REFERENCES qa_banks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL DEFAULT '',
  is_code_view BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INT NOT NULL DEFAULT 0,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_questions_bank_id ON qa_questions (qa_bank_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_bank_active
  ON qa_questions (qa_bank_id)
  WHERE is_delete = FALSE;

CREATE TABLE IF NOT EXISTS qa_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL DEFAULT '',
  is_code_view BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INT NOT NULL DEFAULT 0,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_options_question_id ON qa_options (question_id);
CREATE INDEX IF NOT EXISTS idx_qa_options_question_active
  ON qa_options (question_id)
  WHERE is_delete = FALSE;

-- Workflow stage can be conducted by Q&A bank
ALTER TABLE workflow_nodes
  ADD COLUMN IF NOT EXISTS qa_bank_id UUID REFERENCES qa_banks(id) ON DELETE SET NULL;

ALTER TABLE workflow_nodes
  DROP CONSTRAINT IF EXISTS chk_workflow_nodes_conductor;

ALTER TABLE workflow_nodes
  ADD CONSTRAINT chk_workflow_nodes_conductor
  CHECK (conductor IN ('ai', 'human', 'qa'));

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_qa_bank_id
  ON workflow_nodes (qa_bank_id);

-- migrate:down

DROP INDEX IF EXISTS idx_workflow_nodes_qa_bank_id;

ALTER TABLE workflow_nodes
  DROP CONSTRAINT IF EXISTS chk_workflow_nodes_conductor;

ALTER TABLE workflow_nodes
  ADD CONSTRAINT chk_workflow_nodes_conductor
  CHECK (conductor IN ('ai', 'human'));

ALTER TABLE workflow_nodes
  DROP COLUMN IF EXISTS qa_bank_id;

DROP INDEX IF EXISTS idx_qa_options_question_active;
DROP INDEX IF EXISTS idx_qa_options_question_id;
DROP TABLE IF EXISTS qa_options;

DROP INDEX IF EXISTS idx_qa_questions_bank_active;
DROP INDEX IF EXISTS idx_qa_questions_bank_id;
DROP TABLE IF EXISTS qa_questions;

DROP INDEX IF EXISTS idx_qa_banks_company_active;
DROP INDEX IF EXISTS idx_qa_banks_company_id;
DROP TABLE IF EXISTS qa_banks;
