import type WebSocket from 'ws';

export interface AgentRequest {
  tool: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ConnectionRegistry {
  register(apiKey: string, socket: WebSocket): void;
  unregister(apiKey: string): void;
  send(apiKey: string, req: AgentRequest): Promise<AgentResponse>;
  isConnected(apiKey: string): boolean;
}
