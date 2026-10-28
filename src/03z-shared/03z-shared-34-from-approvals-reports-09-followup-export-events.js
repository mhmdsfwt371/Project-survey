/* ============================================================================
   FILE    : src/03z-shared/03z-shared-34-from-approvals-reports-09-followup-export-events.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-09-followup-export-events.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : evKind, evCat, evNames, evActor, evAll, evNorm, evRows
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ سجلُّ الأحداث ═══
   كان يعرض خمسةَ أسطرٍ ثابتةً من بيانات العرض لا السجلَّ الحقيقي — فالأثرُ
   التدقيقيُّ يُكتَب ولا يُقرأ، ومن سأل «من حذف هذه الصورة؟» لم يجد جوابًا.
   والحدثُ نصٌّ حر، فنوعُه يُشتقُّ من مفتتحه لا يُخزَّن معه. */
PV.EV_KINDS = [
  ['مسح',    /^مسح موقع|^تعذّر الوصول/],
  ['تركيب',  /^تركيب|^إتمام تركيب|^مسودّة تركيب/],
  ['اعتماد', /^اعتماد|^ردّ |^رُدّ/],
  ['فك',     /فك —|^جدولة فك/],
  ['صور',    /صورة/],
  ['حسابات', /^حساب|^طلب إضافة شركة/],
  ['مواقع',  /^موقع جديد/],
  ['مخزون',  /^عهدة|^صرف|^توريد|^شراء|^مشترى/],
  ['مال',    /^مستخلص|^ميزانية|^خط أساس/],
  ['نظام',   /^استيراد|^تصدير|^إعداد|^مزامنة/]
];

function evKind(what){
  var w = String(what || '');
  for (var i = 0; i < PV.EV_KINDS.length; i++) if (PV.EV_KINDS[i][1].test(w)) return PV.EV_KINDS[i][0];
  return 'أخرى';
}

/* ═══ التصنيفُ بالفعل لا بكلمةٍ عابرة (V17.31) ═══
   كان «مالي» أوّلَ القائمة ونمطُه يشمل كلمةَ «اعتماد» — وكلُّ إشعارِ زيارةٍ
   ينتهي بـ«بانتظار اعتمادك». فصُنِّفت ثلاثُمئةٍ وإحدى وأربعون زيارةً مالًا،
   وقُرئت الشاشةُ على أن المشروعَ يصرف وهو يمسح. فصار التصنيفُ بالفعل نفسِه:
   أخصُّ الأنماط أولًا (زيارةٌ · تركيبٌ · فكٌّ · صورةٌ · مهمة)، ثم القرارُ
   (اعتمادٌ · ردٌّ ورفض)، ثم المالُ بكلماته وحدَه لا بكلمةٍ يشترك فيها مع
   غيره، ثم التعديلُ والدخول. والمالُ يُطابَق بما لا يقع إلا فيه: مشترياتٌ
   ومبلغٌ وسعرٌ وميزانيةٌ ومستخلصٌ وريال. */
var EV_CATS = [
  /* الردُّ قرارٌ لا زيارة — يُفحَص قبلها فلا تبتلعه كلمةُ «زيارة» فيه */
  ['رفض وحذف',  /رُدّت|رُفض|رفض|أُلغي|حُذف|شُطب|تراجعٌ عن ردّ/],
  ['زيارة',     /^زيارة|زيارة تمّت|مسح ميداني|تعذّر الوصول/],
  ['تركيب',     /^تركيب|رُكّب|تجميع|إعداد تركيب|حلّ تركيب/],
  ['فكّ',       /^فك|فكّ|إرجاعُ عهدة|جدولة فك/],
  ['صور',       /صورة|صور /],
  ['مهام',      /إسناد|مهمة|مهامّ|جدولة/],
  ['مخزون',     /مخزون|عهدة|شحنة|صرف قطع|استلام/],
  ['مالي',      /مشتر|مبلغ|سعر|ميزانية|مستخلص|ريال|فاتورة|حافز/],
  ['اعتماد',    /اعتُمد|اعتمادُ|الاعتماد|مُنحت|صُدِّق/],
  ['تعديل',     /عُدّل|تعديل|تغيير|حُدِّث/],
  ['حسابات',    /حساب|كلمة المرور|صلاحية|دور/],
  ['دخول',      /دخول|خروج|جلسة/]
];

