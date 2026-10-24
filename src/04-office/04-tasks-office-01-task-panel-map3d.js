/* ============================================================================
   FILE    : src/04-office/04-tasks-office-01-task-panel-map3d.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Task panel, challenge-point window, field/office work on a challenge, and the 3D map toggle.
   DEFINES : chalUpd, chalUpds, chalUpdNote, chalUpdBox, chalAssignBox, m3Load, m3Style, m3Layers, m3Click, m3Init, m3From2D, m3Toggle … (+3 more)
   GLOBALS : CHAL_POP, MAP_3D, M3_FOOT
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ لوحةُ المهمة — مكانٌ واحدٌ لكلِّ تعديل ═══
   الحالةُ شرائحُ تُضغَط فتُحفَظ وتُسجَّل، و«ما الجديد؟» سطرٌ يُضاف إلى سجلٍّ
   باسم كاتبه ووقته، وبياناتُ المهمة تحت «تعديل البيانات» لمن يريدها. */
/* المضيفُ ابنٌ مباشرٌ للجسد — لا داخل المحتوى ولا داخل قشرة التطبيق: «الثابتُ»
   يتبع أوّلَ أبٍ فيه تحويلٌ أو تموضع، فكان اللوحُ يظهر في أوّل الصفحة لا
   أسفلَ الشاشة. على الجسد لا أبَ يُفسده. */

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

/* النقاطُ هي نقاطُ الخريطة المسطّحة حرفًا: القائمةُ نفسُها بعد الطبقة
   والمرشِّحات والشركات، واللونُ نفسُه — لا قائمةَ ثانيةً ولا لونًا ثانيًا */

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
    covLayers3d();   /* (V39.14) the coverage lies on the ground, under the columns */
    heatLayers3d();  /* (V39.16) the heat, under them too */
    if (!M3.getSource('nskc')){
      M3.addSource('nskc', { type:'geojson', data:{ type:'FeatureCollection', features:m3Cols(P) } });
      M3.addLayer({ id:'nsk-cols', type:'fill-extrusion', source:'nskc',
        paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['+', ['coalesce', ['get','base'], 0], ['get','h']],
                'fill-extrusion-base':['coalesce', ['get','base'], 0], 'fill-extrusion-opacity':0.92 } });   /* (V39.15) floors stack */
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
    /* (V39.11) the sensors and gateways as small columns — the digital twin of the camps' plans */
    if (!M3.getSource('nskiot')){
      M3.addSource('nskiot', { type:'geojson', data:{ type:'FeatureCollection', features:(typeof m3IotFeatures === 'function' ? m3IotFeatures() : []) } });
      M3.addLayer({ id:'nsk-iot', type:'fill-extrusion', source:'nskiot',
        paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':0, 'fill-extrusion-opacity':0.96 } });
    }
    if (typeof dtwLayers === 'function') dtwLayers();   /* (V39.13) the points' devices */
    /* مبانٍ ثلاثيةٌ من النمط نفسِه إن وُجدت — سياقٌ لا أكثر */
    var lyr = (M3.getStyle().layers || []).filter(function(l){ return /building/i.test(l.id) && l.type === 'fill-extrusion'; })[0];
    if (lyr) M3.setPaintProperty(lyr.id, 'fill-extrusion-opacity', 0.45);
  } catch (e){ LS_ERR = e; }
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
  if (LITE){ toast(t('الوضعُ الخفيف: بلا خريطةٍ مجسَّمة')); return false; }   /* (V37.18) */
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
  var hit = function(ev){ if (ev.originalEvent && ev.originalEvent._nskIot) return; var f = ev.features && ev.features[0]; if (f && f.properties && f.properties.id) m3Click(f.properties.id, ev); };
  M3.on('click', 'nsk-pts', hit); M3.on('click', 'nsk-cols', hit);
  /* (V39.11) the twin's devices take the tap first; a tap on the ground in the editor moves or adds the selected device */
  M3.on('click', 'nsk-iot', function(ev){ var f = ev.features && ev.features[0]; if (f && typeof m3IotClick === 'function') m3IotClick(f, ev); });
  M3.on('click', function(ev){
    if (ev.originalEvent && ev.originalEvent._nskIot) return;
    if (typeof IOT === 'object' && IOT.edit && ev.lngLat){ try { if (M3.queryRenderedFeatures(ev.point, { layers:['nsk-iot'] }).length) return; } catch (eQ){ LS_ERR = eQ; } iotMapClick({ lat:ev.lngLat.lat, lng:ev.lngLat.lng }); }
  });
  M3.on('moveend', function(){ if (MAP_3D && typeof IOT === 'object' && IOT.on && typeof m3IotPaint === 'function') m3IotPaint(); if (MAP_3D && typeof dtwPaint === 'function') dtwPaint(); if (MAP_3D){ covPaint3d(); heatPaint3d(); } });
  M3.on('mouseenter', 'nsk-iot', function(){ M3.getCanvas().style.cursor = 'pointer'; });
  M3.on('mouseleave', 'nsk-iot', function(){ M3.getCanvas().style.cursor = ''; });
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
        table(['الشركة','مواقعها','تمّ المسح','تحتاج زيارة أخرى','تمّ التركيب','٪'], rows))   /* (V39.0) */
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
          table(['الشركة','ضابط الاتصال','نقاطها','تمت الزيارة','المنجز','المتبقي','متعثر','سُلِّم','جوالها','بريدها',''],   /* (V28.5، والبريد V29.0) */
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

