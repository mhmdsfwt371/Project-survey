/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Point window actions, click identity, export centre by section, export by role, PDF cover page.
   DEFINES : popOpenAt, expAllowed, expSecs, pdfTile, pdfBar, pdfCols, pdfDonut, pdfCover, expPdf, expHtml
   GLOBALS : BOOT_AT, POP_OPEN
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
          

/* نافذةُ النقطة في p27 — بأفعالها الحقيقية */

/* ═══ مركز التصدير — قسمًا قسمًا كالقديم ═══ */

EXP.secs = [
  ['summary','الملخّص التنفيذي — أرقامُ المشروع في ورقة',1],
  ['over','نظرة عامة',1], ['minappr','اعتماد الوزارة لإعداد التركيب',1], ['wbs','متابعة الخطة التفصيلية',1], ['wtask','متابعة المهام الأسبوعية',1], ['wtaskAll','المهام — ورقة العمل',1], ['wtmeet','محضر الاجتماع',1], ['wtsince','ما تغيّر منذ الاجتماع الماضي',1], ['pace','الوتيرة والهدف',1],
  ['chalm','التحديات — أين وما هي وما المطلوب',1], ['chalpts','نقاط التحديات — كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومعالجته (بفلتر الصفحة إن وُضع)',1], ['inst','التركيب والجدولة',1],
  ['daily','معدل التركيب اليومي — آخر ١٤ يوم',1], ['reg','حسب المشعر ونوع النقطة',1],
  ['co','حسب شركة الخدمة — الأقل إنجازًا أولًا',1],
  ['setup','المواعيد المستهدفة وأزمنة التركيب',1],
  ['pipe','سلامة خط الإنتاج — مسح ← جدولة ← تركيب',1],
  ['assign','توزيع فرق التركيب',1], ['conote','إشعار الشركات بمواعيد التركيب',1],
  ['stock','عُهدة الأجهزة — القارئات مع الفرق والمخزن',1],
  ['survey','المسح الميداني',1], ['chal','التحديات الميدانية — إفادة المشرفين',1],
  ['stuck','المتعذّر — ما لم يصل إليه الميدان',1],
  ['idle','الراكد — زيارةٌ تمّت ولم يُركَّب موقعُها',1],
  ['qa','التدقيق الهندسي — اعتماد التركيبات والسيريالات',1],
  ['sys','سلامة البيانات — المشرف العام',1], ['ev','سجل الأحداث',1],
  ['invb','المخزون والعُهدة',1], ['invmv','دفتر حركة المخزون',1],
  ['wos','الورشة — طلبات التهيئة والتجميع والتركيب',1],
  ['wday','نقاط اليوم — لكل منفِّذ عبر المراحل',1],
  ['buys','المشتريات — ما اشتُري من السوق المحلي',1],
  ['score','أداء الفنيين — نقاطهم ومستحقّهم',1],
  ['stages','أداء المراحل — فريق كل مرحلة',1],
  ['recs','المسح الميداني — كل زيارة وحالتها',1],
  ['hb','صحة الأجهزة — إنذار مبكر',1], ['dis','الفك بعد الموسم',1],
  ['vers','نسخة التطبيق على الأجهزة',1],
  /* خمسُ أوراقٍ كانت تُبنى ولا يصلها منفذ: تُولَّد في كل تصديرٍ ثم تُرمى.
     ورقةٌ لا تُطلَب شيفرةٌ ميتة، والأصلُ أن تُوصَل لا أن تُحذَف. */
  ['work','وجه العمل — التوزيع والنسب',1],
  ['items','القطع والأسعار — الكتالوج كاملًا',1],
  ['crews','الطواقم ومعدلاتها اليومية',1],
  ['reps','مركز التقارير — ما يُرسَل ولمن ومتى',1],
  ['daily','الاتجاه اليومي — تسعون يومًا',1],
  ['ev','سجل الأحداث — كما هو مصفّى',1],
  ['users','المستخدمون وأدوارهم',1],
  ['notif','الإشعارات وقنواتها',1],
  ['appr','الاعتمادات — المقترح والقرار',1],
  ['ips','عناوين الشبكة',1],
  ['fleet','السيارات — الأسطول والإسناد',1],
  ['fleetCost','تكلفة الأسطول',1],
  ['fleetLog','سجل عهدة السيارات',1],
  ['ships','الشحنات والتوريد',1],
  ['roles','الأدوار والصلاحيات',1]
];

