import type { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { BadRequestError } from '../../core/errors/errors.js';

// validate email, and password
const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const validateForm = (req: Request, res: Response, next: NextFunction) => {
  const result = formSchema.safeParse(req.body);

  if (!result.success) throw new BadRequestError(z.treeifyError(result.error));

  req.body = result.data;
  next();
};
