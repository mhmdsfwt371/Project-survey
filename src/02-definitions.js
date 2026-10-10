
/* ═══════════════════════════════════════════════════════════════════════════════
   تعريفاتُ النقطة — مصدرٌ واحد (V36.0، توصيةُ مراجعة الفريق)
   كلُّ سؤالٍ «ما حالُ هذه النقطة؟» يُجاب من هنا: هل تمت زيارتُها، وهل وُصل إليها، وهل هي بلا عوائق أو بعوائق، وهل رُكّبت
   وسُلّمت وفُكّت، وبمَ تُعرَف (رقمُ الشاخص أو اسمُ ١٤٤٧ أو NSK). كانت موزّعةً على ثلاثة ملفات فتختلف تعريفاتٌ متشابهة —
   ومنها خرجت أخطاءُ «محطات القطار» الثلاثة. نُقلت إلى هنا كما هي حرفًا بحرف؛ وأيُّ تعريفٍ جديدٍ للحالة مكانُه هنا.
   اختبارُ الوحدة يرفض تعريفَ أيٍّ منها في ملفٍّ آخر.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── حالةُ الزيارة — من «تمت الزيارة» إلى «بعوائق» ── */
/* ═══ (V32.6) قرارُ المالك: «زيرت» = زيارةٌ ميدانيةٌ بأيِّ نتيجة ═══
   «رحت للـ٨٨ نقطة زيارةً ميدانية وأخذت الفيدباك» — فأرقامُ تقدّم المسح في كلِّ الشاشات (الملخّص، والقاعة، والخريطة، والوزارة،
   وسلسلةُ المراحل، واللقطةُ اليومية، وقياسُ الخطة، وملفُّ الوزارة اليومي، والتقارير) تعدّ كلَّ نقطةٍ لها زيارة: وُصل، أو تعذّر،
   أو يحتاج تصريحًا، أو رُدَّت لزيارةٍ أخرى. «المتبقي» = ما لم يُزَر أصلًا. أمّا سيرُ العمل (الجاهزيةُ للتركيب، والاعتماد، والحلول،
   ومقترحُ أقرب نقطة، والتحدياتُ والقياسات) فيبقى على svDone — المتعذّرُ يحتاج زيارةً أخرى ولا يُركَّب عليه. (سجلُّ القرارات ق-٠٠٧) */
function svVisited(r){ return !!r && !r.deleted; }
/* الزيارةُ التي مُنع فيها الدخولُ ليست مسحًا: تُسجَّل ليُعرَف السببُ ويُتصرَّف،
   ولا تُحتسب إنجازًا. وإلا صار المنعُ يرفع نسبةَ الإنجاز. */
/* ═══ اعتمادُ الزيارة — الدورةُ الكاملة ═══
   كانت الزيارةُ تُحتسَب منجزةً لحظةَ حفظها، وتدخل من فورها في حلِّ التركيب
   بلا عينٍ تراجعها. والمطلوبُ: المشرفُ يزور ويحفظ ويقول «تمت الزيارة»، ثم
   تظهر النقطةُ ببياناتها الجديدة في «اعتماد الزيارات» فيعتمدها المهندسُ أو
   يردُّها «تحتاج زيارةً أخرى» فتعود إلى الدورة من أولها.
     review: 'pending'  — حُفظت وتنتظر المهندس (الافتراضيُّ لكلِّ سجلٍّ حُفظ)
             'approved' — اعتمدها المهندس؛ عندها يُقترَح حلُّها ويُركَّب
             'revisit'  — رُدَّت؛ لا تُعدُّ منجزةً حتى تُزار ثانيةً
   المنجَزُ (svDone) ما حُفظ بوصولٍ ولم يُرَدّ — فالرَّدُّ يُخرجها من العِداد
   ومن طبقة التركيب معًا. والمعتمَدُ (svApproved) وحدَه يُقترَح له حلّ. */
/* ═══ ثلاثةُ أحوالٍ لا تختلط (V17.77) ═══
   وصلَ فسُجِّلت الزيارة (svDone) · وصلَ فرُدَّت لزيارةٍ أخرى (revisit) · لم يصل
   أصلًا (متعذّر). كانت شاشةٌ تعدُّ المتعذّرَ بلا المردود وأخرى تعدُّهما معًا تحت
   الاسم نفسِه، فتقرأ الوزارةُ رقمين لكلمةٍ واحدة. */
/* (V33.0) اختبارُ الوحدة الجديد أمسكه: شاهدُ الحذف {deleted:true} بلا حقل وصولٍ كان يُعَدّ «وُصل إليها» — فلا يُعَدّ شاهدٌ زيارةً بأيِّ معنى */
function svReached(r){ return !!r && !r.deleted && (!r.access || r.access === 'تم الوصول'); }
function svStuck(r){ return !!r && !r.deleted && !svReached(r); }
function svDone(r){ return svReached(r) && r.review !== 'revisit'; }
function svHasChal(r){ return chalKeys((r && r.chals) || []).some(function(k){ return k && k !== 'لا توجد تحديات'; }); }
function svNeedsRevisit(r){ return svVisited(r) && (svStuck(r) || r.review === 'revisit'); }
/* (V33.4) بلاغُ المالك: «محطاتُ القطار ما فيها عوائق نهائيًّا» — وظهرت ١٠٨/١٠٨ بعوائق. سجلّاتُها كلُّها «زيارةٌ بقرار المهندس»
   (quick) بلا حقل وصولٍ ولا تحديات، وكان الشرطُ «تم الوصول» حرفًا فيسقطها. الوصولُ هنا كما في svReached: «تم الوصول» أو لا حقل. */
