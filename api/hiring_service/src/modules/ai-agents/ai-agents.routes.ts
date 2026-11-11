import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { aiAgentsController } from './ai-agents.controller';
import {
  agentIdParamsSchema,
  createAiAgentSchema,
  updateAiAgentSchema,
} from './ai-agents.schema';

const router = Router();

router.use(requireAuth);

router.get('/', aiAgentsController.listAgents);
router.post(
  '/',
  validateRequest({ body: createAiAgentSchema }),
  aiAgentsController.createAgent
);
router.patch(
  '/:agentId',
  validateRequest({ params: agentIdParamsSchema, body: updateAiAgentSchema }),
  aiAgentsController.updateAgent
);
router.delete(
  '/:agentId',
  validateRequest({ params: agentIdParamsSchema }),
  aiAgentsController.deleteAgent
);

export default router;