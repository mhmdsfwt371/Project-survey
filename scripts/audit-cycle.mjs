/* ═══════════════════════════════════════════════════════════════════════════
   جردُ دورة الزيارة — يُشغَّل: node scripts/audit-cycle.mjs
   ───────────────────────────────────────────────────────────────────────────
   الدورةُ كما طُلبت في V15.30، خطوةً خطوةً كما يفعلها الناس لا كما تُستدعى
   الدوال: المهندسُ يُسنِد ← المشرفُ يرى مهمتَه وحدَها ونقطتَه بلونها ← يزور
   ويحفظ ← تظهر في «اعتماد الزيارات» ببياناتها ← يردُّها المهندسُ «تحتاج زيارةً
   أخرى» ← يقرأ المشرفُ السببَ في مهامّه ويعود ← يعتمدها المهندسُ ← يقترح
   حلَّها من المنتقي والنمط في الشاشة نفسِها ← تدخل طبقةَ التركيب ← والوزارةُ
   ترى «أمس · الآن · غدًا» والخريطة. وكلُّ خطوةٍ تُنقَر لا تُستدعى — فما ينكسر
   في الزرِّ يُمسَك هنا.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) errs.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
{ const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder; if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network'));
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {}; }
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));
let bad = 0; const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const click = sel => { const b = d.querySelector(sel); if (!b) return false; b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };
const site = w.STATE.sites[0];
/* ١ · المهندس يُسنِد للمشرف */
w.ROLE = 'engineer'; w.STATE.meta.name = 'مهندس الاختبار';
w.STATE.tasks['TK-visit-' + site.id] = { id:'TK-visit-'+site.id, no:'SR-9001', site:site.id, kind:'visit', to:'مشرف الاختبار', assignedTo:'مشرف الاختبار', status:'مطلوب', when:w.dayKey(Date.now()), by:'مهندس الاختبار', at:Date.now() };
w.CUR = 'mywork'; w.MYW_TAB = 'tasks'; w.render(1);
let h = d.getElementById('content').textContent;
T(h.indexOf('مشرف الاختبار') > -1 && h.indexOf(site.id) > -1, 'المهندس يرى الإسناد بمشرفه ونقطته في «مهامي»');
/* ٢ · المشرف يرى مهمته ولونها على الخريطة */
w.ROLE = 'supervisor'; w.STATE.meta.name = 'مشرف الاختبار';
w.CUR = 'mywork'; w.MYW_TAB = 'tasks'; w.render(1);
h = d.getElementById('content').textContent;
T(h.indexOf(site.id) > -1 && h.indexOf('إسناداتٌ مفتوحة') < 0, 'المشرف يرى مهمته وحدها');
w.FIELD_MODE = 'survey';
/* V15.36: الخريطةُ تلوّن دورةَ الحياة كاملةً — المُسنَدُ غيرُ المزور «assigned» */
T(w.lifeOf(site) === 'assigned' && w.mapColorOf(site) === w.LIFE.assigned.c,
  'نقطةٌ مُسندةٌ لم تُزر — لونُ «زيارةٌ مُسندة»');
