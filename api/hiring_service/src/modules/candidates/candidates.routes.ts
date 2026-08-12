import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { candidatesController } from './candidates.controller';
import {
  addCandidateNoteSchema,
  candidateIdParamsSchema,
  candidateImportSchema,
  createCandidateSchema,
  listCandidatesQuerySchema,
  updateCandidateStatusSchema,
} from './candidates.schema';

const router = Router();

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
  '/import',
  validateRequest({ body: candidateImportSchema }),
  candidatesController.importCandidates
);

export default router;
