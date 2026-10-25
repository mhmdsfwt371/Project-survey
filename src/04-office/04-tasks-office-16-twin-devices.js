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
   DEFINES : dtwKinds, dtwOf, dtwUnits, dtwSpot, dtwIp, dtwIpText, dtwChipsPaint, dtwFeatures, dtwLayers, dtwPaint, dtwCardHtml, dtwClick
   PREFIX  : dtw   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : dtwPaint.on (the layer switch, on by default) — on the function, no new global.
   ============================================================================ */

/* kind of an item code → colour and height (metres) of its column; anything unknown is a short grey column */
function dtwKinds(code){
  var c = String(code || '');
  if (/^rdr/.test(c)) return { k:'reader',  color:'#7C4DFF', h:2.6 };
  if (c === 'gw') return { k:'gateway', color:'#DADFE3', h:2.1 };   /* (V39.50) the camp's gateway in the entrance box */
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


/* (V39.48) a rectangle w × d metres centred (x, y) metres east/north of p — the device's parts stand on real proportions */
function dtwRect(p, w, d, x, y){
  var lat = +p[0], lng = +p[1], mLat = 1 / 111320, mLng = 1 / (111320 * Math.cos(lat * Math.PI / 180));
  var cx = lng + (x || 0) * mLng, cy = lat + (y || 0) * mLat, hw = w / 2 * mLng, hd = d / 2 * mLat;
  return [[[cx - hw, cy - hd], [cx + hw, cy - hd], [cx + hw, cy + hd], [cx - hw, cy + hd], [cx - hw, cy - hd]]];
}
/* the parts of each kind: {p:part, w,d: footprint m, x,y: offset m, b: base m, t: top m, c: colour}. Real sizes of the field's
   gear — a reader panel on a 3 m pole, a camera housing with its lens on a 3.8 m pole, a router's small box with two whips,
   a gateway cabinet with its antenna, an RFID panel antenna, a solar panel on its post, a battery box on the ground.
   A reader whose colour is its live pulse keeps that colour on its panel. */
function dtwParts(K, p){
  var POLE = '#55606B', WHITE = '#EEF1F3', DARK = '#1B1F23', live = K.live ? K.color : WHITE;
  switch (K.k){
    case 'reader':  return [{ p:'pole', w:.12, d:.12, b:0, t:2.9, c:POLE }, { p:'panel', w:.5, d:.3, b:2.3, t:2.85, c:live }];
    case 'camera':  return [{ p:'pole', w:.12, d:.12, b:0, t:3.8, c:POLE }, { p:'head', w:.28, d:.52, b:3.5, t:3.8, c:WHITE }, { p:'lens', w:.14, d:.14, x:0, y:-.3, b:3.56, t:3.72, c:DARK }];
    case 'router':  return [{ p:'box', w:.34, d:.24, b:1.15, t:1.42, c:'#2B2F36' }, { p:'whip', w:.04, d:.04, x:-.1, b:1.42, t:1.74, c:DARK }, { p:'whip', w:.04, d:.04, x:.1, b:1.42, t:1.74, c:DARK }];
    case 'gateway': return [{ p:'cabinet', w:.46, d:.26, b:1.5, t:2.1, c:'#DADFE3' }, { p:'antenna', w:.05, d:.05, x:.16, b:2.1, t:2.85, c:DARK }];
    case 'antenna': return [{ p:'pole', w:.1, d:.1, b:0, t:2.7, c:POLE }, { p:'panel', w:.44, d:.08, b:2.2, t:2.7, c:WHITE }];
    case 'solar':   return [{ p:'post', w:.1, d:.1, b:0, t:2.6, c:POLE }, { p:'panel', w:1.1, d:.62, b:2.6, t:2.66, c:'#1F3A5F' }];
    case 'battery': return [{ p:'box', w:.45, d:.28, b:0, t:.35, c:'#5B4636' }];
    case 'box':     return [{ p:'cabinet', w:.6, d:.4, b:0, t:1.2, c:'#4A4A4A' }];
    case 'cable':   return [{ p:'reel', w:.3, d:.3, b:0, t:.3, c:'#6D7F8E' }];
    default:        return [{ p:'unit', w:.4, d:.4, b:0, t:.8, c:K.color }];
  }
}
/* (V39.50) owner: «أنا عاوز كاميرا، قارئ، جيت واي، راوتر فقط … بعيد عن بعض شوية … واضحين مهما عملت زوم».
   The entrance shows only those four kinds; they stand in a row 2.4 m apart at the camp's street entrance (or the point),
   unless dragged; the camp's gateway joins them when the field has placed the entrance (it lives in the same box). */
function dtwShow(k){ return k === 'reader' || k === 'camera' || k === 'router' || k === 'gateway'; }
function dtwUnits(x){
  var D = dtwOf(x.id).filter(function(dv){ return dtwShow(dtwKinds(dv.code).k); });
  var c = typeof iotOf === 'function' ? iotOf(x.id) : null, g0 = typeof iotFieldGate === 'function' ? iotFieldGate(x.id) : null;
  if (c && g0) D.push({ code:'gw', i:0, n:1, serial:((c.gm || [])[0] || {}).serial || '', gw:1 });
  return D;
}
function dtwSpot(x, dv, j, n){
  var r0 = (STATE.inss || {})[x.id], pp = r0 && r0.pos && r0.pos[dv.code + '#' + dv.i];
  if (pp) return [+pp[0], +pp[1]];
  var g0 = typeof iotFieldGate === 'function' ? iotFieldGate(x.id) : null, o = g0 ? [+g0[0], +g0[1]] : [+x.lat, +x.lng];
  var off = (j - (n - 1) / 2) * 2.4;   /* metres east of the entrance, centred */
  return [o[0], o[1] + off / (111320 * Math.cos(o[0] * Math.PI / 180))];
}
function dtwGwAtGate(camp){ return !!(typeof iotFieldGate === 'function' && iotFieldGate(camp) && (STATE.sites || []).some(function(x){ return x.id === camp; })); }
/* each device's address: what the point records (site edit form / IP plan), else the network's convention (.1 router, .2
   reader, .3 camera) marked as derived; the gateway has no convention — recorded or «not recorded» */
function dtwIp(x, kind, i){
  if (!x) return { ip:'', how:'' };
  var f = { router:'ipRtr', reader:'ipRdr', camera:'ipCam', gateway:'ipGw' }[kind], v = f && (+i || 0) === 0 ? String(x[f] || '').trim() : '';
  if (v) return { ip:v, how:'' };
  var base = typeof siteNetBase === 'function' ? siteNetBase(x) : '', suf = { router:'.1', reader:'.2', camera:'.3' }[kind];
  return base && suf && (+i || 0) === 0 ? { ip:base + suf, how:'derived' } : { ip:'', how:'none' };
}
function dtwIpText(x, kind, i){ var q = dtwIp(x, kind, i); return q.ip ? 'IP ' + q.ip + (q.how === 'derived' ? ' (' + t('مشتق من الشبكة') + ')' : '') : 'IP \u2014 ' + t('لم يُسجَّل'); }

function dtwFeatures(){
  var F = [];
  if (!MAP_3D || !M3 || !M3.getBounds || !(dtwPaint.on !== false)) return F;
  var b, z; try { b = M3.getBounds(); z = M3.getZoom(); } catch (e){ LS_ERR = e; return F; }
  if (z < 18) return F;   /* the parts are tens of centimetres — the chips carry them below this */
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat && +x.lng) || !b.contains([+x.lng, +x.lat])) return;
    var D = dtwUnits(x); if (!D.length) return;
    D.forEach(function(dv, j){
      var K = dtwKinds(dv.code), p = dtwSpot(x, dv, j, D.length);
      if (K.k === 'reader' && liveState().on) K = { k:K.k, h:K.h, color:liveColorOf(x), live:true };   /* (V39.20) the reader beats with its pulse */
      if (K.k === 'gateway'){ var gm = ((iotOf(x.id) || {}).gm || [])[0] || {}; K = { k:'gateway', h:K.h, color:iotColor('g', gm, false, false), live:true }; }
      var base = typeof m3Base === 'function' ? m3Base(x) : 0;   /* (V39.15) a device on a floor stands on that floor */
      dtwParts(K, p).forEach(function(q){
        F.push({ type:'Feature', properties:{ site:x.id, code:dv.code, i:dv.i, serial:dv.serial, kind:K.k, color:q.c, h:base + q.t, base:base + q.b, part:q.p },
                 geometry:{ type:'Polygon', coordinates:dtwRect(p, q.w, q.d, q.x, q.y) } });
      });
    });
  });
  return F;
}

