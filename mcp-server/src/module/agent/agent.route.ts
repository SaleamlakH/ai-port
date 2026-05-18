/**
 * Agent WebSocket route — accepts incoming connections from local agents.
 * Each agent authenticates via API key in the URL path and is registered
 * in the connection registry for the duration of the session. Replaces any
 * existing connection for the same key. Cleans up on disconnect automatically.
 * Auth is validated before registration — unauthenticated agents are rejected immediately.
 */

import WebSocket, { WebSocketServer } from 'ws';
import type { ConnectionRegistry } from '../../core/types/agent-connection.js';
import type { IncomingMessage } from 'http';

export const createAgentWss = (agentRegistry: ConnectionRegistry): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const apiKey = (req as any).body.apiKey.rawKey;

    if (!apiKey) {
      socket.close(4001, 'Missing API Key');
      return;
    }

    agentRegistry.register(apiKey, socket);

    socket.on('close', () => {
      agentRegistry.unregister(apiKey);
    });

    socket.on('error', () => {
      agentRegistry.unregister(apiKey);
    });
  });

  return wss;
};

export const handleAgentUpgrade = (
  wss: WebSocketServer,
  req: IncomingMessage,
  socket: import('stream').Duplex,
  head: Buffer,
) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
};
