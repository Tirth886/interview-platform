-- migrate:up

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  stage_definition_id UUID REFERENCES stage_definitions(id) ON DELETE SET NULL,
  ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_company_id ON workflow_nodes(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_stage_definition_id ON workflow_nodes(stage_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_kind ON workflow_nodes(workflow_id, kind);

CREATE TABLE IF NOT EXISTS workflow_edges (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  source_handle VARCHAR(100),
  target_handle VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_company_id ON workflow_edges(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON workflow_edges(target_node_id);

-- Backfill nodes from workflows.nodes JSONB
DO $$
DECLARE
  wf RECORD;
  node JSONB;
  node_id UUID;
  kind TEXT;
  data JSONB;
  style JSONB;
  position JSONB;
  stage_def_id UUID;
  agent_id UUID;
  order_idx INT;
BEGIN
  FOR wf IN SELECT id, company_id, nodes FROM workflows LOOP
    order_idx := 0;
    IF wf.nodes IS NULL OR jsonb_typeof(wf.nodes) <> 'array' THEN
      CONTINUE;
    END IF;

    FOR node IN SELECT value FROM jsonb_array_elements(wf.nodes) LOOP
      BEGIN
        node_id := NULLIF(node->>'id', '')::UUID;
      EXCEPTION WHEN others THEN
        node_id := NULL;
      END;
      IF node_id IS NULL THEN
        CONTINUE;
      END IF;

      data := COALESCE(node->'data', '{}'::jsonb);
      style := COALESCE(node->'style', '{}'::jsonb);
      position := COALESCE(node->'position', '{}'::jsonb);
      kind := COALESCE(NULLIF(data->>'kind', ''), NULLIF(node->>'type', ''), 'stage');

      stage_def_id := NULL;
      BEGIN
        stage_def_id := NULLIF(COALESCE(data->>'stageDefinitionId', data->>'stageId'), '')::UUID;
      EXCEPTION WHEN others THEN
        stage_def_id := NULL;
      END;

      agent_id := NULL;
      BEGIN
        agent_id := NULLIF(data->>'aiAgentId', '')::UUID;
      EXCEPTION WHEN others THEN
        agent_id := NULL;
      END;

      INSERT INTO workflow_nodes (
        id, company_id, workflow_id, kind, label, stage_definition_id, ai_agent_id,
        position_x, position_y, width, height, config, order_index
      ) VALUES (
        node_id,
        wf.company_id,
        wf.id,
        kind,
        COALESCE(NULLIF(data->>'label', ''), initcap(kind)),
        stage_def_id,
        agent_id,
        COALESCE((position->>'x')::DOUBLE PRECISION, 0),
        COALESCE((position->>'y')::DOUBLE PRECISION, 0),
        NULLIF(style->>'width', '')::DOUBLE PRECISION,
        NULLIF(style->>'height', '')::DOUBLE PRECISION,
        (
          COALESCE(data, '{}'::jsonb)
          - 'kind'
          - 'label'
          - 'stageDefinitionId'
          - 'stageId'
          - 'aiAgentId'
        ),
        order_idx
      )
      ON CONFLICT (id) DO NOTHING;

      order_idx := order_idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Backfill edges from workflows.edges JSONB
DO $$
DECLARE
  wf RECORD;
  edge JSONB;
  edge_id UUID;
  source_id UUID;
  target_id UUID;
BEGIN
  FOR wf IN SELECT id, company_id, edges FROM workflows LOOP
    IF wf.edges IS NULL OR jsonb_typeof(wf.edges) <> 'array' THEN
      CONTINUE;
    END IF;

    FOR edge IN SELECT value FROM jsonb_array_elements(wf.edges) LOOP
      BEGIN
        edge_id := NULLIF(edge->>'id', '')::UUID;
        source_id := NULLIF(edge->>'source', '')::UUID;
        target_id := NULLIF(edge->>'target', '')::UUID;
      EXCEPTION WHEN others THEN
        CONTINUE;
      END;

      IF edge_id IS NULL OR source_id IS NULL OR target_id IS NULL THEN
        CONTINUE;
      END IF;

      -- Skip edges whose endpoints were not backfilled
      IF NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE id = source_id) THEN
        CONTINUE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE id = target_id) THEN
        CONTINUE;
      END IF;

      INSERT INTO workflow_edges (
        id, company_id, workflow_id, source_node_id, target_node_id, source_handle, target_handle
      ) VALUES (
        edge_id,
        wf.company_id,
        wf.id,
        source_id,
        target_id,
        NULLIF(edge->>'sourceHandle', ''),
        NULLIF(edge->>'targetHandle', '')
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- JSON graph columns are no longer the source of truth
ALTER TABLE workflows
  ALTER COLUMN nodes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN edges SET DEFAULT '[]'::jsonb,
  ALTER COLUMN stages SET DEFAULT '[]'::jsonb;

UPDATE workflows
SET
  nodes = '[]'::jsonb,
  edges = '[]'::jsonb,
  stages = '[]'::jsonb;

-- migrate:down

DROP INDEX IF EXISTS idx_workflow_edges_target;
DROP INDEX IF EXISTS idx_workflow_edges_source;
DROP INDEX IF EXISTS idx_workflow_edges_company_id;
DROP INDEX IF EXISTS idx_workflow_edges_workflow_id;
DROP TABLE IF EXISTS workflow_edges;

DROP INDEX IF EXISTS idx_workflow_nodes_kind;
DROP INDEX IF EXISTS idx_workflow_nodes_stage_definition_id;
DROP INDEX IF EXISTS idx_workflow_nodes_company_id;
DROP INDEX IF EXISTS idx_workflow_nodes_workflow_id;
DROP TABLE IF EXISTS workflow_nodes;
