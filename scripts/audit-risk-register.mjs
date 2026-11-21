/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سجل المخاطر الداخلي — node scripts/audit-risk-register.mjs   (V47.16)
   ───────────────────────────────────────────────────────────────────────────
   طلبُ المالك: «سجل المخاطر» يطابق سجلَّ المخاطر الداخلي (الإصدار ٦) ويُستورَد من
   إكسل. على بياناتٍ معلومةِ الجواب: الحالاتُ الثلاث، وقاعدةُ المستوى ٢٠/١٢/٦
   و«وقع فعلًا» مستوًى مستقل، وطريقةُ الإدارة من المستوى، والموعدُ هجريٌّ فوق
   ميلاديّ والأيامُ المتبقية من اليوم، والاستيرادُ بالأسماء صارمًا وبخطوتين،
   والتصديرُ بالأعمدة نفسِها يعود كما خرج، والسجلاتُ القديمة تُفتَح، والسجلُّ
   داخليٌّ: لا تقرؤه الوزارةُ ولا يظهر منه شيءٌ في صفحاتها.
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
const html = await appHtml();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
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
const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };
const as = r => { w.ROLE = r; w.STATE.meta.role = r; };
const show = (p, tab) => { w.goPage(p); if (tab) w.CUR = tab; w.render(1); return d.getElementById('content'); };
const click = sel => { const b = d.querySelector(sel); if (b) b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return !!b; };
const today = w.dayKey(Date.now()), dPlus = n => w.dayKey(Date.now() + n * 864e5);
const two = iso => { const p = iso.split('-'); return w.riskHijri(iso) + 'هـ\n' + p[2] + '/' + p[1] + '/' + p[0] + 'م'; };
as('engineer'); w.STATE.meta.name = 'مهندس';

console.log('\n══ ١ · السجلاتُ القديمة تُفتَح قبل أيِّ استيراد ══');
w.STATE.risks = [];
let c = show('plan', 'risks');
const seed = w.risksList();
T(seed.length === 8 && ['R1', 'R8'].every(id => c.textContent.indexOf(id) > -1) && errs.length === 0, 'البذرةُ R1…R8 تُرسَم بلا خطأ');
T(seed.filter(r => r.st === 'مفتوح').every(r => w.riskSt(r) === 'قائم') && w.riskSt({ st:'مغلق' }) === 'مغلق', '«مفتوح» القديمةُ تُقرأ «قائم»، و«مغلق» كما هي');
T(w.riskLv(seed[0]).t === 'مرتفع' && w.riskLv(seed[4]).t === 'متوسط' && w.riskLv(seed[6]).t === 'مغلق', 'ومستوياتُها بالقاعدة الجديدة: ١٢ مرتفع، ٨ متوسط، والمغلقُ «مغلق»');

console.log('\n══ ٢ · القاعدةُ وطريقةُ الإدارة كما في معادلة السجل ══');
T([[25, 'حرج'], [20, 'حرج'], [19, 'مرتفع'], [12, 'مرتفع'], [11, 'متوسط'], [6, 'متوسط'], [5, 'منخفض'], [1, 'منخفض']].every(([n, k]) => w.riskLevel(n).t === k), 'الدرجة: ٢٠ فأعلى حرج، ١٢–١٩ مرتفع، ٦–١١ متوسط، دونها منخفض');
T(w.riskLevel(25, 'وقع فعلًا').t === 'وقع فعلًا' && w.riskLevel(4, 'وقع فعلا').t === 'وقع فعلًا' && w.riskLevel(25, 'مغلق').t === 'مغلق', '«وقع فعلًا» مستوًى مستقلٌّ بأيِّ درجة (ولو كُتب بلا تنوين)، والمغلقُ «مغلق»');
T(w.riskMethod('وقع فعلًا') === 'مشكلة قائمة تُدار بالتصعيد' && w.riskMethod('حرج') === 'قرار من الإدارة خلال أسبوع' && w.riskMethod('مرتفع') === 'إجراء بمسؤول وموعد ومتابعة أسبوعية'
  && w.riskMethod('مغلق') === 'لا شيء' && w.riskMethod('متوسط') === 'متابعة كل أسبوعين' && w.riskMethod('منخفض') === 'متابعة كل أسبوعين', 'طريقةُ الإدارة بنصِّ السجل لكلِّ مستوى');

