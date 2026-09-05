/* ═══════════════════════════════════════════════════════════════════════════
   جردُ جاهزية الموسم — node scripts/audit-ready.mjs
   ───────────────────────────────────────────────────────────────────────────
   النظامُ كاملٌ والإعداداتُ صفر. أوزانُ الزيارة صفرٌ فلا نقطةَ تُحتسَب لأحد،
   والتارجتاتُ صفرٌ فلا وتيرةَ تُقاس، والمواعيدُ صفرٌ فلا تأخّرَ يُعرَف،
   والميزانيةُ صفرٌ فلا قيمةَ مكتسبة. وكلٌّ منها يعطّل حسابًا في **صمت**:
   الشاشةُ تعمل وتعرض صفرًا فيُظنُّ أن العملَ لم يبدأ. فصارت بطاقةٌ تقول ما
   ينقص بترتيب الأثر، ولكلِّ سطرٍ سببُه وزرٌّ يذهب إلى موضع ضبطه — ويختفي
   السطرُ فورَ ضبطه. ولا يراها من لا يملك الضبط.
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
w.ROLE='engineer'; w.STATE.meta.role='engineer';
const R0=w.readyRows(), miss0=R0.filter(r=>!r.ok);
T(R0.length>=10, 'بنودُ الجاهزية إحدى عشرة', R0.length+' بند');
T(miss0.length>0, 'وتقول ما ينقص اليوم', miss0.map(r=>r.t).join(' · '));
T(R0.every(r=>r.why && r.p), 'ولكلِّ بندٍ سببُه وموضعُ ضبطه');
w.goPage('mywork'); w.render(1);
let h=d.getElementById('content').textContent;
T(h.indexOf('جاهزيةُ الموسم')>-1, 'البطاقةُ أوّلَ «مهامي» للمهندس');
T(!!d.querySelector('#content [data-p="pts"]'), 'وزرُّ الذهاب إلى موضع الضبط');
w.goPage('hb'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('جاهزيةُ الموسم')>-1, 'وفي «صحة النظام»');
/* الضبطُ يُخفي السطر */
w.CFG.w = { 'منى|مخيم': 5 };
T(w.readyRows().filter(r=>r.t==='أوزانُ الزيارة')[0].ok, 'ضبطُ الأوزان يُرضي بندَه');
w.cfgSet('tgtSurvey', null, 50);
T(w.readyRows().filter(r=>/تارجت/.test(r.t))[0].ok, 'وضبطُ التارجت كذلك');
/* الفنيُّ لا يراها */
w.ROLE='tech'; w.STATE.meta.role='tech';
w.goPage('mywork'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('جاهزيةُ الموسم')<0, 'ولا يراها من لا يضبط');
console.log(bad?'\nجردُ الجاهزية فشل ✗ ('+bad+')':'\nما ينقص يُقال قبل أن يبدأ الموسم ✅');
process.exit(bad?1:0);
