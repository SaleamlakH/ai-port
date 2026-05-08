/**
 * This module is responsible for deterministic, line-based file mutations.
 *
 * Why this exists:
 * - AI must not directly edit files or use diff-based logic
 * - All mutations must be explicit and predictable (insert / overwrite / delete)
 * - Ensures safe, traceable changes without hidden transformations
 *
 * Key design decisions:
 * - Line-based operations only (NOT character-based, NOT AST-based)
 * - No patch diffs or git semantics
 * - No caching or state tracking
 * - Each operation fully reads and rewrites file content deterministically
 */

import fs from 'fs/promises';
import path from 'path';
import { ReaderError } from '../core/errors/errors.js';

export type WriterOperation = 'insert' | 'overwrite' | 'delete';

export interface WriteResult {
  success: boolean;
  path: string;
  operation: WriterOperation;
  affectedLines: number[];
}

/* --------------------------------------------------
   PUBLIC API
-------------------------------------------------- */

/**
 * Insert lines at a specific position (1-based index)
 */
export async function insertLines(
  filePath: string,
  line: number,
  content: string[],
): Promise<WriteResult> {
  const absPath = resolvePath(filePath);

  const lines = await readLines(absPath);

  validateLine(line, lines.length + 1);

  const newLines = [...lines.slice(0, line - 1), ...content, ...lines.slice(line - 1)];

  await writeLines(absPath, newLines);

  return {
    success: true,
    path: absPath,
    operation: 'insert',
    affectedLines: range(line, line + content.length - 1),
  };
}

/**
 * Overwrite a range of lines (inclusive, 1-based)
 */
export async function overwriteLines(
  filePath: string,
  start: number,
  end: number,
  content: string[],
): Promise<WriteResult> {
  const absPath = resolvePath(filePath);

  const lines = await readLines(absPath);

  validateRange(start, end, lines.length);

  const newLines = [...lines.slice(0, start - 1), ...content, ...lines.slice(end)];

  await writeLines(absPath, newLines);

  return {
    success: true,
    path: absPath,
    operation: 'overwrite',
    affectedLines: range(start, start + content.length - 1),
  };
}

/**
 * Delete a range of lines (inclusive, 1-based)
 */
export async function deleteLines(
  filePath: string,
  start: number,
  end: number,
): Promise<WriteResult> {
  const absPath = resolvePath(filePath);

  const lines = await readLines(absPath);

  validateRange(start, end, lines.length);

  const newLines = [...lines.slice(0, start - 1), ...lines.slice(end)];

  await writeLines(absPath, newLines);

  return {
    success: true,
    path: absPath,
    operation: 'delete',
    affectedLines: range(start, end),
  };
}

/* --------------------------------------------------
   INTERNAL HELPERS
-------------------------------------------------- */

async function readLines(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content.split('\n');
}

async function writeLines(filePath: string, lines: string[]) {
  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
}

function resolvePath(filePath: string): string {
  if (!filePath) {
    throw new ReaderError('INVALID_PATH', 'File path is required');
  }

  return path.resolve(filePath);
}

function validateLine(line: number, max: number) {
  if (line < 1 || line > max) {
    throw new ReaderError('INVALID_LINE', `Line ${line} is out of bounds (1-${max})`);
  }
}

function validateRange(start: number, end: number, max: number) {
  if (start < 1 || end < 1 || start > end || end > max) {
    throw new ReaderError('INVALID_RANGE', `Invalid range ${start}-${end} (1-${max})`);
  }
}

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}
