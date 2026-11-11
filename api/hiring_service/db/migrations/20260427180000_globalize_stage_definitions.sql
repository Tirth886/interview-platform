-- migrate:up

-- Company-owned stage definitions are removed; catalog is platform-only.
DELETE FROM workflow_stages
WHERE stage_definition_id IN (
  SELECT id FROM stage_definitions WHERE company_id IS NOT NULL
);

DELETE FROM stage_definitions WHERE company_id IS NOT NULL;

ALTER TABLE stage_definitions DROP CONSTRAINT IF EXISTS uq_stage_definitions_company_code;
ALTER TABLE stage_definitions DROP CONSTRAINT IF EXISTS stage_definitions_company_id_fkey;
DROP INDEX IF EXISTS idx_stage_definitions_company_id;

ALTER TABLE stage_definitions DROP COLUMN IF EXISTS company_id;

ALTER TABLE stage_definitions
  ADD COLUMN IF NOT EXISTS icon VARCHAR(64) NOT NULL DEFAULT 'circle';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_stage_definitions_code'
  ) THEN
    ALTER TABLE stage_definitions
      ADD CONSTRAINT uq_stage_definitions_code UNIQUE (code);
  END IF;
END $$;

UPDATE stage_definitions
SET
  is_system = TRUE,
  icon = CASE code
    WHEN 'ats' THEN 'file-search'
    WHEN 'coding_screening' THEN 'code-2'
    WHEN 'system_design' THEN 'network'
    WHEN 'evaluation' THEN 'clipboard-check'
    ELSE COALESCE(NULLIF(icon, ''), 'circle')
  END,
  updated_at = NOW();

INSERT INTO stage_definitions (id, code, name, stage_type, is_enabled, is_system, icon, config)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'ats', 'ATS Screening', 'ats', TRUE, TRUE, 'file-search', '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111102', 'coding_screening', 'Coding Screening', 'coding', TRUE, TRUE, 'code-2', '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111103', 'system_design', 'System Design', 'system_design', TRUE, TRUE, 'network', '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111104', 'evaluation', 'Evaluation', 'evaluation', TRUE, TRUE, 'clipboard-check', '{}'::jsonb)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  stage_type = EXCLUDED.stage_type,
  is_system = TRUE,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- migrate:down

ALTER TABLE stage_definitions DROP CONSTRAINT IF EXISTS uq_stage_definitions_code;

ALTER TABLE stage_definitions DROP COLUMN IF EXISTS icon;

ALTER TABLE stage_definitions
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stage_definitions_company_id ON stage_definitions(company_id);

ALTER TABLE stage_definitions
  ADD CONSTRAINT uq_stage_definitions_company_code UNIQUE (company_id, code);