function svClean(r){ return svVisited(r) && svDone(r) && !svHasChal(r); }
function svObstacle(r){ return svVisited(r) && !svClean(r); }

/* ── عرضُ التحديات للوزارة ── */
/* ═══ (V33.0) قرارُ المالك: لا «متعذّر» ولا «بلا تصريح» في العرض ═══
   النقطةُ التي زيرت ولم يُوصَل إليها (متعذّر، يحتاج تصريحًا، منع دخول، غير موجودة…) أو رُدَّت لزيارةٍ أخرى تُعرض «تمت الزيارة»
   وتحدّيها «تحتاج زيارة أخرى». فالمزارُ قسمان لا ثالثَ لهما: بلا عوائق (وُصل إليها بلا تحدٍّ) وبعوائق (ما سواها).
   سببُ التعذّر الحقيقيُّ باقٍ في السجلّ لسير العمل (التصاريح والتصعيد) — لا يُمحى ولا يُغيَّر. */
/* (V34.0) بلاغُ المالك على «أبرز التحديات»: «المدخل غير واضح — لم يُستدل عليه» تُعرض «تحتاج زيارة تقنية»، و«أخرى» تُعرض
   «ملاحظات فنية متنوعة» — لا ما يوحي بتصريحٍ أو بتعذّر الوصول. عرضٌ فقط: قيمةُ السجل ونموذجُ الميدان كما هما. */
var CHAL_SHOW = { 'المدخل غير واضح — لم يُستدل عليه':'تحتاج زيارة تقنية', 'أخرى':'ملاحظات فنية متنوعة' };
function chalShow(k){ return t(CHAL_SHOW[k] || k); }

/* ── التركيبُ والتسليمُ والفك ── */
function insDone(id){
  var r = STATE.inss[id];
  return !!(r && r.status === 'مُركّب');
}
function handOf(id){
  var r = STATE.inss[id];
  return (r && r.hand) || null;
}
function handDone(id){ return !!handOf(id); }
function disDone(id){
  var r = STATE.diss ? STATE.diss[id] : null;
  return !!(r && r.status === 'تم الفك');
}

/* ── المعرّفُ الأوّلُ للنقطة (ق-٠١٢) ── */
/* ═══ المخيمُ يُعرَف بشاخصه (V23.8) ═══
   «خلي كل المخيمات تبان برقم الشاخص يكون هو الحاجة الأساسية»: عنوانُ المخيم في النافذة والقوائم رقمُ
   شاخصه، وتحته المشعرُ والمربعُ والمعرِّف — وغيرُ المخيم باسمه كما كان. */
/* ═══ (V35.0) قرارُ المالك: المعرّفُ الأوّلُ للنقطة ═══
   المخيمات (منى وعرفات): رقمُ الشاخص «رقمُ المخيم/رقمُ الشارع» — مثل 25/56 = المخيمُ ٢٥ في الشارع ٥٦.
   الممرات المركّبةُ في ١٤٤٧: اسمُها المعروف من الموسم الماضي (Path-Shaded-3R…) — يُستخرَج من اسم النقطة.
   الممراتُ الجديدةُ وباقي النقاط: المعرّفُ المقترح (NSK-…) كما هو حتى إشعارٍ آخر.
   ومعرّفُ النظام NSK-… يبقى ثانيًا في كلِّ نافذةٍ وجدولٍ وتصدير، وكلاهما يُبحَث به. */
function siteKey(x){
  if (!x) return '';
  /* اسمُ الشاخص أو رقمُه — (V35.1) توضيحُ المالك: «فيه مخيمات فيها أكتر من شركة» — الشاخصُ نفسُه بسطرين أو أكثر في المربع نفسِه
     ليس خطأً: لكلِّ شركةٍ في المخيم سطرٌ في السجلّ. فالشاخصُ هو المعرّفُ الأوّلُ لكلِّ سطوره، ويُفرَّق بينها بالشركة ومعرّفِ النظام
     (siteIdHtml)، والبحثُ بالشاخص يُرجعها كلَّها. ولا يبقى NSK أوّلًا إلا لمخيمٍ بلا شاخص. */
  if (x.type === 'مخيم' && x.sign){
    var sg = String(x.sign).trim();
    if (sg && !/[?]|null/i.test(sg)) return sg;
  }
  if (x.type === 'ممر' && x.work === 'إعادة تركيب ١٤٤٧'){ var m = /ممر\s+([A-Za-z][\w\-.]*)/.exec(String(x.name || '')); if (m) return m[1]; }
  return x.id;
}
/* الخليةُ في الجداول: المعرّفُ الأوّلُ بارزًا ومعرّفُ النظام صغيرًا تحته إن اختلفا */
function siteOf(o){ if (!o) return o; if (o.type) return o; if (o.site && o.site.id) return o.site; return (typeof siteFind === 'function' && siteFind(o.id)) || o; }   /* (V35.2) */
function siteShared(x){   /* (V35.1) كم سطرًا يحمل هذا الشاخصَ في المشعر نفسِه (مخيمٌ لأكثر من شركة) */
  if (!x || x.type !== 'مخيم' || !x.sign) return 1;
  var U = siteShared.u; if (!U || U.n !== (STATE.sites || []).length){ U = siteShared.u = { n:(STATE.sites || []).length, c:{} }; (STATE.sites || []).forEach(function(y){ if (y.type === 'مخيم' && y.sign){ var k = y.zone + '|' + String(y.sign).trim(); U.c[k] = (U.c[k] || 0) + 1; } }); }
  return U.c[x.zone + '|' + String(x.sign).trim()] || 1;
}
function siteIdHtml(x){ if (!x) return ''; var k = siteKey(x), sh = siteShared(x) > 1 && x.co;
  return '<b class="num">' + bdi(k) + '</b>' + (sh ? '<div class="hint" style="margin:0;font-size:11px">' + esc(x.co) + '</div>' : '') + (k !== x.id ? '<div class="num hint" style="margin:0;font-size:11px">' + bdi(x.id) + '</div>' : ''); }
