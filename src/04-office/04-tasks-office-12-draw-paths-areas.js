/* ============================================================================
   FILE    : src/04-office/04-tasks-office-12-draw-paths-areas.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Drawing on the map: paths that generate points, tafweej routes, drag before save, areas filled with grids, camp boundaries, office-placed points, and a visible exit for every mode.
   DEFINES : tfdMay, tfdGraph, tfdMpp, tfdSnap, tfdPath, tfdStart, tfdAdd, tfdUndo, tfdCancel, tfdDrawn, tfdLen, tfdSave, tfdClear, tfdPanelHtml … (+33 more)
   GLOBALS : TFD, ROUTE, RT_EVERY_MIN, PIN_ON
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ مسارٌ يُرسَم على الخريطة فتُولَّد نقاطُه (V17.45) ═══
   طريقٌ طولُه كيلومترات تُراد فيه نقطةٌ كلَّ مئتين وخمسين مترًا: وضعُها واحدةً
   واحدةً عملُ يومٍ ويُخطئ. فيُرسَم المسارُ نقرةً بعد نقرةٍ على الخريطة، ثم
   يُقال «كلَّ كم مترًا» فتُولَّد النقاطُ على استقامته بالمسافة المطلوبة —
   يُعرَض عددُها قبل الحفظ، ولا تُكتَب إلا بضغطةٍ ثانية. والإحداثياتُ من
   الخريطة لا من تقديرٍ، فما يُرسَم هو ما يُحفَظ. */

function tfdStart(f, d){
  if (!tfdMay()){ toast(t('رسمُ المسارات للمهندس فما فوق')); return; }
  TFD.on = true; TFD.f = (f == null ? TFD.f : +f); TFD.d = d || TFD.d; TFD.nodes = []; TFD.paths = []; TFD.pts = []; POP_OPEN = false; PIN_ON = false; if (typeof ROUTE === 'object') ROUTE.on = false;
  tfdGraph().then(function(g){ toast(t(g ? 'اضغط على الخريطة نقطةً بعد نقطة — الخطُّ يمشي على الشوارع وحدَها' : 'تعذّر تحميلُ شبكة الشوارع — تحقّق من الشبكة')); });
  if (typeof TFW === 'object' && TFW.f < 0){ TFW.f = TFD.f; tfwLoad(); tfwPaint(); }
  if (typeof mapPaint === 'function') mapPaint(); render(1);
}

function tfdUndo(){ TFD.nodes.pop(); if (TFD.pts) TFD.pts.pop(); if (TFD.paths.length >= TFD.nodes.length && TFD.paths.length) TFD.paths.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1); }
function tfdCancel(){ TFD.on = false; TFD.nodes = []; TFD.paths = []; TFD.pts = []; TFD.free = false; if (typeof mapPaint === 'function') mapPaint(); render(1); }

function tfdSave(){
  if (!tfdMay() || !TFD.paths.length){ toast(t('ارسم نقطتين على الأقل')); return false; }
  var pl = []; TFD.paths.forEach(function(p, i){ p.forEach(function(pt, j){ if (i && j === 0) return; pl.push([+pt[0].toFixed(6), +pt[1].toFixed(6)]); }); });
  var all = JSON.parse(JSON.stringify(tfdDrawn())); var fl = all[TFD.f] = all[TFD.f] || {}; var arr = fl[TFD.d] = fl[TFD.d] || []; arr.push(pl);
  CFG.tfwdraw = { floors:all, at:Date.now(), by:STATE.meta.name || '' }; CORE.set('cfg', 'tfwdraw', CFG.tfwdraw);
  logEvent('رسمُ مسار تفويج — ' + t('الدور') + ' ' + t(TFW_FL[TFD.f]) + ' · ' + t(TFD.d === 'go' ? 'الذهاب' : 'العودة') + ' · ' + Math.round(tfdLen([pl])) + ' م', '');
  toast(t('حُفظ المسارُ — يُعرَض على الأجهزة كلِّها بدل المولَّد')); TFD.nodes = []; TFD.paths = []; TFD.pts = [];
  if (typeof TFW === 'object'){ TFW.f = TFD.f; tfwPaint(); } if (typeof mapPaint === 'function') mapPaint(); render(1); return true;
}
function tfdClear(f, d){
  if (!tfdMay()) return; var all = JSON.parse(JSON.stringify(tfdDrawn())); if (!all[f] || !all[f][d]) return; delete all[f][d]; if (!Object.keys(all[f]).length) delete all[f];
  CFG.tfwdraw = { floors:all, at:Date.now(), by:STATE.meta.name || '' }; CORE.set('cfg', 'tfwdraw', CFG.tfwdraw); logEvent('حذفُ مسار تفويج مرسوم — ' + t('الدور') + ' ' + t(TFW_FL[f]) + ' · ' + t(d === 'go' ? 'الذهاب' : 'العودة'), '');
  if (typeof TFW === 'object' && TFW.f >= 0) tfwPaint(); render(1);
}

