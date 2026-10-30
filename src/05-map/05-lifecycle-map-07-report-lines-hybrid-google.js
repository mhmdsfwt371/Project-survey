/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-07-report-lines-hybrid-google.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Report lines (Abar Mid), hybrid map with street names over satellite, and Google Maps inside our map.
   DEFINES : fontsCard, fontUp, gmapsCard, basemapSatCls, basemapKick, basemapNetOk, basemapDownload, basemapScripts, basemapAttach, namesFetch, namesLoad, namesLayerClass … (+9 more)
   GLOBALS : FONTS_MAX, NAMES, NAMES_FILE, NAMES_RANK, NAMES_PLACE, GMAP, SEL_IDS, IMP_COLS, IMP_PREVIEW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V28.9) خطوطُ التقارير — «Abar Mid» ═══
   قرارُ المالك: «دي الخطوط اللي يتكتب بيها التقرير». الباوربوينت يضمّنها من قالب الوزارة نفسِه. والـPDF يطبعه المتصفّح
   فيحتاج الخطَّ نفسَه: يرفعه المديرُ مرةً (العاديَّ والعريض) فيُحفَظ في وثيقة الإعدادات «fonts» — لا في المستودع العامّ لأن
   الخطَّ مرخَّص — ويُقرأ عند الطباعة وحدَها، فيُضمَّن في الـPDF ويُقرأ على أيِّ جهاز. */
PV.FONTS_MAX = 450 * 1024;
function fontsCard(){
  var F = CFG.fonts || {}, ed = may('settings');
  var st = function(k, l){ return '<span class="pill ' + (F[k] ? 'ok' : 'wrn') + '">' + (F[k] ? '\u2713 ' : '') + esc(t(l)) + (F[k + 'n'] ? ' \u00b7 ' + esc(F[k + 'n']) : '') + '</span>'; };
  return card('\u{1F524} ' + t('خطوط التقارير'),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('خطُّ الوزارة «Abar Mid» لملف الطباعة: ارفع ملفَّي العاديّ والعريض مرةً واحدة فيُضمَّنان في كلِّ تقريرٍ مطبوع. العرض التقديمي يضمّنه من قالب الوزارة نفسِه.')) + '</p>'
    + '<div class="chips" style="margin:0 0 8px">' + st('r', 'العادي') + ' ' + st('b', 'العريض') + '</div>'
    + (ed ? '<div class="grid cols-2"><div class="field"><label>' + esc(t('العادي (Regular)')) + '</label><input type="file" accept=".otf,.ttf,.woff,.woff2" data-fontup="r"></div>'
          + '<div class="field"><label>' + esc(t('العريض (Bold)')) + '</label><input type="file" accept=".otf,.ttf,.woff,.woff2" data-fontup="b"></div></div>' : ''));
}

function fontUp(kind, file){
  if (!may('settings')){ toast(t('الإعداداتُ للمهندس فما فوق')); return; }
  if (!file || file.size > PV.FONTS_MAX){ toast(t('ملفُّ الخط كبير — الحدُّ ٤٥٠ ك.ب')); return; }
  var fr = new FileReader();
  fr.onload = function(){ var b64 = String(fr.result || '').split(',')[1] || ''; if (!b64){ toast(t('تعذّرت قراءةُ الملف')); return; }
    var v = Object.assign({}, CFG.fonts || {}); v[kind] = b64; v[kind + 'n'] = file.name; v.at = Date.now(); v.by = STATE.meta.name || '';
    CFG.fonts = v; CORE.set('cfg', 'fonts', v); logEvent('خطُّ التقارير — ' + (kind === 'b' ? 'العريض' : 'العادي') + ' · ' + file.name, ''); toast(t('حُفظ الخط — يُضمَّن في ملف الطباعة')); render(1); };
  fr.readAsDataURL(file);
}


