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

/**
 * Raised when file operations fail in reader layer.
 */
export class ReaderError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
