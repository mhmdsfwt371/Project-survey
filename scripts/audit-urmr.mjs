/* ═══════════════════════════════════════════════════════════════════════════
   جردُ نموذجَي الفكِّ والصيانة — node scripts/audit-urmr.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان يُسنَد فكٌّ (UR) وصيانةٌ (MR) من الخريطة ومن التوزيع — ثم لا يجد
   الفنيُّ أين يُسجّل ما فعل: شريحةُ «الفك والعُهدة» بلا جسمٍ أصلًا، ولا
   شاشةَ صيانةٍ بتّة. فلا تُغلَق المهمةُ ولا تُرجَع العُهدةُ ولا يُعرَف من
   صان ماذا. صار لكلٍّ نموذجُه: الفكُّ يُرجِع القطعَ بحالتها — ما سلِم يعود
   مخزونًا وما تلِف يُشطَب — ولا يُفَكُّ إلا ما سُلِّم بمحضر؛ والصيانةُ تُسجَّل
   زيارةً بعد زيارة بعطلها وما عُمل وما استُبدل، فيبقى للنقطة تاريخُ خدمة.
   وكلاهما يُغلِق مهمتَه فلا تبقى مفتوحةً على عملٍ تمّ.
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
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
const S=w.STATE.sites, it=w.itemsList()[0], it2=w.itemsList()[1];
const x=S[0];
w.STATE.inss[x.id]={id:x.id,status:'مُركّب',approved:true,at:Date.now(),by:'فريق',parts:{[it.code]:2,[it2.code]:1},serials:{}};
w.statBump();
/* الفكُّ قبل التسليم يُرفَض */
w.DISF.site=x.id; w.DISF.photos={after:{data:'d',size:1000}};
w.disSave(); T(!w.disDone(x.id), 'لا فكَّ قبل التسليم بمحضر');
w.handSave(x.id,'م. الوزارة','');
w.STATE.tasks['TK-dis-'+x.id]={id:'TK-dis-'+x.id,no:'UR-0001',site:x.id,kind:'dis',to:'فريق',status:'مطلوب',at:Date.now()};
w.statBump();
w.DISF.site=x.id; w.DISF.items={[it.code]:'سليم',[it2.code]:'تالف'}; w.DISF.photos={after:{data:'d',size:1000}};
const mv0=(w.STATE.moves||[]).length;
w.disSave();
T(w.disDone(x.id), 'الفكُّ يُسجَّل بعد التسليم');
const mvs=(w.STATE.moves||[]).slice(mv0);
T(mvs.some(m=>m.kind==='إرجاع'&&m.qty===2) && mvs.some(m=>m.kind==='شطب'&&m.qty===1),
  'السليمُ يعود مخزونًا والتالفُ يُشطَب', mvs.map(m=>m.kind+':'+m.qty).join(' · '));
T(w.STATE.tasks['TK-dis-'+x.id].status==='معتمد', 'ومهمةُ UR تُغلَق');
T(w.lifeOf(x)==='dis', 'وحالةُ النقطة صارت «فُكَّت»');
/* الصيانة */
const y=S[1];
w.STATE.inss[y.id]={id:y.id,status:'مُركّب',approved:true,at:Date.now(),by:'فريق',parts:{[it.code]:1},serials:{}};
w.STATE.tasks['TK-maint-'+y.id]={id:'TK-maint-'+y.id,no:'MR-0001',site:y.id,kind:'maint',to:'فريق',status:'مطلوب',at:Date.now()};
w.statBump();
w.MNTF.site=y.id; w.MNTF.fault=''; w.maintSave();
T(!w.maintDone(y.id), 'لا صيانةَ بلا عطلٍ مكتوب');
w.MNTF.fault='انقطاع تيار'; w.MNTF.act='استُبدل المحوّل'; w.MNTF.parts={[it.code]:1};
const mv1=(w.STATE.moves||[]).length;
w.maintSave();
T(w.maintDone(y.id), 'الصيانةُ تُسجَّل');
T((w.STATE.moves||[]).slice(mv1).some(m=>m.kind==='استهلاك'), 'والقطعُ تُخصَم من العُهدة');
T(w.STATE.tasks['TK-maint-'+y.id].status==='معتمد', 'ومهمةُ MR تُغلَق');
T(w.maintList(y.id).length===1, 'ويبقى للنقطة تاريخُ خدمة');
/* الشاشتان */
w.goPage('disp2'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('تسجيلُ فكّ')>-1, 'شاشةُ الفك تُرسَم');
w.goPage('maintForm'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('تسجيلُ صيانة')>-1, 'وشاشةُ الصيانة');
T((d.getElementById('content').textContent||'').indexOf('انقطاع تيار')>-1, 'وسجلُّها يعرض ما سُجِّل');
/* الحماية */
w.ROLE='viewer'; w.STATE.meta.role='viewer';
w.MNTF.site=S[2].id; w.MNTF.fault='x'; w.MNTF.act='y'; w.maintSave();
T(!w.maintDone(S[2].id), 'المطّلعُ لا يسجّل صيانة');
console.log(bad?'\nجردُ الفكِّ والصيانة فشل ✗ ('+bad+')':'\nلكلِّ نوعٍ نموذجُه يُغلِق مهمتَه ✅');
process.exit(bad?1:0);
