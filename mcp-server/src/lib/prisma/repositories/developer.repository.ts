/**
 * Developer repository — all database operations for the Developer model.
 * The only file allowed to import Prisma. Returns plain domain objects so
 * the service layer never sees Prisma types. No business logic lives here.
 */

import { prisma } from '../prisma.js';
import type { DeveloperRepository } from '../../../core/types/db.js';

export const prismaDeveloperRepo: DeveloperRepository = {
  create(email: string, password: string) {
    return prisma.developer.create({
      data: { email, password },
    });
  },

  findByEmail(email: string) {
    return prisma.developer.findUnique({
      where: { email },
    });
  },
};
