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
  var results = ASSIST_Q ? helpSearch(ASSIST_Q) : [], gl = ASSIST_Q ? glossaryHits(ASSIST_Q) : [];   /* (V33.2) المصطلحُ أوّلًا */
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

/* ═══ (V37.23) طلبُ المالك: «المساعد يقدر الشخص يكلّمه ويحدّدله المشكلة ويحلّهاله لو ممكن أو يقوله حلّها إزاي» ═══
   الطبقةُ الأولى بلا شبكةٍ وبلا كلفة: يقرأ حالةَ الجهاز نفسِه (الشبكة، النسخة، الطابور، الصور، الوضع الخفيف، المخزن) ويفهم الشكوى
   بكلماتها، ثم ينفّذ الحلَّ بزرٍّ حيث يملكه، ويشرح الخطواتِ حيث لا يملكه. */
function assistDiag(){
  var q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length;
  var pq = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0, pf = (typeof PHOTO_FAIL === 'object' && PHOTO_FAIL) ? PHOTO_FAIL.length : 0;
  var pz = (STATE.poison || []).length, on = !!STATE.meta.online, rms = typeof perfAvg === 'function' ? perfAvg('r') : 0, pms = typeof perfAvg === 'function' ? perfAvg('p') : 0;
  var bad = typeof IDB_WHY !== 'undefined' && IDB_WHY;
  return { q:q, pq:pq, pf:pf, pz:pz, on:on, rms:rms, pms:pms, lite:!!LITE, idbBad:!!bad, ver:(typeof APP_VER !== 'undefined' ? APP_VER : ''), role:ROLE };
}
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
    out += row('نسختك', esc(d.ver), true) + '<p>' + esc(t('التطبيقُ يحدّث نفسه لوحده أوّلَ ما يفتح على الشبكة. لو ظلّ قديمًا: أغلقه تمامًا وافتحه، ولو لم يتغيّر فـ«إعادة ضبط التطبيق».')) + '</p><div class="actions">' + btn('\u{1F9F9} ' + t('إعادة ضبط التطبيق'), 'btn-secondary btn-sm', ' data-appreset="1"') + '</div>';
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
function assistDiagCard(q){
  var d = assistDiag(), hits = assistIntent(q);
  if (!q){   /* بلا سؤال: حالةُ الجهاز في سطر، والعالقُ وحدَه يُفتَح */
    var warn = [];
    if (!d.on) warn.push('غير متصل بالشبكة'); if (d.q) warn.push(nm(d.q) + ' ' + t('كتابة تنتظر الرفع')); if (d.pq) warn.push(nm(d.pq) + ' ' + t('صورة تنتظر الرفع')); if (d.pf) warn.push(nm(d.pf) + ' ' + t('صورة فشل رفعها')); if (d.pz) warn.push(nm(d.pz) + ' ' + t('كتابة مرفوضة')); if (d.lite) warn.push(t('الوضع الخفيف يعمل'));
    return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid ' + (warn.length ? '#B8860B' : '#2E7D32') + '"><div class="pid">' + esc(t('حالة جهازك الآن')) + '</div>'
      + '<p style="margin:0">' + (warn.length ? esc(warn.map(function(w){ return t(w); }).join(' \u00b7 ')) : esc(t('كلُّ شيءٍ سليم: متصل، ولا شيءَ ينتظر الرفع.'))) + '</p>'
      + (warn.length ? assistFixHtml(d.pq || d.pf ? 'photos' : d.q || d.pz ? 'sync' : 'slow', d) : '') + '</div>';
  }
  var kh = knownHits(q), ask = '<div class="card" style="margin:0 0 10px"><p style="margin:0 0 6px">' + esc(t('لم يُحلّ؟ أرسلها للمهندس — تصله بحالة جهازك، وترى ردَّه في «البلاغات».')) + '</p><div class="actions">' + btn('\u{1F64B} ' + t('اسأل المهندس'), 'btn-primary btn-sm', ' data-askeng="1"') + '</div></div>';
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
/* (V37.36) بلاغُ المالك: «صفحةُ المساعد مش بتتحدّث لوحدها بعد ما المزامنة تخلص» — حالةُ الجهاز تُقرأ عند الفتح وحدَه. صارت تُراقَب كلَّ ثانيتين
   ما دام المساعدُ مفتوحًا، وحين تتغيّر (طابورٌ فرغ، صورةٌ رُفعت، شبكةٌ عادت) تُستبدَل النتائجُ وحدَها والحقلُ باقٍ بما كُتب فيه. */
function assistDiagSig(){ try { var d = assistDiag(); return [d.q, d.pq, d.pf, d.pz, d.on ? 1 : 0, d.lite ? 1 : 0, d.idbBad ? 1 : 0].join('|'); } catch (e){ return ''; } }
function assistLiveSync(){
  if (!ASSIST_OPEN) { assistLiveSync.sig = ''; return; }
  var rs = document.getElementById('assistRes'); if (!rs) return;
  var sig = assistDiagSig(); if (!assistLiveSync.sig){ assistLiveSync.sig = sig; return; }
  if (sig !== assistLiveSync.sig){ assistLiveSync.sig = sig; rs.innerHTML = assistResHtml(); }
}
setInterval(function(){ try { assistLiveSync(); } catch (e){ LS_ERR = e; } }, 2000);
function assistBadgeSync(){
  var b = document.getElementById('assistBtn'); if (!b) return;
  if (!b.getAttribute('data-lbl')){ b.setAttribute('data-lbl', '1'); b.classList.add('tb-assist'); b.innerHTML = '\u{1F9ED}<span class="tb-assist-t">' + esc(t('المساعد')) + '</span><i class="tb-dot" hidden></i>'; }
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
/* ═══ (V38.14) مساعدُ البيانات — أسئلةٌ عن بيانات المشروع تُجاب بالرقم من الجهاز نفسِه ═══
   المسارُ «أ» بقرار المالك: لا نموذجَ خارجيّ ولا بياناتٍ تخرج من الجهاز. يفهم بالعامية: نقطةٌ بمعرِّفها
   أو شاخصِها، وأعدادُ التركيب والمسح بمشعرٍ ونوع، وإشارةُ القرّاء، ورصيدُ صنفٍ في المخزن، وما ينقص
   للجاهزية — ويجيب بالرقم وزرٍّ إلى الشاشة. وما لا يفهمه يبقى في سجلّ الأسئلة ليُضاف. */
function aqNorm(q){
  return String(q || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).toLowerCase();
}
function aqTypes(){
  return [['مخيم', /مخيم/], ['ممر', /ممر/], ['كاميرا', /كامير/], ['جسر', /جسر|جسور/], ['محطة', /محطه|محطات|قطار/], ['بوابة', /بوابه|بوابات/], ['مبنى', /مبني|مباني/]];
}
function aqScope(n){
  var zs = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zs[x.zone] = 1; });
  var zone = Object.keys(zs).filter(function(z){ var k = aqNorm(z).replace(/^ال/, ''); return k.length > 2 && n.indexOf(k) > -1; })[0] || '';
  var ty = aqTypes().filter(function(p){ return p[1].test(n); })[0];
  return { zone:zone, type:ty ? ty[0] : '' };
}
function aqGo(lbl, target){ return '<button type="button" class="btn btn-primary btn-sm" data-aqgo="' + esc(target) + '">' + esc(t(lbl)) + ' \u2190</button>'; }
function aqCard(title, body, btns){
  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--ok, #2e9e6a)"><div class="pid">' + esc(t('مساعد البيانات')) + '</div>'
    + '<h4 style="margin:2px 0 6px">' + esc(title) + '</h4>' + body + (btns ? '<div class="actions" style="margin:8px 0 0;flex-wrap:wrap;gap:6px">' + btns + '</div>' : '') + '</div>';
}
function aqRow(k, v){ return '<div class="kk-zl" style="margin:3px 0"><span>' + esc(t(k)) + '</span><b class="num">' + v + '</b></div>'; }
function aqPoint(x){
  var r = STATE.recs[x.id], ins = STATE.inss[x.id], L = (typeof extLink === 'function') ? extLink(x) : {};
  var sv = !r ? t('لم تُزَر') : r.access !== 'تم الوصول' ? t('زيارةٌ متعذّرة') : r.review === 'approved' ? t('ممسوحة ومعتمدة') : t('ممسوحة — بانتظار الاعتماد');
  var ist = !ins ? t('لم تُركَّب') : ins.status === 'مُركّب' ? t('مُركّب') + (ins.approved ? ' \u00b7 ' + t('معتمد') : '') : t(ins.status || 'مسودّة');
  var tn = L.tent || (L.reader && typeof extTentByCode === 'function' ? extTentByCode(L.reader.locationName) : null), ov = tn && EXT.ov[tn.id] && EXT.ov[tn.id].data;
  var c = (ov && ov.occupancyStatus) || {}, tot = (+c.currentlyOccupied || 0) + (+c.withoutBracelet || 0) + (+c.fromOtherCamps || 0);
  var body = aqRow('المسح', esc(sv)) + aqRow('التركيب', esc(ist))
    + (L.by ? aqRow('الربط بنظام البطاقات', esc(t({ name:'الاسم', sign:'الشاخص', serial:'السيريال' }[L.by] || L.by)) + (tn ? ' \u00b7 <bdi>' + esc(tn.code) + '</bdi>' : '')) : '')
    + (L.reader ? aqRow('الإشارة', esc(extRdStateText(L.reader))) : '')
    + (ov ? aqRow('الإشغال', nm(tot) + ' / ' + nm(+c.totalCapacity || 0)) : '');
  return aqCard((x.name || x.id) + ' \u00b7 ' + x.id, body, aqGo('افتح النقطة', 'site|' + x.id) + (L.by || L.reader ? ' <button type="button" class="btn btn-quiet btn-sm" data-ovopen="' + esc(x.id) + '">\u{1F441} ' + esc(t('النظرة العامة')) + '</button>' : ''));
}
function aqAnswer(q){
  var n = aqNorm(q), out = '';
  /* (V38.17) تقريرٌ بالكلام أوّلًا: «إكسل/PDF للنقاط اللي …» */
  var RP = aqRepParse(q); if (RP.isRep && (RP.conds.length || RP.group)) return aqRepCard(q, aqRepData(q));
  /* ١ · نقطةٌ بمعرِّفها أو شاخصِها */
  var idm = /nsk-[a-z]{3}-[a-z]{3}-\d{3,4}/i.exec(q), sgm = /(\d{1,3})\s*\/\s*(\d{1,4})/.exec(n);
  if (idm){ var x0 = siteFind(idm[0].toUpperCase()); if (x0) return aqPoint(x0); }
  if (sgm){
    var code = sgm[1] + '/' + sgm[2], sc = aqScope(n);
    var L = (STATE.sites || []).filter(function(x){ return x && x.sign && String(x.sign).replace(/\s+/g, '') === code && (!sc.zone || x.zone === sc.zone); });
    if (L.length) return L.slice(0, 3).map(aqPoint).join('') + (L.length > 3 ? '<p class="hint">' + esc(t('والباقي')) + ' ' + nm(L.length - 3) + '</p>' : '');
  }
  var sc2 = aqScope(n), scopeTxt = [sc2.zone, sc2.type].filter(Boolean).join(' \u00b7 ');
  var pool = (STATE.sites || []).filter(function(x){ return x && (!sc2.zone || x.zone === sc2.zone) && (!sc2.type || x.type === sc2.type); });
  /* ٢ · إشارةُ القرّاء */
  if (/ترسل|بترسل|بيبعت|بتبعت|اشاره|اونلاين|اوفلاين|online|offline|مقطوع|(^|\s)شغال|القراء|قارئ/.test(n) && typeof extStatusRows === 'function'){   /* (V38.15) «شغال» كلمةً لا داخل «إشغال» */
    var R = extStatusRows();
    if (!R) out += aqCard(t('إشارة القرّاء'), '<p class="hint" style="margin:0">' + esc(t('لا جسرَ بعد — شغّل الجسر من المخيمات المركزية')) + '</p>', aqGo('المخيمات المركزية', 'page|mcamps'));
    else {
      R = R.filter(function(r){ return (!sc2.zone || r.x.zone === sc2.zone) && (!sc2.type || r.x.type === sc2.type); });
      var cnt = function(f){ return R.filter(f).length; };
      out += aqCard(t('إشارة القرّاء') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''),
        aqRow('مرتبطة بالنظام', nm(R.length)) + aqRow('🟢 ترسل', nm(cnt(function(r){ return r.sig === 'on'; }))) + aqRow('🔴 لا ترسل', nm(cnt(function(r){ return r.sig === 'off'; })))
        + aqRow('⚪ بلا قارئ ظاهر', nm(cnt(function(r){ return r.sig === 'none'; }))) + aqRow('📊 لها أرقام', nm(cnt(function(r){ return r.ov; })))
        + (EXT.bridge ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بحسب آخر جسر')) + ' ' + esc(pilotAgo(EXT.bridge.at)) + '</p>' : ''),
        aqGo('اعرض اللي لا ترسل', 'page|mcamps|off') + ' ' + aqGo('اعرض الكل', 'page|mcamps|all'));
    }
  }
  /* ٣ · رصيدُ صنفٍ في المخزن */
  if (/رصيد|مخزن|مخزون|عهده|متاح|فاضل/.test(n) && typeof stockBalance === 'function'){
    var B = stockBalance(), hit = B.filter(function(b){ var k = aqNorm(b.item); return k.split(/\s+/).some(function(w){ return w.length > 3 && n.indexOf(w) > -1; }); });
    /* (V38.15) صنفٌ في الكتالوج بلا حركاتٍ بعد يُجاب بأصفاره لا بـ«أكبر الأرصدة» */
    if (!hit.length){
      var seen0 = {};
      itemsList().forEach(function(i){ var k = aqNorm(i.name || ''); if (!i.name || seen0[i.name]) return; if (k.split(/\s+/).some(function(w){ return w.length > 3 && n.indexOf(w) > -1; })){ seen0[i.name] = 1; hit.push({ item:i.name, store:0, custody:0, used:0, scrap:0 }); } });
    }
    var rows = (hit.length ? hit : B.slice().sort(function(a, b){ return b.store - a.store; })).slice(0, 6);
    out += aqCard(hit.length ? t('رصيد الصنف') : t('أكبر الأرصدة في المخزن'), rows.map(function(b){
      return aqRow(b.item, nm(b.store) + ' ' + esc(t('مخزن')) + ' \u00b7 ' + nm(b.custody) + ' ' + esc(t('عهدة')) + ' \u00b7 ' + nm(b.used) + ' ' + esc(t('رُكّب')));
    }).join('') || '<p class="hint" style="margin:0">' + esc(t('لا حركاتٍ في المخزن بعد')) + '</p>', aqGo('الأرصدة', 'page|invb'));
  }
  /* ٤ · أعدادُ التركيب والمسح */
  if (/تركيب|اتركب|مركب|ركبنا|اتمسح|مسح|زياره|زيارات|زرنا|اعتماد|معتمد|انجاز|نسبه|كام|كم|عدد|قد ايه|اد ايه/.test(n) && !out && !/الوزاره|تحدي|معوق|اشغال|مهام|متاخر/.test(n)){
    var tot = pool.length, inst = pool.filter(function(x){ var i = STATE.inss[x.id]; return i && i.status === 'مُركّب'; }).length;
    var appr = pool.filter(function(x){ var i = STATE.inss[x.id]; return i && i.status === 'مُركّب' && i.approved; }).length;
    var vis = pool.filter(function(x){ return svVisited(STATE.recs[x.id]); }).length, reach = pool.filter(function(x){ var r = STATE.recs[x.id]; return svVisited(r) && r.access === 'تم الوصول'; }).length;
    var svA = pool.filter(function(x){ var r = STATE.recs[x.id]; return r && r.review === 'approved'; }).length;
    var pc = function(a){ return tot ? Math.round(a / tot * 100) + '%' : '\u2014'; };
    out += aqCard(t('التقدّم') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ' \u00b7 ' + t('كلُّ المشاعر')),
      aqRow('النقاط', nm(tot)) + aqRow('زيارات المسح', nm(vis) + ' (' + pc(vis) + ')') + aqRow('وُصل إليها', nm(reach)) + aqRow('مسحٌ معتمد', nm(svA))
      + aqRow('مُركّبة', nm(inst) + ' (' + pc(inst) + ')') + aqRow('تركيبٌ معتمد', nm(appr)),
      aqGo('المسح الميداني', 'page|msurv') + ' ' + aqGo('حالة التركيبات', 'page|minst'));
  }
  /* ٦ · (V38.15) المهامُّ الأسبوعية المتأخرة */
  if (/متاخر|تاخير|تأخير|المهام|مهام|مين متاخر/.test(n) && typeof wtRows === 'function'){
    var W = wtRows().filter(function(r){ return r && r.st !== 'مكتمل'; }), late = W.filter(wtLate).sort(function(a, b){ return wtDue(a) - wtDue(b); });
    var byWho = {}; late.forEach(function(r){ var k = r.who || t('بلا مسؤول'); byWho[k] = (byWho[k] || 0) + 1; });
    out += aqCard(t('المهام الأسبوعية'), aqRow('مفتوحة', nm(W.length)) + aqRow('متأخرة', nm(late.length))
      + late.slice(0, 5).map(function(r){ return aqRow(r.n, esc(r.who || '\u2014') + ' \u00b7 ' + nm(-wtDue(r)) + ' ' + esc(t('يوم'))); }).join('')
      + (Object.keys(byWho).length ? '<p class="hint" style="margin:6px 0 0">' + Object.keys(byWho).map(function(k){ return esc(k) + ' ' + nm(byWho[k]); }).join(' \u00b7 ') + '</p>' : ''),
      aqGo('المهام الأسبوعية', 'page|mweek'));
  }
  /* ٧ · (V38.15) التحدياتُ والمعوقات من زيارات المسح */
  if (/تحدي|تحديات|معوق|معوقات|عائق|عوائق|مشاكل|مشكله/.test(n)){
    var cc = {}, hasC = 0;
    pool.forEach(function(x){ var r = STATE.recs[x.id]; var L2 = (r && r.chals || []).filter(function(c){ return c && c !== 'لا توجد تحديات'; }); if (L2.length){ hasC++; L2.forEach(function(c){ cc[c] = (cc[c] || 0) + 1; }); } });
    var top = Object.keys(cc).sort(function(a, b){ return cc[b] - cc[a]; }).slice(0, 6);
    out += aqCard(t('التحديات والمعوقات') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''), aqRow('نقاطٌ فيها تحدٍّ', nm(hasC)) + top.map(function(c){ return aqRow(c, nm(cc[c])); }).join('')
      + (!top.length ? '<p class="hint" style="margin:0">' + esc(t('لا تحدياتِ مسجّلة في هذا النطاق')) + '</p>' : ''), aqGo('التحديات والمعوقات', 'page|mobs'));
  }
  /* ٨ · (V38.15) اعتمادُ الوزارة */
  if (/الوزاره|اعتماد الوزاره|مراجعه الوزاره|الوزارة/.test(n) && !/تقرير|ملف/.test(n)){
    var mp = 0, ma = 0, mr = 0;
    pool.forEach(function(x){ var r = STATE.recs[x.id]; if (!r) return; if (r.minReview === 'pending') mp++; else if (r.minReview === 'approved') ma++; else if (r.minReview === 'revisit' || r.minReview === 'rejected') mr++; });
    out += aqCard(t('اعتماد الوزارة') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''), aqRow('بانتظار الوزارة', nm(mp)) + aqRow('اعتمدتها الوزارة', nm(ma)) + aqRow('ردّتها الوزارة', nm(mr)),
      aqGo('اعتماد الوزارة', 'page|minappr'));
  }
  /* ٩ · (V38.15) الإشغالُ الأعلى من آخر جسر */
  if (/اشغال|زحمه|ازدحام|مليان|ممتلي|ممتلئ|اعلي اشغال/.test(n) && typeof extStatusRows === 'function'){
    var R3 = (extStatusRows() || []).filter(function(r){ return r.ov && r.pct != null && (!sc2.zone || r.x.zone === sc2.zone); }).sort(function(a, b){ return b.pct - a.pct; });
    out += aqCard(t('الإشغال') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''),
      (R3.length ? R3.slice(0, 6).map(function(r){ return aqRow(r.code || r.x.id, nm(r.pct) + '% \u00b7 ' + nm(r.tot) + '/' + nm(r.cap)); }).join('')
                 : '<p class="hint" style="margin:0">' + esc(t('لا أرقامَ إشغالٍ في آخر جسر — شغّل الجسر بعد الربط الجماعي')) + '</p>')
      + (EXT.bridge ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بحسب آخر جسر')) + ' ' + esc(pilotAgo(EXT.bridge.at)) + '</p>' : ''),
      aqGo('المخيمات المركزية', 'page|mcamps|ov'));
  }
  /* ٥ · ما ينقص للجاهزية */
  if (/ناقص|جاهز|نجهز|معلق|المطلوب|الجاي|اعمل ايه|نعمل ايه/.test(n)){
    var items = [], zeroW = itemsList().filter(function(i){ return i.name && !itPts(i.code); }).length;
    if (zeroW) items.push([t('أصنافٌ بلا وزن نقاط'), nm(zeroW), 'page|install']);
    var B2 = EXT.bridge; if (!B2 || Date.now() - B2.at > 12 * 3600000) items.push([t('جسرُ نظام البطاقات'), B2 ? pilotAgo(B2.at) : t('لم يُشغَّل'), 'page|mcamps']);
    var pend = Object.keys(STATE.recs || {}).filter(function(k){ var r = STATE.recs[k]; return r && svDone(r) && r.review !== 'approved' && r.review !== 'revisit'; }).length;
    if (pend) items.push([t('زياراتٌ بانتظار الاعتماد التقني'), nm(pend), 'page|svappr']);
    var orN = (STATE.ex47orph || []).length; if (orN) items.push([t('نقاط ١٤٤٧ خارج الخريطة'), nm(orN), 'page|mcamps']);
    var D = (typeof contLoad === 'function' && contLoad.d) || null;
    if (D){ var un = contRes().filter(function(r){ return !D[r[0]]; }).length; if (un) items.push([t('بدائلُ غيرُ مسمّاة'), nm(un), 'page|hb']); }
    var qn = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length; if (qn) items.push([t('بانتظار الرفع على هذا الجهاز'), nm(qn), 'page|sync']);
    out += aqCard(t('ما ينقص للجاهزية'), items.length ? items.map(function(it){ return '<div class="kk-zl" style="margin:4px 0;align-items:center"><span>' + esc(it[0]) + '</span><span><b class="num">' + esc(String(it[1])) + '</b> <button type="button" class="btn btn-quiet btn-sm" data-aqgo="' + esc(it[2]) + '">\u2190</button></span></div>'; }).join('')
      : '<p style="margin:0">' + esc(t('لا شيءَ معلَّقٌ ممّا يُقاس هنا')) + ' \u2713</p>');
  }
  return out;
}
