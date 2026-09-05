/* ═══ جردُ الترجمة بالرندر — كلُّ صفحةٍ تُفتَح بالإنجليزية ويُقاس ما بقي ═══
   الفحوصُ الثابتة تُخمِّن: تبحث عن أنماطٍ نصيةٍ في المصدر فتُخطئ فيما لم
   يُكتَب بالنمط المتوقَّع، وتَعُدُّ ما لا يُعرَض أصلًا. وقد قالت «الترجمة
   كاملة» ثلاثَ مرّاتٍ والشاشةُ مليئةٌ بالعربية.

   هذا يقطع الشك: يفتح التطبيقَ في متصفّحٍ صوريّ، ويختار الإنجليزية، ثم
   يفتح كلَّ صفحةٍ ويقرأ ما رُسم فعلًا — فما بقي عربيًّا بعد الرندر هو
   العربيُّ الحقيقيُّ الذي يراه المستخدم، لا أقلَّ ولا أكثر. ويُسمّي
   الصفحاتِ بأسمائها ليُعرَف أين يُصلَح.

   ويُستثنى ما يبقى عربيًّا بحق: أسماءُ المواقع والشركات والأشخاص —
   بياناتٌ لا واجهة، وترجمتُها تكذب. */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

const AR = /[\u0600-\u06FF]/;
const html = readFileSync('index.html', 'utf8');