function siteKeyLabel(x){ return x && x.type === 'مخيم' ? 'رقم الشاخص' : (x && x.type === 'ممر' && siteKey(x) !== x.id ? 'الاسم في ١٤٤٧' : 'المعرّف'); }

/* ── قرارُ المالك (V36.4): ما رُكّب لا يُحذَف ── */
/* «أيُّ حاجةٍ اتركّبت مينفعش تتمسح، ولا أيُّ خطوةٍ بعد التركيب — الجدولةُ ينفع تتمسح». فالنقطةُ التي رُكّبت أو بعدها خطوةٌ (تسليمٌ أو فكٌّ
   أو صيانة) لا تُحذَف بأيِّ طريق، ولا سجلّاتُ تلك الخطوات. وما قبل التركيب (الزيارةُ والجدولةُ والإسناد) يُحذَف. */
function siteLocked(id){
  if (insDone(id)) return 'رُكّبت';
  if (handDone(id)) return 'سُلّمت';
  if (STATE.diss && STATE.diss[id]) return 'لها سجلُّ فك';
  if (STATE.maints && STATE.maints[id]) return 'لها سجلُّ صيانة';
  return '';
}

/* (V36.7) تجاوزٌ وصل من جهازٍ آخر (حيًّا أو بالسحب): يُدمَج في STATE.siteOv، ويُعاد توزيعُ النقطة بين الظاهرة والمخفية —
   فالحذفُ يُخفيها والاستعادةُ تعيدها، والتعديلُ يُطبَّق، في كلِّ الأجهزة. */
