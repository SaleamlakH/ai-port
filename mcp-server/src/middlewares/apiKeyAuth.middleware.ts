import type { NextFunction, Request, Response } from 'express';
import type { ApiKeyService } from '../core/types/db.js';

export const createApiKeyAuthMw = (service: ApiKeyService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req.params as any).apiKey;

    const key = await service.findByKeyHash(apiKey);
    req.body.apiKey = { id: key.id, rawKey: apiKey };
    next();
  };
};
