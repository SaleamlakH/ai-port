/**
 * MCP route handlers — manages Streamable HTTP sessions
 * POST creates or reuses sessions, GET opens the SSE notification stream,
 * DELETE terminates sessions. Auth is validated on every POST before any
 * session logic runs. Each session is keyed by a UUID.
 */

import { Router, type Request, type Response } from 'express';
import type { AuthService } from '../module/auth/auth.service.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { randomUUID } from 'node:crypto';
import { InvalidSessionIdError } from '../core/errors/errors.js';
import { registerGetProjectStructure } from '../module/tools/getProjectStructure.js';
import { type ConnectionRegistry } from '../module/agent/connections.js';
import { registerReadCode } from '../module/tools/readCode.js';
import { registerGetFileAst } from '../module/tools/getFileAst.js';
import { registerWriteFile } from '../module/tools/writeFile.js';
import { registerRunCommand } from '../module/tools/runCommand.js';

export interface Session {
  apiKey: string;
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

const session: Record<string, Session> = {};

export const getSession = (sid?: string) => {
  if (!sid) return undefined;
  return session[sid];
};

const deleteSession = (sid?: string) => {
  if (!sid) return;
  delete session[sid];
};

export const createMcpRouter = (authService: AuthService, registry: ConnectionRegistry) => {
  const mcpRouter = Router();

  // Handle POST requests for client-to-server communication
  mcpRouter.post('/mcp/:apiKey', async (req: Request, res: Response) => {
    const { apiKey } = req.params;

    // authentication
    // await authService.validateApiKey(apiKey as string);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const existingSession = getSession(sessionId);

    if (existingSession) {
      await existingSession.transport.handleRequest(req, res, req.body);
      return;
    }

    // create server, register tools and transport
    if (!sessionId && isInitializeRequest(req.body)) {
      const server = new McpServer({ name: 'aiport', version: '1.0.0' });

      // register tools,
      registerGetProjectStructure(server, registry);
      registerGetFileAst(server, registry);
      registerReadCode(server, registry);
      registerWriteFile(server, registry);
      registerRunCommand(server, registry);

      let transport: StreamableHTTPServerTransport;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),

        onsessioninitialized: (sessionId) => {
          // save transport by session id
          session[sessionId] = { apiKey: apiKey as string, transport, server };
        },
      });

      transport.onclose = () => {
        deleteSession(transport.sessionId);
      };

      await server.connect(transport as any);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    throw new InvalidSessionIdError();
  });

  // Handle GET requests for server-to-client notifications via SSE
  mcpRouter.get('/mcp/:apiKey', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const session = getSession(sessionId);

    if (!session) throw new InvalidSessionIdError();

    res.on('close', () => {
      session.transport.close();
    });

    await session.transport.handleRequest(req, res);
  });

  // Handle DELETE requests for session termination
  mcpRouter.delete('/mcp/:apiKey', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const session = getSession(sessionId);

    if (!session) throw new InvalidSessionIdError();
    await session.transport.handleRequest(req, res);
  });

  return mcpRouter;
};
