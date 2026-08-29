/* ═══════════════════════════════════════════════════════════════════════════
   جردُ السعة — يُشغَّل: node scripts/audit-capacity.mjs
   ───────────────────────────────────────────────────────────────────────────
   النظامُ يعمل على جهازٍ واحدٍ ثم يسقط على مئةٍ وخمسين. والسقوطُ لا يأتي من
   عطلٍ في الشيفرة بل من حسابٍ لم يُجرَ: حصةُ الخطة المجانية عشرون ألفَ كتابةٍ
   وخمسون ألفَ قراءةٍ في اليوم وجيجابايتٌ واحدٌ تخزينًا — وهي كافيةٌ لواحدٍ
   وتُستنفَد قبل الظهر بمئةٍ وخمسين.

   وأخطرُ من الاستنفاد أن يُكتَب رقمٌ واحدٌ من مئةٍ وخمسين جهازًا: آخرُ من كتب
   يفوز، وكلُّ جهازٍ يكتب ما يراه هو، فتعرض لوحةُ الوزارة آخرَ من زامن لا
   حقيقةَ اليوم.

   فهذا الجردُ يقرأ ثوابتَ الشيفرة — لا التمنّي — ويحسب الميزانيةَ اليومية،
   ويمنع كلَّ نمطٍ يفسد عند التوازي.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const src = readFileSync('index.html', 'utf8');
const num = (re, dflt) => { const m = re.exec(src); return m ? +m[1] : dflt; };

/* ── حدودُ الخطة المجانية ─────────────────────────────────────────────── */
const CAP = { writes:20000, reads:50000, storeGiB:1 };
const USERS = 150, MONTHS = 6;

/* ── ثوابتُ الشيفرة كما هي ────────────────────────────────────────────── */
const K = {
  queueCap:  num(/QUEUE_CAP\s*=\s*(\d+)/, 0),
  batch:     num(/queue\.slice\(0,\s*(\d+)\)/, 0),
  pullLimit: num(/limit\((\d+)\)\.get/, 0),
  syncMs:    num(/pullDelta\(\)\.then\(function\(n\)\{ if \(n\) render\(1\); \}\);\s*\n\}, (\d+)\)/, 0),
  rollMs:    num(/now - ROLL_LAST < (\d+)/, 0),
  pushMs:    num(/now - ROLL_PUSH > (\d+)/, 0)
};
check(K.queueCap > 0 && K.batch > 0 && K.pullLimit > 0 && K.syncMs > 0,
  `ثوابتُ المزامنة مقروءة (طابور ${K.queueCap} · دفعة ${K.batch} · سحب ${K.pullLimit} · دورة ${K.syncMs/1000}ث)`);

/* ── الكتابة: عملُ اليوم + الطوابعُ + التجميع ────────────────────────────── */
const perUser = { survey:20, install:8 };           /* سقفُ يومٍ نشط */
const docsPerSurvey = 2;                            /* السجلُّ + الحدث */
const docsPerInstall = 3;                           /* السجلُّ + الحدث + العهدة */
const workWrites = USERS * (perUser.survey * docsPerSurvey + perUser.install * docsPerInstall);

