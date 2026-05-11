/**
 * Connection registry tests — verifies agent registration, routing, and
 * disconnect behavior using a mock WebSocket. No real network required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { createConnectionRegistry } from '../connections.js';
import { AgentNotConnectedError } from '../../../core/errors/errors.js';

// minimal WebSocket mock — just an EventEmitter with a send and close spy
function createMockSocket() {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    send: vi.fn(),
    close: vi.fn(),
  });
}

type MockSocket = ReturnType<typeof createMockSocket>;

let registry: ReturnType<typeof createConnectionRegistry>;
let socket: MockSocket;

beforeEach(() => {
  registry = createConnectionRegistry();
  socket = createMockSocket();
});

describe('register', () => {
  it('registers a new agent connection', () => {
    registry.register('key-1', socket as any);
    expect(registry.isConnected('key-1')).toBe(true);
  });

  it('replaces existing connection for the same API key', () => {
    const oldSocket = createMockSocket();
    registry.register('key-1', oldSocket as any);
    registry.register('key-1', socket as any);

    expect(oldSocket.close).toHaveBeenCalledOnce();
    expect(registry.isConnected('key-1')).toBe(true);
  });
});

describe('unregister', () => {
  it('removes connection from registry', () => {
    registry.register('key-1', socket as any);
    registry.unregister('key-1');
    expect(registry.isConnected('key-1')).toBe(false);
  });

  it('closes the socket on unregister', () => {
    registry.register('key-1', socket as any);
    registry.unregister('key-1');
    expect(socket.close).toHaveBeenCalledOnce();
  });

  it('does nothing if agent is not registered', () => {
    expect(() => registry.unregister('unknown')).not.toThrow();
  });
});

describe('isConnected', () => {
  it('returns true for a registered agent', () => {
    registry.register('key-1', socket as any);
    expect(registry.isConnected('key-1')).toBe(true);
  });

  it('returns false for an unknown API key', () => {
    expect(registry.isConnected('unknown')).toBe(false);
  });

  it('returns false after agent disconnects', () => {
    registry.register('key-1', socket as any);
    socket.emit('close');
    expect(registry.isConnected('key-1')).toBe(false);
  });
});

describe('send', () => {
  it('throws AgentNotConnectedError when no agent is registered', () => {
    expect(() => registry.send('unknown', { tool: 'test', params: {} })).toThrow(
      AgentNotConnectedError,
    );
  });

  it('sends a message to the correct agent socket', () => {
    registry.register('key-1', socket as any);
    registry.send('key-1', { tool: 'get_project_structure', params: {} });

    expect(socket.send).toHaveBeenCalledOnce();
    const sent = JSON.parse(socket.send.mock.calls[0][0]);
    expect(sent.tool).toBe('get_project_structure');
    expect(sent.id).toBeDefined();
  });

  it('resolves with the agent response when message is received', async () => {
    registry.register('key-1', socket as any);

    const promise = registry.send('key-1', { tool: 'get_project_structure', params: {} });

    // capture the request id from what was sent
    const sent = JSON.parse(socket.send.mock.calls[0][0]);

    // simulate agent responding
    socket.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          id: sent.id,
          success: true,
          data: { root: 'myproject' },
        }),
      ),
    );

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ root: 'myproject' });
  });

  it('rejects all pending requests when agent disconnects', async () => {
    registry.register('key-1', socket as any);

    const promise = registry.send('key-1', { tool: 'get_project_structure', params: {} });

    socket.emit('close');

    await expect(promise).rejects.toThrow(AgentNotConnectedError);
  });

  it('ignores messages with unknown request id', async () => {
    registry.register('key-1', socket as any);

    registry.send('key-1', { tool: 'get_project_structure', params: {} });

    // emit a message with a wrong id — should not throw or resolve
    expect(() => {
      socket.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            id: 'wrong-id',
            success: true,
            data: {},
          }),
        ),
      );
    }).not.toThrow();
  });
});
