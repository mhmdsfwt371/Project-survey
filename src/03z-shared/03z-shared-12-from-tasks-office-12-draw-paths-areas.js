/* ============================================================================
   FILE    : src/03z-shared/03z-shared-12-from-tasks-office-12-draw-paths-areas.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-12-draw-paths-areas.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : tfdMay, tfdGraph, tfdMpp, tfdSnap, tfdPath, tfdAdd, tfdDrawn, tfdLen, tfdPanelHtml, drawFlag, routeAdd, geoDist … (+16 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V28.0) رسمُ مسارات التفويج من وإلى الجمرات — بيد المهندس، على الشوارع ═══
   قرارُ المالك: «خليني أرسم على الخريطة أنا بطريقةٍ بدون ما أنط فوق البيوت أو الخيام». يضغط نقاطًا على الخريطة، وكلُّ نقطةٍ
   تلتصق بأقرب عقدةِ شارعٍ وتُوصَل بما قبلها بأقصر طريقٍ على شبكة شوارع منى وممرّاتها (layers/mina-streets.json من بيانات
   الخرائط المفتوحة) — فلا يمرُّ الخطُّ إلا في شارع. يُحفَظ لكلِّ دورٍ واتجاهٍ في الإعدادات (settings/tfwdraw) فيصل
   الأجهزةَ كلَّها، ويُعرَض بدل المسار المولَّد لذلك الدور والاتجاه. للمهندس فما فوق. */
var TFD = { on:false, f:0, d:'go', nodes:[], paths:[], pts:[], free:false, g:null, busy:false };

/* (V28.1) بلاغُ المالك «في حاجات غلط في الرسم»: (١) الشبكةُ كانت منى وحدَها فكلُّ ضغطةٍ في مزدلفة وعرفات «بعيدٌ عن أيِّ شارع» — صارت
   منى ومزدلفة وعرفات؛ (٢) كان الالتصاقُ بأقرب «عقدة» فيبعد على الشوارع الطويلة المستقيمة أو يقفز لطرفها — صار بأقرب نقطةٍ على
   الشارع نفسِه (يُقسَم الضلعُ عندها) بمسافةٍ تتبع التكبير؛ (٣) «رسمٌ حرّ» للساحات وما لا شارعَ فيه بقرار الراسم؛ (٤) طريقٌ أطولُ
   بكثيرٍ من المستقيم يُنبَّه إليه؛ (٥) أقصرُ طريقٍ بكومةٍ ثنائيةٍ فلا يثقل على الشبكة الأكبر. */
function tfdMay(){ return typeof ROLE !== 'undefined' && typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('engineer'); }

function tfdGraph(){
  if (TFD.g) return Promise.resolve(TFD.g);
  if (TFD.busy) return TFD.busy;
  TFD.busy = fetch('layers/mashaer-streets.json').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    .then(function(d){ return (d && d.n) ? d : fetch('layers/mina-streets.json').then(function(r){ return r.ok ? r.json() : null; }); })   /* (V28.1) المشاعرُ كلُّها، ومنى احتياطًا */
    .then(function(d){
    TFD.busy = null; if (!d || !d.n) return null;
    var adj = d.n.map(function(){ return []; });
    d.e.forEach(function(e){ var a = d.n[e[0]], b = d.n[e[1]], len = geoDist(a, b); adj[e[0]].push([e[1], len]); adj[e[1]].push([e[0], len]); });
    TFD.g = { n:d.n.slice(), adj:adj, e:d.e.map(function(e){ return [e[0], e[1]]; }) }; return TFD.g;
  }).catch(function(e){ TFD.busy = null; LS_ERR = e; return null; });
  return TFD.busy;
}

function tfdMpp(lat){ var z = (typeof MAP === 'object' && MAP && MAP.getZoom) ? MAP.getZoom() : 16; return 40075016.686 * Math.cos(lat * Math.PI / 180) / Math.pow(2, z + 8); }

