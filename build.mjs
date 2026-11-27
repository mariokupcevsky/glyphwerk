// Builds index.html from src/ (files listed in src/order.txt, concatenated in order).
// index.html stays a single self-contained file: GitHub Pages and the claude.ai artifact need that.
//   node build.mjs          write index.html
//   node build.mjs --check  fail if index.html is not the build of src/ (used in CI)
import { readFileSync, writeFileSync } from 'node:fs';
const order = readFileSync('src/order.txt', 'utf8').split('\n').filter(Boolean);
const out = order.map(f => readFileSync('src/' + f, 'utf8')).join('');
if (process.argv.includes('--check')) {
  if (readFileSync('index.html', 'utf8') !== out) {
    console.error('index.html is out of date: edit files in src/, then run `node build.mjs`.');
    process.exit(1);
  }
  console.log('index.html matches src/');
} else {
  writeFileSync('index.html', out);
  console.log(`index.html built from ${order.length} files (${out.length} bytes)`);
}
