/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-02-types-shapes-filters.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Point classification and map shapes per type, owner taxonomy (five zones, nine types), path filters, ministry camera details, tafweej layer, camp path and the filter bar.
   DEFINES : typeShape, mapShapeOf, shapeRing, shapeSvg, taxCalc, taxOf, routesList, mapFitFiltered, filtOn, filtPass, catCounts, camNetOf, siteFloor, floorName … (+22 more)
   GLOBALS : SHAPES, SHAPE_UNIT, TYPE_SHAPE_DEF, TAX_ALIAS, TAX_G, TAX_T, TAX_V, TAX_DEF, CAT_DEF, CAT_DEF_BASE … (+12 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ التصنيف والتفاصيل — كما في العامل ═══
   شريطان: المشاعرُ ثم الأنواعُ بأيقوناتها وألوانها،
   والضغطُ يُرشِّح الخريطةَ والقائمةَ معًا في اللحظة نفسها. */

/* ═══ شكلُ النقطة على الخريطة (V17.55) ═══
   كانت كلُّ نقطةٍ دائرةً، والأشكالُ في الأسطورة رموزًا لا تُرى على الخريطة —
   فنوعان بلونين متقاربين لا يُفرَّق بينهما في الشمس. صار لكلِّ نوعٍ شكلُه:
   دائرةٌ أو مربّعٌ أو معيّنٌ أو مثلّث، يُرسَم بإزاحةٍ بالبكسل فيثبت حجمُه مع
   التقريب. والدائرةُ تبقى الأصلَ لأن المخيماتِ ألفٌ وأربعُمئة، ولا يُحسَب
   المضلَّعُ إلا لما اختير له شكلٌ آخر — وهي عشراتٌ لا آلاف. */
var SHAPES = [['circle','دائرة'], ['square','مربّع'], ['diamond','معيّن'], ['triangle','مثلّث'],
              ['star','نجمة'], ['drop','قطرة']];
/* ═══ هندسةُ الأشكال بوحدةٍ واحدة (V17.60) ═══
   كلُّ شكلٍ رؤوسٌ بمضاعفاتِ نصف القطر: يرسمه اللوحُ بإزاحةٍ بالبكسل، وترسمه
   الأسطورةُ وشاشةُ الأنواع بالأرقام نفسِها — فلا تقول الأسطورةُ شكلًا وترسم
   الخريطةُ غيرَه. النجمةُ والقطرةُ أُضيفتا للجيت واي والحساس. */
var SHAPE_UNIT = (function(){
  var U = {
    square:   [[-1,-1],[1,-1],[1,1],[-1,1]],
    diamond:  [[0,-1.25],[1.25,0],[0,1.25],[-1.25,0]],
    triangle: [[0,-1.35],[1.2,0.95],[-1.2,0.95]],
    star: [], drop: [[0,-1.6]]
  };
  for (var i = 0; i < 10; i++){
    var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2) ? 0.68 : 1.6;
    U.star.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  for (var g = -30; g <= 210; g += 30){
    var b = g * Math.PI / 180;
    U.drop.push([Math.cos(b) * 1.05, 0.35 + Math.sin(b) * 1.05]);
  }
  return U;
})();
function typeShape(ty){
  var d = typesList()[ty], b = CAT_DEF[ty];
  return (d && d.s) || (b && b.s) || 'circle';
}
/* الشكلُ كما يُرسَم فعلًا: الممرُّ والكاميرا معيّنٌ بعلامةٍ ثابتة، وغيرُهما شكلُ نوعه */
/* ═══ شكلٌ لكلِّ نوع (V24.8) ═══ بطلب صاحب المشروع: كلُّ نوعٍ يُعرَف بشكله قبل لونه، والمخيمُ كما هو.
   الجدولُ نفسُه تقرؤه الخريطةُ والأسطورةُ وشاشةُ الأنواع — فلا يختلف ثلاثتُها. */
(function(){
  var ring = function(n, r, rot){ var o = []; for (var i = 0; i < n; i++){ var a = rot + i * 2 * Math.PI / n; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
  SHAPE_UNIT.tridown = [[0, 1.35], [1.2, -0.95], [-1.2, -0.95]];
  SHAPE_UNIT.hexagon = ring(6, 1.2, 0);
  SHAPE_UNIT.pentagon = ring(5, 1.3, -Math.PI / 2);
  var w = 0.42, l = 1.3;
  SHAPE_UNIT.plus = [[-w,-l],[w,-l],[w,-w],[l,-w],[l,w],[w,w],[w,l],[-w,l],[-w,w],[-l,w],[-l,-w],[-w,-w]];
})();
SHAPES.push(['tridown', 'مثلث مقلوب'], ['hexagon', 'سداسي'], ['pentagon', 'خماسي'], ['plus', 'زائد']);
var TYPE_SHAPE_DEF = { 'ممر':'square', 'كاميرا':'triangle', 'LPR':'tridown', 'جيت واي':'star', 'حساس حرارة ورطوبة':'drop',
                       'بوابة':'diamond', 'محطة':'hexagon', 'جسر':'pentagon', 'مبنى':'plus' };
function mapShapeOf(ty){ return TYPE_SHAPE_DEF[ty] || typeShape(ty); }
function shapeRing(map, lat, lng, px, shape){
  var U = SHAPE_UNIT[shape];
  if (!U) return null;
  var c = map.latLngToContainerPoint([lat, lng]);
  return U.map(function(p){ return map.containerPointToLatLng([c.x + p[0] * px, c.y + p[1] * px]); });
}
/* الشكلُ نفسُه صورةً صغيرة — للأسطورة وشاشة الأنواع */
function shapeSvg(shape, col){
  var U = SHAPE_UNIT[shape], f = esc(col || '#C6CFD7');
  var body = U
    ? '<polygon points="' + U.map(function(p){ return (p[0] * 6.2).toFixed(1) + ',' + (p[1] * 6.2).toFixed(1); }).join(' ') + '"/>'
    : '<circle r="6"/>';
  return '<svg class="lg-svg" viewBox="-10 -10 20 20" aria-hidden="true"><g fill="' + f + '">' + body + '</g></svg>';
}
/* ═══ تصنيفُ المالك للعرض (V27.2): المشعرُ خمسةٌ والنوعُ تسعة ═══
   المشعر: منى · عرفات · المزدلفة · محطات التفويج · كاميرات الرصد. النوع: مخيمات · ممرات · محطات قطار · كاميرات رصد ·
   منشأة الجمرات · مسجد نمرة · النورية · محطات طريق الهجرة · الزايدي. «محطات التفويج» تضمّ النورية وطريق الهجرة والزايدي
   (كلُّها كاميرات لوحات)، و«كاميرات الرصد» تضمّ كاميرات منى ومنشأة الجمرات، وكاميراتُ عرفات (رصدًا ولوحات) تحت عرفات
   بنوع «كاميرات رصد». يُحسَب من بيانات النقطة بقواعد، ويُعدَّل لأيِّ نقطةٍ يدويًّا من «تعديل البيانات» (tg/tt) — كلُّه حركيّ. */
/* (V28.5) ملاحظاتُ «تحديثات المنصة»: «كاميراتُ الوزارة» ← «المتابعة» وتُزال منها كاميراتُ الجمرات (لها مسمّاها)، و«كاميراتُ الوزارة LPR» ← «مراكز التفويج».
   المفاتيحُ القديمةُ المحفوظةُ في تعديلات النقاط تُقرأ بأسمائها الجديدة (TAX_ALIAS). */
var TAX_ALIAS = { 'كاميرات الرصد':'كاميرات المتابعة', 'المتابعة':'كاميرات المتابعة', 'محطات التفويج':'مراكز التفويج', 'كاميرات رصد':'كاميرات المتابعة' };   /* (V30.0) المشعرُ «المتابعة» صار «كاميرات المتابعة» */
var TAX_G = ['منى', 'عرفات', 'المزدلفة', 'مراكز التفويج', 'كاميرات المتابعة'];
var TAX_T = ['مخيمات', 'ممرات', 'محطات قطار', 'كاميرات المتابعة', 'منشأة الجمرات', 'مسجد نمرة', 'النورية', 'محطات طريق الهجرة', 'الزايدي'];
var TAX_V = 2;   /* يُرفَع عند أيِّ تعديلٍ يدويّ فتُعاد قراءةُ الذاكرة */
function taxCalc(x){
  var z = String(x.zone || ''), ty = String(x.type || ''), nm0 = String(x.name || ''), cam = (ty === 'كاميرا' || ty === 'LPR');
  var t = { 'مخيم':'مخيمات', 'ممر':'ممرات', 'محطة':'محطات قطار', 'جسر':'منشأة الجمرات', 'بوابة':'مسجد نمرة', 'كاميرا':'كاميرات المتابعة', 'LPR':'كاميرات المتابعة', 'مبنى':'مخيمات' }[ty] || (TAX_T.indexOf(ty) > -1 ? ty : 'مخيمات');
  /* (V38.34) a train E-GATE is a gate point of the train zone: owner category "train stations", not the Namirah mosque gates */
  if (ty === 'بوابة' && /^NSK-TRN-/.test(String(x.id || ''))) t = 'محطات قطار';
  var g;
  if (/النوري|النوار/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'النورية'; }
  else if (/الهجرة/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'محطات طريق الهجرة'; }
  else if (/الزايد/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'الزايدي'; }
  else if (/التفويج/.test(z)){ g = 'مراكز التفويج'; }
  else if (z === 'الجمرات' || (cam && (/الجمرات/.test(String(x.region || '')) || /^NSK-JMR-/.test(String(x.id || ''))))){ g = cam ? 'كاميرات المتابعة' : 'منى'; t = 'منشأة الجمرات'; }   /* (V28.5) كاميراتُ الجمرات (مشعرُها منى في السجل ومنطقتُها «منشأة الجمرات») نوعُها «منشأة الجمرات» لا «كاميرات المتابعة» */
  else if (z === 'منى'){ g = cam ? 'كاميرات المتابعة' : 'منى'; }
  else if (z === 'عرفات' || z === 'مسجد نمرة'){ g = 'عرفات'; if (z === 'مسجد نمرة') t = 'مسجد نمرة'; }
  else if (/مزدلفة/.test(z)){ g = 'المزدلفة'; }
  else if (/قطار/.test(z)){ t = 'محطات قطار'; g = /مزدلفة/.test(nm0) ? 'المزدلفة' : (/عرفات/.test(nm0) ? 'عرفات' : 'منى'); }
  else g = TAX_G.indexOf(z) > -1 ? z : 'منى';
  return { g:g, t:t };
}
function taxOf(x){
  if (!x) return { g:'', t:'' };
  if (x._tax && x._taxV === TAX_V) return x._tax;
  var r = taxCalc(x);
  var tg = TAX_ALIAS[x.tg] || x.tg, tt = TAX_ALIAS[x.tt] || x.tt;   /* (V28.5) */
  if (tg && TAX_G.indexOf(tg) > -1) r.g = tg;
  if (tt && TAX_T.indexOf(tt) > -1) r.t = tt;
  x._tax = r; x._taxV = TAX_V; return r;
}
var TAX_DEF = { 'مخيمات':{ l:'مخيمات', i:'\u26FA', c:'#3ED598' }, 'ممرات':{ l:'ممرات', i:'\u{1F6E3}', c:'#4FA3FF' }, 'محطات قطار':{ l:'محطات قطار', i:'\u{1F686}', c:'#F2C960' }, 'كاميرات المتابعة':{ l:'كاميرات المتابعة', i:'\u{1F4F7}', c:'#C77DFF' }, 'منشأة الجمرات':{ l:'منشأة الجمرات', i:'\u{1F309}', c:'#E8873A' }, 'مسجد نمرة':{ l:'مسجد نمرة', i:'\u{1F54C}', c:'#38B2AC' }, 'النورية':{ l:'النورية', i:'\u{1F693}', c:'#FF6B6B' }, 'محطات طريق الهجرة':{ l:'محطات طريق الهجرة', i:'\u{1F693}', c:'#FF8E53' }, 'الزايدي':{ l:'الزايدي', i:'\u{1F693}', c:'#FFB347' } };
/* (V38.34) the category badge of a point: train E-GATEs are gates of the train, not Namirah mosque gates */
function catDefOf(x){ var d = CAT_DEF[x && x.type] || { l:(x && x.type) || '', i:'\u25CF', c:'#8A939D' }; return (typeof egIsGate === 'function' && egIsGate(x)) ? { l:'بوابات القطار', i:'\u{1F6AA}', c:'#F2C960' } : d; }
var CAT_DEF = {
  'مخيم':   { l:'مخيمات',          i:'\u26FA', c:'#3ED598' },
  'ممر':    { l:'ممرات',           i:'\u{1F6E3}', c:'#4FA3FF' },
  'جسر':    { l:'منشأة الجمرات',   i:'\u{1F309}', c:'#E8873A' },
  'كاميرا': { l:'كاميرات المتابعة', i:'\u{1F4F7}', c:'#C77DFF' },   /* (V28.5) كان «كاميرات الوزارة» */   /* Bullet وPTZ — النوعُ الفرعيُّ لكلِّ نقطةٍ في camKind (V19.1) */
  'محطة':   { l:'محطات القطار',    i:'\u{1F686}', c:'#F2C960' },
  'بوابة':  { l:'مسجد نمرة',       i:'\u{1F54C}', c:'#38B2AC' },
  'مبنى':   { l:'منشآت التسكين',   i:'\u{1F3E2}', c:'#B8C4BF' },
  /* نوعٌ جديد (V17.45): كاميراتُ قراءة اللوحات — بلونها وأيقونتها فتُقرأ على الخريطة.
     أما «كاميرا» فهي كاميراتُ الوزارة الذكيّة نفسُها — لا نوعَ ثانٍ لها.
     والاسمُ «كاميراتُ قراءة اللوحات» (V17.60): القائمةُ تسمّي أجهزةً تُركَّب لا
     وظيفةً تُؤدّى — والقيمةُ المخزَّنةُ هي المفتاح فلا يمسُّها تغييرُ الاسم. */
  'LPR':    { l:'مراكز التفويج', i:'\u{1F694}', c:'#FF6B6B' },   /* (V28.5) كان «كاميرات الوزارة — LPR» */   /* كاميراتُ الوزارة التي تقرأ اللوحات (V19.1) */
  /* ═══ الجيت واي والحساس — لكلٍّ شكلُه (V17.60) ═══
     يُضافان من «نقطة هنا» كسائر الأنواع، ولكلٍّ شكلٌ لا يشاركه فيه غيرُه:
     النجمةُ للجيت واي (عقدةٌ تتفرّع منها الأجهزة) والقطرةُ للحساس (حرارةٌ
     ورطوبة) — فيُعرَفان على الخريطة قبل أن يُقرأ لونُهما. */
  'جيت واي':           { l:'جيت واي',                 i:'\u{1F4E1}', c:'#22D3EE', s:'star' },
  'حساس حرارة ورطوبة': { l:'حساسات الحرارة والرطوبة', i:'\u{1F321}', c:'#F472B6', s:'drop' }
};
/* الكتالوجُ كما كُتب — CAT_DEF يتبدّل مع سجلِّ الأنواع، وهذه النسخةُ تبقى مرجعَ
   «المدمَج» فيُضاف إلى سجلٍّ سحابيٍّ سبقه (V17.60) */
var CAT_DEF_BASE = JSON.parse(JSON.stringify(CAT_DEF));

/* ═══ الترشيحُ بالمسار (V17.51 · طلبُ الوزارة) ═══
   النقاطُ المولَّدةُ تحمل اسمَ مسارها (route)، فيُسأل: أرِني «طريق كدانة»
   وحدَه — كم نقطةً فيه وكم مُسحت. فصار مرشِّحًا كالمشعر والنوع: يُشتقُّ من
   البيانات فلا يُكتَب بيدٍ، ويظهر متى وُجد مسارٌ واحدٌ على الأقلّ. */
var FILT = { zone:'', type:'', work:'', life:'', route:'', floor:'' };   /* floor (V22.2) */
function routesList(){
  var r = {};
  (STATE.sites || []).forEach(function(x){ if (x && x.route) r[x.route] = (r[x.route] || 0) + 1; });
  return r;
}

/* (V29.8) شكوى المالك «الزايدي مكتوب ١ ومش على الخريطة»: مواقعُ التفويج بعيدةٌ عن المشاعر (النورية والزايدي والجموم والمدينة)،
   فاختيارُ مشعرٍ أو نوعٍ لا يظهر شيءٌ من نقاطه في الإطار يقرّب الخريطةَ إليها — وإن ظهر شيءٌ منها بقيت الخريطةُ مكانها */
function mapFitFiltered(){
  if (CUR !== 'map' || typeof MAP === 'undefined' || !MAP || !(FILT.zone || FILT.type)) return false;
  var P = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng && filtPass(x); }).map(function(x){ return [+x.lat, +x.lng]; });
  if (!P.length) return false;
  try {
    var B = MAP.getBounds(); if (P.some(function(p){ return B.contains(p); })) return false;
    MAP.fitBounds(L.latLngBounds(P).pad(0.2), { maxZoom:17, animate:false }); return true;
  } catch (e){ LS_ERR = e; return false; }
}
function filtOn(){ return !!(FILT.zone || FILT.type || FILT.work || FILT.life || FILT.exec || FILT.ccg || FILT.route || (FILT.floor !== '' && FILT.floor != null) || CO_SEL.length); }

function filtPass(x){
  if (FILT.zone && taxOf(x).g !== FILT.zone) return false;   /* (V27.2) بتصنيف المالك */
  if (FILT.type && taxOf(x).t !== FILT.type) return false;
  if (FILT.work && x.work !== FILT.work) return false;
  if (FILT.route && x.route !== FILT.route) return false;   /* بالمسار (V17.51) */
  if (FILT.floor !== '' && FILT.floor != null && siteFloor(x) !== +FILT.floor) return false;   /* بالدور (V22.2) */
  /* بالحالة: ما لم يُزَر، ما زير وينتظر الاعتماد، المعتمدُ الجاهز، المُسند، المُركّب… —
     كان المرشِّحُ يجيب النقاطَ بلا ما حدث لها، فلا يُعرَف من الخريطة ما تمّ وما بقي */
  if (FILT.life && typeof lifeOf === 'function' && lifeOf(x) !== FILT.life) return false;
  if (FILT.exec && typeof execStatusMemo === 'function' && execLabelOf(execStatusMemo(x)) !== FILT.exec) return false;   /* (V37.52→V37.53) بالتسمية الظاهرة */
  if (FILT.ccg && typeof ccGroupsOfSite === 'function' && ccGroupsOfSite(x).indexOf(FILT.ccg) < 0) return false;
  /* الشركةُ ترشيحٌ لا تلوينٌ فحسب: من اختار شركةً أراد نقاطَها وحدها */
  if (CO_SEL.length && CO_SEL.indexOf(x.co) < 0) return false;
  return true;
}

/* عدُّ كلِّ تصنيفٍ ضمن ما رُشِّح بغيره — فالأعدادُ تتبع الاختيار */
function catCounts(){
  var z = {}, ty = {}, wk = {}, n = 0;
  for (var i = 0; i < STATE.sites.length; i++){
    var x = STATE.sites[i];
    var tx = taxOf(x), okZ = !FILT.type || tx.t === FILT.type;
    var okT = !FILT.zone || tx.g === FILT.zone;
    if (okZ) z[tx.g] = (z[tx.g] || 0) + 1;
    if (okT) ty[tx.t] = (ty[tx.t] || 0) + 1;
    if (filtPass(x)){ n++; if (x.work) wk[x.work] = (wk[x.work] || 0) + 1; }
  }
  return { zone:z, type:ty, work:wk, shown:n };
}

/* ═══ كاميراتُ الوزارة بتفاصيلها، وأدوارُ المنشآت (V22.2) ═══
   من تقرير الوزارة «MOHU MINA CPE AND CAMERA REPORT 2026»: لكلِّ عمودٍ عددُ كاميراته ونوعُها
   (ثابتة/متحرّكة) وحالةُ ربطه وقطاعُه — بلا عناوين شبكةٍ ولا كلماتِ مرور. التسعُ والخمسون
   القائمةُ طابقت التقريرَ عمودًا عمودًا وموقعًا موقعًا (أقلُّ من ثلاثين مترًا)، فبقيت معرّفاتُها
   وزياراتُها كما هي؛ وأُضيفت كاميراتُ منشأة الجمرات بأدوارها وأعمدتُها المجاورة.
   منشأةُ الجمرات أرضيٌّ وأربعةُ أدوار، ونقاطُها — لأفاقي وللوزارة — فوق بعضها على الخريطة:
   فصار للنقطة دورٌ (من حقلها أو من اسمها) وصفُّ أدوارٍ في التصفية يعرض دورًا واحدًا. */
var CAM_INFO = {"NSK-MIN-CAM-0009":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0012":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0014":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0001":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0015":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0003":[1,[["F",1]],"إشارةٌ ضعيفة","ROUCKET",0],"NSK-MIN-CAM-0002":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0004":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0016":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0008":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0017":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0013":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0011":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0007":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0018":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0005":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0006":[1,[["F",1]],"إشارةٌ رديئة","ROUCKET",0],"NSK-MIN-CAM-0010":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0023":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0024":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0021":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0025":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0022":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0019":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0026":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0027":[2,[["F",2]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0020":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0034":[1,[["F",1]],"تُوصَل بإشارةٍ ضعيفة","BLUE 1",0],"NSK-MIN-CAM-0035":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 1",0],"NSK-MIN-CAM-0033":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 1",0],"NSK-MIN-CAM-0032":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 1",0],"NSK-MIN-CAM-0038":[1,[["F",1]],"إشارةٌ رديئة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0040":[1,[["P",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 2",0],"NSK-MIN-CAM-0044":[2,[["P",1],["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 2",0],"NSK-MIN-CAM-0036":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0039":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0041":[1,[["P",1]],"إشارةٌ ضعيفة — يلزم نقلُ الهوائي","BLUE 2",0],"NSK-MIN-CAM-0042":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0037":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0043":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0046":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0049":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0045":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 3",0],"NSK-MIN-CAM-0047":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0051":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 3",0],"NSK-MIN-CAM-0048":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0052":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0053":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0050":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 3",0],"NSK-MIN-CAM-0055":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0063":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0058":[2,[["F",2]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0054":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0061":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0062":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0056":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0057":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0059":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0060":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-JMR-CAM-0001":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0002":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0003":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0004":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0005":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0006":[1,[["F",1]],"الهوائي يصل — خللٌ في إعداد الشبكة (VLAN)","JAMARAT",0],"NSK-JMR-CAM-0007":[1,[["F",1]],"","JAMARAT",0],"NSK-JMR-CAM-0008":[1,[["F",1]],"","JAMARAT",0],"NSK-JMR-CAM-0009":[1,[["P",1]],"","JAMARAT",0],"NSK-NEW-LPR-N001":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N002":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N003":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N004":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N005":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N006":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N007":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N008":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N009":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N010":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N011":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N012":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N013":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N014":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N015":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N016":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N017":[1,[["L",1]],"","",1],"NSK-JMR-CAM-0010":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0011":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0012":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0013":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0014":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0015":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0016":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0017":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0018":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0019":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0020":[1,[["P",1]],"","JAMARAT",0]};
/* (V23.4) عناوينُ كاميرات الوزارة كما في تقريرها ٢٠٢٦ — بقرار صاحب المشروع («حطّ الـIPs… ملكش دعوة
   بالسيكيورتي دلوقتي»): لكلِّ نقطةٍ المستقبِلُ (CPE) وعنوانُه، وقطاعُه وهوائيُّه، وحالتُه، وكاميراتُها برقمها
   وطرازها ونوعها وعنوانها والـVLAN. ٨٥ كاميرا على ٧٩ نقطة، وثلاثٌ بلا إحداثياتٍ في التقرير. كلمةُ المرور
   لا تُكتَب هنا — روابطُ البثِّ بلا اعتماد، والفريقُ يعرفها. */
var CAM_NET = {"NSK-MIN-CAM-0009":{"cpe":"1","ant":"10.24.17.115","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"1","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.96","vlan":"1"}]},"NSK-MIN-CAM-0012":{"cpe":"2","ant":"10.24.17.143","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"2","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.193","vlan":"1"}]},"NSK-MIN-CAM-0014":{"cpe":"3","ant":"10.24.17.116","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"3","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.120","vlan":"1"}]},"NSK-MIN-CAM-0001":{"cpe":"4","ant":"10.24.17.112","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"4","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.80","vlan":"1"},{"n":"5","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.28","vlan":"1"}]},"NSK-MIN-CAM-0015":{"cpe":"5","ant":"10.24.17.111","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"6","kind":"F","model":"IPC-HFW2531T-ZS-S2","ip":"10.24.20.27","vlan":"1"}]},"NSK-MIN-CAM-0003":{"cpe":"6","ant":"10.24.17.218","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal","cams":[{"n":"7","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.31","vlan":"1"}]},"NSK-MIN-CAM-0002":{"cpe":"7","ant":"10.24.17.214","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"8","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.81","vlan":"1"}]},"NSK-MIN-CAM-0004":{"cpe":"8","ant":"10.24.17.151","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal LOS Issue","cams":[{"n":"9","kind":"F","model":"DH-IPC-HFW7843H-Z-X","ip":"10.24.20.188","vlan":"1"}]},"NSK-MIN-CAM-0016":{"cpe":"9","ant":"10.24.17.220","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"10","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.3","vlan":"1"}]},"NSK-MIN-CAM-0008":{"cpe":"10","ant":"10.24.17.213","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"11","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.35","vlan":"1"}]},"NSK-MIN-CAM-0017":{"cpe":"11","ant":"10.24.17.216","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"12","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.4","vlan":"1"}]},"NSK-MIN-CAM-0013":{"cpe":"12","ant":"10.24.17.208","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"13","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.40","vlan":"1"}]},"NSK-MIN-CAM-0011":{"cpe":"13","ant":"10.24.17.168","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"14","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.11","vlan":"1"}]},"NSK-MIN-CAM-0007":{"cpe":"14","ant":"10.24.17.141","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal LOS Issue","cams":[{"n":"15","kind":"F","model":"IPC-HFW5541E-ZE","ip":"10.24.20.160","vlan":"1"}]},"NSK-MIN-CAM-0018":{"cpe":"15","ant":"10.24.17.160","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"16","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.46","vlan":"1"}]},"NSK-MIN-CAM-0005":{"cpe":"16","ant":"10.24.17.158","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"17","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.21","vlan":"1"}]},"NSK-MIN-CAM-0006":{"cpe":"17","ant":"10.24.17.118","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Poor Signal","cams":[{"n":"18","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.174","vlan":"1"}]},"NSK-MIN-CAM-0010":{"cpe":"18","ant":"10.24.17.150","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"19","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.5","vlan":"1"}]},"NSK-MIN-CAM-0023":{"cpe":"19","ant":"10.24.17.147","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"20","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.36","vlan":"1"}]},"NSK-MIN-CAM-0024":{"cpe":"20","ant":"10.24.17.209","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal LOS Issue","cams":[{"n":"21","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.122","vlan":"1"}]},"NSK-MIN-CAM-0021":{"cpe":"21","ant":"10.24.17.148","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"22","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.123","vlan":"1"}]},"NSK-MIN-CAM-0025":{"cpe":"22","ant":"10.24.17.154","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"23","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.125","vlan":"1"},{"n":"24","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.126","vlan":"1"}]},"NSK-MIN-CAM-0022":{"cpe":"23","ant":"10.24.17.149","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"25","kind":"F","model":"DH-SD49425XB-HNR","ip":"10.24.20.184","vlan":"1"},{"n":"26","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.162","vlan":"1"}]},"NSK-MIN-CAM-0019":{"cpe":"24","ant":"10.24.17.156","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"27","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.177","vlan":"1"}]},"NSK-MIN-CAM-0026":{"cpe":"25","ant":"10.24.17.153","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"28","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.54","vlan":"1"}]},"NSK-MIN-CAM-0027":{"cpe":"26","ant":"10.24.17.206","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal LOS Issue","cams":[{"n":"29","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.22","vlan":"1"},{"n":"30","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.23","vlan":"1"}]},"NSK-MIN-CAM-0020":{"cpe":"27","ant":"10.24.17.146","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"31","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.252","vlan":"1"}]},"NSK-JMR-CAM-0005":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"32","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.236","vlan":"300"}]},"NSK-JMR-CAM-0004":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"33","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.151","vlan":"300"}]},"NSK-JMR-CAM-0018":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"34","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.152","vlan":"300"}]},"NSK-JMR-CAM-0019":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"35","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.235","vlan":"300"}]},"NSK-JMR-CAM-0001":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"36","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.201","vlan":"1"},{"n":"","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.242","vlan":"300"}]},"NSK-JMR-CAM-0003":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"37","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.111","vlan":"1"}]},"NSK-JMR-CAM-0002":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"38","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.204","vlan":"1"}]},"NSK-JMR-CAM-0014":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"39","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.112","vlan":"1"}]},"NSK-JMR-CAM-0015":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"40","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.109","vlan":"1"}]},"NSK-JMR-CAM-0016":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"41","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.110","vlan":"1"}]},"NSK-JMR-CAM-0011":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"42","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.113","vlan":"1"}]},"NSK-JMR-CAM-0017":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"43","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.108","vlan":"1"}]},"NSK-JMR-CAM-0012":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"44","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.211","vlan":"1"}]},"NSK-JMR-CAM-0013":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"45","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.114","vlan":"1"}]},"NSK-JMR-CAM-0010":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"46","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.205","vlan":"1"}]},"NSK-JMR-CAM-0006":{"cpe":"30","ant":"10.24.16.56","sector":"JAMARAT","secAnt":"","status":"REACHABLE BY ANTENNA ''VLAN ISSUE''","cams":[{"n":"47","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.20","vlan":"300"}]},"NSK-JMR-CAM-0007":{"cpe":"31","ant":"10.24.16.71","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"48","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.212","vlan":"300"}]},"NSK-JMR-CAM-0008":{"cpe":"32","ant":"10.24.16.81","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"49","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.161","vlan":"300"}]},"NSK-JMR-CAM-0009":{"cpe":"33","ant":"10.24.16.97","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"50","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.70","vlan":"300"}]},"NSK-JMR-CAM-0020":{"cpe":"33","ant":"10.24.16.97","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"51","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.69","vlan":"300"}]},"NSK-MIN-CAM-0034":{"cpe":"34","ant":"10.24.16.82","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"REACHABLE \"WEEK SIGNAL\"","cams":[{"n":"52","kind":"F","model":"DH-IPC-HFW7844H-Z-X","ip":"10.24.20.41","vlan":"1"}]},"NSK-MIN-CAM-0035":{"cpe":"35","ant":"10.24.16.133","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Good Signal Clear LOS","cams":[{"n":"53","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.29","vlan":"1"}]},"NSK-MIN-CAM-0033":{"cpe":"36","ant":"10.24.16.85","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Week Signal LOS Issue","cams":[{"n":"54","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.185","vlan":"1"}]},"NSK-MIN-CAM-0032":{"cpe":"37","ant":"10.24.16.172","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Good Signal Clear LOS","cams":[{"n":"55","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.237","vlan":"1"}]},"NSK-MIN-CAM-0038":{"cpe":"38","ant":"10.24.16.111","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Poor Signal Device Issue","cams":[{"n":"56","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.86","vlan":"1"}]},"NSK-MIN-CAM-0040":{"cpe":"39","ant":"10.24.16.222","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"57","kind":"P","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.53","vlan":"1"}]},"NSK-MIN-CAM-0044":{"cpe":"40","ant":"10.24.16.217","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal LOS Issue","cams":[{"n":"58","kind":"P","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.239","vlan":"1"},{"n":"59","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.195","vlan":"1"}]},"NSK-MIN-CAM-0036":{"cpe":"41","ant":"10.24.16.44","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"60","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.18","vlan":"1"}]},"NSK-MIN-CAM-0039":{"cpe":"42","ant":"10.24.16.174","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"61","kind":"F","model":"IPC-HFW5541E-ZE","ip":"10.24.20.218","vlan":"1"}]},"NSK-MIN-CAM-0041":{"cpe":"43","ant":"10.24.16.219","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal (Need to replace the location of antenna)","cams":[{"n":"62","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.42","vlan":"1"}]},"NSK-MIN-CAM-0042":{"cpe":"44","ant":"10.24.16.118","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"63","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.105","vlan":"1"}]},"NSK-MIN-CAM-0037":{"cpe":"45","ant":"10.24.16.221","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"64","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.88","vlan":"1"}]},"NSK-MIN-CAM-0043":{"cpe":"46","ant":"10.24.16.232","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"65","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.121","vlan":"1"}]},"NSK-MIN-CAM-0046":{"cpe":"47","ant":"10.24.16.37","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"66","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.181","vlan":"1"}]},"NSK-MIN-CAM-0049":{"cpe":"48","ant":"10.24.16.73","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"67","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.67","vlan":"1"}]},"NSK-MIN-CAM-0045":{"cpe":"49","ant":"10.24.16.136","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal LOS Issue","cams":[{"n":"68","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.8","vlan":"300"}]},"NSK-MIN-CAM-0047":{"cpe":"50","ant":"10.24.16.63","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"69","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.219","vlan":"1"}]},"NSK-MIN-CAM-0051":{"cpe":"51","ant":"10.24.16.122","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"70","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.107","vlan":"1"}]},"NSK-MIN-CAM-0048":{"cpe":"52","ant":"10.24.16.70","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"71","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.189","vlan":"1"}]},"NSK-MIN-CAM-0052":{"cpe":"53","ant":"10.24.16.143","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"72","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.52","vlan":"1"}]},"NSK-MIN-CAM-0053":{"cpe":"54","ant":"10.24.16.17","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"73","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.145","vlan":"1"}]},"NSK-MIN-CAM-0050":{"cpe":"55","ant":"10.24.16.149","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"74","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.155","vlan":"1"}]},"NSK-MIN-CAM-0055":{"cpe":"56","ant":"10.24.17.166","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"75","kind":"F","model":"IPC-HFW2531T-ZS-S2","ip":"10.24.20.131","vlan":"300"}]},"NSK-MIN-CAM-0063":{"cpe":"57","ant":"10.24.16.123","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"76","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.82","vlan":"300"}]},"NSK-MIN-CAM-0058":{"cpe":"58","ant":"10.24.17.142","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"77","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.38","vlan":"300"}]},"NSK-MIN-CAM-0054":{"cpe":"59","ant":"10.24.17.136","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"78","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.13","vlan":"300"}]},"NSK-MIN-CAM-0061":{"cpe":"60","ant":"10.24.16.60","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"79","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.34","vlan":"300"}]},"NSK-MIN-CAM-0062":{"cpe":"61","ant":"10.24.16.231","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"80","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.39","vlan":"300"}]},"NSK-MIN-CAM-0056":{"cpe":"62","ant":"10.24.17.96","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"81","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.87","vlan":"300"}]},"NSK-MIN-CAM-0057":{"cpe":"63","ant":"10.24.17.161","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"82","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.90","vlan":"300"}]},"NSK-MIN-CAM-0059":{"cpe":"65","ant":"10.24.17.119","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"84","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.100","vlan":"300"}]},"NSK-MIN-CAM-0060":{"cpe":"68","ant":"10.24.17.144","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"87","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.104","vlan":"300"}]}};
/* (V23.6) أعمدةٌ في التقرير بلا إحداثيات (UNIFI: POLE 21 و23 و24): تُضاف نقطتُها يدويًّا («+ موقع غير مسجّل»
   على الخريطة، ثم «تعديل البيانات») فيحمل اسمُها رقمَ العمود أو الكاميرا — فتظهر بياناتُها في نافذتها */