/* (V39.50) the chips: one small row of the four at each entrance, a fixed size on screen — seen at every zoom from 16,
   each with its own hover (name, IP, serial) and its own tap (that device's card only, nothing under it) */
function dtwChipsPaint(){
  var S = dtwChipsPaint, old = S.mk || []; old.forEach(function(m){ try { m.remove(); } catch (e){ LS_ERR = e; } }); S.mk = [];
  if (!MAP_3D || !M3 || !M3.getBounds || !window.maplibregl || dtwPaint.on === false) return;
  var b, z, c0; try { b = M3.getBounds(); z = M3.getZoom(); c0 = M3.getCenter(); } catch (e){ LS_ERR = e; return; }
  if (z < 16) return;
  var ICON = { camera:'\u{1F4F7}', reader:'\u{1F4E1}', gateway:'\u{1F4F6}', router:'\u{1F310}' };
  var list = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng && b.contains([+x.lng, +x.lat]); }).map(function(x){ return { x:x, D:dtwUnits(x) }; })
    .filter(function(o){ return o.D.length; }).sort(function(a, q){ return Math.hypot(a.x.lat - c0.lat, a.x.lng - c0.lng) - Math.hypot(q.x.lat - c0.lat, q.x.lng - c0.lng); }).slice(0, 40);
  list.forEach(function(o){
    var x = o.x, g0 = typeof iotFieldGate === 'function' ? iotFieldGate(x.id) : null, at = g0 ? [+g0[1], +g0[0]] : [+x.lng, +x.lat];
    var el = document.createElement('div'); el.className = 'dtw-chips'; el.setAttribute('dir', 'ltr');
    el.style.cssText = 'display:flex;gap:4px;padding:2px;transform:translateY(-6px);pointer-events:auto';
    o.D.forEach(function(dv){
      var k = dtwKinds(dv.code).k, sp = document.createElement('span');
      sp.textContent = ICON[k] || '\u25A0'; sp.setAttribute('role', 'button'); sp.setAttribute('tabindex', '0'); sp.setAttribute('aria-label', t(itemName(dv.code)) + ' \u00b7 ' + dtwIpText(x, k, dv.i));
      sp.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:rgba(15,23,42,.88);border:1px solid rgba(255,255,255,.35);font-size:14px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)';
      var props = { site:x.id, code:dv.code, i:dv.i, serial:dv.serial, kind:k };
      sp.addEventListener('mouseenter', function(){ m3Hover({ lngLat:{ lng:at[0], lat:at[1] } }, m3HoverHtml('nsk-twin', props)); });
      sp.addEventListener('mouseleave', function(){ m3Hover(null); });
      var open = function(ev){ ev.stopPropagation(); ev.preventDefault(); m3Hover(null); m3PopOpen({ lng:at[0], lat:at[1] }, dtwCardHtml(props), '280px'); };
      sp.addEventListener('click', open); sp.addEventListener('keydown', function(ev){ if (ev.key === 'Enter' || ev.key === ' ') open(ev); });
      el.appendChild(sp);
    });
    ['mousedown', 'pointerdown', 'touchstart', 'dblclick'].forEach(function(n){ el.addEventListener(n, function(ev){ ev.stopPropagation(); }, { passive:true }); });
    try { S.mk.push(new maplibregl.Marker({ element:el, anchor:'bottom' }).setLngLat(at).addTo(M3)); } catch (e){ LS_ERR = e; }
  });
}

