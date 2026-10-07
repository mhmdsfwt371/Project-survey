
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
  if (isJmr(x) && document.getElementById('seGate')){   /* (V25.4) مدخل/مخرج والدور — ويُضافان إلى الاسم */
    var gt = g('seGate'), fl = g('seFloor');
    patch.gate = gt; patch.floor = fl === '' ? '' : +fl;
    patch.name = jmrNameApply(name, gt, fl === '' ? null : +fl);
  }
  var chg = Object.keys(patch).filter(function(k){ return k !== 'edBy' && k !== 'edAt' && String(x[k] == null ? '' : x[k]) !== String(patch[k]); });
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
  var had = !!(STATE.recs[id] || STATE.inss[id]);
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
/* شاهدُ حذفٍ وصل (من هذا الجهاز أو غيرِه): تُرفَع النقطةُ من السجل والمخفيّ وفهارسه */
function siteDropLocal(id){
  var n = (STATE.sites || []).length;
  STATE.sites = (STATE.sites || []).filter(function(y){ return y.id !== id; });
  if (STATE.hiddenSites) STATE.hiddenSites = STATE.hiddenSites.filter(function(y){ return y.id !== id; });
  if (STATE.sites.length !== n){ SITE_IX = null; SITE_TOK = null; if (typeof statBump === 'function') statBump(); }
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
    + (x.isNew
        ? (SITE_DEL === x.id
            ? btn('\u{1F5D1} ' + t('تأكيد الحذف النهائي'),'btn-danger btn-sm',' data-sitedelgo="' + esc(x.id) + '"')
            : btn('\u{1F5D1} ' + t('حذف النقطة نهائيًا'),'btn-quiet btn-sm',' data-sitedel="' + esc(x.id) + '"'))
        : (SITE_HIDE === x.id
            ? btn('\u{1F5D1} ' + t('تأكيد الحذف') + ((STATE.recs[x.id] || STATE.inss[x.id]) ? ' — ' + t('لها زيارة') : ''),'btn-danger btn-sm',' data-sitehidego="' + esc(x.id) + '"')
            : btn('\u{1F5D1} ' + t('حذف النقطة'),'btn-quiet btn-sm',' data-sitehide="' + esc(x.id) + '"')))
    + '</div>');
}
function hiddenSitesCard(){
  var H = STATE.hiddenSites || [];
  if (!H.length || !maySiteEdit()) return '';
  return cardFlush(t('نقاطٌ مخفية') + ' — ' + nm(H.length),
    table(['النقطة','الاسم','أخفاها','إجراء'], H.slice(0, 100).map(function(x){
      return [siteIdHtml(siteOf(x)), esc(x.name || ''), esc(dispName(x.hidBy) || '—'),
              btn('\u21A9 ' + t('استعادة'),'btn-secondary btn-sm',' data-siterestore="' + esc(x.id) + '"')];
    })));
}

/* الإحصاءُ والبحثُ والفهرسُ في طبقة الأداء — تُعرَّف بعد هذا الملف */

/* ═══ التصنيف والتفاصيل — كما في العامل ═══
   شريطان: المشاعرُ ثم الأنواعُ بأيقوناتها وألوانها،
   والضغطُ يُرشِّح الخريطةَ والقائمةَ معًا في اللحظة نفسها. */

/* ═══ شكلُ النقطة على الخريطة (V17.55) ═══
   كانت كلُّ نقطةٍ دائرةً، والأشكالُ في الأسطورة رموزًا لا تُرى على الخريطة —
   فنوعان بلونين متقاربين لا يُفرَّق بينهما في الشمس. صار لكلِّ نوعٍ شكلُه:
   دائرةٌ أو مربّعٌ أو معيّنٌ أو مثلّث، يُرسَم بإزاحةٍ بالبكسل فيثبت حجمُه مع
   التقريب. والدائرةُ تبقى الأصلَ لأن المخيماتِ ألفٌ وأربعُمئة، ولا يُحسَب
   المضلَّعُ إلا لما اختير له شكلٌ آخر — وهي عشراتٌ لا آلاف. */
var SHAPES = [['circle','دائرة'], ['square','مربّع'], ['diamond','معيّن'], ['triangle','مثلّث'],
              ['star','نجمة'], ['drop','قطرة']];
/* ═══ هندسةُ الأشكال بوحدةٍ واحدة (V17.60) ═══
   كلُّ شكلٍ رؤوسٌ بمضاعفاتِ نصف القطر: يرسمه اللوحُ بإزاحةٍ بالبكسل، وترسمه
   الأسطورةُ وشاشةُ الأنواع بالأرقام نفسِها — فلا تقول الأسطورةُ شكلًا وترسم
   الخريطةُ غيرَه. النجمةُ والقطرةُ أُضيفتا للجيت واي والحساس. */
var SHAPE_UNIT = (function(){
  var U = {
    square:   [[-1,-1],[1,-1],[1,1],[-1,1]],
    diamond:  [[0,-1.25],[1.25,0],[0,1.25],[-1.25,0]],
    triangle: [[0,-1.35],[1.2,0.95],[-1.2,0.95]],
    star: [], drop: [[0,-1.6]]
  };
  for (var i = 0; i < 10; i++){
    var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2) ? 0.68 : 1.6;
    U.star.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  for (var g = -30; g <= 210; g += 30){
    var b = g * Math.PI / 180;
    U.drop.push([Math.cos(b) * 1.05, 0.35 + Math.sin(b) * 1.05]);
  }
  return U;
})();
function typeShape(ty){
  var d = typesList()[ty], b = CAT_DEF[ty];
  return (d && d.s) || (b && b.s) || 'circle';
}
/* الشكلُ كما يُرسَم فعلًا: الممرُّ والكاميرا معيّنٌ بعلامةٍ ثابتة، وغيرُهما شكلُ نوعه */
/* ═══ شكلٌ لكلِّ نوع (V24.8) ═══ بطلب صاحب المشروع: كلُّ نوعٍ يُعرَف بشكله قبل لونه، والمخيمُ كما هو.
   الجدولُ نفسُه تقرؤه الخريطةُ والأسطورةُ وشاشةُ الأنواع — فلا يختلف ثلاثتُها. */
(function(){
  var ring = function(n, r, rot){ var o = []; for (var i = 0; i < n; i++){ var a = rot + i * 2 * Math.PI / n; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
  SHAPE_UNIT.tridown = [[0, 1.35], [1.2, -0.95], [-1.2, -0.95]];
  SHAPE_UNIT.hexagon = ring(6, 1.2, 0);
  SHAPE_UNIT.pentagon = ring(5, 1.3, -Math.PI / 2);
  var w = 0.42, l = 1.3;
  SHAPE_UNIT.plus = [[-w,-l],[w,-l],[w,-w],[l,-w],[l,w],[w,w],[w,l],[-w,l],[-w,w],[-l,w],[-l,-w],[-w,-w]];
})();
SHAPES.push(['tridown', 'مثلث مقلوب'], ['hexagon', 'سداسي'], ['pentagon', 'خماسي'], ['plus', 'زائد']);
var TYPE_SHAPE_DEF = { 'ممر':'square', 'كاميرا':'triangle', 'LPR':'tridown', 'جيت واي':'star', 'حساس حرارة ورطوبة':'drop',
                       'بوابة':'diamond', 'محطة':'hexagon', 'جسر':'pentagon', 'مبنى':'plus' };
function mapShapeOf(ty){ return TYPE_SHAPE_DEF[ty] || typeShape(ty); }
function shapeRing(map, lat, lng, px, shape){
  var U = SHAPE_UNIT[shape];
  if (!U) return null;
  var c = map.latLngToContainerPoint([lat, lng]);
  return U.map(function(p){ return map.containerPointToLatLng([c.x + p[0] * px, c.y + p[1] * px]); });
}
/* الشكلُ نفسُه صورةً صغيرة — للأسطورة وشاشة الأنواع */
function shapeSvg(shape, col){
  var U = SHAPE_UNIT[shape], f = esc(col || '#C6CFD7');
  var body = U
    ? '<polygon points="' + U.map(function(p){ return (p[0] * 6.2).toFixed(1) + ',' + (p[1] * 6.2).toFixed(1); }).join(' ') + '"/>'
    : '<circle r="6"/>';
  return '<svg class="lg-svg" viewBox="-10 -10 20 20" aria-hidden="true"><g fill="' + f + '">' + body + '</g></svg>';
}
/* ═══ تصنيفُ المالك للعرض (V27.2): المشعرُ خمسةٌ والنوعُ تسعة ═══
   المشعر: منى · عرفات · المزدلفة · محطات التفويج · كاميرات الرصد. النوع: مخيمات · ممرات · محطات قطار · كاميرات رصد ·
   منشأة الجمرات · مسجد نمرة · النورية · محطات طريق الهجرة · الزايدي. «محطات التفويج» تضمّ النورية وطريق الهجرة والزايدي
   (كلُّها كاميرات لوحات)، و«كاميرات الرصد» تضمّ كاميرات منى ومنشأة الجمرات، وكاميراتُ عرفات (رصدًا ولوحات) تحت عرفات
   بنوع «كاميرات رصد». يُحسَب من بيانات النقطة بقواعد، ويُعدَّل لأيِّ نقطةٍ يدويًّا من «تعديل البيانات» (tg/tt) — كلُّه حركيّ. */
/* (V28.5) ملاحظاتُ «تحديثات المنصة»: «كاميراتُ الوزارة» ← «المتابعة» وتُزال منها كاميراتُ الجمرات (لها مسمّاها)، و«كاميراتُ الوزارة LPR» ← «مراكز التفويج».
   المفاتيحُ القديمةُ المحفوظةُ في تعديلات النقاط تُقرأ بأسمائها الجديدة (TAX_ALIAS). */
var TAX_ALIAS = { 'كاميرات الرصد':'كاميرات المتابعة', 'المتابعة':'كاميرات المتابعة', 'محطات التفويج':'مراكز التفويج', 'كاميرات رصد':'كاميرات المتابعة' };   /* (V30.0) المشعرُ «المتابعة» صار «كاميرات المتابعة» */
var TAX_G = ['منى', 'عرفات', 'المزدلفة', 'مراكز التفويج', 'كاميرات المتابعة'];
var TAX_T = ['مخيمات', 'ممرات', 'محطات قطار', 'كاميرات المتابعة', 'منشأة الجمرات', 'مسجد نمرة', 'النورية', 'محطات طريق الهجرة', 'الزايدي'];
var TAX_V = 2;   /* يُرفَع عند أيِّ تعديلٍ يدويّ فتُعاد قراءةُ الذاكرة */
function taxCalc(x){
  var z = String(x.zone || ''), ty = String(x.type || ''), nm0 = String(x.name || ''), cam = (ty === 'كاميرا' || ty === 'LPR');
  var t = { 'مخيم':'مخيمات', 'ممر':'ممرات', 'محطة':'محطات قطار', 'جسر':'منشأة الجمرات', 'بوابة':'مسجد نمرة', 'كاميرا':'كاميرات المتابعة', 'LPR':'كاميرات المتابعة', 'مبنى':'مخيمات' }[ty] || (TAX_T.indexOf(ty) > -1 ? ty : 'مخيمات');
  var g;
  if (/النوري|النوار/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'النورية'; }
  else if (/الهجرة/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'محطات طريق الهجرة'; }
  else if (/الزايد/.test(z + ' ' + nm0)){ g = 'مراكز التفويج'; t = 'الزايدي'; }
  else if (/التفويج/.test(z)){ g = 'مراكز التفويج'; }
  else if (z === 'الجمرات' || (cam && (/الجمرات/.test(String(x.region || '')) || /^NSK-JMR-/.test(String(x.id || ''))))){ g = cam ? 'كاميرات المتابعة' : 'منى'; t = 'منشأة الجمرات'; }   /* (V28.5) كاميراتُ الجمرات (مشعرُها منى في السجل ومنطقتُها «منشأة الجمرات») نوعُها «منشأة الجمرات» لا «كاميرات المتابعة» */
  else if (z === 'منى'){ g = cam ? 'كاميرات المتابعة' : 'منى'; }
  else if (z === 'عرفات' || z === 'مسجد نمرة'){ g = 'عرفات'; if (z === 'مسجد نمرة') t = 'مسجد نمرة'; }
  else if (/مزدلفة/.test(z)){ g = 'المزدلفة'; }
  else if (/قطار/.test(z)){ t = 'محطات قطار'; g = /مزدلفة/.test(nm0) ? 'المزدلفة' : (/عرفات/.test(nm0) ? 'عرفات' : 'منى'); }
  else g = TAX_G.indexOf(z) > -1 ? z : 'منى';
  return { g:g, t:t };
}
function taxOf(x){
  if (!x) return { g:'', t:'' };
  if (x._tax && x._taxV === TAX_V) return x._tax;
  var r = taxCalc(x);
  var tg = TAX_ALIAS[x.tg] || x.tg, tt = TAX_ALIAS[x.tt] || x.tt;   /* (V28.5) */
  if (tg && TAX_G.indexOf(tg) > -1) r.g = tg;
  if (tt && TAX_T.indexOf(tt) > -1) r.t = tt;
  x._tax = r; x._taxV = TAX_V; return r;
}
var TAX_DEF = { 'مخيمات':{ l:'مخيمات', i:'\u26FA', c:'#3ED598' }, 'ممرات':{ l:'ممرات', i:'\u{1F6E3}', c:'#4FA3FF' }, 'محطات قطار':{ l:'محطات قطار', i:'\u{1F686}', c:'#F2C960' }, 'كاميرات المتابعة':{ l:'كاميرات المتابعة', i:'\u{1F4F7}', c:'#C77DFF' }, 'منشأة الجمرات':{ l:'منشأة الجمرات', i:'\u{1F309}', c:'#E8873A' }, 'مسجد نمرة':{ l:'مسجد نمرة', i:'\u{1F54C}', c:'#38B2AC' }, 'النورية':{ l:'النورية', i:'\u{1F693}', c:'#FF6B6B' }, 'محطات طريق الهجرة':{ l:'محطات طريق الهجرة', i:'\u{1F693}', c:'#FF8E53' }, 'الزايدي':{ l:'الزايدي', i:'\u{1F693}', c:'#FFB347' } };
var CAT_DEF = {
  'مخيم':   { l:'مخيمات',          i:'\u26FA', c:'#3ED598' },
  'ممر':    { l:'ممرات',           i:'\u{1F6E3}', c:'#4FA3FF' },
  'جسر':    { l:'منشأة الجمرات',   i:'\u{1F309}', c:'#E8873A' },
  'كاميرا': { l:'كاميرات المتابعة', i:'\u{1F4F7}', c:'#C77DFF' },   /* (V28.5) كان «كاميرات الوزارة» */   /* Bullet وPTZ — النوعُ الفرعيُّ لكلِّ نقطةٍ في camKind (V19.1) */
  'محطة':   { l:'محطات القطار',    i:'\u{1F686}', c:'#F2C960' },
  'بوابة':  { l:'مسجد نمرة',       i:'\u{1F54C}', c:'#38B2AC' },
  'مبنى':   { l:'منشآت التسكين',   i:'\u{1F3E2}', c:'#B8C4BF' },
  /* نوعٌ جديد (V17.45): كاميراتُ قراءة اللوحات — بلونها وأيقونتها فتُقرأ على الخريطة.
     أما «كاميرا» فهي كاميراتُ الوزارة الذكيّة نفسُها — لا نوعَ ثانٍ لها.
     والاسمُ «كاميراتُ قراءة اللوحات» (V17.60): القائمةُ تسمّي أجهزةً تُركَّب لا
     وظيفةً تُؤدّى — والقيمةُ المخزَّنةُ هي المفتاح فلا يمسُّها تغييرُ الاسم. */
  'LPR':    { l:'مراكز التفويج', i:'\u{1F694}', c:'#FF6B6B' },   /* (V28.5) كان «كاميرات الوزارة — LPR» */   /* كاميراتُ الوزارة التي تقرأ اللوحات (V19.1) */
  /* ═══ الجيت واي والحساس — لكلٍّ شكلُه (V17.60) ═══
     يُضافان من «نقطة هنا» كسائر الأنواع، ولكلٍّ شكلٌ لا يشاركه فيه غيرُه:
     النجمةُ للجيت واي (عقدةٌ تتفرّع منها الأجهزة) والقطرةُ للحساس (حرارةٌ
     ورطوبة) — فيُعرَفان على الخريطة قبل أن يُقرأ لونُهما. */
  'جيت واي':           { l:'جيت واي',                 i:'\u{1F4E1}', c:'#22D3EE', s:'star' },
  'حساس حرارة ورطوبة': { l:'حساسات الحرارة والرطوبة', i:'\u{1F321}', c:'#F472B6', s:'drop' }
};
/* الكتالوجُ كما كُتب — CAT_DEF يتبدّل مع سجلِّ الأنواع، وهذه النسخةُ تبقى مرجعَ
   «المدمَج» فيُضاف إلى سجلٍّ سحابيٍّ سبقه (V17.60) */
var CAT_DEF_BASE = JSON.parse(JSON.stringify(CAT_DEF));

/* ═══ الترشيحُ بالمسار (V17.51 · طلبُ الوزارة) ═══
   النقاطُ المولَّدةُ تحمل اسمَ مسارها (route)، فيُسأل: أرِني «طريق كدانة»
   وحدَه — كم نقطةً فيه وكم مُسحت. فصار مرشِّحًا كالمشعر والنوع: يُشتقُّ من
   البيانات فلا يُكتَب بيدٍ، ويظهر متى وُجد مسارٌ واحدٌ على الأقلّ. */
var FILT = { zone:'', type:'', work:'', life:'', route:'', floor:'' };   /* floor (V22.2) */
function routesList(){
  var r = {};
  (STATE.sites || []).forEach(function(x){ if (x && x.route) r[x.route] = (r[x.route] || 0) + 1; });
  return r;
}

/* (V29.8) شكوى المالك «الزايدي مكتوب ١ ومش على الخريطة»: مواقعُ التفويج بعيدةٌ عن المشاعر (النورية والزايدي والجموم والمدينة)،
   فاختيارُ مشعرٍ أو نوعٍ لا يظهر شيءٌ من نقاطه في الإطار يقرّب الخريطةَ إليها — وإن ظهر شيءٌ منها بقيت الخريطةُ مكانها */
function mapFitFiltered(){
  if (CUR !== 'map' || typeof MAP === 'undefined' || !MAP || !(FILT.zone || FILT.type)) return false;
  var P = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng && filtPass(x); }).map(function(x){ return [+x.lat, +x.lng]; });
  if (!P.length) return false;
  try {
    var B = MAP.getBounds(); if (P.some(function(p){ return B.contains(p); })) return false;
    MAP.fitBounds(L.latLngBounds(P).pad(0.2), { maxZoom:17, animate:false }); return true;
  } catch (e){ LS_ERR = e; return false; }
}
function filtOn(){ return !!(FILT.zone || FILT.type || FILT.work || FILT.life || FILT.route || (FILT.floor !== '' && FILT.floor != null) || CO_SEL.length); }

function filtPass(x){
  if (FILT.zone && taxOf(x).g !== FILT.zone) return false;   /* (V27.2) بتصنيف المالك */
  if (FILT.type && taxOf(x).t !== FILT.type) return false;
  if (FILT.work && x.work !== FILT.work) return false;
  if (FILT.route && x.route !== FILT.route) return false;   /* بالمسار (V17.51) */
  if (FILT.floor !== '' && FILT.floor != null && siteFloor(x) !== +FILT.floor) return false;   /* بالدور (V22.2) */
  /* بالحالة: ما لم يُزَر، ما زير وينتظر الاعتماد، المعتمدُ الجاهز، المُسند، المُركّب… —
     كان المرشِّحُ يجيب النقاطَ بلا ما حدث لها، فلا يُعرَف من الخريطة ما تمّ وما بقي */
  if (FILT.life && typeof lifeOf === 'function' && lifeOf(x) !== FILT.life) return false;
  /* الشركةُ ترشيحٌ لا تلوينٌ فحسب: من اختار شركةً أراد نقاطَها وحدها */
  if (CO_SEL.length && CO_SEL.indexOf(x.co) < 0) return false;
  return true;
}

/* عدُّ كلِّ تصنيفٍ ضمن ما رُشِّح بغيره — فالأعدادُ تتبع الاختيار */
function catCounts(){
  var z = {}, ty = {}, wk = {}, n = 0;
  for (var i = 0; i < STATE.sites.length; i++){
    var x = STATE.sites[i];
    var tx = taxOf(x), okZ = !FILT.type || tx.t === FILT.type;
    var okT = !FILT.zone || tx.g === FILT.zone;
    if (okZ) z[tx.g] = (z[tx.g] || 0) + 1;
    if (okT) ty[tx.t] = (ty[tx.t] || 0) + 1;
    if (filtPass(x)){ n++; if (x.work) wk[x.work] = (wk[x.work] || 0) + 1; }
  }
  return { zone:z, type:ty, work:wk, shown:n };
}

/* ═══ كاميراتُ الوزارة بتفاصيلها، وأدوارُ المنشآت (V22.2) ═══
   من تقرير الوزارة «MOHU MINA CPE AND CAMERA REPORT 2026»: لكلِّ عمودٍ عددُ كاميراته ونوعُها
   (ثابتة/متحرّكة) وحالةُ ربطه وقطاعُه — بلا عناوين شبكةٍ ولا كلماتِ مرور. التسعُ والخمسون
   القائمةُ طابقت التقريرَ عمودًا عمودًا وموقعًا موقعًا (أقلُّ من ثلاثين مترًا)، فبقيت معرّفاتُها
   وزياراتُها كما هي؛ وأُضيفت كاميراتُ منشأة الجمرات بأدوارها وأعمدتُها المجاورة.
   منشأةُ الجمرات أرضيٌّ وأربعةُ أدوار، ونقاطُها — لأفاقي وللوزارة — فوق بعضها على الخريطة:
   فصار للنقطة دورٌ (من حقلها أو من اسمها) وصفُّ أدوارٍ في التصفية يعرض دورًا واحدًا. */
var CAM_INFO = {"NSK-MIN-CAM-0009":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0012":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0014":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0001":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0015":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0003":[1,[["F",1]],"إشارةٌ ضعيفة","ROUCKET",0],"NSK-MIN-CAM-0002":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0004":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0016":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0008":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0017":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0013":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0011":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0007":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0018":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0005":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0006":[1,[["F",1]],"إشارةٌ رديئة","ROUCKET",0],"NSK-MIN-CAM-0010":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0023":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0024":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0021":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0025":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0022":[2,[["F",2]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0019":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0026":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","ROUCKET",0],"NSK-MIN-CAM-0027":[2,[["F",2]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","ROUCKET",0],"NSK-MIN-CAM-0020":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",0],"NSK-MIN-CAM-0034":[1,[["F",1]],"تُوصَل بإشارةٍ ضعيفة","BLUE 1",0],"NSK-MIN-CAM-0035":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 1",0],"NSK-MIN-CAM-0033":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 1",0],"NSK-MIN-CAM-0032":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 1",0],"NSK-MIN-CAM-0038":[1,[["F",1]],"إشارةٌ رديئة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0040":[1,[["P",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 2",0],"NSK-MIN-CAM-0044":[2,[["P",1],["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 2",0],"NSK-MIN-CAM-0036":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0039":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0041":[1,[["P",1]],"إشارةٌ ضعيفة — يلزم نقلُ الهوائي","BLUE 2",0],"NSK-MIN-CAM-0042":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0037":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0043":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 2",0],"NSK-MIN-CAM-0046":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0049":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0045":[1,[["F",1]],"إشارةٌ ضعيفة — خطُّ الرؤية محجوبٌ جزئيًّا","BLUE 3",0],"NSK-MIN-CAM-0047":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","BLUE 3",0],"NSK-MIN-CAM-0051":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 3",0],"NSK-MIN-CAM-0048":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0052":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0053":[1,[["F",1]],"إشارةٌ ضعيفة — عطلٌ في الجهاز","BLUE 3",0],"NSK-MIN-CAM-0050":[1,[["F",1]],"إشارةٌ ضعيفة — يلزم استبدالُ الهوائي بطراز Power Beam","BLUE 3",0],"NSK-MIN-CAM-0055":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0063":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0058":[2,[["F",2]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0054":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0061":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0062":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","CAMBIUM",0],"NSK-MIN-CAM-0056":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0057":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0059":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-MIN-CAM-0060":[1,[["F",1]],"لا تُوصَل — لا خطَّ رؤية","UNIFI",0],"NSK-JMR-CAM-0001":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0002":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0003":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0004":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0005":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0006":[1,[["F",1]],"الهوائي يصل — خللٌ في إعداد الشبكة (VLAN)","JAMARAT",0],"NSK-JMR-CAM-0007":[1,[["F",1]],"","JAMARAT",0],"NSK-JMR-CAM-0008":[1,[["F",1]],"","JAMARAT",0],"NSK-JMR-CAM-0009":[1,[["P",1]],"","JAMARAT",0],"NSK-NEW-LPR-N001":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N002":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N003":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N004":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N005":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N006":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N007":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N008":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N009":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N010":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N011":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N012":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N013":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N014":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N015":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N016":[1,[["L",1]],"","",1],"NSK-NEW-LPR-N017":[1,[["L",1]],"","",1],"NSK-JMR-CAM-0010":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0011":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0012":[1,[["P",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0013":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0014":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0015":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0016":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0017":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","JAMARAT",1],"NSK-JMR-CAM-0018":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0019":[1,[["F",1]],"إشارةٌ جيدة — خطُّ رؤيةٍ واضح","ROUCKET",1],"NSK-JMR-CAM-0020":[1,[["P",1]],"","JAMARAT",0]};
/* (V23.4) عناوينُ كاميرات الوزارة كما في تقريرها ٢٠٢٦ — بقرار صاحب المشروع («حطّ الـIPs… ملكش دعوة
   بالسيكيورتي دلوقتي»): لكلِّ نقطةٍ المستقبِلُ (CPE) وعنوانُه، وقطاعُه وهوائيُّه، وحالتُه، وكاميراتُها برقمها
   وطرازها ونوعها وعنوانها والـVLAN. ٨٥ كاميرا على ٧٩ نقطة، وثلاثٌ بلا إحداثياتٍ في التقرير. كلمةُ المرور
   لا تُكتَب هنا — روابطُ البثِّ بلا اعتماد، والفريقُ يعرفها. */
var CAM_NET = {"NSK-MIN-CAM-0009":{"cpe":"1","ant":"10.24.17.115","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"1","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.96","vlan":"1"}]},"NSK-MIN-CAM-0012":{"cpe":"2","ant":"10.24.17.143","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"2","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.193","vlan":"1"}]},"NSK-MIN-CAM-0014":{"cpe":"3","ant":"10.24.17.116","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"3","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.120","vlan":"1"}]},"NSK-MIN-CAM-0001":{"cpe":"4","ant":"10.24.17.112","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"4","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.80","vlan":"1"},{"n":"5","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.28","vlan":"1"}]},"NSK-MIN-CAM-0015":{"cpe":"5","ant":"10.24.17.111","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"6","kind":"F","model":"IPC-HFW2531T-ZS-S2","ip":"10.24.20.27","vlan":"1"}]},"NSK-MIN-CAM-0003":{"cpe":"6","ant":"10.24.17.218","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal","cams":[{"n":"7","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.31","vlan":"1"}]},"NSK-MIN-CAM-0002":{"cpe":"7","ant":"10.24.17.214","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"8","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.81","vlan":"1"}]},"NSK-MIN-CAM-0004":{"cpe":"8","ant":"10.24.17.151","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal LOS Issue","cams":[{"n":"9","kind":"F","model":"DH-IPC-HFW7843H-Z-X","ip":"10.24.20.188","vlan":"1"}]},"NSK-MIN-CAM-0016":{"cpe":"9","ant":"10.24.17.220","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"10","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.3","vlan":"1"}]},"NSK-MIN-CAM-0008":{"cpe":"10","ant":"10.24.17.213","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"11","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.35","vlan":"1"}]},"NSK-MIN-CAM-0017":{"cpe":"11","ant":"10.24.17.216","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"12","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.4","vlan":"1"}]},"NSK-MIN-CAM-0013":{"cpe":"12","ant":"10.24.17.208","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"13","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.40","vlan":"1"}]},"NSK-MIN-CAM-0011":{"cpe":"13","ant":"10.24.17.168","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"14","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.11","vlan":"1"}]},"NSK-MIN-CAM-0007":{"cpe":"14","ant":"10.24.17.141","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal LOS Issue","cams":[{"n":"15","kind":"F","model":"IPC-HFW5541E-ZE","ip":"10.24.20.160","vlan":"1"}]},"NSK-MIN-CAM-0018":{"cpe":"15","ant":"10.24.17.160","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"16","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.46","vlan":"1"}]},"NSK-MIN-CAM-0005":{"cpe":"16","ant":"10.24.17.158","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"17","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.21","vlan":"1"}]},"NSK-MIN-CAM-0006":{"cpe":"17","ant":"10.24.17.118","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Poor Signal","cams":[{"n":"18","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.174","vlan":"1"}]},"NSK-MIN-CAM-0010":{"cpe":"18","ant":"10.24.17.150","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.99","status":"Good Signal Clear LOS","cams":[{"n":"19","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.5","vlan":"1"}]},"NSK-MIN-CAM-0023":{"cpe":"19","ant":"10.24.17.147","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"20","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.36","vlan":"1"}]},"NSK-MIN-CAM-0024":{"cpe":"20","ant":"10.24.17.209","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal LOS Issue","cams":[{"n":"21","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.122","vlan":"1"}]},"NSK-MIN-CAM-0021":{"cpe":"21","ant":"10.24.17.148","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"22","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.123","vlan":"1"}]},"NSK-MIN-CAM-0025":{"cpe":"22","ant":"10.24.17.154","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"23","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.125","vlan":"1"},{"n":"24","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.126","vlan":"1"}]},"NSK-MIN-CAM-0022":{"cpe":"23","ant":"10.24.17.149","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"25","kind":"F","model":"DH-SD49425XB-HNR","ip":"10.24.20.184","vlan":"1"},{"n":"26","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.162","vlan":"1"}]},"NSK-MIN-CAM-0019":{"cpe":"24","ant":"10.24.17.156","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"27","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.177","vlan":"1"}]},"NSK-MIN-CAM-0026":{"cpe":"25","ant":"10.24.17.153","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"28","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.54","vlan":"1"}]},"NSK-MIN-CAM-0027":{"cpe":"26","ant":"10.24.17.206","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Week Signal LOS Issue","cams":[{"n":"29","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.22","vlan":"1"},{"n":"30","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.23","vlan":"1"}]},"NSK-MIN-CAM-0020":{"cpe":"27","ant":"10.24.17.146","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"31","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.252","vlan":"1"}]},"NSK-JMR-CAM-0005":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"32","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.236","vlan":"300"}]},"NSK-JMR-CAM-0004":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"33","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.151","vlan":"300"}]},"NSK-JMR-CAM-0018":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"34","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.152","vlan":"300"}]},"NSK-JMR-CAM-0019":{"cpe":"28","ant":"10.24.17.232","sector":"ROUCKET","secAnt":"UNIFI 10.24.17.98","status":"Good Signal Clear LOS","cams":[{"n":"35","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.235","vlan":"300"}]},"NSK-JMR-CAM-0001":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"36","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.201","vlan":"1"},{"n":"","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.242","vlan":"300"}]},"NSK-JMR-CAM-0003":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"37","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.111","vlan":"1"}]},"NSK-JMR-CAM-0002":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"38","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.204","vlan":"1"}]},"NSK-JMR-CAM-0014":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"39","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.112","vlan":"1"}]},"NSK-JMR-CAM-0015":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"40","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.109","vlan":"1"}]},"NSK-JMR-CAM-0016":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"41","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.110","vlan":"1"}]},"NSK-JMR-CAM-0011":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"42","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.113","vlan":"1"}]},"NSK-JMR-CAM-0017":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"43","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.108","vlan":"1"}]},"NSK-JMR-CAM-0012":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"44","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.211","vlan":"1"}]},"NSK-JMR-CAM-0013":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"45","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.114","vlan":"1"}]},"NSK-JMR-CAM-0010":{"cpe":"29","ant":"10.24.17.231","sector":"JAMARAT","secAnt":"","status":"Good Signal Clear LOS","cams":[{"n":"46","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.205","vlan":"1"}]},"NSK-JMR-CAM-0006":{"cpe":"30","ant":"10.24.16.56","sector":"JAMARAT","secAnt":"","status":"REACHABLE BY ANTENNA ''VLAN ISSUE''","cams":[{"n":"47","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.20","vlan":"300"}]},"NSK-JMR-CAM-0007":{"cpe":"31","ant":"10.24.16.71","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"48","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.212","vlan":"300"}]},"NSK-JMR-CAM-0008":{"cpe":"32","ant":"10.24.16.81","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"49","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.161","vlan":"300"}]},"NSK-JMR-CAM-0009":{"cpe":"33","ant":"10.24.16.97","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"50","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.70","vlan":"300"}]},"NSK-JMR-CAM-0020":{"cpe":"33","ant":"10.24.16.97","sector":"JAMARAT","secAnt":"","status":"","cams":[{"n":"51","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.69","vlan":"300"}]},"NSK-MIN-CAM-0034":{"cpe":"34","ant":"10.24.16.82","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"REACHABLE \"WEEK SIGNAL\"","cams":[{"n":"52","kind":"F","model":"DH-IPC-HFW7844H-Z-X","ip":"10.24.20.41","vlan":"1"}]},"NSK-MIN-CAM-0035":{"cpe":"35","ant":"10.24.16.133","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Good Signal Clear LOS","cams":[{"n":"53","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.29","vlan":"1"}]},"NSK-MIN-CAM-0033":{"cpe":"36","ant":"10.24.16.85","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Week Signal LOS Issue","cams":[{"n":"54","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.185","vlan":"1"}]},"NSK-MIN-CAM-0032":{"cpe":"37","ant":"10.24.16.172","sector":"BLUE 1","secAnt":"CAMBIUM 10.24.17.101","status":"Good Signal Clear LOS","cams":[{"n":"55","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.237","vlan":"1"}]},"NSK-MIN-CAM-0038":{"cpe":"38","ant":"10.24.16.111","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Poor Signal Device Issue","cams":[{"n":"56","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.86","vlan":"1"}]},"NSK-MIN-CAM-0040":{"cpe":"39","ant":"10.24.16.222","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"57","kind":"P","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.53","vlan":"1"}]},"NSK-MIN-CAM-0044":{"cpe":"40","ant":"10.24.16.217","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal LOS Issue","cams":[{"n":"58","kind":"P","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.239","vlan":"1"},{"n":"59","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.195","vlan":"1"}]},"NSK-MIN-CAM-0036":{"cpe":"41","ant":"10.24.16.44","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"60","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.18","vlan":"1"}]},"NSK-MIN-CAM-0039":{"cpe":"42","ant":"10.24.16.174","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"61","kind":"F","model":"IPC-HFW5541E-ZE","ip":"10.24.20.218","vlan":"1"}]},"NSK-MIN-CAM-0041":{"cpe":"43","ant":"10.24.16.219","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal (Need to replace the location of antenna)","cams":[{"n":"62","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.42","vlan":"1"}]},"NSK-MIN-CAM-0042":{"cpe":"44","ant":"10.24.16.118","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"63","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.105","vlan":"1"}]},"NSK-MIN-CAM-0037":{"cpe":"45","ant":"10.24.16.221","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"64","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.88","vlan":"1"}]},"NSK-MIN-CAM-0043":{"cpe":"46","ant":"10.24.16.232","sector":"BLUE 2","secAnt":"CAMBIUM 10.24.17.102","status":"Week Signal Device Issue","cams":[{"n":"65","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.121","vlan":"1"}]},"NSK-MIN-CAM-0046":{"cpe":"47","ant":"10.24.16.37","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"66","kind":"P","model":"DH-SD49425XB-HNR","ip":"10.24.20.181","vlan":"1"}]},"NSK-MIN-CAM-0049":{"cpe":"48","ant":"10.24.16.73","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"67","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.67","vlan":"1"}]},"NSK-MIN-CAM-0045":{"cpe":"49","ant":"10.24.16.136","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal LOS Issue","cams":[{"n":"68","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.8","vlan":"300"}]},"NSK-MIN-CAM-0047":{"cpe":"50","ant":"10.24.16.63","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Good Signal Clear LOS","cams":[{"n":"69","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.219","vlan":"1"}]},"NSK-MIN-CAM-0051":{"cpe":"51","ant":"10.24.16.122","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"70","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.107","vlan":"1"}]},"NSK-MIN-CAM-0048":{"cpe":"52","ant":"10.24.16.70","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"71","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.189","vlan":"1"}]},"NSK-MIN-CAM-0052":{"cpe":"53","ant":"10.24.16.143","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"72","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.52","vlan":"1"}]},"NSK-MIN-CAM-0053":{"cpe":"54","ant":"10.24.16.17","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal Device Issue","cams":[{"n":"73","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.145","vlan":"1"}]},"NSK-MIN-CAM-0050":{"cpe":"55","ant":"10.24.16.149","sector":"BLUE 3","secAnt":"CAMBIUM 10.24.17.103","status":"Week Signal (Need to replace the antenna by Power beam model)","cams":[{"n":"74","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.155","vlan":"1"}]},"NSK-MIN-CAM-0055":{"cpe":"56","ant":"10.24.17.166","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"75","kind":"F","model":"IPC-HFW2531T-ZS-S2","ip":"10.24.20.131","vlan":"300"}]},"NSK-MIN-CAM-0063":{"cpe":"57","ant":"10.24.16.123","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"76","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.82","vlan":"300"}]},"NSK-MIN-CAM-0058":{"cpe":"58","ant":"10.24.17.142","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"77","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.38","vlan":"300"}]},"NSK-MIN-CAM-0054":{"cpe":"59","ant":"10.24.17.136","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"78","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.13","vlan":"300"}]},"NSK-MIN-CAM-0061":{"cpe":"60","ant":"10.24.16.60","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"79","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.34","vlan":"300"}]},"NSK-MIN-CAM-0062":{"cpe":"61","ant":"10.24.16.231","sector":"CAMBIUM","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"80","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.39","vlan":"300"}]},"NSK-MIN-CAM-0056":{"cpe":"62","ant":"10.24.17.96","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"81","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.87","vlan":"300"}]},"NSK-MIN-CAM-0057":{"cpe":"63","ant":"10.24.17.161","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"82","kind":"F","model":"IPC-HFW5431E-ZE","ip":"10.24.20.90","vlan":"300"}]},"NSK-MIN-CAM-0059":{"cpe":"65","ant":"10.24.17.119","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"84","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.100","vlan":"300"}]},"NSK-MIN-CAM-0060":{"cpe":"68","ant":"10.24.17.144","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"87","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.104","vlan":"300"}]}};
/* (V23.6) أعمدةٌ في التقرير بلا إحداثيات (UNIFI: POLE 21 و23 و24): تُضاف نقطتُها يدويًّا («+ موقع غير مسجّل»
   على الخريطة، ثم «تعديل البيانات») فيحمل اسمُها رقمَ العمود أو الكاميرا — فتظهر بياناتُها في نافذتها */
