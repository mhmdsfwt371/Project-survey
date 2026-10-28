/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-12-ministry-screen-progress.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-12-ministry-screen-progress.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : zoneForecast, forecastHtml, pmState, pmReset, kkSatHtml, kkSatInit, pointMap, kioskObsTally, kioskObsHtml, kioskStory, ringsGrow, kioskAnimate, kioskCycleTick, kioskCycleStop, kioskRing, kioskToggle, kioskBody
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ «متى نخلّص؟» — التوقّعُ من وتيرة آخر أسبوعين (V17.83) ═══
   الرقمُ الذي تسأل عنه الوزارةُ بعد النسبة: متى؟ يُحسَب لكلِّ مشعرٍ من عدد ما
   مُسح فيه في آخر أربعةَ عشرَ يومًا — لا من تارجتٍ مكتوب — فيُقال «يكتمل نحو
   كذا» أخضرَ إن سبق الموعدَ وأحمرَ إن تأخّر، ولا يُقال شيءٌ إن لم يتحرّك
   المشعرُ أسبوعين. */
function zoneForecast(zone){
  var K = siteKeyStats(), o = K.zones[zone];
  if (!o || !o.n) return null;
  var now = Date.now(), from = now - 14 * 864e5, done14 = 0;
  (STATE.sites || []).forEach(function(x){
    if (taxOf(x).g !== zone) return;   /* (V30.0) بتصنيف المالك */
    var r = STATE.recs[x.id];
    if (svVisited(r) && +r.at >= from) done14++;   /* (V32.6) */
  });
  var left = o.n - o.sv;
  if (left <= 0) return { done:true, left:0 };
  if (!done14) return { stalled:true, left:left };
  var rate = done14 / 14, days = Math.ceil(left / rate), eta = now + days * 864e5;
  var due = cfgN(cfgGet('dueSurvey')) || 0;
  return { left:left, rate:rate, days:days, eta:eta, due:due, late:!!(due && eta > due) };
}

function forecastHtml(zone){
  var f = zoneForecast(zone);
  if (!f) return '';
  if (f.done) return '<span class="kk-eta ok">\u2714 ' + esc(t('اكتمل')) + '</span>';
  if (f.stalled) return '<span class="kk-eta mute">' + esc(t('لا وتيرةَ في أسبوعين')) + '</span>';
  return '<span class="kk-eta ' + (f.late ? 'bad' : 'ok') + '" title="' + esc(nm(Math.round(f.rate * 7)) + ' ' + t('في الأسبوع')) + '">'
    + esc(t('يكتمل نحو')) + ' ' + esc(dayKey(f.eta)) + (f.due ? ' \u00b7 ' + esc(t(f.late ? 'بعد الموعد' : 'قبل الموعد')) : '') + '</span>';
}

function pmState(zone, W, H){
  if (PM_VIEW.zone !== zone){ PM_VIEW = { zone:zone, z:1, cx:0.5, cy:0.5, W:W, H:H }; }
  PM_VIEW.W = W; PM_VIEW.H = H; return PM_VIEW;
}

function pmReset(){ PM_VIEW.z = 1; PM_VIEW.cx = 0.5; PM_VIEW.cy = 0.5; pmApply(); }

function kkSatHtml(zone){
  var all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone && +x.lat && +x.lng; });   /* (V30.0) */
  if (!all.length) return '<p class="hint">' + esc(t('لا نقاطَ بإحداثياتٍ في هذا المشعر.')) + '</p>';
  var G = geoOutliers(all), cnt = {};
  G.core.forEach(function(x){ var st = lifeOf(x); cnt[st] = (cnt[st] || 0) + 1; });
  var legend = LIFE_ORDER.filter(function(k){ return cnt[k]; }).map(function(k){
    return '<span class="kk-lg"><i style="background:' + LIFE[k].c + '"></i>' + esc(t(LIFE[k].n)) + ' <b class="num">' + nm(cnt[k]) + '</b></span>'; }).join('');
  var far = G.far.length ? '<p class="hint" style="margin:6px 0 0">\u26A0 ' + nm(G.far.length) + ' ' + esc(t('نقطةً بإحداثياتٍ بعيدةٍ عن المشعر لا تدخل الإطار')) + ': ' + G.far.slice(0, 4).map(function(x){ return bdi(x.id); }).join(' \u00b7 ') + (G.far.length > 4 ? ' \u2026' : '')
      + (typeof maySiteEdit === 'function' && maySiteEdit() ? ' ' + btn(t('تصحيح البيانات'), 'btn-quiet btn-sm', ' data-goto="dq"') : '') + '</p>' : '';
  return '<div id="kkSat" class="kk-sat" role="img" aria-label="' + esc(t('نقاطُ المشعر على القمر الصناعي') + ' \u2014 ' + t(zone)) + '"></div>'
    + '<div class="kk-legend2">' + legend + '<span class="hint" style="margin:0">' + esc(t('الإجمالي')) + ' <b class="num">' + nm(all.length) + '</b></span></div>' + far;
}

