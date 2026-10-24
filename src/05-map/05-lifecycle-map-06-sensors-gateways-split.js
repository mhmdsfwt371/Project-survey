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
var IOT_ST = ['مخطط', 'مُركّب', 'معطّل'];
var IOT_N = 12;
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


function iotDevHtml(id, kind, i){   /* نافذةُ الجهاز */
  var c = iotOf(id); if (!c) return ''; var x = siteFind(id), nm0 = x ? (x.name || id) : id, m = kind === 's' ? (c.sm[i] || {}) : (c.gm[i] || {});
  var did = kind === 's' ? iotSid(id, c, i) : iotGid(id, c, i), ttl = kind === 's' ? t('حساس حرارة ورطوبة') : t('جيت واي'), out = kind === 's' && iotOutside(id, c).indexOf(i) > -1;
  var row = function(k, v){ return v ? '<div><span class="hint" style="margin:0">' + esc(t(k)) + ':</span> ' + esc(v) + '</div>' : ''; };
  var cov = kind !== 's' ? '<div class="hint" style="margin:0">' + esc(t('يغطي')) + ' ' + nm(c.sensors.length) + ' ' + esc(t('حساسًا، أبعدها')) + ' ' + nm(iotMax(c.gw, c.sensors, c.gws)) + ' ' + esc(t('م')) + '</div>' : '';
  return '<b>' + esc(ttl) + '</b> <span class="num">' + esc(did) + '</span><br><span class="hint">' + esc(nm0) + '</span>'
    + row('الغرفة', m.room) + row('السيريال', m.serial) + row('الحالة', m.status || 'مخطط') + row('ملاحظة', m.note) + cov
    + (out ? '<div style="color:#E05252">\u26A0 ' + esc(t('خارج حدود المخيم')) + '</div>' : '')
    + (mayIot() ? '<div style="margin-top:6px">' + btn('\u270E ' + t('عدّل'), 'btn-quiet btn-sm', ' data-iotdev="' + esc(id) + '|' + kind + '|' + i + '"') + '</div>' : '');
}
function iotPaint(){
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
  var push = function(camp, kind, i, q, m, bad, sel){
    F.push({ type:'Feature', properties:{ camp:camp, kind:kind, i:i, did:(m && m.id) || '', color:iotColor(kind, m, bad, sel), h:kind === 's' ? 1.8 : 4, sel:sel ? 1 : 0 },
             geometry:{ type:'Polygon', coordinates:iotSq(q, kind === 's' ? 0.7 : 1.1) } });
  };
  if (E){
    var R0 = iotRing(E.id);
    E.sensors.forEach(function(q, i){ push(E.id, 's', i, q, E.sm[i], R0 && !polyIn(q, R0), E.sel && E.sel.k === 's' && E.sel.i === i); });
    [E.gw].concat(E.gws).forEach(function(g, j){ push(E.id, 'g', j, g, E.gm[j], false, E.sel && E.sel.k === 'g' && E.sel.i === j); });
    return F;
  }
  if (!IOT.on || !M3 || !M3.getBounds) return F;
  var b, z; try { b = M3.getBounds(); z = M3.getZoom(); } catch (e){ LS_ERR = e; return F; }
  if (z < IOT.Z - 1) return F;
  var inB = function(q){ return b.contains([+q[1], +q[0]]); };
  iotCampIds().forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw || !c.sensors) return; var G = iotAllGw(c);
    if (!G.some(inB) && !c.sensors.some(inB)) return;
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
  try { new maplibregl.Popup({ closeButton:true, maxWidth:'280px' }).setLngLat(ev.lngLat).setHTML('<div class="iot-pop" dir="auto">' + html + '</div>').addTo(M3); } catch (e){ LS_ERR = e; }
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
  var form = m ? '<div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:6px 0">' + (E.sel.k === 's' ? fld('iotRoom', 'الغرفة', m.room) : '') + fld('iotSerial', 'السيريال', m.serial)
      + '<label style="display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:110px">' + esc(t('الحالة')) + '<select id="iotStatus" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">' + IOT_ST.map(function(s){ return '<option' + ((m.status || 'مخطط') === s ? ' selected' : '') + ' value="' + esc(s) + '">' + esc(t(s)) + '</option>'; }).join('') + '</select></label>'
      + fld('iotNote', 'ملاحظة', m.note) + btn('\u2713 ' + t('حفظ البيانات'), 'btn-secondary btn-sm', ' data-iotmeta="1"') + '</div>' : '';
  var out = iotRing(E.id) ? E.sensors.filter(function(q){ return !polyIn(q, iotRing(E.id)); }).length : 0;
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حساسات')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(E.sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + nm(1 + E.gws.length) + ' ' + esc(t('جيت واي')) + ' \u00b7 ' + esc(t('أبعدها')) + ' ' + nm(maxM) + ' ' + esc(t('م')) + (maxM > 150 ? ' \u26a0' : '') + (out ? ' \u00b7 <span style="color:#E05252">' + nm(out) + ' ' + esc(t('خارج الحدود')) + '</span>' : '') + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + (E.add ? esc(t('اضغط على الخريطة حيث يُوضَع الحساسُ الجديد')) : E.addGw ? esc(t('اضغط على الخريطة حيث يُوضَع الجيت واي الجديد')) : esc(t('المحدَّد')) + ': ' + esc(sel) + (E.sel ? ' \u2014 ' + esc(t('اضغط على مكانه الجديد')) : '')) + '</p>'
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


