import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ طبقة مسار التفويج — node scripts/audit-tafweej.mjs
   ───────────────────────────────────────────────────────────────────────────
   ملفّاتُ الطبقة موجودةٌ وصالحة (حدودٌ وخمسةُ أدوارٍ ومخيماتٌ بأدوارها)، وتُحمَّل عند الطلب من
   صفِّ «مسار التفويج» في تصفية الخريطة، وبطاقةُ الدور تقول بيانات الوزارة ونقاطَنا على مساره،
   ونافذةُ المخيم تقول دورَه، والمخارجُ على بداية خطِّ العودة لا حول المداخل.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const D = JSON.parse(readFileSync('layers/tafweej.json', 'utf8'));
T(D.floors.length === 5 && D.bounds.length === 2 && [0,1,2,3,4].every(f => existsSync('layers/tafweej-' + f + '.png')), 'الطبقةُ: خمسةُ أدوارٍ بصورها وحدودُها');
T(Object.keys(D.assign).length > 300 && D.floors.every(f => f.len > 0 && f.width === 13), 'ولكلِّ مخيمٍ مطابَقٍ دورُه، ولكلِّ دورٍ بياناتُ الوزارة');
T(readFileSync('sw.js', 'utf8').includes("'/layers/'"), 'وعاملُ الخدمة يخزّنها عند أوّل تحميل');
const html = readFileSync('index.html', 'utf8'); const wait = ms => new Promise(r => setTimeout(r, ms));
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
let fetched = 0; w.fetch = (u) => { if (/tafweej\.json/.test(u)){ fetched++; return Promise.resolve({ ok:true, json:() => Promise.resolve(D) }); } return Promise.reject(new Error('no')); };
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1400); w.toast = () => {};
w.goPage('map'); w.FLT_OPEN = true; w.render(1); await wait(60);
const html2 = w.catBar(false);
T(/مسار التفويج/.test(html2) && (html2.match(/data-tfw=/g) || []).length === 2 && /data-tfw="show"/.test(html2) && /data-ffl=/.test(html2) && /كل الأدوار/.test(html2), 'في تصفية الخريطة صفُّ «مسار التفويج»: إخفاءٌ وإظهار — والدورُ من صفِّ الأدوار الواحد (V26.5)');
T(fetched === 0 && !w.TFW.data, 'ولا تُحمَّل الطبقةُ قبل أن تُطلَب');
const box = d.createElement('div'); box.innerHTML = html2; d.body.appendChild(box);
box.querySelector('[data-tfw="show"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(fetched === 1 && w.TFW.f === w.TFW_ALL && !!w.TFW.data, '«إظهار» يحمّلها مرةً واحدة على كلِّ الأدوار');
box.innerHTML = w.catBar(false); box.querySelector('[data-ffl="1"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(fetched === 1 && w.TFW.f === 1 && String(w.FILT.floor) === '1', 'واختيارُ «الدور الأول» من صفِّ الأدوار الواحد يحكم المسارَ والنقاطَ معًا (V26.5)');
box.querySelector('[data-ffl="1"]') && w.FILT && (w.FILT.floor = '');
const card = w.tfwRow();
T(/مخيمًا من مخيماتنا/.test(card) && /١٠٬٥٥٠|10,550|١٠٥٥٠/.test(card) && /مدخل الجمرات غير المغطّى/.test(card) && /نقاطُنا على مسار هذا الدور/.test(card), 'وبطاقتُه: مخيماتُه وطولُ مساره وملاحظةُ الوزارة ومقترحُها ونقاطُنا عليه');
const camp = Object.keys(D.assign).find(k => D.assign[k] === 3 && w.siteFind(k));
w.popOpenAt(camp, null); await wait(60);
T(/مسار التفويج/.test(d.getElementById('pkPop').textContent) && /الدور الثالث/.test(d.getElementById('pkPop').textContent), 'ونافذةُ مخيمٍ من مخيمات الدور الثالث تقول دورَه');
const e1 = w.siteFind('NSK-JMR-PNT-0018'), n1 = w.siteFind('NSK-JMR-PNT-0005');
const dm = Math.hypot((e1.lat - n1.lat) * 111320, (e1.lng - n1.lng) * 103500);
T(e1 && n1 && dm > 150, 'ومخرجُ الدور الأول على بداية خطِّ العودة — لا حول مدخله (' + Math.round(dm) + ' م)');
/* (V24.5) مسارُ المخيم: من شبكة دوره على الشوارع — ذهابٌ من المخيم إلى المنشأة وعودةٌ من مخرج دوره إليه */
w.TFW.routes = JSON.parse(readFileSync('layers/tafweej-routes.json', 'utf8'));
const cid = Object.keys(D.assign).find(k => D.assign[k] === 3 && w.siteFind(k));
const rr = w.tfwCampCalc(cid), s0 = w.siteFind(cid);
T(rr && rr.f === 3 && rr.go.len > 150 && rr.back.len > 150 && rr.go.pts.length > 3 && rr.back.pts.length > 3, 'مسارُ المخيم: ذهابٌ وعودةٌ على شبكة دوره (' + (rr ? rr.go.len + ' / ' + rr.back.len + ' م' : '—') + ')');
T(rr && rr.go.pts[0][0] === s0.lat && rr.back.pts[rr.back.pts.length - 1][1] === s0.lng && w.tfwM(rr.go.pts[rr.go.pts.length - 1], w.TFW_JIN) < 700, 'يبدأ الذهابُ من المخيم وينتهي عند المنشأة، وتنتهي العودةُ عنده');
w.popOpenAt(cid, null); await wait(60);
T(!!d.querySelector('#pkPop [data-tfwcamp]'), 'وفي نافذة المخيم زرُّ «اعرض مسار المخيم»');
console.log('\n══ المساراتُ مبنيةٌ من مخيمات الوزارة إلى مداخل دورها بلا لفات (V25.6) ══');
{ const RT = JSON.parse(readFileSync('layers/tafweej-routes.json', 'utf8')), PL = JSON.parse(readFileSync('layers/tafweej-plan.json', 'utf8')), rawH = readFileSync('index.html', 'utf8');
  T(RT.v >= 3 && /أقصرُ طريقٍ/.test(RT.note) && existsSync('scripts/tafweej-routes-build.mjs') && PL.v === 2, 'ملفُ المسارات من المولّد (والأرضيُّ من خطِّ المخطّط بقرار المالك — V27.9)، وخطوطُ المخطّط محفوظةٌ دليلًا');
  T(/plan-v2/.test(String(RT.floors['0'].src || '')) && RT.floors['0'].go.length > 30, 'الأرضيُّ: الذهابُ خطُّ مخطّط الوزارة المطابَقُ على الشوارع ومعه ما لاصقه من الأحمر (V27.9)');
  T(['0', '1', '2', '3', '4'].every(f => RT.floors[f] && RT.floors[f].go.length && RT.floors[f].back.length && RT.floors[f].go.every(pl => pl.length >= 2)), 'ولكلِّ دورٍ ذهابٌ وعودةٌ على الشوارع');
  const mtr = (a, b) => { const r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(a[0] * r), y = (b[0] - a[0]) * r; return 6371000 * Math.sqrt(x * x + y * y); };
  const en = f => (RT.ends.en[f] || []).map(n => { const m = rawH.match(new RegExp('\\["NSK-JMR-PNT-' + n + '","[^"]*",\\d+,\\d+,\\d+,([0-9.]+),([0-9.]+)')); return m ? [+m[1], +m[2]] : null; }).filter(Boolean);
  const touches = ['0', '1', '3', '4'].every(f => { const E = en(f); return E.length && RT.floors[f].go.some(pl => E.some(e => mtr(pl[pl.length - 1], e) <= 90 || mtr(pl[0], e) <= 90)); });
  T(touches, 'وشبكةُ الذهاب في كلِّ دورٍ تصل مداخلَه');
  T(Array.isArray(RT.floors['4'].train) && RT.floors['4'].train.length >= 1 && RT.floors['4'].train.reduce((s, pl) => s + pl.length, 0) >= 20 && /R\.train \|\| \[\]/.test(rawH) && /fl\.train \|\| \[\]/.test(rawH), 'والدورُ الرابع بالقطار: خطُّ قطار المشاعر في الملف يُرسَم ويدخل شبكةَ مسار المخيم (V26.0)');
  T(Array.isArray(RT.maybe) && RT.maybe.length > 0 && RT.maybe.length < 60 && RT.maybe.every(m => m.lat > 21.3 && m.lng > 39.8 && m.floor >= 0 && m.floor <= 4) && /احتمال مخيم/.test(rawH) && /TFW\.routes\.maybe \|\| \[\]/.test(rawH), 'ونقاطُ «احتمال مخيم» (' + RT.maybe.length + ') حيث انتهى المخطّطُ بلا مخيمٍ — تُرسَم مع دورها ولا تُعَدّ'); }
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ طبقة مسار التفويج نظيف \u2705'); process.exit(0);
