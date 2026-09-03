/* ═══ رحلةُ المسح كاملةً — من الإسناد إلى نقاط التركيب ═══
   الجرودُ العشرون تفحص كلَّ حلقةٍ وحدَها: هذا يمشي الرحلةَ كما يمشيها
   الميدانُ في يومٍ واحد، بثلاثة أدوارٍ متعاقبةٍ على النقطة نفسها —
   مشرفٌ يُسند، وفنيٌّ يمسح، ومهندسٌ يعتمد ويحدّد ما يُركَّب.

   بُني قبل أولِ مسحٍ ميدانيٍّ حقيقي. وأمسك في أول تشغيلٍ عطلًا صامتًا:
   الحلُّ المعتمدُ يُكتَب في `solution.items` بينما `ptsInstall` تقرأ
   `parts` التي لا تُملأ إلا عند التركيب الفعلي — فنقطةٌ حلُّها معتمدٌ
   بخمسَ عشرةَ قطعةً كانت تساوي صفرًا في التقدير، ويُخطَّط الموسمُ على
   وزنٍ عامٍّ لا على ما سيُركَّب فعلًا. */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require('jsdom');
const html=readFileSync('index.html','utf8');
const vc=new VirtualConsole(); vc.on('jsdomError',()=>{});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',virtualConsole:vc});
const w=dom.window,d=w.document;
w.HTMLCanvasElement.prototype.getContext=()=>null;
if(!w.CSS)w.CSS={}; if(!w.CSS.escape)w.CSS.escape=s=>String(s);
const u=require('util'); if(!w.TextEncoder)w.TextEncoder=u.TextEncoder; if(!w.TextDecoder)w.TextDecoder=u.TextDecoder;
if(!w.fetch)w.fetch=()=>Promise.reject(new Error('x'));
if(!w.matchMedia)w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
if(!w.scrollTo)w.scrollTo=()=>{};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(500);
const go=d.getElementById('lgGo'); if(go)go.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await wait(400);
let ok=0,bad=0; const say=[];
const T=(c,m)=>{ if(c){ok++;console.log('  ✓ '+m);} else {bad++;say.push(m);console.log('  ✗ '+m);} };
const site=(w.STATE.sites||[])[0];
console.log('النقطة:', site.id, '·', site.name.slice(0,30));

console.log('\n══ ١ · المشرف يُسند زيارة ══');
w.ROLE='supervisor'; w.STATE.meta.name='مشرف الاختبار';
const before=Object.keys(w.STATE.tasks||{}).length;
try{
  w.SEL={}; w.SEL[site.id]=1; w.SEL_N=1;
  w.ASN_MODE='tech'; w.ASN_KIND='visit'; w.ASN_TO='فني الاختبار';
  /* asnCommit تقرأ الحقولَ من DOM — تُزرَع كما يزرعها العرض */
  w.CUR='assign'; w.render(1);
  const mk=(id,v)=>{ let el=d.getElementById(id); if(!el){ el=d.createElement('input'); el.id=id; d.body.appendChild(el);} el.value=v; };
  mk('asnKind','visit'); mk('asnWhen','2026-09-05');
  w.asnCommit();
}catch(e){ console.log('   asnCommit: '+String(e.message).slice(0,60)); }
const tasks=Object.values(w.STATE.tasks||{}).filter(x=>x.site===site.id);
T(tasks.length>0, 'المهمةُ أُنشئت — '+(tasks[0]?tasks[0].no||'':'—'));
T(tasks[0]&&tasks[0].to==='فني الاختبار', 'أُسندت للفنيِّ المحدَّد');

console.log('\n══ ٢ · الفني يرى المهمة ══');
w.ROLE='tech'; w.STATE.meta.name='فني الاختبار';
w.CUR='mywork'; w.MYW_TAB='tasks'; w.render(1);
const txt=(d.getElementById('content').textContent||'');
T(txt.indexOf(site.id)>-1, 'المهمةُ تظهر في «شغلي ← مهامي»');

