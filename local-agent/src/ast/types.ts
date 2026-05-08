/**
 * This file defines the normalized AST shape used across the system.
 *
 * The goal is to keep the structure simple and language-agnostic so that
 * the AI can reason about code without needing full parser details.
 *
 * Only high-level constructs are included (functions, classes, imports, exports).
 * Low-level syntax details are intentionally excluded.
 *
 * This file should remain stable, since many parts of the system depend on it.
 */

export type ASTNodeType = 'function' | 'class' | 'import' | 'export';

export type ASTNode =
  | {
      type: 'function';
      name?: string;
      start: number;
      end: number;
    }
  | {
      type: 'class';
      name?: string;
      start: number;
      end: number;
    }
  | {
      type: 'import';
      source: string;
      defaultImport?: string;
      namespaceImport?: string;
      namedImports?: Array<{
        name: string;
        alias?: string;
      }>;
      sideEffectOnly?: boolean;
      start: number;
      end: number;
    }
  | {
      type: 'export';
      start: number;
      end: number;
    };

export type ASTFile = {
  path: string;
  language: string;
  nodes: ASTNode[];
};
