// Builds three simple stand-in models (LRV, Opportunity, Ingenuity) so the viewer,
// the optimiser and the size check can be tested before the real NASA files are downloaded.
// These are our own geometry: no third-party licence applies. They are NOT the final models.
//
//   npm run make-placeholders   →   models-src/*.glb
import { Document, NodeIO } from '@gltf-transform/core';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../models-src/', import.meta.url));
mkdirSync(OUT, { recursive: true });

// ---- tiny geometry helpers (positions, normals, indices) ----
function box(w, h, d) {
  const x = w / 2, y = h / 2, z = d / 2;
  const faces = [
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
    [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
    [[0, 1, 0], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],
    [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]],
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach(([n, vs], f) => {
    vs.forEach((v) => { pos.push(...v); nor.push(...n); });
    const o = f * 4;
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return { pos, nor, idx };
}

function cylinder(r, h, seg = 24) {
  // axis along Y
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.push(c * r, -h / 2, s * r, c * r, h / 2, s * r);
    nor.push(c, 0, s, c, 0, s);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  for (const sign of [1, -1]) {
    const base = pos.length / 3;
    pos.push(0, (sign * h) / 2, 0);
    nor.push(0, sign, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, (sign * h) / 2, Math.sin(a) * r);
      nor.push(0, sign, 0);
    }
    for (let i = 0; i < seg; i++) {
      sign > 0 ? idx.push(base, base + i + 2, base + i + 1) : idx.push(base, base + i + 1, base + i + 2);
    }
  }
  return { pos, nor, idx };
}

const QX90 = [Math.SQRT1_2, 0, 0, Math.SQRT1_2]; // turns a Y-axis cylinder onto the Z axis (wheels)

function build(name, parts) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(name);
  const mats = new Map();
  const mat = (hex, metal = 0.25, rough = 0.6) => {
    const k = `${hex}${metal}${rough}`;
    if (!mats.has(k)) {
      const m = doc.createMaterial(`mat-${hex}`)
        .setBaseColorFactor([parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255, 1])
        .setMetallicFactor(metal)
        .setRoughnessFactor(rough);
      mats.set(k, m);
    }
    return mats.get(k);
  };
  for (const p of parts) {
    const g = p.geo;
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.pos)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.nor)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(g.idx)).setBuffer(buffer))
      .setMaterial(mat(...p.mat));
    const mesh = doc.createMesh(p.name).addPrimitive(prim);
    const node = doc.createNode(p.name).setMesh(mesh).setTranslation(p.at);
    if (p.rot) node.setRotation(p.rot);
    scene.addChild(node);
  }
  return doc;
}

const wheel = (name, at, r = 0.3, w = 0.18) => ({ name, geo: cylinder(r, w), at, rot: QX90, mat: ['#2a2a2e', 0.1, 0.9] });

const models = {
  // Apollo Lunar Roving Vehicle: open frame, four wire wheels, two seats, a dish antenna.
  lrv: [
    { name: 'chassis', geo: box(2.0, 0.12, 1.0), at: [0, 0.4, 0], mat: ['#b9b6ae', 0.5, 0.5] },
    { name: 'seat_left', geo: box(0.4, 0.5, 0.35), at: [-0.1, 0.72, -0.25], mat: ['#d8d2c2', 0.1, 0.8] },
    { name: 'seat_right', geo: box(0.4, 0.5, 0.35), at: [-0.1, 0.72, 0.25], mat: ['#d8d2c2', 0.1, 0.8] },
    { name: 'battery', geo: box(0.5, 0.25, 0.5), at: [0.7, 0.58, 0], mat: ['#6f7480', 0.6, 0.45] },
    { name: 'antenna_mast', geo: cylinder(0.025, 0.9), at: [0.95, 1.05, 0.3], mat: ['#c9c5bb', 0.7, 0.4] },
    { name: 'antenna_dish', geo: cylinder(0.3, 0.04, 32), at: [0.95, 1.5, 0.3], mat: ['#e8e4d8', 0.6, 0.35] },
    wheel('wheel_front_left', [0.85, 0.3, -0.62]),
    wheel('wheel_front_right', [0.85, 0.3, 0.62]),
    wheel('wheel_rear_left', [-0.85, 0.3, -0.62]),
    wheel('wheel_rear_right', [-0.85, 0.3, 0.62]),
  ],
  // Opportunity rover: warm electronics box, solar deck, mast with camera, six wheels.
  opportunity: [
    { name: 'body', geo: box(1.1, 0.4, 0.8), at: [0, 0.55, 0], mat: ['#c9a35e', 0.6, 0.4] },
    { name: 'solar_deck', geo: box(1.3, 0.04, 1.0), at: [0, 0.8, 0], mat: ['#1f2a44', 0.3, 0.35] },
    { name: 'mast', geo: cylinder(0.03, 0.7), at: [0.4, 1.17, 0], mat: ['#cfcabf', 0.7, 0.4] },
    { name: 'pancam', geo: box(0.28, 0.12, 0.16), at: [0.4, 1.58, 0], mat: ['#2b2b30', 0.4, 0.5] },
    { name: 'arm', geo: box(0.7, 0.06, 0.06), at: [0.85, 0.5, 0.35], mat: ['#cfcabf', 0.7, 0.4] },
    ...[-0.5, 0, 0.5].flatMap((x, i) => [
      wheel(`wheel_left_${i}`, [x, 0.22, -0.55], 0.22, 0.16),
      wheel(`wheel_right_${i}`, [x, 0.22, 0.55], 0.22, 0.16),
    ]),
  ],
  // Ingenuity: small box body, two counter-rotating rotors, solar panel, four legs.
  ingenuity: [
    { name: 'body', geo: box(0.35, 0.3, 0.35), at: [0, 0.55, 0], mat: ['#d9d6cf', 0.4, 0.5] },
    { name: 'solar_panel', geo: box(0.6, 0.03, 0.4), at: [0, 1.35, 0], mat: ['#1f2a44', 0.3, 0.35] },
    { name: 'rotor_mast', geo: cylinder(0.03, 0.7), at: [0, 0.95, 0], mat: ['#cfcabf', 0.7, 0.4] },
    { name: 'rotor_upper', geo: box(2.4, 0.015, 0.1), at: [0, 1.15, 0], mat: ['#2b2b30', 0.2, 0.6] },
    { name: 'rotor_lower', geo: box(0.1, 0.015, 2.4), at: [0, 1.0, 0], mat: ['#2b2b30', 0.2, 0.6] },
    ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => ({
      name: `leg_${i}`, geo: box(0.04, 0.55, 0.04), at: [sx * 0.32, 0.15, sz * 0.32], mat: ['#cfcabf', 0.7, 0.4],
    })),
    { name: 'camera', geo: box(0.1, 0.08, 0.08), at: [0, 0.38, 0.2], mat: ['#2b2b30', 0.4, 0.5] },
  ],
};

const io = new NodeIO();
for (const [name, parts] of Object.entries(models)) {
  // The Lunar Roving Vehicle now has its own, more detailed generator.
  if (name === 'lrv') {
    console.log('skipped lrv (use scripts/make-lrv.mjs)');
    continue;
  }
  const file = `${OUT}${name}.glb`;
  // Never overwrite a real model (the NASA files live here once downloaded).
  if (existsSync(file)) {
    console.log('skipped', `models-src/${name}.glb (already exists)`);
    continue;
  }
  await io.write(file, build(name, parts));
  console.log('wrote', `models-src/${name}.glb`);
}
