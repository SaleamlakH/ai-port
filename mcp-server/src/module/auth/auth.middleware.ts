import type { NextFunction, Request, Response } from 'express';
import z from 'zod';

// validate email, and password
const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const validateForm = (req: Request, res: Response, next: NextFunction) => {
  const result = formSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: z.treeifyError(result.error) });
    return;
  }

  req.body = result.data;
  next();
};