function kkSatInit(){
  var el = document.getElementById('kkSat'); if (!el) return false;
  if (typeof L === 'undefined' || !L.map){ el.innerHTML = '<p class="hint" style="padding:12px">' + esc(t('الخريطةُ تحتاج تحميلَ المكتبة — تظهر النقاطُ المجرّدةُ بدلًا منها')) + '</p>'; return false; }
  var zone = KK_ZONE, all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone && +x.lat && +x.lng; }), core = geoOutliers(all).core;
  if (PV.KK_MAP){ try { PV.KK_MAP.remove(); } catch (e){ LS_ERR = e; } PV.KK_MAP = null; }
  var m = L.map(el, { zoomControl:true, attributionControl:true, preferCanvas:true });
  L.tileLayer(TILES.esri, { maxZoom:19, keepBuffer:1, updateWhenIdle:true, updateWhenZooming:false, attribution:'Esri, Maxar, Earthstar Geographics' }).addTo(m);   /* (V34.2) */
  /* على اللمس: خريطةٌ طويلةٌ داخل صفحةٍ تُمسك الإصبعَ فلا تُمرَّر الصفحة. يبدأ
     التحريكُ معطَّلًا وتُقرأ الصفحةُ بإصبعٍ واحد؛ ضغطةٌ على الخريطة تفعّله ويظهر
     زرُّ إيقافه — والتقريبُ بإصبعين يعمل دائمًا. */
  if (L.Browser && L.Browser.touch && m.dragging){
    m.dragging.disable();
    var lock = document.createElement('button'); lock.type = 'button'; lock.className = 'kk-lock';
    lock.textContent = t('اضغط لتحريك الخريطة');
    lock.addEventListener('click', function(){ m.dragging.enable(); lock.textContent = '\u2715 ' + t('إيقاف التحريك'); lock.classList.add('on'); lock.onclick = function(){ m.dragging.disable(); lock.textContent = t('اضغط لتحريك الخريطة'); lock.classList.remove('on'); lock.onclick = null; }; }, { once:true });
    el.appendChild(lock);
  }
  var MAP_CV_KK = L.canvas({ padding:0.3 });   /* لوحُ هذه الخريطة وحدَها — لا لوحَ الخريطة الرئيسة */
  core.forEach(function(x){
    var st = lifeOf(x), C = (LIFE[st] || LIFE.todo).c;
    L.circleMarker([+x.lat, +x.lng], { renderer:MAP_CV_KK, radius:5, color:'#fff', weight:1, fillColor:C, fillOpacity:0.95 })
      .on('click', function(){ DETAIL_ID = x.id; CUR = 'site'; render(); }).addTo(m);
  });
  var v = PV.KK_MAPV[zone];
  if (v && v.z) m.setView([v.lat, v.lng], v.z);
  else if (core.length){ m.fitBounds(L.latLngBounds(core.map(function(x){ return [+x.lat, +x.lng]; })), { padding:[12, 12] }); }
  m.on('moveend', function(){ var c = m.getCenter(); PV.KK_MAPV[zone] = { lat:c.lat, lng:c.lng, z:m.getZoom() }; });
  PV.KK_MAP = m; PV.KK_MAP_ZONE = zone;
  return true;
}

