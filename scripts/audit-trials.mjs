/* ═══════════════════════════════════════════════════════════════════════════
   جردُ دفتر التجارب — node scripts/audit-trials.mjs
   ───────────────────────────────────────────────────────────────────────────
   التجربةُ مصروفٌ ووقتٌ قبل أن تصير عملًا (V16.96). يُثبَت هنا بالرسم الحقيقيّ:
   الشريحةُ في القسم المالي، وكلُّ ريالٍ يُربَط بتجربته وكلُّ ساعةٍ تُسجَّل،
   و**المفتاحُ يقرِّر** أيدخل مصروفُ التجارب في المنصرف المعتمد أم يبقى
   مسجَّلًا خارجَه — يُبدَّل متى شئت ولا يُعاد تسجيلُ شيء؛ ولا يُحذَف دفترُ
   تجربةٍ عليها مشتريات؛ والقرارُ يُزامَن كوثيقةِ إعداداتٍ لا مجموعةٍ جديدة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n);
  /* ما يسقط يُكتَب تعليقًا على السير — يُقرأ بلا فتح السجلّ (V17.3) */
  if (!c){ bad++; console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
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
const wrote = {};
w.CORE.set = (k, id, v) => { wrote[k + '/' + id] = v; if (k === 'buys'){ w.STATE.buys = w.STATE.buys || {}; w.STATE.buys[id] = v; } };
w.CORE.saveSoon = () => {};
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };

w.STATE.meta.name = 'م. فحص'; w.STATE.buys = {};
/* صارت صفحةً في «التخطيط» لا شريحةً في القسم المالي (V17.12) */
T(w.PAGE.trials && w.PAGE.trials.m === 'التخطيط', 'التجاربُ صفحةٌ في «التخطيط»: ' + (w.PAGE.trials || {}).m);
T(w.TABS.ipc.every(tb => tb[0] !== 'trials'), 'ولم تبقَ شريحةً في القسم المالي');
w.goPage('trials'); w.render(1); await wait(250);
const main = d.getElementById('main') || d.body;
T(/التجارب/.test(main.textContent) && !!main.querySelector('[data-trnew]'), 'شريحةُ التجارب في القسم المالي');

/* تسجيلُ تجربةٍ بساعاتها */
d.getElementById('trN').value = 'قارئ جديد — مدى القراءة';
d.getElementById('trH').value = '3';
d.getElementById('trNote').value = 'قرأ على مترين لا ثلاثة';
click('[data-trnew]'); await wait(150);
const R = w.trialRows();
T(R.length === 1 && R[0].n === 'قارئ جديد — مدى القراءة' && +R[0].hours === 3 && R[0].by === 'م. فحص',
  'تُسجَّل باسمها وساعاتها وكاتبها');
T(!!wrote['cfg/trials'] && Array.isArray(wrote['cfg/trials'].rows), 'وتُزامَن كوثيقةِ إعدادات — لا مجموعةٌ جديدة');
const tid = R[0].id;
click('[data-trh="' + tid + '|0.5"]'); await wait(120);
T(+w.trialOf(tid).hours === 3.5, 'والساعاتُ تُزاد بضغطةٍ من البطاقة');

/* ريالٌ يُربَط بتجربته */
w.goPage('ipc'); w.render(1); await wait(150); w.PTAB.ipc = 'buys'; w.render(1); await wait(200);
const sel = d.getElementById('byTrial');
T(!!sel && sel.options.length === 2, 'ونموذجُ الشراء يسأل: لأيِّ تجربة؟');
d.getElementById('byItem').value = 'قارئ تجريبيّ';
d.getElementById('byAmt').value = '1200';
d.getElementById('byCat').selectedIndex = 0; d.getElementById('bySup').selectedIndex = 0;
sel.value = tid;
click('[data-byadd]'); await wait(150);
const b = Object.keys(w.STATE.buys).map(k => w.STATE.buys[k])[0];
T(!!b && b.trial === tid && +b.amt === 1200, 'فيُحفَظ الشراءُ موسومًا بتجربته');
T(w.trialSpend(tid) === 1200 && w.trialsSpend() === 1200, 'ومصروفُ التجربة يُجمَع وحدَه');

