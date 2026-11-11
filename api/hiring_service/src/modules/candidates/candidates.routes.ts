import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { requireInternalToken } from '../../middlewares/require-internal-token';
import { validateRequest } from '../../middlewares/validate-request';
import { candidatesController } from './candidates.controller';
import { scheduleInvitesController } from '../schedule-invites/schedule-invites.controller';
import {
  createScheduleInviteSchema,
} from '../schedule-invites/schedule-invites.schema';
import {
  addCandidateNoteSchema,
  applyParseResultSchema,
  batchCreateCandidatesSchema,
  candidateIdParamsSchema,
  candidateImportSchema,
  createCandidateSchema,
  listCandidatesQuerySchema,
  updateCandidateStageSchema,
  updateCandidateStatusSchema,
} from './candidates.schema';

const router = Router();

// Internal callback from resume_parser (RabbitMQ worker) — no user JWT
router.post(
  '/:candidateId/parse-result',
  requireInternalToken,
  validateRequest({ params: candidateIdParamsSchema, body: applyParseResultSchema }),
  candidatesController.applyParseResult
);

router.use(requireAuth);

router.get(
  '/',
  validateRequest({ query: listCandidatesQuerySchema }),
  candidatesController.listCandidates
);
router.post(
  '/',
  validateRequest({ body: createCandidateSchema }),
  candidatesController.createCandidate
);
router.post(
  '/batch',
  validateRequest({ body: batchCreateCandidatesSchema }),
  candidatesController.batchCreateCandidates
);
router.post(
  '/import',
  validateRequest({ body: candidateImportSchema }),
  candidatesController.importCandidates
);
router.get(
  '/:candidateId',
  validateRequest({ params: candidateIdParamsSchema }),
  candidatesController.getCandidateById
);
router.patch(
  '/:candidateId/status',
  validateRequest({ params: candidateIdParamsSchema, body: updateCandidateStatusSchema }),
  candidatesController.updateCandidateStatus
);
router.patch(
  '/:candidateId/stage',
  validateRequest({ params: candidateIdParamsSchema, body: updateCandidateStageSchema }),
  candidatesController.updateCandidateStage
);
router.post(
  '/:candidateId/notes',
  validateRequest({ params: candidateIdParamsSchema, body: addCandidateNoteSchema }),
  candidatesController.addCandidateNote
);
router.post(
  '/:candidateId/run-automation',
  validateRequest({ params: candidateIdParamsSchema }),
  candidatesController.runCandidateAutomation
);
router.post(
  '/:candidateId/parse',
  validateRequest({ params: candidateIdParamsSchema }),
  candidatesController.requestResumeParse
);
router.post(
  '/:candidateId/schedule-invite',
  validateRequest({ params: candidateIdParamsSchema, body: createScheduleInviteSchema }),
  scheduleInvitesController.createForCandidate
);

export default router;
