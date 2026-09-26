/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مفتاح التحدي الواحد — node scripts/audit-chal.mjs
   ───────────────────────────────────────────────────────────────────────────
   صيغتا «لا يوجد سطح تثبيت» (مخيمٌ وممر) تُعدّان تحديًا واحدًا في كلِّ موضع:
   صفحةِ التحديات، ولوحةِ المسح، وشاشةِ الوزارة، ولقطتِها — والمخزونُ لا يُمَسّ،
   والنماذجُ بصيغها. وبطاقةُ «أخرى» تعدُّ النصوصَ الحرّةَ مطبَّعةً للمهندس وحدَه.
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
w.localStorage.setItem('nsk14.tour.x', '1');
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return d.getElementById('content'); };

console.log('\n══ ١ · المفتاح ══');
const A = 'لا يوجد سطح تثبيت — يحتاج هيكلًا جديدًا', B = 'لا يوجد سطح تثبيت — يحتاج عمودًا أو هيكلًا جديدًا';
T(w.CH_CAMP.includes(A) && w.CH_PATH.includes(B), 'الصيغتان باقيتان في النموذجين كما هما');
T(w.chalKey(A) === 'لا يوجد سطح تثبيت' && w.chalKey(B) === 'لا يوجد سطح تثبيت' && w.chalKey('لا يوجد سطح تثبيت مناسب') === 'لا يوجد سطح تثبيت', 'وتُعدّان بمفتاحٍ واحد — وصيغةٌ قديمةٌ كذلك');
T(w.chalKey('أخرى — اذكرها في وصف التحدي') === 'أخرى' && w.chalKey('ارتفاع صعب الوصول') === 'ارتفاع صعب الوصول', 'و«أخرى» مفتاحُها أخرى، وغيرُها كما هو');
T(JSON.stringify(w.chalKeys([A, B, 'لا توجد تحديات', A])) === JSON.stringify(['لا يوجد سطح تثبيت']), 'والقائمةُ تُطوى بلا تكرارٍ وبلا «لا توجد تحديات»');

console.log('\n══ ٢ · العدُّ واحدٌ في كلِّ موضع ══');
const now = Date.now(), camps = w.STATE.sites.filter(x => x.type === 'مخيم').slice(0, 30), paths = w.STATE.sites.filter(x => x.type !== 'مخيم').slice(0, 20);
w.STATE.recs = {};
camps.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: now - i * 36e5, by:'أحمد', access:'تم الوصول', chals:[A], chal_note:'' }; });
paths.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: now - i * 36e5, by:'أحمد', access:'تم الوصول', chals:[B, 'أخرى — اذكرها في وصف التحدي'], chal_note: i % 2 ? 'المخيم  مقفول بالحديد' : 'المخيم مقفول بالحديد ' }; });
w.STATE.recs[camps[0].id].chals = [A, 'ارتفاع صعب الوصول'];
const rows = w.svdRows(); const byCh = {}; rows.forEach(o => o.ch.forEach(c => { byCh[c] = (byCh[c] || 0) + 1; }));
T(byCh['لا يوجد سطح تثبيت'] === 50 && byCh[A] === undefined && byCh[B] === undefined, 'لوحةُ المسح: الصيغتان مفتاحٌ واحد = ٣٠ + ٢٠ = ' + byCh['لا يوجد سطح تثبيت']);
T(byCh['أخرى'] === 20 && byCh['ارتفاع صعب الوصول'] === 1, 'و«أخرى» ٢٠ والارتفاعُ ١');
await open('mfu', 'kiosk'); await wait(1300);
const kk = d.getElementById('content').textContent;
T(/لا يوجد سطح تثبيت/.test(kk) && !/يحتاج هيكلًا جديدًا/.test(kk) && !/يحتاج عمودًا/.test(kk), 'وشاشةُ الوزارة تعرض المفتاحَ الواحد لا الصيغتين');
const ch = await open('survey', 'chalm');
T(/لا يوجد سطح تثبيت/.test(ch.textContent) && (ch.innerHTML.match(/يحتاج هيكلًا جديدًا/g) || []).length === 0, 'وصفحةُ التحديات كذلك');
const oc = ch.textContent, oi = oc.indexOf('ما كُتب تحت «أخرى»');
T(oi > -1 && /المخيم مقفول بالحديد/.test(oc.slice(oi, oi + 400)) && /٢٠/.test(oc.slice(oi, oi + 400)), 'وبطاقةُ «أخرى» تعدُّ النصَّ الحرَّ مطبَّعًا: المسافاتُ الزائدةُ لا تفرّقه (٢٠)' + (oi > -1 ? ' — ' + JSON.stringify(oc.slice(oi, oi + 200)) : ' — لا بطاقة'));
w.ROLE = 'supervisor'; w.STATE.meta.role = 'supervisor'; const ch2 = await open('survey', 'chalm');
T(/التحدي/.test(ch2.textContent) && !/ما كُتب تحت «أخرى»/.test(ch2.textContent), 'وهي للمهندس فمن فوقه وحدَهم');
T(w.STATE.recs[camps[0].id].chals[0] === A, 'والمخزونُ في الوثائق لم يُمَسّ');
const rep = readFileSync('scripts/ministry-report.mjs', 'utf8');
T(/w\.svdRows\(\)\.forEach\(o => o\.ch\.forEach/.test(rep), 'ولقطةُ الوزارة تعدُّ من المصدر نفسِه (svdRows) فتتّحد معه');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ مفتاح التحدي نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
