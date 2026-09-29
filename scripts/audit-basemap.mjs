/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خريطة المشاعر بلا شبكة — node scripts/audit-basemap.mjs
   ───────────────────────────────────────────────────────────────────────────
   التنزيلُ من فتح الخريطة وحدَه لا من شاشةٍ أخرى، والحجمُ تحت ثلاثين ميجابايت إن
   وُجد الملف، والإسنادُ في خيارات الطبقة ولا يُذكَر المصدرُ في نصوص الواجهة،
   والعارضُ مضمَّنٌ بنسخٍ مثبَّتةٍ ورخصٍ لا من شبكةٍ عامة ويُقرأ الملفُّ مقاطعَ
   (FileSource)، وطبقةُ أساسٍ واحدةٌ مع القمر، وبلا الملفِّ يبقى كلُّ شيءٍ كما كان
   (عودةٌ إلى الشبكة)، والوصفةُ موثَّقة. (V24.9) — ومع الشبكة خلفيةُ V24.8 وخريطةُ الجهاز للانقطاع وحدَه (V25.0)
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص بعد فصله (V21.6) */
import { readFileSync, existsSync, statSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');

console.log('\n══ ١ · الملفُّ والعارضُ والوصفة ══');
const man = JSON.parse(readFileSync('maps/manifest.json', 'utf8'));
if (existsSync('maps/mashaer.pmtiles')){ const sz = statSync('maps/mashaer.pmtiles').size; T(sz <= 30 * 1024 * 1024 && man.bytes === sz, 'الملفُّ موجودٌ تحت ٣٠ م.ب وبيانُه صادق: ' + (sz / 1048576).toFixed(1) + ' م.ب'); }
else T(man.bytes === 0, 'لا ملفَّ بعدُ — والبيانُ يقول ذلك (bytes = 0) فتقول البطاقةُ «لم تُبنَ»');
T(existsSync('vendor/protomaps/pmtiles-4.5.0.js') && existsSync('vendor/protomaps/protomaps-leaflet-5.1.0.js') && existsSync('vendor/protomaps/LICENSE-protomaps-leaflet') && /BSD-3-Clause/.test(readFileSync('vendor/protomaps/VERSIONS', 'utf8')), 'العارضُ مضمَّنٌ بنسخٍ مثبَّتةٍ ورخصٍ (٥٫١٫٠ — مخطّطُ الإصدار ٤)');
T(html.includes("one('vendor/protomaps/pmtiles-4.5.0.js')") && html.includes("one('vendor/protomaps/protomaps-leaflet-5.1.0.js')") && !/pmtiles-3\.0\.7|protomaps-leaflet-4\.0\.1/.test(html), 'والتطبيقُ يحمّل النسختين نفسيهما لا القديمتين');
T(!/cdn\.jsdelivr|unpkg\.com|protomaps\.com\/.*\.js/.test(html), 'ولا يُحمَّل من شبكةٍ عامة');
T(/\/vendor\/protomaps\//.test(readFileSync('sw.js', 'utf8')), 'وعاملُ الخدمة يخزّنه عند أوّل طلب');
const rec = readFileSync('docs/maps/README.md', 'utf8');
T(/pmtiles extract/.test(rec) && /--bbox=39\.70,21\.30,40\.05,21\.56/.test(rec) && /30/.test(rec) && /FileSource/.test(rec), 'والوصفةُ: الأداةُ والنطاقُ والحدُّ وطريقةُ القراءة');
T(Array.isArray(man.bounds) && man.bounds.join(',') === '38.95,21.25,40.1,24.7' && /tile-join/.test(man.tool || ''), 'والبيانُ يحمل نطاقَ الممرِّ: مكة والمدينة وطريق الهجرة (V25.2)');
{ const hb = readFileSync('maps/mashaer.pmtiles'); const b4 = [102, 106, 110, 114].map(o => hb.readInt32LE(o) / 1e7);
  T(hb.slice(0, 7).toString() === 'PMTiles' && b4.join(',') === '38.95,21.25,40.1,24.7', 'وترويسةُ الملفِّ نفسِه بالنطاق نفسِه — لا «العالمَ كلَّه» فلا بلاطاتٌ فارغةٌ خارجه: ' + b4.join(',')); }
T(/function basemapStale\(\)/.test(html) && /basemapStale\(\)\.then\(function\(st\)\{ if \(st && basemapNetOk\(\)\) basemapDownload\(\); \}\);/.test(html), 'والمحفوظُ الأقدمُ يُستبدَل بالجديد على اتصالٍ جيدٍ ويبقى عاملًا حتى يتمّ (V25.2)');
{ const P = JSON.parse(readFileSync('layers/poi.json', 'utf8')); const inB = p => p.lng >= 38.9 && p.lng <= 40.2 && p.lat >= 21.2 && p.lat <= 24.8;
  T(P.ministry && P.ministry.name === 'مباني الوزارة' && P.ministry.items.length >= 2 && P.tafweej && P.tafweej.name === 'أماكن التفويج' && P.tafweej.items.length >= 10, 'طبقتا الخريطة: مباني الوزارة (' + P.ministry.items.length + ') وأماكن التفويج (' + P.tafweej.items.length + ')');
  T([...P.ministry.items, ...P.tafweej.items].every(p => p.name && !/[A-Za-z]/.test(p.name) && inB(p)), 'وأسماؤها عربيةٌ ومواضعُها داخل النطاق'); }
T(/data-poil="ministry"/.test(html) && /data-poil="tafweej"/.test(html) && /closest\('\[data-poil\]'\)/.test(html) && !/POIL[^;\n]{0,80}STATE\./.test(html), 'وزرّاها في «تصفية» ولها معالج — خريطةٌ فقط لا تمسّ نقاطَ المسح ولا العدّادات');
T(/BASEMAP_MAX = 30 \* 1024 \* 1024/.test(html) && /b\.size > BASEMAP_MAX/.test(html), 'والتطبيقُ يرفض ملفًّا فوق الحدّ');

const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(w){
  w.__fetches = []; w.__cache = new Map();
  w.fetch = async (u, o) => { w.__fetches.push(String(u)); if (/manifest\.json/.test(u)) return { ok:true, json: async () => ({ file:'mashaer.pmtiles', bytes: 12 * 1048576 }) }; if (/mashaer\.pmtiles/.test(u)) return { ok:true, blob: async () => ({ size: 12 * 1048576 }) }; return { ok:false }; };
  w.caches = { open: async () => ({ match: async k => w.__cache.get(k) || undefined, put: async (k, v) => { w.__cache.set(k, v); }, delete: async k => w.__cache.delete(k) }) };
  w.Response = class { constructor(b, o){ this.b = b; this.o = o; } };
} });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'tech', name:'فني' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {};