var CAM_NET_POLES = {"POLE 21":{"cpe":"64","ant":"10.24.17.138","sector":"UNIFI","secAnt":"","status":"VLAN ISSUE","cams":[{"n":"83","kind":"F","model":"DH-IPC-HFW7842H-Z-S2","ip":"10.24.20.7","vlan":"300"}]},"POLE 23":{"cpe":"66","ant":"10.24.17.113","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"85","kind":"F","model":"DH-IPC-HFW7842H-Z-X","ip":"10.24.20.106","vlan":"300"}]},"POLE 24":{"cpe":"67","ant":"10.24.17.117","sector":"UNIFI","secAnt":"","status":"NOT REACHABLE NO LINE OF SIGHT","cams":[{"n":"86","kind":"F","model":"DH-SD8A840N-HNF-PA","ip":"10.24.20.50","vlan":"300"}]}};
function camNetOf(x){
  if (!x) return null;
  if (x.camx) return x.camx;
  if (typeof CAM_NET === 'object' && CAM_NET[x.id]) return CAM_NET[x.id];
  var nmx = String(x.name || '').toUpperCase(), hit = null;
  Object.keys(CAM_NET_POLES).forEach(function(p){
    var c = CAM_NET_POLES[p];
    if (new RegExp('\\b' + p.replace(/\s+/g, '\\s*') + '\\b').test(nmx) || c.cams.some(function(k){ return new RegExp('CAM\\s*' + k.n + '(?!\\d)').test(nmx); })) hit = c;
  });
  return hit;
}
var CAM_SPEC = { 'DH-IPC-HFW7842H-Z-X':'8MP (4K) · 2.7–12mm', 'DH-IPC-HFW7842H-Z-S2':'8MP (4K) · 2.7–12mm', 'DH-SD49425XB-HNR':'4MP · 25x (4.8–120mm)',
  'DH-SD8A840N-HNF-PA':'8MP (4K) · 40x', 'IPC-HFW2531T-ZS-S2':'5MP · 2.7–13.5mm', 'IPC-HFW5431E-ZE':'4MP · 2.7–13.5mm', 'IPC-HFW5541E-ZE':'5MP · 2.7–13.5mm' };   /* [عددُ الكاميرات، [[F|P، عدد]…]، حالةُ الربط، القطاع، موقعٌ تقريبيٌّ داخل الدور] */
var FLOOR_NAMES = ['الأرضي', 'الأول', 'الثاني', 'الثالث', 'الرابع'];
function siteFloor(x){
  if (!x) return null;
  if (x.floor != null && x.floor !== '') return +x.floor;
  var n = String(x.name || ''), m = /الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/.exec(n);
  if (m) return FLOOR_NAMES.indexOf(m[1]);
  var e = /\b(G|1ST|2ND|3RD|4TH)\s*(?:F|FLOOR)\b/i.exec(n);
  return e ? ({ G:0, '1ST':1, '2ND':2, '3RD':3, '4TH':4 })[e[1].toUpperCase()] : null;
}
function floorName(v){ return v == null ? '' : 'الدور ' + (FLOOR_NAMES[v] || String(v)); }
/* (V25.4) نقاطُ الجمرات: مدخلٌ أو مخرج — من الحقل المحفوظ أو من الاسم؛ والاسمُ يحمل الدورَ والبوابةَ معًا (قرارُ المالك: يتضاف) */
function isJmr(x){ return !!x && (/-JMR-/.test(String(x.id || '')) || x.zone === 'الجمرات' || /الجمرات/.test(String(x.name || ''))); }
function siteGate(x){
  if (!x) return null;
  if (x.gate === 'مدخل' || x.gate === 'مخرج') return x.gate;
  var n = String(x.name || '');
  return /مخرج/.test(n) ? 'مخرج' : (/مدخل/.test(n) ? 'مدخل' : null);
}
function jmrNameApply(name, gate, floor){
  var out = String(name || '').trim();
  if (floor != null && floor !== ''){
    var fl = floorName(+floor);
    if (/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/.test(out)) out = out.replace(/الدور\s+(الأرضي|الأول|الثاني|الثالث|الرابع)/, fl);
    else out += ' - ' + fl;
  }
  if (gate === 'مدخل' || gate === 'مخرج'){
    if (/مدخل|مخرج/.test(out)) out = out.replace(/مدخل|مخرج/g, gate);
    else out += ' - ' + gate;
  }
  return out;
}
/* صفوفُ نافذة النقطة للكاميرا: بدالة الصفِّ التي تمرّرها النافذةُ أو صفحةُ الموقع */
function camInfoRows(x, kvf){
  var c = x && CAM_INFO[x.id]; if (!c) return '';
  var kinds = (c[1] || []).map(function(k){ return t(k[0] === 'P' ? 'متحرّكة (PTZ)' : k[0] === 'L' ? 'قارئة لوحات (LPR)' : 'ثابتة (Bullet)') + (k[1] > 1 ? ' \u00d7' + nm(k[1]) : ''); }).join(' \u00b7 ');
  return kvf('الكاميرات', '<b class="num">' + nm(c[0]) + '</b> \u00b7 ' + esc(kinds))
    + (c[2] ? kvf('حالة الربط', esc(t(c[2]))) : '')
    + (c[3] ? kvf('القطاع', '<span dir="ltr">' + esc(c[3]) + '</span>') : '')
    + (c[4] ? kvf('الموقع', '<span class="hint" style="margin:0">' + esc(t('تقريبيٌّ داخل الدور — اضبطه بـ«تحريك» عند الزيارة')) + '</span>') : '');
}
/* ═══ طبقةُ «مسار التفويج» (V23.2) ═══
   «ظبّط layer اسمها مسار التفويج ويبان المخيمات اللي هتتخدم من المسار ده وفي أيّ دور هتوصل».
   من الخطة التشغيلية ١٤٤٧ (الباب الثالث، صفحات ١٠٣–١٠٧): رُبطت المخططاتُ بالخريطة بمخيمات منى
   المسجَّلة نفسِها (مقياسٌ وإزاحةٌ ودورانٌ يُنزِل أكبرَ عددٍ من المخيمات على مضلّعاتها)، ثم لكلِّ دورٍ
   صورةٌ شفافةٌ بمخيماته ومسارَي الذهاب (أصفر) والعودة (أحمر)، ولكلِّ مخيمٍ دورُه. تُحمَّل عند الطلب
   من layers/ (لا تثقل الملفَّ الرئيسيّ) وتُخزَّن للعمل بلا شبكة. */
var TFW = { f:-1, d:'both', data:null, overlay:null, busy:false };   /* (V24.3) f=5 كلُّ الأدوار معًا، وd اتجاهُ العرض: both | go | back */
var TFW_ALL = 5, TFW_COL = ['#F5C400', '#FF7A00', '#3AD6A0', '#4BC9F5', '#C77DFF'];
var TFW_FL = ['الأرضي', 'الأول', 'الثاني', 'الثالث', 'الرابع'];
function tfwLoad(){
  if (TFW.data || TFW.busy || typeof fetch !== 'function') return;
  TFW.busy = true;
  fetch('layers/tafweej.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    TFW.busy = false; if (!d || !d.floors) return;
    TFW.data = d; tfwPaint(); render(1);
  }).catch(function(e){ TFW.busy = false; LS_ERR = e; });
}
function tfwPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try { if (TFW.overlay){ MAP.removeLayer(TFW.overlay); TFW.overlay = null; } } catch (e){ LS_ERR = e; }
  try { if (TFW.lines){ TFW.lines.clearLayers(); } } catch (e){ LS_ERR = e; }
  if (TFW.f < 0 || !TFW.data) return;
  /* (V24.1) الصورُ أُعيدت إلى إطارها الصحيح (كانت مائلةً نحو ثلاث درجات — انظر reg في tafweej.json)،
     وهي تحت لوح النقاط فتبقى النقاطُ فوقها تُرى وتُنقَر. (V24.2) ولم تعد تحمل خطوطَ المسار: الصورةُ
     مساحاتُ مخيمات الدور وحدَها، والمسارُ متجهاتٌ على خطِّ منتصف الممرّ الفعليّ (tafweej-routes.json) */
  if (!MAP.getPane('tfw')){ MAP.createPane('tfw'); MAP.getPane('tfw').style.zIndex = 350; MAP.getPane('tfw').style.pointerEvents = 'none'; }
  if (TFW.f < TFW_ALL) TFW.overlay = L.imageOverlay('layers/tafweej-' + TFW.f + '.png?v=' + (TFW.data.v || 1), TFW.data.bounds, { opacity:0.55, interactive:false, pane:'tfw' }).addTo(MAP);
  tfwLines();
}
/* (V27.8) قرارُ المالك: «لما أختار الدور يظهرلي مخيماته» — مخيماتُ الدور من إسناد المخطط تُظلَّل بحدودها بلون الدور
   (ومع كلِّ الأدوار كلُّ دورٍ بلونه)، فوق صورة المخطط وتحت النقاط. حدودُ المخيمات تُحمَّل عند الحاجة. */
function tfwCampsOf(f){ var A = (TFW.data && TFW.data.assign) || {}; return Object.keys(A).filter(function(id){ return f === TFW_ALL ? A[id] != null : +A[id] === f; }); }
function tfwCampsPaint(){
  if (!MAP || !TFW.data || TFW.f < 0 || !TFW.lines) return;
  if (typeof POLY !== 'object' || !POLY){ if (typeof polyLoad === 'function') polyLoad().then(function(ok){ if (ok && TFW.f >= 0) tfwPaint(); }); return; }
  var A = TFW.data.assign || {}, n = 0;
  Object.keys(A).forEach(function(id){
    var f = +A[id]; if (TFW.f !== TFW_ALL && f !== TFW.f) return;
    var x = siteFind(id), ring = campFoot(x || { id:id, type:'مخيم' }); if (!ring) return;
    var col = TFW_COL[f] || '#F5C400';
    L.polygon(ring, { renderer:MAP_CV, color:col, weight:2, opacity:0.95, fillColor:col, fillOpacity:0.28, interactive:false }).addTo(TFW.lines); n++;
  });
  TFW.campsN = n;
}
/* خطوطُ المسار متجهاتٌ على اللوح نفسِه (V24.2): حادّةٌ في كلِّ تقريب، ومئةُ كيلوبايتٍ للأدوار الخمسة
   تُحمَّل مرةً مع الطبقة — والخطُّ فوق المخيمات وتحت النقاط فلا يحجب نقطةً ولا يُنقَر */
function tfwLines(){
  if (!MAP || !TFW.data || TFW.f < 0) return;
  if (!TFW.routes){
    if (TFW.rbusy || typeof fetch !== 'function') return;
    TFW.rbusy = true;
    fetch('layers/tafweej-routes.json?v=' + (TFW.data.v || 1)).then(function(r){ return r.json(); }).then(function(d){
      TFW.rbusy = false; TFW.routes = d; tfwLines();
      if (TFW.after){ var fn = TFW.after; TFW.after = null; fn(); }
    }).catch(function(e){ TFW.rbusy = false; LS_ERR = e; });
    return;
  }
  if (!TFW.lines) TFW.lines = L.layerGroup().addTo(MAP);
  TFW.lines.clearLayers();
  tfwCampsPaint();   /* (V27.8) مخيماتُ الدور أوّلًا — تحت الخطوط */
  var DRW = tfdDrawn();   /* (V28.0) ما رسمه المهندسُ لدورٍ واتجاهٍ يُعرَض بدل المولَّد */
  if (TFW.camp){   /* (V24.5) مسارُ المخيم المختار وحدَه — أعرضُ خطًّا */
    var cm = [];
    [['back', '#D0021B'], ['go', '#F5C400']].forEach(function(k){ if (TFW.d !== 'both' && TFW.d !== k[0]) return; var ln = L.polyline(TFW.camp[k[0]].pts, { renderer:MAP_CV, color:k[1], weight:6, opacity:0.97, lineCap:'round', lineJoin:'round', interactive:false }); ln.addTo(TFW.lines); cm.push(ln); });
    cm.forEach(function(l){ try { l.bringToBack(); } catch (e){ LS_ERR = e; } });
    Object.keys(MK.by).forEach(function(id){ var e = MK.by[id]; if (e && e.kind === 'poly'){ try { e.l.bringToBack(); } catch (e2){ LS_ERR = e2; } } });
    return;
  }
  /* (V24.3) دورٌ واحدٌ: الذهابُ أصفرُ والعودةُ حمراء — وكلُّ الأدوار: لكلِّ دورٍ لونُه والعودةُ متقطّعة */
  var all = TFW.f === TFW_ALL, floors = all ? ['0', '1', '2', '3', '4'] : [String(TFW.f)], made = [];
  floors.forEach(function(fk){
    var fl = (TFW.routes.floors || {})[fk] || {};
    [['back', '#D0021B'], ['go', '#F5C400']].forEach(function(k){
      if (TFW.d !== 'both' && TFW.d !== k[0]) return;
      var drawn = DRW[fk] && DRW[fk][k[0]] && DRW[fk][k[0]].length ? DRW[fk][k[0]] : null;   /* (V28.0) */
      (drawn || fl[k[0]] || []).forEach(function(pts){
        if (!pts || pts.length < 2) return;
        var ln = L.polyline(pts, { renderer:MAP_CV, color: all ? TFW_COL[+fk] : k[1], weight: all ? 3.5 : (drawn ? 5 : 4), opacity:0.95, dashArray: k[0] === 'back' ? '7 6' : null,   /* (V27.5) العودةُ متقطّعةٌ دائمًا: الجوهرةُ وسوقُ العرب يحملان الاتجاهين معًا فيُرى الاثنان */ lineCap:'round', lineJoin:'round', interactive:false });
        ln.addTo(TFW.lines); made.push(ln);
      });
    });
    /* (V26.0) الدورُ الرابع بالقطار: خطُّ قطار المشاعر (من منى ١ و٢ إلى محطة الجمرات) بلونه ومتقطّعًا — الحجاجُ يركبونه لا يمشونه */
    (fl.train || []).forEach(function(pts){
      if (!pts || pts.length < 2) return;
      var tr = L.polyline(pts, { renderer:MAP_CV, color:'#2F80ED', weight:6, opacity:0.95, dashArray:'14 10', lineCap:'round', lineJoin:'round', interactive:false });
      tr.addTo(TFW.lines); made.push(tr);
    });
  });
  /* (V25.6) «احتمال مخيم»: طرفُ خطٍّ في مخطّط الوزارة بلا مخيمٍ مسجَّلٍ عنده — دائرةٌ متقطّعةٌ بلون دوره، للتحقّق الميداني، وليست نقطةً ولا تُعَدّ */
  (TFW.routes.maybe || []).forEach(function(m){
    if (!all && String(m.floor) !== String(TFW.f)) return;
    if (!(+m.lat) || !(+m.lng)) return;
    L.circleMarker([+m.lat, +m.lng], { renderer:MAP_CV, radius:7, color:TFW_COL[+m.floor] || '#F5C400', weight:2, dashArray:'3 3', fillColor:'#fff', fillOpacity:0.35, bubblingMouseEvents:false })
      .bindPopup('<b>' + esc(t('احتمال مخيم')) + '</b><br><span class="hint">' + esc(t('طرفُ مسارٍ في مخطّط الوزارة بلا مخيمٍ مسجَّل — يُتحقَّق ميدانيًّا')) + ' \u00b7 ' + esc(t(floorName(+m.floor))) + '</span>')
      .addTo(TFW.lines);
  });
  /* الترتيبُ على اللوح: المخيماتُ في الخلف، ثم الخطوط، ثم النقاط */
  made.forEach(function(l){ try { l.bringToBack(); } catch (e){ LS_ERR = e; } });
  Object.keys(MK.by).forEach(function(id){ var e = MK.by[id]; if (e && e.kind === 'poly'){ try { e.l.bringToBack(); } catch (e2){ LS_ERR = e2; } } });
}

/* ═══ مسارُ المخيم (V24.5) ═══
   «لما أختار مخيم بعينه يطلعلي مسار الذهاب والعودة بتاعه ورايح على أنهي دور». من خطوط الدور نفسِها
   (شبكةٌ على الشوارع الفعلية) يُحسَب أقصرُ طريق: الذهابُ من المخيم إلى مداخل المنشأة، والعودةُ من مخرج
   دوره إلى المخيم — ويُرسَمان وحدَهما مع المسافة ووقت المشي (٦٠ م في الدقيقة: سيرُ الزحام). */
var TFW_JIN = [21.4199, 39.8747], TFW_JEX = ['0014', '0017', '0020', '0023', '0026'];
function tfwM(a, b){ var dy = (a[0] - b[0]) * 110574, dx = (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180); return Math.sqrt(dx * dx + dy * dy); }
function tfwNet(lines){
  var id = {}, P = [], A = [];
  var node = function(p){ var k = p[0].toFixed(6) + ',' + p[1].toFixed(6); if (id[k] == null){ id[k] = P.length; P.push(p); A.push([]); } return id[k]; };
  (lines || []).forEach(function(l){ for (var i = 1; i < l.length; i++){ var a = node(l[i - 1]), b = node(l[i]), d = tfwM(l[i - 1], l[i]); A[a].push([b, d]); A[b].push([a, d]); } });
  return { P:P, A:A };
}
function tfwNear(N, p){ var bi = -1, bd = Infinity; for (var i = 0; i < N.P.length; i++){ var d = tfwM(N.P[i], p); if (d < bd){ bd = d; bi = i; } } return [bi, bd]; }
function tfwPath(N, s, t){
  var n = N.P.length, D = [], prev = [], H = [[0, s]], i;
  for (i = 0; i < n; i++){ D.push(Infinity); prev.push(-1); }
  D[s] = 0;
  var push = function(x){ H.push(x); var k = H.length - 1; while (k > 0){ var q = (k - 1) >> 1; if (H[q][0] <= H[k][0]) break; var tmp = H[q]; H[q] = H[k]; H[k] = tmp; k = q; } };
  var pop = function(){ var top = H[0], last = H.pop(); if (H.length){ H[0] = last; var k = 0; for (;;){ var l = 2 * k + 1, r = l + 1, m = k; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === k) break; var tmp = H[m]; H[m] = H[k]; H[k] = tmp; k = m; } } return top; };
  H = []; push([0, s]);
  while (H.length){
    var cur = pop(), u = cur[1];
    if (cur[0] > D[u]) continue;
    if (u === t) break;
    N.A[u].forEach(function(e){ var nd = D[u] + e[1]; if (nd < D[e[0]]){ D[e[0]] = nd; prev[e[0]] = u; push([nd, e[0]]); } });
  }
  if (!isFinite(D[t])) return null;
  var pts = []; for (var v = t; v !== -1; v = prev[v]) pts.push(N.P[v]);
  return { pts:pts.reverse(), len:D[t] };
}
function tfwCampCalc(id){
  var f = tfwFloorOf(id), x = siteFind(id), R = TFW.routes && TFW.routes.floors ? TFW.routes.floors[String(f)] : null;
  if (f == null || !x || !R) return null;
  var c = [x.lat, x.lng], ex = siteFind('NSK-JMR-PNT-' + TFW_JEX[f]), E = ex ? [ex.lat, ex.lng] : TFW_JIN;
  var G = tfwNet((R.go || []).concat(R.train || [])), B = tfwNet((R.back || []).concat(R.train || [])), EN = (TFW.routes.ends || {}).en || {}, EX = (TFW.routes.ends || {}).ex || {};   /* (V26.0) خطُّ القطار جزءٌ من شبكة الدور الرابع */
  var a = tfwNear(G, c), h = tfwNear(B, c), p1 = null, p2 = null;
  /* (V24.8) الذهابُ ينتهي عند أقرب مدخلٍ من مداخل دوره، والعودةُ تبدأ من أقرب مخرجٍ من مخارجه — لا عند نقطةٍ ثابتة */
  (EN[f] || []).concat(EN[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, tp = q ? [q.lat, q.lng] : TFW_JIN, b = tfwNear(G, tp), p = a[0] >= 0 && b[0] >= 0 ? tfwPath(G, a[0], b[0]) : null; if (p && (!p1 || p.len < p1.len)) p1 = p; });
  (EX[f] || []).concat(EX[f] ? [] : ['']).forEach(function(k){ var q = k ? siteFind('NSK-JMR-PNT-' + k) : null, sp = q ? [q.lat, q.lng] : E, e = tfwNear(B, sp), p = e[0] >= 0 && h[0] >= 0 ? tfwPath(B, e[0], h[0]) : null; if (p && (!p2 || p.len < p2.len)) p2 = p; });
  if (!p1 || !p2) return null;
  return { id:id, f:f, go:{ pts:[c].concat(p1.pts), len:Math.round(p1.len + a[1]) }, back:{ pts:p2.pts.concat([c]), len:Math.round(p2.len + h[1]) } };
}
function tfwCampRoute(id){
  var f = tfwFloorOf(id); if (f == null) return;
  TFW.f = f; TFW.camp = null;
  var show = function(){
    var r = tfwCampCalc(id);
    if (!r){ toast(t('تعذر حساب مسار هذا المخيم')); return; }
    TFW.camp = r; tfwPaint(); render(1);
    try { MAP.fitBounds(L.latLngBounds(r.go.pts.concat(r.back.pts)), { padding:[40, 40] }); } catch (e){ LS_ERR = e; }
  };
  if (TFW.routes && TFW.data) show(); else { TFW.after = show; tfwLoad(); tfwPaint(); }
}