console.log('\n══ ٣ · الاستيرادُ بأسماء الأعمدة — من ورقة «سجل المخاطر» ══');
const HEAD = ['الرقم', 'الخطر', 'الوضع الآن', 'الاحتمال', 'الأثر', 'الحالة', 'المستوى', 'طريقة الإدارة', 'الإجراء', 'المسؤول', 'الموعد', 'الأيام المتبقية', 'المرجع'];
const D5 = dPlus(5), Dm3 = dPlus(-3), D10 = dPlus(10), Dold = dPlus(-30);
const ROWS = [
  ['خ-٠١', 'خطرُ تجربةٍ حرج', 'الوضعُ الآن في سطرين\nوالثاني', 5, 5, 'قائم', 'منخفض', 'قيمةٌ قديمة تُهمَل', 'إجراءٌ أ', 'المسؤول أ', two(D5), 999, 'مرجعٌ أ'],
  ['خ-٠٢', 'خطرٌ مرتفع تجاوز موعده', '', 3, 4, 'قائم', '', '', 'إجراءٌ ب', 'المسؤول ب', two(Dm3), '', 'مرجعٌ ب'],
  ['خ-٠٣', 'خطرٌ متوسط بتاريخٍ مسجَّل', '', 2, 3, 'قائم', '', '', '', '', new w.Date(D10 + 'T00:00:00'), '', ''],
  ['خ-٠٤', 'خطرٌ منخفض بلا موعد', '', 1, 5, 'قائم', '', '', '', '', '', '', ''],
  ['خ-٠٥', 'خطرٌ وقع', '', 4, 4, 'وقع فعلا', '', '', 'تصعيد', 'الإدارة', two(D5), '', ''],
  ['خ-٠٦', 'خطرٌ أُغلق', '', 5, 5, 'مغلق', '', '', '', '', two(Dold), '', ''],
  ['خ-٠٧', 'خطرٌ قديمٌ «مفتوح» بأرقامٍ عربية', '', '٤', '٣', 'مفتوح', '', '', '', '', '', '', '']
];
const EXP = [['خ-٠١', 'حرج', 5], ['خ-٠٢', 'مرتفع', -3], ['خ-٠٣', 'متوسط', 10], ['خ-٠٤', 'منخفض', null], ['خ-٠٥', 'وقع فعلًا', 5], ['خ-٠٦', 'مغلق', null], ['خ-٠٧', 'مرتفع', null]];
const book = (aoa, sheet) => { const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa, { cellDates:true }), sheet || 'سجل المخاطر'); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['ملخص']]), 'الملخص'); return X.read(X.write(wb, { type:'array', bookType:'xlsx', cellDates:true }), { type:'array', cellDates:true }); };
const regAoa = [['سجل مخاطر مشروع التجربة'], ['المستوى من حاصل ضرب الاحتمال في الأثر…'], [], HEAD].concat(ROWS, [[], ['', '']]);
const R = w.riskImportWb(book(regAoa));
T(!R.err && R.list.length === 7 && R.list.map(x => x.id).join() === EXP.map(e => e[0]).join(), 'سبعةُ مخاطر بمعرّفاتها كما في الملف (خ-٠١…) — العنوانُ والملاحظةُ والسطرُ الفارغ لا تُقرأ');
const lvOk = R.list.every((x, k) => w.riskLv(x).t === EXP[k][1]), dayOk = R.list.every((x, k) => w.riskDays(x) === EXP[k][2]);
T(lvOk, 'المستوى يُحسَب من الاحتمال والأثر والحالة — والعمودُ المكتوبُ في الملف يُهمَل: ' + R.list.map(x => w.riskLv(x).t).join('، '));
T(dayOk, 'الأيامُ المتبقية من اليوم: ٥ و−٣ و١٠، ولا أيامَ لمغلقٍ أو بلا موعد: ' + R.list.map(x => w.riskDays(x)).join('، '));
T(R.list[0].due === D5 && R.list[2].due === D10 && R.list[3].due === '' && R.list[0].ctx === 'الوضعُ الآن في سطرين\nوالثاني' && R.list[0].ref === 'مرجعٌ أ' && R.list[0].plan === 'إجراءٌ أ' && R.list[0].own === 'المسؤول أ',
  'الموعدُ من سطره الميلاديّ (أو من خلية التاريخ)، والوضعُ الآن بسطوره، والمرجعُ والإجراءُ والمسؤول');