var CAM_NET_POLES = {"POLE 21":{"cpe":"64","ant":"10.24.17.138","sector":"UNIFI","secAnt":"","status":"VLAN ISSUE","cams":[{"n":"83","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.7","vlan":"300"}]},"POLE 23":{"cpe":"66","ant":"10.24.17.113","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"85","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.106","vlan":"300"}]},"POLE 24":{"cpe":"67","ant":"10.24.17.117","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"86","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.50","vlan":"300"}]}};
function camNetOf(x){
  if (!x) return null;
  if (x.camx) return x.camx;
  if (typeof CAM_NET === 'object' && CAM_NET[x.id]) return CAM_NET[x.id];
  var nmx = String(x.name || '').toUpperCase(), hit = null;
  Object.keys(CAM_NET_POLES).forEach(function(p){
    var c = CAM_NET_POLES[p];
    if (new RegExp('\\b' + p.replace(/\s+/g, '\\s*') + '\\b').test(nmx) || c.cams.some(function(k){ return new RegExp('CAM\\s*' + k.n + '(?!\\d)').test(nmx); })) hit = c;
  });
  return hit;
}
var CAM_SPEC = { 'DH-IPC-HFW7842H-Z-X':'8MP (4K) · 2.7–12mm', 'DH-IPC-HFW7842H-Z-S2':'8MP (4K) · 2.7–12mm', 'DH-SD49425XB-HNR':'4MP · 25x (4.8–120mm)',
  'DH-SD8A840N-HNF-PA':'8MP (4K) · 40x', 'IPC-HFW2531T-ZS-S2':'5MP · 2.7–13.5mm', 'IPC-HFW5431E-ZE':'4MP · 2.7–13.5mm', 'IPC-HFW5541E-ZE':'5MP · 2.7–13.5mm' };   /* [عددُ الكاميرات، [[F|P، عدد]…]، حالةُ الربط، القطاع، موقعٌ تقريبيٌّ داخل الدور] */
