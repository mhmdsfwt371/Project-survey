/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-16-heat.js
   DOMAIN  : Map — the heat layer
   PURPOSE : (V39.16) owner: a heat map of the challenges and of the progress — where the work stands still and where it
             is done, seen from above without reading points one by one. The heat follows the map's mode: in survey
             mode a point counts when its visit recorded a challenge or could not be surveyed; in installation (and
             dismantling) mode a point counts while its work remains. The flat map draws 120 m cells coloured by how
             many such points they hold; the 3D map draws the engine's own heat layer from the same points. The chip
             «الحرارة» switches it on both; it reads the records and writes nothing.
   DEFINES : heatWeight, heatPoints, heatColor, heatPaint, heatLayers3d, heatPaint3d
   STATE   : heatPaint.on, heatPaint.layer — on the function, no new global.
   ============================================================================ */

/* 1 when the point is «hot» in the current mode, else 0 */
function heatWeight(x){
  if (FIELD_MODE === 'install' || FIELD_MODE === 'dis'){
    var L = lifeOf(x);
    if (FIELD_MODE === 'dis') return L === 'dis' ? 0 : 1;
    return (L === 'installed' || L === 'handed' || L === 'dis' || L === 'maint') ? 0 : 1;
  }
  var r = STATE.recs && STATE.recs[x.id]; if (!r) return 0;
  var ch = (r.chals || []).filter(function(c){ return c && c !== 'لا توجد تحديات'; }).length;
  return (ch > 0 || (r.access && r.access !== 'تم الوصول')) ? 1 : 0;
}
/* the hot points in a box, each [lat, lng] */
function heatPoints(inBox){
  var out = [], L = typeof layerFiltered === 'function' ? layerFiltered() : (STATE.sites || []);
  L.forEach(function(x){ if (+x.lat && +x.lng && inBox(+x.lat, +x.lng) && heatWeight(x)) out.push([+x.lat, +x.lng]); });
  return out;
}
/* yellow for a little, red for a lot */
function heatColor(f){
  f = Math.max(0, Math.min(1, f)); var r = 255, g = Math.round(214 - 130 * f), b = Math.round(10 + 72 * f);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
/* the flat map: 120 m cells, redrawn with every paint while the chip is on, between zooms 11 and 17 */
function heatPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try { if (heatPaint.layer && heatPaint.layer._map !== MAP) heatPaint.layer = null; if (heatPaint.layer) heatPaint.layer.clearLayers(); else heatPaint.layer = L.layerGroup().addTo(MAP); } catch (e){ LS_ERR = e; return; }
  var z = MAP.getZoom(); if (!heatPaint.on || z < 11 || z > 17) return;
  var b = MAP.getBounds().pad(0.1), inBox = function(la, ln){ return b.contains([la, ln]); };
  var cell = 120, cells = {}, max = 0;
  heatPoints(inBox).forEach(function(p){
    var ky = Math.floor(p[0] * 111320 / cell), kx = Math.floor(p[1] * 111320 * Math.cos(p[0] * Math.PI / 180) / cell), k = ky + '|' + kx;
    var c = cells[k] || (cells[k] = { ky:ky, kx:kx, lat:p[0], n:0 }); c.n++; if (c.n > max) max = c.n;
  });
  Object.keys(cells).forEach(function(k){
    var c = cells[k], dy = cell / 111320, dx = cell / (111320 * Math.cos(c.lat * Math.PI / 180)), la = c.ky * dy, ln = c.kx * dx;
    L.rectangle([[la, ln], [la + dy, ln + dx]], { renderer:MAP_CV, color:heatColor(c.n / max), weight:0.6, fillColor:heatColor(c.n / max), fillOpacity:0.28 + 0.4 * (c.n / max), interactive:false }).addTo(heatPaint.layer);
  });
}
/* the 3D map: the engine's heat layer from the same points */
function heatLayers3d(){
  if (!M3 || M3.getSource('nskheat')) return;
  M3.addSource('nskheat', { type:'geojson', data:{ type:'FeatureCollection', features:[] } });
  M3.addLayer({ id:'nsk-heat', type:'heatmap', source:'nskheat', maxzoom:18,
    paint:{ 'heatmap-weight':1, 'heatmap-intensity':['interpolate', ['linear'], ['zoom'], 11, 0.6, 17, 1.6],
            'heatmap-radius':['interpolate', ['linear'], ['zoom'], 11, 14, 17, 48], 'heatmap-opacity':0.7,
            'heatmap-color':['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(255,214,10,0)', 0.3, 'rgba(255,190,40,.55)', 0.7, 'rgba(240,120,60,.8)', 1, 'rgba(224,82,82,.95)'] } });
}
function heatPaint3d(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  var src; try { src = M3.getSource('nskheat'); } catch (e){ LS_ERR = e; return; } if (!src) return;
  var F = [];
  if (heatPaint.on){ var b = M3.getBounds(), inBox = function(la, ln){ return b.contains([ln, la]); }; F = heatPoints(inBox).map(function(p){ return { type:'Feature', properties:{}, geometry:{ type:'Point', coordinates:[p[1], p[0]] } }; }); }
  try { src.setData({ type:'FeatureCollection', features:F }); } catch (e2){ LS_ERR = e2; }
}
