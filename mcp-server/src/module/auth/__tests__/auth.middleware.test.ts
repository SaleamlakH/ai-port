import { describe, it, expect, vi } from 'vitest';
import { validateForm } from '../auth.middleware';
import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../../core/errors/errors';

describe('auth.validateForm', () => {
  it('call next if everything is fine', () => {
    const req: Partial<Request> = { body: { email: 'test@email.com', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    validateForm(req as Request, res as Response, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('throw if email misses local-part(prefix)', async () => {
    const req: Partial<Request> = { body: { email: '@email.com', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });

  it('throw if email misses domain-part(suffix)', async () => {
    const req: Partial<Request> = { body: { email: 'test@.com', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });

  it('throw if email misses at (@) symbol ', async () => {
    const req: Partial<Request> = { body: { email: 'testemail.com', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });

  it('throw if email misses top-level domain(eg .com)', async () => {
    const req: Partial<Request> = { body: { email: 'test@email', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });

  it('throw if email has wrong top-level domain(eg .com)', async () => {
    const req: Partial<Request> = { body: { email: 'test@email.i', password: '12345678' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });

  it('throw if password is less than 8 character', () => {
    const req: Partial<Request> = { body: { email: 'test@email.i', password: '1234567' } };
    const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next: NextFunction = vi.fn();

    expect(() => validateForm(req as Request, res as Response, next)).toThrow(BadRequestError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledOnce();
  });
});
