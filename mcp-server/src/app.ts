/**
 * Express app setup — creates the app, registers middleware, mounts routes,
 * and attaches the global error handler.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import { mcpRouter } from './routes/mcp.js';
import {
  InvalidApiKeyError,
  InvalidSessionIdError,
  RevokedApiKeyError,
} from './core/errors/errors.js';

export const app = express();
app.use(express.json());
app.use(mcpRouter);

// global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof RevokedApiKeyError || err instanceof InvalidApiKeyError) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: err.message,
      },
      id: null,
    });
  }

  if (err instanceof InvalidSessionIdError) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32099,
        message: err.message,
      },
      id: null,
    });
  }

  res.status(500).json({
    jsonrpc: '2.0',
    error: {
      code: -32603,
      message: 'Internal server error',
    },
    id: null,
  });
});
