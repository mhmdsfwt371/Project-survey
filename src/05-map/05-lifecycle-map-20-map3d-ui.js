/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-20-map3d-ui.js
   DOMAIN  : Map — the 3D map's controls, laid out for monitoring
   PURPOSE : (V39.28) owner: «الخريطة الـ3D مش حلوة وفيها حاجات كتير مخلياها صعبة — فكّر كمهندس GIS: نضيف وسهل المراقبة
             والمتابعة». The 3D view had inherited every 2D control — four or five rows of chips, the drawing and new-point
             buttons, the legend open — and they covered half the map on a phone. A monitoring map is map-first: one row
             on top (search, the three modes, «الطبقات», the filter, back to 2D); every optional layer in one sheet,
             grouped the way a GIS reads them — base, operations, analysis; on the side only «موقعي» and «الشمال»
             (north up, standard tilt); the legend folded until asked. Drawing and new points stay in 2D, where they work.
   DEFINES : m3uiState, m3uiOn, m3uiTop, m3uiSheet, m3uiFab, m3uiLegendBtn, m3uiViewList, m3uiViews, m3uiViewGo, m3uiViewSave
   PREFIX  : m3ui   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : m3uiState() — the sheet, the folded legend, the terrain switch — on the function, no new global.
   ============================================================================ */

function m3uiState(){ return m3uiState.s || (m3uiState.s = { sheet:false, views:false, lg:false, terrain:true }); }

