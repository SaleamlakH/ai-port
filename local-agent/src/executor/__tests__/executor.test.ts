/**
 * Tests for the unified execute() function.
 * Guard is mocked to isolate routing logic — we test that execute() correctly
 * calls or skips the runner based on the guard decision, not guard internals.
 * Runner is mocked to avoid real child_process usage in unit tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execute } from '../index.js';
import type { AiportConfig } from '../../config/loader.js';

vi.mock('../guard');
vi.mock('../runner');

import { checkCommand } from '../guard.js';
import { runCommand } from '../runner.js';

const baseConfig: AiportConfig = {
  language: 'typescript',
  commands: {
    'npm test': 'allowed',
    'rm -rf /': 'blocked',
  },
};

const mockRun = {
  command: 'npm test',
  stdout: 'all tests passed',
  stderr: '',
  exitCode: 0,
};

describe('execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- allowed ---

  it('calls runner when guard returns allowed', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'allowed',
      command: 'npm test',
    });
    vi.mocked(runCommand).mockResolvedValue(mockRun);

    const result = await execute('npm test', baseConfig);

    expect(runCommand).toHaveBeenCalledWith('npm test', undefined);
    expect(result.decision).toBe('allowed');
    expect(result.run).toEqual(mockRun);
  });

  // --- approved ---

  it('calls runner when guard returns approved', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'approved',
      command: 'git status',
    });
    vi.mocked(runCommand).mockResolvedValue({
      ...mockRun,
      command: 'git status',
    });

    const result = await execute('git status', baseConfig);

    expect(runCommand).toHaveBeenCalledWith('git status', undefined);
    expect(result.decision).toBe('approved');
    expect(result.run).toBeDefined();
  });

  // --- blocked ---

  it('does not call runner when guard returns blocked', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'blocked',
      command: 'rm -rf /',
      reason: 'Command "rm -rf /" is blocked by project config',
    });

    const result = await execute('rm -rf /', baseConfig);

    expect(runCommand).not.toHaveBeenCalled();
    expect(result.decision).toBe('blocked');
    expect(result.reason).toBeDefined();
    expect(result.run).toBeUndefined();
  });

  // --- denied ---

  it('does not call runner when guard returns denied', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'denied',
      command: 'pnpm install',
      reason: 'Developer denied: Command "pnpm install" is not in the project config',
    });

    const result = await execute('pnpm install', baseConfig);

    expect(runCommand).not.toHaveBeenCalled();
    expect(result.decision).toBe('denied');
    expect(result.reason).toBeDefined();
    expect(result.run).toBeUndefined();
  });

  // --- cwd forwarding ---

  it('forwards cwd to runner when provided', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'allowed',
      command: 'npm test',
    });
    vi.mocked(runCommand).mockResolvedValue(mockRun);

    await execute('npm test', baseConfig, '/home/user/project');

    expect(runCommand).toHaveBeenCalledWith('npm test', '/home/user/project');
  });

  it('forwards undefined cwd to runner when not provided', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'allowed',
      command: 'npm test',
    });
    vi.mocked(runCommand).mockResolvedValue(mockRun);

    await execute('npm test', baseConfig);

    expect(runCommand).toHaveBeenCalledWith('npm test', undefined);
  });

  // --- result shape ---

  it('result includes command string from guard', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'allowed',
      command: 'npm test',
    });
    vi.mocked(runCommand).mockResolvedValue(mockRun);

    const result = await execute('npm test', baseConfig);

    expect(result.command).toBe('npm test');
  });

  it('blocked result has no run field', async () => {
    vi.mocked(checkCommand).mockResolvedValue({
      decision: 'blocked',
      command: 'rm -rf /',
      reason: 'blocked',
    });

    const result = await execute('rm -rf /', baseConfig);

    expect(result).not.toHaveProperty('run');
  });
});