function siteOvIncoming(id, v){
  if (!id || !v) return false;
  STATE.siteOv = STATE.siteOv || {};
  var before = !!(STATE.siteOv[id] && STATE.siteOv[id].hidden);
  STATE.siteOv[id] = Object.assign({}, STATE.siteOv[id] || {}, v);
  STATE.sites = (STATE.sites || []).concat(STATE.hiddenSites || []);
  siteOvApply();
  if (before !== !!STATE.siteOv[id].hidden){ CORE.saveSoon(); if (typeof mapPaint === 'function' && CUR === 'map') mapPaint(); }
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   (V37.0) قرارُ المالك — الزيارةُ غيرُ المسح، والأسبابُ والتحدياتُ تُعَدّ على الأصابع
   ───────────────────────────────────────────────────────────────────────────────
   «رحنا زرنا ٧ ومسحنا ٥»: الزيارةُ ذهابٌ للموقع بأيِّ نتيجة، والمسحُ ما اكتمل فعلًا. والفرقُ له سببٌ واحدٌ من خمسة،
   وتحدياتُ التركيب ثمانية. كلٌّ منها له «جهةُ الحل». ما كُتب نصًّا حرًّا قبل اليوم يُصنَّف بقواعد كلماتٍ ثابتة (لا يُعاد
   كتابةُ السجل) — وما لا تقطع فيه القاعدةُ يبقى «يراجعه المهندس». ومن V37.1 يُختار من قائمةٍ في الميدان فلا تتعدّد الصيغ.
   ═══════════════════════════════════════════════════════════════════════════════ */
var VISIT_WHY = [   /* لماذا لم يُمسح ما زرناه — اختيارٌ واحد */
  { k:'closed',  n:'الطريق أو البوابة مغلقة',             who:'الشركة أو الحراسة', photo:true, sup:[{ p:'الشركة أو الحراسة', s:'فتح الطريق أو البوابة وتسهيل دخول الفريق' }] },
  { k:'denied',  n:'منعتنا جهة (حراسة أو شركة أو أمن)',    who:'الشركة أو الحراسة', photo:true, sup:[{ p:'الشركة أو الحراسة', s:'إذنُ دخول الفريق للموقع' }] },
  { k:'permit',  n:'يحتاج تصريحًا أو تواصلًا رسميًّا',      who:'الوزارة', sup:[{ p:'الوزارة', s:'تصريحٌ أو خطابٌ رسميٌّ للجهة المعنية' }] },
  { k:'missing', n:'الموقع غير موجود أو غير مطابق للسجل',  who:'الوزارة — تصحيح السجل' },
  { k:'other',   n:'تحت الإنشاء أو منشأة جهة أخرى',        who:'الجهة المالكة', sup:[{ p:'الجهة المالكة', s:'التنسيقُ قبل التركيب' }] }
];
var CHAL_CATS = [   /* تحدياتُ التركيب لما مُسح — أكثرُ من اختيار */
  { k:'mount',  n:'لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا',  who:'أفاقي — تصنيع هيكل' },
  { k:'beam',   n:'العارضة ناقصة أو عليها ديكور أو لافتات',      who:'أفاقي — تصنيع هيكل' },
  { k:'entry',  n:'تحتاج زيارة تقنية — المدخل غير واضح',         who:'أفاقي — زيارة تقنية' },
  { k:'multi',  n:'مداخل متعددة أو مدخل مشترك',                  who:'أفاقي — دراسة الموقع' },
  { k:'wide',   n:'المسار أو البوابة أعرض من طقم واحد',          who:'أفاقي — طقم إضافي' },
  { k:'block',  n:'عائق في الموقع (إنشائي أو درج أو حواجز أو حفر أو نفق أو كوبري)', who:'الشركة أو الجهة المالكة', sup:[{ p:'الشركة أو الجهة المالكة', s:'إزالةُ العائق أو الإذنُ بالتركيب' }] },
  { k:'height', n:'ارتفاع صعب أو مبنى متعدد الأدوار',             who:'أفاقي — معدات' },
  { k:'legacy', n:'منظومة قائمة لجهة أخرى',                       who:'الجهة المالكة', sup:[{ p:'الجهة المالكة', s:'التنسيقُ مع منظومتها القائمة' }] }
];
function arKey(s){ return String(s || '').replace(/[\u064B-\u0652\u0640\u200f\u200e]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة(?=\s|$)/g, 'ه').replace(/ى(?=\s|$)/g, 'ي').replace(/\s+/g, ' ').trim(); }
/* سببُ عدم المسح: المختارُ في الميدان (r.why) أوّلًا، ثم قواعدُ الكلمات على النصّ، ثم حالةُ الوصول؛ وإلا null (يراجعه المهندس) */
var WHY_RULES = [
  ['permit',  /تصريح|تواصل رسمي|التصوير ممنوع/],
  ['denied',  /منعنا|تم منع|منع الدخول من|من قبل شرك|حراس|الامن|امن الدول/],
  ['closed',  /مغلق|مقفل|اغلاق|مسدود/],
  ['missing', /غير موجود|لم يستدل|غير صحيح|لا يوجد شاخص|لا يوجد مخيم|ملامح|رصدت مرتين|الرقم/],
  ['other',   /انشاء|الدفاع المدني|وزاره|قوات|ربوه|خدمات فقط|كدانه/]
];
function visitWhy(r){
  if (!r || r.deleted || !svStuck(r)) return null;
  if (r.why && whyList().some(function(o){ return o.k === r.why; })) return r.why;
  var txt = arKey([r.note, r.chal_note, r.chalNote].join(' '));
  for (var i = 0; i < WHY_RULES.length; i++) if (WHY_RULES[i][1].test(txt)) return WHY_RULES[i][0];
  return { 'منع دخول':'denied', 'غير موجود':'missing', 'يحتاج تصريح':'permit' }[r.access] || null;
}
/* تحدياتُ التركيب: الصيغُ القديمةُ الثابتةُ تُترجَم مباشرةً، و«أخرى» تُصنَّف من نصّها، وما لا يُقطع فيه يُعَدّ «يراجعه المهندس» */
var CHAL_FROM = { 'العارضة الحديدية ناقصة أو غير مكتملة':'beam', 'يوجد ديكور أو لافتات على العارضة':'beam', 'المدخل غير واضح — لم يُستدل عليه':'entry',
  'المدخل مشترك مع مخيم آخر':'multi', 'المسار أعرض من طقم واحد':'wide', 'عائق إنشائي':'block', 'المسار تحت كوبري':'block', 'المسار داخل نفق':'block',
  'تصميم المدخل لا يسمح بالتركيب':'block', 'ازدحام دائم يمنع العمل نهارًا':'block', 'لا يوجد مسار كابل':'block', 'ارتفاع صعب الوصول':'height', 'مبنى متعدد الأدوار (أبراج)':'height' };
var CHAL_RULES = [   /* (V37.0) رُتّبت بعد فحصها على السجلات الحقيقية: ٨٣٣ نقطةً بتحديات، وبقي للمراجعة نحوُ ١٧ نصًّا */
  ['legacy', /كاميرا (واحده )?متحرك|متحركه|قارئات لشرك|تركيبات قارئ/],
  ['wide',   /عرض|عرضها|واسع|كاميرتين|اتنين كاميرا|اتني كاميرا|عدد اتن/],
  ['multi',  /بوابات|بوابتين|مدخلين|مداخل|منفصل|مخيمين|مشترك|بوابه ممر|اكثر من بوابه|اكثر من مدخل|دراسه/],
  ['entry',  /مختلف|لم يستدل|استدلال|لا يوجد لوحه|شاخص|ملامح|سور|الخريطه|غير صحيح|الرقم|يستدل/],
  ['beam',   /شاسي|عارضه/],
  ['block',  /درج|كونتينر|حفر|صبات|مظله|انارات|عائق|مائل|ضيق|المطبخ|مغلق|مقفل/],
  ['mount',  /قائم|هيكل|عمود|عامود|لوح|سطح|تثبيت/]
];
var CHAL_NONE_RX = /يمكن التركيب عليها مباشره|دون الحاجه الي هيكل|دون هيكل|^\(? ?ربوه مني ?\)?$/;   /* ملاحظاتٌ لا تحديات: «يمكن التركيب مباشرة»، واسمُ الحيّ */
var CC_MEMO = (typeof WeakMap === 'function') ? new WeakMap() : null;   /* (V37.13) فئاتُ السجلّ تُحسَب مرةً لكلِّ سجلٍّ وإصدارِ إعدادات */
function chalCats(r){
  if (!r || r.deleted) return [];
  if (CC_MEMO){ var mm = CC_MEMO.get(r), ver = typeof CFG_VER === 'number' ? CFG_VER : 0; if (mm && mm.v === ver) return mm.c.slice(); var cc = chalCats0(r); CC_MEMO.set(r, { v:ver, c:cc }); return cc.slice(); }
  return chalCats0(r);
}
function chalCats0(r){
  if (Array.isArray(r.chalCats) && r.chalCats.length) return r.chalCats.slice();
  var out = [], add = function(k){ if (out.indexOf(k) < 0) out.push(k); };
  (Array.isArray(r.chals) ? r.chals : []).forEach(function(c){
    c = String(c || '').trim(); if (!c || c === 'لا توجد تحديات') return;
    var cd = ccList().filter(function(o){ return o.n === c || o.base === c; })[0]; if (cd){ add(cd.k); return; }
    if (/^لا يوجد سطح تثبيت/.test(c)){ add('mount'); return; }
    if (CHAL_FROM[c]){ add(CHAL_FROM[c]); return; }
    var nc = arKey(c); if (/^المدخل غير واضح/.test(nc)){ add('entry'); return; }
    if (/^اخري/.test(nc)){
      var txt = arKey(r.chal_note || r.chalNote || r.note || '');
      if (CHAL_NONE_RX.test(txt)) return;
      for (var i = 0; i < CHAL_RULES.length; i++) if (CHAL_RULES[i][1].test(txt)){ add(CHAL_RULES[i][0]); return; }
      add('review'); return;
    }
    add('review');
  });
  return out;
}
/* (V37.4) طلبُ المالك: «أقدر أغيّر وأعدّل المسميات والجهات اللي تحل» — الأصلُ في الشيفرة، وما يُعدَّل في الإعدادات (CFG.cats) يُدمَج
   بالمفتاح: يتغيّر الاسمُ أو الجهةُ أو صورةُ الإثبات، ويُعطَّل البندُ من قائمة الميدان، ويُضاف بندٌ جديد. المفتاحُ لا يتغيّر أبدًا،
   فالسجلّاتُ (r.why وr.chalCats) تبقى مقروءةً بأحدث اسم. */
if (!('cats' in CFG)) CFG.cats = null;
function catMerge(base, ov){
  var L = base.map(function(o){ return { k:o.k, n:o.n, who:o.who, photo:!!o.photo, base:o.n, sup:o.sup ? o.sup.slice() : null }; });
  (Array.isArray(ov) ? ov : []).forEach(function(o){
    if (!o || !o.k) return; var e = L.filter(function(x){ return x.k === o.k; })[0];
    if (e){ if (o.n) e.n = String(o.n); if (o.who != null && String(o.who) !== String(e.who)){ e.who = String(o.who); e.sup = null; } if (o.photo != null) e.photo = !!o.photo; e.off = !!o.off;
      if (Array.isArray(o.sup) && o.sup.length) e.sup = o.sup.map(function(x){ return { p:String(x.p || ''), s:String(x.s || '') }; }).filter(function(x){ return x.p; }); }   /* (V37.14) جهاتُ الدعم */
    else if (o.n) L.push({ k:String(o.k), n:String(o.n), who:String(o.who || ''), photo:!!o.photo, off:!!o.off, extra:true, sup:Array.isArray(o.sup) ? o.sup.map(function(x){ return { p:String(x.p || ''), s:String(x.s || '') }; }).filter(function(x){ return x.p; }) : null });
  });
  return L;
}
function catCached(name, base, ov){ var c = catCached[name]; if (c && c.ref === ov && c.v === CFG_VER) return c.L; var L = catMerge(base, ov); catCached[name] = { ref:ov, v:CFG_VER, L:L }; return L; }
function whyList(){ return catCached('why', VISIT_WHY, CFG.cats && CFG.cats.why); }
function ccList(){ return catCached('cc', CHAL_CATS, CFG.cats && CFG.cats.cc); }
/* (V37.14) طلبُ المالك: «جهة الحل خلّيها جهة الدعم المطلوب — ولما أضغط عليها: مين الجهة أو الجهات، وإيه نوع الدعم لكلِّ جهة».
   جهاتُ البند وما تُطالَب به كلٌّ منها؛ وإن لم تُحدَّد تُشتقّ من «جهة الحل» القديمة (الجهة — نوعُ الدعم). */
function supOf(o){
  if (!o) return [];
  if (Array.isArray(o.sup) && o.sup.length) return o.sup;
  var w = String(o.who || '').trim(); if (!w) return [];
  var i = w.indexOf(' — '); return [{ p:i > 0 ? w.slice(0, i).trim() : w, s:i > 0 ? w.slice(i + 3).trim() : '' }];
}
function supParties(o){ var seen = {}; return supOf(o).map(function(x){ return x.p; }).filter(function(p){ if (!p || seen[p]) return false; seen[p] = 1; return true; }).join('، '); }
function whyOf(k){ return whyList().filter(function(o){ return o.k === k; })[0] || null; }
function ccOf(k){ return ccList().filter(function(o){ return o.k === k; })[0] || null; }

/* ── (V37.1) الميدانُ يختار ولا يكتب: السببُ يحدّد «حالة الوصول» القديمة للتوافق، والتحدياتُ أسماءُ الفئات نفسُها ── */
var WHY_ACCESS = { closed:'منع دخول', denied:'منع دخول', permit:'يحتاج تصريح', missing:'غير موجود', other:'منع دخول' };
function chalNames(){ return ['لا توجد تحديات'].concat(ccList().filter(function(o){ return !o.off; }).map(function(o){ return o.n; })); }
/* تحدياتُ سجلٍّ قديمٍ (صيغٌ أو «أخرى» بنصّ) تُحوَّل إلى أسماء الفئات حين يُفتح للتعديل — فتُرى مختارةً ولا يضيع شيء */
function chalsToCats(chals, note){
  var L = Array.isArray(chals) ? chals : [], names = chalNames();
  if (L.every(function(c){ return names.indexOf(c) > -1; })) return L.slice();
  var ks = chalCats({ chals:L, chal_note:note, note:note }).filter(function(k){ return k !== 'review' && ccOf(k); });
  var out = ks.map(function(k){ return ccOf(k).n; });
  if (!out.length && L.indexOf('لا توجد تحديات') > -1) out.push('لا توجد تحديات');
  return out;
}
/* محاولاتُ الوصول وعمرُ التوقف: نقطةٌ لم تُمسح بعد ثلاث زياراتٍ أو عشرة أيامٍ تُصعَّد */
function stuckAge(r){ return r && svStuck(r) ? Math.floor((Date.now() - (+r.stuckSince || +r.at || Date.now())) / 864e5) : 0; }
function stuckEsc(r){ return !!(r && svStuck(r) && ((+r.tries || 1) >= 3 || stuckAge(r) >= 10)); }

/* ── (V37.3) بلاغُ المالك: «ملاحظات فنية متنوعة مش واضحة — تتشال ويتحط مكانها الحاجة الواضحة»، و«اللي زرته وما مسحتوش مفيش سبب» ──
   ما يُعرض للتحدي في كلِّ قائمةٍ وتقرير: اسمُ الفئة من الثماني؛ وما لم تقطع فيه القاعدة يُعرض نصُّه الأصليُّ كما كتبه الميدان (أوضحُ
   من اسمٍ عام)، أو «تحدٍّ بلا وصف — يراجعه المهندس» إن لم يُكتب شيء. وخانةُ القائمة تقول الحالة أوّلًا: لم تُزر، أو لم يُمسح وسببُه. */
function chalCatNames(r){
  var note = String((r && (r.chal_note || r.chalNote || r.note)) || '').replace(/\s+/g, ' ').trim();
  return chalCats(r).map(function(k){
    if (k !== 'review') return ccOf(k) ? t(ccOf(k).n) : k;
    return note ? (note.length > 70 ? note.slice(0, 70) + '…' : note) : t('تحدٍّ بلا وصف — يراجعه المهندس');
  });
}
function svStateText(r){
  if (!svVisited(r)) return t('لم تُزر بعد');
  if (svStuck(r)){ var w = visitWhy(r); return t('لم يُمسح') + ': ' + (w && whyOf(w) ? t(whyOf(w).n) : t('بلا سبب مسجّل — يصنّفه المهندس')); }
  var cc = chalCatNames(r), pre = r.review === 'revisit' ? t('تحتاج زيارة تقنية — أعادها المهندس') : '';
  return [pre, cc.length ? cc.join('، ') : (pre ? '' : t('لا توجد تحديات'))].filter(Boolean).join(' \u00b7 ');
}

/* ── (V37.7) بلاغُ المالك: «نقاطٌ كتير تبان الصور لم تصل للجهاز بعد — هل الصورُ موجودةٌ في الدرايف؟» ──
   التحقّق: ٣٬٧٢٠ وثيقةَ صورة في القاعدة (٣٬٦٩٦ بمعرّف درايف)، والجهازُ في سحبته الأولى يحمل أحدثَ ١٬٥٠٠ وحدَها — فالأقدمُ على
   الدرايف ولا يعرفها الجهاز. فتُجلَب وثائقُ نقطةٍ بعينها حين تُفتَح (استعلامٌ واحدٌ بالموقع)، ويُقال الصدقُ إن لم تكن في القاعدة:
   «لم تُرفع من جهاز فلان». */
var PH_FETCH = {};   /* موقع ← 'run' | 'done' | 'none' | 'err' */
function photosFetchSite(siteId){
  if (!siteId || PH_FETCH[siteId] === 'run' || PH_FETCH[siteId] === 'done' || PH_FETCH[siteId] === 'none') return;
  if (!(typeof FB === 'object' && FB.ready && FB.db && typeof DB === 'object')){ PH_FETCH[siteId] = 'err'; return; }
  PH_FETCH[siteId] = 'run';
  DB.col('photos').where('site', '==', siteId).limit(40).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size; STATE.photos = STATE.photos || {};
    sn.forEach(function(d){ STATE.photos[d.id] = photoSlim(Object.assign({}, STATE.photos[d.id] || {}, d.data())); }); if (sn.size) PH_DIRTY = true;   /* (V37.18) */
    PH_FETCH[siteId] = sn.size ? 'done' : 'none'; if (typeof render === 'function') render(1);
  }).catch(function(e){ PH_FETCH[siteId] = 'err'; LS_ERR = e; if (typeof render === 'function') render(1); });
}
/* سطرُ الحالة حين لا تُعرف صورُ النقطة على هذا الجهاز — يطلب جلبَها ويقول ما يعرف */
function photosMissingLine(siteId, rec){
  var n = (rec && Array.isArray(rec.photos) ? rec.photos.length : 0) || (rec && +rec.phN) || 0; if (!n) return '';
  var st = PH_FETCH[siteId]; if (!st) { photosFetchSite(siteId); st = PH_FETCH[siteId]; }
  var msg = st === 'run' ? t('جارٍ جلبُها من القاعدة…')
    : st === 'none' ? t('لم تُرفع من جهاز') + ' ' + dispName(rec.by || '') + ' ' + t('بعد — تبقى في طابوره حتى يفتح التطبيق على الشبكة')
    : st === 'err' ? t('تعذّر الجلبُ الآن — أعد المحاولة على الشبكة') : t('لم تصل هذا الجهاز بعد');
  return '\u{1F4F7} ' + t('الصور') + ': ' + nm(n) + ' \u00b7 ' + msg;
}

