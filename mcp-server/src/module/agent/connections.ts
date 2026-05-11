/**
 * Local agent connection registry — holds the active WebSocket connection
 * for each developer, keyed by API key. When a tool call arrives from mcp client,
 * the tool handler calls sendToAgent() which finds the right connection,
 * sends the instruction, and waits for the result. One API key = one active
 * agent connection at a time. New connections replace old ones silently.
 */

import { WebSocket } from 'ws';
import { AgentNotConnectedError } from '../../core/errors/errors.js';
import { randomUUID } from 'node:crypto';

export interface AgentRequest {
  tool: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface PendingRequest {
  resolve: (value: AgentResponse) => void;
  reject: (reason: Error) => void;
}

interface AgentConnection {
  socket: WebSocket;
  pending: Map<string, PendingRequest>;
}

export interface ConnectionRegistry {
  register(apiKey: string, socket: WebSocket): void;
  unregister(apiKey: string): void;
  send(apiKey: string, req: AgentRequest): Promise<AgentResponse>;
  isConnected(apiKey: string): boolean;
}

export const createConnectionRegistry = (): ConnectionRegistry => {
  const connections = new Map<string, AgentConnection>();

  const register = (apiKey: string, socket: WebSocket): void => {
    // replace any existing connection
    const existingConnection = connections.get(apiKey);
    if (existingConnection) existingConnection.socket.close();

    const connection: AgentConnection = {
      socket,
      pending: new Map(),
    };

    connections.set(apiKey, connection);

    socket.on('message', (raw: Buffer) => {
      const message = JSON.parse(raw.toString()) as { id: string } & AgentResponse;
      const pending = connection.pending.get(message.id);

      if (!pending) return;
      connection.pending.delete(message.id);
      pending.resolve(message);
    });

    socket.on('close', () => {
      for (const [, pending] of connection.pending) {
        pending.reject(new AgentNotConnectedError());
      }

      connections.delete(apiKey);
    });
  };

  const unregister = (apikey: string): void => {
    const connection = connections.get(apikey);
    if (!connection) return;
    connection.socket.close();
    connections.delete(apikey);
  };

  const send = (apiKey: string, req: AgentRequest): Promise<AgentResponse> => {
    const connection = connections.get(apiKey);
    if (!connection) throw new AgentNotConnectedError();

    return new Promise((resolve, reject) => {
      const id = randomUUID();
      connection.pending.set(id, { resolve, reject });
      connection.socket.send(JSON.stringify({ id, ...req }));
    });
  };

  const isConnected = (apiKey: string): boolean => {
    return connections.has(apiKey);
  };

  return { register, unregister, send, isConnected };
};
