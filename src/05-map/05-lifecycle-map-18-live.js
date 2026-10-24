/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-18-live.js
   DOMAIN  : Map — the live twin (the pulse of the readers and the crowd in the camps)
   PURPOSE : (V39.20) owner: the twin must live, not only record. The Nusuk card system bridge already brings two
             pulses into the app: each linked reader's last read (extLink → reader.timestamp, judged against the
             bridge's moment) and each camp's occupancy (the overview's occupancyStatus, or the office snapshot).
             This file turns them into a map mode: «الحي» colours every point by its reader's pulse — green read
             within fifteen minutes of the bridge, red silent, grey unlinked — and every camp by how full it is;
             the hover and the device cards say the last read and the occupancy. The sensors' pulse has no source
             yet: liveSensor() reads STATE.iotLive (a `iotlive/{camp}` document a future bridge writes, shape in
             docs/live.md) and colours them the same way when it exists. Reads the bridge's state; writes nothing.
   DEFINES : liveState, liveOf, liveOcc, liveColorOf, liveSensor, liveCounts, liveTextOf, liveKick
   STATE   : liveState() — on/off and the last refresh — on the function, no new global.
   ============================================================================ */

function liveState(){ return liveState.s || (liveState.s = { on:false, at:0 }); }

/* the pulse of a point's reader: {link:bool, on:bool, at:ts} */
function liveOf(x){
  if (!x || typeof extLink !== 'function' || typeof EXT !== 'object') return { link:false, on:false, at:0 };
  var o = { link:false, on:false, at:0 };
  try {
    if (EXT.readers || EXT.tentsBy){ var L = extLink(x); if (L && L.reader){ var st = extRdState(L.reader); o.link = true; o.on = !!(st && st.on); o.at = (st && st.ts) || 0; return o; } }
    var Z = STATE.extSnap && STATE.extSnap.sites && STATE.extSnap.sites[x.id];
    if (Z && Z.ts){ o.link = true; o.at = Date.parse(Z.ts) || 0; var ref = (STATE.extSnap.at || Date.now()); o.on = o.at > 0 && ref - o.at <= 15 * 60000; }
  } catch (e){ LS_ERR = e; }
  return o;
}
/* a camp's occupancy: {pct, tot, cap} or null — from the live overview, else the office snapshot */
function liveOcc(x){
  if (!x || x.type !== 'مخيم') return null;
  try {
    if (typeof extLink === 'function' && typeof EXT === 'object' && (EXT.readers || EXT.tentsBy)){
      var L = extLink(x), tn = L && (L.tent || (L.reader ? extTentByCode(L.reader.locationName) : null));
      var ov = tn && EXT.ov && EXT.ov[tn.id] && EXT.ov[tn.id].data, c = ov && ov.occupancyStatus;
      if (c){ var tot = (c.currentlyOccupied || 0) + (c.withoutBracelet || 0) + (c.fromOtherCamps || 0); return { pct:c.totalCapacity ? Math.round(tot / c.totalCapacity * 100) : 0, tot:tot, cap:c.totalCapacity || 0 }; }
    }
    var Z = STATE.extSnap && STATE.extSnap.sites && STATE.extSnap.sites[x.id], C = Z && STATE.extSnap.camps && STATE.extSnap.camps[Z.code];
    if (C){ var tt = (C.w || 0) + (C.wo || 0) + (C.ot || 0); return { pct:C.cap ? Math.round(tt / C.cap * 100) : 0, tot:tt, cap:C.cap || 0 }; }
  } catch (e){ LS_ERR = e; }
  return null;
}
/* the colour of the live mode: a camp by its fullness, a point by its reader's pulse */
function liveColorOf(x){
  var occ = liveOcc(x);
  if (occ) return occ.pct >= 90 ? '#E05252' : occ.pct >= 60 ? '#F5A623' : '#3ED598';
  var p = liveOf(x);
  return !p.link ? '#5B6570' : p.on ? '#3ED598' : '#E05252';
}
/* a sensor's pulse — the structure for a bridge that does not exist yet: STATE.iotLive[camp] = { at, s:{ <sensor id>:{ at, v } } } */
function liveSensor(camp, id){
  var L = STATE.iotLive && STATE.iotLive[camp], r = L && L.s && L.s[id]; if (!r) return null;
  var ref = +L.at || Date.now(); return { on:(+r.at || 0) > 0 && ref - r.at <= 30 * 60000, at:+r.at || 0, v:r.v };
}
function liveCounts(){
  var n = { on:0, off:0, none:0, camps:0 };
  (STATE.sites || []).forEach(function(x){ if (liveOcc(x)){ n.camps++; return; } var p = liveOf(x); if (!p.link) n.none++; else if (p.on) n.on++; else n.off++; });
  return n;
}
/* what the hover and the cards say */
function liveTextOf(x){
  var occ = liveOcc(x); if (occ) return t('الإشغال') + ' ' + nm(occ.pct) + '\u066A \u00b7 ' + nm(occ.tot) + ' / ' + nm(occ.cap);
  var p = liveOf(x); if (!p.link) return t('غير مربوطة بنظام البطاقات');
  return (p.on ? '\u{1F7E2} ' + t('متصل عند آخر جسر') : '\u{1F534} ' + t('غير متصل')) + (p.at ? ' \u00b7 ' + t('آخر قراءة') + ' ' + pilotAgo(p.at) : '');
}
/* switch the mode on: refresh the bridge first so the colours are of now */
function liveKick(){ try { if (typeof pilotKick === 'function') pilotKick(); } catch (e){ LS_ERR = e; } liveState().at = Date.now(); }
