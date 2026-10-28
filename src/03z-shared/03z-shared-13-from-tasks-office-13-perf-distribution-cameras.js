/* ============================================================================
   FILE    : src/03z-shared/03z-shared-13-from-tasks-office-13-perf-distribution-cameras.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-13-perf-distribution-cameras.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : siteIndex, siteFind, siteSearch, statBump, recLocApply, siteKeyStats, svLabel, declaredKeys, typeOfLabel, declaredTypeKeys, camKind, camKindLabel … (+2 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ── فهرسٌ للمواقع: بحثٌ فوريٌّ بدل مسحٍ خطي ── */
var SITE_IX = null, SITE_TOK = null;

function siteIndex(){
  /* (V38.69) the index follows the list it was built from: a replaced or grown registry rebuilds it. With the «first point»
     fallbacks gone (popup, point page, forms) a stale index would hide a point that exists — the fallback used to mask that. */
  if (SITE_IX && siteIndex.of === STATE.sites && siteIndex.n === STATE.sites.length) return SITE_IX;
  siteIndex.of = STATE.sites; siteIndex.n = STATE.sites.length;
  SITE_IX = Object.create(null);
  SITE_TOK = Object.create(null);
  STATE.sites.forEach(function(x, i){
    SITE_IX[x.id] = x;
    /* مفاتيحُ البحث: المعرّف والشاخص والمربع وكلماتُ الاسم */
    var keys = [x.id, x.sign, x.sq, siteKey(x)];   /* (V35.0) */
    String(x.name || '').split(/[\s\-—·]+/).forEach(function(t){ if (t.length > 1) keys.push(t); });
    keys.forEach(function(k){
      k = String(k || '').trim();
      if (!k) return;
      if (!SITE_TOK[k]) SITE_TOK[k] = [];
      if (SITE_TOK[k].length < 400) SITE_TOK[k].push(i);
    });
  });
  return SITE_IX;
}

function siteFind(id){ return siteIndex()[id] || null; }

function siteSearch(q, lim){
  lim = lim || 50;
  q = String(q || '').trim();
  if (!q) return STATE.sites.slice(0, lim);
  siteIndex();
  /* مطابقةٌ تامةٌ أولًا — أسرعُ ما يكون */
  if (SITE_TOK[q]){
    var hit = SITE_TOK[q].slice(0, lim).map(function(i){ return STATE.sites[i]; });
    if (hit.length >= lim) return hit;
  }
  var out = [], seen = Object.create(null);
  if (SITE_TOK[q]) SITE_TOK[q].forEach(function(i){
    if (!seen[i] && out.length < lim){ seen[i] = 1; out.push(STATE.sites[i]); }
  });
  /* ثم بادئةٌ جزئية — تُمسح مفاتيحُ الفهرس لا الصفوفُ كلها */
  if (out.length < lim){
    var ks = Object.keys(SITE_TOK);
    for (var j = 0; j < ks.length && out.length < lim; j++){
      if (ks[j].indexOf(q) < 0) continue;
      SITE_TOK[ks[j]].forEach(function(i){
        if (!seen[i] && out.length < lim){ seen[i] = 1; out.push(STATE.sites[i]); }
      });
    }
  }
  return out;
}

/* ── إحصاءٌ يُحسب مرةً ويُبطَل عند التغيير ── */
var STAT_CACHE = null, STAT_VER = 0;

/* الفهرسُ يُبطَل مع كلِّ تغيُّرٍ في المهامّ — وstatBump يُستدعى بعد كلِّ تغيير */
function statBump(){
  TK_IX = null; STAT_CACHE = null; STAT_VER++; DB.memoReset(); recLocApply();
  if (typeof insCanonApply === 'function') insCanonApply(); }   /* (V38.71) */

/* (V32.2) ما حُرِّك قبل V32.2 كُتب في الزيارة (rec.loc) وحدَها — يُطبَّق هنا على النقطة في كلِّ جهازٍ ما لم يكن لها تجاوزُ موضع */
function recLocApply(){
  var R = STATE.recs || {}, ov = STATE.siteOv || {};
  Object.keys(R).forEach(function(id){ var r = R[id], L0 = recMove(r); if (!L0) return; var o = ov[id]; if (o && +o.lat && +o.lng) return;
    var x = siteFind(id); if (x && (+x.lat !== +L0.lat || +x.lng !== +L0.lng)){ x.lat = +L0.lat; x.lng = +L0.lng; } });
}