function pointMap(zone){
  var all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone; });
  var P0 = all.filter(function(x){ return +x.lat && +x.lng; }), noCo = all.length - P0.length;
  if (!P0.length) return '<p class="hint">' + esc(t('لا نقاطَ بإحداثياتٍ في هذا المشعر.')) + '</p>';
  var G = geoOutliers(P0), P = G.core;
  var la0 = Infinity, la1 = -Infinity, lo0 = Infinity, lo1 = -Infinity;
  P.forEach(function(x){ var a = +x.lat, o = +x.lng; if (a < la0) la0 = a; if (a > la1) la1 = a; if (o < lo0) lo0 = o; if (o > lo1) lo1 = o; });
  var kx = Math.cos((la0 + la1) / 2 * Math.PI / 180), W = 1000;
  var spanX = Math.max(1e-6, (lo1 - lo0) * kx), spanY = Math.max(1e-6, la1 - la0);
  var H = Math.max(280, Math.min(720, Math.round(W * spanY / spanX))), pad = 14;
  var sc = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
  var offX = (W - spanX * sc) / 2, offY = (H - spanY * sc) / 2;
  var V = pmState(zone, W, H), r = Math.max(1.2, 5 / Math.sqrt(V.z)).toFixed(2);
  var cnt = {};
  var dots = P.map(function(x){
    var st = lifeOf(x), L = LIFE[st] || LIFE.todo; cnt[st] = (cnt[st] || 0) + 1;
    var cx = offX + ((+x.lng) - lo0) * kx * sc, cy = H - (offY + ((+x.lat) - la0) * sc);
    /* الوصفُ خاصيةٌ لا نصّ: ألفُ عنوانٍ نصّيٍّ كانت تُثقل الشاشةَ على قارئها (audit-fit) */
    return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r + '" fill="' + L.c + '" data-site="' + esc(x.id) + '" aria-label="' + esc(x.id) + '"></circle>';
  }).join('');
  var legend = LIFE_ORDER.filter(function(k){ return cnt[k]; }).map(function(k){
    return '<span class="kk-lg"><i style="background:' + LIFE[k].c + '"></i>' + esc(t(LIFE[k].n)) + ' <b class="num">' + nm(cnt[k]) + '</b></span>';
  }).join('');
  var far = G.far.length ? '<p class="hint" style="margin:6px 0 0">\u26A0 ' + nm(G.far.length) + ' ' + esc(t('نقطةً بإحداثياتٍ بعيدةٍ عن المشعر لا تدخل الإطار')) + ': ' + G.far.slice(0, 4).map(function(x){ return bdi(x.id); }).join(' \u00b7 ') + (G.far.length > 4 ? ' \u2026' : '')
      + (typeof maySiteEdit === 'function' && maySiteEdit() ? ' ' + btn(t('تصحيح البيانات'), 'btn-quiet btn-sm', ' data-goto="dq"') : '') + '</p>' : '';
  return '<div class="pm-tools"><button type="button" class="btn btn-quiet btn-sm" data-pmz="in" aria-label="' + esc(t('تكبير')) + '">\uFF0B</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-pmz="out" aria-label="' + esc(t('تصغير')) + '">\uFF0D</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-pmz="reset" aria-label="' + esc(t('إعادة الإطار')) + '">\u27F2</button>'
    + '<span class="hint num" id="pmZoom" style="margin:0">\u00d7' + nm(Math.round(V.z * 10) / 10) + '</span>'
    + '<span class="hint" style="margin:0">' + esc(t('اسحب للتحريك · قرّب بإصبعين أو بالعجلة · اضغط نقطةً لتفتحها')) + '</span></div>'
    + '<svg class="kk-pts" viewBox="' + pmViewBox() + '" role="img" aria-label="' + esc(t('خريطةُ التقدّم بالنقاط') + ' \u2014 ' + t(zone)) + '">' + dots + '</svg>'
    + '<div class="kk-legend2">' + legend
    + '<span class="hint" style="margin:0">' + esc(t('الإجمالي')) + ' <b class="num">' + nm(P0.length) + '</b>'
    + (noCo ? ' \u00b7 ' + esc(t('بلا إحداثيات')) + ' <b class="num">' + nm(noCo) + '</b>' : '') + '</span></div>' + far;
}

