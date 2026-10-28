/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-01-site-edit-twins.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Site rows from the registry (siteRow/loadSites), zone-of-type rules, editing site data without a visit (override layer), bulk data corrections, twin points on one coordinate, permanent delete.
   DEFINES : siteZone, siteRow, loadSites, maySiteEdit, maySiteEditBasic, siteOvApply, dqFar, dqDupPos, siteKeyOf, twinOf, dqNoCo, dqNoSign … (+9 more)
   GLOBALS : SITE_ED, SITE_DEL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ منطقةُ الصنف من نوع الموقع — مسطرةٌ واحدةٌ لا ثلاث ═══
   الكتالوجُ منطقتان فقط: `camp` و`cor`. وكان كلُّ موضعٍ يقرّر بنفسه
   بشرطٍ مكرَّر: «إن كان ممرًّا فcor وإلا camp» — فوقعت مئتان وخمسُ نقاطٍ
   (كاميرا ومحطةُ قطارٍ وبوابةُ مسجدٍ ودورُ جمرات) في خانة «مخيم» بلا
   قصد: تُسعَّر بوزن المخيم، ويُعرَض عليها قطعُ المخيمات في نموذج التركيب.
   والحقيقةُ الميدانية أن جميعها نقاطُ عبورٍ مكشوفةٌ على إطارٍ معدني —
   أقربُ إلى الممر منها إلى المخيم بكلِّ مقياس. */
function siteZone(x){ return (x && x.type === 'مخيم') ? 'camp' : 'cor'; }


/* (V39.5) a missing value in the source plan reached the screens as the English word «Null» («مربع Null») — read as
   unknown: «مربع ؟» in the name, and no square */
function siteRow(r, camp){
  var nul = function(v){ return /^null$/i.test(String(v == null ? '' : v).trim()) ? '' : v; };
  return {
    id:r[0], name:String(r[1] == null ? '' : r[1]).replace(/\bNull\b/g, '\u061F'),
    zone:zoneOf(SITES_RAW.z[r[2]] || '', r[1] || ''), type:(SITES_RAW.t[r[3]] || ''),
    work:(SITES_RAW.w[r[4]] || ''),
    lat:r[5], lng:r[6],
    sq:nul(r[7]) || '', sign:nul(r[8]) || '', co:nul(r[9]) || '',
    /* المصفوفتان تفترقان بعد العمود التاسع: المخيمُ يحمل بادئةَ شبكته
       في العاشر ثم المنطقةَ والتصنيف، والنقطةُ تحمل المنطقةَ ثم الحالة.
       وقراءتُهما بمسطرةٍ واحدةٍ جعلت حالةَ ألفٍ وثلاثمئةٍ واثنين وتسعين
       مخيمًا «منطقة عرفات»، وضيّعت بادئةَ الشبكة التي تُشتقّ منها العناوين. */
    net:    camp ? (r[10] || '') : '',
    region: camp ? (r[11] || '') : (r[10] || ''),
    fstat:  camp ? 'لم يبدأ'     : (r[11] || 'لم يبدأ'),
    inout:  r[12] || ''
  };
}

function loadSites(){
  var out = [];
  SITES_RAW.g.forEach(function(r){ out.push(siteRow(r, true)); });
  SITES_RAW.p.forEach(function(r){ out.push(siteRow(r, false)); });
  STATE.sites = out;
  siteOvApply();
  return out;
}
/* ═══ بياناتُ النقطة تُعدَّل بلا زيارة ═══
   كان تعديلُ اسمِ نقطةٍ أو شاخصها لا يمرُّ إلا بنموذج المسح — فيُكتَب سجلُّ
   زيارةٍ وتصير «تمت الزيارة» وهي لم تُزَر. وأزرارُ «تعديل» في التفاصيل كانت
   تقول «يمرُّ باعتماد المهندس» ولا تفعل شيئًا. صار المهندسُ فما فوق يعدّل
   البياناتِ الأساسيةَ في مكانها: تُكتَب طبقةً فوق النقطة المضمَّنة في مجموعة
   sites (كما تُكتَب عناوينُ الشبكة) وتُحفَظ محليًّا فتصمد بلا شبكة. والإخفاءُ
   بدل المحو: النقطةُ من الوزارة، فتُخفى وتُستعاد — ولا تُخفى نقطةٌ لها سجلّ. */