function tfdSnap(lat, lng){
  var g = TFD.g; if (!g || !g.e) return -1;
  var tol = Math.min(250, Math.max(20, tfdMpp(lat) * 36)), kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110574;
  var px = lng * kx, py = lat * ky, best = -1, bt = 0, bx2 = 0, by2 = 0, bd = 1e18, i;
  for (i = 0; i < g.e.length; i++){ var A = g.n[g.e[i][0]], B = g.n[g.e[i][1]], ax = A[1] * kx, ay = A[0] * ky, dx = B[1] * kx - ax, dy = B[0] * ky - ay, L2 = dx * dx + dy * dy;
    var tt = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0, cx = ax + tt * dx, cy = ay + tt * dy, d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 < bd){ bd = d2; best = i; bt = tt; bx2 = cx; by2 = cy; } }
  if (best < 0 || Math.sqrt(bd) > tol) return -1;
  var a = g.e[best][0], b = g.e[best][1], P = [+(by2 / ky).toFixed(6), +(bx2 / kx).toFixed(6)], la = geoDist(g.n[a], P), lb = geoDist(g.n[b], P);
  if (la < 3) return a; if (lb < 3) return b;
  var k = g.n.length; g.n.push(P); g.adj.push([[a, la], [b, lb]]); g.adj[a].push([k, la]); g.adj[b].push([k, lb]);
  g.e[best] = [a, k]; g.e.push([k, b]);   /* يُقسَم الضلعُ عند النقطة فالنقطتان على شارعٍ واحدٍ تُوصَلان مباشرةً */
  return k;
}

function tfdPath(a, b){
  var g = TFD.g; if (!g || a < 0 || b < 0) return null; if (a === b) return [g.n[a]];
  var dist = new Map(), prev = new Map(), H = [[0, a]]; dist.set(a, 0);
  var push = function(x){ H.push(x); var i = H.length - 1; while (i){ var p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; var q = H[p]; H[p] = H[i]; H[i] = q; i = p; } };
  var pop = function(){ var top = H[0], last = H.pop(); if (H.length){ H[0] = last; var i = 0; for (;;){ var l = 2 * i + 1, r = l + 1, m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; var q = H[m]; H[m] = H[i]; H[i] = q; i = m; } } return top; };
  while (H.length){ var cur = pop(), u = cur[1]; if (cur[0] > dist.get(u)) continue; if (u === b) break; if (cur[0] > 8000) break;
    var ad = g.adj[u]; for (var i = 0; i < ad.length; i++){ var v = ad[i][0], nd = cur[0] + ad[i][1]; if (!dist.has(v) || nd < dist.get(v)){ dist.set(v, nd); prev.set(v, u); push([nd, v]); } } }
  if (!dist.has(b)) return null;
  var out = [], k = b; while (k != null){ out.push(g.n[k]); if (k === a) break; k = prev.get(k); } return out.reverse();
}

function tfdAdd(lat, lng){
  if (!TFD.g){ tfdGraph().then(function(g){ if (g) tfdAdd(lat, lng); }); return; }
  TFD.pts = TFD.pts || [];
  var free = !!TFD.free, n = free ? -1 : tfdSnap(lat, lng);
  if (!free && n < 0){ toast(t('لا شارعَ قريبًا هنا — قرّب الخريطةَ واضغط على الشارع نفسِه، أو فعّل «رسمٌ حرّ» لهذا المقطع')); return; }
  var pt = n >= 0 ? TFD.g.n[n] : [+lat.toFixed(6), +lng.toFixed(6)];
  if (TFD.pts.length){
    var lastN = TFD.nodes[TFD.nodes.length - 1], lastP = TFD.pts[TFD.pts.length - 1], path;
    if (n >= 0 && lastN === n) return;
    if (n >= 0 && lastN >= 0){
      path = tfdPath(lastN, n);
      if (!path){ toast(t('لا طريقَ على الشوارع بين النقطتين — أضف نقطةً بينهما أو فعّل «رسمٌ حرّ»')); return; }
      var str = geoDist(lastP, pt), len = tfdLen([path]);
      if (str > 60 && len > str * 3.5) toast(t('الطريقُ على الشوارع أطولُ كثيرًا من المستقيم — راجعه، وأضف نقطةً وسطى إن لزم'));
    } else path = [lastP, pt];
    TFD.paths.push(path);
  }
  TFD.nodes.push(n); TFD.pts.push(pt);
  if (typeof mapPaint === 'function') mapPaint(); render(1);
}

