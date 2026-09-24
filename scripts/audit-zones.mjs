/* ═══════════════════════════════════════════════════════════════════════════
   جردُ المشعر المعلَن — node scripts/audit-zones.mjs
   ───────────────────────────────────────────────────────────────────────────
   إعلانُ تركيبةٍ (مشعر|نوع) في «نقاط المراحل» يجب أن يظهر في كلِّ ما يعدُّ
   بالمشعر من يومه: الطلباتُ والتوزيع (المتاحُ بصفر)، وشاشةُ الوزارة والملخّص،
   وقائمةُ المشاعر في الموقع الجديد، وتصديرُ الوزارة — ولا يكسر توقّعًا ولا نسبة.
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
await wait(1500); w.toast = () => {}; w.CORE.set = () => {};
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return d.getElementById('content'); };

console.log('\n══ ١ · قبل الإعلان ══');
const Z = 'الترددية';
T(!w.siteKeyStats().zones[Z] && w.zonesLive().indexOf(Z) < 0, 'المشعرُ الجديد غيرُ موجودٍ قبل الإعلان');

console.log('\n══ ٢ · الإعلانُ من نقاط المراحل ══');
w.mxDeclare(Z, 'كاميرات LPR'); w.statBump();
T((w.CFG.mxExtra || []).includes(Z + '|كاميرات LPR'), 'أُعلنت التركيبة');
const K = w.siteKeyStats();
T(K.zones[Z] && K.zones[Z].n === 0 && K.by[Z + '|كاميرات LPR'] === 0, 'والمشعرُ في الإحصاء بصفر — والتركيبةُ بصفر');
T(w.siteStats().byKey[Z + '|كاميرات LPR'] === 0, 'وفي إحصاء المواقع كذلك');
T(w.zonesLive().includes(Z) && w.zoneOptions().includes(Z), 'وفي قوائم المشاعر (الموقعُ الجديد وغيرُه)');

console.log('\n══ ٣ · حيث يُرى ══');
const asn = await open('req', 'assign');
T(asn.textContent.includes(Z) && /كاميرات LPR/.test(asn.textContent), 'الطلباتُ والتوزيع: صفٌّ للمشعر الجديد بالمتاح صفر');
const kk = await open('over', 'kiosk'); await wait(1200);
T(kk.textContent.includes(Z), 'وشاشةُ الوزارة تسمّيه في المشاعر');
T(w.zoneForecast(Z) === null, 'ولا توقّعَ يُكسَر لمشعرٍ بلا نقاط');
const ov = await open('over', 'over');
T(ov.textContent.includes(Z), 'والملخّصُ يسمّيه');
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
const g = w.geoJsonBuild();
T(!g.features.some(f => f.properties.zone === Z), 'وتصديرُ الوزارة لا يحمل نقاطًا له (لا نقاطَ بعد) ولا يسقط');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٤ · أوّلُ نقطةٍ في المشعر الجديد تحلُّ محلَّ الإعلان بلا تكرار ══');
w.STATE.sites.push({ id:'NSK-TRD-LPR-0001', name:'كاميرا اختبار', zone:Z, type:'كاميرات LPR', lat:21.4, lng:39.9 }); w.SITE_IX = null; w.statBump();
const K2 = w.siteKeyStats();
T(K2.zones[Z].n === 1 && K2.by[Z + '|كاميرات LPR'] === 1 && Object.keys(K2.by).filter(k => k.startsWith(Z + '|')).length === 1, 'الصفُّ واحدٌ بعددٍ واحد — لا صفَّ مكرَّرٌ للمعلَن');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ المشعر المعلَن نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
