/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الأرقام — node scripts/audit-numbers.mjs
   ───────────────────────────────────────────────────────────────────────────
   شكا المالكُ أن أرقامَ التقارير تخرج غلطًا. هذا الجردُ يزرع بياناتٍ بحجم الموسم بحقيقةٍ معلومة، ثم يقارن
   كلَّ رقمٍ يعرضه النظامُ — المعوقاتُ وجهاتُها، والشركاتُ، والمهامُّ، والأيامُ بيوم مكة، وأوراقُ التصدير —
   بالرقم المحسوب مباشرةً من البيانات بحلقةٍ مستقلة. أيُّ فرقٍ يسقط هنا قبل أن تراه الوزارة.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; w.CORE.set = () => {};

/* ── بذرةٌ بحقيقةٍ معلومة ── */
const S = w.STATE.sites, now = Date.now(), DAY = 864e5;
const CH = ['لا يوجد سطح تثبيت', 'المدخل غير واضح — لم يُستدل عليه', 'العارضة الحديدية ناقصة أو غير مكتملة', 'المدخل مشترك مع مخيم آخر', 'أخرى'];
const names = ['عمار حسين', 'خالد بندر', 'فني ١', 'فني ٢', 'مشرف أ'];
const truth = { recs:0, done:0, approved:0, revisit:0, notReached:0, ins:0, obst:0, obstNR:0, catInst:0, co:{}, coAll:0, openTasks:0, byTo:{}, today:0, yesterday:0, twoChal:0 };
const mkDay = ms => new Date(ms + 10800000).toISOString().slice(0, 10);   /* يومُ مكة — مستقلٌّ عن التطبيق */
S.forEach((x, k) => {
  const installed = k % 10 < 6 && k % 12 !== 0;
  if (k % 10 < 9){
    const chals = k % 3 === 0 ? [] : (k % 7 === 0 ? [CH[k % CH.length], CH[(k + 1) % CH.length]] : [CH[k % CH.length]]);
    const access = k % 15 === 0 ? 'منع دخول' : 'تم الوصول';
    const review = k % 4 === 0 ? 'approved' : (k % 11 === 0 ? 'revisit' : 'pending');
    const at = k % 5 === 0 ? now - 2 * 3600000 : (k % 5 === 1 ? now - DAY : now - (2 + (k % 20)) * DAY);
    w.STATE.recs[x.id] = { id:x.id, by:names[k % 5], at, mount:'عارضة', power:'متوفر', chals, note:'', photos:['site'], access, review };
    truth.recs++;
    if (access === 'تم الوصول' && review !== 'revisit') truth.done++;
    if (review === 'approved' && access === 'تم الوصول') truth.approved++;
    if (review === 'revisit') truth.revisit++;
    if (mkDay(at) === mkDay(now)) truth.today++; else if (mkDay(at) === mkDay(now - DAY)) truth.yesterday++;
    if (!installed){
      const cats = chals.slice(); if (access !== 'تم الوصول') cats.push('تعذّر الوصول');
      if (cats.length){ truth.obst++; truth.catInst += cats.length; if (chals.length >= 2) truth.twoChal++; }
      if (access !== 'تم الوصول') truth.notReached++;
    }
  }
  if (k % 10 < 6){ w.STATE.inss[x.id] = { id:x.id, status:installed ? 'مُركّب' : 'مسودّة', by:names[k % 5], at:now - (k % 30) * DAY, parts:{}, serials:{}, photos:[] }; if (installed) truth.ins++; }
  if (k % 3 === 0){ const st = k % 5 === 0 ? 'معتمد' : 'مسند', to = names[k % 5]; w.STATE.tasks['tk-' + k] = { id:'tk-' + k, site:x.id, kind:k % 2 ? 'install' : 'survey', to, status:st, at:now - (k % 20) * DAY }; if (st !== 'معتمد'){ truth.openTasks++; truth.byTo[to] = (truth.byTo[to] || 0) + 1; } }
  if (x.co){ truth.co[x.co] = (truth.co[x.co] || 0) + 1; truth.coAll++; }
});
w.SITE_IX = null; w.SITE_TOK = null; w.TK_IX = null; w.statBump(); w.render(1); await wait(50);
console.log('بذرة:', JSON.stringify({ recs:truth.recs, obst:truth.obst, ins:truth.ins, openTasks:truth.openTasks }));

