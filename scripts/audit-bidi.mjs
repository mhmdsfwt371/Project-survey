/* ═══════════════════════════════════════════════════════════════════════════
   جردُ عزل النص ثنائيِّ الاتجاه — node scripts/audit-bidi.mjs
   ───────────────────────────────────────────────────────────────────────────
   معرِّفٌ لاتينيٌّ أو شاخصٌ مختلطٌ داخل جملةٍ عربيةٍ يُعزَل للعرض: <bdi> في
   الشاشات، وFSI…PDI في نصوص واتساب. والبياناتُ المخزونةُ والتصديرُ تبقى نظيفة.
   يُفحَص بمواقعَ ثابتةٍ تحمل كلَّ أنواع الرموز.
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const FSI = '\u2068', PDI = '\u2069';

console.log('\n══ ١ · المساعدان ══');
T(w.bdi('NSK-MIN-RDR-0018') === '<bdi>NSK-MIN-RDR-0018</bdi>' && w.bdi('<x>') === '<bdi>&lt;x&gt;</bdi>', 'bdi يعزل ويهرّب');
const mixed = w.bdiText('مخيم 12B/B04 على 10.0.0.5 نسخة V17.98 بمستخدم m.ali');
T(mixed.includes('<bdi>12B&#47;B04</bdi>') && mixed.includes('<bdi>10.0.0.5</bdi>') && mixed.includes('<bdi>V17.98</bdi>') && mixed.includes('<bdi>m.ali</bdi>'), 'bdiText يعزل الشاخصَ والعنوانَ والنسخةَ واسمَ المستخدم داخل الجملة');
T(w.bdiText('مخيم ٢٥ و 25') === 'مخيم ٢٥ و 25', 'ولا يعزل رقمًا مجرّدًا — فلا ضوضاء');
T(w.fsi('NSK-1') === FSI + 'NSK-1' + PDI && w.fsiText('الشركة ABC-12') === 'الشركة ' + FSI + 'ABC-12' + PDI, 'وfsi/fsiText بعلامتَي FSI…PDI للنصِّ الصريح');

console.log('\n══ ٢ · الشاشاتُ الرئيسة ══');
const x = w.STATE.sites.find(s => s.type === 'مخيم'); x.sign = '12B/B04'; x.name = 'مخيم شركة ABC-7';
w.goPage('map'); w.render(1); await wait(120); w.popOpenAt(x.id, null); await wait(150);
const pop = [...d.querySelectorAll('.pop-head')].find(e => e.innerHTML.includes('data-pop="0"')) || d.querySelector('.pop-head');
T(!!pop && pop.innerHTML.includes('<bdi>' + x.id + '</bdi>') && pop.innerHTML.includes('<bdi>ABC-7</bdi>'), 'نافذةُ النقطة تعزل المعرِّفَ والرمزَ داخل الاسم' + (pop && !pop.innerHTML.includes('<bdi>ABC-7</bdi>') ? ' — ' + pop.innerHTML.replace(/<[^>]+>/g, '|').slice(0, 120) : ''));
w.POP_OPEN = false; w.DETAIL_ID = x.id; w.CUR = 'site'; w.render(1); await wait(100);
T(d.getElementById('content').innerHTML.includes('<bdi>' + x.id + '</bdi>'), 'وصفحةُ تفاصيل الموقع كذلك');
const now = Date.now(); w.STATE.recs[x.id] = { id:x.id, at:now, by:'أحمد', access:'تم الوصول', chals:['عائق إنشائي'] };
w.goPage('survey'); w.render(1); await wait(60); const tb = d.querySelector('[data-ptab="survey:chalm"]'); if (tb){ tb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); }
T(d.getElementById('content').innerHTML.includes('<bdi>' + x.id + '</bdi>'), 'وجداولُ الميدان تعزل المعرِّف');

console.log('\n══ ٣ · رسائلُ واتساب بالنصِّ الصريح ══');
const row = { uid:'u', name:'سالم', ph:'0500000000', asn:{ survey:[x.id], install:[], dis:[] }, open:1, wt:0 };
const msg = w.briefingText(row);
T(msg.includes('\u2022 ' + FSI + x.id + PDI), 'بلاغُ اليوم يعزل معرِّفَ النقطة بـFSI…PDI');
T(!/<bdi>/.test(msg), 'ولا وسمَ HTML في نصٍّ صريح');
const wa = w.waText('plan', 'شركة ABC-7', '');
T(wa.includes(FSI + 'ABC-7' + PDI), 'ورسالةُ الشركة تعزل رمزَها');

console.log('\n══ ٤ · التصديرُ نظيف ══');
const rows = w.exportsRows ? w.exportsRows() : null;
const csv = typeof w.csvText === 'function' ? w.csvText() : (typeof w.sitesCsv === 'function' ? w.sitesCsv() : '');
const anyExport = JSON.stringify(w.STATE.sites.slice(0, 50)) + JSON.stringify(w.STATE.recs) + csv;
T(!anyExport.includes(FSI) && !anyExport.includes(PDI) && !anyExport.includes('<bdi>'), 'البياناتُ المخزونةُ ونصُّ التصدير بلا علامات عزل');
const src = html;
T(!/CORE\.(set|dirty)\([^)]*\b(bdi|fsi)\(/.test(src) && !/xlsSheets\([^)]*\b(bdi|fsi)\(/.test(src), 'ولا يمرُّ عزلٌ إلى كتابةٍ أو إكسل في الشيفرة');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ عزل النص نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
