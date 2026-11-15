// Prints each named part's centre in the viewer's normalised space (model fitted to ~2 units, centred on 0),
// ready to paste into a hotspot's `position`.   node scripts/part-positions.mjs public/models/ingenuity.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).read(process.argv[2]);
const all = getBounds(doc.getRoot().listScenes()[0]);
const c = all.min.map((v, i) => (v + all.max[i]) / 2);
const dim = Math.max(...all.max.map((v, i) => v - all.min[i]));
const k = 2 / dim; // same maths as ModelScene.tsx
for (const n of doc.getRoot().listNodes()) {
  if (!n.getMesh()) continue;
  const b = getBounds(n);
  const mid = b.min.map((v, i) => +(((v + b.max[i]) / 2 - c[i]) * k).toFixed(2));
  console.log(n.getName().padEnd(14), JSON.stringify(mid), ' top-y', +((b.max[1] - c[1]) * k).toFixed(2));
}
