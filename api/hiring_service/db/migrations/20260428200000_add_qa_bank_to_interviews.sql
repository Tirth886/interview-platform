-- migrate:up
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS qa_bank_id UUID REFERENCES qa_banks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interviews_qa_bank_id ON interviews(qa_bank_id);

-- migrate:down
DROP INDEX IF EXISTS idx_interviews_qa_bank_id;
ALTER TABLE interviews DROP COLUMN IF EXISTS qa_bank_id;
