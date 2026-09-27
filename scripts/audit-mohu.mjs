import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تقرير كاميرات الوزارة — node scripts/audit-mohu.mjs
   ───────────────────────────────────────────────────────────────────────────
   يُرفَع من داخل التطبيق بصيغة الوزارة كما هي (لا تحمل الشيفرةُ عنوانًا): يُطابَق عمودًا عمودًا
   بالنقاط وأدوارِ الجمرات، وما لا يطابق يُقال لماذا، وكلمةُ المرور لا تمرّ، والعناوينُ تُكتَب في
   تجاوز النقطة وتظهر في نافذتها. العناوينُ هنا من مدى الوثائق (192.0.2.x) لا من الشبكة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1400); w.toast = () => {}; const wrote = []; const C0 = w.CORE.set; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); return C0.call(w.CORE, k, id, v); };
/* صفوفٌ بصيغة الوزارة: رأسٌ ثم أعمدة — عمودٌ بكاميرتين، وعمودٌ بلا إحداثيات، وأدوارُ الجمرات، وسطرُ كلمة مرور */
const S16 = w.siteFind('NSK-MIN-CAM-0016');
const k16 = w.mohuSiteKey(S16);
const rows = [
  ['MINA CPE AND CAMERA REPORT'], ['CAMERA PASSWORD', 'SECRET-123'], [],
  ['CPE', 'CAM', 'SECTOR', 'POLE NO', 'ANTENNA IP', 'CAM VLAN', 'CAMERA IP', 'MODEL', 'TYPE', 'MAKER', 'PLACE', 'LOCATION', 'STATUS'],
  ['', '', 'SECTOR'],
  ['1', '1', 'ROUCKET (1)\nUNIFI 192.0.2.99', '3 POLE', '192.0.2.10', '1810', '192.0.2.11', 'DH-IPC-HFW5541T', 'FIXED', 'DAHUA', '', '21°25\'07.3"N 39°52\'50.7"E', 'Good Signal Clear LOS'],
  ['', '2', '', '', '', '1811', '192.0.2.12', 'DH-SD49425', 'PTZ', 'DAHUA', '', '', ''],
  ['2', '3', 'UNIFI', 'POLE 21', '192.0.2.20', '1820', '192.0.2.21', 'DH-IPC', 'FIXED', 'DAHUA', '', '', 'VLAN ISSUE'],
  ['3', '4', 'JAMARAT GF', 'JAMARAT', '192.0.2.30', '1830', '192.0.2.31', 'DH-SD', 'PTZ', 'DAHUA', '', 'JAMARAT G FLOOR', 'Good'],
  ['', '5', '', '', '', '1831', '192.0.2.32', 'DH-IPC', 'FIXED', 'DAHUA', '', 'JAMARAT 2ND FLOOR', ''],
];
/* تحويلُ العمود والقطاع والموقع إلى ما في النقطة CAM-0016 نفسِها — المطابقةُ تُختبَر على نقطةٍ حقيقية */
rows[5][2] = k16[1] + ' (1)\nUNIFI 192.0.2.99'; rows[5][3] = S16.name.replace(/^كاميرا وزارة\s+/, '').replace(/\s*(\[\d+ cams\])?\s*(\(PTZ\))?\s*-\s*.+$/, '');
const lat = +S16.lat, lng = +S16.lng, dms = v => { const a = Math.abs(v), dd = Math.floor(a), mm = Math.floor((a - dd) * 60), ss = ((a - dd) * 60 - mm) * 60; return dd + '°' + mm + '\'' + ss.toFixed(1) + '"'; };
rows[5][11] = dms(lat) + 'N ' + dms(lng) + 'E';
const p = w.mohuParse(rows);

console.log('\n══ ١ · المطابقة ══');
const o16 = p.ok.find(x => x.id === 'NSK-MIN-CAM-0016');
T(!!o16 && o16.camx.cams.length === 2 && o16.camx.cams[0].ip === '192.0.2.11' && o16.camx.cams[1].kind === 'P', 'العمودُ بكاميرتيه طابق نقطتَه — بعنوانيهما ونوعيهما');
T(o16 && o16.camx.ant === '192.0.2.10' && o16.camx.secAnt === 'UNIFI 192.0.2.99' && o16.camx.cams[0].vlan === '1810', 'ومعه المستقبِلُ وهوائيُّ القطاع والـVLAN');
T(!!p.ok.find(x => x.id === 'NSK-JMR-CAM-0001') && !!p.ok.find(x => x.id === 'NSK-JMR-CAM-0003'), 'وكاميراتُ الجمرات إلى أدوارها: الأرضيُّ والثاني');
T(p.bad.length === 1 && /بلا إحداثيات/.test(p.bad[0].why), 'والعمودُ بلا إحداثياتٍ ولا نقطةٍ يُقال سببُه');
T(!JSON.stringify(p).includes('SECRET-123') && !/PASSWORD/i.test(JSON.stringify(p)), 'وكلمةُ المرور لا تمرّ إلى شيء');

console.log('\n══ ٢ · الحفظُ والعرض ══');
const n = w.impApply();
T(n === p.ok.length && wrote.some(r => r[0] === 'sites' && r[1] === 'NSK-MIN-CAM-0016' && r[2].camx && r[2].camx.cams.length === 2), 'يُكتَب في تجاوز النقطة (القاعدة المحمية) لا في الشيفرة');
w.goPage('map'); w.render(1); await wait(60); w.popOpenAt('NSK-MIN-CAM-0016', null); await wait(80);
const pk = d.getElementById('pkPop').textContent;
T(/عناوين الكاميرات/.test(pk) && /192\.0\.2\.11/.test(pk) && /192\.0\.2\.12/.test(pk) && /المستقبِل على العمود/.test(pk), 'ونافذةُ النقطة تعرض عناوينَ كاميراتها والمستقبِلَ');

console.log('\n══ ٣ · النقاطُ المتطابقةُ الإحداثية تُرى كلُّها ══');
const a = w.siteFind('NSK-MIN-CAM-0001'), b = w.siteFind('NSK-MIN-CAM-0002');
const oldB = [b.lat, b.lng]; b.lat = a.lat; b.lng = a.lng; w.statBump();
const mapWas = w.MAP; if (!w.MAP || !w.MAP.getZoom) w.MAP = { getZoom: () => 18 };   /* الخريطةُ لا تُبنى في بيئة الفحص — يكفي مستوى التقريب */
const pa = w.mapPosOf(a), pb = w.mapPosOf(b);
T((pa[0] !== pb[0] || pa[1] !== pb[1]) && Math.abs(pa[0] - a.lat) < 0.001, 'نقطتان على الإحداثية نفسِها تُرسمان في موضعين متجاورين — والمحفوظُ لا يتغيّر');
b.lat = oldB[0]; b.lng = oldB[1]; w.statBump(); w.MAP = mapWas;

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تقرير كاميرات الوزارة نظيف \u2705'); process.exit(0);
