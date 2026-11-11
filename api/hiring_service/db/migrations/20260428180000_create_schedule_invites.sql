-- migrate:up
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS chk_interviews_round_type;
ALTER TABLE interviews
  ADD CONSTRAINT chk_interviews_round_type
  CHECK (round_type IN ('ai-interview', 'coding', 'human-interview'));

CREATE TABLE IF NOT EXISTS interview_schedule_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  workflow_node_id UUID REFERENCES workflow_nodes(id) ON DELETE SET NULL,
  stage_label VARCHAR(255) NOT NULL,
  stage_description TEXT NOT NULL DEFAULT '',
  round_type VARCHAR(30) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  scheduled_start_at TIMESTAMPTZ,
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_invites_status CHECK (
    status IN ('pending', 'scheduled', 'expired', 'cancelled')
  ),
  CONSTRAINT chk_schedule_invites_round_type CHECK (
    round_type IN ('ai-interview', 'coding', 'human-interview')
  ),
  CONSTRAINT chk_schedule_invites_duration CHECK (duration_minutes >= 15)
);

CREATE INDEX IF NOT EXISTS idx_schedule_invites_token
  ON interview_schedule_invites(token);

CREATE INDEX IF NOT EXISTS idx_schedule_invites_company_id
  ON interview_schedule_invites(company_id);

CREATE INDEX IF NOT EXISTS idx_schedule_invites_candidate_id
  ON interview_schedule_invites(candidate_id);

CREATE INDEX IF NOT EXISTS idx_schedule_invites_status
  ON interview_schedule_invites(status);

-- migrate:down
DROP INDEX IF EXISTS idx_schedule_invites_status;
DROP INDEX IF EXISTS idx_schedule_invites_candidate_id;
DROP INDEX IF EXISTS idx_schedule_invites_company_id;
DROP INDEX IF EXISTS idx_schedule_invites_token;
DROP TABLE IF EXISTS interview_schedule_invites;

ALTER TABLE interviews DROP CONSTRAINT IF EXISTS chk_interviews_round_type;
ALTER TABLE interviews
  ADD CONSTRAINT chk_interviews_round_type
  CHECK (round_type IN ('ai-interview', 'coding'));