/* المفتاح: يدخل أو لا يدخل — والدفترُ كما هو */
w.STATE.buys[b.id].st = 'معتمد';
T(w.trialInCost() === false && w.buysSpent() === 0, 'وهو خارجُ المنصرف ما دام المفتاحُ مرفوعًا');
w.trialToggleCost(); await wait(120);
T(w.trialInCost() === true && w.buysSpent() === 1200, 'فإذا وُضع دخل في المنصرف المعتمد');
w.trialToggleCost(); await wait(120);
T(w.buysSpent() === 0 && w.trialSpend(tid) === 1200, 'وإذا رُفع خرج — والمصروفُ باقٍ في دفتره لا يُمحى');
const other = { id:'b2', item:'كابل', cat:'', sup:'', amt:500, st:'معتمد', at:Date.now() };
w.STATE.buys.b2 = other;
T(w.buysSpent() === 500, 'وما ليس لتجربةٍ يُحسَب دائمًا');

/* ═══ أصنافُ التجربة وإجمالياتُها (V17.7) ═══ */
w.goPage('trials'); w.render(1); await wait(200);
d.getElementById('itN' + tid).value = 'هوائي تجريبيّ';
d.getElementById('itQ' + tid).value = '3';
d.getElementById('itP' + tid).value = '250';
click('[data-tritem="' + tid + '"]'); await wait(150);
const it = w.trialItems(w.trialOf(tid));
T(it.length === 1 && it[0].n === 'هوائي تجريبيّ' && +it[0].q === 3 && +it[0].p === 250, 'الصنفُ يُسجَّل بكميته وسعرِ وحدته');
T(w.itemsSum(w.trialOf(tid)) === 750, 'وإجماليُّ السطر كميةٌ في سعر: ٧٥٠');
T(w.trialTotal(w.trialOf(tid)) === 750 + 1200, 'وإجماليُّ التجربة = أصنافُها + مشترياتُها المربوطة');
d.getElementById('itN' + tid).value = 'كابل';
d.getElementById('itQ' + tid).value = '2';
d.getElementById('itP' + tid).value = '40';
click('[data-tritem="' + tid + '"]'); await wait(150);
T(w.itemsSum(w.trialOf(tid)) === 830 && w.trialsItemsSpend() === 830, 'والأصنافُ تتراكم في التجربة وفي الدفتر');
w.render(1); await wait(150);
const mtxt = (d.getElementById('main') || d.body).textContent.replace(/\s+/g, ' ');
T(/أصناف التجربة/.test(mtxt) && /إجمالي الأصناف/.test(mtxt) && /إجمالي التجربة/.test(mtxt), 'والبطاقةُ تطبع الأصنافَ وإجماليَّها وإجماليَّ التجربة');
T(/إجماليُّ التجارب/.test(mtxt), 'والشريطُ يطبع إجماليَّ التجارب كلِّها');
T(w.trialsTotal() === 830 + 1200, 'وإجماليُّ التجارب = أصنافُ الكلِّ + مشترياتُ الكلّ');
/* المفتاحُ يحكم الأصنافَ كما يحكم المشتريات */
T(w.trialInCost() === false && w.buysSpent() === 500, 'والأصنافُ خارجُ المنصرف ما دام المفتاحُ مرفوعًا');
w.trialToggleCost(); await wait(120);
T(w.buysSpent() === 500 + 1200 + 830, 'فإذا وُضع دخل الصنفُ والشراءُ معًا');
w.trialToggleCost(); await wait(120);
/* الحذف */
click('[data-tridel="' + tid + '|1"]'); await wait(150);
T(w.trialItems(w.trialOf(tid)).length === 1 && w.itemsSum(w.trialOf(tid)) === 750, 'وصنفٌ يُحذَف وحدَه فيُعاد الحساب');

/* الحذفُ مشروط */
w.goPage('trials'); w.render(1); await wait(200);
T(!d.querySelector('[data-trdel="' + tid + '"]'), 'ولا يُعرَض حذفُ تجربةٍ عليها مشتريات');
w.trialRemove(tid);
T(w.trialRows().length === 1, 'ولو طُلب لم يُنفَّذ');
const rules = readFileSync('firestore.rules', 'utf8');
T(/match \/settings\/\{id\}/.test(rules), 'ووثيقتُها تحت قاعدة الإعدادات القائمة');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ دفتر التجارب فشل ✗ (${bad})` : '\nكلُّ ريالٍ وساعةٍ في دفترها، والقرارُ مفتاحٌ واحد ✅');
process.exit(bad ? 1 : 0);
