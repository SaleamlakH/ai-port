import type { Request, Response } from 'express';
import type { McpService } from './mcp.service.js';
import type { SessionStore } from './mcp.session.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types';

export type McpController = ReturnType<typeof createMcpController>;

export const createMcpController = (mcpService: McpService, sessionStore: SessionStore) => {
  const handlePost = async (req: Request, res: Response) => {
    const { apiKey } = req.params;

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const session = mcpService.getOrCreateSession(
      apiKey as string,
      sessionId,
      isInitializeRequest(req.body),
    );

    if (!session.server.isConnected()) {
      await session.server.connect(session.transport as any);
    }

    await session.transport.handleRequest(req, res, req.body);
  };

  const handleGet = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const session = sessionStore.getOrThrow(sessionId);

    res.on('close', () => {
      session.transport.close();
    });

    await session.transport.handleRequest(req, res);
  };

  const handleDelete = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const session = sessionStore.getOrThrow(sessionId);

    await session.transport.handleRequest(req, res);
  };

  return { handlePost, handleGet, handleDelete };
};
