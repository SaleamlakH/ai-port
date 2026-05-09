/**
 * ApiKey repository — all database operations for the ApiKey model.
 * The only file allowed to touch ApiKey records via Prisma. Returns plain
 * domain objects so the service layer never sees Prisma types. Revoked keys
 * are returned as null — the service layer decides what error to throw.
 */

import { prisma } from '../prisma.js';
import type { ApiKeyRepository } from '../../../core/types/db.js';

export const prismaApiKeyRepo: ApiKeyRepository = {
  create(developerId: string, keyHash: string, label: string) {
    return prisma.apiKey.create({
      data: { developerId, keyHash, label },
    });
  },

  findByKeyHash(keyHash: string) {
    return prisma.apiKey.findFirst({
      where: { keyHash },
    });
  },

  revoke(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
};
