import { describe, it, expect, afterEach } from 'vitest';
import { createDeveloperService } from '../developer.service.js';
import type { Developer, DeveloperRepository } from '../../../core/types/db.js';
import { DeveloperNotFoundError, DeveloperAlreadyExist } from '../../../core/errors/errors.js';

// mock db
const testDb: Developer[] = [];

// create developer service with mock repo
const testRepo: DeveloperRepository = {
  async create(email, password) {
    const developer = {
      email,
      password,
      id: `${testDb.length}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    testDb.push(developer);
    return developer;
  },

  async findByEmail(email) {
    let developer: Developer | null = null;
    for (const dev of testDb) {
      if (dev.email === email) {
        developer = dev;
        break;
      }
    }

    return developer;
  },
};

const devServices = createDeveloperService(testRepo);

afterEach(() => {
  testDb.splice(0, testDb.length);
});

describe('developer service', () => {
  it('create account and return developer', async () => {
    const result = await devServices.create('test@gmail.com', '123456');

    expect(result.email).toBe('test@gmail.com');
    expect(result.id).toBeDefined();
  });

  it('throw when account already exist', async () => {
    await devServices.create('test@gmail.com', '123456');

    await expect(() => devServices.create('test@gmail.com', '1234')).rejects.toThrow(
      DeveloperAlreadyExist,
    );
  });

  it('returns existing account for give email', async () => {
    await devServices.create('test@gmail.com', '123456');

    const developer = await devServices.findByEmail('test@gmail.com');
    expect(developer.id).toBeDefined();
    expect(developer.email).toBe('test@gmail.com');
  });

  it('throws if developer not found', async () => {
    await expect(() => devServices.findByEmail('not@found.com')).rejects.toThrow(
      DeveloperNotFoundError,
    );
  });
});