console.log('\n══ ٢ · التنزيلُ من الخريطة وحدَها — والبطاقةُ صادقة ══');
T(/MK\.by = \{\};\n  basemapKick\(\);/.test(html) && /mapPaint\(\);\n    basemapKick\(\);/.test(html) && !/\n  try \{ basemapAttach\(\); \} catch/.test(html), 'فتحُ الخريطة يطلبها (basemapKick) في الإنشاء وفي كلِّ فتح — ولا إرفاقَ مباشرًا في الإقلاع');
T(/function basemapKick\(\)\{\n  if \(BASEMAP\.kick \|\| !MAP \|\| CUR !== 'map' \|\| document\.getElementById\('login'\)\) return;/.test(html) && /requestIdleCallback\(run, \{ timeout:2000 \}\)/.test(html), 'والتنزيلُ والإرفاقُ بعد الدخول والخريطةُ ظاهرةٌ والصفحةُ خاملة — لا يزاحمان الإقلاع');
T(/basemapNetOk\(\)\) basemapDownload\(\);/.test(html) && /priority:'low'/.test(html), 'والتنزيلُ التلقائيُّ على اتصالٍ جيدٍ وبأولويةٍ منخفضة — لا يزاحم رفعَ الميدان');
{ const a0 = html.indexOf('function basemapAuto(){'), a1 = html.indexOf('\n}', a0), body = html.slice(a0, a1); T(a0 > 0 && body.indexOf('basemapHave()') > -1 && body.indexOf('basemapHave()') < body.indexOf('basemapManifest()'), 'المحفوظُ يُرفَق قبل البيان: من فتح التطبيقَ بلا شبكةٍ تظهر له خريطةُ الجهاز (V25.0)'); }
T(/BASEMAP\.arc\.getHeader\(\)\.then/.test(html) && /bounds:bb/.test(html), 'والطبقةُ داخل نطاق ملفّها وحدَه — لا بلاطاتٌ فارغةٌ ولا أسماءٌ طافيةٌ خارجه');
{ const c0 = w.navigator.connection; const set = v => Object.defineProperty(w.navigator, 'connection', { value:v, configurable:true });
  set({ effectiveType:'3g' }); const a3 = w.basemapNetOk(); set({ effectiveType:'4g', saveData:true }); const aS = w.basemapNetOk(); set({ effectiveType:'4g' }); const a4 = w.basemapNetOk(); set(undefined); const aU = w.basemapNetOk();
  T(a3 === false && aS === false && a4 === true && aU === true, 'basemapNetOk: ٣ج أو توفيرُ البيانات لا، و٤ج أو غيرُ المعروف نعم'); if (c0 !== undefined) set(c0); }
