/* ═══════════════════════════════════════════════════════════════════════════
   جردُ طلب الصرف — node scripts/audit-issue.mjs
   ───────────────────────────────────────────────────────────────────────────
   صرفُ القطع من المستودع كان سطرًا يُكتَب في دفتر الحركة مباشرةً: لا رقمَ له
   ولا مُسنَدَ إليه ولا حالةَ تُتابَع. صار نوعًا ثالثًا في طلبات الورشة —
   «صرف أصناف (DR)» — بترقيمه ومُسنَدٍ إليه فنيٍّ أو مشرف؛ وحين يُنفَّذ
   يُقيَّد «صرف» في دفتر الحركة **باسم المُسنَد إليه** لا باسم من ضغط الزر،
   فتدخل القطعُ عهدتَه هو. ولا يُقبَل صرفٌ بلا من يُصرَف له.
   ويتحقّق الجردُ كذلك من بقايا `TECHS` الفارغة بعد توحيد مصدر الأشخاص:
   منتقي المنفِّذ في دفتر الحركة كان فارغًا لأنه يقرأ البذرةَ المحذوفة.
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
w.STATE.users.t1={name:'فني التركيب',user:'t1',role:'tech',at:1};
w.STATE.users.s1={name:'مشرف الميدان',user:'s1',role:'supervisor',at:1};
/* بقايا TECHS */
T(w.techNames().length>=2, 'techNames تقرأ من الحسابات ('+w.techNames().length+')');
w.goPage('invmv'); w.render(1);
const mvBy=d.getElementById('mvBy');
T(mvBy && mvBy.options.length>=3, 'منتقي المنفِّذ في دفتر الحركة مملوء ('+(mvBy?mvBy.options.length:0)+')');
/* طلبُ الصرف */
w.goPage('wos'); w.render(1);
const kindSel=d.getElementById('wrKind');
T(kindSel && [...kindSel.options].some(o=>o.value==='issue'), 'نوعُ «صرف أصناف (DR)» في المنتقي');
T(!!d.getElementById('wrTo'), 'حقلُ «يُصرَف له» موجود');
const it=w.itemsList()[0];
kindSel.value='issue'; d.getElementById('wrItem').value=it.code;
d.getElementById('wrQty').value='6'; d.getElementById('wrTo').value='فني التركيب';
click('[data-wradd]');
const r=w.workReqList()[0];
T(!!r && /^DR-\d{4}$/.test(r.no), 'الطلبُ برقم DR (Delivery Request) — '+(r&&r.no));
T(r.kind==='issue' && r.to==='فني التركيب' && r.qty===6, 'بنوعه ومُسنَدِه وكميته');
T(w.STATE.queue.some(q=>q.kind==='workReqs'&&q.id===r.id), 'ويُرفَع');
/* بلا مُسنَدٍ يُرفَض */
const n0=w.workReqList().length;
w.workReqAdd('issue', it.code, 3, '');
T(w.workReqList().length===n0, 'صرفٌ بلا «يُصرَف له» يُرفَض');
/* التنفيذُ يقيّد صرفًا باسم المُسنَد إليه */
const mv0=(w.STATE.moves||[]).length;
w.workReqComplete(r.id, 6);
const mv=w.STATE.moves[w.STATE.moves.length-1];
T(w.STATE.moves.length===mv0+1 && mv.kind==='صرف', 'التنفيذُ يقيّد حركةَ «صرف»');
T(mv.by==='فني التركيب' && mv.req===r.no, 'باسم المُسنَد إليه لا باسم من نفّذ — '+mv.by);
T(r.status==='تم', 'والطلبُ اكتمل');
/* التهيئةُ تبقى كما هي */
w.workReqAdd('prep', it.code, 4, '');
const r2=w.workReqList()[0];
T(/^CR-\d{4}$/.test(r2.no), 'التهيئةُ ما زالت CR — '+r2.no);
w.workReqComplete(r2.id, 4);
T(w.STATE.moves[w.STATE.moves.length-1].kind==='تهيئة', 'وتُقيَّد «تهيئة»');
/* الجدول */
w.render(1);
T((d.getElementById('content').textContent||'').indexOf('فني التركيب')>-1, 'المُسنَدُ إليه يظهر في جدول الطلبات');
console.log(bad?'\nجردُ طلب الصرف فشل ✗ ('+bad+')':'\nطلبُ الصرف يعمل ويدخل عهدةَ صاحبه ✅');
process.exit(bad?1:0);
