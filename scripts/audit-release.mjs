/* ═══════════════════════════════════════════════════════════════════════════
   جردُ إطلاق المعزول — node scripts/audit-release.mjs
   ───────────────────────────────────────────────────────────────────────────
   الوثائقُ التي عُزلت لأن القاعدةَ رفضتها كانت تبقى معزولةً بعد زوال السبب:
   يُصلَح الحسابُ فلا يعود شيءٌ إلى الطابور، وينتظر صاحبُه أن يضغط ↻ على كلِّ
   واحدةٍ ولا يدري أن عليه ذلك. صار إصلاحُ الوثيقة يُعيد ما عُزل **برفضِ
   صلاحيةٍ وحدَه** (وما عُزل لقيمةٍ غيرِ مقبولةٍ يبقى — سببُه لم يزل) ويدفع
   الطابورَ فورًا. ويُصفَّر تكتّمُ الرسائل عند الإصلاح وعند نجاحِ أيِّ دفعة —
   كان يُقال مرةً في العمر فلا يُقال الفشلُ التالي. وبلا شبكةٍ تُقال الحالُ
   ولا تبقى «تُقرأ…» إلى الأبد.
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
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const store={}; w.FB.ready=true; w.FB.init=()=>Promise.resolve(true);
w.FB.db={ collection:c=>({ doc:id=>({
  get:()=>Promise.resolve({exists:!!store[c+'/'+id],data:()=>store[c+'/'+id]}),
  set:v=>{ store[c+'/'+id]=v; return Promise.resolve(); },
  delete:()=>{ delete store[c+'/'+id]; return Promise.resolve(); } }) }),
  batch:()=>{ const o=[]; return { set:(r,v)=>o.push(()=>r.set(v)), delete:r=>o.push(()=>r.delete()), commit:()=>Promise.all(o.map(f=>f())) }; } };
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.uid='UIDX'; w.STATE.meta.name='مهندس'; w.STATE.meta.online=true;
/* الحالةُ الحيّة: وثيقةٌ غائبة، معزولان برفضِ صلاحية، ومعزولٌ ثالثٌ لسببٍ آخر */
w.STATE.queue=[]; w.CORE._busy=false;
w.STATE.poison=[
 {kind:'stats',id:'2026-09-03',v:{a:1},err:'Missing or insufficient permissions.',at:Date.now()},
 {kind:'evlog',id:'E1',v:{what:'x'},err:'Missing or insufficient permissions.',at:Date.now()},
 {kind:'recs',id:'R9',v:{b:2},err:'Unsupported field value: undefined',at:Date.now()}];
w.SOFT_SAID['رفع الطابور']=1;
await w.myDocFix(); await wait(500);
T(!!store['users/UIDX'], 'أُنشئت وثيقةُ الحساب');
T((w.STATE.poison||[]).length===1 && w.STATE.poison[0].id==='R9',
  'المعزولُ برفضِ صلاحيةٍ عاد للرفع — وما عُزل لسببٍ آخر بقي ('+(w.STATE.poison||[]).length+')');
T(Object.keys(w.SOFT_SAID).length===0, 'وتكتّمُ الرسائل صُفِّر — فالفشلُ التالي يُقال');
T(!!store['stats/2026-09-03'] && !!store['events/E1'], 'ودُفعا إلى القاعدة فورًا بلا انتظار دورة');
T(w.STATE.queue.length===0, 'والطابورُ فرغ');
/* نجاحُ دفعةٍ يُصفِّر التكتّم */
w.SOFT_SAID['رفع الطابور']=1; w.CORE._busy=false;
w.CORE.dirty('recs','R10',{c:3}); await w.CORE.flush(); await wait(200);
T(Object.keys(w.SOFT_SAID).length===0, 'ونجاحُ أيِّ دفعةٍ يُصفِّره كذلك');
/* بلا شبكة: الحالةُ تُقال ولا تبقى «تُقرأ…» */
w.MYDOC={at:0,has:null,err:''}; w.FB.ready=false; w.FB.db=null; w.STATE.meta.online=false;
await w.myDocFetch(true); await wait(100);
T(w.MYDOC.err==='offline', 'بلا شبكة: تُقال الحالُ لا تبقى «تُقرأ…»');
w.ROLE='admin'; w.STATE.meta.role='admin'; w.goPage('sync'); w.render(1);
const cc=(d.getElementById('content').textContent||'');
T(cc.indexOf('بلا شبكة')>-1 || cc.indexOf('موجودة')>-1, 'والبطاقةُ تقولها أو تقول موجودة (سُحبت قبلًا)');
console.log(bad?'\nجردُ إطلاق المعزول فشل ✗ ('+bad+')':'\nإصلاحُ السبب يُطلِق ما حُبس به ✅');
process.exit(bad?1:0);
