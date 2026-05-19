/**
 * Single entry point for command execution.
 * Wires the guard and runner together so callers never have to touch both directly.
 *
 * Flow: guard checks the command against config first — if blocked or denied, execution
 * stops immediately and a structured result is returned with no side effects.
 * Only approved or allowed commands reach the runner.
 *
 * Returns a unified ExecuteResult that covers all outcomes: the guard decision,
 * and if the command ran, the full stdout/stderr/exitCode from the runner.
 * The MCP tool layer consumes this directly without needing to know about guard or runner internals.
 */

import type { AiportConfig } from '../config/loader.js';
import { checkCommand, type GuardResult } from './guard.js';
import { runCommand, type RunResult } from './runner.js';

export interface ExecuteResult {
  command: string;
  decision: GuardResult['decision'];
  reason?: string;
  run?: RunResult;
}

export async function execute(
  command: string,
  config: AiportConfig,
  cwd?: string,
): Promise<ExecuteResult> {
  const guard = await checkCommand(command, config);

  if (guard.decision === 'blocked' || guard.decision === 'denied') {
    return {
      command: guard.command,
      decision: guard.decision,
      ...(guard.reason && { reason: guard.reason }),
    };
  }

  const run = await runCommand(guard.command, cwd);

  return {
    command: guard.command,
    decision: guard.decision,
    run,
  };
}
