/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خريطة المشاعر بلا شبكة — node scripts/audit-basemap.mjs
   ───────────────────────────────────────────────────────────────────────────
   لا تنزيلَ بلا موافقةٍ صريحة، والحجمُ تحت ثلاثين ميجابايت إن وُجد الملف،
   والإسنادُ ظاهر، والعارضُ مضمَّنٌ بنسخٍ مثبَّتةٍ ورخصٍ لا من شبكةٍ عامة، وبلا
   الملفِّ يبقى كلُّ شيءٍ كما كان (عودةٌ إلى الشبكة)، والوصفةُ موثَّقة.
   ═════════════════════════════════════════════════════════════════════════ */
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
T(existsSync('vendor/protomaps/pmtiles-3.0.7.js') && existsSync('vendor/protomaps/protomaps-leaflet-4.0.1.js') && existsSync('vendor/protomaps/LICENSE-protomaps-leaflet') && /BSD-3-Clause/.test(readFileSync('vendor/protomaps/VERSIONS', 'utf8')), 'العارضُ مضمَّنٌ بنسخٍ مثبَّتةٍ ورخصٍ');
T(!/cdn\.jsdelivr|unpkg\.com|protomaps\.com\/.*\.js/.test(html), 'ولا يُحمَّل من شبكةٍ عامة');
T(/\/vendor\/protomaps\//.test(readFileSync('sw.js', 'utf8')), 'وعاملُ الخدمة يخزّنه عند أوّل طلب');
const rec = readFileSync('docs/maps/README.md', 'utf8');
T(/planetiler/.test(rec) && /--bounds=39\.84,21\.33,40\.03,21\.48/.test(rec) && /30/.test(rec), 'والوصفةُ: الأداةُ والنطاقُ والحدُّ');
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

console.log('\n══ ٢ · الموافقةُ بوابةٌ لا تُتخطّى ══');
w.goPage('acct'); w.render(1); await wait(300); w.render(1); await wait(100);   /* الفنيُّ يجدها في «حسابي» */
T(!w.__fetches.some(u => /mashaer\.pmtiles/.test(u)), 'فتحُ الأدوات لا يُنزِّل الملفَّ من تلقاء نفسه');
const btn = d.querySelector('[data-basemapdl]');
T(!!btn && /١٢/.test(btn.textContent) && /ميجا/.test(btn.textContent), 'والزرُّ يسمّي الحجمَ قبل الموافقة: ' + (btn ? btn.textContent.trim() : ''));
T(/واي فاي/.test(d.getElementById('content').textContent) && /OpenStreetMap/.test(d.getElementById('content').textContent), 'ويُنصَح بواي فاي ويُذكَر المصدر');
btn.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200);
T(w.__fetches.some(u => /mashaer\.pmtiles/.test(u)) && w.__cache.has('maps/mashaer.pmtiles') && w.BASEMAP.have === true, 'والضغطُ هو الموافقة: يُنزَّل ويُحفَظ في الجهاز');
w.render(1); await wait(80);
T(!!d.querySelector('[data-basemaprm]') && /محفوظةٌ على الجهاز/.test(d.getElementById('content').textContent), 'ثم تقول البطاقةُ محفوظةٌ وتعرض الإزالة');
w.basemapRemove(); await wait(80);
T(w.BASEMAP.have === false && !w.__cache.has('maps/mashaer.pmtiles'), 'والإزالةُ تمحوها');

console.log('\n══ ٣ · الإسنادُ والعودةُ إلى الشبكة ══');
T(/attribution:'\\u00a9 <a href="https:\/\/www\.openstreetmap\.org\/copyright"/.test(html) && /OpenStreetMap<\/a> contributors/.test(html), 'الطبقةُ تحمل إسنادَ OpenStreetMap ظاهرًا');
T(/if \(!MAP \|\| MAP_SAT \|\| BASEMAP\.layer\) return Promise\.resolve\(false\);/.test(html) && /if \(!has\) return false;/.test(html), 'وبلا الملفِّ أو على القمر الصناعي لا يُلحَق شيء — الشبكةُ كما كانت');
T(/URL\.createObjectURL\(b\)/.test(html) && /leafletLayer\(\{ url:BASEMAP\.url/.test(html), 'والقراءةُ عبر رابط Blob — لا نطاقاتِ بايتٍ في عامل الخدمة');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ خريطة المشاعر نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