w.STATE.tasks['TK-visit-' + site.id].when = w.dayKey(Date.now() + 86400000);
T(w.lifeOf(site) === 'tomorrow', 'موعدُ الغد يجعلها «مجدولةٌ غدًا»');
w.STATE.tasks['TK-visit-' + site.id].when = w.dayKey(Date.now());
/* ٣ · المشرف يزور ويحفظ */
w.FORM.site = site.id; w.FORM.access = 'تم الوصول'; w.FORM.photos = { site:{data:'data:,a'}, mount:{data:'data:,b'} }; w.FORM.note = 'مسح تجريبي';
w.svSave(0);
let rec = w.STATE.recs[site.id];
T(rec && w.svReview(rec) === 'pending', 'الزيارة حُفظت وتنتظر الاعتماد');
T(w.lifeOf(site) === 'visited', 'حالتُها «زيارةٌ تمّت — تنتظر الاعتماد»');
/* ٤ · المشرف لا يستطيع اقتراح حل قبل الاعتماد */
w.solutionSave(site.id, { [w.itemsList()[0].code]: 1 });
T(!w.solutionOf(site.id), 'لا حلَّ قبل اعتماد الزيارة');
/* ٥ · المهندس يردّها «تحتاج زيارة أخرى» */
w.ROLE = 'engineer'; w.STATE.meta.name = 'مهندس الاختبار';
w.CUR = 'svappr'; w.render(1);
h = d.getElementById('content').textContent;
T(h.indexOf(site.id) > -1 && h.indexOf('مسح تجريبي') > -1, 'اعتماد الزيارات تعرض النقطة ببياناتها الجديدة');
T(click('[data-svrevisit="' + site.id + '"]'), 'زر «تحتاج زيارة أخرى» موجود');
d.getElementById('svaNote').value = 'الصورة لا تُظهر التثبيت';
click('[data-svrevisitgo="' + site.id + '"]');
rec = w.STATE.recs[site.id];
T(w.svReview(rec) === 'revisit' && !w.svDone(rec), 'رُدَّت — ولم تعد تُحتسب منجزة');
T(w.STATE.tasks['TK-visit-' + site.id].status === 'مطلوب', 'مهمة الزيارة ما زالت مفتوحة على المشرف');
T(w.lifeOf(site) === 'revisit', 'حالتُها «تحتاج زيارةً أخرى»');
/* ٦ · المشرف يرى السبب في مهامه ويعود */
w.ROLE = 'supervisor'; w.STATE.meta.name = 'مشرف الاختبار';
w.CUR = 'mywork'; w.MYW_TAB = 'tasks'; w.render(1);
h = d.getElementById('content').textContent;
T(h.indexOf('الصورة لا تُظهر التثبيت') > -1, 'المشرف يقرأ سبب الردّ في مهامه');
w.FORM.site = site.id; w.FORM.access = 'تم الوصول'; w.FORM.photos = { site:{data:'data:,a'}, mount:{data:'data:,b'} }; w.FORM.note = 'الجولة الثانية';
w.svSave(0);
rec = w.STATE.recs[site.id];
T(rec.round === 2 && rec.prevNote === 'الصورة لا تُظهر التثبيت' && w.svReview(rec) === 'pending', 'الجولة الثانية تحمل سبب الردّ وتنتظر');
/* ٧ · المهندس يعتمد ثم يقترح الحل من المنتقي والنمط */
w.ROLE = 'engineer'; w.STATE.meta.name = 'مهندس الاختبار';
w.CUR = 'svappr'; w.SVA_ST = 'pending'; w.render(1);
click('[data-svappr="' + site.id + '"]');
rec = w.STATE.recs[site.id];
T(w.svReview(rec) === 'approved' && w.STATE.tasks['TK-visit-' + site.id].status === 'معتمد', 'اعتُمدت وأُغلقت مهمتها');
T(w.SVA_SOL === site.id && d.querySelector('#pkItem'), 'منتقي القطع ظهر فورًا بعد الاعتماد');
const it0 = w.itemsList()[0], it1 = w.itemsList()[1];
d.getElementById('pkQ').value = it0.name.slice(0, 3); d.getElementById('pkQ').dispatchEvent(new w.Event('input', { bubbles:true }));
T(d.querySelector('#pkItem option[value="' + it0.code + '"]'), 'البحث يُبقي الصنف المطلوب في القائمة');
d.getElementById('pkItem').value = it0.code; d.getElementById('pkQty').value = 2; click('[data-pkadd]');
console.log('   بعد الإضافة الأولى:', JSON.stringify(w.SOL_LINES), '| ipItem موجود:', !!d.getElementById('pkItem'), '| SOL_Q=', w.SOL_Q);
d.getElementById('pkQ').value = ''; d.getElementById('pkQ').dispatchEvent(new w.Event('input', { bubbles:true }));
d.getElementById('pkItem').value = it1.code; d.getElementById('pkQty').value = 1; click('[data-pkadd]');
console.log('   بعد الثانية:', JSON.stringify(w.SOL_LINES));
T(w.SOL_LINES[it0.code] === 2 && w.SOL_LINES[it1.code] === 1, 'سطران أُضيفا بكمّيتيهما');
d.getElementById('patName').value = 'مخيم قياسي'; d.getElementById('patName').dispatchEvent(new w.Event('input', { bubbles:true }));
click('[data-patsave]');
T(w.patList().length === 1 && w.patList()[0].n === 'مخيم قياسي', 'النمط حُفظ');
T(w.STATE.queue.some(q => q.kind === 'cfg' && q.id === 'patterns'), 'النمط يُرفَع إلى settings/patterns');
click('[data-svsolgo="' + site.id + '"]');
const so = w.solutionOf(site.id);
T(so && so.status === 'معتمد' && so.items[it0.code] === 2, 'الحل حُفظ واعتُمد من شاشة واحدة');
T(w.LAYERS.install.pass(site), 'النقطة دخلت طبقة التركيب');
T(w.lifeOf(site) === 'ready' && w.mapColorOf(site) === w.LIFE.ready.c,
  'معتمدةٌ بحلٍّ — لونُ «بانتظار الجدولة» البرتقالي');