/* ═══ (V33.0) شاشةُ القاعة: النقاطُ بعوائق وبدونها — الإجماليُّ أوّلًا ثم كلُّ نوعٍ من المخيمات إلى الزايدي ═══ */
function kioskObsTally(){
  var T = { n:0, ok:0, ob:0, todo:0 }, by = {};
  (STATE.sites || []).forEach(function(x){ var ty = taxOf(x).t || '—', r = STATE.recs[x.id], o = by[ty] = by[ty] || { n:0, ok:0, ob:0, todo:0 };
    o.n++; T.n++;
    if (svClean(r)){ o.ok++; T.ok++; } else if (svVisited(r)){ o.ob++; T.ob++; } else { o.todo++; T.todo++; } });
  return { T:T, by:by };
}

function kioskObsHtml(){
  var K = kioskObsTally(), types = TAX_T.filter(function(ty){ return K.by[ty]; });
  /* رقمٌ كبيرٌ يُضغَط فيفتح قائمتَه (data-svlist) — الأخضرُ بدون عوائق والأحمرُ بعوائق */
  var num = function(v, color, lbl, key, big){ return '<div role="button" tabindex="0" data-svlist="' + esc(key) + '" title="' + esc(t('اضغط للقائمة والتصدير')) + '" style="flex:1;min-width:0;cursor:pointer;border-radius:12px;padding:4px 2px">'
      + '<div style="color:' + color + ';font-weight:800;font-size:' + (big ? '44px' : '30px') + ';line-height:1.05;font-variant-numeric:tabular-nums" aria-valuenow="' + v + '">' + nm(v) + '</div>'
      + '<div class="kk-sub" style="white-space:nowrap">' + esc(t(lbl)) + ' \u203A</div></div>'; };
  var card = function(title, o, okKey, obKey, big){ return '<div class="kk-ring kk-plain"' + (big ? ' style="grid-column:1/-1"' : '') + '><div class="kk-lab" style="margin:0 0 6px">' + title + '</div>'
      + '<div style="display:flex;gap:6px;justify-content:center;text-align:center">' + num(o.ok, 'var(--min-green)', 'بدون عوائق', okKey, big) + num(o.ob, 'var(--min-red)', 'بعوائق', obKey, big) + '</div>'
      + '<div class="kk-sub" style="margin-top:4px">' + (o.todo ? esc(t('لم تتم زيارتها')) + ' ' + nm(o.todo) + ' \u00b7 ' : '') + esc(t('من')) + ' ' + nm(o.n) + '</div></div>'; };
  return '<div class="kk-h" style="margin:14px 2px 8px">' + esc(t('النقاط بعوائق وبدونها')) + '</div>'
    + '<div class="kk-rings" id="kksec-4">'
    +   card(esc(t('الإجمالي')), K.T, 'clean', 'chal', true)
    +   types.map(function(ty){ var d = PV.TAX_DEF[ty] || { l:ty, i:'\u25CF' }; return card(d.i + ' ' + esc(t(d.l)), K.by[ty], 'obok|' + ty, 'obbad|' + ty, false); }).join('')
    + '</div>';
}

function kioskStory(){
  var K = siteKeyStats(), now = Date.now(), wk = now - 7 * 864e5, n7 = 0, byZ = {};
  (STATE.sites || []).forEach(function(x){ var r = STATE.recs[x.id]; if (svVisited(r) && +r.at >= wk){ n7++; byZ[x.zone] = (byZ[x.zone] || 0) + 1; } });
  var zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; });
  var life = {}; (STATE.sites || []).forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var parts = [];
  if (n7){ var top = Object.keys(byZ).sort(function(a, b){ return byZ[b] - byZ[a]; })[0];
    parts.push(t('هذا الأسبوع تمت زيارة') + ' ' + nm(n7) + ' ' + t('نقطةً') + (top ? ' (' + nm(byZ[top]) + ' ' + t('منها في') + ' ' + t(top) + ')' : '')); }
  else parts.push(t('لم تُسجَّل زيارةٌ هذا الأسبوع'));
  var z0 = zones[0], f = z0 ? zoneForecast(z0) : null;
  if (f && f.eta){ var dd = f.due ? Math.round((f.due - f.eta) / 864e5) : 0;
    parts.push(t(z0) + ' ' + t('يكتمل نحو') + ' ' + dayKey(f.eta) + (f.due ? (dd >= 0 ? ' \u2014 ' + t('قبل الموعد بـ') + ' ' + nm(dd) + ' ' + t('يومًا') : ' \u2014 ' + t('بعد الموعد بـ') + ' ' + nm(-dd) + ' ' + t('يومًا')) : '')); }
  else if (f && f.stalled) parts.push(t(z0) + ' ' + t('بلا وتيرةٍ منذ أسبوعين'));
  /* (V33.0) قرارُ المالك: لا «تنتظر قرار الوزارة» ولا «متعذّرة» — ما زير ولم يُوصَل إليه «تحتاج زيارة أخرى» */
  /* (V33.5) طلبُ المالك: لا «تحتاج زيارة أخرى» في القاعة — هي داخل «بعوائق» في البطاقات */
  return parts.join(' \u00b7 ') + '.';
}

