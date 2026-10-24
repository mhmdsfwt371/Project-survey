/* ============================================================================
   FILE    : src/04-office/04-tasks-office-17-twin-camps.js
   DOMAIN  : Office chunk — the 3D map's digital twin, part three: Mina's camps as they stand
   PURPOSE : (V39.18) owner: «المخيمات في التوأم الرقمي عاوزها واقعية لمخيمات منى». A Mina camp is rows of white
             fire-resistant tents, 8 m square, pyramid-roofed, with aisles between the rows and a fence around; the
             twin drew it as one flat blue block. This file fills every camp that has a boundary with its tents: a
             grid of 8 m modules aligned to the camp's longest side, each a cream body and a smaller roof cap that
             reads as a pyramid, aisles of 1.5 m between them, a low fence along the boundary — and the camp's
             status stays visible as a thin coloured plinth under the tents. Camps without a boundary keep their
             column. It reads campFoot() only and writes nothing; «خيام» in the map's top row switches it.
   DEFINES : tentOn, tentCells, tentFence, tentFeaturesOf, tentFeatures, tentLayers, tentPaint
   STATE   : tentPaint.on (default on), tentPaint.cache (per camp id) — on the function, no new global.
   ============================================================================ */

/* the tent module's measures and colours come from tentCfg() in the core's 3D file — the plinth height is needed there too */

function tentOn(){ return tentPaint.on !== false; }

/* local metres around the camp's centre: [x east, y north] ↔ [lng, lat] */
function tentCells(ring){
  var T_ = tentCfg();
  if (!ring || ring.length < 3) return [];
  var lat0 = 0, lng0 = 0; ring.forEach(function(q){ lng0 += +q[0]; lat0 += +q[1]; }); lat0 /= ring.length; lng0 /= ring.length;
  var kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 111320;
  var P = ring.map(function(q){ return [(+q[0] - lng0) * kx, (+q[1] - lat0) * ky]; });
  /* the longest side gives the rows their direction */
  var best = 0, ang = 0;
  for (var i = 0; i < P.length; i++){ var a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best){ best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  var ca = Math.cos(-ang), sa = Math.sin(-ang), rot = function(p){ return [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca]; };
  var cb = Math.cos(ang), sb = Math.sin(ang), unrot = function(p){ return [p[0] * cb - p[1] * sb, p[0] * sb + p[1] * cb]; };
  var Q = P.map(rot), minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  Q.forEach(function(p){ if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; });
  var inside = function(x, y){ var c = false; for (var i2 = 0, j = Q.length - 1; i2 < Q.length; j = i2++){ var xi = Q[i2][0], yi = Q[i2][1], xj = Q[j][0], yj = Q[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
  var step = T_.size + T_.aisle, half = T_.size / 2, m = T_.aisle, out = [];
  for (var y = minY + m + half; y + half <= maxY - m && out.length < T_.max; y += step)
    for (var x = minX + m + half; x + half <= maxX - m && out.length < T_.max; x += step){
      /* the whole module must be inside — a tent does not straddle the fence */
      if (!inside(x, y) || !inside(x - half, y - half) || !inside(x + half, y - half) || !inside(x - half, y + half) || !inside(x + half, y + half)) continue;
      var sq = function(hh){ return [[x - hh, y - hh], [x + hh, y - hh], [x + hh, y + hh], [x - hh, y + hh], [x - hh, y - hh]].map(function(p){ var u = unrot(p); return [lng0 + u[0] / kx, lat0 + u[1] / ky]; }); };
      out.push({ body:sq(half - 0.2), roof:sq(half * 0.45) });
    }
  return out;
}
/* the fence: a thin quad along each side of the boundary */
function tentFence(ring){
  var T_ = tentCfg();
  var out = [], lat0 = +ring[0][1], kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 111320, w = T_.fenceW / 2;
  for (var i = 0; i < ring.length; i++){
    var a = ring[i], b = ring[(i + 1) % ring.length]; if (a[0] === b[0] && a[1] === b[1]) continue;
    var dx = (b[0] - a[0]) * kx, dy = (b[1] - a[1]) * ky, L = Math.hypot(dx, dy); if (L < 1) continue;
    var nx = -dy / L * w / kx, ny = dx / L * w / ky;
    out.push([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny], [a[0] + nx, a[1] + ny]]);
  }
  return out;
}
function tentFeaturesOf(id, ring){
  var T_ = tentCfg();
  var C = tentPaint.cache || (tentPaint.cache = {}); if (C[id]) return C[id];
  var F = [], cells = tentCells(ring);
  cells.forEach(function(c){
    F.push({ type:'Feature', properties:{ camp:id, k:'body', color:T_.fabric, base:T_.plinth, h:T_.plinth + T_.body }, geometry:{ type:'Polygon', coordinates:[c.body] } });
    F.push({ type:'Feature', properties:{ camp:id, k:'roof', color:T_.roofC, base:T_.plinth + T_.body - 0.05, h:T_.plinth + T_.roof }, geometry:{ type:'Polygon', coordinates:[c.roof] } });
  });
  if (cells.length) tentFence(ring).forEach(function(q){ F.push({ type:'Feature', properties:{ camp:id, k:'fence', color:T_.fence, base:0, h:T_.fenceH }, geometry:{ type:'Polygon', coordinates:[q] } }); });
  C[id] = F; return F;
}
/* the camps in the frame, from the footprints the points layer already resolved (M3_FOOT) */
function tentFeatures(){
  var F = [];
  if (!MAP_3D || !M3 || !tentOn() || typeof M3_FOOT !== 'object') return F;
  var b; try { if (M3.getZoom() < 15) return F; b = M3.getBounds(); } catch (e){ LS_ERR = e; return F; }
  Object.keys(M3_FOOT).forEach(function(id){
    var ring = M3_FOOT[id]; if (!ring || ring.length < 3) return;
    if (!ring.some(function(q){ return b.contains([+q[0], +q[1]]); })) return;
    F = F.concat(tentFeaturesOf(id, ring));
  });
  return F;
}
function tentLayers(){
  if (!M3 || M3.getSource('nsktent')) return;
  M3.addSource('nsktent', { type:'geojson', data:{ type:'FeatureCollection', features:tentFeatures() } });
  M3.addLayer({ id:'nsk-tent', type:'fill-extrusion', source:'nsktent', minzoom:15,
    paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':['get','base'],
            'fill-extrusion-opacity':0.9, 'fill-extrusion-vertical-gradient':true } });
}
function tentPaint(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  try { var s = M3.getSource('nsktent'); if (s) s.setData({ type:'FeatureCollection', features:tentFeatures() }); } catch (e){ LS_ERR = e; }
}
