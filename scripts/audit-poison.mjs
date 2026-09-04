/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الوثيقة المسمومة — node scripts/audit-poison.mjs
   ───────────────────────────────────────────────────────────────────────────
   الدفعةُ تُرفَع كلُّها أو لا شيء — فوثيقةٌ واحدةٌ فيها قيمةٌ غيرُ مقبولةٍ أو
   ترفضها القاعدةُ كانت تُسقِط الدفعةَ كلَّها وتعود في الدورة التالية
   فتسقطها ثانيةً إلى الأبد: «تعذّر الرفع» كلَّ دقيقةٍ ولا يصل شيءٌ ولا يُعرَف
   أيُّ وثيقةٍ السبب. صار الرفعُ إن فشل جملةً يُعاد وثيقةً وثيقة: ما نجح
   يخرج، وما فشل ثلاثًا يُعزَل في ركنٍ يُرى بسببه ويُعاد أو يُسقَط باليد؛
   وundefined يُصفّى قبل الإرسال؛ والرفعُ واحدٌ في كلِّ لحظةٍ بقفلٍ يُفَكُّ
   بعد نصف دقيقة؛ والانقطاعُ يبقى انقطاعًا لا يُعزَل بسببه شيء.
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
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
/* قاعدةٌ صورية: ترفض وثيقةً بعينها وتقبل الباقي */
const written=[]; const deleted=[];
w.FB.ready=true; w.FB.init=()=>Promise.resolve(true);
const mkRef=(col,id)=>({ set:(v)=>{ if(id==='BAD') return Promise.reject(new Error('Unsupported field value: undefined (found in field x)')); if(id==='DENY') return Promise.reject(new Error('Missing or insufficient permissions.')); written.push(col+'/'+id); return Promise.resolve(); },
                         delete:()=>{ deleted.push(col+'/'+id); return Promise.resolve(); } });
w.FB.db={ collection:(c)=>({ doc:(id)=>mkRef(c,id) }), batch:()=>{ const ops=[]; return { set:(ref,v)=>ops.push(()=>ref.set(v)), delete:(ref)=>ops.push(()=>ref.delete()), commit:()=>Promise.all(ops.map(f=>f())) }; } };
w.STATE.meta.online=true; w.CORE._busy=false; w.CORE._busyAt=0;
/* ١ · التصفية */
const c=w.FB.clean({a:1,b:undefined,c:{d:undefined,e:'x'},f:[1,undefined,{g:undefined}],h:NaN});
T(JSON.stringify(c)==='{"a":1,"c":{"e":"x"},"f":[1,null,{}],"h":null}', 'undefined يُصفّى قبل الإرسال — '+JSON.stringify(c));
/* ٢+٣ · دفعةٌ فيها وثيقةٌ مرفوضةٌ لا توقف الباقي — وبعد ثلاث محاولاتٍ تُعزَل */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
w.STATE.queue=[]; w.CORE.dirty('recs','OK1',{a:1}); w.CORE.dirty('recs','BAD',{a:1}); w.CORE.dirty('tasks','OK2',{b:2}); w.CORE.dirty('tasks','GONE',null);
for (let i=0;i<6;i++){ w.CORE._busy=false; await w.CORE.flush(); await wait(120); }
T(written.includes('recs/OK1') && written.includes('tasks/OK2') && deleted.includes('tasks/GONE'), 'نجح ثلاثةٌ رغم واحدةٍ مرفوضة');
T(!w.STATE.queue.some(q=>q.id==='OK1'||q.id==='OK2'||q.id==='GONE'), 'وخرجت الناجحةُ من الطابور');
T(w.SOFT_ERRS.some(e=>/رفع وثيقة — recs\/BAD/.test(e.where) && /undefined/.test(e.msg)), 'والسببُ مكتوبٌ باسم الوثيقة');
T(!w.STATE.queue.some(q=>q.id==='BAD') && (w.STATE.poison||[]).filter(p=>p.id==='BAD').length===1, 'وبعد الثالثة تُعزَل خارج الطابور — مرةً واحدة');
/* ٤ · الشاشةُ تعرضها وتتيح الإعادة والإسقاط */
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.goPage('sync'); w.render(1);
const h=d.getElementById('content');
T((h.textContent||'').indexOf('وثائقُ عُزلت عن الرفع')>-1 && !!h.querySelector('[data-pzretry="0"]'), 'المعزولُ يُعرَض بسببه وزرَّي الإعادة والإسقاط');
h.querySelector('[data-pzdrop="0"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
T((w.STATE.poison||[]).length===0, 'الإسقاطُ يمسحها');
/* ٥ · الانقطاعُ يبقى انقطاعًا — لا يُعزَل شيءٌ بسببه */
w.FB.init=()=>Promise.resolve(false); w.CORE._busy=false; w.CORE.dirty('recs','X1',{a:1});
await w.CORE.flush(); await wait(300);
T(w.STATE.queue.some(q=>q.id==='X1' && !q.tries), 'بلا شبكة: يبقى الطابورُ كما هو بلا عدِّ محاولات');
console.log(bad?'\nجردُ الوثيقة المسمومة فشل ✗ ('+bad+')':'\nالوثيقةُ المسمومةُ لا توقف الطابور ✅');
process.exit(bad?1:0);
