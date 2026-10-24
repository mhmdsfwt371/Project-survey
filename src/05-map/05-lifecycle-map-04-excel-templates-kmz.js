/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-04-excel-templates-kmz.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Current page to Excel, the tasks file from a template, and KMZ/KML import.
   DEFINES : lsGet, lsSet, jszipLoad, geoM, nameKey, nameLike, unzipKml, kmlPlaces, kmiClassify, kmiImport
   GLOBALS : JSZIP_LOADING, KMZ_STY, KMI, KMI_NEAR
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ إكسلُ الصفحة الحالية كاملةً ═══
   «صفحةٌ فيها مئةُ سجلٍّ في عشرِ صفحاتٍ — عايز إكسل بكلِّ اللي فيها مرةً واحدة».
   الصفحاتُ تُقصُّ للعرض (slice(0,n) و«عرض المزيد») لا للبيانات؛ فتُعاد
   بناءُ الصفحة في عنصرٍ منفصلٍ وكلُّ قصٍّ للعرض معطَّلٌ (EXP.xlsAll)، ثم يُقرأ كلُّ
   جدولٍ فيها ورقةً باسم بطاقته — فيخرج ما في الصفحة كلُّه، لا ما تراه العين. */
EXP.xlsAll = false;
/* التخزينُ المحليُّ قد يكون معطَّلًا (تصفّحٌ خاصّ) — يُلتقَط ويُذكَر مرةً */
/* (V38.55) LS_ERR is an accessor defined at the top of the core (01-core boot) — every swallowed error is recorded */
function lsGet(k){ try { return localStorage.getItem(k); } catch (e){ LS_ERR = e; return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch (e){ LS_ERR = e; return false; } }


/* ═══ ملفُّ المهام: كان يُبنى ورقةً ورقةً بمكتبة إكسل المجانية (V17.19) —
   فلا أنماطَ ولا جدولَ ولا تنسيقاتٍ شرطية، ومعادلاتُ النصِّ بنوعٍ يرفضه
   إكسل. أُزيل ذلك كلُّه في V17.36 لصالح القالب أدناه: الملفُّ الأصليُّ يُملأ. */
/* ═══ الملفُّ نفسُه: قالبٌ يُملأ لا ورقةٌ تُبنى (V17.36) ═══
   بناءُ الورقة من الصفر بمكتبة إكسل المجانية لا يكتب الألوانَ ولا الحدودَ
   ولا الجدولَ المنسَّق ولا التنسيقاتِ الشرطية — وكتب معادلاتِ النصِّ بنوعٍ
   خاطئٍ فرفضها إكسل وأصلحها بحذفها. فصار الملفُّ الأصليُّ نفسُه قالبًا: يُفتَح
   كما هو (بأنماطه وجدوله ولوحته ومعادلاته)، وتُستبدَل صفوفُ البيانات وحدَها
   بصفوفٍ تحمل أنماطَ صفِّه الأوّل ومعادلاتِه، ويُمَدُّ الجدولُ إلى آخر صف،
   ويُطلَب من إكسل إعادةُ الحساب عند الفتح. فما يخرج هو ملفُّ المكتب بعينه
   وفيه بياناتُ النظام. */
var JSZIP_LOADING = null;
function jszipLoad(){
  if (typeof JSZip !== 'undefined') return Promise.resolve(true);
  if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز الملف…'));   /* (V38.86) the first load and every press during it say so */
  if (JSZIP_LOADING) return JSZIP_LOADING;
  JSZIP_LOADING = libLoad('vendor/jszip/3.10.1/jszip.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 15000)   /* (V38.54) */
    .then(function(ok){ ok = !!(ok && typeof JSZip !== 'undefined'); if (!ok) setTimeout(function(){ JSZIP_LOADING = null; }, 60000); return ok; });
  return JSZIP_LOADING;
}


var KMZ_STY = {
  'مخيم':'camp', 'ممر':'cor', 'كاميرا':'cam', 'محطة':'stn',
  'جسر':'jam', 'بوابة':'gte', 'مبنى':'bld'
};


/* ═══ استيرادُ KMZ/KML ═══
   يجيء الملفُّ من Google Earth: `doc.kml` مضغوطًا، وفيه Placemark لكلِّ نقطةٍ
   باسمٍ ووصفٍ وإحداثيات. والخطرُ في الاستيراد ليس القراءةَ بل **التكرار**:
   نقطةٌ تُضاف مرتين تُمسَح مرتين وتُركَّب مرتين وتُحسَب مرتين في تقرير
   الوزارة. والاسمُ لا يصلح ميزانًا — أسماءُ المخيمات تتكرّر في منى («مخيم ٤»
   في مربعاتٍ شتّى)، وقد تُغيَّر الأسماءُ من الوزارة. **فالمسافةُ هي الميزان**:
   خمسةَ عشرَ مترًا فأقلُّ = النقطةُ نفسُها مهما اختلف الاسم؛ وما بين خمسةَ
   عشرَ وخمسةٍ وسبعين مع اسمٍ يشبه = مشكوكٌ فيه يُعرَض ولا يُقرَّر؛ وما فوق
   ذلك جديدٌ يُضاف بمعرِّفٍ من نظامنا. ولا يُكتَب شيءٌ قبل المعاينة. */
var KMI = null, KMI_ZONE = 'منى', KMI_TYPE = 'مخيم', KMI_WORK = 'موقع جديد', KMI_BUSY = false;
var KMI_NEAR = 15, KMI_DOUBT = 75;

/* المسافةُ بالمتر — هافرساين مبسَّطٌ يكفي في نطاق المشاعر */
function geoM(a1, o1, a2, o2){
  var R = 6371000, p1 = a1 * Math.PI / 180, p2 = a2 * Math.PI / 180;
  var dp = (a2 - a1) * Math.PI / 180, dl = (o2 - o1) * Math.PI / 180;
  var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/* تشابهُ الاسم: بعد تجريده من الزخرفة والأرقام العربية */
function nameKey(s2){
  return String(s2 || '').replace(/[\u064B-\u0652\u200f\u200e]/g, '')
    .replace(/[٠-٩]/g, function(c){ return String(c.charCodeAt(0) - 0x0660); })
    .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9]+/g, ' ').trim().toLowerCase();
}
function nameLike(a, b){
  var x = nameKey(a), y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.indexOf(y) > -1 || y.indexOf(x) > -1;
}
/* فكُّ الضغط: مدخلاتٌ مخزونةٌ أو منكمشةٌ — والمتصفّحُ يفكُّ الثانيةَ بنفسه */
function unzipKml(buf){
  var u8 = new Uint8Array(buf), dv = new DataView(buf);
  var files = [];
  for (var i = 0; i + 4 < u8.length; i++){
    if (dv.getUint32(i, true) !== 0x04034b50) continue;
    var method = dv.getUint16(i + 8, true), csize = dv.getUint32(i + 18, true);
    var nlen = dv.getUint16(i + 26, true), elen = dv.getUint16(i + 28, true);
    var name = new TextDecoder().decode(u8.subarray(i + 30, i + 30 + nlen));
    var start = i + 30 + nlen + elen;
    if (!/\.kml$/i.test(name) || !csize) continue;
    files.push({ name:name, method:method, bytes:u8.subarray(start, start + csize) });
  }
  if (!files.length) return Promise.resolve(null);
  var f2 = files.filter(function(x){ return /doc\.kml$/i.test(x.name); })[0] || files[0];
  if (f2.method === 0) return Promise.resolve(new TextDecoder().decode(f2.bytes));
  /* ═══ فكُّ الضغط بمسارين (V17.56) ═══
     الأصلُ DecompressionStream وهو في المتصفّحات الحديثة؛ وما دونها كان
     يُرَدُّ فارغًا فيُقال «تعذّرت قراءةُ الملف» بلا سبب — والملفُّ سليم.
     فصار له بديلٌ: مكتبةُ الضغط نفسُها التي يستعملها تصديرُ إكسل. */
  if (typeof DecompressionStream === 'function'){
    try {
      var ds = new DecompressionStream('deflate-raw');
      var st = new Blob([f2.bytes]).stream().pipeThrough(ds);
      return new Response(st).text();
    } catch (e){ LS_ERR = e; }
  }
  return jszipLoad().then(function(ok){
    if (!ok || typeof JSZip === 'undefined') return null;
    return JSZip.loadAsync(buf).then(function(zip){
      var name = Object.keys(zip.files).filter(function(k){ return /\.kml$/i.test(k); });
      var pick = name.filter(function(k){ return /doc\.kml$/i.test(k); })[0] || name[0];
      return pick ? zip.file(pick).async('string') : null;
    });
  }).catch(function(e){ LS_ERR = e; return null; });
}
/* قراءةُ الأماكن — Point أوّلًا، وللمضلّع والخطِّ يُؤخَذ مركزُه */
function kmlPlaces(xml){
  var doc = new DOMParser().parseFromString(xml, 'text/xml');
  var pms = doc.getElementsByTagName('Placemark'), out = [];
  var txt = function(el, tag){
    var n2 = el.getElementsByTagName(tag)[0];
    return n2 ? String(n2.textContent || '').trim() : '';
  };
  for (var i = 0; i < pms.length; i++){
    var pm = pms[i];
    /* مُصدِّرُنا يكتب <n> وGoogle Earth يكتب <name> — يُقبلان */
    var nm2 = txt(pm, 'name') || txt(pm, 'n');
    var desc = txt(pm, 'description');
    var cs = pm.getElementsByTagName('coordinates')[0];
    if (!cs) continue;
    var raw = String(cs.textContent || '').trim().split(/\s+/).filter(Boolean);
    var lat = 0, lng = 0, shape = 'point';
    if (raw.length === 1){
      var p1 = raw[0].split(','); lng = +p1[0]; lat = +p1[1];
    } else {
      shape = pm.getElementsByTagName('Polygon').length ? 'polygon' : 'line';
      var sx = 0, sy = 0, k = 0;
      raw.forEach(function(r){ var p2 = r.split(','); if (isFinite(+p2[0]) && isFinite(+p2[1])){ sx += +p2[0]; sy += +p2[1]; k++; } });
      if (k){ lng = sx / k; lat = sy / k; }
    }
    if (!isFinite(lat) || !isFinite(lng) || (!lat && !lng)) continue;
    /* حقولٌ إضافيةٌ إن كتبها الملفُّ — تُقرأ ولا تُخترَع */
    var ext = {}, ds2 = pm.getElementsByTagName('Data');
    for (var j = 0; j < ds2.length; j++){
      var k2 = ds2[j].getAttribute('name') || '', v2 = txt(ds2[j], 'value');
      if (k2) ext[k2] = v2;
    }
    var pick = function(re){
      var m2 = re.exec(desc || ''); if (m2) return String(m2[1]).trim();
      var kk = Object.keys(ext).filter(function(x){ return re.test(x + ':'); })[0];
      return kk ? ext[kk] : '';
    };
    out.push({ name:nm2 || '', desc:desc, lat:lat, lng:lng, shape:shape,
               sign:pick(/شاخص\s*[:：]?\s*([^<\n]{1,40})/), sq:pick(/مربع\s*[:：]?\s*([^<\n]{1,20})/),
               co:pick(/شركة\s*[:：]?\s*([^<\n]{1,60})/) });
  }
  return out;
}
/* التصنيف: موجودةٌ · مشكوكٌ فيها · جديدة */
function kmiClassify(places){
  var S = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng; });
  return places.map(function(p){
    var best = null, bestD = 1e9;
    S.forEach(function(x){
      var d = geoM(p.lat, p.lng, +x.lat, +x.lng);
      if (d < bestD){ bestD = d; best = x; }
    });
    var st = 'new';
    if (best && bestD <= KMI_NEAR) st = 'same';
    else if (best && bestD <= KMI_DOUBT && nameLike(p.name, best.name || best.id)) st = 'doubt';
    return { p:p, near:best, d:bestD, st:st, take:(st === 'new') };
  });
}
function kmiImport(file){
  if (!may('edit')){ toast(t('الاستيراد لمن يكتب في الميدان')); return; }
  KMI_BUSY = true; render(1);
  var fr = new FileReader();
  fr.onload = function(){
    var buf = fr.result;
    var isZip = new Uint8Array(buf, 0, 2)[0] === 0x50 && new Uint8Array(buf, 0, 2)[1] === 0x4B;
    (isZip ? unzipKml(buf) : Promise.resolve(new TextDecoder().decode(buf))).then(function(xml){
      KMI_BUSY = false;
      if (!xml){ toast(t('تعذّرت قراءةُ الملف — تأكّد أنه KMZ أو KML')); render(1); return; }
      var places = kmlPlaces(xml);
      if (!places.length){ toast(t('لا نقاطَ في الملف')); render(1); return; }
      KMI = { rows:kmiClassify(places), file:file.name || '' };
      logEvent('معاينةُ استيراد KMZ — ' + places.length + ' نقطة');
      render(1);
    }).catch(function(e){ KMI_BUSY = false; softErr('استيراد KMZ', e, 'تعذّرت قراءةُ الملف'); render(1); });
  };
  fr.readAsArrayBuffer(file);
}


