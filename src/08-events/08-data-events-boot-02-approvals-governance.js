/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-02-approvals-governance.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Approvals from proposal to decision, ministry financial summary, governance gaps, escalation, responsibility matrix and stage chain.
   DEFINES : fixList, coReqList, fixCard, escList, escSave, escSet, raciList, raciSave, raciSet
   GLOBALS : FIX_OPEN, ESC_RULES
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الاعتمادات: من الاقتراح إلى القرار ═══════════════════════════════════
   كانت الشاشةُ أربعةَ أصفارٍ ثابتةٍ ورسمًا للدورة — «يقترح المشرف ← يراجع
   المهندس ← يُعتمد أو يُردّ» — ودورةٌ مرسومةٌ لا تُنفَّذ أسوأُ من غيابها:
   يقرؤها المشرفُ فيقترح، ولا يجد المهندسُ ما يعتمده.

   والمقترحاتُ ثلاثةُ أنواعٍ لكلٍّ مصدرُه:
     · شركةٌ جديدة   — من الميدان عند تسجيل موقعٍ مقترح
     · تصويبُ بيان   — من نموذج المسح حين يجد الفنيُّ خلافَ المسجَّل
     · مشترًى فوق الحدّ — يُنشئه النظامُ حين يتجاوز المبلغُ حدَّ الاعتماد
       المضبوطَ في «الميزانية والاعتماد» */

function fixList(){
  var F = STATE.fixreqs || {};
  return Object.keys(F).map(function(k){ return F[k]; }).filter(Boolean);
}
function coReqList(){
  var C = STATE.coreqs || {};
  return Object.keys(C).map(function(k){ return C[k]; })
    .filter(function(x){ return x && x.status === 'مطلوب'; });
}


/* طلبُ تصويبٍ من الميدان — كان زرًّا يقول «طُلب» ولا يكتب شيئًا،
   فيمضي الفنيُّ مطمئنًّا والخطأُ باقٍ في السجل. */
var FIX_OPEN = '';


