import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate-request';
import { scheduleInvitesController } from './schedule-invites.controller';
import {
  scheduleTokenParamsSchema,
  submitScheduleSchema,
} from './schedule-invites.schema';

const router = Router();

// Public candidate schedule endpoints
router.get(
  '/:token',
  validateRequest({ params: scheduleTokenParamsSchema }),
  scheduleInvitesController.getByToken
);

router.post(
  '/:token',
  validateRequest({ params: scheduleTokenParamsSchema, body: submitScheduleSchema }),
  scheduleInvitesController.submit
);

export const scheduleInvitesPublicRouter = router;

export default router;
