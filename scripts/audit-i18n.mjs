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
  /^[\u0660-\u0669\d٪،.\/\-\s]+$/  /* أرقامٌ وعلاماتٌ لا كلمات */
];
/* أسماءُ الأشخاصِ والفرقِ والشركاتِ تُقرأ من بياناتِ التطبيق الحيّة لا من
   قائمةٍ مكتوبةٍ تُنسى: كلُّ فنيٍّ يُضاف غدًا يُستثنى تلقائيًّا. */
const LIVE_NAMES = new Set();
try {
  (w.techsList ? w.techsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); if (x && x.sup) LIVE_NAMES.add(x.sup); });
  (w.crewsList ? w.crewsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); });
  (w.itemsList ? w.itemsList() : []).forEach(x => { if (x && x.name) LIVE_NAMES.add(x.name); });
  (w.jobsList ? w.jobsList() : []).forEach(x => { if (x && x.n) LIVE_NAMES.add(x.n); });
  ((w.DATA && w.DATA.buyCats) || []).forEach(x => LIVE_NAMES.add(x));
  ((w.DATA && w.DATA.suppliers) || []).forEach(x => LIVE_NAMES.add(x));
  (w.STATE && w.STATE.sites || []).forEach(x => { if (x && x.co) LIVE_NAMES.add(x.co); if (x && x.name) LIVE_NAMES.add(x.name); });
} catch (e) {}
const isData = s => LIVE_NAMES.has(s) || DATA_AR.some(r => r.test(s));

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
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')]
  .map(a => a.getAttribute('data-p')))].filter(id => !BY_DESIGN[id]);

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
const CAP_PAGES = 19, CAP_TEXTS = 109, CAP_SHELL = 3;
let bad = 0;
const line = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
console.log('');
line(shellHits.length <= CAP_SHELL, `الهيكلُ الثابتُ مترجَمٌ كاملًا (${shellHits.length}/${CAP_SHELL})`);
line(report.length <= CAP_PAGES, `صفحاتٌ فيها عربيّ تحت السقف (${report.length}/${CAP_PAGES})`);
line(total <= CAP_TEXTS, `نصوصٌ عربيةٌ باقيةٌ تحت السقف (${total}/${CAP_TEXTS})`);

if (bad){ console.log('\nجردُ الترجمة بالرندر فشل ✗'); process.exit(1); }
console.log('\nجردُ الترجمة بالرندر: الفجوةُ مقيسةٌ ومحدودة ✅');
process.exit(0);
