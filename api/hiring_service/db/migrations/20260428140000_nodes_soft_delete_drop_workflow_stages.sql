-- migrate:up

-- Promote stage fields onto workflow_nodes; soft-delete via is_delete
ALTER TABLE workflow_nodes
  ADD COLUMN IF NOT EXISTS code VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS conductor VARCHAR(20) NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_delete BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE workflow_nodes
  DROP CONSTRAINT IF EXISTS chk_workflow_nodes_conductor;

ALTER TABLE workflow_nodes
  ADD CONSTRAINT chk_workflow_nodes_conductor
  CHECK (conductor IN ('ai', 'human'));

-- Backfill from linked workflow_stages (if present)
UPDATE workflow_nodes wn
SET
  code = CASE
    WHEN NULLIF(TRIM(wn.code), '') IS NOT NULL THEN wn.code
    WHEN NULLIF(TRIM(ws.code), '') IS NOT NULL THEN ws.code
    WHEN NULLIF(TRIM(COALESCE(wn.config->>'stageCode', '')), '') IS NOT NULL THEN TRIM(wn.config->>'stageCode')
    ELSE ''
  END,
  conductor = CASE
    WHEN LOWER(COALESCE(ws.conductor, wn.config->>'stageType', wn.config->>'conductor', '')) = 'human'
      THEN 'human'
    ELSE 'ai'
  END,
  ai_agent_id = COALESCE(wn.ai_agent_id, ws.ai_agent_id),
  stage_definition_id = COALESCE(wn.stage_definition_id, ws.stage_definition_id),
  label = CASE
    WHEN NULLIF(TRIM(wn.label), '') IS NOT NULL THEN wn.label
    WHEN NULLIF(TRIM(ws.name), '') IS NOT NULL THEN ws.name
    ELSE wn.label
  END,
  is_enabled = COALESCE(ws.is_enabled, wn.is_enabled, TRUE),
  config = (
    COALESCE(wn.config, '{}'::jsonb)
    - 'label'
    - 'stageCode'
    - 'stageType'
    - 'conductor'
    - 'aiAgentId'
    - 'stageDefinitionId'
    - 'stageId'
    - 'kind'
  ),
  updated_at = NOW()
FROM workflow_stages ws
WHERE ws.node_id IS NOT NULL
  AND ws.node_id::text = wn.id::text
  AND ws.workflow_id::text = wn.workflow_id::text;

-- Fill missing codes for active stage-like nodes from label
UPDATE workflow_nodes
SET
  code = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(label), '[^a-zA-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g')),
  updated_at = NOW()
WHERE is_delete = FALSE
  AND kind IN ('stage', 'atsCheck')
  AND NULLIF(TRIM(code), '') IS NULL
  AND NULLIF(TRIM(label), '') IS NOT NULL;

-- Deduplicate codes within a workflow for active nodes
WITH ranked AS (
  SELECT
    id,
    workflow_id,
    code,
    ROW_NUMBER() OVER (PARTITION BY workflow_id, code ORDER BY order_index, created_at, id) AS rn
  FROM workflow_nodes
  WHERE is_delete = FALSE
    AND NULLIF(TRIM(code), '') IS NOT NULL
)
UPDATE workflow_nodes wn
SET code = ranked.code || '_' || ranked.rn,
    updated_at = NOW()
FROM ranked
WHERE wn.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_nodes_workflow_code_active
  ON workflow_nodes (workflow_id, code)
  WHERE is_delete = FALSE AND code <> '';

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_is_delete
  ON workflow_nodes (workflow_id, is_delete);

-- Edges: soft-delete flag (hard FK to nodes remains; deleted nodes keep history)
ALTER TABLE workflow_edges
  ADD COLUMN IF NOT EXISTS is_delete BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_workflow_edges_is_delete
  ON workflow_edges (workflow_id, is_delete);

-- workflow_stages is redundant; nodes are source of truth
DROP TABLE IF EXISTS workflow_stages;

-- migrate:down

CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  stage_definition_id UUID NOT NULL REFERENCES stage_definitions(id),
  node_id VARCHAR(100),
  order_index INT NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  name VARCHAR(255) NOT NULL DEFAULT '',
  code VARCHAR(100) NOT NULL DEFAULT '',
  conductor VARCHAR(20) NOT NULL DEFAULT 'ai',
  ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_workflow_stages_conductor CHECK (conductor IN ('ai', 'human'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow_id ON workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_company_id ON workflow_stages(company_id);

INSERT INTO workflow_stages (
  company_id, workflow_id, stage_definition_id, name, code, conductor, ai_agent_id,
  node_id, order_index, is_enabled, config
)
SELECT
  company_id,
  workflow_id::text,
  stage_definition_id,
  label,
  code,
  conductor,
  ai_agent_id,
  id::text,
  order_index,
  is_enabled,
  config
FROM workflow_nodes
WHERE kind IN ('stage', 'atsCheck')
  AND is_delete = FALSE
  AND stage_definition_id IS NOT NULL;

DROP INDEX IF EXISTS idx_workflow_edges_is_delete;
ALTER TABLE workflow_edges DROP COLUMN IF EXISTS is_delete;

DROP INDEX IF EXISTS idx_workflow_nodes_is_delete;
DROP INDEX IF EXISTS uq_workflow_nodes_workflow_code_active;

ALTER TABLE workflow_nodes
  DROP CONSTRAINT IF EXISTS chk_workflow_nodes_conductor;

ALTER TABLE workflow_nodes
  DROP COLUMN IF EXISTS is_delete,
  DROP COLUMN IF EXISTS is_enabled,
  DROP COLUMN IF EXISTS conductor,
  DROP COLUMN IF EXISTS code;