function routeStart(mode){
  if (!may('settings')){ toast(t('إضافةُ النقاط للمكتب')); return; }
  ROUTE.on = true; ROUTE.mode = (mode === 'area' ? 'area' : 'line'); ROUTE.pts = []; POP_OPEN = false; PIN_ON = false;
  ROUTE.gen = null; ROUTE.moved = 0;
  RT_MIN = false; drawFlag();
  if (ROUTE.mode === 'area' && ROUTE.every === 250) ROUTE.every = 50;
  /* المساحةُ للمخيم أوّلًا (V17.59): تُرسَم حدودُه فيُحفَظ مخيمًا واحدًا بلا نقاط —
     وغيرُه من الأنواع يبقى شبكةَ نقاطٍ كالمواقف. والمسارُ لا يكون مخيمًا. */
  if (ROUTE.mode === 'area') ROUTE.type = 'مخيم';
  else if (ROUTE.type === 'مخيم') ROUTE.type = 'ممر';
  toast(t(ROUTE.mode === 'area' ? 'ارسم حدودَ المخيم: اضغط على الخريطة حول حدوده' : 'ارسم المسار: اضغط على الخريطة نقطةً بعد نقطة'));
  render(1);
}

function routeUndo(){
  if (ROUTE.gen){ routeRegen(); return; }   /* التراجعُ بعد التحريك يرجع إلى المسافة أوّلًا */
  ROUTE.pts.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1);
}
function routeCancel(){ ROUTE.on = false; ROUTE.pts = []; ROUTE.gen = null; ROUTE.moved = 0; drawFlag(); if (typeof mapPaint === 'function') mapPaint(); render(1); }

function routeRegen(){
  ROUTE.gen = null; ROUTE.moved = 0;
  render(1);
}

/* الكتابةُ في حقول اللوح لا تُعيد بناءَه: كان كلُّ رقمٍ يُعيد رسمَ اللوح والخريطة
   معًا — ثقيلٌ، وعلى الهاتف قد تُغلَق لوحةُ المفاتيح بعد أوّل رقم. فيُحدَّث العددُ
   والخريطةُ في مكانهما، ويُعاد اللوحُ عند الخروج من الحقل (V17.58). */
function routeLive(){
  var el = document.getElementById('rtN');
  if (el) el.textContent = nm(routeCount());
  if (typeof mapPaintDebounced === 'function') mapPaintDebounced();
}

/* ═══ المساحةُ مخيمٌ بحدوده (V17.59) ═══
   رسمُ مساحةٍ حول مخيمٍ يقول «هذا مخيم» لا «املأه نقاطًا»: المخيمُ نقطةُ قراءةٍ
   واحدة، وحدودُه هي ما يُرى على الخريطة ويُرفَع في الثلاثي. فيُحفَظ مخيمًا
   واحدًا بحدوده ومركزه — وإن ضمّت الحدودُ مخيمًا مسجَّلًا واحدًا رُبطت به ولا
   يُنشأ مكرَّر، وإن ضمّت أكثرَ طُلب رسمُ مخيمٍ واحد. والحدودُ تُخزَّن أرقامًا
   متتاليةً [عرض، طول، …] لأن القاعدةَ ترفض المصفوفاتِ المتداخلة. */
