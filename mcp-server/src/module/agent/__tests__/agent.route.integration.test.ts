import { describe, it, expect, vi } from 'vitest';
import { createAgentWss } from '../agent.route';
import { createConnectionRegistry } from '../connections';
import { IncomingMessage } from 'node:http';
import { EventEmitter } from 'node:stream';
import { afterEach } from 'node:test';

const createMockSocket = () => {
  const socket = new EventEmitter() as any;

  socket.close = vi.fn().mockImplementation(() => {
    socket.emit('close');
  });

  return socket;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('websocket server', () => {
  it('closes the connection with status 4001 when API Key is missing', () => {
    const fakeSocket = createMockSocket();
    const registry = createConnectionRegistry();
    const req = { body: { apiKey: { rawKey: '' } } } as unknown as IncomingMessage;
    const wss = createAgentWss(registry);

    wss.emit('connection', fakeSocket, req);
    expect(fakeSocket.close).toHaveBeenCalledWith(4001, expect.any(String));
  });

  it('register connected client', () => {
    const fakeSocket = createMockSocket();
    const spyOnEvent = vi.spyOn(fakeSocket, 'on');

    const registry = createConnectionRegistry();

    const req = { body: { apiKey: { rawKey: 'valid-api-key' } } } as unknown as IncomingMessage;
    const wss = createAgentWss(registry);

    wss.emit('connection', fakeSocket, req);

    expect(spyOnEvent).toHaveBeenCalled();
    expect(registry.isConnected('valid-api-key')).toBe(true);
  });

  it('bind socket close and error events', () => {
    const fakeSocket = createMockSocket();
    const spyOnEvent = vi.spyOn(fakeSocket, 'on');

    const registry = createConnectionRegistry();
    const req = { body: { apiKey: { rawKey: 'valid-api-key' } } } as unknown as IncomingMessage;
    const wss = createAgentWss(registry);

    wss.emit('connection', fakeSocket, req);

    expect(spyOnEvent).toHaveBeenCalledWith('close', expect.any(Function));
    expect(spyOnEvent).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('unregister client on close', () => {
    const fakeSocket = createMockSocket();
    const registry = createConnectionRegistry();
    const req = { body: { apiKey: { rawKey: 'valid-api-key' } } } as unknown as IncomingMessage;
    const wss = createAgentWss(registry);

    wss.emit('connection', fakeSocket, req);

    fakeSocket.emit('close');

    expect(registry.isConnected('valid-api-key')).toBe(false);
  });

  it('unregister client on error', () => {
    const fakeSocket = createMockSocket();
    const registry = createConnectionRegistry();
    const req = { body: { apiKey: { rawKey: 'valid-api-key' } } } as unknown as IncomingMessage;
    const wss = createAgentWss(registry);

    wss.emit('connection', fakeSocket, req);

    fakeSocket.emit('error');

    expect(registry.isConnected('valid-api-key')).toBe(false);
    expect(fakeSocket.close).toHaveBeenCalledOnce();
  });

  it('connect with multiple clients simultaneously', () => {
    const fakeSocket1 = createMockSocket();
    const fakeSocket2 = createMockSocket();

    const spySocket1On = vi.spyOn(fakeSocket1, 'on');
    const spySocket2On = vi.spyOn(fakeSocket2, 'on');

    // Create unique request objects with different keys
    const req1 = { body: { apiKey: { rawKey: 'api-key-one' } } } as unknown as IncomingMessage;
    const req2 = { body: { apiKey: { rawKey: 'api-key-two' } } } as unknown as IncomingMessage;

    const registry = createConnectionRegistry();
    const wss = createAgentWss(registry);

    // Connect both clients
    wss.emit('connection', fakeSocket1, req1);
    wss.emit('connection', fakeSocket2, req2);

    // Assert both registered successfully
    expect(registry.isConnected('api-key-one')).toBe(true);
    expect(registry.isConnected('api-key-two')).toBe(true);

    // emit one doesn't close the other
    fakeSocket1.emit('close');

    expect(registry.isConnected('api-key-one')).toBe(false);
    expect(registry.isConnected('api-key-two')).toBe(true);
  });
});
