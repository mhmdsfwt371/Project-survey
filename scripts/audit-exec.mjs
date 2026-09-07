/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الإدارة العليا — node scripts/audit-exec.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان السلَّمُ ينتهي عند مديرِ المشروع: فلا مديرَ له ولا يُسأل عن عمله أحدٌ
   داخل النظام — وهو في الواقع يرفع إلى إدارةٍ عليا تسأل عن الربحية
   والمخاطر الكبرى والقرار. فأُضيفت مرتبةٌ فوقه بدورها: تقرأ الموقفَ
   التنفيذيَّ والمعالمَ والقيمةَ المكتسبةَ والمخاطر، ولا تعدّل ولا تعتمد ولا
   تضبط — فالإشرافُ لا يعني الإمساك بكلِّ مقبض. ولا يُسنَد إليها عملٌ
   ميدانيّ. وبها صار مديرُ المشروع يُسنَد إلى مديرٍ كما يُسنَد غيرُه.
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
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.name='مدير';
w.STATE.users={
  X:{name:'m.shaarawi',role:'exec',active:true,at:1},
  Y:{name:'mohamed safwat',role:'admin',active:true,at:1},
  Z:{name:'مهندس ج',role:'engineer',active:true,at:1},
  A:{name:'فني أ',role:'tech',active:true,at:1}
};
w.statBump();
/* ١ · المرتبة */
T(w.rankOf('exec') > w.rankOf('admin'), 'الإدارةُ العليا فوق مديرِ المشروع', w.rankOf('exec')+' > '+w.rankOf('admin'));
/* ٢ · تصلح مديرًا لمدير المشروع */
const c = w.mgrCandidates('admin','Y').map(x=>x.n || x);
T(c.some(n=>/shaarawi/.test(String(n))), 'وتظهر في «مديره» لمدير المشروع', JSON.stringify(c).slice(0,90));
/* ٣ · ومدير المشروع لا يصلح مديرًا لها */
const c2 = w.mgrCandidates('exec','X').map(x=>x.n || x);
T(!c2.some(n=>/mohamed safwat/.test(String(n))), 'ولا يصلح مديرُ المشروع مديرًا لها', JSON.stringify(c2).slice(0,70));
/* ٤ · الصلاحيات: تقرأ ولا تعدّل */
w.ROLE='exec'; w.STATE.meta.role='exec';
T(!w.may('edit') && !w.may('approve') && !w.may('settings') && !w.may('users'), 'تقرأ ولا تعدّل ولا تعتمد ولا تضبط');
T(w.may('money') && w.may('exportAll'), 'وترى المالَ وتُصدِّر');
/* ٥ · ترى ما تحتاجه */
['exec','over','miles','evm','budm','risks','repcenter'].forEach(p=>{
  T(w.seesPage((w.PARENT&&w.PARENT[p])||p), '  ترى «'+p+'»');
});
T(!w.seesPage('users') && !w.seesPage('consts'), 'ولا ترى إدارةَ الحسابات ولا الثوابت');
/* ٦ · لا تُسنَد إليها مهامُّ ميدانية */
T(!w.techsList().some(x=>x.name==='m.shaarawi' || x.n==='m.shaarawi'), 'ولا يُسنَد إليها عملٌ ميدانيّ');
/* ٧ · شاشاتُها تُرسَم */
let drew=0;
['exec','over','miles','evm','risks'].forEach(p=>{ try{ w.goPage(p); w.render(1); if((d.getElementById('content').textContent||'').length>60) drew++; }catch(e){} });
T(drew===5, 'وشاشاتُها الخمسُ تُرسَم', drew+'/5');
console.log(bad?'\nجردُ الإدارة العليا فشل ✗ ('+bad+')':'\nمرتبةٌ فوق مديرِ المشروع تقرأ ولا تُمسِك ✅');
process.exit(bad?1:0);
