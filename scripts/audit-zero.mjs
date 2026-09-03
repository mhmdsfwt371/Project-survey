/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الحالة الصفرية — يُشغَّل: node scripts/audit-zero.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجرودُ تفحص أن الشاشةَ ترسم، وأن الزرَّ يكتب، وأن الورقةَ تُولَّد. ولا
   يفحص واحدٌ منها **أن الرقمَ المعروضَ له مصدر**.

   فمرّت `STAGES` — مصفوفةٌ محفورةٌ تقول «التوريد ١٣٧ من ١٧٨٧» و«في المخزن
   ١٢٦» — والمخزنُ فارغٌ تمامًا. ومرّت أحداثٌ مزروعةٌ في شاشة السجلات. ومرّ
   «تهيئة المخيم ٢٣ نقطة». كلُّها شاشاتٌ ترسم وأزرارٌ تكتب وأرقامٌ مخترعة.

   والحيلةُ في القياس: **في نظامٍ لا سجلَّ فيه، كلُّ رقمٍ غيرِ صفرٍ لا يعود
   إلى بيانةٍ مرجعيةٍ فهو مخترَع**. فتُفرَّغ الحالةُ ثم تُقرأ الشاشاتُ، ويُقاس
   كلُّ عددٍ على مجموعةِ ما يمكن أن يُشتَقَّ منها — وما خرج عنها يُسمَّى.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) console.error('ERR:', String(e.message).slice(0, 80)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
{
  const u = require('util');
  if (!w.TextEncoder) w.TextEncoder = u.TextEncoder;
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'b';
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
await new Promise(r => setTimeout(r, 900));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 700));
w.toast = () => {};

/* ── تُفرَّغ الحالةُ من كلِّ ما يُسجَّل: يبقى المرجعُ وحدَه ───────────────── */
['recs','inss','tasks','diss','photos','moves','buys','notifs','events','fixreqs',
 'coreqs','newsites','stats','ships','vehicles','vehAsn','queue','users','accounts']
  .forEach(k => { w.STATE[k] = Array.isArray(w.STATE[k]) ? [] : {}; });
w.statBump();

/* ── ما يمكن أن يُشتَقَّ من المرجع: أعدادُ المواقع بكلِّ تجميعٍ ممكن ────────
   وأطوالُ القوائم المرجعية. يُبنى من البيانات لا يُكتَب رقمًا — وإلا كان
   المقياسُ نفسُه رقمًا محفورًا. */
const allow = new Set([0, 1]);
const add = n => { if (Number.isFinite(n) && n >= 0) allow.add(Math.round(n)); };

const sites = w.STATE.sites || [];
add(sites.length);
const groups = [['zone'], ['type'], ['work'], ['co'], ['zone','type'], ['zone','work']];
groups.forEach(keys => {
  const c = {};
  sites.forEach(x => { const k = keys.map(f => x[f]).join('|'); c[k] = (c[k] || 0) + 1; });
  Object.values(c).forEach(add);
});
/* المجاميعُ الجزئيةُ التي تُعرَض: كلُّ نوعٍ عبر المشاعر، وكلُّ مشعرٍ عبر الأنواع */
['type','zone'].forEach(f => {
  const c = {};
  sites.forEach(x => { c[x[f]] = (c[x[f]] || 0) + 1; });
  Object.values(c).forEach(add);
});
/* المتمِّماتُ تُعرَض كما تُعرَض الأعداد: «كم بلا شبكة» و«كم بلا شركة» */
['net','co','sign','sq','work','region'].forEach(f => {
  add(sites.filter(x => x[f]).length);
  add(sites.filter(x => !x[f]).length);
});
/* مجاميعُ التخطيط: أيامُ الفريق تُجمَع من قسمة كلِّ نوعٍ على معدّله */
{
  const byT = {};
  sites.forEach(x => { byT[x.type] = (byT[x.type] || 0) + 1; });
  const vals = Object.values(byT);
  for (let a = 1; a <= 8; a++)
    for (let b = 1; b <= 8; b++)
      vals.forEach(v1 => vals.forEach(v2 => {
        add(Math.round(v1 / a) + Math.round(v2 / b));
      }));
}
[w.techsList(), w.itemsList(), w.jobsList(), w.crewsList(), w.vehKinds(),
 w.CO_LIST, Object.keys(w.typesList()), Object.keys(w.ROLES), w.SUP_KINDS || []]
  .forEach(L => { if (L) add(L.length); });
/* النسبُ المئويةُ من صفرٍ إلى مئة تُعرَض بطبعها */
for (let i = 0; i <= 100; i++) allow.add(i);
/* السنواتُ الهجريةُ والميلادية أسماءٌ لا أعداد */
[1447, 1448, 1449, 2026, 2030, 24, 30, 60, 90, 365].forEach(n => allow.add(n));
/* ٩٦٦ رمزُ الاتصال الدوليّ للمملكة — يُذكَر في شرح تصحيح رقم الجوّال،
   وهو اسمٌ لا عدد. */
allow.add(966);

