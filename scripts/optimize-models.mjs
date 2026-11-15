// glTF Transform optimiser. Every model in models-src/ is cleaned, shrunk and compressed
// into public/models/, and must end up under 2 MB (PRD NFR: performance).
//
//   npm run optimize
//
// Order of attack if a file is still too big: (1) lossless clean-up + Meshopt + WebP textures,
// (2) smaller textures, (3) mesh simplification in small steps. It reports every step.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, resample, textureCompress, meshopt, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 2 * 1024 * 1024; // 2 MB
const root = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(root, 'models-src');
const OUT = join(root, 'public', 'models');
mkdirSync(OUT, { recursive: true });

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
// NASA publishes some models with Draco compression, so we need to be able to READ it.
// We never write Draco: the output is Meshopt, which the viewer decodes without any CDN download.
const dracoDecoder = await draco3d.createDecoderModule();

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('! sharp is not available: textures will be left as they are.');
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder, 'draco3d.decoder': dracoDecoder });

const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

async function pass(doc, { texture, ratio }, useSharp) {
  // Drop the Draco extension so the file is written as Meshopt only (no Draco encoder needed).
  doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === 'KHR_draco_mesh_compression')?.dispose();
  const steps = [dedup(), prune(), weld(), resample()];
  if (ratio < 1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001 }));
  if (doc.getRoot().listTextures().length) {
    // sharp (native, fast) writes WebP. The fallback is pure JS and can only write JPEG.
    steps.push(
      useSharp
        ? textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [texture, texture], quality: 80, effort: 70 })
        : textureCompress({ targetFormat: 'jpeg', resize: [texture, texture], quality: 80 }),
    );
  }
  steps.push(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await doc.transform(...steps);
}

// Try sharp first; if the native binary fails on this machine, redo that step with the JS encoder.
let sharpBroken = !sharp;
async function optimiseOnce(file, step) {
  if (!sharpBroken) {
    try {
      const doc = await io.read(join(SRC, file));
      await pass(doc, step, true);
      return doc;
    } catch (err) {
      sharpBroken = true;
      console.warn(`! sharp failed (${String(err.message).split('\n')[0]}). Using the slower JS texture encoder (JPEG).`);
    }
  }
  const doc = await io.read(join(SRC, file));
  await pass(doc, step, false);
  return doc;
}

const files = readdirSync(SRC).filter((f) => ['.glb', '.gltf'].includes(extname(f).toLowerCase()));
if (!files.length) {
  console.error('No models in models-src/. Run `npm run make-placeholders` or drop the real .glb files there.');
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const name = basename(file, extname(file));
  const inSize = statSync(join(SRC, file)).size;
  const out = join(OUT, `${name}.glb`);

  // Always start from the original so lossy steps don't stack on each other.
  const plan = [
    { texture: 2048, ratio: 1 },
    { texture: 1024, ratio: 1 },
    { texture: 512, ratio: 0.75 },
    { texture: 512, ratio: 0.5 },
    { texture: 512, ratio: 0.3 },
    { texture: 256, ratio: 0.15 },
  ];
  let size = Infinity;
  let used = null;
  for (const step of plan) {
    const doc = await optimiseOnce(file, step);
    await io.write(out, doc);
    size = statSync(out).size;
    used = step;
    if (size < LIMIT) break;
  }

  const ok = size < LIMIT;
  if (!ok) failed++;
  const doc = await io.read(out);
  const tris = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${name}.glb  ${mb(inSize)} → ${size < 1024 * 100 ? kb(size) : mb(size)}  ` +
      `(${Math.round(tris).toLocaleString()} triangles, textures ≤ ${used.texture}px, mesh ×${used.ratio})`,
  );
}

if (failed) {
  console.error(`\n${failed} model(s) are still over 2 MB. Reduce the source model, or see docs/models-licenses.md.`);
  process.exit(1);
}
console.log('\nAll models are under 2 MB.');
