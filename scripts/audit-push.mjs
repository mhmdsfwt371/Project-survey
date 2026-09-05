/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدفع اليدوي — node scripts/audit-push.mjs
   ───────────────────────────────────────────────────────────────────────────
   زرٌّ يُضغَط ولا يقع شيءٌ أسوأُ من زرٍّ لا يوجد. «أعد قراءة وثيقتي» كان
   يقول «لا شبكة» والشبكةُ متصلة — لأن الوصلةَ تُحمَّل كسولًا ولم تُهيَّأ بعد؛
   صار يُهيِّئها ثم يقرأ ويُطلِق ما حُبس ويدفع الطابورَ **ويقول النتيجةَ
   بعددها**. وأُضيف «↑ ادفع الطابور الآن» لأن الدورةَ تدفع كلَّ دقيقةٍ ومن
   رأى «بانتظار الرفع ١» ينتظر ولا يدري متى — يدفع فورًا ويقول كم رُفع وكم
   بقي وأين سببُ الباقي. والرقمُ المعلَنُ صادق: دفعتان متزامنتان كانتا
   تجعلان الأولى تقول «رُفع ٠» ثم يُرفَع بعد لحظة.
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
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const store={};
const mkdb=()=>({ collection:c=>({ doc:id=>({
  get:()=>Promise.resolve({exists:!!store[c+'/'+id],data:()=>store[c+'/'+id]}),
  set:v=>{ store[c+'/'+id]=v; return Promise.resolve(); },
  delete:()=>{ delete store[c+'/'+id]; return Promise.resolve(); } }) }),
  batch:()=>{ const o=[]; return { set:(r,v)=>o.push(()=>r.set(v)), delete:r=>o.push(()=>r.delete()), commit:()=>Promise.all(o.map(f=>f())) }; } });
/* الحالةُ كما في الصورة: وصلةٌ لم تُهيَّأ بعد، شبكةٌ متصلة، وثيقةٌ موجودة، طابورٌ فيه واحد */
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.uid='UX'; w.STATE.meta.name='mohamed safwat'; w.STATE.meta.online=true;
store['users/UX']={name:'mohamed safwat',role:'admin',active:true};
w.MYDOC={at:Date.now(),has:true,err:''}; w.STATE.users={UX:store['users/UX']};
w.FB.ready=false; w.FB.db=null;
w.FB.init=()=>{ w.FB.ready=true; w.FB.db=mkdb(); return Promise.resolve(true); };
w.STATE.queue=[]; w.CORE._busy=false; w.CORE.dirty('stats','2026-09-05',{n:1});
const toasts=[]; const old=w.toast; w.toast=m=>{ toasts.push(String(m)); return old&&old(m); };
w.goPage('sync'); w.render(1);
/* ١ · زرُّ الدفع اليدويّ ظاهرٌ ما دام الطابورُ غيرَ فارغ */
T(!!d.querySelector('#content [data-pushnow]'), 'زرُّ «ادفع الطابور الآن» ظاهرٌ مع طابورٍ غيرِ فارغ');
/* ٢ · «أعد قراءة وثيقتي» يُهيِّئ الوصلةَ ولا يقول «لا شبكة» */
toasts.length=0;
d.querySelector('#content [data-mydocfix]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await wait(500);
T(!toasts.some(x=>/لا شبكة/.test(x)), 'لا يقول «لا شبكة» والشبكةُ متصلة', toasts.join(' | '));
T(toasts.some(x=>/الوثيقةُ موجودةٌ/.test(x) && /رُفع ١/.test(x)), 'ويقول النتيجةَ بعددها الصادق', toasts.join(' | '));
T(!!store['stats/2026-09-05'] && w.STATE.queue.length===0, 'ويدفع الطابورَ فعلًا فيفرغ');
/* ٣ · زرُّ الدفع اليدويّ يعمل ويقول ما بقي */
w.CORE.dirty('recs','R1',{a:1}); w.CORE.dirty('recs','R2',{b:2}); w.CORE._busy=false;
w.render(1); toasts.length=0;
d.querySelector('#content [data-pushnow]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await wait(600);
T(w.STATE.queue.length===0 && !!store['recs/R1'] && !!store['recs/R2'], 'الدفعُ اليدويُّ يُفرِغ الطابور');
T(toasts.some(x=>/رُفع/.test(x) && /بقي/.test(x)), 'ويقول كم رُفع وكم بقي', toasts.slice(-1)[0]);
/* ٤ · بلا شبكةٍ يُقال بلا شبكة */
w.STATE.meta.online=false; w.FB.ready=false; w.FB.db=null; w.CORE.dirty('recs','R3',{c:3});
w.render(1); toasts.length=0;
const pb=d.querySelector('#content [data-pushnow]'); if (pb) pb.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await wait(300);
T(toasts.some(x=>/لا شبكة/.test(x)), 'وبلا شبكةٍ يقولها');
/* ٥ · طابورٌ فارغ: لا زرَّ ولا صمت */
w.STATE.meta.online=true; w.STATE.queue=[]; w.render(1);
T(!d.querySelector('#content [data-pushnow]'), 'وطابورٌ فارغٌ لا يعرض الزرَّ أصلًا');
console.log(bad?'\nجردُ الدفع اليدوي فشل ✗ ('+bad+')':'\nالزرُّ يُنهي العملَ ويقول نتيجتَه ✅');
process.exit(bad?1:0);
