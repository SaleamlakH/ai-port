/**
 * Provides shared validation utilities for filesystem operations.
 *
 * This exists to ensure all file access (read and write) follows
 * the same safety rules and prevents inconsistent validation logic
 * across different modules.
 *
 * The goal is not abstraction for its own sake, but consistency:
 * every filesystem operation must fail in the same predictable way
 * when given invalid input.
 */

import path from 'path';
import fs from 'fs/promises';
import { ReaderError } from '../../../core/errors/errors.js';

/**
 * Ensures a file path is safe and absolute.
 */
export function resolveSafePath(filePath: string): string {
  if (!filePath) {
    throw new ReaderError('INVALID_PATH', 'File path is required');
  }

  const resolved = path.resolve(filePath);

  // basic traversal guard (V1 minimal version)
  if (resolved.includes('..')) {
    throw new ReaderError('INVALID_PATH', 'Path traversal is not allowed');
  }

  return resolved;
}

/**
 * Ensures a file exists before performing operations.
 */
export async function assertFileExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    throw new ReaderError('FILE_NOT_FOUND', `File does not exist: ${filePath}`);
  }
}

/**
 * Validates a single line number.
 */

export function assertValidNumber(value: unknown, name: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ReaderError('INVALID_TYPE', `${name} must be a valid number`);
  }
}

/**
 * Validates a single line index (1-based).
 */
export function validateLineIndex(line: number, max: number) {
  if (line < 1 || line > max) {
    throw new ReaderError('INVALID_LINE', `Line ${line} is out of bounds (1-${max})`);
  }
}

/*
 * Validates a line ranges
 */
export function validateRangeShape(start: number, end: number) {
  if (start < 1 || end < 1 || start > end) {
    throw new ReaderError('INVALID_RANGE', `Invalid range ${start}-${end}`);
  }
}

export function validateRangeBounds(end: number, max: number) {
  if (end > max) {
    throw new ReaderError('OUT_OF_BOUNDS', `Range exceeds file length (max ${max})`);
  }
}