function fixCard(siteId){
  if (FIX_OPEN !== siteId) return '';
  var FIELDS = [['sq','رقم المربع'], ['sign','رقم الشاخص'], ['co','شركة تقديم الخدمة'],
                ['inout','تصنيف الحجاج'], ['work','وجه العمل'], ['zone','المشعر'],
                ['type','نوع الموقع'], ['name','اسم الموقع']];
  return card('طلب تصويب بيان',
    '<div class="grid cols-2">'
    + '<div class="field"><label>' + esc(t('الحقل')) + '</label><select id="fxField">'
    +   FIELDS.map(function(f){ return '<option value="' + f[0] + '">' + esc(t(f[1])) + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="field"><label>' + esc(t('القيمة الصحيحة')) + '</label>'
    +   '<input id="fxVal" dir="auto"></div>'
    + '</div>'
    + '<div class="field"><label>' + esc(t('لماذا؟')) + '</label>'
    + '<textarea id="fxWhy" rows="2" placeholder="'
    +   esc(t('ما رأيتَه في الموقع — والمهندسُ يقرّر على ما تكتب')) + '"></textarea></div>'
    + '<div class="actions">'
    + btn('أرسل الطلب','btn-primary',' data-fixsend="' + esc(siteId) + '"')
    + btn('إلغاء','btn-quiet',' data-fix="0"')
    + '</div>');
}


/* القرار: اعتمادٌ يُنفِّذ الأثر، وردٌّ يُبقيه مكتوبًا بسببه.
   ولا يُحذَف الطلبُ في الحالين — الأثرُ التدقيقيُّ يبقى. */


/* حساب المستخدم */
PAGE.acct = { m:'المساعدة', t:'حسابي', l:'دورك وصلاحياتك ونسختك — وإعداداتُ هذا الجهاز.',
  body:function(){
    var r = R();
    var keys = [['edit','تحرير البيانات'],['approve','الاعتمادات'],['settings','الإعدادات'],
                ['money','المال والمشتريات'],['inventory','المخزون والعُهدة'],['workshop','الورشة'],
                ['exportAll','التصدير الكامل'],['importAll','الاستيراد'],
                ['users','إدارة المستخدمين'],['phones','أرقام الهواتف']];
    return card('دوري',
        '<div class="pop-rows" style="margin:0">'
        + '<div><span class="k">'+esc(t('الاسم'))+'</span><span>'+esc(dispName(STATE.meta.name || ''))+'</span></div>'
        + '<div><span class="k">'+esc(t('الدور'))+'</span>'+pill(r.n,'acc')+'</div>'
        + '<div><span class="k">'+esc(t('الوصف'))+'</span><span>'+esc(t(r.d))+'</span></div>'
        + '<div><span class="k">'+esc(t('النسخة'))+'</span><span class="num">' + esc(typeof verShow === 'function' ? verShow(appVer()) : appVer()) + '</span></div>'   /* (V39.12) in the language's digits */
        + '</div>')
      + card('ما أملكه',
          table(['الصلاحية','لي'],
            keys.map(function(k){
              return [esc(t(k[1])), may(k[0]) ? pill('نعم','ok') : pill('لا','off')];
            })))
      /* تبديلُ الدور إدارةُ صلاحياتٍ لا معاينة: من ملكه ملك كلَّ شيء.
         كان ظاهرًا لكلِّ دورٍ فيجعل المشرفُ نفسَه مهندسًا بضغطة. */
      + (may('users')
        ? card('تجربة الأدوار',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t('بدّل الدور لترى النظام بعين صاحبه — القائمة والشاشات تتغيّر فورًا.'))+'</p>'
          + '<div class="chips" style="margin:0">'
          + Object.keys(ROLES).map(function(k){
              return '<button type="button" class="chip'+(ROLE===k?' on':'')+'" data-role="'+k+'">'
                + esc(t(ROLES[k].n))+'</button>';
            }).join('') + '</div>')
        : '')
      + iosHelpCard()
      + card('التطبيق على الجهاز',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t(pwaStandalone()
              ? 'مثبَّتٌ ويعمل ملءَ الشاشة — يفتح بلا شبكةٍ وتصله الإشعارات.'
              : 'ثبّته على الشاشة الرئيسية: يفتح ملءَ الشاشة، ويعمل بلا شبكة، وتصله الإشعارات.'))
          + '</p>'
          + '<div class="actions">'
          /* كان مخفيًّا حتى يقع حدثُ التثبيت — وآيفونُ لا يقع فيه حدثٌ أبدًا،
             فيبقى مخفيًّا على نصف أجهزة الميدان. */
          + '<button type="button" class="btn btn-primary" data-pwa="1">'   /* (V39.34) the review sweep: «pwaBtn» is the top bar's id — two elements had it */
          +   '⬇ ' + esc(t('ثبّت التطبيق')) + '</button>'
          + btn('أفرغ الكاش','btn-danger',' data-swclear="1"')

          + '</div>'
          + '<p class="hint">' + esc(t('التثبيت يُبقي التطبيق عاملًا بلا شبكة، والإفراغُ يُجبره على تحميلٍ نظيفٍ عند أول اتصال.')) + '</p>'
          + '<p class="hint" id="libsLine" style="margin:6px 0 0"></p>')   /* (V38.54) vendored libraries on this device */
      + (setTimeout(libsLinePaint, 0), '')
      + '<p class="hint">' + esc(t('إشارات الأجهزة أسرع ما ينمو:')) + ' <b class="num">' + nm((STATE.sites || []).length) + '</b> ' + esc(t('جهازًا × إشارة كل خمس دقائق = نصف مليون سجل يوميًّا لو تُركت بلا سقف.')) + '</p>'
      + deviceCards();
  }};

