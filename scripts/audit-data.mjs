/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سلامة البيانات — يُشغَّل: node scripts/audit-data.mjs
   ───────────────────────────────────────────────────────────────────────────
   دفترُ المطابقة يقيس ما يُقرأ على الشاشة. وقد كشفت V14.05 أن أخطرَ ما فات
   ليس زرًّا غائبًا بل عمودًا مقروءًا بمسطرةٍ خاطئة: ألفٌ وثلاثمئةٍ واثنان
   وتسعون مخيمًا حالتُهم «منطقة عرفات» بدل «لم يبدأ» — والشاشةُ لا تشكو، بل
   تعرض الرقمَ الخاطئَ بثقة.

   فهذا الجردُ يعيد بناءَ ما يجب أن يكون من `SITES_RAW` مباشرةً، ويقيس عليه
   ما بناه التطبيقُ فعلًا. الرقمُ الخاطئ في لوحة الوزارة أسوأ من زرٍّ مفقود.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (cond, name) => { if (cond) pass++; else fails.push(name); };
const eq = (a, b, name) => check(a === b, `${name} — المتوقَّع ${b} والموجود ${a}`);

const html = readFileSync('index.html', 'utf8');
const { VirtualConsole } = require('jsdom');
const vc = new VirtualConsole();
const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
/* المتصفّحُ الصوريُّ ينقصه ما في المتصفّحات الحقيقية: مرمِّزُ النصوص الذي
   يُبنى به ملفُّ KMZ، وروابطُ الكائنات التي يُنزَّل بها الملف. وغيابُها يُظهر
   عطلًا في التطبيق وليس فيه عطل — فتُسدّ قبل أن يُتَّهم بريء. */
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (w.URL && !w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}