T(R.list[4].st === 'وقع فعلًا' && R.list[6].st === 'قائم' && R.list[6].p === 4 && R.list[6].i === 3, '«وقع فعلا» تُحفَظ بنصِّ الخيار، و«مفتوح» تُحفَظ «قائم»، والأرقامُ العربيةُ أرقام');
{ const order = [0, 12, 10, 9, 8, 1, 2, 3, 4, 5, 6, 7, 11];   /* the same columns in another order */
  const sh = regAoa.map(r => (r.length >= 13 ? order.map(i => r[i]) : r)); const R2 = w.riskImportWb(book(sh));
  T(!R2.err && JSON.stringify(R2.list) === JSON.stringify(R.list), 'الأعمدةُ بأسمائها لا بمواضعها: ترتيبٌ آخرُ يُقرأ كما هو'); }
{ const bad = regAoa.map((r, k) => (k === 5 ? r.map((v, i) => (i === 3 ? 7 : v)) : r)); const Rb = w.riskImportWb(book(bad));
  const dup = regAoa.map((r, k) => (k === 6 ? r.map((v, i) => (i === 0 ? 'خ-٠١' : v)) : r)); const Rd = w.riskImportWb(book(dup));
  const Rs = w.riskImportWb(book(regAoa, 'ورقةٌ أخرى')); const Rh = w.riskImportWb(book(regAoa.filter((r, k) => k !== 3)));
  T(/خ-٠٢/.test(Rb.err || '') && /الاحتمال/.test(Rb.err || '') && /مكرر/.test(Rd.err || '') && /سجل المخاطر/.test(Rs.err || '') && /الرقم/.test(Rh.err || ''),
    'صارم: احتمالٌ خارج ١–٥ أو معرّفٌ مكرّر أو ورقةٌ غائبة أو صفُّ عناوين غائب — يوقف الاستيرادَ ويسمّي الصفّ'); }

console.log('\n══ ٤ · بخطوتين: الملفُّ ينتظر التأكيد ثم يستبدل السجلَّ كلَّه ══');
const fileOf = aoa => new w.File([X.write(X.utils.book_new() && (() => { const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa, { cellDates:true }), 'سجل المخاطر'); return wb; })(), { type:'array', bookType:'xlsx', cellDates:true })], 'سجل المخاطر — تجربة.xlsx');
w.riskImport(fileOf(regAoa)); await wait(400);
c = show('plan', 'risks');
const wait1 = d.getElementById('rkImpWait');
T(!!wait1 && /تجربة/.test(wait1.textContent) && /٧/.test(wait1.textContent) && w.risksList().length === 8 && !!d.querySelector('[data-rkimpok]'), 'الملفُّ يُقرأ ويقف: «سيُستبدل السجل كله» بعدده ومستوياته، والسجلُّ لم يتغيّر بعد');
click('[data-rkimpx]'); await wait(30);
T(!w.PV.RISK_IMP && w.risksList().length === 8 && !d.getElementById('rkImpWait'), '«إلغاء» يتركه كما كان');
w.riskImport(fileOf(regAoa)); await wait(400); show('plan', 'risks'); wrote.length = 0;
click('[data-rkimpok]'); await wait(40);
const L = w.risksList(), sv = wrote.filter(r => r[0] === 'cfg' && r[1] === 'risks').slice(-1)[0];
T(L.length === 7 && L[0].id === 'خ-٠١' && L.every(x => x.at > 0) && evs.some(e => e === 'استيراد سجل المخاطر — 7 خطرًا'), 'التأكيدُ يستبدل السجلَّ كلَّه (٧) ويسجّل «استيراد سجل المخاطر — ٧ خطرًا»');
T(!!sv && sv[2]._len === 7 && sv[2]['6'] && sv[2]['6'].id === 'خ-٠٧' && !Array.isArray(sv[2]), 'ويُحفَظ في settings/risks بطوله (_len) — فلا يعود ذيلُ سجلٍّ أطولَ من قبل');

