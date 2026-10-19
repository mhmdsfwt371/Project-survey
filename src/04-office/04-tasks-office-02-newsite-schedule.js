/* ============================================================================
   FILE    : src/04-office/04-tasks-office-02-newsite-schedule.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Unregistered site added from the field, who decides what it becomes, visit recorded on add, and scheduling visits for office-added points.
   DEFINES : nsNear, coHit, nsCoRows, nsCoCard, nsCapture, nsCoRequest, nsOffice, typeCode, nsName, nsVisitRec, visitAsnOpen, nsSave
   GLOBALS : WA_CO, WR_EDIT, NEWSITE, NS_CENTERS, NS_REASONS_PT, NS_CO_OPEN, NS_REASONS, NS_PHOTOS, NS_SIGN_RE, NS_SQ_RE … (+1 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

var WR_EDIT = '';      /* (V29.7) الاسمُ والمركزُ والتحديات */

/* صيغةُ الشاخص: اسم الخيمة/رقم الشارع — 57/2 و12أ/8 كلاهما صحيح */
var NS_SIGN_RE = /^[0-9A-Za-z\u0621-\u064A]+(?:[-\/][0-9A-Za-z\u0621-\u064A]+)+$/;
var NS_SQ_RE   = /^[0-9A-Za-z\u0621-\u064A]+(?:-[0-9A-Za-z\u0621-\u064A]+)*$/;

function nsCapture(){
  if (!navigator.geolocation){ toast(t('تعذّر تحديد الموقع')); return; }
  toast(t('يُلتقَط موضعك…'));
  navigator.geolocation.getCurrentPosition(function(p){
    NEWSITE.lat = p.coords.latitude; NEWSITE.lng = p.coords.longitude;
    MYPOS = { lat:NEWSITE.lat, lng:NEWSITE.lng, at:Date.now() };
    toast(t('التُقط'));
    render(1);
  }, function(){ toast(t('تعذّر تحديد الموقع')); }, { enableHighAccuracy:true, timeout:10000 });
}

/* طلبُ إضافة شركةٍ إلى القائمة الموحّدة — يُسجَّل ولا يدخل القائمة قبل اعتماد المهندس */
function nsCoRequest(){
  var el = document.getElementById('nsCoNew');
  var nm0 = el ? String(el.value || '').trim() : '';
  if (!nm0){ toast(t('اكتب اسم الشركة أولًا')); return; }
  if (CO_LIST.indexOf(nm0) > -1){
    NEWSITE.co = nm0; NEWSITE.coReq = ''; NS_CO_OPEN = false;
    toast(t('موجودة في القائمة — اختِيرت'));
    render(1); return;
  }
  if (!STATE.coreqs) STATE.coreqs = {};
  if (STATE.coreqs[nm0]){
    NEWSITE.coReq = nm0; NEWSITE.co = ''; NS_CO_OPEN = false;
    toast(t('سبق إرسالُ طلبٍ لهذه الشركة — بانتظار اعتماد المهندس'));
    render(1); return;
  }
  NEWSITE.coReq = nm0; NEWSITE.co = '';
  STATE.coreqs[nm0] = { name:nm0, by:STATE.meta.name || '', at:Date.now(), status:'مطلوب' };
  CORE.set('coreqs', nm0, STATE.coreqs[nm0]);
  logEvent('طلب إضافة شركة — ' + nm0);
  notifPush('طلب شركة', 'طلبُ إضافة شركةٍ بانتظار اعتمادك — ' + nm0, { lv:'مهم' });
  NS_CO_OPEN = false;
  toast(t('أُرسل الطلب — يعتمده المهندس'));
  render(1);
}

/* اسمُ النقطة الجديدة: المخيمُ بمربعه وشاخصه، وغيرُه بنوعه ومشعره — كان كلُّ
   ما ليس مخيمًا يُسمّى «منى - مربع  - شاخص » بخانتين فارغتين */
function nsName(id){
  if (NEWSITE.type === 'مخيم') return NEWSITE.zone + ' - مربع ' + NEWSITE.sq + ' - شاخص ' + NEWSITE.sign;
  var ty = NEWSITE.type, d = CAT_DEF[ty] || {};
  var tn = /[\u0600-\u06FF]/.test(ty) ? ty : (d.l || ty);
  return tn + ' - ' + NEWSITE.zone + ' - ' + String(id).split('-').pop();
}

/* ═══ زيارةُ الميدان تُسجَّل بإضافة النقطة (V17.57) ═══
   الواقفُ عند النقطة صوّرها — فالإضافةُ زيارة: تُكتَب بانتظار الاعتماد وتحمل
   صورَها، ثم يُفتَح نموذجُ المسح لتُستكمَل بياناتُها، ولا يُعتمَد ما لم يُستكمَل. */
