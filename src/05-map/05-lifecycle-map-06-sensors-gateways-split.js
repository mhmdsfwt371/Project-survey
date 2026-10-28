/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-06-sensors-gateways-split.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Sensors and gateways as first-class points, and splitting a camp.
   DEFINES : iotOf, iotCampIds, iotPad, iotSid, iotGid, iotAllGw, iotM, iotMax, iotRing, iotOutside, iotDevHtml, iotPaint … (+15 more)
   GLOBALS : IOT_ST, IOT_N, BED, SPLIT, SPLIT_COL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V37.70) الحساسُ والجيت واي «زي باقي النقاط» — قرارُ المالك: رقمٌ خاصٌّ وبياناتٌ (الغرفة، السيريال، الحالة، ملاحظة)، ونافذةٌ لكلِّ جهاز،
   وتحريكٌ وإضافةٌ وحذفٌ للحساسات والجيت واي (أكثرُ من جيت واي للمخيم الكبير)، وخطّةٌ تُولَّد للمخيم الجديد أو الجزء المقسوم (١٢ حساسًا داخل حدوده)،
   وما خرج عن الحدود بعد تعديلها يُعلَّم بالأحمر ويُوزَّع من جديد، وإكسلٌ للحساسات. وتبقى خارجَ أرقام الوزارة بعدّادها الخاص (قرارُ V25.7).
   البنيةُ متوافقةٌ مع القديم: gw وsensors إحداثياتٌ كما كانت، ومعها gws (جيت واي إضافي) وsm/gm (بياناتُ الأجهزة بالترتيب نفسِه). */
PV.IOT_ST = ['مخطط', 'مُركّب', 'معطّل'];
PV.IOT_N = 12;
function iotOf(id){
  var ov = STATE.siteOv && STATE.siteOv[id] && STATE.siteOv[id].iot;
  var c = (ov && ov.gw && Array.isArray(ov.sensors)) ? ov : (IOT.data && IOT.data.camps ? IOT.data.camps[id] : null);
  if (!c) return null;
  var gws = Array.isArray(c.gws) ? c.gws : [], sm = Array.isArray(c.sm) ? c.sm : [], gm = Array.isArray(c.gm) ? c.gm : [];
  return { gw:c.gw, gws:gws, sensors:c.sensors, sm:sm, gm:gm, maxM:c.maxM, at:c.at, by:c.by, ov:!!ov };
}
function iotCampIds(){   /* المخيماتُ ذاتُ الخطّة: الطبقةُ المبدئيةُ وما عُدِّل أو وُلِّد */
  var ids = {}; if (IOT.data && IOT.data.camps) Object.keys(IOT.data.camps).forEach(function(k){ ids[k] = 1; });
  Object.keys(STATE.siteOv || {}).forEach(function(k){ var o = STATE.siteOv[k]; if (o && o.iot && o.iot.gw) ids[k] = 1; });
  return Object.keys(ids);
}
function iotPad(n){ return (n < 10 ? '0' : '') + n; }
function iotSid(id, c, i){ var m = (c.sm || [])[i]; return (m && m.id) || (id + '-S' + iotPad(i + 1)); }
function iotGid(id, c, j){ var m = (c.gm || [])[j]; return (m && m.id) || (id + '-GW' + (j + 1)); }
function iotAllGw(c){ return [c.gw].concat(c.gws || []); }
function iotM(a, b){ var r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(a[0] * r), y = (b[0] - a[0]) * r; return 6371000 * Math.sqrt(x * x + y * y); }
function iotMax(gw, S, gws){ var G = [gw].concat(gws || []), m = 0; S.forEach(function(q){ var d = Infinity; G.forEach(function(g){ d = Math.min(d, iotM(g, q)); }); m = Math.max(m, d); }); return Math.round(m); }   /* أبعدُ حساسٍ عن أقرب جيت واي */
function iotRing(id){ var x = siteFind(id), F = x && typeof campFoot === 'function' ? campFoot(x) : null; return F ? F.map(function(p){ return [p[1], p[0]]; }) : null; }   /* [[lat,lng]…] */
function iotOutside(id, c){ var R = iotRing(id); if (!R || !c) return []; var out = []; c.sensors.forEach(function(q, i){ if (!polyIn(q, R)) out.push(i); }); return out; }


/* ═══ (V39.47) القراءاتُ الحيّة من أفاقي برو — iotlive/_all يكتبه جسرُ السحابة كلَّ ١٠ دقائق ═══
   الربطُ بالسيريال المسجَّل للحساس أو الجيت واي في خطة المخيم. تُقرأ الوثيقةُ عند الحاجة (طبقةُ الحساسات أو بطاقةُ جهاز)
   مرةً كلَّ ١٠ دقائق على الأكثر — لا مستمعَ دائم. */
