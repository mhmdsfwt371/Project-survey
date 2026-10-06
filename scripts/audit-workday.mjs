/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ملخص العمل اليومي وشريط الأيقونات — node scripts/audit-workday.mjs   (V24.0)
   ───────────────────────────────────────────────────────────────────────────
   «ملخص التركيبات اليومي» صار «ملخص العمل اليومي»: المسحُ والتركيبُ والفكُّ والمتعذّر،
   كلُّ يومٍ منذ أوّل عملٍ مسجَّل، والجدولُ صفحاتٌ لا تزيد على خمسة عشر سطرًا، ولكلِّ رقمٍ
   نسبتُه، وكلُّ عملٍ يُخفى ويُظهَر بضغطة، والمرشّحاتُ بالشهر واليوم وساعات مكة (ونافذةُ الليل
   تعبر منتصفَه)، واليومُ الواحدُ ساعةً بساعة — والأرقامُ من diaryRows نفسِها، وبلا مرشِّحٍ
   لا يتغيّر فيها شيء. والقائمةُ المطويّةُ شريطُ أيقوناتٍ لا اختفاء.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص بعد فصله (V21.6) */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
/* مفكّكُ نصوصٍ آمنٌ بين عالمي الفحص والصفحة */
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const html = readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; w.CORE.set = () => {};

const click = async el => { el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60); return d.getElementById('content'); };
const open = async () => { w.goPage('mfu'); w.render(1); await wait(40); const b = d.querySelector('[data-ptab="mfu:mdaily"]'); if (b) await click(b); return d.getElementById('content'); };
const pick = async (id, v) => { const s = d.getElementById(id); s.value = String(v); s.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(60); return d.getElementById('content'); };
const dayKey = ms => new Date(ms + 10800000).toISOString().slice(0, 10);   /* يومُ مكة كالتطبيق */
let c;
const heads = () => [...c.querySelectorAll('thead th')].map(th => th.textContent.trim());
const body = () => [...c.querySelectorAll('tbody tr')];

console.log('\n══ ١ · الاسمُ والعملُ كلُّه ══');
T(w.TABS.mfu.some(x => x[0] === 'mdaily' && x[1] === 'ملخص العمل اليومي'), 'التبويبُ «ملخص العمل اليومي»');
T(!w.TABS.mfu.some(x => /التركيبات اليومي/.test(x[1])) && !/ملخص التركيبات اليومي/.test(String(w.mfuDaily)), 'ولا أثرَ للاسم القديم في التبويب ولا في الصفحة');

/* بياناتٌ معلومةُ الجواب: أوّلُ يومِ عملٍ قبل ٢٤ يومًا — فالأيامُ ٢٥ والجدولُ صفحتان */
const DAY = 864e5, H = 36e5;
const today0 = Date.parse(dayKey(Date.now()) + 'T00:00:00Z'), d0 = today0 - 24 * DAY, d5 = d0 + 5 * DAY;
const S = w.STATE.sites.slice(0, 30).map(x => x.id);
w.STATE.recs = {}; w.STATE.inss = {}; w.STATE.diss = {}; w.STATE.newsites = {};
const rec = (i, at, access) => { w.STATE.recs[S[i]] = { id:S[i], at, by:'أحمد', access:access || 'تم الوصول' }; };
rec(0, d0 + 6 * H); rec(1, d0 + 6 * H + 60000); rec(2, d0 + 7 * H);      /* ٩ و١٠ صباحًا بمكة */
rec(3, d0 + 20 * H);                                                     /* ١١ مساءً بمكة */
rec(4, d5 + 8 * H); rec(5, d5 + 9 * H, 'لم يُصل');                          /* يومٌ فيه متعذّر */
for (let k = 6; k < 10; k++) rec(k, today0 + 5 * H + k * 60000);          /* اليوم: أربعُ زيارات */
w.STATE.inss[S[4]] = { id:S[4], status:'مُركّب', at:d5 + 10 * H, by:'أحمد' };
w.STATE.inss[S[5]] = { id:S[5], status:'مُركّب', at:d5 + 11 * H, by:'أحمد' };
w.STATE.diss[S[4]] = { id:S[4], status:'تم الفك', at:today0 + 6 * H, by:'أحمد' };

