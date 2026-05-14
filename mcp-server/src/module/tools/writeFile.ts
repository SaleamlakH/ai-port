/**
 * writeFile tool handler — forwards a line-level patch to the local agent.
 * Three operations: insert, overwrite, delete. The agent applies the patch
 * exactly as received — no interpretation or validation of content here.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../agent/connections.js';
import z from 'zod';
import {
  AgentNotConnectedError,
  InvalidApiKeyError,
  InvalidSessionIdError,
} from '../../core/errors/errors.js';
import type { SessionStore } from '../mcp/mcp.session.js';

export const registerWriteFile = (
  server: McpServer,
  agentRegistry: ConnectionRegistry,
  sessionStore: SessionStore,
) => {
  server.registerTool(
    'write_file',
    {
      title: 'Write code into file',
      description: ` 
        Applies a line-level path to a file on the local machine. 
        Operations: 'insert' adds lines at startLine, 'overwrite' replaces lines from startLine to endLine, 'delete' removes lines from startLine to endLine. 
        Always read the current file state before sending a patch.`,
      inputSchema: {
        filePath: z.string().min(1),
        operation: z.enum(['insert', 'overwrite', 'delete']),
        start: z.number().int().positive(),
        end: z.number().int().positive().optional(),
        content: z.array(z.string()).optional(),
      },
    },
    async (params, context) => {
      const session = sessionStore.get(context.sessionId);
      if (!session) throw new InvalidSessionIdError();

      const apiKey = session.apiKey;
      if (!apiKey) throw new InvalidApiKeyError();

      if (!agentRegistry.isConnected(apiKey)) throw new AgentNotConnectedError();

      const response = await agentRegistry.send(apiKey, {
        tool: 'write_file',
        params,
      });

      if (!response.success) throw new Error(response.error ?? 'Agent error');

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