function gmapsCard(){
  var k = gmapsKey(), ed = may('settings');
  return card('\u{1F5FA} ' + t('خرائط جوجل'),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('بمفتاحٍ من منصة خرائط جوجل تُعرَض خرائطُ جوجل (شوارعُ وقمرٌ هجين بأسمائه) تحت نقاطنا على كلِّ الأجهزة على اتصال؛ وبلا شبكةٍ خريطةُ الجهاز كما هي. قيِّد المفتاحَ بنطاق التطبيق فقط.')) + '</p>'
    + (ed ? '<div class="wt-row" style="gap:8px;align-items:center;flex-wrap:wrap"><input id="gmKey" dir="ltr" placeholder="AIza…" value="' + esc(k) + '" style="min-width:260px;max-width:420px">' + btn(t('احفظ المفتاح'), 'btn-primary btn-sm', ' data-gmsave="1"') + (k ? btn('\u2715 ' + t('أزل المفتاح'), 'btn-quiet btn-sm', ' data-gmclear="1"') : '') + '</div>'
         : '<p class="hint">' + esc(k ? t('مفتاحٌ مضبوط') : t('لا مفتاح — تُستعمل الخريطةُ المفتوحة')) + '</p>')
    + '<p class="hint" style="margin:8px 0 0">' + esc(t(k ? (PV.GMAP.fail ? 'تعذّر تحميلُ خرائط جوجل بهذا المفتاح — تُستعمل الخريطةُ المفتوحة حتى يُصحَّح' : 'الحالة: مضبوط') : 'الحالة: الخريطةُ المفتوحة (شوارعُ المصدر المفتوح وقمرُ إسري)')) + '</p>'
    + (k && PV.GMAP.fail && PV.GMAP.err ? '<p class="hint" style="margin:4px 0 0;color:#EF4444">' + esc(t('سبب جوجل')) + ': ' + esc(t(PV.GMAP_WHY[PV.GMAP.err] || PV.GMAP.err)) + ' <span dir="ltr">(' + esc(PV.GMAP.err) + ')</span></p>' : ''));   /* (V43.7) the reason, inside the card */
}
function basemapSatCls(){
  var el = document.getElementById('mapBox');
  if (el) el.classList.toggle('sat', !!(MAP_SAT && !(BASEMAP.layer && MAP && MAP.hasLayer(BASEMAP.layer))));
}
if (typeof window === 'object' && window.addEventListener){
  window.addEventListener('offline', function(){ try { basemapSwap(); } catch (e){ LS_ERR = e; } });
  window.addEventListener('online', function(){ BASEMAP.netDown = false; try { basemapSwap(); } catch (e){ LS_ERR = e; } });
}
/* (V24.9) الإقلاعُ أوّلًا: الخريطةُ تُنشأ في الإقلاع خلف شاشة الدخول، وكان إرفاقُ خريطة الجهاز (قراءةُ الملف
   وتحميلُ العارض ورسمُ البلاطات) وتنزيلُها يجريان معه فأبطآه على المعالج الضعيف والشبكة البطيئة. فصار ذلك
   بعد الدخول، والخريطةُ ظاهرة، والصفحةُ خاملة — ويُعاد الطلبُ مع كلِّ فتحٍ للخريطة حتى يتمّ. */
function basemapKick(){
  if (BASEMAP.kick || !MAP || CUR !== 'map' || document.getElementById('login')) return;
  if (BASEMAP.auto && (BASEMAP.layer || !basemapWant())) return;   /* (V25.0) لا شيءَ يُطلَب: نُزِّلت أو الشبكةُ حاضرة */
  BASEMAP.kick = setTimeout(function(){
    var run = function(){
      BASEMAP.kick = null;
      if (!MAP || CUR !== 'map' || document.getElementById('login')) return;
      try { if (!BASEMAP.auto) basemapAuto(); else if (basemapWant() && !BASEMAP.layer) basemapAttach(); } catch (e){ LS_ERR = e; }
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout:2000 }); else run();
  }, 800);
}
/* التنزيلُ التلقائيُّ على اتصالٍ جيدٍ فقط: على شبكةٍ مزدحمةٍ يزاحم رفعَ بيانات الميدان — ويبقى زرُّ «نزّل» في «حسابي» */
function basemapNetOk(){
  var c = (typeof navigator === 'object' && navigator.connection) || {};
  if (c.saveData) return false;
  return !/2g$|^3g$/.test(String(c.effectiveType || ''));
}
function basemapDownload(){
  if (BASEMAP.loading) return Promise.resolve(false);
  BASEMAP.loading = true; render(1);
  return fetch(PV.BASEMAP_FILE, { cache:'no-store', priority:'low' }).then(function(r){
    if (!r.ok) throw new Error('no-file');
    return r.blob();
  }).then(function(b){
    if (b.size > BASEMAP_MAX) throw new Error('too-big');
    return caches.open(PV.BASEMAP_CACHE).then(function(c){ return c.put(PV.BASEMAP_FILE, new Response(b, { headers:{ 'content-type':'application/octet-stream', 'content-length':String(b.size) } })); }).then(basemapWarm).then(function(){ BASEMAP.have = true; BASEMAP.loading = false; toast(t('نُزِّلت خريطةُ المشاعر — تعمل الآن بلا شبكة')); logEvent('خريطةُ المشاعر نُزِّلت — ' + Math.round(b.size / 1048576) + ' م.ب'); render(1); try { basemapAttach(); } catch (e){ LS_ERR = e; } return true; });
  }).catch(function(e){ BASEMAP.loading = false; toast(t(String(e && e.message) === 'no-file' ? 'لم تُبنَ خريطةُ المشاعر بعد — انظر docs/maps' : 'تعذّر تنزيلُ الخريطة')); render(1); return false; });
}

function basemapScripts(){
  if (window.protomapsL && window.pmtiles) return Promise.resolve(true);
  var one = function(src){ return new Promise(function(res){ var sc = document.createElement('script'); sc.src = src; sc.onload = function(){ res(true); }; sc.onerror = function(){ res(false); }; document.head.appendChild(sc); }); };
  return one('vendor/protomaps/pmtiles-4.5.0.js').then(function(ok){ return ok ? one('vendor/protomaps/protomaps-leaflet-5.1.0.js') : false; });
}
/* يُلحَق بالخريطة حين يوجد الملفُّ: قاعدةٌ بلا شبكة فوق الفاتحة، والقمرُ الصناعيُّ كما هو.
   (V24.9) الملفُّ يُقرأ مقاطعَ من الذاكرة (FileSource): رابطُ Blob لا يحمل امتدادَ الملف فكانت
   المكتبةُ تعدّه عنوانَ بلاطاتٍ وتقرأ الأرشيفَ كلَّه بلاطةً واحدةً فيتعطّل الرسم. ونداءا الفتح
   والتنزيلِ التلقائي يشتركان في وعدٍ واحدٍ فلا تُلحَق طبقتان. */
