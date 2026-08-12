import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { requireAuth } from '../../middlewares/require-auth';
import {
  refreshSchema,
  resendVerificationSchema,
  signinSchema,
  signoutSchema,
  signupSchema,
  ssoCallbackSchema,
  ssoProviderParamsSchema,
  verifyEmailSchema,
} from './auth.schema';

const router = Router();

router.post('/signup', validateRequest({ body: signupSchema }), authController.signup);
router.post('/signin', validateRequest({ body: signinSchema }), authController.signin);
router.post(
  '/verify-email',
  validateRequest({ body: verifyEmailSchema }),
  authController.verifyEmail
);
router.post(
  '/resend-verification',
  validateRequest({ body: resendVerificationSchema }),
  authController.resendVerification
);
router.post('/refresh', validateRequest({ body: refreshSchema }), authController.refresh);
router.post('/signout', validateRequest({ body: signoutSchema }), authController.signout);
router.get('/me', requireAuth, authController.me);
router.get(
  '/sso/:provider',
  validateRequest({ params: ssoProviderParamsSchema }),
  authController.ssoInitiate
);
router.get(
  '/sso/:provider/callback',
  validateRequest({ params: ssoProviderParamsSchema, query: ssoCallbackSchema }),
  authController.ssoCallback
);

export default router;
