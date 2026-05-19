import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProjectStructure } from '../structure.js';

const testDir = path.join(__dirname, 'tmp');

beforeEach(() => {
  fs.mkdirSync(testDir, { recursive: true });

  // create test structure
  fs.mkdirSync(path.join(testDir, 'src/utils'), { recursive: true });
  fs.writeFileSync(path.join(testDir, 'src/index.ts'), '');
  fs.writeFileSync(path.join(testDir, 'src/utils/helper.ts'), '');
  fs.writeFileSync(path.join(testDir, 'package.json'), '');

  // excluded
  fs.mkdirSync(path.join(testDir, 'node_modules'), { recursive: true });
  fs.mkdirSync(path.join(testDir, '.git'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('Project structure', () => {
  it('returns correct structure', () => {
    const result = getProjectStructure(testDir);

    expect(result.type).toBe('directory');
    expect(result.path).toBe('.');

    const names = result.children?.map((c) => c.name);

    expect(names).toContain('src');
    expect(names).toContain('package.json');
  });

  it('excludes node_modules and .git', () => {
    const result = getProjectStructure(testDir);

    const names = result.children?.map((c) => c.name);

    expect(names).not.toContain('node_modules');
    expect(names).not.toContain('.git');
  });

  it('handles empty directory', () => {
    const emptyDir = path.join(testDir, 'empty');
    fs.mkdirSync(emptyDir);

    const result = getProjectStructure(emptyDir);
    expect(result.children).toEqual([]);
  });
});
