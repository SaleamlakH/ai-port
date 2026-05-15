import type { NextFunction, Request, Response } from 'express';
import type { ApiKeyService } from '../core/types/db.js';

export const createApiKeyAuthMw = (service: ApiKeyService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.body.apiKey;

    const key = await service.findByKeyHash(apiKey);
    req.body.apiKey = { ...key, rawKey: apiKey };
    next();
  };
};