const R0 = w.diaryRows();
T(JSON.stringify(R0) === JSON.stringify(w.diaryRows(undefined)) && JSON.stringify(R0) === JSON.stringify(w.diaryRows(null)), 'diaryRows بلا مرشِّحٍ كما كانت تمامًا');
T(R0.length === 25 && R0[0].day === dayKey(d0) && R0[24].day === dayKey(today0), 'كلُّ يومٍ من أوّل يوم عملٍ إلى اليوم بلا فجوة: ' + R0.length);

console.log('\n══ ٢ · الصفحة ══');
c = await open();
T(/ملخص العمل اليومي/.test(c.textContent), 'العنوانُ «ملخص العمل اليومي»');
T(c.querySelectorAll('.wd-s polyline').length === 4, 'أربعةُ منحنيات: تمت الزيارة والتركيب والفك والمتعذر');
T(JSON.stringify(heads()) === JSON.stringify(['اليوم', 'تمت الزيارة', 'التركيب', 'الفك', 'المتعذر']), 'والجدولُ بأعمدتها: ' + heads().join('، '));
T(body().length === 15, 'الصفحةُ الأولى خمسةَ عشرَ يومًا لا أكثر: ' + body().length);
const tot = w.STATE.sites.length, r1 = body()[0];
T(r1.cells[1].textContent.startsWith(w.nm(4)) && r1.cells[1].textContent.includes(w.wdyPct(4, tot)), 'والأحدثُ أوّلًا، ولكلِّ رقمٍ نسبتُه من إجمالي النقاط: ' + r1.cells[1].textContent);
T(r1.cells[3].textContent.startsWith(w.nm(1)) && r1.cells[3].textContent.includes(w.wdyPct(1, 2)), 'والفكُّ من النقاط المركّبة: ' + r1.cells[3].textContent);
T(c.querySelectorAll('.wd-c').length === 25 && /wd-tip/.test(c.innerHTML), 'والمرورُ على كلِّ يومٍ يُظهر أرقامَه');
T(c.querySelectorAll('[data-wdypg]').length === 4 && !!c.querySelector('[data-wdypg="2"]'), 'وصفحتان للأيام الخمسة والعشرين');
c = await click(c.querySelector('[data-wdypg="2"]'));
T(body().length === 10 && body()[9].cells[0].textContent === w.wdyDayLbl(dayKey(d0), { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }), 'والثانيةُ عشرةُ أيامٍ آخرُها أوّلُ يومِ عمل');
const r5 = body().find(tr => tr.cells[0].textContent === w.wdyDayLbl(dayKey(d5), { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }));
T(!!r5 && r5.cells[4].textContent.startsWith(w.nm(1)) && r5.cells[4].textContent.includes(w.wdyPct(1, 2)), 'والمتعذّرُ من زيارات يومه: ' + (r5 ? r5.cells[4].textContent : '—'));
T(body().some(tr => tr.classList.contains('wd-z')), 'والأيامُ بلا عملٍ مسجّلةٌ باهتة');

console.log('\n══ ٣ · الإخفاءُ والإظهار ══');
c = await click(c.querySelector('[data-wdyser="sv"]'));
T(c.querySelectorAll('.wd-s polyline').length === 3 && !heads().includes('تمت الزيارة') && c.querySelector('[data-wdyser="sv"]').getAttribute('aria-pressed') === 'false', 'ضغطةٌ على «تمت الزيارة» تُخفي منحناه وعموده');
c = await click(c.querySelector('[data-wdyser="sv"]'));
T(c.querySelectorAll('.wd-s polyline').length === 4 && heads().includes('تمت الزيارة'), 'وضغطةٌ ثانيةٌ تُعيده');

