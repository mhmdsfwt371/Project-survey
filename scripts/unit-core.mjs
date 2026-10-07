/* ═══ اختباراتُ الوحدة السريعة — الحساباتُ الحرجةُ في ثوانٍ (المرحلة «الاختبارات السريعة» من خطة التسليم) ═══
   تطبيقٌ واحدٌ يُحمَّل مرةً في متصفّحٍ صوري، ثم عشراتُ التأكيدات على الدوالِّ الصِّرفة: التصنيفُ، والإحصاءُ، والصلاحياتُ،
   وقواعدُ التنبيه، والخطةُ، وجودةُ الصور، والبحثُ، والمزامنةُ. لا شبكةَ ولا قاعدة. node --test scripts/unit-core.mjs */
import './lib/jsdom-dict.cjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window;
await new Promise(r => setTimeout(r, 900));
w.loadSites(); w.STATE.meta.role = 'engineer'; w.ROLE = 'engineer';
const S = w.STATE, site = S.sites[0];
const J = v => JSON.parse(JSON.stringify(v));   /* عبر عالمي المتصفّح الصوري ونود: المصفوفاتُ تُقارَن بقيمتها */
after(() => { try { w.close(); } catch (e){} setTimeout(() => process.exit(process.exitCode || 0), 100); });

