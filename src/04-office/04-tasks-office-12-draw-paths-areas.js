/* ═══ مسارٌ يُرسَم على الخريطة فتُولَّد نقاطُه (V17.45) ═══
   طريقٌ طولُه كيلومترات تُراد فيه نقطةٌ كلَّ مئتين وخمسين مترًا: وضعُها واحدةً
   واحدةً عملُ يومٍ ويُخطئ. فيُرسَم المسارُ نقرةً بعد نقرةٍ على الخريطة، ثم
   يُقال «كلَّ كم مترًا» فتُولَّد النقاطُ على استقامته بالمسافة المطلوبة —
   يُعرَض عددُها قبل الحفظ، ولا تُكتَب إلا بضغطةٍ ثانية. والإحداثياتُ من
   الخريطة لا من تقديرٍ، فما يُرسَم هو ما يُحفَظ. */
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
function tfdStart(f, d){
  if (!tfdMay()){ toast(t('رسمُ المسارات للمهندس فما فوق')); return; }
  TFD.on = true; TFD.f = (f == null ? TFD.f : +f); TFD.d = d || TFD.d; TFD.nodes = []; TFD.paths = []; TFD.pts = []; POP_OPEN = false; PIN_ON = false; if (typeof ROUTE === 'object') ROUTE.on = false;
  tfdGraph().then(function(g){ toast(t(g ? 'اضغط على الخريطة نقطةً بعد نقطة — الخطُّ يمشي على الشوارع وحدَها' : 'تعذّر تحميلُ شبكة الشوارع — تحقّق من الشبكة')); });
  if (typeof TFW === 'object' && TFW.f < 0){ TFW.f = TFD.f; tfwLoad(); tfwPaint(); }
  if (typeof mapPaint === 'function') mapPaint(); render(1);
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
function tfdUndo(){ TFD.nodes.pop(); if (TFD.pts) TFD.pts.pop(); if (TFD.paths.length >= TFD.nodes.length && TFD.paths.length) TFD.paths.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1); }
function tfdCancel(){ TFD.on = false; TFD.nodes = []; TFD.paths = []; TFD.pts = []; TFD.free = false; if (typeof mapPaint === 'function') mapPaint(); render(1); }
function tfdDrawn(){ var o = (CFG.tfwdraw && CFG.tfwdraw.floors) || {}; return o; }
function tfdLen(pls){ var m = 0; (pls || []).forEach(function(pl){ for (var i = 1; i < pl.length; i++) m += geoDist(pl[i - 1], pl[i]); }); return m; }
function tfdSave(){
  if (!tfdMay() || !TFD.paths.length){ toast(t('ارسم نقطتين على الأقل')); return false; }
  var pl = []; TFD.paths.forEach(function(p, i){ p.forEach(function(pt, j){ if (i && j === 0) return; pl.push([+pt[0].toFixed(6), +pt[1].toFixed(6)]); }); });
  var all = JSON.parse(JSON.stringify(tfdDrawn())); var fl = all[TFD.f] = all[TFD.f] || {}; var arr = fl[TFD.d] = fl[TFD.d] || []; arr.push(pl);
  CFG.tfwdraw = { floors:all, at:Date.now(), by:STATE.meta.name || '' }; CORE.set('cfg', 'tfwdraw', CFG.tfwdraw);
  logEvent('رسمُ مسار تفويج — ' + t('الدور') + ' ' + t(TFW_FL[TFD.f]) + ' · ' + t(TFD.d === 'go' ? 'الذهاب' : 'العودة') + ' · ' + Math.round(tfdLen([pl])) + ' م', '');
  toast(t('حُفظ المسارُ — يُعرَض على الأجهزة كلِّها بدل المولَّد')); TFD.nodes = []; TFD.paths = []; TFD.pts = [];
  if (typeof TFW === 'object'){ TFW.f = TFD.f; tfwPaint(); } if (typeof mapPaint === 'function') mapPaint(); render(1); return true;
}
function tfdClear(f, d){
  if (!tfdMay()) return; var all = JSON.parse(JSON.stringify(tfdDrawn())); if (!all[f] || !all[f][d]) return; delete all[f][d]; if (!Object.keys(all[f]).length) delete all[f];
  CFG.tfwdraw = { floors:all, at:Date.now(), by:STATE.meta.name || '' }; CORE.set('cfg', 'tfwdraw', CFG.tfwdraw); logEvent('حذفُ مسار تفويج مرسوم — ' + t('الدور') + ' ' + t(TFW_FL[f]) + ' · ' + t(d === 'go' ? 'الذهاب' : 'العودة'), '');
  if (typeof TFW === 'object' && TFW.f >= 0) tfwPaint(); render(1);
}
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
function routeStart(mode){
  if (!may('settings')){ toast(t('إضافةُ النقاط للمكتب')); return; }
  ROUTE.on = true; ROUTE.mode = (mode === 'area' ? 'area' : 'line'); ROUTE.pts = []; POP_OPEN = false; PIN_ON = false;
  ROUTE.gen = null; ROUTE.moved = 0;
  RT_MIN = false; drawFlag();
  if (ROUTE.mode === 'area' && ROUTE.every === 250) ROUTE.every = 50;
  /* المساحةُ للمخيم أوّلًا (V17.59): تُرسَم حدودُه فيُحفَظ مخيمًا واحدًا بلا نقاط —
     وغيرُه من الأنواع يبقى شبكةَ نقاطٍ كالمواقف. والمسارُ لا يكون مخيمًا. */
  if (ROUTE.mode === 'area') ROUTE.type = 'مخيم';
  else if (ROUTE.type === 'مخيم') ROUTE.type = 'ممر';
  toast(t(ROUTE.mode === 'area' ? 'ارسم حدودَ المخيم: اضغط على الخريطة حول حدوده' : 'ارسم المسار: اضغط على الخريطة نقطةً بعد نقطة'));
  render(1);
}
function routeAdd(lat, lng){
  /* بعد تحريك نقطةٍ تثبت المجموعة: الضغطةُ لا تضيف رأسًا بالخطأ (V17.58) */
  if (ROUTE.gen){ toast(t('النقاطُ مثبَّتةٌ بعد التحريك — «أعد التوليد» لتعديل الرسم')); return; }
  ROUTE.pts.push([lat, lng]);
  if (typeof mapPaint === 'function') mapPaint();
  render(1);
}
function routeUndo(){
  if (ROUTE.gen){ routeRegen(); return; }   /* التراجعُ بعد التحريك يرجع إلى المسافة أوّلًا */
  ROUTE.pts.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1);
}
function routeCancel(){ ROUTE.on = false; ROUTE.pts = []; ROUTE.gen = null; ROUTE.moved = 0; drawFlag(); if (typeof mapPaint === 'function') mapPaint(); render(1); }
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
function routeRegen(){
  ROUTE.gen = null; ROUTE.moved = 0;
  render(1);
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
/* الكتابةُ في حقول اللوح لا تُعيد بناءَه: كان كلُّ رقمٍ يُعيد رسمَ اللوح والخريطة
   معًا — ثقيلٌ، وعلى الهاتف قد تُغلَق لوحةُ المفاتيح بعد أوّل رقم. فيُحدَّث العددُ
   والخريطةُ في مكانهما، ويُعاد اللوحُ عند الخروج من الحقل (V17.58). */
function routeLive(){
  var el = document.getElementById('rtN');
  if (el) el.textContent = nm(routeCount());
  if (typeof mapPaintDebounced === 'function') mapPaintDebounced();
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
/* ═══ المساحةُ مخيمٌ بحدوده (V17.59) ═══
   رسمُ مساحةٍ حول مخيمٍ يقول «هذا مخيم» لا «املأه نقاطًا»: المخيمُ نقطةُ قراءةٍ
   واحدة، وحدودُه هي ما يُرى على الخريطة ويُرفَع في الثلاثي. فيُحفَظ مخيمًا
   واحدًا بحدوده ومركزه — وإن ضمّت الحدودُ مخيمًا مسجَّلًا واحدًا رُبطت به ولا
   يُنشأ مكرَّر، وإن ضمّت أكثرَ طُلب رسمُ مخيمٍ واحد. والحدودُ تُخزَّن أرقامًا
   متتاليةً [عرض، طول، …] لأن القاعدةَ ترفض المصفوفاتِ المتداخلة. */
function polyFlat(P){
  var out = [];
  P.forEach(function(p){ out.push(+(+p[0]).toFixed(6), +(+p[1]).toFixed(6)); });
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
function polyCentroid(P){
  var a = 0, cx = 0, cy = 0, m = [0, 0];
  for (var i = 0, j = P.length - 1; i < P.length; j = i++){
    var f = P[j][0] * P[i][1] - P[i][0] * P[j][1];
    a += f; cx += (P[j][0] + P[i][0]) * f; cy += (P[j][1] + P[i][1]) * f;
  }
  P.forEach(function(p){ m[0] += p[0] / P.length; m[1] += p[1] / P.length; });
  if (Math.abs(a) < 1e-12) return m;
  var c = [cx / (3 * a), cy / (3 * a)];
  /* المضلَّعُ المقعَّرُ قد يقع مركزُه خارجه — فالمتوسّطُ، ثم أوّلُ رأس */
  return polyIn(c, P) ? c : (polyIn(m, P) ? m : [P[0][0], P[0][1]]);
}
function areaCampHits(){
  var P = ROUTE.pts;
  if (P.length < 3) return [];
  return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && +x.lat && +x.lng && polyIn([+x.lat, +x.lng], P); });
}
function areaCampSave(){
  var P = ROUTE.pts;
  if (P.length < 3){ toast(t('ارسم ثلاثَ نقاطٍ على الأقل لتحديد المساحة')); return false; }
  var sq = String(ROUTE.sq || '').trim(), sign = String(ROUTE.sign || '').trim();
  if (sq && !NS_SQ_RE.test(sq)){ toast(t('رقم المربع: أرقامٌ أو أرقام-أرقام — مثال 7 أو 7-14')); return false; }
  if (sign && !NS_SIGN_RE.test(sign)){ toast(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')); return false; }
  var hits = areaCampHits();
  if (hits.length > 1){ toast(nm(hits.length) + ' ' + t('مخيماتٍ مسجَّلةٍ داخل الحدود — ارسم حدودَ مخيمٍ واحد')); return false; }
  var flat = polyFlat(P), who = STATE.meta.name || '', stamp = Date.now();
  if (hits.length === 1){
    /* مخيمٌ مسجَّل: تُربَط به الحدودُ ولا يُنشأ غيرُه — والمربعُ والشاخصُ يُكمَلان إن غابا */
    var x = hits[0];
    var patch = { poly:flat, polyBy:who, polyAt:stamp };
    if (sq && !x.sq) patch.sq = sq;
    if (sign && !x.sign) patch.sign = sign;
    Object.assign(x, patch);
    if (x.isNew) CORE.set('newsites', x.id, x);
    else siteOvSet(x.id, patch);
    SITE_IX = null; SITE_TOK = null;
    statBump();
    logEvent('حدودُ مخيم — ' + x.id + ' \u00b7 ' + nm(P.length) + ' رأسًا', x.id);
    toast(x.id + ' \u00b7 ' + t('رُبطت الحدودُ بالمخيم المسجَّل'));
    routeCancel();
    return x.id;
  }
  var zone = ROUTE.zone || 'منى';
  var pre = zoneCode(zone);
  var id = 'NSK-' + pre + '-CMP-A' + String(stamp).slice(-6);
  var c = polyCentroid(P);
  var name = String(ROUTE.name || '').trim()
          || (zone + (sq ? ' - مربع ' + sq : '') + (sign ? ' - شاخص ' + sign : '') + (sq || sign ? '' : ' - مخيم ' + id.split('-').pop()));
  var site = { id:id, name:name, zone:zone, type:'مخيم', work:'موقع جديد',
    lat:+c[0].toFixed(6), lng:+c[1].toFixed(6), sq:sq, sign:sign, co:'', region:'منطقة ' + zone,
    fstat:'لم يبدأ', inout:'', isNew:true, approved:false, by:who, at:stamp,
    origin:'office', src:'area', poly:flat };
  STATE.sites.push(site);
  CORE.set('newsites', id, site);
  SITE_IX = null; SITE_TOK = null;
  statBump();
  stepDone('newsite', id, 'مخيمٌ بحدوده — أضافه المكتب', 0);
  notifPush('موقع مقترح', 'موقعٌ جديدٌ بانتظار اعتمادك — ' + zone, { site:id, lv:'مهم' });
  logEvent('مخيمٌ جديدٌ بحدوده — ' + id + ' \u00b7 ' + zone, id);
  routeCancel();
  /* المكتبُ رسمه ولم يزره — تُجدوَل زيارتُه الآن (V17.57) */
  visitAsnOpen([id], true);
  toast(id + ' \u00b7 ' + t('مخيمٌ بحدوده — جدوِل زيارتَه الآن'));
  return id;
}
function routeSave(){
  if (ROUTE.mode === 'area' && ROUTE.type === 'مخيم'){ areaCampSave(); return; }
  var pts = ROUTE.mode === 'area' ? areaPoints() : routeGen();
  if (ROUTE.mode === 'area' && pts.length < 1){ toast(t('ارسم ثلاثَ نقاطٍ على الأقل لتحديد المساحة')); return; }
  if (ROUTE.mode !== 'area' && pts.length < 2){ toast(t('ارسم نقطتين على الأقل')); return; }
  if (!ROUTE.zone || !ROUTE.type){ toast(t('اختر المشعر والنوع')); return; }
  var base = String(ROUTE.name || '').trim() || (t(ROUTE.type) + ' ' + t(ROUTE.zone));
  var pre = 'NSK-' + zoneCode(ROUTE.zone) + '-' + ({ 'LPR':'LPR', 'كاميرا':'CAM', 'جيت واي':'GTW', 'حساس حرارة ورطوبة':'THS' }[ROUTE.type] || 'COR') + '-';
  var n = 0, stamp = Date.now(), made = [];
  pts.forEach(function(p, i){
    var id = pre + String(stamp).slice(-6) + '-' + String(i + 1);
    var site = { id:id, name:base + ' — ' + nm(i + 1),
      zone:ROUTE.zone, type:ROUTE.type, work:'موقع جديد',
      lat:p[0], lng:p[1], sq:'', sign:'', co:'', region:'منطقة ' + ROUTE.zone,
      fstat:'لم يبدأ', inout:'', isNew:true, approved:false,
      by:STATE.meta.name || '', at:stamp, route:base, every:cfgN(ROUTE.every) || 250,
      origin:'office', moved:ROUTE.gen ? 1 : 0 };
    STATE.sites.push(site);
    CORE.set('newsites', id, site);
    made.push(id);
    n++;
  });
  SITE_IX = null; SITE_TOK = null;
  logEvent('مسارٌ جديد — ' + base + ' · ' + nm(n) + ' نقطة كلَّ ' + nm(cfgN(ROUTE.every) || 250) + ' متر');
  routeCancel();
  /* نقاطُ المكتب لم يزرها أحد — يُفتَح لوحُ الإسناد عليها لتُجدوَل زيارتُها (V17.57) */
  visitAsnOpen(made, true);
  toast(nm(n) + ' ' + t('نقطةً أُضيفت على المسار') + ' \u00b7 ' + t('جدوِل زيارتَها'));
  if (typeof mapPaint === 'function') mapPaint();
}

/* ═══ نقطةٌ يضعها المكتبُ باختيار موضعها (V17.44) ═══
   كانت الإضافةُ مربوطةً بموضع صاحب الجهاز: «التقط موضعي» — وهي كذلك للفنيِّ
   واقفًا عند النقطة. أما المكتبُ فيضيف نقاطًا لم يقف عندها أحدٌ بعد ليمسحها
   الميدان، فيلزمه أن **يختار الموضعَ على الخريطة**. فصار زرٌّ يضع النقطةَ
   حيث تضغط، ثم يُفتَح النموذجُ نفسُه بإحداثياتها — بلا مسارٍ ثانٍ ولا جدول. */
var PIN_ON = false;
/* ═══ لكلِّ وضعٍ مخرجٌ ظاهر (V17.53) ═══
   «نقطة هنا» يُسلِّح الضغطةَ التالية، وأزرارُ الخريطة العائمةُ تختفي أثناءه
   (V17.48) كي لا تحجب موضعَ الضغط — فلم يبقَ زرٌّ يُلغيه، ومن بدأه بالخطأ
   لا يجد منه مخرجًا إلا أن يضع نقطةً لا يريدها. فصار له شريطٌ ظاهرٌ يقول ما
   ينتظره ومعه «إلغاء»، ومفتاحُ الهروب يُلغيه، وضغطةُ الزرِّ نفسِه تُطفئه. */
function pinCancel(){
  if (!PIN_ON) return;
  PIN_ON = false; drawFlag();
  toast(t('أُلغي وضعُ النقطة'));
  render(1);
}
function pinStart(){
  if (PIN_ON){ pinCancel(); return; }
  if (!may('settings') && ROLE !== 'viewer'){ toast(t('إضافةُ النقاط للمكتب')); return; }
  PIN_ON = true; POP_OPEN = false; drawFlag();
  toast(t('اضغط على الخريطة حيث تريد النقطة'));
  render(1);
}
function pinApply(lat, lng){
  PIN_ON = false; drawFlag();
  NEWSITE.lat = lat; NEWSITE.lng = lng;
  NEWSITE.byMap = true;
  CUR = 'newsite';
  toast(t('وُضعت النقطةُ — أكمل بياناتها'));
  render(1);
}
/* ── التحريك: نقرةٌ على الخريطة تنقل النقطة ── */
function moveStart(id){
  MOVE_ID = id;
  POP_OPEN = false;
  toast(t('اضغط على الموقع الجديد على الخريطة'));
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
    rec = Object.assign({}, rec, { loc:{ lat:lat, lng:lng, from:old, at:Date.now(), by:STATE.meta.name || '' } });
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
function markSurvey(id){
  if (!may('approve')){ toast(t('الزيارةُ من «نموذج المسح» — وتسجيلُها مباشرةً للمهندس')); return; }   /* (V28.7) */
  var rec = STATE.recs[id];
  if (rec){
    /* (V28.4) قرارُ المالك: «مفيش أي حاجة تتحذف دلوقتي — المهمُّ الشبابُ في الميدان يسجّلوا الزيارات وتتسجّل فعلًا». لا حذفَ لزيارة. */
    toast(t(recIsQuick(rec) ? 'الزيارةُ مسجّلة — حذفُ الزيارات موقوفٌ الآن؛ للتصحيح افتح «تعديل المسح»' : 'هذه زيارةٌ بنموذج مسحٍ كامل — لا تُلغى من هنا؛ للتصحيح افتح «تعديل المسح»'));
    return;   /* (V31.4) كان بعده حذفُ الزيارة وحدثُها — كودٌ ميتٌ منذ إيقاف الحذف (V28.4) */
  } else {
    CORE.set('recs', id, {
      id:id, by:STATE.meta.name || '', at:Date.now(), quick:1
    });
    logEvent('تمت الزيارة بقرار المهندس — ' + id, id);
    toast(t('سُجّلت الزيارة — بقرار المهندس'));
  }
  statBump(); render(1);
  if (MAP) mapPaint();
}

function markInstall(id, status){
  var s = siteFind(id);
  var cur = STATE.inss[id] || { id:id, parts:{}, serials:{}, pts:0, approved:false };
  if (cur.status === status){
    /* (V28.3) الضغطُ على الحالة المضاءة كان يحذف سجلَّ التركيب كلَّه (قطعه وسيريالاته واعتماده) بلا تأكيد */
    var heavy = cur.approved || Object.keys(cur.parts || {}).length || Object.keys(cur.serials || {}).length || (cur.photos && cur.photos.length) || cur.sol || cur.solution;
    toast(t(heavy ? 'لهذا التركيب قطعٌ أو سيريالاتٌ أو اعتماد — لا يُلغى من هنا؛ للتصحيح افتح «تعديل التركيب»' : 'الحالةُ مسجّلة — حذفُ التركيبات موقوفٌ الآن؛ اختر الحالةَ الصحيحة بدلها'));   /* (V28.4) لا حذف */
    return;   /* (V31.4) كان بعده حذفُ التركيب وإرجاعُ الحالة — كودٌ ميتٌ منذ إيقاف الحذف (V28.4) */
  } else {
    cur.status = status;
    cur.by = STATE.meta.name || '';
    cur.at = Date.now();
    CORE.set('inss', id, cur);
    if (s && status === 'مُركّب' && cur.approved) s.fstat = 'مُركّب';
    logEvent('حالةُ التركيب «' + status + '» — ' + id, id);
    toast(t(status));
  }
  statBump(); render(1);
  if (MAP) mapPaint();
}

