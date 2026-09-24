/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التصدير القياسي — node scripts/audit-geojson.mjs
   ───────────────────────────────────────────────────────────────────────────
   FeatureCollection وفق RFC 7946: خطُّ الطول ثم العرض، عددُ المعالم = نقاطُ
   السجلِّ ذاتُ الإحداثيات، وحالةُ كلِّ نقطة من lifeOf نفسِها، وتصديرُ الوزارة بلا
   جوالاتٍ ولا أسماءٍ ولا ملاحظات، والمخطّطاتُ في docs/schema مطابقةٌ لمصدرها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
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
const x = w.STATE.sites.find(s => s.type === 'مخيم'); const now = Date.now();
w.STATE.recs[x.id] = { id:x.id, at: now - 864e5, by:'أحمد 0551234567', access:'تم الوصول', review:'approved', chals:['عائق إنشائي'], note:'ملاحظة داخلية' };

console.log('\n══ ١ · البنيةُ القياسية ══');
const g = w.geoJsonBuild();
const withCo = w.STATE.sites.filter(s => +s.lat && +s.lng).length;
T(g.type === 'FeatureCollection' && Array.isArray(g.features) && g.features.length === withCo && withCo >= 1700, 'FeatureCollection وعددُ المعالم = نقاطُ السجل ذاتُ الإحداثيات: ' + g.features.length);
const f = g.features.find(o => o.id === x.id);
T(f.geometry.type === 'Point' && f.geometry.coordinates[0] === +x.lng && f.geometry.coordinates[1] === +x.lat && Math.abs(f.geometry.coordinates[0]) > 39 && Math.abs(f.geometry.coordinates[1]) < 22, 'الإحداثيات [خطُّ الطول، خطُّ العرض] بترتيب RFC 7946');
T(f.properties.status === w.lifeOf(x) && f.properties.surveyed_at && /^\d{4}-\d\d-\d\dT/.test(f.properties.surveyed_at), 'والحالةُ من lifeOf والتواريخُ ISO');
T(f.properties.surveyed_by === 'أحمد 0551234567' && f.properties.note === 'ملاحظة داخلية' && f.properties.challenges[0] === 'عائق إنشائي', 'والمهندسُ يرى الكاتبَ والتحدياتِ والملاحظة');

console.log('\n══ ٢ · تصديرُ الوزارة بلا تفاصيلَ داخلية ══');
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
const gv = w.geoJsonBuild(); const fv = gv.features.find(o => o.id === x.id);
T(fv.properties.surveyed_by === undefined && fv.properties.note === undefined && fv.properties.challenges === undefined, 'لا كاتبَ ولا ملاحظةَ ولا تحديات');
T(!JSON.stringify(gv).includes('0551234567') && !JSON.stringify(gv).includes('ملاحظة داخلية') && !JSON.stringify(gv).includes('surveyed_by'), 'ولا جوالَ ولا ملاحظةَ ولا حقلَ كاتبٍ في الملف كلِّه');
T(gv.features.length === g.features.length && fv.properties.status === f.properties.status, 'والعددُ والحالةُ كما هما');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٣ · المخطّطاتُ من المصدر نفسِه ══');
let chk = ''; try { chk = execFileSync('node', ['scripts/schema-gen.mjs', '--check'], { encoding:'utf8' }); } catch (e){ chk = String(e.stdout || e.message); }
T(/مطابقةٌ للمصدر/.test(chk), 'docs/schema مطابقةٌ لـ docs/api-schema.json (لا انحراف)');
const fs = JSON.parse(readFileSync('docs/schema/geojson-feature.schema.json', 'utf8'));
T(fs.$schema === 'https://json-schema.org/draft/2020-12/schema' && fs.properties.geometry.properties.coordinates.prefixItems[0].description === 'longitude', 'draft 2020-12 والترتيبُ موثَّق');
/* المعلمُ يطابق مخطّطَه: المفاتيحُ المطلوبةُ موجودةٌ ولا مفتاحَ خارجَه */
const P = fs.properties.properties;
const keys = Object.keys(f.properties);
T(P.required.every(k => keys.includes(k)) && keys.every(k => P.properties[k]), 'ومعلمُ التصدير يطابق المخطّط: المطلوبُ موجودٌ ولا مفتاحَ غريبًا');
T(P.properties.status.enum.includes(f.properties.status), 'والحالةُ ضمن قائمة المخطّط');
T(!html.includes('/openapi') && !readFileSync('docs/system.md', 'utf8').includes('OpenAPI'), 'ولا واجهةَ HTTP مزعومة');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ التصدير القياسي نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