var BED = null, BED_L = null;
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
    if (BED_L && BED_L._map !== MAP) BED_L = null;
    if (BED_L) BED_L.clearLayers(); else BED_L = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (!BED) return;
  var P = BED.pts, poly = null;
  if (P.length >= 3) poly = L.polygon(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, fillOpacity:0.18, dashArray:'6 4', interactive:false }).addTo(BED_L);
  else if (P.length === 2) poly = L.polyline(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, dashArray:'6 4', interactive:false }).addTo(BED_L);
  P.forEach(function(q, i){
    var mk = L.marker(q, { draggable:true, zIndexOffset:1000, icon:L.divIcon({ className:'bed-v' + (BED.sel === i ? ' on' : ''), iconSize:[30, 30] }) });
    mk.on('dragstart', function(){ bedSnap(); });
    mk.on('drag', function(e){ var ll = e.target.getLatLng(); BED.pts[i] = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; if (poly) poly.setLatLngs(BED.pts); });
    mk.on('dragend', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.on('click', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.addTo(BED_L);
  });
  if (BED.draw || P.length < 3) return;   /* وضعُ الرسم: الزوايا وحدَها حتى «تمّ الرسم» */
  for (var k = 0; k < P.length; k++){
    (function(k){
      var a = P[k], b = P[(k + 1) % P.length], mid = [+((a[0] + b[0]) / 2).toFixed(6), +((a[1] + b[1]) / 2).toFixed(6)];
      L.marker(mid, { icon:L.divIcon({ className:'bed-m', iconSize:[18, 18] }) })
        .on('click', function(){ bedSnap(); BED.pts.splice(k + 1, 0, mid); BED.sel = k + 1; bedPaint(); render(1); })
        .addTo(BED_L);
    })(k);
  }
  /* مقبضُ الوسط: يُسحَب فينتقل الشكلُ كلُّه كما هو */
  var cy = P.reduce(function(a, q){ return a + q[0]; }, 0) / P.length, cx = P.reduce(function(a, q){ return a + q[1]; }, 0) / P.length, start = null, base = null;
  L.marker([cy, cx], { draggable:true, zIndexOffset:1100, icon:L.divIcon({ className:'bed-c', html:'\u2725', iconSize:[34, 34] }) })
    .on('dragstart', function(e){ bedSnap(); start = e.target.getLatLng(); base = BED.pts.map(function(q){ return [q[0], q[1]]; }); })
    .on('drag', function(e){ if (!start) return; var ll = e.target.getLatLng(), dy = ll.lat - start.lat, dx = ll.lng - start.lng; BED.pts = base.map(function(q){ return [+(q[0] + dy).toFixed(6), +(q[1] + dx).toFixed(6)]; }); if (poly) poly.setLatLngs(BED.pts); })
    .on('dragend', function(){ start = null; bedPaint(); render(1); })
    .addTo(BED_L);
}


/* ═══ (V37.67) «✂ قسّم المخيم» — قرارُ المالك: «مرونة: أعدّل حدود المخيم أو أقسم مخيمًا كبيرًا لثلاثة، وأيُّ زيادةٍ أو نقصٍ يتغيّر في التقرير»
   للمخيمات وحدَها وللمهندس فما فوق. يُقسَم المضلّعُ أجزاءً متساويةَ المساحة على محوره الأطول (معاينةٌ على الخريطة قبل الحفظ)، ثم تُضبَط حدودُ كلِّ جزءٍ بـ«عدّل الحدود».
   الجزءُ الأوّلُ يبقى برقم المخيم وبياناته ومسحه، والأجزاءُ الجديدةُ برقمه + B وC… («لم تُزر» تحتاج مسحًا) بالمشعر والشركة والمربع نفسها والاسمِ والشاخصِ + (٢)، (٣).
   والأجزاءُ نقاطٌ معتمدةٌ من المهندس، فتدخل كلَّ العدّاداتِ والتقاريرِ والإكسل تلقائيًّا — لا عدَّ يدويًّا. */
var SPLIT = null;   


var SPLIT_COL = ['#4FA3FF', '#FF8C42', '#3AD6A0', '#E64980', '#F5C400', '#9B51E0'];
function splitPaint(){ if (!SPLIT || !MAP_TMP) return; SPLIT.parts.forEach(function(pp, i){ L.polygon(pp, { renderer:MAP_CV, color:SPLIT_COL[i % 6], weight:2.5, dashArray:'6 4', fillColor:SPLIT_COL[i % 6], fillOpacity:0.3, interactive:false }).addTo(MAP_TMP); }); }
function splitPanelHtml(){ if (!SPLIT) return ''; var x = siteFind(SPLIT.id) || {};
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0"><b>\u2702 ' + esc(t('قسّم المخيم')) + ' \u2014 ' + esc(x.name || SPLIT.id) + '</b><span class="hint">' + nm(SPLIT.parts.length) + ' ' + esc(t('أجزاء')) + '</span></div>'
    + '<div class="chips" style="margin:8px 0">' + [2, 3, 4, 5, 6].map(function(k){ return '<button type="button" class="chip' + (SPLIT.n === k ? ' on' : '') + '" data-splitn="' + k + '">' + nm(k) + '</button>'; }).join('') + '</div>'
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
