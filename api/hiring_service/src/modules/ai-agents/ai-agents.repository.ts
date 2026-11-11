import { PoolClient } from 'pg';
import { db } from '../../providers/database';

export type AiAgentRow = {
  id: string;
  company_id: string;
  name: string;
  context_markdown: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export class AiAgentsRepository {
  async list(companyId: string, client?: PoolClient): Promise<AiAgentRow[]> {
    const result = await (client ?? db).query<AiAgentRow>(
      `SELECT *
       FROM ai_agents
       WHERE company_id = $1
       ORDER BY updated_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findById(
    companyId: string,
    agentId: string,
    client?: PoolClient
  ): Promise<AiAgentRow | null> {
    const result = await (client ?? db).query<AiAgentRow>(
      `SELECT * FROM ai_agents WHERE company_id = $1 AND id = $2 LIMIT 1`,
      [companyId, agentId]
    );
    return result.rows[0] ?? null;
  }

  async create(
    input: {
      companyId: string;
      name: string;
      contextMarkdown: string;
      isEnabled: boolean;
    },
    client?: PoolClient
  ): Promise<AiAgentRow> {
    const result = await (client ?? db).query<AiAgentRow>(
      `INSERT INTO ai_agents (company_id, name, context_markdown, is_enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.companyId, input.name, input.contextMarkdown, input.isEnabled]
    );
    return result.rows[0];
  }

  async update(
    companyId: string,
    agentId: string,
    patch: {
      name?: string;
      contextMarkdown?: string;
      isEnabled?: boolean;
    },
    client?: PoolClient
  ): Promise<AiAgentRow | null> {
    const result = await (client ?? db).query<AiAgentRow>(
      `UPDATE ai_agents
       SET
         name = COALESCE($3, name),
         context_markdown = COALESCE($4, context_markdown),
         is_enabled = COALESCE($5, is_enabled),
         updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING *`,
      [
        companyId,
        agentId,
        patch.name ?? null,
        patch.contextMarkdown ?? null,
        patch.isEnabled ?? null,
      ]
    );
    return result.rows[0] ?? null;
  }

  async delete(companyId: string, agentId: string, client?: PoolClient): Promise<boolean> {
    const result = await (client ?? db).query(
      `DELETE FROM ai_agents WHERE company_id = $1 AND id = $2`,
      [companyId, agentId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const aiAgentsRepository = new AiAgentsRepository();
