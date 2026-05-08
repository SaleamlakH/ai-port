/**
 * Aiport Local Agent — Entry Point
 *
 * PURPOSE:
 * Minimal CLI interface for validating core Unit 1 capabilities:
 * - project structure generation
 * - AST extraction (JS/TS only in V1)
 *
 * IMPORTANT:
 * This file is temporary runtime scaffolding.
 * It will later be replaced by SSE bridge entry flow.
 */

import { loadConfig } from './config/loader.js';
import { getProjectStructure } from './fs/structure.js';
import { getFileAST } from './ast/parser.js';

async function main() {
  loadConfig();

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  structure');
    console.log('  ast <file>');
    process.exit(0);
  }

  if (command === 'structure') {
    const tree = getProjectStructure();
    console.log(JSON.stringify(tree, null, 2));
    return;
  }

  if (command === 'ast') {
    const filePath = args[1];

    if (!filePath) {
      throw new Error('Missing file path for AST command');
    }

    const ast = await getFileAST(filePath);
    console.log(JSON.stringify(ast, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((err) => {
  console.error('[Aiport Agent Error]', err);
  process.exit(1);
});
