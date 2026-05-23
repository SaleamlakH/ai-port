/**
 * Bridge client — connects the local agent to the hosted MCP server via WebSocket.
 * Reads API key and MCP server URL directly from environment variables.
 * Listens for incoming tool call instructions, dispatches them to the correct
 * local handler, and sends results back. Reconnects automatically on unexpected
 * disconnect — stops only when the agent exits.
 */

import { WebSocket } from 'ws';
import type { LoadedConfig } from '../config/loader.js';
import { dispatch } from './dispatch.js';

export interface BridgeClient {
  connect(accessToken: string): void;
  disconnect(): void;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  code?: string;
}

const RECONNECT_DELAY_MS = 3000;

export const createBridgeClient = (config: LoadedConfig): BridgeClient => {
  let socket: WebSocket | null = null;
  let stopped = false;

  const connect = (accessToken: string) => {
    stopped = false;
    open(accessToken);
  };

  const disconnect = () => {
    stopped = true;
    socket?.close();
    socket = null;
  };

  const open = (accessToken: string) => {
    const wsUrl = `${config.mcpServerUrl.replace(/^http/, 'ws')}/agent`;
    socket = new WebSocket(wsUrl, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-api-key': config.apiKey,
      },
    });

    socket.on('open', () => {
      console.log('[aiport] Connected to MCP server.');
    });

    socket.on('message', async (data) => {
      let parsed: { id: string; tool: string; params: Record<string, unknown> };

      try {
        parsed = await JSON.parse(data.toString());
      } catch (error) {
        console.error('[aiport] Received malformed message - ignored');
        return;
      }

      const { id, tool, params } = parsed;
      try {
        const result = await dispatch({ tool, params, config: config.config });
        send({ id, success: true, data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const code = (error as any).code ?? 'INTERNAL_ERROR';
        send({ id, success: false, error: message, code });
      }
    });

    socket.on('close', () => {
      console.error('[aiport] Disconnected from MCP server.');
      if (!stopped) {
        console.log(`[aiport] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
        setTimeout(open, RECONNECT_DELAY_MS);
      }
    });

    socket.on('error', (err) => {
      console.error('[aiport] WebSocket error:', err.message);
    });
  };

  const send = (payload: unknown): void => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  return { connect, disconnect };
};
