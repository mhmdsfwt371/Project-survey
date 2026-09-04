/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الفجوات الإدارية الثلاث — node scripts/audit-pmp2.mjs
   ───────────────────────────────────────────────────────────────────────────
   (١) التغييرُ المعتمَدُ يُطبَّق على خط الأساس آليًّا بمقاديره — كلفةً وأيامًا
   ونطاقًا — فيُجمَّد خطٌّ جديدٌ برقمٍ أعلى يحمل رقمَ التغيير سببًا، ولا يُطبَّق
   مرتين. (٢) لكلِّ معلَمٍ موعدٌ مستهدَفٌ يُشتقُّ من المواعيد ويُضبَط باليد
   ويُرفَع، ومنه يُعرَف المتأخّر. (٣) الاحتياطيُّ يُرصَد نسبةً من السقف ويُقاس
   ما استُهلك منه من فرق التقدير عند الاكتمال عن خط الأساس.
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
const click=s2=>{const b=d.querySelector(s2); if(!b) return false; b.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return true;};
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
/* خطُّ الأساس */
w.cfgSet('budCap', null, 1000000); w.cfgSet('ph', null, 100);
const t0 = Date.now(); w.cfgSet('dueSurvey', null, t0 + 30*86400000); w.cfgSet('dueInstall', null, t0 + 90*86400000);
const B1 = w.baseSet();
T(!!B1 && B1.ver>=1 && typeof B1.bac==='number', 'خطُّ أساسٍ مجمَّد v'+B1.ver+' · BAC '+B1.bac+' (الأوزانُ صفرٌ في المتصفّح الصوري)');
/* ١ · تغييرٌ بمقادير → خطُّ أساسٍ جديد */
w.goPage('chg'); w.render(1);
d.getElementById('chgKind').value='ميزانية'; d.getElementById('chgWhy').value='تغيير اختبار';
d.getElementById('chgCost').value='50000'; d.getElementById('chgDays').value='7'; d.getElementById('chgScope').value='10';
click('[data-chgadd]');
const c = w.CHANGES[w.CHANGES.length-1];
T(c && c.dCost===50000 && c.dDays===7 && c.dScope===10, 'طلبُ التغيير يحمل مقاديرَه');
const bacBefore=w.BASE.bac, verBefore=w.BASE.ver, dueBefore=w.cfgGet('dueSurvey');
w.chgDecide(w.CHANGES.length-1, true);
T(w.BASE.ver===verBefore+1, 'الاعتمادُ جمّد خطَّ أساسٍ جديدًا v'+w.BASE.ver);
T(w.BASE.bac===bacBefore+50000, 'الميزانيةُ عند الاكتمال زادت بالكلفة');
T(w.cfgGet('dueSurvey')===dueBefore+7*86400000, 'الموعدُ انزاح سبعةَ أيام');
T(w.BASE.scope===B1.scope+10 && w.BASE.reason && w.BASE.reason.indexOf('CR-')===0, 'النطاقُ زاد والسببُ رقمُ التغيير');
T(c.applied===true, 'الطلبُ موسومٌ «طُبِّق»');
T(w.STATE.queue.some(q=>q.kind==='baseline'&&q.id==='v'+w.BASE.ver), 'وخطُّ الأساس الجديد يُرفَع');
w.chgDecide(w.CHANGES.length-1, true);
T(w.BASE.ver===verBefore+1, 'لا يُطبَّق مرتين');
/* ٢ · المعالم بتواريخ */
const m2=w.MILES[1], dt=w.mileDateOf(m2);
T(/^\d{4}-\d{2}-\d{2}$/.test(dt), 'المعلَمُ له موعدٌ مشتقّ — '+dt);
w.mileDateSet(m2.id, '2026-01-01');
T(w.mileDateOf(m2)==='2026-01-01' && w.mileLate(m2)===true, 'الموعدُ اليدويُّ يغلب الاشتقاق — والماضي غيرُ المكتمل «متأخّر»');
T(w.STATE.queue.some(q=>q.kind==='cfg'&&q.id==='miles'), 'مواعيدُ المعالم تُرفَع');
w.goPage('miles'); w.render(1);
const mh=d.getElementById('content').textContent;
T(mh.indexOf('الموعد المستهدف')>-1 && mh.indexOf('متأخّرة عن موعدها')>-1, 'الشاشةُ تعرض الموعدَ والمتأخّر');
/* ٣ · الاحتياطي */
w.cfgSet('reservePct', null, 10);
w.goPage('budm'); w.render(1);
const bh=d.getElementById('content').textContent;
T(bh.indexOf('الاحتياطي المرصود')>-1 && bh.indexOf('١٠٠٬٠٠٠')>-1, 'الاحتياطيُّ عشرةٌ بالمئة = ١٠٠٬٠٠٠ يُعرَض');
T(bh.indexOf('المستهلك من الاحتياطي')>-1, 'واستهلاكُه يُقاس');
/* الوزارة ترى ولا تضبط */
w.ROLE='viewer'; w.STATE.meta.role='viewer';
w.goPage('budm'); w.render(1);
T(!d.querySelector('#content [data-cfg="reservePct"]'), 'الوزارةُ لا ترى حقلَ ضبط الاحتياطي');
console.log(bad?'\nجردُ الفجوات الإدارية فشل ✗ ('+bad+')':'\nالفجواتُ الإداريةُ الثلاث مغلقةٌ ومحروسة ✅');
process.exit(bad?1:0);
