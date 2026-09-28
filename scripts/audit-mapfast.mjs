/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خفّة الخريطة — node scripts/audit-mapfast.mjs   (V24.1)
   ───────────────────────────────────────────────────────────────────────────
   كان كلُّ تحريكٍ يمسح العلاماتِ كلَّها ويُنشئها (نحو ثلاثِمئة ملّي ثانية)، والممرّاتُ
   والكاميراتُ عناصرَ DOM فوق المخيمات، وطبقةُ التفويج فوق لوح النقاط تغطّي المخيمات.
   صارت العلاماتُ باقيةً تُعدَّل، والمعيّناتُ على اللوح، والمخطّطُ تحت المخيمات.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const fn = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) return ''; const j = html.indexOf('\nfunction ', i + 10); return html.slice(i, j); };
const paint = fn('mapPaint'), init = fn('mapInit'), tfw = fn('tfwPaint'), loc = fn('mapLocate');
const head = paint.slice(0, paint.indexOf('typeof ROUTE'));
console.log('\n══ الخريطةُ لا تُعاد من الصفر ══');
T(paint.length > 1000 && !/MAP_LAYER\.clearLayers\(\)/.test(paint) && /MK\.by\[/.test(paint) && /\.setStyle\(/.test(paint) && /e\.key === key/.test(paint), 'العلاماتُ باقيةٌ تُعدَّل خصائصُها لا تُمسَح وتُعاد');
T(head.length > 500 && !/divIcon/.test(head) && /mapShapeOf\(x\.type\)/.test(head) && /shapeMk\(pos/.test(head) && /L\.CircleMarker\.extend/.test(html) && /SHAPE_UNIT\[this\.options\.shape\]/.test(html), 'الممرُّ والكاميرا وكلُّ شكلٍ علامةٌ على اللوح بحجمٍ ثابت — لا عناصرَ DOM ولا إعادةَ مع التقريب');
T(/kind === 'poly'/.test(head) && /bringToBack\(\)/.test(head), 'مضلّعاتُ المخيمات إلى الخلف فتبقى النقاطُ فوقها');
T(/b\.pad\(/.test(head) && /removeLayer\(MK\.by\[/.test(paint), 'وما ابتعد عن الشاشة يُطرَح ويعود حين يقترب');
T(/MAP_TMP\.clearLayers\(\)/.test(paint) && /addTo\(MAP_TMP\)/.test(paint) && /if \(MAP_ME_LL\)/.test(paint) && !/addTo\(MAP_LAYER\)/.test(paint.slice(paint.indexOf('typeof ROUTE'))), 'المؤقّتاتُ (موضعُك ومسارُ الرسم) في مجموعتها تُمسَح وحدَها');
T(/MAP_TMP\s*=\s*L\.layerGroup\(\)\.addTo\(MAP\)/.test(init) && /MK\.by = \{\}/.test(init), 'التهيئةُ تُنشئ مجموعةَ المؤقّتات وتصفّر سجلَّ العلامات');
T(/addTo\(MAP_TMP \? MAP_TMP : MAP\)/.test(loc), 'وعلامةُ «موقعي» في المؤقّتات');
console.log('\n══ طبقةُ التفويج ══');
T(/createPane\('tfw'\)/.test(tfw) && /zIndex = 350/.test(tfw) && /pane:'tfw'/.test(tfw), 'المخطّطُ تحت لوح النقاط (350 < 400) فلا يغطّي المخيمات');
const TF = JSON.parse(readFileSync('layers/tafweej.json', 'utf8'));
T(TF.v >= 2 && TF.reg && Object.keys(TF.reg.floors).length === 5 && Object.values(TF.reg.floors).every(r => r.rot <= -1 && r.rot >= -5 && r.s > 0.95 && r.s < 1.05), 'صورُ الأدوار الخمسة في إطارها الصحيح: دورانُ كلٍّ منها مقيسٌ ومسجَّل');
T(/\?v=' \+ \(TFW\.data\.v \|\| 1\)/.test(tfw), 'والصورةُ المصحَّحةُ تُطلَب باسمٍ جديدٍ فلا تُعرَض القديمةُ من الذاكرة');
const ex = id => { const m = html.match(new RegExp('\\["' + id + '","[^"]*",\\d+,\\d+,\\d+,([\\d.]+),([\\d.]+)')); return m ? [+m[1], +m[2]] : null; };
const e14 = ex('NSK-JMR-PNT-0014'), e18 = ex('NSK-JMR-PNT-0018'), n5 = ex('NSK-JMR-PNT-0005');
T(e14 && Math.abs(e14[0] - 21.420389) > 0.0005 && e18 && n5 && Math.hypot((e18[0] - n5[0]) * 110574, (e18[1] - n5[1]) * 103600) > 150, 'ومخارجُ الجمرات نُقلت بالتصحيح نفسِه — ما زالت على بداية خطِّ العودة لا حول المداخل');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ خفّة الخريطة نظيف \u2705');
