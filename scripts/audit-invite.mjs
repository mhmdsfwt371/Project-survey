/* ═══════════════════════════════════════════════════════════════════════════
   جردُ إنشاء الحسابات من الخادم — node scripts/audit-invite.mjs
   ───────────────────────────────────────────────────────────────────────────
   المتصفّحُ لا يُنشئ حسابَ دخولٍ لغير صاحبه بثبات، فبقيت حساباتٌ معلَّقةً
   في أجهزة. صار المكتبُ يكتب الطلبَ كاملًا — فردًا أو لصقةً من إكسل —
   بالاسم والمستخدم والكلمة والدور والوظيفة والقسم والبريد، والخادمُ يُنشئ
   حسابَ الدخول بمفتاح المشروع كلَّ عشر دقائق ويُعلِّم الطلبَ «تمّ». ويُصدِر
   المكتبُ ورقةَ الدخول إكسل ويوزّعها ثم يمسح الكلماتِ من القاعدة. ويُحرَس:
   الفحصُ قبل الكتابة، وتوليدُ كلمةٍ حين لا تُلصَق، وأن لا كلمةَ تبقى بعد
   المسح، وأن الفنيَّ لا يكتب طلبات.
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
w.STATE.users={}; w.STATE.pending={}; w.STATE.provision={}; w.STATE.queue=[];
/* ═══ اللصقة: سبعةُ أعمدة ═══ */
const TXT = [
  'أحمد علي\tm.ahmed\tفني\tفني تركيب\tفريق ١\tSecretPass12\tahmed@afaqy.com',
  'سعيد حسن\tm.saeed\tمشرف\tمشرف\tفريق ١',
  'قصير\tm.short\tفني\t\t\tabc',
  'خالد\t\tفني', 'نور\tnour\tمخترع', 'مكرر\tm.ahmed\tفني'
].join('\n');
const rows = w.bulkParse(TXT);
const okR = rows.filter(r=>!r.why);
T(okR.length===2, 'يُقبَل الصحيحُ وحدَه', okR.map(r=>r.user).join(' · '));
T(okR[0].pass==='SecretPass12' && okR[0].email==='ahmed@afaqy.com', 'والكلمةُ والبريدُ يُقرآن من اللصقة');
T(okR[1].pass && okR[1].pass.length===10, 'والكلمةُ تُولَّد حين لا تُلصَق', okR[1].pass);
T(!/[0O1lI]/.test(okR[1].pass), 'وبلا حروفٍ تلتبس في الطباعة');
T(rows[2].why && /عشرة/.test(rows[2].why), 'وكلمةٌ قصيرةٌ تُترَك بسببها');
T(rows[3].why && rows[4].why && rows[5].why, 'والناقصُ والمجهولُ والمكرَّرُ يُترَكون');
/* ═══ الكتابة: طلبٌ للخادم ═══ */
w.BULK_TXT=TXT; w.bulkApply();
T(Object.keys(w.STATE.provision).length===2 && w.STATE.provision['m.ahmed'].status==='pending', 'يُكتَب طلبٌ بحالة «يُنشَأ»');
T(w.STATE.queue.some(q=>q.kind==='provision'&&q.id==='m.ahmed'), 'ويُرفَع للخادم');
T(w.STATE.users['m.ahmed'] && w.STATE.users['m.ahmed'].provisioning, 'ويظهر في القائمة معلَّمًا');
T(!w.STATE.pending['m.ahmed'], 'ولا يُكتَب معلَّقًا — الطريقُ القديمُ انتهى');
/* ═══ الفرديّ ═══ */
w.goPage('users'); w.render(1);
const set=(id,v)=>{ const e=d.getElementById(id); if(e) e.value=v; };
set('uU','m.fardi'); set('uN','فردي'); set('uP','VeryStrong99'); set('uE','f@afaqy.com');
const roleSel=d.getElementById('uR'); if (roleSel) roleSel.value='tech';
w.usrAdd();
T(w.STATE.provision['m.fardi'] && w.STATE.provision['m.fardi'].pass==='VeryStrong99' && w.STATE.provision['m.fardi'].email==='f@afaqy.com',
  'والإنشاءُ الفرديُّ يكتب الطلبَ بالكلمة والبريد');
/* ═══ الخادمُ أنجز: تصل الحالة ═══ */
w.STATE.provision['m.ahmed']=Object.assign({},w.STATE.provision['m.ahmed'],{status:'done',uid:'UIDA'});
w.STATE.provision['m.saeed']=Object.assign({},w.STATE.provision['m.saeed'],{status:'error',why:'اسمُ مستخدمٍ غيرُ صالح'});
w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('طلباتُ الإنشاء')>-1 && h.indexOf('اسمُ مستخدمٍ غيرُ صالح')>-1, 'بطاقةُ الطلبات تعرض تمّ والخطأ بسببه');
T(!!d.querySelector('#content [data-xls="provsheet"]'), 'وزرُّ ورقة الدخول يظهر لما تمّ وله كلمة');
/* ═══ الورقة ═══ */
const sheet=w.SHEETS.provsheet();
T(sheet.length===2 && sheet[1][1]==='m.ahmed' && sheet[1][2]==='SecretPass12' && sheet[1][6]==='ahmed@afaqy.com',
  'والورقةُ فيها المستخدمُ والكلمةُ والبريدُ لمن تمّ فقط', JSON.stringify(sheet[1]).slice(0,80));
/* ═══ المسح ═══ */
w.provWipe();
T(w.STATE.provision['m.ahmed'].pass==='' && w.SHEETS.provsheet().length===1, 'وبعد التوزيع تُمسَح الكلماتُ فلا تبقى في القاعدة');
/* ═══ الحماية ═══ */
w.ROLE='tech'; w.STATE.meta.role='tech';
const n0=Object.keys(w.STATE.provision).length;
w.BULK_TXT='س\tm.x\tفني'; w.bulkApply();
T(Object.keys(w.STATE.provision).length===n0, 'والفنيُّ لا يكتب طلبات');
/* ═══ لا تفعيلَ ذاتيًّا ═══ */
T(typeof w.inviteClaim==='undefined' && !d.getElementById('lgNew'), 'ولا تفعيلَ ذاتيًّا بعد اليوم — الطريقُ من الخادم وحده');
console.log(bad?'\nجردُ الإنشاء من الخادم فشل ✗ ('+bad+')':'\nالمكتبُ يكتب والخادمُ يُنشئ — ولا كلمةَ تبقى في القاعدة ✅');
process.exit(bad?1:0);
