/**
 * Express app setup — creates the app, registers middleware, mounts routes,
 * and attaches the global error handler.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import {
  DeveloperNotFoundError,
  InvalidApiKeyError,
  InvalidSessionIdError,
  RevokedApiKeyError,
} from './core/errors/errors.js';
import { createAuthService } from './module/auth/auth.service.js';
import { createConnectionRegistry } from './module/agent/connections.js';
import { createAuthRouter } from './module/auth/auth.route.js';
import { prismaDeveloperRepo } from './lib/prisma/repositories/developer.repository.js';
import { createMcpService } from './module/mcp/mcp.service.js';
import { createInMemorySessionStore } from './module/mcp/mcp.session.js';
import { createMcpRouter } from './module/mcp/mcp.route.js';
import { createMcpController } from './module/mcp/mcp.controller.js';

export const app = express();
app.use(express.json());

export const agentRegistry = createConnectionRegistry();

const authService = createAuthService(prismaDeveloperRepo);

// mcp server routes
const inMemorySession = createInMemorySessionStore();
const mcpService = createMcpService(inMemorySession, agentRegistry);
const mcpController = createMcpController(mcpService, inMemorySession);

// register routs
app.use(createMcpRouter(mcpController));
app.use(createAuthRouter(authService));

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

  if (err instanceof DeveloperNotFoundError) {
    return res.status(400).json({ error: { code: err.code, message: err.message } });
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
