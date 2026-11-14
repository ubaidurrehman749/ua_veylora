// Fails (exit 1) if any shipped model is 2 MB or more, or has no image fallback.
//   npm run check-sizes
import { readdirSync, statSync, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 2 * 1024 * 1024;
const root = fileURLToPath(new URL('../', import.meta.url));
const models = join(root, 'public', 'models');
const fallbacks = join(root, 'public', 'fallback');

let bad = 0;
for (const f of readdirSync(models).filter((f) => f.endsWith('.glb'))) {
  const size = statSync(join(models, f)).size;
  const name = basename(f, '.glb');
  const fb = ['.svg', '.png', '.jpg', '.jpeg', '.webp'].map((e) => name + e).find((x) => existsSync(join(fallbacks, x)));
  const sizeOk = size < LIMIT;
  const line = `${sizeOk && fb ? 'OK  ' : 'FAIL'} ${f.padEnd(22)} ${(size / 1024).toFixed(1).padStart(9)} KB   fallback: ${fb ?? 'MISSING'}`;
  console.log(line);
  if (!sizeOk || !fb) bad++;
}
if (bad) {
  console.error(`\n${bad} problem(s).`);
  process.exit(1);
}
console.log('\nEvery model is under 2 MB and has an image fallback.');
