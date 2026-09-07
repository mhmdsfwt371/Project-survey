/* ═══════════════════════════════════════════════════════════════════════════
   جردُ شاهد القبر — node scripts/audit-tomb.mjs
   ───────────────────────────────────────────────────────────────────────────
   مُسح خمسةَ عشرَ إسنادًا من المكتب وبقيت على هاتفَي المهندس والفنيّ. سببان:
   المحوُ لا يصل بالسحب الفارقيِّ (الممحوُّ لم يُكتَب بعد آخر مزامنة)، وإنصاتُ
   الفنيِّ كان يقارن حقلَ اسمٍ بمعرِّفٍ فلم يُطابَق شيءٌ قطّ. صار الحذفُ شاهدَ
   قبرٍ يصل كأيِّ تحديث، وكلُّ جهازٍ يمحو ما عليه شاهد، والإنصاتُ بالاسم.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
async function device(name, role){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 900));
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name });
  w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
  { const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'x'; if (pE) pE.value = 'TestPass1234'; }
  const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await new Promise(r => setTimeout(r, 400));
  w.ROLE=role; w.STATE.meta.role=role; w.STATE.meta.name=name; w.STATE.queue=[];
  return { w, d };
}
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
/* ١ · المكتبُ يمسح إسنادًا: شاهدٌ لا محو */
const A = await device('مدير','admin');
const sid = A.w.STATE.sites[0].id, tid='TK-visit-'+sid;
A.w.STATE.tasks[tid]={ id:tid, no:'SR-1', site:sid, kind:'visit', to:'سيد', assignedTo:'سيد', status:'مطلوب', at:1 };
A.w.CORE.rm('tasks', tid);
const q=A.w.STATE.queue.filter(x=>x.kind==='tasks'&&x.id===tid)[0];
T(q && q.v && q.v.deleted===true, 'الحذفُ يكتب شاهدَ قبرٍ لا محوًا', JSON.stringify(q&&q.v).slice(0,60));
T(!A.w.STATE.tasks[tid], 'ويمحو محليًّا فورًا');
/* ٢ · جهازُ الفنيِّ يستقبل الشاهدَ بالسحب الفارقيِّ فيمحو */
const B = await device('سيد','tech');
B.w.STATE.tasks[tid]={ id:tid, no:'SR-1', site:sid, kind:'visit', to:'سيد', assignedTo:'سيد', status:'مطلوب', at:1 };
B.w.CORE.applyDoc('tasks', tid, q.v);
T(!B.w.STATE.tasks[tid], 'الفنيُّ يستقبل الشاهدَ فيمحو المهمة');
/* ٣ · وبالإنصات الحيّ */
B.w.STATE.tasks[tid]={ id:tid, to:'سيد', assignedTo:'سيد', status:'مطلوب' };
T(/where\('assignedTo', '==', me\)/.test(html) && /var me = STATE\.meta\.name/.test(html), 'إنصاتُ الفنيِّ بالاسم لا بالمعرِّف');
/* ٤ · الحفظُ المحليُّ لا يُعيد الميّت */
B.w.STATE.tasks['TK-dead']={ id:'TK-dead', deleted:true };
await B.w.CORE.saveLocal(); const st = await B.w.idbGet('state');
B.w.STATE.tasks={}; await B.w.CORE.loadLocal();
T(!B.w.STATE.tasks['TK-dead'], 'وما عليه شاهدٌ في الحفظ المحليِّ لا يعود عند التحميل');
/* ٥ · الحساباتُ تُمحى محوًا (لها قاعدةٌ وطلبُ خادم) */
A.w.STATE.users['UX']={ name:'س', role:'tech' }; A.w.CORE.rm('users','UX');
const qu=A.w.STATE.queue.filter(x=>x.kind==='users'&&x.id==='UX')[0];
T(qu && qu.v===null, 'والحساباتُ تُمحى محوًا لا شاهدًا');
console.log(bad?'\nجردُ شاهد القبر فشل ✗ ('+bad+')':'\nما يُمسح في جهازٍ يُمحى في الباقي ✅');
process.exit(bad?1:0);
