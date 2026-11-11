-- migrate:up
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_candidates_workflow_id ON candidates(workflow_id);

-- migrate:down
DROP INDEX IF EXISTS idx_candidates_workflow_id;

ALTER TABLE candidates
DROP COLUMN IF EXISTS workflow_id;