function basemapAttach(){
  if (!MAP || BASEMAP.layer || !basemapWant()) return Promise.resolve(false);
  if (BASEMAP.busy) return BASEMAP.busy.then(function(){ return basemapAttach(); });   /* نداءٌ في أثناء آخر يُعاد بعده: لا طبقتان، ولا جوابٌ قديمٌ «لا ملف» يسبق التنزيل */
  BASEMAP.busy = basemapHave().then(function(has){
    if (!has) return false;
    return basemapScripts().then(function(ok){
      if (!ok || !window.protomapsL || !window.pmtiles) return false;
      return caches.open(PV.BASEMAP_CACHE).then(function(c){ return c.match(PV.BASEMAP_FILE); }).then(function(r){
        if (!r){ BASEMAP.have = false; if (!BASEMAP.redl){ BASEMAP.redl = true; basemapDownload(); } return null; }   /* مُسِح بين الفحص والقراءة: يُعاد مرةً */
        return r.blob();
      }).then(function(b){
        if (!b || !MAP || BASEMAP.layer || !basemapWant()) return false;
        BASEMAP.arc = new pmtiles.PMTiles(new pmtiles.FileSource(new File([b], 'mashaer.pmtiles')));
        return BASEMAP.arc.getHeader().then(function(h){
        if (!MAP || BASEMAP.layer || !basemapWant()) return false;
        /* (V25.0) تُرسَم داخل نطاق الملف وحدَه (ترويستُه تعمل بلا شبكة) — كانت خارجه بلاطاتٌ فارغةٌ بخطوطٍ وأسماءٌ طافية */
        var bb = (h && h.maxLon > h.minLon && h.maxLat > h.minLat && h.maxLon - h.minLon < 300) ? [[h.minLat, h.minLon], [h.maxLat, h.maxLon]] : undefined;
        BASEMAP.layer = protomapsL.leafletLayer({ url:BASEMAP.arc, flavor:'light', lang:'ar', maxDataZoom:15, className:'nskBase', bounds:bb, attribution:'\u00a9 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' });
        BASEMAP.layer.addTo(MAP);
        basemapSwap();
        return true;
        });
      });
    });
  }).catch(function(e){ softErr('basemap', e, ''); return false; }).then(function(v){ BASEMAP.busy = null; return v; });
  return BASEMAP.busy;
}
/* (V24.9) طبقةُ أساسٍ واحدةٌ تحت النقاط، و(V25.0) خريطةُ الجهاز حين تُطلَب وحدَه (basemapWant):
   مع الشبكة البلاطُ الشبكيُّ (الفاتحةُ أو القمر) وتُترَك خريطةُ الجهاز من الذاكرة، وعند الانقطاع هي وحدَها. */
/* ═══ (V27.6) خريطةٌ هجينة: أسماءُ الشوارع والأماكن فوق القمر الصناعي ═══
   بلاغُ المالك: الهجينةُ (V27.5 من خريطة الجهاز) أفقرُ كثيرًا من خريطة الشوارع في الأسماء عند التكبير المتوسط، لأن بلاطَ الجهاز
   يُعمِّم الطرقَ الصغيرة. فصارت الأسماءُ من ملف maps/mashaer-names.json (كلُّ طريقٍ له اسم، والأحياءُ والقرى والجبالُ والمعالم،
   بالعربية، من بيانات الخرائط المفتوحة — ODbL) تُرسَم على لوحٍ فوق البلاط: بحسب التكبير (الرئيسيةُ أوّلًا ثم كلُّ الشوارع)،
   على امتداد الشارع، بهالةٍ بيضاء، وبلا تداخل. تُركَّب مع القمر على اتصال، وتُرفَع مع خريطة الشوارع (لها أسماؤها) ومع خريطة
   الجهاز بلا شبكة. يُخزَّن الملفُّ في مخزن الخريطة فيعمل لاحقًا بلا شبكة. */
