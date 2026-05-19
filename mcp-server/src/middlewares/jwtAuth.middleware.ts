import type { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../lib/joseJwt.js';
import type { Developer, DeveloperService } from '../core/types/db.js';
import { InvalidTokenError } from '../core/errors/errors.js';

export const createJwtAuthMw = (service: DeveloperService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new InvalidTokenError();

    const payload = (await verifyJwt(token)) as Omit<Developer, 'password'>;

    // check if exist
    const developer = await service.findByEmail(payload.email);
    const { password, ...safeDeveloper } = developer;

    req.body = { ...req.body, developer: safeDeveloper };
    next();
  };
};
