/**
 * Auth service — validates API keys against the repository and returns the
 * associated developer. Owns all authentication business logic: a missing key
 * throws InvalidApiKeyError, a revoked key throws RevokedApiKeyError.
 * Receives the repository as an argument — never instantiates it directly,
 * keeping this service testable without a real database.
 */

import { DeveloperAlreadyExist, DeveloperNotFoundError } from '../../core/errors/errors.js';
import { comparePassword } from '../../lib/bcrypt.js';
import type { DeveloperRepository } from '../../core/types/db.js';
import { signJwt } from '../../lib/joseJwt.js';

export const createAuthService = (developerRepo: DeveloperRepository) => {
  const login = async (email: string, password: string) => {
    const developer = await developerRepo.findByEmail(email);
    if (!developer) throw new DeveloperNotFoundError();

    // compare password
    const { password: hashedPassword, ...safeDeveloper } = developer;
    const match = comparePassword(password, hashedPassword);

    if (!match) throw new DeveloperNotFoundError();

    return signJwt(safeDeveloper);
  };

  const signup = async (email: string, password: string) => {
    const existingDeveloper = await developerRepo.findByEmail(email);
    if (existingDeveloper) throw new DeveloperAlreadyExist();

    const newDeveloper = await developerRepo.create(email, password);
    const { password: hashedPassword, ...safeDeveloper } = newDeveloper;

    return signJwt(safeDeveloper);
  };

  return { login, signup };
};