/* ── (V37.8) اقتراحا المالك بعد تدقيق الصور: قائمةٌ للمهندس بما ليس على الدرايف، وتنبيهُ الفنيِّ بصورٍ معلّقةٍ أكثرَ من ساعة ──
   جهازُ المكتب (مشرفٌ فما فوق) يجلب وثائقَ الصور كلَّها مرةً في الأسبوع على صفحاتٍ من ألف — فيُعرَف بدقةٍ ما على الدرايف لكلِّ نقطة
   (٣٬٧٢٠ وثيقةً اليوم، والسحبةُ العاديةُ أحدثُ ١٬٥٠٠). والقائمةُ تُحسَب منها وتتحدّث مع كلِّ رفعٍ جديد. */
function phExpected(r){ return r ? Math.max(+r.phN || 0, Array.isArray(r.photos) ? r.photos.length : 0) : 0; }
function phOnDrive(id){ return photosOf(id).filter(function(p){ return !p[1].del && (p[1].driveId || p[1].link); }).length; }
function phGap(r, id){ if (!svVisited(r)) return 0; var n = phExpected(r); return n ? Math.max(0, n - phOnDrive(id)) : 0; }
function photosBackfill(force){
  if (!(typeof FB === 'object' && FB.ready && FB.db && typeof DB === 'object' && DB.col)) return Promise.resolve(0);
  if (!(typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('supervisor'))) return Promise.resolve(0);
  if (!force && STATE.meta.phFull && Date.now() - STATE.meta.phFull < 7 * 864e5) return Promise.resolve(0);
  if (photosBackfill.run) return photosBackfill.run;
  var n = 0, last = null;
  var step = function(){
    var q = DB.col('photos').orderBy('_at').limit(1000); if (last != null) q = q.startAfter(last);
    return q.get().then(function(sn){
      FB.readCount = (FB.readCount || 0) + sn.size; STATE.photos = STATE.photos || {};
      sn.forEach(function(d){ var x = d.data() || {}; STATE.photos[d.id] = photoSlim(Object.assign({}, STATE.photos[d.id] || {}, x)); if (x._at != null) last = x._at; n++; }); if (sn.size) PH_DIRTY = true;   /* (V37.18) */
      if (sn.size === 1000 && last != null) return step();
      STATE.meta.phFull = Date.now(); if (CORE.saveSoon) CORE.saveSoon(); photosBackfill.run = null;
      if (typeof statBump === 'function') statBump(); if (typeof render === 'function') render(1); return n;
    });
  };
  photosBackfill.run = step().catch(function(e){ photosBackfill.run = null; LS_ERR = e; return 0; });
  return photosBackfill.run;
}
/* أقدمُ صورةٍ معلّقةٍ على هذا الجهاز — بالدقائق */
function phQueueAge(){ var Q = (typeof PHOTO_Q === 'object' && PHOTO_Q) || []; if (!Q.length) return 0; var old = Q.reduce(function(m, it){ return Math.min(m, +it.at || Date.now()); }, Date.now()); return Math.floor((Date.now() - old) / 60000); }