console.log('\n══ ٥ · الجدولُ بأعمدة السجل الداخلي ══');
c = show('plan', 'risks');
const tb = [...c.querySelectorAll('table')].find(x => /طريقة الإدارة/.test(x.querySelector('thead') ? x.querySelector('thead').textContent : '') && x.querySelectorAll('tbody tr').length === 7);
const heads = tb ? [...tb.querySelectorAll('thead th')].map(x => x.textContent.trim()) : [];
T(heads.join('|') === 'الرقم|الخطر|الاحتمال|الأثر|المستوى|طريقة الإدارة|الإجراء|المسؤول|الموعد|الأيام المتبقية|الحالة', 'الأعمدةُ بالترتيب المطلوب: ' + heads.join('، '));
const rowOf = id => tb ? [...tb.querySelectorAll('tbody tr')].find(tr => tr.firstChild && tr.firstChild.textContent.trim() === id) : null;
const r1 = rowOf('خ-٠١'), r2 = rowOf('خ-٠٢'), r6 = rowOf('خ-٠٦');
T(!!r1 && /الوضعُ الآن في سطرين/.test(r1.children[1].textContent) && r1.children[1].querySelector('.hint') && /قرار من الإدارة خلال أسبوع/.test(r1.children[5].textContent), 'الوضعُ الآن تحت الخطر بخطٍّ صغير، وطريقةُ الإدارة عمود');
const hj = w.riskDig(w.riskHijri(D5)), gr = w.riskDig(D5.split('-').reverse().join('/'));
T(!!r1 && r1.children[8].textContent.indexOf(hj + 'هـ') > -1 && r1.children[8].textContent.indexOf(gr + 'م') > -1, 'الموعدُ هجريٌّ وجنبه الميلاديّ: ' + (r1 ? r1.children[8].textContent : ''));
T(!!r2 && !!r2.children[9].querySelector('.pill.off') && !(r1.children[9].querySelector('.pill.off')) && r6 && r6.children[9].textContent.trim() === '—', 'الأيامُ المتبقيةُ حمراءُ لمن فات موعدُه وليس مغلقًا، ولا أيامَ للمغلق');
T(!!c.querySelector('[data-rkst="خ-٠١"]') && [...c.querySelectorAll('[data-rkst="خ-٠١"] option')].map(o => o.value).join() === 'قائم,وقع فعلًا,مغلق', 'الحالةُ ثلاثُ قيمٍ قيمتُها نصُّ الخيار');
T(!!c.querySelector('[data-rkfile]') && !!c.querySelector('[data-xls="risks"]'), 'زرُّ «⬆ استيراد من إكسل» جنب زرِّ التصدير');
{ const stx = [...c.querySelectorAll('.stat')].map(s => s.textContent.replace(/\s+/g, ' ')).join(' | ');
  T(/حرجة ?١/.test(stx) && /مرتفعة ?٢/.test(stx) && /وقعت فعلًا ?١/.test(stx) && /تجاوزت موعدها ?١/.test(stx) && /مغلقة ?١/.test(stx), 'الإحصاءاتُ بالقاعدة نفسِها: ' + stx); }

console.log('\n══ ٦ · التصديرُ بأعمدة الاستيراد ويعود كما خرج ══');
const rows = w.SHEETS.risks();
T(rows[0].join('|') === HEAD.join('|') && rows.length === 8 && rows[1][10] === two(D5) && rows[1][6] === 'حرج' && rows[1][7] === 'قرار من الإدارة خلال أسبوع' && rows[1][11] === 5, 'الورقةُ بأعمدة السجل نفسِها وبترتيبه، والموعدُ هجريٌّ فوق ميلاديٍّ كما في الملف');
{ const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(rows), w.PV.SHEET_NAMES.risks); const R3 = w.riskImportWb(X.read(X.write(wb, { type:'array', bookType:'xlsx' }), { type:'array', cellDates:true }));
  const K = ['id', 't', 'ctx', 'p', 'i', 'st', 'plan', 'own', 'due', 'ref'];
  T(!R3.err && R3.list.length === 7 && R3.list.every((x, k) => K.every(f => String(x[f] == null ? '' : x[f]) === String(L[k][f] == null ? '' : L[k][f]))), 'تصديرُ السجل ثم استيرادُه يُخرجان المحتوى نفسَه'); }