w.goPage('acct'); w.render(1); await wait(300); w.render(1); await wait(100);   /* الفنيُّ يجدها في «حسابي» */
T(!w.__fetches.some(u => /mashaer\.pmtiles/.test(u)), 'فتحُ الأدوات لا يُنزِّل الملفَّ من تلقاء نفسه');
const btn = d.querySelector('[data-basemapdl]');
T(!!btn && /١٢/.test(btn.textContent) && /ميجا/.test(btn.textContent), 'والزرُّ يسمّي الحجمَ قبل الموافقة: ' + (btn ? btn.textContent.trim() : ''));
{ const tx = d.getElementById('content').textContent; T(/واي فاي/.test(tx) && /تلقائيا/.test(tx) && !/OpenStreetMap/.test(tx), 'والبطاقةُ تقول «تلقائيًّا» وتنصح بواي فاي ولا تذكر مصدرَ البيانات'); }
btn.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200);
T(w.__fetches.some(u => /mashaer\.pmtiles/.test(u)) && w.__cache.has('maps/mashaer.pmtiles') && w.BASEMAP.have === true, 'والضغطُ هو الموافقة: يُنزَّل ويُحفَظ في الجهاز');
w.render(1); await wait(80);
T(!!d.querySelector('[data-basemaprm]') && /محفوظةٌ على الجهاز/.test(d.getElementById('content').textContent), 'ثم تقول البطاقةُ محفوظةٌ وتعرض الإزالة');
w.basemapRemove(); await wait(80);
T(w.BASEMAP.have === false && !w.__cache.has('maps/mashaer.pmtiles'), 'والإزالةُ تمحوها');

