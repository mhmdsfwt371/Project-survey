/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-01-site-edit-twins.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Site rows from the registry (siteRow/loadSites), zone-of-type rules, editing site data without a visit (override layer), bulk data corrections, twin points on one coordinate, permanent delete.
   DEFINES : siteZone, siteRow, loadSites, maySiteEdit, maySiteEditBasic, siteOvApply, dqFar, dqDupPos, siteKeyOf, twinOf, dupMerge, dupUndo, dupMerged, dqNoCo … (+18 more)
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


function siteRow(r, camp){
  return {
    id:r[0], name:r[1],
    zone:zoneOf(SITES_RAW.z[r[2]] || '', r[1] || ''), type:(SITES_RAW.t[r[3]] || ''),
    work:(SITES_RAW.w[r[4]] || ''),
    lat:r[5], lng:r[6],
    sq:r[7] || '', sign:r[8] || '', co:r[9] || '',
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
var SITE_ED = 0, SITE_HIDE = '';
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
function twinOf(x){
  if (!x) return null;
  var k = siteKeyOf(x); if (!k) return null;
  for (var i = 0; i < STATE.sites.length; i++){
    var y = STATE.sites[i];
    if (y !== x && y.id !== x.id && y.zone === x.zone && y.type === x.type && siteKeyOf(y) === k) return y;
  }
  return null;
}
function dupMerge(keepId, dupId){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return false; }
  var keep = siteFind(keepId), dup = siteFind(dupId);
  if (!keep || !dup || keepId === dupId){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  if (siteKeyOf(keep) !== siteKeyOf(dup)){ toast(t('ليستا على الإحداثيات نفسِها — لا تُدمَجان')); return false; }
  if (svDone(STATE.recs[dupId]) && !svDone(STATE.recs[keepId])){ toast(t('الأصلُ يجب أن يكون ما مُسح — اختر الأخرى أصلًا')); return false; }
  siteOvSet(dupId, { hidden:true, dupOf:keepId, dupBy:STATE.meta.name || '', dupAt:Date.now() });
  siteOvApply(); statBump();
  logEvent('دمجُ توأم — ' + dupId + ' في ' + keepId, keepId);
  toast(dupId + ' \u00b7 ' + t('دُمجت في') + ' ' + keepId);
  return true;
}
function dupUndo(dupId){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return false; }
  var h = (STATE.hiddenSites || []).filter(function(x){ return x.id === dupId; })[0];
  if (!h){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  siteOvSet(dupId, { hidden:false, dupOf:'' });
  STATE.sites.push(h); siteOvApply(); statBump();
  logEvent('فكُّ دمجِ توأم — ' + dupId, dupId);
  toast(dupId + ' \u00b7 ' + t('عادت نقطةً مستقلّة'));
  return true;
}
function dupMerged(){ return (STATE.hiddenSites || []).filter(function(x){ return x.dupOf; }); }
function dqNoCo(){ return (STATE.sites || []).filter(function(x){ return !String(x.co || '').trim() && x.type === 'مخيم'; }); }
function dqCompound(){
  var m = {};
  (STATE.sites || []).forEach(function(x){
    var c = String(x.co || '').trim();
    if (c && /[،,]|\s-\s/.test(c)) (m[c] = m[c] || []).push(x);
  });
  return m;
}
function dqNoSign(){ return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && (!String(x.sq || '').trim() || !String(x.sign || '').trim()); }); }
/* «بلا تخصيص» وسمٌ صريحٌ يُخرجها من تقارير الشركات بدل أن تُحسَب صفرًا صامتًا */
function dqMarkNoCo(){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return; }
  var L = dqNoCo(), n = 0;
  L.forEach(function(x){ x.co = 'بلا تخصيص'; siteOvSet(x.id, { co:'بلا تخصيص' }); n++; });
  SITE_IX = null; statBump();
  logEvent('تصحيحٌ جماعيّ — صُنّفت ' + nm(n) + ' نقطةً «بلا تخصيص»');
  toast(nm(n) + ' ' + t('نقطةً صُنّفت «بلا تخصيص»'));
  render(1);
}
/* الاسمُ المركَّب يُشطَر: أوّلُ شركةٍ تبقى في «الشركة» والباقي في «شركات مشاركة» */
function dqSplitCo(){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return; }
  var M = dqCompound(), n = 0, names = 0;
  Object.keys(M).forEach(function(c){
    var parts = c.split(/[،,]|\s-\s/).map(function(p){ return p.trim(); }).filter(Boolean);
    if (parts.length < 2) return;
    names++;
    M[c].forEach(function(x){
      x.co = parts[0]; x.coAlso = parts.slice(1);
      siteOvSet(x.id, { co:parts[0], coAlso:parts.slice(1) });
      n++;
    });
  });
  SITE_IX = null; statBump();
  logEvent('تصحيحٌ جماعيّ — شُطر ' + nm(names) + ' اسمًا مركَّبًا على ' + nm(n) + ' نقطة');
  toast(nm(names) + ' ' + t('اسمًا شُطر على') + ' ' + nm(n) + ' ' + t('نقطة'));
  render(1);
}
function siteOvSet(id, patch){
  STATE.siteOv = STATE.siteOv || {};
  STATE.siteOv[id] = Object.assign({}, STATE.siteOv[id] || {}, patch);
  CORE.set('sites', id, patch);
}
function siteEditSave(id){
  if (!maySiteEditBasic()){ toast(t('تعديلُ بيانات النقطة للمشرف فما فوق')); return false; }   /* (V28.6) */
  var x = siteFind(id); if (!x){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  var g = function(n){ var el = document.getElementById(n); return el ? String(el.value || '').trim() : ''; };
  var name = g('seName'); if (!name){ toast(t('اسمُ النقطة لا يكون فارغًا')); return false; }
  var lat = parseFloat(g('seLat')), lng = parseFloat(g('seLng'));
  if (!(lat > 15 && lat < 32 && lng > 34 && lng < 56)){ toast(t('إحداثياتٌ خارج المملكة — راجعها')); return false; }
  var full = maySiteEdit();   /* (V28.6) المشرفُ لا يمسُّ التصنيف — تبقى قيمُه كما هي */
  var patch = { name:name, sq:g('seSq'), sign:g('seSign'), co:g('seCo'), work:g('seWork'), inout:g('seInout'), region:full ? g('seRegion') : (x.region || ''),   /* (V27.4) */
                tg:full ? (g('seZone') || taxOf(x).g) : taxOf(x).g, tt:full ? (g('seType') || taxOf(x).t) : taxOf(x).t, lat:lat, lng:lng, edBy:STATE.meta.name || '', edAt:Date.now() };   /* (V27.2) المشعرُ والنوعُ المعروضان؛ الأصلُ (zone/type) يبقى */
  /* (V37.89) الشبكةُ وعناوينُ الأجهزة — تُتحقَّق صيغتُها، والفارغُ يُشتقّ من الشبكة */
  var ipOk = function(v){ return !v || /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(v) && v.split('.').every(function(q){ return +q <= 255; }); };
  var net = g('seNet').replace(/\/\d+$/, '').replace(/\.0$/, '').replace(/\.+$/, '');
  if (net && !(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(net) && net.split('.').every(function(q){ return +q <= 255; }))){ toast(t('الشبكةُ بصيغة 172.16.230 — ثلاثة أجزاء')); return false; }
  var ips = { ipRtr:g('seIpRtr'), ipRdr:g('seIpRdr'), ipCam:g('seIpCam') };
  if (!ipOk(ips.ipRtr) || !ipOk(ips.ipRdr) || !ipOk(ips.ipCam)){ toast(t('عنوانٌ بصيغةٍ غيرِ صحيحة — مثال 172.16.230.2')); return false; }
  if (document.getElementById('seNet')){ patch.net = net; patch.ipRtr = ips.ipRtr; patch.ipRdr = ips.ipRdr; patch.ipCam = ips.ipCam; }
  if (document.getElementById('seS47' + s47Fields()[0][0])){
    var base47 = s47Of(x.id) || {}, o47 = {}, any = false;
    s47Fields().forEach(function(f){ var v = g('seS47' + f[0]); if (v !== String(base47[f[0]] == null ? '' : base47[f[0]])){ o47[f[0]] = v; any = true; } });
    var prev = JSON.stringify(x.s47o || {}), nxt = JSON.stringify(any ? o47 : {});
    if (prev !== nxt) patch.s47o = any ? o47 : {};
  }
  if (isJmr(x) && document.getElementById('seGate')){   /* (V25.4) مدخل/مخرج والدور — ويُضافان إلى الاسم */
    var gt = g('seGate'), fl = g('seFloor');
    patch.gate = gt; patch.floor = fl === '' ? '' : +fl;
    patch.name = jmrNameApply(name, gt, fl === '' ? null : +fl);
  }
  var chg = Object.keys(patch).filter(function(k){ return k !== 'edBy' && k !== 'edAt' && (k === 's47o' ? JSON.stringify(x.s47o || {}) !== JSON.stringify(patch.s47o) : String(x[k] == null ? '' : x[k]) !== String(patch[k])); });
  if (!chg.length){ toast(t('لا تغيير')); SITE_ED = 0; return true; }
  Object.assign(x, patch);
  siteOvSet(id, patch);
  SITE_IX = null; SITE_TOK = null; TAX_V++; FILT_CACHE = null;
  logEvent('تعديل بيانات نقطة — ' + id + ' \u00b7 ' + chg.join('،'), id);
  toast(t('حُفظ') + ' — ' + nm(chg.length) + ' ' + t('حقلًا'));
  SITE_ED = 0; statBump();
  return true;
}
function siteHide(id){
  if (!maySiteEdit()){ toast(t('إخفاءُ النقطة للمهندس فما فوق')); return false; }
  var x = siteFind(id); if (!x) return false;
  /* (V36.1) طلبُ المالك: «كمهندس حتى لو تمت زيارتها أمسحها عادي» — كان الإخفاءُ يُرفض لنقطةٍ لها زيارةٌ أو تركيب. صار يُسمح للمهندس
     فما فوق؛ وسجلّاتُها لا تُمحى (تختفي من كلِّ الأرقام مع النقطة) فتعود كاملةً إن استُعيدت من «نقاطٌ مخفية». */
  var lk = siteLocked(id); if (lk){ toast(t('لا تُحذَف — النقطة') + ' ' + t(lk) + ' ' + t('(ما رُكّب لا يُحذَف)')); return false; }   /* (V36.4) قرارُ المالك */
  var had = !!(STATE.recs[id] || STATE.inss[id]);
  /* (V36.8) حادثة ٧ أكتوبر: ستٌّ وعشرون نقطةَ تفويجٍ لها زياراتٌ حذفها ثلاثةُ مهندسين بالخطأ فاختفت من أرقام الجميع. حذفُ نقطةٍ لها زيارةٌ
     صار لمدير المشروع وحده؛ والمهندسُ يحذف ما لم يُزَر. */
  /* (V36.10) استمرّ حسابٌ بدور «مدير» في حذفها بعد الاستعادة — فصار حذفُ المزارة لصاحب المشروع وحده (بريدُه) */
  if (had && !(typeof isBossHere === 'function' && isBossHere())){ toast(t('لها زيارة — حذفُها لصاحب المشروع وحده')); return false; }
  x.hidden = true;
  siteOvSet(id, { hidden:true, hidBy:STATE.meta.name || '', hidAt:Date.now() });
  STATE.sites = STATE.sites.filter(function(y){ return y.id !== id; });
  (STATE.hiddenSites = STATE.hiddenSites || []).push(x);
  SITE_IX = null; SITE_TOK = null;
  logEvent('حذف نقطة (قابلٌ للاستعادة) — ' + id + ' \u00b7 ' + (x.name || '') + (had ? ' \u00b7 ' + t('لها زيارةٌ أو تركيب') : ''), id);
  toast(siteKey(x) + ' \u00b7 ' + t('حُذفت — تُستعاد من «نقاطٌ مخفية» أسفل قائمة المواقع'));
  SITE_HIDE = ''; SITE_ED = 0; statBump();
  return true;
}
function siteRestore(id){
  if (!maySiteEdit()) return false;
  var H = STATE.hiddenSites || [], x = H.filter(function(y){ return y.id === id; })[0];
  if (!x) return false;
  x.hidden = false;
  siteOvSet(id, { hidden:false, hidBy:'', hidAt:0 });
  STATE.hiddenSites = H.filter(function(y){ return y.id !== id; });
  STATE.sites.push(x);
  SITE_IX = null; SITE_TOK = null;
  logEvent('استعادة نقطة — ' + id, id);
  toast(id + ' \u00b7 ' + t('استُعيدت'));
  statBump();
  return true;
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
function siteDelete(id){
  if (!maySiteEdit()){ toast(t('حذفُ النقطة للمهندس فما فوق')); return false; }
  var x = siteFind(id); if (!x){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  if (!x.isNew){ toast(t('نقاطُ السجل الأصلي لا تُحذَف — تُخفى وتُستعاد')); return false; }
  var lk2 = siteLocked(id); if (lk2){ toast(t('لا تُحذَف — النقطة') + ' ' + t(lk2) + ' ' + t('(ما رُكّب لا يُحذَف)')); return false; }   /* (V36.4) قرارُ المالك */
  var links = siteDelLinks(id);
  ['recs', 'inss', 'diss', 'maints'].forEach(function(k){ if (STATE[k] && STATE[k][id]) CORE.rm(k, id); });
  Object.keys(STATE.tasks || {}).forEach(function(k){ var w = STATE.tasks[k]; if (w && w.site === id) CORE.rm('tasks', k); });
  siteDropLocal(id);
  if (STATE.newsites) delete STATE.newsites[id];
  if (STATE.siteOv) delete STATE.siteOv[id];
  CORE.dirty('newsites', id, { id:String(id), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
  logEvent('حذفُ نقطةٍ مضافةٍ نهائيًّا — ' + id + ' \u00b7 ' + (x.name || '') + (links.length ? ' \u00b7 ' + links.join('، ') : ''), id);
  toast(id + ' \u00b7 ' + t('حُذفت نهائيًّا'));
  SITE_DEL = ''; SITE_ED = 0; statBump();
  return true;
}
/* ═══ (V37.9) قرارُ المالك ق-٠١٦: «عاوزه نهائي كاملًا — أيُّ حدٍّ معه صلاحياتُ مهندسٍ فأعلى يمسح نهائيًّا من مرةٍ واحدة» ═══
   المهندسُ فما فوق يحذف أيَّ نقطةٍ لم تُركَّب (مزارةً أو لا، أصليةً أو مضافة) بتأكيدٍ واحد، فتُرفَع من كلِّ مكانٍ على كلِّ الأجهزة
   ولا تُستعاد من التطبيق. يُكتب على تجاوزها deleted مع hidden (فالنسخُ الأقدمُ تُخفيها أيضًا)، وتُرفَع زياراتُها ومهامُّها. وقاعدةُ
   الأمان في السحابة تشترط الدورَ وعدمَ التركيب، وتمنع إرجاعَ المحذوف من أيِّ جهاز. */
function mayDeleteFinal(){ return typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('engineer'); }
function siteDeleteFinal(id){
  if (!mayDeleteFinal()){ toast(t('الحذفُ النهائيُّ للمهندس فما فوق')); return false; }
  var x = siteFind(id) || (STATE.hiddenSites || []).filter(function(y){ return y.id === id; })[0]; if (!x){ toast(t('لا نقطةَ بهذا المعرِّف')); return false; }
  var lk = siteLocked(id); if (lk){ toast(t('لا تُحذَف — النقطة') + ' ' + t(lk) + ' ' + t('(ما رُكّب لا يُحذَف)')); return false; }
  var who = STATE.meta.name || '', now = Date.now(), links = siteDelLinks(id);
  ['recs', 'inss', 'diss', 'maints'].forEach(function(k){ if (STATE[k] && STATE[k][id]) CORE.rm(k, id); });
  Object.keys(STATE.tasks || {}).forEach(function(k){ var w = STATE.tasks[k]; if (w && w.site === id) CORE.rm('tasks', k); });
  var ov = { deleted:true, hidden:true, delBy:who, delAt:now, hidBy:who, hidAt:now };
  STATE.siteOv = STATE.siteOv || {}; STATE.siteOv[id] = Object.assign({}, STATE.siteOv[id] || {}, ov); CORE.set('sites', id, ov);
  if (x.isNew){ if (STATE.newsites) delete STATE.newsites[id]; CORE.dirty('newsites', id, { id:String(id), deleted:true, at:now, by:who }); }
  siteDropLocal(id); if (typeof siteKey === 'function') siteKey.u = null;
  logEvent('حذفٌ نهائيّ — ' + id + ' \u00b7 ' + (x.name || '') + (links.length ? ' \u00b7 ' + links.join('، ') : ''), id);
  toast(id + ' \u00b7 ' + t('حُذفت نهائيًّا'));
  if (typeof POP_SITE !== 'undefined' && POP_SITE === id){ POP_SITE = ''; POP_OPEN = false; }
  SITE_DEL = ''; SITE_ED = 0; statBump(); return true;
}
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
          + fld('الدور', '<select id="seFloor">' + ['<option value=""' + (siteFloor(x) == null ? ' selected' : '') + '>— ' + esc(t('بلا')) + ' —</option>'].concat(FLOOR_NAMES.map(function(f, i){ return '<option value="' + i + '"' + (siteFloor(x) === i ? ' selected' : '') + '>' + esc(t(floorName(i))) + '</option>'; })).join('') + '</select>')
          + '</div>'
          + '<p class="hint" style="margin:0 0 8px">' + esc(t('يُضاف الدورُ والبوابةُ إلى اسم النقطة فيظهران في الخريطة والقوائم.')) + '</p>'
        : '')
    /* (V37.89) طلبُ المالك: «كلُّ صفٍّ في البطاقة يُعدَّل من هنا» — الشبكةُ وعناوينُ الأجهزة وبياناتُ ١٤٤٧ */
    + fld('نقطة الاتصال (الشبكة)', '<input id="seNet" dir="ltr" inputmode="decimal" placeholder="172.16.230" value="' + esc(siteNetBase(x)) + '">')
    + '<div class="grid cols-3">'
    + fld('عنوان الراوتر', '<input id="seIpRtr" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.1' : '') + '" value="' + esc(x.ipRtr || '') + '">')
    + fld('عنوان القارئ', '<input id="seIpRdr" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.2' : '') + '" value="' + esc(x.ipRdr || '') + '">')
    + fld('عنوان الكاميرا', '<input id="seIpCam" dir="ltr" inputmode="decimal" placeholder="' + esc(siteNetBase(x) ? siteNetBase(x) + '.3' : '') + '" value="' + esc(x.ipCam || '') + '">')
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

