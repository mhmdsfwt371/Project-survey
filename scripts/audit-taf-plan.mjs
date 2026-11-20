/* ═══════════════════════════════════════════════════════════════════════════
   The tafweej monitoring plan in the place of approve / reject — node scripts/audit-taf-plan.mjs   (V47.12)
   ───────────────────────────────────────────────────────────────────────────
   The tafweej management's final feedback (20 Nov 2026) is a study with a sheet of every corridor gate: its phase («مرحلة ١»,
   «مرحلة ٢», «خارج الحاجة»), rank, section, corridor width, kits there and kits required, and comments. The owner: «حتة اعتماد
   أو مفيش اعتماد دي شيلها وحط مكانها حالات الشيت … وأي حاجة بكومنتات حطها بكومنتات، والداشبورد يبان بناءً على الحالات الجديدة».
   Held here on a sheet built like theirs: until one is imported nothing changes; once it is, the phase is the decision (the
   first phase goes to installation, nothing is rejected), the card and the dashboard speak the sheet's states with its comments
   and kits, a section's kits count once, a newer sheet replaces the old one whole, and the Ministry reads without editing.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import fs from 'fs';
import { appHtml } from './lib/src.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
w.eval(fs.readFileSync('vendor/xlsx/0.20.3/xlsx.full.min.js', 'utf8'));
w.confirm = () => true;

/* ── a sheet built like theirs: a summary, then one tab per holy site and phase ── */
const SC = w.STATE.sites.filter(x => w.tafScopeOk(x)), mina = SC.filter(x => x.zone === 'منى'), arf = SC.filter(x => x.zone === 'عرفات');
const HEAD = ['الترتيب', 'المقطع', 'البوّابة', 'المعرّف', 'النوع', 'الاعتماد', 'الشارع', 'العرض م', 'أطقم الآن', 'أطقم مطلوبة', 'نسبة العرض المقروءة', 'سبب الإدراج', 'التحدّيات'];
const row = (k, sec, x, wd, now, req, ap, why, ch) => [k, sec, x.name || '', x.id, 'نقطة', ap, '', wd, now, req, 1, why || '', ch || ''];
const JM = w.STATE.sites.filter(x => /^NSK-JMR-/.test(x.id) && x.zone === 'منى' && x.type === 'جسر');
const book = (issue, tabs) => { const wb = w.XLSX.utils.book_new();
  w.XLSX.utils.book_append_sheet(wb, w.XLSX.utils.aoa_to_sheet([['هندسة رصد التفويج — الإصدار ' + issue + ' (٢٠ نوفمبر ٢٠٢٦)'], [], ['المشعر', 'السيناريو']]), 'الملخّص');
  Object.keys(tabs).forEach(n => w.XLSX.utils.book_append_sheet(wb, w.XLSX.utils.aoa_to_sheet([HEAD].concat(tabs[n])), n));
  return w.XLSX.read(w.XLSX.write(wb, { type:'array', bookType:'xlsx' }), { type:'array' }); };
const WB3 = book('٣', {
  'منى — المرحلة ١': [row(1, 6, mina[0], 43, 1, 3, 'قائم'), row(1, 6, mina[1], 43, 1, 3, 'قائم'), row(2, 340, mina[2], '', 2, 2, 'بانتظار الاعتماد', 'ضبط فوهة الشعبين', 'ارتفاع صعب الوصول')],
  'منى — المرحلة ٢': [row(19, 2, mina[3], 12.9, 1, 1, 'قائم', '', 'أخرى — اذكرها في وصف التحدي'), row(20, 3, JM[0], 9, 2, 2, 'قائم', '', 'أخرى — اذكرها في وصف التحدي · عائق إنشائي')],
  'منى — خارج الحاجة': [row(80, 179, mina[4], 68, 1, 5, 'قائم', '', 'المسار داخل نفق'), row(81, 132, mina[5], 13, 1, 1, 'بانتظار الاعتماد')],
  'عرفات — المرحلة ١': [row(1, 11, arf[0], 30.2, 1, 3, 'قائم')],
  'عرفات — المرحلة ٢': [row(15, 322, arf[1], 50.4, 1, 4, 'بانتظار الاعتماد')],
  'عرفات — خارج الحاجة': [row(27, 226, arf[2], 51.2, 1, 4, 'قائم'), [28, 30, 'ليست عندنا', 'NSK-XXX-NOPE-1', '', 'قائم', '', 44, 1, 3, 1, '', '']],
  'الأطواق': [['نوع'], ['بوّابة ساحة محطة']] });
