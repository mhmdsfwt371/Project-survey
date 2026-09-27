import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ البحث تحت التصفية — node scripts/audit-search.mjs
   ───────────────────────────────────────────────────────────────────────────
   «بحثتُ عن 0016 فقال لا نتائج» والنقطةُ موجودة: تصفيةُ نوعٍ باقيةٌ من قبل أخفتها.
   صارت الرسالةُ تقول إن النتائجَ خارج التصفية وكم هي، وزرٌّ يبحث في الكلّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1400); w.toast = () => {};
w.goPage('sites'); w.FILT.type = 'ممر'; w.render(1); await wait(60);   /* تصفيةُ نوعٍ باقيةٌ لا تشمل الكاميرا — كتصفية LPR في بلاغ المكتب */
const ask = async q => { d.getElementById('siteQ').value = q; d.querySelector('#content [data-sq]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80); };
await ask('CAM-0016');
const c = () => d.getElementById('content');
T(/لا نتائج لـ«CAM-0016»/.test(c().textContent) && /ضمن التصفية الحالية/.test(c().textContent) && !!c().querySelector('[data-sqall]'), 'تصفيةُ نوعٍ تُخفي CAM-0016: الرسالةُ تقول إن النتائجَ خارج التصفية ومعها «ابحث في الكل»');
c().querySelector('[data-sqall]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
T(!w.FILT.type && d.getElementById('siteQ').value === 'CAM-0016' && /NSK-MIN-CAM-0016/.test(c().textContent), 'والزرُّ يرفع التصفيةَ ويُبقي الكلمة — فتظهر النقطة');
await ask('zzzz-nothing');
T(/لا نتائج/.test(c().textContent) && !c().querySelector('[data-sqall]'), 'وبحثٌ لا نتيجةَ له أصلًا لا يَعِد بشيء');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ البحث تحت التصفية نظيف \u2705'); process.exit(0);