PV.SITE_ED = 0; PV.SITE_HIDE = '';
function maySiteEdit(){ return typeof ROLE !== 'undefined' && rankOf(ROLE) >= rankOf('engineer'); }
/* (V28.6) قرارُ المالك: «صلاحيةُ المشرف كبّرها — ما يرجعوش في كلِّ كبيرةٍ وصغيرةٍ للمهندس». البياناتُ الأساسيةُ للنقطة (الاسم والمربع
   والشاخص ووجهُ العمل والشركة والداخل/الخارج والبوابة والدور والإحداثيات) يعدّلها المشرف؛ والتصنيفُ (المشعرُ والنوعُ والمنطقة)
   والإخفاءُ يبقيان للمهندس. القاعدةُ تقبل (sites: كتابةٌ لمن يعمل). */
function maySiteEditBasic(){ return typeof ROLE !== 'undefined' && rankOf(ROLE) >= rankOf('supervisor'); }
function siteOvApply(){
  var ov = STATE.siteOv || {};
  var keep = [], hid = [];
  STATE.sites.forEach(function(x){
    var o = ov[x.id]; if (o) Object.assign(x, o);
    if (x.deleted) return;   /* (V37.9) المحذوفُ نهائيًّا يُرفَع من كلِّ مكان */
    if (x.hidden) hid.push(x); else keep.push(x);
  });
  STATE.sites = keep; STATE.hiddenSites = hid;
  SITE_IX = null; SITE_TOK = null; if (typeof siteShared === 'function') siteShared.u = null;   /* (V35.1) عددُ سطور الشاخص يُعاد حسابُه */
}
/* ═══ تصحيحُ البيانات جماعةً (V17.54) ═══
   مراجعةُ السجلِّ كشفت أربعةَ عيوبٍ في البيانات لا في الشيفرة: نقاطٌ على
   إحداثيةٍ واحدة، ونقاطٌ بلا شركة، وأسماءٌ مركَّبةٌ تحمل شركاتٍ عدّة، ومخيماتٌ
   بلا مربعٍ أو شاخص. تصحيحُها نقطةً نقطةً عملُ أيام، فجُمعت في شاشةٍ واحدةٍ
   تُظهر كلَّ عيبٍ بعدده وتُصلحه دفعةً — وكلُّ تصحيحٍ يمرُّ بمسار التعديل
   نفسِه (تجاوزُ الموقع) فيُسجَّل ويُزامَن كأيِّ تعديلٍ يدويّ. */
/* نقاطٌ بعيدةٌ عن مشعرها (V18.3): إحداثياتٌ خاطئةٌ تمدُّ الإطارَ وتضلّل الفرق — تُحصَر
   لكلِّ مشعرٍ بالقاعدة نفسِها التي تحرس خريطةَ النقاط (geoOutliers)، وتُفتَح لتُصحَّح. */
function dqFar(){
  var byZ = {}, out = [];
  (STATE.sites || []).forEach(function(x){ if (!(+x.lat) || !(+x.lng) || !x.zone) return; (byZ[x.zone] = byZ[x.zone] || []).push(x); });
  Object.keys(byZ).forEach(function(z){ geoOutliers(byZ[z]).far.forEach(function(x){ out.push(x); }); });
  return out;
}
function dqDupPos(){
  var seen = {}, pairs = [];
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat) || !(+x.lng)) return;
    var k = (+x.lat).toFixed(5) + ',' + (+x.lng).toFixed(5);
    if (seen[k]) pairs.push([seen[k], x]); else seen[k] = x;
  });
  return pairs;
}
/* ═══ التوأمُ — نقطتان على الإحداثيات نفسِها (V17.86) ═══
   سأل ممثّلُ الوزارة عن سبعةَ عشرَ مخيمًا «لم تُزر» في منى، والميدانُ يقول
   إنها منجَزة. النظرُ في السجل: أربعةَ عشرَ زوجًا من مخيمات منى على
   الإحداثيات نفسِها وشاخصُها مكتوبٌ مرتين بصفتين (12B/B04 و12B/B4) — المخيمُ
   الواحدُ مسجَّلٌ مرتين، فزار الميدانُ أحدَهما وبقي توأمُه «لم يُزر» ويُعَدُّ
   في الإجمالي. الحلُّ قرارٌ لا تخمين: المهندسُ يرى الزوجَ بشاخصيه وحاليهما
   ويختار الأصلَ، فيُدمَج التوأمُ فيه (يُخفى ويُوسَم dupOf) فيخرج من كلِّ عدٍّ
   وشاشةٍ ويبقى مسجَّلًا للرجوع. والأصلُ يجب أن يكون ما مُسح إن مُسح أحدُهما. */