const tech = x => { w.STATE.recs[x.id] = { id:x.id, at:Date.now(), by:'فني', access:'تم الوصول', review:'approved', reviewBy:'مهندس', chals:['لا توجد تحديات'] }; };
[mina[0], mina[4], arf[1], mina[6]].forEach(tech);
w.STATE.taf = {}; w.STATE.taf[mina[0].id] = { d:'no', why:'مكانها غير صحيح', note:'قريبة من مدخل النفق', by:'تفويج', at:1 }; w.STATE.taf[mina[4].id] = { d:'ok', by:'تفويج', at:1 };
const bump = () => { if (w.DB.memo) w.DB.memo.life = null; if (typeof w.statBump === 'function') w.statBump(); };
bump();

console.log('\n══ ١ · قبل استيراد الخطة لا يتغيّر شيء ══');
T(!w.tafPlanMeta() && w.tafDecision(mina[0].id) === 'no' && w.tafDecision(mina[4].id) === 'ok' && w.lifeOf(mina[4]) === 'ready', 'القراراتُ القديمة قائمة: مرفوضةٌ ومعتمدة، والمعتمدةُ جاهزةٌ للتركيب');
T(/data-tafok=|data-tafno=|data-tafundo=/.test(w.tafPopHtml(mina[4])) && w.tafWaitLbl() === 'بانتظار اعتماد إدارة التفويج', 'والبطاقةُ بأزرارها القديمة، والاسمُ القديم');
T(/data-tafplanfile/.test(w.tafDash()), 'وللمهندس زرُّ استيراد خطة الرصد في اللوحة');

console.log('\n══ ٢ · قراءةُ الشيت بأسماء تبويباته وأعمدته ══');
const P = w.tafPlanParse(WB3);
T(P.name === 'الإصدار ٣' && P.n.p1 === 4 && P.n.p2 === 3 && P.n.out === 4, 'الإصدار ٣ · مرحلة أولى ٤ · ثانية ٣ · خارج الحاجة ٤ (والأطواقُ والملخّصُ لا يُقرآن بوّابات)');
{ const a = P.m[mina[2].id], b = P.m[mina[0].id];
  T(a.p === 'p1' && a.k === 2 && a.s === 340 && a.n === 2 && a.r === 2 && a.a === 'بانتظار الاعتماد' && a.c === 'ضبط فوهة الشعبين · ارتفاع صعب الوصول' && !('w' in a), 'البوّابة: المرحلة والترتيب والمقطع والأطقم وحالتُها وتعليقاتُها — والعرضُ الفارغ لا يُكتب صفرًا');
  T(b.w === 43 && b.r === 3 && !b.c, 'والعرضُ والمطلوبُ أرقامًا، وبلا تعليقٍ حين لا تعليق');
  T(!P.m[mina[3].id].c && P.m[JM[0].id].c === 'عائق إنشائي', '«أخرى — اذكرها…» خانةُ النموذج الفارغة لا تُكتب تعليقًا'); }

