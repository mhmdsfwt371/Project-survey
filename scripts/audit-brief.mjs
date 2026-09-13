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
T(w.mapColorOf(w.siteFind('C1')) === '#6B7A87', 'وما لم يُكتَب بعدُ رمادٌ يقول «ينتظر سطرًا»');

/* الكتابة: حالةٌ وسطرٌ على وثيقة الزيارة */
w.briefSet('C1', 'تحدٍّ', 'الكابل لم يصل — الشركة وعدت غدًا');
const r1 = w.STATE.recs.C1;
T(r1.bst === 'تحدٍّ' && r1.brief === 'الكابل لم يصل — الشركة وعدت غدًا' && r1.briefBy === 'م. فحص' && r1.briefAt > 0,
  'تُكتَب على وثيقة الزيارة نفسِها باسم كاتبها ووقته — لا في مجموعةٍ جديدة');
T(w.__wrote === 'recs', 'فتُزامَن وتُنسَخ احتياطيًّا بقواعد الزيارة كما هي');
T(w.mapColorOf(w.siteFind('C1')) === '#E05252', 'واللونُ يتبع الحالة: تحدٍّ أحمر');
w.briefSet('C2', 'تمام', 'رُكّب واختُبر');
T(w.mapColorOf(w.siteFind('C2')) === '#3AD6A0', 'وتمامٌ أخضر');

/* النافذة: الخبرُ قبل البيانات، والشرائحُ لمن يكتب */
w.POP_SITE = 'C1'; w.POP_OPEN = true; w.render(1); await wait(150);
const pop = d.getElementById('pkPop');
T(!!pop && /الكابل لم يصل/.test(pop.textContent), 'النافذةُ تعرض السطرَ');
T(pop.textContent.indexOf('الكابل لم يصل') < pop.textContent.indexOf('الإحداثيات'), 'قبل البيانات لا بعدها');
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
T(/تُكتَب بعد تمام الزيارة/.test(d.getElementById('pkPop').textContent), 'وما لم يُزَر يقول لماذا لا تُكتَب تفاصيلُه');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ التفاصيل المختصرة فشل ✗ (${bad})` : '\nالتفاصيلُ المختصرة طبقةٌ تُقرأ بلونها وتُكتَب بسطر ✅');
process.exit(bad ? 1 : 0);
