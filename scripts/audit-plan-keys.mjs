/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مواعيد الخطة ومعالمها — node scripts/audit-plan-keys.mjs   (V47.16)
   ───────────────────────────────────────────────────────────────────────────
   طلبُ المالك: الخطةُ التفصيليةُ (الإصدار ٣) تحمل مواعيدَها الحاكمة في ورقة
   «المواعيد»، فيقرؤها الاستيرادُ ويحدّث البطاقات؛ والشكلُ القديمُ يبقى كما هو؛
   وتصديرُ الخطة لا يقصّ المواعيد؛ و«المعالم والتسليم» تقرأ معالمَ الخطة إن
   وُجدت خطة — وتواريخُها تظهر في متابعة الوزارة كما هي لا تاريخَ اليوم.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const errs = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => { const m = String(e && e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m); });
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
w.eval(readFileSync('vendor/xlsx/0.20.3/xlsx.full.min.js', 'utf8'));
const X = w.XLSX;
const toasts = []; w.toast = m => toasts.push(String(m));
const evs = []; w.logEvent = m => evs.push(String(m));
w.CORE.set = () => {};
const as = r => { w.ROLE = r; w.STATE.meta.role = r; };
const show = (p, tab) => { w.goPage(p); if (tab) w.CUR = tab; w.render(1); return d.getElementById('content'); };
const D = s => new w.Date(s + 'T00:00:00');   /* a date cell must be the page's Date */
const fileOf = sheets => { const wb = X.utils.book_new(); sheets.forEach(([n, aoa]) => X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa, { cellDates:true }), n)); return new w.File([X.write(wb, { type:'array', bookType:'xlsx', cellDates:true })], 'خطة.xlsx'); };
const run = async f => { toasts.length = 0; w.wbsImport(f); await wait(500); return toasts.slice(-1)[0] || ''; };
as('engineer'); w.STATE.meta.name = 'مهندس';

/* a named-form plan (the plan from version 2 on): the schedule by column names, with milestones */
const HS = ['رقم البند', 'اسم البند', 'النوع', 'المسؤول', 'الفريق المنفذ', 'الجهة المعنية', 'البداية المعتمدة', 'النهاية المعتمدة', 'المدة بأيام العمل', 'البداية المجدولة', 'النهاية المجدولة', 'الوزن', 'طريقة القياس', 'الإنجاز المخطط', 'الإنجاز الفعلي'];
const it = (id, n, ty, s, e, pct) => ['‏' + id, n, ty, 'م. التجربة', 'الفريق', 'الجهة', D(s), D(e), 5, D(s), D(e), ty === 'معلم' ? 0 : 5, '', 0, pct || 0];
const SCHED = [['الجدول الزمني الرئيسي — تجربة'], [], [], [], HS,
  it('1', 'إدارة المشروع', 'مهمة', '2026-08-03', '2027-07-01'),
  it('1.1', 'وثائق التخطيط', 'مهمة', '2026-08-03', '2026-09-30', 100),
  it('1.2', 'اعتماد الخطة مرجعًا للمواعيد', 'معلم', '2026-11-30', '2026-11-30'),
  it('2', 'المسح', 'مهمة', '2026-09-01', '2026-12-31'),
  it('2.1', 'مسح عرفات', 'مهمة', '2026-09-01', '2026-10-20', 40),
  it('2.2', 'اكتمال تجربة المعلم', 'معلم', '2027-03-31', '2027-03-31', 60),
  it('3', 'التوريد', 'مهمة', '2026-12-15', '2027-02-15'),
  it('3.1', 'صدور التخصيص التجريبي', 'معلم', '2026-11-22', '2026-11-22')];
/* «المواعيد»: titles, two tables, the report date — and rows that are not dates */
const KEYS = [['المواعيد الحاكمة — تجربة'], ['تغيير الخلايا الصفراء ينقل المواعيد'], [], ['م', 'الموعد', 'التاريخ', 'الموافق هجريًا', 'القاعدة', 'الأيام المتبقية'],
  ['١', 'يوم عرفة ١٤٤٨هـ', D('2027-05-15'), '٩ ذو الحجة', 'مُدخل', 230],
  ['٢', 'التعميد وأوامر الشراء', D('2026-12-15'), '٦ رجب', 'مُدخل', 79],
  ['٣', 'بداية العمل الميداني', D('2026-12-22'), '١٣ رجب', 'التعميد + ٧', 86],
  [], ['', 'تاريخ البيانات (تاريخ التقرير)', D('2026-09-27'), 'يُحدَّث أسبوعيًّا', '', ''], [],
  ['', 'ملاحظة', 'التواريخ الهجرية تُقرأ آليًّا', '', '', ''], [],
  ['مواعيد التوريد الجوي على دفعات واستئناف العمل بعد إجازة عيد الفطر'], ['م', 'الموعد', 'التاريخ', 'الموافق هجريًا', 'القاعدة', 'الأيام المتبقية'],
  ['١٨', 'وصول الدفعة الأولى من التوريد الجديد جوًا', D('2027-01-27'), '', '', 122],
  ['١٩', 'بداية إجازة المصانع', '2027-02-01', '', '', 127],
  ['٢٠', 'عددٌ لا تاريخ', 230, '', '', ''],
  ['٢٢', 'استئناف العمل بعد إجازة عيد الفطر', D('2027-03-18'), '', '', 172]];