var FLOOR_NAMES = ['الأرضي', 'الأول', 'الثاني', 'الثالث', 'الرابع'];
function siteFloor(x){
  if (!x) return null;
  if (x.floor != null && x.floor !== '') return +x.floor;
  var n = String(x.name || ''), m = /الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/.exec(n);
  if (m) return FLOOR_NAMES.indexOf(m[1]);
  var e = /\b(G|1ST|2ND|3RD|4TH)\s*(?:F|FLOOR)\b/i.exec(n);
  return e ? ({ G:0, '1ST':1, '2ND':2, '3RD':3, '4TH':4 })[e[1].toUpperCase()] : null;
}
function floorName(v){ return v == null ? '' : 'الدور ' + (FLOOR_NAMES[v] || String(v)); }
/* (V25.4) نقاطُ الجمرات: مدخلٌ أو مخرج — من الحقل المحفوظ أو من الاسم؛ والاسمُ يحمل الدورَ والبوابةَ معًا (قرارُ المالك: يتضاف) */
function isJmr(x){ return !!x && (/-JMR-/.test(String(x.id || '')) || x.zone === 'الجمرات' || /الجمرات/.test(String(x.name || ''))); }
function siteGate(x){
  if (!x) return null;
  if (x.gate === 'مدخل' || x.gate === 'مخرج') return x.gate;
  var n = String(x.name || '');
  return /مخرج/.test(n) ? 'مخرج' : (/مدخل/.test(n) ? 'مدخل' : null);
}
function jmrNameApply(name, gate, floor){
  var out = String(name || '').trim();
  if (floor != null && floor !== ''){
    var fl = floorName(+floor);
    if (/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/.test(out)) out = out.replace(/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/, fl);
    else out += ' - ' + fl;
  }
  if (gate === 'مدخل' || gate === 'مخرج'){
    if (/مدخل|مخرج/.test(out)) out = out.replace(/مدخل|مخرج/g, gate);
    else out += ' - ' + gate;
  }
  return out;
}
/* صفوفُ نافذة النقطة للكاميرا: بدالة الصفِّ التي تمرّرها النافذةُ أو صفحةُ الموقع */
function camInfoRows(x, kvf){
  var c = x && CAM_INFO[x.id]; if (!c) return '';
  var kinds = (c[1] || []).map(function(k){ return t(k[0] === 'P' ? 'متحرّكة (PTZ)' : k[0] === 'L' ? 'قارئة لوحات (LPR)' : 'ثابتة (Bullet)') + (k[1] > 1 ? ' \u00d7' + nm(k[1]) : ''); }).join(' \u00b7 ');
  return kvf('الكاميرات', '<b class="num">' + nm(c[0]) + '</b> \u00b7 ' + esc(kinds))
    + (c[2] ? kvf('حالة الربط', esc(t(c[2]))) : '')
    + (c[3] ? kvf('القطاع', '<span dir="ltr">' + esc(c[3]) + '</span>') : '')
    + (c[4] ? kvf('الموقع', '<span class="hint" style="margin:0">' + esc(t('تقريبيٌّ داخل الدور — اضبطه بـ«تحريك» عند الزيارة')) + '</span>') : '');
}
/* ═══ طبقةُ «مسار التفويج» (V23.2) ═══
   «ظبّط layer اسمها مسار التفويج ويبان المخيمات اللي هتتخدم من المسار ده وفي أيّ دور هتوصل».
   من الخطة التشغيلية ١٤٤٧ (الباب الثالث، صفحات ١٠٣–١٠٧): رُبطت المخططاتُ بالخريطة بمخيمات منى
   المسجَّلة نفسِها (مقياسٌ وإزاحةٌ ودورانٌ يُنزِل أكبرَ عددٍ من المخيمات على مضلّعاتها)، ثم لكلِّ دورٍ
   صورةٌ شفافةٌ بمخيماته ومسارَي الذهاب (أصفر) والعودة (أحمر)، ولكلِّ مخيمٍ دورُه. تُحمَّل عند الطلب
   من layers/ (لا تثقل الملفَّ الرئيسيّ) وتُخزَّن للعمل بلا شبكة. */
