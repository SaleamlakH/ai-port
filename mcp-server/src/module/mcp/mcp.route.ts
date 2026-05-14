/**
 * MCP route handlers — manages Streamable HTTP sessions
 * POST creates or reuses sessions, GET opens the SSE notification stream,
 * DELETE terminates sessions. Auth is validated on every POST before any
 * session logic runs. Each session is keyed by a UUID.
 */

import { Router } from 'express';
import type { McpController } from './mcp.controller.js';

export const createMcpRouter = (mcpController: McpController): Router => {
  const mcpRouter = Router();

  // mcp client-to-server communication
  mcpRouter.post('/mcp/:apiKey', mcpController.handlePost);

  // mcp server-to-client notifications via SSE
  mcpRouter.get('/mcp/:apiKey', mcpController.handleGet);

  // session termination
  mcpRouter.delete('/mcp/:apiKey', mcpController.handleDelete);

  return mcpRouter;
};