console.log('\n══ ٣ · الإسنادُ والعودةُ إلى الشبكة ══');
T(/attribution:'\\u00a9 <a href="https:\/\/www\.openstreetmap\.org\/copyright"/.test(html) && /OpenStreetMap<\/a> contributors/.test(html), 'الطبقةُ تحمل إسنادَ OpenStreetMap في خياراتها');
T(/var MAP_SAT = true;/.test(html) && /function basemapWant\(\)\{\n[^\n]*\n  return BASEMAP\.netDown === true \|\| \(typeof navigator === 'object' && navigator\.onLine === false\);/.test(html), 'القمرُ الصناعيُّ هو الأساس، وعند الانقطاع خريطةُ الجهاز أيًّا كان المختار (V25.1)');
T(/if \(!MAP \|\| BASEMAP\.layer \|\| !basemapWant\(\)\) return Promise\.resolve\(false\);/.test(html) && /if \(!has\) return false;/.test(html), 'وبلا الملفِّ أو على القمر أو مع الشبكة لا يُلحَق شيء — خلفيةُ V24.8 كما كانت (V25.0)');
T(/window\.addEventListener\('offline'/.test(html) && /window\.addEventListener\('online', function\(\)\{ BASEMAP\.netDown = false;/.test(html) && /if \(\+\+tBad >= 12 && !BASEMAP\.netDown\)/.test(html), 'وتُلحَق عند الانقطاع أو تعثّر البلاط الشبكيِّ ١٢ مرةً متتالية، وتُرفَع بعودة الشبكة');
T(/var BASEMAP_JS = \['vendor\/protomaps\/pmtiles-4\.5\.0\.js', 'vendor\/protomaps\/protomaps-leaflet-5\.1\.0\.js'\];/.test(html) && /\.then\(basemapWarm\)/.test(html), 'والعارضُ يُحفَظ معها في مخزنها الباقي — يعمل بلا شبكةٍ ولو تبدّلت النسخة');
T(/new pmtiles\.FileSource\(new File\(\[b\]/.test(html) && /leafletLayer\(\{ url:BASEMAP\.arc/.test(html) && !/URL\.createObjectURL\(b\)/.test(html), 'والقراءةُ مقاطعُ من الذاكرة (FileSource) لا رابطُ Blob — الرابطُ بلا امتدادٍ فكان يُقرأ الأرشيفُ بلاطةً واحدة');
T(/if \(BASEMAP\.busy\) return BASEMAP\.busy\.then\(function\(\)\{ return basemapAttach\(\); \}\);/.test(html), 'ونداءٌ في أثناء آخر ينتظره ثم يُعاد: لا طبقتان، ولا جوابٌ قديمٌ «لا ملف» يسبق التنزيل');
T(/className:'nskBase'/.test(html), 'والطبقةُ تُقلَب في الوضع الداكن كالبلاط الشبكي');

console.log('\n══ ٤ · مع الشبكة خلفيةُ V24.8، وخريطةُ الجهاز للانقطاع وحدَه (V25.0) ══');
{ const on = new Set(), mk = n => ({ n, options:{}, setUrl(){}, addTo(m){ m.add(this); return this; } });
  const fm = { hasLayer: l => on.has(l), removeLayer: l => { on.delete(l); }, add: l => { on.add(l); } };
  const setOn = v => Object.defineProperty(w.navigator, 'onLine', { value:v, configurable:true });
  const base = mk('base'); w.MAP = fm; w.MAP_BASE = base; w.MAP_SAT = false; w.BASEMAP.have = false; w.BASEMAP.netDown = false;
  setOn(true); let vec = mk('vec'); w.BASEMAP.layer = vec; on.add(vec); on.add(base); w.basemapSwap();
  T(!on.has(vec) && on.has(base) && w.BASEMAP.layer === null, 'مع الشبكة: البلاطُ الشبكيُّ كما في V24.8، وخريطةُ الجهاز تُرفَع وتُترَك من الذاكرة');
  setOn(false); vec = mk('vec2'); w.BASEMAP.layer = vec; w.basemapSwap();
  T(on.has(vec) && !on.has(base), 'انقطعت الشبكة: خريطةُ الجهاز وحدَها ولا تُطلَب بلاطاتٌ لا تصل');
  w.mapSat(true);
  T(on.has(vec) && !on.has(base), 'والقمرُ مختارٌ بلا شبكة: لا يصل — فتبقى خريطةُ الجهاز (V25.1)');
  setOn(true); w.basemapSwap();
  T(!on.has(vec) && on.has(base) && w.BASEMAP.layer === null, 'وعادت الشبكة والقمرُ مختار: القمرُ هو الخلفية وتُترَك خريطةُ الجهاز');
  w.mapSat(false); setOn(true); w.BASEMAP.netDown = true; vec = mk('vec3'); w.BASEMAP.layer = vec; w.basemapSwap();
  T(on.has(vec) && !on.has(base), 'البلاطُ الشبكيُّ يتعثّر والجهازُ «متصل»: خريطةُ الجهاز بدلَه');
  w.BASEMAP.netDown = false; w.basemapSwap();
  T(!on.has(vec) && on.has(base) && w.BASEMAP.layer === null, 'وعادت الشبكة: البلاطُ الشبكيُّ من جديد');
  setOn(true); delete w.navigator.onLine;
  w.MAP = null; w.MAP_BASE = null; w.MAP_SAT = false; }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ خريطة المشاعر نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
