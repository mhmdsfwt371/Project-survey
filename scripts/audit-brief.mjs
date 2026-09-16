/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التفاصيل المختصرة — node scripts/audit-brief.mjs
   ───────────────────────────────────────────────────────────────────────────
   طبقةٌ رابعةٌ بجوار المسح والتركيب والفك (V16.88): سطرٌ لكلِّ نقطةٍ زارها
   الميدان — «تمام» أو «تحدٍّ» أو «ملاحظة» — بلونه، تُضغَط فتُقرأ. يُثبَت هنا
   بالرسم الحقيقيّ: الطبقةُ في شريط الخريطة، والوزارةُ تراها وتكتبها،
   واللونُ يتبع الحالةَ، والنافذةُ تعرض الخبرَ قبل البيانات، والسطرُ يُحفَظ
   على وثيقة الزيارة نفسِها (فيُزامَن ويُنسَخ بقواعده كما هي).
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

T(!!w.LAYERS.brief && w.LAYERS.brief.kind === 'brief', 'الطبقةُ مسجَّلةٌ بجوار المسح والتركيب والفك');
const html0 = w.mapUIHtml();
T(html0.indexOf('data-mode="brief"') > -1, 'وشريحتُها على شريط الخريطة');

/* نقطتان مزارتان وثالثةٌ لم تُزَر */
w.STATE.sites = [
  { id:'C1', name:'مخيم ١', zone:'منى', type:'مخيم', lat:21.41, lng:39.89 },
  { id:'C2', name:'مخيم ٢', zone:'منى', type:'مخيم', lat:21.412, lng:39.892 },
  { id:'C3', name:'مخيم ٣', zone:'منى', type:'مخيم', lat:21.413, lng:39.893 }
];
const done = { st:'تمت الزيارة', by:'فني', at:Date.now() };
w.STATE.recs = { C1:Object.assign({}, done), C2:Object.assign({}, done) };
w.CORE.set = (k, id, v) => { w.STATE[k][id] = v; w.__wrote = k; };
w.STATE.meta.name = 'م. فحص';
w.FILT_CACHE = null; w.FILT_KEY = '';     /* قائمةُ النقاط مخبَّأةٌ — تُبطَل بعد استبدالها */
w.FIELD_MODE = 'brief'; w.render(1); await wait(150);

const L = w.layerFiltered().map(x => x.id);
T(L.length === 2 && L.indexOf('C3') < 0, 'الطبقةُ تعرض ما تمّت زيارتُه وحدَه: ' + L.join(','));
/* ═══ اللونُ مرحلةُ الاعتماد (V16.90) — والإطارُ خبرُ السطر ═══ */
T(w.mapColorOf(w.siteFind('C1')) === '#4FA3FF', 'المسوحةُ التي تنتظر الاعتمادَ التقنيَّ زرقاء');
w.STATE.recs.C2.review = 'approved';
T(w.briefStage('C2') === 'min' && w.mapColorOf(w.siteFind('C2')) === '#E8C34B', 'والمعتمَدةُ تقنيًّا التي تنتظر الوزارةَ صفراء — وهي ما كان لا يُرى');
w.STATE.recs.C2.minReview = 'approved';
T(w.briefStage('C2') === 'ok' && w.mapColorOf(w.siteFind('C2')) === '#3AD6A0', 'وما اعتمدته الوزارةُ خضراء');
w.STATE.recs.C2.minReview = 'returned';
T(w.mapColorOf(w.siteFind('C2')) === '#E05252', 'وما أعادته الوزارةُ حمراء');
T(w.mapColorOf(w.siteFind('C3')) === '#6B7A87', 'وما لم يُزَر رمادية');
/* المتعذّرُ والمردودُ خبرٌ يُرى — لا نقطةٌ غائبةٌ عن الطبقة (V16.95) */
w.STATE.recs.C3 = { st:'لم يتم الوصول', access:'لم يتم الوصول', accessWhy:'بوابةٌ مغلقة', by:'فنيُّ الميدان', at:Date.now() };
w.FILT_CACHE = null; w.FILT_KEY = '';
T(w.briefStage('C3') === 'blocked' && w.mapColorOf(w.siteFind('C3')) === '#E07B39', 'ما تعذّر الوصولُ إليه يظهر بلونه (برتقاليّ) لا يختفي');
T(w.layerFiltered().map(x => x.id).indexOf('C3') > -1, 'والطبقةُ تعرضه — فهي تقول ما وقع لا ما تمَّ فقط');
w.STATE.recs.C3.review = 'revisit';
T(w.briefStage('C3') === 'revisit' && w.mapColorOf(w.siteFind('C3')) === '#C77DFF', 'والمردودُ لزيارةٍ أخرى ببنفسجيّه');
w.POP_SITE = 'C3'; w.POP_OPEN = true; w.render(1); await wait(140);
T(/بوابةٌ مغلقة/.test(d.getElementById('pkPop').textContent), 'وبطاقتُه تقول سببَ التعذُّر كما كتبه الميدان');
T(!!d.querySelector('#pkPop [data-bst]'), 'ويُكتَب له سطرٌ كغيره');
delete w.STATE.recs.C3; w.FILT_CACHE = null; w.FILT_KEY = ''; w.POP_OPEN = false;
w.STATE.recs.C2.review = ''; delete w.STATE.recs.C2.minReview;

