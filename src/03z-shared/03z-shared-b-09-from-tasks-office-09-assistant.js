/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-09-from-tasks-office-09-assistant.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-09-assistant.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ASSIST_OPEN, ASSIST_Q, GLOSSARY, glossaryHits, HELP_KEYWORDS, HELP_STEPS, helpIndexAll, helpSearch, assistHtml, QUEUE_OPEN, Q_LBL, ASSIST_INTENTS, assistIntent, assistFixHtml … (+9 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ المساعدُ: بحثٌ محليٌّ صرف — بلا API ولا اتصالٍ خارجي ═══
   مئةٌ وصفحةٌ لا يحفظها أحدٌ عن ظهر قلب. يكتب المستخدمُ سؤالَه بكلماته،
   فيُطابَق ضدَّ فهرسٍ مبنيٍّ من عنوان كل صفحةٍ ووصفها (المكتوبَين أصلًا)
   زائدًا كلماتٍ مرادفةً مكتوبةً يدًا للصفحات الأكثر سؤالًا — وتُقاس
   بنفس أدوات بحث الموقع والقائمة (arNorm/subseq) لا بمنطقٍ جديد. ولا
   تُقترَح صفحةٌ لا يراها دورُ صاحب السؤال، فلا يُرسَل مشرفٌ لصفحة مهندس. */

var ASSIST_OPEN = false;

var ASSIST_Q = '';

/* ═══ المسرد (V33.2) — طلبُ المالك: «المساعدُ والدليلُ محدَّثان بكلِّ حاجة» ═══
   مصدرٌ واحدٌ للمصطلحات: يقرؤه المساعدُ (سؤالٌ فيه المصطلحُ أو مرادفُه يُجاب بتعريفه أوّلًا)، ومولِّدُ أدلة الأدوار، ومولِّدُ دليل
   المستخدم — فمصطلحٌ يتغيّر هنا يتغيّر في الثلاثة، وجردُ الأدلة يرفض نسخةً يغيب عنها مصطلح. */
var GLOSSARY = [
  { t:'تمت الزيارة', d:'كلُّ نقطةٍ زارها الميدانُ بأيِّ نتيجة — وُصل إليها أو لم يُوصَل. هي رقمُ التقدّم في كلِّ الشاشات والتقارير وملفات الوزارة، والمتبقي ما لم يُزَر أصلًا.', k:['زيرت','مسح','تم المسح','نسبة المسح','نسبة الزيارة','المتبقي'] },
  { t:'تم الوصول', d:'زيارةٌ وصل فيها الفريقُ إلى النقطة وأكمل نموذجَها. تقسيمٌ داخل «تمت الزيارة» في شاشة المسح.', k:['وصلنا','وصل اليها'] },
  { t:'تحتاج زيارة أخرى', d:'نقطةٌ تمت زيارتُها ولم يُستكمَل مسحُها (لم يُوصَل إليها أو رُدَّت لزيارةٍ أخرى). تظهر هكذا للوزارة؛ وسببُها التفصيليُّ في سجلّ النقطة لسير العمل.', k:['متعذر','متعذر الوصول','تعذر الوصول','تصريح','منع دخول','زيارة اخرى','اعادة زيارة','لم يصل'] },
  { t:'بدون عوائق', d:'تمت الزيارة وتم الوصول ولا تحدّيَ مسجّلًا — الأخضر في شاشة القاعة وبطاقة «نقاط بلا عوائق».', k:['بلا عوائق','بلا عائق','مخيمات بلا عائق','نقاط بلا عوائق','سليمة'] },
  { t:'بعوائق', d:'ما تمت زيارتُه وفيه تحدٍّ أو تحتاج زيارةً أخرى تقنيًا — الأحمر في شاشة القاعة وبطاقة «نقاط بعوائق». بدون عوائق + بعوائق = تمت الزيارة.', k:['عوائق','معوقات','تحديات','نقاط ذات تحديات','عائق'] },
  { t:'شاشة القاعة', d:'عرضٌ كبيرٌ للاجتماعات يتجدّد كلَّ دقيقة: نسبةُ الزيارة والتركيب، والمشاعر، والنقاطُ بعوائق وبدونها للإجمالي ولكلِّ نوع. من «متابعة الوزارة» ← «شاشة القاعة» ← «عرضٌ كامل».', k:['القاعة','العرض الكامل','الاجتماع','kiosk'] },
  { t:'رقم الشاخص', d:'المعرّفُ الأوّلُ لكلِّ مخيمٍ في منى وعرفات: رقمُ المخيم/رقمُ الشارع — مثل 25/56 = المخيمُ ٢٥ في الشارع ٥٦. يظهر أوّلًا في كلِّ نافذةٍ وجدولٍ وتصدير، ومعرّفُ النظام (NSK-…) تحته ثانيًا، وكلاهما يُبحَث به. وقد يكون في المخيم الواحد أكثرُ من شركة، فيظهر الشاخصُ نفسُه بسطرٍ لكلِّ شركةٍ واسمُها تحته.', k:['الشاخص','شاخص','رقم المخيم','اسم المخيم','25/56','اكثر من شركة'] },
  { t:'اسم الممر في ١٤٤٧', d:'المعرّفُ الأوّلُ للممرات المركّبة في الموسم الماضي — اسمُها المعروف مثل Path-Shaded-3R. والممراتُ الجديدةُ معرّفُها الأوّلُ المقترح (NSK-MIN-RDR-…) حتى تُسمّى.', k:['ممر','ممرات','path','Path-Shaded'] },
  { t:'حذف نقطة', d:'للمهندس فما فوق: افتح النقطةَ على الخريطة ثم «🗑 حذف النقطة» وأكّد — أو من «تعديل بيانات النقطة» في تفاصيلها. تُحذَف ولو تمت زيارتُها: تختفي من كلِّ الأرقام وتبقى سجلّاتُها، وتُستعاد من «نقاطٌ مخفية» أسفل قائمة المواقع. أما ما رُكّب أو سُلّم أو فُكّ فلا يُحذَف (قرارُ المالك) ويظهر عليه قفل.', k:['حذف','احذف','امسح النقطة','شيل نقطة','شيل النقطة','الغاء نقطة','اخفاء نقطة','نقطة مكررة','حذف موقع'] },
  { t:'الحفظ المحلي', d:'كلُّ ما تُدخله يُحفَظ على جهازك فورًا ويُرفَع حين تتوفر الشبكة. إن ظهرت لافتةٌ حمراء «الحفظ المحلي لا يعمل» فزامِن الآن ولا تُغلق التطبيقَ حتى يُرفَع عملُك — والتطبيقُ يعيد فتحَ المخزن وحدَه.', k:['المزامنة','لم يرفع','الطابور','الحفظ','ايفون','بدون نت','اوفلاين'] }
];

function glossaryHits(q){
  var n = arNorm(String(q || '')); if (!n || n.length < 3) return [];   /* (V37.40) بلاغُ المالك: حرفٌ واحدٌ كان يعرض كلَّ المصطلحات */
  return GLOSSARY.filter(function(g){ return [g.t].concat(g.k || []).some(function(w){ var a = arNorm(w); return a && (n.indexOf(a) > -1 || (n.length >= 4 && a.indexOf(n) === 0)); }); }).slice(0, 3);
}

/* كلماتٌ يكتبها الناسُ ولا تظهر في عنوان الصفحة أو وصفها حرفيًّا */
var HELP_KEYWORDS = {
  mfu:       ['ملخص الوزارة','بطاقات الملخص','نسبة المسح','نقاط بلا عوائق','نقاط بعوائق','تصدير اسبوعي','تقرير الاجتماع','باوربوينت الوزارة'],
  kiosk:     ['شاشة القاعة','عرض كامل','الاجتماع','بعوائق وبدونها','العرض الكبير'],
  crewman:   ['اضافة فني','فني جديد','موظف جديد','اضافة موظف','عمل فريق','فريق جديد','حذف فني','تعديل فريق','نسب الفريق','الانصبة'],
  users:     ['انشاء حساب فني','حساب دخول','يوزر وباسورد','كلمة مرور فني','انشاء مستخدم','حساب جديد','صلاحيات المستخدم','تعطيل حساب'],
  assign:    ['اسناد نقاط','توزيع نقاط','ارسال فريق','اسناد فني','اسناد تركيب','اسناد فك','اسناد زيارة'],
  req:       ['طلب زيارة','SR','رقم الطلب','اعتماد زيارة'],
  solution:  ['اعتماد الحل','IR','DR','اجهزة التركيب','اقتراح اجهزة','ايه اللي هيترکب'],
  qa:        ['اعتماد تركيب','تدقيق','رفض تركيب','مراجعة السيريال'],
  survey:    ['نموذج المسح','بيانات الزيارة','تسجيل زيارة','visits list','visit list','completed visits','export visits','reopen point','الزيارات اللى تمت','الزيارات المكتملة','اكسبورت الزيارات','تصدير الزيارات','النقاط اللى اتزارت','اعادة زيارة','ارجاع نقطة متعذرة'],
  svForm:    ['فورم المسح','املأ نموذج المسح'],
  insForm:   ['فورم التركيب','تسجيل تركيب','ابلغ عن تركيب'],
  disp2:     ['فك جهاز','ارجاع عهدة','فك تركيب'],
  assignRole:['اسناد دور','تغيير صلاحية','ترقية مشرف'],
  roles:     ['الادوار','مين يشوف ايه','صلاحيات كل دور'],
  vehkind:   ['نوع سيارة جديد','انواع العربيات'],
  fleet:     ['العربيات','السيارات','الاسطول'],
  fleetAsn:  ['اسناد سيارة','تسليم عربية','عهدة سيارة'],
  fleetLog:  ['سجل السيارة','مين اخد العربية'],
  fleetCost: ['تكلفة السيارات','مصاريف الاسطول'],
  buys:      ['مشتريات','فاتورة','طلب شراء','تسجيل مشترى'],
  sup:       ['الموردين','اضافة مورد'],
  items:     ['الكتالوج','اسعار القطع','اضافة صنف','تعديل سعر'],
  wos:       ['طلب مستودع','صرف قطع','استلام من المخزن'],
  invb:      ['رصيد المخزون','كام قطعة فاضلة'],
  invmv:     ['حركة المخزون','دخول وخروج المخزن'],
  stock:     ['عهدة الاجهزة','مين معاه ايه'],
  ships:     ['شحنة','توريد','تأخير شحنة'],
  drive:     ['رفع صورة','تخزين الصور','مساحة درايف'],
  notif:     ['الاشعارات','تنبيهات'],
  exp:       ['تصدير اكسيل','استيراد ملف','رفع ملف'],
  guide:     ['طريقة الاستخدام','شرح التطبيق'],
  ncr:       ['عدم مطابقة','مشكلة جودة'],
  hse:       ['حادث','سلامة','بلاغ حادثة'],
  budget:    ['الميزانية','حد الاعتماد المالي'],
  consts:    ['ثوابت النظام','ساعات العمل','ايام الاسبوع'],
  retain:    ['حذف بيانات قديمة','مدة الاحتفاظ'],
  wipe:      ['تصفير كل البيانات','مسح شامل'],
  sync:      ['تعارض بيانات','مزامنة يدوية'],
  ev:        ['سجل الاحداث','لوج','سجل التدقيق','مين عدل ايه'],
  budm:      ['المستخلص','الملخص المالي'],
  chalm:     ['تحدي ميداني','عائق في الموقع','افادات الميدان','المعوقات','التحديات','نقاط التحدي','فلتر المشعر','فلتر النوع','العوائق'],   /* (V26.9) الإفاداتُ ومتابعةُ التحديات صفحةٌ واحدة */
  stuck:     ['نقاط متعثرة','راكد'],
  tfwdraw:   ['رسم المسار','مسار التفويج','ارسم على الخريطة','الذهاب والعودة','مسار الدور','رسم مسارات الجمرات'],
  mobs:      ['جهة معالجة','اضافة جهة','اضافة جهة معالجة','جهة اخرى','جهات المعالجة','المعوقات','التحديات','العوائق','عائق','وصف المعالجة','اخر تاريخ','مهمة معالجة','تصدير نقاط التحديات','فلتر المشعر','فلتر النوع','نقاط التحدي']   /* (V26.7) الصفحةُ المدمجة كانت بلا كلمات فوجد المساعدُ «الفرق» بدلها */
};

/* خطواتٌ مكتوبةٌ يدًا لأكثر المسارات تشابكًا — لا لكل صفحة، فالوصفُ
   المختصر يكفي غالبَها */
var HELP_STEPS = {
  mfu:   ['افتح «المتابعة» ← «متابعة الوزارة» — شريحة «الملخص» أوّلًا',
          'في الرأس «موجز الموسم»: اليومُ وأقربُ معلَم، والحلقاتُ الأربع (تُضغَط)، ومسارُ العمل الميداني لآخر ١٤ يومًا مع توقّع الاكتمال، وأبرزُ التحديات',
          'البطاقاتُ فوق تبدأ بـ«نسبة المسح» (تمت الزيارة من الكل)، ثم «نقاط بلا عوائق» و«نقاط بعوائق» والمعوقات والتركيب والشركات',
          'اضغط أيَّ بطاقة: تفتح قائمتَها بالتفاصيل وفيها زرُّ «تصدير إكسل»',
          'لتقرير الاجتماع: «تصدير التحديث الأسبوعي» فوق — باوربوينت أو وورد أو إكسل أو PDF، لكلِّ النقاط أو بمشعرٍ ونوع أو بالمحدَّد على الخريطة'],
  kiosk: ['افتح «متابعة الوزارة» ← شريحة «شاشةُ القاعة»',
          'اضغط «عرضٌ كامل» — تملأ الشاشةَ وتتنقّل بين الأقسام وحدها وتتجدّد كلَّ دقيقة',
          'فوق أربعُ حلقات: المسح والتركيب والتسليم والفك — الأخضرُ ما أُنجز والأحمرُ ما بقي؛ اضغط الحلقةَ لقائمة المنجز، و«متبقٍّ» تحتها لقائمة المتبقي',
          'بطاقاتُ «النقاط بعوائق وبدونها» تحت الحلقات مباشرةً: الإجماليُّ أوّلًا ثم بطاقةٌ لكلِّ نوعٍ من المخيمات إلى الزايدي',
          'اضغط أيَّ رقم — الأخضرَ (بدون عوائق) أو الأحمرَ (بعوائق) — تفتح قائمةُ نقاطه بتفاصيلها وزرِّ «تصدير إكسل»',
          'للخروج: «خروج من العرض»'],
  mobs: ['افتح «المتابعة» ← «متابعة الوزارة» ← شريحة «التحديات والمعوقات»',
         'فوق: فلتر المشعر ثم النوع — والبطاقات والجدول بيتغيروا معاه',
         'لإضافة جهة معالجة جديدة: انزل تحت جدول الفئات لحقل «جهةٌ أخرى» (للمكتب)، اكتب الاسم واضغط «أضف جهة» — بتظهر في قوائم الجهات والتصدير على كل الأجهزة، وتُحذف من نفس المكان',
         'لكل تحدي في السجل تحت: «✎» للتعديل ← المسؤول وآلية المعالجة ووصفها وآخر تاريخ ← «مهمة معالجة» تنشئ المهمة الأسبوعية بيهم',
         'سهم «النقاط» تحت كل تحدي يفتح نقاطه بالفلتر، وزر «تصدير نقاط التحديات» يطلّع إكسل بالفلتر أو بالكل'],
  crewman: ['افتح «الفرق» من القائمة الجانبية',
            'اختر الفريقَ من الأزرار فوق، أو اضغط «إضافة فريق» لو مفيش فريق مناسب',
            'انزل لكارت «إضافة موظف» واكتب الاسم والجوال والمشرف',
            'اضغط «➕ إضافة موظف» — بينضم لفريقه على طول بلا اختيار من قائمة'],
  solution: ['امسح النقطة الأول من «المسح الميداني» — لازم تبقى «تمت الزيارة»',
             'افتح «حل التركيب»، اختر النقطة من القائمة',
             'حدّد كمية كل جهاز من الكتالوج هيتركب في النقطة دي',
             'اضغط «➕ اقترح الحل» — هيبقى بانتظار المهندس',
             'المهندس يفتح نفس الصفحة ويضغط «اعتمد» أو «ردّ»'],
  assign: ['من «حل التركيب»، لازم يبقى فيه حل معتمد للنقطة لو النوع تركيب',
           'افتح «توزيع الفرق» واضغط «حدّد من الخريطة» أو اختر من القائمة',
           'اختر النقاط، ثم اختر «لفني» أو «لفريق»',
           'لو فريق: اختر الفريق وطريقة التوزيع (بالنسب أو بالتساوي)',
           'اضغط «وزّع» — هيتولّد رقم الطلب (SR/DR/PR) تلقائيًا'],
  survey: ['افتح «المسح الميداني» من «الطلبات والمسح»',
            'الرقمُ «تمت الزيارة» فوق هو كلُّ ما زير؛ واضغط شريحة «تم الوصول» لتتفرّز الزيارات المكتملة وحدها، أو «تحتاج زيارة أخرى» لما يحتاج عودة',
            'للتصدير: زر «⬇ إكسل — المسح» جنب مربّع البحث',
            'لإرجاع نقطة: زر «أعِد تصنيفها كمتعذّرة» في صفّها، واختر السبب'],
  users: ['افتح «المستخدمون»',
            'اكتب اسم المستخدم والاسم الكامل وكلمة المرور واختر الدور',
            'اضغط «إنشاء الحساب»',
            'سلّم اسم المستخدم وكلمة المرور لصاحبه — يبدّلها هو أول دخول']
};

function helpIndexAll(){
  /* شاشاتُ الميدان مصدرٌ ثانٍ للصفحات — كانت خارجَ الفهرس فلا يجدها
     المساعدُ وإن ملكها السائل. */
  /* شرائحُ الصفحات المدموجة تُفهرَس كلُّ واحدةٍ باسمها — من بحث عن
     «سجل عهدة السيارات» يجدها وإن صارت شريحةً داخل «السيارات» */
  return pageIds().map(pageMeta).filter(function(p){ return p && p.t; });
}

function helpSearch(q, minScore){   /* (V37.37) minScore: المساعدُ لا يعرض إلا الوثيق */
  q = arNorm(q);
  if (!q) return [];
  var toks = q.split(' ').filter(Boolean);
  var out = [];
  helpIndexAll().forEach(function(e){
    if (!seesPage(e.id)) return;
    var kw = (HELP_KEYWORDS[e.id] || []).join(' ');
    /* كان الفهرسُ عربيًّا صرفًا، فمن بحث بالإنجليزية لم يجد شيئًا وإن كانت
       الشاشةُ أمامه مترجَمةً بالاسم الذي كتبه. فصار يفهرس الأصلَ وترجمتَه
       معًا — يبحث المرءُ باللغة التي يقرأ بها، وبالعربية إن عرفها. */
    /* t() تُترجم في الواجهة الإنجليزية وحدَها — فمن بحث بالإنجليزية والواجهةُ
       عربيةٌ لم يجد شيئًا. يُفهرَس القاموسُ الإنجليزيُّ نفسُه أيًّا كانت اللغة. */
    var EN = D.en || {};
    var hay = arNorm(e.t + ' ' + e.m + ' ' + e.l + ' ' + kw + ' '
                     + (EN[e.t] || '') + ' ' + (EN[e.m] || '') + ' ' + (EN[e.l] || ''));
    /* العنوانُ أدلُّ من الوصف: من كتب «visits» يريد الشاشةَ التي اسمُها
       ذلك، لا كلَّ شاشةٍ ذُكرت فيها الكلمةُ في سطر شرحها. فيُوزَن العنوانُ
       أثقلَ، ويُتجاهَل حروفُ الجرِّ التي لا تدلُّ على شيء. */
    var ttl = arNorm(e.t + ' ' + (EN[e.t] || '') + ' ' + kw);
    var STOP = { 'for':1, 'the':1, 'of':1, 'and':1, 'in':1, 'to':1, 'a':1, 'my':1,
      'مش':1, 'في':1, 'من':1, 'على':1, 'علي':1, 'عن':1, 'لا':1, 'ما':1, 'ده':1, 'دي':1, 'اللي':1, 'عاوز':1, 'عايز':1, 'ازاي':1, 'إزاي':1, 'ليه':1, 'هو':1, 'هي':1, 'انا':1, 'أنا':1,
      'اريد':1, 'أريد':1, 'كيف':1, 'مع':1, 'او':1, 'أو':1, 'عندي':1, 'بس':1, 'خالص':1, 'لسه':1, 'كده':1, 'جديد':1, 'جديده':1, 'مشكله':1, 'مشكلة':1, 'غريبه':1, 'غريبة':1, 'فاهم':1, 'فاهمها':1, 'حاجه':1, 'حاجة':1 };   /* (V37.37) حشوٌ عربيٌّ وعاميّ */
    var real = toks.filter(function(tok){ return !STOP[tok] && tok.length > 2; });   /* (V37.37) «مش» كانت تطابق «المشروع» */
    var score = 0;
    if (ttl.indexOf(q) > -1) score += 40;
    if (hay.indexOf(q) > -1) score += 10;
    real.forEach(function(tok){
      if (ttl.indexOf(tok) > -1) score += 12;
      else if (hay.indexOf(tok) > -1) score += 3;
    });
    if (!score && subseq(hay, q)) score = 1;
    if (score) out.push({ e:e, score:score });
  });
  out.sort(function(a,b){ return b.score - a.score; });
  if (minScore) out = out.filter(function(x){ return x.score >= minScore; });   /* (V37.37) */
  return out.slice(0, minScore ? 3 : 6).map(function(x){ return x.e; });
}

function assistHtml(){
  var results = ASSIST_Q ? helpSearch(ASSIST_Q) : [];   /* (V33.2) المصطلحُ أوّلًا */
  return '<div class="pop" id="assistPop" style="width:min(560px,94vw);max-height:min(88vh, calc(var(--vh,1vh) * 100 - 16px));overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">\u{1F9ED} ' + esc(t('المساعد')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'
    +     esc(t('اسأل عن أي شيء تريد فعله، ونرشدك إلى مكانه وخطواته.')) + '</p></div>'
    +   '<div style="display:flex;gap:6px;align-items:center;flex:0 0 auto">'   /* (V37.40) بلاغُ المالك: رجوعٌ وإغلاقٌ واضحان */
    +     '<button type="button" class="btn btn-secondary btn-sm" id="assistBack" data-assistback="1"' + (ASSIST_Q ? '' : ' hidden') + '>\u2192 ' + esc(t('رجوع')) + '</button>'
    +     '<button type="button" class="btn btn-secondary btn-sm" data-assist="0" aria-label="' + esc(t('إغلاق')) + '">\u2715 ' + esc(t('إغلاق')) + '</button>'
    +   '</div>'
    + '</div>'
    + '<div class="pop-body">'
    + '<input type="search" id="assistQ" value="' + esc(ASSIST_Q) + '" placeholder="'
    +   esc(t('مثلا: أريد إضافة فني جديد')) + '" dir="auto" style="width:100%;margin:0 0 12px">'
    + '<div id="assistRes">' + assistResHtml() + '</div>'   /* (V36.1) النتائجُ وحدَها تُستبدَل مع الكتابة */
    + '</div></div>';
}

/* ═══ نافذةُ ما ينتظر الرفع ═══ */
var QUEUE_OPEN = false;

var Q_LBL = { recs:'مسح', inss:'تركيب', diss:'فك', tasks:'إسناد', moves:'حركة مخزون',
              buys:'مشترى', cfg:'إعداد', sites:'موقع', photos:'صورة', ships:'شحنة',
              teams:'فريق', evlog:'حدث', notifs:'إشعار', accounts:'حساب',
              bonus:'نقاط زيادة', workReqs:'طلب ورشة', users:'مستخدم' };

var ASSIST_INTENTS = [
  { k:'photos', rx:/صور|صوره|رفع|اترفع|ترفع|الدرايف|photo|upload/i, t:'الصور لا تُرفع أو لا تظهر' },
  { k:'slow',   rx:/بطي|بطيء|بطيئ|تقيل|تهنيج|هنج|يهنج|بيقع|وقع|يقفل|كاش|الذاكرة|slow|crash|cache/i, t:'التطبيق بطيء أو يقع' },
  { k:'sync',   rx:/مزامن|يزامن|الطابور|ما اتحفظ|مش بيحفظ|ماتحفظش|ضاع|ضاعت|اتمسح|sync|save/i, t:'بيانات لم تُرفع أو لم تُحفظ' },
  { k:'update', rx:/نسخة|تحديث|اصدار|إصدار|قديم|version|update/i, t:'النسخة والتحديث' },
  { k:'login',  rx:/دخول|باسورد|كلمة المرور|كلمة السر|password|login/i, t:'الدخول وكلمة المرور' },
  { k:'gps',    rx:/مكاني|موقعي|gps|جي بي اس|الاحداثيات|الإحداثيات|location/i, t:'موقعي على الخريطة' },
  { k:'map',    rx:/الخريطة|خريطه|map|النقط مش ظاهر|العلامات/i, t:'الخريطة' }
];

function assistIntent(q){ q = String(q || ''); var hits = ASSIST_INTENTS.filter(function(i){ return i.rx.test(q); }); return hits.length ? hits : null; }

function assistFixHtml(kind, d){
  var row = function(lbl, val, okv){ return '<div class="kk-zl" style="margin:3px 0"><span>' + esc(t(lbl)) + '</span><b class="' + (okv ? 'ok' : 'wrn') + '">' + val + '</b></div>'; };
  var out = '';
  if (kind === 'photos'){
    out += row('الشبكة', esc(t(d.on ? 'متصلة' : 'غير متصلة')), d.on) + row('صور في طابور الجهاز', nm(d.pq), !d.pq) + row('صور فشل رفعُها', nm(d.pf), !d.pf);
    if (!d.on) out += '<p>' + esc(t('الصورُ محفوظةٌ على جهازك، وتُرفَع لوحدها أوّلَ ما تفتح الشبكة. لا تحذف التطبيق ولا بياناتِ المتصفح الآن.')) + '</p>';
    else if (d.pq || d.pf) out += '<p>' + esc(t('الشبكةُ متصلة وما زالت صورٌ على الجهاز — اضغط «ارفع الآن» واترك التطبيقَ مفتوحًا دقيقة.')) + '</p><div class="actions">' + (d.pq ? btn('\u2B06 ' + t('ارفع الآن'), 'btn-primary btn-sm', ' data-phflushnow="1"') : '') + (d.pf ? btn(t('أعد المحاولة للفاشلة'), 'btn-secondary btn-sm', ' data-pretry="1"') : '') + '</div>';
    else out += '<p>' + esc(t('لا صورَ عالقةً على هذا الجهاز. صورُ أي نقطة تُجلَب عند فتحها؛ ولو رُفعت من جهازٍ آخر ولم تظهر، فذلك الجهازُ لم يفتح الشبكةَ بعد.')) + '</p>';
  } else if (kind === 'slow'){
    out += row('متوسط زمن الرسم', nm(d.rms) + ' ' + esc(t('م.ث')), d.rms < 800) + row('متوسط زمن السحب', nm(d.pms) + ' ' + esc(t('م.ث')), d.pms < 3000) + row('الوضع الخفيف', esc(t(d.lite ? 'يعمل' : 'لا')), true) + row('النسخة', esc(d.ver), true);
    out += '<p>' + esc(t('الحلُّ بالترتيب: ١) افتح الشبكة واترك التطبيقَ يحدّث نفسه، ٢) «إعادة ضبط التطبيق» تبدأ بمخزنٍ نظيف من غير أن تخسر شيئًا، ٣) الوضعُ الخفيف للأجهزة الضعيفة.')) + '</p>'
      + '<div class="actions">' + btn('\u{1F9F9} ' + t('إعادة ضبط التطبيق'), 'btn-primary btn-sm', ' data-appreset="1"') + (d.lite ? btn(t('الوضع الكامل'), 'btn-quiet btn-sm', ' data-liteoff="1"') : btn(t('شغّل الوضع الخفيف'), 'btn-secondary btn-sm', ' data-liteon="1"')) + '</div>';
  } else if (kind === 'sync'){
    out += row('الشبكة', esc(t(d.on ? 'متصلة' : 'غير متصلة')), d.on) + row('كتابات تنتظر الرفع', nm(d.q), !d.q) + row('كتابات معزولة (مرفوضة)', nm(d.pz), !d.pz) + row('المخزن المحلي', esc(t(d.idbBad ? 'فيه مشكلة' : 'سليم')), !d.idbBad);
    if (d.pz) out += '<p>' + esc(t('كتاباتٌ رُفضت من السحابة — تُعرَض في «ما ينتظر الرفع» بسببها؛ أبلغ المهندس.')) + '</p>';
    else if (!d.on) out += '<p>' + esc(t('كلُّ ما سجّلته محفوظٌ على الجهاز ويُرفَع أوّلَ ما تفتح الشبكة.')) + '</p>';
    else if (d.q) out += '<p>' + esc(t('الشبكةُ متصلة وما زالت كتاباتٌ تنتظر — اضغط «زامِن الآن».')) + '</p><div class="actions">' + btn('\u21BB ' + t('زامِن الآن'), 'btn-primary btn-sm', ' data-syncall="1"') + '</div>';
    else out += '<p>' + esc(t('لا شيءَ ينتظر الرفع — كلُّ ما سجّلته وصل.')) + '</p>';
  } else if (kind === 'update'){
    out += row('نسختك', esc(typeof verShow === 'function' ? verShow((typeof appVer === 'function' && appVer()) || d.ver) : d.ver), true)   /* (V39.7) in the user's digits */ + '<p>' + esc(t('التطبيقُ يحدّث نفسه لوحده أوّلَ ما يفتح على الشبكة. لو ظلّ قديمًا: أغلقه تمامًا وافتحه، ولو لم يتغيّر فـ«إعادة ضبط التطبيق».')) + '</p><div class="actions">' + btn('\u{1F9F9} ' + t('إعادة ضبط التطبيق'), 'btn-secondary btn-sm', ' data-appreset="1"') + '</div>';
  } else if (kind === 'login'){
    out += '<p>' + esc(t('تغييرُ كلمة المرور من زرّ «تغيير كلمة المرور» أسفلَ القائمة. ولو نسيتها فالمكتب يصدر لك كلمةً جديدةً من شاشة المستخدمين.')) + '</p><div class="actions">' + btn('\u{1F511} ' + t('تغيير كلمة المرور'), 'btn-secondary btn-sm', ' data-pwopen="1"') + '</div>';
  } else if (kind === 'gps'){
    out += '<p>' + esc(t('موقعُك يحتاج إذنَ الموقع للمتصفح: في آيفون من الإعدادات ← الخصوصية ← خدمات الموقع ← المتصفح ← «أثناء الاستخدام» و«الموقع الدقيق». وفي أندرويد من إعدادات التطبيق ← الأذونات ← الموقع.')) + '</p>';
  } else if (kind === 'map'){
    out += row('الشبكة', esc(t(d.on ? 'متصلة' : 'غير متصلة')), d.on) + row('الوضع الخفيف', esc(t(d.lite ? 'يعمل — بلا خريطة مجسّمة' : 'لا')), true)
      + '<p>' + esc(t('صورُ الخريطة تحتاج شبكةً أوّلَ مرة ثم تُحفَظ. لو النقاطُ لا تظهر: افحص «تصفية» أعلى الخريطة واضغط «مسح التصفية».')) + '</p>';
  }
  return out;
}

/* (V39.4) the engineer to talk to: up the reporting line from the user to the first engineer (or above); else the first
   active engineer — and '' when there is none, so the button falls back to the report it used to send */
function askEngWho(){ return askEngList()[0] || ''; }
/* (V39.7) owner: «لو أنا مشرف وعندي أكتر من مهندس أعمل إيه؟» — every engineer (and the one above the user first, then the
   others by name): one opens the conversation at once; two or more, the user picks from a list under the button */
function askEngList(){
  var U = STATE.users || {}, me = STATE.meta.name || '', by = {}, out = [];
  Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name && u.active !== false) by[u.name] = u; });
  var cur = by[me], seen = {};
  while (cur && cur.sup && !seen[cur.sup]){ seen[cur.sup] = 1; var up = by[cur.sup]; if (!up) break; if (rankOf(up.role || '') >= rankOf('engineer')){ out.push(up.name); break; } cur = up; }
  Object.keys(by).filter(function(n){ return n !== me && by[n].role === 'engineer' && out.indexOf(n) < 0; }).sort().forEach(function(n){ out.push(n); });
  return out;
}
/* (V39.4) «كلّم المهندس»: a conversation with the engineer, the question and the device's state written in its box — one
   engineer opens it at once, more than one shows the list (V39.7); no engineer on file: the report, as before */
