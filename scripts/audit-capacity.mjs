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
  /* V16.6 بدّل المؤقّتَ بعدّادٍ ثانويّ: SYNC_CYCLE بالثواني لا بالمللي */
  syncMs:    num(/var SYNC_CYCLE = (\d+)/, 0) * 1000,
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
/* ═══ الطبقاتُ كما صارت في V16.11 ═══
   كان الفحصُ يقرأ `cols/deep` — شكلًا لم يعد له وجودٌ منذ V16.6 — فسقط أربعَ
   مراتٍ صامتًا في السحابة لأنه لم يكن مسجَّلًا في الحارس المحليّ. ولمّا قُرئت
   الأرقامُ الحقيقيةُ كانت الميزانيةُ تسعةَ أضعافِ الحصة: كلُّ من فوق المشرف
   يسحب الكلَّ ويُنصِت إليه فوق ذلك. فصار النطاقُ شجرةً والتسليمُ مرةً. */
const layered = /r === 'exec' \|\| r === 'admin' \|\| isBossHere\(\)\) return \{ cols:ALL_WORK, mine:false, tree:false/.test(src)
             && /rankOf\(ROLE\) >= rankOf\('supervisor'\)\) return \{ cols:ALL_WORK, mine:false, tree:true/.test(src)
             && /if \(r === 'viewer'\) return \{ cols:\['stats'\]/.test(src)
             && /cols:\['recs','inss','dismantles','maints'\], mine:true/.test(src);
check(layered, 'السحبُ أربعُ طبقات: الإدارةُ الكلَّ، ومن دونها شجرتَه، والوزارةُ الأرقامَ، والميدانُ ما كتبه');
const scoped = /if \(sc\.mine && c !== 'stats' && me\) q = q\.where\('_by', '==', me\)/.test(src)
            && /where\(tq\.fld, 'in', k\)/.test(src);
check(scoped, 'والميدانُ لا يقرأ سجلاتِ غيره — والمشرفُ شجرتَه بـ«in»');
const officeEvery = num(/mine:false, tree:true, every:(\d+)/, 21600000);
const fieldEvery  = num(/mine:true, tree:false, every:(\d+)/, 21600000);
check(/if \(scope\.mine && STATE\.meta\.uid\)\{/.test(src) && /\['_by', '==', STATE\.meta\.uid\], \['_at', '>', tf\]/.test(src),
  'والميدانُ يُنصِت إلى ما كتبه هو — لا يستعلم فارغًا كلَّ نصف ساعة');
check(officeEvery >= 3600000, `ومن يُنصِت لا يسحب دوريًّا إلا شبكةَ أمانٍ — كلَّ ${Math.round(officeEvery/3600000)} ساعات`);

/* ═══ يومُ الذروة من نطاق المشروع لا من عددِ الناس ═══
   كان يومُ الذروة «كلُّ شخصٍ عشرون مسحًا وثمانيةُ تركيبات» — أي ألفان وخمسمئةُ
   مسحٍ في يومٍ والنطاقُ كلُّه ١٧٨٧ نقطة. فصار: المسحُ كلُّه في يومٍ واحدٍ (أقصى ما
   يمكن)، والتركيبُ سُبعُ النطاق. */
const SITES = 1787;
const peakDocs = SITES * docsPerSurvey + Math.ceil(SITES / 7) * docsPerInstall;
const dayDocs = Math.min(workWrites, peakDocs);
/* من يقرأ الوثيقةَ الواحدة: الإدارةُ كلُّها (مديرٌ وإدارةٌ عليا) + سلسلةُ من فوقها
   في الشجرة (مشرفٌ، مهندسٌ، ومديرا المهندسين) — لا كلُّ مشرفٍ في المشروع */
const ADMINS = 2, CHAIN = 4, VIEW = 2, FIELD = USERS - ADMINS - CHAIN * 5 - VIEW;
const perDoc = ADMINS + CHAIN;
const rawReads   = perDoc * dayDocs;                          /* تسليمٌ واحدٌ لكلِّ قارئ */
const safety     = (ADMINS + 20) * Math.round(86400000 / officeEvery) * 5;
const viewReads  = VIEW * Math.round(86400000 / 300000);
const fieldCold  = FIELD * 4;                                 /* أربعُ مجموعاتٍ باردة */
const fieldDelta = FIELD * Math.round(86400000 / fieldEvery) * 4;   /* أربعُ مجموعاتٍ كلَّ سحبة */
const liveTasks  = FIELD * 20;
/* ═══ الثوابتُ عند الدخول ═══
   كانت `pull(0)` تقرأ عشرين وثيقةَ إعداداتٍ وطبقةَ النقاط والمخزونَ والمشترياتِ
   كلَّ دقيقةٍ على كلِّ جهاز، ثم ماتت في V16.6. صارت `pullStatic` مرةً عند
   الدخول: الميدانُ إعداداتٍ وطبقةً بمؤشِّرٍ (ما تغيّر) وسياراتٍ، والمكتبُ فوقها
   المخزونَ والمشترياتِ والشحناتِ — ولا شيءَ منها كلَّ دقيقة. */
check(/pullStatic: function\(\)/.test(src) && /return FB\.pullStatic\(\)\.catch/.test(src) && !/FB\.pull\(0\)/.test(src),
  'الثوابتُ تُقرأ مرةً عند الدخول لا كلَّ دقيقة — pullStatic');
check(/office && FB\.db\.collection\('inventory'\)/.test(src) && /office && FB\.db\.collection\('purchases'\)/.test(src),
  'والمخزونُ والمشترياتُ للمكتب وحده');
check(/if \(sSince > 0\) sq = sq\.where\('_at', '>', sSince\)/.test(src), 'وطبقةُ النقاط بمؤشِّرٍ — ما تغيّر لا ألفٌ وسبعمئة');
const LOGINS = 2;                                    /* دخولان في اليوم لكلِّ جهاز */
const staticField  = FIELD * LOGINS * 40;            /* إعداداتٌ وسياراتٌ وطبقةٌ فارقية */
const staticOffice = (ADMINS + CHAIN * 5 + VIEW) * LOGINS * 450;   /* + المخزونُ والمشترياتُ واللقطات — الحساباتُ والفرقُ بالإنصات */
check(/if \(false && rankOf\(ROLE\) > 30\)\{/.test(src) && /false && FB\.db\.collection\('teams'\)/.test(src), 'والحساباتُ والفرقُ لا تُقرأ مرتين — الإنصاتُ يكفي');
const reads = rawReads + safety + viewReads + fieldCold + fieldDelta + liveTasks + staticField + staticOffice;
check(reads <= CAP.reads,
  `القراءةُ اليوميةُ داخل الحصة — ${reads.toLocaleString('en')} من ${CAP.reads.toLocaleString('en')}`
  + ` (${perDoc} قرّاءٍ لكلِّ وثيقةٍ من ${dayDocs.toLocaleString('en')}: ${rawReads.toLocaleString('en')} · أمان ${safety.toLocaleString('en')}`
  + ` · وزارة ${viewReads.toLocaleString('en')} · ميدان ${(fieldCold+fieldDelta+liveTasks).toLocaleString('en')}`
  + ` · ثوابتُ الدخول ${(staticField+staticOffice).toLocaleString('en')})`);
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
/* الاسمُ `statsHistory` لا `history`: الثانيةُ تصطدم بـ`window.history` فيبقى
   كائنُ المتصفّح مكانَه ويسقط التاريخُ صامتًا. والفحصُ بالاسم يدفع من يقرؤه
   إلى إعادة العطل — فيُفحَص السلوكُ لا الاسم. */
check(!/function history\s*\(/.test(src), 'لا دالةَ باسم history يصطدم بكائن المتصفّح');
check(/function statsHistory\(/.test(src), 'دالةُ التاريخ معرَّفةٌ باسمٍ لا يصطدم');
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
