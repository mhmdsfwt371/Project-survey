
/* ═══ لوحةُ المهمة — مكانٌ واحدٌ لكلِّ تعديل ═══
   الحالةُ شرائحُ تُضغَط فتُحفَظ وتُسجَّل، و«ما الجديد؟» سطرٌ يُضاف إلى سجلٍّ
   باسم كاتبه ووقته، وبياناتُ المهمة تحت «تعديل البيانات» لمن يريدها. */
/* المضيفُ ابنٌ مباشرٌ للجسد — لا داخل المحتوى ولا داخل قشرة التطبيق: «الثابتُ»
   يتبع أوّلَ أبٍ فيه تحويلٌ أو تموضع، فكان اللوحُ يظهر في أوّل الصفحة لا
   أسفلَ الشاشة. على الجسد لا أبَ يُفسده. */
/* ═══ نافذةُ نقاط التحدي (V26.9) — من صفحة التحديات والمعوقات في الميدان ═══ */
var CHAL_POP = '', CHUP_OPEN = '';
/* ═══ شغلُ الميدان والمكتب على التحدي (V27.0) — قرارُ المالك ═══
   المكتبُ والوزارةُ يكلِّفان (الجهةُ والآليةُ ووصفُ المعالجة وآخرُ تاريخ ومهمةُ المعالجة) فيراه الميدانُ على تحدّيه؛ والميدانُ
   يعمل ويكتب ما حدث («تحديث»: جرّبنا كذا، كلّمنا كدانة، حُلّت ثلاثةُ مخيمات) فيراه المكتبُ والوزارةُ فورًا، والأرقامُ تنقص
   وحدَها حين تُركَّب النقاط. القناةُ سجلُّ الأحداث نفسُه (يكتبه الميدانُ بالقاعدة) بمفتاح التحدي — لا مجموعةَ جديدة. */
function chalUpd(key, note, dir){
  note = String(note || '').trim().slice(0, 400); if (!key || !note) return false;
  if (typeof canWriteEvents === 'function' && !canWriteEvents()){ toast(t('هذا الحسابُ يقرأ ولا يكتب')); return false; }
  var now = Date.now(), e = { id:uid36(), ts:now, at:fmtTime(now, { hour:'2-digit', minute:'2-digit' }), day:dayKey(now), what:(dir === 'office' ? 'تعليماتٌ للميدان — ' : 'تحديثٌ من الميدان — ') + note, by:STATE.meta.name || '', dev:DEV_ID, chal:String(key), dir:dir === 'office' ? 'office' : 'field' };
  STATE.events.unshift(e); if (STATE.events.length > 500) STATE.events.length = 500;
  if (!STATE.evlog) STATE.evlog = {}; STATE.evlog[e.id] = e; CORE.dirty('evlog', e.id, e); return true;
}
function chalUpds(key){ var L = (STATE.events || []).filter(function(e){ return e && e.chal === String(key); }); var seen = {}; return L.filter(function(e){ if (seen[e.id]) return false; seen[e.id] = 1; return true; }).sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); }); }
function chalUpdNote(e){ return String(e.what || '').replace(/^(تحديثٌ من الميدان|تعليماتٌ للميدان) — /, ''); }
function chalUpdBox(key){
  var U = chalUpds(key), last = U[0], can = (typeof canWriteEvents !== 'function') || canWriteEvents();
  var h = '<div class="chup" style="margin:4px 0 0">';
  if (last) h += '<div class="hint" style="margin:0">' + (last.dir === 'office' ? '\u{1F4CB} ' : '\u{1F6E0} ') + esc(chalUpdNote(last)) + ' <span class="num">\u2014 ' + esc(dispName(last.by) || last.by || '') + ' \u00b7 ' + esc(last.day || '') + '</span>' + (U.length > 1 ? ' <details style="display:inline"><summary class="hint" style="display:inline;cursor:pointer">+' + nm(U.length - 1) + '</summary>' + U.slice(1).map(function(e){ return '<div class="hint" style="margin:2px 0 0">' + (e.dir === 'office' ? '\u{1F4CB} ' : '\u{1F6E0} ') + esc(chalUpdNote(e)) + ' <span class="num">\u2014 ' + esc(dispName(e.by) || e.by || '') + ' \u00b7 ' + esc(e.day || '') + '</span></div>'; }).join('') + '</details>' : '') + '</div>';
  if (can){
    h += CHUP_OPEN === key
      ? '<div class="wt-row" style="gap:6px;margin:4px 0 0;flex-wrap:wrap"><textarea data-chupdtxt="' + esc(key) + '" rows="2" style="flex:1;min-width:180px" placeholder="' + esc(t('ما الذي حدث في الميدان؟')) + '"></textarea>' + btn(t('أرسل'), 'btn-primary btn-sm', ' data-chupdgo="' + esc(key) + '"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-chupdx="1"') + '</div>'
      : '<div style="margin:4px 0 0">' + btn('\uFF0B ' + t('تحديث'), 'btn-quiet btn-sm', ' data-chupd="' + esc(key) + '"') + '</div>';
  }
  return h + '</div>';
}
/* تكليفُ المكتب على التحدي كما يراه الميدان */
function chalAssignBox(cat){
  var f = (mfuData().fch || {})[cat] || {}, parts = [];
  if (f.owner) parts.push(t('من سيحلّه') + ': ' + f.owner);
  if (f.m) parts.push(t('آلية المعالجة') + ': ' + f.m);
  if (f.desc) parts.push(t('وصف المعالجة') + ': ' + f.desc);
  if (f.due) parts.push(t('آخر تاريخ') + ': ' + f.due);
  if (f.task) parts.push(t('مهمة المعالجة') + ' #' + f.task);
  return parts.length ? '<div class="hint" style="margin:2px 0 0">\u{1F4CB} ' + esc(parts.join(' \u00b7 ')) + '</div>' : '';
}
function chalPopHtml(){
  var cat = CHAL_POP, O = mfuObstaclesF().filter(function(o){ return cat === '*' || o.cats.indexOf(cat) > -1; });
  var rows = O.map(function(o){ var x = o.x, r = STATE.recs[x.id] || {}, nt = String(r.chal_note || r.note || '').trim();
    return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(x.name || x.id) + '</b>' + (x.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign) : '') + ' <span class="num hint">' + bdi(x.id) + '</span></div>'
      + '<div class="hint" style="margin:2px 0">' + esc(t(x.zone || '')) + ' \u00b7 ' + esc(typeLabel(x.type || '')) + (cat === '*' ? ' \u00b7 ' + o.cats.map(function(c){ return esc(t(c)); }).join('، ') : '') + (r.access && r.access !== 'تم الوصول' ? ' \u00b7 ' + esc(t(r.access)) : '') + '</div>'
      + (nt ? '<div class="hint" style="margin:0 0 4px">' + esc(nt.slice(0, 200)) + '</div>' : '')
      + '<div class="actions" style="margin:0">' + btn('\u25C8 ' + t('على الخريطة'), 'btn-secondary btn-sm', ' data-fly="' + esc(x.id) + '"') + btn(t('التفاصيل'), 'btn-quiet btn-sm', ' data-site="' + esc(x.id) + '"') + '</div></div>'; }).join('');
  return '<div class="wt-back" data-chalpopx="0"></div>'
    + '<div class="pop wt-sheet" id="chalPop" role="dialog" aria-label="' + esc(t('نقاط التحدي')) + '">'
    + '<div class="pop-head"><div style="min-width:0"><h3 style="margin:0">' + esc(cat === '*' ? t('كل النقاط') : t(cat)) + '</h3><div class="hint" style="margin:2px 0 0">' + nm(O.length) + ' ' + esc(t('نقطة')) + ((MFU_FLT.z || MFU_FLT.t) ? ' \u00b7 ' + esc(t('بالفلتر')) : '') + '</div></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-chalpopx="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + (rows || '<p class="hint">' + esc(t('لا نقاط.')) + '</p>') + '</div></div>';
}
function chalPopSync(){
  var host = document.getElementById('chalPopHost');
  if (!host){ host = document.createElement('div'); host.id = 'chalPopHost'; document.body.appendChild(host); }
  if (CHAL_POP && CUR !== 'survey') CHAL_POP = '';
  host.innerHTML = CHAL_POP ? chalPopHtml() : '';
}
function wtHostSync(){
  var host = document.getElementById('wtHost');
  if (!host){ host = document.createElement('div'); host.id = 'wtHost'; document.body.appendChild(host); }
  var show = WT_OPEN && (CUR === 'wtask' || CUR === 'mywork');
  host.innerHTML = show ? wtSheet(wtMay()) : '';
}
function wtSheet(me){
  if (!WT_OPEN) return '';
  var r = wtRow(WT_OPEN); if (!r){ WT_OPEN = ''; return ''; }
  var edit = me
    ? '<details style="margin-top:12px"><summary class="hint" style="cursor:pointer">\u270E ' + esc(t('تعديل البيانات')) + '</summary>'
      + '<div class="grid cols-2" style="margin-top:8px">'
      + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('المهمة')) + '</label><input value="' + esc(r.n) + '" data-wte2="n" dir="auto"></div>'
      + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input value="' + esc(r.who || '') + '" data-wte2="who" dir="auto" list="wtWhoList"></div>'
      + '<div class="field"><label>' + esc(t('تاريخ الاستحقاق')) + '</label><input type="date" value="' + esc(r.due || '') + '" data-wte2="due"></div>'
      + '<div class="field"><label>' + esc(t('المسار')) + '</label><input value="' + esc(r.track || '') + '" data-wte2="track" dir="auto"></div>'
      + '<div class="field"><label>' + esc(t('الوصف')) + '</label><input value="' + esc(r.d || '') + '" data-wte2="d" dir="auto"></div>'
      + (wtLeaves().length ? '<div class="field" style="grid-column:1/-1"><label>' + esc(t('بند الخطة')) + '</label>' + wtWbsSelect(r.wbs, 'data-wte2="wbs"') + '</div>' : '')
      + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-wtsave2="' + esc(r.id) + '"')
      + btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-wtdel="' + esc(r.id) + '"') + '</div></details>'
    : '';
  return '<div class="wt-back" data-wtclose="0"></div>'
    + '<div class="pop wt-sheet" id="wtSheet" role="dialog" aria-label="' + esc(t('المهمة')) + '">'
    + '<div class="pop-head"><div style="min-width:0"><div class="pid num hint" style="margin:0">#' + esc(r.id) + '</div><h3 style="margin-top:3px">' + esc(r.n) + '</h3></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-wtclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + wtPanelInner(r, me) + edit + '</div></div>';
}
/* ═══ الخريطةُ ثلاثيةً — زرٌّ واحدٌ على الخريطة نفسِها ═══
   كان العرضُ الثلاثيُّ صفحةً مستقلةً بمرشِّحاتها وألوانها — فتعرض غيرَ ما
   تعرضه الخريطة، ويُسأل «أيُّهما الصحيح؟». والصحيحُ واحد: الخريطةُ بطبقتها
   (المسح · التركيب · الفك) ومرشِّحاتها وشركاتها وحالاتها وألوانها. فصار
   الثلاثيُّ **وضعًا** للخريطة نفسِها: زرُّ «٣د» يرفع المشهدَ نفسَه بتضاريس
   المشاعر وأعمدةٍ بارتفاع التركيب المسجَّل — النقاطُ نفسُها بالألوان نفسِها
   والنقرةُ نفسُها تفتح البطاقةَ نفسَها — و«٢د» يعيده حيث كان.
   المحرّكُ لا يُحمَّل إلا عند أوّل ضغطة (ثمانمئة كيلوبايتٍ لا تُثقل الميدان
   الذي لا يطلبه)، ويبقى حيًّا بعدها؛ والقمرُ الصناعيُّ يتبعه من الزرِّ نفسِه. */
var MAP_3D = false, M3 = null, M3_READY = false, M3_LOADING = null, M3_ERR = '';
function m3Load(){
  if (M3_READY || (typeof window !== 'undefined' && window.maplibregl)){ M3_READY = true; return Promise.resolve(true); }
  if (M3_LOADING) return M3_LOADING;
  M3_LOADING = new Promise(function(res){
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'vendor/maplibre/maplibre-gl.js';
    js.onload = function(){ M3_READY = true; res(true); };
    js.onerror = function(){ M3_ERR = 'تعذّر تحميلُ محرّك العرض الثلاثي'; M3_LOADING = null; res(false); };
    document.head.appendChild(js);
    setTimeout(function(){ if (!M3_READY){ M3_ERR = 'تأخّر تحميلُ محرّك العرض'; M3_LOADING = null; res(false); } }, 15000);
  });
  return M3_LOADING;
}
/* ارتفاعُ العمود: ما سجّله المسحُ، وإلا افتراضٌ بحسب النوع */
function m3Height(x){
  var r = STATE.recs[x.id] || {}, h = +r.hgt || 0;
  if (h > 0) return Math.max(2, Math.min(25, h));
  return x.type === 'مخيم' ? 4 : (x.type === 'كاميرا' ? 8 : 6);
}
/* النقاطُ هي نقاطُ الخريطة المسطّحة حرفًا: القائمةُ نفسُها بعد الطبقة
   والمرشِّحات والشركات، واللونُ نفسُه — لا قائمةَ ثانيةً ولا لونًا ثانيًا */
/* حدودُ المخيمات كما حسبها m3Points — يقرؤها m3Cols في الرسمة نفسِها بلا بحثٍ
   ثانٍ بالمعرِّف (الفهرسُ قد يكون أقدمَ من القائمة لحظةَ الرسم) */
var M3_FOOT = {};
function m3Points(){
  var LIST = (typeof layerFiltered === 'function') ? layerFiltered() : (STATE.sites || []);
  M3_FOOT = {};
  return LIST.filter(function(x){ return +x.lat && +x.lng; }).map(function(x){
    var picked = (typeof selHas === 'function') && selHas(x.id);
    /* المخيمُ بحدوده الحقيقية كما يُرسَم في المسطّح — لا نقطةً — إن كانت حدودُه محمَّلة */
    var ring = campFoot(x);   /* المرسومةُ في التطبيق أو poly.json (V17.59) */
    if (ring) M3_FOOT[x.id] = ring;
    var foot = ring ? 1 : 0;
    return { type:'Feature', geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] },
      properties:{ id:x.id, color:mapColorOf(x), h:m3Height(x), sel:picked ? 1 : 0,
        ring:picked ? '#ffffff' : ((FIELD_MODE === 'brief' && briefRing(x.id)) || '#0b1220'), foot:foot } };
  });
}
/* المخيمُ يُرفَع بحدوده المرسومة (poly.json — الحدودُ نفسُها التي يرسمها المسطّح
   عند التقريب)، وما سواه عمودٌ مضلّعٌ صغيرٌ حول نقطته — المحرّكُ لا يرفع نقطةً */
function m3Cols(P){
  return P.map(function(f){
    var p = f.properties, c = f.geometry.coordinates, lng = c[0], lat = c[1];
    var FR = p.foot ? M3_FOOT[p.id] : null;
    if (FR && FR.length >= 3){
      var R = FR.map(function(q){ return [+q[0], +q[1]]; });
      var a0 = R[0], aN = R[R.length - 1];
      if (a0[0] !== aN[0] || a0[1] !== aN[1]) R.push([a0[0], a0[1]]);
      return { type:'Feature', properties:p, geometry:{ type:'Polygon', coordinates:[R] } };
    }
    var d = 2.2, dy = d / 111320, dx = d / (111320 * Math.cos(lat * Math.PI / 180));
    return { type:'Feature', properties:p,
      geometry:{ type:'Polygon', coordinates:[[[lng - dx, lat - dy], [lng + dx, lat - dy], [lng + dx, lat + dy], [lng - dx, lat + dy], [lng - dx, lat - dy]]] } };
  });
}
/* القمرُ الصناعيُّ نفسُه الذي تعرفه الخريطة المسطّحة — وإلا نمطٌ مفتوحٌ بلا مفتاح */
function m3Style(){
  if (MAP_SAT) return { version:8,
    sources:{ sat:{ type:'raster', tiles:[TILES.esri], tileSize:256, attribution:'&copy; Esri' } },
    layers:[{ id:'sat', type:'raster', source:'sat' }] };
  return 'https://tiles.openfreemap.org/styles/liberty';
}
/* الطبقاتُ تُضاف بعد كلِّ تحميلِ نمطٍ — أوّلِ مرةٍ وبعد تبديل القمر */
function m3Layers(){
  if (!M3) return;
  try {
    if (!M3.getSource('dem')){
      M3.addSource('dem', { type:'raster-dem', tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
                            encoding:'terrarium', tileSize:256, maxzoom:14, attribution:'Terrain &copy; Mapzen/AWS' });
      M3.setTerrain({ source:'dem', exaggeration:1.25 });
      M3.addLayer({ id:'hills', type:'hillshade', source:'dem',
                    paint:{ 'hillshade-exaggeration':0.35, 'hillshade-shadow-color':'#243044' } });
    }
  } catch (e){ LS_ERR = e; }
  try {
    var P = m3Points();
    if (!M3.getSource('nskc')){
      M3.addSource('nskc', { type:'geojson', data:{ type:'FeatureCollection', features:m3Cols(P) } });
      M3.addLayer({ id:'nsk-cols', type:'fill-extrusion', source:'nskc',
        paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'],
                'fill-extrusion-base':0, 'fill-extrusion-opacity':0.92 } });
      /* حدُّ المخيم يُرى من فوق كما في المسطّح — ويبيضُّ عند تحديده */
      M3.addLayer({ id:'nsk-cols-line', type:'line', source:'nskc', filter:['==', ['get','foot'], 1],
        paint:{ 'line-color':['case', ['==', ['get','sel'], 1], '#ffffff', 'rgba(11,18,32,.55)'],
                'line-width':['case', ['==', ['get','sel'], 1], 2.4, 1] } });
    }
    if (!M3.getSource('nsk')){
      M3.addSource('nsk', { type:'geojson', data:{ type:'FeatureCollection', features:P } });
      /* النقطةُ لما لا حدودَ له — المخيمُ المحدود يُلمَس على حدوده */
      M3.addLayer({ id:'nsk-pts', type:'circle', source:'nsk', filter:['==', ['get','foot'], 0],
        paint:{ 'circle-radius':['interpolate', ['linear'], ['zoom'], 12, 3.5, 17, 8],
                'circle-color':['get','color'],
                'circle-stroke-width':['case', ['==', ['get','sel'], 1], 2.5, 1],
                'circle-stroke-color':['get','ring'] } });
    }
    /* مبانٍ ثلاثيةٌ من النمط نفسِه إن وُجدت — سياقٌ لا أكثر */
    var lyr = (M3.getStyle().layers || []).filter(function(l){ return /building/i.test(l.id) && l.type === 'fill-extrusion'; })[0];
    if (lyr) M3.setPaintProperty(lyr.id, 'fill-extrusion-opacity', 0.45);
  } catch (e){ LS_ERR = e; }
}
function m3Count(P){
  var lb = document.getElementById('mapCount');
  if (!lb || !MAP_3D || !M3) return;
  try {
    var b = M3.getBounds(), inV = P.filter(function(f){ return b.contains(f.geometry.coordinates); }).length, out = P.length - inV;
    lb.textContent = nm(inV) + ' / ' + nm(P.length) + ' ' + t('في الإطار') + (out > 0 ? ' \u00b7 ' + nm(out) + ' ' + t('خارج الإطار') : '');
  } catch (e){ LS_ERR = e; }
}
function m3Paint(){
  if (!M3 || !M3.getSource) return;
  var P = m3Points();
  try {
    var s1 = M3.getSource('nsk');  if (s1) s1.setData({ type:'FeatureCollection', features:P });
    var s2 = M3.getSource('nskc'); if (s2) s2.setData({ type:'FeatureCollection', features:m3Cols(P) });
  } catch (e){ LS_ERR = e; }
  m3Count(P);
}
/* النقرةُ في الثلاثيِّ هي نقرةُ الخريطة المسطّحة: تحديدٌ في وضع الإسناد، وبطاقةُ النقطة سواه */
function m3Click(id, ev){
  if (typeof MAP_SELECT !== 'undefined' && MAP_SELECT){
    if (!asnOf(id)){ selToggle(id); m3Paint(); render(1); }
    else toast(t('هذه النقطة مُسندة بالفعل'));
    return;
  }
  popOpenAt(id, ev);
}
function m3Init(){
  var el = document.getElementById('m3Box');
  if (!el || !window.maplibregl) return false;
  if (M3){ try { M3.resize(); } catch (e){ LS_ERR = e; } m3Paint(); return true; }
  try {
    M3 = new maplibregl.Map({
      container:el, style:m3Style(),
      center:[39.89, 21.41], zoom:14.2, pitch:60, bearing:-18, maxPitch:80,
      attributionControl:{ compact:true }
    });
  } catch (e){ M3_ERR = String(e && e.message || e).slice(0, 90); M3 = null; return false; }
  M3.addControl(new maplibregl.NavigationControl({ visualizePitch:true }), 'bottom-right');
  M3.on('error', function(ev){ if (ev && ev.error) LS_ERR = ev.error; });
  M3.on('style.load', m3Layers);
  M3.on('moveend', function(){ if (MAP_3D) m3Count(m3Points()); });
  var hit = function(ev){ var f = ev.features && ev.features[0]; if (f && f.properties && f.properties.id) m3Click(f.properties.id, ev); };
  M3.on('click', 'nsk-pts', hit); M3.on('click', 'nsk-cols', hit);
  M3.on('mouseenter', 'nsk-pts', function(){ M3.getCanvas().style.cursor = 'pointer'; });
  M3.on('mouseleave', 'nsk-pts', function(){ M3.getCanvas().style.cursor = ''; });
  return true;
}
/* الكاميرا تنتقل حيث كان الناظر — لا تبدأ من مكانٍ آخر */
function m3From2D(){
  if (!MAP || !M3) return;
  try { var c = MAP.getCenter(); M3.jumpTo({ center:[c.lng, c.lat], zoom:Math.max(11, MAP.getZoom() - 1), pitch:60, bearing:-18 }); }
  catch (e){ LS_ERR = e; }
}
function m3Toggle(){
  if (MAP_3D){ m3Off(); return; }
  MAP_3D = true; render(1);
  var b3 = document.getElementById('m3Box'); if (b3) b3.hidden = false;
  m3Load().then(function(ok){
    if (!ok || !m3Init()){ toast(t(M3_ERR || 'تعذّر تحميلُ محرّك العرض الثلاثي')); m3Off(); return; }
    m3From2D(); m3Paint();
    /* حدودُ المخيمات تُطلَب مع الثلاثيِّ لا مع التقريب وحده — فتُرفَع كما تُرسَم */
    if (!POLY && typeof polyLoad === 'function') polyLoad().then(function(ok2){ if (ok2 && MAP_3D) m3Paint(); });
  });
}
function m3Off(){
  var was = MAP_3D; MAP_3D = false;
  var b3 = document.getElementById('m3Box'); if (b3) b3.hidden = true;
  if (was && MAP && M3){ try { var c = M3.getCenter(); MAP.setView([c.lat, c.lng], Math.round(M3.getZoom() + 1)); } catch (e){ LS_ERR = e; } }
  render(1);
  setTimeout(function(){ try { if (MAP){ MAP.invalidateSize(); mapPaint(); } } catch (e){ LS_ERR = e; } }, 80);
}
/* تبديلُ القمر أثناء الثلاثيِّ: نمطٌ جديدٌ فتُعاد الطبقاتُ عند تحميله */
function m3Restyle(){
  if (!MAP_3D || !M3) return;
  try { M3.setStyle(m3Style()); } catch (e){ LS_ERR = e; }
}
PAGE.co = { m:'المتابعة', t:'الشركات',
  l:'ما لكلِّ شركةِ خدمةٍ من نقاط، وما يُرسَل إليها من إشعارات.',
  body:function(){
    var head = tabHead('co'), cur = tabCur('co');
    if (cur === 'co') return head + coPopHtml() + coDashCard() + (function(){
    /* إدارةُ القائمة — لمن يملك الاعتماد: إضافةٌ مباشرةٌ وحذفُ ما أُضيف يدويًّا */
    var manage = '';
    if (may('approve')){
      var added = Object.keys(STATE.coreqs || {}).filter(function(k){
        return STATE.coreqs[k] && STATE.coreqs[k].status === 'معتمد'; });
      manage = card('إضافة شركة',
          '<div class="field"><label>' + esc(t('اسم الشركة')) + ' <span class="req">*</span></label>'
          + '<input id="coAddName" dir="auto" placeholder="' + esc(t('كما يُكتَب على لافتة المخيم')) + '"></div>'
          + '<p class="hint">' + esc(t('تدخل القائمةَ الموحّدةَ فورًا فيختارها الميدانُ عند تسجيل موقعٍ جديد. الاسمُ الحرُّ كان يصنع شركتين من واحدة باختلاف حرف.')) + '</p>',
          btn('➕ أضِف','btn-primary btn-sm',' data-coadd="1"'))
        /* توحيدُ اسمين لشركةٍ واحدة — أو تصحيحُ حرفٍ في اسمها — بلا المرور على نقاطها */
        + (may('settings')
          ? card('إعادة تسمية شركة',
              '<div class="grid cols-2">'
              + '<div class="field"><label>' + esc(t('الاسم الحالي')) + '</label>'
              +   '<select id="coRenFrom">' + Object.keys(siteStats().byCo).sort().map(function(c){
                    var lb = coName(c);
                    return '<option value="' + esc(c) + '">' + esc(lb.length > 40 ? lb.slice(0, 39) + '\u2026' : lb) + '</option>'; }).join('')
              +   '</select></div>'
              + '<div class="field"><label>' + esc(t('الاسم الجديد')) + '</label>'
              +   '<input id="coRenTo" dir="auto" placeholder="' + esc(t('أو اسمُ شركةٍ قائمةٍ لدمجهما')) + '"></div>'
              + '</div>'
              + '<p class="hint">' + esc(t('تنتقل نقاطُها ودفترُ جوالها ومحاضرُها إلى الاسم الجديد — واسمان لشركةٍ واحدة يصيران واحدًا.')) + '</p>',
              btn('\u270E ' + t('أعد التسمية'),'btn-secondary btn-sm',' data-coren="1"'))
          : '')
        /* الأسماءُ المركَّبةُ: تُعرَض بأجزائها ويُسنَد المخيّمُ إلى واحدةٍ
           منها بضغطة — والباقي يبقى في القائمة الموحّدة لمن يخدم مخيّمًا آخر */
        + (function(){
            var CM = coCompounds(), keys = Object.keys(CM);
            if (!keys.length) return '';
            /* المفتاحُ رقمان لا نصّان: حرفُ الفصل NUL يستبدله محلِّلُ HTML
               بمحرفِ الاستبدال، فلا تعود القيمةُ كما كُتبت ولا تُطابَق. */
            CO_CMP = CM; CO_CMP_KEYS = keys;
            var rows = [];
            keys.forEach(function(raw, ri){
              var g = CM[raw];
              rows.push(['<span class="hint" style="margin:0">' + esc(coName(raw).slice(0, 90)) + '</span>',
                         N(g.n),
                         '<div class="chips" style="margin:0">' + g.parts.map(function(pt, pi){
                           var pl = coName(pt);
                           return '<button type="button" class="chip" data-copick="' + ri + ':' + pi + '">'
                             + esc(pl.length > 34 ? pl.slice(0, 33) + '\u2026' : pl) + '</button>';
                         }).join('') + '</div>']);
            });
            return cardFlush('\u{1F517} ' + t('أسماءٌ مركَّبةٌ — عدةُ شركاتٍ في سطرٍ واحد') + ' \u2014 ' + nm(keys.length),
              table(['القيمة كما وردت','نقاطها','اختر التي تخدمها'], rows)
              + '<p class="hint" style="margin:8px 0 0">'
              + esc(t('هذه القيمُ جاءت من الملف بعدة شركاتٍ في سطرٍ واحد — فلا تُختار شركةٌ منها بمفردها ولا تُحسَب لها نقاطُها. اضغط الشركةَ التي تخدم المخيّمَ فعلًا فتنتقل نقاطُه إليها؛ والأجزاءُ كلُّها في القائمة الموحّدة أصلًا فتُختار لمخيّماتٍ أخرى.')) + '</p>');
          })()
        + (added.length
          ? cardFlush(t('شركاتٌ أُضيفت') + ' — ' + nm(added.length),
              table(['الشركة','أضافها','مواقعُها',''],
                added.map(function(k){
                  var c = STATE.coreqs[k], used = (STATE.sites || []).filter(function(x){ return x.co === (c.name || k); }).length;
                  return ['<strong>' + esc(dispName(c.name || k)) + '</strong>', esc(dispName(c.by2 || c.by || '—')), N(used),
                          used ? '' : btn('حذف','btn-quiet btn-sm',' data-codel="' + esc(c.name || k) + '"')];
                })))
          : '');
    }
    /* كانت أسماءُ شركاتٍ مكتوبةً بيدٍ بأعدادٍ مخترعة — «شركة الراجحي ١٤٢ موقعًا»
       — تُعرَض في تقريرٍ للوزارة. تُحسب الآن من السجل نفسه. */
    /* «مُسح» و«مُركّب» كلمتان يقرؤهما القارئُ حالةً لا إنجازًا — صارتا «تمّ
       المسح» و«تمّ التركيب». وأُضيف **المتعذّر**: مخيّماتٌ وصلها المشرفُ ولم
       يستطع، وهي أهمُّ عمودٍ للشركة لأنها ما تحتاج قرارَها. وكلُّ رقمٍ يُضغَط
       فيفتح نافذةً بمخيّماته: الاسمُ والشاخصُ والموقعُ على الخريطة والتفاصيل. */
    var S = siteStats(), _MANAGE = manage;
    var rows = Object.keys(S.byCo || {})
      .sort(function(a, b){
        var A = coBuckets(a), B = coBuckets(b);
        var pa = A.sv.length / Math.max(1, S.byCo[a]), pb = B.sv.length / Math.max(1, S.byCo[b]);
        return pa - pb || S.byCo[b] - S.byCo[a];
      })
      .slice(0, 60)
      .map(function(c){
        var B = coBuckets(c);
        var cell = function(kind, n2, cls){
          return n2 ? '<button type="button" class="btn btn-quiet btn-sm" data-copop="' + esc(c) + '" data-cok="' + kind + '"'
                      + ' style="font-weight:700' + (cls ? ';color:' + cls : '') + '">' + nm(n2) + '</button>'
                    : '<span class="num hint">' + nm(0) + '</span>';
        };
        return ['<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'
                + coColor(c) + ';margin-inline-end:7px"></i>' + esc(c),
                cell('all', S.byCo[c]), cell('sv', B.sv.length), cell('stuck', B.stuck.length, '#E05252'),
                cell('ins', B.ins.length), pct(B.sv.length, S.byCo[c])];
      });
    return _MANAGE + card(t('الشركات') + ' — ' + nm(Object.keys(S.byCo || {}).length),
        table(['الشركة','مواقعها','تمّ المسح','متعذّر','تمّ التركيب','٪'], rows))
      + '<p class="hint">' + esc(t('الأقلُّ نسبةً أولًا — وستون شركةً في الصفحة. اضغط أيَّ رقمٍ لترى مخيّماته.')) + '</p>';
  })();
    return head + (function(){
    var S = siteStats();
    var cos = Object.keys(S.byCo).sort(function(a,b){ return S.byCo[b] - S.byCo[a]; });
    CO_STALL = {}; mfuObstacles().forEach(function(o){ if (o.x.co) CO_STALL[o.x.co] = (CO_STALL[o.x.co] || 0) + 1; });   /* (V28.5) المتعثر: نقاطُها التي عليها عائقٌ ولم تُركَّب — بتعريف متابعة الوزارة */
    var withTel = cos.filter(function(c){ return !!coTelOf(c); }).length;
    var sel = WA_CO && cos.indexOf(WA_CO) > -1 ? WA_CO : (cos[0] || '');
    return stats([['شركات', N(cos.length), 'acc'],
                  ['لها جوالٌ محفوظ', N(withTel), withTel ? 'ok' : 'wrn'],
                  ['بلا جوال', N(cos.length - withTel), cos.length - withTel ? 'wrn' : 'ok']])

      + card('إشعار شركة',
        '<div class="grid cols-3">'
        + '<div class="field"><label>' + esc(t('الشركة')) + '</label>'
        + '<select id="waCo" data-waco="1">' + cos.slice(0, PG_Q ? 5000 : 200).map(function(c){
            return '<option value="' + esc(c) + '"' + (c === sel ? ' selected' : '') + '>'
              + esc(c.length > 34 ? c.slice(0, 33) + '\u2026' : c)
              + '</option>'; }).join('') + '</select></div>'
        + '<div class="field"><label>' + esc(t('نوع الإشعار')) + '</label>'
        + '<select id="waKind">' + Object.keys(WA_KINDS).map(function(k){
            return '<option value="' + k + '"' + (WA_KIND === k ? ' selected' : '') + '>'
              + WA_KINDS[k].i + ' ' + esc(t(WA_KINDS[k].n)) + '</option>'; }).join('') + '</select></div>'
        + '<div class="field"><label>' + esc(t('الموعد')) + '</label>'
        + '<input id="waWhen" type="date"></div>'
        + '</div>'
        + (sel
          ? '<div class="pop-rows" style="margin:6px 0 0">'
            + '<div><span class="k">' + esc(t('جوالُ الشركة')) + '</span><span class="num" dir="ltr">'
            +   esc(coTelOf(sel) || '\u2014') + '</span></div>'
            + '<div><span class="k">' + esc(t('نقاطُها')) + '</span><span class="num">' + nm(coStat(sel).n) + '</span></div>'
            + '<div><span class="k">' + esc(t('مُركّب')) + '</span><span class="num">' + nm(coStat(sel).ins) + '</span></div>'
            + '<div><span class="k">' + esc(t('سُلِّم')) + '</span><span class="num">' + nm(coStat(sel).hd) + '</span></div></div>'
          : '')
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('النصُّ يُبنى من حالة الشركة نفسِها — عددُ نقاطها وما رُكِّب وما سُلِّم — فلا يُكتَب رقمٌ باليد ولا يُرسَل ما لا يطابق السجل.')) + '</p>',
        '<div class="actions">'
        + btn('\u{1F4AC} ' + t('واتساب'),'btn-primary',' data-wa="co"')
        + btn('\u2709 ' + t('بريد رسمي'),'btn-secondary',' data-mailco="1"')   /* (V29.0) */
        + btn(t('نسخ النص'),'btn-secondary',' data-wacopy="co"')
        + '</div>')

      + cardFlush(t('الشركات') + ' — ' + nm(cos.length),
          table(['الشركة','ضابط الاتصال','نقاطها','مُسح','المنجز','المتبقي','متعثر','سُلِّم','جوالها','بريدها',''],   /* (V28.5، والبريد V29.0) */
            cos.slice(0, PG_Q ? 5000 : 200).map(function(c){
              var st = coStat(c), ph = coTelOf(c), lz = coLiaisonOf(c), cs = CO_STALL ? (CO_STALL[c] || 0) : 0;
              return [esc(c.length > 30 ? c.slice(0, 29) + '\u2026' : c),
                      may('approve') ? '<input value="' + esc(lz) + '" data-coliaison="' + esc(c) + '" dir="auto" placeholder="' + esc(t('الاسم')) + '" style="width:140px">' : (lz ? esc(lz) : '\u2014'),
                      N(st.n), N(st.sv), N(st.ins), N(Math.max(0, st.n - st.ins)), cs ? '<span class="pill wrn">' + nm(cs) + '</span>' : N(0), N(st.hd),
                      may('approve')
                        ? '<input value="' + esc(ph) + '" data-cotel="' + esc(c) + '" dir="ltr" inputmode="tel" placeholder="05xxxxxxxx" style="width:132px">'
                        : (ph ? '<span class="num" dir="ltr">' + esc(ph) + '</span>' : '\u2014'),
                      may('approve') ? '<input value="' + esc(coEmailOf(c)) + '" data-coemail="' + esc(c) + '" dir="ltr" inputmode="email" placeholder="name@company.com" style="width:170px">' : (coEmailOf(c) ? '<span dir="ltr">' + esc(coEmailOf(c)) + '</span>' : '\u2014'),   /* (V29.0) */
                      (coEmailOf(c) ? btn('\u2709', 'btn-quiet btn-sm', ' data-mailsend="plan|' + esc(c) + '" title="' + esc(t('بريد رسمي')) + '"') : '') + (ph ? '<div class="actions" style="margin:0">'
                           + btn('\u{1F4C5}','btn-quiet btn-sm',' data-wasend="plan|' + esc(c) + '" title="' + esc(t('إشعار تركيب قادم')) + '"')
                           + btn('\u{1F91D}','btn-quiet btn-sm',' data-wasend="hand|' + esc(c) + '" title="' + esc(t('إشعار تسليم')) + '"')
                           + btn('\u{1F9E9}','btn-quiet btn-sm',' data-wasend="dis|' + esc(c) + '" title="' + esc(t('إشعار فك')) + '"')
                           + '</div>'
                         : '<span class="hint" style="margin:0">' + esc(t('احفظ الجوال أولًا')) + '</span>')];
            })))
      + '<p class="hint">' + esc(t('الرقمُ يُصحَّح تلقائيًّا: صفرُ البداية يصير ٩٦٦ — فلا يُرسَل إلى رقمٍ خاطئ. والجوالُ يُحفَظ مرةً ويُرفَع، فيجده كلُّ جهاز.')) + '</p>';
  })();
  }};

function waSend(kind, copy){
  var co = (document.getElementById('waCo') || {}).value || WA_CO;
  var kd = (document.getElementById('waKind') || {}).value || WA_KIND;
  var wn = (document.getElementById('waWhen') || {}).value || '';
  waGo(co, kd, wn, copy);
}

/* ═══ موقعٌ غير مسجّل — يُضاف من الميدان ═══
   ما لم يكن في القاعدة يُسجَّل بموضعه الحقيقي، ويُوسَم جديدًا حتى يعتمده المهندس. */
var WA_CO = '', WA_KIND = 'plan';
var WR_EDIT = '';   /* طلبُ الورشة المفتوحُ للتعديل */
var NEWSITE = { lat:0, lng:0, zone:'منى', type:'مخيم', sq:'', sign:'',
                co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{}, nm:'', center:'', chals:[] };   /* (V29.7) الاسمُ والمركزُ والتحديات */
/* (V29.7) قرارُ المالك: المربعُ والشاخصُ والشركةُ للمخيمات وحدَها؛ وغيرُها اسمٌ ومشعرٌ ونوع. والسببُ والتحدياتُ وأوّلُ صورتين إلزاميةٌ للكلّ.
   ومراكزُ التفويج تُختار بمركزها (النورية، طريق الهجرة، الزايدي) — كان «الزايدي» لا يُوجَد في الاختيار. */
var NS_CENTERS = [['النورية', 'النورية'], ['طريق الهجرة', 'محطات طريق الهجرة'], ['الزايدي', 'الزايدي']];
var NS_REASONS_PT = ['نقطة جديدة لم تكن في السجل', 'موقعها في السجل خاطئ', 'سبب آخر'];
var NS_CO_OPEN = false, NS_CO_Q = '';

/* أسبابُ عدم وجوده في السجل — من الميدان لا من الخيال */
var NS_REASONS = ['مخيم جديد لم يكن موجودًا','مخيم انقسم إلى أكثر من واحد',
                  'عدم وجود تخصيص','تغيّر ترقيم الشاخص',
                  'الشاخص مفقود أو غير واضح','سبب آخر'];

/* الصورُ الخمس — الأولى وحدها إلزامية، بها يطابق المكتبُ الموقع */
var NS_PHOTOS = ['صورة الشاخص أو اللوحة بأرقامها واضحة','لقطة عامة للموقع','المدخل',
                 'نقطة التركيب المقترحة','أي عائق أو ملاحظة'];

/* صيغةُ الشاخص: اسم الخيمة/رقم الشارع — 57/2 و12أ/8 كلاهما صحيح */
var NS_SIGN_RE = /^[0-9A-Za-z\u0621-\u064A]+(?:[-\/][0-9A-Za-z\u0621-\u064A]+)+$/;
var NS_SQ_RE   = /^[0-9A-Za-z\u0621-\u064A]+(?:-[0-9A-Za-z\u0621-\u064A]+)*$/;

/* المسجَّلُ داخل مئةٍ وأربعين مترًا — أغلبُ «المخيم غير موجود» وقوفٌ بجانب مسجَّل */
function nsNear(){
  var la = NEWSITE.lat || (MYPOS && MYPOS.lat), lo = NEWSITE.lng || (MYPOS && MYPOS.lng);
  if (!la || !lo) return null;
  var me = { lat:la, lng:lo };
  return STATE.sites.filter(function(x){ return x.lat && x.lng; })
    .map(function(x){ return { s:x, d:(distKm(me, x) || 0) * 1000 }; })
    .filter(function(x){ return x.d < 140; })
    .sort(function(a,b){ return a.d - b.d; }).slice(0, 5);
}

/* القائمةُ الموحّدة مرشَّحةً بالبحث — والمرجعُ بياناتُ المشروع لا قائمةٌ مكتوبةٌ بيد */
function coHit(c, q){
  if (!q) return true;
  var s2 = String(q).toLowerCase();
  return c.toLowerCase().indexOf(s2) > -1 || String(coName(c)).toLowerCase().indexOf(s2) > -1;
}
function nsCoRows(){
  var q = String(NS_CO_Q || '').trim();
  return CO_LIST.filter(function(c){ return coHit(c, q); });
}

function nsCoCard(){
  var rows = nsCoRows();
  return card('شركة تقديم الخدمة — القائمة الموحّدة',
    '<div class="field"><input type="search" id="nsCoQ" data-nsq="1" value="' + esc(NS_CO_Q) + '" '
    + 'placeholder="' + esc(t('ابحث باسم الشركة')) + '" spellcheck="false"></div>'
    + '<div style="max-height:44vh;overflow:auto;border:1px solid var(--line);border-radius:var(--radius-sm)">'
    + (rows.length
        ? rows.map(function(c){
            /* القيمةُ عربيةٌ (المفتاح) والنصُّ بلغة الواجهة */
            return '<button type="button" class="btn btn-quiet" data-nscopick="' + esc(c) + '" '
              + 'style="width:100%;justify-content:flex-start;text-align:start;border:0;'
              + 'border-bottom:1px solid var(--line-2);border-radius:0;min-height:44px">'
              + '<i style="width:10px;height:10px;border-radius:50%;background:' + coColor(c)
              + ';flex:0 0 auto;margin-inline-end:8px"></i>' + esc(coName(c)) + '</button>';
          }).join('')
        : '<p class="hint" style="padding:14px">' + esc(t('لا نتائج')) + '</p>')
    + '</div>'
    + '<div class="grid cols-2" style="margin-top:12px">'
    + '<div class="field"><label>' + esc(t('اسم شركة غير موجودة بالقائمة')) + '</label>'
    + '<input id="nsCoNew" dir="auto" placeholder="' + esc(t('يعتمده المهندس قبل أن يُستعمل')) + '"></div>'
    + '<div class="field"><label>&nbsp;</label>'
    + btn('+ إضافة للقائمة','btn-secondary',' data-nscoreq="1" style="width:100%"') + '</div>'
    + '</div>'
    + '<p class="hint">' + esc(t('غير الموجودة تُطلب من المهندس ولا تدخل القائمة قبل اعتماده.')) + '</p>',
    btn('إغلاق','btn-quiet btn-sm',' data-nsco="0"'));
}


function nsCapture(){
  if (!navigator.geolocation){ toast(t('تعذّر تحديد الموقع')); return; }
  toast(t('يُلتقَط موضعك…'));
  navigator.geolocation.getCurrentPosition(function(p){
    NEWSITE.lat = p.coords.latitude; NEWSITE.lng = p.coords.longitude;
    MYPOS = { lat:NEWSITE.lat, lng:NEWSITE.lng, at:Date.now() };
    toast(t('التُقط'));
    render(1);
  }, function(){ toast(t('تعذّر تحديد الموقع')); }, { enableHighAccuracy:true, timeout:10000 });
}

/* طلبُ إضافة شركةٍ إلى القائمة الموحّدة — يُسجَّل ولا يدخل القائمة قبل اعتماد المهندس */
function nsCoRequest(){
  var el = document.getElementById('nsCoNew');
  var nm0 = el ? String(el.value || '').trim() : '';
  if (!nm0){ toast(t('اكتب اسم الشركة أولًا')); return; }
  if (CO_LIST.indexOf(nm0) > -1){
    NEWSITE.co = nm0; NEWSITE.coReq = ''; NS_CO_OPEN = false;
    toast(t('موجودة في القائمة — اختِيرت'));
    render(1); return;
  }
  if (!STATE.coreqs) STATE.coreqs = {};
  if (STATE.coreqs[nm0]){
    NEWSITE.coReq = nm0; NEWSITE.co = ''; NS_CO_OPEN = false;
    toast(t('سبق إرسالُ طلبٍ لهذه الشركة — بانتظار اعتماد المهندس'));
    render(1); return;
  }
  NEWSITE.coReq = nm0; NEWSITE.co = '';
  STATE.coreqs[nm0] = { name:nm0, by:STATE.meta.name || '', at:Date.now(), status:'مطلوب' };
  CORE.set('coreqs', nm0, STATE.coreqs[nm0]);
  logEvent('طلب إضافة شركة — ' + nm0);
  notifPush('طلب شركة', 'طلبُ إضافة شركةٍ بانتظار اعتمادك — ' + nm0, { lv:'مهم' });
  NS_CO_OPEN = false;
  toast(t('أُرسل الطلب — يعتمده المهندس'));
  render(1);
}

/* ═══ من يضيف النقطةَ يقرّر ما تكونه (V17.57) ═══
   «نقطة هنا» أداةُ المكتب: المهندسُ يضعها من الخريطة ولم يقف عندها — فلا صورَ
   تُطلَب، ولا تُحتسَب زيارة، ويُفتَح بعدها لوحُ الإسناد لتُجدوَل زيارتُها.
   والمشرفُ أو الفنيُّ يضيفها واقفًا عندها — فالصورةُ إلزامية، والإضافةُ زيارةٌ
   تُكتَب بانتظار الاعتماد ثم يُستكمَل مسحُها. والفرقُ بالرتبة لا بالزرّ: من
   أضاف من «موقع غير مسجّل» بموضعه وهو مهندسٌ فإضافتُه إضافةُ مكتب. */
function nsOffice(){ return rankOf(effRole(ROLE)) >= rankOf('engineer'); }

/* رمزُ النوع في المعرِّف — جدولٌ واحدٌ لكلِّ من يُنشئ نقطة (V17.60) */
var TYPE_CODE = { 'مخيم':'CMP', 'ممر':'RDR', 'كاميرا':'CAM', 'محطة':'STN', 'جسر':'JMR', 'بوابة':'GTE', 'مبنى':'BLD',
                  'LPR':'LPR', 'جيت واي':'GTW', 'حساس حرارة ورطوبة':'THS' };
function typeCode(ty){
  if (TYPE_CODE[ty]) return TYPE_CODE[ty];
  var a = String(ty || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return a ? a.slice(0, 4) : 'NEW';
}
/* اسمُ النقطة الجديدة: المخيمُ بمربعه وشاخصه، وغيرُه بنوعه ومشعره — كان كلُّ
   ما ليس مخيمًا يُسمّى «منى - مربع  - شاخص » بخانتين فارغتين */
function nsName(id){
  if (NEWSITE.type === 'مخيم') return NEWSITE.zone + ' - مربع ' + NEWSITE.sq + ' - شاخص ' + NEWSITE.sign;
  var ty = NEWSITE.type, d = CAT_DEF[ty] || {};
  var tn = /[\u0600-\u06FF]/.test(ty) ? ty : (d.l || ty);
  return tn + ' - ' + NEWSITE.zone + ' - ' + String(id).split('-').pop();
}

/* ═══ زيارةُ الميدان تُسجَّل بإضافة النقطة (V17.57) ═══
   الواقفُ عند النقطة صوّرها — فالإضافةُ زيارة: تُكتَب بانتظار الاعتماد وتحمل
   صورَها، ثم يُفتَح نموذجُ المسح لتُستكمَل بياناتُها، ولا يُعتمَد ما لم يُستكمَل. */
function nsVisitRec(id){
  var keys = Object.keys(NEWSITE.photos || {}).filter(function(k){ return NEWSITE.photos[k]; });
  return CORE.set('recs', id, {
    id:id, by:STATE.meta.name || '', at:Date.now(), access:'تم الوصول', review:'pending',
    src:'newsite', photos:keys.map(function(k){ return 'new_' + k; }), phN:keys.length,
    chals:(NEWSITE.chals || []).slice(),   /* (V29.7) التحدياتُ من نموذج الموقع الجديد */
    note:String(NEWSITE.why || '').trim()
  });
}

/* ═══ جدولةُ زيارةٍ لما أضافه المكتب (V17.57) ═══
   نقطةُ المكتب لم يزرها أحد: لا نموذجَ مسحٍ يُفتَح عليها، بل لوحُ الإسناد في
   طبقة المسح وهي محدَّدةٌ فيه — يُختار من يزورها وموعدُه ويُسنَد. */
function visitAsnOpen(ids, quiet){
  ids = (Array.isArray(ids) ? ids : [ids]).filter(function(id){ return !!siteFind(id); });
  if (!ids.length){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  selClear();
  ids.forEach(function(id){ if (!asnOf(id)){ SEL[id] = 1; SEL_N++; } });
  FIELD_MODE = 'survey'; ASN_KIND = 'visit'; ASN_PICK = false; ASN_BASE = [];
  POP_OPEN = false; MAP_SELECT = false;
  goPage('map'); ASN_OPEN = true;
  if (!quiet) toast(t('جدوِل زيارتَها: اختر من يزورها وموعدَه ثم «أسند»'));
  render(1);
  return true;
}

function nsSave(){
  var office = nsOffice();
  var lat = NEWSITE.lat || (MYPOS && MYPOS.lat), lng = NEWSITE.lng || (MYPOS && MYPOS.lng);
  if (!lat || !lng){ toast(t('التقط موضعك أولًا')); return; }

  NEWSITE.sq   = String(NEWSITE.sq   || '').trim();
  NEWSITE.sign = String(NEWSITE.sign || '').trim();

  if (!NEWSITE.zone || !NEWSITE.type){ toast(t('اختر المشعر ونوع الموقع')); return; }
  var camp = NEWSITE.type === 'مخيم';
  /* المربعُ والشاخصُ للمخيم وحدَه؛ وغيرُه يُحفَظ بلا مربعٍ ولا شاخص */
  if (camp){
    if (!NEWSITE.sq){   toast(t('رقم المربع مطلوب')); return; }
    if (!NEWSITE.sign){ toast(t('رقم الشاخص مطلوب')); return; }
    if (!NS_SQ_RE.test(NEWSITE.sq)){
      toast(t('رقم المربع: أرقامٌ أو أرقام-أرقام — مثال 7 أو 7-14')); return; }
    if (!NS_SIGN_RE.test(NEWSITE.sign)){
      toast(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')); return; }
  } else { NEWSITE.sq = ''; NEWSITE.sign = ''; }
  if (camp && NEWSITE.reason !== 'عدم وجود تخصيص' && !NEWSITE.co && !NEWSITE.coReq){
    toast(t('اختر شركة الخدمة من القائمة — أو اطلب إضافتها، أو اختر السبب «عدم وجود تخصيص»')); return; }
  /* المركَّبةُ لا تُطابِق القائمةَ نصًّا — يُقبَل ما كانت أجزاؤه كلُّها فيها */
  if (NEWSITE.co && CO_LIST.indexOf(NEWSITE.co) < 0
      && !siteCos({ co:NEWSITE.co }).every(function(one){ return CO_LIST.indexOf(one) > -1; })){
    toast(t('اسم الشركة يجب أن يكون من القائمة الموحّدة فقط')); return; }
  /* (V29.7) غيرُ المخيم: اسمُه إلزاميٌّ لمن يقف عندها (والمكتبُ يأخذ الاسمَ المبنيَّ من النوع والمشعر إن تركه)، ومراكزُ التفويج بمركزها؛
     والسببُ والتحدياتُ وأوّلُ صورتين إلزاميةٌ للميدان — والمكتبُ لم يقف عند النقطة فيجدوِل زيارتَها */
  NEWSITE.nm = String(NEWSITE.nm || '').trim();
  /* الصورةُ إلزاميةٌ لمن يقف عند النقطة — والمكتبُ لم يقف (V17.57) */
  if (!office && !NEWSITE.photos[0]){ toast(t('صورة الشاخص إلزامية للاعتماد')); return; }
  if (!camp && !office && !NEWSITE.nm){ toast(t('اسم النقطة مطلوب')); return; }
  if (NEWSITE.type === 'LPR' && !NEWSITE.center){ toast(t('اختر المركز: النورية أو طريق الهجرة أو الزايدي')); return; }
  if (!office && !NEWSITE.reason){ toast(t('اختر سببَ عدم وجوده في السجل')); return; }
  if (!office && !(NEWSITE.chals || []).length){ toast(t('اختر التحديات — أو «لا توجد تحديات»')); return; }
  if (!office && !NEWSITE.photos[1]){ toast(t('أوّلُ صورتين إلزاميتان: الشاخص أو اللوحة، ولقطةٌ عامةٌ للموقع')); return; }   /* (V29.7) والثانيةُ أيضًا */
  if (!camp){ NEWSITE.co = ''; NEWSITE.coReq = ''; NEWSITE.tents = ''; }

  var pre = zoneCode(NEWSITE.zone);
  var tp  = typeCode(NEWSITE.type);
  var n = STATE.sites.filter(function(x){ return x.id.indexOf('NSK-' + pre + '-' + tp + '-N') === 0; }).length + 1;
  var id = 'NSK-' + pre + '-' + tp + '-N' + String(n).padStart(3, '0');

  var site = {
    id:id, name:(!camp && NEWSITE.nm) ? NEWSITE.nm : nsName(id),   /* (V29.7) غيرُ المخيم باسمه المكتوب */
    zone:NEWSITE.zone, type:NEWSITE.type, work:'موقع جديد',
    tg:NEWSITE.type === 'LPR' ? 'مراكز التفويج' : '', tt:NEWSITE.type === 'LPR' ? NEWSITE.center : '',
    chals:(NEWSITE.chals || []).slice(),
    lat:lat, lng:lng, sq:NEWSITE.sq, sign:NEWSITE.sign,
    co:NEWSITE.co, coReq:NEWSITE.coReq, tents:cfgN(NEWSITE.tents),
    reason:NEWSITE.reason, why:NEWSITE.why,
    region:'منطقة ' + NEWSITE.zone, fstat:'لم يبدأ', inout:'',
    isNew:true, approved:false, by:STATE.meta.name || '', at:Date.now(),
    origin:office ? 'office' : 'field',
    note:NEWSITE.note
  };
  STATE.sites.push(site);
  SITE_IX = null; SITE_TOK = null;
  CORE.set('newsites', id, site);

  /* الصورُ إلى درايف كسائر صور النظام — لا إلى القاعدة.
     كانت تُكتَب خامًّا هنا وحدها: خمسُ صورٍ بمئتي كيلو تقارب حدَّ الوثيقة
     الواحدة، وتلتهم الجيجابايتَ المتاحَ في أيام. */
  Object.keys(NEWSITE.photos).forEach(function(i){
    var p = NEWSITE.photos[i];
    if (typeof photoQueue === 'function') photoQueue(id, 'new_' + i, p && (p.d || p.data));
  });

  if (!office) nsVisitRec(id);
  stepDone('newsite', id, office ? 'أضافها المكتب — تُجدوَل زيارتُها' : 'أُضيفت في الموقع — تُحتسَب زيارة', 0);
  notifPush('موقع مقترح', 'موقعٌ جديدٌ بانتظار اعتمادك — ' + NEWSITE.zone,
            { site:id, lv:'مهم' });
  logEvent('موقع جديد — ' + id + ' · ' + NEWSITE.zone
    + (NEWSITE.coReq ? ' · طلب شركة: ' + NEWSITE.coReq : ''), id);
  statBump();
  toast(id + ' \u00b7 ' + t(office ? 'سُجّلت — جدوِل زيارتَها الآن' : 'سُجّلت زيارةً — أكمل بياناتِ المسح'));

  NEWSITE = { lat:0, lng:0, zone:NEWSITE.zone, type:NEWSITE.type, sq:'', sign:'',
              co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{}, nm:'', center:'', chals:[] };
  NS_CO_OPEN = false; NS_CO_Q = '';

  /* المكتبُ لم يزرها: لا نموذجَ مسحٍ يُفتَح بل لوحُ الإسناد عليها — فتُجدوَل
     زيارتُها الآن ولا تُنسى (V17.57). والميدانُ زارها فعلًا: يُفتَح نموذجُ
     المسح عليه فورًا — الشاشةُ تُنشئه، والنموذجُ يُكمله */
  if (office){ visitAsnOpen(id); return; }
  DETAIL_ID = id;
  formGo(id, 'new');
  CUR = 'svForm';
  render(1);
}

/* ═══ جسرُ Google Drive — الصورُ في مساحتك لا في Firestore ═══
   خمسةُ تيرا في درايفك تكفي المشروعَ كلَّه، ووثيقةُ Firestore لا تتجاوز
   ميغابايتًا — فتُرفَع الصورُ هناك ويُحفَظ معرّفُها هنا. */

var DRV = {
  /* يُملأ من الإعدادات — يُنشَأ في Google Cloud Console */
  clientId: '',
  folderId: '',                 /* مجلّدُ المشروع في درايفك */
  scope: 'https://www.googleapis.com/auth/drive.file',
  token: '', exp: 0, ready: false, lib: false
};

function drvCfg(){
  try{
    DRV.clientId = localStorage.getItem('nsk14.drv.client') || '';
    DRV.folderId = lsGet('nsk14.drv.folder') || '';
  }catch(e){ LS_ERR = e; }
  return !!DRV.clientId;
}

/* تُحمَّل مكتبةُ جوجل كسولًا — لا تُطلَب قبل أول رفع */
function drvLoad(){
  if (DRV.lib) return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise(function(res){
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload  = function(){ DRV.lib = true; res(true); };
    s.onerror = function(){ res(false); };
    document.head.appendChild(s);
    setTimeout(function(){ if (!DRV.lib) res(false); }, 9000);
  });
}

/* الإذنُ يُطلَب مرةً ويُجدَّد قبل انتهائه بدقيقة */
function drvAuth(){
  if (DRV.token && Date.now() < DRV.exp - 60000) return Promise.resolve(DRV.token);
  if (!drvCfg()) return Promise.reject(new Error('no-client'));
  return drvLoad().then(function(ok){
    if (!ok || !window.google || !google.accounts) throw new Error('no-lib');
    return new Promise(function(res, rej){
      var tc = google.accounts.oauth2.initTokenClient({
        client_id: DRV.clientId,
        scope: DRV.scope,
        callback: function(r){
          if (r && r.access_token){
            DRV.token = r.access_token;
            DRV.exp = Date.now() + (r.expires_in || 3600) * 1000;
            DRV.ready = true;
            res(DRV.token);
          } else rej(new Error('denied'));
        }
      });
      tc.requestAccessToken({ prompt: DRV.token ? '' : 'consent' });
    });
  });
}

/* dataURL إلى Blob — الصورُ مضغوطةٌ أصلًا على الجهاز */
function dataToBlob(d){
  var i = d.indexOf(','), meta = d.slice(0, i);
  var mime = (meta.match(/data:([^;]+)/) || [,'image/jpeg'])[1];
  var bin = atob(d.slice(i + 1));
  var arr = new Uint8Array(bin.length);
  for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
  return new Blob([arr], { type: mime });
}

/* الرفع: وصفٌ ثم محتوى، في طلبٍ واحدٍ متعدّد الأجزاء */
function drvUpload(name, dataUrl){
  return drvAuth().then(function(tok){
    var blob = dataToBlob(dataUrl);
    var meta = { name: name, mimeType: blob.type };
    if (DRV.folderId) meta.parents = [DRV.folderId];
    var fd = new FormData();
    fd.append('metadata', new Blob([JSON.stringify(meta)], { type:'application/json' }));
    fd.append('file', blob);
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      { method:'POST', headers:{ Authorization:'Bearer ' + tok }, body: fd })
      .then(function(r){ return r.ok ? r.json() : r.json().then(function(e){ throw new Error(e.error && e.error.message || 'upload'); }); })
      .then(function(j){
        /* الملفُ يُولَد خاصًّا بمن رفعه: يراه هو ولا يراه المكتبُ ولا الفنيُّ
           الذي يزور بعده. والفنيُّ لا حسابَ جوجل له أصلًا — فالمشاركةُ
           بالرابط هي السبيلُ الوحيدُ ليُفتَح من داخل التطبيق. */
        return fetch('https://www.googleapis.com/drive/v3/files/' + j.id + '/permissions',
          { method:'POST',
            headers:{ Authorization:'Bearer ' + tok, 'Content-Type':'application/json' },
            body: JSON.stringify({ role:'reader', type:'anyone' }) })
          .then(function(){ return j; })
          .catch(function(){ return j; });   /* رُفعت وإن تعذّرت المشاركة */
      });
  });
}

/* طابورُ الصور: تُحفَظ محليًّا ثم تُرفَع حين تتاح الشبكةُ والإذن.
   وما تعذّر رفعُه لا يُسقَط: كان يُشطَب بعد خمس محاولاتٍ فيبقى السجلُّ بلا
   صورةٍ والصورةُ على جهازٍ واحدٍ لا يعلم بها أحد. صار يُنقَل إلى قائمةٍ
   تُعرَض في شاشة التخزين بزرِّ إعادة، فالفقدُ المعلَنُ يُعالَج والصامتُ لا. */
var PHOTO_Q = [], PHOTO_FAIL = [];

/* ═══ اسمُ الصورة على الدرايف ═══
   كان الاسمُ يحمل النوعَ والوقتَ بالثانية: «NSK-…-0001__site__2026-09-06-14-30-05»
   — لا يُقرأ، ولا تُعرَف صورةُ نقطةٍ من أختها إلا بفتحها. صار اسمَ النقطة
   ورقمًا يزيد: أوّلُ صورةٍ «NSK-…-0001-1» ثم «-2» ثم «-3». فيُفرَز المجلدُ
   بالاسم فتتجاور صورُ النقطة الواحدة مرتَّبةً كما التُقطت.
     والرقمُ يُحسب مما رُفع فعلًا لهذه النقطة وما ينتظر في الطابور — لا من
   عدّادٍ في الذاكرة يبدأ من واحدٍ كلَّما أُغلق التطبيق. */
function photoNext(siteId){
  var n = 0;
  Object.keys(STATE.photos || {}).forEach(function(k){
    var v = STATE.photos[k];
    if (v && v.site === siteId) n++;
  });
  PHOTO_Q.forEach(function(q){ if (q.site === siteId) n++; });
  return n + 1;
}
function photoQueue(siteId, kind, dataUrl){
  var pq = dataUrl ? PHOTO_Q_IX[String(dataUrl).length + ':' + String(dataUrl).slice(-64)] : null;   /* (V30.6) */
  if (pq && photoDupOf(siteId, pq)) toast('\u26A0 ' + t('هذه الصورة تكاد تطابق صورةً سابقةً لنفس النقطة'));
  PHOTO_Q.push({ site:siteId, kind:kind, data:dataUrl, at:Date.now(), tries:0,
                 seq:photoNext(siteId), q:pq || null });
  CORE.saveSoon();
  photoFlush();
}

/* ═══ الصورةُ تصعد إلى القاعدة والخادمُ ينقلها إلى الدرايف ═══
   كان الرفعُ إلى الدرايف من الهاتف نفسِه، ويحتاج معرِّفَ عميلٍ في كلِّ جهازٍ
   وتسجيلَ دخولٍ إلى جوجل من كلِّ فنيّ — ومئةٌ وخمسون هاتفًا لا يُضبَط
   واحدُها بعد الآخر، فبقيت الصورُ في الطوابير. أما الخادمُ فعنده مفتاحُ
   المشروع والدرايفُ مشارَكٌ معه أصلًا (به تُؤخَذ النسخةُ الاحتياطية).
     فصار الهاتفُ يكتب الصورةَ مضغوطةً في وثيقتها بالقاعدة — بلا إعدادٍ ولا
   دخولٍ — والخادمُ يمرُّ كلَّ عشر دقائق: ينقلها إلى مجلد الدرايف باسم النقطة
   ورقمها، ويكتب رابطَها في الوثيقة ويمحو الصورةَ منها فلا تُثقِل القاعدة.
   ومن كان عنده معرِّفُ العميل القديمُ بقي طريقُه يعمل. */
function photoFlush(){
  if (!PHOTO_Q.length || !STATE.meta.online) return Promise.resolve(0);
  if (!drvCfg()) return photoFlushCloud();
  var it = PHOTO_Q[0];
  /* الرقمُ يُثبَّت عند الإدراج ويُعاد حسابُه إن غاب (طابورٌ من نسخةٍ أقدم) */
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site));
  var nm2 = it.site + '-' + seq + '.jpg';
  return drvUpload(nm2, it.data).then(function(r){
    PHOTO_Q.shift();
    /* في الوثيقة معرّفُ الملف ورابطُه لا الصورةُ نفسها */
    /* المفتاحُ بالرقم لا بالنوع: كانت صورةٌ ثانيةٌ من النوع نفسِه تكتب فوق
       الأولى في السجل — فيبقى الملفان على الدرايف ولا يُعرَف إلا آخرُهما. */
    CORE.set('photos', it.site + '-' + seq, {
      site:it.site, kind:it.kind, seq:seq, name:nm2,
      driveId:r.id, link:r.webViewLink, at:it.at, q:it.q || null   /* (V30.6) */
    });
    logEvent('رفع صورة — ' + it.site + ' \u00b7 ' + it.kind + ' \u00b7 ' + nm2, it.site);
    if (PHOTO_Q.length) setTimeout(photoFlush, 400);
    return 1;
  }).catch(function(e){
    it.tries++;
    it.why = String(e && e.message || '').slice(0, 80);
    if (it.tries > 5){
      PHOTO_Q.shift();
      PHOTO_FAIL.push(it);
      CORE.saveSoon();
      logEvent('تعذّر رفع صورة — ' + it.site + ' · ' + it.kind + (it.why ? ' · ' + it.why : ''), it.site);
    }
    return 0;
  });
}

function photoFlushCloud(){
  var it = PHOTO_Q[0];
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site));
  var nm2 = it.site + '-' + seq + '.jpg';
  var data = String(it.data || '');
  /* سقفُ الوثيقة ميغابايت: ما زاد يُضغَط ثانيةً — وما بقي فوقه يُترَك للدرايف المباشر */
  if (data.length > 900000){
    it.tries++; it.why = 'الصورةُ أكبرُ من سقف القاعدة';
    if (it.tries > 5){ PHOTO_Q.shift(); PHOTO_FAIL.push(it); CORE.saveSoon(); }
    return Promise.resolve(0);
  }
  PHOTO_Q.shift();
  CORE.set('photos', it.site + '-' + seq, {
    site:it.site, kind:it.kind, seq:seq, name:nm2, at:it.at, by:STATE.meta.name || '',
    status:'pending', data:data, q:it.q || null   /* (V30.6) مقاييسُ الجودة */
  });
  CORE.saveSoon();
  logEvent('رفع صورة — ' + it.site + ' \u00b7 ' + it.kind + ' \u00b7 ' + nm2 + ' — ينقلها الخادمُ إلى الدرايف', it.site);
  if (PHOTO_Q.length) setTimeout(photoFlush, 300);
  return Promise.resolve(1);
}

/* ═══ الصورُ: من رفع، ومن شاهد، ومن حذف ═══
   الصورةُ حجّةٌ يُعتمَد بها تركيبٌ ويُصرَف بها مال. فمن يحذفها يجب أن يُعرَف،
   ومن يراها يجب أن يُسجَّل — لا مراقبةً للناس بل لأن الوزارةَ تسأل «من اطّلع
   على هذا؟» ولا يصلح جوابًا «لا نعلم». */

/* المشاهدةُ تُسجَّل مرةً لكلِّ صورةٍ لكلِّ مستخدمٍ في اليوم: لو سُجّلت كلَّ
   فتحةٍ لأغرقت الحصةَ في يوم، ولو لم تُسجَّل لضاع الأثر. */
var SEEN_TODAY = {};
function photoSeen(id){
  var day = dayKey();
  var k = day + '|' + (STATE.meta.uid || STATE.meta.name || '?') + '|' + id;
  if (SEEN_TODAY[k]) return;
  SEEN_TODAY[k] = 1;
  logEvent('اطّلاع على صورة — ' + id, id);
}

/* الحذفُ للمهندس وحده، وأثرُه يبقى: الوثيقةُ تُوسَم محذوفةً ولا تُمحى،
   فيبقى مكتوبًا أن صورةً كانت هنا ومن أزالها ولماذا. وملفُّ درايف يُحذَف
   فعلًا — فالصورةُ الخاطئةُ لا تُترَك تُرى. */
function photoDelete(id, why){
  if (!may('delete')){ toast(t('الحذفُ للمهندس وحده')); return; }
  var p = (STATE.photos || {})[id];
  if (!p){ toast(t('لا صورةَ بهذا المعرّف')); return; }
  if (p.del){ toast(t('محذوفةٌ سلفًا')); return; }
  var done = function(){
    var rec = { site:p.site, kind:p.kind, at:p.at, by:p._by || '',
                del:{ by:STATE.meta.name || '', at:Date.now(), why:String(why || '').trim() } };
    STATE.photos[id] = rec;
    CORE.set('photos', id, rec);
    logEvent('حذف صورة — ' + id + (why ? ' · ' + why : ''), id);
    toast(t('حُذفت الصورة'));
    render(1);
  };
  if (!p.driveId){ done(); return; }
  drvAuth()
    .then(function(tok){
      return fetch('https://www.googleapis.com/drive/v3/files/' + p.driveId,
        { method:'DELETE', headers:{ Authorization:'Bearer ' + tok } });
    })
    .then(done)
    .catch(function(){
      /* تعذّر حذفُ الملف — يُوسَم السجلُّ ويُقال، ولا يُدَّعى ما لم يقع */
      logEvent('تعذّر حذفُ ملفِّ الصورة من درايف — ' + id, id);
      toast(t('عُلِّمت محذوفةً — وتعذّر حذفُ الملف من درايف'));
      done();
    });
}

/* صورُ موقعٍ بعينه — تُعرَض حيث يُقرَّر: في تفصيل النقطة وفي التدقيق */
function photosOf(siteId){
  var P = STATE.photos || {}, out = [];
  Object.keys(P).forEach(function(k){ if (P[k] && P[k].site === siteId) out.push([k, P[k]]); });
  return out.sort(function(a, b){ return (b[1].at || 0) - (a[1].at || 0); });
}

/* ═══ صورُ النقطة — أين هي الآن ═══
   «رفعت نقاطًا وصورًا — فين الصور؟». الصورةُ تمرُّ بثلاث محطات: طابورُ الجهاز
   (لم تُرفَع بعد)، ثم وثيقتُها في القاعدة بصورتها (ينقلها الخادمُ)، ثم الدرايفُ
   برابطٍ والصورةُ تُمحى من القاعدة. المعرضُ يعرض كلَّ صورةٍ حيث هي بشارتها —
   فيُرى أنها سُجّلت على الدرايف أو أين وقفت. */
/* ═══ الصورةُ تُفتَح وتُنزَّل داخل التطبيق ═══
   كان الرابطُ href="data:image/jpeg;base64,…" — ومتصفّحُ الآيفون يرفض الانتقالَ
   إلى عنوانِ data فيفتح صفحةً بيضاءَ عنوانُها «data:»، ولا يُنزِّل شيئًا مع
   السمة download. فصارت الصورةُ تُفتَح في عارضٍ داخل التطبيق، والتنزيلُ يمرُّ
   بـBlob: مشاركةً إلى «حفظ الصورة» على الجوّال إن أتيحت، وإلا رابطَ تنزيلٍ
   مؤقتًا. وما على الدرايف يُفتَح ويُنزَّل برابطه المعتاد. */
function photoFind(key){
  var p = (STATE.photos || {})[key];
  if (p) return { data:p.data, name:p.name || (key + '.jpg'), driveId:p.driveId, link:p.link };
  var m = /^q(\d+)$/.exec(key);
  if (m){ var q = PHOTO_Q[+m[1]]; if (q) return { data:q.data, name:(q.site + '-' + (q.seq || '') + '.jpg') }; }
  var mf = /^f(\d+)$/.exec(key);
  if (mf){ var qf = PHOTO_FAIL[+mf[1]]; if (qf) return { data:qf.data, name:(qf.site + '-' + (qf.seq || '') + '.jpg') }; }
  return null;
}
function photoDownload(key){
  var p = photoFind(key); if (!p){ toast(t('لا صورة')); return; }
  if (p.data){
    var b = dataToBlob(p.data);
    if (!b){ toast(t('تعذّر تجهيزُ الصورة')); return; }
    var file = null;
    try { file = new File([b], p.name, { type:b.type }); } catch (e){ LS_ERR = e; }
    if (file && navigator.canShare && navigator.canShare({ files:[file] })){
      navigator.share({ files:[file] }).catch(function(e){ if (!/abort/i.test(String(e && e.name))) dl(b, p.name); });
      return;
    }
    if (!dl(b, p.name)) toast(t('تعذّر التنزيل'));
    return;
  }
  if (p.driveId){ window.open('https://drive.google.com/uc?export=download&id=' + encodeURIComponent(p.driveId), '_blank', 'noopener'); return; }
  toast(t('لا صورة'));
}
var PHOTO_VIEW = '';
function photoView(key){
  var p = photoFind(key); if (!p) return;
  var src = p.data || (p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w1600' : '');
  if (!src) return;
  var old = document.getElementById('phView'); if (old) old.remove();
  var box = document.createElement('div'); box.id = 'phView';
  box.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:14px';
  box.innerHTML = '<img src="' + esc(src) + '" alt="" style="max-width:100%;max-height:78vh;border-radius:12px;object-fit:contain">'
    + '<div class="actions">'
    + '<button type="button" class="btn btn-primary btn-sm" data-phdl="' + esc(key) + '">\u2B07 ' + esc(t('تنزيل')) + '</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-phclose="1">' + esc(t('إغلاق')) + '</button></div>';
  document.body.appendChild(box);
  box.addEventListener('click', function(ev){ if (ev.target === box) box.remove(); });
}
/* ═══ سببُ تعثّرِ النقل يُقال بجملةٍ لا برسالةِ جوجل ═══
   كان نصُّ جوجل الطويلُ يُطبَع تحت كلِّ صورة — سطران إنجليزيّان ورابطُ وثائقٍ
   مقطوع، يتكرّران ثلاثين مرةً في صفحةٍ واحدة، فلا يُقرأ منهما شيءٌ ولا يُعرَف
   ما العمل. صار الخطأُ يُترجَم إلى جملةٍ واحدة، ويُرفَع سببُه إلى **لافتةٍ
   واحدةٍ** فوق المعرض فيها ما يُفعَل — لا تحت كلِّ صورة. */
var PH_ERR = [
  { re:/storage quota|shared drives|storageQuotaExceeded/i,
    s:'حسابُ الخدمة بلا سعةٍ على الدرايف',
    fix:'الحلُّ خطوةٌ واحدةٌ من مديرِ المشروع: يُنشَأ **درايفٌ مشترَك** (Shared drive) ويُضاف إليه حسابُ الخدمة بصلاحية «مدير محتوى»، ثم يوضَع معرِّفُه في GDRIVE_FOLDER. الصورُ محفوظةٌ الآن على الأجهزة وفي القاعدة ولن تضيع — تُرفَع كلُّها تلقائيًّا بعد الضبط.' },
  { re:/permission|insufficient|403/i, s:'لا إذنَ لحساب الخدمة على المجلد',
    fix:'يُشارَك مجلدُ الدرايف مع حساب الخدمة بصلاحية «محرِّر» — أو يُنقَل إلى درايفٍ مشترَك.' },
  { re:/not found|404/i, s:'مجلدُ الدرايف غيرُ موجود',
    fix:'يُراجَع معرِّفُ المجلد في GDRIVE_FOLDER — لعلّه حُذف أو نُسخ ناقصًا.' },
  { re:/quota|rate|429|503/i, s:'حصةُ الدرايف امتلأت مؤقتًا',
    fix:'يُعاد الرفعُ تلقائيًّا في الدورة التالية — لا فعلَ مطلوب.' }
];
function phErr(why){
  var w = String(why || '');
  for (var i = 0; i < PH_ERR.length; i++) if (PH_ERR[i].re.test(w)) return PH_ERR[i];
  return { s:w.slice(0, 60) || 'تعذّر النقل', fix:'' };
}
function photoGalleryHtml(siteId){
  var L = photosOf(siteId), Q = PHOTO_Q.filter(function(q){ return q.site === siteId; }), Fq = PHOTO_FAIL.filter(function(q){ return q.site === siteId; });
  if (!L.length && !Q.length && !Fq.length) return '<p class="hint" style="margin:8px 0 0">' + esc(t('لا صورَ لهذه النقطة على هذا الجهاز ولا في القاعدة.')) + '</p>';
  /* رابطُ العرض على الدرايف يطلب إذنًا ممن لم يُشارَك معه — والتنزيلُ المباشرُ
     (uc?export=download) يعمل لكلِّ من عنده الرابطُ متى شورك الملفُ برابط. وما زال
     في القاعدة يُنزَّل من صورته مباشرةً. */
  var tile = function(img, badge, kind, foot, key){
    return '<div class="field" style="margin:0">'
      + (img ? '<img src="' + esc(img.src) + '" alt="" data-phview="' + esc(key || '') + '" style="width:100%;border-radius:10px;display:block;max-height:260px;object-fit:cover;cursor:zoom-in" loading="lazy">' : '')
      + '<div style="margin-top:6px">' + badge + ' <span class="hint" style="margin:0">' + esc(t(kind || '')) + '</span></div>'
      + (key ? btn('\u2B07 ' + t('تنزيل'),'btn-primary btn-sm',' data-phdl="' + esc(key) + '" style="margin-top:6px"') + ' ' : '')
      + (foot || '') + '</div>';
  };
  var fixes = {};
  var html = '';
  /* لكلِّ نقطةٍ مجلدُها على الدرايف (V16.78) — يفتحه صاحبُ الدرايف ومن شاركه معه؛
     الرابطُ يُعرَض لمن رتبتُه مديرُ المشروع فما فوق فلا يُرسَل الفنيُّ إلى بابٍ مغلق */
  var fold = null; L.forEach(function(x){ if (!fold && x[1] && x[1].folderId) fold = x[1].folderId; });
  if (fold && rankOf(ROLE) >= rankOf('admin'))
    html += '<a class="btn btn-secondary btn-sm" style="margin-top:8px" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/' + esc(fold) + '">\uD83D\uDCC1 ' + esc(t('مجلد النقطة على الدرايف')) + '</a>';
  html += '<div class="grid cols-2" style="margin-top:8px">';
  L.forEach(function(x){
    var id = x[0], p = x[1];
    if (p.del){ html += tile(null, pill('حُذفت', 'off'), p.kind, '<p class="hint" style="margin:4px 0 0">' + esc(p.del.by || '') + (p.del.why ? ' · ' + esc(p.del.why) : '') + '</p>'); return; }
    if (p.status === 'done' || p.link){
      var th = p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w600' : '';
      html += tile(th ? { src:th } : null, pill('على الدرايف ✓', 'ok'), p.kind,
        '<a class="btn btn-secondary btn-sm" style="margin-top:6px" target="_blank" rel="noopener" href="' + esc(p.link || '#') + '" data-pview="' + esc(id) + '">' + esc(t('افتح على الدرايف')) + '</a>', id);
    } else if (p.status === 'error'){
      var e1 = phErr(p.why); if (e1.fix) fixes[e1.s] = e1.fix;
      html += tile(p.data ? { src:p.data } : null, pill('خطأ في النقل', 'bad'), p.kind, '<p class="hint" style="margin:4px 0 0">' + esc(t(e1.s)) + '</p>', p.data ? id : '');
    } else {
      html += tile(p.data ? { src:p.data } : null, pill('في القاعدة — ينقلها الخادم إلى الدرايف', 'wrn'), p.kind, '', p.data ? id : '');
    }
  });
  Q.forEach(function(q, qi){ html += tile(q.data ? { src:q.data } : null, pill('في طابور هذا الجهاز — لم تُرفَع بعد', 'wrn'), q.kind, '', q.data ? ('q' + PHOTO_Q.indexOf(q)) : ''); });
  Fq.forEach(function(q){
    var e2 = phErr(q.why); if (e2.fix) fixes[e2.s] = e2.fix;
    html += tile(q.data ? { src:q.data } : null, pill('تعذّر رفعُها', 'bad'), q.kind, '<p class="hint" style="margin:4px 0 0">' + esc(t(e2.s)) + '</p>', q.data ? ('f' + PHOTO_FAIL.indexOf(q)) : '');
  });
  html += '</div>';
  /* لافتةٌ واحدةٌ فوق المعرض: السببُ وما يُفعَل — بدل تكرارِ نصِّ جوجل تحت كلِّ صورة */
  var ks = Object.keys(fixes);
  if (ks.length) html = ks.map(function(k){
    return '<div class="alert warn" style="margin:8px 0 0"><span><b>' + esc(t(k)) + '</b><br>'
      + esc(t(fixes[k])).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</span></div>';
  }).join('') + html;
  return html;
}
function photoCount(siteId){
  return photosOf(siteId).filter(function(x){ return !x[1].del; }).length + PHOTO_Q.filter(function(q){ return q.site === siteId; }).length;
}
function photoStrip(siteId){
  var L = photosOf(siteId);
  if (!L.length) return '';
  return card('صورُ الموقع',
    '<div class="grid cols-2">'
    + L.map(function(x){
        var id = x[0], p = x[1];
        if (p.del){
          return '<div class="field"><label>' + esc(t(p.kind || '')) + '</label>'
            + '<p class="hint">' + esc(t('حُذفت')) + ' — ' + esc(p.del.by || '')
            + (p.del.why ? ' · ' + esc(p.del.why) : '') + '</p></div>';
        }
        return '<div class="field"><label>' + esc(t(p.kind || '')) + '</label>'
          + '<a class="btn btn-secondary" style="width:100%" target="_blank" rel="noopener"'
          + ' href="' + esc(p.link || '#') + '" data-pview="' + esc(id) + '">'
          + esc(t('افتح الصورة')) + '</a>'
          + '<p class="hint">' + esc(t('رفعها')) + ': ' + esc(p._by || p.by || '—') + '</p>'
          + (may('delete')
              ? btn('احذف','btn-quiet btn-sm',' data-pdel="' + esc(id) + '"') : '')
          + '</div>';
      }).join('')
    + '</div>'
    + '<p class="hint">' + esc(t('كلُّ رفعٍ واطّلاعٍ وحذفٍ مسجَّلٌ في سجل الأحداث باسم فاعله.')) + '</p>');
}


function drvSave(){
  var c = (document.getElementById('drvClient') || {}).value || '';
  var f = (document.getElementById('drvFolder') || {}).value || '';
  try{
    lsSet('nsk14.drv.client', c.trim());
    lsSet('nsk14.drv.folder', f.trim());
  }catch(e){ LS_ERR = e; }
  DRV.clientId = c.trim(); DRV.folderId = f.trim();
  logEvent('وصل درايف — ' + (c ? 'مُعرَّف' : 'أُفرغ'));
  toast(c ? t('حُفظ — جرّب الإذن') : t('أُفرغ الوصل'));
  render(1);
}

function drvTest(){
  if (!drvCfg()){ toast(t('أدخل Client ID أولًا')); return; }
  toast(t('يُطلَب الإذن…'));
  drvAuth().then(function(){
    toast(t('الإذن ممنوح — الصورُ سترفَع'));
    photoFlush();
    render(1);
  }).catch(function(e){
    toast(t('تعذّر الإذن') + ' · ' + String(e.message || e));
  });
}

/* ═══ حوكمةُ المشروع بمعايير PMI ═══
   أربعةٌ يسأل عنها المدقّق ولم تكن: خطُّ أساسٍ يُقاس عليه، وقيمةٌ مكتسبةٌ
   تقول أين نحن، وسجلُّ مخاطرَ بالاحتمال والأثر، وضبطُ تغييرٍ يمنع الانزلاق. */

/* ── خط الأساس: يُجمَّد فيصير مرجعًا لا يُعدَّل إلا بطلب تغيير ── */
var BASE = null;

function baseSet(){
  /* تجميدُ خطِّ أساسٍ ميزانيتُه صفرٌ يُسكِت القيمةَ المكتسبةَ إلى الأبد ولا
     يشكو — ومن جمّده يظنُّ أنه خطّط. يُقال له ما ينقص قبل التجميد. */
  if (!cfgGet('ph')){
    toast(t('اضبط سعرَ النقطة أوّلًا — وإلا كان خطُّ الأساس بميزانيةٍ صفر'));
    return null;
  }
  var S = siteStats();
  BASE = {
    at: Date.now(),
    by: STATE.meta.name || '',
    scope: S.total,
    byKey: JSON.parse(JSON.stringify(S.byKey)),
    months: PLAN_MONTHS || cfgGet('phase') || 4,
    budget: cfgGet('budCap'),
    ph: cfgGet('ph'),
    targets: { survey:cfgGet('tgtSurvey'), ins:cfgGet('tgtInsCamp') + cfgGet('tgtInsCor'),
               prep:cfgGet('tgtPrepCamp') + cfgGet('tgtPrepCor'),
               asm:cfgGet('tgtAsmCamp') + cfgGet('tgtAsmCor'), dis:cfgGet('tgtDis') },
    ver: (BASE ? BASE.ver + 1 : 1)
  };
  /* الميزانيةُ الكلية للنطاق: نقاطُ المسح والتركيب في سعر النقطة */
  var pts = 0;
  STATE.sites.forEach(function(x){ pts += ptsSurvey(x) + ptsInstall(x); });
  BASE.bac = Math.round(pts * BASE.ph);          /* Budget At Completion */
  BASE.totalPts = Math.round(pts);
  CORE.set('baseline', 'v' + BASE.ver, BASE);
  logEvent('تجميد خط الأساس — النسخة ' + nm(BASE.ver));
  return BASE;
}

function baseDays(){
  if (!BASE) return { elapsed:0, total:0, pct:0 };
  var total = (BASE.months || 4) * (cfgGet('days') || 26);
  var elapsed = Math.min(total, Math.max(0,
    Math.round((Date.now() - BASE.at) / 86400000)));
  return { elapsed:elapsed, total:total, pct: total ? elapsed / total : 0 };
}

/* ── القيمة المكتسبة — لغةُ المدقّق ── */
function evm(){
  if (!BASE) return null;
  var D = baseDays();
  var PV = Math.round(BASE.bac * D.pct);          /* المخطَّط حتى اليوم */

  var earned = 0, done = 0;
  STATE.sites.forEach(function(x){
    if (svDone(STATE.recs[x.id])){ earned += ptsSurvey(x); done++; }
    var r = STATE.inss[x.id];
    if (r && r.status === 'مُركّب' && r.approved) earned += ptsInstall(x);
  });
  var EV = Math.round(earned * BASE.ph);          /* المكتسَب فعلًا */

  var AC = 0;
  scores().list.forEach(function(e){ AC += e.money; });
  buysList().forEach(function(b){ if (b.st === 'معتمد') AC += (+b.amt || 0); });
  AC = Math.round(AC);                            /* المنصرف الفعلي */

  var SV = EV - PV, CV = EV - AC;
  var SPI = PV ? (EV / PV) : 0;
  var CPI = AC ? (EV / AC) : 0;
  var EAC = CPI ? Math.round(BASE.bac / CPI) : BASE.bac;
  var ETC = Math.max(0, EAC - AC);
  var VAC = BASE.bac - EAC;
  var TCPI = (BASE.bac - AC) ? ((BASE.bac - EV) / (BASE.bac - AC)) : 0;

  /* المؤشراتُ تُعرَض بمنزلتين والتقديراتُ تُحسَب بالدقة الكاملة — فمن أعاد
     الحسابَ من الرقم المعروض خالفَ التقدير. تُصدَّر الدقةُ الكاملةُ معها
     باسمٍ صريحٍ فيُعاد الحسابُ عليها ويتطابق التقرير. */
  return { PV:PV, EV:EV, AC:AC, SV:SV, CV:CV,
           SPI:Math.round(SPI * 100) / 100, CPI:Math.round(CPI * 100) / 100,
           SPIx:SPI, CPIx:CPI, TCPIx:TCPI,
           EAC:EAC, ETC:ETC, VAC:VAC, TCPI:Math.round(TCPI * 100) / 100,
           BAC:BASE.bac, days:D, doneSites:done };
}

function evmVerdict(v){
  if (!v) return { t:'—', c:'' };
  if (v.SPI >= 1 && v.CPI >= 1) return { t:'متقدّمٌ وضمن الكلفة', c:'ok' };
  if (v.SPI >= 0.95 && v.CPI >= 0.95) return { t:'ضمن الحدود المقبولة', c:'ok' };
  if (v.SPI < 0.9 && v.CPI < 0.9) return { t:'متأخّرٌ ومتجاوزٌ للكلفة', c:'bad' };
  if (v.SPI < 0.95) return { t:'متأخّرٌ عن الجدول', c:'wrn' };
  return { t:'متجاوزٌ للكلفة', c:'wrn' };
}

/* ═══ خطةُ الأسبوع — للمهندس وحدَه (V21.2) ═══
   «في التخطيط زوّد خطةَ الأسبوع، المهندسُ بس تبان له وهو اللي يحطّها: نقاط، وكلُّ
   نقطة فيها تفاصيل وملاحظات، وخطوات، واحتياجات، ونتائج مرجوّة». دفترُ المهندس
   الأسبوعيُّ: في settings/pmo (قراءةُ المهندس والمدير) تحت wplan، لكلِّ نقطةٍ أسبوعُها
   وعنوانُها وتفاصيلُها وخطواتُها (قائمةُ تحقّق) ومتطلباتُها ونتيجتُها المرجوّة وأولويتُها
   وحالتُها — ومنها مهمةٌ أسبوعيةٌ بضغطة، وما لم يُنجَز يُرحَّل للأسبوع القادم. */
var WPLAN_WK = '', WPLAN_EDIT = '';
var WPLAN_ST = ['مخطط', 'جارٍ', 'بانتظار تجارب', 'تم', 'مغلق'], WPLAN_PRI = ['عالية', 'متوسطة', 'منخفضة'], WPLAN_ACT = null, WPLAN_PREFILL = null;
/* (V21.3) تراها المهندسون ومن فوقهم (المدير والإدارة العليا)؛ ويكتبها المهندس والمدير */
function wplanSees(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin' || r === 'exec'; }
function wplanMay(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin'; }
function wplanFinal(x){ return x.st === 'تم' || x.st === 'مغلق'; }
function wplanOpenPast(){ var cur = mfuWeekKey(); return pmoList('wplan').filter(function(x){ return x.wk && x.wk < cur && !wplanFinal(x); }); }
function wplanUpdates(x){ return (Array.isArray(x.hist) ? x.hist : []).filter(function(h){ return h.f === 'upd' || h.f === 'result' || h.f === 'close'; }); }
function wplanWeek(){ return WPLAN_WK || mfuWeekKey(); }
/* (V21.4) الأسبوعُ التالي يُحسَب بالتاريخ: اثنينُ الأسبوع + سبعة أيام — كان العدُّ يقفز من
   الأسبوع ٥٢ إلى ١ فيُسقِط الأسبوعَ ٥٣ الذي تعرفه سنواتٌ منها ٢٠٢٦ */
function isoWeekMonday(k){ var m = /^(\d{4})-W(\d{2})$/.exec(k || ''); if (!m) return null; var j4 = new Date(Date.UTC(+m[1], 0, 4)), mon1 = j4.getTime() - ((j4.getUTCDay() + 6) % 7) * 864e5; return mon1 + (+m[2] - 1) * 7 * 864e5; }
function wplanNextWeek(k){ var mon = isoWeekMonday(k || mfuWeekKey()); return mfuWeekKey((mon == null ? Date.now() : mon) + 7 * 864e5 + 3 * 864e5); }
function wplanItems(wk){ return pmoList('wplan').filter(function(x){ return x.wk === wk; }).sort(function(a, b){ return WPLAN_PRI.indexOf(a.pri || 'متوسطة') - WPLAN_PRI.indexOf(b.pri || 'متوسطة') || (a.at || 0) - (b.at || 0); }); }
function wplanLines(v){ return String(v || '').split(/\n+/).map(function(l){ return l.trim(); }).filter(Boolean); }
function wplanBody(){
  if (!wplanSees()) return alertBox('warn', 'خطةُ الأسبوع للمهندسين ومن فوقهم.');
  pmoFetch();
  var can = wplanMay(), past = wplanOpenPast();
  var wk = wplanWeek(), L = wplanItems(wk), all = pmoList('wplan'), weeks = {}; all.forEach(function(x){ if (x.wk) weeks[x.wk] = 1; });
  var cur = mfuWeekKey(), nxt = wplanNextWeek(cur); weeks[cur] = 1; weeks[nxt] = 1;
  var ed = WPLAN_EDIT ? all.filter(function(x){ return x.id === WPLAN_EDIT; })[0] : (WPLAN_PREFILL || null);
  var done = L.filter(function(x){ return x.st === 'تم'; }).length, stepsAll = 0, stepsDone = 0;
  L.forEach(function(x){ var st = wplanLines(x.steps); stepsAll += st.length; stepsDone += (x.sdone || []).filter(Boolean).length; });
  var chips = Object.keys(weeks).sort().map(function(k){ return btn((k === cur ? t('هذا الأسبوع') + ' ' : k === nxt ? t('الأسبوع القادم') + ' ' : '') + k, 'chip' + (k === wk ? ' active' : ''), ' data-wpwk="' + esc(k) + '"'); }).join('');
  var f = function(id, v){ return esc(ed ? (ed[id] || '') : ''); };
  var form = !can ? '' : card(ed && ed.id ? 'تعديل النقطة' : 'نقطةٌ جديدة في خطة الأسبوع',
      '<div class="grid2"><label>' + esc(t('العنوان')) + '<input id="wpT" value="' + f('t') + '"></label><label>' + esc(t('الأولوية')) + '<select id="wpP">' + WPLAN_PRI.map(function(p){ return '<option value="' + esc(p) + '"' + ((ed ? ed.pri : 'متوسطة') === p ? ' selected' : '') + '>' + esc(t(p)) + '</option>'; }).join('') + '</select></label></div>'
      + '<label>' + esc(t('التفاصيل والملاحظات')) + '<textarea id="wpN" rows="2">' + f('n') + '</textarea></label>'
      + '<label>' + esc(t('الخطوات — خطوةٌ في كلِّ سطر')) + '<textarea id="wpS" rows="3">' + f('steps') + '</textarea></label>'
      + '<div class="grid2"><label>' + esc(t('الاحتياجات والمتطلبات')) + '<textarea id="wpR" rows="2">' + f('needs') + '</textarea></label><label>' + esc(t('النتيجة المرجوّة')) + '<textarea id="wpG" rows="2">' + f('goal') + '</textarea></label></div>'
      + '<div class="actions">' + btn(t(ed && ed.id ? 'احفظ التعديل' : 'أضف إلى الخطة'), 'btn-primary btn-sm', ' data-wpsave="' + esc(ed && ed.id ? ed.id : '') + '"') + (ed ? btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-wpcancel="1"') : '') + '</div>');
  var cardOf = function(x){
    var st = wplanLines(x.steps), sd = x.sdone || [], tk = mfuTaskState(x.task), fin = wplanFinal(x), act = WPLAN_ACT && WPLAN_ACT.id === x.id ? WPLAN_ACT.kind : '';
    var ups = wplanUpdates(x);
    return '<div class="card wp-item wp-' + (x.st === 'تم' ? 'done' : x.st === 'مغلق' ? 'closed' : x.st === 'جارٍ' ? 'run' : x.st === 'بانتظار تجارب' ? 'wait' : 'plan') + '">'
      + '<div class="wp-h"><b>' + esc(x.t || '') + '</b> ' + pill(t(x.pri || 'متوسطة'), x.pri === 'عالية' ? 'bad' : x.pri === 'منخفضة' ? '' : 'wrn') + (x.wk && x.wk !== wk ? ' <span class="hint" style="margin:0">' + esc(x.wk) + '</span>' : '')
      + (fin ? ' ' + pill(t(x.st), x.st === 'تم' ? 'ok' : '') : (can ? ' <select data-wpst="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + ['مخطط', 'جارٍ', 'بانتظار تجارب'].map(function(v){ return '<option value="' + esc(v) + '"' + ((x.st || 'مخطط') === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>' : ' ' + pill(t(x.st || 'مخطط'), 'wrn'))) + '</div>'
      + (x.n ? '<p style="margin:6px 0">' + esc(x.n) + '</p>' : '')
      + (st.length ? '<div class="wp-sec">' + esc(t('الخطوات')) + ' · ' + nm(sd.filter(Boolean).length) + '/' + nm(st.length) + '</div><ul class="wp-steps">' + st.map(function(l, i){ return '<li><label><input type="checkbox" data-wpstep="' + esc(x.id) + '|' + i + '"' + (sd[i] ? ' checked' : '') + '> <span' + (sd[i] ? ' style="text-decoration:line-through;opacity:.7"' : '') + '>' + esc(l) + '</span></label></li>'; }).join('') + '</ul>' : '')
      + (x.needs ? '<div class="wp-sec">' + esc(t('الاحتياجات والمتطلبات')) + '</div><p style="margin:2px 0 6px">' + esc(x.needs) + '</p>' : '')
      + (x.goal ? '<div class="wp-sec">' + esc(t('النتيجة المرجوّة')) + '</div><p style="margin:2px 0 6px">' + esc(x.goal) + '</p>' : '')
      + (x.result ? '<div class="wp-sec" style="color:#27AE60">\u2713 ' + esc(t('النتيجة الفعلية')) + '</div><p style="margin:2px 0 6px;color:#27AE60;font-weight:700">' + esc(x.result) + '</p>' : '')
      + (x.closeWhy ? '<div class="wp-sec" style="color:#7F8C8D">\u23F9 ' + esc(t('أُغلقت')) + '</div><p style="margin:2px 0 6px;color:#7F8C8D">' + esc(x.closeWhy) + '</p>' : '')
      + (ups.length ? '<div class="wp-sec">' + esc(t('التحديثات')) + ' · ' + nm(ups.length) + '</div><ul class="wp-steps">' + ups.slice(0, 6).map(function(h){ return '<li><span class="hint" style="margin:0">' + esc(fmtDate(h.at)) + ' \u00b7 ' + esc(dispName(h.by)) + '</span> — ' + esc(h.v) + '</li>'; }).join('') + '</ul>' : '')
      + (act && can ? '<div class="wp-act"><label>' + esc(t(act === 'result' ? 'النتيجة الفعلية — ما الذي تحقّق' : act === 'upd' ? 'التحديث — وماذا ننتظر بعده' : 'سببُ الإغلاق')) + '<textarea id="wpAct" rows="2"></textarea></label>'
          + (act === 'close' ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="wpActNew" checked> ' + esc(t('وأضف نقطةً جديدةً بدلها')) + '</label>' : '')
          + '<div class="actions">' + btn(t(act === 'result' ? 'سجّل النتيجة وأتمم' : act === 'upd' ? 'سجّل التحديث' : 'أغلق النقطة'), 'btn-primary btn-sm', ' data-wpact="' + esc(x.id) + '|' + act + '"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-wpact="' + esc(x.id) + '|cancel"') + '</div></div>' : '')
      + (can ? '<div class="actions" style="margin-top:6px">'
        + (!fin ? btn('\u2713 ' + t('أتممتها — سجّل النتيجة'), 'btn-primary btn-sm', ' data-wpdo="' + esc(x.id) + '|result"') + btn('\u270E ' + t('تحديث'), 'btn-secondary btn-sm', ' data-wpdo="' + esc(x.id) + '|upd"') + btn('\u23F9 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-wpdo="' + esc(x.id) + '|close"') : '')
        + (tk ? pill('#' + tk.id + ' \u00b7 ' + t(tk.st), tk.done ? 'ok' : 'wrn') : (!fin ? btn('\uFF0B ' + t('مهمة أسبوعية'), 'btn-quiet btn-sm', ' data-wptask="' + esc(x.id) + '"') : ''))
        + btn('\u270E ' + t('تعديل'), 'btn-quiet btn-sm', ' data-wpedit="' + esc(x.id) + '"')
        + (!fin ? btn('\u2192 ' + t('رحّل للأسبوع القادم'), 'btn-quiet btn-sm', ' data-wpnext="' + esc(x.id) + '"') : '')
        + btn('\u2715', 'btn-quiet btn-sm', ' data-wpdel="' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') + '</div>' : (tk ? '<div class="actions" style="margin-top:6px">' + pill('#' + tk.id + ' \u00b7 ' + t(tk.st), tk.done ? 'ok' : 'wrn') + '</div>' : ''))
      + '</div>';
  };
  var cards = L.map(cardOf).join('');
  var pastHtml = past.length ? '<div class="card" style="border-inline-start:5px solid #C0392B"><b style="color:#C0392B">\u26A0 ' + esc(t('من أسابيع سابقة بلا نتيجةٍ ولا إغلاق')) + ' \u00b7 ' + nm(past.length) + '</b><p class="hint" style="margin:4px 0 0">' + esc(t('كلُّ نقطةٍ تُتمّ بنتيجة، أو تُحدَّث وتنتظر تجاربَ أخرى، أو تُغلَق وتُضاف بدلها نقطة.')) + '</p></div>' + past.map(cardOf).join('') : '';
  var closed = L.filter(function(x){ return x.st === 'مغلق'; }).length, waiting = L.filter(function(x){ return x.st === 'بانتظار تجارب'; }).length;
  return '<div class="chips" style="margin:0 0 10px">' + chips + '</div>'
    + stats([['نقاطُ الخطة', N(L.length)], ['تمّت بنتيجة', N(done), done === L.length && L.length ? 'ok' : ''], ['بانتظار تجارب', N(waiting), waiting ? 'wrn' : ''], ['مغلقة', N(closed)], ['الخطواتُ المنجزة', nm(stepsDone) + ' / ' + nm(stepsAll)], ['أسابيعُ سابقةٌ بلا إغلاق', N(past.length), past.length ? 'bad' : 'ok']])
    + (wk === cur ? pastHtml : '')
    + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل — خطة الأسبوع'), 'btn-secondary btn-sm', ' data-xls="wplan"') + '</div>'
    + (cards || '<p class="hint">' + esc(t('لا نقاطَ في هذا الأسبوع بعد.')) + '</p>')
    + form
    + '<p class="hint">' + esc(t('كلُّ نقطةٍ في أسبوعها تنتهي إلى واحدةٍ من ثلاث: تُتمّ بنتيجةٍ مكتوبة، أو تُحدَّث وتنتظر تجاربَ أخرى، أو تُغلَق وتُضاف بدلها نقطةٌ جديدة. يكتبها المهندس، ويراها المهندسون ومن فوقهم.')) + '</p>';
}
PAGE.plan = { m:'التخطيط', t:'التخطيط والمخاطر',
  l:'المواعيدُ والمعالمُ وخطُّ الأساس — وما قد يسوء وما تغيّر وسلامةُ الخط.',
  body:function(){
    var head = tabHead('plan'), cur = tabCur('plan');
    if (cur === 'wplan') return head + wplanBody();   /* (V21.2) */
    if (cur === 'risks') return head + (function(){
    var RL = risksList();
    var open = RL.filter(function(r){ return r.st === 'مفتوح'; });
    var crit = open.filter(function(r){ return riskScore(r) >= 15; });
    var high = open.filter(function(r){ return riskScore(r) >= 9 && riskScore(r) < 15; });
    var sorted = RL.slice().sort(function(a,b){ return (a.st === 'مغلق') - (b.st === 'مغلق') || riskScore(b) - riskScore(a); });
    var sig = riskSignals();

    return stats([['مخاطر مفتوحة', N(open.length), open.length?'wrn':'ok'],
                  ['حرجة', N(crit.length), crit.length?'bad':'ok'],
                  ['عالية', N(high.length), high.length?'wrn':''],
                  ['مغلقة', N(RL.length - open.length), 'ok']])

      /* ما تقوله الأرقامُ الآن — لا ما كُتب في اجتماع */
      + card('\u{1F6A8} ' + t('مؤشرات خطرٍ حيّة — من البيانات نفسِها'),
          '<div class="list">' + sig.map(function(x){
            return '<div class="list-item"><div class="li-main"><div class="li-t">'
              + pill(x[0] === 'ok' ? 'سليم' : (x[0] === 'bad' ? 'حرج' : 'انتبه'), x[0] === 'ok' ? 'ok' : (x[0] === 'bad' ? 'off' : 'warn'))
              + ' ' + esc(x[1]) + '</div></div>'
              + (x[2] && seesPage(PARENT[x[2]] || x[2]) ? '<div class="li-end">' + btn('\u{1F4CD}','btn-quiet btn-sm',' data-p="' + esc(x[2]) + '"') + '</div>' : '')
              + '</div>';
          }).join('') + '</div>'
          + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحسَب كلَّ رسمةٍ من الجدول والكلفة والزيارات والبلاغات والمهام — الخطرُ يُرى قبل أن يُكتَب.')) + '</p>')

      + cardFlush(t('السجل') + ' — ' + nm(RL.length),
          table(['#','الخطر','الفئة','احتمال','أثر','الدرجة','الاستجابة','المالك','الحالة'],
            sorted.map(function(r){
              var sc = riskScore(r), L = riskLevel(sc), ed = may('settings');
              return ['<span class="num">' + esc(r.id) + '</span>',
                      '<strong>' + esc(t(r.t)) + '</strong><br>'
                        + '<span class="hint" style="margin:0">' + esc(t(r.plan || '')) + '</span>',
                      esc(t(r.cat)),
                      ed ? '<input type="number" min="1" max="5" value="' + esc(String(cfgN(r.p))) + '" data-rkp="' + esc(r.id) + '" style="width:58px">' : N(r.p),
                      ed ? '<input type="number" min="1" max="5" value="' + esc(String(cfgN(r.i))) + '" data-rki="' + esc(r.id) + '" style="width:58px">' : N(r.i),
                      '<span class="pill ' + L.c + '">' + nm(sc) + ' · ' + esc(t(L.t)) + '</span>',
                      esc(t(r.resp)),
                      ed ? '<input value="' + esc(r.own || '') + '" data-rko="' + esc(r.id) + '" dir="auto" style="width:110px">' : esc(t(r.own)),
                      (ed ? btn('🗑','btn-quiet btn-sm',' data-rkdel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')
                      + (ed ? '<select data-rkst="' + esc(r.id) + '"><option value="مفتوح"' + (r.st === 'مفتوح' ? ' selected' : '') + '>' + esc(t('مفتوح')) + '</option><option value="مغلق"' + (r.st === 'مغلق' ? ' selected' : '') + '>' + esc(t('مغلق')) + '</option></select>'
                         : pill(r.st, r.st === 'مغلق' ? 'ok' : 'warn'))];
            })),
          btn('⬇ إكسل — سجل المخاطر','btn-secondary btn-sm',' data-xls="risks"'))

      + (may('settings')
        ? card('إضافة خطر',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الخطر')) + ' <span class="req">*</span></label><input id="rkT" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الفئة')) + '</label><select id="rkC">'
            +   ['ميداني','فني','مشتريات','موارد','مالي','جهات خارجية','سلامة'].map(function(c){ return '<option value="' + esc(c) + '">' + esc(t(c)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('الاستجابة')) + '</label><select id="rkR">'
            +   ['تخفيف','تجنّب','نقل','قبول'].map(function(c){ return '<option value="' + esc(c) + '">' + esc(t(c)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('احتمال')) + ' (' + nm(1) + '–' + nm(5) + ')</label><input type="number" id="rkP" min="1" max="5" value="3"></div>'
            + '<div class="field"><label>' + esc(t('أثر')) + ' (' + nm(1) + '–' + nm(5) + ')</label><input type="number" id="rkI" min="1" max="5" value="3"></div>'
            + '<div class="field"><label>' + esc(t('المالك')) + '</label><input id="rkO" dir="auto"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('خطة الاستجابة')) + '</label><input id="rkPl" dir="auto"></div>'
            + '</div>',
            btn('➕ ' + t('سجِّل الخطر'),'btn-primary btn-sm',' data-rkadd="1"'))
        : '')

      + card('مصفوفة الاحتمال والأثر',
          (function(){
            var rows = [];
            for (var p = 5; p >= 1; p--){
              var cells = ['<b>' + nm(p) + '</b>'];
              for (var i = 1; i <= 5; i++){
                var sc = p * i, L = riskLevel(sc);
                var here = risksList().filter(function(r){ return r.p === p && r.i === i && r.st === 'مفتوح'; });
                cells.push('<span class="pill ' + L.c + '">' + nm(sc)
                  + (here.length ? ' · ' + here.map(function(r){ return r.id; }).join(' ') : '') + '</span>');
              }
              rows.push(cells);
            }
            return table(['احتمال ↓ / أثر →','١','٢','٣','٤','٥'], rows);
          })()
          + '<p class="hint">' + esc(t('الدرجةُ حاصلُ ضربهما: خمسةَ عشرَ فأكثرُ حرجٌ يُرفع للإدارة، وتسعةٌ فأكثرُ عالٍ يُتابَع أسبوعيًّا.')) + '</p>')

      + card('توزيع الاستجابات',
          table(['الاستجابة','عددها','ما تعنيه'], [
            ['تجنّب', N(risksList().filter(function(r){ return r.resp==='تجنّب'; }).length), 'يُغيَّر الخطُّ فلا يقع'],
            ['تخفيف', N(risksList().filter(function(r){ return r.resp==='تخفيف'; }).length), 'يُقلَّل احتمالُه أو أثرُه'],
            ['نقل',   N(risksList().filter(function(r){ return r.resp==='نقل'; }).length),   'يُحمَّل طرفًا آخر'],
            ['قبول',  N(risksList().filter(function(r){ return r.resp==='قبول'; }).length),  'يُحتمَل ويُرصَد له احتياطي']
          ]));
  })();
    if (cur === 'chg') return head + (function(){
    var pend = CHANGES.filter(function(c){ return c.st === 'مقدَّم'; });
    return stats([['طلبات قائمة', N(CHANGES.length)],
                  ['بانتظار القرار', N(pend.length), pend.length?'wrn':''],
                  ['معتمدة', N(CHANGES.filter(function(c){ return c.st==='معتمد'; }).length), 'ok'],
                  ['مرفوضة', N(CHANGES.filter(function(c){ return c.st==='مرفوض'; }).length)]])

      + card('طلب تغيير جديد',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نوع التغيير')) + '</label>'
          + '<select id="chgKind">'
          + ['نطاق','جدول','ميزانية','جودة','موارد'].map(function(k){
              return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الأثر على خط الأساس')) + '</label>'
          + '<select id="chgImp">'
          + ['لا أثر','أثرٌ محدود','أثرٌ جوهري'].map(function(k){
              return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>'
          /* المقاديرُ تُكتَب رقمًا لا وصفًا — فتُطبَّق على خط الأساس عند الاعتماد
             لا أن يُقال «اعتُمد — جمّد خطًّا جديدًا» ويُترَك التطبيقُ للذاكرة */
          + '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('أثرُه على الكلفة')) + ' (' + esc(t('ريال')) + ' ±)</label>'
          +   '<input type="number" id="chgCost" value="0" inputmode="numeric"></div>'
          + '<div class="field"><label>' + esc(t('أثرُه على الجدول')) + ' (' + esc(t('يوم')) + ' ±)</label>'
          +   '<input type="number" id="chgDays" value="0" inputmode="numeric"></div>'
          + '<div class="field"><label>' + esc(t('أثرُه على النطاق')) + ' (' + esc(t('نقطة')) + ' ±)</label>'
          +   '<input type="number" id="chgScope" value="0" inputmode="numeric"></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف والمبرّر')) + '</label>'
          + '<textarea id="chgWhy" rows="3" placeholder="'
          + esc(t('ما التغيير؟ ولماذا؟ وما بديلُه إن رُفض؟')) + '"></textarea></div>',
          btn('📋 قدّم الطلب','btn-primary',' data-chgadd="1"'))

      + (CHANGES.length
        ? cardFlush('الطلبات',
            table(['#','النوع','الأثر','المبرّر','مُقدِّمه','الحالة',''],
              CHANGES.map(function(c, i){
                var q = [];
                if (+c.dCost)  q.push(nm(c.dCost) + ' ' + t('ريال'));
                if (+c.dDays)  q.push(nm(c.dDays) + ' ' + t('يوم'));
                if (+c.dScope) q.push(nm(c.dScope) + ' ' + t('نقطة'));
                return ['<span class="num">CR-' + nm(i+1) + '</span>', esc(c.kind),
                        esc(t(c.imp)) + (q.length ? '<br><span class="num hint" style="margin:0">' + esc(q.join(' · ')) + '</span>' : '')
                        + (c.applied ? '<br>' + pill('طُبِّق على خط الأساس', 'ok') : ''),
                        '<span class="hint" style="margin:0">' + esc(c.why.slice(0,60)) + '</span>',
                        esc(c.by),
                        pill(c.st, c.st==='معتمد'?'ok':(c.st==='مرفوض'?'off':'warn')),
                        c.st === 'مقدَّم'
                          ? '<div class="actions">'
                            + btn('اعتمد','btn-quiet btn-sm',' data-chgok="' + i + '"')
                            + btn('ارفض','btn-quiet btn-sm',' data-chgno="' + i + '"') + '</div>'
                          : ''];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا طلبات — وخطُّ الأساس على حاله.')) + '</p>'))

      + card('قاعدة الضبط',
          flow(['طلب','تقييم الأثر','قرار','تحديث خط الأساس'], 0)
          + '<p class="hint">' + esc(t('كلُّ طلبٍ معتمدٍ يُلزم بتجميد نسخةٍ جديدةٍ من خط الأساس — وإلا قِيس الأداءُ على مرجعٍ باطل.')) + '</p>');
  })();
    if (cur === 'pipe') return head + (function(){
    var taskInstallSite = Object.create(null);
    Object.keys(STATE.tasks).forEach(function(tid){
      var tk = STATE.tasks[tid];
      if (tk.kind === 'install') taskInstallSite[tk.site] = true;
    });
    var ready = 0, noSurvey = 0;
    STATE.sites.forEach(function(x){
      var r = STATE.recs[x.id];
      var ins = STATE.inss[x.id];
      var installed = !!(ins && ins.status === 'مُركّب' && ins.approved);
      if (svDone(r) && !installed) ready++;
      if (taskInstallSite[x.id] && !svDone(r)) noSurvey++;
    });
    var noAppr = Object.keys(STATE.inss).filter(function(id){
      var r = STATE.inss[id]; return r.status === 'مُركّب' && !r.approved;
    }).length;
    var conflicts = noSurvey + noAppr;

    return stats([['جاهز للجدولة', N(ready), 'ok'],
                  ['جُدول بلا مسح', N(noSurvey), noSurvey ? 'bad' : 'ok'],
                  ['رُكّب بلا اعتماد', N(noAppr), noAppr ? 'wrn' : 'ok'],
                  ['تعارضات', N(conflicts), conflicts ? 'bad' : 'ok']])
      + card('التسلسل السليم', flow(['مسح','اعتماد','جدولة','تركيب','تدقيق'], 0)
        + (conflicts
            ? alertBox('error', 'فيه ' + nm(conflicts) + ' ' + t('نقطةً خرجت عن التسلسل — راجع «التدقيق الهندسي» و«توزيع الفرق».'))
            : alertBox('success','لا تعارضاتٍ الآن — كلُّ نقطةٍ في مكانها من التسلسل.')));
  })();
    if (cur === 'setup') return head + (function(){
    /* كانت تاريخين مكتوبَين بيدٍ لا يُحفَظان، وزرُّ «حفظ» يقول «محفوظٌ
       بالفعل» وهو لم يحفظ شيئًا — فبقيت «الوتيرة والهدف» تقول «لم تُضبط
       المواعيد» للأبد. صار الموعدان يُقرآن ويُكتبان في CFG كسائر الإعدادات،
       وأزمنةُ التركيب تُضبط بالدقائق ويُحسَب الإجماليُّ من عدد النقاط الفعلي. */
    var S = siteStats(), nCamp = 0, nCor = 0;
    STATE.sites.forEach(function(x){ if (siteZone(x) === 'camp') nCamp++; else nCor++; });
    var mC = cfgGet('minCamp'), mR = cfgGet('minCor');
    var hrs = function(n, m){ return nm(Math.round(n * m / 60)); };
    /* ═══ صفٌّ لكلِّ نوعٍ في السجل (V17.14) ═══
       كان الجدولُ صفَّين: «مخيم» و«ممر» — والممرُّ يبتلع الكاميراتِ والمحطاتِ
       والبواباتِ والجسور، فتُحسَب أزمنةُ محطة القطار بزمن ممرٍّ. صار لكلِّ
       نوعٍ في السجل صفُّه: المخيمُ والممرُّ بمفتاحيهما القديمين، وسائرُ الأنواع
       بزمنٍ يُضبَط لكلٍّ منها ويرث زمنَ الممرِّ حتى يُضبَط. */
    var byType = {};
    STATE.sites.forEach(function(x){ var k = x.type || '—'; byType[k] = (byType[k] || 0) + 1; });
    var TYPES = Object.keys(byType).sort(function(a, b){ return byType[b] - byType[a]; });
    var minOf = function(k){
      if (k === 'مخيم') return +mC || 0;
      if (k === 'ممر') return +mR || 0;
      var v = cfgGet('minType', k); return (+v || +mR || 0);
    };
    var typeInput = function(k){
      if (k === 'مخيم') return cfgInput('minCamp');
      if (k === 'ممر') return cfgInput('minCor');
      return '<input type="number" inputmode="numeric" step="1" min="0" value="' + esc(minOf(k)) + '" data-mintype="' + esc(k) + '" style="width:90px">';
    };
    var totMin = TYPES.reduce(function(a, k){ return a + byType[k] * minOf(k); }, 0);
    return card('المواعيد المستهدفة',
      '<div class="grid cols-2">'
      + '<div class="field"><label>'+esc(t('موعد انتهاء المسح'))+'</label>' + cfgDate('dueSurvey') + '</div>'
      + '<div class="field"><label>'+esc(t('موعد انتهاء التركيب'))+'</label>' + cfgDate('dueInstall') + '</div>'
      + '</div>'
      + '<p class="hint">' + esc(t('يُحفَظ فورَ التغيير — وتقرؤه «نظرة عامة ← الوتيرة والهدف» لتقول كم يلزم يوميًّا.')) + '</p>',
      btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
    + card('أزمنة التركيب', table(['النوع','الزمن التقديري (دقيقة)','عدد النقاط','الإجمالي (ساعة)'],
        TYPES.map(function(k){ return [esc(t(k)), typeInput(k), N(byType[k]), '<span class="num">' + hrs(byType[k], minOf(k)) + '</span>']; }),
        ['الإجمالي', '', N(S.total), '<span class="num">' + nm(Math.round(totMin / 60)) + '</span>'])
      + '<p class="hint" style="margin:6px 0 0">' + esc(t('كلُّ نوعٍ بزمنه — وما لم يُضبَط يرث زمنَ الممرِّ حتى يُضبَط.')) + '</p>');
  })();
    if (cur === 'miles') return head + (function(){
    var tot = mileList().reduce(function(a,m){ return a + m.w; }, 0);
    var earned = mileList().reduce(function(a,m){ return a + m.w * mileDone(m); }, 0);
    var doneN = mileList().filter(function(m){ return mileDone(m) >= 0.999; }).length;
    var lateN = mileList().filter(mileLate).length;

    return stats([['المعالم', N(mileList().length)],
                  ['بلغت', N(doneN), doneN ? 'ok' : ''],
                  ['متأخّرة عن موعدها', N(lateN), lateN ? 'bad' : 'ok'],
                  ['الإنجاز الموزون', nm(Math.round(earned)) + '٪', 'acc'],
                  ['المتبقّي', nm(Math.round(tot - earned)) + '٪']])

      + card('', meter('الإنجاز الموزون بالمعالم', earned, tot))

      + cardFlush('المعالم',
          /* الوزنُ والتبعيةُ تخطيطٌ داخليّ: يراهما من يضبط الخطة وحدَه.
             سبعةُ أعمدةٍ على هاتف الوزارة تُقرأ بالتمرير الأفقيّ ولا تُقرأ. */
          (function(){
            var full = may('settings');
            var head = full ? ['#','المعلَم','الوزن ٪','يعتمد على','الموعد المستهدف','الإنجاز','الحالة']
                            : ['المعلَم','الموعد المستهدف','الإنجاز','الحالة'];
            var rows = mileList().map(function(m){
              var p = mileDone(m), dt = mileDateOf(m), late = mileLate(m);
              var manual = mileDates().some(function(x){ return x.id === m.id && x.d; });
              var nameCell = '<strong>' + esc(t(m.n)) + '</strong>'
                + (full ? '' : '<br><span class="hint num" style="margin:0">' + esc(m.id) + '</span>');
              var dateCell = full
                ? '<input type="date" value="' + esc(dt) + '" data-mld="' + esc(m.id) + '" style="width:150px">'
                  + (dt && !manual ? '<div class="hint" style="margin:2px 0 0">' + esc(t('مشتقٌّ من المواعيد')) + '</div>' : '')
                : (dt ? '<span class="num">' + esc(dt) + '</span>' : '—');
              var stCell = late ? pill('متأخّر', 'off')
                : pill(p >= 0.999 ? 'بلغ' : (p > 0 ? 'جارٍ' : 'لم يبدأ'),
                       p >= 0.999 ? 'ok' : (p > 0 ? 'warn' : ''));
              var pc = nm(Math.round(p * 100)) + '٪';
              if (full && MILE_EDIT === m.id){
                var o = mileOv(m.id);
                nameCell = '<input value="' + esc(m.n) + '" data-mle="n" dir="auto" style="min-width:180px">';
                return ['<span class="num">' + esc(m.id) + '</span>', nameCell,
                        '<input type="number" min="0" max="100" value="' + esc(m.w) + '" data-mle="w" style="width:70px">',
                        '<input value="' + esc(m.dep || '') + '" data-mle="dep" placeholder="M1" style="width:80px">',
                        dateCell,
                        '<input type="number" min="0" max="100" value="' + esc(o.prog != null ? o.prog : Math.round(p * 100)) + '" data-mle="prog" style="width:70px">',
                        btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-mlsave="' + esc(m.id) + '"') + ' '
                        + btn(t('إلغاء'),'btn-quiet btn-sm',' data-mlcancel="1"')];
              }
              return full
                ? ['<span class="num">' + esc(m.id) + '</span>', nameCell, N(m.w),
                   m.dep ? '<span class="num">' + esc(m.dep) + '</span>' : '—', dateCell, pc,
                   stCell + ' ' + btn('\u270E','btn-quiet btn-sm',' data-mledit="' + esc(m.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                   + btn('\u{1F5D1}','btn-quiet btn-sm',' data-mldel="' + esc(m.id) + '" aria-label="' + esc(t('حذف')) + '"')]
                : [nameCell, dateCell, pc, stCell];
            });
            var foot = full ? ['','<b>' + t('الإجمالي') + '</b>', N(tot), '', '', '<b>' + nm(Math.round(earned)) + '٪</b>', '']
                            : ['<b>' + t('الإجمالي') + '</b>', '', '<b>' + nm(Math.round(earned)) + '٪</b>', ''];
            return table(head, rows, foot);
          })(),
          btn('⬇ إكسل — المعالم','btn-secondary btn-sm',' data-xls="miles"')
          + (may('settings') ? ' ' + btn('\u2795 ' + t('معلَم جديد'),'btn-primary btn-sm',' data-mlnew="1"') : ''))
      + (may('settings') && MILE_NEW
          ? card(t('معلَم جديد'),
              '<div class="grid cols-2">'
              + '<div class="field"><label>' + esc(t('المعلَم')) + '</label><input id="mlnN" dir="auto"></div>'
              + '<div class="field"><label>' + esc(t('الوزن ٪')) + '</label><input id="mlnW" type="number" min="0" max="100" value="5"></div>'
              + '<div class="field"><label>' + esc(t('الموعد المستهدف')) + '</label><input id="mlnD" type="date"></div>'
              + '<div class="field"><label>' + esc(t('يعتمد على')) + '</label><input id="mlnDep" placeholder="M6"></div>'
              + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-mlnsave="1"') + btn(t('إلغاء'),'btn-quiet btn-sm',' data-mlncancel="1"') + '</div>'
              + '<p class="hint" style="margin:8px 0 0">' + esc(t('إنجازُ المعلَم الجديد يُكتب باليد (٪) من زرِّ التعديل — والمعالمُ المضمَّنةُ تُحسَب من الميدان ما لم يُكتب لها إنجازٌ يدويّ.')) + '</p>')
          : '')

      + card('المسار المتتابع',
          flow(mileList().map(function(m){ return m.id; }),
               Math.max(0, doneN - 1))
          + '<p class="hint">' + esc(t('كلُّ معلَمٍ يعتمد على سابقه — فتأخّرُ واحدٍ يزيح ما بعده. والأوزانُ مجموعُها مئة.')) + '</p>');
  })();
    return head + (function(){
    if (!BASE){
      return alertBox('warn','لم يُجمَّد خطُّ أساسٍ بعد — ولا تُقاس القيمةُ المكتسبةُ بلا مرجعٍ يُقاس عليه.')
        + card('تجميد خط الأساس',
            '<p class="hint" style="margin:0 0 12px">'
            + esc(t('يُثبِّت النطاقَ والميزانيةَ والتارجتات في لحظةٍ واحدة، فيصير مرجعًا لا يتغيّر إلا بطلب تغييرٍ معتمد. وعليه تُحسب SPI و CPI.'))
            + '</p>'
            + table(['ما سيُجمَّد','القيمة الآن'], [
                ['النطاق', N(siteStats().total) + ' ' + t('نقطة')],
                ['المدّة', N(PLAN_MONTHS || 4) + ' ' + t('شهر')],
                ['الميزانية', cfgGet('budCap') ? N(cfgGet('budCap')) : '—'],
                ['سعر النقطة', cfgGet('ph') ? N(cfgGet('ph')) : '—'],
                ['تارجت المسح', N(cfgGet('tgtSurvey'))]
              ]),
            may('settings') ? btn('🔒 جمّد خط الأساس','btn-primary',' data-baseset="1"') : '');
    }

    var v = evm(), V = evmVerdict(v);
    var d = new Date(BASE.at);

    return stats([['SPI — أداء الجدول', nm(v.SPI), v.SPI>=0.95?'ok':(v.SPI<0.9?'bad':'wrn')],
                  ['CPI — أداء الكلفة', nm(v.CPI), v.CPI>=0.95?'ok':(v.CPI<0.9?'bad':'wrn')],
                  ['نسبة الإنجاز', nm(v.BAC ? Math.round(v.EV/v.BAC*100) : 0) + '٪', 'acc'],
                  ['الحكم', t(V.t), V.c]])

      /* من قرأ CPI مقرَّبًا ثم قسم عليه الميزانيةَ خالف EAC المعروض — فيُقال صراحةً */
      + '<p class="hint" style="margin:-6px 0 14px">'
      + esc(t('المؤشراتُ معروضةٌ بمنزلتين، والتقديراتُ (EAC وETC وVAC) محسوبةٌ بالدقة الكاملة — فقد يختلف حسابُك اليدويُّ عنها بريالات.'))
      + '</p>'
      + card('خط الأساس — النسخة ' + nm(BASE.ver),
          table(['البند','خط الأساس','الآن','الفرق'], [
            ['النطاق', N(BASE.scope), N(siteStats().total),
             N(siteStats().total - BASE.scope)],
            ['الميزانية BAC', N(BASE.bac), N(v.EAC),
             '<span class="' + (v.VAC < 0 ? 'req' : '') + '">' + nm(v.VAC) + '</span>'],
            ['سعر النقطة', N(BASE.ph), N(cfgGet('ph')), N(cfgGet('ph') - BASE.ph)],
            ['المدّة (يوم)', N(v.days.total), N(v.days.elapsed),
             N(v.days.total - v.days.elapsed)]
          ]),
          '<span class="hint" style="margin:0">' + esc(t('جُمّد'))
          + ' <span class="num">' + fmtDate(d) + '</span> — ' + esc(BASE.by) + '</span>')

      + cardFlush('القيمة المكتسبة',
          table(['المؤشّر','الرمز','القيمة','ما يعنيه'], [
            ['المخطَّط حتى اليوم','PV', N(v.PV), 'ما كان ينبغي إنجازُه بحسب الجدول'],
            ['المكتسَب فعلًا','EV', N(v.EV), 'قيمةُ ما أُنجز واعتُمد'],
            ['المنصرف الفعلي','AC', N(v.AC), 'ما دُفع: مستحقُّ الفنيين والمشتريات'],
            ['فرق الجدول','SV', '<span class="' + (v.SV<0?'req':'') + '">' + nm(v.SV) + '</span>',
             v.SV >= 0 ? 'متقدّمٌ على الجدول' : 'متأخّرٌ عنه'],
            ['فرق الكلفة','CV', '<span class="' + (v.CV<0?'req':'') + '">' + nm(v.CV) + '</span>',
             v.CV >= 0 ? 'دون الميزانية' : 'فوقها'],
            ['المتوقَّع عند الإتمام','EAC', N(v.EAC), 'كلفةُ المشروع كاملًا بهذه الوتيرة'],
            ['المتبقّي','ETC', N(v.ETC), 'ما سيُنفَق حتى الإتمام'],
            ['فرق الإتمام','VAC', '<span class="' + (v.VAC<0?'req':'') + '">' + nm(v.VAC) + '</span>',
             v.VAC >= 0 ? 'سيوفَّر' : 'سيُتجاوَز'],
            ['كفاءة ما بقي','TCPI', nm(v.TCPI),
             v.TCPI > 1.1 ? 'يلزم أداءٌ أعلى مما مضى' : 'الوتيرةُ الحالية تكفي']
          ]),
          btn('⬇ إكسل — القيمة المكتسبة','btn-secondary btn-sm',' data-xls="evm"'))

      + card('التقدّم',
          meter('المكتسَب من الميزانية الكلية', v.EV, v.BAC)
          + meter('المنصرف من الميزانية الكلية', v.AC, v.BAC)
          + meter('الزمن المنقضي من المدّة', v.days.elapsed, v.days.total))

      + card('', '<div class="actions">'
          + btn('🔒 جمّد نسخةً جديدة','btn-secondary',' data-baseset="1"')
          + btn('📋 طلب تغيير','btn-primary',' data-p="chg"')
          + '</div>'
          + '<p class="hint">' + esc(t('لا يُعدَّل خطُّ الأساس إلا بطلب تغييرٍ معتمد — وكلُّ تجميدٍ يُحفَظ بنسخته وتاريخه ومن جمّده.')) + '</p>');
  })();
  }};

/* ── سجل المخاطر: احتمال × أثر ── */



/* ═══ وثيقةُ حسابي: تُقرأ، وإن غابت تُنشأ ═══
   القاعدةُ تعرف الحسابَ من وثيقةٍ باسم معرِّفه — ومن لا وثيقةَ له يُرفَض كلُّ
   ما يكتب بـ«Missing or insufficient permissions»، ويظهر له دورُه صحيحًا في
   التطبيق لأنه محفوظٌ في جلسته، فيرى شاشاتِ المهندس ولا يصل عملُه. صار
   التطبيقُ يقرأ وثيقتَه عند الدخول ويضعها في مكانها، فإن غابت أنشأها فنيًّا
   (أدنى الأدوار — والقاعدةُ لا تسمح بأكثر) فيخرج من الحصار ويُرفَع عملُه،
   ثم يرقّيه المكتبُ إلى دوره الحقيقي. */
/* ═══ المعرِّفُ يُقرأ من المصادقة لا من الجلسة وحدَها ═══
   `STATE.meta.uid` يُملأ في مسار الدخول — ومن دخل ثم أُعيد تحميلُ الصفحة،
   أو دخل من مسارٍ آخر، بقي فارغًا والمصادقةُ عارفةٌ به. فيقول زرُّ الإصلاح
   «سجّل الدخول أوّلًا» لمن هو داخلٌ فعلًا، ويُرفَض كلُّ ما يكتب بلا مخرج:
   الوثيقةُ لا تُقرأ لأنه «غير مسجَّل»، ولا تُنشَأ لأن الزرَّ يرفض. */
function myUid(){
  if (STATE.meta.uid) return STATE.meta.uid;
  try {
    var u = FB.auth && FB.auth.currentUser;
    if (u && u.uid){ STATE.meta.uid = u.uid; return u.uid; }
  } catch (e){
    /* المصادقةُ إن لم تُهيَّأ بعدُ فليست عطلًا — لكنها تُسجَّل كي لا يُبتلَع
       سببُ بقاء المعرِّف فارغًا صامتًا. */
    if (typeof softErr === 'function') softErr('قراءة المعرِّف', e, '');
  }
  return '';
}
/* ═══ الحسابُ الذي ينتظر التفعيل (V17.93) ═══
   من سجّل نفسَه — أو عُطِّل — يعمل على جهازه ولا تقبل القاعدةُ رفعَه؛ فما
   يرفعه يُعزَل برفض صلاحيةٍ لا يُسقَط. تُقال الحالُ في لافتةٍ ثابتة، ويُتحقَّق
   في كلِّ نبضةٍ هل فعّله المكتب — فإن فُعِّل عاد المعزولُ إلى الطابور وحدَه. */
function meInactive(){
  var u = STATE.users && STATE.users[myUid()];
  return !!(u && u.active === false);
}
function meActivatedCheck(){
  if (!meInactive() || !STATE.meta.online) return Promise.resolve(false);
  return myDocFetch(true).then(function(has){
    if (!has || meInactive()) return false;
    var back = permRelease(true);
    logEvent('فُعِّل الحساب — ' + (back ? nm(back) + ' وثيقةً عادت للرفع' : 'لا معزول'));
    toast(t('فُعِّل حسابك — يُرفَع عملُك الآن'));
    render(1); return true;
  });
}
var MYDOC = { at:0, has:null, err:'' };
var PZ_ARM = 0;   /* ضغطةُ «أسقط الكل» الأولى — تُؤكَّد بثانية */
/* ═══ إصلاحُ السبب يُطلِق ما حُبس بسببه ═══
   الوثائقُ التي عُزلت لأن القاعدةَ رفضتها كانت تبقى معزولةً بعد زوال السبب:
   يُصلَح الحسابُ فلا يعود شيءٌ إلى الطابور، وينتظر صاحبُه أن يضغط ↻ على كلِّ
   واحدةٍ ولا يدري أن عليه ذلك. صار إصلاحُ الوثيقة يُعيد كلَّ ما عُزل برفضِ
   صلاحيةٍ إلى الطابور، ويُصفَّر تكتّمُ الرسائل، ويُدفَع الطابورُ فورًا. */
/* `now=false` حين يتولّى المنادي الدفعَ بنفسه: كانت هذه تجدول دفعةً بعد
   جزءٍ من الثانية، فتسبق دفعةَ المنادي أو تُعطِّلها بالقفل — فيقول الزرُّ
   «رُفع ٠» ثم يُرفَع فعلًا بعد لحظة، فيُقرأ الرقمُ كذبًا. */
function permRelease(now){
  var PZ = STATE.poison || [], back = 0;
  STATE.poison = PZ.filter(function(x){
    if (!/permission|insufficient|PERMISSION_DENIED/i.test(String(x.err || ''))) return true;
    CORE.dirty(x.kind, x.id, x.v); back++;
    return false;
  });
  /* التكتّمُ يُصفَّر: كان يُقال مرةً واحدةً في العمر، فلا يُقال بعد الإصلاح
     إن فشل شيءٌ آخر — ولا يُقال إنه نجح. */
  SOFT_SAID = {};
  if (back) logEvent('عادت للرفع بعد إصلاح الصلاحية — ' + nm(back) + ' وثيقة');
  CORE.saveLocal();
  if (now !== false && STATE.meta.online)
    setTimeout(function(){ CORE._busy = false; CORE.flush(); }, 200);
  return back;
}
function myDocFetch(force){
  if (!myUid()) return Promise.resolve(null);
  /* بلا شبكةٍ تبقى الحالةُ «تُقرأ…» إلى الأبد — فيُظنُّ أن القراءةَ معلّقةٌ
     وهي لم تبدأ. تُهيَّأ الوصلةُ إن أمكن، وإلا قيلت الحالُ كما هي. */
  if (!FB.ready || !FB.db){
    if (!STATE.meta.online){ MYDOC.err = 'offline'; return Promise.resolve(null); }
    return FB.init().then(function(ok){ return ok ? myDocFetch(true) : null; }).catch(function(){ return null; });
  }
  if (!force && Date.now() - MYDOC.at < 60000) return Promise.resolve(MYDOC.has);
  MYDOC.at = Date.now();
  return DB.col('users').doc(myUid()).get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    MYDOC.has = !!(doc && doc.exists);
    if (MYDOC.has){
      STATE.users = STATE.users || {};
      STATE.users[myUid()] = Object.assign({}, doc.data());
    }
    return MYDOC.has;
  }).catch(function(e){
    MYDOC.err = String(e && (e.message || e.code) || e).slice(0, 120);
    return null;
  });
}
function myDocFix(){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }
  /* «لا شبكة» كانت تُقال والشبكةُ متصلة: الوصلةُ تُحمَّل كسولًا، فمن ضغط
     قبل أوّل قراءةٍ من السحابة وجد الزرَّ يقول ما ليس صحيحًا. تُهيَّأ أوّلًا،
     ولا يُقال «لا شبكة» إلا حين لا تكون. */
  if (!FB.ready || !FB.db){
    if (!STATE.meta.online){ toast(t('لا شبكة')); return; }
    return FB.init().then(function(ok){
      if (!ok){ toast(t('لا شبكة')); return false; }
      return myDocFix();
    });
  }
  return DB.col('users').doc(myUid()).get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    if (doc && doc.exists){
      STATE.users[myUid()] = Object.assign({}, doc.data());
      MYDOC.has = true;
      var back0 = permRelease(false);
      /* الزرُّ يُنهي العملَ لا يُخبر عنه: يقرأ ويُطلِق ويدفع ثم يقول ما بقي */
      CORE._busy = false;
      return CORE.flush().then(function(sent){
        toast(t('الوثيقةُ موجودةٌ')
              + (back0 ? ' \u00b7 ' + nm(back0) + ' ' + t('عادت للرفع') : '')
              + ' \u00b7 ' + t('رُفع') + ' ' + nm(sent || 0)
              + ' \u00b7 ' + t('بقي') + ' ' + nm(STATE.queue.length));
        render(1); return true;
      });
    }
    /* القاعدةُ لا تقبل لمن يسجّل نفسَه إلا «فنيًّا غيرَ فعّال» (V17.93): يعمل على
       جهازه ويُرفَع عملُه حين يفعّله المكتبُ — لا حسابَ فعّالًا لمن لا يعرفه أحد */
    /* صاحبُ المشروع ببريده فوق القاعدة: وثيقتُه مديرًا فعّالًا ويُطلَق ما حُبس — وغيرُه ينتظر التفعيل */
    var boss = typeof isBossHere === 'function' && isBossHere();
    var v = { name:STATE.meta.name || lgRemembered() || '', user:STATE.meta.name || '',
              role:boss ? 'admin' : 'tech', active:!!boss, at:Date.now(), self:true, _by:myUid(), _at:Date.now() };
    return DB.col('users').doc(myUid()).set(v).then(function(){
      STATE.users[myUid()] = v;
      MYDOC.has = true;
      if (boss){ var back1 = permRelease(true); logEvent('إنشاء وثيقة حساب صاحب المشروع — ' + myUid()); toast(t('الوثيقةُ موجودةٌ') + (back1 ? ' \u00b7 ' + nm(back1) + ' ' + t('عادت للرفع') : '')); render(1); return true; }
      ROLE = 'tech'; STATE.meta.role = 'tech';
      logEvent('إنشاء وثيقة حساب ذاتيًّا (ينتظر التفعيل) — ' + myUid());
      toast(t('أُنشئت وثيقةُ حسابك — تنتظر تفعيلَ المكتب، وعملُك يبقى على هذا الجهاز ويُرفَع بعد التفعيل'));
      render(1); return true;
    }).catch(function(e){
      softErr('إنشاء وثيقة الحساب', e, 'تعذّر إنشاءُ وثيقة حسابك — راجع المكتب');
      return false;
    });
  }).catch(function(e){
    softErr('قراءة وثيقة الحساب', e, 'تعذّرت قراءةُ وثيقة حسابك');
    return false;
  });
}
/* ═══ حالةُ النسخ الاحتياطي والدرايف — تُقرأ من المستودع ═══
   السيرُ اليوميُّ ينجح كلَّ يوم ويقول «نجح» — وهو لا يحفظ شيئًا حين تغيب
   الأسرار: يكتب أعدادًا ويتخطّى الرفعَ بإشعارٍ لطيفٍ لا يقرؤه أحد. فظُنَّ
   أن النسخَ يعمل وهو لا يعمل. صار يكتب حالتَه في ملفّين علنيَّين لا بياناتَ
   فيهما (_meta.json و_drive.json)، والتطبيقُ يقرؤهما ويعرضهما حيث يُرى:
   هل أُخذت نسخةُ اليوم؟ وهل وصلت درايف؟ وإن لا — ما الذي ينقص بالحرف. */
var BK_STATE = { at:0, meta:null, drive:null, err:'' };
var BK_RAW = 'https://raw.githubusercontent.com/mhmdsfwt371/-Project-survey/main/backups/latest/';
function bkFetch(force){
  if (!force && Date.now() - BK_STATE.at < 30 * 60 * 1000) return;
  BK_STATE.at = Date.now();
  if (typeof fetch !== 'function' || !navigator.onLine) return;
  var got = 0;
  ['_meta.json','_drive.json'].forEach(function(f){
    fetch(BK_RAW + f + '?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (f === '_meta.json') BK_STATE.meta = j; else BK_STATE.drive = j; got++; if (got === 2 && CUR === 'sys') render(1); })
      .catch(function(e){ BK_STATE.err = String(e && e.message || e); });
  });
}
function bkAgeDays(o){ return o && o.at ? Math.floor((Date.now() - new Date(o.at).getTime()) / 86400000) : null; }
function bkCard(){
  bkFetch(false);
  var m = BK_STATE.meta, dv = BK_STATE.drive;
  var rows = [];
  var mOk = !!(m && m.ok), dOk = !!(dv && dv.ok);
  var mAge = bkAgeDays(m), dAge = bkAgeDays(dv);
  rows.push([esc(t('نسخة القاعدة المشفَّرة')),
    m ? (mOk ? pill('أُخذت', mAge <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(m.at).slice(0, 10)) + '</span>'
             : pill('لم تُؤخَذ', 'off'))
      : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>',
    m && !mOk ? esc(m.why || '') + (m.fix ? '<br><span class="hint" style="margin:0">' + esc(m.fix) + '</span>' : '')
              : (m ? nm(m.totalDocs || 0) + ' ' + esc(t('وثيقة')) : '')]);
  rows.push([esc(t('الرفع إلى درايف')),
    dv ? (dOk ? pill('وصل', dAge <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(dv.day || dv.at).slice(0, 10)) + '</span>'
              : pill('لم يُرفَع', 'off'))
       : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>',
    dv && !dOk ? esc(dv.why || '') + (dv.fix ? '<br><span class="hint" style="margin:0">' + esc(dv.fix) + '</span>' : '')
               : (dv && dv.bytes ? esc(t('بيانات')) + ' ' + nm(Math.round((dv.bytes['backup-full.enc'] || dv.bytes['backup-full.json'] || 0) / 1024)) + ' ' + esc(t('ك.ب'))
                   + ' \u00b7 ' + esc(t('صور')) + ' ' + nm(Math.round((dv.bytes['photos.enc'] || dv.bytes['photos.json'] || 0) / 1024)) + ' ' + esc(t('ك.ب')) : '')]);
  var bad = (m && !mOk) || (dv && !dOk) || (mAge != null && mAge > 2);
  return card((bad ? '\u26A0 ' : '\u{1F5C4} ') + t('النسخ الاحتياطي والدرايف'),
      table(['ما يُنسَخ','آخر مرة','التفصيل'], rows)
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('السيرُ يعمل يوميًّا الخامسةَ والنصفَ صباحًا. الملفّان علنيّان بلا بيانات — أعدادٌ وحالة؛ والنسخةُ نفسُها مشفَّرةٌ في المستودع وخامٌ في درايفك وحدَك.'))
      + '</p>'
      + (may('settings')
        ? '<div class="actions" style="margin-top:8px">' + btn('\u21BB ' + t('حدِّث الحالة'),'btn-quiet btn-sm',' data-bkref="1"') + '</div>'
        : ''));
}
/* ═══ سجلُّ المخاطر الحيّ ═══
   كان السجلُّ ستةَ مخاطرَ مكتوبةً في الشيفرة، تُعرَض ولا تُمَسّ: لا يُضاف
   خطرٌ ظهر في الميدان، ولا يُغلَق ما زال، ولا يتغيّر مالكٌ. وسجلُّ مخاطرَ لا
   يُحدَّث ليس سجلًّا — هو زينةُ اجتماع. صار يُحفَظ في settings/risks
   ويُضاف إليه ويُعدَّل ويُغلَق، والبذرةُ بدايتُه لا سقفُه.
     ومعه ما لا يكتبه أحد: مؤشراتُ خطرٍ تُحسَب من البيانات نفسِها كلَّ رسمة —
   الجدولُ يتأخّر، والكلفةُ تتجاوز، والوتيرةُ دون المطلوب، وزياراتٌ متعذّرة،
   وبلاغاتٌ جوهرية، ومردوداتٌ تتكرّر. فالخطرُ يُرى قبل أن يُكتَب. */
function risksList(){
  if (!Array.isArray(STATE.risks) || !STATE.risks.length)
    STATE.risks = RISKS.map(function(r){ return Object.assign({}, r); });
  return STATE.risks;
}
function riskSave(){ CORE.set('cfg', 'risks', risksList().slice()); }
function riskSet(id, patch){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var r = risksList().filter(function(x){ return x.id === id; })[0];
  if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (patch.st === 'مغلق') r.closedAt = Date.now();
  r.at = Date.now();   /* تاريخُ آخر مراجعة — تقيسه «مطابقة المنهجية» (V19.3) */
  riskSave();
  logEvent('خطر — ' + id + ' \u00b7 ' + Object.keys(patch).join('،'), id);
}
/* الخطرُ المسجَّلُ بالخطأ يُحذَف — والمغلقُ يبقى في السجل شاهدًا */
function riskDel(id){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var L = risksList(), x = L.filter(function(r){ return r.id === id; })[0];
  if (!x) return;
  if (x.st === 'مغلق'){ toast(t('الخطرُ المغلق يبقى في السجل للرجوع إليه — لا يُحذَف')); return; }
  STATE.risks = L.filter(function(r){ return r.id !== id; });
  riskSave();
  logEvent('حذف خطر — ' + id + ' \u00b7 ' + x.t, id);
  toast(t('حُذف الخطر'));
  render(1);
}
function riskAdd(){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var tt = g('rkT');
  if (!tt){ toast(t('اكتب وصفَ الخطر')); return; }
  var L = risksList();
  var n = L.length + 1, id = 'R' + n;
  while (L.some(function(x){ return x.id === id; })) id = 'R' + (++n);
  L.push({ id:id, t:tt, cat:g('rkC') || 'ميداني', p:cfgN(g('rkP')) || 3, i:cfgN(g('rkI')) || 3,
           resp:g('rkR') || 'تخفيف', plan:g('rkPl'), own:g('rkO') || (STATE.meta.name || ''),
           st:'مفتوح', at:Date.now(), by:STATE.meta.name || '' });
  riskSave();
  logEvent('خطر جديد — ' + id + ' \u00b7 ' + tt, id);
  toast(id + ' \u00b7 ' + t('سُجِّل الخطر'));
  render(1);
}
/* مؤشراتٌ حيّةٌ — من الأرقام لا من الذاكرة */
function riskSignals(){
  var out = [], S = siteStats(), v = (typeof evm === 'function') ? evm() : null;
  if (v && v.SPIx && v.SPIx < 0.9)  out.push(['bad', t('الجدولُ متأخّر') + ' — SPI ' + nm(v.SPI), 'plan']);
  if (v && v.CPIx && v.CPIx < 0.9)  out.push(['bad', t('الكلفةُ تتجاوز') + ' — CPI ' + nm(v.CPI), 'evm']);
  var rev = 0, blocked = 0;
  Object.keys(STATE.recs).forEach(function(k){
    var r = STATE.recs[k];
    if (svReview(r) === 'revisit') rev++;
    if (r && r.access && r.access !== 'تم الوصول') blocked++;
  });
  if (blocked) out.push([blocked > 20 ? 'bad' : 'wrn', nm(blocked) + ' ' + t('زيارةً متعذّرةً تحتاج قرارًا'), 'stuck']);
  if (rev)     out.push(['wrn', nm(rev) + ' ' + t('زيارةً مردودةً تنتظر إعادة'), 'svappr']);
  if (typeof NCRS !== 'undefined'){
    var maj = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.sev === 'جوهري'; }).length;
    if (maj) out.push(['bad', nm(maj) + ' ' + t('بلاغَ عدمِ مطابقةٍ جوهريًّا مفتوحًا'), 'ncr']);
  }
  var late = 0, today = dayKey(Date.now());
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.status !== 'معتمد' && x.when && x.when < today && !svDone(STATE.recs[x.site])) late++;
  });
  if (late) out.push([late > 10 ? 'bad' : 'wrn', nm(late) + ' ' + t('مهمةً تجاوزت موعدَها'), 'req']);
  var resPct = cfgGet('reservePct') || 0, reserve = Math.round((cfgGet('budCap') || 0) * resPct / 100);
  if (v && reserve){
    var eaten = Math.max(0, v.EAC - v.BAC);
    if (eaten > reserve)          out.push(['bad', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ') + ' — ' + nm(eaten - reserve), 'budm']);
    else if (eaten > reserve / 2) out.push(['wrn', t('استُهلك نصفُ الاحتياطي') + ' — ' + nm(eaten) + ' / ' + nm(reserve), 'budm']);
  }
  /* مهمةٌ على حسابٍ عُطِّل لا يراها أحدٌ ولا تُنجَز — تنتظر إلى الأبد */
  var offNames = {};
  Object.keys(STATE.users || {}).forEach(function(u){ if (STATE.users[u] && STATE.users[u].active === false && STATE.users[u].name) offNames[STATE.users[u].name] = 1; });
  var orphan = 0;
  Object.keys(STATE.tasks || {}).forEach(function(k){ var x = STATE.tasks[k]; if (x && x.status !== 'معتمد' && offNames[x.to]) orphan++; });
  if (orphan) out.push(['bad', nm(orphan) + ' ' + t('مهمةً على حسابٍ معطَّل — أعد إسنادَها'), 'reqreg']);
  var noNet = STATE.sites.filter(function(x){ return !x.net && !(typeof ipPreset === 'function' && ipPreset(x)); }).length;
  if (noNet > 100) out.push(['wrn', nm(noNet) + ' ' + t('نقطةً بلا بادئة شبكة'), 'ips']);
  /* نسخةٌ احتياطيةٌ لا تُؤخَذ أو لا تصل درايف: خطرٌ صامتٌ لا يظهر إلا يومَ الحاجة */
  if (may('settings')){
    bkFetch(false);
    var bm = BK_STATE.meta, bd = BK_STATE.drive;
    if (bm && !bm.ok) out.push(['bad', t('لا نسخةَ احتياطيةً تُؤخَذ') + ' — ' + t('BACKUP_KEY غير مضبوط'), 'hb']);
    else if (bm && bkAgeDays(bm) > 2) out.push(['bad', t('آخر نسخةٍ احتياطية منذ') + ' ' + nm(bkAgeDays(bm)) + ' ' + t('يوم'), 'hb']);
    if (bd && !bd.ok) out.push(['wrn', t('النسخةُ لا تُرفَع إلى درايف') + ' — ' + t('GDRIVE_SA غير مضبوط'), 'hb']);
  }
  if (!out.length) out.push(['ok', t('لا مؤشرَ خطرٍ حيًّا الآن'), '']);
  return out;
}
var RISKS = [
  { id:'R1', t:'تأخّر توريد القطع عن الموعد', cat:'مشتريات', p:3, i:4,
    resp:'تخفيف', plan:'طلبٌ مبكّرٌ ومورّدٌ بديلٌ معتمد', own:'المهندس', st:'مفتوح' },
  { id:'R2', t:'تعذّر الوصول لمواقع داخل المخيمات', cat:'ميداني', p:4, i:3,
    resp:'تخفيف', plan:'إشعارُ الشركات قبل الموعد بأسبوع', own:'المشرف', st:'مفتوح' },
  { id:'R3', t:'انقطاع الكهرباء في نقاط الممرات', cat:'فني', p:3, i:4,
    resp:'تخفيف', plan:'منظومةُ طاقةٍ شمسيةٍ للنقاط المعزولة', own:'مهندس الكهرباء', st:'مفتوح' },
  { id:'R4', t:'نقص الفنيين عن التارجت الشهري', cat:'موارد', p:3, i:5,
    resp:'تخفيف', plan:'حسابُ الطواقم مسبقًا وتعاقدٌ احتياطي', own:'مدير المشروع', st:'مفتوح' },
  { id:'R5', t:'تجاوز الميزانية بارتفاع الأسعار', cat:'مالي', p:2, i:4,
    resp:'قبول', plan:'احتياطيٌّ عشرةٌ بالمئة من السقف', own:'مدير المشروع', st:'مفتوح' },
  { id:'R6', t:'رفض الوزارة لمواقعَ بعد التركيب', cat:'أطراف', p:2, i:5,
    resp:'تجنّب', plan:'اعتمادُ المواقع قبل التركيب لا بعده', own:'المهندس', st:'مفتوح' },
  { id:'R7', t:'ضياع بياناتٍ ميدانيةٍ قبل الرفع', cat:'تقني', p:2, i:5,
    resp:'تخفيف', plan:'حفظٌ محليٌّ وطابورُ رفعٍ ونسخٌ يومي', own:'المطوّر', st:'مغلق' },
  { id:'R8', t:'ازدحام الموسم يمنع الحركة', cat:'ميداني', p:4, i:4,
    resp:'تجنّب', plan:'إنهاءُ التركيب قبل بدء الموسم بشهر', own:'مدير المشروع', st:'مفتوح' }
];

function riskScore(r){ return r.p * r.i; }
function riskLevel(n){
  if (n >= 15) return { t:'حرج', c:'bad' };
  if (n >= 9)  return { t:'عالٍ', c:'wrn' };
  if (n >= 4)  return { t:'متوسط', c:'' };
  return { t:'منخفض', c:'ok' };
}


/* ── ضبط التغيير ── */
var CHANGES = [];


function chgAdd(){
  var kind = (document.getElementById('chgKind') || {}).value || 'نطاق';
  var imp  = (document.getElementById('chgImp') || {}).value || 'لا أثر';
  var why  = (document.getElementById('chgWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب المبرّر أولًا')); return; }
  var num = function(id){ var e = document.getElementById(id); return e ? (cfgN(e.value) || 0) : 0; };
  CHANGES.push({ kind:kind, imp:imp, why:why, by:STATE.meta.name || '',
                 at:Date.now(), st:'مقدَّم',
                 dCost:num('chgCost'), dDays:num('chgDays'), dScope:num('chgScope') });
  CORE.dirty('changes', 'CR-' + CHANGES.length, CHANGES[CHANGES.length-1]);
  logEvent('طلب تغيير — ' + kind + ' · ' + imp);
  toast(t('قُدّم الطلب'));
  render(1);
}

/* ═══ التغييرُ المعتمَدُ يُطبَّق على خط الأساس آليًّا ═══
   كان الاعتمادُ يقول «اعتُمد — جمّد خطَّ أساسٍ جديد» ويترك التطبيقَ للذاكرة:
   فيبقى خطُّ الأساس القديمُ يقيس المشروعَ على نطاقٍ وميزانيةٍ لم تعودا،
   وتقول القيمةُ المكتسبة «متجاوزٌ للكلفة» عن تغييرٍ اعتمده المدير بنفسه.
   صار الاعتمادُ يُطبِّق المقاديرَ: الكلفةُ تُضاف إلى الميزانية عند الاكتمال،
   والأيامُ تُزاح بها المواعيدُ المستهدفة، والنطاقُ يُعدَّل — ويُجمَّد خطُّ
   أساسٍ جديدٌ برقمٍ أعلى يحمل رقمَ التغيير سببًا، فيبقى القديمُ في سجله. */
function chgApply(c, no){
  if (!BASE){ toast(t('لا خطَّ أساسٍ مجمَّدًا بعد — جمّده أولًا من «المعالم»')); return false; }
  var dCost = +c.dCost || 0, dDays = +c.dDays || 0, dScope = +c.dScope || 0;
  if (!dCost && !dDays && !dScope) return false;
  var prev = BASE;
  BASE = JSON.parse(JSON.stringify(prev));
  BASE.ver = (prev.ver || 1) + 1;
  BASE.at = Date.now(); BASE.by = STATE.meta.name || '';
  BASE.bac = Math.round((prev.bac || 0) + dCost);
  BASE.scope = (prev.scope || 0) + dScope;
  BASE.reason = no + ' \u00b7 ' + c.kind;
  BASE.applied = (prev.applied || []).concat([{ no:no, dCost:dCost, dDays:dDays, dScope:dScope, at:Date.now() }]);
  if (dDays){
    /* المواعيدُ تُزاح — والوتيرةُ تقرؤها من الإعدادات فتتغيّر إجابةُ «هنلحق؟» معها */
    ['dueSurvey','dueInstall'].forEach(function(k){
      var v = cfgGet(k);
      if (v) cfgSet(k, null, v + dDays * 86400000);   /* المواعيدُ تُخزَّن ميلّي ثانية */
    });
  }
  CORE.set('baseline', 'v' + BASE.ver, BASE);
  logEvent('خط أساس جديد ' + nm(BASE.ver) + ' — تطبيق ' + no
           + (dCost ? ' \u00b7 كلفة ' + nm(dCost) : '') + (dDays ? ' \u00b7 أيام ' + nm(dDays) : '') + (dScope ? ' \u00b7 نطاق ' + nm(dScope) : ''));
  return true;
}
function chgDecide(i, ok){
  var c = CHANGES[i];
  if (!c) return;
  if (!may('approve')){ toast(t('قرارُ التغيير للمهندس وحده')); return; }
  if (c.st === 'معتمد' || c.st === 'مرفوض'){ toast(t('قُرِّر من قبل')); return; }
  c.st = ok ? 'معتمد' : 'مرفوض';
  c.decBy = STATE.meta.name || '';
  c.decAt = Date.now();
  var no = 'CR-' + (i+1), applied = false;
  if (ok) applied = chgApply(c, no);
  c.applied = applied;
  CORE.dirty('changes', no, c);
  logEvent((ok ? 'اعتماد' : 'رفض') + ' طلب تغيير — ' + no + ' \u00b7 ' + c.kind);
  toast(ok ? (applied ? t('اعتُمد وطُبِّق على خط الأساس') + ' \u00b7 ' + nm(BASE.ver) : t('اعتُمد — بلا أثرٍ مقيسٍ على خط الأساس')) : t('رُفض'));
  render(1);
}

/* ═══ التغطية — من الشركة بأقسامها إلى العميل بإداراته ═══
   لكلِّ جهةٍ ما يخصّها: تراه كاملًا ولا ترى ما ليس لها. */

var ORG = {
  co: { n:'أفاقي — المنفِّذ', i:'\u{1F3E2}', units:[
    { id:'exec',  n:'الإدارة العليا',     i:'\u{1F3AF}', needs:'الربحية والمخاطر الكبرى والقرار', pages:['exec','evm','risks','perf'] },
    { id:'pmo',   n:'إدارة المشاريع',      i:'\u{1F4CA}', needs:'الجدول والكلفة والموارد',        pages:['evm','risks','chg','miles','pace'] },
    { id:'eng',   n:'الهندسة',            i:'\u{1F393}', needs:'التدقيق والاعتماد والمواصفات',    pages:['qa','ncr','sites','items'] },
    { id:'ops',   n:'العمليات الميدانية',  i:'\u{1F527}', needs:'الإسناد والتنفيذ والمتابعة',      pages:['map','req','assign','crewman'] },
    { id:'qaqc',  n:'الجودة',             i:'\u2713',    needs:'عدم المطابقة والإجراء التصحيحي',  pages:['ncr','qa','ev'] },
    { id:'hse',   n:'السلامة',            i:'\u26D1',    needs:'الحوادث والتصاريح والتوعية',      pages:['hse'] },
    { id:'hr',    n:'الموارد البشرية',     i:'\u{1F465}', needs:'الفرق والحضور والمستحقات',        pages:['crewman','perf','users'] },
    { id:'fin',   n:'المالية',            i:'\u{1F4B0}', needs:'المستخلصات والدفعات والتدفق',     pages:['ipc','budget','buys','budm'] },
    { id:'proc',  n:'المشتريات',          i:'\u{1F4E6}', needs:'الطلبات والمورّدون والالتزامات',   pages:['buys','sup','invb','wos'] },
    { id:'it',    n:'تقنية المعلومات',     i:'\u{1F5A5}', needs:'الشبكة وصحة الأجهزة والنسخ',      pages:['hb','probe','sys','retain'] }
  ]},
  cl: { n:'الوزارة — العميل', i:'\u{1F54B}', units:[
    { id:'cexec', n:'الإدارة العليا',      i:'\u{1F3AF}', needs:'التقدّم الكلي والمعالم',          pages:['over','miles','chain'] },
    { id:'cprj',  n:'إدارة المشاريع',       i:'\u{1F4C8}', needs:'الجدول والإنجاز بالمشعر',        pages:['repcenter','reg','pace','inst'] },
    { id:'cfin',  n:'الإدارة المالية',      i:'\u{1F4B3}', needs:'المستخلصات المعتمدة والصرف',      pages:['ipc','budm'] },
    { id:'ctec',  n:'الإدارة الفنية',       i:'\u2699',    needs:'المطابقة للمواصفة والفحص',        pages:['ncr','hb','sites'] },
    { id:'cops',  n:'إدارة التشغيل',        i:'\u{1F504}', needs:'التسليم والضمان والتشغيل',        pages:['hand','dis'] },
    { id:'caud',  n:'المراجعة الداخلية',    i:'\u{1F50E}', needs:'الأثر والسجلّات والتوثيق',        pages:['ev','perf'] }
  ]}
};

PAGE.org = { m:'التخطيط', t:'التنظيم والسلامة',
  l:'من يغطّي ماذا ومن يُساءل — والحوادثُ وإجراءاتُ السلامة والدروس.',
  body:function(){
    var head = tabHead('org'), cur = tabCur('org');
    if (cur === 'hse') return head + (function(){
    var SC = scores();
    var manDays = SC.list.reduce(function(a,e){ return a + e.nDays; }, 0);
    var hrs = manDays * (cfgGet('hours') || 8);
    var n = HSE.incidents.length;
    /* معدّلُ التكرار: حوادثُ لكلِّ مئتَي ألف ساعةِ عمل — التعريفُ المعتمد */
    var trir = hrs ? Math.round(n * 200000 / hrs * 100) / 100 : 0;

    return stats([['ساعات عمل', N(hrs), 'acc'],
                  ['حوادث مسجّلة', N(n), n ? 'bad' : 'ok'],
                  ['أيام فُقدت', N(HSE.lost), HSE.lost ? 'wrn' : 'ok'],
                  ['معدّل التكرار', nm(trir), trir > 3 ? 'bad' : 'ok']])

      + card('تسجيل حادث',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
          + '<select id="hseKind">'
          + ['وشيك — بلا إصابة','إسعاف أولي','علاج طبي','فقدُ أيام عمل','ضررٌ بالمعدات']
              .map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الموقع')) + '</label>'
          + '<input id="hseSite" placeholder="NSK-…" dir="ltr"></div>'
          + '<div class="field"><label>' + esc(t('أيام العمل المفقودة')) + '</label>'
          + '<input type="number" id="hseLost" min="0" value="0"></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف والإجراء')) + '</label>'
          + '<textarea id="hseWhy" rows="2"></textarea></div>',
          btn('سجّل','btn-danger',' data-hseadd="1"'))

      + (n
        ? cardFlush('سجل الحوادث',
            table(['التاريخ','النوع','الموقع','أيام مفقودة','الإجراء',''],
              HSE.incidents.map(function(x, i){
                var ed = may('approve');
                return ['<span class="num">' + fmtDate(x.at) + '</span><br>'
                          + '<span class="hint" style="margin:0">' + esc(dispName(x.by)) + '</span>',
                        pill(x.kind, x.lost ? 'off' : 'warn'), '<span class="num">' + esc(x.site || '—') + '</span>',
                        /* N() تُعيد وسمَ span لا رقمًا — ووسمٌ داخل value="" يُغلق
                           الاقتباسَ فيُكسَر الحقلُ ولا يُرسَم. تُستعمل القيمةُ الخام. */
                        ed ? '<input type="number" min="0" value="' + esc(String(cfgN(x.lost))) + '" data-hsel="' + i + '" style="width:74px">' : N(x.lost),
                        ed ? '<input value="' + esc(x.why) + '" data-hsew="' + i + '" dir="auto">'
                           : '<span class="hint" style="margin:0">' + esc(x.why.slice(0,44)) + '</span>',
                        ed ? btn('🗑','btn-quiet btn-sm',' data-hsedel="' + i + '" aria-label="' + esc(t('حذف')) + '"') : '—'];
              })),
            btn('⬇ إكسل — السلامة','btn-secondary btn-sm',' data-xls="hse"'))
        : card('', alertBox('success','لا حوادثَ مسجّلة — والصفرُ هو الهدف.')))

      + card('اشتراطات الموقع',
          table(['الاشتراط','الإلزام','ملاحظة'], [
            ['خوذة وحذاء أمان', 'إلزامي', 'في كلِّ نقاط الممرات والجسور'],
            ['حزام ارتفاع', 'إلزامي', 'فوق مترين — أعمدةُ الكاميرات'],
            ['عزل الكهرباء قبل العمل', 'إلزامي', 'افصل التيار واقفله وعلّق بطاقةَ تحذيرٍ قبل فتح البوكس'],
            ['تصريح عملٍ ساخن', 'عند اللزوم', 'اللحامُ والقطع'],
            ['ماءٌ وظلٌّ للفريق', 'إلزامي', 'حرارةُ المشاعر تتجاوز الأربعين']
          ])
          + '<p class="hint">' + esc(t('معدّلُ التكرار = الحوادثُ × مئتَي ألفٍ ÷ ساعات العمل — وثلاثةٌ فأقلُّ مقبولٌ دوليًّا.')) + '</p>');
  })();
    if (cur === 'raci') return head + (function(){
    return card('المفتاح',
        table(['الرمز','المعنى','الشرط'], [
          ['<b>R</b>','المنفِّذ — يعمل','واحدٌ فأكثر'],
          ['<b>A</b>','المساءَل — يوقّع','واحدٌ لا غير'],
          ['<b>C</b>','المستشار — يُسأل قبل','اختياري'],
          ['<b>I</b>','المبلَّغ — يُخبَر بعد','اختياري']
        ]))
      + cardFlush(t('المصفوفة') + ' — ' + nm(raciList().length),
          table(['النشاط','R — ينفّذ','A — يُساءل','C — يُستشار','I — يُبلَّغ',''],
            raciList().map(function(r, ri){
              return ['<input value="' + esc(r.a) + '" data-rca="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.R || '') + '" data-rcr="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.A || '') + '" data-rcac="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.C || '') + '" data-rcc="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.I || '') + '" data-rci="' + ri + '" dir="auto">',
                      may('settings') ? btn('حذف','btn-quiet btn-sm',' data-rcdel="' + ri + '"') : ''];
            })),
          btn('⬇ إكسل — المسؤوليات','btn-secondary btn-sm',' data-xls="raci"'))
      + (may('settings')
        ? card('إضافة نشاط',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('النشاط')) + ' <span class="req">*</span></label><input id="rcA" dir="auto"></div>'
            + '<div class="field"><label>R — ' + esc(t('ينفّذ')) + '</label><input id="rcR" dir="auto"></div>'
            + '<div class="field"><label>A — ' + esc(t('يُساءل')) + '</label><input id="rcAc" dir="auto"></div>'
            + '<div class="field"><label>C — ' + esc(t('يُستشار')) + '</label><input id="rcC" dir="auto"></div>'
            + '<div class="field"><label>I — ' + esc(t('يُبلَّغ')) + '</label><input id="rcI" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة نشاط','btn-primary btn-sm',' data-rcadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('لكلِّ نشاطٍ مساءَلٌ واحدٌ لا غير — فإن تعدّد ضاعت المسؤولية.')) + '</p>';
  })();
    if (cur === 'esc') return head + (function(){
    var L = escList(), due = escDue();
    var today = due.filter(function(x){ return x.days === (byDays(x)); });
    function byDays(x){ return x.days; }
    var late = due.filter(function(x){ return x.days > 7; });
    var oldest = due.length ? due[0].days : null;

    return stats([['بانتظار التصعيد', N(due.length), due.length ? 'wrn' : 'ok'],
                  ['متأخر أكثر من أسبوع', N(late.length), late.length ? 'bad' : 'ok'],
                  ['قواعد مضبوطة', N(L.length)],
                  ['أقدم عنصر', oldest === null ? '—' : (nm(oldest) + ' ' + t('يوم')),
                    oldest > 7 ? 'bad' : '']])

      + cardFlush(t('قواعد التصعيد') + ' — ' + nm(L.length),
          table(['الحالة','بعد (يوم)','المسؤول','يُصعَّد إلى','الإجراء',''],
            L.map(function(r, i){
              return ['<input value="' + esc(r.w) + '" data-esw="' + i + '" dir="auto">',
                      '<input type="number" min="1" value="' + esc(String(r.days)) + '" data-esd="' + i + '" style="max-width:78px">',
                      '<input value="' + esc(r.who || '') + '" data-eswho="' + i + '" dir="auto">',
                      '<input value="' + esc(r.to || '') + '" data-esto="' + i + '" dir="auto">',
                      '<input value="' + esc(r.act || '') + '" data-esact="' + i + '" dir="auto">',
                      may('settings') ? btn('حذف','btn-quiet btn-sm',' data-esdel="' + i + '"') : ''];
            })),
          '<p class="hint" style="margin:0">' + esc(t('يُحفَظ فورَ كتابته — ولا زرَّ حفظٍ يَعِد بما وقع سلفًا.')) + '</p>')

      + (may('settings')
        ? card('إضافة قاعدة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الحالة')) + ' <span class="req">*</span></label><input id="esW" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('بعد (يوم)')) + '</label><input id="esD" type="number" min="1" value="3"></div>'
            + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input id="esWho" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('يُصعَّد إلى')) + '</label><input id="esTo" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الإجراء')) + '</label><input id="esAct" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة قاعدة','btn-primary btn-sm',' data-esadd="1"'))
        : '')

      + cardFlush(t('قائمة التصعيد اليوم') + ' — ' + nm(due.length),
          due.length
            ? table(['الحالة','العنصر','منذ','يُرفَع إلى','الإجراء'],
                due.slice(0, 100).map(function(x){
                  return [pill(t(x.w), x.days > 7 ? 'bad' : 'wrn'),
                          '<span class="num">' + esc(x.what) + '</span>',
                          '<span class="num">' + nm(x.days) + ' ' + esc(t('يوم')) + '</span>',
                          esc(t(x.to || '—')),
                          '<span class="hint" style="margin:0">' + esc(t(x.act || '')) + '</span>'];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا شيءَ تجاوز مهلتَه — كلُّ ما ينتظر داخلَ مدّته.')) + '</p>');
  })();
    return head + (function(){
    /* ═══ الشاشةُ شاشةٌ ولو كانت شريحةً (V17.14) ═══
       كانت القائمةُ تعدُّ صفحاتِ PAGE وحدَها، وأكثرُ ما تحتاجه الأقسامُ
       شرائحُ داخل صفحات (خطُّ الأساس، المخاطر، الميزانية، المورّدون…) —
       فقالت الخريطةُ «إدارة المشاريع ٠ من ٥ · ناقص ٥» وكلُّها موجودة.
       «ناقص» صار يعني حقًّا: شاشةٌ يحتاجها القسمُ ولم تُبنَ بعد. */
    var P = Object.keys(PAGE).concat(
      typeof FIELD_PAGES === 'object' ? Object.keys(FIELD_PAGES) : []);
    Object.keys(TABS).forEach(function(pg){ TABS[pg].forEach(function(tb){ if (P.indexOf(tb[0]) < 0) P.push(tb[0]); }); });
    function unitRows(side){
      return ORG[side].units.map(function(u){
        var have = u.pages.filter(function(p){ return P.indexOf(p) > -1; });
        var miss = u.pages.filter(function(p){ return P.indexOf(p) < 0; });
        return [u.i + ' <strong>' + esc(t(u.n)) + '</strong>',
                '<span class="hint" style="margin:0">' + esc(t(u.needs)) + '</span>',
                N(have.length) + ' / ' + N(u.pages.length),
                /* «ناقص ٣» كان نصًّا مركَّبًا بالجمع فلا يبلغه القاموس — تُترجَم
                   الكلمةُ وحدَها ويُلحَق بها الرقم */
                miss.length ? pill(t('ناقص') + ' ' + nm(miss.length), 'off') : pill('مغطّى', 'ok')];
      });
    }
    var all = ORG.co.units.concat(ORG.cl.units);
    var covered = all.filter(function(u){
      return u.pages.every(function(p){ return P.indexOf(p) > -1; }); }).length;

    return stats([['جهاتٌ تستخدم النظام', N(all.length), 'acc'],
                  ['مغطّاةٌ كاملًا', N(covered), covered===all.length?'ok':'wrn'],
                  ['أقسام الشركة', N(ORG.co.units.length)],
                  ['إدارات العميل', N(ORG.cl.units.length)]])

      + cardFlush(ORG.co.i + ' ' + t(ORG.co.n),
          table(['القسم','ما يحتاجه','شاشاته','الحالة'], unitRows('co')))

      + cardFlush(ORG.cl.i + ' ' + t(ORG.cl.n),
          table(['الإدارة','ما تحتاجه','شاشاتها','الحالة'], unitRows('cl')))

      + card('المبدأ',
          '<p class="hint" style="margin:0">'
          + esc(t('لكلِّ جهةٍ ما يخصّها: تراه كاملًا ولا ترى ما ليس لها. فالمالُ للمالية، والمورّدون للمشتريات، والمستخلصُ المعتمَدُ وحده للعميل.'))
          + '</p>');
  })();
  }};

/* ── لوحة الإدارة العليا ── */
PAGE.exec = { m:'المتابعة', t:'التقارير التنفيذية',
  l:'اللوحةُ التنفيذية ومركزُ التقارير والملخّصُ المالي.',
  body:function(){
    var head = tabHead('exec'), cur = tabCur('exec');
    if (cur === 'diary') return head + diaryBody();
    if (cur === 'pmi') return head + pmiBody();
    if (cur === 'lessons') return head + lessonsBody();
    if (cur === 'stake') return head + stakeBody();
    if (cur === 'budm') return head + (function(){
    var cap = cfgGet('budCap'), spent = buysSpent();
    var byCat = {};
    buysList().forEach(function(b){ if (b.st !== 'معتمد') return;
      byCat[b.cat] = (byCat[b.cat] || 0) + (+b.amt || 0); });
    var cats = Object.keys(byCat).sort(function(a,b){ return byCat[b] - byCat[a]; });

    /* ═══ الاحتياطي ═══
       الميزانيةُ المعتمدةُ سقفٌ واحد — فلا يُعرَف إن كان التجاوزُ يأكل من
       احتياطيِّ المخاطر المرصود أم من لحم المشروع. صار الاحتياطيُّ نسبةً من
       السقف تُرصَد في الإعدادات، ويُقاس ما استُهلك منه: ما زاد عن التقدير
       عند الاكتمال على خطِّ الأساس هو ما أُكل من الاحتياطي. */
    var resPct = cfgGet('reservePct') || 0, reserve = Math.round(cap * resPct / 100);
    var v = (typeof evm === 'function') ? evm() : null;
    var eaten = v ? Math.max(0, v.EAC - v.BAC) : 0;
    return stats([['الميزانية المعتمدة', cap ? N(cap) : '—', 'acc'],
                  ['المنصرف', N(spent)],
                  ['المتبقي', cap ? N(cap - spent) : '—', cap ? 'ok' : ''],
                  ['نسبة الصرف', cap ? (nm(Math.round(spent / cap * 100)) + '٪') : '—'],
                  ['الاحتياطي المرصود', reserve ? N(reserve) : '—', reserve ? 'acc' : 'wrn'],
                  ['المستهلك من الاحتياطي', reserve ? N(Math.min(eaten, reserve)) : (eaten ? N(eaten) : '—'),
                   !reserve ? '' : (eaten > reserve ? 'bad' : (eaten ? 'wrn' : 'ok'))]])
      + (may('settings')
        ? card('احتياطي المخاطر',
            '<div class="grid cols-2"><div class="field" style="margin:0"><label>' + esc(t('نسبة الاحتياطي من السقف')) + ' (' + esc(t('٪')) + ')</label>'
            + cfgInput('reservePct', undefined, { dec:0 }) + '</div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('قيمته')) + '</label><div class="num" style="padding:10px 0">' + (reserve ? nm(reserve) : '—') + '</div></div></div>'
            + (reserve ? meter('المستهلك من الاحتياطي', Math.min(eaten, reserve), reserve) : '')
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('يُستهلك الاحتياطيُّ بقدر ما يزيد تقديرُ الاكتمال (EAC) على خط الأساس (BAC) — لا بما يُصرَف: الصرفُ في حدود الخط ليس استهلاكًا للاحتياطي.')) + '</p>'
            + (eaten > reserve && reserve ? alertBox('error', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ كلَّه — يحتاج قرارَ إدارةٍ أو طلبَ تغيير.')) : ''))
        : (reserve && eaten > reserve ? alertBox('error', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ كلَّه — يحتاج قرارَ إدارةٍ أو طلبَ تغيير.')) : ''))

      + (cap ? card('', meter('المستهلك من السقف المعتمد', spent, cap)) : '')

      + (cats.length
        ? cardFlush('المنصرف بأبوابه',
            table(['الباب','المبلغ','النسبة'],
              cats.map(function(c){
                return [esc(c), N(byCat[c]),
                        spent ? (nm(Math.round(byCat[c] / spent * 100)) + '٪') : '٠٪'];
              }),
              ['<b>' + t('الإجمالي') + '</b>', '<b>' + nm(spent) + '</b>', '١٠٠٪']),
            btn('⬇ إكسل — الملخّص','btn-secondary btn-sm',' data-xls="budm"'))
        : card('', alertBox('info','لا مصروفاتٍ مسجّلةً بعد.')))

      + card('كلفة العمل الميداني',
          (function(){
            var S = scores();
            var pts = S.list.reduce(function(a,e){ return a + e.total; }, 0);
            var pay = S.list.reduce(function(a,e){ return a + e.money; }, 0);
            return '<div class="stats" style="margin:0">'
              + stat('نقاطٌ أُنجزت', N(Math.round(pts)))
              + stat('سعر النقطة', cfgGet('ph') ? N(cfgGet('ph')) + ' ' + t('ريال') : '—')
              + stat('مستحقّ الفنيين', cfgGet('ph') ? N(Math.round(pay)) : '—', 'acc')
              + stat('من عملوا', N(S.n))
              + '</div>';
          })()
          + '<p class="hint">' + esc(t('محسوبٌ من أوزان الإعدادات وما سجّله كلُّ فنيٍّ — لا رقمَ مكتوبٌ بيد.')) + '</p>')

      + '<p class="hint">' + esc(t('تفاصيلُ المورّدين والفواتير في دفتر المشتريات — وهو للمهندس.')) + '</p>';
  })();
    return head + (function(){
    var S = siteStats(), v = (typeof evm === 'function') ? evm() : null;
    var SC = scores();
    var pay = SC.list.reduce(function(a,e){ return a + e.money; }, 0);
    var open = (typeof RISKS !== 'undefined')
      ? RISKS.filter(function(r){ return r.st === 'مفتوح' && riskScore(r) >= 12; }) : [];

    return stats([['الإنجاز', nm(S.total ? Math.round(S.surveyed / S.total * 100) : 0) + '٪',
                   'acc'],
                  ['أداء الجدول', v ? nm(v.SPI) : '—', v && v.SPI < 0.95 ? 'bad' : 'ok'],
                  ['أداء الكلفة', v ? nm(v.CPI) : '—', v && v.CPI < 0.95 ? 'bad' : 'ok'],
                  ['مخاطر حرجة', N(open.length), open.length ? 'bad' : 'ok']])

      + card('الموقف في سطر',
          v
            ? alertBox(v.SPI >= 0.95 && v.CPI >= 0.95 ? 'success' : (v.SPI < 0.9 ? 'error' : 'warn'),
                'أُنجز ' + nm(Math.round(v.EV)) + ' من ' + nm(v.BAC) + ' — '
                + t(evmVerdict(v).t) + '. والمتوقَّع عند الإتمام ' + nm(v.EAC)
                + (v.VAC < 0 ? ' بتجاوزٍ قدره ' + nm(-v.VAC) : ' بوفرٍ قدره ' + nm(v.VAC)) + '.')
            : alertBox('warn','لم يُجمَّد خطُّ أساسٍ بعد — فلا حكمَ على الأداء.'),
          btn('التفاصيل','btn-secondary btn-sm',' data-p="evm"'))

      + card('الأرقام الكبرى',
          table(['البند','القيمة','الملاحظة'], [
            ['نطاق المشروع', N(S.total), 'نقطةٌ في أربعة مشاعر'],
            ['أُنجز مسحًا', N(S.surveyed), S.total ? nm(Math.round(S.surveyed/S.total*100))+'٪' : ''],
            ['أُنجز تركيبًا', N(S.installed), S.total ? nm(Math.round(S.installed/S.total*100))+'٪' : ''],
            ['من يعملون', N(SC.n), 'فنيًّا ومهندسًا'],
            ['مستحقُّ العمل', cfgGet('ph') ? N(Math.round(pay)) : '—', 'محسوبٌ من الأوزان'],
            ['المنصرف على المشتريات', N(buysSpent()), cfgGet('budCap')
              ? nm(Math.round(buysSpent() / cfgGet('budCap') * 100)) + '٪ من السقف' : '']
          ]))

      + (open.length
        ? cardFlush('ما يحتاج قرارَك',
            table(['الخطر','الدرجة','المالك','الاستجابة'],
              open.map(function(r){
                var L = riskLevel(riskScore(r));
                return [esc(r.t), '<span class="pill ' + L.c + '">' + nm(riskScore(r)) + '</span>',
                        esc(r.own), esc(r.resp)];
              })),
            btn('السجل كاملًا','btn-secondary btn-sm',' data-p="risks"'))
        : card('', alertBox('success','لا مخاطرَ حرجةً مفتوحةً الآن.')));
  })();
  }};

/* ── السلامة HSE ── */
var HSE = { hours:0, incidents:[], permits:[], lost:0 };


function hseAdd(){
  var kind = (document.getElementById('hseKind') || {}).value || '';
  var site = (document.getElementById('hseSite') || {}).value || '';
  var lost = cfgN((document.getElementById('hseLost') || {}).value);
  var why  = (document.getElementById('hseWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب الوصف والإجراء')); return; }
  HSE.incidents.unshift({ kind:kind, site:site, lost:lost, why:why,
                          by:STATE.meta.name || '', at:Date.now() });
  HSE.lost += lost;
  CORE.dirty('hse', 'INC-' + HSE.incidents.length, HSE.incidents[0]);
  logEvent('حادث سلامة — ' + kind + (site ? ' · ' + site : ''), site);
  toast(t('سُجّل'));
  render(1);
}

/* ═══ الحادثُ يُصحَّح ويُحذَف ═══
   كان الحادثُ يُسجَّل ولا يُمَسّ: من كتب «يومين مفقودين» وتبيّن أنها ثلاثةٌ
   لم يجد أين يصحّح، ومن سجّل حادثًا بالخطأ أبقاه في سجلٍّ يُعرَض على
   الوزارة. والأيامُ المفقودةُ تدخل مؤشِّراتِ السلامة — فخطأٌ فيها خطأٌ في
   الرقم المعلَن. صار يُعدَّل ويُحذَف، ويُعاد حسابُ المجموع من السجل نفسِه
   لا من عدّادٍ يُزاد ويُنسى. */
function hseRecount(){
  HSE.lost = HSE.incidents.reduce(function(a, x){ return a + cfgN(x.lost); }, 0);
}
function hseSet(i, patch){
  if (!may('approve')){ toast(t('تصحيحُ سجل الحوادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  x.editBy = STATE.meta.name || '';
  x.editAt = Date.now();
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i), x);
  logEvent('تعديل حادث — ' + x.kind + ' \u00b7 ' + Object.keys(patch).join('،'));
}
function hseDel(i){
  if (!may('approve')){ toast(t('حذفُ الحادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  HSE.incidents.splice(i, 1);
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i + 1), null);
  logEvent('حذف حادث — ' + x.kind + ' \u00b7 ' + (x.site || ''));
  toast(t('حُذف الحادث'));
  render(1);
}

/* ── عدم المطابقة NCR ── */
var NCRS = [];


function ncrAdd(){
  if (!may('edit')){ toast(t('فتحُ البلاغ يحتاج صلاحية تعديل')); return; }
  var site = (document.getElementById('ncrSite') || {}).value || '';
  var cat  = (document.getElementById('ncrCat') || {}).value || '';
  var sev  = (document.getElementById('ncrSev') || {}).value || '';
  var why  = (document.getElementById('ncrWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب الوصف')); return; }
  NCRS.push({ site:site, cat:cat, sev:sev, why:why, st:'مفتوح',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ncr', 'NCR-' + NCRS.length, NCRS[NCRS.length-1]);
  logEvent('بلاغ عدم مطابقة — ' + cat + (site ? ' · ' + site : ''), site);
  toast(t('فُتح البلاغ'));
  render(1);
}

function ncrClose(i){
  if (!may('approve')){ toast(t('إغلاقُ البلاغ للمهندس وحده')); return; }
  var x = NCRS[i];
  if (!x) return;
  x.st = 'مغلق'; x.closeBy = STATE.meta.name || ''; x.closeAt = Date.now();
  CORE.dirty('ncr', 'NCR-' + (i+1), x);
  logEvent('إغلاق بلاغ — ' + x.cat);
  toast(t('أُغلق'));
  render(1);
}

/* ── المستخلصات IPC ── */
var IPCS = [];

PAGE.ipc = { m:'القسم المالي', t:'الشؤون المالية',
  l:'المستخلصاتُ ودفترُ المشتريات والميزانيةُ واعتمادُها.',
  body:function(){
    var head = tabHead('ipc'), cur = tabCur('ipc');
    if (cur === 'budget') return head + (function(){
    var B = { cap:cfgGet('budCap'), appAbove:cfgGet('budApp'), spent:buysSpent(), pending:0 };
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('الميزانية سقفٌ يُقاس عليه المنصرف، وحدُّ الاعتماد مبلغٌ فوقه يلزم اعتماد المهندس قبل أن تدخل العملية المنصرفَ المعتمد. صفرٌ في أيٍّ منهما يعني بلا سقفٍ وبلا اعتماد.')) + '</p>'
      + (may('settings') ? card('الضبط',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الميزانية المعتمدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budCap') + '</div>'
          + '<div class="field"><label>' + esc(t('حدّ الاعتماد للعملية الواحدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budApp') + '</div>'
          + '</div>', btn('حفظ','btn-primary btn-sm',' data-cfgok="1"')) : '')
      + stats([['المنصرف المعتمد', N(B.spent)], ['من', N(B.cap), 'acc'],
               ['المتبقي', N(B.cap - B.spent), 'ok'], ['بانتظار الاعتماد', N(B.pending)]])
      + card('', meter('المستهلك من السقف المعتمد', B.spent, B.cap))
      + (trialsTotal()
          ? '<p class="hint" style="margin:6px 0 0">\u{1F9EA} ' + esc(t('مصروفُ التجارب')) + ': <b class="num">' + nm(trialsTotal()) + '</b> '
            + esc(t('ريال')) + ' \u00b7 ' + esc(t(trialInCost() ? 'داخلٌ في المنصرف أعلاه' : 'خارجٌ عن المنصرف أعلاه — يُغيَّر من تبويب «التجارب»')) + '</p>'
          : '')
      + '<p class="hint">' + esc(t('تغييرُ السقف لا يمسّ عمليةً مسجّلة — الوزن يُثبَّت لحظةَ الحدث.')) + '</p>';
  })();
    if (cur === 'buys') return head + (function(){
    var L = buysList();
    var spent = L.filter(function(b){ return b.st === 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var pend  = L.filter(function(b){ return b.st !== 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var cap = cfgGet('budCap') || 0;
    return stats([['إجمالي المنصرف', N(spent)],
                  ['الميزانية', N(cap), 'acc'],
                  ['المتبقي', N(cap - spent), (cap - spent) < 0 ? 'bad' : 'ok'],
                  ['بانتظار الاعتماد', N(pend), pend ? 'wrn' : '']])
      + card('المنصرف من الميزانية', meter('المستهلك من السقف المعتمد', spent, cap))
      + (may('money')
        ? card('تسجيل عملية شراء',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="byItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الفئة')) + '</label><select id="byCat">'
            +   catList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label><select id="bySup">'
            +   supList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
            +   '<input id="byAmt" type="number" min="1" step="1"></div>'
            + '<div class="field"><label>' + esc(t('المشعر')) + '</label><select id="byZone">'
            +   ['منى','عرفات','مزدلفة','—'].map(function(z){ return '<option value="' + esc(z) + '">' + esc(t(z)) + '</option>'; }).join('')
            + '</select></div>'
            /* لأيِّ تجربةٍ هذا الشراء — فيُعرَف مصروفُ كلِّ تجربةٍ على حدة */
            + (trialRows().length
                ? '<div class="field"><label>' + esc(t('لتجربة')) + '</label><select id="byTrial">'
                  + '<option value="">' + esc(t('— ليس لتجربة —')) + '</option>'
                  + trialRows().map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.n) + '</option>'; }).join('')
                  + '</select></div>'
                : '')
            + '</div>'
            + '<div class="actions">' + btn(BUY_ED ? '\u2714 ' + t('احفظ التعديل') : t('سجّل الشراء'),'btn-primary',' data-byadd="1"') + (BUY_ED ? btn(t('إلغاء التعديل'),'btn-quiet',' data-byedcancel="1"') : '') + '</div>'
            + '<p class="hint">' + esc(t('ما تجاوز حدَّ الاعتماد يُسجَّل «بانتظار الاعتماد» ولا يدخل المنصرف.')) + '</p>')
        : '')
      + cardFlush(t('العمليات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة',''],
                capList(L, 200).map(function(b){
                  return ['<span class="num">' + esc(dayKey(b.at)) + '</span>',
                          esc(b.item), esc(b.cat), esc(t(b.zone || '—')), N(b.amt), esc(b.sup),
                          pill(t(b.st), b.st === 'معتمد' ? 'ok' : 'wrn'),
                          buyMayEdit() ? btn('\u270E','btn-quiet btn-sm',' data-byedit="' + esc(b.id) + '" title="' + esc(t('تعديل')) + '"') + btn('\u2715','btn-quiet btn-sm',' data-bydel="' + esc(b.id) + '" title="' + esc(t('حذف')) + '"') : ''];   /* (V29.5) */
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا مشترياتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="buys"') : '');
  })();
    return head + (function(){
    var v = (typeof evm === 'function') ? evm() : null;
    var paid = IPCS.filter(function(x){ return x.st === 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var pend = IPCS.filter(function(x){ return x.st !== 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var earned = v ? v.EV : 0;

    return stats([['المكتسَب حتى اليوم', N(earned), 'acc'],
                  ['قُدّم في مستخلصات', N(paid + pend)],
                  ['صُرف', N(paid), 'ok'],
                  ['لم يُصرف بعد', N(pend), pend ? 'wrn' : '']])

      + card('مستخلص جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الفترة')) + '</label>'
          + '<input id="ipcPer" placeholder="' + esc(t('مثال: الشهر الأول')) + '"></div>'
          + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
          + '<input type="number" id="ipcAmt" min="0" value="'
          + Math.max(0, Math.round(earned - paid - pend)) + '"></div>'
          + '<div class="field"><label>' + esc(t('الاستقطاع ٪')) + '</label>'
          + '<input type="number" id="ipcRet" min="0" max="20" value="5"></div>'
          + '</div>'
          + '<p class="hint" style="margin:0">' + esc(t('المبلغُ المقترحُ هو المكتسَبُ ناقصَ ما قُدّم — فلا يُطالَب بما طُولب به.')) + '</p>',
          btn('📄 أنشئ المستخلص','btn-primary',' data-ipcadd="1"'))

      + (IPCS.length
        ? cardFlush('المستخلصات',
            table(['#','الفترة','المبلغ','استقطاع','الصافي','الحالة',''],
              IPCS.map(function(x, i){
                var ret = Math.round(x.amt * x.retPct / 100);
                return ['<span class="num">IPC-' + nm(i+1) + '</span>', esc(x.period),
                        N(x.amt), N(ret), '<b>' + nm(x.amt - ret) + '</b>',
                        pill(x.st, x.st==='مصروف'?'ok':(x.st==='معتمد'?'acc':'warn')),
                        '<div class="actions">'
                        + (x.st === 'مقدَّم' ? btn('اعتمد','btn-quiet btn-sm',' data-ipcok="' + i + '"') : '')
                        + (x.st === 'معتمد' ? btn('صُرف','btn-quiet btn-sm',' data-ipcpay="' + i + '"') : '')
                        + '</div>'];
              }),
              ['','<b>' + t('الإجمالي') + '</b>',
               N(IPCS.reduce(function(a,x){ return a + x.amt; }, 0)),
               N(IPCS.reduce(function(a,x){ return a + Math.round(x.amt*x.retPct/100); }, 0)),
               '<b>' + nm(IPCS.reduce(function(a,x){ return a + x.amt - Math.round(x.amt*x.retPct/100); }, 0)) + '</b>',
               '','']),
            btn('⬇ إكسل — المستخلصات','btn-secondary btn-sm',' data-xls="ipc"'))
        : card('', alertBox('info','لا مستخلصاتٍ بعد — يُبنى المستخلصُ على المكتسَب المعتمَد.')))

      + card('دورة المستخلص',
          flow(['يُبنى من المكتسَب','يُقدَّم','يُعتمَد','يُصرَف'], 0)
          + '<p class="hint">' + esc(t('الاستقطاعُ يُحتجَز حتى انتهاء الضمان ثم يُفرَج عنه.')) + '</p>');
  })();
  }};

function ipcAdd(){
  var per = (document.getElementById('ipcPer') || {}).value || ('الفترة ' + (IPCS.length + 1));
  var amt = cfgN((document.getElementById('ipcAmt') || {}).value);
  var ret = cfgN((document.getElementById('ipcRet') || {}).value);
  if (amt <= 0){ toast(t('المبلغ صفرٌ أو سالب')); return; }
  IPCS.push({ period:per, amt:amt, retPct:ret, st:'مقدَّم',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ipc', 'IPC-' + IPCS.length, IPCS[IPCS.length-1]);
  logEvent('مستخلص — ' + per + ' · ' + nm(amt));
  toast(t('قُدّم المستخلص'));
  render(1);
}

function ipcStep(i, st){
  var x = IPCS[i];
  if (!x) return;
  x.st = st; x.stBy = STATE.meta.name || ''; x.stAt = Date.now();
  CORE.dirty('ipc', 'IPC-' + (i+1), x);
  logEvent('مستخلص ' + st + ' — ' + x.period);
  toast(t(st));
  render(1);
}

/* ── المعالم والتسليم ── */
var MILES = [
  { id:'M1', n:'اعتماد النطاق وخط الأساس', d:'', w:5,  dep:'' },
  { id:'M2', n:'إتمام مسح عرفات',          d:'', w:20, dep:'M1' },
  { id:'M3', n:'إتمام مسح منى',            d:'', w:25, dep:'M1' },
  { id:'M4', n:'إتمام التهيئة والتجميع',    d:'', w:10, dep:'M2' },
  { id:'M5', n:'إتمام تركيب عرفات',        d:'', w:15, dep:'M4' },
  { id:'M6', n:'إتمام تركيب منى',          d:'', w:20, dep:'M4' },
  { id:'M7', n:'التشغيل التجريبي',         d:'', w:3,  dep:'M6' },
  { id:'M8', n:'التسليم الابتدائي',        d:'', w:2,  dep:'M7' }
];

/* ═══ تواريخُ المعالم ═══
   كانت المعالمُ بلا تواريخَ — وزنٌ وتبعيةٌ ونسبةُ إنجازٍ ولا موعدَ يُقاس
   عليه التأخّر. صار لكلِّ معلَمٍ موعدٌ مستهدَف: يُشتقُّ آليًّا من موعدَي
   انتهاء المسح والتركيب بتوزيع الأوزان على المسار، ويُضبَط باليد ويُحفَظ
   في settings/miles — واليدُ تغلب الاشتقاق. ومنه يُعرَف المتأخّرُ: موعدٌ
   مضى والإنجازُ دون التمام. */
function mileDates(){
  if (!Array.isArray(STATE.mileDates)) STATE.mileDates = [];
  return STATE.mileDates;
}
/* ═══ المعالمُ تُدار لا تُقرأ فقط ═══
   كانت ثمانيةً مكتوبةً في الشيفرة لا تُزاد ولا تُعدَّل ولا تُحذَف — والموعدُ
   وحدَه باليد. صار السجلُّ نفسُه (settings/miles) يحمل لكلِّ معلَمٍ ما عُدِّل:
   اسمًا ووزنًا وتبعيةً وإنجازًا يدويًّا، وإخفاءً لمن أُلغي، ومعالمَ جديدةً
   بمعرِّفاتٍ خاصة. والمضمَّنةُ تبقى أساسًا يُحسَب إنجازُها من الميدان. */
function mileOv(id){ return mileDates().filter(function(x){ return x.id === id; })[0] || {}; }
function mileList(){
  var out = [];
  MILES.forEach(function(m){
    var o = mileOv(m.id); if (o.hidden) return;
    out.push({ id:m.id, n:o.n || m.n, w:(o.w != null ? +o.w : m.w), dep:(o.dep != null ? o.dep : m.dep), builtin:true });
  });
  mileDates().forEach(function(o){ if (o.custom && !o.hidden) out.push({ id:o.id, n:o.n || o.id, w:+o.w || 0, dep:o.dep || '', custom:true }); });
  return out;
}
function mileUpsert(id, patch){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var L = mileDates().slice(), cur = L.filter(function(x){ return x.id === id; })[0];
  if (!cur){ cur = { id:id }; L.push(cur); }
  Object.keys(patch).forEach(function(k){ if (patch[k] === undefined || patch[k] === '') delete cur[k]; else cur[k] = patch[k]; });
  STATE.mileDates = L; CORE.set('cfg', 'miles', L.slice()); CORE.saveSoon();
  logEvent('معلَم — ' + id + ' \u00b7 ' + Object.keys(patch).join(','), id);
  return true;
}
function mileAdd(name, w, d, dep){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  name = String(name || '').trim(); if (!name){ toast(t('اسمُ المعلَم مطلوب')); return false; }
  var id = 'X' + Date.now().toString(36).slice(-5).toUpperCase();
  mileUpsert(id, { custom:true, n:name, w:+w || 0, d:d || '', dep:dep || '', prog:0 });
  toast(t('أُضيف المعلَم') + ' ' + name); MILE_EDIT = ''; render(1); return true;
}
function mileRemove(id){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var o = mileOv(id);
  if (o.custom){ STATE.mileDates = mileDates().filter(function(x){ return x.id !== id; }); CORE.set('cfg', 'miles', STATE.mileDates.slice()); CORE.saveSoon(); }
  else mileUpsert(id, { hidden:true });
  logEvent('حذفُ معلَم — ' + id, id); toast(t('حُذف المعلَم')); MILE_EDIT = ''; render(1); return true;
}
var MILE_EDIT = '', MILE_NEW = false;
function mileDateOf(m){
  var manual = mileDates().filter(function(x){ return x.id === m.id; })[0];
  if (manual && manual.d) return manual.d;
  var dS = cfgGet('dueSurvey'), dI = cfgGet('dueInstall');
  if (!dS && !dI) return '';
  /* المسحُ وما قبله يقيس على موعد المسح، والباقي على موعد التركيب */
  var isSv = /مسح|النطاق/.test(m.n);
  var end = isSv ? (dS || dI) : (dI || dS);
  var start = BASE ? BASE.at : (end - (cfgGet('phase') || 4) * 30 * 86400000);
  var chain = MILES.filter(function(x){ return isSv ? /مسح|النطاق/.test(x.n) : !/مسح|النطاق/.test(x.n); });
  var tot = chain.reduce(function(a, x){ return a + x.w; }, 0) || 1, cum = 0;
  for (var i = 0; i < chain.length; i++){ cum += chain[i].w; if (chain[i].id === m.id) break; }
  var s0 = isSv ? start : ((dS && dS < end) ? dS : start);
  return dayKey(s0 + (end - s0) * (cum / tot));
}
function mileDateSet(id, d){
  if (!may('settings')){ toast(t('مواعيدُ المعالم للمهندس وحده')); return; }
  var L = mileDates().filter(function(x){ return x.id !== id; });
  if (d) L.push({ id:id, d:d });
  STATE.mileDates = L;
  CORE.set('cfg', 'miles', L.slice());
  logEvent('موعد معلَم — ' + id + ' \u00b7 ' + (d || 'أُعيد إلى الاشتقاق'), id);
}
function mileLate(m){
  var d = mileDateOf(m);
  return !!(d && d < dayKey(Date.now()) && mileDone(m) < 0.999);
}
function mileDone(m){
  /* إنجازٌ يدويٌّ كُتب من المكتب يغلب الاشتقاق — وللمعالم الجديدة لا مصدرَ غيرُه */
  var o = mileOv(m.id);
  if (o.prog != null && o.prog !== '') return Math.max(0, Math.min(1, (+o.prog || 0) / 100));
  if (m.custom || o.custom) return 0;
  var S = siteStats();
  var byZone = function(z, type){
    var tot = 0, done = 0;
    STATE.sites.forEach(function(x){
      if (x.zone !== z) return;
      tot++;
      if (type === 'survey' ? STATE.recs[x.id] : insDone(x.id)) done++;
    });
    return tot ? done / tot : 0;
  };
  switch (m.id){
    case 'M1': return BASE ? 1 : 0;
    case 'M2': return byZone('عرفات','survey');
    case 'M3': return byZone('منى','survey');
    case 'M4': return 0;
    case 'M5': return byZone('عرفات','install');
    case 'M6': return byZone('منى','install');
    case 'M7': case 'M8': return 0;
  }
  return 0;
}



/* ── RACI ── */
var RACI_ACTS = [
  ['اعتماد النطاق',            'مدير المشروع','الوزارة','المهندس','الجميع'],
  ['المسح الميداني',           'الفني','المشرف','—','المهندس'],
  ['اعتماد المسح',             'المهندس','مدير المشروع','—','المشرف'],
  ['شراء القطع',               'المشتريات','مدير المشروع','المالية','المخازن'],
  ['التهيئة والتجميع',         'فني الورشة','المهندس','—','العمليات'],
  ['التركيب',                  'فني التركيب','المشرف','المهندس','العمليات'],
  ['التدقيق والاعتماد',        'المهندس','مدير المشروع','الجودة','الفني'],
  ['بلاغ عدم المطابقة',        'الجودة','المهندس','—','المنفِّذ'],
  ['المستخلص',                 'المالية','مدير المشروع','الوزارة','الإدارة العليا'],
  ['التسليم الابتدائي',        'مدير المشروع','الوزارة','الهندسة والجودة','الجميع'],
  ['الفك وإرجاع العُهدة',      'فني الفك','المشرف','المخازن','المهندس']
];


/* ── سجل الدروس ── */
var LESSONS = [
  { p:'التخطيط', w:'قسمةُ التارجت على الأيام تُظهر الحاجةَ للفرق مبكرًا',
    a:'حُسبت الطواقمُ قبل بدء الموسم لا بعده' },
  { p:'التنفيذ', w:'الصورُ الخامُ تخنق الشبكةَ في المشاعر',
    a:'ضُغطت على الجهاز قبل الرفع' },
  { p:'التنفيذ', w:'الشبكةُ تنقطع فيضيع عملُ الفني',
    a:'حفظٌ محليٌّ أولًا وطابورُ رفعٍ يُستأنف' },
  { p:'الجودة', w:'احتسابُ النقاط قبل التدقيق يُغري بالتسرّع',
    a:'لا نقاطَ إلا بعد اعتماد المهندس' },
  { p:'التواصل', w:'الوصولُ للمخيمات يتعطّل بلا إشعارٍ مسبق',
    a:'رسالةٌ جاهزةٌ للشركة قبل الموعد' }
];


/* ═══ مركزُ التقارير ودليلُ العمليات ═══
   كلُّ ما يحتاجه مديرُ المشروع: تقريرٌ لكلِّ جهةٍ بدوريّته ومحتواه،
   وعمليةٌ موثّقةٌ لكلِّ ما يجري — خطوةً خطوة. */

var REPORTS = [
  /* ── للإدارة العليا في الشركة ── */
  { id:'r-exec-w', n:'الموقف التنفيذي', to:'الإدارة العليا', side:'co', per:'أسبوعي',
    i:'\u{1F3AF}', sheets:['evm','risks','over'],
    what:'أين المشروع من خطّه، وما يحتاج قرارًا',
    when:'الأحد ٠٧:٠٠', how:'PDF من اللوحة التنفيذية + إكسل بثلاث أوراق' },
  { id:'r-fin-m', n:'الموقف المالي', to:'المالية', side:'co', per:'شهري',
    i:'\u{1F4B0}', sheets:['ipc','budm','buys','score'],
    what:'المستخلصاتُ والمنصرفُ ومستحقُّ الفنيين',
    when:'الأوّل من الشهر', how:'إكسل بأربع أوراق' },
  { id:'r-hr-m', n:'أداء الفرق والمستحقّات', to:'الموارد البشرية', side:'co', per:'شهري',
    i:'\u{1F465}', sheets:['score','stages'],
    what:'ما أنجزه كلُّ فنيٍّ ونقاطُه ومستحقُّه وإضافيُّه',
    when:'الأوّل من الشهر', how:'إكسل بورقتين' },
  { id:'r-proc-w', n:'المخزون والمشتريات', to:'المشتريات', side:'co', per:'أسبوعي',
    i:'\u{1F4E6}', sheets:['invb','invmv','buys','wos'],
    what:'الأرصدةُ والحركةُ والطلباتُ المفتوحة',
    when:'الخميس ١٦:٠٠', how:'إكسل بأربع أوراق' },
  { id:'r-hse-m', n:'تقرير السلامة', to:'السلامة', side:'co', per:'شهري',
    i:'\u26D1', sheets:['hse'],
    what:'الحوادثُ ومعدّلُ التكرار وأيامُ العمل الآمنة',
    when:'الأوّل من الشهر', how:'إكسل + ملخّصٌ مكتوب' },
  { id:'r-qa-w', n:'الجودة وعدم المطابقة', to:'الجودة', side:'co', per:'أسبوعي',
    i:'\u2713', sheets:['ncr','qa'],
    what:'البلاغاتُ المفتوحةُ وأعمارُها والإجراءُ التصحيحي',
    when:'الاثنين ٠٩:٠٠', how:'إكسل بورقتين' },
  { id:'r-ops-d', n:'إنجاز اليوم', to:'العمليات', side:'co', per:'يومي',
    i:'\u{1F527}', sheets:['tasks','sites'],
    what:'ما أُنجز اليومَ وما تعذّر ولماذا',
    when:'يوميًّا ١٧:٠٠', how:'إكسل بورقتين + إشعارٌ للمشرفين' },

  /* ── للوزارة ── */
  { id:'r-moh-w', n:'تقرير التقدّم', to:'إدارة المشاريع', side:'cl', per:'أسبوعي',
    i:'\u{1F4C8}', sheets:['over','work','miles'],
    what:'الإنجازُ بالمشعر والنوع، والمعالمُ وأوزانُها',
    when:'الأحد ٠٩:٠٠', how:'PDF + إكسل بثلاث أوراق' },
  { id:'r-moh-ipc', n:'المستخلص المعتمَد', to:'الإدارة المالية', side:'cl', per:'شهري',
    i:'\u{1F4B3}', sheets:['ipc','budm'],
    what:'ما أُنجز واعتُمد، ومبلغُه واستقطاعُه',
    when:'مع نهاية الشهر', how:'إكسل بورقتين + مرفقات الاعتماد' },
  { id:'r-moh-tec', n:'المطابقة الفنية', to:'الإدارة الفنية', side:'cl', per:'أسبوعي',
    i:'\u2699', sheets:['ncr','sites'],
    what:'المطابقةُ للمواصفة، والبلاغاتُ وحالتُها',
    when:'الاثنين ١٠:٠٠', how:'إكسل بورقتين' },
  { id:'r-moh-hand', n:'جاهزية التسليم', to:'إدارة التشغيل', side:'cl', per:'عند الطلب',
    i:'\u{1F504}', sheets:['sites','ncr'],
    what:'ما استوفى شروطَ التسليم وما يمنعه',
    when:'عند بلوغ المعلَم', how:'إكسل + محضرُ تسليم' },
  { id:'r-moh-aud', n:'حزمة المراجعة', to:'المراجعة الداخلية', side:'cl', per:'ربع سنوي',
    i:'\u{1F50E}', sheets:['ev','score','raci','less','risks'],
    what:'الأثرُ والسجلّاتُ والمسؤولياتُ والدروس',
    when:'نهاية الربع', how:'حزمةٌ كاملةٌ بخمس أوراق' },
  { id:'r-moh-exec', n:'الملخّص للإدارة العليا', to:'الإدارة العليا', side:'cl', per:'شهري',
    i:'\u{1F3AF}', sheets:['over','miles','budm'],
    what:'التقدّمُ والمعالمُ والصرفُ في صفحةٍ واحدة',
    when:'الأوّل من الشهر', how:'PDF صفحةٌ واحدة' }
];

var REP_SIDE = 'co';
/* شرائحُ مركز التقارير: الشركةُ والوزارةُ والدوريات — الثالثةُ كانت صفحةً
   مستقلةً «التقارير الدورية» في مجموعة الفرق تضبط متى يُرسَل ما يُعرَض هنا. */
function repChips(){
  var co = REPORTS.filter(function(r){ return r.side==='co'; }).length;
  var cl = REPORTS.filter(function(r){ return r.side==='cl'; }).length;
  return [['co','\u{1F3E2} ' + t('تقارير الشركة'), co],
          ['cl','\u{1F54B} ' + t('تقارير الوزارة'), cl],
          ['sched','\u23F0 ' + t('الدوريات'), PERIODS.length]].map(function(c){
    return '<button type="button" class="chip' + (REP_SIDE===c[0]?' on':'') + '" data-repside="' + c[0] + '">'
      + esc(c[1]) + ' <span class="num">' + nm(c[2]) + '</span></button>';
  }).join('');
}


function repGen(id){
  var r = REPORTS.filter(function(x){ return x.id === id; })[0];
  if (!r){ toast(t('تقريرٌ غير معرَّف')); return; }
  var keys = r.sheets.filter(function(s){ return SHEETS[s]; });
  if (!keys.length){ toast(t('لا أوراقَ لهذا التقرير')); return; }
  toast(t('يُجهَّز') + ' ' + t(r.n) + '…');
  logEvent('توليد تقرير — ' + r.n + ' → ' + r.to);
  xlsExport(keys, 'نسك-' + r.id + '-' + dayKey() + '.xlsx');
}

function repPack(side){
  var keys = {};
  REPORTS.filter(function(r){ return r.side === side; })
         .forEach(function(r){ r.sheets.forEach(function(s){ if (SHEETS[s]) keys[s] = 1; }); });
  var list = Object.keys(keys);
  if (!list.length){ toast(t('لا أوراق')); return; }
  toast(nm(list.length) + ' ' + t('ورقةً تُجهَّز') + '…');
  logEvent('حزمة تقارير — ' + (side === 'co' ? 'الشركة' : 'الوزارة') + ' · ' + nm(list.length) + ' ورقة');
  xlsExport(list, 'نسك-حزمة-' + (side === 'co' ? 'الشركة' : 'الوزارة') + '-'
    + dayKey() + '.xlsx');
}

/* ═══ دليل العمليات — كلُّ دورةٍ خطوةً خطوة ═══ */
var SOPS = [
  { id:'sop-survey', n:'دورة المسح الميداني', i:'\u{1F50D}', own:'المشرف والفني',
    trig:'إسنادُ زيارةٍ لفنيٍّ من طلبات الزيارة',
    steps:[
      ['المشرف','يُحدِّد النقاطَ من الخريطة أو القائمة ويُسندها لفنيٍّ بموعد','طلبات الزيارة'],
      ['الفني','يرى المهمّةَ في «مهامي» ويتوجّه بالأقرب أولًا','مهامي'],
      ['الفني','يفتح نموذج المسح فيرى المعلومَ ويجمع المجهول','نموذج المسح'],
      ['الفني','يلتقط صورةَ الموقع وصورةَ نقطة التركيب — إلزامٌ لا يُتجاوَز','نموذج المسح'],
      ['النظام','يضغط الصورَ على الجهاز ويحفظ محليًّا ثم يرفع','—'],
      ['المهندس','يراجع ما جُمع فيعتمده أو يردّه بسبب','التدقيق الهندسي'],
      ['النظام','يحتسب نقاطَ الزيارة للفني بوزنها من الإعدادات','أدائي']
    ],
    rules:['لا حفظَ بلا صورتين','الموقعُ المعدَّلُ يُوثَّق بأصله ومسافةِ نقلته',
           'لا تُحتسب النقاطُ قبل الاعتماد'] },

  { id:'sop-install', n:'دورة التركيب', i:'\u{1F527}', own:'فني التركيب والمهندس',
    trig:'اكتمالُ مسح النقطة وظهورُها في طبقة التركيب',
    steps:[
      ['المشرف','يُسند تركيبًا من طبقة التركيب — ولا تظهر فيها إلا الممسوحة','الطبقات الثلاث'],
      ['فني الورشة','يُهيّئ الجهازَ ويجمّعه ويسجّل الحركةَ في الدفتر','الورشة'],
      ['فني التركيب','يركّب في الموقع ويصوّر قبلَ وبعدَ ولوحةَ الأجهزة','نموذج التركيب'],
      ['فني التركيب','يسجّل القطعَ المستهلكةَ وسيرياتِها وبادئةَ الشبكة','نموذج التركيب'],
      ['النظام','يشتقّ العناوين ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا','—'],
      ['النظام','يُدخل المستهلكَ دفترَ الحركة فورًا','دفتر الحركة'],
      ['المهندس','يدقّق الصورَ والسيرياتِ فيعتمد أو يردّ','التدقيق الهندسي'],
      ['النظام','يحوّل حالةَ الموقع ويحتسب النقاطَ ويفتح طبقةَ الفك','—']
    ],
    rules:['لا تركيبَ قبل مسح','لا حفظَ بلا صورتَي قبلَ وبعد','لا نقاطَ قبل الاعتماد',
           'المخزونُ يُخصَم مرةً واحدةً لا مرتين'] },

  { id:'sop-dis', n:'دورة الفك وإرجاع العُهدة', i:'\u{1F9E9}', own:'فني الفك والمخازن',
    trig:'انتهاءُ الموسم وظهورُ المركَّب في طبقة الفك',
    steps:[
      ['المشرف','يجدول الفكَّ للنقاط المركَّبة المعتمدة','الفك وإرجاع العُهدة'],
      ['الفني','يفكّ ويصنّف الحالة: سليمٌ أو تالف','الفك'],
      ['النظام','يُرجع القطعَ لدفتر الحركة بحالتها','دفتر الحركة'],
      ['النظام','يحتسب نقاطَ الفك بوزنها في معامل الحالة','أدائي'],
      ['المخازن','يستلم السليمَ للمخزن ويعزل التالفَ ويوثّقه','أرصدة المخزون']
    ],
    rules:['لا فكَّ لما لم يُركَّب ويُعتمَد','التالفُ أثقلُ فكًّا فمعاملُه أعلى',
           'العُهدةُ لا تُغلَق حتى تُستلَم'] },

  { id:'sop-assign', n:'دورة الإسناد', i:'\u{1F4CB}', own:'المشرف',
    trig:'وجودُ نقاطٍ جاهزةٍ في طبقةٍ وفنيٍّ متاح',
    steps:[
      ['المشرف','يختار الطبقةَ — فلا يُسند تركيبًا لما لم يُمسح','الطبقات الثلاث'],
      ['المشرف','يحدّد من القائمة بالفئة أو من الخريطة بالضغط','طلبات الزيارة / الخريطة'],
      ['النظام','يعرض وزنَ ما حُدِّد بالنقاط قبل الإسناد','لوح الإسناد'],
      ['المشرف','يختار الفنيَّ فيرى ما لديه، فيزيد أو ينقص','لوح الإسناد'],
      ['النظام','يوفّق: ما زِيد يُنشأ وما نُقص يُلغى','—'],
      ['الفني','يرى الجديدَ في «مهامي» وخريطتِه','مهامي']
    ],
    rules:['المُسنَدُ لغيره لا يُحدَّد','تبديلُ الطبقة يُفرغ التحديد',
           'الإسنادُ تراكميٌّ لا يُعاد من الصفر'] },

  { id:'sop-ncr', n:'دورة عدم المطابقة', i:'\u2713', own:'الجودة والمهندس',
    trig:'رصدُ مخالفةٍ للمواصفة في تدقيقٍ أو زيارة',
    steps:[
      ['الجودة','تفتح بلاغًا بفئته وخطورته ووصفه','عدم المطابقة'],
      ['المهندس','يُقيّم ويحدّد الإجراءَ التصحيحي','عدم المطابقة'],
      ['المنفِّذ','ينفّذ التصحيحَ ويوثّقه','نموذج التركيب'],
      ['الجودة','تتحقّق — بمن لم يرتكب','عدم المطابقة'],
      ['الجودة','تُغلق البلاغَ باسمها وتاريخها','عدم المطابقة']
    ],
    rules:['لا تُسلَّم نقطةٌ عليها بلاغٌ جوهريٌّ مفتوح','التحقّقُ بغير المنفِّذ',
           'الإغلاقُ يُوثَّق بمن أغلق'] },

  { id:'sop-ipc', n:'دورة المستخلص', i:'\u{1F4B0}', own:'المالية ومدير المشروع',
    trig:'انقضاءُ فترةِ المستخلص أو بلوغُ معلَم',
    steps:[
      ['النظام','يحسب المكتسَبَ من المعتمَد وحده','القيمة المكتسبة'],
      ['المالية','تُنشئ المستخلصَ بالمقترح — المكتسَبُ ناقصَ ما قُدّم','المستخلصات'],
      ['مدير المشروع','يراجع ويقدّم للعميل','المستخلصات'],
      ['الوزارة','تعتمد أو تُعيد بملاحظات','المستخلصات'],
      ['المالية','تسجّل الصرفَ وتحتجز الاستقطاع','المستخلصات']
    ],
    rules:['لا مستخلصَ إلا من مكتسَبٍ معتمَد','لا يُطالَب بما طُولب به',
           'الاستقطاعُ يُفرَج عنه بانتهاء الضمان'] },

  { id:'sop-chg', n:'دورة التغيير', i:'\u{1F504}', own:'مدير المشروع',
    trig:'طلبُ تغييرٍ في نطاقٍ أو جدولٍ أو ميزانية',
    steps:[
      ['طالبُه','يقدّم الطلبَ بنوعه وأثره ومبرّره','ضبط التغيير'],
      ['مدير المشروع','يُقيّم الأثرَ على خط الأساس','ضبط التغيير'],
      ['الوزارة','تعتمد أو ترفض إن مسّ نطاقًا أو مبلغًا','ضبط التغيير'],
      ['مدير المشروع','يُجمّد نسخةً جديدةً من خط الأساس','القيمة المكتسبة'],
      ['النظام','يقيس الأداءَ على المرجع الجديد','القيمة المكتسبة']
    ],
    rules:['لا يُمسّ خطُّ الأساس إلا باعتماد','كلُّ اعتمادٍ يُلزم بتجميدٍ جديد',
           'القياسُ على مرجعٍ قديمٍ باطل'] },

  { id:'sop-hse', n:'دورة الحادث', i:'\u26D1', own:'السلامة',
    trig:'وقوعُ حادثٍ أو وشيكٍ في الموقع',
    steps:[
      ['من رآه','يبلّغ فورًا ويؤمّن الموقع','السلامة'],
      ['السلامة','تسجّل النوعَ والموقعَ وأيامَ العمل المفقودة','السلامة'],
      ['السلامة','تحقّق في السبب الجذري','—'],
      ['السلامة','تضع إجراءً وقائيًّا ويُعمَّم','سجل الدروس'],
      ['النظام','يحدّث معدّلَ التكرار','السلامة']
    ],
    rules:['الوشيكُ يُسجَّل كالحادث','التبليغُ قبل الإصلاح','السببُ الجذريُّ لا العَرَض'] }
];

var SOP_CUR = 'sop-survey';

PAGE.guide = { m:'المساعدة', t:'الأدلة',
  l:'دليلُك أنت بما تملكه من شاشات، ودليلُ العمليات خطوةً خطوة.',
  body:function(){
    var head = tabHead('guide'), cur = tabCur('guide');
    if (cur === 'wf') return head + wfBody();
    if (cur === 'guide') return head + (function(){
    var r = R();
    /* المهندسُ يقرأ دليلَ أيِّ دورٍ ليعرف ما يراه فريقُه؛ وغيرُه يقرأ دليلَه */
    var pick = may('roles') || may('users');
    var cur = (pick && GUIDE_ROLE && ROLES[GUIDE_ROLE]) ? GUIDE_ROLE : ROLE;

    return (pick
      ? '<div class="chips">' + Object.keys(ROLES).map(function(k){
          return '<button type="button" class="chip' + (cur === k ? ' on' : '')
            + '" data-grole="' + k + '">' + esc(t(ROLES[k].n)) + '</button>';
        }).join('') + '</div>'
      : '')

      + roleGuide(cur)

      /* الملفُّ المُنزَّلُ كان واحدًا للجميع — فتقرأ الوزارةُ عن اعتماداتٍ لا
       تملكها. صار لكلِّ دورٍ ملفُّه، مُولَّدًا من الصلاحيات نفسِها التي
       تُولِّد هذه الصفحة. */
    + card('دليلُك — ملف Word',
          '<div class="actions">'
          + '<a class="btn btn-primary btn-sm" href="docs/manuals/nusuk-manual-' + esc(cur) + '.docx" download>'
          +   '⬇ ' + esc(t('دليل') + ' ' + t(ROLES[cur].n) + ' — Word') + '</a>'
          + (may('settings')
              ? '<a class="btn btn-secondary btn-sm" href="docs/nusuk-user-manual.docx" download>'
                + '⬇ ' + esc(t('الدليل الكامل — Word')) + '</a>'
              : '')
          + '</div>'
          + '<p class="hint" style="margin:9px 0 0">'
          + esc(t('ما فوق يُشتقُّ من صلاحيات الدور لحظةَ فتحه — فمن غيّر صلاحيةً غيّر الدليلَ معها.'))
          + '</p>')

      + (may('settings')
          ? card('مراجع النظام',
              /* روابطُ فعليةٌ لملفاتٍ موجودة — لا أزرارُ توليدٍ وهمية.
                 ودليلُ النظام يحمل رقمَ نسخته في اسمه: من فتحه يعرف أيَّ
                 نسخةٍ يقرأ. */
              '<div class="actions">'
              /* اسمُ الملف من نسخة الرأس لا مكتوبًا بيد (V17.60): كان رقمًا حرفيًّا
                 يشيخ مع أوّل إصدارٍ فيُنزِّل ملفًا لا وجودَ له — وهو ما أمسكه جردُ
                 التصفير حين تبدّلت النسخة */
              + '<a class="btn btn-secondary btn-sm" href="docs/nusuk-system-'
              +   esc(appVer()) + '.docx" download>⬇ '
              +   esc(t('دليل النظام — Word')) + '</a>'
              + '<a class="btn btn-secondary btn-sm" href="docs/nusuk-tech-spec.docx" download>⬇ '
              +   esc(t('المواصفة التقنية')) + '</a>'
              + '</div>')
          : '')
      + '<p class="hint">'+esc(t('كل دليل يُولَّد برقم النسخة نفسه — فلا يقرأ أحدٌ دليلًا لنسخةٍ غير التي بين يديه.'))+'</p>';
  })();
    return head + (function(){
    var s = SOPS.filter(function(x){ return x.id === SOP_CUR; })[0] || SOPS[0];
    return '<div class="chips">' + SOPS.map(function(x){
        return '<button type="button" class="chip' + (SOP_CUR===x.id?' on':'') + '" data-sop="' + esc(x.id) + '">'
          + x.i + ' ' + esc(t(x.n)) + '</button>';
      }).join('') + '</div>'

      + card(s.i + ' ' + t(s.n),
          '<div class="pop-rows" style="margin:0">'
          + '<div><span class="k">' + esc(t('من يملكها')) + '</span><span>' + esc(t(s.own)) + '</span></div>'
          + '<div><span class="k">' + esc(t('ما يبدؤها')) + '</span><span>' + esc(t(s.trig)) + '</span></div>'
          + '<div><span class="k">' + esc(t('خطواتها')) + '</span><span>' + N(s.steps.length) + '</span></div>'
          + '</div>')

      + cardFlush('الخطوات',
          table(['#','من','ما يفعل','أين'],
            s.steps.map(function(st, i){
              return ['<span class="num">' + nm(i+1) + '</span>',
                      '<span class="pill acc">' + esc(t(st[0])) + '</span>',
                      esc(t(st[1])),
                      st[2] === '—' ? '<span class="hint" style="margin:0">' + esc(t('تلقائي')) + '</span>'
                                    : '<span class="hint" style="margin:0">' + esc(t(st[2])) + '</span>'];
            })))

      + card('القواعد التي لا تُخرَق',
          '<div class="list">' + s.rules.map(function(r){
            return '<div class="list-item"><div class="li-main">'
              + '<div class="li-t">\u26A0 ' + esc(t(r)) + '</div></div></div>';
          }).join('') + '</div>')

      + card('التدفّق',
          flow(s.steps.map(function(st){ return st[0]; }), 0)
          + '<p class="hint">' + esc(t('هذا الدليلُ مرجعُ التدريب والمراجعة — ويُصدَّر مع وثائق المشروع.')) + '</p>',
          btn('⬇ إكسل — دليل العمليات','btn-secondary btn-sm',' data-xls="sop"'));
  })();
  }};

/* ═══ «ما هذه الصفحة؟» — شرحٌ لكلِّ شاشة ═══
   لكلِّ صفحةٍ أربعةُ أسئلة: ماذا تفعل؟ ومن أين تقرأ؟ وعلامَ تُبنى؟
   ومتى تُعدُّ مكتملة؟ فمن دخل النظامَ أولَ مرةٍ عرف موضعَه منه. */

var HELP_OPEN = false;

var HELP = {
  map: { w:'الخريطةُ هي مدخلُ الميدان: ترى النقاطَ بمواضعها وأشكالها وألوانها، وتُسند منها العملَ وتفتح تفاصيلَ أيِّ نقطة.',
    f:'من بيانات المواقع الألفِ وسبعمئةٍ وسبعٍ وثمانين، ومن سجلَّي المسح والتركيب لتلوينها.',
    o:'على الطبقة المختارة: المسحُ يرى الكلَّ، والتركيبُ ما مُسح، والفكُّ ما رُكِّب.',
    d:'حين تُصبح كلُّ النقاط خضراءَ في طبقة التركيب — أي رُكِّبت واعتُمدت.' },

  sites: { w:'قائمةُ المواقع كلِّها بتصنيفاتها — تُرشَّح وتُبحَث ويُفتَح منها أيُّ موقعٍ على تفاصيله.',
    f:'من قاعدة المواقع، ومن موضعك إن أُذن به لترتيبها بالأقرب.',
    o:'على التصنيف: أربعةُ مشاعرَ وسبعةُ أنواعٍ وخمسةُ أوجهِ عمل.',
    d:'ليست شاشةَ إنجاز — هي مرجعٌ دائم.' },

  site: { w:'كلُّ ما يُعرَف عن نقطةٍ واحدة: بياناتُها وموقعُها ومسحُها وتركيبُها ودورتُها.',
    f:'من قاعدة المواقع، ومن سجلَّي المسح والتركيب إن وُجدا.',
    o:'على المعرّف — لكلِّ نقطةٍ صفحتُها.',
    d:'حين تكتمل دورتُها: مُسحت ورُكِّبت واعتُمدت.' },

  svForm: { w:'نموذجُ المسح الميداني: يُراجَع المعلومُ ويُجمَع المجهول.',
    f:'المعلومُ من القاعدة، والمجهولُ من الفنيِّ في الموقع.',
    o:'على إسنادِ زيارةٍ للفني — ولا يُوسَم موقعٌ بلا إسناد.',
    d:'حين تُحفَظ الصورتان والحقولُ فيدخل الموقعُ سجلَّ المسح.' },

  insForm: { w:'نموذجُ التركيب: يُوثَّق ما رُكِّب بقطعه وسيرياته وصوره وعناوينه.',
    f:'من كتالوج القطع لمنطقة الموقع، ومن الفنيِّ في الموقع.',
    o:'على أن يكون الموقعُ مُسِح — فلا تركيبَ قبل مسح.',
    d:'حين يُحفَظ ويعتمده المهندسُ في التدقيق، فتُحتسب نقاطُه.' },

  req: { w:'طلباتُ الزيارة: تُنشَأ وتُسنَد وتُتابَع حتى تُعتمَد.',
    f:'من المهامِّ المسجّلة، ومن قائمة الفنيين والفرق.',
    o:'على الطبقة: زيارةٌ لفنيٍّ، وتركيبٌ وفكٌّ لفريقٍ يُوزَّع عليه.',
    d:'حين لا يبقى طلبٌ في حالة «مطلوب» أو «قيد التنفيذ».' },

  qa: { w:'التدقيقُ الهندسي: ما رُكِّب ينتظر هنا قرارَ المهندس — يُعتمَد أو يُردّ.',
    f:'من سجل التركيب: ما حالتُه «مُركّب» ولم يُعتمَد بعد.',
    o:'على قاعدةٍ واحدة: لا تُحتسب نقاطُ تركيبٍ قبل اعتماده.',
    d:'حين تخلو قائمةُ الانتظار — كلُّ تركيبٍ إمّا اعتُمد أو رُدّ.' },

  layers: { w:'الطبقاتُ الثلاث في مكانٍ واحد: ما تُظهره كلٌّ وما تُسنده ونقاطُها.',
    f:'من إحصاء كلِّ طبقةٍ ومن أوزان الإعدادات.',
    o:'على ترتيب الدورة: مسحٌ ثم تركيبٌ ثم فك.',
    d:'حين تبلغ الطبقاتُ الثلاثُ تمامَها.' },

  disp2: { w:'الفكُّ وإرجاعُ العُهدة: ما رُكِّب يُجدوَل ويُفكّ وتُرجَع قطعُه بحالتها.',
    f:'من سجل التركيب المعتمَد، ومن معاملَي السليم والتالف في الإعدادات.',
    o:'على أن تكون النقطةُ رُكِّبت واعتُمدت.',
    d:'حين تُفكّ كلُّ نقطةٍ وتُستلَم عُهدتُها.' },

  teams: { w:'الفرقُ وأنصبتُها: من في كلِّ فريق، وبأيِّ نسبةٍ يُقسَّم إنجازُه.',
    f:'من قائمة الفنيين، ومن نقاطهم المحسوبة.',
    o:'على أن مجموعَ النسب مئةٌ بالضبط — وإلا ضاع نصيبٌ أو تكرّر.',
    d:'حين يكون لكلِّ فريقٍ أعضاؤه ونسبُهم مئة.' },

  myscore: { w:'أداؤك: ما عملتَه ونقاطُه ومستحقُّك وترتيبُك بين أهل مرحلتك.',
    f:'من كلِّ ما سجّلتَه: مسحٌ وتركيبٌ وفكٌّ وتهيئةٌ وتجميع.',
    o:'على أوزان الإعدادات — والتركيبُ لا يُحتسب قبل اعتماده.',
    d:'ليست شاشةَ إنجاز — تتغيّر مع كلِّ عملٍ تعمله.' },

  perf: { w:'الأداءُ على خمسة مستويات: الترتيبُ العام، وبالمرحلة (لكلِّ مرحلةٍ فريقُها وتارجتها)، وبالوظيفة، وبالفريق، وللمشروع كله.',
    f:'من نقاط الفنيين — مسحًا وتركيبًا وفكًّا وتهيئةً وتجميعًا — مجموعةً بأربع عدساتٍ فوق نفس الرقم.',
    o:'على أوزان الإعدادات، وتارجت كلِّ مرحلة، وسعر النقطة ومعامل الإضافي.',
    d:'حين تبلغ كلُّ مرحلةٍ تارجتَها؛ ويُصدَّر شهريًّا للموارد البشرية والمالية.' },

  evm: { w:'خطُّ الأساس والقيمةُ المكتسبة: أين المشروعُ من خطّه المُجمَّد.',
    f:'من خط الأساس المُجمَّد، ومن المنجَز المعتمَد، ومن المنصرف الفعلي.',
    o:'على تجميد خط أساسٍ أولًا — ولا يُقاس شيءٌ بلا مرجع.',
    d:'حين تبلغ القيمةُ المكتسبةُ الميزانيةَ الكلية.' },

  risks: { w:'سجلُّ المخاطر: ما قد يقع واحتمالُه وأثرُه ومن يملك الردَّ عليه.',
    f:'من تسجيلٍ يدويٍّ يُراجَع دوريًّا.',
    o:'على درجةٍ حاصلِ ضربِ الاحتمال في الأثر.',
    d:'لا يخلو أبدًا — يُراجَع ويُحدَّث حتى إغلاق المشروع.' },

  chg: { w:'ضبطُ التغيير: لا يُمسّ خطُّ الأساس إلا بطلبٍ يُوثَّق ويُعتمَد.',
    f:'من طلبات تُقدَّم وتُقيَّم.',
    o:'على أن كلَّ اعتمادٍ يُلزم بتجميد خط أساسٍ جديد.',
    d:'حين لا يبقى طلبٌ بانتظار القرار.' },

  ipc: { w:'المستخلصات: ما أُنجز واعتُمد يُقدَّم للعميل ويُتابَع صرفُه.',
    f:'من القيمة المكتسبة — لا من التقدير.',
    o:'على أن المقترحَ هو المكتسَبُ ناقصَ ما قُدّم.',
    d:'حين يُصرَف آخرُ مستخلصٍ ويُفرَج عن الاستقطاع.' },

  ncr: { w:'عدمُ المطابقة: ما خالف المواصفةَ وإجراؤه التصحيحي حتى الإغلاق.',
    f:'من رصدٍ في تدقيقٍ أو زيارة.',
    o:'على أن التحقّق بغير من ارتكب.',
    d:'حين تُغلَق كلُّ البلاغات — ولا تُسلَّم نقطةٌ عليها بلاغٌ جوهري.' },

  hse: { w:'السلامةُ والحوادث: ساعاتُ العمل والحوادثُ ومعدّلُ التكرار.',
    f:'من أيام عمل الفنيين، ومن تسجيل الحوادث.',
    o:'على التعريف الدولي: حوادثُ لكلِّ مئتَي ألف ساعة.',
    d:'الصفرُ هو الهدف — ولا يُقفَل السجلُّ أبدًا.' },

  invb: { w:'أرصدةُ المخزون: ما في المخزن وما في العُهدة وما رُكّب وما تلف.',
    f:'من دفتر الحركة — كلُّ حركةٍ تُغيّره.',
    o:'على أن المستهلكَ يُخصَم مرةً واحدةً عند التركيب.',
    d:'حين تُرجَع كلُّ العُهدة بعد الفك.' },

  buys: { w:'دفترُ المشتريات: مصروفاتُ السوق بفواتيرها ومورّديها.',
    f:'من تسجيلٍ يدويٍّ للمشتريات.',
    o:'على سقف الميزانية وحدِّ الاعتماد.',
    d:'حين ينتهي الصرفُ ضمن السقف.' },

  budget: { w:'الميزانيةُ والاعتماد: السقفُ والمنصرفُ وما يحتاج توقيعًا.',
    f:'من المشتريات ومستحقّ الفنيين.',
    o:'على سقفٍ يُضبَط في الإعدادات.',
    d:'حين يُقفَل المشروعُ ضمن سقفه.' },

  cover: { w:'خريطةُ التغطية: كلُّ قسمٍ في الشركة وكلُّ إدارةٍ عند العميل وما يخصّه.',
    f:'من مقارنة ما تحتاجه كلُّ جهةٍ بما بُني لها.',
    o:'على أن لكلِّ جهةٍ ما يخصّها — لا ترى ما ليس لها.',
    d:'حين تكون كلُّ جهةٍ مغطّاةً كاملًا.' },

  sop: { w:'دليلُ العمليات: كلُّ دورةٍ خطوةً خطوة، ومن ينفّذها وأين وبأيِّ قاعدة.',
    f:'من توثيق ما بُني في النظام.',
    o:'على ثماني دوراتٍ بقواعدها التي لا تُخرَق.',
    d:'مرجعٌ دائمٌ للتدريب والمراجعة.' },

  repcenter: { w:'مركزُ التقارير: كلُّ تقريرٍ بمن يستقبله ودوريّته — يُولَّد بضغطة.',
    f:'من أوراق التصدير السبع والعشرين.',
    o:'على ثلاثةَ عشرَ تقريرًا: سبعةٌ للشركة وستةٌ للوزارة.',
    d:'يُستخدَم دوريًّا — لا يكتمل.' },

  exp: { w:'التصديرُ والاستيراد: أوراقُ إكسل وملفاتُ KMZ، وقوالبُ تُملأ وتُرفَع.',
    f:'من كلِّ بيانات النظام.',
    o:'على أن الاستيرادَ يُعايَن قبل أن يُكتب.',
    d:'أداةٌ دائمة.' },

  drive: { w:'تخزينُ الصور: الصورُ في درايفك لا في قاعدة البيانات.',
    f:'من صور الميدان بعد ضغطها على الجهاز.',
    o:'على وصل درايفك بـClient ID.',
    d:'حين تُرفَع كلُّ صورةٍ ويخلو الطابور.' },

  probe: { w:'أداةُ الفحص: تُطلَب صفحةُ الجهاز فيُعرَف أحيٌّ هو أم صامت.',
    f:'من العناوين المشتقّة من بادئة الشبكة عند التركيب.',
    o:'على أن الردَّ بخطأٍ دليلُ حياة — الصمتُ وحده موت.',
    d:'حين تستجيب كلُّ الأجهزة.' }
};

/* ما لم يُكتَب له شرحٌ يُوصَف بموضعه في القائمة */
function helpOf(id){
  if (HELP[id]) return HELP[id];
  var p = pageMeta(id);
  if (!p) return null;
  return {
    w: p.l || ('شاشةُ ' + t(p.t) + ' ضمن ' + t(p.m) + '.'),
    f: 'من بيانات النظام المسجّلة.',
    o: 'على ما يُدخَل في الإعدادات وما يُسجّله الميدان.',
    d: 'تُقرَأ عند الحاجة — راجع دليلَ العمليات لدورتها.'
  };
}

/* ═══ المساعدُ: بحثٌ محليٌّ صرف — بلا API ولا اتصالٍ خارجي ═══
   مئةٌ وصفحةٌ لا يحفظها أحدٌ عن ظهر قلب. يكتب المستخدمُ سؤالَه بكلماته،
   فيُطابَق ضدَّ فهرسٍ مبنيٍّ من عنوان كل صفحةٍ ووصفها (المكتوبَين أصلًا)
   زائدًا كلماتٍ مرادفةً مكتوبةً يدًا للصفحات الأكثر سؤالًا — وتُقاس
   بنفس أدوات بحث الموقع والقائمة (arNorm/subseq) لا بمنطقٍ جديد. ولا
   تُقترَح صفحةٌ لا يراها دورُ صاحب السؤال، فلا يُرسَل مشرفٌ لصفحة مهندس. */

var ASSIST_OPEN = false;
var ASSIST_Q = '';

/* كلماتٌ يكتبها الناسُ ولا تظهر في عنوان الصفحة أو وصفها حرفيًّا */
var HELP_KEYWORDS = {
  crewman:   ['اضافة فني','فني جديد','موظف جديد','اضافة موظف','عمل فريق','فريق جديد','حذف فني','تعديل فريق','نسب الفريق','الانصبة'],
  users:     ['انشاء حساب فني','حساب دخول','يوزر وباسورد','كلمة مرور فني','انشاء مستخدم','حساب جديد','صلاحيات المستخدم','تعطيل حساب'],
  assign:    ['اسناد نقاط','توزيع نقاط','ارسال فريق','اسناد فني','اسناد تركيب','اسناد فك','اسناد زيارة'],
  req:       ['طلب زيارة','SR','رقم الطلب','اعتماد زيارة'],
  solution:  ['اعتماد الحل','IR','DR','اجهزة التركيب','اقتراح اجهزة','ايه اللي هيترکب'],
  qa:        ['اعتماد تركيب','تدقيق','رفض تركيب','مراجعة السيريال'],
  survey:    ['نموذج المسح','بيانات الزيارة','تسجيل زيارة','visits list','visit list','completed visits','export visits','reopen point','الزيارات اللى تمت','الزيارات المكتملة','اكسبورت الزيارات','تصدير الزيارات','النقاط اللى اتزارت','اعادة زيارة','ارجاع نقطة متعذرة'],
  svForm:    ['فورم المسح','املأ نموذج المسح'],
  insForm:   ['فورم التركيب','تسجيل تركيب','ابلغ عن تركيب'],
  disp2:     ['فك جهاز','ارجاع عهدة','فك تركيب'],
  assignRole:['اسناد دور','تغيير صلاحية','ترقية مشرف'],
  roles:     ['الادوار','مين يشوف ايه','صلاحيات كل دور'],
  vehkind:   ['نوع سيارة جديد','انواع العربيات'],
  fleet:     ['العربيات','السيارات','الاسطول'],
  fleetAsn:  ['اسناد سيارة','تسليم عربية','عهدة سيارة'],
  fleetLog:  ['سجل السيارة','مين اخد العربية'],
  fleetCost: ['تكلفة السيارات','مصاريف الاسطول'],
  buys:      ['مشتريات','فاتورة','طلب شراء','تسجيل مشترى'],
  sup:       ['الموردين','اضافة مورد'],
  items:     ['الكتالوج','اسعار القطع','اضافة صنف','تعديل سعر'],
  wos:       ['طلب مستودع','صرف قطع','استلام من المخزن'],
  invb:      ['رصيد المخزون','كام قطعة فاضلة'],
  invmv:     ['حركة المخزون','دخول وخروج المخزن'],
  stock:     ['عهدة الاجهزة','مين معاه ايه'],
  ships:     ['شحنة','توريد','تأخير شحنة'],
  drive:     ['رفع صورة','تخزين الصور','مساحة درايف'],
  notif:     ['الاشعارات','تنبيهات'],
  exp:       ['تصدير اكسيل','استيراد ملف','رفع ملف'],
  guide:     ['طريقة الاستخدام','شرح التطبيق'],
  ncr:       ['عدم مطابقة','مشكلة جودة'],
  hse:       ['حادث','سلامة','بلاغ حادثة'],
  budget:    ['الميزانية','حد الاعتماد المالي'],
  consts:    ['ثوابت النظام','ساعات العمل','ايام الاسبوع'],
  retain:    ['حذف بيانات قديمة','مدة الاحتفاظ'],
  wipe:      ['تصفير كل البيانات','مسح شامل'],
  sync:      ['تعارض بيانات','مزامنة يدوية'],
  ev:        ['سجل الاحداث','لوج','سجل التدقيق','مين عدل ايه'],
  budm:      ['المستخلص','الملخص المالي'],
  chalm:     ['تحدي ميداني','عائق في الموقع','افادات الميدان','المعوقات','التحديات','نقاط التحدي','فلتر المشعر','فلتر النوع','العوائق'],   /* (V26.9) الإفاداتُ ومتابعةُ التحديات صفحةٌ واحدة */
  stuck:     ['نقاط متعثرة','راكد'],
  tfwdraw:   ['رسم المسار','مسار التفويج','ارسم على الخريطة','الذهاب والعودة','مسار الدور','رسم مسارات الجمرات'],
  mobs:      ['جهة معالجة','اضافة جهة','اضافة جهة معالجة','جهة اخرى','جهات المعالجة','المعوقات','التحديات','العوائق','عائق','وصف المعالجة','اخر تاريخ','مهمة معالجة','تصدير نقاط التحديات','فلتر المشعر','فلتر النوع','نقاط التحدي']   /* (V26.7) الصفحةُ المدمجة كانت بلا كلمات فوجد المساعدُ «الفرق» بدلها */
};

/* خطواتٌ مكتوبةٌ يدًا لأكثر المسارات تشابكًا — لا لكل صفحة، فالوصفُ
   المختصر يكفي غالبَها */
var HELP_STEPS = {
  mobs: ['افتح «المتابعة» ← «متابعة الوزارة» ← شريحة «التحديات والمعوقات»',
         'فوق: فلتر المشعر ثم النوع — والبطاقات والجدول بيتغيروا معاه',
         'لإضافة جهة معالجة جديدة: انزل تحت جدول الفئات لحقل «جهةٌ أخرى» (للمكتب)، اكتب الاسم واضغط «أضف جهة» — بتظهر في قوائم الجهات والتصدير على كل الأجهزة، وتُحذف من نفس المكان',
         'لكل تحدي في السجل تحت: «✎» للتعديل ← المسؤول وآلية المعالجة ووصفها وآخر تاريخ ← «مهمة معالجة» تنشئ المهمة الأسبوعية بيهم',
         'سهم «النقاط» تحت كل تحدي يفتح نقاطه بالفلتر، وزر «تصدير نقاط التحديات» يطلّع إكسل بالفلتر أو بالكل'],
  crewman: ['افتح «الفرق» من القائمة الجانبية',
            'اختر الفريقَ من الأزرار فوق، أو اضغط «إضافة فريق» لو مفيش فريق مناسب',
            'انزل لكارت «إضافة موظف» واكتب الاسم والجوال والمشرف',
            'اضغط «➕ إضافة موظف» — بينضم لفريقه على طول بلا اختيار من قائمة'],
  solution: ['امسح النقطة الأول من «المسح الميداني» — لازم تبقى «تمت الزيارة»',
             'افتح «حل التركيب»، اختر النقطة من القائمة',
             'حدّد كمية كل جهاز من الكتالوج هيتركب في النقطة دي',
             'اضغط «➕ اقترح الحل» — هيبقى بانتظار المهندس',
             'المهندس يفتح نفس الصفحة ويضغط «اعتمد» أو «ردّ»'],
  assign: ['من «حل التركيب»، لازم يبقى فيه حل معتمد للنقطة لو النوع تركيب',
           'افتح «توزيع الفرق» واضغط «حدّد من الخريطة» أو اختر من القائمة',
           'اختر النقاط، ثم اختر «لفني» أو «لفريق»',
           'لو فريق: اختر الفريق وطريقة التوزيع (بالنسب أو بالتساوي)',
           'اضغط «وزّع» — هيتولّد رقم الطلب (SR/DR/PR) تلقائيًا'],
  survey: ['افتح «المسح الميداني» من «الطلبات والمسح»',
            'اضغط شريحة «تمت الزيارة» فوق — تتفرّز الزيارات المكتملة وحدها',
            'للتصدير: زر «⬇ إكسل — المسح» جنب مربّع البحث',
            'لإرجاع نقطة: زر «أعِد تصنيفها كمتعذّرة» في صفّها، واختر السبب'],
  users: ['افتح «المستخدمون»',
            'اكتب اسم المستخدم والاسم الكامل وكلمة المرور واختر الدور',
            'اضغط «إنشاء الحساب»',
            'سلّم اسم المستخدم وكلمة المرور لصاحبه — يبدّلها هو أول دخول']
};

function helpIndexAll(){
  /* شاشاتُ الميدان مصدرٌ ثانٍ للصفحات — كانت خارجَ الفهرس فلا يجدها
     المساعدُ وإن ملكها السائل. */
  /* شرائحُ الصفحات المدموجة تُفهرَس كلُّ واحدةٍ باسمها — من بحث عن
     «سجل عهدة السيارات» يجدها وإن صارت شريحةً داخل «السيارات» */
  return pageIds().map(pageMeta).filter(function(p){ return p && p.t; });
}

function helpSearch(q){
  q = arNorm(q);
  if (!q) return [];
  var toks = q.split(' ').filter(Boolean);
  var out = [];
  helpIndexAll().forEach(function(e){
    if (!seesPage(e.id)) return;
    var kw = (HELP_KEYWORDS[e.id] || []).join(' ');
    /* كان الفهرسُ عربيًّا صرفًا، فمن بحث بالإنجليزية لم يجد شيئًا وإن كانت
       الشاشةُ أمامه مترجَمةً بالاسم الذي كتبه. فصار يفهرس الأصلَ وترجمتَه
       معًا — يبحث المرءُ باللغة التي يقرأ بها، وبالعربية إن عرفها. */
    /* t() تُترجم في الواجهة الإنجليزية وحدَها — فمن بحث بالإنجليزية والواجهةُ
       عربيةٌ لم يجد شيئًا. يُفهرَس القاموسُ الإنجليزيُّ نفسُه أيًّا كانت اللغة. */
    var EN = D.en || {};
    var hay = arNorm(e.t + ' ' + e.m + ' ' + e.l + ' ' + kw + ' '
                     + (EN[e.t] || '') + ' ' + (EN[e.m] || '') + ' ' + (EN[e.l] || ''));
    /* العنوانُ أدلُّ من الوصف: من كتب «visits» يريد الشاشةَ التي اسمُها
       ذلك، لا كلَّ شاشةٍ ذُكرت فيها الكلمةُ في سطر شرحها. فيُوزَن العنوانُ
       أثقلَ، ويُتجاهَل حروفُ الجرِّ التي لا تدلُّ على شيء. */
    var ttl = arNorm(e.t + ' ' + (EN[e.t] || '') + ' ' + kw);
    var STOP = { 'for':1, 'the':1, 'of':1, 'and':1, 'in':1, 'to':1, 'a':1, 'my':1 };
    var real = toks.filter(function(tok){ return !STOP[tok] && tok.length > 1; });
    var score = 0;
    if (ttl.indexOf(q) > -1) score += 40;
    if (hay.indexOf(q) > -1) score += 10;
    real.forEach(function(tok){
      if (ttl.indexOf(tok) > -1) score += 12;
      else if (hay.indexOf(tok) > -1) score += 3;
    });
    if (!score && subseq(hay, q)) score = 1;
    if (score) out.push({ e:e, score:score });
  });
  out.sort(function(a,b){ return b.score - a.score; });
  return out.slice(0, 6).map(function(x){ return x.e; });
}

function assistHtml(){
  var results = ASSIST_Q ? helpSearch(ASSIST_Q) : [];
  return '<div class="pop" id="assistPop" style="width:min(560px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">\u{1F9ED} ' + esc(t('المساعد')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'
    +     esc(t('اسأل عن أي شيء تريد فعله، ونرشدك إلى مكانه وخطواته.')) + '</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-assist="0" aria-label="'
    +     esc(t('إغلاق')) + '">\u2715</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<input type="search" id="assistQ" value="' + esc(ASSIST_Q) + '" placeholder="'
    +   esc(t('مثلا: أريد إضافة فني جديد')) + '" dir="auto" style="width:100%;margin:0 0 12px">'
    + (!ASSIST_Q
        ? '<p class="hint" style="text-align:center;padding:20px">'
          + esc(t('اكتب ما تريد فعله بكلماتك، ونرشدك إلى الصفحة المناسبة.')) + '</p>'
        : (results.length
            ? results.map(function(e){
                var steps = HELP_STEPS[e.id];
                return '<div class="card" style="margin:0 0 10px">'
                  + '<div class="pid">' + esc(t(e.m)) + (e.sub ? ' \u00b7 ' + esc(t(e.sub)) : '') + '</div>'
                  + '<h4 style="margin:2px 0 6px">' + esc(t(e.t)) + '</h4>'
                  + (e.l ? '<p class="hint" style="margin:0 0 8px">' + esc(t(e.l)) + '</p>' : '')
                  + (steps
                      ? '<ol style="margin:0 0 10px;padding-inline-start:20px">'
                        + steps.map(function(s){ return '<li>' + esc(t(s)) + '</li>'; }).join('')
                        + '</ol>'
                      : '')
                  + btn(t(e.t) + ' \u2190','btn-primary btn-sm',' data-p="' + e.id + '" data-assist="0"')
                  + '</div>';
              }).join('')
            : '<p class="hint" style="text-align:center;padding:20px">'
              + esc(t('معنديش نتيجة قريبة — جرّب كلمة تانية، أو تصفّح القائمة الجانبية.')) + '</p>'))
    + '</div></div>';
}

/* ═══ نافذةُ ما ينتظر الرفع ═══ */
var QUEUE_OPEN = false;
var Q_LBL = { recs:'مسح', inss:'تركيب', diss:'فك', tasks:'إسناد', moves:'حركة مخزون',
              buys:'مشترى', cfg:'إعداد', sites:'موقع', photos:'صورة', ships:'شحنة',
              teams:'فريق', evlog:'حدث', notifs:'إشعار', accounts:'حساب',
              bonus:'نقاط زيادة', workReqs:'طلب ورشة', users:'مستخدم' };

function queueHtml(){
  var Q = (STATE.queue || []).slice().sort(function(a,b){ return (b.at||0) - (a.at||0); });
  var by = {};
  Q.forEach(function(x){ by[x.kind] = (by[x.kind] || 0) + 1; });

  return '<div class="pop" id="queuePop" style="width:min(620px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">\u{1F4E4} ' + esc(t('بانتظار الرفع')) + ' — ' + nm(Q.length) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'
    +     esc(t(STATE.meta.online ? 'الشبكةُ متاحة — تُرفَع تلقائيًّا الآن.'
                                 : 'لا شبكة — تُرفَع كاملةً حين تعود، ولا يسقط منها شيء.')) + '</p></div>'
    +   '<div class="actions" style="margin:0">'
    /* الزرُّ هنا أيضًا: من يرى الطابورَ على الخريطة لا يذهب إلى شاشةٍ أخرى ليدفعه */
    +     (Q.length && STATE.meta.online ? btn('\u2191 ' + t('ادفع الآن'),'btn-primary btn-sm',' data-pushnow="1"') : '')
    +     '<button type="button" class="btn btn-quiet btn-sm" data-pq="0" aria-label="'
    +       esc(t('إغلاق')) + '">\u2715</button>'
    +   '</div>'
    + '</div>'
    + '<div class="pop-body">'
    + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok']]
            .concat(Object.keys(by).map(function(k){ return [t(Q_LBL[k] || k), N(by[k])]; })))
    + (Q.length ? '' : alertBox('success','لا شيءَ بانتظار الرفع على هذا الجهاز — كلُّ ما سُجِّل هنا وصل.'))
    + (Q.length ? table(['النوع','السجل','بواسطة','سُجّل'],
        capList(Q, 200).map(function(x){
          var v = x.v || {};
          /* «بواسطة» صاحبُ العمل المسجَّل في السجل نفسه لا حاملُ الجهاز:
             الجهازُ الواحد قد يحمل عملَ أكثرَ من فنيٍّ في يومٍ واحد. */
          var who = v.by || v.user || v.doneBy || v.reopenBy || STATE.meta.name || '\u2014';
          return [pill(t(Q_LBL[x.kind] || x.kind), 'acc'),
                  '<strong>' + esc(String(x.id || '\u2014')) + '</strong>',
                  esc(dispName(who)),
                  '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
        })) : '')
    + (Q.length > 200
        ? ''
        : '')

    /* ── ما وصل حديثًا: متابعةُ عمل الميدان أوّلًا بأول ──
       طابورُ جهازٍ آخر لا يُرى من هنا — ما لم يُرسَل لم يغادر ذلك الجهاز.
       فالمتابعةُ الممكنةُ هي ما وصل فعلًا: مَن سجّل ماذا ومتى، مرتَّبًا
       بالأحدث، من سجل الأحداث المُزامَن. */
    + (function(){
        var E = (STATE.events || []).slice(0, 40);
        if (!E.length) return '';
        return '<h4 style="margin:18px 0 8px">' + esc(t('وصل حديثًا')) + '</h4>'
          + table(['الحدث','بواسطة','الوقت'],
              E.map(function(x){
                return [esc(x.what || ''), esc(x.by || '\u2014'),
                        '<span class="num">' + esc((x.day||'') + ' ' + (x.at||'')) + '</span>'];
              }))
          + '<p class="hint">' + esc(t('من سجل الأحداث المُزامَن — للتفصيل الكامل والتصفية: «سجل الأحداث».')) + '</p>';
      })()

    + '<p class="hint">' + esc(t('لا شيءَ يُحذَف من الطابور إلا بعد أن يصل فعلًا — والأقدمُ يُرفَع أولًا. وما لم يُرسَل من جهازٍ آخر لا يُرى من هنا: لم يغادره بعد.')) + '</p>'
    + '</div></div>';
}

function helpHtml(){
  /* في صفحةٍ مدموجةٍ تُشرَح الشريحةُ المفتوحةُ لا الأمُّ وحدها */
  var hid = TABS[CUR] ? tabCur(CUR) : CUR;
  var p = pageMeta(hid);
  var h = helpOf(hid);
  if (!h || !p) return '';
  return '<div class="pop" id="helpPop" style="width:min(520px,92vw)">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + esc(t(p.t)) + '</h3>'
    +   '<div class="pid" style="margin-top:3px">' + esc(t(p.m)) + (p.sub ? ' \u00b7 ' + esc(t(p.sub)) : '') + '</div></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-help="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="help-rows">'
    +   '<div><span class="hk">' + esc(t('ماذا تفعل')) + '</span><p>' + esc(t(h.w)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('من أين تقرأ')) + '</span><p>' + esc(t(h.f)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('علامَ تُبنى')) + '</span><p>' + esc(t(h.o)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('متى تكتمل')) + '</span><p>' + esc(t(h.d)) + '</p></div>'
    + '</div></div>'
    + '<div class="actions" style="margin-top:13px">'
    +   btn('📘 ' + t('دليل العمليات'),'btn-secondary btn-sm',' data-p="sop"')
    +   btn('🗺 ' + t('خريطة التغطية'),'btn-secondary btn-sm',' data-p="cover"')
    + '</div></div>';
}

/* ═══ نافذة النقطة — كما في العامل، وكلُّ زرٍّ يفعل ═══
   وسمُ الحالة لا يُتاح إلا لنقطةٍ أُسندت، والتحريكُ يكتب موقعًا معدَّلًا،
   والتفاصيلُ تفتح شاشتها، والاتجاهاتُ تفتح خرائط جوجل. */

var MOVE_ID = '', MOVE_AT = null;

/* ═══ المخيمُ يُعرَف بشاخصه (V23.8) ═══
   «خلي كل المخيمات تبان برقم الشاخص يكون هو الحاجة الأساسية»: عنوانُ المخيم في النافذة والقوائم رقمُ
   شاخصه، وتحته المشعرُ والمربعُ والمعرِّف — وغيرُ المخيم باسمه كما كان. */
function siteTitle(x){ return (x && x.type === 'مخيم' && x.sign) ? t('شاخص') + ' ' + x.sign : ((x && x.name) || ''); }
function siteSub(x){ return (x && x.type === 'مخيم' && x.sign) ? [t(x.zone || ''), x.sq ? t('مربع') + ' ' + x.sq : ''].filter(Boolean).join(' \u00b7 ') : ''; }
/* عناوينُ الأجهزة من بادئة شبكة النقطة (١٤٤٧): ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا */
function netRows(x, kvf){
  var n = String((x && x.net) || '').trim().replace(/\/\d+$/, '').replace(/\.0$/, '');
  if (!/^\d+\.\d+\.\d+$/.test(n)) return '';
  var L = function(v){ return '<div dir="ltr" class="cx-l">' + v + '</div>'; };
  return kvf('عناوين الأجهزة', '<div class="cx-box">' + L(esc(t('راوتر')) + ' ' + esc(n) + '.1') + L(esc(t('قارئ')) + ' ' + esc(n) + '.2') + L(esc(t('كاميرا')) + ' ' + esc(n) + '.3')
    + '<div class="hint" style="margin:2px 0 0;font-size:11px" dir="ltr">' + esc(n) + '.0/24</div></div>');
}
function popHtml(){
  var s = (POP_SITE && siteFind(POP_SITE)) || STATE.sites[0];
  if (!s) return '';
  var d = CAT_DEF[s.type] || { l:s.type, i:'\u25CF', c:'#8A939D' };
  var rec = STATE.recs[s.id] || null;
  var ins = STATE.inss[s.id] || null;
  var task = asnOf(s.id);
  var moved = !!(rec && rec.loc);
  var sv = !!rec;
  var st = (ins && ins.status) || s.fstat || 'لم يبدأ';

  function kv(k, v){
    if (v === '' || v == null) return '';
    return '<div><span class="k">' + esc(t(k)) + '</span><span>' + v + '</span></div>';
  }

  /* أزرارُ الوسم: في وضع التركيب مجدولٌ وتم، وفي المسح «تمت الزيارة» —
     ولا تظهر إلا لنقطةٍ أُسندت، فلا يُوسَم ما لم يُطلَب. */
  var marks = '';
  if (FIELD_MODE === 'install'){
    marks = [['مجدول','#FF8C42'], ['مُركّب','#3AD6A0'], ['متعذّر','#E05252']].map(function(o){
      var on = st === o[0];
      return '<button type="button" class="go' + (on?' on':'') + '"'
        + ' style="border-color:' + o[1] + ';color:' + (on ? '#0A0B0D' : o[1])
        + (on ? ';background:' + o[1] : '') + '"'
        + ' data-fmark="' + esc(s.id) + '|' + esc(o[0]) + '">' + esc(t(o[0])) + '</button>';
    }).join('');
  } else if (may('approve')){   /* (V28.7) قرارُ المالك: «اسمها زيارة — المشرفُ ملزَمٌ بنموذج المسح، والمهندسُ يقدر يعملها من عنده (تمت الزيارة) ويتجاوز النموذج» */
    /* (V28.3) زرٌّ يقول ما يفعل: يسجّل زيارةً سريعةً حين لا زيارة، ويُلغي السريعةَ وحدَها، ولا يظهر على مسحٍ كامل */
    var rq = STATE.recs[s.id];
    marks = !rq ? '<button type="button" class="go" style="border-color:#4BC9F5;color:#4BC9F5" data-smark="' + esc(s.id) + '">\u2713 ' + esc(t('تمت الزيارة')) + '</button>'
      : recIsQuick(rq) ? '<span class="pill info">' + esc(t('تمت الزيارة — بقرار المهندس')) + '</span>'   /* (V28.4) لا زرَّ إلغاء — الحذفُ موقوف */
      : '';
  } else if (task || rankOf(ROLE) >= rankOf('supervisor')){   /* (V28.7) المشرفُ والفنيُّ: الزيارةُ من نموذج المسح بصوره */
    marks = STATE.recs[s.id] ? '' : '<span class="hint" style="margin:0;font-size:11.5px">' + esc(t('سجّل الزيارةَ من «نموذج المسح» بصورها')) + '</span>';
  } else {
    marks = '<span class="hint" style="margin:0;font-size:11.5px">'
      + esc(t('لم تُجدول زيارة لهذه النقطة بعد')) + '</span>';
  }

  /* ═══ بطاقةُ «تفاصيل مختصرة»: تقييمٌ بالعين لا تنقّلٌ بين شاشات ═══ */
  if (FIELD_MODE === 'brief'){
    var bR = STATE.recs[s.id], bHas = !!bR, bSv = svDone(bR), bMe = briefMay(), bf2 = briefOf(s.id);
    var rv3 = svReview(bR), ms3 = minState(bR);
    /* الزرُّ الوحيدُ: الاعتمادُ الذي يملكه القارئُ في هذه اللحظة */
    var apr = '';
    if (bSv && rv3 !== 'approved' && may('approve'))
      /* يُفتَح على النقطة نفسِها لا على الشاشة: كان يفتحها بقائمةٍ من مئاتٍ
         فيُعتمَد غيرُ المقصود (V17.21) */
      apr = btn('\u2705 ' + t('افتح الاعتماد التقني'),'btn-primary btn-sm',' data-goto="svappr" data-gotosite="' + esc(s.id) + '"');
    else if (bSv && rv3 === 'approved' && ms3 !== 'approved' && may('minapprove'))
      apr = btn('\u{1F3DB} ' + t('افتح اعتماد الوزارة'),'btn-primary btn-sm',' data-goto="minappr" data-gotosite="' + esc(s.id) + '"');
    var bStage = briefStage(s.id);
    var stateLine = !bHas ? 'لم تُزر بعد'
      : (bStage === 'blocked' ? 'نزل الميدانُ ولم يصل'
      : (rv3 === 'revisit' ? 'رُدّت لزيارةٍ أخرى'
      : (rv3 !== 'approved' ? 'مُسحت — تنتظر الاعتمادَ التقني'
      : (ms3 === 'returned' ? 'أعادتها الوزارةُ بملاحظة'
      : (ms3 !== 'approved' ? 'اعتُمدت تقنيًّا — تنتظر اعتمادَ الوزارة' : 'اعتُمدت من الوزارة')))));
    return '<div class="pop" id="pkPop">'
      + '<div class="pop-head">'
      +   '<div style="min-width:0"><div class="pid" style="color:var(--brand);font-weight:700">' + bdi(s.id) + '</div>'
      +   '<h3 style="margin-top:3px">' + bdiText(siteTitle(s)) + '</h3>' + (siteSub(s) ? '<div class="hint" style="margin:2px 0 0">' + esc(siteSub(s)) + '</div>' : '') + (typeof clashPill === 'function' ? clashPill(s.id) : '') + '</div>'
      +   '<button type="button" class="btn btn-quiet btn-sm" data-pop="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button>'
      + '</div>'
      + '<div class="pop-body">'
      + '<div class="hint" style="margin:0 0 6px">' + esc(t(s.zone)) + ' \u00b7 ' + esc(t(s.type)) + (s.sign ? ' \u00b7 ' + esc(t('الشاخص')) + ' <span class="num">' + esc(s.sign) + '</span>' : '')
      + (camKind(s) ? ' \u00b7 ' + pill(camKindLabel(camKind(s)), '') + (s.type === 'كاميرا' && may('settings')
          ? ' <select data-camkind="' + esc(s.id) + '" aria-label="' + esc(t('نوع الكاميرا')) + '" style="min-height:30px;font-size:12px;width:auto">' + ['Bullet', 'PTZ'].map(function(k){ return '<option value="' + k + '"' + (camKind(s) === k ? ' selected' : '') + '>' + esc(camKindLabel(k)) + '</option>'; }).join('') + '</select>' : '') : '')
      + '</div>'
      /* الخبرُ أوّلًا */
      + '<div class="card" style="margin:0 0 8px;padding:10px 12px;border-inline-start:4px solid ' + briefColor(s.id) + '">'
      +   (!bHas
            ? '<p class="hint" style="margin:0">' + esc(t('لم ينزل الميدانُ إلى هذه النقطة بعد')) + '</p>'
            : (bf2
                ? '<div class="wt-row">' + pill(bf2.st, bf2.st === 'تمام' ? 'ok' : (bf2.st === 'تحدٍّ' ? 'bad' : 'warn'))
                  + '<span class="hint" style="margin:0">' + esc(dispName(bf2.by)) + (bf2.at ? ' \u00b7 ' + esc(stepAgo(bf2.at)) : '') + '</span></div>'
                  + '<div style="margin:6px 0 0;font-size:13.5px;line-height:1.6">' + esc(bf2.d || t('بلا تفاصيلَ مكتوبة')) + '</div>'
                : '<p class="hint" style="margin:0">' + esc(t('لم تُكتَب تفاصيلُ هذه النقطة بعد')) + '</p>'))
      +   (bHas && bMe
            ? '<div class="chips" style="margin:8px 0 0">' + BRIEF_ST.map(function(x){
                return '<button type="button" class="chip' + (bf2 && bf2.st === x ? ' on' : '') + '" data-bst="' + esc(s.id) + '|' + esc(x) + '">' + esc(t(x)) + '</button>';
              }).join('') + '</div>'
              + '<div style="display:flex;gap:6px;margin-top:8px">'
              + '<input id="bfTxt" dir="auto" value="' + esc(bf2 ? bf2.d : '') + '" placeholder="' + esc(t('سطرٌ واحد: ما الذي وقع في هذه النقطة؟')) + '" style="flex:1">'
              + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-bfsave="' + esc(s.id) + '"') + '</div>'
            : '')
      + '</div>'
      /* ثم ما سجّله الميدانُ بالحرف — فيُقيَّم بالعين */
      + (bHas
          ? '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F4CB} ' + esc(t('ما سجّله الميدان'))
            + ' <span style="font-weight:400">\u00b7 ' + esc(dispName(bR.by || '')) + (bR.at ? ' \u00b7 ' + esc(stepAgo(bR.at)) : '') + '</span></div>'
            + '<div class="pop-rows">' + svFieldRows(bR) + '</div>'
            + ((bR.chals || []).length
                ? /* لا يُعاد نصُّ «تحديات التركيب» هنا: حارسُ الحُرّاس يزرع عطلَه في تلك
                     المرساة بعينها، ويشترط ألّا تتكرّر — وإلا زرع في موضعٍ وفحص آخر */
                  '<div class="hint" style="margin:8px 0 4px;font-weight:700">\u26A0 ' + esc(t('التحديات المرصودة')) + '</div>'
                  + '<div class="chips" style="margin:0">' + bR.chals.map(function(c){ return pill(c, /لا توجد/.test(c) ? 'ok' : 'warn'); }).join('') + '</div>'
                : '')
            /* كلُّ نصٍّ كُتب عن النقطة — بمصدره وكاتبه */
            + (function(){
                var TX = svTexts(s.id); if (!TX.length) return '';
                return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F5E8} ' + esc(t('ما كُتب عن النقطة')) + '</div>'
                  + TX.map(function(x){
                      return '<div class="bf-tx"><div class="hint" style="margin:0">' + esc(t(x.src))
                        + (x.who ? ' \u00b7 ' + esc(dispName(x.who)) : '') + (x.at ? ' \u00b7 ' + esc(stepAgo(x.at)) : '') + '</div>'
                        + '<div style="font-size:13.5px;line-height:1.6">' + esc(x.txt) + '</div></div>';
                    }).join('');
              })()
            /* والصورُ تُفتَح من هنا — لا من شاشةٍ أخرى */
            + (function(){
                var L = photosOf(s.id).filter(function(x){ return !x[1].del; });
                if (!L.length) return (bR.photos || []).length
                  ? '<div class="hint" style="margin:8px 0 0">\u{1F4F7} ' + esc(t('الصور')) + ': <b>' + nm(bR.photos.length) + '</b> \u00b7 '
                    + esc(t('لم تصل هذا الجهاز بعد')) + '</div>'
                  : '';
                var fold = null; L.forEach(function(x){ if (!fold && x[1].folderId) fold = x[1].folderId; });
                return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F4F7} ' + esc(t('الصور')) + ' <span style="font-weight:400">\u00b7 ' + nm(L.length) + '</span></div>'
                  + '<div class="bf-ph">' + L.slice(0, 8).map(function(x){
                      var id = x[0], p = x[1];
                      var src = p.data || (p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w400' : '');
                      if (!src) return '';
                      return '<img src="' + esc(src) + '" alt="' + esc(t(p.kind || '')) + '" title="' + esc(t(p.kind || '')) + '"'
                        + ' data-phview="' + esc(id) + '" loading="lazy">';
                    }).join('') + '</div>'
                  + (fold && rankOf(ROLE) >= rankOf('admin')
                      ? '<a class="btn btn-quiet btn-sm" style="margin-top:6px" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/' + esc(fold) + '">\u{1F4C1} ' + esc(t('مجلد النقطة على الدرايف')) + '</a>'
                      : '');
              })()
          : '')
      + '<div class="alert info" style="margin:10px 0 0"><span><strong>' + esc(t('الحالة')) + ':</strong> ' + esc(t(stateLine)) + '</span></div>'
      + (apr ? '<div class="actions" style="margin:8px 0 0">' + apr + '</div>' : '')
      + '</div></div>';
  }

  return '<div class="pop" id="pkPop">'
    + '<div class="pop-head">'
    +   '<div style="min-width:0"><div class="pid" style="color:var(--brand);font-weight:700">'
    +     bdi(s.id) + '</div>'
    +   '<h3 style="margin-top:3px">' + bdiText(s.name) + '</h3>' + (typeof clashPill === 'function' ? clashPill(s.id) : '') + '</div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-pop="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'

    + '<div style="color:' + d.c + ';font-weight:800;font-size:12px;margin:6px 0 2px">'
    +   d.i + ' ' + esc(t(d.l)) + ' — ' + esc(s.zone)
    /* فرعُ كاميرا الوزارة — ويصحّحه المهندس (V19.1) */
    +   (camKind(s) ? ' \u00b7 ' + esc(camKindLabel(camKind(s))) + (s.type === 'كاميرا' && may('settings')
          ? ' <select data-camkind="' + esc(s.id) + '" aria-label="' + esc(t('نوع الكاميرا')) + '" style="min-height:30px;font-size:12px;width:auto">' + ['Bullet', 'PTZ'].map(function(k){ return '<option value="' + k + '"' + (camKind(s) === k ? ' selected' : '') + '>' + esc(camKindLabel(k)) + '</option>'; }).join('') + '</select>' : '') : '')
    +   '</div>'

    /* ═══ التفاصيلُ المختصرة: أوّلَ ما يُقرأ في طبقتها ═══
       الوزارةُ تفتح النقطةَ لتعرف ما وقع فيها — فيُقدَّم الخبرُ على البيانات:
       حالةٌ بلونها وسطرٌ بمن كتبه ومتى. ومن يكتب يجد الشرائحَ والسطرَ هنا
       نفسِه، فلا يفتح نموذجًا آخر. */
    + (FIELD_MODE === 'brief' ? (function(){
        var bf = briefOf(s.id), me = briefMay(), sv2 = svDone(STATE.recs[s.id]);
        if (!sv2) return '<div class="card" style="margin:8px 0;padding:10px 12px">'
          + '<p class="hint" style="margin:0">' + esc(t('تُكتَب بعد تمام الزيارة')) + '</p></div>';
        return '<div class="card" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid ' + briefColor(s.id) + '">'
          + (bf
              ? '<div class="wt-row">' + pill(bf.st, bf.st === 'تمام' ? 'ok' : (bf.st === 'تحدٍّ' ? 'bad' : 'warn'))
                + '<span class="hint" style="margin:0">' + esc(dispName(bf.by)) + (bf.at ? ' · ' + esc(stepAgo(bf.at)) : '') + '</span></div>'
                + '<div style="margin:6px 0 0;font-size:13.5px;line-height:1.6">' + esc(bf.d || t('بلا تفاصيلَ مكتوبة')) + '</div>'
              : '<p class="hint" style="margin:0">' + esc(t('لم تُكتَب تفاصيلُ هذه النقطة بعد')) + '</p>')
          + (me
              ? '<div class="chips" style="margin:8px 0 0">' + BRIEF_ST.map(function(x){
                  return '<button type="button" class="chip' + (bf && bf.st === x ? ' on' : '') + '" data-bst="' + esc(s.id) + '|' + esc(x) + '">' + esc(t(x)) + '</button>';
                }).join('') + '</div>'
                + '<div style="display:flex;gap:6px;margin-top:8px">'
                + '<input id="bfTxt" dir="auto" value="' + esc(bf ? bf.d : '') + '" placeholder="' + esc(t('سطرٌ واحد: ما الذي وقع في هذه النقطة؟')) + '" style="flex:1">'
                + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-bfsave="' + esc(s.id) + '"') + '</div>'
              : '')
          + '</div>';
      })() : '')

    + '<div class="pop-rows">'
    +   kv('الشاخص', s.sign ? '<span class="num">' + esc(s.sign) + '</span>' : '')
    +   kv('المربع', s.sq ? '<span class="num">' + esc(s.sq) + '</span>' : '')
    +   kv('الشركة', esc(s.co))
    +   kv('التصنيف', esc(t(s.inout === 'خارج' ? 'حجاج خارج' : (s.inout === 'داخل' ? 'حجاج داخل' : s.inout))))
    +   kv('وجه العمل', esc(t(s.work)))
    +   kv('المنطقة', esc(s.region))
    +   kv('الدور', siteFloor(s) != null ? esc(t(floorName(siteFloor(s)))) : '')   /* (V22.2) */
    +   (isJmr(s) && siteGate(s) ? kv('البوابة', '<b>' + esc(t(siteGate(s))) + '</b>' + (siteFloor(s) != null ? ' \u2014 ' + esc(t(floorName(siteFloor(s)))) : '')) : '')   /* (V25.4) */
    +   (s.type === 'مخيم' ? (tfwFloorOf(s.id) != null ? kv('مسار التفويج', esc(t('إلى الجمرات')) + ' \u2014 ' + esc(t('الدور') + ' ' + t(TFW_FL[tfwFloorOf(s.id)])) + ' ' + btn('اعرض مسار المخيم', 'btn-quiet btn-sm', ' data-tfwcamp="' + esc(s.id) + '"')) : (tfwLoad(), '')) : '')   /* (V23.2) */
    +   (s.type === 'مخيم' && maySiteEdit() ? kv('حدود المخيم', btn('عدّل الحدود', 'btn-quiet btn-sm', ' data-bedstart="' + esc(s.id) + '"')) : '')   /* (V25.9) */
    +   (s.type === 'مخيم' && s.zone === 'منى' && mayIot() ? kv('حساسات المخيم', (iotOf(s.id) ? nm(iotOf(s.id).sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + esc(t('جيت واي')) + ' ' : esc(t('طبقة التخطيط لم تُحمَّل')) + ' ') + btn('عدّل الحساسات', 'btn-quiet btn-sm', ' data-iotedit="' + esc(s.id) + '"')) : '')   /* (V25.8) */
    +   camInfoRows(s, kv) + camxRows(s, kv) + netRows(s, kv)   /* (V23.8) */
    /* الحالةُ من مصدر اللون نفسِه (V17.35): كانت «تمت الزيارة» تُكتَب لكلِّ
     سجلٍّ ولو كان تعذُّرَ وصول — فيبدو المخيمُ بُنيًّا على الخريطة والنافذةُ
     تقول تمّت. صار النصُّ والدائرةُ من دورة الحياة واحدةً، ويُقال لونُها. */
  +   (function(){
        var lf = (typeof lifeOf === 'function') ? lifeOf(s) : '';
        var L2 = (typeof LIFE === 'object' && LIFE[lf]) || null;
        var sv2 = svDone(rec);
        return kv('حالة المسح', pill(sv2 ? 'تمت الزيارة' : (rec ? 'تعذّر الوصول' : 'لم يُزر'), sv2 ? 'ok' : (rec ? 'off' : 'warn'))
          + (rec && !sv2 && rec.note ? ' <span class="hint" style="margin:0">' + esc(String(rec.note).slice(0, 60)) + '</span>' : ''))
          + (L2 ? kv('لون النقطة', '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + L2.c + ';vertical-align:middle;margin-inline-end:6px"></span>' + esc(t(L2.n))) : '');
      })()
    +   kv('حالة التركيب', pill(st, st==='مُركّب' ? 'ok' : (st==='متعذّر' ? 'off' : '')))
    +   (task ? kv('مُسند إلى', esc(task.to) + (task.when ? ' · ' + esc(task.when) : '')) : '')
    +   kv('الإحداثيات', '<span class="num">' + s.lat.toFixed(5) + ', ' + s.lng.toFixed(5) + '</span>')
    /* عناوينُ الأجهزة الثلاثة — تُقرأ من النافذة مباشرةً بلا فتح شاشةٍ أخرى.
       البادئةُ من التركيب المعتمد إن وُجد وإلا من سجل الموقع. */
    + (function(){
        var ins = STATE.inss[s.id], pre = (ins && ins.prefix) || s.net || '';
        pre = String(pre).trim().replace(/\.+$/, '');
        if (!/^\d{1,3}(\.\d{1,3}){2}$/.test(pre)) return '';
        var ip = function(n){ return '<span class="num" dir="ltr">' + esc(pre + '.' + n) + '</span>'; };
        return kv('الراوتر', ip(1)) + kv('القارئ', ip(2)) + kv('الكاميرا', ip(3));
      })()
    + '</div>'

    + (moved ? '<div class="hint" style="color:#7FB3FF;margin:6px 0 0">\u{1F4CD} '
        + esc(t('موقع معدَّل ميدانيًّا')) + '</div>' : '')

    + '<div class="pst">' + marks + '</div>'

    + (ins && Object.keys(ins.parts || {}).length
      ? '<div class="hint" style="margin:8px 0 0">' + esc(t('القطع'))
        + ': <b>' + nm(Object.keys(ins.parts).length) + '</b> · ' + esc(t('النقاط'))
        + ': <b>' + nm(ins.pts || 0) + '</b>'
        + (ins.approved ? ' · ' + pill('معتمد','ok') : ' · ' + pill('بانتظار التدقيق','warn'))
        + '</div>' : '')

    /* لكلٍّ ما يملك: التحديدُ لمن يُسنِد (المشرفُ فما فوق)، والتحريكُ والنموذجُ
       لمن يكتب — والوزارةُ تتابع: اتجاهاتٌ وتفاصيلُ فقط، فلا يُعرَض عليها زرٌّ
       ترفضه القاعدة */
    + '<div class="pop-btns">'
    +   (rankOf(ROLE) >= rankOf('supervisor')
          ? btn(selHas(s.id) ? '☑ ' + t('محدَّد') : '☐ ' + t('حدّد'),
                selHas(s.id) ? 'btn-primary btn-sm' : 'btn-secondary btn-sm',
                ' data-psel="' + esc(s.id) + '"') : '')
    +   '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" '
    +   'href="https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng + '">'
    +   '↗ ' + esc(t('اتجاهات')) + '</a>'
    +   (may('edit') ? btn('⇱ ' + t('تحريك'),'btn-secondary btn-sm',' data-move="' + esc(s.id) + '"') : '')
    +   btn(may('edit') ? '✎ ' + t('تعديل البيانات') : '\u25C8 ' + t('التفاصيل'),'btn-secondary btn-sm',' data-site="' + esc(s.id) + '"')
    +   (seesPage('ev') ? btn('\u{1F4DC} ' + t('سجل النقطة'),'btn-quiet btn-sm',' data-evsite="' + esc(s.id) + '"') : '')   /* (V30.8) */
    /* نموذجُ التركيب لا يُفتَح لنقطةٍ لم تصر جاهزةً — وإلا رُكّبت قبل اعتمادها */
    +   (may('edit')
          ? (FIELD_MODE === 'install'
              /* الجاهزيةُ الحقيقيةُ: اعتمادُ الوزارة وحلٌّ معتمد — لا اللونُ وحدَه */
              ? (((typeof minOk === 'function' && minOk(s.id)) && (STATE.inss[s.id] || {}).solution && (STATE.inss[s.id] || {}).solution.status === 'معتمد') || insDone(s.id) || taskKindOf(s.id, 'install')
                  ? btn('🔧 ' + t('نموذج التركيب'),'btn-secondary btn-sm',' data-insform="' + esc(s.id) + '"')
                  : '')
              : btn('🔍 ' + t('نموذج المسح'),'btn-secondary btn-sm',' data-form="' + esc(s.id) + '"')
                + (svqMay(s.id) ? btn('\u270E ' + t('تعديل المسح'),'btn-secondary btn-sm',' data-svq="' + esc(s.id) + '"') : ''))
          : '')

    /* ═══ الخطوةُ التالية — أين تقف النقطةُ ومن صاحبُ الدور ═══
       من رأى نقطةً مسوحةً لا تظهر في التركيب سأل: أهي معطَّلةٌ أم تنتظر؟
       فصار كلُّ حالٍ يقول ما بعده ومن يملكه — ومن يملكه يجد الزرَّ، ومن
       لا يملكه يعرف من ينتظر بدل أن يظنَّ العطل. */
    +   (function(){
          /* ═══ الاعتمادان في الخطوة التالية ═══
             كانت البطاقةُ تقفز من المسح إلى «جاهزةٌ للتركيب» وتعرض نموذجَ
             التركيب — وقد صار بينهما اعتمادان: تقنيٌّ من المهندس، ثم اعتمادُ
             الوزارة لإعداد التركيب. فمن قرأ البطاقةَ ظنَّ النقطةَ جاهزةً وهي
             تنتظر، وربّما فتح نموذجَ تركيبٍ لنقطةٍ لم تُعتمَد بعد. */
          var ins2 = STATE.inss[s.id] || {}, so = ins2.solution;
          var rec2 = STATE.recs[s.id], rv2 = svReview(rec2), ms2 = minState(rec2);
          var step = '', go = '', who = '';
          if (rec && !svDone(rec)){
            step = 'تعذّر الوصولُ — تُزار ثانيةً'; who = 'المشرفُ المُسنَد إليه';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (!sv && !taskKindOf(s.id, 'visit')){
            /* لا زيارةَ ولا إسنادَ لها — ما بعدها جدولةُ زيارة (V17.57) */
            step = 'تحتاج جدولةَ زيارة'; who = 'المشرفُ أو المهندس';
            if (rankOf(ROLE) >= rankOf('supervisor') && !isCrewRole(ROLE))
              go = btn('\u{1F4C5} ' + t('جدوِل زيارة'),'btn-primary btn-sm',' data-visitasn="' + esc(s.id) + '"');
            else if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (!sv){
            step = 'تنتظر الزيارةَ الميدانية'; who = 'الفنيُّ المُسنَد إليه';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (rv2 === 'revisit'){
            step = 'رُدّت لزيارةٍ أخرى'; who = 'المشرفُ الذي زارها';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (rv2 !== 'approved'){
            step = 'مُسحت — تنتظر الاعتمادَ التقني'; who = 'المهندس';
            if (may('approve')) go = btn('✅ ' + t('افتح الاعتماد التقني'),'btn-primary btn-sm',' data-goto="svappr" data-gotosite="' + esc(s.id) + '"');
          } else if (ms2 === 'returned'){
            step = 'أعادتها الوزارةُ بملاحظة — تنتظر المعالجة'; who = 'المهندس';
            if (may('approve')) go = btn('🏛 ' + t('افتح اعتماد الوزارة'),'btn-primary btn-sm',' data-goto="minappr" data-gotosite="' + esc(s.id) + '"');
          } else if (ms2 !== 'approved'){
            step = 'اعتُمدت تقنيًّا — تنتظر اعتمادَ الوزارة لإعداد التركيب'; who = 'الوزارة';
            if (may('minapprove')) go = btn('🏛 ' + t('افتح اعتماد الوزارة'),'btn-primary btn-sm',' data-goto="minappr" data-gotosite="' + esc(s.id) + '"');
          } else if (!so){
            step = 'مُسحت — تنتظر تحديدَ ما سيُركَّب'; who = 'المهندس';
            if (may('edit')) go = btn('🧩 ' + t('حدّد القطع'),'btn-primary btn-sm',' data-goto="solution"');
          } else if (so.status !== 'معتمد'){
            step = 'حلُّها مقترحٌ — ينتظر الاعتماد'; who = 'المهندس';
            go = may('users')
              ? btn('✔ ' + t('اذهب للاعتماد'),'btn-primary btn-sm',' data-goto="solution"')
              : '';
          } else if (!insDone(s.id)){
            step = 'اعتمدتها الوزارةُ وحلُّها معتمد — جاهزةٌ للتركيب'; who = 'فريقُ التركيب';
            if (may('edit')) go = btn('🔧 ' + t('نموذج التركيب'),'btn-primary btn-sm',' data-insform="' + esc(s.id) + '"');
          } else {
            step = 'رُكّبت واعتُمدت'; who = '—';
          }
          var tw = (!sv && !rec) ? twinOf(s) : null;
          var twinNote = tw ? '<div class="alert warn" style="margin:10px 0 0"><span>' + esc(t('توأمٌ على الإحداثيات نفسِها')) + ': <b>' + esc(tw.id) + '</b> '
              + '(' + esc((tw.sq || '') + ' / ' + (tw.sign || '')) + ') \u2014 ' + esc(t(svDone(STATE.recs[tw.id]) ? 'مُسح' : 'لم يُزر'))
              + '. ' + esc(t('إن كانا مخيمًا واحدًا فادمجهما من «تصحيح البيانات» فلا يُعَدُّ مرتين.')) + '</span>'
              + (maySiteEdit() ? '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F9F9} ' + t('تصحيح البيانات'),'btn-quiet btn-sm',' data-goto="dq"') + '</div>' : '') + '</div>' : '';
          return twinNote + '<div class="alert info" style="margin:10px 0 0"><span>'
            + '<strong>' + esc(t('الخطوة التالية')) + ':</strong> ' + esc(t(step))
            + (who !== '—' ? ' \u00b7 <span class="hint" style="margin:0">'
                + esc(t('صاحبُها')) + ': ' + esc(t(who)) + '</span>' : '')
            + '</span></div>'
            + (go ? '<div class="actions" style="margin:8px 0 0">' + go + '</div>' : '')
            /* وسمُ التركيب التجريبي — للمدير: يقاس الزمنُ بين مراحلها في «الفك والمراحل ← السلسلة» (V17.95) */
            + (may('users') ? '<div class="actions" style="margin:8px 0 0">' + btn((s.pilot ? '\u2713 ' : '') + t(s.pilot ? 'نقطةُ تجربة — أعِدها عادية' : 'اجعلها نقطةَ تجربة'), 'btn-quiet btn-sm', ' data-pilot="' + esc(s.id) + '"') + '</div>' : '');
        })()
    + '</div></div>';
}

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
  if (!may('newsite') && !may('settings')){ toast(t('إضافةُ النقاط للمكتب')); return; }
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
  if (!may('newsite') && !may('settings')){ toast(t('إضافةُ النقاط للمكتب')); return; }
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
  var rec = STATE.recs[s.id] || { id:s.id, at:Date.now(), by:STATE.meta.name || '' };
  rec.loc = { lat:lat, lng:lng, from:old, at:Date.now(), by:STATE.meta.name || '' };
  /* بياناتٌ جديدةٌ بعد الاعتماد تحتاج نظرةً ثانية */
  if (rec.review === 'approved' || !rec.review) rec.review = 'pending';
  CORE.set('recs', s.id, rec);
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

/* ═══ الأداء — مئةٌ وخمسون مستخدمًا في آنٍ واحد ═══
   ثلاثةُ أعناقٍ قاستها الأرقام: بحثٌ خطيٌّ في ألفٍ وسبعمئة صف،
   وإحصاءٌ يُعاد حسابُه في كل رسمة، وسحبٌ كاملٌ من القاعدة
   كان سيبلغ ثلاثةَ ملايين قراءةٍ يوميًّا والحدُّ خمسون ألفًا. */

/* ── فهرسٌ للمواقع: بحثٌ فوريٌّ بدل مسحٍ خطي ── */
var SITE_IX = null, SITE_TOK = null;

function siteIndex(){
  if (SITE_IX) return SITE_IX;
  SITE_IX = Object.create(null);
  SITE_TOK = Object.create(null);
  STATE.sites.forEach(function(x, i){
    SITE_IX[x.id] = x;
    /* مفاتيحُ البحث: المعرّف والشاخص والمربع وكلماتُ الاسم */
    var keys = [x.id, x.sign, x.sq];
    String(x.name || '').split(/[\s\-—·]+/).forEach(function(t){ if (t.length > 1) keys.push(t); });
    keys.forEach(function(k){
      k = String(k || '').trim();
      if (!k) return;
      if (!SITE_TOK[k]) SITE_TOK[k] = [];
      if (SITE_TOK[k].length < 400) SITE_TOK[k].push(i);
    });
  });
  return SITE_IX;
}

function siteFind(id){ return siteIndex()[id] || null; }

function siteSearch(q, lim){
  lim = lim || 50;
  q = String(q || '').trim();
  if (!q) return STATE.sites.slice(0, lim);
  siteIndex();
  /* مطابقةٌ تامةٌ أولًا — أسرعُ ما يكون */
  if (SITE_TOK[q]){
    var hit = SITE_TOK[q].slice(0, lim).map(function(i){ return STATE.sites[i]; });
    if (hit.length >= lim) return hit;
  }
  var out = [], seen = Object.create(null);
  if (SITE_TOK[q]) SITE_TOK[q].forEach(function(i){
    if (!seen[i] && out.length < lim){ seen[i] = 1; out.push(STATE.sites[i]); }
  });
  /* ثم بادئةٌ جزئية — تُمسح مفاتيحُ الفهرس لا الصفوفُ كلها */
  if (out.length < lim){
    var ks = Object.keys(SITE_TOK);
    for (var j = 0; j < ks.length && out.length < lim; j++){
      if (ks[j].indexOf(q) < 0) continue;
      SITE_TOK[ks[j]].forEach(function(i){
        if (!seen[i] && out.length < lim){ seen[i] = 1; out.push(STATE.sites[i]); }
      });
    }
  }
  return out;
}

/* ── إحصاءٌ يُحسب مرةً ويُبطَل عند التغيير ── */
var STAT_CACHE = null, STAT_VER = 0;

/* الفهرسُ يُبطَل مع كلِّ تغيُّرٍ في المهامّ — وstatBump يُستدعى بعد كلِّ تغيير */
function statBump(){
  TK_IX = null; STAT_CACHE = null; STAT_VER++; DB.memoReset(); }

/* ═══ التوزيعُ بالمشعر والنوع — من حلقةٍ واحدة ═══
   كانت صفوفُ الجدول تُحسَب في مكانٍ والإجماليُّ في آخر (كاشٌ قد يكون أقدمَ
   بسجلٍّ)، والإكسلُ بتعريفٍ ثالث («سجلٌّ موجود» لا «مُسح») — فخرج للوزارة ٦٢+٢
   في الصفوف و٦٣ في الإجمالي. صار كلُّ شيءٍ من حلقةٍ واحدةٍ بتعريفٍ واحد:
   مُسح = svDone، مُركّب = حالةُ التركيب. */
function siteKeyStats(){
  var by = {}, sv = {}, ins = {}, T = { n:0, sv:0, ins:0, noRec:0, stuck:0 }, Z = {};
  STATE.sites.forEach(function(x){
    var k = x.zone + '|' + x.type, r = STATE.recs[x.id], z = taxOf(x).g || 'أخرى';   /* (V30.0) المشعرُ بتصنيف المالك: مراكزُ التفويج تضمّ النورية والزايدي والهجرة */
    /* المشعرُ بالأعداد نفسِها (V17.78): من الحلقة نفسِها لا من حسابٍ ثانٍ */
    var ZZ = Z[z] || (Z[z] = { n:0, sv:0, ins:0, noRec:0, stuck:0 });
    by[k] = (by[k] || 0) + 1; T.n++; ZZ.n++;
    if (!r){ T.noRec++; ZZ.noRec++; }
    else if (svDone(r)){ sv[k] = (sv[k] || 0) + 1; T.sv++; ZZ.sv++; }
    else if (svStuck(r)){ T.stuck++; ZZ.stuck++; }   /* من لم يصل — والمردودُ ليس متعذّرًا (V17.77) */
    var st = (STATE.inss[x.id] || {}).status;
    if (st === 'مُركّب' || x.fstat === 'مُركّب'){ ins[k] = (ins[k] || 0) + 1; T.ins++; ZZ.ins++; }
  });
  /* المعلَنُ في «نقاط المراحل» يدخل بصفرٍ — مشعرًا وتركيبةً (V18.0) */
  declaredTypeKeys().forEach(function(k){ if (by[k] == null) by[k] = 0; });   /* (V30.0) المعلَنُ بلا نقاطٍ لا يصنع مشعرًا فارغًا في الشاشة */
  var keys = Object.keys(by).sort(function(a, b){ return by[b] - by[a]; });
  return { keys:keys, by:by, sv:sv, ins:ins, total:T, zones:Z };
}
/* ═══ المسحُ بالمشعر: كم أُنجز وكم بقي (V17.78) ═══
   الوزارةُ تسأل عن منى وحدَها ثم عن عرفات وحدَها، والملخّصُ كان يجيب عن الكلّ
   فقط. فصار المشعرُ يُختار ببطاقةٍ فتُقرأ أرقامُه ونسبتُه وما بقي منه، ولا
   اختيارَ يعني الكلَّ نسبًا من الكلّ — والأعدادُ من الحلقة نفسِها. */
var OVER_ZONE = '';
function overZoneCards(K){
  var Z = K.zones, names = Object.keys(Z).sort(function(a, b){ return Z[b].n - Z[a].n; });
  var pct = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var one = function(key, label, o){
    var on = OVER_ZONE === key;
    return '<button class="btn ' + (on ? 'btn-primary' : 'btn-quiet') + '" data-ovz="' + esc(key) + '"'
      + ' style="flex:1 1 150px;min-width:150px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;text-align:start">'
      + '<span class="num" style="font-size:22px;line-height:1.1">' + nm(pct(o.sv, o.n)) + '٪</span>'
      + '<span>' + esc(label) + '</span>'
      + '<span class="hint" style="margin:0">' + esc(t('مُسح')) + ' <b class="num">' + nm(o.sv) + '</b> ' + esc(t('من')) + ' <b class="num">' + nm(o.n) + '</b>'
      +   ' \u00b7 ' + esc(t('متبقٍّ')) + ' <b class="num">' + nm(o.n - o.sv) + '</b></span></button>';
  };
  return '<div class="wt-row" style="flex-wrap:wrap;gap:8px;align-items:stretch">'
    + one('', t('كلُّ المشاعر'), K.total)
    + names.map(function(z){ return one(z, t(z), Z[z]); }).join('')
    + '</div>';
}

/* حالةُ المسح بكلمةٍ واحدةٍ — للقوائم والإكسل، بالتعريف نفسِه */
function svLabel(r){
  if (!r) return 'لم يُزر';
  if (svStuck(r)) return 'متعذّر';                        /* من لم يصل — بالتعريف نفسِه (V17.77) */
  if (r.review === 'revisit') return 'تحتاج زيارة أخرى';
  return r.review === 'approved' ? 'معتمدة' : 'تمت الزيارة';
}
/* ═══ المشعرُ المعلَنُ مشعرٌ حيث يُعَدّ (V18.0) ═══
   إعلانُ تركيبةٍ في «نقاط المراحل» (مشعر|نوع) كان يبقى في مصفوفة الأوزان وحدَها:
   الطلباتُ والتوزيعُ وشاشةُ الوزارة والملخّصُ تشتقّ المشاعرَ من المواقع، فمشعرٌ
   جديدٌ بلا نقاطٍ بعدُ لا يُرى في شيء. صار المعلَنُ يدخل الإحصاءَ بصفرٍ في كلِّ
   موضعٍ يعدُّ بالمشعر — فيُرى في الطلبات بمتاحٍ صفر، وفي شاشة الوزارة بصفرٍ من
   صفر، وفي التصدير — من اليوم الذي يُعلَن فيه لا يومَ تأتي أوّلُ نقطة. */
function declaredKeys(){
  return (Array.isArray(CFG.mxExtra) ? CFG.mxExtra : []).map(function(x){ return String(x || ''); }).filter(function(k){ return k.indexOf('|') > 0; });
}
/* التركيبةُ المعلَنةُ «مشعر|تسمية» (مصفوفةُ الأوزان تعمل بالتسمية) تدخل إحصاءَ المواقع
   «مشعر|نوعٌ خام» — فلا يتكرّر صفٌّ حين تأتي أوّلُ نقطةٍ من نوعٍ تسميتُه غيرُ مفتاحه (V19.1) */
function typeOfLabel(lab){
  if (CAT_DEF[lab]) return lab;
  var ks = Object.keys(CAT_DEF);
  for (var i = 0; i < ks.length; i++){ if (CAT_DEF[ks[i]] && CAT_DEF[ks[i]].l === lab) return ks[i]; }
  for (var k in TYPES_OLD_L){ if (TYPES_OLD_L[k].indexOf(lab) > -1 && CAT_DEF[k]) return k; }
  return lab;
}
function declaredTypeKeys(){
  return declaredKeys().map(function(k){ var i = k.indexOf('|'); return k.slice(0, i) + '|' + typeOfLabel(k.slice(i + 1)); });
}
/* ═══ كاميراتُ الوزارة: ثابتةٌ (Bullet) ومتحرّكةٌ (PTZ) وقارئةُ لوحات (LPR) (V19.1) ═══
   عائلةٌ واحدة بثلاثة أنواع. LPR نوعُ موقعٍ قائم؛ والثابتةُ والمتحرّكةُ نوعٌ واحدٌ
   («كاميرا») يُعرَف فرعُه من اسم النقطة في السجلِّ المدمج («… (PTZ) …»)، ويصحّحه
   المهندسُ من نافذة النقطة (تجاوزٌ في وثيقة الموقع — cam) فيغلب الاسم. */
var CAM_KINDS = ['Bullet', 'PTZ', 'LPR'];
function camKind(x){
  if (!x) return '';
  if (x.type === 'LPR') return 'LPR';
  if (x.type !== 'كاميرا') return '';
  if (x.cam && CAM_KINDS.indexOf(x.cam) > -1) return x.cam;
  return /\bPTZ\b/i.test(String(x.name || '')) ? 'PTZ' : 'Bullet';
}
function camKindLabel(k){ return { Bullet:t('ثابتة (Bullet)'), PTZ:t('متحرّكة (PTZ)'), LPR:t('قراءة اللوحات (LPR)') }[k] || ''; }
function declaredZones(){
  var out = []; declaredKeys().forEach(function(k){ var z = k.split('|')[0]; if (z && out.indexOf(z) < 0) out.push(z); }); return out;
}
/* المشاعرُ الحيّة: ما فيه نقاطٌ وما أُعلن — للقوائم والأشرطة والتصدير */
function zonesLive(){
  var out = zoneList(); declaredZones().forEach(function(z){ if (out.indexOf(z) < 0) out.push(z); }); return out;
}
function siteStats(){
  if (STAT_CACHE) return STAT_CACHE;
  var s = STATE.sites, by = {}, co = {}, wk = {}, sv = 0, ins = 0, apv = 0, pend = 0, rev = 0;
  for (var i = 0; i < s.length; i++){
    var x = s[i], k = x.zone + '|' + x.type;
    by[k] = (by[k] || 0) + 1;
    if (x.co) co[x.co] = (co[x.co] || 0) + 1;
    if (x.work) wk[x.work] = (wk[x.work] || 0) + 1;
    var rv = svReview(STATE.recs[x.id]);
    if (rv === 'approved') apv++; else if (rv === 'pending') pend++; else if (rv === 'revisit') rev++;
    if (svDone(STATE.recs[x.id])) sv++;
    var st = (STATE.inss[x.id] || {}).status;
    if (st === 'مُركّب' || x.fstat === 'مُركّب') ins++;
  }
  declaredTypeKeys().forEach(function(k){ if (by[k] == null) by[k] = 0; });   /* المعلَنُ بصفر (V18.0) — بمفتاح النوع (V19.1) */
  STAT_CACHE = { total:s.length, byKey:by, byCo:co, byWork:wk, surveyed:sv, installed:ins,
                 approved:apv, pending:pend, revisit:rev };
  return STAT_CACHE;
}

/* ── قائمةٌ افتراضية: تُرسَم دفعةٌ ويُزاد عند الطلب ── */
var LIST_PAGE = 40, LIST_SHOWN = 40, SEL_MODE = false;

/* عدٌّ بلا بناءِ مصفوفة — يُعرَف الإجمالي دون نسخِ الصفوف */
function fieldList(){
  var S = siteStats();
  /* الفنيُّ وطاقمُه: ما أُسند إليهم وحده. المشرفُ: المُسنَدُ أوّلًا ومفتاحٌ يفتح الكلّ */
  var mineOnly = isCrewRole(ROLE) || (effRole(ROLE) === 'supervisor' && !SITES_ALL);
  var base = mineOnly ? mineFiltered() : filtered();
  var view, total;
  var outside = 0;   /* (V22.1) نتائجُ البحث التي أخفتها التصفيةُ الحالية */
  if (SITE_Q){
    var hits = siteSearch(SITE_Q, 4000);
    if (filtOn()){ var allN = hits.length; hits = hits.filter(filtPass); outside = allN - hits.length; }
    total = hits.length;
    view = hits.slice(0, LIST_SHOWN);
  } else {
    total = base.length;
    /* الأقربُ أولًا حين يُعرَف الموقع — والفنيُّ يبدأ بما تحت قدمه */
    if (MYPOS && base.length <= 4000){
      var arr = base.slice();
      arr.sort(function(a, b){ return (distKm(MYPOS, a) || 9e9) - (distKm(MYPOS, b) || 9e9); });
      view = arr.slice(0, LIST_SHOWN);
    } else view = base.slice(0, LIST_SHOWN);
  }
  var L = { length: total };
  var scopeBar = mineOnly || (effRole(ROLE) === 'supervisor' && SITES_ALL)
    ? '<div class="chips" style="margin:0 0 8px">'
      + '<span class="chip' + (mineOnly ? ' on' : '') + '">' + esc(t('المُسنَد إليّ')) + ' \u00b7 ' + nm(mineFiltered().length) + '</span>'
      + (effRole(ROLE) === 'supervisor'
          ? '<button type="button" class="chip' + (SITES_ALL ? ' on' : '') + '" data-sitesall="' + (SITES_ALL ? '0' : '1') + '">' + esc(t('كل المواقع')) + '</button>'
          : '')
      + '</div>'
    : '';
  return scopeBar + catBar(1) + cardFlush(t('المواقع') + ' — ' + nm(total) + (filtOn() ? ' / ' + nm(S.total) : ''),
    (view.length
      ? '<div class="list">' + view.map(function(x){
          var sv = !!STATE.recs[x.id];
          var a = (typeof asnOf === 'function') ? asnOf(x.id) : null;
          return '<div class="list-item' + (selHas(x.id)?' sel':'') + '" data-site="' + esc(x.id) + '">'
            + (SEL_MODE ? '<input type="checkbox" data-sel="' + esc(x.id) + '"'
                + (selHas(x.id)?' checked':'') + (a?' disabled':'')
                + ' style="width:20px;min-height:20px;flex:0 0 auto">' : '')
            + '<div class="li-main">'
            + '<div class="li-t">' + esc(siteTitle(x)) + (siteSub(x) ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(siteSub(x)) + '</span>' : '') + '</div>'   /* المخيمُ بشاخصه (V23.8) */
            + '<div class="li-s"><span class="num">' + esc(x.id) + '</span> · '
            +   esc(t(x.zone)) + ' · ' + esc(t(x.type)) + (x.co ? ' · ' + esc(dispName(x.co.slice(0, 26))) : '')
            + '</div></div><div class="li-end">'
            + (typeof distTxt === 'function' && distTxt(x)
                ? '<div class="num" style="margin-bottom:3px">\u{1F4CD} ' + distTxt(x) + '</div>' : '')
            + pill(sv ? 'تمت الزيارة' : 'لم يُزر', sv ? 'ok' : 'warn') + '</div></div>';
        }).join('') + '</div>'
        + (L.length > view.length
          ? '<div style="padding:12px 16px;text-align:center">'
            + btn('اعرض ' + nm(Math.min(LIST_PAGE, L.length - view.length)) + ' أخرى — '
                  + nm(L.length - view.length) + ' متبقية','btn-secondary btn-sm',' data-more="1"')
            + '</div>'
          : '')
      : '<p class="hint" style="padding:18px;text-align:center;margin:0">لا نتائج لـ«' + esc(SITE_Q) + '»'
        /* (V22.1) «بحثتُ عن 0016 فلم يظهر»: التصفيةُ الباقيةُ من قبل (نوعٌ أو مشعرٌ أو حالة) كانت تُخفي
           النتيجةَ والرسالةُ لا تقول — فيُظَنّ أن النقطةَ غيرُ موجودة */
        + (outside ? ' ' + esc(t('ضمن التصفية الحالية')) + ' — ' + esc(t('وخارجها')) + ' <b class="num">' + nm(outside) + '</b>.</p>'
            + '<div style="text-align:center;padding:0 0 16px">' + btn(t('ابحث في الكل'), 'btn-primary btn-sm', ' data-sqall="1"') + '</div>'
          : '.</p>')),
    '<form class="inline-form" onsubmit="return false">'
    + '<input type="search" id="siteQ" value="' + esc(SITE_Q) + '" placeholder="'
    +   esc(t('ابحث بالمعرّف أو الشاخص أو المربع')) + '" dir="auto">'
    + btn('بحث','btn-secondary btn-sm',' data-sq="1"')
    + '<span class="hint" style="margin:0">' + nm(view.length) + ' / ' + nm(L.length) + '</span>'
    + btn(SEL_MODE ? 'إنهاء التحديد' : '☑ تحديد', SEL_MODE?'btn-primary btn-sm':'btn-secondary btn-sm',
          ' data-selmode="' + (SEL_MODE?0:1) + '"')
    + (SEL_MODE && SEL_N ? btn('أسند ' + nm(SEL_N),'btn-primary btn-sm',' data-asn="1"') : '')
    + '</form>');
}

/* ── الرسم: لا يُعاد إن لم يتغيّر شيء ── */
var RENDER_CUR = '';   /* آخرُ صفحةٍ رُسمت — لتمييز الانتقال من إعادة الرسم */
var RENDER_KEY = '', RENDER_N = 0;

function renderKey(){
  return CUR + '|' + ROLE + '|' + LANG + '|' + STAT_VER + '|' + SITE_Q + '|' + LIST_SHOWN
       + '|' + FILT.zone + '|' + FILT.type + '|' + FILT.work + '|' + DETAIL_ID
       + '|' + (MAP_SAT?1:0) + '|' + (MAP_FILT_OPEN?1:0) + '|' + (MYPOS?1:0) + '|' + MOVE_ID
       + '|' + Object.keys(STATE.recs).length + '|' + Object.keys(STATE.inss).length
       + '|' + (ASN_OPEN?1:0) + '|' + SEL_N + '|' + STAGE_TAB + '|' + CTEAM_CUR + '|' + ASN_TO
       + '|' + (BASE?BASE.ver:0) + '|' + CHANGES.length + '|' + NCRS.length
       + '|' + IPCS.length + '|' + HSE.incidents.length + '|' + REP_SIDE + '|' + SOP_CUR + '|' + ASN_MODE + '|' + ASN_TEAM + '|' + (ASN_PICK?1:0) + '|' + (HELP_OPEN?1:0) + '|' + (ASSIST_OPEN?1:0) + '|' + (QUEUE_OPEN?1:0) + '|' + PHOTO_Q.length + '|' + (DRV.ready?1:0) + '|' + (SEL_MODE?1:0) + '|' + (MAP_SELECT?1:0)
       + '|' + (MY_ONLY?1:0) + '|' + Object.keys(STATE.tasks).length
       + '|' + (POP_OPEN?1:0) + '|' + (EXP_OPEN?1:0) + '|' + (CO_OPEN?1:0)
       + '|' + CO_SEL.length + '|' + FIELD_MODE + '|' + NAV_Q + '|' + CREW_VIEW
       + '|' + PLAN_MONTHS + '|' + CFG_VER;
}

var CFG_VER = 0;

/* ── السحبُ الفارقي: ما تغيّر بعد آخر مزامنةٍ وحده ── */
/* ═══ من فوقُ يرى ما تحته ═══
   كان السحبُ ثلاثَ طبقات: «التيّارُ الخامُ» لمن يعتمد (مهندسٌ ومدير)، و«الأرقامُ
   وحدَها» لمن يضبط، و«ما كتبتُه أنا» للباقين — فالإدارةُ العليا (لا تعتمد ولا
   تضبط) والمشرفُ سقطا في الطبقة الثالثة: لا يريان زيارةً ولا تركيبًا ولا
   إسنادًا كتبه من دونهما. والمؤشِّرُ كان «آخر مزامنة» التي صارت (V15.96) تُبدَّل
   مع كلِّ إنصاتٍ ونبض — فيقفز أمامَ ما لم يُسحَب بعدُ ويضيع الفارقُ إلى الأبد:
   المديرُ يزامِن ولا يرى ما أسنده المهندسُ قبل عشر دقائق. وسقفُ خمسمئةٍ في
   السحبة الباردة يُسقِط ما فوقه من ألفٍ وسبعمئة نقطة.
     صار النطاقُ بالرتبة: المشرفُ فما فوق (والإدارةُ العليا) يسحبون العملَ كلَّه —
   زياراتٍ وتركيباتٍ وإسناداتٍ وفكًّا وصيانة؛ والوزارةُ الأرقامَ؛ والميدانُ ما
   كتبه هو. والمؤشِّرُ لكلِّ مجموعةٍ وقتُ آخرِ سحبةٍ ناجحةٍ لها — بتداخلِ دقيقتين —
   ويُحفَظ على الجهاز فلا تُعاد السحبةُ الباردةُ مع كلِّ فتح. */
var PULL_COL = { recs:'recs', inss:'inss', tasks:'tasks', dismantles:'diss', maints:'maints', stats:'stats',
                 events:'evlog' };   /* الأثرُ: مجموعتُه «events» ومفتاحُه في الحالة «evlog» */
/* ═══ نطاقُ السحب — V16.11 ═══
   كان كلُّ من رتبتُه فوق المشرف يسحب السجلاتِ كلَّها خامًّا كلَّ خمس دقائق، ويُنصِت
   إليها كلِّها فوق ذلك — فتُحسَب القراءةُ مرتين على كلِّ جهازٍ من ثلاثةٍ وعشرين،
   وميزانيةُ اليوم تسعةُ أضعافِ الحصة. صار:
   · الإدارةُ (مديرُ المشروع والإدارةُ العليا وصاحبُ المشروع): الكلُّ خامًّا.
   · من دونها إلى المشرف: **شجرتُه** — من تحته إلى آخر الفرع (underNames)، لا غير.
   · الوزارةُ: الأرقامَ وحدَها. · الميدانُ: ما كتبه هو، كلَّ نصف ساعة.
   ومن له إنصاتٌ حيٌّ لا يسحب دوريًّا — الإنصاتُ يسلّم التغييرَ مرةً، والسحبُ
   شبكةُ أمانٍ كلَّ ستِّ ساعاتٍ وعند الطلب. */
var ALL_WORK = ['recs','inss','tasks','dismantles','maints'];
function pullScope(){
  var r = effRole(ROLE);
  /* المهندسون كالإدارة: أيُّ نقطةٍ تُنجَز تصل اعتمادُها كلَّ مهندسٍ لا مهندسَ شجرتها
     وحدَه — قرارُ صاحب المشروع، وثمنُه على Blaze سنتاتٌ لا سقف */
  /* الأثرُ التدقيقيُّ للمكتب: من فعل ماذا ومتى — يُقرأ ولا يُكتَب إلا ممن يعمل */
  if (r === 'exec' || r === 'admin' || isBossHere() || rankOf(ROLE) >= rankOf('engineer')) return { cols:ALL_WORK.concat(['events']), mine:false, tree:false, every:600000 };
  /* والمشرفون كذلك: قرارُ صاحب المشروع أن يرى المشرفُ زياراتِ الفنيّين كلَّها لا
     فنيّيه وحدَهم — فمشرفٌ يفتح الخريطةَ يرى ما تمّ في المشعر كلِّه لا جزءًا منه.
     والشجرةُ تبقى للتكليف والمتابعة (لوحةُ الفريق) لا للرؤية. */
  if (rankOf(ROLE) >= rankOf('supervisor')) return { cols:ALL_WORK, mine:false, tree:false, every:600000 };
  /* الوزارةُ: الأرقامُ لِلَوحاتها، والزياراتُ والتركيباتُ لتلوين الخريطة — قراءةً
     فقط. وكانت تسحب اللقطاتِ وحدَها فتظهر لها الخريطةُ رماديةً بلا حالة. */
  /* الوزارةُ تُسلَّم حساباتِها وتسأل: ماذا انتهى، وماذا يجري الآن ومن يفعله،
     وماذا سيحدث غدًا — والمهامُّ والفكُّ والصيانةُ جزءٌ من الجواب. تقرأ العملَ كلَّه
     كالمكتب وتُنصِت إليه لحظةً بلحظة، ولا تكتب حرفًا: القاعدةُ تمنعها. */
  if (r === 'viewer') return { cols:ALL_WORK.concat(['stats']), mine:false, tree:false, every:600000 };
  /* الميدانُ يُنصِت إلى ما كتبه هو (اعتمادٌ أو ردٌّ من المكتب يصل حيًّا) — والسحبُ
     الدوريُّ كان ثمانيةً وأربعين استعلامًا فارغًا في اليوم لكلِّ جهازٍ من مئةٍ وربع */
  return { cols:['recs','inss','dismantles','maints'], mine:true, tree:false, every:21600000 };
}
/* شجرتي في القاعدة: المعرِّفاتُ لمن كتب، والأسماءُ لمن أُسنِد إليه — وأنا معهم */
function treeKeys(){
  var names = underNames(STATE.meta.name || ''), U = STATE.users || {}, uids = [];
  Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name && names.indexOf(u.name) > -1) uids.push(k); });
  if (STATE.meta.uid) uids.push(STATE.meta.uid);
  if (STATE.meta.name) names = names.concat([STATE.meta.name]);
  return { uids:uids, names:names, sig:uids.slice().sort().join('|') };
}
/* «in» في القاعدة ثلاثون قيمةً في الاستعلام — فتُقسَّم */
function chunk30(a){ var out = []; for (var i = 0; i < a.length; i += 30) out.push(a.slice(i, i + 30)); return out; }
function treeQuery(c, k){ return { fld: c === 'tasks' ? 'to' : '_by', keys: c === 'tasks' ? k.names : k.uids }; }
function pullDelta(opt){
  if (!FB.ready || !FB.db) return Promise.resolve(0);
  var sc = pullScope(), got = 0, me = STATE.meta.uid, T_P0 = Date.now();
  var _perfDone = function(v){ perfNote('p', Date.now() - T_P0); return v; };
  /* سحبٌ موجَّه: النبضةُ تقول أيَّ مجموعاتٍ تغيّرت فتُسحَب هي وحدَها (V17.26) */
  if (opt && Array.isArray(opt.only) && opt.only.length)
    sc = Object.assign({}, sc, { cols:sc.cols.filter(function(c){ return opt.only.indexOf(c) > -1; }) });
  var at = STATE.meta.pullAt || (STATE.meta.pullAt = {});
  var wasAsk = PULL_ASK; PULL_ASK = false;
  if (!sc.cols.length){ STATE.meta.lastSync = Date.now(); return Promise.resolve(0); }
  /* ═══ المؤشِّرُ يتبع النطاق ═══
     الفارقيُّ يجلب ما كُتب بعد آخر سحبة. فإن اتّسع النطاقُ — شجرةٌ تغيّرت، أو
     مشرفٌ صار يرى الكلَّ بعد أن كان يرى فنيّيه، أو رُقّي دورُه — بقي المؤشِّرُ
     على حاله فلا يُجلَب إلا الجديدُ، وما كتبه الآخرون **قبل** التوسيع لا يصل
     أبدًا: يفتح المشرفُ الخريطةَ فيرى شغلَه وحدَه ويظنُّ الصلاحيةَ ناقصة.
     فالبصمةُ صارت للنطاق كلِّه — أيُّ تبدّلٍ فيه يُصفّر المؤشِّرَ ويسحب باردًا. */
  var tk = sc.tree ? treeKeys() : null;
  var sig = effRole(ROLE) + '|' + sc.cols.join(',') + '|' + (sc.mine ? 'mine' : 'all') + '|' + (tk ? tk.sig : '-');
  if (at.__sig !== sig){ sc.cols.forEach(function(c){ delete at[c]; }); at.__sig = sig; COLD_N++; }
  return Promise.all(sc.cols.map(function(c){
    var key = PULL_COL[c] || c;
    if (!STATE[key]) STATE[key] = {};
    var start = Date.now();
    var since = (at[c] || 0) - 120000;
    var qs = [];
    if (tk){
      var tq = treeQuery(c, tk);
      chunk30(tq.keys).forEach(function(k){ qs.push(DB.col(c).where(tq.fld, 'in', k)); });
    } else {
      var q = DB.col(c);
      if (sc.mine && c !== 'stats' && me) q = q.where('_by', '==', me);
      qs.push(q);
    }
    if (!qs.length) return Promise.resolve();
    /* السحبةُ الباردةُ بلا سقفٍ يقطع: ألفٌ وسبعمئةٌ زيارةٌ لا تُقصّ عند خمسمئة */
    return Promise.all(qs.map(function(q){
      if (since > 0) q = q.where('_at', '>', since);
      return q.limit(since > 0 ? 2000 : 6000).get().then(function(snap){
        FB.readCount = (FB.readCount || 0) + snap.size;
        snap.forEach(function(doc){ if (CORE.applyDoc(key, doc.id, doc.data())) got++; });
        FB.readCount = (FB.readCount || 0) + snap.size;
      });
    })).then(function(){ at[c] = start; }).catch(function(e){
      /* بلا هذا يقف السحبُ صامتًا: المكتبُ يفتح فلا يجد ما رفعه الميدانُ
         ولا يعرف أن السحبَ سقط أصلًا. */
      softErr('سحب ' + c, e, 'تعذّر سحبُ بعض البيانات — جرّب المزامنةَ يدويًّا');
    });
  })).then(function(){
    STATE.meta.lastSync = Date.now();
    PULL_LAST = Date.now();
    if (got || wasAsk){ statBump(); CORE.saveSoon(); }
    return _perfDone(got);
  });
}

/* ═══ سحبٌ فارقيٌّ لمجموعةٍ صغيرة ═══
   المجموعاتُ التي لا تدخل نطاقَ pullDelta (سجلُّ الصور وسجلُّ الصيانة) كانت
   تُسحَب كاملةً في كلِّ إقلاع. صارت تُسحَب كما يُسحَب غيرُها: ما كُتب بعد
   آخر سحبةٍ فقط، وبسقفٍ يقطع؛ وأوّلُ مرةٍ على الجهاز تُسحَب الأحدثُ وحدَها.
   ويُحصى ما قُرئ في عدّاد القراءات — فما يكلّف يُرى. */
/* ═══ سقفُ القراءات لكلِّ جهاز (V17.26) ═══
   جهازٌ واحدٌ في حلقةٍ خاطئة يستهلك حصةَ المشروع كلَّها وحدَه، ولا يُعرَف
   إلا آخرَ الشهر. فيُحصى ما يقرؤه الجهازُ في اليوم: إن تجاوز ثلاثةَ آلافٍ
   قيل لصاحبه، وإن تجاوز ستةَ آلافٍ تباطأ السحبُ الدوريُّ إلى الربع ونُبِّه
   المكتبُ بحدث — والإنصاتُ والنبضةُ يبقيان فلا يتعطّل العمل. */
/* السقفان (V17.36): كان الإبطاءُ عند ستة آلافٍ وبمعامل أربعة — فأصاب جهازَ
   مدير المشروع في يومٍ عاديٍّ (سحبةٌ باردةٌ وسجلُّ صورٍ وسجلُّ أحداث) وصار
   «السحبُ التالي» أربعين دقيقةً بلا تفسير. الإبطاءُ لجهازٍ جامحٍ لا لمن يعمل:
   خمسةَ عشرَ ألفًا في اليوم، وبمعامل اثنين لا أربعة، ويُقال السببُ في الشريط. */
var READ_CAP_WARN = 5000, READ_CAP_SLOW = 15000, READ_DAY = '', READ_DAY_N = 0, READ_WARNED = 0;
function readBudget(){
  var day = dayKey(Date.now());
  if (READ_DAY !== day){ READ_DAY = day; READ_DAY_N = FB.readCount || 0; READ_WARNED = 0; }
  var n = (FB.readCount || 0) - READ_DAY_N;
  if (n > READ_CAP_SLOW && READ_WARNED < 2){
    READ_WARNED = 2;
    logEvent('جهازٌ تجاوز سقفَ القراءات — ' + nm(n) + ' قراءةً اليوم · أُبطئ سحبُه');
    toast(t('هذا الجهازُ يقرأ أكثرَ من المعتاد — أُبطئ السحبُ الدوريُّ حفاظًا على حصة المشروع'));
  } else if (n > READ_CAP_WARN && READ_WARNED < 1){
    READ_WARNED = 1;
    toast(t('قراءاتُ هذا الجهاز اليوم') + ': ' + nm(n) + ' — ' + t('تُراقَب'));
  }
  return n;
}
function readSlowFactor(){ return readBudget() > READ_CAP_SLOW ? 2 : 1; }
function readDelta(col, key, cap){
  if (!FB.ready || !FB.db) return;
  if (!STATE[key]) STATE[key] = {};
  var at = STATE.meta.pullAt || (STATE.meta.pullAt = {});
  var since = (at['@' + col] || 0) - 120000, start = Date.now();
  var q = DB.col(col);
  q = since > 0 ? q.where('_at', '>', since).limit(cap)
                : q.orderBy('_at', 'desc').limit(cap);
  q.get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    sn.forEach(function(dd){ STATE[key][dd.id] = dd.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    at['@' + col] = start; CORE.saveSoon();
  }).catch(function(e){
    /* لا مؤشِّرَ على وثائقَ قديمةٍ كُتبت قبل المؤشِّر: تُسحَب مرةً بالأحدث */
    if (since > 0){ at['@' + col] = 0; readDelta(col, key, cap); return; }
    softErr('سحب ' + col, e, '');
  });
}

/* ═══ الإنصاتُ لنبضة التغيير (V17.26) ═══
   وثيقةٌ واحدةٌ تُراقَب: settings/pulse. لا تكلّف قراءةً وهي ساكنة، وحين
   تتغيّر يُقارَن وقتُ كلِّ مجموعةٍ فيها بمؤشِّر سحبِ هذا الجهاز؛ فإن كان في
   القاعدة أحدثُ مما عندنا سُحب فارقُ تلك المجموعة وحدَها — مجمَّعًا بثانيتين
   حتى لا تتوالى السحباتُ على دفعةٍ من عشر وثائق. */
var PULSE_UNSUB = null, PULSE_T = 0, PULSE_LAST = 0;
function pulseWatch(){
  if (!FB.ready || !FB.db || PULSE_UNSUB) return;
  try {
    PULSE_UNSUB = DB.col('settings').doc('pulse').onSnapshot(function(doc){
      if (!doc.exists || (doc.metadata && doc.metadata.fromCache)) return;
      FB.readCount = (FB.readCount || 0) + 1;
      var p = doc.data() || {}, at = STATE.meta.pullAt || {}, mine = pullScope().cols || [];
      var stale = mine.filter(function(col){ return (+p[col] || 0) > (+at[col] || 0); });
      if (!stale.length) return;
      PULSE_LAST = Date.now();
      clearTimeout(PULSE_T);
      PULSE_T = setTimeout(function(){
        if (typeof pullDelta === 'function') pullDelta({ only:stale, why:'pulse' }).then(function(n){
          if (n && CUR === 'map' && typeof mapPaint === 'function') mapPaint();
          else if (n) render(1);
        }).catch(function(e){ softErr('سحب التغييرات', e, ''); });
      }, 2000);
    }, function(e){ softErr('الإنصاتُ للتغييرات', e, ''); });
  } catch (e){ softErr('الإنصاتُ للتغييرات', e, ''); }
}
function pulseStop(){ if (PULSE_UNSUB){ try { PULSE_UNSUB(); } catch (e){} PULSE_UNSUB = null; }
  if (BRIDGE_UNSUB){ try { BRIDGE_UNSUB(); } catch (e){} BRIDGE_UNSUB = null; } }
/* ختمُ الجسر: وثيقةٌ واحدةٌ يكتبها الخادمُ بعد كلِّ تشغيلٍ — تُقرأ عند تغيّرها فقط (V17.39) */
var BRIDGE_UNSUB = null;
function bridgeWatch(){
  if (!FB.ready || !FB.db || BRIDGE_UNSUB) return;
  try {
    BRIDGE_UNSUB = DB.col('settings').doc('bridge').onSnapshot(function(doc){
      if (!doc.exists || (doc.metadata && doc.metadata.fromCache)) return;
      FB.readCount = (FB.readCount || 0) + 1;
      STATE.bridge = doc.data() || {};
      if (CUR === 'sys') render(1);
    }, function(e){ softErr('ختم الجسر', e, ''); });
  } catch (e){ softErr('ختم الجسر', e, ''); }
}

/* استماعٌ حيٌّ محدودٌ بما يخصّ المستخدم — لا بالمجموعة كلها */
var LIVE = [];
function liveWatch(){
  if (!FB.ready || !FB.db || LIVE.length) return;
  try{
    /* الحقلُ في المهمة اسمٌ (to/assignedTo) والمقارنةُ كانت بالمعرِّف — فلم
       يُطابَق شيءٌ قطُّ ولم تصل مهمةٌ ولا حذفٌ حيًّا: يرى الفنيُّ إسنادًا
       مُسح من المكتب أيامًا. */
    var me = STATE.meta.name || '\u0000';
    LIVE.push(DB.col('tasks').where('assignedTo', '==', me).limit(200)
      .onSnapshot(function(snap){
        snap.docChanges().forEach(function(ch){
          if (ch.type === 'removed'){ delete STATE.tasks[ch.doc.id]; if (typeof TK_IX !== 'undefined') TK_IX = null; }
          else CORE.applyDoc('tasks', ch.doc.id, ch.doc.data());
        });
        statBump();
        if (['map','sites','mywork'].indexOf(CUR) > -1) render();
      }, function(e){
        /* الاستماعُ إن مات لم تصل المهامُّ الجديدةُ ولا شيءَ يقول */
        softErr('الاستماع الحيّ', e, 'انقطع الاستماعُ الحيّ — المهامُّ الجديدةُ قد تتأخّر');
      }));
  }catch(e){
    /* التجهيزُ إن مات لم يُنشَأ استماعٌ أصلًا — فلا مهامَّ تصل ولا خطأ يُرى */
    softErr('تجهيز الاستماع', e, 'تعذّر الاستماعُ الحيّ — زامِن يدويًّا لتصلك المهامّ');
  }
}

function liveStop(){
  LIVE.forEach(function(u){ try{ u(); }catch(e){} });
  LIVE = [];
}

/* ── حدودُ الاستهلاك — تُعرَض للمهندس ── */
/* ═══ الخريطة — Leaflet بطبقتين ومضلّعات المخيمات ═══
   البلاطات بلا مفتاح: OpenStreetMap أساسًا وEsri بديلًا عند التعثّر.
   والوضع الليلي مرشّحٌ على طبقة الأساس وحدها فلا يُقلَب ما فوقها. */

var MAP_ME = null;
var MAP = null, MAP_LAYER = null, MAP_TMP = null, MAP_BASE = null, MAP_POLY = null, MAP_CV = null, MAP_ME_LL = null;
var MAP_READY = false, MAP_LOADING = false;
/* حدُّ رسمِ حدود المخيمات — مصدرٌ واحدٌ يقرؤه الرسمُ والتحميلُ معًا (قرارٌ قائم: المخيمُ بحدوده عند ١٢ فتبقى متفرّدةً).
   (V25.3) قياس: عند ١٢ نحو ١٬٤٠٠ مضلّعٍ تُنشأ وتُقصّ وتُرسَم مع كلِّ حركة — رفعُ الحدِّ إلى ١٤ يُسرّع التبعيدَ كثيرًا، وهو قرارٌ للمالك */
var POLY_Z = 12;
var POLY = null, POLY_LOADING = null;

/* بيانةُ الموسم الماضي التي كان الفنيُّ يقرؤها في القديم: الجنسيةُ والسعةُ
   المسجَّلةُ والجهةُ والمتعهّد وما بقي مفتوحًا. سقطت عند إعادة البناء لأن
   الأعمدةَ اختُصرت، فصار الفنيُّ يقف أمام مخيمٍ لا يعرف عنه ما كان يعرفه. */
var S47 = null, S47_LOADING = null;
function s47Of(id){ return S47 ? (S47[id] || null) : null; }
function s47Load(){
  if (S47) return Promise.resolve(true);
  if (S47_LOADING) return S47_LOADING;
  S47_LOADING = idbGet('s47').then(function(v){
    if (v){ S47 = v; return true; }
    return fetch('season1447.json').then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (!j) return false; S47 = j; idbSet('s47', j); return true; });
  }).catch(function(e){
    softErr('بيانة الموسم الماضي', e, 'تعذّر جلبُ بيانة الموسم الماضي — النموذجُ يعمل بدونها');
    return false;
  }).then(function(ok){ if (ok && CUR === 'svForm') render(1); return ok; });
  return S47_LOADING;
}

/* المضلّعات ملفٌّ خارجيٌّ يُطلَب مرةً ويُخزَّن محليًّا */
function polyLoad(){
  if (POLY) return Promise.resolve(true);
  if (POLY_LOADING) return POLY_LOADING;
  POLY_LOADING = idbGet('poly').then(function(v){
    if (v){ POLY = v; return true; }
    return fetch('poly.json').then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if (!j) return false;
        POLY = j;
        idbSet('poly', j);
        return true;
      });
  }).catch(function(e){
    softErr('حدود المخيمات', e, 'تعذّر جلبُ حدود المخيمات — الخريطةُ تعمل بلا حدود');
    return false;
  }).then(function(ok){ if (ok && MAP) mapPaint(); return ok; });
  return POLY_LOADING;
}

var TILES = {
  osm:  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

/* ألوان الحالة — المسح ثنائيٌّ والتركيب رباعي */
var MAP_COL = {
  survey:  { 'لم يُزر':'#E8C34B', 'تمت الزيارة':'#4BC9F5' },
  install: { 'لم يبدأ':'#9FB0AA', 'مجدول':'#FF8C42', 'مُركّب':'#3AD6A0', 'متعذّر':'#E05252' }
};



/* ═══ محضرُ التسليم ═══
   «جاهزٌ للتسليم» كان يعدُّ ما رُكِّب واعتُمد، و«سُلِّم» صفرًا مكتوبًا — لأن
   التسليمَ لم يكن فعلًا في النظام أصلًا. وهو حلقةٌ لازمة: ما رُكِّب يُسلَّم
   للعميل بمحضرٍ يحمل رقمَه وتاريخَه ومن سلَّم ومن استلم، ومنه تبدأ مدةُ
   الضمان، وقبله لا يُفكُّ شيء — فالفكُّ إرجاعُ ما سُلِّم.
     ويُحفَظ المحضرُ على سجل التركيب نفسِه (`inss[id].hand`): هو الوثيقةُ
   التي تصف ما رُكِّب، والتسليمُ خاتمتُها لا سجلٌّ منفصلٌ يُتَتبَّع. */
var HAND_SEQ = 0;
function handNext(){
  HAND_SEQ = (HAND_SEQ || 0) + 1;
  CORE.set('cfg', 'handSeq', { n:HAND_SEQ });
  var n = String(HAND_SEQ);
  while (n.length < 4) n = '0' + n;
  return 'HO-' + n;
}
function handOf(id){
  var r = STATE.inss[id];
  return (r && r.hand) || null;
}
function handReady(x){
  var r = STATE.inss[x.id];
  return !!(r && r.status === 'مُركّب' && r.approved && !r.hand);
}
function handDone(id){ return !!handOf(id); }
/* بلاغٌ جوهريٌّ مفتوحٌ على النقطة يمنع تسليمَها وحدَها — لا يمنع غيرَها */
function handBlock(id){
  if (typeof NCRS === 'undefined') return null;
  return NCRS.filter(function(n){
    return n.site === id && n.st !== 'مغلق' && n.sev === 'جوهري'; })[0] || null;
}
function handSave(id, to, note){
  if (!may('approve')){ toast(t('التسليمُ للمهندس وحده')); return false; }
  var r = STATE.inss[id];
  if (!r || r.status !== 'مُركّب' || !r.approved){
    toast(t('لا تُسلَّم نقطةٌ لم يُعتمَد تركيبُها')); return false;
  }
  if (r.hand){ toast(t('سُلِّمت بالفعل')); return false; }
  var blk = handBlock(id);
  if (blk){ toast(t('بلاغٌ جوهريٌّ مفتوحٌ يمنع التسليم') + ' \u00b7 ' + (blk.no || blk.id || '')); return false; }
  to = String(to || '').trim();
  if (!to){ toast(t('اكتب اسم المستلِم من العميل')); return false; }
  r.hand = { no:handNext(), at:Date.now(), by:STATE.meta.name || '',
             to:to, note:String(note || '').trim(),
             warranty:cfgN(cfgGet('warranty') || 12) };
  CORE.set('inss', id, r);
  logEvent('تسليم نقطة — ' + id + ' \u00b7 ' + r.hand.no + ' \u00b7 ' + to, id);
  stepDone('hand', id, r.hand.no, 0);
  notifPush('تسليم', id + ' \u00b7 ' + t('سُلِّمت للعميل') + ' \u2014 ' + r.hand.no, { site:id, lv:'عادي' });
  statBump();
  return true;
}
/* ── محضرٌ لنقطةٍ واحدة ── */

/* ═══ محضرُ الاستلام الرسميّ ═══
   المحضرُ الذي يُسلَّم للوزارة نموذجٌ لها لا لنا: ترويسةُ المملكة والوزارة
   والوكالة، ثم المشروعُ والمقاولُ والاستشاري، ثم الأعمالُ بمكانها ورقمها،
   ثم البنودُ بأعدادها وسيرياتها، ثم التعهدُ والتوقيعاتُ والاعتماد.
     ولكلِّ نوعٍ نموذجُه: المخيّمُ يذكر رقمَه والشركةَ المستلمة، والممرُّ
   يذكر اسمَه ورقمَ مظلته ويُقدَّم للوزارة نفسِها، والمحطةُ والجمراتُ ومسجدُ
   نمرة وكاميرا الوزارة كلٌّ بعنوانه وبنوده. وأسماءُ المعتمِدين وصفاتُهم
   وجهاتُهم تُضبَط مرةً في «ثوابت النظام» فتُطبَع في كلِّ محضر — كانت تُكتَب
   باليد في كلِّ مرة أو تُترَك فارغةً فيُرَدُّ المحضر. */
/* تُضبَط مرةً في «ثوابت النظام» وتُطبَع في كلِّ محضر */
function hoSetParty(k, v){
  if (!may('settings')){ toast(t('ضبطُ المحضر للمهندس وحده')); return; }
  CFG.hoParties = CFG.hoParties || {};
  CFG.hoParties[k] = String(v || '').trim();
  CORE.set('cfg', 'hoParties', Object.assign({}, CFG.hoParties));
}
function hoSetSigner(i, k, v){
  if (!may('settings')){ toast(t('ضبطُ المحضر للمهندس وحده')); return; }
  var L = hoSigners().map(function(x){ return Object.assign({}, x); });
  if (!L[i]) return;
  L[i][k] = String(v || '').trim();
  CFG.hoSigners = L;
  CORE.set('cfg', 'hoSigners', L);
}
function hoSetupCard(){
  var P = ['owner','agency','project','contractor','consultant'];
  var LB = { owner:'الجهة المالكة', agency:'الوكالة', project:'اسم المشروع',
             contractor:'المقاول', consultant:'الاستشاري' };
  return card('\u{1F4C4} ' + t('ترويسةُ محضر الاستلام'),
      '<div class="grid cols-2">'
      + P.map(function(k){
          return '<div class="field"><label>' + esc(t(LB[k])) + '</label>'
            + '<input data-hop="' + k + '" value="' + esc(hoParty(k)) + '" dir="auto"></div>';
        }).join('')
      + '</div>'
      + cardFlush(t('المعتمِدون'),
          table(['م','الاسم','صفته','الجهة'],
            hoSigners().map(function(g, i){
              return [N(i + 1),
                '<input data-hosn="' + i + '" value="' + esc(g.n || '') + '" dir="auto" placeholder="' + esc(t('الاسم')) + '">',
                '<input data-hosr="' + i + '" value="' + esc(g.role || '') + '" dir="auto">',
                '<input data-hoso="' + i + '" value="' + esc(g.org || '') + '" dir="auto">'];
            })))
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُكتَب مرةً فتُطبَع في كلِّ محضرٍ لكلِّ نوع — كانت تُملأ باليد في كلِّ مرة أو تُترَك فارغةً فيُرَدُّ المحضر.')) + '</p>');
}
var HO_PARTIES = { owner:'وزارة الحج والعمرة', agency:'وكالة التخطيط والتحول الرقمي',
                   contractor:'آفاقي', consultant:'شركة علم',
                   project:'مشروع قارئات أفاقي' };
var HO_SIGNERS = [
  { n:'', role:'مدير برامج رقمية', org:'وزارة الحج والعمرة' },
  { n:'', role:'مدير البرنامج',    org:'شركة آفاقي' },
  { n:'', role:'مدير المشروع',     org:'شركة آفاقي' },
  { n:'', role:'مهندس الموقع',     org:'شركة آفاقي' }
];
/* نموذجٌ لكلِّ نوع: عنوانُه، وحقلُ موضعه، ومن يُقدَّم إليه، وتعهُّدُه */
var HO_TPL = {
  'مخيم':   { t:'محضر استلام عهدة',           loc:'رقم المخيم',   to:'شركة تقديم الخدمة',
              pledge:'تتعهد الشركة ({co}) بتسليم الأجهزة سليمةً بعد الموسم بموجب محضر تسليمٍ كما استلمتها بلا خدوشٍ أو كسور.' },
  'ممر':    { t:'محضر استلام الممرات',        loc:'اسم الممر ورقم المظلة', to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا مع تشغيل القارئ والكاميرا والتأكد من عملهما بكفاءة.' },
  'محطة':   { t:'محضر استلام محطات القطار',   loc:'اسم المحطة والبوابة',   to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا ومربوطًا بشبكة المحطة، ويُتأكَّد من عمله بكفاءة.' },
  'جسر':    { t:'محضر استلام الجمرات',        loc:'الدور والمدخل',         to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا في موضعه من الجسر ويُتأكَّد من عمله بكفاءة.' },
  'بوابة':  { t:'محضر استلام مسجد نمرة',      loc:'البوابة',               to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا عند البوابة ويُتأكَّد من عمله بكفاءة.' },
  'كاميرا': { t:'محضر استلام كاميرات الوزارة', loc:'الموضع',               to:'وزارة الحج والعمرة',
              pledge:'تُسلَّم الكاميرا مركَّبةً ومربوطةً ومُختبَرةً على شبكة الوزارة.' },
  'مبنى':   { t:'محضر استلام المباني',        loc:'المبنى والدور',         to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا في موضعه ويُتأكَّد من عمله بكفاءة.' }
};
function hoTpl(x){ return HO_TPL[x && x.type] || HO_TPL['مخيم']; }
function hoParty(k){ return (CFG.hoParties || {})[k] || HO_PARTIES[k]; }
function hoSigners(){
  var L = CFG.hoSigners;
  return (Array.isArray(L) && L.length) ? L : HO_SIGNERS;
}
function hoLocOf(x){
  if (!x) return '';
  var T = hoTpl(x);
  var bits = [];
  if (x.sq)   bits.push(x.sq);
  if (x.sign) bits.push(x.sign);
  if (x.name && x.name !== x.sq) bits.push(x.name);
  return bits.join(' \u00b7 ') || '\u2014';
}
/* صفوفُ البنود: من قطع التركيب وسيرياتها — لا تُكتَب باليد */
function hoItems(id){
  var r = STATE.inss[id] || {};
  return Object.keys(r.parts || {}).map(function(k){
    return { item:itemName(k), qty:cfgN(r.parts[k]), sn:(r.serials || {})[k] || '' };
  });
}
function handDocSite(id){
  var s = siteFind(id), r = STATE.inss[id], h = handOf(id);
  if (!s || !r) return '';
  var T = hoTpl(s), IT = hoItems(id);
  var end = h ? new Date(h.at + (h.warranty || cfgGet('warranty') || 12) * 30 * 86400000) : null;
  var hijri = function(ms){
    try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'numeric', year:'numeric' }).format(new Date(ms)); }
    catch (e){ return fmtDate(ms); }
  };
  return '<div class="hdoc">'
    /* ترويسةُ الجهة — كما في نموذج الوزارة */
    + '<div style="text-align:center;line-height:1.7;margin:0 0 10px">'
    +   '<div>' + esc(t('المملكة العربية السعودية')) + '</div>'
    +   '<div><strong>' + esc(hoParty('owner')) + '</strong></div>'
    +   '<div class="hint" style="margin:0">' + esc(hoParty('agency')) + '</div>'
    + '</div>'
    + '<h3 style="margin:0 0 10px;text-align:center">' + esc(t(T.t)) + '</h3>'

    + table(['البند','البيان','البند','البيان'], [
        [esc(t('اسم المشروع')), esc(hoParty('project')), esc(t('المقاول')), esc(hoParty('contractor'))],
        [esc(t('الاستشاري')), esc(hoParty('consultant')), esc(t('نوع التقديم')), esc(t(h && h.re ? 'إعادة تقديم' : 'جديد'))],
        [esc(t('رقم المحضر')), h ? '<span class="num">' + esc(h.no) + '</span>' : pill('لم يُسلَّم بعد','warn'),
         esc(t('تاريخ المحضر')), h ? '<span class="num">' + esc(hijri(h.at)) + '</span>' : '\u2014'],
        [esc(t('مكان الأعمال')), esc(t(s.zone)), esc(t(T.loc)), '<span class="num">' + esc(hoLocOf(s)) + '</span>']
      ])

    + '<h4 style="margin:14px 0 6px">' + esc(t('الأعمال')) + '</h4>'
    + table(['البند','العدد','السيريال'],
        (IT.length ? IT : [{ item:'\u2014', qty:0, sn:'' }]).map(function(o){
          return [esc(o.item), N(o.qty), o.sn ? '<span class="num" dir="ltr">' + esc(o.sn) + '</span>' : '\u2014'];
        }),
        ['<b>' + t('الإجمالي') + '</b>', N(IT.reduce(function(a, o){ return a + o.qty; }, 0)), ''])

    + table(['البند','البيان'], [
        [esc(t('يُقدَّم إلى')), esc(T.to === 'شركة تقديم الخدمة' ? (coName(s.co) || t(T.to)) : t(T.to))],
        [esc(t('بادئة الشبكة')), s.net ? '<span class="num">' + esc(s.net) + '</span>' : '\u2014'],
        [esc(t('تاريخ التركيب')), '<span class="num">' + esc(fmtDate(r.at || 0)) + '</span>'],
        [esc(t('نفّذه')), esc(dispName(r.by) || '\u2014')],
        [esc(t('اعتمده')), esc(dispName(r.qaBy || r.apprBy || '') || '\u2014')],
        [esc(t('سلَّم')), h ? esc(dispName(h.by)) : '\u2014'],
        [esc(t('استلم عن العميل')), h ? esc(h.to) : '\u2014'],
        [esc(t('نهاية الضمان')), end ? '<span class="num">' + esc(fmtDate(end)) + '</span>' : '\u2014']
      ])

    + '<p style="margin:12px 0 4px"><strong>' + esc(t('تعهدات الاستلام')) + ':</strong> '
    +   esc(String(T.pledge).replace('{co}', coName(s.co) || '')) + '</p>'
    + (h && h.note ? '<p class="hint">' + esc(t('ملاحظات المشرف')) + ': ' + esc(h.note) + '</p>' : '')
    + '<p class="hint">' + esc(t('اعتمادُ الأعمال لا يُعفي المقاولَ من مسؤولياته التعاقدية والقانونية.')) + '</p>'

    + '<h4 style="margin:14px 0 6px">' + esc(t('الاعتماد')) + '</h4>'
    + table(['م','الاسم','صفته','الجهة','التوقيع'],
        hoSigners().map(function(g, i2){
          return [N(i2 + 1), esc(g.n || '\u2014'), esc(t(g.role)), esc(g.org),
                  '<div style="height:34px;border-bottom:1px dashed var(--line)"></div>'];
        }))
    + '</div>';
}

function handDocCo(co){
  var L = STATE.sites.filter(function(x){
    var r = STATE.inss[x.id];
    return x.co === co && r && r.status === 'مُركّب' && r.approved;
  });
  var done = L.filter(function(x){ return handDone(x.id); });
  var byType = {};
  L.forEach(function(x){ byType[x.type] = (byType[x.type] || 0) + 1; });
  var items = {};
  L.forEach(function(x){
    var r = STATE.inss[x.id];
    Object.keys(r.parts || {}).forEach(function(c){ items[c] = (items[c] || 0) + cfgN(r.parts[c]); });
  });
  return '<div class="hdoc">'
    + '<h3 style="margin:0 0 2px">' + esc(t('محضر تسليم شركة')) + '</h3>'
    + '<p class="hint" style="margin:0 0 12px">' + esc(co) + ' \u00b7 '
    + esc(t('قارئات أفاقي — RFID · موسم ١٤٤٨هـ')) + '</p>'
    + stats([['نقاطٌ مُركّبةٌ معتمدة', N(L.length), 'acc'],
             ['سُلِّمت', N(done.length), done.length === L.length && L.length ? 'ok' : 'wrn'],
             ['بانتظار التسليم', N(L.length - done.length), L.length - done.length ? 'wrn' : 'ok']])
    + (Object.keys(byType).length
      ? card(t('بالنوع'), table(['النوع','العدد'],
          Object.keys(byType).map(function(k){ return [esc(t(k)), N(byType[k])]; })))
      : '')
    + (Object.keys(items).length
      ? card(t('إجمالي الأجهزة المسلَّمة'),
          table(['الصنف','الكمية'],
            Object.keys(items).sort(function(a, b){ return items[b] - items[a]; })
              .map(function(c){ return [esc(itemName(c)), N(items[c])]; })))
      : '')
    + (L.length
      ? cardFlush(t('النقاط'), table(['النقطة','الاسم','الشبكة','رقم المحضر','التاريخ'],
          L.slice(0, 400).map(function(x){
            var h = handOf(x.id);
            return ['<span class="num">' + esc(x.id) + '</span>',
                    esc((x.name || '').slice(0, 34)),
                    x.net ? '<span class="num">' + esc(x.net) + '</span>' : '\u2014',
                    h ? '<span class="num">' + esc(h.no) + '</span>' : pill('لم يُسلَّم','warn'),
                    h ? '<span class="num">' + esc(fmtDate(h.at)) + '</span>' : '\u2014'];
          })))
      : '')
    + '<div class="grid cols-2" style="margin-top:18px">'
    + '<div><p class="hint" style="margin:0">' + esc(t('عن المنفِّذ — أفاقي')) + '</p>'
    +   '<div style="border-bottom:1px solid var(--line);height:42px"></div></div>'
    + '<div><p class="hint" style="margin:0">' + esc(t('عن العميل — الوزارة')) + '</p>'
    +   '<div style="border-bottom:1px solid var(--line);height:42px"></div></div>'
    + '</div></div>';
}