const WANT = [['يوم عرفة ١٤٤٨هـ', '2027-05-15'], ['التعميد وأوامر الشراء', '2026-12-15'], ['بداية العمل الميداني', '2026-12-22'], ['تاريخ البيانات (تاريخ التقرير)', '2026-09-27'],
  ['وصول الدفعة الأولى من التوريد الجديد جوًا', '2027-01-27'], ['بداية إجازة المصانع', '2027-02-01'], ['استئناف العمل بعد إجازة عيد الفطر', '2027-03-18']];

console.log('\n══ ١ · الشكلُ المسمّى يقرأ مواعيدَه من ورقة «المواعيد» ══');
w.STATE.wbs = { rows:[], keys:[{ n:'موعدٌ قديم', d:'2026-10-15' }] };
let tst = await run(fileOf([['الغلاف', [['غلاف']]], ['المواعيد', KEYS], ['الجدول الزمني الرئيسي', SCHED]]));
const K = w.wbsKeys().map(k => [k.n, k.d]);
T(w.wbsRows().length === 8, 'البنودُ الثمانيةُ من «الجدول الزمني الرئيسي»');
T(JSON.stringify(K) === JSON.stringify(WANT), 'سبعةُ مواعيد بترتيب الورقة من جدوليها وصفِّ تاريخ البيانات — والعناوينُ والملاحظةُ والعددُ لا تُقرأ: ' + K.map(k => k[0]).join('، '));
T(!K.some(k => k[0] === 'موعدٌ قديم'), 'وتستبدل المواعيدَ القديمةَ كلَّها');
T(/٨/.test(tst) && /٧/.test(tst) && /بندًا استُورد/.test(tst) && /موعدًا حاكمًا/.test(tst) && evs.some(e => /استيرادُ الخطة التفصيلية — 8 بندًا · 7 موعدًا حاكمًا/.test(e)), 'والرسالةُ بعدد البنود وعدد المواعيد: ' + tst);
let c = show('wbs');
T(['التعميد وأوامر الشراء', 'بداية العمل الميداني', 'استئناف العمل بعد إجازة عيد الفطر'].every(n => c.textContent.indexOf(n) > -1) && c.textContent.indexOf('2026-12-15') > -1, 'وبطاقاتُ المواعيد فوق الجدول تتحدّث');

console.log('\n══ ٢ · ملفٌّ بلا ورقة «المواعيد» يترك المواعيد كما هي ══');
tst = await run(fileOf([['الجدول الزمني الرئيسي', SCHED]]));
T(w.wbsRows().length === 8 && JSON.stringify(w.wbsKeys().map(k => [k.n, k.d])) === JSON.stringify(WANT) && /المواعيد الحاكمة كما هي/.test(tst), 'البنودُ تتحدّث والمواعيدُ السابقةُ باقية: ' + tst);

console.log('\n══ ٣ · الشكلُ القديم («هيكل تقسيم العمل») كما كان ══');
w.STATE.wbs = { rows:[], keys:[] };
const OLD = [['متابعة مشروع — تجربة'], ['المواعيد الحاكمة', 'يوم عرفة', 'التعميد وأوامر الشراء', 'تاريخ اليوم'], ['التاريخ', D('2027-05-15'), D('2026-12-15'), D('2026-11-21')], [],
  ['هيكل تقسيم العمل', 'اسم المهمة', 'تاريخ البدء', 'تاريخ الانتهاء', 'المدة', 'الإنجاز', 'الحالة', 'الموقف الزمني', 'النوع', 'المسؤول', 'الجهة المعنية'],
  ['1', 'إدارة المشروع', D('2026-08-03'), D('2027-07-01'), 239, 0, '', '', 'مهمة', 'م', 'ج'],
  ['1.1', 'وثائق', D('2026-08-03'), D('2026-09-30'), 43, 100, '', '', 'مهمة', 'م', 'ج'],
  ['1.2', 'اعتماد', D('2026-11-30'), D('2026-11-30'), 0, 0, '', '', 'معلم', 'م', 'ج']];
