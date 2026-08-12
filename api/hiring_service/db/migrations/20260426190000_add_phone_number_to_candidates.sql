-- migrate:up
ALTER TABLE
    candidates
ADD
    COLUMN phone_number VARCHAR(30);

CREATE INDEX idx_candidates_phone_number ON candidates(phone_number);

-- migrate:down
DROP INDEX IF EXISTS idx_candidates_phone_number;

ALTER TABLE
    candidates DROP COLUMN IF EXISTS phone_number;