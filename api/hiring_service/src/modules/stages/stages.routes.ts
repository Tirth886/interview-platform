import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { stagesController } from './stages.controller';

const router = Router();

router.use(requireAuth);

/** Platform catalog — companies may list only. Mutations belong to super-admin (future). */
router.get('/', stagesController.listStages);

export default router;
