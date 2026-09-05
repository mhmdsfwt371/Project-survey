/* ═══════════════════════════════════════════════════════════════════════════
   جردُ بدء الموسم — node scripts/audit-seed.mjs
   ───────────────────────────────────────────────────────────────────────────
   المبدأُ أن لا قيمةَ افتراضيةً صامتة: كلُّ وزنٍ وتارجتٍ يبدأ صفرًا ويُضبط
   بيد المهندس. لكنَّ الصفرَ لا يُعطي بدايةً — فمن يفتح النظامَ أوّلَ مرةٍ
   يجد أربعةَ عشرَ حقلًا خاليًا ولا يدري بأيِّها يبدأ. فصار زرٌّ يكتب
   **مقترحًا** مبنيًّا على البيانات نفسِها: عددُ النقاط وأنواعُها وأيامُ
   الموسم — والوزنُ بالجهد لا بالعدد. ولا يُكتَب إلا الحقلُ الفارغ: ما ضُبط
   بيدٍ لا يُمَسّ. وسقفُ الميزانية لا يُقترَح — رقمٌ تعاقديٌّ لا يُخمَّن.
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
/* البطاقةُ تظهر حين تكون الحقولُ صفرًا */
w.goPage('mywork'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('ابدأ الموسم بمقترح')>-1, 'بطاقةُ البدء تظهر والحقولُ صفر');
const P=w.seedPlan();
T(P.wRows.length>0 && P.tgtSurvey>0, 'المقترحُ مبنيٌّ على البيانات', P.wRows.length+' صنفًا · تارجت '+P.tgtSurvey);
T(P.wRows.some(r=>/ممرات/.test(r.k) && r.w===2) && P.wRows.some(r=>/مخيمات/.test(r.k) && r.w===1),
  'والوزنُ بالجهد: الممرُّ ضعفُ المخيّم');
/* ما ضُبط بيدٍ لا يُمَسّ */
const key=P.wRows[0].k;
w.cfgSet('w', key, 9); w.cfgSet('warranty', null, 24);
const n=w.seedApply();
T(w.cfgGet('w', key)===9 && w.cfgGet('warranty')===24, 'ما ضُبط بيدك لا يُمَسّ');
T(n>10, 'وكُتب الباقي', n+' حقلًا');
T(w.cfgGet('tgtSurvey')>0 && w.cfgGet('dueSurvey')>0 && w.cfgGet('insCamp')===5 && w.cfgGet('insCor')===8,
  'التارجتُ والمواعيدُ ونقاطُ التركيب');
T(w.cfgGet('reservePct')===10 && w.cfgGet('days')===26, 'والاحتياطيُّ وأيامُ العمل');
T(!w.cfgGet('budCap'), 'وسقفُ الميزانية لا يُقترَح — رقمٌ تعاقديّ');
/* الأثرُ الحقيقيُّ: النقاطُ صارت تُحتسَب */
const x=w.STATE.sites[0];
T(w.ptsSurvey(x)>0, 'وبعدها تُحتسَب نقطةُ الزيارة', String(w.ptsSurvey(x)));
T(w.mileDateOf(w.MILES[1])!=='', 'ومواعيدُ المعالم تُشتقّ');
/* البطاقةُ تختفي */
w.goPage('mywork'); w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('ابدأ الموسم بمقترح')<0, 'والبطاقةُ تختفي بعد الكتابة');
const rdy=w.readyRows().filter(r=>!r.ok).map(r=>r.t);
T(rdy.length<=5, 'وجاهزيةُ الموسم انخفضت إلى ما يبقى للإنسان', rdy.join(' · '));
/* الحماية */
w.ROLE='tech'; w.STATE.meta.role='tech';
const before=w.cfgGet('tgtSurvey'); w.cfgSet('tgtSurvey',null,0); w.seedApply();
T(!w.cfgGet('tgtSurvey'), 'الفنيُّ لا يكتب المقترح');
console.log(bad?'\nجردُ بدء الموسم فشل ✗ ('+bad+')':'\nالمقترحُ يُكتَب ولا يُفرَض ✅');
process.exit(bad?1:0);
