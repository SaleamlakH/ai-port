import { DeveloperNotFoundError, DeveloperAlreadyExist } from '../../core/errors/errors.js';
import type { DeveloperRepository } from '../../core/types/db.js';
import { hashPassword } from '../../lib/bcrypt.js';

export const createDeveloperService = (developerRepo: DeveloperRepository) => {
  const create = async (email: string, password: string) => {
    const exists = await developerRepo.findByEmail(email);
    if (exists) throw new DeveloperAlreadyExist();

    const hashedPassword = hashPassword(password);
    return developerRepo.create(email, hashedPassword);
  };

  const findByEmail = async (email: string) => {
    const developer = await developerRepo.findByEmail(email);

    if (!developer) throw new DeveloperNotFoundError();

    return developer;
  };

  return { create, findByEmail };
};
