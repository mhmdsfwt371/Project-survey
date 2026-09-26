/* ═══════════════════════════════════════════════════════════════════════════
   جردُ متابعة الوزارة — node scripts/audit-mfu.mjs
   ───────────────────────────────────────────────────────────────────────────
   الصفحةُ بعناوين العرض الأسبوعي، وشاشةُ القاعة انتقلت إليها، والوزارةُ والإدارةُ
   العليا تريانها. المعوقاتُ بفئاتها وجهاتها (والجهةُ تُضبَط)، والشركاتُ بمستوياتها
   والأضعفُ أوّلًا، والسجلّان يُكتَبان في settings/mfu للمكتب وحدَه، والمقارنةُ بلقطة
   الأسبوع الماضي، والمنحنى اليوميّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
/* مفكّكُ نصوصٍ آمنٌ بين عالمي الفحص والصفحة */
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };
const open = async tab => { w.goPage('mfu'); w.render(1); await wait(40); const b = d.querySelector('[data-ptab="mfu:' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120); } return d.getElementById('content'); };

console.log('\n══ ١ · الصفحةُ وعناوينُها ══');
const tabs = w.TABS.mfu.map(x => x[0]);
T(['mfu','mtasks','minst','mcos','mobs','mchal','mreq','mdaily','kiosk'].every(x => tabs.includes(x)), 'عناوينُ العرض الأسبوعي كلُّها: ' + tabs.length);
T(!w.TABS.over.some(x => x[0] === 'kiosk') && w.PARENT.kiosk === 'mfu', 'وشاشةُ القاعة انتقلت إلى متابعة الوزارة');
for (const r of ['viewer', 'exec']){ w.ROLE = r; w.STATE.meta.role = r; }
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
T(w.seesPage('mfu') && ['mcos','mobs','mchal','mreq','kiosk'].every(id => w.tabsOf('mfu').some(tb => tb[0] === id)), 'والوزارةُ تراها بتبويباتها');
T(w.mfuPut('chal', 'X', { t:'x' }) === false, 'ولا تكتب فيها');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٢ · المعوقاتُ وجهاتُها ══');
const camps = w.STATE.sites.filter(x => x.type === 'مخيم' && x.co).slice(0, 6), now = Date.now();
camps.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at:now, by:'أحمد', access: i === 5 ? 'لم يُصل' : 'تم الوصول', chals: i === 0 ? ['العارضة الحديدية ناقصة أو غير مكتملة'] : i === 1 ? ['المدخل غير واضح — لم يُستدل عليه'] : i === 2 ? ['عائق إنشائي'] : [] }; });
w.STATE.inss[camps[3].id] = { id:camps[3].id, status:'مُركّب', at:now, by:'سالم' };
const O = w.mfuObstacles();
T(O.length === 4 && O.some(o => o.cats.includes('تعذّر الوصول')), 'أربعةُ معوقات: ثلاثةُ تحدياتٍ وتعذّرُ وصول — والمركَّبُ ليس عائقًا');
T(w.mfuOwnerOf('العارضة الحديدية ناقصة أو غير مكتملة') === 'كدانة' && w.mfuOwnerOf('المدخل غير واضح — لم يُستدل عليه') === 'أفاقي' && w.mfuOwnerOf('عائق إنشائي') === 'شركة الخدمة', 'الجهاتُ الافتراضية: كدانة وأفاقي وشركة الخدمة');
const ob = await open('mobs');
T(/إجمالي المعوقات/.test(ob.textContent) && ob.querySelectorAll('[data-mfuown]').length >= 3, 'بيانُ المعوقات بفئاته والجهةُ تُضبَط من الجدول');
const sel = ob.querySelector('[data-mfuown]'); const cat = sel.getAttribute('data-mfuown'); sel.value = 'كدانة'; sel.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuOwnerOf(cat) === 'كدانة' && wrote.some(r => r[1] === 'mfu' && r[2].own && r[2].own[cat] === 'كدانة'), 'وتغييرُ الجهة يُحفَظ في settings/mfu');