/* ═══ التوزيعُ بالمشعر والنوع — من حلقةٍ واحدة ═══
   كانت صفوفُ الجدول تُحسَب في مكانٍ والإجماليُّ في آخر (كاشٌ قد يكون أقدمَ
   بسجلٍّ)، والإكسلُ بتعريفٍ ثالث («سجلٌّ موجود» لا «مُسح») — فخرج للوزارة ٦٢+٢
   في الصفوف و٦٣ في الإجمالي. صار كلُّ شيءٍ من حلقةٍ واحدةٍ بتعريفٍ واحد:
   مُسح = svDone، مُركّب = حالةُ التركيب. */
function siteKeyStats(){
  var by = {}, sv = {}, ins = {}, T = { n:0, sv:0, ins:0, noRec:0, stuck:0 }, Z = {};
  STATE.sites.forEach(function(x){
    var k = x.zone + '|' + x.type, r = STATE.recs[x.id], z = taxOf(x).g || 'أخرى';   /* (V30.0) المشعرُ بتصنيف المالك: مراكزُ التفويج تضمّ النورية والزايدي والهجرة */
    /* المشعرُ بالأعداد نفسِها (V17.78): من الحلقة نفسِها لا من حسابٍ ثانٍ */
    var ZZ = Z[z] || (Z[z] = { n:0, sv:0, ins:0, noRec:0, stuck:0 });
    by[k] = (by[k] || 0) + 1; T.n++; ZZ.n++;
    if (!r){ T.noRec++; ZZ.noRec++; }
    else { sv[k] = (sv[k] || 0) + 1; T.sv++; ZZ.sv++;   /* (V32.6) زيرت بأيِّ نتيجة */
      if (svStuck(r)){ T.stuck++; ZZ.stuck++; } }   /* من لم يصل — والمردودُ ليس متعذّرًا (V17.77) */
    var st = (STATE.inss[x.id] || {}).status;
    if (st === 'مُركّب' || x.fstat === 'مُركّب'){ ins[k] = (ins[k] || 0) + 1; T.ins++; ZZ.ins++; }
  });
  /* المعلَنُ في «نقاط المراحل» يدخل بصفرٍ — مشعرًا وتركيبةً (V18.0) */
  declaredTypeKeys().forEach(function(k){ if (by[k] == null) by[k] = 0; });   /* (V30.0) المعلَنُ بلا نقاطٍ لا يصنع مشعرًا فارغًا في الشاشة */
  var keys = Object.keys(by).sort(function(a, b){ return by[b] - by[a]; });
  return { keys:keys, by:by, sv:sv, ins:ins, total:T, zones:Z };
}

/* حالةُ المسح بكلمةٍ واحدةٍ — للقوائم والإكسل، بالتعريف نفسِه */
function svLabel(r){
  if (!r) return 'لم يُزر';
  if (svStuck(r)) return 'تحتاج زيارة أخرى';              /* من لم يصل — بالتعريف نفسِه (V17.77) · (V39.0) باسم متابعة الوزارة */
  if (r.review === 'revisit') return 'أعادها المهندس';
  return r.review === 'approved' ? 'معتمدة' : 'تمت الزيارة';
}

/* ═══ المشعرُ المعلَنُ مشعرٌ حيث يُعَدّ (V18.0) ═══
   إعلانُ تركيبةٍ في «نقاط المراحل» (مشعر|نوع) كان يبقى في مصفوفة الأوزان وحدَها:
   الطلباتُ والتوزيعُ وشاشةُ الوزارة والملخّصُ تشتقّ المشاعرَ من المواقع، فمشعرٌ
   جديدٌ بلا نقاطٍ بعدُ لا يُرى في شيء. صار المعلَنُ يدخل الإحصاءَ بصفرٍ في كلِّ
   موضعٍ يعدُّ بالمشعر — فيُرى في الطلبات بمتاحٍ صفر، وفي شاشة الوزارة بصفرٍ من
   صفر، وفي التصدير — من اليوم الذي يُعلَن فيه لا يومَ تأتي أوّلُ نقطة. */
