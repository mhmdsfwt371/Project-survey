/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الرتبة والوظيفة — node scripts/audit-rank.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان دورُ الوظيفة يغلب دورَ الحساب دائمًا: فمن دورُه «الإدارة العليا»
   ووظيفتُه «مدير المشروع» تُقرأ رتبتُه رتبةَ مديرِ المشروع — فلا يصلح
   مديرًا لمديرِ المشروع، ويُقال «لا حسابَ أعلى رتبةً بعد» وهو موجود.
   والوظيفةُ وصفُ عملٍ لا سقفُ صلاحية: من رُفع دورُه صراحةً لا تخفضه وظيفتُه
   القديمة، ووظيفةٌ أعلى ترفع من دورُ حسابه أدنى. فتُقرأ الرتبةُ أعلى
   الاثنين. ويُحرَس معها أن لا اسمَ وظيفةٍ عربيٌّ يظهر في واجهةٍ إنجليزية.
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
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.name='مدير';
/* الحالةُ كما في الصورة: الشعراوي دورُه «الإدارة العليا» ووظيفتُه «مدير المشروع» */
w.STATE.users={
  X:{name:'m.shaarawi', role:'exec',  job:'j_admin', active:true, at:1},
  Y:{name:'mohamed safwat', role:'admin', job:'j_admin', active:true, at:1}
};
w.statBump();
T(w.roleOfUser(w.STATE.users.X)==='exec', 'الوظيفةُ لا تخفض دورَ الحساب', w.roleOfUser(w.STATE.users.X));
T(w.roleOfUser(w.STATE.users.Y)==='admin', 'ومن دورُه ووظيفتُه سواءٌ يبقى كما هو');
const c=w.mgrCandidates('admin','Y').map(x=>x.n);
T(c.includes('m.shaarawi'), 'والشعراويُّ يصلح مديرًا لصفوت', JSON.stringify(c));
T(!w.mgrCandidates('exec','X').map(x=>x.n).includes('mohamed safwat'), 'ولا عكس');
/* ووظيفةٌ أعلى ترفع من دورُه أدنى */
w.STATE.users.Z={name:'Zaki', role:'tech', job:'j_eng', active:true, at:1};
T(w.roleOfUser(w.STATE.users.Z)==='engineer', 'ووظيفةٌ أعلى ترفع من دورُ حسابه أدنى', w.roleOfUser(w.STATE.users.Z));
/* الترجمة: لا اسمَ وظيفةٍ عربيٌّ في واجهةٍ إنجليزية */
w.LANG='en'; w.goPage('users'); w.render(1);
const h=d.getElementById('content');
const optTxt=[...h.querySelectorAll('select option')].map(o=>o.textContent).join(' | ');
T(!/[\u0600-\u06FF]/.test(optTxt), 'ولا حرفَ عربيٍّ في منتقيات الشاشة بالإنجليزية',
  (optTxt.match(/[^|]*[\u0600-\u06FF][^|]*/g)||[]).slice(0,3).join(' · ') || 'نظيف');
const btns=[...h.querySelectorAll('button')].map(b=>b.textContent).join(' | ');
T(!/تعطيل|تفعيل|تعديل/.test(btns), 'ولا في أزرار الإجراءات', (btns.match(/تعطيل|تفعيل|تعديل/g)||[]).join(' · ') || 'نظيف');
w.LANG='ar';
console.log(bad?'\nجردُ الرتبة فشل ✗ ('+bad+')':'\nالرتبةُ أعلى الاثنين والواجهةُ بلغةٍ واحدة ✅');
process.exit(bad?1:0);