/* the source and the layer — added once with the other 3D layers */
function dtwLayers(){
  if (!M3 || M3.getSource('nsktwin')) return;
  M3.addSource('nsktwin', { type:'geojson', data:{ type:'FeatureCollection', features:dtwFeatures() } });
  M3.addLayer({ id:'nsk-twin', type:'fill-extrusion', source:'nsktwin',
    paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':['coalesce', ['get','base'], 0], 'fill-extrusion-opacity':0.95 } });
  /* (V39.50) the tap is decided by m3ClickPick in the map file — the device only, nothing under it */
  M3.on('mouseenter', 'nsk-twin', function(){ M3.getCanvas().style.cursor = 'pointer'; });
  M3.on('mouseleave', 'nsk-twin', function(){ M3.getCanvas().style.cursor = ''; });
}
function dtwPaint(){
  try { dtwChipsPaint(); } catch (eC){ LS_ERR = eC; }   /* (V39.50) */
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
    + '<div class="num" dir="ltr" style="margin:2px 0">' + esc(dtwIpText(x, p.kind || dtwKinds(p.code).k, p.i)) + '</div>'   /* (V39.50) its own address */
    + row('السيريال', p.serial) + (p.code === 'gw' ? row('الحالة', ((((typeof iotOf === 'function' ? iotOf(p.site) : null) || {}).gm || [])[0] || {}).status || 'مخطط') : row('الحالة', r.status) + row('ركّبه', r.by) + (r.at ? row('بتاريخ', fmtDate(r.at)) : ''))
    + (liveState().on && p.kind === 'reader' && x ? '<div>' + esc(liveTextOf(x)) + '</div>' : '')   /* (V39.20) the reader's pulse on its card */
    + '<div class="actions" style="margin-top:6px">' + btn('\u{1F4C4} ' + t('صفحة النقطة'), 'btn-quiet btn-sm', ' data-site="' + esc(p.site) + '"')
    + (typeof insqMay === 'function' && insqMay(p.site) ? btn('\u270E ' + t('تعديل التركيب'), 'btn-quiet btn-sm', ' data-insq="' + esc(p.site) + '"') : '')
    + (may('edit') && typeof mvdStart === 'function' ? btn('\u2725 ' + t('حرّك'), 'btn-quiet btn-sm', ' data-mvd="' + esc(p.site) + '" data-mvdk="' + esc(p.code + '#' + (+p.i || 0)) + '"') : '') + '</div>';   /* (V39.35) move this unit alone */
}
function dtwClick(f, ev){
  var p = f && f.properties; if (!p || !window.maplibregl) return;
  if (ev && ev.originalEvent) ev.originalEvent._nskIot = true;   /* the ground and the point under it do not take this tap */
  m3PopOpen(ev.lngLat, dtwCardHtml(p), '280px');   /* (V39.33) one popup, a real X, a tap outside closes it */
}
