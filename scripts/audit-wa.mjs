/* ═══════════════════════════════════════════════════════════════════════════
   جردُ إشعار الشركات — node scripts/audit-wa.mjs
   ───────────────────────────────────────────────────────────────────────────
   جوالُ المنسّق كان حقلًا فارغًا يُكتَب كلَّ مرة: فيُخطئ حرفًا أو يُرسل لغير
   صاحبها. صار الرقمُ صفةً للشركة تُحفَظ مرةً وتُرفَع (settings/cotel)
   ويحميها القاعدةُ — أرقامُ الناس لا تُقرأ لكلِّ دور. ومنه زرٌّ يفتح محادثتَها
   بنصٍّ يُبنى من حالتها نفسِها: تركيبٌ قادم، أو تسليمٌ حُرِّر محضرُه، أو فكٌّ
   مجدول — بأعدادِ نقاطها وما رُكِّب وما سُلِّم، فلا يُكتَب رقمٌ باليد ولا
   يُرسَل ما يخالف السجل. وشركةٌ بلا جوالٍ لا يُفتَح لها شيءٌ ويُقال لماذا.
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
const opened=[]; w.open = (u)=>{ opened.push(u); return null; };
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
const co = w.STATE.sites.filter(x=>x.co)[0].co;
/* الدفتر */
T(w.coTelOf(co)==='', 'لا جوالَ محفوظًا في البدء');
w.coTelSet(co, '0551234567');
T(w.coTelOf(co)==='0551234567', 'الجوالُ يُحفَظ على الشركة');
T(w.STATE.queue.some(q=>q.kind==='cfg'&&q.id==='cotel'), 'ويُرفَع إلى settings/cotel');
T(w.waLink('0551234567','x').indexOf('wa.me/966551234567')>-1, 'صفرُ البداية يصير ٩٦٦ — '+w.waLink('0551234567','x').slice(0,32));
/* النصوصُ الثلاثة تُبنى من الحالة */
const L = w.STATE.sites.filter(x=>x.co===co).slice(0,3), it=w.itemsList()[0];
L.forEach(x=>{ w.STATE.inss[x.id]={id:x.id,status:'مُركّب',approved:true,at:Date.now(),by:'فريق',parts:{[it.code]:1},serials:{}}; });
w.statBump(); w.handSave(L[0].id,'م. أحمد — الوزارة','');
const st=w.coStat(co);
T(st.ins===3 && st.hd===1, 'حالةُ الشركة تُحسَب — مُركّب '+st.ins+' · سُلِّم '+st.hd);
const th=w.waText('hand',co,'2026-09-10');
T(th.indexOf(co)>-1 && th.indexOf('3')>-1 && th.indexOf('محضرُ التسليم')>-1, 'نصُّ التسليم يحمل اسمَها وأعدادَها');
T(w.waText('plan',co,'').indexOf('سيباشر تركيبَ')>-1, 'ونصُّ التركيب القادم يختلف');
T(w.waText('dis',co,'').indexOf('فكَّ الأجهزة')>-1, 'ونصُّ الفكِّ يختلف');
/* الأزرار */
w.goPage('conote'); w.render(1);
const h=d.getElementById('content');
T(!!h.querySelector('[data-cotel]'), 'حقلُ الجوال في جدول الشركات');
T(h.querySelectorAll('[data-wasend]').length>=3, 'ثلاثةُ أزرارِ إشعارٍ لكلِّ شركةٍ لها جوال');
click('[data-wasend^="hand|"]');
T(opened.length===1 && opened[0].indexOf('wa.me/966551234567')>-1 && decodeURIComponent(opened[0]).indexOf('محضرُ التسليم')>-1,
  'الضغطُ يفتح واتساب على رقمها بنصِّ التسليم');
/* بلا جوالٍ لا يُرسَل */
const co2 = w.STATE.sites.filter(x=>x.co && x.co!==co)[0].co;
opened.length=0; w.waGo(co2,'plan','',0);
T(opened.length===0, 'شركةٌ بلا جوالٍ لا يُفتَح لها شيءٌ — ويُقال لماذا');
/* من محضر التسليم */
w.goPage('hand'); w.render(1);
const selCo=d.getElementById('hoDocCo'); if(selCo){ selCo.value=co; }
click('[data-hodoc="co"]');
T(!!d.querySelector('#content [data-wasend^="hand|"]'), 'زرُّ الإشعار على محضر الشركة نفسِه');
/* الحماية */
w.ROLE='tech'; w.STATE.meta.role='tech';
w.coTelSet(co,'0500000000');
T(w.coTelOf(co)==='0551234567', 'الفنيُّ لا يعدّل دفترَ الجوالات');
console.log(bad?'\nجردُ إشعار الشركات فشل ✗ ('+bad+')':'\nجردُ إشعار الشركات نظيف ✅');
process.exit(bad?1:0);
