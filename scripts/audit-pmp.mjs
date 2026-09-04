/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مبادئ إدارة المشروع — node scripts/audit-pmp.mjs
   ───────────────────────────────────────────────────────────────────────────
   سجلُّ المخاطر يحيا: يُضاف إليه ويُغلَق ويُرفَع، ومؤشراتُه تُحسَب من البيانات
   لا تُكتَب. وصندوقُ قرارات المهندس يجمع ما ينتظره من ثماني شاشاتٍ ويقفز
   إليه، ولا يراه من لا يقرّر. والوزارةُ ترى المعالمَ وعدمَ المطابقة قراءةً —
   بلا زرِّ كتابةٍ يتسرّب. وما وُجد يومَ كُتب هذا: بطاقةُ فتح البلاغ وزرُّ إغلاقه
   كانا بلا حراسةٍ لأن الشريحةَ لم تكن تُرى لغير المكتب.
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
/* المخاطر حيّة */
const n0=w.risksList().length;
w.goPage('risks'); w.render(1);
d.getElementById('rkT').value='انقطاع الإنترنت في منى'; d.getElementById('rkP').value='4'; d.getElementById('rkI').value='4';
click('[data-rkadd]');
T(w.risksList().length===n0+1, 'خطرٌ جديدٌ يُضاف إلى السجلّ');
T(w.STATE.queue.some(q=>q.kind==='cfg'&&q.id==='risks'), 'ويُرفَع إلى settings/risks');
const rid=w.risksList()[n0].id;
w.riskSet(rid,{st:'مغلق'});
T(w.risksList()[n0].st==='مغلق' && !!w.risksList()[n0].closedAt, 'ويُغلَق بتاريخ');
const sig=w.riskSignals();
T(Array.isArray(sig)&&sig.length>=1, 'مؤشراتُ الخطر تُحسَب ('+sig.length+') — '+sig[0][1]);
const txt=d.getElementById('content').textContent;
T(txt.indexOf('مؤشرات خطرٍ حيّة')>-1, 'وتُعرَض في الشريحة');
/* صندوق القرارات */
const s0=w.STATE.sites[0];
w.STATE.recs[s0.id]={id:s0.id,access:'تم الوصول',review:'pending',at:Date.now(),by:'مشرف',photos:[]}; w.statBump();
const ib=w.inboxItems();
T(ib.length===8 && ib[0][1]>=1, 'صندوقُ القرارات يعدُّ الزيارةَ المنتظرة ('+ib[0][1]+')');
w.goPage('mywork'); w.render(1);
T(d.getElementById('content').textContent.indexOf('قراراتُك اليوم')>-1, 'يظهر أوّلَ «مهامي» للمهندس');
T(!!d.querySelector('#content [data-p="svappr"]'), 'وفيه زرُّ قفزٍ إلى اعتماد الزيارات');
w.goPage('now'); w.render(1);
T(d.getElementById('content').textContent.indexOf('قراراتُك اليوم')>-1, 'ويظهر في «أمس · الآن · غدًا»');
/* الفنيّ لا يراه ولا يعدّل المخاطر */
w.ROLE='tech'; w.STATE.meta.role='tech';
w.goPage('now'); w.render(1);
T(d.getElementById('content').textContent.indexOf('قراراتُك اليوم')<0, 'الفنيُّ لا يرى صندوقَ القرارات');
w.riskSet(rid,{st:'مفتوح'}); T(w.risksList()[n0].st==='مغلق', 'الفنيُّ لا يعدّل المخاطر');
/* الوزارة ترى المعالم والجودة قراءةً */
w.ROLE='viewer'; w.STATE.meta.role='viewer';
T(w.seesPage('miles') && w.seesPage('ncr'), 'الوزارةُ ترى المعالمَ وعدمَ المطابقة');
w.goPage('miles'); w.render(1);
const mh=d.getElementById('content');
T((mh.textContent||'').indexOf('المعالم')>-1 && !mh.querySelector('[data-baseset]'), 'المعالمُ تُقرأ بلا زرِّ ضبط');
w.goPage('ncr'); w.render(1);
T(!d.querySelector('#content [data-ncradd], #content [data-ncrclose]'), 'عدمُ المطابقة يُقرأ بلا أزرار كتابة');
console.log(bad?'\nجردُ مبادئ الإدارة فشل ✗ ('+bad+')':'\nجردُ مبادئ إدارة المشروع نظيف ✅');
process.exit(bad?1:0);
