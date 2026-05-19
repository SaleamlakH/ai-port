import { describe, it, expect } from 'vitest';
import { readCodeFromASTNode, readCodeByLineRange, readFullFile } from '../reader.js';
import path from 'path';

/**
 * Test file used for reader validation
 */
const testFile = path.resolve(__dirname, 'mock/reader.mock.ts');

describe('fs/reader', () => {
  it('returns full file content', async () => {
    const result = await readFullFile(testFile);

    expect(result.source).toBe('full');
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('reads code by line range correctly', async () => {
    const result = await readCodeByLineRange(testFile, 1, 2);

    expect(result.source).toBe('range');
    expect(result.start).toBe(1);
    expect(result.end).toBe(2);
  });

  it('throws if line range is invalid', async () => {
    await expect(readCodeByLineRange(testFile, 5, 2)).rejects.toThrow();
  });

  it('reads code by AST node name', async () => {
    const result = await readCodeFromASTNode(testFile, 'testFunction');

    expect(result.source).toBe('ast');
    expect(result.content).toContain('function');
  });

  it('throws if AST node does not exist', async () => {
    await expect(readCodeFromASTNode(testFile, 'doesNotExist')).rejects.toThrow();
  });
});
