/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ملفِّ البند — node scripts/audit-dossier.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجدولُ يقول متى يبدأ البندُ وكم أُنجز، ولا يقول مَن يدفع ولا ما يُشترى
   ولا ما يُركَّب وأين ولا ما العائد (V17.11). يُثبَت هنا: الشاشةُ في
   «التخطيط»، ولكلِّ بندٍ ملفٌّ يُفتَح من عمودٍ في الجدول، يحمل جهةَ الدفع
   والعائدَ وقيمتَه، وأصنافَ ما يُشترى بكمياتها وأسعارها وإجماليها، وماذا
   يُركَّب وكيف وأين، وروابطَ ملفاته — ويُحفَظ في صفِّ البند نفسِه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n);
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير المشروع' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const wrote = {}; w.CORE.set = (k, id, v) => { wrote[k + '/' + id] = v; }; w.CORE.saveSoon = () => {};
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };

T(w.PAGE.wbs.m === 'التخطيط', 'شاشةُ الخطة التفصيلية في «التخطيط»: ' + w.PAGE.wbs.m);
w.STATE.meta.name = 'مدير المشروع';
w.STATE.wbs = { rows:[{ id:'1', n:'إدارة المشروع والحوكمة', s:'2026-08-03', e:'2027-07-01' },
                      { id:'1.1', n:'خطة المشروع', s:'2026-08-03', e:'2026-09-01', pct:50 }], keys:[] };
w.goPage('wbs'); w.render(1); await wait(200);
w.WBS_OPEN['1'] = true; w.render(1); await wait(200);   /* الفروعُ مطويّةٌ حتى يُفتَح الأب */
const main = d.getElementById('main') || d.body;
const th = [...main.querySelectorAll('table th')].map(e => e.textContent.trim());
T(th.indexOf('الملف') > -1 && th.indexOf('فروع') > -1, 'وللجدول عمودا «فروع» و«الملف»: ' + th.join(' · '));
T(!!main.querySelector('[data-wbsdos="1.1"]'), 'ولكلِّ بندٍ زرُّ ملفِّه');

click('[data-wbsdos="1.1"]'); await wait(200);
const sh = d.getElementById('dosSheet');
T(!!sh && sh.parentElement.id === 'dosHost' && sh.parentElement.parentElement === d.body, 'يفتح لوحَ الملفِّ على الجسد');
['dsPayer','dsVal','dsGain','dsBuy','dsInst','dsHow','dsWhere','dfN','dfU','diN','diQ','diP'].forEach(id => {
  if (!d.getElementById(id)) T(false, 'حقلٌ مفقودٌ في اللوح: ' + id);
});
T(!!d.getElementById('dsPayer') && !!d.getElementById('dsInst') && !!d.getElementById('dsVal'),
  'وفيه: من يدفع · ما يُشترى · ما يُركَّب وكيف وأين · العائد');

d.getElementById('dsPayer').value = 'الوزارة';
d.getElementById('dsVal').value = 'تغطيةُ عدِّ الحجاج في المدخل الشرقيّ';
d.getElementById('dsGain').value = '250000';
d.getElementById('dsBuy').value = 'قارئات وهوائيات';
d.getElementById('dsInst').value = 'قارئ RFID وهوائيان';
d.getElementById('dsHow').value = 'على عمودٍ قائم';
d.getElementById('dsWhere').value = 'منى — مربع ٥';
click('[data-dossave="1.1"]'); await wait(150);
const r1 = w.wbsRow('1.1'), dd = w.dosOf(r1);
T(dd.payer === 'الوزارة' && dd.inst === 'قارئ RFID وهوائيان' && dd.where === 'منى — مربع ٥' && +dd.gain === 250000,
  'ويُحفَظ الملفُّ في صفِّ البند نفسِه — لا مجموعةَ جديدة');
T(!!wrote['cfg/wbs'] && Array.isArray(wrote['cfg/wbs'].rows), 'ويُزامَن مع جدول الخطة كما هو');

d.getElementById('diN').value = 'هوائي'; d.getElementById('diQ').value = '2'; d.getElementById('diP').value = '300';
click('[data-dositem="1.1"]'); await wait(150);
T(w.dosItems(w.wbsRow('1.1')).length === 1 && w.dosCost(w.wbsRow('1.1')) === 600, 'والأصنافُ بكمياتها وأسعارها تُجمَع: ٦٠٠');
d.getElementById('dfN').value = 'كراسة الشروط'; d.getElementById('dfU').value = 'https://sharepoint.example/k1';
click('[data-dosfile="1.1"]'); await wait(150);
T(w.dosFiles(w.wbsRow('1.1')).length === 1, 'والملفاتُ تُضاف رابطًا باسمه');
d.getElementById('dfU').value = 'ملف بلا رابط';
click('[data-dosfile="1.1"]'); await wait(120);
T(w.dosFiles(w.wbsRow('1.1')).length === 1, 'ولا يُقبَل رابطٌ ليس رابطًا');
w.render(1); await wait(200);
T(/٦٠٠/.test((d.querySelector('[data-wbsdos="1.1"]') || {}).textContent || ''), 'وشارةُ الصفِّ تقول كلفةَ البند بلا فتحه');