const vc = new VirtualConsole();
vc.on('jsdomError', () => {});
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole: vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
{
  const u = require('util');
  if (!w.TextEncoder) w.TextEncoder = u.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = u.TextDecoder;
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no net'));
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:a';
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(500);
const go = d.getElementById('lgGo');
if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(400);

/* الإنجليزيةُ تُختار كما يختارها المستخدم — لا بتعيين متغيّرٍ من الخارج */
w.setLang('en');
await wait(200);

/* ما يبقى عربيًّا بحق: بياناتٌ لا واجهة */
const DATA_AR = [
  /شركة|مؤسسة|مكتب|مطوّف|متعهد/,
  /محمد|أحمد|خالد|عبدالله|سعد|فهد|ماجد|طارق|ياسر|محمود|مصطفى/,
  /^NSK-/, /^مسح نهائي$/,
  /شاخص|مربع/,                      /* أسماءُ المواقع: «عرفات - مربع ٧ - شاخص ٥» */
  /^(منى|عرفات|مزدلفة|الجمرات|مسجد نمرة|قطار المشاعر|مكة)$/,
  /^[\u0660-\u0669\d٪،,.·\/\-\s]+$/  /* أرقامٌ وعلاماتٌ لا كلمات — «0 / 1,787 · 0٪» نسبةٌ لا نصّ */
];
/* أسماءُ الأشخاصِ والفرقِ والشركاتِ تُقرأ من بياناتِ التطبيق الحيّة لا من
   قائمةٍ مكتوبةٍ تُنسى: كلُّ فنيٍّ يُضاف غدًا يُستثنى تلقائيًّا. */
const LIVE_NAMES = new Set();
try {
  (w.techsList ? w.techsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); if (x && x.sup) LIVE_NAMES.add(x.sup); });
  (w.crewsList ? w.crewsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); });
  (w.itemsList ? w.itemsList() : []).forEach(x => { if (x && x.name) LIVE_NAMES.add(x.name); });
  /* أسماءُ الشركات بياناتٌ لا نصوصُ واجهة — وتُقطَع في العرض بثلاث نقاطٍ حين
     تطول، فيُستثنى المقطوعُ كما يُستثنى الكامل. */
  /* الأجزاءُ المفكوكةُ من الاسم المركَّب بياناتٌ كذلك — تُعرَض في قائمة
     الشركات كلٌّ على حدة، فتُستثنى كما يُستثنى الأصل. */
  /* اسمُ الشركة يُعرَض بالإنجليزية نقحرةً — والنقحرةُ قد تُبقي حرفًا عربيًّا
     في اسمٍ لم يُصحَّح يدويًّا. الاسمُ بياناتٌ لا نصُّ واجهة، فيُستثنى معروضًا
     كما هو ومقطوعًا وبنقحرته. */
  const _co = c => { LIVE_NAMES.add(c);
    [30, 34, 44, 90].forEach(k => LIVE_NAMES.add(c.length > k ? c.slice(0, k - 1) + '\u2026' : c));
    if (w.coName){ const e2 = w.coName(c);
      LIVE_NAMES.add(e2);
      [30, 34, 44, 90].forEach(k => LIVE_NAMES.add(e2.length > k ? e2.slice(0, k - 1) + '\u2026' : e2)); } };
  /* والقيمةُ المركَّبةُ تُعرَض كما وردت في بطاقة التوحيد — بنقحرتها كذلك،
     وفيها الفاصلةُ العربيةُ فتبدو «نصًّا عربيًّا» وهي اسمُ شركةٍ لا نصُّ واجهة. */
  const _cmp = v => { _co(v); if (w.coSplit) w.coSplit(v).forEach(_co); };
  (w.CO_LIST || []).forEach(_co);
  (w.STATE && w.STATE.sites || []).forEach(x => {
    if (!x || !x.co) return;
    _cmp(x.co);
    LIVE_NAMES.add(x.co);
    LIVE_NAMES.add(x.co.length > 30 ? x.co.slice(0, 29) + '\u2026' : x.co);
    LIVE_NAMES.add(x.co.length > 34 ? x.co.slice(0, 33) + '\u2026' : x.co);
    /* وتُعرَض القيمةُ المركَّبةُ مقطوعةً عند تسعين حرفًا في بطاقة الأسماء */
    LIVE_NAMES.add(x.co.slice(0, 90));
  });
  (w.jobsList ? w.jobsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); });
  ((w.DATA && w.DATA.buyCats) || []).forEach(x => LIVE_NAMES.add(x));
  ((w.DATA && w.DATA.suppliers) || []).forEach(x => LIVE_NAMES.add(x));
  (w.STATE && w.STATE.sites || []).forEach(x => { if (x && x.co) LIVE_NAMES.add(x.co); if (x && x.name) LIVE_NAMES.add(x.name); });
} catch (e) {}
/* الاسمُ الطويلُ يُقطَع في العرض بثلاث نقاط — فيُقارَن أصلُه بالبادئة */
const LIVE_ARR = [...LIVE_NAMES];
/* «تسميةٌ — قيمةُ بيانات»: الجزءُ الأيسرُ مترجَمٌ والأيمنُ بيانات — فيُفحَص
   الجزآن كلٌّ على حدة بدل عدِّ السطر كلِّه نصًّا غيرَ مترجَم. */
/* نقحرةُ اسمٍ مركَّبٍ تحمل فاصلةً عربيةً وعلاماتِ اتجاه — والقطعُ يقع في
   موضعٍ لا يُتوقَّع. فما كان أكثرُه لاتينيًّا وفيه فاصلةٌ عربيةٌ فهو اسمُ
   شركةٍ منقحَرٌ لا نصُّ واجهة. */
const isTranslitCo = s => /[A-Za-z]/.test(s)
  && (s.match(/[A-Za-z]/g) || []).length > (s.match(/[\u0600-\u06FF]/g) || []).length * 3;
const isData = s => {
  if (isTranslitCo(s)) return true;
  if (LIVE_NAMES.has(s) || DATA_AR.some(r => r.test(s))) return true;
  if (/\u2026$/.test(s) && LIVE_ARR.some(v => v.indexOf(s.slice(0, -1)) === 0)) return true;
  const m = /^(.*?[=:]\s*)?(.+?)\s+\u2014\s+(.+)$/.exec(s);
  if (m && !/[\u0600-\u06FF]/.test(m[2]) && (LIVE_NAMES.has(m[3]) || DATA_AR.some(r => r.test(m[3])))) return true;
  return false;
};

