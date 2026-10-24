/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-21-move-devices.js
   DOMAIN  : Map — move any device by dragging it
   PURPOSE : (V39.31) owner: «عاوز أي نقطة، من أقل نقطة، أقدر أحرّكها: كاميرا وأنتنات وريدر وحساسات وجيت واي وخلافه». A point
             could be moved (⇱ تحريك, a tap on the new place) and a camp's sensors in their editor; the devices of an
             installation had no place of their own — the twin stood them on a ring around the gate. Now «✥ تحريك الأجهزة»
             on a point shows every movable thing of it as a pin you drag, on the flat map and the 3D one alike: the point
             itself, every unit of its installation (reader, cameras, router, antennas, solar panel, battery, boxes…),
             and, for a camp, every sensor and gateway of its plan. Each drop is saved at once on its own record with the
             event log — the point through the same move as «⇱ تحريك», a unit in its installation (inss.pos), a sensor
             or gateway in the camp's plan — and «↶ تراجع» puts the last one back. Rights: the point and the units for
             whoever may edit, the sensors and gateways for whoever may edit the plan.
   DEFINES : mvdState, mvdShown, mvdRing, mvdItems, mvdIcon, mvdStart, mvdStop, mvdPaint, mvdSet, mvdUndo, mvdBarHtml
   PREFIX  : mvd   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : mvdState() — the point being edited, the live pins, the last move — on the function, no new global.
   ============================================================================ */

function mvdState(){ return mvdState.s || (mvdState.s = { id:'', only:'', marks:[], lg:null, last:null }); }
/* (V39.35) owner: «ممكن نعمل هنا حرّك — على أي حساس أو جيت واي» — «✥ حرّك» on a sensor's, gateway's or device's own card shows
   that one pin alone; the bar offers «كل أجهزة النقطة» to see the rest */
function mvdShown(){ var S = mvdState(); var all = S.id ? mvdItems(S.id) : []; return S.only ? all.filter(function(it){ return it.key === S.only; }) : all; }

