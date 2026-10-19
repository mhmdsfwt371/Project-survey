/* ═══ الإعدادات — تفاصيل القديم كاملةً بالتصميم الجديد ═══
   نفس النصوص والحقول والجداول والقواعد، مبنيةً ببطاقات التصميم الجديد. */

/* ═══ أنواعُ النقاط: تُضاف وتُعدَّل وتُحذَف ═══════════════════════════════
   صفوفُ «نقاط الزيارات» و«نقاط الفك» تركيباتٌ من مشعرٍ ونوع، تُشتقُّ من
   `CAT_DEF`. فالإضافةُ هنا إضافةُ نوعٍ لا صفّ: يُضاف «مبنى خدمات» فيظهر في
   المشاعر الثلاثة، ويُضبَط وزنُه قبل أن تأتي أولُ نقطةٍ منه.

   والنوعُ الذي عليه مواقعُ لا يُحذَف: مواقعُه تحمل اسمَه، وحذفُه يجعلها
   بلا تصنيفٍ فتسقط من كلِّ تجميعٍ ولا يُعرَف أين ذهبت. */

/* ═══ سجلُّ الأنواع يُطبَّع مرةً لكلِّ نسخةٍ منه (V17.60) ═══
   كان يُزرَع من الكتالوج مرةً ثم لا يُعاد إليه — فالسجلُّ السحابيُّ الذي سبق
   نوعًا مدمَجًا جديدًا لا يعرفه أبدًا: لا يظهر الجيت واي ولا الحساس في قائمة
   المسار ولا في شاشة الأنواع. وكانت وثيقتُه تحمل ختمَي الكتابة (_by و_at)
   فيُقرآن نوعين، والحذفُ لا يثبت لأن الكتابةَ دمجٌ يُبقي المحذوف، والشكلُ
   يسقط عند الحفظ. فصار يُطبَّع حين تتبدّل نسختُه: يُنزَع الختم، ويُقرأ شاهدُ
   الحذف {gone:true} فلا يُعاد المحذوف، ويُضاف المدمَجُ الغائب، ويُستبدَل الاسمُ
   الافتراضيُّ القديمُ بجديده ما لم يغيّره أحد، ويُزامَن منه الكتالوج — فيرى
   نموذجُ الموقع الجديد ما أُضيف في جهازٍ آخر. */
var TYPES_NORM = null;
/* تسمياتٌ قديمةٌ في سجلِّ الأنواع تُردُّ إلى التسمية الحالية عند كلِّ تحميل — منها
   خطأٌ إملائيٌّ («فالوزارة») وتسمياتُ ما قبل توحيد عائلة كاميرات الوزارة (V19.1) */
var TYPES_OLD_L = { 'LPR':['قراءة اللوحات', 'كاميرات قراءة اللوحات', 'كاميرات LPR', 'كاميرات الوزارة — LPR'], 'كاميرا':['كاميرات الوزارة الذكيّة', 'كاميرات فالوزارة', 'كاميرات الوزارة'] };   /* (V28.5) والتسميتان السابقتان تُردّان للجديدتين */
/* ومفاتيحُ الأوزان المكتوبةُ بالتسمية القديمة تُقرأ للتسمية الجديدة حتى يُنقَل قرارُها */
var W_ALIAS = { 'كاميرات المتابعة':['كاميرات الوزارة', 'كاميرات فالوزارة', 'كاميرات الوزارة الذكيّة'], 'مراكز التفويج':['كاميرات الوزارة — LPR', 'كاميرات قراءة اللوحات', 'كاميرات LPR'] };   /* (V28.5) أوزانُ التسمية السابقة تُقرأ للجديدة */
function typeCopy(v){
  var o = { l:v.l, i:v.i, c:v.c };
  if (v.s) o.s = v.s;
  return o;
}
function typesNormalize(T){
  var gone = {};
  Object.keys(T).forEach(function(k){
    var v = T[k];
    if (k.charAt(0) === '_' || !v || typeof v !== 'object'){ delete T[k]; return; }
    if (v.gone){ gone[k] = 1; delete T[k]; return; }
    var b = CAT_DEF_BASE[k];
    if (b && TYPES_OLD_L[k] && TYPES_OLD_L[k].indexOf(v.l) > -1) v.l = b.l;
    if (b && !v.s && b.s) v.s = b.s;
    /* (V20.1) مدخلٌ في السجلِّ بتسميةٍ وحدَها (قرارُ تسمية) كان يُفقِد النوعَ رمزَه ولونَه:
       «undefined» في نافذة النقطة ودائرةٌ بلا لون — يُكمَل من الأصل أو بافتراضٍ محايد */
    if (!v.i) v.i = (b && b.i) || '\u25CF';
    if (!v.c) v.c = (b && b.c) || '#8A94A6';
    if (!v.l) v.l = (b && b.l) || k;
  });
  Object.keys(CAT_DEF_BASE).forEach(function(k){
    if (!T[k] && !gone[k]) T[k] = typeCopy(CAT_DEF_BASE[k]);
  });
  STATE.typesGone = gone;
  TYPES_NORM = T;
  Object.keys(T).forEach(function(k){ CAT_DEF[k] = typeCopy(T[k]); });
  Object.keys(gone).forEach(function(k){ if (CAT_DEF[k] && !typeUsed(k)) delete CAT_DEF[k]; });
}
function typesList(){
  if (!STATE.types || typeof STATE.types !== 'object') STATE.types = {};
  if (TYPES_NORM !== STATE.types) typesNormalize(STATE.types);
  return STATE.types;
}
function typesSave(){
  var T = typesList();
  Object.keys(T).forEach(function(k){ CAT_DEF[k] = typeCopy(T[k]); });
  Object.keys(CAT_DEF).forEach(function(k){ if (!T[k]) delete CAT_DEF[k]; });
  /* الكتابةُ دمجٌ في القاعدة: ما حُذف يُكتَب شاهدًا وإلا بقي فيها وعاد مع أوّل سحب */
  var W = {};
  Object.keys(T).forEach(function(k){ W[k] = T[k]; });
  Object.keys(STATE.typesGone || {}).forEach(function(k){ if (!T[k]) W[k] = { gone:true }; });
  CORE.set('cfg', 'types', W);
  SITE_IX = null; SITE_TOK = null;
  statBump();
}
function typeUsed(k){
  return (STATE.sites || []).filter(function(x){ return x.type === k; }).length;
}
function typeSet(k, patch){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var T = typesList();
  if (!T[k]) return;
  Object.keys(patch).forEach(function(p){ T[k][p] = patch[p]; });
  typesSave();
}
function typeAdd(){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var k = g('tyK'), l = g('tyL');
  if (!k){ toast(t('اكتب اسم النوع')); return; }
  if (typesList()[k]){ toast(t('النوعُ موجودٌ بالفعل')); return; }
  typesList()[k] = { l:l || k, i:g('tyI') || '\u25CF', c:g('tyC') || '#8A939D', s:g('tyS') || 'circle' };
  if (STATE.typesGone) delete STATE.typesGone[k];   /* نوعٌ حُذف ثم أُعيد: يُرفَع شاهدُه */
  typesSave();
  logEvent('نوع نقطة جديد — ' + k);
  toast(t('أُضيف النوع'));
  render(1);
}
function typeDel(k){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var u = typeUsed(k);
  if (u){ toast(t('عليه') + ' ' + nm(u) + ' ' + t('موقعًا — لا يُحذَف')); return; }
  var T = typesList();
  if (!T[k]) return;
  delete T[k];
  (STATE.typesGone = STATE.typesGone || {})[k] = 1;   /* شاهدُ حذفٍ يُكتَب مع الحفظ */
  typesSave();
  logEvent('حذف نوع نقطة — ' + k);
  toast(t('حُذف النوع'));
  render(1);
}

/* ═══ نقلُ النقاط إلى تصنيف (V23.0) ═══
   «خليني أعرف أضيف تصنيف وأمسح وأعمل assign للنقاط في التصنيف ده»: الإضافةُ والحذفُ كانا في
   «التخطيط ← نقاط المراحل» وحدَها، ولا سبيلَ لنقل نقطةٍ من تصنيفٍ إلى آخر إلا بقرارٍ في المستودع،
   والتصنيفُ الذي عليه نقاطٌ لا يُحذَف أبدًا. صار: النقاطُ المحدَّدةُ على الخريطة تُنقَل إلى أيِّ تصنيفٍ
   من لوح الإسناد نفسِه، والتصنيفُ المستعمَلُ يُحذَف بعد نقل نقاطه إلى غيره — والبطاقةُ في «المواقع».
   النقلُ تجاوزٌ في وثيقة النقطة (sites/{id}) كتعديل البيانات: يُزامَن ويُسجَّل، والزياراتُ لا تُمَسّ. */
