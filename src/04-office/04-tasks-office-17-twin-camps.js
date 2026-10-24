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
   PREFIX  : tent   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : tentPaint.on (default on), tentPaint.cache (per camp id) — on the function, no new global.
   ============================================================================ */

/* the tent module's measures and colours come from tentCfg() in the core's 3D file — the plinth height is needed there too */

/* (V39.36) owner, with a screenshot of the camp in its colour and its sensors as pins: «ده الشكل الجامد اللي أنا عاوز أشوفه كل
   ما أعمل زوم» — the tents are a switch in «الطبقات», off until asked; the camp reads by its colour and its sensors */
function tentOn(){ return tentPaint.on === true; }

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
/* the fence: a thin quad along each side of the boundary — (V39.23) open where the camp has an entrance: each entrance
   cuts a 4 m gap in the side nearest to it and stands a gate frame there (two posts and a lintel), the main one
   (the street entrance with the box) taller and in the accent colour */
function tentFence(ring, ents){
  var T_ = tentCfg();
  var out = [], gates = [], lat0 = +ring[0][1], kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 111320, w = T_.fenceW / 2;
  var toM = function(q){ return [(+q[0] - +ring[0][0]) * kx, (+q[1] - lat0) * ky]; }, toLL = function(m){ return [+ring[0][0] + m[0] / kx, lat0 + m[1] / ky]; };
  var E = (ents || []).map(function(e){ return { m:toM([e.at[1], e.at[0]]), main:!!e.main, best:Infinity, edge:-1, t:0 }; });
  var edges = [];
  for (var i = 0; i < ring.length; i++){
    var a = toM(ring[i]), b = toM(ring[(i + 1) % ring.length]), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue;
    var ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, k = edges.length;
    edges.push({ a:a, ux:ux, uy:uy, L:L, cuts:[] });
    E.forEach(function(e){ var dx = e.m[0] - a[0], dy = e.m[1] - a[1], tt = dx * ux + dy * uy; if (tt < 0 || tt > L) return; var d = Math.abs(dx * uy - dy * ux); if (d < e.best && d < 12){ e.best = d; e.edge = k; e.t = tt; } });
  }
  E.forEach(function(e){ if (e.edge > -1) edges[e.edge].cuts.push({ t:e.t, main:e.main }); });
  var quad = function(ed, t0, t1, hw){ var nx = -ed.uy * hw, ny = ed.ux * hw, p0 = [ed.a[0] + ed.ux * t0, ed.a[1] + ed.uy * t0], p1 = [ed.a[0] + ed.ux * t1, ed.a[1] + ed.uy * t1];
    return [toLL([p0[0] + nx, p0[1] + ny]), toLL([p1[0] + nx, p1[1] + ny]), toLL([p1[0] - nx, p1[1] - ny]), toLL([p0[0] - nx, p0[1] - ny]), toLL([p0[0] + nx, p0[1] + ny])]; };
  edges.forEach(function(ed){
    var C = ed.cuts.slice().sort(function(x, y){ return x.t - y.t; }), t0 = 0;
    C.forEach(function(c){
      var g0 = Math.max(0, c.t - 2), g1 = Math.min(ed.L, c.t + 2);
      if (g0 - t0 > 0.3) out.push(quad(ed, t0, g0, w));
      gates.push({ main:c.main, posts:[quad(ed, g0 - 0.25, g0 + 0.25, 0.25), quad(ed, g1 - 0.25, g1 + 0.25, 0.25)], lintel:quad(ed, g0 - 0.25, g1 + 0.25, 0.25) });
      t0 = g1;
    });
    if (ed.L - t0 > 0.3) out.push(quad(ed, t0, ed.L, w));
  });
  tentFence.gates = gates;
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
  if (cells.length){
    var ents = typeof iotFieldEntrances === 'function' ? iotFieldEntrances(id) : [];
    tentFence(ring, ents).forEach(function(q){ F.push({ type:'Feature', properties:{ camp:id, k:'fence', color:T_.fence, base:0, h:T_.fenceH }, geometry:{ type:'Polygon', coordinates:[q] } }); });
    (tentFence.gates || []).forEach(function(g){
      var top = g.main ? 3.6 : 2.8, col = g.main ? '#2E9C6A' : '#8A8F98';
      g.posts.forEach(function(q){ F.push({ type:'Feature', properties:{ camp:id, k:'gate', color:col, base:0, h:top }, geometry:{ type:'Polygon', coordinates:[q] } }); });
      F.push({ type:'Feature', properties:{ camp:id, k:'gate', color:col, base:top - 0.45, h:top }, geometry:{ type:'Polygon', coordinates:[g.lintel] } });
    });
  }
  C[id] = F; return F;
}
/* the camps in the frame, from the footprints the points layer already resolved (M3_FOOT) */
function tentFeatures(){
  var F = [];
  if (!MAP_3D || !M3 || !tentOn() || typeof M3_FOOT !== 'object') return F;
  var b; try { if (M3.getZoom() < 18) return F; b = M3.getBounds(); } catch (e){ LS_ERR = e; return F; }
  Object.keys(M3_FOOT).forEach(function(id){
    var ring = M3_FOOT[id]; if (!ring || ring.length < 3) return;
    if (!ring.some(function(q){ return b.contains([+q[0], +q[1]]); })) return;
    var TF = tentFeaturesOf(id, ring);
    /* (V39.20) in the live mode the roofs take the camp's fullness colour — a full camp reads red from above */
    if (liveState().on){ var x = siteFind(id), lc = x && liveOcc(x) ? liveColorOf(x) : ''; if (lc) TF = TF.map(function(f){ return f.properties.k === 'roof' ? { type:'Feature', properties:Object.assign({}, f.properties, { color:lc }), geometry:f.geometry } : f; }); }
    F = F.concat(TF);
  });
  return F;
}
function tentLayers(){
  if (!M3 || M3.getSource('nsktent')) return;
  M3.addSource('nsktent', { type:'geojson', data:{ type:'FeatureCollection', features:tentFeatures() } });
  M3.addLayer({ id:'nsk-tent', type:'fill-extrusion', source:'nsktent', minzoom:18,   /* (V39.28) up close only — from afar the camps read by their status colour */
    paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':['get','base'],
            'fill-extrusion-opacity':0.72, 'fill-extrusion-vertical-gradient':true } });   /* (V39.21) translucent: what stands inside the tent shows through */
}
function tentPaint(){
  if (!MAP_3D || !M3 || !M3.getSource) return;
  try { var s = M3.getSource('nsktent'); if (s) s.setData({ type:'FeatureCollection', features:tentFeatures() }); } catch (e){ LS_ERR = e; }
}
