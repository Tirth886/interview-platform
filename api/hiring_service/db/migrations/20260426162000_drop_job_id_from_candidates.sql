-- migrate:up
DROP INDEX IF EXISTS idx_candidates_job_id;

ALTER TABLE
    candidates DROP COLUMN IF EXISTS job_id;

-- migrate:down
ALTER TABLE
    candidates
ADD
    COLUMN job_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);