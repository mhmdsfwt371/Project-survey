/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-01-site-edit-twins.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-01-site-edit-twins.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : dupMerge, dupUndo, dupMerged, dqCompound, dqMarkNoCo, dqSplitCo, siteEditSave, siteHide, siteRestore, siteDelete, siteDeleteFinal
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
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

function dqCompound(){
  var m = {};
  (STATE.sites || []).forEach(function(x){
    var c = String(x.co || '').trim();
    if (c && /[،,]|\s-\s/.test(c)) (m[c] = m[c] || []).push(x);
  });
  return m;
}

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
