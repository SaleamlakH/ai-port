import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { getFileAST } from '../parser.js';

const file = path.join(__dirname, 'sample.ts');

fs.writeFileSync(
  file,
  `
import fs from "fs";

export function hello() {}
class Test {}
`,
);

describe('AST parser', () => {
  it('parses TS file', async () => {
    const result = await getFileAST(file);

    const types = result.nodes.map((n) => n.type);

    expect(types).toContain('function');
    expect(types).toContain('class');
    expect(types).toContain('import');
  });
});
