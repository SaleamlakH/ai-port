import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { InvalidSessionIdError } from '../../core/errors/errors.js';

export interface Session {
  apiKey: string;
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

export interface SessionStore {
  get(sid?: string): Session | undefined;
  getOrThrow(sid: string): Session;
  add(sid: string, session: Session): void;
  delete(sid?: string): void;
}

export const createInMemorySessionStore = (): SessionStore => {
  const store: Record<string, Session> = {};

  return {
    get(sid?: string) {
      return sid ? store[sid] : undefined;
    },

    getOrThrow(sid: string) {
      const session = store[sid];

      if (!session) throw new InvalidSessionIdError();
      return session;
    },

    add(sid: string, session: Session) {
      store[sid] = session;
    },

    delete(sid?: string) {
      if (sid) delete store[sid];
    },
  };
};
