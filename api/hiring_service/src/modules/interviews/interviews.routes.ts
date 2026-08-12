import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { interviewsController } from './interviews.controller';
import {
  createInterviewSchema,
  interviewIdParamsSchema,
  interviewSessionParamsSchema,
  listInterviewsQuerySchema,
  rescheduleInterviewSchema,
  sessionValidationQuerySchema,
  updateInterviewStatusSchema,
} from './interviews.schema';

const router = Router();

// Public endpoints - no auth required
router.get('/by-email', interviewsController.listInterviewsByEmail);
router.get(
  '/session/:sessionId',
  validateRequest({ params: interviewSessionParamsSchema, query: sessionValidationQuerySchema }),
  interviewsController.validateInterviewSession
);

router.patch(
  '/session/:sessionId/join',
  validateRequest({ params: interviewSessionParamsSchema, query: sessionValidationQuerySchema }),
  interviewsController.joinInterviewSession
);

router.use(requireAuth);

router.get(
  '/',
  validateRequest({ query: listInterviewsQuerySchema }),
  interviewsController.listInterviews
);
router.post(
  '/',
  validateRequest({ body: createInterviewSchema }),
  interviewsController.createInterview
);
router.patch(
  '/:interviewId/reschedule',
  validateRequest({ params: interviewIdParamsSchema, body: rescheduleInterviewSchema }),
  interviewsController.rescheduleInterview
);
router.patch(
  '/:interviewId/cancel',
  validateRequest({ params: interviewIdParamsSchema }),
  interviewsController.cancelInterview
);
router.patch(
  '/:interviewId/status',
  validateRequest({ params: interviewIdParamsSchema, body: updateInterviewStatusSchema }),
  interviewsController.updateInterviewStatus
);
router.get(
  '/:interviewId',
  validateRequest({ params: interviewIdParamsSchema }),
  interviewsController.getInterviewById
);

export default router;