/* how many optional layers are on — the number on «الطبقات» */
function m3uiOn(){
  var n = 0;
  if (IOT.on) n++; if (heatPaint.on) n++; if (covPaint.on) n++; if (timeState().on) n++; if (liveState().on) n++;
  if (typeof tentOn !== 'function' || tentOn()) n++; if (typeof dtwPaint !== 'function' || dtwPaint.on !== false) n++;
  if (typeof phPinOn !== 'function' || phPinOn()) n++; if (CO_MODE) n++;
  return n;
}
/* the one row on top */
function m3uiTop(mq){
  /* (V39.30) owner's screenshot: «أوّل ما بقلب الخريطة ٣د كلُّ حاجة بتضرب في ديزاين الزراير». The modes sat in the
     companies' chip-pair (made for two halves: the first loses its end radius), the row did not wrap and hid «الفك»,
     the filter and «٢د» off the screen. Now: the three modes are one segmented control, search and views are icons, and
     the row wraps like the 2D one (V17.41: nothing off-screen on a phone) — two short lines at most. */
  var S = m3uiState();
  return '<div class="m3-seg" role="group" aria-label="' + esc(t('الطبقة')) + '">' + Object.keys(LAYERS).map(function(k){
      return '<button type="button" class="m3-segb' + (FIELD_MODE === k ? ' on' : '') + '" data-mode="' + k + '" aria-pressed="' + (FIELD_MODE === k) + '">' + LAYERS[k].i + ' ' + esc(t(LAYERS[k].n)) + '</button>';
    }).join('') + '</div>'
    + '<button type="button" class="map-chip' + (S.sheet ? ' on' : '') + '" data-m3ui="' + (S.sheet ? 'close' : 'sheet') + '">\u{1F5C2} ' + esc(t('الطبقات')) + (m3uiOn() ? ' \u00b7 ' + nm(m3uiOn()) : '') + '</button>'
    + '<button type="button" class="map-chip' + (filtOn() ? ' on' : '') + '" data-mfilt="' + (MAP_FILT_OPEN ? '0' : '1') + '">\u2261 ' + esc(t('تصفية')) + (filtOn() ? ' \u00b7 ' + nm(layerFiltered().length) : '') + '</button>'
    + '<button type="button" class="map-chip m3-ic' + (mq.open ? ' on' : '') + '" data-mapq="' + (mq.open ? '0' : '1') + '" aria-label="' + esc(t('بحث')) + '" title="' + esc(t('بحث')) + '">\u{1F50D}</button>'
    + '<button type="button" class="map-chip m3-ic' + (S.views ? ' on' : '') + '" data-m3ui="' + (S.views ? 'close' : 'views') + '" aria-label="' + esc(t('المناظر')) + '" title="' + esc(t('المناظر')) + '">\u{1F4CD}</button>'
    + (MY_ONLY || isCrewRole(ROLE) ? '<button type="button" class="map-chip on" data-myonly="0">\u25C9 ' + esc(t('مهامي')) + '</button>' : '')
    + '<button type="button" class="map-chip" data-m3="1" title="' + esc(t('العودة إلى الخريطة المسطّحة')) + '">\u25A6 ' + esc(t('٢د')) + '</button>';
}
/* every optional layer in one sheet, in the order a GIS reads them */
function m3uiSheet(){
  var S = m3uiState(); if (!S.sheet) return '';
  var tg = function(on, attr, ic, lab, extra){ return '<button type="button" class="cat' + (on ? ' on' : '') + '" ' + attr + '>' + ic + ' ' + esc(t(lab)) + (extra || '') + '</button>'; };
  var sec = function(title, body){ return '<div style="margin:8px 0 0"><div class="hint" style="margin:0 0 6px;font-weight:700">' + esc(t(title)) + '</div><div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:0">' + body + '</div></div>'; };
  var floors = (FILT.zone === 'كاميرات المتابعة' || (FILT.floor !== '' && FILT.floor != null))
    ? sec('أدوار منشأة الجمرات', [['', 'كل الأدوار'], ['0', 'الأرضي'], ['1', 'الأول'], ['2', 'الثاني'], ['3', 'الثالث'], ['4', 'الرابع']].map(function(f){
        var on = String(FILT.floor) === f[0] && !(f[0] === '' && FILT.floor !== ''); return tg(on, 'data-ffl="' + f[0] + '"', '\u{1F3E2}', f[1]); }).join('')) : '';
  return '<div class="map-sheet">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b>\u{1F5C2} ' + esc(t('طبقات الخريطة')) + '</b>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-m3ui="close" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + sec('الأساس', tg(MAP_SAT, 'data-sat="1"', '\u{1F6F0}', 'قمر صناعي') + tg(S.terrain, 'data-m3terrain="1"', '\u26F0', 'التضاريس'))
    + sec('التشغيل', tg(IOT.on, 'data-iot="1"', '\u{1F4E1}', 'الحساسات', IOT.on ? ' \u00b7 ' + nm(iotCount().s) : '')
        + tg(typeof dtwPaint !== 'function' || dtwPaint.on !== false, 'data-twin="1"', '\u{1F9E9}', 'الأجهزة')
        + tg(typeof tentOn !== 'function' || tentOn(), 'data-tent="1"', '\u26FA', 'الخيام')
        + tg(typeof phPinOn !== 'function' || phPinOn(), 'data-phpin="1"', '\u{1F5BC}', 'الصور')
        + tg(CO_MODE, 'data-comode="' + (CO_MODE ? '0' : '1') + '"', '\u25C9', 'الشركات', CO_SEL.length ? ' \u00b7 ' + nm(CO_SEL.length) : '')
        + (CO_MODE ? tg(CO_OPEN, 'data-co="1"', '\u25BE', 'اختر الشركات') : ''))
    + sec('التحليل', tg(heatPaint.on, 'data-heat="1"', '\u{1F3AF}', heatLabel()) + tg(covPaint.on, 'data-cov="1"', '\u{1F4F6}', 'التغطية')
        + tg(timeState().on, 'data-time="1"', '\u23F3', 'الزمن') + tg(liveState().on, 'data-live="1"', '\u{1F493}', 'الحي'))
    + (typeof m3ovState === 'function' ? sec('العرض', tg(m3ovState().agg, 'data-m3agg="1"', '\u25CE', 'تجميع من بعيد') + tg(m3ovState().lab, 'data-m3lab="1"', '\u{1F3F7}', 'أرقام الشواخص')) : '')   /* (V39.29) */
    + floors
    + '<p class="hint" style="margin:10px 0 0">' + esc(t('الخيام والأجهزة والنماذج تظهر حين تقترب — من بعيد ترى المخيمات بلون حالتها فقط')) + '</p>'
    + '</div>';
}
/* on the side: where am I, and north up */
function m3uiFab(){
  return '<div class="map-fab">' + btn('\u{1F9ED} ' + t('الشمال'), 'btn-light btn-sm', ' data-m3reset="1"') + btn('\u25CE ' + t('موقعي'), 'btn-light btn-sm', ' data-locate="1"') + '</div>';
}
function m3uiLegendBtn(){
  var S = m3uiState();
  return '<button type="button" class="map-chip lg-toggle" data-m3lg="' + (S.lg ? '0' : '1') + '">' + (S.lg ? '\u25BE ' + esc(t('إخفاء الحالات')) : '\u25B4 ' + esc(t('الحالات'))) + '</button>'
    + (S.lg ? '<div class="map-legend">' + legendRows() + '</div>' : '');
}

