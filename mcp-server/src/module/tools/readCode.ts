/**
 * readCode tool handler — returns source code from a file in three modes:
 * by AST node name, by line range, or full file when no scope is given.
 * All three modes go through this single tool via different parameter combinations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../../core/types/agent-connection.js';
import z from 'zod';
import {
  AgentNotConnectedError,
  InvalidApiKeyError,
  InvalidSessionIdError,
} from '../../core/errors/errors.js';
import type { SessionStore } from '../mcp/mcp.session.js';

export const registerReadCode = (
  server: McpServer,
  agentRegistry: ConnectionRegistry,
  sessionStore: SessionStore,
) => {
  server.registerTool(
    'read_code',
    {
      title: 'Read file code',
      description: 'Return a source code of a give node or line range or the whole file',
      inputSchema: {
        filePath: z.string().min(1),
        nodeName: z.string().optional(),
        start: z.number().int().positive().optional(),
        end: z.number().int().positive().optional(),
      },
    },
    async (params, context) => {
      const session = sessionStore.get(context.sessionId);
      if (!session) throw new InvalidSessionIdError();

      const apiKey = session.apiKey;
      if (!apiKey) throw new InvalidApiKeyError();

      if (!agentRegistry.isConnected) throw new AgentNotConnectedError();

      const response = await agentRegistry.send(apiKey, {
        tool: 'read_code',
        params,
      });

      if (!response.success) throw new Error(response.error ?? 'Agent Error');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );
};