/* الكتابة: حالةٌ وسطرٌ على وثيقة الزيارة */
w.briefSet('C1', 'تحدٍّ', 'الكابل لم يصل — الشركة وعدت غدًا');
const r1 = w.STATE.recs.C1;
T(r1.bst === 'تحدٍّ' && r1.brief === 'الكابل لم يصل — الشركة وعدت غدًا' && r1.briefBy === 'م. فحص' && r1.briefAt > 0,
  'تُكتَب على وثيقة الزيارة نفسِها باسم كاتبها ووقته — لا في مجموعةٍ جديدة');
T(w.__wrote === 'recs', 'فتُزامَن وتُنسَخ احتياطيًّا بقواعد الزيارة كما هي');
T(w.briefRing('C1') === '#E05252', 'وإطارُ النقطة يحمل خبرَ السطر: تحدٍّ أحمر');
w.briefSet('C2', 'تمام', 'رُكّب واختُبر');
T(w.briefRing('C2') === '#3AD6A0' && w.briefRing('C3') === '', 'وتمامٌ أخضر — ولا إطارَ لمن لا سطرَ له');
w.LEGEND_ON = true; w.render(1); await wait(150);
const lg = d.querySelector('.map-legend');
T(!!lg && /تنتظر الاعتمادَ التقني/.test(lg.textContent) && /تنتظر الوزارة/.test(lg.textContent) && /اعتمدتها الوزارة/.test(lg.textContent),
  'والأسطورةُ تعدُّ كلَّ مرحلةٍ بلونها');
T(/إطارُ النقطة/.test(lg.textContent) && /بلا تفاصيلَ بعد/.test(lg.textContent), 'وتفصل خبرَ الإطار عن لون المرحلة');
w.LEGEND_ON = false;

/* النافذة: الخبرُ قبل البيانات، والشرائحُ لمن يكتب */
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(150);
const pop = d.getElementById('pkPop');
T(!!pop && /الكابل لم يصل/.test(pop.textContent), 'النافذةُ تعرض السطرَ');
T(pop.textContent.indexOf('الكابل لم يصل') < pop.textContent.indexOf('ما سجّله الميدان'), 'قبل ما سجّله الميدانُ لا بعده');
T(!!pop.querySelector('[data-bst="C1|تمام"]') && !!pop.querySelector('#bfTxt') && !!pop.querySelector('[data-bfsave="C1"]'),
  'ومن يكتب يجد الشرائحَ والسطرَ في النافذة نفسِها');

