-- migrate:up

-- Refresh existing platform type labels/icons
UPDATE stage_definitions
SET
  name = CASE code
    WHEN 'ats' THEN 'ATS'
    WHEN 'coding_screening' THEN 'Coding'
    WHEN 'system_design' THEN 'System Design'
    WHEN 'evaluation' THEN 'Evaluation'
    ELSE name
  END,
  icon = CASE code
    WHEN 'ats' THEN 'file-search'
    WHEN 'coding_screening' THEN 'code-2'
    WHEN 'system_design' THEN 'network'
    WHEN 'evaluation' THEN 'clipboard-check'
    ELSE icon
  END,
  is_system = TRUE,
  is_enabled = TRUE,
  updated_at = NOW()
WHERE code IN ('ats', 'coding_screening', 'system_design', 'evaluation');

-- Add missing type catalog rows (avoid fixed UUIDs that may already exist)
INSERT INTO stage_definitions (code, name, stage_type, is_enabled, is_system, icon, config)
SELECT v.code, v.name, v.stage_type, TRUE, TRUE, v.icon, '{}'::jsonb
FROM (
  VALUES
    ('screening', 'Screening', 'screening', 'search'),
    ('dsa', 'DSA', 'dsa', 'binary'),
    ('other', 'Other', 'other', 'circle')
) AS v(code, name, stage_type, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM stage_definitions sd WHERE sd.code = v.code
);

ALTER TABLE workflow_stages
  ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS code VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS conductor VARCHAR(20) NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL;

ALTER TABLE workflow_stages
  DROP CONSTRAINT IF EXISTS chk_workflow_stages_conductor;

ALTER TABLE workflow_stages
  ADD CONSTRAINT chk_workflow_stages_conductor
  CHECK (conductor IN ('ai', 'human'));

-- Backfill name/code from linked stage definition
UPDATE workflow_stages ws
SET
  name = CASE
    WHEN NULLIF(TRIM(ws.name), '') IS NOT NULL THEN ws.name
    WHEN NULLIF(TRIM(COALESCE(ws.config->>'label', '')), '') IS NOT NULL THEN TRIM(ws.config->>'label')
    ELSE sd.name
  END,
  code = CASE
    WHEN NULLIF(TRIM(ws.code), '') IS NOT NULL THEN ws.code
    WHEN NULLIF(TRIM(COALESCE(ws.config->>'stageCode', '')), '') IS NOT NULL THEN TRIM(ws.config->>'stageCode')
    ELSE sd.code || '_' || REPLACE(SUBSTRING(ws.id::text, 1, 8), '-', '')
  END,
  conductor = CASE
    WHEN LOWER(COALESCE(ws.config->>'stageType', ws.config->>'conductor', '')) = 'human' THEN 'human'
    ELSE 'ai'
  END,
  ai_agent_id = COALESCE(
    ws.ai_agent_id,
    CASE
      WHEN COALESCE(ws.config->>'aiAgentId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN (ws.config->>'aiAgentId')::uuid
      ELSE NULL
    END
  ),
  config = (
    COALESCE(ws.config, '{}'::jsonb)
    - 'label'
    - 'stageCode'
    - 'stageType'
    - 'conductor'
    - 'aiAgentId'
    - 'stageDefinitionId'
    - 'stageId'
    - 'icon'
    - 'kind'
  ),
  updated_at = NOW()
FROM stage_definitions sd
WHERE sd.id = ws.stage_definition_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_stages_workflow_code
  ON workflow_stages (workflow_id, code);

CREATE INDEX IF NOT EXISTS idx_workflow_stages_ai_agent_id
  ON workflow_stages (ai_agent_id);

-- migrate:down

DROP INDEX IF EXISTS idx_workflow_stages_ai_agent_id;
DROP INDEX IF EXISTS uq_workflow_stages_workflow_code;

ALTER TABLE workflow_stages
  DROP CONSTRAINT IF EXISTS chk_workflow_stages_conductor;

ALTER TABLE workflow_stages
  DROP COLUMN IF EXISTS ai_agent_id,
  DROP COLUMN IF EXISTS conductor,
  DROP COLUMN IF EXISTS code,
  DROP COLUMN IF EXISTS name;

DELETE FROM stage_definitions
WHERE code IN ('screening', 'dsa', 'other');
