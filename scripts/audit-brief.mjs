/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الخلاصة (كانت «التفاصيل المختصرة») — node scripts/audit-brief.mjs
   ───────────────────────────────────────────────────────────────────────────
   طبقةٌ رابعةٌ بجوار المسح والتركيب والفك (V16.88): سطرٌ لكلِّ نقطةٍ زارها
   الميدان — «تمام» أو «تحدٍّ» أو «ملاحظة» — بلونه، تُضغَط فتُقرأ. يُثبَت هنا
   بالرسم الحقيقيّ: الطبقةُ في شريط الخريطة، والوزارةُ تراها وتكتبها،
   واللونُ يتبع الحالةَ، والنافذةُ تعرض الخبرَ قبل البيانات، والسطرُ يُحفَظ
   على وثيقة الزيارة نفسِها (فيُزامَن ويُنسَخ بقواعده كما هي).
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص بعد فصله (V21.6) */
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
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
const dom = new JSDOM((await appHtml()), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
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

/* ═══ (V39.27) قرارُ المالك: «نشيل التفاصيل المختصرة ونحط اللي فيها في المسح والتركيب والفك باختلاف نماذجهم» ═══
   الطبقةُ الرابعةُ ذهبت، والخلاصةُ (تمام · تحدٍّ · ملاحظة وسطر) صارت في كلِّ طبقةٍ على سجلّها: الزيارةُ في المسح،
   والتركيبُ في التركيب، والفكُّ في الفك — إطارُ النقطة يقولها، ونافذتُها تكتبها، وتحتها ما سجّله الميدانُ بنموذج الطبقة. */
T(!w.LAYERS.brief && Object.keys(w.LAYERS).join(',') === 'survey,install,dis', 'ثلاثُ طبقاتٍ: المسح والتركيب والفك — بلا طبقةٍ رابعة');
T(w.mapUIHtml().indexOf('data-mode="brief"') < 0, 'ولا شريحةَ لها على شريط الخريطة');

/* نقطتان مزارتان وثالثةٌ لم تُزَر */
w.STATE.sites = [
  { id:'C1', name:'مخيم ١', zone:'منى', type:'مخيم', lat:21.41, lng:39.89 },
  { id:'C2', name:'مخيم ٢', zone:'منى', type:'مخيم', lat:21.412, lng:39.892 },
  { id:'C3', name:'مخيم ٣', zone:'منى', type:'مخيم', lat:21.413, lng:39.893 }
];
const done = { st:'تمت الزيارة', by:'فني', at:Date.now() };
w.STATE.recs = { C1:Object.assign({}, done), C2:Object.assign({}, done) };
w.STATE.inss = { C2:{ id:'C2', status:'مُركّب', parts:{ rdr8:1, rtr:1 }, serials:{ rdr8:'RDR-77' }, by:'فريق التركيب', at:Date.now(), note:'رُكّب على عمودٍ جديد' } };
w.STATE.diss = { C2:{ id:'C2', status:'تم الفك', cond:'سليم', by:'فريق الفك', at:Date.now() } };
w.CORE.set = (k, id, v) => { w.STATE[k][id] = v; w.__wrote = k; };
w.STATE.meta.name = 'م. فحص';
w.FILT_CACHE = null; w.FILT_KEY = '';
w.FIELD_MODE = 'survey'; w.render(1); await wait(150);

/* المسح: الخلاصةُ على الزيارة */
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(140);
let pop = d.getElementById('pkPop');
T(!!pop && /خلاصة الزيارة/.test(pop.textContent) && !!pop.querySelector('[data-bst="C1|تمام|survey"]') && !!pop.querySelector('[data-bfsave="C1|survey"]') && !!pop.querySelector('#bfTxt'),
  'في المسح: نافذةُ النقطة فيها «خلاصة الزيارة» بشرائحها وسطرها');
d.getElementById('bfTxt').value = 'الكابل لم يصل — الشركة وعدت غدًا';
pop.querySelector('[data-bst="C1|تحدٍّ|survey"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
const r1 = w.STATE.recs.C1;
T(r1.bst === 'تحدٍّ' && r1.brief === 'الكابل لم يصل — الشركة وعدت غدًا' && r1.briefBy === 'م. فحص' && r1.briefAt > 0 && w.__wrote === 'recs', 'والخلاصةُ تُحفَظ على وثيقة الزيارة نفسِها');
T(w.briefRing('C1') === '#E05252' && w.briefRing('C2') === '', 'وإطارُ النقطة في المسح يحمل خلاصتَها: تحدٍّ أحمر — ولا إطارَ لمن لا خلاصةَ له');
w.POP_SITE = 'C1'; w.render(1); await wait(120); pop = d.getElementById('pkPop');
T(pop.textContent.indexOf('الكابل لم يصل') > -1 && !!pop.querySelector('details') && /ما سجّله الميدان/.test(pop.querySelector('details summary').textContent), 'والنافذةُ تعرض الخلاصةَ ثم «ما سجّله الميدان» مطويًّا');
const lg = d.querySelector('.lg-sep') ? d.body : null;
w.render(1); await wait(80);
T(/إطارُ النقطة/.test(d.body.textContent) && /بلا خلاصةٍ بعد/.test(d.body.textContent), 'والأسطورةُ تعدّ الخلاصاتِ في المسح');
/* ألوانُ المسح فيها مراحلُ الاعتماد أصلًا */
T(w.mapColorOf(w.siteFind('C1')) === w.LIFE.visited.c, 'ولونُ النقطة لونُ المسح (تنتظر الاعتماد) — المرحلةُ هنا لا في طبقةٍ أخرى');

/* التركيب: الخلاصةُ على التركيب */
w.FIELD_MODE = 'install'; w.POP_SITE = 'C2'; w.POP_OPEN = true; w.render(1); await wait(140); pop = d.getElementById('pkPop');
T(/خلاصة التركيب/.test(pop.textContent) && !!pop.querySelector('[data-bst="C2|تمام|install"]'), 'في التركيب: «خلاصة التركيب»');
T(/RDR-77/.test(pop.querySelector('details').textContent) && /رُكّب على عمودٍ جديد/.test(pop.querySelector('details').textContent), 'و«ما سجّله الميدان» بنموذج التركيب: القطعُ والسيريالاتُ والملاحظة');
pop.querySelector('[data-bst="C2|تمام|install"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(w.STATE.inss.C2.bst === 'تمام' && w.__wrote === 'inss' && !w.STATE.recs.C2.bst, 'وتُحفَظ على سجلّ التركيب لا على الزيارة');
T(w.briefRing('C2') === '#3AD6A0' && w.briefRing('C1') === '', 'وإطارُ التركيب أخضر — وخلاصةُ الزيارة لا تظهر في طبقة التركيب');

/* الفك: الخلاصةُ على الفك */
w.FIELD_MODE = 'dis'; w.POP_SITE = 'C2'; w.render(1); await wait(140); pop = d.getElementById('pkPop');
T(/خلاصة الفك/.test(pop.textContent) && /سليم/.test(pop.querySelector('details').textContent), 'في الفك: «خلاصة الفك» وحالةُ الأجهزة');
pop.querySelector('[data-bst="C2|ملاحظة|dis"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(w.STATE.diss.C2.bst === 'ملاحظة' && w.__wrote === 'diss', 'وتُحفَظ على سجلّ الفك');

/* من يكتب */
w.FIELD_MODE = 'survey'; w.POP_OPEN = false;
w.ROLE = 'viewer'; T(w.briefMay() === true, 'الوزارةُ تكتب الخلاصة (والقاعدةُ تسمح لها بحقولها وحدَها)');
w.ROLE = 'exec'; T(w.briefMay() === false, 'والإدارةُ العليا تقرأ ولا تكتب — كما في القاعدة');
w.ROLE = 'engineer';

/* ═══ النصوصُ والصورُ في «ما سجّله الميدان» (V16.93 → V39.27) ═══ */
Object.assign(w.STATE.recs.C1, { note:'الموقع ضيّقٌ من الجهة الشرقية', chal_note:'العارضةُ مائلة', power_note:'المصدرُ بعيدٌ ٤٠ م', minNote:'أعيدت لتصوير الزاوية', minBy:'الوزارة', minAt:Date.now() });
w.STATE.inss.C1 = { note:'رُكّب على عمودٍ جديد', by:'فريق التركيب', at:Date.now() };
const TX = w.svTexts('C1').map(x => x.src);
T(TX.length >= 5 && TX.indexOf('ملاحظةُ الميدان') > -1 && TX.indexOf('ملاحظةُ الوزارة') > -1 && TX.indexOf('ملاحظةُ التركيب') > -1,
  'كلُّ نصٍّ كُتب عن النقطة يُجمَع بمصدره: ' + TX.join(' · '));
w.STATE.photos = { p1:{ site:'C1', kind:'صورة الموقع', at:Date.now(), driveId:'D1', folderId:'F1' },
                   p2:{ site:'C1', kind:'صورة التثبيت', at:Date.now(), data:'data:image/jpeg;base64,AAA' },
                   p3:{ site:'C1', kind:'محذوفة', del:{ by:'x' } } };
if (typeof w.phTouch === 'function') w.phTouch();
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(150);
const pc = d.getElementById('pkPop');
T(/ما كُتب عن النقطة/.test(pc.textContent) && /العارضةُ مائلة/.test(pc.textContent) && /رُكّب على عمودٍ جديد/.test(pc.textContent),
  'وتُقرأ في «ما سجّله الميدان» نصًّا نصًّا');
const ph = [...pc.querySelectorAll('.bf-ph img[data-phview]')];
T(ph.length === 2, 'والصورُ مُصغَّراتٌ تُفتَح بالضغط — والمحذوفةُ لا تُعرَض: ' + ph.length);
T(ph.some(im => /drive\.google\.com\/thumbnail\?id=D1/.test(im.src)), 'ما على الدرايف يُعرَض بمصغّرته');
w.ROLE = 'admin'; w.render(1); await wait(120);
T(!!d.querySelector('#pkPop a[href*="drive.google.com/drive/folders/F1"]'), 'ومجلدُ النقطة يُفتَح لمدير المشروع فما فوق');
w.ROLE = 'engineer';
{
  const raw2 = (await appHtml());
  T(/fillOpacity: picked \? 1 : 0\.95/.test(raw2) && /color: picked \? '#fff' : \(ring \|\| '#0B1220'\)/.test(raw2),
    'والنقاطُ مصمتةٌ بحافّةٍ داكنةٍ — فلا تذوب المتجاوراتُ في كتلةٍ واحدة');
  /* المخيمُ بحدوده في كلِّ تقريبٍ عمليّ — حدٌّ واحدٌ يقرؤه الرسمُ والتحميل (V16.94) */
  const pz = (raw2.match(/var POLY_Z = (\d+);/) || [])[1];
  T(pz && +pz <= 12, 'حدُّ رسم حدود المخيمات ' + pz + ' — فتبقى متفرّدةً عند الابتعاد لا دوائرَ متراكبة');
  /* V17.59: الرسمُ يقرأ الحدودَ عبر campFoot — المرسومةُ في التطبيق ثم poly.json — والحدُّ هو هو */
  T(/z >= POLY_Z && \(FT = campFoot\(x\)\)/.test(raw2) && /POLY && POLY\[x\.id\] && POLY\[x\.id\]\.length >= 3/.test(raw2)
    && /z >= POLY_Z && !POLY\) polyLoad/.test(raw2),
    'والرسمُ والتحميلُ يقرآن الحدَّ نفسَه — فلا يُرسَم ما لم يُحمَّل');
}

/* ═══ العلامةُ البيضاء: «أفاقي» لا «نُسُك» (V16.92) ═══ */
{
  const raw = (await appHtml());
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
  const raw5 = (await appHtml());
  T((raw5.match(/logEvent\([^;]*?,\s*(?:id|site|x\.id|s\.id|r\.id|it\.site|b\.site)\s*\)/g) || []).length >= 40,
    'وأحداثُ النقاط تُوسَم بنقطتها فتُستعلَم من القاعدة لا بالبحث في النصّ');
  T(/(?:collection|DB\.col)\('events'\)\.where\('site', '==', id\)\.limit\(200\)/.test(raw5),
    'والقديمُ يُجلَب بسقفٍ عند الطلب لا في كلِّ إقلاع');
  /* (V38.69) the point page no longer falls back to the registry's first point — the check opens a point that exists */
  w.DETAIL_ID = w.siteFind('L1') ? 'L1' : w.STATE.sites[0].id; w.goPage('site'); w.render(1); await wait(250);
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
  w.goPage('map'); w.FIELD_MODE = 'survey'; w.POP_SITE = 'P1'; w.POP_OPEN = true; w.render(1); await wait(250);
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
  const raw6 = (await appHtml());
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
