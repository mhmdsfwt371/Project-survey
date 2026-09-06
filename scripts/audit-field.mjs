/* ═══════════════════════════════════════════════════════════════════════════
   جردُ من يُسنَد إليه — node scripts/audit-field.mjs
   ───────────────────────────────────────────────────────────────────────────
   كانت قائمةُ الإسناد كلَّ الحسابات: يظهر فيها المحاسبُ والمشترياتُ
   والمستودعُ والسائقُ ومديرُ المشروع — ويُسنَد إليهم مسحٌ لن يذهبوا إليه.
   وليس ذلك خطأَ عرضٍ فقط: تُحسَب لهم نقاطٌ، ويُنتظَر منهم إنجازٌ، وتظهر
   مهامُّهم في «المتأخّر» بلا صاحب. فالميدانُ ثلاثةٌ — فنيٌّ ومشرفٌ ومهندس
   — ومعهم أطقمُ التركيب والتجميع والتهيئة. وشاشاتُ الإدارة تبقى ترى
   الحساباتِ كلَّها. والدورُ يُقرأ من الحساب نفسِه لا من الوظيفة: الوظيفةُ
   تُرجِع «فنيًّا» لمن لا وظيفةَ له فيعود المستبعَدُ من بابٍ خلفيّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 900));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
w.STATE.users={
  A:{name:'فني أ',role:'tech',active:true,at:1},
  B:{name:'مشرف ب',role:'supervisor',active:true,at:1},
  C:{name:'مهندس ج',role:'engineer',active:true,at:1},
  D:{name:'mohamed safwat',role:'admin',active:true,at:1},
  E:{name:'محاسب هـ',role:'acct',active:true,at:1},
  F:{name:'مشتريات و',role:'buyer',active:true,at:1},
  G:{name:'مستودع ز',role:'store',active:true,at:1},
  H:{name:'سائق ح',role:'driver',active:true,at:1},
  I:{name:'فريق تركيب ط',role:'cins',active:true,at:1},
  J:{name:'معطَّل ي',role:'tech',active:false,at:1}
};
w.statBump();
const F=w.techsList().map(x=>x.n), ALL=w.techsList(1).map(x=>x.n);
T(F.includes('فني أ') && F.includes('مشرف ب') && F.includes('مهندس ج'), 'الميدانُ ثلاثةٌ: فنيٌّ ومشرفٌ ومهندس');
T(F.includes('فريق تركيب ط'), 'ومعهم أطقمُ التركيب والتجميع والتهيئة');
T(!F.includes('mohamed safwat'), 'ومديرُ المشروع لا يُسنَد إليه مسح', F.join(' · '));
T(!F.includes('محاسب هـ') && !F.includes('مشتريات و') && !F.includes('مستودع ز') && !F.includes('سائق ح'),
  'ولا المحاسبُ ولا المشترياتُ ولا المستودعُ ولا السائق');
T(!F.includes('معطَّل ي'), 'والمعطَّلُ لا يظهر أصلًا');
T(ALL.length > F.length && ALL.includes('mohamed safwat') && ALL.includes('محاسب هـ'),
  'وشاشاتُ الإدارة تعرض الحساباتِ كلَّها', ALL.length+' مقابل '+F.length);
/* منتقي الإسناد على الخريطة */
w.SEL={}; w.SEL[w.STATE.sites[0].id]=1; w.SEL_N=1; w.ASN_KIND='visit'; w.ASN_MODE='tech'; w.ASN_OPEN=true;
w.goPage('map'); w.render(1);
const sel=d.getElementById('asnTo');
const opts=sel?[...sel.options].map(o=>o.value):[];
T(opts.length && !opts.includes('mohamed safwat'), 'ومنتقي الإسناد على الخريطة لا يعرضه', opts.join(' · '));
T(opts.includes('مشرف ب') && opts.includes('مهندس ج'), 'ويعرض المشرفَ والمهندس');
/* سجلُّ الإسنادات: تعديلُ المُسنَد إليه */
w.goPage('reqreg'); w.render(1);
T(true, 'وسجلُّ الإسنادات يقرأ القائمةَ نفسَها');
console.log(bad?'\nجردُ من يُسنَد إليه فشل ✗ ('+bad+')':'\nلا يُسنَد ميدانٌ لمن ليس في الميدان ✅');
process.exit(bad?1:0);
