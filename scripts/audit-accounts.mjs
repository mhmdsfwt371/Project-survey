/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سلسلة الحساب — node scripts/audit-accounts.mjs
   ───────────────────────────────────────────────────────────────────────────
   بعين المختبِر: الهرمُ كلُّه بلصقةٍ واحدة — إدارةٌ عليا ومهندسٌ ومشرفٌ
   وفنيّان ومحاسبٌ ووزارة — ثم يُحاكى إنجازُ الخادم، ويُمشى ما بعده:
   الرتبُ والمديرون، ومن يرى من، ومن يُسنَد إليه، وصلاحياتُ كلِّ دور،
   وورقةُ الدخول والمسحُ بعدها، وإعادةُ الإصدار لمن نسي كلمتَه. أمسك يومَ
   كُتب ثلاثةً: دورٌ بمرادفٍ يُترَك، وإعادةُ الإصدار تُرفَض، والوزارةُ
   تظهر للفنيِّ في قائمة الناس.
   ═════════════════════════════════════════════════════════════════════════ */
/* QA بعين المختبِر: سلسلةُ الحساب كاملةً — طلبٌ → خادمٌ → دخولٌ → رتبةٌ → رؤيةٌ → إسناد */
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
let bad=0; const say=(ok,n,x)=>{ if(!ok) bad++; console.log((ok?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.name='مدير';
w.STATE.users={ ADM:{name:'مدير',role:'admin',active:true,at:1} }; w.STATE.provision={}; w.STATE.pending={}; w.STATE.queue=[];
/* ١ · الهرمُ كاملًا بلصقة */
const TXT=[
 'الشعراوي\tm.shaarawi\tالإدارة العليا\tمدير المشروع\t\t\ts@afaqy.com',
 'شكري\tm.shokry\tمهندس\tمهندس المشروع',
 'مشرف أ\tsup.a\tمشرف\tمشرف\tفريق ١',
 'فني ١\ttec.1\tفني\tفني تركيب\tفريق ١',
 'فني ٢\ttec.2\tفني\tفني تركيب\tفريق ١',
 'محاسب\tacc.1\tمحاسب\tمحاسب',
 'وزارة\tmoh.1\tمطّلع\tمراقب وزاري'].join('\n');
w.BULK_TXT=TXT; w.bulkApply();
const P=w.STATE.provision;
say(Object.keys(P).length===7, '١ · سبعةُ طلباتٍ للهرم كلِّه', Object.keys(P).join(' · '));
say(P['m.shaarawi'].role==='exec' && P['acc.1'].role==='acct' && P['moh.1'].role==='viewer', '   الأدوارُ بالعربيّ تُفهَم: إدارة عليا · محاسب · مطّلع');
say(Object.values(P).every(r=>r.pass && r.pass.length>=10), '   ولكلٍّ كلمةٌ مولَّدة');
/* ٢ · الخادمُ أنجز — يُحاكى وصولُ «تمّ» ووثائقِ المستخدمين بالإنصات */
const mkDoc=(u,uid)=>{ const r=P[u]; const v={name:r.name,user:u,role:r.role,active:true,at:Date.now(),mustChange:true}; if(r.job)v.job=r.job; if(r.crew)v.crew=r.crew; if(r.email)v.email=r.email; return v; };
const ids={ 'm.shaarawi':'U_EX','m.shokry':'U_EN','sup.a':'U_SP','tec.1':'U_T1','tec.2':'U_T2','acc.1':'U_AC','moh.1':'U_VW' };
Object.keys(ids).forEach(u=>{ w.STATE.users[ids[u]]=mkDoc(u,ids[u]); P[u]=Object.assign({},P[u],{status:'done',uid:ids[u]}); delete w.STATE.users[u]; });
w.statBump();
say(!Object.keys(w.STATE.users).some(k=>w.STATE.users[k].provisioning), '٢ · بعد الإنشاء لا يبقى صفٌّ «يُنشَأ» مكرَّرًا مع الحساب الحقيقيّ');
/* ٣ · الرتبُ والمديرون */
say(w.rankOf(w.roleOfUser(w.STATE.users.U_EX))>w.rankOf('admin'), '٣ · الشعراويُّ فوق مديرِ المشروع رغم وظيفة «مدير المشروع»');
const mgrs=w.mgrCandidates('admin','ADM').map(x=>x.n);
say(mgrs.includes('الشعراوي'), '   ويصلح مديرًا له', mgrs.join(' · '));
say(w.mgrCandidates('tech','U_T1').map(x=>x.n).includes('مشرف أ'), '   والمشرفُ يصلح مديرًا للفنيّ');
/* ٤ · من يرى من */
const see=(role,name)=>{ w.ROLE=role; w.STATE.meta.role=role; w.STATE.meta.name=name; return w.usersList().map(x=>x[1].name).sort().join('·'); };
const en=see('engineer','شكري');
say(/مشرف أ/.test(en) && /فني ١/.test(en), '٤ · المهندسُ يرى المشرفين والفنيّين', en);
const sp=see('supervisor','مشرف أ');
say(/فني ١/.test(sp) && /فني ٢/.test(sp) && !/شكري/.test(sp) && !/الشعراوي/.test(sp), '   والمشرفُ يرى فنيّيه ولا يرى من فوقه', sp);
say(see('tech','فني ١')==='فني ١', '   والفنيُّ نفسَه فقط');
say(see('viewer','وزارة')==='وزارة', '   والوزارةُ نفسَها فقط');
/* ٥ · الإسناد: الميدانُ وحدَه */
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='شكري';
const fld=w.techNames();
say(fld.includes('فني ١') && fld.includes('مشرف أ') && fld.includes('شكري'), '٥ · يُسنَد للفنيِّ والمشرفِ والمهندس', fld.join(' · '));
say(!fld.includes('محاسب') && !fld.includes('وزارة') && !fld.includes('الشعراوي'), '   ولا للمحاسبِ ولا الوزارةِ ولا الإدارة العليا');
/* ٦ · الصلاحيات */
const can=(role,cap)=>{ w.ROLE=role; w.STATE.meta.role=role; return w.may(cap); };
say(can('exec','money') && !can('exec','edit') && !can('exec','users'), '٦ · الإدارةُ العليا: مالٌ نعم · تعديلٌ وحساباتٌ لا');
say(can('supervisor','edit') && !can('supervisor','users') && !can('supervisor','settings'), '   المشرف: يعدّل · لا يُدير حسابات · لا يضبط');
say(can('acct','money') && !can('acct','edit'), '   المحاسب: مالٌ · لا تعديلَ ميدانيّ');
say(!can('viewer','edit') && !can('viewer','phones'), '   الوزارة: لا تعديلَ ولا جوالات');
/* ٧ · الورقةُ والمسح */
w.ROLE='admin'; w.STATE.meta.role='admin';
const sh=w.SHEETS.provsheet();
say(sh.length===8 && sh[0].length===7, '٧ · ورقةُ الدخول: سبعةُ صفوفٍ بسبعة أعمدة');
say(sh.slice(1).every(r=>r[2] && r[2].length>=10), '   وكلُّ صفٍّ بكلمته');
w.provWipe();
say(w.SHEETS.provsheet().length===1 && Object.values(P).every(r=>r.pass===''), '   وبعد المسح لا كلمةَ في القاعدة ولا في الورقة');
/* ٨ · إعادةُ الطلب لمن نسي كلمتَه: طلبٌ جديدٌ بالاسم نفسِه يُقبَل بعد «تمّ» */
const again=w.bulkParse('فني ١\ttec.1\tفني');
say(!again[0].why || !/قائم/.test(again[0].why), '٨ · من نسي كلمتَه يُعاد طلبُه بالاسم نفسِه (الخادمُ يضبط الكلمةَ الجديدة)', again[0].why||'يُقبَل');
console.log(bad?'\nجردُ سلسلة الحساب فشل ✗ ('+bad+')':'\nالهرمُ كلُّه بلصقةٍ — ويُمشى ما بعده إلى الإسناد ✅');
process.exit(bad?1:0);
