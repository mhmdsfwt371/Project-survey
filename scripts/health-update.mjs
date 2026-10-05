/* يُثبّت خطَّ الأساس بعد تحسّن — node scripts/health-update.mjs [--accept "سببُ قبول زيادة"]
   بلا --accept لا يُقبَل مقياسٌ ساء؛ ومعه يُقبَل ويُكتَب السببُ في التاريخ (قرارٌ واعٍ لا تسرّب). */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { measure } from './audit-health.mjs';
const B = JSON.parse(readFileSync('docs/health-baseline.json', 'utf8')), { m, info } = await measure();
const i = process.argv.indexOf('--accept'), reason = i > 0 ? String(process.argv[i + 1] || '') : '';
const worse = Object.keys(B.m).filter(k => m[k] > B.m[k] && k !== 'lintErrors');
if (worse.length && !reason){ console.log('✗ ساء: ' + worse.join(' · ') + ' — لا تثبيت بلا --accept "السبب"'); process.exit(1); }
const ver = (readFileSync('sw.js', 'utf8').match(/nusuk-survey-v([\d.]+)/) || [])[1] || '';
writeFileSync('docs/health-baseline.json', JSON.stringify(Object.assign({}, B, { m, ver:'V' + ver, at:new Date().toISOString().slice(0, 10) }), null, 1) + '\n');
if (!existsSync('docs/health-history.csv')) writeFileSync('docs/health-history.csv', 'التاريخ,النسخة,المتغيرات العامة,دوال >٣٠٠,دوال >١٥٠,تحذيرات النحو,أكبر ملف مصدر ك.ب,الحجم الكلي ك.ب,السبب\n');
appendFileSync('docs/health-history.csv', [new Date().toISOString().slice(0, 10), 'V' + ver, m.globals, m.over300, m.over150, m.lintWarnings, m.maxSrcKB, info.totalKB, JSON.stringify(reason || 'تحسّن')].join(',') + '\n');
console.log('✓ خطُّ الأساس: ' + JSON.stringify(m));
