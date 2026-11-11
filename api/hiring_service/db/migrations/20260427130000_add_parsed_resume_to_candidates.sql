-- migrate:up
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS parsed_resume JSONB;

-- migrate:down
ALTER TABLE candidates
DROP COLUMN IF EXISTS parsed_resume;
