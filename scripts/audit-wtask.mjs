/* ═══════════════════════════════════════════════════════════════════════════
   جردُ المهام الأسبوعية — node scripts/audit-wtask.mjs
   ───────────────────────────────────────────────────────────────────────────
   المهامُّ بطاقاتٌ تُقرأ كجملة، ولوحةٌ واحدةٌ للتعديل، وسجلٌّ لا يمحو (V16.81).
   يُثبَت هنا بالرسم الحقيقيِّ:
     ١ · من يعدّل: المهندسُ فما فوق والوزارة — والمشرفُ يقرأ ولا يجد زرًّا.
     ٢ · البطاقةُ في مجموعتها (متأخر · هذا الأسبوع · لاحقًا · بلا تاريخ · مكتمل).
     ٣ · ضغطةُ البطاقة تفتح اللوحة، وشريحةُ الحالة تُحفَظ فورًا وتُسجَّل باسم من ضغط.
     ٤ · «ما الجديد؟» يُضاف إلى السجل ولا يمحو ما قبله — و«آخر تحديث» القديمُ
         يبقى مواكبًا لتقرير الاجتماع.
     ٥ · الشريطُ الثلاثيُّ يحسب من التواريخ لا من الخانات.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 140)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'م. فحص' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };
const day = n => { const t = new Date(Date.now() + n * 86400000); return t.toISOString().slice(0, 10); };

/* ١ · من يعدّل */
const mayOf = r => { w.ROLE = r; return w.wtMay(); };
T(mayOf('engineer') && mayOf('admin') && mayOf('exec') && mayOf('viewer'), 'يعدّل: المهندسُ ومديرُ المشروع والإدارةُ العليا والوزارة');
T(!mayOf('supervisor') && !mayOf('tech') && !mayOf('helper'), 'ولا يعدّل: المشرفُ والفنيُّ والمساعد');
const rules = readFileSync('firestore.rules', 'utf8');
T(/match \/settings\/wtask\s*\{[^}]*role\(\) == 'viewer'/.test(rules), 'والقاعدةُ تفتح وثيقةَ المهام للوزارة — لا الإعداداتِ كلَّها');

/* ٢ · البيانات والمجموعات — كمهندس */
w.ROLE = 'engineer'; w.STATE.meta.name = 'م. فحص';
w.STATE.wtask = { rows:[
  { id:1, n:'كابل الفيبر لمزدلفة', who:'أحمد سعيد', st:'جاري العمل', due:day(-3), track:'الشبكة' },
  { id:2, n:'اعتماد مواقع الجمرات', who:'الوزارة', st:'قيد الانتظار', due:day(2), track:'الاعتماد' },
  { id:3, n:'شراء الراوترات', who:'المشتريات', st:'قيد الانتظار', due:day(20) },
  { id:4, n:'مهمة بلا موعد', who:'', st:'قيد الانتظار', due:'' },
  { id:5, n:'أُنجزت أمس', who:'أحمد سعيد', st:'مكتمل', due:day(-1), doneAt:Date.now() - 86400000 }
], at:Date.now(), by:'م. فحص' };
w.CORE.set = () => {}; w.CORE.saveSoon = () => {};
w.goPage('wtask'); w.WT_TAB = 'list'; w.render(1); await wait(200);
const main = d.getElementById('main') || d.body;
const gh = [...main.querySelectorAll('.wt-gh')].map(e => e.textContent.trim());
T(gh.length === 4 && /متأخر/.test(gh[0]) && /هذا الأسبوع/.test(gh[1]) && /لاحقًا/.test(gh[2]) && /بلا تاريخ/.test(gh[3]),
  'المجموعاتُ بترتيب القراءة: متأخر · هذا الأسبوع · لاحقًا · بلا تاريخ — ' + gh.join(' | '));
T(main.querySelectorAll('.wt-card').length === 4 && !!main.querySelector('[data-wtdone]'), 'أربعُ بطاقاتٍ مفتوحة، والمكتملُ مطويٌّ بعدّاده');
const c1 = main.querySelector('[data-wtopen="1"]');
T(c1 && /تأخّر/.test(c1.textContent) && /أحمد سعيد/.test(c1.textContent) && /الشبكة/.test(c1.textContent), 'البطاقةُ تُقرأ كجملة: الاسمُ والمسؤولُ والمسارُ و«تأخّر ٣ أيام»');
T(/بلا مسؤول/.test(main.querySelector('[data-wtopen="4"]').textContent), 'ومن لا مسؤولَ له يقولها البطاقةُ لا يخفيها');
const stripTxt = main.querySelector('.stats, .grid') ? main.textContent : '';
T(/متأخر/.test(stripTxt) && /مستحق هذا الأسبوع/.test(stripTxt) && /أُنجز هذا الأسبوع/.test(stripTxt), 'الشريطُ الثلاثيُّ فوق البطاقات');
T(!!main.querySelector('[data-wtnew]') && !!main.querySelector('[data-wttools]'), 'للمهندس: «مهمة جديدة» ظاهرٌ و«أدوات المكتب» مطويّة');
T(!main.querySelector('[data-wtfile]'), 'الاستيرادُ لا يظهر إلا بعد فتح الأدوات');