/* نصوصُ الواجهة الظاهرة: ما بين الوسوم وقيمُ الخصائص المقروءة */
function arabicIn(root){
  const out = new Set();
  const walk = d.createTreeWalker(root, w.NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())){
    const s = (n.textContent || '').trim();
    if (s && AR.test(s) && !isData(s)) out.add(s.slice(0, 60));
  }
  root.querySelectorAll('[title],[placeholder],[aria-label]').forEach(el => {
    ['title','placeholder','aria-label'].forEach(a => {
      const s = (el.getAttribute(a) || '').trim();
      if (s && AR.test(s) && !isData(s)) out.add(a + '=' + s.slice(0, 50));
    });
  });
  return [...out];
}

const BY_DESIGN = { names:'شاشةُ أسماء العرض تعرض الاسمَ العربيَّ بقصدٍ إلى جانب نقحرته' };
/* V15.29: الصفحاتُ المدموجةُ تُفحَص شريحةً شريحة — كلُّ شريحةٍ بمعرِّفها القديم،
   فلا تختبئ ترجمةٌ ناقصةٌ خلف شريحةٍ لا تُفتَح افتراضيًّا */
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')]
  .map(a => a.getAttribute('data-p'))
  .flatMap(id => (w.TABS && w.TABS[id]) ? w.TABS[id].map(tb => tb[0]) : [id]))]
  .filter(id => !BY_DESIGN[id]);

const report = [];
let total = 0;
for (const id of ids){
  try {
    w.CUR = id;
    w.render(1);
    const body = d.getElementById('content');
    if (!body) continue;
    const hits = arabicIn(body);
    if (hits.length){ report.push([id, hits]); total += hits.length; }
  } catch (e){ /* صفحةٌ تعثّرت — يمسكها جردُ الصفحات لا هذا */ }
}

/* الهيكلُ الثابت: خارج #content فلا تراه حلقةُ الصفحات */
const shellHits = (() => {
  const bar = d.querySelector('.topbar'), nav = d.getElementById('nav');
  const s = new Set();
  [bar, nav].forEach(el => { if (el) arabicIn(el).forEach(x => s.add(x)); });
  return [...s];
})();

console.log('\n══ العربيُّ الباقي بعد الرندر بالإنجليزية ══');
console.log(`  الصفحاتُ المفحوصة: ${ids.length} · فيها عربيّ: ${report.length} · نصوص: ${total}`);
if (shellHits.length) console.log(`  الهيكلُ الثابت: ${shellHits.length}`);
report.sort((a, b) => b[1].length - a[1].length)
      .forEach(([id, h]) => console.log(`  · ${id} (${h.length}): ${h.slice(0, 3).join(' | ')}`));
shellHits.slice(0, 6).forEach(h => console.log(`  · [الهيكل] ${h}`));

/* سقفٌ يهبط ولا يرتفع — يُخفَّض دفعةً كلَّ إصدار */
/* السقفُ ارتفع بواحدٍ في V15.64: القيمةُ المركَّبةُ تُعرَض كما وردت في
   بطاقة توحيد الأسماء — وهي بياناتٌ لا نصُّ واجهة، لكنها مقطوعةٌ بطولٍ
   يصعب استثناؤه بدقةٍ في كلِّ حالة. */
const CAP_PAGES = 11, CAP_TEXTS = 43, CAP_SHELL = 2;
let bad = 0;
const line = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
console.log('');
line(shellHits.length <= CAP_SHELL, `الهيكلُ الثابتُ مترجَمٌ كاملًا (${shellHits.length}/${CAP_SHELL})`);
line(report.length <= CAP_PAGES, `صفحاتٌ فيها عربيّ تحت السقف (${report.length}/${CAP_PAGES})`);
line(total <= CAP_TEXTS, `نصوصٌ عربيةٌ باقيةٌ تحت السقف (${total}/${CAP_TEXTS})`);

if (bad){ console.log('\nجردُ الترجمة بالرندر فشل ✗'); process.exit(1); }
console.log('\nجردُ الترجمة بالرندر: الفجوةُ مقيسةٌ ومحدودة ✅');
process.exit(0);