/* ═══ التصديرُ بعين الدور ═══
   كان الحوارُ يعرض الأقسامَ كلَّها لكلِّ أحد — فترى الوزارةُ «الأدوار والصلاحيات»
   و«عهدة السيارات» و«تكلفة الأسطول» وتختارها وتُصدَّر لها. صار كلُّ قسمٍ
   مربوطًا بشاشته: لا يُعرَض ولا يُصدَّر إلا لمن يرى تلك الشاشة. */
EXP.page = { summary:'over', minappr:'survey', wtsince:'wtask', wtaskAll:'wtask', wtmeet:'wtask', setup:'consts', pipe:'over', conote:'co', stock:'inv', wday:'perf', score:'perf', stages:'perf',
                 hb:'sys', vers:'sys', work:'over', items:'items', crews:'org', reps:'exec', appr:'ev', ips:'sys',
                 fleet:'fleet', fleetCost:'fleet', fleetLog:'fleet', ships:'inv', roles:'roles', invb:'inv', invmv:'inv',
                 wos:'inv', buys:'inv', notif:'ev', users:'users', recs:'survey', chal:'survey', stuck:'survey', qa:'survey',
                 chalm:'survey', chalpts:'mfu', assign:'req', inst:'over', daily:'over', pace:'over', reg:'over', dis:'dis', sys:'sys', ev:'ev', survey:'survey', co:'co', over:'over' };

/* ستةَ عشرَ قسمًا في القائمة بلا ورقةٍ تُبنى — كانت تُعرَض رماديةً مطفأةً
   فيظنُّ الناظرُ أن بياناتِه ناقصة، وهي شيفرةٌ لم تُوصَل. لا تُعرَض. */
function expSecs(){ return EXP.secs.filter(function(x){ return expAllowed(x[0]) && !!SHEETS[x[0]]; }); }
/* ═══ PDF: ورقةٌ تُبنى وتُطبَع ═══
   الطباعةُ إلى PDF هي ما يملكه المتصفّحُ بلا مكتبة — تُبنى صفحةٌ نظيفةٌ
   بالأقسام المختارة في نافذةٍ مستقلّةٍ فيختار المستخدمُ «حفظ كـPDF». */

function expHtml(){
  return '<div class="pop" id="expPop" style="width:min(430px,92vw);max-height:82vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">'+esc(t('تصدير تقرير اللوحة'))+'</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'+esc(t('اختر الأقسام التي تريدها في التقرير'))+'</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-exp="0" aria-label="'+esc(t('إغلاق'))+'">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="actions" style="margin:12px 0">'
    +   btn('تحديد الكل','btn-secondary btn-sm',' data-expall="1"')
    +   btn('إلغاء الكل','btn-secondary btn-sm',' data-expall="0"')
    + '</div>'
    + '<div id="expList" style="margin:0 0 14px">'
    +   expSecs().map(function(s){
          return '<label style="display:flex;gap:9px;align-items:flex-start;padding:7px 2px;'
            + 'border-bottom:1px solid var(--line-2);font-size:13.5px;cursor:pointer">'
            + '<input type="checkbox" class="expCk" data-k="'+esc(s[0])+'" checked'
            + ' style="width:18px;min-height:18px;margin-top:2px;flex:0 0 auto">'
            + '<span>'+esc(t(s[1]))+'</span></label>';
        }).join('')
    + '</div>'
    + '<div class="grid cols-2" style="margin-bottom:12px">'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الصيغة'))+'</label>'
    +   '<select id="expFmt"><option value="xlsx">'+esc(t('إكسل — ورقة لكل قسم'))+'</option>'
    +   '<option value="pdf">'+esc(t('PDF — بالرسوم البيانية'))+'</option>'
    +   '<option value="both">'+esc(t('الاثنان معًا'))+'</option></select></div>'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الرسوم البيانية'))+'</label>'
    +   '<select><option value="مضمّنة">'+esc(t('مضمّنة'))+'</option><option value="بدونها">'+esc(t('بدونها'))+'</option></select></div>'
    + '</div>'
    + '<div class="actions">' + btn('تصدير','btn-primary',' data-expgo="1"')
    +   btn('إلغاء','btn-secondary',' data-exp="0"') + '</div></div>'
    + '<p class="hint" style="font-size:11.5px">'
    +   esc(t('الإكسل ورقةٌ لكل قسم بعناوينها كما تظهر على الشاشة · والPDF صفحةٌ لكل قسم برسمها البياني.')) + '<br>'
    +   esc(t('يُصدَّر ما بعد التصفية — وبلا تصفيةٍ يُصدَّر الكلّ.'))
    + '</p></div>';
}

