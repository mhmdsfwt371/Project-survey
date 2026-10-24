/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-07-report-lines-hybrid-google.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-07-report-lines-hybrid-google.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : fontMime, fontsLoad, fontsFace, basemapRemove, kmzExport, impTemplate
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function fontMime(n){ n = String(n || '').toLowerCase(); return /\.woff2$/.test(n) ? ['font/woff2', 'woff2'] : /\.woff$/.test(n) ? ['font/woff', 'woff'] : /\.ttf$/.test(n) ? ['font/ttf', 'truetype'] : ['font/otf', 'opentype']; }

function fontsLoad(){
  if (CFG.fonts && CFG.fonts.r) return Promise.resolve(CFG.fonts);
  if (!(typeof FB === 'object' && FB.db && FB.db.collection)) return Promise.resolve(null);
  return Promise.race([
    DB.col('settings').doc('fonts').get().then(function(d){ if (d && d.exists){ CFG.fonts = Object.assign({}, d.data()); } return CFG.fonts || null; }),
    new Promise(function(res){ setTimeout(function(){ res(null); }, 3500); })
  ]).catch(function(){ return null; });
}

function fontsFace(F){
  if (!F || !F.r) return '';
  var face = function(b64, name, w){ var m = fontMime(name); return '@font-face{font-family:"Abar Mid";font-weight:' + w + ';src:url(data:' + m[0] + ';base64,' + b64 + ') format("' + m[1] + '")}'; };
  return face(F.r, F.rn, 400) + (F.b ? face(F.b, F.bn, 700) : '');
}

function basemapRemove(){
  return caches.open(BASEMAP_CACHE).then(function(c){ return Promise.all([BASEMAP_FILE].concat(BASEMAP_JS).map(function(u){ return c.delete(u); })); }).then(function(){ BASEMAP.have = false; if (BASEMAP.layer && MAP){ try { MAP.removeLayer(BASEMAP.layer); } catch (e){ LS_ERR = e; } BASEMAP.layer = null; } BASEMAP.arc = null; basemapSwap(); toast(t('أُزيلت خريطةُ المشاعر من الجهاز')); render(1); });
}

function kmzExport(kind){
  var f = null, title = 'أفاقي — قارئات بطاقة نسك ١٤٤٨هـ', name = 'nusuk.kmz';
  if (kind === 'main'){
    f = function(x){ return x.zone === 'منى' || x.zone === 'عرفات'; };
    title = 'أفاقي — منى وعرفات · ١٤٤٨هـ'; name = 'nusuk-mina-arafat.kmz';
  } else if (kind === 'co'){
    f = function(x){ return !CO_SEL.length || CO_SEL.indexOf(x.co) > -1; };
    title = 'أفاقي — بلون الشركة'; name = 'nusuk-companies.kmz';
  } else if (kind === 'redo'){
    f = function(x){ return x.work === 'إعادة تركيب ١٤٤٧'; };
    title = 'أفاقي — إعادة تركيب ١٤٤٧'; name = 'nusuk-redo-1447.kmz';
  } else if (kind === 'sel'){
    f = function(x){ return SEL_IDS.indexOf(x.id) > -1; };
    title = 'أفاقي — المحدَّد'; name = 'nusuk-selected.kmz';
  }
  var b = kmzBuild(f, title);
  if (!b.count){ toast('لا نقاط في هذا التحديد'); return false; }
  var zip = zipStore('doc.kml', new TextEncoder().encode(b.xml));
  var ok = dl(new Blob([zip], { type:'application/vnd.google-earth.kmz' }), name);
  toast(ok ? (nm(b.count) + ' ' + t('نقطةً في الملف')) : 'تعذّر التنزيل');
  return ok;
}

function impTemplate(kind){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast('تعذّر تحميل محرّك إكسل'); return false; }
    var cols = IMP_COLS[kind] || [];
    var rows = [cols];
    /* صفٌّ نموذجيٌّ من بياناتٍ حقيقيةٍ يُحتذى */
    if (kind === 'sites' && STATE.sites.length){
      var x = STATE.sites[0];
      rows.push([x.id, x.zone, x.type, x.sign, x.sq, x.co, x.lat, x.lng]);
    } else if (kind === 'items' && DATA.items.length){
      var i = DATA.items[0];
      rows.push([i[0]==='cor'?'ممر':'مخيم', i[2], itPts(i[1]), itPrep(i[1]), itAsm(i[1]), itPrice(i[1])]);
    } else if (kind === 'ips' && STATE.sites.length){
      rows.push([STATE.sites[0].id, '10.20.30', '.1', '.2', '.3']);
    } else {
      rows.push(cols.map(function(){ return ''; }));
    }
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = cols.map(function(c){ return { wch:Math.max(14, c.length + 4) }; });
    XLSX.utils.book_append_sheet(wb, ws, 'القالب');
    XLSX.writeFile(wb, 'قالب-' + kind + '.xlsx');
    return true;
  });
}
