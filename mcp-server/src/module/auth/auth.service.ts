/**
 * Auth service — validates API keys against the repository and returns the
 * associated developer. Owns all authentication business logic: a missing key
 * throws InvalidApiKeyError, a revoked key throws RevokedApiKeyError.
 * Receives the repository as an argument — never instantiates it directly,
 * keeping this service testable without a real database.
 */

import { InvalidApiKeyError, RevokedApiKeyError } from '../../core/errors/errors.js';
import type { ApiKeyRepository } from '../../core/types/db.js';

export type AuthService = ReturnType<typeof createAuthService>;

export const createAuthService = (apiKeyRepo: ApiKeyRepository) => {
  const validateApiKey = async (keyHash: string) => {
    const apiKey = await apiKeyRepo.findByKeyHash(keyHash);

    if (!apiKey) throw new InvalidApiKeyError();
    if (apiKey.revokedAt !== null) throw new RevokedApiKeyError();

    return apiKey;
  };

  return { validateApiKey };
};
