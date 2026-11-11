-- migrate:up
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS current_job_title VARCHAR(255);

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS current_stage_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_candidates_current_stage_id ON candidates(current_stage_id);

-- migrate:down
DROP INDEX IF EXISTS idx_candidates_current_stage_id;

ALTER TABLE candidates
DROP COLUMN IF EXISTS current_stage_id;

ALTER TABLE candidates
DROP COLUMN IF EXISTS current_job_title;