function evCat(what){
  var w = String(what || '');
  for (var i = 0; i < EV_CATS.length; i++) if (EV_CATS[i][1].test(w)) return EV_CATS[i][0];
  return '';
}

var EVF = { kind:'', by:'', from:'', to:'', q:'', cat:'' };

/* ═══ الفاعلُ يُقرأ من نصِّ الحدث حين لا يحمله حقلُه (V17.29) ═══
   الأحداثُ المكتوبةُ قبل وسم الفاعل تحمل اسمَ صاحب الجهاز في حقل «من»،
   واسمُ الفاعل الحقيقيِّ **مكتوبٌ في نصِّها**: «إشعار — زيارة تمّت ·
   NSK-MIN-CMP-0149 · عمار حسين احمد عميش — بانتظار اعتمادك». ولا يجوز أن
   يُكتَب على الوثيقة المخزَّنة اسمٌ لم تُكتَب به — تزويرٌ في سجلِّ تدقيق.
   فيُقرأ للعرض فقط: إن ذُكر في النصِّ اسمُ حسابٍ من حسابات النظام غيرِ
   صاحب الجهاز فهو الفاعل، ويُقال إنه مقروءٌ من النصّ لا مختومٌ في الحقل. */
PV.EV_NAMES = null; PV.EV_NAMES_V = 0;

function evNames(){
  var n = Object.keys(STATE.users || {}).length;
  if (PV.EV_NAMES && PV.EV_NAMES_V === n) return PV.EV_NAMES;
  PV.EV_NAMES_V = n;
  PV.EV_NAMES = Object.keys(STATE.users || {}).map(function(k){ return (STATE.users[k] || {}).name || ''; })
    .filter(function(x){ return x && x.length > 3; })
    .sort(function(a, b){ return b.length - a.length; });   /* الأطولُ أولًا فلا يبتلعه جزءٌ منه */
  return PV.EV_NAMES;
}

function evActor(e){
  var by = String((e && e.by) || ''), txt = String((e && e.what) || '');
  var mine = STATE.meta.name || '';
  if (by && by !== mine) return { name:by, from:'field' };
  var L = evNames();
  for (var i = 0; i < L.length; i++){
    if (L[i] !== mine && txt.indexOf(L[i]) > -1) return { name:L[i], from:'text' };
  }
  return { name:by || '', from:'field' };
}

function evAll(){
  var byId = {}, out = [];
  (STATE.events || []).forEach(function(e){ if (e && e.id && !byId[e.id]){ byId[e.id] = 1; out.push(e); } });
  var C = STATE.evlog || {};
  Object.keys(C).forEach(function(k){
    var e = C[k]; if (!e || byId[e.id || k]) return;
    byId[e.id || k] = 1;
    out.push({ id:e.id || k, ts:e.ts || e._at || 0, at:e.at || '', day:e.day || '',
               what:e.what || '', by:e.by || '', dev:e.dev || '' });
  });
  return out.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
}

/* (V30.8) فكرةُ المالك #٨: البحثُ في سجلّ التدقيق بلا تشكيلٍ ولا حالةِ حروف، وفي النصِّ والنقطةِ والفاعل —
   و«سجلُّ النقطة» من نافذتها يجلب تاريخَها كلَّه من القاعدة لا من المحمَّل وحدَه */
function evNorm(v){ return String(v == null ? '' : v).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }

/* صندوقُ رأس الصفحة يقود EVF.q (PG_BIND) — فيُملأ هو أيضًا */
function evRows(){
  var L = evAll();
  return L.filter(function(e){
    if (EVF.kind && evKind(e.what) !== EVF.kind) return false;
    if (EVF.cat && evCat(e.what) !== EVF.cat) return false;
    if (EVF.by && evActor(e).name !== EVF.by) return false;   /* بالفاعل لا بصاحب الجهاز */
    if (EVF.q){ var nq = evNorm(EVF.q); if ((evNorm(e.what) + ' ' + evNorm(e.site) + ' ' + evNorm(e.by) + ' ' + evNorm(evActor(e).name)).indexOf(nq) < 0) return false; }   /* (V30.8) النصُّ والنقطةُ والفاعل */
    /* التاريخُ والوقتُ معًا: `from` و`to` بصيغة datetime-local */
    if (EVF.from && e.ts < Date.parse(EVF.from)) return false;
    if (EVF.to   && e.ts > Date.parse(EVF.to))   return false;
    return true;
  });
}
