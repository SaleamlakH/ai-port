import { Router } from 'express';
import { validateForm } from './auth.middleware.js';
import type { AuthController } from './auth.controller.js';

export const createAuthRouter = (authController: AuthController): Router => {
  const authRouter = Router();

  authRouter.post('/signup', validateForm, authController.createAccount);

  authRouter.post('/login', validateForm, authController.login);

  return authRouter;
};
