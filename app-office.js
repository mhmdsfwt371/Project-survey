

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

function m3Style(){
  if (MAP_SAT) return { version:8,
    sources:{ sat:{ type:'raster', tiles:[TILES.esri], tileSize:256, attribution:'&copy; Esri' } },
    layers:[{ id:'sat', type:'raster', source:'sat' }] };
  return 'https://tiles.openfreemap.org/styles/liberty';
}

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

      M3.addLayer({ id:'nsk-cols-line', type:'line', source:'nskc', filter:['==', ['get','foot'], 1],
        paint:{ 'line-color':['case', ['==', ['get','sel'], 1], '#ffffff', 'rgba(11,18,32,.55)'],
                'line-width':['case', ['==', ['get','sel'], 1], 2.4, 1] } });
    }
    if (!M3.getSource('nsk')){
      M3.addSource('nsk', { type:'geojson', data:{ type:'FeatureCollection', features:P } });

      M3.addLayer({ id:'nsk-pts', type:'circle', source:'nsk', filter:['==', ['get','foot'], 0],
        paint:{ 'circle-radius':['interpolate', ['linear'], ['zoom'], 12, 3.5, 17, 8],
                'circle-color':['get','color'],
                'circle-stroke-width':['case', ['==', ['get','sel'], 1], 2.5, 1],
                'circle-stroke-color':['get','ring'] } });
    }

    var lyr = (M3.getStyle().layers || []).filter(function(l){ return /building/i.test(l.id) && l.type === 'fill-extrusion'; })[0];
    if (lyr) M3.setPaintProperty(lyr.id, 'fill-extrusion-opacity', 0.45);
  } catch (e){ LS_ERR = e; }
}

function m3Click(id, ev){
  if (typeof MAP_SELECT !== 'undefined' && MAP_SELECT){
    if (!asnOf(id)){ selToggle(id); m3Paint(); render(1); }
    else toast(t('هذه النقطة مُسندة بالفعل'));
    return;
  }
  popOpenAt(id, ev);
}
function m3Init(){
  if (LITE){ toast(t('الوضعُ الخفيف: بلا خريطةٍ مجسَّمة')); return false; }
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

function m3Restyle(){
  if (!MAP_3D || !M3) return;
  try { M3.setStyle(m3Style()); } catch (e){ LS_ERR = e; }
}
PAGE.co = { m:'المتابعة', t:'الشركات',
  l:'ما لكلِّ شركةِ خدمةٍ من نقاط، وما يُرسَل إليها من إشعارات.',
  body:function(){
    var head = tabHead('co'), cur = tabCur('co');
    if (cur === 'co') return head + coPopHtml() + coDashCard() + (function(){

    var manage = '';
    if (may('approve')){
      var added = Object.keys(STATE.coreqs || {}).filter(function(k){
        return STATE.coreqs[k] && STATE.coreqs[k].status === 'معتمد'; });
      manage = card('إضافة شركة',
          '<div class="field"><label>' + esc(t('اسم الشركة')) + ' <span class="req">*</span></label>'
          + '<input id="coAddName" dir="auto" placeholder="' + esc(t('كما يُكتَب على لافتة المخيم')) + '"></div>'
          + '<p class="hint">' + esc(t('تدخل القائمةَ الموحّدةَ فورًا فيختارها الميدانُ عند تسجيل موقعٍ جديد. الاسمُ الحرُّ كان يصنع شركتين من واحدة باختلاف حرف.')) + '</p>',
          btn('➕ أضِف','btn-primary btn-sm',' data-coadd="1"'))

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

        + (function(){
            var CM = coCompounds(), keys = Object.keys(CM);
            if (!keys.length) return '';

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
    CO_STALL = {}; mfuObstacles().forEach(function(o){ if (o.x.co) CO_STALL[o.x.co] = (CO_STALL[o.x.co] || 0) + 1; });
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
        + btn('\u2709 ' + t('بريد رسمي'),'btn-secondary',' data-mailco="1"')
        + btn(t('نسخ النص'),'btn-secondary',' data-wacopy="co"')
        + '</div>')

      + cardFlush(t('الشركات') + ' — ' + nm(cos.length),
          table(['الشركة','ضابط الاتصال','نقاطها','تمت الزيارة','المنجز','المتبقي','متعثر','سُلِّم','جوالها','بريدها',''],
            cos.slice(0, PG_Q ? 5000 : 200).map(function(c){
              var st = coStat(c), ph = coTelOf(c), lz = coLiaisonOf(c), cs = CO_STALL ? (CO_STALL[c] || 0) : 0;
              return [esc(c.length > 30 ? c.slice(0, 29) + '\u2026' : c),
                      may('approve') ? '<input value="' + esc(lz) + '" data-coliaison="' + esc(c) + '" dir="auto" placeholder="' + esc(t('الاسم')) + '" style="width:140px">' : (lz ? esc(lz) : '\u2014'),
                      N(st.n), N(st.sv), N(st.ins), N(Math.max(0, st.n - st.ins)), cs ? '<span class="pill wrn">' + nm(cs) + '</span>' : N(0), N(st.hd),
                      may('approve')
                        ? '<input value="' + esc(ph) + '" data-cotel="' + esc(c) + '" dir="ltr" inputmode="tel" placeholder="05xxxxxxxx" style="width:132px">'
                        : (ph ? '<span class="num" dir="ltr">' + esc(ph) + '</span>' : '\u2014'),
                      may('approve') ? '<input value="' + esc(coEmailOf(c)) + '" data-coemail="' + esc(c) + '" dir="ltr" inputmode="email" placeholder="name@company.com" style="width:170px">' : (coEmailOf(c) ? '<span dir="ltr">' + esc(coEmailOf(c)) + '</span>' : '\u2014'),
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

var WR_EDIT = '';

var NS_SIGN_RE = /^[0-9A-Za-z\u0621-\u064A]+(?:[-\/][0-9A-Za-z\u0621-\u064A]+)+$/;
var NS_SQ_RE   = /^[0-9A-Za-z\u0621-\u064A]+(?:-[0-9A-Za-z\u0621-\u064A]+)*$/;

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

function nsName(id){
  if (NEWSITE.type === 'مخيم') return NEWSITE.zone + ' - مربع ' + NEWSITE.sq + ' - شاخص ' + NEWSITE.sign;
  var ty = NEWSITE.type, d = CAT_DEF[ty] || {};
  var tn = /[\u0600-\u06FF]/.test(ty) ? ty : (d.l || ty);
  return tn + ' - ' + NEWSITE.zone + ' - ' + String(id).split('-').pop();
}

function nsVisitRec(id){
  var keys = Object.keys(NEWSITE.photos || {}).filter(function(k){ return NEWSITE.photos[k]; });
  return CORE.set('recs', id, {
    id:id, by:STATE.meta.name || '', at:Date.now(), access:'تم الوصول', review:'pending',
    src:'newsite', photos:keys.map(function(k){ return 'new_' + k; }), phN:keys.length,
    chals:(NEWSITE.chals || []).slice(),
    note:String(NEWSITE.why || '').trim()
  });
}

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
  var minProp = ROLE === 'viewer', office = nsOffice() || minProp;
  var lat = NEWSITE.lat || (MYPOS && MYPOS.lat), lng = NEWSITE.lng || (MYPOS && MYPOS.lng);
  if (!lat || !lng){ toast(t('التقط موضعك أولًا')); return; }

  NEWSITE.sq   = String(NEWSITE.sq   || '').trim();
  NEWSITE.sign = String(NEWSITE.sign || '').trim();

  if (!NEWSITE.zone || !NEWSITE.type){ toast(t('اختر المشعر ونوع الموقع')); return; }
  var camp = NEWSITE.type === 'مخيم';

  if (camp){
    if (!NEWSITE.sq){   toast(t('رقم المربع مطلوب')); return; }
    if (!NEWSITE.sign){ toast(t('رقم الشاخص مطلوب')); return; }
    if (!NS_SQ_RE.test(NEWSITE.sq)){
      toast(t('رقم المربع: أرقامٌ أو أرقام-أرقام — مثال 7 أو 7-14')); return; }
    if (!NS_SIGN_RE.test(NEWSITE.sign)){
      toast(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')); return; }
  } else { NEWSITE.sq = ''; NEWSITE.sign = ''; }
  if (!minProp && camp && NEWSITE.reason !== 'عدم وجود تخصيص' && !NEWSITE.co && !NEWSITE.coReq){
    toast(t('اختر شركة الخدمة من القائمة — أو اطلب إضافتها، أو اختر السبب «عدم وجود تخصيص»')); return; }

  if (NEWSITE.co && CO_LIST.indexOf(NEWSITE.co) < 0
      && !siteCos({ co:NEWSITE.co }).every(function(one){ return CO_LIST.indexOf(one) > -1; })){
    toast(t('اسم الشركة يجب أن يكون من القائمة الموحّدة فقط')); return; }

  NEWSITE.nm = String(NEWSITE.nm || '').trim();

  if (!office && !NEWSITE.photos[0]){ toast(t('صورة الشاخص إلزامية للاعتماد')); return; }
  if (!camp && !office && !NEWSITE.nm){ toast(t('اسم النقطة مطلوب')); return; }
  if (NEWSITE.type === 'LPR' && !NEWSITE.center){ toast(t('اختر المركز: النورية أو طريق الهجرة أو الزايدي')); return; }
  if (!office && !NEWSITE.reason){ toast(t('اختر سببَ عدم وجوده في السجل')); return; }
  if (!office && !(NEWSITE.chals || []).length){ toast(t('اختر التحديات — أو «لا توجد تحديات»')); return; }
  if (!office && !NEWSITE.photos[1]){ toast(t('أوّلُ صورتين إلزاميتان: الشاخص أو اللوحة، ولقطةٌ عامةٌ للموقع')); return; }
  if (!camp){ NEWSITE.co = ''; NEWSITE.coReq = ''; NEWSITE.tents = ''; }

  var pre = zoneCode(NEWSITE.zone);
  var tp  = typeCode(NEWSITE.type);
  var n = STATE.sites.filter(function(x){ return x.id.indexOf('NSK-' + pre + '-' + tp + '-N') === 0; }).length + 1;
  var id = 'NSK-' + pre + '-' + tp + '-N' + String(n).padStart(3, '0');

  var site = {
    id:id, name:(!camp && NEWSITE.nm) ? NEWSITE.nm : nsName(id),
    zone:NEWSITE.zone, type:NEWSITE.type, work:'موقع جديد',
    tg:NEWSITE.type === 'LPR' ? 'مراكز التفويج' : '', tt:NEWSITE.type === 'LPR' ? NEWSITE.center : '',
    chals:(NEWSITE.chals || []).slice(),
    lat:lat, lng:lng, sq:NEWSITE.sq, sign:NEWSITE.sign,
    co:NEWSITE.co, coReq:NEWSITE.coReq, tents:cfgN(NEWSITE.tents),
    reason:NEWSITE.reason, why:NEWSITE.why,
    region:'منطقة ' + NEWSITE.zone, fstat:'لم يبدأ', inout:'',
    isNew:true, approved:false, by:STATE.meta.name || '', at:Date.now(),
    origin:minProp ? 'ministry' : (office ? 'office' : 'field'),
    note:NEWSITE.note
  };
  if (NEWSITE.ex47 && !minProp) site.ex47 = NEWSITE.ex47;
  if (minProp) propKeep(site); else STATE.sites.push(site);
  SITE_IX = null; SITE_TOK = null;
  CORE.set('newsites', id, site);
  if (NEWSITE.orph && !minProp && typeof ex47OrphDrop === 'function') ex47OrphDrop(NEWSITE.orph);

  if (!minProp) Object.keys(NEWSITE.photos).forEach(function(i){
    var p = NEWSITE.photos[i];
    if (typeof photoQueue === 'function') photoQueue(id, 'new_' + i, p && (p.d || p.data));
  });

  if (!office) nsVisitRec(id);
  if (!minProp) stepDone('newsite', id, office ? 'أضافها المكتب — تُجدوَل زيارتُها' : 'أُضيفت في الموقع — تُحتسَب زيارة', 0);
  if (!minProp) notifPush('موقع مقترح', 'موقعٌ جديدٌ بانتظار اعتمادك — ' + NEWSITE.zone,
            { site:id, lv:'مهم' });
  if (!minProp) logEvent('موقع جديد — ' + id + ' · ' + NEWSITE.zone
    + (NEWSITE.coReq ? ' · طلب شركة: ' + NEWSITE.coReq : ''), id);
  statBump();
  toast(id + ' \u00b7 ' + t(minProp ? 'أُرسلت مقترحةً من الوزارة — يعتمدها المهندس' : office ? 'سُجّلت — جدوِل زيارتَها الآن' : 'سُجّلت زيارةً — أكمل بياناتِ المسح')); if (minProp) CUR = 'map';

  NEWSITE = { lat:0, lng:0, zone:NEWSITE.zone, type:NEWSITE.type, sq:'', sign:'',
              co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{}, nm:'', center:'', chals:[] };
  NS_CO_OPEN = false; NS_CO_Q = '';

  if (office){ (minProp ? false : visitAsnOpen(id)); return; }
  DETAIL_ID = id;
  formGo(id, 'new');
  CUR = 'svForm';
  render(1);
}

var SEEN_TODAY = {};
function photoSeen(id){
  var day = dayKey();
  var k = day + '|' + (STATE.meta.uid || STATE.meta.name || '?') + '|' + id;
  if (SEEN_TODAY[k]) return;
  SEEN_TODAY[k] = 1;
  logEvent('اطّلاع على صورة — ' + id, id);
}

function photoCount(siteId){
  return photosOf(siteId).filter(function(x){ return !x[1].del; }).length + PHOTO_Q.filter(function(q){ return q.site === siteId; }).length;
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

function baseSet(){

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

  var pts = 0;
  STATE.sites.forEach(function(x){ pts += ptsSurvey(x) + ptsInstall(x); });
  BASE.bac = Math.round(pts * BASE.ph);
  BASE.totalPts = Math.round(pts);
  CORE.set('baseline', 'v' + BASE.ver, BASE);
  logEvent('تجميد خط الأساس — النسخة ' + nm(BASE.ver));
  return BASE;
}

function evmVerdict(v){
  if (!v) return { t:'—', c:'' };
  if (v.SPI >= 1 && v.CPI >= 1) return { t:'متقدّمٌ وضمن الكلفة', c:'ok' };
  if (v.SPI >= 0.95 && v.CPI >= 0.95) return { t:'ضمن الحدود المقبولة', c:'ok' };
  if (v.SPI < 0.9 && v.CPI < 0.9) return { t:'متأخّرٌ ومتجاوزٌ للكلفة', c:'bad' };
  if (v.SPI < 0.95) return { t:'متأخّرٌ عن الجدول', c:'wrn' };
  return { t:'متجاوزٌ للكلفة', c:'wrn' };
}

function wplanSees(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin' || r === 'exec'; }
function wplanMay(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin'; }

function wplanOpenPast(){ var cur = mfuWeekKey(); return pmoList('wplan').filter(function(x){ return x.wk && x.wk < cur && !wplanFinal(x); }); }

function isoWeekMonday(k){ var m = /^(\d{4})-W(\d{2})$/.exec(k || ''); if (!m) return null; var j4 = new Date(Date.UTC(+m[1], 0, 4)), mon1 = j4.getTime() - ((j4.getUTCDay() + 6) % 7) * 864e5; return mon1 + (+m[2] - 1) * 7 * 864e5; }
function wplanNextWeek(k){ var mon = isoWeekMonday(k || mfuWeekKey()); return mfuWeekKey((mon == null ? Date.now() : mon) + 7 * 864e5 + 3 * 864e5); }

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
    if (cur === 'wplan') return head + wplanBody();
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

    var S = siteStats(), nCamp = 0, nCor = 0;
    STATE.sites.forEach(function(x){ if (siteZone(x) === 'camp') nCamp++; else nCor++; });
    var mC = cfgGet('minCamp'), mR = cfgGet('minCor');
    var hrs = function(n, m){ return nm(Math.round(n * m / 60)); };

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

var PZ_ARM = 0;

function myDocFix(){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }

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

      CORE._busy = false;
      return CORE.flush().then(function(sent){
        toast(t('الوثيقةُ موجودةٌ')
              + (back0 ? ' \u00b7 ' + nm(back0) + ' ' + t('عادت للرفع') : '')
              + ' \u00b7 ' + t('رُفع') + ' ' + nm(sent || 0)
              + ' \u00b7 ' + t('بقي') + ' ' + nm(STATE.queue.length));
        render(1); return true;
      });
    }

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

function contSave(){
  if (!may('perms')){ toast(t('تسميةُ البدائل للأدمن')); return; }
  var d = {}; contRes().forEach(function(r){ var el = document.getElementById('ct_' + r[0]); d[r[0]] = el ? String(el.value || '').trim() : ''; });
  d.at = Date.now(); d.by = STATE.meta.name || '';
  contLoad.d = d; contCard.ed = 0;
  CORE.set('cfg', 'continuity', d); CORE.saveSoon();
  logEvent('تسميةُ البدائل للموارد المعتمدة على شخص');
  toast(t('حُفظت البدائل')); render(1);
}
function contCard(){
  if (!may('settings')) return '';
  contLoad(); if (typeof extBridgeLoad === 'function') extBridgeLoad();
  var D = contLoad.d || {}, rows = [], now = Date.now();
  var B = (typeof EXT !== 'undefined') ? EXT.bridge : null, bh = B ? (now - B.at) / 3600000 : null;
  rows.push([esc(t('آخر جسر لنظام البطاقات')), B ? pill(bh < 12 ? 'حديث' : bh < 48 ? 'قديم' : 'متوقّف', bh < 12 ? 'ok' : bh < 48 ? 'warn' : 'bad') + ' ' + esc(pilotAgo(B.at)) + (B.by ? ' \u00b7 ' + esc(dispName(B.by)) : '') : pill('لم يُشغَّل', 'off')]);
  var m = BK_STATE.meta, ma = bkAgeDays(m);
  rows.push([esc(t('آخر نسخة احتياطية')), m ? pill(m.ok && ma <= 1 ? 'اليوم' : 'متأخرة', m.ok && ma <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(m.at || '').slice(0, 10)) + '</span>' : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>']);
  var dl = ((contLoad.dl || {}).items || []).map(function(x){ return { at:x.at, what:x.what, d:Math.ceil((Date.parse(x.at) - now) / 86400000) }; })
    .filter(function(x){ return isFinite(x.d) && x.d >= 0; }).sort(function(a, b){ return a.d - b.d; });
  var key = dl.filter(function(x){ return /مفتاح الدفع/.test(x.what); })[0];
  rows.push([esc(t('انتهاء مفتاح الدفع')), key ? pill(key.d > 30 ? 'سليم' : 'يقترب', key.d > 30 ? 'ok' : 'bad') + ' <span class="num">' + esc(key.at) + '</span> \u00b7 ' + nm(key.d) + ' ' + esc(t('يوم')) : '\u2014']);
  if (dl[0]) rows.push([esc(t('أقرب موعد')), esc(dl[0].what) + ' \u00b7 <span class="num">' + esc(dl[0].at) + '</span> (' + nm(dl[0].d) + ' ' + esc(t('يوم')) + ')']);
  var named = contRes().filter(function(r){ return D[r[0]]; }).length;
  var res = contRes().map(function(r){
    return [esc(t(r[1])), contCard.ed && may('perms') ? '<input id="ct_' + r[0] + '" dir="auto" value="' + esc(D[r[0]] || '') + '" placeholder="' + esc(t('اسم البديل')) + '">'
      : (D[r[0]] ? esc(D[r[0]]) : pill('غير مسمّى', 'warn'))];
  });
  return card((named < contRes().length ? '\u26A0 ' : '\u{1F91D} ') + t('ما يعتمد على شخص'),
    table(['البند', 'الحالة'], rows)
    + '<h4 style="margin:12px 0 6px">' + esc(t('البدائل المسمّاة')) + ' (' + nm(named) + '/' + nm(contRes().length) + ')</h4>'
    + table(['المورد', 'البديل'], res)
    + (may('perms') ? '<div class="actions" style="margin:8px 0 0">' + (contCard.ed ? btn('\u2713 ' + t('احفظ البدائل'), 'btn-primary btn-sm', ' data-ctsave="1"') : btn('\u270F ' + t('سمِّ البدائل'), 'btn-secondary btn-sm', ' data-cted="1"')) + '</div>' : '')
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('التفاصيل في دليل التسليم §٧ وفي دليل العمليات (دورتا الجسر والربط).')) + '</p>');
}

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

PAGE.org = { m:'التخطيط', t:'التنظيم والسلامة',
  l:'من يغطّي ماذا ومن يُساءل — والحوادثُ وإجراءاتُ السلامة والدروس.',
  body:function(){
    var head = tabHead('org'), cur = tabCur('org');
    if (cur === 'hse') return head + (function(){
    var SC = scores();
    var manDays = SC.list.reduce(function(a,e){ return a + e.nDays; }, 0);
    var hrs = manDays * (cfgGet('hours') || 8);
    var n = HSE.incidents.length;

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
            ['تمت الزيارة', N(S.surveyed), S.total ? nm(Math.round(S.surveyed/S.total*100))+'٪' : ''],
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

            + (trialRows().length
                ? '<div class="field"><label>' + esc(t('لتجربة')) + '</label><select id="byTrial">'
                  + '<option value="">' + esc(t('— ليس لتجربة —')) + '</option>'
                  + trialRows().map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.n) + '</option>'; }).join('')
                  + '</select></div>'
                : '')
            + '<div class="field"><label>' + esc(t('صورة الفاتورة')) + '</label>'
            +   '<label class="btn btn-secondary" style="width:100%;justify-content:center;cursor:pointer">\u{1F9FE} ' + esc(t('صوّر الفاتورة أو اختر صورتها')) + '<input type="file" accept="image/*" data-buyphoto="1" style="display:none"></label>'
            +   '<div id="byPhPrev" class="hint" style="margin:4px 0 0">' + buyPhPrevHtml() + '</div></div>'
            + '</div>'
            + '<div class="actions">' + btn(BUY_ED ? '\u2714 ' + t('احفظ التعديل') : t('سجّل الشراء'),'btn-primary',' data-byadd="1"') + (BUY_ED ? btn(t('إلغاء التعديل'),'btn-quiet',' data-byedcancel="1"') : '') + '</div>'
            + '<p class="hint">' + esc(t('ما تجاوز حدَّ الاعتماد يُسجَّل «بانتظار الاعتماد» ولا يدخل المنصرف.')) + '</p>')
        : '')
      + cardFlush(t('العمليات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة','الفاتورة',''],
                capList(L, 200).map(function(b){
                  return ['<span class="num">' + esc(dayKey(b.at)) + '</span>',
                          esc(b.item), esc(b.cat), esc(t(b.zone || '—')), N(b.amt), esc(b.sup),
                          pill(t(b.st), b.st === 'معتمد' ? 'ok' : 'wrn'),
                          buyInvCell(b),
                          buyMayEdit() ? btn('\u270E','btn-quiet btn-sm',' data-byedit="' + esc(b.id) + '" title="' + esc(t('تعديل')) + '"') + btn('\u2715','btn-quiet btn-sm',' data-bydel="' + esc(b.id) + '" title="' + esc(t('حذف')) + '"') : ''];
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
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt; }, 0)),
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + Math.round(x.amt*x.retPct/100); }, 0)),
               '<b>' + nm(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt - Math.round(x.amt*x.retPct/100); }, 0)) + '</b>',
               '','']),
            btn('⬇ إكسل — المستخلصات','btn-secondary btn-sm',' data-xls="ipc"'))
        : card('', alertBox('info','لا مستخلصاتٍ بعد — يُبنى المستخلصُ على المكتسَب المعتمَد.')))

      + card('دورة المستخلص',
          flow(['يُبنى من المكتسَب','يُقدَّم','يُعتمَد','يُصرَف'], 0)
          + '<p class="hint">' + esc(t('الاستقطاعُ يُحتجَز حتى انتهاء الضمان ثم يُفرَج عنه.')) + '</p>');
  })();
  }};

EXP.repSide = 'co';

function repChips(){
  var co = REPORTS.filter(function(r){ return r.side==='co'; }).length;
  var cl = REPORTS.filter(function(r){ return r.side==='cl'; }).length;
  return [['co','\u{1F3E2} ' + t('تقارير الشركة'), co],
          ['cl','\u{1F54B} ' + t('تقارير الوزارة'), cl],
          ['sched','\u23F0 ' + t('الدوريات'), PERIODS.length]].map(function(c){
    return '<button type="button" class="chip' + (EXP.repSide===c[0]?' on':'') + '" data-repside="' + c[0] + '">'
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

PAGE.guide = { m:'المساعدة', t:'الأدلة',
  l:'دليلُك أنت بما تملكه من شاشات، ودليلُ العمليات خطوةً خطوة.',
  body:function(){
    var head = tabHead('guide'), cur = tabCur('guide');
    if (cur === 'wf') return head + wfBody();
    if (cur === 'guide') return head + (function(){
    var r = R();

    var pick = may('roles') || may('users');
    var cur = (pick && GUIDE.role && ROLES[GUIDE.role]) ? GUIDE.role : ROLE;

    return (pick
      ? '<div class="chips">' + Object.keys(ROLES).map(function(k){
          return '<button type="button" class="chip' + (cur === k ? ' on' : '')
            + '" data-grole="' + k + '">' + esc(t(ROLES[k].n)) + '</button>';
        }).join('') + '</div>'
      : '')

      + roleGuide(cur)

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

              '<div class="actions">'

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

function assistDiagSig(){ try { var d = assistDiag(); return [d.q, d.pq, d.pf, d.pz, d.on ? 1 : 0, d.lite ? 1 : 0, d.idbBad ? 1 : 0].join('|'); } catch (e){ return ''; } }
function assistLiveSync(){
  if (!ASSIST_OPEN) { assistLiveSync.sig = ''; return; }
  var rs = document.getElementById('assistRes'); if (!rs) return;
  var sig = assistDiagSig(); if (!assistLiveSync.sig){ assistLiveSync.sig = sig; return; }
  if (sig !== assistLiveSync.sig){ assistLiveSync.sig = sig; rs.innerHTML = assistResHtml(); }
}
setInterval(function(){ try { assistLiveSync(); } catch (e){ LS_ERR = e; } }, 2000);

function aqRepCols(){ return ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشاخص', 'المسح', 'التركيب', 'الوزارة', 'نظام البطاقات', 'القارئ', 'الإشارة', 'الإشغال']; }

function aqRepExport(fmt){
  var q = ASSIST_Q || '', D = aqRepData(q); if (!D.rows.length){ toast(t('لا نقاطَ تنطبق عليها الشروط')); return; }
  aqRepPrep();
  var cond = D.P.conds.map(function(c){ return t(c.label); }).join(' \u00b7 '), cols = aqRepCols().map(function(c){ return t(c); });
  var body = D.rows.map(aqRepRow), GR = aqRepGroup(D);
  logEvent('تقرير بالكلام — ' + q.slice(0, 80) + ' · ' + D.rows.length + ' نقطة · ' + fmt);
  if (fmt === 'xls'){
    xlsSheets((GR ? [[t('التجميع'), [GR.cols.map(function(c){ return t(c); })].concat(GR.rows).concat([GR.total])]] : []).concat([[t('النقاط'), [cols].concat(body)], [t('الشروط'), [[t('الطلب'), q], [t('ما فُهم'), cond], [t('ما لم يُفهَم'), D.P.unknown.join(' \u00b7 ')], [t('العدد'), D.rows.length], [t('الوقت'), fmtDT()], [t('بواسطة'), dispName(STATE.meta.name || '')]]]]),
      'nusuk-report-' + dayKey(Date.now()) + '.xlsx');
    return;
  }
  var css = 'body{font:11.5px/1.55 system-ui,"Segoe UI",Tahoma;margin:18px;color:#111}h1{font-size:19px;margin:0;color:#1F4E79}'
    + '.meta{color:#556;font-size:11px;margin:4px 0 10px}.box{border:1px solid #dfe6ee;border-radius:10px;padding:8px 12px;margin:0 0 10px;background:#f8fbff}'
    + '.pill{display:inline-block;border:1px solid #9cc3e6;border-radius:99px;padding:1px 9px;margin:2px;font-size:11px;background:#eef6ff}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5px}th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}.big{font-size:22px;font-weight:800;color:#12203a}'
    + '.foot{margin-top:10px;color:#889;font-size:10px}@page{size:A4 landscape;margin:12mm}';
  var html = '<div style="display:flex;align-items:center;gap:12px">' + (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:36px;width:auto">' : '')
    + '<h1>' + esc(t('قارئات أفاقي — تقرير')) + '</h1></div>'
    + '<div class="meta">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>'
    + '<div class="box"><div><b>' + esc(t('الطلب')) + ':</b> ' + esc(q) + '</div><div style="margin-top:4px"><b>' + esc(t('الشروط')) + ':</b> '
    + D.P.conds.map(function(c){ return '<span class="pill">' + esc(t(c.label)) + '</span>'; }).join('') + '</div>'
    + '<div style="margin-top:4px"><span class="big">' + esc(nm(D.rows.length)) + '</span> ' + esc(t('نقطة')) + '</div></div>'
    + (GR ? '<h3 style="margin:10px 0 6px;color:#1F4E79">' + esc(t('التجميع حسب')) + ' ' + esc(t(GR.label)) + '</h3><table><thead><tr>' + GR.cols.map(function(c){ return '<th>' + esc(t(c)) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + GR.rows.concat([GR.total]).map(function(r, ri){ return '<tr' + (ri === GR.rows.length ? ' style="font-weight:700"' : '') + '>' + r.map(function(c){ return '<td>' + esc(String(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'
        + '<h3 style="margin:14px 0 6px;color:#1F4E79">' + esc(t('النقاط')) + '</h3>' : '')
    + '<table><thead><tr>' + cols.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + body.slice(0, 1500).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
    + '</tbody></table>' + (body.length > 1500 ? '<div class="foot">' + esc(t('عُرض ألفٌ وخمسمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '')
    + '<div class="foot">' + esc(t('من بيانات الجهاز وقتَ الإصدار — قارئات أفاقي للمسح والتركيب'))    + '</div>';
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>' + esc(t('قارئات أفاقي — تقرير')) + '</title><style>' + css + '</style></head><body>' + html + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  toast(t('اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function aqGoTo(spec){
  var p = String(spec || '').split('|');
  ASSIST_OPEN = false;
  if (p[0] === 'site' && p[1]){ DETAIL_ID = p[1]; CUR = 'site'; render(); return; }
  if (p[0] === 'page' && p[1]){ if (p[2]) EXT.stF = p[2]; navPush(CUR); goPage(p[1]); render(); }
}

function tfdStart(f, d){
  if (!tfdMay()){ toast(t('رسمُ المسارات للمهندس فما فوق')); return; }
  TFD.on = true; TFD.f = (f == null ? TFD.f : +f); TFD.d = d || TFD.d; TFD.nodes = []; TFD.paths = []; TFD.pts = []; POP_OPEN = false; PIN_ON = false; if (typeof ROUTE === 'object') ROUTE.on = false;
  tfdGraph().then(function(g){ toast(t(g ? 'اضغط على الخريطة نقطةً بعد نقطة — الخطُّ يمشي على الشوارع وحدَها' : 'تعذّر تحميلُ شبكة الشوارع — تحقّق من الشبكة')); });
  if (typeof TFW === 'object' && TFW.f < 0){ TFW.f = TFD.f; tfwLoad(); tfwPaint(); }
  if (typeof mapPaint === 'function') mapPaint(); render(1);
}

function tfdUndo(){ TFD.nodes.pop(); if (TFD.pts) TFD.pts.pop(); if (TFD.paths.length >= TFD.nodes.length && TFD.paths.length) TFD.paths.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1); }
function tfdCancel(){ TFD.on = false; TFD.nodes = []; TFD.paths = []; TFD.pts = []; TFD.free = false; if (typeof mapPaint === 'function') mapPaint(); render(1); }

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

function routeStart(mode){
  if (!may('settings')){ toast(t('إضافةُ النقاط للمكتب')); return; }
  ROUTE.on = true; ROUTE.mode = (mode === 'area' ? 'area' : 'line'); ROUTE.pts = []; POP_OPEN = false; PIN_ON = false;
  ROUTE.gen = null; ROUTE.moved = 0;
  RT_MIN = false; drawFlag();
  if (ROUTE.mode === 'area' && ROUTE.every === 250) ROUTE.every = 50;

  if (ROUTE.mode === 'area') ROUTE.type = 'مخيم';
  else if (ROUTE.type === 'مخيم') ROUTE.type = 'ممر';
  toast(t(ROUTE.mode === 'area' ? 'ارسم حدودَ المخيم: اضغط على الخريطة حول حدوده' : 'ارسم المسار: اضغط على الخريطة نقطةً بعد نقطة'));
  render(1);
}

function routeUndo(){
  if (ROUTE.gen){ routeRegen(); return; }
  ROUTE.pts.pop(); if (typeof mapPaint === 'function') mapPaint(); render(1);
}

function routeRegen(){
  ROUTE.gen = null; ROUTE.moved = 0;
  render(1);
}

function polyFlat(P){
  var out = [];
  P.forEach(function(p){ out.push(+(+p[0]).toFixed(6), +(+p[1]).toFixed(6)); });
  return out;
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

  return polyIn(c, P) ? c : (polyIn(m, P) ? m : [P[0][0], P[0][1]]);
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

  visitAsnOpen(made, true);
  toast(nm(n) + ' ' + t('نقطةً أُضيفت على المسار') + ' \u00b7 ' + t('جدوِل زيارتَها'));
  if (typeof mapPaint === 'function') mapPaint();
}

function pinStart(){
  if (PIN_ON){ pinCancel(); return; }
  if (!may('settings') && ROLE !== 'viewer'){ toast(t('إضافةُ النقاط للمكتب')); return; }
  PIN_ON = true; POP_OPEN = false; drawFlag();
  toast(t('اضغط على الخريطة حيث تريد النقطة'));
  render(1);
}

function moveStart(id){
  MOVE_ID = id;
  POP_OPEN = false;
  toast(t('اضغط على الموقع الجديد على الخريطة'));
  render(1);
}

function markSurvey(id){
  if (!may('approve')){ toast(t('الزيارةُ من «نموذج المسح» — وتسجيلُها مباشرةً للمهندس')); return; }
  var rec = STATE.recs[id];
  if (rec){

    toast(t(recIsQuick(rec) ? 'الزيارةُ مسجّلة — حذفُ الزيارات موقوفٌ الآن؛ للتصحيح افتح «تعديل المسح»' : 'هذه زيارةٌ بنموذج مسحٍ كامل — لا تُلغى من هنا؛ للتصحيح افتح «تعديل المسح»'));
    return;
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
  if (!may('approve')){ toast(t('سجّل التركيبَ من «نموذج التركيب» بقطعه وسيريالاته وصوره')); return; }
  if (insStatusIs(cur.status, status)){

    if (insStatusIs(status, 'مُركّب')){ toast(cur.approved ? t('مُركّبةٌ ومعتمدة') : t('مُركّبةٌ فعلًا — بانتظار التدقيق الهندسي')); return; }

    var heavy = cur.approved || Object.keys(cur.parts || {}).length || Object.keys(cur.serials || {}).length || (cur.photos && cur.photos.length) || cur.sol || cur.solution;
    toast(t(heavy ? 'لهذا التركيب قطعٌ أو سيريالاتٌ أو اعتماد — لا يُلغى من هنا؛ للتصحيح افتح «تعديل التركيب»' : 'الحالةُ مسجّلة — حذفُ التركيبات موقوفٌ الآن؛ اختر الحالةَ الصحيحة بدلها'));
    return;
  } else {
    cur.status = insCanon(status);
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
      + '<span class="hint" style="margin:0">' + esc(t('تمت الزيارة')) + ' <b class="num">' + nm(o.sv) + '</b> ' + esc(t('من')) + ' <b class="num">' + nm(o.n) + '</b>'
      +   ' \u00b7 ' + esc(t('متبقٍّ')) + ' <b class="num">' + nm(o.n - o.sv) + '</b></span></button>';
  };
  return '<div class="wt-row" style="flex-wrap:wrap;gap:8px;align-items:stretch">'
    + one('', t('كلُّ المشاعر'), K.total)
    + names.map(function(z){ return one(z, t(z), Z[z]); }).join('')
    + '</div>';
}

function declaredZones(){
  var out = []; declaredKeys().forEach(function(k){ var z = k.split('|')[0]; if (z && out.indexOf(z) < 0) out.push(z); }); return out;
}

function zonesLive(){
  var out = zoneList(); declaredZones().forEach(function(z){ if (out.indexOf(z) < 0) out.push(z); }); return out;
}

function handNext(){
  HAND_SEQ = (HAND_SEQ || 0) + 1;
  CORE.set('cfg', 'handSeq', { n:HAND_SEQ });
  var n = String(HAND_SEQ);
  while (n.length < 4) n = '0' + n;
  return 'HO-' + n;
}

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

if (!('execOv' in CFG)) CFG.execOv = null;
if (!('execOvSeeded' in CFG)) CFG.execOvSeeded = null;

function techDoneSet(id, on){
  var x = siteFind(id); if (!x) return false; if (!may('settings')){ toast(t('الزيارةُ التقنيةُ يقرّها المهندس')); return false; }
  if (on){ x.techDone = Date.now(); siteOvSet(id, { techDone:x.techDone }); } else { delete x.techDone; siteOvSet(id, { techDone:null }); }
  statBump(); return true;
}
function selTechDone(){ var n = 0; selIds().forEach(function(id){ var x = siteFind(id), r = STATE.recs[id]; if (x && r && !x.techDone && techVisit(x, r) && techDoneSet(id, true)) n++; }); if (n) logEvent('تمت الزيارةُ التقنية لـ' + n + ' نقطة (جماعيًّا)'); return n; }
function selExecSet(st){ var n = 0; selIds().forEach(function(id){ if (execOvSet(id, st)) n++; }); if (n) logEvent('تصنيفُ التقرير التنفيذي: ' + n + ' نقطة ← ' + (st ? EXEC_L[st][0] : 'تلقائي')); return n; }

var EXEC_STATIC = [
  ['مراكز تفويج', 'النورية', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الزايدي', 'كاميرات البث', '', 'SCOPE'],
  ['مراكز تفويج', 'الهجرة 1', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الهجرة 2', 'كاميرات البث', '', 'SCOPE'],
  ['المشاعر المقدسة', 'منى', 'كاميرات مزودين الخدمة', '', 'SP_MINA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات جبل الرحمه', 'WAIT_RAHMA'], ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات مسجد نمرة', 'WAIT_NAMIRA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات القطار', 'WAIT_TRAIN'], ['المشاعر المقدسة', 'عرفه', 'كاميرات البث', '', 'ARAFAT_BTH'],
  ['المشاعر المقدسة', 'عرفه', 'كاميرات مزودين الخدمة', '', 'SP_ARAFAT']
];
var EXEC_O = { c1:['مراكز تفويج', 'المشاعر المقدسة'], c2:['النورية', 'الزايدي', 'الهجرة 1', 'الهجرة 2', 'منى', 'عرفه', 'مزدلفه'],
  c3:{ 'منى':['كاميرات مزودين الخدمة', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], 'عرفه':['مخيمات', 'ممرات', 'كاميرات الحافلات', 'كاميرات البث', 'قطار', 'كاميرات مزودين الخدمة'], '*':['كاميرات الحافلات', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'] },
  c3all:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار', 'كاميرات مزودين الخدمة'], c4:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة', 'ممرات القطار'] };

function execRows(){
  var S = (STATE.sites || []).filter(function(x){ return !x.hidden && !x.deleted; });
  var known = S.filter(function(x){ return execT1(x) === 'مراكز تفويج' && execT2(x) && x.lat; });
  var t2 = function(x){ var v = execT2(x); if (v || execT1(x) !== 'مراكز تفويج' || !x.lat) return v; var best = null, bd = 1e9;
    known.forEach(function(k){ var d = Math.pow(k.lat - x.lat, 2) + Math.pow(k.lng - x.lng, 2); if (d < bd){ bd = d; best = k; } }); return best ? execT2(best) : 'الهجرة 2'; };
  var agg = {}, tot = { all:0, visited:0, surveyed:0, ready:0, chal:0, revisit:0, pending:0, installed:0 };
  S.forEach(function(x){ tot.all++; var r = STATE.recs[x.id], c1 = execT1(x), c2 = t2(x), c3 = execT3(x), c4 = execT4(x), st = execStatus(r, execPolicy(c1, c2, c3, c4), x), k = [c1, c2, c3, c4, st].join('|');
    agg[k] = (agg[k] || 0) + 1; if (r && svVisited(r)) tot.visited++; if (r && svDone(r)) tot.surveyed++;
    if (st === 'INSTALLED') tot.installed++; else if (/^READY/.test(st)) tot.ready++; else if (st === 'PERMIT' || st === 'LOC') tot.revisit++; else if (/^(SCOPE|WAIT_|ARAFAT_BTH|SP_)/.test(st)) tot.pending++; else tot.chal++; });
  var rows = Object.keys(agg).map(function(k){ var p = k.split('|'); return { c1:p[0], c2:p[1], c3:p[2], c4:p[3], b:p[4], n:agg[k] }; });
  EXEC_STATIC.forEach(function(s0){ if (!rows.some(function(r){ return r.c2 === s0[1] && r.c3 === s0[2] && r.c4 === s0[3]; })) rows.push({ c1:s0[0], c2:s0[1], c3:s0[2], c4:s0[3], b:s0[4], n:null }); });
  var ix = function(L, v){ var i = (L || []).indexOf(v); return i < 0 ? 99 : i; };
  var key = function(r){ var c4r = r.c3 === 'ممرات' ? (r.c4 === 'ممرات الطرق' && /^READY/.test(r.b) ? 9 : ix(EXEC_O.c4, r.c4)) : 0;
    var tail = r.b === 'SP_ARAFAT' ? 1 : 0;
    var bo = r.c2 === 'الهجرة 2' && /^READY/.test(r.b) ? -1 : ix(EXEC_ORDER_L, r.b);
    return [tail, ix(EXEC_O.c1, r.c1), ix(EXEC_O.c2, r.c2), ix(EXEC_O.c3[r.c2] || EXEC_O.c3['*'], r.c3), c4r, bo]; };
  rows.sort(function(a, b){ var A = key(a), B = key(b); for (var q = 0; q < A.length; q++) if (A[q] !== B[q]) return A[q] - B[q]; return 0; });
  return { rows:rows, tot:tot };
}

function execSheetXml(xml, rows){
  var esc0 = function(v){ return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var COLS = 'ABCDEFGH'.split(''), st = {};
  COLS.forEach(function(c){ var m = new RegExp('<c r="' + c + '2" s="(\\d+)"').exec(xml); st[c] = m ? m[1] : '14'; });
  var cell = function(c, r, v){ if (c === 'E') return v == null ? '<c r="E' + r + '" s="' + st[c] + '"/>' : '<c r="E' + r + '" s="' + st[c] + '"><v>' + (+v || 0) + '</v></c>';
    return v ? '<c r="' + c + r + '" s="' + st[c] + '" t="inlineStr"><is><t>' + esc0(v) + '</t></is></c>' : '<c r="' + c + r + '" s="' + st[c] + '"/>'; };
  var data = {}; rows.forEach(function(x, i){ var L = EXEC_L[x.b] || ['', '']; data[i + 2] = { A:x.c1, B:x.c2, C:x.c3, D:x.c4, E:x.n, F:L[0], G:L[1], H:'' }; });

  xml = xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, function(m0, rr, attrs, inner){ var r = +rr; if (r < 2) return m0;
    COLS.forEach(function(c){ inner = inner.replace(new RegExp('<c r="' + c + r + '"[^>]*?(\\/>|>[\\s\\S]*?<\\/c>)'), ''); });
    var nc = data[r] ? COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') : ''; delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + inner + '</row>'; });
  xml = xml.replace(/<row r="(\d+)"([^>]*)\/>/g, function(m0, rr, attrs){ var r = +rr; if (!data[r]) return m0; var nc = COLS.map(function(c){ return cell(c, r, data[r][c]); }).join(''); delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + '</row>'; });
  var extra = Object.keys(data).map(Number).sort(function(a, b){ return a - b; }).map(function(r){ return '<row r="' + r + '" spans="1:12">' + COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') + '</row>'; }).join('');
  if (extra){
    var rowsArr = []; xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ return '<sheetData>' + body + extra + '</sheetData>'; });
    xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ var L = body.match(/<row r="\d+"[\s\S]*?<\/row>|<row r="\d+"[^>]*\/>/g) || []; L.sort(function(a, b){ return +/r="(\d+)"/.exec(a)[1] - +/r="(\d+)"/.exec(b)[1]; }); return '<sheetData>' + L.join('') + '</sheetData>'; });
  }

  var LST = { C:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], D:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة'] };
  ['C', 'D'].forEach(function(col){
    var bad = []; rows.forEach(function(x, i){ var v = col === 'C' ? x.c3 : x.c4; if (LST[col].indexOf(v) < 0) bad.push(i + 2); });
    xml = xml.replace(new RegExp('(<xm:sqref>)(' + col + '\\d+:' + col + '\\d+(?: ' + col + '\\d+:' + col + '\\d+)*)(</xm:sqref>)'), function(m0, a1, ref, a3){
      var nums = ref.match(/\d+/g).map(Number), end = Math.max.apply(null, nums), out = [], from = 2;
      bad.forEach(function(b){ if (b > from) out.push(col + from + ':' + col + (b - 1)); from = b + 1; }); if (from <= end) out.push(col + from + ':' + col + end);
      return a1 + out.join(' ') + a3; });
  });
  return xml;
}
function execTplParts(){
  if (execTplParts.p) return execTplParts.p;
  if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('no-inflate'));
  var bin = atob(EXEC_TPL_B64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  var inflate = function(bytes){ return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(b){ return new Uint8Array(b); }); };
  execTplParts.p = Promise.all(zipRead(u.buffer).map(function(e){ return (e.method === 8 ? inflate(e.data) : Promise.resolve(e.data)).then(function(b){ return [e.name, new TextDecoder().decode(b)]; }); }));
  execTplParts.p.catch(function(){ execTplParts.p = null; });
  return execTplParts.p;
}
function execXlsx(){
  var R = execRows(); if (!R.rows.length){ toast(t('لا بيانات بعد')); return Promise.resolve(false); }
  toast(t('يُجهَّز التقرير التنفيذي…'));
  return execTplParts().then(function(parts){
    var files = parts.map(function(p){ return { name:p[0], data:p[0] === 'xl/worksheets/sheet1.xml' ? execSheetXml(p[1], R.rows) : p[1] }; });
    var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'تقرير_المسح_التنفيذي_' + dayKey() + '.xlsx');
    if (ok !== false){ logEvent('تصديرُ التقرير التنفيذي — ' + R.rows.length + ' صفًّا · ' + R.tot.all + ' نقطة'); toast(t('صُدّر التقرير التنفيذي — بأرقام اللحظة')); }
    return ok;
  }).catch(function(e){ softErr('التقرير التنفيذي', e, String(e && e.message) === 'no-inflate' ? 'متصفحُ هذا الجهاز قديمٌ على فكِّ القالب — صدِّره من الكمبيوتر' : 'تعذّر تجهيز التقرير التنفيذي'); return false; });
}

var EXEC_TPL_B64 = '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';

var EXT_LIVE  = 'https://livefeed.nusukcard.net';
var EXT_LIVE_KEY = 'DJsowqfnR2qlP32BzySo_8hNUy3Wypn2xFBzCcPELlo';

function extTokSave(tok){
  if (!may('settings')){ toast(t('التوكنُ للمهندس وحدَه')); return; }
  var t0 = String(tok || '').trim();
  if (!t0){ toast(t('لصق التوكن أوّلًا')); return; }
  var expAt = 0;
  try {
    var pl = JSON.parse(atob(t0.split('.')[1]));
    expAt = (pl.exp || 0) * 1000;
  } catch(e){}
  EXT.tok = t0; EXT.expAt = expAt;
  CORE.set('cfg', 'extApi', { tok:t0, expAt:expAt, updAt:Date.now() }); CORE.saveSoon();
  toast(t(expAt ? ('حُفظ التوكن — يصلح حتى ' + new Date(expAt).toLocaleDateString('ar')) : 'حُفظ التوكن'));
  render(1);
}

function extTokClear(){
  if (!may('settings')) return;
  EXT.tok = null; EXT.expAt = 0;
  CORE.set('cfg', 'extApi', { tok:'', expAt:0, updAt:Date.now() }); CORE.saveSoon();
  toast(t('مُسح التوكن'));
  render(1);
}

function extOvCard(tentCode, ov, readerInfo, tentMeta){
  var cap   = (ov.occupancyStatus || {}).totalCapacity || 0;
  var wCard = (ov.occupancyStatus || {}).currentlyOccupied || 0;
  var woCard= (ov.occupancyStatus || {}).withoutBracelet || 0;
  var other = (ov.occupancyStatus || {}).fromOtherCamps || 0;
  var total = wCard + woCard + other;
  var pct   = cap ? Math.round(total / cap * 100) : 0;
  var barC  = pct >= 75 ? '#27AE60' : pct >= 40 ? '#E2B33C' : '#C0392B';
  var insideT = ((ov.averageTime || {}).insideCamp  || '—');
  var transitT= ((ov.averageTime || {}).transitTime || '—');

  var lastSeen = '', lastOk = false;
  if (readerInfo && readerInfo.timestamp){
    var ms = Date.now() - new Date(readerInfo.timestamp).getTime();
    var mins = Math.floor(ms/60000);
    lastOk = mins < 30;
    lastSeen = mins < 2 ? t('الآن') : mins < 60 ? nm(mins) + ' ' + t('د') : nm(Math.floor(mins/60)) + ' ' + t('س');
  }

  var group = (tentMeta && tentMeta.tentGroup) ? tentMeta.tentGroup : '';
  var op    = (tentMeta && tentMeta.serviceOperators && tentMeta.serviceOperators[0]) ? tentMeta.serviceOperators[0] : '';

  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid ' + barC + '">'
    + '<div class="card-body">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px">'
    +   '<div><b class="num" style="font-size:18px">' + bdiText(tentCode) + '</b>'
    +   (group ? ' <span class="hint" style="font-size:13px">— ' + esc(group) + '</span>' : '')
    +   (op ? '<div class="hint" style="font-size:12px;margin-top:2px">' + esc(op) + '</div>' : '') + '</div>'
    +   '<div style="text-align:end">'
    +     '<div class="num" style="font-size:28px;font-weight:800;color:' + barC + '">' + nm(pct) + '%</div>'
    +     (lastSeen ? '<div class="hint" style="font-size:12px">'
    +       '<span style="width:8px;height:8px;border-radius:50%;display:inline-block;background:' + (lastOk ? '#27AE60' : '#E2B33C') + ';margin-inline-end:4px"></span>'
    +       esc(t('آخر إشارة')) + ' ' + lastSeen + '</div>' : '') + '</div>'
    + '</div>'
    + '<div style="background:var(--surface-2);border-radius:8px;height:8px;overflow:hidden;margin-bottom:10px">'
    +   '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + barC + ';transition:width .4s"></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">'
    +   extStatBox(t('السعة'), nm(cap), '#5B6E7C')
    +   extStatBox(t('بكروت'), nm(wCard), '#2E86DE')
    +   extStatBox(t('بدون'), nm(woCard), '#E2B33C')
    +   extStatBox(t('من أخرى'), nm(other), '#8E44AD')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
    +   '<div><span class="hint">' + esc(t('داخل المخيم')) + '</span> <b>' + esc(insideT) + '</b></div>'
    +   '<div><span class="hint">' + esc(t('وقت العبور')) + '</span> <b>' + esc(transitT) + '</b></div>'
    + '</div>'
    + '</div></div>';
}
function extStatBox(label, val, color){
  return '<div style="background:var(--surface-2);border-radius:8px;padding:6px 8px;text-align:center">'
    + '<div class="num" style="font-size:16px;font-weight:800;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + esc(label) + '</div></div>';
}

function extTokCard(){
  var expMsg = '', expColor = '#27AE60';
  if (EXT.tok && EXT.expAt){
    var rem = EXT.expAt - Date.now();
    var days = Math.floor(rem / 86400000);
    if (rem < 0){ expMsg = t('انتهى التوكن — جدّده الآن'); expColor = '#C0392B'; }
    else if (days < 1){ expMsg = t('ينتهي خلال ساعات — جدّده'); expColor = '#E2B33C'; }
    else { expMsg = t('ينتهي بعد') + ' ' + nm(days) + ' ' + t('يوم'); }
  }
  var h = '<div class="card" style="margin:0 0 12px"><div class="card-body">'
    + '<div style="font-weight:700;margin-bottom:8px">🔑 ' + esc(t('ربط نظام البطاقات')) + '</div>';
  if (EXT.tok){
    h += '<div style="margin-bottom:8px;font-size:13px">'
      + '<span style="color:' + expColor + '">●</span> '
      + esc(expMsg) + '</div>'
      + btn('\u267B ' + t('تجديد التوكن'), 'btn-secondary btn-sm', ' data-exttokclear="1"');
  } else {
    h += '<p class="hint" style="font-size:13px;margin:0 0 8px">'
      + esc(t('افتح nusukcard.net ← Console في المتصفح ← شغّل:')) + '</p>'
      + '<code style="font-size:11px;display:block;background:var(--surface-2);padding:6px;border-radius:6px;direction:ltr;word-break:break-all;margin-bottom:8px">'
      + esc('copy(local' + "Storage.getItem('mj.accessToken'))")
      + '</code>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + '<input id="extTokInp" type="password" dir="ltr" autocomplete="off" placeholder="eyJ…" style="flex:1;min-width:0;font-size:12px" />'
      + btn(t('حفظ'), 'btn-primary btn-sm', ' data-exttoksave="1"') + '</div>';
  }
  h += '</div></div>';
  return h;
}

function mtCamps(){
  extBridgePendingApply();

  if (!EXT.tok && !EXT._tokAsked){ EXT._tokAsked = true; extTokLoad(); }

  var h = '';

  extBridgeLoad();

  var setup = may('settings') ? extSetupBar() : '';
  if (!EXT.tok && !EXT.bridge){
    return h + setup + (may('settings') ? '' : extSnapView());
  }

  if (!EXT_MATCH_STATE || EXT.busy){
    if (!EXT.busy) extMatchLoad();
    return h + '<div class="hint" style="text-align:center;padding:20px">⟳ ' + esc(t('جارٍ تحميل بيانات المخيمات…')) + '</div>';
  }

  if (EXT.err) h += alertBox('warn', t('خطأ في تحميل البيانات') + ': ' + EXT.err);

  var matched = EXT_MATCH_STATE.matched;
  var unmatched = EXT_MATCH_STATE.unmatched;

  h += extStatusCard() + extBulkCard() + setup;

  if (unmatched.length){
    h += mtDetails(t('قرّاء مُركَّبة لكن غير مطابقة في نظامهم') + ' (' + nm(unmatched.length) + ')',
      '<div class="hint" style="font-size:12px">' + unmatched.map(function(s){ return '<code>' + esc(s) + '</code>'; }).join(' · ') + '</div>', '📡');
  }

  return h;
}

function pilotRowsList(){
  pilotKick();
  return pilotSites().map(function(x){
    var ins = STATE.inss[x.id], f = (typeof trialForSite === 'function') ? trialForSite(x.id) : null;
    var nt = pilotNet(x), nk = pilotNusuk(x);
    var insSt = !ins ? 'لم يُركَّب' : ins.status === 'مسودّة' ? 'مسودّة' : (ins.status || '') + ' · ' + (ins.approved ? 'معتمد' : 'بانتظار التدقيق');
    return [x.id, x.name || '', t(x.zone || ''), t(x.type || ''), f ? (f.row.n || '') + (f.row.out ? ' · ' + t(f.row.out) : '') : '\u2014',
            t(insSt), ins && ins.status !== 'مسودّة' ? String(insRevs(ins).length + 1) : '\u2014',
            t(nt.st) + (nt.n > 1 ? ' (' + nt.up + '/' + nt.n + ')' : '') + (nt.src ? ' \u00b7 ' + t(nt.src) : ''), pilotAgo(nt.at),
            nk.ser || (ins ? t('لا سيريال قارئ') : '\u2014'), extCheckText(nk),    (nk.loc ? nk.loc + (nk.snap ? ' \u00b7 ' + t('لقطة') : '') : '') || (nk.ser ? (EXT.readers || (STATE.extSnap && !may('settings')) ? t('غير ظاهر في نظام البطاقات') : may('settings') ? t('يُحمَّل…') : t('لا لقطةَ بعد')) : '\u2014'),
            nk.at ? pilotAgo(nk.at) : '\u2014', nk.occ || '\u2014'];
  });
}

function extSnapView(){
  var S = STATE.extSnap; extSnapLoad();
  if (!S || !S.sites) return alertBox('info', t('لا لقطةَ بعد — تظهر الأرقامُ هنا بعد أول فتحٍ لهذه الشاشة من جهاز المكتب.'));
  var age = pilotAgo(S.at), old = Date.now() - (+S.at || 0) > 30 * 60000;
  var h = alertBox(old ? 'warn' : 'info', t('لقطةٌ من جهاز المكتب') + ' \u00b7 ' + t('آخر تحديث') + ' ' + age + (old ? ' \u2014 ' + t('قديمة: تتجدّد حين يفتح المكتبُ الشاشة') : ''));
  var seen = {};
  Object.keys(S.sites).forEach(function(id){
    var z = S.sites[id], c = S.camps && S.camps[z.code];
    if (!c || seen[z.code]) return; seen[z.code] = 1;
    h += extOvCard(z.code, { occupancyStatus:{ totalCapacity:c.cap, currentlyOccupied:c.w, withoutBracelet:c.wo, fromOtherCamps:c.ot },
                             averageTime:{ insideCamp:c.inT || '\u2014', transitTime:c.trT || '\u2014' } },
                   z.ts ? { timestamp:z.ts } : null, { tentGroup:c.grp || '' });
  });
  return h;
}

function extNkSave(id, val){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var x = siteFind(id); if (!x) return;
  var v = String(val == null ? '' : val).trim(), key = extNameKey(v);
  if (v){
    var other = extLinkedBy()[key];
    if (other && other !== id){ toast(t('هذا الاسمُ مربوطٌ بالنقطة') + ' ' + other); return; }
    var M = extNames();
    if (M && !M[key] && !confirm(t('الاسمُ غيرُ ظاهرٍ في نظام البطاقات الآن. يُحفَظ على أيِّ حال؟'))){ toast(t('لم يُحفَظ')); return; }
  }
  x.nk = v; siteOvSet(id, { nk:v, nkAt:Date.now(), nkBy:STATE.meta.name || '' });
  EXT_MATCH_STATE = null;
  logEvent(v ? 'ربطُ نقطةٍ بنظام البطاقات — ' + id + ' ← ' + v : 'فكُّ ربط نقطةٍ بنظام البطاقات — ' + id, id);
  toast(t(v ? 'رُبطت النقطة' : 'فُكَّ الربط')); render(1);
}

function extBulkPlan(){
  var M = extNames(); if (!M) return null;
  var linked = extLinkedBy(), want = {}, P = { apply:[], conflicts:[], linked:0, unlinked:0, noSug:0, stale:[] };
  (STATE.sites || []).forEach(function(x){
    if (!x) return;
    if (x.nk){ P.linked++; if (!M[extNameKey(x.nk)]) P.stale.push(x.id); return; }
    P.unlinked++;
    var sgs = extSuggestSrc(x); if (!sgs){ P.noSug++; return; }
    var sg = sgs.v, k = extNameKey(sg);
    (want[k] = want[k] || []).push({ id:x.id, name:x.name || x.id, type:x.type || '', zone:x.zone || '', sug:sg, src:sgs.src });
  });
  Object.keys(want).forEach(function(k){
    var L = want[k];
    if (L.length > 1 || linked[k]) P.conflicts.push({ name:L[0].sug, ids:L.map(function(z){ return z.id; }).concat(linked[k] ? [linked[k] + ' \u2713'] : []) });
    else P.apply.push(L[0]);
  });
  return P;
}
function extBulkCard(){
  if (!may('settings')) return '';
  var P = extBulkPlan();
  if (!P) return card('الربط الجماعي بنظام البطاقات', '<p class="hint" style="margin:0">' + esc(t('يُحمَّل…')) + '</p>');
  var body = stats([['مربوطة', N(P.linked), 'ok'], ['غير مربوطة', N(P.unlinked)], ['لها اقتراح', N(P.apply.length), 'acc'], ['تعارض', N(P.conflicts.length), P.conflicts.length ? 'wrn' : '']]);
  if (P.apply.length){
    body += '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد المقترحات') + ' (' + nm(P.apply.length) + ')', 'btn-primary btn-sm', ' data-nkbulk="1"')
      + btn((EXT.sugOpen ? '\u25B2 ' + t('أخفِ المقترحات') : '\u25BC ' + t('اعرض المقترحات')), 'btn-quiet btn-sm', ' data-sugopen="1"') + '</div>';
    if (EXT.sugOpen) body += table(['النقطة', 'النوع', 'الاقتراح', 'المصدر'], P.apply.slice(0, 50).map(function(z){
      return ['<bdi>' + esc(z.id) + '</bdi><br><span class="hint" style="margin:0">' + esc(z.name) + '</span>', esc(t(z.type)), '<b dir="ltr">' + esc(z.sug) + '</b>', esc(t(z.src))];
    })) + (P.apply.length > 50 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(P.apply.length - 50) + '</p>' : '');
  } else body += '<p class="hint" style="margin:6px 0 0">' + esc(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')) + '</p>';
  if (P.conflicts.length) body += mtDetails(t('تعارضٌ يُحسَم بيد') + ' (' + nm(P.conflicts.length) + ')',
    table(['الاسم في النظام', 'النقاط'], P.conflicts.slice(0, 60).map(function(c){ return ['<b dir="ltr">' + esc(c.name) + '</b>', esc(c.ids.join(' \u00b7 '))]; })), '\u26A0');

  var M = extNames(), linked = extLinkedBy(), gaps = [];
  if (M) Object.keys(M).forEach(function(k){ if (!linked[k] && !(M[k].tent && extTentByCode(M[k].name) && (STATE.sites || []).some(function(x){ return x.type === 'مخيم' && x.sign && extCodeKey(x.sign) === extCodeKey(M[k].name) && extTentForSite(x); }))) gaps.push(M[k]); });
  if (gaps.length) body += mtDetails(t('مواقعُ في النظام لا تقابلها نقطةٌ عندنا') + ' (' + nm(gaps.length) + ')',
    '<p class="hint" style="margin:0 0 6px">' + esc(t('قرّاءٌ وخيامٌ مسجَّلةٌ عندهم ولم تُربَط بنقطةٍ في سجلّنا — إمّا ناقصةٌ من السجلّ أو خارج نطاقنا')) + '</p>'
    + '<div class="hint" style="font-size:12px" dir="ltr">' + gaps.slice(0, 150).map(function(g){ return esc(g.name) + (g.rd.length ? ' (' + g.rd.length + ')' : ''); }).join(' \u00b7 ') + (gaps.length > 150 ? ' \u2026' : '') + '</div>', '\u{1F50D}');
  if (P.stale.length) body += mtDetails(t('مربوطةٌ باسمٍ غيرِ موجودٍ في النظام') + ' (' + nm(P.stale.length) + ')',
    '<div class="hint" style="font-size:12px">' + P.stale.slice(0, 80).map(function(id){ return '<bdi>' + esc(id) + '</bdi>'; }).join(' \u00b7 ') + '</div>', '\u26A0');
  return card('الربط الجماعي بنظام البطاقات', body);
}
function extBulkApply(){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var P = extBulkPlan(); if (!P || !P.apply.length){ toast(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')); return; }
  if (!confirm(t('تُربَط') + ' ' + P.apply.length + ' ' + t('نقطةً بأسمائها المقترحة. متابعة؟'))){ toast(t('لم يُربَط شيء — أُلغي')); return; }
  var by = STATE.meta.name || '', at = Date.now();
  P.apply.forEach(function(z){ var x = siteFind(z.id); if (!x) return; x.nk = z.sug; siteOvSet(z.id, { nk:z.sug, nkAt:at, nkBy:by, nkSrc:z.src }); });
  EXT_MATCH_STATE = null;
  logEvent('ربطٌ جماعيٌّ بنظام البطاقات — ' + P.apply.length + ' نقطة · تعارض ' + P.conflicts.length);
  toast(t('رُبطت') + ' ' + nm(P.apply.length) + ' ' + t('نقطة')); render(1);
}

function ex47Apply(){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var P = EXT.ex47, ids = P ? Object.keys(P.set) : []; if (!ids.length){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!confirm(t('تُحفَظ بياناتُ ١٤٤٧ لـ') + ' ' + ids.length + ' ' + t('نقطةً، ويُحفَظ ما خارج السجلّ') + ' (' + (P.orph || []).length + ') ' + t('بعَلَم «ليست على الخريطة». متابعة؟'))){ toast(t('لم يُحفَظ — أُلغي')); return; }
  var at = Date.now(), by = STATE.meta.name || '';
  ids.forEach(function(id){ var x = siteFind(id); if (!x) return; var v = Object.assign({ by:by, imp:at }, P.set[id]); x.ex47 = v; siteOvSet(id, { ex47:v }); });
  ex47OrphMerge(P.orph || [], ids.map(function(id){ return extNameKey(P.set[id].nm); }));
  logEvent('استيرادُ بيانات موسم ١٤٤٧ — ' + ids.length + ' نقطة · خارج الخريطة ' + (P.orph || []).length);
  EXT.ex47 = null; toast(t('حُفظت بياناتُ ١٤٤٧') + ' (' + nm(ids.length) + ')'); render(1);
}
function ex47Card(){
  if (!may('settings')) return '';
  var have = (STATE.sites || []).filter(function(x){ return x && x.ex47; }).length, P = EXT.ex47, body;
  body = '<p class="hint" style="margin:0 0 8px">' + esc(t('ملف «تسليمات الممرات» كما هو: يُقرأ على جهازك وحدَه، ويُحفَظ لكلِّ نقطةٍ سيريالاتُها وشبكتُها — بلا كلمات مرورٍ ولا شرائح.')) + '</p>'
    + '<div class="pop-rows" style="margin:0"><div><span class="k">' + esc(t('نقاطٌ لها بياناتُ ١٤٤٧')) + '</span><span class="num">' + nm(have) + '</span></div></div>';
  if (P){
    var ids = Object.keys(P.set), wr = ids.filter(function(id){ return P.set[id].rdr; }).length;
    body += stats([['مخيماتٌ في الملف', N(P.campsN)], ['ممراتٌ ونقاطٌ أخرى', N(P.pathsN)], ['طابقت نقاطَنا', N(ids.length), 'ok'], ['لها سيريالُ قارئ', N(wr), 'acc'],
                   ['مخيمٌ رقمُه ليس في سجلّنا', N(P.miss.length), P.miss.length ? 'wrn' : ''], ['خارج سجلّنا', N(P.out.length)]])
      + (P.dup ? '<p class="hint" style="margin:4px 0 0">' + esc(t('صفوفٌ إضافيةٌ لنقاطٍ مكرَّرة تُحفَظ ضمن النقطة نفسِها')) + ': ' + nm(P.dup) + '</p>' : '')
      + (P.scrub ? '<p class="hint" style="margin:4px 0 0;color:#E2B33C">\u26A0 ' + esc(t('قيمٌ أُسقطت لأنها تشبه كلماتِ مرورٍ في خانات السيريال')) + ': ' + nm(P.scrub) + '</p>' : '')
      + (P.miss.length ? mtDetails(t('مخيمٌ رقمُه ليس في سجلّنا') + ' (' + nm(P.miss.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.miss.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u26A0') : '')
      + (P.out.length ? mtDetails(t('خارج سجلّنا — الحرم والجمرات ومزدلفة وما لم يُعرَف') + ' (' + nm(P.out.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.out.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u2139') : '')
      + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد بيانات ١٤٤٧') + ' (' + nm(ids.length) + ')', 'btn-primary btn-sm', ' data-ex47ok="1"') + '</div>';
  }
  body += '<label class="btn btn-secondary btn-sm" style="margin-top:8px;display:inline-flex">\u{1F4C2} ' + esc(t(P ? 'اختر ملفًّا آخر' : 'اختر ملف تسليمات الممرات')) + '<input type="file" accept=".xlsx,.xls" data-ex47="1" style="display:none"></label>';
  return card('بيانات موسم ١٤٤٧ — الأجهزةُ نفسُها هذا الموسم', body);
}

function ex47OrphLoad(){
  if (!FB.ready || !FB.db || !may('settings')) return;
  if (EXT._orAt && Date.now() - EXT._orAt < 60000) return;
  EXT._orAt = Date.now();
  DB.col('settings').doc('ex47orph').get().then(function(doc){
    var d = (doc && doc.exists) ? doc.data() : null;
    STATE.ex47orph = (d && Array.isArray(d.rows)) ? d.rows : [];
    if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('نقاط ١٤٤٧ خارج الخريطة', e, ''); });
}
function ex47OrphSave(rows){
  STATE.ex47orph = rows;
  CORE.set('cfg', 'ex47orph', { rows:rows, at:Date.now(), by:STATE.meta.name || '' }); CORE.saveSoon();
}
function ex47OrphMerge(add, matchedKeys){
  var cur = (STATE.ex47orph || []).slice(), seen = {}, mk = {};
  (matchedKeys || []).forEach(function(k){ mk[k] = 1; });
  cur = cur.filter(function(o){ return !mk[extNameKey(o.nm)]; });
  cur.forEach(function(o){ seen[extNameKey(o.nm)] = 1; });
  add.forEach(function(o){ var k = extNameKey(o.nm); if (!seen[k]){ seen[k] = 1; cur.push(o); } });
  ex47OrphSave(cur);
}
function ex47OrphFind(nm){ return (STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) === extNameKey(nm); })[0] || null; }
function ex47OrphDrop(nm){ ex47OrphSave((STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) !== extNameKey(nm); })); }

function ex47OrphGuess(o){
  if (o.kind === 'camp' && o.sign){
    var st = o.sign.split('/')[1];
    var L = (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && x.zone === 'منى' && x.sign && String(x.sign).split('/')[1] === st && !x.ex47; });
    return L.length === 1 ? L[0] : null;
  }
  var k = extNameKey(o.nm); if (k.length < 5) return null;
  return (STATE.sites || []).filter(function(x){ return x.type !== 'مخيم' && extNameKey(x.name).indexOf(k) > -1; })[0] || null;
}
function ex47OrphLink(nm, siteId){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm), x = siteFind(String(siteId || '').trim());
  if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!x){ toast(t('اكتب معرِّفَ نقطةٍ موجودة — مثال NSK-MIN-CMP-0449')); return; }
  var v = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now(), linked:1 };
  x.ex47 = v; siteOvSet(x.id, { ex47:v }); ex47OrphDrop(nm);
  logEvent('ربطُ نقطةٍ من ملف ١٤٤٧ بنقطةٍ على الخريطة — ' + nm + ' ← ' + x.id, x.id);
  toast(t('رُبطت') + ' ' + nm + ' \u2190 ' + x.id); render(1);
}
function ex47OrphPlace(nm){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm); if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  var camp = o.kind === 'camp';
  NEWSITE.zone = /arafat|عرفات/i.test(o.nm) ? 'عرفات' : (/jamarat|الجمرات/i.test(o.nm) ? 'الجمرات' : 'منى');
  NEWSITE.type = camp ? 'مخيم' : 'ممر';
  NEWSITE.sign = camp ? (o.sign || '') : ''; NEWSITE.nm = camp ? '' : o.nm;
  NEWSITE.lat = +o.lat || 0; NEWSITE.lng = +o.lng || 0; NEWSITE.byMap = !!(o.lat && o.lng);
  NEWSITE.note = t('من ملف تسليمات ١٤٤٧') + ': ' + o.nm;
  NEWSITE.ex47 = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now() };
  NEWSITE.orph = o.nm;
  toast(t(o.lat && o.lng ? 'موضعُها من الملف — راجع البيانات واحفظ' : 'اختر موضعَها على الخريطة ثم احفظ'));
  goPage('newsite');
}
function ex47OrphCard(){
  if (!may('settings')) return '';
  if (!STATE.ex47orph) { ex47OrphLoad(); return ''; }
  var L = STATE.ex47orph; if (!L.length) return '';
  var opts = (STATE.sites || []).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(x.name || '') + '</option>'; }).join('');
  var rows = L.slice(0, 60).map(function(o, i){
    var gs = ex47OrphGuess(o), k = esc(o.nm);
    return [ '<b dir="ltr">' + esc(o.nm) + '</b><br>' + pill('\u{1F4CD} ' + t('ليست على الخريطة'), 'warn'),
             '<span class="num" dir="ltr">' + esc(o.rdr || '\u2014') + '</span>',
             '<input id="orIn' + i + '" list="orList" dir="ltr" autocomplete="off" style="min-width:150px" placeholder="NSK-…" value="' + esc(gs ? gs.id : '') + '">'
               + (gs ? '<div class="hint" style="margin:2px 0 0;font-size:11px">' + esc(t('اقتراح')) + ': ' + esc(gs.name || gs.id) + '</div>' : ''),
             btn(t('اربط'), 'btn-secondary btn-sm', ' data-orlink="' + i + '|' + k + '"') + ' ' + btn('\u{1F4CD} ' + t('ضعها على الخريطة'), 'btn-quiet btn-sm', ' data-orplace="' + k + '"') ];
  });
  return card('نقاط ملف ١٤٤٧ خارج الخريطة — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('محفوظةٌ ببيانات أجهزتها ولا تظهر على الخريطة حتى تُربَط بنقطةٍ قائمة أو يُختار موضعُها.')) + '</p>'
    + '<datalist id="orList">' + opts + '</datalist>'
    + table(['من الملف', 'سيريال القارئ', 'النقطة على الخريطة', ''], rows)
    + (L.length > 60 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(L.length - 60) + '</p>' : ''));
}

function extBridgeCodes(){
  var o = {};
  (STATE.sites || []).forEach(function(x){
    if (!x || x.type !== 'مخيم' || x.zone !== 'منى') return;
    var i = STATE.inss[x.id];
    if (!(x.pilot || x.nk || x.ex47 || (i && i.status && i.status !== 'مسودّة'))) return;
    var c = x.nk || x.sign; if (c) o[String(c)] = 1;
  });
  return Object.keys(o);
}
function extBridgeCmd(mode){

  var tail = mode === 'go'
    ? "location.href=" + JSON.stringify(location.origin + location.pathname) + "+'#bridge='+encodeURIComponent(JSON.stringify(out));"
    : "const js=JSON.stringify(out);let cp=false;try{if(CP){CP(js);cp=true;}}catch(e){}"

      + "try{const jb=new Blob([js],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(jb);a.download='nusuk-bridge-'+out.at+'.json';document.body.appendChild(a);a.click();a.remove();}catch(e){}"
      + "alert('بياناتُ الجسر: '+out.rd.length+' قارئ · '+out.tn.length+' خيمة · '+out.ov.length+' إشغال — '+(cp?'نُسخت للصق، ':'')+'ونُزّل ملفُّ nusuk-bridge — ارفعه في التطبيق أو الصقه');";
  return [
    "(async()=>{const CP=(typeof copy==='function')?copy:null;try{",
    "const T=localStorage.getItem('mj.accessToken');if(!T){alert('سجّل الدخول في النظام أوّلًا');return;}",
    "const H={Authorization:'Bearer '+T},A='https://api.nusukcard.net/api/v1',W=", JSON.stringify(extBridgeCodes()), ";",
    "const j=async u=>{const r=await fetch(u,{headers:H});if(!r.ok)throw new Error(u.split('?')[0].split('/').slice(-2).join('/')+' '+r.status);return r.json();};",
    "const rs=await j('https://event.nusukcard.net/api/rfid/latest/stream');const rd=Array.isArray(rs)?rs:(rs.data||[]);",
    "let tn=[];for(let p=1;p<=80;p++){const x=await j(A+'/tents?page='+p+'&perPage=100');const d=Array.isArray(x.data)?x.data:[];tn=tn.concat(d);if(d.length<100)break;}",
    "const k=v=>String(v||'').replace(/\\s+/g,'').toLowerCase(),want=new Set(W.map(k)),pick=tn.filter(t=>want.has(k(t.code)));",
    "const ov=[];let i=0;const go=async()=>{while(i<pick.length){const t=pick[i++];try{const o=await j(A+'/dashboards/tents/'+t.id+'/overview'),d=o.data||o,c=d.occupancyStatus||{},a=d.averageTime||{};",
    "ov.push([t.id,c.totalCapacity||0,c.currentlyOccupied||0,c.withoutBracelet||0,c.fromOtherCamps||0,a.insideCamp||'',a.transitTime||'']);}catch(e){}}};",
    "await Promise.all([go(),go(),go(),go()]);",
    "const out={v:1,at:Date.now(),rd:rd.map(r=>[r.readerId,r.locationName,r.timestamp]),tn:tn.map(t=>[t.id,t.code,t.latitude,t.longitude,t.tentGroup||'',t.capacity||0]),ov:ov};",
    tail,
    "}catch(e){alert('تعذّر: '+e.message);}})()"
  ].join('');
}

function extBridgePaste(){
  if (!may('settings')){ toast(t('الجسرُ للمهندس فما فوق')); return; }
  var el = document.getElementById('brIn'), raw = el ? String(el.value || '').trim() : '';
  if (!raw){ toast(t('الصق ناتجَ الأمر أوّلًا')); return; }
  var o = null; try { o = JSON.parse(raw); } catch (e){ o = null; }
  if (!o || !extBridgeApply(o, true)){ toast(t('هذا ليس ناتجَ أمر الجسر — انسخه كاملًا وأعد اللصق')); return; }
  o.by = STATE.meta.name || '';
  toast(t('اعتُمد الجسر') + ' \u00b7 ' + nm(o.rd.length) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.tn.length) + ' ' + t('خيمة')); render(1);
}

function extBridgeCopy(){
  var cmd = extBridgeCmd(), done = function(){ toast(t('نُسخ أمرُ الجسر — الصقه في الـConsole على موقع النظام')); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(cmd).then(done, function(){ EXT._brShow = 1; render(1); }); return; }
  } catch (e){ LS_ERR = e; }
  EXT._brShow = 1; render(1);
}
function extBridgeCard(){
  if (!may('settings')) return '';
  var B = EXT.bridge, old = B && Date.now() - B.at > 6 * 3600000;
  var st = B ? alertBox(old ? 'warn' : 'success', t('آخر جسر') + ' ' + pilotAgo(B.at) + ' \u00b7 ' + B.rd + ' ' + t('قارئ') + ' \u00b7 ' + B.tn + ' ' + t('خيمة') + ' \u00b7 ' + B.ov + ' ' + t('إشغال') + (old ? ' \u2014 ' + t('قديم: جدّده') : ''))
             : alertBox('info', t('لا جسرَ بعد'));
  var n = nm(extBridgeCodes().length);
  return card('\u{1F309} ' + t('جسر نظام البطاقات'),
    st

    + '<div style="font-weight:700;margin:10px 0 4px">\u2460 ' + esc(t('بضغطة واحدة — من اللاب')) + '</div>'
    + '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'

    + '<li>' + esc(t('أظهر شريط الإشارات المرجعية في كروم: Ctrl + Shift + B')) + '</li>'
    + '<li>' + esc(t('اسحب هذا الزرَّ بالماوس وأفلته على الشريط (مرةً واحدة) — لا تضغطه هنا')) + ': <a class="btn btn-primary btn-sm" draggable="true" data-brbmk="1" href="' + esc(extBridgeBmk()) + '" title="' + esc(t('اسحبني إلى شريط الإشارات المرجعية')) + '">\u{1F309} ' + esc(t('جسر البطاقات')) + '</a></li>'
    + '<li>' + esc(t('افتح موقع النظام وسجّل الدخول، ثم اضغط الإشارة المرجعية')) + '</li>'
    + '<li>' + esc(t('يجمع القرّاءَ والخيامَ والإشغال ويفتح هذا التطبيق وقد اعتُمد كلُّه وحدَه')) + '</li></ol>'
    + '<p class="hint" style="margin:0 0 10px">' + esc(t('يجمع إشغالَ مخيماتنا المربوطة والمركَّبة')) + ' (' + n + ') \u2014 ' + esc(t('بعد ربط مخيماتٍ جديدة اسحب الزرَّ من جديد ليشملها')) + '</p>'

    + '<div style="font-weight:700;margin:6px 0 4px">\u2461 ' + esc(t('أو ملف تصدير من شاشات النظام')) + '</div>'
    + '<p class="hint" style="margin:0 0 6px">' + esc(t('إن كان في شاشة «أجهزة القراءة» أو «إدارة المخيمات» زرُّ تصدير، ارفع ملفه هنا — يُقرأ بعناوين أعمدته')) + '</p>'
    + '<label class="btn btn-secondary btn-sm" style="display:inline-flex">\u{1F4C4} ' + esc(t('ارفع ملف تصدير')) + '<input type="file" accept=".json,.xlsx,.xls,.csv" data-brfile="1" style="display:none"></label>'

    + mtDetails(t('أو بالأمر واللصق (احتياطًا)'),
        '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'
        + '<li>' + esc(t('اضغط «انسخ أمر الجسر» هنا')) + '</li>'
        + '<li>' + esc(t('هناك: F12 ← Console ← الصق ← Enter (وإن رفض كروم اللصق اكتب allow pasting)')) + '</li>'
        + '<li>' + esc(t('ينزل ملفُّ nusuk-bridge — ارفعه بزرِّ «ارفع ملف تصدير» أعلاه، أو الصق الناتجَ هنا واضغط «اعتمد»')) + '</li></ol>'
        + '<div class="actions" style="margin:0 0 8px">' + btn('\u{1F4CB} ' + t('انسخ أمر الجسر'), 'btn-secondary btn-sm', ' data-brcopy="1"') + '</div>'
        + (EXT._brShow ? '<textarea readonly dir="ltr" rows="3" style="width:100%;font-size:11px">' + esc(extBridgeCmd()) + '</textarea>' : '')
        + '<textarea id="brIn" dir="ltr" rows="3" style="width:100%;font-size:11px;margin-top:6px" placeholder="' + esc(t('الصق ناتجَ الأمر هنا')) + '"></textarea>'
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u2713 ' + t('اعتمد'), 'btn-secondary btn-sm', ' data-brok="1"') + '</div>', '\u2462'));
}

function extBridgeBmk(){ return 'javascript:' + encodeURIComponent(extBridgeCmd('go')); }
function extBridgeHashPick(){
  try {
    var h = String(location.hash || ''), i = h.indexOf('#bridge='); if (i < 0) return;
    var raw = decodeURIComponent(h.slice(i + 8));
    try { sessionStorage.setItem('nsk.bridgePending', raw); } catch (e0){ EXT._brPend = raw; }
    if (history && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  } catch (e){ LS_ERR = e; }
}

extBridgeHashPick();

function extReaderKey(ins){
  var S = (ins && ins.serials) || {}, out = '';
  Object.keys(S).forEach(function(k){ if (!out && (/^rdr/i.test(k) || /قارئ/.test(itemName(k)))) out = k; });
  return out;
}
function extSerAdopt(id, ser){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var ins = STATE.inss[id], k = extReaderKey(ins);
  if (!ins || !k){ toast(t('لا قارئَ في تركيب هذه النقطة — عدّله من نموذج التركيب')); return; }
  var old = ins.serials[k];
  if (!confirm(t('يُستبدَل سيريالُ القارئ في التركيب') + ': ' + old + ' \u2190 ' + ser + '. ' + t('متابعة؟'))){ toast(t('لم يُحفَظ — أُلغي')); return; }
  var r = Object.assign({}, ins); r.serials = Object.assign({}, ins.serials); r.serials[k] = String(ser);
  r.serHist = (ins.serHist || []).concat([{ at:Date.now(), by:STATE.meta.name || '', key:k, old:old, nw:String(ser), src:'نظام البطاقات' }]);
  STATE.inss[id] = r; CORE.set('inss', id, r); CORE.saveSoon();
  EXT_MATCH_STATE = null;
  logEvent('استبدالُ سيريال القارئ من نظام البطاقات — ' + id + ' · ' + old + ' ← ' + ser, id);
  toast(t('حُدِّث سيريالُ القارئ')); render(1);
}

function extStatusCard(){
  var R = extStatusRows(), B = EXT.bridge;
  if (!R) return card('حالة النقاط من نظام البطاقات', alertBox('info', t('لا جسرَ بعد — شغّل الجسر من البطاقة أعلاه فتظهر هنا حالةُ كلِّ نقطة')));
  var n = function(f){ return R.filter(f).length; };
  var F = EXT.stF || 'all', flt = { all:function(){ return true; }, on:function(r){ return r.sig === 'on'; }, off:function(r){ return r.sig === 'off'; },
    none:function(r){ return r.sig === 'none'; }, ov:function(r){ return r.ov; }, noov:function(r){ return !r.ov; }, chk:function(r){ return !!r.chk; } };
  var chips = [['all', 'الكل', R.length], ['on', '🟢 ترسل', n(flt.on)], ['off', '🔴 لا ترسل', n(flt.off)], ['none', '⚪ بلا قارئ ظاهر', n(flt.none)],
               ['ov', '📊 لها أرقام', n(flt.ov)], ['noov', 'بلا أرقام', n(flt.noov)], ['chk', '⚠ تحتاج مراجعة', n(flt.chk)]];
  var rows = R.filter(flt[F] || flt.all), N = EXT.stN || 30;
  var by = { name:'الاسم', sign:'الشاخص', serial:'السيريال', '1447':'قارئ ١٤٤٧' };
  var sigTxt = function(r){ return r.sig === 'on' ? '\u{1F7E2} ' + t('ترسل') : r.sig === 'off' ? '\u{1F534} ' + t('لا ترسل') + (r.ts ? ' \u00b7 ' + pilotAgo(r.ts) : '') : '\u26AA ' + t('بلا قارئ ظاهر'); };
  var chkTxt = function(r){ return r.chk === 'warn' ? '\u26A0 ' + t('القارئ على موقعٍ آخر') : r.chk === 'ser' ? '\u26A0 ' + t('سيريالٌ مختلف') : r.chk === 'miss' ? '\u26A0 ' + t('الاسم غير موجود') : '\u2713'; };

  var tb = '<div class="st-list">' + rows.slice(0, N).map(function(r){
      var dot = r.sig === 'on' ? '\u{1F7E2}' : r.sig === 'off' ? '\u{1F534}' : '\u26AA';
      var line2 = [t(by[r.by] || '\u2014'), r.ser ? String(r.ser) : '', r.sig === 'off' && r.ts ? pilotAgo(r.ts) : (r.sig === 'none' ? t('بلا قارئ ظاهر') : ''),
                   r.ov ? '\u{1F4CA} ' + (r.pct != null ? r.pct + '%' : '') + ' ' + r.tot + '/' + r.cap : t('بلا أرقام'), r.chk ? chkTxt(r) : ''].filter(Boolean).join(' \u00b7 ');
      return '<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.2))">'
        + '<span style="font-size:15px;flex:0 0 auto">' + dot + '</span>'
        + '<div style="flex:1;min-width:0"><div><b dir="ltr">' + esc(r.code || '\u2014') + '</b> <span class="hint" style="margin:0;font-size:12px"><bdi>' + esc(r.x.id) + '</bdi></span></div>'
        + '<div class="hint" style="margin:0;font-size:12px;overflow-wrap:anywhere">' + esc(line2) + '</div></div>'
        + btn('\u{1F441}', 'btn-quiet btn-sm', ' data-ovopen="' + esc(r.x.id) + '" title="' + esc(t('عرض النظرة العامة')) + '"') + '</div>';
    }).join('') + '</div>';
  return card('\u{1F4E1} ' + t('حالة النقاط من نظام البطاقات'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('«ترسل» = قرأ القارئُ في ربع الساعة قبل آخر جسر · «لها أرقام» = جاءت أرقامُ النظرة العامة في آخر جسر')) + (B ? ' \u00b7 ' + esc(t('آخر جسر')) + ' ' + esc(pilotAgo(B.at)) : '') + '</p>'
    + '<div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">' + chips.map(function(c){
        return '<button type="button" class="chip' + (F === c[0] ? ' on' : '') + '" data-stf="' + c[0] + '">' + esc(t(c[1])) + ' <b class="num">' + nm(c[2]) + '</b></button>'; }).join('') + '</div>'
    + (rows.length ? tb : alertBox('info', t('لا نقاطَ في هذا التصنيف')))
    + '<div class="actions" style="margin:8px 0 0">'
    + (rows.length > N ? btn(t('عرض المزيد') + ' (' + nm(rows.length - N) + ')', 'btn-quiet btn-sm', ' data-stmore="1"') : '')
    + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-stxls="1"') + '</div>');
}
function extStatusXls(){
  var R = extStatusRows(); if (!R || !R.length){ toast(t('لا جسرَ بعد')); return; }
  var by = { name:'الاسم', sign:'الشاخص', serial:'السيريال', '1447':'قارئ ١٤٤٧' };
  var rows = [[t('النقطة'), t('الاسم'), t('الربط'), t('الكود في النظام'), t('القارئ'), t('الإشارة'), t('آخر قراءة'), t('السعة'), t('الإشغال'), t('النسبة'), t('التحقق')]];
  R.forEach(function(r){
    rows.push([r.x.id, r.x.name || '', t(by[r.by] || ''), r.code, String(r.ser || ''), t(r.sig === 'on' ? 'ترسل' : r.sig === 'off' ? 'لا ترسل' : 'بلا قارئ ظاهر'),
      r.ts ? new Date(r.ts).toISOString().replace('T', ' ').slice(0, 16) : '', r.ov ? r.cap : '', r.ov ? r.tot : '', r.ov && r.pct != null ? r.pct + '%' : '',
      r.chk === 'warn' ? t('القارئ على موقعٍ آخر') : r.chk === 'ser' ? t('سيريالٌ مختلف') : r.chk === 'miss' ? t('الاسم غير موجود') : '\u2713']);
  });
  xlsSheets([[t('حالة النقاط'), rows]], 'nusuk-points-status.xlsx');
}

function extSetupBar(){
  var B = EXT.bridge, S = EXT.sec == null ? (B ? '' : 'br') : EXT.sec, orN = (STATE.ex47orph || []).length;
  var tabs = [['br', '\u{1F309} ' + t('الجسر')], ['ex', '\u{1F4C2} ' + t('بيانات ١٤٤٧')], ['or', '\u{1F4CD} ' + t('خارج الخريطة') + (orN ? ' (' + nm(orN) + ')' : '')], ['tk', '\u{1F511} ' + t('التوكن')]];
  var old = B && Date.now() - B.at > 6 * 3600000;
  var bar = card('\u2699 ' + t('الإعداد والبيانات'),
    (B ? alertBox(old ? 'warn' : 'success', t('آخر جسر') + ' ' + pilotAgo(B.at) + ' \u00b7 ' + B.rd + ' ' + t('قارئ') + ' \u00b7 ' + B.tn + ' ' + t('خيمة') + ' \u00b7 ' + B.ov + ' ' + t('إشغال') + (old ? ' \u2014 ' + t('قديم: جدّده') : ''))
       : alertBox('info', t('لا جسرَ بعد')))
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0">' + tabs.map(function(x){
        return '<button type="button" class="chip' + (S === x[0] ? ' on' : '') + '" data-sec="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>');
  var body = S === 'br' ? extBridgeCard() : S === 'ex' ? ex47Card() : S === 'or' ? ex47OrphCard() : S === 'tk' ? extTokCard() : '';
  if (S === 'or' && !body) body = card(t('خارج الخريطة'), '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ خارج الخريطة')) + '</p>');
  return bar + body;
}

function mtHero(pct, big, sub, color, label){
  return '<div style="display:flex;align-items:center;gap:16px;' + MT_TILE + ';margin:10px 0">' + svRing(pct, 100, color, label || (nm(pct) + '\u066A'))
    + '<div><div class="num" style="font-size:30px;font-weight:800;line-height:1.1">' + big + '</div><div class="hint" style="margin:2px 0 0;font-size:14px">' + sub + '</div></div></div>';
}
function mtSec(title, extra){ return '<div class="hint" style="margin:6px 0 6px;font-size:14px">' + esc(t(title)) + (extra || '') + '</div>'; }

function mtIcon(v, label, icon, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + MT_TILE + ';text-align:center;padding:10px 6px;cursor:pointer"><div style="font-size:24px">' + icon + '</div><div class="num" style="font-size:18px;font-weight:800;margin-top:2px">' + v + '</div><div style="font-size:12px">' + esc(t(label)) + ' \u203A</div></div>';
}

function mtDetails(title, html, icon){ return '<details class="mt-more" style="margin-top:14px"><summary>' + (icon ? icon + ' ' : '') + esc(t(title)) + '</summary>' + html + '</details>'; }
function mtAllBtn(kind){ return '<button type="button" class="btn btn-secondary" data-mtx="' + kind + '" style="display:block;width:100%;margin-top:14px">\u2B07 ' + esc(t('نزّل كل تفاصيل التبويب (إكسل)')) + '</button>'; }

function mtTabXlsx(kind){
  var stN = function(id){ var o = SV_ST.filter(function(z){ return z.k === svStOf(id); })[0]; return o ? t(o.n) : ''; };
  if (kind === 'week') return mtWeekXlsx(true);
  if (kind === 'inst') return mtXlsx('حالة التركيبات', ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'الحالة'], mtSites().map(function(x){ var tx = taxOf(x); return [x.id, x.name || '', t(tx.g), t((TAX_DEF[tx.t] || { l:tx.t }).l), x.co || '', stN(x.id)]; }));
  if (kind === 'obs') return mtXlsx('التحديات والمعوقات', ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'مين يعالجها', 'أهم تحدي', 'كل التحديات'], mtSites().filter(function(x){ return !!mtGrpOf(x.id); }).map(function(x){ var tx = taxOf(x), g = MT_GRP.filter(function(o){ return o.k === mtGrpOf(x.id); })[0], r = STATE.recs[x.id], pw = svPrimWhy(r), cc = r && svDone(r) ? chalCats(r) : [];
      return [x.id, x.name || '', t(tx.g), t((TAX_DEF[tx.t] || { l:tx.t }).l), x.co || '', g ? t(g.n) : '', pw > -1 ? t(SV_WHY[pw].n) : '', SV_WHY.filter(function(w){ return w.ks.some(function(k){ return cc.indexOf(k) > -1; }); }).map(function(w){ return t(w.n); }).join('، ')]; }));
  if (kind === 'daily'){ var from = Date.now() - 7 * 864e5, KN = { visit:'زيارة', ins:'تركيب', dis:'فك' };
    return mtXlsx('ملخص العمل اليومي', ['التاريخ', 'الوقت', 'النوع', 'النقطة', 'الاسم', 'الفني'], (STATE.steps || []).filter(function(x){ return +x.at >= from; }).sort(function(a, b){ return +b.at - +a.at; }).map(function(x){ var sid = mtStepSite(x), sx = siteFind(sid), d = new Date(+x.at); return [dayKey(+x.at), ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2), t(KN[x.kind] || x.kind || ''), sid, sx ? sx.name || '' : '', x.by || '']; })); }
  if (kind === 'cos') return mtXlsx('شركات الخدمة', ['الشركة', 'المخيمات', 'جاهزة', 'مُركّبة أو مجدولة', 'تحتاج تجهيز', 'تحتاج تنسيق', 'لسه', 'حالة الشركة'], mtCoStats().sort(function(a, b){ return (a.ready + a.ins) / a.n - (b.ready + b.ins) / b.n; }).map(function(o){ var b = MT_COB.filter(function(z){ return z.k === o.b; })[0]; return [o.co, o.n, o.ready, o.ins, o.prep, o.coord, o.todo, b ? t(b.n) : '']; }));
  return false;
}

function mtInst(){
  var S = mtSites(), N = S.length, stc = {};
  S.forEach(function(x){ var k = svStOf(x.id); stc[k] = (stc[k] || 0) + 1; });
  var ins = stc.ins || 0, pct = Math.round(ins / Math.max(1, N) * 100);
  var sts = SV_ST.filter(function(o){ return stc[o.k]; });
  var stTiles = sts.map(function(o){ return mtDot(stc[o.k], o.n, o.e, o.c, o.k === 'todo' ? mtOpen('rem') : mtOpen('sv', 'st:' + o.k)); });
  var bt = {}; S.forEach(function(x){ var ty = taxOf(x).t; var o = bt[ty] = bt[ty] || { n:0, i:0 }; o.n++; if (svStOf(x.id) === 'ins') o.i++; });
  var types = TAX_T.filter(function(ty){ return bt[ty]; }).map(function(ty){ var d = TAX_DEF[ty] || { l:ty, i:'\u25CF' }, o = bt[ty]; return mtIcon(nm(Math.round(o.i / o.n * 100)) + '\u066A', d.l, d.i, mtOpen('sv', 'type:' + ty)); });
  var bz = {}; S.forEach(function(x){ var z = taxOf(x).g; var o = bz[z] = bz[z] || { n:0, i:0 }; o.n++; if (svStOf(x.id) === 'ins') o.i++; });
  var zones = TAX_G.filter(function(z){ return bz[z]; }).map(function(z){ var o = bz[z], p = Math.round(o.i / o.n * 100);
    return '<div role="button" tabindex="0"' + mtOpen('sv', '', z) + ' style="' + MT_TILE + ';text-align:center;cursor:pointer"><div style="display:flex;justify-content:center;margin-bottom:6px">' + svRing(p, 54, '#3AD6A0', nm(p) + '\u066A') + '</div><div style="font-size:13px">' + esc(t(z)) + ' \u203A</div><div class="hint num" style="margin:0;font-size:12px">' + nm(o.i) + ' / ' + nm(o.n) + '</div></div>'; });
  return mtHero(pct, nm(ins) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(N) + '</span>', esc(t('نقطة اتركّبت')), '#3AD6A0')
    + mtSec('حالها الآن') + mtGrid(stTiles) + mtSec('حسب النوع') + mtGrid(types, 96) + mtSec('المشاعر') + mtGrid(zones, 96)
    + mtAllBtn('inst') + mtDetails('التفاصيل الكاملة', mfuInst());
}

MT_GRP.forEach(function(g){ var G = CC_GROUPS.filter(function(x){ return x.g === g.k; })[0]; g.n = G ? G.n : g.k; });

function obsLocCats(){

  return [['bridge', '\u{1F309}', 'تحت كوبري'], ['tin', '\u{1F687}', 'مدخل نفق'], ['tout', '\u{1F687}', 'مخرج نفق'], ['tgen', '\u{1F687}', 'نفق — غير محدد'],
          ['sign', '\u{1FAA7}', 'لوحة استرشادية'], ['nomount', '\u{1F3D7}', 'بدون إطار معدني للتثبيت'], ['canopy', '\u26F1', 'على مظلة']];
}
function obsLocGroups(){ return [['p', 'ممر', 'ممرات'], ['j', 'جسر', 'الجمرات'], ['c', 'كاميرا', 'كاميرات الوزارة'], ['s', 'محطة', 'المحطات'], ['g', 'بوابة', 'البوابات'], ['o', '*', 'نقاط أخرى']]; }
function obsLocKey(k, g){ return 'loc_' + k + '_' + g; }
function obsLocGrp(x){ var G = obsLocGroups(); for (var i = 0; i < G.length; i++) if (G[i][1] === x.type) return G[i][0]; return 'o'; }
function obsLocLists(){
  obsLocCats().forEach(function(c){
    obsLocGroups().forEach(function(g){
      var key = obsLocKey(c[0], g[0]); if (MFU.lists[key]) return;
      MFU.lists[key] = { title:c[1] + ' ' + c[2] + ' — ' + g[2],
        head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'المصدر', 'موقع النقطة', 'وصف التحدي', 'الملاحظة'],
        rows:function(){
          return mtSites().filter(function(x){ return g[1] === '*' ? obsLocGrp(x) === 'o' : x.type === g[1]; }).map(function(x){ var tg = obsLocTags(x); return tg && tg[c[0]] ? [x, tg[c[0]]] : null; }).filter(Boolean)
            .map(function(p){ var x = p[0], r = STATE.recs[x.id] || {};
              return [x.id, x.name || '', taxOf(x).g, x.type, x.co || '', t(p[1]), locList(r.loc).map(function(v){ return t(v); }).join(' \u00b7 '), String(r.chal_note || ''), String(r.note || '')]; });
        } };
    });
  });
}
function mtObsLoc(){
  obsLocLists();
  var Z = {}, any = 0;
  mtSites().forEach(function(x){
    var tg = obsLocTags(x); if (!tg) return;
    var z = taxOf(x).g, gg = obsLocGrp(x);
    Object.keys(tg).forEach(function(k){ var o = Z[z] = Z[z] || {}; var c0 = o[k] = o[k] || {}; c0[gg] = (c0[gg] || 0) + 1; any++; });
  });
  if (!any) return '';
  var groups = obsLocGroups();
  var blocks = TAX_G.filter(function(z){ return Z[z]; }).map(function(z){
    var o = Z[z];
    var cells = obsLocCats().filter(function(c){ return c[0] !== 'tgen' || o.tgen; }).map(function(c){
      var v = o[c[0]] || {}, chips = groups.filter(function(g){ return v[g[0]]; }).map(function(g){
        return '<button type="button" class="chip"' + mtOpen(obsLocKey(c[0], g[0]), '', z) + ' style="margin:2px">' + esc(t(g[2])) + ' <b class="num">' + nm(v[g[0]]) + '</b></button>'; }).join('');
      return '<div style="border:1px solid var(--line);border-radius:12px;padding:8px 10px"><div style="font-size:13px;margin:0 0 4px">' + c[1] + ' ' + esc(t(c[2])) + '</div>'
        + (chips || '<span class="hint" style="margin:2px 6px;font-size:12px">\u2014</span>') + '</div>';
    }).join('');
    return '<div style="' + MT_TILE + ';margin:0 0 10px"><div style="font-weight:700;margin:0 0 8px">\u{1F4CD} ' + esc(t(z)) + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">' + cells + '</div></div>';
  }).join('');
  return mtSec('حسب الموقع — في كل منطقة') + blocks
    + '<p class="hint" style="margin:-4px 0 12px;font-size:12px">' + esc(t('لكل النقاط عدا المخيمات ومراكز التفويج — من «موقع النقطة» في المسح (اختيار متعدد)، وللزيارات الأقدم بلا اختيار من كلمات وصف التحدي والملاحظة · كلُّها تحدٍّ عدا «على مظلة» (واللوحة التي عليها مظلة) · اضغط الرقم لقائمته وإكسلها')) + '</p>';
}
function mtObs(){
  var S = mtSites(), vis = 0, gc = {}, wc = {}, zc = {}, chal = 0;
  S.forEach(function(x){ var r = STATE.recs[x.id]; if (r && svVisited(r)) vis++; var g = mtGrpOf(x.id); if (!g) return; gc[g] = (gc[g] || 0) + 1;
    if (g !== 'access'){ chal++; var pw = svPrimWhy(r); if (pw > -1) wc[pw] = (wc[pw] || 0) + 1; var z = taxOf(x).g; zc[z] = (zc[z] || 0) + 1; } });
  var pct = Math.round(chal / Math.max(1, vis) * 100);
  var grp = MT_GRP.filter(function(g){ return gc[g.k]; }).map(function(g){ return mtDot(gc[g.k], g.n, g.e, g.c, mtOpen('sv', 'grp:' + g.k)); });
  var why = Object.keys(wc).map(Number).sort(function(a, b){ return wc[b] - wc[a]; }).map(function(wi){ var w = SV_WHY[wi]; return mtIcon(nm(wc[wi]), w.n, w.e, mtOpen('sv', 'why:' + wi)); });
  var zones = TAX_G.filter(function(z){ return zc[z]; }).map(function(z){ return mtIcon(nm(zc[z]), z, '\u{1F4CD}', mtOpen('sv', 'grp:all', z)); });
  return mtHero(pct, nm(chal), esc(t('نقطة عليها تحدي')) + '<br>' + esc(t('من')) + ' ' + nm(vis) + ' ' + esc(t('اتزارت')), '#F59E0B')
    + mtObsLoc()
    + mtSec('مين يعالجها؟') + mtGrid(grp) + mtSec('التحدي', ' <span class="num">(' + nm(chal) + ')</span>') + mtGrid(why, 96)
    + '<p class="hint" style="margin:-6px 0 12px;font-size:12px">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها')) + '</p>'
    + mtSec('المشاعر') + mtGrid(zones, 96) + mtAllBtn('obs') + mtDetails('التفاصيل الكاملة وجهات المعالجة', mfuObs());
}

function mtDaily(){
  var now = Date.now(), today = dayKey(now), steps = STATE.steps || [], kinds = {}, people = {}, days = [];
  for (var i = 6; i >= 0; i--) days.push({ d:dayKey(now - i * 864e5), n:0 });
  steps.forEach(function(x){ var d = dayKey(+x.at || 0); if (d === today){ kinds[x.kind] = (kinds[x.kind] || 0) + 1; if (x.by) people[x.by] = 1; } days.forEach(function(o){ if (o.d === d) o.n++; }); });
  var tot = Object.keys(kinds).reduce(function(a, k){ return a + kinds[k]; }, 0), tech = Object.keys(people).length;
  var KN = [ ['visit', 'زيارة', '\u{1F6B6}'], ['ins', 'تركيب', '\u{1F527}'], ['dis', 'فك', '\u{1F9E9}'] ];
  var kt = KN.map(function(k){ return mtIcon(nm(kinds[k[0]] || 0), k[1], k[2], mtOpen('sv', 'day:' + today + ':' + k[0])); });
  var mx = Math.max.apply(null, days.map(function(o){ return o.n; }).concat([1]));
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var bars = '<div style="display:flex;align-items:flex-end;gap:6px;height:110px;' + MT_TILE + ';padding:10px 8px 26px;margin-bottom:12px">' + days.map(function(o){ var wd = WD[new Date(o.d + 'T12:00:00').getDay()];
      return '<div role="button" tabindex="0"' + mtOpen('sv', 'day:' + o.d) + ' title="' + esc(t(wd)) + ' \u00b7 ' + nm(o.n) + '" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;cursor:pointer"><span class="num" style="font-size:11px">' + (o.n ? nm(o.n) : '') + '</span><i style="display:block;width:100%;height:' + Math.max(3, Math.round(o.n / mx * 70)) + 'px;background:var(--acc,#2E86DE);border-radius:4px 4px 0 0"></i><span style="font-size:10px;margin-top:4px;white-space:nowrap" class="hint">' + esc(t(wd)) + '</span></div>'; }).join('') + '</div>';
  return mtHero(tot ? 100 : 0, nm(tot), esc(t('خطوة اتعملت النهارده')) + (tech ? '<br>' + esc(t('من')) + ' ' + nm(tech) + ' ' + esc(t('فنيين')) : ''), 'var(--acc,#2E86DE)', esc(t('اليوم')))
    + mtGrid(kt, 96) + mtSec('آخر ٧ أيام — اضغط أي يوم') + bars + mtAllBtn('daily') + mtDetails('تفاصيل ساعة بساعة والشهور', mfuDaily());
}

var MT_CO_ALL = false;

function mtCos(){
  var C = mtCoStats(), bc = {}; C.forEach(function(o){ bc[o.b] = (bc[o.b] || 0) + 1; });
  var pct = Math.round((bc.ready || 0) / Math.max(1, C.length) * 100);
  var tiles = MT_COB.filter(function(b){ return bc[b.k]; }).map(function(b){ return mtDot(bc[b.k], b.n, b.e, b.c, mtOpen('sv', 'cob:' + b.k)); });
  var rows = C.slice().sort(function(a, b){ return (a.ready + a.ins) / a.n - (b.ready + b.ins) / b.n || b.n - a.n; });
  var shown = MT_CO_ALL ? rows : rows.slice(0, 8);
  var cards = shown.map(function(o){ var ok = o.ready + o.ins, p = Math.round(ok / o.n * 100), col = p >= 100 ? '#22C55E' : p >= 50 ? '#F59E0B' : '#EF4444', need = o.prep + o.coord;
    return '<div role="button" tabindex="0"' + mtOpen('sv', 'co:' + o.co) + ' style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:6px"><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span>' + esc(o.co) + '</span> \u203A</div><div class="hint" style="margin:2px 0 4px;font-size:12px">' + nm(ok) + ' ' + esc(t('من')) + ' ' + nm(o.n) + ' ' + esc(t('مخيم جاهزة')) + '</div><div style="height:7px;background:var(--line);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:' + p + '%;background:' + col + '"></i></div></div>'
      + (need ? '<span class="pill">' + nm(need) + ' ' + esc(t('تجهيز')) + '</span>' : '<span class="pill ok">\u2705</span>') + '</div>'; }).join('');
  return mtHero(pct, nm(bc.ready || 0) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(C.length) + '</span>', esc(t('شركة مخيماتها جاهزة')), '#22C55E')
    + mtGrid(tiles) + mtSec('الشركات — الأقل جاهزية أولًا') + cards
    + (rows.length > 8 ? '<div class="actions" style="justify-content:center">' + btn(MT_CO_ALL ? t('اعرض الأقل جاهزية فقط') : (t('اعرض الكل') + ' (' + nm(rows.length) + ')'), 'btn-secondary btn-sm', ' data-mtcoall="1"') + '</div>' : '')
    + mtAllBtn('cos') + mtDetails('التفاصيل الكاملة', mfuCos());
}

function mtWeek(){
  var R = wtRows(), N = R.length, sc = {}, wc = {}; R.forEach(function(r){ var s = mtWSt(r), w = mtWWho(r); sc[s] = (sc[s] || 0) + 1; wc[w] = (wc[w] || 0) + 1; });
  var pct = Math.round((sc.done || 0) / Math.max(1, N) * 100);
  var st = MT_WST.filter(function(o){ return sc[o.k]; }).map(function(o){ return mtDot(sc[o.k], o.n, o.e, o.c, ' data-mtwf="st:' + o.k + '"'); });
  var who = MT_WWHO.filter(function(o){ return wc[o.k]; }).map(function(o){ return mtIcon(nm(wc[o.k]), o.n, o.e, ' data-mtwf="who:' + o.k + '"'); });
  var COL = { done:'#22C55E', late:'#EF4444', run:'#2E86DE', wait:'#475569' };
  var card = function(r){ var s0 = mtWSt(r);
    return '<div style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:' + COL[s0] + ';flex:0 0 auto"></span><div style="flex:1;min-width:0"><div style="font-size:14px">' + esc(r.n || '\u2014') + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(r.who || '\u2014') + (r.due ? ' \u00b7 ' + esc(r.due) : '') + '</div></div><span class="pill">' + esc(t((MT_WST.filter(function(o){ return o.k === s0; })[0] || {}).n || '')) + '</span></div>'; };
  var pop = mtWPopHtml(card);
  var list = N ? R.slice(0, 40).map(card).join('') : '<p class="hint">' + esc(t('لا مهامَّ أسبوعيةٌ بعد — تُضاف من «تحديث المهام» تحت.')) + '</p>';
  return pop + mtHero(pct, nm(sc.done || 0) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(N) + '</span>', esc(t('مهمة خلصت')), '#22C55E')
    + mtGrid(st) + mtSec('على مين؟') + mtGrid(who, 96)
    + mtSec('كل المهام', ' <span class="num">(' + nm(N) + ')</span>') + list + (N ? mtAllBtn('week') : '');
}

function mtWeekXlsx(all){
  var F = all ? wtRows() : mtWRows(); if (!F.length){ toast(t('لا بيانات بعد')); return false; }
  return xlsxLoad().then(function(ok){ if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var rows = [[t('المهمة'), t('على مين'), t('موعدها'), t('الحالة'), t('المسار')]].concat(F.map(function(r){ return [r.n || '', r.who || '', r.due || '', t((MT_WST.filter(function(o){ return o.k === mtWSt(r); })[0] || {}).n || ''), r.track || '']; }));
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch:50 }, { wch:20 }, { wch:12 }, { wch:14 }, { wch:16 }]; wb.Workbook = { Views:[{ RTL:true }] };
    XLSX.utils.book_append_sheet(wb, ws, t('المهام')); XLSX.writeFile(wb, t('المهام الأسبوعية') + ' — ' + dayKey() + '.xlsx'); logEvent('تصدير المهام الأسبوعية — ' + F.length); toast(t('نزل الملف')); return true; });
}

var HALL_URL = (typeof location !== 'undefined') && /[?&#]hall(=1)?\b/.test(String(location.search) + String(location.hash));
var HALL = { on:false, t:null, pull:null, at:0, idle:null };
function hallLink(){ return location.origin + location.pathname + '?hall=1'; }
function hallCopy(){ var u = hallLink();
  if (navigator.share){ navigator.share({ title:t('عرض القاعة'), url:u }).catch(function(){}); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(function(){ toast(t('نُسخ رابط القاعة — افتحه على جهاز القاعة بعد الدخول بحسابه')); }, function(){ toast(u); }); else toast(u); }
function hallClock(){ var el = document.getElementById('hallClock'); if (!document.body.classList.contains('kiosk')){ if (el) el.remove(); return; }
  if (!el){ el = document.createElement('div'); el.id = 'hallClock'; el.style.cssText = 'position:fixed;top:10px;inset-inline-start:12px;z-index:3000;background:rgba(0,0,0,.55);color:#fff;border-radius:12px;padding:6px 12px;font-size:15px;pointer-events:none'; document.body.appendChild(el); }
  var d = new Date(), hh = function(x){ return ('0' + x).slice(-2); }, last = (STATE.meta && STATE.meta.lastSync) || HALL.at;
  el.innerHTML = '<b class="num">' + nm(hh(d.getHours())) + ':' + nm(hh(d.getMinutes())) + '</b>' + (last ? ' \u00b7 <span style="opacity:.8">' + esc(t('آخر تحديث')) + ' <span class="num">' + nm(hh(new Date(last).getHours())) + ':' + nm(hh(new Date(last).getMinutes())) + '</span></span>' : ''); }
function hallBoot(){
  if (!HALL_URL || HALL.on) return; if (!document.getElementById('nav') || typeof ROLE === 'undefined' || !ROLE) return;
  HALL.on = true; try { goPage('mfu'); PTAB.mfu = 'mfu'; } catch (e){ LS_ERR = e; }
  setTimeout(function(){ if (typeof KIOSK_ON !== 'undefined' && !KIOSK_ON) kioskToggle(); if (typeof wakeAcquire === 'function') wakeAcquire(); hallClock(); }, 400);
  HALL.t = setInterval(hallClock, 30000);
  HALL.pull = setInterval(function(){ if (typeof pullDelta === 'function') pullDelta().then(function(){ HALL.at = Date.now(); if (typeof render === 'function') render(1); hallClock(); }).catch(function(){}); }, 300000);
  var fsOnce = function(){ try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){}); } catch (e){ LS_ERR = e; } document.removeEventListener('click', fsOnce, true); };
  document.addEventListener('click', fsOnce, true);
  var idle = function(){ document.body.classList.remove('hall-idle'); clearTimeout(HALL.idle); HALL.idle = setTimeout(function(){ if (document.body.classList.contains('kiosk')) document.body.classList.add('hall-idle'); }, 3000); };
  ['mousemove', 'touchstart', 'keydown'].forEach(function(ev){ document.addEventListener(ev, idle, { passive:true }); }); idle();
  toast(t('عرض القاعة — المس الشاشة مرةً لملئها'));
}
if (typeof setInterval === 'function' && HALL_URL) var HALL_BOOT_T = setInterval(function(){ hallBoot(); if (HALL.on) clearInterval(HALL_BOOT_T); }, 1000);

MFU.lists = {
  pilot: { title:'التجارب والديمو — النقاط وحالتها', head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'التجربة', 'التركيب', 'التجهيزة', 'الاتصال', 'آخر إشارة', 'قارئ البطاقات', 'التحقق', 'موقعه في نظام البطاقات', 'آخر قراءة للقارئ', 'الإشغال'],
           rows:function(){ return pilotRowsList(); } },
  cos:   { title:'شركات الخدمة', head:['الشركة', 'المخيمات', 'تمت الزيارة', 'نسبة الزيارة', 'مُركّب', 'معوّقات', 'فيها تحديات'],
           rows:function(){ return mfuCompanies().map(function(c){ return [c.co, c.n, c.sv, c.svp + '٪', c.ins, c.obs, c.chal]; }); } },
  chalo: { title:'تحدياتٌ مفتوحة', head:['التحدي', 'آلية المعالجة', 'من سيحلّه', 'الحالة'],
           rows:function(){ return mfuAllChal().filter(function(c){ return !mfuChalClosed(c); }).map(function(c){ return [String(c.t || ''), String(c.m || ''), String(c.owner || ''), String(c.st || '')]; }); } },
  req:   { title:'طلباتٌ قيد المتابعة', head:['الطلب', 'الحالة', 'الإفادة'],
           rows:function(){ return mfuList('req').filter(function(x){ return mfuReqView(x).st !== 'منجز'; }).map(function(x){ var v = mfuReqView(x); return [String(x.t || ''), String(v.st || ''), String(v.u || '')]; }); } },
  wdone: { title:'أُنجز هذا الأسبوع', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().done.map(mfuWtRow); } },
  wnext: { title:'مستحقٌّ خلال ٧ أيام', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().next.map(mfuWtRow); } },
  wlate: { title:'متأخرة', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().late.map(mfuWtRow); } },
  wwait: { title:'متوقفة أو بانتظار قرار', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().wait.map(mfuWtRow); } }
};
function mfuWtRow(r){ return [String(r.n || ''), String(dispName(r.who || '')), String(r.st || ''), String(r.due || '')]; }

var SV_ZONE_COLORS = { 'منى':'#2E86DE', 'عرفات':'#27AE60', 'المزدلفة':'#8E44AD', 'مزدلفة':'#8E44AD', 'كاميرات المتابعة':'#E67E22', 'مراكز التفويج':'#C0392B', 'الجمرات':'#D4AC0D' };
function svZoneColor(z){ return SV_ZONE_COLORS[z] || '#E74C3C'; }

function svMiniMap(rows){
  var all = (STATE.sites || []).filter(function(x){ return x.lat && x.lng; }); if (all.length < 10) return '';
  var ids = {}; rows.forEach(function(r){ ids[r[0]] = 1; });
  var la0 = Infinity, la1 = -Infinity, lg0 = Infinity, lg1 = -Infinity;
  all.forEach(function(x){ if (x.lat < la0) la0 = x.lat; if (x.lat > la1) la1 = x.lat; if (x.lng < lg0) lg0 = x.lng; if (x.lng > lg1) lg1 = x.lng; });
  if (la1 - la0 < 1e-6 || lg1 - lg0 < 1e-6) return '';
  var W = 560, H = 300, X = function(x){ return (10 + (x.lng - lg0) / (lg1 - lg0) * (W - 20)).toFixed(1); }, Y = function(x){ return (10 + (la1 - x.lat) / (la1 - la0) * (H - 20)).toFixed(1); };

  var bgK = all.length + ':' + la0 + ':' + lg1; if (svMiniMap.bgK !== bgK){ var bgP = ''; all.forEach(function(x){ bgP += 'M' + X(x) + ' ' + Y(x) + 'h.01'; }); svMiniMap.bg = bgP; svMiniMap.bgK = bgK; }
  var fgZ = {}, zs = {}; all.forEach(function(x){ if (ids[x.id]){ zs[x.zone] = 1; fgZ[x.zone] = (fgZ[x.zone] || '') + 'M' + X(x) + ' ' + Y(x) + 'h.01'; } });
  var fg = Object.keys(fgZ).map(function(z){ return '<path d="' + fgZ[z] + '" stroke="' + svZoneColor(z) + '" stroke-width="6" stroke-linecap="round" fill="none" opacity=".9"/>'; }).join('');
  return '<div class="card" style="margin:0"><div class="pid">' + esc(t('أين هي على الخريطة')) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;border-radius:10px;background:var(--surface-2);color:var(--ink)"><path d="' + svMiniMap.bg + '" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" opacity=".18"/>' + fg + '</svg>'
    + '<div class="hint" style="margin:6px 0 0;display:flex;gap:10px;flex-wrap:wrap">' + Object.keys(zs).map(function(z){ return '<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + svZoneColor(z) + '"></i> ' + esc(t(z)) + '</span>'; }).join('') + '<span>\u25CF ' + esc(t('الباهت: باقي النقاط')) + '</span></div></div>';
}

var SV_ST = [
  { k:'ins', c:'#3AD6A0', e:'\u{1F527}', n:'مُركّبة' },
  { k:'sched', c:'#7C5CFF', e:'\u{1F4C5}', n:'مجدولة للتركيب' },
  { k:'ready', c:'#22C55E', e:'\u2705', n:'جاهزة للتركيب' },
  { k:'prep', c:'#F59E0B', e:'\u{1F6E0}', n:'تحتاج تجهيز' },
  { k:'coord', c:'#EF4444', e:'\u26A0\uFE0F', n:'تحتاج تنسيق' },
  { k:'again', c:'#8D6E63', e:'\u{1F501}', n:'تحتاج زيارة أخرى' },
  { k:'todo', c:'#9FB0AA', e:'\u23F3', n:'لم تُزر' }
];

function svPopRefresh(){
  SV_SHOW = 80; var host = document.getElementById('content'); if (!host){ render(1); return; }
  svPopRemove(); var tmp = document.createElement('div'); tmp.innerHTML = svListPop() + supPopHtml(); while (tmp.firstChild) host.appendChild(tmp.firstChild);
  var pp = document.querySelector('.svpop'); if (pp) pp.scrollTop = 0;
}

function svListXlsx(key){
  var L = SV_LISTS[key] || svDynList(key) || (MFU.lists[key] ? [MFU.lists[key].title] : null) || (svObKey(key) || /^al_/.test(key) ? [svListTitle(key)] : null); if (!L) return false;
  toast(t('يُجهَّز ملفُّ إكسل…'));
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var body = svListRows(key); if (key === SV_POP && (SV_ZF || SV_SUB) && document.querySelector('.svpop')) body = svPopFilter(body, svListHead(key));
    var pts = body.length && siteFind(body[0][0]);
    var rows = [(pts ? [t('رقم الشاخص / الاسم')] : []).concat(svListHead(key).map(function(h){ return t(h); }))].concat(body.map(function(r){ var sx = pts && siteFind(r[0]); return pts ? [sx ? siteKey(sx) : r[0]].concat(r) : r; })), iss = [];
    rows.forEach(function(r, i){ r.forEach(function(c){ var b = expBadText(c); if (b) iss.push(t('الصفّ') + ' ' + (i + 1) + ': ' + b); }); });
    if (!expGate('إكسل', iss)) return false;
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map(function(_, i){ var wd = 10; rows.forEach(function(r){ wd = Math.max(wd, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:wd }; });
    wb.Workbook = { Views:[{ RTL:true }] }; XLSX.utils.book_append_sheet(wb, ws, t(L[0]).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30));
    XLSX.writeFile(wb, t(L[0]).replace(/[\\\/:*?"<>|]/g, ' ') + ' — ' + dayKey() + '.xlsx');
    logEvent('تصدير قائمة — ' + L[0] + ' · ' + (rows.length - 1), ''); toast(t('نزل الملف')); return true;
  });
}
function mfuFilterRowAll(){
  var Z = {}, T = {}, all = STATE.sites || [];
  all.forEach(function(x){ var tx = taxOf(x), z = tx.g || '—'; Z[z] = (Z[z] || 0) + 1; if (!MFU.flt.z || z === MFU.flt.z){ var ty = tx.t || '—'; T[ty] = (T[ty] || 0) + 1; } });
  var chip = function(attr, v, on, label, n){ return '<button type="button" class="cat' + (on ? ' on' : '') + '" ' + attr + '="' + esc(v) + '">' + esc(label) + (n != null ? ' <span class="n">' + nm(n) + '</span>' : '') + '</button>'; };
  return '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('المشعر')) + '</span>' + chip('data-mfz', '', !MFU.flt.z, t('الكل'), all.length)
    + Object.keys(Z).sort(function(a, b){ return Z[b] - Z[a]; }).map(function(z){ return chip('data-mfz', z, MFU.flt.z === z, t(z), Z[z]); }).join('') + '</div>'
    + '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('النوع')) + '</span>' + chip('data-mft', '', !MFU.flt.t, t('الكل'), null)
    + Object.keys(T).sort(function(a, b){ return T[b] - T[a]; }).map(function(ty){ return chip('data-mft', ty, MFU.flt.t === ty, t(ty), T[ty]); }).join('') + '</div>';
}
function mfuSurv(){
  var all = STATE.sites;
  if (MFU.flt.z || MFU.flt.t) STATE.sites = all.filter(function(x){ var tx = taxOf(x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); });
  try { return mfuFilterRowAll() + mfuSurv0(); } finally { STATE.sites = all; }
}
function mfuSurv0(){
  var SV = svStats(), o = SV.O, JM = jmrConfirm(), jt = JM.tot;
  var kpi = function(l, v, col, key){ return '<div class="mfu-kpi"' + (key ? ' data-svlist="' + key + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"' : '') + '><div class="mfu-kpi-l">' + esc(t(l)) + (key ? ' \u203A' : '') + '</div><div class="mfu-kpi-v"' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</div></div>'; };
  var tb = function(head, rows){ return table(head, rows.map(function(r){ return r.map(function(c){ return esc(String(c == null ? '' : c)); }); })); };
  var nCampOk = svListRows('campok').length, nNoPh = svListRows('nophoto').length;
  return '<div class="mfu-kpis">' + kpi('نسبة الزيارة', nm(SV.pct) + '\u066A') + kpi('تمت الزيارة', nm(o.sv), '#27AE60', 'sv') + kpi('المتبقي', nm(o.tot - o.sv), '#B7950B', 'rem') + kpi('فيها تحديات', nm(o.chal), '#C0392B', 'chal') + kpi('تحتاج زيارة أخرى', nm(o.unreach), '#C0392B', 'unreach') + '</div>'
    + '<div class="mfu-kpis">' + kpi('مخيمات بلا تحديات', nm(nCampOk), '#1E8449', 'campok') + kpi('زيارات بلا صور', nm(nNoPh), nNoPh ? '#C0392B' : '#1E8449', 'nophoto') + (function(){ var nb = svListRows('badphoto').length; return kpi('صور تحتاج إعادة', nm(nb), nb ? '#C0392B' : '#1E8449', 'badphoto'); })() + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('اضغط أيَّ بطاقةٍ عليها «›» لقائمة نقاطها بالمشعر والنوع وتصديرها إكسل.')) + '</p>'
    + (svListPop() + supPopHtml())
    + card(t('حسب المشعر'), tb(['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'تحديات · تعذّر'], SV.zones.map(function(r){ return [t(r[0]), r[1], r[2], r[3], r[4], r[5] + ' \u00b7 ' + r[6]]; })))
    + card(t('المشعر والنوع'), tb(['المشعر · النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'التحديات وأبرزها'], SV.detail.map(function(r){ return [t(r[0]) + ' \u00b7 ' + t(r[1]), r[2], r[3], r[4], r[5], r[6] ? r[6] + ' \u00b7 ' + r[7] : '0']; })))
    + card(t('منشأة الجمرات — تأكيد النقاط بالمسح') + ' \u2014 ' + nm(jt.ok) + ' / ' + nm(jt.n), '<p class="hint" style="margin:0 0 8px">' + esc(t('النقطةُ مؤكَّدةٌ إذا تمت زيارتُها. ما لم يُزر يحتاج زيارة، وبعضُ ما زير تحتاج زيارةً أخرى تقنيًا.')) + '</p>' + tb(['الدور', 'النقاط', 'مؤكَّدة (بتحديات)', 'لم تُزر', 'تحتاج زيارة أخرى', 'نسبة التأكيد'], JM.rows.map(function(r){ return [t(r[0]), r[1], r[2] + ' (' + r[5] + ')', r[4], r[3], r[6]]; })));
}
function mfuCos(){
  var C = mfuCompanies(), n = 0, ins = 0, obs = 0, sv = 0, ch = 0; C.forEach(function(c){ n += c.n; ins += c.ins; obs += c.obs; sv += c.sv; ch += c.chal; });
  var surv = !ins;
  var tp = n ? Math.round((surv ? sv : ins) / n * 100) : 0;
  var kpi = function(l, v, col){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t(l)) + '</div><div class="mfu-kpi-v"' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</div></div>'; };
  return '<div class="mfu-kpis">'
    + (surv
      ? kpi('نسبة مسح المخيمات', nm(tp) + '\u066A') + kpi('تم مسحها', nm(sv), '#27AE60') + kpi('المتبقي للمسح', nm(n - sv), '#B7950B') + kpi('فيها تحديات', nm(ch), '#C0392B') + kpi('المخيمات', nm(n))
      : kpi('نسبة الإنجاز الكلية', nm(tp) + '\u066A') + kpi('التركيب', nm(ins), '#27AE60') + kpi('عوائق', nm(obs), '#C0392B') + kpi('المتبقي', nm(n - ins - obs), '#B7950B') + kpi('المخيمات', nm(n)))
    + '</div>'
    + (surv ? alertBox('info', t('المرحلة الحالية: المسح الميداني — التواصلُ مع الشركات والتركيبُ لم يبدآ بعد، فلا تصنيفَ لها بالتركيب. تُرتَّب بالأقلِّ مسحًا.')) : '')
    + '<p class="hint">' + esc(t(surv ? 'نسبةُ كلِّ شركة = مخيماتُها التي تمت زيارتُها ÷ مخيماتُها' : 'دليل نسبة الإنجاز: ممتاز ٧٥٪ فأكثر · متوسط ٤٠–٧٤٪ · ضعيف أقل من ٤٠٪')) + ' \u00b7 ' + esc(t(MFU.cosAll ? 'كلُّ الشركات' : 'الأضعفُ أوّلًا')) + ' '
    + btn(MFU.cosAll ? t('الأضعفُ فقط') : t('اعرض الكل') + ' (' + nm(C.length) + ')', 'btn-quiet btn-sm', ' data-mfucosall="1"') + '</p>'
    + '<div class="mfu-cos">' + (MFU.cosAll ? C : C.slice().sort(function(a, b){ return (surv ? a.svp - b.svp : a.pct - b.pct) || b.n - a.n; }).slice(0, 12)).map(function(c){
        var p = surv ? c.svp : c.pct, L = surv ? [p >= 75 ? 'مسحٌ متقدّم' : p > 0 ? 'مسحٌ جارٍ' : 'لم يبدأ المسح', p >= 75 ? 'ok' : p > 0 ? 'wrn' : 'off'] : mfuLevel(c.pct);
        return '<div class="mfu-co mfu-' + L[1] + '"><div class="mfu-co-h"><b>' + esc(c.co) + '</b>' + pill(t(L[0]), L[1]) + '</div>'
          + (coLiaisonOf(c.co) ? '<div class="hint" style="margin:2px 0 4px">' + esc(t('ضابط الاتصال')) + ': <b>' + esc(coLiaisonOf(c.co)) + '</b></div>' : '')
          + mfuBar(p) + '<div class="mfu-co-n">'
          + (surv
            ? '<span>' + esc(t('المخيمات')) + ' <b>' + nm(c.n) + '</b></span><span>' + esc(t('تم مسحها')) + ' <b>' + nm(c.sv) + '</b></span><span>' + esc(t('المتبقي')) + ' <b>' + nm(c.n - c.sv) + '</b></span><span>' + esc(t('تحديات')) + ' <b>' + nm(c.chal) + '</b></span>'
            : '<span>' + esc(t('المستهدف')) + ' <b>' + nm(c.n) + '</b></span><span>' + esc(t('المنجز')) + ' <b>' + nm(c.ins) + '</b></span><span>' + esc(t('المتبقي')) + ' <b>' + nm(c.rem) + '</b></span><span>' + esc(t('متعثر')) + ' <b>' + nm(c.obs) + '</b></span>')
          + '</div></div>';
      }).join('') + '</div>';
}

MFU.flt = { z:'', t:'' };

function mfuFilterRow(){
  var O = mfuObstacles(), Z = {}, T = {};
  if (!O.length) return '';
  O.forEach(function(o){ var tx = taxOf(o.x), z = tx.g || '—'; Z[z] = (Z[z] || 0) + 1; if (!MFU.flt.z || z === MFU.flt.z){ var ty = tx.t || '—'; T[ty] = (T[ty] || 0) + 1; } });
  var chip = function(attr, v, on, label, n){ return '<button type="button" class="cat' + (on ? ' on' : '') + '" ' + attr + '="' + esc(v) + '">' + esc(label) + (n != null ? ' <span class="n">' + nm(n) + '</span>' : '') + '</button>'; };
  return '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('المشعر')) + '</span>' + chip('data-mfz', '', !MFU.flt.z, t('الكل'), O.length)
    + Object.keys(Z).sort(function(a, b){ return Z[b] - Z[a]; }).map(function(z){ return chip('data-mfz', z, MFU.flt.z === z, t(z), Z[z]); }).join('') + '</div>'
    + '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('النوع')) + '</span>' + chip('data-mft', '', !MFU.flt.t, t('الكل'), null)
    + Object.keys(T).sort(function(a, b){ return T[b] - T[a]; }).map(function(ty){ return chip('data-mft', ty, MFU.flt.t === ty, t(ty), T[ty]); }).join('') + '</div>';
}
function mfuObs(){
  var O = mfuObstaclesF(), byParty = {}, byCat = {}, ed = may('settings');
  mfuParties().forEach(function(p){ byParty[p] = 0; });

  O.forEach(function(o){ o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; }); var p0 = mfuOwnerOf(o.cats[0]); byParty[p0] = (byParty[p0] || 0) + 1; });
  var cats = Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; });
  var ages = O.map(function(o){ var r = STATE.recs[o.x.id]; return r && r.at ? Math.max(0, Math.round((Date.now() - r.at) / 864e5)) : null; }).filter(function(v){ return v != null; });
  var ageMax = ages.length ? Math.max.apply(null, ages) : 0, ageAvg = ages.length ? Math.round(ages.reduce(function(a, b){ return a + b; }, 0) / ages.length) : 0, ageOld = ages.filter(function(v){ return v > 14; }).length;
  return mfuFilterRow() + ('<div class="mfu-kpis"><div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('إجمالي المعوقات')) + '</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(O.length) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('نقطةٌ لم تُركَّب وفيها عائق')) + '</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('عمر المعوق')) + '</div><div class="mfu-kpi-v">' + nm(ageAvg) + ' <span style="font-size:14px">' + esc(t('يوم')) + '</span></div><div class="hint" style="margin:2px 0 0">' + esc(t('المتوسط منذ تسجيله')) + ' \u00b7 ' + esc(t('الأقدم')) + ' ' + nm(ageMax) + ' \u00b7 ' + esc(t('أكثر من أسبوعين')) + ' ' + nm(ageOld) + '</div></div>'
    + mfuParties().map(function(p){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تُعالَج من خلال')) + ' ' + esc(t(mfuPartyLabel(p))) + '</div><div class="mfu-kpi-v">' + nm(byParty[p] || 0) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('نقطةٌ بجهة عائقها الأوّل')) + '</div></div>'; }).join('') + '</div>'
    + cardFlush(t('فئات المعوقات والجهة المعالجة'), table(['الفئة', 'العدد', 'الجهة المعالجة'], cats.map(function(c){
        var own = mfuOwnerOf(c);
        return ['<b>' + esc(chalShow(c)) + '</b>', N(byCat[c]), ed ? '<select data-mfuown="' + esc(c) + '" style="min-height:30px;font-size:12px;width:auto">' + mfuParties().map(function(p){ return '<option value="' + esc(p) + '"' + (own === p ? ' selected' : '') + '>' + esc(t(mfuPartyLabel(p))) + '</option>'; }).join('') + '</select>' : esc(t(own))];
      })))
    + '<p class="hint">' + esc(t('الجهةُ المعالجةُ لكلِّ فئةٍ يضبطها المكتبُ من هذا الجدول — والافتراضيُّ: العارضةُ وسطحُ التثبيت لكدانة، والاستدلالُ والوصولُ لأفاقي، والباقي لشركة الخدمة.')) + '</p>'
    + (ed ? '<div class="wt-row" style="gap:8px;align-items:center;margin:8px 0 0;flex-wrap:wrap"><span class="hint">' + esc(t('جهات المعالجة')) + '</span>'
      + mfuParties().map(function(k){ var lb = mfuPartyLabel(k); return MFU.prn === k
          ? '<span class="pill"><input data-mfuprn="' + esc(k) + '" value="' + esc(lb) + '" style="max-width:160px;min-height:26px" aria-label="' + esc(t('اسم الجهة')) + '"></span>'
          : '<span class="pill">' + esc(t(lb)) + ' <button type="button" class="btn btn-quiet btn-sm" data-mfupren="' + esc(k) + '" aria-label="' + esc(t('تعديل')) + '" style="padding:0 6px;min-height:22px">\u270E</button>' + (mfuParties().length > 1 ? '<button type="button" class="btn btn-quiet btn-sm" data-mfuprm="' + esc(k) + '" aria-label="' + esc(t('حذف')) + '" style="padding:0 6px;min-height:22px">\u2715</button>' : '') + '</span>'; }).join('')
      + '<input id="mfuNewParty" placeholder="' + esc(t('جهةٌ أخرى')) + '" style="max-width:180px">' + btn('+ ' + t('أضف جهة'), 'btn-quiet btn-sm', ' data-mfupadd="1"')
      + (MFU.parties.some(function(k){ var r = mfuPartyRaw(k); return r && (r.gone || r.t); }) ? btn('\u21BA ' + t('الأصلية'), 'btn-quiet btn-sm', ' data-mfuprst="1"') : '')
      + '</div>' : ''))
    + mfuChal();
}

MFU.f = { 'new':'أُنشئ', owner:'من سيحلّه', m:'آلية المعالجة', st:'الحالة', party:'على مين', u:'إفادة', task:'رُبط بمهمة', o:'المسؤول' };

function mfuAgeDays(at){ return at ? Math.floor((Date.now() - at) / 864e5) : 0; }
function mfuAgePill(at, closed){ if (closed || !at) return ''; var dd = mfuAgeDays(at); return dd >= 14 ? pill(t('مفتوحٌ منذ') + ' ' + nm(dd) + ' ' + t('يوم'), 'bad') : dd >= 7 ? pill(nm(dd) + ' ' + t('يوم'), 'wrn') : ''; }
function mfuOpenedAt(x){ var h = Array.isArray(x.hist) ? x.hist.filter(function(e){ return e.f === 'new'; })[0] : null; return (h && h.at) || x.at || 0; }

MFU.src = { field:['من المسح الميداني', '#1C3674'], task:['من المهام الأسبوعية', '#86432B'], manual:['مسجّلٌ يدويًّا', '#7F8C8D'] };

function mfuChal(){
  var A = mfuAllChal(), ed = may('settings'), ST = ['مفتوح', 'قيد المعالجة', 'مغلق'];

  if (ed && FB.ready && FB.db){ var F0 = mfuData().fch || {}, nw = {}; A.forEach(function(c){ if (c.src === 'field' && !F0[c.t]) nw[c.t] = { seen:Date.now() }; });
    if (Object.keys(nw).length){ MFU.v = MFU.v || {}; MFU.v.fch = Object.assign(MFU.v.fch || {}, nw); STATE.mfu = MFU.v; CORE.set('cfg', 'mfu', { fch:nw }); } }
  var openN = A.filter(function(c){ return !mfuChalClosed(c); }).length;
  var sel = function(attr, cur, opts){ return '<select ' + attr + ' style="min-height:30px;font-size:12px;width:auto">' + opts.map(function(v){ return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>'; };
  var rows = A.map(function(c){
    var S0 = MFU.src[c.src], done = mfuChalClosed(c);
    var what = '<b>' + esc(t(c.t)) + '</b>'
      + (c.src === 'field' ? '<div class="hint" style="margin:2px 0 0">' + nm(c.n) + ' ' + esc(t('نقطة')) + (Object.keys(c.z).length ? ' \u00b7 ' + Object.keys(c.z).map(function(z){ return esc(t(z)) + ' ' + nm(c.z[z]); }).join(' \u00b7 ') : '') + '</div>' : '')
      + (c.src === 'task' && c.why ? '<div class="hint" style="margin:2px 0 0">' + esc(String(c.why).slice(0, 120)) + '</div>' : '');
    var fk = c.src === 'field' ? c.t : '', edr = ed && MFU.edit === c.key;
    var party = c.src === 'field' ? (edr ? '<select data-mfuown="' + esc(fk) + '" style="min-height:30px;font-size:12px;width:auto">' + mfuParties().map(function(p){ return '<option value="' + esc(p) + '"' + (c.party === p ? ' selected' : '') + '>' + esc(t(mfuPartyLabel(p))) + '</option>'; }).join('') + '</select>' : esc(t(c.party)))
      : c.src === 'manual' ? (edr ? sel('data-mchalf="' + esc(c.id) + '|party"', c.party || 'شركة الخدمة', mfuParties()) : esc(t(c.party || '—'))) : '\u2014';
    var owner = (c.src !== 'task' && edr) ? '<input data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|owner" value="' + esc(c.owner) + '" style="min-width:110px">' : esc(c.owner || '\u2014');
    var mit = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|m" rows="2" style="min-width:170px">' + esc(c.m) + '</textarea>' : esc(c.m || '\u2014');

    var dsc = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|desc" rows="2" style="min-width:170px">' + esc(c.desc || '') + '</textarea>' : esc(c.desc || '\u2014');
    var due = (c.src !== 'task' && edr) ? '<input type="date" data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|due" value="' + esc(c.due || '') + '" style="min-width:140px">' : (c.due ? '<span class="num' + (!done && c.due < dayKey() ? ' bad' : '') + '">' + esc(c.due) + '</span>' : '\u2014');
    if (c.src === 'field' && c.n){
      var PTS = mfuObstaclesF().filter(function(o){ return o.cats.indexOf(c.t) > -1; });
      what += '<details class="mfu-pts"><summary class="hint" style="cursor:pointer">' + esc(t('النقاط')) + ' (' + nm(PTS.length) + ')</summary><div class="hint" style="margin:4px 0 0;max-height:260px;overflow:auto">'
        + PTS.map(function(o){ var x = o.x, r = STATE.recs[x.id] || {}, nt = String(r.chal_note || r.note || '').trim(); return '<div style="padding:2px 0;border-bottom:1px solid var(--line)"><b>' + esc(x.name || x.id) + '</b>' + (x.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign) : '') + ' <span class="num">' + esc(x.id) + '</span> \u00b7 ' + esc(t(x.zone || '')) + ' \u00b7 ' + esc(typeLabel(x.type || '')) + (r.access && r.access !== 'تم الوصول' ? ' \u00b7 ' + esc(t(r.access)) : '') + (nt ? '<div>' + esc(nt.slice(0, 160)) + '</div>' : '') + '</div>'; }).join('') + '</div></details>';
    }
    var age = c.src === 'manual' ? mfuAgePill(mfuOpenedAt(mfuList('chal').filter(function(x){ return x.id === c.id; })[0] || {}), done) : c.src === 'field' ? mfuAgePill(((mfuData().fch || {})[c.t] || {}).seen || ((mfuData().fch || {})[c.t] || {}).at, done) : '';
    var st = (age ? age + ' ' : '') + (done ? pill(t('تم الحل') + (c.at ? ' \u00b7 ' + fmtDate(c.at) : ''), 'ok')
      : (c.src === 'task' ? pill(t('متوقفة'), 'bad') : (edr ? (c.src === 'field' ? sel('data-fch="' + esc(fk) + '|st"', c.st, ST) : sel('data-mfuchalst="' + esc(c.id) + '"', c.st, ST)) : pill(t(c.st), 'wrn'))));
    var task = c.tk ? pill('#' + c.tk.id + ' \u00b7 ' + t(c.tk.st), c.tk.done ? 'ok' : (c.tk.st === 'متوقف' ? 'bad' : 'wrn'))
      : (c.src !== 'task' && !done && wtMay() ? btn('\uFF0B ' + t('مهمة معالجة'), 'btn-quiet btn-sm', ' data-chaltask="' + esc(c.key) + '"') : '\u2014');
    var upd = chalUpdBox(c.src === 'field' ? c.t : (c.src === 'manual' ? 'M:' + c.id : c.key));
    return ['<span class="pill" style="background:' + S0[1] + '22;color:' + S0[1] + ';border:1px solid ' + S0[1] + '55">' + esc(t(S0[0])) + '</span>', what, party, owner, mit, dsc, due, st, task, upd,
            (ed && c.src !== 'task' ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="' + esc(c.key) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
            + ((c.src === 'manual' && ed) ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="chal|' + esc(c.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
  });
  var form = (ed ? card('تحدٍّ جديد', '<div class="grid2"><label>' + esc(t('التحدي')) + '<textarea id="mcT" rows="2"></textarea></label><label>' + esc(t('آلية المعالجة')) + '<textarea id="mcM" rows="2"></textarea></label></div>'
        + '<div class="grid2"><label>' + esc(t('المسؤول')) + '<input id="mcO"></label><label>' + esc(t('المسار')) + '<select id="mcR">' + ['التركيبات', 'التوريدات', 'المسح', 'المواءمة مع الشركات'].map(function(v){ return '<option value="' + esc(v) + '">' + esc(t(v)) + '</option>'; }).join('') + '</select></label></div>'
        + '<div class="actions">' + btn(t('سجّل التحدي'), 'btn-primary btn-sm', ' data-mfuchal="1"') + '</div>') : '');
  return '<div class="mfu-kpis"><div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تحدياتٌ مفتوحة')) + '</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(openN) + '</div></div>'
    + ['field', 'task', 'manual'].map(function(k){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t(MFU.src[k][0])) + '</div><div class="mfu-kpi-v">' + nm(A.filter(function(c){ return c.src === k && !mfuChalClosed(c); }).length) + '</div></div>'; }).join('')
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تم الحل')) + '</div><div class="mfu-kpi-v" style="color:#27AE60">' + nm(A.length - openN) + '</div></div></div>'
    + '<div class="actions" style="margin:6px 0">' + btn('\u2B07 ' + t('تصدير نقاط التحديات') + ((MFU.flt.z || MFU.flt.t) ? ' (' + t('بالفلتر') + ')' : ''), 'btn-secondary btn-sm', ' data-xls="chalpts"') + ' <span class="hint">' + esc(t('كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومشعرها ومعالجته — بالفلتر الحالي إن وُضع')) + '</span></div>'
    + (A.length ? cardFlush(t('التحديات وآليات المعالجة') + ' \u2014 ' + nm(A.length), table(['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'وصف المعالجة', 'آخر تاريخ', 'الحالة', 'مهمة المعالجة', 'الميدان ↔ المكتب', ''], rows)) : '<p class="hint">' + esc(t('لا تحدياتٍ مسجّلةٌ بعد.')) + '</p>')
    + '<p class="hint">' + esc(t('تحدياتُ المسح الميداني تُقرأ من النقاط غير المركَّبة وتصير «تم الحل» حين لا تبقى نقطة؛ والمهمةُ الأسبوعيةُ المتوقّفةُ تحدٍّ قائم؛ واكتمالُ مهمة المعالجة حلُّ تحدّيها.')) + '</p>'
    + (form ? '<details class="mfu-add"' + (A.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('تحدٍّ جديد')) + '</summary>' + form + '</details>' : '');
}
function mfuReq(){
  var L = mfuList('req'), ed = may('settings'), ST = ['جديد', 'قيد التنفيذ', 'منجز'];
  var form = (ed ? card('طلبٌ جديد', '<label>' + esc(t('الطلب')) + '<textarea id="mrT" rows="2"></textarea></label><div class="grid2"><label>' + esc(t('الإفادة / آخر تحديث')) + '<textarea id="mrU" rows="2"></textarea></label><label>' + esc(t('المقترح / الدعم المطلوب')) + '<textarea id="mrS" rows="2"></textarea></label></div>'
        + '<div class="actions">' + btn(t('سجّل الطلب'), 'btn-primary btn-sm', ' data-mfureq="1"') + '</div>') : '');
  return (L.length ? cardFlush(t('طلبات الوزارة') + ' \u2014 ' + nm(L.length), table(['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ', ''], L.map(function(x, i){
        var V = mfuReqView(x);
        var edr = ed && MFU.edit === 'R:' + x.id;
        var up = V.uSrc ? '<div>' + esc(V.u) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('من المهمة')) + ' #' + nm(V.uSrc) + '</div>'
          : (edr ? '<textarea data-mfurequ="' + esc(x.id) + '" rows="2" style="min-width:160px">' + esc(x.u || '') + '</textarea>' : esc(x.u || '\u2014'));
        var stc = V.tk && V.tk.done ? pill(t('منجز'), 'ok') : (edr ? '<select data-mfureqst="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + ST.map(function(v){ return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>' : pill(t(V.st), V.st === 'منجز' ? 'ok' : 'wrn'));
        var tk = V.tk ? pill('#' + V.tk.id + ' \u00b7 ' + t(V.tk.st), V.tk.done ? 'ok' : (V.blocked ? 'bad' : 'wrn')) : (V.st !== 'منجز' && wtMay() ? btn('\uFF0B ' + t('مهمة تنفيذ'), 'btn-quiet btn-sm', ' data-reqtask="' + esc(x.id) + '"') : '\u2014');
        return [N(i + 1), '<b>' + esc(x.t || '') + '</b>' + (V.st !== 'منجز' ? '<div style="margin:3px 0 0">' + mfuAgePill(mfuOpenedAt(x), false) + '</div>' : ''), up, esc(x.s || ''), stc + (V.blocked ? ' ' + pill(t('متوقفة'), 'bad') : ''), tk,
                (ed ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="R:' + esc(x.id) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
                + (ed ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="req|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
      }))) : '<p class="hint">' + esc(t('لا طلباتٍ مسجّلةٌ بعد.')) + '</p>')
    + (form ? '<details class="mfu-add"' + (L.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('طلبٌ جديد')) + '</summary>' + form + '</details>' : '');
}

var WDY_SER = [['sv', 'تمت الزيارة', 'var(--min-gold)'], ['ins', 'التركيب', 'var(--min-green)'], ['dis', 'الفك', 'var(--min-teal)'], ['stuck', 'المتعذر', 'var(--min-red)']];
function wdyHour(ms){ return (new Date(+ms).getUTCHours() + 3) % 24; }
function wdyHourLbl(h){ var s = (h < 10 ? '0' : '') + h + ':00'; return LANG === 'en' ? s : s.replace(/\d/g, function(c){ return nm(+c); }); }
function wdyKeep(){
  var a = +WDY.h1 || 0, b = WDY.h2 == null ? 24 : +WDY.h2;
  if (a <= 0 && b >= 24) return null;
  return function(ms){ var h = wdyHour(ms); return a < b ? (h >= a && h < b) : (h >= a || h < b); };
}
function wdyPct(n, base){
  if (!n || !(base > 0)) return '';
  var v = n / base * 100; v = v < 10 ? Math.max(0.1, Math.round(v * 10) / 10) : Math.round(v);
  return nm(v) + '\u066A';
}
function wdyDayLbl(day, o){ return fmtDate(Date.parse(day + 'T12:00:00Z'), o || { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' }); }
function wdyBase(){ var S = STATE.sites || [], n = 0; S.forEach(function(x){ if (mfuInstalled(x)) n++; }); return { sv:S.length, ins:S.length, dis:n }; }
function wdyCellPct(r, k, B){ return k === 'stuck' ? wdyPct(r.stuck, r.sv) : wdyPct(r[k], B[k]); }
function wdyNice(v){ if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function wdyHourRow(a, i, keep){
  var b = a + 36e5, day = dayKey(a);
  var x = diaryRows(function(ms){ return ms >= a && ms < b && (!keep || keep(ms)); }).filter(function(q){ return q.day === day; })[0] || {};
  return { key:String(i), lbl:wdyHourLbl((i + 3) % 24), sv:x.sv || 0, ins:x.ins || 0, dis:x.dis || 0, stuck:x.stuck || 0 };
}
function wdyChart(rows, vis, hourly, B){
  var n = rows.length; if (!n) return '';
  if (!vis.length) return '<p class="hint">' + esc(t('اختر عملا واحدا على الأقل لعرض الرسم.')) + '</p>';

  var mx = 0, g = '', yl = '', dots = '', xl = '';
  rows.forEach(function(r){ vis.forEach(function(s){ if (r[s[0]] > mx) mx = r[s[0]]; }); });
  mx = wdyNice(mx);
  var X = function(i){ return n > 1 ? 20 + i * 960 / (n - 1) : 500; }, Y = function(v){ return 70 + 920 * (1 - v / mx); };
  var pc = function(v){ return (v / 10).toFixed(2) + '%'; };
  [0, 0.5, 1].forEach(function(f){ var y = Y(mx * f);
    g += '<line class="wd-grid" x1="0" x2="1000" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"></line>';
    yl += '<span class="wd-yl" style="top:' + pc(y) + '">' + nm(Math.round(mx * f)) + '</span>'; });
  var step = Math.max(1, Math.ceil(n / (hourly ? 12 : 8)));
  var li = 0;
  rows.forEach(function(r, i){ if (i % step) return; var x = X(i) / 10, cl = (x < 6 ? 's' : x > 94 ? 'e' : '') + (li++ % 2 ? ' alt' : '');
    xl += '<span' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + ' style="left:' + x.toFixed(2) + '%">' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { day:'numeric', month:'short', timeZone:'UTC' })) + '</span>'; });
  g += vis.map(function(s){ var k = s[0];
    if (n <= 62) rows.forEach(function(r, i){ if (r[k]) dots += '<i class="wd-dot" style="--c:' + s[2] + ';left:' + pc(X(i)) + ';top:' + pc(Y(r[k])) + '"></i>'; });
    return '<g class="wd-s" style="--c:' + s[2] + '"><polyline points="' + rows.map(function(r, i){ return X(i).toFixed(1) + ',' + Y(r[k]).toFixed(1); }).join(' ') + '"></polyline></g>'; }).join('');

  var cw = n > 1 ? 960 / (n - 1) : 960;
  var hov = rows.map(function(r, i){
    var a = Math.max(0, X(i) - cw / 2), b = Math.min(1000, X(i) + cw / 2);
    var tip = '<b>' + esc(hourly ? wdyDayLbl(WDY.day, { day:'numeric', month:'long', timeZone:'UTC' }) + ' \u00B7 ' + r.lbl : wdyDayLbl(r.key)) + '</b>'
      + vis.map(function(s){ var p = wdyCellPct(r, s[0], B); return '<span style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(r[s[0]]) + '</b>' + (p ? ' <em>' + p + '</em>' : '') + '</span>'; }).join('');
    return '<div class="wd-c ' + (X(i) > 500 ? 'wd-r' : 'wd-l') + '" style="left:' + pc(a) + ';width:' + pc(b - a) + '"><div class="wd-tip">' + tip + '</div></div>';
  }).join('');
  return '<div class="wd-chart" role="img" aria-label="' + esc(t('ملخص العمل اليومي')) + '"><div class="wd-plot"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + g + '</svg>'
    + yl + dots + '<div class="wd-hov" aria-hidden="true">' + hov + '</div></div><div class="wd-xax" aria-hidden="true">' + xl + '</div></div>';
}
function mfuDaily(){
  var keep = wdyKeep(), all = diaryRows(keep);
  if (!all.length && !keep) return '<p class="hint">' + esc(t('لا أعمالَ مسجّلةٌ بعد.')) + '</p>';
  var B = wdyBase(), months = [];
  all.forEach(function(r){ var m = r.day.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
  months.reverse();
  if (WDY.mon && months.indexOf(WDY.mon) < 0) WDY.mon = '';
  var inMon = WDY.mon ? all.filter(function(r){ return r.day.slice(0, 7) === WDY.mon; }) : all;
  if (WDY.day && !inMon.some(function(r){ return r.day === WDY.day; })) WDY.day = '';
  var hourly = !!WDY.day, rows = [];
  if (hourly){ var d0 = Date.parse(WDY.day + 'T00:00:00Z'); for (var i = 0; i < 24; i++) rows.push(wdyHourRow(d0 + i * 36e5, i, keep)); }
  else rows = inMon.map(function(r){ return { key:r.day, lbl:r.day, sv:r.sv, ins:r.ins, dis:r.dis, stuck:r.stuck || 0 }; });
  var vis = WDY_SER.filter(function(s){ return !WDY.off[s[0]]; }), tot = { sv:0, ins:0, dis:0, stuck:0 };
  rows.forEach(function(r){ tot.sv += r.sv; tot.ins += r.ins; tot.dis += r.dis; tot.stuck += r.stuck; });
  var act = function(r){ return r.sv + r.ins + r.dis + r.stuck > 0; };
  var work = rows.filter(function(r){ return r.sv + r.ins + r.dis > 0; }), prim = vis[0] || WDY_SER[0];
  var best = work.slice().sort(function(a, b){ return b[prim[0]] - a[prim[0]]; })[0];
  var monLbl = function(m){ return fmtDate(Date.parse(m + '-15T12:00:00Z'), { month:'long', year:'numeric', timeZone:'UTC' }); };
  var opt = function(v, lb, on){ return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(lb) + '</option>'; };
  var hs = []; for (var h = 0; h <= 24; h++) hs.push(h);
  var flt = '<div class="wd-flt">'
    + '<label>' + esc(t('الشهر')) + '<select id="wdyMon">' + opt('', t('كل الشهور'), !WDY.mon) + months.map(function(m){ return opt(m, monLbl(m), WDY.mon === m); }).join('') + '</select></label>'
    + '<label>' + esc(t('اليوم')) + '<select id="wdyDay">' + opt('', t('كل الأيام'), !WDY.day) + inMon.slice().reverse().map(function(r){ return opt(r.day, wdyDayLbl(r.day, { weekday:'short', day:'numeric', month:'short', timeZone:'UTC' }), WDY.day === r.day); }).join('') + '</select></label>'
    + '<label>' + esc(t('من الساعة')) + '<select id="wdyH1">' + hs.slice(0, 24).map(function(x){ return opt(String(x), wdyHourLbl(x), (+WDY.h1 || 0) === x); }).join('') + '</select></label>'
    + '<label>' + esc(t('إلى الساعة')) + '<select id="wdyH2">' + hs.slice(1).map(function(x){ return opt(String(x), wdyHourLbl(x), (WDY.h2 == null ? 24 : +WDY.h2) === x); }).join('') + '</select></label>'
    + '<span class="hint">' + esc(t('بتوقيت مكة')) + '</span>'
    + (WDY.mon || WDY.day || keep ? btn('إعادة الضبط', 'btn-quiet btn-sm', ' data-wdyreset="1"') : '') + '</div>';
  var lg = '<div class="wd-lgs">' + WDY_SER.map(function(s){ var on = !WDY.off[s[0]];
      return '<button type="button" class="wd-lg' + (on ? '' : ' off') + '" data-wdyser="' + s[0] + '" aria-pressed="' + on + '" title="' + esc(t('اضغط للإخفاء أو الإظهار')) + '" style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(tot[s[0]]) + '</b></button>'; }).join('') + '</div>';
  var st = '<div class="wd-stats"><span>' + esc(t(hourly ? 'ساعات العمل' : 'أيام العمل')) + ' <b>' + nm(work.length) + '</b></span>'
    + (best ? '<span>' + esc(t(hourly ? 'أعلى ساعة' : 'أعلى يوم')) + ' <b>' + esc(hourly ? best.lbl : wdyDayLbl(best.key, { day:'numeric', month:'long', timeZone:'UTC' })) + '</b>: ' + esc(t(prim[1])) + ' <b>' + nm(best[prim[0]]) + '</b></span>'
      + '<span>' + esc(t('المتوسط')) + ': ' + esc(t(prim[1])) + ' <b>' + nm(Math.round(tot[prim[0]] / work.length)) + '</b></span>' : '') + '</div>';
  var list = hourly ? rows.filter(act) : rows.slice().reverse(), PG = 15, P = Math.max(1, Math.ceil(list.length / PG));
  WDY.pg = Math.min(Math.max(1, +WDY.pg || 1), P);
  var part = EXP.xlsAll ? list : list.slice((WDY.pg - 1) * PG, WDY.pg * PG);
  var cell = function(r, k){ var p = wdyCellPct(r, k, B); return N(r[k]) + (p ? ' <small class="wd-p">' + p + '</small>' : ''); };
  var tb = list.length ? table([hourly ? 'الساعة' : 'اليوم'].concat(vis.map(function(s){ return s[1]; })),
      part.map(function(r){ return { raw:'<tr' + (act(r) ? '' : ' class="wd-z"') + '><td>' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' })) + '</td>'
        + vis.map(function(s){ return '<td>' + cell(r, s[0]) + '</td>'; }).join('') + '</tr>' }; }),
      ['الإجمالي'].concat(vis.map(function(s){ return cell(tot, s[0]); })))
    : '<p class="hint">' + esc(t('لا عمل في هذا النطاق.')) + '</p>';
  var pg = '';
  if (P > 1){ var nums = []; for (var q = 1; q <= P; q++) nums.push(q);
    pg = '<div class="wd-pager"><button type="button" class="btn btn-quiet btn-sm" data-wdypg="p"' + (WDY.pg <= 1 ? ' disabled' : '') + '>' + esc(t('السابق')) + '</button>'
      + nums.map(function(q2){ return '<button type="button" class="btn btn-sm ' + (q2 === WDY.pg ? 'btn-primary' : 'btn-quiet') + '" data-wdypg="' + q2 + '"' + (q2 === WDY.pg ? ' aria-current="page"' : '') + '>' + nm(q2) + '</button>'; }).join('')
      + '<button type="button" class="btn btn-quiet btn-sm" data-wdypg="n"' + (WDY.pg >= P ? ' disabled' : '') + '>' + esc(t('التالي')) + '</button>'
      + '<span class="hint">' + nm((WDY.pg - 1) * PG + 1) + '\u2013' + nm(Math.min(list.length, WDY.pg * PG)) + ' ' + esc(t('من')) + ' ' + nm(list.length) + '</span></div>'; }
  var rng = hourly ? wdyDayLbl(WDY.day) + ' \u2014 ' + t('ساعة بساعة')
    : WDY.mon ? monLbl(WDY.mon)
    : rows.length ? t('من') + ' ' + wdyDayLbl(rows[0].key, { day:'numeric', month:'long', timeZone:'UTC' }) + ' ' + t('إلى') + ' ' + wdyDayLbl(rows[rows.length - 1].key, { day:'numeric', month:'long', timeZone:'UTC' }) : t('كل الأيام');
  if (keep) rng += ' \u00B7 ' + t('من الساعة') + ' ' + wdyHourLbl(+WDY.h1 || 0) + ' ' + t('إلى الساعة') + ' ' + wdyHourLbl(WDY.h2 == null ? 24 : +WDY.h2);
  var note = '<p class="hint" style="margin:10px 0 0">' + esc(t('النسبة من إجمالي النقاط للزيارة والتركيب، ومن النقاط المركبة للفك، ومن زيارات اليوم لما تحتاج زيارة أخرى.')) + ' ' + esc(t('إجمالي النقاط')) + ': ' + nm(B.sv) + '</p>';
  return cardFlush(t('ملخص العمل اليومي') + ' \u2014 ' + rng, flt + lg + st + wdyChart(rows, vis, hourly, B) + tb + pg + note);
}

EXP.scope = { m:'all', g:'', t:'' };

MFU.sections = [
  ['brief', 'الملخص التنفيذي', ['النص']],
  ['kpis', 'الملخص', ['المؤشر', 'القيمة', 'التفصيل', 'عن الأسبوع الماضي']],
  ['svz', 'المسح الميداني — حسب المشعر', ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى']],
  ['svd', 'المسح الميداني — المشعر والنوع', ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ']],
  ['jmr', 'منشأة الجمرات — تأكيد النقاط بالمسح', ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد']],
  ['tasks', 'حالة أبرز المهام', ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ']],
  ['blocks', 'المسار | القارئات — المنجز والقادم والمطلوب', ['الكتلة', 'البند', 'التفصيل']],
  ['inst', 'حالة التركيبات', ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة']],
  ['cos', 'شركات الخدمة — المسح والتركيب', ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'رُكّب', 'الحالة']],
  ['parties', 'بيان المعوقات — الجهة المعالجة', ['الجهة', 'عدد المعوقات']],
  ['cats', 'فئات المعوقات', ['الفئة', 'العدد', 'الجهة المعالجة']],
  ['chal', 'التحديات وآليات المعالجة', ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة']],
  ['req', 'طلبات الوزارة', ['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ']],
  ['upd', 'آخر التحديثات — هذا الأسبوع', ['متى', 'النوع', 'البند', 'التحديث', 'بواسطة']],
  ['owners', 'الحمل على المسؤولين', ['المسؤول', 'تحديات مفتوحة', 'مهام مفتوحة', 'متأخرة']],
  ['weeks', 'مسار الأسابيع', ['الأسبوع', 'تمت الزيارة', 'تركيب المخيمات', 'تركيب الممرات', 'المعوقات']],
  ['daily', 'ملخص العمل اليومي — آخر ١٤ يومًا', ['اليوم', 'تمت الزيارة', 'التركيب', 'الفك', 'تحتاج زيارة أخرى']]];
function mfuSecTitle(R, sc){ return sc[0] === 'upd' && R.updTitle ? R.updTitle : sc[1]; }
function mfuRowsOf(R, key){
  if (key === 'kpis') return R.kpis.map(function(k){ return [k[0], k[1], k[2], k[3] == null ? '' : (k[3] > 0 ? '▲ +' : k[3] < 0 ? '▼ ' : '') + k[3]]; });
  return R[key] || [];
}
function mfuFileName(ext){ var f = [(typeof mfuFltLabel === 'function') ? mfuFltLabel() : '', (typeof expScopeLabel === 'function') ? expScopeLabel() : ''].filter(Boolean).join(' \u00b7 ');    return 'التحديث-الأسبوعي-قارئات-نسك-' + dayKey() + (f ? '-' + f.replace(/[\\/:*?"<>|\u00b7]+/g, '-').replace(/\s+/g, '-') : '') + '.' + ext; }

function mfuXlsx(){
  toast(t('يُجهَّز ملفُّ إكسل…'));
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var R = mfuReport(), wb = XLSX.utils.book_new();
    if (!expGate('إكسل', mfuReportCheck(R))) return false;
    MFU.sections.forEach(function(sc){
      var rows = [sc[2]].concat(mfuRowsOf(R, sc[0]));
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = sc[2].map(function(_, i){ var wd = 10; rows.forEach(function(r){ wd = Math.max(wd, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:wd }; });
      if (!wb.Workbook) wb.Workbook = { Views:[{ RTL:true }] };
      XLSX.utils.book_append_sheet(wb, ws, sc[1].replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30));
    });
    XLSX.writeFile(wb, mfuFileName('xlsx'));
    logEvent('تصديرُ التحديث الأسبوعي — إكسل', ''); toast(t('صُدّر ملفُّ إكسل'));
    return true;
  }).catch(function(e){ softErr('xlsx', e, ''); toast(t('تعذّر التصدير')); return false; });
}

var MOH_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXwAAAB1CAMAAAB6QaqEAAAAwFBMVEXVol/Wol/Wol/Wol7/AAD///9/f39+fi29fT67pmcCFBG9vT60a2ftsTr/fwXo0WbUf1UA/wAAAP9/Pz9//3///6oAVQBVqlX/AP//qqr9wHEAAAAACAvYpGDttGrWol7Xo2DXo2DjrGUABwoABwoABwoABwrWol4ABwr//3/YpGD//wAABwqqqlX8qVX/f38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXjT7hAAAAMHRSTlMcX8+PAQECAwQHDAQEBAIEBgEBBAIDAwMBA/8A+vv+rLOT/o8u0U73rwLQAXADAwL+PVKRAAAll0lEQVR42u1dB7OjupIWYHxsnzPhvrBJxuRg4v//d9vdCkggbOyZ2t3aN1TdOz6mDdKnVie1Wiz+172ShPGJ//LVdYPHDuEbv2S3f+XL48Ovgz/w4Ba8NYoMxj9OiA80QxgfEskiO0iSZL6XxMn2U+hTnMwUDhJx1yBRL01mknj+YDO0fv2aJFly/vEtvA8dXAeFPYuizOOjngj61lPw+Z/rxet4kjifhg7+/8XjrM581sEfhzvr6Nb9PO0YAOZ5XsLkx8RvE499cD7C6B35icGND/6TmSRtmwTeT/gI4wtTDUmAGEk8/RQfSOB7Fs4kIZIEBkmcIslZkZzkU1JFkraSZJwOhyOSnHk3IYkXaJLWT5BkuB9Q5p7hTd3xQF0iku8sxcYgSTh0wK5EQrwprjd4fsQfDYwxGoETtB4YP6ojZH36Cm8RWqenj2dRFmUB/MBLsiyqs9sta70PQD/kXhtFAZsm1t6iLCGS6KZIGL+HRySpYxaOPAaSVpLUdQY0EZB005GzpI4SFv7gKZBESJLiUyIgqVMELiSSlsEk9JDEA5oAXukjSYSjPsJT0ihqPUESEYmHJLUiOX0ckAQgOIkupUQyd4kYintAEtxDDeThHc6HHvg+tBg47ISiw8vgqVnCvwHYLEjauq7FgO94EvwS8IKeAr5R5Cd+dAMkPjvv1ta3G+PfOINRED2FZ7ZZm8RA4vHjAEi0GWitn4IkgybBjSHO/BhIAAlgEQAtAn3048hiILnRozwW3Oo4BvhgnE8AFrwz5ucjC6AXiC6SwMOBJAMY+ReMv1/f/BFENJHU0BhgDOh2gu0F+E/3GNsbMZDBoktAgkMAXYpbImFdgCSZMnG6t3QksFeGaEf4D/FpnCHn+4A28KJ57yn+jAFj4lS+pfBjxAvHA/UHMKPXxtDSkPlZm8JLo+QAbOUNRHIDUPyMMR9GqvsAuecHHgCDHAywAKMBa0KPEyBpcaQ+gfXhKUACALEa2RU6guMc3DyWAMk0Al/XsecRCccHQ/NiHGcPhi+Ff7sT8hmQtMjkPMYeTzCS8Ae7xR9elA6H4QCAA4lPJF6GEOCoAknUnrwW3owMfwCu9V5VuCDS2hY5FeCuEXKc7jXBDZM6EcjD3xn+rw3Emx6BH9AApREbOpCmJAdZAjx+w4E4IrBE4tGkHljAqcFA0npRTCobJTKKc4+0PjQCRgwecwZB4/k+Sj/gtW5UJCn8BNkZ3+RlGYzqgGpr6u6hB3DAJII5TCQkX2GcvTQj7XM8jp0H3zNgBB8nvCdJ2ptHKP8d+Pkf0A3GzwkAAGoCSO7UpfYWiC4BCT+ApARR9rqpOeHvUO4AbwP8NU7ASCAetJlC3gdlhXqG7bF2TmyM6w406z+ne6ehjuFmgmJHdC9JIna4n0EJgHhlRyLxJ9aBimSyewkw8dShEsXRIByBI86hJkE2BpLwzHBMJdR1BM+EcR8+OCESeVFw5OcRvh2Q5JyQPhtYzA9fRAKKAcf9i92H04QkwDs0W1kyCDhhxAIcdzZ+G+5HIsFxD/jPMWai09CllH1/Wep3x06IH5CIxPzyUh8yYHiSZ8dwh6k5AOk/QSaAePCF1qv9NIAhNcQDSmeOjBOTYmRZDaaIn9HEjlohQTKa+wEPfA+FKky7OEASEGdJJCQI6UFga0+YxX4GZhFoggyATDPUiSAeUFZFLbws5fcvVOQxkqBWhfeHyHZE4kdH5idjh1IrSgJkv5ZIGDActLcVEs9PpCL3gUR0KTO6xF/F/mgwM8AfGfCjHIpItavrNO2y8zvkQB910QBTGjRrLRUjqlc0YGA2jABejE7hjyGFNwJJTSSAehKDHgNxMB3jDKiBRCo9EJAgV4CbQb0CCYpbocgDmFBEErU4g1PUnXEC2htHcvIyIGlBWhFJ5oMgusVAAlYEkqAiBxL/VjNqODy5RtvIF+rVx2adoCcw/5FkQhLZJSCpoUugvdEaG7pX7Uy0Z70gjZMUZjYZK/YFzAW3kzgVgmfs9jhZaMz5LfJjAB4D8sRIJiEAIwxLHEYiAQ8DbasMRYawGsmwRKtxDENQaH7AToIEvvvJ0tYkGUAZAEnKRlSL9Q0VurAaiQR9hQHsU3AEEkQNsRcTC+63wvYEhd+RfYpcPTBfkyRoNSFJK9wDaC+4Lfx+j2WXyBCmp8guvcj2HzRjAJIMUQG2T+IF9n7QEmJ4RS12+P4QfOluSOvrowP7GET0cNT+kueB1P+6KxJQjGSsczLY0OuKE5Kp49B1oUkSiFcjSZIIf2nUbxIkMSMRfQANJkmmz7DrhBaktqD2Jv6BkfcFCTpvnejUx+GM7QVLMyQS8ABjQXJULwq7IzoO4ACILsXSMePn6UUna+JgTpFZWcv/ZbPIl3Jf367pNhoNf8ILv+GCmZRkUsTXdbRxydu1IAJL9JE9xZLFFcv/jMDXQ5LESWP8/YhEfblBYj5KxcwekCS7SWL53QshZRDMaEtm4jLMmxX8pHglFfj0D1yJPyHlvUF7MKVrMPLw8lshYZwXyKK6JbqErJYHA8zSf90rAJG8dw3kO/eEASNdU89LWyf24MVbdEGAkco/Mv/XrsMcVwOWRit6Q+zATQqldk/dCHbfvoaPj2Hz3vCA2v3DwfmwYXXD+NN+5nZrXmq68Z6XfKw7Q+s6rrNsS+IYskdG1gb2x9r5LVf4FxdB6m1la9g8oBTI3Z3+X4B/+V9+f8fBs88Me/KRtSlvok9/fw/8vCzzjVtFU1Yr6qui7strv/6J+2HwZWU/qpn/7MuyUZ/Lsux3I5UbP9ymqV7KUfiMbxrUR6JH3axFyPkB7z8Av7/CVTpvVY47+fXazL9cd725XhfoFzmSFjxv7EGy3qP/Kl0P3brgZdcnJAWQFPvB/wrjTLi1GQaQgjTxndDDrSD2I7mqgou7H91z8FcNAbCAm50dLpuqvK7HqnRgBjeaQjxuCX5TImkFw2YNYm4DZAxuuRuq/hH4YgblL4EvIlpo3cceGxhLkw25U0dtAJaOWvGqs3jblwDwewnYApq+vBQ9cJBjrleEmmM2zJiVFhdWeLuoiuVcQdKKBsCAprIYQAO0xrOvpDwqnFNTfbt8bSGmEMil/WKHlskBep8SA9L2idihICLhX+M6w7AJfn6l7sKsvlbruesEv4fWF41jGjsYVqBWwFiuH4NfwfMv5vQqLLpyblS15NRKTKV8PaVECyr9cdGFkn5wfUXiDzzNNPSrgNpa4Wa0rM9x7TXzp3DDpGXYJ+h8TkDnNvZ91TflhrhcqU9Thto4VTm+YC2/6CsEvrkuRsTEqV/jKawfZJeyovZfV8w/c01DZFZLqwaa94rAP3KGUekzrZFllkHjDq0h/LjYTSsum6zPruZVWuy93RhSuP26v9WaYSVwRb62dZqcIC1IjJlfWlq8X+OpbhnXko1LxUlicJbM35RF+QLjn7iHy2f8fEwziXy9IXgyFflEO7M74bpowL82wC8Fyxf0r8kM5cPWXdfqyuDSlarIrw47EfmvBNLGNAvtGdUbs7G0Z2YuWT6/uuROo2yjXoC/mhlN+YLjME1xigvCmCYifCzwoBJXcAe/VVMD7cxvyPyMdxsyv5ccny+6cM0f2cjXonGAnzsYVg1W5bQHr/T/avnafJ5izQpPrfbFL/Ffl7lTGmT5ugPNC5xPWXcTLfNJmZKiOnVdiUdKgcYoi8dhGvDHhy1rB5i+Eo6TLSnyR2Y0AF9tMdt6IGm0tiztvrHsm9IU/KbRurY1JYKXvHIKRmPaOabuS+CjvSOsTTI3PXZON2LKqGpPXiutfA8kzvDYySqcSnWzdWq0XvGynCK2cDymBAGVm1q2NJl5ISqKfS5U4aDL+5ewP+KqpkzLATvSw/XtjbUUSuPw5Niggzu97uFuujTV1W2lbXpZL4VmhH1r6hYXMzt+V2yq/99zodCRAQPMWXTGd4yQDq45AnUy7Y/t9JphL1s97bd6VW0Z+i9dlW27GPL8YTygKtfmzm8Fv+MiLxDXxBNp8tRZvVrFiiI1Qh4NxguxHUNUl9cNziyLbdiKNcO+eoFRWlgYFnuYeRVHc/vm71+YDlNjlliI2EusYzu+U8cq7Enoszars4CfH4FvSMTeYK3GxWbAffnlgZitnF7WL1yN8aBygadhE1QrpPPrQ3Pt5Wvgsch4w70Qyo0KsqWp42fazGS05O5v2ZkC/HxupcmvuYPN+ofsZPgyv23S5wb4y7hoMbuuaxOgv75qzzyVOpnYRJBJ0ZIwb4F9fQtwl4BAPwDac5s9XEAX3kq/Nn7XzAS9bwq+C/zfNulNDZOvwb+KFvXENZUZRdDqPy9/RzsmzgT2TGlWj3trY/PmcWXnZLRvIbl523lTEnzqgx2CWhn61TNAH3pZ74NfbDHzHDkQL7ZMAW2kltfyt0gdD3j4NJHwiUijMmd8xyNRT84uO4zwR7qdlsiUcQftbmxBvWh081SGPvSy3jd+Cu5wdzXnl1WlZJPlK2uD63r9HehPuJNiFBuwhD5lvmR8oXRbuXIbCStTeFgjuLce//cH4Iu4ZnGpVlHNRShq6SHBZbkvjdvLWrs4l6IotuTXpbg8AL9cenvY5kI2vLSsVAl+4ViPuxRvWQNHECApLmdRlrkUOrgtA6dC4EmnFrfkpvSVz47bylaZmoUITS1DJHZY02xu0TelDoQ22rnPLS+rMQCyRFDVqJ+WTZPnfV/R1fd53pTlmrvXksTm/bw0YLYiq4UOrJXLoFBZvcH8nWD8rD3zUQod2m0g/lWmDzt8k8IJdW34BHy5WrsU08WGtdiX1+Ul8He5uBKR5mKFwx5eC6Vacpe7a8eV+3kktElggF9a8ez+urVItHM9C0D9QVMgol2UgWDzIxf2f+aP44Ryv868hznKyskSvLiMnLitRTd4jS0WNJOa99dReOdV2NMv5y531xWNqCxIGzkJlmu1hXrP6+iPtFsDdSofpbbFWAOB3/KJSbEvjSKUQKcd4AtEl3axM1Wj34asmsdPgT9j3ZsGyqOrFAoFpFBTLpZJXLFjs+WNibP2EBZSp3SP8p7rjCIGIT1JiY/7/0jE1Jl/HtSXMf8igix+khbFTHbI1ytN24xf9hofyXymTJbsiMA015k7m6fQ5wUvmo3FtcYBvrn+WZkclKtxsxcMsKey1c1b4Le0JdDPhNCZJPhR+wPYXHwE1r+PPH4R/OXyU74R9zJRKWaxsgZfBEDFKllvTnmJBlo9phIQusMSbGVfmcy81R764cXMAtBWf2GFSXM1Sd8Ie55p6yrtkFJ+1Bn39UnET/PXA0qoveA3rplYVS5bvskbo8O9KVXsFCcZjgB8dfpVJcyjvJ9D7bNgUmsqDsFGv6mqZi0q0EyYWaG/Wjq/midrbqoCaFL+Dusj+OA6dTLIlvlfuC9Ug38cpPxHWX/k8e1RUG0GH038yrkWuuI0U20WhWJSYWMYKVYa/OsjETtD3/RPNLoxEnTls9ddzE83pu8MfmWy/pZI2+nmAqAD/yblPO3BZr7YhgXg3w/CFPUPISrnm7dL4ZaoKasXmmNzpzLvSovBlmTV5lNKO6Z0LZ+rZfkLETsoNOQG68/gX0xXI3/CD4+9LBZ5hxHsfbLj/R9hJ8Enu+fOKfoA8n/kIYom9mTjCzMCKNULzanW0FOmz0I3btrvCJlkwrywliyF9wn+s6HNtwzSav4317rmqpWRmW/VrBv+utAPTzFuJRaAUyoarbFo8FHSY1UAimTe42cbX5jJsf0LvNAsJPUiCi11Y7UNvnQ9hR5utmINVZ+X5Sbj63hTPn9QfTDAR0lWcgfrvwo+sP6I4eXRn3ldFr4gj6r7C/cFS/BPz6uOiGZeVMPc4C+NzmL2citrQFaGSZE3TQ5G6SpHOb/OmWTFY3Fnm554qddqUX7RT78aRo47KgRTCoMa+dtrDgQ+ZsB20unV4Kvgz85djoxw6B0rWbql1FnLP2/cU9dM0eiXePa2HWsl8RWPZpyhlJtlYM1YP8iXMWjroc64cv4G+J1YWPEJ7ZOosFab4HuRBr/bA74OX1YLEAw7EORDQaI4n5HPVbabps23weeLOWKuRxbbVp8BfbESTyr0V5RWVqEC3wiXVK4XVO8udU60lEjqdAH+kaSQv3OXI4KvMFvsKCgeuqMorAtthkvdaK4GN0sdUdjYV+5lGO4MgIoRXqax57N1by6zqxG1TKjc5ay/Gdw/oz3vC5H+wcSabisAx6XerOUffCf4smH9wu3on0Gv4sVLLbgOiC2d03yZVpy7PJ4iLy3o8aHV4qE5GEWlZbKXs+udP16Ea95e5JXu611+JscqFWYl/vk0oGaAjyH0vFkI8OKRmde4yRpLIlQLdEu+uSgip5C5hlnNyF/zYkMl5WuLfZ5DxdyCymXYNO8vtt2xiJ70oEbp1cYa/Ch6Fkqewa9c8FWz51kVdjiszAuXybngLWsl5tJYtx2+XKOe3dvhOhN6vtg/ZIJfGbyg/VqrM8tpVf5KStvHPVbuq4imRVkr8P4HCn32XNdK8MtZhTaLXpX9EuBynZMq5PIy/GzmDIjpYQK9VnSbKyvFg0hftcTeFEA6h613OBnUpPdTS060nE7mZNeJ2E4tKlzgYlewk/E5w30LCy/oItdWqiWHbRkHjiXRvlpAVD2Uv24xtxzR5e4qyRWNpaUKLbmMzjQuB+9X0rqYTIaywwt4HfzdNQsZTOViFSVY8Er17urD3NHKAKx86kkZ8eXHF7pwhdXsyjWopWvMfgX7A5fFLRZOFg6Ht38EKcmxN4LmIqpoLzC/D36xhMQMudgpWFVjKpbqxR3nclmgcsYwXJS/ls540IFOy85/cfosZYBklcIVfixWseWd0U8r/tNsW/cF6tu+egOX3BWskSNvYX/J3TvoXr2UZOlkSLnWwub4AviVw+hr3NaIJYjy3WxvdbS0Yo37UjieptlIZnazTOOg/H1pnMrOjx/XstsAv1jbD7k7iNmY3vqO9ueOzht5ONfr9bonlbx5usjjepFW4b0ris1/O/jJG+cg2OD3200zsy8v8LHqLw+zZnWCTr+wDht7NvW7hjDf8aLc6QNUjsWb37lr4iTT09o3zkFgtjx+0NEiN9i37Iv+YRxY8Vi52vLfW6g935CJEelHQU/1oso1II3ru+fivjtOw3g6nz/H8X7snoQ5ZfbCE8+KHvlpP5IZWDe7p+QzuantRsf+WGum7cvaq+a8zw2JY79IJ0T0Dlvq2VTr7qeFADmy4biNvbTzH8Xww+G8eOR0HkLaBF1YLd6Vx1U8TAHX0Dt4rHzHxNPTp+mdxpTN9q7XV+V1H9uHhCAWXJUXEwZ9eDpuRJeZ3Bq3Vb80HEXQZ/XIbmIyt0gxxs4curlQyMou1H13Jry9s1erV6GyxcYrvZxm7lTS/roxIBr6PRMNj79odW1MgFUVsp1cpZef2PmHYaRHBvRIXZKzleeaUBGL8sX8xTli2DRbEfh+Q2C9jP2lVGxeOmWLxcw61jYPiB6jHZWqJhaIYsvieAKxNo5/iBLA62NQOr1HwlHQqyPkvViWPqpr9bzb7RbVOKTmgvLe3FEZNgOl21ycvLipOd4An2YZrhob43zpncycr+Jx86LAriJheBINnYkTU8FqhRdWq4uoSvMpXJmaKqR8dEDf6VM+FO5ZTaU3UfYwZsYsd5tgJa5iLBfF5xW/B/18A/xeTs3eMcgm9NaK43IevpyPP8IYIMsaW5tF7fFFWXYBfp35n4vTsQY6uoS25srC15k4U2I0F1P4655Hv5rwxrLTw36+YWRXi3cZg1y55J2irHLH6s9TI7ObpvF0kicKMS9o59JGouoCt7wpHVhbZEhNnThcwtgf3abyCJtuGj/H+xR2ovZC3jT9S1YIpl/0JvQNbjPBKy+eCKzXPZzKTO4ElOWbLET7ZvF+TLuQdP17m4DGMaQZgAek6PpGBP/9aEb25eZDM4qPEkdtyRWTphbId8PJOL3sT1HTh/OAzEQqljbDj6VK9Rrt9y6RIt3wsvA8JV3uPYqkuuD3caEw/oD/VAcT/qlZ3QtLlYYLqTNvAgK2R/JaQ58K5Nc1d/6AvyN2P07i5BBD9HOB9Elvg9NxzbsorBaZ0B/dh6f8AX/XNYmT2WZMgfk/D3hYY3xTnF9T5s6JqwoAGvr7VrCZ5brqT0/lPipcvStyuYYn6tL1Qov1qFXxBmhAdRX4M7xEoVCl7nr9VNLF89PEpf66SN3Y6xaYapa+vcxFSCp8kmH06Kzv3PqtbLx8VTV/23P7dXn+gibuRqOqo2D+vyY60yBTZTBC+PuLql0omlSc7Lgd1dSWt1iqopWmysjB1vbhHJlqzExNM2VWZSzNufG5mRhRLfO7FU2jW9AbDlNjG6e9Hf/vjVzwwqz2ICpeFYuUjPzqeN1LlteB9Ohcyzr4wLxkPItOno7SYWjNizIZ7KGt0sPDfbjat+oV+LmR0F4RmrT6JLb4VJjIjJyPHhZxfgNWdN+LvqnqDaWxP7DsyR3D2HElfpOrXSWljUZvLfmtwIdnX4wtAJWxK0yAX8rFBnJZsClGdvRldiI1+OWrPgdZkK1Cn0QP4H3Aeqd4bBSMxTk1pwbWC+BPwFebPGzwRbxtBj9fLkmV/ybxVVuQK5UVqDOF9WqjqBVTWf7tivNLTL0tHoBfmEmXa/D1hJLgy8eUklo98H3wqcLgLPpFuVI86RWMfDR8ONMjgxInfLawyJQUUBubJPhlI3ewGeDbcS31p8rOFl2hfRZaApTm5mcH+BcTDYTLqP2zAp8ebS4Br8DP1apEPmeISzJspfxGPfhSvrOkJW34WtV9ASWLsGN5fSVyauELPE9mAPAF60K3Lc4vSjkKCtfK9tIN8HsJpdxaVMzDNEtVmhh4c655of4q5HowglKZBRkX4GMDrmZxqQX4udqJ1Dg4H2lkVX94sHjve+uJh5M8rIxQDr4B6FiV4SiOOtZsf9qRJA7ga4At8AWaBviyLk+1Br/pSeaX8s/STN8zYnGVVrhWoV2tFEuhsqst8AspC/veDT7Id1JNeS7BlztiehWO7pe74t9czJ1E+TRRUAoPQoZv7vwYyHACsf2u1XQAn1aXsCs2+JRaZoKPpt5sPRjgW6u1hb35zAl+7wJfPLA3BJUNfi9fUmmLagF+VYmi2IUC3xhpwfRicv4y+GjMnwOjZu8ZsD6rMEOmDhTcBz42Fhe2F+CjvVCY4MvYYb7mfLO2kVEVrbDK31RrmV8YMFNR5XKuJrgAv5dmrd5ftOZ8rEapFQdxvsrJLcReLlXzvVm17tXrzlU5L1HDVJWXEmpgb+oaowYLrl+ATyYKfSgdG69smW9o48pQzKW5VeqJwl2u6CzAF48qr6VhSZnzqyH/o+qJkZTMv8gGzMz+i9bObHV+ot6V8RuPDr1X5b/C3TkkCD52DBFbgs9VarfZyn4Nfm7BXFnb4iSUohjUI1MTORuvfGn9a/Bp0+hcDElXhBN2GYJfYUmLSoNf6NlFiz9VVV0tm7n8pQQeNOq1v1VnWuS8cNArgd+rMnEL8Avp9Qgnq6m4UUJqAb652b40l7xwj3ORq5ow5Sb4ymItZkmBEBZKioliqgb4VHZBPDtXE1C01wBfjIz9pt8E/uzO1nq9Za+mNcGXxeCs8ILpk0s7RO7LL5x2fmNsuzdcsdJUxw84f9642Yi/6EVGeQq10G/u+zFLKBD4QiOZ4NMYNrOVQA99L7xgerrkulLxQHOtyuPHD3F7n+RhZTmLDkSIdrIV6uQCCtZcyIYTC4WlWqQr1Nq5ykErl4rQWG4tc8ctvVcTX9kbJlJJCrIRjp0+zIBSUuCvSh/CVTTi2RfRDCqlX6rJW8hzbHr4dz7UC4dI79V7l/PnwPw3DPbocwuYcULELnNnK6S8kcX31oKckWR82fOSJw+6WO3Z06Lfe7gcrs4GTOz2ZPxTnx/BRIEXvO3t25X1J57/Mt93zL/dfDoNYuAsns/HEkvoA49vWcS6HZKHfXzQIZqDOknT+KhO11R/4cGc65M/h9W/H8sDOtWP7FvWEwbrweo31uGe8svFSaHzs91dwH/NXxiv+vg4vAE+5YRntONwIHNTHXuOZuYnugD+rb6l+PEP5//ui2o5tqBbcdGqzWrz4CasK3jsWIsZ4/z5yP45Cfp18FPcY/4JEl66tVnrqcVELLpG2ST7wP9zBvqL1ydl6qB29eaDClgqM9M8/i1ktFFlh7PF6ET1hK44mT+LL2L9b6w/2DSbJPGSJN5FMj+P6F8kmWnmr9Rb7faK/u6si7MI6zBhV3ryfBo8IEUeo4LOLseSJPv2Jv6R+TuvUGWaHaYO0Y09mYCZoq8b3rn6O6DDtNhBCbTpwZkpnufFYhcj8+I2odyq8NR1uEuAjubqMG03Ean/SOKLbOlz13V3QQKfgCQVlhbzUt+PPUo/N0hCIvHkU4BEJL2fj10nX9RNNknSxkRymhYkXsBpXw3zEl+QjEOHlh1jZ348Ekkq3BwioS4NI3SJaLAt6noplqBmyaCywmsh5Sl/6jDqpXM8QUIzPt4Lt96DBy5mKaOUuFtNqem0BAad8VpckhknMGujWyKOeNUkX0ByJxK4M4JpK+r5e2l0w2MDbzc6fn0KyQWkiZneyEBjLK0lSQ3v7YaJSFosDu3dyEf/ZJ6PCkySYPIF/AgtDIYkVNUDc5gyagydvznisERI8kURRujSHTglwzchCXVpovZ6o9oSdRheQJ+xk3KcBuLyWoaTh4OK8YtYA96Ipzkjk7EHnI814HG63GIGzfZjH5EGroVu1rcbFWVukaStI0S0zdrEx098uqNWR63FDhYJjEQcA8IYZmJAkt0C8CcQYhi2Fug8lt5qQXIEHNvMh7fzUzcm8MrMb/EGHkgSx9Cd9My/WHKD3/kjn8IAB6XG3NUASfykzZB5vg0xkkSjKLoCJJhgn0CXojZuqUs/eIAkmRL03f6Ns0cWEH98pzH7JllfWfby+pJWP9wCo4ekTnfAXscsDDcGVCTrB+AWQKsxBReX5zFCHQF3gUSaOg6Ap14MKjzEwpLg2wHJDXrsZ4z52KYJWL8NgO0jOs5CHMXbYo+TDMbLh7n5BV2vYy8ga7irE0mCJdBvHkvQcMY6oBFILFGcO6bTjmAkUbdB6wLf60IwNfApxMEcbD48kgcHG9oLbwtgGA4kFfzA84nEy7wzbsuhJY+o/YldEuIY00DYvpJQJ5pwmc+QnYe/KTMH55x53ucXF4XdI72igrgAywUbG6Sh6QxFNfQjvHuBEGwMcMN6qPx85jBoLPboyC2a7rEkScDDrgMqYAiz8ZxqEsYSGjH4DnDzfaAFUXzgIW5DQv8j5SwUg0rHL4Awg0fQMXadJ0mwCHEAYotIgBWgdVhcq+v+84C6BdMHfJycMP2ORILnN+BYhfwAwhBnLsba2RgCyUF2KRVdovZ2pxDbt8/UPKgdh+z+Y7zrdEAMKBy/m3QjhdlqmU54P30OTIihDX+CBpOxMa4xHY4NA8hOOt2sJgQApM9ODkccsY7/nR0nRQJ83p05wM46MRwJMPEIwzF9P7AASaDNNTAnIPBdkrQeklwY2ACj5x1IpEVsOMC400HtLLhFQRTcgQRoBhqNhAZ1gnE/Eo44YlGMn34MXxOSnBNRPhpZg5gMhiPAcccujUdqb0o59GyIpaiAaRezbo+TpUr2omGjEkcohg9iZ7KM0OCmYvukOfXZHhsmLQwQ6IYTqEPGWnEO1C3y09QXJ3JFyUg2A05sZJxYHFcEjBcQCbyhbsV53yCEYe4H4HxTbe0It8DEYgYib/MQMx1TxuigC5hDB5BabRzEhAkn3gboa5RV4B9iHtKEitxPkCRKJno/vqlGQeRngEhw71CR13EaSNNbkrSok2IQSm0suxQHqfT/s/QkSKK9tVnmmjqBTNUnVWumhQuDiNLFA1+KHrAKPR3wnLbt/BDjEQnqIpo5pNFIMfqZDxwPzAg/JxI0ogBF0KyRj//DPoKBCnoShc0UZwmeFSU8ECKBVh6AIZIElColLwY3eGDKvwmSzAfdmaHurGOpyPnRy5L6v1roFyOS1idzgDSwJBk8UN23mn3Q1AGjBhU+qVeyGITuQnMA9yZj5BFIsEutMCqwS2hq7QusHcIuVtmwmrFFF/17aETcMG/QU1MDDLpaJZVviR1ljoIx13r3AWYObX35xB2Mt7amXYuoQL8mPPW+xf1cwtxjYO4FyrDE0QGT8HD3Wj9gohgEQHoHVSdtKeBPhB4kvdcCPw54wCmKxhFIWjJfpEk4TWgStgkILzIaWyTBDElB0uJJ5AMYn0mdoKABPgOSb7h7Nst8aQije0AkMFDjz/hGB5h/wy5l7Uxy3mtpnuWxcJES9sKrDai45mRqBpLV59Q6vQyP73CrFia8DVRKYMjiFAA70FNmaAI40Xbd89QdjrhBibwumE+BJvElCaiLQyeG804kyezoSJcqHIEkJJLjgUjEGcn4IukvHU6yMRwMEVyVSMS6xKcXtMq/Y6Ei6XDLMoNB6ESQUJBgRt+xo6RiZNtRkIj2Bq3fAgkMIJt2O1l/HXGMFfyYkfYBnBbyVtcY5GovOlgJx7+Rv1Vr7MHdnf5vhxe6PVbH/9CL1rEFtDhwU24t12ppqcRzgJ+y/wDHUftbmDweSf9gK7Amw1X6kxGzis1rSWLEymySxCCWQbd4/fhYB8rWJIkiTPQXifni2PHAJLFJ3F3SfybJ7lJ0HRmYKLAoERNsFCF9jXIXpDejmyypfPZIvt1og8T0J6T8SyHlI4XB0pSCVqNe0AoMYPG0IHTmR5HRBgJRkk+PQ8r/mlfySki50zal2ND5FxhlgdeZsjDknl6f6XQ4f7tcDP9v/rSsO42a+REAAAAASUVORK5CYII=';

function readexFace(){
  var B = appUrl() + 'vendor/fonts/readex-pro/readex-pro-', ar = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC', la = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  return [400, 600, 700].map(function(w){ return ['arabic', 'latin'].map(function(sub){ return '@font-face{font-family:"Readex Pro";font-style:normal;font-display:swap;font-weight:' + w + ';src:url(' + B + sub + '-' + w + '-normal.woff2) format("woff2");unicode-range:' + (sub === 'arabic' ? ar : la) + '}'; }).join(''); }).join('');
}
function mfuPrintHtml(R, F){
  var e = function(v){ return esc(v == null ? '' : String(v)); };
  var tbl = function(head, rows){ return '<table><thead><tr>' + head.map(function(h){ return '<th>' + e(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + (rows.length ? rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + e(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + head.length + '">—</td></tr>') + '</tbody></table>'; };
  var FF = '"Abar Mid","Readex Pro","Segoe UI",Tahoma,Arial,sans-serif';
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + e(mfuFileName('pdf')) + '</title>'
    + '<style>' + readexFace() + '</style>'
    + '<style>' + fontsFace(F) + '@page{size:A4 landscape;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}'
    + 'body{font-family:' + FF + ';color:#163E35;background:#FBF7F4;margin:0}'
    + '.pg{position:relative;width:297mm;min-height:210mm;padding:14mm 16mm 18mm;page-break-after:always;background:#FBF7F4}'
    + '.cover{background:#F6EDE3;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}'
    + '.cover .logo{position:absolute;top:12mm;right:16mm;height:22mm}'
    + '.cover h1{font-size:40pt;margin:0 0 4mm;color:#000;font-weight:700}.cover h2{font-size:20pt;color:#D7A562;margin:0 0 3mm;font-weight:400}.cover p{color:#D7A562;font-size:12pt;margin:1mm 0}'
    + 'h3{color:#D7A562;font-size:22pt;margin:0 0 6mm;text-align:right;font-weight:700}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5pt;background:#fff}th{background:#163E35;color:#fff;padding:2.2mm;text-align:right;font-weight:600}td{border-bottom:1px solid #E6DED4;padding:1.8mm 2.2mm}tr:nth-child(even) td{background:#FAF6F3}'
    + '.ft{position:absolute;bottom:8mm;left:16mm;right:16mm;display:flex;justify-content:space-between;color:#D7A562;font-size:8.5pt}'
    + '.end{background:#000;display:flex;align-items:center;justify-content:center}.end h1{color:#D7A562;font-size:54pt;margin:0}.end .logo{position:absolute;top:12mm;right:16mm;height:22mm;filter:brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(5deg)}'
    + '</style></head><body>'
    + '<div class="pg cover"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>التقدم في الأعمال — بطاقة نسك</h1><h2>مركز معلومات الحج والعمرة</h2><p>' + e(R.hijri) + ' · ' + e(R.greg) + '</p>'
    + '<div class="ft"><span>' + e(R.greg) + '</span><span>haj.gov.sa</span></div></div>'
    + MFU.sections.map(function(sc, i){ return '<div class="pg"><h3>' + e(mfuSecTitle(R, sc)) + '</h3>' + tbl(sc[2], mfuRowsOf(R, sc[0]))
        + '<div class="ft"><span>' + e(R.greg) + ' \u00b7 ' + (i + 2) + '</span><span>haj.gov.sa \u00b7 صدر من نظام قارئات أفاقي ' + e(R.ver) + '</span></div></div>'; }).join('')
    + '<div class="pg end"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>شكرًا</h1></div>'
    + '</body></html>';
}
function mfuPdf(){
  var R0 = mfuReport(); if (!expGate('PDF', mfuReportCheck(R0))) return false;
  var win = null;
  try { win = window.open('', '_blank'); } catch (e){ win = null; }
  var go = function(F){
    var html = mfuPrintHtml(R0, F);
    var doPrint = function(w){ var p = function(){ try { w.focus(); w.print(); } catch (e){ LS_ERR = e; } };
      try { if (w.document && w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(function(){ setTimeout(p, 150); }); else setTimeout(p, 350); } catch (e){ setTimeout(p, 350); } };
    if (win && win.document){ win.document.open(); win.document.write(html); win.document.close(); doPrint(win); }
    else {
      var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;inset-inline-start:-9999px'; document.body.appendChild(fr);
      fr.srcdoc = html; fr.onload = function(){ doPrint(fr.contentWindow); setTimeout(function(){ fr.remove(); }, 60000); };
    }
    return html.length;
  };
  logEvent('تصديرُ التحديث الأسبوعي — PDF', ''); toast(t('اختر «حفظ كـ PDF» في نافذة الطباعة'));
  if (CFG.fonts && CFG.fonts.r) return go(CFG.fonts);
  fontsLoad().then(go);
  return true;
}
function zipMany(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  files.forEach(function(f){
    var nb = enc.encode(f.name), bytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data, cr = crc32(bytes);
    var lf = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(cr), u32(bytes.length), u32(bytes.length), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lf), nb, bytes);
    central.push({ nb:nb, cr:cr, len:bytes.length, off:off });
    off += lf.length + nb.length + bytes.length;
  });
  var cdStart = off, cd = [];
  central.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(c.cr), u32(c.len), u32(c.len), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); cd.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  var end = new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(central.length), u16(central.length), u32(off - cdStart), u32(cdStart), u16(0)));
  var all = parts.concat(cd, [end]), n = 0; all.forEach(function(p){ n += p.length; });
  var out = new Uint8Array(n), p0 = 0; all.forEach(function(p){ out.set(p, p0); p0 += p.length; });
  return out;
}
function mfuDocxXml(R){
  var x = function(v){ return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var run = function(txt, o){ o = o || {}; return '<w:r><w:rPr><w:rFonts w:ascii="Alexandria" w:hAnsi="Alexandria" w:cs="Alexandria"/>' + (o.b ? '<w:b/><w:bCs/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + (o.sz || 20) + '"/><w:szCs w:val="' + (o.sz || 20) + '"/><w:rtl/></w:rPr><w:t xml:space="preserve">' + x(txt) + '</w:t></w:r>'; };
  var para = function(txt, o){ o = o || {}; return '<w:p><w:pPr><w:bidi/><w:spacing w:after="' + (o.after == null ? 120 : o.after) + '"/><w:jc w:val="' + (o.jc || 'right') + '"/></w:pPr>' + run(txt, o) + '</w:p>'; };
  var cell = function(txt, head, w){ return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (head ? '<w:shd w:val="clear" w:color="auto" w:fill="163E35"/>' : '') + '</w:tcPr><w:p><w:pPr><w:bidi/><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr>' + run(txt, head ? { b:1, c:'FFFFFF', sz:18 } : { sz:18 }) + '</w:p></w:tc>'; };
  var table = function(head, rows){
    var W = 14400, w = Math.floor(W / head.length);
    var b = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D6A561"/><w:bottom w:val="single" w:sz="4" w:color="D6A561"/><w:insideH w:val="single" w:sz="2" w:color="E0E0E0"/></w:tblBorders>';
    return '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="' + W + '" w:type="dxa"/>' + b + '</w:tblPr><w:tblGrid>' + head.map(function(){ return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>'
      + '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + head.map(function(h){ return cell(h, true, w); }).join('') + '</w:tr>'
      + (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r){ return '<w:tr>' + r.map(function(c){ return cell(c, false, w); }).join('') + '</w:tr>'; }).join('') + '</w:tbl>';
  };
  var body = para('التحديث الدوري — مسار القارئات', { b:1, sz:48, c:'163E35', jc:'center', after:80 })
    + para('مشروع بطاقة نسك', { sz:30, c:'C8943E', jc:'center', after:60 })
    + para(R.hijri + ' — ' + R.greg, { sz:22, c:'86432B', jc:'center', after:360 })
    + MFU.sections.map(function(sc){ return para(mfuSecTitle(R, sc), { b:1, sz:30, c:'C8943E', after:80 }) + table(sc[2], mfuRowsOf(R, sc[0])) + para('', { after:200 }); }).join('')
    + para('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:16, c:'7F8C8D' });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body
    + '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>';
}
function mfuDocx(){
  try { return mfuDocx0(); } catch (e){ softErr('docx', e, ''); toast(t('تعذّر التصدير')); return false; }
}

EXP.chk = null;
function expDigits(v){ return String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 1632); }).replace(/[\u06F0-\u06F9]/g, function(d){ return String(d.charCodeAt(0) - 1776); }); }
function expBadText(v){ var x = String(v == null ? '' : v); var m = x.match(/\bNaN\b|\bundefined\b|\[object [A-Za-z]+\]|\bInfinity\b|\{\{[A-Z]+\}\}|\uFFFD/); return m ? m[0] : ''; }
function mfuReportCheck(R){
  var iss = [];
  (R.kpis || []).forEach(function(k){ var b = expBadText(k[1]) || expBadText(k[2]); if (b) iss.push(t('المؤشر') + ' «' + k[0] + '»: ' + b); });
  MFU.sections.forEach(function(sc){
    var head = sc[2], rows = mfuRowsOf(R, sc[0]) || [];
    rows.forEach(function(r, i){
      if (!Array.isArray(r)){ iss.push(sc[1] + ' — ' + t('صفٌّ غيرُ صالح')); return; }
      if (r.length !== head.length) iss.push(sc[1] + ' — ' + t('الصفّ') + ' ' + (i + 1) + ': ' + r.length + ' ' + t('خانة والأعمدةُ') + ' ' + head.length);
      r.forEach(function(c, j){
        var b = expBadText(c); if (b) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('في الصفّ') + ' ' + (i + 1) + ': ' + b);
        var cs = expDigits(c); if (/^\s*-?[\d.]+\s*[\u066A%]\s*$/.test(cs)){ var n = parseFloat(cs); if (isFinite(n) && (n < 0 || n > 100)) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('نسبةٌ خارج المدى') + ': ' + c); }
      });
    });
  });

  (R.cos || []).forEach(function(r, i){ var n = +expDigits(r[2]), a = +expDigits(r[3]), b = +expDigits(r[4]), p = parseFloat(expDigits(r[6]));
    if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('المخيمات لا تساوي الممسوح والمتبقي'));
    if (isFinite(n) && n > 0 && isFinite(p) && Math.abs(p - Math.round(a / n * 100)) > 1) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('نسبة المسح لا تطابق الممسوح'));
  });
  (R.svd || []).forEach(function(r){ var n = +r[2], a = +r[3], b = +r[4]; if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('المسح الميداني') + ' — ' + r[0] + ' · ' + r[1] + ': ' + t('الإجمالي لا يساوي الممسوح والمتبقي')); });
  (R.jmr || []).forEach(function(r){ var n = +r[1], a = +r[2], b = +r[3], c = +r[4]; if ([n, a, b, c].every(isFinite) && n !== a + b + c) iss.push(t('منشأة الجمرات') + ' — ' + r[0] + ': ' + t('النقاط لا تساوي المؤكَّدة وما تحتاج زيارةً أخرى وغيرَ المزورة')); });
  if (R.sv && R.svz){ var zt = 0; R.svz.forEach(function(r){ zt += +r[1] || 0; }); if (zt !== R.sv.O.tot) iss.push(t('المسح الميداني') + ': ' + t('مجموع المشاعر لا يساوي الإجمالي')); }
  return iss;
}
function pptxCheck(out){
  var iss = [], dec = new TextDecoder(), W = 12192000 + 25000, H = 6858000 + 25000, P = (typeof DOMParser === 'function') ? new DOMParser() : null;
  out.forEach(function(e){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return;
    var x = e.text != null ? e.text : dec.decode(e.raw), sn = e.name.replace(/^.*slide(\d+)\.xml$/, '$1');
    if (P && P.parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('بناءٌ غيرُ سليم'));
    (x.match(/<a:t>[^<]*<\/a:t>/g) || []).forEach(function(tt){ var b = expBadText(tt.slice(5, -6)); if (b) iss.push(t('الشريحة') + ' ' + sn + ': «' + tt.slice(5, -6).slice(0, 40) + '»'); });
    x.replace(/<a:off x="(\d+)" y="(\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/g, function(m, a, b, c, d){ if (+a + +c > W || +b + +d > H) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('عنصرٌ خارج حدود الشريحة')); return m; });
  });
  return iss;
}
function expGate(kind, iss){
  EXP.chk = { kind:kind, at:Date.now(), n:iss.length, issues:iss.slice(0, 25) };
  if (!iss.length) return true;
  logEvent('تصديرٌ أوقفه فحصُ الملف — ' + kind + ' · ' + iss.length + ' خطأ', '');
  toast(t('أُوقف التصدير: في الملف') + ' ' + nm(iss.length) + ' ' + t('خطأ — التفاصيلُ فوق أزرار التصدير'));
  try { render(1); } catch (e){ LS_ERR = e; }
  return false;
}
function mfuDocx0(){
  var R = mfuReport();
  if (!expGate('وورد', mfuReportCheck(R))) return false;
  var files = [
    { name:'[Content_Types].xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name:'_rels/.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name:'word/document.xml', data:mfuDocxXml(R) }];
  var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), mfuFileName('docx'));
  if (ok){ logEvent('تصديرُ التحديث الأسبوعي — وورد', ''); toast(t('صُدّر ملفُّ وورد')); }
  return ok;
}

EXP.pptxTpl = null;
function pptxTemplate(){
  if (EXP.pptxTpl) return Promise.resolve(EXP.pptxTpl);
  return fetch('templates/ministry-unified.pptx').then(   function(r){ if (!r.ok) throw new Error('tpl ' + r.status); return r.arrayBuffer(); })
    .then(function(b){ EXP.pptxTpl = new Uint8Array(b); return EXP.pptxTpl; });
}
function ooxRead(u8){

  var g16 = function(o){ return u8[o] | (u8[o + 1] << 8); }, g32 = function(o){ return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0; };
  var e = u8.length - 22;
  while (e >= 0 && g32(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip');
  var n = g16(e + 10), p = g32(e + 16), out = [], dec = new TextDecoder();
  for (var i = 0; i < n; i++){
    var method = g16(p + 10), crc = g32(p + 16), cs = g32(p + 20), us = g32(p + 24), nl = g16(p + 28), xl = g16(p + 30), cl = g16(p + 32), lo = g32(p + 42);
    var name = dec.decode(u8.subarray(p + 46, p + 46 + nl)), ds = lo + 30 + g16(lo + 26) + g16(lo + 28);
    out.push({ name:name, method:method, crc:crc, csize:cs, usize:us, raw:u8.subarray(ds, ds + cs) });
    p += 46 + nl + xl + cl;
  }
  return out;
}

function ooxWrite(entries){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  entries.forEach(function(f){
    var nb = enc.encode(f.name), raw, method, crc, cs, us;
    if (f.text != null){ raw = enc.encode(f.text); method = 0; crc = crc32(raw); cs = us = raw.length; }
    else { raw = f.raw; method = f.method; crc = f.crc; cs = f.csize; us = f.usize; }
    var lh = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(method), u16(0), u16(0), u32(crc), u32(cs), u32(us), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lh), nb, raw); cen.push({ nb:nb, method:method, crc:crc, cs:cs, us:us, off:off }); off += lh.length + nb.length + raw.length;
  });
  var cd0 = off;
  cen.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(c.method), u16(0), u16(0), u32(c.crc), u32(c.cs), u32(c.us), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); parts.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  parts.push(new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(cen.length), u16(cen.length), u32(off - cd0), u32(cd0), u16(0))));
  var size = 0; parts.forEach(function(q){ size += q.length; });
  var out = new Uint8Array(size), at = 0; parts.forEach(function(q){ out.set(q, at); at += q.length; });
  return out;
}

var PX_ID = 1000;
function pxE(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pxRun(txt, o){ o = o || {}; return '<a:r><a:rPr lang="ar-SA" sz="' + (o.sz || 1600) + '"' + (o.b ? ' b="1"' : '') + ' dirty="0"><a:solidFill><a:srgbClr val="' + (o.c || '163E35') + '"/></a:solidFill><a:latin typeface="Abar Mid"/><a:ea typeface="Abar Mid"/><a:cs typeface="Abar Mid"/></a:rPr><a:t>' + pxE(txt) + '</a:t></a:r>'; }
function pxP(txt, o){ o = o || {}; return '<a:p><a:pPr algn="' + (o.al || 'r') + '" rtl="1"/>' + pxRun(txt, o) + '</a:p>'; }
function pxBox(x, y, w, h, paras, o){
  o = o || {}; var id = ++PX_ID;
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Box ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="' + (o.geom || 'roundRect') + '"><a:avLst/></a:prstGeom>'
    + (o.fill ? '<a:solidFill><a:srgbClr val="' + o.fill + '"/></a:solidFill>' : '<a:noFill/>')
    + (o.line ? '<a:ln w="' + (o.lw || 12700) + '"><a:solidFill><a:srgbClr val="' + o.line + '"/></a:solidFill></a:ln>' : '<a:ln><a:noFill/></a:ln>')
    + '</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="' + (o.anchor || 'ctr') + '" rtlCol="1"><a:normAutofit/></a:bodyPr><a:lstStyle/>' + (paras || '<a:p><a:endParaRPr lang="ar-SA"/></a:p>') + '</p:txBody></p:sp>';
}
function pxTable(x, y, w, head, rows, o){
  o = o || {}; var id = ++PX_ID, wt = o.cols || head.map(function(){ return 1; }), sw = wt.reduce(function(a, b){ return a + b; }, 0), rh = o.rh || 520000;
  var cw = wt.map(function(k){ return Math.floor(w * k / sw); });
  var cell = function(v, hd, i){ var t0 = v && typeof v === 'object' ? v.t : v, c = hd ? 'FFFFFF' : (v && v.c) || '163E35', bg = hd ? (o.hf || '163E35') : (v && v.bg) || (i % 2 ? 'FAF6F3' : 'FFFFFF');
    return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>' + pxP(t0, { sz:hd ? (o.hsz || 1500) : (o.sz || 1400), b:hd || (v && v.b), c:c }) + '</a:txBody><a:tcPr marL="91440" marR="91440" marT="45720" marB="45720" anchor="ctr"><a:lnB w="6350"><a:solidFill><a:srgbClr val="E0E0E0"/></a:solidFill></a:lnB><a:solidFill><a:srgbClr val="' + bg + '"/></a:solidFill></a:tcPr></a:tc>'; };
  var body = (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r, i){ return '<a:tr h="' + rh + '">' + r.map(function(v){ return cell(v, false, i); }).join('') + '</a:tr>'; }).join('');
  return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="Table ' + id + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
    + '<p:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + (rh * ((rows.length || 1) + 1)) + '"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr rtl="1" firstRow="1" bandRow="1"/><a:tblGrid>'
    + cw.map(function(c){ return '<a:gridCol w="' + c + '"/>'; }).join('') + '</a:tblGrid><a:tr h="' + rh + '">' + head.map(function(h){ return cell(h, true, 0); }).join('') + '</a:tr>' + body + '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}
var PX = { X0:1100000, W:16100000, Y0:1850000 };

var PX_K = 12192000 / 18288000;
function pxScale(xml, k){
  var sc = function(v){ return Math.round(+v * k); };
  return String(xml)
    .replace(/<a:(off|chOff) x="(\d+)" y="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' x="' + sc(x) + '" y="' + sc(y) + '"'; })
    .replace(/<a:(ext|chExt) cx="(\d+)" cy="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' cx="' + sc(x) + '" cy="' + sc(y) + '"'; })
    .replace(/<a:gridCol w="(\d+)"/g, function(m, w){ return '<a:gridCol w="' + sc(w) + '"'; })
    .replace(/<a:tr h="(\d+)"/g, function(m, h){ return '<a:tr h="' + sc(h) + '"'; })
    .replace(/ sz="(\d+)"/g, function(m, z){ return ' sz="' + Math.max(800, Math.round(+z * k / 50) * 50) + '"'; })
    .replace(/ (marL|marR|marT|marB)="(\d+)"/g, function(m, a, v){ return ' ' + a + '="' + sc(v) + '"'; });
}
function pxLvl(p){ p = parseInt(p, 10) || 0; return p >= 75 ? { c:'1E8449', bg:'E8F6EE' } : p >= 40 ? { c:'8A6D0B', bg:'FDF3D9' } : { c:'A93226', bg:'FBE7E4' }; }
function pxCards(items, y, h){
  var n = items.length, gap = 220000, w = (PX.W - gap * (n - 1)) / n;
  return items.map(function(it, i){ var x = PX.X0 + PX.W - (i + 1) * w - i * gap;
    return pxBox(x, y, w, h, pxP(it[0], { sz:1500, b:1, c:'C8943E' }) + pxP(it[1], { sz:it[4] || 3600, b:1, c:it[3] || '163E35' }) + (it[2] ? pxP(it[2], { sz:1200, c:'7F8C8D' }) : ''), { fill:'FAF6F3', line:'D6A561' }); }).join('');
}
function mfuSlides(R){
  var dl = function(k){ return k == null ? '' : (k > 0 ? '▲ +' + k : k < 0 ? '▼ ' + k : '=') + ' عن الأسبوع الماضي'; };
  var K = R.kpis, S = [];
  S.push(['ملخص مسار القارئات', pxCards(K.slice(0, 4).map(function(k){ return [k[0], k[1], [k[2], dl(k[3])].filter(Boolean).join(' · ')]; }), PX.Y0, 2600000)
    + pxCards(K.slice(4).map(function(k){ return [k[0], k[1], '']; }), PX.Y0 + 3000000, 2200000)
    + (R.upd.length ? pxTable(PX.X0, PX.Y0 + 5450000, PX.W, ['متى', 'النوع', 'البند', R.updTitle && /اجتماع/.test(R.updTitle) ? 'ما تغيّر منذ آخر اجتماع' : 'آخر التحديثات هذا الأسبوع', 'بواسطة'], R.upd.slice(0, 5).map(function(u){ return [u[0], u[1], u[2], u[3], u[4]]; }), { cols:[1, 1.1, 3, 4.2, 1.3], rh:340000, sz:1000, hsz:1100 })
       : pxBox(PX.X0, PX.Y0 + 5500000, PX.W, 700000, pxP('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:1300, c:'7F8C8D' }), { geom:'rect' }))]);

  var SV = R.sv || svStats(), so = SV.O, pcv = function(v){ var n = parseInt(v, 10) || 0; return { t:String(v), c:pxLvl(n).c, bg:pxLvl(n).bg, b:1 }; };
  S.push(['المسح الميداني — نظرة عامة', pxCards([['نسبة الزيارة', SV.pct + '٪', so.sv + ' من ' + so.tot, '1E8449'], ['تمت الزيارة', String(so.sv), 'نقطة', '163E35'], ['المتبقي', String(so.tot - so.sv), 'نقطة لم تُمسح بعد', '8A6D0B'], ['فيها تحديات', String(so.chal), 'من الممسوحة', 'A93226'], ['تحتاج زيارة أخرى', String(so.unreach), 'تحتاج زيارةً أخرى', 'A93226']], PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى'], SV.zones.map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], pcv(r[4]), r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', r[6] ? { t:String(r[6]), c:'A93226' } : '0']; }), { cols:[2.2, 1, 1, 1, 1, 1.2, 1.2], rh:600000, sz:1500, hsz:1500 })]);
  S.push(['المسح الميداني — المشعر والنوع', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ'], SV.detail.slice(0, 16).map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], r[4], pcv(r[5]), r[6] ? { t:String(r[6]), c:'A93226', b:1 } : '0', r[7]]; }), { cols:[1.3, 1.6, 0.9, 0.9, 0.9, 0.9, 1, 3.3], rh:470000, sz:1150, hsz:1200 })]);
  var JM = jmrConfirm(), jt = JM.tot;
  S.push(['منشأة الجمرات — تأكيد النقاط بالمسح', pxCards([['نسبة التأكيد', (jt.n ? Math.round(jt.ok / jt.n * 100) : 0) + '٪', jt.ok + ' من ' + jt.n, '1E8449'], ['مؤكَّدة بالمسح', String(jt.ok), 'وصلها المسح', '163E35'], ['لم تُزر', String(jt.no), 'تحتاج زيارة', '8A6D0B'], ['تحتاج زيارة أخرى', String(jt.un), 'تحتاج زيارة أخرى', 'A93226'], ['فيها تحديات', String(jt.ch), 'من المؤكَّدة', 'A93226']], PX.Y0, 1900000)
    + (JM.rows.length ? pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد'], JM.rows.map(function(r, i){ var last = i === JM.rows.length - 1; return [{ t:r[0], b:1 }, r[1], { t:String(r[2]), c:'1E8449', b:1 }, r[3] ? { t:String(r[3]), c:'A93226', b:1 } : '0', r[4] ? { t:String(r[4]), c:'8A6D0B', b:1 } : '0', r[5] ? { t:String(r[5]), c:'A93226' } : '0', last ? { t:r[6], b:1 } : pcv(r[6])]; }), { cols:[1.8, 1, 1.3, 1.2, 1, 1.2, 1.2], rh:560000, sz:1400, hsz:1400 })
       : pxBox(PX.X0, PX.Y0 + 2400000, PX.W, 700000, pxP('لا نقاطَ لمنشأة الجمرات في النطاق', { sz:1400, c:'7F8C8D' }), { geom:'rect' }))]);
  var stc = function(v){ return v === 'مكتمل' ? { t:v, c:'1E8449', b:1 } : v === 'متأخر' ? { t:v, c:'A93226', b:1 } : v === 'جارٍ' ? { t:v, c:'8A6D0B', b:1 } : v; };
  var stc2 = function(v){ v = String(v || ''); return /مكتمل/.test(v) ? { t:v, c:'1E8449', b:1 } : /متوقف|متأخر/.test(v) ? { t:v, c:'A93226', b:1 } : /جاري|جارٍ/.test(v) ? { t:v, c:'8A6D0B', b:1 } : v; };
  S.push(['حالة أبرز مهام مسار القارئات', pxTable(PX.X0, PX.Y0, PX.W, ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ'], R.tasks.slice(0, 11).map(function(r){ return [r[0], r[1] || '—', r[2] || '—', stc2(r[3]), r[4] || '—', r[5] || '—', r[6] ? (/^✓/.test(r[6]) ? { t:r[6], c:'1E8449', b:1 } : { t:r[6], c:'A93226' }) : '—']; }), { cols:[3, 1.2, 1.3, 1.3, 1.2, 2.6, 1.8], sz:1100, rh:560000 })]);
  var B4 = R.blocks, col4 = function(k, color, i){ var L = B4.filter(function(r){ return r[0] === k; }).slice(0, 7), gap = 180000, w = (PX.W - 3 * gap) / 4, x = PX.X0 + PX.W - (i + 1) * w - i * gap, y = PX.Y0 + 1750000;
      return pxBox(x, y, w, 520000, pxP(k + ' · ' + B4.filter(function(r){ return r[0] === k; }).length, { sz:1500, b:1, c:'FFFFFF', al:'ctr' }), { fill:color })
        + pxBox(x, y + 560000, w, 5300000, L.length ? L.map(function(r){ return pxP('• ' + r[1], { sz:1200, b:1, c:'163E35' }) + pxP(r[2], { sz:1000, c:'7F8C8D' }); }).join('') : pxP('—', { sz:1200, c:'7F8C8D', al:'ctr' }), { fill:'FAF6F3', line:'D6A561', anchor:'t' }); };
  var bk = R.blk || {}, dlt = (bk.done || 0) - (bk.doneLast || 0);
  S.push(['المســـار | القارئات', pxCards([['أُنجز هذا الأسبوع', String(bk.done || 0), (dlt > 0 ? '▲ +' : dlt < 0 ? '▼ ' : '') + dlt + ' عن الأسبوع الماضي', '1E8449'], ['مستحقٌّ خلال ٧ أيام', String(bk.next || 0), ''], ['متأخرة', String(bk.late || 0), '', 'A93226'], ['متوقفة أو بانتظار قرار', String(bk.wait || 0), '', '8A6D0B']].concat(bk.meet ? [['آخر اجتماع', dayKey(bk.meet.at), bk.meet.n + ' تغييرًا منذه', '163E35', 2200]] : []), PX.Y0, 1500000)
    + col4('أبرز الأعمال المنجزة', '27AE60', 0) + col4('أبرز المهام القادمة', 'C8943E', 1) + col4('الاعتمادات والدعم المطلوب', '1C3674', 2) + col4('المهام المتأخرة', 'C0392B', 3)]);
  S.push(['حالة التركيبات', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة'], R.inst.slice(0, 12).map(function(r){ var L = pxLvl(r[4]); return [r[0], r[1], r[2], r[3], { t:r[4], c:L.c, bg:L.bg, b:1 }]; }), { cols:[1.4, 2.6, 1.2, 1.2, 1.2] })]);

  var cn = 0, csv = 0, cch = 0, cins = 0; R.cos.forEach(function(c){ cn += +c[2] || 0; csv += +c[3] || 0; cch += +c[5] || 0; cins += +c[7] || 0; });
  var weak = R.cos.slice().sort(function(a, b){ return (parseInt(a[6], 10) || 0) - (parseInt(b[6], 10) || 0) || (+b[2] || 0) - (+a[2] || 0); }).slice(0, 10);
  S.push(['شركات الخدمة — المسح والتركيب', pxCards([['نسبة مسح المخيمات', (cn ? Math.round(csv / cn * 100) : 0) + '٪', csv + ' من ' + cn, '1E8449'], ['المتبقي للمسح', String(cn - csv), 'مخيم', '8A6D0B'], ['فيها تحديات', String(cch), 'مخيم ممسوح', 'A93226'], ['التركيب', String(cins), cins ? 'مخيم' : 'لم يبدأ بعد', '163E35'], ['الشركات', String(R.cos.length), R.phase === 'survey' ? 'مرحلة المسح — لم يبدأ التواصل' : '']], PX.Y0, 1500000)
    + pxBox(PX.X0, PX.Y0 + 1580000, PX.W, 420000, pxP(R.phase === 'survey' ? 'المرحلة الحالية: المسح الميداني — التواصلُ مع الشركات والتركيبُ لم يبدآ بعد، فلا تصنيفَ لها بالتركيب. الأقلُّ مسحًا أوّلًا، والكلُّ في ملف الإكسل' : 'دليل نسبة الإنجاز: ممتاز ٧٥٪ فأكثر · متوسط ٤٠–٧٤٪ · ضعيف أقل من ٤٠٪ — الأضعفُ أوّلًا، والكلُّ في ملف الإكسل', { sz:1200, c:'7F8C8D' }), { geom:'rect' })
    + pxTable(PX.X0, PX.Y0 + 2050000, PX.W, ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'الحالة'], weak.map(function(r){ var L = pxLvl(r[6]); return [r[0], r[1], r[2], r[3], r[4], r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', { t:r[6], c:L.c, bg:L.bg, b:1 }, { t:r[8], c:'7F8C8D' }]; }), { cols:[3, 1.6, 0.9, 0.9, 1, 1, 1, 2.6], rh:470000, sz:1200 })]);
  S.push(['بيان المعوقات وتصنيفها', pxCards([['إجمالي المعوقات', String(R.obsTotal), 'نقطةٌ لم تُركَّب وفيها عائق', 'A93226']].concat(R.parties.map(function(p){ return ['تُعالَج من خلال ' + p[0], String(p[1]), '']; })), PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2300000, PX.W, ['الفئة', 'العدد', 'الجهة المعالجة'], R.cats.slice(0, 9), { cols:[4, 1, 2] })]);
  S.push(['التحديات / آليات المعالجة', R.chal.length ? pxTable(PX.X0, PX.Y0, PX.W, ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة'], R.chal.slice(0, 9).map(function(r){ return [r[0], r[1], r[2], r[3], r[4], /تم الحل|مغلق/.test(r[5]) ? { t:r[5], c:'1E8449', b:1 } : { t:r[5], c:'A93226', b:1 }]; }), { cols:[1.4, 3, 1.3, 1.4, 3, 1.6], hf:'86432B', rh:640000, sz:1200 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا تحدياتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'86432B', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  S.push(['تحديث حالة طلبات الوزارة', R.req.length ? pxTable(PX.X0, PX.Y0, PX.W, ['#', 'الوصف', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة'], R.req.slice(0, 8).map(function(r){ return [String(r[0]), r[1], r[2] || '—', r[3] || '—', /منجز/.test(r[4]) ? { t:r[4], c:'1E8449', b:1 } : r[4]]; }), { cols:[0.5, 3, 3, 2.4, 1.1], rh:700000, sz:1300 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا طلباتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'163E35', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  var D = R.daily.slice().reverse(), mx = Math.max.apply(null, D.map(function(d){ return Math.max(d[1], d[2]); }).concat([1]));
  var cw = PX.W / Math.max(1, D.length), base = PX.Y0 + 6600000, hmax = 5400000, bars = '';
  D.forEach(function(d, i){ var x = PX.X0 + PX.W - (i + 1) * cw, bw = cw * 0.34, hi = d[2] / mx * hmax, hs = d[1] / mx * hmax;
    bars += pxBox(x + cw * 0.12, base - hi, bw, Math.max(1, hi), '', { geom:'rect', fill:'27AE60' }) + pxBox(x + cw * 0.12 + bw, base - hs, bw, Math.max(1, hs), '', { geom:'rect', fill:'D6A561' })
      + pxBox(x, base - Math.max(hi, hs) - 420000, cw, 400000, pxP(String(d[2]), { sz:1200, b:1, c:'1E8449', al:'ctr' }), { geom:'rect' })
      + pxBox(x, base + 60000, cw, 400000, pxP(String(d[0]).slice(5), { sz:1100, c:'7F8C8D', al:'ctr' }), { geom:'rect' }); });
  S.push(['ملخص العمل اليومي — آخر ١٤ يومًا', bars + pxBox(PX.X0, base + 560000, PX.W, 420000, pxP('■ التركيب (أخضر) · ■ المسح (ذهبي) — الرقمُ فوق العمود عددُ التركيبات', { sz:1200, c:'7F8C8D' }), { geom:'rect' })]);
  return S;
}
function mfuPptx(){
  toast(t('يُجهَّز العرضُ من قالب الوزارة…'));
  return pptxTemplate().then(function(tpl){
    var R = mfuReport(), E = ooxRead(tpl), dec = new TextDecoder(), slides = mfuSlides(R), chk = mfuReportCheck(R);
    var order = ['2','3','4','5','6','7','8','9','10','11','12','13'].map(function(k){ return 'ppt/slides/slide' + k + '.xml'; });
    var out = E.map(function(e){
      if (e.method !== 0 || !/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return e;
      var x = dec.decode(e.raw);
      if (e.name === 'ppt/slides/slide1.xml') return { name:e.name, text:x.replace('{{H}}', pxE(R.hijri)).replace('{{G}}', pxE(R.greg)) };
      var k = order.indexOf(e.name); if (k < 0) return e;
      PX_ID = 1000;
      var sl = slides[k];
      x = x.replace('{{T}}', pxE(sl[0])).replace(/<p:sp><p:nvSpPr><p:cNvPr id="990" name="BODY"\/>[\s\S]*?<\/p:sp>/, function(){ return pxScale(sl[1], PX_K); });
      return { name:e.name, text:x };
    });
    if (!expGate('باوربوينت', chk.concat(pptxCheck(out)))) return false;
    var ok = dl(new Blob([ooxWrite(out)], { type:'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), mfuFileName('pptx'));
    if (ok){ logEvent('تصديرُ التحديث الأسبوعي — باوربوينت', ''); toast(t('صُدّر العرض')); }
    return ok;
  }).catch(function(e){ softErr('pptx', e, ''); toast(t('تعذّر تحميلُ قالب العرض — تحقّق من الشبكة')); return false; });
}
function expScopeRow(){
  var ids = expScopeIds(), n = ids ? ids.length : (STATE.sites || []).length;
  var opt = function(list, cur, blank){ return '<option value="">' + esc(t(blank)) + '</option>' + list.map(function(v){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join(''); };
  var chip = function(m, l){ return '<button type="button" class="chip' + (EXP.scope.m === m ? ' on' : '') + '" data-expscope="' + m + '">' + esc(l) + '</button>'; };
  return '<div class="chips" style="margin:8px 0 0;align-items:center"><span class="hint" style="margin:0">' + esc(t('نطاقُ الملف')) + ':</span>'
    + chip('all', t('كلُّ النقاط')) + chip('tax', t('مشعرٌ ونوع')) + chip('sel', t('المحدَّدُ على الخريطة') + ' (' + nm(SEL_N) + ')')
    + (EXP.scope.m === 'tax' ? '<select data-expsg="1" style="max-width:170px">' + opt(TAX_G, EXP.scope.g, 'كلُّ المشاعر') + '</select><select data-expst="1" style="max-width:170px">' + opt(TAX_T, EXP.scope.t, 'كلُّ الأنواع') + '</select>' : '')
    + (EXP.scope.m === 'sel' && !SEL_N ? btn('\u2611 ' + t('حدِّد من الخريطة'), 'btn-quiet btn-sm', ' data-expselgo="1"') : '')
    + '<span class="pill ' + (n ? 'acc' : 'wrn') + '">' + nm(n) + ' ' + esc(t('نقطة في الملف')) + '</span></div>';
}

function mfuExportBar(){
  return '<div class="card" style="margin:0 0 12px"><div class="actions" style="align-items:center">'
    + '<b style="color:#C8943E">\u2B07 ' + esc(t('تصدير التحديث الأسبوعي')) + '</b>'
    + btn('\u{1F4CB} ' + t('التقرير التنفيذي'), 'btn-primary btn-sm', ' data-execxls="1" title="' + esc(t('قالب الوزارة — التحديات بستّ مجموعات والإجراء والجهة — بأرقام اللحظة')) + '"')
    + btn('PowerPoint', 'btn-primary btn-sm', ' data-mfuexp="pptx"') + btn('Word', 'btn-secondary btn-sm', ' data-mfuexp="docx"') + btn('Excel', 'btn-secondary btn-sm', ' data-mfuexp="xlsx"') + btn('PDF', 'btn-secondary btn-sm', ' data-mfuexp="pdf"')
    + (mfuFltLabel() ? '<span class="pill wrn">' + esc(t('بفلتر')) + ': ' + esc(mfuFltLabel()) + ' \u2014 ' + esc(t('أزل الفلتر لتصدير الكلّ')) + '</span>' : '')
    + '<span class="hint" style="margin:0">' + esc(t('من الجهاز نفسِه — لحظي، بالأرقام الحالية')) + '</span></div>'
    + expScopeRow()
    + (EXP.chk && EXP.chk.n ? '<div class="alert warn" style="margin:8px 0 0"><b>' + esc(t('أوقف الفحصُ آخرَ تصدير')) + ' (' + esc(EXP.chk.kind) + ') — ' + nm(EXP.chk.n) + ' ' + esc(t('خطأ')) + '</b><ul style="margin:4px 0 0;padding-inline-start:18px">' + EXP.chk.issues.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'
       : (EXP.chk ? '<span class="pill ok" style="margin:8px 0 0">\u2713 ' + esc(t('آخرُ ملفٍّ اجتاز الفحص')) + ' (' + esc(EXP.chk.kind) + ')</span>' : ''))
    + '</div>';
}
PAGE.mfu = { m:'المتابعة', t:'متابعة الوزارة',
  l:'العرضُ الأسبوعيُّ للوزارة حيًّا — بعناوينه نفسِها: المهامُّ والتركيباتُ والشركاتُ والمعوقاتُ والتحدياتُ والطلبات.',
  body:function(){
    mfuFetch();
    if (!EXP.pptxTpl && !MFU.tplAsk && FB.ready){ MFU.tplAsk = 1; setTimeout(function(){ try { if (!(navigator.connection && navigator.connection.saveData)) pptxTemplate().catch(function(){ MFU.tplAsk = 0; }); } catch (e){ LS_ERR = e; } }, 4000); }
    var head = tabHead('mfu'), cur = tabCur('mfu');
    if (!(STATE.sites || []).length) return head + alertBox('warn', 'لا مواقع محمّلة.');
    setTimeout(ringsGrow, 30);
    if (cur === 'kiosk' || (cur === 'mfu' && KIOSK_ON)){ setTimeout(kioskAnimate, 30); setTimeout(function(){ try { kkSatInit(); } catch (e){ softErr('kkSat', e, ''); } }, 40); return head + kioskBody(); }
    head += mfuExportBar();
    if (cur === 'mweek') return head + mtWeek() + mtDetails('تحديث المهام والمعالم', '<details class="mfu-add" open><summary>' + esc(t('حالة أبرز المهام')) + '</summary>' + mfuTasks() + '</details>' + PAGE.wtask.body(), '\u270E');
    if (cur === 'msurv') return head + mfuSurv();
    if (cur === 'minst') return (svListPop() + supPopHtml()) + head + mtInst();
    if (cur === 'mcos') return (svListPop() + supPopHtml()) + head + mtCos();
    if (cur === 'mobs') return (svListPop() + supPopHtml()) + head + mtObs();
    if (cur === 'mchal') return head + mfuChal();
    if (cur === 'mreq') return head + mfuReq();
    if (cur === 'mdaily') return (svListPop() + supPopHtml()) + head + mtDaily();
    if (cur === 'mcamps') return head + mtCamps();
    return head + mfuSummary();
  }};

function overDailyBody(){ return '<details class="mfu-add"><summary>' + esc(t('المعدل اليومي')) + '</summary>' + (function(){

    var H = (typeof statsHistory === 'function') ? statsHistory(14) : [];
    if (!H.length){
      var S = siteStats(), day = dayKey(Date.now());
      var sv = 0, ins = 0;
      Object.keys(STATE.recs).forEach(function(k){
        if (dayKey(STATE.recs[k].at || STATE.recs[k]._at) === day && svVisited(STATE.recs[k])) sv++; });
      Object.keys(STATE.inss).forEach(function(k){
        var r = STATE.inss[k];
        if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++; });
      return alertBox('info','لا لقطاتٍ محفوظةً بعد — هذا يومُك أنت محسوبًا من سجلاتك.')
        + card('اليوم', table(['التاريخ','مسح','تركيب','الإجمالي'],
            [['<span class="num">' + esc(day) + '</span>', N(sv), N(ins), N(sv + ins)]]));
    }
    var tot = [0,0,0];
    var rows = H.slice().reverse().map(function(r){
      var sv = r.daySurvey || 0, ins = r.dayInstall || 0, dis = r.dayDismantle || 0;
      tot[0] += sv; tot[1] += ins; tot[2] += dis;
      return ['<span class="num">' + esc(r.day) + '</span>', N(sv), N(ins), N(dis),
              N(sv + ins + dis), N(r.dayBlocked || 0)];
    });
    return card('آخر ' + nm(rows.length) + ' يومًا',
        table(['التاريخ','مسح','تركيب','فك','الإجمالي','تعذّر'], rows,
              ['الإجمالي', N(tot[0]), N(tot[1]), N(tot[2]), N(tot[0]+tot[1]+tot[2]), '']))
      + '<p class="hint">' + esc(t('اللقطةُ تُكتَب من جهاز المكتب مرةً كلَّ ربع ساعة — فما لم يُزامَن بعدُ لا يظهر هنا.')) + '</p>';
  })() + '</details>'; }
PAGE.over = { m:'المتابعة', t:'نظرة عامة',
  l:'تقدّمُ المشروع من كلِّ زاوية — الصورةُ والتوزيعُ والوتيرةُ والمعدلُ اليوميُّ والتركيب.',
  body:function(){
    var head = tabHead('over'), cur = tabCur('over');
    if (cur === 'svdash') return head + svdashBody();
    if (cur === 'now') return head + overDailyBody() + (function(){

    var S = siteStats(), DAY = 86400000, now = Date.now();
    var today = dayKey(now), yday = dayKey(now - DAY), tmr = dayKey(now + DAY);
    var Y = dayDone(yday), T0 = dayDone(today);

    var bySup = {}, open = 0, tmrN = 0, bySupTmr = {}, byZoneTmr = {}, lateN = 0;
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (!x || x.status === 'معتمد') return;
      open++;
      var who = x.to || '\u2014', st = siteFind(x.site), r = STATE.recs[x.site];
      var g = bySup[who] = bySup[who] || { n:0, doneToday:0, wait:0, rev:0 };
      g.n++;
      var rv = svReview(r);
      if (rv === 'revisit') g.rev++;
      else if (svVisited(r)){ if (dayKey(r.at || r._at) === today) g.doneToday++; }
      else g.wait++;
      if (x.when === tmr){ tmrN++; bySupTmr[who] = (bySupTmr[who] || 0) + 1; if (st) byZoneTmr[st.zone] = (byZoneTmr[st.zone] || 0) + 1; }
      if (x.when && x.when < today && !svVisited(r)) lateN++;
    });

    var zoneToday = {};
    Object.keys(STATE.recs).forEach(function(k){
      var r = STATE.recs[k]; if (dayKey(r.at || r._at) !== today || !svVisited(r)) return;
      var st = siteFind(k); if (st) zoneToday[st.zone] = (zoneToday[st.zone] || 0) + 1;
    });
    var sups = Object.keys(bySup).sort(function(a, b){ return bySup[b].n - bySup[a].n; });
    var col = function(title, inner){ return '<div>' + card(title, inner) + '</div>'; };
    return (rankOf(ROLE) >= rankOf('supervisor')
              ? '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الحضور'),'btn-secondary btn-sm',' data-xls="attendance"') + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('التركيبات'),'btn-secondary btn-sm',' data-xls="installs"') + '</div>' : '')
      + attTeamCard()
      + (may('approve') ? inboxCard() : '')
      + stepsCard(10)
      + '<div class="grid cols-3" style="align-items:start">'
      + col('\u2705 ' + t('ما انتهى'),
          stats([['أمس — مسح', N(Y.sv), Y.sv ? 'ok' : ''], ['أمس — تركيب', N(Y.ins), Y.ins ? 'ok' : ''],
                 ['أمس — فك', N(Y.dis)]])
          + table(['حتى الآن','العدد','من'], [
              [esc(t('زيارات معتمدة')), N(S.approved), N(S.total)],
              [esc(t('زيارات تمّت')), N(S.surveyed), N(S.total)],
              [esc(t('مُركّب')), N(S.installed), N(S.total)]])
          + meter('نسبة الزيارة', S.surveyed, S.total) + meter('نسبة التركيب', S.installed, S.total))
      + col('\u26A1 ' + t('الآن — اليوم'),
          stats([['اليوم — مسح', N(T0.sv), T0.sv ? 'acc' : ''], ['اليوم — تركيب', N(T0.ins), T0.ins ? 'acc' : ''],
                 ['تنتظر الاعتماد', N(S.pending), S.pending ? 'wrn' : ''],
                 ['متأخّرة عن موعدها', N(lateN), lateN ? 'bad' : '']])
          + (sups.length
            ? table(['المشرف','مُسند','تمّ اليوم','بانتظار','مردود'], sups.slice(0, 12).map(function(sp){
                var g = bySup[sp];
                return [esc(dispName(sp)), N(g.n), N(g.doneToday), N(g.wait), g.rev ? '<b>' + nm(g.rev) + '</b>' : N(0)];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لا مهامَّ مفتوحةً الآن — لم يُسنَد شيءٌ بعد.')) + '</p>')
          + (Object.keys(zoneToday).length
            ? '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('أين نحن اليوم')) + ':</b> '
              + Object.keys(zoneToday).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(zoneToday[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : ''))
      + col('\u{1F4C5} ' + t('غدًا — المجدول'),
          stats([['نقاطٌ مجدولةٌ لغد', N(tmrN), tmrN ? 'acc' : ''], ['مشرفون', N(Object.keys(bySupTmr).length)]])
          + (tmrN
            ? table(['المشرف','نقاط'], Object.keys(bySupTmr).map(function(sp){ return [esc(dispName(sp)), N(bySupTmr[sp])]; }))
              + '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('بالمشعر')) + ':</b> '
              + Object.keys(byZoneTmr).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(byZoneTmr[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : '<p class="hint" style="margin:0">' + esc(t('لا شيءَ مجدولٌ لغد بعد — تُجدوَل النقاطُ بموعدها من الخريطة أو «توزيع الفرق».')) + '</p>'))
      + '</div>'
      + '<div class="actions" style="margin-top:12px">'
      + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-p="map"')
      + (may('approve') ? btn('\u2705 ' + t('اعتماد الزيارات'),'btn-primary btn-sm',' data-p="svappr"') : '')
      + btn('\u2753 ' + t('كيف تسير الدورة؟'),'btn-quiet btn-sm',' data-p="wf"')
      + '</div>'
      + '<p class="hint">' + esc(t('الخريطةُ تلوّن الدورةَ كلَّها: لم يُزر · مُسند · مجدولٌ غدًا · تحتاج زيارةً أخرى · تمت وتنتظر الاعتماد · معتمدة.')) + '</p>';
  })();
    if (cur === 'reg') return head + (function(){

    var S = siteStats(), rows = [];
    Object.keys(S.byKey).forEach(function(k){
      var p = k.split('|');
      rows.push([p[0], (CAT_DEF[p[1]] || {}).l || p[1], S.byKey[k]]);
    });
    rows.sort(function(a, b){ return b[2] - a[2]; });
    return card('التوزيع', table(['المشعر','النوع','العدد','النسبة'],
      rows.map(function(r){
        return [esc(t(r[0])), esc(t(r[1])), N(r[2]),
                nm(Math.round(r[2] / (S.total || 1) * 100)) + '٪'];
      }), ['الإجمالي','', N(S.total), '١٠٠٪']));
  })();
    if (cur === 'pace') return head + (function(){

    var S = siteStats(), DAY = 86400000, now = Date.now();
    var dueS = cfgGet('dueSurvey'), dueI = cfgGet('dueInstall');
    var doneOn = dayDone;
    var y = doneOn(dayKey(now - DAY)), w = { sv:0, ins:0 };
    for (var d = 1; d <= 7; d++){ var o = doneOn(dayKey(now - d * DAY)); w.sv += o.sv; w.ins += o.ins; }
    function daysTo(due){ return due ? Math.ceil((due - now) / DAY) : 0; }
    function stage(name, left, due, avg7, yday){
      var days = daysTo(due), avg = avg7 / 7;
      var need = !due ? 0 : (days > 0 ? Math.ceil(left / days) : left);
      var finish = avg > 0 && left > 0 ? now + Math.ceil(left / avg) * DAY : (left > 0 ? 0 : now);
      var late = due && finish && finish > due;
      var verdict = !left ? ['اكتملت', 'ok']
        : !due ? ['لا موعدَ مضبوطًا', 'wrn']
        : !avg ? ['لا إنجازَ في آخر سبعة أيام — لا يُحسَب موعدٌ متوقّع', 'bad']
        : late ? ['على هذا المعدل تتأخّر عن موعدها', 'bad'] : ['على هذا المعدل تلحق موعدَها', 'ok'];
      return card(name,
          stats([['المتبقّي', N(left), left ? '' : 'ok'],
                 ['الموعد', due ? '<span class="num">' + esc(dayKey(due)) + '</span>' : '—', due ? '' : 'wrn'],
                 ['أيامٌ للموعد', due ? N(Math.max(0, days)) : '—', due && days <= 0 && left ? 'bad' : ''],
                 ['المطلوب يوميًّا', due ? N(need) : '—'],
                 ['معدل آخر ٧ أيام', nm(Math.round(avg * 10) / 10)],
                 ['المنجز أمس', N(yday)],
                 ['الانتهاء المتوقع', finish ? '<span class="num">' + esc(dayKey(finish)) + '</span>' : '—', late ? 'bad' : (finish ? 'ok' : '')]])
        + alertBox(verdict[1] === 'ok' ? 'success' : (verdict[1] === 'bad' ? 'error' : 'warn'), verdict[0]));
    }
    return (!dueS || !dueI
      ? alertBox('warn', 'موعدٌ أو أكثرُ لم يُضبط بعد — يُكتب في «التخطيط ← المواعيد والأزمنة» فتُحسَب الوتيرةُ عليه.')
      : '')
      + stage('المسح', S.total - S.surveyed, dueS, w.sv, y.sv)
      + stage('التركيب', S.total - S.installed, dueI, w.ins, y.ins)
      + '<p class="hint">' + esc(t('المعدلُ من اللقطات اليومية المحفوظة، وما لم تُحفَظ لقطتُه يُحسَب من السجلات التي على هذا الجهاز.')) + '</p>';
  })();
    if (cur === 'inst') return head + (function(){
    var tot = { notStarted:0, blocked:0, scheduled:0, installed:0 };
    var byType = Object.create(null);

    STATE.sites.forEach(function(x){
      var ty = x.type || 'أخرى';
      if (!byType[ty]) byType[ty] = { notStarted:0, blocked:0, scheduled:0, installed:0, total:0 };
      byType[ty].total++;
      var r = STATE.recs[x.id];
      var ins = STATE.inss[x.id];
      if (ins && ins.status === 'مُركّب' && ins.approved){
        tot.installed++; byType[ty].installed++; return;
      }
      if (!svDone(r)){
        if (r){ tot.blocked++; byType[ty].blocked++; }
        else { tot.notStarted++; byType[ty].notStarted++; }
        return;
      }

      tot.scheduled++; byType[ty].scheduled++;
    });

    return stats([['لم يُزَر', N(tot.notStarted)],
                  ['متعذّر', N(tot.blocked), tot.blocked ? 'bad' : 'ok'],
                  ['مُسح — جاهزٌ أو مجدول', N(tot.scheduled), 'wrn'],
                  ['مُركّب معتمد', N(tot.installed), 'ok']])

      + card('حسب نوع النقطة — كم خلص فعليًّا',
          table(['النوع','لم يُزَر','متعذّر','جاهز/مجدول','مُركّب','الإجمالي'],
            Object.keys(byType).map(function(ty){
              var b = byType[ty];
              return [typeLabel(ty), N(b.notStarted), N(b.blocked), N(b.scheduled),
                      '<b>' + nm(b.installed) + '</b>', N(b.total)];
            }),
            ['<b>' + t('الإجمالي') + '</b>', N(tot.notStarted), N(tot.blocked), N(tot.scheduled),
             '<b>' + nm(tot.installed) + '</b>', N(STATE.sites.length)]))

      + card('دورة التركيب', flow(['لم يبدأ','مسح','جدولة','مُركّب'], 0)
        + '<p class="hint">' + esc(t('النقطة لا تدخل الجدولة إلا بعد مسحها بنجاح، ولا تُحسَب مُركّبةً إلا بعد اعتماد قطعها في «التدقيق الهندسي».')) + '</p>');
  })();

    return head + stepsCard(8) + (function(){
    var K = siteKeyStats();
    if (OVER_ZONE && !K.zones[OVER_ZONE]) OVER_ZONE = '';
    var S = OVER_ZONE ? K.zones[OVER_ZONE] : K.total, zl = OVER_ZONE ? t(OVER_ZONE) : t('كلُّ المشاعر');
    var pc = S.n ? Math.round(S.sv / S.n * 100) : 0;

    return card(t('المسحُ بالمشعر') + ' \u2014 ' + zl,
          '<p class="hint" style="margin-top:0">' + esc(t('اختر مشعرًا لتقرأ أرقامَه وحدَه — وبلا اختيارٍ الأرقامُ للكلِّ نسبًا من الكلّ.')) + '</p>'
          + overZoneCards(K))
      + stats([['إجمالي المواقع', N(S.n)], ['تمت الزيارة', N(S.sv), 'acc'], ['متبقٍّ', N(S.n - S.sv), S.n - S.sv ? 'wrn' : 'ok'],
               ['مُركّب', N(S.ins), 'ok'], ['لم يُزر', N(S.noRec)], ['متعذّر', N(S.stuck), S.stuck ? 'wrn' : '']])
      + card(t('تقدّم المشروع') + ' \u2014 ' + zl, meter('تقدّم المسح من إجمالي المواقع', S.sv, S.n)
                            + meter('نسبة التركيب من إجمالي المشروع', S.ins, S.n)
                            + '<p class="hint">' + esc(t('أُنجز')) + ' <b class="num">' + nm(pc) + '٪</b> \u00b7 ' + esc(t('وبقي')) + ' <b class="num">' + nm(100 - pc) + '٪</b>'
                            +   ' (' + nm(S.n - S.sv) + ' ' + esc(t('نقطة')) + ')</p>')
      + cardFlush('المشاعرُ كلُّها — كم أُنجز وكم بقي',

          table(['المشعر','المواقع','تمت الزيارة','متبقٍّ','مُركّب','متعذّر'],
            Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }).map(function(z){
              var o = K.zones[z];
              return ['<button class="btn btn-quiet btn-sm" data-ovz="' + esc(z) + '">' + esc(t(z)) + '</button>',
                      N(o.n), N(o.sv) + ' <span class="hint" style="margin:0">' + nm(o.n ? Math.round(o.sv / o.n * 100) : 0) + '٪</span>', N(o.n - o.sv), N(o.ins), N(o.stuck)];
            }),
            ['الإجمالي', N(K.total.n), N(K.total.sv) + ' <span class="hint" style="margin:0">' + nm(K.total.n ? Math.round(K.total.sv / K.total.n * 100) : 0) + '٪</span>', N(K.total.n - K.total.sv), N(K.total.ins), N(K.total.stuck)]))
      + cardFlush(t('التوزيع حسب المشعر والنوع') + (OVER_ZONE ? ' \u2014 ' + zl : ''),
          table(['المشعر','النوع','العدد','تمت الزيارة','مُركّب'],
            K.keys.filter(function(k){ return !OVER_ZONE || k.split('|')[0] === OVER_ZONE; }).map(function(k){
              var p = k.split('|'), n = K.by[k], v = K.sv[k] || 0;
              return [esc(t(p[0])), esc(t(p[1])), N(n), N(v) + ' <span class="hint" style="margin:0">' + nm(n ? Math.round(v / n * 100) : 0) + '٪</span>', N(K.ins[k] || 0)];
            }),
            ['الإجمالي','', N(S.n), N(S.sv) + ' <span class="hint" style="margin:0">' + nm(pc) + '٪</span>', N(S.ins)]))

      + card('المخرجات الورقية',
          '<div class="actions">'
          + btn('⬇ '+t('الملخص التنفيذي — إكسل'),'btn-primary btn-sm',' data-xls="over"')
          + btn('🖨 '+t('طباعة'),'btn-secondary btn-sm',' data-print="1"')
          + '</div>');
  })();
  }};

PAGE.survey = { m:'الميدان', t:'متابعة العمل الميداني',
  l:'دورةُ النقطة كلُّها — مسحُها واعتمادُها وحلُّها وتدقيقُ تركيبها، وما أفاد به الميدان وما تعثّر.',
  body:function(){
    var head = tabHead('survey'), cur = tabCur('survey');
    if (cur === 'qa') return head + (function(){
    var wait = Object.keys(STATE.inss).filter(function(k){
      return insDone(k) && !STATE.inss[k].approved;
    });
    var done = Object.keys(STATE.inss).filter(function(k){ return STATE.inss[k].approved; });
    return stats([['بانتظار التدقيق', N(wait.length), wait.length?'wrn':''],
                  ['معتمد', N(done.length), 'ok'],
                  ['مسودّات', N(Object.keys(STATE.inss).filter(function(k){
                      return STATE.inss[k].status === 'مسودّة'; }).length)],
                  ['نقاط معتمدة', N(done.reduce(function(a,k){ return a + insPtsOf(k); }, 0))]])
      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','المنفِّذ','القطع','النقاط','الوقت',''],
              wait.slice(0, 30).map(function(k){
                var r = STATE.inss[k], s = siteFind(k);

                var sn = Object.keys(r.parts || {}).map(function(code){ var v = (r.serials || {})[code]; return '<div class="hint" style="margin:0"><bdi>' + esc(itemName(code)) + '</bdi> \u00d7' + nm(r.parts[code]) + (v ? ' \u00b7 <span class="num" dir="ltr">' + esc(v) + '</span>' : ' \u00b7 <span style="color:var(--danger)">' + esc(t('بلا سيريال')) + '</span>') + '</div>'; }).join('');

                var solI = ((r.solution || (STATE.inss[k] || {}).solution || {}).items) || {}, dv = [];
                Object.keys(solI).concat(Object.keys(r.parts || {})).filter(function(c, i, a){ return a.indexOf(c) === i; }).forEach(function(c){ var a1 = cfgN(solI[c]) || 0, b1 = cfgN((r.parts || {})[c]) || 0; if (a1 !== b1) dv.push(itemName(c) + ' ' + nm(a1) + '\u2192' + nm(b1)); });
                if (Object.keys(solI).length) sn += '<div class="hint" style="margin:2px 0 0">' + (dv.length ? '\u0394 ' + esc(t('عن الحلّ المعتمد')) + ': ' + esc(dv.join('، ')) : '\u2713 ' + esc(t('مطابقٌ للحلّ المعتمد'))) + '</div>';
                var ph = (typeof photosOf === 'function' ? photosOf(k) : []).filter(function(x){ return x[1] && !x[1].del && /^ins/.test(String(x[1].kind || '')); });
                var phH = ph.length ? '<div style="display:flex;gap:4px;margin-top:4px">' + ph.slice(0, 4).map(function(x){ var p = x[1], src = phSrc(x[0], p, 200); return src ? '<img src="' + esc(src) + '" alt="" loading="lazy" data-phview="' + esc(x[0]) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;cursor:zoom-in">' : '<span class="hint" style="margin:0;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:6px">\u23F3</span>'; }).join('') + '</div>' : '<div class="hint" style="margin:4px 0 0;color:var(--danger)">' + esc(t('لا صورَ تركيبٍ وصلت')) + '</div>';
                return ['<strong>' + esc(k) + '</strong><br><span class="hint" style="margin:0">'
                          + esc((s && s.name) || '') + '</span>' + demoTag(s) + ' ' + btn('\u25C8', 'btn-quiet btn-sm', ' data-site="' + esc(k) + '" title="' + esc(t('صفحة النقطة')) + '"'),
                        esc(r.by), N(Object.keys(r.parts || {}).length) + sn + phH, N(insPtsOf(k)),
                        '<span class="num">' + fmtTime(r.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-appr="' + esc(k) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-rej="' + esc(k) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبات بانتظار التدقيق.')) + '</p>'))
      + card('قاعدة الاعتماد',
          flow(['تركيب مُبلَّغ','مراجعة الصور','مطابقة السيريال','معتمد'], 0)
          + '<p class="hint">' + esc(t('الردُّ يُعيد النقطة لمنفّذها بحالة «مُعاد» مع سبب — ولا تُحتسب نقاطُها حتى تُعتمد.')) + '</p>');
  })();
    if (cur === 'ncr') return head + (function(){
    var open = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى'; });
    return stats([['بلاغات', N(NCRS.length)],
                  ['مفتوحة', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['مغلقة', N(NCRS.length - open.length), 'ok'],
                  ['متوسط الإغلاق', NCRS.length ? N(3) + ' ' + t('يوم') : '—']])

      + (may('edit') ? card('بلاغ جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          + '<input id="ncrSite" placeholder="NSK-…" dir="ltr"></div>'
          + '<div class="field"><label>' + esc(t('الفئة')) + '</label>'
          + '<select id="ncrCat">'
          + ['تركيبٌ مخالفٌ للمواصفة','قطعةٌ غيرُ معتمدة','توصيلٌ كهربائيٌّ خاطئ',
             'ارتفاعٌ غيرُ مطابق','توثيقٌ ناقص','سيريالٌ غيرُ مطابق']
              .map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الخطورة')) + '</label>'
          + '<select id="ncrSev">'
          + ['جوهري','متوسط','طفيف'].map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
          + '<textarea id="ncrWhy" rows="2"></textarea></div>',
          btn('افتح بلاغًا','btn-primary',' data-ncradd="1"')) : '')

      + (NCRS.length
        ? cardFlush('البلاغات',
            table(['#','النقطة','الفئة','الخطورة','الوصف','الحالة',''],
              NCRS.map(function(x, i){
                return ['<span class="num">NCR-' + nm(i+1) + '</span>',
                        '<span class="num">' + esc(x.site || '—') + '</span>',
                        esc(x.cat),
                        pill(x.sev, x.sev==='جوهري'?'off':(x.sev==='متوسط'?'warn':'')),
                        '<span class="hint" style="margin:0">' + esc(x.why.slice(0,40)) + '</span>',
                        pill(x.st, x.st==='مغلق'?'ok':'warn'),
                        x.st !== 'مغلق' && may('approve')
                          ? btn('أغلِق','btn-quiet btn-sm',' data-ncrok="' + i + '"') : ''];
              })),
            btn('⬇ إكسل — عدم المطابقة','btn-secondary btn-sm',' data-xls="ncr"'))
        : card('', alertBox('success','لا بلاغاتِ عدمِ مطابقةٍ مفتوحة.')))

      + card('دورة البلاغ',
          flow(['رُصد','أُبلغ','إجراءٌ تصحيحي','تُحقّق','أُغلق'], 0)
          + '<p class="hint">' + esc(t('لا تُقفَل نقطةٌ عليها بلاغٌ جوهريٌّ مفتوح — والتحقّقُ بمن لم يرتكب.')) + '</p>');
  })();
    if (cur === 'solution') return head + (function(){
    var all = Object.keys(STATE.inss).map(function(k){ return STATE.inss[k]; })
      .filter(function(r){ return r && r.solution; });
    var wait = all.filter(function(r){ return r.solution.status === 'مقترح'; });
    var done = all.filter(function(r){ return r.solution.status === 'معتمد'; });

    var surveyed = STATE.sites.filter(function(s){
      return svApproved(STATE.recs[s.id]) && !solutionOf(s.id);
    });
    var unreviewed = STATE.sites.filter(function(s){
      return svReview(STATE.recs[s.id]) === 'pending' && !solutionOf(s.id);
    }).length;

    return stats([['بانتظار الاعتماد', N(wait.length), wait.length ? 'wrn' : ''],
                  ['معتمد', N(done.length), 'ok'],
                  ['زيارةٌ معتمدةٌ بلا حلٍّ بعد', N(surveyed.length)],
                  ['زيارةٌ تنتظر اعتمادَها أولًا', N(unreviewed), unreviewed ? 'wrn' : '']])

      + (function(){

          var byType = {}, itemTotals = {};
          done.forEach(function(r){
            var s = siteFind(r.id), ty = (s && s.type) || 'أخرى';
            byType[ty] = (byType[ty] || 0) + 1;
            Object.keys(r.solution.items || {}).forEach(function(code){
              itemTotals[code] = (itemTotals[code] || 0) + cfgN((r.solution.items || {})[code]);
            });
          });
          var types = Object.keys(byType), codes = Object.keys(itemTotals);
          if (!done.length) return '';

          var bal = {}; (typeof stockBalance === 'function' ? stockBalance() : []).forEach(function(b){ bal[b.item] = b; });
          var recv = {}; movesList().forEach(function(m){ if (m && m.kind === 'توريد') recv[itemKey(m.item)] = (recv[itemKey(m.item)] || 0) + cfgN(m.qty); });
          return card('الإجمالي المعتمد — موسم ١٤٤٨',
              stats(types.map(function(ty){ return [typeLabel(ty), N(byType[ty]), 'acc']; }))
              + (codes.length
                ? table(['الصنف','المعتمد من المسح (للتوريد)','ورد','في المستودع','مع المنفِّذين','رُكِّب (خُصم)','المتبقّي للطلب'],
                    codes.sort(function(a,b){ return itemTotals[b] - itemTotals[a]; }).map(function(code){
                      var k = itemKey(code), b = bal[k] || {}, need = Math.round(itemTotals[code]), got = Math.round(recv[k] || 0), left = Math.max(0, need - got);
                      return [esc(itemName(code)), N(need), N(got), N(Math.round(b.store || 0)), N(Math.round(b.custody || 0)), N(Math.round(b.used || 0)), left ? '<b style="color:var(--warn)">' + nm(left) + '</b>' : '\u2713'];
                    }))
                  + '<p class="hint" style="margin:6px 0 0">' + esc(t('المعتمدُ من حلول المسح هو رقمُ التوريد؛ والخصمُ من المستودع بما رُكِّب فعلًا — وفرقُ التركيب عن الحلّ طبيعيٌّ ويظهر في صفِّ التدقيق.')) + '</p>'
                : ''));
        })()

      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','الأجهزة المقترحة','المقترِح','الوقت',''],
              wait.slice(0, 30).map(function(r){
                var s = siteFind(r.id);
                return [siteIdHtml(siteOf(r)) + '<br><span class="hint" style="margin:0">'
                          + esc(((s && s.name) || '').slice(0,28)) + '</span>',
                        Object.keys(r.solution.items || {}).map(function(c){
                          return esc(itemName(c)) + ' \u00d7' + nm(r.solution.items[c]);
                        }).join('، '),
                        esc(r.solution.by),
                        '<span class="num">' + fmtTime(r.solution.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-solappr="' + esc(r.id) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-solrej="' + esc(r.id) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا حلولَ بانتظار الاعتماد.')) + '</p>'))

      + (may('edit')
        ? card('اقتراح حلٍّ لنقطة',
            surveyed.length
              ? '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
                + '<select id="solSite">' + surveyed.map(function(s){
                    return '<option value="' + esc(s.id) + '">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' (' + esc(s.id) + ')' : '')
                      + ' — ' + esc((s.name || '').slice(0,30)) + '</option>';
                  }).join('') + '</select></div>'
                + itemPickerHtml()
              : '<p class="hint" style="margin:0">' + esc(t('لا زيارةَ معتمدةً بلا حلٍّ الآن — اعتمد زيارةً أولًا من «اعتماد الزيارات» ثم اقترح حلَّها.')) + '</p>',
            surveyed.length ? btn('➕ اقترح الحل','btn-primary btn-sm',' data-solgo="1"') : '')
        : '')

      + '<p class="hint">' + esc(t('لا يُتاح طلبُ تركيبٍ (DR) لنقطةٍ إلا بعد اعتماد حلِّها هنا — والفكُّ (PR) لا يحتاج هذه البوابة، فما رُكِّب معروفٌ من سجله فور اختيار النقطة.')) + '</p>';
  })();
    if (cur === 'survey') return head + (function(){
    var all = surveyList();
    var S = siteStats();
    var day = dayKey();
    var weekAgo = Date.now() - 7 * 86400000;
    var todayN = all.filter(function(x){ return dayKey(x.rec.at || 0) === day; }).length;
    var weekN  = all.filter(function(x){ return (x.rec.at || 0) >= weekAgo; }).length;
    var blocked = all.filter(function(x){ return svStuck(x.rec); });
    var revisit = all.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });

    var rows = all;

    if (SURV_ST === 'done')  rows = rows.filter(function(x){ return x.done; });
    if (SURV_ST === 'block') rows = rows.filter(function(x){ return svStuck(x.rec); });
    if (SURV_ST === 'revisit') rows = rows.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });
    if (SURV_Q) rows = rows.filter(function(x){
      var hay = x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '');
      return hay.indexOf(SURV_Q) > -1;
    });

    var views = [['','الكل', all.length],
                 ['done','تم الوصول', all.length - blocked.length - revisit.length],
                 ['revisit','تحتاج زيارة أخرى', revisit.length],
                 ['block','متعذّر', blocked.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SURV_ST===v[0]?' on':'')
          + '" data-survst="' + v[0] + '">' + esc(t(v[1]))
          + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['تمت الزيارة', N(S.surveyed), 'acc'],
                       ['لم يُزر', N(siteKeyStats().total.noRec)],
                       ['اليوم', N(todayN)], ['هذا الأسبوع', N(weekN)],
                       ['متعذّر', N(blocked.length), blocked.length ? 'wrn' : 'ok'],
                      ['تحتاج زيارة أخرى', N(revisit.length), revisit.length ? 'wrn' : '']])

      + card('بحث في السجلّ',
          '<input type="search" id="survQ" value="' + esc(SURV_Q)
          + '" placeholder="' + esc(t('ابحث بالنقطة أو الاسم أو الفني')) + '" dir="auto">',
          btn('⬇ إكسل — المسح','btn-secondary btn-sm',' data-xls="recs"'));

    if (SURV_REOPEN){
      var rx = all.filter(function(x){ return x.id === SURV_REOPEN; })[0];
      html += card('سبب تعذُّر ' + esc(SURV_REOPEN) + (rx ? ' — ' + esc((rx.site.name||'').slice(0,30)) : ''),
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('السبب')) + '</label>'
          + '<select id="reopenReason">' + SV_ACCESS.filter(function(a){ return a !== 'تم الوصول'; }).map(function(a){
              return '<option value="' + esc(a) + '">' + esc(t(a)) + '</option>'; }).join('') + '</select></div>'
          + '<div class="field"><label>' + esc(t('تفصيلٌ إضافي')) + '</label>'
          + '<input id="reopenNote" dir="auto"></div>'
          + '</div>',
          btn('تأكيد — أعِدها متعذّرة','btn-danger btn-sm',' data-svreopengo="' + esc(SURV_REOPEN) + '"')
          + btn('تراجع','btn-quiet btn-sm',' data-svreopencancel="1"'));
    }

    html += (rows.length
      ? cardFlush(t('السجلّ') + ' — ' + nm(rows.length) + ' ' + t('من') + ' ' + nm(all.length),
          table(['النقطة','الحالة','الفني','التاريخ','ملاحظة',''],
            capList(rows, 300).map(function(x){
              return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                        + esc((x.site.name || '').slice(0, 28)) + '</span>',
                      x.done ? pill('تمت الزيارة','ok') : pill(x.rec.access || 'متعذّر','wrn'),
                      esc(dispName(x.rec.by) || '—'),
                      '<span class="num">' + esc(fmtDate(x.rec.at || 0)) + '</span>',
                      esc(x.rec.note || x.rec.reopenNote || '—'),

                      x.done && may('edit')
                        ? btn('أعِد تصنيفها كمتعذّرة','btn-quiet btn-sm',' data-svreopen="' + esc(x.id) + '"')
                        : '—'];
            })))
        + (rows.length > 300
            ? '' : '')
      : card('لا عمليات بعد',
          '<p class="hint" style="text-align:center;margin:0">'
          + esc(t('تظهر هنا فور أول مسحٍ ميداني.')) + '</p>'));

    html += '<p class="hint">' + esc(t('«أعِد تصنيفها كمتعذّرة» تُبقي بيانات الزيارة السابقة كما هي — لا حذف ولا فقدان سجلّ — لكنها تُخرجها من عِداد المُنجَز حتى تُزار ثانيةً.')) + '</p>';
    return html;
  })();
    if (cur === 'minappr') return head + (function(){

    var all = surveyList().filter(function(x){ return x.rec && svReview(x.rec) === 'approved'; });
    var lists = { pending:[], returned:[], approved:[] };
    all.forEach(function(x){ var ms = minState(x.rec); if (lists[ms]) lists[ms].push(x); });
    var rows = (lists[MIN_ST] || []).slice();
    if (MIN_Q) rows = rows.filter(function(x){ return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '') + ' ' + (x.site.co || '')).indexOf(MIN_Q) > -1; });
    rows.sort(function(a, b){ return (b.rec.reviewAt || 0) - (a.rec.reviewAt || 0); });
    var views = [['pending','بانتظار اعتماد الوزارة',lists.pending.length],['returned','أعادتها الوزارة',lists.returned.length],['approved','اعتمدتها الوزارة',lists.approved.length]];
    var canMin = may('minapprove'), canEng = may('approve');
    var out = [];
    capList(rows, 150).forEach(function(x){
      var r = x.rec, isOpen = MIN_OPEN === x.id, ms = minState(r);
      out.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                esc(t(x.site.zone || '—')) + (x.site.sq ? ' \u00b7 ' + esc(x.site.sq) : '') + '<br><span class="hint" style="margin:0">' + esc(x.site.co || '—') + '</span>',
                esc(dispName(r.by) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.at ? dayKey(r.at) : '') + '</span>',
                esc(dispName(r.reviewBy) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.reviewAt ? dayKey(r.reviewAt) : '') + '</span>',
                ms === 'approved' ? pill('اعتمدت الوزارة','ok') : (ms === 'returned' ? pill('أعادتها الوزارة','bad') : pill('بانتظار الوزارة','warn')),
                btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-minopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen){
        var meta = [['نوع التركيب', r.mount || '—'], ['مصدر الكهرباء', r.power || '—'], ['ارتفاع التركيب (م)', r.hgt != null ? String(r.hgt) : '—'],
                    ['العرض المتاح (م)', r.wid_m != null ? String(r.wid_m) : '—'], ['الارتفاع المتاح (م)', r.hgt_m != null ? String(r.hgt_m) : '—'],
                    ['طول الكابل (م)', r.cable != null ? String(r.cable) : '—'], ['تحديات التركيب', (r.chals || []).join(' \u00b7 ') || '—'],
                    ['هل الموقع مناسب', r.fit || '—'], ['الملاحظات', r.note || '—'], ['الشاخص', x.site.sign || '—']];
        if (r.minNote) meta.push([ms === 'returned' ? 'ملاحظة الوزارة' : 'ملاحظة الاعتماد', r.minNote + ' \u2014 ' + dispName(r.minBy || '') + ' \u00b7 ' + (r.minAt ? dayKey(r.minAt) : '')]);
        if (r.minResubmitNote) meta.push(['معالجة المهندس', r.minResubmitNote + ' \u2014 ' + dispName(r.minResubmitBy || '')]);
        var actions = '';
        if (canMin && ms !== 'approved')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ملاحظة الوزارة')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto" placeholder="' + esc(t('اختياريةٌ عند الاعتماد — مطلوبةٌ عند الإعادة')) + '"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u{1F3DB} ' + t('اعتماد إعداد التركيب'),'btn-primary btn-sm',' data-minok="' + esc(x.id) + '"')
            + btn('\u21A9 ' + t('إعادة للمهندس'),'btn-secondary btn-sm',' data-minback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else if (canEng && ms === 'returned')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ما عُولج')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u2B06 ' + t('أعد الرفع للوزارة'),'btn-primary btn-sm',' data-minre="' + esc(x.id) + '"')
            + btn('\u{1F501} ' + t('يعود المشرف لزيارة أخرى'),'btn-secondary btn-sm',' data-stkback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else actions = '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';
        out.push({ raw:'<tr><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px"><div class="grid cols-2">'
          + '<div>' + table(['البند','القيمة'], meta.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
          + '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(x.id)) + '</div>' + photoGalleryHtml(x.id) + '</div>'
          + '</div>' + actions + '</td></tr>' });
      }
    });
    return stats([['بانتظار اعتماد الوزارة', N(lists.pending.length), lists.pending.length ? 'wrn' : 'ok'],
                  ['أعادتها الوزارة', N(lists.returned.length), lists.returned.length ? 'bad' : 'ok'],
                  ['اعتمدتها الوزارة', N(lists.approved.length), 'ok']])
      + '<div class="chips">' + views.map(function(v){ return '<button type="button" class="chip' + (MIN_ST === v[0] ? ' on' : '') + '" data-minst="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-minq value="' + esc(MIN_Q) + '" placeholder="' + esc(t('ابحث بالنقطة أو المشرف أو الشركة')) + '" dir="auto">')
      + (out.length
          ? cardFlush(t(views.filter(function(v){ return v[0] === MIN_ST; })[0][1]) + ' \u2014 ' + nm(rows.length),
              table(['النقطة','المشعر / الشركة','المشرف','الاعتماد التقني','الحالة',''], out),
              btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-xls="minappr"'))
          : alertBox('success', 'لا نقاطَ في هذه الخانة.'))
      + '<p class="hint">' + esc(t('الدورة: زيارةُ المشرف ← الاعتمادُ التقنيُّ (المهندس) ← اعتمادُ الوزارة لإعداد التركيب ← اقتراحُ الحل واعتمادُه ← إسنادُ التركيب. لا يُسنَد تركيبٌ لنقطةٍ لم تعتمدها الوزارة.')) + '</p>';
  })();
    if (cur === 'svappr') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الزيارات'),'btn-secondary btn-sm',' data-xls="visits"') + '</div>' + (function(){
    var S = siteStats();
    var all = surveyList().filter(function(x){ return x.rec && (x.rec.review || x.done); });
    var lists = { pending:[], approved:[], revisit:[] };
    all.forEach(function(x){ var rv = svReview(x.rec); if (lists[rv]) lists[rv].push(x); });
    var rows = lists[SVA_ST] || [];
    if (SVA_Q) rows = rows.filter(function(x){
      return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '')).indexOf(SVA_Q) > -1; });

    var views = [['pending','بانتظار اعتمادك', lists.pending.length],
                 ['approved','معتمدة', lists.approved.length],
                 ['revisit','تحتاج زيارة أخرى', lists.revisit.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SVA_ST === v[0] ? ' on' : '')
          + '" data-svast="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['بانتظار اعتمادك', N(S.pending), S.pending ? 'wrn' : ''],
               ['معتمدة', N(S.approved), 'ok'],
               ['تحتاج زيارة أخرى', N(S.revisit), S.revisit ? 'bad' : ''],
               ['لم يُزر', N(siteKeyStats().total.noRec)]])
      + card('بحث', '<input type="search" id="svaQ" data-svaq value="' + esc(SVA_Q) + '" placeholder="'
          + esc(t('ابحث بالنقطة أو الاسم أو المشرف')) + '" dir="auto">');

    if (!rows.length){
      return html + card('', '<p class="hint" style="text-align:center;margin:0">'
        + esc(t(SVA_ST === 'pending' ? 'لا زياراتٍ تنتظر اعتمادك — كلُّ ما زاره المشرفون رُوجع.'
              : (SVA_ST === 'approved' ? 'لا زياراتٍ معتمدةً بعد.' : 'لا زياراتٍ مردودةً — كلُّ ما رُوجع اعتُمد.'))) + '</p>');
    }
    html += rows.slice(0, 60).map(function(x){
      var r = x.rec, rv = svReview(r);
      var facts = svFacts(r);
      var so = solutionOf(x.id);
      var head0 = siteIdHtml(siteOf(x)) + ' \u2014 ' + esc((x.site.name || '').slice(0, 40))
        + ' <span class="hint" style="margin:0;display:inline">\u00b7 ' + esc(dispName(r.by) || '\u2014')
        + ' \u00b7 <span class="num">' + esc(fmtDate(r.at || 0)) + '</span>'
        + (r.round > 1 ? ' \u00b7 ' + esc(t('الجولة')) + ' <span class="num">' + nm(r.round) + '</span>' : '') + '</span>';
      var nPh = photoCount(x.id);
      var body = (r.prevNote ? alertBox('info', t('سببُ الردِّ السابق') + ': ' + r.prevNote) : '')
        + table(['البند','ما أفاد به المشرف'], facts.map(function(f){ return [esc(t(f[0])), esc(f[1])]; }))
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F4F7} ' + t('الصور') + ' (' + nm(nPh) + ')', (SVA_PH === x.id ? 'btn-primary' : 'btn-secondary') + ' btn-sm', ' data-svph="' + esc(x.id) + '"') + '</div>'
        + (SVA_PH === x.id ? photoGalleryHtml(x.id) : '')
        + (rv === 'revisit' && r.revisitNote
            ? alertBox('warn', t('رُدَّت') + ' \u2014 ' + r.revisitNote + ' \u00b7 ' + (dispName(r.revisitBy) || '')) : '')
        + (rv === 'approved'
            ? alertBox('success', t('اعتمدها') + ' ' + (dispName(r.reviewBy) || '\u2014') + ' \u00b7 '
                + fmtDate(r.reviewAt || 0)
                + (so ? ' \u00b7 ' + t('الحل') + ': ' + t(so.status) : ' \u00b7 ' + t('بلا حلٍّ بعد'))) : '');
      var actions = '';
      if (rv === 'pending' && may('approve')){

        if (SVA_SOL === x.id && may('edit')){
          actions = card('اعتماد الزيارة واختيار الأجهزة', itemPickerHtml()
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحفظُ يعتمد الزيارةَ ويحفظ الأسطرَ حلًّا معتمدًا — فتدخل طبقةَ التركيب جاهزةً للإسناد.')) + '</p>'
            + btn('\u2705 ' + t('اعتمد واحفظ الأجهزة'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
          return cardRaw(head0, body + actions);
        }
        actions = '<div class="actions">'
          + (may('edit') ? btn('\u2705 ' + t('اعتمد واختر الأجهزة'),'btn-primary btn-sm',' data-svsol="' + esc(x.id) + '"') : '')
          + btn('\u2705 ' + t('اعتمد الزيارة'),(may('edit') ? 'btn-secondary' : 'btn-primary') + ' btn-sm',' data-svappr="' + esc(x.id) + '"')
          + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"')
          + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';
        if (SVA_REV === x.id){
          actions += '<div class="field" style="margin-top:10px"><label>' + esc(t('ما ينقص الزيارة — يقرؤه المشرفُ في مهامّه')) + '</label>'
            + '<input id="svaNote" dir="auto" placeholder="' + esc(t('مثلًا: الصورة لا تُظهر نقطةَ التثبيت، وقياسُ الطول ناقص')) + '"></div>'
            + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>';
        }
      } else if (rv === 'pending' && rankOf(ROLE) >= rankOf('supervisor')){
        actions = SVA_REV === x.id
          ? card(t('ردُّ الزيارة'), '<div class="field"><label>' + esc(t('ما الذي ينقص — يصل الفنيَّ في مهامّه')) + '</label><input id="svaNote" dir="auto"></div>'
              + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"') + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>')
          : '<div class="actions">' + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"') + '<span class="hint" style="margin:0">' + esc(t('الاعتمادُ للمهندس')) + '</span></div>';
      }
      if (rv === 'approved' && !so && may('edit')){
        if (SVA_SOL === x.id){
          actions = card('الأجهزة المقترحة لهذه النقطة', itemPickerHtml()
              + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحفَظ الأسطرُ حلًّا للنقطة وتُعتمَد فورًا — فتدخل طبقةَ التركيب.')) + '</p>',
              btn('\u{1F4BE} ' + t('احفظ الحلَّ واعتمده'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
              + btn(t('لاحقًا'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
        } else {
          actions = '<div class="actions">' + btn('\u{1F527} ' + t('اقترح حلَّها الآن'),'btn-secondary btn-sm',' data-svsol="' + esc(x.id) + '"') + '</div>';
        }
      }
      if (rv === 'revisit' && may('approve')){
        actions = '<div class="actions">' + btn('\u2705 ' + t('اعتمدها رغم ذلك'),'btn-quiet btn-sm',' data-svappr="' + esc(x.id) + '"') + '</div>';
      }
      return cardRaw(head0, body + actions);
    }).join('')
    + (rows.length > 60 ? '<p class="hint">' + esc(t('يُعرَض ستون — ضيّق البحث لترى الباقي.')) + '</p>' : '')
    + '<p class="hint">' + esc(t('الردُّ لا يمحو بيانات الزيارة — يبقيها للمقارنة ويعيد النقطةَ إلى مهام المشرف بسببه. والاعتمادُ يُغلق مهمةَ الزيارة فتُحتسب نقاطُها.')) + '</p>';
    return html;
  })();
    if (cur === 'ready') return head + (function(){

      var L = asnReadyList('install');
      return stats([['جاهزة للتركيب — بانتظار الإسناد', N(L.length), L.length ? 'wrn' : 'ok']])
        + (L.length && may('approve')
            ? '<div class="actions" style="margin:0 0 10px">' + btn('\u26A1 ' + t('أسند الجاهزَ للتركيب الآن') + ' (' + nm(L.length) + ')','btn-primary btn-sm',' data-asnq="install"')
              + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-golayer="install"') + '</div>' : '')
        + (L.length
            ? cardFlush(t('جاهز للتركيب') + ' \u2014 ' + nm(L.length),
                table(['النقطة','الاسم','الحل','اعتُمد','إجراء'], capList(L, 200).map(function(x){
                  var so = solutionOf(x.id) || {}, r = STATE.recs[x.id] || {};
                  return [siteIdHtml(siteOf(x)), esc((x.name || '').slice(0, 30)),
                          '<span class="num">' + nm(Object.keys(so.items || so.lines || {}).length) + '</span> ' + esc(t('سطر')),
                          '<span class="num">' + esc(r.reviewAt ? fmtDate(r.reviewAt) : '—') + '</span>',
                          btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"')];
                })))
            : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا نقاطَ جاهزةً — ما يُعتمَد مع حلِّه يظهر هنا.')) + '</p>'));
    })();
    if (cur === 'chal') return head + (function(){
    var L = chalSitesQ(), open = L.filter(function(x){ return !x.closed; });

    return stats([['إفاداتٌ مسجَّلة', N(L.length), 'acc'],
                  ['بانتظار حل', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['أُغلقت بالتركيب', N(L.length - open.length), 'ok']])

      + (L.length
        ? cardFlush(t('الإفادات') + ' — ' + nm(L.length),
            table(['النقطة','التحديات','الملاحظة','المُفيد','الحالة'],
              capList(L, 200).map(function(x){
                return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                          + esc(((x.site && x.site.name) || '').slice(0, 28)) + '</span>',
                        x.chals.map(function(c){ return pill(c, 'warn'); }).join(' '),
                        esc(x.note || '—'), esc(dispName(x.by) || '—'),
                        x.closed ? pill('أُغلقت بالتركيب', 'ok') : pill('بانتظار حل', 'wrn')];
              })))
        : card('لا إفاداتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور تسجيل تحدٍّ أثناء المسح الميداني — «حالة الموقع» في نموذج المسح.'))
            + '</p>'))

      + '<p class="hint">' + esc(t('التحديات تُسجَّل أثناء المسح («المسح الميداني»)، وتُغلَق تلقائيًّا حين تُعتمَد تركيبتُها — لا يدويًّا.')) + '</p>';
  })();

if (cur === 'stuck' || cur === 'idle') return head + (function(){
    var ONLY = cur;
    var L = stuckList().filter(function(x){ return ONLY === 'stuck' ? x.blocked : !x.blocked; });
    var blocked = L.filter(function(x){ return x.blocked; });
    var stuck7  = L.filter(function(x){ return !x.blocked && x.days >= 7 && x.days < 14; });
    var stuck14 = L.filter(function(x){ return !x.blocked && x.days >= 14; });
    var oldest = L.length ? L[0] : null;

    var open = blocked.filter(function(x){ return !x.accepted; }), accepted = blocked.filter(function(x){ return x.accepted; });

    var chips = ONLY === 'stuck'
      ? [['','الكل',L.length],['open','يحتاج قرارًا',open.length],['ok','عذرٌ مقبول',accepted.length]]
      : [['','الكل',L.length],['w7','راكدٌ أسبوعًا فأكثر',stuck7.length + stuck14.length],['w14','راكدٌ أسبوعين فأكثر',stuck14.length]];
    var show = L.filter(function(x){
      if (ONLY === 'stuck'){
        if (STK_F === 'open') return !x.accepted;
        if (STK_F === 'ok') return x.accepted;
        return true;
      }
      if (STK_F === 'w7') return x.days >= 7;
      if (STK_F === 'w14') return x.days >= 14;
      return true;
    });
    var rows = [];
    capList(show, 200).forEach(function(x){
      var r = x.rec, isOpen = STK_OPEN === x.id;
      rows.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                 x.blocked ? (x.accepted ? pill('متعذّر — مقبول', 'ok') : pill(r.access || 'متعذّر', 'bad')) : pill('راكد بانتظار التركيب', 'wrn'),
                 '<span dir="auto">' + esc((x.blocked ? (r.reason || r.note || '—') : t(idleStep(x.id).why)).slice(0, 60)) + '</span>',
                 nm(x.days) + ' ' + t('يوم'),
                 esc(dispName(r.by) || '—') + (photoCount(x.id) ? ' <span class="hint" style="margin:0">\u{1F4F7}' + nm(photoCount(x.id)) + '</span>' : ''),
                 btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-stkopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen) rows.push({ raw: stuckPanel(x) });
    });
    return stats([['متعذّر يحتاج قرارًا', N(open.length), open.length ? 'bad' : 'ok'],
                  ['متعذّر مقبول', N(accepted.length), 'ok'],
                  ['راكد ٧–١٤ يومًا', N(stuck7.length), stuck7.length ? 'wrn' : 'ok'],
                  ['راكد أكثر من أسبوعين', N(stuck14.length), stuck14.length ? 'bad' : 'ok'],
                  ['أقدم عنصر', oldest ? (nm(oldest.days) + ' ' + t('يوم')) : '—']])
      + '<div class="chips">' + chips.map(function(c){ return '<button type="button" class="chip' + (STK_F === c[0] ? ' on' : '') + '" data-stkf="' + c[0] + '">' + esc(t(c[1])) + ' <span class="num">' + nm(c[2]) + '</span></button>'; }).join('') + '</div>'
      + (show.length
        ? cardFlush(t('القائمة') + ' — ' + nm(show.length),
            table(['النقطة','الحالة','السبب / الملاحظة','منذ','المشرف / الفني',''], rows))
        : alertBox('success','لا عناصرَ في هذه الخانة الآن.'))
      + '<p class="hint">' + esc(t('المتعذّر: وصل المشرفُ ولم يستطع المسح — يُراجَع بصوره وسببه ويُقرَّر فيه: يعود لزيارةٍ أخرى، أو يُقبَل التعذّرُ بحُجّةٍ مكتوبة. والراكد: زيارةٌ تمّت ولم تُركَّب نقطتُه بعد.')) + '</p>';
  })();
    return head + (function(){

    var O = mfuObstaclesF(), byCat = {}, ed = rankOf(ROLE) >= rankOf('engineer');
    O.forEach(function(o){ o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; }); });
    var cats = Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; });
    var nr = O.filter(function(o){ return o.cats.indexOf('تعذّر الوصول') > -1; }).length;
    return mfuFilterRow()
      + stats([['نقاطٌ فيها معوقات', N(O.length), O.length ? 'wrn' : 'ok'],
               ['أنواع التحديات', N(cats.length)],
               ['متعذّر الوصول', N(nr), nr ? 'wrn' : 'ok']])
      + (cats.length
        ? cardFlush(t('التحديات') + ' \u2014 ' + esc(t('اضغط التحدي ترى نقاطه')),
            table(['التحدي', 'كم نقطة', 'الجهة', ''],
              cats.map(function(c){ return ['<button type="button" class="btn btn-quiet btn-sm" data-chalpop="' + esc(c) + '" style="white-space:normal;text-align:start">' + esc(t(c)) + '</button>' + chalAssignBox(c) + chalUpdBox(c), N(byCat[c]), esc(t(mfuPartyLabel(mfuOwnerOf(c)))), btn('\u25B8 ' + t('النقاط'), 'btn-secondary btn-sm', ' data-chalpop="' + esc(c) + '"')]; }))
            + '<div style="padding:8px 12px">' + btn(t('كل النقاط') + ' (' + nm(O.length) + ')', 'btn-quiet btn-sm', ' data-chalpop="*"') + '</div>')
        : alertBox('success', 'لا معوقاتٍ في هذا الفلتر.'))
      + (ed ? chalOtherCard() : '')
      + '<p class="hint">' + esc(t('المعوقات تُقرأ من المسح الميداني للنقاط غير المركَّبة وتُغلَق تلقائيًّا عند التركيب — والأرقامُ هنا هي نفسُها في متابعة الوزارة.')) + '</p>';
  })();
  }};

function pilotRows(){
  var idx = taskIndex();
  return (STATE.sites || []).filter(function(x){ return x.pilot; }).map(function(x){
    var id = x.id, r = STATE.recs[id], ins = STATE.inss[id], dis = STATE.diss && STATE.diss[id], hd = (typeof handOf === 'function') ? handOf(id) : null;
    var tk = idx[id + '|install'];
    var st = [
      ['تمت الزيارة', svVisited(r) ? +r.at : 0],
      ['أُسند التركيب', tk ? +(tk.at || tk._at || 0) : 0],
      ['رُكّبت',      ins && ins.status === 'مُركّب' ? +ins.at : 0],
      ['دُقّقت',      ins && ins.approved ? +(ins.qaAt || ins._at || ins.at) : 0],
      ['سُلّمت',      hd ? +(hd.at || 0) : 0],
      ['فُكّت',       dis && dis.status === 'تم الفك' ? +dis.at : 0]
    ];
    return { x:x, life:lifeOf(x), st:st };
  });
}
function pilotCard(){
  var R = pilotRows(); if (!R.length) return '';
  var span = function(a, b){ if (!a || !b || b < a) return '—'; var h = (b - a) / 36e5; return h < 48 ? nm(Math.round(h)) + ' ' + t('س') : nm(Math.round(h / 24)) + ' ' + t('يوم'); };
  return card('التركيبُ التجريبي — الزمنُ بين المراحل',
    '<p class="hint" style="margin-top:0">' + esc(t('نقاطٌ جُعلت «نقاطَ تجربة» من نافذتها. الأرقامُ من وثائق المسح والتركيب والتسليم والفكّ نفسِها.')) + '</p>'
    + '<div style="overflow:auto"><table class="tbl"><thead><tr><th>' + esc(t('النقطة')) + '</th><th>' + esc(t('الحالة')) + '</th>'
    + R[0].st.map(function(p){ return '<th>' + esc(t(p[0])) + '</th>'; }).join('') + '<th>' + esc(t('إسناد←تركيب')) + '</th><th>' + esc(t('تركيب←تدقيق')) + '</th><th>' + esc(t('تدقيق←تسليم')) + '</th></tr></thead><tbody>'
    + R.map(function(o){ var s2 = o.st;
        return '<tr><td>' + siteIdHtml(o.x) + '</td><td>' + pill(t((LIFE[o.life] || LIFE.todo).n), '') + '</td>'
          + s2.map(function(p){ return '<td class="num">' + (p[1] ? esc(fmtDT(p[1])) : '—') + '</td>'; }).join('')
          + '<td class="num">' + span(s2[1][1], s2[2][1]) + '</td><td class="num">' + span(s2[2][1], s2[3][1]) + '</td><td class="num">' + span(s2[3][1], s2[4][1]) + '</td></tr>'; }).join('')
    + '</tbody></table></div>');
}
PAGE.dis = { m:'المتابعة', t:'الفك والمراحل',
  l:'ما بعد الموسم: فكُّ ما رُكِّب، وسلسلةُ المراحل التي مرّت بها كلُّ نقطة.',
  body:function(){
    var head = tabHead('dis'), cur = tabCur('dis');
    if (cur === 'chain') return head + pilotCard() + (function(){
    var R = chainRows();
    return '<p class="lede" style="margin:0 0 16px">'
      + esc(t('الأعدادُ ليست نهائيةً بطبعها: المواقعُ لم تُمسَح بعدُ فما يُفَكُّ يزيد، وحاجةُ التهيئة لا تُعرَف إلا بعد المسح، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب. فأساسُ كلِّ مرحلةٍ هنا هو منجَزُ ما قبلها — يكبر بكبره ويقف بوقوفه.'))
      + '</p>'

      + cardFlush('السلسلة',
          table(['المرحلة','أساسُها','عددُ الأساس','منجَز','المتبقّي','النسبة'],
            R.map(function(x){
              var left = Math.max(0, (x.baseN || 0) - x.done);
              var pc = x.baseN ? Math.round(x.done * 100 / x.baseN) : 0;
              return ['<strong>' + esc(t(x.n)) + '</strong>',
                      esc(t(x.base)),
                      x.baseN ? N(x.baseN) : '<span class="hint" style="margin:0">'
                        + esc(t('بانتظار ما قبله')) + '</span>',
                      N(x.done),
                      x.baseN ? N(left) : '—',
                      x.baseN ? pct(x.done, x.baseN) : '—'];
            })))

      + R.map(function(x){
          return card(x.n, '<p class="hint" style="margin:0">' + esc(t(x.d)) + '</p>');
        }).join('')

      + '<p class="hint">' + esc(t('لا يُقدَّر عددُ مرحلةٍ قبل أن يقع أساسُها. ومن أراد تقديرًا مبكّرًا فليقرأه من المواقع المسجَّلة — ويعلم أنه سقفٌ لا التزام.')) + '</p>';
  })();
    return head + (function(){
    var L = Object.keys(STATE.diss || {}).map(function(id){ return STATE.diss[id]; });
    var eligible = Object.keys(STATE.inss).filter(function(id){
      var r = STATE.inss[id];
      return r.status === 'مُركّب' && r.approved && !(STATE.diss && STATE.diss[id]);
    }).length;
    var sched = L.filter(function(x){ return x.status === 'مجدول'; }).length;
    var done  = L.filter(function(x){ return x.status === 'تم الفك'; }).length;
    var returned = STATE.moves.filter(function(m){
      return m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف';
    }).length;

    return stats([['مُركّب قابل للفك', N(eligible)],
                  ['فك مجدول', N(sched), sched ? 'wrn' : ''],
                  ['تم الفك', N(done), 'ok'],
                  ['عُهدة مرتجعة', N(returned)]])
      + card('دورة الفك', flow(['مُركّب','فك مجدول','تم الفك','أُرجعت العُهدة'], done ? 3 : (sched ? 1 : 0))
        + '<p class="hint">' + esc(t('عند «تم الفك» تُفتح نافذة إرجاع العُهدة مبنيةً على قطع النقطة المعتمدة: السليم يعود متاحًا والتالف يُعزل.')) + '</p>')
      + (L.length
        ? cardFlush(t('سجلّ الفك') + ' — ' + nm(L.length),
            table(['النقطة','الحالة','الحالة الفنية','بواسطة','التاريخ'],
              L.sort(function(a,b){ return (b.at||0)-(a.at||0); }).slice(0,200).map(function(x){
                return [siteIdHtml(siteOf(x)),
                        pill(x.status, x.status === 'تم الفك' ? 'ok' : 'wrn'),
                        x.cond ? pill(x.cond, x.cond === 'تالف' ? 'bad' : 'ok') : '—',
                        esc(dispName(x.by) || '—'),
                        '<span class="num">' + esc(fmtDate(x.at||0)) + '</span>'];
              })))
        : '');
  })();
  }};

function svReopen(id, reason, note){
  if (!may('edit')){ toast(t('إعادةُ تصنيف الزيارة تحتاج صلاحية تعديل')); return; }
  var r = STATE.recs[id];
  if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return; }
  if (!reason){ toast(t('اختر سبب التعذّر')); return; }
  var ins = STATE.inss && STATE.inss[id];
  if (ins && ins.status === 'مُركّب' && ins.approved){
    toast(t('النقطةُ مُركّبةٌ ومعتمدةٌ بالفعل — لا تُعاد إلى المسح')); return;
  }
  r.access = reason;
  r.reopenNote = String(note || '').trim();
  r.reopenBy = STATE.meta.name || '';
  r.reopenAt = Date.now();
  CORE.set('recs', id, r);
  logEvent('إعادة تصنيف زيارة كمتعذّرة — ' + id + ' \u00b7 ' + reason
           + (r.reopenNote ? (' \u00b7 ' + r.reopenNote) : ''));
  toast(id + ' \u00b7 ' + t('أُعيدت للقائمة — تحتاج زيارةً ثانية'));
  SURV_REOPEN = '';
  statBump();
  render(1);
}

function wfStep(n, who, what, page){
  var jump = '';
  if (page && seesPage(PARENT[page] || page)){
    var pm = pageMeta(page);
    jump = '<div style="margin-top:6px">' + btn('\u{1F4CD} ' + esc(t(pm ? pm.t : page)),
      'btn-secondary btn-sm', ' data-p="' + esc(page) + '"') + '</div>';
  }
  return '<div class="list-item" style="align-items:flex-start"><div class="li-main">'
    + '<div class="li-t"><span class="num">' + nm(n) + '.</span> ' + esc(t(what)) + '</div>'
    + '<div class="li-s">' + esc(t(who)) + '</div>' + jump
    + '</div></div>';
}

function wfDiagram(){
  var rows = [
    { t:'دورة الزيارة', k:['todo','assigned','visited','ready'], why:'الرَّدُّ يعيدها إلى «تحتاج زيارةً أخرى» ثم تعود مسارَها.' },
    { t:'دورة التركيب', k:['ready','sched','installed'], why:'لا جدولةَ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.' },
    { t:'بعد التركيب',  k:['installed','maint','dis'], why:'الصيانةُ في أثناء الموسم، والفكُّ بعده — كلاهما يُسنَد كما يُسنَد التركيب.' }
  ];

  var wrap = function(txt, per, lines){
    var w = String(txt || '').split(/\s+/), out2 = [], cur = '';
    for (var i = 0; i < w.length; i++){
      var nx = cur ? cur + ' ' + w[i] : w[i];
      if (nx.length > per && cur){ out2.push(cur); cur = w[i]; if (out2.length === lines - 1) break; }
      else cur = nx;
    }
    if (cur && out2.length < lines) out2.push(cur);
    var rest = w.slice(out2.join(' ').split(/\s+/).length).join(' ');
    if (rest && out2.length === lines) out2[lines - 1] = (out2[lines - 1] + ' …');
    return out2;
  };
  var W = 900, bw = 196, bh = 82, gap = 22, out = '';
  var y = 8;
  rows.forEach(function(r){
    out += '<text x="' + (W - 6) + '" y="' + (y + 14) + '" text-anchor="end" '
        +  'font-size="15" font-weight="700" fill="var(--ink)">' + esc(t(r.t)) + '</text>';
    y += 26;
    var n = r.k.length;
    var total = n * bw + (n - 1) * gap;
    var x0 = W - Math.round((W - total) / 2) - bw;
    r.k.forEach(function(key, i){
      var L = LIFE[key] || LIFE.todo;
      var x = x0 - i * (bw + gap);
      var nm2 = wrap(t(L.n), 20, 2), ds = wrap(t(L.d), 26, 3);
      out += '<rect x="' + x + '" y="' + y + '" rx="10" width="' + bw + '" height="' + bh + '" '
          +  'fill="' + L.c + '" fill-opacity="0.18" stroke="' + L.c + '" stroke-width="2"/>'
          +  '<circle cx="' + (x + bw - 13) + '" cy="' + (y + 15) + '" r="5.5" fill="' + L.c + '"/>'
          +  nm2.map(function(ln, j){
               return '<text x="' + (x + bw - (j ? 12 : 25)) + '" y="' + (y + 19 + j * 15) + '" text-anchor="end" '
                 + 'font-size="12.5" font-weight="700" fill="var(--ink)">' + esc(ln) + '</text>';
             }).join('')
          +  ds.map(function(ln, j){
               return '<text x="' + (x + bw - 12) + '" y="' + (y + 22 + nm2.length * 15 + j * 13) + '" text-anchor="end" '
                 + 'font-size="10.5" fill="var(--ink-soft)">' + esc(ln) + '</text>';
             }).join('');
      if (i < n - 1){
        var ax = x - gap + 4, ay = y + bh / 2;
        out += '<line x1="' + (ax + gap - 8) + '" y1="' + ay + '" x2="' + (ax + 4) + '" y2="' + ay + '" '
            +  'stroke="var(--ink-soft)" stroke-width="2"/>'
            +  '<polygon points="' + ax + ',' + ay + ' ' + (ax + 8) + ',' + (ay - 5) + ' ' + (ax + 8) + ',' + (ay + 5) + '" '
            +  'fill="var(--ink-soft)"/>';
      }
    });
    y += bh + 10;
    out += '<text x="' + (W - 6) + '" y="' + (y + 10) + '" text-anchor="end" font-size="11" '
        +  'fill="var(--ink-soft)">' + esc(t(r.why)) + '</text>';
    y += 30;
  });
  return card('\u{1F5FA} ' + t('رسمُ الدورة — بألوان الخريطة نفسِها'),
      '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + ' ' + y + '" width="100%" '
      + 'style="min-width:820px;height:auto" role="img" aria-label="' + esc(t('رسم دورة حياة النقطة')) + '">'
      + out + '</svg></div>'
      + '<div class="chips" style="margin:10px 0 0">' + LIFE_ORDER.map(function(k){
          return '<span class="chip"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;'
            + 'background:' + LIFE[k].c + ';margin-inline-end:6px"></i>' + esc(t(LIFE[k].n)) + '</span>';
        }).join('') + '</div>'
      + '<p class="hint" style="margin:10px 0 0">'
      + esc(t('اللونُ نفسُه على الخريطة: تفتح الخريطةَ فتعرف موضعَ كلِّ نقطةٍ من الدورة بنظرة.')) + '</p>');
}
function wfBody(){
  var visit = [
    ['المهندس','يُنشئ طلبَ زيارةٍ (SR) أو يُسنِد نقاطًا من الخريطة لمشرفٍ بموعد','req'],
    ['المشرف','يفتح «شغلي ← مهامي» فيجد نقاطَه — وعلى الخريطة نقاطُه بلونٍ لا يشبه نقاطَ غيره','mywork'],
    ['المشرف','يزور النقطةَ ويملأ نموذجَ المسح بصورتَيه وقياساته — أو يسجّل تعذُّرَ الوصول بسببه','svForm'],
    ['النظام','تُحفَظ الزيارةُ «بانتظار الاعتماد» — وتظهر فورًا في اعتماد الزيارات ببياناتها الجديدة','svappr'],
    ['المهندس','يعتمد الزيارةَ فتُغلَق مهمتُها وتُحتسب نقاطُها — أو يردُّها «تحتاج زيارةً أخرى» بسببٍ مكتوب','svappr'],
    ['المشرف','إن رُدَّت وجدها في مهامّه بسبب الردّ — يزورها ثانيةً وتُحفَظ جولةً ثانيةً تنتظر الاعتماد','mywork']
  ];
  var install = [
    ['المهندس','بعد اعتماد الزيارة يقترح حلَّها: الأصنافُ وكمّياتُها من الكتالوج — يدويًّا أو بنمطٍ جاهز','solution'],
    ['المهندس','يعتمد الحلَّ — فتدخل النقطةُ طبقةَ التركيب ولا يُقبَل طلبُ تركيبٍ (DR) قبل ذلك','solution'],
    ['المهندس','يُسنِد التركيبَ لفريقٍ من الخريطة أو «توزيع الفرق» — التركيبُ عملُ أيدٍ لا يدٍ واحدة','req'],
    ['الفريق','يركّب ويملأ نموذجَ التركيب: صورتا قبلُ وبعدُ، والسيريالاتُ، والقطعُ المستهلكة','insForm'],
    ['النظام','تُخصَم القطعُ من المخزون في دفتر الحركة — فلا يُخصَم شيءٌ مرتين ولا يضيع','invmv'],
    ['المهندس','يدقّق التركيبَ في «التدقيق الهندسي» فيعتمده — أو يفتح عدمَ مطابقةٍ إن وجد خللًا','qa'],
    ['النظام','بالاعتماد تصير النقطةُ «مُركّب» وتُحتسب نقاطُ الفريق — وتظهر خضراءَ على الخريطة','map']
  ];
  var after = [
    ['المهندس','ما رُكِّب يُخدَم في أثناء الموسم: يُسنَد نوعُ «صيانة» (MR) لفريقٍ بموعد — فتصير النقطةُ صفراء','req'],
    ['الفريق','ينفّذ الصيانةَ ويوثّقها، وتُغلَق مهمتُها باعتماد المهندس فتعود النقطةُ خضراء','mywork'],
    ['المهندس','بعد الموسم يُسنَد نوعُ «فك» (PR) — فتصير النقطةُ حمراءَ حتى تُرجَع عُهدتُها','req'],
    ['الفريق','يفكّ ويُرجع القطعَ بحالتها في «الفك والعُهدة» — فتُغلَق دورةُ النقطة','disp2']
  ];
  var follow = [
    ['الجميع','«أمس · الآن · غدًا»: ما انتهى، وما يجري الآن ومن يفعله وأين، وما جُدول لغد','now'],
    ['الجميع','الخريطةُ تلوّن الدورةَ كلَّها — لم يُزر · مُسند · مجدولٌ غدًا · مردود · ينتظر · معتمد','map'],
    ['المكتب','«الوتيرة والهدف» تجيب «هنلحق؟» بالأرقام: المطلوبُ يوميًّا والانتهاءُ المتوقَّع','pace'],
    ['المكتب','التقاريرُ التنفيذية: اللوحةُ ومركزُ التقارير والملخّصُ المالي — للتصدير والاجتماعات','exec']
  ];
  function cyc(title, icon, steps, note){
    var i = 0;
    return card(icon + ' ' + t(title),
        '<div class="list">' + steps.map(function(st){ i++; return wfStep(i, st[0], st[1], st[2]); }).join('') + '</div>'
        + (note ? '<p class="hint" style="margin:10px 0 0">' + esc(t(note)) + '</p>' : ''));
  }
  return wfDiagram()
    + cyc('دورة الزيارة — حتى تُعتمَد', '\u{1F50D}', visit,
        'لا تُحتسب زيارةٌ في المنجَز وهي مردودة — والاعتمادُ وحدَه يفتح بابَ الحل.')
    + cyc('دورة التركيب — حتى يكتمل', '\u{1F527}', install,
        'البواباتُ بالترتيب: لا حلَّ قبل اعتماد الزيارة، ولا طلبَ تركيبٍ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.')
    + cyc('بعد التركيب — الصيانة ثم الفك', '\u{1F6E1}', after,
        'الصيانةُ والفكُّ يُسنَدان بالمحرّك نفسِه: تُحدَّد النقاطُ من الخريطة، ويُختار النوع، ويُوضَع الموعد.')
    + cyc('المتابعة — من أين تُراقب', '\u{1F4CA}', follow, '');
}

function seedApply(){
  if (!may('settings')){ toast(t('بدءُ الموسم للمهندس وحده')); return; }
  var P = seedPlan(), n = 0;
  P.wRows.forEach(function(r){ if (!cfgGet('w', r.k)){ cfgSet('w', r.k, r.w); n++; } });
  Object.keys(P.vals).forEach(function(k){
    if (!cfgGet(k)){ cfgSet(k, null, P.vals[k]); n++; }
  });
  if (!cfgGet('tgtSurvey')){ cfgSet('tgtSurvey', null, P.tgtSurvey); n++; }
  if (!cfgGet('dueSurvey')){ cfgSet('dueSurvey', null, P.dueS); n++; }
  if (!cfgGet('dueInstall')){ cfgSet('dueInstall', null, P.dueI); n++; }
  logEvent('بدء الموسم — كُتب مقترحٌ في ' + nm(n) + ' حقلًا');
  toast(nm(n) + ' ' + t('حقلًا كُتب بمقترحه — راجعه في شاشته'));
  statBump(); render(1);
  return n;
}

function bulkApply(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var rows = bulkParse(BULK_TXT).filter(function(r){ return !r.why; });
  if (!rows.length){ toast(t('لا سطرَ صالحٌ للكتابة')); return; }
  STATE.provision = STATE.provision || {};
  rows.forEach(function(r){
    var v = { name:r.name, user:r.user, role:r.role, pass:r.pass, status:'pending',
              at:Date.now(), by:STATE.meta.name || '' };
    if (r.job)   v.job   = r.job;
    if (r.crew)  v.crew  = r.crew;
    if (r.email) v.email = r.email;
    if (r.reissue) v.reissue = true;
    STATE.provision[r.user] = v;

    if (!r.reissue)
      STATE.users[r.user] = { name:r.name, user:r.user, role:r.role, active:true, at:Date.now(), provisioning:true };
    CORE.set('provision', r.user, v);
  });
  provKick();
  logEvent('طلبُ حساباتٍ جماعيّ — ' + nm(rows.length) + ' حسابًا');
  toast(nm(rows.length) + ' ' + t('طلبًا كُتب — يُنشئها الخادمُ خلال دقائق، ثم صدِّر ورقةَ الدخول'));
  BULK_TXT = ''; statBump(); render(1);
}

function ghSetToken(v){
  if (!may('roles')){ toast(t('مفتاحُ التشغيل لمدير المشروع وحده')); return; }
  var tk = String(v || '').trim();
  CFG.gh = Object.assign({}, CFG.gh || {}, { tok:tk, at:Date.now() });

  CORE.set('ghcfg', 'gh', { tok:tk, at:Date.now() });
  toast(tk ? t('حُفظ مفتاحُ التشغيل') : t('مُسح المفتاح'));
}

function provWipe(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var n = 0;
  provList().forEach(function(r){
    if (r.status === 'done' && r.pass){
      var v = Object.assign({}, STATE.provision[r.key], { pass:'' });
      STATE.provision[r.key] = v; CORE.set('provision', r.key, v); n++;
    }
  });
  logEvent('مسحُ كلمات المرور من الطلبات — ' + nm(n));
  toast(nm(n) + ' ' + t('كلمةً مُسحت — الورقةُ المصدَّرةُ هي النسخةُ الوحيدة'));
  render(1);
}

function provClear(){
  if (!may('users')){ toast(t('مسحُ الطلبات للمهندس فما فوق')); return; }
  var n = 0;
  provList().forEach(function(r){

    if (r.status === 'done' || r.status === 'error'){
      delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    }
  });
  logEvent('مسحُ طلبات الإنشاء المنتهية — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا مُسح'));
  render(1);
}

function provSync(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return Promise.resolve(false); }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return Promise.resolve(false); }
  toast(t('يُجلَب من القاعدة…'));
  return DB.col('provision').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    var cloud = {}; sn.forEach(function(d){ cloud[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    var local = STATE.provision || {}, dropped = 0;
    Object.keys(local).forEach(function(k){ if (!cloud[k]) dropped++; });
    STATE.provision = cloud;

    return DB.col('users').limit(500).get().then(function(us){
      FB.readCount = (FB.readCount || 0) + us.size;
      var U = STATE.users || {}, keepTemp = {};
      Object.keys(U).forEach(function(k){ if (U[k] && U[k].provisioning && !uidLike(k)) keepTemp[k] = U[k]; });
      var fresh = {}; us.forEach(function(d){ fresh[d.id] = d.data(); });
      FB.readCount = (FB.readCount || 0) + us.size;
      STATE.users = Object.assign(fresh, keepTemp);
      return { sn:sn, cloud:cloud, dropped:dropped };
    });
  }).then(function(r){
    var sn = r.sn, cloud = r.cloud, dropped = r.dropped;

    var U = STATE.users || {}, gone = 0;
    Object.keys(U).forEach(function(k){
      var u = U[k]; if (!u || !u.provisioning || uidLike(k)) return;
      var pr = cloud[k] || cloud[u.user || ''];
      if (!pr || pr.status !== 'pending'){ delete U[k]; gone++; }
    });
    CORE.saveSoon(); statBump(); render(1);
    toast(nm(sn.size) + ' ' + t('طلبًا من القاعدة') + ' \u00b7 ' + nm(dropped) + ' ' + t('محليًّا لم يكن هناك') + ' \u00b7 ' + nm(gone) + ' ' + t('صفًّا مؤقتًا أُزيل'));
    logEvent('جلبُ الطلبات من القاعدة — ' + nm(sn.size) + ' · أُسقط ' + nm(dropped) + ' · أُزيل ' + nm(gone));
    return true;
  }).catch(function(e){ softErr('جلب الطلبات', e, 'تعذّر الجلبُ من القاعدة'); return false; });
}
function provCancelAll(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return; }
  var n = 0, U = STATE.users || {};
  provList().forEach(function(r){
    if (r.status !== 'pending') return;
    delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    var un = String(r.user || r.key || '');
    if (un && U[un] && U[un].provisioning) delete U[un];
  });

  if (STATE.queue) STATE.queue = STATE.queue.filter(function(q){ return !(q && q.kind === 'provision' && q.v && q.v.status === 'pending'); });
  PROV_CANCEL = 0; CORE.saveSoon(); statBump();
  logEvent('إلغاءُ الطلبات المعلّقة — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا أُلغي'));
  render(1);
}

function provReask(uid){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا صفَّ مؤقتًا')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, pass:pass, role:u.role || 'tech', roleExplicit:true, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  ['job','sup','dept','email','crew'].forEach(function(k){ if (u[k]) req[k] = u[k]; });
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادةُ طلب إنشاء — ' + (u.name || u.user) + ' (' + u.user + ')');

  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}

var RELEASE_NOTES = [

  { v:'V38.75', d:'2026-10-22', notes:[
      'قوائم المتابعة والعوائق: لا «[object Object]» والأرقام بنوع النقطة صحيحة، وعمود الصور صور الزيارة، واسم أي نقطة في أي قائمة يفتحها على الخريطة' ] },
  { v:'V38.74', d:'2026-10-22', notes:[
      'البحث: ما يُكتب لا يُمحى، ويبحث أثناء الكتابة — وصور الزيارة: استرجاع المحذوف، وحمايتها بعد الاعتماد، ولا حذف موروث' ] },
  { v:'V38.73', d:'2026-10-22', notes:[
      'صور الزيارة تظهر في شاشة المسح ولو كانت صور التركيب على الهاتف' ] },
  { v:'V38.72', d:'2026-10-22', notes:[
      'قطع الصيانة تصل دفتر المخزن في المكتب، وحارس يمنع أي حركة مخزن محلية بلا كتابتها في الدفتر' ] },
  { v:'V38.71', d:'2026-10-22', notes:[
      'حالة التركيب بإملاء واحد: «مركب» و«مُركّب» تُعدّ واحدًا في كل الشاشات (الوزارة والمتابعة واللوحة)' ] },
  { v:'V38.70', d:'2026-10-22', notes:[
      'نقل زيارة حُفظت على نقطة خطأ إلى نقطتها الصحيحة (بصورها)، وصور التركيب الملغى لا تُعرض صورًا للنقطة' ] },
  { v:'V38.69', d:'2026-10-22', notes:[
      'دفتر المخزن يصل المكتب فعلًا (كل حركة تركيب وفك وثيقتها) + تسوية بضغطة، ولا «أول نقطة» بديلًا في النافذة وصفحة النقطة والفرق' ] },
  { v:'V38.68', d:'2026-10-22', notes:[
      'إصلاح عاجل: النموذج بلا نقطة كان يحفظ على أول نقطة في السجل (مخيم عرفات ٠٠٠١) — وأداة إلغاء التركيب المسجّل خطأً' ] },
  { v:'V38.67', d:'2026-10-22', notes:[
      'صور التركيب تظهر فعلًا (توقيت النقل للأجهزة)، والمحادثة على النقاط المجدولة للتركيب فقط، و«سجل المحادثات» للإدارة بفلاتر' ] },
  { v:'V38.66', d:'2026-10-21', notes:[
      'جولة الزائر: كل دور وكل شاشة وشريحة تُفتح وFirebase قائم كما على الهاتف — حارس دائم قبل زيارة الوزارة' ] },
  { v:'V38.65', d:'2026-10-21', notes:[
      'المحادثة كتطبيق مراسلة: قائمة محادثات بالنقاط والأشخاص، ومحادثة مفتوحة بفقاعاتها، وإشعار «بدأ التركيب» و«اكتمل»، وكل مدير يرى ما تحته' ] },
  { v:'V38.64', d:'2026-10-21', notes:[
      'إصلاح عاجل: النقطة المركّبة (الخضراء) لا تستجيب للضغط وتقول خطأ — كان سببه فحص جاهزية Firebase في عرض الصور' ] },
  { v:'V38.63', d:'2026-10-21', notes:[
      'التركيب يخصم من المستودع مباشرة حين لا عهدة عند المنفّذ، وسجل التركيب لايف في المحادثات' ] },
  { v:'V38.62', d:'2026-10-21', notes:[
      'المسح للتوريد والتركيب للمستودع: خصم صافٍ لكل نقطة بلا تكرار، وجدول المعتمد مقابل الوارد والمخزون والمركّب — وصور التركيب تظهر للمكتب خلال ثوانٍ' ] },
  { v:'V38.61', d:'2026-10-21', notes:[
      '«تعديل التركيب» كما «تعديل المسح»: الحالة والقطع والسيريالات والصور حذفًا وإضافة — والصور في نافذة الخريطة بحسب وضعها' ] },
  { v:'V38.60', d:'2026-10-21', notes:[
      'محادثة الميدان: المهندس في المكتب والمنفّذ في الموقع على نقطة بعينها أو مباشرة، والحفظ والاعتماد يكتبان سطورهما — و«متعذّر» و«قيد التركيب» لهما لونهما' ] },
  { v:'V38.59', d:'2026-10-21', notes:[
      'التدقيق الهندسي يعرض السيريالات وصور التركيب في صف القرار، والردّ يحمل سببه إلى المنفّذ' ] },
  { v:'V38.58', d:'2026-10-21', notes:[
      'لون النقطة يطابق حالة تركيبها، وصور التركيب في نافذة النقطة، والوسم السريع «مركب» للمهندس وحده، وضغطة الحالة لا تُبتلع' ] },
  { v:'V38.57', d:'2026-10-21', notes:[
      'التركيب يصل المكتب: قاعدة قاعدة البيانات كانت ترفض كل تركيب يحفظه الميدان على نقطة حلّها معتمد' ] },
  { v:'V38.56', d:'2026-10-21', notes:[
      'دورة التركيب للمُسنَد إليه: «مهامي» تفهم التركيب وتفتح نموذجه، والاعتماد يغلق المهمة، والسيريال المكرر يوقف الحفظ' ] },
  { v:'V38.55', d:'2026-10-21', notes:[
      'الأخطاء المبتلعة صارت مسجّلة لا صامتة، والمتغيرات المحلية غير المستعملة مسقوفة، وقواعد الكود الجديد مكتوبة' ] },
  { v:'V38.54', d:'2026-10-20', notes:[
      'المكتبات من نسخة التطبيق لا من الإنترنت: الدخول والإكسل والـPDF يعملون بلا شبكة من أول مرة' ] },
  { v:'V38.53', d:'2026-10-20', notes:[
      'صفحة بوابة القطار تعود إلى محطتها، وبطاقة المحطة تصدّر بواباتها إكسل — و«محطة AR1» شرطًا في التقارير' ] },
  { v:'V38.52', d:'2026-10-20', notes:[
      'دورة التقارير في دليل العمليات، والمساعد يرشد إلى المنشئ عند «إزاي أطلع تقرير»' ] },
  { v:'V38.51', d:'2026-10-20', notes:[
      'سجل «ما الجديد» يُحمَّل مع الجزء المؤجَّل لا في النواة — أول تحميل ٦١١ ← ٥٧٥ ك.ب' ] },
  { v:'V38.50', d:'2026-10-20', notes:[
      'التقارير الجاهزة: ستة تقارير لصحة البيانات تُضاف وتُثبَّت بنقرة' ] },
  { v:'V38.49', d:'2026-10-20', notes:[
      'التقارير المثبّتة: مفضّل مثبّت يُحسب عند كل فتح للمساعد ويُعرض برقمه وتغيُّره منذ آخر يوم' ] },
  { v:'V38.48', d:'2026-10-20', notes:[
      'مفضّلة التقارير المشتركة للفريق: المهندس فما فوق يحفظها في إعدادات الفريق فيراها الكلّ على كل جهاز' ] },
  { v:'V38.47', d:'2026-10-20', notes:[
      'منشئ التقارير: المهام الأسبوعية سكّانًا — متأخّرة / هذا الأسبوع / مفتوحة، بالمسؤول والمسار' ] },
  { v:'V38.46', d:'2026-10-20', notes:[
      'منشئ التقارير مضغوط على الهاتف: عمودان دائمًا، الأساسي ظاهر والباقي تحت «المزيد من الشروط»' ] },
  { v:'V38.45', d:'2026-10-20', notes:[
      'منشئ التقارير: التحديات والصور سكّانًا — شروط النقاط ثم كل تحدٍّ أو صورة بعددها وقائمتها وإكسلها' ] },
  { v:'V38.44', d:'2026-10-20', notes:[
      'الزمن شرطًا في التقارير: زيارة/تركيب في آخر ٧ أو ٣٠ يومًا، أو زيارة أقدم من ٣٠ يومًا' ] },
  { v:'V38.43', d:'2026-10-20', notes:[
      'منشئ التقارير في المساعد: أي تقرير نقاط من القوائم — يُرى ما فُهم قبل الحساب، وله العدد والقائمة وإكسل/PDF ومفضّلة' ] },
  { v:'V38.42', d:'2026-10-20', notes:[
      'أداة النشر قابلة للاستئناف — وتمرين تأهيل المطوّر الجديد وتحديث برومبت الجلسة' ] },
  { v:'V38.41', d:'2026-10-20', notes:[
      'مزدلفة ٢ أربع بوابات كما في الرسمة (٦٣ بوابة) — واختبار المتصفح ينتظر تخطيط أزرار النافذة' ] },
  { v:'V38.40', d:'2026-10-20', notes:[
      'قياس التحميل البارد عند أول شاشة قابلة للاستخدام لا بعد الجزء المؤجَّل' ] },
  { v:'V38.39', d:'2026-10-19', notes:[
      'نواة + جزء مؤجَّل: index.html للميدان أولًا وapp-office.js يلحق — أول تحميل ٧٨٤ ← ٦١١ ك.ب مضغوطًا' ] },
  { v:'V38.38', d:'2026-10-19', notes:[
      'المرحلة أ من «نواة + أجزاء»: ٦٣٤ تعريفًا تحتاجها النواة نُقلت حرفيًا من المكتب والوزارة والتقارير إلى src/03z-shared' ] },
  { v:'V38.37', d:'2026-10-19', notes:[
      'بوابات القطار في مواضعها المقروءة من مخططات سار صفحةً صفحة — وباسم رقمها على الرسمة' ] },
  { v:'V38.36', d:'2026-10-19', notes:[
      'بوابات القطار على صالة المحطة نفسها — لا على الجبل' ] },
  { v:'V38.35', d:'2026-10-19', notes:[
      'بوابات القطار موزّعة على سياج كل محطة كما في مخطط سار — لا فوق بعضها' ] },
  { v:'V38.34', d:'2026-10-19', notes:[
      'قطار المشاعر: ٦٢ بوابة إلكترونية نقاطًا في السجل عند مرجع محطتها (قرار المالك ق-٠٢٣)' ] },
  { v:'V38.33', d:'2026-10-19', notes:[
      'الملف المنشور بلا تعليقات: التحميل أخف بربع (١٠٤٠ ← ٧٨٤ ك.ب مضغوطًا) والمصدر كامل التعليقات' ] },
  { v:'V38.32', d:'2026-10-19', notes:[
      'تسليم الكود: رأس إنجليزي لكل ملف، ودليل مطوّر بالإنجليزية، والتعليقات الجديدة بالإنجليزية' ] },
  { v:'V38.31', d:'2026-10-19', notes:[
      'قطار المشاعر: ٩ محطات بإحداثيات مرجعية و٦٢ بوابة إلكترونية أولية بلا إحداثيات حتى تُحقَّق — ومهلة ما ينتظر الرفع ٧ أيام' ] },
  { v:'V38.30', d:'2026-10-19', notes:[
      'ما ينتظر الرفع: مهلة تجاهل يحددها المالك، وملف انتظار يُصدَّر من الجهاز ويُستورد عند المكتب' ] },
  { v:'V38.29', d:'2026-10-19', notes:[
      'التطبيق لا يكتب عنوانه بيد — تمهيدًا للدومين الخاص' ] },
  { v:'V38.28', d:'2026-10-19', notes:[
      'المصدر مجلّدات بالمجال — ٩٤ ملفًا بدل ١٧، بلا تغيير بايت واحد في الناتج، وخريطة كود مولَّدة وسقف ١٥٠٠ سطر' ] },
  { v:'V38.27', d:'2026-10-19', notes:[
      'التقارير بالكلام تفهم «موقع النقطة»' ] },
  { v:'V38.26', d:'2026-10-19', notes:[
      '«موقع النقطة» تحدٍّ بنفسه — كل ما ليس على مظلة — لكل النقاط عدا المخيمات ومراكز التفويج' ] },
  { v:'V38.25', d:'2026-10-19', notes:[
      'موقع النقطة بخيارات المالك الست، اختيار متعدد، للممرات والجمرات وكاميرات الوزارة' ] },
  { v:'V38.24', d:'2026-10-19', notes:[
      'الكوبري والنفق واللوحات للممرات ومسار الجمرات وحدها' ] },
  { v:'V38.23', d:'2026-10-19', notes:[
      'اختيار صريح في المسح: «لوحة استرشادية» في نوع التركيب، وحقل «موقع النقطة» (تحت كوبري · مدخل أو مخرج نفق)' ] },
  { v:'V38.22', d:'2026-10-19', notes:[
      'التحديات حسب الموقع في كل منطقة: تحت كوبري · مدخل أو مخرج نفق · لوحات استرشادية · بدون هيكل — الممرات والمخيمات منفصلة' ] },
  { v:'V38.21', d:'2026-10-19', notes:[
      'تحديات المسح أوضح وأسلس: إرشاد صريح، و«أخرى» مميّزة، والخطأ تحت الخانة، ورسالة حفظ واحدة' ] },
  { v:'V38.20', d:'2026-10-18', notes:[
      'فتح النقطة على الخريطة للمشرف، ووصف التحدي في تعديل المسح، و«أخرى» خيار بوصف مطلوب' ] },
  { v:'V38.19', d:'2026-10-18', notes:[
      'تحليل «حسب …» في التقارير بالكلام، والنفي كلمة مستقلة' ] },
  { v:'V38.18', d:'2026-10-18', notes:[
      'إصلاح الإنتاج: الاسم السابق في تذييل PDF التقارير، وأداة النشر تقرأ سقوط الشرائح وتقبل دمج القطار' ] },
  { v:'V38.17', d:'2026-10-18', notes:[
      'تقارير بالكلام: إكسل وPDF بلوجو أفاقي من شروط مكتوبة، من بيانات الجهاز' ] },
  { v:'V38.16', d:'2026-10-16', notes:[
      'مساعد البيانات: سيناريو في الجرد يحرس أرقامه، وسجل الأسئلة يبين ما يُجاب الآن ويُصدَّر' ] },
  { v:'V38.15', d:'2026-10-16', notes:[
      'مساعد البيانات: المهام المتأخرة والتحديات واعتماد الوزارة والإشغال الأعلى ورصيد صنف بلا حركات' ] },
  { v:'V38.14', d:'2026-10-15', notes:[
      'مساعد البيانات: أسئلة عن بيانات المشروع تُجاب بالرقم من الجهاز نفسه' ] },
  { v:'V38.13', d:'2026-10-15', notes:[
      'المخيمات المركزية مضغوطة للجوال: الحالة أولًا، والإعداد شريط بقسم واحد عند الطلب' ] },
  { v:'V38.12', d:'2026-10-15', notes:[
      'حالة النقاط من نظام البطاقات: الإشارة والأرقام والتحقق لكل نقطة مرتبطة' ] },
  { v:'V38.11', d:'2026-10-15', notes:[
      'أداة النشر الفوري بالترتيب الصحيح (release-now)' ] },
  { v:'V38.10', d:'2026-10-15', notes:[
      'قاعدة: لا ترقية يدوية بلا القائمة الكاملة (ق-٠٢٠)' ] },
  { v:'V38.9', d:'2026-10-15', notes:[
      'إصلاح جرد الإنتاج: نص أمر الجسر كان يطابق نمطًا يمنعه جرد خريطة المشاعر' ] },
  { v:'V38.8', d:'2026-10-15', notes:[
      'الاستمرارية: بطاقة «ما يعتمد على شخص» في صحة النظام بالبدائل المسمّاة' ] },
  { v:'V38.7', d:'2026-10-15', notes:[
      'حالة القارئ، واستبداله في نظام البطاقات باعتماد بضغطة، والنظرة العامة بتصميم النظام' ] },
  { v:'V38.6', d:'2026-10-15', notes:[
      'زر الإشارة المرجعية يشرح نفسه عند الضغط، وتعليمة إظهار الشريط' ] },
  { v:'V38.5', d:'2026-10-15', notes:[
      'جسر البطاقات: أول تشغيل حقيقي — النسخ يُحفظ قبل الانتظار، والناتج يُنزّل ملفًا يُرفع في التطبيق' ] },
  { v:'V38.4', d:'2026-10-15', notes:[
      'الاستمرارية داخل التطبيق: دورتا الجسر والربط في دليل العمليات' ] },
  { v:'V38.3', d:'2026-10-15', notes:[
      'الاستمرارية: ثلاثة قرارات معمارية جديدة وبرومبت الشات الجديد بالعملية الحالية' ] },
  { v:'V38.2', d:'2026-10-15', notes:[
      'اختبار المتصفح الحقيقي يضغط الملفات كالاستضافة فيقيس التحميل البارد واقعيًا' ] },
  { v:'V38.1', d:'2026-10-15', notes:[
      'لا طلب إلى نظام البطاقات من التطبيق بلا توكن — كان يُسقط اختبار المتصفح الحقيقي' ] },
  { v:'V38.0', d:'2026-10-15', notes:[
      'الاستمرارية: دليل التسليم بما استجدّ، وقفل البوابة الواحدة، وحارس YAML لسير السحابة' ] },
  { v:'V37.99', d:'2026-10-15', notes:[
      'المخزن بمفتاح واحد للصنف، والفك من «رُكّب» لا من العهدة، وسيناريوهات المخزن والوزارة والفك' ] },
  { v:'V37.98', d:'2026-10-15', notes:[
      'جرد الأداء يقيس بناء الشاشة وحجمها لا تحليل المحاكي' ] },
  { v:'V37.97', d:'2026-10-15', notes:[
      'الجودة أولًا: جرد السيناريوهات الخمسة وجرد الأداء بمعايرة الآلة' ] },
  { v:'V37.96', d:'2026-10-15', notes:[
      'إغلاق ثغرات الجودة: فحص مفاتيح الصلاحيات، وفحص الوسوم الظاهرة نصًّا، وفحص نموذج التركيب، وعزل فحص الختم' ] },
  { v:'V37.95', d:'2026-10-15', notes:[
      'الاكتشاف العكسي: مواقع في نظام البطاقات لا تقابلها نقطة عندنا' ] },
  { v:'V37.94', d:'2026-10-15', notes:[
      'ربط نظام البطاقات بلا كود: إشارة مرجعية بضغطة واستيراد ملف تصدير' ] },
  { v:'V37.93', d:'2026-10-14', notes:[
      'جسر نظام البطاقات: الطلب يخرج من موقع النظام نفسه ويُلصق ناتجه في التطبيق' ] },
  { v:'V37.92', d:'2026-10-14', notes:[
      'نقاط ملف ١٤٤٧ خارج السجل تُحفظ بعلم «ليست على الخريطة» وتُربط بنقطة أو تُوضع على الخريطة' ] },
  { v:'V37.91', d:'2026-10-14', notes:[
      'مستورد بيانات ١٤٤٧ يقرأ الأعمدة بعناوينها ويغطي النسخة الكاملة من ملف التسليمات' ] },
  { v:'V37.90', d:'2026-10-14', notes:[
      'إصلاح نموذج التركيب: أسماء القطع ومفاتيحها وكل قطع النوع، وتعبئته من بيانات ١٤٤٧' ] },
  { v:'V37.89', d:'2026-10-14', notes:[
      'تعديل الشبكة وعناوين الأجهزة وبيانات ١٤٤٧ من بطاقة بيانات الموقع، وإصلاح سطر الاعتماد' ] },
  { v:'V37.88', d:'2026-10-14', notes:[
      'استيراد بيانات موسم ١٤٤٧ من ملف تسليمات الممرات واقتراح الربط بقارئ ١٤٤٧' ] },
  { v:'V37.87', d:'2026-10-14', notes:[
      'الربط الجماعي بنظام البطاقات: مقترحات واعتماد بضغطة وكشف التعارض' ] },
  { v:'V37.86', d:'2026-10-14', notes:[
      'اسم الربط بنظام البطاقات: حقل صريح فريد على كل نقطة مع تحقق ثلاثي' ] },
  { v:'V37.85', d:'2026-10-14', notes:[
      'ربط المخيمات بنظام البطاقات برقم الشاخص والقرب، وتحذير عدم تطابق القارئ' ] },
  { v:'V37.84', d:'2026-10-14', notes:[
      'ربط البطاقات برقم قارئ مطبع ومصدر واحد لسجل النقاط في الأدوات' ] },
  { v:'V37.83', d:'2026-10-14', notes:[
      'حماية سجل النقاط — الخطوة الأولى: النشر في القاعدة والتخزين على الأجهزة' ] },
  { v:'V37.82', d:'2026-10-14', notes:[
      'أصناف التجربة: السعر في خانته لا بجوار الاسم' ] },
  { v:'V37.81', d:'2026-10-14', notes:[
      'لقطة المكتب: الوزارة ترى إشغال المخيمات بلا توكن' ] },
  { v:'V37.80', d:'2026-10-14', notes:[
      'كارت التجارب والديمو في متابعة الوزارة، ومراجعة أعمال اليومين' ] },
  { v:'V37.79', d:'2026-10-14', notes:[
      'صور التركيب: كاميرا أو معرض أو لاب، ومجلد تركيب مستقل على الدرايف' ] },
  { v:'V37.78', d:'2026-10-14', notes:[
      'تجهيزات نقطة الديمو: تاريخ كل تركيبة واعتماد القياسي' ] },
  { v:'V37.77', d:'2026-10-13', notes:[
      'نقاط التركيب: قراءة موحدة وإعادة احتساب بأثر رجعي معلن' ] },
  { v:'V37.76', d:'2026-10-13', notes:[
      'أصناف التجربة من الكتالوج: مشعر ونوع ثم قائمة قطع النوع' ] },
  { v:'V37.75', d:'2026-10-13', notes:[
      'تبويب المخيمات المركزية: إشغالٌ حيٌّ من نظام البطاقات — مطابقة برقم القارئ' ] },
  { v:'V37.74', d:'١٣ أكتوبر ٢٠٢٦', notes:[
      '«🔗 رابط القاعة»: رابط بيفتح عرض القاعة لوحده على جهاز القاعة بعد الدخول، والشاشة ما بتطفيش، والأرقام بتتحدّث كل ٥ دقايق، وساعة و«آخر تحديث» في الزاوية، والمؤشر بيختفي، وأول لمسة بتملا الشاشة. الزرار في شريط «متابعة / عرض القاعة» بينسخ الرابط أو يشاركه.',
      '«المشاكل المعروفة» في الإعدادات بقت كروت: الكلمات والحل والحالة (قائمة / حُلّت في إصدار كذا) ولمين تظهر (الكل / الميدان / الوزارة). المحلولة بتخرج من المساعد لوحدها. وفيها «جرّب سؤال» قبل الحفظ، و«تغطية المساعد» (نسبة أسئلة الفريق اللي ليها حل)، و«أضفها» من أي سؤال بلا جواب بتفتح كرت بكلماته جاهزة.' ] },
  { v:'V37.73', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'المظهر: الشكل القديم اتشال، و«غرفة التحكم» بقت هي «الافتراضي» لكل الأجهزة، و«هوية أفاقي» اسمها بقى «النهاري» (الفاتح). يعني اختيارين بس: الافتراضي والنهاري.',
      'تصحيح كلام في نموذج الموقع الجديد للميدان: كان بيقول إن الموقع الجديد «ما بيدخلش الأرقام لحد الاعتماد»، والصح إنه بيدخل الأرقام على طول وعليه علامة «جديد بانتظار الاعتماد».' ] },
  { v:'V37.72', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'صور الزيارة بقت ظاهرة في نافذة أي نقطة على الخريطة لكل الحسابات، والوزارة أولهم: صور مصغّرة بتتحمّل أول ما تفتح النقطة، وتضغط على أي صورة تتفتح كاملة. وزرار «◈ التفاصيل» بقى بيفتح صفحة التفاصيل للوزارة (كان بيرجّعها للخريطة).' ] },
  { v:'V37.71', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'نموذج النقطة الجديدة لحساب الوزارة بقى على قدّها: من غير «السبب» ولا «التحديات» ولا الصور (دي شغل المسح الميداني)، والشركة اختيارية، والزرار «🏛 أرسل المقترحة للمهندس»، وتحته: «لا تدخل الأرقام ولا التقارير قبل اعتماده».' ] },
  { v:'V37.70', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'الحساسات والجيت واي في منى بقوا زي باقي النقاط: لكل جهاز رقم خاص وبيانات (الغرفة، السيريال، الحالة: مخطط/مُركّب/معطّل، ملاحظة)، تضغط عليه تفتح نافذته وفيها «✎ عدّل». وتقدر تحرّكه وتضيف وتحذف حساسات، وتضيف جيت واي تاني للمخيم الكبير.',
      'لما تقسم مخيم، حساساته بتتوزّع على الأجزاء حسب مكانها وكل جزء بيتكمّل لـ١٢ لوحده (بيانات الأجهزة بتفضل زي ما هي). ولما تعدّل الحدود، أي حساس برّه بيتعلّم بالأحمر ومعاه «وزّعها من جديد». والمخيم اللي ملوش خطة: «ولّد خطة حساسات (١٢)». وجنب طبقة الحساسات عدّادها وزرار «إكسل الحساسات».' ] },
  { v:'V37.69', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'نقطة الوزارة المقترحة بقت فعلًا برّه الأرقام والتقارير والإكسل لحد ما المهندس يعتمدها (في ٣٧٫٦٨ كانت بتتحسب). بتظهر على الخريطة بعلامة بنفسجية «🏛 مقترحة من الوزارة» للكل، والوزارة بتشوف مقترحاتها حتى بعد ما تقفل التطبيق.',
      'للمهندس: شريحة «🏛 مقترحات الوزارة» فوق الخريطة بعددها وقائمتها، وفي نافذة أي مقترحة «✅ اعتمدها نقطةً رسمية» (تدخل الأرقام فورًا وتتجدول زيارتها) أو «✕ ارفضها». وللوزارة: «بانتظار اعتماد المهندس». وجرد ثابت بيتأكد من الحساب قبل الاعتماد وبعده.' ] },
  { v:'V37.68', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'حساب الوزارة على الخريطة: بيشوف كل النقاط وكل الفلاتر وأدوات العرض، ويقدر يضيف نقطة بـ«📌 نقطة هنا» أو «+ موقع غير مسجّل» من غير صور إلزامية. النقطة بتدخل «مقترحة من الوزارة» والمهندس يعتمدها قبل ما تبقى رسمية في الأرقام والتقارير. وأدوات الرسم والإسناد والتحديد والتعديل تفضل للمهندس.' ] },
  { v:'V37.67', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      '«✂ قسّم المخيم» في نافذة المخيم (للمهندس فما فوق، وللمخيمات بس): تختار عدد الأجزاء من ٢ لـ٦ وتشوف التقسيم على الخريطة قبل الحفظ (أجزاء متساوية المساحة على طول المخيم)، وبعد الحفظ تظبط حدود كل جزء بـ«عدّل الحدود».',
      'الجزء الأول بيفضل برقم المخيم وبياناته ومسحه، والباقي مخيمات جديدة برقمه + B وC (محتاجة مسح) بنفس المشعر والشركة والمربع. وأي زيادة أو نقص في المخيمات بيتغيّر في كل الأرقام والتقارير والإكسل لوحده.' ] },
  { v:'V37.66', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'لما تعدّل حدود مخيم وتحفظ، الرسمة على الخريطة بتتغيّر فورًا بالحدود الجديدة (كانت بتفضل القديمة لحد ما التطبيق يتقفل ويتفتح).' ] },
  { v:'V37.65', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      '«تنبيهات الأسبوع» فوق ملخص متابعة الوزارة — ٣ تنبيهات بحد أقصى، وكل واحد بيفتح نافذته وإكسله: «دعم من الوزارة» (مهام جهتها الوزارة وموعدها خلال أسبوع أو فات)، و«تحتاج تنسيق مع الجهة المالكة — جديدة هذا الأسبوع»، و«جاهزة لاعتماد الوزارة». لو مفيش حاجة الشريط مش بيظهر، ومخفي في عرض القاعة.' ] },
  { v:'V37.64', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'توحيد الأسامي والأرقام بين الخريطة واللوحات: «معالجة التحديات» بقت بنفس الأرقام في فلتر الخريطة والملخص وتبويب التحديات (كل نقطة في مجموعة واحدة بأهم تحدي فيها)، وبأسامي المالك نفسها. والحالات اللي معناها واحد بقت بنفس الاسم واللون: مُركّبة، مجدولة للتركيب، تحتاج زيارة أخرى، لم تُزر.' ] },
  { v:'V37.63', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'التبويبات الخمسة: كل مربع بيفتح نافذة عنوانها بيقول اللي فتحته بالظبط (مثلًا «مخيمات الشركات الجاهزة — ٦٨ مخيم في ٢٣ شركة» أو «يحتاج هيكل — ٤٧٥ نقطة»)، وفيها الإكسل. والمهام الأسبوعية بقت بتفتح نافذة كمان. وفي آخر كل تبويب زرار «نزّل كل تفاصيل التبويب (إكسل)».' ] },
  { v:'V37.62', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'التبويبات الخمسة في متابعة الوزارة بقت بنفس فكرة الملخص: حلقة كبيرة ومربعات بأيقونة ورقم وكلمة، وكل مربع بيفتح لوحته وإكسله، والأرقام بتجمع:',
      'حالة التركيبات (اتركّبت، مجدولة، جاهزة، تحتاج تجهيز… وحسب النوع والمشعر) · التحديات والمعوقات (مين يعالجها، والتحدي، والمشاعر — من غير عمر المعوق) · ملخص العمل اليومي (شغل النهارده وآخر ٧ أيام، وأي يوم بيتضغط) · شركات الخدمة (الأقل جاهزية أولًا، وضغطة الشركة بتفتح مخيماتها) · المهام الأسبوعية (خلصت، متأخرة، شغالين، لسه، وعلى مين — بتتصفّى في مكانها ومعاها إكسل).',
      'والتفاصيل القديمة كاملة في قسم مطوي تحت كل تبويب، وتحديث المهام زي ما هو.' ] },
  { v:'V37.61', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'تنفيذ توصيات المراجعة: وحدة التقرير التنفيذي اتنقلت لملف لوحدها (ملف المتابعة نزل من ٤٨٩ لـ٤٦٥ ك.ب قبل التبويبات الخمسة). وقرارات كاميرات منى اتنقلت من الكود للسحابة مرة واحدة، فبقى المهندس يغيّرها من نافذة النقطة.',
      'ومسكت خطأ: تصنيف المهندس اليدوي للتقرير التنفيذي ما كانش بيوصل للأجهزة التانية (كان بيفضل على جهازه بس) — اتصلّح.' ] },
  { v:'V37.60', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'مراجعة الكود: اتشال ١٠ متغيرات عامة ما حدش بيقراها، ودالة حساب التصنيف التلقائي بقت ما بتلمسش الإعدادات السحابية، وثلاث نسخ مكررة لإعادة رسم النافذة بقت دالة واحدة. مفيش تغيير في الشكل ولا الأرقام.' ] },
  { v:'V37.59', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'اللوحات بقت أرقامها بتجمع على بعض: كل نقطة محسوبة مرة واحدة بأهم تحدي فيها (عائق، ثم هيكل، ثم المدخل، ثم العارضة، ثم ارتفاع)، فـ«تحتاج تجهيز» = هيكل + مدخل + عارضة + ارتفاع بالظبط، و«يحتاج هيكل» نفس الرقم في كل شاشة. و«ليه؟» بقت تحت «تحتاج تجهيز».',
      'جوه أي مربع: زرار «→ رجوع» للشاشة اللي قبلها (حتى لو دخلت أكتر من مستوى)، والعنوان جملة واحدة «٧٤٢ نقطة — تحتاج تجهيز» من غير حلقة حمرا ولا نسبة، و«حالها الآن» بتختفي لما تبقى لون واحد.' ] },
  { v:'V37.58', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'في كل لوحة: أي مربع بتضغطه (جاهزة، تحتاج تجهيز، تحتاج تنسيق، زيارة أخرى، يحتاج هيكل، المدخل، العارضة، عائق، ارتفاع، قيد المراجعة) بيفتح نافذته بلوحتها وإكسلها، ومعاه «↩ رجوع للكل». والإكسل بقى بينزّل اللي شايفه في النافذة بالظبط (المشعر والمربع)، وكان قبل كده بينزّل الكل.',
      'واتشال من اللوحة سطر الأسبوع والخريطة بطلبك.' ] },
  { v:'V37.57', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'تصحيح لفحص التوثيق على الأصل: سمة داخلية في أقسام التصفية كان جرد الأزرار بيعتبرها زرار من غير معالج.' ] },
  { v:'V37.56', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'كل نوافذ المتابعة بقت تتفهم بالنظر: حلقة كبيرة بالنسبة والرقم، وشريط ألوان واحد لحال النقاط (🟢 جاهزة · 🟠 تحتاج تجهيز · 🔴 تحتاج تنسيق · ⚪ زيارة أخرى)، و«ليه مش جاهزة؟» بأيقونات وكلمة واحدة، والمشاعر حلقات صغيرة تضغط عليها فتعرض المشعر لوحده، والأسبوع بجملة عادية، وتحتها الخريطة وزرار «نزّل التفاصيل (إكسل)». اتشال الوسيط وأقدم بند والكلام الطويل.' ] },
  { v:'V37.55', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'أسماء أقسام التصفية: «التقرير التنفيذي» بقت «التحديات»، و«المجموعات الأربع» بقت «معالجة التحديات»، و«الأدوار» بقت «أدوار منشأة الجمرات».' ] },
  { v:'V37.54', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'قائمة التصفية بقت أقصر وأسهل: شريط «المختار» فوق بيعرض اللي مفلتر عليه وعدد النقاط، وتشيل أي فلتر بضغطة أو «امسح الكل». المشعر مفتوح دايمًا، والنوع والحالة والتقرير التنفيذي والمجموعات والأدوار والمسارات ووجه العمل أقسام مطوية بتفتح في مكانها وبتفتكر اللي فتحته. ولما تختار مشعر، الأقسام بتعرض اللي يخصه بس.' ] },
  { v:'V37.53', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'فلتر «التقرير التنفيذي» على الخريطة: كل تسمية شريحة واحدة بمجموعها («لا يوجد سطح تثبيت» واحدة بدل ٣، و«لا توجد تحديات» واحدة بدل ٢).' ] },
  { v:'V37.52', d:'١٢ أكتوبر ٢٠٢٦', notes:[
      'الخريطة: فلتر «تحتاج زيارة تقنية» بقى موجود بعدده (كان بيتلوّن ومش بيتصفّى)، وفلترين جداد: «التقرير التنفيذي» بتصنيفاته و«المجموعات الأربع» بأعدادها.',
      'نافذة النقطة (للمهندس): «تصنيف التقرير التنفيذي» تلقائي أو بيد المهندس، بيتحفظ في السحابة ويوصل كل الأجهزة ويظهر في الملف. وزرار «تمت الزيارة التقنية» بيحوّل النقطة من برتقالي لأزرق، ويرجّعها لو احتجت.',
      'من ورقة التحديد: «تمت الزيارة التقنية» للمحدَّد كله دفعة واحدة، و«صنّف» المحدَّد في التقرير التنفيذي. والنقاط اللي اتركّبت بتنتقل لوحدها لصف «تم التركيب» في التقرير.' ] },
  { v:'V37.51', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'تصحيح لفحص التوثيق على الأصل: علامة إخفاء التبويبات كانت في خانة قاعدة الرؤية فوقّعت جرد الشرائح — اتنقلت لخانتها.' ] },
  { v:'V37.50', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة: تبويبا «المسح الميداني» و«طلبات الوزارة» اتشالوا من الشريط، وشاشة «النقاط بعوائق وبدونها» بكل نوع (الإجمالي والمخيمات والممرات والمحطات والكاميرات…) بقت في الملخص نفسه، وكل رقم فيها بيفتح لوحته.' ] },
  { v:'V37.49', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة بقت صفحة واحدة بوضعين: «📊 متابعة» للاجتماع، و«🖥 عرض القاعة» نفس الصفحة بملء الشاشة وبتلف لوحدها كل ١٥ ثانية. تبويب «شاشة القاعة» المنفصل اتشال، واللي كان فيه بس (الخلاصة، والمشاعر كم أُنجز وكم بقي، والتوقّع، وشغل الميدان آخر ٢٤ ساعة) بقى في الملخص.',
      'كل رقم في الملخص بيتضغط: المشاعر بتفتح لوحة المشعر مصفّاة بالإكسل، وشغل اليوم بيفتح لوحته، والخلاصة بتفتح الزيارة. والضغط في وضع القاعة بيوقّف التنقّل التلقائي. والنوافذ والبطاقات بقت أنعم في الظهور.' ] },
  { v:'V37.48', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'التقرير التنفيذي بقراراتك: ممرات مسجد نمرة اتشالت، والهجرة ٢ = مركز الجموم للتفويج (وأي نقطة تفويج اسمها مش واضح بتتبع أقرب مركز بموقعها)، والمخيم اللي شاخصه «1-3-5/56» بيتعدّ ٣ مخيمات (منى بقت ٦٩٨ زي رقمك، وعرفات بنفس القاعدة).' ] },
  { v:'V37.47', d:'١١ أكتوبر ٢٠٢٦', notes:[
      '«التقرير التنفيذي» بقى بنسختك بالظبط: قالبك المعدّل، وكل نقطة في صف واحد (مجموع العدد = كل النقاط)، وصياغاتك وإجراءاتك بحرفها، وعمود الجهة فاضي زي ما سبته، وقرارك لكل مجموعة (مخيمات منى جاهزة بانتظار التخصيص، الزايدي كهرباء، الهجرة ١ سطح تثبيت + كهرباء، كاميرات عرفة مظلات، كاميرات منى جاهزة للتشغيل…).' ] },
  { v:'V37.46', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'زرار جديد «📋 التقرير التنفيذي» في «متابعة الوزارة» ← شريط التصدير: بيطلّع قالب الوزارة نفسه بالظبط (نفس الأعمدة والقوائم المنسدلة والتذييل)، والتحديات في ٦ مجموعات بالإجراء المطلوب والجهة المسؤولة، بأرقام اللحظة كل ما تضغطه.' ] },
  { v:'V37.45', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'لوحة الوزارة الجديدة في كل نوافذ المتابعة: خلاصة مكتوبة تتولّد من الأرقام، ومقارنة بالأسبوع الماضي (▲▼)، وأقدم بند مفتوح والوسيط، والنسبة من نقاط المشعر نفسه، وخريطة صغيرة فيها النقاط دي ملوّنة وباقي النقاط باهتة، ومنحنى التراكم في ٣٠ يوم، وتصفية بالمشعر جوه النافذة (بتنعكس على اللوحة والقائمة والإكسل)، وزرار «طباعة اللوحة»، وسطر المصدر تحت.' ] },
  { v:'V37.44', d:'١١ أكتوبر ٢٠٢٦', notes:[
      '«اجعلها نقطة تجربة» بقت مربوطة بصفحة «التجارب»: لو المخيم ليه تجربة مكتوب فيها اسمه بيتربط بيها، ولو ملوش بيتعمل له سطر «تجربة — اسم المخيم». ولو رجّعته نقطة عادية: السطر الفاضي بيتشال، واللي عليه بيانات (ساعات، مصروف، تقرير، أصناف) بيفضل. والتجربة اللي إنت ضفتها يدويًا اتربطت من غير ما تتكرر.',
      'في بطاقة كل تجربة مربوطة بقى فيه زرار باسم المخيم يفتحه.' ] },
  { v:'V37.43', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'دفتر المشتريات: في «تسجيل عملية شراء» بقت فيه خانة «صورة الفاتورة» — صوّر الفاتورة أو اختارها من المعرض، وتقدر تحذفها قبل الحفظ، وبتترفع لوحدها على الدرايف مع حفظ الشراء. وفي جدول «العمليات» عمود «الفاتورة» فيه «افتح» أول ما تترفع.' ] },
  { v:'V37.42', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'اللوحات على الموبايل: أسماء الفئات الطويلة بقت بتظهر على سطرين بدل ما تتقص.' ] },
  { v:'V37.41', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'كل نوافذ «متابعة الوزارة» بقت بتفتح لوحة (٤١ نافذة): المعوقات والتحديات بتبدأ بتوزيع فئاتها، وبعدها حسب المشعر والنوع والشركة وآخر ١٤ يوم، والتفاصيل بالإكسل، وزرار «القائمة» لو احتجت نقطة بعينها.',
      'فئة «المدخل غير واضح — يحتاج تحديد» كانت لسه ظاهرة باسمها القديم لأنه كان محفوظ في الإعدادات من المحرّر، اتصلّحت.' ] },
  { v:'V37.40', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'المساعد: زرار «→ رجوع» (يظهر وإنت جوه سؤال ويرجّعك للبداية) و«✕ إغلاق» واضح، وزرار الرجوع في الموبايل بيرجع جوه المساعد الأول وبعدين يقفله.',
      'المساعد بقى شخصي: بيبدأ بـ«لك الآن» من بياناتك ودورك (اللي سجّلته النهارده، والتحديات اللي مستنية تصنيفك لو مهندس، وتقرير الأسبوع للوزارة)، وأسئلة «في الصفحة دي» حسب الصفحة اللي إنت فيها، و«صفحاتك» الأكتر استخدامًا. وحرف أو حرفين ما بقوش بيطلّعوا نتايج عشوائية.' ] },
  { v:'V37.39', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'كارت «أسئلة الناس للمساعد»: السؤال الناقص (لو حد وقف لحظة وهو بيكتب) بيتضم للسؤال الكامل بدل ما يظهر مرتين.' ] },
  { v:'V37.38', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'للمهندس: كارت «أسئلة الناس للمساعد» في الإعدادات — كل اللي الفريق سأله آخر أسبوعين، واللي ما لقاش جواب فوق، وجنب كل سؤال زرار «أضفها» بيحطه سطر جاهز في المشاكل المعروفة تكتب حله مرة واحدة.',
      'تصحيح: أسئلة المساعد ما كانتش بتوصل المكتب أصلًا، بقت بتتسجّل وتوصل (السؤال الكامل بعد ما تخلص كتابة، مش كل كلمة).' ] },
  { v:'V37.37', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'المساعد بقى يعرض اللي يخص سؤالك بس: لو لقى تشخيص أو مشكلة معروفة، دي الإجابة ومفيش تحتها صفحات ملهاش علاقة. ولو ما لقاش، بيعرض أقرب ٣ صفحات فعلًا مش ٦ بالعافية.',
      'العناوين الصغيرة فوق الكروت (زي «تشخيص» و«المتابعة · التقارير») كانت حروفها مفككة، بقت مكتوبة عادي.' ] },
  { v:'V37.36', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'المساعد وهو مفتوح بيتحدّث لوحده: لما المزامنة تخلص أو صورة تترفع أو النت يقطع أو يرجع، «حالة جهازك الآن» بتتغير قدامك من غير ما تقفله وتفتحه، واللي كتبته في الخانة بيفضل.',
      'مظهر «هوية أفاقي»: اختيارات المظهر في القائمة الجانبية كانت بتظهر أبيض على أبيض، بقت واضحة في كل المظاهر.' ] },
  { v:'V37.35', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'تصحيح في تقرير التحديث الأسبوعي (الإكسل والباوربوينت والوورد والـPDF): مؤشر «نسبة المسح» كان بيعرض رقم الزيارة، بقى فيه «نسبة الزيارة» و«نسبة المسح» الحقيقية جنب بعض. ونفس التصحيح في شريحة «المسح الميداني — نظرة عامة» وتبويب المسح وتقرير الـPDF.',
      'مؤشر «بانتظار قرار الوزارة» في التقرير بقى اسمه «اعتماد تقني مكتمل» (قاعدة ما تراه الوزارة).' ] },
  { v:'V37.34', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'للمكتب: كارت «سرعة الصفحات لكل جهاز» في صحة النظام ← الاستهلاك والأداء: كل جهاز بنوعه ونسخته، وزمن كل صفحة (الخريطة، المتابعة، النموذج، المسح، شغلي، المواقع) واللمس والفتح — أخضر تحت ٠٫٣ ثانية، وأصفر تحت ثانية، وأحمر فوقها.',
      'زرار «المساعد» بقى ظاهر باسمه كامل على الشاشات الكبيرة كمان (كان الاسم بيتقص)، و«أجهزة تحتاج إجراء» بقت تمسك أي صفحة بطيئة مش المتابعة بس.' ] },
  { v:'V37.33', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'مظهران إضافيان تختار منهم من القائمة الجانبية (على جهازك بس): «غرفة تحكم» (كحلي وأرقام مضيئة — مناسب لشاشة القاعة والعرض) و«هوية أفاقي» (أزرق وبرتقالي وزوايا ناعمة). والشكل الافتراضي زي ما هو.' ] },
  { v:'V37.32', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'لو التطبيق وقع والفني في نص نموذج المسح، النص اللي كتبه بيرجع حتى لو مخزن آيفون اتعطّل (بقت فيه نسخة احتياطية تانية من المسودة من غير الصور).' ] },
  { v:'V37.31', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'المجموعة الرابعة في تحديات الوزارة بقى اسمها «تحتاج زيارة أخرى» (أفاقي — تنسيق الزيارة)، والمساعد عند الوزارة ما بيعرضش إرشادات الميدان الداخلية.' ] },
  { v:'V37.30', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'المساعد بقى ظاهر: الزرار مكتوب عليه «المساعد»، وعليه نقطة حمرا لما يكون في جهازك حاجة محتاجة حل (كتابات أو صور واقفة، أو المخزن فيه مشكلة)، وبيظهر تعريف بيه مرة واحدة بعد التحديث.',
      'أول ما تفتح المساعد فيه ٧ أسئلة جاهزة بنقرة (الصور مش بتترفع، التطبيق بيقع أو بطيء، ما اتحفظش، المخيم مش لاقيه، التصوير ممنوع، القارئ ساقط، النسخة قديمة)، ومعاه ٥ مشاكل معروفة جديدة من ملاحظات الميدان وأخطاء الأجهزة.' ] },
  { v:'V37.29', d:'١١ أكتوبر ٢٠٢٦', notes:[
      'للمكتب: كارت «أجهزة تحتاج إجراء» في صحة النظام ← الاستخدام: كل جهاز فيه مشكلة (نسخة قديمة، كتابات أو صور واقفة، مخزن فيه مشكلة، أخطاء، بطء) ومكتوب قدامه المطلوب من صاحبه بالحرف.',
      'للميدان: لو فيه كتابات ما اترفعتش من أكتر من ساعة والنت شغال، أو مخزن الجهاز فيه مشكلة، بيظهر شريط فوق فيه «زامِن الآن» و«إعادة ضبط التطبيق».',
      'صفحة الوزارة: التحديات بقت بتتعرض الأول بالمجموعات الأربع (تصنيع وتجهيز، دراسة وزيارة تقنية، تنسيق مع الجهة المالكة، وصول وتصاريح) ومين عليه الدور، والفئات الثماني تفصيل تحتها. وفئة «المدخل غير واضح» بقى اسمها «المدخل غير واضح — يحتاج تحديد» عشان ما تتلخبطش مع «تحتاج زيارة تقنية».',
      'المساعد: فيه ١٠ مشاكل معروفة جاهزة بمصطلحات المشروع (القارئ، الراوتر، التذبذب، المولّد، الكابل، الكاميرا، اعتماد التركيب، حكم الفك، التصريح، حدود المخيم)، والمهندس يعدّلها من الإعدادات.' ] },
  { v:'V37.28', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تحسين صغير: زرار «عرض المزيد» بيقولك «عُرضت ٨٠ أخرى».' ] },
  { v:'V37.27', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'المساعد: لو المشكلة ما اتحلّتش، زرار «🙋 اسأل المهندس» بيبعتها للمكتب بلاغ ومعاها حالة جهازك، وتشوف الرد في «البلاغات».',
      '«المشاكل المعروفة»: المهندس يكتب في الإعدادات سطر لكل مشكلة (كلمات تدل عليها | الحل) مرة واحدة، فأي حد يكتب كلمة منها في المساعد يلاقي الحل على طول.',
      'القوائم بقت تعرض ٨٠ صف الأول وزرار «عرض المزيد» من غير ما تفقد مكانك — بدل ٣٠٠ صف مرة واحدة.' ] },
  { v:'V37.26', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي: إصلاح أسباب إيميلات «فحص التوثيق» الفاشل بعد كل ترقية، وتأمين فهرس الصور ضد أي صورة تتضاف من غير ما يحس.' ] },
  { v:'V37.25', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي: ترجمة نصوص المساعد الجديدة (كانت بتسقّط فحص التوثيق على الأصل بعد كل ترقية وتبعت إيميلات).' ] },
  { v:'V37.24', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'فتح التطبيق على الأجهزة البطيئة بقى أسرع في الإحساس: السحبة بتيجي على دفعتين، الزيارات والتركيبات والمهام والمواقع الأول فالخريطة تترسم، وبعدها الباقي.',
      'البوابة بقت ترفض أي نسخة تكسر حدود السرعة: بتحمّل التطبيق بحجم الميدان الحقيقي وتقيس رسم المتابعة وفتح القوائم ورسم الخريطة.' ] },
  { v:'V37.23', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'الأجهزة القديمة والبطيئة (مش كلها آيفون): الوضع الخفيف بيشتغل لوحده لو النظام قديم أو لو الرسم بطيء ٣ مرات من ٥، وبيقولك، وتقدر توقفه يوم كامل. والإحصاءات بقت تتحسب مرة لكل تغيير.',
      'المساعد بقى يشخّص: من غير ما تسأل بيوريك حالة جهازك (شبكة، وطابور، وصور، ومرفوضات، ووضع خفيف)، ولما تكتب مشكلتك بكلماتك (الصور مش بتترفع، التطبيق بطيء، ما اتحفظش، النسخة، كلمة المرور، موقعي، الخريطة) بيفهمها وبيحلّها بزرار لو يقدر، أو يقولك الخطوات.' ] },
  { v:'V37.22', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'صفحة المتابعة رجعت سريعة: كانت بتاخد أكتر من ٥ ثواني لأن كارت «صور ليست على الدرايف» كان بيلف على كل الصور (٣٬٩٠٠) لكل نقطة (١٬٩٤٥) في كل رسمة. بقى فيه فهرس للصور بيتبني مرة واحدة.' ] },
  { v:'V37.21', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تصليح مهم بعد الجرد الكامل: صور مسار الطوارئ (الخام) كان ممكن تضيع قبل ما توصل الخادم، اتصلّح. والوضع الخفيف بقى جزء من حارس الإقلاع الأصلي بدل نسخة تانية.' ] },
  { v:'V37.20', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لاختبارات قاعدة الصور الخام.' ] },
  { v:'V37.19', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لاختبارات قاعدة الصور الخام.' ] },
  { v:'V37.18', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'حل جذري لمشكلة «الكاش» (الصفحة بتقع على آيفون): الصور الخام ما بقتش تتسحب لأي موبايل (كانت ٨٫٧ ميجا بتتسحب لكل جهاز)، وموبايل الفني ما بيحمّلش فهرس صور الآخرين أصلًا، والحفظ على الجهاز بقى مقسّم ويحفظ اللي اتغيّر بس.',
      'لو التطبيق وقع مرتين ورا بعض، بيفتح في «وضع خفيف» (من غير خريطة مجسّمة ولا فهرس صور) وبيقولك، وفيه زرار يرجّعك للوضع الكامل.',
      'زرار «🧹 إعادة ضبط التطبيق» في القائمة لكل الأدوار: بيرفع اللي على الجهاز الأول، وبعدها يمسح الكاش والمخزن ويعيد التحميل نضيف — بدل إعدادات آيفون.' ] },
  { v:'V37.17', d:'١٠ أكتوبر ٢٠٢٦', notes:[
      'محرر حدود المخيم بقى يدوي بالكامل: مخيم من غير حدود بتضغط «ارسم الحدود» وتدوس على الخريطة عند كل زاوية ثم «تمّ الرسم». ومخيم ليه حدود: مقابض أكبر للمس، وعلامة في النص تنقل الشكل كله، وتراجع خطوة بخطوة، وحذف زاوية، و«ارسم من جديد»، ورجوع للأصل.',
      'تقدر تحذف صورة اترفعت غلط على الدرايف من معرض صور النقطة (المهندس فأعلى أو اللي رفعها): بتختفي من التطبيق والتقارير عند الكل، وملفها بيفضل على الدرايف.' ] },
  { v:'V37.16', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'كروت الزيارة والمسح والتركيب والتسليم والفك في متابعة الوزارة بقت بتفتح «لوحة» بدل القائمة: العدد ونسبته، وآخر ٧ أيام والنهارده، وتوزيعها حسب المشعر والنوع والشركة والمنفّذ، والتحديات، وآخر ١٤ يوم. والتفاصيل من «تصدير إكسل — التفاصيل»، وفيه زرار «القائمة» لو احتجت صور نقطة بعينها.',
      'صور نموذج المسح: تقدر تختار صورة من المعرض في الموبايل مش من الكاميرا بس، وفيه زرار «🗑 احذف الصورة» تحت أي صورة اتاخدت غلط قبل الحفظ.' ] },
  { v:'V37.15', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«تحتاج زيارة أخرى تقنيًا» بقت «تحتاج زيارة أخرى»: دي النقط اللي اتزارت وما اتمسحتش (الطريق مقفول، أو مفيش تصريح، أو اتمنعنا، أو الموقع مش مطابق).',
      'حالة جديدة على الخريطة «تحتاج زيارة تقنية»: النقط اللي تحت كوبري أو جوه نفق أو في بدايته (من اختيار الفني أو ملاحظته)، والممرات اللي مفيهاش سطح تثبيت. المخيمات مش داخلة فيها. واللي المهندس رجّعها بقت «أعادها المهندس — زيارة أخرى».' ] },
  { v:'V37.14', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'القوائم بتفتح وتقفل في لحظة: بقت بتتفتح لوحدها من غير ما الصفحة كلها تتعاد (كانت بتاخد ثانية لثانيتين في الفتح ومثلهم في القفل).',
      '«جهة الحل» بقت «جهة الدعم المطلوب»: لما تدوس عليها بتطلع نافذة صغيرة فيها كل جهة ونوع الدعم المطلوب منها لوحدها. والمهندس يقدر يحط أكتر من جهة لنفس التحدي، كل واحدة بنوع دعم مختلف، من «✎ تعديل المسميات وجهات الدعم» (سطر لكل جهة: الجهة: نوع الدعم).' ] },
  { v:'V37.13', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'مراجعة شاملة بعين فريق التطوير والجودة: رجع زرار «إضافة فئة» في المشتريات يشتغل (كان محرّر المسميات بيبلعه)، ونموذج «تعديل البيانات» بقى بالحذف النهائي نفسه، وعدّاد استهلاك القراءات بقى مظبوط (كان بيعدّ مرتين)، والشريط الأصفر للصور فيه ✕ يأجّله نص ساعة، والأرقام بقت أسرع.' ] },
  { v:'V37.12', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'الحذف النهائي اتنشر: أي مهندس فأعلى يحذف أي نقطة ما اتركّبتش بزرار «🗑 حذف نهائي» وتأكيد واحد، فتتشال من كل مكان وعند الكل في ثواني ومن غير استرجاع. والسحابة نفسها بتمنع أي حد يرجّعها.' ] },
  { v:'V37.11', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي: قاعدة الحذف النهائي في السحابة بقت أخف وأوضح.' ] },
  { v:'V37.10', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لاختبارات الحذف النهائي.' ] },
  { v:'V37.9', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'الحذف بقى نهائي: أي مهندس فأعلى يقدر يحذف أي نقطة ما اتركّبتش (اتزارت أو لأ) بزرار «🗑 حذف نهائي» وتأكيد واحد. النقطة بتتشال من كل مكان وعند كل الناس في ثواني، وما بتظهرش في «نقاط مخفية»، ومفيش استرجاع من التطبيق. والنقطة المركّبة عليها قفل وما بتتحذفش.' ] },
  { v:'V37.8', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'فتح الصور بقى أسلس: لما تفتح صور نقطة من أي قائمة وتقفلها، بترجع لنفس المكان اللي كنت فيه بالظبط. والصورة لما تكبّرها بتظهر فوق كل حاجة.',
      'أي نافذة بتتمرّر: الراس بزرار ✕ ثابت فوق مهما نزلت.',
      'للمهندس: كارت «صور ليست على الدرايف» في ملخص الوزارة (مش ظاهر للوزارة): عددها حسب كل فني، والصور المعلّقة على موبايل كل واحد ومن إمتى، وكل رقم بيفتح القائمة. وعلى موبايل الفني: شريط أصفر فوق الشاشة لو فيه صور ما اترفعتش من أكتر من ساعة، وفيه زرار «ارفع الآن».' ] },
  { v:'V37.7', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«الصور لم تصل هذا الجهاز بعد»: الصور كانت على الدرايف فعلًا، لكن الجهاز بيحمل في أول تشغيل أحدث ١٬٥٠٠ صورة بس من ٣٬٧٢٠. دلوقتي لما تفتح أي نقطة، صورها بتتجاب من القاعدة على طول وتظهر. ولو مش موجودة في القاعدة، بيقولك بالظبط: «لم تُرفع من جهاز فلان بعد».' ] },
  { v:'V37.6', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'في كل قائمة بتفتح من الكروت (أسباب عدم المسح، والتحديات، والمعوّقات، وغيرها) فيه عمود «الصور»: زرار «📷 والعدد» بيفتح صور النقطة فوق القائمة، ومكتوب معاها حالتها وسبب عدم مسحها، و«رجوع للقائمة» بيرجّعك لنفس المكان.' ] },
  { v:'V37.5', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لمحرّر المسميات والجهات: اللي بتكتبه بيتحفظ مسودة لحظة كتابته، فما يضيعش لو الشاشة اتحدّثت قبل ما تدوس «حفظ التصنيفات».' ] },
  { v:'V37.4', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تقدر تعدّل مسميات أسباب عدم المسح وتحديات التركيب، وجهة الحل لكل واحد، وصورة الإثبات، وتشيل أي بند من قائمة الميدان أو تضيف بند جديد. الزرار «✎ تعديل المسميات والجهات» موجود جنب عنوان الكارتين في ملخص الوزارة (للمهندس وما فوق)، أو من الإعدادات.',
      'التعديل بيوصل كل الأجهزة مع المزامنة، والسجلات القديمة بتتقري بالاسم الجديد على طول. ولو مسحت الاسم بيرجع للأصلي.' ] },
  { v:'V37.3', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«ملاحظات فنية متنوعة» اتشالت من كل القوائم والتقارير: مكانها اسم التحدي الواضح من التمانية، واللي ما يتصنّفش بيظهر بالنص اللي كتبه الميدان نفسه (زي «التصوير ممنوع يحتاج تواصل رسمي»).',
      'عمود القوائم بقى اسمه «الحالة — سبب عدم المسح أو التحديات»: اللي اتزار وما اتمسحش مكتوب «لم يُمسح: السبب» (زي «الطريق أو البوابة مغلقة»)، واللي ما اتزارش «لم تُزر بعد». ونفس الكلام في المعوّقات والإكسل.' ] },
  { v:'V37.2', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'بطاقة «نسبة المسح» في ملخص الوزارة بقت بتحسب المسح الفعلي (كانت بتعرض الزيارات تحت اسم المسح)، والزيارات مكتوبة جنبها. واتضافت بطاقة «زيارة بلا مسح» وبتفتح أسبابها.' ] },
  { v:'V37.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المراحل بقت ٥ (الزيارة، والمسح، والتركيب، والتسليم، والفك) في ملخص الوزارة وشاشة القاعة، ومعاها «قمع المراحل»، وكارت «زيارة بلا مسح» بأسبابه الخمسة وجهة الحل، وكارت «تحديات التركيب» التمانية بجهاتها. والقديم اتوحّد لوحده.',
      'نموذج المسح: «تم الوصول» أو سبب من ٥ من القائمة (من غير كتابة)، والتحديات ٨ من غير «أخرى»، والملاحظة اختيارية. «مقفولة» و«اتمنعنا» محتاجين صورة إثبات. والنقطة اللي تتزار ٣ مرات أو تعدّي ١٠ أيام من غير مسح بتتصعّد بالأحمر.' ] },
  { v:'V37.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المراحل بقت ٥: الزيارة، والمسح، والتركيب، والتسليم، والفك. في ملخص الوزارة وشاشة القاعة: ٥ حلقات، و«قمع المراحل» بالنسبة بين كل مرحلة واللي بعدها، وكارت «زيارة بلا مسح» بأسبابه الخمسة وجهة الحل لكل سبب، وكارت «تحديات التركيب» التمانية بجهة الحل. وكل رقم بيفتح قائمته.',
      'التحديات اللي كانت مكتوبة بأكتر من صيغة (١٨ صيغة و٨٤ نص حر) اتوحّدت لوحدها في ٨ تحديات، وأسباب عدم المسح في ٥. القليل اللي ما يتصنّفش بيظهر للمهندس بس يراجعه.' ] },
  { v:'V36.11', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'إصلاح لقاعدة الحماية الجديدة في السحابة: كان فيها اسم متغيّر غلط بيرفض أي حذف حتى المسموح. اتصلحت، ومحاكي القواعد الرسمي بيجرّبها.' ] },
  { v:'V36.10', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حذف نقطة ليها زيارة أو تركيب بقى لصاحب المشروع بس (بريده)، في التطبيق وفي السحابة نفسها، لأن حساب تاني بدور «مدير» فضل يحذف نقاط التفويج بعد ما رجعناها. واترجعت تالت مرة.' ] },
  { v:'V36.9', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حماية في السحابة نفسها: حذف نقطة ليها زيارة أو تركيب بقى ممنوع على غير مدير المشروع حتى من الأجهزة اللي لسه على نسخ قديمة (زي اللي حذف نقطتين تاني بعد الاستعادة).' ] },
  { v:'V36.8', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'استعادة: الـ٢٦ نقطة تفويج (الزايدي، وطريق الهجرة، ومواقع التفويج، والمدينة) اللي اتحذفت بالغلط النهارده الصبح رجعت كلها، وزياراتها وصورها ما اتلمستش أصلًا.',
      'حماية: حذف أي نقطة ليها زيارة أو تركيب بقى لمدير المشروع بس، والمهندس بيحذف اللي ما اتزارتش. و«نقاط مخفية» بقت بتقول مين حذف وإمتى، وفيها زرار «استعِد كل اللي اتحذف النهارده».' ] },
  { v:'V36.7', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'إصلاح ضروري: النقطة اللي المهندس بيحذفها كانت بترجع تاني أو بتفضل ظاهرة عند غيره. السبب كان حاجتين: النقط المضافة كانت بترجع للقائمة مع كل سحب بيانات، والحذف ما كانش بيوصل للأجهزة التانية إلا كل ربع ساعة أو أكتر. دلوقتي الحذف (والاسترجاع والتعديل) بيوصل كل الأجهزة في ثواني، والمحذوفة ما بترجعش.' ] },
  { v:'V36.6', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حركة المخزن اللي اتسجّلت غلط بتتحذف في نفس يومها (والرصيد بيتصلّح لوحده)، ماعدا «الاستهلاك» لأنه جزء من التركيب. واللي فات عليها يوم بتتصلّح بحركة عكسية (إرجاع أو شطب) زي المحاسبة. واسم الفريق الفرعي بقى بيتعدّل.' ] },
  { v:'V36.5', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«🗑 حذف» بقى موجود في السجلات اللي كان فيها إضافة واعتماد من غير حذف: بلاغ عدم المطابقة وهو مفتوح، والمستخلص قبل ما يتعتمد، وطلب التغيير قبل القرار، وإسناد السيارة. المالي والجودة بيتلغوا (يفضلوا أثر بحالة «ملغى» ويخرجوا من الحسابات)، وما يتحذفوش بعد الاعتماد أو الإغلاق.',
      '«✎ تعديل» اتضاف كمان لـ: التجارب، وحوادث السلامة، وأعضاء الفرق، والفنيين (الجوال والمشرف والقسم — الاسم لأ عشان سجلاتهم بتحمله)، والأدوار. بكده بقوا ١٨ قائمة فيها تعديل موحّد.' ] },
  { v:'V36.4', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: أي نقطة اتركّبت — أو بعد التركيب اتسلّمت أو اتفكّت أو اتعملها صيانة — ما بتتحذفش بأي طريقة، وبيظهر عليها قفل بدل زرار الحذف. اللي قبل التركيب (الزيارة والجدولة والإسناد) بيتحذف عادي.' ] },
  { v:'V36.3', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'زرار «🗑 حذف النقطة» بقى في نافذة كل نقطة، حتى النقط المضافة (زي كاميرات طريق الهجرة الجديدة) — كانت متستثنية. والحذف منه بيترجع من «نقاط مخفية»، والحذف النهائي للنقطة المضافة لسه موجود في «تعديل البيانات».' ] },
  { v:'V36.2', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«✎ تعديل» بقى موجود جنب «حذف» في ١٣ قائمة كان فيها إضافة وحذف بس: سجل المخاطر، والدروس المستفادة، وقواعد التصعيد، ومصفوفة المسؤوليات، والوظائف، وأنواع السيارات، وأنواع النقاط، والسيارات، والشحنات، ونقاط الزيادة، وأصناف الكتالوج، والموردين، وفئات المشتريات. وكل تعديل بيتسجّل باسم اللي عمله.' ] },
  { v:'V36.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حذف نقطة: المهندس بقى يقدر يحذف أي نقطة حتى لو اتزارت أو اتركّبت — من نافذة النقطة على الخريطة على طول (🗑 حذف النقطة) بتأكيد واحد. النقطة بتختفي من كل الأرقام، وزياراتها ما بتتمسحش، وتترجع كاملة من «نقاط مخفية» تحت قائمة المواقع.',
      'المساعد ما بقاش بيقفز لفوق وتحت وانت بتكتب: كان أي تحديث في الخلفية بيعيد رسم نافذته كلها وفيها خانة البحث. دلوقتي النافذة ثابتة والنتائج بس اللي بتتغيّر، وبتقعد فوق الكيبورد مش تحته. ولو سألته «حذف نقطة» بيقولّك فين.' ] },
  { v:'V36.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'داخلي للفريق (من غير أي تغيير في الشاشات): كل تعريفات حالة النقطة — تمت الزيارة، وبعوائق وبدون، والتركيب والتسليم والفك، ورقم الشاخص — اتجمعت في ملف واحد، عشان أي تعديل في تعريف يحصل في مكان واحد وما يتكررش خطأ زي محطات القطار.' ] },
  { v:'V35.2', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'رقم الشاخص (واسم ممرات ١٤٤٧) بقى أول حاجة في باقي الشاشات كمان: النقاط المخفية، وتفاصيل النقطة، وتعديل المسح، والقوائم المنسدلة، و«الأقرب»، والإسناد، وقوائم الحقل، وتنبيه التوأم، وملخص العمل اليومي، وجدول التجريبي.' ] },
  { v:'V35.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المخيم اللي فيه أكتر من شركة بقى بيظهر برقم الشاخص في كل سطوره (سطر لكل شركة)، واسم الشركة تحته، ومعرّف النظام تحتهم. والبحث بالشاخص بيرجّع كل الشركات اللي في المخيم.' ] },
  { v:'V35.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المخيمات بقت بتتعرف برقم الشاخص (رقم المخيم/رقم الشارع، زي 25/56) — أول حاجة في أي نافذة أو جدول أو قائمة أو ملف إكسل، والمعرّف NSK بقى تحته تاني. والبحث شغال بالاتنين.',
      'الممرات اللي اتركّبت في ١٤٤٧ بقت بتتعرف باسمها المعروف من الموسم اللي فات (زي Path-Shaded-3R)، والممرات الجديدة بمعرّفها المقترح NSK لحد ما تتسمّى. وباقي النقاط زي ما هي.' ] },
  { v:'V34.4', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'التشكيل اتشال من كل النصوص اللي بتظهر في السيستم بالعربي — الكلام بقى واضح من السياق.',
      'حلقة المسح ما بقتش بتقلب أحمر وأخضر: كل ما الصفحة تتحدّث كانت الحلقة بتبدأ حمرا لحظة وترجع خضرا. دلوقتي بتفضل ثابتة على نسبتها، والحركة بتحصل لما الرقم يتغيّر بس. والمتبقي (زي الـ١٢ نقطة) بقى باين أحمر في الحلقة حتى لو نسبته صغيرة.' ] },
  { v:'V34.3', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«اليوم» في موجز الموسم بقى فيه الأربعة: مسح وتركيب وتسليم وفك — بعدد اليوم نفسه.',
      'الحلقات الأربع (في الملخص وفي القاعة) بتبدأ حمرا كاملة، والأخضر بيزحف لحد نسبة اللي اتعمل. والفك بقى زي التلاتة: من كل النقاط، أحمر كامل لحد ما يبدأ. والحركة بتحصل لما الرقم يتغيّر بس، مش كل دقيقة في القاعة.' ] },
  { v:'V34.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل تاني للآيفون: صندوق الجهاز الأسود في آيفون المدير سجّل ٦ مرات التطبيق اتقفل بعد ما يفتح على «الخريطة» أو «متابعة الوزارة» بلحظات — وهي اللحظة اللي بيبدأ فيها تنزيل خريطة المشاعر للعمل بلا شبكة (لحد ٣٠ ميجا) جنب صور القمر الصناعي، فذاكرة الصفحة على الآيفون بتخلص. التنزيل التلقائي ده اتقفل على الآيفون (زرار «نزّل» في «حسابي» موجود لمن يحتاجها)، وصور الخريطة بقت تاخد ذاكرة أقل، وخريطة القمر الصغيرة بتتشال لما تسيب صفحتها.' ] },
  { v:'V34.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل للآيفون: رسالة «A problem repeatedly occurred» كانت بسبب حركة شاشة الدخول في ٣٣٫٩ — كانت بترسم ١٬٩٠٠ نقطة ٢٠ مرة في الثانية بكثافة شاشة الآيفون وفي نفس الوقت اللي التطبيق بيحمّل فيه بياناته، فالمتصفح كان بيقتل الصفحة. بقت الصورة تترسم مرة واحدة وفوقها وهج بيتحرك بكارت الشاشة (من غير ما يشغّل المعالج خالص)، وبعد أي فتحة اتقفلت فجأة الشاشة بتبقى ثابتة.' ] },
  { v:'V34.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      '«نبض الميدان» اتغيّر لـ«مسار العمل الميداني — آخر ١٤ يومًا» (الزيارات يومًا بيوم).',
      'أسماء التحديات اللي بتشوفها الوزارة: «المدخل غير واضح — لم يُستدل عليه» بقت «تحتاج زيارة تقنية»، و«أخرى» بقت «ملاحظات فنية متنوعة» — في موجز الموسم وشاشة القاعة والقوائم وجداول المسح والتقارير. والفريق في الميدان بيختار نفس الاختيارات زي ما هي.' ] },
  { v:'V33.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة الدخول رجعت تتحرك زي الأول: الخلفية بتضيء وتكتمل وترجع تاني طول ما الشاشة ظاهرة (وأثناء «يُستأنَف الدخول»)، وبتقف لوحدها بعد الدخول عشان ما تاكلش المعالج. والقاعدة اللي كانت بتثبّت الصورة على «الجهاز الضعيف» كانت بتطفّيها على الآيفون — اتشالت.' ] },
  { v:'V33.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'صفحة الوزارة بقت تفتح بـ«موجز الموسم»: شريط بهوية الوزارة فيه التاريخ الهجري والميلادي وما اتعمل النهارده وأقرب معلَم، وتحته الحلقات الأربع (المسح والتركيب والتسليم والفك) بتتضغط زي القاعة، و«نبض الميدان» (زيارات آخر ١٤ يوم ومقارنة بالأسبوع اللي فات وتوقع اكتمال أكبر مشعر)، و«أبرز التحديات».',
      'مراجعة التعليق والتحطّم: فتح كل الصفحات والشرائح الـ٢٩ ببيانات كاملة على جوال مبطّأ من غير أي خطأ ولا تحطّم، وأطول مهمة حاجبة أقل من ثانية على الجهاز المبطّأ (ربع ثانية على جوال عادي). وتقارير «توقف مفاجئ» في الميدان كلها من نسخ قديمة، وصفر منذ ٣٣٫٠.' ] },
  { v:'V33.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'صفحة متابعة الوزارة بقت تفتح أسرع بحوالي ٤ أضعاف: كانت بتحسب المعوقات والشركات والمؤشرات وقواعد التنبيه أكتر من مرة في نفس الفتحة، وبتبني قوائم كاملة عشان تعدّها بس.',
      'التصدير على الآيفون (وورد وباوربوينت وإكسل وPDF) ما بقاش بيطلّعك من التطبيق: الملف بيتسلّم بقائمة المشاركة (حفظ في الملفات، البريد، واتساب) وانت فاضل في مكانك. ولو الملف اتبنى متأخر يظهر زرار «احفظ الملف أو شاركه».' ] },
  { v:'V33.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تصحيح أرقام (مراجعة بعد غلطة القطار): في «تفاصيل المسح» بطاقة «بلا تحدٍّ — تُسنَد كما هي» كانت بتعدّ نقاط اتزارت ومحتاجة زيارة تانية، يعني كانت بتقول للمكتب يسندها للتركيب وهي مش جاهزة. بقت بنفس تعريف «بدون عوائق»، والنقاط دي راحت لبطاقة «فيها تحدٍّ أو تحتاج زيارة أخرى» وسببها مكتوب جنبها.' ] },
  { v:'V33.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة: فوق بقى ٤ حلقات بس — المسح، والتركيب، والتسليم، والفك. الأخضر اللي اتعمل والأحمر اللي فاضل. اضغط الحلقة تفتح قائمة اللي اتعمل، واضغط «متبقٍّ» تحتها تفتح قائمة اللي فاضل، وكلهم بتصدير إكسل.',
      'اتشال من القاعة: «تحتاج زيارة أخرى» و«اعتماد الوزارة» و«مخيمات بلا عائق» (اللي محتاجة زيارة تانية جوه «بعوائق» في البطاقات تحت).',
      'تصحيح أرقام: الزيارة بقرار المهندس (زي محطات القطار) ما بقتش تتحسب في تنبيه «ممسوحة بلا صور» — لأنها أصلًا من غير نموذج ولا صور.' ] },
  { v:'V33.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تصحيح: محطات القطار كانت بتظهر كلها «بعوائق» في شاشة القاعة، لأن زياراتها مسجّلة «بقرار المهندس» من غير نموذج. الزيارة دي بقت تتحسب «بدون عوائق» طالما مفيش فيها تحدي ولا محتاجة زيارة تانية — ونفس الكلام في «مخيمات بلا عائق» وبطاقتَي الملخص.' ] },
  { v:'V33.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة: «النقاط بعوائق وبدونها» بقت بطاقات فوق تحت الحلقات على طول — الإجمالي الأول وبعده بطاقة لكل نوع من المخيمات للزايدي. واضغط أي رقم (الأخضر أو الأحمر) تفتح قائمة نقاطه بالتفاصيل وتصدير إكسل.' ] },
  { v:'V33.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'المساعد 🧭 بقى يشرح المصطلحات: لو سألت عن «متعذر» أو «شاشة القاعة» أو «بعوائق» أو «الحفظ المحلي» يرد بالتعريف الأول وبعدين الصفحة وخطواتها. وفيه خطوات جديدة لملخص الوزارة وشاشة القاعة.',
      'دليل المستخدم اتكتب من جديد على الشاشات الحالية، وبيتولّد مع كل نسخة ومعاه المصطلحات و«ما الجديد». وأدلة الأدوار الـ١٤ كمان فيها المصطلحات وآخر التحديثات.' ] },
  { v:'V33.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'خطة القاعدة بالاستهلاك (قرار المالك): الجهاز اللي بيقرا أكتر من ١٥ ألف وثيقة في اليوم ما بقاش سحبه بيتبطّأ — كان بيستنى ضعف الوقت بين السحبات. العدّ والتنبيه زي ما هم.' ] },
  { v:'V33.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'الأمن: كلمات مرور الحسابات الجديدة ما بقتش تظهر في أي سجل تشغيل، وبتتمسح تلقائيًا من القاعدة بعد ٧٢ ساعة من الإنشاء (الحساب بيجبر صاحبه يغيّرها في أول دخول).',
      'الآيفون: لما مخزن المتصفح بيتقطع بعد الرجوع من الخلفية، التطبيق بيعيد فتحه فورًا — وده كان سبب أغلب الأخطاء المسجّلة والسحبات الكاملة المتكررة. وأعطال المتصفح بقت تتسجّل باسمها بدل «خطأ برمجي».',
      'أسرع: شاشة الدخول بتجهز أسرع (٥٫٥ → ٣٫٥ ثانية على جوال متوسط) لأن الخلفية بتتحرك مرة واحدة وتقف، وترتيب القوائم العربية بقى أسرع ١٠٠ مرة.',
      'في عرض الوزارة مفيش «متعذّر» ولا «تصريح»: اللي اتزار وما اتوصلّوش بيظهر «تمت الزيارة» وتحديه «تحتاج زيارة أخرى». وبطاقة «ما ينتظر الوزارة» اتشالت من الملخص.',
      'شاشة القاعة: قسم جديد «النقاط بعوائق وبدونها» — الإجمالي الأول (أخضر بدون عوائق، أحمر بعوائق) وتحته كل نوع من المخيمات للزايدي. وبطاقتا الملخص «نقاط بلا عوائق» و«نقاط بعوائق» بنفس الأرقام.',
      'للفريق المستلم: صفحة «ابدأ من هنا»، وأدلة تشغيل لكل السيور ومقابلها على سيرفراتكم، وأداة رفع النسخة بأمر واحد، ومعالجات النقرات مقسّمة لأجزاء مفهومة، و٤ اختبارات وحدة جديدة.' ] },
  { v:'V32.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة الدخول أسرع وأخف على الجوال: الخلفية المتحركة كانت بترسم كل النقاط في كل لحظة من غير ما تقف (حوالي ثانية ونص معالجة على جوال متوسط قبل ما الشاشة تجهز وأثناء الكتابة). بقت تتحرك مرة واحدة وتقف على الصورة الكاملة، وتبدأ بعد ما النموذج يظهر، وعلى الجوالات الضعيفة بتظهر ثابتة.' ] },
  { v:'V32.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مفهوم «تمت الزيارة» بقى على كل الصفحات بطلب المالك: جدول الشركات، وبطاقات المشاعر، والملفات المصدّرة، والملخص اليومي ومنحنياته، ومسار الأسابيع، وملخص الوزارة المكتوب، وخطوات النقطة في نافذتها («تمت الزيارة — تنتظر الاعتماد التقني»)، وتنبيه التوأم، وعدّ زيارات الفني في يومه، والمتأخر من المهام.',
      'والكلام اللي بيخص اللي لسه محتاج زيارة بقى واضح: «الأقرب إليّ — تحتاج زيارة» و«المتاح: ما يحتاج زيارة ولم يُسند بعد».' ] },
  { v:'V32.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'المصطلح بقى واحد وواضح في كل مكان بطلب المالك: الرقم اسمه «تمت الزيارة» (بدل «تم المسح» و«مُسح» و«زيرت») في الملخص، وشاشة المسح، وشاشة القاعة، ومتابعة الوزارة، والجداول، وملفات إكسل والباوربوينت والبي دي إف. وتقسيمه جوه شاشة المسح بمصطلح نموذج الزيارة نفسه: «تم الوصول»، و«متعذّر»، و«تحتاج زيارة أخرى».' ] },
  { v:'V32.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: «زيرت» بقت تعني أي نقطة اتعملها زيارة ميدانية بأي نتيجة (وصلنا، أو متعذر، أو محتاجة تصريح، أو محتاجة زيارة تانية). يعني كاميرات المتابعة ٨٨ من ٨٨ مش ٧٨. والمتبقي بقى اللي ما اتزارش خالص بس.',
      'الرقم ده واحد في كل الشاشات: الملخص، وشاشة القاعة، والخريطة، ومتابعة الوزارة، وسلسلة المراحل، والخطة، والملف اليومي للوزارة، والتقارير. وفي شاشة المسح التقسيم ظاهر جوه «زيرت»: وُصل إليها، ومتعذر، ومحتاجة زيارة تانية. والجاهزية للتركيب والاعتماد زي ما هي.' ] },
  { v:'V32.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'ملخص متابعة الوزارة اتعاد ترتيبه بطلب المالك: البطاقات أولا من «نسبة المسح»، وكل بطاقة بتتضغط فتفتح قائمتها بتفاصيلها وتصدير إكسل (النقاط، والمخيمات والممرات وحالة تركيبها، والمعوقات، والشركات، والتحديات المفتوحة، والطلبات، ومهام الأسبوع).',
      'بطاقتين جداد لكل الأنواع: «نقاط بلا عوائق ولا تحديات» و«نقاط ذات تحديات». وبطاقة «بانتظار قرار الوزارة» اتشالت. والملخص التنفيذي وما ينتظر الوزارة والتنبيهات والمعالم والخطة نزلوا تحت الصفحة.' ] },
  { v:'V32.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مراجعة جودة شاملة على كل مراحل الخطة: ألوان النقاط المسندة «لبكرة» بقت تتحدث لوحدها بعد نص الليل حتى لو مفيش بيانات جديدة (كانت هتفضل بلون «بكرة» لحد أي تحديث).',
      'وجرد ختم الهوية على كل كتابة كان بيسقط في الجرد الكامل بس من بعد بوابة البيانات — اتصلح ودخل الطبقة السريعة، وجرد زمني كان بيسقط تحت الحمل بقى ثابت.' ] },
  { v:'V32.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: شاشة المستخدمين وجولة البداية والأدلة بقت ماسكة حالتها في كائنات خاصة بيها (المتغيرات العامة ٦٠٥ ← ٥٩٨).' ] },
  { v:'V32.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح مهم: تحريك النقطة على الخريطة ما كانش بيتحفظ — كان بيظهر على الجهاز اللي حرّك بس، ويرجع مكانه بعد فتح التطبيق تاني وعلى أي جهاز تاني. بقى بيتحفظ لكل الأجهزة، والنقاط اللي اتحركت قبل كده (١١١ نقطة) هتظهر في أماكنها الجديدة على كل الأجهزة.',
      'وكمان تعديل الإحداثيات من «تعديل البيانات» للنقاط الجديدة (زي كاميرات الزايدي) كان بيترجع للإحداثية الأصلية مع كل مزامنة — اتصلح.',
      'والتحريك بقى ما بيعملش «زيارة» للنقطة: قبل كده تحريك نقطة ما اتزارتش كان بيحسبها ممسوحة.' ] },
  { v:'V32.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: وحدة المزامنة بقت ماسكة حالتها في كائن واحد (المتغيرات العامة ٦٠٩ ← ٦٠٥)، واتسجّل أول قرار في «سجل القرارات» للفريق اللي هيستلم: ليه الحفظ المحلي فضل زي ما هو في الموسم ده.' ] },
  { v:'V32.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: وحدة متابعة الوزارة والتقارير والتصدير بقت ماسكة حالتها في كائنين بدل ١٦ متغير متفرقين في الكود (المتغيرات العامة ٦٢٤ ← ٦٠٩).' ] },
  { v:'V31.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'بطارية أقل وجوال أهدى على الخريطة: كل دقيقة كان التطبيق بيعيد رسم الخريطة كاملة ويعيد حساب كل الأرقام حتى لو مفيش أي جديد اتسحب (حوالي نص ثانية معالجة كل دقيقة على الجوال). بقى يعمل كده بس لما يوصل جديد أو تتسحب الثوابت.' ] },
  { v:'V31.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'الخريطة أسرع في أول فتح على الجوال: أول ٤٠٠ نقطة بتظهر فورا والباقي بيكمل في اللحظات اللي بعدها، بدل ما الشاشة تتجمد لحد ما ١٨٠٠ نقطة تترسم مرة واحدة (أول رسمة نزلت من ١٫٣ ثانية لـ٠٫٧ على جوال متوسط).',
      'ومراجعة الجودة لقت ثغرة في تحسين ٣١٫٦ واتسدّت: ذاكرة الحساب بقت تعيش جوه رسم الصفحة بس.',
      'وأول دخول لمستخدم جديد أسرع: جولة البداية كانت بتعيد تمرير القائمة مع كل رسمة (ثانية ونص على الجوال) — بقت مرة واحدة وبعد ما الشاشة تظهر.' ] },
  { v:'V31.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مراجعة جودة على شغل الليلة (بلا تغيير في الاستخدام): الجرد الكامل الليلي كان مش هيشتغل أبدا بسبب شرط فرع غلط — اتصلح، وبقى لو سقط حاجة بالليل يوصل بريد بيها. واتفحص الكود كله آليا لأي متغير محلي بيطمس دالة من دوال التطبيق أو مكتبة الخرائط (زي خطأ خط البي دي إف) — مفيش ولا حالة فعلية.' ] },
  { v:'V31.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'أسرع من غير أي تغيير في الاستخدام: حالة كل نقطة وقوائم المتابعة بقت بتتحسب مرة واحدة في كل رسمة بدل مرات كتير. رسم الخريطة نزل من ١٤٤ لـ٣٧ جزء من الألف من الثانية، وملخص الوزارة من ٥٣ لـ٣٥ (على كمبيوتر — على الجوال الفرق أكبر).' ] },
  { v:'V31.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: كل اتصال بقاعدة البيانات بقى بيعدي من بوابة واحدة في الكود، عشان أي نقل للمنظومة على سيرفرات تانية يتعمل في مكان واحد. واتشالت متغيرات قديمة مش مستعملة.' ] },
  { v:'V31.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح: بي دي إف تقرير الوزارة ما كانش بيضمّن خط «أبار» المرفوع أبدًا (متغير داخلي كان بيمسح بيانات الخط قبل استعمالها) — بقى بيضمّنه أول ما الخط يترفع.',
      'تحسين داخلي بلا تغيير في الاستخدام: تنظيف الكود — تحذيرات الفاحص من ٣٨ إلى صفر (إعادة إعلانات مكررة وكود ميت بعد الإرجاع).' ] },
  { v:'V31.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: جرد «صحة الكود» في البوابة بيمنع أي تحديث يزوّد المتغيرات العامة أو الدوال الطويلة أو تحذيرات النحو أو حجم ملفات المصدر عن آخر خط أساس، ووثيقة «تعريف المنجز» لكل تحديث.' ] },
  { v:'V31.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: بوابة النشر بقت طبقتين — سريعة على كل دفعة (دقائق بدل ربع ساعة) تفحص البناء والنحو واختبارات الوحدة الجديدة والجرود الحاسمة ولجنة الفحص والمتصفح الحقيقي والمحاكي، والجرد الكامل (١٤٨ خطوة) بيشتغل كل ليلة وعند الطلب.' ] },
  { v:'V31.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: فاحص نحو في بوابة النشر، والكود كله بالوضع الصارم (ما بيسمحش بمتغيرات ضمنية ولا أخطاء صامتة).',
      'وبالمناسبة اتصلحت ٣ أخطاء كامنة كشفها الفاحص: خطأ عند عزل وثيقة متعثرة عن الرفع، وخطأ عند اعتماد طلب تصويب، وعداد الصور الفاشلة ما كانش بيوصل في إشارات الأجهزة.' ] },
  { v:'V31.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'بنية الكود: الملف الواحد بقى عشرة ملفات مصدر بتتجمع في ملف النشر بالظبط زي ما كان (مفيش أي تغيير في التطبيق نفسه ولا في طريقة تحميله). ده أول خطوة عشان الصيانة تبقى أسهل وأأمن.' ] },
  { v:'V30.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'أول فتح أسرع: الخريطة كانت بتترسم ٢٣ مرة في أول ثانيتين (كل رسم صفحة بيرسمها مرتين، والحركة والتكبير وتصحيح القياس كل واحد بيرسمها) — بقى اللي بييجي خلال ٨٠ ملي ثانية يتجمع في رسمة واحدة، ورسم الصفحة من غير ما تتغير النقاط أو الفلاتر بقى رسمة خفيفة.' ] },
  { v:'V30.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'سجل التدقيق: البحث بقى يدور في نص الحدث ورقم النقطة واسم اللي عمله، ومن غير ما يفرق في الهمزة والتاء المربوطة والتشكيل وحالة الحروف.',
      'زر «سجل النقطة» في نافذة أي نقطة (لمن يرى السجل): بيفتح السجل مصفّى على النقطة ويجيب تاريخها كله من القاعدة، مش بس آخر ٥٠٠ حدث.' ] },
  { v:'V30.7', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'إنشاء الحسابات: لما يرفض مفتاح التشغيل (منتهي أو بلا صلاحية) الرسالة بقت تقول الحقيقة — الطلب محفوظ وهيتنفذ مع دورة الخادم، والمفتاح محتاج تجديد من ثوابت النظام — ولافتة للمدير في صفحة الحسابات.',
      'والحسابات المطلوبة بقت تتنفذ كمان مع كل نشر، لأن الترقية للأصل وجدولة الخادم ما كانوش بيشغلوها فكانت بتتأخر ساعات.',
      'وزر «أنشئه من هذا الجهاز الآن» بجوار أي حساب «يُنشَأ» (للمهندس والمدير): بينشئ الحساب فورا من غير ما يستنى الخادم، ويعلم الطلب «تم» ويمسح كلمته من القاعدة.' ] },
  { v:'V30.6', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'فحص الصور تلقائيا على الجهاز لحظة الالتقاط: لو الصورة مظلمة أو محترقة أو مهزوزة يطلع تنبيه «أعد الالتقاط لو أمكن» من غير منع، ولو بتكرر صورة سابقة لنفس النقطة يطلع تنبيه. وفي متابعة الوزارة ← المسح الميداني بطاقة «صور تحتاج إعادة» بقائمتها وتصديرها.',
      'إصلاحان من لقطة المالك: عناوين بطاقات الملخص التنفيذي وتنبيهات القواعد والخطة كانت بتظهر فيها وسوم نصا، ونافذة القوائم كانت بيضا على الوضع الداكن فالنص اختفى — بقت بألوان التطبيق.' ] },
  { v:'V30.5', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة بقت حية: قسم «مباشر» فيه آخر ٨ حاجات حصلت في الميدان (مين زار إيه ومن إمتى)، ووقت آخر تحديث للبيانات، والتنبيهات اللي عليها قواعد. وفي وضع العرض الكامل البيانات بتتسحب كل دقيقتين بدل كل عشرة.' ] },
  { v:'V30.4', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'ملف بيانات يومي للوزارة بيتولد لوحده كل يوم ٥:٣٠ الصبح على الدرايف في مجلد «البيانات اليومية»: إكسل بكل أوراق التقرير (١٧ ورقة)، وملف أرقام (جيسون) لأي نظام عندهم، وملف مواقع جغرافي (جيوجيسون) لخرائطهم، والملخص التنفيذي. كله من دوال التطبيق نفسها وبفحص الملف قبل ما يخرج.' ] },
  { v:'V30.3', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'القوائم بقت تتعدل من ثوابت النظام بدل الكود: تحديات المخيمات، وتحديات الممرات وباقي النقاط، وأسباب إضافة مخيم أو نقطة غير مسجلة. كل سطر بند، والفاضي يرجع القائمة الأصلية، وبتوصل كل الأجهزة مع المزامنة.' ] },
  { v:'V30.2', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'الخطة مقابل الفعلي: الخطة التفصيلية (الإصدار ٢٫١، ١٨٥ بند) بقت في «متابعة الخطة التفصيلية»، والإنجاز المخطط بيتحسب من التواريخ، والفعلي لبنود المسح والتركيب بيتقاس من النظام لوحده (علامة ⚙)، والانحراف قدام كل بند.',
      'بطاقة «الخطة مقابل الفعلي» في ملخص الوزارة: المخطط والفعلي والانحراف للمشروع كله وأكتر البنود تأخرا، وبتدخل الملخص التنفيذي. واستيراد الإكسل بقى يقرا الإصدار ٢ بأسماء الأعمدة.' ] },
  { v:'V30.1', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'تنبيهات بقواعد تتظبط من ثوابت النظام (بالأيام): معوق مفتوح أكثر من ١٤ يوم، تصريح دخول معلق أكثر من ٧، أعيدت للزيارة وما اتزارتش أكثر من ٣، ممسوحة بلا صور أكثر من ٢، مسندة وما اتزارتش أكثر من ٣، تعذر الوصول بلا محاولة أكثر من ٢١. الصفر يعطل القاعدة.',
      'بطاقة «تنبيهات القواعد» في متابعة الوزارة ← الملخص: كل تنبيه بعدده، ويفتح قائمته بالمشعر والنوع ويتصدر إكسل، ويدخل الملخص التنفيذي.' ] },
  { v:'V30.0', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'التحديث الأسبوعي بقى يتبعت لوحده كل يوم أحد ٧:٣٠ الصبح قبل اجتماع الوزارة: باوربوينت بالقالب الموحد وبي دي إف من التطبيق نفسه، على البريد ومجلد «التقارير الأسبوعية» في الدرايف، والملخص التنفيذي في نص الرسالة. ويتفحص الملف قبل ما يخرج.',
      'شاشة القاعة ونظرة عامة والقمر الصناعي بقوا بتصنيف المالك: منى، عرفات، المزدلفة، مراكز التفويج (فيها النورية والزايدي والهجرة)، وكاميرات المتابعة — بدل المشاعر الخام. و«المتابعة» اسمها بقى «كاميرات المتابعة» في الخريطة ومتابعة الوزارة.',
      'بطاقة «مخيمات بلا عائق» بالأخضر في شاشة القاعة وفي ملخص الوزارة (تفتح قائمتها وتتصدر).' ] },
  { v:'V29.9', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة ← الملخص: ملخص تنفيذي بيتكتب من الأرقام لوحده كل مرة (ينسخ بضغطة وبيدخل أول الوورد والإكسل والبي دي إف).',
      'بطاقة «ما ينتظر الوزارة»: تصاريح الدخول، ومنع الدخول، والمواقع غير الموجودة ميدانيا، والمخيمات بلا تخصيص، واعتماد الإعداد — كل بطاقة تفتح قائمتها وتتصدر إكسل.',
      'المعالم القادمة بمواعيدها وكام يوم فاضل، وعنوان «المسح الميداني» بقى يتبع فلتر المشعر والنوع، وصفحة المعوقات بتعرض عمر المعوق (المتوسط والأقدم واللي عدى أسبوعين).' ] },
  { v:'V29.8', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'الخريطة بتقرّب لوحدها لنقاط المشعر أو النوع اللي بتختاره من الفلاتر لو مفيش منها حاجة ظاهرة — زي مراكز التفويج البعيدة عن المشاعر (النورية والزايدي والجموم والمدينة).',
      'مراكز التفويج: ٢٤ كاميرا قراءة لوحات للزايدي وطريق الهجرة (الجموم والمدينة) بمواضع مسودة من صور القمر الصناعي — يؤكدها المالك من المنصة.' ] },
  { v:'V29.7', d:'٤ أكتوبر ٢٠٢٦', notes:[
      'نموذج «موقع جديد»: رقم المربع والشاخص والشركة للمخيمات فقط وبعلامة الإلزام، وباقي النقاط باسمها ومشعرها ونوعها. والسبب والتحديات وأول صورتين إلزامية للكل. والحقول بتتغير على طول لما تختار النوع.',
      'مراكز التفويج: بقى فيه اختيار «المركز» (النورية، طريق الهجرة، الزايدي) والمشعر بيتظبط لوحده.',
      'نقطتا التفويج المؤقتتان (الزايدي وطريق الهجرة) اتخفوا ثم رجعوا ظاهرين بقرار المالك: لا إخفاء، والحذف من النظام بيده.' ] },
  { v:'V29.6', d:'٤ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة ← المسح الميداني: كل بطاقة عليها «›» تُضغط فتفتح نافذة بقائمة نقاطها (النقطة، الاسم، المشعر، النوع، الشركة، آخر زيارة، بواسطة) وزر «تصدير إكسل».',
      'بطاقتان جديدتان: «مخيمات بلا تحديات»، و«زيارات بلا صور» بسبب غياب الصور (لم تُلتقط، أو التُقطت ولم تُرفع من الجهاز) — لتوجيه الشباب لإضافة الصور.',
      'الصور في الدرايف: راجعت الـ٣٣٦٠ صورة المرفوعة — كلها موجودة ومشاركة وفي مجلد نقطتها. صورتان عالقتان بخطأ من جوجل بقت بتتعاد تلقائيا، وصور النقطة المدموجة بتتنقل لمجلد النقطة الصحيحة.' ] },
  { v:'V29.5', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'المشتريات (قرار المالك: الحذف للمهندس والمدير): زر تعديل يملأ النموذج ويحفظ على نفس العملية، وزر حذف بتأكيد — والعملية المعتمدة لا تُحذف إلا بسبب مكتوب يدخل سجل الأحداث.',
      'سجل الصيانة: حذف القيد للمهندس والمدير بتأكيد، ويبقى أثره في سجل الأحداث. والسيارات والشحنات والكتالوج والوظائف كان لها التعديل والحذف من قبل.' ] },
  { v:'V29.4', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'مساعد الميدان في «شغلي ← مهامي» للفني والمشرف: الأقرب إليّ (أقرب خمس نقاط لم تُمسح من موقعك، مع الخريطة والاتجاهات)، وملخص يومي جاهز للنسخ أو الواتساب، وتجهيز اليوم بلا نت (خريطة الجهاز والمزامنة وما ينتظر الرفع).',
      'وفي نموذج المسح زر «انسخ من آخر زيارتي»: التثبيت والكهرباء والمقاسات من آخر زيارة سجلتها لنفس النوع، والصور والتحديات تؤخذ من الموقع.' ] },
  { v:'V29.3', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'حماية في قاعدة البيانات: علامة الحذف على زيارة مسح أو تركيب لا يكتبها إلا من يملك صلاحية الحذف — فالأجهزة اللي لسه على نسخ قديمة (فيها زر يمحو المسح بضغطة) ما تقدرش تخفي زيارة، أيا كانت نسختها.' ] },
  { v:'V29.2', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'تأكيد نقاط منشأة الجمرات بالمسح الميداني (ملاحظة «تحديثات المنصة»): بالأدوار — كم نقطة، وكم أُكد بالمسح، وكم تعذر، وكم لم يُزر، وكم فيه تحديات — في شريحة جديدة بالعرض وقسم في الوورد والإكسل والبي دي إف.',
      'عنوان «المسح الميداني» في متابعة الوزارة: النظرة العامة وحسب المشعر والمشعر والنوع وتأكيد الجمرات حيًّا على الشاشة.',
      'مواعيد التحديث: التحديثات العادية تصل الأجهزة مرة في اليوم الساعة ٤ الفجر، والطارئ وحده فورًا.' ] },
  { v:'V29.1', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'المسح الميداني في التقرير: شريحتان جديدتان في الباوربوينت — نظرة عامة بالأرقام والنسب (نسبة المسح، تم، المتبقي، فيها تحديات، تعذر الوصول) وجدول حسب المشعر، ثم تفاصيل المشعر والنوع: اتعمل كام، لسه كام، كام فيها تحديات، وأبرز تحدٍّ. وفي الوورد والإكسل والبي دي إف قسمان بنفس الأرقام.',
      'حالة الشركات بقت حسب المرحلة: في المسح الميداني تظهر نسبة مسح مخيمات كل شركة والمتبقي والتحديات، و«مرحلة المسح — لم يبدأ التواصل والتركيب» بدل تصنيف ممتاز ومتوسط وضعيف اللي كان محسوبا على التركيب.' ] },
  { v:'V29.0', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'اختيار النقاط في التصدير: فوق أزرار التصدير «نطاق الملف» — كل النقاط، أو مشعر ونوع، أو المحدد على الخريطة — والملف يُبنى على نقاط النطاق وحدها ويُكتب النطاق في الغلاف واسم الملف.',
      'بريد الشركات: عمود «بريدها» في إشعار الشركات (يحفظه المهندس في دفتر الجوالات المحجوب)، وزر «بريد رسمي» يفتح بريد الجهاز برسالة رسمية جاهزة (تركيب أو تسليم أو فك) فيها الأرقام وضابط الاتصال.' ] },
  { v:'V28.9', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'فحص الملف قبل نزوله (قرار المالك): كل تصدير (باوربوينت ووورد وإكسل وبي دي إف) يفحص الأرقام والحروف قبل التنزيل — لا «NaN» ولا خانات ناقصة ولا نسب خارج المدى، والمستهدف = المنجز + المتبقي + المتعثر، والشرائح سليمة البناء وداخل حدودها. أي خطأ يوقف التنزيل ويظهر فوق أزرار التصدير.',
      'خط الوزارة «Abar Mid» في التقارير: الباوربوينت مضمن فيه الخط من قالب الوزارة نفسه، والبي دي إف يضمنه بعد ما يرفع المدير ملفي العادي والعريض مرة من «ثوابت النظام ← خطوط التقارير».' ] },
  { v:'V28.8', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'القالب الموحد لوزارة الحج والعمرة في كل تقارير الباوربوينت والبي دي إف: غلاف بشعار الوزارة وألوانها، وشرائح محتوى بعناوين ذهبية، وختام «شكرا»، وبخط الوزارة المعتمد «Abar Mid» بدل الخط القديم (ملاحظة «تحديثات المنصة»).',
      'وشريحة شركات الخدمة في العرض بأعمدتها الجديدة (ضابط الاتصال والمنجز والمتبقي والمتعثر) وأرقامها صحيحة.' ] },
  { v:'V28.7', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: اسمها «زيارة». المشرف والفني يسجلون الزيارة من «نموذج المسح» بصورها (ملزم)، والمهندس وحده يقدر يضغط «تمت الزيارة» من نافذة النقطة متجاوزا النموذج.',
      'رسم مبدئي لحدود ٧٥ مخيما في عرفات كانت مرسومة بعيدا عن علامتها: نقل كل حد لمكان مخيمه وقص ما يتداخل مع جيرانه، فصارت المخيمات جنب بعض من غير مسافات بعيدة. وأربعة مخيمات علامتها داخل حدود جيرانها تبقى علامة لحد المراجعة في الميدان.',
      'ومخيمات خالد (٠٧١١ و٠٧١٢) نتيجتها صارت «تم الوصول» بتحدياتها.' ] },
  { v:'V28.6', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'صلاحيات المشرف أوسع (قرار المالك): يسجل زيارة سريعة أو نموذج مسح على أي نقطة من غير إسناد مسبق، ويعدل بيانات النقطة الأساسية (الاسم والمربع والشاخص ووجه العمل والشركة والإحداثيات)، ويرد زيارة فريقه للتصحيح بسبب مكتوب. والاعتماد والتصنيف (المشعر والنوع) يبقيان للمهندس.',
      'بلاغ المشرف «المخيم على الخريطة إذا قربت يختفي»: حدود ٧٩ مخيما كانت مرسومة بعيدا عن علامتها، فصارت العلامة تظهر في كل تكبير لحد ما تتعدل الحدود. ودمجت النقاط الثلاث التي أضافها المشرف في عرفات اليوم في مخيمات السجل نفسها (٠٧١١ و٠٧١٢ و٠٧١٣) بزيارته وصوره.' ] },
  { v:'V28.5', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'من ملاحظات «تحديثات المنصة»: «كاميرات الوزارة» صارت «كاميرات المتابعة» تحت مشعر «المتابعة»، وكاميرات منشأة الجمرات نوعها «منشأة الجمرات» لا «كاميرات المتابعة»، و«كاميرات الوزارة — LPR» صارت «مراكز التفويج». والأوزان والتعديلات المحفوظة بالأسماء القديمة تقرأ بالجديدة.',
      '«التفاصيل المختصرة» تغلق بضغطة ثانية عليها وترجع الطبقة اللي كانت قبلها.',
      'الشركات: عمود «ضابط الاتصال» يحفظه المهندس فيراه الكل (والوزارة في متابعتها)، وأعمدة المنجز والمتبقي والمتعثر في إشعار الشركات وفي تقرير متابعة الوزارة.' ] },
  { v:'V28.4', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: لا حذف لأي زيارة أو تركيب الآن. زر الزيارة في نافذة النقطة يسجل زيارة سريعة فقط، والتصحيح من «تعديل المسح». واستعيدت آخر ثلاث نقاط كانت مخفية، فلم يبق أي سجل مخفي.',
      'وإصلاح: اعتماد الوزارة للمسح كان سيرفض بعد التحديث السابق بسبب حقل إضافي، فصار يُكتب بحقوله وحدها.' ] },
  { v:'V28.3', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل: مسوح كانت تختفي رغم تسجيلها. الحذف يترك علامة على السجل، والمسح التالي كان يُكتب فوقها فتبقى العلامة فيمحوه كل جهاز. صار كل حفظ يمحو العلامة، واستُعيدت المسوح التي اختفت بهذا السبب.',
      'وزر «تمت الزيارة» في نافذة النقطة كان يحذف المسح كله بضغطة لو للنقطة زيارة. صار: المسح الكامل لا يحذف من هنا أبدا، والزيارة السريعة وحدها تلغى وبتأكيد، والزر يقول ما يفعل. وكذلك حالة التركيب بقطع وسيريالات لا تحذف بضغطة.' ] },
  { v:'V28.2', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'سجلات الإدارة: الدروس المستفادة والمراجعات الدورية وأصحاب المصلحة صار لكل صف فيها زر تعديل يملأ النموذج بقيمه، و«احفظ التعديل» يكتب على السجل نفسه، و«إلغاء التعديل» يرجع النموذج فاضيا.' ] },
  { v:'V28.1', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'رسم المسارات: النقطة تلتصق بأقرب نقطة على الشارع نفسه (لا بطرفه البعيد)، بمسافة تتبع التكبير، ونقطتان على شارع واحد توصلان مباشرة. وشبكة الشوارع صارت منى ومزدلفة وعرفات.',
      'زر «رسم حر» للساحات وما لا شارع فيه: النقطة حيث تضغط وتوصل بخط مستقيم (بنفسجية). وتنبيه لو الطريق على الشوارع أطول كثيرا من المستقيم. وزر التكبير ما عاد يظهر من خلف أزرار الخريطة.' ] },
  { v:'V28.0', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'صفحة جديدة في الميدان للمهندس فما فوق: «رسم المسارات من وإلى الجمرات». اختر الدور والاتجاه ثم اضغط على الخريطة نقطة بعد نقطة؛ كل نقطة تلتصق بأقرب شارع وتوصل بما قبلها على شوارع منى وممراتها وحدها، لا فوق خيمة ولا بيت. «احفظ المسار» يعرضه على الأجهزة كلها بدل المولد، ويحذف من الصفحة نفسها.',
      'الدور الأرضي: الخط على الشوارع وحدها (كل رأس التصق بأقرب شارع ووصل على الشبكة)، ومتصل بمداخل الدور ومخارجه عبر الساحة.',
      'رسالة «ما الجديد» بعد التحديث صارت للمهندس فما فوق فقط، لا للوزارة ولا للميدان.' ] },
  { v:'V27.9', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'الدور الأرضي: خط الذهاب صار خط مخطط الوزارة نفسه (الأصفر، ومعه ما لاصقه من الأحمر مبدئيا بقرار المالك) مطابقا على شوارع منى، بدل الطريق المحسوب لكل مخيم. والعودة ما بقي من الأحمر.',
      'إسناد المخيمات للأدوار أعيد من صفحات الملف بنسبة تداخل مساحة المخيم مع لون الدور: الأرضي ٧٩، الأول ٢٣١، الثاني ١٢، الثالث ٢٠٨، الرابع ١٠٠ (٦٣٠ مخيما بدل ٤١٠). وكلمتا «مخيما» و«نقطة» جانب الأرقام.' ] },
  { v:'V27.8', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'مسار التفويج: لما تختار الدور تظهر مخيماته مظللة بحدودها بلون الدور على الخريطة (ومع كل الأدوار كل مخيم بلون دوره)، وعددها في بطاقة الدور.',
      'الأسماء فوق القمر الصناعي بمستويين: الإقليم (مكة وجدة والطائف: المدن والقرى والمطارات والجبال والطرق الرئيسية بأرقامها كدروع) للتكبير البعيد، والمشاعر بكل شوارعها عند الاقتراب. ملف الإقليم ينزل مع التحديث القادم.' ] },
  { v:'V27.7', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: الخريطة المفتوحة (بلا مفاتيح ولا فلوس). وصل ملف الأسماء الكامل للمشاعر: ٩٦٨ طريقا باسمه و٦٨ مكانا ومعلما (أحياء وجبال ومساجد ومستشفيات ومحطات) بالعربية، فصارت أسماء الشوارع والأماكن تظهر فوق القمر الصناعي بكثافة خريطة الشوارع بحسب التكبير.' ] },
  { v:'V27.6', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'خرائط جوجل داخل التطبيق: المدير يضع مفتاح منصة خرائط جوجل في «ثوابت النظام» فتعرض خرائط جوجل (شوارع، أو قمر هجين بأسمائه) تحت النقاط والحدود والمسارات على كل الأجهزة على اتصال، وبلا شبكة خريطة الجهاز كما هي، ولو فشل المفتاح تعود الخريطة المفتوحة تلقائيا.',
      'والخريطة المفتوحة: أسماء الشوارع والأماكن فوق القمر الصناعي صارت ترسم من ملف أسماء كامل للمشاعر (كل طريق له اسم، والأحياء والجبال والمعالم) بحسب التكبير وبميل الشارع — ينزل الملف مع التحديث القادم.' ] },
  { v:'V27.5', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'الخريطة الهجينة: أسماء الشوارع والأماكن بالعربية فوق القمر الصناعي (من خريطة الجهاز)، وتختفي مع خريطة الشوارع التي لها أسماؤها.',
      'مسار التفويج: صف «الاتجاه» بعد اختيار الدور: الذهاب والعودة معا، أو الذهاب فقط، أو العودة فقط. والعودة متقطعة دائما لأن الجوهرة وسوق العرب يحملان الاتجاهين معا.' ] },
  { v:'V27.4', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'في «تفاصيل الموقع» صار لكل صف في بطاقة بيانات الموقع زر «تعديل»: المشعر والتصنيف والمنطقة والإحداثيات والدور، لا الاسم ووجه العمل فقط، ويفتح النموذج على الحقل نفسه. وأضيف حقل «المنطقة» للنموذج.' ] },
  { v:'V27.3', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'التحديث الأسبوعي (إكسل ووورد وبوربوينت وPDF) من صفحة التحديات والمعوقات صار يتبع الفلتر: لو فلترت منى ← مخيمات يطلع المعوقات دي بس، والفلتر مكتوب في سطر التاريخ وفي اسم الملف وفي الشريط، ولو ما فيش فلتر يطلع الكل.' ] },
  { v:'V27.2', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'تصنيف جديد على الخريطة والتصفية وصفحة التحديات والتصدير: المشعر خمسة (منى، عرفات، المزدلفة، محطات التفويج، كاميرات الرصد) والنوع تسعة (مخيمات، ممرات، محطات قطار، كاميرات رصد، منشأة الجمرات، مسجد نمرة، النورية، محطات طريق الهجرة، الزايدي). محطات التفويج تضم النورية وطريق الهجرة والزايدي، وكاميرات الرصد تضم كاميرات منى ومنشأة الجمرات، وكاميرات عرفات تحت عرفات.',
      'وكل نقطة يعدل مشعرها ونوعها يدويا من «تعديل البيانات» فتنتقل فورا على كل الأجهزة، والأصل محفوظ.' ] },
  { v:'V27.1', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار المشعر يعدل من «تعديل بيانات النقطة» مع الاسم والتصنيف والشاخص والمربع والشركة والإحداثيات والدور والبوابة، فكل شيء في النقطة يعدل: بياناتها هنا، ومكانها بالتحريك على الخريطة، وحدود المخيم بسحب زواياه.',
      'أربع صفحات كانت تعطي النتيجة نفسها لنفس الجهة صارت واحدة: «حالة أبرز المهام» قسم في «المهام الأسبوعية» بمتابعة الوزارة، و«المعدل اليومي» قسم في «أمس · الآن · غدا»، و«مركز التقارير» شريحة في «التصدير والتقارير»، و«سجل الدروس السريع» قسم في «الدروس والمراجعات». لا بيانات ضاعت.' ] },
  { v:'V27.0', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'الميدان والمكتب على التحدي نفسه: المكتب والوزارة يكلفون (الجهة والآلية ووصف المعالجة وآخر تاريخ ومهمة المعالجة) فيظهر التكليف للميدان تحت كل تحد في صفحته، والميدان يكتب «تحديث» بما حدث (جربنا كذا، كلمنا كدانة، حلت ٣ مخيمات) فيراه المكتب والوزارة فورا باسمه وتاريخه، والمكتب يرد بتعليمات في القناة نفسها. والأرقام تنقص وحدها عند التركيب.' ] },
  { v:'V26.9', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'للميدان: «إفادات الميدان» و«متابعة التحديات» صارتا صفحة واحدة «التحديات والمعوقات» في متابعة العمل الميداني، بفلتر المشعر والنوع وبأرقام متابعة الوزارة نفسها.',
      'اضغط أي تحد تنفتح نافذة بنقاطه: اسم المخيم وشاخصه أو اسم الممر، ومشعره ونوعه، ووصف العائق، وزر «على الخريطة» لكل نقطة، و«كل النقاط» معا.',
      'والعودة من الخريطة إلى أي صفحة ما عادت تبتلع أول ضغطة.' ] },
  { v:'V26.8', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'جهات المعالجة كلها صارت تعدل وتحذف من صفحة التحديات والمعوقات، الأصلية والمضافة: زر تعديل بجانب كل جهة لتغيير اسمها، وزر حذف، ولا تحذف آخر جهة، و«الأصلية» يعيد الثلاث كما كانت. الفئات المسندة لجهة محذوفة تنتقل تلقائيا.' ] },
  { v:'V26.7', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'المساعد داخل التطبيق صار يعرف صفحة «التحديات والمعوقات» بكلماتها: إضافة جهة معالجة، جهة أخرى، وصف المعالجة، آخر تاريخ، مهمة معالجة، تصدير نقاط التحديات، فلتر المشعر — بخطوات مكتوبة.' ] },
  { v:'V26.6', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار للمكتب إضافة جهة معالجة أخرى غير شركة الخدمة وكدانة وأفاقي من صفحة التحديات والمعوقات (حقل «جهة أخرى» تحت جدول الفئات)، فتظهر في قوائم الجهات والبطاقات والتصدير على كل الأجهزة، وتحذف من المكان نفسه.' ,
      'في «التحديات والمعوقات» صار لكل تحد وصف للمعالجة وآخر تاريخ لها، وزر «مهمة معالجة» ينشئ المهمة الأسبوعية بهما في مسار التحديات.',
      'وتحت كل تحد قائمة نقاطه بالفلتر الحالي: اسم المخيم وشاخصه أو اسم الممر، ومشعره ونوعه، ووصف العائق، وحالة الوصول.',
      'وزر «تصدير نقاط التحديات»: إكسل فيه كل نقطة بتحديها ووصفه وموقعها ومشعرها ومسؤوله ومعالجته وآخر تاريخ، بالفلتر إن وضع وإلا كلها.' ] },
  { v:'V26.5', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صارت «التحديات والمعوقات» صفحة واحدة في متابعة الوزارة بدل صفحتين من مصدر واحد، وفيها فلتر المشعر ثم النوع: منى ← مخيمات ← العائق وعدد نقاطه والجهة المسؤولة وآلية المعالجة والحالة.',
      'في تصفية الخريطة صف واحد للأدوار يحكم مسار التفويج ونقاط الجمرات معا، وزر «مسار التفويج» إظهار أو إخفاء فقط.',
      'محطات قطار منى بتسمية «سار» الرسمية: منى ١ أول منى، منى ٢ وسطه، منى ٣ الجمرات.' ] },
  { v:'V26.4', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صارت أسماء محطات قطار المشاعر في منى بتسمية الوزارة: محطة الجمرات «منى ١»، والمحطة الشرقية «منى ٣»، ومسار الدور الرابع من منى ٣ إلى منى ١.' ] },
  { v:'V26.3', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار في الحارس جرد للأرقام: مع كل إصدار تقارن أرقام المعوقات وجهاتها والمسح والشركات والمهام والأيام وأوراق التصدير بالمحسوب مباشرة من البيانات، فأي فرق يوقف النشر قبل أن تراه الوزارة. وقيست سرعة كل زر في كل صفحة ببيانات بحجم الموسم: ٢٤٥ زرا بمتوسط ٦ أجزاء من الثانية.' ] },
  { v:'V26.2', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'القوائم الطويلة صارت تعرض مئة صف أولا وزر «اعرض المزيد» أسفل الصفحة يزيد مئتين كل ضغطة، والبحث في الصفحة يفتح الكل كما كان. صفحة المسح صارت ترسم في ربع وقتها.',
      'صفحة الشركات صارت ترسم في نصف وقتها، وكل الصفحات أخف: ما عاد يحسب تخطيط الصفحة كلها قبل كل رسمة لقراءة مواضع التمرير، وتنسيق الأرقام يحفظ بدل أن يعاد آلاف المرات.',
      'يوم مكة أيضا في فحص النبضات والنبض الصباحي وتقارير الفحص الليلية.' ] },
  { v:'V26.1', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار يوم التقارير يوم مكة لا يوم غرينتش: الزيارة المسجلة بعد منتصف الليل كانت تحسب على اليوم السابق في ملخص العمل اليومي وإنجاز اليوم وسجل الأحداث والتصدير، فاختلفت الأرقام عما رآه الميدان.',
      'بطاقات «تعالج من خلال» في متابعة الوزارة صارت تعد كل نقطة مرة واحدة عند جهة عائقها الأول، فيساوي مجموعها إجمالي المعوقات.',
      'الدور الرابع في التفويج: مخيماته كلها تتحرك إلى محطة واحدة هي الأبعد عن الجمرات، ومنها القطار إلى محطة الجمرات، كما في ملف الوزارة.',
      'صارت صفحات المنصة أخف: مركز التصدير يرسم في خمس وقته السابق، وكل الصفحات ما عادت تحسب إسناد كل نقطة بالمرور على كل المهام، ولا تقرأ مواضع التمرير بتكلفة تخطيط كامل قبل كل رسمة.' ] },
  { v:'V26.0', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صحح مسار تفويج الدور الرابع كما في ملف الوزارة: حجاجه يمشون إلى أقرب محطة قطار في منى، ويركبون قطار المشاعر إلى محطة الجمرات، ويمشون منها إلى مداخل الدور. وخط القطار يظهر أزرق متقطعا على الخريطة.' ] },
  { v:'V25.9', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار المسح لا يضيع إن أغلق الآيفون الصفحة أثناء التصوير: النموذج بصوره يحفظ على الجهاز مع كل صورة وكل حقل، ويعود كما كان تلقائيا عند فتح التطبيق. والصور صارت تقرأ بذاكرة أقل بكثير.',
      'صار للمهندس فمن فوقه تعديل حدود المخيم من نافذته «عدّل الحدود»: تسحب أي زاوية لتنقلها، وتضغط النقطة الصغيرة بين زاويتين لتضيف زاوية، وتحذف الزاوية المحددة، ثم تحفظ. ومعها «رجوع للحدود الأصلية» يعيد حدود السجل. والتعديل يصل كل الأجهزة ويسجل في سجل الأحداث.' ] },
  { v:'V25.8', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار للمهندس فمن فوقه وللمشرف تعديل حساسات المخيم من الميدان: من نافذة المخيم «عدّل الحساسات»، ثم نقل حساس أو الجيت واي، وإضافة حساس وحذفه، وحفظ يصل كل الأجهزة ويسجل في سجل الأحداث. وإن بعد حساس عن الجيت واي أكثر من ١٥٠ مترا ظهر تنبيه بمكان أفضل.' ] },
  { v:'V25.7', d:'٣٠ سبتمبر ٢٠٢٦', notes:[
      'أضيفت في التصفية طبقة «تخطيط حساسات منى»: اثنا عشر حساس حرارة ورطوبة لكل مخيم في منى، وجيت واي واحد يغطيها، تظهر عند التقريب. طبقة مبدئية تعدل من الميدان، وليست نقاطا ولا تدخل في العدادات.' ] },
  { v:'V25.6', d:'٣٠ سبتمبر ٢٠٢٦', notes:[
      'أعيد رسم مسارات التفويج على شوارع منى الفعلية: من كل مخيم في ملف الوزارة إلى مداخل دوره، ومن مخارجه إلى المخيم، بلا لفات، مع تفضيل الشوارع التي يمر بها المخطط.',
      'ظهرت مع المسارات نقاط «احتمال مخيم» حيث انتهت خطوط المخطط بلا مخيم مسجل، للتحقق الميداني، وهي ليست نقاطا ولا تدخل في العدادات.' ] },
  { v:'V25.5', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'صار للمهندس فمن فوقه حذف النقاط المضافة من الميدان أو المكتب أو أدوات الرسم حذفا نهائيا، أيا كانت حالتها، بتأكيد واحد يعرض ما ارتبط بها، ويسجل في سجل الأحداث. ونقاط السجل الأصلي تخفى ولا تحذف.' ] },
  { v:'V25.4', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'نقاط منشأة الجمرات: صار اسم كل نقطة يحمل «مدخل» أو «مخرج» مع الدور، ويظهران في نافذة النقطة، ويمكن اختيارهما عند تعديل بيانات النقاط الميدانية.' ] },
  { v:'V25.3', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'صار تحريك الخريطة أخف: مع كل سحبة يرسم ما يدخل الإطار أو يخرج منه فقط، ولا تعاد قراءة النقاط الظاهرة.' ] },
  { v:'V25.2', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'الخريطة المحفوظة على الجهاز تشمل الآن مكة والمدينة المنورة وطريق الهجرة، وتظهر تلقائيا عند انقطاع الشبكة، وتستبدل الأجهزة نسختها السابقة من تلقاء نفسها.',
      'أضيفت في التصفية طبقتان للعرض على الخريطة فقط: مباني الوزارة، وأماكن التفويج.' ] },
  { v:'V25.1', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'أصبحت صور القمر الصناعي هي الخلفية الأساسية للخريطة، ويمكن الانتقال إلى خريطة الشوارع بالزر نفسه. وعند انقطاع الشبكة تظهر الخريطة المحفوظة على الجهاز كما كانت.' ] },
  { v:'V25.0', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'عادت حركة الخريطة إلى سرعتها المعهودة: مع وجود الشبكة تعرض كما كانت من قبل، وعند انقطاعها تظهر الخريطة المحفوظة على الجهاز تلقائيا.' ] },
  { v:'V24.9', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'خريطة مكة كاملة بشوارعها ومبانيها وأسمائها صارت جزءا من التطبيق: تنزل مرة واحدة تلقائيا عند فتح الخريطة على اتصال جيد، ثم تفتح فورا ومن غير شبكة، في المشاعر والحرم والعزيزية والنوارية والزايدي.',
      'تبقى الخريطة المحفوظة على الجهاز بعد كل تحديث للتطبيق، فلا يعاد تنزيلها ولا تختفي عند انقطاع الشبكة.' ] },
  { v:'V24.8', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'لكل نوع من النقاط شكل يميزه على الخريطة: الممر مربع، وكاميرات الوزارة مثلث، وكاميرات قراءة اللوحات مثلث مقلوب، والبوابة معين، ومحطة القطار سداسي، ومنشأة الجمرات خماسي، والمبنى علامة زائد، والجيت واي نجمة، والحساس قطرة.',
      'خطوط الذهاب تنتهي عند مداخل الدور نفسه في منشأة الجمرات، وخطوط العودة تبدأ من مخارجه، وكذلك مسار كل مخيم.' ] },
  { v:'V24.7', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مراجعة لغة الواجهة: لا أخطاء همزات ولا إملاء في نحو ألفين وخمسمئة نص، وتحويل ثلاث عبارات عامية في مساعد البحث إلى عربية فصحى مبسطة.' ] },
  { v:'V24.6', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارات الأدوار الأرضي والأول والثاني أعيد بناؤها من ملف خطة الوزارة الأصلي بدقته الكاملة، فصارت متصلة من المخيمات إلى منشأة الجمرات، ومطابقة لخطوط الملف في معظمها.' ] },
  { v:'V24.5', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'في نافذة أي مخيم زر «اعرض مسار المخيم»: يرسم مسار ذهابه إلى منشأة الجمرات ومسار عودته من مخرج دوره على الشوارع الفعلية، ويبين دوره والمسافة ووقت المشي لكل منهما.' ] },
  { v:'V24.4', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارا الدورين الثالث والرابع صارا متصلين بالكامل من المخيمات إلى منشأة الجمرات ذهابا وعودة، مأخوذين من ملف خطة الوزارة الأصلي بدقته الكاملة ومرسومين على الشوارع الفعلية.' ] },
  { v:'V24.3', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارات التفويج صارت مرسومة على الشوارع الفعلية نفسها بأسمائها، متصلة وطبيعية الشكل؛ وما كان ناقصا في مخطط الوزارة أكمل بأقرب طريق على الشوارع نفسها، ولا يمر مسار داخل مخيم.',
      'في تصفية الخريطة صار لمسار التفويج «كل الأدوار» معا بلون لكل دور، أو كل دور وحده؛ ومعها اختيار الذهاب والعودة معا أو كل منهما وحده.' ] },
  { v:'V24.2', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'خطوط مسار التفويج صارت خطوطا دقيقة مرسومة على منتصف الممر الفعلي بين المخيمات، لا صورة منسوخة من المخطط: حادة في كل تقريب، ولا تعبر فوق أي مخيم، وتحمل في لحظة.',
      'صورة كل دور صارت تبين مخيماته فقط، والخط الأصفر للذهاب والأحمر للعودة فوقها وتحت نقاطنا، فتبقى النقاط ظاهرة وتفتح بالضغط.' ] },
  { v:'V24.1', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'الخريطة صارت أسرع بكثير: العلامات لا تعاد من الصفر مع كل تحريك أو تقريب، بل تبقى ويعدل ما تغير منها فقط.',
      'الممرات والكاميرات صارت معينات صغيرة على لوح النقاط نفسه بحجم بقية النقاط، فلا تغطي المخيمات.',
      'مخططات مسار التفويج كانت مائلة نحو ثلاث درجات عن الخريطة فعبرت خطوطها فوق المخيمات: صححت الأدوار الخمسة فصارت الخطوط في الممرات بين المخيمات، وصارت متصلة لا نقاطا.',
      'مخارج الجمرات الخمسة عشر نقلت بالتصحيح نفسه (بين ١١٠ و١٣٥ مترا) فعادت على بداية خط العودة في كل دور.' ] },
  { v:'V24.0', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'القائمة الجانبية حين تطوى تبقى شريطا من الأيقونات: تمر بالفأرة على أي أيقونة فيظهر اسمها، وعلى أيقونة الوحدة تظهر صفحاتها فتنتقل إليها بضغطة. وزر ☰ يعيد القائمة كاملة.',
      'في متابعة الوزارة صار «ملخص التركيبات اليومي» «ملخص العمل اليومي»: المسح والتركيب والفك والمتعذر لكل يوم منذ أول يوم عمل، ولكل رقم نسبته، والجدول صفحات لا تزيد الصفحة فيها على خمسة عشر سطرا.',
      'الضغط على اسم أي عمل تحت الرسم يخفي منحناه وعموده، وضغطة ثانية تعيده. ومرشحات بالشهر واليوم وساعات العمل بتوقيت مكة، واختيار يوم واحد يعرضه ساعة بساعة.' ] },
  { v:'V23.9', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'زر ☰ في أعلى الشاشة يطوي القائمة الجانبية (الموديولات) على الكمبيوتر فيتسع المحتوى والخريطة، وضغطة ثانية تعيدها — والاختيار محفوظ. وعلى الهاتف يبقى كما هو: يفتح القائمة وتُغلق.',
      'لمسات على المظهر العام: انتقالات ناعمة للأزرار والبطاقات، وإطار تركيز واضح لمن يستعمل لوحة المفاتيح، وأشرطة تمرير رفيعة بلون النظام — وتتوقف الحركة لمن طلب تقليلها في جهازه.' ] },
  { v:'V23.8', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'المخيم يُعرف برقم شاخصه: عنوان نافذته وسطره في قائمة المواقع «شاخص ٥٤/٥٣٣»، وتحته المشعر والمربع.',
      'عناوين أجهزة النقطة في نافذتها: الراوتر والقارئ والكاميرا من بادئة شبكة موسم ١٤٤٧ (‎.1 و‎.2 و‎.3) — لكل مخيم مسجّلة شبكته (٥٤٦ مخيمًا).',
      'مداخل الجمرات تبقى في أماكن تركيبها الفعلية — جُمعت مداخل كل دور في نقطة واحدة ليكون التركيب متجاورًا.' ] },
  { v:'V23.7', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      '«منطقة الجمرات» صارت «منشأة الجمرات» في التصنيف وأسماء النقاط والكاميرات، ووزنها في النقاط كما هو.',
      'مشعر جديد «مواقع التفويج» لمواقع تفويج الحجاج (الحافلات): يظهر في «+ موقع غير مسجّل» بكاميرات الوزارة وقارئات اللوحات، فتُضاف نقاطه يدويًا الآن، ويوضع مقترح الكاميرات عليه حين يصل موقعه.' ] },
  { v:'V23.6', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'نافذة كاميرا الوزارة: «عناوين الكاميرات» كانت تترك مربعًا فارغًا — أسطر الطراز ورابط البث كانت تفيض خارج العمود الضيق. صارت كل كاميرا كتلة بعرض النافذة: الرقم والنوع، ثم العنوان والـVLAN، ثم الطراز والمواصفة، ثم رابط البث — كلها تلتف.',
      'الأعمدة الثلاثة التي ليس لها إحداثيات في تقرير الوزارة (POLE 21 و23 و24): أضف نقطتها يدويًا من «+ موقع غير مسجّل» (المهندس بلا مسح ولا صورة)، ثم سمِّها باسم العمود من «تعديل البيانات» — فتظهر كاميراتها وعناوينها في نافذتها.' ] },
  { v:'V23.5', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مخارج الدور الثاني في الجمرات نُقلت إلى بداية خط العودة الأحمر عند الطرف الجنوبي للمنشأة — كانت داخل مبنى المنشأة. مخارج الأرضي والرابع رُوجعت على المخطط فوُجدت على بداية الخط.' ] },
  { v:'V23.4', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'عناوين كاميرات الوزارة في التطبيق مباشرة (بلا رفع ملف): نافذة كل نقطة فيها المستقبِل وعنوانه، والقطاع وهوائيه، وحالة الوصلة، وكل كاميرا برقمها وطرازها ومواصفتها (الدقة والزوم) وعنوانها والـVLAN ورابط البث، وزر «افتح في خرائط جوجل». ٨٥ كاميرا على ٧٩ نقطة.',
      'ملف KMZ من التطبيق («التصدير ← KMZ») صار يحمل جدول الكاميرات نفسه في وصف كل نقطة — لكل من يتابع.' ] },
  { v:'V23.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'كاميرات الوزارة في منشأة الجمرات كما في الإكسل: كل كاميرا نقطة مستقلة برقمها (CAM 32 إلى 51) ودورها ونوعها (ثابتة/متحركة) — عشرون نقطة: خمس عشرة داخل المنشأة بأدوارها، واثنتان في الخلفي بالدور الثالث، وثلاثة أعمدة مجاورة. كانت خمس نقاط مجمّعة بالدور فلم تُرَ كاميرا كاميرا.',
      'تقرير الوزارة المرفوع يطابق كاميرات الجمرات برقم الكاميرا، فتظهر عناوين كل كاميرا في نقطتها.' ] },
  { v:'V23.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'طبقة «مسار التفويج» على الخريطة (تصفية ← مسار التفويج): لكل دور من أدوار الجمرات مخيماته ومسار الذهاب (أصفر) والعودة (أحمر) من الخطة التشغيلية ١٤٤٧، وبطاقة فيها طول المسار وعرضه وفرق المنسوب وملاحظة الوزارة ومقترحها وعدد نقاطنا على المسار. ونافذة كل مخيم تقول إلى أي دور يُفوَّج.',
      'مخارج الجمرات الخمسة عشر نُقلت إلى بداية خط العودة في كل دور — ثلاث نقاط (يسار ووسط ويمين) على عرض المسار — بدل أماكنها التقريبية حول المداخل.' ] },
  { v:'V23.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'الاعتماد التقني: كمية كل جهاز في «اعتمد واختر الأجهزة» صارت حقلًا يُعدَّل في مكانه (مثلًا ١٢ أنتنة ← ١٠) بدل الحذف والإضافة من جديد، والصفر يرفع السطر.',
      'تسمية النقاط المرفوعة: حدّد النقاط على الخريطة ← لوح الإسناد ← «أو سمِّ المحدَّد» ← بداية الاسم ورقم البداية ← سمِّ (مثلًا «كاميرا وزارة LPR — عرفات —» ١ إلى ١٠). والنقطة الواحدة من «تعديل البيانات»، وتعديلها يبقى بعد إعادة الفتح.' ] },
  { v:'V23.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'التصنيفات بيدك: من «المواقع» (أسفل الصفحة) تضيف تصنيفًا باسمه ورمزه ولونه وشكله، وتحذفه — والتصنيف الذي عليه نقاط تنقل نقاطه إلى تصنيف آخر ثم يُحذف («انقل واحذف»).',
      'نقل النقاط إلى تصنيف: حدّد النقاط على الخريطة ← لوح الإسناد ← «أو انقل المحدَّد إلى تصنيف» ← انقل. الزيارات والتركيبات لا تتأثر، والنقل مسجّل.',
      'النوارية كما في المخطط: نُقلت نقاطها إلى أماكنها (دخول وخروج رئيسيان، وتسع مقابل ست) مع بقاء زيارات اليوم عليها كما هي.' ] },
  { v:'V22.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'كاميرات النوارية في أماكنها كما في مخطط الوزارة: كاميرا الدخول الرئيسي، وكاميرا الخروج الرئيسي، وتسع كاميرات على مداخل المسارات (مسار ١–٩) تقابلها ست على مخارجها (خروج ١–٦). المواقع تقريبية بمقياس المخطط وتُضبط بـ«تحريك» في أول زيارة.',
      'تعديلات موقع النقطة واسمها وإخفاؤها من المكتب تصل إلى الأجهزة التي حمّلت النقطة من قبل (كانت تبقى حيث كانت).' ] },
  { v:'V22.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'صور الزيارة من لوح «تعديل المسح»: تظهر بمصغّراتها، وكل صورة تُحذف بزر 🗑 وتأكيد (المهندس أي صورة، ورافعها صورته ما لم تُعتمد الزيارة)، وتُضاف صورة أو أكثر دفعة واحدة باختيار نوعها أو «صورة إضافية». ولاستبدال صورة: احذف القديمة وأضف الجديدة.',
      'ما لم يُرفع بعد من صور جهازك يظهر «في الطابور» ويمكن إلغاؤه قبل الرفع.' ] },
  { v:'V22.7', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'تعديل المسح: الصور صارت تُعدَّل من اللوح نفسه — كل صورة تُستبدَل أو تُضاف وحدها (📷)، وتُرفَع مع المزامنة، والباقي كما هو.',
      'لوح التعديل لم يعد يحبسك: كان شريط التطبيق العلوي يغطي زر الإغلاق على الهاتف. صار اللوح فوق كل شيء، وفيه «إغلاق» أعلاه وأسفله، ويُغلَق بلمس الخلفية وبزر الرجوع في الجهاز وبالانتقال لأي صفحة.' ] },
  { v:'V22.6', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عربية أوضح في شاشات الفني (نموذج المسح ومهامي): «البيانات المسجّلة تُراجَع فقط — اكتب ما لا نعرفه عن الموقع» بدل «المعلوم يُراجَع…»، و«نقاطك لا تُحسب إلا بعد اعتماد المهندس… ومعها سبب الإعادة» — وسبع غيرها.' ] },
  { v:'V22.5', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عناوين كاميرات الوزارة: من «الأدوات ← الاستيراد» ارفع ملف الوزارة كما هو؛ يُطابَق بالنقاط عمودًا عمودًا (وأدوار الجمرات)، ويُعرَض قبل الحفظ ما طابق وما لم يطابق ولماذا، ثم تظهر في نافذة كل نقطة عناوين كاميراتها والمستقبِل وهوائي القطاع — لمن دخل التطبيق فقط. كلمة المرور لا تُحفَظ.',
      'النقاط التي على الإحداثية نفسها صارت تُرى وتُلمَس كلها (كانت العليا تغطّي السفلى — ١٦ من ١٧ في النوارية).' ] },
  { v:'V22.4', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عربية أوضح في سبع عبارات أخرى بمعناها في مكانها: «تجميع الصفوف» بدل «الطيّ»، و«تبويب التجارب» بدل «شريحة التجارب»، و«الأزرار فوق» بدل «الشرائح فوق»، و«مسجَّل باسم من كتبه» بدل «مختومٌ بكاتبه» — وغيرها.' ] },
  { v:'V22.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'تعديل المسح بلا إعادته: اضغط النقطة المزارة ← «✎ تعديل المسح» ← اختر الحقل (مثل عرض البوابة) ← عدّله ← يُحفَظ فورًا وحده؛ الصور وبقية المسح كما هي، والتعديل مسجّل باسمك في الزيارة وفي السجل.',
      'المسح المعتمد: إذا عدّله غير المهندس عاد لانتظار الاعتماد (ويُنبَّه المكتب)، والمهندس يعدّل ويبقى معتمدًا.' ] },
  { v:'V22.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'منشأة الجمرات بأدوارها: كل نقطة تعرف دورها (الأرضي حتى الرابع)، وفي التصفية صفّ «الأدوار» يعرض دورًا واحدًا على الخريطة والقوائم — بدل نقاط فوق بعضها كأنها موقع واحد. وأُضيفت كاميرات الوزارة في المنشأة (عشرون كاميرا في تسع نقاط: خمسة أدوار وأعمدة مجاورة).',
      'نافذة كاميرا الوزارة تقول عدد كاميراتها ونوعها (ثابتة/متحرّكة) وحالة ربطها وقطاعها من تقرير الوزارة ٢٠٢٦. النقاط القائمة طابقت التقرير موقعًا موقعًا فبقيت بمعرّفاتها وزياراتها.',
      'كاميرات النوارية (قارئات اللوحات) بأسمائها الرسمية: الدخول، خروج ١–٦، الخروج، مسار ١–٩ — والمواقع تقريبية تُضبط في أول زيارة. وأُخفيت نقطة مكررة لم تُزر.',
      'عربية أوضح: «وسمها تجريبية» صارت «اجعلها نقطة تجربة»، وأخواتها بمعناها في سياقها.' ] },
  { v:'V22.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'البحث في المواقع: لو التصفية الحالية (نوع أو مشعر أو حالة) أخفت ما تبحث عنه، تقول الرسالة «لا نتائج ضمن التصفية الحالية — وخارجها كذا» ومعها «ابحث في الكل» — بدل «لا نتائج» التي توحي أن النقطة غير موجودة.' ] },
  { v:'V22.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'أخف بالثلث: قاموسا الإنجليزية والأردو في ملف مستقل يُحمَّل لغير العربية فقط ومرة واحدة — الملف الرئيسي أصغر، فالتحديث أسرع وذروة الذاكرة وقته أقل. العربية لا تنزّله أبدًا.',
      'شاشة الدخول بالإنجليزية أو الأردو تظهر بلغتها، وتغيير اللغة منها يعيدها بلغتها الجديدة ويُبقي اسم المستخدم.' ] },
  { v:'V21.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'التحديث التلقائي أخف على الآيفون: قبل إعادة التحميل تُطفأ الخريطة والصفحة والإنصات الحي — الانتقال للنسخة الجديدة كان يحمّلها فوق القديمة بكل ما فيها فيتجاوز سفاري حدّ الذاكرة.',
      'حارس الإقلاع: لو توقّف التطبيق فجأة، الفتح التالي يكون خفيفًا (بلا الرجوع لآخر صفحة، وبعد توقّفين على «مهامي») ويُسجَّل أين توقّف — فلا تحتاج مسح بيانات الموقع.' ] },
  { v:'V21.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'زر اللغة «ع» في الأعلى يعمل على الهاتف: قائمة اللغات كانت تُفتح لكن الشريط العلوي يقصّها فلا يظهر منها شيء — صارت تظهر فوق كل شيء.',
      'زر المظهر صار واحدًا بثلاث حالات بدل زرّين متجاورين: داكن ← فاتح ← وضع الشمس (للشاشة تحت الشمس)، وأيقونته تقول الحالة. وأُصلح أن أي لمسة على الخريطة كانت تطفئ وضع الشمس وحدها.' ] },
  { v:'V21.7', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'رجوع احترازي: القواميس عادت داخل الملف الرئيسي كما كانت في V21.5 — بعد بلاغ توقّف متكرّر للتطبيق على آيفون عقب تجربة تغيير اللغة. ما يتغيّر عليك شيء، والتسريع يعود بعد التحقق على آيفون حقيقي.' ] },
  { v:'V21.5', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'أخف على الهاتف: في التحديات والطلبات صار الصف نصًا وحقول التعديل تظهر لصف واحد عند ضغط ✎ — بدل عشرات الحقول المرسومة معًا. والتصدير لا يوقف الصفحة لو تعذّر.' ] },
  { v:'V21.4', d:'٢٧ سبتمبر ٢٠٢٦', notes:[] },
  { v:'V21.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'خطة الأسبوع: كل نقطة تنتهي بواحدة من ثلاث — «أتممتها» بنتيجة فعلية مكتوبة، أو «تحديث» يسجّل ما حدث وتنتظر تجارب أخرى، أو «إغلاق» بسببه مع نقطة جديدة بدلها. وما بقي من أسبوع سابق بلا نتيجة ولا إغلاق يظهر بالأحمر أول الأسبوع الحالي. اكتمال الخطوات يطلب النتيجة ولا يُتمّ وحده.',
      'الخطة يراها المهندسون ومن فوقهم (المدير والإدارة العليا)، ويكتبها المهندس والمدير.' ] },
  { v:'V21.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'للمهندس: «خطة الأسبوع» في التخطيط — نقاط بأولويتها وتفاصيلها وخطواتها (قائمة تحقق تُتم النقطة عند اكتمالها) ومتطلباتها ونتيجتها المرجوة، بأسبوعها؛ النقطة تصير مهمة أسبوعية بضغطة، وما لم يُنجز يُرحّل للأسبوع القادم، وإكسل للخطة. يراها ويكتبها المهندس وحده.' ] },
  { v:'V21.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'صفحة الإشعارات: بطاقة «الإشعارات على هذا الجهاز» (إيقاف النوافذ المنبثقة، إيقاف إشعارات الجهاز، كتم حتى الغد) صارت فيها مباشرة — كما في «حسابي».' ] },
  { v:'V21.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'حماية الزيارة من الضياع: ما تحفظه ولم يُرفع بعد يُكتب أيضًا في احتياطي لا يسقط مع مخزن المتصفح (بلا صور)، ويعود وحده عند فتح التطبيق لو سقط المخزن أو أُعيد التحميل — ويُمحى حين يُرفع كل شيء.',
      'نموذج المسح: لو نقص شيء لا تختفي الرسالة — صندوق أحمر ثابت أعلى النموذج يقول «لم تُحفظ الزيارة — أكمِل: …» حتى تكمله.' ] },
  { v:'V20.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: التحدي أو الطلب المفتوح أكثر من أسبوعين يُعلَّم بعمره بالأحمر، و«الحمل على المسؤولين» يقول من عليه كم تحديًا ومهمة ومتأخرًا، و«مسار الأسابيع» يعرض لقطات الأسابيع بفروقها، و«بانتظار قرار الوزارة» في المؤشرات — وكلها في التقرير.' ] },
  { v:'V20.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'الإشعارات العائمة عليها ✕ تغلقها بلا انتقال، و«كتم ساعة» من البطاقة نفسها — وما يصل دفعة واحدة (بعد مزامنة) صار بطاقة واحدة تقول العدد بدل كومة تغطي الشاشة.',
      'في «حسابي» بطاقة «الإشعارات على هذا الجهاز»: إيقاف النوافذ المنبثقة، وإيقاف إشعارات الجهاز، وكتم حتى الغد — والجرس يعدّ كل شيء دائمًا. ومعها طريق الإيقاف من إعدادات الآيفون والأندرويد.' ] },
  { v:'V20.7', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'المهام الأسبوعية تُسمَع في متابعة الوزارة: تأجيل الموعد وتغيير المسؤول صارا يُسجَّلان ويظهران في آخر التحديثات ومحضر الاجتماع، وحذف مهمة مربوطة يُكتب على طلبها أو تحدّيها.',
      'الملخص فيه كتل العرض الأسبوعي الأربع من المهام: أبرز الأعمال المنجزة، أبرز المهام القادمة، الاعتمادات والدعم المطلوب، المهام المتأخرة — مع «أُنجز هذا الأسبوع» مقارنةً بالماضي، وآخر اجتماع و«ما تغيّر منذه».',
      'التقرير بصيغه الأربع فيه الكتل نفسها، والباوربوينت فيه شريحة «المسار | القارئات» بتصميم العرض — وشارة على «متابعة الوزارة» في القائمة بعدد الجديد منذ آخر زيارة.' ] },
  { v:'V20.6', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'كل شيء مربوط: لكل طلب من الوزارة زر «＋ مهمة تنفيذ» يُنشئ مهمة أسبوعية مربوطة به — آخر ملاحظة فيها تصير إفادة الطلب، واكتمالها ينجزه، وتوقفها يظهره متوقفًا وتحديًا قائمًا.',
      'كل تعديل على تحدٍّ أو طلب يُسجَّل بمن غيّره ومتى، و«آخر التحديثات — هذا الأسبوع» سجل واحد يجمع المهام والتحديات والطلبات: في الملخص وفي التقرير بكل صيغه (PowerPoint وWord وExcel وPDF)، ومعه عمود «مرتبطة بـ» في المهام.' ] },
  { v:'V20.5', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'التحديات وآليات المعالجة صارت بمصادرها الثلاثة: من المسح الميداني (كل فئة بعدد نقاطها ومشاعرها)، ومن المهام الأسبوعية (المتوقفة)، والمسجلة يدويًا — ولكل تحدٍّ: على مين، ومن سيحله، وآلية المعالجة، والحالة، وزر «＋ مهمة معالجة» يُنشئ مهمة أسبوعية مربوطة به.',
      'التحدي يظهر «تم الحل» وحده: حين تُركّب نقاطه كلها، أو تكتمل مهمة معالجته، أو تُستأنف المهمة المتوقفة.',
      'المهام الأسبوعية صارت تبويبًا داخل متابعة الوزارة، و«حالة أبرز المهام» تُقرأ منها بأعمدة العرض (المسار والمسؤول والحالة والاستحقاق والتحديث) — والتصدير كذلك.' ] },
  { v:'V20.4', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: زر PowerPoint في شريط التصدير — العرض الأسبوعي من قالب الوزارة الأصلي نفسه (الغلاف بتاريخ اليوم، والفاصل، وثماني شرائح بعناوين العرض وجداوله، والشكر) بخلفياته وشعاراته وخطوطه المضمّنة، يُبنى على جهازك في لحظة.' ] },
  { v:'V20.3', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'التحديات وطلبات الوزارة: القائمة تظهر أولًا في تبويبها، ونموذج الإضافة تحتها خلف زر «＋ تحدٍّ جديد» أو «＋ طلبٌ جديد» — وما تضيفه يظهر أعلى القائمة فورًا.' ] },
  { v:'V20.2', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: شريط «تصدير التحديث الأسبوعي» أعلى كل عنوان — Word وExcel وPDF بعناوين العرض التسعة وألوانه، يُبنى على جهازك لحظيًا بالأرقام الحالية.' ] },
  { v:'V20.1', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'مشعر جديد «النوارية» لكاميرات مركز النوارية (كاميرات الوزارة وLPR): النقطة التي سُجّلت تحت منى وهي في النوارية نُقلت إليه، ويظهر في كل الشاشات.',
      'إصلاح: كانت نافذة نقطة الكاميرا تعرض «undefined» مكان رمز النوع — عاد الرمز واللون.' ] },
  { v:'V20.0', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'موديول جديد «متابعة الوزارة» في المتابعة، بعناوين العرض الأسبوعي نفسها: الملخص مع المقارنة بالأسبوع الماضي، وحالة أبرز المهام، وحالة التركيبات، وتركيب المخيمات لشركات الخدمة (ممتاز/متوسط/ضعيف)، وبيان المعوقات وتصنيفها بالجهة المعالجة، والتحديات وآليات المعالجة، وطلبات الوزارة، وملخص التركيبات اليومي — وشاشة القاعة انتقلت إليه.' ] },
  { v:'V19.8', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على أندرويد كالآيفون: تظهر بعد الدخول خطوات التثبيت مرقمة (كروم وسامسونج، والخروج من متصفح واتساب) ولو لم يعرض المتصفح زر التثبيت — ومعها «ثبّت الآن» بضغطة حين يسمح المتصفح.' ] },
  { v:'V19.7', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على أندرويد: يظهر بعد الدخول «ثبّت الآن» بضغطة واحدة حين يسمح المتصفح بالتثبيت — كما على الآيفون بالخطوات.' ] },
  { v:'V19.6', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على الآيفون: تظهر بعد الدخول خطوات تثبيت التطبيق على الشاشة الرئيسية (مرة، ثم كل يوم حتى تضغط «تم») — المثبَّت يحفظ عملك أثبت ويفتح أسرع.',
      'اللافتة الحمراء لم تعد تظهر بلا سبب: تظهر فقط حين يكون الجهاز بلا شبكة أو فيه عمل لم يُرفع بعد، وتختفي حين يُرفع — والرفع يُعاد تلقائيًا كل عشر ثوانٍ ما دام الحفظ المحلي معطلًا.' ] },
  { v:'V19.5', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'المزامنة التلقائية أسرع: ما يُحفظ أثناء رفع جارٍ يُرفع فور انتهائه بدل انتظار الدقيقة التالية، وما ينتظر يُرفع فورًا عند الخروج من التطبيق أو إغلاقه.',
      'اللافتة الحمراء «الحفظ المحلي لا يعمل» تقول الآن سببها وما تفعله، وفيها «أعد المحاولة» — وعند انقطاع اتصال المتصفح بمخزنه بعد الرجوع من الخلفية (عيب معروف في آيفون) يُعاد فتحه تلقائيًا بدل أن يبقى معطلًا حتى إعادة التحميل.' ] },
  { v:'V19.4', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على الهاتف: زر مزامنة 🔄 في أعلى الشاشة بجوار رقم النسخة، عليه عدد ما ينتظر الرفع ويدور أثناء المزامنة — وفي اللافتة الحمراء «الحفظ المحلي لا يعمل» زر «زامن الآن» مباشرة.' ] },
  { v:'V19.3', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في التقارير التنفيذية ثلاث شاشات جديدة: «مطابقة المنهجية» تقيس ٢٣ بندًا من دليل المعرفة (الإصدار الثامن) والمنهج الرشيق ومنهج إدارة مشاريع الذكاء الاصطناعي من بيانات النظام نفسها — بنسبة مطابقة وإكسل للمصفوفة.',
      '«الدروس والمراجعات» لتسجيل الدروس المستفادة والمراجعات الدورية، و«أصحاب المصلحة» بسجل الانخراط الحالي والمطلوب — للمكتب والإدارة العليا.' ] },
  { v:'V19.2', d:'٢٥ سبتمبر ٢٠٢٦', notes:[] },
  { v:'V19.1', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'كاميرات الوزارة أصبحت عائلة واحدة: «كاميرات الوزارة» (ثابتة Bullet أو متحركة PTZ — يظهر نوع كل كاميرا في نافذتها ويصححه المهندس) و«كاميرات الوزارة — LPR» لقراءة اللوحات. صُحح الاسم الخاطئ «كاميرات فالوزارة»، ودُمج النوع المكرر «كاميرات LPR» في LPR.' ] },
  { v:'V19.0', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'إصلاح مهم: النقاط والمستحق كانت تُحسب صفرًا على أي جهاز بواجهة إنجليزية أو أردية لأن مفتاح الوزن كان يُقرأ بلغة الواجهة — صارت واحدة على كل جهاز بأي لغة.',
      'البحث في القائمة الجانبية يصل الآن إلى الشرائح داخل الصفحات (مثلًا «يوميات» يفتح يوميات المشروع مباشرة)، وزر Enter يفتح أول نتيجة، و«/» على الحاسوب يفتح البحث.',
      'في تقرير الأداء بطاقة «كيف يُحسب المستحق»: المعادلة بالقيم الحالية، وأوزان كل نوع، ومثال محسوب، وأين يُضبط كل رقم.',
      'في صحة النظام ← الاستهلاك: قائمة بالصفحات التي لم يفتحها أحد في ثلاثين يومًا لتقرر ما يُدمج أو يُخفى.' ] },
  { v:'V18.9', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'ضُبطت أوزان النقاط والتارجت الشهري (٣٬٥٠٠) وأُلغي احتساب الإضافي بقرار صاحب المشروع — يُعاد حساب النقاط والمستحق على الأعمال المسجلة كلها بالقيم الجديدة.' ] },
  { v:'V18.8', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في تقرير الأداء «محاكي الأوزان والتارجت»: جرّب وزن كل نوع والتارجت الشهري وشوف أثرهما على ما سُجّل فعلًا (نقاط كل عضو وإسقاط الشهر وهل يعدّي التارجت) قبل الضبط — وزر لاعتمادها، وزر لإلغاء الإضافي.',
      'يوميات المشروع: أعمدة جديدة — المشاعر لكل يوم، والمتعذّر، وساعات عمل الفرد (من أول سجل إلى آخره).' ] },
  { v:'V18.7', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'شاشة جديدة «يوميات المشروع» في التقارير التنفيذية: كل يوم من أول يوم عمل إلى اليوم — الزيارات والتركيب والفك والمواقع الجديدة والاعتمادات ومن عمل — مع التراكمي، وإكسل لها.' ] },
  { v:'V18.6', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في تقرير الأداء جدول جديد «المسح بنوع الموقع لكل عضو»: كم مخيمًا وكم ممرًا مسح كل عضو فعلًا (بالعدد والنقاط)، وأيام عمله، ونقاط المسح في اليوم — وأعمدته في إكسل التقرير.' ] },
  { v:'V18.5', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'خريطة القمر الصناعي في شاشة الوزارة على الهاتف: الصفحة تُمرَّر بإصبع واحد فوق الخريطة، وزر «اضغط لتحريك الخريطة» يفعّل التحريك — والتقريب بإصبعين يعمل دائمًا.' ] },
  { v:'V18.4', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة: نقاط المشعر تظهر الآن على صورة القمر الصناعي افتراضيًا (تكبير وتحريك وضغط على النقطة لفتحها)، وخريطة النقاط المجردة تبقى خيارًا بزر «نقاط».',
      'كلمة «نبض» استُبدلت في الشاشات بما يناسب موضعها: «شغل الميدان» في شاشة الوزارة، و«ملخص الصباح» للتقرير اليومي، و«إشارة» لاتصال الأجهزة، و«المزامنة الحية» لوصول التغييرات.' ] },
  { v:'V18.3', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في «تصحيح البيانات» بطاقة جديدة «نقاط بعيدة عن مشعرها» تحصر النقاط ذات الإحداثيات الخاطئة وتفتحها للتصحيح.' ] },
  { v:'V18.2', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'خريطة التقدم بالنقاط في شاشة الوزارة: تكبير وتصغير بالأزرار أو بإصبعين أو بعجلة الفأرة، وسحب للتحريك، فتتباعد النقاط المتلاصقة — والنقطة ذات الإحداثيات البعيدة عن مشعرها لم تعد تصغّر الخريطة إلى زاوية، وتُذكر بمعرّفها لتصحيحها.' ] },
  { v:'V18.1', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'حسابات الوزارة أصبحت تظهر للمهندس في شاشة المستخدمين (كانت لمدير المشروع فقط)، وتبقى مخفية عن المشرف فمن دونه.' ] },
  { v:'V18.0', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في «حسابي» بطاقة لتنزيل خريطة المشاعر على الجهاز مرة واحدة بموافقتك (تظهر حين تُبنى خريطة الموسم) فتعمل الخريطة بلا شبكة — مع وضع الشمس ونسخ التشخيص في المكان نفسه.',
      'في الأدوات زر GeoJSON يصدّر المواقع بحالتها بصيغة قياسية يفتحها أي نظام خرائط.',
      'المشعر الذي يُعلن في «نقاط المراحل» يظهر من يومه في الطلبات والتوزيع وشاشة الوزارة والملخص والقوائم بأرقام صفر، حتى تأتي أول نقطة فيه.' ] },
  { v:'V17.99', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'وضع الشمس: زر 🔆 في أعلى الشاشة (وفي الأدوات) يرفع التباين ويكبّر الخط والأزرار وعلامات الخريطة للعمل تحت الشمس — لهذا الجهاز وحده، ويبقى بعد إعادة الفتح.',
      'الشاشة تبقى مضاءة أثناء نماذج المسح والتركيب والصيانة، وتُطلق عند الإغلاق أو بعد عشر دقائق بلا لمس.',
      'في نموذج التركيب، إن كان الهاتف يدعم قراءة الرموز، يظهر زر كاميرا بجوار الرقم التسلسلي يقرأ ملصق الجهاز ويملأ الحقل — والكتابة اليدوية باقية، ويُنبَّه إن كان الرقم مسجلًا على نقطة أخرى.' ] },
  { v:'V17.98', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في الأدوات زر «نسخ التشخيص»: ينسخ آخر مئة حدث على الجهاز (بلا أسماء ولا نصوص) لإرساله للمهندس عند غياب الشبكة، ويُرفق تلقائيًا بكل بلاغ.',
      'أرقام النقاط والرموز اللاتينية داخل الجمل العربية أصبحت تُعرض بترتيب صحيح في الشاشات ورسائل واتساب.',
      'صحة النظام ← الاستهلاك: بطاقة أداء الميدان — أبطأ الأجهزة والصفحات ومؤشرات السرعة.' ] },
  { v:'V17.97', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'التحديثات أصبحت تصل الهواتف مرتين في الأسبوع (فجر الأحد والأربعاء) بدل أن تصل مع كل دفعة، إلا الإصلاحات العاجلة فتصل فورًا.',
      'رسالة «ما الجديد» تعرض سطور كل النسخ التي وصلت منذ آخر مرة، لا آخر نسخة فقط.' ] },
  { v:'V17.96', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في ثوابت النظام بطاقة «حارس التكلفة»: بعد ضبط تنبيه الميزانية في Google Cloud يؤشّر المدير عليها فيختفي البند من جاهزية الموسم — والخطوات في دليل مرفق.' ] },
  { v:'V17.95', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'التطبيق أصبح يفتح فورًا من نسخة الجهاز المحفوظة دون انتظار تنزيل الصفحة، والتحديثات تصل كما كانت عند صدور نسخة جديدة.',
      'التحدي «لا يوجد سطح تثبيت» أصبح يُعدّ مرة واحدة في كل الشاشات مهما اختلفت صيغته بين المخيم والممر، وأُضيفت للمهندس بطاقة بأكثر ما كُتب تحت «أخرى».',
      'في صحة النظام ← الاستهلاك: بطاقة تعرض أكثر الصفحات استعمالًا خلال ثلاثين يومًا وقراءات اليوم مقارنةً بالحصة المجانية.',
      'يمكن للمدير وسم نقاط «التركيب التجريبي» من نافذة النقطة، وتظهر أزمنة مراحلها في الفك والمراحل ← السلسلة.' ] },
  { v:'V17.94', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'البلاغات ونبض الصباح وتقرير النظام أصبحت تُتابع داخل التطبيق فقط (صحة النظام)، ولم تعد تُنشر في المستودع العام.',
      'النسخة الاحتياطية اليومية أصبحت تُحفظ مشفّرة على الدرايف فقط، ولا يُحفظ في المستودع إلا أعدادها.',
      'أرقام الصفحة المشتركة للوزارة أصبحت مشفّرة ولا تُقرأ إلا برمز اليوم.' ] },
  { v:'V17.93', d:'٢٣ سبتمبر ٢٠٢٦', notes:[
      'إذا تعذّر الحفظ على ذاكرة الجهاز يظهر شريط أحمر يطلب المزامنة وعدم إغلاق التطبيق، ويحاول النظام إصلاح الحفظ تلقائيًا ثم ينقل ما حُفظ مؤقتًا دون فقد.',
      'يطلب التطبيق من المتصفح الاحتفاظ ببيانات الجهاز بشكل دائم، وتظهر النتيجة في صحة النظام.',
      'الحساب الذي يسجّل نفسه بنفسه يبقى بانتظار تفعيل المكتب، ويستمر عمله محفوظًا على الجهاز ثم يُرفع بعد التفعيل.',
      'خريطة التقدم في شاشة الوزارة أصبحت بالنقاط: كل نقطة في موقعها الحقيقي بلون حالتها، والضغط عليها يفتحها.' ] },
  { v:'V17.92', d:'٢١ سبتمبر ٢٠٢٦', notes:[] },
  { v:'V17.91', d:'٢١ سبتمبر ٢٠٢٦', notes:[] },
  { v:'V17.90', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'وضع القاعة: عند اختيار «عرض كامل» في شاشة الوزارة تنتقل الشاشة بين أقسامها تلقائيًا كل خمس عشرة ثانية، وتتوقف عند أول لمسة — مناسب لشاشة غرفة العمليات.',
      'التقرير الأسبوعي أصبح له غلاف بهوية الوزارة يحمل ملخص الأسبوع ورمز QR يفتح الصفحة المشتركة من الهاتف.' ] },
  { v:'V17.89', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة أصبحت بألوان الوزارة (الأخضر والذهبي) ويظهر عليها اسم الوزارة واسم المشروع. الشكل نفسه في الصفحة المشتركة وفي التقرير الأسبوعي.',
      'فوق الأرقام جملة تلخص الأسبوع: عدد النقاط التي تم مسحها وأين، والموعد المتوقع لاكتمال المسح في أكبر مشعر، وعدد النقاط التي تنتظر قرار الوزارة.',
      'الأرقام الكبيرة تتحرك من الصفر إلى قيمتها عند فتح الشاشة.' ] },
  { v:'V17.88', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'في منى يوجد 14 مخيمًا مسجلًا مرتين في الكشف بالإحداثيات نفسها. تم دمج كل زوج تلقائيًا عندما يكون أحدهما قد مُسح والآخر لم يُمسح، مع اعتماد المخيم الذي تم مسحه.',
      'الحالات التي لم يمكن حسمها تلقائيًا تظهر في شاشة «تصحيح البيانات» ليقررها المهندس.',
      'بذلك انخفض عدد المخيمات التي «لم تُزر» في منى انخفاضًا حقيقيًا، دون أي تعديل يدوي على الأرقام.' ] },
  { v:'V17.87', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'تظهر هذه الرسالة مرة واحدة بعد كل تحديث، وتشرح ما تغير، ثم لا تظهر مرة أخرى.',
      'المخيم المسجل مرتين في الموقع نفسه أصبح له حل من شاشة «تصحيح البيانات»: يُختار الأصل ويُغلق الآخر فيخرج من العدّ، ويمكن التراجع في أي وقت.',
      'عند فتح نقطة لم تُزر بعد، يظهر تنبيه إذا كانت هناك نقطة أخرى في الموقع نفسه، مع بيان ما إذا كانت قد مُسحت.',
      'النقاط التي لم تُزر أصبحت واضحة على صورة القمر الصناعي بإطار برتقالي.' ] },
  { v:'V17.86', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'المخيم المسجل مرتين في الموقع نفسه أصبح له حل من شاشة «تصحيح البيانات»: يُختار الأصل ويُغلق الآخر.',
      'عند فتح نقطة لم تُزر بعد، يظهر تنبيه إذا كانت هناك نقطة أخرى في الموقع نفسه.',
      'النقاط التي لم تُزر أصبحت واضحة على صورة القمر الصناعي بإطار برتقالي.' ] },
  { v:'V17.85', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة أصبحت متاحة خارج التطبيق: تقرير PDF يُرسل بالبريد كل سبت، وصفحة إلكترونية يفتحها ممثل الوزارة برمز دخول يتغير يوميًا.',
      'من المتابعة ← نظرة عامة ← «شاشة الوزارة»: نسب الإنجاز في حلقات، وكل مشعر بشريطه وموعد اكتماله المتوقع، وخريطة المربعات بالألوان، وزر «عرض كامل» لشاشة القاعة.' ] },
  { v:'V17.83', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'تحت كل مشعر يظهر «يكتمل نحو …»: الموعد المتوقع لانتهاء المسح محسوبًا من سرعة الإنجاز في آخر أسبوعين؛ أخضر إذا كان قبل الموعد المحدد، وأحمر إذا كان بعده.',
      'خريطة المربعات: كل مربع بلون يعبر عن نسبة ما مُسح فيه، والضغط عليه يفتح مواقعه.' ] },
  { v:'V17.82', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'شاشة جديدة باسم «شاشة الوزارة» في المتابعة ← نظرة عامة: عرض كبير مناسب للاجتماعات يتحدث تلقائيًا كل دقيقة.' ] }
];

function releaseNotesSince(seen, cur){
  var a = verNum(seen), b = verNum(cur);
  return RELEASE_NOTES.filter(function(r){ var k = verNum(r.v); return k > a && k <= b && r.notes && r.notes.length; })
    .sort(function(x, y){ return verNum(y.v) - verNum(x.v); });
}

function wnClose(){ if (WN) lsSet('nsk14.seenVer', WN.v); WN = null; render(1); }

function pwNeeded(){
  var me = (STATE.users || {})[myUid()];
  return !!(me && me.mustChange);
}

function pwSave(){
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '') : ''; };
  var p0 = g('pw0'), p1 = g('pw1'), p2 = g('pw2');
  if (p1.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if (p1 !== p2){ toast(t('الكلمتان غير متطابقتين')); return; }
  if (!STATE.meta.online){ toast(t('تبديلُ الكلمة يحتاج شبكة')); return; }
  var u = FB.auth && FB.auth.currentUser;
  if (!u){ toast(t('سجّل الدخول أولًا')); return; }
  toast(t('تُبدَّل الكلمة…'));
  var go = function(){
    return u.updatePassword(p1).then(function(){
      var me = (STATE.users || {})[myUid()], now = Date.now();

      if (me){ me.mustChange = false; me.pwAt = now; }
      CORE.dirty('users', myUid(), { mustChange:false, pwAt:now });
      SESS_PW = p1;
      logEvent('تبديل كلمة المرور — ' + (STATE.meta.name || ''));
      toast(t('بُدِّلت كلمتُك — لا يعرفها أحدٌ سواك'));
      PW = null; render(1);
    });
  };
  var reauth = function(pw){
    var cred = window.firebase.auth.EmailAuthProvider.credential(u.email, pw);
    return u.reauthenticateWithCredential(cred);
  };
  var chain;
  if (PW && PW.forced){

    var old9 = p0 || SESS_PW;
    chain = (old9 && PW.needOld ? reauth(old9).then(go) : go()).catch(function(e){
      if (!/requires-recent-login/.test(String(e && e.code || ''))) throw e;
      if (old9) return reauth(old9).then(go);
      PW.needOld = true; render(1);
      throw { code:'need-old' };
    });
  } else {

    chain = reauth(p0).then(go);
  }
  chain.catch(function(e){
    var m = String(e && e.code || '');
    toast(/wrong-password|invalid-credential/.test(m) ? t('الكلمةُ الحالية غيرُ صحيحة')
        : /weak-password/.test(m) ? t('كلمةُ المرور ضعيفة')
        : /need-old/.test(m) ? t('اكتب كلمتَك المؤقتة أوّلًا لإثبات الهوية — ثم بدّل')
        : /requires-recent-login/.test(m) ? t('ادخل من جديد ثم بدّل الكلمة')
        : t('تعذّر التبديل') + ' — ' + m.slice(0, 40));
  });
}

var ATT_IN  = { s:21.2, n:21.6, w:39.7, e:40.2 };

function attInZone(lat, lng){
  return lat > ATT_IN.s && lat < ATT_IN.n && lng > ATT_IN.w && lng < ATT_IN.e;
}
function attLocate(){
  return new Promise(function(res){
    if (!navigator.geolocation){ res(null); return; }
    var done = false, stop = setTimeout(function(){ if (!done){ done = true; res(null); } }, 12000);
    navigator.geolocation.getCurrentPosition(function(p){
      if (done) return; done = true; clearTimeout(stop);
      res({ lat:+p.coords.latitude.toFixed(6), lng:+p.coords.longitude.toFixed(6), acc:Math.round(p.coords.accuracy || 0) });
    }, function(){ if (!done){ done = true; clearTimeout(stop); res(null); } },
    { enableHighAccuracy:true, timeout:11000, maximumAge:60000 });
  });
}
function attMark(kind){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }
  if (!isFieldRole(ROLE)){ toast(t('الحضورُ للميدان')); return; }
  var day = dayKey(Date.now()), k = attKey(myUid(), day);
  STATE.att = STATE.att || {};
  var r = STATE.att[k] || { id:k, uid:myUid(), name:STATE.meta.name || '', day:day, role:ROLE };
  if (kind === 'in'  && r.in){  toast(t('بدأتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.in.at)); return; }
  if (kind === 'out' && !r.in){ toast(t('لم تبدأ يومَك بعد')); return; }
  if (kind === 'out' && r.out){ toast(t('أنهيتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.out.at)); return; }
  toast(t('يُلتقَط موقعُك…'));
  return attLocate().then(function(loc){
    var stamp = { at:Date.now(), lat:loc ? loc.lat : null, lng:loc ? loc.lng : null,
                  acc:loc ? loc.acc : null, ok:loc ? attInZone(loc.lat, loc.lng) : null };
    r[kind] = stamp;
    if (kind === 'out' && r.in) r.hours = Math.round((stamp.at - r.in.at) / 360000) / 10;
    STATE.att[k] = r;
    CORE.set('att', k, r);
    logEvent((kind === 'in' ? 'بدأ يومَه' : 'أنهى يومَه') + ' — ' + (STATE.meta.name || '')
      + (loc ? (stamp.ok ? ' · داخل المشاعر' : ' · خارج النطاق') : ' · بلا موقع'));
    toast((kind === 'in' ? t('بدأ يومُك') : t('أُنهي يومُك') + ' \u00b7 ' + nm(r.hours || 0) + ' ' + t('ساعة'))
      + (loc ? (stamp.ok ? '' : ' \u00b7 ' + t('خارج نطاق المشاعر — يراها مشرفُك')) : ' \u00b7 ' + t('بلا موقع')));
    statBump(); render(1);
  });
}

function attTeamCard(){
  if (rankOf(ROLE) < rankOf('supervisor')) return '';
  var day = dayKey(Date.now()), A = STATE.att || {};
  var people = techsList().filter(function(x){ return x.n !== STATE.meta.name; });
  var rows = [], inN = 0, outN = 0, offN = 0, farN = 0;
  people.forEach(function(x){
    var r = A[attKey(x.u, day)];
    if (!r || !r.in){ offN++; rows.push([esc(x.n), pill('لم يبدأ','off'), '\u2014', '\u2014']); return; }
    if (r.in.ok === false) farN++;
    if (r.out){ outN++; rows.push([esc(x.n), pill('أنهى','ok'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '<span class="num">' + esc(hm(r.out.at)) + ' \u00b7 ' + nm(r.hours || 0) + t('س') + '</span>']); }
    else { inN++; rows.push([esc(x.n) + (r.in.ok === false ? ' ' + pill('خارج النطاق','wrn') : ''), pill('يعمل','acc'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '\u2014']); }
  });
  rows.sort(function(a, b){ return (a[1].indexOf('لم يبدأ') > -1 ? 1 : 0) - (b[1].indexOf('لم يبدأ') > -1 ? 1 : 0); });
  return cardFlush('\u{1F552} ' + t('الحضورُ اليوم') + ' \u2014 ' + nm(people.length),
      stats([['يعمل', N(inN), 'acc'], ['أنهى', N(outN), 'ok'], ['لم يبدأ', N(offN), offN ? 'wrn' : ''], ['خارج النطاق', N(farN), farN ? 'bad' : '']])
      + (rows.length ? table(['الشخص','الحال','بدأ','أنهى'], capList(rows, 200)) : '')
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('يضغط كلٌّ بنفسه عند الوصول والمغادرة — والموقعُ يُلتقَط. «خارج النطاق» تُسجَّل ولا تُرفَض: اسأل صاحبَها.')) + '</p>');
}

function routeLocate(){
  return attLocate().then(function(loc){ ROUTE_POS = loc; render(1); return loc; });
}

function waAsnText(to, kind, ids, when){
  var L = ids.map(function(id){
    var st = siteFind(id) || {};
    return '\u2022 ' + id + (st.name ? ' \u2014 ' + String(st.name).slice(0, 30) : '') + (st.zone ? ' (' + st.zone + ')' : '');
  });
  return t('السلام عليكم') + ' ' + to + '\n'
    + t('أُسند إليك') + ' ' + nm(ids.length) + ' ' + t('نقطة') + ' \u2014 ' + t(kindLabel(kind))
    + (when ? ' \u00b7 ' + t('الموعد') + ' ' + when : '') + ':\n'
    + L.slice(0, 20).join('\n') + (L.length > 20 ? '\n\u2026 ' + t('والباقي في التطبيق') : '') + '\n\n'
    + t('افتح «مهامي» في التطبيق واضغط «من موقعي» لترتيب الطريق') + ':\n'
    + appUrl() + '\n'
    + '\u2014 ' + (STATE.meta.name || '');
}
function waAsn(to, kind, ids, when){
  if (!to || !ids || !ids.length){ toast(t('لا إسنادَ يُبلَّغ')); return false; }
  var ph = techPhone(to);
  if (!ph){ toast(t('لا جوالَ محفوظٌ لهذا الشخص — أضفه في الحسابات أوّلًا')); return false; }
  var txt = waAsnText(to, kind, ids, when);
  try { window.open(waLink(ph, txt), '_blank', 'noopener'); }
  catch (e){ toast(t('تعذّر الفتح')); return false; }
  ids.forEach(function(id){
    var tk = taskKindOf(id, kind);
    if (tk){ tk.waAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  });
  logEvent('إبلاغ واتساب — ' + to + ' \u00b7 ' + nm(ids.length) + ' ' + t(kindLabel(kind)));
  toast(t('فُتح واتساب') + ' ' + to + ' \u2014 ' + t('اضغط إرسال'));
  statBump();
  return true;
}

function propApprove(id){
  if (!propMay()){ toast(t('اعتمادُ المقترحات للمهندس فما فوق')); return false; }
  var p = propFind(id); if (!p) return false;
  p.approved = true; p.appBy = (STATE.meta && STATE.meta.name) || ''; p.appAt = Date.now();
  STATE.props = propList().filter(function(q){ return q.id !== id; });
  if (!siteFind(id)){ STATE.sites.push(p); SITE_IX = null; SITE_TOK = null; }
  CORE.set('newsites', id, p); statBump(); logEvent('اعتمادُ مقترحةِ الوزارة — ' + id + ' \u00b7 ' + (p.zone || ''), id);
  PROP_POP = ''; PROP_SHEET = false; toast(id + ' \u00b7 ' + t('اعتُمدت — صارت نقطةً في السجل، جدوِل زيارتَها'));
  if (typeof visitAsnOpen === 'function') visitAsnOpen(id, true); else render(1);
  if (typeof mapPaint === 'function') mapPaint(); return true;
}
function propReject(id){
  if (!propMay()){ toast(t('اعتمادُ المقترحات للمهندس فما فوق')); return false; }
  var p = propFind(id); if (!p) return false;
  p.rejected = true; p.rejBy = (STATE.meta && STATE.meta.name) || ''; p.rejAt = Date.now();
  STATE.props = propList().filter(function(q){ return q.id !== id; });
  CORE.set('newsites', id, p); logEvent('رفضُ مقترحةِ الوزارة — ' + id, id);
  PROP_POP = ''; toast(id + ' \u00b7 ' + t('رُفضت المقترحة')); render(1); if (typeof mapPaint === 'function') mapPaint(); return true;
}

function propGo(id){ var p = propFind(id); if (!p || !(+p.lat && +p.lng)) return; PROP_SHEET = false; PROP_POP = id; if (typeof MAP !== 'undefined' && MAP){ try { MAP.setView([+p.lat, +p.lng], Math.max(MAP.getZoom(), 17)); } catch (e){ LS_ERR = e; } } render(1); if (typeof mapPaint === 'function') mapPaint(); }

var SV_LABEL = { mount:'التثبيت', power:'الكهرباء', height:'الارتفاع (متر)', cable:'طول الكابل (متر)',
  len_m:'الطول المتاح (متر)', wid_m:'العرض المتاح (متر)', hgt_m:'الارتفاع المتاح (متر)',
  fit:'هل الموقع مناسب للتركيب؟', tents:'عدد الغرف أو الخيام', gates:'عدد بوابات المخيم',
  corr_w:'عرض المسار للاتجاه الواحد (متر)', kits:'عدد الأطقم الكاملة المطلوبة', jam_pos:'الدور والجهة',
  power_yn:'هل يوجد مصدر كهرباء؟', kits_done:'أطقمٌ منجزة', old_base:'هل القاعدة أو التثبيت القديم موجود؟',
  old_cable:'هل مسار الكابل القديم سليم؟', cam_ok:'هل الكاميرا تعمل؟', router_sp:'هل يوجد مكان لتركيب راوتر؟',
  power_src:'أقرب مصدر كهرباء', pdist:'المسافة إلى المصدر (متر)', p24:'التغذية متاحة ٢٤ ساعة؟',
  old_net:'العنوان القائم (بادئة الشبكة)',
  power_note:'ماذا تغيّر؟', n_ant:'عدد الهوائيات', n_rdr:'عدد القارئات', n_cam:'عدد الكاميرات',
  n_sens:'عدد الحساسات البيئية', metal:'هياكل معدنية مؤثرة قرب النقطة؟', chal_note:'تفصيل التحديات',
  civil:'هل يحتاج أعمال مدنية؟', equip:'المعدات اللازمة للوصول', hours:'تقدير ساعات التركيب', crew_n:'عدد أفراد الطاقم' };

function svFacts(r){
  var out = [];
  if (r.loc && r.loc.from){
    var m = Math.round(distKm(r.loc.from, { lat:r.loc.lat, lng:r.loc.lng }) * 1000);
    out.push(['نُقلت النقطة', nm(m) + ' ' + t('م') + ' \u2014 ' + t('عن موقعها المسجَّل')]);
  }
  ['mount','power','height','cable'].concat(SV_EXTRA_KEYS).forEach(function(k){
    var v = r[k];
    if (v === '' || v == null || v === 0 || v === '0') return;
    out.push([SV_LABEL[k] || k, String(v)]);
  });
  if (r.chals && r.chals.length) out.push(['التحديات', r.chals.map(function(c){ return t(c); }).join(' \u00b7 ')]);
  if (r.note) out.push(['ملاحظة المشرف', r.note]);
  out.push(['الصور', nm((r.photos || []).length)]);
  return out;
}

function qMatch(q, parts){
  var words = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  var hay = parts.filter(Boolean).join(' \u2022 ').toLowerCase();
  return words.every(function(wd){ return hay.indexOf(wd) > -1; });
}
function siteParts(st){
  st = st || {};
  return [st.id, st.name, st.zone, st.sign, st.sq, st.co, st.type, st.region, st.inout, st.work];
}
function chalSitesQ(){
  var L = chalSites(); if (!CHAL_Q) return L;
  return L.filter(function(x){
    return qMatch(CHAL_Q, [x.id].concat(siteParts(x.site), x.chals, [x.note, x.by, dispName(x.by),
      x.closed ? 'أُغلقت بالتركيب' : 'بانتظار حل']));
  });
}
function notifMineQ(){
  var L = notifMine(); if (!NTF_Q) return L;
  return L.filter(function(n){
    var st = n.site ? siteFind(n.site) : null;
    return qMatch(NTF_Q, [n.text, n.kind, t(n.kind), n.lv, n.to, dispName(n.to), n.by, dispName(n.by),
      n.site].concat(siteParts(st), [n.at ? fmtDT(n.at) : '', n.read ? 'مقروء' : 'غير مقروء']));
  });
}
function chalSites(){
  return Object.keys(STATE.recs).map(function(id){
    var r = STATE.recs[id];
    var reals = chalKeys(r.chals);
    if (!reals.length) return null;
    var ins = STATE.inss && STATE.inss[id];
    return { id:id, site:siteFind(id), chals:reals, note:r.note || '', by:r.by || '',
             at:r.at || 0, closed:!!(ins && ins.status === 'مُركّب' && ins.approved) };
  }).filter(Boolean).sort(function(a,b){ return b.at - a.at; });
}

var STK_OPEN = '', STK_F = '';

function stuckList(){
  var out = [];
  Object.keys(STATE.recs).forEach(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return;
    var ins = STATE.inss && STATE.inss[id];

    if (ins && ins.status === 'مُركّب') return;
    var days = Math.floor((Date.now() - (r.at || 0)) / 86400000);
    out.push({ id:id, site:x, rec:r, blocked:svStuck(r), accepted:!!(r.stuckOk), days:days });
  });
  return out.sort(function(a,b){ return b.days - a.days; });
}
function stuckAccept(id, note){
  if (!may('approve')){ toast(t('قرارُ المتعذّر للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب القرار: لماذا يُقبَل التعذّرُ ومن يحلُّه')); return false; }
  r.stuckOk = true; r.stuckNote = note; r.stuckBy = STATE.meta.name || ''; r.stuckAt = Date.now();
  r.review = '';
  CORE.set('recs', id, r);
  logEvent('قبولُ تعذّرٍ — ' + id + ' \u00b7 ' + note, id);
  notifPush('قُبل التعذّر', id + ' — ' + note, { to:r.by || '', site:id, lv:'عادي' });
  STK_OPEN = ''; statBump(); return true;
}
function stuckReopen(id){
  if (!may('approve')){ toast(t('قرارُ المتعذّر للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r) return false;
  delete r.stuckOk; delete r.stuckNote; delete r.stuckBy; delete r.stuckAt;
  CORE.set('recs', id, r); logEvent('إعادةُ فتح تعذّرٍ — ' + id, id); statBump(); return true;
}

function idleStep(id){
  var r = STATE.recs[id] || {}, ms = minState(r), so = solutionOf(id), tk = taskKindOf(id, 'install');
  if (svReview(r) !== 'approved') return { why:'بانتظار الاعتماد التقني', go:'svappr', lbl:'افتح الاعتماد التقني', cap:'approve' };
  if (ms === 'returned')          return { why:'ردّتها الوزارة — تحتاج معالجة', go:'minappr', lbl:'افتح اعتماد الوزارة', cap:'approve' };
  if (ms !== 'approved')          return { why:'بانتظار اعتماد الوزارة', go:'minappr', lbl:'افتح اعتماد الوزارة', cap:'minapprove' };
  if (!so)                        return { why:'لا حلَّ مقترحًا بعد', go:'solution', lbl:'اقترح الحل', cap:'approve' };
  if (so.status !== 'معتمد')      return { why:'الحلُّ مقترحٌ ولم يُعتمَد', go:'solution', lbl:'اعتمد الحل', cap:'approve' };
  if (tk)                         return { why:'مجدولة للتركيب — تنتظر الفريق', go:'req', lbl:'افتح الطلبات', cap:'approve' };
  return { why:'جاهزةٌ ولم يُسنَد تركيبُها', go:'ready', lbl:'أسنِد تركيبًا', cap:'approve' };
}
function stuckPanel(x){
  var r = x.rec, id = x.id, site = x.site;
  if (!x.blocked){
    var st = idleStep(id);
    var m2 = [['أين وقفت', t(st.why)], ['المشرف / الفني', dispName(r.by) || '—'], ['تاريخ الزيارة', r.at ? fmtDT(r.at) : '—'],
              ['الاعتماد التقني', r.reviewBy ? dispName(r.reviewBy) + ' \u00b7 ' + (r.reviewAt ? dayKey(r.reviewAt) : '') : '—'],
              ['اعتماد الوزارة', minState(r) === 'approved' ? (dispName(r.minBy || '') + ' \u00b7 ' + (r.minAt ? dayKey(r.minAt) : '')) : (minState(r) === 'returned' ? t('أعادتها') + ' \u2014 ' + (r.minNote || '') : '—')],
              ['المشعر / المربع', (site.zone || '—') + (site.sq ? ' \u00b7 ' + site.sq : '')], ['الشاخص', site.sign || '—'], ['الشركة', site.co || '—'],
              ['الملاحظات', r.note || '—']];
    return '<tr class="stk-panel"><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px">'
      + '<div class="grid cols-2">'
      +   '<div>' + table(['البند','القيمة'], m2.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
      +   '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(id)) + '</div>' + photoGalleryHtml(id) + '</div>'
      + '</div>'
      + '<div class="actions" style="margin:10px 0 0">'
      +   (may(st.cap) ? btn('\u27A4 ' + t(st.lbl),'btn-primary btn-sm',' data-p="' + esc(st.go) + '"') : '')
      +   btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"')
      +   btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"')
      +   (may('approve') ? btn('\u{1F501} ' + t('يعود المشرف لزيارة أخرى'),'btn-secondary btn-sm',' data-stkopenback="' + esc(id) + '"') : '')
      + '</div>'
      + (may('approve') ? '<div class="field" style="margin-top:8px"><label>' + esc(t('سببُ الإعادة')) + '</label><input data-stknote="' + esc(id) + '" dir="auto" placeholder="' + esc(t('يُملأ عند إعادة الزيارة للمشرف')) + '"></div>' : '')
      + '</td></tr>';
  }
  var meta = [['المشرف / الفني', dispName(r.by) || '—'], ['التاريخ', r.at ? fmtDT(r.at) : '—'],
              ['حالة الوصول', r.access || '—'], ['السبب', r.reason || '—'], ['الملاحظات', r.note || r.reopenNote || '—'],
              ['المشعر / المربع', (site.zone || '—') + (site.sq ? ' \u00b7 ' + site.sq : '')], ['الشاخص', site.sign || '—'],
              ['الشركة', site.co || '—']];
  if (r.stuckOk) meta.push(['القرار', '\u2705 ' + (r.stuckNote || '') + ' \u2014 ' + dispName(r.stuckBy || '') + ' \u00b7 ' + (r.stuckAt ? fmtDate(r.stuckAt) : '')]);
  if (r.review === 'revisit') meta.push(['رُدّت لزيارة أخرى', (r.revisitNote || '') + ' \u2014 ' + dispName(r.revisitBy || '')]);
  return '<tr class="stk-panel"><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px">'
    + '<div class="grid cols-2">'
    +   '<div>' + table(['البند','القيمة'], meta.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
    +   '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(id)) + '</div>' + photoGalleryHtml(id) + '</div>'
    + '</div>'
    + (may('approve') && !r.stuckOk
        ? '<div class="field" style="margin-top:10px"><label>' + esc(t('قرارُ المهندس')) + '</label>'
          + '<input data-stknote="' + esc(id) + '" dir="auto" placeholder="' + esc(t('مثال: تصريحُ دخولٍ مطلوبٌ من كدانة — يُرفَع للوزارة · أو: المشرفُ يعود مع الفني ومعه الأداة')) + '"></div>'
          + '<div class="actions" style="margin:8px 0 0">'
          + btn('\u{1F501} ' + t('يعود المشرفُ لزيارةٍ أخرى'),'btn-primary btn-sm',' data-stkback="' + esc(id) + '"')
          + btn('\u2705 ' + t('أقبل التعذّر — سببٌ حقيقيّ'),'btn-secondary btn-sm',' data-stkok="' + esc(id) + '"')
          + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"')
          + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"')
          + '</div><p class="hint" style="margin:6px 0 0">' + esc(t('«يعود المشرف»: تُردُّ الزيارةُ بسببك ويصله إشعارٌ. «أقبل التعذّر»: يخرج من هذه القائمة إلى «مقبول» وتُسجَّل الحُجّةُ باسمك.')) + '</p>'
        : (r.stuckOk && may('approve')
            ? '<div class="actions" style="margin:8px 0 0">' + btn('\u21A9 ' + t('أعد فتحه'),'btn-quiet btn-sm',' data-stkreopen="' + esc(id) + '"') + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"') + '</div>'
            : '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"') + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"') + '</div>'))
    + '</td></tr>';
}

var WR_DONE = '';

function regSet(id, patch){
  if (!may('approve')){ toast(t('تعديلُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x){ toast(t('لا إسنادَ بهذا المعرّف')); return; }
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُعدَّل')); return; }
  var wasTo = x.to || '', wasWhen = x.when || '';
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  CORE.set('tasks', id, x);
  logEvent('تعديل إسناد — ' + (x.no || id) + ' \u00b7 ' + wasTo + ' ' + wasWhen
           + ' \u2192 ' + (x.to || '') + ' ' + (x.when || ''));
  if (patch.to && patch.to !== wasTo)
    notifPush('إسناد', (x.no || '') + ' \u00b7 ' + x.site, { to:patch.to, site:x.site, lv:'عادي' });
  statBump();
}
function regDel(id){
  if (!may('approve')){ toast(t('حذفُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x) return;
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُحذَف — نقاطُ صاحبه بُنيت عليه')); return; }
  if (x.kind === 'visit' && svDone(STATE.recs[x.site])){
    toast(t('زِيرت النقطةُ فعلًا — اعتمد الزيارةَ أو ردّها بدل الحذف')); return;
  }
  delete STATE.tasks[id]; if (typeof TK_IX !== 'undefined') TK_IX = null;
  CORE.rm('tasks', id);
  logEvent('حذف إسناد — ' + (x.no || id) + ' \u00b7 ' + x.site);
  toast(t('حُذف الإسناد'));
  statBump(); render(1);
}
function workReqList(){
  return Object.keys(STATE.workReqs || {}).map(function(k){ return STATE.workReqs[k]; })
    .sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}

function workReqAdd(kind, item, qty, to){
  if (!may('edit')){ toast(t('طلبُ الورشة يحتاج صلاحية تعديل')); return; }
  var q = cfgN(qty);
  if (!item){ toast(t('اختر صنفًا')); return; }
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (kind === 'issue' && !to){ toast(t('اختر من يُصرَف له')); return; }
  var id = 'wr' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  var rec = { id:id, no:reqNext(kind), kind:kind, item:item, qty:q, qtyDone:0,
              to:to || '', status:'مطلوب', by:STATE.meta.name || '', at:Date.now() };
  STATE.workReqs = STATE.workReqs || {};
  STATE.workReqs[id] = rec;
  CORE.set('workReqs', id, rec);
  logEvent({ prep:'طلب تهيئة — ', asm:'طلب تجميع — ', issue:'طلب صرف — ' }[kind] + rec.no + ' \u00b7 '
           + itemName(item) + ' \u00d7' + nm(q) + (to ? ' \u2190 ' + to : ''));
  if (to) notifPush('طلب صرف', rec.no + ' \u00b7 ' + itemName(item) + ' \u00d7' + nm(q), { to:to, lv:'عادي' });
  toast(rec.no + ' \u00b7 ' + t('أُنشئ الطلب'));
  statBump();
  render(1);
}
function workReqComplete(id, qtyDone){
  if (!may('edit')){ toast(t('تنفيذُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  var q = cfgN(qtyDone);
  if (!q){ toast(t('اكتب الكمية المُنفَّذة')); return; }
  var remain = r.qty - cfgN(r.qtyDone);
  if (q > remain){ toast(t('المتبقّي من الطلب') + ': ' + nm(remain)); return; }
  r.qtyDone = cfgN(r.qtyDone) + q;
  r.status = r.qtyDone >= r.qty ? 'تم' : 'قيد التنفيذ';
  r.doneBy = STATE.meta.name || '';
  r.doneAt = Date.now();
  CORE.set('workReqs', id, r);

  var mvKind = { prep:'تهيئة', asm:'تجميع', issue:'صرف' }[r.kind] || 'تهيئة';
  var mv = { id:uid36(), at:Date.now(), kind:mvKind, item:r.item, qty:q,
             by: r.kind === 'issue' ? (r.to || r.doneBy) : r.doneBy, req:r.no };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', mv.id, mv);
  logEvent({ prep:'تنفيذ تهيئة — ', asm:'تنفيذ تجميع — ', issue:'تنفيذ صرف — ' }[r.kind] + r.no
           + ' \u00b7 ' + nm(q) + (r.kind === 'issue' && r.to ? ' \u2190 ' + r.to : ''));
  toast(r.no + ' \u00b7 ' + (r.status === 'تم' ? t('اكتمل الطلب') : t('تحديثٌ مُسجَّل')));
  statBump();
  render(1);
}

function workReqEdit(id, item, qty){
  if (!may('edit')){ toast(t('تعديلُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  if (r.status === 'تم'){ toast(t('طلبٌ اكتمل لا يُعدَّل')); return; }
  var q = cfgN(qty), done = cfgN(r.qtyDone);
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (q < done){ toast(t('نُفِّذ منه') + ' ' + nm(done) + ' — ' + t('لا تُنقَص الكميةُ دونه')); return; }
  if (item && item !== r.item && done){ toast(t('نُفِّذ جزءٌ منه — لا يُبدَّل صنفُه')); return; }
  var was = itemName(r.item) + ' \u00d7' + nm(r.qty);
  if (item) r.item = item;
  r.qty = q;
  r.status = done >= q ? 'تم' : (done ? 'قيد التنفيذ' : 'مطلوب');
  r.editBy = STATE.meta.name || '';
  r.editAt = Date.now();
  CORE.set('workReqs', id, r);
  logEvent('تعديل طلب ورشة — ' + r.no + ' \u00b7 ' + was + ' \u2192 ' + itemName(r.item) + ' \u00d7' + nm(r.qty));
  toast(r.no + ' \u00b7 ' + t('عُدِّل الطلب'));
  statBump(); render(1);
}
function workReqCancel(id){
  if (!may('edit')){ toast(t('إلغاءُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r) return;
  if (r.qtyDone){ toast(t('طلبٌ نُفِّذ جزءٌ منه لا يُلغى — أكمله أو اتركه')); return; }
  delete STATE.workReqs[id];
  CORE.dirty('workReqs', id, null);
  logEvent('إلغاء طلب ورشة — ' + r.no);
  toast(t('أُلغي الطلب'));
  statBump();
  render(1);
}

function itemZone(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  if (!x) return;
  x.z = x.z === 'cor' ? 'camp' : 'cor';
  itemSave();
  logEvent('نقل صنف — ' + x.name + ' → ' + (x.z === 'cor' ? 'ممر' : 'مخيم'));
  toast(t('نُقل إلى') + ' ' + t(x.z === 'cor' ? 'الممر' : 'المخيم'));
  render(1);
}
function itemDel(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var L = itemsList(), i = -1;
  L.forEach(function(x, k){ if (x.code === code) i = k; });
  if (i < 0) return;

  var u = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var r = STATE.inss[id];
    if (r && r.parts && r.parts[code]) u++;
  });
  if (u){ toast(t('مستعملٌ في') + ' ' + nm(u) + ' ' + t('تركيبًا — لا يُحذَف')); return; }

  var inReq = workReqList().filter(function(r){ return r.item === code && r.status !== 'تم'; }).length;
  var inSol = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var so = STATE.inss[id] && STATE.inss[id].solution;
    if (so && so.items && so.items[code]) inSol++;
  });
  if (inReq || inSol){
    toast(t('مستعملٌ في') + ' ' + nm(inReq) + ' ' + t('طلبَ ورشةٍ و') + nm(inSol) + ' ' + t('حلًّا — لا يُحذَف'));
    return;
  }
  var nm2 = L[i].name;
  L.splice(i, 1);
  itemSave();
  logEvent('حذف صنف — ' + nm2);
  toast(t('حُذف'));
  render(1);
}

function stageOut(path, code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  cfgSet(path, code, 0);
  logEvent('إخراج من المرحلة — ' + itemName(code) + ' · ' + path);
  toast(t('أُخرِج من المرحلة'));
  render(1);
}

function stageAdd(path){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name, pts:0, price:0, prep:0, asm:0 });
  itemSave();
  cfgSet(path, code, +g('itS') || 0);
  logEvent('صنف جديد — ' + name + ' · ' + path);
  toast(t('أُضيف الصنف'));
  render(1);
}

function itemAdd(){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name,
                     pts:+g('itP') || 0, price:+g('itR') || 0, prep:0, asm:0 });
  itemSave();
  cfgSet('itPts', code, +g('itP') || 0);
  cfgSet('itPrice', code, +g('itR') || 0);
  logEvent('صنف جديد — ' + name);
  toast(t('أُضيف الصنف'));
  render(1);
}

var MOVE_KINDS = ['توريد','صرف','استهلاك','إرجاع','شطب'];

function moveAdd(){
  if (!may('inventory')){ toast(t('المخزونُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var kind = g('mvKind'), item = g('mvItem'), qty = +g('mvQty') || 0;
  if (!kind || MOVE_KINDS.indexOf(kind) < 0){ toast(t('اختر نوع الحركة')); return; }
  if (!item){ toast(t('اختر الصنف')); return; }
  if (qty <= 0){ toast(t('الكميةُ أكبرُ من صفر')); return; }

  var b = stockBalance().filter(function(x){ return x.key === itemKey(item); })[0]
       || { store:0, custody:0 };
  if (kind === 'صرف' && qty > b.store){
    toast(t('المتاحُ في المخزن') + ': ' + nm(b.store)); return; }
  if (['استهلاك','إرجاع','شطب'].indexOf(kind) > -1 && qty > b.custody){
    toast(t('المتاحُ في العُهدة') + ': ' + nm(b.custody)); return; }

  var id = uid36();
  var mv = { id:id, kind:kind, item:item, qty:qty,
             by:g('mvBy'), site:g('mvSite'), note:g('mvNote'),
             at:Date.now(), user:STATE.meta.name || '' };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', id, mv);
  logEvent('حركة مخزون — ' + kind + ' · ' + item + ' × ' + nm(qty));
  toast(t('سُجّلت الحركة'));
  render(1);
}

function trialAdd(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var n = g('trN'); if (!n){ toast(t('اكتب اسمَ التجربة')); return; }
  var hrs = +g('trH') || 0;
  var rep = g('trRep');
  if (rep && !/^https?:\/\//i.test(rep)){ toast(t('رابطُ التقرير يبدأ بـ https')); return; }
  trialRows().unshift({ id:uid36(), n:n, date:g('trD') || dayKey(),
                        hours:hrs, note:g('trNote'), by:STATE.meta.name || '', at:Date.now(),
                        gw:g('trGw'), gwN:+g('trGwN') || 0, sn:g('trSn'), snN:+g('trSnN') || 0,
                        where:g('trWhere'), out:g('trOut') || 'جارية', report:rep });
  if (trialSave()){ logEvent('تجربة — ' + n + (hrs ? ' · ' + hrs + ' ساعة' : '')); toast(t('سُجّلت التجربة')); render(1); }
}
function trialHoursAdd(id, h){
  var r = trialOf(id); if (!r) return;
  r.hours = Math.max(0, (+r.hours || 0) + h);
  if (trialSave()){ toast(t('حُدّثت ساعاتُ التجربة')); render(1); }
}

function trialLinkSite(id, on){
  if (!trialMay()) return '';
  var x = siteFind(id), f = trialForSite(id);
  if (on){
    if (f && f.how === 'linked') return 'linked';
    if (f){ f.row.site = id; if (!f.row.where && x) f.row.where = x.name || id; trialSave(); return 'matched'; }
    trialRows().unshift({ id:uid36(), n:t('تجربة') + ' — ' + ((x && x.name) || id), date:dayKey(), hours:0, note:'', by:STATE.meta.name || '', at:Date.now(), where:(x && x.name) || id, site:id, out:'جارية', report:'' });
    trialSave(); return 'created';
  }
  if (!f || f.how !== 'linked') return '';
  var r = f.row, empty = !(trialTotal(r) > 0) && !(+r.hours > 0) && !r.report && !(trialItems(r.id) || []).length;
  if (empty){ trialsDoc().rows = trialRows().filter(function(z){ return z !== r; }); trialSave(); return 'removed'; }
  return 'kept';
}

function trialRemove(id){
  if (!trialMay()) return;
  if (trialTotal(trialOf(id) || { id:id }) > 0){ toast(t('لا تُحذَف تجربةٌ عليها مصروف')); return; }
  trialsDoc().rows = trialRows().filter(function(x){ return String(x.id) !== String(id); });
  if (trialSave()){ logEvent('حذفُ تجربة — ' + id, id); toast(t('حُذفت التجربة')); render(1); }
}
function trialToggleCost(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var d = trialsDoc(); d.inCost = !d.inCost;
  if (trialSave()){
    logEvent('مصروفُ التجارب ' + (d.inCost ? 'داخلٌ في التكاليف' : 'خارجٌ عن التكاليف'));
    toast(t(d.inCost ? 'دخل مصروفُ التجارب في التكاليف' : 'خرج مصروفُ التجارب من التكاليف'));
    render(1);
  }
}

function trialKitLoad(id){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var r = trialOf(id); if (!r) return;
  if (!Array.isArray(r.items)) r.items = [];
  var have = {}; r.items.forEach(function(x){ have[x.code || x.n] = 1; have[x.n] = 1; });
  var add = trialCatItems(r.type).filter(function(i){ return !have[i.code] && !have[i.name]; });
  if (!add.length){ toast(t('كلُّ قطع النوع مضافةٌ بالفعل')); return; }
  add.forEach(function(i){ r.items.push({ n:i.name, code:i.code, q:1, p:+i.price || 0, at:Date.now(), by:STATE.meta.name || '' }); });
  if (trialSave()){ logEvent('قطعُ نوعٍ لتجربة — ' + r.n + ' · ' + r.type + ' · ' + add.length); toast(t('أُضيفت قطعُ النوع') + ' (' + nm(add.length) + ')'); render(1); }
}
function trialItemAdd(id){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var r = trialOf(id); if (!r) return;
  var g = function(k){ var el = document.getElementById(k + id); return el ? String(el.value || '').trim() : ''; };
  var code = g('itC'), cat = code ? itemsList().filter(function(i){ return i.code === code; })[0] : null;
  var n = g('itN') || (cat ? cat.name : ''); if (!n){ toast(t('اختر قطعةً أو اكتب اسمَ الصنف')); return; }
  if (g('itN')) cat = null;
  var q = +g('itQ') || 1, p = g('itP') !== '' ? (+g('itP') || 0) : (cat ? (+cat.price || 0) : 0);
  if (!Array.isArray(r.items)) r.items = [];
  r.items.push(cat ? { n:n, code:cat.code, q:q, p:p, at:Date.now(), by:STATE.meta.name || '' } : { n:n, q:q, p:p, at:Date.now(), by:STATE.meta.name || '' });
  if (trialSave()){ logEvent('صنفُ تجربة — ' + r.n + ' · ' + n); toast(t('أُضيف الصنف')); render(1); }
}
function trialItemDel(id, i){
  if (!trialMay()) return;
  var r = trialOf(id); if (!r || !Array.isArray(r.items)) return;
  r.items.splice(i, 1);
  if (trialSave()){ toast(t('حُذف الصنف')); render(1); }
}

var BUY_ED = '';

function buyEdit(id){
  var b = (STATE.buys || {})[id]; if (!b || !buyMayEdit()){ toast(t('تعديلُ المشتريات للمهندس والمدير')); return; }
  BUY_ED = id; render(1);
  setTimeout(function(){ var set = function(k, v){ var el = document.getElementById(k); if (el) el.value = v == null ? '' : v; };
    set('byItem', b.item); set('byCat', b.cat); set('bySup', b.sup); set('byAmt', b.amt); set('byZone', b.zone || '\u2014'); set('byTrial', b.trial || '');
    var f = document.getElementById('byItem'); if (f){ try { f.scrollIntoView({ block:'center' }); f.focus(); } catch (e){ LS_ERR = e; } } }, 30);
}
function buyDel(id){
  var b = (STATE.buys || {})[id]; if (!b) return;
  if (!buyMayEdit()){ toast(t('حذفُ المشتريات للمهندس والمدير')); return; }
  var why = '';
  if (b.st === 'معتمد'){ why = String(window.prompt(t('عمليةٌ معتمدةٌ داخل المنصرف — اكتب سببَ الحذف (يُحفَظ في سجل الأحداث):'), '') || '').trim(); if (!why){ toast(t('لم تُحذف — السببُ مطلوبٌ للمعتمد')); return; } }
  else if (!confirm(t('حذفُ عملية الشراء') + ' «' + b.item + '» (' + nm(b.amt) + ')؟')) return;
  logEvent('حذف مشترى — ' + b.item + ' · ' + nm(b.amt) + ' ريال · ' + b.sup + ' · ' + b.st + (why ? ' · السبب: ' + why : ''));
  CORE.rm('buys', id); if (BUY_ED === id) BUY_ED = '';
  toast(t('حُذفت العملية')); render(1);
}

function buyInvCell(b){
  if (!b || !b.inv) return '';
  var P = photosOf(b.inv).filter(function(x){ return !x[1].del; });
  var up = P.filter(function(x){ return x[1].link; })[0];
  if (up) return '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(up[1].link) + '">\u{1F9FE} ' + esc(t('افتح')) + '</a>';
  var q = (PHOTO_Q || []).some(function(it){ return it.site === b.inv; });
  return '<span class="hint" style="margin:0">\u{1F9FE} ' + esc(t(q || P.length ? 'تُرفع…' : 'لم تصل')) + '</span>';
}
function buyAdd(){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var item = g('byItem'), cat = g('byCat'), sup = g('bySup');
  var amt = +g('byAmt') || 0, zone = g('byZone'), trial = g('byTrial');
  if (!item){ toast(t('اكتب الصنف')); return; }
  if (catList().indexOf(cat) < 0){ toast(t('الفئةُ من القائمة المعتمدة')); return; }
  if (supList().indexOf(sup) < 0){ toast(t('المورّدُ من القائمة المعتمدة')); return; }
  if (amt <= 0){ toast(t('المبلغُ أكبرُ من صفر')); return; }

  var cap = cfgGet('budApp') || 0;
  var old = BUY_ED ? (STATE.buys || {})[BUY_ED] : null;
  var id = old ? old.id : uid36();
  var b = { id:id, item:item, cat:cat, sup:sup, amt:amt, zone:zone, trial:trial || '',
            at:old ? old.at : Date.now(), by:old ? old.by : (STATE.meta.name || ''),
            st: (cap && amt > cap) ? 'بانتظار الاعتماد' : 'معتمد' };
  if (old){ b.edAt = Date.now(); b.edBy = STATE.meta.name || ''; BUY_ED = ''; }
  if (old && old.inv) b.inv = old.inv;
  if (BUY_PH && BUY_PH.data){ b.inv = 'BUY-' + id; try { photoQueue(b.inv, 'invoice', BUY_PH.data); } catch (eP){ softErr('صورة الفاتورة', eP, 'تعذّر حفظ صورة الفاتورة — أعد اختيارها'); } BUY_PH = null; }
  if (!STATE.buys) STATE.buys = {};
  STATE.buys[id] = b;
  CORE.set('buys', id, b);
  logEvent((old ? 'تعديل مشترى — ' : 'مشترى — ') + item + ' · ' + nm(amt) + ' ريال · ' + b.st + (old && (old.amt !== amt || old.item !== item) ? ' (كان ' + old.item + ' · ' + nm(old.amt) + ')' : ''));
  if (b.st !== 'معتمد')
    notifPush('اعتماد شراء', 'مشترًى يتجاوز حدَّ الاعتماد — ' + item + ' · ' + nm(amt), { lv:'مهم' });
  toast(t(old ? 'حُفظ التعديل' : (b.st === 'معتمد' ? 'سُجّل المشترى' : 'سُجّل بانتظار اعتماد المهندس — تجاوز حدَّ الاعتماد')));
  render(1);
}

function listAdd(kind){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var el = document.getElementById(kind === 'sup' ? 'supNew' : 'catNew');
  var v = el ? String(el.value || '').trim() : '';
  if (!v){ toast(t('اكتب الاسم أولًا')); return; }
  var L = kind === 'sup' ? supList() : catList();
  if (L.indexOf(v) > -1){ toast(t('موجودٌ بالفعل')); return; }
  L.push(v);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'مورّد جديد — ' : 'فئة مشتريات جديدة — ') + v);
  toast(t('أُضيف'));
  render(1);
}
function listRm(kind, v){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var used = buysList().filter(function(b){ return (kind === 'sup' ? b.sup : b.cat) === v; }).length;
  if (used){ toast(t('مستعملٌ في') + ' ' + nm(used) + ' ' + t('عملية — لا يُحذَف')); return; }
  var L = kind === 'sup' ? supList() : catList();
  var i = L.indexOf(v);
  if (i < 0) return;
  L.splice(i, 1);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'حذف مورّد — ' : 'حذف فئة — ') + v);
  toast(t('حُذف'));
  render(1);
}

PAGE.inv = { m:'الورشة والمخزون', t:'المخزون',
  l:'الأرصدةُ وحركتُها وعُهدةُ كلِّ منفِّذ — في شاشةٍ واحدة.',
  body:function(){
    var head = tabHead('inv'), cur = tabCur('inv');
    if (cur === 'wos') return head + (function(){
    var Tg = T();
    var L = workReqList();
    var prepReq = L.filter(function(x){ return x.kind === 'prep'; });
    var asmReq  = L.filter(function(x){ return x.kind === 'asm'; });
    var openPrep = prepReq.filter(function(x){ return x.status !== 'تم'; }).length;
    var openAsm  = asmReq.filter(function(x){ return x.status !== 'تم'; }).length;

    var byItem = {};
    itemsList().forEach(function(i){ byItem[i.code] = i; });
    var pp = { camp:0, cor:0 }, pa = { camp:0, cor:0 };
    (STATE.moves || []).forEach(function(m){
      var it = byItem[itemCode(m.item)];
      if (!it) return;
      var zone = it.z === 'cor' ? 'cor' : 'camp';
      if (m.kind === 'تهيئة') pp[zone] += itPrep(it.code) * cfgN(m.qty);
      if (m.kind === 'تجميع') pa[zone] += itAsm(it.code) * cfgN(m.qty);
    });

    return stats([['طلباتُ تهيئةٍ مفتوحة', N(openPrep), openPrep ? 'wrn' : 'ok'],
                  ['طلباتُ تجميعٍ مفتوحة', N(openAsm), openAsm ? 'wrn' : 'ok'],
                  ['طلباتٌ مكتملة', N(L.filter(function(x){ return x.status === 'تم'; }).length), 'ok']])

      + card('الورشة مقابل التارجت',
          table(['المرحلة','النوع','نقاط الشهر','تارجت الشهر','٪','تارجت الأسبوع'], [
            ['تهيئة','مخيمات', N(Math.round(pp.camp)), N(Tg.prepCamp), pct(pp.camp,Tg.prepCamp), N(cfgWk(Tg.prepCamp))],
            ['تهيئة','ممرات',  N(Math.round(pp.cor)),  N(Tg.prepCor),  pct(pp.cor,Tg.prepCor),   N(cfgWk(Tg.prepCor))],
            ['تجميع','مخيمات', N(Math.round(pa.camp)), N(Tg.asmCamp), pct(pa.camp,Tg.asmCamp),  N(cfgWk(Tg.asmCamp))],
            ['تجميع','ممرات',  N(Math.round(pa.cor)),  N(Tg.asmCor),  pct(pa.cor,Tg.asmCor),    N(cfgWk(Tg.asmCor))]
          ], ['الإجمالي','', N(Math.round(pp.camp+pp.cor+pa.camp+pa.cor)), N(Tg.prep+Tg.asm),
              pct(pp.camp+pp.cor+pa.camp+pa.cor, Tg.prep+Tg.asm), N(cfgWk(Tg.prep+Tg.asm))]))

      + (may('edit')
        ? card('طلبٌ جديد',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
            + '<select id="wrKind"><option value="prep">' + esc(t('تهيئة')) + ' (CR)</option>'
            + '<option value="asm">' + esc(t('تجميع')) + ' (AR)</option>'
            + '<option value="issue">' + esc(t('صرف أصناف')) + ' (IR)</option></select></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label>'
            + '<select id="wrItem">' + itemsList().map(function(i){
                return '<option value="' + esc(i.code) + '">' + esc(i.name) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('الكمية المطلوبة')) + '</label>'
            + '<input type="number" id="wrQty" min="1" value="10"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('يُصرَف له')) + '</label>'
            +   '<select id="wrTo"><option value="">— ' + esc(t('للورشة — بلا عهدة شخص')) + ' —</option>'
            +   techsList().map(function(x){
                  return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>'; }).join('')
            +   '</select>'
            +   '<p class="hint" style="margin:6px 0 0">' + esc(t('يلزم مع «صرف أصناف» — القطعُ تدخل عُهدةَ من يُصرَف له لا عهدةَ من سجّل التنفيذ.')) + '</p></div>'
            + '</div>',
            btn('➕ إنشاء الطلب','btn-primary btn-sm',' data-wradd="1"'))
        : '')

      + (WR_DONE
        ? card(t('تسجيل تنفيذٍ') + ' — ' + esc(WR_DONE),
            '<div class="field" style="max-width:220px;margin:0"><label>' + esc(t('الكمية المُنفَّذة الآن')) + '</label>'
            + '<input type="number" id="wrDoneQty" min="1" value="1"></div>',
            btn('تأكيد','btn-primary btn-sm',' data-wrdonego="' + esc(WR_DONE) + '"')
            + btn('تراجع','btn-quiet btn-sm',' data-wrdonecancel="1"'))
        : '')

      + (L.length
        ? cardFlush(t('الطلبات') + ' — ' + nm(L.length),

            table(['الطلب','الصنف','المطلوب / المنفَّذ','الحالة','أنشأه',''],
              L.map(function(r){
                var ed = WR_EDIT === r.id;
                return ['<span class="num">' + esc(r.no) + '</span><br>'
                          + (r.kind === 'prep' ? pill('تهيئة','acc')
                             : (r.kind === 'issue' ? pill('صرف','off') : pill('تجميع','warn'))),
                        ed && !cfgN(r.qtyDone)
                          ? '<select data-wreitem="' + esc(r.id) + '">' + itemsList().map(function(i){
                              return '<option value="' + esc(i.code) + '"' + (i.code === r.item ? ' selected' : '') + '>'
                                + esc(i.name) + '</option>'; }).join('') + '</select>'
                          : esc(itemName(r.item)),
                        ed
                          ? '<input type="number" min="1" id="wrEQ_' + esc(r.id) + '" value="' + esc(String(cfgN(r.qty))) + '" style="width:84px">'
                          : (N(r.qty) + ' / ' + N(r.qtyDone || 0)),
                        pill(r.status, r.status === 'تم' ? 'ok' : (r.status === 'قيد التنفيذ' ? 'warn' : 'off')),
                        '<span class="hint" style="margin:0">' + esc(dispName(r.by)) + '<br>'
                          + '<span class="num">' + esc(fmtDate(r.at)) + '</span></span>',
                        ed
                          ? '<div class="actions" style="margin:0">'
                            + btn('احفظ','btn-primary btn-sm',' data-wresave="' + esc(r.id) + '"')
                            + btn('إلغاء','btn-quiet btn-sm',' data-wredit=""') + '</div>'
                          : (r.status !== 'تم'
                          ? '<div class="actions" style="margin:0">'
                            + btn('سجّل تنفيذًا','btn-quiet btn-sm',' data-wrdone="' + esc(r.id) + '"')
                            + btn('✎','btn-quiet btn-sm',' data-wredit="' + esc(r.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                            + (r.qtyDone ? '' : btn('🗑','btn-quiet btn-sm',' data-wrcancel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"'))
                            + '</div>'
                          : '—')];
              })))
        : card('لا طلباتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('أنشئ أوّل طلب تهيئةٍ أو تجميعٍ أعلاه.')) + '</p>'))

      + '<p class="hint">' + esc(t('كلُّ تنفيذٍ يُسجَّل في دفتر الحركة بنوعه الصحيح فيدخل حساب النقاط — لا تقديرَ ولا تارجت بلا منفَّذ.')) + '</p>';
  })();
    if (cur === 'wday') return head + (function(){
    var today = dayKey();
    var byName = Object.create(null);
    Object.keys(STATE.inss).forEach(function(id){
      var r = STATE.inss[id], x = siteFind(id);
      if (!x || r.status !== 'مُركّب' || !r.by) return;
      var day = dayKey(r.at || 0);
      if (day !== today) return;
      if (!byName[r.by]) byName[r.by] = { n:0, pts:0 };
      byName[r.by].n++;
      byName[r.by].pts += r.approved ? ptsInstall(x) : 0;
    });
    var names = Object.keys(byName).sort(function(a,b){ return byName[b].pts - byName[a].pts; });
    var totN = names.reduce(function(a,n){ return a + byName[n].n; }, 0);
    var totP = names.reduce(function(a,n){ return a + byName[n].pts; }, 0);

    return stats([['نفّذوا اليوم', N(names.length), 'acc'],
                  ['تركيباتٌ اليوم', N(totN)],
                  ['نقاطُ اليوم', N(Math.round(totP))]])

      + (names.length
        ? cardFlush(t('تركيبُ اليوم') + ' — ' + nm(names.length),
            table(['المنفِّذ','تركيب','نقاط'],
              names.map(function(n){ return [esc(n), N(byName[n].n), N(Math.round(byName[n].pts))]; }),
              ['<b>' + t('الإجمالي') + '</b>', N(totN), N(Math.round(totP))]))
        : card('تركيبُ اليوم',
            '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبَ اليوم بعد.')) + '</p>'))

      + alertBox('warn','التهيئةُ والتجميعُ لا يُحتسَبان هنا بعد — نظامُ طلبات الورشة (من نفَّذ ماذا) لم يُبنَ، كما في «طلبات المستودع».');
  })();
    if (cur === 'ships') return head + (function(){
    var L = shipList().filter(function(x){
      return !SHIP_Q || (x.ref + ' ' + (x.item || '') + ' ' + (x.sup || '')).indexOf(SHIP_Q) > -1;
    });
    var late = shipList().filter(function(x){ return shipLate(x) > 0; });
    var open = shipList().filter(function(x){ return !x.got; });

    return stats([['شحنات', N(shipList().length)],
                  ['في الطريق', N(open.length), open.length ? 'acc' : ''],
                  ['وصلت', N(shipList().length - open.length), 'ok'],
                  ['متأخرة', N(late.length), late.length ? 'bad' : 'ok']])

      + (late.length
        ? alertBox('warn', 'متأخرةٌ عن موعدها: '
            + late.map(function(x){ return x.ref + ' — ' + nm(shipLate(x)) + ' يومًا'; }).join(' · ')
            + '. الموعدُ المتوقَّعُ يُكتَب يومَ الشحن، فيُعرَف التأخّرُ يومَه لا بعد أسبوعين.')
        : '')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="shQ" data-shq="1" value="' + esc(SHIP_Q) + '" placeholder="'
      +     esc(t('ابحث برقم الشحنة أو الصنف أو المورّد')) + '" dir="auto">'
      + '</form>'

      + cardFlush(t('الشحنات') + ' — ' + nm(L.length),
          L.length
            ? table(['رقم الشحنة','الصنف','العدد','المورّد','الحالة','شُحنت','متوقَّع','وصلت','التأخّر',''],
                L.map(function(x){
                  var lt = shipLate(x);
                  return ['<strong>' + esc(x.ref) + '</strong>',
                          '<input value="' + esc(x.item || '') + '" data-shi="' + esc(x.id) + '" dir="auto">',
                          '<input type="number" min="0" value="' + esc(String(x.qty || 0))
                            + '" data-shqy="' + esc(x.id) + '" style="max-width:86px">',
                          '<input value="' + esc(x.sup || '') + '" data-shs="' + esc(x.id) + '" dir="auto">',
                          '<select data-shst="' + esc(x.id) + '">'
                            + SHIP_ST.map(function(v){
                                return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>';
                              }).join('') + '</select>',
                          '<input type="date" value="' + esc(x.sent || '') + '" data-shsn="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.eta || '') + '" data-sheta="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.got || '') + '" data-shgot="' + esc(x.id) + '">',
                          lt ? pill(nm(lt) + ' ' + t('يوم'), 'bad')
                             : (x.got ? pill(t('وصلت'), 'ok') : '—'),
                          (may('inventory') || may('money'))
                            ? (x.got ? '<span class="hint" style="margin:0">' + esc(t('وصلت')) + '</span>'
                                     : btn('حذف','btn-quiet btn-sm',' data-shdel="' + esc(x.id) + '"'))
                            : ''];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا شحناتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ships"') : '')

      + ((may('inventory') || may('money'))
        ? card('تسجيل شحنة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('رقم الشحنة')) + ' <span class="req">*</span></label>'
            +   '<input id="shRef" dir="auto" placeholder="SH-1448-001"></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="shItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('العدد')) + '</label>'
            +   '<input id="shQty" type="number" min="0" value="0"></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label>'
            +   '<select id="shSup"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   supList().map(function(v){ return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('تاريخ الشحن')) + '</label>'
            +   '<input id="shSent" type="date" value="' + esc(todayISO()) + '"></div>'
            + '<div class="field"><label>' + esc(t('الوصول المتوقَّع')) + ' <span class="req">*</span></label>'
            +   '<input id="shEta" type="date"></div>'
            + '</div>',
            btn('➕ تسجيل شحنة','btn-primary btn-sm',' data-shadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('الوصولُ المتوقَّعُ يُكتَب يومَ الشحن — وبه يُحسَب التأخّرُ بنفسه ويصل إشعارٌ عاجلٌ مرةً في اليوم. والشحنةُ التي وصلت لا تُحذَف: سجلُّها أثرٌ يُسأل عنه.')) + '</p>';
  })();
    if (cur === 'invmv') return head + (function(){
    var L = movesList(), items = itemsList();

    var gap = 0; Object.keys(STATE.inss || {}).forEach(function(id){ var r = STATE.inss[id]; if (!r || r.deleted || !r.status || insStatusIs(r.status, 'مسودّة') || insStatusIs(r.status, 'متعذّر')) return; var had = insConsumed(id); Object.keys(r.parts || {}).forEach(function(k){ if ((cfgN(r.parts[k]) || 0) !== (had[k] || 0)) gap++; }); });
    return (may('inventory') && gap
      ? card('', alertBox('warn', t('تركيباتٌ لم تصل دفترَ المخزن') + ': ' + nm(gap) + ' ' + t('صنفًا — سُجِّلت قبل إصلاح الدفتر (٣٨٫٦٩)'))
          + '<div class="actions">' + btn('\u2696 ' + t('سوِّ الدفتر مع التركيبات'), 'btn-primary btn-sm', ' data-mvsettle="1"') + '</div>'
          + '<p class="hint" style="margin:6px 0 0">' + esc(t('تُسجَّل حركةُ «استهلاك» باسم المنفِّذ لكلِّ ما رُكِّب ولم يُخصَم — مرةً واحدة، ولا تتكرّر لو ضُغطت ثانية.')) + '</p>')
      : '')
      + (may('inventory')
      ? card('تسجيل حركة',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الحركة')) + '</label><select id="mvKind">'
          +   MOVE_KINDS.map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الصنف')) + '</label><select id="mvItem">'
          +   '<option value="">— ' + esc(t('اختر')) + ' —</option>'
          +   items.map(function(x){ return '<option>' + esc(x.name) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الكمية')) + '</label>'
          +   '<input id="mvQty" type="number" min="1" step="1"></div>'
          + '<div class="field"><label>' + esc(t('المنفِّذ')) + '</label><select id="mvBy">'
          +   '<option value="">—</option>'
          +   techsList(1).map(function(x){ return '<option>' + esc(x.n) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          +   '<input id="mvSite" dir="ltr" placeholder="NSK-…"></div>'
          + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label><input id="mvNote" dir="auto"></div>'
          + '</div>'
          + '<div class="actions">' + btn('سجّل الحركة','btn-primary',' data-mvadd="1"') + '</div>'
          + '<p class="hint">' + esc(t('الرصيدُ يُشتقُّ من الحركات — والتصحيحُ حركةٌ تصحيحيةٌ لا تعديلُ رقم.')) + '</p>')
      : '')
      + cardFlush(t('الحركات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الحركة','الصنف','الكمية','المنفِّذ','النقطة','سجّلها'],
                capList(L, 200).map(function(m){
                  var k = {'توريد':'ok','صرف':'acc','استهلاك':'warn','إرجاع':'info','شطب':'off'}[m.kind] || '';
                  return ['<span class="num">' + esc(dayKey(m.at)) + '</span>',
                          pill(t(m.kind), k), esc(m.item), N(m.qty),
                          esc(m.by || '—'),
                          '<span class="num">' + esc(m.site || '—') + '</span>',
                          esc(m.user || '—') + ((may('inventory') && m.kind !== 'استهلاك' && Date.now() - (+m.at || 0) < 864e5) ? ' <button type="button" class="btn btn-quiet btn-sm" style="color:#E05252" data-mvdel="' + esc(m.id) + '">\u{1F5D1}</button>' : '')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا حركاتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="invmv"') : '');
  })();
    if (cur === 'stock') return head + (function(){
    var L = custodyByWho();
    var tot = L.reduce(function(a,r){ return a + r.total; }, 0);

    return stats([['من بيدهم عُهدة', N(L.length), L.length ? 'acc' : ''],
                  ['قطعٌ في العُهدة', N(tot)]])

      + (L.length
        ? cardFlush(t('العُهدة حسب المنفِّذ') + ' — ' + nm(L.length),
            table(['المنفِّذ','أصناف','قطع','التفصيل'],
              L.map(function(r){
                var ks = Object.keys(r.items).filter(function(k){ return r.items[k] > 0; });
                return ['<strong>' + esc(dispName(r.who)) + '</strong>', N(ks.length), N(r.total),
                        '<span class="hint" style="margin:0">'
                          + ks.map(function(k){ return esc(itemName(k)) + ' \u00d7' + nm(r.items[k]); }).join(' \u00b7 ')
                          + '</span>'];
              })))
        : card('لا عُهدةَ مصروفةً الآن',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور أول صرفٍ من «دفتر حركة المخزون».')) + '</p>'))

      + '<p class="hint">' + esc(t('العُهدةُ صرفٌ ناقصَ ما استُهلك أو أُرجع أو شُطب — لا رقمَ يُكتب بيد.')) + '</p>';
  })();
    return head + (function(){
    var B = stockBalance();
    var tot = B.reduce(function(a,r){ return { store:a.store+r.store, custody:a.custody+r.custody,
                                               used:a.used+r.used, scrap:a.scrap+r.scrap }; },
                       { store:0, custody:0, used:0, scrap:0 });
    return stats([['في المخزن', N(tot.store), 'ok'],
                  ['في العُهدة', N(tot.custody), 'acc'],
                  ['رُكّب في الميدان', N(tot.used)],
                  ['تالف معزول', N(tot.scrap), tot.scrap ? 'bad' : '']])
      + cardFlush('الأرصدة حسب الصنف',
          B.length
            ? table(['الصنف','المخزن','العُهدة','رُكّب','تالف','الإجمالي'],
                B.map(function(r){
                  return [esc(r.item), N(r.store), N(r.custody), N(r.used),
                          r.scrap ? pill(nm(r.scrap),'off') : N(0),
                          '<b>' + N(r.store + r.custody + r.used + r.scrap) + '</b>'];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا حركاتٍ بعد — الرصيدُ يُشتقُّ من الحركات ولا يُكتَب بيد.')) + '</p>')
      + (B.some(function(r){ return r.store < 0 || r.custody < 0; })
          ? alertBox('warn','رصيدٌ سالبٌ في صنف — حركةٌ سُجّلت بلا ما يقابلها.') : '');
  })();
  }};

function custodyByWho(){
  var by = {};
  function row(who){
    if (!by[who]) by[who] = { who:who, items:{}, total:0 };
    return by[who];
  }
  movesList().slice().sort(function(a, b){ return movAt(a) - movAt(b); }).forEach(function(m){
    var who = m.by || '—', q = cfgN(m.qty), it = m.item || '—';
    if (!q) return;
    var d = 0;
    if (m.kind === 'صرف' || m.kind === 'تصحيح استهلاك') d = q;
    else if (m.kind === 'استهلاك'){ var held = (by[who] && by[who].items[it]) || 0; d = -Math.min(q, Math.max(0, held)); if (!d) return; }
    else if (m.kind === 'إرجاع' || m.kind === 'شطب'
             || m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف') d = -q;
    else return;
    var r = row(who);
    r.items[it] = (r.items[it] || 0) + d;
    r.total += d;
  });
  return Object.keys(by).map(function(k){ return by[k]; })
    .filter(function(r){ return r.total > 0; })
    .sort(function(a,b){ return b.total - a.total; });
}

setInterval(function(){ presenceBeat(false); }, 30 * 60000);

function wipeCounts(){
  return WIPE_KEYS.map(function(k){
    var v = STATE[k[0]];
    return [k[1], Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0), k[2]];
  });
}

function wipeGo(){
  if (!may('delete')){ toast(t('التصفيرُ للمهندس وحده')); return; }
  var el = document.getElementById('wipeOk');
  if (!el || String(el.value || '').trim() !== 'مسح نهائي'){
    toast(t('اكتب «مسح نهائي» حرفًا بحرف للتأكيد')); return;
  }

  var n = 0, dels = [], local = 0;
  WIPE_KEYS.forEach(function(k){
    var v = STATE[k[0]];
    var cnt = Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0);
    n += cnt;
    if (k[2]){
      var ids = Array.isArray(v)
        ? v.map(function(x){ return x && x.id; }).filter(Boolean)
        : Object.keys(v || {});
      ids.forEach(function(id){ dels.push([k[2], id]); });
    } else local += cnt;
    STATE[k[0]] = Array.isArray(v) ? [] : {};
  });

  STATE.evlog = {};

  if (STATE.queue) STATE.queue.length = 0;
  STATE.poison = [];

  dels.forEach(function(d){
    if (CORE.TOMB[d[0]]) CORE.dirty(d[0], d[1], { id:String(d[1]), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
    else CORE.dirty(d[0], d[1], null);
  });

  STATE.sites.forEach(function(x){ x.fstat = 'لم يبدأ'; });
  SITE_IX = null; SITE_TOK = null;

  STATE.meta.epoch = Date.now();
  CORE.set('cfg', 'app', { epoch:STATE.meta.epoch, epochBy:STATE.meta.name || '', epochAt:STATE.meta.epoch });
  CORE.saveSoon(); statBump();
  logEvent('تصفير النظام — ' + nm(n) + ' سجلًّا · ' + nm(dels.length) + ' أمرَ حذفٍ للسحابة · '
           + nm(local) + ' أُفرغ من الجهاز');
  toast(t('صُفِّر النظام') + ' — ' + nm(n) + ' ' + t('سجلًّا'));
  render(1);
}

function localStoreCard(){
  var idb = IDB_BAD ? pill(t('لا يعمل — الذاكرةُ فقط'), 'bad') : (_idb ? pill(t('يعمل'), 'ok') : pill(t('يُفتَح…'), ''));
  var ps = PERSIST.st === 'yes' ? pill(t('مُنح'), 'ok') : PERSIST.st === 'no' ? pill(t('لم يُمنَح'), 'wrn') : PERSIST.st === 'na' ? pill(t('غيرُ متاح'), '') : pill(t('لم يُسأل بعد'), '');
  return card('المخزنُ المحلي', '<div class="wt-row" style="gap:14px;flex-wrap:wrap">'
    + '<span>' + esc(t('قاعدةُ الجهاز')) + ': ' + idb + '</span>'
    + '<span>' + esc(t('التخزينُ الدائم')) + ': ' + ps + '</span>'
    + (IDB_BAD ? '<span class="hint" style="margin:0">' + esc(t('زامن الآن ولا تغلق التطبيق حتى يُرفَع عملُك.')) + '</span>' : '') + '</div>');
}

function sysReportCard(){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return '';
  if (!SYSREP.v && !SYSREP.err) sysReportFetch();
  var v = SYSREP.v || {};
  var one = function(k, title){
    var x = v[k]; if (!x || !x.text) return '<p class="hint" style="margin:0">' + esc(t(title)) + ': ' + esc(t('لم يصل بعد')) + '</p>';
    return '<details><summary><b>' + esc(t(title)) + '</b> \u00b7 <span class="num">' + esc(fmtDT(x.at)) + '</span></summary>'
      + '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.7;margin:8px 0 0">' + esc(String(x.text).slice(0, 12000)) + '</pre></details>';
  };
  return card('ملخّصُ الصباح وتقريرُ النظام', one('pulse', 'ملخّصُ الصباح') + one('report', 'تقريرُ النظام')
    + (SYSREP.err ? '<p class="hint" style="margin:6px 0 0">' + esc(SYSREP.err) + '</p>' : ''));
}

var USAGE = { at:0, v:null };
function usageFetch(force){
  if (!(may('users') || may('exportAll'))) return Promise.resolve(null);
  if (!force && Date.now() - USAGE.at < 600000) return Promise.resolve(USAGE.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  USAGE.at = Date.now();
  return DB.col('settings').doc('usage').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    USAGE.v = (doc && doc.exists) ? doc.data() : {}; if (CUR === 'sys') render(1); return USAGE.v;
  }).catch(function(){ return null; });
}
function readsToday(){
  var day = dayKey(), sum = 0, n = 0;
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.day === day){ sum += (+p.rd || 0); n++; } });
  return { reads:sum, devices:n };
}
function usageCard(){
  if (!(may('users') || may('exportAll'))) return '';
  if (!USAGE.v) usageFetch();
  var rt = readsToday(), QUOTA = 50000, pct = Math.round(rt.reads / QUOTA * 100);
  var days = (USAGE.v && USAGE.v.days) || {}, since = dayKey(Date.now() - 30 * 864e5);
  var keys = Object.keys(days).filter(function(k){ return k >= since; }).sort();
  var tot = {}; keys.forEach(function(d){ var m = days[d] || {}; Object.keys(m).forEach(function(p){ tot[p] = (tot[p] || 0) + (+m[p] || 0); }); });
  var top = Object.keys(tot).sort(function(a, b){ return tot[b] - tot[a]; }).slice(0, 12);

  var unused = '';
  if (keys.length >= 7){
    var vis = []; NAV.forEach(function(sct){ (sct.solo ? [[sct.id, sct.label]] : sct.items).forEach(function(i){ if (seesPage(i[0]) && vis.every(function(v){ return v[0] !== i[0]; })) vis.push(i); }); });
    var zero = vis.filter(function(i){ return !tot[i[0]]; });
    unused = '<p class="hint" style="margin:8px 0 0">' + esc(t('صفحاتٌ لم تُفتَح في ثلاثين يومًا')) + ' (' + nm(zero.length) + '): ' + (zero.length ? zero.slice(0, 20).map(function(i){ return esc(t(i[1])); }).join(' \u00b7 ') : '\u2014') + '</p>';
  }
  return card('استعمالُ الصفحات وقراءاتُ اليوم',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap;align-items:center"><span>' + esc(t('قراءاتُ اليوم تقريبًا')) + ': <b class="num">' + nm(rt.reads) + '</b> / ' + nm(QUOTA)
    + ' ' + pill(nm(pct) + '٪', pct >= 100 ? 'bad' : pct >= 70 ? 'wrn' : 'ok') + ' <span class="hint" style="margin:0">' + nm(rt.devices) + ' ' + esc(t('جهازًا أرسل بياناته اليوم')) + '</span></span></div>'
    + (top.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('الصفحة')) + '</th><th>' + esc(t('فتحاتٌ في ٣٠ يومًا')) + '</th></tr></thead><tbody>'
        + top.map(function(p){ return '<tr><td>' + esc(PAGE[p] ? t(PAGE[p].t) : p) + '</td><td class="num">' + nm(tot[p]) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="hint" style="margin:8px 0 0">' + esc(t('لا تجميعَ بعد — يكتبه ملخّصُ الصباح مرةً في اليوم.')) + '</p>') + unused);
}

function uaModel(ua){
  ua = String(ua || '');
  var m = /\(([^)]*)\)/.exec(ua), inner = m ? m[1] : '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  var a = /Android[^;]*;\s*([^;)]+)/.exec(inner); if (a) return a[1].replace(/\s*Build.*$/, '').trim().slice(0, 24);
  if (/Windows/.test(ua)) return 'Windows'; if (/Macintosh/.test(ua)) return 'Mac';
  return 'جهاز';
}
function perfRows(){
  var out = [];
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.pf && typeof p.pf === 'object') out.push({ uid:u, model:uaModel(p.ua), ver:p.ver, pf:p.pf }); });
  return out;
}

function devActRows(){
  var P = STATE.presence || {}, now = Date.now(), mine = verNum(appVer()), cloud = Math.max(mine, verNum(STATE.appVerCloud || ''));
  return Object.keys(P).map(function(k){ var x = P[k] || {}; return x; }).filter(function(x){ return x && x.name && now - (+x.at || 0) < 7 * 864e5; }).map(function(x){
    var iss = [], act = [], sev = 0, v = verNum(x.ver), mfu = x.pf && x.pf.pages && x.pf.pages.mfu && x.pf.pages.mfu.p75;
    if (v && cloud && v < cloud){ iss.push(t('نسخة قديمة') + ' ' + x.ver); act.push(t('يقفل التطبيق ويفتحه على نت')); sev += cloud - v > 5 ? 2 : 1; }
    if (+x.ib){ iss.push(t('مخزن الجهاز فيه مشكلة')); act.push(t('يفضّي الطابور ثم «إعادة ضبط التطبيق»')); sev += 3; }
    if (+x.q > 0){ iss.push(nm(+x.q) + ' ' + t('كتابة واقفة')); if (!+x.ib) act.push(t('يفتح على نت ويضغط «زامِن الآن»')); sev += +x.q > 5 ? 2 : 1; }
    if (+x.pq > 0 || +x.pfl > 0){ iss.push(nm((+x.pq || 0) + (+x.pfl || 0)) + ' ' + t('صورة لم تُرفع')); act.push(t('يفتح على نت ويضغط «ارفع الآن»')); sev += 2; }
    if (+x.pz > 0){ iss.push(nm(+x.pz) + ' ' + t('كتابة مرفوضة')); act.push(t('يراجعها المهندس من «ما ينتظر الرفع»')); sev += 2; }
    if (+x.err > 0){ iss.push(nm(+x.err) + ' ' + t('خطأ اليوم')); sev += 1; }
    var slowPg = Object.keys((x.pf && x.pf.pages) || {}).map(function(k){ return [k, x.pf.pages[k] && x.pf.pages[k].p75]; }).filter(function(e){ return e[1] > 1500; }).sort(function(a, b){ return b[1] - a[1]; })[0];
    if (slowPg){ var pgName = (SPEED_PAGES.filter(function(p){ return p[0] === slowPg[0]; })[0] || [0, (PAGE[slowPg[0]] && PAGE[slowPg[0]].t) || slowPg[0]])[1]; iss.push(t(pgName) + ' ' + t('بطيئة') + ' ' + nm(Math.round(slowPg[1] / 100) / 10) + t('ث')); if (!(v && v < cloud)) act.push(t('«الوضع الخفيف» من المساعد')); sev += 1; }
    return { name:x.name, role:x.role || '', ver:x.ver || '', at:+x.at || 0, iss:iss, act:act.filter(function(a, i, A){ return A.indexOf(a) === i; }), sev:sev };
  }).filter(function(r){ return r.iss.length; }).sort(function(a, b){ return b.sev - a.sev || b.at - a.at; });
}

var SPEED_PAGES = [['map', 'الخريطة'], ['mfu', 'المتابعة'], ['forms', 'النموذج'], ['survey', 'المسح'], ['mywork', 'شغلي'], ['sites', 'المواقع']];
function speedCell(v){ if (v == null) return '<span class="hint" style="margin:0">\u2014</span>'; var c = v < 300 ? 'ok' : v < 1000 ? 'wrn' : 'bad'; return pill(nm(Math.round(v / 10) / 100) + t('ث'), c); }
function speedRows(){
  var P = STATE.presence || {}, now = Date.now();
  return Object.keys(P).map(function(k){ return P[k] || {}; }).filter(function(x){ return x && x.name && x.pf && x.pf.pages && now - (+x.at || 0) < 7 * 864e5; }).map(function(x){
    var pg = x.pf.pages || {}, worst = 0;
    var cells = SPEED_PAGES.map(function(p){ var v = pg[p[0]] && pg[p[0]].p75; if (v != null && v > worst) worst = v; return v == null ? null : +v; });
    return { name:x.name, model:(typeof uaModel === 'function' ? uaModel(x.ua) : ''), ver:x.ver || '', cells:cells, inp:x.pf.inp && x.pf.inp.p75, open:x.pf.open, worst:worst };
  }).sort(function(a, b){ return b.worst - a.worst; });
}
function speedCard(){
  if (!(may('users') || may('exportAll'))) return '';
  var R = speedRows(); if (!R.length) return '';
  var slow = R.filter(function(r){ return r.worst >= 1000; }).length, ok = R.filter(function(r){ return r.worst < 300; }).length;
  return card('سرعة الصفحات لكل جهاز',
    '<p class="hint" style="margin-top:0">' + esc(t('زمن رسم كل صفحة على كل جهاز (من قياس الجهاز نفسه، آخر ٧ أيام). الهدف أقل من ٠٫٣ ثانية.')) + ' '
    + '<b>' + nm(ok) + '</b> ' + esc(t('جهاز داخل الهدف')) + ' \u00b7 <b>' + nm(slow) + '</b> ' + esc(t('جهاز فيه صفحة أبطأ من ثانية')) + '</p>'
    + '<div style="overflow-x:auto">' + table(['الجهاز'].concat(SPEED_PAGES.map(function(p){ return p[1]; })).concat(['اللمس', 'الفتح']),
      R.map(function(r){ return [esc(r.name) + '<div class="hint" style="margin:0">' + esc(r.model) + ' \u00b7 ' + esc(r.ver) + '</div>'].concat(r.cells.map(speedCell)).concat([speedCell(r.inp), speedCell(r.open)]); })) + '</div>');
}
function devActCard(){
  if (!(may('users') || may('exportAll'))) return '';
  try { presenceFetch(false); } catch (e){ LS_ERR = e; }
  var R = devActRows();
  return card('أجهزة تحتاج إجراء', R.length
    ? '<p class="hint" style="margin-top:0">' + esc(t('من نبضات الأجهزة في آخر ٧ أيام — اطلب من صاحب كل جهاز الإجراء المكتوب أمامه.')) + '</p>'
      + table(['الجهاز', 'المشكلة', 'المطلوب منه', 'آخر ظهور'], R.map(function(r){ return [esc(r.name) + ' <span class="hint" style="margin:0">' + esc(t(r.role)) + '</span>', esc(r.iss.join(' · ')), '<b>' + esc(r.act.join('، ') || t('متابعة')) + '</b>', '<span class="num">' + esc(r.at ? fmtTime(r.at) : '') + '</span>']; }))
    : alertBox('ok', 'كلُّ الأجهزة النشطة سليمة: على آخر نسخة، ولا شيءَ واقف.'));
}
function perfCard(){
  if (!(may('users') || may('exportAll'))) return '';
  var R = perfRows(); if (!R.length) return '';
  var band = function(v, good, poor){ return v == null ? pill('\u2014', '') : pill(String(v), v <= good ? 'ok' : v <= poor ? 'wrn' : 'bad'); };
  var lcp = p75(R.map(function(r){ return r.pf.lcp && r.pf.lcp.p75; }).filter(function(x){ return x != null; }));
  var inp = p75(R.map(function(r){ return r.pf.inp && r.pf.inp.p75; }).filter(function(x){ return x != null; }));
  var cls = p75(R.map(function(r){ return r.pf.cls; }).filter(function(x){ return x != null; }));
  var devs = R.filter(function(r){ return r.pf.inp && r.pf.inp.p75 != null; }).sort(function(a, b){ return b.pf.inp.p75 - a.pf.inp.p75; }).slice(0, 5);
  var pages = {}; R.forEach(function(r){ Object.keys(r.pf.pages || {}).forEach(function(k){ var v = r.pf.pages[k]; if (v && v.p75 != null){ pages[k] = pages[k] || []; pages[k].push(v.p75); } }); });
  var pg = Object.keys(pages).map(function(k){ return [k, p75(pages[k])]; }).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  return card('أداءُ الميدان — ما يشعر به الفني',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap"><span>LCP p75: ' + band(lcp == null ? null : Math.round(lcp / 100) / 10, 2.5, 4) + ' ' + esc(t('ث')) + '</span>'
    + '<span>INP p75: ' + band(inp, 200, 500) + ' ' + esc(t('م.ث')) + '</span><span>CLS p75: ' + band(cls, 0.1, 0.25) + '</span>'
    + '<span class="hint" style="margin:0">' + nm(R.length) + ' ' + esc(t('جهازًا أرسل قياسًا اليوم')) + '</span></div>'
    + (devs.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الأجهزة')) + '</th><th>INP p75</th><th>' + esc(t('فتح←خريطة')) + '</th><th>' + esc(t('مهامّ طويلة')) + '</th></tr></thead><tbody>'
        + devs.map(function(r){ return '<tr><td>' + esc(r.model) + ' <span class="hint" style="margin:0">' + esc(r.ver || '') + '</span></td><td class="num">' + nm(r.pf.inp.p75) + '</td><td class="num">' + (r.pf.open != null ? nm(r.pf.open) : '\u2014') + '</td><td class="num">' + (r.pf.lt != null ? nm(r.pf.lt) : '\u2014') + '</td></tr>'; }).join('') + '</tbody></table>' : '')
    + (pg.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الصفحات')) + '</th><th>' + esc(t('رسمٌ p75 (م.ث)')) + '</th></tr></thead><tbody>'
        + pg.map(function(x){ return '<tr><td>' + esc(PAGE[x[0]] ? t(PAGE[x[0]].t) : x[0]) + '</td><td class="num">' + nm(x[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : ''));
}
PAGE.sys = { m:'النظام', t:'صحة النظام',
  l:'سلامةُ البيانات ومزامنتُها ونسخُ الأجهزة وعمرُها وتصفيرُها — صيانةُ النظام كلُّها.',
  body:function(){
    var head = tabHead('sys'), cur = tabCur('sys');
    if (cur === 'hb') return head + (function(){

    var HB = STATE.hb || {}, hbk = Object.keys(HB);
    var beats = hbk.filter(function(k){ return HB[k] && HB[k].st; });
    var up = beats.filter(function(k){ return HB[k].st === 'up'; }).length, down = beats.length - up;
    var gap = beats.filter(function(k){
      var h = HB[k]; return h.st === 'down' && h.since && Date.now() - Date.parse(h.since) >= 10 * 60000;
    }).length;
    var day0 = dayKey();
    var flap = hbk.filter(function(k){
      var h = HB[k]; return h && h.from && h.to && dayKey(Date.parse(h.ts) || 0) === day0;
    }).length;
    return (may('settings') ? readyCard() : '')
      + contCard()
      + bkCard()
      + (beats.length ? '' : alertBox('error','لم تصل أي إشارة بعد — شغّل أداة الفحص على جهاز المكتب المتصل بشبكة الميدان.'))
      + stats([['متصل', N(up), 'ok'], ['غير متصل', N(down), down ? 'bad' : ''],
               ['فاصل ≥١٠ دقائق', N(gap), gap ? 'wrn' : ''], ['متذبذب اليوم', N(flap)]])
      + card('اصطلاح العناوين', table(['الجهاز','آخر خانة','مثال'], [
          ['راوتر','<span class="num">.1</span>','<span class="num">10.20.30.1</span>'],
          ['قارئ','<span class="num">.2</span>','<span class="num">10.20.30.2</span>'],
          ['كاميرا','<span class="num">.3</span>','<span class="num">10.20.30.3</span>']
        ]));
  })();
    if (cur === 'probe') return head + (function(){
    var withIp = STATE.sites.filter(function(s){ return probeIp(s); }).length;
    var el = PROBE.t ? Math.round((Date.now() - PROBE.t) / 1000) : 0;
    return alertBox('info','المتصفّح لا يملك ping — تُطلَب صفحةُ الجهاز ويُقاس ردُّه. والردُّ بخطأٍ دليلُ حياةٍ أيضًا: المنفذُ موجود. الصمتُ وحده موت.')
      + stats([['عناوين مسجّلة', N(withIp), withIp?'':'wrn'],
               ['فُحص', N(PROBE.done)],
               ['حيّ', N(PROBE.up), 'ok'],
               ['صامت', N(PROBE.down), PROBE.down?'bad':'']])
      + card('التشغيل',
          (withIp
            ? '<div class="actions">'
              + btn(PROBE.on ? '⏸ ' + t('أوقف') : '▶ ' + t('ابدأ الفحص'),
                    PROBE.on ? 'btn-danger' : 'btn-primary', ' data-probe="1"')
              + (PROBE.on ? '<span class="hint" style="margin:0">'
                  + nm(PROBE.done) + ' / ' + nm(withIp) + ' · ' + nm(el) + ' ث</span>' : '')
              + '</div>'
              + (PROBE.on ? meter('التقدم', PROBE.done, withIp) : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا عناوين بعد — تُشتقّ من بادئة الشبكة التي تُدخَل عند التركيب.')) + '</p>'))
      + (PROBE.log.length
        ? cardFlush('آخر ما فُحص',
            table(['النقطة','العنوان','الحالة'],
              PROBE.log.slice(0, 24).map(function(r){
                return ['<span class="num">' + esc(r.id) + '</span>',
                        '<span class="num" dir="ltr">' + esc(r.ip) + '</span>',
                        pill(r.alive ? 'حيّ' : 'صامت', r.alive ? 'ok' : 'off')];
              })))
        : '')
      + card('اصطلاح العناوين',
          table(['الجهاز','آخر خانة','مثال'], [
            ['راوتر','<span class="num">.1</span>','<span class="num" dir="ltr">10.20.30.1</span>'],
            ['قارئ','<span class="num">.2</span>','<span class="num" dir="ltr">10.20.30.2</span>'],
            ['كاميرا','<span class="num">.3</span>','<span class="num" dir="ltr">10.20.30.3</span>']
          ])
          + '<p class="hint">' + esc(t('تُشتقّ كلها من بادئةٍ واحدةٍ تُكتب مرةً عند التركيب.')) + '</p>');
  })();
    if (cur === 'drive') return head + (function(){
    drvCfg();
    var n = STATE.sites.length;
    var est = Math.round(n * 4 * 180 / 1024);
    return (PHOTO_FAIL.length
        ? alertBox('warn','صورٌ تعذّر رفعُها بعد خمس محاولات — لم تُفقَد، وهي على هذا الجهاز.')
          + card('بانتظار إعادة المحاولة',
              '<div class="pop-rows" style="margin:0">'
              + PHOTO_FAIL.slice(0, 12).map(function(x){
                  return '<div><span class="k">' + esc(x.site) + ' · ' + esc(t(x.kind)) + '</span>'
                    + '<span>' + esc(x.why || t('سببٌ غير معروف')) + '</span></div>';
                }).join('') + '</div>',
              btn('أعد المحاولة','btn-primary btn-sm',' data-pretry="1"'))
        : '')
      + stats([['في الطابور', N(PHOTO_Q.length), PHOTO_Q.length?'wrn':'ok'],
                  ['تعذّر رفعُها', N(PHOTO_FAIL.length), PHOTO_FAIL.length?'wrn':'ok'],
                  ['رُفعت', N(Object.keys(STATE.photos || {}).length), 'ok'],
                  ['المتوقَّع للمشروع', N(est) + ' ' + t('ميجا')],
                  ['الإذن', DRV.ready ? t('ممنوح') : t('لم يُطلَب'), DRV.ready?'ok':'wrn']])

      + (drvCfg()
        ? alertBox('success','درايفك موصولٌ — الصورُ تُرفَع إليه ويُحفَظ رابطُها في السجل.')
        : alertBox('warn','لم يُوصَل درايفك بعد — الصورُ تُحفَظ على الجهاز وتنتظر.'))

      + card('الوصل',
          '<div class="field"><label>Client ID</label>'
          + '<input id="drvClient" dir="ltr" placeholder="xxxxx.apps.googleusercontent.com" value="'
          +   esc(DRV.clientId) + '"></div>'
          + '<div class="field"><label>' + esc(t('معرّف مجلّد المشروع')) + ' — ' + esc(t('اختياري')) + '</label>'
          + '<input id="drvFolder" dir="ltr" placeholder="1AbC…" value="' + esc(DRV.folderId) + '"></div>'
          + '<p class="hint">' + esc(t('المعرّفُ من رابط المجلّد في درايفك — ما بعد ‎/folders/‎. وإن تُرك فارغًا رُفعت في الجذر.')) + '</p>',
          '<div class="actions">'
          + btn('احفظ','btn-primary btn-sm',' data-drvsave="1"')
          + btn('اختبر الإذن','btn-secondary btn-sm',' data-drvtest="1"')
          + '</div>')

      + card('كيف يُنشَأ Client ID',
          table(['#','الخطوة'], [
            ['١','افتح console.cloud.google.com وأنشئ مشروعًا أو اختر قائمًا'],
            ['٢','فعّل Google Drive API من مكتبة الواجهات'],
            ['٣','في «بيانات الاعتماد» أنشئ OAuth client ID من نوع تطبيق ويب'],
            ['٤','أضف ' + location.host + ' إلى Authorized JavaScript origins'],
            ['٥','انسخ المعرّفَ والصقه أعلاه'],
            ['٦','أنشئ مجلّدًا في درايفك للمشروع وانسخ معرّفه من رابطه']
          ])
          + '<p class="hint">' + esc(t('النطاقُ المطلوبُ drive.file — لا يرى إلا ما يرفعه التطبيق، لا بقيةَ درايفك.')) + '</p>')

      + card('لماذا لا تُحفَظ في قاعدة البيانات',
          '<p class="hint" style="margin:0">'
          + esc(t('وثيقةُ Firestore لا تتجاوز ميغابايتًا، وصورةٌ واحدةٌ تقاربه. ولو حُفظت هناك لامتلأت الحصّةُ في أيام. أما درايفك فخمسةُ تيرا — تكفي المشروعَ مرارًا. ويبقى في السجل معرّفُ الملف ورابطُه فيُفتَح بضغطة.'))
          + '</p>');
  })();
    if (cur === 'bugs') return head + bugsPageHtml();
    if (cur === 'sys') return head + localStoreCard() + sysReportCard() + (function(){

    var R = STATE.recs || {}, I = STATE.inss || {}, T = STATE.tasks || {}, U = STATE.users || {};
    var names = {}; Object.keys(U).forEach(function(k){ if (U[k] && U[k].name) names[U[k].name] = 1; });
    techsList(true).forEach(function(x){ names[x.n] = 1; });
    var q = {};
    q.insNoSol = Object.keys(I).filter(function(id){ var r = I[id]; var so = solutionOf(id); return r && r.status === 'مُركّب' && !(so && so.status === 'معتمد'); });
    q.schedNoSv = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.kind === 'install' && x.status !== 'مُنجز' && x.status !== 'معتمد' && !svDone(R[x.site]); });
    q.negStock = stockBalance().filter(function(b){ return b.store < 0 || b.custody < 0; });
    q.buyNoSup = buysList().filter(function(b){ return !b.sup && !b.vendor; });
    q.noCoord = (STATE.sites || []).filter(function(x){ return !(+x.lat) || !(+x.lng); });
    var comp = coCompounds(); q.compound = Object.keys(comp);
    q.svNoPhoto = Object.keys(R).filter(function(id){ return svDone(R[id]) && !photoCount(id); });
    q.taskGhost = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.to && x.status !== 'مُنجز' && x.status !== 'معتمد' && !names[x.to]; });
    q.dupUsers = usrDupes();
    q.poison = STATE.poison || [];
    q.oldRevisit = Object.keys(R).filter(function(id){ var r = R[id]; return r && r.review === 'revisit' && (Date.now() - (r.revisitAt || r.at || 0)) > 3 * 86400000; });
    var rowOf = function(lab, arr, sev, go, hint){
      var n = arr.length;
      return [esc(t(lab)) + (hint ? '<br><span class="hint" style="margin:0">' + esc(t(hint)) + '</span>' : ''),
              n ? pill(nm(n), sev || 'bad') : pill(nm(0), 'ok'),
              n && go ? btn(t('افتح'),'btn-quiet btn-sm',' data-p="' + esc(go) + '"') : ''];
    };
    var bad = q.insNoSol.length + q.schedNoSv.length + q.negStock.length + q.noCoord.length + q.taskGhost.length + q.dupUsers.length + q.poison.length;
    return (bad ? alertBox('warn', nm(bad) + ' ' + t('ملاحظةً تحتاج نظرًا — الأرقامُ أدناه حيّةٌ لحظةَ الفتح'))
                : alertBox('ok', t('لا تناقضَ في البيانات — كلُّ الفحوص صفر')))
      + cardFlush('فحوص التناقض', table(['الفحص','النتيجة',''], [
          rowOf('نقاط مُركّبة بلا حلٍّ معتمد', q.insNoSol, 'bad', 'qa', 'رُكّبت والحلُّ لم يُعتمَد — لا يُقفَل إقفالٌ ولا يُحسَب استلامٌ'),
          rowOf('تركيبات مُسندة لنقاطٍ لم يتم الوصول إليها', q.schedNoSv, 'bad', 'req', 'إسنادُ تركيبٍ قبل المسح — الفنيُّ سيصل بلا حلّ'),
          rowOf('أصناف برصيد سالب', q.negStock, 'bad', 'inv', 'صرفٌ أكثرُ من التوريد — سجلٌّ ناقص'),
          rowOf('مشتريات بلا مورّد', q.buyNoSup, 'wrn', 'inv'),
          rowOf('مهام مُسندة لاسمٍ لا حسابَ له', q.taskGhost, 'bad', 'req', 'كُتب الاسمُ ولم يُطابق حسابًا — لا يصله شيء'),
          rowOf('حسابات مكرَّرة', q.dupUsers, 'bad', 'users'),
          rowOf('وثائق معزولة عن الرفع على هذا الجهاز', q.poison, 'bad', 'sync')
        ]))
      + cardFlush('جودة البيانات', table(['الفحص','النتيجة',''], [
          rowOf('مواقع بلا إحداثيات', q.noCoord, 'wrn', 'sites', 'لا تظهر على الخريطة ولا تُسنَد'),
          rowOf('أسماء شركات مركَّبة (تحمل أكثر من شركة)', q.compound, 'wrn', 'co', 'لا تُحسَب نقاطُها لشركةٍ — توحَّد من شاشة الشركات'),
          rowOf('زيارات تمّت بلا صورة', q.svNoPhoto, 'wrn', 'survey', 'المعتمِدُ لا يرى ما رآه المشرف'),
          rowOf('مردودة لزيارةٍ أخرى منذ أكثر من ٣ أيام', q.oldRevisit, 'wrn', 'svappr', 'رُدّت ولم تُزَر ثانيةً')
        ]));
  })();
    if (cur === 'sync') return head + (function(){

    var Q = STATE.queue || [], PZ = STATE.poison || [];

    var rdN = (typeof FB === 'object' && FB.readCount) || 0;
    var upMin = Math.max(1, Math.round((Date.now() - (BOOT_AT || Date.now())) / 60000));
    var perDay = Math.round(rdN / upMin * 60 * 8);
    var FREE = 50000;

    var me = STATE.meta || {}, uid0 = myUid();
    var myDoc = (STATE.users || {})[uid0] || null;
    if (uid0 && MYDOC.has === null) myDocFetch(false);
    var rdCard = card(t('قراءاتُ هذه الجلسة'),
      stats([['قُرئت الآن', N(rdN), rdN > 5000 ? 'wrn' : 'ok'],
             ['منذ الفتح', esc(nm(upMin) + ' ' + t('دقيقة'))],
             ['تقديرٌ ليومِ عملٍ كامل', N(perDay), perDay > FREE / 3 ? 'wrn' : 'ok'],
             ['الحصةُ المجانية', esc(nm(FREE) + ' / ' + t('يوم'))]])
      + '<p class="hint" style="margin:6px 0 0">'
      + esc(t('التقديرُ لهذا الجهاز وحدَه في ثماني ساعات. اضربه في عدد الأجهزة لتقدّر يومَ المشروع — والحصةُ المجانية خمسون ألفًا لكلِّ المشروع في اليوم.')) + '</p>');
    var idRows = [
      ['uid', uid0 ? '<span class="num" dir="ltr">' + esc(uid0) + '</span>' : pill('غير مسجَّل الدخول','off')],
      ['الاسم', esc(me.name || '—')],
      ['الدورُ في التطبيق', esc(t((ROLES[ROLE] || {}).n || ROLE))],
      ['وثيقةُ الحساب users/{uid}',
        myDoc ? pill('موجودة','ok')
              : (MYDOC.has === false ? pill('غيرُ موجودة — هذا سببُ الرفض','off')
                 : (MYDOC.err === 'offline' ? pill('بلا شبكة — تُقرأ عند الاتصال','warn')
                                            : pill('تُقرأ…','warn')))],
      ['دورُها', myDoc ? esc(t((ROLES[myDoc.role] || {}).n || myDoc.role || '—')) : '—'],
      ['active', myDoc ? (myDoc.active === false ? pill('false — معطَّل','off') : pill(myDoc.active === true ? 'true' : 'غير مكتوب (يُعدُّ فعّالًا)', myDoc.active === true ? 'ok' : 'warn')) : '—']
    ];
    var errs = SOFT_ERRS.filter(function(e){ return /رفع|sync|push/i.test(e.where || '') || /رفع/.test(e.msg || ''); });
    var day = dayKey();
    var today = SOFT_ERRS.filter(function(e){ return dayKey(e.at) === day; }).length;
    return rdCard + card('\u{1FAAA} ' + t('بأيِّ هويةٍ يكتب هذا الجهاز'),
        table(['','' ], idRows.map(function(r){ return [esc(t(r[0])), r[1]]; }))
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('«Missing or insufficient permissions» معناه أن القاعدةَ لا تعرف هذا الحساب: وثيقتُه ليست باسم uid، أو دورُها ليس من الأدوار، أو active مكتوبةٌ false.')) + '</p>'
        + (uid0 && MYDOC.has === false
          ? alertBox('error', 'لا وثيقةَ لحسابك باسم معرِّفه — فكلُّ ما تكتبه يُرفَض. أنشئها الآن (فنيًّا) ليُرفَع عملُك، ثم اطلب من المكتب ترقيةَ دورك.')
            + '<div class="actions">' + btn('\u{1F527} ' + t('أنشئ وثيقة حسابي'),'btn-primary btn-sm',' data-mydocfix="1"') + '</div>'
          : '<div class="actions" style="margin-top:8px">'
            + btn('\u21BB ' + t('أعد قراءة وثيقتي'),'btn-quiet btn-sm',' data-mydocfix="1"') + '</div>'))
      + softErrCard()
      + (PZ.length
        ? cardFlush('\u26A0 ' + t('وثائقُ عُزلت عن الرفع') + ' — ' + nm(PZ.length),

            table(['الأمر','النوع','المعرّف','السبب',''],
              PZ.map(function(x, i){
                return [x.v === null ? pill('حذف','off') : pill('كتابة','acc'),
                        esc(x.kind), '<span class="num">' + esc(String(x.id)) + '</span>',
                        '<span class="hint" style="margin:0">' + esc(x.err) + '</span>',
                        '<div class="actions" style="margin:0">'
                        + btn('\u21BB','btn-quiet btn-sm',' data-pzretry="' + i + '" aria-label="' + esc(t('أعد الرفع')) + '"')
                        + btn('\u{1F5D1}','btn-danger btn-sm',' data-pzdrop="' + i + '" aria-label="' + esc(t('أسقط')) + '"')
                        + '</div>'];
              }))
            + (PZ.length > 1
              ? '<div class="actions" style="margin:8px 0 0">'
                + btn('\u21BB ' + t('أعد رفع الكل'),'btn-secondary btn-sm',' data-pzall="retry"')
                + btn('\u{1F5D1} ' + t('أسقط الكل'),'btn-danger btn-sm',' data-pzall="drop"')
                + '</div>'
              : '')
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('رُفضت ثلاثَ مرات فعُزلت كي لا تعيق ما بعدها — السببُ مكتوب: قيمةٌ غيرُ مقبولة أو قاعدةٌ تمنع. أعد رفعَها بعد الإصلاح، أو أسقطها إن كانت خطأً.')) + '</p>'
            + (PZ.some(function(x){ return x.v === null && /permission|insufficient/i.test(String(x.err || '')); })
              ? '<p class="hint" style="margin:6px 0 0">' + esc(t('أمرُ حذفٍ ردّته القاعدة ليس رفضًا للحساب: الحذفُ في تلك المجموعة للإدارة وحدَها — وسجلُّ الأحداث لا يُحذَف أبدًا.')) + '</p>'
              : ''))
        : '')

      + (Q.length
        ? card('', '<div class="actions" style="margin:0">'
            + btn('\u2191 ' + t('ادفع الطابور الآن'),'btn-primary btn-sm',' data-pushnow="1"')
            + '<span class="hint" style="margin:0 10px">'
            + esc(t('الدورةُ تدفع تلقائيًّا كلَّ دقيقة — وهذا يدفع فورًا.')) + '</span></div>')
        : '')
      + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok'],
               ['أخطاءُ رفع', N(errs.length), errs.length ? 'bad' : 'ok'],
               ['أخطاءُ اليوم', N(today), today ? 'wrn' : 'ok'],
               ['الشبكة', pill(STATE.meta.online ? 'متصلة' : 'مقطوعة', STATE.meta.online ? 'ok' : 'off')]])
      + (Q.length
        ? cardFlush('الطابور — ' + nm(Q.length),
            table(['النوع','السجل','سُجّل'],
              Q.slice(0, 50).map(function(x){
                return [pill(t(Q_LBL[x.kind] || x.kind), 'acc'), '<strong>' + esc(String(x.id || '—')) + '</strong>',
                        '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا شيءَ بانتظار الرفع — كلُّ ما سُجّل وصل.')) + '</p>'));
  })();
    if (cur === 'dq') return head + (function(){
    var dup = dqDupPos(), noco = dqNoCo(), comp = dqCompound(), nosign = dqNoSign(), far = dqFar();
    var compN = Object.keys(comp).length, compPts = Object.keys(comp).reduce(function(a, k){ return a + comp[k].length; }, 0);
    var may2 = maySiteEdit();
    var row = function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px">'
      + '<span>' + esc(x.id) + '</span><span class="hint" style="margin:0">' + esc((x.name || '').slice(0, 30)) + '</span></button>'; };
    return '<p class="lede" style="margin:0 0 12px">' + esc(t('عيوبٌ في البيانات لا في الشيفرة — كلُّ عيبٍ بعدده، وما يُصلَح دفعةً يُسجَّل باسمك ويُزامَن كأيِّ تعديل.')) + '</p>'
      + stats([['على إحداثيةٍ واحدة', N(dup.length), dup.length ? 'wrn' : 'ok'],
               ['مخيمٌ بلا شركة', N(noco.length), noco.length ? 'wrn' : 'ok'],
               ['اسمٌ مركَّب', N(compN), compN ? 'wrn' : 'ok'],
               ['بلا مربعٍ أو شاخص', N(nosign.length), nosign.length ? 'wrn' : 'ok'],
               ['بعيدةٌ عن مشعرها', N(far.length), far.length ? 'wrn' : 'ok']])
      + (far.length
          ? card('\u{1F9ED} ' + t('نقاطٌ بعيدةٌ عن مشعرها') + ' \u2014 ' + nm(far.length),
              '<p class="hint" style="margin:0 0 8px">' + esc(t('إحداثياتُها على بُعد كيلومتراتٍ من جسم المشعر — غالبًا نقطةٌ أُضيفت من الميدان والجهازُ في مكانٍ آخر. افتح النقطةَ وصحّح موضعَها من نافذتها (أو اعتمد إحداثيات الزيارة)، أو أخفِها إن كانت خطأً.')) + '</p>'
              + far.slice(0, 30).map(function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + bdi(x.id) + ' <span class="hint" style="margin:0">' + esc(t(x.zone)) + '</span></span><span class="hint num" style="margin:0">' + esc((+x.lat).toFixed(5) + ', ' + (+x.lng).toFixed(5)) + '</span></button>'; }).join(''))
          : '')

      + card('\u{1F4CD} ' + t('نقطتان على إحداثيةٍ واحدة') + ' — ' + nm(dup.length),
          dup.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('أكثرُها المخيمُ الواحدُ مسجَّلًا مرتين بشاخصٍ مكتوبٍ بصفتين — فيُزار أحدُهما ويبقى توأمُه «لم يُزر» ويُعَدُّ في الإجمالي. اختر الأصلَ (ما مُسح إن مُسح أحدُهما) فيُدمَج التوأمُ فيه ويخرج من العدّ — ويُفَكُّ الدمجُ متى شئت. وإن كانا مخيمين حقًّا فافصل إحداثياتِهما من «تحريك».')) + '</p>'
              + dup.slice(0, 40).map(function(p){
                  var st = function(x){ var r = STATE.recs[x.id]; return svVisited(r) ? '<span class="pill ok">' + esc(t('تمت الزيارة')) + '</span>' : '<span class="pill">' + esc(t('لم يُزر')) + '</span>'; };
                  var lab = function(x){ return '<b>' + esc(x.id) + '</b> <span class="hint" style="margin:0">' + esc((x.sq || '') + ' / ' + (x.sign || '')) + '</span> ' + st(x); };
                  var a = p[0], b = p[1], aS = svVisited(STATE.recs[a.id]), bS = svVisited(STATE.recs[b.id]);
                  var btnA = may2 && !(bS && !aS) ? btn(t('الأصلُ الأولى — ادمج الثانية'),'btn-quiet btn-sm',' data-dupkeep="' + esc(a.id) + '|' + esc(b.id) + '"') : '';
                  var btnB = may2 && !(aS && !bS) ? btn(t('الأصلُ الثانية — ادمج الأولى'),'btn-quiet btn-sm',' data-dupkeep="' + esc(b.id) + '|' + esc(a.id) + '"') : '';
                  return '<div class="card" style="margin:0 0 8px;padding:8px 10px"><div class="wt-row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'
                    + '<span>' + lab(a) + '</span><span>\u2194</span><span>' + lab(b) + '</span>'
                    + '<span class="hint num" style="margin:0">' + esc((+a.lat).toFixed(5)) + ', ' + esc((+a.lng).toFixed(5)) + '</span></div>'
                    + (btnA || btnB ? '<div class="actions" style="margin:6px 0 0">' + btnA + btnB + '</div>' : '') + '</div>';
                }).join('')
              + (dupMerged().length
                  ? '<p class="hint" style="margin:10px 0 4px">' + esc(t('مدمَجةٌ من قبل')) + ' <b class="num">' + nm(dupMerged().length) + '</b></p>'
                    + dupMerged().slice(0, 40).map(function(x){
                        return '<div class="wt-row" style="justify-content:space-between;margin:0 0 4px"><span>' + esc(x.id) + ' \u2192 ' + esc(x.dupOf) + '</span>'
                          + (may2 ? btn(t('فكّ الدمج'),'btn-quiet btn-sm',' data-dupundo="' + esc(x.id) + '"') : '') + '</div>'; }).join('')
                  : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا تكرارَ في الإحداثيات.')) + '</p>')

      + card('\u{1F3E2} ' + t('مخيماتٌ بلا شركة') + ' — ' + nm(noco.length),
          (noco.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('تسقط من تقارير الشركات ولا يصلها إشعارُ مواعيد التركيب. إمّا تُعبَّأ من كشف التخصيص، أو تُوسَم «بلا تخصيص» فتُستثنى صراحةً بدل أن تُحسَب صفرًا صامتًا.')) + '</p>'
              + noco.slice(0, 30).map(row).join('')
              + (noco.length > 30 ? '<p class="hint" style="margin:6px 0 0">' + esc(t('يُعرَض ثلاثون — والباقي في شاشة المواقع بترشيح الشركة.')) + '</p>' : '')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له شركة.')) + '</p>'),
          (noco.length && may2) ? btn('\u{1F3F7} ' + t('صنّف الكلَّ «بلا تخصيص»'),'btn-secondary btn-sm',' data-dqnoco="1"') : '')

      + card('\u{1F517} ' + t('أسماءٌ مركَّبة') + ' — ' + nm(compN) + ' ' + t('اسمًا على') + ' ' + nm(compPts) + ' ' + t('نقطة'),
          (compN
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('خانةٌ واحدةٌ تحمل شركتين أو أكثر، فلا تُنسَب نقاطُها لأيٍّ منها في العدّ. الشطرُ يُبقي الأولى في «الشركة» ويضع الباقيَ في «شركات مشاركة» — فتُعَدُّ للأولى ويبقى الباقي مقروءًا.')) + '</p>'
              + Object.keys(comp).slice(0, 12).map(function(c){
                  return '<div class="wt-le"><b class="num">' + nm(comp[c].length) + '</b> \u00b7 <span dir="auto">' + esc(c.slice(0, 90)) + '</span></div>';
                }).join('')
            : '<p class="hint" style="margin:0">' + esc(t('لا أسماءَ مركَّبة.')) + '</p>'),
          (compN && may2) ? btn('\u2702 ' + t('اشطر الكلَّ إلى «شركة» و«شركات مشاركة»'),'btn-secondary btn-sm',' data-dqsplit="1"') : '')

      + card('\u{1F3AF} ' + t('مخيماتٌ بلا مربعٍ أو شاخص') + ' — ' + nm(nosign.length),
          nosign.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('الشاخصُ ما يقرؤه الفنيُّ على الأرض؛ بدونه يبحث بالإحداثية وحدها. تُستكمَل من «تعديل البيانات» في نافذة النقطة قبل إسنادها.')) + '</p>'
              + nosign.slice(0, 30).map(row).join('')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له مربعٌ وشاخص.')) + '</p>');
  })();
if (cur === 'usage') return head + devActCard() + speedCard() + usageCard() + perfCard() + (function(){
    if (may('users') || may('exportAll')) presenceFetch(false);
    var rows = presenceRows(), now = Date.now(), cur9 = appVer();
    var H = 3600000, work = (function(){ var h = new Date().getHours(); return h >= 7 && h <= 23; })();
    var totReads = 0, online = 0, stale = 0, old = 0, back = 0, errs = 0;

    var br = (STATE.bridge || {}), brAge = br.at ? now - (+br.at || 0) : -1;
    var brStale = brAge < 0 || brAge > 45 * 60000;
    var T = rows.map(function(p){
      var age = now - (+p.at || 0), isOn = age < 15 * 60000, isStale = age > 2 * H && work;
      var oldV = p.ver && p.ver !== cur9, hasBack = (+p.q || 0) + (+p.pz || 0) + (+p.pfl || 0) > 0;
      var reads = (p.rd != null) ? +p.rd : (+p.reads || 0);
      totReads += reads; if (isOn) online++; if (isStale) stale++; if (oldV) old++; if (hasBack) back++; errs += (+p.err || 0);
      var flags = [];
      var tip = function(txt, cls, why){ return '<span class="pill ' + cls + '" title="' + esc(t(why)) + '">' + esc(t(txt)) + '</span>'; };
      if (isStale) flags.push(tip('منقطع', 'bad', 'لم يرسل الجهازُ إشارةً منذ أكثر من ساعتين في وقت العمل — مغلقٌ أو بلا شبكة'));
      if (oldV) flags.push(tip('نسخة قديمة', 'warn', 'على نسخةٍ أقدمَ من الحالية — يُحدَّث بإعادة فتح التطبيق على شبكة'));
      if (+p.pz || 0) flags.push(tip('طابورٌ مسموم', 'bad', 'وثيقةٌ رُفض رفعُها مرارًا فعُزلت كي لا توقف الطابور — تُراجَع في شاشة المزامنة: تُعاد أو تُهمَل'));
      if (+p.pf || 0) flags.push(tip(nm(p.pf) + ' ' + t('صور فشلت'), 'warn', 'صورٌ تعذّر رفعُها بعد خمس محاولات — تبقى على الجهاز حتى تُعاد'));
      if (reads > 3000) flags.push(tip('قراءاتٌ عالية', 'warn', 'قرأ اليومَ أكثرَ من ثلاثة آلاف وثيقة — طبيعيٌّ بعد سحبةٍ باردة، ويُراقَب إن تكرّر'));
      if ((+p.cp || 0) > 1) flags.push(tip(nm(p.cp) + ' ' + t('سحبات باردة'), 'warn', 'أعاد تحميلَ نطاقه كلِّه أكثرَ من مرة — كلُّ مرةٍ آلافُ القراءات'));
      if ((+p.rms || 0) > 400) flags.push(tip('رسمٌ بطيء', 'warn', 'متوسّطُ رسم الشاشة فوق ٤٠٠ م.ث — جهازٌ ضعيفٌ أو بياناتٌ ثقيلة'));
      if (p.pulse === false) flags.push(tip('بلا إشارة', 'warn', 'لم يتصل بإشعار التغيير — يعتمد على السحب الدوريِّ وحدَه'));
      return [
        '<b>' + esc(dispName(p.name || '')) + '</b><br><span class="hint" style="margin:0">' + esc(t(roleName(p.role) || p.role || '')) + ' \u00b7 ' + esc(p.ver || '—') + '</span>',
        '<span class="num">' + esc(p.at ? stepAgo(p.at) : '—') + '</span>' + (isOn ? ' ' + pill('متصل', 'ok') : ''),
        N(reads) + (p.rd == null ? ' <span class="hint" style="margin:0">' + esc(t('جلسة')) + '</span>' : ''),
        N(+p.q || 0) + (+p.pq ? ' + ' + nm(p.pq) + '\u{1F4F7}' : ''),
        N(+p.err || 0),
        '<span class="num">' + (p.rms != null ? nm(p.rms) + ' ' + t('م.ث') : '—') + '</span>',
        '<span class="num">' + (p.pms ? nm(p.pms) + ' ' + t('م.ث') : '—') + '</span>',
        flags.join(' ') || '<span class="pill ok" title="' + esc(t('لا شيءَ يستدعي النظر: متصلٌ وعلى النسخة الحالية وبلا طوابيرَ عالقةٍ ولا أخطاء')) + '">' + esc(t('سليم')) + '</span>'
      ];
    });

    var okAll = !stale && !back && !old && totReads <= 40000;
    var plain = [];
    plain.push(okAll ? t('النظامُ يعمل بشكلٍ طبيعيّ: كلُّ الأجهزة تتزامن ولا شيءَ عالق.') : t('يوجد ما يستحقُّ نظرة:'));
    if (stale) plain.push(nm(stale) + ' ' + t('جهازًا لم يتزامن منذ أكثر من ساعتين في وقت العمل — قد يكون مغلقًا أو بلا شبكة.'));
    if (back)  plain.push(nm(back) + ' ' + t('جهازًا عنده عملٌ لم يُرفَع بعد (صورٌ أو زيارات) — يُفتَح على شبكةٍ فيُرفَع وحدَه.'));
    if (old)   plain.push(nm(old) + ' ' + t('جهازًا على نسخةٍ قديمة — يُعاد فتحُ التطبيق فيحدّث نفسَه.'));
    if (totReads > 40000) plain.push(t('استهلاكُ القاعدة اليوم قريبٌ من الحدِّ المجانيّ.'));
    if (errs) plain.push(nm(errs) + ' ' + t('خطأً برمجيًّا مسجَّلًا على الأجهزة — يراه المطوّرُ في السجل.'));
    return card((okAll ? '\u2705 ' : '\u26A0\uFE0F ') + t('الخلاصة'),
        '<p style="margin:0;font-size:15px;line-height:1.8">' + plain.map(esc).join('<br>') + '</p>'
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('متصلٌ الآن')) + ' <b class="num">' + nm(online) + '</b> ' + t('من') + ' <b class="num">' + nm(rows.length) + '</b> \u00b7 '
        + esc(t('قراءاتُ اليوم')) + ' <b class="num">' + nm(totReads) + '</b> / ' + nm(50000) + '</p>')
      + '<details' + (okAll ? '' : ' open') + '><summary class="hint" style="cursor:pointer;margin:0 0 10px">\u{1F527} ' + esc(t('التفاصيل التقنية')) + '</summary>'
      + '<p class="lede" style="margin:0 0 12px">' + esc(t('كلُّ جهازٍ يقيس نفسَه ويرفع قياسَه مع إشارة حضوره: ما قرأ، وما ينتظر في طوابيره، وما وقع فيه من أخطاء، وكم يستغرق رسمُه وسحبُه.')) + '</p>'
      + stats([['أجهزة', N(rows.length)], ['متصلةٌ الآن', N(online), online ? 'ok' : ''],
               ['منقطعةٌ في وقت العمل', N(stale), stale ? 'wrn' : 'ok'],
               ['على نسخةٍ قديمة', N(old), old ? 'wrn' : 'ok'],
               ['بطوابيرَ عالقة', N(back), back ? 'wrn' : 'ok'],
               ['قراءاتُ اليوم كلِّها', N(totReads), totReads > 40000 ? 'wrn' : 'ok'],
               ['أخطاءٌ مسجَّلة', N(errs), errs ? 'wrn' : 'ok'],
               ['آخر تشغيلٍ للجسر', br.at ? esc(stepAgo(br.at)) : esc(t('لم يُسجَّل بعد')), brStale ? 'wrn' : 'ok']])
      + (brStale ? '<p class="hint" style="margin:0 0 8px;color:var(--warn)">' + esc(t('الجسرُ (الحساباتُ والصورُ والبلاغات) لم يعمل منذ أكثر من ٤٥ دقيقة — الجدولةُ تتأخّر أحيانًا. يُشغَّل يدويًّا من المستودع: Actions ← Provision ← Run workflow، ويعمل تلقائيًّا مع كلِّ دفعةِ نسخة.')) + '</p>' : '')
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('الحصةُ المجانيةُ خمسون ألفَ قراءةٍ في اليوم للمشروع كلِّه — والأرقامُ هنا من آخر إشارةٍ لكلِّ جهاز (كلَّ نصف ساعة أو عند التغيّر).'))
      +   ' ' + esc(t('«قراءات» هي قراءاتُ اليوم؛ وما وُسم «جلسة» فمن نسخةٍ أقدمَ يعدُّ منذ الفتح. و«سحبة باردة» تعني أن الجهازَ أعاد تحميلَ نطاقه كلِّه — وهي ما يرفع القراءاتِ بالآلاف.')) + '</p>'
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('مفتاحُ الحالات — اضغط أيَّ حالةٍ لترى معناها:')) + ' '
      +   esc(t('منقطع')) + ' = ' + esc(t('بلا إشارةٍ لساعتين في وقت العمل')) + ' \u00b7 '
      +   esc(t('طابورٌ مسموم')) + ' = ' + esc(t('وثيقةٌ رُفض رفعُها فعُزلت — تُراجَع في المزامنة')) + ' \u00b7 '
      +   esc(t('نسخة قديمة')) + ' = ' + esc(t('يُحدَّث بإعادة الفتح على شبكة')) + ' \u00b7 '
      +   esc(t('سليم')) + ' = ' + esc(t('لا شيءَ يستدعي النظر')) + '</p>'
      + card(t('الأجهزة'), rows.length
          ? table(['الجهاز','آخر ظهور','قراءات','طوابير','أخطاء','زمن الرسم','زمن السحب','الحالة'], T, null, { sticky:true })
          : '<p class="hint" style="margin:0">' + esc(t('لا إشاراتٍ بعد.')) + '</p>')
      + '</details>';
  })();
if (cur === 'vers') return head + (function(){

    if (may('users') || may('exportAll')) presenceFetch(false);
    var cur9 = appVer(), rows = presenceRows(), week = Date.now() - 7 * 86400000;
    var onCur = rows.filter(function(r){ return r.ver === cur9; }).length;
    var stale = rows.filter(function(r){ return r.ver && r.ver !== cur9 && (r.at || 0) > week; });

    var today = dayKey();
    var readsToday = rows.reduce(function(a, r){ return a + ((r.day === today && r.reads) || 0); }, 0);
    return stats([['أجهزة ظهرت', N(rows.length)],
                  ['على النسخة الحالية', N(onCur), 'ok'],
                  ['على إصدار أقدم', N(stale.length), stale.length ? 'bad' : 'ok'],
                  ['قراءات القاعدة اليوم — تقديرًا من الأجهزة', N(readsToday), readsToday > 40000 ? 'bad' : (readsToday > 25000 ? 'wrn' : 'ok')]])
      + '<p class="hint">' + esc(t('الرقمُ الفعليُّ في لوحة Firebase: Firestore ← Usage. والخطةُ Blaze لا توقف الخدمةَ عند الحصة (٥٠ ألف قراءة/يوم) بل تحاسب ما فوقها.')) + '</p>'
      + card('الأجهزة الظاهرة',
          (rows.length
            ? table(['المستخدم','النسخة','الدور','آخر ظهور'], rows.map(function(r){
                return [esc(dispName(r.name || r.uid)), pill(r.ver || '—', r.ver === cur9 ? 'ok' : 'off'),
                        esc(t((ROLES[r.role] || {}).n || r.role || '—')),
                        '<span class="num">' + esc(agoTxt(r.at)) + '</span>'];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لم يصل من أيِّ جهازٍ بعد — تُكتَب نسخةُ كلِّ جهازٍ حين يدخل.')) + '</p>')
          + '<div class="actions" style="margin-top:8px">'
          + btn('\u21BB ' + t('حدّث القائمة'),'btn-quiet btn-sm',' data-presfetch="1"') + '</div>')
      + (stale.length
        ? '<div class="alert error"><span>' + esc(t('أجهزةٌ على إصدارٍ قديم')) + ' — ' + nm(stale.length) + ': '
          + esc(stale.map(function(r){ return dispName(r.name || r.uid) + ' (' + (r.ver || '—') + ')'; }).join('، '))
          + ' — ' + esc(t('المفتوحُ منها يتحدّث تلقائيًّا خلال دقيقة — والمغلقُ حين يُفتَح.')) + '</span></div>'
        : (rows.length ? alertBox('ok','كلُّ الأجهزة الظاهرة على النسخة الحالية.') : ''));
  })();
    if (cur === 'retain') return head + (function(){

    var cnt = function(k){
      var v = STATE[k];
      return Array.isArray(v) ? v.length : Object.keys(v || {}).length;
    };
    var mb = function(n, kb){ return (n * kb / 1024).toFixed(1); };
    var SETS = [
      ['المواقع',       (STATE.sites || []).length, mb((STATE.sites || []).length, 1.4),
                        'دائم',      'أصل المشروع لا يُؤرشَف'],
      ['سجل الأحداث',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٩٠ يومًا',  'يُؤرشَف شهريًّا في ملف مضغوط'],
      ['إشارات الأجهزة', cnt('hb'),   mb(cnt('hb'), 0.2),
                        '٣٠ يومًا',  'الأكثر نموًّا — إشارةٌ كل خمس دقائق'],
      ['الصور',         cnt('photos'),  mb(cnt('photos'), 1600),
                        'دائم',      'مضغوطة على الجهاز قبل الرفع'],
      ['دفتر المخزون',  cnt('moves'),   mb(cnt('moves'), 0.3),
                        'دائم',      'الأرصدة مشتقّة منه فلا يُمسّ'],
      ['المشتريات',     cnt('buys'),    mb(cnt('buys'), 0.3),
                        'دائم',      'مستند مالي'],
      ['سجل التدقيق',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٣ سنوات',  'مدة المساءلة'],
      ['مسودّات محلية', (STATE.queue || []).length, mb((STATE.queue || []).length, 0.5),
                        '٧ أيام',    'تُمسح بعد المزامنة الناجحة']
    ];
    var tot = SETS.reduce(function(a,s){ return a + parseFloat(s[2]); }, 0);
    return stats([['الحجم الكلي', '<span class="num">'+tot.toFixed(1)+'</span> م.ب'],
                  ['سجلات', '<span class="num">'+nm(SETS.reduce(function(a,s){return a+s[1];},0))+'</span>'],
                  ['الأسرع نموًّا','إشارات','wrn'],
                  ['حدّ الخطة المجانية','١ ج.ب','acc']])
      + card('مجموعات البيانات',
          table(['المجموعة','سجلات','م.ب','مدة الاحتفاظ','السياسة'],
            SETS.map(function(s){
              return [esc(t(s[0])), '<span class="num">'+nm(s[1])+'</span>',
                      '<span class="num">'+s[2]+'</span>',
                      s[3]==='دائم' ? pill('دائم','acc') : pill(s[3],'warn'),
                      '<span class="hint" style="margin:0">'+esc(t(s[4]))+'</span>'];
            })),
          btn('تشغيل الأرشفة الآن','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('الأرشفةُ التلقائيةُ تحتاج دالةً على الخادم — لم تُبنَ بعد. الحذفُ اليدويُّ من Firestore متاحٌ لمن يملك القاعدة.')) + '"'))

      + bkCard()
      + card('دورة المزامنة', flow(['يُكتب محليًّا','في الطابور','رُفع','أُكِّد'],0)
        + '<p class="hint">' + esc(t('الكتابة تنجح دائمًا على الجهاز — والشبكة تفصيلٌ لاحق لا شرطٌ مسبق.')) + '</p>')
      + card('سياسة التعارض',
          table(['الحقل','السياسة','لماذا'], [
            ['حالة المسح','<span class="pill acc">' + esc(t('الأحدث يفوز')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تقدُّمٌ لا يرجع')) + '</span>'],
            ['حالة التركيب','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('«مُركّب» و«متعذّر» لا يجتمعان')) + '</span>'],
            ['الإحداثيات','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تحريكان مختلفان يعنيان خلافًا على الموقع')) + '</span>'],
            ['الصور','<span class="pill ok">' + esc(t('تُضاف كلها')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('لا صورة تُلغي أخرى')) + '</span>'],
            ['القطع المستهلكة','<span class="pill off">' + esc(t('يُرفض الثاني')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('وإلا استُهلك المخزون مرتين')) + '</span>'],
            ['الملاحظات','<span class="pill ok">' + esc(t('تُدمَج بسطر فاصل')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('كلاهما شهادة')) + '</span>']
          ]),
          btn('حفظ السياسة','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('مددُ الاحتفاظ أعلاه معلَنةٌ لا مضبوطة — تعديلُها يحتاج تطبيقَ الأرشفةِ أولًا.')) + '"'))
      + card('تعارضات بانتظار القرار',
          '<p class="hint">' + esc(t('لا تعارضات — تظهر هنا بالنسختين جنبًا إلى جنب ليختار المهندس.')) + '</p>')
      + card('طابور الرفع',
          '<div class="actions">'
          + btn('رفع الآن','btn-primary btn-sm',' data-pull="1"')
          + btn('عرض الطابور','btn-secondary btn-sm',' data-pq="1"')
          + '<span class="hint" style="margin:0">' + esc(t('آخر مزامنة')) + ' <span class="num">'
          + esc(STATE.meta.lastSync ? fmtTime(STATE.meta.lastSync, { hour:'2-digit', minute:'2-digit' }) : '—')
          + '</span></span></div>')
      + '<p class="hint">' + esc(t('«آخر كتابة تفوز» صامتةً هي أخطر سياسة: تمحو عمل زميلٍ بلا أن يعلم أحد. ما لا يُحسم آليًّا يُعرَض.')) + '</p>';
  })();
    return head + (function(){
    var C = wipeCounts(), tot = C.reduce(function(a, r){ return a + r[1]; }, 0);
    return alertBox('warn','يمسحُ ما سُجِّل من الجهاز ومن القاعدة: المسحُ والتركيبُ والفكُّ والمهامُّ والصورُ وحركاتُ المخزون والمشترياتُ والمقترحاتُ واللقطاتُ اليومية. وسجلُّ الأحداث والإشعاراتُ يُفرَغان من هذا الجهاز فقط — الأثرُ لا يُمحى من القاعدة. ولا يمسّ المواقعَ الألفَ والسبعمئةَ والسبعةَ والثمانين، ولا الطاقمَ، ولا الكتالوجَ، ولا الإعدادات — يمسح ما سُجِّل لا ما عُرِّف.')
      + halves(t('ما سيُمسَح') + ' — ' + nm(tot) + ' ' + t('سجلًّا'),
          ['البند','العدد'],
          C.map(function(r){
            return [esc(t(r[0])) + (r[2] ? '' : ' <span class="hint" style="margin:0">' + esc(t('من الجهاز فقط')) + '</span>'),
                    r[1] ? pill(nm(r[1]), 'wrn') : N(0)];
          }))
      + (may('delete')
        ? card('التأكيد',
            '<div class="field"><label>' + esc(t('اكتب «مسح نهائي» للتأكيد')) + '</label>'
            + '<input id="wipeOk" dir="auto" placeholder="مسح نهائي"></div>'
            + '<div class="actions">' + btn('صفّر الآن','btn-danger',' data-wipego="1"') + '</div>'
            + '<p class="hint">' + esc(t('لا رجعةَ بعدها — ولكلِّ سجلٍّ له مجموعةٌ أمرُ حذفٍ يُنفَّذ على السحابة فلا يعود مع المزامنة، وما هو من الجهاز فقط يُفرَغ هنا.')) + '</p>')
        : alertBox('info','التصفيرُ للمهندس وحده.'));
  })();
  }};

function techDel(name){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }

  var work = scores().list.filter(function(e){ return e.name === name; })[0];
  var acts = work ? (work.survey + work.install + work.dis + work.prep + work.asm) : 0;
  if (acts){
    toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — لا يُحذَف'));
    return;
  }

  var uid = techUid(name);
  if (!uid) return;
  delete STATE.users[uid];
  CORE.dirty('users', uid, null);
  logEvent('حذف حساب — ' + name);
  toast(t('حُذف الحساب'));
  render(1);
}

function crewSave(){ CORE.set('cfg', 'crews', crewsList().slice()); }
function crewAdd(){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('crN');
  if (!n){ toast(t('اكتب اسم الفريق')); return; }
  if (crewsList().some(function(c){ return c.n === n; })){ toast(t('الاسمُ موجودٌ بالفعل')); return; }
  var id = 'cr' + Date.now().toString(36);
  crewsList().push({ id:id, n:n,
                     base:g('crRole') || 'supervisor', kind:g('crKind') || 'ins',
                     d:g('crD'), members:[] });
  crewSave();
  CREW_CUR = id;
  logEvent('فريق جديد — ' + n);
  toast(t('أُنشئ الفريق'));
  render(1);
}
function crewDel(id){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }

  var L = crewsList(), i = -1, nm2 = '', id2 = '';
  L.forEach(function(c, k){ if (c.id === id || c.n === id){ i = k; nm2 = c.n; id2 = c.id; } });
  if (i < 0) return;
  var inIt = techsList().filter(function(x){ return x.crew === nm2; }).length;
  if (inIt){ toast(t('فيه') + ' ' + nm(inIt) + ' ' + t('موظفًا — انقلهم أولًا')); return; }
  var subs = TEAMS.filter(function(x){ return x.crew === nm2; }).length;
  if (subs){ toast(t('فيه') + ' ' + nm(subs) + ' ' + t('فرقًا فرعيةً — احذفها أولًا')); return; }
  L.splice(i, 1);
  crewSave();
  if (CREW_CUR === id2) CREW_CUR = L[0] ? L[0].id : '';
  logEvent('حذف فريق — ' + nm2);
  toast(t('حُذف الفريق'));
  render(1);
}

function depTeamNew(crewId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var id = 'CT' + Date.now().toString(36);
  var tm = { id:id, n:'فريق ' + nm(crewTeams(crew).length + 1), crew:crew.n, kind:crew.kind, members:[] };
  TEAMS.push(tm);
  CTEAM_CUR = id;
  CORE.dirty('teams', id, tm);
  render(1);
}
function depTeamAdd(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm){ toast(t('أنشئ فريقًا فرعيًّا أولًا')); return; }
  var n = (document.getElementById('depMemName') || {}).value;
  var r = (document.getElementById('depMemRole') || {}).value || 'tech';
  var sh = cfgN((document.getElementById('depMemShare') || {}).value);
  if (!n){ toast(t('لا موظفَ متاح')); return; }
  if (tm.members.some(function(m){ return m.name === n; })){ toast(t('هو في الفريق بالفعل')); return; }
  tm.members.push({ name:n, role:r, share:sh });
  CORE.dirty('teams', tm.id, tm);
  logEvent('إضافة ' + n + ' إلى ' + tm.n);
  toast(n + ' \u00b7 ' + t('أُضيف'));
  render(1);
}
function depTeamRm(i){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var m = tm.members[i];
  if (!m) return;
  tm.members.splice(i, 1);
  CORE.dirty('teams', tm.id, tm);
  logEvent('إخراج ' + m.name + ' من ' + tm.n);
  toast(m.name + ' \u00b7 ' + t('أُخرج'));
  render(1);
}
function depTeamEven(){
  var tm = teamOf(CTEAM_CUR), n = tm && tm.members.length;
  if (!tm || !n){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var base = Math.floor(100 / n), rest = 100 - base * n;
  tm.members.forEach(function(m, i){ m.share = base + (i < rest ? 1 : 0); });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالتساوي'));
  render(1);
}
function depTeamByRole(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var raw = tm.members.map(function(m){ return (TEAM_ROLE[m.role] || TEAM_ROLE.tech).def; });
  var sum = raw.reduce(function(a,b){ return a + b; }, 0);
  if (!sum){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var acc = 0;
  tm.members.forEach(function(m, i){
    var v = (i === tm.members.length - 1) ? (100 - acc) : Math.round(raw[i] / sum * 100);
    m.share = v; acc += v;
  });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالأدوار'));
  render(1);
}
function depTeamDel(teamId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var i = -1;
  TEAMS.forEach(function(x, k){ if (x.id === teamId) i = k; });
  if (i < 0) return;
  if (TEAMS[i].members.length){ toast(t('فيه أعضاء — أخرجهم أولًا')); return; }
  TEAMS.splice(i, 1);
  CORE.dirty('teams', teamId, null);
  if (CTEAM_CUR === teamId) CTEAM_CUR = '';
  toast(t('حُذف الفريق الفرعي'));
  render(1);
}

function roleOfJob(id){ var j = jobOf(id); return j ? j.role : ''; }

function jobAdd(){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('jbN');
  if (!n){ toast(t('اكتب اسم الوظيفة')); return; }
  if (jobsList().some(function(j){ return j.n === n; })){ toast(t('موجودةٌ بالفعل')); return; }
  jobsList().push({ id:'j' + Date.now().toString(36), n:n, role:g('jbR') || 'tech', d:g('jbD') });
  jobSave();
  logEvent('وظيفة جديدة — ' + n);
  toast(t('أُضيفت الوظيفة'));
  render(1);
}

function jobDel(id){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var u = jobUsed(id);
  if (u){ toast(t('عليها') + ' ' + nm(u) + ' ' + t('شخصًا — انقلهم أولًا')); return; }
  var L = jobsList(), i = -1, nm2 = '';
  L.forEach(function(j, k){ if (j.id === id){ i = k; nm2 = j.n; } });
  if (i < 0) return;
  L.splice(i, 1);
  jobSave();
  logEvent('حذف وظيفة — ' + nm2);
  toast(t('حُذفت'));
  render(1);
}

function lessAdd(){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var w2 = g('lqW');
  if (!w2){ toast(t('اكتب ما وقع')); return; }
  lessList().push({ p:g('lqP') || 'المسح', w:w2, a:g('lqA') });
  lessSave(); logEvent('درس مستفاد — ' + w2.slice(0, 50));
  toast(t('سُجّل الدرس')); render(1);
}

function lessDel(i){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var L = lessList(); if (!L[i]) return;
  var w2 = L[i].w; L.splice(i, 1); lessSave();
  logEvent('حذف درس — ' + String(w2).slice(0, 40));
  toast(t('حُذف')); render(1);
}

function stepsList(n){
  var L = STATE.steps || [];
  return n ? L.slice(0, n) : L;
}
function stepsCard(n){
  var L = stepsList(n || 12);

  var uniq = {}; (STATE.steps || []).forEach(function(x){ if (x.site) uniq[x.kind + '|' + x.site] = 1; });
  var nSites = Object.keys(uniq).length;
  if (!L.length) return card('\u2705 ' + t('آخر ما تمّ'),
    '<p class="hint" style="text-align:center;margin:0">'
    + esc(t('لا خطوةَ سُجِّلت بعد — أوّلُ حفظٍ في أيِّ نموذجٍ يظهر هنا.')) + '</p>');
  return cardFlush('\u2705 ' + t('آخر ما تمّ') + ' \u2014 ' + nm(nSites) + ' ' + t('نقطة') + ' \u00b7 ' + nm(stepsList().length) + ' ' + t('خطوة'),
    table(['الخطوة','النقطة','مَن','متى'],
      L.map(function(r){
        var K = STEP_KINDS[r.kind] || { n:r.kind, i:'', code:'' };
        return [K.i + ' <strong>' + esc(t(K.n)) + '</strong>'
                  + (K.code ? ' <span class="num hint">' + esc(K.code) + '</span>' : '')
                  + (r.detail ? '<br><span class="hint" style="margin:0">' + esc(r.detail.slice(0, 40)) + '</span>' : ''),
                r.site ? '<span class="num">' + esc(r.site) + '</span>' : '\u2014',
                esc(dispName(r.by)),
                '<span class="hint num" style="margin:0">' + esc(stepAgo(r.at)) + '</span>'];
      })));
}

function notifAsk(){
  if (typeof Notification === 'undefined'){ toast(t('هذا المتصفّح لا يدعم إشعارات النظام')); return; }
  if (Notification.permission === 'granted'){ toast(t('الإذنُ ممنوحٌ سلفًا')); return; }
  if (Notification.permission === 'denied'){
    toast(t('الإذنُ مرفوضٌ من إعدادات المتصفّح — يُفتَح من هناك')); return;
  }
  Notification.requestPermission().then(function(p){
    toast(t(p === 'granted' ? 'مُنح الإذن — ستصلك الإشعارات' : 'لم يُمنَح الإذن'));
    render(1);
  });
}

function notifPhone(name){
  var x = techsList().filter(function(y){ return y.n === name; })[0];
  return (x && x.ph) || '';
}
function notifMail(n){
  var sub = 'أفاقي — ' + n.kind;
  var body = n.text + (n.site ? '\nالموقع: ' + n.site : '')
           + '\nالوقت: ' + fmtDT(n.at)
           + '\nمن: ' + (n.by || '—');
  return 'mailto:?subject=' + encodeURIComponent(sub) + '&body=' + encodeURIComponent(body);
}

var SHIP_ST = ['قيد التصنيع','شُحنت','في التخليص','وصلت المستودع','متأخرة'];

function shipAdd(){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var ref = g('shRef');
  if (!ref){ toast(t('اكتب رقم الشحنة')); return; }
  if (shipList().some(function(x){ return x.ref === ref; })){ toast(t('رقمُ الشحنة موجودٌ بالفعل')); return; }
  shipSave({ id:'sh' + Date.now().toString(36), ref:ref, item:g('shItem'), qty:+g('shQty') || 0,
             sup:g('shSup'), st:g('shSt') || SHIP_ST[0], sent:g('shSent'), eta:g('shEta'),
             got:'', at:Date.now(), by:STATE.meta.name || '' });
  logEvent('شحنة جديدة — ' + ref);
  notifPush('توريد', 'شحنةٌ جديدة: ' + ref + ' — ' + (g('shItem') || '') + ' · ' + nm(+g('shQty') || 0),
            { lv:'عادي' });
  toast(t('سُجّلت الشحنة'));
  render(1);
}

function shipDel(id){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var x = (STATE.ships || {})[id]; if (!x) return;
  if (x.got){ toast(t('شحنةٌ وصلت — لا تُحذَف، سجلُّها أثر')); return; }
  delete STATE.ships[id];
  CORE.set('ships', id, null);
  logEvent('حذف شحنة — ' + x.ref);
  toast(t('حُذفت')); statBump(); render(1);
}

PAGE.ev = { m:'النظام', t:'السجلات والإشعارات',
  l:'ما جرى ومن فعله ومتى، وما أُرسل، وما ينتظر اعتمادًا.',
  body:function(){
    var head = tabHead('ev'), cur = tabCur('ev');
    if (cur === 'ev') return head + (function(){

    if (evAll().length < 50) evFetch(false);
    var all = evAll(), L = evRows();

    var evN = {};
    all.forEach(function(e){ var b = evActor(e).name; if (b) evN[b] = (evN[b] || 0) + 1; });
    var users = [], seen = {};
    usersList().forEach(function(p){
      var nx = (p[1] || {}).name || '';
      if (nx && !seen[nx]){ seen[nx] = 1; users.push(nx); }
    });
    Object.keys(evN).forEach(function(b){ if (!seen[b]){ seen[b] = 1; users.push(b); } });
    users.sort(function(a, b){ return (evN[b] || 0) - (evN[a] || 0) || String(a).localeCompare(String(b)); });
    var kinds = {}; all.forEach(function(e){ var k = evKind(e.what); kinds[k] = (kinds[k]||0)+1; });
    var cats = {};  all.forEach(function(e){ var c = evCat(e.what); if (c) cats[c] = (cats[c]||0)+1; });

    return stats([['كل الأحداث', N(all.length), 'acc']]
                 .concat(EV_CATS.map(function(c){ return [c[0], N(cats[c[0]] || 0)]; })))

      + '<div class="chips">'
      + '<button type="button" class="chip' + (!EVF.cat ? ' on' : '') + '" data-evcat="">'
      +   esc(t('الكل')) + ' <span class="num">' + nm(all.length) + '</span></button>'
      + EV_CATS.map(function(c){
          return '<button type="button" class="chip' + (EVF.cat===c[0]?' on':'') + '" data-evcat="' + esc(c[0]) + '">'
            + esc(t(c[0])) + ' <span class="num">' + nm(cats[c[0]] || 0) + '</span></button>';
        }).join('')
      + '</div>'

      + card('تصفية',
        '<div class="grid cols-2">'
        + '<div class="field"><label>' + esc(t('نوع الحدث')) + '</label>'
        + '<select data-evf="kind"><option value="">— ' + esc(t('الكل')) + ' —</option>'
        + Object.keys(kinds).sort().map(function(k){
            return '<option value="' + esc(k) + '"' + (EVF.kind===k?' selected':'') + '>' + esc(t(k)) + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="field"><label>' + esc(t('المستخدم')) + '</label>'
        + '<select data-evf="by"><option value="">— ' + esc(t('الكل')) + ' —</option>'
        + users.map(function(u){

            return '<option value="' + esc(u) + '"' + (EVF.by===u?' selected':'') + '>'
              + esc(u) + ' (' + nm(evN[u] || 0) + ')</option>'; }).join('')
        + '</select></div>'
        + '<div class="field"><label>' + esc(t('من')) + '</label>'
        + '<input type="datetime-local" data-evf="from" value="' + esc(EVF.from) + '"></div>'
        + '<div class="field"><label>' + esc(t('إلى')) + '</label>'
        + '<input type="datetime-local" data-evf="to" value="' + esc(EVF.to) + '"></div>'
        + '</div>'
        + '<div class="field"><label>' + esc(t('بحث في نص الحدث')) + '</label>'
        + '<input type="search" data-evf="q" value="' + esc(EVF.q) + '" dir="auto"></div>'
        + '<div class="actions">'
        + btn('امسح التصفية','btn-quiet btn-sm',' data-evclr="1"')
        + btn('\u{1F5C3} ' + t('اجلب السجلَّ من القاعدة'),'btn-quiet btn-sm',' data-evfetch="1"')
        + ((EVF.from || EVF.to) ? btn('\u{1F4C5} ' + t('اجلب هذا المدى من القاعدة'),'btn-secondary btn-sm',' data-evrange="1"') : '')
        + (EV_MORE ? btn('\u23EC ' + t('أنزِل أقدمَ خمسمئة'),'btn-quiet btn-sm',' data-evolder="1"') : '')
        + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ev"')
        + '</div>')

      + cardFlush(t('الأحداث') + ' — ' + nm(L.length) + ' ' + t('من') + ' ' + nm(all.length),
          L.length
            ? table(['الوقت','النوع','الحدث','المستخدم'],
                capList(L, 300).map(function(e){
                  return ['<span class="num">' + esc(e.day || '') + ' ' + esc(e.at || '') + '</span>',
                          pill(t(evKind(e.what)), evPillKind(e.what)),
                          esc(e.what || ''),

                          (function(){
                            var a = evActor(e);
                            return esc(dispName(a.name) || '—')
                              + (a.from === 'text'
                                  ? '<br><span class="hint" style="margin:0">' + esc(t('من نصّ الحدث')) + '</span>'
                                  : (e.rec && e.rec !== e.by
                                      ? '<br><span class="hint" style="margin:0">' + esc(t('سُجِّل على')) + ' ' + esc(dispName(e.rec)) + '</span>'
                                      : ''));
                          })()];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا أحداثَ تطابق التصفية.')) + '</p>')

      + (L.length > 300
          ? ''
          : '')
      + '<p class="hint">' + esc(t('في اليد')) + ' <b class="num">' + nm(evAll().length) + '</b> '
      +   esc(t('حدثًا من سجلِّ القاعدة')) + ' — '
      +   esc(EV_MORE ? t('وثمّةَ أقدمُ لم يُنزَل بعد: استعمل «أنزِل أقدمَ خمسمئة» أو حدِّد مدًى بالتاريخ واجلبه.')
                      : t('وهذا كلُّ ما في القاعدة ضمن هذا النطاق.')) + '</p>'
      + '<p class="hint">' + esc(t('الأثرُ لا يُمحى: قواعدُ القاعدة تمنع حذفَ سجل الأحداث على الجميع. والشرائحُ أعلاه عدسةُ الحوكمة — نفس السجل، لا سجلٌّ ثانٍ.')) + '</p>';
  })();
    if (cur === 'appr') return head + (function(){
    var co = coReqList(), fx = fixList().filter(function(f){ return f.status === 'مطلوب'; });
    var by = buyPend();
    var all = [].concat(
      co.map(function(x){ return { k:'co',  id:x.name, at:x.at, x:x }; }),
      fx.map(function(x){ return { k:'fix', id:x.id,   at:x.at, x:x }; }),
      by.map(function(x){ return { k:'buy', id:x.id,   at:x.at, x:x }; })
    ).sort(function(a,b){ return (a.at || 0) - (b.at || 0); });

    var oldest = all.length
      ? Math.max(0, Math.round((Date.now() - (all[0].at || Date.now())) / 86400000))
      : null;
    var cap = cfgGet('budApp') || 0;

    function row(it){
      var x = it.x, ttl, det;
      if (it.k === 'co'){ ttl = t('شركة مقترحة'); det = x.name; }
      else if (it.k === 'fix'){
        ttl = t('تصويب بيان');
        det = x.site + ' · ' + esc(t(x.field)) + ': «' + esc(x.was || '—') + '» → «' + esc(x.val) + '»';
      } else {
        ttl = t('مشترًى فوق الحد');
        det = x.item + ' · ' + nm(x.amt) + ' ' + t('ريال') + ' · ' + esc(x.sup || '');
      }
      var days = Math.max(0, Math.round((Date.now() - (x.at || Date.now())) / 86400000));
      return [pill(ttl, it.k === 'buy' ? 'wrn' : 'off'),
              det + (x.why ? '<br><span class="hint" style="margin:0">' + esc(x.why) + '</span>' : ''),
              esc(dispName(x.by) || '—'),
              '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
              may('approve')
                ? btn('اعتمد','btn-primary btn-sm',' data-apok="' + it.k + '|' + esc(it.id) + '"')
                  + btn('ردّ','btn-quiet btn-sm',' data-apno="' + it.k + '|' + esc(it.id) + '"')
                : '<span class="hint" style="margin:0">' + esc(t('للمهندس')) + '</span>'];
    }

    return stats([['شركات مقترحة', N(co.length), co.length ? 'wrn' : 'ok'],
                  ['تصويبات بيانات', N(fx.length), fx.length ? 'wrn' : 'ok'],
                  ['مشتريات فوق الحد', N(by.length), by.length ? 'wrn' : 'ok'],
                  ['أقدم مقترح', oldest === null ? '—' : (nm(oldest) + ' ' + t('يوم')),
                    oldest > 3 ? 'bad' : '']])

      + cardFlush(t('بانتظار الاعتماد') + ' — ' + nm(all.length),
          all.length
            ? table(['النوع','التفصيل','مَن اقترح','منذ','القرار'], all.map(row))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا مقترحات — تظهر هنا فور اقتراح شركةٍ جديدة أو تصويبِ بيانٍ أو تجاوزِ مشترًى حدَّ الاعتماد.'))
              + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="appr"') : '')

      + card('القاعدة', flow(['يقترح المشرف','يراجع المهندس','يُعتمد أو يُردّ'], 0)
        + '<div class="pop-rows" style="margin:12px 0 0">'
        + '<div><span class="k">' + esc(t('شركة جديدة')) + '</span><span>'
        +   esc(t('يقترحها الميدانُ عند تسجيل موقعٍ مقترح — والاعتمادُ يُدخلها القائمةَ الموحّدة.'))
        + '</span></div>'
        + '<div><span class="k">' + esc(t('تصويب بيان')) + '</span><span>'
        +   esc(t('يطلبه الفنيُّ من نموذج المسح حين يجد خلافَ المسجَّل — والاعتمادُ يُطبِّقه على السجل.'))
        + '</span></div>'
        + '<div><span class="k">' + esc(t('مشترًى فوق الحد')) + '</span><span>'
        +   esc(t('يُنشئه النظامُ تلقائيًّا حين يتجاوز المبلغُ حدَّ الاعتماد')) + ' — '
        +   (cap ? nm(cap) + ' ' + esc(t('ريال')) : esc(t('غير مضبوط')))
        +   ' — ' + esc(t('ويُضبَط في «الميزانية والاعتماد».'))
        + '</span></div>'
        + '</div>'
        + '<div class="actions" style="margin-top:12px">'
        + btn('اضبط حدَّ الاعتماد','btn-secondary btn-sm',' data-p="budget"')
        + '</div>'
        + '<p class="hint">' + esc(t('الطلبُ لا يُحذَف باعتمادٍ ولا بردّ — يبقى بمن قرّر ومتى ولماذا.')) + '</p>');
  })();
    return head + (function(){
    var L = notifMineQ(), un = notifUnread();
    var perm = (typeof Notification === 'undefined') ? 'غير مدعوم' : Notification.permission;

    return stats([['غير مقروء', N(un), un ? 'wrn' : 'ok'],
                  ['الكل', N(L.length)],
                  ['إشعارُ النظام', t(perm === 'granted' ? 'ممنوح'
                                    : perm === 'denied' ? 'مرفوض' : 'لم يُطلَب'),
                    perm === 'granted' ? 'ok' : 'wrn']])

      + notifSettingsCard()
      + card('قنوات الوصول',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t('الرسالةُ تُولَّد مرةً وتُرسَل بما يتاح: داخل التطبيق دائمًا، وإشعارُ النظام على اللاب والجوّال والويب بإذنٍ يُطلَب مرة، وواتساب أو بريدٌ لمن يُقصَد بعينه.'))
          + '</p>'
          + '<div class="actions">'
          + (perm === 'granted'
              ? btn('جرّب إشعار النظام','btn-secondary btn-sm',' data-ntest="1"')
              : btn('اسمح بإشعار النظام','btn-primary btn-sm',' data-nask="1"'))
          + (un ? btn('علّم الكل مقروءًا','btn-quiet btn-sm',' data-nread="*"') : '')
          + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="notif"')
          + '</div>')

      + cardFlush('السجل',
          L.length
            ? '<div class="notif-rows">' + table(['الوقت','النوع','الرسالة','إلى','قنوات'],
                capList(L, 200).map(function(n){
                  var ph = notifPhone(n.to);
                  return ['<span class="num">' + esc(fmtDT2(n.at, { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })) + '</span>',
                          pill(t(n.kind), n.lv === 'عاجل' ? 'bad' : n.lv === 'مهم' ? 'wrn' : 'off'),
                          (n.read ? '' : '<b>') + esc(n.text) + (n.read ? '' : '</b>')
                            + (n.site ? '<br><span class="hint" style="margin:0">' + esc(n.site) + '</span>' : ''),
                          esc(n.to || '—'),
                          (ph && may('phones')
                            ? '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="'
                              + esc(waLink(ph, n.text)) + '" data-nwa="' + esc(n.id) + '">واتساب</a>' : '')
                          + '<a class="btn btn-quiet btn-sm" href="' + esc(notifMail(n)) + '" data-nmail="'
                            + esc(n.id) + '">بريد</a>'
                          + (n.read ? '' : btn('قرأت','btn-quiet btn-sm',' data-nread="' + esc(n.id) + '"'))

                          + (n.site && (n.kind === 'زيارة تمّت') && may('approve')
                              ? btn('\u2705 ' + t('راجع واعتمد'),'btn-primary btn-sm',' data-ngo="svappr" data-nsite="' + esc(n.site) + '" data-nid="' + esc(n.id) + '"') : '')
                          + (n.site && (n.kind === 'تركيب تمّ') && may('approve')
                              ? btn('\u{1F50E} ' + t('دقّق التركيب'),'btn-primary btn-sm',' data-ngo="qa" data-nsite="' + esc(n.site) + '" data-nid="' + esc(n.id) + '"') : '')
                          + (n.site && (n.kind === 'إسناد' || n.kind === 'اعتماد' || n.kind === 'تحتاج زيارة أخرى')
                              ? btn('\u25C8 ' + t('افتح النقطة'),'btn-secondary btn-sm',' data-site="' + esc(n.site) + '"') : '')];
                })) + '</div>'
            : '<p class="hint" style="padding:16px">' + esc(t('لا إشعاراتٍ بعد.')) + '</p>');
  })();
  }};

var VEH_OWN    = ['ملك','مستأجرة'];

function vehOfWho(who){
  return vehAsnList().filter(function(a){ return a.to === who; });
}

function vehAdd(){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var plate = g('vhPlate');
  if (!plate){ toast(t('اكتب رقم اللوحة')); return; }
  if (vehList().some(function(x){ return x.plate === plate; })){ toast(t('اللوحةُ مسجَّلةٌ بالفعل')); return; }
  var id = 'vh' + Date.now().toString(36);
  vehSave({ id:id, plate:plate, kind:g('vhKind') || 'sedan', model:g('vhModel'),
            year:g('vhYear'), lic:g('vhLic'), licExp:g('vhLicExp'), insExp:g('vhInsExp'),
            own:g('vhOwn') || 'ملك', cost:+g('vhCost') || 0, start:g('vhStart') || todayISO(),
            st:'متاحة', note:'', at:Date.now(), by:STATE.meta.name || '' });
  logEvent('سيارة جديدة — ' + plate + ' · ' + vehKindName(g('vhKind')));
  toast(t('أُضيفت السيارة'));
  render(1);
}
function vehDel(id){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var v = vehOf(id); if (!v) return;
  if (vehAsnOf(id)){ toast(t('مُسنَدةٌ الآن — أنهِ الإسنادَ أولًا')); return; }
  delete STATE.vehicles[id];
  CORE.set('vehicles', id, null);
  logEvent('حذف سيارة — ' + v.plate);
  toast(t('حُذفت'));
  statBump(); render(1);
}

function vehAsnAdd(){
  if (!may('fleet') && !may('settings')){ toast(t('الإسنادُ للمهندس والمشتريات')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var vid = g('vaVeh'), who = g('vaTo'), kind = g('vaKind');
  if (!vid){ toast(t('اختر السيارة')); return; }
  if (!who){ toast(t('اختر من تُسنَد إليه')); return; }
  var vv = vehOf(vid);
  if (vv && kind && !vehFits(vv.kind, kind)){

    toast(t('تنبيه: ') + vehKindName(vv.kind) + ' ' + t('لا تناسب') + ' ' + t(ASN_LABEL[kind] || kind));
  }
  var cur = vehAsnOf(vid);
  if (cur){ toast(t('مُسنَدةٌ إلى') + ' ' + cur.to + ' — ' + t('أنهِ الإسنادَ أولًا')); return; }
  var id = 'va' + Date.now().toString(36);
  if (!STATE.vehAsn) STATE.vehAsn = {};
  STATE.vehAsn[id] = { id:id, veh:vid, to:who, kind:kind || 'srv',
                       at:Date.now(), by:STATE.meta.name || '', end:0 };
  CORE.set('vehAsn', id, STATE.vehAsn[id]);
  vehSet(vid, { st:'مُسندة' });
  var v = vehOf(vid);
  logEvent('إسناد سيارة — ' + v.plate + ' → ' + who + ' · ' + kind);
  notifPush('سيارة', 'أُسندت إليك سيارة ' + v.plate + ' — ' + vehKindName(v.kind),
            { to:who, lv:'عادي' });
  toast(t('أُسندت السيارة'));
  render(1);
}
function vehAsnEnd(id){
  if (!may('fleet') && !may('settings')){ toast(t('الإسنادُ للمهندس والمشتريات')); return; }
  var a = (STATE.vehAsn || {})[id]; if (!a) return;
  a.end = Date.now();
  CORE.set('vehAsn', id, a);
  vehSet(a.veh, { st:'متاحة' });
  var v = vehOf(a.veh);
  logEvent('إنهاء إسناد سيارة — ' + (v ? v.plate : a.veh) + ' · كان مع ' + a.to);
  toast(t('أُنهي الإسناد'));
  render(1);
}

function vehNeed(){
  var crews = (typeof crewsList === 'function') ? crewsList() : [];

  var field = crews.filter(function(c){ return c.id !== 'eng'; });
  var want = field.length * 2;
  var have = vehList().filter(function(v){ return v.st !== 'خارج الخدمة'; }).length;
  return { crews:field.length, want:want, have:have, gap:Math.max(0, want - have) };
}
function vehExpiring(days){
  days = days || 30;
  var lim = Date.now() + days * 86400000;
  return vehList().filter(function(v){
    var a = v.licExp ? Date.parse(v.licExp) : 0;
    var b = v.insExp ? Date.parse(v.insExp) : 0;
    return (a && a < lim) || (b && b < lim);
  });
}
function vehCost(){
  return vehList().reduce(function(a, v){ return a + (+v.cost || 0); }, 0);
}

PAGE.fleet = { m:'الميدان', t:'السيارات',
  l:'أسطولُ المشروع كلُّه في شاشةٍ واحدة — الأسطولُ وإسنادُه وعُهدتُه وتكلفتُه وسيارتُك.',
  body:function(){
    var head = tabHead('fleet'), cur = tabCur('fleet');
    if (cur === 'fleetAsn') return head + (function(){
    var A = vehAsnList(), free = vehList().filter(function(v){ return v.st === 'متاحة'; });
    var people = techsList().map(function(x){ return x.n; });
    var crews = crewsList().map(function(c){ return c.n; });

    return stats([['إسناداتٌ قائمة', N(A.length)],
                  ['سياراتٌ متاحة', N(free.length), free.length ? 'ok' : 'wrn'],
                  ['فرقٌ بلا سيارة',
                    N(crews.filter(function(c){ return !vehOfWho(c).length; }).length), 'wrn']])

      + ((may('fleet') || may('settings'))
        ? card('إسنادٌ جديد',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('السيارة')) + ' <span class="req">*</span></label>'
            +   '<select id="vaVeh"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   free.map(function(v){
                  return '<option value="' + esc(v.id) + '">' + esc(v.plate) + ' — '
                    + esc(vehKindName(v.kind)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('إلى')) + ' <span class="req">*</span></label>'
            +   '<select id="vaTo"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   '<optgroup label="' + esc(t('فرق')) + '">'
            +     crews.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            +   '</optgroup>'
            +   '<optgroup label="' + esc(t('أشخاص')) + '">'
            +     people.map(function(p){ return '<option>' + esc(p) + '</option>'; }).join('')
            +   '</optgroup></select></div>'
            + '<div class="field"><label>' + esc(t('لأيِّ عمل')) + '</label><select id="vaKind">'
            +   Object.keys(ASN_LABEL).map(function(k){
                  return '<option value="' + esc(k) + '">' + esc(t(ASN_LABEL[k])) + '</option>'; }).join('')
            +   '</select></div>'
            + '</div>',
            btn('➕ أسنِد','btn-primary btn-sm',' data-vaadd="1"'))
        : '')

      + cardFlush(t('الإسنادات القائمة') + ' — ' + nm(A.length),
          A.length
            ? table(['السيارة','النوع','إلى','العمل','منذ',''],
                A.map(function(a){
                  var v = vehOf(a.veh) || { plate:a.veh, kind:'' };
                  var days = Math.max(0, Math.round((Date.now() - (a.at || Date.now())) / 86400000));
                  return ['<span class="num">' + esc(v.plate) + '</span>',
                          esc(vehKindName(v.kind)), esc(a.to),
                          pill(t(ASN_LABEL[a.kind] || a.kind), 'off'),
                          '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
                          (may('fleet') || may('settings'))
                            ? btn('أنهِ','btn-quiet btn-sm',' data-vaend="' + esc(a.id) + '"') : ''];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا إسناداتٍ قائمة.')) + '</p>')

      + '<p class="hint">' + esc(t('السيارةُ الواحدةُ لا تُسنَد مرتين في وقتٍ واحد — وإلا وقف فريقٌ ينتظر ما أُخذ منه.')) + '</p>';
  })();
    if (cur === 'fleetLog') return head + (function(){
    var all = vehAsnAll().slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
    var mis = vehMismatch();
    var dayMs = VLOG_D ? new Date(VLOG_D + 'T12:00:00').getTime() : 0;
    var onDay = dayMs ? vehOnDay(dayMs) : [];
    var shown = all.filter(function(a){
      if (!VLOG_Q) return true;
      var v = vehOf(a.veh);
      return ((v ? v.plate : '') + ' ' + a.to).indexOf(VLOG_Q) > -1;
    });

    return stats([['إسناداتٌ في السجل', N(all.length)],
                  ['جاريةٌ الآن', N(all.filter(function(a){ return !a.end; }).length), 'acc'],
                  ['منتهية', N(all.filter(function(a){ return a.end; }).length)],
                  ['سيارةٌ لا تناسب عملَها', N(mis.length), mis.length ? 'bad' : 'ok']])

      + (mis.length
        ? alertBox('warn', 'سيارةٌ لا تناسب عملَها: '
            + mis.map(function(a){
                var v = vehOf(a.veh);
                return (v ? v.plate : a.veh) + ' — ' + vehKindName(v ? v.kind : '')
                  + ' مع ' + a.to + ' في ' + t(ASN_LABEL[a.kind] || a.kind);
              }).join(' · ')
            + '. العدّةُ تحتاج بيك أب أو فان، والتنقّلُ سيدان — ومن معه سيدانٌ وحدَه لا يحمل عدّتَه فيقف في الموقع بلا قطع.')
        : '')

      + card('من كانت معه سيارةٌ في يومٍ بعينه',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('التاريخ')) + '</label>'
          +   '<input type="date" id="vlD" data-vlgd="1" value="' + esc(VLOG_D) + '"></div>'
          + '<div class="field"><label>' + esc(t('بحث بلوحةٍ أو اسم')) + '</label>'
          +   '<input type="search" id="vlQ" data-vlgq="1" value="' + esc(VLOG_Q) + '" dir="auto"></div>'
          + '</div>'
          + (VLOG_D
            ? (onDay.length
              ? table(['اللوحة','النوع','كانت مع','العمل','من','إلى'],
                  onDay.map(function(x){
                    return ['<span class="num">' + esc(x.veh.plate) + '</span>',
                            esc(vehKindName(x.veh.kind)),
                            '<strong>' + esc(x.asn.to) + '</strong>',
                            esc(t(ASN_LABEL[x.asn.kind] || x.asn.kind || '—')),
                            '<span class="num">' + esc(msDay(x.asn.at)) + '</span>',
                            x.asn.end ? '<span class="num">' + esc(msDay(x.asn.end)) + '</span>'
                                      : pill(t('جارٍ'), 'ok')];
                  }))
              : '<p class="hint" style="padding:14px 0;margin:0">'
                + esc(t('لا سيارةَ كانت مُسنَدةً في هذا اليوم.')) + '</p>')
            : '<p class="hint" style="margin:11px 0 0">'
              + esc(t('اختر يومًا — تظهر كلُّ سيارةٍ كانت مُسنَدةً فيه ومن كانت معه.')) + '</p>'))

      + cardFlush(t('السجل كلُّه') + ' — ' + nm(shown.length),
          shown.length
            ? table(['اللوحة','النوع','إلى','العمل','من','إلى','المدة',''],
                capList(shown, 200).map(function(a){
                  var v = vehOf(a.veh);
                  var days = Math.max(1, Math.round(((a.end || Date.now()) - (a.at || Date.now())) / 86400000));
                  var fit = v && a.kind ? vehFits(v.kind, a.kind) : true;
                  return ['<span class="num">' + esc(v ? v.plate : a.veh) + '</span>',
                          esc(v ? vehKindName(v.kind) : '—'),
                          esc(a.to),
                          esc(t(ASN_LABEL[a.kind] || a.kind || '—')),
                          '<span class="num">' + esc(msDay(a.at)) + '</span>',
                          a.end ? '<span class="num">' + esc(msDay(a.end)) + '</span>' : pill(t('جارٍ'), 'ok'),
                          '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
                          fit ? '' : pill(t('لا تناسب'), 'bad')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا إسناداتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleetLog"') : '')

      + '<p class="hint">' + esc(t('السجلُّ لا يُمحى: من أُنهي إسنادُه يبقى فيه بتاريخيه — فالمخالفةُ تأتي بعد شهرٍ بتاريخِ يومٍ مضى، ومن معه السيارةُ اليومَ لم يكن فيها يومَها.')) + '</p>';
  })();
    if (cur === 'fleetCost') return head + (function(){
    var L = vehList(), tot = vehCost();
    var byKind = {};
    L.forEach(function(v){ byKind[v.kind] = (byKind[v.kind] || 0) + (+v.cost || 0); });
    return stats([['سيارات', N(L.length)],
                  ['التكلفة الشهرية', N(tot)],
                  ['ملك', N(L.filter(function(v){ return v.own === 'ملك'; }).length)],
                  ['مستأجرة', N(L.filter(function(v){ return v.own === 'مستأجرة'; }).length), 'acc']])
      + cardFlush('حسب النوع',
          table(['النوع','عدد','التكلفة الشهرية'],
            vehKinds().map(function(k){
              return [esc(k.n), N(L.filter(function(v){ return v.kind === k.id; }).length),
                      N(byKind[k.id] || 0)];
            }), ['الإجمالي', N(L.length), N(tot)]))
      + cardFlush('التفصيل',
          L.length
            ? table(['اللوحة','النوع','الملكية','من تاريخ','أشهر','الشهرية','التراكمي'],
                L.map(function(v){
                  var mo = v.start
                    ? Math.max(1, Math.round((Date.now() - Date.parse(v.start)) / 2592000000)) : 1;
                  return ['<span class="num">' + esc(v.plate) + '</span>',
                          esc(vehKindName(v.kind)), esc(t(v.own || 'ملك')),
                          '<span class="num">' + esc(v.start || '—') + '</span>',
                          N(mo), N(+v.cost || 0), '<b>' + N((+v.cost || 0) * mo) + '</b>'];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا سياراتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleetCost"') : '')
      + '<p class="hint">' + esc(t('التراكميُّ يُحسَب من تاريخ التشغيل إلى اليوم — فما استُؤجر شهرًا لا يُحمَّل كما يُحمَّل ما عمل موسمًا.')) + '</p>';
  })();
    if (cur === 'myveh') return head + (function(){
    var me = STATE.meta.name || '';
    var mine = vehOfWho(me);
    var crew = (techsList().filter(function(x){ return x.n === me; })[0] || {}).crew || '';
    if (crew) mine = mine.concat(vehOfWho(crew));
    if (!mine.length)
      return card('', '<p class="hint" style="text-align:center;margin:0">'
        + esc(t('لا سيارةَ مُسنَدةً إليك الآن.')) + '</p>');
    return mine.map(function(a){
      var v = vehOf(a.veh) || {};
      return card(v.plate || '—',
        '<div class="pop-rows" style="margin:0">'
        + '<div><span class="k">' + esc(t('النوع')) + '</span><span>' + esc(vehKindName(v.kind)) + '</span></div>'
        + '<div><span class="k">' + esc(t('الموديل')) + '</span><span>' + esc(v.model || '—') + '</span></div>'
        + '<div><span class="k">' + esc(t('لأيِّ عمل')) + '</span><span>'
        +   esc(t(ASN_LABEL[a.kind] || a.kind)) + '</span></div>'
        + '<div><span class="k">' + esc(t('انتهاء الرخصة')) + '</span><span class="num">'
        +   esc(v.licExp || '—') + '</span></div>'
        + '</div>');
    }).join('');
  })();
    return head + (function(){
    var L = vehList().filter(function(v){
      if (!VEH_Q) return true;
      return (v.plate + ' ' + (v.model || '') + ' ' + vehKindName(v.kind)).indexOf(VEH_Q) > -1;
    });
    var need = vehNeed(), exp = vehExpiring(30);
    var byKind = {};
    vehList().forEach(function(v){ byKind[v.kind] = (byKind[v.kind] || 0) + 1; });

    return stats([['في الأسطول', N(vehList().length)],
                  ['متاحة', N(vehList().filter(function(v){ return v.st === 'متاحة'; }).length), 'ok'],
                  ['مُسندة', N(vehList().filter(function(v){ return v.st === 'مُسندة'; }).length), 'acc'],
                  ['نقصٌ عن الحاجة', N(need.gap), need.gap ? 'bad' : 'ok']])

      + (need.gap
        ? alertBox('warn', 'الفرقُ الميدانيةُ ' + nm(need.crews) + ' وتحتاج ' + nm(need.want)
            + ' سيارةً — المتاحُ ' + nm(need.have) + '، فالنقصُ ' + nm(need.gap)
            + '. سجّل طلبَ شراءٍ أو استئجار.')
        : '')
      + (exp.length
        ? alertBox('warn', nm(exp.length) + ' سيارةً رخصتُها أو تأمينُها ينتهي خلال شهر: '
            + exp.slice(0, 4).map(function(v){ return v.plate; }).join('، '))
        : '')

      + card('الأسطول حسب النوع',
          '<div class="chips" style="margin:0">'
          + vehKinds().map(function(k){
              return '<span class="cat">' + esc(t(k.n)) + ' <span class="n">'
                + nm(byKind[k.id] || 0) + '</span></span>';
            }).join('')
          + '</div>')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="vhQ" data-vhq="1" value="' + esc(VEH_Q) + '" placeholder="'
      +     esc(t('ابحث باللوحة أو الموديل أو النوع')) + '" dir="auto">'
      + '</form>'

      + cardFlush(t('السيارات') + ' — ' + nm(L.length),
          L.length
            ? table(['اللوحة','النوع','الموديل','الملكية','انتهاء الرخصة','الحالة','مع مَن',''],
                L.map(function(v){
                  var a = vehAsnOf(v.id);
                  var late = v.licExp && Date.parse(v.licExp) < Date.now() + 2592000000;
                  return ['<input value="' + esc(v.plate) + '" data-vhp="' + esc(v.id) + '" dir="ltr">',
                          '<select data-vhk="' + esc(v.id) + '">'
                            + vehKinds().map(function(k){
                                return '<option value="' + esc(k.id) + '"' + (v.kind === k.id ? ' selected' : '')
                                  + '>' + esc(t(k.n)) + '</option>'; }).join('') + '</select>',
                          '<input value="' + esc(v.model || '') + '" data-vhm="' + esc(v.id) + '" dir="auto">',
                          esc(t(v.own || 'ملك')),
                          '<input type="date" value="' + esc(v.licExp || '') + '" data-vhe="' + esc(v.id) + '"'
                            + (late ? ' style="border-color:var(--danger)"' : '') + '>',
                          pill(t(v.st || 'متاحة'), v.st === 'متاحة' ? 'ok'
                                : v.st === 'مُسندة' ? 'acc' : 'warn'),
                          a ? esc(a.to) + '<br><span class="hint" style="margin:0">'
                              + esc(t(ASN_LABEL[a.kind] || a.kind)) + '</span>' : '—',
                          (may('fleet') || may('settings'))
                            ? (a ? btn('أنهِ الإسناد','btn-quiet btn-sm',' data-vaend="' + esc(a.id) + '"')
                                 : btn('حذف','btn-quiet btn-sm',' data-vhdel="' + esc(v.id) + '"'))
                            : ''];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا سياراتٍ بعد — أضِفها أدناه أو استوردها من «التصدير والاستيراد».')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleet"') : '')

      + ((may('fleet') || may('settings'))
        ? card('إضافة سيارة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('رقم اللوحة')) + ' <span class="req">*</span></label>'
            +   '<input id="vhPlate" dir="ltr" placeholder="ABC 1234"></div>'
            + '<div class="field"><label>' + esc(t('النوع')) + '</label><select id="vhKind">'
            +   vehKinds().map(function(k){ return '<option value="' + esc(k.id) + '">' + esc(t(k.n)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('الموديل')) + '</label><input id="vhModel" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('سنة الصنع')) + '</label><input id="vhYear" type="number" min="1990"></div>'
            + '<div class="field"><label>' + esc(t('رقم الرخصة')) + '</label><input id="vhLic" dir="ltr"></div>'
            + '<div class="field"><label>' + esc(t('انتهاء الرخصة')) + '</label><input id="vhLicExp" type="date"></div>'
            + '<div class="field"><label>' + esc(t('انتهاء التأمين')) + '</label><input id="vhInsExp" type="date"></div>'
            + '<div class="field"><label>' + esc(t('الملكية')) + '</label><select id="vhOwn">'
            +   VEH_OWN.map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(o)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('التكلفة الشهرية')) + '</label><input id="vhCost" type="number" min="0"></div>'
            + '<div class="field"><label>' + esc(t('من تاريخ')) + '</label><input id="vhStart" type="date" value="' + esc(todayISO()) + '"></div>'
            + '</div>',
            btn('➕ إضافة سيارة','btn-primary btn-sm',' data-vhadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('اللوحةُ لا تتكرّر. والسيارةُ المسنَدةُ لا تُحذَف — يُنهى إسنادُها أولًا، فيبقى في السجل من كانت معه ومتى.')) + '</p>';
  })();
  }};

function vehHolderOn(vid, ms){
  var hit = null;
  vehAsnAll().forEach(function(a){
    if (a.veh !== vid) return;
    var from = +a.at || 0, to = +a.end || Infinity;
    if (ms >= from && ms <= to) hit = a;
  });
  return hit;
}

function vehOnDay(ms){
  return vehList().map(function(v){
    var a = vehHolderOn(v.id, ms);
    return { veh:v, asn:a };
  }).filter(function(x){ return x.asn; });
}

function vehMismatch(){
  return vehAsnList().filter(function(a){
    var v = vehOf(a.veh);
    return v && a.kind && !vehFits(v.kind, a.kind);
  });
}

var FUP_ROWS = [

  [73,'منى','مخيم','sv'],   [74,'منى','مخيم','asn'], [75,'منى','مخيم','ins'],
  [76,'منى','مخيم','ip'],   [77,'منى','مخيم','ok'],
  [79,'عرفات','مخيم','sv'], [80,'عرفات','مخيم','asn'],[81,'عرفات','مخيم','ins'],
  [82,'عرفات','مخيم','ip'], [83,'عرفات','مخيم','ok'],
  [85,'منى','ممر','sv'],    [86,'منى','ممر','asn'],   [87,'منى','ممر','ins'],
  [88,'منى','ممر','ip'],    [89,'منى','ممر','ok'],
  [91,'عرفات','ممر','sv'],  [92,'عرفات','ممر','asn'], [93,'عرفات','ممر','ins'],
  [94,'عرفات','ممر','ip'],  [95,'عرفات','ممر','ok'],
  [97,'منى','جسر','sv'],    [98,'منى','جسر','asn'],   [99,'منى','جسر','ins'],
  [100,'منى','جسر','ip'],   [101,'منى','جسر','ok'],
  [103,'منى','محطة','sv'],  [104,'منى','محطة','asn'], [105,'منى','محطة','ins'],
  [106,'منى','محطة','ip'],  [107,'منى','محطة','ok'],
  [109,'عرفات','محطة','sv'],[110,'عرفات','محطة','asn'],[111,'عرفات','محطة','ins'],
  [112,'عرفات','محطة','ip'],[113,'عرفات','محطة','ok'],
  [115,'عرفات','بوابة','sv'],[116,'عرفات','بوابة','asn'],[117,'عرفات','بوابة','ins'],
  [118,'عرفات','بوابة','ip'],[119,'عرفات','بوابة','ok'],
  [127,'منى','كاميرا','sv','تفعيل كاميرا قائمة'],[128,'منى','كاميرا','asn','تفعيل كاميرا قائمة'],[129,'منى','كاميرا','ins','تفعيل كاميرا قائمة'],
  [130,'منى','كاميرا','ip','تفعيل كاميرا قائمة'],[131,'منى','كاميرا','ok','تفعيل كاميرا قائمة'],

  [133,'منى','كاميرا','sv','ترقية كاميرا'],  [134,'منى','كاميرا','asn','ترقية كاميرا'],
  [135,'منى','كاميرا','ins','ترقية كاميرا'], [136,'منى','كاميرا','ip','ترقية كاميرا'],
  [137,'منى','كاميرا','ok','ترقية كاميرا'],

  [158,'منى','*','dis'], [159,'عرفات','*','dis'],

  [44,'*','*','ipAll'],
  [45,'*','*','custody'],
  [160,'*','*','disJudge'],
  [161,'*','*','custBack'],
  [151,'*','*','health'],
  [154,'*','*','esc']
];

function fupPct(zone, type, stage, work){
  var mk = zone + '|' + type + '|' + stage + '|' + (work || '');
  if (FUP_MEMO && mk in FUP_MEMO) return FUP_MEMO[mk];
  var v = fupPctRaw(zone, type, stage, work);
  if (FUP_MEMO) FUP_MEMO[mk] = v;
  return v;
}
function fupPctRaw(zone, type, stage, work){

  if (stage === 'ipAll'){
    var ins = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].status === 'مُركّب'; });
    if (!ins.length) return null;
    var withIp = ins.filter(function(k){
      var x = siteFind(k); return x && x.net && x.ipRtr && x.ipRdr; }).length;
    return Math.round(withIp * 100 / ins.length);
  }
  if (stage === 'custody' || stage === 'custBack'){
    var mv = (STATE.moves || []).filter(Boolean);
    if (!mv.length) return null;
    var out = mv.filter(function(m){ return m && m.kind === 'صرف'; }).length;
    if (stage === 'custody') return out ? 100 : 0;
    var back = mv.filter(function(m){ return m && m.kind === 'إرجاع'; }).length;
    return out ? Math.min(100, Math.round(back * 100 / out)) : null;
  }
  if (stage === 'disJudge'){
    var D = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; })
      .filter(function(x){ return x && x.status === 'تم الفك'; });
    if (!D.length) return null;
    return Math.round(D.filter(function(x){ return x.cond; }).length * 100 / D.length);
  }
  if (stage === 'health'){
    var ins2 = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].approved; });
    if (!ins2.length) return null;
    return Math.round(ins2.length * 100 / Math.max(1, (STATE.sites || []).length));
  }
  if (stage === 'esc'){
    var due = (typeof escDue === 'function') ? escDue() : [];
    var open = Object.keys(STATE.fixreqs || {}).length;
    if (!open && !due.length) return null;
    return open ? Math.round((open - due.length) * 100 / open) : 100;
  }
  var L = (STATE.sites || []).filter(function(x){
    return x.zone === zone && (type === '*' || x.type === type)
      && (!work || x.work === work);
  });
  if (!L.length) return null;
  var n = 0;
  L.forEach(function(x){
    var rec = STATE.recs[x.id], ins = STATE.inss[x.id];
    if (stage === 'sv'  && svVisited(rec)) n++;
    else if (stage === 'asn' && asnOf(x.id)) n++;
    else if (stage === 'ins' && ins && ins.status === 'مُركّب') n++;
    else if (stage === 'ip'  && x.net && x.ipRtr && x.ipRdr) n++;
    else if (stage === 'ok'  && ins && ins.approved) n++;
    else if (stage === 'dis' && (STATE.diss || {})[x.id]
             && STATE.diss[x.id].status === 'تم الفك') n++;
  });
  return Math.round(n * 100 / L.length);
}

function zipRead(buf){
  var u = new Uint8Array(buf), dv = new DataView(buf), out = [], i = 0;
  while (i < u.length - 4){
    if (dv.getUint32(i, true) !== 0x04034b50) break;
    var nLen = dv.getUint16(i + 26, true), xLen = dv.getUint16(i + 28, true);
    var cSize = dv.getUint32(i + 18, true), method = dv.getUint16(i + 8, true);
    var nameB = u.subarray(i + 30, i + 30 + nLen);
    var name = new TextDecoder().decode(nameB);
    var dStart = i + 30 + nLen + xLen;
    out.push({ name:name, method:method, data:u.subarray(dStart, dStart + cSize) });
    i = dStart + cSize;
  }
  return out;
}
function zipWrite(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  function crc32(b){
    var c, t = zipWrite._t;
    if (!t){ t = zipWrite._t = []; for (var n = 0; n < 256; n++){ c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } }
    c = 0 ^ (-1);
    for (var j = 0; j < b.length; j++) c = (c >>> 8) ^ t[(c ^ b[j]) & 0xFF];
    return (c ^ (-1)) >>> 0;
  }
  files.forEach(function(f){
    var nb = enc.encode(f.name), crc = crc32(f.data);
    var h = new Uint8Array(30 + nb.length), hv = new DataView(h.buffer);
    hv.setUint32(0, 0x04034b50, true); hv.setUint16(4, 20, true);
    hv.setUint16(8, 0, true); hv.setUint32(14, crc, true);
    hv.setUint32(18, f.data.length, true); hv.setUint32(22, f.data.length, true);
    hv.setUint16(26, nb.length, true);
    h.set(nb, 30);
    parts.push(h, f.data);
    var c = new Uint8Array(46 + nb.length), cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true); cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, nb.length, true); cv.setUint32(42, off, true);
    c.set(nb, 46);
    central.push(c);
    off += h.length + f.data.length;
  });
  var cLen = central.reduce(function(a, c){ return a + c.length; }, 0);
  var e = new Uint8Array(22), ev = new DataView(e.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cLen, true); ev.setUint32(16, off, true);
  return new Blob(parts.concat(central, [e]), { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function fupExport(){
  if (!may('exportAll')){ toast(t('التصديرُ ليس من صلاحيتك')); return; }
  toast(t('يُجهَّز ملف المتابعة…'));
  fetch('docs/followup-template.xlsx').then(function(r){
    if (!r.ok) throw new Error('template ' + r.status);
    return r.arrayBuffer();
  }).then(function(buf){
    var files = zipRead(buf);
    if (!files.length) throw new Error('zip');
    var sheet = files.filter(function(f){ return f.name === 'xl/worksheets/sheet1.xml'; })[0];
    if (!sheet) throw new Error('sheet');
    var xml = new TextDecoder().decode(sheet.data), wrote = 0;

    FUP_ROWS.forEach(function(r){
      var pct = fupPct(r[1], r[2], r[3], r[4]);
      if (pct === null) return;
      var ref = 'F' + r[0];

      var re = new RegExp('(<c r="' + ref + '"[^>]*>)(?:<v>[^<]*</v>)?(</c>)');
      if (!re.test(xml)) return;
      xml = xml.replace(re, '$1<v>' + pct + '</v>$2');
      wrote++;
    });

    sheet.data = new TextEncoder().encode(xml);
    var blob = zipWrite(files);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'متابعة-أفاقي-' + todayISO() + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    logEvent('تصدير ملف المتابعة — ' + wrote + ' صفًّا');
    toast(nm(wrote) + ' ' + t('صفًّا حُدِّث — الباقي يحسبه إكسل عند الفتح'));
  }).catch(function(e){
    softErr('ملف المتابعة', e, 'تعذّر تجهيزُ ملف المتابعة — جرّب مع اتصال');
  });
}

function evPillKind(what){
  var w = String(what || '');
  if (/اعتُمد|مُنحت/.test(w)) return 'ok';
  if (/حُذف|رُفض|شُطب|سُحبت/.test(w)) return 'off';
  if (/عُدّل|تعديل|تغيير|حُدِّث/.test(w)) return 'warn';
  return 'off';
}

var EV_FETCHED = 0, EV_FETCHING = false, EV_MORE = false, EV_PAGE = 500;

function evFetch(force, mode){
  if (!FB.ready || !FB.db || EV_FETCHING) return;
  if (!force && !mode && EV_FETCHED) return;
  EV_FETCHING = true;
  var q = DB.col('events').orderBy('ts', 'desc');
  var ranged = false;
  if (mode === 'site' && /^NSK-/i.test(String(EVF.q || '').trim())){
    ranged = true; q = DB.col('events').where('site', '==', String(EVF.q).trim());
  } else if (mode === 'range' && (EVF.from || EVF.to)){
    ranged = true;
    if (EVF.to)   q = q.where('ts', '<=', Date.parse(EVF.to));
    if (EVF.from) q = q.where('ts', '>=', Date.parse(EVF.from));
  } else if (mode === 'older'){
    var oldest = evAll().reduce(function(m, e){ return (e.ts && e.ts < m) ? e.ts : m; }, Infinity);
    if (isFinite(oldest)) q = q.where('ts', '<', oldest);
  }
  q.limit(EV_PAGE).get().then(function(sn){
    if (!STATE.evlog) STATE.evlog = {};
    sn.forEach(function(dd){ STATE.evlog[dd.id] = dd.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    EV_MORE = !ranged && sn.size >= EV_PAGE;
    EV_FETCHED = Date.now(); EV_FETCHING = false;
    toast(nm(sn.size) + ' ' + t('حدثًا جُلبت') + (EV_MORE ? ' — ' + t('وثمّةَ أقدم') : ''));
    if (CUR === 'ev') render(1);
  }).catch(function(e){
    EV_FETCHING = false; EV_FETCHED = Date.now();
    softErr('جلب السجل', e, '');
  });
}

function evSiteHistory(id){ goPage('ev'); EVF = { kind:'', by:'', from:'', to:'', q:id, cat:'' }; PG_Q = id; PG_KEEP = true; render(1); evFetch(true, 'site'); }

EXP.secs = [
  ['summary','الملخّص التنفيذي — أرقامُ المشروع في ورقة',1],
  ['over','نظرة عامة',1], ['minappr','اعتماد الوزارة لإعداد التركيب',1], ['wbs','متابعة الخطة التفصيلية',1], ['wtask','متابعة المهام الأسبوعية',1], ['wtaskAll','المهام — ورقة العمل',1], ['wtmeet','محضر الاجتماع',1], ['wtsince','ما تغيّر منذ الاجتماع الماضي',1], ['pace','الوتيرة والهدف',1],
  ['chalm','التحديات — أين وما هي وما المطلوب',1], ['chalpts','نقاط التحديات — كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومعالجته (بفلتر الصفحة إن وُضع)',1], ['inst','التركيب والجدولة',1],
  ['daily','معدل التركيب اليومي — آخر ١٤ يوم',1], ['reg','حسب المشعر ونوع النقطة',1],
  ['co','حسب شركة الخدمة — الأقل إنجازًا أولًا',1],
  ['setup','المواعيد المستهدفة وأزمنة التركيب',1],
  ['pipe','سلامة خط الإنتاج — مسح ← جدولة ← تركيب',1],
  ['assign','توزيع فرق التركيب',1], ['conote','إشعار الشركات بمواعيد التركيب',1],
  ['stock','عُهدة الأجهزة — القارئات مع الفرق والمخزن',1],
  ['survey','المسح الميداني',1], ['chal','التحديات الميدانية — إفادة المشرفين',1],
  ['stuck','المتعذّر — ما لم يصل إليه الميدان',1],
  ['idle','الراكد — زيارةٌ تمّت ولم يُركَّب موقعُها',1],
  ['qa','التدقيق الهندسي — اعتماد التركيبات والسيريالات',1],
  ['sys','سلامة البيانات — المشرف العام',1], ['ev','سجل الأحداث',1],
  ['invb','المخزون والعُهدة',1], ['invmv','دفتر حركة المخزون',1],
  ['wos','الورشة — طلبات التهيئة والتجميع والتركيب',1],
  ['wday','نقاط اليوم — لكل منفِّذ عبر المراحل',1],
  ['buys','المشتريات — ما اشتُري من السوق المحلي',1],
  ['score','أداء الفنيين — نقاطهم ومستحقّهم',1],
  ['stages','أداء المراحل — فريق كل مرحلة',1],
  ['recs','المسح الميداني — كل زيارة وحالتها',1],
  ['hb','صحة الأجهزة — إنذار مبكر',1], ['dis','الفك بعد الموسم',1],
  ['vers','نسخة التطبيق على الأجهزة',1],

  ['work','وجه العمل — التوزيع والنسب',1],
  ['items','القطع والأسعار — الكتالوج كاملًا',1],
  ['crews','الطواقم ومعدلاتها اليومية',1],
  ['reps','مركز التقارير — ما يُرسَل ولمن ومتى',1],
  ['daily','الاتجاه اليومي — تسعون يومًا',1],
  ['ev','سجل الأحداث — كما هو مصفّى',1],
  ['users','المستخدمون وأدوارهم',1],
  ['notif','الإشعارات وقنواتها',1],
  ['appr','الاعتمادات — المقترح والقرار',1],
  ['ips','عناوين الشبكة',1],
  ['fleet','السيارات — الأسطول والإسناد',1],
  ['fleetCost','تكلفة الأسطول',1],
  ['fleetLog','سجل عهدة السيارات',1],
  ['ships','الشحنات والتوريد',1],
  ['roles','الأدوار والصلاحيات',1]
];

EXP.page = { summary:'over', minappr:'survey', wtsince:'wtask', wtaskAll:'wtask', wtmeet:'wtask', setup:'consts', pipe:'over', conote:'co', stock:'inv', wday:'perf', score:'perf', stages:'perf',
                 hb:'sys', vers:'sys', work:'over', items:'items', crews:'org', reps:'exec', appr:'ev', ips:'sys',
                 fleet:'fleet', fleetCost:'fleet', fleetLog:'fleet', ships:'inv', roles:'roles', invb:'inv', invmv:'inv',
                 wos:'inv', buys:'inv', notif:'ev', users:'users', recs:'survey', chal:'survey', stuck:'survey', qa:'survey',
                 chalm:'survey', chalpts:'mfu', assign:'req', inst:'over', daily:'over', pace:'over', reg:'over', dis:'dis', sys:'sys', ev:'ev', survey:'survey', co:'co', over:'over' };

var IMPORTS = [
  ['sites','المواقع', ['المعرّف','المشعر','النوع','الشاخص','المربع','الشركة','خط العرض','خط الطول'],
   'يحدّث بيانات موقع موجود بمعرّفه — ولا ينشئ مواقع جديدة.'],
  ['ips','عناوين الأجهزة', ['معرّف الموقع','بادئة الشبكة','الراوتر','القارئ','الكاميرا'],
   'البادئة تكفي: العناوين تُشتقّ منها باصطلاح ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا.'],
  ['co','الشركات', ['اسم الشركة','مواقعها','المنسّق','الجوال'],
   'الاسم الحر كان يصنع شركتين من واحدة باختلاف حرف.'],
  ['items','القطع والأسعار', ['المنطقة','اسم القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر'],
   'المنطقة إما «مخيم» أو «ممر» — وما عداهما يُرفض الصف.'],
  ['stock','توريد المخزون', ['الصنف','الكمية','المورّد','التاريخ','رقم الفاتورة'],
   'كل صف حركةُ توريدٍ تدخل الدفتر — ولا تُعدَّل بعدها بل تُوازَن بحركة.'],
  ['buys','المشتريات', ['التاريخ','الصنف','الفئة','المشعر','الكمية','سعر الوحدة','المورّد'],
   'الفئة والمورّد يجب أن يكونا من القائمتين المعتمدتين.'],
  ['fleet','السيارات', ['رقم اللوحة','النوع','الموديل','انتهاء الرخصة','الملكية','التكلفة الشهرية'],
   'اللوحةُ مفتاح: ما وُجد يُعدَّل وما لم يوجد يُنشَأ. والنوعُ من «أنواع السيارات».'],
  ['users','المستخدمون', ['المعرّف','الاسم','الدور','الحالة'],
   'يعدّل الاسمَ والدورَ والحالةَ لحسابٍ قائمٍ بمعرّفه — ولا يُنشئ حسابًا، فالإنشاءُ في المصادقة لا في القاعدة.']
];

function importCard(){
  if (!may('importAll')) return '';
  return card('استيراد من إكسل',
    '<p class="hint" style="margin:0 0 14px">'
    + esc(t('نزّل القالب، املأه، ثم ارفعه. القالب يحمل الأعمدة بأسمائها وصفًّا نموذجيًّا يُحتذى.'))
    + '</p>'
    + IMPORTS.map(function(im){
        return '<div style="border:1px solid var(--line);border-radius:var(--radius-sm);'
          + 'padding:12px 14px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'
          +   '<strong style="font-size:14px">'+esc(t(im[1]))+'</strong>'
          +   '<div class="actions">'
          +     btn('⬇ '+t('نزّل القالب'),'btn-secondary btn-sm',' data-tpl="'+im[0]+'"')
          +     '<label class="btn btn-primary btn-sm" style="cursor:pointer">⬆ '+esc(t('ارفع الملف'))
          +     '<input type="file" accept=".xlsx,.xls,.csv" data-imp="'+im[0]+'" '
          +     'style="display:none" aria-label="'+esc(t('ارفع الملف'))+'"></label>'
          +   '</div></div>'
          + '<div class="hint" style="margin:8px 0 0;font-size:12px">'
          +   '<span style="opacity:.75">'+esc(t('الأعمدة'))+':</span> '
          +   im[2].map(function(c){ return esc(t(c)); }).join(' · ')
          + '</div>'
          + '<div class="hint" style="margin:5px 0 0;font-size:11.5px">'+esc(t(im[3]))+'</div>'
          + '</div>';
      }).join('')
    + '<div style="padding:10px 0;border-top:1px solid var(--line)">'
    + '<b>' + esc(t('تقرير كاميرات الوزارة')) + '</b>'
    + '<div class="hint" style="margin:4px 0 8px;font-size:12px">' + esc(t('ارفع ملفَّ الوزارة كما هو (MOHU CPE AND CAMERA REPORT) — يُطابَق بالنقاط عمودًا عمودًا، وتظهر العناوينُ في نافذة كلِّ كاميرا لمن دخل التطبيق فقط. كلمةُ المرور لا تُحفَظ.')) + '</div>'
    + '<input type="file" accept=".xlsx,.xls" data-imp="mohu" aria-label="' + esc(t('تقرير كاميرات الوزارة')) + '">'
    + '</div>'
    + (IMP_PREVIEW ? impPreviewCard() : '')
    + '<div class="alert info" style="margin:14px 0 0"><span>'
    + esc(t('الرفع يعرض معاينةً قبل الحفظ: كم صفًّا سيُقبل وكم سيُرفض ولماذا — ولا يُكتب شيء قبل موافقتك.'))
    + '</span></div>');
}

function impPreviewCard(){
  var p = IMP_PREVIEW;
  var nm2 = p.kind === 'mohu' ? 'تقرير كاميرات الوزارة' : (IMPORTS.filter(function(i){ return i[0] === p.kind; })[0] || ['',''])[1];
  return card(t('معاينة ما رُفع') + ' — ' + t(nm2),
      (p.missing.length
        ? alertBox('error','أعمدةٌ ناقصةٌ في الملف: ' + p.missing.join(' · ') + ' — نزّل القالب واملأه.')
        : '')
    + stats([['سيُقبل', N(p.ok.length), 'ok'], ['سيُرفض', N(p.bad.length), p.bad.length?'bad':''],
             ['الأعمدة', N(p.head.length)], ['الناقص', N(p.missing.length), p.missing.length?'bad':'']])
    + (p.bad.length
        ? table(['الصف','السبب','أول قيمة'],
            p.bad.slice(0, 12).map(function(b){
              return ['<span class="num">' + nm(b.row) + '</span>', pill(b.why,'off'),
                      '<span class="hint" style="margin:0">' + esc(String(b.data[0]||'—')).slice(0,40) + '</span>'];
            }))
        : '')
    + '<div class="actions" style="margin-top:12px">'
    + (p.ok.length && !p.missing.length
        ? btn('احفظ ' + nm(p.ok.length) + ' صفًّا','btn-primary',' data-impgo="1"') : '')
    + btn('إلغاء','btn-secondary',' data-impx="1"') + '</div>');
}

function repcenterBody(){ return (function(){
    if (EXP.repSide === 'sched'){
      return '<div class="chips">' + repChips() + '</div>' + (function(){
    return card('الدوريات',
        table(['الدورية','متى تُرسَل','الوقت','تقارير'],
          PERIODS.map(function(p){
            var n = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; }).length;
            return [pill(p[1],'acc'), '<span class="hint" style="margin:0">' + esc(t(p[2])) + '</span>',
                    '<input type="time" data-crtime="' + p[0] + '" value="'
                      + ((CFG.crTime && CFG.crTime[p[0]]) || (p[0]==='day'?'17:00':'07:00'))
                      + '" style="max-width:130px">',
                    N(n)];
          })),
        btn('حفظ المواعيد','btn-primary btn-sm',' data-crsave="1"'))
      + alertBox('warn',
          t('الإرسالُ التلقائيُّ في الموعد يحتاج خادمًا مجدولًا — لم يُبنَ بعد. الأوقاتُ تُحفَظ الآن، والتقريرُ نفسُه يُصدَّر يدويًّا في «مركز التقارير».'))
      + PERIODS.map(function(p){
          var L = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; });
          return cardFlush(t(p[1]) + ' — ' + nm(L.length),
            table(['التقرير','لمن','ما يحويه',''],
              L.map(function(r){
                return ['<strong>' + esc(t(r[0])) + '</strong>', pill(r[2],'info'),
                        '<span class="hint" style="margin:0">' + esc(t(r[3])) + '</span>',
                        '<div class="actions">'
                        + '<button type="button" class="btn btn-quiet btn-sm" data-p="reps">'
                        + esc(t('في مركز التقارير')) + '</button></div>'];
              })));
        }).join('')
      + card('قناة الإرسال',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الوسيلة')) + '</label>'
          + '<select><option value="داخل التطبيق">' + esc(t('داخل التطبيق')) + '</option><option value="واتساب">' + esc(t('واتساب')) + '</option><option value="الاثنان">' + esc(t('الاثنان')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('لغة التقرير')) + '</label>'
          + '<select><option>العربية</option><option>English</option><option>اردو</option></select></div>'
          + '</div>')
      + '<p class="hint">' + esc(t('التقرير يُبنى من الأرقام نفسها التي على الشاشة — فلا يفترق تقريرٌ عن لوحة.')) + '</p>';
      })();
    }
    var list = REPORTS.filter(function(r){ return r.side === EXP.repSide; });
    var pers = {};
    REPORTS.forEach(function(r){ pers[r.per] = (pers[r.per] || 0) + 1; });

    return '<div class="chips">' + repChips() + '</div>'

      + stats([['تقارير معرَّفة', N(REPORTS.length), 'acc'],
               ['يومية', N(pers['يومي'] || 0)],
               ['أسبوعية', N(pers['أسبوعي'] || 0)],
               ['شهرية', N(pers['شهري'] || 0)]])

      + list.map(function(r){
          var ready = r.sheets.filter(function(s){ return SHEETS[s]; });
          return card(r.i + ' ' + t(r.n),
            '<div class="pop-rows" style="margin:0">'
            + '<div><span class="k">' + esc(t('إلى')) + '</span><span>' + esc(t(r.to)) + '</span></div>'
            + '<div><span class="k">' + esc(t('الدورية')) + '</span><span>'
            +   pill(r.per, r.per==='يومي'?'acc':'') + '</span></div>'
            + '<div><span class="k">' + esc(t('موعده')) + '</span><span>' + esc(t(r.when)) + '</span></div>'
            + '<div><span class="k">' + esc(t('محتواه')) + '</span><span>' + esc(t(r.what)) + '</span></div>'
            + '<div><span class="k">' + esc(t('صيغته')) + '</span><span>' + esc(t(r.how)) + '</span></div>'
            + '<div><span class="k">' + esc(t('أوراقه')) + '</span><span>'
            +   ready.map(function(s){ return '<span class="pill">' + esc(t(SHEET_NAMES[s] || s)) + '</span>'; }).join(' ')
            +   '</span></div>'
            + '</div>',
            '<div class="actions">'
            + (may('exportAll') ? btn('⬇ ولّد التقرير','btn-primary btn-sm',' data-repgo="' + esc(r.id) + '"') : '')
            + btn('🖨 PDF','btn-secondary btn-sm',' data-print="1"')
            + '</div>');
        }).join('')

      + card('حزمةُ الجهة كاملةً',
          '<p class="hint" style="margin:0 0 12px">'
          + esc(t('كلُّ تقارير هذه الجهة في ملفٍّ واحدٍ بأوراقه — للأرشيف أو للمراجعة.'))
          + '</p>',
          may('exportAll')
            ? btn('📦 حزمة ' + (EXP.repSide==='co' ? t('الشركة') : t('الوزارة')),
                  'btn-primary',' data-reppack="' + EXP.repSide + '"')
            : '');
  })(); }
PAGE.exp = { m:'الأدوات', t:'التصدير والتقارير', l:'ما يخرج من النظام وما يدخل إليه — ومركزُ التقارير بدورياته.',
  body:function(){ var head = tabHead('exp'), cur = tabCur('exp'); return head + (cur === 'repcenter' ? repcenterBody() : PAGE.exp.body0()); },
  body0:function(){
    return regCard()
      + card('ملف متابعة المشروع — بقالبه',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('يُنزَّل الملفُ بقالبه كما هو — بتنسيقه الشرطيِّ وتعليقاتِه ومعادلاتِه — ولا يُكتَب فيه إلا نسبةُ الإنجاز في الصفوف الميدانية. والحالةُ والموقفُ الزمنيُّ والمتبقي يحسبها إكسلُ بنفسه عند الفتح.'))
        + '</p>'
        + '<div class="pop-rows" style="margin:0">'
        +   (function(){
              var done = 0, all = 0;
              FUP_ROWS.forEach(function(r){
                var p = fupPct(r[1], r[2], r[3], r[4]);
                if (p === null) return;
                all++; if (p > 0) done++;
              });
              return '<div><span class="k">' + esc(t('صفوفٌ يقرؤها النظام')) + '</span><span>'
                + nm(all) + ' ' + esc(t('من')) + ' ' + nm(FUP_ROWS.length) + '</span></div>'
                + '<div><span class="k">' + esc(t('فيها تقدّم')) + '</span><span>' + nm(done) + '</span></div>';
            })()
        + '</div>',
        btn('⬇ ملف المتابعة — محدَّثًا','btn-primary btn-sm',' data-fup="1"'))
      + card('تصدير تقرير اللوحة',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('تسعةٌ وعشرون قسمًا قابلة للاختيار — إكسل ورقةً لكل قسم، أو PDF صفحةً لكل قسم برسمها.'))
        + '</p>'
        + '<div class="actions">'
        + btn('اختر الأقسام','btn-primary',' data-exp="1"')
        + btn('⬇ إكسل — الكل','btn-secondary',' data-xls="*"')
        + btn('🖨 PDF — الكل','btn-secondary',' data-print="1"')
        + '</div>')
      + card('تصديرات جاهزة',
          '<div class="actions">'
          + btn('🌍 KMZ — منى وعرفات','btn-secondary',' data-kmz="main"')
          + btn('🌍 KMZ — ' + t('الكل') + ' ' + nm((STATE.sites || []).length) + ' ' + t('نقطة'),'btn-secondary',' data-kmz="all"')
          + btn('🌍 KMZ — إعادة تركيب ١٤٤٧','btn-secondary',' data-kmz="redo"')
          + btn('⬇ إكسل — المواقع','btn-secondary',' data-xls="sites"')
          + btn('⬇ إكسل — الشركات','btn-secondary',' data-xls="co"')
          + btn('⬇ إكسل — حركة المخزون','btn-secondary',' data-xls="invmv"')
          + btn('⬇ إكسل — أداء الفنيين','btn-secondary',' data-xls="techx"')
          + '</div>')
      + kmiCard()
      + importCard();
  }};

function pmToggle(col, op, role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (pmLocked(col, op, role)){ toast(t('ثابتٌ في القاعدة لا يُفتَح من هنا')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  PM_DRAFT[col] = PM_DRAFT[col] || {}; PM_DRAFT[col][role] = PM_DRAFT[col][role] || {};
  var ov = pmOverride(col, op, role);

  PM_DRAFT[col][role][op] = (ov === null) ? !pmDefault(col, op, role) : null;
  render(1);
}

function pmSave(){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return false; }
  if (!PM_DRAFT){ toast(t('لا تغييرَ يُحفَظ')); return false; }
  var m = PM_DRAFT, changed = 0;
  Object.keys(m).forEach(function(c){ Object.keys(m[c]).forEach(function(r){ Object.keys(m[c][r]).forEach(function(o){
    var v = m[c][r][o]; if (v === true || v === false) changed++;
  }); }); });
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc;
  CORE.set('cfg', 'perms', doc);
  PM_DRAFT = null;
  logEvent('مصفوفة صلاحيات القاعدة — ' + nm(changed) + ' خليةً معدَّلة · نسخة ' + nm(doc.v));
  toast(t('حُفظت — تنفذ في القاعدة الآن') + ' \u00b7 ' + nm(changed) + ' ' + t('خليةً معدَّلة'));
  render(1);
  return true;
}
function pmResetRole(role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  Object.keys(PM_DRAFT).forEach(function(c){
    if (PM_DRAFT[c][role]) Object.keys(PM_DRAFT[c][role]).forEach(function(o){ PM_DRAFT[c][role][o] = null; });
  });
  render(1);
}

function roleAdd(name, base, rank){
  if (!may('roles')){ toast(t('إضافةُ الأدوار لمدير المشروع وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسمَ الدور')); return false; }
  if (BASE_ROLES.indexOf(base) < 0){ toast(t('اختر الأساسَ من الأدوار الأساسية')); return false; }
  if (Object.keys(ROLES).some(function(k){ return ROLES[k].n === name; })){ toast(t('اسمُ الدور مستعملٌ من قبل')); return false; }
  var rk = cfgN(rank); if (!rk) rk = rankOf(base);
  if (rk > rankOf(ROLE)){ toast(t('لا تُنشئ دورًا أعلى من رتبتك')); return false; }
  var key = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  CFG.roles = CFG.roles || { r:{} }; CFG.roles.r = CFG.roles.r || {};
  CFG.roles.r[key] = { n:name, base:base, rank:rk, at:Date.now(), by:STATE.meta.name || '' };
  CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  rolesApply();
  logEvent('دور جديد — ' + name + ' · ' + t('يرث') + ' ' + ROLES[base].n + ' · ' + t('رتبة') + ' ' + nm(rk));
  toast(t('أُضيف الدور') + ' ' + name + ' — ' + t('تنفذ في القاعدة الآن'));
  render(1);
  return key;
}
function roleDel(k){
  if (!may('roles')){ toast(t('حذفُ الأدوار لمدير المشروع وحده')); return false; }
  if (!ROLES[k] || !ROLES[k].custom){ toast(t('الأدوارُ الأساسيةُ لا تُحذَف')); return false; }
  var nU = roleUsers(k);
  if (nU){ toast(t('لا يُحذَف دورٌ عليه حسابات') + ' — ' + nm(nU)); return false; }
  var nm2 = ROLES[k].n;
  delete CFG.roles.r[k]; CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  if (CFG.roleCaps && CFG.roleCaps[k]){ delete CFG.roleCaps[k]; CORE.set('cfg', 'roleCaps', CFG.roleCaps); }
  rolesApply();
  logEvent('حذف دور — ' + nm2);
  toast(t('حُذف الدور') + ' ' + nm2);
  render(1);
  return true;
}

function pmSetDirect(col, op, role, val){
  var m = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  m[col] = m[col] || {}; m[col][role] = m[col][role] || {}; m[col][role][op] = !!val;
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc; PM_DRAFT = null;
  CORE.set('cfg', 'perms', doc);
}

function tabsInit(){
  Object.keys(TABS).forEach(function(pid){
    TABS[pid].forEach(function(tb){ PARENT[tb[0]] = pid; });
  });
}
tabsInit();


/* end of app-office.js */
if (typeof nskChunkReady === 'function') nskChunkReady();
