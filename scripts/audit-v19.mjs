/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تنظيم النسخة ١٩ — node scripts/audit-v19.mjs
   ───────────────────────────────────────────────────────────────────────────
   ١) الوزنُ واحدٌ بأيِّ لغة: جهازٌ بالإنجليزية يحسب النقاطَ نفسَها، ويكتب الوزنَ
      بالمفتاح العربيِّ الخام. ٢) قوائمُ الأدوار بلا تكرارٍ ولا صفحةٍ مجهولة.
   ٣) البحثُ في القائمة يصل الشرائحَ ويفتحها. ٤) «كيف يُحسب المستحقّ» بقيمها
      الحالية ومثالٍ محسوب. ٥) الصفحاتُ غيرُ المفتوحة في ثلاثين يومًا تُسمّى.
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
await wait(1500); w.toast = () => {}; w.cfgPushSoon = () => {};

console.log('\n══ ١ · الوزنُ واحدٌ بأيِّ لغة ══');
const camp = w.STATE.sites.find(x => x.zone === 'منى' && x.type === 'مخيم');
w.CFG.w = { 'منى|مخيمات': 2 };
const ar = w.ptsSurvey(camp);
w.LANG = 'en';
T(w.catLabel(camp) !== 'مخيمات', 'بالإنجليزية يُقرأ التصنيفُ «' + w.catLabel(camp) + '»');
T(ar === 2 && w.ptsSurvey(camp) === 2, 'والنقاطُ هي هي: ٢ بالعربية و٢ بالإنجليزية (كانت صفرًا)');
w.cfgSet('w', 'منى|' + w.catLabel(camp), 5);
T(w.CFG.w['منى|مخيمات'] === 5 && !Object.keys(w.CFG.w).some(k => /Camp/i.test(k)), 'والكتابةُ بالإنجليزية تقع على المفتاح العربيِّ الخام');
w.LANG = 'ar';

console.log('\n══ ٢ · قوائمُ الأدوار ══');
const known = new Set([...Object.keys(w.PAGE || {}), ...Object.keys(w.FIELD_PAGES || {}), ...Object.keys(w.TABS || {})]);
Object.values(w.TABS || {}).forEach(L => L.forEach(tb => known.add(tb[0])));
const bad = [];
for (const [r, R] of Object.entries(w.ROLES)){ if (!Array.isArray(R.nav)) continue;
  const dup = R.nav.filter((x, i) => R.nav.indexOf(x) !== i), unk = R.nav.filter(x => !known.has(x));
  if (dup.length || unk.length) bad.push(r + ':' + dup.concat(unk).join(',')); }
T(!bad.length, 'لا تكرارَ ولا صفحةَ مجهولةً في قائمة أيِّ دور' + (bad.length ? ' — ' + bad.join(' · ') : ''));

console.log('\n══ ٣ · البحثُ يصل الشرائح ══');
w.render(1); await wait(80);
const q = d.getElementById('navQ'); q.value = 'يوميات'; q.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(50);
const hit = d.querySelector('#nav a[data-navtab="diary"]');
T(!!hit && hit.getAttribute('data-p') === 'exec', '«يوميات» تجد شريحةَ يوميات المشروع تحت التقارير التنفيذية');
hit.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120);
T(w.CUR === 'exec' && w.tabCur('exec') === 'diary' && /يوميات المشروع/.test(d.getElementById('content').textContent), 'والضغطُ يفتح الشريحةَ مباشرة' + ' — CUR=' + w.CUR + ' PTAB=' + (w.PTAB && w.PTAB.exec));
const q2 = d.getElementById('navQ'); q2.value = 'ي'; q2.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(40);
T(!d.querySelector('#nav a[data-navtab]'), 'وحرفٌ واحدٌ لا يُغرق القائمةَ بالشرائح');
q2.value = ''; q2.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(40);
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer'; w.render(1); await wait(60);
const q3 = d.getElementById('navQ'); q3.value = 'المالي'; q3.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(40);
T(!d.querySelector('#nav a[data-navtab="budm"]'), 'والبحثُ لا يُظهر شريحةً لا يراها الدور (الملخّصُ المالي للوزارة)');
q3.value = ''; q3.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(40);
w.ROLE = 'admin'; w.STATE.meta.role = 'admin';

console.log('\n══ ٤ · كيف يُحسب المستحقّ ══');
const now = Date.now(); w.CFG.ph = 1; w.CFG.otRate = 1; w.CFG.tgtSurvey = 3500; w.CFG.w = { 'منى|مخيمات': 2, 'منى|ممرات': 3 };
w.STATE.sites.filter(x => x.zone === 'منى' && x.type === 'مخيم').slice(0, 10).forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: now - i * 36e5, by:'أحمد', access:'تم الوصول', review:'approved' }; });
w.statBump();
w.goPage('perf'); w.render(1); await wait(200);
const c = d.getElementById('content').textContent;
T(/كيف يُحسب المستحقّ/.test(c) && /المستحقّ = نقاطُ الأعمال المعتمدة × سعرُ النقطة/.test(c) && /بلا إضافي/.test(c), 'البطاقةُ تقول المعادلةَ — وبلا إضافي حين المعاملُ ١');
T(/أحمد/.test(c.slice(c.indexOf('كيف يُحسب'), c.indexOf('كيف يُحسب') + 1500)) && /٢٠ نقطة × ١ = ٢٠/.test(c), 'ومثالٌ محسوبٌ على أعلى عضو: ٢٠ نقطة × ١ = ٢٠');
T(!!d.querySelector('[data-goto="pts"]') && !!d.querySelector('[data-goto="consts"]'), 'وأين يُضبَط كلُّ رقم');

console.log('\n══ ٥ · الصفحاتُ غيرُ المفتوحة ══');
const dK = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const days = {}; for (let i = 1; i <= 8; i++) days[dK(i)] = { map:3, sites:1 };
w.USAGE.v = { days }; w.USAGE.at = Date.now();
const uc = w.usageCard();
T(/صفحاتٌ لم تُفتَح في ثلاثين يومًا/.test(uc) && !/الخريطة ·/.test(uc.slice(uc.indexOf('لم تُفتَح'))), 'تُسمّى الصفحاتُ التي لم تُفتَح — والمفتوحةُ ليست منها');
w.USAGE.v = { days:{ [dK(1)]:{ map:1 } } };
T(!/لم تُفتَح في ثلاثين/.test(w.usageCard()), 'ولا حكمَ قبل أسبوعٍ من البيانات');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ تنظيم النسخة ١٩ نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
