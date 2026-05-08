import { loadConfig } from './config/loader.js';
import { getProjectStructure } from './fs/structure.js';

const structure = getProjectStructure();
console.log(JSON.stringify(structure, null, 2));

try {
  loadConfig();
} catch (error) {
  console.error(error);
  process.exit(1);
}
