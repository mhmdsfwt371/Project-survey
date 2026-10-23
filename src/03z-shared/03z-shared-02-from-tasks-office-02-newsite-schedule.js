/* ============================================================================
   FILE    : src/03z-shared/03z-shared-02-from-tasks-office-02-newsite-schedule.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-02-newsite-schedule.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : NEWSITE, NS_CENTERS, NS_REASONS_PT, NS_CO_OPEN, NS_CO_Q, NS_REASONS, NS_PHOTOS, nsNear, coHit, nsCoRows, nsCoCard, nsOffice, TYPE_CODE, typeCode
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* طلبُ الورشة المفتوحُ للتعديل */
var NEWSITE = { lat:0, lng:0, zone:'منى', type:'مخيم', sq:'', sign:'',
                co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{}, nm:'', center:'', chals:[] };

/* (V29.7) قرارُ المالك: المربعُ والشاخصُ والشركةُ للمخيمات وحدَها؛ وغيرُها اسمٌ ومشعرٌ ونوع. والسببُ والتحدياتُ وأوّلُ صورتين إلزاميةٌ للكلّ.
   ومراكزُ التفويج تُختار بمركزها (النورية، طريق الهجرة، الزايدي) — كان «الزايدي» لا يُوجَد في الاختيار. */
var NS_CENTERS = [['النورية', 'النورية'], ['طريق الهجرة', 'محطات طريق الهجرة'], ['الزايدي', 'الزايدي']];

var NS_REASONS_PT = ['نقطة جديدة لم تكن في السجل', 'موقعها في السجل خاطئ', 'سبب آخر'];

var NS_CO_OPEN = false, NS_CO_Q = '';

/* أسبابُ عدم وجوده في السجل — من الميدان لا من الخيال */
var NS_REASONS = ['مخيم جديد لم يكن موجودًا','مخيم انقسم إلى أكثر من واحد',
                  'عدم وجود تخصيص','تغيّر ترقيم الشاخص',
                  'الشاخص مفقود أو غير واضح','سبب آخر'];

/* الصورُ الخمس — الأولى وحدها إلزامية، بها يطابق المكتبُ الموقع */
var NS_PHOTOS = ['صورة الشاخص أو اللوحة بأرقامها واضحة','لقطة عامة للموقع','المدخل',
                 'نقطة التركيب المقترحة','أي عائق أو ملاحظة'];

/* المسجَّلُ داخل مئةٍ وأربعين مترًا — أغلبُ «المخيم غير موجود» وقوفٌ بجانب مسجَّل */
function nsNear(){
  var la = NEWSITE.lat || (MYPOS && MYPOS.lat), lo = NEWSITE.lng || (MYPOS && MYPOS.lng);
  if (!la || !lo) return null;
  var me = { lat:la, lng:lo };
  return STATE.sites.filter(function(x){ return x.lat && x.lng; })
    .map(function(x){ return { s:x, d:(distKm(me, x) || 0) * 1000 }; })
    .filter(function(x){ return x.d < 140; })
    .sort(function(a,b){ return a.d - b.d; }).slice(0, 5);
}

/* القائمةُ الموحّدة مرشَّحةً بالبحث — والمرجعُ بياناتُ المشروع لا قائمةٌ مكتوبةٌ بيد */
function coHit(c, q){
  if (!q) return true;
  var s2 = String(q).toLowerCase();
  return c.toLowerCase().indexOf(s2) > -1 || String(coName(c)).toLowerCase().indexOf(s2) > -1;
}

function nsCoRows(){
  var q = String(NS_CO_Q || '').trim();
  return CO_LIST.filter(function(c){ return coHit(c, q); });
}

function nsCoCard(){
  var rows = nsCoRows();
  return card('شركة تقديم الخدمة — القائمة الموحّدة',
    '<div class="field"><input type="search" id="nsCoQ" data-nsq="1" value="' + esc(NS_CO_Q) + '" '
    + 'placeholder="' + esc(t('ابحث باسم الشركة')) + '" spellcheck="false"></div>'
    + '<div style="max-height:44vh;overflow:auto;border:1px solid var(--line);border-radius:var(--radius-sm)">'
    + (rows.length
        ? rows.map(function(c){
            /* القيمةُ عربيةٌ (المفتاح) والنصُّ بلغة الواجهة */
            return '<button type="button" class="btn btn-quiet" data-nscopick="' + esc(c) + '" '
              + 'style="width:100%;justify-content:flex-start;text-align:start;border:0;'
              + 'border-bottom:1px solid var(--line-2);border-radius:0;min-height:44px">'
              + '<i style="width:10px;height:10px;border-radius:50%;background:' + coColor(c)
              + ';flex:0 0 auto;margin-inline-end:8px"></i>' + esc(coName(c)) + '</button>';
          }).join('')
        : '<p class="hint" style="padding:14px">' + esc(t('لا نتائج')) + '</p>')
    + '</div>'
    + '<div class="grid cols-2" style="margin-top:12px">'
    + '<div class="field"><label>' + esc(t('اسم شركة غير موجودة بالقائمة')) + '</label>'
    + '<input id="nsCoNew" dir="auto" placeholder="' + esc(t('يعتمده المهندس قبل أن يُستعمل')) + '"></div>'
    + '<div class="field"><label>&nbsp;</label>'
    + btn('+ إضافة للقائمة','btn-secondary',' data-nscoreq="1" style="width:100%"') + '</div>'
    + '</div>'
    + '<p class="hint">' + esc(t('غير الموجودة تُطلب من المهندس ولا تدخل القائمة قبل اعتماده.')) + '</p>',
    btn('إغلاق','btn-quiet btn-sm',' data-nsco="0"'));
}

/* ═══ من يضيف النقطةَ يقرّر ما تكونه (V17.57) ═══
   «نقطة هنا» أداةُ المكتب: المهندسُ يضعها من الخريطة ولم يقف عندها — فلا صورَ
   تُطلَب، ولا تُحتسَب زيارة، ويُفتَح بعدها لوحُ الإسناد لتُجدوَل زيارتُها.
   والمشرفُ أو الفنيُّ يضيفها واقفًا عندها — فالصورةُ إلزامية، والإضافةُ زيارةٌ
   تُكتَب بانتظار الاعتماد ثم يُستكمَل مسحُها. والفرقُ بالرتبة لا بالزرّ: من
   أضاف من «موقع غير مسجّل» بموضعه وهو مهندسٌ فإضافتُه إضافةُ مكتب. */
function nsOffice(){ return rankOf(effRole(ROLE)) >= rankOf('engineer'); }

/* رمزُ النوع في المعرِّف — جدولٌ واحدٌ لكلِّ من يُنشئ نقطة (V17.60) */
var TYPE_CODE = { 'مخيم':'CMP', 'ممر':'RDR', 'كاميرا':'CAM', 'محطة':'STN', 'جسر':'JMR', 'بوابة':'GTE', 'مبنى':'BLD',
                  'LPR':'LPR', 'جيت واي':'GTW', 'حساس حرارة ورطوبة':'THS' };