/* ── (V37.15) تعريفُ المالك للزيارة التقنية: «الزيارات التقنية للنقاط اللي تحت كوبري أو في بدايات أنفاق، أو النقاط اللي ملهاش
   سطح تثبيت في الممرات فقط حتى الآن — لأن المخيمات وضعها مختلف». وما زير ولم يُستكمل (مغلقٌ أو بلا تصريح…) «تحتاج زيارة أخرى».
   تُحسَب لما مُسح ولم يُركَّب: ممرٌّ في فئة «لا يوجد سطح تثبيت»، أو نصُّ تحدّيه أو ملاحظتُه يذكر كوبري أو جسرًا أو نفقًا. */
/* «تحت كوبري» أو «داخل نفق» من اختيار الفني أو ملاحظته — لا من اسم فئة «عائق في الموقع (… نفق أو كوبري)» نفسِه، ولا «على الجسر» */
var TECH_BT_RX = /تحت (ال)?(جسر|كوبري|كبري)|كوبري|كبري|نفق|انفاق/;
function techVisit(x, r){
  if (!x || !r || r.deleted || !svDone(r)) return false;
  if (typeof insDone === 'function' && insDone(x.id)) return false;
  var cc = chalCats(r);
  if (x.type === 'ممر' && cc.indexOf('mount') > -1) return true;
  var nm0 = {}; ccList().forEach(function(o){ nm0[o.n] = 1; if (o.base) nm0[o.base] = 1; });
  var parts = (Array.isArray(r.chals) ? r.chals : []).filter(function(c){ return !nm0[c]; });
  return TECH_BT_RX.test(arKey(parts.concat([r.note || '', r.chal_note || '']).join(' ')));
}