/* الوزارة: ترى وتكتب */
w.ROLE = 'viewer';
T(w.briefMay() === true, 'الوزارةُ تكتب التفاصيل');
T(w.mapUIHtml().indexOf('data-mode="brief"') > -1, 'وترى شريحةَ الطبقة');
w.render(1); await wait(120);
T(!!d.querySelector('#pkPop [data-bst]'), 'وتجد شرائحَها في النافذة');

/* نقطةٌ لم تُزَر: يُقال لماذا لا تُكتَب */
w.POP_SITE = 'C3'; w.render(1); await wait(120);
T(/لم ينزل الميدانُ إلى هذه النقطة بعد/.test(d.getElementById('pkPop').textContent), 'وما لم يُنزَل إليه يقول ذلك صراحةً');

/* ═══ البطاقةُ في هذه الطبقة: تقييمٌ بالعين وزرٌّ واحد (V16.89) ═══ */
w.ROLE = 'engineer';
w.STATE.recs.C1 = Object.assign({}, w.STATE.recs.C1, {
  by:'فنيُّ الميدان', at:Date.now(), access:'تم الوصول', mount:'عمود', power:'مولّد',
  wid_m:3, hgt_m:4, fit:'نعم', note:'الموقع ضيّقٌ من الجهة الشرقية',
  chals:['العارضة الحديدية ناقصة أو غير مكتملة'], photos:['site','mount']
});
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(150);
const p2 = d.getElementById('pkPop'); const txt = p2.textContent;
T(/ما سجّله الميدان/.test(txt) && /نوع التركيب/.test(txt) && /عمود/.test(txt) && /مولّد/.test(txt),
  'البطاقةُ تعرض ما سجّله الميدانُ بالحرف — فيُقيَّم بالعين بلا فتح نموذج');
T(/الموقع ضيّقٌ من الجهة الشرقية/.test(txt) && /العارضة الحديدية/.test(txt) && /التحديات المرصودة/.test(txt) && /الصور/.test(txt),
  'ومعه الملاحظةُ والتحدياتُ وعددُ الصور');
T(!/تعديل البيانات|نموذج المسح|اتجاهات|تحريك/.test(txt) && !p2.querySelector('[data-psel],[data-move],[data-site],[data-form],[data-insform]'),
  'ولا زرَّ سواه: لا تعديلَ ولا نموذجَ ولا اتجاهاتٍ ولا تحريك');
const aprs = [...p2.querySelectorAll('.actions .btn, .actions a')];
T(aprs.length === 1 && /الاعتماد التقني/.test(aprs[0].textContent), 'والزرُّ الوحيدُ هو الاعتمادُ التقنيُّ للمهندس: ' + (aprs[0] ? aprs[0].textContent.trim() : '—'));
w.ROLE = 'viewer'; w.render(1); await wait(120);
const p3 = d.getElementById('pkPop'), a3 = [...p3.querySelectorAll('.actions .btn, .actions a')];
T(a3.length === 0, 'والوزارةُ لا تُعرَض عليها الاعتمادُ التقني — ليس من شأنها');
w.STATE.recs.C1.review = 'approved'; w.render(1); await wait(120);
const a4 = [...d.querySelectorAll('#pkPop .actions .btn, #pkPop .actions a')];
T(a4.length === 1 && /اعتماد الوزارة/.test(a4[0].textContent), 'فإذا اعتُمدت تقنيًّا وجدت زرَّها وحدَه: ' + (a4[0] ? a4[0].textContent.trim() : '—'));
T(/اعتُمدت تقنيًّا/.test(d.getElementById('pkPop').textContent), 'والحالةُ مكتوبةٌ بجملةٍ تُقرأ');
w.ROLE = 'engineer'; w.STATE.recs.C1.review = '';

