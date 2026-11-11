import { PoolClient } from 'pg';
import { db } from '../../providers/database';

export type WorkflowRow = {
  id: string;
  company_id: string;
  name: string;
  designation_id: string;
  job_description_file_name: string;
  job_description_url: string;
  job_description_key: string;
  created_at: Date;
  updated_at: Date;
};

export type WorkflowNodeRow = {
  id: string;
  company_id: string;
  workflow_id: string;
  kind: string;
  label: string;
  stage_definition_id: string | null;
  ai_agent_id: string | null;
  qa_bank_id: string | null;
  code: string;
  conductor: string;
  is_enabled: boolean;
  is_delete: boolean;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
  config: Record<string, unknown>;
  order_index: number;
  created_at: Date;
  updated_at: Date;
};

export type WorkflowEdgeRow = {
  id: string;
  company_id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string | null;
  target_handle: string | null;
  is_delete: boolean;
};

export type WorkflowNodeInsert = {
  id: string;
  kind: string;
  label: string;
  stageDefinitionId?: string | null;
  aiAgentId?: string | null;
  qaBankId?: string | null;
  code?: string;
  conductor?: 'ai' | 'human' | 'qa';
  isEnabled?: boolean;
  positionX: number;
  positionY: number;
  width?: number | null;
  height?: number | null;
  config?: Record<string, unknown>;
  orderIndex: number;
};

export type WorkflowEdgeInsert = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type WorkflowInsertInput = {
  companyId: string;
  name: string;
  designationId: string;
  jobDescriptionFileName: string;
  jobDescriptionUrl: string;
  jobDescriptionKey: string;
};

