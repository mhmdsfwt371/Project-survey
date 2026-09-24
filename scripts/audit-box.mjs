/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الصندوق الأسود — node scripts/audit-box.mjs
   ───────────────────────────────────────────────────────────────────────────
   حلقةٌ مسقوفةٌ (مئةُ مدخلٍ، عشرون كيلوبايت)، منقّاةٌ (لا عربيَّ ولا جوالَ ولا
   بريد)، تُرفَق بالبلاغ في الكتابة نفسِها، وتُنسَخ نصًّا من الأدوات، ويقرؤها
   المهندسُ خطًّا زمنيًّا في شاشة البلاغات.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

console.log('\n══ ١ · التنقيةُ ══');
const red = w.boxRedact('خطأ عند حفظ مخيم شركة النور لسالم 0551234567 salem@x.com code=permission-denied NSK-MIN-CMP-0012');
T(!/[\u0600-\u06FF]/.test(red) && !/0551234567/.test(red) && !/salem@/.test(red) && /permission-denied/.test(red) && /NSK-MIN-CMP-0012/.test(red), 'لا عربيَّ ولا جوالَ ولا بريد — ويبقى الرمزُ والمعرِّف: ' + red);

console.log('\n══ ٢ · الحلقةُ والسقف ══');
w.BOX = { e:[] };
for (let i = 0; i < 130; i++) w.boxNote('pg', 'p' + i);
T(w.boxLoad().e.length === 100 && w.boxLoad().e[0].w === 'p30', 'مئةُ مدخلٍ لا أكثر — والأقدمُ يسقط');
w.boxNote('act', 'goto=sites'); w.boxNote('act', 'goto=sites');
T(w.boxLoad().e.filter(x => x.w === 'goto=sites').length === 1, 'ولا تكرارَ في الثانية نفسِها');
for (let i = 0; i < 100; i++) w.boxNote('err', 'E' + i + ':' + 'x'.repeat(70) + i);
const txt = w.boxText();
T(txt.length <= 20000 && /^nsk-box v1/.test(txt) && /\nver V17\./.test(txt), 'والنصُّ تحت عشرين كيلوبايت برأسٍ يقول النسخةَ والجهاز');
w.goPage('map');
T(w.boxLoad().e.some(x => x.k === 'pg' && x.w === 'map'), 'تنقّلُ الصفحات يُسجَّل');
w.softErr('flush', { code:'permission-denied' }, '');
T(w.boxLoad().e.some(x => x.k === 'err' && /flush:permission-denied/.test(x.w)), 'وأخطاءُ softErr برموزها');
w.idbTellBad(true, 'quota'); w.idbTellBad(false);
T(w.boxLoad().e.some(x => x.k === 'idb' && /bad:quota/.test(x.w)) && w.boxLoad().e.some(x => x.k === 'idb' && x.w === 'ok'), 'وحالُ المخزن');
w.BOX_T = 0; w.boxNote('pg', 'sites');
T(JSON.parse(w.localStorage.getItem('nsk14.box')).e.length >= 100, 'ويُحفَظ محليًّا مع حالة التطبيق');

console.log('\n══ ٣ · مع البلاغ في الكتابة نفسِها ══');
const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };
w.BUG_OPEN = true; w.BUG_KIND = 'عطل'; w.render(1); await wait(80);
d.getElementById('bgTxt').value = 'الشاشة لا تحفظ الزيارة بعد الضغط'; w.toast = () => {};
w.bugSend();
const bug = wrote.find(x => x[0] === 'bugs');
T(!!bug && typeof bug[2].box === 'string' && bug[2].box.length > 100 && bug[2].box.length <= 20000, 'البلاغُ يحمل الصندوقَ في الوثيقة نفسِها');
T(!/[\u0600-\u06FF]/.test(bug[2].box), 'ولا عربيَّ في الصندوق المرفَق');
T(wrote.filter(x => x[0] === 'bugs').length === 1, 'وكتابةٌ واحدةٌ لا اثنتان');

console.log('\n══ ٤ · النسخُ من الأدوات، والخطُّ الزمنيُّ للمهندس ══');
w.goPage('tools'); w.render(1); await wait(80);
T(!!d.querySelector('[data-boxcopy]'), 'زرُّ «نسخ التشخيص» في الأدوات');
let copied = ''; w.navigator.clipboard = { writeText: async s => { copied = s; } };
w.boxCopy(); await wait(30);
T(/^nsk-box v1/.test(copied), 'ويُنسَخ النصُّ نفسُه');
w.STATE.bugs = { b1: bug[2] }; w.goPage('sys'); w.render(1); await wait(60);
const tb = d.querySelector('[data-ptab="sys:bugs"]'); if (tb){ tb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); }
T(d.getElementById('content').innerHTML.includes('الخطُّ الزمنيُّ للجهاز') && d.getElementById('content').innerHTML.includes('nsk-box v1'), 'والمهندسُ يراه خطًّا زمنيًّا في البلاغ');
w.ROLE = 'tech'; w.STATE.meta.role = 'tech'; w.render(1); await wait(80);
T(!d.getElementById('content').innerHTML.includes('الخطُّ الزمنيُّ للجهاز'), 'ولا يراه الفنيّ');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الصندوق الأسود نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
