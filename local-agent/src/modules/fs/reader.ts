/**
 * This module is responsible for controlled code extraction from the filesystem.
 * It is NOT a raw file reader — it is an intent-based retrieval layer.
 *
 * Why this exists:
 * - AI should not read arbitrary files directly
 * - All code access must be structured (AST node or line range)
 * - Ensures deterministic and safe context extraction for reasoning
 *
 * Key design decisions:
 * - No caching
 * - Uses AST from parser.ts only as a locator, not a source of truth
 * - Always falls back to raw filesystem slicing for actual content
 * - Strict validation on file paths and ranges
 */

import fs from 'fs/promises';
import { getFileAST } from '../ast/parser.js';
import { ReaderError } from '../../core/errors/errors.js';
import { assertValidNumber, resolveSafePath, validateRangeShape } from './utils/validate.js';

export type ReadSource = 'ast' | 'range' | 'full';

export interface ReadResult {
  path: string;
  content: string;
  start?: number;
  end?: number;
  source: ReadSource;
}

/**
 * Read code from a file using AST node name (function/class)
 */
export async function readCodeFromASTNode(filePath: string, nodeName: string): Promise<ReadResult> {
  const absPath = resolveSafePath(filePath);
  const ast = await getFileAST(absPath);

  const node = ast.nodes.find(
    (n: any) => (n.type === 'function' || n.type === 'class') && n.name === nodeName,
  );

  if (!node) {
    throw new ReaderError('NODE_NOT_FOUND', `AST node '${nodeName}' not found in ${filePath}`);
  }

  const content = await readFileLines(absPath, node.start, node.end);

  return {
    path: absPath,
    content,
    start: node.start,
    end: node.end,
    source: 'ast',
  };
}

/**
 * Read code by line range
 */
export async function readCodeByLineRange(
  filePath: string,
  start: number,
  end: number,
): Promise<ReadResult> {
  const absPath = resolveSafePath(filePath);

  assertValidNumber(start, 'start');
  assertValidNumber(end, 'end');
  validateRangeShape(start, end);

  const content = await readFileLines(absPath, start, end);

  return {
    path: absPath,
    content,
    start,
    end,
    source: 'range',
  };
}

/**
 * Read full file
 */
export async function readFullFile(filePath: string): Promise<ReadResult> {
  const absPath = resolveSafePath(filePath);

  const content = await fs.readFile(absPath, 'utf-8');

  return {
    path: absPath,
    content,
    source: 'full',
  };
}

/* -------------------------
   Internal helpers
-------------------------- */

/**
 * Reads file and returns specific line slice (1-based indexing)
 */
async function readFileLines(filePath: string, start?: number, end?: number): Promise<string> {
  const raw = await fs.readFile(filePath, 'utf-8');

  if (!start || !end) return raw;

  return raw.slice(start - 1, end);
}
