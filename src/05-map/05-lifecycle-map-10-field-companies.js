/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-10-field-companies.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Field map-first home, composite-name parsing, companies board and company camps classified.
   DEFINES : coSplit, coCompounds, coFill, coColor, coFiltHtml, legendRows, typeShort, legendShapes
   GLOBALS : FIELD_MODE, EXP_OPEN, POP_SITE, CO_OPEN, CO_MODE, CO_Q, MAP_SAT, MAP_FILT_OPEN, CO_SEL, CO_BK … (+7 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الميدان — الخريطة أولًا ═══ */

var FIELD_MODE = 'survey'; PV.FIELD_PREV = 'survey';
var EXP_OPEN = false;
var POP_SITE = '';
var CO_OPEN = false;
/* يبقى التلوينُ بعد إغلاق اللوح حتى يُطفأ صراحةً */
var CO_MODE = false;
var CO_Q = '', TK_Q = '', IT_Q = '', JB_Q = '';
var MAP_SAT = true;   /* (V25.1) القمرُ الصناعيُّ هو الأساس بقرار المالك — والشوارعُ بالزرّ نفسِه */
var MAP_FILT_OPEN = false;
var CO_SEL = [];
/* القائمةُ الموحّدة — تُبنى من بيانات المشروع نفسها لا تُكتَب بيد.
   كانت عشرةَ أسماءٍ مخترعةٍ بينما الشاشةُ تقول «مئةٌ واثنتان وستون شركة»،
   والميدانُ يختار من قائمةٍ لا تشبه ما في السجل. */

/* ═══ الاسمُ المركَّبُ يُفَكّ ═══
   إحدى وثلاثون قيمةً في القائمة تحمل أكثرَ من شركةٍ في نصٍّ واحدٍ مفصولةٍ
   بفاصلة — مخيّمٌ تخدمه عدةُ شركات، أُدخل اسمُها كما جاء في الملف. فتظهر
   في المنتقي سطرًا واحدًا طويلًا لا يُقرأ، ولا تُختار شركةٌ منها بمفردها،
   ولا تُحسَب لها نقاطُها.
     والفكُّ بالفاصلة وحدَها لا بكلِّ «شركة»: «شركة شخص واحد» و«شركة ذات
   مسؤولية محدودة» صيغتان قانونيتان تلحقان الاسمَ ولا تصنعان شركةً ثانيةً —
   ومن فكَّ عندهما صنع من الواحدة اثنتين. فما لا يبدأ بكلمةِ كيانٍ يُضَمُّ
   إلى ما قبله، وكذلك الصيغُ القانونية. */


/* ═══ مخيّماتُ الشركة مصنَّفةً ═══
   من حلقةٍ واحدةٍ بالتعريف نفسِه المستعمَل في «نظرة عامة»: تمَّ المسحُ = وصل
   وسجّل ولم يُردّ؛ المتعذّرُ = وصل ولم يستطع؛ تمَّ التركيبُ = حالةُ التركيب. */
var CO_BK = null;   

var CO_POP = null;   /* { co, kind } */
var CO_POP_LBL = { all:'كلُّ المخيّمات', sv:'تمت الزيارة', stuck:'تحتاج زيارة أخرى', ins:'تمّ التركيب' };


var CO_CMP = null, CO_CMP_KEYS = [];
PV.CO_HEAD = /^(شرك[ةه]|مؤسس[ةه]|مكتب|مجموع[ةه]|مصنع|جمعي[ةه])\s/;
PV.CO_FORM = /^شرك[ةه]\s+(شخص\s+واحد|ذات\s+مسؤولي[ةه]\s+محدود[ةه]|مساهم[ةه]|تضامن|توصي[ةه]\s+بسيط[ةه])\s*$/;
function coSplit(v){
  var raw = String(v || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
  if (!raw) return [];
  var parts = raw.split(/\s*[،,؛;|]\s*/).map(function(x){ return x.trim(); }).filter(Boolean);
  var out = [];
  parts.forEach(function(x){
    /* صيغةٌ قانونيةٌ أو جزءٌ لا يبدأ بكيان: يعود إلى ما قبله */
    if (out.length && (PV.CO_FORM.test(x) || !PV.CO_HEAD.test(x))) out[out.length - 1] += '، ' + x;
    else out.push(x);
  });
  return out.length ? out : [raw];
}

function coCompounds(){
  var m = {};
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    var pr = coSplit(x.co);
    if (pr.length < 2) return;
    if (!m[x.co]) m[x.co] = { parts:pr, n:0, ids:[] };
    m[x.co].n++;
    if (m[x.co].ids.length < 12) m[x.co].ids.push(x.id);
  });
  return m;
}

