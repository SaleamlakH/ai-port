import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCommand } from '../guard.js';
import type { AiportConfig } from '../../config/loader.js';
import { GuardError } from '../../core/errors/errors.js';

// Mock readline/promises so tests never block on terminal input
vi.mock('readline/promises', () => ({
  default: {
    createInterface: vi.fn(),
  },
}));

import readline from 'readline/promises';

function mockPrompt(answer: string) {
  const question = vi.fn().mockResolvedValue(answer);
  const close = vi.fn();
  (readline.createInterface as ReturnType<typeof vi.fn>).mockReturnValue({
    question,
    close,
  });
  return { question, close };
}

const baseConfig: AiportConfig = {
  language: 'typescript',
  commands: {
    'npm test': 'allowed',
    'npm run build': 'allowed',
    'rm -rf /': 'blocked',
    'git push origin main': 'ask',
  },
};

describe('checkCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- allowed ---

  it('allows a command that exactly matches an allowed entry', async () => {
    const result = await checkCommand('npm test', baseConfig);
    expect(result.decision).toBe('allowed');
    expect(result.command).toBe('npm test');
    expect(readline.createInterface).not.toHaveBeenCalled();
  });

  it('allows another exact match from the allowed list', async () => {
    const result = await checkCommand('npm run build', baseConfig);
    expect(result.decision).toBe('allowed');
  });

  it('does NOT allow a command that only partially matches (base only)', async () => {
    // "npm" alone is not in config — should fall to ask path, not allowed
    mockPrompt('n');
    const result = await checkCommand('npm', baseConfig);
    expect(result.decision).toBe('denied');
  });

  // --- blocked ---

  it('blocks a command that exactly matches a blocked entry', async () => {
    const result = await checkCommand('rm -rf /', baseConfig);
    expect(result.decision).toBe('blocked');
    expect(result.reason).toMatch(/blocked/);
    expect(readline.createInterface).not.toHaveBeenCalled();
  });

  it('blocked result includes the full command string', async () => {
    const result = await checkCommand('rm -rf /', baseConfig);
    expect(result.command).toBe('rm -rf /');
  });

  it('does NOT block a command that only partially matches a blocked entry', async () => {
    // "rm" alone is not in config — falls to ask, not blocked
    mockPrompt('n');
    const result = await checkCommand('rm', baseConfig);
    expect(result.decision).toBe('denied');
  });

  // --- ask list + developer approves ---

  it('prompts developer for a command in the ask list', async () => {
    mockPrompt('y');
    const result = await checkCommand('git push origin main', baseConfig);
    expect(result.decision).toBe('approved');
    expect(result.command).toBe('git push origin main');
  });

  it('denies a command in the ask list when developer says no', async () => {
    mockPrompt('n');
    const result = await checkCommand('git push origin main', baseConfig);
    expect(result.decision).toBe('denied');
    expect(result.reason).toBeDefined();
  });

  it('denies when developer presses enter with no input (default no)', async () => {
    mockPrompt('');
    const result = await checkCommand('git push origin main', baseConfig);
    expect(result.decision).toBe('denied');
  });

  // --- unknown command ---

  it('prompts developer for a command not in any list', async () => {
    mockPrompt('y');
    const result = await checkCommand('pnpm install', baseConfig);
    expect(result.decision).toBe('approved');
  });

  it('denies an unknown command when developer says no', async () => {
    mockPrompt('N');
    const result = await checkCommand('pnpm install', baseConfig);
    expect(result.decision).toBe('denied');
    expect(result.reason).toMatch(/not in the project config/);
  });

  // --- prompt cleanup ---

  it('closes the readline interface after prompt', async () => {
    const { close } = mockPrompt('y');
    await checkCommand('git push origin main', baseConfig);
    expect(close).toHaveBeenCalled();
  });

  it('closes the readline interface even when developer denies', async () => {
    const { close } = mockPrompt('n');
    await checkCommand('git push origin main', baseConfig);
    expect(close).toHaveBeenCalled();
  });

  // --- input validation ---

  it('throws GuardError for an empty command string', async () => {
    await expect(checkCommand('', baseConfig)).rejects.toThrow(GuardError);
  });

  it('throws GuardError for a whitespace-only command', async () => {
    await expect(checkCommand('   ', baseConfig)).rejects.toThrow(GuardError);
  });
});