var NAMES = { data:null, busy:false, layer:null, ok:true };
PV.NAMES_FILE = 'maps/mashaer-names.json'; PV.NAMES_REGION = 'maps/region-names.json';   /* (V27.8) الإقليمُ للتكبير البعيد */
PV.NAMES_RANK = { motorway:1, trunk:1, primary:2, secondary:3, tertiary:4, unclassified:5, residential:5, pedestrian:5, living_street:5, service:6, footway:6, path:6, track:6, steps:7 };
PV.NAMES_PLACE = { city:0, town:1, airport:1, suburb:2, village:2, peak:3, quarter:3, neighbourhood:4, hamlet:4, locality:5, station:6, hospital:6, mosque:6, place_of_worship:6, police:6, bus_station:6 };
function namesFetch(file){
  var fromCache = (typeof caches === 'object' && caches.open) ? caches.open(PV.BASEMAP_CACHE).then(function(c){ return c.match(file); }).catch(function(){ return null; }) : Promise.resolve(null);
  return fromCache.then(function(r){
    if (r) return r.json();
    return fetch(file, { cache:'no-store' }).then(function(res){
      if (!res.ok) throw new Error('names ' + res.status);
      var copy = res.clone();
      if (typeof caches === 'object' && caches.open) caches.open(PV.BASEMAP_CACHE).then(function(c){ return c.put(file, copy); }).catch(function(){});
      return res.json();
    });
  }).catch(function(){ return null; });
}
function namesLoad(){
  if (NAMES.data || NAMES.busy || !NAMES.ok) return;
  NAMES.busy = true;
  Promise.all([namesFetch(PV.NAMES_FILE), namesFetch(PV.NAMES_REGION)]).then(function(a){
    var loc = a[0], reg = a[1];
    if (!loc && !reg){ NAMES.ok = false; return; }
    /* الإقليميُّ يُعلَّم ليُرسَم في التكبير البعيد ويُخفى داخل المشاعر عند الاقتراب (فالمحلّيُّ أدقّ) */
    var lines = (loc && loc.lines ? loc.lines : []).map(function(l){ return [l[0], l[1], l[2], '', 0]; })
      .concat(reg && reg.lines ? reg.lines.map(function(l){ return [l[0], l[1], l[2], l[3] || '', 1]; }) : []);
    var points = (loc && loc.points ? loc.points : []).map(function(q){ return [q[0], q[1], q[2], q[3], 0]; })
      .concat(reg && reg.points ? reg.points.map(function(q){ return [q[0], q[1], q[2], q[3], 1]; }) : []);
    NAMES.data = { lines:lines, points:points, bbox:(loc && loc.bbox) || [21.30, 39.78, 21.50, 40.02] };
    if (NAMES.layer) NAMES.layer.redraw();
  }).catch(function(e){ NAMES.ok = false; softErr('names', e, ''); }).then(function(){ NAMES.busy = false; });
}
function namesLayerClass(){   /* ليفلت يُحمَّل بعد هذا الملف — فالصنفُ يُبنى عند أوّل حاجة */
  if (NAMES.cls) return NAMES.cls; if (typeof L !== 'object' || !L.Layer) return null;
  NAMES.cls = L.Layer.extend({
  onAdd:function(map){
    this._map = map;
    /* في لوح النقاط نفسِه (overlayPane) وأوّلَ أبنائه: فوق البلاط وتحت النقاط والحدود — طبقاتُ ليفلت هنا كلُّها بترتيبٍ واحد فلا يُعتمَد على zIndex */
    var c = this._cv = document.createElement('canvas'); c.className = 'nskNamesCv'; c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; c.style.pointerEvents = 'none';
    var pane = map.getPane('overlayPane'); if (pane.firstChild) pane.insertBefore(c, pane.firstChild); else pane.appendChild(c);
    map.on('moveend zoomend resize', this.redraw, this); map.on('zoomstart', this._hide, this);
    this.redraw(); namesLoad();
  },
  onRemove:function(map){ map.off('moveend zoomend resize', this.redraw, this); map.off('zoomstart', this._hide, this); if (this._cv && this._cv.parentNode) this._cv.parentNode.removeChild(this._cv); this._cv = null; },
  _hide:function(){ if (this._cv) this._cv.style.visibility = 'hidden'; },
  redraw:function(){
    var map = this._map, c = this._cv; if (!map || !c) return;
    var sz = map.getSize(), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(sz.x * dpr); c.height = Math.round(sz.y * dpr); c.style.width = sz.x + 'px'; c.style.height = sz.y + 'px';
    var tl = map.containerPointToLayerPoint([0, 0]); L.DomUtil.setPosition(c, tl); c.style.visibility = '';
    var ctx = c.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, sz.x, sz.y);
    var D = NAMES.data; if (!D) return;
    var z = map.getZoom(), b = map.getBounds().pad(0.05), occ = {}, cell = 14;
    var free = function(x, y, w, h){ var x0 = Math.floor((x - w / 2) / cell), x1 = Math.floor((x + w / 2) / cell), y0 = Math.floor((y - h / 2) / cell), y1 = Math.floor((y + h / 2) / cell), i, j;
      for (i = x0; i <= x1; i++) for (j = y0; j <= y1; j++) if (occ[i + ',' + j]) return false;
      for (i = x0; i <= x1; i++) for (j = y0; j <= y1; j++) occ[i + ',' + j] = 1; return true; };
    var maxRank = z >= 16 ? 7 : z >= 15 ? 6 : z >= 14 ? 5 : z >= 13 ? 4 : z >= 12 ? 3 : z >= 10 ? 2 : 1;
    var maxPlace = z >= 14 ? 6 : z >= 12 ? 4 : z >= 11 ? 3 : z >= 10 ? 2 : z >= 8 ? 1 : 0;
    var inLoc = function(la, lo){ var bx = D.bbox; return la >= bx[0] && la <= bx[2] && lo >= bx[1] && lo <= bx[3]; };
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    /* الأماكنُ أوّلًا (أكبرُ وأهمّ)، ثم الطرقُ بترتيب أهميتها */
    var pts = D.points || [], k, p, pr, px, f;
    for (k = 0; k < pts.length; k++){ p = pts[k]; pr = PV.NAMES_PLACE[p[1]]; if (pr == null) pr = 6; if (pr > maxPlace) continue;   /* المدينةُ رتبتُها صفرٌ — لا تسقط بـ|| */ if (!b.contains([p[2], p[3]])) continue;
      if (p[4] === 1 && z >= 13 && inLoc(p[2], p[3])) continue;   /* الإقليميُّ داخل المشاعر عند الاقتراب: المحلّيُّ يكفي */
      px = map.latLngToContainerPoint([p[2], p[3]]); f = pr === 0 ? 17 : pr <= 1 ? 15 : pr <= 3 ? 13 : 12; ctx.font = 'bold ' + f + 'px system-ui, sans-serif';
      var w = ctx.measureText(p[0]).width + 8; if (!free(px.x, px.y, w, f + 6)) continue;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeText(p[0], px.x, px.y); ctx.fillStyle = pr <= 3 ? '#1a1a1a' : '#2b2b2b'; ctx.fillText(p[0], px.x, px.y); }
    var lines = D.lines, order = lines.map(function(l, i){ return [PV.NAMES_RANK[l[1]] || 6, i]; }).filter(function(o){ var l = lines[o[1]]; if (l[4] === 1){ if (z >= 14) return false; return o[0] <= maxRank; } return z >= 12 && o[0] <= maxRank; }).sort(function(a, b2){ return a[0] - b2[0]; });
    ctx.font = 'bold 12px system-ui, sans-serif';
    for (k = 0; k < order.length; k++){ var ln = lines[order[k][1]], g = ln[2], i, pts2 = [], tot = 0;
      if (ln[4] === 1 && z >= 13 && g.length && inLoc(g[0][0], g[0][1])) continue;
      /* (V27.8) درعُ رقم الطريق للإقليم، والاسمُ معه إن اتّسع */
      var isReg = ln[4] === 1, lab = (isReg && ln[3] && (z < 12 || !ln[0])) ? ln[3] : ln[0]; if (!lab) continue;
      /* الجزءُ الظاهرُ من الشارع بطوله كلِّه (لا قطعةً واحدة — شوارعُ منى مقطّعةٌ قطعًا قصيرة)، والاسمُ في منتصفه بميل قطعته */
      for (i = 0; i < g.length; i++){ if (!b.contains(g[i])) { if (pts2.length) break; continue; } pts2.push(map.latLngToContainerPoint(g[i])); }
      if (pts2.length < 2) continue;
      for (i = 1; i < pts2.length; i++) tot += Math.sqrt(Math.pow(pts2[i].x - pts2[i - 1].x, 2) + Math.pow(pts2[i].y - pts2[i - 1].y, 2));
      ctx.font = (isReg && lab === ln[3]) ? 'bold 11px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
      var tw = ctx.measureText(lab).width; if (tot < tw + 10 && !(isReg && lab === ln[3] && tot > 30)) continue;
      var half = tot / 2, acc = 0, seg = null; for (i = 1; i < pts2.length; i++){ var sl = Math.sqrt(Math.pow(pts2[i].x - pts2[i - 1].x, 2) + Math.pow(pts2[i].y - pts2[i - 1].y, 2)); if (acc + sl >= half){ var tt = sl ? (half - acc) / sl : 0; seg = [pts2[i - 1], pts2[i], pts2[i - 1].x + (pts2[i].x - pts2[i - 1].x) * tt, pts2[i - 1].y + (pts2[i].y - pts2[i - 1].y) * tt]; break; } acc += sl; }
      if (!seg) continue;
      var mx = seg[2], my = seg[3], ang = Math.atan2(seg[1].y - seg[0].y, seg[1].x - seg[0].x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      if (!free(mx, my, Math.abs(Math.cos(ang)) * tw + 14, Math.abs(Math.sin(ang)) * tw + 14)) continue;
      if (isReg && lab === ln[3]){   /* درعٌ: مستطيلٌ أبيضُ بحافةٍ وَرقمُ الطريق */
        if (!free(mx, my, tw + 16, 20)) continue;
        ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8c2d2d'; ctx.lineWidth = 1.5; var rw = tw + 12, rh = 17; ctx.beginPath(); ctx.rect(mx - rw / 2, my - rh / 2, rw, rh); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8c2d2d'; ctx.fillText(lab, mx, my + 0.5); ctx.restore(); continue; }
      ctx.save(); ctx.translate(mx, my); ctx.rotate(ang); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(lab, 0, 0); ctx.fillStyle = order[k][0] <= 2 ? '#1f2d3d' : '#333'; ctx.fillText(lab, 0, 0); ctx.restore(); }
  }
  }); return NAMES.cls;
}
function basemapLabelsSync(){
  var C = namesLayerClass(); if (!MAP || !C) return;
  var want = !basemapWant() && !!MAP_SAT;
  try {
    if (!want){ if (NAMES.layer && MAP.hasLayer(NAMES.layer)) MAP.removeLayer(NAMES.layer); return; }
    if (!NAMES.layer) NAMES.layer = new C();
    if (!MAP.hasLayer(NAMES.layer)) NAMES.layer.addTo(MAP);
  } catch (e){ LS_ERR = e; }
}
/* ═══ (V27.6) خرائطُ جوجل داخل خريطتنا ═══
   قرارُ المالك: «خريطة سهلة وفيها كل التفاصيل زي جوجل». تُعرَض خرائطُ جوجل (شوارعُ أو قمرٌ هجين بأسمائه) أساسًا تحت نقاطنا
   وحدودنا ومساراتنا كما هي — عبر واجهة جوجل الرسمية وإضافة ليفلت الرسمية لها (GoogleMutant)، بمفتاحٍ يضعه المدير في
   ثوابت النظام فيصل الأجهزةَ كلَّها. على اتصالٍ فقط؛ وبلا شبكةٍ خريطةُ الجهاز كما كانت، وإن فشل المفتاحُ أو التحميلُ عاد
   الأساسُ المفتوح (شوارع/قمر) بلا أثر. التكلفةُ ضمن الحصة المجانية الشهرية لحجم استعمالنا. */
