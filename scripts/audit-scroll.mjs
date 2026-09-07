/* ═══════════════════════════════════════════════════════════════════════════
   جردُ حفظ الموضع — node scripts/audit-scroll.mjs
   ───────────────────────────────────────────────────────────────────────────
   كلُّ زرٍّ يُعيد الرسمَ، وإعادةُ الرسم كانت تقذف القارئَ إلى رأس الصفحة: من
   نزل في مئةٍ وعشرين نقطةً وضغط مربّعَ اختيارٍ عاد إلى أوّلها، ومن فتح لوحًا
   وضغط فيه زرًّا وجد اللوحَ من أعلاه. فيصير كلُّ عملٍ متعدّدِ الخطوات
   عذابًا — **ولا يُكتشَف في اختبارٍ آليٍّ لأن الشاشةَ تعمل**. صار الموضعُ
   يُلتقَط قبل الرسم — للنافذة ولكلِّ لوحٍ مفتوح — ويُعاد بعده؛ والصعودُ إلى
   الرأس يبقى حيث يجب: عند تبديل الشاشة أو الشريحة وحدَه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
/* نافذةٌ صوريةٌ تتذكّر موضعَها كما يفعل المتصفّح */
let Y=0; w.scrollTo=(x,y)=>{ Y=y||0; };
Object.defineProperty(w,'pageYOffset',{ get:()=>Y, configurable:true });
await new Promise(r => setTimeout(r, 900));
/* الدخولُ في الجرد كما يدخل مهندسٌ حقيقيٌّ: كان يُضغَط «دخول» بحقلين فارغين
   فيُفتَح الهيكلُ — وذلك الثغرةُ التي سُدَّت (V15.94)، فصار الجردُ يُثبِت هويةً. */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='engineer'; w.STATE.meta.role='engineer';
/* ١ · إعادةُ الرسم في المكان تُبقي الموضع */
w.goPage('sites'); w.render(1); Y=1200;
w.render(1);
T(Y===1200, 'إعادةُ الرسم في الشاشة نفسِها تُبقي الموضع', 'Y='+Y);
/* ٢ · تبديلُ الشاشة يصعد للرأس */
w.goPage('over'); w.render(1);
T(Y===0, 'وتبديلُ الشاشة يصعد للرأس', 'Y='+Y);
/* ٣ · تبديلُ الشريحة يصعد كذلك */
Y=800; w.goPage('now'); w.render(1);
T(Y===0, 'وتبديلُ الشريحة كذلك');
/* ٤ · اللوحُ الداخليُّ يُبقي موضعَه */
w.goPage('map'); w.SEL={}; w.SEL_N=0; w.ASN_OPEN=true; w.render(1);
const body=d.querySelector('#mapUI .pop-body') || d.querySelector('#content .pop-body');
T(!!body, 'لوحُ الإسناد مرسوم');
if (body){
  Object.defineProperty(body,'scrollTop',{ value:0, writable:true, configurable:true });
  body.scrollTop=640;
  w.render(1);
  const b2=d.querySelector('#mapUI .pop-body') || d.querySelector('#content .pop-body');
  T(b2 && b2.scrollTop===640, 'وموضعُ اللوح يعود بعد الرسم', b2?('scrollTop='+b2.scrollTop):'—');
}
/* ٥ · الالتقاطُ لا يكسر شيئًا حين لا شيءَ مفتوح */
w.goPage('over'); Y=0; w.render(1);
T(Y===0, 'ولا يُخلَّف أثرٌ حين لا موضعَ يُحفَظ');
console.log(bad?'\nجردُ حفظ الموضع فشل ✗ ('+bad+')':'\nالموضعُ لا يضيع مع كلِّ ضغطة ✅');
process.exit(bad?1:0);
