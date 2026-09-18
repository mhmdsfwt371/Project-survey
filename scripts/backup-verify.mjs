/* ═══════════════════════════════════════════════════════════════════════════
   بروفةُ الاستعادة — node scripts/backup-verify.mjs <حزمة> <بطاقة>
   ───────────────────────────────────────────────────────────────────────────
   نسخةٌ لا تُفتَح ليست نسخة. السيرُ يأخذ النسخةَ كلَّ ليلةٍ ويشفّرها، ثم لا
   يفتحها أحدٌ حتى يومِ الحاجة — فإن تبدّل المفتاحُ أو فسد الملفُّ أو خرجت
   مجموعةٌ فارغةً لم يُعرَف إلا حين لا ينفع العلم. فتُفَكُّ النسخةُ هنا بالمفتاح
   نفسِه وتُقرأ: أعدادُها تطابق بطاقتَها، ولا مجموعةَ ضاعت، ولا صفرَ صامت.
   (الصورُ ليست في الحزمة — تُرفَع خامًا إلى درايف المالك وحدَها، فتُستثنى.)
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';

const bad = m => { console.log('::error title=بروفةُ الاستعادة::' + m); console.log('✗ ' + m); process.exit(1); };
const [bundlePath, metaPath] = process.argv.slice(2);
if (!bundlePath || !metaPath) bad('الاستعمال: backup-verify.mjs <bundle.json> <_meta.json>');

let bundle, meta;
try { bundle = JSON.parse(readFileSync(bundlePath, 'utf8')); }
catch (e){ bad('الحزمةُ لا تُقرأ بعد فكِّ التشفير: ' + String(e.message).slice(0, 140)); }
try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); }
catch (e){ bad('بطاقةُ النسخة لا تُقرأ: ' + String(e.message).slice(0, 140)); }

if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) bad('الحزمةُ ليست خريطةَ مجموعات');

const want = {};
(meta.collections || []).forEach(line => {
  const m = /^(.+?):\s*(\d+)$/.exec(String(line).trim());
  if (m) want[m[1]] = +m[2];
});
if (!Object.keys(want).length) bad('بطاقةُ النسخة بلا أعداد — لا شيءَ يُقارَن به');

const got = {};
let total = 0;
for (const k of Object.keys(bundle)){
  const v = bundle[k];
  const n = Array.isArray(v) ? v.length : (v && typeof v === 'object' ? Object.keys(v).length : 0);
  got[k] = n; total += n;
}

const miss = Object.keys(want).filter(k => k !== 'photos' && !(k in got));
if (miss.length) bad('مجموعاتٌ في البطاقة وليست في الحزمة: ' + miss.join(' · '));

const diff = Object.keys(want).filter(k => k !== 'photos' && got[k] !== want[k])
  .map(k => `${k}: ${got[k]}/${want[k]}`);
if (diff.length) bad('أعدادٌ لا تطابق البطاقة — ' + diff.join(' · '));

if (!total) bad('الحزمةُ خاليةٌ من الوثائق — نسخةٌ بلا بيانات');
if (typeof meta.totalDocs === 'number' && meta.totalDocs !== total)
  bad(`المجموعُ لا يطابق البطاقة: ${total}/${meta.totalDocs}`);

/* مجموعاتٌ لا يصحُّ أن تفرغ: بلا نقاطٍ ولا زياراتٍ ولا حساباتٍ لا يقوم النظام */
const CORE = ['recs', 'users', 'settings'];
const empty = CORE.filter(k => (got[k] || 0) === 0);
if (empty.length) bad('مجموعاتٌ جوهريةٌ فارغةٌ في النسخة: ' + empty.join(' · '));

const top = Object.keys(got).sort((a, b) => got[b] - got[a]).slice(0, 6)
  .map(k => `${k}: ${got[k]}`).join(' · ');
console.log(`✓ النسخةُ تُفَكُّ وتُقرأ — ${Object.keys(got).length} مجموعةً · ${total} وثيقة`);
console.log('  ' + top);
process.exit(0);