/* ٣ · اللوحة والحالة */
T(click('[data-wtopen="2"]'), 'ضغطةُ البطاقة'); await wait(120);
T(w.WT_OPEN === '2' && !!d.getElementById('wtSheet'), 'تفتح لوحةَ المهمة');
/* V16.85: اللوحةُ خارج المحتوى — «الثابتُ» داخل أبٍ فيه تحويلٌ يظهر في أوّل الصفحة لا أسفلَ الشاشة */
const sh0 = d.getElementById('wtSheet');
T(sh0.parentElement && sh0.parentElement.id === 'wtHost' && sh0.parentElement.parentElement === d.body && !sh0.closest('#content'), 'واللوحةُ تُرسَم في مضيفٍ على الجسد مباشرةً — لا داخل الصفحة ولا قشرتها');
const css = readFileSync('index.html', 'utf8');
T(/\.wt-sheet\{position:fixed !important/.test(css), 'وثابتةٌ على الشاشة في كلِّ عرض');
const chips = [...d.querySelectorAll('#wtSheet [data-wtstat]')].map(e => e.getAttribute('data-wtstat'));
T(chips.length === 4 && chips.every(x => x.indexOf('2|') === 0), 'الحالةُ أربعُ شرائحَ تُضغَط: ' + chips.map(x => x.split('|')[1]).join(' · '));
T(click('#wtSheet [data-wtstat="2|جاري العمل"]'), 'ضغطُ «جاري العمل»'); await wait(120);
const r2 = w.wtRow(2);
T(r2.st === 'جاري العمل' && r2.log && r2.log[0].st === 'جاري العمل' && r2.log[0].by === 'م. فحص' && r2.log[0].at > 0, 'الحالةُ تُحفَظ فورًا وتُسجَّل باسم من ضغط ووقته');
T(w.WT_OPEN === '2' && !!d.getElementById('wtSheet'), 'واللوحةُ تبقى مفتوحةً بعد الحفظ');

/* ٤ · ما الجديد */
const ni = d.getElementById('wtNote'); T(!!ni, 'خانةُ «ما الجديد؟» في اللوحة');
ni.value = 'وصلت العيّنة وتُختبَر غدًا';
T(click('#wtSheet [data-wtnoteadd="2"]'), 'ضغطُ «أضِف»'); await wait(120);
T(r2.log.length === 2 && r2.log[0].note === 'وصلت العيّنة وتُختبَر غدًا' && r2.log[1].st === 'جاري العمل', 'الملاحظةُ فوق السجل ولا تمحو الحالةَ قبلها');
T(r2.upd === 'وصلت العيّنة وتُختبَر غدًا', 'و«آخر تحديث» القديمُ يواكب — تقريرُ الاجتماع يقرؤه كما كان');
T(/وصلت العيّنة/.test(d.querySelector('[data-wtopen="2"]').textContent), 'والبطاقةُ تعرض آخرَ كلمةٍ فورًا');
d.querySelector('#wtSheet [data-wtstat="2|مكتمل"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120);
T(r2.st === 'مكتمل' && r2.doneAt > 0 && w.wtDoneWeek(r2), 'الإتمامُ يختم وقتَه فيُحسَب في «أُنجز هذا الأسبوع»');

/* ٥ · تعديلُ البيانات من اللوحة */
const nEl = d.querySelector('#wtSheet [data-wte2="who"]'); T(!!nEl && nEl.getAttribute('list') === 'wtWhoList', 'المسؤولُ يُكتَب مع اقتراحاتٍ من الأسماء المعروفة');
nEl.value = 'خالد بندر';
click('#wtSheet [data-wtsave2="2"]'); await wait(120);
T(w.wtRow(2).who === 'خالد بندر', 'حفظُ البيانات من اللوحة');
w.wtRow(2).code = 'PM-04'; w.wtRow(2).track = 'PM-04'; w.render(1); await wait(100);
T((d.querySelector('#wtSheet').textContent.match(/PM-04/g) || []).length === 1, 'المسارُ والكودُ المتطابقان يُكتبان مرةً لا مرتين');
click('[data-wtclose]'); await wait(80);
T(w.WT_OPEN === '' && !d.getElementById('wtSheet'), 'الإغلاقُ يطوي اللوحة');

/* ٧ · الربطُ بالخطة (V16.82): المهمةُ تحمل بندًا، والبندُ يحمل شارةَ مهامه، و«شغلي» يعرض ما على اسمي */
w.STATE.wbs = { rows:[
  { id:'1', n:'الشبكة', s:day(-30), e:day(30) },
  { id:'1.1', n:'مدُّ الفيبر', s:day(-30), e:day(10), pct:40 },
  { id:'1.2', n:'تشغيل الراوترات', s:day(-5), e:day(20), pct:0 },
  { id:'2', n:'الاعتمادات', s:day(-10), e:day(15), pct:0 }
], keys:[] };
click('[data-wtopen="1"]'); await wait(120);
const sel = d.querySelector('#wtSheet select[data-wte2="wbs"]');
T(!!sel && sel.options.length === 4 && /1\.1 — مدُّ الفيبر/.test(sel.options[1].textContent), 'اختيارُ بند الخطة من أوراقها بمعرِّفها واسمها');
sel.value = '1.1'; click('#wtSheet [data-wtsave2="1"]'); await wait(120);
T(w.wtRow(1).wbs === '1.1', 'المهمةُ تحمل بندَها');
T(/مدُّ الفيبر/.test(d.querySelector('[data-wtopen="1"]').textContent), 'والبطاقةُ تقول اسمَ البند');
w.WT_OPEN = ''; w.goPage('wbs'); w.WBS_OPEN['1'] = true; w.render(1); await wait(200);
const badge = main.querySelector('[data-wtgo="1.1"]');
T(!!badge && /١|1/.test(badge.textContent) && /متأخر/.test(badge.textContent), 'بندُ الخطة يحمل شارةَ مهامه — وتحمرُّ بما تأخّر: ' + (badge ? badge.textContent.trim() : '—'));
const parentBadge = main.querySelector('[data-wtgo="1"]');
T(!!parentBadge, 'والأبُ يجمع مهامَّ فروعه');
badge.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150);
T(w.CUR === 'wtask' && w.WT_WBS === '1.1' && main.querySelectorAll('.wt-card').length === 1 && !!main.querySelector('[data-wtwbs=""]'),
  'ضغطُ الشارة يفتح مهامَّ البند وحدَها مع زرِّ العودة إلى الكل');
click('[data-wtwbs=""]'); await wait(120);
T(w.WT_WBS === '' && main.querySelectorAll('.wt-card').length === 3, 'والعودةُ تعرض الكلَّ (ثلاثٌ مفتوحةٌ والمكتملُ مطويّ)');
w.STATE.meta.name = 'أحمد سعيد'; w.goPage('mywork'); w.PTAB.mywork = 'mywork'; w.render(1); await wait(200);
const mineCards = [...main.querySelectorAll('.wt-card')].map(e => e.getAttribute('data-wtopen'));
T(mineCards.length === 1 && mineCards[0] === '1', '«مهامي» تعرض مهامَّ الاجتماع التي على اسمي — المفتوحةَ وحدَها: ' + mineCards.join(','));
click('[data-wtopen="1"]'); await wait(120);
T(!!d.getElementById('wtSheet'), 'وتُفتَح لوحتُها من هناك أيضًا');
w.WT_OPEN = ''; w.STATE.meta.name = 'م. فحص'; w.goPage('wtask'); w.render(1); await wait(150);

/* ٨ · وضعُ الاجتماع (V16.83): واحدةً واحدة، المتأخرُ أوّلًا، واللوحةُ نفسُها، والختمُ يُصدِر التقريرَ ويؤرّخ */
w.ROLE = 'engineer'; w.WT_OPEN = ''; w.goPage('wtask'); w.render(1); await wait(150);
w.expPdf = () => { w.__pdf = (w.__pdf || 0) + 1; }; w.window.open = () => null;
const before = w.wtSince().items.length;
T(before >= 3, 'قبل الاجتماع: «ما تغيّر منذ الاجتماع الماضي» يجمع من السجلات: ' + before);
T(click('[data-wtmeetstart]'), 'زرُّ «اجتماع الأسبوع» يبدأ'); await wait(150);
T(w.WT_MEET === true && !!main.querySelector('.wt-meet'), 'الوضعُ يحلُّ محلَّ القائمة');
T(/#1\b/.test(main.querySelector('.wt-meet').textContent), 'يبدأ بالمتأخر: المهمةُ #1');
T(!!main.querySelector('.wt-meet [data-wtstat="1|جاري العمل"]') && !!d.getElementById('wtNote'), 'وفي كلِّ مهمةٍ اللوحةُ نفسُها: شرائحُ الحالة و«ما الجديد؟»');
/* V16.84: خروجٌ بلا ختم، والعدّادُ «١ من ٣» لا شرطةً تنقلب */
T(/١ من ٣|1 من 3/.test(main.textContent.replace(/\s+/g, ' ')), 'العدّادُ يُقرأ «١ من ٣» — لا شرطةً تنقلب في الاتجاه');
T(!!main.querySelector('[data-wtmeetexit]'), 'زرُّ «خروج بلا ختم» موجود');
const stampBefore = w.STATE.wtask.meetAt || 0;
click('[data-wtmeetexit]'); await wait(120);
T(w.WT_MEET === false && (w.STATE.wtask.meetAt || 0) === stampBefore && (w.__pdf || 0) === 0, 'الخروجُ يترك الوضعَ بلا تقريرٍ ولا ختم');
click('[data-wtmeetstart]'); await wait(150);
T(w.WT_MEET === true, 'والدخولُ ثانيةً يعمل');
click('.wt-meet [data-wtstat="1|جاري العمل"]'); await wait(120);
T(w.wtRow(1).st === 'جاري العمل' && w.WT_MEET === true, 'الحالةُ تُحدَّث على الهواء والوضعُ باقٍ');
click('[data-wtmeetnext]'); await wait(120);
T(w.WT_MI === 1 && /#3\b/.test(main.querySelector('.wt-meet').textContent), '«التالي» ينتقل إلى المهمة التالية بالترتيب (٣: مستحقُّ الأسبوع… ثم لاحقًا)');
T(main.querySelectorAll('[data-wtmeetgo]').length === 3, 'وشريطُ القفز بعدد المفتوح');
click('[data-wtmeetend]'); await wait(100);
T(w.WT_MEET === true && w.WT_MEND === 1, 'الضغطةُ الأولى على الإنهاء تطلب تأكيدًا');
click('[data-wtmeetend]'); await wait(200);
T(w.WT_MEET === false && (w.__pdf || 0) === 1 && w.STATE.wtask.meetAt > 0 && w.STATE.wtask.meetBy === 'م. فحص', 'الختمُ يُصدِر التقريرَ ثم يؤرّخ الاجتماعَ باسم من ختم');
T(w.wtSince().items.length === 0, 'وبعد الختم لا شيءَ «منذ الاجتماع الماضي» — حتى يتغيّر شيء');
w.wtNote(3, 'وصل عرضُ السعر'); await wait(100);
T(w.wtSince().items.length === 1 && /وصل عرضُ السعر/.test(w.wtSince().items[0].what), 'وأوّلُ تغييرٍ بعده يُحسَب');
const sheet = w.SHEETS.wtsince(); T(sheet.length === 2 && sheet[1][1] === 'شراء الراوترات' && /وصل عرضُ السعر/.test(sheet[1][3]), 'وقسمُ التقرير «ما تغيّر» يقرؤه من السجل نفسِه');
T(w.EXP_SECS.some(x => x[0] === 'wtsince') && w.EXP_PAGE.wtsince === 'wtask', 'والقسمُ مسجَّلٌ في التصدير وصفحته');

/* ٦ · المشرفُ يقرأ ولا يجد زرًّا */
w.ROLE = 'supervisor'; w.render(1); await wait(150);
T(!main.querySelector('[data-wtnew]') && !main.querySelector('[data-wttools]'), 'المشرفُ: لا «مهمة جديدة» ولا أدوات');
click('[data-wtopen="1"]'); await wait(120);
T(!!d.getElementById('wtSheet') && !d.querySelector('#wtSheet [data-wtstat]') && !d.getElementById('wtNote'), 'يفتح اللوحةَ قراءةً: لا شرائحَ ولا خانةَ جديد');
w.ROLE = 'viewer'; w.WT_OPEN = ''; w.render(1); await wait(150);
T(!!main.querySelector('[data-wtnew]') && !main.querySelector('[data-wttools]'), 'الوزارةُ: تضيف وتعدّل — وأدواتُ المكتب ليست لها');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ المهام الأسبوعية فشل ✗ (${bad})` : '\nالمهامُّ بطاقاتٌ تُقرأ وتُحدَّث من لوحةٍ واحدة ✅');
process.exit(bad ? 1 : 0);
