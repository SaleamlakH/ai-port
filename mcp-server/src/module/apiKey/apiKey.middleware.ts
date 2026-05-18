import type { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { BadRequestError } from '../../core/errors/errors.js';

// generate key form
const createApiKeySchema = z.object({
  label: z.string().trim().min(3),
});

export const validateCreateApiKeyBody = async (req: Request, res: Response, next: NextFunction) => {
  const result = createApiKeySchema.safeParse(req.body);

  if (!result.success) throw new BadRequestError(z.treeifyError(result.error));

  req.body = { ...req.body, ...result.data };
  next();
};
