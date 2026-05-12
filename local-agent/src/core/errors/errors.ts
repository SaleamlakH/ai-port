/**
 * Core error definitions for Aiport.
 * Keeps runtime failures structured and machine-readable.
 * We avoid overengineering here — only basic categorized errors for now.
 */

export class ConfigError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor() {
    super('CONFIG_NOT_FOUND', 'aiport.config.json not found in project root');
  }
}

export class InvalidJsonError extends ConfigError {
  constructor() {
    super('INVALID_JSON', 'Invalid JSON in aiport.config.json');
  }
}

export class MissingApiKeyError extends ConfigError {
  constructor() {
    super('MISSING_API_KEY', 'AIPORT_API_KEY not found in .env');
  }
}

export class MissingLanguageError extends ConfigError {
  constructor() {
    super('MISSING_LANGUAGE', 'language is missing in aiport.config.json');
  }
}

export class UnsupportedLanguageError extends ConfigError {
  constructor() {
    super('UNSUPPORTED_LANGUAGE', 'Unsupported language (must be javascript or typescript)');
  }
}

export class InvalidCommandPolicyError extends ConfigError {
  constructor(command: string, policies: string[]) {
    super(
      'INVALID_COMMAND_POLICY',
      `Invalid command policy for "${command}", Must be ${policies.join(', ')}`,
    );
  }
}

export class ReaderError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardError';
  }
}

export class ExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorError';
  }
}
