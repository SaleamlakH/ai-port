/**
 * Manual smoke test for the connection registry.
 * works end-to-end with a real WebSocket server and client.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createConnectionRegistry } from '../connections.js';

const API_KEY = 'test-key';
const PORT = 9999;

const registry = createConnectionRegistry();
const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`[server] Websocket server listening on ws://localhost:${PORT}`);

  const agentSocket = new WebSocket(`ws://localhost:${PORT}`);

  wss.on('connection', (socket) => {
    console.log('[server] Agent connected - registering with API key');
    registry.register(API_KEY, socket);
    console.log('[server] isConnected:', registry.isConnected(API_KEY));
  });

  agentSocket.on('open', () => {
    console.log('[agent] Connected to server');

    agentSocket.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('[agent] received request:', message);

      const response = {
        id: message.id,
        success: true,
        data: { result: 'project structure here' },
      };

      agentSocket.send(JSON.stringify(response));
      console.log('[agent] sent message');
    });

    registry
      .send(API_KEY, { tool: 'getProjectStructure', params: {} })
      .then((response) => {
        console.log('[server] got response from agent:', response);
        cleanup();
      })
      .catch((err) => {
        console.error('[server] error:', err);
        cleanup();
      });
  });
});

function cleanup() {
  console.log('[server] cleaning up');
  registry.unregister(API_KEY);
  console.log('[server] isConnected after unregistered:', registry.isConnected(API_KEY));
  wss.close();
  process.exit(0);
}