function siteKeyOf(x){ return (+x.lat) && (+x.lng) ? (+x.lat).toFixed(5) + ',' + (+x.lng).toFixed(5) : ''; }
/* (V39.60) camps whose name «… - مربع X - شاخص Y» disagrees with their square/sign fields */
function campNameMismatch(){
  var out = [], norm = function(v){ return String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase(); };
  (STATE.sites || []).forEach(function(x){
    if (x.type !== 'مخيم') return; var m = /مربع\s+(.+?)\s+-\s+شاخص\s+(.+)$/.exec(String(x.name || '')); if (!m) return;
    if (norm(m[1]) !== norm(x.sq) || norm(m[2]) !== norm(x.sign)) out.push({ x:x, nSq:m[1].trim(), nSign:m[2].trim() });
  });
  return out;
}
/* (V39.58) camps drawn as circles (no boundary): inside a registered camp's boundary → {dup, keep, both}; else outside */
function campCircles(){
  var out = { inside:[], outside:[] }; if (typeof campFoot !== 'function' || typeof POLY !== 'object' || !POLY) return out;   /* before the boundary file loads every camp looks boundary-less */
  var withFoot = [], bare = [];
  (STATE.sites || []).forEach(function(x){ if (x.type !== 'مخيم' || !(+x.lat && +x.lng)) return; var r = campFoot(x); if (r && r.length > 2) withFoot.push({ x:x, r:r }); else bare.push(x); });
  var inR = function(lat, lng, r){ var c = false; for (var i = 0, j = r.length - 1; i < r.length; j = i++){ var yi = r[i][1], yj = r[j][1], xi = r[i][0], xj = r[j][0]; if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c; } return c; };
  bare.forEach(function(x){
    var h = null; for (var i = 0; i < withFoot.length && !h; i++) if (inR(+x.lat, +x.lng, withFoot[i].r)) h = withFoot[i].x;
    if (h) out.inside.push({ dup:x, keep:h, both:!!(svVisited((STATE.recs || {})[x.id]) && svVisited((STATE.recs || {})[h.id])) });
    else out.outside.push(x);
  });
  return out;
}
function twinOf(x){
  if (!x) return null;
  var k = siteKeyOf(x); if (!k) return null;
  for (var i = 0; i < STATE.sites.length; i++){
    var y = STATE.sites[i];
    if (y !== x && y.id !== x.id && y.zone === x.zone && y.type === x.type && siteKeyOf(y) === k) return y;
  }
  return null;
}


function dqNoCo(){ return (STATE.sites || []).filter(function(x){ return !String(x.co || '').trim() && x.type === 'مخيم'; }); }

function dqNoSign(){ return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && (!String(x.sq || '').trim() || !String(x.sign || '').trim()); }); }


function siteOvSet(id, patch){
  STATE.siteOv = STATE.siteOv || {};
  STATE.siteOv[id] = Object.assign({}, STATE.siteOv[id] || {}, patch);
  CORE.set('sites', id, patch);
}


/* ═══ حذفُ النقطة المضافة نهائيًّا (V25.5) — قرارُ المالك ═══
   ما أُضيف من الميدان أو المكتب أو أدوات الرسم (isNew) يحذفه المهندسُ فما فوق أيًّا كانت حالتُه، بتأكيدٍ
   واحدٍ يعرض ما ارتبط به؛ ونقاطُ السجل الأصلي لا تُحذَف (تُخفى وتُستعاد). والحذفُ شاهدُ قبرٍ في newsites
   يصل الأجهزةَ كلَّها (المحوُ لا يصلها — انظر CORE.rm)، وسجلاتُه المرتبطةُ ومهامُّه تُشيَّع بشواهدها،
   ويبقى الأثرُ في سجل الأحداث. */
