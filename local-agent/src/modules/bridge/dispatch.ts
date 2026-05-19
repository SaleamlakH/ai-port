import { getFileAST } from '../ast/parser.js';
import type { AiportConfig } from '../config/loader.js';
import { execute } from '../executor/index.js';
import { readCodeByLineRange, readCodeFromASTNode, readFullFile } from '../fs/reader.js';
import { getProjectStructure } from '../fs/structure.js';
import { insertLines, overwriteLines } from '../fs/writer.js';

export interface DispatchParams {
  tool: string;
  params: {
    filePath?: string;
    nodeName?: string;
    start?: number;
    end?: number;
    operation?: 'insert' | 'overwrite' | 'delete';
    content?: string[];
    command?: string;
  };
  config: AiportConfig;
}

export const dispatch = async ({ tool, params, config }: DispatchParams) => {
  switch (tool) {
    case 'get_project_structure':
      return getProjectStructure();

    case 'get_file_ast': {
      const path = params.filePath as string;
      return getFileAST(path);
    }

    case 'read_code': {
      const path = params.filePath as string;

      if (params.nodeName) {
        return readCodeFromASTNode(path, params.nodeName);
      }

      if (params.start && params.end) {
        return readCodeByLineRange(path, params.start, params.end);
      }

      return readFullFile(path);
    }

    case 'write_file': {
      const path = params.filePath as string;
      const start = params.start as number;
      const end = params.end as number;
      const operation = params.operation as string;

      if (operation === 'insert') {
        return insertLines(path, start, params.content ?? []);
      }

      if (operation === 'overwrite') {
        return overwriteLines(path, start, end, params.content ?? []);
      }

      if (operation === 'delete') {
        return overwriteLines(path, start, end, params.content ?? []);
      }

      throw new Error(`Unknown write_file operation: ${operation}`);
    }

    case 'run_command': {
      return execute(params.command as string, config);
    }

    default: {
      throw new Error(`Unknown tool: ${tool}`);
    }
  }
};