function liveIotLoad(force){   /* the state lives on IOT (no new global): IOT.live = {at, v, busy} */
  var L = IOT.live || (IOT.live = { at:0, v:null, busy:false });
  if (L.busy || (!force && Date.now() - L.at < 600000) || typeof DB === 'undefined' || !DB || !DB.col) return;
  L.busy = true; L.at = Date.now();
  try { DB.col('iotlive').doc('_all').get().then(function(doc){ L.busy = false; L.v = (doc && doc.exists) ? doc.data() : null; STATE.iotLive = (L.v && L.v.camps) || null;   /* V39.20's liveSensor reads it */ }, function(){ L.busy = false; }); }
  catch (e){ L.busy = false; }
}
function liveIotOf(serial){ var L = IOT.live, u = L && L.v && L.v.units, k = String(serial || '').trim().toLowerCase(); return (u && k && u[k]) || null; }
function liveIotLine(serial){
  var x = liveIotOf(serial); if (!x) return '';
  var age = x.t ? Date.now() - x.t : Infinity, col = age < 1200000 ? '#3FB27F' : age < 7200000 ? '#E0A100' : '#E05252';
  var v = x.v || {}, parts = [];
  if (v.temp != null) parts.push(nm(v.temp) + '\u00B0'); if (v.hum != null) parts.push(nm(v.hum) + '\u066A'); if (v.bat != null && v.ext_bat == null && v.int_bat == null) parts.push('\u{1F50B} ' + nm(v.bat));
  if (v.ext_bat != null) parts.push('\u{1F50C} ' + t('خارجية') + ' ' + nm(v.ext_bat)); if (v.int_bat != null) parts.push('\u{1F50B} ' + t('داخلية') + ' ' + nm(v.int_bat));   /* (V40.4) a gateway's two batteries */
  return '<div style="margin-top:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + col + '"></span> <b>' + esc(t('القراءة الحية')) + ':</b> '
    + (parts.length ? esc(parts.join(' \u00B7 ')) : esc(t('لا قيم'))) + ' <span class="hint" style="margin:0">' + esc(age === Infinity ? t('بلا وقت') : age < 7200000 ? t('منذ') + ' ' + nm(Math.max(1, Math.round(age / 60000))) + ' ' + t('د') : t('غير متصل')) + '</span></div>';
}
/* (V39.51) owner: «الحساس تظهر قيمته لما أهوفر بالماوس عليه — حرارة ورطوبة». One block for every place a sensor is
   described (the 3D hover, the models' hover, its card): temperature and humidity always have their place — the values from
   the AFAQY PRO bridge (by the sensor's serial, else by its id), with their age and a freshness dot; and when there is no
   reading yet the place says why (no serial to bind it, or the bridge has not brought a reading) — never an invented number. */
