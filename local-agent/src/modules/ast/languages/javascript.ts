/**
 * JavaScript parsing currently reuses the TypeScript parser.
 *
 * ts-morph supports JavaScript, so we avoid duplicating logic.
 * This keeps behavior consistent across JS and TS.
 *
 * If needed in the future, this can be replaced with a dedicated parser.
 */

export { parse } from './typescript.js';
