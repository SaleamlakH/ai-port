import type { Request, Response } from 'express';
import type { AuthService } from '../../core/types/db.js';

export type AuthController = ReturnType<typeof createAuthController>;

export const createAuthController = (authService: AuthService) => {
  const createAccount = async (req: Request, res: Response) => {
    const token = await authService.signup(req.body.email, req.body.password);
    res.status(200).json({ success: true, data: { token } });
  };

  const login = async (req: Request, res: Response) => {
    const token = await authService.login(req.body.email, req.body.password);
    res.status(200).json({ success: true, data: { token } });
  };

  return { createAccount, login };
};