PV.GMAP = { lib:null, api:null, fail:false, layer:null, kind:'', err:'', ready:false, kick:null, retry:null };
/* (V43.7) the owner, after the key was saved: «قفلت وفتحته ولقيتها كده». Reproduced in a real browser with his key: the script
   loads, then Google refuses — «ApiNotActivatedMapError», the Maps JavaScript API is not switched on for that key's project.
   Google tells a page only through window.gm_authFailure (no code) and a console line (the code). The layer stayed on, drawing
   nothing, with the open map already removed. Now a refusal drops the Google layer, puts the open map back at once, keeps the
   reason for the constants card in plain words, and logs it once. */
PV.GMAP_WHY = { ApiNotActivatedMapError:'خدمة «Maps JavaScript API» مش مفعّلة في مشروع جوجل — فعّلها من «المكتبة»',
  RefererNotAllowedMapError:'المفتاح مقفول على عنوان تاني — ضيف عنوان التطبيق في «قيود المواقع»', InvalidKeyMapError:'المفتاح غلط — انسخه تاني',
  BillingNotEnabledMapError:'حساب الفوترة مش مربوط بمشروع جوجل', ApiTargetBlockedMapError:'المفتاح مقيّد بخدمات مش منها خرائط جوجل — ضيف «Maps JavaScript API» في قيود الـAPI',
  ExpiredKeyMapError:'المفتاح منتهي', OverQuotaMapError:'الحصة اليومية خلصت' };
