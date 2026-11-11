import { PoolClient } from 'pg';
import { db } from '../../providers/database';

export type StageDefinitionRow = {
  id: string;
  code: string;
  name: string;
  stage_type: string;
  is_enabled: boolean;
  is_system: boolean;
  icon: string;
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export class StagesRepository {
  /** Platform catalog — no company ownership. */
  async listEnabled(client?: PoolClient): Promise<StageDefinitionRow[]> {
    const result = await (client ?? db).query<StageDefinitionRow>(
      `SELECT *
       FROM stage_definitions
       WHERE is_enabled = TRUE
       ORDER BY name ASC`
    );
    return result.rows;
  }

  async listAll(client?: PoolClient): Promise<StageDefinitionRow[]> {
    const result = await (client ?? db).query<StageDefinitionRow>(
      `SELECT *
       FROM stage_definitions
       ORDER BY name ASC`
    );
    return result.rows;
  }

  async findById(stageId: string, client?: PoolClient): Promise<StageDefinitionRow | null> {
    const result = await (client ?? db).query<StageDefinitionRow>(
      `SELECT * FROM stage_definitions WHERE id = $1 LIMIT 1`,
      [stageId]
    );
    return result.rows[0] ?? null;
  }

  async findByCode(code: string, client?: PoolClient): Promise<StageDefinitionRow | null> {
    const result = await (client ?? db).query<StageDefinitionRow>(
      `SELECT * FROM stage_definitions WHERE code = $1 LIMIT 1`,
      [code]
    );
    return result.rows[0] ?? null;
  }
}

export const stagesRepository = new StagesRepository();