function iotValHtml(camp, i){
  var c = iotOf(camp); if (!c) return '';
  var m = (c.sm || [])[i] || {}, did = iotSid(camp, c, i), x = liveIotOf(m.serial), v = null, at = 0;
  if (x){ v = x.v || {}; at = +x.t || 0; }
  else if (typeof liveSensor === 'function'){ var ls = liveSensor(camp, did); if (ls){ v = (ls.v && typeof ls.v === 'object') ? ls.v : { temp:ls.v }; at = +ls.at || 0; } }
  liveIotLoad();   /* the first hover brings the snapshot (at most every ten minutes) */
  var big = function(ic, val, unit){ return '<span style="display:inline-flex;align-items:baseline;gap:3px;margin-inline-end:12px"><span>' + ic + '</span><b class="num" style="font-size:16px">' + (val != null && val !== '' ? esc(nm(+val)) + unit : '\u2014') + '</b></span>'; };
  var vals = '<div style="margin:5px 0 2px" dir="rtl">' + big('\u{1F321}', v && v.temp, '\u00B0') + big('\u{1F4A7}', v && v.hum, '\u066A') + '</div>';
  if (v){
    var age = at ? Date.now() - at : Infinity, col = age < 1200000 ? '#3FB27F' : age < 7200000 ? '#E0A100' : '#E05252';
    return vals + '<div class="hint" style="margin:0"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + col + '"></span> '
      + esc(age === Infinity ? t('بلا وقت') : age < 7200000 ? t('منذ') + ' ' + nm(Math.max(1, Math.round(age / 60000))) + ' ' + t('د') : t('غير متصل')) + (v.bat != null ? ' \u00b7 \u{1F50B} ' + esc(nm(+v.bat)) : '') + '</div>';
  }
  return vals + '<div class="hint" style="margin:0">' + esc(m.serial ? t('لا قراءة بعد — بانتظار الجسر') : t('سجّل سيريال الحساس ليُربط بأفاقي برو')) + '</div>';
}
function iotDevHtml(id, kind, i){   /* نافذةُ الجهاز */
  var c = iotOf(id); if (!c) return ''; var x = siteFind(id), nm0 = x ? (x.name || id) : id, m = kind === 's' ? (c.sm[i] || {}) : (c.gm[i] || {});
  var did = kind === 's' ? iotSid(id, c, i) : iotGid(id, c, i), ttl = kind === 's' ? t('حساس حرارة ورطوبة') : t('جيت واي'), out = kind === 's' && iotOutside(id, c).indexOf(i) > -1;
  var row = function(k, v){ return v ? '<div><span class="hint" style="margin:0">' + esc(t(k)) + ':</span> ' + esc(v) + '</div>' : ''; };
  var cov = kind !== 's' ? '<div class="hint" style="margin:0">' + esc(t('يغطي')) + ' ' + nm(c.sensors.length) + ' ' + esc(t('حساسًا، أبعدها')) + ' ' + nm(iotMax(c.gw, c.sensors, c.gws)) + ' ' + esc(t('م')) + '</div>' : '';
  return '<b>' + esc(ttl) + '</b> <span class="num">' + esc(did) + '</span><br><span class="hint">' + esc(nm0) + '</span>'
    + row('الطراز', m.model) + row('العلامة على الجهاز', m.tag) + row('الغرفة', m.room) + row('السيريال', m.serial) + row('الحالة', m.status || 'مخطط') + row('ملاحظة', m.note) + cov
    + (kind === 's' ? iotValHtml(id, i) : liveIotLine(m.serial))   /* (V39.51) temperature and humidity on the card */
    + (out ? '<div style="color:#E05252">\u26A0 ' + esc(t('خارج حدود المخيم')) + '</div>' : '')
    + (mayIot() ? '<div style="margin-top:6px">' + btn('\u270E ' + t('عدّل'), 'btn-quiet btn-sm', ' data-iotdev="' + esc(id) + '|' + kind + '|' + i + '"')
        + (typeof mvdStart === 'function' ? btn('\u2725 ' + t('حرّك'), 'btn-quiet btn-sm', ' data-mvd="' + esc(id) + '" data-mvdk="' + (kind === 's' ? 's' : 'g') + i + '"') : '') + '</div>' : '');
}
/* (V39.67) owner: «دي نقاط محطات الإركاب — في المخيم ممكن يكون أكتر من محطة؛ اعملها شكل مختلف وطبقة جديدة زي الحساسات».
   505 points (layers/boarding-1448.json, from the owner's KMZ). A layer of its own, off by default, an amber triangle on
   the flat map and an amber dot in 3D; it decides nothing about a camp's type. */