function siteSetType(id, to){
  var x = siteFind(id); if (!x || x.type === to) return false;
  x.type = to; siteOvSet(id, { type:to });
  return true;
}
function selSetType(to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || !typesList()[to]){ toast(t('اختر التصنيف')); return 0; }
  var n = 0;
  selIds().forEach(function(id){ if (siteSetType(id, to)) n++; });
  if (n){ logEvent('نقلُ ' + n + ' نقطةٍ إلى التصنيف «' + to + '»'); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة نُقلت إلى التصنيف') + ' «' + t((typesList()[to] || {}).l || to) + '»');
  return n;
}
/* (V23.1) «عاوز أعدّل الحاجات المرفوعة — مسميات وخلافه»: نقاطُ الميدان تصل بأسماءٍ عامة («عرفات - مربع
   - شاخص»، «كاميرا - منى - N001»). النقطةُ الواحدةُ تُعدَّل من «تعديل البيانات»، والمحدَّدُ دفعةً باسمٍ
   ورقمٍ متتابع — بالتجاوز نفسِه، فيبقى بعد الإقلاع للنقاط المسجَّلة والمرفوعة معًا. */
function selRename(pfx, from){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return 0; }
  pfx = String(pfx || '').trim(); from = Math.max(1, Math.round(cfgN(from) || 1));
  if (!pfx){ toast(t('اكتب بدايةَ الاسم')); return 0; }
  var ids = selIds().slice().sort(), n = 0, who = STATE.meta.name || '';
  ids.forEach(function(id, i){ var x = siteFind(id); if (!x) return; var nmv = pfx + ' ' + nm(from + i);
    if (x.name === nmv) return; x.name = nmv; siteOvSet(id, { name:nmv, edBy:who, edAt:Date.now() }); n++; });
  if (n){ logEvent('تسميةُ ' + n + ' نقطةٍ دفعةً — «' + pfx + '» من ' + from); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة سُمّيت'));
  return n;
}
function typeMoveDel(k, to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || to === k || !typesList()[to]){ toast(t('اختر تصنيفًا تنتقل إليه نقاطُه')); return 0; }
  var n = 0;
  (STATE.sites || []).slice().forEach(function(x){ if (x.type === k && siteSetType(x.id, to)) n++; });
  logEvent('نقلُ نقاط التصنيف «' + k + '» (' + n + ') إلى «' + to + '» ثم حذفُه');
  SITE_IX = null; SITE_TOK = null; statBump();
  typeDel(k);
  return n;
}
/* بطاقةُ إدارة الأنواع — تُعرَض في شاشتَي الزيارات والفك */
function typesCard(){
  /* نموذجُ الإضافة بطاقةٌ مستقلّةٌ لا وسيطٌ في رأس الجدول: كان يُمرَّر في
     خانة `right` من `cardFlush` — وهي مكانُ زرٍّ واحدٍ لا مكانُ ثلاثةِ
     حقول، فتتراصُّ رأسيًّا ويتبعثر الرأسُ ويطول. والقالبُ الصحيحُ نفسُه في
     «نقاط التهيئة»: حقولٌ في صفٍّ والزرُّ في رأس بطاقتها. */
  var T = typesList(), keys = Object.keys(T);
  return cardFlush(t('أنواع النقاط') + ' — ' + nm(keys.length),
      table(['النوع','الاسم المعروض','الرمز','اللون','الشكل على الخريطة','مواقع',''],
        keys.map(function(k){
          var u = typeUsed(k);
          /* اللونُ والشكلُ يُعدَّلان لكلِّ نوعٍ قائم (V17.60) — لا عند إضافته وحدَها؛
             والممرُّ والكاميرا معيّنٌ بعلامةٍ ثابتةٍ لها هدفُ لمسٍ خاصّ */
          var fixed = TYPE_SHAPE_DEF[k], sh = typeShape(k);
          /* وسمُ الحقل للقارئ الصوتيِّ باسم النوع المترجَم — كان يُشتقُّ من الخلية
             الأولى فيُقرأ «مخيمCamp» مفتاحًا عربيًّا ملتصقًا بترجمته */
          var al = function(col){ return ' aria-label="' + esc(t(col) + ' \u2014 ' + typeShort(k)) + '"'; };
          /* المفتاحُ الداخليُّ يُعرَض بالعربية لمن يقرؤها، وبغيرها تُعرَض ترجمتُه والمفتاحُ في التلميح (V23.0) */
          return [(LANG === 'ar' ? '<strong>' + esc(k) + '</strong>' : '<strong>' + esc(t(k)) + '</strong>'),
                  '<input value="' + esc(T[k].l) + '" data-tyl="' + esc(k) + '" dir="auto"' + al('الاسم المعروض') + '>',
                  '<input value="' + esc(T[k].i || '') + '" data-tyi="' + esc(k) + '" style="max-width:70px" dir="ltr"' + al('الرمز') + '>',
                  '<input type="color" value="' + esc(T[k].c || '#8A939D') + '" data-tyc="' + esc(k) + '" style="width:48px;min-height:34px;padding:2px"' + al('اللون') + '>',
                  fixed
                    ? shapeSvg(mapShapeOf(k), T[k].c) + ' <span class="hint" style="margin:0">' + esc(t('شكلٌ ثابت')) + '</span>'
                    : shapeSvg(sh, T[k].c) + ' <select data-tys="' + esc(k) + '" style="max-width:110px"' + al('الشكل على الخريطة') + '>'
                      + SHAPES.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (sh === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('')
                      + '</select>',
                  u ? pill(nm(u), 'acc') : N(0),
                  (may('settings')
                    ? (u ? '<select id="tyMv_' + esc(k) + '" aria-label="' + esc(t('انقل نقاطه إلى')) + '" style="max-width:150px"><option value="">' + esc(t('انقل نقاطه إلى…')) + '</option>'
                           + keys.filter(function(o){ return o !== k; }).map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(T[o].l || o)) + '</option>'; }).join('') + '</select> '
                           + btn('انقل واحذف','btn-quiet btn-sm',' data-tymove="' + esc(k) + '"')
                         : btn('حذف','btn-quiet btn-sm',' data-tydel="' + esc(k) + '"'))
                    : '')];
        })))
    + (may('settings')
      ? card('إضافة نوع',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النوع')) + ' <span class="req">*</span></label>'
          +   '<input id="tyK" dir="auto" placeholder="مبنى خدمات"></div>'
          + '<div class="field"><label>' + esc(t('الاسم المعروض')) + '</label>'
          +   '<input id="tyL" dir="auto" placeholder="مباني الخدمات"></div>'
          + '<div class="field"><label>' + esc(t('الرمز')) + '</label>'
          +   '<input id="tyI" dir="ltr" placeholder="\u25CF"></div>'
          + '<div class="field"><label>' + esc(t('اللون')) + '</label>'
          +   '<input id="tyC" type="color" value="#8A939D"></div>'
          + '<div class="field"><label>' + esc(t('الشكل على الخريطة')) + '</label><select id="tyS">'
          +   SHAPES.map(function(sh){ return '<option value="' + esc(sh[0]) + '">' + esc(t(sh[1])) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>',
          btn('➕ إضافة نوع','btn-primary btn-sm',' data-tyadd="1"'))
      : '')
    + '<p class="hint">' + esc(t('إضافةُ نوعٍ تُنشئ صفوفَه في المشاعر الثلاثة، فيُضبَط وزنُه قبل أن تأتي أولُ نقطةٍ منه. والنوعُ الذي عليه مواقعُ لا يُحذَف — مواقعُه تحمل اسمَه.')) + '</p>';
}

/* مصفوفةُ الأوزان: كانت عشرَ تركيباتٍ مكتوبةً بيدٍ بأعدادٍ محفورة. وهي
   مطابقةٌ اليومَ — ثم يُسجَّل موقعٌ في تركيبةٍ ليست فيها فلا يجد وزنًا فيُحتسب
   صفرًا، ولا يقول أحدٌ شيئًا. فصارت تُشتقّ من البيانات، وتُدرَج معها كلُّ
   تركيبةٍ ممكنةٍ ولو خلت اليومَ — ليُضبَط وزنُها قبل أن يأتي أولُ موقعٍ فيها
   لا بعده. */
var MX_ZONES = ['منى','عرفات','مزدلفة'];

function mxExtra(){
  if (!Array.isArray(CFG.mxExtra)) CFG.mxExtra = [];
  return CFG.mxExtra;
}
/* تُعلَن تركيبةُ مشعرٍ ونوعٍ قبل أن يقع فيها موقع: من أراد أن يهيّئ وزنَ
   «كاميرات الوزارة» في عرفات قبل تسجيل أوّل موقعٍ منها لم يجد صفًّا يكتب
   فيه — فالصفُّ كان يُشتَقُّ من المواقع وحدَها. وتُحذَف الإعلانُ إن جاء
   موقعٌ حقيقيٌّ فحلَّ محلَّه، أو بيدٍ ما دام لا موقعَ عليه. */
function mxDeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  zone = String(zone || '').trim();
  if (!zone || !label){ toast(t('اختر مشعرًا ونوعًا')); return; }
  var key = zone + '|' + label;
  var E = mxExtra();
  if (E.indexOf(key) > -1){ toast(t('هذه التركيبةُ مسجَّلةٌ من قبل')); return; }
  var real = mxRows().some(function(r){ return r[0] === zone && r[1] === label; });
  if (real){ toast(t('هذه التركيبةُ موجودةٌ بمواقعَ فعلًا')); return; }
  E.push(key);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إعلان تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُعلنت التركيبة — اضبط وزنَها أدناه'));
  render(1);
}
function mxUndeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  var n = mxRowInfo(zone, label);
  if (n){ toast(t('عليها مواقعُ بالفعل — لا تُحذَف')); return; }
  var E = mxExtra(), key = zone + '|' + label, i = E.indexOf(key);
  if (i < 0) return;
  E.splice(i, 1);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إلغاء تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُلغيت التركيبة'));
  render(1);
}

