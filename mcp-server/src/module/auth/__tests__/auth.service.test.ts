import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from '../auth.service';
import { InvalidApiKeyError, RevokedApiKeyError } from '../../../core/errors/errors';
import type { ApiKey, ApiKeyRepository } from '../../../core/types/db';

const mockApiKey: ApiKey = {
  id: 'key-1',
  developerId: 'dev-1',
  keyHash: 'valid-hash',
  label: 'test-key',
  revokedAt: null,
  createdAt: new Date(),
};

const mockRepo = {
  findByKeyHash: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthService.validateApiKey', () => {
  it('return the ApiKey when key is valid and active', async () => {
    mockRepo.findByKeyHash.mockResolvedValue(mockApiKey);
    const service = createAuthService(mockRepo);

    const result = await service.validateApiKey('valid-hash');
    expect(result).toEqual(mockApiKey);
    expect(mockRepo.findByKeyHash).toHaveBeenCalledOnce();
  });

  it('throws InvalidApiKeyError when key not found', async () => {
    mockRepo.findByKeyHash.mockResolvedValue(null);
    const service = createAuthService(mockRepo);

    await expect(service.validateApiKey('unknown-hash')).rejects.toThrow(InvalidApiKeyError);
    expect(mockRepo.findByKeyHash).toHaveBeenCalledOnce();
  });

  it('throws RevokedApiKeyError when key is revoked', async () => {
    mockRepo.findByKeyHash.mockResolvedValue({ ...mockApiKey, revokedAt: new Date() });
    const service = createAuthService(mockRepo);

    await expect(service.validateApiKey('valid-hash')).rejects.toThrow(RevokedApiKeyError);
    expect(mockRepo.findByKeyHash).toHaveBeenCalledOnce();
  });
});