/* القراءةُ بلا كتابة */
w.ROLE = 'viewer'; w.render(1); await wait(200);
const sh2 = d.getElementById('dosSheet');
T(!!sh2 && /الوزارة/.test(sh2.textContent) && !d.getElementById('dsPayer') && !sh2.querySelector('[data-dossave]'),
  'والوزارةُ تقرأ الملفَّ ولا تكتبه');
w.ROLE = 'admin';

/* ═══ جدولُ الخطة: يُقرأ ويقول الحقيقةَ عن البدء (V17.15) ═══ */
{
  const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  w.STATE.wbs = { rows:[
    { id:'9',   n:'بندٌ أبٌ', s:day(-20), e:day(20) },
    { id:'9.1', n:'حلَّ بدؤُه ولم يبدأ', s:day(-20), e:day(20), pct:0 },
    { id:'9.2', n:'لم يحن بدؤُه',      s:day(20),  e:day(40), pct:0 },
    { id:'9.3', n:'تجاوز نهايتَه',     s:day(-40), e:day(-1), pct:30 },
    { id:'9.4', n:'مكتمل',             s:day(-40), e:day(-1), pct:100 }
  ], keys:[] };
  w.ROLE = 'admin'; w.goPage('wbs'); w.render(1); await wait(200);
  w.WBS_OPEN['9'] = true; w.render(1); await wait(250);
  T(w.wbsTiming(w.wbsRow('9.1')) === 'تأخّر البدء', 'ما حلَّ بدؤُه ولم يبدأ يُقال له «تأخّر البدء» لا «ضمن مدته»');
  T(w.wbsTiming(w.wbsRow('9.2')) === 'لم يحن موعده' && w.wbsTiming(w.wbsRow('9.3')) === 'متأخر'
    && w.wbsTiming(w.wbsRow('9.4')) === 'مكتمل', 'وسائرُ المواقف كما هي');
  const main2 = d.getElementById('main') || d.body;
  const th2 = [...main2.querySelectorAll('table th')].map(e => e.textContent.trim());
  T(th2.indexOf('النوع') > -1 && th2.indexOf('الحالة') > -1 && th2.indexOf('الموقف الزمني') > -1,
    'وللجدول عمودٌ للنوع غيرُ عمود الحالة: ' + th2.join(' · '));
  T(!!main2.querySelector('.table-wrap.sticky-1'), 'ويُمرَّر أفقيًّا بعمودِ بندٍ ثابت');
  /* ═══ عرضٌ يتبع الشاشةَ لا رقمًا ثابتًا (V17.16) ═══ */
  {
    const css = readFileSync('index.html', 'utf8');
    T(!/\.table-wrap\.sticky-1 table\{min-width/.test(css), 'ولا عرضَ أدنى مفروضًا يُجبر التمريرَ على الشاشات الكبيرة');
    T(!/\.table-wrap\.sticky-1\{max-height/.test(css), 'ولا صندوقَ داخليًّا بشريطٍ رأسيٍّ ثانٍ');
    T(/\.content\.wide\{max-width:none\}/.test(css), 'وصفحاتُ الجداول العريضة تُطلَق من حدِّ العرض');
    T(d.getElementById('content').classList.contains('wide'), 'وصفحةُ الخطة منها — تملأ الشاشةَ مهما كبرت');
  }
  /* ═══ لا حقلَ مفتوحًا خارج التحرير (V17.17) ═══ */
  {
    w.WBS_EDIT = ''; w.render(1); await wait(200);
    T(d.querySelectorAll('[data-wbspct]').length === 0, 'ولا حقلَ إنجازٍ مفتوحًا في الجدول خارج وضع التحرير');
    const leaf = [...(d.getElementById('main') || d.body).querySelectorAll('table tbody tr')]
      .find(r => /حلَّ بدؤُه/.test(r.textContent));
    T(!!leaf && /٪/.test([...leaf.querySelectorAll('td')][5].textContent), 'والإنجازُ يُقرأ نصًّا بنسبته');
    w.WBS_EDIT = '9.1'; w.render(1); await wait(200);
    T(d.querySelectorAll('[data-wbspct]').length === 1, 'ويُفتَح بزرِّ التعديل وحدَه');
    w.WBS_EDIT = '';
    const css2 = readFileSync('index.html', 'utf8');
    T(/addEventListener\('wheel'[\s\S]{0,200}el\.type === 'number'[\s\S]{0,60}blur\(\)/.test(css2),
      'وعجلةُ الفأرة لا تكتب رقمًا في حقلٍ تحتها');
  }
  w.WBS_EDIT = '9.1'; w.render(1); await wait(250);
  const sel2 = d.querySelector('select[data-wbse="type"]');
  T(!!sel2 && [...sel2.options].map(o => o.value).join(',') === 'مهمة,معلم', 'والنوعُ قائمةٌ تُختار لا حقلٌ يُكتَب');
  const editCells = [...d.querySelector('[data-wbse="n"]').closest('tr').querySelectorAll('td')].length;
  T(editCells === th2.length, 'وصفُّ التحرير بعدد أعمدة الرأس — فلا يقع حقلٌ تحت عنوانٍ ليس له: ' + editCells + '/' + th2.length);
  w.WBS_EDIT = '';
}

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ ملفِّ البند فشل ✗ (${bad})` : '\nلكلِّ بندٍ ملفُّه: من يدفع وما يُشترى وما يُركَّب وما العائد ✅');
process.exit(bad ? 1 : 0);