var SITE_DEL = '';
function siteDelLinks(id){
  var L = [];
  if (STATE.recs && STATE.recs[id]) L.push(t('سجلُّ زيارة'));
  if (STATE.inss && STATE.inss[id]) L.push(t('سجلُّ تركيب'));
  if (STATE.diss && STATE.diss[id]) L.push(t('سجلُّ فك'));
  if (STATE.maints && STATE.maints[id]) L.push(t('سجلُّ صيانة'));
  var tk = 0; Object.keys(STATE.tasks || {}).forEach(function(k){ var w = STATE.tasks[k]; if (w && w.site === id) tk++; });
  if (tk) L.push(nm(tk) + ' ' + t('مهام'));
  return L;
}

/* ═══ (V37.9) قرارُ المالك ق-٠١٦: «عاوزه نهائي كاملًا — أيُّ حدٍّ معه صلاحياتُ مهندسٍ فأعلى يمسح نهائيًّا من مرةٍ واحدة» ═══
   المهندسُ فما فوق يحذف أيَّ نقطةٍ لم تُركَّب (مزارةً أو لا، أصليةً أو مضافة) بتأكيدٍ واحد، فتُرفَع من كلِّ مكانٍ على كلِّ الأجهزة
   ولا تُستعاد من التطبيق. يُكتب على تجاوزها deleted مع hidden (فالنسخُ الأقدمُ تُخفيها أيضًا)، وتُرفَع زياراتُها ومهامُّها. وقاعدةُ
   الأمان في السحابة تشترط الدورَ وعدمَ التركيب، وتمنع إرجاعَ المحذوف من أيِّ جهاز. */
function mayDeleteFinal(){ return typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('engineer'); }

/* شاهدُ حذفٍ وصل (من هذا الجهاز أو غيرِه): تُرفَع النقطةُ من السجل والمخفيّ وفهارسه */
function siteDropLocal(id){
  var n = (STATE.sites || []).length;
  STATE.sites = (STATE.sites || []).filter(function(y){ return y.id !== id; });
  if (STATE.hiddenSites) STATE.hiddenSites = STATE.hiddenSites.filter(function(y){ return y.id !== id; });
  if (STATE.sites.length !== n){ SITE_IX = null; SITE_TOK = null; if (typeof statBump === 'function') statBump(); }
}
/* (V37.89) شبكةُ النقطة: المعدَّلةُ ثم ما في بيانات ١٤٤٧ — بثلاثة أجزاءٍ بلا ‎.0/24 */
function siteNetBase(x){
  var v = (typeof S47 !== 'undefined' && S47) ? s47Of(x.id) : null;
  return String((x && x.net) || (v && v.sub) || '').trim().replace(/\/\d+$/, '').replace(/\.0$/, '').replace(/\.+$/, '');
}
function s47Fields(){ return [['nat','الجنسية'], ['dom','الجهة المصرِّحة'], ['cap','السعة المسجّلة ١٤٤٧'], ['pct','نسبة إنجاز ١٤٤٧'],
                  ['dj','عدد أجهزة ١٤٤٧'], ['tst','حالة الاختبار'], ['obst','عائقٌ مسجَّل'], ['iss','ملاحظةٌ مسجَّلة'], ['team','الفريق المسجَّل']]; }
