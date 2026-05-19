/**
 * This is the main entry point for AST generation.
 *
 * Responsibilities:
 * - Detect the file language
 * - Load the correct parser lazily
 * - Return a normalized AST structure
 *
 * This file intentionally does NOT include caching.
 * Caching is handled in a separate layer to keep responsibilities clear.
 */

import fs from 'fs';
import { detectLanguage, loadLanguage } from './languages/index.js';
import type { ASTFile } from './types.js';

export async function getFileAST(filePath: string): Promise<ASTFile> {
  const language = detectLanguage(filePath);

  if (!language) {
    throw new Error(`Unsupported file type: ${filePath}`);
  }

  const code = fs.readFileSync(filePath, 'utf-8');

  const langModule = await loadLanguage(language);
  const nodes = langModule.parse(filePath, code);

  return {
    path: filePath,
    language,
    nodes,
  };
}
