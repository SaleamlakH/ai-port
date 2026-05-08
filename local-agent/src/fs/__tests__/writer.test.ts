import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

import { insertLines, overwriteLines, deleteLines } from '../writer.js';

const tmpFile = path.join(__dirname, 'tmp.writer.ts');

const initialContent = `line1
line2
line3
line4`;

beforeEach(async () => {
  await fs.writeFile(tmpFile, initialContent);
});

afterEach(async () => {
  await fs.unlink(tmpFile);
});

describe('fs/writer', () => {
  it('inserts lines correctly', async () => {
    const res = await insertLines(tmpFile, 2, ['NEW_LINE']);

    const file = await fs.readFile(tmpFile, 'utf-8');

    expect(res.operation).toBe('insert');
    expect(file).toContain('NEW_LINE');
  });

  it('overwrites lines correctly', async () => {
    await overwriteLines(tmpFile, 2, 3, ['REPLACED']);

    const file = await fs.readFile(tmpFile, 'utf-8');

    expect(file).toContain('REPLACED');
    expect(file).not.toContain('line2');
  });

  it('deletes lines correctly', async () => {
    await deleteLines(tmpFile, 2, 3);

    const file = await fs.readFile(tmpFile, 'utf-8');

    expect(file).not.toContain('line2');
    expect(file).not.toContain('line3');
  });

  it('rejects invalid range', async () => {
    await expect(deleteLines(tmpFile, 5, 2)).rejects.toThrow();
  });
});