/* (V34.3) طلبُ المالك: «الحلقةُ ١٠٠٪ أحمر، ولما تعدّ حاجة يقلّ الأحمرُ ويتحوّل أخضرَ بنسبته» — كلُّ حلقةٍ تُرسَم حمراءَ كاملة ثم يزحف
   الأخضرُ إلى نسبتها (انتقالُ ‎.kk-arc‎ ١٫٢ ث على بطاقة الرسوم). تُستدعى بعد كلِّ رسمٍ فيه حلقات — في الملخّص والقاعة. */
function ringsGrow(){
  var arcs = document.querySelectorAll('.kk-arc[kkoff]'); if (!arcs.length) return;
  var prev = ringsGrow.prev = ringsGrow.prev || {}, grow = [];
  /* التحديثُ الدوريُّ (كلَّ دقيقةٍ في القاعة) لا يعيد الحركةَ لحلقةٍ لم يتغيّر رقمُها — يزحف الأخضرُ حين يُنجَز شيءٌ فقط */
  arcs.forEach(function(a){ var ring = a.closest('.kk-ring'), k = (ring && ring.getAttribute('data-svlist')) || '', off = a.getAttribute('kkoff');
    if (k && prev[k] === off){ a.style.transition = 'none'; a.style.strokeDashoffset = off; a.removeAttribute('kkoff'); }
    else { prev[k] = off; grow.push(a); } });
  if (!grow.length) return;
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ grow.forEach(function(a){ a.style.strokeDashoffset = a.getAttribute('kkoff'); a.removeAttribute('kkoff'); }); }); });
}

