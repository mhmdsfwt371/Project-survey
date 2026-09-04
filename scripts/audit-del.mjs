/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التصحيح والحذف — node scripts/audit-del.mjs
   ───────────────────────────────────────────────────────────────────────────
   ما يُضاف يُصحَّح ويُحذَف. كان حادثُ السلامة يُسجَّل ولا يُمَسّ: من كتب
   «يومين مفقودين» وتبيّن أنها ثلاثةٌ لم يجد أين يصحّح، ومن سجّل حادثًا
   بالخطأ أبقاه في سجلٍّ يُعرَض على الوزارة — والأيامُ المفقودةُ تدخل مؤشِّرَ
   السلامة، فخطأٌ فيها خطأٌ في الرقم المعلَن. صار يُعدَّل ويُحذَف ويُعاد
   حسابُ المجموع من السجل لا من عدّادٍ يُزاد ويُنسى. والخطرُ المسجَّلُ بالخطأ
   يُحذَف — والمغلقُ يبقى شاهدًا. وكلاهما فعلُ مهندسٍ لا فعلُ من سجّل.
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
/* الحوادث */
w.goPage('hse'); w.render(1);
d.getElementById('hseWhy').value='سقوط أداة — أُعيد التثبيت';
d.getElementById('hseLost').value='2';
click('[data-hseadd]');
T(w.HSE.incidents.length===1 && w.HSE.lost===2, 'حادثٌ سُجِّل — الأيامُ المفقودة ٢');
w.hseSet(0,{lost:3});
T(w.HSE.incidents[0].lost===3 && w.HSE.lost===3, 'التعديلُ يصحّح الأيامَ ويُعاد حسابُ المجموع');
w.goPage('hse'); w.render(1);
T(!!d.querySelector('[data-hsel]') && !!d.querySelector('[data-hsedel]'), 'الحقلُ وزرُّ الحذف في الجدول');
w.hseDel(0);
T(w.HSE.incidents.length===0 && w.HSE.lost===0, 'الحذفُ يمسح ويُعيد المجموعَ صفرًا');
/* المخاطر */
w.goPage('risks'); w.render(1);
const n0=w.risksList().length;
d.getElementById('rkT').value='خطرُ اختبار الحذف';
click('[data-rkadd]');
const rid=w.risksList()[n0].id;
T(w.risksList().length===n0+1, 'خطرٌ سُجِّل');
w.render(1);
T(!!d.querySelector('[data-rkdel="'+rid+'"]'), 'زرُّ حذف الخطر في الجدول');
w.riskDel(rid);
T(w.risksList().length===n0, 'الخطرُ المفتوحُ يُحذَف');
const open0=w.risksList().filter(r=>r.st!=='مغلق')[0];
w.riskSet(open0.id,{st:'مغلق'}); w.riskDel(open0.id);
T(w.risksList().some(r=>r.id===open0.id), 'والمغلقُ يبقى شاهدًا — لا يُحذَف');
/* الحمايات */
w.ROLE='tech'; w.STATE.meta.role='tech';
w.HSE.incidents.push({kind:'x',site:'',lost:1,why:'y',by:'z',at:Date.now()}); w.hseRecount();
w.hseDel(0); T(w.HSE.incidents.length===1, 'الفنيُّ لا يحذف حادثًا');
w.hseSet(0,{lost:9}); T(w.HSE.incidents[0].lost===1, 'ولا يعدّله');
console.log(bad?'\nجردُ التصحيح والحذف فشل ✗ ('+bad+')':'\nما يُضاف يُصحَّح ويُحذَف ✅');
process.exit(bad?1:0);
