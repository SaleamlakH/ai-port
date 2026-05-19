import { describe, it, expect } from 'vitest';
import { runCommand } from '../runner.js';
import { ExecutorError } from '../../../core/errors/errors.js';

describe('runCommand', () => {
  // --- stdout ---

  it('captures stdout for a successful command', async () => {
    const result = await runCommand('node -e "process.stdout.write(\'hello\')"');

    expect(result.stdout).toBe('hello');
    expect(result.exitCode).toBe(0);
  });

  it('returns the command string in the result', async () => {
    const result = await runCommand('node -e "process.stdout.write(\'ok\')"');
    expect(result.command).toBe('node -e "process.stdout.write(\'ok\')"');
  });

  it('captures multiline stdout correctly', async () => {
    const result = await runCommand("node -e \"console.log('line1'); console.log('line2')\"");
    expect(result.stdout).toContain('line1');
    expect(result.stdout).toContain('line2');
  });

  // --- stderr ---

  it('captures stderr for a failing command', async () => {
    const result = await runCommand('node -e "process.stderr.write(\'err output\')"');
    expect(result.stderr).toBe('err output');
  });

  it('captures stderr from a node script that throws', async () => {
    const result = await runCommand('node -e "throw new Error(\'boom\')"');
    expect(result.stderr).toContain('boom');
    expect(result.exitCode).not.toBe(0);
  });

  // --- exit code ---

  it('returns exit code 0 for a successful command', async () => {
    const result = await runCommand('node -e "process.exit(0)"');
    expect(result.exitCode).toBe(0);
  });

  it('returns non-zero exit code for a failing command', async () => {
    const result = await runCommand('node -e "process.exit(1)"');
    expect(result.exitCode).toBe(1);
  });

  it('returns the exact exit code the process emits', async () => {
    const result = await runCommand('node -e "process.exit(42)"');
    expect(result.exitCode).toBe(42);
  });

  // --- cwd ---

  it('runs the command in the specified cwd', async () => {
    const result = await runCommand('node -e "process.stdout.write(process.cwd())"', '/tmp');
    expect(result.stdout).toBe('/tmp');
  });

  // --- spawn failure ---

  it('returns exit code 127 for a command that does not exist', async () => {
    const result = await runCommand('__this_command_does_not_exist__');
    expect(result.exitCode).toBe(127);
    expect(result.stderr).toContain('not found');
  });

  // --- input validation ---

  it('throws ExecutorError for an empty command string', async () => {
    await expect(runCommand('')).rejects.toThrow(ExecutorError);
  });

  it('throws ExecutorError for a whitespace-only command', async () => {
    await expect(runCommand('   ')).rejects.toThrow(ExecutorError);
  });

  it('throws ExecutorError for invalid cwd type', async () => {
    await expect(runCommand('node -e "1"', '')).rejects.toThrow(ExecutorError);
  });
});
