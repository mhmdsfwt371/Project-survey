/* ═══════════════════════════════════════════════════════════════════════════
   جردُ المعادلات — يُشغَّل: node scripts/audit-calc.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجرودُ السابقةُ تتحقق أن البياناتِ مقروءةٌ صحيحًا وأن الأزرارَ تكتب. وهذا
   لا يقول شيئًا عن الرقم نفسه: قد تُقرأ البياناتُ صحيحةً ثم تُجمَع خطأً.

   والرقمُ الخاطئُ في ورقةٍ ذاهبةٍ إلى الوزارة أسوأ من عشرة أزرارٍ ميتة: الزرُّ
   الميتُ يُكتشَف عند أول ضغطة، والرقمُ الخاطئُ يُبنى عليه قرار.

   فالقاعدةُ هنا: لا يُصدَّق حسابُ التطبيق على نفسه. كلُّ رقمٍ يُعاد حسابُه
   بطريقٍ مستقلٍّ من المصدر نفسه، ثم يُقارَن. وما لا يُعاد حسابُه تُفحَص
   متطابقاتُه: مجموعُ الأوزان مئة، والميزانُ متوازن، والقسمةُ لا تنفجر.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };
const eq  = (a, b, n) => check(a === b, `${n} — المستقلُّ ${b} والتطبيقُ ${a}`);
const near = (a, b, n, tol = 1) =>
  check(Math.abs(a - b) <= tol, `${n} — المستقلُّ ${b} والتطبيقُ ${a}`);
const num = (v, n) => check(typeof v === 'number' && isFinite(v), `${n} — رقمٌ صحيح (الموجود ${v})`);

const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(readFileSync('index.html','utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
/* المتصفّحُ الصوريُّ ينقصه ما في المتصفّحات الحقيقية: مرمِّزُ النصوص الذي
   يُبنى به ملفُّ KMZ، وروابطُ الكائنات التي يُنزَّل بها الملف. وغيابُها يُظهر
   عطلًا في التطبيق وليس فيه عطل — فتُسدّ قبل أن يُتَّهم بريء. */
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (w.URL && !w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}

await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await new Promise(r => setTimeout(r, 400));

const S = w.STATE;

/* ── بناءُ السيناريو: الفحصُ على قاعدةٍ فارغةٍ يمرُّ كاذبًا ─────────────────
   `CFG` تُملأ من الإعدادات وقتَ التشغيل، وقاعدةُ الاختبار خام: الأوزانُ صفرٌ
   والأسعارُ صفرٌ ولا خطَّ أساسٍ ولا سجلَّ مسحٍ واحد. فكلُّ مقارنةٍ تصير
   «صفرٌ يساوي صفرًا» وتمرّ. تُبنى هنا حالةٌ واقعيةٌ ثم يُقاس عليها. */