function gmapsRefused(code){
  if (PV.GMAP.fail && PV.GMAP.err === (code || PV.GMAP.err)) return;
  PV.GMAP.fail = true; if (code) PV.GMAP.err = code; else if (!PV.GMAP.err) PV.GMAP.err = 'auth';
  try { if (typeof MAP !== 'undefined' && MAP){ if (PV.GMAP.layer && MAP.hasLayer(PV.GMAP.layer)) MAP.removeLayer(PV.GMAP.layer); PV.GMAP.layer = null; PV.GMAP.kind = ''; if (MAP_BASE && !MAP.hasLayer(MAP_BASE) && !(typeof basemapWant === 'function' && basemapWant())) MAP_BASE.addTo(MAP); if (typeof basemapLabelsSync === 'function') basemapLabelsSync(); if (typeof basemapSatCls === 'function') basemapSatCls(); } } catch (e){ LS_ERR = e; }
  if (!PV.GMAP.logged){ PV.GMAP.logged = 1; logEvent('خرائطُ جوجل رفضت المفتاح — ' + (PV.GMAP.err || 'auth') + ' — رجعنا للخريطة المفتوحة', ''); }
  if (CUR === 'consts') render(1);
}
if (typeof window === 'object'){
  window.gm_authFailure = function(){ gmapsRefused(''); };
  try { var ce0 = console.error; console.error = function(){ try { var m = String(arguments[0] || ''); var mm = m.match(/Google Maps JavaScript API error: (\w+)/); if (mm) gmapsRefused(mm[1]); } catch (e1){ LS_ERR = e1; } return ce0.apply(console, arguments); }; } catch (e2){ LS_ERR = e2; }
}
function gmapsKey(){ return (CFG.gmaps && typeof CFG.gmaps.key === 'string') ? CFG.gmaps.key.trim() : ''; }
function gmapsWant(){ return !!gmapsKey() && !PV.GMAP.fail && !basemapWant(); }
function gmapsScript(src, test, ms){
  return new Promise(function(res){
    if (test()) return res(true);
    var el = document.createElement('script'), done = false, tm = setTimeout(function(){ if (!done){ done = true; res(false); } }, ms || 12000);
    el.src = src; el.async = true;
    el.onload = function(){ if (!done){ done = true; clearTimeout(tm); res(test()); } };
    el.onerror = function(){ if (!done){ done = true; clearTimeout(tm); res(false); } };
    document.head.appendChild(el);
  });
}
function gmapsLoad(){
  if (PV.GMAP.api) return PV.GMAP.api;
  var key = gmapsKey(); if (!key) return Promise.resolve(false);
  PV.GMAP.api = gmapsScript('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&language=ar&region=SA&v=weekly&loading=async', function(){ return !!(window.google && window.google.maps); }, 30000)
    .then(function(ok){ if (!ok) return false; return gmapsScript('vendor/google/leaflet-googlemutant-0.16.0.js', function(){ return !!(window.L && L.gridLayer && L.gridLayer.googleMutant); }, 20000); })
    .then(function(ok){
      if (!ok){ PV.GMAP.fail = true; PV.GMAP.api = null;
        /* (V43.8) slowness is not refusal: on a thin network the scripts can miss their time — try again in a minute instead of giving up for the session */
        if (!PV.GMAP.err){ clearTimeout(PV.GMAP.retry); PV.GMAP.retry = setTimeout(function(){ if (!PV.GMAP.err){ PV.GMAP.fail = false; gmapsKick(); } }, 60000); } }
      return ok; });
  return PV.GMAP.api;
}
/* (V43.8) the owner: «الخريطة بتحمل ببطء ومش بتفتح على القمر الصناعي أول ما أدخل — لازم أطفي القمر وأشغّله تاني». Measured in a real
   phone-sized Chromium with the key set: opening the map NEVER started Google — nothing called the Google sync except the
   satellite button, a key save or an online/offline event. So a device whose key was already known (every launch after the
   first) stayed on the open satellite until someone toggled it, and the key arriving before the map existed was lost the same
   way. Now the map starts Google itself, after the page is idle (the boot-first rule of V24.9 stands), and the scripts are warmed
   a few seconds after sign-in so they are already there when the map is shown. */
