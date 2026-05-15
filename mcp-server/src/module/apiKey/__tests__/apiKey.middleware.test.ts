import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCreateApiKeyBody } from '../apiKey.middleware';
import { NextFunction, Request, response, Response } from 'express';
import { BadRequestError } from '../../../core/errors/errors';

describe('auth.Mw.validateCreateApiKeyBody', () => {
  it('bind object on req.body when label is provided', async () => {
    const req: Partial<Request> = { body: { label: 'test' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await validateCreateApiKeyBody(req as Request, res as Response, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('throws BadRequestError when label less than 3 char', async () => {
    const req: Partial<Request> = { body: { label: 'ts' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await expect(() =>
      validateCreateApiKeyBody(req as Request, res as Response, next),
    ).rejects.toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when label is empty string', async () => {
    const req: Partial<Request> = { body: { label: '' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await expect(() =>
      validateCreateApiKeyBody(req as Request, res as Response, next),
    ).rejects.toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when label string of spaces', async () => {
    const req: Partial<Request> = { body: { label: '   ' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    await expect(() =>
      validateCreateApiKeyBody(req as Request, res as Response, next),
    ).rejects.toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