/* ── (V37.18) الذاكرةُ على الموبايل: وثيقةُ صورةٍ واردةٌ لا تحمل خامًا أبدًا — الخامُ في الطابور المحليِّ لمن التقطها، وعلى الدرايف لمن سواه */
function photoSlim(x){ if (x && typeof x.data === 'string' && x.data.length > 500){ x = Object.assign({}, x); delete x.data; } return x; }
/* دورُ الميدان لا يسحب فهرسَ الصور (أحدثُ ١٬٥٠٠ = ٩٫٤ م.ب): صورُه في طابوره، وأيُّ نقطةٍ تُفتَح تُجلَب صورُها حينَها */
function photosPullAllowed(){ return !LITE && typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('supervisor'); }
var PH_DIRTY = false;   /* الصورُ تُحفَظ محليًّا وحدَها، وحين تتغيّر فقط */

/* ── (V37.18) الخطوةُ ٤ · حارسُ الانهيار: إقلاعان متتابعان لم يبلغا الاستقرار (٤٥ ثانية) خلال عشر دقائق ← الوضعُ الخفيف ──
   آيفون يقتل الصفحةَ بلا إنذار («حدثت مشكلة بشكل متكرر») حين تضيق الذاكرة. يُعَدّ الإقلاعُ عند بدئه ويُصفَّر حين يستقرّ؛ فإن تكرّر
   السقوطُ قبل الاستقرار عمل التطبيقُ بلا خريطةٍ مجسَّمة ولا فهرسِ صور، وقال ذلك في شريطٍ فيه زرُّ العودة. */