function gmapsKick(){
  if (!gmapsKey() || PV.GMAP.fail || PV.GMAP.kick || document.getElementById('login')) return;
  var c = (typeof navigator === 'object' && navigator.connection) || {};
  if (navigator.onLine === false || c.saveData || /(^|-)2g$/.test(String(c.effectiveType || ''))) return;
  var kind = MAP_SAT ? 'hybrid' : 'roadmap';
  if (MAP && PV.GMAP.layer && PV.GMAP.kind === kind && MAP.hasLayer(PV.GMAP.layer)) return;
  PV.GMAP.kick = setTimeout(function(){
    PV.GMAP.kick = null;
    if (document.getElementById('login') || navigator.onLine === false) return;
    try { if (MAP && gmapsWant()) gmapsSync(); else gmapsLoad(); } catch (e){ LS_ERR = e; }
  }, MAP ? 400 : 3500);
}
function gmapsSync(){
  if (!MAP || !MAP_BASE) return;
  var want = gmapsWant();
  if (!want){ if (PV.GMAP.layer){ try { if (MAP.hasLayer(PV.GMAP.layer)) MAP.removeLayer(PV.GMAP.layer); } catch (e){ LS_ERR = e; } PV.GMAP.layer = null; PV.GMAP.kind = ''; if (!basemapWant() && !MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP); } return; }
  var kind = MAP_SAT ? 'hybrid' : 'roadmap';
  if (PV.GMAP.layer && PV.GMAP.kind === kind){ if (!MAP.hasLayer(PV.GMAP.layer)) PV.GMAP.layer.addTo(MAP); if (PV.GMAP.ready && MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE); return; }
  gmapsLoad().then(function(ok){
    if (!ok || !MAP){ basemapSatCls(); return; }
    if (!gmapsWant()) return;
    try {
      if (PV.GMAP.layer && MAP.hasLayer(PV.GMAP.layer)) MAP.removeLayer(PV.GMAP.layer);
      PV.GMAP.kind = MAP_SAT ? 'hybrid' : 'roadmap';
      PV.GMAP.layer = L.gridLayer.googleMutant({ type:PV.GMAP.kind, maxZoom:21, className: PV.GMAP.kind === 'roadmap' ? 'nskBase' : 'nskGsat' });
      /* (V43.8) the satellite base stays under Google's layer until Google has drawn its tiles: removing it at once left a blank map
         for as long as Google's own scripts and tiles took (seconds on Mina's network). The swap happens on Google's «tilesloaded». */
      var lyr = PV.GMAP.layer; PV.GMAP.ready = false;
      var swapIn = function(){ if (PV.GMAP.layer !== lyr || !MAP || !MAP.hasLayer(lyr)) return; PV.GMAP.ready = true; if (MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE); if (NAMES.layer && MAP.hasLayer(NAMES.layer)) MAP.removeLayer(NAMES.layer); basemapSatCls(); };
      lyr.once('spawned', function(ev){ try { google.maps.event.addListenerOnce(ev.mapObject, 'tilesloaded', function(){ setTimeout(swapIn, 200); }); } catch (e3){ swapIn(); } });
      lyr.addTo(MAP);
      logEvent('خرائطُ جوجل — ' + PV.GMAP.kind, '');
    } catch (e){ PV.GMAP.fail = true; PV.GMAP.layer = null; if (!MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP); softErr('gmaps', e, ''); }
    basemapSatCls();
  });
}
function basemapSwap(){
  if (!MAP || !MAP_BASE) return;
  var want = basemapWant();
  try {
    if (want && BASEMAP.layer){ if (MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE); if (!MAP.hasLayer(BASEMAP.layer)) BASEMAP.layer.addTo(MAP); }
    else {
      if (BASEMAP.layer){ if (MAP.hasLayer(BASEMAP.layer)) MAP.removeLayer(BASEMAP.layer); BASEMAP.layer = null; BASEMAP.arc = null; }
      if (!MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP);
    }
  } catch (e){ LS_ERR = e; }
  basemapSatCls();
  if (want && !BASEMAP.layer && BASEMAP.have !== false) basemapAttach();
  gmapsSync();   /* (V27.6) جوجل أوّلًا إن كان لها مفتاح */
  if (!gmapsWant()) basemapLabelsSync();   /* (V27.5) أسماؤنا فوق القمر المفتوح فقط */
}
/* بطاقاتُ الجهاز — خريطةُ المشاعر ووضعُ الشمس والتشخيص — تظهر في «حسابي» لكلِّ
   الأدوار (الفنيُّ لا يرى الأدوات) وفي الأدوات للمشرف (V18.0) */