function brdSt(){ return brdSt.S || (brdSt.S = { on:false, data:null, loading:null, layer:null }); }
function brdLoad(){
  var B = brdSt(); if (B.data || B.loading) return B.loading || Promise.resolve(true);
  B.loading = fetch('layers/boarding-1448.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
    B.data = j && Array.isArray(j.pts) ? j.pts : []; B.loading = null; brdPaint(); if (CUR === 'map') render(1); return true;
  }).catch(function(e){ B.loading = null; softErr('محطات الإركاب', e, 'تعذّر جلبُ محطات الإركاب'); return false; });
  return B.loading;
}
function brdCount(){ var B = brdSt(); return B.data ? B.data.length : 0; }
function brdPaint(){
  var B = brdSt();
  try { if (typeof MAP_3D !== 'undefined' && MAP_3D && M3 && M3.getSource){ var s3 = M3.getSource('nskbst'); if (s3) s3.setData({ type:'FeatureCollection', features:B.on && B.data ? B.data.map(function(q){ return { type:'Feature', geometry:{ type:'Point', coordinates:[q[1], q[0]] }, properties:{} }; }) : [] }); } } catch (e3){ LS_ERR = e3; }
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try { if (B.layer && B.layer._map !== MAP) B.layer = null; if (B.layer) B.layer.clearLayers(); else B.layer = L.layerGroup().addTo(MAP); } catch (e){ LS_ERR = e; return; }
  if (!B.on || !B.data) return;
  B.data.forEach(function(q){
    shapeMk(q, { renderer:MAP_CV, radius:7, color:'#3B2A05', weight:1.2, fillColor:'#F59E0B', fillOpacity:.95, bubblingMouseEvents:false }, 'triangle')
      .bindTooltip('\u{1F68F} ' + esc(t('محطة إركاب')), { direction:'top' }).addTo(B.layer);
  });
}
function iotPaint(){
  try { brdPaint(); } catch (eB){ LS_ERR = eB; }   /* (V39.67) */
  if (IOT.on) liveIotLoad();   /* (V39.47) the live readings, at most every 10 minutes */
  try { if (typeof m3IotPaint === 'function') m3IotPaint(); } catch (e3){ LS_ERR = e3; }   /* (V39.11) the 3D twin follows */
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (IOT.layer && IOT.layer._map !== MAP) IOT.layer = null;
    if (IOT.layer) IOT.layer.clearLayers(); else IOT.layer = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (IOT.edit){   /* (V25.8) مخيمُ التعديل وحدَه — نقرٌ على الشكل يحدِّده */
    var E = IOT.edit, R0 = iotRing(E.id);
    E.sensors.forEach(function(q, i){
      var on = E.sel && E.sel.k === 's' && E.sel.i === i, bad = R0 && !polyIn(q, R0);
      shapeMk(q, { renderer:MAP_CV, radius:on ? 8 : 6, color:on ? '#E05252' : (bad ? '#E05252' : '#fff'), weight:on ? 3 : (bad ? 2.4 : 1.2), fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop')
        .on('click', function(){ E.sel = { k:'s', i:i }; E.add = false; E.addGw = false; iotPaint(); render(1); }).addTo(IOT.layer);
    });
    [E.gw].concat(E.gws).forEach(function(g, j){
      var ong = E.sel && E.sel.k === 'g' && E.sel.i === j;
      shapeMk(g, { renderer:MAP_CV, radius:ong ? 11 : 9, color:ong ? '#E05252' : '#fff', weight:ong ? 3 : 1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star')
        .on('click', function(){ E.sel = { k:'g', i:j }; E.add = false; E.addGw = false; iotPaint(); render(1); }).addTo(IOT.layer);
    });
    return;
  }
  if (!IOT.on || MAP.getZoom() < IOT.Z) return;
  var b = MAP.getBounds().pad(0.1);
  iotCampIds().forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw || !c.sensors) return; var G = iotAllGw(c);
    if (!G.some(function(g){ return b.contains(g); }) && !c.sensors.some(function(q){ return b.contains(q); })) return;
    var out = iotOutside(id, c);
    c.sensors.forEach(function(q, i){ var bad = out.indexOf(i) > -1;
      shapeMk(q, { renderer:MAP_CV, radius:5, color:bad ? '#E05252' : '#fff', weight:bad ? 2.4 : 1.2, fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop').bindPopup(iotDevHtml(id, 's', i)).addTo(IOT.layer); });
    G.forEach(function(g, j){ shapeMk(g, { renderer:MAP_CV, radius:8, color:'#fff', weight:1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star').bindPopup(iotDevHtml(id, 'g', j)).addTo(IOT.layer); });
  });
}

/* (V39.11) owner: «الخريطة الـ3D محتاجها تكون digital twin، وطبقة الحساسات والجيت واي في الفلتر فوق، وأقدر أمسح وأشيل وأحرك
   وأعدل وأضيف بيانات». The sensors and gateways stand in the 3D map as small columns in their camps — teal sensors, orange
   gateways, red when faulty or outside the camp's boundary, lighter while only planned, and a red top while selected in the
   editor — with the same taps as the flat map: a tap opens the device's card, and in the editor a tap selects it and the
   next tap on the ground moves it (or adds one). Every device keeps its id, room, serial, status and note. */
function iotSq(q, half){
  var lat = +q[0], lng = +q[1], dy = half / 111320, dx = half / (111320 * Math.cos(lat * Math.PI / 180));
  return [[[lng - dx, lat - dy], [lng + dx, lat - dy], [lng + dx, lat + dy], [lng - dx, lat + dy], [lng - dx, lat - dy]]];
}
function iotColor(kind, m, bad, sel){
  if (sel) return '#E05252';
  if (bad || (m && m.status === 'معطّل')) return '#E05252';
  var base = kind === 's' ? IOT_C.sensor : IOT_C.gw;
  return (m && m.status === 'مُركّب') ? base : (kind === 's' ? '#8FE3DB' : '#F8CF8F');   /* planned: lighter */
}
function m3IotFeatures(){
  var F = [], E = IOT.edit;
  /* (V39.17) each device twice: a polygon for the column (drawn from zoom 15) and a point for the dot at every zoom —
     and every camp with a plan whatever the view: the owner wants them always there, never lost on a zoom */
  /* (V39.21) owner: «مش كل الحساسات بتظهر»: inside a tent the column and the dot were behind the tent's walls. Each
     device now also carries a beacon above the roof line (a small block from 4.8 m) in its colour, so it is seen
     from outside the camp wherever it stands; the gateway's column rises above the roofs as well. */
  var push = function(camp, kind, i, q, m, bad, sel){
    var P = { camp:camp, kind:kind, i:i, did:(m && m.id) || '', color:iotColor(kind, m, bad, sel), h:kind === 's' ? 1.8 : 6, sel:sel ? 1 : 0 };
    if (kind === 'g' && i === 0 && typeof dtwGwAtGate === 'function' && dtwGwAtGate(camp)){ F.push({ type:'Feature', properties:P, geometry:{ type:'Point', coordinates:[+q[1], +q[0]] } }); return; }   /* (V39.50) the camp's gateway stands with the entrance devices */
    if (kind === 'g'){   /* (V39.48) owner: «خلّي أشكالها متناسبة وواقعية» — the gateway is a cabinet on its pole with an antenna, its status colour on the antenna's tip */
      var rect = function(w, d, x, y){ var lat = +q[0], lng = +q[1], mLat = 1 / 111320, mLng = 1 / (111320 * Math.cos(lat * Math.PI / 180)), cx = lng + x * mLng, cy = lat + y * mLat, hw = w / 2 * mLng, hd = d / 2 * mLat;
        return [[[cx - hw, cy - hd], [cx + hw, cy - hd], [cx + hw, cy + hd], [cx - hw, cy + hd], [cx - hw, cy - hd]]]; };
      F.push({ type:'Feature', properties:Object.assign({}, P, { part:'pole', color:'#55606B', base:0, h:2.1 }), geometry:{ type:'Polygon', coordinates:rect(.1, .1, 0, 0) } });
      F.push({ type:'Feature', properties:Object.assign({}, P, { part:'cabinet', color:'#DADFE3', base:1.5, h:2.1 }), geometry:{ type:'Polygon', coordinates:rect(.5, .3, 0, 0) } });
      F.push({ type:'Feature', properties:Object.assign({}, P, { part:'antenna', color:'#1B1F23', base:2.1, h:3.1 }), geometry:{ type:'Polygon', coordinates:rect(.05, .05, .17, 0) } });
      F.push({ type:'Feature', properties:Object.assign({}, P, { part:'tip', base:3.1, h:3.4 }), geometry:{ type:'Polygon', coordinates:rect(.18, .18, .17, 0) } });
      F.push({ type:'Feature', properties:Object.assign({}, P, { beacon:1, base:4.8, h:5.3 }), geometry:{ type:'Polygon', coordinates:iotSq(q, 0.25) } });   /* still findable above the roofs */
    } else {
    F.push({ type:'Feature', properties:P, geometry:{ type:'Polygon', coordinates:iotSq(q, 0.7) } });
    /* (V39.32) owner: «الزوم أوي مش مبيّن الحساسات» — the beacon was 0.9 m: a speck at zoom 19. Now 1.6 m for a sensor,
       a metre and more above the roofs, on a thin stem from the sensor so it reads as «this sensor, here» */
    F.push({ type:'Feature', properties:Object.assign({}, P, { beacon:1, base:4.8, h:6 }), geometry:{ type:'Polygon', coordinates:iotSq(q, 0.8) } });
    }
    if (kind === 's') F.push({ type:'Feature', properties:Object.assign({}, P, { stem:1, base:P.h, h:4.8 }), geometry:{ type:'Polygon', coordinates:iotSq(q, 0.12) } });   /* the gateway's own column already rises above the roofs */
    F.push({ type:'Feature', properties:P, geometry:{ type:'Point', coordinates:[+q[1], +q[0]] } });
  };
  if (E){
    var R0 = iotRing(E.id);
    E.sensors.forEach(function(q, i){ push(E.id, 's', i, q, E.sm[i], R0 && !polyIn(q, R0), E.sel && E.sel.k === 's' && E.sel.i === i); });
    [E.gw].concat(E.gws).forEach(function(g, j){ push(E.id, 'g', j, g, E.gm[j], false, E.sel && E.sel.k === 'g' && E.sel.i === j); });
    return F;
  }
  if (!IOT.on) return F;
  iotCampIds().forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw || !c.sensors) return; var G = iotAllGw(c);
    var out = iotOutside(id, c);
    c.sensors.forEach(function(q, i){ push(id, 's', i, q, (c.sm || [])[i], out.indexOf(i) > -1, false); });
    G.forEach(function(g, j){ push(id, 'g', j, g, (c.gm || [])[j], false, false); });
  });
  return F;
}
function m3IotPaint(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  try { var s3 = M3.getSource('nskiot'); if (s3) s3.setData({ type:'FeatureCollection', features:m3IotFeatures() }); } catch (e){ LS_ERR = e; }
}
/* a tap on a device in the 3D map: the editor selects it, otherwise its card opens on the map */
function m3IotClick(f, ev){
  var p = f && f.properties; if (!p) return;
  if (ev && ev.originalEvent) ev.originalEvent._nskIot = true;
  var E = IOT.edit;
  if (E && E.id === p.camp){ E.sel = { k:p.kind, i:+p.i }; E.add = false; E.addGw = false; iotPaint(); render(1); return; }
  var html = iotDevHtml(p.camp, p.kind, +p.i); if (!html || !window.maplibregl) return;
  m3PopOpen(ev.lngLat, html, '280px');   /* (V39.33) one popup, a real X, a tap outside closes it */
}
function iotNextId(E, pre){ var used = {}; (pre === 'S' ? E.sm : E.gm).forEach(function(m){ used[m.id] = 1; }); var n = 1; while (used[E.id + '-' + pre + (pre === 'S' ? iotPad(n) : n)]) n++; return E.id + '-' + pre + (pre === 'S' ? iotPad(n) : n); }
function iotMapClick(ll){
  var E = IOT.edit; if (!E) return;
  var p = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)];
  if (E.add){ E.sensors.push(p); E.sm.push({ id:iotNextId(E, 'S'), status:'مخطط' }); E.add = false; E.sel = { k:'s', i:E.sensors.length - 1 }; }
  else if (E.addGw){ E.gws.push(p); E.gm.push({ id:iotNextId(E, 'GW'), status:'مخطط' }); E.addGw = false; E.sel = { k:'g', i:E.gws.length }; }
  else if (E.sel){ if (E.sel.k === 'g'){ if (E.sel.i === 0) E.gw = p; else E.gws[E.sel.i - 1] = p; } else E.sensors[E.sel.i] = p; }
  else { toast(t('اختر حساسًا أو الجيت واي أوّلًا')); return; }
  iotPaint(); render(1);
}


function iotPanelHtml(){
  var E = IOT.edit; if (!E) return '';
  var x = siteFind(E.id), nm0 = x ? (x.name || E.id) : E.id, maxM = iotMax(E.gw, E.sensors, E.gws);
  var m = E.sel ? (E.sel.k === 's' ? E.sm[E.sel.i] : E.gm[E.sel.i]) : null;
  var sel = !E.sel ? t('لا شيءَ محدَّد') : (E.sel.k === 'g' ? t('جيت واي') : t('حساس')) + ' ' + ((m && m.id) || '');
  var fld = function(idx, lab, val){ return '<label style="display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:120px;flex:1">' + esc(t(lab)) + '<input id="' + idx + '" value="' + esc(val || '') + '" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)"></label>'; };
  var form = m ? '<div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:6px 0">' + (E.sel.k === 's' ? fld('iotRoom', 'الغرفة', m.room) : '') + fld('iotSerial', 'السيريال', m.serial) + fld('iotModel', 'الطراز', m.model).replace('<input ', '<input list="iotModels" ') + fld('iotTag', 'العلامة على الجهاز', m.tag) + '<datalist id="iotModels"><option value="EM300"><option value="EM320"><option value="UG65"><option value="UG67"></datalist>'   /* (V39.22) */
      + '<label style="display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:110px">' + esc(t('الحالة')) + '<select id="iotStatus" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">' + PV.IOT_ST.map(function(s){ return '<option' + ((m.status || 'مخطط') === s ? ' selected' : '') + ' value="' + esc(s) + '">' + esc(t(s)) + '</option>'; }).join('') + '</select></label>'
      + fld('iotNote', 'ملاحظة', m.note) + btn('\u2713 ' + t('حفظ البيانات'), 'btn-secondary btn-sm', ' data-iotmeta="1"') + '</div>' : '';
  var out = iotRing(E.id) ? E.sensors.filter(function(q){ return !polyIn(q, iotRing(E.id)); }).length : 0;
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حساسات')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(E.sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + nm(1 + E.gws.length) + ' ' + esc(t('جيت واي')) + ' \u00b7 ' + esc(t('أبعدها')) + ' ' + nm(maxM) + ' ' + esc(t('م')) + (maxM > 150 ? ' \u26a0' : '') + (out ? ' \u00b7 <span style="color:#E05252">' + nm(out) + ' ' + esc(t('خارج الحدود')) + '</span>' : '') + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + (E.add ? esc(t('اضغط على الخريطة حيث يُوضَع الحساسُ الجديد')) : E.addGw ? esc(t('اضغط على الخريطة حيث يُوضَع الجيت واي الجديد')) : esc(t('المحدَّد')) + ': ' + esc(sel) + (E.sel ? ' \u2014 ' + esc(t('اضغط على مكانه الجديد')) : '')) + '</p>'
    + (typeof iotFieldBanner === 'function' ? iotFieldBanner(E) : '')   /* (V39.22) the real positions from the field */
    + form
    + '<div class="actions">'
    + btn((E.add ? '\u2716 ' : '+ ') + t('أضف حساسًا'), 'btn-quiet btn-sm', ' data-iotadd="1"')
    + btn((E.addGw ? '\u2716 ' : '+ ') + t('أضف جيت واي'), 'btn-quiet btn-sm', ' data-iotaddgw="1"')
    + (E.sel ? btn('\u{1F5D1} ' + t('احذف المحدد'), 'btn-quiet btn-sm', ' data-iotdel="1"') : '')
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-iotsave="1"')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-iotcancel="1"')
    + '</div></div>';
}
function iotCount(){ var g = 0, s = 0; iotCampIds().forEach(function(id){ var c = iotOf(id); if (c){ g += 1 + (c.gws || []).length; s += c.sensors.length; } }); return { g:g, s:s }; }


var BED = null; PV.BED_L = null;
function bedArea(P){
  if (!P || P.length < 3) return 0;
  var r = Math.PI / 180, kx = 111320 * Math.cos(P[0][0] * r), ky = 110540, a = 0;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][1] * kx) * (P[i][0] * ky) - (P[i][1] * kx) * (P[j][0] * ky);
  return Math.abs(a / 2);
}

function bedSnap(){ if (BED){ BED.hist = BED.hist || []; BED.hist.push(BED.pts.map(function(q){ return [q[0], q[1]]; })); if (BED.hist.length > 60) BED.hist.shift(); } }   /* (V37.17) سجلُّ التراجع */
function bedPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (PV.BED_L && PV.BED_L._map !== MAP) PV.BED_L = null;
    if (PV.BED_L) PV.BED_L.clearLayers(); else PV.BED_L = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (!BED) return;
  var P = BED.pts, poly = null;
  if (P.length >= 3) poly = L.polygon(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, fillOpacity:0.18, dashArray:'6 4', interactive:false }).addTo(PV.BED_L);
  else if (P.length === 2) poly = L.polyline(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, dashArray:'6 4', interactive:false }).addTo(PV.BED_L);
  P.forEach(function(q, i){
    var mk = L.marker(q, { draggable:true, zIndexOffset:1000, icon:L.divIcon({ className:'bed-v' + (BED.sel === i ? ' on' : ''), iconSize:[30, 30] }) });
    mk.on('dragstart', function(){ bedSnap(); });
    mk.on('drag', function(e){ var ll = e.target.getLatLng(); BED.pts[i] = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; if (poly) poly.setLatLngs(BED.pts); });
    mk.on('dragend', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.on('click', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.addTo(PV.BED_L);
  });
  if (BED.draw || P.length < 3) return;   /* وضعُ الرسم: الزوايا وحدَها حتى «تمّ الرسم» */
  for (var k = 0; k < P.length; k++){
    (function(k){
      var a = P[k], b = P[(k + 1) % P.length], mid = [+((a[0] + b[0]) / 2).toFixed(6), +((a[1] + b[1]) / 2).toFixed(6)];
      L.marker(mid, { icon:L.divIcon({ className:'bed-m', iconSize:[18, 18] }) })
        .on('click', function(){ bedSnap(); BED.pts.splice(k + 1, 0, mid); BED.sel = k + 1; bedPaint(); render(1); })
        .addTo(PV.BED_L);
    })(k);
  }
  /* مقبضُ الوسط: يُسحَب فينتقل الشكلُ كلُّه كما هو */
  var cy = P.reduce(function(a, q){ return a + q[0]; }, 0) / P.length, cx = P.reduce(function(a, q){ return a + q[1]; }, 0) / P.length, start = null, base = null;
  L.marker([cy, cx], { draggable:true, zIndexOffset:1100, icon:L.divIcon({ className:'bed-c', html:'\u2725', iconSize:[34, 34] }) })
    .on('dragstart', function(e){ bedSnap(); start = e.target.getLatLng(); base = BED.pts.map(function(q){ return [q[0], q[1]]; }); })
    .on('drag', function(e){ if (!start) return; var ll = e.target.getLatLng(), dy = ll.lat - start.lat, dx = ll.lng - start.lng; BED.pts = base.map(function(q){ return [+(q[0] + dy).toFixed(6), +(q[1] + dx).toFixed(6)]; }); if (poly) poly.setLatLngs(BED.pts); })
    .on('dragend', function(){ start = null; bedPaint(); render(1); })
    .addTo(PV.BED_L);
}


/* ═══ (V37.67) «✂ قسّم المخيم» — قرارُ المالك: «مرونة: أعدّل حدود المخيم أو أقسم مخيمًا كبيرًا لثلاثة، وأيُّ زيادةٍ أو نقصٍ يتغيّر في التقرير»
   للمخيمات وحدَها وللمهندس فما فوق. يُقسَم المضلّعُ أجزاءً متساويةَ المساحة على محوره الأطول (معاينةٌ على الخريطة قبل الحفظ)، ثم تُضبَط حدودُ كلِّ جزءٍ بـ«عدّل الحدود».
   الجزءُ الأوّلُ يبقى برقم المخيم وبياناته ومسحه، والأجزاءُ الجديدةُ برقمه + B وC… («لم تُزر» تحتاج مسحًا) بالمشعر والشركة والمربع نفسها والاسمِ والشاخصِ + (٢)، (٣).
   والأجزاءُ نقاطٌ معتمدةٌ من المهندس، فتدخل كلَّ العدّاداتِ والتقاريرِ والإكسل تلقائيًّا — لا عدَّ يدويًّا. */
PV.SPLIT = null;   


PV.SPLIT_COL = ['#4FA3FF', '#FF8C42', '#3AD6A0', '#E64980', '#F5C400', '#9B51E0'];
function splitPaint(){ if (!PV.SPLIT || !MAP_TMP) return; PV.SPLIT.parts.forEach(function(pp, i){ L.polygon(pp, { renderer:MAP_CV, color:PV.SPLIT_COL[i % 6], weight:2.5, dashArray:'6 4', fillColor:PV.SPLIT_COL[i % 6], fillOpacity:0.3, interactive:false }).addTo(MAP_TMP); }); }
function splitPanelHtml(){ if (!PV.SPLIT) return ''; var x = siteFind(PV.SPLIT.id) || {};
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0"><b>\u2702 ' + esc(t('قسّم المخيم')) + ' \u2014 ' + esc(x.name || PV.SPLIT.id) + '</b><span class="hint">' + nm(PV.SPLIT.parts.length) + ' ' + esc(t('أجزاء')) + '</span></div>'
    + '<div class="chips" style="margin:8px 0">' + [2, 3, 4, 5, 6].map(function(k){ return '<button type="button" class="chip' + (PV.SPLIT.n === k ? ' on' : '') + '" data-splitn="' + k + '">' + nm(k) + '</button>'; }).join('') + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('أجزاءٌ متساويةُ المساحة على طول المخيم — الأوّلُ يبقى برقمه ومسحه، والباقي مخيماتٌ جديدةٌ تحتاج مسحًا. بعد الحفظ اضبط حدودَ كلِّ جزءٍ بـ«عدّل الحدود».')) + '</p>'
    + '<div class="actions">' + btn('\u2713 ' + t('احفظ التقسيم'), 'btn-primary btn-sm', ' data-splitsave="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-splitcancel="1"') + '</div></div>';
}


