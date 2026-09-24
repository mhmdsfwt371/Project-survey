/* ═══════════════════════════════════════════════════════════════════════════
   توليدُ مخطّطات JSON القياسية — node scripts/schema-gen.mjs [--check]
   ───────────────────────────────────────────────────────────────────────────
   المصدرُ واحد: docs/api-schema.json (exports.geojson.feature_properties). منه
   يُولَّد docs/schema/*.schema.json وفق draft 2020-12 — فلا ينحرف أحدُهما عن
   الآخر: الجردُ يعيد التوليدَ ويقارن. --check يقارن ولا يكتب.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
const api = JSON.parse(readFileSync('docs/api-schema.json', 'utf8'));
const src = api.exports.geojson.feature_properties;
const props = {}, required = [];
for (const [k, v] of Object.entries(src)){
  const p = { type: v.type };
  if (v.enum) p.enum = v.enum; if (v.format) p.format = v.format; if (v.items) p.items = v.items; if (v.desc) p.description = v.desc;
  props[k] = p; if (v.required) required.push(k);
}
const feature = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://mhmdsfwt371.github.io/Project-survey/docs/schema/geojson-feature.schema.json',
  title: 'AFAQY Readers — site feature', description: 'نقطةٌ واحدةٌ في تصدير GeoJSON (RFC 7946). الخصائصُ من docs/api-schema.json — لا تُعدَّل هنا.',
  type: 'object', required: ['type', 'id', 'geometry', 'properties'], additionalProperties: false,
  properties: {
    type: { const: 'Feature' }, id: { type: 'string', pattern: '^NSK-' },
    geometry: { type: 'object', required: ['type', 'coordinates'], properties: { type: { const: 'Point' }, coordinates: { type: 'array', minItems: 2, maxItems: 2, prefixItems: [{ type: 'number', minimum: -180, maximum: 180, description: 'longitude' }, { type: 'number', minimum: -90, maximum: 90, description: 'latitude' }] } } },
    properties: { type: 'object', required, additionalProperties: false, properties: props }
  }
};
const collection = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://mhmdsfwt371.github.io/Project-survey/docs/schema/geojson-export.schema.json',
  title: 'AFAQY Readers — GeoJSON export', type: 'object', required: ['type', 'features'], additionalProperties: true,
  properties: { type: { const: 'FeatureCollection' }, name: { type: 'string' }, generated_at: { type: 'string', format: 'date-time' }, version: { type: 'string' },
                features: { type: 'array', items: { $ref: 'geojson-feature.schema.json' } } }
};
const out = { 'docs/schema/geojson-feature.schema.json': feature, 'docs/schema/geojson-export.schema.json': collection };
let drift = [];
for (const [f, obj] of Object.entries(out)){
  const txt = JSON.stringify(obj, null, 2) + '\n';
  if (process.argv.includes('--check')){ if (!existsSync(f) || readFileSync(f, 'utf8') !== txt) drift.push(f); }
  else { mkdirSync('docs/schema', { recursive: true }); writeFileSync(f, txt); console.log('✓ ' + f); }
}
if (process.argv.includes('--check')){ if (drift.length){ console.log('✗ انحرفت عن المصدر: ' + drift.join(' · ') + ' — شغّل node scripts/schema-gen.mjs'); process.exit(1); } console.log('✓ المخطّطاتُ مطابقةٌ للمصدر'); }
