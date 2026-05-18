import type { Request, Response } from 'express';
import type { McpService } from './mcp.service.js';
import type { SessionStore } from './mcp.session.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types';

export type McpController = ReturnType<typeof createMcpController>;

export const createMcpController = (mcpService: McpService, sessionStore: SessionStore) => {
  const handlePost = async (req: Request, res: Response) => {
    const apiKey = req.body.apiKey.rawKey;

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const session = mcpService.getOrCreateSession(apiKey, sessionId, isInitializeRequest(req.body));

    if (!session.server.isConnected()) {
      await session.server.connect(session.transport as any);
    }

    const { apiKey: key, ...body } = req.body;
    req.body = body;
    await session.transport.handleRequest(req, res, req.body);
  };

  const handleGet = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const session = sessionStore.getOrThrow(sessionId);

    res.on('close', () => {
      session.transport.close();
    });

    const { apiKey, ...body } = req.body;
    req.body = body;
    await session.transport.handleRequest(req, res);
  };

  const handleDelete = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const session = sessionStore.getOrThrow(sessionId);

    const { apiKey, ...body } = req.body;
    req.body = body;
    await session.transport.handleRequest(req, res);
  };

  return { handlePost, handleGet, handleDelete };
};
