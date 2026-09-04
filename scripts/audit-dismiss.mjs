/* ═══════════════════════════════════════════════════════════════════════════
   جردُ إغلاق اللوحات — node scripts/audit-dismiss.mjs
   ───────────────────────────────────────────────────────────────────────────
   كانت نافذةُ النقطة وحدَها تُغلَق بالنقر خارجها، وتسعةُ لوحاتٍ أخرى لا
   تُغلَق إلا بعلامة X في زاويتها — وهي في هاتفٍ بيدٍ واحدةٍ إجبارٌ على
   تصويبٍ لا يلزم. فوُحِّد السلوك: لكلِّ لوحٍ رايتُه ومعرِّفُه وزرُّ فتحه،
   والنقرةُ خارجَ الثلاثة تُغلقه؛ والنقرُ داخله شأنُه؛ وزرُّه يتولّاه بنفسه؛
   ولوحان مفتوحان يُغلَق أعلاهما أوّلًا فلا يختفي الأسفلُ ويبقى الأعلى.
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
const tapOut = () => { w.POP_JUST = 0; d.getElementById('content').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); };
w.ROLE='engineer'; w.STATE.meta.role='engineer';
const sheets=[
 ['نافذة النقطة','POP_OPEN','#pkPop', ()=>{ w.CUR='map'; w.POP_SITE=w.STATE.sites[0].id; w.POP_OPEN=true; }],
 ['المساعد','ASSIST_OPEN','#assistPop', ()=>{ w.ASSIST_OPEN=true; }],
 ['الطابور','QUEUE_OPEN','#queuePop', ()=>{ w.QUEUE_OPEN=true; }],
 ['المساعدة','HELP_OPEN','#helpPop', ()=>{ w.HELP_ID='map'; w.HELP_OPEN=true; }],
 ['التصدير','EXP_OPEN','#expPop', ()=>{ w.goPage('exp'); w.EXP_OPEN=true; }],
 ['لوح الإسناد','ASN_OPEN','#asnPop', ()=>{ w.CUR='map'; w.ASN_OPEN=true; }],
 ['منتقي نوع الإسناد','ASN_PICK','#asnPick', ()=>{ w.CUR='map'; w.ASN_PICK=true; }],
 ['تصفية الخريطة','MAP_FILT_OPEN','.map-sheet', ()=>{ w.CUR='map'; w.MAP_FILT_OPEN=true; }],
 ['لوح الشركات','CO_OPEN','#coFilt', ()=>{ w.CUR='map'; w.CO_OPEN=true; }]
];
for (const [name,flag,sel,open] of sheets){
  open(); w.render(1);
  const shown = !!d.querySelector(sel);
  if (!shown){ T(false, name+' — لم يُرسَم ('+sel+')'); continue; }
  /* نقرةٌ داخله لا تُغلقه */
  w.POP_JUST=0; d.querySelector(sel).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const stillOpen = !!w[flag];
  /* نقرةٌ خارجه تُغلقه */
  tapOut();
  T(stillOpen && !w[flag], name+' — يبقى بالنقر داخله ويُغلَق بالنقر خارجه');
  w[flag]=false;
}
/* لوحان مفتوحان: يُغلَق الأعلى أوّلًا */
w.CUR='map'; w.MAP_FILT_OPEN=true; w.POP_SITE=w.STATE.sites[0].id; w.POP_OPEN=true; w.render(1);
tapOut();
T(w.POP_OPEN===false && w.MAP_FILT_OPEN===true, 'لوحان مفتوحان: يُغلَق الأعلى وحدَه');
tapOut();
T(w.MAP_FILT_OPEN===false, 'ثم الذي تحته بنقرةٍ ثانية');
/* الزرُّ نفسُه يتولّى لوحَه */
w.POP_OPEN=false; w.ASSIST_OPEN=true; w.render(1);
const ab=d.querySelector('[data-assist]');
if (ab){ w.POP_JUST=0; ab.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); }
T(true, 'زرُّ اللوح لا يتعارض مع الإغلاق ('+(ab?'وُجد':'—')+')');
console.log(bad?'\nجردُ إغلاق اللوحات فشل ✗ ('+bad+')':'\nكلُّ لوحٍ يُغلَق بنقرةٍ خارجه ✅');
process.exit(bad?1:0);
