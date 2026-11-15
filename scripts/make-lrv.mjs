// Builds our own Apollo Lunar Roving Vehicle, since NASA publishes no model of it.
// This is the PROJECT TEAM'S OWN geometry, an illustration based on the vehicle's published
// layout and rough proportions. It is NOT a NASA model and must be credited that way.
//
//   node scripts/make-lrv.mjs      →   models-src/lrv.glb   (then: npm run optimize)
//
// Axes: +X is the front of the vehicle, +Y is up, +Z is its right-hand side. Units are metres.
// Rough real sizes used: wheelbase 2.3 m, track 1.8 m, wheel diameter 0.82 m, wheel width 0.23 m.
import { Document, NodeIO } from '@gltf-transform/core';
import { fileURLToPath } from 'node:url';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const OUT = fileURLToPath(new URL('../models-src/', import.meta.url));
mkdirSync(OUT + 'placeholders/', { recursive: true });
// Keep the old simple placeholder for reference, once.
if (existsSync(OUT + 'lrv.glb') && !existsSync(OUT + 'placeholders/lrv-simple.glb')) {
  copyFileSync(OUT + 'lrv.glb', OUT + 'placeholders/lrv-simple.glb');
}

// ---------- geometry (positions, normals, indices) ----------
// Triangle winding is corrected afterwards so every face agrees with its normal.
function finish(pos, nor, idx) {
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const e1 = [0, 1, 2].map((k) => pos[b * 3 + k] - pos[a * 3 + k]);
    const e2 = [0, 1, 2].map((k) => pos[c * 3 + k] - pos[a * 3 + k]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const want = [0, 1, 2].map((k) => nor[a * 3 + k] + nor[b * 3 + k] + nor[c * 3 + k]);
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  }
  return { pos, nor, idx };
}

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
    idx.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3);
  });
  return finish(pos, nor, idx);
}

function cylinder(r, h, seg = 20) { // axis along Y
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.push(c * r, -h / 2, s * r, c * r, h / 2, s * r);
    nor.push(c, 0, s, c, 0, s);
  }
  for (let i = 0; i < seg; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  for (const sign of [1, -1]) {
    const base = pos.length / 3;
    pos.push(0, (sign * h) / 2, 0); nor.push(0, sign, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, (sign * h) / 2, Math.sin(a) * r); nor.push(0, sign, 0);
    }
    for (let i = 0; i < seg; i++) idx.push(base, base + i + 1, base + i + 2);
  }
  return finish(pos, nor, idx);
}

function torus(R, r, major = 40, minor = 8) { // ring in the XZ plane, axis Y
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= major; i++) {
    const th = (i / major) * Math.PI * 2;
    for (let j = 0; j <= minor; j++) {
      const ph = (j / minor) * Math.PI * 2;
      const cp = Math.cos(ph), sp = Math.sin(ph);
      pos.push((R + r * cp) * Math.cos(th), r * sp, (R + r * cp) * Math.sin(th));
      nor.push(cp * Math.cos(th), sp, cp * Math.sin(th));
    }
  }
  for (let i = 0; i < major; i++) for (let j = 0; j < minor; j++) {
    const a = i * (minor + 1) + j, b = a + minor + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  return finish(pos, nor, idx);
}

// A curved sheet (part of a pipe) for the wheel fenders. Axis along Z, spanning angles a0..a1 around it.
function arcSheet(r, width, a0, a1, seg = 18) {
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + ((a1 - a0) * i) / seg, c = Math.cos(a), s = Math.sin(a);
    for (const z of [-width / 2, width / 2]) { pos.push(r * c, r * s, z); nor.push(c, s, 0); }
  }
  for (let i = 0; i < seg; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  return finish(pos, nor, idx);
}

function dish(radius, depth, seg = 36, rings = 8) { // paraboloid bowl, opening toward +Y
  const k = depth / (radius * radius);
  const pos = [0, 0, 0], nor = [0, 1, 0], idx = [];
  for (let ring = 1; ring <= rings; ring++) {
    const r = (ring / rings) * radius;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2, x = r * Math.cos(a), z = r * Math.sin(a);
      pos.push(x, k * r * r, z);
      const n = [-2 * k * x, 1, -2 * k * z], l = Math.hypot(...n);
      nor.push(n[0] / l, n[1] / l, n[2] / l);
    }
  }
  for (let i = 0; i < seg; i++) idx.push(0, 1 + i, 2 + i);
  for (let ring = 1; ring < rings; ring++) for (let i = 0; i < seg; i++) {
    const a = 1 + (ring - 1) * (seg + 1) + i, b = a + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  return finish(pos, nor, idx);
}

