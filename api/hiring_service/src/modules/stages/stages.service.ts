import { StageDefinitionRow, stagesRepository } from './stages.repository';

export type StageDto = {
  id: string;
  name: string;
  type: 'ai' | 'human';
  stageType: string;
  colorHex: string;
  durationMinutes: number | null;
  instructions: string;
  isEnabled: boolean;
  isSystem: boolean;
  code: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

const defaultColor = (type: 'ai' | 'human'): string =>
  type === 'ai' ? '#0EA5E9' : '#10B981';

const mapRow = (row: StageDefinitionRow): StageDto => {
  const config = row.config ?? {};
  const uiType =
    config.uiType === 'human' || config.uiType === 'ai'
      ? config.uiType
      : row.stage_type === 'human'
        ? 'human'
        : 'ai';

  const colorHex =
    typeof config.colorHex === 'string' && /^#([0-9a-fA-F]{6})$/.test(config.colorHex)
      ? config.colorHex
      : defaultColor(uiType);

  const durationMinutes =
    typeof config.durationMinutes === 'number' ? config.durationMinutes : null;
  const instructions = typeof config.instructions === 'string' ? config.instructions : '';

  return {
    id: row.id,
    name: row.name,
    type: uiType,
    stageType: row.stage_type,
    colorHex,
    durationMinutes,
    instructions,
    isEnabled: row.is_enabled,
    isSystem: row.is_system,
    code: row.code,
    icon: row.icon || 'circle',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

export class StagesService {
  /** Company portal: read-only enabled platform catalog. */
  async listStages(): Promise<{ items: StageDto[] }> {
    const rows = await stagesRepository.listEnabled();
    return { items: rows.map(mapRow) };
  }
}

export const stagesService = new StagesService();