function declaredKeys(){
  return (Array.isArray(CFG.mxExtra) ? CFG.mxExtra : []).map(function(x){ return String(x || ''); }).filter(function(k){ return k.indexOf('|') > 0; });
}

/* التركيبةُ المعلَنةُ «مشعر|تسمية» (مصفوفةُ الأوزان تعمل بالتسمية) تدخل إحصاءَ المواقع
   «مشعر|نوعٌ خام» — فلا يتكرّر صفٌّ حين تأتي أوّلُ نقطةٍ من نوعٍ تسميتُه غيرُ مفتاحه (V19.1) */
function typeOfLabel(lab){
  if (CAT_DEF[lab]) return lab;
  var ks = Object.keys(CAT_DEF);
  for (var i = 0; i < ks.length; i++){ if (CAT_DEF[ks[i]] && CAT_DEF[ks[i]].l === lab) return ks[i]; }
  for (var k in PV.TYPES_OLD_L){ if (PV.TYPES_OLD_L[k].indexOf(lab) > -1 && CAT_DEF[k]) return k; }
  return lab;
}

function declaredTypeKeys(){
  return declaredKeys().map(function(k){ var i = k.indexOf('|'); return k.slice(0, i) + '|' + typeOfLabel(k.slice(i + 1)); });
}

/* ═══ كاميراتُ الوزارة: ثابتةٌ (Bullet) ومتحرّكةٌ (PTZ) وقارئةُ لوحات (LPR) (V19.1) ═══
   عائلةٌ واحدة بثلاثة أنواع. LPR نوعُ موقعٍ قائم؛ والثابتةُ والمتحرّكةُ نوعٌ واحدٌ
   («كاميرا») يُعرَف فرعُه من اسم النقطة في السجلِّ المدمج («… (PTZ) …»)، ويصحّحه
   المهندسُ من نافذة النقطة (تجاوزٌ في وثيقة الموقع — cam) فيغلب الاسم. */
PV.CAM_KINDS = ['Bullet', 'PTZ', 'LPR'];

function camKind(x){
  if (!x) return '';
  if (x.type === 'LPR') return 'LPR';
  if (x.type !== 'كاميرا') return '';
  if (x.cam && PV.CAM_KINDS.indexOf(x.cam) > -1) return x.cam;
  return /\bPTZ\b/i.test(String(x.name || '')) ? 'PTZ' : 'Bullet';
}

function camKindLabel(k){ return { Bullet:t('ثابتة'), PTZ:t('متحرّكة'), LPR:t('قراءة اللوحات (LPR)') }[k] || ''; }

function siteStats(){
  if (STAT_CACHE) return STAT_CACHE;
  var s = STATE.sites, by = {}, co = {}, wk = {}, sv = 0, ins = 0, apv = 0, pend = 0, rev = 0;
  for (var i = 0; i < s.length; i++){
    var x = s[i], k = x.zone + '|' + x.type;
    by[k] = (by[k] || 0) + 1;
    if (x.co) co[x.co] = (co[x.co] || 0) + 1;
    if (x.work) wk[x.work] = (wk[x.work] || 0) + 1;
    var rv = svReview(STATE.recs[x.id]);
    if (rv === 'approved') apv++; else if (rv === 'pending') pend++; else if (rv === 'revisit') rev++;
    if (svVisited(STATE.recs[x.id])) sv++;   /* (V32.6) */
    var st = (STATE.inss[x.id] || {}).status;
    if (st === 'مُركّب' || x.fstat === 'مُركّب') ins++;
  }
  declaredTypeKeys().forEach(function(k){ if (by[k] == null) by[k] = 0; });   /* المعلَنُ بصفر (V18.0) — بمفتاح النوع (V19.1) */
  STAT_CACHE = { total:s.length, byKey:by, byCo:co, byWork:wk, surveyed:sv, installed:ins,
                 approved:apv, pending:pend, revisit:rev };
  return STAT_CACHE;
}