function tfdDrawn(){ var o = (CFG.tfwdraw && CFG.tfwdraw.floors) || {}; return o; }

function tfdLen(pls){ var m = 0; (pls || []).forEach(function(pl){ for (var i = 1; i < pl.length; i++) m += geoDist(pl[i - 1], pl[i]); }); return m; }

function tfdPanelHtml(){
  if (!TFD.on) return '';
  var m = Math.round(tfdLen(TFD.paths));
  return '<div class="map-panel"><div style="font-weight:700;margin:0 0 6px">\u{1F6B6} ' + esc(t('رسم مسار التفويج')) + '</div>'
    + '<div class="grid cols-2"><div class="field"><label>' + esc(t('الدور')) + '</label><select data-tfdf="1">' + TFW_FL.map(function(n, i){ return '<option value="' + i + '"' + (TFD.f === i ? ' selected' : '') + '>' + esc(t(n)) + '</option>'; }).join('') + '</select></div>'
    + '<div class="field"><label>' + esc(t('الاتجاه')) + '</label><select data-tfdd="1"><option value="go"' + (TFD.d === 'go' ? ' selected' : '') + '>' + esc(t('الذهاب')) + '</option><option value="back"' + (TFD.d === 'back' ? ' selected' : '') + '>' + esc(t('العودة')) + '</option></select></div></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t('اضغط على الخريطة نقطةً بعد نقطة؛ كلُّ نقطةٍ تلتصق بأقرب شارع وتُوصَل بما قبلها على الشوارع وحدَها.')) + ' ' + nm(TFD.nodes.length) + ' ' + esc(t('نقطة')) + ' \u00b7 ' + nm(m) + ' ' + esc(t('م')) + '</p>'
    + '<div class="actions" style="margin:0 0 6px">' + btn((TFD.free ? '\u2713 ' : '') + t('رسمٌ حرّ (ساحةٌ أو ما لا شارعَ فيه)'), TFD.free ? 'btn-secondary btn-sm' : 'btn-quiet btn-sm', ' data-tfdfree="1"') + '</div>'   /* (V28.1) */
    + '<div class="actions" style="margin:0">' + btn('\u{1F4BE} ' + t('احفظ المسار'), 'btn-primary btn-sm', ' data-tfdsave="1"') + btn('\u21A9 ' + t('تراجع'), 'btn-quiet btn-sm', ' data-tfdundo="1"') + btn('\u2716 ' + t('إلغاء'), 'btn-quiet btn-sm', ' data-tfdcancel="1"') + '</div></div>';
}

var ROUTE = { on:false, mode:'line', pts:[], every:250, zone:'منى', type:'ممر', name:'',
              gen:null, moved:0, sq:'', sign:'' }, RT_MIN = false;

/* المسافةُ بيد الراسم (V17.58): أدناها خمسةُ أمتار لا خمسةٌ وعشرون، والعددُ
   مسقوفٌ فلا يولِّد طريقٌ طويلٌ بمسافةٍ صغيرةٍ آلافَ النقاط؛ والسحبُ بالإصبع لما
   دون الثلاثمئة — فوقها تُرسَم نقاطًا لا علاماتٍ تُسحَب */
var RT_EVERY_MIN = 5, RT_CAP = 1000, RT_DRAG_MAX = 300;

function drawFlag(){
  try { document.body.classList.toggle('drawing', !!(ROUTE && ROUTE.on) || (typeof PIN_ON !== 'undefined' && PIN_ON)); }
  catch (e){ LS_ERR = e; }
}

function routeAdd(lat, lng){
  /* بعد تحريك نقطةٍ تثبت المجموعة: الضغطةُ لا تضيف رأسًا بالخطأ (V17.58) */
  if (ROUTE.gen){ toast(t('النقاطُ مثبَّتةٌ بعد التحريك — «أعد التوليد» لتعديل الرسم')); return; }
  ROUTE.pts.push([lat, lng]);
  if (typeof mapPaint === 'function') mapPaint();
  render(1);
}

