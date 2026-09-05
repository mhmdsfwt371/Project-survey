/* ═══════════════════════════════════════════════════════════════════════════
   جردُ وثيقة الحساب — node scripts/audit-mydoc.mjs
   ───────────────────────────────────────────────────────────────────────────
   القاعدةُ تعرف الحسابَ من وثيقةٍ باسم معرِّفه. ومن لا وثيقةَ له كان يُرفَض
   كلُّ ما يكتب بـ«Missing or insufficient permissions»، ويظهر دورُه صحيحًا
   في التطبيق لأنه محفوظٌ في جلسته — فيرى شاشاتِ المهندس ولا يصل عملُه، ولا
   شيءَ يقول لماذا. صار الغيابُ يُكشَف صراحةً في بطاقة الهوية، ويُنشئ صاحبُه
   وثيقتَه **فنيًّا ونشطًا** (والقاعدةُ لا تسمح بأكثر: لا يرقّي نفسَه) فيخرج
   من الحصار ويُرفَع عملُه، ثم يرقّيه المكتبُ إلى دوره الحقيقي. والدورُ في
   التطبيق ينزل معه — فلا يدّعي ما لا تعطيه القاعدة.
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
/* قاعدةٌ صورية: users فارغةٌ في البدء */
const store={};
w.FB.ready=true; w.FB.init=()=>Promise.resolve(true);
w.FB.db={ collection:(c)=>({ doc:(id)=>({
  get:()=>Promise.resolve({ exists:!!store[c+'/'+id], data:()=>store[c+'/'+id] }),
  set:(v)=>{ store[c+'/'+id]=v; return Promise.resolve(); } }) }) };
w.STATE.meta.uid='UID9'; w.STATE.meta.name='مهندس'; w.STATE.meta.online=true;
w.ROLE='admin'; w.STATE.meta.role='admin';
/* ١ · الغيابُ يُكشَف */
await w.myDocFetch(true);
T(w.MYDOC.has===false, 'غيابُ الوثيقة يُكشَف لا يُخمَّن');
w.goPage('sync'); w.render(1);
let h=d.getElementById('content');
T((h.textContent||'').indexOf('غيرُ موجودة — هذا سببُ الرفض')>-1, 'والبطاقةُ تقولها صراحةً');
T(!!h.querySelector('[data-mydocfix]'), 'وزرُّ الإنشاء ظاهر');
/* ٢ · الإنشاءُ فنيًّا */
h.querySelector('[data-mydocfix]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await wait(200);
T(!!store['users/UID9'] && store['users/UID9'].role==='tech' && store['users/UID9'].active===true,
  'الإنشاءُ يكتب فنيًّا ونشطًا — '+JSON.stringify(store['users/UID9']||{}).slice(0,70));
T(w.ROLE==='tech' && w.MYDOC.has===true, 'والدورُ في التطبيق يصير فنيًّا — لا يدّعي ما لا تعطيه القاعدة');
/* ٣ · الوجودُ يُقرأ ويُوضَع في مكانه */
store['users/UID9']={ name:'مهندس', role:'admin', active:true };
await w.myDocFetch(true);
T(w.STATE.users['UID9'] && w.STATE.users['UID9'].role==='admin', 'الوثيقةُ الموجودةُ تُسحَب إلى مكانها');
w.render(1); h=d.getElementById('content');
const txt=(h.textContent||'');
T(txt.indexOf('غيرُ موجودة')<0 && txt.indexOf('أنشئ وثيقة حسابي')<0, 'والبطاقةُ لم تعد تقول غيرَ موجودة ولا تعرض زرَّ الإنشاء');
/* ٤ · بلا دخولٍ لا يُنشَأ شيء */
w.STATE.meta.uid=''; await w.myDocFix(); await wait(100);
T(Object.keys(store).length===1, 'بلا معرِّفٍ لا تُكتَب وثيقة');
console.log(bad?'\nجردُ وثيقة الحساب فشل ✗ ('+bad+')':'\nوثيقةُ الحساب تُقرأ وتُصلَح — لا حصارَ صامت ✅');
process.exit(bad?1:0);
