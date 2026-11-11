import { Router } from 'express';
import aiAgentsRoutes from '../modules/ai-agents/ai-agents.routes';
import authRoutes from '../modules/auth/auth.routes';
import candidatesRoutes from '../modules/candidates/candidates.routes';
import interviewsRoutes from '../modules/interviews/interviews.routes';
import qaRoutes from '../modules/qa/qa.routes';
import { scheduleInvitesPublicRouter } from '../modules/schedule-invites/schedule-invites.routes';
import stagesRoutes from '../modules/stages/stages.routes';
import uploadsRoutes from '../modules/uploads/uploads.routes';
import workflowsRoutes from '../modules/workflows/workflows.routes';

const router = Router();

// Feature routes
router.use('/auth', authRoutes);
router.use('/ai-agents', aiAgentsRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/schedule-invites', scheduleInvitesPublicRouter);
router.use('/interviews', interviewsRoutes);
router.use('/qa-banks', qaRoutes);
router.use('/stages', stagesRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/uploads', uploadsRoutes);

export default router;
