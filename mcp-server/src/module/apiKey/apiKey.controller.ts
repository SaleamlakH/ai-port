import type { Request, Response } from 'express';
import type { ApiKeyService } from '../../core/types/db.js';

export const createApiKeyController = (service: ApiKeyService) => {
  const generate = async (req: Request, res: Response) => {
    const apiKey = await service.generate(req.body.developerId, req.body.label);
    res.status(200).json({ success: true, data: { apiKey } });
  };

  const revoke = async (req: Request, res: Response) => {
    await service.revoke(req.body.apiKey.id);
    res.status(200).json({ success: true });
  };

  return { generate, revoke };
};
