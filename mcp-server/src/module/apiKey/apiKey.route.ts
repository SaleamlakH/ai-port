import { Router, type RequestHandler } from 'express';
import type { ApiKeyController } from './apiKey.controller.js';
import { validateCreateApiKeyBody } from './apiKey.middleware.js';

export const createApiKeyRouter = (
  controller: ApiKeyController,
  jwtAuthMw: RequestHandler,
  apiKeyAuthMw: RequestHandler,
): Router => {
  const apiKeyRouter = Router();

  // create api key
  apiKeyRouter.post('/apiKey/', jwtAuthMw, validateCreateApiKeyBody, controller.generate);

  // revoke api key
  apiKeyRouter.delete('/apiKey/', jwtAuthMw, apiKeyAuthMw, controller.revoke);

  return apiKeyRouter;
};