tst = await run(fileOf([['متابعة المشروع', OLD]]));
T(w.wbsRows().length === 3 && JSON.stringify(w.wbsKeys().map(k => [k.n, k.d])) === JSON.stringify([['يوم عرفة', '2027-05-15'], ['التعميد وأوامر الشراء', '2026-12-15']]) && /٣/.test(tst) && /٢/.test(tst), 'بنودُه ومواعيدُه الحاكمة كما كانت (بلا «تاريخ اليوم»): ' + tst);

console.log('\n══ ٤ · تصديرُ الخطة بالمواعيد كلِّها — بلا قصٍّ على ١١ ══');
w.eval(readFileSync('vendor/exceljs/4.4.0/exceljs.min.js', 'utf8'));
w.STATE.wbs = { rows:w.wbsRows(), keys:Array.from({ length:23 }, (_, k) => ({ n:'موعد ' + (k + 1), d:'2027-01-' + String(k + 1).padStart(2, '0') })) };
let got = null; const Orig = w.ExcelJS.Workbook; w.ExcelJS.Workbook = function(){ const o = new Orig(); got = o; return o; }; w.dl = () => {};
w.wbsExcel(); await wait(800);
const ws0 = got && got.worksheets[0], names = ws0 ? ws0.getRow(2).values.filter(v => /^موعد /.test(String(v))) : [];
T(names.length === 23 && names[22] === 'موعد 23', 'صفُّ المواعيد الحاكمة يحمل الثلاثةَ والعشرين: ' + names.length);
T(!/K\.slice\(0, 11\)/.test(w.wbsExcel.toString()), 'ولا قصَّ في الشيفرة');
w.ExcelJS.Workbook = Orig;

console.log('\n══ ٥ · «المعالم والتسليم» تقرأ معالمَ الخطة ══');
w.STATE.wbs = { rows:[], keys:[] };
T(w.mileList().length === 8 && w.mileList()[0].id === 'M1' && !w.mileList().some(m => m.plan), 'بلا خطة: المعالمُ الثمانيةُ المضمَّنة بديلٌ كما كانت');
await run(fileOf([['المواعيد', KEYS], ['الجدول الزمني الرئيسي', SCHED]]));
const ML = w.mileList();
T(ML.length === 3 && ML.every(m => m.plan) && ML.map(m => m.id).join() === '3.1,1.2,2.2', 'بخطة: معالمُها الثلاثةُ (نوعُها «معلم») بترتيب تواريخها: ' + ML.map(m => m.id).join('، '));
T(ML.map(w.mileDateOf).join() === '2026-11-22,2026-11-30,2027-03-31' && Math.round(w.mileDone(ML[2]) * 100) === 60, 'وتواريخُها من الجدول وإنجازُها كما تقيسه صفحةُ الخطة (٦٠٪)');
T(Math.round(ML.reduce((a, m) => a + m.w, 0)) === 100, 'وأوزانُها متساويةٌ مجموعُها مئة');
c = show('plan', 'miles');
T(!!d.getElementById('mlFromPlan') && c.textContent.indexOf('اكتمال تجربة المعلم') > -1 && c.textContent.indexOf('2027-03-31') > -1 && !c.querySelector('[data-mlnew]') && !c.querySelector('[data-mledit]') && !c.querySelector('[data-mld]'),
  'الشريحةُ تعرضها بتواريخها وتقول إنها من الخطة — ولا إضافةَ ولا تعديلَ هنا (تُعدَّل في الخطة)');
as('viewer'); c = show('plan', 'miles');
T(c.textContent.indexOf('صدور التخصيص التجريبي') > -1 && c.textContent.indexOf('2026-11-22') > -1 && c.textContent.indexOf('M1') < 0, 'والوزارةُ ترى معالمَ الخطة لا المعالمَ المضمَّنة');
{ const card = w.mfuMilesCard();
  T(card.indexOf('2026-11-30') > -1 && card.indexOf('2027-03-31') > -1, 'و«المعالم القادمة» في متابعة الوزارة بتواريخها — لا بتاريخ اليوم لكلِّها');
  const t = w.SHEETS.miles();
  T(t[0].indexOf('الموعد المستهدف') > -1 && t.slice(1).map(r => r[4]).join() === '2026-11-22,2026-11-30,2027-03-31', 'وإكسلُ المعالم يحمل الموعدَ المستهدف'); }
as('engineer');
T(errs.length === 0, 'بلا أخطاء في الصفحة' + (errs.length ? ': ' + errs[0] : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ مواعيد الخطة ومعالمها نظيف ✅'); try { dom.window.close(); } catch {} process.exit(0);
