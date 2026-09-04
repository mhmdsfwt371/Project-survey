/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سجل الإسنادات وطلبات الورشة — node scripts/audit-registry.mjs
   ───────────────────────────────────────────────────────────────────────────
   لكلِّ نوعِ طلبٍ شريحتُه في سجلٍّ واحد: زيارةٌ وتركيبٌ وفكٌّ وصيانة —
   يُرشَّح ويُبحَث ويُعدَّل فيه المُسنَدُ إليه والموعدُ ويُحذَف. والحمايات:
   المنجَزُ لا يُحذَف ولا يُعدَّل (نقاطُ صاحبه بُنيت عليه)، والزيارةُ التي تمّت
   تُعتمَد أو تُردُّ ولا تُمحى، والفنيُّ لا يحذف. وطلبُ الورشة يُعدَّل صنفُه
   وكميتُه ما لم يُنفَّذ منه شيء، ولا تُنقَص كميتُه دون المنفَّذ، وجدولُه
   ستةُ أعمدةٍ فأقلَّ فتُبلَغ أزرارُه على الهاتف.
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
w.STATE.users=w.STATE.users||{};
w.STATE.users.a={name:'فني أ',user:'a',role:'tech',at:1};
w.STATE.users.b={name:'فني ب',user:'b',role:'tech',at:1};
const S=w.STATE.sites;
['visit','install','dis','maint'].forEach((k,i)=>{
  w.STATE.tasks['TK-'+k+'-'+S[i].id]={id:'TK-'+k+'-'+S[i].id,no:'X-000'+(i+1),site:S[i].id,kind:k,
    to:'فني أ',assignedTo:'فني أ',status:'مطلوب',when:w.dayKey(Date.now()),at:Date.now()};
});
w.statBump();
T(w.regList().length===4, 'السجلُّ يجمع الأنواعَ الأربعة');
w.goPage('reqreg'); w.render(1);
let h=d.getElementById('content');
T(w.CUR==='req' && w.PTAB.req==='reqreg', 'الشريحةُ تُفتَح داخل «الطلبات والتوزيع»');
T(d.querySelectorAll('[data-regk]').length>=5, 'شريحةٌ لكلِّ نوعٍ + كل الأنواع ('+d.querySelectorAll('[data-regk]').length+')');
click('[data-regk="dis"]');
T(w.REG_KIND==='dis' && (d.getElementById('content').textContent||'').indexOf(S[2].id)>-1, 'ترشيحُ نوع الفكِّ يعرضه وحدَه');
click('[data-regk=""]');
/* تعديل */
const tid='TK-visit-'+S[0].id;
click('[data-regedit="'+tid+'"]');
T(!!d.querySelector('[data-regto="'+tid+'"]'), 'زرُّ التعديل يفتح المُسنَدَ والموعد');
d.querySelector('[data-regto="'+tid+'"]').value='فني ب';
d.querySelector('[data-regwhen="'+tid+'"]').value='2026-12-01';
click('[data-regsave="'+tid+'"]');
T(w.STATE.tasks[tid].to==='فني ب' && w.STATE.tasks[tid].when==='2026-12-01', 'الحفظُ يغيّر المُسنَدَ والموعد');
T(w.STATE.queue.some(q=>q.kind==='tasks'&&q.id===tid), 'ويُرفَع');
/* حذف */
const did='TK-maint-'+S[3].id;
w.regDel(did);
T(!w.STATE.tasks[did], 'الحذفُ يمسح الإسنادَ غيرَ المنجَز');
/* الحمايات */
const iid='TK-install-'+S[1].id;
w.STATE.tasks[iid].status='معتمد';
w.regDel(iid); T(!!w.STATE.tasks[iid], 'المنجَزُ لا يُحذَف');
w.regSet(iid,{to:'فني ب'}); T(w.STATE.tasks[iid].to==='فني أ', 'والمنجَزُ لا يُعدَّل');
w.STATE.recs[S[0].id]={id:S[0].id,access:'تم الوصول',review:'pending',at:Date.now(),by:'فني ب',photos:[]};
w.statBump(); w.regDel(tid);
T(!!w.STATE.tasks[tid], 'زيارةٌ تمّت لا تُحذَف — تُعتمَد أو تُردّ');
w.ROLE='tech'; w.STATE.meta.role='tech';
w.regDel('TK-dis-'+S[2].id); T(!!w.STATE.tasks['TK-dis-'+S[2].id], 'الفنيُّ لا يحذف إسنادًا');
/* طلبُ الورشة: تعديلٌ وحذف */
w.ROLE='engineer'; w.STATE.meta.role='engineer';
const it=w.itemsList()[0], it2=w.itemsList()[1];
w.workReqAdd('prep', it.code, 10);
const wr=w.workReqList()[0];
T(!!wr && wr.qty===10, 'طلبُ ورشةٍ أُنشئ — '+wr.no);
w.workReqEdit(wr.id, it2.code, 12);
T(wr.qty===12 && wr.item===it2.code, 'يُعدَّل صنفُه وكميتُه');
w.workReqComplete(wr.id, 5);
w.workReqEdit(wr.id, it.code, 12);
T(wr.item===it2.code, 'وبعد تنفيذِ جزءٍ لا يُبدَّل صنفُه');
w.workReqEdit(wr.id, '', 3);
T(wr.qty===12, 'ولا تُنقَص كميتُه دون المنفَّذ');
w.goPage('wos'); w.render(1);
h=d.getElementById('content');
const cols=Math.max(0,...[...h.querySelectorAll('table tr')].map(r=>r.children.length));
T(cols<=6, 'جدولُ الورشة ستةُ أعمدةٍ فأقلّ — يُقرأ على الهاتف ('+cols+')');
/* الطلبُ الذي نُفِّذ جزءٌ منه لا يُحذَف — فيُنشأ طلبٌ نظيفٌ للفحص */
w.workReqAdd('asm', it.code, 4); w.render(1);
h=d.getElementById('content');
T(!!h.querySelector('[data-wredit]') && !!h.querySelector('[data-wrcancel]'), 'وفيه زرّا التعديل والحذف');
console.log(bad?'\nجردُ السجل فشل ✗ ('+bad+')':'\nكلُّ طلبٍ يُتابَع ويُعدَّل ويُحذَف في مكانه ✅');
process.exit(bad?1:0);
