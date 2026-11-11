import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { CreateAiAgentInput, UpdateAiAgentInput } from './ai-agents.schema';
import { AiAgentRow, aiAgentsRepository } from './ai-agents.repository';

export type AiAgentDto = {
  id: string;
  name: string;
  contextMarkdown: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: AiAgentRow): AiAgentDto => ({
  id: row.id,
  name: row.name,
  contextMarkdown: row.context_markdown,
  isEnabled: row.is_enabled,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export class AiAgentsService {
  async listAgents(companyId: string): Promise<{ items: AiAgentDto[] }> {
    const rows = await aiAgentsRepository.list(companyId);
    return { items: rows.map(mapRow) };
  }

  async createAgent(
    companyId: string,
    payload: CreateAiAgentInput
  ): Promise<{ agent: AiAgentDto }> {
    try {
      const row = await aiAgentsRepository.create({
        companyId,
        name: payload.name.trim(),
        contextMarkdown: payload.contextMarkdown ?? '',
        isEnabled: payload.isEnabled ?? true,
      });
      return { agent: mapRow(row) };
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : 'Unable to create AI agent.'
      );
    }
  }

  async updateAgent(
    companyId: string,
    agentId: string,
    payload: UpdateAiAgentInput
  ): Promise<{ agent: AiAgentDto }> {
    const existing = await aiAgentsRepository.findById(companyId, agentId);
    if (!existing) {
      throw new NotFoundError('AI agent not found');
    }

    if (payload.name !== undefined && !payload.name.trim()) {
      throw new ValidationError('Agent name is required.');
    }

    try {
      const row = await aiAgentsRepository.update(companyId, agentId, {
        name: payload.name?.trim(),
        contextMarkdown: payload.contextMarkdown,
        isEnabled: payload.isEnabled,
      });
      if (!row) {
        throw new NotFoundError('AI agent not found');
      }
      return { agent: mapRow(row) };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        error instanceof Error ? error.message : 'Unable to update AI agent.'
      );
    }
  }

  async deleteAgent(companyId: string, agentId: string): Promise<void> {
    const deleted = await aiAgentsRepository.delete(companyId, agentId);
    if (!deleted) {
      throw new NotFoundError('AI agent not found');
    }
  }
}

export const aiAgentsService = new AiAgentsService();