function kioskAnimate(){
  var els = document.querySelectorAll('.kk [aria-valuenow]');
  if (!els.length) return;
  var t0 = Date.now(), dur = 900;
  var tick = function(){
    var p = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    els.forEach(function(el){ var n = +el.getAttribute('aria-valuenow') || 0, sfx = /kk-pct/.test(el.getAttribute('class') || '') ? '٪' : ''; el.textContent = nm(Math.round(n * e)) + sfx; });
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* وضعُ القاعة (V17.90): على تلفزيون غرفة العمليات لا يلمس أحدٌ الشاشة — فتتنقّل
   بنفسها بين أقسامها كلَّ خمسَ عشرةَ ثانية، وتقف عند أوّل لمسةٍ أو حركة. */
function kioskCycleTick(){
  var secs = document.querySelectorAll('.kk [id^="kksec-"]');
  if (!secs.length) return;
  PV.KIOSK_STEP = (PV.KIOSK_STEP + 1) % secs.length;
  try { secs[PV.KIOSK_STEP].scrollIntoView({ behavior:'smooth', block:'start' }); } catch (e){ secs[PV.KIOSK_STEP].scrollIntoView(); }
}

function kioskCycleStop(){ if (PV.KIOSK_CYCLE){ clearInterval(PV.KIOSK_CYCLE); PV.KIOSK_CYCLE = null; } }

/* (V33.5) طلبُ المالك: أربعُ حلقاتٍ فقط — المسح والتركيب والتسليم والفك — الأخضرُ المنجزُ والأحمرُ المتبقي، وتفاعليةٌ كبطاقات «بعوائق
   وبدونها»: الحلقةُ تفتح قائمةَ المنجز، و«متبقٍّ» تحتها تفتح قائمةَ المتبقي. ولا مقامَ له (الفكُّ قبل التسليم) حلقةٌ رماديةٌ تقول متى تبدأ. */
function kioskRing(done, total, label, doneKey, remKey, idle){
  var r = 44, c = 2 * Math.PI * r, p = total ? Math.max(0, Math.min(100, done / total * 100)) : 0, rem = Math.max(0, total - done);
  var pr = Math.round(p); if (pr === 100 && rem) pr = 99; if (pr === 0 && done) pr = 1;   /* لا يُقال ١٠٠٪ وبقي شيء ولا ٠٪ وأُنجز شيء */
  /* (V34.4) بلاغُ المالك: «المسح عمّال بيقلب أحمر وأخضر» — كلُّ رسمٍ كان يبدأ الحلقةَ حمراءَ كاملةً ثلاثين جزءًا من الألف ثم يقفز —
     وصفحةُ الوزارة تُرسَم مع كلِّ وصول بيانات. صارت الحلقةُ التي رقمُها كما كان تُرسَم على نسبتها مباشرة، والحركةُ للتغيّر وحدَه.
     و«٩٩٪ أخضر والمتبقي ١٪ أحمر»: ١٢ من ١٬٩٤٥ = ٠٫٦٪ — شريطٌ أضيقُ من أن يُرى (وطرفُ القوس المستدير يغطّيه)؛ فالمتبقي يُرى
     أحمرَ بحدٍّ أدنى ٢٪ من الدائرة ما دام فيه شيء، وطرفُ القوس مستقيم. */
  var vis = rem ? Math.min(p, 98) : p, off = (c * (1 - vis / 100)).toFixed(1), same = ringsGrow.prev && ringsGrow.prev[doneKey] === off;
  return '<div class="kk-ring" role="button" tabindex="0" data-svlist="' + esc(doneKey) + '" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '">'
    + '<svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="' + r + '" class="kk-track"' + (total ? ' style="stroke:var(--min-red)"' : '') + '/>'
    +   '<circle cx="55" cy="55" r="' + r + '" class="kk-arc"' + (same ? '' : ' kkoff="' + off + '"') + ' style="stroke:var(--min-green);stroke-linecap:butt;stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (same ? off : c.toFixed(1)) + '"/>'   /* (V34.3) تبدأ حمراءَ كاملة ويزحف الأخضرُ إلى نسبته */
    +   '<text x="55" y="61" class="kk-pct" aria-valuenow="' + pr + '">' + nm(pr) + '٪</text></svg>'
    + '<div class="kk-lab">' + esc(t(label)) + ' \u203A</div>'
    + '<div class="kk-sub">' + (total ? nm(done) + ' ' + esc(t('من')) + ' ' + nm(total)
        + (rem ? ' \u00b7 <span role="button" tabindex="0" data-svlist="' + esc(remKey) + '" style="color:var(--min-red);font-weight:700;cursor:pointer;white-space:nowrap">' + esc(t('متبقي')) + ' ' + nm(rem) + ' \u203A</span>' : '')
        : esc(t(idle || 'لم يبدأ بعد'))) + '</div></div>';
}

function kioskToggle(){
  KIOSK_ON = !KIOSK_ON;
  document.body.classList.toggle('kiosk', KIOSK_ON);
  try {
    if (KIOSK_ON && document.documentElement.requestFullscreen){ var fsP = document.documentElement.requestFullscreen(); if (fsP && fsP.catch) fsP.catch(function(){}); }
    else if (!KIOSK_ON && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
  } catch (e){ LS_ERR = e; }
  if (KIOSK_TIMER){ clearInterval(KIOSK_TIMER); KIOSK_TIMER = null; }
  kioskCycleStop(); PV.KIOSK_STEP = 0;
  try { sunApply(); } catch (e){ LS_ERR = e; }   /* القاعةُ بلا وضع الشمس (V17.99) */
  if (KIOSK_ON){
    KIOSK_TIMER = setInterval(function(){ if ((CUR === 'mfu' || CUR === 'over') && KIOSK_ON) render(1); else kioskToggle(); }, 60000);   /* (V37.49) كان يشترط تبويبَ «over/kiosk» القديم فيُطفئ العرضَ بعد دقيقة */
    PV.KIOSK_CYCLE = setInterval(kioskCycleTick, 15000);
    var stop = function(){ kioskCycleStop(); };
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, stop, { once:true, passive:true }); });
  }
  render(1);
}

