/* ============================================================================
   FILE    : src/04-office/04-tasks-office-20-map3d-overview.js
   DOMAIN  : Office chunk — the 3D map's overview: groups from afar, sign labels up close
   PURPOSE : (V39.29) the second step of the GIS review. From afar a monitoring map shows groups, not dust: below zoom
             14.5 the points group by zone (below 12.5) or by a grid cell (450 m, then 250 m) into one disc — its count in the middle and a ring
             divided by the colours of its points (so «how much of this square is done» reads at a glance); a tap
             flies into the square. The single points and camps hide in that band and come back as you come in.
             Up close (zoom 17+) the camps nearest the centre carry their sign number (الشاخص) as a small label, so a
             camp is named on the map, not only in its card. Both are switches in «الطبقات» (on by default).
   DEFINES : m3ovState, m3ovKey, m3ovGroups, m3ovDonut, m3ovPaint, m3ovClear
   PREFIX  : m3ov   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : m3ovState() — the two switches and the live markers — on the function, no new global.
   ============================================================================ */

function m3ovState(){ return m3ovState.s || (m3ovState.s = { agg:true, lab:true, m:{}, lm:{} }); }

/* the group of a point at a zoom: below 12.5 its zone (منى، عرفات…); then a grid of 450 m, and of 250 m from 13.5 —
   the squares themselves were too fine (631 groups of ~3 points: dust of rings instead of dust of points) */
function m3ovKey(x, z){
  var g = (typeof taxOf === 'function' ? taxOf(x).g : x.zone) || x.zone || '';
  if (z < 12.5) return g;
  var cell = z < 13.5 ? 450 : 250, kx = 111320 * Math.cos(+x.lat * Math.PI / 180);
  return g + '|' + cell + '#' + Math.floor(+x.lat * 111320 / cell) + ':' + Math.floor(+x.lng * kx / cell);
}
/* the groups of the layer's points: centre, count, colours, bounds, label */
function m3ovGroups(z){
  var G = {};
  ((typeof layerFiltered === 'function') ? layerFiltered() : []).forEach(function(x){
    if (!(+x.lat && +x.lng)) return;
    var k = m3ovKey(x, z), g = G[k] || (G[k] = { k:k, n:0, la:0, ln:0, c:{}, s:+x.lat, w:+x.lng, nn:+x.lat, e:+x.lng, zone:(typeof taxOf === 'function' ? taxOf(x).g : x.zone) || '' });
    g.n++; g.la += +x.lat; g.ln += +x.lng; var col = mapColorOf(x); g.c[col] = (g.c[col] || 0) + 1;
    if (+x.lat < g.s) g.s = +x.lat; if (+x.lat > g.nn) g.nn = +x.lat; if (+x.lng < g.w) g.w = +x.lng; if (+x.lng > g.e) g.e = +x.lng;
  });
  return Object.keys(G).map(function(k){ var g = G[k]; g.la /= g.n; g.ln /= g.n; return g; });
}
/* a ring divided by the colours, the count in the middle */
function m3ovDonut(g){
  var R = 19, C = 2 * Math.PI * R, off = 0, segs = Object.keys(g.c).sort(function(a, b){ return g.c[b] - g.c[a]; }).map(function(col){
    var len = C * g.c[col] / g.n, s = '<circle r="' + R + '" cx="24" cy="24" fill="none" stroke="' + col + '" stroke-width="7" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
    off += len; return s; }).join('');
  return '<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-90 24 24)">' + segs + '</g><circle r="14.5" cx="24" cy="24" fill="rgba(11,18,32,.88)"/>'
    + '<text x="24" y="28.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">' + nm(g.n) + '</text></svg>';
}
function m3ovPaint(){
  var S = m3ovState();
  if (!MAP_3D || !M3 || !window.maplibregl){ m3ovClear(); return; }
  var z, b, c; try { z = M3.getZoom(); b = M3.getBounds(); c = M3.getCenter(); } catch (e){ LS_ERR = e; return; }
  /* from afar: the groups, and the single points hidden */
  var far = S.agg && z < 14.5, keep = {};
  try { ['nsk-pts', 'nsk-cols', 'nsk-cols-line'].forEach(function(id){ if (M3.getLayer(id)) M3.setLayoutProperty(id, 'visibility', far ? 'none' : 'visible'); }); } catch (e1){ LS_ERR = e1; }
  if (far){
    m3ovGroups(z).forEach(function(g){
      if (!b.contains([g.ln, g.la])) return;
      var html = m3ovDonut(g); keep[g.k] = 1;
      var mk = S.m[g.k];
      if (mk && mk._nskHtml === html) return;
      if (mk){ try { mk.remove(); } catch (e2){ LS_ERR = e2; } }
      var el = document.createElement('div'); el.className = 'm3-agg'; el.innerHTML = html; el.title = (g.zone ? t(g.zone) + ' \u00b7 ' : '') + nm(g.n);
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', el.title);
      el.addEventListener('click', function(ev){ ev.stopPropagation(); try { M3.fitBounds([[g.w, g.s], [g.e, g.nn]], { padding:80, maxZoom:16.5, duration:900 }); } catch (e3){ LS_ERR = e3; } });
      try { mk = new maplibregl.Marker({ element:el }).setLngLat([g.ln, g.la]).addTo(M3); mk._nskHtml = html; S.m[g.k] = mk; } catch (e4){ LS_ERR = e4; }
    });
  }
  Object.keys(S.m).forEach(function(k){ if (!keep[k]){ try { S.m[k].remove(); } catch (e5){ LS_ERR = e5; } delete S.m[k]; } });
  /* up close: the sign numbers of the nearest camps */
  var lk = {};
  if (S.lab && z >= 17){
    var kx = 111320 * Math.cos(c.lat * Math.PI / 180);
    ((typeof layerFiltered === 'function') ? layerFiltered() : []).filter(function(x){ return x.type === 'مخيم' && x.sign && +x.lat && b.contains([+x.lng, +x.lat]); })
      .map(function(x){ return { x:x, d:Math.hypot((+x.lng - c.lng) * kx, (+x.lat - c.lat) * 111320) }; }).sort(function(a, d){ return a.d - d.d; }).slice(0, 60)
      .forEach(function(o){
        var x = o.x; lk[x.id] = 1; if (S.lm[x.id]) return;
        var el = document.createElement('div'); el.className = 'm3-lab'; el.textContent = x.sign; el.setAttribute('data-site', x.id); el.setAttribute('role', 'button'); el.title = x.name || x.id;
        try { S.lm[x.id] = new maplibregl.Marker({ element:el, anchor:'bottom', offset:[0, -6] }).setLngLat([+x.lng, +x.lat]).addTo(M3); } catch (e6){ LS_ERR = e6; }
      });
  }
  Object.keys(S.lm).forEach(function(k){ if (!lk[k]){ try { S.lm[k].remove(); } catch (e7){ LS_ERR = e7; } delete S.lm[k]; } });
}
function m3ovClear(){
  var S = m3ovState();
  [S.m, S.lm].forEach(function(M){ Object.keys(M).forEach(function(k){ try { M[k].remove(); } catch (e){ LS_ERR = e; } delete M[k]; }); });
}