// ---------- document helpers ----------
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('lrv');
const materials = new Map();
const meshes = new Map();

const MAT = {
  alu: ['#bcbcb7', 0.85, 0.35],
  cream: ['#ded6bf', 0.1, 0.7],
  fender: ['#ded6bf', 0.1, 0.7, true],
  tan: ['#c7b78c', 0.0, 0.9],
  wire: ['#9b9b9f', 0.9, 0.45],
  ti: ['#6b6b72', 0.85, 0.4],
  dish: ['#ecebe4', 0.4, 0.5, true],
  gold: ['#c9a13f', 0.9, 0.3],
  dark: ['#202024', 0.3, 0.6],
  grey: ['#7d8088', 0.5, 0.5],
};
function material(key) {
  if (!materials.has(key)) {
    const [hex, metal, rough, double] = MAT[key];
    const m = doc.createMaterial(key)
      .setBaseColorFactor([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).concat(1))
      .setMetallicFactor(metal).setRoughnessFactor(rough);
    if (double) m.setDoubleSided(true);
    materials.set(key, m);
  }
  return materials.get(key);
}
// One mesh per distinct shape, reused by every node that needs it (the four wheels share theirs).
function meshFor(shape, geo, mat) {
  const k = `${shape}:${mat}`;
  if (!meshes.has(k)) {
    const acc = (type, arr, Arr) => doc.createAccessor().setType(type).setArray(new Arr(arr)).setBuffer(buffer);
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', acc('VEC3', geo.pos, Float32Array))
      .setAttribute('NORMAL', acc('VEC3', geo.nor, Float32Array))
      .setIndices(acc('SCALAR', geo.idx, Uint16Array))
      .setMaterial(material(mat));
    meshes.set(k, doc.createMesh(shape).addPrimitive(prim));
  }
  return meshes.get(k);
}
const qx = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
const qz = (a) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];

function part(parent, name, shape, geo, mat, at, rot) {
  const n = doc.createNode(name).setMesh(meshFor(shape, geo, mat)).setTranslation(at);
  if (rot) n.setRotation(rot);
  parent.addChild(n);
  return n;
}
function group(parent, name, at, rot) {
  const n = doc.createNode(name).setTranslation(at);
  if (rot) n.setRotation(rot);
  parent.addChild(n);
  return n;
}
const root = doc.createNode('lrv');
scene.addChild(root);

// ---------- the vehicle ----------
const WHEELBASE_HALF = 1.15, TRACK_HALF = 0.9, WHEEL_R = 0.41, SEAT_Z = 0.34;

// Frame: two long rails with cross members, a floor, and the rear chassis.
part(root, 'rail_left', 'rail', box(2.7, 0.07, 0.07), 'alu', [0, 0.58, -0.5]);
part(root, 'rail_right', 'rail', box(2.7, 0.07, 0.07), 'alu', [0, 0.58, 0.5]);
for (const [i, x] of [1.0, 0, -1.0].entries()) part(root, `cross_member_${i}`, 'cross', box(0.07, 0.07, 1.1), 'alu', [x, 0.58, 0]);
part(root, 'floor', 'floor', box(0.9, 0.02, 0.95), 'alu', [-0.05, 0.6, 0]);
part(root, 'rear_chassis', 'rearchassis', box(0.5, 0.12, 0.9), 'alu', [-1.15, 0.64, 0]);

