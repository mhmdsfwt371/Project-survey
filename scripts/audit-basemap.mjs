/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خريطة المشاعر بلا شبكة — node scripts/audit-basemap.mjs
   ───────────────────────────────────────────────────────────────────────────
   التنزيلُ من فتح الخريطة وحدَه لا من شاشةٍ أخرى، والحجمُ تحت ثلاثين ميجابايت إن
   وُجد الملف، والإسنادُ في خيارات الطبقة ولا يُذكَر المصدرُ في نصوص الواجهة،
   والعارضُ مضمَّنٌ بنسخٍ مثبَّتةٍ ورخصٍ لا من شبكةٍ عامة ويُقرأ الملفُّ مقاطعَ
   (FileSource)، وطبقةُ أساسٍ واحدةٌ مع القمر، وبلا الملفِّ يبقى كلُّ شيءٍ كما كان
   (عودةٌ إلى الشبكة)، والوصفةُ موثَّقة. (V24.9)
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
T(Array.isArray(man.bounds) && man.bounds.join(',') === '39.7,21.3,40.05,21.56', 'والبيانُ يحمل نطاقَ الوصفة نفسَه');
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
T(/function basemapKick\(\)\{\n  if \(BASEMAP\.kick \|\| BASEMAP\.layer \|\| MAP_SAT \|\| !MAP \|\| CUR !== 'map' \|\| document\.getElementById\('login'\)\) return;/.test(html) && /requestIdleCallback\(run, \{ timeout:2000 \}\)/.test(html), 'والإرفاقُ بعد الدخول والخريطةُ ظاهرةٌ والصفحةُ خاملة — لا يزاحم الإقلاع');
T(/else if \(basemapNetOk\(\)\) basemapDownload\(\);/.test(html) && /priority:'low'/.test(html), 'والتنزيلُ التلقائيُّ على اتصالٍ جيدٍ وبأولويةٍ منخفضة — لا يزاحم رفعَ الميدان');
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
T(/if \(!MAP \|\| MAP_SAT \|\| BASEMAP\.layer\) return Promise\.resolve\(false\);/.test(html) && /if \(!has\) return false;/.test(html), 'وبلا الملفِّ أو على القمر الصناعي لا يُلحَق شيء — الشبكةُ كما كانت');
T(/new pmtiles\.FileSource\(new File\(\[b\]/.test(html) && /leafletLayer\(\{ url:BASEMAP\.arc/.test(html) && !/URL\.createObjectURL\(b\)/.test(html), 'والقراءةُ مقاطعُ من الذاكرة (FileSource) لا رابطُ Blob — الرابطُ بلا امتدادٍ فكان يُقرأ الأرشيفُ بلاطةً واحدة');
T(/if \(BASEMAP\.busy\) return BASEMAP\.busy\.then\(function\(\)\{ return basemapAttach\(\); \}\);/.test(html), 'ونداءٌ في أثناء آخر ينتظره ثم يُعاد: لا طبقتان، ولا جوابٌ قديمٌ «لا ملف» يسبق التنزيل');
T(/className:'nskBase'/.test(html), 'والطبقةُ تُقلَب في الوضع الداكن كالبلاط الشبكي');

console.log('\n══ ٤ · طبقةُ أساسٍ واحدةٌ مع القمر الصناعي ══');
{ const on = new Set(), mk = n => ({ n, options:{}, setUrl(){}, addTo(m){ m.add(this); return this; } });
  const fm = { hasLayer: l => on.has(l), removeLayer: l => { on.delete(l); }, add: l => { on.add(l); } };
  const base = mk('base'), vec = mk('vec');
  w.MAP = fm; w.MAP_BASE = base; w.BASEMAP.layer = vec; on.add(vec); on.add(base);
  w.basemapSwap();
  T(on.has(vec) && !on.has(base), 'خريطةُ الجهاز محمَّلة: يُرفَع البلاطُ الشبكيُّ فلا يُنزَّل ما لا يُرى');
  w.mapSat(true);
  T(!on.has(vec) && on.has(base), 'القمرُ يُشغَّل: تُرفَع خريطةُ الجهاز ويظهر القمرُ فوقها لا تحتها');
  w.mapSat(false);
  T(on.has(vec) && !on.has(base), 'ويُطفأ: تعود خريطةُ الجهاز وحدَها');
  w.BASEMAP.layer = null; w.basemapSwap();
  T(on.has(base), 'وبلا خريطةِ الجهاز: البلاطُ الشبكيُّ كما كان');
  w.MAP = null; w.MAP_BASE = null; w.MAP_SAT = false; }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ خريطة المشاعر نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
