import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Router } from 'express';
import { Developer, DeveloperRepository } from '../../../core/types/db.d';
import { hashPassword } from '../../../lib/bcrypt';
import { createAuthRouter } from '../auth.route';
import { createAuthController } from '../auth.controller';
import { createAuthService } from '../auth.service';
import { verifyJwt } from '../../../lib/joseJwt';

const mockRepo: DeveloperRepository = {
  create: vi.fn(),
  findByEmail: vi.fn(),
};

beforeEach(() => {
  vi.stubEnv('JWT_SECRET_KEY', 'test-jwt-secret-key');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

const setupRouter = (repo: DeveloperRepository): Router => {
  const service = createAuthService(repo);
  const controller = createAuthController(service);
  return createAuthRouter(controller);
};

describe('auth.route (integration)', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('POST /signup', () => {
    it('return token if successfully registered', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@gmail.com',
        password: hashPassword('12345678'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.create).mockResolvedValue(developer);
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/signup')
        .set('Content-Type', 'application/json')
        .send({ email: developer.email, password: '12345678' })
        .set('Accept', 'application/json')
        .expect(200)
        .expect(async (res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();

          const decoded = await verifyJwt(res.body.data.token);
          expect(decoded.email).toBe(developer.email);
        });
    });

    it('throw if email already exist', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@gmail.com',
        password: hashPassword('12345678'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/signup')
        .set('Content-Type', 'application/json')
        .send({ email: developer.email, password: '12345678' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    it('throw if password is less than 8 char', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@gmail.com',
        password: hashPassword('12345678'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.create).mockResolvedValue(developer);
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/signup')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@gmail.com', password: '1234567' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    describe('validation', () => {
      it('throw if email misses local-part(prefix)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.create).mockResolvedValue(developer);
        vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/signup')
          .set('Content-Type', 'application/json')
          .send({ email: '@gmail.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses domain-part(suffix)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.create).mockResolvedValue(developer);
        vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/signup')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses at (@) symbol ', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.create).mockResolvedValue(developer);
        vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/signup')
          .set('Content-Type', 'application/json')
          .send({ email: 'testgmail.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses top-level domain(eg .com)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.create).mockResolvedValue(developer);
        vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/signup')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@gmail', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email has wrong top-level domain(eg .com)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.create).mockResolvedValue(developer);
        vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/signup')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@gmail.c', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });
    });
  });

  describe('POST /login', () => {
    it('return token if successfully logged in', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@gmail.com',
        password: hashPassword('12345678'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send({ email: developer.email, password: '12345678' })
        .set('Accept', 'application/json')
        .expect(200)
        .expect(async (res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();

          const decoded = await verifyJwt(res.body.data.token);
          expect(decoded.email).toBe(developer.email);
        });
    });

    it('throw if developer do not exist', async () => {
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@email.com', password: '12345678' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    it('throw if password do not match', async () => {
      const developer: Developer = {
        id: '1',
        email: 'test@gmail.com',
        password: hashPassword('12345678'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send({ email: developer.email, password: '123456789' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    it('throw if email is wrong', async () => {
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      const route = setupRouter(mockRepo);
      app.use(route);

      await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@gmail.com', password: '12345678' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    describe('validation', () => {
      it('throw if email misses local-part(prefix)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/login')
          .set('Content-Type', 'application/json')
          .send({ email: '@gmail.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses domain-part(suffix)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/login')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses at (@) symbol ', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/login')
          .set('Content-Type', 'application/json')
          .send({ email: 'testgmail.com', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email misses top-level domain(eg .com)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/login')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@gmail', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });

      it('throw if email has wrong top-level domain(eg .com)', async () => {
        const developer: Developer = {
          id: '1',
          email: 'test@gmail.com',
          password: hashPassword('12345678'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(mockRepo.findByEmail).mockResolvedValue(developer);
        const route = setupRouter(mockRepo);
        app.use(route);

        await request(app)
          .post('/login')
          .set('Content-Type', 'application/json')
          .send({ email: 'test@gmail.c', password: '12345678' })
          .set('Accept', 'application/json')
          .expect(500);
      });
    });
  });
});
