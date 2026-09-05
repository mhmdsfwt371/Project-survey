/* ═══════════════════════════════════════════════════════════════════════════
   جردُ إعلان الخطوات — node scripts/audit-steps.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان الحفظُ يُسجَّل في السجل ولا يُشعِر: يزور الفنيُّ ويركّب ويفكُّ ويصون
   ويسلّم — ولا يعلم المكتبُ إلا حين يفتح الشاشةَ ويعدّ. صار كلُّ حفظٍ يُعلن
   خطوتَه: إشعارٌ **بلا وجهةٍ** يراه المكتبُ كلُّه، وسطرٌ في «آخر ما تمّ»
   يقرؤه المهندسُ في «أمس·الآن·غدًا» والوزارةُ في «نظرة عامة» — بمن فعل وأين
   ومتى وكم نقطةً كسب. والسجلُّ بسقفٍ فلا يتضخّم.
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
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='فني أ';
const S=w.STATE.sites, it=w.itemsList()[0];
const n0=(w.STATE.steps||[]).length, nt0=w.notifStore().length;
/* ١ · الزيارة */
const x=S[0];
w.FORM.site=x.id; w.FORM.access='تم الوصول'; w.FORM.photos={site:{data:'a'},mount:{data:'b'}};
w.svSave(0);
T((w.STATE.steps||[]).length===n0+1 && w.STATE.steps[0].kind==='visit', 'حفظُ الزيارة يُعلن خطوتَه');
T(w.notifStore().length>nt0 && w.notifStore()[0].kind==='تمّ', 'ويُشعِر المكتبَ', w.notifStore()[0].text.slice(0,44));
T(!w.notifStore()[0].to, 'بلا وجهةٍ — فيراه المكتبُ كلُّه');
/* ٢ · التركيب */
w.STATE.recs[x.id].review='approved';
w.STATE.inss[x.id]={id:x.id,solution:{status:'معتمد',items:{[it.code]:1}},at:Date.now()};
w.statBump();
w.FORM.site=x.id; w.FORM.status='مُركّب'; w.FORM.parts={[it.code]:1}; w.FORM.serials={};
w.FORM.photos={before:{data:'a'},after:{data:'b'}};
w.insSave(0);
T((w.STATE.steps||[])[0] && w.STATE.steps[0].kind==='install', 'وحفظُ التركيب كذلك', (w.STATE.steps[0]||{}).detail);
/* ٣ · الفك والصيانة والتسليم */
w.STATE.inss[x.id]=Object.assign({},w.STATE.inss[x.id],{status:'مُركّب',approved:true,parts:{[it.code]:1},serials:{}});
w.statBump(); w.handSave(x.id,'م. الوزارة','');
T(w.STATE.steps[0].kind==='hand', 'والتسليم');
w.DISF.site=x.id; w.DISF.items={[it.code]:'سليم'}; w.DISF.photos={after:{data:'d',size:9}};
w.disSave();
T(w.STATE.steps[0].kind==='dis', 'والفك');
const y=S[1];
w.STATE.inss[y.id]={id:y.id,status:'مُركّب',approved:true,at:Date.now(),by:'ف',parts:{[it.code]:1},serials:{}};
w.statBump();
w.MNTF.site=y.id; w.MNTF.fault='عطل'; w.MNTF.act='إصلاح'; w.MNTF.parts={};
w.maintSave();
T(w.STATE.steps[0].kind==='maint', 'والصيانة');
/* ٤ · البطاقة */
w.goPage('now'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('آخر ما تمّ')>-1, 'بطاقةُ «آخر ما تمّ» في «الآن»');
w.ROLE='viewer'; w.STATE.meta.role='viewer';
w.goPage('over'); w.render(1);
const ov=d.getElementById('content').textContent||'';
T(ov.indexOf('آخر ما تمّ')>-1, 'وفي «نظرة عامة» للوزارة');
T(ov.indexOf('صيانة')>-1 && ov.indexOf('تسليم')>-1, 'وتعرض أنواعَ الخطوات', 'صيانة/تسليم');
/* ٥ · السقف */
for (let i=0;i<310;i++) w.stepDone('visit','S'+i,'',0);
T((w.STATE.steps||[]).length===300, 'السجلُّ لا يتضخّم — سقفُه ٣٠٠', String((w.STATE.steps||[]).length));
console.log(bad?'\nجردُ إعلان الخطوات فشل ✗ ('+bad+')':'\nكلُّ حفظٍ يُعلن خطوتَه ويصل اللوحات ✅');
process.exit(bad?1:0);