var TFW = { f:-1, d:'both', data:null, overlay:null, busy:false };   /* (V24.3) f=5 كلُّ الأدوار معًا، وd اتجاهُ العرض: both | go | back */
var TFW_ALL = 5, TFW_COL = ['#F5C400', '#FF7A00', '#3AD6A0', '#4BC9F5', '#C77DFF'];
var TFW_FL = ['الأرضي', 'الأول', 'الثاني', 'الثالث', 'الرابع'];
function tfwLoad(){
  if (TFW.data || TFW.busy || typeof fetch !== 'function') return;
  TFW.busy = true;
  fetch('layers/tafweej.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    TFW.busy = false; if (!d || !d.floors) return;
    TFW.data = d; tfwPaint(); render(1);
  }).catch(function(e){ TFW.busy = false; LS_ERR = e; });
}
function tfwPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try { if (TFW.overlay){ MAP.removeLayer(TFW.overlay); TFW.overlay = null; } } catch (e){ LS_ERR = e; }
  try { if (TFW.lines){ TFW.lines.clearLayers(); } } catch (e){ LS_ERR = e; }
  if (TFW.f < 0 || !TFW.data) return;
  /* (V24.1) الصورُ أُعيدت إلى إطارها الصحيح (كانت مائلةً نحو ثلاث درجات — انظر reg في tafweej.json)،
     وهي تحت لوح النقاط فتبقى النقاطُ فوقها تُرى وتُنقَر. (V24.2) ولم تعد تحمل خطوطَ المسار: الصورةُ
     مساحاتُ مخيمات الدور وحدَها، والمسارُ متجهاتٌ على خطِّ منتصف الممرّ الفعليّ (tafweej-routes.json) */
  if (!MAP.getPane('tfw')){ MAP.createPane('tfw'); MAP.getPane('tfw').style.zIndex = 350; MAP.getPane('tfw').style.pointerEvents = 'none'; }
  if (TFW.f < TFW_ALL) TFW.overlay = L.imageOverlay('layers/tafweej-' + TFW.f + '.png?v=' + (TFW.data.v || 1), TFW.data.bounds, { opacity:0.55, interactive:false, pane:'tfw' }).addTo(MAP);
  tfwLines();
}
/* (V27.8) قرارُ المالك: «لما أختار الدور يظهرلي مخيماته» — مخيماتُ الدور من إسناد المخطط تُظلَّل بحدودها بلون الدور
   (ومع كلِّ الأدوار كلُّ دورٍ بلونه)، فوق صورة المخطط وتحت النقاط. حدودُ المخيمات تُحمَّل عند الحاجة. */