console.log('\n══ ٧ · الإضافةُ بحقول السجل وتكمل نمطَ معرّفاته ══');
show('plan', 'risks');
d.getElementById('rkT').value = 'خطرٌ جديدٌ من النموذج'; d.getElementById('rkX').value = 'وضعُه الآن'; d.getElementById('rkP').value = '4'; d.getElementById('rkI').value = '5';
d.getElementById('rkD').value = D10; d.getElementById('rkRf').value = 'مرجعُه'; d.getElementById('rkPl').value = 'إجراؤه'; d.getElementById('rkO').value = 'مسؤولُه';
T(d.getElementById('rkC').value === '' && d.getElementById('rkR').value === '' && /—/.test(d.getElementById('rkC').options[0].textContent), 'الفئةُ والاستجابةُ اختياريتان: فارغتان تظهران «—»');
click('[data-rkadd]'); await wait(30);
const nw = w.risksList().slice(-1)[0];
T(nw.id === 'خ-٠٨' && nw.ctx === 'وضعُه الآن' && nw.due === D10 && nw.ref === 'مرجعُه' && nw.st === 'قائم' && !nw.cat && w.riskLv(nw).t === 'حرج', 'الخطرُ الجديدُ «خ-٠٨» بوضعه وموعده ومرجعه، ومستواه «حرج» (٢٠)');
T(w.riskNextId([{ id:'R1' }, { id:'R2' }]) === 'R3' && w.riskNextId([{ id:'خ-٠٩' }, { id:'خ-١٦' }]) === 'خ-١٧', 'والنمطُ: بعد «خ-١٦» «خ-١٧»، وسجلٌّ على R يكمل R');

console.log('\n══ ٨ · داخليٌّ لأفاقي — لا يصل الوزارة ══');
as('supervisor'); const imp0 = w.PV.RISK_IMP; toasts.length = 0; w.riskImport(fileOf(regAoa)); await wait(200);
T(w.PV.RISK_IMP === imp0 && toasts.some(m => /للمهندس/.test(m)), 'المشرفُ لا يستورد');
as('exec'); c = show('plan', 'risks');
T(w.riskSees() && /خ-٠١/.test(c.textContent) && !c.querySelector('[data-rkfile]') && !c.querySelector('[data-rkp]'), 'الإدارةُ العليا تقرأ السجلَّ ولا تعدّل ولا تستورد');
as('acct'); c = show('exec');
T(!w.riskSees() && !/مخاطر حرجة|ما يحتاج قرارَك/.test(c.textContent), 'المحاسبُ يرى التقاريرَ التنفيذيةَ بلا شيءٍ من السجل');
as('viewer');
T(!w.riskSees() && !w.tabsOf('plan').some(tb => tb[0] === 'risks') && !w.seesPage('risks') && w.SHEETS.risks().length === 0 && w.expAllowed('risks') === false, 'الوزارة: لا شريحة ولا ورقةَ إكسل ولا تصدير');
{ let txt = ''; for (const tb of w.tabsOf('mfu')){ txt += show('mfu', tb[0]).textContent; } txt += show('plan', 'miles').textContent + show('wbs').textContent;
  T(txt.length > 2000 && !/خ-٠\d|خطرُ تجربةٍ حرج|خطرٌ مرتفع تجاوز موعده|سجل المخاطر/.test(txt), 'ولا شيءَ منه في صفحاتها: متابعةُ الوزارة بشرائحها والمعالمُ والخطةُ التفصيلية'); }
as('engineer');

console.log('\n══ ٩ · القاعدةُ والمزامنةُ تحرسان الوثيقة ══');
const rules = readFileSync('firestore.rules', 'utf8'), rt = readFileSync('scripts/rules-test.mjs', 'utf8');
T(/match \/settings\/risks \{ allow read: if mgr\(\) \|\| \(ok\(\) && role\(\) == 'exec'\); allow write: if pm\('settings', 'w', mgr\(\)\); \}/.test(rules)
  && /allow read: if ok\(\) && [^;]*id != 'risks'/.test(rules) && /allow write: if pm\('settings', 'w', mgr\(\)\) && [^;]*id != 'risks'/.test(rules), 'settings/risks للمهندس والمدير والإدارة العليا وحدَهم، ومستثنًى من القاعدة العامة');
T(/getDoc\(doc\(as\('vwr'\), 'settings\/risks'\)\)/.test(rt) && /deny\('ولا تقرؤه الوزارة'/.test(rt), 'ومحاكي القواعد يتحقّق أن الوزارة لا تقرؤه');
T(/if \(riskSees\(\)\) FB\.sdoc\('risks'/.test(html) && /typeof dv\._len === 'number'\) arr = arr\.slice\(0, dv\._len\)/.test(html), 'والمزامنةُ لا تطلبه إلا لمن يقرؤه، وتقرأ طولَه المحفوظ');
T(errs.length === 0, 'بلا أخطاء في الصفحة' + (errs.length ? ': ' + errs[0] : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ سجل المخاطر الداخلي نظيف ✅'); try { dom.window.close(); } catch {} process.exit(0);
