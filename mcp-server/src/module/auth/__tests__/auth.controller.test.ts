import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAuthController } from '../auth.controller';
import { AuthService } from '../../../core/types/db.d';
import { Request, Response } from 'express';

const mockService: AuthService = {
  login: vi.fn(),
  signup: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('auth.controller', () => {
  describe('controller.createAccount', () => {
    it('return token for successful account creation', async () => {
      const req: Partial<Request> = { body: { email: 'test@gmail.com', password: '123' } };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(mockService.signup).mockResolvedValue('generated-api-key');
      const controller = createAuthController(mockService);

      await controller.createAccount(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { token: 'generated-api-key' },
      });
    });

    it('throw if error occur in the service', async () => {
      const req: Partial<Request> = {};
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(mockService.signup).mockRejectedValue(new Error('Service throws error'));
      const controller = createAuthController(mockService);

      await expect(controller.createAccount(req as Request, res as Response)).rejects.toThrow(
        Error,
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('controller.login', () => {
    it('return token for successful login', async () => {
      const req: Partial<Request> = { body: { email: 'test@gmail.com', password: '123' } };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(mockService.login).mockResolvedValue('generated-api-key');
      const controller = createAuthController(mockService);

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { token: 'generated-api-key' },
      });
    });

    it('throw if error occur in the service', async () => {
      const req: Partial<Request> = {};
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(mockService.login).mockRejectedValue(new Error('Service throws error'));
      const controller = createAuthController(mockService);

      await expect(controller.login(req as Request, res as Response)).rejects.toThrow(Error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