function tfwFloorOf(id){ return (TFW.data && TFW.data.assign && TFW.data.assign[id] != null) ? TFW.data.assign[id] : null; }
function tfwRow(){
  /* (V26.5) قرارُ المالك: صفٌّ واحدٌ للأدوار (صفُّ النقاط أدناه) يحكم المسارَ والنقاطَ معًا — وهنا إظهارُ المسار وإخفاؤه فقط */
  var h = '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">\u{1F6B6} ' + esc(t('مسار التفويج')) + '</span>'
    + '<button type="button" class="cat' + (TFW.f < 0 ? ' on' : '') + '" data-tfw="-1">' + esc(t('إخفاء')) + '</button>'
    + '<button type="button" class="cat' + (TFW.f >= 0 ? ' on' : '') + '" data-tfw="show">' + esc(t('إظهار')) + '</button>'
    + (TFW.f >= 0 ? '<span class="hint" style="margin:0 4px;align-self:center">' + (TFW.f === TFW_ALL ? esc(t('كل الأدوار — اختر الدور من صف الأدوار')) : esc(t('الدور') + ' ' + t(TFW_FL[TFW.f]))) + '</span>' : '') + '</div>';
  /* (V24.3) الاتجاه: الذهابُ والعودةُ معًا أو كلٌّ وحدَه — ومع «كل الأدوار» لكلِّ دورٍ لونُه والعودةُ متقطّعة */
  if (TFW.f >= 0) h += '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('الاتجاه')) + '</span>' + [['both', 'الذهاب والعودة'], ['go', 'الذهاب فقط'], ['back', 'العودة فقط']].map(function(o){
      return '<button type="button" class="cat' + (TFW.d === o[0] ? ' on' : '') + '" data-tfwd="' + o[0] + '">' + esc(t(o[1])) + '</button>'; }).join('') + '</div>';
  if (TFW.f >= 0 && TFW.f < TFW_ALL && TFW.data) h += '<div class="tfw-card"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;background:' + (TFW_COL[TFW.f] || '#F5C400') + '55;border:2px solid ' + (TFW_COL[TFW.f] || '#F5C400') + '"></i> ' + esc(t('مخيمات الدور')) + ' ' + esc(t(TFW_FL[TFW.f])) + ': <b>' + nm(tfwCampsOf(TFW.f).length) + '</b> ' + esc(t('مخيمًا')) + ' \u2014 ' + esc(t('مظلّلةٌ على الخريطة بلون الدور')) + '</div>';   /* (V27.8) */
  if (TFW.f === TFW_ALL) h += '<div class="tfw-card">' + TFW_FL.map(function(n, i){ return '<span style="display:inline-flex;align-items:center;gap:5px;margin-inline-end:12px"><i style="width:18px;height:4px;border-radius:2px;background:' + TFW_COL[i] + '"></i>' + esc(t('الدور') + ' ' + t(n)) + ' <span class="num">' + nm(tfwCampsOf(i).length) + '</span> ' + esc(t('مخيمًا')) + '</span>'; }).join('')
      + '<div class="hint" style="margin:4px 0 0;font-size:11px">' + esc(t('الخط المتصل: الذهاب · المتقطع: العودة')) + '</div></div>';
  if (TFW.camp){ var cs = siteFind(TFW.camp.id), mins = function(m){ return nm(Math.max(1, Math.round(m / 60))); };
    h += '<div class="tfw-card"><b>' + esc(t('مسار المخيم')) + ': ' + esc(cs ? siteTitle(cs) : TFW.camp.id) + '</b> \u2014 ' + esc(t('الدور') + ' ' + t(TFW_FL[TFW.camp.f]))
      + '<div style="margin:4px 0 0"><i style="display:inline-block;width:16px;height:4px;border-radius:2px;background:#F5C400;vertical-align:middle"></i> ' + esc(t('الذهاب')) + ' <b class="num">' + nm(TFW.camp.go.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + mins(TFW.camp.go.len) + ' ' + esc(t('دقيقة مشيا'))
      + ' \u2003 <i style="display:inline-block;width:16px;height:4px;border-radius:2px;background:#D0021B;vertical-align:middle"></i> ' + esc(t('العودة')) + ' <b class="num">' + nm(TFW.camp.back.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + mins(TFW.camp.back.len) + ' ' + esc(t('دقيقة مشيا')) + '</div>'
      + '<div style="margin:6px 0 0">' + btn('إلغاء', 'btn-quiet btn-sm', ' data-tfwcampx="1"') + '</div></div>'; }
  var F = TFW.f >= 0 && TFW.f < TFW_ALL && TFW.data ? TFW.data.floors[TFW.f] : null;
  if (TFW.f >= 0 && !TFW.data) h += '<p class="hint" style="margin:4px 0 0">' + esc(t('تُحمَّل الطبقة…')) + '</p>';
  if (F){
    var by = Object.keys(F.near.by || {}).map(function(k){ return typeLabel(k) + ' ' + nm(F.near.by[k]); }).join(' \u00b7 ');
    h += '<div class="tfw-card"><b>' + esc(t('الدور') + ' ' + t(F.name)) + '</b> \u2014 ' + nm(F.camps) + ' ' + esc(t('مخيمًا من مخيماتنا يخدمها هذا الدور'))
      + '<div class="hint" style="margin:4px 0 0">' + esc(t('أطولُ مسارٍ ذهابًا وعودة')) + ' <b class="num">' + nm(F.len) + '</b> ' + esc(t('م')) + ' \u00b7 ' + esc(t('العرضُ الأدنى')) + ' <b class="num">' + nm(F.width) + '</b> ' + esc(t('م'))
      + ' \u00b7 ' + esc(t('فرقُ المنسوب')) + ' <b class="num">' + nm(F.elev) + '</b> ' + esc(t('م')) + ' \u00b7 ' + esc(t(F.lift)) + '</div>'
      + '<div style="margin:4px 0 0">' + esc(t('ملاحظة الوزارة')) + ': ' + esc(t(F.note)) + (F.rec && F.rec !== '\u2014' ? ' \u2014 <b>' + esc(t('المقترح')) + ':</b> ' + esc(t(F.rec)) : '') + '</div>'
      + '<div class="hint" style="margin:4px 0 0">' + esc(t('نقاطُنا على مسار هذا الدور (٤٠ م)')) + ': <b class="num">' + nm(F.near.n) + '</b> \u2014 ' + esc(by) + '</div>'
      + '<div class="hint" style="margin:4px 0 0;font-size:11px">' + esc(t('المصدر')) + ': ' + esc(TFW.data.src) + ' \u00b7 ' + esc(t('أصفر: الذهاب · أحمر: العودة')) + '</div></div>';
  }
  return h;
}
function catBar(withWork){
  var C = catCounts(), S = siteStats();
  var zones = TAX_G.filter(function(g){ return C.zone[g]; });   /* (V27.2) بترتيب المالك */
  var types = TAX_T.filter(function(ty){ return C.type[ty]; });

  var h = '<div class="catbar"><div class="catrow">'
    + '<button type="button" class="cat zone' + (FILT.zone?'':' on') + '" data-fz="">'
    +   esc(t('الكل')) + ' <span class="n">' + nm(S.total) + '</span></button>'
    + zones.map(function(z){
        return '<button type="button" class="cat zone' + (FILT.zone===z?' on':'') + '" data-fz="' + esc(z) + '">'
          + esc(z) + ' <span class="n">' + nm(C.zone[z]) + '</span></button>';
      }).join('')
    + '</div><div class="catrow">';

  h += types.map(function(ty){
    var d = TAX_DEF[ty] || { l:ty, i:'\u25CF', c:'#8A939D' };   /* (V27.2) */
    var on = FILT.type === ty;
    return '<button type="button" class="cat' + (on?' on':'') + '" data-ft="' + esc(ty) + '"'
      + ' style="border-color:' + d.c + (on ? ';background:' + d.c + '22;color:' + d.c : '') + '">'
      + d.i + ' ' + esc(t(d.l)) + ' <span class="n">' + nm(C.type[ty]) + '</span></button>';
  }).join('');
  h += '</div>';

  /* صفُّ المسارات: يُشتقُّ من النقاط نفسِها فلا يُكتَب بيد، ولا يظهر إن لم يُرسَم مسارٌ بعد */
  {
    var RT = routesList(), rks = Object.keys(RT).sort(function(a, b){ return RT[b] - RT[a]; });
    if (rks.length){
      h += '<div class="catrow">'
        + '<button type="button" class="cat' + (FILT.route ? '' : ' on') + '" data-fr="">'
        +   esc(t('كل المسارات')) + '</button>'
        + rks.map(function(k){
            return '<button type="button" class="cat' + (FILT.route === k ? ' on' : '') + '" data-fr="' + esc(k) + '">'
              + '\u{1F6E3} ' + esc(k) + ' <span class="n">' + nm(RT[k]) + '</span></button>';
          }).join('')
        + '</div>';
    }
  }
  if (CUR === 'map') h += tfwRow();   /* (V23.2) طبقةُ مسار التفويج */
  /* صفُّ الأدوار (V22.2): يظهر حين تحمل النقاطُ أدوارًا — منشأةُ الجمرات أرضيٌّ وأربعة */
  {
    var FC = {};
    STATE.sites.forEach(function(x){ var f = siteFloor(x); if (f == null) return; if (FILT.zone && taxOf(x).g !== FILT.zone) return; if (FILT.type && taxOf(x).t !== FILT.type) return; FC[f] = (FC[f] || 0) + 1; });
    var fks = Object.keys(FC).map(Number);
    if (typeof TFW === 'object' && TFW.f >= 0) [0, 1, 2, 3, 4].forEach(function(f){ if (fks.indexOf(f) < 0) fks.push(f); });   /* (V26.5) والمسارُ ظاهرٌ: الأدوارُ كلُّها تُختار ولو بلا نقاط */
    fks.sort(function(a, b){ return a - b; });
    if (fks.length > 1){
      var fon = FILT.floor !== '' && FILT.floor != null;
      h += '<div class="catrow">'
        + '<button type="button" class="cat' + (fon ? '' : ' on') + '" data-ffl="">' + esc(t('كل الأدوار')) + '</button>'
        + fks.map(function(f){ return '<button type="button" class="cat' + (fon && +FILT.floor === f ? ' on' : '') + '" data-ffl="' + f + '">\u{1F3E2} ' + esc(t(floorName(f))) + (FC[f] ? ' <span class="n">' + nm(FC[f]) + ' ' + esc(t('نقطة')) + '</span>' : '') + '</button>'; }).join('')
        + '</div>';
    }
  }
  if (withWork){
    var wks = Object.keys(C.work).sort(function(a,b){ return C.work[b] - C.work[a]; });
    if (wks.length > 1){
      h += '<div class="catrow">'
        + '<button type="button" class="cat' + (FILT.work?'':' on') + '" data-fw="">'
        +   esc(t('كل الأوجه')) + '</button>'
        + wks.map(function(k){
            return '<button type="button" class="cat' + (FILT.work===k?' on':'') + '" data-fw="' + esc(k) + '">'
              + esc(k) + ' <span class="n">' + nm(C.work[k]) + '</span></button>';
          }).join('')
        + '</div>';
    }
  }
  /* ═══ صفُّ الحالة: ما حدث للنقطة — لا أين هي وما نوعُها فقط ═══
     الأعدادُ تُحسَب على ما مرّ من المرشِّحات الأخرى، وكلُّ حالةٍ بلونها في الخريطة */
  if (typeof lifeOf === 'function' && typeof LIFE_ORDER !== 'undefined'){
    var lc = {}, base = STATE.sites.filter(function(x){
      if (FILT.zone && taxOf(x).g !== FILT.zone) return false;
      if (FILT.type && taxOf(x).t !== FILT.type) return false;
      if (FILT.work && x.work !== FILT.work) return false;
      if (CO_SEL.length && CO_SEL.indexOf(x.co) < 0) return false;
      return true;
    });
    base.forEach(function(x){ var l = lifeOf(x); lc[l] = (lc[l] || 0) + 1; });
    var lifeKeys = LIFE_ORDER.filter(function(k){ return lc[k]; });
    if (lifeKeys.length){
      h += '<div class="catrow">'
        + '<button type="button" class="cat' + (FILT.life ? '' : ' on') + '" data-fl="">' + esc(t('كل الحالات')) + '</button>'
        + lifeKeys.map(function(k){
            var L = LIFE[k], on = FILT.life === k;
            return '<button type="button" class="cat' + (on ? ' on' : '') + '" data-fl="' + esc(k) + '"'
              + ' style="border-color:' + L.c + (on ? ';background:' + L.c + '22;color:' + L.c : '') + '">'
              + '<span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:' + L.c + ';margin-inline-end:4px"></span>'
              + esc(t(L.n)) + ' <span class="n">' + nm(lc[k]) + '</span></button>';
          }).join('')
        + '</div>';
    }
  }
  h += '</div>';
  return h;
}

/* المرشَّحُ يُبنى مرةً ويُخزَّن حتى يتغيّر الترشيح */
var FILT_CACHE = null, FILT_KEY = '';

function filtered(){
  var k = FILT.zone + '|' + FILT.type + '|' + FILT.work + '|' + FILT.life + '|' + STAT_VER
        + '|' + CO_SEL.join(',');
  if (FILT_CACHE && FILT_KEY === k) return FILT_CACHE;
  FILT_KEY = k;
  FILT_CACHE = filtOn() ? STATE.sites.filter(filtPass) : STATE.sites;
  return FILT_CACHE;
}

/* ═══ تفاصيل النقطة الكاملة ═══ */
var DETAIL_ID = '';

/* يُوسَم شريطُ الصور في شاشة الموقع أدناه */
PAGE.site = { m:'الميدان', t:'تفاصيل الموقع', l:'كلُّ ما عن نقطةٍ واحدة: بيانُها وزيارتُها وتركيبُها وصورُها وسجلُّها — تُفتَح من الخريطة أو من القوائم.',
  body:function(){
    var x = siteFind(DETAIL_ID) || STATE.sites[0];
    if (!x) return alertBox('warn','لا مواقع محمّلة.');
    var d = CAT_DEF[x.type] || { l:x.type, i:'\u25CF', c:'#8A939D' };
    var rec = STATE.recs[x.id], ins = STATE.inss[x.id];
    var sv = !!rec, st = (ins && ins.status) || x.fstat || 'لم يبدأ';

    function row(k, v, edit){
      if (v === '' || v == null) return '';
      return '<div><span class="k">' + esc(t(k)) + '</span>'
        + '<span>' + v + (edit ? ' ' + btn('تعديل','btn-quiet btn-sm',' data-edit="' + edit + '"') : '')
        + '</span></div>';
    }

    return card(d.i + ' ' + esc(x.name),
        '<div class="pid" style="margin:0 0 10px">' + bdi(siteKey(x)) + (siteKey(x) !== x.id ? ' \u00b7 ' + bdi(x.id) : '') + '</div>'
        + '<div class="chips" style="margin:0 0 12px">'
        +   pill(x.zone,'acc') + ' ' + '<span class="pill" style="background:' + d.c + '22;color:' + d.c + '">'
        +   d.i + ' ' + esc(t(d.l)) + '</span> '
        +   (x.work ? pill(x.work,'info') : '') + ' '
        +   pill(sv ? 'تمت الزيارة' : 'لم يُزر', sv ? 'ok' : 'warn') + ' '
        +   pill(st, st==='مُركّب' ? 'ok' : (st==='متعذّر' ? 'off' : ''))
        + '</div>'
        + '<div class="actions">'
        + '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener"'
        + ' href="https://www.google.com/maps/dir/?api=1&destination=' + x.lat + ',' + x.lng + '">'
        + '↗ ' + esc(t('اتجاهات')) + '</a>'
        + btn('◈ ' + t('على الخريطة'),'btn-secondary btn-sm',' data-fly="' + esc(x.id) + '"')
        + btn('🔍 ' + t('امسح هذا الموقع'),'btn-secondary btn-sm',' data-form="' + esc(x.id) + '"')
        + '</div>')

      + (SITE_ED && maySiteEditBasic() ? siteEditHtml(x) : '')   /* (V28.6) */
      + card('بيانات الموقع',
          '<div class="pop-rows" style="margin:0">'
          + row('اسم الموقع', esc(x.name), 'name')
          + row('رقم المربع', x.sq ? '<span class="num">' + esc(x.sq) + '</span>' : '', 'sq')
          + row('رقم الشاخص', x.sign ? '<span class="num">' + esc(x.sign) + '</span>' : '', 'sign')
          + row('المشعر', esc(x.zone), 'zone')   /* (V27.4) قرارُ المالك: كلُّ صفٍّ في البطاقة له «تعديل» — المشعرُ والتصنيفُ والمنطقةُ والإحداثياتُ والدور */
          + row('التصنيف', d.i + ' ' + esc(t(d.l)), 'type')
          + row('وجه العمل', esc(t(x.work)), 'work')
          + row('المنطقة', esc(x.region || '\u2014'), 'region')
          + row('الدور', siteFloor(x) != null ? esc(t(floorName(siteFloor(x)))) : '', 'floor')   /* (V22.2) */
          + camInfoRows(x, function(k, v){ return row(k, v); }) + camxRows(x, function(k, v){ return row(k, v); }) + netRows(x, function(k, v){ return row(k, v); })
          + row('شركة الخدمة / المشغّل', esc(x.co), 'co')
          + row('تصنيف الحجاج', esc(t(x.inout === 'خارج' ? 'حجاج خارج' : (x.inout === 'داخل' ? 'حجاج داخل' : x.inout))), 'inout')
      /* بيانةُ الموسم الماضي في التفاصيل كما هي في النموذج: من فتح النقطةَ
         ليقرأها لم يجد ما يقرؤه، فيرجع إلى ملفٍ خارج النظام. */
      + (function(){
          if (!S47){ s47Load(); return ''; }
          var v = s47Of(x.id);
          if (!v) return '';
          return [['nat','الجنسية'], ['dom','الجهة المصرِّحة'],
                  ['cap','السعة المسجّلة ١٤٤٧'], ['pct','نسبة إنجاز ١٤٤٧'],
                  ['dj','عدد أجهزة ١٤٤٧'], ['tst','حالة الاختبار'],
                  ['obst','عائقٌ مسجَّل'], ['iss','ملاحظةٌ مسجَّلة'],
                  ['team','الفريق المسجَّل']]
            .filter(function(r2){ return v[r2[0]]; })
            .map(function(r2){ return row(r2[1], esc(v[r2[0]])); }).join('');
        })()
      /* نقطةُ الاتصال والعناوينُ الثلاثةُ المشتقّةُ منها */
      + (function(){
          var v = S47 ? s47Of(x.id) : null;
          var base = x.net || (v && v.sub) || '';
          if (!base) return '';
          base = String(base).replace(/\.+$/, '');
          return row('نقطة الاتصال', '<span class="num">' + esc(base) + '.0/24</span>')
            + row('راوتر',  '<span class="num">' + esc(x.ipRtr || (base + '.1')) + '</span>')
            + row('قارئ',   '<span class="num">' + esc(x.ipRdr || (base + '.2')) + '</span>')
            + row('كاميرا', '<span class="num">' + esc(x.ipCam || (base + '.3')) + '</span>');
        })()
          + row('الإحداثيات', '<span class="num">' + x.lat.toFixed(6) + ', ' + x.lng.toFixed(6) + '</span>', 'lat')
          + '</div>')

      + (rec
        ? card('المسح',
            '<div class="pop-rows" style="margin:0">'
            + row('المنفِّذ', esc(rec.by))
            + row('التاريخ', '<span class="num">' + fmtDT2(rec.at, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) + '</span>')
            + row('نوع التركيب', esc(rec.mount))
            + row('مصدر الكهرباء', esc(rec.power))
            + row('ارتفاع التركيب', rec.height ? nm(rec.height) + ' م' : '')
            + row('طول الكابل', rec.cable ? nm(rec.cable) + ' م' : '')
            + row('الصور', nm((rec.photos || []).length))
            + '</div>'
            + ((rec.chals || []).length
              ? '<div class="chips" style="margin:11px 0 0">'
                + rec.chals.map(function(c){ return pill(c,'warn'); }).join(' ') + '</div>'
              : '')
            + (rec.note ? '<p class="hint">' + esc(rec.note) + '</p>' : ''))
        : card('المسح', '<p class="hint" style="margin:0">' + esc(t('لم تتم زيارتها بعد.')) + '</p>',
            btn('امسح الآن','btn-primary btn-sm',' data-form="' + esc(x.id) + '"')))

      + (ins
        ? card('التركيب',
            '<div class="pop-rows" style="margin:0">'
            + row('الحالة', pill(ins.status, ins.status==='مُركّب'?'ok':''))
            + row('المنفِّذ', esc(ins.by))
            + row('النقاط', N(ins.pts || 0))
            + row('بادئة الشبكة', ins.prefix ? '<span class="num" dir="ltr">' + esc(ipsOf(ins.prefix)) + '</span>' : '')
            + row('الاعتماد', ins.approved ? pill('معتمد','ok') : pill('بانتظار التدقيق','warn'))
            + '</div>'
            + (Object.keys(ins.parts || {}).length
              ? table(['القطعة','الكمية','السيريال'],
                  Object.keys(ins.parts).map(function(k){
                    var it = itemsList().filter(function(i){ return i.code === k; })[0];
                    return [esc(it ? it[2] : k), N(ins.parts[k]),
                            '<span class="num">' + esc((ins.serials || {})[k] || '—') + '</span>'];
                  }))
              : ''))
        : '')

      + photoStrip(x.id)
      + card('دورة هذه النقطة',
          flow(['مسح','اعتماد المسح','جدولة','تركيب','تدقيق','مُركّب'],
               ins && ins.approved ? 5 : (ins ? 4 : (sv ? 1 : 0))))
      /* سجلُّ النقطة: من فعل ماذا ومتى — من أوّل يوم (V17.20) */
      + siteLogHtml(x.id);
  }};

/* ── الخريطة والقائمة تتبعان الترشيح ── */
/* ═══ نقاطُ الفنيين — تُحسب من العمل لا تُكتب ═══
   الأوزانُ في الإعدادات لا تتغيّر، وكلُّ ما يعمله الفنيُّ يُوزَن بها:
   زيارةٌ بوزنها، وتركيبٌ بنقاط قطعه، وفكٌّ بوزنه في معامل حالته.
   فيرى كلٌّ ما عمله ورقمَه بين فريقه، ويرى المهندسُ الجميع. */

var STAGE_ROLES = {
  eng:   { n:'مهندسو المناطق', i:'\u{1F393}', kinds:['visit','install'],
           d:'يديرون مناطقهم ويعتمدون ما يُرفَع فيها.' },
  cfg:   { n:'فنيو التهيئة',   i:'\u{1F6E0}', kinds:['prep'],
           d:'ضبطُ الجهاز وعنوانه ونظامه قبل النزول.' },
  asm:   { n:'فنيو التجميع',   i:'\u{1F9F0}', kinds:['asm'],
           d:'تركيبُ ما يدخل البوكس وتوصيلُه.' },
  ins:   { n:'فنيو التركيب',   i:'\u{1F527}', kinds:['install'],
           d:'تركيبُ النقطة في موقعها وتوثيقُها.' },
  srv:   { n:'فنيو المسح',     i:'\u{1F50D}', kinds:['visit'],
           d:'الزيارةُ الميدانيةُ وجمعُ ما لا يُعرف.' },
  dis:   { n:'فنيو الفك',      i:'\u{1F9E9}', kinds:['dis'],
           d:'الفكُّ وإرجاعُ العُهدة بحالتها.' }
};

/* لكلِّ فنيٍّ مرحلتُه — تُضبط في إسناد الأدوار */
var TECH_STAGE = {
  'أحمد':'ins', 'سالم':'ins', 'ماجد':'ins',
  'ياسر':'cfg', 'عبدالله':'ins', 'طارق':'ins',
  'خالد':'eng', 'فهد':'eng', 'محمد صفوت':'eng'
};

function stageOf(name){
  /* مرحلةُ الشخص من وظيفته: دورُ الوظيفة يقرّر الدورةَ التي يظهر فيها */
  var x = techsList().filter(function(y){ return y.n === name; })[0];
  var role = x && x.job ? (jobOf(x.job) || {}).role : '';
  var map = { tech:'srv', cprep:'prep', casm:'asm', cins:'ins' };
  if (map[role]) return map[role];
  return TECH_STAGE[name] || 'srv';
}

/* ── حصادُ العمل: يُمشَّط السجلُّ مرةً ويُخزَّن ── */
var SCORE_CACHE = null, SCORE_VER = -1;

/* ── نقاطُ الزيادة اليدوية: يضيفها مشرفٌ أو مهندسٌ بسببٍ مكتوب ──
   ليست تصحيحًا صامتًا لرقمٍ، بل سطرٌ جديدٌ له صاحبٌ ووقتٌ وسببٌ — يُحذَف
   لا يُعدَّل، فمن أراد تصويبَه أضاف سطرًا يُلغيه بسببٍ آخر. */
function bonusList(){ return Object.keys(STATE.bonus || {}).map(function(k){ return STATE.bonus[k]; }); }
function bonusFor(name){
  return bonusList().filter(function(b){ return b.tech === name; })
    .reduce(function(a,b){ return a + cfgN(b.pts); }, 0);
}
/* نقاطُ الزيادة قرارٌ فوق الميدان: المهندسُ ومديرُ المشروع والإدارةُ العليا —
   لا المشرف؛ فالمشرفُ يقيّم فريقَه بالتقرير لا بالنقاط، والنقاطُ تدخل
   المستحقَّ فلا تُترَك لمن يعمل مع من يقيّمه يومًا بيوم. */
function mayBonus(){ return rankOf(ROLE) >= rankOf('engineer'); }
function bonusAdd(tech, pts, note){
  if (!mayBonus()){ toast(t('نقاطُ الزيادة للمهندس ومدير المشروع فما فوق')); return; }
  tech = String(tech || '').trim();
  var p = cfgN(pts);
  if (!tech){ toast(t('اختر الفنيَّ أولًا')); return; }
  if (!p){ toast(t('اكتب عدد نقاطٍ غيرَ صفر')); return; }
  var id = 'bn' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  var b = { id:id, tech:tech, pts:p, note:String(note || '').trim(),
            by:STATE.meta.name || '', at:Date.now() };
  if (!STATE.bonus) STATE.bonus = {};
  STATE.bonus[id] = b;
  CORE.set('bonus', id, b);
  logEvent((p > 0 ? 'إضافة' : 'خصم') + ' نقاط زيادة — ' + tech + ' \u00b7 ' + nm(Math.abs(p))
           + (note ? ' \u00b7 ' + note : ''));
  toast(tech + ' \u00b7 ' + (p > 0 ? '+' : '') + nm(p) + ' ' + t('نقطة'));
  statBump();
  render(1);
}
function bonusDel(id){
  if (!mayBonus()){ toast(t('حذفُ نقاط الزيادة للمشرف أو المهندس وحدهما')); return; }
  var b = STATE.bonus && STATE.bonus[id];
  if (!b) return;
  delete STATE.bonus[id];
  CORE.dirty('bonus', id, null);
  logEvent('حذف سطر نقاط زيادة — ' + b.tech + ' \u00b7 ' + nm(b.pts));
  toast(t('حُذف السطر'));
  statBump();
  render(1);
}

function scores(){
  if (SCORE_CACHE && SCORE_VER === STAT_VER) return SCORE_CACHE;
  var by = Object.create(null);

  function ent(who){
    if (!who) who = '—';
    if (!by[who]) by[who] = {
      name:who, stage:stageOf(who),
      survey:0, install:0, dis:0, prep:0, asm:0,
      pSurvey:0, pInstall:0, pDis:0, pPrep:0, pAsm:0, pBonus:0, total:0,
      installT:Object.create(null), disT:Object.create(null), surveyT:Object.create(null),
      days:Object.create(null), last:0
    };
    return by[who];
  }

  /* المسح: كلُّ سجلٍّ بوزن نقطته */
  Object.keys(STATE.recs).forEach(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return;
    var e = ent(r.by), pS = ptsSurvey(x);
    e.survey++;
    e.pSurvey += pS;
    /* بنوع الموقع: كم مخيمًا وكم ممرًّا مسح كلٌّ فعلًا — بالعدد والنقاط (V18.6) */
    var sT = catLabel(x) || x.type || 'أخرى';
    if (!e.surveyT[sT]) e.surveyT[sT] = { n:0, pts:0 };
    e.surveyT[sT].n++; e.surveyT[sT].pts += pS;
    var day = dayKey(r.at || Date.now());
    e.days[day] = (e.days[day] || 0) + 1;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* التركيب: المعتمدُ وحده يُحتسب — كما هو الأصل، ومصنَّفٌ بنوع الموقع
     (مخيمٌ أو ممرٌّ أو غيرهما) لأن لكلٍّ وزنَه المستقل */
  Object.keys(STATE.inss).forEach(function(id){
    var r = STATE.inss[id], x = siteFind(id);
    if (!x || r.status !== 'مُركّب') return;
    var e = ent(r.by), p = r.approved ? ptsInstall(x) : 0;
    e.install++;
    e.pInstall += p;
    if (!e.installT[x.type]) e.installT[x.type] = { n:0, pts:0 };
    e.installT[x.type].n++;
    e.installT[x.type].pts += p;
    var day = dayKey(r.at || Date.now());
    e.days[day] = (e.days[day] || 0) + 1;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* الفك: بحالته ومعاملها، ومصنَّفٌ بنوع الموقع كالتركيب تمامًا */
  if (STATE.diss) Object.keys(STATE.diss).forEach(function(id){
    var r = STATE.diss[id], x = siteFind(id);
    if (!x || r.status !== 'تم الفك') return;
    var e = ent(r.by), p = r.pts || ptsDis(x);
    e.dis++;
    e.pDis += p;
    if (!e.disT[x.type]) e.disT[x.type] = { n:0, pts:0 };
    e.disT[x.type].n++;
    e.disT[x.type].pts += p;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* الورشة: التهيئةُ والتجميعُ من دفتر الحركة */
  STATE.moves.forEach(function(m){
    if (!m || !m.by) return;
    if (m.kind === 'تهيئة'){ var e1 = ent(m.by); e1.prep++; e1.pPrep += itPrep(m.item) * (m.qty||1); }
    if (m.kind === 'تجميع'){ var e2 = ent(m.by); e2.asm++;  e2.pAsm  += itAsm(m.item)  * (m.qty||1); }
  });

  /* نقاطُ الزيادة اليدوية: يضيفها مشرفٌ أو مهندسٌ بسببٍ مكتوب — لا تصنعُ
     عملًا وهميًّا، وتدخل الإجماليَّ كأيِّ نقطةٍ حقيقيةٍ أخرى */
  bonusList().forEach(function(b){
    var e = ent(b.tech);
    e.pBonus += cfgN(b.pts);
  });

  Object.keys(by).forEach(function(k){
    var e = by[k];
    e.total = Math.round((e.pSurvey + e.pInstall + e.pDis + e.pPrep + e.pAsm + e.pBonus) * 100) / 100;
    e.acts  = e.survey + e.install + e.dis + e.prep + e.asm;
    e.nDays = Object.keys(e.days).length;
    e.perDay = e.nDays ? Math.round(e.total / e.nDays * 10) / 10 : 0;

    /* الأوفر تايم: تارجتُ المرحلة يُقسَّم على أيام الشهر فيكون سقفَ اليوم،
       وما زاد عنه في يومٍ يُعدّ إضافيًّا. فلا يُقدَّر بل يُحسب من العمل نفسه. */
    var cap = dayCapOf(e);
    e.dayCap = Math.round(cap * 10) / 10;
    e.over = 0; e.regular = 0;
    if (cap){
      /* توزيعُ النقاط على الأيام بنسبة أعمال كلِّ يوم */
      var totalActs = e.acts || 1;
      Object.keys(e.days).forEach(function(dy){
        var share = e.total * (e.days[dy] / totalActs);
        if (share > cap){ e.regular += cap; e.over += (share - cap); }
        else e.regular += share;
      });
      e.over = Math.round(e.over * 10) / 10;
      e.regular = Math.round(e.regular * 10) / 10;
    } else { e.regular = e.total; }

    var ph = cfgGet('ph'), ov = cfgGet('otRate') || 1.5;
    e.money    = Math.round((e.regular * ph + e.over * ph * ov) * 100) / 100;
    e.moneyReg = Math.round(e.regular * ph * 100) / 100;
    e.moneyOT  = Math.round(e.over * ph * ov * 100) / 100;
  });

  var list = Object.keys(by).map(function(k){ return by[k]; });
  list.sort(function(a,b){ return b.total - a.total; });
  list.forEach(function(e, i){ e.rank = i + 1; });

  SCORE_CACHE = { list:list, byName:by, n:list.length };
  SCORE_VER = STAT_VER;
  return SCORE_CACHE;
}

function scoreOf(name){
  var S = scores();
  return S.byName[name] || { name:name, stage:stageOf(name), survey:0, install:0, dis:0,
    prep:0, asm:0, pSurvey:0, pInstall:0, pDis:0, pPrep:0, pAsm:0,
    total:0, acts:0, nDays:0, perDay:0, money:0, rank:S.n + 1, last:0, days:{} };
}

function stageList(stage){
  return scores().list.filter(function(e){ return e.stage === stage; });
}

/* تارجتُ المرحلة — من الإعدادات */
function stageTarget(stage){
  var Tg = T();
  return { eng:0, cfg:Tg.prep || 0, asm:Tg.asm || 0,
           ins:Tg.ins || 0, srv:Tg.survey || 0, dis:Tg.dis || 0 }[stage] || 0;
}

/* سقفُ اليوم: تارجتُ ما عمله موزونًا بأعماله ÷ أيام الشهر.
   فمن مرحلتُه تركيبٌ وعمل مسحًا يُقاس بتارجت المسح لا بتارجتٍ لا يخصّ عمله. */
function dayCapOf(e){
  var days = cfgGet('days');
  if (!days) return 0;
  var Tg = T();
  var mix = [[e.survey, Tg.survey], [e.install, Tg.ins], [e.dis, Tg.dis],
             [e.prep, Tg.prep], [e.asm, Tg.asm]];
  var acts = 0, weighted = 0;
  mix.forEach(function(m){ if (m[0] > 0){ acts += m[0]; weighted += m[0] * (m[1] || 0); } });
  var tgt = acts ? (weighted / acts) : stageTarget(e.stage);
  if (!tgt) tgt = stageTarget(e.stage);
  return tgt ? (tgt / days) : 0;
}

/* ── صفحة الفني: ما عمله ورقمُه ── */
/* ═══ «شغلي» — أربعُ شاشاتٍ كانت تجيب سؤالًا واحدًا ═══
   «مهامي» و«أدائي» و«فريقي» و«شغل فريقي»: أربعٌ في القائمة يراها الفنيُّ
   والمشرفُ معًا، وكلُّها تجيب «ما عملتُه وما أُسند إليّ». فكان يفتحها
   بالتناوب يبحث عن رقمه، والقائمةُ تطول بلا أن تزيد معرفةً.

   جُمعت في شاشةٍ بأربع شرائح. **ولم يُحذف شيء**: كلُّ جسمٍ نُقل كما هو —
   نفسُ الأرقام ونفسُ الجداول ونفسُ الصلاحيات — وإنما صار المدخلُ واحدًا.
   والشريحةُ لا تظهر لمن لا يملك أصلَها: من لا يرى «فريقي» لا تظهر له. */

PAGE.mywork = { m:'الميدان', t:'شغلي',
  l:'مهامُّك وجدولُك وأداؤك وفريقُك — في شاشةٍ واحدة.',
  body:function(){
    var head = tabHead('mywork'), cur = tabCur('mywork');
    if (cur === 'mine') return head + (function(){
    /* كانت أصفارًا مكتوبةً وزرَّ تصديرٍ معطَّلًا بحجّة «نظامُ الإسناد غيرُ
       مبنيٍّ بعد» — وقد بُني (STATE.tasks وasnOfTech). فصارت تقرأ. */
    var me = STATE.meta.name || '';
    var mine = [];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (x.to === me && x.status !== 'معتمد') mine.push(x);
    });
    mine.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });

    var e = scoreOf(me);
    var Tg = T(), target = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
    var day = dayKey();
    var doneToday = (e.days && e.days[day]) || 0;

    return attMyCard()
      + routeCard()
      + stats([['مُسند إليّ', N(mine.length), mine.length ? 'wrn' : 'ok'],
                  ['أنجزتُ اليوم', N(doneToday), 'ok'],
                  ['نقاطي هذا الشهر', N(Math.round(e.total)), 'acc'],
                  ['ترتيبي', e.rank ? nm(e.rank) : '—']])

      + (mine.length
        ? cardFlush(t('المُسند إليّ') + ' — ' + nm(mine.length),
            table(['الرقم','النوع','النقطة','الحالة'],
              mine.slice(0, 100).map(function(x){
                var st = siteFind(x.site);
                return ['<span class="num">' + esc(x.no || '—') + '</span>',
                        pill(kindLabel(x.kind), 'acc'),
                        '<strong>' + esc(x.site) + '</strong>'
                          + (st ? '<br><span class="hint" style="margin:0">'
                              + esc((st.name || '').slice(0, 28)) + '</span>' : ''),
                        pill(x.status || 'مُسند', 'wrn')];
              })))
        : card('لا مهامَ مسنَدةً إليك الآن',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور أن يُسنِد إليك المشرفُ نقاطًا من «توزيع الفرق».')) + '</p>'))

      + card('شغلي وترتيبي',
          table(['البند','قيمتي'], [
            ['نقاط المسح', N(Math.round(e.pSurvey))],
            ['نقاط التركيب', N(Math.round(e.pInstall))],
            ['نقاط الفك', N(Math.round(e.pDis))],
            ['ترتيبي', e.rank ? nm(e.rank) : '—'],
            ['نسبتي من تارجتي', target ? pct(e.total, target) : '—']
          ]))
      + '<p class="hint">' + esc(t('ترتيبك يظهر بلا كشف أرقام زملائك — المقارنة تحفيزٌ لا مساءلةٌ علنية.')) + '</p>';
  })();
    if (cur === 'myscore') return head + (function(){
    var me = STATE.meta.name || '';
    var e = scoreOf(me);
    var peers = stageList(e.stage);
    var myRank = peers.findIndex(function(p){ return p.name === me; }) + 1;
    var tgt = stageTarget(e.stage);
    var R = STAGE_ROLES[e.stage] || { n:'—', i:'' };

    return stats([['نقاطي', N(e.total), 'acc'],
                  ['ترتيبي', myRank ? (nm(myRank) + ' / ' + nm(peers.length)) : '—',
                   myRank === 1 ? 'ok' : ''],
                  ['أعمالي', N(e.acts)],
                  ['أيام عملي', N(e.nDays)]])

      + card(R.i + ' ' + t(R.n),
          (tgt ? meter('من تارجت المرحلة', e.total, tgt) : '')
          + table(['العمل','العدد','النقاط'], [
              ['زيارة ميدانية', N(e.survey), N(Math.round(e.pSurvey*10)/10)],
              ['تركيب معتمد',   N(e.install), N(Math.round(e.pInstall*10)/10)],
              ['فك',            N(e.dis),    N(Math.round(e.pDis*10)/10)],
              ['تهيئة',         N(e.prep),   N(Math.round(e.pPrep*10)/10)],
              ['تجميع',         N(e.asm),    N(Math.round(e.pAsm*10)/10)]
            ].filter(function(r){ return r[1] !== '٠' || r[2] !== '٠'; })
             .concat([['<b>' + t('الإجمالي') + '</b>','', '<b>' + nm(e.total) + '</b>']])))

      + (cfgGet('ph')
        ? card('المستحَق',
            '<div class="stats" style="margin:0">'
            + stat('نقاطي', N(e.total))
            + stat('سعر النقطة', N(cfgGet('ph')) + ' ' + esc(t('ريال')))
            + stat('المستحَق', N(e.money) + ' ' + esc(t('ريال')), 'ok')
            + stat('متوسط اليوم', N(e.perDay))
            + '</div>'
            + (e.dayCap
              ? table(['البند','نقاط','سعر','مستحَق'], [
                  ['عادي', N(e.regular), N(cfgGet('ph')), N(e.moneyReg)],
                  ['إضافي', N(e.over), N(Math.round(cfgGet('ph') * (cfgGet('otRate')||1.5) * 100)/100),
                   N(e.moneyOT)]
                ], ['<b>' + t('الإجمالي') + '</b>', N(e.total), '', '<b>' + nm(e.money) + '</b>'])
                + '<p class="hint">سقفُ يومك <b>' + nm(e.dayCap) + '</b> نقطة — وما زاد عنه في يومٍ '
                + 'يُحتسب إضافيًّا بمعامل <b>' + nm(cfgGet('otRate') || 1.5) + '</b>.</p>'
              : '<p class="hint">' + esc(t('لم يُضبط تارجتُ مرحلتك — فلا يُفصَل الإضافيُّ عن العادي.')) + '</p>')
            + '<p class="hint">' + esc(t('النقاطُ تُحتسب من أوزان الإعدادات — والتركيبُ لا يُحتسب حتى يعتمده المهندس.')) + '</p>')
        : alertBox('warn','سعرُ النقطة لم يُضبط بعد — يُكتب في الإعدادات ← ثوابت النظام.'))

      + (peers.length > 1
        ? cardFlush('ترتيبي في ' + t(R.n),
            table(['#','الفني','أعمال','النقاط'],
              peers.slice(0, 20).map(function(p, i){
                var me2 = p.name === me;
                return [(me2 ? '<b>' + nm(i+1) + '</b>' : nm(i+1)),
                        me2 ? '<b>' + esc(p.name) + '</b>' : esc(p.name),
                        N(p.acts),
                        me2 ? '<b>' + nm(p.total) + '</b>' : N(p.total)];
              })),
            '<span class="hint" style="margin:0">' + esc(t('أرقامُ زملائك في مرحلتك وحدها — لا في غيرها')) + '</span>')
        : '')

      + card('كيف تُحسب نقاطي',
          flow(['أعمل','يُوزَن بالإعدادات','يُعتمد','يدخل نقاطي'], 0)
          + '<p class="hint">' + esc(t('وزنُ كل عملٍ ثابتٌ في الإعدادات ولا يتغيّر — وما تعمله يُوزَن به.')) + '</p>');})();
    if (cur === 'myteam') return head + (function(){
    var mine = techsList().filter(function(x){ return underNames(STATE.meta.name || '').indexOf(x.n) > -1; });
    var names = mine.map(function(x){ return x.n; });
    if (!names.length){
      return card('لا أحدَ تحت إشرافك بعد',
        '<p class="hint" style="margin:0">'
        + esc(t('حقلُ «المشرف» في سجل كلِّ موظفٍ هو ما يربطه بك — تأكّد أنه مكتوبٌ باسمك بالضبط في صفحة «الفرق».'))
        + '</p>');
    }
    var byName = scores().byName;
    var list = names.map(function(n){ return byName[n] || {
      name:n, survey:0, install:0, dis:0, pSurvey:0, pInstall:0, pDis:0,
      pBonus:bonusFor(n), total:bonusFor(n), installT:{}, disT:{}
    }; });
    list.sort(function(a,b){ return b.total - a.total; });

    return stats([['أفراد الفريق', N(names.length), 'acc'],
                  ['نقاط الفريق هذا الشهر', N(Math.round(list.reduce(function(a,e){ return a + e.total; }, 0)))]])
      + card('أداء فريقي هذا الشهر', techPerfTable(list, false))
      + '<p class="hint">' + esc(t('أرقام زملائك في الفرق الأخرى لا تظهر لك — المقارنة داخل فريقك وحده.')) + '</p>'
      + (maySupEng() ? bonusFormHtml(names, 'mt') : '')
      + bonusLogHtml(names);})();
    if (cur === 'board') return head + (function(){
      /* ═══ لوحةُ الفريق — من تحتي في صفٍّ لكلِّ واحد ═══
         الأداءُ في «فريقي» نقاطٌ ومعدّلات؛ وهذه العملُ نفسُه: ما أُسند لكلٍّ الآن،
         وما أنجزه اليوم، وما ينتظر اعتمادَ المهندس منه، ومتى ظهر آخرَ مرة. */
      var me = STATE.meta.name || '';
      /* آخرُ ظهورٍ من نبضات الحضور — تُجلَب كما تُجلَب في صحة النظام */
      if (may('users') || may('exportAll')) presenceFetch(false);
      var today = dayKey(Date.now()), U = STATE.users || {}, P = STATE.presence || {};
      var roleOf = {}; Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name) roleOf[u.name] = u.role; });
      /* الكلُّ تحتي — ميدانًا ومكتبًا — بمرشِّح الدور: مديرُ المشروع يرى الجميع،
         والمهندسُ من تحته، والمشرفُ فريقَه. المهندسُ يُعَدُّ له اعتمادُه لا زياراتُه. */
      /* المطّلعُ الوزاريُّ ليس من الفريق: لا عملَ يُعَدُّ له، فصفُّه أصفارٌ تشوّش
         اللوحةَ — يُستبعَد كما يُستبعَد من قائمة الناس */
      var all = underNames(me).filter(function(n2){ return effRole(roleOf[n2] || 'tech') !== 'viewer'; });
      if (!all.length) return card('لا أحدَ تحت إشرافك بعد', '<p class="hint" style="margin:0">' + esc(t('حقلُ «مديره» في سجل كلِّ موظفٍ هو ما يربطه بك.')) + '</p>');
      var byRole = {}; all.forEach(function(n){ var r = effRole(roleOf[n] || 'tech'); byRole[r] = (byRole[r] || 0) + 1; });
      if (BOARD_ROLE && !byRole[BOARD_ROLE]) BOARD_ROLE = '';
      var names = BOARD_ROLE ? all.filter(function(n){ return effRole(roleOf[n] || 'tech') === BOARD_ROLE; }) : all;
      var chips = '<div class="chips">'
        + '<button type="button" class="chip' + (BOARD_ROLE ? '' : ' on') + '" data-boardrole="">' + esc(t('الكل')) + ' <span class="num">' + nm(all.length) + '</span></button>'
        + Object.keys(byRole).sort(function(a, b){ return rankOf(b) - rankOf(a); }).map(function(r){
            return '<button type="button" class="chip' + (BOARD_ROLE === r ? ' on' : '') + '" data-boardrole="' + esc(r) + '">'
              + esc(t((ROLES[r] || {}).n || r)) + ' <span class="num">' + nm(byRole[r]) + '</span></button>'; }).join('')
        + '</div>';
      var seen = {}; Object.keys(P).forEach(function(k){ var p = P[k]; if (p && p.name && (!seen[p.name] || p.at > seen[p.name])) seen[p.name] = p.at || 0; });
      var rows = names.map(function(n){
        var open = 0, doneToday = 0, visits = 0, pend = 0, inst = 0, appr = 0, dis = 0, mnt = 0, byKind = {};
        /* المُسندُ المفتوحُ بنوعه: زيارةٌ وتركيبٌ وصيانةٌ وفكٌّ وتهيئةٌ وتجميع — كلُّ ما يُسنَد */
        Object.keys(STATE.tasks || {}).forEach(function(k){ var x = STATE.tasks[k]; if (!x || x.to !== n) return;
          if (x.status === 'مُنجز' || x.status === 'معتمد'){ if (dayKey(x.doneAt || x.at) === today) doneToday++; }
          else { open++; byKind[x.kind || 'visit'] = (byKind[x.kind || 'visit'] || 0) + 1; } });
        Object.keys(STATE.diss || {}).forEach(function(k){ var r = STATE.diss[k]; if (r && r.by === n && r.status === 'تم الفك') dis++; });
        Object.keys(STATE.maints || {}).forEach(function(k){ var r = STATE.maints[k]; if (r && (r.by === n || r.to === n)) mnt++; });
        Object.keys(STATE.recs || {}).forEach(function(k){ var r = STATE.recs[k]; if (!r) return;
          if ((r.reviewBy === n && dayKey(r.reviewAt) === today) || (r.revisitBy === n && dayKey(r.revisitAt) === today)) appr++;
          if (r.by !== n) return;
          if (dayKey(r.at) === today) visits++; if (svReview(r) === 'pending') pend++; });
        Object.keys(STATE.inss || {}).forEach(function(k){ var r = STATE.inss[k]; if (r && r.by === n && r.status === 'مُركّب') inst++; });
        var ago = seen[n] ? Math.round((Date.now() - seen[n]) / 60000) : -1;
        var kinds = Object.keys(byKind).map(function(k){ return nm(byKind[k]) + ' ' + t((WO_KINDS[k] || { n:k }).n); }).join(' · ');
        return { n:n, role:roleOf[n] || '', open:open, kinds:kinds, done:doneToday, visits:visits, pend:pend, inst:inst, dis:dis, mnt:mnt, appr:appr, ago:ago };
      }).sort(function(a, b){ return (b.open + b.pend) - (a.open + a.pend) || arCmp(a.n, b.n); });
      var tot = rows.reduce(function(a, r){ a.open += r.open; a.visits += r.visits; a.pend += r.pend; return a; }, { open:0, visits:0, pend:0 });
      return chips
        + stats([['أفراد', N(rows.length), 'acc'], ['مُسند مفتوح', N(tot.open), tot.open ? 'wrn' : ''],
                    ['زيارات اليوم', N(tot.visits), 'ok'], ['بانتظار الاعتماد', N(tot.pend), tot.pend ? 'wrn' : 'ok']])
        + cardFlush(t('لوحة الفريق') + ' \u2014 ' + nm(rows.length),
            table(['الاسم','الدور','مُسند مفتوح','زيارات اليوم','بانتظار الاعتماد','مُركّب','فُكّ','صيانة','اعتمادات اليوم','آخر ظهور'], rows.map(function(r){
              return ['<strong>' + esc(dispName(r.n)) + '</strong>', esc(t((ROLES[r.role] || {}).n || r.role || '—')),
                      r.open ? '<b class="num">' + nm(r.open) + '</b>' + (r.kinds ? '<br><span class="hint" style="margin:0">' + esc(r.kinds) + '</span>' : '') : N(0), N(r.visits),
                      r.pend ? '<b class="num" style="color:#E8C34B">' + nm(r.pend) + '</b>' : N(0), N(r.inst), N(r.dis), N(r.mnt), N(r.appr),
                      r.ago < 0 ? '<span class="hint" style="margin:0">' + esc(t('لم يظهر')) + '</span>'
                        : (r.ago < 60 ? pill(nm(r.ago) + ' ' + t('د'), 'ok') : (r.ago < 1440 ? pill(nm(Math.round(r.ago / 60)) + ' ' + t('س'), 'wrn') : pill(nm(Math.round(r.ago / 1440)) + ' ' + t('يوم'), 'off')))];
            })))
        + (tot.pend && may('approve') ? '<div class="actions">' + btn('\u2705 ' + t('اعتماد الزيارات') + ' (' + nm(tot.pend) + ')','btn-primary btn-sm',' data-p="svappr"') + '</div>' : '');
    })();
    if (cur === 'mycrew') return head + (function(){
    var c = crewOf(CREW_VIEW);
    var S = crewStat(c);
    var K = c.kind === '*' ? null : WO_KINDS[c.kind];
    return '<div class="chips">' + CREWS.filter(function(x){ return x.kind !== '*'; }).map(function(x){
        return '<button type="button" class="chip' + (CREW_VIEW===x.id?' on':'') + '" data-crew="' + x.id + '">'
          + (WO_KINDS[x.kind] ? WO_KINDS[x.kind].i + ' ' : '') + esc(t(x.n)) + '</button>';
      }).join('') + '</div>'
      + stats([['اليوم','<span class="num">'+nm(S.day)+'</span>','ok'],
               ['هذا الأسبوع','<span class="num">'+nm(S.week)+'</span>'],
               ['هذا الشهر','<span class="num">'+nm(S.month)+'</span>','acc'],
               ['مفتوح','<span class="num">'+nm(S.open)+'</span>','wrn']])
      + (S.tgtM ? card('مقابل التارجت',
          meter('الشهري', S.month, S.tgtM)
          + meter('الأسبوعي', S.week, cfgWk(S.tgtM))) : '')
      + cardFlush('مهام الفريق',
          '<p class="hint" style="padding:16px;text-align:center;margin:0">' + esc(t('لا مهام مفتوحة من نوع '
          + esc(K ? t(K.n) : t('كل الأنواع')) + '.')) + '</p>',
          btn('⬇ تقرير فريقي','btn-quiet btn-sm disabled', ' disabled title="'+ esc(t('يحتاج قائمةَ مهامٍ فرديةً — غيرُ مبنيةٍ بعد. الإجماليّاتُ أعلاه حقيقيةٌ وتُقرأ الآن.')) + '"'))
      + card('دورة المهمة', flow(['مطلوب','قيد التنفيذ','منفّذ','معتمد'], 0)
        + '<p class="hint">' + esc(t('المهمة لا تُحتسب نقاطًا حتى يعتمدها المهندس — والإعادة تردّها بحالة «مُعاد» مع سبب.')) + '</p>');})();
    return head + attMyCard() + fieldHelperCard() + routeCard()   /* (V29.4) مساعدُ الميدان على «مهامي» */
      /* مهامُّ الاجتماع التي على اسمي — هنا حيث يبدأ كلٌّ يومَه، لا في قائمة الجميع */
      + (function(){
          var W = wtMine(); if (!W.length) return '';
          return cardFlush(t('مهامّي من الاجتماع') + ' — ' + nm(W.length),
            '<div class="grid cols-2 wt-grid">' + W.map(wtCardOf).join('') + '</div>');
        })()
      + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('مهامي'),'btn-secondary btn-sm',' data-xls="mywork"') + '</div>'
      + (function(){
    var me = STATE.meta.name || '';
    /* حالةُ مهمةِ زيارة: من تعليقة الحفظ إلى قرار المهندس */
    function taskPill(x){
      var r = STATE.recs[x.site], rv = svReview(r);
      if (rv === 'approved') return pill('معتمدة', 'ok');
      if (rv === 'revisit')  return pill('تحتاج زيارة أخرى', 'off');
      if (rv === 'pending')  return pill('تمّت — بانتظار الاعتماد', 'acc');
      if (r && !svDone(r))   return pill(r.access || 'متعذّر', 'wrn');
      return pill('بانتظارك', 'warn');
    }
    /* المهندسُ والمديرُ يريان الإسناداتِ كلَّها — كلُّ مشرفٍ ونقاطُه التي سيزورها */
    if (may('approve')){
      var by = {}, open = 0, pend = 0, rev = 0;
      Object.keys(STATE.tasks).forEach(function(k){
        var x = STATE.tasks[k];
        if (!x || x.status === 'معتمد') return;
        (by[x.to || '—'] = by[x.to || '—'] || []).push(x); open++;
        var rv = svReview(STATE.recs[x.site]);
        if (rv === 'pending') pend++; else if (rv === 'revisit') rev++;
      });
      var sups = Object.keys(by).sort(function(a, b){ return by[b].length - by[a].length; });
      return attMyCard()
        + (may('settings') ? seedCard() + readyCard() : '')
        + inboxCard()
        + stats([['إسناداتٌ مفتوحة', N(open), 'acc'], ['مشرفون', N(sups.length)],
                    ['تمّت — تنتظر اعتمادك', N(pend), pend ? 'wrn' : ''],
                    ['تحتاج زيارة أخرى', N(rev), rev ? 'bad' : '']])
        + (pend ? alertBox('info', nm(pend) + ' ' + t('زيارةً تنتظر اعتمادك — من «اعتماد الزيارات».'))
                  + '<div class="actions" style="margin:-4px 0 12px">' + btn('✅ ' + t('اعتماد الزيارات'),'btn-primary btn-sm',' data-p="svappr"') + '</div>' : '')
        + (sups.length
          ? sups.map(function(sp){
              var L = by[sp];
              return cardFlush(esc(dispName(sp)) + ' — ' + nm(L.length) + ' ' + t('نقطة'),
                table(['النقطة','النوع','الموعد','الحالة'],
                  L.slice(0, 80).map(function(x){
                    var st = siteFind(x.site), k = WO_KINDS[x.kind] || { i:'', n:x.kind };
                    return ['<strong>' + esc(x.site) + '</strong><br><span class="hint" style="margin:0">'
                              + esc(((st && st.name) || '').slice(0, 28)) + '</span>',
                            k.i + ' ' + esc(t(k.n)),
                            x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—',
                            taskPill(x)];
                  })));
            }).join('')
          : card('لا إسناداتٍ مفتوحة', '<p class="hint" style="text-align:center;margin:0">'
              + esc(t('أسند نقاطًا للمشرفين من الخريطة أو «توزيع الفرق» فتظهر هنا بمشرفها وحالتها.')) + '</p>'))
        + '<p class="hint">' + esc(t('الدورة: يُسنِد المهندسُ ← يزور المشرفُ ويحفظ ← تظهر في «اعتماد الزيارات» ← يعتمدها المهندسُ أو يردُّها «تحتاج زيارةً أخرى» فتعود إلى مهام المشرف بسبب الردّ.')) + '</p>';
    }
    var mine = [];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (x.to === me && x.status !== 'معتمد') mine.push(x);
    });
    var done = mine.filter(function(x){ return svVisited(STATE.recs[x.site]); }).length;   /* (V32.8) تمت الزيارة بأيِّ نتيجة */
    var back = mine.filter(function(x){ return svReview(STATE.recs[x.site]) === 'revisit'; }).length;
    var myPts = (typeof scoreOf === 'function') ? (scoreOf(me) || {}).total || 0 : 0;

    return stats([['مُسند إليّ', N(mine.length), 'acc'],
                  ['أنجزتُ', N(done), 'ok'],
                  ['المتبقي', N(mine.length - done), mine.length-done?'wrn':''],
                  ['تحتاج زيارة أخرى', N(back), back ? 'bad' : ''],
                  ['نقاطي', N(myPts)]])
      + (mine.length
        ? cardFlush(t('مهامي') + ' — ' + nm(mine.length),
            '<div class="list">' + mine.slice(0, 60).map(function(x){
              var s = siteFind(x.site);
              if (!s) return '';
              var k = WO_KINDS[x.kind] || { i:'', n:x.kind };
              var rr = STATE.recs[x.site];
              var why = (rr && svReview(rr) === 'revisit' && rr.revisitNote)
                ? '<div class="hint" style="margin:2px 0 0;color:var(--danger)">\u21a9 ' + esc(rr.revisitNote) + '</div>' : '';
              return '<div class="list-item" data-site="' + esc(x.site) + '"><div class="li-main">'
                + '<div class="li-t">' + (s.sign ? esc(t('شاخص')) + ' ' + esc(s.sign) : esc(s.name.slice(0,36))) + '</div>'
                + '<div class="li-s"><span class="num">' + esc(x.site) + '</span> · '
                +   k.i + ' ' + esc(t(k.n)) + (x.when ? ' · ' + esc(x.when) : '') + '</div>' + why
                + '</div><div class="li-end">'
                + (typeof distTxt === 'function' && distTxt(s)
                    ? '<div class="num" style="margin-bottom:3px">\u{1F4CD} ' + distTxt(s) + '</div>' : '')
                + taskPill(x) + '</div></div>';
            }).join('') + '</div>',
            btn('🗺 على الخريطة','btn-secondary btn-sm',' data-mymap="1"'))
        : card('مهامي',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا مهام مسندة إليك — يُسندها المشرف من طلبات الزيارة.')) + '</p>',
            btn('\u2753 ' + t('كيف تسير الدورة؟'),'btn-quiet btn-sm',' data-p="wf"')))
      + card('دورة مهمتك', flow(['مُسندة إليك','زُرتها وحفظت','بانتظار الاعتماد','معتمدة'], 0)
        + '<p class="hint">' + esc(t('نقاطُك لا تُحسَب إلا بعد أن يعتمد المهندسُ ما نفّذته — وإذا أعادها «تحتاج زيارةً أخرى» ترجع إلى قائمتك ومعها سببُ الإعادة.')) + '</p>');})();
  }};