function tfwCampsOf(f){ var A = (TFW.data && TFW.data.assign) || {}; return Object.keys(A).filter(function(id){ return f === TFW_ALL ? A[id] != null : +A[id] === f; }); }
function tfwCampsPaint(){
  if (!MAP || !TFW.data || TFW.f < 0 || !TFW.lines) return;
  if (typeof POLY !== 'object' || !POLY){ if (typeof polyLoad === 'function') polyLoad().then(function(ok){ if (ok && TFW.f >= 0) tfwPaint(); }); return; }
  var A = TFW.data.assign || {}, n = 0;
  Object.keys(A).forEach(function(id){
    var f = +A[id]; if (TFW.f !== TFW_ALL && f !== TFW.f) return;
    var x = siteFind(id), ring = campFoot(x || { id:id, type:'مخيم' }); if (!ring) return;
    var col = TFW_COL[f] || '#F5C400';
    L.polygon(ring, { renderer:MAP_CV, color:col, weight:2, opacity:0.95, fillColor:col, fillOpacity:0.28, interactive:false }).addTo(TFW.lines); n++;
  });
  TFW.campsN = n;
}
/* خطوطُ المسار متجهاتٌ على اللوح نفسِه (V24.2): حادّةٌ في كلِّ تقريب، ومئةُ كيلوبايتٍ للأدوار الخمسة
   تُحمَّل مرةً مع الطبقة — والخطُّ فوق المخيمات وتحت النقاط فلا يحجب نقطةً ولا يُنقَر */