/* ── قائمةٌ افتراضية: تُرسَم دفعةٌ ويُزاد عند الطلب ── */
PV.LIST_PAGE = 40; PV.LIST_SHOWN = 40; var SEL_MODE = false;

/* عدٌّ بلا بناءِ مصفوفة — يُعرَف الإجمالي دون نسخِ الصفوف */
function fieldList(){
  var S = siteStats();
  /* الفنيُّ وطاقمُه: ما أُسند إليهم وحده. المشرفُ: المُسنَدُ أوّلًا ومفتاحٌ يفتح الكلّ */
  var mineOnly = isCrewRole(ROLE) || (effRole(ROLE) === 'supervisor' && !SITES_ALL);
  var base = mineOnly ? mineFiltered() : filtered();
  var view, total;
  var outside = 0;   /* (V22.1) نتائجُ البحث التي أخفتها التصفيةُ الحالية */
  if (SITE_Q){
    var hits = siteSearch(SITE_Q, 4000);
    if (filtOn()){ var allN = hits.length; hits = hits.filter(filtPass); outside = allN - hits.length; }
    total = hits.length;
    view = hits.slice(0, PV.LIST_SHOWN);
  } else {
    total = base.length;
    /* الأقربُ أولًا حين يُعرَف الموقع — والفنيُّ يبدأ بما تحت قدمه */
    if (PV.MYPOS && base.length <= 4000){
      var arr = base.slice();
      arr.sort(function(a, b){ return (distKm(PV.MYPOS, a) || 9e9) - (distKm(PV.MYPOS, b) || 9e9); });
      view = arr.slice(0, PV.LIST_SHOWN);
    } else view = base.slice(0, PV.LIST_SHOWN);
  }
  var L = { length: total };
  var scopeBar = mineOnly || (effRole(ROLE) === 'supervisor' && SITES_ALL)
    ? '<div class="chips" style="margin:0 0 8px">'
      + '<span class="chip' + (mineOnly ? ' on' : '') + '">' + esc(t('المُسنَد إليّ')) + ' \u00b7 ' + nm(mineFiltered().length) + '</span>'
      + (effRole(ROLE) === 'supervisor'
          ? '<button type="button" class="chip' + (SITES_ALL ? ' on' : '') + '" data-sitesall="' + (SITES_ALL ? '0' : '1') + '">' + esc(t('كل المواقع')) + '</button>'
          : '')
      + '</div>'
    : '';
  return scopeBar + catBar(1) + cardFlush(t('المواقع') + ' — ' + nm(total) + (filtOn() ? ' / ' + nm(S.total) : ''),
    (view.length
      ? '<div class="list">' + view.map(function(x){
          var sv = !!STATE.recs[x.id];
          var a = (typeof asnOf === 'function') ? asnOf(x.id) : null;
          return '<div class="list-item' + (selHas(x.id)?' sel':'') + '" data-site="' + esc(x.id) + '">'
            + (SEL_MODE ? '<input type="checkbox" data-sel="' + esc(x.id) + '"'
                + (selHas(x.id)?' checked':'') + (a?' disabled':'')
                + ' style="width:20px;min-height:20px;flex:0 0 auto">' : '')
            + '<div class="li-main">'
            + '<div class="li-t">' + esc(siteTitle(x)) + (siteSub(x) ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(siteSub(x)) + '</span>' : '') + '</div>'   /* المخيمُ بشاخصه (V23.8) */
            + '<div class="li-s">' + siteIdHtml(x) + ' · '
            +   esc(t(x.zone)) + ' · ' + esc(t(x.type)) + (x.co ? ' · ' + esc(dispName(x.co.slice(0, 26))) : '')
            + '</div></div><div class="li-end">'
            + (typeof distTxt === 'function' && distTxt(x)
                ? '<div class="num" style="margin-bottom:3px">\u{1F4CD} ' + distTxt(x) + '</div>' : '')
            + pill(sv ? 'تمت الزيارة' : 'لم يُزر', sv ? 'ok' : 'warn') + '</div></div>';
        }).join('') + '</div>'
        + (L.length > view.length
          ? '<div style="padding:12px 16px;text-align:center">'
            + btn('اعرض ' + nm(Math.min(PV.LIST_PAGE, L.length - view.length)) + ' أخرى — '
                  + nm(L.length - view.length) + ' متبقية','btn-secondary btn-sm',' data-more="1"')
            + '</div>'
          : '')
      : '<p class="hint" style="padding:18px;text-align:center;margin:0">لا نتائج لـ«' + esc(SITE_Q) + '»'
        /* (V22.1) «بحثتُ عن 0016 فلم يظهر»: التصفيةُ الباقيةُ من قبل (نوعٌ أو مشعرٌ أو حالة) كانت تُخفي
           النتيجةَ والرسالةُ لا تقول — فيُظَنّ أن النقطةَ غيرُ موجودة */
        + (outside ? ' ' + esc(t('ضمن التصفية الحالية')) + ' — ' + esc(t('وخارجها')) + ' <b class="num">' + nm(outside) + '</b>.</p>'
            + '<div style="text-align:center;padding:0 0 16px">' + btn(t('ابحث في الكل'), 'btn-primary btn-sm', ' data-sqall="1"') + '</div>'
          : '.</p>')),
    '<form class="inline-form" onsubmit="return false">'
    + '<input type="search" id="siteQ" value="' + esc(SITE_Q) + '" placeholder="'
    +   esc(t('ابحث بالمعرّف أو الشاخص أو المربع')) + '" dir="auto">'
    + btn('بحث','btn-secondary btn-sm',' data-sq="1"')
    + '<span class="hint" style="margin:0">' + nm(view.length) + ' / ' + nm(L.length) + '</span>'
    + btn(SEL_MODE ? 'إنهاء التحديد' : '☑ تحديد', SEL_MODE?'btn-primary btn-sm':'btn-secondary btn-sm',
          ' data-selmode="' + (SEL_MODE?0:1) + '"')
    + (SEL_MODE && SEL_N ? btn('أسند ' + nm(SEL_N),'btn-primary btn-sm',' data-asn="1"') : '')
    + '</form>');
}

