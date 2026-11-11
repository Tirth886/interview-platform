-- migrate:up
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS batch_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_candidates_batch_name ON candidates(batch_name);

-- migrate:down
DROP INDEX IF EXISTS idx_candidates_batch_name;

ALTER TABLE candidates
DROP COLUMN IF EXISTS batch_name;
