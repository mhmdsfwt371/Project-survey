/* ═══════════════════════════════════════════════════════════════════════════
   The sensors page: metres come from the map, and the export carries the signal — node scripts/audit-iot-dist.mjs   (V47.10)
   ───────────────────────────────────────────────────────────────────────────
   Before the antenna meeting (18 Nov 2026) an engineer's rule («200 m is about -90») was read against this page's metres.
   The metres are the plan's map distance between a sensor's pin and its camp's nearest gateway — never derived from RSSI
   (the antenna report moved the mean RSSI 10 dB with every sensor in place). Held here: the column and the popup say
   «المسافة على الخريطة», a visible line says where the number comes from, a sensor with no reading still has its distance,
   and the Excel export carries RSSI, its grade, SNR, the map distance and the signal note — numbers as numbers.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

/* one camp, a gateway and four sensors at known distances: 0.0004° of latitude is 44.5 m */
const now = Date.now(), G = [21.41, 39.89], at = k => [21.41 + 0.0004 * k, 39.89], M = k => Math.round(6371000 * 0.0004 * k * Math.PI / 180);
w.IOT.data = { camps:{ 'TST-9':{ gw:G, gws:[], sensors:[at(1), at(2), at(4), at(1)], gm:[{ serial:'GW-9' }],
  sm:[{ serial:'S-NEAR' }, { serial:'S-MID' }, { serial:'S-FAR' }, {}] } } };
w.IOT.live = { at:now, busy:false, v:{ at:now, units:{ 'gw-9':{ t:now, v:{ ext_bat:12.6 } },
  's-near':{ t:now, v:{ temp:31.2, hum:48, bat:95, rssi:-121, snr:-3.5 } }, 's-mid':{ t:now, v:{ temp:31, hum:50, bat:90, rssi:-74 } }, 's-far':{ t:now, v:{ temp:30, hum:51, bat:88, rssi:-90 } } } } };
w.iotDashHtml.F = { tab:'s', st:'all', zone:'all', q:'tst-9', n:100, sort:'name', pop:null };

console.log('\n══ ١ · المتر من الخريطة، ومكتوبٌ أنه من الخريطة ══');
const R = w.iotDashHtml.rows().filter(r => r.camp === 'TST-9'), S = R.filter(r => r.kind === 's'), by = ser => S.find(r => r.ser === ser);
T(by('S-NEAR').dist === M(1) && by('S-MID').dist === M(2) && by('S-FAR').dist === M(4), 'المسافة = ما بين الدبوسين على الخريطة: ' + [M(1), M(2), M(4)].join(' · ') + ' م');
T(S.find(r => !r.ser).dist === M(1), 'وحساسٌ بلا سيريال ولا قراءة له مسافتُه — فهي ليست من الإشارة');
{ const a = by('S-MID').dist; w.IOT.live.v.units['s-mid'].v.rssi = -110; const b = w.iotDashHtml.rows().find(r => r.ser === 'S-MID').dist; w.IOT.live.v.units['s-mid'].v.rssi = -74;
  T(a === b, 'وتغيُّرُ قوة الإشارة لا يحرّك المتر (' + a + ' = ' + b + ')'); }
const h = w.iotDashHtml(), head = (h.split('<thead>')[1] || '').split('</thead>')[0];
T(head.indexOf('المسافة على الخريطة') > -1 && head.indexOf('المسافة من الجيت واي') < 0, 'عنوانُ العمود «المسافة على الخريطة»');
T(/<p class="hint"[^>]*>[^<]*<b>المسافة على الخريطة<\/b>: [^<]*مش من قوة الإشارة/.test(h) && h.indexOf('<p class="hint"') < h.indexOf('<details'), 'وسطرٌ ظاهرٌ فوق شرح الألوان — لا داخل المطويّ — يقول من أين الرقم');
w.iotDashHtml.act('pop:dev:TST-9:s:0'); const hp = w.iotDashHtml();
T(hp.indexOf('المسافة على الخريطة') > -1 && hp.indexOf(w.nm(M(1)) + ' ') > -1, 'وبطاقةُ الحساس تسمّيها بالاسم نفسِه مع رقمها');
T(w.iotDashHtml.bars({ rssi:-80 }, 40).indexOf('المسافة على الخريطة') > -1, 'وتلميحُ شَرط الإشارة كذلك');
w.iotDashHtml.act('close');

console.log('\n══ ٢ · الإكسل يحمل الإشارة والمسافة ══');
const X = w.iotDashHtml.xls(), H = X.head, col = n => H.indexOf(n), row = ser => X.rows.find(r => r[col('السيريال')] === ser);
const need = ['قوة الإشارة RSSI (dBm)', 'جودة الإشارة', 'نسبة الإشارة للتشويش SNR (dB)', 'المسافة على الخريطة (م)', 'ملاحظة الإشارة'];
T(need.every(n => col(n) > -1) && X.rows.every(r => r.length === H.length), 'خمسةُ أعمدةٍ جديدة، وكلُّ صفٍّ بطول الرأس (' + H.length + ')');
T(['النقطة', 'السيريال', 'آخر تحديث', 'درجة الحرارة', 'الرطوبة', 'البطارية', 'الحالة'].every(n => col(n) > -1) && col('الحالة') === H.length - 1, 'والأعمدةُ القديمة باقية، والحالةُ آخرُها');
{ const n = row('S-NEAR'), m = row('S-MID'), f = row('S-FAR');
  T(n[col(need[0])] === -121 && m[col(need[0])] === -74 && f[col(need[0])] === -90, 'قوةُ الإشارة رقمًا خامًا: ‎-121 · ‎-74 · ‎-90');
  T(n[col(need[3])] === M(1) && m[col(need[3])] === M(2) && f[col(need[3])] === M(4) && typeof m[col(need[3])] === 'number', 'والمسافةُ رقمًا بالمتر — تُرسم مع الإشارة في منحنًى');
  T(n[col(need[1])] === 'على الحافة' && m[col(need[1])] === 'كويسة', 'والجودةُ بدرجات الصفحة نفسِها');
  T(n[col(need[2])] === -3.5 && m[col(need[2])] === '', 'ونسبةُ الإشارة للتشويش حين تصل، وفارغةٌ حين لا تصل');
  T(n[col(need[4])] === 'قريب وضعيف' && m[col(need[4])] === '', '«قريب وضعيف» في ملاحظة الإشارة — كما على الصفحة'); }
{ const g = X.rows.find(r => r[col('السيريال')] === 'GW-9'), e = X.rows.find(r => r[col('رقم المخيم')] === 'TST-9' && !r[col('السيريال')]);
  T(g[col(need[3])] === '' && g[col(need[0])] === '', 'الجيت واي بلا مسافةٍ ولا إشارة');
  T(e[col(need[3])] === M(1) && e[col(need[0])] === '' && e[col(need[1])] === '', 'والحساسُ بلا قراءة: مسافتُه مكتوبة وإشارتُه فارغة — لا صفر'); }
T(String(w.iotDashHtml.act).indexOf('iotDashHtml.xls()') > -1, 'وزرُّ الإكسل يكتب هذه الأعمدة نفسَها');

console.log(fails.length ? '\nمسافةُ الحساسات وإكسلها: فشل ✗ (' + fails.length + ')' : '\n✓ ' + pass + ' فحصًا — المتر من الخريطة، والإشارةُ في الإكسل');
process.exit(fails.length ? 1 : 0);
