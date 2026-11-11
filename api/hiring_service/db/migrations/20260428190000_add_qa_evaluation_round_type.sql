-- migrate:up
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS chk_interviews_round_type;
ALTER TABLE interviews
  ADD CONSTRAINT chk_interviews_round_type
  CHECK (round_type IN ('ai-interview', 'coding', 'human-interview', 'qa-evaluation'));

ALTER TABLE interview_schedule_invites DROP CONSTRAINT IF EXISTS chk_schedule_invites_round_type;
ALTER TABLE interview_schedule_invites
  ADD CONSTRAINT chk_schedule_invites_round_type
  CHECK (round_type IN ('ai-interview', 'coding', 'human-interview', 'qa-evaluation'));

-- migrate:down
ALTER TABLE interview_schedule_invites DROP CONSTRAINT IF EXISTS chk_schedule_invites_round_type;
ALTER TABLE interview_schedule_invites
  ADD CONSTRAINT chk_schedule_invites_round_type
  CHECK (round_type IN ('ai-interview', 'coding', 'human-interview'));

ALTER TABLE interviews DROP CONSTRAINT IF EXISTS chk_interviews_round_type;
ALTER TABLE interviews
  ADD CONSTRAINT chk_interviews_round_type
  CHECK (round_type IN ('ai-interview', 'coding', 'human-interview'));