const seeded = {};
{
  /* ثوابتُ النظام */
  [['ph',35],['days',26],['daysWeek',6],['otRate',1.5],['warranty',12],
   ['budCap',5000000],['budApp',50000],
   ['tgtSurvey',400],['tgtInsCamp',900],['tgtInsCor',1000],
   ['tgtPrepCamp',700],['tgtPrepCor',600],['tgtAsmCamp',700],['tgtAsmCor',600],
   ['tgtDis',500],['insCamp',17],['insCor',21],['disOk',6],['disBad',9]
  ].forEach(([k,v]) => w.cfgSet(k, null, v));

  /* أوزانُ الزيارة والفك لكلِّ مشعرٍ ونوع */
  const cats = [...new Set(S.sites.map(x => w.catLabel(x)))];
  const zones = [...new Set(S.sites.map(x => x.zone))];
  let nW = 0;
  zones.forEach(z => cats.forEach(c => {
    w.cfgSet('w',  z + '|' + c, 3); w.cfgSet('dw', z + '|' + c, 2); nW++;
  }));
  seeded.weights = nW;

  /* كتالوجُ القطع */
  ['ant','rdr','cam','box','cable'].forEach((k, i) => {
    w.cfgSet('itPts',   k, i + 2);
    w.cfgSet('itPrice', k, (i + 1) * 250);
    w.cfgSet('itPrep',  k, 1);
    w.cfgSet('itAsm',   k, 1);
  });
  seeded.items = 5;

  /* مسوحٌ وتركيباتٌ معتمدة */
  const N = 120, M = 40;
  for (let i = 0; i < N; i++){
    const x = S.sites[i];
    S.recs[x.id] = { id:x.id, by:'فني', at:Date.now(), mount:'عمود', chals:[], photos:['site','mount'] };
  }
  for (let i = 0; i < M; i++){
    const x = S.sites[i];
    S.inss[x.id] = { id:x.id, by:'فني', at:Date.now(), status:'مُركّب', approved:true,
                     parts:{ ant:1, rdr:1, cam:1 } };
  }
  seeded.recs = N; seeded.inss = M;

  /* فريقٌ بأعضائه */
  const tm = (w.TEAMS || [])[0];
  if (tm){
    tm.members = [{ name:'أحمد', role:'sup', share:40 },
                  { name:'خالد', role:'tech', share:30 },
                  { name:'سعيد', role:'tech', share:30 }];
    seeded.team = tm.members.length;
  }

  w.statBump();
  if (typeof w.baseSet === 'function') w.baseSet();
  seeded.base = !!w.BASE;
}
check(seeded.weights > 0 && seeded.items > 0 && seeded.recs > 0 && seeded.inss > 0,
  `السيناريو مبنيّ: ${seeded.weights} وزنًا · ${seeded.items} صنفًا · `
  + `${seeded.recs} مسحًا · ${seeded.inss} تركيبًا`);
check(seeded.base === true, 'خطُّ الأساس مُجمَّدٌ فتُقاس القيمةُ المكتسبة');
check(w.siteStats().surveyed === seeded.recs, 'الإحصاءُ رأى المسوحَ المزروعة');

/* ══ ١ · الإحصاء: يُعاد جمعُه من الصفوف لا من الكاش ══════════════════════ */
{
  const st = w.siteStats();
  const mine = { total:0, byKey:{}, byCo:{}, byWork:{}, surveyed:0, installed:0 };
  S.sites.forEach(x => {
    mine.total++;
    const k = x.zone + '|' + x.type;
    mine.byKey[k] = (mine.byKey[k] || 0) + 1;
    if (x.co)   mine.byCo[x.co]     = (mine.byCo[x.co] || 0) + 1;
    if (x.work) mine.byWork[x.work] = (mine.byWork[x.work] || 0) + 1;
    if (w.svDone(S.recs[x.id])) mine.surveyed++;
    const r = S.inss[x.id];
    if (r && r.status === 'مُركّب' && r.approved) mine.installed++;
  });
  eq(st.total, mine.total, 'إجماليُّ المواقع');
  eq(Object.keys(st.byKey).length, Object.keys(mine.byKey).length, 'عددُ تركيبات المشعر والنوع');
  const wrongKey = Object.keys(mine.byKey).filter(k => st.byKey[k] !== mine.byKey[k]);
  eq(wrongKey.length, 0, 'كلُّ عدّادات المشعر والنوع');
  eq(Object.keys(mine.byKey).reduce((a,k) => a + mine.byKey[k], 0), mine.total,
     'مجموعُ التوزيع يساوي الإجمالي');
  eq(st.surveyed, mine.surveyed, 'عددُ المسوح');
  const wrongCo = Object.keys(mine.byCo).filter(c => (st.byCo||{})[c] !== mine.byCo[c]);
  eq(wrongCo.length, 0, 'كلُّ عدّادات الشركات');

  /* الكاشُ يُبطَل عند الكتابة — وإلا عرض القديمَ بثقة */
  const t0 = w.siteStats().total;
  S.sites.push({ id:'AUDIT-TMP', name:'س', zone:'منى', type:'مخيم', work:'', lat:21.4, lng:39.9,
                 sq:'', sign:'', co:'', region:'منطقة منى', fstat:'لم يبدأ', inout:'' });
  w.statBump();
  eq(w.siteStats().total, t0 + 1, 'الكاشُ يُبطَل عند إضافة موقع');
  S.sites.pop(); w.statBump();
}

