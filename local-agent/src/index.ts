import { getFileAST } from './ast/parser.js';
// import { loadConfig } from './config/loader.js';
// import { getProjectStructure } from './fs/structure.js';

// const structure = getProjectStructure();
// console.log(JSON.stringify(structure, null, 2));

// try {
//   loadConfig();
// } catch (error) {
//   console.error(error);
//   process.exit(1);
// }

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: npm run dev <file-path>');
    process.exit(1);
  }

  const ast = await getFileAST(filePath);
  console.log(JSON.stringify(ast, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