var CO_LIST = [];
function coFill(){
  var seen = {}; CO_LIST.length = 0;
  /* والأسماءُ التي تحملها السجلاتُ نفسها: أحدَ عشرَ اسمًا في المواقع لم تكن
     في القائمتين، فكان الميدانُ يُمنَع من إعادة اختيار شركةٍ قائمةٍ في سجلّه. */
  var onRows = (SITES_RAW.g || []).concat(SITES_RAW.p || []).map(function(r){ return r[9]; });
  /* والشركاتُ المعتمدةُ من الطلبات — كانت تُضاف للقائمة لحظةَ الاعتماد ثم
     تُنسى عند إعادة التحميل، فتعود الشركةُ «غيرَ موجودة» بعد يوم. */
  var approved = Object.keys(STATE.coreqs || {}).filter(function(k){
    return STATE.coreqs[k] && STATE.coreqs[k].status === 'معتمد'; })
    .map(function(k){ return STATE.coreqs[k].name || k; });
  [].concat(SITES_RAW.co || [], SITES_RAW.dm || [], onRows, approved).forEach(function(c){
    /* القائمةُ أسماءٌ مفردة: القيمةُ المركَّبةُ تدخل مفكوكةً — ويبقى الأصلُ
       على النقطة حتى يُوحَّد من شاشة الشركات. */
    coSplit(c).forEach(function(one){
      if (one && !seen[one]){ seen[one] = 1; CO_LIST.push(one); }
    });
  });
  CO_LIST.sort(arCmp);
  return CO_LIST.length;
}
coFill();   /* بعد التعريف لا قبله — البياناتُ أعلى في الملف والقائمةُ هنا */

/* الزاوية الذهبية توزّع الأطياف فلا يتجاور لونان متشابهان مهما كثرت الشركات */
function coColor(name){
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  var idx = CO_LIST.indexOf(name);
  var seed = idx > -1 ? idx : h;
  return 'hsl(' + Math.round((seed * 137.508) % 360) + ',62%,58%)';
}

function coFiltHtml(){
  /* الرأسُ والذيلُ ثابتان والقائمةُ وحدَها تُمرَّر: كان اللوحُ كلُّه يُمرَّر،
     فيغيب زرُّ الإغلاق ويغيب «عرض» عمن نزل في مئةٍ واثنتين وستين شركةً — فيبحث
     عنهما بالتمرير صعودًا ونزولًا في كلِّ مرة. */
  var shown = CO_LIST.filter(function(c){ return coHit(c, CO_Q); });
  var allOn = shown.length > 0 && shown.every(function(c){ return CO_SEL.indexOf(c) > -1; });
  return '<div class="pop copop" id="coFilt">'
    + '<div class="pop-head">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
    +     '<h3 style="color:var(--ink);margin:0">' + esc(t('اختر الشركات')) + '</h3>'
    +     '<button type="button" class="btn btn-quiet btn-sm" data-co="0" aria-label="'
    +       esc(t('إغلاق')) + '">✕</button>'
    +   '</div>'
    +   '<input type="search" id="coQ" data-coq="1" value="' + esc(CO_Q) + '" placeholder="'
    +     esc(t('ابحث باسم الشركة')) + '" spellcheck="false" style="margin:11px 0 0">'
    + '</div>'

    + '<div class="pop-body" id="coL">'
    +   (shown.length
        ? shown.map(function(c){
            var on = CO_SEL.indexOf(c) > -1;
            return '<label class="coRow" data-c="' + esc(c) + '">'
              + '<input type="checkbox" class="coCk"' + (on ? ' checked' : '') + '>'
              + '<i style="background:' + coColor(c) + '"></i>'
              + '<span>' + esc(c) + '</span></label>';
          }).join('')
        : '<p class="hint" style="text-align:center;padding:20px 0;margin:0">'
          + esc(t('لا شركةَ بهذا الاسم.')) + '</p>')
    + '</div>'

    + '<div class="pop-foot">'
    +   '<div class="actions" style="margin:0">'
    +     btn(allOn ? 'أزِل تحديد الكل' : 'حدّد الكل', 'btn-secondary btn-sm',
              ' data-coall="' + (allOn ? '0' : '1') + '"')
    +     btn('عرض', 'btn-primary btn-sm', ' data-cogo="1"')
    +     btn('مسح التحديد', 'btn-quiet btn-sm', ' data-cogo="0"')
    +   '</div>'
    +   '<p class="hint" style="font-size:11.5px;margin:9px 0 0">'
    +     nm(shown.length) + ' ' + esc(t('من')) + ' ' + nm(CO_LIST.length) + ' '
    +     esc(t('شركة')) + (CO_SEL.length ? ' · ' + nm(CO_SEL.length) + ' ' + esc(t('محدَّدة')) : '')
    +     ' — ' + esc(t('لكل واحدة لونٌ ثابت فلا يتجاور لونان متشابهان.'))
    +   '</p>'
    + '</div></div>';
}