var CFG_VER = 0;

/* ═══ من فوقُ يرى ما تحته ═══
   كان السحبُ ثلاثَ طبقات: «التيّارُ الخامُ» لمن يعتمد (مهندسٌ ومدير)، و«الأرقامُ
   وحدَها» لمن يضبط، و«ما كتبتُه أنا» للباقين — فالإدارةُ العليا (لا تعتمد ولا
   تضبط) والمشرفُ سقطا في الطبقة الثالثة: لا يريان زيارةً ولا تركيبًا ولا
   إسنادًا كتبه من دونهما. والمؤشِّرُ كان «آخر مزامنة» التي صارت (V15.96) تُبدَّل
   مع كلِّ إنصاتٍ ونبض — فيقفز أمامَ ما لم يُسحَب بعدُ ويضيع الفارقُ إلى الأبد:
   المديرُ يزامِن ولا يرى ما أسنده المهندسُ قبل عشر دقائق. وسقفُ خمسمئةٍ في
   السحبة الباردة يُسقِط ما فوقه من ألفٍ وسبعمئة نقطة.
     صار النطاقُ بالرتبة: المشرفُ فما فوق (والإدارةُ العليا) يسحبون العملَ كلَّه —
   زياراتٍ وتركيباتٍ وإسناداتٍ وفكًّا وصيانة؛ والوزارةُ الأرقامَ؛ والميدانُ ما
   كتبه هو. والمؤشِّرُ لكلِّ مجموعةٍ وقتُ آخرِ سحبةٍ ناجحةٍ لها — بتداخلِ دقيقتين —
   ويُحفَظ على الجهاز فلا تُعاد السحبةُ الباردةُ مع كلِّ فتح. */
var PULL_COL = { recs:'recs', inss:'inss', tasks:'tasks', dismantles:'diss', maints:'maints', stats:'stats',
                 events:'evlog' };
