import express, { NextFunction, Request, Response } from 'express';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import { createApiKeyRouter } from '../apiKey.route';
import { createApiKeyService } from '../apiKey.service';
import { ApiKey, ApiKeyRepository } from '../../../core/types/db.d';
import { createApiKeyController } from '../apiKey.controller';
import { RevokedApiKeyError } from '../../../core/errors/errors';

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
  async revoke(devId, id) {
    const key = testDb.find((k) => k.id === id && k.developerId === devId) as ApiKey;

    key.revokedAt = new Date();
    return key;
  },
};

const apiKeyService = createApiKeyService(mockRepo);
const apiKeyController = createApiKeyController(apiKeyService);

afterEach(() => {
  vi.clearAllMocks();
  testDb.splice(0, testDb.length);
});

describe('apiKey route (integration)', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('POST /apiKey', () => {
    it('generate and return apiKey', async (done) => {
      const fakeJwtAuthMw = (req: Request, res: Response, next: NextFunction) => {
        req.body.developer = {
          id: '1',
          email: 'test@gmail.com',
          password: 'test-password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        next();
      };

      const fakeApiKeyAuthMw = vi.fn();
      const router = createApiKeyRouter(apiKeyController, fakeJwtAuthMw, fakeApiKeyAuthMw);

      app.use(router);

      await request(app)
        .post('/apiKey')
        .set('Content-Type', 'application/json')
        .send({ label: 'testKey' })
        .set('Accept', 'application/json')
        .expect(200)
        .expect(async (res) => {
          const apiKey = await apiKeyService.findByKeyHash(res.body.data.apiKey);
          expect(apiKey.id).toBeDefined();
        });
    });

    it('throws if label is empty string (bad request)', async () => {
      const fakeJwtAuthMw = (req: Request, res: Response, next: NextFunction) => {
        req.body.developer = {
          id: '1',
          email: 'test@gmail.com',
          password: 'test-password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        next();
      };

      const fakeApiKeyAuthMw = vi.fn();
      const router = createApiKeyRouter(apiKeyController, fakeJwtAuthMw, fakeApiKeyAuthMw);

      app.use(router);

      await request(app)
        .post('/apiKey')
        .set({
          Authorization: 'Bearer your_jwt_token_here',
          'Content-Type': 'application/json',
        })
        .send({ label: '' })
        .set('Accept', 'application/json')
        .expect(500);
    });

    it('throw error for unauthorized developer', async () => {
      const fakeJwtAuthMw = (req: Request, res: Response, next: NextFunction) => {
        throw new Error('');
      };

      const fakeApiKeyAuthMw = vi.fn();
      const router = createApiKeyRouter(apiKeyController, fakeJwtAuthMw, fakeApiKeyAuthMw);

      app.use(router);

      await request(app)
        .post('/apiKey')
        .set('Content-Type', 'application/json')
        .send({ label: '   ' })
        .set('Accept', 'application/json')
        .expect(500);
    });
  });

  describe('DELETE /apiKey', () => {
    it('revoke for authenticated developer', async () => {
      // create key
      const rawKey = await apiKeyService.generate('1', 'test-key');

      const fakeJwtAuthMw = (req: Request, res: Response, next: NextFunction) => {
        req.body.developer = {
          id: '1',
          email: 'test@gmail.com',
          password: 'test-password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        next();
      };

      const fakeApiKeyAuthMw = async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = await apiKeyService.findByKeyHash(rawKey);
        req.body.apiKey = { ...apiKey, rawKey };
        next();
      };

      const router = createApiKeyRouter(apiKeyController, fakeJwtAuthMw, fakeApiKeyAuthMw);

      app.use(router);

      await request(app)
        .delete('/apiKey')
        .set('Content-Type', 'application/json')
        .send({ apiKey: rawKey })
        .set('Accept', 'application/json')
        .expect(200, {
          success: true,
        });

      await expect(() => apiKeyService.findByKeyHash(rawKey)).rejects.toThrow(RevokedApiKeyError);
    });

    it('throw for unauthorized developer', async () => {
      // create key
      const rawKey = await apiKeyService.generate('1', 'test-key');

      const fakeJwtAuthMw = (req: Request, res: Response, next: NextFunction) => {
        req.body.developer = {
          id: '2',
          email: 'test@gmail.com',
          password: 'test-password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        next();
      };

      const fakeApiKeyAuthMw = async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = await apiKeyService.findByKeyHash(rawKey);
        req.body.apiKey = { ...apiKey, rawKey };
        next();
      };

      const router = createApiKeyRouter(apiKeyController, fakeJwtAuthMw, fakeApiKeyAuthMw);

      app.use(router);

      await request(app)
        .delete('/apiKey')
        .set('Content-Type', 'application/json')
        .send({ apiKey: rawKey })
        .set('Accept', 'application/json')
        .expect(500);

      const apiKey = await apiKeyService.findByKeyHash(rawKey);
      expect(apiKey.revokedAt).toBe(null);
    });
  });
});