/* the default place of the installation's units: the twin's ring, 1.6 m around the street gate (or the point) */
function mvdRing(lat, lng, idx, total){
  var a = (idx / Math.max(1, total)) * Math.PI * 2, R = 1.6;
  return [lat + R * Math.cos(a) / 111320, lng + R * Math.sin(a) / (111320 * Math.cos(lat * Math.PI / 180))];
}
/* everything of a point that can be dragged, with where it stands now */
function mvdItems(id){
  var x = siteFind(id), out = []; if (!x || !(+x.lat && +x.lng)) return out;
  if (may('edit')) out.push({ k:'site', key:'site', lab:x.sign || x.id, ic:'\u{1F4CD}', at:[+x.lat, +x.lng] });
  var r = (STATE.inss || {})[id];
  if (r && r.parts && !r.deleted && !r.voided && may('edit')){
    var units = []; Object.keys(r.parts).forEach(function(code){ var n = Math.max(0, Math.min(12, Math.round(+r.parts[code] || 0))); for (var i = 0; i < n; i++) units.push({ code:code, i:i, n:n }); });
    var g0 = (typeof iotFieldGate === 'function' && iotFieldGate(id)) || [+x.lat, +x.lng];
    units.forEach(function(u, j){
      var key = u.code + '#' + u.i, pp = r.pos && r.pos[key];
      out.push({ k:'unit', key:key, code:u.code, lab:t(itemName(u.code)) + (u.n > 1 ? ' ' + nm(u.i + 1) : ''), ic:mvdIcon(u.code), at:pp ? [+pp[0], +pp[1]] : mvdRing(g0[0], g0[1], j, units.length) });
    });
  }
  var c = typeof iotOf === 'function' ? iotOf(id) : null;
  if (c && mayIot()){
    c.sensors.forEach(function(q, i){ out.push({ k:'s', key:'s' + i, i:i, lab:(c.sm[i] && c.sm[i].tag) || ('S' + iotPad(i + 1)), ic:'\u{1F321}', at:[+q[0], +q[1]] }); });
    iotAllGw(c).forEach(function(q, j){ if (q) out.push({ k:'g', key:'g' + j, i:j, lab:t('جيت واي') + (j ? ' ' + nm(j + 1) : ''), ic:'\u{1F6F0}', at:[+q[0], +q[1]] }); });
  }
  return out;
}
function mvdIcon(code){
  var c = String(code || '');
  return /^rdr/.test(c) ? '\u{1F4DF}' : /^cam/.test(c) ? '\u{1F4F7}' : /^rtr/.test(c) ? '\u{1F4E1}' : /^ant/.test(c) ? '\u{1F4F6}' : /^sol/.test(c) ? '\u2600\uFE0F' : /^bat/.test(c) ? '\u{1F50B}' : /^box/.test(c) ? '\u{1F5C4}' : '\u2699\uFE0F';
}
function mvdStart(id, only){
  var S = mvdState(); S.id = id; S.only = only || ''; S.last = null; POP_OPEN = false;
  if (typeof m3PopClose === 'function') m3PopClose();   /* the card that asked for it steps aside */
  render(1); mvdPaint();
  toast(t('اسحب أي جهاز لمكانه — كل سحبة تُحفظ'));
}
function mvdStop(){
  var S = mvdState(); S.marks.forEach(function(m){ try { m.remove(); } catch (e){ LS_ERR = e; } }); S.marks = [];
  if (S.lg){ try { S.lg.clearLayers(); } catch (e2){ LS_ERR = e2; } }
  S.id = ''; S.only = ''; S.last = null; render(1);
}
/* the pins: draggable markers on whichever map is shown */
function mvdPaint(){
  var S = mvdState();
  S.marks.forEach(function(m){ try { m.remove(); } catch (e){ LS_ERR = e; } }); S.marks = [];
  if (S.lg){ try { S.lg.clearLayers(); } catch (e2){ LS_ERR = e2; } }
  if (!S.id) return;
  var items = mvdShown();
  var html = function(it){ return '<div class="mvd-pin" title="' + esc(it.lab) + '"><span>' + it.ic + '</span><b>' + esc(it.lab) + '</b></div>'; };
  if (MAP_3D && typeof M3 !== 'undefined' && M3 && window.maplibregl){
    items.forEach(function(it){
      var el = document.createElement('div'); el.innerHTML = html(it); el = el.firstChild;
      try {
        var mk = new maplibregl.Marker({ element:el, draggable:true, anchor:'bottom' }).setLngLat([it.at[1], it.at[0]]).addTo(M3);
        mk.on('dragend', function(){ var ll = mk.getLngLat(); mvdSet(it, ll.lat, ll.lng); });
        S.marks.push(mk);
      } catch (e3){ LS_ERR = e3; }
    });
  } else if (typeof MAP !== 'undefined' && MAP && typeof L !== 'undefined'){
    try { if (!S.lg || S.lg._map !== MAP) S.lg = L.layerGroup().addTo(MAP); } catch (e4){ LS_ERR = e4; return; }
    items.forEach(function(it){
      var mk = L.marker(it.at, { draggable:true, icon:L.divIcon({ className:'', html:html(it), iconSize:null, iconAnchor:[0, 0] }), zIndexOffset:1000 });
      mk.on('dragend', function(ev){ var ll = ev.target.getLatLng(); mvdSet(it, ll.lat, ll.lng); });
      mk.addTo(S.lg);
    });
  }
}
/* one drop: saved on its own record, with the event log, and kept for «تراجع» */
function mvdSet(it, lat, lng, undoing){
  var S = mvdState(), id = S.id; if (!id || !(+lat && +lng)) return false;
  if (!undoing) S.last = { it:it, prev:it.at.slice() };
  if (it.k === 'site'){
    if (!may('edit')) return false;
    MOVE_ID = id; moveApply(+lat, +lng); POP_OPEN = false;   /* the same move as «⇱ تحريك»: the override, the visit back to review, the log */
  } else if (it.k === 'unit'){
    var r = (STATE.inss || {})[id]; if (!r || !may('edit')) return false;
    r.pos = Object.assign({}, r.pos || {}); r.pos[it.key] = [+(+lat).toFixed(7), +(+lng).toFixed(7)];
    CORE.set('inss', id, r);
    logEvent('تحريك جهاز — ' + id + ' \u00b7 ' + it.lab, id);
  } else {
    var c = iotOf(id); if (!c || !mayIot()) return false;
    var P = { gw:c.gw, gws:(c.gws || []).slice(), sensors:c.sensors.map(function(q){ return q.slice(); }), sm:c.sm, gm:c.gm };
    if (it.k === 's') P.sensors[it.i] = [+(+lat).toFixed(7), +(+lng).toFixed(7)];
    else if (it.i === 0) P.gw = [+(+lat).toFixed(7), +(+lng).toFixed(7)]; else P.gws[it.i - 1] = [+(+lat).toFixed(7), +(+lng).toFixed(7)];
    siteOvSet(id, { iot:{ gw:P.gw, gws:P.gws, sensors:P.sensors, sm:P.sm, gm:P.gm, maxM:iotMax(P.gw, P.sensors, P.gws), at:Date.now(), by:STATE.meta.name || '' } });
    logEvent('تحريك ' + (it.k === 's' ? 'حساس' : 'جيت واي') + ' — ' + id + ' \u00b7 ' + it.lab, id);
    if (typeof iotPaint === 'function') iotPaint();
  }
  toast(t(undoing ? 'رُجِّع' : 'حُفظ المكان') + ' \u00b7 ' + it.lab);
  try { if (typeof mapPaint === 'function' && MAP) mapPaint(); } catch (e){ LS_ERR = e; }
  try { if (MAP_3D && typeof m3Paint === 'function') m3Paint(); } catch (e2){ LS_ERR = e2; }
  render(1); mvdPaint();
  return true;
}
function mvdUndo(){ var S = mvdState(); if (!S.last) return false; var L0 = S.last; S.last = null; return mvdSet(L0.it, L0.prev[0], L0.prev[1], true); }
function mvdBarHtml(){
  var S = mvdState(); if (!S.id) return '';
  var x = siteFind(S.id);
  return '<div class="map-route-box" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    + '<b>\u2725 ' + esc(t('تحريك الأجهزة')) + '</b><span class="hint" style="margin:0">' + esc(x ? (x.sign || x.name || x.id) : S.id)
    + (S.only ? ' \u00b7 ' + esc((mvdShown()[0] || {}).lab || S.only) + ' \u00b7 ' + esc(t('اسحب الدبّوس لمكانه')) : ' \u00b7 ' + esc(t('اسحب أي جهاز لمكانه — كل سحبة تُحفظ'))) + '</span>'
    + (S.only ? btn('\u2725 ' + t('كل أجهزة النقطة'), 'btn-quiet btn-sm', ' data-mvd="' + esc(S.id) + '"') : '')
    + (S.last ? btn('\u21B6 ' + t('تراجع'), 'btn-quiet btn-sm', ' data-mvdundo="1"') : '')
    + btn('\u2713 ' + t('تم'), 'btn-primary btn-sm', ' data-mvdx="1"') + '</div>';
}