/* ── ٦ · تعارض المزامنة ───────────────────────────
   الميدان بلا شبكة، وتحريران على نقطة واحدة يتصادمان. */


/* المحدَّد — بعد التحديد المتعدد من الخريطة */


/* ═══ الملخّصُ المالي للوزارة — إجمالٌ بلا مورّدٍ ولا فاتورة ═══
   المتابعةُ تحتاج الرقمَ لا التفصيل: كم أُنفق ومن أيّ باب، لا من مَن اشتُري. */

/* ═══ الحوكمة — أربع فجوات تُسدّ ═══ */

/* ── ٢ · مسار التصعيد ─────────────────────────────
   الحالة العالقة تظهر في «الراكد» ولا يُخطَر أحد. القاعدة تُصعّد بالعمر. */

PV.ESC_RULES = [
  ['متعذّر بلا معالجة',      7,  'المشرف',  'المهندس',   'يُعاد فتحه ويُسند لفريق آخر'],
  ['مقترح شركة بانتظار',      3,  'المهندس', 'المهندس',   'يُذكَّر يوميًّا حتى يُبتّ'],
  ['طلب زيارة بلا تنفيذ',    5,  'الفني',   'المشرف',    'يُعاد إسناده'],
  ['نقطة مجدولة لم تُركّب',   10, 'الفريق',  'المهندس',   'تخرج من الجدولة وتعود للطابور'],
  ['تركيب بانتظار التدقيق',  3,  'المهندس', 'المهندس',   'يُعتمد أو يُردّ بسبب'],
  ['مشترى فوق الحد',          2,  'المهندس', 'المهندس',   'يُعتمد أو يُلغى'],
  ['جهاز صامت',              1,  'المهندس', 'المهندس',   'يدخل قائمة الزيارة الميدانية'],
  ['عُهدة لم تُرجَع بعد الفك', 14, 'الفريق',  'المهندس',   'تُحتسب عجزًا على المنفِّذ']
];

/* ═══ التصعيد والمسؤوليات: قوائمُ تُدار لا جداولُ تُقرأ ═══════════════════
   كانت قواعدُ التصعيد جدولًا ثابتًا وزرَّ «حفظ القواعد» بلا خاصية: يُغيَّر
   العددُ ويُضغَط الزرُّ فيُقال «حفظ القواعد» ولا يُحفَظ شيء. والقاعدةُ التي
   لا تُضبَط لا يُصعَّد بها، فيبقى المتعذّرُ متعذّرًا إلى نهاية الموسم. */

function escList(){
  if (!Array.isArray(STATE.escRules) || !STATE.escRules.length){
    STATE.escRules = PV.ESC_RULES.map(function(r){
      return { w:r[0], days:r[1], who:r[2], to:r[3], act:r[4] };
    });
  }
  return STATE.escRules;
}
function escSave(){ CORE.set('cfg', 'escRules', escList().slice()); }
function escSet(i, patch){
  if (!may('settings')) return;
  var r = escList()[i]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  escSave();
}


/* ═══ مصفوفة المسؤوليات ═══ */
function raciList(){
  if (!Array.isArray(STATE.raci) || !STATE.raci.length){
    STATE.raci = RACI_ACTS.map(function(r){ return { a:r[0], R:r[1], A:r[2], C:r[3], I:r[4] }; });
  }
  return STATE.raci;
}
function raciSave(){ CORE.set('cfg', 'raci', raciList().slice()); }
function raciSet(i, patch){
  if (!may('settings')) return;
  var r = raciList()[i]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  raciSave();
}


/* ── ٣ · سجل التدقيق ──────────────────────────────
   العملية تُسجَّل ولا يُعرف من غيّرها ولا لماذا رُفضت. */


/* ── ٤ · عمر البيانات ─────────────────────────────
   سجل إلحاقي بلا سقف ينمو حتى يخنق الموسم. */