/* المسافةُ بالمتر بين نقطتين — هافرساين مبسّطة تكفي مسافاتِ المشاعر */
function geoDist(a, b){
  var R = 6371000, p = Math.PI / 180;
  var dLat = (b[0] - a[0]) * p, dLng = (b[1] - a[1]) * p;
  var la = a[0] * p, lb = b[0] * p;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function routePoints(){
  var P = ROUTE.pts, every = Math.max(RT_EVERY_MIN, cfgN(ROUTE.every) || 250);
  if (P.length < 2) return [];
  var out = [P[0]], carry = 0;
  for (var i = 1; i < P.length; i++){
    var a = P[i - 1], b = P[i], seg = geoDist(a, b);
    if (seg <= 0) continue;
    var t0 = (every - carry) / seg;
    while (t0 <= 1 && out.length < RT_CAP){
      out.push([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]);
      t0 += every / seg;
    }
    carry = (carry + seg) % every;
  }
  return out;
}

function routeLen(){
  var P = ROUTE.pts, d = 0;
  for (var i = 1; i < P.length; i++) d += geoDist(P[i - 1], P[i]);
  return Math.round(d);
}

/* ═══ النقاطُ تُسحَب قبل الحفظ (V17.58) ═══
   ما تولّده المسافةُ اقتراحٌ لا قيد: عمودٌ هنا ومدخلُ مخيمٍ هناك يزيحان النقطةَ
   أمتارًا. فتُسحَب كلُّ نقطةٍ بالإصبع قبل الحفظ؛ وأوّلُ سحبٍ يثبّت المجموعةَ
   (ROUTE.gen) فلا تعيد الضغطةُ أو المسافةُ توليدَها فيضيعَ التحريك — و«أعد
   التوليد» يرجعها إلى المسافة. والتثبيتُ عند بدء السحب بلا إعادة رسم: الرسمُ
   يمحو العلامةَ المسحوبةَ من تحت الإصبع. */
function routeGen(){ return ROUTE.gen || routePoints(); }

function routeFreeze(){
  if (!ROUTE.gen) ROUTE.gen = routePoints().map(function(p){ return [p[0], p[1]]; });
  return ROUTE.gen;
}

function routeMovePt(i, lat, lng){
  var G = routeFreeze();
  if (!G[i] || !(+lat) || !(+lng)) return false;
  G[i] = [+lat, +lng];
  ROUTE.moved = (ROUTE.moved || 0) + 1;
  render(1);
  return true;
}

/* رأسُ المساحة يُسحَب كذلك — والحدودُ أو الشبكةُ تتبعه */
function routeMoveVx(i, lat, lng){
  if (!ROUTE.pts[i] || !(+lat) || !(+lng)) return false;
  ROUTE.pts[i] = [+lat, +lng];
  render(1);
  return true;
}

function routeCount(){
  if (ROUTE.mode === 'area') return ROUTE.type === 'مخيم' ? (ROUTE.pts.length > 2 ? 1 : 0) : areaPoints().length;
  return routeGen().length;
}

/* ═══ مساحةٌ تُرسَم فتُملأ بشبكة نقاط (V17.45) ═══
   مواقفُ الأتوبيسات وتجمّعاتُها مساحاتٌ لا خطوط: نقطةٌ كلَّ خمسين مترًا في
   عرضها وطولها لا على استقامةٍ واحدة. فيُرسَم المضلَّعُ نقرةً بعد نقرة، ثم
   يُقال «كلَّ كم مترًا» فتُملأ شبكةٌ داخلَه وحدَه — وما وقع خارجَ حدوده
   يُسقَط. ويُعرَض العددُ قبل الحفظ كالمسار. */
function polyIn(p, poly){
  var x = p[1], y = p[0], inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++){
    var xi = poly[i][1], yi = poly[i][0], xj = poly[j][1], yj = poly[j][0];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside;
  }
  return inside;
}