/* (V39.29) the views: each zone of the Holy Sites framed from its own points, and the views the user saved on this device */
function m3uiViewList(){ try { return JSON.parse(localStorage.getItem('nsk.m3views') || '[]') || []; } catch (e){ LS_ERR = e; return []; } }
function m3uiViews(){
  var S = m3uiState(); if (!S.views) return '';
  var Z = [['منى', 'منى'], ['عرفات', 'عرفات'], ['المزدلفة', 'المزدلفة'], ['كاميرات المتابعة', 'منشأة الجمرات'], ['مراكز التفويج', 'مراكز التفويج']];
  var V = m3uiViewList();
  return '<div class="map-sheet">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b>\u{1F4CD} ' + esc(t('المناظر')) + '</b>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-m3ui="close" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:8px 0 0">' + Z.map(function(z){ return '<button type="button" class="cat" data-m3view="z:' + esc(z[0]) + '">' + esc(t(z[1])) + '</button>'; }).join('') + '</div>'
    + (V.length ? '<div class="hint" style="margin:10px 0 6px;font-weight:700">' + esc(t('مناظري')) + '</div><div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:0">'
        + V.map(function(v, i){ return '<span class="chip-pair"><button type="button" class="cat" data-m3view="s:' + i + '">' + esc(v.n) + '</button><button type="button" class="cat" data-m3viewdel="' + i + '" aria-label="' + esc(t('حذف')) + '">\u2715</button></span>'; }).join('') + '</div>' : '')
    + '<div class="actions" style="margin-top:10px">' + btn('\u2795 ' + t('احفظ المنظر الحالي'), 'btn-secondary btn-sm', ' data-m3viewsave="1"') + '</div></div>';
}
function m3uiViewGo(key){
  if (!M3) return false;
  try {
    if (key.indexOf('s:') === 0){ var v = m3uiViewList()[+key.slice(2)]; if (!v) return false; M3.flyTo({ center:v.c, zoom:v.z, pitch:v.p, bearing:v.b, duration:1200 }); return true; }
    var g = key.slice(2), s = 90, w = 180, n = -90, e = -180, k = 0;
    (STATE.sites || []).forEach(function(x){ if (!(+x.lat && +x.lng) || (typeof taxOf === 'function' ? taxOf(x).g : x.zone) !== g) return; k++;
      if (+x.lat < s) s = +x.lat; if (+x.lat > n) n = +x.lat; if (+x.lng < w) w = +x.lng; if (+x.lng > e) e = +x.lng; });
    if (!k) return false;
    M3.fitBounds([[w, s], [e, n]], { padding:60, pitch:50, bearing:0, duration:1200, maxZoom:17 }); return true;
  } catch (e2){ LS_ERR = e2; return false; }
}
function m3uiViewSave(name){
  if (!M3 || !name) return false;
  var V = m3uiViewList(), c = M3.getCenter();
  V.push({ n:String(name).slice(0, 40), c:[+c.lng.toFixed(6), +c.lat.toFixed(6)], z:+M3.getZoom().toFixed(2), p:Math.round(M3.getPitch()), b:Math.round(M3.getBearing()) });
  try { localStorage.setItem('nsk.m3views', JSON.stringify(V.slice(-12))); } catch (e){ LS_ERR = e; return false; }
  return true;
}