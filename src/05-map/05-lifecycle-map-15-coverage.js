/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-15-coverage.js
   DOMAIN  : Map — the coverage layer
   PURPOSE : (V39.14) owner: coverage on the map — what each installed device covers, so a gap or an overlap is seen,
             not guessed. Readers draw their read range (12 m unless the installation says otherwise), cameras draw
             their field of view as a sector when the installation records the camera's direction (and a faint
             circle when it does not yet), and the camps' gateways draw their 150 m reach. The layer is a chip
             («التغطية») in the map's top row, drawn on the flat map and the 3D one alike, from zoom 15 up. It reads
             the installation record's `cov` {dir, fov, rdr} written from the install-edit sheet — nothing else.
   DEFINES : covDefaults, covOf, covSector, covCircle, covShapes, covPaint, covPaint3d, covLayers3d
   STATE   : covPaint.on (the switch), covPaint.layer (the flat map's layer group) — on the function, no new global.
   ============================================================================ */

/* the defaults the field has not overridden: reader read range, camera reach and field of view, gateway reach — metres and degrees */
function covDefaults(){ return { rdr:12, camR:25, fov:90, gw:150 }; }
function covOf(id){ var r = (STATE.inss || {})[id]; return Object.assign({}, covDefaults(), (r && r.cov) || {}); }

/* a circle of `m` metres as a ring of [lat, lng] — 36 points */
function covCircle(lat, lng, m){
  var out = [], ky = 111320, kx = 111320 * Math.cos(lat * Math.PI / 180);
  for (var i = 0; i < 36; i++){ var a = i * Math.PI / 18; out.push([lat + m * Math.cos(a) / ky, lng + m * Math.sin(a) / kx]); }
  return out;
}
/* a sector from the point: `dir` degrees from north, `fov` degrees wide, `m` metres far */
function covSector(lat, lng, m, dir, fov){
  var out = [[lat, lng]], ky = 111320, kx = 111320 * Math.cos(lat * Math.PI / 180), a0 = (dir - fov / 2) * Math.PI / 180, a1 = (dir + fov / 2) * Math.PI / 180, n = 12;
  for (var i = 0; i <= n; i++){ var a = a0 + (a1 - a0) * i / n; out.push([lat + m * Math.cos(a) / ky, lng + m * Math.sin(a) / kx]); }
  out.push([lat, lng]); return out;
}

/* the shapes in a box [south, west, north, east]: {ring, color, kind, site} */
function covShapes(inBox){
  var S = [];
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat && +x.lng) || !inBox(+x.lat, +x.lng)) return;
    var r = (STATE.inss || {})[x.id]; if (!r || !r.parts) return;
    var c = covOf(x.id), hasRdr = Object.keys(r.parts).some(function(k){ return /^rdr/.test(k) && +r.parts[k] > 0; }), cams = Object.keys(r.parts).some(function(k){ return /^cam/.test(k) && +r.parts[k] > 0; });
    if (hasRdr) S.push({ ring:covCircle(+x.lat, +x.lng, +c.rdr || 12), color:'#7C4DFF', kind:'reader', site:x.id });
    if (cams) S.push(isFinite(+c.dir) && c.dir !== '' && c.dir !== null && c.dir !== undefined
      ? { ring:covSector(+x.lat, +x.lng, +c.camR || 25, +c.dir, +c.fov || 90), color:'#2D7DD2', kind:'camera', site:x.id }
      : { ring:covCircle(+x.lat, +x.lng, +c.camR || 25), color:'#2D7DD2', kind:'camera-unaimed', site:x.id });
  });
  if (typeof IOT === 'object' && typeof iotCampIds === 'function') iotCampIds().forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw) return;
    iotAllGw(c).forEach(function(g){ if (inBox(+g[0], +g[1])) S.push({ ring:covCircle(+g[0], +g[1], covDefaults().gw), color:IOT_C.gw, kind:'gateway', site:id }); });
  });
  return S;
}

/* the flat map: polygons on the canvas renderer, redrawn with every paint of the map while the chip is on */
function covPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try { if (covPaint.layer && covPaint.layer._map !== MAP) covPaint.layer = null; if (covPaint.layer) covPaint.layer.clearLayers(); else covPaint.layer = L.layerGroup().addTo(MAP); } catch (e){ LS_ERR = e; return; }
  if (!covPaint.on || MAP.getZoom() < 15) return;
  var b = MAP.getBounds().pad(0.2), inBox = function(la, ln){ return b.contains([la, ln]); };
  covShapes(inBox).forEach(function(s){
    L.polygon(s.ring, { renderer:MAP_CV, color:s.color, weight:s.kind === 'camera-unaimed' ? 1 : 1.4, dashArray:s.kind === 'camera-unaimed' ? '4 4' : null, fillColor:s.color, fillOpacity:s.kind === 'gateway' ? .08 : .16, interactive:false }).addTo(covPaint.layer);
  });
}

/* the 3D map: one flat fill layer under the columns, with its outline */
function covLayers3d(){
  if (!M3 || M3.getSource('nskcov')) return;
  M3.addSource('nskcov', { type:'geojson', data:{ type:'FeatureCollection', features:[] } });
  M3.addLayer({ id:'nsk-cov', type:'fill', source:'nskcov', paint:{ 'fill-color':['get','color'], 'fill-opacity':['case', ['==', ['get','kind'], 'gateway'], 0.08, 0.18] } });
  M3.addLayer({ id:'nsk-cov-line', type:'line', source:'nskcov', paint:{ 'line-color':['get','color'], 'line-width':1.2, 'line-opacity':0.8 } });
}
function covPaint3d(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  var src; try { src = M3.getSource('nskcov'); } catch (e){ LS_ERR = e; return; } if (!src) return;
  var F = [];
  if (covPaint.on && M3.getZoom() >= 15){
    var b = M3.getBounds(), inBox = function(la, ln){ return b.contains([ln, la]); };
    F = covShapes(inBox).map(function(s){ return { type:'Feature', properties:{ color:s.color, kind:s.kind, site:s.site }, geometry:{ type:'Polygon', coordinates:[s.ring.concat([s.ring[0]]).map(function(p){ return [p[1], p[0]]; })] } }; });
  }
  try { src.setData({ type:'FeatureCollection', features:F }); } catch (e2){ LS_ERR = e2; }
}