function areaPoints(){
  var P = ROUTE.pts, every = Math.max(RT_EVERY_MIN, cfgN(ROUTE.every) || 250);
  if (P.length < 3) return [];
  var lats = P.map(function(p){ return p[0]; }), lngs = P.map(function(p){ return p[1]; });
  var la0 = Math.min.apply(null, lats), la1 = Math.max.apply(null, lats);
  var ln0 = Math.min.apply(null, lngs), ln1 = Math.max.apply(null, lngs);
  var dLat = every / 111320;                                   /* مترٌ إلى درجةِ عرض */
  var dLng = every / (111320 * Math.cos((la0 + la1) / 2 * Math.PI / 180) || 1);
  var out = [];
  for (var la = la0 + dLat / 2; la <= la1 && out.length < 2000; la += dLat)
    for (var ln = ln0 + dLng / 2; ln <= ln1 && out.length < 2000; ln += dLng)
      if (polyIn([la, ln], P)) out.push([la, ln]);
  return out;
}

function polyOf(x){
  var F = x && x.poly, out = [];
  if (!Array.isArray(F)) return out;
  for (var i = 0; i + 1 < F.length; i += 2) if (+F[i] && +F[i + 1]) out.push([+F[i], +F[i + 1]]);
  return out;
}

/* حدودُ المخيم: المرسومةُ في التطبيق أوّلًا ثم poly.json — حلقةً [طول، عرض]
   كما يقرؤها المحرّكان المسطّحُ والثلاثي */
function campFoot(x){
  if (!x || x.type !== 'مخيم') return null;
  var P = polyOf(x);
  if (P.length >= 3) return P.map(function(p){ return [p[1], p[0]]; });
  var R = (typeof POLY === 'object' && POLY && POLY[x.id] && POLY[x.id].length >= 3) ? POLY[x.id] : null;
  /* (V28.6) بلاغُ المشرف: «المخيمُ على الخريطة إذا قرّبت يختفي وإذا صغّرت يظهر». حدودُ ٧٩ مخيمًا في ملف الحدود مرسومةٌ بعيدًا
     عن علامتها (حتى كيلومترين) — فعند التقريب تُرسَم الحدودُ هناك وتختفي العلامةُ من مكانها. الحدودُ التي يبعد مركزُها عن
     العلامة أكثرَ من ستين مترًا تُترَك فتبقى العلامةُ في كلِّ تكبير — حتى تُعدَّل الحدودُ بيد المهندس. */
  if (R && +x.lat && +x.lng){
    if (!campFoot.bad) campFoot.bad = {};
    var bk = x.id + '|' + x.lat + '|' + x.lng + '|' + R.length + '|' + R[0][0] + '|' + R[0][1];   /* الحدودُ إن تبدّلت يُعاد الحساب */
    if (campFoot.bad[bk] == null){
      var cy = 0, cx = 0; R.forEach(function(q){ cx += q[0]; cy += q[1]; }); cx /= R.length; cy /= R.length;
      var dy = (cy - x.lat) * 110574, dx = (cx - x.lng) * 111320 * Math.cos(x.lat * Math.PI / 180);
      campFoot.bad[bk] = Math.sqrt(dx * dx + dy * dy) > 60;
    }
    if (campFoot.bad[bk]) return null;
  }
  return R;
}

function areaCampHits(){
  var P = ROUTE.pts;
  if (P.length < 3) return [];
  return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && +x.lat && +x.lng && polyIn([+x.lat, +x.lng], P); });
}

/* ═══ نقطةٌ يضعها المكتبُ باختيار موضعها (V17.44) ═══
   كانت الإضافةُ مربوطةً بموضع صاحب الجهاز: «التقط موضعي» — وهي كذلك للفنيِّ
   واقفًا عند النقطة. أما المكتبُ فيضيف نقاطًا لم يقف عندها أحدٌ بعد ليمسحها
   الميدان، فيلزمه أن **يختار الموضعَ على الخريطة**. فصار زرٌّ يضع النقطةَ
   حيث تضغط، ثم يُفتَح النموذجُ نفسُه بإحداثياتها — بلا مسارٍ ثانٍ ولا جدول. */
