/**
 * This file is the central registry for all supported languages.
 *
 * It maps a detected language to a loader function that dynamically imports
 * the parser for that language only when needed.
 *
 * Important constraints:
 * - Parsers must NOT be imported directly here
 * - Each language must have its own loader file
 * - Missing parsers should fail with a clear, actionable error
 *
 * TypeScript (via ts-morph) is always available.
 * Other languages are optional and installed on demand.
 */

type Loader = () => Promise<any>;

const registry: Record<string, Loader> = {
  typescript: () => import('./typescript.js'),
  javascript: () => import('./javascript.js'),

  // future:
  // python: () => import("./python"),
};

export function detectLanguage(filePath: string): string | null {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    return 'typescript';
  }

  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    return 'javascript';
  }

  return null;
}

export async function loadLanguage(language: string) {
  const loader = registry[language];

  if (!loader) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    return await loader();
  } catch {
    throw new Error(`${language} parser not installed. Run: aiport add ${language}`);
  }
}
