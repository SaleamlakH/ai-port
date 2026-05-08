/**
 * This file handles parsing for TypeScript (and JavaScript).
 *
 * It uses ts-morph, which is a core dependency and always available.
 * This is the main parser used internally by the system.
 *
 * The output is a simplified list of high-level AST nodes,
 * not the full TypeScript AST.
 *
 * This file should NOT depend on any external optional parsers.
 */

import { Project } from 'ts-morph';
import { type ASTNode } from '../types.js';

const project = new Project({
  useInMemoryFileSystem: true,
});

export function parse(filePath: string, code: string): ASTNode[] {
  const source = project.createSourceFile(filePath, code, {
    overwrite: true,
  });

  const nodes: ASTNode[] = [];

  source.getFunctions().forEach((fn) => {
    const name = fn.getName();

    nodes.push({
      type: 'function',
      ...(name ? { name } : {}),
      start: fn.getStart(),
      end: fn.getEnd(),
    });
  });

  source.getClasses().forEach((cls) => {
    const name = cls.getName();

    nodes.push({
      type: 'class',
      ...(name ? { name } : {}),
      start: cls.getStart(),
      end: cls.getEnd(),
    });
  });

  source.getImportDeclarations().forEach((imp) => {
    nodes.push({
      type: 'import',
      start: imp.getStart(),
      end: imp.getEnd(),
    });
  });

  // exports can be expanded later if needed

  return nodes;
}