console.log('\n══ ٤ · المرشّحات ══');
const mon = dayKey(d0).slice(0, 7), inMon = R0.filter(r => r.day.slice(0, 7) === mon).length;
c = await pick('wdyMon', mon);
T(w.WDY.mon === mon && w.WDY.pg === 1 && body().length === Math.min(15, inMon), 'مرشِّحُ الشهر: ' + inMon + ' يومًا');
c = await pick('wdyMon', '');
c = await pick('wdyH1', 8); c = await pick('wdyH2', 12);
const R8 = w.diaryRows(w.wdyKeep());
T(R8.length && R8[0].day === dayKey(d0) && R8[0].sv === 3, 'ساعاتُ مكة من ٨ إلى ١٢ تُبقي زياراتِ الصباح الثلاث وتُسقط زيارةَ الحادية عشرة ليلًا');
T(body()[0].cells[1].textContent.startsWith(w.nm(4)) && /wdyreset/.test(c.innerHTML), 'والصفحةُ بها، ومعها زرُّ إعادة الضبط');
c = await pick('wdyH1', 20); c = await pick('wdyH2', 4);
const RN = w.diaryRows(w.wdyKeep());
T(RN.length && RN[0].day === dayKey(d0) && RN[0].sv === 1, 'ونافذةُ الليل تعبر منتصفَه: من ٢٠ إلى ٤ تُبقي زيارةَ الحادية عشرة وحدَها');
c = await click(c.querySelector('[data-wdyreset]'));
T(!w.WDY.mon && !w.WDY.day && w.WDY.h1 === 0 && w.WDY.h2 === 24, 'وزرُّ إعادة الضبط يرفع المرشّحات كلَّها');
c = await pick('wdyDay', dayKey(d0));
T(c.querySelectorAll('.wd-c').length === 24 && heads()[0] === 'الساعة', 'اليومُ الواحدُ ساعةً بساعة: أربعٌ وعشرون ساعة');
T(body().length === 3 && body()[0].cells[0].textContent === w.wdyHourLbl(9) && body()[1].cells[0].textContent === w.wdyHourLbl(10) && body()[2].cells[0].textContent === w.wdyHourLbl(23), 'والجدولُ ساعاتُ العمل وحدَها: ٩ و١٠ و٢٣ بتوقيت مكة');
T(body()[0].cells[1].textContent.startsWith(w.nm(2)), 'وساعةُ التاسعة زيارتان');
c = await click(c.querySelector('[data-wdyreset]'));

console.log('\n══ ٥ · التحديثُ الأسبوعيُّ المُصدَّر ══');
const sec = w.MFU.sections.find(s => s[0] === 'daily'), rep = w.mfuReport();
T(/ملخص العمل اليومي/.test(sec[1]) && JSON.stringify(sec[2]) === JSON.stringify(['اليوم', 'تمت الزيارة', 'التركيب', 'الفك', 'تحتاج زيارة أخرى تقنيًا']), 'بالاسم والأعمدة نفسِها');
T(rep.daily.length && rep.daily.every(r => r.length === 5) && rep.daily[0][1] === 4 && rep.daily[0][3] === 1, 'وصفوفُه: اليوم، المسح، التركيب، الفك، المتعذر');

console.log('\n══ ٦ · شريطُ الأيقونات حين تُطوى القائمة ══');
w.CUR = 'mfu'; const nh = w.navHtml();
T((nh.match(/<svg /g) || []).length >= 8 && /class="nav-t"/.test(nh) && /class="gp-head"/.test(nh), 'لكلِّ وحدةٍ أيقونة، والاسمُ في وسمٍ يظهر عند المرور، وصفحاتُها برأسها في اللوحة');
T(/nav-section has-cur/.test(nh) && /aria-label="المتابعة"/.test(nh), 'ووحدةُ الصفحة الحالية مضاءة، ولكلِّ أيقونةٍ اسمٌ يُقرأ');
T(/body\.side-off \.sidebar\{width:var\(--rail\)/.test(html) && !/body\.side-off \.sidebar\{transform:translateX/.test(html) && /body\.side-off \.shell\{margin-inline-start:var\(--rail\)\}/.test(html), 'الطيُّ شريطٌ بعرض --rail لا اختفاءٌ خارج الشاشة');
T(/\.nav-section:hover>\.group-panel/.test(html) && /\.nav>a:hover>\.nav-t/.test(html) && /\.nav-section:focus-within>\.group-panel/.test(html), 'والاسمُ واللوحةُ عند المرور، ولوحةُ المفاتيح تبلغها');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ ملخص العمل اليومي وشريط الأيقونات نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
