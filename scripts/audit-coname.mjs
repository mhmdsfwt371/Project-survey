/* ═══════════════════════════════════════════════════════════════════════════
   جردُ اسم الشركة بلغة الواجهة — node scripts/audit-coname.mjs
   ───────────────────────────────────────────────────────────────────────────
   أسماءُ الشركات عربيةٌ في القاعدة — وهي المفتاحُ الذي تُربَط به النقاطُ
   والمحاضرُ ودفترُ الجوالات، فلا تُبدَّل. وإنما يُبدَّل ما يُعرَض: بالعربية
   كما هو، وبالإنجليزية نقحرةً أو تصحيحًا يدويًّا من «أسماء العرض» — والأرديةُ
   تقرأ الإنجليزيَّ لا العربيَّ، فالقارئُ بالأردية لا يقرأ العربيةَ بالضرورة.
   ويُحرَس هنا ما لا يُرى: **قيمةُ المنتقي تبقى عربيةً** ونصُّه وحدَه يُترجَم —
   ولو تُرجمت القيمةُ لانفصلت كلُّ نقطةٍ عن شركتها. والبحثُ يطابق اللغتين.
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
const co = w.CO_LIST[0];
/* ١ · الاسمُ بلغة الواجهة */
w.LANG='ar'; T(w.coName(co)===co, 'بالعربية: الاسمُ كما هو');
w.LANG='en'; const en=w.coName(co);
T(en!==co && !/[\u0600-\u06FF]/.test(en), 'بالإنجليزية: نقحرةٌ بلا حرفٍ عربي', en.slice(0,44));
w.LANG='ur'; T(w.coName(co)===en, 'وبالأردية: الإنجليزيُّ نفسُه — لا العربيّ');
/* ٢ · التصحيحُ اليدويُّ يغلب */
w.CFG.nameEn = w.CFG.nameEn || {}; w.CFG.nameEn[co]='Quraish Ltd';
w.LANG='en'; T(w.coName(co)==='Quraish Ltd', 'التصحيحُ من «أسماء العرض» يغلب النقحرة');
w.LANG='ur'; T(w.coName(co)==='Quraish Ltd', 'والأرديةُ تقرؤه كذلك');
delete w.CFG.nameEn[co];
/* ٣ · القيمةُ المخزَّنةُ تبقى عربيةً — وإلا انفصلت النقطةُ عن شركتها */
w.LANG='en'; w.ROLE='engineer'; w.STATE.meta.role='engineer';
w.goPage('newsite'); w.NS_CO_OPEN=true; w.render(1);
const btn=d.querySelector('[data-nscopick]');
T(!!btn && /[\u0600-\u06FF]/.test(btn.getAttribute('data-nscopick')), 'قيمةُ المنتقي عربيةٌ (المفتاح)');
T(!!btn && !/[\u0600-\u06FF]/.test(btn.textContent), 'ونصُّه إنجليزيّ', (btn&&btn.textContent||'').trim().slice(0,40));
/* ٤ · البحثُ يطابق اللغتين */
T(w.coHit(co, co.slice(0,6)), 'البحثُ بالعربية يجد');
T(w.coHit(co, en.slice(0,5).toLowerCase()), 'والبحثُ بالإنجليزية يجد الشركةَ نفسَها');
/* ٥ · اللوحة */
w.LANG='ar'; w.goPage('co'); w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('على أكثرَ من مخيّم')>-1 && h.indexOf('أسماءٌ مركَّبةٌ لم تُوحَّد')>-1, 'لوحةُ الشركات بست بطاقات');
T(h.indexOf('الأكثرُ مخيّمات')>-1, 'وجدولُ الأكثر مخيّمات');
const D=w.coDash();
T(D.served>0 && D.multi>0 && D.sites>0, 'الأرقامُ محسوبةٌ بعد الفكّ', 'لها مخيّمات '+D.served+' · على أكثر من مخيّم '+D.multi+' · مركّبة '+D.cmp);
console.log(bad?'\nجردُ اسم الشركة فشل ✗ ('+bad+')':'\nالاسمُ بلغة الواجهة والقيمةُ عربيةٌ لا تُبدَّل ✅');
process.exit(bad?1:0);
