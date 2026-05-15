class AiportError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export class InvalidTokenError extends AiportError {
  constructor() {
    super('INVALID_TOKEN', 'Invalid or expired token');
  }
}

export class DeveloperNotFoundError extends AiportError {
  constructor() {
    super('DEVELOPER_NOT_FOUND', 'Invalid email or password');
  }
}

export class DeveloperAlreadyExist extends AiportError {
  constructor() {
    super('DEVELOPER_ALREADY_EXISTS', 'Email already exist');
  }
}

export class InvalidApiKeyError extends AiportError {
  constructor() {
    super('AUTH_INVALID_KEY', 'API key is invalid or missing');
  }
}

export class RevokedApiKeyError extends AiportError {
  constructor() {
    super('AUTH_REVOKED_KEY', 'API key has been revoked');
  }
}

export class AgentNotConnectedError extends AiportError {
  constructor() {
    super('AGENT_NOT_CONNECTED', 'No local agent connected for this API key');
  }
}

export class FileNotFoundError extends AiportError {
  constructor(path: string) {
    super('FILE_NOT_FOUND', `File not found: ${path}`);
  }
}

export class NodeNotFoundError extends AiportError {
  constructor(identifier: string) {
    super('NODE_NOT_FOUND', `AST node not found: ${identifier}`);
  }
}

export class LineRangeOutOfBoundsError extends AiportError {
  constructor() {
    super('LINE_RANGE_OUT_OF_BOUNDS', 'Requested line range exceeds file length');
  }
}

export class CommandBlockedError extends AiportError {
  constructor(command: string) {
    super('COMMAND_BLOCKED', `Command is blocked by config: ${command}`);
  }
}

export class PatchApplicationError extends AiportError {
  constructor() {
    super('PATCH_FAILED', 'Failed to apply patch — file may have changed since AST was read');
  }
}

export class InvalidSessionIdError extends AiportError {
  constructor() {
    super('INVALID_SESSION_ID', 'Invalid or missing session ID');
  }
}