function tfwLines(){
  if (!MAP || !TFW.data || TFW.f < 0) return;
  if (!TFW.routes){
    if (TFW.rbusy || typeof fetch !== 'function') return;
    TFW.rbusy = true;
    fetch('layers/tafweej-routes.json?v=' + (TFW.data.v || 1)).then(function(r){ return r.json(); }).then(function(d){
      TFW.rbusy = false; TFW.routes = d; tfwLines();
      if (TFW.after){ var fn = TFW.after; TFW.after = null; fn(); }
    }).catch(function(e){ TFW.rbusy = false; LS_ERR = e; });
    return;
  }
  if (!TFW.lines) TFW.lines = L.layerGroup().addTo(MAP);
  TFW.lines.clearLayers();
  tfwCampsPaint();   /* (V27.8) مخيماتُ الدور أوّلًا — تحت الخطوط */
  var DRW = tfdDrawn();   /* (V28.0) ما رسمه المهندسُ لدورٍ واتجاهٍ يُعرَض بدل المولَّد */
  if (TFW.camp){   /* (V24.5) مسارُ المخيم المختار وحدَه — أعرضُ خطًّا */
    var cm = [];
    [['back', '#D0021B'], ['go', '#F5C400']].forEach(function(k){ if (TFW.d !== 'both' && TFW.d !== k[0]) return; var ln = L.polyline(TFW.camp[k[0]].pts, { renderer:MAP_CV, color:k[1], weight:6, opacity:0.97, lineCap:'round', lineJoin:'round', interactive:false }); ln.addTo(TFW.lines); cm.push(ln); });
    cm.forEach(function(l){ try { l.bringToBack(); } catch (e){ LS_ERR = e; } });
    Object.keys(MK.by).forEach(function(id){ var e = MK.by[id]; if (e && e.kind === 'poly'){ try { e.l.bringToBack(); } catch (e2){ LS_ERR = e2; } } });
    return;
  }
  /* (V24.3) دورٌ واحدٌ: الذهابُ أصفرُ والعودةُ حمراء — وكلُّ الأدوار: لكلِّ دورٍ لونُه والعودةُ متقطّعة */
  var all = TFW.f === TFW_ALL, floors = all ? ['0', '1', '2', '3', '4'] : [String(TFW.f)], made = [];
  floors.forEach(function(fk){
    var fl = (TFW.routes.floors || {})[fk] || {};
    [['back', '#D0021B'], ['go', '#F5C400']].forEach(function(k){
      if (TFW.d !== 'both' && TFW.d !== k[0]) return;
      var drawn = DRW[fk] && DRW[fk][k[0]] && DRW[fk][k[0]].length ? DRW[fk][k[0]] : null;   /* (V28.0) */
      (drawn || fl[k[0]] || []).forEach(function(pts){
        if (!pts || pts.length < 2) return;
        var ln = L.polyline(pts, { renderer:MAP_CV, color: all ? TFW_COL[+fk] : k[1], weight: all ? 3.5 : (drawn ? 5 : 4), opacity:0.95, dashArray: k[0] === 'back' ? '7 6' : null,   /* (V27.5) العودةُ متقطّعةٌ دائمًا: الجوهرةُ وسوقُ العرب يحملان الاتجاهين معًا فيُرى الاثنان */ lineCap:'round', lineJoin:'round', interactive:false });
        ln.addTo(TFW.lines); made.push(ln);
      });
    });
    /* (V26.0) الدورُ الرابع بالقطار: خطُّ قطار المشاعر (من منى ١ و٢ إلى محطة الجمرات) بلونه ومتقطّعًا — الحجاجُ يركبونه لا يمشونه */
    (fl.train || []).forEach(function(pts){
      if (!pts || pts.length < 2) return;
      var tr = L.polyline(pts, { renderer:MAP_CV, color:'#2F80ED', weight:6, opacity:0.95, dashArray:'14 10', lineCap:'round', lineJoin:'round', interactive:false });
      tr.addTo(TFW.lines); made.push(tr);
    });
  });
  /* (V25.6) «احتمال مخيم»: طرفُ خطٍّ في مخطّط الوزارة بلا مخيمٍ مسجَّلٍ عنده — دائرةٌ متقطّعةٌ بلون دوره، للتحقّق الميداني، وليست نقطةً ولا تُعَدّ */
  (TFW.routes.maybe || []).forEach(function(m){
    if (!all && String(m.floor) !== String(TFW.f)) return;
    if (!(+m.lat) || !(+m.lng)) return;
    L.circleMarker([+m.lat, +m.lng], { renderer:MAP_CV, radius:7, color:TFW_COL[+m.floor] || '#F5C400', weight:2, dashArray:'3 3', fillColor:'#fff', fillOpacity:0.35, bubblingMouseEvents:false })
      .bindPopup('<b>' + esc(t('احتمال مخيم')) + '</b><br><span class="hint">' + esc(t('طرفُ مسارٍ في مخطّط الوزارة بلا مخيمٍ مسجَّل — يُتحقَّق ميدانيًّا')) + ' \u00b7 ' + esc(t(floorName(+m.floor))) + '</span>')
      .addTo(TFW.lines);
  });
  /* الترتيبُ على اللوح: المخيماتُ في الخلف، ثم الخطوط، ثم النقاط */
  made.forEach(function(l){ try { l.bringToBack(); } catch (e){ LS_ERR = e; } });
  Object.keys(MK.by).forEach(function(id){ var e = MK.by[id]; if (e && e.kind === 'poly'){ try { e.l.bringToBack(); } catch (e2){ LS_ERR = e2; } } });
}

/* ═══ مسارُ المخيم (V24.5) ═══
   «لما أختار مخيم بعينه يطلعلي مسار الذهاب والعودة بتاعه ورايح على أنهي دور». من خطوط الدور نفسِها
   (شبكةٌ على الشوارع الفعلية) يُحسَب أقصرُ طريق: الذهابُ من المخيم إلى مداخل المنشأة، والعودةُ من مخرج
   دوره إلى المخيم — ويُرسَمان وحدَهما مع المسافة ووقت المشي (٦٠ م في الدقيقة: سيرُ الزحام). */
var TFW_JIN = [21.4199, 39.8747], TFW_JEX = ['0014', '0017', '0020', '0023', '0026'];
function tfwM(a, b){ var dy = (a[0] - b[0]) * 110574, dx = (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180); return Math.sqrt(dx * dx + dy * dy); }
function tfwNet(lines){
  var id = {}, P = [], A = [];
  var node = function(p){ var k = p[0].toFixed(6) + ',' + p[1].toFixed(6); if (id[k] == null){ id[k] = P.length; P.push(p); A.push([]); } return id[k]; };
  (lines || []).forEach(function(l){ for (var i = 1; i < l.length; i++){ var a = node(l[i - 1]), b = node(l[i]), d = tfwM(l[i - 1], l[i]); A[a].push([b, d]); A[b].push([a, d]); } });
  return { P:P, A:A };
}
function tfwNear(N, p){ var bi = -1, bd = Infinity; for (var i = 0; i < N.P.length; i++){ var d = tfwM(N.P[i], p); if (d < bd){ bd = d; bi = i; } } return [bi, bd]; }
function tfwPath(N, s, t){
  var n = N.P.length, D = [], prev = [], H = [[0, s]], i;
  for (i = 0; i < n; i++){ D.push(Infinity); prev.push(-1); }
  D[s] = 0;
  var push = function(x){ H.push(x); var k = H.length - 1; while (k > 0){ var q = (k - 1) >> 1; if (H[q][0] <= H[k][0]) break; var tmp = H[q]; H[q] = H[k]; H[k] = tmp; k = q; } };
  var pop = function(){ var top = H[0], last = H.pop(); if (H.length){ H[0] = last; var k = 0; for (;;){ var l = 2 * k + 1, r = l + 1, m = k; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === k) break; var tmp = H[m]; H[m] = H[k]; H[k] = tmp; k = m; } } return top; };
  H = []; push([0, s]);
  while (H.length){
    var cur = pop(), u = cur[1];
    if (cur[0] > D[u]) continue;
    if (u === t) break;
    N.A[u].forEach(function(e){ var nd = D[u] + e[1]; if (nd < D[e[0]]){ D[e[0]] = nd; prev[e[0]] = u; push([nd, e[0]]); } });
  }
  if (!isFinite(D[t])) return null;
  var pts = []; for (var v = t; v !== -1; v = prev[v]) pts.push(N.P[v]);
  return { pts:pts.reverse(), len:D[t] };
}
function tfwCampCalc(id){
  var f = tfwFloorOf(id), x = siteFind(id), R = TFW.routes && TFW.routes.floors ? TFW.routes.floors[String(f)] : null;
  if (f == null || !x || !R) return null;
  var c = [x.lat, x.lng], ex = siteFind('NSK-JMR-PNT-' + TFW_JEX[f]), E = ex ? [ex.lat, ex.lng] : TFW_JIN;
  var G = tfwNet((R.go || []).concat(R.train || [])), B = tfwNet((R.back || []).concat(R.train || [])), EN = (TFW.routes.ends || {}).en || {}, EX = (TFW.routes.ends || {}).ex || {};   /* (V26.0) خطُّ القطار جزءٌ من شبكة الدور الرابع */
  var a = tfwNear(G, c), h = tfwNear(B, c), p1 = null, p2 = null;
  /* (V24.8) الذهابُ ينتهي عند أقرب مدخلٍ من مداخل دوره، والعودةُ تبدأ من أقرب مخرجٍ من مخارجه — لا عند نقطةٍ ثابتة */
  (EN[f] || []).concat(EN[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, tp = q ? [q.lat, q.lng] : TFW_JIN, b = tfwNear(G, tp), p = a[0] >= 0 && b[0] >= 0 ? tfwPath(G, a[0], b[0]) : null; if (p && (!p1 || p.len < p1.len)) p1 = p; });
  (EX[f] || []).concat(EX[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, sp = q ? [q.lat, q.lng] : E, e = tfwNear(B, sp), p = e[0] >= 0 && h[0] >= 0 ? tfwPath(B, e[0], h[0]) : null; if (p && (!p2 || p.len < p2.len)) p2 = p; });
  if (!p1 || !p2) return null;
  return { id:id, f:f, go:{ pts:[c].concat(p1.pts), len:Math.round(p1.len + a[1]) }, back:{ pts:p2.pts.concat([c]), len:Math.round(p2.len + h[1]) } };
}
function tfwCampRoute(id){
  var f = tfwFloorOf(id); if (f == null) return;
  TFW.f = f; TFW.camp = null;
  var show = function(){
    var r = tfwCampCalc(id);
    if (!r){ toast(t('تعذر حساب مسار هذا المخيم')); return; }
    TFW.camp = r; tfwPaint(); render(1);
    try { MAP.fitBounds(L.latLngBounds(r.go.pts.concat(r.back.pts)), { padding:[40, 40] }); } catch (e){ LS_ERR = e; }
  };
  if (TFW.routes && TFW.data) show(); else { TFW.after = show; tfwLoad(); tfwPaint(); }
}

