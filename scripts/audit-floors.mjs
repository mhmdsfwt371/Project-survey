import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الأدوار وكاميرات الوزارة — node scripts/audit-floors.mjs
   ───────────────────────────────────────────────────────────────────────────
   منشأةُ الجمرات أرضيٌّ وأربعةُ أدوار: لكلِّ نقطةٍ دورُها (من حقلها أو اسمها)، وصفُّ أدوارٍ
   في التصفية يعرض دورًا واحدًا. وكاميراتُ الوزارة من تقرير ٢٠٢٦ بعددها ونوعها وحالة ربطها —
   بلا عناوين شبكةٍ ولا كلماتِ مرور — والمعرّفاتُ القائمةُ وزياراتُها لا تُمَسّ.
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
w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1400); w.toast = () => {};
const S = w.STATE.sites;

console.log('\n══ ١ · كاميراتُ الوزارة: القائمةُ لا تُمسّ، والجديدةُ بأدوارها ══');
const cams = S.filter(x => /^NSK-MIN-CAM-00\d\d$/.test(x.id));
T(cams.length === 59 && cams.every(x => w.CAM_INFO[x.id]), 'التسعُ والخمسون القائمةُ بمعرّفاتها — ولكلٍّ عددُ كاميراتٍ ونوعٌ وحالةُ ربط');
const jc = S.filter(x => /^NSK-JMR-CAM-00\d\d$/.test(x.id));
T(jc.length === 20 && jc.filter(x => w.siteFloor(x) != null).length === 17 && jc.every(x => /CAM \d+/.test(x.name)), 'كاميراتُ الجمرات عشرون نقطةً — لكلِّ كاميرا نقطتُها برقمها في الإكسل: خمسَ عشرةَ بأدوارها، واثنتان خلفيّتان في الثالث، وثلاثةُ أعمدةٍ مجاورة (V23.3)');
T(jc.reduce((n, x) => n + w.CAM_INFO[x.id][0], 0) === 20, 'وفيها العشرون كاميرا التي في التقرير');
T(!/10\.24\.\d+\.\d+|EVC123456/.test(html), 'ولا عنوانَ شبكةٍ ولا كلمةَ مرورٍ من التقرير في التطبيق');
w.STATE.recs['NSK-MIN-CAM-0016'] = { id:'NSK-MIN-CAM-0016', at:Date.now(), access:'تم الوصول', review:'pending' };
w.loadSites(); w.statBump();
T(!!w.STATE.recs['NSK-MIN-CAM-0016'] && w.siteFind('NSK-MIN-CAM-0016') && w.lifeOf(w.siteFind('NSK-MIN-CAM-0016')) !== 'todo', 'الزيارةُ القائمةُ تبقى على نقطتها بعد إعادة بناء السجلّ');

console.log('\n══ ٢ · الأدوار ══');
const jm = S.filter(x => /^NSK-JMR-PNT/.test(x.id));
const fl = {}; jm.forEach(x => { const f = w.siteFloor(x); fl[f] = (fl[f] || 0) + 1; });
T(jm.length === 28 && Object.keys(fl).filter(k => k !== 'null').length === 5, 'نقاطُ أفاقي في الجمرات تعرف أدوارَها الخمسة من أسمائها: ' + JSON.stringify(fl));
w.goPage('sites'); w.render(1); await wait(60);
const chips = [...d.querySelectorAll('#content [data-ffl]')];
T(chips.length === 6 && /كل الأدوار/.test(chips[0].textContent), 'صفُّ الأدوار في التصفية: «كل الأدوار» وخمسةُ أدوار');
d.querySelector('#content [data-ffl="2"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const shown = S.filter(w.filtPass);
T(w.FILT.floor === '2' && shown.length > 0 && shown.every(x => w.siteFloor(x) === 2), 'اختيارُ «الدور الثاني» يعرض الدورَ الثاني وحدَه: ' + shown.length);
d.querySelector('#content [data-ffl=""]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(40);
T(w.FILT.floor === '' && !w.filtOn(), 'و«كل الأدوار» يرفعه');

console.log('\n══ ٣ · النافذة ══');
w.goPage('map'); w.render(1); await wait(60);
w.popOpenAt('NSK-JMR-CAM-0003', null); await wait(60);
const pk = d.getElementById('pkPop').textContent;
T(/الدور الثاني/.test(pk) && /الكاميرات/.test(pk) && /حالة الربط/.test(pk) && /تقريبيٌّ داخل الدور/.test(pk), 'نافذةُ كاميرا الدور الثاني: دورُها وعددُ كاميراتها وحالةُ ربطها وأن موقعَها تقريبيٌّ داخل الدور');
w.popOpenAt('NSK-MIN-CAM-0012', null); await wait(60);
T(/يلزم استبدالُ الهوائي/.test(d.getElementById('pkPop').textContent), 'وكاميرا منى تقول حالةَ ربطها من التقرير بالعربية');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ الأدوار وكاميرات الوزارة نظيف \u2705'); process.exit(0);