test('التصنيف: كلُّ نقطةٍ لها مشعرٌ ونوعٌ من القوائم المعتمدة، ومراكزُ التفويج تضمّ النورية والزايدي والهجرة', () => {
  S.sites.forEach(x => { const c = w.taxOf(x); assert.ok(w.TAX_G.includes(c.g), x.id + ' ' + c.g); assert.ok(w.TAX_T.includes(c.t), x.id + ' ' + c.t); });
  assert.equal(w.taxOf({ id:'t1', zone:'النوارية', type:'LPR', lat:21.5, lng:39.7 }).g, 'مراكز التفويج');
  assert.equal(w.taxOf({ id:'t2', zone:'مواقع التفويج', type:'LPR', tg:'مراكز التفويج', tt:'الزايدي' }).t, 'الزايدي');
  assert.equal(w.TAX_G[4], 'كاميرات المتابعة');
});
test('الإحصاء: مجموعُ المشاعر = الإجمالي، ومُسح = سجلٌّ وُصل إليه بلا إعادة', () => {
  const K = w.siteKeyStats(); let n = 0; Object.values(K.zones).forEach(z => { n += z.n; }); assert.equal(n, K.total.n);
  assert.equal(w.svDone({ access:'تم الوصول' }), true); assert.equal(w.svDone({ access:'يحتاج تصريح' }), false); assert.equal(w.svDone({ access:'تم الوصول', review:'revisit' }), false);
});
test('الصلاحيات: المطّلعُ لا يكتب، والفنيُّ لا ينشئ حسابات، والمشرفُ فصاعدًا ينشئ، والمهندسُ يعدّل', () => {
  const can = r => (w.ROLES[r] && w.ROLES[r].can) || {};
  assert.ok(!can('viewer').edit); assert.ok(!can('viewer').provision); assert.ok(!can('tech').provision);
  assert.ok(can('supervisor').provision); assert.ok(can('engineer').edit); assert.ok(can('admin').provision);
});
test('قواعدُ التنبيه: الأيامُ من الإعدادات، والصفرُ يعطّل، والمعوّقُ القديمُ يُلتقَط', () => {
  const now = Date.now(); S.recs[site.id] = { id:site.id, at:now - 20 * 864e5, access:'تم الوصول', mount:'هيكل', chals:['العارضة الحديدية ناقصة أو غير مكتملة'] };
  w.CFG.alObsDays = 14; assert.ok(w.svListRows('al_obs').some(r => r[0] === site.id));
  w.CFG.alObsDays = 30; assert.ok(!w.svListRows('al_obs').some(r => r[0] === site.id));
  w.CFG.alObsDays = 0; assert.equal(w.alAll()[0].off, true); w.CFG.alObsDays = 14; delete S.recs[site.id];
});
test('الخطة: المخطّطُ من التواريخ صفرٌ قبل البدء ومئةٌ بعد النهاية، والمعلَمُ كذلك', () => {
  const d = new Date(), y = n => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  S.wbs = { rows:[{ id:'1', n:'بند', s:y(-10), e:y(10), type:'مهمة' }, { id:'2', n:'بعد', s:y(5), e:y(9), type:'مهمة' }, { id:'3', n:'قبل', s:y(-9), e:y(-5), type:'مهمة' }, { id:'4', n:'معلم', s:y(-1), e:y(-1), type:'معلم' }], keys:[] };
  const R = w.wbsRows(); assert.equal(w.wbsPlanPct(R[1]), 0); assert.equal(w.wbsPlanPct(R[2]), 100); assert.equal(w.wbsPlanPct(R[3]), 100); const mid = w.wbsPlanPct(R[0]); assert.ok(mid > 30 && mid < 70, 'mid ' + mid); S.wbs = null;
});
test('جودةُ الصور: المظلمةُ والمحترقةُ والمهزوزةُ تُعلَّم، والسليمةُ لا', () => {
  assert.deepEqual(J(w.photoQualityFlags({ b:10, s:50 })), ['مظلمة']); assert.deepEqual(J(w.photoQualityFlags({ b:250, s:50 })), ['محترقة']);
  assert.deepEqual(J(w.photoQualityFlags({ b:120, s:5 })), ['مهزوزة']); assert.deepEqual(J(w.photoQualityFlags({ b:120, s:50 })), []);
  assert.equal(w.photoHamming('00ff', '00ff'), 0); assert.equal(w.photoHamming('00ff', '00fe'), 1);
});
test('البحثُ في السجل: بلا همزٍ ولا تاءٍ مربوطةٍ ولا حالةِ حروف', () => {
  assert.equal(w.evNorm('مُشتَرَى NSK-A'), 'مشتري nsk-a'); assert.equal(w.evNorm('إضافة'), 'اضافه');
});
test('الوضعُ الصارم فعّال، ولا متغيرَ ضمنيًّا يُنشأ بالخطأ', () => {
  assert.throws(() => w.eval('(function(){ "use strict"; zzUndeclared = 1; })()'), /not defined/);
  assert.equal(typeof w.DB, 'object'); assert.equal(typeof w.DB.col, 'function');   /* (V31.5) بوابةُ البيانات قائمة */
});
test('القوائمُ من الإعدادات: الفارغةُ تعيد الأصلية، والمكتوبةُ تغلب', () => {
  w.CFG.lists = {}; assert.ok(w.chalsOf({ type:'مخيم' }).length > 5);
  w.CFG.lists = { chalsCamp:['أ', 'ب'] }; assert.deepEqual(J(w.chalsOf({ type:'مخيم' })), ['لا توجد تحديات', 'أ', 'ب']); w.CFG.lists = {};
});
test('طباعةُ الـPDF تضمّن الخطَّ المرفوع (كان متغيرُ الخط يطمس معاملَ الخطوط — V31.4)', () => {
  const R = w.mfuReport(), F = { r:'AAAA', b:'BBBB', rn:'AbarMid-Regular.woff2', bn:'AbarMid-Bold.woff2' };
  const h = w.mfuPrintHtml(R, F); assert.ok(/@font-face/.test(h), 'لا @font-face'); assert.ok(h.indexOf('AAAA') > -1, 'الخطُّ غيرُ مضمَّن');
  assert.ok(/font-family:"Abar Mid"/.test(h) || /"Abar Mid","Readex Pro"/.test(h), 'سلسلةُ الخطوط غائبة');
});
/* ═══ (V33.0) توصيةُ الجودة: اختباراتٌ للطابور والمزامنة والتعريف ═══ */
test('الطابور: الكتابةُ المحليةُ تُحفَظ في الحالة وتدخل طابورَ الرفع مرةً واحدةً لكلِّ وثيقة، وتُبطل ذاكرةَ الحساب', () => {
  const q0 = S.queue.length, id = 'ZZ-UNIT-' + Date.now();
  w.DB.memo = { life:{ x:1 }, lists:{} };
  w.CORE.set('recs', id, { id, at:Date.now(), access:'تم الوصول' });
  assert.equal(S.recs[id].access, 'تم الوصول'); assert.equal(w.DB.memo, null);
  assert.equal(S.queue.length, q0 + 1);
  w.CORE.set('recs', id, { id, at:Date.now(), access:'متعذر' });
  assert.equal(S.queue.filter(x => x.kind === 'recs' && x.id === id).length, 1, 'تعديلُ الوثيقة نفسِها لا يكرّرها في الطابور');
  S.queue = S.queue.filter(x => x.id !== id); delete S.recs[id];
});
test('التعريف (ق-٠٠٧): «تمت الزيارة» = تم الوصول + متعذّر + تحتاج زيارة أخرى، وما لا سجلَّ له ليس منها', () => {
  const recs = [{ access:'تم الوصول' }, { access:'تم الوصول', review:'revisit' }, { access:'متعذر' }, { access:'يحتاج تصريح' }, null, undefined, { deleted:true }];
  const visited = recs.filter(r => w.svVisited(r)).length, done = recs.filter(r => w.svDone(r)).length;
  const stuck = recs.filter(r => w.svStuck(r)).length, rev = recs.filter(r => w.svReached(r) && r.review === 'revisit').length;
  assert.equal(w.svDone({ deleted:true }), false, 'شاهدُ الحذف ليس زيارة');
  assert.equal(visited, 4); assert.equal(done + stuck + rev, visited);
});
test('المزامنة: دورةٌ بلا جديدٍ لا تُبطل الإحصاءَ ولا ترسم، ودورةٌ بجديدٍ تُبطله', async () => {
  const saved = { pd:w.pullDelta, ps:w.FB.pullStatic, fl:w.CORE.flush, on:S.meta.online, ready:w.FB.ready, db:w.FB.db, sat:w.FB._staticAt };
  S.meta.online = true; w.FB.ready = true; w.FB.db = w.FB.db || {}; w.FB._staticAt = Date.now(); w.CORE.flush = () => Promise.resolve(0); w.FB.pullStatic = () => Promise.resolve(0);
  w.pullDelta = () => Promise.resolve(0); w.SYNC.busy = false; w.SYNC.pullLast = 0; w.SYNC.pullAsk = false; w.SYNC.day = w.dayKey();
  let v0 = w.STAT_VER; await w.syncCycle(); assert.equal(w.STAT_VER, v0, 'الدورةُ الهادئة لا تُبطل');
  w.pullDelta = () => Promise.resolve(3); w.SYNC.busy = false; w.SYNC.pullLast = 0;
  v0 = w.STAT_VER; await w.syncCycle(); assert.ok(w.STAT_VER > v0, 'الدورةُ بجديدٍ تُبطل');
  w.pullDelta = saved.pd; w.FB.pullStatic = saved.ps; w.CORE.flush = saved.fl; S.meta.online = saved.on; w.FB.ready = saved.ready; w.FB.db = saved.db; w.FB._staticAt = saved.sat;
});
test('قياسُ الميدان: عطلُ مخزن الآيفون يُسجَّل باسمه لا «خطأ برمجي»، والخطأُ الحقيقيُّ يبقى خطأً برمجيًّا', () => {
  const got = []; const lg = w.logEvent; w.logEvent = (what) => got.push(String(what)); const rn = w.idbRetryNow, hadIdb = 'indexedDB' in w; let retried = 0; w.idbRetryNow = () => { retried++; return Promise.resolve(null); }; if (!hadIdb) w.indexedDB = {};   /* المتصفّحُ الصوريُّ بلا مخزن — نمثّل وجودَه */
  w.errCapture('promise: Connection to Indexed Database server lost. Refresh the page to try again', '', 0);
  w.errCapture('Uncaught TypeError: Cannot read properties of undefined (reading x)', 'index.html', 4242);
  w.logEvent = lg; w.idbRetryNow = rn; if (!hadIdb) delete w.indexedDB;
  assert.ok(got.some(x => x.startsWith('عطلٌ في متصفّح الجهاز')), 'عطلُ المنصة باسمه'); assert.ok(got.some(x => x.startsWith('خطأ برمجي')), 'والخطأُ الحقيقيُّ خطأ'); assert.ok(retried >= 1, 'والمخزنُ يُعاد فتحُه');
});
test('بلاغُ المالك (V33.4): الزيارةُ بقرار المهندس بلا حقل وصولٍ ولا تحديات «بدون عوائق» — ومحطاتُ القطار كلُّها كذلك', () => {
  const quick = { id:'NSK-TRN-STN-0001', by:'م', at:Date.now(), quick:1 };
  assert.equal(w.svVisited(quick), true); assert.equal(w.svClean(quick), true); assert.equal(w.svObstacle(quick), false);
  assert.equal(w.svClean({ id:'x', at:1, quick:1, review:'revisit' }), false, 'المردودةُ ليست بلا عوائق');
  assert.equal(w.svClean({ id:'x', at:1, access:'متعذر' }), false, 'ولا ما لم يُوصَل إليه');
  assert.equal(w.svClean({ id:'x', at:1, access:'تم الوصول', chals:['عائق إنشائي'] }), false, 'ولا ما فيه تحدٍّ');
});
test('بلاغُ المالك (V33.7): التصديرُ على الآيفون بقائمة المشاركة لا برابطٍ يُخرج من التطبيق', async () => {
  const nav = w.navigator, saved = { ua:Object.getOwnPropertyDescriptor(nav, 'userAgent'), cs:nav.canShare, sh:nav.share };
  Object.defineProperty(nav, 'userAgent', { value:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', configurable:true });
  const got = []; nav.canShare = d => !!(d && d.files); nav.share = d => { got.push(d.files[0].name); return Promise.resolve(); };
  const clicks = []; const oc = w.HTMLAnchorElement.prototype.click; w.HTMLAnchorElement.prototype.click = function(){ clicks.push(this.download); };
  assert.equal(w.dl(new w.Blob(['x'], { type:'text/plain' }), 'a.docx'), true);
  w.HTMLAnchorElement.prototype.click = oc;
  if (saved.ua) Object.defineProperty(nav, 'userAgent', saved.ua); else delete nav.userAgent; nav.canShare = saved.cs; nav.share = saved.sh;
  assert.deepEqual(got, ['a.docx']); assert.equal(clicks.length, 0, 'لا رابطَ تنزيل على الآيفون');
});
test('صفحةُ الوزارة (V33.7): المعوّقاتُ والشركاتُ والمؤشراتُ تُحسَب مرةً في الرسمة', () => {
  let n = 0; const f = w.chalKeys; w.chalKeys = function(){ n++; return f.apply(this, arguments); };
  w.DB.open(); try { w.mfuObstacles(); const a = n; w.mfuObstacles(); w.mfuCompanies(); w.mfuKpis(); w.mfuKpis(); assert.ok(n - a <= w.STATE.sites.length + 5, 'المكرَّرُ من الذاكرة'); } finally { w.DB.memoReset(); w.chalKeys = f; }
});
test('طلبُ المالك (V34.4): لا تشكيلَ في أيِّ صفحةٍ تُعرَض بالعربية', () => {
  const was = w.noTashkeel.force; w.noTashkeel.force = true;
  try {
    assert.equal(w.t('شاشةُ القاعة'), 'شاشة القاعة'); assert.equal(w.esc('تحتاج زيارة أخرى تقنيًا'), 'تحتاج زيارة أخرى تقنيا');
    const bad = [];
    ['mfu', 'map', 'survey', 'over', 'mywork'].forEach(id => { try { w.goPage(id); w.render(1); } catch (e){ return; }
      const tx = (w.document.getElementById('content') || {}).textContent || ''; const m = tx.match(/[\u064B-\u0652\u0670]/g); if (m) bad.push(id + ':' + m.length); });
    assert.deepEqual(bad, [], 'صفحاتٌ فيها تشكيل: ' + bad.join('، '));
  } finally { w.noTashkeel.force = was; }
});
test('قرارُ المالك (V35.0/V35.1): المعرّفُ الأوّل — رقمُ الشاخص للمخيم (ولكلِّ شركاته)، واسمُ ١٤٤٧ للممر المركّب، وNSK لغيرهما', () => {
  const S = w.STATE.sites, camp = S.find(x => x.type === 'مخيم' && x.sign && !/[?]/.test(x.sign));
  assert.equal(w.siteKey(camp), camp.sign.trim());
  const c47 = S.find(x => x.type === 'ممر' && x.work === 'إعادة تركيب ١٤٤٧'); assert.match(w.siteKey(c47), /^[A-Za-z]/);
  const cNew = S.find(x => x.type === 'ممر' && x.work !== 'إعادة تركيب ١٤٤٧'); assert.equal(w.siteKey(cNew), cNew.id);
  /* (V35.1) المخيمُ قد يكون لأكثر من شركة: الشاخصُ لكلِّ سطوره، وتُذكَر الشركةُ تحته، ومعرّفُ النظام يفرّقها دائمًا */
  const multi = S.filter(x => x.type === 'مخيم' && x.sign && w.siteShared(x) > 1 && x.co)[0];
  if (multi){ const h = w.siteIdHtml(multi); assert.ok(h.indexOf(multi.co) > -1 && h.indexOf(multi.id) > -1, 'الشركةُ ومعرّفُ النظام تحت الشاخص المشترك'); }
  assert.ok(S.filter(x => x.type === 'مخيم' && x.sign && !/[?]/.test(x.sign)).every(x => w.siteKey(x) === String(x.sign).trim()), 'كلُّ مخيمٍ له شاخصٌ يظهر به');
});
test('مراجعةُ الفريق (V36.0): تعريفاتُ النقطة في ملفٍّ واحد — لا تُعرَّف في غيره', async () => {
  const { readFileSync, readdirSync } = await import('fs');
  const NAMES = ['svVisited','svReached','svStuck','svDone','svHasChal','svNeedsRevisit','svClean','svObstacle','chalShow','insDone','handOf','handDone','disDone','siteKey','siteOf','siteShared','siteIdHtml','siteKeyLabel','siteLocked','siteOvIncoming'];
  const defs = readFileSync('src/02-definitions.js', 'utf8'), others = readdirSync('src').filter(f => /\.js$/.test(f) && f !== '02-definitions.js').map(f => [f, readFileSync('src/' + f, 'utf8')]);
  NAMES.forEach(n => { assert.ok(new RegExp('\\nfunction ' + n + '\\(').test(defs), n + ' في ملف التعريفات');
    others.forEach(([f, s]) => assert.ok(!new RegExp('\\nfunction ' + n + '\\(').test(s), n + ' معرَّفةٌ أيضًا في ' + f)); });
});
test('قرارُ المالك (V36.4): ما رُكّب لا يُحذَف — ولا ما بعده — والزيارةُ والجدولةُ تُحذفان', () => {
  const S = w.STATE.sites, a = S[3], b = S[4], c = S[5];
  w.STATE.inss[a.id] = { id:a.id, status:'مُركّب', at:Date.now() };
  w.STATE.recs[b.id] = { id:b.id, at:Date.now(), access:'تم الوصول' };
  (w.STATE.diss = w.STATE.diss || {})[c.id] = { id:c.id, status:'تم الفك' };
  const was = w.ROLE; w.ROLE = 'admin';
  try {
    assert.ok(w.siteLocked(a.id) && w.siteLocked(c.id) && !w.siteLocked(b.id));
    assert.equal(w.siteHide(a.id), false, 'المركَّبةُ لا تُحذَف'); assert.ok(w.siteFind(a.id));
    assert.equal(w.siteHide(c.id), false, 'وما بعد التركيب (الفك) لا يُحذَف');
    assert.equal(w.siteHide(b.id), true, 'والمزارةُ قبل التركيب تُحذَف'); assert.ok(!w.siteFind(b.id)); w.siteRestore(b.id);
  } finally { w.ROLE = was; delete w.STATE.inss[a.id]; delete w.STATE.recs[b.id]; delete w.STATE.diss[c.id]; }
});
test('بلاغُ المالك (V36.7): الحذفُ يصل كلَّ جهاز ولا تعود النقطةُ المحذوفة', async () => {
  const x = w.STATE.sites[7], id = x.id;
  /* حذفٌ وصل من جهازٍ آخر: تختفي هنا */
  w.siteOvIncoming(id, { hidden:true, hidBy:'مهندس', _at:Date.now() });
  assert.ok(!w.siteFind(id) && (w.STATE.hiddenSites || []).some(h => h.id === id), 'الحذفُ الواردُ يُخفيها');
  /* واستعادةٌ واردة: تعود */
  w.siteOvIncoming(id, { hidden:false, _at:Date.now() });
  assert.ok(!!w.siteFind(id), 'والاستعادةُ الواردةُ تعيدها');
  /* دمجُ النقاط المضافة لا يعيد محذوفةً بالإخفاء، ومستمعُ التجاوزات حيٌّ في الإنصات */
  const { readFileSync } = await import('fs'); const core = readFileSync('src/01-core-registry.js', 'utf8');
  assert.ok(/\(STATE\.hiddenSites \|\| \[\]\)\.forEach\(function\(x\)\{ have\[x\.id\] = 1; \}\);/.test(core) && /if \(ovh && ovh\.hidden\) return;/.test(core), 'الدمجُ يعرف المخفيَّ ولا يعيده');
  assert.ok(/watch\('sites', function\(id, v\)\{ if \(v\) siteOvIncoming\(id, v\); \}/.test(core), 'ومستمعُ التجاوزات حيّ');
});
test('حادثة ٧ أكتوبر (V36.8): نقطةٌ لها زيارةٌ لا يحذفها إلا مدير المشروع — والمهندسُ يحذف غير المزارة', () => {
  const S = w.STATE.sites, v = S[11], u = S[12]; w.STATE.recs[v.id] = { id:v.id, at:Date.now(), access:'تم الوصول' };
  const was = w.ROLE;
  try {
    w.ROLE = 'engineer';
    assert.equal(w.siteHide(v.id), false, 'المهندسُ لا يحذف المزارة'); assert.ok(w.siteFind(v.id));
    assert.equal(w.siteHide(u.id), true, 'ويحذف غيرَ المزارة'); w.ROLE = 'admin'; w.siteRestore(u.id);
    assert.equal(w.siteHide(v.id), true, 'ومديرُ المشروع يحذف المزارة'); w.siteRestore(v.id);
  } finally { w.ROLE = was; delete w.STATE.recs[v.id]; }
});