// Wheels (wire-mesh look: a hub, spokes, two thin rims, and titanium chevron treads).
const WHEEL_NAMES = { '1,-1': 'front_left', '1,1': 'front_right', '-1,-1': 'rear_left', '-1,1': 'rear_right' };
for (const sx of [1, -1]) for (const sz of [-1, 1]) {
  const x = sx * WHEELBASE_HALF, z = sz * TRACK_HALF, name = WHEEL_NAMES[`${sx},${sz}`];
  // suspension arm and strut
  part(root, `suspension_arm_${name}`, 'arm', box(0.07, 0.05, 0.4), 'alu', [x, 0.5, sz * 0.7]);
  part(root, `suspension_strut_${name}`, 'strut', box(0.04, 0.13, 0.04), 'alu', [x, 0.45, sz * 0.88]);
  // the wheel itself, built around its own origin, axle along Z
  const w = group(root, `wheel_${name}`, [x, WHEEL_R, z]);
  // curved fender that wraps the top of the wheel
  part(w, `fender_${name}`, 'fender', arcSheet(0.46, 0.3, 0.2, Math.PI - 0.2), 'fender', [0, 0, 0]);
  part(w, 'hub', 'hub', cylinder(0.09, 0.26, 20), 'ti', [0, 0, 0], qx(Math.PI / 2));
  for (const zz of [-0.1, 0.1]) part(w, 'rim', 'rim', torus(0.385, 0.014, 40, 6), 'wire', [0, 0, zz], qx(Math.PI / 2));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    part(w, 'spoke', 'spoke', box(0.3, 0.008, 0.008), 'wire', [Math.cos(a) * 0.235, Math.sin(a) * 0.235, 0], qz(a));
  }
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    part(w, 'tread', 'tread', box(0.04, 0.075, 0.22), 'ti', [Math.cos(a) * 0.395, Math.sin(a) * 0.395, 0], qz(a));
  }
}

// Seats, footrests, hand controller.
for (const [side, sz] of [['left', -1], ['right', 1]]) {
  const s = group(root, `seat_${side}`, [0, 0, 0]);
  part(s, 'seat_base', 'seatbase', box(0.46, 0.05, 0.48), 'tan', [-0.2, 0.72, sz * SEAT_Z]);
  part(s, 'seat_back', 'seatback', box(0.05, 0.5, 0.48), 'tan', [-0.45, 0.98, sz * SEAT_Z]);
  part(s, 'seat_frame', 'seatframe', box(0.04, 0.15, 0.4), 'alu', [-0.2, 0.645, sz * SEAT_Z]);
  part(root, `footrest_${side}`, 'footrest', box(0.22, 0.03, 0.36), 'alu', [0.35, 0.64, sz * SEAT_Z], qz(-0.4));
}
const hc = group(root, 'hand_controller', [0.4, 0, 0]);
part(hc, 'controller_post', 'post', cylinder(0.02, 0.4, 12), 'alu', [0, 0.82, 0]);
part(hc, 'controller_handle', 'handle', box(0.1, 0.04, 0.3), 'dark', [0, 1.03, 0]);

// Front: electronics under gold thermal blankets, the mast, the umbrella antenna, TV camera, whip antenna.
part(root, 'forward_electronics', 'electronics', box(0.8, 0.32, 1.0), 'gold', [1.0, 0.8, 0]);
part(root, 'antenna_mast', 'mast', cylinder(0.03, 0.6, 12), 'alu', [1.2, 1.26, 0]);
const TILT = 0.5; // the dish leans back toward Earth
part(root, 'high_gain_antenna', 'dish', dish(0.46, 0.2), 'dish', [1.2, 1.58, 0], qz(TILT));
part(root, 'antenna_feed', 'feed', cylinder(0.015, 0.3, 8), 'dark', [1.2 - Math.sin(TILT) * 0.25, 1.58 + Math.cos(TILT) * 0.25, 0], qz(TILT));
part(root, 'camera_arm', 'cameraarm', box(0.3, 0.03, 0.03), 'alu', [1.5, 0.92, 0]);
part(root, 'tv_camera', 'camera', box(0.25, 0.16, 0.2), 'dark', [1.62, 0.95, 0]);
part(root, 'low_gain_antenna', 'whip', cylinder(0.008, 1.1, 8), 'wire', [1.0, 1.51, 0.38]);

// Rear: equipment bay and a sample bag.
part(root, 'rear_equipment', 'rearbay', box(0.6, 0.3, 0.85), 'grey', [-1.15, 0.85, 0]);
part(root, 'sample_bag', 'bag', box(0.3, 0.22, 0.5), 'cream', [-1.4, 1.0, 0]);

await new NodeIO().write(OUT + 'lrv.glb', doc);
console.log('wrote models-src/lrv.glb  (own geometry; old placeholder kept in models-src/placeholders/lrv-simple.glb)');
