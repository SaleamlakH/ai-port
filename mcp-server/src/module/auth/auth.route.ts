import { Router, type Request, type Response } from 'express';
import { validateForm } from './auth.middleware.js';
import { createAuthService } from './auth.service.js';

export const createAuthRouter = (authService: ReturnType<typeof createAuthService>): Router => {
  const authRouter = Router();

  authRouter.post('/signup', validateForm, async (req: Request, res: Response) => {
    const token = await authService.signup(req.body.email, req.body.password);
    res.json({ token });
  });

  authRouter.post('/login', validateForm, async (req: Request, res: Response) => {
    const token = await authService.login(req.body.email, req.body.password);
    res.json({ token });
  });

  return authRouter;
};
