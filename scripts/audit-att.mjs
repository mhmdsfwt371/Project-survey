/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الحضور — node scripts/audit-att.mjs
   ───────────────────────────────────────────────────────────────────────────
   النظامُ كان يعرف ما أُنجز ولا يعرف من كان موجودًا. صار الفنيُّ يضغط
   بنفسه «بدأتُ يومي» عند الوصول و«أنهيتُ يومي» عند المغادرة، ويُلتقَط
   موقعُه: داخلَ المشاعر أم خارجها — والخارجُ يُسجَّل ويُعلَّم لا يُرفَض.
   والمشرفُ يرى صباحًا من بدأ ومن لم يبدأ ومن أنهى وكم ساعة. وثيقةٌ لكلِّ
   شخصٍ في كلِّ يوم يكتبها صاحبُها وحدَه.
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
/* الدخولُ في الجرد كما يدخل مهندسٌ حقيقيٌّ: كان يُضغَط «دخول» بحقلين فارغين
   فيُفتَح الهيكلُ — وذلك الثغرةُ التي سُدَّت (V15.94)، فصار الجردُ يُثبِت هويةً. */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* موقعٌ صوريّ */
let POS={lat:21.41,lng:39.87};
w.navigator.geolocation={ getCurrentPosition:(ok)=>ok({coords:{latitude:POS.lat,longitude:POS.lng,accuracy:12}}) };
w.ROLE='tech'; w.STATE.meta.role='tech'; w.STATE.meta.name='فني أ'; w.STATE.meta.uid='UT1'; w.STATE.att={};
w.STATE.users={ UT1:{name:'فني أ',role:'tech',active:true}, US1:{name:'مشرف',role:'supervisor',active:true}, UT2:{name:'فني ب',role:'tech',active:true} };
w.statBump();
/* ١ · البطاقةُ للفنيّ */
w.goPage('mywork'); w.render(1);
T(!!d.querySelector('#content [data-attin]'), 'زرُّ «بدأتُ يومي» للفنيِّ في مهامي');
/* ٢ · البدء */
await w.attMark('in'); await wait(50);
const r=w.attToday();
T(r && r.in && r.in.ok===true, 'يُسجَّل البدءُ بالموقع — داخل المشاعر', r&&JSON.stringify(r.in).slice(0,60));
T(w.STATE.queue.some(q=>q.kind==='att'), 'ويُرفَع');
w.render(1);
T(!!d.querySelector('#content [data-attout]') && !d.querySelector('#content [data-attin]'), 'والزرُّ يصير «أنهيتُ يومي»');
/* ٣ · لا يُكرَّر */
const toasts=[]; const old=w.toast; w.toast=m=>{ toasts.push(String(m)); return old&&old(m); };
await w.attMark('in'); await wait(30);
T(toasts.some(m=>/بالفعل/.test(m)), 'ولا يبدأ مرتين');
/* ٤ · الإنهاء والساعات */
r.in.at = Date.now() - 3*3600000;
await w.attMark('out'); await wait(50);
T(w.attToday().out && w.attToday().hours>=2.9, 'الإنهاءُ يحسب الساعات', String(w.attToday().hours));
/* ٥ · خارجُ النطاق يُسجَّل ويُعلَّم */
w.STATE.meta.uid='UT2'; w.STATE.meta.name='فني ب'; POS={lat:24.7,lng:46.7}; toasts.length=0;
await w.attMark('in'); await wait(50);
const r2=w.attToday();
T(r2 && r2.in && r2.in.ok===false, 'خارجُ النطاق يُسجَّل ويُعلَّم لا يُرفَض');
T(toasts.some(m=>/خارج نطاق/.test(m)), 'ويُقال لصاحبه');
/* ٦ · بطاقةُ المشرف */
w.ROLE='supervisor'; w.STATE.meta.role='supervisor'; w.STATE.meta.name='مشرف'; w.STATE.meta.uid='US1';
w.goPage('now'); w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('الحضورُ اليوم')>-1, 'بطاقةُ الحضور للمشرف في «الآن»');
T(h.indexOf('فني أ')>-1 && h.indexOf('أنهى')>-1, 'تعرض من أنهى');
T(h.indexOf('خارج النطاق')>-1, 'ومن هو خارج النطاق');
/* ٧ · غيرُ الميدان لا يسجّل */
w.ROLE='acct'; w.STATE.meta.role='acct'; w.STATE.meta.uid='UA'; w.STATE.meta.name='محاسب';
const n0=Object.keys(w.STATE.att).length; await w.attMark('in'); await wait(30);
T(Object.keys(w.STATE.att).length===n0, 'المحاسبُ لا يسجّل حضورًا');
w.goPage('mywork'); w.render(1);
T(!d.querySelector('#content [data-attin]'), 'ولا يرى الزر');
console.log(bad?'\nجردُ الحضور فشل ✗ ('+bad+')':'\nمن بدأ ومن لم يبدأ — يُعرَف صباحًا ✅');
process.exit(bad?1:0);
