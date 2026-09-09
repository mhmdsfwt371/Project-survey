/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الفريق من طرفٍ إلى طرف — node scripts/audit-e2e-accounts.mjs
   ───────────────────────────────────────────────────────────────────────────
   للمرة الأخيرة بعينِ من يشكّ: مديرُ المشروع على هاتفه يلصق فريقَه، ويُحاكى
   الخادمُ فيُنشئ الحسابات، ثم يُفتَح **جهازٌ آخرُ جديدٌ** بحساب المهندس لا
   يحمل من الأوّل شيئًا سوى ما في القاعدة — فيرى كلَّ المشرفين ومن دونهم،
   ويُسنِد إليهم، ولا يرى كلماتِ مرورٍ ليست له. ثم جهازٌ ثالثٌ بحساب مشرفٍ
   يرى فنيّيه وحدهم. وورقةُ الدخول تُصدَّر من الهاتف الأوّل بكلماتٍ لكلٍّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
async function device(role, name, uid, cloud){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
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
  w.ROLE=role; w.STATE.meta.role=role; w.STATE.meta.name=name; w.STATE.meta.uid=uid;
  /* الجهازُ الجديدُ لا يحمل إلا ما في «السحابة» */
  w.STATE.users = JSON.parse(JSON.stringify(cloud.users));
  w.STATE.provision = JSON.parse(JSON.stringify(cloud.provision));
  w.STATE.queue=[]; w.statBump();
  return { w, d };
}
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const cloud = { users:{ ADM:{name:'mohamed safwat',role:'admin',active:true,at:1} }, provision:{} };
/* ═══ الهاتفُ الأوّل: المدير يلصق الفريق ═══ */
const A = await device('admin','mohamed safwat','ADM',cloud);
A.w.BULK_TXT=[
 'محمد شكري\tm.shokry\tمهندس\tمهندس المشروع',
 'مشرف أ\tsup.a\tمشرف\tمشرف\tفريق ١', 'مشرف ب\tsup.b\tمشرف\tمشرف\tفريق ٢',
 'فني ١\ttec.1\tفني\tفني تركيب\tفريق ١', 'فني ٢\ttec.2\tفني\tفني تركيب\tفريق ١', 'فني ٣\ttec.3\tفني\tفني تركيب\tفريق ٢',
 'محاسب\tacc.1\tمحاسب', 'وزارة\tmoh.1\tوزارة'].join('\n');
A.w.bulkApply();
T(Object.keys(A.w.STATE.provision).length===8, '١ · المديرُ لصق ثمانيةً — ثمانيةُ طلبات');
T(A.w.STATE.queue.filter(q=>q.kind==='provision').length===8, '   وثمانيةٌ في الطابور للخادم');
/* ═══ الخادمُ أنجز: كما يفعل provision.mjs ═══ */
const P=A.w.STATE.provision, ids={};
Object.keys(P).forEach((u,i)=>{ const r=P[u]; const uid='U'+i;
  cloud.users[uid]={ name:r.name, user:u, role:r.role, active:true, at:Date.now(), mustChange:true, job:r.job||undefined, crew:r.crew||undefined };
  cloud.provision[u]=Object.assign({},r,{status:'done',uid}); ids[u]=uid; });
/* الورقةُ من هاتف المدير */
A.w.STATE.provision=JSON.parse(JSON.stringify(cloud.provision));
const sheet=A.w.SHEETS.provsheet();
T(sheet.length===9 && sheet.slice(1).every(r=>r[2].length>=10), '٢ · ورقةُ الدخول: ثمانيةُ صفوفٍ بكلماتٍ لكلٍّ', sheet.length-1+' صفوف');
/* ═══ الجهازُ الثاني: المهندس على لابه — جديدٌ تمامًا ═══ */
const E = await device('engineer','محمد شكري',ids['m.shokry'],cloud);
const seen=E.w.usersList().map(x=>x[1].name);
T(seen.includes('مشرف أ') && seen.includes('مشرف ب'), '٣ · المهندسُ على لابه يرى كلَّ المشرفين', seen.join(' · '));
T(seen.includes('فني ١') && seen.includes('فني ٣'), '   ومن دونهم');
const fld=E.w.techNames();
T(fld.includes('مشرف أ') && fld.includes('فني ٢') && !fld.includes('محاسب') && !fld.includes('وزارة'), '   ويُسنِد للمشرف والفنيِّ لا المحاسب ولا الوزارة');
E.w.goPage('users'); E.w.render(1);
const eh=E.d.getElementById('content').textContent;
T(eh.indexOf('مشرف أ')>-1 && eh.indexOf('مشرف ب')>-1, '   وشاشةُ الحسابات على لابه تعرضهم');
T(E.w.rolesICanMake().includes('supervisor') && !E.w.rolesICanMake().includes('admin'), '   ويُنشئ مشرفًا ولا يُنشئ مديرًا');
/* ═══ الجهازُ الثالث: مشرف أ ═══ */
const S = await device('supervisor','مشرف أ',ids['sup.a'],cloud);
const ss=S.w.usersList().map(x=>x[1].name);
T(ss.includes('فني ١') && ss.includes('فني ٢') && ss.includes('فني ٣'), '٤ · المشرفُ يرى الفنيّين', ss.join(' · '));
/* V16.55: الرؤيةُ صارت «رتبتي فما دونها» — فالمشرفُ يرى نظراءَه ولا يرى من فوقه */
T(!ss.includes('محمد شكري') && !ss.includes('mohamed safwat'), '   ولا يرى المهندسَ ولا المديرَ');
T(ss.includes('مشرف ب'), '   ويرى نظيرَه في الرتبة', ss.join(' · '));
T(!S.w.mayBonus(), '   ولا يكتب نقاطَ زيادة');
T(E.w.mayBonus() && A.w.mayBonus(), '   والمهندسُ والمديرُ يكتبانها');
/* ═══ الفنيّ ═══ */
const F = await device('tech','فني ١',ids['tec.1'],cloud);
/* الفنيُّ يرى نظراءَه في القائمة، ولا يرى شاشتَها أصلًا — فالقائمةُ لا تُعرَض له */
T(F.w.usersList().every(x => F.w.rankOf(x[1].role || 'tech') <= F.w.rankOf('tech')), '٥ · الفنيُّ لا يرى فوقَ رتبته', F.w.usersList().map(x=>x[1].name).join(' · '));
T(!F.w.seesPage('users'), '   ولا يرى شاشةَ الحسابات');
console.log(bad?'\nجردُ الفريق من طرفٍ إلى طرف فشل ✗ ('+bad+')':'\nالمديرُ يُنشئ ويوزّع — والمهندسُ على لابه يرى كلَّ المشرفين ✅');
process.exit(bad?1:0);
