/**
 * getFileAst tool handler — returns AST nodes for a requested file.
 * Forwards the file path to the local agent and returns parsed nodes
 * (functions, classes, imports, exports) without sending full file contents.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../agent/connections.js';
import z from 'zod';
import { getSession } from '../../routes/mcp.js';
import {
  AgentNotConnectedError,
  InvalidApiKeyError,
  InvalidSessionIdError,
} from '../../core/errors/errors.js';

export const registerGetFileAst = (server: McpServer, agentRegistry: ConnectionRegistry) => {
  server.registerTool(
    'get_file_ast',
    {
      title: 'Get file Abstract syntax tree',
      description:
        "Return AST nodes (imports, functions, classes, exports) for a specified file path. Use this to understand a file's structure before reading specific source code. Does not return full file contents.",
      inputSchema: {
        filePath: z.string().min(1),
      },
    },
    async ({ filePath }, context) => {
      const session = getSession(context.sessionId);
      if (!session) throw new InvalidSessionIdError();

      const apiKey = session.apiKey;
      if (!apiKey) throw new InvalidApiKeyError();

      if (!agentRegistry.isConnected(apiKey)) throw new AgentNotConnectedError();

      const response = await agentRegistry.send(apiKey, {
        tool: 'get_file_ast',
        params: { filePath },
      });

      if (!response.success) throw new Error(response.error ?? 'Unknown agent error');

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
