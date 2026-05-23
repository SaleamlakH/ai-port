import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../loader.js';
import path from 'path';
import fs from 'fs';

const testDir = path.join(__dirname, 'tmp');
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  fs.mkdirSync(testDir, { recursive: true });
  vi.stubEnv('AIPORT_MCP_SERVER_URL', 'http://localhost:3000/');
});

afterEach(() => {
  process.env = originalEnv;
  fs.rmSync(testDir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

function writeConfig(data: any) {
  fs.writeFileSync(path.join(testDir, 'aiport.config.json'), JSON.stringify(data, null, 2));
}

function writeEnv(content: string) {
  fs.writeFileSync(path.join(testDir, '.env'), content);
}

describe('Config loader', () => {
  it('loads valid config and api key', () => {
    writeConfig({
      language: 'typescript',
      mcpServerUrl: 'http://localhost:3000',
      commands: {
        'npm test': 'allowed',
      },
    });

    writeEnv('AIPORT_API_KEY=test-key');

    const result = loadConfig(testDir);

    expect(result.apiKey).toBe('test-key');
    expect(result.config.language).toBe('typescript');
  });

  it('throws if config missing', () => {
    expect(() => loadConfig(testDir)).toThrow();
  });

  it('throws if api key missing', () => {
    writeConfig({
      language: 'typescript',
      mcpServerUrl: 'http://localhost:3000',
      commands: {},
    });

    expect(() => loadConfig(testDir)).toThrow();
  });

  it('throws on invalid command policy', () => {
    writeConfig({
      language: 'typescript',
      mcpServerUrl: 'http://localhost:3000',
      commands: {
        'npm test': 'invalid',
      },
    });

    writeEnv('AIPORT_API_KEY=test-key');

    expect(() => loadConfig(testDir)).toThrow();
  });

  // language support
  it('throws on unsupported language', () => {
    writeConfig({
      language: 'python',
      mcpServerUrl: 'http://localhost:3000',
      commands: {},
    });

    writeEnv('AIPORT_API_KEY=test-key');
    expect(() => loadConfig(testDir)).toThrow();
  });
});