/* ═══ النصوصُ والصورُ في البطاقة (V16.93) ═══ */
w.ROLE = 'engineer';
Object.assign(w.STATE.recs.C1, { chal_note:'العارضةُ مائلة', power_note:'المصدرُ بعيدٌ ٤٠ م', minNote:'أعيدت لتصوير الزاوية', minBy:'الوزارة', minAt:Date.now() });
w.STATE.inss = w.STATE.inss || {}; w.STATE.inss.C1 = { note:'رُكّب على عمودٍ جديد', by:'فريق التركيب', at:Date.now() };
const TX = w.svTexts('C1').map(x => x.src);
T(TX.length >= 5 && TX.indexOf('ملاحظةُ الميدان') > -1 && TX.indexOf('ملاحظةُ الوزارة') > -1 && TX.indexOf('ملاحظةُ التركيب') > -1,
  'كلُّ نصٍّ كُتب عن النقطة يُجمَع بمصدره: ' + TX.join(' · '));
w.STATE.photos = { p1:{ site:'C1', kind:'صورة الموقع', at:Date.now(), driveId:'D1', folderId:'F1' },
                   p2:{ site:'C1', kind:'صورة التثبيت', at:Date.now(), data:'data:image/jpeg;base64,AAA' },
                   p3:{ site:'C1', kind:'محذوفة', del:{ by:'x' } } };
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(150);
const pc = d.getElementById('pkPop');
T(/ما كُتب عن النقطة/.test(pc.textContent) && /العارضةُ مائلة/.test(pc.textContent) && /رُكّب على عمودٍ جديد/.test(pc.textContent),
  'وتُقرأ في البطاقة نصًّا نصًّا');
const ph = [...pc.querySelectorAll('.bf-ph img[data-phview]')];
T(ph.length === 2, 'والصورُ مُصغَّراتٌ تُفتَح بالضغط — والمحذوفةُ لا تُعرَض: ' + ph.length);
T(/drive\.google\.com\/thumbnail\?id=D1/.test(ph[0].src) || /drive\.google\.com\/thumbnail\?id=D1/.test(ph[1].src), 'ما على الدرايف يُعرَض بمصغّرته');
w.ROLE = 'admin'; w.render(1); await wait(120);
T(!!d.querySelector('#pkPop a[href*="drive.google.com/drive/folders/F1"]'), 'ومجلدُ النقطة يُفتَح لمدير المشروع فما فوق');
w.ROLE = 'engineer';
{
  const raw2 = readFileSync('index.html', 'utf8');
  T(/fillOpacity: picked \? 1 : 0\.95/.test(raw2) && /color: picked \? '#fff' : \(ring \|\| '#0B1220'\)/.test(raw2),
    'والنقاطُ مصمتةٌ بحافّةٍ داكنةٍ — فلا تذوب المتجاوراتُ في كتلةٍ واحدة');
  /* المخيمُ بحدوده في كلِّ تقريبٍ عمليّ — حدٌّ واحدٌ يقرؤه الرسمُ والتحميل (V16.94) */
  const pz = (raw2.match(/var POLY_Z = (\d+);/) || [])[1];
  T(pz && +pz <= 12, 'حدُّ رسم حدود المخيمات ' + pz + ' — فتبقى متفرّدةً عند الابتعاد لا دوائرَ متراكبة');
  T(/z >= POLY_Z && POLY && POLY\[x\.id\]/.test(raw2) && /z >= POLY_Z && !POLY\) polyLoad/.test(raw2),
    'والرسمُ والتحميلُ يقرآن الحدَّ نفسَه — فلا يُرسَم ما لم يُحمَّل');
}