function mxRows(){
  var S = siteStats(), out = [], seen = {};
  Object.keys(S.byKey).forEach(function(k){
    var p = k.split('|'), lbl = (CAT_DEF[p[1]] || {}).l || p[1];
    var key = p[0] + '|' + lbl;
    if (seen[key]) return;
    seen[key] = 1;
    out.push([p[0], lbl, S.byKey[k]]);
  });
  /* التركيباتُ المعلَنةُ تُدرَج بعددٍ صفرٍ إن لم تكن قد ظهرت بمواقعَ فعلًا —
     فلا تُكرَّر التركيبةُ إن جاء موقعُها الأول. */
  mxExtra().forEach(function(key){
    if (seen[key]) return;
    var p = key.split('|');
    seen[key] = 1;
    out.push([p[0], p.slice(1).join('|'), 0]);
  });
  /* لا تُدرَج تركيبةٌ لا وجودَ لها: كان يُدرَج جداءُ كلِّ مشعرٍ في كلِّ نوعٍ
     فتظهر جمراتٌ في عرفات ومسجدُ نمرة في منى — والنوعُ الذي لا يقع في مشعرٍ
     لا يقع فيه أبدًا. والصفُّ الفارغُ يُقرأ بيانةً ناقصةً لا استحالةً. */
  /* المشعرُ أولًا ثم العدد: كان الترتيبُ بالعدد وحدَه فتفرّقت صفوفُ المشعر
     الواحد بين غيره، وقارئُ الجدول يقرأ مشعرًا لا صفًّا. */
  return out.sort(function(a, b){
    return arCmp(a[0], b[0]) || b[2] - a[2];
  });
}

/* ما نقاطُه صفرٌ ليس في المرحلة — فإضافتُه أن تكتب له نقاطًا */
function cfgAddStage(path, pg){
  var get = path === 'itPrep' ? itPrep : itAsm;
  var off = itemsList().filter(function(i){ return !get(i.code); });
  if (!off.length) return '';
  return card(t(pg === 'prep' ? 'أضِف جهازًا للتهيئة' : 'أضِف مكوّنًا للتجميع') + ' — ' + nm(off.length),
    '<p class="hint" style="margin:0 0 11px">' + esc(t('اكتب نقاطًا لأيِّ صنفٍ أدناه فيدخل المرحلة، واتركه صفرًا فيبقى خارجها.')) + '</p>'
    + table(['الصنف','المنطقة','النقاط'],
        off.map(function(i){
          return [esc(i.name), esc(t(i.z==='cor'?'ممر':'مخيم')), cfgInput(path, i.code, { dec:1 })];
        })));
}

function tgtBlock(kCamp, kCor){
  var camp = cfgGet(kCamp), cor = cfgGet(kCor);
  return card('التارجت',
    '<div class="grid cols-2">'
    + '<div class="field"><label>' + esc(t('تارجت المخيمات — الشهري')) + '</label>'
    +   cfgInput(kCamp) + '</div>'
    + '<div class="field"><label>' + esc(t('الأسبوعي')) + '</label>'
    +   cfgDerived(cfgWk(camp)) + '</div>'
    + '<div class="field"><label>' + esc(t('تارجت الممرات — الشهري')) + '</label>'
    +   cfgInput(kCor) + '</div>'
    + '<div class="field"><label>' + esc(t('الأسبوعي')) + '</label>'
    +   cfgDerived(cfgWk(cor)) + '</div>'
    + '</div>'
    + '<div class="alert info" style="margin:4px 0 0"><span>'
    +   esc(t('الإجمالي الشهري')) + ' <b>' + nm(camp+cor) + '</b> · '
    +   esc(t('الأسبوعي')) + ' <b>' + nm(cfgWk(camp+cor)) + '</b></span></div>'
    + '<p class="hint">' + esc(t('الإجمالي والأسبوعي يُشتقّان ولا يُكتبان — والشهري وحده ما تكتبه.')) + '</p>');
}

/* ═══ المستخدمون: من القاعدة لا من بيانات العرض ═══
   كانت القائمةُ أربعةَ صفوفٍ ثابتةً وأزرارُها بلا خاصية، فيبتلعها حارسُ
   الأزرار الميتة ويقول نصَّها. فصارت تقرأ `STATE.users` وتكتب فيها. */
var USR = { q:'', edit:'', role:'', log:'' };   /* (V32.3) شاشةُ المستخدمين تملك حالتَها (كانت USR.q/USR.edit/USR.role/USR.log) */

/* من يظهر لي: من رتبتُه دوني — ونفسي. ومن يُدير الأدوارَ يرى الجميعَ
   لأنه هو من يرفعهم ويخفضهم. */
/* ═══ من يرى مَن ═══
   كان مَن يملك «إدارة الحسابات» (المهندسُ ومديرُ المشروع) يرى الجميعَ ومنهم
   من هو فوقه — فيرى المهندسُ حسابَ مدير المشروع والإدارةِ العليا، ويرى
   المشرفُ حسابَ المهندس. والقاعدةُ التي أرادها صاحبُ المشروع: **لا يُرى إلا
   من هو في رتبتك أو دونها**، فمن فوقك ليس من شأنك. والإدارةُ العليا وصاحبُ
   المشروع فوق الجميع فيريان الكلَّ. والمطّلعُ الوزاريُّ ليس من الفريق: لا
   يظهر لأحدٍ من الميدان، ولا يرى هو إلا نظراءَه من الوزارة. */
function canSeeUser(u){
  if (!u) return false;
  var meR = effRole(ROLE), uR = roleOfUser(u);
  if (u.name && u.name === STATE.meta.name) return true;      /* نفسي دائمًا */
  if (meR === 'viewer') return uR === 'viewer';               /* الوزارةُ نظراءَها وحدَهم */
  /* حساباتُ الوزارة: يراها نظراؤها، ومن يُنشئها ويوزّع كلماتِها ويكون
     مديرَها في الشجرة — المهندسُ فما فوق (V18.1؛ كانت لمدير المشروع فما فوق
     منذ V17.6، فكان المهندسُ يُقترَح مديرًا لحسابٍ لا يراه). وتبقى محجوبةً عن
     المشرف فما دون. */
  if (uR === 'viewer') return rankOf(meR) >= rankOf('engineer');
  if (meR === 'exec' || isBossHere()) return true;            /* من فوق الجميع يرى الجميع */
  return rankOf(meR) >= rankOf(uR);                           /* رتبتي فما دونها */
}
/* ═══ سجلُّ المستخدم — متى دخل وماذا فعل (V17.30) ═══
   السؤالُ في كلِّ مراجعة: هذا الحسابُ، متى كان آخرُ ظهورٍ له؟ وماذا فعل؟
   والجوابُ كان متفرّقًا: الحضورُ في مجموعته، والأحداثُ في سجلِّها، وعملُه
   في الزيارات والتركيبات والصور. فيُجمَع هنا لكلِّ حساب — من الميدان إلى
   الوزارة — في صفحةٍ واحدة: آخرُ ظهورٍ وجهازُه ونسختُه، وعددُ ما عمل بكلِّ
   نوع، وخطٌّ زمنيٌّ بما فعله. ولا يُنشَأ لذلك شيءٌ جديد: كلُّه مقروءٌ ممّا
   هو مسجَّلٌ أصلًا. */