;

/* ── تبويبُ كل مرحلة: فريقُها وأعمالُهم ── */
var STAGE_TAB = 'ins';

var PERF_VIEW = 'rank';

/* ── الترتيب العام: كلُّ من عمل، برقمه ومرتبته ومستحقّه ── */
function perfRankTable(){
  var S = scores();
  var Tg = T(), target = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
  var sum = S.list.reduce(function(a,e){ return a + e.total; }, 0);
  var money = S.list.reduce(function(a,e){ return a + e.money; }, 0);

  return stats([['من عملوا', N(S.n), 'acc'],
                ['إجمالي الأعمال', N(S.list.reduce(function(a,e){return a+e.acts;},0))],
                ['إجمالي النقاط', N(Math.round(sum))],
                ['المستحَق', cfgGet('ph') ? N(Math.round(money)) + ' ' + t('ريال') : '—']])

    + (S.n
      ? cardFlush(t('الترتيب العام') + ' — ' + nm(S.n),
          table(['#','الاسم','المرحلة','زيارة','تركيب','فك','زيادة','الإجمالي','من التارجت','متوسط اليوم','المستحَق'],
            S.list.map(function(e){
              var R = STAGE_ROLES[e.stage] || { n:e.stage, i:'' };
              return [e.rank <= 3 ? '<b>' + nm(e.rank) + '</b>' : nm(e.rank),
                      '<strong>' + esc(dispName(e.name)) + '</strong>',
                      R.i + ' ' + esc(t(R.n)),
                      N(e.survey), N(e.install), N(e.dis),
                      e.pBonus ? ('<span class="' + (e.pBonus > 0 ? 'num' : 'req') + '">'
                                   + (e.pBonus > 0 ? '+' : '') + nm(Math.round(e.pBonus * 10) / 10) + '</span>') : '—',
                      '<b>' + nm(Math.round(e.total * 10) / 10) + '</b>',
                      target ? pct(e.total, target) : '—',
                      N(e.perDay), cfgGet('ph') ? N(e.money) : '—'];
            }),
            ['','<b>' + t('الإجمالي') + '</b>','',
             N(S.list.reduce(function(a,e){return a+e.survey;},0)),
             N(S.list.reduce(function(a,e){return a+e.install;},0)),
             N(S.list.reduce(function(a,e){return a+e.dis;},0)),
             N(Math.round(S.list.reduce(function(a,e){return a+e.pBonus;},0) * 10) / 10),
             '<b>' + nm(Math.round(sum)) + '</b>', '', '',
             cfgGet('ph') ? N(Math.round(money)) : '—']),
          '<div class="actions">'
          + btn('⬇ إكسل — التقرير','btn-secondary btn-sm',' data-xls="score"')
          + btn('🖨 PDF','btn-secondary btn-sm',' data-print="1"')
          + '</div>')
      : card('', alertBox('info','لا أعمال مسجّلةً بعد — تظهر هنا فورَ أول مسحٍ أو تركيب.')))

    + simCard()
    + moneyHowCard(S)
    /* المسحُ بنوع الموقع لكلِّ عضو: كم مخيمًا وكم ممرًّا فعلًا، وبكم نقطة، وكم في اليوم (V18.6) */
    + (function(){
        var L = S.list.filter(function(e){ return e.survey > 0; }); if (!L.length) return '';
        var types = {}; L.forEach(function(e){ Object.keys(e.surveyT).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
        var cols = Object.keys(types).sort(function(a, b){ return types[b] - types[a]; }).slice(0, 5);
        var cell = function(o){ return o ? nm(o.n) + ' <span class="hint" style="margin:0">(' + nm(Math.round(o.pts)) + ')</span>' : '\u2014'; };
        return cardFlush(t('المسحُ بنوع الموقع لكلِّ عضو') + ' \u2014 ' + t('العدد (النقاط)'),
          table(['الاسم'].concat(cols.map(function(c){ return t(c); })).concat(['زيارات','نقاط المسح','أيام العمل','نقطة / يوم']),
            L.map(function(e){
              return ['<strong>' + esc(dispName(e.name)) + '</strong>'].concat(cols.map(function(c){ return cell(e.surveyT[c]); }))
                .concat([N(e.survey), N(Math.round(e.pSurvey)), N(e.nDays), N(e.nDays ? Math.round(e.pSurvey / e.nDays * 10) / 10 : 0)]);
            }),
            ['<b>' + t('الإجمالي') + '</b>'].concat(cols.map(function(c){ var n = 0, p = 0; L.forEach(function(e){ if (e.surveyT[c]){ n += e.surveyT[c].n; p += e.surveyT[c].pts; } }); return cell({ n:n, pts:p }); }))
              .concat([N(L.reduce(function(a, e){ return a + e.survey; }, 0)), N(Math.round(L.reduce(function(a, e){ return a + e.pSurvey; }, 0))), '', ''])),
          '<p class="hint" style="margin:8px 0 0">' + esc(t('«نقطة / يوم» = نقاطُ المسح ÷ الأيامِ التي عمل فيها. و«متوسط اليوم» في الترتيب العام يشمل كلَّ الأعمال لا المسحَ وحدَه.')) + '</p>');
      })()
    + card('توزيع النقاط على المراحل',
        table(['المرحلة','أفراد','أعمال','النقاط','٪'],
          Object.keys(STAGE_ROLES).map(function(k){
            var R = STAGE_ROLES[k], L = stageList(k);
            var p = L.reduce(function(a,e){ return a + e.total; }, 0);
            return [R.i + ' ' + esc(t(R.n)), N(L.length),
                    N(L.reduce(function(a,e){ return a + e.acts; }, 0)),
                    N(Math.round(p)),
                    sum ? nm(Math.round(p / sum * 100)) + '٪' : '٠٪'];
          })));
}

/* ═══ يوميات المشروع (V18.7) ═══
   سأل صاحبُ المشروع: أين الشاشةُ التي تقول ماذا حدث كلَّ يومٍ من أوّل يوم؟ لم تكن.
   هذه تجمع من السجلات نفسِها (الزياراتُ والتركيباتُ والفكُّ والمواقعُ الجديدةُ
   والاعتماداتُ) يومًا يومًا من أوّل يومِ عملٍ إلى اليوم — بلا فجوة: يومُ الصفر
   يُرى صفرًا — ومعه من عمل وكم، والتراكميُّ، وأعلى يوم. لا مصدرَ جديدًا ولا كتابة. */
function diaryRows(keep){
  var D = {}, ok = typeof keep === 'function' ? keep : null;   /* (V24.0) مرشِّحٌ اختياريٌّ على وقت كلِّ سجلٍّ لملخص العمل اليومي — وبلا مرشِّحٍ لا يتغيّر شيء */
  var blank = function(){ return { sv:0, ins:0, dis:0, nw:0, apr:0, min:0, who:{}, zones:{}, stuck:0, span:{} }; };
  var dayOf = function(t){ var n = +t; return n > 0 && (!ok || ok(n)) ? dayKey(n) : ''; };
  var add = function(day, k, who){ if (!day) return; var o = D[day] = D[day] || blank(); o[k]++; if (who){ o.who[who] = (o.who[who] || 0) + 1; } };
  var span = function(day, who, at){ if (!day || !who || !(+at)) return; var o = D[day]; var p = o.span[who] = o.span[who] || { a:+at, b:+at }; if (+at < p.a) p.a = +at; if (+at > p.b) p.b = +at; };
  Object.keys(STATE.recs || {}).forEach(function(id){ var r = STATE.recs[id]; if (!r) return; var dy = dayOf(r.at); add(dy, 'sv', r.by);
    if (dy){ var x = siteFind(id); var z = (x && x.zone) || '\u2014'; D[dy].zones[z] = (D[dy].zones[z] || 0) + 1; if (r.access && r.access !== 'تم الوصول') D[dy].stuck++; span(dy, r.by, r.at); }
    if (r.reviewAt) add(dayOf(r.reviewAt), 'apr'); if (r.minAt) add(dayOf(r.minAt), 'min'); });
  Object.keys(STATE.inss || {}).forEach(function(id){ var r = STATE.inss[id]; if (r && r.status === 'مُركّب'){ var dy = dayOf(r.at); add(dy, 'ins', r.by); span(dy, r.by, r.at); } });
  Object.keys(STATE.diss || {}).forEach(function(id){ var r = STATE.diss[id]; if (r && r.status === 'تم الفك') add(dayOf(r.at), 'dis', r.by); });
  Object.keys(STATE.newsites || {}).forEach(function(id){ var r = STATE.newsites[id]; if (r) add(dayOf(r.at), 'nw', r.by); });
  var days = Object.keys(D).sort(); if (!days.length) return [];
  var out = [], cum = 0, cumIns = 0, last = dayKey();
  for (var t = Date.parse(days[0] + 'T00:00:00Z'); ; t += 864e5){
    var k = dayKey(t), o = D[k] || blank();
    cum += o.sv; cumIns += o.ins;
    var names = Object.keys(o.who).sort(function(a, b){ return o.who[b] - o.who[a]; });
    /* ساعاتُ العمل: من أوّل سجلٍّ إلى آخره لكلِّ شخصٍ في اليوم — تقديرٌ من الأثر لا من ساعة حضور */
    var hrs = Object.keys(o.span).map(function(n){ return (o.span[n].b - o.span[n].a) / 36e5; }).filter(function(h){ return h > 0; });
    var hAvg = hrs.length ? Math.round(hrs.reduce(function(a, b){ return a + b; }, 0) / hrs.length * 10) / 10 : 0;
    var zs = Object.keys(o.zones).sort(function(a, b){ return o.zones[b] - o.zones[a]; }).map(function(z){ return { z:z, n:o.zones[z] }; });
    out.push({ day:k, sv:o.sv, ins:o.ins, dis:o.dis, nw:o.nw, apr:o.apr, min:o.min, people:names.length, top:names.slice(0, 3).map(function(n){ return dispName(n) + ' ' + nm(o.who[n]); }), cum:cum, cumIns:cumIns, acts:o.sv + o.ins + o.dis + o.nw,
               zones:zs, stuck:o.stuck, hAvg:hAvg, hSum:Math.round(hrs.reduce(function(a, b){ return a + b; }, 0) * 10) / 10 });
    if (k >= last || out.length > 400) break;
  }
  return out;
}
function diaryBody(){
  var R = diaryRows();
  if (!R.length) return card('', alertBox('info', 'لا أعمالَ مسجّلةً بعد — تبدأ اليومياتُ من أوّل زيارة.'));
  var work = R.filter(function(r){ return r.acts > 0; }), best = R.slice().sort(function(a, b){ return b.sv - a.sv; })[0];
  var avg = work.length ? Math.round(R.reduce(function(a, r){ return a + r.sv; }, 0) / work.length) : 0, maxSv = Math.max.apply(null, R.map(function(r){ return r.sv; })) || 1;
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var office = effRole(ROLE) !== 'viewer';
  var rows = R.slice().reverse().map(function(r){
    var idle = r.acts === 0, wd = WD[new Date(Date.parse(r.day + 'T00:00:00Z')).getUTCDay()];
    var bar = '<div class="bar" style="min-width:60px" title="' + nm(r.sv) + '"><i style="width:' + Math.round(r.sv / maxSv * 100) + '%"></i></div>';
    return [(idle ? '<span class="hint" style="margin:0">' : '<b>') + '<span class="num">' + esc(fmtDate(Date.parse(r.day + 'T12:00:00Z'))) + '</span> ' + esc(t(wd)) + (idle ? '</span>' : '</b>'),
            idle ? '\u2014' : N(r.sv) + ' ' + bar,
            idle || !r.zones.length ? '' : '<span class="hint" style="margin:0">' + r.zones.map(function(o){ return esc(t(o.z)) + ' ' + nm(o.n); }).join(' \u00b7 ') + '</span>',
            idle ? '' : (r.stuck ? '<span class="req">' + nm(r.stuck) + '</span>' : N(0)),
            idle ? '' : N(r.ins), idle ? '' : N(r.dis), idle ? '' : N(r.nw), idle ? '' : N(r.apr + r.min),
            idle ? '' : N(r.people) + (office && r.top.length ? ' <span class="hint" style="margin:0">' + r.top.map(function(x){ return esc(x); }).join(' \u00b7 ') + '</span>' : ''),
            idle ? '' : (r.hAvg ? '<span class="num">' + nm(r.hAvg) + '</span>' : '\u2014'),
            '<span class="num">' + nm(r.cum) + '</span>'];
  });
  return stats([['أيامٌ منذ البداية', N(R.length)], ['أيامُ عمل', N(work.length), work.length ? 'ok' : ''],
                ['متوسط الزيارات في يوم عمل', N(avg)], ['أعلى يوم', best && best.sv ? nm(best.sv) + ' \u2014 ' + fmtDate(Date.parse(best.day + 'T12:00:00Z')) : '\u2014']])
    + cardFlush(t('يوميات المشروع') + ' \u2014 ' + t('الأحدثُ أوّلًا'),
        table(['اليوم', 'زيارات', 'المشاعر', 'متعذّر', 'تركيب', 'فك', 'مواقع جديدة', 'اعتمادات', 'من عملوا', 'ساعات الفرد', 'تراكمي المسح'], rows),
        '<div class="actions">' + btn('\u2B07 ' + t('إكسل — اليوميات'), 'btn-secondary btn-sm', ' data-xls="diary"') + '</div>')
    + '<p class="hint">' + esc(t('يومٌ بلا عملٍ يُرى صفرًا لا يُخفى. الزياراتُ بيوم تسجيلها، والاعتماداتُ (تقنيةٌ ووزارية) بيوم قرارها، والتراكميُّ زياراتٌ منذ أوّل يوم.')) + ' ' + esc(t('«ساعات الفرد»: من أوّل سجلٍّ إلى آخره في اليوم لكلِّ شخص (متوسطًا) — تقديرٌ من الأثر لا من ساعة حضور.')) + '</p>';
}
/* ═══ محاكي الأوزان والتارجت (V18.8) ═══
   قبل أن يُغيَّر وزنُ النقطة أو التارجت يُرى أثرُه على الأعمال المسجَّلة فعلًا:
   لكلِّ عضوٍ عددُ ما مسح من كلِّ نوع × الوزنِ المقترح = نقاطُه، ونقاطُه في يوم
   العمل، وإسقاطُها على الشهر، ونسبتُها من التارجت المقترح — فيُعرَف قبل الضبط
   هل يعدّيه أحد. الأرقامُ في الذاكرة حتى يُضغَط «اعتمد». */
var SIM = null;
function simState(){
  if (SIM) return SIM;
  var raw = null; try { raw = JSON.parse(lsGet('nsk14.sim') || 'null'); } catch (e){ LS_ERR = e; }
  SIM = raw && raw.w ? raw : { w:{}, target:5000, days:26 };
  return SIM;
}
function simSave(){ try { lsSet('nsk14.sim', JSON.stringify(SIM)); } catch (e){ LS_ERR = e; } }
function simTypes(){
  var S = scores(), types = {};
  S.list.forEach(function(e){ Object.keys(e.surveyT || {}).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
  return Object.keys(types).sort(function(a, b){ return types[b] - types[a]; });
}
function simW(k){ var v = simState().w[k]; return v == null ? 1 : +v; }
function simRows(){
  var S = scores(), M = simState();
  return S.list.filter(function(e){ return e.survey > 0; }).map(function(e){
    var pts = 0; Object.keys(e.surveyT || {}).forEach(function(k){ pts += e.surveyT[k].n * simW(k); });
    var perDay = e.nDays ? pts / e.nDays : 0, month = perDay * (+M.days || 26);
    return { name:e.name, pts:Math.round(pts * 10) / 10, days:e.nDays, perDay:Math.round(perDay * 10) / 10, month:Math.round(month), pct:M.target ? Math.round(month / M.target * 100) : 0, over: M.target ? month > M.target : false, dayMax: M.target && M.days ? Math.round(M.target / 30) : 0 };
  });
}
function simCard(){
  if (!(may('users') || may('settings'))) return '';
  var M = simState(), types = simTypes(); if (!types.length) return '';
  var rows = simRows(), cap = M.target ? Math.round(M.target / 30) : 0;
  return card('محاكي الأوزان والتارجت — قبل الضبط',
    '<p class="hint" style="margin-top:0">' + esc(t('غيّر الوزنَ لكلِّ نوعٍ والتارجتَ الشهريَّ وانظر أثرَهما على ما سُجّل فعلًا — لا يُغيَّر شيءٌ حتى تضغط «اعتمد».')) + '</p>'
    + '<div class="grid2" style="margin-bottom:8px">'
    + types.map(function(k){ return '<div class="field"><label>' + esc(t('وزن')) + ' ' + esc(t(k)) + '</label><input type="number" inputmode="decimal" step="0.5" min="0" value="' + simW(k) + '" data-simw="' + esc(k) + '"></div>'; }).join('')
    + '<div class="field"><label>' + esc(t('التارجت الشهري (نقطة)')) + '</label><input type="number" inputmode="numeric" min="0" value="' + (+M.target || 0) + '" data-simt="target"></div>'
    + '<div class="field"><label>' + esc(t('أيام العمل في الشهر')) + '</label><input type="number" inputmode="numeric" min="1" max="31" value="' + (+M.days || 26) + '" data-simt="days"></div></div>'
    + (cap ? '<p class="hint" style="margin:0 0 8px">' + esc(t('سقفُ اليوم عند هذا التارجت')) + ': <b class="num">' + nm(cap) + '</b> ' + esc(t('نقطة (التارجت ÷ ٣٠)')) + '</p>' : '')
    + table(['الاسم', 'نقاط بالأوزان المقترحة', 'أيام', 'نقطة / يوم', 'إسقاطُ الشهر', 'من التارجت', 'يعدّيه؟'],
        rows.map(function(r){ return ['<strong>' + esc(dispName(r.name)) + '</strong>', N(r.pts), N(r.days), N(r.perDay), N(r.month), r.pct ? pill(nm(r.pct) + '٪', r.over ? 'bad' : r.pct >= 80 ? 'wrn' : 'ok') : '\u2014', r.over ? '<span class="req">' + esc(t('نعم')) + '</span>' : esc(t('لا'))]; }))
    + '<div class="actions" style="margin-top:8px">' + btn('\u2713 ' + t('اعتمد الأوزانَ والتارجت'), 'btn-primary btn-sm', ' data-simapply="1"')
    + btn(t('ألغِ الإضافي الآن (المعامل = ١)'), 'btn-secondary btn-sm', ' data-simot="1"') + '</div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('«اعتمد» يكتب الوزنَ لكلِّ مشعرٍ في مصفوفة الأوزان وتارجتَ المسح الشهري في ثوابت النظام — ويُعاد حسابُ المستحقّ لكلِّ ما سُجّل. «ألغِ الإضافي» يجعل ما فوق سقف اليوم يُحتسب بالسعر نفسه.')) + '</p>');
}
/* ═══ كيف يُحسب المستحقّ (V19.0) ═══
   سأل صاحبُ المشروع أمام الرقم: «الفلوس دي بتاعت إيه؟». الشاشةُ تجيب الآن بنفسها:
   المعادلةُ بقيمها الحالية، وأوزانُ ما سُجّل فعلًا، ومثالٌ محسوبٌ على أعلى عضو —
   وأين يُضبَط كلُّ رقم. لا حسابَ ثانٍ: القيمُ نفسُها التي تحسب بها scores(). */
function moneyHowCard(S){
  if (!(may('users') || may('money') || may('settings'))) return '';
  var ph = cfgGet('ph'), ot = cfgGet('otRate') || 1.5, tg = cfgGet('tgtSurvey'), days = cfgGet('days') || 30;
  var otOn = ot > 1 && tg > 0;
  /* مفاتيحُ الإحصاء «مشعر|نوعٌ خام»، ومفاتيحُ الأوزان «مشعر|تصنيفٌ عربيٌّ خام» */
  var K = siteKeyStats();
  var rows = K.keys.filter(function(k){ return K.by[k]; }).slice(0, 14).map(function(k){
    var z = k.split('|')[0], ty = k.split('|')[1], lab = (CAT_DEF[ty] && CAT_DEF[ty].l) || ty;
    var wv = cfgGet('w', z + '|' + lab) || cfgGet('w', lab);
    return [esc(t(z)), esc(t(lab)), wv ? N(wv) : '<span class="req">' + esc(t('بلا وزن')) + '</span>', N(K.sv && K.sv[k] || 0)];
  });
  var top = S.list[0];
  var ex = top ? '<p style="margin:8px 0 0">' + esc(t('مثال')) + ': <b>' + esc(dispName(top.name)) + '</b> \u2014 ' + nm(top.total) + ' ' + esc(t('نقطة')) + ' \u00d7 ' + nm(ph) + ' = <b>' + nm(Math.round(top.total * ph)) + '</b> ' + esc(t('ريال'))
    + (otOn && top.over ? ' <span class="hint" style="margin:0">(' + esc(t('منها إضافيٌّ')) + ' ' + nm(top.over) + ' \u00d7 ' + nm(ot) + ')</span>' : '') + '</p>' : '';
  return card('كيف يُحسب المستحقّ',
    '<p style="margin-top:0"><b>' + esc(t('المستحقّ = نقاطُ الأعمال المعتمدة × سعرُ النقطة')) + '</b>'
    + (otOn ? ' \u2014 ' + esc(t('وما زاد في يومٍ عن سقف اليوم')) + ' (' + nm(tg) + ' \u00f7 ' + nm(days) + ' = ' + nm(Math.round(tg / days)) + ') ' + esc(t('يُضرَب في')) + ' ' + nm(ot) : ' \u2014 ' + esc(t('بلا إضافي')))
    + '</p>'
    + stats([['سعرُ النقطة', nm(ph) + ' ' + t('ريال'), ph ? '' : 'wrn'], ['التارجتُ الشهريُّ للمسح', N(tg), tg ? '' : 'wrn'], ['معاملُ الإضافي', otOn ? nm(ot) : t('لا إضافي')]])
    + (rows.length ? table(['المشعر', 'النوع', 'وزنُ الزيارة', 'زياراتٌ مسجّلة'], rows) : '')
    + ex
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('النقاطُ من الأعمال المعتمدة وحدَها (المسحُ المعتمَدُ تقنيًّا، والتركيبُ المعتمَد، والفكّ، والورشة) — ويُعاد الحسابُ فورًا متى تغيّر وزنٌ أو سعر.')) + '</p>'
    + '<div class="actions">' + btn(t('اضبط الأوزان'), 'btn-quiet btn-sm', ' data-goto="pts"') + btn(t('اضبط السعر والتارجت'), 'btn-quiet btn-sm', ' data-goto="consts"') + '</div>');
}
/* ═══ سجلاتُ الإدارة (V19.3) ═══
   الدروسُ المستفادة، والمراجعاتُ الدورية، وأصحابُ المصلحة — في وثيقةٍ واحدة
   settings/pmo (قاعدتُها: المكتبُ والإدارةُ العليا قراءةً، والمكتبُ كتابةً). كلُّ
   مدخلٍ بمعرِّفه وتاريخه وكاتبه، والحذفُ شاهدٌ لا محو. تُقرأ عند فتح شريحتها. */
var PMO = { at:0, v:null, err:'' };
var PMO_LEVELS = ['غير مدرك', 'مقاوم', 'محايد', 'داعم', 'قائد'];
var PMO_DOMAINS = ['الحوكمة', 'النطاق', 'الجدول', 'المالية', 'أصحاب المصلحة', 'الموارد', 'المخاطر'];
function pmoSees(){ return may('settings') || effRole(ROLE) === 'exec'; }
function pmoFetch(force){
  if (!pmoSees()) return;
  if (!force && (PMO.v || Date.now() - PMO.at < 600000)) return;
  if (!FB.ready || !FB.db){ PMO.v = PMO.v || STATE.pmo || { lessons:{}, retros:{}, stake:{} }; return; }
  PMO.at = Date.now();
  DB.col('settings').doc('pmo').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    PMO.v = (doc && doc.exists) ? doc.data() : {}; STATE.pmo = PMO.v; if (CUR === 'exec') render(1);
  }).catch(function(e){ PMO.err = String(e && (e.code || e.message) || e).slice(0, 60); });
}
function pmoList(sec){
  var o = ((PMO.v || STATE.pmo || {})[sec]) || {};
  return Object.keys(o).map(function(k){ return Object.assign({ id:k }, o[k]); }).filter(function(x){ return x && !x.gone; }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
/* (V28.2) قرارُ المالك: «كلُّ سجلٍّ من أصغره لأكبره: إضافة وتعديل ومسح». سجلاتُ الإدارة (الدروس، المراجعات الدورية،
   أصحابُ المصلحة) كانت إضافةً وحذفًا فقط — صار لكلِّ صفٍّ «✎» يملأ نموذجَ الإضافة بقيمه، و«احفظ التعديل» يكتب على السجلِّ نفسِه. */
var PMO_ED = { sec:'', id:'' };
var PMO_FORM = { lessons:{ t:'lsT', d:'lsD', w:'lsW', c:'lsC', a:'lsA', o:'lsO' }, retros:{ p:'rtP', g:'rtG', i:'rtI', a:'rtA' }, stake:{ n:'shN', r:'shR', inf:'shI', int:'shT', cur:'shC', want:'shD', s:'shS', o:'shO' } };
function pmoEdBtn(sec, id){ return btn('\u270E', 'btn-quiet btn-sm', ' data-pmoedit="' + sec + '|' + esc(id) + '" aria-label="' + esc(t('تعديل')) + '"'); }
function pmoEdLabel(sec, addLabel){ return PMO_ED.sec === sec ? t('احفظ التعديل') : t(addLabel); }
function pmoEdCancel(sec){ return PMO_ED.sec === sec ? btn(t('إلغاء التعديل'), 'btn-quiet btn-sm', ' data-pmoedcancel="1"') : ''; }
function pmoEdId(sec, fresh){ return PMO_ED.sec === sec && PMO_ED.id ? PMO_ED.id : fresh; }
function pmoEdFill(){
  var f = PMO_FORM[PMO_ED.sec]; if (!f) return;
  var x = pmoList(PMO_ED.sec).filter(function(r){ return r.id === PMO_ED.id; })[0]; if (!x) return;
  var first = null;
  Object.keys(f).forEach(function(k){ var el = document.getElementById(f[k]); if (!el) return; el.value = x[k] == null ? '' : String(x[k]); if (!first) first = el; });
  if (first){ try { first.scrollIntoView({ block:'center' }); first.focus(); } catch (e){ LS_ERR = e; } }
}
function pmoPut(sec, id, entry){
  if (!may('settings')){ toast(t('سجلاتُ الإدارة للمهندس فمن فوقه')); return false; }
  PMO.v = PMO.v || STATE.pmo || {}; PMO.v[sec] = PMO.v[sec] || {}; PMO.v[sec][id] = entry; STATE.pmo = PMO.v;
  var w = {}; w[sec] = {}; w[sec][id] = entry;
  CORE.set('cfg', 'pmo', w);
  logEvent((entry.gone ? 'حذفٌ من ' : 'سجلُّ الإدارة — ') + sec + ' · ' + id, '');
  return true;
}
function pmoVal(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim().slice(0, 600) : ''; }
function lessonsBody(){
  pmoFetch();
  var L = pmoList('lessons'), R = pmoList('retros'), ed = may('settings');
  var dom = '<select id="lsD">' + PMO_DOMAINS.map(function(d){ return '<option value="' + esc(d) + '">' + esc(t(d)) + '</option>'; }).join('') + '</select>';
  return stats([['دروسٌ مسجّلة', N(L.length)], ['مراجعاتٌ دورية', N(R.length)], ['آخرُ مراجعة', R[0] ? fmtDate(R[0].at) : '\u2014', R[0] && Date.now() - R[0].at < 14 * 864e5 ? 'ok' : 'wrn']])
    + (ed ? card('درسٌ مستفادٌ جديد',
        '<div class="grid2"><label>' + esc(t('العنوان')) + '<input id="lsT"></label><label>' + esc(t('المجال')) + dom + '</label></div>'
        + '<label>' + esc(t('ما الذي حدث')) + '<textarea id="lsW" rows="2"></textarea></label>'
        + '<label>' + esc(t('السبب')) + '<textarea id="lsC" rows="2"></textarea></label>'
        + '<div class="grid2"><label>' + esc(t('الإجراء')) + '<input id="lsA"></label><label>' + esc(t('المسؤول')) + '<input id="lsO"></label></div>'
        + '<div class="actions">' + btn(pmoEdLabel('lessons', 'سجّل الدرس'), 'btn-primary btn-sm', ' data-lessonadd="1"') + pmoEdCancel('lessons') + '</div>') : '')
    + (L.length ? cardFlush(t('الدروس المستفادة') + ' \u2014 ' + nm(L.length),
        table(['التاريخ', 'العنوان', 'المجال', 'السبب', 'الإجراء', 'المسؤول', ''], L.map(function(x){
          return [esc(fmtDate(x.at)), '<b>' + esc(x.t || '') + '</b>' + (x.w ? '<div class="hint" style="margin:2px 0 0">' + esc(x.w) + '</div>' : ''), esc(t(x.d || '')), esc(x.c || ''), esc(x.a || ''), esc(x.o || ''),
                  ed ? pmoEdBtn('lessons', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="lessons|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + (ed ? card('مراجعةٌ دورية',
        '<label>' + esc(t('الفترة')) + '<input id="rtP" placeholder="' + esc(t('مثال: أسبوع ٢١–٢٧ سبتمبر')) + '"></label>'
        + '<label>' + esc(t('ما نجح')) + '<textarea id="rtG" rows="2"></textarea></label>'
        + '<label>' + esc(t('ما يُحسَّن')) + '<textarea id="rtI" rows="2"></textarea></label>'
        + '<label>' + esc(t('الإجراءات ومن يملكها')) + '<textarea id="rtA" rows="2"></textarea></label>'
        + '<div class="actions">' + btn(pmoEdLabel('retros', 'سجّل المراجعة'), 'btn-primary btn-sm', ' data-retroadd="1"') + pmoEdCancel('retros') + '</div>') : '')
    + (R.length ? cardFlush(t('المراجعات الدورية') + ' \u2014 ' + nm(R.length),
        table(['التاريخ', 'الفترة', 'ما نجح', 'ما يُحسَّن', 'الإجراءات', ''], R.map(function(x){
          return [esc(fmtDate(x.at)), esc(x.p || ''), esc(x.g || ''), esc(x.i || ''), esc(x.a || ''), ed ? pmoEdBtn('retros', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="retros|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + '<p class="hint">' + esc(t('المراجعةُ كلَّ أسبوعين على الأقل — تقيسها «مطابقة المنهجية». والدرسُ يُكتَب حين يقع لا في آخر الموسم.')) + '</p>'
    + lessLegacyBody()   /* (V27.1) */;
}
function stakeBody(){
  pmoFetch();
  var S = pmoList('stake'), ed = may('settings');
  var lv = function(id, cur){ return '<select id="' + id + '">' + PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>'; };
  var hl = function(id){ return '<select id="' + id + '"><option value="3">' + esc(t('عالٍ')) + '</option><option value="2" selected>' + esc(t('متوسط')) + '</option><option value="1">' + esc(t('منخفض')) + '</option></select>'; };
  var gap = S.filter(function(x){ return PMO_LEVELS.indexOf(x.cur) < PMO_LEVELS.indexOf(x.want); }).length;
  return stats([['أصحابُ مصلحةٍ مسجّلون', N(S.length)], ['دون المطلوب', N(gap), gap ? 'wrn' : 'ok']])
    + (ed ? card('صاحبُ مصلحةٍ جديد',
        '<div class="grid2"><label>' + esc(t('الجهة أو الشخص')) + '<input id="shN"></label><label>' + esc(t('الدور')) + '<input id="shR"></label></div>'
        + '<div class="grid2"><label>' + esc(t('التأثير')) + hl('shI') + '</label><label>' + esc(t('الاهتمام')) + hl('shT') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الانخراط الحالي')) + lv('shC', 'محايد') + '</label><label>' + esc(t('الانخراط المطلوب')) + lv('shD', 'داعم') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الخطة')) + '<input id="shS"></label><label>' + esc(t('المسؤول')) + '<input id="shO"></label></div>'
        + '<div class="actions">' + btn(pmoEdLabel('stake', 'أضف'), 'btn-primary btn-sm', ' data-stakeadd="1"') + pmoEdCancel('stake') + '</div>') : '')
    + (S.length ? cardFlush(t('سجل أصحاب المصلحة') + ' \u2014 ' + nm(S.length),
        table(['الجهة', 'الدور', 'تأثير/اهتمام', 'الحالي ← المطلوب', 'الخطة', 'المسؤول', 'آخر مراجعة', ''], S.map(function(x){
          var g = PMO_LEVELS.indexOf(x.cur) < PMO_LEVELS.indexOf(x.want);
          return ['<b>' + esc(x.n || '') + '</b>', esc(x.r || ''), nm(x.inf || 0) + ' / ' + nm(x.int || 0),
                  (ed ? '<select data-stakecur="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (x.cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>' : esc(t(x.cur || '')))
                    + ' \u2190 ' + pill(t(x.want || ''), g ? 'wrn' : 'ok'),
                  esc(x.s || ''), esc(x.o || ''), esc(fmtDate(x.at)), ed ? pmoEdBtn('stake', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="stake|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + '<p class="hint">' + esc(t('مصفوفةُ الانخراط: غير مدرك · مقاوم · محايد · داعم · قائد. تغييرُ الحالي يؤرّخ المراجعة.')) + '</p>';
}
/* ═══ مطابقةُ المنهجية (V19.3) ═══
   كلُّ بندٍ من دليل المعرفة (الإصدار الثامن: ستةُ مبادئ وسبعةُ مجالات) والمنهجِ الرشيق
   (أربعةُ مجالات) ومنهجِ إدارة مشاريع الذكاء الاصطناعي (ستُّ مراحل): دليلُه في النظام،
   وحالتُه من البيانات نفسِها لا من وجود الشاشة — مطبَّقٌ فعلًا، أو جزئيّ، أو ناقص، أو لا
   ينطبق. تُحسَب عند الفتح؛ ولا كتابة. */
function pmiRows(){
  var now = Date.now(), D30 = 30 * 864e5, D14 = 14 * 864e5, out = [];
  var ok = function(v){ return v ? 'ok' : 'part'; };
  var recs = Object.keys(STATE.recs || {}).map(function(k){ return STATE.recs[k]; }).filter(Boolean);
  var apr = recs.filter(function(r){ return r.reviewAt || r.review === 'approved'; }).length;
  var byPct = recs.length ? Math.round(recs.filter(function(r){ return r._by || r.by; }).length / recs.length * 100) : 0;
  var RR = (typeof readyRows === 'function') ? readyRows() : [];
  var rd = function(title){ var r = RR.filter(function(x){ return x.t === title; })[0]; return r ? !!r.ok : null; };
  var diss = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; }).filter(function(x){ return x && x.status === 'تم الفك'; });
  var good = diss.filter(function(x){ return x.cond === 'سليم'; }).length;
  var nw14 = Object.keys(STATE.newsites || {}).filter(function(k){ var x = STATE.newsites[k]; return x && now - (x.at || 0) < D14; }).length;
  var bugs = Object.keys(STATE.bugs || {}).length, chal = recs.filter(function(r){ return (r.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; }); }).length;
  var chg = Object.keys(STATE.changes || {}).length, ncr = Object.keys(STATE.ncr || {}).length;
  var risks = (typeof risksList === 'function') ? risksList() : [], rsk30 = risks.filter(function(r){ return r.at && now - r.at < D30; }).length;
  var st = pmoList('stake'), st30 = st.filter(function(x){ return now - (x.at || 0) < D30; }).length;
  var ls = pmoList('lessons'), ls30 = ls.filter(function(x){ return now - (x.at || 0) < D30; }).length;
  var rt = pmoList('retros'), rt14 = rt.filter(function(x){ return now - (x.at || 0) < D14; }).length;
  var dq = (typeof dqDupPos === 'function' ? dqDupPos().length : 0) + (typeof dqNoCo === 'function' ? dqNoCo().length : 0) + (typeof dqNoSign === 'function' ? dqNoSign().length : 0) + (typeof dqFar === 'function' ? dqFar().length : 0);
  var pf = Object.keys(STATE.presence || {}).some(function(u){ var p = STATE.presence[u]; return p && p.pf; });
  var sr = (typeof SYSREP === 'object' && SYSREP.v && SYSREP.v.pulse && SYSREP.v.pulse.at) ? SYSREP.v.pulse.at : 0;
  var tasks = Object.keys(STATE.tasks || {}).length, crews = (STATE.crews || []).length;
  var add = function(fw, code, title, ev, stt, note, go){ out.push({ fw:fw, code:code, title:title, ev:ev, st:stt, note:note || '', go:go || '' }); };
  /* دليلُ المعرفة — المبادئ */
  add('pmbok', 'P1', 'النظرة الشاملة', 'رقمٌ واحدٌ لكلِّ نقطةٍ في كلِّ الشاشات من دورة حياةٍ واحدة', 'ok', nm((STATE.sites || []).length) + ' ' + t('نقطة'), 'over');
  add('pmbok', 'P2', 'التركيز على القيمة', 'النقاطُ من العمل المعتمَد وحدَه، والقيمةُ بسعر النقطة', cfgGet('ph') > 0 && apr ? 'ok' : 'part', nm(apr) + ' ' + t('زيارةً معتمدة') + (cfgGet('ph') > 0 ? '' : ' \u00b7 ' + t('بلا سعر نقطة')), 'perf');
  add('pmbok', 'P3', 'دمج الجودة', 'اعتمادٌ تقنيٌّ قبل الوزارة، وتدقيقٌ قبل الإقفال، وسجلُّ عدم المطابقة', ok(apr > 0), nm(apr) + ' ' + t('معتمدة') + ' \u00b7 ' + nm(ncr) + ' ' + t('عدم مطابقة'), 'svappr');
  add('pmbok', 'P4', 'القيادة المسؤولة', 'كلُّ تعديلٍ مسجَّلٌ باسم من كتبه، والقراراتُ بتاريخها وصاحبها', byPct >= 90 ? 'ok' : 'part', nm(byPct) + '\u066A ' + t('من السجلات مختومة'), 'ev');
  add('pmbok', 'P5', 'دمج الاستدامة', 'إعادةُ استخدام معدّات الفك (السليمُ يعود للمخزن)', diss.length ? (good / diss.length >= 0.7 ? 'ok' : 'part') : 'na', diss.length ? t('إعادة الاستخدام') + ' ' + nm(Math.round(good / diss.length * 100)) + '\u066A' : t('يبدأ القياسُ مع الفك'), 'dis');
  add('pmbok', 'P6', 'بناء فرقٍ ممكّنة', 'الميدانُ يضيف النقاطَ ويبلّغ ويرى أداءه', ok(nw14 + bugs + chal > 0), nm(nw14) + ' ' + t('نقطة جديدة') + ' \u00b7 ' + nm(chal) + ' ' + t('إفادة تحدٍّ'), 'chalm');
  /* دليلُ المعرفة — مجالاتُ الأداء */
  add('pmbok', 'D1', 'الحوكمة', 'مسارُ الاعتماد والأدوارُ وسجلُّ القرارات', ok(apr > 0), nm(apr) + ' ' + t('قرار اعتماد'), 'appr');
  add('pmbok', 'D2', 'النطاق', 'سجلُّ النقاط وطلباتُ التغيير', chg ? 'ok' : 'part', nm(chg) + ' ' + t('طلب تغيير'), 'chg');
  var sch = [rd('موعدا المسح والتركيب'), rd('مواعيدُ المعالم')];
  add('pmbok', 'D3', 'الجدول', 'المواعيدُ والمعالمُ وتوقّعُ الاكتمال لكلِّ مشعر', sch.every(function(v){ return v !== false; }) ? 'ok' : 'part', sch.every(function(v){ return v !== false; }) ? t('المواعيد مضبوطة') : t('موعدٌ أو معلمٌ ناقص'), 'miles');
  var fin = [['سقفُ الميزانية', rd('سقفُ الميزانية')], ['خطُّ الأساس مجمَّد', rd('خطُّ الأساس مجمَّد')], ['سعرُ النقطة', rd('سعرُ النقطة')]];
  var finMiss = fin.filter(function(x){ return x[1] === false; }).map(function(x){ return t(x[0]); });
  add('pmbok', 'D4', 'المالية', 'الميزانيةُ والقيمةُ المكتسبة على خطِّ أساسٍ مجمَّد', finMiss.length ? (finMiss.length === fin.length ? 'gap' : 'part') : 'ok', finMiss.length ? t('ينقص') + ': ' + finMiss.join(' \u00b7 ') : t('مؤشّرا الكلفة والجدول متاحان'), 'evm');
  add('pmbok', 'D5', 'أصحاب المصلحة', 'سجلُّ أصحاب المصلحة بالانخراط الحاليِّ والمطلوب', st.length >= 3 && st30 ? 'ok' : (st.length ? 'part' : 'gap'), nm(st.length) + ' ' + t('مسجّل') + ' \u00b7 ' + nm(st30) + ' ' + t('روجع في ٣٠ يومًا'), 'stake');
  add('pmbok', 'D6', 'الموارد', 'الفرقُ والمهامُّ والعُهدةُ والسيارات', ok(crews > 0 && tasks > 0), nm(crews) + ' ' + t('فريق') + ' \u00b7 ' + nm(tasks) + ' ' + t('مهمة'), 'assign');
  add('pmbok', 'D7', 'المخاطر', 'سجلُّ المخاطر بالاحتمال والأثر والاستجابة والمالك', rsk30 ? 'ok' : 'part', nm(risks.length) + ' ' + t('خطر') + ' \u00b7 ' + nm(rsk30) + ' ' + t('روجع في ٣٠ يومًا'), 'risks');
  /* المنهجُ الرشيق */
  add('acp', 'A1', 'العقلية', 'حلقاتُ تغذيةٍ قصيرة: قطارُ إصدارٍ مرتين أسبوعيًّا وبلاغاتُ الميدان بخطِّها الزمني', 'ok', t('قطار الأحد والأربعاء'), 'bugs');
  add('acp', 'A2', 'القيادة', 'مشاركةُ المعرفة: دروسٌ مستفادةٌ مسجّلة', ls30 ? 'ok' : (ls.length ? 'part' : 'gap'), nm(ls.length) + ' ' + t('درس') + ' \u00b7 ' + nm(ls30) + ' ' + t('في ٣٠ يومًا'), 'lessons');
  add('acp', 'A3', 'المنتج', 'قائمةُ العمل مرئيةٌ ومرتّبة: طلباتُ الزيارة والإسنادُ على الخريطة', ok(tasks > 0), nm(tasks) + ' ' + t('مهمة'), 'reqreg');
  add('acp', 'A4', 'التسليم', 'مقاييسُ التدفّق (اليوميات والزمنُ بين المراحل) ومراجعاتٌ دورية', rt14 ? 'ok' : (rt.length ? 'part' : 'gap'), nm(rt14) + ' ' + t('مراجعة في ١٤ يومًا'), 'lessons');
  /* منهجُ إدارة مشاريع الذكاء الاصطناعي */
  add('ai', 'C1', 'فهم العمل', 'بوصلةُ القيمة والقراراتُ موثّقةٌ في المستودع', 'ok', t('موثّق'), '');
  add('ai', 'C2', 'فهم البيانات', 'مشكلاتُ البيانات معروفةٌ بعددها ونوعها', 'ok', nm(dq) + ' ' + t('مشكلة بيانات'), 'dq');
  add('ai', 'C3', 'تجهيز البيانات', 'لا مشكلةَ بياناتٍ مفتوحة', dq ? 'part' : 'ok', dq ? nm(dq) + ' ' + t('مفتوحة') : t('نظيفة'), 'dq');
  add('ai', 'C4', 'بناء النموذج', 'لا نموذجَ تعلّمٍ آليٍّ في النظام — التوقّعُ إحصائيٌّ خطّيٌّ بالقصد', 'na', t('لا ينطبق'), '');
  add('ai', 'C5', 'التقييم', 'قياسُ الأداء الحقيقيِّ من الأجهزة والاختباراتُ الآلية', ok(pf), pf ? t('قياسات الأجهزة تصل') : t('لا قياسات بعد'), 'usage');
  add('ai', 'C6', 'التشغيل والمراقبة', 'الصندوقُ الأسود وملخّصُ الصباح والمراقبةُ اليومية', sr && now - sr < 2 * 864e5 ? 'ok' : 'part', sr ? t('آخر ملخّص') + ' ' + fmtDate(sr) : t('لم يصل ملخّص'), 'sys');
  return out;
}
var PMI_ST = { ok:['مطبّق', 'ok'], part:['جزئي', 'wrn'], gap:['ناقص', 'bad'], na:['لا ينطبق', ''] };
function pmiBody(){
  pmoFetch(); if (typeof sysReportFetch === 'function') sysReportFetch();
  var R = pmiRows(), c = { ok:0, part:0, gap:0, na:0 }; R.forEach(function(r){ c[r.st]++; });
  var app = R.length - c.na, score = app ? Math.round((c.ok + c.part / 2) / app * 100) : 0;
  var sec = function(fw, title){
    var L = R.filter(function(r){ return r.fw === fw; });
    return cardFlush(t(title), table(['البند', 'الدليل في النظام', 'القياس', 'الحالة'], L.map(function(r){
      var S = PMI_ST[r.st];
      return ['<b>' + esc(r.code) + ' ' + esc(t(r.title)) + '</b>', esc(t(r.ev)) + (r.go ? ' ' + btn('\u2197', 'btn-quiet btn-sm', ' data-goto="' + esc(r.go) + '" aria-label="' + esc(t('افتح')) + '"') : ''), esc(r.note), pill(t(S[0]), S[1])];
    })));
  };
  return stats([['نسبةُ المطابقة', nm(score) + '\u066A', score >= 80 ? 'ok' : score >= 60 ? 'wrn' : 'bad'], ['مطبّق', N(c.ok), 'ok'], ['جزئي', N(c.part), c.part ? 'wrn' : ''], ['ناقص', N(c.gap), c.gap ? 'bad' : ''], ['لا ينطبق', N(c.na)]])
    + '<div class="actions">' + btn('\u2B07 ' + t('إكسل — مصفوفة المطابقة'), 'btn-secondary btn-sm', ' data-xls="pmi"') + '</div>'
    + sec('pmbok', 'دليل المعرفة (الإصدار الثامن) — المبادئ الستة ومجالات الأداء السبعة')
    + sec('acp', 'المنهج الرشيق — المجالات الأربعة')
    + sec('ai', 'منهج إدارة مشاريع الذكاء الاصطناعي — المراحل الست')
    + '<p class="hint">' + esc(t('الحالةُ من البيانات لا من وجود الشاشة: «مطبّق» له دليلٌ حديث، و«جزئي» مبنيٌّ وينقصه استعمالٌ أو ضبط، و«ناقص» لا دليلَ له. النسبةُ = المطبّقُ ونصفُ الجزئيِّ ÷ ما ينطبق.')) + '</p>';
}
/* ── حسب المرحلة: فريق كل مرحلةٍ على حدة، بتارجتها المستقل ── */
function perfStageTable(){
  var R = STAGE_ROLES[STAGE_TAB] || STAGE_ROLES.ins;
  var L = stageList(STAGE_TAB);
  var tgt = stageTarget(STAGE_TAB);
  var sum = L.reduce(function(a,e){ return a + e.total; }, 0);
  var acts = L.reduce(function(a,e){ return a + e.acts; }, 0);

  return '<div class="chips">' + Object.keys(STAGE_ROLES).map(function(k){
      var S = STAGE_ROLES[k], n = stageList(k).length;
      return '<button type="button" class="chip' + (STAGE_TAB===k?' on':'') + '" data-stab="' + k + '">'
        + S.i + ' ' + esc(t(S.n)) + (n ? ' <span class="num">' + nm(n) + '</span>' : '') + '</button>';
    }).join('') + '</div>'

    + stats([['أفراد المرحلة', N(L.length), 'acc'],
             ['أعمالهم', N(acts)],
             ['نقاطهم', N(Math.round(sum))],
             ['تارجت المرحلة', tgt ? N(tgt) : '—', tgt ? '' : 'wrn']])

    + card(R.i + ' ' + t(R.n),
        '<p class="hint" style="margin:0 0 11px">' + esc(t(R.d)) + '</p>'
        + (tgt ? meter('إنجاز المرحلة من تارجتها', sum, tgt) : '')
        + (L.length ? '' : '<p class="hint" style="margin:0">'
            + esc(t('لا أحد في هذه المرحلة بعد — تُضبط مرحلةُ كلِّ فنيٍّ في إسناد الأدوار.')) + '</p>'))

    + (L.length
      ? cardFlush(t('الفريق') + ' — ' + nm(L.length),
          table(['#','الفني','زيارة','تركيب','فك','تهيئة','تجميع','أعمال','عادي','إضافي','النقاط','المستحَق'],
            L.map(function(e, i){
              return [nm(i+1), '<strong>' + esc(dispName(e.name)) + '</strong>',
                      N(e.survey), N(e.install), N(e.dis), N(e.prep), N(e.asm),
                      N(e.acts), N(e.regular),
                      e.over ? '<span class="pill warn">' + nm(e.over) + '</span>' : '٠',
                      '<b>' + nm(e.total) + '</b>',
                      cfgGet('ph') ? N(e.money) : '—'];
            }),
            ['','<b>' + t('الإجمالي') + '</b>',
             N(L.reduce(function(a,e){return a+e.survey;},0)),
             N(L.reduce(function(a,e){return a+e.install;},0)),
             N(L.reduce(function(a,e){return a+e.dis;},0)),
             N(L.reduce(function(a,e){return a+e.prep;},0)),
             N(L.reduce(function(a,e){return a+e.asm;},0)),
             N(acts),
             N(Math.round(L.reduce(function(a,e){return a+e.regular;},0))),
             N(Math.round(L.reduce(function(a,e){return a+e.over;},0)*10)/10),
             '<b>' + nm(Math.round(sum)) + '</b>',
             cfgGet('ph') ? N(Math.round(L.reduce(function(a,e){return a+e.money;},0))) : '—']),
          '<div class="actions">'
          + btn('⬇ إكسل — هذه المرحلة','btn-secondary btn-sm',' data-xls="stage"')
          + btn('⬇ إكسل — كل المراحل','btn-secondary btn-sm',' data-xls="stages"')
          + '</div>')
      : '');
}

/* ═══ الأداء: صفحةٌ واحدة بخمسة مستويات — لا أربع شاشاتٍ متفرقة ═══
   كانت «تقرير الأداء» و«أداء المراحل» و«إنتاجية الفريق» و«مقابل التارجت»
   أربع شاشاتٍ تقرأ scores() نفسَها بصيغٍ متفاوتة الاكتمال — وإنتاجية
   الفريق تحديدًا مسودةٌ لم تكتمل: عمودُها «الفريق» يعرض أفرادًا، ولا فكَّ
   فيها ولا نسبة تارجت. صارت خمس عدساتٍ على نفس الرقم في صفحةٍ واحدة. */
PAGE.perf = { m:'الفرق', t:'الفرق والأداء',
  l:'من يعمل وبمن وبأيِّ معدَّل — الأداءُ والفرقُ والطواقم.',
  body:function(){
    var head = tabHead('perf'), cur = tabCur('perf');
    if (cur === 'crewman') return head + (may('phones') ? briefingHtml() : '') + (function(){
    var L = crewsList();
    if (!L.length){
      return card('لا فرقَ بعد',
        '<p class="hint" style="margin:0">' + esc(t('أنشئ أوّل فريقٍ لتبدأ.')) + '</p>')
        + (may('users') ? crewNewCard() : '');
    }
    if (!L.some(function(c){ return c.id === CREW_CUR; })) CREW_CUR = L[0].id;
    var crew = crewOf(CREW_CUR);
    var techs = crewTechs(crew);
    var subs  = crewTeams(crew);
    if (!subs.some(function(x){ return x.id === CTEAM_CUR; })) CTEAM_CUR = subs[0] ? subs[0].id : '';
    var tm = subs.filter(function(x){ return x.id === CTEAM_CUR; })[0] || null;
    var S = crewStat(crew);
    var byName = {};
    scores().list.forEach(function(e){ byName[e.name] = e; });
    var orphan = unassignedTechs();

    var html = '<div class="chips">' + L.map(function(c){
        var K = c.kind === '*' ? null : WO_KINDS[c.kind];
        var mem = techsList().filter(function(x){ return x.crew === c.n; }).length;
        return '<button type="button" class="chip' + (CREW_CUR===c.id?' on':'') + '" data-crewcur="' + esc(c.id) + '">'
          + (K ? K.i + ' ' : '\u{1F393} ') + esc(t(c.n)) + ' <span class="num">' + nm(mem) + '</span></button>';
      }).join('') + '</div>'

      + stats([['موظفو الفريق', N(techs.length), 'acc'],
               ['فرق فرعية', N(subs.length)],
               ['نقاط الشهر', N(S.month)],
               ['تارجت الشهر', S.tgtM ? N(S.tgtM) : '—']])
      + (S.tgtM ? meter('الإنجاز من تارجت الشهر', S.month, S.tgtM) : '')

      + card('بيانات الفريق',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الاسم')) + '</label>'
          +   (may('users')
                ? '<input value="' + esc(crew.n) + '" data-crn="' + esc(crew.n) + '" dir="auto">'
                : '<strong>' + esc(crew.n) + '</strong>') + '</div>'
          + '<div class="field"><label>' + esc(t('نوع العمل')) + '</label>'
          +   (may('users')
                ? '<select data-crk="' + esc(crew.n) + '">'
                  + Object.keys(WO_KINDS).map(function(k){
                      return '<option value="' + esc(k) + '"' + (crew.kind === k ? ' selected' : '')
                        + '>' + esc(t(WO_KINDS[k].n)) + '</option>';
                    }).join('')
                  + '<option value="*"' + (crew.kind === '*' ? ' selected' : '') + '>'
                  + esc(t('إدارة')) + '</option></select>'
                : esc(t((WO_KINDS[crew.kind] || {}).n || crew.kind))) + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
          +   (may('users')
                ? '<input value="' + esc(crew.d || '') + '" data-crd="' + esc(crew.n) + '" dir="auto">'
                : esc(crew.d || '')) + '</div>'
          + '</div>',
          may('users')
            ? ((techs.length || subs.length)
                ? '<span class="hint" style="margin:0">' + esc(t('فيه موظفون أو فرق فرعية — لا يُحذَف')) + '</span>'
                : btn('حذف الفريق','btn-quiet btn-sm',' data-crdel="' + esc(crew.n) + '"'))
            : '')

      + cardFlush(t('موظفو') + ' ' + esc(crew.n) + ' — ' + nm(techs.length),
          techs.length
            ? table(['الموظف','الوظيفة','الجوال','المشرف','نقاط الشهر',''],
                techs.map(function(x){
                  var e = byName[x.n];
                  return ['<input value="' + esc(x.n) + '" data-tkn="' + esc(x.n) + '" dir="auto">',
                          '<select data-tkjob="' + esc(x.n) + '">'
                            + '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                            + jobsList().map(function(j){
                                return '<option value="' + esc(j.id) + '"' + (x.job === j.id ? ' selected' : '')
                                  + '>' + esc(t(j.n)) + '</option>';
                              }).join('') + '</select>',
                          may('phones')
                            ? '<input value="' + esc(x.ph || '') + '" data-tkph="' + esc(x.n) + '" dir="ltr" placeholder="05…">'
                            : '<span class="hint" style="margin:0">' + esc(t('محجوب')) + '</span>',
                          '<select data-tksup="' + esc(x.n) + '">'
                            + mgrOptions(roleOfUser((STATE.users || {})[x.u]) || 'tech', x.sup || '', x.u) + '</select>',
                          N(e ? Math.round(e.total) : 0),
                          btn('حذف','btn-quiet btn-sm',' data-tkdel="' + esc(x.n) + '"')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا موظفين في هذا الفريق بعد.')) + '</p>',
          btn('حسابات الفنيين','btn-secondary btn-sm',' data-p="users"'))

      + (may('users')
        ? card('إضافة موظف',
            '<div class="grid cols-2">'
            + '<div class="field"><label>' + esc(t('الاسم')) + ' <span class="req">*</span></label>'
            +   '<input id="depN" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الجوال')) + '</label>'
            +   '<input id="depPh" dir="ltr" placeholder="05…"></div>'
            + '<div class="field"><label>' + esc(t('المشرف')) + '</label>'
            +   '<select id="depSup">' + mgrOptions('tech', '', '') + '</select></div>'
            + '</div>',
            btn('➕ إضافة موظف','btn-primary btn-sm',' data-depadd="' + esc(crew.id) + '"'))
        : '')

      + '<div class="chips">' + subs.map(function(x){
          return '<button type="button" class="chip' + (CTEAM_CUR===x.id?' on':'') + '" data-depteam="' + x.id + '">'
            + esc(dispName(x.n)) + ' <span class="num">' + nm(x.members.length) + '</span></button>';
        }).join('')
        + (may('users') ? btn('➕ فريق فرعي','btn-secondary btn-sm',' data-depteamnew="' + esc(crew.id) + '"') : '')
        + '</div>';

    if (!tm){
      html += card('لا فرقَ فرعية بعد',
        '<p class="hint" style="margin:0">'
        + esc(t('فرقُ الأنصبةِ تقسم نقاط موظفي هذا الفريق بنسبةٍ لكلِّ عضو — أنشئ أوّلها.'))
        + '</p>');
    } else {
      var tot = teamShare(tm), pts = teamPoints(tm);
      var ph = cfgGet('ph');
      var ok100 = tot === 100;

      html += stats([['أعضاء الفريق الفرعي', N(tm.members.length), 'acc'],
                     ['نقاط الفريق', N(pts)],
                     ['مجموع النسب', nm(tot) + '٪', ok100 ? 'ok' : 'bad'],
                     ['قيمة الفريق', ph ? N(Math.round(pts * ph)) + ' ' + t('ريال') : '—']])

        + (ok100 ? '' : alertBox('error','مجموعُ النسب ' + nm(tot) + '٪ — لا بدّ أن يكون مئةً بالضبط، وإلا ضاع نصيبٌ أو تكرّر.'))

        + card('اسم الفريق الفرعي',
            '<div class="field" style="max-width:340px;margin:0"><label>' + esc(t('الاسم')) + '</label>'
            + '<input data-tname="1" value="' + esc(tm.n) + '" dir="auto"></div>')

        + cardFlush('أعضاء ' + esc(tm.n),
            table(['العضو','الدور','النسبة ٪','نصيبه','مستحقّه',''],
              tm.members.map(function(m, i){
                var R = TEAM_ROLE[m.role] || TEAM_ROLE.tech;
                var sh = cfgN(m.share);
                var mine = tot ? (pts * sh / tot) : 0;
                return ['<strong>' + esc(m.name) + '</strong>',
                        '<select data-mrole="' + i + '">' + Object.keys(TEAM_ROLE).map(function(k){
                          return '<option value="' + k + '"' + (m.role===k?' selected':'') + '>'
                            + TEAM_ROLE[k].i + ' ' + esc(t(TEAM_ROLE[k].n)) + '</option>';
                        }).join('') + '</select>',
                        '<input type="number" min="0" max="100" step="1" value="' + sh
                          + '" data-share="' + i + '" style="max-width:88px">',
                        N(Math.round(mine * 10) / 10),
                        ph ? N(Math.round(mine * ph)) : '—',
                        btn('أخرِج','btn-quiet btn-sm',' data-depmemrm="' + i + '"')];
              }),
              ['<b>' + t('الإجمالي') + '</b>','',
               '<b class="' + (ok100 ? '' : 'req') + '">' + nm(tot) + '٪</b>',
               '<b>' + nm(pts) + '</b>',
               ph ? '<b>' + nm(Math.round(pts * ph)) + '</b>' : '—', '']),
            '<div class="actions">'
            + btn('وزّع بالتساوي','btn-secondary btn-sm',' data-depeven="1"')
            + btn('وزّع بالأدوار','btn-secondary btn-sm',' data-depbydef="1"')
            + (may('users') && !tm.members.length
                ? btn('حذف الفريق الفرعي','btn-quiet btn-sm',' data-depteamdel="' + esc(tm.id) + '"') : '')
            + '</div>')

        + card('إضافة عضو للفريق الفرعي',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الموظف')) + '</label>'
            + '<select id="depMemName">' + techs.filter(function(x){
                return !tm.members.some(function(m){ return m.name === x.n; });
              }).map(function(x){ return '<option>' + esc(x.n) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
            + '<select id="depMemRole">' + Object.keys(TEAM_ROLE).map(function(k){
                return '<option value="' + k + '">' + TEAM_ROLE[k].i + ' ' + esc(t(TEAM_ROLE[k].n)) + '</option>';
              }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('النسبة')) + ' ' + t('٪') + '</label>'
            + '<input type="number" id="depMemShare" min="0" max="100" value="20"></div>'
            + '</div>', btn('➕ إضافة','btn-primary btn-sm',' data-depmemadd="1"'));
    }

    if (may('users')) html += crewNewCard();

    if (orphan.length) html += alertBox('warn',
      esc(t('فيه')) + ' ' + nm(orphan.length) + ' ' + esc(t('موظفًا بلا فريقٍ صالح')) + ' \u00b7 '
      + orphan.map(function(x){ return esc(x.n); }).join(' \u00b7 ')
      + ' \u2014 ' + esc(t('اختر فريقًا له من قائمة «الموظف» أو أعِد إسنادَه من هنا.')));

    return html
      + '<p class="hint">' + esc(t('الفريقُ الذي فيه موظفون أو فرقٌ فرعيةٌ لا يُحذَف — انقلهم أولًا. وتغييرُ اسم الفريق ينقل من كان فيه معه.')) + '</p>';
  })();
    if (cur === 'crewplan') return head + (function(){
    var C = K();
    var rows = CREW_SPEC.map(function(s){ return { s:s, r:crewNeed(s, PLAN_MONTHS) }; });
    var ins = rows.filter(function(x){ return x.s.kind === 'install'; });
    var srv = rows.filter(function(x){ return x.s.kind === 'visit'; });
    var sum = function(L, f){ return L.reduce(function(a,x){ return a + f(x); }, 0); };

    return '<div class="chips">' + [3,4,5,6].map(function(m){
        return '<button type="button" class="chip' + (PLAN_MONTHS===m?' on':'') + '" data-months="' + m + '">'
          + nm(m) + ' ' + esc(t('أشهر')) + '</button>';
      }).join('') + '</div>'

      + stats([['فرق التركيب', N(sum(ins,function(x){return x.r.crews;})), 'acc'],
               ['أفرادها', N(sum(ins,function(x){return x.r.people;}))],
               ['معدّات', N(sum(ins,function(x){return x.r.gear;})), 'wrn'],
               ['أيام العمل', N((C.days||26) * PLAN_MONTHS)]])

      + cardFlush('طواقم التركيب',
          table(['الفريق','الطاقم','المعدل/يوم','النقاط','أيام-فريق','فرق لازمة','أفراد','معدّات'],
            ins.map(function(x){
              return ['<strong>' + esc(t(x.s.n)) + '</strong>',
                      nm(x.r.sup) + ' ' + esc(t('مشرف')) + ' + ' + nm(x.r.tech) + ' ' + esc(t('فني')),
                      N(x.r.rate), N(x.r.units), N(x.r.crewDays),
                      '<span class="pill acc">' + nm(x.r.crews) + '</span>',
                      N(x.r.people), x.r.gear ? N(x.r.gear) : '—'];
            }),
            ['الإجمالي','','', N(sum(ins,function(x){return x.r.units;})),
             N(sum(ins,function(x){return x.r.crewDays;})),
             N(sum(ins,function(x){return x.r.crews;})),
             N(sum(ins,function(x){return x.r.people;})),
             N(sum(ins,function(x){return x.r.gear;}))]))

      + cardFlush('طواقم المسح',
          table(['الفريق','الطاقم','المعدل/يوم','النقاط','أيام-فريق','فرق لازمة','أفراد'],
            srv.map(function(x){
              return ['<strong>' + esc(t(x.s.n)) + '</strong>',
                      nm(x.r.sup) + ' ' + esc(t('مشرف')) + ' + ' + nm(x.r.tech) + ' ' + esc(t('فني')),
                      N(x.r.rate), N(x.r.units), N(x.r.crewDays),
                      '<span class="pill acc">' + nm(x.r.crews) + '</span>', N(x.r.people)];
            }),
            ['الإجمالي','','', N(sum(srv,function(x){return x.r.units;})),
             N(sum(srv,function(x){return x.r.crewDays;})),
             N(sum(srv,function(x){return x.r.crews;})),
             N(sum(srv,function(x){return x.r.people;}))]))

      + card('ضبط المعدلات',
          table(['النوع','مشرف','فنيون','معدّات','المعدل/يوم'],
            CREW_SPEC.map(function(s){
              return [esc(t(s.n)),
                      cfgInput('crewSup', s.k), cfgInput('crewTech', s.k),
                      cfgInput('crewGear', s.k), cfgInput('crewRate', s.k, { dec:1 })];
            })),
          btn('حفظ المعدلات','btn-primary btn-sm',' data-cfgok="1"'))

      + card('تارجت التركيب يُحسب على القطع',
          '<p class="hint" style="margin:0 0 12px">' + esc(t('عدد النقاط لا يقيس الجهد: مخيمٌ فيه خمس عشرة قطعة ليس كمخيمٍ فيه ثلاث. فالتارجت يُقاس على قطع النقطة — وتُحدَّد قطع كل نقطةٍ بعد اعتماد مسحها.')) + '</p>'
          + flow(['مسح الموقع','اعتماد المسح','تُحدَّد قطع النقطة','تدخل الجدولة','تُركَّب وتُحتسب قطعًا'], 0)
          + '<div class="alert warn" style="margin:12px 0 0"><span>'
          + esc(t('القطع لكل نقطة تُحدَّد بعد اعتماد المسح — فالتارجت بالقطع يبقى تقديريًّا حتى يكتمل المسح.'))
          + '</span></div>');
  })();
    return head + (function(){
    var views = [['rank','الترتيب العام'], ['stage','حسب المرحلة'],
                 ['job','حسب الوظيفة'], ['crew','حسب الفريق'], ['project','المشروع كله']];
    var names = techNames();

    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (PERF_VIEW===v[0]?' on':'') + '" data-perfview="' + v[0] + '">'
          + esc(t(v[1])) + '</button>';
      }).join('') + '</div>';

    if (PERF_VIEW === 'stage'){
      html += perfStageTable();
    } else if (PERF_VIEW === 'job'){
      var byJob = rollupBy(function(e, tx){ return tx ? tx.job : ''; },
                            function(id){ var j = jobOf(id); return j ? j.n : 'بلا وظيفة'; });
      html += card('حسب الوظيفة', rollupTable(byJob, 'الوظيفة'));
    } else if (PERF_VIEW === 'crew'){
      var byCrew = rollupBy(function(e, tx){ return tx ? tx.crew : ''; });
      html += card('حسب الفريق', rollupTable(byCrew, 'الفريق'));
    } else if (PERF_VIEW === 'project'){
      var project = rollupBy(function(){ return 'المشروع'; });
      html += card('المشروع كله', rollupTable(project, 'المشروع'));
    } else {
      html += perfRankTable();
    }

    html += '<p class="hint">' + esc(t('لا رقمَ هنا مكتوبٌ بيد: كلُّه محسوبٌ من أوزان الإعدادات وما سجّله كلُّ فنيٍّ فعلًا، ونقاطُ الزيادة تُضاف بقرار المهندس أو مدير المشروع فقط.')) + '</p>';

    if (maySupEng()) html += bonusFormHtml(names, 'perf');
    html += bonusLogHtml(names);

    return html;
  })();
  }};


/* ═══ الفرق ونسبُ الأنصبة ═══
   المجموعةُ تنجز معًا، والنقاطُ تُقسَّم بنسبٍ تُكتب لكلِّ عضو:
   قائدُ الفريق أكبرُ نصيبًا من الفني، والفنيُّ من المساعد. */

var TEAM_ROLE = {
  lead:   { n:'قائد الفريق', i:'\u2605', def:35 },
  tech:   { n:'فني',         i:'\u25CF', def:25 },
  helper: { n:'مساعد',       i:'\u25CB', def:15 }
};

/* فرقُ الأنصبة تُنشأ من الشاشة — ولا بذرةَ فيها: كانت أسماءً مخترعةً
   «خالد» و«أحمد» و«سالم» و«ماجد» في «فريق مخيمات ١»، وهي عرضٌ يبقى بعد
   التسليم فيُقرأ حقيقة. */
var TEAMS = [];

var CTEAM_CUR = 'T1';

function teamOf(id){
  return TEAMS.filter(function(x){ return x.id === id; })[0] || TEAMS[0] || null;
}
function teamShare(tm){ return tm.members.reduce(function(a,m){ return a + cfgN(m.share); }, 0); }

/* نقاطُ الفريق: مجموعُ ما أنجزه أعضاؤه — ثم تُقسَّم بالنسب */
function teamPoints(tm){
  var n = 0;
  tm.members.forEach(function(m){ n += scoreOf(m.name).total; });
  return Math.round(n * 100) / 100;
}


/* ═══ فرق العمل — أربعةٌ لكلٍّ نوعُ مهمته وتقاريره ═══
   WO_KINDS في العامل أربعة: زيارة · تهيئة · تجميع · تركيب.
   الفريق دورٌ مخصَّصٌ يرث «مشرف» ويُقيَّد بنوعٍ واحد — فلا يرى إلا شغله. */

/* أنواعُ الفرق: كانت أربعةً ميدانيةً فقط — والمشروعُ فيه مستودعٌ ومشترياتٌ
   وفكٌّ ونقل، ولا فريقَ لهم فلا يُتابَعون ولا تُسنَد إليهم سيارة. */
var WO_KINDS = {
  visit:   { n:'زيارة',   i:'\u{1F50D}', c:'#E8C34B', tgt:'survey' },
  prep:    { n:'تهيئة',   i:'\u{1F6E0}', c:'#8FD3E8', tgt:'prep' },
  asm:     { n:'تجميع',   i:'\u{1F9F0}', c:'#C77DFF', tgt:'asm' },
  install: { n:'تركيب',   i:'\u{1F527}', c:'#3AD6A0', tgt:'ins' },
  dis:     { n:'فك',      i:'\u{1F9E9}', c:'#F2994A', tgt:'dis' },
  /* الصيانةُ حلقةٌ كانت ناقصةً بين التركيب والفكّ: ما رُكِّب يُخدَم في أثناء
     الموسم — يُسنَد كما يُسنَد التركيب، وله ترقيمُه (MR) ولونُه في الدورة. */
  maint:   { n:'صيانة',   i:'\u{1F6E1}', c:'#F5D547', tgt:'ins' },
  store:   { n:'مستودع',  i:'\u{1F4E6}', c:'#7DA9E8', tgt:'' },
  buy:     { n:'مشتريات', i:'\u{1F4B3}', c:'#E88FBF', tgt:'' },
  drive:   { n:'نقل',     i:'\u{1F69A}', c:'#9AA7B2', tgt:'' }
};

var CREWS = [
  { id:'eng',   n:'المهندسون',     base:'engineer',   kind:'*',
    d:'يديرون المشروع ويعتمدون ما يرفعه الفرق.',
    members:[] },
  { id:'cprep', n:'فريق التهيئة',  base:'supervisor', kind:'prep',
    d:'ضبط الجهاز وعنوانه ونظامه وفحصه قبل النزول.',
    members:[] },
  { id:'casm',  n:'فريق التجميع',  base:'supervisor', kind:'asm',
    d:'تركيب ما يدخل البوكس وتوصيله قبل النزول.',
    members:[] },
  { id:'cins',  n:'فريق التركيب',  base:'supervisor', kind:'install',
    d:'تركيب النقطة في موقعها وتوثيقها.',
    members:[] }
];

/* أرقام تمثيلية لكل فريق عبر الدورات الثلاث */
/* إحصاءُ أيِّ فريقٍ يُشتَقُّ من نوع مهمّته ومن أرصدة أعضائه: كان جدولًا
   بأربعة مفاتيحَ ثابتة، فأيُّ فريقٍ يُنشَأ لا يجد مفتاحَه فتسقط شاشةُ
   المتابعة كلُّها — ومن أنشأ فريقًا وجد شاشةً بيضاء. */
function crewStat(c){
  var K2 = T(), tgt = 0;
  if (c && c.kind === 'prep') tgt = K2.prep;
  else if (c && c.kind === 'asm') tgt = K2.asm;
  else if (c && c.kind === 'ins') tgt = K2.ins;
  else if (c && c.kind === 'dis') tgt = K2.dis || 0;
  var name = c ? c.n : '';
  var mine = scores().list.filter(function(e){
    return techsList().some(function(x){ return x.n === e.name && x.crew === name; });
  });
  var sum = function(f){ return mine.reduce(function(a, e){ return a + (e[f] || 0); }, 0); };
  return { day:0, week:0, month:Math.round(sum('total')), tgtM:tgt,
           open:0, done:sum('survey') + sum('install') + sum('dis') };
}

function crewOf(id){
  var L = crewsList();
  return L.filter(function(c){ return c.id === id; })[0] || L[0];
}

/* ── متابعة الفرق — لوحة المهندس ─────────────────── */
function crewSet(name, patch){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var c = crewsList().filter(function(x){ return x.n === name; })[0];
  if (!c) return;
  var oldName = c.n;
  Object.keys(patch).forEach(function(k){ c[k] = patch[k]; });
  /* تغييرُ الاسم ينقل من كان فيه: الفنيُّ يحمل اسمَ فريقه لا معرّفَه،
     فلو بقي الاسمُ القديمُ في سجله صار في فريقٍ لا وجودَ له. */
  if (patch.n && patch.n !== oldName){
    techsList().forEach(function(x){ if (x.crew === oldName) techSet(x.n, { crew:patch.n }); });
    TEAMS.forEach(function(tm){
      if (tm.crew === oldName){ tm.crew = patch.n; CORE.dirty('teams', tm.id, tm); }
    });
  }
  CORE.set('cfg', 'crews', crewsList());
  statBump();
}

var CREW_CUR = '';


function crewNewCard(){
  return card('إضافة فريق',
      '<div class="grid cols-3">'
      + '<div class="field"><label>' + esc(t('اسم الفريق')) + ' <span class="req">*</span></label>'
      +   '<input id="crN" dir="auto" placeholder="' + esc(t('فريق المستودع')) + '"></div>'
      + '<div class="field"><label>' + esc(t('نوع العمل')) + '</label>'
      +   '<select id="crKind">'
      +   Object.keys(WO_KINDS).map(function(k){
            return '<option value="' + esc(k) + '">' + esc(t(WO_KINDS[k].n)) + '</option>';
          }).join('') + '</select></div>'
      + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
      +   '<input id="crD" dir="auto"></div>'
      + '</div>',
      btn('➕ إضافة فريق','btn-primary btn-sm',' data-craddgo="1"'));
}


/* ── التقارير الدورية ───────────────────────────── */
var PERIODS = [
  ['day',   'يومي',    'نهاية كل يوم عمل',      '١٧:٠٠'],
  ['week',  'أسبوعي',  'صباح أول يوم في الأسبوع','٠٧:٠٠'],
  ['month', 'شهري',    'أول يوم في الشهر',       '٠٧:٠٠']
];

var CREW_REPORTS = [
  ['نقاط اليوم لكل منفِّذ',      'day',   'كل الفرق', 'ما أنجزه كلُّ فردٍ اليوم بنوع مهمته'],
  ['المفتوح والمتأخر',           'day',   'كل الفرق', 'المهام التي لم تُقفل ومَن عندها'],
  ['الفريق مقابل تارجته',        'week',  'كل الفرق', 'الأسبوعي مقابل ما أُنجز فعلًا'],
  ['الورشة — تهيئةً وتجميعًا',   'week',  'التهيئة والتجميع', 'ما خرج من الورشة جاهزًا للنزول'],
  ['التركيب في الميدان',         'week',  'التركيب',  'ما رُكّب وما تعذّر وما ينتظر التدقيق'],
  ['المسح الميداني',             'week',  'الزيارة',  'ما مُسح وما بقي وتحدياته'],
  ['أداء الفرق الشهري',          'month', 'كل الفرق', 'الشهر كاملًا مقابل التارجت مع الاتجاه'],
  ['العُهدة والمستهلك',          'month', 'كل الفرق', 'ما في يد كل فريق وما استهلكه'],
  ['الملخص التنفيذي',            'month', 'المهندسون','المشروع كله في صفحة'],
];

function crSaveTimes(){
  if (!may('settings')){ toast(t('إدارةُ التقارير للمهندس وحده')); return; }
  var vals = {};
  document.querySelectorAll('[data-crtime]').forEach(function(el){
    vals[el.getAttribute('data-crtime')] = el.value;
  });
  CFG.crTime = vals;
  CORE.set('cfg', 'crTime', vals);
  logEvent('حفظ مواعيد التقارير الدورية');
  toast(t('حُفظت المواعيد'));
}



/* ── شغل الفريق — ما يراه عضوه ──────────────────── */
;

var CREW_VIEW = 'cprep';

/* ═══ حسابات الفنيين — إنشاءٌ جماعيٌّ وفرديّ ═══
   الفني يعمل تحت مشرفه: يرى المُسند إليه وينفّذه ولا يعتمد شيئًا.
   ويُولَّد له اسم مستخدمٍ من اسمه وكلمةُ مرورٍ يبدّلها أول دخول. */

/* طاقمُ موسم ١٤٤٧ كما استُخرج من أوراق التنفيذ اليومية في النظام القديم —
   اثنان وأربعون فنيًّا. وكانت هنا ستةُ أسماءٍ مخترعةٍ للعرض بأرقامٍ وهمية،
   فمن وزّع العملَ عليها وزّعه على من لا وجودَ له. الهاتفُ والفريقُ والمشرفُ
   تُملأ من شاشة الفنيين — ولا تُخترَع هنا. */
/* بذرةُ الفنيين حُذفت في V15.35 — المصدرُ الواحدُ للأشخاص هو الحسابات:
   من يُضاف في «المستخدمون والأدوار ← الحسابات» بوظيفته يظهر في دورة وظيفته
   تلقائيًّا. لا مكانَ ثانيًا تُضاف فيه أسماء. */
var TECHS = [];


/* ═══ الطواقم والمعدلات — من الواقع الميداني ═══
   التركيب: المخيم أربعةٌ (مشرف + ثلاثة) بمعدل مخيمين يوميًّا،
            والممر خمسةٌ (مشرف + أربعة) ومعدّتان بمعدل نقطةٍ واحدةٍ يوميًّا.
   الزيارة: عشرون مخيمًا أو عشر نقاط ممرٍّ يوميًّا.
   وتارجت التركيب يُحسب على قطع النقطة لا على عددها. */

var CREW_SPEC = [
  { k:'ins_camp', n:'فريق تركيب — مخيمات', kind:'install', zone:'camp',
    sup:1, tech:3, gear:0, rate:2,
    d:'مشرفٌ وثلاثة فنيين — مخيمان في اليوم.' },
  { k:'ins_cor',  n:'فريق تركيب — ممرات',  kind:'install', zone:'cor',
    sup:1, tech:4, gear:2, rate:1,
    d:'مشرفٌ وأربعة فنيين ومعدّتان — نقطةُ ممرٍّ واحدةٌ في اليوم.' },
  { k:'srv_camp', n:'فريق مسح — مخيمات',   kind:'visit',   zone:'camp',
    sup:1, tech:1, gear:0, rate:20,
    d:'عشرون مخيمًا في اليوم.' },
  { k:'srv_cor',  n:'فريق مسح — ممرات',    kind:'visit',   zone:'cor',
    sup:1, tech:1, gear:0, rate:10,
    d:'عشر نقاط ممرٍّ في اليوم.' }
];

var UNITS = { camp:1392, cor:190 };

function crewNeed(spec, months){
  var days = cfgGet('days') * months;
  var units = UNITS[spec.zone] || 0;
  var rate = crewVal(spec.k,'Rate') || spec.rate;
  var crewDays = rate ? (units / rate) : 0;
  var crews = days ? Math.ceil(crewDays / days) : 0;
  var sup = crewVal(spec.k,'Sup'), tec = crewVal(spec.k,'Tech'), ger = crewVal(spec.k,'Gear');
  if (!sup && !tec) { sup = spec.sup; tec = spec.tech; ger = spec.gear; }
  return { units:units, crewDays:Math.round(crewDays), crews:crews,
           people:crews * (sup + tec), gear:crews * ger, sup:sup, tech:tec, rate:rate };
}

var PLAN_MONTHS = 4;


/* ═══ موديول الصلاحيات — واجهةً وقواعدَ Firebase ═══ */

var PERMS = [
  ['read_all',     'قراءة كل النقاط',        ['engineer','viewer']],
  ['read_own',     'قراءة المُسند إليه',      ['engineer','supervisor','tech','cprep','casm','cins']],
  ['write_survey', 'تسجيل المسح',            ['engineer','supervisor','tech','cins']],
  ['write_prep',   'تنفيذ التهيئة',          ['engineer','cprep']],
  ['write_asm',    'تنفيذ التجميع',          ['engineer','casm']],
  ['write_install','تنفيذ التركيب',          ['engineer','tech','cins']],
  ['approve',      'اعتماد ما رُفع',          ['engineer']],
  ['assign',       'إسناد المهام',            ['engineer','supervisor']],
  ['inventory',    'المخزون والعُهدة',        ['engineer']],
  ['money',        'المال والمشتريات',        ['engineer']],
  ['settings',     'الإعدادات والتارجت',      ['engineer']],
  ['users',        'إدارة الحسابات والأدوار', ['engineer']],
  ['phones',       'أرقام هواتف فريقه',       ['engineer','supervisor','tech','cprep','casm','cins']],
  ['export_all',   'التصدير الكامل',          ['engineer']],
  ['export_rep',   'تصدير التقارير',          ['engineer','viewer']]
];

var /* بترتيب السلطة: من يملك كلَّ شيءٍ إلى من ينقل ولا يكتب */
ROLE_ORDER = ['admin','engineer','buyer','store','acct','cprep','casm',
              'supervisor','cins','tech','helper','driver','viewer'];

function roleName(k){
  return { engineer:'مهندس', supervisor:'مشرف', tech:'فني', cprep:'تهيئة',
           casm:'تجميع', cins:'تركيب', viewer:'وزارة' }[k] || k;
}

/* ═══ إسناد الدور والفريق للمستخدم ═══ */

/* إسنادُ الأدوار يُشتقُّ من سجل الفنيين الحقيقيّ لا من بذرةٍ: كانت خمسةَ
   أسماءٍ مخترعةٍ «خالد» و«أحمد» و«سالم» و«ماجد» و«ياسر» في «فريق مخيمات ١»
   — تُعرَض فيُظنُّ أن هؤلاء في المشروع. */
function assignRows(){
  var out = [['محمد صفوت', 'm.safwat', 'admin', '—', '—']];
  /* شاشةُ الأدوار تعرض الحساباتِ كلَّها — لا الميدانيّين وحدهم */
  techsList(1).forEach(function(x){
    var job = jobsList().filter(function(j){ return j.id === x.job; })[0];
    out.push([x.n, x.u || '—', (job ? job.role : 'tech'),
              x.sup || '—', x.crew || '—', x.dept ? deptName(x.dept) : '—']);
  });
  return out;
}

/* الإسنادُ يعدّل سجلَّ الفنيِّ الحقيقيّ لا سطرًا في بذرة: كانت الحقولُ بلا
   معرّفاتٍ والزرَّان بلا خاصية، وتستعمل `ROLE_ORDER` وهو متغيّرٌ لا وجودَ
   له فتنفجر الشاشةُ لو نودي. */
function asnRoleSet(){
  if (!may('users')){ toast(t('إسنادُ الأدوار للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? e.value : ''; };
  var name = g('asnU'), jobId = g('asnJob');
  if (!name){ toast(t('اختر مستخدمًا')); return; }
  var job = jobsList().filter(function(j){ return j.id === jobId; })[0];
  if (!job){ toast(t('اختر وظيفة')); return; }
  var crew = g('asnCrew');
  techSet(name, { job:jobId, crew:crew || '' });
  logEvent('إسناد دور — ' + name + ' ← ' + job.n + (crew ? ' · ' + crew : ''));
  toast(t('أُسند الدور'));
  render(1);
}

PAGE.users = { m:'الإعدادات', t:'المستخدمون والأدوار',
  l:'الحساباتُ ووظائفُها وأدوارُها — من هو وما يعمل وما يستطيع.',
  body:function(){
    var head = tabHead('users'), cur = tabCur('users');
    if (cur === 'users') return head + pwFlowHtml() + (may('users') ? phonesCard() : '') + bulkCard() + provCard() + (may('users') ? pendCard() : '') + (function(){
    var L = usersList();
    /* الشريحةُ تعدُّ ما أراه لا ما في القاعدة: كانت تقول «وزارة ٥» ثم تقول
       القائمةُ «لا مستخدمَ يطابق» — رقمٌ يَعِدُ بصفوفٍ لا تُعرَض (V17.6). */
    var byRole = {}, total = 0;
    Object.keys(STATE.users || {}).forEach(function(uid){
      var u = STATE.users[uid] || {};
      if (!canSeeUser(u)) return;
      total++;
      var r = u.role || '';
      if (r) byRole[r] = (byRole[r] || 0) + 1;
    });

    return '<p class="lede" style="margin:0 0 16px">'
      + esc(t('أنشئ الحساب وحدّد دوره، وصفّه بالنوع من الشرائح، وابحث بالاسم في القائمة أسفله — والتغييرُ يُزامَن فورًا.'))
      + '</p>'

      + stats([['كل الحسابات', N(total), 'acc']]
              .concat(Object.keys(ROLES).filter(function(k){ return byRole[k]; }).map(function(k){
                return [t(ROLES[k].n), N(byRole[k])];
              })))

      + '<div class="chips">'
      + '<button type="button" class="chip' + (!USR.role ? ' on' : '') + '" data-usrrolef="">'
      +   esc(t('الكل')) + ' <span class="num">' + nm(total) + '</span></button>'
      + Object.keys(ROLES).filter(function(k){ return byRole[k]; }).map(function(k){
          return '<button type="button" class="chip' + (USR.role===k?' on':'') + '" data-usrrolef="' + esc(k) + '">'
            + esc(t(ROLES[k].n)) + ' <span class="num">' + nm(byRole[k]) + '</span></button>';
        }).join('')
      + '</div>'

      /* بطاقةُ الإنشاء لمن يُنشئ — والوزارةُ تقرأ الجدولَ ولا تُضيف */
      + ((CFG.gh && CFG.gh.bad && may('roles')) ? alertBox('warn', t('مفتاحُ تشغيل الحسابات مرفوضٌ من GitHub (منتهٍ أو بلا صلاحية). الطلباتُ تُحفَظ وتُنفَّذ مع دورة الخادم، لكنها قد تتأخر ساعات. جدِّد المفتاح من ثوابت النظام ← مفتاح التشغيل: مفتاحٌ دقيقُ الصلاحيات على هذا المستودع بصلاحية تشغيل السيور.')) : '')   /* (V30.7) */
      + (canProvision() ? card('إنشاء حساب',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('اسم المستخدم')) + ' <span class="req">*</span></label>'
          +   '<input id="uU" dir="ltr" placeholder="m.safwat" maxlength="80"></div>'
          + '<div class="field"><label>' + esc(t('الاسم الكامل')) + ' <span class="req">*</span></label>'
          +   '<input id="uN" dir="auto" maxlength="160"></div>'
          + '<div class="field"><label>' + esc(t('الوظيفة')) + '</label>'
          +   '<select id="uJ"><option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
          +   jobsList().map(function(j){ return '<option value="' + esc(j.id) + '">' + esc(t(j.n)) + '</option>'; }).join('')
          +   '</select></div>'
          + '<div class="field"><label>' + esc(t('القسم')) + '</label>'
          +   '<select id="uD">' + deptOptions('') + '</select></div>'
          + '<div class="field"><label>' + esc(t('مديره')) + '</label>'
          +   '<select id="uS">' + mgrOptions('tech', '', '') + '</select>'
          +   '<p class="hint" style="margin:6px 0 0">'
          +     esc(t('يُعرَض من مرتبتُه أعلى أو مساوية: الفنيُّ مديرُه مشرفُه، والمشرفُ مديرُه المهندس، والمهندسُ مديرُه مهندسٌ أو مديرُ المشروع — والوزارةُ مديرُها من المهندس فصاعدًا.')) + '</p></div>'
          + '<div class="field"><label>' + esc(t('كلمة المرور')) + ' <span class="req">*</span></label>'
          +   '<input id="uP" type="password" dir="ltr" minlength="10"></div>'
          + '<div class="field"><label>' + esc(t('البريد')) + '</label>'
          +   '<input id="uE" dir="ltr" type="email" placeholder="name@afaqy.com"></div>'
          + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
          +   '<select id="uR">'
          +   rolesICanMake().map(function(k){
                return '<option value="' + esc(k) + '"' + (k === 'tech' ? ' selected' : '') + '>'
                  + esc(t(ROLES[k].n)) + '</option>';
              }).join('') + '</select></div>'
          + '</div>'
          + '<p class="hint" style="margin:11px 0 0">'
          + esc(t('اسمُ المستخدم بلا مسافات — ويُكمَّل بنطاق المشروع تلقائيًّا. وكلمةُ المرور عشرةُ أحرفٍ فأكثر، ويبدّلها صاحبُها أولَ دخول.'))
          + '</p>',
          btn('إنشاء الحساب','btn-primary btn-sm',' data-usradd="1"')) : '')

      + usersCard();
  })();
    if (cur === 'roles') return head + (function(){
    /* السؤالُ يتكرّر: ما الفرقُ بين الوظيفة والدور؟ فصار مكتوبًا في أول
       الشاشة لا في ذاكرة من شرحه مرة. */
    var _INTRO = card('الوظيفة والدور — فرقٌ لا يُخلَط',
        table(['','الوظيفة','الدور'], [
          ['ما هي','ما يعمله الشخصُ في الميدان','ما يستطيعه في النظام'],
          ['مثال','مسؤول مستودع · مشرف ميدان','كلاهما دورُه «مشرف»'],
          ['أين تُضبَط','الإعدادات ← الوظائف','هذه الشاشة'],
          ['من أين تأتي','تُكتَب في سجل الموظف','يُشتقُّ من وظيفته'],
          ['ماذا تُغيّر','من يستلم العهدةَ ومن ينزل المشاعر','ما يراه من شاشاتٍ وما يكتبه']
        ])
        + '<p class="hint">' + esc(t('الوظيفةُ تتغيّر في أثناء الموسم فيتغيّر الدورُ معها — والنقلةُ تُسجَّل ولا تُمحى. ودليلُ كلِّ دورٍ في «المساعدة ← دليل الاستخدام» يقول ما يراه صاحبُه بالضبط.')) + '</p>');
    /* كان جدولًا محفورًا بأربعة أدوارٍ و«✓» مكتوبةٍ بيد — والأدوارُ سبعةٌ
       والقدراتُ تُقرأ من `ROLES`. فمن قرأ الجدولَ ظنَّ أن المشرفَ لا يرى
       الهواتفَ وهو يراها، وأن الفنيَّ لا يركّب وهو يركّب.
       صار يُبنى من مصدر الحقيقة نفسِه، ويُبدَّل فيه فيُكتَب. */
    var CAPS = [['edit','تحرير البيانات'], ['approve','الاعتمادات'], ['settings','الإعدادات'],
                ['money','المال والمشتريات'], ['inventory','المخزون والعُهدة'], ['workshop','الورشة'],
                ['exportAll','التصدير الكامل'], ['importAll','الاستيراد'],
                ['users','إدارة المستخدمين'], ['phones','أرقام الهواتف'], ['delete','الحذف والتصفير']];
    var RS = Object.keys(ROLES);
    return _INTRO + cardFlush(t('القدرات') + ' — ' + nm(RS.length) + ' ' + t('أدوار'),
        table([''].concat(RS.map(function(k){ return t(ROLES[k].n); })),
          CAPS.map(function(c){
            return ['<strong>' + esc(t(c[1])) + '</strong>' + (PM_CAP[c[0]] ? ' <span class="hint" style="margin:0" title="' + esc(t('تنفذ في قاعدة البيانات فورًا')) + '">\u{1F510}</span>' : '')].concat(
              RS.map(function(k){
                var on = !!((ROLES[k].can || {})[c[0]]);
                return may('users')
                  ? '<button type="button" class="pill ' + (on ? 'ok' : 'off')
                    + '" style="border:0;cursor:pointer" data-capt="' + esc(k + '|' + c[0]) + '">'
                    + (on ? '✓' : '—') + '</button>'
                  : pill(on ? '✓' : '—', on ? 'ok' : 'off');
              }));
          })),
        (may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="roles"') : '')
        + '<p class="hint" style="margin:9px 0 0">'
        + esc(t(may('users')
            ? 'اضغط الخانةَ لتبديلها — والتبديلُ يُكتَب فورًا ويدخل سجلَّ الأحداث.'
            : 'العرضُ فقط — التبديلُ للمهندس.'))
        + '</p>')

      + card(t('الأدوار') + ' — ' + nm(RS.length),
          table(['الدور','من هو','الأساس','الرتبة','حسابات',''],
            RS.map(function(k){
              var cu = ROLES[k].custom, nU = roleUsers(k);
              return [pill(t(ROLES[k].n), cu ? 'wrn' : 'acc'), esc(t(ROLES[k].d || '—')),
                      cu ? esc(t((ROLES[ROLES[k].base] || {}).n || ROLES[k].base)) : '<span class="hint" style="margin:0">' + esc(t('أساسي')) + '</span>',
                      '<span class="num">' + nm(rankOf(k)) + '</span>', N(nU),
                      cu && may('roles')
                        ? (nU ? '<span class="hint" style="margin:0">' + esc(t('عليه حسابات')) + '</span>'
                              : btn('\u{1F5D1} ' + t('حذف'),'btn-danger btn-sm',' data-roledel="' + esc(k) + '"'))
                        : ''];
            })))
      + (may('roles')
        ? card('\u2795 ' + t('دور جديد'),
            '<div class="grid cols-3">'
            + '<div class="field" style="margin:0"><label>' + esc(t('اسم الدور')) + '</label><input id="nrName" dir="auto" placeholder="' + esc(t('مندوب شركة الخدمة')) + '"></div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('يرث')) + '</label><select id="nrBase">'
            +   BASE_ROLES.map(function(k){ return '<option value="' + esc(k) + '"' + (k === 'tech' ? ' selected' : '') + '>' + esc(t(ROLES[k].n)) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('الرتبة')) + '</label><input id="nrRank" type="number" inputmode="numeric" placeholder="' + esc(t('فارغةٌ = رتبةُ الأساس')) + '"></div>'
            + '</div>'
            + '<p class="hint">' + esc(t('يرث شاشاتِ أساسه وقدراتِه — ثم تُعدَّل قدراتُه أعلاه وخانتُه في «صلاحيات القاعدة» بمفتاحه. الرتبةُ تحكم من يرى من ومن يُنشئ من. وتنفذ في القاعدة فورًا.')) + '</p>',
            btn('\u2795 ' + t('أضف الدور'),'btn-primary btn-sm',' data-roleadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('الأدوارُ الأساسيةُ لا تُحذَف: أسماؤها مكتوبةٌ في قواعد القاعدة. والمخصَّصُ يُحذَف إن لم يبقَ عليه حساب.')) + '</p>';
  })();
    if (cur === 'perms') return head + (function(){
    if (may('perms')) pmRefresh(false);
    return pmCard();
  })();
    if (cur === 'jobs') return head + (function(){
    var L = jobsList();
    var roleOpts = function(cur){
      return Object.keys(ROLES).map(function(k){
        return '<option value="' + esc(k) + '"' + (cur === k ? ' selected' : '') + '>'
          + esc(t(ROLES[k].n)) + '</option>';
      }).join('');
    };
    return card('\u2753 ' + t('الفرق بين الوظيفة والدور والقسم'),
        table(['المفهوم','ما هو','من يضبطه','مثال'], [
          ['<strong>' + esc(t('الوظيفة')) + '</strong>',
           esc(t('ما يعمله الشخصُ في الواقع — مسمّاه الميداني')),
           esc(t('تُعرَّف هنا، وتُسنَد لكل حسابٍ من «الحسابات»')),
           esc(t('«فنيُّ تركيب» · «مسؤول مستودع» · «مشرف ميدان»'))],
          ['<strong>' + esc(t('الدور')) + '</strong>',
           esc(t('ما يستطيعه في النظام — أيُّ شاشةٍ يفتح وأيُّ زرٍّ يعمل')),
           esc(t('يُشتقُّ من الوظيفة تلقائيًّا، ويُغيَّر يدويًّا عند الحاجة')),
           esc(t('«فني» يرى مهامَّه · «مهندس» يعتمد الزيارات'))],
          ['<strong>' + esc(t('القسم')) + '</strong>',
           esc(t('أين يجلس في هيكل الشركة — للتقارير والمساءلة')),
           esc(t('يُختار من أقسام الشركة في «الحسابات»')),
           esc(t('«العمليات الميدانية» · «المالية» · «الجودة»'))],
          ['<strong>' + esc(t('المدير')) + '</strong>',
           esc(t('من يُساءل عن عمله — حسابٌ مرتبتُه أعلى')),
           esc(t('يُختار من «الحسابات»، ولا يُقبَل من مرتبتُه أدنى')),
           esc(t('الفنيُّ ← مشرفُه ← المهندس ← مديرُ المشروع'))]])
        + '<p class="hint" style="margin:10px 0 0">'
        + esc(t('الوظيفتان قد تشتركان في دورٍ واحد: مسؤولُ المستودع ومشرفُ الميدان كلاهما دورُه «مشرف» — ووظيفتاهما مختلفتان، وبهما يُعرَف من يستلم العهدةَ ومن ينزل المشاعر.')) + '</p>')
      + '<p class="lede" style="margin:0 0 16px">' + esc(t('الوظيفةُ ما يعمله الشخصُ، والدورُ ما يستطيعه في النظام. ومسؤولُ المستودع ومشرفُ الميدان كلاهما دورُه «مشرف» — ووظيفتاهما مختلفتان، وبها يُعرَف من يستلم العهدةَ ومن ينزل المشاعر. والوظيفةُ تتغيّر في أثناء الموسم، والنقلةُ تُسجَّل ولا تُمحى.')) + '</p>'

      + cardFlush(t('الوظائف') + ' — ' + nm(L.length),
          table(['الوظيفة','الدور','ماذا تعمل','عليها',''],
            L.map(function(j){
              var u = jobUsed(j.id);
              return ['<input value="' + esc(j.n) + '" data-jbn="' + esc(j.id) + '" dir="auto">',
                      '<select data-jbr="' + esc(j.id) + '">' + roleOpts(j.role) + '</select>',
                      '<input value="' + esc(j.d || '') + '" data-jbd="' + esc(j.id) + '" dir="auto">',
                      u ? pill(nm(u), 'acc') : N(0),
                      u ? '<span class="hint" style="margin:0">' + esc(t('مستعملة')) + '</span>'
                        : btn('حذف','btn-quiet btn-sm',' data-jbdel="' + esc(j.id) + '"')];
            })))

      + (may('users')
        ? card('إضافة وظيفة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('اسم الوظيفة')) + ' <span class="req">*</span></label>'
            +   '<input id="jbN" dir="auto" placeholder="' + esc(t('مسؤول سلامة')) + '"></div>'
            + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
            +   '<select id="jbR">' + roleOpts('tech') + '</select></div>'
            + '<div class="field"><label>' + esc(t('ماذا تعمل')) + '</label>'
            +   '<input id="jbD" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة وظيفة','btn-primary btn-sm',' data-jbadd="1"'))
        : '')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="jbQ" data-jbq="1" value="' + esc(JB_Q) + '" placeholder="'
      +     esc(t('ابحث باسم الشخص')) + '" dir="auto">'
      + '</form>'
      + cardFlush('من على كل وظيفة',
          table(['الشخص','الوظيفة','الدور المشتقّ','القسم','مديره','آخر نقلة'],
            techsList(1).filter(function(x){ return !JB_Q || x.n.indexOf(JB_Q) > -1; })
              .map(function(x){
              var j = x.job ? jobOf(x.job) : null;
              var last = (x.jobLog || []).slice(-1)[0];
              return [esc(x.n),
                      '<select data-tkjob="' + esc(x.n) + '">'
                      + '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                      + L.map(function(y){
                          return '<option value="' + esc(y.id) + '"' + (x.job === y.id ? ' selected' : '')
                            + '>' + esc(y.n) + '</option>';
                        }).join('') + '</select>',
                      j ? pill(t((ROLES[j.role] || {}).n || j.role), 'off') : '—',
                      x.dept ? esc(deptName(x.dept)) : '—',
                      x.sup ? esc(x.sup) : '—',
                      last ? '<span class="num">' + esc(dayKey(last.at)) + '</span>' : '—'];
            })))

      + '<p class="hint">' + esc(t('الوظيفةُ التي عليها أشخاصٌ لا تُحذَف — انقلهم أولًا. وكلُّ نقلةٍ تدخل سجلَّ الأحداث وتصل صاحبَها إشعارًا.')) + '</p>';
  })();
    return head + (function(){
    var T = techsList(), C = crewsList();
    return card('إسناد',
        '<div class="grid cols-2">'
        + '<div class="field"><label>' + esc(t('المستخدم')) + '</label>'
        +   '<select id="asnU">'
        +   T.map(function(x){ return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>'; }).join('')
        +   '</select></div>'
        + '<div class="field"><label>' + esc(t('الوظيفة')) + '</label>'
        +   '<select id="asnJob">'
        +   jobsList().map(function(j){ return '<option value="' + esc(j.id) + '">' + esc(t(j.n)) + '</option>'; }).join('')
        +   '</select></div>'
        + '<div class="field"><label>' + esc(t('الفريق')) + '</label>'
        +   '<select id="asnCrew"><option value="">—</option>'
        +   C.map(function(c){ return '<option value="' + esc(c.n) + '">' + esc(c.n) + '</option>'; }).join('')
        +   '</select></div>'
        + '</div>',
        btn('إسناد','btn-primary btn-sm',' data-asnrole="1"'))

      + cardFlush(t('المسنَدون') + ' — ' + nm(T.length),
          table(['المستخدم','الوظيفة','الدور','الفريق'],
            T.map(function(x){
              var job = jobsList().filter(function(j){ return j.id === x.job; })[0];
              var role = job ? job.role : 'tech';
              return ['<strong>' + esc(x.n) + '</strong>'
                        + (x.u ? '<br><span class="hint" dir="ltr" style="margin:0">' + esc(x.u) + '</span>' : ''),
                      job ? esc(t(job.n)) : '<span class="hint" style="margin:0">—</span>',
                      pill(esc(t(roleName(role))), role === 'engineer' ? 'ok' : (role === 'viewer' ? 'info' : 'acc')),
                      x.crew ? esc(x.crew) : '<span class="hint" style="margin:0">—</span>'];
            })))

      + '<p class="hint">' + esc(t('الدورُ يُشتَقُّ من الوظيفة المسنَدة — لا يُكتَب مباشرةً. وتغييرُ الوظيفة يبدّل الصلاحياتِ فورًا؛ إسنادُ فريقٍ لا ينشئه، ينشأ من «إدارة الفرق».')) + '</p>';
  })();
  }};

/* ═══ فريق المشرف — من معه ═══ */

;

/* ═══ الطبقات الثلاث — لكلٍّ ما تُظهر وما تُسند ═══
   المسحُ يرى الكلَّ ويُسند زيارة، والتركيبُ لا يرى إلا ما مُسح ويُسند تركيبًا،
   والفكُّ لا يرى إلا ما رُكِّب ويُسند فكًّا. فلا يُجدوَل عملٌ قبل ما يسبقه. */

var LAYERS = {
  survey: {
    n:'المسح', i:'\u{1F50D}', kind:'visit', c:'#4FA3FF',
    d:'كلُّ النقاط — تُحدَّد وتُسند زيارةً ميدانية.',
    pass:function(){ return true; },
    ready:function(x){ return !svDone(STATE.recs[x.id]); },
    done:function(x){ return svDone(STATE.recs[x.id]); },
    pts:function(x){ return ptsSurvey(x); },
    empty:'لا نقاط في هذا الترشيح.'
  },
  install: {
    n:'التركيب', i:'\u{1F527}', kind:'install', c:'#3AD6A0',
    d:'ما مُسح واعتُمد حلُّه وحده — يُجدوَل ويُسند تركيبًا.',
    /* كانت الطبقةُ تشترط المسحَ وحدَه بينما بوابةُ الإسناد (asnCommit)
       تشترط معه حلًّا معتمدًا — فتقول اللوحةُ «نقطتان جاهزتان» ثم يُسنِدهما
       المشرفُ فتُفلتَران كلتاهما ولا يفهم لماذا. صار الشرطُ واحدًا في
       الموضعين: لا تُعرَض جاهزةً إلا ما يُقبَل فعلًا. */
    pass:function(x){
      if (!svDone(STATE.recs[x.id])) return false;
      var so = solutionOf(x.id);
      return !!so && so.status === 'معتمد';
    },
    ready:function(x){ return !insDone(x.id); },
    done:function(x){ return insDone(x.id); },
    pts:function(x){ return ptsInstall(x); },
    empty:'لا نقطةَ حلُّها معتمد — التركيبُ لا يُجدوَل قبل اعتماد حلِّه في «حل التركيب».'
  },
  /* ═══ التفاصيلُ المختصرة — طبقةُ الوزارة (V16.88) ═══
     الوزارةُ تسأل بعد الزيارة: ما الذي وقع في هذه النقطة؟ والجوابُ كان في
     نموذج مسحٍ طويلٍ لا يفتحه غيرُ من ملأه. فصارت طبقةً رابعةً بجوار المسح
     والتركيب والفك: سطرٌ واحدٌ لكلِّ نقطةٍ زارها الميدان — «تمام» أو «تحدٍّ»
     أو «ملاحظة» — بلونه، تُضغَط النقطةُ فتُقرأ. والسطرُ يُكتَب على وثيقة
     الزيارة نفسِها (bst وbrief) لا في مجموعةٍ جديدة: يُزامَن ويُنسَخ احتياطيًّا
     ويُحكَم بقواعده كما هي — والزيارةُ هي صاحبةُ الخبر. */
  brief: {
    n:'تفاصيل مختصرة', i:'\u{1F4DD}', kind:'brief', c:'#E8C34B',
    d:'ما وقع في كلِّ نقطةٍ زارها الميدان — سطرٌ يُقرأ بلونه: تمام · تحدٍّ · ملاحظة.',
    /* كلُّ نقطةٍ نزل إليها الميدانُ — تمّت أو تعذّرت أو رُدّت: الشاشةُ تقول
       ما وقع، والمتعذّرُ خبرٌ كالمنجَز (V16.95) */
    pass:function(x){ return !!STATE.recs[x.id]; },
    ready:function(x){ return !briefOf(x.id); },
    done:function(x){ return !!briefOf(x.id); },
    pts:function(x){ return ptsSurvey(x); },
    empty:'لا زيارةَ تمّت بعد — التفاصيلُ تُكتَب على الزيارة.'
  },
  dis: {
    n:'الفك', i:'\u{1F9E9}', kind:'dis', c:'#C77DFF',
    d:'ما سُلِّم للعميل وحده — يُجدوَل للفك وإرجاع العُهدة.',
    /* الفكُّ إرجاعُ ما سُلِّم: لا يُفَكُّ ما لم يُحرَّر محضرُ تسليمه، وإلا
       فُكَّ ما لم يُسلَّم أصلًا فلا يُعرَف ما الذي أُرجع ومن سلَّمه. */
    pass:function(x){ return handDone(x.id); },
    ready:function(x){ return !disDone(x.id); },
    done:function(x){ return disDone(x.id); },
    pts:function(x){ return ptsDis(x); },
    empty:'لا نقطةَ سُلِّمت بعد — الفكُّ إرجاعُ ما سُلِّم، ويُحرَّر محضرُ التسليم في «التسليم والضمان».'
  }
};



/* ═══ الفكُّ والصيانة: نموذجان كانا ناقصَين ═══
   كان يُسنَد فكٌّ (UR) وصيانةٌ (MR) من الخريطة ومن التوزيع — ثم لا يجد
   الفنيُّ أين يُسجّل ما فعل. فلا تُغلَق المهمةُ، ولا تُرجَع العُهدةُ، ولا
   تُحتسَب نقاطٌ، ولا يُعرَف من صان ماذا. صار لكلٍّ نموذجُه:
     الفكُّ يُرجِع القطعَ بحالتها (سليم/تالف/مفقود) — فما سلِم يعود مخزونًا
   وما تلِف يُشطَب، ولا يُفكُّ إلا ما سُلِّم بمحضر.
     والصيانةُ تُسجَّل زيارةً بعد زيارة: عطلُها وما عُمل وما استُبدل — فتُخصَم
   القطعُ من العهدة، ويبقى للنقطة تاريخُ خدمة. */
var DISF = { site:'', items:{}, note:'', photos:{} };
var MNTF = { site:'', fault:'', act:'', parts:{}, note:'', photos:{} };
var DIS_COND = ['سليم','تالف','مفقود'];

function disSave(){
  var id = DISF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الفك يحتاج صلاحية تعديل')); return; }
  var ins = STATE.inss[id];
  if (!ins || !insDone(id)){ toast(t('لا تركيبَ معتمدًا على هذه النقطة')); return; }
  if (typeof handDone === 'function' && !handDone(id)){
    toast(t('لم تُسلَّم بمحضر — الفكُّ إرجاعُ ما سُلِّم')); return;
  }
  if (disDone(id)){ toast(t('فُكَّت من قبل')); return; }
  var back = {}, n = 0;
  Object.keys(ins.parts || {}).forEach(function(k){
    var c = DISF.items[k] || 'سليم';
    back[k] = { qty:cfgN(ins.parts[k]), cond:c }; n += cfgN(ins.parts[k]);
  });
  if (!n){ toast(t('لا قطعَ مسجَّلةً على هذه النقطة')); return; }
  if (!DISF.photos.after){ toast(t('صورةُ الموضع بعد الفكِّ مطلوبة')); return; }
  var rec = { id:id, status:'تم الفك', items:back, note:DISF.note,
              by:STATE.meta.name || '', at:Date.now(), photos:Object.keys(DISF.photos) };
  STATE.diss = STATE.diss || {};
  STATE.diss[id] = rec;
  CORE.set('diss', id, rec);
  Object.keys(DISF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'dis_' + k, DISF.photos[k].data);
  });
  /* ما سلِم يعود مخزونًا وما تلِف يُشطَب — والعهدةُ تُقفَل بالحالة لا بالعدد */
  Object.keys(back).forEach(function(k){
    var b = back[k];
    STATE.moves.push({ id:uid36(), at:Date.now(),
      kind: b.cond === 'سليم' ? 'إرجاع' : 'شطب',
      item:itemName(k), qty:b.qty, by:rec.by, site:id, note:'فك ' + id });
  });
  CORE.set('moves', 'dis-' + id, { site:id, at:rec.at, by:rec.by });
  /* المهمةُ تُغلَق: لا يبقى فكٌّ مفتوحٌ على نقطةٍ فُكَّت */
  var tk = taskKindOf(id, 'dis');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('فك — ' + id + ' \u00b7 ' + nm(n) + ' قطعة', id);
  stepDone('dis', id, nm(n) + ' ' + t('قطعة'), 0);
  toast(t('سُجِّل الفكُّ وأُرجعت العُهدة'));
  DISF = { site:'', items:{}, note:'', photos:{} };
  statBump(); render(1);
}
/* الشكلُ المخزَّنُ كائنٌ {id,list} لأن CORE.set يكتب الوثيقةَ في مكانها —
   فما وُضع مصفوفةً يعود كائنًا بعد أوّل حفظ. تُقرأ الحالتان. */
function maintList(id){
  var L = (STATE.maints || {})[id];
  if (Array.isArray(L)) return L;
  return (L && Array.isArray(L.list)) ? L.list : [];
}
function maintSave(){
  var id = MNTF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الصيانة يحتاج صلاحية تعديل')); return; }
  if (!insDone(id)){ toast(t('الصيانةُ لما رُكِّب واعتُمد')); return; }
  if (!MNTF.fault){ toast(t('اكتب العطل')); return; }
  if (!MNTF.act){ toast(t('اكتب ما عُمل')); return; }
  var used = {}, n = 0;
  Object.keys(MNTF.parts || {}).forEach(function(k){
    var q = cfgN(MNTF.parts[k]); if (q > 0){ used[k] = q; n += q; }
  });
  var rec = { at:Date.now(), by:STATE.meta.name || '', fault:MNTF.fault,
              act:MNTF.act, parts:used, note:MNTF.note, photos:Object.keys(MNTF.photos) };
  STATE.maints = STATE.maints || {};
  var L2 = maintList(id).concat([rec]);
  STATE.maints[id] = { id:id, list:L2 };
  CORE.set('maints', id, STATE.maints[id]);
  Object.keys(MNTF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'mnt_' + Date.now() + '_' + k, MNTF.photos[k].data);
  });
  Object.keys(used).forEach(function(k){
    STATE.moves.push({ id:uid36(), at:Date.now(), kind:'استهلاك',
      item:itemName(k), qty:used[k], by:rec.by, site:id, note:'صيانة ' + id });
  });
  var tk = taskKindOf(id, 'maint');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('صيانة — ' + id + ' \u00b7 ' + MNTF.fault.slice(0, 40) + (n ? ' \u00b7 ' + nm(n) + ' قطعة' : ''));
  stepDone('maint', id, MNTF.fault.slice(0, 36), 0);
  toast(t('سُجِّلت الصيانة'));
  MNTF = { site:'', fault:'', act:'', parts:{}, note:'', photos:{} };
  statBump(); render(1);
}
function maintDone(id){ return maintList(id).length > 0; }
/* (V29.5) قيدُ صيانةٍ يُحذف للمهندس والمدير (قرارُ المالك) — بتأكيد، ويبقى أثرُه في سجل الأحداث؛ والقطعُ المستهلَكةُ تبقى حركةً في المخزون */
function maintDel(id, at){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الصيانة للمهندس والمدير')); return; }
  var L = maintList(id), r = L.filter(function(x){ return String(x.at) === String(at); })[0]; if (!r) return;
  if (!confirm(t('حذفُ قيد الصيانة') + ' ' + id + ' \u2014 «' + String(r.fault || '').slice(0, 40) + '»؟')) return;
  var L2 = L.filter(function(x){ return x !== r; });
  STATE.maints = STATE.maints || {};
  STATE.maints[id] = { id:id, list:L2 }; CORE.set('maints', id, STATE.maints[id]);
  logEvent('حذف قيد صيانة — ' + id + ' \u00b7 ' + String(r.fault || '').slice(0, 40) + ' \u00b7 ' + (r.by || ''));
  toast(t('حُذف قيدُ الصيانة')); render(1);
}
function LAYER(){ return LAYERS[FIELD_MODE] || LAYERS.survey; }

/* ═══ التفاصيلُ المختصرة: حالةٌ وسطرٌ على وثيقة الزيارة ═══ */
/* ═══ تعديلُ المسح بلا إعادته (V22.3) ═══
   «لو بعدّل عرضَ البوابة أقدر أعدّلها دون تعديل كامل المسح والصور — أضغط الشاخص وأختار
   تعديلَ المسح وأحطّ اللي بعدّله ويتعدّل على طول». من نافذة النقطة المزارة: قائمةٌ بحقول
   الزيارة المكتوبة، وكلُّ حقلٍ يُعدَّل وحدَه ويُحفَظ فورًا — الصورُ وبقيةُ الحقول وصاحبُ الزيارة
   وتاريخُها كما هي. ويُسجَّل التعديلُ في الزيارة نفسِها (من، ومتى، ومن أيِّ قيمةٍ إلى أيّ) وفي
   سجلّ الأحداث. والمسحُ المعتمدُ إذا عدّله غيرُ المهندس عاد لانتظار الاعتماد — القاعدةُ لا تسمح
   لغيره بالكتابة على المعتمد، والتغييرُ على المعتمد يراه صاحبُ الاعتماد؛ ويُنبَّه المهندسُ في الحالين. */
var SVQ = { id:'', key:'', tmp:null, delAsk:'' };
var TYPES_OPEN = false;   /* بطاقةُ التصنيفات في «المواقع» مطويّةٌ حتى تُفتَح (V23.0) */
var SVQ_NUM = { len_m:1, wid_m:1, hgt_m:1, height:1, cable:1, tents:1, gates:1, corr_w:1, pdist:1, n_ant:1, n_rdr:1, n_cam:1, n_sens:1, hours:1, crew_n:1, kits:1, kits_done:1 };
var SVQ_OPT = { mount:['عمود','جدار','سور','هيكل قائم'], power:['شبكة','مولد','طاقة شمسية','لا يوجد'] };
var SVQ_TEXT = { note:1, chal_note:1, power_note:1, civil:1, equip:1 };
function svqMay(id){ var r = STATE.recs[id]; return !!r && !r.deleted && may('edit'); }
function svqKeys(rec){
  var ks = SV_ORDER.filter(function(k){ return k !== 'access' && rec[k] !== undefined && rec[k] !== null && rec[k] !== ''; });
  if (Array.isArray(rec.chals)) ks.splice(Math.min(ks.length, 3), 0, 'chals');
  return ks;
}
function svqLabel(k){ if (String(k).indexOf('ph:') === 0) return 'صورة: ' + svqKindLabel(k.slice(3)); return k === 'chals' ? 'تحديات التركيب' : (SV_LABELS[k] || k); }
function svqFmt(v){ return Array.isArray(v) ? v.map(function(x){ return t(x); }).join(' \u00b7 ') : (v === '' || v == null ? '\u2014' : (typeof v === 'number' ? nm(v) : t(String(v)))); }
function svqEditor(k, rec, s){
  var v = rec[k];
  if (k === 'chals'){
    var sel = SVQ.tmp || (rec.chals || []).slice();
    return '<div class="chips" style="margin:4px 0 0">' + chalsOf(s).map(function(c){ return '<button type="button" class="chip' + (sel.indexOf(c) > -1 ? ' on' : '') + '" data-svqch="' + esc(c) + '">' + esc(t(c)) + '</button>'; }).join('') + '</div>';
  }
  if (SVQ_OPT[k]) return '<select id="svqIn">' + SVQ_OPT[k].map(function(o){ return '<option value="' + esc(o) + '"' + (v === o ? ' selected' : '') + '>' + esc(t(o)) + '</option>'; }).join('') + '</select>';
  if (v === 'نعم' || v === 'لا') return '<select id="svqIn">' + ['نعم','لا'].map(function(o){ return '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + esc(t(o)) + '</option>'; }).join('') + '</select>';
  if (SVQ_NUM[k]) return '<input id="svqIn" type="number" step="0.1" min="0" inputmode="decimal" value="' + esc(v) + '">';
  if (SVQ_TEXT[k]) return '<textarea id="svqIn" rows="3" dir="auto">' + esc(v) + '</textarea>';
  return '<input id="svqIn" dir="auto" value="' + esc(v) + '">';
}
function svqSheet(){
  if (!SVQ.id) return '';
  var rec = STATE.recs[SVQ.id], s = siteFind(SVQ.id);
  if (!rec || !s || !svqMay(SVQ.id)){ SVQ.id = ''; return ''; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), appr = rec.review === 'approved';
  var rows = svqKeys(rec).map(function(k){
    if (SVQ.key === k){
      return '<div class="svq-row on"><div class="svq-k">' + esc(t(svqLabel(k))) + '</div>' + svqEditor(k, rec, s)
        + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('احفظ هذا الحقل'), 'btn-primary btn-sm', ' data-svqsave="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-svqcancel="1"') + '</div></div>';
    }
    return '<div class="svq-row"><div class="svq-k">' + esc(t(svqLabel(k))) + '</div><div class="svq-v">' + esc(svqFmt(rec[k])) + '</div>'
      + btn('\u270E', 'btn-quiet btn-sm', ' data-svqk="' + esc(k) + '" aria-label="' + esc(t('عدّل')) + ' ' + esc(t(svqLabel(k))) + '"') + '</div>';
  }).join('');
  var hist = (Array.isArray(rec.edits) ? rec.edits : []).slice(-5).reverse().map(function(e){
    return '<li><span class="hint" style="margin:0">' + esc(fmtDT(e.at)) + ' \u00b7 ' + esc(dispName(e.by)) + '</span> — ' + esc(t(svqLabel(e.k))) + ': ' + esc(svqFmt(e.o)) + ' \u2190 ' + esc(svqFmt(e.v)) + '</li>';
  }).join('');
  return '<div class="svq-back" id="svqSheet" role="dialog" aria-modal="true"><div class="svq-box">'
    + '<div class="svq-h"><div><b>\u270E ' + esc(t('تعديل المسح')) + '</b><div class="hint" style="margin:2px 0 0"><span class="num">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' \u00b7 ' + esc(s.id) : '') + '</span> \u00b7 ' + esc(s.name) + '</div></div>'
    + '<button type="button" class="npop-x" data-svqx="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<p class="hint" style="margin:6px 0 10px">' + esc(t(appr && !boss ? 'هذا المسحُ معتمد — تعديلُ أيِّ حقلٍ يعيده لانتظار اعتماد المهندس.' : 'اختر الحقلَ الذي تعدّله — يُحفَظ وحدَه، وتبقى الصورُ وبقيةُ المسح كما هي، ويُسجَّل التعديلُ باسمك.')) + '</p>'
    + (rows || '<p class="hint">' + esc(t('لا حقولَ مكتوبةً في هذه الزيارة — افتح نموذجَ المسح.')) + '</p>')
    + svqPhotos(rec)
    + (hist ? '<div class="wp-sec" style="margin-top:10px">' + esc(t('آخر التعديلات')) + '</div><ul class="wp-steps">' + hist + '</ul>' : '')
    + '<div class="actions" style="margin:14px 0 0">' + btn('\u2715 ' + t('إغلاق'), 'btn-secondary', ' data-svqx="1" style="width:100%"') + '</div>'
    + '</div></div>';
}
/* (V22.3→V22.7) «لا يسمح لي بتعديل الصور»: صارت الصورُ في اللوح نفسِه — كلُّ خانةٍ تُستبدَل صورتُها
   أو تُضاف وحدَها، وتُضغَط على الجهاز وتُرفَع كصور النموذج، ويُسجَّل التعديلُ كغيره */
function svqPhotoCount(id){
  var n = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; }).length;
  (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).forEach(function(q){ if (q && q.site === id) n++; });
  return n;
}
function svqKindLabel(k){ if (k === 'extra') return 'صورة إضافية'; var q = SV_PHOTOS.filter(function(p){ return p[0] === k; })[0]; return q ? q[1] : (k || 'صورة'); }
function svqCanDel(p, rec){ if (may('delete')) return true; return !!p && p.by === (STATE.meta.name || '') && (rec || {}).review !== 'approved'; }
/* (V22.8) «مش عارف أمسح صور وأزوّد صور جديدة»: صورُ الزيارة نفسُها بمصغّراتها — كلُّ صورةٍ تُحذَف
   (المهندسُ أيَّ صورة، والرافعُ صورتَه ما لم تُعتمَد الزيارة) بتأكيدٍ ثانٍ، وما في طابور الجهاز يُلغى،
   وتُضاف صورٌ جديدةٌ (واحدةٌ أو أكثر) بنوعها أو «صورة إضافية» — والحذفُ علامةٌ مسجَّلةٌ لا محوٌ صامت */
function svqPhotos(rec){
  var id = rec.id, list = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; });
  var q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).map(function(x, i){ return [i, x]; }).filter(function(e){ return e[1] && e[1].site === id; });
  var row = function(thumb, label, sub, act){ return '<div class="svq-row"><div class="svq-ph">' + thumb + '</div><div class="svq-k" style="flex:1 1 50%"><b style="color:var(--ink)">' + esc(t(label)) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + sub + '</div></div>' + act + '</div>'; };
  var img = function(d){ return d ? '<img src="' + esc(d) + '" alt="" loading="lazy">' : '<span>\u{1F5BC}</span>'; };
  var h = '<div class="wp-sec" style="margin-top:12px">' + esc(t('صور الزيارة')) + ' \u00b7 ' + nm(list.length + q.length) + '</div>';
  h += list.map(function(p){
    var ph = p[1] || {}, ask = SVQ.delAsk === p[0];
    var act = svqCanDel(ph, rec)
      ? (ask ? btn(t('تأكيد الحذف'), 'btn-sm', ' data-svqdel="' + esc(p[0]) + '" style="background:#C0392B;color:#fff"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-svqdelx="1"')
             : btn('\u{1F5D1} ' + t('احذف'), 'btn-quiet btn-sm', ' data-svqdelask="' + esc(p[0]) + '"'))
      : '<span class="hint" style="margin:0;font-size:11px">' + esc(t('حذفُها للمهندس')) + '</span>';
    return row(img(ph.data || ph.thumb || ''), svqKindLabel(ph.kind), esc(fmtDT(ph.at)) + (ph.by ? ' \u00b7 ' + esc(dispName(ph.by)) : '') + (ph.link || ph.driveId ? ' \u00b7 ' + esc(t('على الدرايف')) : ''), act);
  }).join('');
  h += q.map(function(e){
    return row(img(e[1].data), svqKindLabel(e[1].kind), esc(t('في طابور جهازك — تُرفَع مع المزامنة')), btn('\u2715 ' + t('ألغِها'), 'btn-quiet btn-sm', ' data-svqqx="' + e[0] + '"'));
  }).join('');
  if (!list.length && !q.length) h += '<p class="hint">' + esc(t('لا صورَ لهذه الزيارة بعد.')) + '</p>';
  h += '<div class="svq-add"><label style="flex:1 1 55%">' + esc(t('نوع الصورة')) + '<select id="svqPhKind">'
    + SV_PHOTOS.map(function(p){ return '<option value="' + esc(p[0]) + '">' + esc(t(p[1])) + '</option>'; }).join('')
    + '<option value="extra" selected>' + esc(t('صورة إضافية')) + '</option></select></label>'
    + '<label class="btn btn-primary btn-sm" style="cursor:pointer;align-self:flex-end">\u{1F4F7} ' + esc(t('أضف صورة'))
    + '<input type="file" accept="image/*" multiple data-svqadd="1" style="display:none" aria-label="' + esc(t('أضف صورة')) + '"></label></div>'
    + '<p class="hint" style="margin:6px 0 0">' + esc(t('لاستبدال صورةٍ: احذف القديمةَ وأضف الجديدةَ بنوعها. والحذفُ يُسجَّل باسمك ولا يُمحى أثرُه.')) + '</p>';
  return h;
}
function svqPhotoDel(photoId){
  var p = (STATE.photos || {})[photoId], rec = p ? STATE.recs[p.site] : null;
  if (!p || !rec || p.del) return false;
  if (!svqCanDel(p, rec)){ toast(t('حذفُ هذه الصورة للمهندس')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  if (may('delete') && typeof photoDelete === 'function') photoDelete(photoId, 'من تعديل المسح');
  else {
    var dr = { site:p.site, kind:p.kind, at:p.at, by:p.by || p._by || '', del:{ by:who, at:now, why:'حذفها رافعُها من تعديل المسح' } };
    STATE.photos[photoId] = dr; CORE.set('photos', photoId, dr);
    logEvent('حذف صورة — ' + photoId + ' · من تعديل المسح', p.site);
  }
  var n = Object.assign({}, rec);
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:'ph:' + (p.kind || 'extra'), o:'صورة', v:'حُذفت', by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var left = svqPhotoCount(p.site);
  n.phN = left;
  if (p.kind && !(typeof photosOf === 'function' ? photosOf(p.site) : []).some(function(e){ return !(e[1] || {}).del && e[1].kind === p.kind; })) n.photos = (Array.isArray(rec.photos) ? rec.photos : []).filter(function(k){ return k !== p.kind; });
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', p.site, n);
  SVQ.delAsk = ''; statBump();
  toast(t(back ? 'حُذفت الصورة — وعاد المسحُ لانتظار الاعتماد' : 'حُذفت الصورة'));
  return true;
}
function svqPhoto(id, key, p){
  var rec = STATE.recs[id]; if (!rec || !svqMay(id) || !p || !p.data) return false;
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  var had = Array.isArray(rec.photos) && rec.photos.indexOf(key) > -1;
  if (typeof photoQueue === 'function') photoQueue(id, key, p.data);
  var n = Object.assign({}, rec);
  n.photos = (Array.isArray(rec.photos) ? rec.photos.slice() : []).filter(function(k){ return k !== key; }).concat([key]);
  n.phN = svqPhotoCount(id);   /* (V22.8) كلُّ صور الزيارة — في القاعدة وفي طابور الجهاز */
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:'ph:' + key, o:had ? 'صورة سابقة' : '', v:'صورة جديدة', by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', id, n);
  var lb = svqKindLabel(key);
  logEvent('تعديلُ صورة — ' + id + ' \u00b7 ' + lb + ' (إضافة)', id);
  if (rec.review === 'approved') notifPush('تعديلُ مسحٍ معتمد', t('صورة') + ': ' + t(lb) + ' — ' + id + (back ? ' — ' + t('عاد لانتظار الاعتماد') : ''), { site:id, lv:'مهم' });
  statBump();
  toast(t(back ? 'حُفظت الصورة — وعاد المسحُ لانتظار الاعتماد' : 'حُفظت الصورة — وتُرفَع مع المزامنة'));
  return true;
}
function svqSave(id, key, val){
  var rec = STATE.recs[id]; if (!rec || !svqMay(id)) return false;
  var old = key === 'chals' ? (rec.chals || []).slice() : rec[key];
  if (SVQ_NUM[key]){ var nv = cfgN(val); if (!(nv > 0)){ toast(t('اكتب رقمًا أكبر من صفر')); return false; } val = nv; }
  else if (key === 'chals'){ if (!val || !val.length){ toast(t('اختر تحديًا واحدًا على الأقل — أو «لا توجد تحديات»')); return false; } }
  else val = String(val == null ? '' : val).trim();
  if (JSON.stringify(old) === JSON.stringify(val)){ toast(t('لم يتغيّر شيء')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  var n = Object.assign({}, rec);
  n[key] = val;
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:key, o:old, v:val, by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', id, n);
  var line = t(svqLabel(key)) + ': ' + svqFmt(old) + ' \u2190 ' + svqFmt(val);
  logEvent('تعديلُ مسح — ' + id + ' \u00b7 ' + line, id);
  if (rec.review === 'approved') notifPush('تعديلُ مسحٍ معتمد', line + ' — ' + id + (back ? ' — ' + t('عاد لانتظار الاعتماد') : ''), { site:id, lv:'مهم' });
  SVQ.key = ''; SVQ.tmp = null;
  statBump();
  toast(t(back ? 'عُدِّل الحقل — وعاد المسحُ لانتظار الاعتماد' : 'عُدِّل الحقل — والباقي كما هو'));
  return true;
}
var BRIEF_ST = ['تمام', 'تحدٍّ', 'ملاحظة'];