/* ما يُشتَقُّ بضربٍ أو جمعٍ من المرجع: أزمنةُ التركيب، وحاجةُ الفرق،
   وأيامُ العمل، وحصةُ الخطة، وحجمُ الصور المتوقَّع، وعناوينُ الشبكة.
   وهذه أرقامٌ لها مصدرٌ يُحسَب — تُبنى هنا كما تُبنى هناك، فإن اختلفت ظهرت. */
{
  const T = t2 => sites.filter(x => x.type === t2).length;
  [[45, 'مخيم'], [90, 'ممر']].forEach(([min, ty]) => {
    add(Math.round(T(ty) * min / 60));          /* ساعاتُ التركيب */
  });
  [3, 4, 5, 6].forEach(mo => {                  /* أيامُ العمل بمُددٍ مختلفة */
    add(mo * 26); add(mo * 30);
  });
  const camps = T('مخيم'), cors = T('ممر');
  [camps, cors].forEach(v => {
    [2, 3, 4].forEach(k => { add(Math.ceil(v / k)); add(v * k); });
    add(Math.round(v / 2)); add(v + cors); add(camps + cors);
  });
  add(Math.round((camps + cors) * 0.72));        /* تقديرُ حجم الصور */
  /* V15.29: «المواعيد والأزمنة» تعدّ النقاطَ بـsiteZone — كلُّ ما ليس مخيمًا
     ممرٌّ (كاميرات ومحطات وجمرات وبوابات معًا) — وتحسب ساعاتِ التركيب من
     دقائقَ في CFG لا من ٤٥ و٩٠ مكتوبتَين */
  add(sites.length - camps);
  const mC = w.cfgGet ? w.cfgGet('minCamp') : 0, mR = w.cfgGet ? w.cfgGet('minCor') : 0;
  add(Math.round(camps * mC / 60)); add(Math.round((sites.length - camps) * mR / 60));
  add(Math.round((camps * mC + (sites.length - camps) * mR) / 60));
  sites.forEach(x => { if (x.net) { const p = String(x.net).split('.')[0]; add(+p); } });
  Object.keys(w.CFG || {}).forEach(k => { const v = w.CFG[k]; if (typeof v === 'number') add(v); });
  /* تقديراتٌ تُحسَب بضربٍ في متوسّطٍ معلن: حجمُ الصور، وطاقةُ الفريق،
     وعددُ الأيام. تُبنى هنا كما تُبنى هناك. */
  const n0 = sites.length;
  [0.7, 0.72, 0.75, 1.4, 1.8, 2.4].forEach(f => { add(Math.round(n0 * f)); add(Math.round(n0 * f / 1.024)); });
  [2, 3, 4, 5, 6, 8, 10, 12].forEach(k => { add(Math.ceil(n0 / k)); add(Math.round(n0 / k)); });
}

/* أرقامٌ داخلَ أسماء القطع — «لوح سولار ٤٠٠و» و«بطارية ٢٠٠أ» — أسماءٌ لا أعداد */
(w.itemsList() || []).forEach(it => {
  (String(it.name).match(/[٠-٩0-9]+/g) || []).forEach(x => {
    const n = parseInt(AR2EN0(x), 10);
    if (Number.isFinite(n)) allow.add(n);
  });
});
function AR2EN0(s2){ return String(s2).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660)); }

/* ── تُقرأ الشاشاتُ ويُقاس كلُّ عدد ────────────────────────────────────── */
const AR2EN = s => s.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
                    .replace(/[٬,]/g, '');
const found = {};
w.ROLE = 'admin';
const pages = Object.keys(w.PAGE);
let drawn = 0;
for (const p of pages) {
  w.CUR = p;
  try { w.render(1); } catch (e) { continue; }
  drawn++;
  /* يُقرأ كلُّ عنصرٍ ورقيٍّ على حِدة: `textContent` للصفحة كلِّها يلصق أرقامَ
     خلايا متجاورةٍ فيصير «٧١٣» و«٠» رقمًا واحدًا «٧١٣٠»، وهو إنذارٌ كاذب. */
  const root = d.getElementById('content');
  /* الورقةُ الحقّة: عنصرٌ لا عنصرَ فيه. وإلا لُصقت أرقامُ أبنائه فصار
     «١٧٠» و«٠» رقمًا واحدًا «١٧٠٠» — وهو إنذارٌ كاذب. */
  const leaves = [...root.querySelectorAll('*')]
    .filter(el => el.children.length === 0 && (el.textContent || '').trim());
  leaves.forEach(el => {
    const t = el.textContent || '';
    [...t.matchAll(/[٠-٩][٠-٩٬]*/g)].forEach(m => {
      const n = parseInt(AR2EN(m[0]), 10);
      if (!Number.isFinite(n)) return;
      if (allow.has(n)) return;
      (found[n] = found[n] || new Set()).add(p);
    });
  });
  /* وقيمُ الحقول: تُقرأ من الخاصية لا من النص */
  [...root.querySelectorAll('input[value]')].forEach(el => {
    const n = parseInt(AR2EN(el.getAttribute('value') || ''), 10);
    if (!Number.isFinite(n) || allow.has(n)) return;
    (found[n] = found[n] || new Set()).add(p + ':حقل');
  });
}

/* ── ما لا مصدرَ له ─────────────────────────────────────────────────────── */
const bad = Object.keys(found).map(Number).sort((a, b) => b - a);
console.log('الشاشاتُ المقروءة:', drawn, '· أعدادٌ مسموحةٌ مشتقّة:', allow.size);
console.log('');
if (!bad.length) {
  console.log('نجح — لا رقمَ معروضٌ بلا مصدر ✅');
  process.exit(0);
}
console.log('أرقامٌ لا تعود إلى بيانةٍ مرجعية:');
bad.forEach(n => console.log('  ✗ ' + String(n).padStart(8) + '   في: ' + [...found[n]].join(' · ')));
console.log('');
console.log('كلُّ رقمٍ هنا إمّا مخترَعٌ في الشيفرة، أو مشتقٌّ من مصدرٍ لم يعرفه هذا الجرد.');
console.log('فإن كان مشتقًّا فأضِف مصدرَه إلى `allow` أعلاه — ولا يُسكَت عنه بلا سبب.');
process.exit(1);
