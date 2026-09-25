/* ═══════════════════════════════════════════════════════════════════════════
   جردُ يوميات المشروع — node scripts/audit-diary.mjs
   ───────────────────────────────────────────────────────────────────────────
   كلُّ يومٍ من أوّل يومِ عملٍ إلى اليوم بلا فجوة، بأرقامٍ من السجلات نفسِها،
   والتراكميُّ صحيح، ويومُ الصفر يُرى، وأسماءُ العاملين للمكتب لا للوزارة،
   وإكسلُ اليوميات يحمل الأعمدةَ نفسَها.
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
await wait(1500);
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200); } return d.getElementById('content'); };
const DAY = 864e5, t0 = Date.parse(new Date().toISOString().slice(0, 10) + 'T12:00:00Z');   /* منتصفُ اليوم بالتوقيت العالمي — لا يعبر حدَّ يوم */
const S = w.STATE.sites.filter(x => x.zone === 'منى').slice(0, 12);
S.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: t0 - (i < 8 ? 5 : 1) * DAY, by: i % 2 ? 'أحمد' : 'سالم', access:'تم الوصول', reviewAt: i < 3 ? t0 - 2 * DAY : 0 }; });
w.STATE.inss[S[0].id] = { id:S[0].id, at: t0 - 2 * DAY, status:'مُركّب', by:'سالم' };
w.STATE.diss = w.STATE.diss || {}; w.STATE.diss[S[1].id] = { id:S[1].id, at: t0 - DAY, status:'تم الفك', by:'أحمد' };
w.statBump();

console.log('\n══ ١ · الصفوفُ من أوّل يومٍ إلى اليوم بلا فجوة ══');
const R = w.diaryRows();
T(R.length === 6 && R[0].day < R[5].day && R[5].day === new Date().toISOString().slice(0, 10), 'ستةُ أيامٍ من أوّل زيارةٍ إلى اليوم: ' + R[0].day + ' → ' + R[5].day);
T(R[0].sv === 8 && R[0].people === 2 && R[0].top.length === 2, 'أوّلُ يوم: ٨ زياراتٍ على شخصين');
T(R[1].sv === 0 && R[1].acts === 0 && R[2].sv === 0 && R[2].acts === 0, 'ويوما الصفر يُرَيان صفرًا لا يُخفَيان');
T(R[3].ins === 1 && R[3].apr === 3 && R[3].sv === 0, 'ويومُ التركيب والاعتمادات بيوم قراره');
T(R[4].sv === 4 && R[4].dis === 1 && R[5].cum === 12 && R[5].cumIns === 1, 'والتراكميُّ ١٢ زيارةً وتركيبٌ واحد');

console.log('\n══ ٢ · الشاشة ══');
const c = await open('exec', 'diary');
const tx = c.textContent;
T(/يوميات المشروع/.test(tx) && /أيامٌ منذ البداية/.test(tx) && tx.indexOf('٦') > -1, 'الشريحةُ في التقارير التنفيذية بإحصائها');
T(/أيامُ عمل/.test(tx) && /متوسط الزيارات في يوم عمل/.test(tx) && /أعلى يوم/.test(tx), 'أيامُ العمل والمتوسطُ وأعلى يوم');
T((tx.match(/—/g) || []).length >= 2 && /الجمعة|الخميس|الأربعاء|الثلاثاء|الاثنين|الأحد|السبت/.test(tx), 'ويومُ الصفر بشَرطةٍ واسمُ اليوم بالعربية');
T(/سالم/.test(tx) && /أحمد/.test(tx), 'والمكتبُ يرى من عمل');
T(!!d.querySelector('[data-xls="diary"]'), 'وزرُّ إكسل اليوميات');
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
const cv = await open('exec', 'diary');
T(/يوميات المشروع/.test(cv.textContent) && !/سالم/.test(cv.textContent), 'والوزارةُ ترى الأرقامَ بلا أسماء');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٣ · إكسل ══');
const sheet = w.SHEETS.diary();
T(Array.isArray(sheet) && sheet.length === 7 && sheet[0].length === 11 && sheet[1][0] === R[5].day && sheet[6][9] === 8, 'ورقةُ اليوميات: عنوانٌ وستةُ أيامٍ بالأحدث أوّلًا والتراكميُّ صحيح');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ اليوميات نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