console.log('\n══ ٣ · الخطةُ هي القرار ══');
const Q0 = w.STATE.queue.length; T(w.tafPlanApply(P) === true, 'اعتُمدت الخطة');
bump();
const M = w.tafPlanMeta();
T(M && M.name === 'الإصدار ٣' && M.n === 10 && M.miss === 1, '١٠ بوّاباتٍ في النظام · واحدةٌ في الملف ليست في النظام تُعَدّ ولا تُخترَع');
T(w.tafPhase(mina[0].id) === 'p1' && w.tafPhase(mina[3].id) === 'p2' && w.tafPhase(mina[4].id) === 'out' && w.tafPhase(mina[6].id) === '', 'لكلِّ بوّابةٍ مرحلتُها، وما ليس في الشيت «غير مصنفة»');
T(w.tafDecision(mina[0].id) === 'ok' && w.tafDecision(mina[3].id) === '' && w.tafDecision(mina[4].id) === '' && SC.every(x => w.tafDecision(x.id) !== 'no'), 'المرحلةُ الأولى تمضي، والباقي ينتظر — ولا بوّابةَ «مرفوضة» بالخطة');
T(JM.length > 0 && !w.tafInScope(JM[0].id) && w.tafPhase(JM[0].id) === 'p2' && w.lifeOf(JM[0]) !== 'minwait' && /id="tafPlanCard"/.test(w.tafPopHtml(JM[0])) && w.tafSites('منى').some(q => q.x.id === JM[0].id), 'مدخلُ الجمرات الذي يسمّيه الشيت: مرحلتُه في بطاقته واللوحة — ودورتُه كما كانت لا تنتظر');
T(w.lifeOf(mina[0]) === 'ready' && w.lifeOf(mina[4]) === 'minwait' && w.lifeOf(arf[1]) === 'minwait' && w.lifeOf(mina[6]) === 'minwait', 'في الدورة: الأولى جاهزةٌ للتركيب (ولو رُفضت قبلًا)، والثانيةُ وخارجُ الحاجة وغيرُ المصنفة تنتظر');
T(w.LIFE.minwait.n === 'خارج المرحلة الأولى في خطة الرصد' && w.tafWaitLbl() === w.LIFE.minwait.n && w.SV_LISTS.minwait[0] === w.LIFE.minwait.n, 'واسمُ حالة الانتظار صار من الخطة — في الخريطة ومتابعة الوزارة');
{ const q = w.STATE.queue.filter(x => x.kind === 'cfg' && x.id === 'tafappr')[0], m = q && q.v && q.v.m;
  T(w.STATE.queue.length > Q0 && m && m.__plan && m.__plan.v === M.v && m[mina[0].id].pl.p === 'p1' && m[mina[0].id].note === 'قريبة من مدخل النفق', 'والكتابةُ في الطابور: الخطةُ وكلُّ بوّابةٍ بمرحلتها، والتعليقُ القديم محفوظ'); }

