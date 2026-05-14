import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { ConnectionRegistry } from '../agent/connections.js';
import { registerGetProjectStructure } from './getProjectStructure.js';
import { registerGetFileAst } from './getFileAst.js';
import { registerReadCode } from './readCode.js';
import { registerWriteFile } from './writeFile.js';
import { registerRunCommand } from './runCommand.js';
import type { SessionStore } from '../mcp/mcp.session.js';

export const registerTools = (
  server: McpServer,
  registry: ConnectionRegistry,
  sessionStore: SessionStore,
) => {
  registerGetProjectStructure(server, registry, sessionStore);
  registerGetFileAst(server, registry, sessionStore);
  registerReadCode(server, registry, sessionStore);
  registerWriteFile(server, registry, sessionStore);
  registerRunCommand(server, registry, sessionStore);
};