function nsVisitRec(id){
  var keys = Object.keys(NEWSITE.photos || {}).filter(function(k){ return NEWSITE.photos[k]; });
  return CORE.set('recs', id, {
    id:id, by:STATE.meta.name || '', at:Date.now(), access:'تم الوصول', review:'pending',
    src:'newsite', photos:keys.map(function(k){ return 'new_' + k; }), phN:keys.length,
    chals:(NEWSITE.chals || []).slice(),   /* (V29.7) التحدياتُ من نموذج الموقع الجديد */
    note:String(NEWSITE.why || '').trim()
  });
}

/* ═══ جدولةُ زيارةٍ لما أضافه المكتب (V17.57) ═══
   نقطةُ المكتب لم يزرها أحد: لا نموذجَ مسحٍ يُفتَح عليها، بل لوحُ الإسناد في
   طبقة المسح وهي محدَّدةٌ فيه — يُختار من يزورها وموعدُه ويُسنَد. */
function visitAsnOpen(ids, quiet){
  ids = (Array.isArray(ids) ? ids : [ids]).filter(function(id){ return !!siteFind(id); });
  if (!ids.length){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  selClear();
  ids.forEach(function(id){ if (!asnOf(id)){ SEL[id] = 1; SEL_N++; } });
  FIELD_MODE = 'survey'; ASN_KIND = 'visit'; ASN_PICK = false; ASN_BASE = [];
  POP_OPEN = false; MAP_SELECT = false;
  goPage('map'); ASN_OPEN = true;
  if (!quiet) toast(t('جدوِل زيارتَها: اختر من يزورها وموعدَه ثم «أسند»'));
  render(1);
  return true;
}

function nsSave(){
  var minProp = ROLE === 'viewer', office = nsOffice() || minProp;   /* (V37.68) قرارُ المالك: نقطةُ الوزارة «مقترحة» يعتمدها المهندس — بلا صورٍ إلزاميةٍ ولا زيارة */
  var lat = NEWSITE.lat || (MYPOS && MYPOS.lat), lng = NEWSITE.lng || (MYPOS && MYPOS.lng);
  if (!lat || !lng){ toast(t('التقط موضعك أولًا')); return; }

  NEWSITE.sq   = String(NEWSITE.sq   || '').trim();
  NEWSITE.sign = String(NEWSITE.sign || '').trim();

  if (!NEWSITE.zone || !NEWSITE.type){ toast(t('اختر المشعر ونوع الموقع')); return; }
  var camp = NEWSITE.type === 'مخيم';
  /* المربعُ والشاخصُ للمخيم وحدَه؛ وغيرُه يُحفَظ بلا مربعٍ ولا شاخص */
  if (camp){
    if (!NEWSITE.sq){   toast(t('رقم المربع مطلوب')); return; }
    if (!NEWSITE.sign){ toast(t('رقم الشاخص مطلوب')); return; }
    if (!NS_SQ_RE.test(NEWSITE.sq)){
      toast(t('رقم المربع: أرقامٌ أو أرقام-أرقام — مثال 7 أو 7-14')); return; }
    if (!NS_SIGN_RE.test(NEWSITE.sign)){
      toast(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')); return; }
  } else { NEWSITE.sq = ''; NEWSITE.sign = ''; }
  if (!minProp && camp && NEWSITE.reason !== 'عدم وجود تخصيص' && !NEWSITE.co && !NEWSITE.coReq){
    toast(t('اختر شركة الخدمة من القائمة — أو اطلب إضافتها، أو اختر السبب «عدم وجود تخصيص»')); return; }
  /* المركَّبةُ لا تُطابِق القائمةَ نصًّا — يُقبَل ما كانت أجزاؤه كلُّها فيها */
  if (NEWSITE.co && CO_LIST.indexOf(NEWSITE.co) < 0
      && !siteCos({ co:NEWSITE.co }).every(function(one){ return CO_LIST.indexOf(one) > -1; })){
    toast(t('اسم الشركة يجب أن يكون من القائمة الموحّدة فقط')); return; }
  /* (V29.7) غيرُ المخيم: اسمُه إلزاميٌّ لمن يقف عندها (والمكتبُ يأخذ الاسمَ المبنيَّ من النوع والمشعر إن تركه)، ومراكزُ التفويج بمركزها؛
     والسببُ والتحدياتُ وأوّلُ صورتين إلزاميةٌ للميدان — والمكتبُ لم يقف عند النقطة فيجدوِل زيارتَها */
  NEWSITE.nm = String(NEWSITE.nm || '').trim();
  /* الصورةُ إلزاميةٌ لمن يقف عند النقطة — والمكتبُ لم يقف (V17.57) */
  if (!office && !NEWSITE.photos[0]){ toast(t('صورة الشاخص إلزامية للاعتماد')); return; }
  if (!camp && !office && !NEWSITE.nm){ toast(t('اسم النقطة مطلوب')); return; }
  if (NEWSITE.type === 'LPR' && !NEWSITE.center){ toast(t('اختر المركز: النورية أو طريق الهجرة أو الزايدي')); return; }
  if (!office && !NEWSITE.reason){ toast(t('اختر سببَ عدم وجوده في السجل')); return; }
  if (!office && !(NEWSITE.chals || []).length){ toast(t('اختر التحديات — أو «لا توجد تحديات»')); return; }
  if (!office && !NEWSITE.photos[1]){ toast(t('أوّلُ صورتين إلزاميتان: الشاخص أو اللوحة، ولقطةٌ عامةٌ للموقع')); return; }   /* (V29.7) والثانيةُ أيضًا */
  if (!camp){ NEWSITE.co = ''; NEWSITE.coReq = ''; NEWSITE.tents = ''; }

  var pre = zoneCode(NEWSITE.zone);
  var tp  = typeCode(NEWSITE.type);
  var n = STATE.sites.filter(function(x){ return x.id.indexOf('NSK-' + pre + '-' + tp + '-N') === 0; }).length + 1;
  var id = 'NSK-' + pre + '-' + tp + '-N' + String(n).padStart(3, '0');

  var site = {
    id:id, name:(!camp && NEWSITE.nm) ? NEWSITE.nm : nsName(id),   /* (V29.7) غيرُ المخيم باسمه المكتوب */
    zone:NEWSITE.zone, type:NEWSITE.type, work:'موقع جديد',
    tg:NEWSITE.type === 'LPR' ? 'مراكز التفويج' : '', tt:NEWSITE.type === 'LPR' ? NEWSITE.center : '',
    chals:(NEWSITE.chals || []).slice(),
    lat:lat, lng:lng, sq:NEWSITE.sq, sign:NEWSITE.sign,
    co:NEWSITE.co, coReq:NEWSITE.coReq, tents:cfgN(NEWSITE.tents),
    reason:NEWSITE.reason, why:NEWSITE.why,
    region:'منطقة ' + NEWSITE.zone, fstat:'لم يبدأ', inout:'',
    isNew:true, approved:false, by:STATE.meta.name || '', at:Date.now(),
    origin:minProp ? 'ministry' : (office ? 'office' : 'field'),
    note:NEWSITE.note
  };
  if (NEWSITE.ex47 && !minProp) site.ex47 = NEWSITE.ex47;   /* (V37.92) نقطةٌ من ملف ١٤٤٧ وُضعت على الخريطة */
  if (minProp) propKeep(site); else STATE.sites.push(site);   /* (V37.69) المقترحةُ خارجَ السجلِّ حتى الاعتماد */
  SITE_IX = null; SITE_TOK = null;
  CORE.set('newsites', id, site);
  if (NEWSITE.orph && !minProp && typeof ex47OrphDrop === 'function') ex47OrphDrop(NEWSITE.orph);   /* (V37.92) */

  /* الصورُ إلى درايف كسائر صور النظام — لا إلى القاعدة.
     كانت تُكتَب خامًّا هنا وحدها: خمسُ صورٍ بمئتي كيلو تقارب حدَّ الوثيقة
     الواحدة، وتلتهم الجيجابايتَ المتاحَ في أيام. */
  if (!minProp) Object.keys(NEWSITE.photos).forEach(function(i){
    var p = NEWSITE.photos[i];
    if (typeof photoQueue === 'function') photoQueue(id, 'new_' + i, p && (p.d || p.data));
  });

  if (!office) nsVisitRec(id);
  if (!minProp) stepDone('newsite', id, office ? 'أضافها المكتب — تُجدوَل زيارتُها' : 'أُضيفت في الموقع — تُحتسَب زيارة', 0);
  if (!minProp) notifPush('موقع مقترح', 'موقعٌ جديدٌ بانتظار اعتمادك — ' + NEWSITE.zone,
            { site:id, lv:'مهم' });
  if (!minProp) logEvent('موقع جديد — ' + id + ' · ' + NEWSITE.zone
    + (NEWSITE.coReq ? ' · طلب شركة: ' + NEWSITE.coReq : ''), id);
  statBump();
  toast(id + ' \u00b7 ' + t(minProp ? 'أُرسلت مقترحةً من الوزارة — يعتمدها المهندس' : office ? 'سُجّلت — جدوِل زيارتَها الآن' : 'سُجّلت زيارةً — أكمل بياناتِ المسح')); if (minProp) CUR = 'map';

  NEWSITE = { lat:0, lng:0, zone:NEWSITE.zone, type:NEWSITE.type, sq:'', sign:'',
              co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{}, nm:'', center:'', chals:[] };
  NS_CO_OPEN = false; NS_CO_Q = '';

  /* المكتبُ لم يزرها: لا نموذجَ مسحٍ يُفتَح بل لوحُ الإسناد عليها — فتُجدوَل
     زيارتُها الآن ولا تُنسى (V17.57). والميدانُ زارها فعلًا: يُفتَح نموذجُ
     المسح عليه فورًا — الشاشةُ تُنشئه، والنموذجُ يُكمله */
  if (office){ (minProp ? false : visitAsnOpen(id)); return; }
  DETAIL_ID = id;
  formGo(id, 'new');
  CUR = 'svForm';
  render(1);
}

