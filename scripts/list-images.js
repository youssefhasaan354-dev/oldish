import fs from 'fs';
import path from 'path';

const dir = 'public/images';
const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
console.log('Final files in public/images:');
let totalBytes = 0;
files.forEach(f => {
  const bytes = fs.statSync(path.join(dir, f)).size;
  totalBytes += bytes;
  console.log(`- ${f}: ${(bytes / 1024).toFixed(1)} KB (${bytes} bytes)`);
});
console.log(`Total public/images folder weight: ${(totalBytes / 1024).toFixed(1)} KB`);