console.log('\n══ ٤ · بطاقةُ النقطة تتكلّم بحالات الشيت وتعليقاته ══');
{ const h = w.tafPopHtml(mina[2]), h0 = w.tafPopHtml(mina[0]);
  T(/id="tafPlanCard"/.test(h) && />مرحلة أولى</.test(h) && h.indexOf('ضبط فوهة الشعبين · ارتفاع صعب الوصول') > -1 && /بانتظار الاعتماد/.test(h), 'المرحلةُ وتعليقاتُ الشيت وحالتُها فيه');
  T(!/data-tafok=|data-tafno=|data-tafundo=|data-tafsave=/.test(h) && !/معتمدة من إدارة التفويج|رفضتها إدارة التفويج/.test(h), 'ولا زرَّ اعتمادٍ ولا رفض، ولا عبارتَيهما');
  T(h0.indexOf(w.nm(43)) > -1 && /موجود/.test(h0) && /<b>٣<\/b>|<b>3<\/b>/.test(h0) && /تعليقٌ سابق/.test(h0) && h0.indexOf('قريبة من مدخل النفق') > -1, 'العرضُ ٤٣ م والأطقمُ موجود ١ · مطلوب ٣، والتعليقُ السابق باقٍ تعليقًا');
  T((h.match(/data-tafph="/g) || []).length === 4 && /data-tafphc=/.test(h) && /معيار النقطة/.test(h), 'وللمهندس تغييرُ المرحلة والتعليق — ومعيارُ النقطة في مكانه');
  T(/>خارج الحاجة الرصدية</.test(w.tafPopHtml(mina[4])) && />غير مصنفة</.test(w.tafPopHtml(mina[6])), '«خارج الحاجة الرصدية» و«غير مصنفة» بأسمائهما'); }

console.log('\n══ ٥ · لوحةُ متابعة الوزارة بالحالات الجديدة ══');
{ const all = w.tafSites(''), C = w.tafPlanCount(all), h = w.tafDash();
  T(C.p1 === 4 && C.p2 === 3 && C.out === 3 && C[''] === SC.length - 9 && C.n === SC.length + 1, 'الأعداد: أولى ٤ · ثانية ٣ · خارج الحاجة ٣ · غير مصنفة ' + (SC.length - 9));
  T(C.kn.p1 === 4 && C.kr.p1 === 8 && C.kn.p2 === 4 && C.kr.p2 === 7, 'الأطقم: المقطعُ ذو البوّابتين يُعَدّ مرةً — أولى مطلوب ٨ وموجود ٤، ثانية ٧ و٤');
  T(/id="tafPlanHero"/.test(h) && /الإصدار ٣/.test(h) && />مرحلة أولى · /.test(h.replace(/<[^>]+>/g, m => m === '</span>' ? '<' : m).replace(/<[^<>]*>/g, '>')) || /مرحلة أولى/.test(h), 'اللوحةُ بخطة الرصد وإصدارها');
  T(!/أسبابُ الرفض|data-taflist=|>معتمدة<|>مرفوضة</.test(h) && /data-tafz="منى"/.test(h) && /data-tafplanfile/.test(h) && /data-tafxl/.test(h), 'بلا «معتمدة/مرفوضة/أسباب الرفض» — وبطاقتا المشعرين والاستيرادُ والإكسل');
  w.PV.TAF_Z = 'منى'; w.PV.TAF_PLIST = 'p1'; const hz = w.tafDash(), CZ = w.tafPlanCount(w.tafSites('منى'));
  T(CZ.p1 === 3 && /data-mfu-list="tafp_p1\|منى"|tafp_p1\|منى/.test(hz) && (hz.match(/data-tafplist="/g) || []).length === 4, 'بطاقةُ منى: أرقامُ كلِّ مرحلةٍ تفتح قائمتَها، وشرائحُ المراحل الأربع');
  T(hz.indexOf('\u{1F4AC} ضبط فوهة الشعبين · ارتفاع صعب الوصول') > -1 && hz.indexOf(mina[2].id) > -1 && hz.indexOf(mina[3].id) < 0, 'والقائمةُ ببوّابات المرحلة المختارة وتعليقاتها');
  const Lr = w.MFU.lists['tafp_out|منى'].rows(); T(Lr.length === 2 && Lr[0][3] === 'خارج الحاجة الرصدية' && Lr.some(r => r[8] === 'المسار داخل نفق'), 'ونافذةُ التفصيل: بوّاباتُ «خارج الحاجة» بتعليقاتها');
  w.PV.TAF_Z = ''; }

console.log('\n══ ٦ · الإكسل والعقل ══');
{ let cap = null; const keep = w.mtXlsx; w.mtXlsx = (n, hd, rows) => { cap = { n, hd, rows }; return true; }; w.tafXlsx(); w.mtXlsx = keep;
  const c = n => cap.hd.indexOf(n), r = cap.rows.find(x => x[0] === mina[2].id);
  T(cap.n === 'خطة رصد التفويج' && cap.rows.length === SC.length + 1 && r[c('مرحلة الرصد')] === 'مرحلة أولى' && r[c('أطقم مطلوبة')] === 2 && r[c('التعليق')] === 'ضبط فوهة الشعبين · ارتفاع صعب الوصول' && c('القرار') < 0 && c('سبب الرفض') < 0, 'الإكسل «خطة رصد التفويج»: المرحلةُ والأطقمُ والتعليق — بلا «القرار» و«سبب الرفض»');
  w.PV.AQ_CTX = null; const a = w.aqAnswer('خطة الرصد فيها كام بوابة في المرحلة الاولى') || '', tx = a.replace(/<[^>]+>/g, ' ');
  T(/خطة رصد التفويج/.test(tx) && new RegExp('مرحلة أولى\\s*' + w.nm(4)).test(tx) && new RegExp('مرحلة ثانية\\s*' + w.nm(3)).test(tx) && new RegExp('خارج الحاجة الرصدية\\s*' + w.nm(3)).test(tx), 'والعقلُ يجيب بأعداد المراحل نفسِها');
  w.PV.AQ_CTX = null; const tz = (w.aqAnswer('خطة الرصد في عرفات') || '').replace(/<[^>]+>/g, ' ');
  T(new RegExp('مرحلة أولى\\s*' + w.nm(1) + '\\s').test(tz) && new RegExp('مرحلة ثانية\\s*' + w.nm(1) + '\\s').test(tz), 'وبالمشعر حين يُسمّى: عرفات أولى ١ وثانية ١'); }

console.log('\n══ ٧ · التعديلُ باليد، والوزارةُ تقرأ فقط ══');
{ T(w.tafPlanSet(mina[3].id, 'p1') && w.tafPhase(mina[3].id) === 'p1' && w.tafDecision(mina[3].id) === 'ok', 'المهندسُ ينقل بوّابةً إلى المرحلة الأولى فتمضي');
  T(w.tafPlanSet(mina[3].id, null, 'بعد اجتماع ٢٥ نوفمبر') && w.tafPlan(mina[3].id).c === 'بعد اجتماع ٢٥ نوفمبر' && w.tafPhase(mina[3].id) === 'p1', 'ويكتب تعليقًا فلا تتغيّر المرحلة');
  w.tafPlanSet(mina[3].id, 'p2');
  const was = w.ROLE; w.ROLE = 'viewer'; const hv = w.tafPopHtml(mina[2]), dv = w.tafDash();
  T(/id="tafPlanCard"/.test(hv) && !/data-tafph=|data-tafphc=/.test(hv) && !/data-tafplanfile/.test(dv) && w.tafPlanSet(mina[2].id, 'out') === false && w.tafPhase(mina[2].id) === 'p1', 'الوزارةُ ترى المرحلةَ والتعليق — بلا تعديلٍ ولا استيراد');
  w.ROLE = was; }

console.log('\n══ ٨ · شيتٌ أحدث يحلّ محلَّ القديم كلَّه ══');
{ const WB4 = book('٤', { 'منى — المرحلة ١': [row(1, 6, mina[0], 43, 1, 3, 'قائم'), row(2, 7, mina[4], 68, 1, 5, 'قائم')] });
  w.tafPlanApply(w.tafPlanParse(WB4)); bump();
  T(w.tafPlanMeta().name === 'الإصدار ٤' && w.tafPhase(mina[4].id) === 'p1' && w.tafPhase(mina[1].id) === '' && w.tafPhase(arf[0].id) === '', 'الإصدار ٤: ما خرج من الشيت عاد «غير مصنفة» — لا يبقى على مرحلته القديمة');
  T(w.lifeOf(mina[4]) === 'ready' && w.tafPlanCount(w.tafSites('')).p1 === 2, 'والدورةُ والأعدادُ تتبعان الشيتَ الجديد'); }

console.log('\n══ ٩ · الدراسةُ نفسُها مرجعًا بجوار الخطة (V47.13) ══');
{ const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const par = (tx, st, num) => '<w:p><w:pPr>' + (st ? '<w:pStyle w:val="' + st + '"/>' : '') + (num ? '<w:numPr><w:ilvl w:val="0"/></w:numPr>' : '') + '</w:pPr><w:r><w:t>' + tx + '</w:t></w:r></w:p>';
  const tc = x => '<w:tc><w:p><w:r><w:t>' + x + '</w:t></w:r></w:p></w:tc>';
  const XML = '<?xml version="1.0"?><w:document ' + W + '><w:body>' + par('لصالح: إدارة التفويج') + par('المحتويات') + par('١. الخلاصة التنفيذية3', 'TOC1')
    + par('١. الخلاصة التنفيذية', 'Heading1') + par('البوّابة تُقاس بما تُخبر به مركزَ التفويج.') + par('المرحلة ١ — منى', 'Heading2') + par('توصيةٌ أولى', '', 1)
    + '<w:tbl><w:tr>' + tc('المشعر') + tc('أطقم') + '</w:tr><w:tr>' + tc('منى') + tc('٥٤') + '</w:tr></w:tbl>' + par('٢. المنهج والبيانات', 'Heading1') + par('فقرةُ المنهج.') + '</w:body></w:document>';
  w.localStorage.removeItem('nsk14.tafref'); w.tafRefLoad.d = null; w.tafRefLoad.b = null;
  const h0 = w.tafSpecsHtml();
  T(/id="tafRefCard"/.test(h0) && /لم تُرفَع الدراسةُ بعد/.test(h0) && /data-tafreffile/.test(h0), 'قبل الرفع: البطاقةُ تقول «لم تُرفع بعد» وللمهندس زرُّ الرفع');
  const R = w.tafRefParse(XML), kinds = R.b.map(b => b[0]).join(',');
  T(kinds === 'p,h1,p,h2,li,t,h1,p' && R.b[5][1].length === 2 && R.b[5][1][1][1] === '٥٤', 'قراءةُ الوورد: العناوينُ والفقراتُ والبنودُ والجدول — وفهرسُ المحتويات لا يُكرَّر');
  const Q1 = w.STATE.queue.length; T(w.tafRefApply(R, 'هندسة رصد التفويج 3.docx') === true, 'حُفظت الدراسة');
  { const q = w.STATE.queue.filter(x => x.kind === 'cfg' && x.id === 'tafref').pop();
    T(w.STATE.queue.length > Q1 && q && typeof q.v.j === 'string' && q.v.n === 8 && q.v.name === 'هندسة رصد التفويج 3.docx' && Object.keys(q.v).every(k => typeof q.v[k] !== 'object'), 'في وثيقتها settings/tafref: نصٌّ واحدٌ بلا مصفوفاتٍ متداخلة (القاعدةُ ترفضها)');
    T(!!w.localStorage.getItem('nsk14.tafref'), 'ونسخةٌ على الجهاز تُفتح بلا شبكة'); }
  const h = w.tafSpecsHtml();
  T((h.match(/<details/g) || []).length === 3 && /<summary[^>]*>١\. الخلاصة التنفيذية<\/summary>/.test(h) && /<th [^>]*>المشعر<\/th>/.test(h) && /<td [^>]*>٥٤<\/td>/.test(h) && /• توصيةٌ أولى/.test(h), 'البطاقة: قسمٌ يُطوى لكلِّ عنوان، والجدولُ جدولًا، والبنودُ بنودًا');
  T(/الأشكالُ في الملف الأصلي/.test(h) && /رفع إصدار أحدث/.test(h) && h.indexOf('tafRefCard') < h.indexOf('ملفات إدارة التفويج'), 'وتقول إن الأشكالَ في الملف الأصلي — وهي فوق ملفات إدارة التفويج');
  T(w.tafRefApply({ b:[] }, 'x.docx') === false && w.tafRefLoad.d.n === 8, 'ملفٌّ بلا نصٍّ لا يمحو المرجعَ القائم');
  const was = w.ROLE; w.ROLE = 'viewer'; const hv = w.tafSpecsHtml();
  T(!/tafRefCard|data-tafreffile/.test(hv) && /ملفات إدارة التفويج/.test(hv), 'دورُ الوزارة للقراءة لا يرى الدراسة — وباقي الملفات في مكانها');
  w.ROLE = 'tafweej'; const ht = w.tafSpecsHtml(); T(/tafRefCard/.test(ht) && /<details/.test(ht) && !/data-tafreffile/.test(ht), 'إدارةُ التفويج تقرؤها بلا زرِّ رفع');
  w.ROLE = was; }

console.log(fails.length ? '\nخطةُ رصد التفويج: فشل ✗ (' + fails.length + ')' : '\n✓ ' + pass + ' فحصًا — حالاتُ الشيت في مكان الاعتماد والرفض');
process.exit(fails.length ? 1 : 0);
