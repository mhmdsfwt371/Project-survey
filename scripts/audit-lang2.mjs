/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تزامن اللغة — node scripts/audit-lang2.mjs
   ───────────────────────────────────────────────────────────────────────────
   اللغةُ تُغيَّر من ثلاثة مواضع: أزرارُ شاشة الدخول، والحرفُ في الشريط
   العلويِّ بقائمته، والمنسدلةُ في أسفل القائمة الجانبية. وكانت كلُّ أداةٍ
   تعرض ما اختير منها هي وحدها: من غيّر من فوق وجد المنسدلةَ تقول العربية.
   فصارت كلُّها تُزامَن من موضعٍ واحد (langSync) — ومعها الاتجاهُ والسمةُ
   ونصوصُ الهيكل.
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
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
const click=s2=>{const b=d.querySelector(s2); if(!b) return false; b.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return true;};
/* قبل الدخول: أزرارُ شاشة الدخول */
T(!!d.querySelector('#lgLangs [data-l]'), 'شاشةُ الدخول فيها مبدّلُ لغة');
click('#lgLangs [data-l="en"]');
T(w.LANG==='en' && d.querySelector('#lgLangs [data-l="en"]').classList.contains('on'), 'التغييرُ من شاشة الدخول يُعلَّم فيها');
click('#lgLangs [data-l="ar"]');
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));
const sel = d.getElementById('langSel'), top = d.getElementById('langTop');
T(!!sel && !!top, 'المبدّلان موجودان: المنسدلةُ والحرفُ العلويّ');
/* من فوق → المنسدلةُ تتبع */
click('[data-langmenu]');
T(!d.getElementById('langMenu').hidden, 'قائمةُ اللغات تُفتَح من الشريط العلوي');
click('[data-setlang="en"]');
T(w.LANG==='en', 'اللغةُ تغيّرت من فوق');
T(sel.value==='en', 'والمنسدلةُ في القائمة تقول English');
T(top.textContent.trim()==='EN', 'والحرفُ العلويُّ EN');
T(d.documentElement.dir==='ltr' && d.body.getAttribute('data-lang')==='en', 'والاتجاهُ والسمةُ تبعا');
/* من المنسدلة → الحرفُ العلويُّ وعلامةُ القائمة تتبعان */
sel.value='ur'; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
T(w.LANG==='ur' && top.textContent.trim()==='اُر', 'التغييرُ من المنسدلة يُغيّر الحرفَ العلويّ');
click('[data-langmenu]');
const on = [...d.querySelectorAll('[data-setlang]')].filter(b=>b.getAttribute('aria-current')==='true').map(b=>b.getAttribute('data-setlang'));
T(on.length===1 && on[0]==='ur', 'وعلامةُ الاختيار في القائمة على الأردية — '+on);
T(d.documentElement.dir==='rtl' && d.documentElement.lang==='ur', 'والاتجاهُ عاد للعربيِّ الاتجاه');
/* الترجمةُ فعلًا سرت في الشل */
sel.value='en'; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
const outTxt=(d.getElementById('outBtn')||{}).textContent||'';
T(!/[\u0600-\u06FF]/.test(outTxt) && outTxt.length>2, 'نصُّ الشل تُرجم فعلًا — «'+outTxt.trim()+'»');
sel.value='ar'; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
T(/[\u0600-\u06FF]/.test((d.getElementById('outBtn')||{}).textContent||''), 'والرجوعُ للعربية يُعيده');
console.log(bad?'\nجردُ تزامن اللغة فشل ✗ ('+bad+')':'\nاللغةُ تتفق في مواضعها الثلاثة ✅');
process.exit(bad?1:0);
