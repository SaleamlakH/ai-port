/**
 * runCommand tool handler — forwards a terminal command to the local agent.
 * The agent enforces the allow/ask/block security rules — this handler only
 * routes the request and surfaces the result or a CommandBlockedError to the AI.
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

export const registerRunCommand = (
  server: McpServer,
  agentRegistry: ConnectionRegistry,
  sessionStore: SessionStore,
) => {
  server.registerTool(
    'run_command',
    {
      title: 'Run terminal command',
      description: `Runs a terminal command on the local machine and return stdout, stderr and exit code.
                 The local agent enforces security rules — blocked commands are rejected, unknown commands require developer approval before executing.`,
      inputSchema: {
        command: z.string().min(1),
      },
    },
    async ({ command }, context) => {
      const session = sessionStore.get(context.sessionId);
      if (!session) throw new InvalidSessionIdError();

      const apiKey = session.apiKey;
      if (!apiKey) throw new InvalidApiKeyError();

      if (!agentRegistry.isConnected(apiKey)) throw new AgentNotConnectedError();

      const response = await agentRegistry.send(apiKey, {
        tool: 'run_command',
        params: { command },
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