function deviceCards(){
  return notifSettingsCard() + basemapCard()
    + card('وضعُ الشمس',
        '<div class="actions">' + btn((SUN_ON ? '\u2713 ' : '') + t(SUN_ON ? 'وضعُ الشمس يعمل — أطفئه' : 'شغّل وضعَ الشمس'), SUN_ON ? 'btn-quiet' : 'btn-secondary', ' data-sun="1"')
        + '<span class="hint" style="margin:0">' + esc(t('تباينٌ أعلى وخطٌّ أكبرُ وأزرارٌ أكبرُ للعمل تحت الشمس — لهذا الجهاز وحدَه')) + '</span></div>')
    + card('التشخيص',
        '<div class="actions">' + btn('\u{1F4CB} ' + t('نسخ التشخيص'),'btn-secondary',' data-boxcopy="1"')
        + '<span class="hint" style="margin:0">' + esc(t('آخر مئة حدثٍ على هذا الجهاز بلا أسماءٍ ولا نصوص — يُرسَل للمهندس حين لا تصل الشبكة')) + '</span></div>');
}
function basemapCard(){
  basemapManifest(); if (BASEMAP.have === null) basemapHave();
  var mb = BASEMAP.manifest && BASEMAP.manifest.bytes ? Math.round(BASEMAP.manifest.bytes / 1048576) : 0;
  var built = !!(BASEMAP.manifest && BASEMAP.manifest.bytes);
  return card('خريطةُ المشاعر بلا شبكة',
    '<p class="hint" style="margin-top:0">' + esc(t('شوارع مكة والمدينة وطريق الهجرة ومبانيها وأسماؤها تحفظ على جهازك، فتظهر الخريطة تلقائيا عند انقطاع الشبكة. تنزل مرة واحدة تلقائيا عند فتح الخريطة إذا كان الاتصال جيدا، ويمكن تنزيلها من هنا، ويفضل ذلك على واي فاي.')) + '</p>'
    + '<div class="actions">'
    + (BASEMAP.have
        ? pill('\u2713 ' + t('محفوظةٌ على الجهاز'), 'ok') + btn(t('أزلها من الجهاز'), 'btn-quiet btn-sm', ' data-basemaprm="1"')
        : (built
            ? btn((BASEMAP.loading ? '\u23F3 ' : '\u2B07 ') + t('نزّل خريطةَ المشاعر') + ' \u2014 ' + nm(mb) + ' ' + t('ميجا'), 'btn-primary', ' data-basemapdl="1"' + (BASEMAP.loading ? ' disabled' : ''))
            : pill(t('لم تُبنَ الخريطةُ لهذا الموسم بعد'), 'wrn')))
    + '</div>');
}


PV.SEL_IDS = [];

/* ── الاستيراد — قالبٌ يُنزَّل ثم يُرفع فيُعايَن قبل الحفظ ── */
PV.IMP_COLS = {
  sites: ['المعرّف','المشعر','النوع','الشاخص','المربع','الشركة','خط العرض','خط الطول'],
  ips:   ['معرّف الموقع','بادئة الشبكة','الراوتر','القارئ','الكاميرا'],
  users: ['المعرّف','الاسم','الدور','الحالة'],
  fleet: ['رقم اللوحة','النوع','الموديل','انتهاء الرخصة','الملكية','التكلفة الشهرية'],
  co:    ['اسم الشركة','مواقعها','المنسّق','الجوال'],
  items: ['المنطقة','اسم القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر'],
  stock: ['الصنف','الكمية','المورّد','التاريخ','رقم الفاتورة'],
  buys:  ['التاريخ','الصنف','الفئة','المشعر','الكمية','سعر الوحدة','المورّد']
};


PV.IMP_PREVIEW = null;

