/**
 * getProjectStructure tool handler — exposes the project directory tree to the AI.
 * Validates the incoming request, authenticates the API key from the session,
 * forwards the request to the local agent via the connection registry, and returns
 * the node graph.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../agent/connections.js';
import {
  AgentNotConnectedError,
  InvalidApiKeyError,
  InvalidSessionIdError,
} from '../../core/errors/errors.js';
import { getSession } from '../../routes/mcp.js';

export const registerGetProjectStructure = (server: McpServer, registry: ConnectionRegistry) => {
  server.registerTool(
    'get_project_structure',
    {
      title: 'Get project structure',
      description:
        'Returns a structured node graph of the project directory tree — folders, and files. Call this first to understand the project layout before requesting any file AST or source code.',
    },
    async (context) => {
      const session = getSession(context.sessionId);
      if (!session) throw new InvalidSessionIdError();

      const apiKey = session.apiKey;
      if (!apiKey) throw new InvalidApiKeyError();

      if (!registry.isConnected) throw new AgentNotConnectedError();

      const response = await registry.send(apiKey, {
        tool: 'get_project_structure',
        params: {},
      });

      if (!response.success) throw new Error('Unknown agent error');

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
