/**
 * Entry point — imports the configured Express app and starts the HTTP server.
 */

import { ServerResponse } from 'http';
import { agentRegistry, apiKeyAuthMw, app, jwtAuthMw } from './app.js';
import { createAgentWss, handleAgentUpgrade } from './module/agent/agent.route.js';
import { InvalidApiKeyError } from './core/errors/errors.js';
import type { ApiKey } from './core/types/db.js';

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, (err) => {
  if (err) return console.error(err);

  console.log(`started on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// websocket server
const agentWss = createAgentWss(agentRegistry);

server.on('upgrade', async (req, socket, head) => {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  if (pathname !== '/agent') return socket.destroy();

  const res = new ServerResponse(req);

  try {
    await jwtAuthMw(req as any, res as any, () => {
      Promise.resolve();
    });

    await apiKeyAuthMw(req as any, res as any, () => {
      Promise.resolve();
    });

    const developerId = (req as any).body.developer.id;
    const apiKey: ApiKey = (req as any).body.apiKey;

    if (developerId !== apiKey.developerId) throw new InvalidApiKeyError();

    handleAgentUpgrade(agentWss, req, socket, head);
  } catch (error) {
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
    socket.destroy();
  }
});