/* بقيةُ الدورة: جدولةٌ ← تركيبٌ ← صيانةٌ ← فكّ */
w.STATE.tasks['TK-install-' + site.id] = { id:'TK-install-'+site.id, site:site.id, kind:'install',
  to:'فريق الاختبار', status:'مطلوب', when:w.dayKey(Date.now()), at:Date.now() };
T(w.lifeOf(site) === 'sched', 'إسنادُ التركيب يجعلها «مُسندةً للتركيب»');
w.STATE.inss[site.id] = Object.assign({}, w.STATE.inss[site.id], { status:'مُركّب', approved:true });
T(w.lifeOf(site) === 'installed' && w.mapColorOf(site) === w.LIFE.installed.c, 'بعد التركيب: خضراء');
w.STATE.tasks['TK-maint-' + site.id] = { id:'TK-maint-'+site.id, site:site.id, kind:'maint',
  to:'فريق الاختبار', status:'مطلوب', at:Date.now() };
T(w.lifeOf(site) === 'maint' && w.mapColorOf(site) === w.LIFE.maint.c, 'إسنادُ الصيانة: صفراء');
w.STATE.tasks['TK-dis-' + site.id] = { id:'TK-dis-'+site.id, site:site.id, kind:'dis',
  to:'فريق الاختبار', status:'مطلوب', at:Date.now() };
T(w.lifeOf(site) === 'dis' && w.mapColorOf(site) === w.LIFE.dis.c, 'إسنادُ الفك: حمراء');
delete w.STATE.tasks['TK-dis-' + site.id]; delete w.STATE.tasks['TK-maint-' + site.id];
/* الرسمُ يُبنى من الحالات نفسِها */
w.ROLE = 'engineer'; w.goPage('wf'); w.render(1);
const wfx = d.getElementById('content').textContent;
T(d.querySelector('#content svg') && wfx.indexOf('رسمُ الدورة') > -1, 'رسمُ الدورة يُرسَم في «دورة العمل»');
/* ٨ · النمط يُطبَّق على نقطة أخرى */
w.SOL_LINES = {}; w.CUR = 'solution'; w.render(1);
w.patApply('مخيم قياسي');
T(w.SOL_LINES[it0.code] === 2 && w.SOL_LINES[it1.code] === 1, 'تطبيق النمط يملأ الأسطر');
/* ٩ · لوحة الوزارة */
w.ROLE = 'viewer'; w.STATE.meta.name = 'وزارة';
w.CUR = 'now'; w.render(1);
h = d.getElementById('content').textContent;
T(w.CUR === 'over' && h.indexOf('ما انتهى') > -1 && h.indexOf('المجدول') > -1, 'الوزارة ترى «أمس · الآن · غدًا»');
T(w.seesPage('map'), 'الوزارة ترى الخريطة');
w.CUR = 'map'; w.render(1);
console.log(bad ? '\nجردُ الدورة فشل ✗ (' + bad + ')' : '\nجردُ دورة الزيارة نظيف — من الإسناد إلى طبقة التركيب بالنقر ✅', '| أخطاء المتصفح:', errs.length);
process.exit(bad ? 1 : 0);
