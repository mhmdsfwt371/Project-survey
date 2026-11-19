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

console.log('\n══ ٣ · (V47.11) منحنى منى من القراءات نفسِها، والحساسُ الأضعف من مسافته ══');
{
  /* the sixteen readings of camp 38/56 on 19 Nov 2026 (metres on the map, dBm) — the fit worked out by hand: -37.1 - 17.9·log10(m), ±6.5 dB */
  const REAL = [[19, -54], [17, -52], [70, -62], [66, -63], [27, -67], [41, -70], [46, -66], [45, -59], [39, -75], [33, -68], [47, -75], [45, -74], [10, -58], [42, -63], [16, -53], [28, -69]];
  const lat = m => 21.41 + m / (6371000 * Math.PI / 180), set = (L, farM) => {
    const sens = L.map(p => [lat(p[0]), 39.89]), sm = L.map((p, i) => ({ serial:'R' + i })), U = {}; L.forEach((p, i) => { U['r' + i] = { t:now, v:{ rssi:p[1], temp:30 } }; });
    if (farM){ sens.push([lat(farM), 39.89]); sm.push({}); }
    w.IOT.data = { camps:{ 'TST-9':{ gw:G, gws:[], sensors:sens, gm:[{}], sm:sm } } }; w.IOT.live = { at:now, busy:false, v:{ at:now, units:U } };
    w.iotDashHtml.F = { tab:'s', st:'all', zone:'all', q:'tst-9', n:100, sort:'name', pop:null }; };
  set(REAL, 139);
  const rowsOf = () => w.iotDashHtml.rows().filter(r => r.camp === 'TST-9' && r.kind === 's'), C = w.iotDashHtml.fit(rowsOf());
  T(C.ok && C.n === 16 && Math.abs(C.a + 37.1) < 0.6 && Math.abs(C.b + 17.9) < 0.6 && Math.abs(C.s - 6.5) < 0.3, 'المنحنى من ١٦ قراءة: ' + C.a.toFixed(1) + ' ' + C.b.toFixed(1) + '·log10(م) ± ' + C.s.toFixed(1) + ' — كحساب اليد');
  T(Math.abs(C.mean + 64.25) < 0.01 && C.weak === -75 && C.far === 139, 'المتوسط ‎-64.25 والأضعف ‎-75 وأبعدُ حساسٍ في الخطة 139 م (ولو بلا قراءة)');
  const R = rowsOf(), g = (m, v) => w.iotDashHtml.sig(R.find(r => r.dist === m && r.v && r.v.rssi === v));
  T(g(39, -75).wx && g(39, -75).gap === -9 && !g(70, -62).wx && g(70, -62).gap === 8, 'حساسُ الـ39 م بـ‎-75 أضعفُ من المتوقع بـ9 · وحساسُ الـ70 م بـ‎-62 أقوى بـ8');
  const wxN = R.filter(r => w.iotDashHtml.sig(r).wx).length;
  T(wxN >= 1 && wxN <= 3 && R.filter(r => w.iotDashHtml.sig(r).gap != null).length === 16 && w.iotDashHtml.sig(R.find(r => !r.ser)).gap === null, '«أضعف من المتوقع» قلّةٌ (' + wxN + ' من ١٦)، وبلا قراءةٍ بلا فرق');
  const h = w.iotDashHtml(), card = (h.split('id="iotCurve"')[1] || '').split('</div>\n')[0];
  T(/الإشارة والمسافة/.test(card) && /-64\.2 dBm/.test(card) && /-75 dBm/.test(card) && />62 dB</.test(card) && /-76 dBm/.test(card) && card.indexOf('(' + w.nm(139) + ' ') > -1, 'الكارت: المتوسط والأضعف والهامش ٦٢ والمتوقعُ عند ١٣٩ م');
  T((card.match(/<circle/g) || []).length === 16 && (card.split('</svg>')[0].match(/#EF4444/g) || []).length === wxN && /<polyline/.test(card) && /<b>مبدئي<\/b>/.test(card) && /ما تتحوّلش لمتر/.test(card), 'ورسمتُه: ١٦ نقطة، الحمراءُ منها الأضعف، والمنحنى، و«مبدئي» ما دام العددُ قليلًا');
  T(h.indexOf('الفرق عن المتوقع') > -1 && /data-iotd="st:wx"/.test(h) && /-9 dB/.test(h), 'وفي الجدول عمودُ «الفرق عن المتوقع»، وشريحةُ «أضعف من المتوقع»');
  w.iotDashHtml.act('st:wx'); { const tb = (w.iotDashHtml().split('<tbody>')[1] || '').split('</tbody>')[0]; T((tb.match(/<tr /g) || []).length === wxN, 'والشريحةُ تُبقي الأضعفَ وحدَه (' + wxN + ')'); } w.iotDashHtml.act('st:all');
  const X2 = w.iotDashHtml.xls(), c2 = n => X2.head.indexOf(n), r9 = X2.rows.find(r => r[c2('المسافة على الخريطة (م)')] === 39 && r[c2('قوة الإشارة RSSI (dBm)')] === -75);
  T(c2('الإشارة المتوقعة (dBm)') > -1 && r9[c2('الفرق عن المتوقع (dB)')] === -9 && r9[c2('الإشارة المتوقعة (dBm)')] === -66 && /أضعف من المتوقع/.test(r9[c2('ملاحظة الإشارة')]), 'والإكسل: المتوقعُ ‎-66 والفرقُ ‎-9 و«أضعف من المتوقع» في الملاحظة');
  set(REAL.slice(0, 7)); { const C7 = w.iotDashHtml.fit(rowsOf()), h7 = w.iotDashHtml();
    T(!C7.ok && C7.n === 7 && rowsOf().every(r => w.iotDashHtml.sig(r).gap === null) && /المنحنى يظهر لما ٨ حساسات/.test(h7) && !/<polyline/.test(h7), 'سبعةُ حساسات: لا منحنى ولا فرق — والكارتُ يقول ما ينقص'); }
  set(REAL.map(p => [40, p[1]])); T(!w.iotDashHtml.fit(rowsOf()).ok, 'والكلُّ على مسافةٍ واحدة: لا منحنى');
  set(REAL.map((p, i) => [10 + i * 5, -90 + i])); T(!w.iotDashHtml.fit(rowsOf()).ok, 'ومنحنًى يصعد مع البُعد مرفوض — لا يُبنى عليه حكم');
}

console.log(fails.length ? '\nمسافةُ الحساسات وإكسلها: فشل ✗ (' + fails.length + ')' : '\n✓ ' + pass + ' فحصًا — المتر من الخريطة، والإشارةُ في الإكسل');
process.exit(fails.length ? 1 : 0);
