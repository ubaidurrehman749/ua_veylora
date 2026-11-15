// Checks src/data/missions.json before every build (npm run validate).
// Fails (exit 1) on missing fields, bad values, broken source links or missing files in public/.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataPath = join(root, 'src', 'data', 'missions.json');

const STATUS = ['inactive', 'silent', 'operating'];
const LABELS = ['confirmed', 'interpretation', 'unknown'];
const THEMES = ['water', 'life', 'geology', 'atmosphere', 'exploration', 'future'];
const SETTINGS = ['mars', 'moon'];
const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];

let missions;
try {
  missions = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error(`Could not read ${dataPath}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(missions) || missions.length === 0) {
  console.error('missions.json must be a non-empty array.');
  process.exit(1);
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const publicFile = (url) => join(root, 'public', url.replace(/^\//, ''));

const ids = new Set();

missions.forEach((m, i) => {
  const at = `missions[${i}]${isText(m?.id) ? ` (${m.id})` : ''}`;
  const err = (msg) => errors.push(`${at}: ${msg}`);

  for (const key of ['id', 'name', 'date', 'location', 'goal', 'story', 'modelPath', 'legacy']) {
    if (!isText(m[key])) err(`"${key}" must be a non-empty string`);
  }

  if (isText(m.id)) {
    if (ids.has(m.id)) err('duplicate id');
    ids.add(m.id);
  }

  if (isText(m.date) && !DATE.test(m.date)) err(`"date" must be YYYY, YYYY-MM or YYYY-MM-DD, got "${m.date}"`);

  if (!Array.isArray(m.payload) || m.payload.length === 0 || !m.payload.every(isText)) {
    err('"payload" must be a non-empty list of strings');
  }

  // Status
  if (!m.status || !STATUS.includes(m.status.value)) err(`"status.value" must be one of ${STATUS.join(', ')}`);
  if (m.status && m.status.checkedOn !== null && !DAY.test(m.status.checkedOn ?? '')) {
    err('"status.checkedOn" must be YYYY-MM-DD or null');
  }

  // Sources
  const sourceIds = new Set();
  if (!Array.isArray(m.sources) || m.sources.length === 0) err('"sources" must list at least one source');
  (m.sources ?? []).forEach((s, j) => {
    for (const key of ['title', 'publisher', 'url']) {
      if (!isText(s[key])) err(`sources[${j}].${key} is missing`);
    }
    if (isText(s.url) && !/^https?:\/\//.test(s.url)) err(`sources[${j}].url must start with http(s)://`);
    if (s.id) sourceIds.add(s.id);
  });

  // Evidence: every claim must cite a source of this mission.
  if (!Array.isArray(m.evidence) || m.evidence.length === 0) err('"evidence" must list at least one claim');
  (m.evidence ?? []).forEach((e, j) => {
    if (!isText(e.text)) err(`evidence[${j}].text is missing`);
    if (!LABELS.includes(e.label)) err(`evidence[${j}].label must be one of ${LABELS.join(', ')}`);
    if (!sourceIds.has(e.sourceId)) err(`evidence[${j}].sourceId "${e.sourceId}" does not match any source id`);
  });

  // Open question
  const q = m.openQuestion;
  if (!q || !isText(q.prompt)) err('"openQuestion.prompt" is missing');
  if (!q || !Array.isArray(q.choices) || q.choices.length !== 3 || !q.choices.every(isText)) {
    err('"openQuestion.choices" must be exactly 3 strings');
  }
  if (q?.theme !== undefined && !THEMES.includes(q.theme)) err(`"openQuestion.theme" must be one of ${THEMES.join(', ')}`);
  if (!THEMES.includes(m.questionTheme)) err(`"questionTheme" must be one of ${THEMES.join(', ')}`);

  // Credits
  if (!Array.isArray(m.credits)) err('"credits" must be a list');
  (m.credits ?? []).forEach((c, j) => {
    for (const key of ['asset', 'source', 'license']) {
      if (!isText(c[key])) err(`credits[${j}].${key} is missing`);
    }
  });

  // Verification
  if (typeof m.verified !== 'boolean') err('"verified" must be true or false');
  if (m.verified === false) warnings.push(`${at}: not verified yet, hidden in production builds`);

  // 3D model and fallback picture
  if (isText(m.modelPath)) {
    if (!m.modelPath.endsWith('.glb')) err('"modelPath" must point to a .glb file');
    else if (!existsSync(publicFile(m.modelPath))) err(`model file not found: public${m.modelPath}`);
  }
  if (m.fallbackSrc !== undefined && !existsSync(publicFile(m.fallbackSrc))) {
    err(`fallback image not found: public${m.fallbackSrc}`);
  }
  if (m.setting !== undefined && !SETTINGS.includes(m.setting)) err(`"setting" must be one of ${SETTINGS.join(', ')}`);

  // Globe sites
  (m.sites ?? []).forEach((s, j) => {
    if (!isText(s.label)) err(`sites[${j}].label is missing`);
    if (!Number.isFinite(s.lat) || Math.abs(s.lat) > 90) err(`sites[${j}].lat must be between -90 and 90`);
    if (!Number.isFinite(s.lon) || Math.abs(s.lon) > 360) err(`sites[${j}].lon must be a longitude in degrees`);
  });

  // Hotspots
  const hotspotIds = new Set();
  (m.hotspots ?? []).forEach((h, j) => {
    for (const key of ['id', 'label', 'description']) {
      if (!isText(h[key])) err(`hotspots[${j}].${key} is missing`);
    }
    if (hotspotIds.has(h.id)) err(`hotspots[${j}].id "${h.id}" is a duplicate`);
    hotspotIds.add(h.id);
    if (!Array.isArray(h.position) || h.position.length !== 3 || !h.position.every(Number.isFinite)) {
      err(`hotspots[${j}].position must be [x, y, z] numbers`);
    }
  });
});

warnings.forEach((w) => console.warn(`WARN ${w}`));

if (errors.length > 0) {
  errors.forEach((e) => console.error(`FAIL ${e}`));
  console.error(`\n${errors.length} problem(s) in src/data/missions.json.`);
  process.exit(1);
}

console.log(`OK   ${missions.length} missions in src/data/missions.json are valid.`);