/* ══ ٢ · النقاط: السلسلةُ الموصوفةُ تُتَّبع، ولا رقمَ يخرج غيرَ رقم ═════════ */
{
  const sample = S.sites.slice(0, 200);
  let bad = 0;
  sample.forEach(x => {
    [w.ptsSurvey(x), w.ptsInstall(x), w.ptsDis(x)].forEach(v => {
      if (typeof v !== 'number' || !isFinite(v) || v < 0) bad++;
    });
  });
  eq(bad, 0, 'نقاطُ المسح والتركيب والفك أرقامٌ موجبة');

  /* التركيب: إن عُرفت القطعُ حُسبت نقاطُها لا نقاطُ النقطة الكاملة */
  const x = S.sites[0];
  const ks = Object.keys(w.CFG.itPts);
  check(ks.length > 0, 'كتالوجُ القطع مزروعٌ فتُقاس نقاطُه');
  if (ks.length){
    S.inss[x.id] = { id:x.id, parts:{ [ks[0]]:2 }, status:'مسودّة', approved:false };
    const expect = 2 * w.itPts(ks[0]);
    near(w.ptsInstall(x), expect, 'نقاطُ التركيب من القطع', 0.01);
    delete S.inss[x.id];
  }

  /* نقاطُ النموذج مجموعُ ما فيه */
  if (ks.length >= 2){
    w.FORM.parts = { [ks[0]]:3, [ks[1]]:1 };
    near(w.formPts(), 3*w.itPts(ks[0]) + 1*w.itPts(ks[1]), 'نقاطُ النموذج مجموعُ قطعه', 0.02);
    w.FORM.parts = {};
  }
}

/* ══ ٣ · متطابقاتٌ لا تحتمل الاجتهاد ═══════════════════════════════════ */
{
  const wt = w.MILES.reduce((a, m) => a + m.w, 0);
  eq(wt, 100, 'مجموعُ أوزان المعالم');

  const dep = new Set(w.MILES.map(m => m.id));
  const orphan = w.MILES.filter(m => m.dep && !dep.has(m.dep));
  eq(orphan.length, 0, 'كلُّ تبعيةِ معلمٍ تشير إلى معلمٍ قائم');

  /* RACI: مساءَلٌ واحدٌ لا غير — العمودُ الثاني */
  const acts = w.RACI_ACTS || [];
  check(acts.length > 0, `أنشطةُ RACI موجودة (${acts.length})`);
  const noA = acts.filter(r => !r[2] || r[2] === '—');
  eq(noA.length, 0, 'كلُّ نشاطٍ له مساءَلٌ واحد');

  /* أنصبةُ الفرق مئةٌ أو صفرٌ إن خلا الفريق */
  const teams = w.TEAMS || [];
  const badShare = teams.filter(tm => tm.members.length && w.teamShare(tm) !== 100);
  eq(badShare.length, 0, 'أنصبةُ كلِّ فريقٍ مئةٌ بالمئة'
     + (badShare.length ? ' — ' + badShare.map(t2 => t2.id + ':' + w.teamShare(t2)).join(' ') : ''));
}

/* ══ ٤ · القسمةُ لا تنفجر: صفرُ المقام صفرٌ لا لانهاية ═══════════════════ */
{
  const html = w.pct(5, 0);
  check(/٠٪|0٪/.test(html), 'النسبةُ عند مقامٍ صفرٍ صفرٌ لا NaN');
  check(!/NaN|Infinity/.test(w.pct(0,0) + w.pct(3,7)), 'لا NaN ولا Infinity في النِّسَب');
}

