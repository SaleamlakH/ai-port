// Decides whether a command is allowed to run before the runner ever sees it.
// Sits between the MCP tool layer and the runner — every command passes through here.
//
// Three outcomes are possible: allowed (run immediately), blocked (reject with no execution),
// or ask (prompt the developer in the terminal and wait for their yes/no).
// Commands not listed in config fall into the ask path — unknown is never silently allowed.
//
// Lookup is exact match on the full trimmed command string — "npm test" must appear
// in config as "npm test", not just "npm". No base command extraction, no fallback.
//
// Uses readline/promises for terminal prompts so the developer stays in control
// even when the AI is driving. The guard has no opinion on what commands do —
// it only enforces what the config says.

import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import type { AiportConfig } from '../config/loader.js';
import { GuardError } from '../core/errors/errors.js';

export type GuardDecision = 'allowed' | 'blocked' | 'approved' | 'denied';

export interface GuardResult {
  decision: GuardDecision;
  command: string;
  reason?: string;
}

export async function checkCommand(command: string, config: AiportConfig): Promise<GuardResult> {
  if (!command || typeof command !== 'string' || command.trim() === '') {
    throw new GuardError('Command must be a non-empty string');
  }

  const trimmed = command.trim();
  const verdict = config.commands[trimmed];

  if (verdict === 'allowed') {
    return { decision: 'allowed', command: trimmed };
  }

  if (verdict === 'blocked') {
    return {
      decision: 'blocked',
      command: trimmed,
      reason: `Command "${trimmed}" is blocked by project config`,
    };
  }

  // verdict === "ask" or undefined (unknown) — both require developer approval
  const reason =
    verdict === 'ask'
      ? `Command "${trimmed}" requires explicit approval (ask list)`
      : `Command "${trimmed}" is not in the project config`;

  const approved = await promptDeveloper(trimmed, reason);

  return {
    decision: approved ? 'approved' : 'denied',
    command: trimmed,
    ...(!approved && { reason: `Developer denied: ${reason}` }),
  };
}

async function promptDeveloper(command: string, reason: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });

  try {
    console.log(`\n ${reason}`);
    const answer = await rl.question(`Allow command to run? "${command}" [y/N]: `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}
