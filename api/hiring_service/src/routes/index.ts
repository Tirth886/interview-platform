import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import candidatesRoutes from '../modules/candidates/candidates.routes';
import interviewsRoutes from '../modules/interviews/interviews.routes';

const router = Router();

// Feature routes
router.use('/auth', authRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/interviews', interviewsRoutes);

export default router;
