/**
 * Aiport — Project Structure Generator
 *
 * WHAT THIS DOES:
 * - Recursively scans the project directory
 * - Builds a deterministic node graph (ProjectNode)
 * - Returns only structure (no file content)
 *
 * WHAT IS INCLUDED:
 * - Files and directories
 * - Relative paths from project root
 * - Sorted children (alphabetical)
 *
 * WHAT IS EXCLUDED (V1 HARD RULES):
 * - node_modules
 * - .git
 *
 * INVARIANTS:
 * - Output must be deterministic
 * - No absolute paths
 * - No trailing slashes
 * - children only exists for directories
 *
 * WHAT IS NOT INCLUDED (V1):
 * - File size, timestamps, permissions
 * - Git metadata
 * - File content preview
 */

import fs from 'fs';
import path from 'path';

export type ProjectNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectNode[];
};

const EXCLUDED = new Set(['node_modules', '.git']);

export function getProjectStructure(rootDir: string = process.cwd()): ProjectNode {
  const walk = (currentPath: string, relativePath: string): ProjectNode => {
    const stat = fs.statSync(currentPath);

    if (stat.isFile()) {
      return {
        name: path.basename(currentPath),
        path: relativePath,
        type: 'file',
      };
    }

    // directory
    const entries = fs.readdirSync(currentPath);

    const children: ProjectNode[] = entries
      .filter((name) => !EXCLUDED.has(name))
      .map((name) => {
        const fullPath = path.join(currentPath, name);
        const relPath = relativePath === '.' ? name : `${relativePath}/${name}`;
        return walk(fullPath, relPath);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      name: path.basename(currentPath) === '' ? '.' : path.basename(currentPath),
      path: relativePath,
      type: 'directory',
      children,
    };
  };

  return walk(rootDir, '.');
}
