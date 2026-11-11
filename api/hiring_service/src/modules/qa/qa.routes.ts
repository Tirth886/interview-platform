import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { qaController } from './qa.controller';
import {
  bankIdParamsSchema,
  createQaBankSchema,
  replaceQaQuestionsSchema,
  updateQaBankSchema,
} from './qa.schema';

const router = Router();

router.use(requireAuth);

router.get('/', qaController.listBanks);
router.post(
  '/',
  validateRequest({ body: createQaBankSchema }),
  qaController.createBank
);
router.get(
  '/:bankId',
  validateRequest({ params: bankIdParamsSchema }),
  qaController.getBank
);
router.patch(
  '/:bankId',
  validateRequest({ params: bankIdParamsSchema, body: updateQaBankSchema }),
  qaController.updateBank
);
router.delete(
  '/:bankId',
  validateRequest({ params: bankIdParamsSchema }),
  qaController.deleteBank
);
router.put(
  '/:bankId/questions',
  validateRequest({ params: bankIdParamsSchema, body: replaceQaQuestionsSchema }),
  qaController.replaceQuestions
);

export default router;
