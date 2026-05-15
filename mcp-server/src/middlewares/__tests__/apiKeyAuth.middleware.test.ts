import { describe, it, expect, vi, afterAll, afterEach } from 'vitest';
import { ApiKey, ApiKeyService } from '../../core/types/db.d';
import { createApiKeyAuthMw } from '../apiKeyAuth.middleware';
import { InvalidApiKeyError } from '../../core/errors/errors';
import { NextFunction, Request, Response } from 'express';

const service: Partial<ApiKeyService> = {
  findByKeyHash: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('apiAuth.middleware', () => {
  it('throw InvalidApiKeyError if key not exist', async () => {
    vi.mocked(service.findByKeyHash)?.mockRejectedValue(new InvalidApiKeyError());
    const apikeyAuth = createApiKeyAuthMw(service as ApiKeyService);

    const req: Partial<Request> = { body: { apiKey: 'test-api-key' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await expect(apikeyAuth(req as Request, res as Response, next)).rejects.toThrow(
      InvalidApiKeyError,
    );
  });

  it('binds existing key id and rawKey on req.body', async () => {
    const rawKey = 'test-api-key';
    const apiKey: ApiKey = {
      id: '1',
      developerId: '1',
      keyHash: 'hashed-api-key',
      label: 'test',
      createdAt: new Date(),
      revokedAt: null,
    };

    vi.mocked(service.findByKeyHash)?.mockResolvedValue(apiKey);
    const apiKeyAuth = createApiKeyAuthMw(service as ApiKeyService);

    const req: Partial<Request> = { body: { apiKey: rawKey } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await apiKeyAuth(req as Request, res as Response, next);

    expect(req.body.apiKey).toEqual({ ...apiKey, rawKey });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