/* ═══ العلامةُ البيضاء: «أفاقي» لا «نُسُك» (V16.92) ═══ */
{
  const raw = readFileSync('index.html', 'utf8');
  T(!/نُسُك/.test(raw), 'لا أثرَ لاسمٍ سابقٍ في الواجهة' + (/نُسُك/.test(raw) ? ' — ' + (raw.match(/نُسُك/g) || []).length : ''));
  T(d.title === 'قارئات أفاقي — حج ١٤٤٨هـ' && w.MANIFEST.name === 'قارئات أفاقي', 'الاسمُ «قارئات أفاقي» في العنوان والبيان');
  /* شارةُ النسخة هي المرجع — لا أوّلُ ظهورٍ لنصِّ نسخةٍ في الملف (تعليقٌ قد يسبقها) */
  const badge = (raw.match(/>نسخة (V\d+\.\d+)<\/button>/) || [])[1];
  const swv = (readFileSync('sw.js', 'utf8').match(/nusuk-survey-v([\d.]+)/) || [])[1];
  T(!!badge && badge.slice(1) === swv, 'وشارةُ النسخة تطابق عاملَ الخدمة: ' + badge + ' · v' + swv);
  const mark = d.querySelector('.brand-mark img');
  /* شاشةُ الدخول أُزيلت بعد الدخول — فيُقرأ بناؤها من المصدر */
  T(!!mark && /class="lgm"><img src="' \+ LOGO/.test(raw), 'والعلامةُ صورةٌ في الجانب وفي شاشة الدخول');
  T(/^data:image\/png;base64,/.test(mark.src) && mark.src.length > 3000,
    'محفوظةٌ داخل الملف — تعمل بلا شبكةٍ ولا تنتظر طلبًا (' + Math.round(mark.src.length / 1024) + ' ك.ب)');
  T((w.LOGO || '').indexOf('data:image/png') === 0, 'وثابتُ LOGO يقرؤها لمن يحتاجها');
}

/* ═══ سجلُّ النقطة — كلُّ ما جرى لها من أوّل يوم (V17.20) ═══ */
{
  const T0 = Date.now(), DAY = 86400000;
  w.STATE.sites = [{ id:'L1', name:'نقطةُ السجل', zone:'منى', type:'مخيم', lat:21.41, lng:39.89 }];
  w.STATE.recs = { L1:{ by:'فنيُّ الميدان', at:T0 - 9 * DAY, st:'تمت الزيارة', access:'تم الوصول',
    review:'approved', apprBy:'المهندس', apprAt:T0 - 7 * DAY,
    minBy:'الوزارة', minAt:T0 - 5 * DAY, minReview:'approved',
    briefBy:'المهندس', briefAt:T0 - DAY, bst:'تمام', brief:'رُكّب واختُبر' } };
  w.STATE.inss  = { L1:{ by:'فريق التركيب', at:T0 - 3 * DAY, status:'مُركّب' } };
  w.STATE.photos = { 'L1-1':{ site:'L1', kind:'صورة الموقع',  by:'فنيُّ الميدان', at:T0 - 9 * DAY, driveId:'D1' },
                     'L1-2':{ site:'L1', kind:'صورة التثبيت', by:'فريق التركيب', at:T0 - 3 * DAY, driveId:'D2' } };
  w.STATE.tasks = { tk:{ site:'L1', to:'فنيُّ الميدان', kind:'survey', by:'المشرف', at:T0 - 10 * DAY } };
  w.STATE.evlog = { e1:{ ts:T0 - 2 * DAY, what:'تعديل بيانات نقطة — L1', by:'المهندس', site:'L1' },
                    e2:{ ts:T0 - 2 * DAY, what:'حدثُ نقطةٍ أخرى', by:'س', site:'L9' } };
  const L = w.siteLog('L1');
  T(L.length >= 8, 'السجلُّ يجمع من كلِّ المصادر: ' + L.length + ' سطرًا');
  const kinds = L.map(x => x.kind);
  ['visit','ok','ins','photo','task','note','ev'].forEach(k => {
    if (kinds.indexOf(k) < 0) T(false, 'مصدرٌ غائبٌ عن السجل: ' + k);
  });
  T(kinds.indexOf('visit') > -1 && kinds.indexOf('photo') > -1 && kinds.indexOf('ok') > -1,
    'فيه الزيارةُ والصورُ والاعتمادات');
  T(L.filter(x => x.kind === 'photo').every(x => x.who), 'ولكلِّ صورةٍ رافعُها');
  T(L.every((x, i) => i === 0 || L[i - 1].at >= x.at), 'ومرتَّبٌ من الأحدث إلى الأقدم');
  T(!L.some(x => /نقطةٍ أخرى/.test(x.what)), 'ولا يتسرّب إليه حدثُ نقطةٍ أخرى');
  const raw5 = readFileSync('index.html', 'utf8');
  T((raw5.match(/logEvent\([^;]*?,\s*(?:id|site|x\.id|s\.id|r\.id|it\.site|b\.site)\s*\)/g) || []).length >= 40,
    'وأحداثُ النقاط تُوسَم بنقطتها فتُستعلَم من القاعدة لا بالبحث في النصّ');
  T(/collection\('events'\)\.where\('site', '==', id\)\.limit\(200\)/.test(raw5),
    'والقديمُ يُجلَب بسقفٍ عند الطلب لا في كلِّ إقلاع');
  w.DETAIL_ID = 'L1'; w.goPage('site'); w.render(1); await wait(250);
  const sp = d.getElementById('main') || d.body;
  T(/سجلُّ النقطة/.test(sp.textContent) && !!sp.querySelector('[data-sitelog]'), 'والبطاقةُ في شاشة الموقع بزرِّ جلبِ القديم');
}

/* ═══ الاعتمادُ يُفتَح على النقطة، و«رغم ذلك» تعمل (V17.21) ═══ */
{
  w.ROLE = 'engineer'; w.STATE.meta.name = 'م. فحص';
  w.STATE.sites = [{ id:'P1', name:'نقطةٌ أولى', zone:'عرفات', type:'مخيم', lat:21.3, lng:39.9 }];
  w.STATE.recs = { P1:{ by:'خالد', at:Date.now(), st:'تمت الزيارة', access:'تم الوصول',
                        review:'revisit', revisitNote:'الصور خاطئة', revisitBy:'م. فحص' } };
  T(w.svApprove('P1') === true, '«اعتمدها رغم ذلك» تعمل على المردودة — لا «لا زيارةَ منجزة»');
  T(w.svReview(w.STATE.recs.P1) === 'approved' && (w.STATE.recs.P1.revisitCleared || {}).was === 'الصور خاطئة',
    'وترفع وسمَ الردِّ وتُبقي سببَه في السجل');
  w.STATE.recs.P2 = { by:'خالد', at:Date.now(), access:'لم يتم الوصول' };
  T(w.svApprove('P2') === false, 'ولا تُعتمَد زيارةٌ لم يصل إليها الميدان');
  w.STATE.recs.P1.review = ''; w.SVA_Q = ''; w.SVA_ST = 'pending';
  /* النافذةُ لا تُرسَم إلا على الخريطة — والكتلةُ السابقةُ تركتنا في شاشة الموقع */
  w.goPage('map'); w.FIELD_MODE = 'brief'; w.POP_SITE = 'P1'; w.POP_OPEN = true; w.render(1); await wait(250);
  const gb = d.querySelector('#pkPop [data-goto="svappr"]');
  T(!!gb && gb.getAttribute('data-gotosite') === 'P1', 'وزرُّ الاعتماد في النافذة يحمل معرِّفَ نقطته');
  gb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(250);
  T(w.SVA_Q === 'P1', 'فيُفتَح مُرشَّحًا عليها وحدَها — لا على قائمةٍ من مئات');
  w.SVA_Q = '';
}

/* ═══ بحثُ التحديات والإشعارات بكلِّ حقل (V17.25) ═══ */
{
  /* الكتلُ السابقةُ استبدلت السجلَّ بنقاطٍ مصطنعة — فتُبنى نقطةٌ بحقولها كاملةً
     ويُبطَل فهرسُ المواقع ليقرأها siteFind */
  const A2 = { id:'NSK-ARF-CMP-0001', name:'عرفات - مربع 7-15 - شاخص 1-3-5/506', zone:'عرفات', type:'مخيم',
               sq:'7-15', sign:'1-3-5/506', co:'شركة الراجحي للخدمات التجارية المساندة', lat:21.33, lng:39.98 };
  w.STATE.sites = [A2]; w.SITE_IX = null;
  w.STATE.recs = { [A2.id]:{ by:'خالد بندر', at:Date.now(), chals:['المسار داخل نفق'], note:'العارضة مائلة' } };
  w.STATE.notifs = [{ id:'n1', kind:'اعتماد', text:'اعتُمدت زيارتك', lv:'مهم', to:'خالد بندر', by:'المهندس', site:A2.id, at:Date.now(), read:false }];
  const hit = q => { w.CHAL_Q = q; return w.chalSitesQ().length; };
  T(hit('') === 1 && hit('شاخص 1-3-5') === 1 && hit('الراجحي') === 1 && hit('نفق') === 1 && hit('خالد') === 1 && hit('العارضة') === 1 && hit('كذا لا يوجد') === 0,
    'التحدياتُ تُبحَث بالشاخص والشركة ونصِّ التحدي والملاحظة والمُفيد');
  const hn = q => { w.NTF_Q = q; return w.notifMineQ().length; };
  T(hn('اعتماد') === 1 && hn('مهم') === 1 && hn('عرفات') === 1 && hn('غير مقروء') === 1 && hn('المهندس') === 1 && hn('لا شيء هنا') === 0,
    'والإشعاراتُ بالنوع والمستوى والنقطة والحالة والمرسِل');
  T(hit('عرفات 1-3-5') === 1, 'وكلمتان معًا تُضيّقان لا تُوسّعان');
  T(!!w.PG_BIND.chal && !!w.PG_BIND.notif, 'وصندوقُ الرأس يقودهما');
  w.CHAL_Q = ''; w.NTF_Q = '';
}

/* ═══ V17.33: الاعتمادُ من كلِّ نافذةٍ يفتح على نقطته، والصورُ التي لم تصل تُقال ═══ */
{
  const raw6 = readFileSync('index.html', 'utf8');
  const js6 = /<script[^>]*>([\s\S]*?)<\/script>/.exec(raw6)[1];
  const gotos = js6.match(/data-goto="(?:svappr|minappr)"/g) || [];
  const withSite = js6.match(/data-goto="(?:svappr|minappr)" data-gotosite=/g) || [];
  T(gotos.length > 0 && gotos.length === withSite.length, 'كلُّ زرِّ اعتمادٍ في النوافذ يحمل نقطتَه: ' + withSite.length + '/' + gotos.length);
  T(/PG_KEEP = true/.test(js6) && /wasCur !== CUR && !PG_KEEP/.test(js6), 'والانتقالُ الموجَّهُ يحتفظ ببحثه فلا يمسحه الرسم');
  T(/rec\.phN = phN/.test(js6) && /got < r\.phN/.test(js6), 'والزيارةُ تختم عددَ صورها ويُقال ما لم يصل منها');
  T(/\.stats > \.stat:last-child:nth-child\(odd\)\{grid-column:1 \/ -1\}/.test(raw6), 'ولا بطاقةَ وحيدةً في نصفِ صفٍّ على الهاتف');
  const bt6 = readFileSync('scripts/browser-test.mjs', 'utf8');
  T(/scrollWidth > W \+ 2/.test(bt6) && /getBoundingClientRect/.test(bt6), 'واختبارُ المتصفّح يقيس الأبعادَ على الهاتف: لا زرَّ خارجَ الشاشة');
}

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ التفاصيل المختصرة فشل ✗ (${bad})` : '\nالتفاصيلُ المختصرة طبقةٌ تُقرأ بلونها وتُكتَب بسطر ✅');
process.exit(bad ? 1 : 0);
