import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../middlewares/response';
import {
  AgentIdParamsInput,
  CreateAiAgentInput,
  UpdateAiAgentInput,
} from './ai-agents.schema';
import { aiAgentsService } from './ai-agents.service';

export class AiAgentsController {
  listAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await aiAgentsService.listAgents(req.auth!.companyId);
      sendSuccess(res, 'AI agents fetched', result);
    } catch (error) {
      next(error);
    }
  };

  createAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateAiAgentInput;
      const result = await aiAgentsService.createAgent(req.auth!.companyId, body);
      sendSuccess(res, 'AI agent created', result, 201);
    } catch (error) {
      next(error);
    }
  };

  updateAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as AgentIdParamsInput;
      const body = req.body as UpdateAiAgentInput;
      const result = await aiAgentsService.updateAgent(
        req.auth!.companyId,
        params.agentId,
        body
      );
      sendSuccess(res, 'AI agent updated', result);
    } catch (error) {
      next(error);
    }
  };

  deleteAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as unknown as AgentIdParamsInput;
      await aiAgentsService.deleteAgent(req.auth!.companyId, params.agentId);
      sendSuccess(res, 'AI agent deleted', { ok: true });
    } catch (error) {
      next(error);
    }
  };
}

export const aiAgentsController = new AiAgentsController();
