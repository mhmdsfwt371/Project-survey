/* (V38.90) moved by scripts/split-late.mjs from src/02-catalog/02-catalog-forms-02-types-shapes-filters.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function shapeRing(map, lat, lng, px, shape){
  var U = SHAPE_UNIT[shape];
  if (!U) return null;
  var c = map.latLngToContainerPoint([lat, lng]);
  return U.map(function(p){ return map.containerPointToLatLng([c.x + p[0] * px, c.y + p[1] * px]); });
}

/* (V29.8) شكوى المالك «الزايدي مكتوب ١ ومش على الخريطة»: مواقعُ التفويج بعيدةٌ عن المشاعر (النورية والزايدي والجموم والمدينة)،
   فاختيارُ مشعرٍ أو نوعٍ لا يظهر شيءٌ من نقاطه في الإطار يقرّب الخريطةَ إليها — وإن ظهر شيءٌ منها بقيت الخريطةُ مكانها */
function mapFitFiltered(){
  if (CUR !== 'map' || typeof MAP === 'undefined' || !MAP || !(FILT.zone || FILT.type)) return false;
  var P = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng && filtPass(x); }).map(function(x){ return [+x.lat, +x.lng]; });
  if (!P.length) return false;
  try {
    var B = MAP.getBounds(); if (P.some(function(p){ return B.contains(p); })) return false;
    MAP.fitBounds(L.latLngBounds(P).pad(0.2), { maxZoom:17, animate:false }); return true;
  } catch (e){ LS_ERR = e; return false; }
}

function jmrNameApply(name, gate, floor){
  var out = String(name || '').trim();
  if (floor != null && floor !== ''){
    var fl = floorName(+floor);
    if (/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/.test(out)) out = out.replace(/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/, fl);
    else out += ' - ' + fl;
  }
  if (gate === 'مدخل' || gate === 'مخرج'){
    if (/مدخل|مخرج/.test(out)) out = out.replace(/مدخل|مخرج/g, gate);
    else out += ' - ' + gate;
  }
  return out;
}

function tfwM(a, b){ var dy = (a[0] - b[0]) * 110574, dx = (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180); return Math.sqrt(dx * dx + dy * dy); }

function tfwNet(lines){
  var id = {}, P = [], A = [];
  var node = function(p){ var k = p[0].toFixed(6) + ',' + p[1].toFixed(6); if (id[k] == null){ id[k] = P.length; P.push(p); A.push([]); } return id[k]; };
  (lines || []).forEach(function(l){ for (var i = 1; i < l.length; i++){ var a = node(l[i - 1]), b = node(l[i]), d = tfwM(l[i - 1], l[i]); A[a].push([b, d]); A[b].push([a, d]); } });
  return { P:P, A:A };
}

function tfwNear(N, p){ var bi = -1, bd = Infinity; for (var i = 0; i < N.P.length; i++){ var d = tfwM(N.P[i], p); if (d < bd){ bd = d; bi = i; } } return [bi, bd]; }

function tfwPath(N, s, t){
  var n = N.P.length, D = [], prev = [], H = [[0, s]], i;
  for (i = 0; i < n; i++){ D.push(Infinity); prev.push(-1); }
  D[s] = 0;
  var push = function(x){ H.push(x); var k = H.length - 1; while (k > 0){ var q = (k - 1) >> 1; if (H[q][0] <= H[k][0]) break; var tmp = H[q]; H[q] = H[k]; H[k] = tmp; k = q; } };
  var pop = function(){ var top = H[0], last = H.pop(); if (H.length){ H[0] = last; var k = 0; for (;;){ var l = 2 * k + 1, r = l + 1, m = k; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === k) break; var tmp = H[m]; H[m] = H[k]; H[k] = tmp; k = m; } } return top; };
  H = []; push([0, s]);
  while (H.length){
    var cur = pop(), u = cur[1];
    if (cur[0] > D[u]) continue;
    if (u === t) break;
    N.A[u].forEach(function(e){ var nd = D[u] + e[1]; if (nd < D[e[0]]){ D[e[0]] = nd; prev[e[0]] = u; push([nd, e[0]]); } });
  }
  if (!isFinite(D[t])) return null;
  var pts = []; for (var v = t; v !== -1; v = prev[v]) pts.push(N.P[v]);
  return { pts:pts.reverse(), len:D[t] };
}

function tfwCampCalc(id){
  var f = tfwFloorOf(id), x = siteFind(id), R = TFW.routes && TFW.routes.floors ? TFW.routes.floors[String(f)] : null;
  if (f == null || !x || !R) return null;
  var c = [x.lat, x.lng], ex = siteFind('NSK-JMR-PNT-' + TFW_JEX[f]), E = ex ? [ex.lat, ex.lng] : TFW_JIN;
  var G = tfwNet((R.go || []).concat(R.train || [])), B = tfwNet((R.back || []).concat(R.train || [])), EN = (TFW.routes.ends || {}).en || {}, EX = (TFW.routes.ends || {}).ex || {};   /* (V26.0) خطُّ القطار جزءٌ من شبكة الدور الرابع */
  var a = tfwNear(G, c), h = tfwNear(B, c), p1 = null, p2 = null;
  /* (V24.8) الذهابُ ينتهي عند أقرب مدخلٍ من مداخل دوره، والعودةُ تبدأ من أقرب مخرجٍ من مخارجه — لا عند نقطةٍ ثابتة */
  (EN[f] || []).concat(EN[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, tp = q ? [q.lat, q.lng] : TFW_JIN, b = tfwNear(G, tp), p = a[0] >= 0 && b[0] >= 0 ? tfwPath(G, a[0], b[0]) : null; if (p && (!p1 || p.len < p1.len)) p1 = p; });
  (EX[f] || []).concat(EX[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, sp = q ? [q.lat, q.lng] : E, e = tfwNear(B, sp), p = e[0] >= 0 && h[0] >= 0 ? tfwPath(B, e[0], h[0]) : null; if (p && (!p2 || p.len < p2.len)) p2 = p; });
  if (!p1 || !p2) return null;
  return { id:id, f:f, go:{ pts:[c].concat(p1.pts), len:Math.round(p1.len + a[1]) }, back:{ pts:p2.pts.concat([c]), len:Math.round(p2.len + h[1]) } };
}

function tfwCampRoute(id){
  var f = tfwFloorOf(id); if (f == null) return;
  TFW.f = f; TFW.camp = null;
  var show = function(){
    var r = tfwCampCalc(id);
    if (!r){ toast(t('تعذر حساب مسار هذا المخيم')); return; }
    TFW.camp = r; tfwPaint(); render(1);
    try { MAP.fitBounds(L.latLngBounds(r.go.pts.concat(r.back.pts)), { padding:[40, 40] }); } catch (e){ LS_ERR = e; }
  };
  if (TFW.routes && TFW.data) show(); else { TFW.after = show; tfwLoad(); tfwPaint(); }
}

function fsecSet(k, on){ var o = fsecOpen(); if (on) o[k] = 1; else delete o[k]; try { lsSet('nsk14.fsec', JSON.stringify(o)); } catch (e){ LS_ERR = e; } }
