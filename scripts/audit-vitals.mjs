/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مؤشّرات الأداء — node scripts/audit-vitals.mjs
   ───────────────────────────────────────────────────────────────────────────
   القياسُ بالواجهة الأصلية: تُحاكى PerformanceObserver بيدٍ فتُدفَع مداخلُ
   معلومةٌ ويُقاس p75 عليها؛ وبلا واجهةٍ تعود القيمُ null بلا خطأ؛ ولا كتابةَ
   جديدةً ولا مستمعًا — الملخّصُ يركب النبضة؛ والبطاقةُ تجمع الأجهزةَ وتصنّف
   على عتبات جوجل.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');

console.log('\n══ ١ · لا كتابةَ ولا مستمعًا جديدًا ══');
const blk = /\/\* ═══ مؤشّراتُ الأداء الأصليةُ في المتصفّح \(V17\.98\)[\s\S]*?function perfSummary\(\)\{[\s\S]*?\n\}/.exec(html)[0];
T(!/CORE\.|FB\.|onSnapshot|lsSet\(/.test(blk), 'القياسُ في الذاكرة فقط — لا قاعدةَ ولا تخزين');
T(/pf:\(typeof perfSummary === 'function' \? perfSummary\(\) : null\)/.test(html), 'والملخّصُ يركب نبضةَ الحضور نفسَها');

async function boot(withPO){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(w){
    if (withPO){
      w.__po = [];
      class PO { constructor(fn){ this.fn = fn; } observe(o){ w.__po.push({ type:o.type, fn:this.fn }); } disconnect(){} }
      PO.supportedEntryTypes = ['largest-contentful-paint', 'event', 'layout-shift', 'longtask'];
      w.PerformanceObserver = PO;
    } else { delete w.PerformanceObserver; }
  } });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1500); return { w, d, wait, dom };
}

console.log('\n══ ٢ · مع الواجهة: مداخلُ معلومةٌ وp75 صحيح ══');
{
  const { w, wait, dom } = await boot(true);
  const feed = (type, entries) => w.__po.filter(o => o.type === type).forEach(o => o.fn({ getEntries: () => entries }));
  T(w.__po.length === 4 && w.VIT.sup.lcp && w.VIT.sup.inp && w.VIT.sup.cls && w.VIT.sup.lt, 'أربعةُ مراقبين: LCP وINP وCLS والمهامُّ الطويلة');
  feed('largest-contentful-paint', [{ startTime:1200 }, { startTime:1800 }]);
  feed('event', [{ interactionId:1, duration:80 }, { interactionId:2, duration:120 }, { interactionId:3, duration:400 }, { interactionId:0, duration:900 }]);
  feed('layout-shift', [{ value:0.05, hadRecentInput:false }, { value:0.5, hadRecentInput:true }, { value:0.02, hadRecentInput:false }]);
  feed('longtask', [{}, {}, {}]);
  const s = w.perfSummary();
  T(s.lcp.n === 2 && s.lcp.p75 === 1800 && s.lcp.max === 1800, 'LCP: عددٌ وp75 وأقصى');
  T(s.inp.n === 3 && s.inp.p75 === 400, 'INP من التفاعلات وحدَها (الحدثُ بلا معرِّفٍ لا يُعَدّ) وp75 = ٤٠٠');
  T(s.cls === 0.07 && s.lt === 3, 'CLS يتجاهل ما بعد الإدخال (٠٫٠٧)، والمهامُّ الطويلة ٣');
  T(w.p75([1, 2, 3, 4]) === 3 && w.p75([10]) === 10 && w.p75([]) === null, 'وp75 على أمثلةٍ معلومة: [1,2,3,4]→3، [10]→10، []→null');
  w.goPage('sites'); w.render(1); await wait(80); w.goPage('sites'); w.render(1); await wait(80);
  const s2 = w.perfSummary();
  T(s2.pages.sites && s2.pages.sites.n >= 2 && s2.pages.sites.p75 >= 0, 'وزمنُ الرسم يُسجَّل لكلِّ صفحة: sites ×' + s2.pages.sites.n);
  w.vitMapReady(); T(typeof s2.open === 'number' || typeof w.perfSummary().open === 'number', 'وأوّلُ خريطةٍ بعد الفتح علامةٌ رقمية');
  w.STATE.meta.uid = 'u1'; w.presenceBeat(true);
  const pf = w.STATE.presence.u1.pf;
  T(pf && pf.inp.p75 === 400 && pf.pages.sites && !JSON.stringify(pf).includes('مدير'), 'والنبضةُ تحمل الملخّصَ بلا اسمٍ ولا نصّ');
  /* البطاقة */
  const today = new Date().toISOString().slice(0, 10);
  w.STATE.presence = {
    a:{ day:today, ua:'Mozilla/5.0 (Linux; Android 13; SM-A515F Build/TP1A) Chrome', ver:'V17.98', pf:{ open:2100, lcp:{ n:3, p75:2200, max:3000 }, inp:{ n:5, p75:180, max:400 }, cls:0.04, lt:2, pages:{ map:{ n:3, p75:120, max:200 } } } },
    b:{ day:today, ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', ver:'V17.98', pf:{ open:900, lcp:{ n:2, p75:3100, max:3500 }, inp:{ n:4, p75:650, max:900 }, cls:0.3, lt:9, pages:{ map:{ n:2, p75:480, max:700 }, sites:{ n:1, p75:60, max:60 } } } },
    c:{ day:today, ua:'x', ver:'V17.98', pf:{ open:null, lcp:null, inp:null, cls:null, lt:null, pages:{} } }
  };
  const card = w.perfCard();
  T(/SM-A515F/.test(card) && /iPhone/.test(card) && card.indexOf('iPhone') < card.indexOf('SM-A515F'), 'البطاقةُ تسمّي الطرازَ من وكيل المستخدم وترتّب الأبطأَ أوّلًا (iPhone INP ٦٥٠)');
  T(/INP p75/.test(card) && /wrn|bad/.test(card), 'وتصنّف على عتبات جوجل: INP p75 خارج الأخضر');
  const pi = card.indexOf('أبطأُ الصفحات');
  T(pi > -1 && card.indexOf('>٤٨٠<', pi) > -1, 'وأبطأُ الصفحات: الخريطة ٤٨٠' + (pi > -1 ? ' — ' + card.slice(pi, pi + 260).replace(/<[^>]+>/g, '|').slice(0, 120) : ' — لا جدول'));
  dom.window.close();
}

console.log('\n══ ٣ · بلا واجهة: null بصمت ══');
{
  const { w, dom } = await boot(false);
  const s = w.perfSummary();
  T(s.lcp === null && s.inp === null && s.cls === null && s.lt === null && !w.VIT.err, 'المتصفّحُ بلا PerformanceObserver: القيمُ null ولا خطأ');
  dom.window.close();
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ مؤشّرات الأداء نظيف \u2705'); process.exit(0);
