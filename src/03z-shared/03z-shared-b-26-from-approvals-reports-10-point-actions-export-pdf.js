/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-26-from-approvals-reports-10-point-actions-export-pdf.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : expSecs, expHtml
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
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
    +   '<option value="pdf">'+esc(t('ملف للطباعة — بالرسوم البيانية'))+'</option>'
    +   '<option value="both">'+esc(t('الاثنان معًا'))+'</option></select></div>'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الرسوم البيانية'))+'</label>'
    +   '<select><option value="مضمّنة">'+esc(t('مضمّنة'))+'</option><option value="بدونها">'+esc(t('بدونها'))+'</option></select></div>'
    + '</div>'
    + '<div class="actions">' + btn('تصدير','btn-primary',' data-expgo="1"')
    +   btn('إلغاء','btn-secondary',' data-exp="0"') + '</div></div>'
    + '<p class="hint" style="font-size:11.5px">'
    +   esc(t('الإكسل ورقةٌ لكل قسم بعناوينها كما تظهر على الشاشة · وملفُّ الطباعة صفحةٌ لكل قسم برسمها البياني.')) + '<br>'
    +   esc(t('يُصدَّر ما بعد التصفية — وبلا تصفيةٍ يُصدَّر الكلّ.'))
    + '</p></div>';
}
