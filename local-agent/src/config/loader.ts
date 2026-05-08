import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ConfigError } from '../core/errors/errors.js';

// config interfaces
export interface AiportConfig {
  language: 'javascript' | 'typescript';
  commands: Record<string, 'allowed' | 'ask' | 'blocked'>;
}

// loaded config interface
export interface LoadedConfig {
  config: AiportConfig;
  apiKey: string;
}

export function loadConfig(projectRoot: string = process.cwd()): LoadedConfig {
  const configPath = path.join(projectRoot, 'aiport.config.json');

  if (!fs.existsSync(configPath)) {
    throw new ConfigError('CONFIG_NOT_FOUND', 'airport.config.json not found in project root');
  }

  const raw = fs.readFileSync(configPath, 'utf-8');

  let parsed: AiportConfig;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ConfigError('INVALID_JSON', 'Invalid JSON in aiport.config.json');
  }

  // validate config
  validateConfig(parsed);

  // load .env
  dotenv.config({ path: path.join(projectRoot, '.env') });
  const apiKey = process.env.AIPORT_API_KEY;

  if (!apiKey) {
    throw new ConfigError('MISSING_API_KEY', 'AIPORT_API_KEY not found in .env');
  }

  return {
    apiKey,
    config: parsed,
  };
}

function validateConfig(config: AiportConfig) {
  if (!config.language) {
    throw new Error("Missing 'language' in config");
  }

  if (!['javascript', 'typescript'].includes(config.language)) {
    throw new ConfigError(
      'UNSUPPORTED_LANGUAGE',
      "Unsupported language (must be 'javascript' or 'typescript')",
    );
  }

  // validate commands
  const validPolicies = ['allowed', 'ask', 'blocked'];

  for (const [cmd, policy] of Object.entries(config.commands)) {
    if (!validPolicies.includes(policy)) {
      throw new ConfigError(
        'INVALID_COMMAND_POLICY',
        `Invalid command policy for "${cmd}". Must be one of: ${validPolicies.join(', ')}`,
      );
    }
  }
}
