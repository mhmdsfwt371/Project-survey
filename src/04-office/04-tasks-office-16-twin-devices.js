/* ============================================================================
   FILE    : src/04-office/04-tasks-office-16-twin-devices.js
   DOMAIN  : Office chunk — the 3D map's digital twin, part two: the devices of every installed point
   PURPOSE : (V39.13) owner: «الخريطة المجسّمة محتاجها تكون digital twin». The sensors and gateways stand in the 3D map
             since V39.11; this file puts the point's own devices there: every part of an installation record
             (reader, cameras, router, antenna, solar panel, battery, boxes, cables) is a small column beside its
             point, coloured by its kind, with the serial the field wrote. A tap opens the device's card; «تعديل
             التركيب» from the card edits serials and parts through the existing install-edit sheet, so there is
             one place that writes the installation record. The twin reads STATE.inss and DATA/catalog only —
             it never writes.
   DEFINES : dtwKinds, dtwRing, dtwFeatures, dtwLayers, dtwPaint, dtwClick, dtwCardHtml, dtwOf
   STATE   : dtwPaint.on (the layer switch, on by default) — on the function, no new global.
   ============================================================================ */

/* kind of an item code → colour and height (metres) of its column; anything unknown is a short grey column */
function dtwKinds(code){
  var c = String(code || '');
  if (/^rdr/.test(c)) return { k:'reader',  color:'#7C4DFF', h:2.6 };
  if (/^cam/.test(c)) return { k:'camera',  color:'#2D7DD2', h:3.0 };
  if (/^rtr/.test(c)) return { k:'router',  color:'#F5A623', h:2.0 };
  if (/^ant/.test(c)) return { k:'antenna', color:'#9AA7B2', h:3.4 };
  if (/^sol/.test(c)) return { k:'solar',   color:'#F8E71C', h:1.4 };
  if (/^bat/.test(c)) return { k:'battery', color:'#8B572A', h:1.0 };
  if (/^box/.test(c)) return { k:'box',     color:'#4A4A4A', h:1.2 };
  if (/^c\d|^c\d+c$/.test(c)) return { k:'cable', color:'#6D7F8E', h:0.5 };
  return { k:'other', color:'#7F8C8D', h:0.8 };
}

/* the devices of one point: one entry per unit, in the order of the record's parts; the serial sits on the first unit */
function dtwOf(id){
  var r = STATE.inss && STATE.inss[id]; if (!r || !r.parts) return [];
  var out = [];
  Object.keys(r.parts).forEach(function(code){
    var n = Math.max(0, Math.min(12, Math.round(+r.parts[code] || 0)));
    for (var i = 0; i < n; i++) out.push({ code:code, i:i, n:n, serial:i === 0 ? ((r.serials || {})[code] || '') : '' });
  });
  return out;
}

/* the units stand on a ring around the point, 1.6 m out, evenly spaced — the same spot on every device, every day */
function dtwRing(lat, lng, idx, total){
  var a = (idx / Math.max(1, total)) * Math.PI * 2, R = 1.6;
  var dy = R * Math.cos(a) / 111320, dx = R * Math.sin(a) / (111320 * Math.cos(lat * Math.PI / 180));
  return [lat + dy, lng + dx];
}

function dtwFeatures(){
  var F = [];
  if (!MAP_3D || !M3 || !M3.getBounds || !(dtwPaint.on !== false)) return F;
  var b, z; try { b = M3.getBounds(); z = M3.getZoom(); } catch (e){ LS_ERR = e; return F; }
  if (z < 16) return F;   /* the columns are a metre wide — only when the camp fills the screen */
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat && +x.lng) || !b.contains([+x.lng, +x.lat])) return;
    var D = dtwOf(x.id); if (!D.length) return;
    D.forEach(function(dv, j){
      var K = dtwKinds(dv.code), p = dtwRing(+x.lat, +x.lng, j, D.length);
      if (K.k === 'reader' && liveState().on) K = { k:K.k, h:K.h, color:liveColorOf(x) };   /* (V39.20) the reader column beats with its pulse */
      var base = typeof m3Base === 'function' ? m3Base(x) : 0;   /* (V39.15) a device on a floor stands on that floor */
      F.push({ type:'Feature', properties:{ site:x.id, code:dv.code, i:dv.i, serial:dv.serial, kind:K.k, color:K.color, h:base + K.h, base:base },
               geometry:{ type:'Polygon', coordinates:iotSq(p, 0.5) } });
    });
  });
  return F;
}

/* the source and the layer — added once with the other 3D layers */
function dtwLayers(){
  if (!M3 || M3.getSource('nsktwin')) return;
  M3.addSource('nsktwin', { type:'geojson', data:{ type:'FeatureCollection', features:dtwFeatures() } });
  M3.addLayer({ id:'nsk-twin', type:'fill-extrusion', source:'nsktwin',
    paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':['coalesce', ['get','base'], 0], 'fill-extrusion-opacity':0.95 } });
  M3.on('click', 'nsk-twin', function(ev){ var f = ev.features && ev.features[0]; if (f) dtwClick(f, ev); });
  M3.on('mouseenter', 'nsk-twin', function(){ M3.getCanvas().style.cursor = 'pointer'; });
  M3.on('mouseleave', 'nsk-twin', function(){ M3.getCanvas().style.cursor = ''; });
}
function dtwPaint(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  try { var s = M3.getSource('nsktwin'); if (s) s.setData({ type:'FeatureCollection', features:dtwFeatures() }); } catch (e){ LS_ERR = e; }
}

/* the device's card: what it is, its serial, its point, the installation's status and who installed it */
function dtwCardHtml(p){
  var x = siteFind(p.site), r = (STATE.inss || {})[p.site] || {};
  var row = function(k, v){ return v ? '<div><span class="hint" style="margin:0">' + esc(t(k)) + ':</span> ' + esc(v) + '</div>' : ''; };
  var units = dtwOf(p.site).filter(function(d){ return d.code === p.code; }).length;
  return '<b>' + esc(t(itemName(p.code))) + '</b>' + (units > 1 ? ' <span class="hint" style="margin:0">' + nm(+p.i + 1) + ' / ' + nm(units) + '</span>' : '')
    + '<br><span class="hint">' + esc(x ? (x.name || x.id) : p.site) + '</span>'
    + row('السيريال', p.serial) + row('الحالة', r.status) + row('ركّبه', r.by) + (r.at ? row('بتاريخ', fmtDate(r.at)) : '')
    + (liveState().on && p.kind === 'reader' && x ? '<div>' + esc(liveTextOf(x)) + '</div>' : '')   /* (V39.20) the reader's pulse on its card */
    + '<div class="actions" style="margin-top:6px">' + btn('\u{1F4C4} ' + t('صفحة النقطة'), 'btn-quiet btn-sm', ' data-site="' + esc(p.site) + '"')
    + (typeof insqMay === 'function' && insqMay(p.site) ? btn('\u270E ' + t('تعديل التركيب'), 'btn-quiet btn-sm', ' data-insq="' + esc(p.site) + '"') : '') + '</div>';
}
function dtwClick(f, ev){
  var p = f && f.properties; if (!p || !window.maplibregl) return;
  if (ev && ev.originalEvent) ev.originalEvent._nskIot = true;   /* the ground and the point under it do not take this tap */
  try { new maplibregl.Popup({ closeButton:true, maxWidth:'280px' }).setLngLat(ev.lngLat).setHTML('<div class="iot-pop" dir="auto">' + dtwCardHtml(p) + '</div>').addTo(M3); } catch (e){ LS_ERR = e; }
}