/* ══ ٥ · القيمة المكتسبة: المتطابقاتُ المعيارية ═════════════════════════ */
{
  const e = typeof w.evm === 'function' ? w.evm() : null;
  if (!e) fails.push('EVM لم يُرجِع قيمةً رغم تجميد خط الأساس');
  else {
    ['PV','EV','AC','SPI','CPI','EAC','ETC','VAC'].forEach(k => num(e[k], 'EVM · ' + k));
    near(e.SV, e.EV - e.PV, 'SV = EV − PV', 1);
    near(e.CV, e.EV - e.AC, 'CV = EV − AC', 1);
    /* المؤشرُ المعروضُ مقرَّبٌ بمنزلتين، والتقديرُ محسوبٌ بالدقة الكاملة —
       فيُقاس كلٌّ على أصله، ويُشترَط أن التقريبَ لم يُغيّر المعنى. */
    if (e.PV) near(e.SPIx, e.EV / e.PV, 'SPI = EV ÷ PV (بالدقة الكاملة)', 0.0001);
    if (e.AC) near(e.CPIx, e.EV / e.AC, 'CPI = EV ÷ AC (بالدقة الكاملة)', 0.0001);
    if (e.CPIx) near(e.EAC, Math.round(w.BASE.bac / e.CPIx), 'EAC = BAC ÷ CPI', 1);
    near(e.SPI, Math.round(e.SPIx * 100) / 100, 'المعروضُ تقريبُ الكامل — SPI', 0);
    near(e.CPI, Math.round(e.CPIx * 100) / 100, 'المعروضُ تقريبُ الكامل — CPI', 0);
    near(e.VAC, w.BASE.bac - e.EAC, 'VAC = BAC − EAC', 1);
    check(e.ETC >= 0, 'ETC غيرُ سالب');

    /* المكتسَبُ يُعاد حسابُه مستقلًّا */
    let earned = 0;
    S.sites.forEach(x => {
      if (w.svDone(S.recs[x.id])) earned += w.ptsSurvey(x);
      const r = S.inss[x.id];
      if (r && r.status === 'مُركّب' && r.approved) earned += w.ptsInstall(x);
    });
    near(e.EV, Math.round(earned * w.BASE.ph), 'EV يطابق الحساب المستقل', 1);
  }
}

/* ══ ٦ · التارجت: الأسبوعيُّ مشتقٌّ من الشهريِّ لا مكتوبٌ بيد ═══════════ */
{
  if (typeof w.cfgWk === 'function'){
    const days = w.cfgGet('days') || 0, dw = w.cfgGet('daysWeek') || 0;
    const m = 120;
    const got = String(w.cfgWk(m)).replace(/[^\d.]/g,'');
    if (days && dw){
      const want = Math.round(m / (days / dw));
      near(parseFloat(got) || 0, want, 'التارجتُ الأسبوعيُّ مشتقٌّ من الشهري', 1);
    } else fails.push('أيامُ الشهر أو الأسبوع صفرٌ رغم زرعها');
  } else fails.push('لا دالةَ اشتقاقٍ أسبوعيّ');
}

/* ══ ٧ · لا رقمَ يخرج NaN من أيِّ حاسبةٍ تُنادى بلا بيانات ═══════════════ */
{
  const probes = ['itPts','itPrice','dayCapOf','teamShare','selPts','formPts','teamPoints'];
  const bad = [];
  probes.forEach(fn => {
    if (typeof w[fn] !== 'function') return;
    let v;
    try { v = fn === 'teamShare' || fn === 'teamPoints' ? w[fn]({ members:[] }) : w[fn]('لا-وجود-له'); }
    catch (err){ bad.push(fn + ' انفجرت'); return; }
    if (typeof v === 'number' && !isFinite(v)) bad.push(fn + ' → ' + v);
  });
  eq(bad.length, 0, 'الحاسباتُ تحتمل المجهولَ بلا NaN' + (bad.length ? ' — ' + bad.join(' | ') : ''));
}

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ المعادلات نظيف ✅');
process.exit(0);
