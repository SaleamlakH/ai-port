/**
 * Entry point — imports the configured Express app and starts the HTTP server.
 */

import { agentRegistry, app } from './app.js';
import { createAgentWss, handleAgentUpgrade } from './routes/agent.js';

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

server.on('upgrade', (req, socket, head) => {
  if (!req.url) return socket.destroy();
  handleAgentUpgrade(agentWss, req, socket, head);
});