function bedPanelHtml(){
  if (!BED) return '';
  var x = siteFind(BED.id), nm0 = x ? (x.name || BED.id) : BED.id, H = (BED.hist || []).length;
  var undo = H ? btn('\u21B6 ' + t('تراجع'), 'btn-quiet btn-sm', ' data-bedundo="1"') : '';
  if (BED.draw) return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('رسم حدود')) + ' \u2014 ' + esc(nm0) + '</b><span class="hint">' + nm(BED.pts.length) + ' ' + esc(t('زاوية')) + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t('اضغط على الخريطة عند كلِّ زاويةٍ بالترتيب حول المخيم — تُسحَب الزاويةُ لتصحيحها.')) + '</p>'
    + '<div class="actions">' + (BED.pts.length >= 3 ? btn('\u2713 ' + t('تمّ الرسم'), 'btn-primary btn-sm', ' data-beddone="1"') : '') + undo
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-bedcancel="1"') + '</div></div>';
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حدود')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(BED.pts.length) + ' ' + esc(t('زاوية')) + ' \u00b7 ' + nm(Math.round(bedArea(BED.pts))) + ' ' + esc(t('م²')) + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t(BED.sel >= 0 ? 'الزاويةُ المحدَّدة بالأحمر — اسحبها أو احذفها' : 'اسحب الزاوية لنقلها، والنقطةَ الصغيرة بين زاويتين لإضافة زاوية، والعلامةَ في الوسط لنقل الشكل كلِّه')) + '</p>'
    + '<div class="actions">'
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-bedsave="1"') + undo
    + (BED.sel >= 0 && BED.pts.length > 3 ? btn('\u{1F5D1} ' + t('احذف الزاوية'), 'btn-quiet btn-sm', ' data-beddel="1"') : '')
    + btn('\u270F ' + t('ارسم من جديد'), 'btn-quiet btn-sm', ' data-bedredraw="1"')
    + (BED.orig && BED.drawn ? btn('\u21BA ' + t('رجوع للحدود الأصلية'), 'btn-quiet btn-sm', ' data-bedreset="1"') : '')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-bedcancel="1"')
    + '</div></div>';
}
/* صنفُ «القمر» على الإطار يتبع ما يُعرَض فعلًا: القمرُ لا يُقلَب في الوضع الداكن، وخريطةُ الجهاز تُقلَب ولو كان القمرُ مختارًا */