await new Promise(r => setTimeout(r, 900));
check(boot.length === 0, 'لا خطأَ عند الإقلاع' + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

const RAW = w.SITES_RAW, S = w.STATE.sites;
check(!!RAW && Array.isArray(S), 'البياناتُ محمّلة');

/* ── المرجعُ: يُبنى من الخام لا من التطبيق ───────────────────────────────── */
const camps = RAW.g, pts = RAW.p;
eq(S.length, camps.length + pts.length, 'عدد المواقع');
eq(new Set(S.map(x => x.id)).size, S.length, 'لا معرّفَ مكرّرًا');

/* المخيمُ: 10 بادئة الشبكة · 11 المنطقة · 12 التصنيف — ولا حالةَ في الخام
   والنقطة: 10 المنطقة · 11 الحالة · 12 التصنيف */
const IPRE = /^\d{1,3}(\.\d{1,3}){2}$/;
let badRegion = 0, badNet = 0, badFstat = 0, badInout = 0, badZone = 0, badType = 0;
/* المشعرُ يُدمَج بقرار: نمرةُ في عرفات، والجمراتُ ومنشآتُ التسكين في منى.
   فالمرجعُ قاعدةُ الدمج نفسها لا العمودُ الخام. */
const zoneOf = r => w.zoneOf(RAW.z[r[2]] || '', r[1] || '');
const typeOf = i => RAW.t[i];

camps.forEach(r => {
  const s = S.find(x => x.id === r[0]);
  if (!s) return;
  if (s.region !== (r[11] || '')) badRegion++;
  if ((s.net || '') !== (r[10] || '')) badNet++;
  if (s.fstat !== 'لم يبدأ') badFstat++;
  if (s.inout !== (r[12] || '')) badInout++;
  if (s.zone !== zoneOf(r)) badZone++;
  if (s.type !== typeOf(r[3])) badType++;
});
pts.forEach(r => {
  const s = S.find(x => x.id === r[0]);
  if (!s) return;
  if (s.region !== (r[10] || '')) badRegion++;
  if (s.fstat !== (r[11] || 'لم يبدأ')) badFstat++;
  if (s.inout !== (r[12] || '')) badInout++;
  if (s.zone !== zoneOf(r)) badZone++;
  if (s.type !== typeOf(r[3])) badType++;
});
eq(badZone, 0, 'المشعر مقروءٌ صحيحًا');
eq(badType, 0, 'النوع مقروءٌ صحيحًا');
eq(badRegion, 0, 'المنطقة مقروءةٌ صحيحًا');
eq(badNet, 0, 'بادئةُ الشبكة مقروءةٌ صحيحًا');
eq(badFstat, 0, 'الحالةُ الميدانية مقروءةٌ صحيحًا');
eq(badInout, 0, 'تصنيفُ الحجاج مقروءٌ صحيحًا');

/* لا منطقةَ تحمل عنوانَ شبكة، ولا حالةَ تحمل اسمَ منطقة */
eq(S.filter(x => IPRE.test(x.region || '')).length, 0, 'لا منطقةَ هي عنوانُ شبكة');
eq(S.filter(x => /^منطقة /.test(x.fstat || '')).length, 0, 'لا حالةَ هي اسمُ منطقة');

/* الحالاتُ من قائمةٍ معلومةٍ لا نصٍّ حر */
const FSTAT = new Set(['لم يبدأ','مُركّب','قيد التنفيذ','مُعاد','مُسِح','مفكوك']);
const oddF = [...new Set(S.map(x => x.fstat))].filter(x => !FSTAT.has(x));
check(oddF.length === 0, 'الحالاتُ كلُّها معلومة' + (oddF.length ? ' — الغريب: ' + oddF.join(' · ') : ''));

/* الإحداثياتُ داخل المشاعر — نقطةٌ خارجها تُرسَم في البحر */
const out = S.filter(x => !(x.lat > 21.2 && x.lat < 21.6 && x.lng > 39.7 && x.lng < 40.2));
eq(out.length, 0, 'كلُّ الإحداثيات داخل نطاق المشاعر');

/* الشركاتُ من القائمة الموحّدة — لا اسمَ حرٍّ يصنع شركتين من واحدة */
const CO = new Set(w.CO_LIST);
const oddCo = [...new Set(S.map(x => x.co).filter(Boolean))].filter(c => !CO.has(c));
check(oddCo.length === 0, 'كلُّ شركات المواقع في القائمة الموحّدة'
  + (oddCo.length ? ` — خارجها ${oddCo.length}: ` + oddCo.slice(0,3).join(' · ') : ''));

/* العناوينُ تُشتقّ فعلًا ممّا قُرئ */
const withNet = S.filter(x => x.net);
check(withNet.length > 300, `مواقعُ لها بادئةُ شبكة (${withNet.length})`);
check(withNet.every(x => IPRE.test(x.net)), 'كلُّ البادئات بصيغةٍ سليمة');
check(w.ipsOf(withNet[0].net) !== '—', 'العناوينُ تُشتقّ من البادئة');

/* ── الأرقامُ التي تراها الوزارة ───────────────────────────────────────── */
const byZone = {}, byType = {};
S.forEach(x => { byZone[x.zone] = (byZone[x.zone]||0)+1; byType[x.type] = (byType[x.type]||0)+1; });
const rawZone = {}, rawType = {};
[...camps, ...pts].forEach(r => {
  rawZone[zoneOf(r)] = (rawZone[zoneOf(r)]||0)+1;
  rawType[typeOf(r[3])] = (rawType[typeOf(r[3])]||0)+1;
});
check(JSON.stringify(byZone) === JSON.stringify(rawZone), 'توزيعُ المشاعر يطابق الخام');
check(JSON.stringify(byType) === JSON.stringify(rawType), 'توزيعُ الأنواع يطابق الخام');

/* الإحصاءُ المعروضُ على اللوحة يُبنى من نفس المصدر */
if (typeof w.siteStats === 'function'){
  const st = w.siteStats();
  eq(st.total != null ? st.total : S.length, S.length, 'إجماليُّ اللوحة يطابق العدد');
}

/* ── الحصاد ─────────────────────────────────────────────────────────────── */
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ البيانات نظيف ✅');
process.exit(0);
