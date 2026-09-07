/* ═══════════════════════════════════════════════════════════════════════════
   جردُ من يُنشئ من — node scripts/audit-hier.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان الإنشاءُ للمهندس وحده، فيقف الفريقُ كلُّه على مكتبٍ واحد. صار كلٌّ
   يُنشئ في مستواه أو دونه: المشرفُ يُنشئ مشرفًا أو فنيًّا ولا يُنشئ مهندسًا،
   والمهندسُ مهندسًا فما دون، ومديرُ المشروع الجميعَ حتى الإدارة العليا —
   وهو الاستثناءُ الوحيد لأنه من يُدير الأدوار. والفنيُّ والوزارةُ لا
   يُنشئان شيئًا ولا يريان الشاشة. ومن فوقُ يرى كلَّ ما أُنشئ تحته، ومن
   دونه ما كتبه هو. والقاعدةُ تحرس الرتبةَ على الطلب نفسِه.
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
const as=(r,n)=>{ w.ROLE=r; w.STATE.meta.role=r; w.STATE.meta.name=n; };
w.STATE.users={}; w.STATE.provision={};
as('supervisor','مشرف أ');
T(w.canProvision(), 'المشرفُ يُنشئ');
T(w.rolesICanMake().join(',')==='supervisor,tech,cprep,casm,cins,buyer,store,acct,helper,driver,viewer' || (!w.rolesICanMake().includes('engineer') && w.rolesICanMake().includes('tech')), 'ويرى في المنتقي مستواه فما دون', w.rolesICanMake().join(' · '));
T(!w.canMakeRole('engineer') && !w.canMakeRole('admin'), 'ولا يُنشئ مهندسًا ولا مديرًا');
const rows=w.bulkParse('س\tm.s\tمهندس\nف\tm.f\tفني');
T(rows[0].why && /أعلى من دورك/.test(rows[0].why) && !rows[1].why, 'واللصقةُ تترك الأعلى بسببه');
w.BULK_TXT='ف\tm.f\tفني'; w.bulkApply();
T(w.STATE.provision['m.f'] && w.STATE.provision['m.f'].by==='مشرف أ', 'ويُكتَب الطلبُ باسمه');
T(w.seesPage('users'), 'ويرى شاشةَ الحسابات');
w.goPage('users'); w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('دعوةٌ جماعية')>-1 && h.indexOf('طلباتُ الإنشاء')>-1 && h.indexOf('حساباتٌ معلَّقة')<0, 'وفيها الإنشاءُ والطلباتُ لا المعلَّقاتِ القديمة');
as('engineer','مهندس');
T(w.canMakeRole('engineer') && !w.canMakeRole('admin'), 'المهندسُ يُنشئ مهندسًا لا مديرًا');
as('admin','مدير');
T(w.canMakeRole('admin') && w.canMakeRole('exec'), 'والمديرُ الجميعَ حتى الإدارة العليا');
as('tech','فني');
T(!w.canProvision() && !w.seesPage('users'), 'والفنيُّ لا يُنشئ ولا يرى الشاشة');
const b0=Object.keys(w.STATE.provision).length; w.BULK_TXT='س\tm.x\tفني'; w.bulkApply();
T(Object.keys(w.STATE.provision).length===b0, 'ولا يكتب طلبًا');
as('viewer','وزارة');
T(!w.canProvision(), 'والوزارةُ كذلك');
console.log(bad?'\nجردُ من يُنشئ من فشل ✗ ('+bad+')':'\nكلٌّ يُنشئ في مستواه أو دونه — والمديرُ الجميع ✅');
if (bad) process.exit(1);

/* ═══ حذفُ الحساب: للمهندس والمدير — لا نفسَه ولا من فوقه ═══ */
{
  let bad3=0; const T3=(c,n,x)=>{ if(!c) bad3++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
  w.confirm=()=>true;
  w.STATE.users={ ME:{name:'مهندس',role:'engineer',active:true}, A:{name:'مدير',role:'admin',active:true}, T:{name:'فني',role:'tech',active:true,user:'t.x'}, S:{name:'مشرف',role:'supervisor',active:true} };
  w.STATE.meta.uid='ME'; w.STATE.provision={}; w.STATE.queue=[];
  as('engineer','مهندس');
  T3(w.usrDel('T')===true && !w.STATE.users.T, 'المهندسُ يحذف فنيًّا');
  T3(w.STATE.queue.some(q=>q.kind==='users'&&q.id==='T'&&q.v===null), 'ويُمحى من القاعدة');
  T3(w.STATE.provision['del-T'] && w.STATE.provision['del-T'].action==='delete', 'ويُطلَب من الخادم حذفُ حساب الدخول');
  T3(w.usrDel('ME')===false && w.STATE.users.ME, 'ولا يحذف نفسَه');
  T3(w.usrDel('A')===false && w.STATE.users.A, 'ولا يحذف مديرًا');
  as('supervisor','مشرف');
  T3(w.usrDel('S')===false, 'والمشرفُ لا يحذف');
  w.goPage('users'); w.render(1);
  T3(!d.querySelector('#content [data-usrdel]'), 'ولا يرى الزر');
  as('admin','مدير'); w.STATE.meta.uid='A'; w.goPage('users'); w.render(1);
  T3(!!d.querySelector('#content [data-usrdel]') && !d.querySelector('#content [data-usrdel="A"]'), 'والمديرُ يراه لغيره لا لنفسه');
  console.log(bad3?'\nجردُ الحذف فشل ✗ ('+bad3+')':'\nالحذفُ للمهندس والمدير — لا نفسَه ولا من فوقه ✅');
  if (bad3) process.exit(1);
}

process.exit(0);