var PIN_ON = false;

function pinApply(lat, lng){
  PIN_ON = false; drawFlag();
  NEWSITE.lat = lat; NEWSITE.lng = lng;
  NEWSITE.byMap = true;
  CUR = 'newsite';
  toast(t('وُضعت النقطةُ — أكمل بياناتها'));
  render(1);
}

function moveApply(lat, lng){
  var s = siteFind(MOVE_ID);
  if (!s) { MOVE_ID = ''; return; }
  var old = { lat:s.lat, lng:s.lng };
  s.lat = lat; s.lng = lng;
  /* (V32.2) بلاغُ المالك: «حرّكت نقاط الزايدي من الآيفون ولم تظهر على الأندرويد ولم تُحفَظ». كان التحريكُ يُكتَب في سجلِّ الزيارة
     (rec.loc) وحدَه، ولا شيءَ يطبّقه على النقطة في الأجهزة الأخرى ولا بعد إعادة الفتح — وكان يُنشئ «زيارةً» لنقطةٍ لم تُزَر فتُحسَب
     ممسوحة. صار يُكتَب تجاوزًا للموقع (sites) تطبّقه كلُّ الأجهزة، ويغلب إحداثيةَ الوثيقة الأصلية، ولا يُنشئ زيارة. */
  siteOvSet(s.id, { lat:lat, lng:lng, movedFrom:old, movedAt:Date.now(), movedBy:STATE.meta.name || '' });
  var rec = STATE.recs[s.id];
  if (rec){   /* لها زيارةٌ فعلًا: يبقى الأثرُ فيها وتعود للمراجعة كما كان */
    rec = Object.assign({}, rec, { moved:{ lat:lat, lng:lng, from:old, at:Date.now(), by:STATE.meta.name || '' } });   /* (V38.78) was written over rec.loc — the location choice */
    if (rec.review === 'approved' || !rec.review) rec.review = 'pending';
    CORE.set('recs', s.id, rec);
  }
  logEvent('تحريك موقع — ' + s.id, s.id);
  toast(t('حُرِّك الموقع') + ' · ' + nm(Math.round(distKm(old, { lat:lat, lng:lng }) * 1000)) + ' ' + t('م'));
  MOVE_ID = '';
  POP_SITE = s.id; POP_OPEN = true;
  statBump();
  render(1);
  if (MAP) mapPaint();
}

function moveBar(){
  if (!MOVE_ID) return '';
  var s = siteFind(MOVE_ID);
  return '<div class="map-selbar" style="background:rgba(127,179,255,.96);color:#04121f">'
    + '<span>' + esc(t('اضغط على الموقع الجديد لـ')) + ' <b>' + esc(MOVE_ID) + '</b></span>'
    + '<div class="actions" style="margin-inline-start:auto">'
    + btn('إلغاء','btn-secondary btn-sm',' data-movex="1"') + '</div></div>';
}

/* ── وسمُ الحالة: يكتب فعلًا ──
   (V28.3) بلاغُ الوزارة: «مسحنا المخيم مراتٍ ولم يُضَف». السبب: زرُّ «تمت الزيارة» في نافذة النقطة كان يبدّل — وحين تكون
   للنقطة زيارةٌ يحذف سجلَّها كلَّه بضغطةٍ بلا تأكيد، حتى لو كان مسحًا كاملًا بصوره وتحدياته؛ وشكلُه المملوءُ يوحي بأنه
   حالةٌ لا زرّ. صار: المسحُ الكاملُ لا يُحذف من هنا أبدًا، والزيارةُ السريعةُ وحدَها تُلغى وبتأكيد، والزرُّ يقول ما يفعل. */
function recIsQuick(rec){ if (!rec) return false; return Object.keys(rec).every(function(k){ return ['id','by','at','quick','_v','_t','_by','_at','upd','v','deleted'].indexOf(k) > -1 || rec[k] == null || rec[k] === '' || (Array.isArray(rec[k]) && !rec[k].length); }); }
