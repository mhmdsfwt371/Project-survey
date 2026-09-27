import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تعديل المسح بلا إعادته — node scripts/audit-svq.mjs
   ───────────────────────────────────────────────────────────────────────────
   من نافذة النقطة المزارة «✎ تعديل المسح»: حقلٌ واحدٌ يُعدَّل ويُحفَظ فورًا — الصورُ وبقيةُ
   الحقول وصاحبُ الزيارة وتاريخُها كما هي، والتعديلُ مسجَّلٌ في الزيارة وفي السجلّ. والمعتمدُ إذا
   عدّله غيرُ المهندس عاد لانتظار الاعتماد، والمهندسُ يعدّل ويبقى معتمدًا — ويُنبَّه في الحالين.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function boot(role){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name:'أحمد' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1400); w.toast = () => {}; w.STATE.meta.name = 'أحمد';   /* اسمُ صاحب الجلسة كما يُكتَب من حسابه */
  return { w, d, dom };
}
const click = async (w, d, sel) => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60); return true; };
const base = id => ({ id, by:'سالم', at:1790000000000, access:'تم الوصول', mount:'عمود', power:'شبكة', chals:['لا توجد تحديات'], wid_m:3, hgt_m:4, fit:'نعم', note:'بوابة جانبية', photos:['site','mount'], phN:2, review:'pending' });

console.log('\n══ ١ · من نافذة النقطة — حقلٌ واحدٌ يُعدَّل وحدَه ══');
{ const { w, d, dom } = await boot('supervisor');
  const x = w.STATE.sites.find(s => s.type === 'مخيم'); w.STATE.recs[x.id] = base(x.id); w.statBump();
  w.goPage('map'); w.render(1); await wait(60); w.popOpenAt(x.id, null); await wait(80);
  T(!!d.querySelector('#pkPop [data-svq="' + x.id + '"]'), 'في نافذة النقطة المزارة «✎ تعديل المسح»');
  await click(w, d, '#pkPop [data-svq="' + x.id + '"]');
  const sh = d.getElementById('svqSheet');
  T(!!sh && /العرض المتاح/.test(sh.textContent) && /نوع التركيب/.test(sh.textContent) && !/الوصول/.test([...sh.querySelectorAll('.svq-k')].map(e => e.textContent).join('|')), 'اللوحُ يعرض حقولَ الزيارة المكتوبة بقيمها — والوصولُ لا يُعدَّل من هنا');
  await click(w, d, '#svqSheet [data-svqk="wid_m"]');
  d.getElementById('svqIn').value = '4.5';
  await click(w, d, '#svqSheet [data-svqsave]');
  const r = w.STATE.recs[x.id];
  T(r.wid_m === 4.5 && r.hgt_m === 4 && r.mount === 'عمود' && JSON.stringify(r.photos) === '["site","mount"]' && r.phN === 2, 'العرضُ صار ٤٫٥ — والارتفاعُ ونوعُ التركيب والصورُ كما هي');
  T(r.by === 'سالم' && r.at === 1790000000000 && r.eBy === 'أحمد' && r.edits.length === 1 && r.edits[0].k === 'wid_m' && r.edits[0].o === 3 && r.edits[0].v === 4.5, 'صاحبُ الزيارة وتاريخُها باقيان — والتعديلُ مسجَّلٌ باسم من عدّل ومن أيِّ قيمةٍ إلى أيّ');
  T(/تعديلُ مسح/.test(JSON.stringify(w.STATE.evlog || {}) + JSON.stringify(w.STATE.events || []) + JSON.stringify(w.STATE.queue || [])), 'وفي سجلّ الأحداث');
  T(/آخر التعديلات/.test(d.getElementById('svqSheet').textContent), 'واللوحُ يعرض آخرَ التعديلات');
  await click(w, d, '#svqSheet [data-svqk="chals"]'); await click(w, d, '#svqSheet [data-svqch="العارضة الحديدية ناقصة أو غير مكتملة"]'); await click(w, d, '#svqSheet [data-svqsave]');
  T(JSON.stringify(w.STATE.recs[x.id].chals) === '["العارضة الحديدية ناقصة أو غير مكتملة"]', 'والتحدياتُ بالشرائح: اختيارُ تحدٍّ يرفع «لا توجد تحديات»');
  const n0 = w.STATE.recs[x.id].edits.length; await click(w, d, '#svqSheet [data-svqk="hgt_m"]'); d.getElementById('svqIn').value = '4'; await click(w, d, '#svqSheet [data-svqsave]');
  T(w.STATE.recs[x.id].edits.length === n0, 'ولا تُكتَب قيمةٌ لم تتغيّر');
  await click(w, d, '#svqSheet [data-svqx]');
  T(!d.getElementById('svqSheet'), 'و✕ يغلق اللوح');
  dom.window.close(); }

console.log('\n══ ٢ · المعتمَد ══');
{ const { w, d, dom } = await boot('supervisor');
  const x = w.STATE.sites.find(s => s.type === 'مخيم'); const r0 = base(x.id); r0.review = 'approved'; r0.minReview = 'approved'; w.STATE.recs[x.id] = r0; w.statBump();
  const np = []; const N0 = w.notifPush; w.notifPush = function(k, txt){ np.push(k + '|' + txt); return N0.apply(this, arguments); };
  w.SVQ = { id:x.id, key:'wid_m', tmp:null }; w.render(1); await wait(40);
  T(/يعيده لانتظار اعتماد المهندس/.test(d.getElementById('svqSheet').textContent), 'غيرُ المهندس يُنبَّه قبل التعديل أن المعتمَدَ سيعود لانتظار الاعتماد');
  d.getElementById('svqIn').value = '5'; await click(w, d, '#svqSheet [data-svqsave]');
  const r = w.STATE.recs[x.id];
  T(r.review === 'pending' && r.minReview === '' && r.wid_m === 5, 'وبعد الحفظ عاد لانتظار الاعتماد — واعتمادُ الوزارة يُعاد كذلك');
  T(np.some(s => /تعديلُ مسحٍ معتمد/.test(s)), 'ويُنبَّه المكتب');
  dom.window.close(); }
{ const { w, d, dom } = await boot('engineer');
  const x = w.STATE.sites.find(s => s.type === 'مخيم'); const r0 = base(x.id); r0.review = 'approved'; w.STATE.recs[x.id] = r0; w.statBump();
  w.SVQ = { id:x.id, key:'wid_m', tmp:null }; w.render(1); await wait(40);
  d.getElementById('svqIn').value = '6'; await click(w, d, '#svqSheet [data-svqsave]');
  T(w.STATE.recs[x.id].review === 'approved' && w.STATE.recs[x.id].wid_m === 6, 'والمهندسُ يعدّل ويبقى معتمدًا — والتعديلُ مسجَّل');
  dom.window.close(); }

console.log('\n══ ٣ · من لا يعدّل ══');
{ const { w, d, dom } = await boot('viewer');
  const x = w.STATE.sites.find(s => s.type === 'مخيم'); w.STATE.recs[x.id] = base(x.id); w.statBump();
  w.goPage('map'); w.render(1); await wait(60); w.popOpenAt(x.id, null); await wait(80);
  T(!d.querySelector('#pkPop [data-svq]') && !w.svqMay(x.id), 'الوزارةُ لا ترى «تعديل المسح»');
  dom.window.close(); }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تعديل المسح نظيف \u2705'); process.exit(0);