function tfwFloorOf(id){ return (TFW.data && TFW.data.assign && TFW.data.assign[id] != null) ? TFW.data.assign[id] : null; }
function tfwRow(){
  /* (V26.5) قرارُ المالك: صفٌّ واحدٌ للأدوار (صفُّ النقاط أدناه) يحكم المسارَ والنقاطَ معًا — وهنا إظهارُ المسار وإخفاؤه فقط */
  var h = '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">\u{1F6B6} ' + esc(t('مسار التفويج')) + '</span>'
    + '<button type="button" class="cat' + (TFW.f < 0 ? ' on' : '') + '" data-tfw="-1">' + esc(t('إخفاء')) + '</button>'
    + '<button type="button" class="cat' + (TFW.f >= 0 ? ' on' : '') + '" data-tfw="show">' + esc(t('إظهار')) + '</button>'
    + (TFW.f >= 0 ? '<span class="hint" style="margin:0 4px;align-self:center">' + (TFW.f === TFW_ALL ? esc(t('كل الأدوار — اختر الدور من صف الأدوار')) : esc(t('الدور') + ' ' + t(TFW_FL[TFW.f]))) + '</span>' : '') + '</div>';
  /* (V24.3) الاتجاه: الذهابُ والعودةُ معًا أو كلٌّ وحدَه — ومع «كل الأدوار» لكلِّ دورٍ لونُه والعودةُ متقطّعة */
  if (TFW.f >= 0) h += '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('الاتجاه')) + '</span>' + [['both', 'الذهاب والعودة'], ['go', 'الذهاب فقط'], ['back', 'العودة فقط']].map(function(o){
      return '<button type="button" class="cat' + (TFW.d === o[0] ? ' on' : '') + '" data-tfwd="' + o[0] + '">' + esc(t(o[1])) + '</button>'; }).join('') + '</div>';
  if (TFW.f >= 0 && TFW.f < TFW_ALL && TFW.data) h += '<div class="tfw-card"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;background:' + (TFW_COL[TFW.f] || '#F5C400') + '55;border:2px solid ' + (TFW_COL[TFW.f] || '#F5C400') + '"></i> ' + esc(t('مخيمات الدور')) + ' ' + esc(t(TFW_FL[TFW.f])) + ': <b>' + nm(tfwCampsOf(TFW.f).length) + '</b> ' + esc(t('مخيمًا')) + ' \u2014 ' + esc(t('مظلّلةٌ على الخريطة بلون الدور')) + '</div>';   /* (V27.8) */
  if (TFW.f === TFW_ALL) h += '<div class="tfw-card">' + TFW_FL.map(function(n, i){ return '<span style="display:inline-flex;align-items:center;gap:5px;margin-inline-end:12px"><i style="width:18px;height:4px;border-radius:2px;background:' + TFW_COL[i] + '"></i>' + esc(t('الدور') + ' ' + t(n)) + ' <span class="num">' + nm(tfwCampsOf(i).length) + '</span> ' + esc(t('مخيمًا')) + '</span>'; }).join('')
      + '<div class="hint" style="margin:4px 0 0;font-size:11px">' + esc(t('الخط المتصل: الذهاب · المتقطع: العودة')) + '</div></div>';
  if (TFW.camp){ var cs = siteFind(TFW.camp.id), mins = function(m){ return nm(Math.max(1, Math.round(m / 60))); };
    h += '<div class="tfw-card"><b>' + esc(t('مسار المخيم')) + ': ' + esc(cs ? siteTitle(cs) : TFW.camp.id) + '</b> \u2014 ' + esc(t('الدور') + ' ' + t(TFW_FL[TFW.camp.f]))
      + '<div style="margin:4px 0 0"><i style="display:inline-block;width:16px;height:4px;border-radius:2px;background:#F5C400;vertical-align:middle"></i> ' + esc(t('الذهاب')) + ' <b class="num">' + nm(TFW.camp.go.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + mins(TFW.camp.go.len) + ' ' + esc(t('دقيقة مشيا'))
      + ' \u2003 <i style="display:inline-block;width:16px;height:4px;border-radius:2px;background:#D0021B;vertical-align:middle"></i> ' + esc(t('العودة')) + ' <b class="num">' + nm(TFW.camp.back.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + mins(TFW.camp.back.len) + ' ' + esc(t('دقيقة مشيا')) + '</div>'
      + '<div style="margin:6px 0 0">' + btn('إلغاء', 'btn-quiet btn-sm', ' data-tfwcampx="1"') + '</div></div>'; }
  var F = TFW.f >= 0 && TFW.f < TFW_ALL && TFW.data ? TFW.data.floors[TFW.f] : null;
  if (TFW.f >= 0 && !TFW.data) h += '<p class="hint" style="margin:4px 0 0">' + esc(t('تُحمَّل الطبقة…')) + '</p>';
  if (F){
    var by = Object.keys(F.near.by || {}).map(function(k){ return typeLabel(k) + ' ' + nm(F.near.by[k]); }).join(' \u00b7 ');
    h += '<div class="tfw-card"><b>' + esc(t('الدور') + ' ' + t(F.name)) + '</b> \u2014 ' + nm(F.camps) + ' ' + esc(t('مخيمًا من مخيماتنا يخدمها هذا الدور'))
      + '<div class="hint" style="margin:4px 0 0">' + esc(t('أطولُ مسارٍ ذهابًا وعودة')) + ' <b class="num">' + nm(F.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + esc(t('العرضُ الأدنى')) + ' <b class="num">' + nm(F.width) + '</b> ' + esc(t('م'))
      + ' \u00b7 ' + esc(t('فرقُ المنسوب')) + ' <b class="num">' + nm(F.elev) + '</b> ' + esc(t('م')) + ' \u00b7 ' + esc(t(F.lift)) + '</div>'
      + '<div style="margin:4px 0 0">' + esc(t('ملاحظة الوزارة')) + ': ' + esc(t(F.note)) + (F.rec && F.rec !== '\u2014' ? ' \u2014 <b>' + esc(t('المقترح')) + ':</b> ' + esc(t(F.rec)) : '') + '</div>'
      + '<div class="hint" style="margin:4px 0 0">' + esc(t('نقاطُنا على مسار هذا الدور (٤٠ م)')) + ': <b class="num">' + nm(F.near.n) + '</b> \u2014 ' + esc(by) + '</div>'
      + '<div class="hint" style="margin:4px 0 0;font-size:11px">' + esc(t('المصدر')) + ': ' + esc(TFW.data.src) + ' \u00b7 ' + esc(t('أصفر: الذهاب · أحمر: العودة')) + '</div></div>';
  }
  return h;
}
/* ═══ (V37.54) شريطُ الترشيح: «المختار» فوق، والمشعرُ مفتوحٌ دائمًا، وما سواه أقسامٌ مطوية — قرارُ المالك: «القائمة كبرت» ═══
   كلُّ قسمٍ سطرٌ واحدٌ فيه اسمُه والمختارُ منه، يُفتح بضغطة. والشرائحُ ذاتُ الصفر تحت الاختيار الحالي لا تُرسَم أصلًا، فاختيارُ مشعرٍ يُبقي أنواعَه
   وتصنيفاتِه وحدَها. حالُ الفتح يُحفَظ على الجهاز (nsk14.fsec). الأرقامُ والفلاترُ وما يحدث على الخريطة والقوائم والتصدير كما كانت. */
var FSEC_OPEN = null;
function fsecOpen(){ if (!FSEC_OPEN){ try { FSEC_OPEN = JSON.parse(lsGet('nsk14.fsec') || 'null') || { type:1 }; } catch (e){ FSEC_OPEN = { type:1 }; } } return FSEC_OPEN; }
function fsecSet(k, on){ var o = fsecOpen(); if (on) o[k] = 1; else delete o[k]; try { lsSet('nsk14.fsec', JSON.stringify(o)); } catch (e){ LS_ERR = e; } }
function fsec(key, label, sel, body, forceOpen){
  if (!body) return '';
  var open = !!(forceOpen || fsecOpen()[key]);
  return '<div class="fsec fsec-' + key + (open ? ' open' : '') + '"><button type="button" class="fsec-h" data-fsech="' + key + '" aria-expanded="' + (open ? 'true' : 'false') + '"><span class="fsec-t">' + esc(t(label)) + '</span>'
    + (sel ? '<span class="fsec-s">' + sel + '</span>' : '<span class="fsec-s hint" style="margin:0">' + esc(t('الكل')) + '</span>') + '<span class="fsec-c" aria-hidden="true">\u276F</span></button><div class="fsec-b"' + (open ? '' : ' hidden') + '>' + body + '</div></div>';
}
function catBar(withWork){
  var C = catCounts(), S = siteStats();
  var zones = TAX_G.filter(function(g){ return C.zone[g]; });   /* (V27.2) بترتيب المالك */
  var types = TAX_T.filter(function(ty){ return C.type[ty]; });
  /* ─ المشعر: مفتوحٌ دائمًا ─ */
  var zoneRow = '<div class="catrow">'
    + '<button type="button" class="cat zone' + (FILT.zone?'':' on') + '" data-fz="">' + esc(t('الكل')) + ' <span class="n">' + nm(S.total) + '</span></button>'
    + zones.map(function(z){ return '<button type="button" class="cat zone' + (FILT.zone===z?' on':'') + '" data-fz="' + esc(z) + '">' + esc(z) + ' <span class="n">' + nm(C.zone[z]) + '</span></button>'; }).join('') + '</div>';
  /* ─ النوع ─ */
  var typeRow = types.length > 1 || FILT.type ? '<div class="catrow">' + types.map(function(ty){
      var d = TAX_DEF[ty] || { l:ty, i:'\u25CF', c:'#8A939D' }, on = FILT.type === ty;
      return '<button type="button" class="cat' + (on?' on':'') + '" data-ft="' + esc(ty) + '" style="border-color:' + d.c + (on ? ';background:' + d.c + '22;color:' + d.c : '') + '">' + d.i + ' ' + esc(t(d.l)) + ' <span class="n">' + nm(C.type[ty]) + '</span></button>'; }).join('') + '</div>' : '';
  var typeSel = FILT.type ? esc(t((TAX_DEF[FILT.type] || { l:FILT.type }).l)) : '';
  /* ─ المسارات ─ */
  var routeRow = '', routeSel = '';
  { var RT = routesList(), rks = Object.keys(RT).sort(function(a, b){ return RT[b] - RT[a]; });
    if (rks.length){ routeRow = '<div class="catrow"><button type="button" class="cat' + (FILT.route ? '' : ' on') + '" data-fr="">' + esc(t('كل المسارات')) + '</button>'
      + rks.map(function(k){ return '<button type="button" class="cat' + (FILT.route === k ? ' on' : '') + '" data-fr="' + esc(k) + '">\u{1F6E3} ' + esc(k) + ' <span class="n">' + nm(RT[k]) + '</span></button>'; }).join('') + '</div>'; routeSel = FILT.route ? esc(FILT.route) : ''; } }
  var tfw = CUR === 'map' ? tfwRow() : '';   /* (V23.2) طبقةُ مسار التفويج */
  /* ─ الأدوار (V22.2): حين تحمل النقاطُ المختارةُ أدوارًا ─ */
  var floorRow = '', floorSel = '';
  { var FC = {};
    STATE.sites.forEach(function(x){ var f = siteFloor(x); if (f == null) return; if (FILT.zone && taxOf(x).g !== FILT.zone) return; if (FILT.type && taxOf(x).t !== FILT.type) return; FC[f] = (FC[f] || 0) + 1; });
    var fks = Object.keys(FC).map(Number);
    if (typeof TFW === 'object' && TFW.f >= 0) [0, 1, 2, 3, 4].forEach(function(f){ if (fks.indexOf(f) < 0) fks.push(f); });
    fks.sort(function(a, b){ return a - b; });
    if (fks.length > 1){ var fon = FILT.floor !== '' && FILT.floor != null;
      floorRow = '<div class="catrow"><button type="button" class="cat' + (fon ? '' : ' on') + '" data-ffl="">' + esc(t('كل الأدوار')) + '</button>'
        + fks.map(function(f){ return '<button type="button" class="cat' + (fon && +FILT.floor === f ? ' on' : '') + '" data-ffl="' + f + '">\u{1F3E2} ' + esc(t(floorName(f))) + (FC[f] ? ' <span class="n">' + nm(FC[f]) + ' ' + esc(t('نقطة')) + '</span>' : '') + '</button>'; }).join('') + '</div>';
      floorSel = fon ? esc(t(floorName(+FILT.floor))) : ''; } }
  /* ─ وجهُ العمل ─ */
  var workRow = '', workSel = '';
  if (withWork){ var wks = Object.keys(C.work).sort(function(a,b){ return C.work[b] - C.work[a]; });
    if (wks.length > 1){ workRow = '<div class="catrow"><button type="button" class="cat' + (FILT.work?'':' on') + '" data-fw="">' + esc(t('كل الأوجه')) + '</button>'
      + wks.map(function(k){ return '<button type="button" class="cat' + (FILT.work===k?' on':'') + '" data-fw="' + esc(k) + '">' + esc(k) + ' <span class="n">' + nm(C.work[k]) + '</span></button>'; }).join('') + '</div>'; workSel = FILT.work ? esc(FILT.work) : ''; } }
  /* ─ الحالة، والتقريرُ التنفيذي، والمجموعاتُ الأربع: على ما مرّ من المرشّحات ─ */
  var lifeRow = '', lifeSel = '', execRow = '', execSel = '', grpRow = '', grpSel = '';
  if (typeof lifeOf === 'function' && typeof LIFE_ORDER !== 'undefined'){
    var lc = {}, base = STATE.sites.filter(function(x){
      if (FILT.zone && taxOf(x).g !== FILT.zone) return false; if (FILT.type && taxOf(x).t !== FILT.type) return false;
      if (FILT.work && x.work !== FILT.work) return false; if (CO_SEL.length && CO_SEL.indexOf(x.co) < 0) return false; return true; });
    base.forEach(function(x){ var l = lifeOf(x); lc[l] = (lc[l] || 0) + 1; });
    var lifeKeys = LIFE_ORDER.filter(function(k){ return lc[k]; });
    if (typeof execStatusMemo === 'function' && typeof CC_GROUPS !== 'undefined'){
      var ec = {}, gc = {}; base.forEach(function(x){ var el = execLabelOf(execStatusMemo(x)); ec[el] = (ec[el] || 0) + 1; ccGroupsOfSite(x).forEach(function(g){ gc[g] = (gc[g] || 0) + 1; }); });
      var eKeys = []; EXEC_ORDER_L.forEach(function(k){ var el = execLabelOf(k); if (ec[el] && eKeys.indexOf(el) < 0) eKeys.push(el); });
      if (eKeys.length){ execRow = '<div class="catrow"><button type="button" class="cat' + (FILT.exec ? '' : ' on') + '" data-fx="">' + esc(t('الكل')) + '</button>'
        + eKeys.map(function(el){ return '<button type="button" class="cat' + (FILT.exec === el ? ' on' : '') + '" data-fx="' + esc(el) + '">' + esc(t(el)) + ' <span class="num">' + nm(ec[el]) + '</span></button>'; }).join('') + '</div>'; execSel = FILT.exec ? esc(t(FILT.exec)) + (ec[FILT.exec] ? ' <b>' + nm(ec[FILT.exec]) + '</b>' : '') : ''; }
      var gKeys = CC_GROUPS.filter(function(g){ return gc[g.g]; });
      if (gKeys.length){ grpRow = '<div class="catrow"><button type="button" class="cat' + (FILT.ccg ? '' : ' on') + '" data-fg="">' + esc(t('الكل')) + '</button>'
        + gKeys.map(function(g){ return '<button type="button" class="cat' + (FILT.ccg === g.g ? ' on' : '') + '" data-fg="' + g.g + '">' + esc(t(g.n)) + ' <span class="num">' + nm(gc[g.g]) + '</span></button>'; }).join('') + '</div>';
        var gSel = CC_GROUPS.filter(function(g){ return g.g === FILT.ccg; })[0]; grpSel = gSel ? esc(t(gSel.n)) + (gc[gSel.g] ? ' <b>' + nm(gc[gSel.g]) + '</b>' : '') : ''; }
    }
    if (lifeKeys.length){ lifeRow = '<div class="catrow"><button type="button" class="cat' + (FILT.life ? '' : ' on') + '" data-fl="">' + esc(t('كل الحالات')) + '</button>'
      + lifeKeys.map(function(k){ var L = LIFE[k], on = FILT.life === k;
        return '<button type="button" class="cat' + (on ? ' on' : '') + '" data-fl="' + esc(k) + '" style="border-color:' + L.c + (on ? ';background:' + L.c + '22;color:' + L.c : '') + '"><span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:' + L.c + ';margin-inline-end:4px"></span>' + esc(t(L.n)) + ' <span class="n">' + nm(lc[k]) + '</span></button>'; }).join('') + '</div>';
      lifeSel = FILT.life && LIFE[FILT.life] ? '<span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:' + LIFE[FILT.life].c + ';margin-inline-end:4px"></span>' + esc(t(LIFE[FILT.life].n)) + (lc[FILT.life] ? ' <b>' + nm(lc[FILT.life]) + '</b>' : '') : ''; }
  }
  /* ─ «المختار» فوق: كلُّ مرشِّحٍ فعّالٍ بشريحةٍ تُزال بضغطة، وعددُ ما يمرّ ─ */
  var act = [];
  if (FILT.zone) act.push(['zone', esc(FILT.zone)]); if (FILT.type) act.push(['type', typeSel]); if (FILT.route) act.push(['route', routeSel]);
  if (FILT.floor !== '' && FILT.floor != null) act.push(['floor', floorSel]); if (FILT.work) act.push(['work', workSel]);
  if (FILT.life) act.push(['life', esc(t((LIFE[FILT.life] || { n:FILT.life }).n))]); if (FILT.exec) act.push(['exec', esc(t(FILT.exec))]); if (FILT.ccg) act.push(['ccg', grpSel.replace(/ <b>.*$/, '')]);
  var passN = act.length ? STATE.sites.filter(function(x){ return filtPass(x); }).length : S.total;
  var sum = act.length ? '<div class="fsum"><span class="hint" style="margin:0">' + esc(t('المختار')) + '</span>'
    + act.map(function(a){ return '<button type="button" class="chip on fsum-x" data-fclr="' + a[0] + '" title="' + esc(t('أزل هذا المرشّح')) + '">' + a[1] + ' \u2715</button>'; }).join('')
    + '<span class="pill acc">' + nm(passN) + ' ' + esc(t('نقطة')) + '</span>' + btn(t('امسح الكل'), 'btn-quiet btn-sm', ' data-fclr="all"') + '</div>' : '';
  return '<div class="catbar">' + sum + zoneRow
    + fsec('type', 'النوع', typeSel, typeRow, !!FILT.type)
    + fsec('life', 'الحالة', lifeSel, lifeRow, !!FILT.life)
    /* (V37.55) تسمياتُ المالك: «التحديات» و«معالجة التحديات» و«أدوار منشأة الجمرات» */
    + fsec('exec', 'التحديات', execSel, execRow, !!FILT.exec)
    + fsec('ccg', 'معالجة التحديات', grpSel, grpRow, !!FILT.ccg)
    + fsec('floor', 'أدوار منشأة الجمرات', floorSel, floorRow, FILT.floor !== '' && FILT.floor != null)
    + fsec('route', 'المسارات', routeSel, routeRow, !!FILT.route)
    + (tfw ? fsec('tfw', 'مسار التفويج', '', tfw, false) : '')
    + fsec('work', 'وجه العمل', workSel, workRow, !!FILT.work)
    + '</div>';
}

/* المرشَّحُ يُبنى مرةً ويُخزَّن حتى يتغيّر الترشيح */
var FILT_CACHE = null, FILT_KEY = '';

function filtered(){
  var k = FILT.zone + '|' + FILT.type + '|' + FILT.work + '|' + FILT.life + '|' + STAT_VER
        + '|' + CO_SEL.join(',');
  if (FILT_CACHE && FILT_KEY === k) return FILT_CACHE;
  FILT_KEY = k;
  FILT_CACHE = filtOn() ? STATE.sites.filter(filtPass) : STATE.sites;
  return FILT_CACHE;
}

