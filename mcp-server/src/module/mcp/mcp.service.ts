import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../agent/connections.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { randomUUID } from 'crypto';
import type { Session, SessionStore } from './mcp.session.js';
import { registerTools } from '../tools/registerTools.js';
import { InvalidSessionIdError } from '../../core/errors/errors.js';

export type McpService = ReturnType<typeof createMcpService>;

export const createMcpService = (sessionStore: SessionStore, registry: ConnectionRegistry) => {
  const getOrCreateSession = (
    apiKey: string,
    sessionId: string | undefined,
    initializeRequest: boolean,
  ): Session => {
    // existing session check
    const existingSession = sessionStore.get(sessionId);
    if (existingSession) return existingSession;

    // create session
    if (!sessionId && initializeRequest) {
      const server = new McpServer({ name: 'aiport', version: '1.0.0' });

      // register tools,
      registerTools(server, registry, sessionStore);

      let transport: StreamableHTTPServerTransport;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),

        onsessioninitialized: (sessionId) => {
          // save transport by session id
          sessionStore.add(sessionId, { apiKey, transport, server });
        },
      });

      transport.onclose = () => {
        sessionStore.delete(transport.sessionId);
      };

      return { apiKey, server, transport };
    }

    throw new InvalidSessionIdError();
  };

  return { getOrCreateSession };
};
