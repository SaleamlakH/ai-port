import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiKey, ApiKeyService } from '../../../core/types/db.d';
import { createApiKeyController } from '../apiKey.controller';
import { Request, Response } from 'express';

const service: ApiKeyService = {
  generate: vi.fn(),
  findByKeyHash: vi.fn(),
  revoke: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('apiKey.controller', () => {
  describe('controller.generate', () => {
    it('return generated raw key', async () => {
      const req: Partial<Request> = { body: { developerId: '1', label: 'test' } };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(service.generate).mockResolvedValue('generated-test-key');
      const controller = createApiKeyController(service);

      await controller.generate(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { apiKey: 'generated-test-key' },
      });
    });

    it('not return if error occurs', async () => {
      const req: Partial<Request> = { body: {} };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(service.generate).mockRejectedValue(new Error('test error'));
      const controller = createApiKeyController(service);

      await expect(() => controller.generate(req as Request, res as Response)).rejects.toThrow();

      expect(res.status).not.toHaveBeenCalledWith(200);
      expect(res.json).not.toHaveBeenCalledWith({
        success: true,
        data: { apiKey: 'generated-test-key' },
      });
    });
  });

  describe('controller.revoke', () => {
    it('return 200 if revoked successfully', async () => {
      const req: Partial<Request> = { body: { developer: { id: '1' }, apiKey: { id: '1' } } };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(service.revoke).mockResolvedValue({ id: '1' } as ApiKey);
      const controller = createApiKeyController(service);

      await controller.revoke(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('not return if error occurs', async () => {
      const req: Partial<Request> = { body: {} };
      const res: Partial<Response> = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      vi.mocked(service.revoke).mockRejectedValue(new Error('test error'));
      const controller = createApiKeyController(service);

      await expect(() => controller.revoke(req as Request, res as Response)).rejects.toThrow();
    });
  });
});