/* الأسطورةُ تتبع الطبقة: لكلٍّ حالاتُها، ولكلِّ نوعٍ شكلُه ولونُه */
function legendRows(){
  if (CO_OPEN || CO_MODE){
    /* لا معنى لأسطورة الحالات ولونُ النقطة لشركتها */
    var seen = {}, out = [];
    (typeof filtered === 'function' ? filtered() : STATE.sites).forEach(function(x){
      if (!x.co || seen[x.co]) return;
      seen[x.co] = 1;
      if (out.length < 12) out.push(x.co);
    });
    return '<div style="font-weight:700;margin:0 0 6px">' + esc(t('لون الشركات')) + '</div>'
      + out.map(function(c){
          return '<div><span class="dot" style="background:' + coColor(c) + '"></span>'
            + esc(c.length > 22 ? c.slice(0, 21) + '…' : c) + '</div>';
        }).join('')
      + (Object.keys(seen).length > out.length
          ? '<div class="hint" style="margin:6px 0 0">' + esc(t('و')) + ' '
            + nm(Object.keys(seen).length - out.length) + ' ' + esc(t('شركةً أخرى')) + '</div>'
          : '');
  }
  var L = (typeof LAYER === 'function') ? LAYER() : LAYERS.survey;
  var rows = [];
  /* ═══ الأسطورةُ تعدُّ ═══
     كانت تقول «معتمدة» ولا تقول كم — فيبقى السؤالُ الأوّلُ بلا جواب: «كم
     نقطةً في كلِّ حالة؟». صارت تعدُّ ما هو معروضٌ في الطبقة الحالية بعد
     الترشيح، فالرقمُ يوافق ما تراه العينُ لا ما في القاعدة كلِّها. */
  var CNT = {}, TOT = 0;
  (function(){
    var LST = (typeof layerFiltered === 'function') ? layerFiltered()
            : (typeof filtered === 'function' ? filtered() : STATE.sites);
    LST.forEach(function(x){
      var k;
      if (FIELD_MODE === 'survey') k = lifeOf(x);
      else if (FIELD_MODE === 'install') k = insDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      else k = disDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      CNT[k] = (CNT[k] || 0) + 1; TOT++;
    });
  })();
  if (FIELD_MODE === 'survey'){
    /* الأسطورةُ تُشتقُّ من دورة الحياة نفسِها — فلا تفترق عن الخريطة */
    rows = LIFE_ORDER.map(function(k){ return [LIFE[k].c, LIFE[k].n, k]; });
  } else if (FIELD_MODE === 'install'){
    rows = [[LIFE.ready.c,'معتمدة — جاهزة للإسناد','wait'], [LIFE.sched.c,'مُسندة للتركيب','asn'], [L.c,'مُركّب','done']];
  } else {
    rows = [['#E8C34B','قابل للفك','wait'], ['#FF8C42','مجدول للفك','asn'], [L.c,'تم الفك','done']];
  }
  out = rows.map(function(r){   /* (V31.4) `out` مُعلَنٌ أعلى الدالة */
    var n = CNT[r[2]] || 0;
    /* الحالةُ الخاليةُ تخفت ولا تختفي — فيُعرَف أنها حالةٌ قائمةٌ لا شيءَ فيها */
    var act = FIELD_MODE === 'survey' ? FILT.life === r[2] : FILT.stg === FIELD_MODE + ':' + r[2];   /* (V39.29) the legend filters */
    return '<div class="lg-row' + (n ? '' : ' lg-off') + (act ? ' on' : '') + '" data-lgk="' + esc(r[2]) + '" role="button" tabindex="0" style="cursor:pointer' + (act ? ';outline:2px solid var(--brand);border-radius:6px' : '') + '">'
      + '<i class="lg-dot" style="background:' + r[0] + '"></i>'
      + '<span class="lg-n">' + esc(t(r[1])) + '</span>'
      + '<b class="num lg-c">' + nm(n) + '</b></div>';
  }).join('')
  + '<div class="lg-row lg-tot"><span class="lg-n">' + esc(t('في هذا الترشيح')) + '</span>'
  + '<b class="num lg-c">' + nm(TOT) + '</b></div>';
  /* (V39.27) the summaries of the mode's records — shown once the mode has at least one */
  var BCx = { 'تمام':0, 'تحدٍّ':0, 'ملاحظة':0 }; ((typeof layerFiltered === 'function') ? layerFiltered() : []).forEach(function(x){ var b0 = briefOf(x.id); if (b0 && BCx[b0.st] !== undefined) BCx[b0.st]++; });
  if (BCx['تمام'] + BCx['تحدٍّ'] + BCx['ملاحظة'] > 0){
    var BC = { 'تمام':0, 'تحدٍّ':0, 'ملاحظة':0 }, noB = 0;
    ((typeof layerFiltered === 'function') ? layerFiltered() : []).forEach(function(x){
      var b = briefOf(x.id);
      if (b && BC[b.st] !== undefined) BC[b.st]++; else noB++;
    });
    out += '<div class="lg-sep"></div>'
      + '<div style="font-weight:700;margin:0 0 4px">' + esc(t('إطارُ النقطة — الخلاصة')) + '</div>'
      + BRIEF_ST.map(function(k){
          return '<div class="lg-row' + (BC[k] ? '' : ' lg-off') + '">'
            + '<i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 2px ' + BRIEF_C[k] + '"></i>'
            + '<span class="lg-n">' + esc(t(k)) + '</span><b class="num lg-c">' + nm(BC[k]) + '</b></div>';
        }).join('')
      + '<div class="lg-row' + (noB ? '' : ' lg-off') + '"><i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 1px var(--line)"></i>'
      + '<span class="lg-n">' + esc(t('بلا خلاصةٍ بعد')) + '</span><b class="num lg-c">' + nm(noB) + '</b></div>';
  }
  /* الأشكالُ — تُذكَر مرةً في آخر الأسطورة، وتُشتقُّ من سجلِّ الأنواع (V17.60):
     كانت ثلاثةَ أسطرٍ مكتوبةٍ بيد، فلا يظهر فيها شكلُ نوعٍ أُضيف ولا شكلٌ غُيِّر. */
  out += '<div class="lg-sep"></div>' + legendShapes();
  return out;
}
/* أسطرُ الأشكال: المخيمُ بحدوده، ثم كلُّ شكلٍ بأنواعه — بالهندسة التي يُرسَم بها */
PV.SHAPE_ORDER = ['diamond','circle','square','triangle','star','drop'];
/* اسمُ النوع القصير: المفتاحُ العربيُّ نفسُه، وإلا اسمُه المعروض (LPR لا يُقرأ حرفًا) */
function typeShort(k){
  if (/[\u0600-\u06FF]/.test(k)) return t(k);
  var d = typesList()[k] || CAT_DEF[k] || {};
  return t(d.l || k);
}
function legendShapes(){
  var T = typesList(), by = {};
  Object.keys(T).forEach(function(k){
    if (k === 'مخيم') return;
    var sh = mapShapeOf(k);
    (by[sh] = by[sh] || []).push(k);
  });
  var order = Object.keys(by).sort(function(a, b){
    var ia = PV.SHAPE_ORDER.indexOf(a), ib = PV.SHAPE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return '<div class="lg-row"><i class="lg-sh sh-c"></i>' + esc(t('مخيم')) + '</div>'
    + order.map(function(sh){
        return '<div class="lg-row lg-shp sh-' + esc(sh) + '">' + shapeSvg(sh)
          + '<span>' + by[sh].map(function(k){ return esc(typeShort(k)); }).join(' \u00b7 ') + '</span></div>';
      }).join('');
}

/* واجهةُ الخريطة تُرسَم في #mapUI فوق الحاوية الثابتة —
   والحاويةُ نفسها لا يمسّها إعادةُ الرسم فلا تُدمَّر Leaflet. */
