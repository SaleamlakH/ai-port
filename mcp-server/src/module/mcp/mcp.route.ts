/**
 * MCP route handlers — manages Streamable HTTP sessions
 * POST creates or reuses sessions, GET opens the SSE notification stream,
 * DELETE terminates sessions. Auth is validated on every POST before any
 * session logic runs. Each session is keyed by a UUID.
 */

import { Router, type RequestHandler } from 'express';
import type { McpController } from './mcp.controller.js';

export const createMcpRouter = (
  mcpController: McpController,
  apiKeyAuthMw: RequestHandler,
): Router => {
  const mcpRouter = Router();

  // mcp client-to-server communication
  mcpRouter.post('/mcp/:apiKey', apiKeyAuthMw, mcpController.handlePost);

  // mcp server-to-client notifications via SSE
  mcpRouter.get('/mcp/:apiKey', apiKeyAuthMw, mcpController.handleGet);

  // session termination
  mcpRouter.delete('/mcp/:apiKey', apiKeyAuthMw, mcpController.handleDelete);

  return mcpRouter;
};
