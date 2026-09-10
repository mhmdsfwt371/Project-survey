/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مجلدات الصور — node scripts/audit-photo-folders.mjs
   ───────────────────────────────────────────────────────────────────────────
   لكلِّ نقطةٍ مجلدُها على الدرايف باسمها لا بمعرِّفها وحدَه (V16.79). وهذا
   الجردُ يشغّل بانيَ الأسماء الذي في `photos-sync.mjs` نفسِه — لا نسخةً منه —
   على سجل النقاط الحقيقيِّ في `index.html`، فيثبت أربعة:
     ١ · يُقرأ السجلُّ كلُّه — وقد سقط أوّلَ مرةٍ لأن نهايةَ الكائن التُمست
         بنمطٍ نصّيٍّ («\n};») لا بعدِّ الأقواس، فجاء النصُّ ليس بجيسون.
     ٢ · الاسمُ يبدأ بالمعرِّف دائمًا — به يُطابَق المجلدُ الموجود فيُعاد
         تسميتُه لا يُنشَأ غيرُه، فلا يتكرّر مجلدٌ ولا ينكسر رابط.
     ٣ · المخيمُ يُقدَّم شاخصُه — وهو ما يُعرَف به في الميدان.
     ٤ · وما لا اسمَ له يبقى بمعرِّفه ولا يصير مجلدًا بلا عنوان.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };

/* بانيَ الأسماء يُقتطَع من السكربت نفسِه ويُشغَّل — فما يُفحَص هو ما يعمل */
const src = readFileSync('scripts/photos-sync.mjs', 'utf8');
const a = src.indexOf('const SITE_LABEL = new Map();');
const b = src.indexOf('const labelOf =');
T(a > 0 && b > a, 'بانيَ الأسماء موجودٌ في photos-sync (يُقتطَع ويُشغَّل هنا)');
if (a < 0 || b < a){ console.log('\nجردُ مجلدات الصور فشل ✗'); process.exit(1); }

const tmp = join(tmpdir(), `nsk-labels-${process.pid}.mjs`);
writeFileSync(tmp, "import { readFileSync } from 'fs';\n" + src.slice(a, b) + '\nexport { SITE_LABEL };\n');
let M;
try { M = (await import('file://' + tmp)).SITE_LABEL; } finally { try { unlinkSync(tmp); } catch {} }

/* ١ · السجلُّ يُقرأ كلُّه — يُقارَن بعددِ صفوفه في index.html */
const html = readFileSync('index.html', 'utf8');
const rows = (html.match(/"NSK-[A-Z]{3}-[A-Z]{3}-\d{4}"/g) || []);
const uniq = new Set(rows.map(s => s.slice(1, -1)));
T(M.size > 1000 && M.size === uniq.size,
  `سجلُّ النقاط يُقرأ كلُّه: ${M.size} نقطةً (وفي index.html ${uniq.size})`);

/* ٢ · المعرِّفُ في صدر كلِّ اسم — مفتاحُ المطابقة عند إعادة التسمية */
const heads = [...M.entries()].filter(([id, lab]) => lab.split(' — ')[0] !== id);
T(heads.length === 0, 'كلُّ اسمٍ يبدأ بمعرِّف نقطته — فيُطابَق المجلدُ القديمُ ويُعاد تسميتُه'
  + (heads.length ? ' — شاذٌّ: ' + heads.slice(0, 2).map(x => x[1]).join(' | ') : ''));

/* ٣ · المخيمُ بشاخصه أوّلًا */
const camps = [...M.entries()].filter(([id]) => /-CMP-/.test(id));
const signed = camps.filter(([, lab]) => / — شاخص /.test(lab));
T(camps.length > 500 && signed.length / camps.length > 0.9,
  `المخيماتُ بشاخصها أوّلًا: ${signed.length} من ${camps.length}`);

/* ٤ · لا مجلدَ بلا عنوان، ولا مشعرٌ مكرَّرٌ في صدر الاسم */
const bare = [...M.values()].filter(v => !/ — /.test(v));
T(bare.length < camps.length * 0.1, `ما لا اسمَ له يبقى بمعرِّفه وحدَه: ${bare.length}`);
/* المشعرُ المكرَّرُ يُقاس في أوّل الاسم وحدَه: «محطة منى ٣ — الجمرات» اسمُ
   محطةٍ لا تكرارَ فيه، والمرفوضُ أن يبدأ الاسمُ بعد المعرِّف بمشعرٍ يحمله
   المعرِّفُ أصلًا. */
const zoneDup = [...M.values()].filter(v => /^(منى|عرفات|الجمرات|مسجد نمرة) - /.test(v.split(' — ')[1] || ''));
T(zoneDup.length === 0, 'لا مشعرَ مكرَّرًا في صدر الاسم (المعرِّفُ يحمله أصلًا)'
  + (zoneDup.length ? ' — ' + zoneDup.slice(0, 2).join(' | ') : ''));

/* ٥ · حدُّ الطول: اسمٌ يطول يُقتطَع في شبكة الدرايف فلا يُقرأ ما يميّزه */
const longest = Math.max(...[...M.values()].map(v => v.length));
T(longest <= 130, `أطولُ اسمِ مجلدٍ ${longest} حرفًا — تحت الحدِّ`);

/* ٦ · لا اسمَين متطابقَين — وإلا التبس مجلدٌ بمجلد */
const seen = new Map();
for (const v of M.values()) seen.set(v, (seen.get(v) || 0) + 1);
const dups = [...seen.entries()].filter(([, n]) => n > 1);
T(dups.length === 0, 'لا اسمَ مجلدٍ يتكرّر' + (dups.length ? ` — ${dups.length}` : ''));

/* ٧ · الترتيبُ في السكربت: تُقرأ المجلداتُ مرةً، وتُعاد التسميةُ بلا إنشاء */
T(/files\.list\(\{[\s\S]{0,400}pageSize: 1000/.test(src) && /nextPageToken/.test(src),
  'مجلداتُ النقاط تُقرأ صفحةً صفحةً مرةً في الدورة — لا استعلامَ لكلِّ نقطة');
T(/files\.update\(\{ fileId: dirId, requestBody: \{ name: want \}/.test(src),
  'إعادةُ التسمية تُغيّر الاسمَ وحدَه — المعرِّفُ والرابطُ والصورُ كما هي');

console.log(bad ? `\nجردُ مجلدات الصور فشل ✗ (${bad})` : '\nلكلِّ نقطةٍ مجلدُها باسمها ✅');
process.exit(bad ? 1 : 0);