function askEngClick(e){
  var to = e.target.closest('[data-askengto]');
  if (to){ askEngOpen(to.getAttribute('data-askengto')); return; }
  try { assistLog(ASSIST_Q, false, true); } catch (eAL2){ LS_ERR = eAL2; }
  var al = askEngList();
  if (al.length > 1){ askEngWho.pick = true; render(1); return; }
  if (al.length){ askEngOpen(al[0]); return; }
  BUG_FROM_ASSIST = String(ASSIST_Q || ''); BUG_KIND = 'عطل'; BUG_OPEN = true; ASSIST_OPEN = false; render(1);
}
/* the conversation with one engineer, the question and the device's state in its box */
function askEngOpen(name){
  var ak = 'dm:' + name; (chOpenHtml.draft = chOpenHtml.draft || {})[ak] = askEngText(ASSIST_Q);
  askEngWho.pick = false; chPageHtml.f = { open:ak }; ASSIST_OPEN = false; PTAB.chat = 'chat'; goPage('chat'); render(1);
}
function askEngPickHtml(){
  var L = askEngList();
  return '<div class="card" style="margin:0 0 10px"><p style="margin:0 0 6px">' + esc(t('اختر المهندس')) + '</p><div class="actions" style="flex-direction:column;align-items:stretch">'
    + L.map(function(n, i){ return btn('\u{1F4AC} ' + (dispName(n) || n) + (i === 0 && askEngUp() === n ? ' \u00b7 ' + t('فوقك مباشرةً') : ''), i ? 'btn-secondary btn-sm' : 'btn-primary btn-sm', ' data-askengto="' + esc(n) + '"'); }).join('')
    + '</div></div>';
}
/* the engineer (or above) directly up the reporting line — '' when the chain has none */
function askEngUp(){
  var U = STATE.users || {}, me = STATE.meta.name || '', by = {};
  Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name && u.active !== false) by[u.name] = u; });
  var cur = by[me], seen = {};
  while (cur && cur.sup && !seen[cur.sup]){ seen[cur.sup] = 1; var up = by[cur.sup]; if (!up) return ''; if (rankOf(up.role || '') >= rankOf('engineer')) return up.name; cur = up; }
  return '';
}
/* the first message: the question, then the device's state in one line — in the user's language, digits included */
function askEngText(q){
  /* (V39.7) the version as each language writes it — nm() read «39.4» as a number and wrote «٠٠» */
  var d = assistDiag(), vb = (typeof appVer === 'function' && appVer()) || d.ver;
  var parts = [t('الإصدار') + ' ' + (typeof verShow === 'function' ? verShow(vb) : String(vb || '').replace(/^V/i, '')), t(d.on ? 'متصل' : 'غير متصل')];
  if (d.q) parts.push(nm(d.q) + ' ' + t('كتابة تنتظر الرفع'));
  if (d.pq) parts.push(nm(d.pq) + ' ' + t('صورة تنتظر الرفع'));
  if (d.pf) parts.push(nm(d.pf) + ' ' + t('صورة فشل رفعها'));
  return String(q || '').trim() + '\n\u2014 ' + t('حالة جهازي') + ': ' + parts.join(' \u00b7 ');
}
function assistDiagCard(q){
  var d = assistDiag(), hits = assistIntent(q);
  if (!q){   /* بلا سؤال: حالةُ الجهاز في سطر، والعالقُ وحدَه يُفتَح */
    var warn = [];
    if (!d.on) warn.push('غير متصل بالشبكة'); if (d.q) warn.push(nm(d.q) + ' ' + t('كتابة تنتظر الرفع')); if (d.pq) warn.push(nm(d.pq) + ' ' + t('صورة تنتظر الرفع')); if (d.pf) warn.push(nm(d.pf) + ' ' + t('صورة فشل رفعها')); if (d.pz) warn.push(nm(d.pz) + ' ' + t('كتابة مرفوضة')); if (d.lite) warn.push(t('الوضع الخفيف يعمل'));
    return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid ' + (warn.length ? '#B8860B' : '#2E7D32') + '"><div class="pid">' + esc(t('حالة جهازك الآن')) + '</div>'
      + '<p style="margin:0">' + (warn.length ? esc(warn.map(function(w){ return t(w); }).join(' \u00b7 ')) : esc(t('كلُّ شيءٍ سليم: متصل، ولا شيءَ ينتظر الرفع.'))) + '</p>'
      + (warn.length ? assistFixHtml(d.pq || d.pf ? 'photos' : d.q || d.pz ? 'sync' : 'slow', d) : '') + '</div>';
  }
  /* (V39.4) owner: «نخلي الحتة دي شات أفضل للمهندس — مش بلاغ». The button opens a conversation with the engineer, the
     question and the device's state already in the message box; the reply comes back in that conversation, live. */
  var kh = knownHits(q), ask = askEngWho.pick ? askEngPickHtml() : '<div class="card" style="margin:0 0 10px"><p style="margin:0 0 6px">' + esc(t('لم يُحلّ؟ كلّم المهندس مباشرةً — تنفتح محادثةٌ معه فيها سؤالُك وحالةُ جهازك، وردُّه يصلك فيها.')) + '</p><div class="actions">' + btn('\u{1F4AC} ' + t('كلّم المهندس'), 'btn-primary btn-sm', ' data-askeng="1"') + '</div></div>';
  var known = kh.map(function(k){ return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid #2E7D32"><div class="pid">' + esc(t('مشكلة معروفة — حلّها')) + '</div><p style="margin:0">' + esc(k.a) + '</p></div>'; }).join('');
  if (!hits) return known + (q.length >= 6 ? ask : '');
  return known + hits.map(function(h){ return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--acc, #1A5FA8)"><div class="pid">' + esc(t('تشخيص')) + '</div><h4 style="margin:2px 0 6px">' + esc(t(h.t)) + '</h4>' + assistFixHtml(h.k, d) + '</div>'; }).join('') + ask;
}

/* ═══ (V37.30) ما تقوله البياناتُ عن المساعد — آخرُ ٣٠ يومًا (٢٦٬٥٧٣ حدثًا) ═══
   أكثرُ ما يقع: الحفظُ المحليُّ يسقط على آيفون (٤٣٣ خطأً في قاعدة الجهاز + ٤٦٦ «الحفظ المحلي لا يعمل» + ٢٠٤ توقّفًا مفاجئًا)، ثم تعذّرُ الوصول
   (١٣٥: منع دخول ٧٤، غير موجود ٤٦)، ثم فشلُ التحديث (٥٤). وبلاغاتُ التطبيق كلُّها منذ البداية اثنان فقط — والمساعدُ لم يُسجَّل له سؤالٌ واحد:
   فالمشكلةُ أن لا أحدَ يعرف أن الطريقَ موجود. فصار: أسئلةٌ سريعةٌ بنقرة، وشارةٌ على الزرّ حين يكون في الجهاز ما يحتاج حلًّا، وتعريفٌ بالمساعد
   مرةً بعد التحديث، وكلُّ سؤالٍ يُسجَّل (ومعه «بلا جواب») ليتعلّم المهندسُ ما يُضاف إلى «المشاكل المعروفة». */
var ASSIST_QUICK = ['الصور مش بتترفع', 'التطبيق بيقع أو بطيء', 'ما اتحفظش', 'المخيم مش لاقيه', 'التصوير ممنوع', 'القارئ ساقط', 'النسخة قديمة'];

var ASSIST_LOGGED = {};

/* (V37.38) البندُ ٦ — اكتُشف أن logEventQuiet لا يرفع شيئًا (سجلٌّ صامتٌ على الجهاز)، فلم يصل سؤالٌ واحد. صار حدثًا حقيقيًّا يصل المكتب،
   ويُسجَّل السؤالُ حين يتوقّف صاحبُه عن الكتابة ثانيتين ونصفًا (لا كلُّ حرفٍ وكلمةٍ ناقصة)، أو حين يختار سؤالًا جاهزًا أو يضغط «اسأل المهندس». */
function assistLog(q, answered, now){
  q = String(q || '').trim(); if (q.length < 6) return;
  if (!now && assistLog.pq === q && assistLog.t) return;   /* السؤالُ نفسُه ينتظر — لا يُعاد ضبطُ المؤقّت مع كلِّ تحديثٍ حيّ للنتائج */
  clearTimeout(assistLog.t); assistLog.pq = q;
  var go = function(){ if (ASSIST_LOGGED[q]) return; ASSIST_LOGGED[q] = 1; try { logEvent('سؤال المساعد — ' + q.slice(0, 80) + (answered ? '' : ' · بلا جواب')); } catch (e){ LS_ERR = e; } };
  if (now) go(); else assistLog.t = setTimeout(function(){ assistLog.t = 0; go(); }, 2500);
}

function assistWarnCount(){ try { var d = assistDiag(); return (d.on ? 0 : 0) + (d.q ? 1 : 0) + (d.pq ? 1 : 0) + (d.pf ? 1 : 0) + (d.pz ? 1 : 0) + (d.idbBad ? 1 : 0); } catch (e){ return 0; } }

function assistBadgeSync(){
  var b = document.getElementById('assistBtn'); if (!b) return;
  if (b.getAttribute('data-lbl') !== LANG){ b.setAttribute('data-lbl', LANG);   /* (V39.5) drawn once, it stayed Arabic in English and Urdu */ b.classList.add('tb-assist'); b.innerHTML = '\u{1F9ED}<span class="tb-assist-t">' + esc(t('المساعد')) + '</span><i class="tb-dot" hidden></i>'; }
  var n = assistWarnCount(), dot = b.querySelector('.tb-dot'); if (dot) dot.hidden = !n;
  b.setAttribute('aria-label', t('المساعد') + (n ? ' — ' + t('في جهازك ما يحتاج حلًّا') : ''));
  /* تعريفٌ بالمساعد مرةً لكلِّ جهاز بعد التحديث — فقاعةٌ صغيرةٌ تختفي بلمسةٍ أو بعد ثماني ثوانٍ */
  if (!assistBadgeSync.tipped && lsGet('nsk14.assisttip') !== '1' && typeof ROLE !== 'undefined' && ROLE && document.getElementById('nav')){
    assistBadgeSync.tipped = true; lsSet('nsk14.assisttip', '1');
    var tip = document.createElement('div'); tip.id = 'assistTip'; tip.setAttribute('role', 'status');
    var r = b.getBoundingClientRect(); tip.style.cssText = 'position:fixed;top:' + Math.round(r.bottom + 8) + 'px;inset-inline-end:8px;max-width:260px;z-index:1960;background:#1A5FA8;color:#fff;border-radius:12px;padding:10px 12px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.35)';
    tip.innerHTML = '<b>' + esc(t('جديد: المساعد')) + '</b><br>' + esc(t('يشخّص جهازك ويحلّ المشكلة بزرّ، أو يوصّلها للمهندس بحالة جهازك. جرّبه لما يحصل أي حاجة.')) + ' <button type="button" class="btn btn-quiet btn-sm" data-assist="1" style="color:#fff">' + esc(t('افتحه')) + '</button>';
    document.body.appendChild(tip); setTimeout(function(){ var x = document.getElementById('assistTip'); if (x) x.remove(); }, 8000);
  }
}

/* ═══ (V37.40) «خليه ذكي لأبعد الحدود واستخدم سلوك المستخدمين وبياناتهم» ═══
   المساعدُ يعرف: من أنت (دورك)، وأين أنت (الصفحة)، وماذا يكثر أن تفعل (صفحاتك اليوم)، وما عليك الآن (من بياناتك وبيانات جهازك) —
   فتبدأ نافذتُه بما يخصّك لا بقائمةٍ عامة. كلُّه من بياناتٍ على الجهاز: بلا شبكةٍ ولا كلفة ولا قراءاتٍ إضافية. */
var ASSIST_PAGE_Q = {
  map:['النقاط مش ظاهرة على الخريطة', 'موقعي مش ظاهر', 'حدود المخيم غلط'],
  forms:['الصور مش بتترفع', 'ما اتحفظش', 'التصوير ممنوع', 'المخيم مش لاقيه'],
  svForm:['الصور مش بتترفع', 'ما اتحفظش', 'التصوير ممنوع'],
  mywork:['المخيم مش لاقيه', 'القارئ ساقط', 'الراوتر بيفصل كل شوية'],
  mfu:['إزاي أطلّع تقرير الوزارة الأسبوعي', 'إيه الفرق بين الزيارة والمسح', 'النسخة قديمة'],
  sys:['أجهزة تحتاج إجراء', 'التطبيق بيقع أو بطيء']
};

function assistForYou(){
  var out = [], d = null; try { d = assistDiag(); } catch (e){ d = null; }
  var me = (STATE.meta && STATE.meta.name) || '', rk = typeof rankOf === 'function' ? rankOf(ROLE) : 0;
  /* حالةُ الجهاز في بطاقتها فوق — لا تتكرّر هنا */
  try {   /* ما سجّله صاحبُ الجهاز اليوم — يراه في سطرٍ قبل أن يسأل «هل وصل؟» */
    var dk = dayKey(), mine = Object.keys(STATE.recs || {}).filter(function(id){ var r = STATE.recs[id]; return r && r.by === me && dayKey(+r.at || 0) === dk; }).length;
    if (me && mine && rk < (typeof rankOf === 'function' ? rankOf('engineer') : 99)) out.push(['\u2705', t('سجّلت النهارده') + ' ' + nm(mine) + ' ' + t('زيارة'), ' data-p="mywork" data-assist="0"']);
  } catch (e){ LS_ERR = e; }
  try {   /* المهندسُ فما فوق: تحدياتٌ تنتظر تصنيفَه */
    if (typeof rankOf === 'function' && rk >= rankOf('engineer')){
      var rev = Object.keys(STATE.recs || {}).filter(function(id){ var r = STATE.recs[id]; return r && siteFind(id) && svDone(r) && chalCats(r).indexOf('review') > -1; }).length;
      if (rev) out.push(['\u{1F3F7}', nm(rev) + ' ' + t('تحدي محتاج تصنيف منك'), ' data-p="mfu" data-assist="0"']);
    }
  } catch (e){ LS_ERR = e; }
  if (ROLE === 'viewer') out.push(['\u{1F4C4}', t('تقرير التحديث الأسبوعي: «متابعة الوزارة» ← تصدير'), ' data-p="mfu" data-assist="0"']);
  return out.slice(0, 4);
}

function assistTopPages(){
  try { var u = pageUse().n || {}; return Object.keys(u).filter(function(k){ return k !== CUR && PAGE[k] && (typeof seesPage !== 'function' || seesPage(k)); }).sort(function(a, b){ return u[b] - u[a]; }).slice(0, 3); } catch (e){ return []; }
}