var LITE = (typeof BOOT_GUARD === 'object' && BOOT_GUARD && BOOT_GUARD.crashes >= 2);   /* من حارس الإقلاع القائم (V34.2) — إقلاعان ماتا قبل الاستقرار */
function liteOff(){ LITE = false; try { bootOk('full'); } catch (e){ LS_ERR = e; } toast(t('عاد الوضعُ الكامل')); try { location.reload(); } catch (e2){ LS_ERR = e2; } }
/* ── الخطوةُ ٥ · إعادةُ ضبط التطبيق على هذا الجهاز: تُرفَع البياناتُ أوّلًا، ثم يُمحى الكاشُ والمخزنُ ويُعاد التحميلُ نظيفًا ──
   بديلُ «امسح بياناتِ المتصفح من إعدادات آيفون» الذي كان يفعله الفنيّون. لا يمسّ السحابةَ ولا يُسقط عملًا لم يُرفَع. */
function appResetGo(){
  var q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length, pq = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0;
  if (q || pq){
    if (!STATE.meta.online){ toast(t('افتح الشبكة أولًا — على الجهاز') + ' ' + nm(q) + ' ' + t('كتابة و') + nm(pq) + ' ' + t('صورة لم تُرفع')); return false; }
    toast(t('يُرفَع ما على الجهاز أولًا…')); try { if (typeof photoFlush === 'function') photoFlush(); if (CORE.flush) CORE.flush(); } catch (e){ LS_ERR = e; }
    setTimeout(function(){ var q2 = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length, p2 = (PHOTO_Q || []).length; if (q2 || p2) toast(t('لم يُرفَع كلُّ شيء بعد — أعد المحاولة بعد قليل')); else appResetGo(); }, 6000);
    return false;
  }
  if (!window.confirm(t('إعادةُ ضبط التطبيق على هذا الجهاز: يُمحى الكاشُ والمخزنُ المحليُّ ويُعاد التحميلُ نظيفًا. لا يمسّ السحابة. متأكد؟'))) return false;
  var dev = lsGet('nsk14.dev'), done = function(){ try { if (dev) lsSet('nsk14.dev', dev); } catch (e){ LS_ERR = e; } try { location.reload(); } catch (e2){ LS_ERR = e2; } };
  Promise.resolve()
    .then(function(){ return (typeof caches === 'object' && caches.keys) ? caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }) : null; })
    .then(function(){ return (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ? navigator.serviceWorker.getRegistrations().then(function(rs){ return Promise.all(rs.map(function(r){ return r.unregister(); })); }) : null; })
    .then(function(){ return new Promise(function(res){ try { var rq = indexedDB.deleteDatabase(IDB_NAME); rq.onsuccess = rq.onerror = rq.onblocked = function(){ res(); }; setTimeout(res, 4000); } catch (e){ LS_ERR = e; res(); } }); })
    .then(function(){ try { localStorage.clear(); } catch (e){ LS_ERR = e; } done(); })
    .catch(function(e){ LS_ERR = e; done(); });
  return true;
}
