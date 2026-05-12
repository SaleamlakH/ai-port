import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  ConfigNotFoundError,
  InvalidCommandPolicyError,
  InvalidJsonError,
  MissingApiKeyError,
  MissingLanguageError,
  UnsupportedLanguageError,
} from '../core/errors/errors.js';

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

  if (!fs.existsSync(configPath)) throw new ConfigNotFoundError();

  const raw = fs.readFileSync(configPath, 'utf-8');

  let parsed: AiportConfig;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new InvalidJsonError();
  }

  // validate config
  validateConfig(parsed);

  // load .env
  dotenv.config({ path: path.join(projectRoot, '.env') });
  const apiKey = process.env.AIPORT_API_KEY;

  if (!apiKey) throw new MissingApiKeyError();

  return {
    apiKey,
    config: parsed,
  };
}

function validateConfig(config: AiportConfig) {
  if (!config.language) throw new MissingLanguageError();

  if (!['javascript', 'typescript'].includes(config.language)) {
    throw new UnsupportedLanguageError();
  }

  // validate commands
  const validPolicies = ['allowed', 'ask', 'blocked'];

  for (const [cmd, policy] of Object.entries(config.commands)) {
    if (!validPolicies.includes(policy)) {
      throw new InvalidCommandPolicyError(cmd, validPolicies);
    }
  }
}