function userPresence(name){
  var P = STATE.presence || {}, best = null;
  Object.keys(P).forEach(function(k){
    var p = P[k] || {};
    if ((p.name || '') !== name) return;
    if (!best || (+p.at || 0) > (+best.at || 0)) best = p;
  });
  return best;
}
function userLog(name, cap){
  var out = [], push = function(at, what, kind, site){
    if (!at) return; out.push({ at:+at || 0, what:what, kind:kind || '', site:site || '' });
  };
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id] || {};
    if (r.by === name) push(r.at, 'زيارة ميدانية', 'visit', id);
    if (r.apprBy === name) push(r.apprAt || r.at, 'اعتماد تقني', 'ok', id);
    if (r.minBy === name) push(r.minAt, 'قرارُ الوزارة', 'ok', id);
    if (r.revisitBy === name) push(r.revisitAt, 'ردٌّ لزيارةٍ أخرى', 'back', id);
    if (r.briefBy === name) push(r.briefAt, 'تفاصيل مختصرة', 'note', id);
  });
  Object.keys(STATE.inss || {}).forEach(function(id){ var x = STATE.inss[id] || {}; if (x.by === name) push(x.at, 'تركيب', 'ins', id); });
  Object.keys(STATE.diss || {}).forEach(function(id){ var x = STATE.diss[id] || {}; if (x.by === name) push(x.at, 'فكّ', 'dis', id); });
  Object.keys(STATE.photos || {}).forEach(function(k){ var p = STATE.photos[k] || {}; if (p.by === name) push(p.at, 'رفعُ صورة', 'photo', p.site || ''); });
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k] || {};
    if (x.by === name) push(x.at, 'إسنادُ مهمة', 'task', x.site || '');
    if (x.to === name && x.status === 'مُنجز') push(x.doneAt || x.at, 'إنجازُ مهمة', 'task', x.site || '');
  });
  /* المكتبُ كالميدان: من يشتري ومن يحرّك المخزنَ ومن يقدّم مستخلصًا ومن
     يتابع شحنةً — سجلُّه كان يبدو فارغًا لأن مصادرَه لم تُقرَأ (V17.30). */
  Object.keys(STATE.buys || {}).forEach(function(k){
    var b = STATE.buys[k] || {};
    if (b.by === name) push(b.at, t('شراء') + (b.item ? ' — ' + b.item : '') + (b.amt ? ' \u00b7 ' + nm(+b.amt) + ' ' + t('ريال') : ''), 'buy', b.site || '');
    if (b.apprBy === name) push(b.apprAt || b.at, 'اعتمادُ شراء' + (b.item ? ' — ' + b.item : ''), 'ok', b.site || '');
  });
  Object.keys(STATE.moves || {}).forEach(function(k){
    var m = STATE.moves[k] || {};
    if (m.by === name) push(m.at, 'حركةُ مخزون' + (m.item ? ' — ' + m.item : '') + (m.qty ? ' \u00b7 ' + nm(+m.qty) : ''), 'inv', m.site || '');
  });
  Object.keys(STATE.ipc || {}).forEach(function(k){
    var x = STATE.ipc[k] || {};
    if (x.by === name) push(x.at, 'مستخلص' + (x.no ? ' — ' + x.no : ''), 'ipc', '');
    if (x.apprBy === name) push(x.apprAt || x.at, 'اعتمادُ مستخلص' + (x.no ? ' — ' + x.no : ''), 'ok', '');
  });
  Object.keys(STATE.ships || {}).forEach(function(k){
    var sh = STATE.ships[k] || {};
    if (sh.by === name) push(sh.at, 'شحنة' + (sh.ref ? ' — ' + sh.ref : '') + (sh.st ? ' \u00b7 ' + t(sh.st) : ''), 'ship', '');
  });
  Object.keys(STATE.maints || {}).forEach(function(k){
    var mm = STATE.maints[k] || {};
    if (mm.by === name) push(mm.at, 'صيانة' + (mm.fault ? ' — ' + String(mm.fault).slice(0, 40) : ''), 'fix', k);
  });
  evAll().forEach(function(e){ if (evActor(e).name === name) push(e.ts, e.what, 'ev', e.site || ''); });
  out.sort(function(a, b){ return b.at - a.at; });
  var seen = {}, uniq = [];
  out.forEach(function(x){ var k = x.at + '|' + x.what; if (!seen[k]){ seen[k] = 1; uniq.push(x); } });
  return cap ? uniq.slice(0, cap) : uniq;
}
function userStats(name){
  var L = userLog(name), c = {};
  L.forEach(function(x){ c[x.kind] = (c[x.kind] || 0) + 1; });
  return { n:L.length, last:L.length ? L[0].at : 0, byKind:c };
}
/* USR.log مُعلَنٌ مع USR أعلاه (V32.3) */
function userLogHtml(uid){
  var u = (STATE.users || {})[uid] || {}, name = u.name || '';
  var p = userPresence(name), st = userStats(name), L = userLog(name, 200);
  var KIND = { visit:'\u{1F4CD}', ins:'\u{1F527}', dis:'\u{1F9E9}', photo:'\u{1F4F7}', ok:'\u2705',
               back:'\u21A9', note:'\u{1F5E8}', task:'\u{1F4CB}', ev:'\u2022',
               buy:'\u{1F6D2}', inv:'\u{1F4E6}', ipc:'\u{1F9FE}', ship:'\u{1F69B}', fix:'\u{1F6E0}' };
  return '<div class="wt-back" data-ulclose="0"></div>'
    + '<div class="pop wt-sheet" id="ulSheet" role="dialog" aria-label="' + esc(t('سجلُّ المستخدم')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid hint" style="margin:0">' + esc(t(roleName(u.role) || u.role || '')) + '</div>'
    +   '<h3 style="margin-top:3px">' + esc(name || u.user || '') + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-ulclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    +   stats([['آخر ظهور', p ? esc(stepAgo(p.at)) : esc(t('لم يظهر بعد')), p && (Date.now() - (+p.at || 0) < 3600000) ? 'ok' : ''],
              ['الأفعال المسجَّلة', N(st.n)],
              ['آخر فعل', st.last ? esc(stepAgo(st.last)) : '—']])
    +   (p ? '<p class="hint" style="margin:0 0 8px">' + esc(t('الجهاز')) + ': ' + esc(p.dev || p.uid || '—')
            + (p.ver ? ' \u00b7 ' + esc(p.ver) : '') + (p.role ? ' \u00b7 ' + esc(t(roleName(p.role) || p.role)) : '')
            + (p.reads ? ' \u00b7 ' + esc(t('قراءات')) + ' ' + nm(p.reads) : '') + '</p>' : '')
    +   (st.n
        ? '<div class="chips" style="margin:0 0 8px">'
          + Object.keys(st.byKind).map(function(k){
              return '<span class="chip">' + (KIND[k] || '\u2022') + ' <span class="num">' + nm(st.byKind[k]) + '</span></span>'; }).join('')
          + '</div>'
          + '<div class="wt-log">' + L.map(function(x){
              return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(fmtDT(x.at)) + '</span> '
                + (KIND[x.kind] || '\u2022') + ' ' + esc(t(x.what))
                + (x.site ? ' <a href="#" data-ulsite="' + esc(x.site) + '">' + esc(x.site) + '</a>' : '') + '</div>';
            }).join('') + '</div>'
          + ''
        : '<p class="hint" style="margin:0">' + esc(t('لا أفعالَ مسجَّلةً لهذا الحساب بعد — أو لم يُجلَب سجلُّ الأحداث.')) + '</p>')
    +   '<p class="hint" style="margin:8px 0 0">' + esc(t('مقروءٌ ممّا هو مسجَّلٌ أصلًا: الحضورُ والزياراتُ والتركيباتُ والصورُ والمهامُّ وسجلُّ الأحداث.')) + '</p>'
    + '</div></div>';
}
function usersList(){
  var U = STATE.users || {}, out = [];
  Object.keys(U).forEach(function(uid){
    var u = U[uid] || {};
    if (!canSeeUser(u)) return;
    if (USR.role && u.role !== USR.role) return;
    var hay = (u.name || '') + ' ' + (u.user || '') + ' ' + (u.role || '');
    if (USR.q && hay.indexOf(USR.q) < 0) return;
    out.push([uid, u]);
  });
  return out.sort(function(a, b){ return arCmp(a[1].name || '', b[1].name || ''); });
}

/* ═══ حذفُ الحساب ═══
   كان التعطيلُ وحدَه — فتبقى الحساباتُ المكرَّرةُ والخاطئةُ في القائمة إلى
   الأبد. صار الحذفُ للمهندس ومدير المشروع فما فوق: يُمحى من القاعدة فورًا
   ويختفي من كلِّ جهاز، ويُكتَب للخادم طلبُ حذفِ حسابِ الدخول فلا يدخل
   صاحبُه بعدها. ولا يحذف أحدٌ نفسَه، ولا من هو أعلى منه رتبة. */
function usrDel(uid){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الحسابات للمهندس ومدير المشروع')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u){ toast(t('لا حسابَ بهذا المعرِّف')); return false; }
  if (uid === myUid()){ toast(t('لا تحذف حسابَك')); return false; }
  if (rankOf(roleOfUser(u)) > rankOf(ROLE)){ toast(t('لا تحذف من هو أعلى منك رتبة')); return false; }
  var nm2 = u.name || u.user || uid;
  if (typeof confirm === 'function' && !confirm(t('حذفُ الحساب') + ' ' + nm2 + '\n' + t('يُمحى من القاعدة ولا يدخل صاحبُه بعدها. لا رجوع.'))){
    toast(t('أُلغي الحذف')); return false;
  }
  delete STATE.users[uid];
  CORE.rm('users', uid);
  /* حسابُ الدخول يُحذَف من الخادم — المتصفّحُ لا يملك ذلك */
  if (u.user || /^[A-Za-z0-9]{20,}$/.test(uid)){
    var key = 'del-' + uid;
    STATE.provision = STATE.provision || {};
    STATE.provision[key] = { action:'delete', uid:uid, user:u.user || '', name:nm2, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
    CORE.set('provision', key, STATE.provision[key]);
    provKick(true);
  }
  if (u.user && (STATE.pending || {})[u.user]){ delete STATE.pending[u.user]; CORE.rm('pending', u.user); }
  /* طلبُ إنشائه يُمحى معه: كان يبقى «تمّ» في القائمة بعد حذف صاحبه — ثمانيةُ
     أسطرٍ لحساباتٍ لم تعد موجودة، ومنها ما يحمل كلمةَ مرورٍ. المطابقةُ باسم
     المستخدم بلا حساسيةٍ لحالة الحروف (M.shaaraqi = m.shaaraqi). */
  var uname = String(u.user || '').toLowerCase();
  Object.keys(STATE.provision || {}).forEach(function(k){
    var pr = STATE.provision[k] || {};
    if (pr.action === 'delete') return;
    if (uname && (k.toLowerCase() === uname || String(pr.user || '').toLowerCase() === uname)){
      delete STATE.provision[k]; CORE.rm('provision', k);
    }
  });
  logEvent('حذف حساب — ' + nm2 + ' (' + (u.user || uid) + ')');
  toast(t('حُذف') + ' ' + nm2);
  statBump(); render(1);
  return true;
}
/* معرِّفُ حسابِ دخولٍ حقيقيّ — لا اسمُ مستخدمٍ ولا مفتاحٌ مؤقت */
function uidLike(k){ return /^[A-Za-z0-9]{20,}$/.test(String(k || '')); }
/* ═══ الحسابُ المكرَّر ═══
   كان تعديلُ الصفِّ المؤقت (باسم المستخدم ريثما يُنشئه الخادم) يكتب وثيقةً
   في القاعدة باسم المستخدم — فيصير للشخص وثيقتان: users/k.bandar بالدور
   المعدَّل، وusers/{uid} التي كتبها الخادم. فيظهر مرتين في كلِّ جهاز.
   صار تعديلُ المؤقت يذهب إلى طلبِ الإنشاء نفسِه فيطبّقه الخادمُ عند الإنشاء،
   والقديمُ المكرَّرُ يُدمَج بضغطة: تبقى وثيقةُ المعرِّف وتُمحى الباقية. */
function usrSet(uid, patch){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
  var U = STATE.users || (STATE.users = {});
  var u = Object.assign({}, U[uid] || {}, patch);
  U[uid] = u;
  if (u.provisioning && !uidLike(uid)){
    var pr = (STATE.provision || {})[uid];
    if (pr && pr.status === 'pending'){
      var pv = Object.assign({}, pr, patch, { roleExplicit:true });
      STATE.provision[uid] = pv; CORE.set('provision', uid, pv);
      provKick(true);
      logEvent('تعديل طلب حساب — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
      toast(t('حُفظ في طلب الإنشاء — يطبّقه الخادمُ عند الإنشاء'));
    } else toast(t('الحسابُ يُنشَأ — عدّله بعد أن يُنشئه الخادم'));
    render(1); return;
  }
  CORE.set('users', uid, u);
  logEvent('تعديل مستخدم — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
  toast(t('حُفظ'));
  render(1);
}

/* حساباتٌ بالاسم نفسِه: تُجمَع بلا حساسيةٍ لحالة الحروف */
function usrDupes(){
  var U = STATE.users || {}, by = {};
  Object.keys(U).forEach(function(k){
    var un = String((U[k] || {}).user || '').toLowerCase(); if (!un) return;
    (by[un] = by[un] || []).push(k);
  });
  var out = {};
  Object.keys(by).forEach(function(un){ if (by[un].length > 1) out[un] = by[un]; });
  return out;
}
function usrMerge(un){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return false; }
  var keys = usrDupes()[String(un || '').toLowerCase()] || [];
  if (keys.length < 2){ toast(t('لا مكرَّرَ لهذا الاسم')); return false; }
  var U = STATE.users;
  /* يبقى حسابُ الدخول: المعرِّفُ الحقيقيُّ أوّلًا، وإلا الأحدث */
  var keep = keys.filter(uidLike).sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0]
          || keys.sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0];
  var merged = Object.assign({}, U[keep]);
  keys.forEach(function(k){
    if (k === keep) return;
    ['job','sup','dept','ph','email','crew','jobLog'].forEach(function(f){ if (merged[f] == null && U[k][f] != null) merged[f] = U[k][f]; });
  });
  delete merged.provisioning;
  U[keep] = merged; CORE.set('users', keep, merged);
  keys.forEach(function(k){ if (k !== keep){ delete U[k]; CORE.rm('users', k); } });
  logEvent('دمج حساب مكرَّر — ' + (merged.name || un) + ' · ' + t('بقي') + ' ' + keep + ' · ' + t('مُحي') + ' ' + nm(keys.length - 1));
  toast(t('دُمج') + ' — ' + t('بقي حسابُ الدخول ومُحي المكرَّر'));
  statBump(); render(1);
  return true;
}
/* كلمةُ مرورٍ جديدة: عشرةُ أحرفٍ بلا ما يلتبس (0/O، 1/l) */
function genPass(){
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', o = '';
  for (var i = 0; i < 10; i++) o += A[Math.floor(Math.random() * A.length)];
  return o;
}
/* ═══ إعادةُ إصدار كلمة المرور ═══
   من نسي كلمتَه لا يُغيّرها المتصفّحُ لغيره — الخادمُ وحده يملك حسابَ الدخول.
   فيُكتَب طلبٌ باسم المستخدم نفسِه وكلمةٍ جديدة، والخادمُ يضبطها ويُعلِّم
   الحسابَ «تُبدَّل أوّلَ دخول»، وتظهر الكلمةُ هنا وفي ورقة الدخول. */
/* ═══ كلمةُ المرور الجديدة — ضغطةٌ واحدةٌ إلى النهاية ═══
   كانت أربعَ خطواتٍ في ثلاث شاشات: «كلمة جديدة» تكتب طلبًا في طابور الجهاز،
   ثم «ادفع الآن»، ثم «شغّل الخادم»، ثم ورقةُ الدخول — وأيُّ حلقةٍ تقف (طابورٌ
   لا يُرفَع على شبكةٍ بطيئة، خادمٌ لم يُشغَّل) تركت الفنيَّ بلا كلمة. صارت
   ضغطةً: الطلبُ يُكتَب في القاعدة مباشرةً بانتظار جوابها (فيُرى الرفضُ بسببه
   لا يُبتلَع)، ثم يُشغَّل الخادمُ من التطبيق، ثم يُراقَب الطلبُ حتى «تمّ» —
   وتظهر الكلمةُ كبيرةً بزرِّ نسخٍ وزرِّ واتساب. */
/* ═══ الطلبُ يُنفَّذ بمجرّد كتابته ═══
   كان كلُّ طلبٍ يحتاج ضغطةً ثانيةً على «شغّل الخادم الآن» — والمكتبُ ينسى،
   فيبقى الحسابُ «يُنشَأ» حتى تجيءَ الجدولة. وليست الضغطةُ إذنًا يُطلَب: من
   كتب الطلبَ قصد تنفيذَه. فصارت كلُّ كتابةٍ في «provision» تُتبِع نفسَها
   بتشغيلٍ للخادم — بمهلةِ ثانيتين تجمع الطلباتِ المتتابعة (استيرادُ ثلاثين
   حسابًا = تشغيلٌ واحد)، وبفاصلٍ لا يقلُّ عن عشرين ثانيةً بين تشغيلَين فلا
   تُستهلَك حصةُ السيور. ومن لا مفتاحَ عنده يبقى له الزرُّ. */
var PROV_KICK = 0, PROV_LAST = 0, PROV_QUIET = false;
function provKick(quiet){
  if (!may('provision') || !FB.ready) return;
  /* بلا مفتاح تشغيلٍ على هذا الجهاز (مفتاحُ السيور للإدارة وحدها — V17.93): الطلبُ
     مكتوبٌ في القاعدة والخادمُ المجدولُ يتولّاه خلال دقائق — يُقال ذلك لا يُسكَت */
  if (!ghToken()){ if (!quiet) toast(t('كُتب الطلب — يُنشئ الخادمُ الحسابَ خلال دقائق')); return; }
  if (quiet) PROV_QUIET = true;
  clearTimeout(PROV_KICK);
  PROV_KICK = setTimeout(function(){
    var gap = Date.now() - PROV_LAST;
    if (gap < 20000){ PROV_KICK = setTimeout(function(){ provKick(PROV_QUIET); }, 20000 - gap); return; }
    PROV_LAST = Date.now();
    var q = PROV_QUIET; PROV_QUIET = false;
    ghRunNow(true).then(function(ok){
      if (!ok) return;
      if (!q) toast(t('أُرسل إلى الخادم — يُنفَّذ خلال دقيقة'));
      if (PW_FLOW && PW_FLOW.st !== 'done') pwFlowSet('wait');
      if (PW_FLOW && typeof pwFlowWatch === 'function') pwFlowWatch();
    });
  }, 2000);
}
var PW_FLOW = null, PW_POLL = 0;
function pwFlowStart(u, pass){
  PW_FLOW = { user:u.user, name:u.name || u.user, pass:pass, st:'writing', at:Date.now(), why:'' };
  clearInterval(PW_POLL); PW_POLL = 0;
  render(1);
}
function pwFlowSet(st, why){ if (!PW_FLOW) return; PW_FLOW.st = st; PW_FLOW.why = why || ''; render(1); }
function pwFlowWatch(){
  clearInterval(PW_POLL);
  var tries = 0;
  PW_POLL = setInterval(function(){
    if (!PW_FLOW || !FB.ready || !FB.db){ clearInterval(PW_POLL); PW_POLL = 0; return; }
    tries++;
    DB.col('provision').doc(PW_FLOW.user).get().then(function(d){
      FB.readCount = (FB.readCount || 0) + d.size;
      var v = d && d.exists ? (d.data() || {}) : {};
      if (v.status === 'done'){ clearInterval(PW_POLL); PW_POLL = 0; STATE.provision[PW_FLOW.user] = v; pwFlowSet('done'); logEvent('كلمةٌ جديدةٌ ضُبطت — ' + PW_FLOW.user); }
      else if (v.status === 'error'){ clearInterval(PW_POLL); PW_POLL = 0; pwFlowSet('error', v.why || ''); }
      else if (tries > 36){ clearInterval(PW_POLL); PW_POLL = 0; pwFlowSet('slow'); }
    }).catch(function(e){ LS_ERR = e; });
  }, 5000);
}
function pwFlowHtml(){
  if (!PW_FLOW) return '';
  var f = PW_FLOW, big = '<div style="font:700 26px/1.4 ui-monospace,monospace;letter-spacing:.06em;direction:ltr;text-align:center;padding:10px;border:1px dashed rgba(255,255,255,.25);border-radius:10px;user-select:all">' + esc(f.pass) + '</div>';
  var wa = 'https://wa.me/?text=' + encodeURIComponent(t('اسم المستخدم') + ': ' + f.user + '\n' + t('كلمة المرور') + ': ' + f.pass + '\n' + t('تُبدّلها أوّلَ دخول') + '\n' + location.origin + location.pathname);
  var body = '<p class="hint" style="margin:0 0 8px">' + esc(dispName(f.name)) + ' \u00b7 <span dir="ltr">' + esc(f.user) + '</span></p>' + big
    + '<div class="actions" style="margin-top:10px">'
    + btn('\u{1F4CB} ' + t('انسخ'),'btn-secondary btn-sm',' data-pwcopy="1"')
    + '<a class="btn btn-primary btn-sm" href="' + esc(wa) + '" target="_blank" rel="noopener">\u{1F4AC} ' + esc(t('أرسل عبر واتساب')) + '</a>'
    + btn(t('إغلاق'),'btn-quiet btn-sm',' data-pwclose="1"')
    + '</div>';
  var st = { writing:['warn','يُكتَب الطلبُ في القاعدة…'], run:['warn','يُشغَّل الخادم… الكلمةُ تُضبَط خلال دقيقة'], wait:['warn','الخادمُ يعمل — انتظر، تظهر «تمّ» هنا'],
             done:['ok','تمّ — الكلمةُ صالحةٌ الآن. أرسلها لصاحبها؛ يبدّلها أوّلَ دخول'], error:['bad','رُفض: ' + (f.why || '')], slow:['bad','تأخّر الخادمُ أكثرَ من ثلاث دقائق — اضغط «شغّل الخادم الآن» في طلبات الإنشاء وعُد'],
             nokey:['bad','كُتب الطلب — لا مفتاحَ لتشغيل الخادم من التطبيق: اضغط «شغّل الخادم الآن» في طلبات الإنشاء'] }[f.st] || ['warn', f.st];
  return card('\u{1F511} ' + t('كلمةُ مرورٍ جديدة'), alertBox(st[0], st[1]) + body);
}
/* ═══ تبديلُ اسم الدخول ═══
   حقلُ «اسم المستخدم» في الشاشة كان يُعرَض ولا يُحفَظ: الاسمُ هويةٌ في
   المصادقة لا حقلٌ في الوثيقة، فتعديلُه بيدٍ يغيّر ما يُقرَأ ولا يغيّر ما
   يُدخَل به — يبقى القديمُ عاملًا ويظنُّ المكتبُ أنه بدّله. صار طلبًا للخادم
   كطلب الكلمة: يبدّل بريدَ المصادقة وحقلَ الوثيقة معًا، والمعرِّفُ لا يتغيّر
   فيبقى كلُّ ما كتبه صاحبُه منسوبًا إليه. */
function usrRename(uid, to){
  if (!canProvision()){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا حسابَ لتبديله')); return false; }
  to = String(to || '').trim().toLowerCase();
  if (!/^[A-Za-z0-9._-]{3,}$/.test(to)){ toast(t('اسمُ الدخول: حروفٌ لاتينيةٌ وأرقامٌ ونقطةٌ — ثلاثةٌ فأكثر')); return false; }
  if (to === String(u.user).toLowerCase()){ toast(t('الاسمُ نفسُه')); return false; }
  var taken = Object.keys(STATE.users || {}).some(function(k){ return k !== uid && String((STATE.users[k] || {}).user || '').toLowerCase() === to; });
  if (taken){ toast(t('الاسمُ مستعملٌ لحسابٍ آخر')); return false; }
  /* الفحصُ المستعمَلُ يسبق فحصَ الصيغة في القراءة لا في التنفيذ — والترتيبُ
     هنا: صيغةٌ ثم تكرارٌ ثم تطابق. أُعيد ترتيبُه ليقول السببَ الصحيح. */
  var req = { user:u.user, newUser:to, action:'rename', uid:uid, name:u.name || '', role:u.role || 'tech',
              roleExplicit:false, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {}; STATE.provision[u.user] = req;
  logEvent('طلبُ تبديلِ اسم الدخول — ' + u.user + ' \u2190 ' + to);
  pwFlowStart({ user:u.user + ' \u2190 ' + to, name:u.name || '' }, '');
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey'); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}
function usrPwReset(uid){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u || !u.user){ toast(t('لا اسمَ مستخدمٍ لهذا الحساب')); return false; }
  if (!canMakeRole(roleOfUser(u) || u.role || 'tech')){ toast(t('لا تُعيد كلمةَ من هو أعلى منك رتبة')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, role:u.role || 'tech', roleExplicit:false, pass:pass, reissue:true,
              status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادة إصدار كلمة مرور — ' + (u.name || u.user) + ' (' + u.user + ')');
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); statBump(); return pass; }
  /* مباشرةً إلى القاعدة — لا طابورَ يقف على شبكةٍ بطيئة، والرفضُ يُرى بسببه */
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  statBump();
  return pass;
}
function usersCard(){
  var L = usersList(), U = STATE.users || {};
  var DUP = usrDupes();
  var roleOpts = function(cur){
    return Object.keys(ROLES).map(function(k){
      return '<option value="' + esc(k) + '"' + (cur===k?' selected':'') + '>'
        + esc(t(ROLES[k].n)) + '</option>'; }).join('');
  };
  return cardFlush(t('المستخدمون') + ' — ' + nm(L.length) + (USR.q ? ' / ' + nm(Object.keys(U).length) : ''),
      L.length
        ? table(['الاسم','الدور','الحالة','أُنشئ في','إجراءات'],
            L.map(function(x){
              var uid = x[0], u = x[1], on = u.active !== false;
              if (USR.edit === uid){
                var jbOpts = '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                  + jobsList().map(function(j){ return '<option value="' + esc(j.id) + '"'
                      + (u.job === j.id ? ' selected' : '') + '>' + esc(t(j.n)) + '</option>'; }).join('');
                var supOpts = mgrOptions(roleOfUser(u) || u.role, u.sup || '', uid);
                return ['<input data-usrn="' + esc(uid) + '" value="' + esc(u.name || '') + '" dir="auto" style="min-width:150px">'
                        + '<div class="usrEd" style="margin-top:6px">'
                        + '<label class="mini">' + esc(t('اسم الدخول')) + '</label>'
                        + '<input data-usru="' + esc(uid) + '" value="' + esc(u.user || '') + '" dir="ltr" style="min-width:130px">'
                        + btn('\u{1F504} ' + t('بدّل اسم الدخول'),'btn-quiet btn-sm',' data-usrren="' + esc(uid) + '"')
                        + '<span class="hint" style="margin:0;display:block">' + esc(t('اسمُ الدخول هويةٌ في المصادقة — يُبدَّل من الخادم بزرِّه، لا بحفظ الصف.')) + '</span></div>',
                        '<div class="usrEd">'
                        + '<label class="mini">' + esc(t('الدور')) + '</label><select data-usrr="' + esc(uid) + '">' + roleOpts(u.role) + '</select>'
                        + '<label class="mini">' + esc(t('الوظيفة')) + '</label><select data-usrj="' + esc(uid) + '">' + jbOpts + '</select>'
                        + '<label class="mini">' + esc(t('القسم')) + '</label><select data-usrd="' + esc(uid) + '">' + deptOptions(u.dept || '') + '</select>'
                        + '<label class="mini">' + esc(t('مديره')) + '</label><select data-usrs="' + esc(uid) + '">' + supOpts + '</select>'
                        /* الجوالُ: كان حقلًا في البيانات (ph) يقرؤه إشعارُ واتساب ولا شاشةَ تكتبه (V16.97) */
                        + '<label class="mini">' + esc(t('الجوال')) + '</label><input data-usrph="' + esc(uid) + '" value="' + esc(u.ph || '') + '" dir="ltr" inputmode="tel" placeholder="05…" style="min-width:130px">'
                        + '</div>',
                        (on ? pill('نشط', 'ok') : (u.self ? pill(t('ينتظر التفعيل'), 'wrn') : pill('معطل', 'off'))),
                        '<span class="num">' + esc(u.at > 1e11 ? dayKey(u.at) : String(u.at || '').slice(0,10)) + '</span>',
                        btn('احفظ','btn-primary btn-sm',' data-usrsave="' + esc(uid) + '"')
                        + btn('إلغاء','btn-quiet btn-sm',' data-usredit=""')
                        + btn('🗑 ' + t('حذف الحساب'),'btn-danger btn-sm',' data-usrdel="' + esc(uid) + '"')];
              }
              var dupK = String(u.user || '').toLowerCase(), isDup = !!DUP[dupK];
              return ['<strong>' + esc(u.name || uid) + '</strong><br><span class="hint" dir="ltr" style="margin:0">'
                        + esc(u.user || '') + '</span>'
                        + (isDup ? '<br>' + pill('مكرَّر','off') + (may('users') ? ' ' + btn('\u{1F9F9} ' + t('دمج'),'btn-quiet btn-sm',' data-usrmerge="' + esc(dupK) + '"') : '') : '')
                        + (u.provisioning ? '<br>' + pill('يُنشَأ','wrn')
                            + (may('users') && !((STATE.provision || {})[u.user || uid] || {}).status
                                ? ' ' + pill('بلا طلبٍ في القاعدة','off') + ' ' + btn('\u{1F501} ' + t('أعد الطلب'),'btn-quiet btn-sm',' data-usrreq="' + esc(uid) + '"')
                                : '')
                            + (may('users') ? ' ' + btn('\u26A1 ' + t('أنشئه من هذا الجهاز الآن'),'btn-primary btn-sm',' data-provlocal="' + esc(u.user || uid) + '"') : '')   /* (V30.7) لا ينتظر الخادم — للمهندس فما فوق: القاعدةُ تسمح لهم بكتابة وثيقة المستخدم */
                            : ''),
                      esc(t((ROLES[u.role] || {}).n || u.role || '—'))
                        + ((u.job && jobOf(u.job)) || u.dept || u.sup
                            ? '<br><span class="hint" style="margin:0">'
                              + (u.job && jobOf(u.job) ? '💼 ' + esc(jobOf(u.job).n) : '')
                              + (u.dept ? ' \u00b7 ' + esc(deptName(u.dept)) : '')
                              + (u.sup ? ' \u00b7 \u2B06 ' + esc(t('مديره')) + ' ' + esc(u.sup) : '')
                              + '</span>' : '')
                        + '<br><span class="hint num" style="margin:0">\u{1F4F1} ' + (u.ph ? esc(u.ph) : '<span style="color:#E05252">' + esc(t('بلا جوال')) + '</span>') + '</span>',
                      (on ? pill('نشط', 'ok') : (u.self ? pill(t('ينتظر التفعيل'), 'wrn') : pill('معطل', 'off'))),
                      '<span class="num">' + esc(u.at > 1e11 ? dayKey(u.at) : String(u.at || '').slice(0,10)) + '</span>',
                      /* الوزارةُ تقرأ الجدولَ ولا تُعدّل: التعديلُ والتعطيلُ لمن يُنشئ */
                      btn('\u{1F5D2} ' + t('السجل'),'btn-quiet btn-sm',' data-usrlog="' + esc(uid) + '"')
                      + (canProvision() ? btn(t('تعديل'),'btn-quiet btn-sm',' data-usredit="' + esc(uid) + '"') : '')
                      + (uidLike(uid) && u.user && canProvision() && uid !== myUid()
                            ? btn('\u{1F511} ' + t('كلمة جديدة'),'btn-quiet btn-sm',' data-usrpw="' + esc(uid) + '" title="' + esc(t('يكتب طلبًا فيضبط الخادمُ كلمةً جديدةً — لمن نسي كلمتَه')) + '"') : '')
                      + (rankOf(ROLE) >= rankOf('engineer') && uid !== myUid()
                            ? btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-usrdel="' + esc(uid) + '" style="color:var(--danger, #e5484d)"') : '')
                        + (canProvision() ? btn(on ? t('تعطيل') : t('تفعيل'),'btn-quiet btn-sm',' data-usract="' + esc(uid) + '"') : '')];
            }))
        : '<p class="hint" style="padding:16px">'
          + esc(t(Object.keys(U).length ? 'لا مستخدمَ يطابق البحث.'
                                        : 'لا حساباتٍ بعد. هذا الجدولُ هو مكانُ كلِّ حسابٍ في النظام: منه يُعدَّل الاسمُ والوظيفةُ والقسمُ والمدير، ومنه يُعطَّل الحسابُ أو يُحذَف. أنشئ أوّلَ حسابٍ من النموذج أعلاه.')) + '</p>',
      '<form class="inline-form" onsubmit="return false">'
      + '<input type="search" id="usrQ" data-usrq="1" value="' + esc(USR.q) + '" placeholder="'
      +   esc(t('بحث')) + '" dir="auto">'
      + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="users"')
      + (may('users')
          ? btn('🧹 ' + t('امسح قوائم الفنيين الموروثة'),'btn-quiet btn-sm',' data-tkpurge="1"'
              + ' title="' + esc(t('يحذف قائمة settings/techs القديمة من السحابة ويُفرغ من الفرق كلَّ اسمٍ لا حسابَ له — الحساباتُ لا تُمَسّ')) + '"')
          : '')
      + '</form>');
}

/* إنشاءُ حسابٍ: كانت الشاشةُ واجهةً بلا وظيفة — حقولٌ بلا معرّفاتٍ وزرٌّ
   بلا خاصية. فمن ملأها وضغط لم يقع شيءٌ ولا قيل لماذا. */
/* المعلَّقُ يُنشَأ بضغطةٍ حين تعود الشبكة — بكلمةِ مرورٍ جديدةٍ تُكتَب الآن،
   فالقديمةُ لم تُحفَظ ولا تُحفَظ. */
function pendHasAccount(user){
  var un = String(user || '').toLowerCase(), U = STATE.users || {};
  return Object.keys(U).some(function(k){ return uidLike(k) && String((U[k] || {}).user || '').toLowerCase() === un; });
}
function pendDel(user){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  if (STATE.pending) delete STATE.pending[user];
  CORE.rm('pending', user);
  var U = STATE.users || {};
  if (U[user] && U[user].pending) delete U[user];
  logEvent('حذفُ حسابٍ معلَّق — ' + user);
  toast(user + ' \u00b7 ' + t('حُذف'));
  statBump(); render(1);
  return true;
}
function pendList(){
  var P = STATE.pending || {}, V = STATE.provision || {};
  /* من له طلبُ خادمٍ لا يُعرَض معلَّقًا — الطريقُ الجديدُ يغني عن القديم.
     ومن صار حسابًا قائمًا (بالخادم أو المباشر) لا يبقى «معلَّقًا» في جهازٍ نسيه */
  return Object.keys(P).filter(function(k){ return !V[k] && !pendHasAccount(k); }).map(function(k){ return Object.assign({ user:k }, P[k]); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function pendRetry(user, pass){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return; }
  var v = (STATE.pending || {})[user];
  if (!v){ toast(t('لا حسابَ معلَّقٌ بهذا الاسم')); return; }
  if (!pass || String(pass).length < 10){ toast(t('اكتب كلمةَ مرورٍ عشرةَ أحرفٍ فأكثر')); return; }
  toast(t('يُنشَأ الحساب…'));
  FB.createUser(user, pass, { name:v.name, role:v.role, doc:Object.assign({}, v, { pending:undefined }) })
    .then(function(res){
      if (res && res.ok && res.uid){
        var nv = Object.assign({}, v); delete nv.pending;
        STATE.users[res.uid] = nv;
        delete STATE.users[user];
        delete STATE.pending[user];
        CORE.rm('pending', user);
        logEvent('تفعيل حساب معلَّق — ' + user);
        toast(user + ' \u00b7 ' + t('يدخل بكلمته الآن'));
        statBump(); render(1);
        return;
      }
      softErr('تفعيل حساب معلَّق', new Error(res && res.err || 'unknown'),
        'لم يُفعَّل — راجع الشبكةَ أو اسمَ المستخدم');
    });
}
function pendCard(){
  var L = pendList();
  if (!L.length) return '';
  return cardFlush('\u23F3 ' + t('حساباتٌ معلَّقة') + ' \u2014 ' + nm(L.length),
      table(['المستخدم','الاسم','الدور','كلمةُ مرورٍ جديدة',''],
        L.map(function(x){
          return ['<span class="num" dir="ltr">' + esc(x.user) + '</span>',
                  esc(x.name || ''), esc(t((ROLES[x.role] || {}).n || x.role)),
                  '<input type="password" id="pnd_' + esc(x.user) + '" placeholder="' + esc(t('عشرةُ أحرفٍ فأكثر')) + '" dir="ltr">',
                  btn('\u26A1 ' + t('فعّله'),'btn-primary btn-sm',' data-pndgo="' + esc(x.user) + '"')
                  + (may('users') ? btn('\u{1F5D1} ' + t('احذف'),'btn-quiet btn-sm',' data-pnddel="' + esc(x.user) + '"') : '')];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('سُجِّلت ولم تُنشَأ في المصادقة — لا يدخل صاحبُها ولا تُرى في جهازٍ آخر إلا هنا. فعّلها بكلمةِ مرورٍ جديدة؛ القديمةُ لم تُحفَظ.')) + '</p>');
}
/* ═══ من يُنشئ من ═══
   كان الإنشاءُ للمهندس وحده، فيقف الفريقُ كلُّه على مكتبٍ واحد. صار كلٌّ
   يُنشئ في مستواه أو دونه: المشرفُ يُنشئ مشرفًا أو فنيًّا ولا يُنشئ مهندسًا،
   والمهندسُ يُنشئ مهندسًا فما دون، والمديرُ الجميع. ومن فوقُ يرى كلَّ ما
   أُنشئ تحته. والقاعدةُ تحرس الرتبةَ لا الشاشةُ وحدَها. */
function canProvision(){ return rankOf(ROLE) >= rankOf('supervisor'); }
/* مديرُ المشروع يُدير الأدوارَ كلَّها فيُنشئ حتى من فوقه (حسابَ الإدارة
   العليا) — وهو الاستثناءُ الوحيد؛ المهندسُ ومن دونه في مستواهم فما دون. */
function canMakeRole(r){ return canProvision() && (may('roles') || rankOf(r) <= rankOf(ROLE)); }
function rolesICanMake(){ return Object.keys(ROLES).filter(canMakeRole); }
/* ═══ (V30.7) إنشاءُ الحساب من هذا الجهاز الآن — لا ينتظر الخادم ═══
   بلاغُ المالك «مش عارف أضيف يوزر»: الطلبُ يُكتَب للخادم، والخادمُ سيرٌ في GitHub — فإن تعطّلت مشغّلاتُه
   (كما وقع: «لم يلتقطه مشغّل») أو رُفض مفتاحُ تشغيله بقي الحسابُ «يُنشَأ» ساعات. صار من يملك الإنشاءَ يُنشئه
   من جهازه فورًا بتطبيقٍ ثانٍ لا يمسّ جلسته (FB.createUser)، ثم يُعلَّم الطلبُ «تمّ» وتُمحى كلمتُه من القاعدة
   فلا يكرّره الخادمُ إن عاد. */
function provLocal(u){
  if (!may('users')){ toast(t('الإنشاءُ من الجهاز للمهندس فما فوق — الطلبُ محفوظٌ وينفّذه الخادم')); return; }
  var req = Object.assign({}, (STATE.provision || {})[u] || {});
  var tmp = (STATE.users || {})[u] || {};
  var pass = String(req.pass || '');
  if (pass.length < 10){
    pass = String(window.prompt(t('كلمةُ مرورٍ للحساب (عشرةُ أحرفٍ فأكثر):'), '') || '');
    if (pass.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  }
  var name = req.name || tmp.name || u, role = req.role || tmp.role || 'tech';
  if (!canMakeRole(role)){ toast(t('لا تُنشئ دورًا أعلى من دورك')); return; }
  toast(t('يُنشَأ الحسابُ من هذا الجهاز…'));
  return FB.createUser(u, pass, { name:name, role:role }).then(function(res){
    if (!res || !res.ok || !res.uid){
      var why = String(res && res.err || '');
      toast(/email-already-in-use/.test(why) ? t('الاسمُ موجودٌ في الدخول بالفعل — الحسابُ أُنشئ من قبل أو من الخادم') : (t('تعذّر الإنشاءُ من الجهاز') + ' \u2014 ' + why.slice(0, 60)));
      return false;
    }
    var docv = { name:name, user:u, role:role, active:true, at:Date.now(), by:STATE.meta.name || '', made:'device' };
    ['job','sup','dept','email'].forEach(function(f){ if (req[f] || tmp[f]) docv[f] = req[f] || tmp[f]; });
    if (docv.job) docv.jobLog = [{ job:docv.job, at:Date.now(), by:STATE.meta.name || '' }];
    STATE.users = STATE.users || {}; STATE.users[res.uid] = docv; delete STATE.users[u];
    CORE.set('users', res.uid, docv);
    var done = Object.assign({}, req, { status:'done', uid:res.uid, doneAt:Date.now(), doneBy:'device', pass:'' });
    STATE.provision = STATE.provision || {}; STATE.provision[u] = done; CORE.set('provision', u, done);
    logEvent('إنشاءُ حسابٍ من الجهاز — ' + name + ' (' + u + ')');
    toast(u + ' \u00b7 ' + t('أُنشئ الآن — يدخل بكلمته'));
    statBump(); render(1); return true;
  });
}
function usrAdd(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var u = g('uU'), n = g('uN'), p = g('uP'), r = g('uR') || 'tech';
  var jb = g('uJ'), sup = g('uS'), dp = g('uD');
  /* الوظيفةُ تُغني عن اختيار الدور: دورُ الحساب دورُ وظيفته إن اختيرت */
  if (jb && jobOf(jb)) r = jobOf(jb).role || r;
  if (!canMakeRole(r)){ toast(t('لا تُنشئ دورًا أعلى من دورك') + ' — ' + t((ROLES[r] || {}).n || r)); return; }
  if (!u){ toast(t('اكتب اسم المستخدم')); return; }
  if (!n){ toast(t('اكتب الاسم الكامل')); return; }
  if (p.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if ((STATE.users || {})[u] || usersList().some(function(p){ return p[1] && p[1].user === u; })){
    toast(t('اسمُ المستخدم موجودٌ بالفعل')); return;
  }
  /* يُسجَّل الحسابُ في مجموعته ويُرفَع — ولا يُنشَأ في Auth من المتصفّح:
     إنشاءُ حسابٍ هناك يُبدّل الجلسةَ الحاليةَ إلى الجديد، فيخرج المهندسُ من
     حسابه وهو يُنشئ حسابًا لغيره. */
  var made = { n:n, u:u, p:p, role:r, roleAr:(ROLES[r] ? ROLES[r].n : r),
               by:STATE.meta.name || '', at:Date.now() };
  CORE.set('accounts', u, made);
  STATE.users = STATE.users || {};
  /* الوثيقةُ باسم uid لا باسم المستخدم: القاعدةُ تقرأ users/{uid}، ووثيقةٌ
     باسم «m.safwat» لا يجدها أحد — فيُقرأ الدورُ من العدم ويُرفَض كلُّ شيء.
     وactive:true يُكتَب صراحةً. تُكتَب محليًّا باسم المستخدم ريثما يُعرَف uid،
     ثم تُنقَل إليه. */
  var docv = { name:n, user:u, role:r, active:true, at:Date.now() };
  if (jb){ docv.job = jb; docv.jobLog = [{ job:jb, at:Date.now(), by:STATE.meta.name || '' }]; }
  if (sup) docv.sup = sup;
  if (dp)  docv.dept = dp;
  /* ═══ الطلبُ إلى الخادم ═══
     المتصفّحُ لا يُنشئ حسابَ دخولٍ لغير صاحبه بثبات — يحتاج تطبيقًا ثانيًا
     يتعثّر بالشبكة والمتصفّح واسمٍ موجود، فبقيت حساباتٌ معلَّقةً في أجهزة.
     صار المكتبُ يكتب الطلبَ كاملًا — الاسمُ والمستخدمُ والكلمةُ والدورُ
     والوظيفةُ والقسمُ والبريد — والخادمُ يُنشئ حسابَ الدخول بمفتاح المشروع
     كلَّ عشر دقائق، ويُعلِّم الطلبَ «تمّ» فيراه المكتبُ ويُصدِر ورقةَ
     الدخول. ولا يُنشئ المتصفّحُ شيئًا بعد اليوم. */
  var em = (document.getElementById('uE') || {}).value || '';
  var req = { user:u, name:n, pass:p, role:r, status:'pending', at:Date.now(),
              by:STATE.meta.name || '' };
  if (jb)  req.job  = jb;
  if (sup) req.sup  = sup;
  if (dp)  req.dept = dp;
  if (em)  req.email = String(em).trim();
  STATE.provision = STATE.provision || {};
  STATE.provision[u] = req;
  CORE.set('provision', u, req);
  provKick();
  /* يظهر في القائمة فورًا معلَّمًا «يُنشَأ» — لا ينتظر المكتبُ ليتأكّد */
  /* الصفُّ المؤقتُ يحمل ما طُلب كلَّه — فيُرى القسمُ والمديرُ من لحظة الطلب */
  STATE.users[u] = { name:n, user:u, role:r, active:true, at:Date.now(), provisioning:true };
  if (jb)  STATE.users[u].job  = jb;
  if (sup) STATE.users[u].sup  = sup;
  if (dp)  STATE.users[u].dept = dp;
  if (em)  STATE.users[u].email = String(em).trim();
  USR.q = '';
  logEvent('طلب حساب — ' + n + ' (' + u + ') · ' + t(made.roleAr));
  toast(u + ' \u00b7 ' + t('طُلب من الخادم — يُنشَأ خلال دقائق'));
  ['uU','uN','uP','uE'].forEach(function(id){
    var e = document.getElementById(id); if (e) e.value = '';
  });
  statBump();
  render(1);
}