console.log('\n══ ٣ · الشركات ══');
const C = w.mfuCompanies();
T(C.length > 0 && C.every(c => c.n >= c.ins + c.obs && c.pct >= 0 && c.pct <= 100), 'لكلِّ شركةٍ مستهدفٌ وما رُكّب وعوائقُ ومتبقٍّ ونسبة');
T(w.mfuLevel(80)[0] === 'ممتاز' && w.mfuLevel(50)[0] === 'متوسط' && w.mfuLevel(10)[0] === 'ضعيف', 'والمستوى: ممتاز ٧٥+ · متوسط ٤٠–٧٤ · ضعيف أقل من ٤٠');
const co = await open('mcos');
T(co.querySelectorAll('.mfu-co').length === Math.min(12, C.length) && !!co.querySelector('[data-mfucosall]'), 'الأضعفُ أوّلًا في اثنتي عشرة بطاقة، و«اعرض الكل»');
co.querySelector('[data-mfucosall]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(d.querySelectorAll('.mfu-co').length === C.length, 'واعرض الكلَّ يعرض ' + C.length);

console.log('\n══ ٤ · السجلّان ══');
await open('mchal');
d.getElementById('mcT').value = 'تأخّر الشحنات'; d.getElementById('mcM').value = 'إعادة الجدولة مع المصنع'; d.getElementById('mcO').value = 'المشتريات';
d.querySelector('[data-mfuchal]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const wc = wrote.find(r => r[1] === 'mfu' && r[2].chal);
T(!!wc && Object.values(wc[2].chal)[0].m === 'إعادة الجدولة مع المصنع' && Object.values(wc[2].chal)[0].st === 'مفتوح', 'التحدي بآلية معالجته يُكتَب مفتوحًا');
const st = d.querySelector('[data-mfuchalst]'); st.value = 'مغلق'; st.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuList('chal')[0].st === 'مغلق', 'وحالتُه تتغيّر من الجدول');
const chc = d.getElementById('content'), tbPos = chc.innerHTML.indexOf('التحديات وآليات المعالجة \u2014'), fmPos = chc.innerHTML.indexOf('class="mfu-add"');
T(tbPos > -1 && fmPos > tbPos && !chc.querySelector('details.mfu-add').open, 'القائمةُ أوّلًا والنموذجُ بعدها مطويٌّ خلف «＋ تحدٍّ جديد» (V20.3)');
await open('mreq');
d.getElementById('mrT').value = 'تركيب إضاءةٍ إرشادية على أبواب المخيمات'; d.getElementById('mrU').value = 'رُكّبت على ١٠٠ مخيم';
d.querySelector('[data-mfureq]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const up = d.querySelector('[data-mfurequ]'); up.value = 'رُكّبت على ١٥٠ مخيم'; up.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuList('req')[0].u === 'رُكّبت على ١٥٠ مخيم', 'وطلبُ الوزارة تُحدَّث إفادتُه من مكانها');
d.querySelector('[data-mfudel^="req|"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(40);
T(w.mfuList('req').length === 0, 'والحذفُ شاهدٌ لا محو');

console.log('\n══ ٥ · الملخّصُ والمقارنةُ والمنحنى ══');
const K = w.mfuKpis();
w.STATE.mfu = w.MFU.v = Object.assign(w.MFU.v || {}, { snap:{ '2000-W01':{ sv:K.sv - 3, ins:K.ins, campIns:K.campIns - 1, corIns:K.corIns, obs:K.obs + 2 } } });
const sm = await open('mfu');
T(/▲ \+[٣3]/.test(sm.textContent) && /▼/.test(sm.textContent) && /عن الأسبوع الماضي/.test(sm.textContent), 'الملخّصُ يقارن بلقطة الأسبوع الماضي: المسحُ ▲ +٣ والمعوقاتُ ▼');
const dl = await open('mdaily');
T(!!dl.querySelector('polyline') && /ملخص التركيبات اليومي/.test(dl.textContent), 'والمنحنى اليوميّ للتركيب والمسح');
const mt = await open('mtasks');
T(/حالة أبرز المهام/.test(mt.textContent) && mt.querySelectorAll('.mfu-bar').length === w.mileList().length, 'وحالةُ أبرز المهام من المعالم بشريط إنجاز');

console.log('\n══ ٦ · التصدير: وورد وإكسل وPDF من مصدرٍ واحد (V20.2) ══');
await open('mcos');
T(['docx', 'xlsx', 'pdf'].every(f => !!d.querySelector('[data-mfuexp="' + f + '"]')), 'شريطُ التصدير على العنوان: Word وExcel وPDF');
const R = w.mfuReport();
T(w.MFU_SECTIONS.length === 11 && w.MFU_SECTIONS.every(sc => Array.isArray(w.mfuRowsOf(R, sc[0]))) && R.kpis.length === 7 && /١٤٤٨|1448/.test(R.hijri + '1448'), 'التقريرُ بعناوين العرض وكتلِ المسار وآخرِ التحديثات (١١)، والتاريخُ الهجريُّ والميلادي');
let got = null; w.Blob = function(parts, o){ this.parts = parts; this.o = o; }; w.dl = (b, name) => { got = { b, name }; return true; };
w.mfuDocx();
const bytes = got && got.b.parts[0];
const txt = Buffer.from(bytes).toString('utf8');
T(!!bytes && bytes[0] === 0x50 && bytes[1] === 0x4B && /word\/document\.xml/.test(txt) && /\[Content_Types\]\.xml/.test(txt) && /\.docx$/.test(got.name), 'وورد: ملفُّ docx حقيقيّ (ZIP بمستنداته) باسم التحديث الأسبوعي');
const docXml = w.mfuDocxXml(R);
const parsed = new w.DOMParser().parseFromString(docXml, 'application/xml');
T(!parsed.getElementsByTagName('parsererror').length && /w:orient="landscape"/.test(docXml) && /<w:bidi\/>/.test(docXml) && /w:fill="163E35"/.test(docXml) && /C8943E/.test(docXml), 'ونصُّه سليمُ البناء، عرضيٌّ من اليمين بألوان العرض');
T(w.MFU_SECTIONS.every(sc => docXml.includes(sc[1].replace(/&/g, '&amp;'))), 'ويحمل العناوينَ التسعةَ كلَّها');
const ph = w.mfuPrintHtml(R);
T(/@page\{size:A4 landscape/.test(ph) && (ph.match(/<section>/g) || []).length === 11 && /class="cover"/.test(ph) && /Alexandria/.test(ph), 'PDF: صفحةُ طباعةٍ عرضيةٌ بغلافٍ وأحد عشر قسمًا وخطِّ العرض');
let printed = 0; w.open = () => ({ document:{ open(){}, write(){}, close(){} }, focus(){}, print(){ printed++; } });
w.mfuPdf(); await wait(450);
T(printed === 1, 'وزرُّه يفتح نافذةَ الطباعة (حفظٌ كـ PDF)');
const sheets = []; w.xlsxLoad = () => Promise.resolve(true);
w.XLSX = { utils:{ book_new: () => ({}), aoa_to_sheet: rows => ({ rows }), book_append_sheet: (wb, ws, name) => { sheets.push([name, ws.rows[0]]); } }, writeFile: () => {} };
await w.mfuXlsx();
T(sheets.length === 11 && sheets[0][0] === 'الملخص' && sheets.some(s => s[0].indexOf('طلبات الوزارة') === 0), 'إكسل: ورقةٌ لكلِّ عنوان — إحدى عشرة ورقة');

console.log('\n══ ٧ · باوربوينت من قالب الوزارة (V20.4) ══');
const tplBuf = readFileSync('templates/weekly-readers.pptx');
T(!!d.querySelector('[data-mfuexp="pptx"]'), 'زرُّ PowerPoint في شريط التصدير');
w.fetch = async () => ({ ok:true, arrayBuffer: async () => tplBuf.buffer.slice(tplBuf.byteOffset, tplBuf.byteOffset + tplBuf.byteLength) });
w.PPTX_TPL = null; got = null;
w.STATE.mfu = w.MFU.v = Object.assign(w.MFU.v || {}, { chal:{ C9:{ t:'تأخّر الشحنات', m:'إعادة الجدولة', o:'المشتريات', st:'مفتوح', at:Date.now() } }, req:{ Q9:{ t:'إضاءةٌ إرشادية', u:'رُكّبت على ١٠٠ مخيم', st:'قيد التنفيذ', at:Date.now() } } });
const t0 = Date.now(); await w.mfuPptx(); const ms = Date.now() - t0;
const out = got && got.b.parts[0];
T(!!out && /\.pptx$/.test(got.name) && ms < 3000, 'العرضُ يُبنى من القالب في ' + ms + ' م.ث');
const E0 = w.ooxRead(new Uint8Array(tplBuf)), E1 = w.ooxRead(out);
T(E1.length === E0.length && E1[0].name === '[Content_Types].xml', 'بأجزاء القالب كلِّها (' + E1.length + ') و[Content_Types] أوّلًا');
const same = E0.filter(e => e.method === 8).every(e => { const f = E1.find(x => x.name === e.name); return f && f.method === 8 && f.crc === e.crc && f.csize === e.csize; });
T(same, 'وما لم يتغيّر يُنسَخ بضغطه كما هو — الخطوطُ المضمَّنةُ والصورُ والقوالب');
const td = new TD(), slides = E1.filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.name)).map(e => ({ n:e.name, x:td.decode(e.raw) }));
T(slides.length === 12 && slides.every(s => !/\{\{[THG]\}\}/.test(s.x) && !/name="BODY"/.test(s.x)), 'اثنتا عشرة شريحة بلا عنصرٍ نائبٍ باقٍ — ومنها شريحةُ المسار');
T(slides.every(s => !new w.DOMParser().parseFromString(s.x, 'application/xml').getElementsByTagName('parsererror').length), 'وكلُّ شريحةٍ سليمةُ البناء');
const all = slides.map(s => s.x).join('');
T(['ملخص مسار القارئات', 'حالة أبرز مهام مسار القارئات', 'حالة التركيبات', 'تركيب مخيمات لشركات الخدمة', 'بيان المعوقات وتصنيفها', 'التحديات / آليات المعالجة', 'تحديث حالة طلبات الوزارة', 'ملخص التركيبات اليومي'].every(t0 => all.includes(t0)), 'بعناوين العرض الثمانية');
T(all.includes('تأخّر الشحنات') && all.includes('إعادة الجدولة') && all.includes('إضاءةٌ إرشادية') && /typeface="Alexandria"/.test(all) && /<a:tblPr rtl="1"/.test(all), 'والتحدياتُ والطلباتُ بنصّها، وجداولُ من اليمين بخطِّ العرض');
const cover = slides.find(s => s.n === 'ppt/slides/slide1.xml').x;
T(cover.includes(new Date().toISOString().slice(0, 10)), 'والغلافُ بتاريخ اليوم الميلاديِّ والهجري');

console.log('\n══ ٨ · التحدياتُ بمصادرها والمهامُّ الأسبوعيةُ مربوطة (V20.5) ══');
w.MFU.v = w.STATE.mfu = {}; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
const cats0 = w.mfuAllChal().filter(c => c.src === 'field');
T(cats0.length >= 2 && cats0.every(c => c.n > 0 && c.party), 'تحدياتُ المسح الميداني فئاتٌ بعدد نقاطها وجهتها: ' + cats0.map(c => c.t + ' ' + c.n).join(' · '));
let ch = await open('mchal');
T(/من المسح الميداني/.test(ch.textContent) && ch.querySelectorAll('[data-fch$="|owner"]').length === cats0.length, 'تظهر في التحديات بشارة مصدرها، ولكلٍّ «من سيحلّه» و«آلية المعالجة» تُعدَّل');
const fo = ch.querySelector('[data-fch$="|owner"]'), fcat = fo.getAttribute('data-fch').split('|')[0];
fo.value = 'فريق التركيبات'; fo.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(30);
const fm = d.querySelector('[data-fch="' + fcat + '|m"]'); fm.value = 'تنسيقٌ مع كدانة لاستكمال العارضة'; fm.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(30);
const c1 = w.mfuAllChal().find(c => c.key === 'F:' + fcat);
T(c1.owner === 'فريق التركيبات' && c1.m === 'تنسيقٌ مع كدانة لاستكمال العارضة' && wrote.some(r => r[1] === 'mfu' && r[2].fch && r[2].fch[fcat]), 'ومن سيحلّه وآليةُ المعالجة يُحفَظان في settings/mfu');
ch = await open('mchal');
d.querySelector('[data-chaltask="F:' + fcat + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const tsk = w.wtRows().find(r => r.chal === 'F:' + fcat);
T(!!tsk && /^معالجة: /.test(tsk.n) && tsk.who === 'فريق التركيبات' && tsk.track === 'التحديات' && w.mfuAllChal().find(c => c.key === 'F:' + fcat).task == tsk.id, '«＋ مهمة معالجة» تُنشئ مهمةً أسبوعيةً مربوطةً بالتحدي ومسؤولِه');
w.wtStatus(tsk.id, 'مكتمل');
T(w.mfuAllChal().find(c => c.key === 'F:' + fcat).st === 'تم الحل', 'واكتمالُ المهمة يجعل التحدي «تم الحل»');
const other = cats0.find(c => c.t !== fcat);
w.mfuPut('fch', other.t, { owner:'الشركة', at:Date.now() });   /* تحدٍّ تعامل معه المكتب — يبقى بعد حلّه */
w.mfuObstacles().filter(o => o.cats.includes(other.t)).forEach(o => { w.STATE.inss[o.x.id] = { id:o.x.id, status:'مُركّب', at:Date.now(), by:'سالم' }; });
T(w.mfuAllChal().find(c => c.key === 'F:' + other.t).st === 'تم الحل', 'وتحدّي المسح يصير «تم الحل» وحدَه حين تُركَّب نقاطُه كلُّها');
w.wtAdd({ n:'توريد العوارض', who:'المشتريات', track:'التوريدات' }); const t2 = w.wtRows().find(r => r.n === 'توريد العوارض');
w.wtStatus(t2.id, 'متوقف'); w.wtNote && w.wtNote(t2.id, 'المورّد لم يسلّم');
T(w.mfuAllChal().some(c => c.key === 'T:' + t2.id && c.src === 'task' && c.st === 'مفتوح'), 'المهمةُ الأسبوعيةُ المتوقّفةُ تظهر تحدّيًا «من المهام الأسبوعية»');
w.wtStatus(t2.id, 'جاري العمل');
T(w.mfuAllChal().some(c => c.key === 'T:' + t2.id && c.st === 'تم الحل'), 'وحين تُستأنَف تظهر «تم الحل»');
const wk = await open('mweek');
T(/مهمة جديدة/.test(wk.textContent) && /توريد العوارض/.test(wk.textContent), 'المهامُّ الأسبوعيةُ كاملةً داخل متابعة الوزارة — تُضاف وتُحدَّث من هنا');
const mt2 = await open('mtasks');
T(/المسار/.test(mt2.textContent) && /توريد العوارض/.test(mt2.textContent) && /تم حلُّ التحدي/.test(mt2.textContent), 'وحالةُ أبرز المهام من المهام الأسبوعية بأعمدة العرض، وما عالج تحدّيًا يُعلَّم');
const R2 = w.mfuReport();
T(R2.tasks.length === w.wtRows().length && R2.chal.some(r => r[0] === 'من المسح الميداني') && R2.chal.some(r => r[0] === 'من المهام الأسبوعية'), 'والتصديرُ يحمل المهامَّ الأسبوعيةَ والتحدياتِ بمصادرها');

console.log('\n══ ٩ · كلُّ شيءٍ مربوطٌ ويُسمَع في التقرير (V20.6) ══');
w.MFU.v = w.STATE.mfu = {};
await open('mreq');
d.getElementById('mrT').value = 'تركيب إضاءةٍ إرشاديةٍ للتفويج'; d.getElementById('mrS').value = 'دعمُ الشركات بالتصاريح';
d.querySelector('[data-mfureq]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const rq = w.mfuList('req')[0];
T(Array.isArray(rq.hist) && rq.hist[0].f === 'new', 'الطلبُ يُنشأ بسجلٍّ قصيرٍ لما تغيّر');
d.querySelector('[data-reqtask="' + rq.id + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const rt = w.wtRows().find(r => r.req === 'R:' + rq.id), rq2 = w.mfuList('req')[0];
T(!!rt && /^طلب الوزارة: /.test(rt.n) && rt.track === 'طلبات الوزارة' && rq2.task == rt.id && rq2.st === 'قيد التنفيذ', '«＋ مهمة تنفيذ» تُنشئ مهمةً أسبوعيةً مربوطةً بالطلب ويصير «قيد التنفيذ»');
await wait(15); w.wtNote(rt.id, 'رُكّبت الإضاءةُ على ١٢٠ مخيمًا');
const V = w.mfuReqView(w.mfuList('req')[0]);
T(V.u === 'رُكّبت الإضاءةُ على ١٢٠ مخيمًا' && V.uSrc == rt.id, 'وآخرُ ملاحظةٍ في المهمة تصير إفادةَ الطلب (من المهمة #' + rt.id + ')');
w.wtStatus(rt.id, 'متوقف');
T(w.mfuReqView(w.mfuList('req')[0]).blocked && w.mfuAllChal().some(c => c.key === 'T:' + rt.id && !w.mfuChalClosed(c)), 'وتوقّفُها يُعلِّم الطلبَ «متوقفة» ويظهر تحدّيًا قائمًا');
w.wtStatus(rt.id, 'مكتمل');
T(w.mfuReqView(w.mfuList('req')[0]).st === 'منجز' && w.mfuAllChal().some(c => c.key === 'T:' + rt.id && c.st === 'تم الحل'), 'واكتمالُها إنجازُ الطلب، والتحدي «تم الحل»');
const TL = w.mfuTimeline(7, 50);
T(TL.some(e => e.k === 'مهمة' && /رُكّبت الإضاءة/.test(e.txt)) && TL.some(e => e.k === 'طلب الوزارة' && /رُبط بمهمة/.test(e.txt)) && TL.some(e => e.k === 'مهمة' && /مكتمل/.test(e.txt)), 'آخرُ التحديثات سجلٌّ واحدٌ يجمع المهامَّ والطلباتِ والتحديات');
const sm2 = await open('mfu');
T(/آخر التحديثات — هذا الأسبوع/.test(sm2.textContent) && /رُكّبت الإضاءةُ على ١٢٠ مخيمًا/.test(sm2.textContent), 'ويظهر في الملخّص');
const R3 = w.mfuReport();
T(R3.upd.length >= 3 && R3.req[0][5].indexOf('#' + rt.id) === 0 && /منجز/.test(R3.req[0][4]) && R3.tasks.some(r => /طلب/.test(r[6])), 'والتقريرُ يحمله: قسمُ آخر التحديثات، ومهمةُ تنفيذ الطلب وحالتُه، وعمودُ «مرتبطة بـ» في المهام');
const html3 = w.mfuPrintHtml(R3), doc3 = w.mfuDocxXml(R3), sl3 = w.mfuSlides(R3).map(x => x[1]).join('');
T(/آخر التحديثات — هذا الأسبوع/.test(html3) && /آخر التحديثات — هذا الأسبوع/.test(doc3) && /آخر التحديثات هذا الأسبوع/.test(sl3) && /مرتبطة بـ/.test(sl3), 'في PDF ووورد والعرضِ جميعًا');

console.log('\n══ ١٠ · المهامُّ الأسبوعيةُ تُسمَع في المتابعة (V20.7) ══');
w.wtAdd({ n:'تركيب ممرات عرفات', who:'سالم', track:'التركيبات', due:new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10) });
const tm = w.wtRows().find(r => r.n === 'تركيب ممرات عرفات');
const newDue = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
w.wtSet(tm.id, { due:newDue }); w.wtSet(tm.id, { who:'ماجد' });
T(tm.log.some(e => e.f === 'due' && e.to === newDue) && tm.log.some(e => e.f === 'who' && e.from === 'سالم' && e.to === 'ماجد'), 'تأجيلُ الموعد وتغييرُ المسؤول يُسجَّلان بقيمتيهما (كانا صامتين)');
const TL2 = w.mfuTimeline(7, 100);
T(TL2.some(e => /تأجيل الموعد/.test(e.txt) && e.txt.indexOf(newDue) > -1) && TL2.some(e => /المسؤول: سالم/.test(e.txt)), 'ويظهران في آخر التحديثات');
T(w.wtSince().items.some(i => /تأجيل الموعد/.test(i.what)), 'وفي محضر الاجتماع');
w.wtAdd({ n:'مهمةٌ مربوطةٌ ثم تُحذَف', who:'س', track:'التحديات', chal:'M:ZZ' });
const q = w.mfuList('req')[0]; w.wtAdd({ n:'تنفيذٌ يُحذَف', track:'طلبات الوزارة', req:'R:' + q.id });
const td2 = w.wtRows().find(r => r.n === 'تنفيذٌ يُحذَف'); const qn = Object.assign({}, q); delete qn.id; qn.task = td2.id; w.mfuPut('req', q.id, qn);
w.wtRemove(td2.id);
const q2 = w.mfuList('req').find(x => x.id === q.id);
T(!q2.task && q2.hist.some(h => h.f === 'task' && /حُذفت/.test(h.v)), 'وحذفُ مهمةٍ مربوطةٍ يُكتَب على طلبها ويفكّ الربط — فيعود زرُّ «مهمة تنفيذ»');
const B = w.mfuWeekBlocks();
T(B.next.some(r => r.n === 'تركيب ممرات عرفات') === false && B.done.length >= 1 && Array.isArray(B.late) && Array.isArray(B.wait), 'كتلُ المسار: المنجزُ في أسبوع، والقادمُ في سبعة أيام (المؤجَّلُ خرج منها)، والمتأخرُ، والمنتظِر');
const sm3 = await open('mfu');
T(/أبرز الأعمال المنجزة/.test(sm3.textContent) && /أبرز المهام القادمة/.test(sm3.textContent) && /الاعتمادات والدعم المطلوب/.test(sm3.textContent) && /المهام المتأخرة/.test(sm3.textContent) && /أُنجز هذا الأسبوع/.test(sm3.textContent), 'والملخّصُ يعرضها بكتل العرض الأسبوعي الأربع');
w.STATE.wtask.meetAt = Date.now() - 2 * 864e5; w.STATE.wtask.meetBy = 'المهندس';
const sm4 = await open('mfu');
T(/آخر اجتماع/.test(sm4.textContent) && /ما تغيّر منذ آخر اجتماع/.test(sm4.textContent), 'واجتماعُ الأسبوع مرجعٌ: «ما تغيّر منذ آخر اجتماع»');
const R4 = w.mfuReport();
T(R4.blocks.some(r => r[0] === 'أبرز الأعمال المنجزة') && /منذ آخر اجتماع/.test(R4.updTitle) && /منذ آخر اجتماع/.test(w.mfuPrintHtml(R4)) && w.mfuSlides(R4).some(x => x[0] === 'المســـار | القارئات'), 'والتقريرُ بصيغه: كتلُ المسار وعنوانُ «منذ آخر اجتماع» وشريحةُ «المسار | القارئات»');
await open('mcos'); await wait(1700);   /* مؤقّتُ «رآها» من الملخّص السابق ينقضي أوّلًا */
w.localStorage.setItem('nsk14.mfuSeen', '0'); w.render(1); await wait(40);
T(w.mfuUnseen() > 0 && /متابعة الوزارة\s*\S+/.test(d.getElementById('nav').textContent) && !!d.querySelector('#nav a[data-p="mfu"] .tb-badge'), 'والجديدُ منذ آخر زيارةٍ شارةٌ على «متابعة الوزارة» في القائمة');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ متابعة الوزارة نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
