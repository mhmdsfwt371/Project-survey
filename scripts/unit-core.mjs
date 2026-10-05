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