console.log('\n══ ١ · المعوقات: الإجماليُّ وجهاتُه وفئاتُه ══');
{ const O = w.mfuObstacles();
  T(O.length === truth.obst, 'عددُ المعوقات = نقاطٌ لم تُركَّب وفي مسحها تحدٍّ أو تعذّرُ وصول (' + O.length + ' / ' + truth.obst + ')');
  T(O.reduce((s, o) => s + o.cats.length, 0) === truth.catInst, 'ومجموعُ الفئات = مجموعُ ما سُجّل على النقاط (' + truth.catInst + ')');
  T(O.filter(o => o.cats.indexOf('تعذّر الوصول') > -1).length === truth.notReached, 'ومتعذّرُ الوصول يُعَدّ فئةً مرةً لكلِّ نقطة (' + truth.notReached + ')');
  w.goPage('mfu'); w.render(1); await wait(40);
  const tb = d.querySelector('[data-ptab="mfu:mobs"]'); if (tb){ tb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60); }
  const toNum = s => +String(s || '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^0-9]/g, '') || 0;
  const KP = [...d.querySelectorAll('#content .mfu-kpi')].map(x => ({ l:((x.querySelector('.mfu-kpi-l') || {}).textContent || '').trim(), v:toNum((x.querySelector('.mfu-kpi-v') || {}).textContent) }));
  const tot = (KP.find(k => /إجمالي المعوقات/.test(k.l)) || {}).v;
  T(tot === O.length, 'بطاقةُ إجمالي المعوقات في الصفحة بالعدد نفسِه (' + tot + ' / ' + O.length + ')');
  const partySum = KP.filter(k => /تُعالَج من خلال/.test(k.l)).reduce((s, k) => s + k.v, 0);
  T(partySum === O.length, 'ومجموعُ بطاقات الجهات = الإجمالي لا أكثر (' + partySum + ' / ' + O.length + ') — النقطةُ ذاتُ عائقين من جهتين تُعَدّ مرة (' + truth.twoChal + ' نقطةً بعائقين)'); }

/* (V26.6) ورقةُ نقاط التحديات: صفٌّ لكلِّ نقطةٍ وتحدٍّ — وبالفلتر تنقص */
{ w.MFU_FLT.z = ''; w.MFU_FLT.t = ''; const full = w.SHEETS.chalpts();
  T(full.length - 1 === truth.catInst && full[0].length === 19, 'ورقةُ نقاط التحديات: صفٌّ لكلِّ نقطةٍ وتحدٍّ (' + (full.length - 1) + ' / ' + truth.catInst + ') بتسعةَ عشرَ عمودًا');
  w.MFU_FLT.z = 'منى'; const mina = w.SHEETS.chalpts(); w.MFU_FLT.z = '';
  const minaTruth = w.mfuObstacles().filter(o => w.taxOf(o.x).g === 'منى').reduce((s2, o) => s2 + o.cats.length, 0);
  T(mina.length - 1 === minaTruth && mina.slice(1).every(r => r[0] === 'منى'), 'وبفلتر «منى» تخرج نقاطُ منى وحدَها (' + (mina.length - 1) + ')');
  const F = w.mfuData().fch || {}; const c0 = full[1] && full[1][5];
  if (c0){ w.mfuPut('fch', c0, Object.assign({}, F[c0] || {}, { desc:'وصفٌ تجريبي', due:'2026-12-01' })); const A = w.mfuAllChal().find(c => c.src === 'field' && c.t === c0); T(!!A && A.desc === 'وصفٌ تجريبي' && A.due === '2026-12-01', 'ووصفُ المعالجة وآخرُ تاريخٍ يُحفَظان مع التحدي ويعودان في السجل'); } }

/* (V27.3) التحديثُ الأسبوعيُّ يتبع فلتر الصفحة */
{ w.MFU_FLT.z = ''; w.MFU_FLT.t = ''; const R0 = w.mfuReport(); const obsAll = +R0.kpis[3][1];
  w.MFU_FLT.z = 'منى'; const R1 = w.mfuReport(); const obsMina = w.mfuObstaclesF().length, fn1 = w.mfuFileName('xlsx'); w.MFU_FLT.z = '';
  T(obsAll === truth.obst && +R1.kpis[3][1] === obsMina && obsMina < obsAll && /بفلتر/.test(R1.greg) && R1.flt === 'منى' && /منى/.test(fn1), 'التحديثُ الأسبوعيُّ: بلا فلترٍ كلُّ المعوقات (' + obsAll + ')، وبفلتر «منى» معوقاتُها وحدَها (' + obsMina + ') والفلترُ في التاريخ واسم الملف'); }

console.log('\n══ ٢ · المسح: تمّ ومعتمدٌ ويحتاج زيارة ══');
{ let done = 0, appr = 0, rev = 0; Object.keys(w.STATE.recs).forEach(id => { const r = w.STATE.recs[id]; if (w.svDone(r)) done++; if (w.svApproved(r)) appr++; if (w.svReview(r) === 'revisit') rev++; });
  T(done === truth.done, 'تمَّ المسحُ = وصل ولا يحتاج زيارة (' + done + ' / ' + truth.done + ')');
  T(appr === truth.approved, 'والمعتمدُ = تمَّ واعتُمد (' + appr + ' / ' + truth.approved + ')');
  T(rev === truth.revisit, 'ويحتاج زيارةً أخرى (' + rev + ' / ' + truth.revisit + ')');
  const sh = w.SHEETS.visits(); T(sh.length === truth.recs + 1, 'وورقةُ تصدير الزيارات صفٌّ لكلِّ زيارة + العنوان (' + (sh.length - 1) + ' / ' + truth.recs + ')'); }