/* (V37.0) أعدادُ المراحل في رسمة القاعة الواحدة */
function kioskBody(){
  var K = siteKeyStats(), now = Date.now(), day = now - 864e5;
  var life = {}; (STATE.sites || []).forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var steps = (STATE.steps || []).filter(function(x){ return +x.at >= day; });
  var kinds = {}, people = {};
  steps.forEach(function(x){ kinds[x.kind] = (kinds[x.kind] || 0) + 1; if (x.by) people[x.by] = 1; });
  var KN = { visit:'زيارة', ins:'تركيب', dis:'فكّ', newsite:'موقعٌ جديد', maint:'صيانة', deliver:'تسليم' };
  var byCh = {}; (STATE.sites || []).forEach(function(x){ var r0 = STATE.recs[x.id]; if (!svDone(r0)) return; chalCats(r0).forEach(function(k){ if (k === 'review' || !ccOf(k)) return; var nn = ccOf(k).n; byCh[nn] = (byCh[nn] || 0) + 1; }); });   /* (V37.3) الفئاتُ الثماني */
  var chTop = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; }).slice(0, 4);
  var zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; });
  var zoneMax = zones.length ? K.zones[zones[0]].n : 1;
  return (svListPop() + supPopHtml()) + '<div class="kk' + (KIOSK_ON ? ' on' : '') + '">'
    + '<div class="kk-head"><div><div class="kk-title">' + esc(t('قارئات أفاقي — حج ١٤٤٨هـ')) + '</div>'
    +   '<div class="kk-brand">' + esc(t('وزارةُ الحج والعمرة · مشروعُ قارئات أفاقي')) + '</div>'
    +   '<div class="kk-date">' + esc(fmtDT(now)) + ' \u00b7 <span class="kk-live"></span> ' + esc(t('يتجدّد كلَّ دقيقة')) + '</div></div>'
    +   btn(KIOSK_ON ? '\u2716 ' + t('خروج من العرض') : '\u{1F5A5} ' + t('عرضٌ كامل'), KIOSK_ON ? 'btn-quiet' : 'btn-primary', ' data-kiosk="1"' + (KIOSK_ON ? '' : ' title="' + esc(t('يملأ الشاشةَ ويتنقّل بين الأقسام بنفسه كلَّ خمسَ عشرةَ ثانية')) + '"')) + '</div>'
    + '<div class="kk-story">' + esc(kioskStory()) + '</div>'
    + '<div class="kk-rings" id="kksec-1">'   /* (V33.5) طلبُ المالك: المسح والتركيب والتسليم والفك — أربعٌ فقط */
    +   stageRings(PV.KSC = stageCounts())   /* (V37.0) خمسُ مراحل */
    + '</div>'
    + kioskObsHtml()
    + '<div class="mfu-hero-grid" id="kksec-stage">' + stageFunnel(PV.KSC) + gapCard(PV.KSC) + ccCard(PV.KSC) + '</div>'   /* (V33.3) طلبُ المالك: بطاقاتٌ فوق تحت الحلقات مباشرةً، وكلُّ رقمٍ يفتح قائمتَه بتصدير */
    + '<div class="kk-grid">'
    +   '<div class="kk-box" id="kksec-2"><div class="kk-h">' + esc(t('المشاعرُ — كم أُنجز وكم بقي')) + '</div>'
    +     zones.map(function(z){ var o = K.zones[z], p = o.n ? Math.round(o.sv / o.n * 100) : 0;
          return '<div class="kk-zone"><div class="kk-zl"><b>' + esc(t(z)) + '</b><span>' + nm(o.sv) + ' / ' + nm(o.n) + ' \u00b7 <b>' + nm(p) + '٪</b></span></div>'
            + '<div class="kk-bar" style="width:' + Math.max(12, Math.round(o.n / zoneMax * 100)) + '%"><i style="width:' + p + '%"></i></div>'
            + '<div class="kk-fc">' + forecastHtml(z) + '</div></div>'; }).join('')
    +   '</div>'
    +   '<div class="kk-box kk-wide" id="kksec-3"><div class="kk-h" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>' + esc(t(KK_VIEW === 'sat' ? 'المشعرُ على القمر الصناعي' : 'خريطةُ التقدّم بالنقاط')) + ' \u2014 ' + esc(t(KK_ZONE)) + '</span>'
    +     '<span>' + zones.map(function(z){ return '<button class="chip' + (KK_ZONE === z ? ' on' : '') + '" data-kkz="' + esc(z) + '">' + esc(t(z)) + '</button>'; }).join(' ')
    +       ' <button class="chip' + (KK_VIEW === 'sat' ? ' on' : '') + '" data-kkview="sat">\u{1F6F0} ' + esc(t('قمر صناعي')) + '</button>'
    +       '<button class="chip' + (KK_VIEW === 'pts' ? ' on' : '') + '" data-kkview="pts">\u25CF ' + esc(t('نقاط')) + '</button></span></div>'
    +     (KK_VIEW === 'sat' && typeof L !== 'undefined' && L.map ? kkSatHtml(KK_ZONE) : pointMap(KK_ZONE))
    +   '</div>'
    +   (function(){   /* (V30.5) فكرةُ المالك #٦: شاشةٌ حيّة — آخرُ ما حدث لحظةً بلحظة، وطزاجةُ البيانات، والتنبيهاتُ */
          var feed = (STATE.steps || []).slice().sort(function(a, b){ return (+b.at || 0) - (+a.at || 0); }).slice(0, 8);
          var A = alAll().filter(function(a){ return a.sites.length; }), alTot = A.reduce(function(x, y){ return x + y.sites.length; }, 0);
          var fresh = STATE.meta.lastSync ? agoTxt(STATE.meta.lastSync) : t('لم تُزامَن بعد');
          return '<div class="kk-box kk-wide" id="kksec-5"><div class="kk-h" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>\u{1F534} ' + esc(t('مباشر — آخر ما حدث في الميدان')) + '</span><span class="hint" style="margin:0">' + esc(t('البيانات')) + ': ' + esc(fresh) + (KIOSK_ON ? ' \u00b7 ' + esc(t('تُسحَب كلَّ دقيقتين في وضع القاعة')) : '') + '</span></div>'
            + (feed.length ? '<div class="kk-feed">' + feed.map(function(x){ return '<div class="kk-zl"><span><b class="num">' + esc(agoTxt(+x.at)) + '</b> \u00b7 ' + esc(t(KN[x.kind] || x.kind || '')) + (x.site ? ' <span class="num">' + esc(x.site) + '</span>' : '') + '</span><span>' + esc(dispName(x.by || '')) + '</span></div>'; }).join('') + '</div>' : '<p class="hint">' + esc(t('لا خطوةَ مرفوعةً بعد.')) + '</p>')
            + (alTot ? '<div class="kk-kinds" style="margin-top:8px">' + A.slice(0, 4).map(function(a){ return '<div class="kk-kind"><div class="kk-big" style="color:var(--min-red)" aria-valuenow="' + a.sites.length + '">' + nm(a.sites.length) + '</div><div class="kk-lab">' + esc(a.label) + '</div></div>'; }).join('') + '</div>' : '<p class="hint" style="margin:8px 0 0">\u2713 ' + esc(t('لا تنبيهاتٍ بقواعد النظام الآن')) + '</p>')
            + '</div>'; })()
    +   '<div class="kk-box"><div class="kk-h">' + esc(t('شغلُ الميدان — آخر أربعٍ وعشرين ساعة')) + '</div>'
    +     (steps.length
          ? '<div class="kk-kinds">' + Object.keys(kinds).map(function(k){ return '<div class="kk-kind"><div class="kk-big" aria-valuenow="' + kinds[k] + '">' + nm(kinds[k]) + '</div><div class="kk-lab">' + esc(t(KN[k] || k)) + '</div></div>'; }).join('')
            + '<div class="kk-kind"><div class="kk-big">' + nm(Object.keys(people).length) + '</div><div class="kk-lab">' + esc(t('شخصًا في الميدان')) + '</div></div></div>'
          : '<p class="hint">' + esc(t('لا خطوةَ مرفوعةً في آخر أربعٍ وعشرين ساعة.')) + '</p>')
    +   '</div>'
    +   '<div class="kk-box"><div class="kk-h">' + esc(t('التحدياتُ الأكثرُ تكرارًا')) + '</div>'
    +     (chTop.length ? chTop.map(function(c){ return '<div class="kk-zl"><span>' + esc(chalShow(c)) + '</span><b>' + nm(byCh[c]) + '</b></div>'; }).join('')
                       : '<p class="hint">' + esc(t('لا تحدّيَ مسجَّلًا بعد.')) + '</p>')
    +   '</div>'
    + '</div></div>';
}
