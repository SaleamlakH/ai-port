import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createJwtAuthMw } from '../jwtAuth.middleware';
import { signJwt } from '../../lib/joseJwt';
import { DeveloperNotFoundError, InvalidTokenError } from '../../core/errors/errors';
import { DeveloperService } from '../../core/types/db.d.js';

const service: DeveloperService = {
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

describe('jwtAuth.middleware', () => {
  it('throw InvalidTokenError if token not provided', async () => {
    const req: Partial<Request> = { headers: {} };
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next: NextFunction = vi.fn();

    const jwtAuthMw = createJwtAuthMw(service);

    await expect(() => jwtAuthMw(req as Request, res as Response, next)).rejects.toThrow(
      InvalidTokenError,
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throw DeveloperNotFoundError if developer not exist', async () => {
    const token = await signJwt({
      id: '1',
      email: 'test@email.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req: Partial<Request> = { headers: { authorization: `Bearer ${token}` } };
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next: NextFunction = vi.fn();

    vi.mocked(service.findByEmail).mockRejectedValue(new DeveloperNotFoundError());
    const jwtAuthMw = createJwtAuthMw(service);

    await expect(() => jwtAuthMw(req as Request, res as Response, next)).rejects.toThrow(
      DeveloperNotFoundError,
    );

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.json).not.toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('bind existing developer on the req.body', async () => {
    const developer = {
      id: '1',
      email: 'test@email.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = await signJwt(developer);
    const req: Partial<Request> = {
      headers: { authorization: `Bearer ${token}` },
      body: {},
    };
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next: NextFunction = vi.fn();

    vi.mocked(service.findByEmail).mockResolvedValue({
      password: '',
      ...developer,
    });

    const jwtAuthMw = createJwtAuthMw(service);

    await jwtAuthMw(req as Request, res as Response, next);

    expect(req.body.developer).toEqual(developer);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