export class WorkflowsRepository {
  async list(companyId: string): Promise<WorkflowRow[]> {
    const result = await db.query<WorkflowRow>(
      `SELECT
         id, company_id, name, designation_id,
         job_description_file_name, job_description_url, job_description_key,
         created_at, updated_at
       FROM workflows
       WHERE company_id = $1
       ORDER BY updated_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findById(
    companyId: string,
    workflowId: string,
    client?: PoolClient
  ): Promise<WorkflowRow | null> {
    const result = await (client ?? db).query<WorkflowRow>(
      `SELECT
         id, company_id, name, designation_id,
         job_description_file_name, job_description_url, job_description_key,
         created_at, updated_at
       FROM workflows
       WHERE company_id = $1 AND id = $2
       LIMIT 1`,
      [companyId, workflowId]
    );
    return result.rows[0] ?? null;
  }

  async create(input: WorkflowInsertInput, client?: PoolClient): Promise<WorkflowRow> {
    const result = await (client ?? db).query<WorkflowRow>(
      `INSERT INTO workflows (
        company_id, name, designation_id,
        job_description_file_name, job_description_url, job_description_key
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING
        id, company_id, name, designation_id,
        job_description_file_name, job_description_url, job_description_key,
        created_at, updated_at`,
      [
        input.companyId,
        input.name,
        input.designationId,
        input.jobDescriptionFileName,
        input.jobDescriptionUrl,
        input.jobDescriptionKey,
      ]
    );
    return result.rows[0];
  }

  async update(
    companyId: string,
    workflowId: string,
    patch: Partial<{
      name: string;
      designationId: string;
      jobDescriptionFileName: string;
      jobDescriptionUrl: string;
      jobDescriptionKey: string;
    }>,
    client?: PoolClient
  ): Promise<WorkflowRow | null> {
    const result = await (client ?? db).query<WorkflowRow>(
      `UPDATE workflows
       SET
         name = COALESCE($3, name),
         designation_id = COALESCE($4, designation_id),
         job_description_file_name = COALESCE($5, job_description_file_name),
         job_description_url = COALESCE($6, job_description_url),
         job_description_key = COALESCE($7, job_description_key),
         updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING
         id, company_id, name, designation_id,
         job_description_file_name, job_description_url, job_description_key,
         created_at, updated_at`,
      [
        companyId,
        workflowId,
        patch.name ?? null,
        patch.designationId ?? null,
        patch.jobDescriptionFileName ?? null,
        patch.jobDescriptionUrl ?? null,
        patch.jobDescriptionKey ?? null,
      ]
    );
    return result.rows[0] ?? null;
  }

  async delete(companyId: string, workflowId: string, client?: PoolClient): Promise<boolean> {
    const result = await (client ?? db).query(
      `DELETE FROM workflows WHERE company_id = $1 AND id = $2`,
      [companyId, workflowId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listNodes(
    companyId: string,
    workflowId: string,
    client?: PoolClient
  ): Promise<WorkflowNodeRow[]> {
    const result = await (client ?? db).query<WorkflowNodeRow>(
      `SELECT *
       FROM workflow_nodes
       WHERE company_id = $1 AND workflow_id = $2 AND is_delete = FALSE
       ORDER BY order_index ASC, created_at ASC`,
      [companyId, workflowId]
    );
    return result.rows;
  }

  async listEdges(
    companyId: string,
    workflowId: string,
    client?: PoolClient
  ): Promise<WorkflowEdgeRow[]> {
    const result = await (client ?? db).query<WorkflowEdgeRow>(
      `SELECT *
       FROM workflow_edges
       WHERE company_id = $1 AND workflow_id = $2 AND is_delete = FALSE
       ORDER BY created_at ASC`,
      [companyId, workflowId]
    );
    return result.rows;
  }

  /**
   * Soft-delete sync: upsert active nodes, mark missing nodes/edges as deleted.
   * Does not hard-delete node rows.
   */
  async replaceGraph(
    companyId: string,
    workflowId: string,
    nodes: WorkflowNodeInsert[],
    edges: WorkflowEdgeInsert[],
    client?: PoolClient
  ): Promise<void> {
    const exec = client ?? db;
    const activeIds = nodes.map((node) => node.id);

    // Soft-delete nodes removed from the canvas
    if (activeIds.length === 0) {
      await exec.query(
        `UPDATE workflow_nodes
         SET is_delete = TRUE, updated_at = NOW()
         WHERE company_id = $1 AND workflow_id = $2 AND is_delete = FALSE`,
        [companyId, workflowId]
      );
    } else {
      await exec.query(
        `UPDATE workflow_nodes
         SET is_delete = TRUE, updated_at = NOW()
         WHERE company_id = $1 AND workflow_id = $2 AND is_delete = FALSE
           AND NOT (id = ANY($3::uuid[]))`,
        [companyId, workflowId, activeIds]
      );
    }

    for (const node of nodes) {
      await exec.query(
        `INSERT INTO workflow_nodes (
          id, company_id, workflow_id, kind, label, stage_definition_id, ai_agent_id, qa_bank_id,
          code, conductor, is_enabled, is_delete,
          position_x, position_y, width, height, config, order_index
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,$12,$13,$14,$15,$16::jsonb,$17
        )
        ON CONFLICT (id) DO UPDATE SET
          company_id = EXCLUDED.company_id,
          workflow_id = EXCLUDED.workflow_id,
          kind = EXCLUDED.kind,
          label = EXCLUDED.label,
          stage_definition_id = EXCLUDED.stage_definition_id,
          ai_agent_id = EXCLUDED.ai_agent_id,
          qa_bank_id = EXCLUDED.qa_bank_id,
          code = EXCLUDED.code,
          conductor = EXCLUDED.conductor,
          is_enabled = EXCLUDED.is_enabled,
          is_delete = FALSE,
          position_x = EXCLUDED.position_x,
          position_y = EXCLUDED.position_y,
          width = EXCLUDED.width,
          height = EXCLUDED.height,
          config = EXCLUDED.config,
          order_index = EXCLUDED.order_index,
          updated_at = NOW()`,
        [
          node.id,
          companyId,
          workflowId,
          node.kind,
          node.label,
          node.stageDefinitionId ?? null,
          node.aiAgentId ?? null,
          node.qaBankId ?? null,
          node.code ?? '',
          node.conductor ?? 'ai',
          node.isEnabled ?? true,
          node.positionX,
          node.positionY,
          node.width ?? null,
          node.height ?? null,
          JSON.stringify(node.config ?? {}),
          node.orderIndex,
        ]
      );
    }

    // Soft-delete all current edges, then upsert active ones
    await exec.query(
      `UPDATE workflow_edges
       SET is_delete = TRUE, updated_at = NOW()
       WHERE company_id = $1 AND workflow_id = $2 AND is_delete = FALSE`,
      [companyId, workflowId]
    );

    for (const edge of edges) {
      await exec.query(
        `INSERT INTO workflow_edges (
          id, company_id, workflow_id, source_node_id, target_node_id,
          source_handle, target_handle, is_delete
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)
        ON CONFLICT (id) DO UPDATE SET
          company_id = EXCLUDED.company_id,
          workflow_id = EXCLUDED.workflow_id,
          source_node_id = EXCLUDED.source_node_id,
          target_node_id = EXCLUDED.target_node_id,
          source_handle = EXCLUDED.source_handle,
          target_handle = EXCLUDED.target_handle,
          is_delete = FALSE,
          updated_at = NOW()`,
        [
          edge.id,
          companyId,
          workflowId,
          edge.sourceNodeId,
          edge.targetNodeId,
          edge.sourceHandle ?? null,
          edge.targetHandle ?? null,
        ]
      );
    }
  }
}

export const workflowsRepository = new WorkflowsRepository();
