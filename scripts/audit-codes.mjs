/* ═══════════════════════════════════════════════════════════════════════════
   جردُ رموز الطلبات — node scripts/audit-codes.mjs
   ───────────────────────────────────────────────────────────────────────────
   الرموزُ تقول ما تعنيه بلغة الميدان: SR مسح · IR تركيب · MR صيانة ·
   UR فكّ · DR صرفُ أصناف · CR تهيئة · AR تجميع. وكانت DR للتركيب وPR
   للفكّ — فمن قرأ DR فهم «تسليمًا» وطلب الشيءَ باسم غيره. والعدّاداتُ
   تُنقَل عند الإقلاع فلا يُولَد رقمٌ بمعنيين. والصيانةُ صارت خيارًا في
   منتقي الإسناد على الخريطة: ليست طبقةً لأن نقاطَها نقاطُ التركيب، فتستعير
   طبقتَه ويُضبَط النوعُ صيانةً.
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
w.STATE.users=w.STATE.users||{}; w.STATE.users.t1={name:'فني أ',user:'t1',role:'tech',at:1};
/* الرموزُ بمعانيها */
const P=w.REQ_PREFIX;
T(P.visit==='SR' && P.install==='IR' && P.maint==='MR' && P.dis==='UR' && P.issue==='DR',
  'الرموز: SR مسح · IR تركيب · MR صيانة · UR فك · DR صرف');
T(P.prep==='CR' && P.asm==='AR', 'وCR تهيئة · AR تجميع');
T(Object.keys(w.REQSEQ).sort().join()===['SR','IR','UR','CR','AR','MR','DR'].sort().join(), 'والعدّاداتُ بالرموز نفسها');
/* الأرقامُ تُولَد بالرمز الصحيح */
const it=w.itemsList()[0];
w.workReqAdd('issue', it.code, 5, 'فني أ');
T(/^DR-\d{4}$/.test(w.workReqList()[0].no), 'طلبُ الصرف يُرقَّم DR — '+w.workReqList()[0].no);
w.workReqAdd('prep', it.code, 2, '');
T(/^CR-\d{4}$/.test(w.workReqList()[0].no), 'والتهيئة CR — '+w.workReqList()[0].no);
const S=w.STATE.sites;
w.STATE.recs[S[0].id]={id:S[0].id,access:'تم الوصول',review:'approved',at:Date.now(),by:'م',photos:[]};
w.STATE.inss[S[0].id]={id:S[0].id,solution:{status:'معتمد',items:{[it.code]:1}},at:Date.now()};
w.statBump();
w.SEL={}; w.SEL[S[0].id]=1; w.SEL_N=1; w.ASN_MODE='tech'; w.ASN_TO='فني أ'; w.ASN_KIND='install';
w.goPage('map'); w.render(1);
const kEl=d.getElementById('asnKind'); if(kEl) kEl.value='install';
w.asnCommit();
const tk=w.STATE.tasks['TK-install-'+S[0].id];
T(!!tk && /^IR-\d{4}$/.test(tk.no), 'إسنادُ التركيب يُرقَّم IR — '+(tk&&tk.no));
/* الصيانةُ في منتقي الخريطة */
w.ASN_PICK=true; w.goPage('map'); w.render(1);
const opts=[...d.querySelectorAll('[data-akind]')].map(b=>b.getAttribute('data-akind'));
T(opts.indexOf('maint')>-1, 'الصيانةُ خيارٌ في منتقي الإسناد — '+opts.join(','));
const txt=d.querySelector('#asnPick').textContent;
T(txt.indexOf('MR')>-1 && txt.indexOf('IR')>-1 && txt.indexOf('UR')>-1, 'والرموزُ ظاهرةٌ بجانب كلِّ نوع');
click('[data-akind="maint"]');
T(w.ASN_KIND==='maint' && w.FIELD_MODE==='install', 'اختيارُها يضبط النوعَ صيانةً ويفتح طبقةَ التركيب');
T(w.ASN_MODE==='team', 'وتُسنَد لفريق');
console.log(bad?'\nجردُ رموز الطلبات فشل ✗ ('+bad+')':'\nالرموزُ بمعانيها والصيانةُ تُسنَد من الخريطة ✅');
process.exit(bad?1:0);
