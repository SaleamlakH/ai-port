// Executes a shell command and captures its output.
// This is the only place in the agent that touches child_process — everything else
// goes through here so execution behavior stays consistent and testable.
//
// Uses spawn via /bin/sh -c so the full command string is interpreted by the real shell —
// quotes, pipes, and shell builtins all work as expected. shell: false avoids Node's
// deprecation warning while still getting real shell behavior.
//
// stdout and stderr are piped: data is forwarded live to the developer's terminal
// AND collected into chunks for the returned RunResult. The developer sees output
// as it streams; the MCP layer gets the full captured result when the command exits.
//
// The runner has no opinion on whether a command should run — that's the guard's job.
// By the time a command reaches the runner, it has already been approved.
//
// cwd defaults to process.cwd() so callers don't have to think about it unless
// they need to run a command in a different directory.

import { spawn } from 'child_process';
import { ExecutorError } from '../../core/errors/errors.js';

export interface RunResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(command: string, cwd: string = process.cwd()): Promise<RunResult> {
  if (!command || typeof command !== 'string' || command.trim() === '') {
    throw new ExecutorError('Command must be a non-empty string');
  }

  if (!cwd || typeof cwd !== 'string') {
    throw new ExecutorError('cwd must be a non-empty string');
  }

  const trimmed = command.trim();

  return new Promise((resolve, reject) => {
    let child: ReturnType<typeof spawn>;

    try {
      child = spawn('/bin/sh', ['-c', trimmed], {
        cwd,
        shell: false,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      reject(new ExecutorError(`Failed to spawn command "${trimmed}": ${(err as Error).message}`));
      return;
    }

    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    child.stdout?.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk);
      stdoutChunks.push(chunk.toString());
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
      stderrChunks.push(chunk.toString());
    });

    child.on('error', (err) => {
      reject(new ExecutorError(`Command "${trimmed}" failed to run: ${err.message}`));
    });

    child.on('close', (code) => {
      resolve({
        command: trimmed,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        exitCode: code ?? 1,
      });
    });
  });
}
