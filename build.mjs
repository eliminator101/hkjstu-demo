import { cp, mkdir, rm } from 'node:fs/promises';

const output = new URL('./dist/', import.meta.url);
const files = [
  'index.html',
  'about.html',
  'programmes.html',
  'community.html',
  'membership.html',
  'styles.css',
  'script.js',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  ...files.map((file) => cp(new URL(`./${file}`, import.meta.url), new URL(file, output))),
  cp(new URL('./assets/', import.meta.url), new URL('assets/', output), { recursive: true }),
]);

console.log(`Built ${files.length} files and assets/ to dist/`);
