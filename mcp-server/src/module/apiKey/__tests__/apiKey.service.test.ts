import { describe, it, expect, vi, afterEach, test } from 'vitest';
import type { ApiKey, ApiKeyRepository } from '../../../core/types/db.js';
import { createApiKeyService } from '../apiKey.service.js';
import { generateApiKey, hashApiKey } from '../../../lib/crypto.js';
import { InvalidApiKeyError, RevokedApiKeyError } from '../../../core/errors/errors.js';

const testDb: ApiKey[] = [];

const mockRepo: ApiKeyRepository = {
  async create(developerId, keyHash, label) {
    const apiKey = {
      developerId,
      keyHash,
      label,
      id: `${testDb.length}`,
      createdAt: new Date(),
      revokedAt: null,
    };

    testDb.push(apiKey);
    return apiKey;
  },
  async findByKeyHash(keyHash) {
    let apiKey: ApiKey | null = null;

    for (const key of testDb) {
      if (key.keyHash === keyHash) {
        apiKey = key;
        break;
      }
    }

    return apiKey;
  },
  async revoke(developerId, id) {
    const key = testDb.find((k) => k.id === id && k.developerId === developerId) as ApiKey;

    key.revokedAt = new Date();
    return key;
  },
};

vi.mock('../../../lib/crypto.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/crypto.js')>();
  return {
    ...actual,
    generateApiKey: vi.fn(),
  };
});

const apiKeyService = createApiKeyService(mockRepo);

afterEach(() => {
  testDb.splice(0, testDb.length);
  vi.clearAllMocks();
});

describe('apiKey.service', () => {
  describe('apiKey.generate', () => {
    it('generate and return raw key', async () => {
      vi.mocked(generateApiKey).mockReturnValue('123456');

      const apiKey = await apiKeyService.generate('dev-id', 'test-key');
      expect(apiKey).toBe('123456');
    });
  });

  describe('apiKey.findByKeyHash', () => {
    it('returns a key with give hashed key', async () => {
      mockRepo.create('dev-id', hashApiKey('123456'), 'test-key');

      const key = await apiKeyService.findByKeyHash('123456');
      expect(key.id).toBeDefined();
      expect(key.keyHash).toBe(hashApiKey('123456'));
    });

    it('throws if key not exist', async () => {
      await expect(() => apiKeyService.findByKeyHash('123456')).rejects.toThrow(InvalidApiKeyError);
    });

    it('throw error if revoked', async () => {
      mockRepo.create('dev-id', hashApiKey('123456'), 'test-key');

      const key = await apiKeyService.findByKeyHash('123456');
      key.revokedAt = new Date();

      await expect(apiKeyService.findByKeyHash('123456')).rejects.toThrow(RevokedApiKeyError);
    });
  });

  describe('apiKey.revoke', () => {
    it('revoked and return api key', async () => {
      const createdKey = await mockRepo.create('dev-id', hashApiKey('123456'), 'test-key');
      const revoked = await apiKeyService.revoke('dev-id', createdKey);

      expect(revoked.revokedAt).toBeDefined();
      expect(revoked.revokedAt).toBeInstanceOf(Date);
    });

    it('throw if developer ids not match', async () => {
      const createdKey = await mockRepo.create('dev-id', hashApiKey('123456'), 'test-key');

      await expect(apiKeyService.revoke('wrong-id', createdKey)).rejects.toThrow(
        InvalidApiKeyError,
      );
    });
  });
});
