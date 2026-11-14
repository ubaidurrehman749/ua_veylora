// Prints what is inside a .glb: size, triangles, textures, extensions, bounding box and node names.
//   node scripts/inspect-model.mjs models-src/ingenuity.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
await MeshoptDecoder.ready;
const draco = await draco3d.createDecoderModule();
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'draco3d.decoder': draco });
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const b = getBounds(scene);
const size = b.max.map((v, i) => +(v - b.min[i]).toFixed(3));
const tris = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);
console.log('extensions   :', root.listExtensionsUsed().map((e) => e.extensionName).join(', ') || 'none');
console.log('triangles    :', Math.round(tris).toLocaleString());
console.log('meshes/nodes :', root.listMeshes().length, '/', root.listNodes().length, ' materials:', root.listMaterials().length);
console.log('textures     :', root.listTextures().map((t) => `${t.getMimeType()} ${t.getSize()?.join('x')} ${(t.getImage().byteLength / 1024).toFixed(0)}KB`).join(' | ') || 'none');
console.log('bounds min   :', b.min.map((v) => +v.toFixed(3)).join(', '));
console.log('bounds max   :', b.max.map((v) => +v.toFixed(3)).join(', '));
console.log('size x,y,z   :', size.join(' x '));
console.log('node names   :', root.listNodes().map((n) => n.getName()).filter(Boolean).slice(0, 40).join(', '));