function s47View(x){
  var v = (typeof S47 !== 'undefined' && S47) ? s47Of(x.id) : null;
  if (!v && !(x && x.s47o && Object.keys(x.s47o).length)) return null;
  return Object.assign({}, v || {}, (x && x.s47o) || {});
}
function siteEditHtml(x){
  var opt = function(list, cur){ return list.map(function(v){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v ? t(v) : '— ' + t('بلا') + ' —') + '</option>'; }).join(''); };
  var cos = []; STATE.sites.forEach(function(y){ if (y.co && cos.indexOf(y.co) < 0) cos.push(y.co); });
  var fld = function(l, inner){ return '<div class="field" style="margin:0 0 8px"><label>' + esc(t(l)) + '</label>' + inner + '</div>'; };
  return card('✏️ ' + t('تعديل بيانات النقطة'),
      fld('اسم الموقع', '<input id="seName" dir="auto" value="' + esc(x.name || '') + '">')
    + '<div class="grid cols-2">'
    + fld('رقم المربع', '<input id="seSq" dir="auto" value="' + esc(x.sq || '') + '">')
    + fld('رقم الشاخص', '<input id="seSign" dir="auto" value="' + esc(x.sign || '') + '">')
    + '</div>'
    + '<div class="grid cols-2">'
    + (maySiteEdit() ? fld('المشعر', '<select id="seZone">' + opt(TAX_G, taxOf(x).g) + '</select>')   /* (V27.2) تصنيفُ المالك — يُعدَّل لأيِّ نقطة */
      + fld('التصنيف', '<select id="seType">' + opt(TAX_T, taxOf(x).t) + '</select>') : '')   /* (V28.6) التصنيفُ للمهندس */
    + '</div>'
    + (maySiteEdit() ? fld('المنطقة', '<input id="seRegion" dir="auto" value="' + esc(x.region || '') + '">') : '')   /* (V27.4) */
    + fld('وجه العمل', '<select id="seWork">' + opt([''].concat(SITES_RAW.w.filter(Boolean)), x.work || '') + '</select>')
    + fld('شركة الخدمة / المشغّل', '<input id="seCo" dir="auto" list="seCoL" value="' + esc(x.co || '') + '"><datalist id="seCoL">' + cos.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>')
    + fld('تصنيف الحجاج', '<select id="seInout">' + opt(['', 'داخل', 'خارج'], x.inout || '') + '</select>')
    + (isJmr(x)
        ? '<div class="grid cols-2">'
          + fld('مدخل أو مخرج', '<select id="seGate">' + opt(['', 'مدخل', 'مخرج'], siteGate(x) || '') + '</select>')
          + fld('الدور', '<select id="seFloor">' + ['<option value=""' + (siteFloor(x) == null ? ' selected' : '') + '>— ' + esc(t('بلا')) + ' —</option>'].concat(PV.FLOOR_NAMES.map(function(f, i){ return '<option value="' + i + '"' + (siteFloor(x) === i ? ' selected' : '') + '>' + esc(t(floorName(i))) + '</option>'; })).join('') + '</select>')
          + '</div>'
          + '<p class="hint" style="margin:0 0 8px">' + esc(t('يُضاف الدورُ والبوابةُ إلى اسم النقطة فيظهران في الخريطة والقوائم.')) + '</p>'
        : '')
    /* (V37.89) طلبُ المالك: «كلُّ صفٍّ في البطاقة يُعدَّل من هنا» — الشبكةُ وعناوينُ الأجهزة وبياناتُ ١٤٤٧ */
    + fld('نقطة الاتصال (الشبكة)', '<input id="seNet" dir="ltr" inputmode="decimal" placeholder="172.16.230" value="' + esc(siteNetBase(x)) + '">')
    + '<div class="grid cols-3">'
    + fld('عنوان الراوتر', '<input id="seIpRtr" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.1' : '') + '" value="' + esc(x.ipRtr || '') + '">')
    + fld('عنوان القارئ', '<input id="seIpRdr" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.2' : '') + '" value="' + esc(x.ipRdr || '') + '">')
    + fld('عنوان الكاميرا', '<input id="seIpCam" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.3' : '') + '" value="' + esc(x.ipCam || '') + '">')
    + fld('عنوان الجيت واي', '<input id="seIpGw" dir="ltr" inputmode="decimal" value="' + esc(x.ipGw || '') + '">')   /* (V39.50) */
    + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('عنوانٌ فارغٌ يُشتقّ من الشبكة: ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا.')) + '</p>'
    + (function(){
        var v = s47View(x); if (!v) return '';
        return '<details class="mfu-add" style="margin:0 0 8px"><summary>' + esc(t('بيانات موسم ١٤٤٧')) + '</summary><div class="grid cols-2" style="margin-top:8px">'
          + s47Fields().map(function(f){ return fld(f[1], '<input id="seS47' + f[0] + '" dir="auto" value="' + esc(v[f[0]] || '') + '">'); }).join('')
          + '</div></details>';
      })()
    + '<div class="grid cols-2">'
    + fld('خط العرض', '<input id="seLat" type="number" step="0.000001" dir="ltr" value="' + x.lat + '">')
    + fld('خط الطول', '<input id="seLng" type="number" step="0.000001" dir="ltr" value="' + x.lng + '">')
    + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t(x.isNew ? 'نقطةٌ مضافة: تُحفَظ في القاعدة، وحذفُها نهائيٌّ لا يُستعاد.' : 'تُحفَظ طبقةً فوق بيانات الوزارة ولا تُكتَب زيارة — والإخفاءُ بدل المحو ويُستعاد.')) + '</p>'
    + (SITE_DEL === x.id
        ? '<p class="hint" style="margin:0 0 8px;color:#E05252"><b>' + esc(t('حذفٌ نهائيٌّ لا يُستعاد — يُحذَف معها:')) + '</b> ' + (siteDelLinks(x.id).length ? esc(siteDelLinks(x.id).join('، ')) : esc(t('لا سجلاتٍ مرتبطة'))) + '</p>'
        : '')
    + '<div class="actions">'
    + btn('\u{1F4BE} ' + t('احفظ'),'btn-primary btn-sm',' data-sitesave="' + esc(x.id) + '"')
    + btn(t('إلغاء'),'btn-quiet btn-sm',' data-sitecancel="1"')
    /* (V37.13 مراجعةُ الجودة) نموذجُ التعديل بالحذف النهائيِّ نفسِه (ق-٠١٦) — كان يُخفي الأصليةَ ويحذف المضافةَ بالطريقة القديمة */
    + (siteLocked(x.id) ? '<span class="hint" style="margin:0">\u{1F512} ' + esc(t('لا تُحذَف — النقطة')) + ' ' + esc(t(siteLocked(x.id))) + '</span>'
        : !mayDeleteFinal() ? ''
        : (SITE_DEL === x.id
            ? btn('\u{1F5D1} ' + t('تأكيد الحذف النهائي — لا يُستعاد'),'btn-danger btn-sm',' data-sitedelgo="' + esc(x.id) + '"')
            : btn('\u{1F5D1} ' + t('حذف نهائي'),'btn-quiet btn-sm',' data-sitedel="' + esc(x.id) + '"')))
    + '</div>');
}
function hiddenSitesCard(){
  var H = STATE.hiddenSites || [];
  if (!H.length || !maySiteEdit()) return '';
  return cardFlush(t('نقاطٌ مخفية') + ' — ' + nm(H.length),
    /* (V36.8) متى حُذفت ومَن حذفها، واستعادةُ ما حُذف اليوم دفعةً لمدير المشروع */
    (ROLE === 'admin' && H.some(function(x){ return dayKey(x.hidAt || 0) === dayKey(Date.now()); }) ? '<div class="actions" style="margin:0 0 8px">' + btn('\u21A9 ' + t('استعِد كلَّ ما حُذف اليوم'),'btn-primary btn-sm',' data-siterestoretoday="1"') + '</div>' : '')
    + table(['النقطة','الاسم','حذفها','متى','إجراء'], H.slice().sort(function(a, b){ return (+b.hidAt || 0) - (+a.hidAt || 0); }).slice(0, 150).map(function(x){
      return [siteIdHtml(siteOf(x)), esc(x.name || ''), esc(dispName(x.hidBy) || '—'), '<span class="num">' + esc(x.hidAt ? fmtDT(x.hidAt) : '—') + '</span>',
              btn('\u21A9 ' + t('استعادة'),'btn-secondary btn-sm',' data-siterestore="' + esc(x.id) + '"')];
    })));
}

/* الإحصاءُ والبحثُ والفهرسُ في طبقة الأداء — تُعرَّف بعد هذا الملف */