console.log('\n══ ٣ · الشركات: مجموعُ الشركات = مواقعُها ══');
{ const B = w.coBucketsAll(); let all = 0, bad = 0;
  Object.keys(B).forEach(co => { all += B[co].all.length; if (B[co].all.length !== truth.co[co]) bad++; if (B[co].sv.length > B[co].all.length || B[co].ins.length > B[co].all.length) bad++; });
  T(all === truth.coAll && bad === 0, 'كلُّ شركةٍ بعدد مواقعها، والمجموعُ = المواقعُ ذاتُ الشركة (' + all + ' / ' + truth.coAll + ')');
  const one = Object.keys(B)[0]; T(w.coBuckets(one).all.length === B[one].all.length, 'وcoBuckets(شركة) تساوي ما في الحلقة الواحدة'); }

console.log('\n══ ٤ · المهامُّ: الإسنادُ من الفهرس كالحلقة ══');
{ let miss = 0, open = 0; const byTo = {};
  Object.keys(w.STATE.tasks).forEach(k => { const x = w.STATE.tasks[k]; if (x.status === 'معتمد') return; open++; byTo[x.to] = (byTo[x.to] || 0) + 1; const a = w.asnOf(x.site); if (!a || a.status === 'معتمد' || a.site !== x.site) miss++; });
  T(open === truth.openTasks && miss === 0, 'كلُّ مهمةٍ مفتوحةٍ تُرى بـasnOf على نقطتها (' + open + ' مفتوحة، ' + miss + ' مفقودة)');
  T(Object.keys(byTo).every(n => byTo[n] === truth.byTo[n]), 'ومهامُّ كلِّ شخصٍ بعددها');
  S.filter(x => !Object.keys(w.STATE.tasks).some(k => w.STATE.tasks[k].site === x.id && w.STATE.tasks[k].status !== 'معتمد')).slice(0, 50).forEach(x => { if (w.asnOf(x.id)) miss++; });
  T(miss === 0, 'ولا إسنادَ لنقطةٍ بلا مهمةٍ مفتوحة'); }

console.log('\n══ ٥ · الأيامُ بيوم مكة ══');
{ T(w.dayKey(now) === mkDay(now) && w.dayKey(now - DAY) === mkDay(now - DAY), 'يومُ التطبيق = يومُ مكة (+٣) اليومَ وأمس');
  const edge = Date.UTC(2026, 9, 1, 22, 30);   /* ٢٢:٣٠ غرينتش = ٠١:٣٠ مكة في اليوم التالي */
  T(w.dayKey(edge) === '2026-10-02', 'وزيارةُ ١:٣٠ ليلًا بتوقيت مكة على يومها لا على أمس');
  let today = 0, yest = 0; Object.keys(w.STATE.recs).forEach(id => { const r = w.STATE.recs[id]; const dk = w.dayKey(r.at); if (dk === w.dayKey(now)) today++; else if (dk === w.dayKey(now - DAY)) yest++; });
  T(today === truth.today && yest === truth.yesterday, 'وزياراتُ اليوم وأمس بالعدد (' + today + ' / ' + yest + ')');
  w.logEvent('فحصُ يوم الحدث', S[0].id); T(w.STATE.events[0].day === mkDay(Date.now()), 'ويومُ الحدث المسجَّل يومُ مكة'); }

console.log('\n══ ٦ · الأرقامُ والقوائم ══');
{ T(w.nm(1234) === '١٬٢٣٤' && w.nm(0) === '٠' && w.nm(1234) === '١٬٢٣٤' && w.nm(7) === '٧', 'تنسيقُ الأرقام (المحفوظُ) صحيحٌ ومتكرّر');
  const was = w.LANG; w.LANG = 'en'; const en = w.nm(1234); w.LANG = was; T(en === '1,234', 'ولا يتسرّب تنسيقُ لغةٍ إلى أخرى');
  const L = S.slice(0, 500); w.PG_Q = ''; w.MORE_SHOWN = {}; w.MORE_CUT = 0;
  T(w.capList(L, 300).length === 100 && w.MORE_CUT === 400, 'القائمةُ الطويلة مئةً أوّلًا والباقي معدود (' + w.MORE_CUT + ')');
  w.MORE_SHOWN[w.moreKey()] = 200; w.MORE_CUT = 0; T(w.capList(L, 300).length === 300, 'و«اعرض المزيد» يزيد مئتين');
  w.PG_Q = 'x'; T(w.capList(L, 300).length === 500, 'والبحثُ في الصفحة يفتح الكلّ'); w.PG_Q = ''; w.MORE_SHOWN = {}; }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ الأرقام نظيف \u2705'); process.exit(0);
