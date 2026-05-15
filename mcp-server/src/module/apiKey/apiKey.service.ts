import { InvalidApiKeyError, RevokedApiKeyError } from '../../core/errors/errors.js';
import type { ApiKeyRepository, ApiKeyService } from '../../core/types/db.js';
import { generateApiKey, hashApiKey } from '../../lib/crypto.js';

export const createApiKeyService = (apiKeyRepo: ApiKeyRepository): ApiKeyService => {
  const generate = async (developerId: string, label: string) => {
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);

    await apiKeyRepo.create(developerId, keyHash, label);
    return rawKey;
  };

  const findByKeyHash = async (rawKey: string) => {
    const keyHash = hashApiKey(rawKey);
    const apiKey = await apiKeyRepo.findByKeyHash(keyHash);

    if (!apiKey) throw new InvalidApiKeyError();

    if (apiKey.revokedAt) throw new RevokedApiKeyError();

    return apiKey;
  };

  const revoke = (keyId: string) => apiKeyRepo.revoke(keyId);

  return { generate, findByKeyHash, revoke };
};