function polyFlat(P){
  var out = [];
  P.forEach(function(p){ out.push(+(+p[0]).toFixed(6), +(+p[1]).toFixed(6)); });
  return out;
}

function polyCentroid(P){
  var a = 0, cx = 0, cy = 0, m = [0, 0];
  for (var i = 0, j = P.length - 1; i < P.length; j = i++){
    var f = P[j][0] * P[i][1] - P[i][0] * P[j][1];
    a += f; cx += (P[j][0] + P[i][0]) * f; cy += (P[j][1] + P[i][1]) * f;
  }
  P.forEach(function(p){ m[0] += p[0] / P.length; m[1] += p[1] / P.length; });
  if (Math.abs(a) < 1e-12) return m;
  var c = [cx / (3 * a), cy / (3 * a)];
  /* المضلَّعُ المقعَّرُ قد يقع مركزُه خارجه — فالمتوسّطُ، ثم أوّلُ رأس */
  return polyIn(c, P) ? c : (polyIn(m, P) ? m : [P[0][0], P[0][1]]);
}

function areaCampSave(){
  var P = ROUTE.pts;
  if (P.length < 3){ toast(t('ارسم ثلاثَ نقاطٍ على الأقل لتحديد المساحة')); return false; }
  var sq = String(ROUTE.sq || '').trim(), sign = String(ROUTE.sign || '').trim();
  if (sq && !NS_SQ_RE.test(sq)){ toast(t('رقم المربع: أرقامٌ أو أرقام-أرقام — مثال 7 أو 7-14')); return false; }
  if (sign && !NS_SIGN_RE.test(sign)){ toast(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')); return false; }
  var hits = areaCampHits();
  if (hits.length > 1){ toast(nm(hits.length) + ' ' + t('مخيماتٍ مسجَّلةٍ داخل الحدود — ارسم حدودَ مخيمٍ واحد')); return false; }
  var flat = polyFlat(P), who = STATE.meta.name || '', stamp = Date.now();
  if (hits.length === 1){
    /* مخيمٌ مسجَّل: تُربَط به الحدودُ ولا يُنشأ غيرُه — والمربعُ والشاخصُ يُكمَلان إن غابا */
    var x = hits[0];
    var patch = { poly:flat, polyBy:who, polyAt:stamp };
    if (sq && !x.sq) patch.sq = sq;
    if (sign && !x.sign) patch.sign = sign;
    Object.assign(x, patch);
    if (x.isNew) CORE.set('newsites', x.id, x);
    else siteOvSet(x.id, patch);
    SITE_IX = null; SITE_TOK = null;
    statBump();
    logEvent('حدودُ مخيم — ' + x.id + ' \u00b7 ' + nm(P.length) + ' رأسًا', x.id);
    toast(x.id + ' \u00b7 ' + t('رُبطت الحدودُ بالمخيم المسجَّل'));
    routeCancel();
    return x.id;
  }
  var zone = ROUTE.zone || 'منى';
  var pre = zoneCode(zone);
  var id = 'NSK-' + pre + '-CMP-A' + String(stamp).slice(-6);
  var c = polyCentroid(P);
  var name = String(ROUTE.name || '').trim()
          || (zone + (sq ? ' - مربع ' + sq : '') + (sign ? ' - شاخص ' + sign : '') + (sq || sign ? '' : ' - مخيم ' + id.split('-').pop()));
  var site = { id:id, name:name, zone:zone, type:'مخيم', work:'موقع جديد',
    lat:+c[0].toFixed(6), lng:+c[1].toFixed(6), sq:sq, sign:sign, co:'', region:'منطقة ' + zone,
    fstat:'لم يبدأ', inout:'', isNew:true, approved:false, by:who, at:stamp,
    origin:'office', src:'area', poly:flat };
  STATE.sites.push(site);
  CORE.set('newsites', id, site);
  SITE_IX = null; SITE_TOK = null;
  statBump();
  stepDone('newsite', id, 'مخيمٌ بحدوده — أضافه المكتب', 0);
  notifPush('موقع مقترح', 'موقعٌ جديدٌ بانتظار اعتمادك — ' + zone, { site:id, lv:'مهم' });
  logEvent('مخيمٌ جديدٌ بحدوده — ' + id + ' \u00b7 ' + zone, id);
  routeCancel();
  /* المكتبُ رسمه ولم يزره — تُجدوَل زيارتُه الآن (V17.57) */
  visitAsnOpen([id], true);
  toast(id + ' \u00b7 ' + t('مخيمٌ بحدوده — جدوِل زيارتَه الآن'));
  return id;
}
function routeSave(){
  if (ROUTE.mode === 'area' && ROUTE.type === 'مخيم'){ areaCampSave(); return; }
  var pts = ROUTE.mode === 'area' ? areaPoints() : routeGen();
  if (ROUTE.mode === 'area' && pts.length < 1){ toast(t('ارسم ثلاثَ نقاطٍ على الأقل لتحديد المساحة')); return; }
  if (ROUTE.mode !== 'area' && pts.length < 2){ toast(t('ارسم نقطتين على الأقل')); return; }
  if (!ROUTE.zone || !ROUTE.type){ toast(t('اختر المشعر والنوع')); return; }
  var base = String(ROUTE.name || '').trim() || (t(ROUTE.type) + ' ' + t(ROUTE.zone));
  var pre = 'NSK-' + zoneCode(ROUTE.zone) + '-' + ({ 'LPR':'LPR', 'كاميرا':'CAM', 'جيت واي':'GTW', 'حساس حرارة ورطوبة':'THS' }[ROUTE.type] || 'COR') + '-';
  var n = 0, stamp = Date.now(), made = [];
  pts.forEach(function(p, i){
    var id = pre + String(stamp).slice(-6) + '-' + String(i + 1);
    var site = { id:id, name:base + ' — ' + nm(i + 1),
      zone:ROUTE.zone, type:ROUTE.type, work:'موقع جديد',
      lat:p[0], lng:p[1], sq:'', sign:'', co:'', region:'منطقة ' + ROUTE.zone,
      fstat:'لم يبدأ', inout:'', isNew:true, approved:false,
      by:STATE.meta.name || '', at:stamp, route:base, every:cfgN(ROUTE.every) || 250,
      origin:'office', moved:ROUTE.gen ? 1 : 0 };
    STATE.sites.push(site);
    CORE.set('newsites', id, site);
    made.push(id);
    n++;
  });
  SITE_IX = null; SITE_TOK = null;
  logEvent('مسارٌ جديد — ' + base + ' · ' + nm(n) + ' نقطة كلَّ ' + nm(cfgN(ROUTE.every) || 250) + ' متر');
  routeCancel();
  /* نقاطُ المكتب لم يزرها أحد — يُفتَح لوحُ الإسناد عليها لتُجدوَل زيارتُها (V17.57) */
  visitAsnOpen(made, true);
  toast(nm(n) + ' ' + t('نقطةً أُضيفت على المسار') + ' \u00b7 ' + t('جدوِل زيارتَها'));
  if (typeof mapPaint === 'function') mapPaint();
}

/* ═══ لكلِّ وضعٍ مخرجٌ ظاهر (V17.53) ═══
   «نقطة هنا» يُسلِّح الضغطةَ التالية، وأزرارُ الخريطة العائمةُ تختفي أثناءه
   (V17.48) كي لا تحجب موضعَ الضغط — فلم يبقَ زرٌّ يُلغيه، ومن بدأه بالخطأ
   لا يجد منه مخرجًا إلا أن يضع نقطةً لا يريدها. فصار له شريطٌ ظاهرٌ يقول ما
   ينتظره ومعه «إلغاء»، ومفتاحُ الهروب يُلغيه، وضغطةُ الزرِّ نفسِه تُطفئه. */
function pinCancel(){
  if (!PIN_ON) return;
  PIN_ON = false; drawFlag();
  toast(t('أُلغي وضعُ النقطة'));
  render(1);
}
function pinStart(){
  if (PIN_ON){ pinCancel(); return; }
  if (!may('settings') && ROLE !== 'viewer'){ toast(t('إضافةُ النقاط للمكتب')); return; }
  PIN_ON = true; POP_OPEN = false; drawFlag();
  toast(t('اضغط على الخريطة حيث تريد النقطة'));
  render(1);
}

/* ── التحريك: نقرةٌ على الخريطة تنقل النقطة ── */
function moveStart(id){
  MOVE_ID = id;
  POP_OPEN = false;
  toast(t('اضغط على الموقع الجديد على الخريطة'));
  render(1);
}

function markSurvey(id){
  if (!may('approve')){ toast(t('الزيارةُ من «نموذج المسح» — وتسجيلُها مباشرةً للمهندس')); return; }   /* (V28.7) */
  var rec = STATE.recs[id];
  if (rec){
    /* (V28.4) قرارُ المالك: «مفيش أي حاجة تتحذف دلوقتي — المهمُّ الشبابُ في الميدان يسجّلوا الزيارات وتتسجّل فعلًا». لا حذفَ لزيارة. */
    toast(t(recIsQuick(rec) ? 'الزيارةُ مسجّلة — حذفُ الزيارات موقوفٌ الآن؛ للتصحيح افتح «تعديل المسح»' : 'هذه زيارةٌ بنموذج مسحٍ كامل — لا تُلغى من هنا؛ للتصحيح افتح «تعديل المسح»'));
    return;   /* (V31.4) كان بعده حذفُ الزيارة وحدثُها — كودٌ ميتٌ منذ إيقاف الحذف (V28.4) */
  } else {
    CORE.set('recs', id, {
      id:id, by:STATE.meta.name || '', at:Date.now(), quick:1
    });
    logEvent('تمت الزيارة بقرار المهندس — ' + id, id);
    toast(t('سُجّلت الزيارة — بقرار المهندس'));
  }
  statBump(); render(1);
  if (MAP) mapPaint();
}

function markInstall(id, status){
  var s = siteFind(id);
  var cur = STATE.inss[id] || { id:id, parts:{}, serials:{}, pts:0, approved:false };
  if (cur.status === status){
    /* (V28.3) الضغطُ على الحالة المضاءة كان يحذف سجلَّ التركيب كلَّه (قطعه وسيريالاته واعتماده) بلا تأكيد */
    var heavy = cur.approved || Object.keys(cur.parts || {}).length || Object.keys(cur.serials || {}).length || (cur.photos && cur.photos.length) || cur.sol || cur.solution;
    toast(t(heavy ? 'لهذا التركيب قطعٌ أو سيريالاتٌ أو اعتماد — لا يُلغى من هنا؛ للتصحيح افتح «تعديل التركيب»' : 'الحالةُ مسجّلة — حذفُ التركيبات موقوفٌ الآن؛ اختر الحالةَ الصحيحة بدلها'));   /* (V28.4) لا حذف */
    return;   /* (V31.4) كان بعده حذفُ التركيب وإرجاعُ الحالة — كودٌ ميتٌ منذ إيقاف الحذف (V28.4) */
  } else {
    cur.status = status;
    cur.by = STATE.meta.name || '';
    cur.at = Date.now();
    CORE.set('inss', id, cur);
    if (s && status === 'مُركّب' && cur.approved) s.fstat = 'مُركّب';
    logEvent('حالةُ التركيب «' + status + '» — ' + id, id);
    toast(t(status));
  }
  statBump(); render(1);
  if (MAP) mapPaint();
}

