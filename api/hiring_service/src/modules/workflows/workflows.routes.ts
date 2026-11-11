import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { workflowsController } from './workflows.controller';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  workflowIdParamsSchema,
} from './workflows.schema';

const router = Router();

router.use(requireAuth);

router.get('/', workflowsController.listWorkflows);
router.post(
  '/',
  validateRequest({ body: createWorkflowSchema }),
  workflowsController.createWorkflow
);
router.get(
  '/:workflowId',
  validateRequest({ params: workflowIdParamsSchema }),
  workflowsController.getWorkflow
);
router.patch(
  '/:workflowId',
  validateRequest({ params: workflowIdParamsSchema, body: updateWorkflowSchema }),
  workflowsController.updateWorkflow
);
router.delete(
  '/:workflowId',
  validateRequest({ params: workflowIdParamsSchema }),
  workflowsController.deleteWorkflow
);

export default router;