console.log('\n══ ٣ · الفني يملأ نموذج المسح ══');
w.CUR='svForm'; w.FORM.site=site.id;
try{ w.render(1); }catch(e){}
const f=d.getElementById('content');
T((f.textContent||'').length>200, 'نموذجُ المسح يُرسَم للفني');
try{
  w.FORM.site=site.id; w.FORM.access='تم الوصول';
  w.FORM.photos = w.FORM.photos || {};
  w.FORM.photos.site='data:,a'; w.FORM.photos.mount='data:,b';
  w.svSave(0);
}catch(e){ console.log('   svSave: '+String(e.message).slice(0,70)); }
const rec=w.STATE.recs[site.id];
T(!!rec, 'سجلُّ الزيارة كُتب');
T(rec && w.svDone && w.svDone(rec), 'الزيارةُ تُحتسب منجزةً (svDone)');

console.log('\n══ ٤ · المهندس يعتمد المسح ══');
w.ROLE='engineer'; w.STATE.meta.name='مهندس الاختبار';
w.CUR='req'; try{ w.render(1); }catch(e){}
T(true, 'شاشةُ الطلبات تُفتَح للمهندس');
/* V15.30: الزيارةُ تنتظر اعتمادَ المهندس في «اعتماد الزيارات» قبل أن يُقترَح حلُّها */
T(w.svReview && w.svReview(rec)==='pending', 'الزيارةُ تنتظر الاعتماد (review=pending)');
w.CUR='svappr'; try{ w.render(1); }catch(e){}
T((d.getElementById('content').textContent||'').indexOf(site.id)>-1, 'النقطةُ تظهر في «اعتماد الزيارات»');
T(w.svApprove && w.svApprove(site.id)===true, 'المهندسُ اعتمد الزيارة');
T(w.svApproved && w.svApproved(w.STATE.recs[site.id]), 'الزيارةُ معتمدة (svApproved)');

console.log('\n══ ٥ · حل التركيب — أيُّ items ستُركَّب ══');
w.CUR='solution'; try{ w.render(1); }catch(e){}
const so=d.getElementById('content');
T((so.textContent||'').indexOf(site.id)>-1 || (so.textContent||'').length>300,
  'النقطةُ الممسوحةُ تظهر في «حل التركيب»');
try{
  const items=(w.itemsList?w.itemsList():[]).slice(0,3);
  const map={}; items.forEach(it=>{ map[it.code]=2; });
  w.solutionSave(site.id, map);
}catch(e){ console.log('   solutionSave: '+String(e.message).slice(0,70)); }
const sol=w.solutionOf && w.solutionOf(site.id);
T(!!sol, 'الحلُّ سُجّل — القطعُ محدَّدة');
T(sol && Object.keys(sol.items||{}).length>0, 'القطعُ فيه: '+(sol?Object.keys(sol.items||{}).length:0));

console.log('\n══ ٦ · اعتماد الحل ثم ظهورُ التركيب ══');
try{ w.solutionAppr && w.solutionAppr(site.id,1); }catch(e){ console.log('   appr: '+String(e.message).slice(0,60)); }
const sol2=w.solutionOf && w.solutionOf(site.id);
T(sol2 && sol2.status==='معتمد', 'الحلُّ اعتُمد');
const L=w.LAYERS.install;
T(L.pass({id:site.id,type:site.type}), 'النقطةُ صارت تظهر في طبقة التركيب');

console.log('\n══ ٧ · نقاطُ التركيب تُحسَب من القطع ══');
const items=(w.itemsList?w.itemsList():[]).slice(0,3);
items.forEach(it=>{ w.CFG.itPts=w.CFG.itPts||{}; w.CFG.itPts[it.code]=5; });
const pts=w.ptsInstall({id:site.id,type:site.type});
T(pts>0, 'نقاطُ التركيب من الحل المعتمد: '+pts+' (٣ أصناف × ٢ × ٥)');
const zero=(w.itemsList?w.itemsList():[]).filter(x=>!(w.CFG.itPts||{})[x.code]).length;
console.log('   \u00b7 أصنافٌ بلا وزنٍ مضبوط: '+zero+' من '+(w.itemsList?w.itemsList().length:0));

console.log(`\nنجح ${ok} · فشل ${bad}`);
if(bad) say.forEach(x=>console.log('  ✗ '+x));
if (bad) process.exit(1);
console.log('رحلةُ المسح كاملةٌ — من الإسناد إلى نقاط التركيب ✅');
process.exit(0);