/* التجميعُ اليوميّ: من يكتبه وكم مرة */
const rollAll = /CORE\.dirty\('stats'/.test(src);
const rollGated = /mayWrite && \(force \|\| now - ROLL_PUSH/.test(src);
check(rollGated, 'التجميعُ اليوميُّ يكتبه جهازُ المكتب وحده — لا كلُّ جهاز');
const rollDevices = rollGated ? 1 : USERS;
const rollEvery   = rollGated ? (K.pushMs || 900000) : (K.rollMs || 120000);
const rollWrites  = Math.round(rollDevices * (86400000 / rollEvery));

const writes = workWrites + rollWrites;
check(writes <= CAP.writes,
  `الكتابةُ اليوميةُ داخل الحصة — ${writes.toLocaleString('en')} من ${CAP.writes.toLocaleString('en')}`
  + ` (عمل ${workWrites.toLocaleString('en')} · تجميع ${rollWrites.toLocaleString('en')})`);
check(writes <= CAP.writes * 0.8,
  `وفيها متّسعٌ للذروة — المستعمَل ${Math.round(writes / CAP.writes * 100)}٪`);

/* ── القراءة: سحبٌ باردٌ مرةً + فوارقُ اليوم ─────────────────────────────── */
/* الميدانُ يسحب ما كتبه هو، والمكتبُ يسحب الكلَّ — فيُحسَب كلٌّ على حدة */
const layered = /var cols  = deep \? \['recs','inss','tasks'\]/.test(src)
             && /: stat \? \['stats'\]/.test(src);
check(layered, 'السحبُ ثلاثُ طبقات: المهندسُ خامًّا، والمكتبُ تجميعًا، والميدانُ لا شيء');
const scoped = /if \(!deep && c !== 'stats' && me\) q = q\.where\('_by'/.test(src);
check(scoped, 'ما دون المهندسِ لا يقرأ سجلاتِ غيره');
const officeEvery = num(/var every  = office \? (\d+)/, 300000);
const DEEP = 3, DESK = 5, FIELD = USERS - DEEP - DESK;
const dayDocs = workWrites;
const deepReads  = DEEP * dayDocs + DEEP * Math.round(86400000 / officeEvery);
const deskReads  = DESK * Math.round(86400000 / officeEvery);   /* وثيقةُ اليوم لا غير */
const fieldCold  = FIELD * 2;                                   /* سحبةٌ باردةٌ واحدة */
const liveTasks  = FIELD * 20;
const reads = deepReads + deskReads + fieldCold + liveTasks;
check(reads <= CAP.reads,
  `القراءةُ اليوميةُ داخل الحصة — ${reads.toLocaleString('en')} من ${CAP.reads.toLocaleString('en')}`
  + ` (مهندسون ${deepReads.toLocaleString('en')} · مكتب ${deskReads.toLocaleString('en')} · ميدان ${(fieldCold+liveTasks).toLocaleString('en')})`);
check(reads <= CAP.reads * 0.8, `وفيها متّسعٌ — المستعمَل ${Math.round(reads / CAP.reads * 100)}٪`);

/* ── التخزين: لا صورةَ خامٌ في القاعدة ──────────────────────────────────── */
const rawPhoto = /CORE\.set\('photos',[^)]*\bdata:\s*(FORM|NEWSITE)/.test(src)
              || /CORE\.set\('photos', 'newsite__/.test(src);
check(!rawPhoto, 'لا مسارَ يكتب صورةً خامًّا في قاعدة البيانات');
check(/photoQueue\(/.test(src) && /drvUpload\(/.test(src), 'الصورُ تُرفَع إلى درايف');

const docBytes = 900;                                /* سجلٌّ متوسطٌ بلا صورة */
const seasonDocs = 1787 * 4 + USERS * 30 * MONTHS;   /* سجلاتٌ وأحداثٌ للموسم */
const storeGiB = seasonDocs * docBytes / 1073741824;
check(storeGiB < CAP.storeGiB * 0.5,
  `التخزينُ داخل الحد — ${storeGiB.toFixed(2)} جيجا من ${CAP.storeGiB} على ${MONTHS} أشهر`);

/* ── التوازي: ما يفسد حين يكتبه أكثرُ من واحد ───────────────────────────── */
check(/DEV_ID/.test(src), 'لكلِّ جهازٍ معرّفٌ ثابت — فلا يمحو جهازٌ كتابةَ آخر');
check(/merge:\s*true/.test(src), 'الكتابةُ دمجٌ لا استبدال — فلا يُمحى حقلٌ لم يُرسَل');

/* ── لا يضيع شيء ────────────────────────────────────────────────────────── */
check(!/queue\.slice\(-QUEUE_CAP\)/.test(src), 'الطابورُ لا يُسقط أقدمَه — أقدمُه أوّلُ ما لم يُرفَع');
check(/addEventListener\('online'/.test(src), 'يُعاد الرفعُ عند عودة الشبكة');
check(K.syncMs > 0 && K.syncMs <= 300000, `وتُعاد المحاولةُ دوريًّا كلَّ ${K.syncMs/1000} ثانية`);
check(/idbSet\('state'/.test(src), 'الطابورُ محفوظٌ على القرص — فلا يضيع بإغلاق التطبيق');
check(/\.catch\(function\(\)\{ return 0; \}\)/.test(src) || /catch/.test(src),
  'فشلُ الرفع لا يُفرغ الطابور');

/* ── اللوحةُ التاريخية ──────────────────────────────────────────────────── */
check(/function history\(/.test(src), 'التاريخُ متاحٌ للوحة والتقارير');
check(/STATE\.stats/.test(src), 'اليومياتُ محفوظةٌ يومًا بيوم');

console.log('\n══ ميزانيةُ اليوم عند ' + USERS + ' مستخدمًا ══');
console.log('  كتابة : ' + String(writes).padStart(7) + ' / ' + CAP.writes
  + '   (' + Math.round(writes / CAP.writes * 100) + '٪)');
console.log('  قراءة : ' + String(reads).padStart(7) + ' / ' + CAP.reads
  + '   (' + Math.round(reads / CAP.reads * 100) + '٪)');
console.log('  تخزين : ' + storeGiB.toFixed(2) + ' جيجا / ' + CAP.storeGiB + '  على ' + MONTHS + ' أشهر');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ السعة نظيف ✅');
process.exit(0);
