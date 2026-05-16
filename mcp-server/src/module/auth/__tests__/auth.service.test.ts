import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createAuthService } from '../auth.service';
import { Developer, DeveloperRepository } from '../../../core/types/db.d';
import { verifyJwt } from '../../../lib/joseJwt';
import { hashPassword } from '../../../lib/bcrypt';
import { DeveloperAlreadyExist, DeveloperNotFoundError } from '../../../core/errors/errors';

const mockRepo: DeveloperRepository = {
  create: vi.fn(),
  findByEmail: vi.fn(),
};

beforeEach(() => {
  vi.stubEnv('JWT_SECRET_KEY', 'test-secret-key');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('auth.service', () => {
  describe('service.signup', () => {
    it('register developer and return jwt token (no password)', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@email.com',
        password: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.create).mockResolvedValue(developer);
      const authService = createAuthService(mockRepo);

      const token = await authService.signup(developer.email, developer.password);
      expect(token).toBeDefined();

      const decoded = await verifyJwt(token);
      expect(decoded.id).toEqual(developer.id);
      expect(decoded.email).toEqual(developer.email);
    });

    it('throw if email already registered', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@email.com',
        password: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const authService = createAuthService(mockRepo);

      await expect(authService.signup('test@email.com', '1234')).rejects.toThrow(
        DeveloperAlreadyExist,
      );
    });
  });

  describe('service.login', () => {
    it('return jwt for correct email and password', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@email.com',
        password: hashPassword('123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const authService = createAuthService(mockRepo);

      const token = await authService.login(developer.email, '123');

      expect(token).toBeDefined();

      const decoded = await verifyJwt(token);
      expect(decoded.id).toEqual(developer.id);
      expect(decoded.email).toEqual(developer.email);
    });

    it('throw if developer not found', async () => {
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      const authService = createAuthService(mockRepo);

      await expect(authService.login('test@notfound.com', '123')).rejects.toThrow(
        DeveloperNotFoundError,
      );
    });

    it('throw if password do not match', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@email.com',
        password: hashPassword('123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const authService = createAuthService(mockRepo);

      await expect(authService.login(developer.email, 'wrong_password')).rejects.toThrow(
        DeveloperNotFoundError,
      );
    });
  });
});
