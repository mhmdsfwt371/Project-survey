'use strict';   /* (V31.1) الوضعُ الصارم: لا متغيراتٍ ضمنيةً عامةً ولا أخطاءً صامتة — يسري على الشيفرة كلِّها */
/* ═══ حارسُ الإقلاع — قاطعُ التوقّف المتكرّر (V21.9) ═══
   بلاغ: «A problem repeatedly occurred» في سفاري الآيفون لحظةَ التحديث التلقائي، ويعمل
   بعد إغلاق التطبيق وفتحه. سفاري يعيد المحاولةَ مرّةً ثم يستسلم. فيُسجَّل هنا أوّلَ شيءٍ
   أن إقلاعًا بدأ، ويُعلَّم سليمًا بعد عشرين ثانيةً أو عند إغلاقٍ طبيعيّ (pagehide) —
   فإن وجد الإقلاعُ التالي سابقَه لم يُعلَّم خلال دقيقتين فقد مات فجأة: يُقلِع خفيفًا (بلا
   استعادة آخر صفحة، وبعد توقّفين في صفحةٍ خفيفة) ويسجّل المرحلةَ التي مات عندها. */
var BOOT_GUARD = (function(){
  var g = { crashes:0, prev:null };
  try { g.prev = JSON.parse(lsGet('nsk14.boot') || 'null'); } catch (e){ LS_ERR = e; }   /* lsGet محميّةٌ ومرفوعةٌ فتعمل هنا */
  var p = g.prev;
  g.crashes = (p && p.ok === false && Date.now() - (p.at || 0) < 120000) ? (p.n || 0) + 1 : 0;
  lsSet('nsk14.boot', JSON.stringify({ at:Date.now(), ok:false, n:g.crashes, stage:'start' }));
  return g;
})();
function bootStage(st){ var p = null; try { p = JSON.parse(lsGet('nsk14.boot') || '{}'); } catch (e){ LS_ERR = e; return; } if (!p || p.ok) return; p.stage = st; p.page = (typeof CUR === 'string') ? CUR : ''; lsSet('nsk14.boot', JSON.stringify(p)); }
function bootOk(why){ lsSet('nsk14.boot', JSON.stringify({ at:Date.now(), ok:true, n:0, stage:why || 'ok' })); }
setTimeout(function(){ bootOk('alive'); }, 20000);
try { if (lsGet('nsk14.sideoff') === '1' && document.body) document.body.classList.add('side-off'); } catch (e){ LS_ERR = e; }   /* (V23.9) الطيُّ محفوظ */
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('popstate', function(){ if (typeof SVQ !== 'undefined' && SVQ.id){ SVQ = { id:'', key:'', tmp:null }; try { render(1); } catch (e){ LS_ERR = e; } } });   /* (V22.7) */
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', function(){ bootOk('closed'); });

/* ═══ محرك اللغات — عربي · إنجليزي · أردو ═══
   كل نص واجهة يمر بـ t(). البيانات الميدانية تبقى كما كُتبت في كل اللغات. */

var I18N = {
  ar:{ name:'العربية', dir:'rtl', dig:'٠١٢٣٤٥٦٧٨٩' },
  en:{ name:'English', dir:'ltr', dig:'0123456789' },
  ur:{ name:'اردو',    dir:'rtl', dig:'۰۱۲۳۴۵۶۷۸۹' }
};

var D = { en:{}, ur:{} }, D2 = { en:{}, ur:{} };   /* القواميسُ في i18n/dict-<بصمة>.js — تُحمَّل عند اختيار لغةٍ غيرِ العربية (V22.0) */
var I18N_FILE = 'i18n/dict-7a2babb75a.js', I18N_STATE = 0, I18N_WAIT = [];   /* الحالة: ٠ لم يُطلَب · ١ يُحمَّل · ٢ جاهز · ٣ تعذّر */
function i18nLoad(){
  if (I18N_STATE || typeof document === 'undefined') return;
  if (typeof window !== 'undefined' && window.__NSK_DICT_SRC){ try { I18N_STATE = 1; (0, eval)(window.__NSK_DICT_SRC); if (I18N_STATE !== 2) i18nReady(); return; } catch (e){ LS_ERR = e; } }   /* بيئةُ الفحص تحقنه */
  I18N_STATE = 1;
  var sc = document.createElement('script'); sc.src = I18N_FILE; sc.async = true;
  sc.onload = function(){ if (I18N_STATE !== 2) i18nReady(); };
  sc.onerror = function(){ I18N_STATE = 3; i18nFlush(); try { toast(t('تعذّر تحميلُ الترجمة — تحقّق من الشبكة')); } catch (e){ LS_ERR = e; } };
  document.head.appendChild(sc);
}
/* ما يُرسَم مرةً ولا يُعاد (شاشةُ الدخول) ينتظر القاموسَ إن كانت اللغةُ غيرَ العربية — بمهلةِ ثانيتين ونصف،
   ثم يُرسَم بما وصل. والعربيةُ لا تنتظر شيئًا. */
function i18nThen(fn){
  if (LANG === 'ar' || I18N_STATE === 2 || I18N_STATE === 3){ fn(); return; }
  I18N_WAIT.push(fn); i18nLoad();
  setTimeout(i18nFlush, 2500);
}
function i18nFlush(){ var q = I18N_WAIT; I18N_WAIT = []; q.forEach(function(f){ try { f(); } catch (e){ LS_ERR = e; } }); }
/* وصل القاموس: ما انتظره يُرسَم، والعناصرُ الثابتةُ تُترجَم، والتطبيقُ يُعاد رسمُه — إن كان ظاهرًا:
   قبل الدخول هو مخفيٌّ خلف شاشة الدخول، ورسمُه حينئذٍ عملٌ بلا فائدة */
function i18nReady(){
  I18N_STATE = 2;
  i18nFlush();
  try { if (typeof shellLang === 'function') shellLang(); if (typeof langSync === 'function') langSync(); } catch (e){ LS_ERR = e; }
  try { if (typeof render === 'function' && !document.getElementById('login')) render(1); } catch (e){ LS_ERR = e; }
}

var LANG = 'ar';

/* ═══ (V34.4) طلبُ المالك: «شيل التشكيل من السيستم — خلّي الكلام واضح من السياق» ═══
   الحركاتُ (الفتحةُ والضمةُ والكسرةُ والتنوينُ والشدّةُ والسكونُ والألفُ الخنجرية) تُنزَع من كلِّ نصٍّ يُعرَض بالعربية — عند
   t() وesc() اللتين يمرّ بهما كلُّ نصٍّ ظاهر. المصدرُ والقاموسُ كما هما (مفاتيحُ الترجمة لا تتغيّر). ولا يُنزَع في بيئات الفحص
   الآلي (jsdom وwebdriver) لأن جرودَها تطابق النصوصَ بحركاتها؛ وجردٌ مخصّصٌ يفرض النزعَ بـnoTashkeel.force. */
var TASHKEEL_RE = /[\u064B-\u0652\u0670]/g;
function noTashkeel(){ if (noTashkeel.force != null) return noTashkeel.force; var c = noTashkeel.c; if (c == null){ var ua = (typeof navigator === 'object' && navigator.userAgent) || ''; c = noTashkeel.c = !/jsdom/i.test(ua) && !(typeof navigator === 'object' && navigator.webdriver); } return c; }
function t(s){
  if (LANG === 'ar') return (typeof s === 'string' && noTashkeel()) ? s.replace(TASHKEEL_RE, '') : s;
  if (I18N_STATE !== 2) i18nLoad();   /* (V21.6) القاموسُ ملفٌّ مستقلٌّ يُطلَب أوّلَ حاجة — والعربيةُ تُعرَض حتى يصل */
  var d = D[LANG] || {};
  return (d[s] != null) ? d[s] : s;
}

/* ═══ الأرقامُ والتواريخُ تتبع اللغة (V16.99) ═══
   كان النصُّ يُترجَم والرقمُ يبقى عربيَّ الخطِّ والتاريخُ «٢٠٢٦/٩/٩» في شاشةٍ
   إنجليزية — فيُقرأ نصفُها. صارت لغةُ العرض واحدةً: nm يتبع اللغةَ (وكان
   يتبعها أصلًا)، وكلُّ تاريخٍ يمرُّ بـfmtDate/fmtTime/fmtDT بدل ar-EG الثابتة. */
function locOf(){ return LANG === 'ar' ? 'ar-EG' : (LANG === 'ur' ? 'ur-PK' : 'en-GB'); }
function fmtDate(v, o){ try { return new Date(v).toLocaleDateString(locOf(), o || undefined); } catch (e){ return String(v); } }
function fmtTime(v, o){ try { return new Date(v).toLocaleTimeString(locOf(), o || { hour:'2-digit', minute:'2-digit' }); } catch (e){ return String(v); } }
function fmtDT(v){ try { return new Date(v).toLocaleString(locOf()); } catch (e){ return String(v); } }
function fmtDT2(v, o){ try { return new Date(v).toLocaleString(locOf(), o || undefined); } catch (e){ return String(v); } }
var NM_CACHE = {}, NM_N = 0;   /* (V26.2) toLocaleString بطيئةٌ وتُنادى آلافَ المرات في الرسمة — الأعدادُ الصحيحةُ تُحفَظ */
function nm(v){
  var cacheable = (typeof v === 'number') && isFinite(v) && Math.floor(v) === v && Math.abs(v) < 1e7, ck = cacheable ? (LANG + ':' + v) : '';
  if (cacheable){ var hit = NM_CACHE[ck]; if (hit !== undefined) return hit; }
  var s = String(v), dg = (I18N[LANG] || I18N.ar).dig;
  if (LANG === 'ar' || LANG === 'ur'){
    s = Number(v).toLocaleString('ar-EG');
    if (LANG === 'ur') s = s.replace(/[٠-٩]/g, function(c){ return dg['٠١٢٣٤٥٦٧٨٩'.indexOf(c)]; });
  } else s = Number(v).toLocaleString('en-US');
  if (cacheable){ if (NM_N > 20000){ NM_CACHE = {}; NM_N = 0; } NM_CACHE[ck] = s; NM_N++; }
  return s;
}

/* الهيكلُ الثابت — الشريطُ العلويُّ والقائمة — يُرسَم مرةً في HTML ولا
   يمرُّ بـrender()، فبقي عربيًّا عند تبديل اللغة: زرُّ «رجوع» وaria «القائمة»
   و«اضغط لفحص التحديثات». يُترجَم الآن بوسمٍ تعريفيٍّ يُقرأ لا بقائمةٍ
   تُحفَظ — فكلُّ عنصرٍ جديدٍ يُوسَم يُترجَم بلا تعديل هنا، وحارسُ اللغة
   يمسك ما نُسي وسمُه. */
function shellLang(){
  /* اسمُ صاحب الجلسة في الشريط الجانبي: يُنقحَر مع اللغة كبقيّة الأسماء */
  var sw = document.getElementById('sideWho');
  if (sw) sw.textContent = dispName(STATE.meta.name || '');
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el){
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

/* ═══ اللغةُ تُغيَّر من مكانين — فتتفق في المكانين ═══
   المبدِّلُ في الشريط العلويِّ والمنسدلةُ في أسفل القائمة يكتبان القيمةَ
   نفسَها، لكنَّ كلًّا منهما كان يعرض ما اختير منه هو وحده: من غيّر من فوق
   وجد المنسدلةَ تقول العربية، ومن غيّر من المنسدلة وجد الحرفَ العلويَّ
   صحيحًا وعلامةَ الاختيار في قائمة اللغات على غيرها. فصارت كلُّ أداةٍ
   تُزامَن من موضعٍ واحد: من غيّر من أيِّهما وجد الأخرى تقول ما اختاره. */
function langSync(){
  var sel = document.getElementById('langSel');
  if (sel && sel.value !== LANG) sel.value = LANG;
  var lt = document.getElementById('langTop');
  if (lt) lt.textContent = { ar:'ع', en:'EN', ur:'اُر' }[LANG] || 'ع';
  /* قائمةُ اللغات العلوية: علامةُ الاختيار تنتقل ولو كانت مفتوحة */
  document.querySelectorAll('[data-setlang]').forEach(function(b){
    var on = b.getAttribute('data-setlang') === LANG;
    b.classList.toggle('on', on);
    b.setAttribute('aria-current', on ? 'true' : 'false');
  });
  /* أزرارُ شاشة الدخول قبل الدخول */
  document.querySelectorAll('#lgLangs [data-l]').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-l') === LANG);
  });
}
function setLang(l){
  if (!I18N[l]) return;
  LANG = l;
  document.documentElement.lang = l;
  document.documentElement.dir  = I18N[l].dir;
  document.body.setAttribute('data-lang', l);
  lsSet('nsk14.lang', l);
  render();
  shellLang();
  langSync();
  /* (V22.0) من شاشة الدخول: تُعاد بلغتها الجديدة — ويبقى اسمُ المستخدم إن كُتب */
  if (document.getElementById('login') && document.getElementById('lgGo')) i18nThen(function(){
    var u = (document.getElementById('lgU') || {}).value || '', cv = document.getElementById('loginCv');
    try { if (cv && cv.__stop) cv.__stop(); } catch (e){ LS_ERR = e; }
    loginPaint();
    var u2 = document.getElementById('lgU'); if (u2 && u) u2.value = u;
  });
}

/* ═══ مسحُ الرقم التسلسلي بالكاميرا (V17.99) ═══
   الرقمُ التسلسليُّ يُكتَب يدًا فيُخطأ فيه حرف — والعُهدةُ كلُّها على الرقم.
   حين يعرف المتصفّحُ BarcodeDetector (كروم على أندرويد) يظهر زرُّ مسحٍ بجوار
   الحقل: الكاميرا الخلفيةُ بـgetUserMedia، ويُقرأ الرمزُ ويُملأ الحقلُ ويُغلَق
   التيّار. الكتابةُ اليدويةُ باقيةٌ دائمًا. وإن كان الرقمُ مسجَّلًا على نقطةٍ أخرى
   يُنبَّه ولا يُمنَع. والصيغةُ تُفحَص إن عرّفها الكتالوجُ للصنف (sn). */
var SCAN = { on:false, key:'', stream:null, timer:0, ok:false };
function scanSupported(){
  return !!(typeof window === 'object' && window.BarcodeDetector && typeof navigator === 'object' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function scanFormats(){
  if (!scanSupported()) return Promise.resolve([]);
  try { return window.BarcodeDetector.getSupportedFormats().then(function(f){ return (f || []).filter(function(x){ return /qr|code_128|code_39|ean|data_matrix|upc/.test(x); }); }).catch(function(){ return []; }); }
  catch (e){ return Promise.resolve([]); }
}
function scanCheck(){
  if (SCAN.ok || SCAN.checked) return;
  SCAN.checked = true;
  scanFormats().then(function(f){ SCAN.ok = f.length > 0; SCAN.formats = f; if (SCAN.ok && CUR === 'forms') render(1); });
}
function scanBtn(key){
  if (!SCAN.ok) return '';
  return btn('\u{1F4F7}', 'btn-quiet btn-sm', ' data-scan="' + esc(key) + '" aria-label="' + esc(t('امسح الرقمَ بالكاميرا')) + '" title="' + esc(t('امسح الرقمَ بالكاميرا')) + '"');
}
function scanOpen(key){
  if (!SCAN.ok) return;
  SCAN.key = key; SCAN.on = true; render(1);
  var video = document.getElementById('scanVideo'); if (!video) return;
  navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' } }, audio:false }).then(function(st){
    SCAN.stream = st; video.srcObject = st; try { video.play(); } catch (e){ LS_ERR = e; }
    var det = new window.BarcodeDetector({ formats: SCAN.formats });
    var tick = function(){
      if (!SCAN.on) return;
      det.detect(video).then(function(codes){
        var c = codes && codes[0];
        if (c && c.rawValue){ scanFill(String(c.rawValue).trim()); return; }
        SCAN.timer = setTimeout(tick, 250);
      }).catch(function(){ SCAN.timer = setTimeout(tick, 400); });
    };
    SCAN.timer = setTimeout(tick, 300);
  }).catch(function(){ toast(t('تعذّر فتحُ الكاميرا — اكتب الرقمَ يدًا')); scanClose(); });
}
function scanClose(){
  SCAN.on = false;
  if (SCAN.timer){ clearTimeout(SCAN.timer); SCAN.timer = 0; }
  if (SCAN.stream){ try { SCAN.stream.getTracks().forEach(function(tr){ tr.stop(); }); } catch (e){ LS_ERR = e; } SCAN.stream = null; }
  render(1);
}
function serialOwner(sn, exceptId){
  var v = String(sn || '').trim(); if (!v) return '';
  var I = STATE.inss || {}, hit = '';
  Object.keys(I).forEach(function(id){ if (hit || id === exceptId) return; var r = I[id]; Object.keys((r && r.serials) || {}).forEach(function(k){ if (String(r.serials[k] || '').trim() === v) hit = id; }); });
  return hit;
}
function serialFormatOk(key, sn){
  var it = itemsList().filter(function(i){ return i.code === key; })[0];
  if (!it || !it.sn) return true;
  try { return new RegExp(it.sn).test(String(sn || '').trim()); } catch (e){ return true; }
}
function scanFill(sn){
  var key = SCAN.key; scanClose();
  FORM.serials[key] = sn;
  var el = document.querySelector('[data-serial="' + CSS.escape(key) + '"]'); if (el) el.value = sn;
  if (!serialFormatOk(key, sn)) toast(t('الرقمُ لا يطابق صيغةَ هذا الصنف — راجعه'));
  var other = serialOwner(sn, FORM.site);
  if (other) toast(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + other);
  else toast(t('قُرئ الرقم') + ': ' + sn);
}
function scanSheet(){
  if (!SCAN.on) return '';
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);z-index:96">'
    + '<div class="pop" style="width:min(520px,94vw)"><div class="pop-head"><div><h3>' + esc(t('امسح الرقمَ بالكاميرا')) + '</h3><p class="hint" style="margin:2px 0 0">' + esc(t('وجّه الكاميرا إلى ملصق الجهاز — يُملأ الحقلُ وحدَه')) + '</p></div>'
    + btn('\u2715', 'btn-quiet btn-sm', ' data-scanx="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div class="pop-body"><video id="scanVideo" playsinline muted style="width:100%;max-height:60vh;background:#000;border-radius:10px"></video></div></div></div>';
}
/* ═══ إبقاءُ الشاشة أثناء النموذج (V17.99) ═══
   الفنيُّ يملأ نموذجَ المسح أو التركيب أو الصيانة وبين يديه الجهازُ والقلم،
   فتُطفَأ الشاشةُ فيعود إلى الدخول. يُمسَك قفلُ الشاشة ما دام نموذجٌ مفتوحًا،
   ويُعاد عند الرجوع إلى التبويب، ويُترَك عند الإغلاق أو الإخفاء أو بعد عشر
   دقائقَ بلا لمس. بكشف الميزة — وبلا صوتٍ حين تغيب. */
var WAKE = { lock:null, t:0, at:0 }, WAKE_PAGES = { svForm:1, insForm:1, maintForm:1, disForm:1, opsForm:1 };
function wakeWanted(){ var tab = (typeof TABS === 'object' && TABS[CUR] && typeof tabCur === 'function') ? tabCur(CUR) : ''; return !!WAKE_PAGES[CUR] || !!WAKE_PAGES[tab]; }   /* الصفحةُ أو شريحتُها (نماذجُ التركيب شرائحُ تحت forms) */
function wakeAcquire(){
  var nav = (typeof navigator === 'object') ? navigator : null;
  if (!nav || !nav.wakeLock || typeof nav.wakeLock.request !== 'function') return Promise.resolve(false);
  if (WAKE.lock && !WAKE.lock.released) return Promise.resolve(true);
  return nav.wakeLock.request('screen').then(function(l){ WAKE.lock = l; WAKE.at = Date.now(); wakeIdleArm(); return true; }).catch(function(){ return false; });
}
function wakeRelease(){
  if (WAKE.t){ clearTimeout(WAKE.t); WAKE.t = 0; }
  var l = WAKE.lock; WAKE.lock = null;
  if (l && typeof l.release === 'function'){ try { var p = l.release(); if (p && p.catch) p.catch(function(){}); } catch (e){ LS_ERR = e; } }
}
function wakeIdleArm(){
  if (WAKE.t) clearTimeout(WAKE.t);
  WAKE.t = setTimeout(function(){ WAKE.t = 0; wakeRelease(); }, 600000);
}
function wakeSync(){
  if (wakeWanted() && (typeof document !== 'object' || !document.hidden)) wakeAcquire(); else wakeRelease();
}
if (typeof document === 'object'){
  document.addEventListener('keydown', function(e){
    var tg = e.target || {};
    if (tg.id === 'navQ' && e.key === 'Enter'){ var f = document.querySelector('#nav a[data-p]'); if (f){ e.preventDefault(); f.click(); } return; }
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || '') && !tg.isContentEditable){ var q = document.getElementById('navQ'); if (q){ e.preventDefault(); document.body.classList.add('nav-open'); q.focus(); } }
  });
  document.addEventListener('visibilitychange', function(){ wakeSync(); }, { passive:true });
  /* (V25.9) مسودةُ المسح تُحفَظ لحظةَ تخرج الصفحةُ إلى الكاميرا — قبل أن يُنهيها الآيفون */
  document.addEventListener('visibilitychange', function(){ if (document.hidden && typeof SVD === 'object' && SVD.dirty) svDraftSave(); }, { passive:true });
  window.addEventListener('pagehide', function(){ if (typeof SVD === 'object' && SVD.dirty) svDraftSave(); });
  ['pointerdown', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, function(){ if (WAKE.lock && !WAKE.lock.released) wakeIdleArm(); else if (wakeWanted()) wakeAcquire(); }, { passive:true }); });
}
/* وضعُ الشمس: زرٌّ في الرأس والأدوات، يبقى بعد إعادة التحميل، ويُطفَأ في شاشة القاعة */
var SUN_ON = false;
function sunSet(on){
  SUN_ON = !!on;
  try { lsSet('nsk14.sun', SUN_ON ? '1' : '0'); } catch (e){ LS_ERR = e; }
  sunApply();
}
function sunApply(){
  var on = SUN_ON && !(typeof KIOSK_ON !== 'undefined' && KIOSK_ON);
  if (on) document.documentElement.setAttribute('data-sun', '1'); else document.documentElement.removeAttribute('data-sun');
  try { themeIcon(); } catch (e){ LS_ERR = e; }   /* زرُّ المظهر الواحد يقول الحالة (V21.8) */
  try { if (typeof mapPaint === 'function' && MAP) mapPaint(); } catch (e){ LS_ERR = e; }
}
/* أيقونةُ المظهر الحاليّ على زرِّه الوحيد (V21.8): ☾ داكن · ☀ فاتح · 🔆 الشمس */
function themeIcon(){
  var b2 = document.getElementById('themeTop'); if (!b2) return;
  var sun = typeof SUN_ON !== 'undefined' && SUN_ON, lt = document.documentElement.getAttribute('data-theme') === 'light';
  b2.textContent = sun ? '\u{1F506}' : (lt ? '\u2600' : '\u263D');
  b2.classList.toggle('on', !!sun);
}
function setTheme(m){
  document.documentElement.setAttribute('data-theme', m);
  lsSet('nsk14.theme', m);
  var b = document.getElementById('themeBtn');
  if (b) b.textContent = (m === 'dark') ? '\u2600' : '\u263D';
  themeIcon();
  try{ if (typeof mapTheme === 'function') mapTheme(); }catch(e){}
}

/* ═══ تكملة القاموس — الميدان والمشترك ═══
   الدستور §٧: ترجمة كاملة لواجهات الميدان والمشترك؛ محررات الإدارة عربية بقرار.
   والأسماء الميدانية (مربع/شاخص/معرّف الموقع) بياناتٌ تبقى عربيةً في كل اللغات. */

/* D2 مُعلَنٌ فارغًا مع D أعلاه — ويملؤه ملفُّ القاموس (V31.4: كان يُعلَن هنا ثانيةً) */

/* ═══ البيانات — أرقام المشروع الحقيقية ═══ */

/* المراجعُ الثابتةُ وحدَها: الأصنافُ وفئاتُ المشتريات والمورّدون.
   وما كان عرضًا — مواقعُ وأحداثٌ ومستخدمون وحركاتٌ وأرصدة — حُذف:
   العرضُ الذي يبقى بعد التسليم يُقرأ حقيقةً. */
var DATA = {
  items:[
    ['cor','cam_pe','كاميرا ممر 8266',16,2400, 4,0],
    ['cor','rtr','راوتر صناعي',10,1150, 5,3],
    ['cor','rdr8','قارئ ٨ منافذ',33,7200, 8,5],
    ['cor','ant12','هوائي UHF SRRA12',8,520, 0,0],
    ['cor','sol','لوح سولار ٤٠٠و',26,900, 0,3],
    ['cor','bat','بطارية ٢٠٠أ',16,1600, 0,3],
    ['cor','mppt','منظومة طاقة شمسية',13,700, 4,2],
    ['cor','mcb','بريكر MCB',5,90, 0,1],
    ['cor','boxb','بوكس بطارية ٨٠×٦٠×٣٠',20,950, 0,4],
    ['cor','c20','كابل RFID ٢٠م',13,260, 0,0],
    ['cor','c15c','كابل ١٥م 7D-FB',10,190, 0,0],
    ['cor','c10c','كابل ١٠م 5D-FB',8,140, 0,0],
    ['cor','c5c','كابل RFID ٥م',5,80, 0,0],
    ['cor','boxm','بوكس رئيسي ٦٠×٤٠×٢٠',26,680, 0,5],
    ['cor','sock','فيش كهرباء',2,45, 0,1],
    ['camp','cam','كاميرا مخيم 8361',8,2400, 4,0],
    ['camp','rtr2','راوتر صناعي',5,1150, 5,3],
    ['camp','rdr4c','قارئ ٤ منافذ',11,5100, 6,4],
    ['camp','ant9c','هوائي UHF SRRA9',3,420, 0,0],
    ['camp','ths','حساس حرارة ورطوبة',4,180, 3,0],
    ['camp','c15','كابل ١٥م 7D-FB',5,190, 0,0],
    ['camp','c10','كابل ١٠م 5D-FB',4,140, 0,0],
    ['camp','c5','كابل RFID ٥م',2,80, 0,0],
    ['camp','box','بوكس رئيسي ٦٠×٤٠×٢٠',13,680, 0,5],
    ['camp','led','شاشة ليد ٣ نقاط',2,150, 0,2],
    ['camp','korg','ليد أخضر',2,120, 0,1],
    ['camp','korr','ليد أحمر',2,120, 0,1],
    ['camp','rly','ريلاي ١٢ف',2,60, 0,1],
    ['camp','gwc','جيت واي',6,1900, 5,3],
    ['camp','sockc','فيش كهرباء',2,45, 0,1]
  ],
  buyCats:['كابلات وتوصيلات','أدوات ومعدات','مواد تثبيت','كهرباء','نقل ومواصلات','مستهلكات','عمالة وخدمات','أخرى'],
  suppliers:['محل النور','مؤسسة الحرم','شركة الأمانة']
};;

/* سجلُّ الشاشات — يُعرَّف مرةً هنا ويُضاف إليه في كل ملفٍ بعده */
var PAGE = {};

/* ═══ مساعدات العرض ═══ */
/* ═══ عزلُ الرموز اللاتينية داخل النصِّ العربي (V17.98) ═══
   معرِّفٌ مثل NSK-MIN-RDR-0018 أو رقمٌ تسلسليٌّ أو شاخصٌ مثل 12B/B04 داخل جملةٍ
   عربيةٍ قد يُعاد ترتيبُه بصريًّا. في HTML يُعزَل بـ<bdi>، وفي النصِّ الصريح (واتساب
   والتقارير) بعلامتَي FSI…PDI. للعرض فقط: القيمُ المخزونةُ والتصديرُ (CSV/JSON/إكسل)
   تبقى نظيفةً من العلامات. */
var BDI_TOK = /[A-Za-z0-9][A-Za-z0-9._:\/-]*[A-Za-z0-9]|[A-Za-z0-9]/g;
function bdiNeed(m){ return /[A-Za-z]/.test(m) || /[\/:.-]/.test(m); }
function bdi(s){ return '<bdi>' + esc(s) + '</bdi>'; }
function bdiText(s){
  /* التهريبُ بعد التقطيع: esc تحوّل الشَّرطةَ المائلة إلى مرجعٍ فيتقطّع الشاخص */
  s = String(s == null ? '' : s); var out = '', last = 0;
  s.replace(BDI_TOK, function(m, off){ out += esc(s.slice(last, off)) + (bdiNeed(m) ? '<bdi>' + esc(m) + '</bdi>' : esc(m)); last = off + m.length; return m; });
  return out + esc(s.slice(last));
}
function fsi(s){ return '\u2068' + String(s == null ? '' : s) + '\u2069'; }
function fsiText(s){ return String(s == null ? '' : s).replace(BDI_TOK, function(m){ return bdiNeed(m) ? '\u2068' + m + '\u2069' : m; }); }
function esc(s){ var x = String(s==null?'':s); if (LANG === 'ar' && noTashkeel()) x = x.replace(TASHKEEL_RE, '');   /* (V34.4) */
  return x
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\//g,'&#47;'); }
function N(v){ return '<span class="num">'+nm(v)+'</span>'; }

/* القيمةُ رقمٌ مُنسَّقٌ غالبًا (وسمٌ جاهز) فتُترَك، لكنها أحيانًا نصٌّ صرفٌ
   («متاح» · «مستوفٍ» · «—») فيُترجَم بنفس قاعدة خلايا الجدول. */
function stat(k,v,cls){
  return '<div class="stat'+(cls?' '+cls:'')+'"><div class="k">'+esc(t(k))+'</div>'
       + '<div class="v">'+cellT(v)+'</div></div>';
}
function stats(list){
  return '<div class="stats">'+list.map(function(s){ return stat(s[0],s[1],s[2]); }).join('')+'</div>';
}
function meter(label,v,max){
  var p = max ? Math.min(100, Math.round(v/max*100)) : 0;
  return '<div class="meter"><div class="meter-l"><span>'+esc(t(label))+'</span>'
       + '<span>'+nm(v)+' / '+nm(max)+' · '+nm(p)+'٪</span></div>'
       + '<div class="track"><i style="width:'+p+'%"></i></div></div>';
}
function card(title, body, right){
  return '<div class="card">'
    + (title ? '<div class="card-head"><h2>'+esc(t(title))+'</h2>'+(right||'')+'</div>' : '')
    + '<div class="card-body">'+body+'</div></div>';
}
/* عنوانٌ مبنيٌّ من أجزاءٍ هُرِّبت كلٌّ منها — لا يُهرَّب ثانيةً فتظهر الوسومُ نصًّا */
function cardRaw(titleHtml, body, right){
  return '<div class="card">'
    + (titleHtml ? '<div class="card-head"><h2>' + titleHtml + '</h2>' + (right || '') + '</div>' : '')
    + '<div class="card-body">' + body + '</div></div>';
}
function cardFlush(title, body, right){
  return '<div class="card">'
    + (title ? '<div class="card-head"><h2>'+esc(t(title))+'</h2>'+(right||'')+'</div>' : '')
    + '<div class="card-body tight">'+body+'</div></div>';
}
/* الخليةُ قد تحمل HTML جاهزًا (زرًّا أو شارةً أو رقمًا مُنسَّقًا) فلا تُمرَّر
   بالمترجم كما هي. لكنّ أكثرَ من أربعمئة خليةٍ نصٌّ عربيٌّ صرفٌ يُكتَب في
   مصفوفة الصف — «النطاق» و«المدّة» و«الميزانية» — فبقيت عربيةً بعد ترجمة
   مفاتيحها، لأن الرأسَ وحدَه كان يمرُّ بالمترجم. فصارت الخليةُ النصيةُ
   الصرفةُ (بلا وسمٍ ولا رقمٍ) تُترجَم، وما فيه وسمٌ يُترك كما بُني. */
function cellT(c){
  if (typeof c !== 'string') return c;
  if (c.indexOf('<') > -1 || c.indexOf('&') > -1) return c;
  return esc(t(c));
}
function table(head, rows, foot, opt){
  return '<div class="table-wrap' + ((opt && opt.sticky) ? ' sticky-1' : '') + '"><table class="data-table rows"><thead><tr>'
    + head.map(function(h){ return '<th>'+esc(t(h))+'</th>'; }).join('')
    + '</tr></thead><tbody>'
    + rows.map(function(r){
        if (r && r.raw) return r.raw;                      /* صفٌّ خامٌ يمتدُّ على الأعمدة — لوحاتُ المراجعة */
        return '<tr>'+r.map(function(c){ return '<td>'+cellT(c)+'</td>'; }).join('')+'</tr>'; }).join('')
    + '</tbody>'
    + (foot ? '<tfoot><tr>'+foot.map(function(c){ return '<td>'+cellT(c)+'</td>'; }).join('')+'</tr></tfoot>' : '')
    + '</table></div>';
}
function pill(txt, kind){ return '<span class="pill'+(kind?' '+kind:'')+'">'+esc(t(txt))+'</span>'; }
function alertBox(kind, txt){ return '<div class="alert '+kind+'"><span>'+esc(t(txt))+'</span></div>'; }
function pct(v,max){
  var p = max ? Math.round(v/max*100) : 0;
  var k = p>=100 ? 'ok' : (p>=70 ? 'warn' : 'off');
  return '<span class="pill '+k+'">'+nm(p)+'٪</span>';
}
function flow(steps, activeIdx){
  return '<div class="flow">' + steps.map(function(s,i){
    var cls = i < activeIdx ? ' done' : (i === activeIdx ? ' on' : '');
    return '<span class="flow-step'+cls+'">'+esc(t(s))+'</span>'
         + (i < steps.length-1 ? '<span class="flow-arr">\u2190</span>' : '');
  }).join('') + '</div>';
}
function btn(label, kind, extra){
  return '<button type="button" class="btn '+(kind||'btn-secondary')+'"'+(extra||'')+'>'+esc(t(label))+'</button>';
}
/* ═══ بحثٌ في كلِّ شاشة (V17.23) ═══
   بعضُ الشاشات لها بحثُها وأكثرُها بلا بحث، فيُلجَأ إلى بحث المتصفّح: يجد
   الكلمةَ ويلوّنها ولا يُخفي ما سواها، ولا يعمل على ما طُوي أو لم يُرسَم.
   فصار لكلِّ صفحةٍ صندوقٌ واحدٌ في رأسها يُصفّي **ما هو معروضٌ أمامك**:
   صفوفَ الجداول وبطاقاتِ القوائم — ويقول كم بقي من كم. ولا يُعيد الرسمَ
   عند كلِّ حرفٍ (فلا تضيع البؤرةُ ولا يُثقَل الجهاز)، بل يُخفي ويُظهر. */
function pageHead(eyebrow, title, lede, right){
  var canExp = (typeof SHEETS === 'object') && !!SHEETS[CUR];
  return '<div class="page-head"><div><span class="eyebrow">'+esc(t(eyebrow))+'</span>'
    + '<h1>'+esc(t(title))+'</h1>'
    + (lede ? '<p class="lede">'+esc(t(lede))+'</p>' : '') + '</div>'
    + '<div class="head-acts">'
    +   '<div class="pg-find"><input id="pgQ" type="search" dir="auto" value="' + esc(PG_Q) + '"'
    +     ' placeholder="' + esc(t('ابحث في هذه الصفحة')) + '" aria-label="' + esc(t('ابحث في هذه الصفحة')) + '">'
    +     '<span class="pg-find-n" id="pgQN"></span></div>'
    +   '<button type="button" class="btn btn-secondary btn-sm" data-help="1" '
    +     'aria-label="'+esc(t('ما هذه الصفحة؟'))+'" title="'+esc(t('ما هذه الصفحة؟'))+'">'+esc(t('؟'))+'</button>'
    +   (right !== undefined ? right
        : (canExp ? btn('تصدير','btn-secondary',' data-xls="'+CUR+'"') : ''))
    + '</div></div>';
}
/* ═══ صندوقٌ واحدٌ يقود بحثَ الصفحة نفسِه (V17.24) ═══
   لبعض الشاشات بحثٌ حقيقيٌّ يُرشِّح **بياناتها كلَّها** (شاشةُ اعتماد
   المهندس مثلًا: بالمعرِّف والشاخص والاسم والمشرف)، ولسبعٍ وخمسين شريحةً
   لا بحثَ لها فتُقرأ بالعين. فصار صندوقُ الرأس واحدًا في المظهر، مزدوجَ
   الأثر: إن كان للشاشة بحثُها قاده — فيُرشَّح كلُّ السجل لا المعروضَ منه —
   وإلا رشَّح ما هو معروضٌ أمامك. فلا شاشةَ بلا بحث، ولا بحثَ ينقص عمّا
   كان. والحدُّ الأقصى للصفوف يرتفع أثناء البحث فلا يختبئ المطلوبُ خلفه. */
var PG_Q = '';
var PG_BIND = {
  survey:  function(v){ SURV_Q = v; }, svappr: function(v){ SVA_Q = v; },
  minappr: function(v){ MIN_Q  = v; }, wbs:    function(v){ WBS_Q = v; },
  wtask:   function(v){ WT_Q   = v; }, users:  function(v){ USR.q = v; },
  co:      function(v){ CO_Q   = v; }, sites:  function(v){ SITE_Q = v; },
  items:   function(v){ IT_Q   = v; }, jobs:   function(v){ JB_Q  = v; },
  reqreg:  function(v){ REG_Q  = v; }, ships:  function(v){ SHIP_Q = v; },
  myveh:   function(v){ VEH_Q  = v; }, fleetLog: function(v){ VLOG_Q = v; },
  ips:     function(v){ IP_Q   = v; }, solution: function(v){ SOL_Q = v; },
  ev:      function(v){ EVF.q  = v; },
  chal:    function(v){ CHAL_Q = v; }, notif: function(v){ NTF_Q = v; }
};
var PG_LAST_BIND = null, PG_KEEP = false;
function pgBindOf(){
  var tab = (typeof TABS === 'object' && TABS[CUR]) ? PTAB[CUR] : '';
  return PG_BIND[tab] || PG_BIND[CUR] || null;
}
var PG_T = 0;
function pgFind(q){
  PG_Q = String(q == null ? PG_Q : q);
  var c = document.getElementById('content'); if (!c) return;
  var key = PG_Q.trim().toLowerCase();
  var rows = c.querySelectorAll('table tbody tr, .wt-le, .lg-row');
  var cards = c.querySelectorAll('#content > .card, .grid > .card, .wt-card');
  var seen = 0, hit = 0;
  var test = function(el){
    seen++;
    var ok = !key || (el.textContent || '').toLowerCase().indexOf(key) > -1;
    el.style.display = ok ? '' : 'none';
    if (ok) hit++;
    return ok;
  };
  for (var i = 0; i < rows.length; i++) test(rows[i]);
  /* البطاقةُ تُخفى إن لم تطابق هي ولا ما فيها من صفوفٍ ظاهرة */
  for (var j = 0; j < cards.length; j++){
    var cd = cards[j];
    if (!key){ cd.style.display = ''; continue; }
    var inner = cd.querySelectorAll('table tbody tr, .wt-le');
    var any = false;
    for (var k = 0; k < inner.length; k++) if (inner[k].style.display !== 'none'){ any = true; break; }
    cd.style.display = (any || (cd.textContent || '').toLowerCase().indexOf(key) > -1) ? '' : 'none';
  }
  var n = document.getElementById('pgQN');
  if (n) n.textContent = key ? (nm(hit) + ' ' + t('من') + ' ' + nm(seen)) : '';
}

/* ═══ مصدر القيم الواحد ═══
   لا قيمةَ افتراضيةً ولا رماديةً: كلُّ وزنٍ ونقطةٍ وتارجتٍ يبدأ صفرًا
   ويُضبط بيد المهندس. وما يُكتب هنا يقرؤه كلُّ ما بُني فوقه في اللحظة نفسها. */

var CFG = {
  /* أوزان الزيارة والفك — مفتاحها «المشعر|النوع» */
  w:  {},
  dw: {},

  /* التارجتات */
  tgtSurvey:0, tgtInsCamp:0, tgtInsCor:0,
  tgtPrepCamp:0, tgtPrepCor:0, tgtAsmCamp:0, tgtAsmCor:0, tgtDis:0,

  /* نقاط النقطة الكاملة ومعاملا الفك — والوزنُ لكلِّ نوعٍ على حدة */
  insCamp:0, insCor:0, disOk:0, disBad:0,
  insType:{},
  nameEn:{},   /* تصحيحُ نقحرةِ اسمٍ بعينه — يُكتَب مرةً ويثبت */

  /* ثوابت النظام */
  ph:0, otRate:0, warranty:0, days:0, hours:0, daysWeek:0,
  /* حارسُ التكلفة (V17.96): ١ = تنبيهُ ميزانية Google Cloud مضبوطٌ (يؤشّره المدير بعد ضبطه — docs/cost-guard.md) */
  budgetAlert:0,
  /* (V30.1) قواعدُ التنبيه بالأيام — تُضبَط من ثوابت النظام لا من الشيفرة (فكرةُ المالك #٢). صفرٌ = القاعدةُ معطَّلة */
  alObsDays:14, alPermitDays:7, alRevisitDays:3, alNoPhotoDays:2, alAssignDays:3, alStaleDays:21,
  /* (V30.3) القوائمُ تُعدَّل من الإعدادات لا من الشيفرة (فكرةُ المالك #٤): كلُّ مفتاحٍ مصفوفةُ نصوص، والفارغةُ تعني القائمةَ الأصلية */
  lists:{},
  /* متوسطُ غرف المخيم لكلِّ مشعرٍ — يُقرأ حين لا يُعَدُّ (V17.71): «منى» ١٢ ما لم يُضبَط */
  avgRooms:{},
  stgCfg:0, stgVal:0, stgIns:0,

  /* المواعيدُ المستهدفة (مللي ثانية) وزمنُ تركيب النقطة بالدقائق */
  dueSurvey:0, dueInstall:0, minCamp:0, minCor:0,
  /* زمنُ تركيبِ كلِّ نوعٍ بالدقائق (V17.14): كانت الكاميراتُ والمحطاتُ
     والبواباتُ والجسورُ تُحسَب بزمن الممرِّ لأن الجدولَ لم يعرف إلا نوعين */
  minType:{},

  /* المال */
  budCap:0, budApp:0, reservePct:0,

  /* الكتالوج — مفتاحها معرّف الصنف */
  itPts:{}, itPrice:{}, itPrep:{}, itAsm:{},

  /* الطواقم — مفتاحها معرّف الطاقم */
  crewSup:{}, crewTech:{}, crewGear:{}, crewRate:{}
};

/* قراءةٌ آمنة: الصفر قيمةٌ صحيحةٌ لا غيابٌ يُستبدل */
function cfgN(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
function cfgKey(k){ return (k === undefined || k === null || k === '') ? null : String(k); }
/* ═══ مفتاحُ الوزن بالاسم العربيِّ الخام (V19.0) ═══
   الأوزانُ تُخزَّن بمفتاح «مشعر|تصنيف»، والتصنيفُ كان يُقرأ بلغة الواجهة (catLabel
   → t): فجهازٌ بالإنجليزية يسأل عن «منى|Camps» فلا يجد وزنًا فيحسب النقاطَ صفرًا
   والمستحقَّ صفرًا، ومديرٌ بالإنجليزية يكتب وزنًا بمفتاحٍ إنجليزيٍّ لا يراه غيرُه.
   صار المفتاحُ يُردُّ إلى الاسم العربيِّ الخام عند كلِّ قراءةٍ وكتابةٍ للأوزان —
   فالرقمُ واحدٌ على كلِّ جهازٍ بأيِّ لغة. */
var WKEY_CACHE = { lang:'', n:-1, map:null };
function wKeyNorm(k){
  if (LANG === 'ar' || !k) return k;
  var n = Object.keys(CAT_DEF).length;
  if (WKEY_CACHE.lang !== LANG || WKEY_CACHE.n !== n || !WKEY_CACHE.map){
    var m = {}; Object.keys(CAT_DEF).forEach(function(ty){ var d = CAT_DEF[ty]; if (d && d.l){ m[t(d.l)] = d.l; } });
    WKEY_CACHE = { lang:LANG, n:n, map:m };
  }
  var M = WKEY_CACHE.map, i = k.indexOf('|');
  if (i < 0) return M[k] || k;
  var lab = k.slice(i + 1); return k.slice(0, i) + '|' + (M[lab] || lab);
}
function cfgGet(path, key){
  var k = cfgKey(key), o = CFG[path];
  if (k !== null && (path === 'w' || path === 'dw')){
    k = wKeyNorm(k);
    if (o && o[k] == null){   /* وزنٌ مكتوبٌ بتسميةٍ قديمة (V19.1) */
      var bar = k.indexOf('|'), z = bar < 0 ? '' : k.slice(0, bar + 1), lab = bar < 0 ? k : k.slice(bar + 1), al = W_ALIAS[lab] || [];
      for (var ai = 0; ai < al.length; ai++){ if (o[z + al[ai]] != null) return cfgN(o[z + al[ai]]); }
    }
  }
  if (k === null) return cfgN(o);
  return cfgN(o && o[k]);
}
function cfgSet(path, key, val){
  if (typeof CFG_VER === 'number') CFG_VER++;
  var k = cfgKey(key);
  if (k !== null && (path === 'w' || path === 'dw')) k = wKeyNorm(k);   /* يُكتَب بالمفتاح العربيِّ الخام (V19.0) */
  if (k === null) CFG[path] = cfgN(val);
  else { if (!CFG[path] || typeof CFG[path] !== 'object') CFG[path] = {}; CFG[path][k] = cfgN(val); }
  cfgPushSoon(path);
}

/* ═══ الإعداداتُ الرقميةُ تُرفَع — كانت تبقى على جهاز من كتبها ═══
   الأوزانُ والتارجتاتُ ونقاطُ القطع وثوابتُ النظام كلُّها تُقرأ عند الإقلاع من
   settings/points — ولم يكن شيءٌ يكتبها: cfgSet تُعدِّل الذاكرةَ والمخزنَ
   المحليَّ وتقف. فالمهندسُ يضبط وزنَ الزيارة على جهازه، وكلُّ جهازٍ آخرَ —
   وهاتفُه هو — يحسب النقاطَ بأوزانٍ صفر ولا يشكو. (النسخةُ القديمة V14.01
   كانت تكتبها، وسقط ذلك في إعادة البناء.)

   يُرفَع ما تغيّر لا الوثيقةُ كلُّها: كلُّ مسارٍ لُمس في هذه الجلسة يُكتَب
   بقيمته الحالية بدمجٍ (merge)، فلا يمحو جهازٌ قديمُ الذاكرة ما ضبطه غيرُه في
   مسارٍ لم يلمسه. ويُجمَّع بعد سكونٍ قصيرٍ فلا ترتفع كلُّ نقرةٍ وحدَها.
   ولا يُقيَّد إلا لمن يملك الإعدادات — فالقاعدةُ تردُّ غيرَه. */
var _cfgT = 0, _cfgTouched = {};
function cfgPushSoon(path){
  _cfgTouched[path] = 1;
  if (typeof may !== 'function' || !may('settings')) return;
  if (_cfgT) return;
  _cfgT = setTimeout(function(){ _cfgT = 0; cfgPush(); }, 1200);
}
function cfgPush(){
  var doc = {};
  Object.keys(_cfgTouched).forEach(function(k){ if (k in CFG) doc[k] = CFG[k]; });
  if (!Object.keys(doc).length) return;
  CORE.dirty('cfg', 'points', doc);
}

/* حقلُ تاريخٍ موصولٌ بالمصدر — يُخزَّن رقمًا (مللي ثانية) لأن CFG رقميّة */
function cfgDate(path){
  var v = cfgGet(path);
  return '<input type="date" value="' + (v ? dayKey(v) : '') + '" data-cfgdate="' + path + '">';
}

/* الأسبوعي يُشتقّ من الشهري بأيام العمل — وصفرٌ في الأيام يعني صفرًا لا قسمةً على صفر */
function cfgWk(monthly){
  var d = cfgGet('days'), w = cfgGet('daysWeek');
  return d ? Math.round(cfgN(monthly) * (w / d)) : 0;
}

/* حقلٌ موصولٌ بالمصدر: يكتب فيه عند التحرير فينتشر أثرُه */
function cfgInput(path, key, opt){
  opt = opt || {};
  var v = cfgGet(path, key);
  return '<input type="number" inputmode="' + (opt.dec ? 'decimal' : 'numeric') + '"'
    + ' step="' + (opt.step || (opt.dec ? '0.5' : '1')) + '" min="0"'
    + (opt.max ? ' max="' + opt.max + '"' : '')
    + ' value="' + v + '"'
    + ' data-cfg="' + path + '"'
    + (cfgKey(key) !== null ? ' data-cfgk="' + esc(key) + '"' : '')
    + (opt.style ? ' style="' + opt.style + '"' : '')
    + '>';
}

/* حقلٌ مشتقٌّ لا يُكتب — الأسبوعي من الشهري */
function cfgDerived(v){
  return '<input type="number" value="' + v + '" readonly tabindex="-1"'
    + ' style="background:var(--surface-2);color:var(--ink-soft)">';
}

/* ما يُشتقّ من المصدر — تقرؤه كل الشاشات فلا رقمان يفترقان */
function T(){
  return {
    survey:   cfgGet('tgtSurvey'),
    insCamp:  cfgGet('tgtInsCamp'),  insCor:  cfgGet('tgtInsCor'),
    prepCamp: cfgGet('tgtPrepCamp'), prepCor: cfgGet('tgtPrepCor'),
    asmCamp:  cfgGet('tgtAsmCamp'),  asmCor:  cfgGet('tgtAsmCor'),
    dis:      cfgGet('tgtDis'),
    ins:      cfgGet('tgtInsCamp')  + cfgGet('tgtInsCor'),
    prep:     cfgGet('tgtPrepCamp') + cfgGet('tgtPrepCor'),
    asm:      cfgGet('tgtAsmCamp')  + cfgGet('tgtAsmCor')
  };
}
function K(){
  return {
    ph:cfgGet('ph'), days:cfgGet('days'), hours:cfgGet('hours'), daysWeek:cfgGet('daysWeek'),
    insCamp:cfgGet('insCamp'), insCor:cfgGet('insCor'),
    disOk:cfgGet('disOk'), disBad:cfgGet('disBad'),
    stgCfg:cfgGet('stgCfg'), stgVal:cfgGet('stgVal'), stgIns:cfgGet('stgIns')
  };
}

/* أرقام الكتالوج من المصدر */
function itPts(id){ return cfgGet('itPts', id); }
function itPrice(id){ return cfgGet('itPrice', id); }
function itPrep(id){ return cfgGet('itPrep', id); }
function itAsm(id){ return cfgGet('itAsm', id); }

/* الطواقم من المصدر */
function crewVal(k, f){ return cfgGet('crew' + f, k); }

/* ما لم يُضبط بعدُ — تنبيهٌ يظهر حيث يهمّ */
/* ═══ المحرك — تخزينٌ محليٌّ أولًا ثم مزامنةٌ سحابية ═══
   الكتابة تنجح على الجهاز دائمًا، والشبكة تفصيلٌ لاحقٌ لا شرطٌ مسبق.
   وما لم يُرفع يبقى في طابورٍ يُعاد إرساله حين تعود الشبكة. */

var FB_CFG = {
  apiKey: "AIzaSyAo6s6Btxb7Nl1Eam_UBDNQUfUteNBRhMw",
  authDomain: "project-survey-60600.firebaseapp.com",
  projectId: "project-survey-60600",
  storageBucket: "project-survey-60600.firebasestorage.app",
  messagingSenderId: "526115444274",
  appId: "1:526115444274:web:949ec1a0f336bafe09ce2b"
};

/* ── المخزن المحلي: IndexedDB وإن تعذّر فذاكرةٌ حيّة ── */
var IDB_NAME = 'nusuk-v14', IDB_STORE = 'kv', _idb = null, _mem = null;

/* ═══ المخزنُ المحلي لا يستسلم (V17.93) ═══
   كان الفتحُ إن أبطأ أربعَ ثوانٍ أو أخطأ يقلب الجلسةَ كلَّها إلى ذاكرةٍ لا
   تُحفَظ — فيعمل الفنيُّ بلا شبكةٍ ثم يغلق التطبيقَ فيضيع يومُه بلا كلمة.
   صار: الفتحُ البطيءُ يُنتظَر ويُتبنّى إذا نجح لاحقًا، والخطأُ يُعاد بتراجعٍ
   (١ · ٣ · ١٠ · ٣٠ ثوانٍ ثم كلَّ دقيقة)، وما كُتب في الذاكرة يُدفَق إلى القاعدة
   حين تُفتَح لأنه الأحدث، وما دام الحفظُ المحليُّ لا يعمل تظهر لافتةٌ حمراءُ
   لا تُغلَق ويُسأل قبل إغلاق الصفحة. */
var IDB_LOG_ERR = null, IDB_TIMEOUT = (typeof window === 'object' && +window.NSK_IDB_TIMEOUT) || 4000,
    IDB_BACKOFF = (typeof window === 'object' && Array.isArray(window.NSK_IDB_BACKOFF)) ? window.NSK_IDB_BACKOFF : [1000, 3000, 10000, 30000, 60000],
    IDB_TRY = 0, IDB_RETRY_T = 0, IDB_BAD = false, IDB_PENDING = null;
/* (V19.5) سببُ تعطّل الحفظ بلغةٍ يفهمها الفنيّ — وما يفعله */
var IDB_WHY = '';
function idbWhyText(w){
  w = String(w || '');
  if (/connection to indexed database server lost|connection is closing|closing|InvalidStateError|UnknownError/i.test(w)) return 'انقطع اتصالُ المتصفّح بمخزنه بعد رجوع التطبيق من الخلفية (عيبٌ معروفٌ في آيفون) — يُعاد فتحُه تلقائيًّا.';
  if (/quota|full|space/i.test(w)) return 'مساحةُ الجهاز أو المتصفّح ممتلئة — فرّغ مساحةً ثم أعد فتح التطبيق.';
  if (/security|not allowed|denied|private/i.test(w)) return 'المتصفّحُ يمنع الحفظ (تصفّحٌ خاصٌّ أو إعداداتُ خصوصية) — افتح التطبيق في سفاري أو كروم العادي أو من أيقونة الشاشة الرئيسية.';
  if (/timeout/i.test(w)) return 'المتصفّحُ تأخّر في فتح المخزن — يُعاد المحاولةُ تلقائيًّا؛ وإن بقيت فأعد فتح التطبيق.';
  return 'السببُ غيرُ معروف — أعد فتح التطبيق، وإن بقيت فأرسل «نسخ التشخيص» من «حسابي».';
}
/* ═══ لافتةُ الحفظ المحلي حين الخطرُ حقيقيّ (V19.6) ═══
   الحفظُ المحليُّ المعطَّلُ لا يعني عملًا ضائعًا: كلُّ حفظٍ يُرفَع في لحظته. الخطرُ أن
   يُغلَق التطبيقُ وفي الطابور ما لم يُرفَع — فاللافتةُ تظهر حين الجهازُ بلا شبكة أو
   حين عملٌ ينتظر أكثرَ من ثماني ثوانٍ، وتختفي حين يُرفَع. لا إنذارَ بلا سبب — فمن لا
   يعرف التقنيةَ لا يُفزَع كلَّ حفظ. وما دام الحفظُ معطّلًا يُعاد الرفعُ كلَّ عشر ثوانٍ. */
function idbAtRisk(){
  if (!IDB_BAD) return false;
  if (!STATE.meta || !STATE.meta.online) return true;
  var now = Date.now();
  return (STATE.queue || []).some(function(q){ return now - (q.at || 0) > 8000; });
}
function idbBannerUpdate(){
  if (typeof document !== 'object' || !document.body) return;
  var ib = document.getElementById('idbBanner');
  if (idbAtRisk()){
    if (!ib){ ib = document.createElement('div'); ib.id = 'idbBanner'; ib.setAttribute('role', 'alert'); document.body.insertBefore(ib, document.body.firstChild); }

    if (!ib){ ib = document.createElement('div'); ib.id = 'idbBanner'; ib.setAttribute('role', 'alert'); document.body.insertBefore(ib, document.body.firstChild); }
    var ibN = (CORE && CORE.pending) ? CORE.pending() : 0;
    ib.innerHTML = '\u26A0 ' + esc(t('الحفظُ المحليُّ على هذا الجهاز لا يعمل: زامن الآن ولا تغلق التطبيق حتى يُرفَع عملُك.'))   /* بلغة اللحظة */
      + '<div style="font-weight:600;font-size:13px;margin-top:4px">' + esc(t('السبب')) + ': ' + esc(t(idbWhyText(IDB_WHY))) + ' ' + esc(t('وعملُك يُرفَع تلقائيًّا لحظةَ حفظه ما دامت الشبكة.')) + '</div>'
      + ' <button type="button" class="ib-sync" data-pull="1">\u{1F504} ' + esc(t('زامن الآن')) + ' <span id="idbBannerN">' + (ibN ? '(' + nm(ibN) + ' ' + esc(t('بانتظار الرفع')) + ')' : '') + '</span></button>'
      + ' <button type="button" class="ib-sync" data-idbretry="1">\u21BB ' + esc(t('أعد المحاولة')) + '</button>';
  } else if (ib){ ib.parentNode.removeChild(ib); }
}
var IDB_WATCH_T = 0;
function idbWatchStart(){
  if (IDB_WATCH_T || typeof setInterval !== 'function') return;
  IDB_WATCH_T = setInterval(function(){
    if (!IDB_BAD){ idbBannerUpdate(); return; }
    try { if (STATE.meta.online && FB.ready && CORE.pending() > 0) CORE.flush(); } catch (e){ LS_ERR = e; }
    idbBannerUpdate();
  }, 10000);
}
function idbTellBad(on, why){
  if (on) IDB_WHY = String(why || IDB_WHY || '');
  if (on) idbWatchStart();
  if (IDB_BAD === on) return;
  IDB_BAD = on;
  try { boxNote('idb', on ? 'bad:' + String(why || '').slice(0, 30) : 'ok'); } catch (e){ BOX_ERR = e; }
  try { if (typeof logEvent === 'function') logEvent(on ? 'الحفظُ المحليُّ لا يعمل — ' + String(why || '').slice(0, 40) : 'عاد الحفظُ المحلي', ''); } catch (e){ IDB_LOG_ERR = e; }
  try { if (typeof render === 'function') render(1); } catch (e){ IDB_LOG_ERR = e; }
}
function idbAdopt(db){
  _idb = db;
  if (IDB_RETRY_T){ clearTimeout(IDB_RETRY_T); IDB_RETRY_T = 0; }
  IDB_TRY = 0;
  /* الذاكرةُ أحدثُ مما في القاعدة: تُدفَق كلُّها ثم تُطوى */
  if (_mem && _mem.size){
    var pairs = []; _mem.forEach(function(v, k){ pairs.push([k, v]); });
    try {
      var tx = db.transaction(IDB_STORE, 'readwrite'), st = tx.objectStore(IDB_STORE);
      pairs.forEach(function(p){ st.put(p[1], p[0]); });
      tx.oncomplete = function(){ _mem = null; idbTellBad(false); };
      tx.onerror = function(){ idbTellBad(true, tx.error && tx.error.message); };
    } catch (e){ idbTellBad(true, e && e.message); return; }
  } else { _mem = null; idbTellBad(false); }
}
function idbDrop(){
  if (_idb){ try { _idb.close(); } catch (e){ IDB_LOG_ERR = e; } _idb = null; }
  idbRetryLater();
}
function idbRetryNow(){
  IDB_TRY = 0;
  if (IDB_RETRY_T){ clearTimeout(IDB_RETRY_T); IDB_RETRY_T = 0; }
  if (_idb){ try { _idb.close(); } catch (e){ IDB_LOG_ERR = e; } _idb = null; }
  return idbStart().catch(function(){ return null; });
}
/* الرجوعُ من الخلفية والحفظُ معطّل: محاولةُ فتحٍ فورية (V19.5) */
if (typeof document === 'object') document.addEventListener('visibilitychange', function(){ if (!document.hidden && IDB_BAD && typeof indexedDB !== 'undefined') idbRetryNow(); });
function idbRetryLater(){
  if (IDB_RETRY_T) return;
  var wait = IDB_BACKOFF[Math.min(IDB_TRY, IDB_BACKOFF.length - 1)]; IDB_TRY++;
  IDB_RETRY_T = setTimeout(function(){ IDB_RETRY_T = 0; idbStart().catch(function(){}); }, wait);
}
/* طلبُ الفتح نفسُه: يبقى حيًّا حتى ينجح أو يخطئ — لا يُفتَح طلبٌ ثانٍ ما دام هذا معلَّقًا */
function idbStart(){
  if (IDB_PENDING) return IDB_PENDING;
  IDB_PENDING = new Promise(function(res, rej){
    var q;
    var fail = function(e){
      IDB_PENDING = null;
      if (!_mem) _mem = new Map();
      idbTellBad(true, e && e.message); idbRetryLater(); rej(e);
    };
    /* متصفّحٌ بلا IndexedDB أصلًا (بيئاتُ الفحص): ذاكرةٌ بصمتٍ كما كان — لا إعادةَ ولا لافتة، فلا شيءَ يُنتظَر */
    if (typeof indexedDB === 'undefined'){ IDB_PENDING = null; if (!_mem) _mem = new Map(); rej(new Error('no-idb')); return; }
    try { q = indexedDB.open(IDB_NAME, 1); } catch (e){ fail(e); return; }
    q.onupgradeneeded = function(){ q.result.createObjectStore(IDB_STORE); };
    q.onsuccess = function(){ IDB_PENDING = null; idbAdopt(q.result); res(_idb); };   /* ولو بعد المهلة: يُتبنّى ويُدفَق */
    q.onerror = function(){ fail(q.error || new Error('idb-error')); };
  });
  return IDB_PENDING;
}
function idbOpen(){
  if (_idb) return Promise.resolve(_idb);
  if (typeof indexedDB === 'undefined'){ if (!_mem) _mem = new Map(); return Promise.reject(new Error('no-idb')); }
  /* سبقت مهلةٌ والطلبُ ما زال معلَّقًا، أو إعادةٌ مجدولةٌ بعد خطأ: نعمل في الذاكرة ولا نفتح طلبًا ثانيًا */
  if ((IDB_PENDING && _mem) || IDB_RETRY_T) return Promise.reject(new Error('mem-mode'));
  var p = idbStart();
  return new Promise(function(res, rej){
    var done = false;
    var t = setTimeout(function(){
      if (done) return; done = true;
      if (!_mem) _mem = new Map();
      idbTellBad(true, 'idb-timeout'); rej(new Error('idb-timeout'));   /* مهلةٌ لا استسلام */
    }, IDB_TIMEOUT);
    p.then(function(db){ clearTimeout(t); if (!done){ done = true; res(db); } },
           function(e){ clearTimeout(t); if (!done){ done = true; rej(e); } });
  });
}
function idbUnsynced(){ return !!(_mem && _mem.size) || (STATE && STATE.queue && STATE.queue.length > 0); }

function idbGet(k){
  return idbOpen().then(function(db){
    return new Promise(function(res, rej){
      var r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(k);
      r.onsuccess = function(){ res(r.result); };
      r.onerror   = function(){ rej(r.error); };
    });
  }).catch(function(e){
    /* (V33.0) القراءةُ على اتصالٍ ميّت (آيفون يقطعه بعد الخلفية) كانت تُرجِع الذاكرةَ وتُبقي الاتصالَ الميّت حتى تفشل كتابة —
       فيُترَك ويُعاد الفتحُ من القراءة أيضًا، لا من الكتابة وحدَها */
    if (e && /closing|closed|lost|InvalidStateError|UnknownError|internal error/i.test(String(e.name || '') + ' ' + String(e.message || '')) && _idb) idbDrop();
    return _mem ? _mem.get(k) : undefined;
  });
}

function idbSet(k, v){
  return idbOpen().then(function(db){
    return new Promise(function(res, rej){
      var tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(v, k);
      tx.oncomplete = function(){ res(true); };
      tx.onerror    = function(){ rej(tx.error); };
    });
  }).catch(function(e){
    if (!_mem) _mem = new Map();
    _mem.set(k, v);
    if (typeof indexedDB !== 'undefined'){
      idbTellBad(true, e && e.message);   /* حفظٌ فشل: يُقال ولا يُبتلَع */
      /* (V19.5) الاتصالُ الذي فشلت عليه الكتابةُ قد يكون ميّتًا (آيفون يقطعه بعد
         الخلفية): كان يُعاد استعمالُه مع كلِّ حفظٍ فيبقى الحفظُ معطّلًا حتى إعادة
         التحميل. يُترَك ويُعاد الفتحُ — والذاكرةُ تُدفَق فيه حين ينجح */
      idbDrop();
    }
    return false;
  });
}

/* ── الحالة الحيّة ── */
var STATE = {
  sites:   [],   /* المواقع */
  recs:    {},   /* سجلات المسح */
  inss:    {},   /* سجلات التركيب */
  tasks:   {},   /* المهام بأنواعها الأربعة */
  moves:   [],   /* دفتر حركة المخزون */
  buys:    {},   /* المشتريات — بمعرّفٍ لكلٍّ، لا مصفوفة (كان تضاربٌ هنا) */
  bonus:   {},   /* نقاط الزيادة اليدوية للفنيين */
  workReqs:{},   /* طلبات التهيئة والتجميع (CR/AR) */
  diss:{},       /* الفكُّ وإرجاعُ العُهدة (UR) */
  maints:{},     /* زياراتُ الصيانة (MR) — {id:{id,list:[]}} */
  steps:[],      /* آخرُ ما تمّ — يُعلَن ويُرفَع فتراه اللوحاتُ في كلِّ جهاز */
  photos:{},     /* سجلُّ الصور المرفوعة — {site-n:{site,kind,seq,name,driveId}} */
  pending:{},    /* حساباتٌ سُجِّلت ولم تُنشَأ في المصادقة بعد */
  provision:{},  /* طلباتُ إنشاءٍ للخادم — {user:{name,pass,role,status}} */
  att:{},        /* الحضورُ — {uid_day:{in:{at,lat,lng,ok},out,hours}} */
  presence:{},   /* آخرُ ظهورِ كلِّ جهاز — {uid:{name,role,ver,at,dev}} */
  events:  [],   /* سجل الأحداث */
  users:   {},   /* المستخدمون وأدوارهم */
  cfg:     {},   /* الإعدادات — مرآةُ CFG */
  queue:   [],   /* طابور الرفع */
  meta:    { lastSync:0, uid:'', role:'', name:'', online:false }
};

var QUEUE_CAP = 2000, _saveT = 0;

/* ═══ الاتساعُ إلى مئةٍ وخمسين جهازًا ═══
   معرّفٌ ثابتٌ لكلِّ جهاز: بلا معرّفٍ يشترك جهازان في معرّفٍ متسلسلٍ واحدٍ
   فيمحو أحدُهما الآخر، ولا يُعرَف أيُّهما كتب. */
/* خطةُ القاعدة — يقرؤها جردُ السعة: على Spark السقفُ يوقف الخدمة، وعلى Blaze
   يُحاسَب ما فوق الحصة نفسِها ولا يوقف. رُفعت إلى Blaze في ٧ سبتمبر ٢٠٢٦ بعد
   نفاد حصة يومٍ واحد. */
var FB_PLAN = 'blaze';
var DEV_ID = (function(){
  try {
    var k = 'nsk14.dev';
    var v = localStorage.getItem(k);
    if (!v){
      v = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(k, v);
    }
    return v;
  } catch(e){ return 'd' + Math.random().toString(36).slice(2, 10); }
})();
var _uidSeq = 0;
function uid36(){ return DEV_ID + '-' + Date.now().toString(36) + '-' + (++_uidSeq).toString(36); }

var CORE = {
  get:  function(kind, id){ var b = STATE[kind]; return b ? b[id] : undefined; },
  all:  function(kind){ return STATE[kind]; },
  set:  function(kind, id, v){
    if (!STATE[kind]) STATE[kind] = {};
    STATE[kind][id] = v; DB.memoReset();   /* (V31.6) */
    /* كلُّ كتابةٍ محليةٍ للمهامِّ تُبطِل فهرسَها — الفهرسُ سريعٌ لأنه مبنيٌّ
       مرةً، فلا يصحُّ أن يُقرأ قديمًا بعد إسنادٍ أو إنجاز (V17.47) */
    if (kind === 'tasks' && typeof TK_IX !== 'undefined') TK_IX = null;
    CORE.dirty(kind, id, v);
    return v;
  },
  /* ═══ الحذفُ شاهدُ قبرٍ لا محوٌ ═══
     المحوُ لا يصل الأجهزةَ الأخرى: السحبُ الفارقيُّ يجلب ما كُتب بعد آخر
     مزامنةٍ — والممحوُّ لم يُكتَب. فمُسح خمسةَ عشرَ إسنادًا من مكتبٍ وبقيت
     على هاتفَي مهندسٍ وفنيّ. صار الحذفُ كتابةَ شاهدٍ صغيرٍ {deleted:true}
     يصل كأيِّ تحديث، وكلُّ جهازٍ يمحو ما عليه شاهد. (الحساباتُ تُمحى محوًا —
     لها قاعدتُها وطلبُ خادمٍ.) */
  TOMB: { tasks:1, recs:1, inss:1, diss:1, maints:1, ncr:1, issues:1, moves:1, buys:1 },
  rm:   function(kind, id){
    delete STATE[kind][id];
    if (CORE.TOMB[kind]) CORE.dirty(kind, id, { id:String(id), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
    else CORE.dirty(kind, id, null);
  },
  /* ما عليه شاهدٌ يُمحى محليًّا بدل أن يُخزَّن */
  applyDoc: function(kind, id, v){
    if (!STATE[kind]) STATE[kind] = {};
    /* فهرسُ المهامِّ يُبطَل عند وصول أيِّ مهمةٍ من المزامنة — وإلا قرأ الفهرسُ
       القديمُ حالةً قديمةً: نقطةٌ أُسندت في جهازٍ آخرَ تبقى «لم تُزر» هنا
       حتى يُبطِله شيءٌ آخر. وكذلك أيُّ كتابةٍ مباشرةٍ على STATE.tasks. */
    if (kind === 'tasks' && typeof TK_IX !== 'undefined') TK_IX = null;
    if (v && v.deleted){ delete STATE[kind][id]; if (kind === 'newsites' && typeof siteDropLocal === 'function') siteDropLocal(id); return false; }   /* (V25.5) شاهدُ نقطةٍ مضافةٍ يرفعها من السجل */
    /* ═══ التعديلُ المتزامن يُقال ولا يُبتلَع (V17.79) ═══
       كان تعديلُ جهازين على السجلِّ نفسِه يمرُّ صامتًا: آخرُ من رفع كسب، ولا
       يعرف الأوّلُ أن ما كتبه ذهب. فإن وصلت وثيقةٌ كتبها غيري وفي طابوري
       تعديلٌ لها لم يُرفَع بعد — يُسجَّل التصادمُ ويُنبَّه صاحبُ الجهاز،
       ويبقى ما في الطابور يُرفَع كما هو: القرارُ له لا للجهاز. */
    try { if (typeof clashNote === 'function') clashNote(kind, id, STATE[kind][id], v); }
    catch (e2){ if (typeof softErr === 'function') softErr('تصادم', e2, ''); }
    /* الإشعارُ لصاحب الشأن يُولَد هنا — حيث تصل الوثيقةُ لا حيث كُتبت */
    try { if (typeof notifOnArrival === 'function') notifOnArrival(kind, id, STATE[kind][id], v); }
    catch (e){ if (typeof softErr === 'function') softErr('إشعار الوصول', e, ''); }
    STATE[kind][id] = v; return true;
  },
  push: function(kind, v){ STATE[kind].push(v); CORE.dirty(kind, v.id || String(STATE[kind].length-1), v); return v; },
  total:function(){ return STATE.sites.length; },

  /* كل تغييرٍ يدخل الطابور. والحفظُ مؤجَّلٌ: خمسون كتابةً حفظٌ واحدٌ بعد سكون،
     فلا يُثقَل القرصُ بخمسين كتابةً كاملةً للحالة. والطابور محدودٌ بألفين
     فلا يملأ الذاكرةَ انقطاعٌ طويل — وأقدمُه يُسقَط أولًا مع تحذير. */
  dirty: function(kind, id, v){
    /* معرِّفٌ فارغٌ أو فيه «/» ينفجر عند بناء المرجع فيُسقِط الدفعةَ كلَّها —
       يُرفَض هنا ويُقال، ولا يدخل الطابور */
    if (!CORE.validId(id)){
      if (typeof softErr === 'function') softErr('طابور — ' + kind, 'معرِّفٌ فارغٌ أو غيرُ صالح: «' + String(id) + '»', 'وثيقةٌ بلا معرِّفٍ لم تدخل الطابور — ' + kind);
      return;
    }
    if (typeof statBump === 'function') statBump();
    /* المفتاحُ الواحدُ لا يدخل الطابورَ مرتين: الإعدادُ يُكتَب مرارًا وهو
       يُقرَأ — فيتضخّم الطابورُ بكتاباتٍ لقيمةٍ واحدة، ويُرفَع القديمُ ثم
       الجديدُ بلا فائدة. تُطوى: آخرُ كتابةٍ هي الصحيحة. */
    for (var qi = STATE.queue.length - 1; qi >= 0; qi--){
      if (STATE.queue[qi].kind === kind && STATE.queue[qi].id === id){
        STATE.queue.splice(qi, 1);
        break;
      }
    }
    STATE.queue.push({ kind:kind, id:id, v:v, at:Date.now() });
    /* صفحةُ المزامنة تُحدَّث لحظةً بلحظة — بمهلةٍ قصيرة تجمع دفعةً واحدة */
    if (CUR === 'sys' && typeof render === 'function'){ clearTimeout(CORE._dr); CORE._dr = setTimeout(function(){ if (CUR === 'sys') render(1); }, 200); }
    /* لا يُسقَط شيء: أقدمُ ما في الطابور أوّلُ ما لم يُرفَع — أي أقدمُ عملٍ
       ميدانيٍّ لم يصل. كان يُقتطَع صامتًا فيضيع يومُ فنيٍّ ولا يعلم.
       فيُبقى كلُّه، ويُصاح إن طال، ويُمنَع النموُّ بلا حدٍّ بإيقاف قبولِ
       الجديد لا بمحو القديم. */
    if (STATE.queue.length > QUEUE_CAP){
      STATE.meta.backlog = STATE.queue.length;
      if (!STATE.meta.warned || Date.now() - STATE.meta.warned > 60000){
        STATE.meta.warned = Date.now();
        if (typeof toast === 'function')
          toast(t('الطابور متضخّم') + ': ' + nm(STATE.queue.length) + ' — ' + t('اتصل بالشبكة ليُرفَع'));
      }
    }
    CORE.saveSoon();
    CORE.flush();
  },

  /* حفظٌ مؤجَّل — يُجمَّع ما تتابع من كتابات */
  validId: function(id){
    var sId = (id === undefined || id === null) ? '' : String(id);
    return !!sId && sId.indexOf('/') < 0 && sId !== '.' && sId !== '..';
  },
  saveSoon: function(){
    if (_saveT) return;
    _saveT = setTimeout(function(){ _saveT = 0; CORE.saveLocal(); }, 400);
  },

  /* ═══ احتياطيُّ الطابور في localStorage (V21.0) ═══
     بلاغٌ من الميدان: «سجّلت النقطةَ ثلاثَ مراتٍ ولم تُسجَّل». المتصفّحُ غيرُ المثبَّت حين
     يقطع آيفونُ اتصالَه بالمخزن أو يعيد تحميلَ الصفحة يُسقِط ما في الذاكرة — والزيارةُ
     التي لم تُرفَع بعد (بلا شبكةٍ في الميدان) تضيع. localStorage يبقى حيث يسقط المخزن:
     يُكتَب فيه الطابورُ (بلا صور) مع كلِّ حفظ، ويُستعاد عند الإقلاع إن لم يكن في المخزن،
     ويُمحى حين يُرفَع كلُّ شيء. */
  qbakSave: function(){
    try {
      var q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'photos' && CORE.validId(it.id); }).slice(-150).map(function(it){
        var v = it.v;
        if (v && typeof v === 'object'){ var c = {}; Object.keys(v).forEach(function(k){ var val = v[k]; if (typeof val === 'string' && val.length > 4000) return; c[k] = val; }); v = c; }
        return { kind:it.kind, id:it.id, v:v, at:it.at || 0 };
      });
      lsSet('nsk14.qbak', q.length ? JSON.stringify(q) : '');
    } catch (e){ LS_ERR = e; }
  },
  qbakRestore: function(){
    try {
      var raw = lsGet('nsk14.qbak'); if (!raw) return 0;
      var q = JSON.parse(raw); if (!Array.isArray(q) || !q.length) return 0;
      var have = {}; (STATE.queue || []).forEach(function(it){ if (it) have[it.kind + '/' + it.id] = 1; });
      var n = 0;
      q.forEach(function(it){
        if (!it || !it.kind || !CORE.validId(it.id) || have[it.kind + '/' + it.id]) return;
        var col = STATE[it.kind];
        if (col && typeof col === 'object' && !Array.isArray(col) && it.v && typeof it.v === 'object' && !col[it.id]) col[it.id] = it.v;   /* يعود إلى مكانه إن لم يكن */
        STATE.queue.push({ kind:it.kind, id:it.id, v:it.v, at:it.at || Date.now() }); n++;
      });
      if (n && typeof logEventQuiet === 'function') logEventQuiet('استُعيد ' + n + ' من احتياطيِّ الطابور بعد فقد المخزن', '');
      return n;
    } catch (e){ LS_ERR = e; return 0; }
  },
  saveLocal: function(){
    CORE.qbakSave();
    return idbSet('state', {
      recs:STATE.recs, inss:STATE.inss, tasks:STATE.tasks,
      moves:STATE.moves, buys:STATE.buys, cfg:CFG, queue:STATE.queue,
      poison:STATE.poison || [],
      /* ما بُني حديثًا كان يضيع مع إعادة التحميل: الفكُّ والصيانةُ وسجلُّ
         ما تمّ — تُحفَظ كما تُحفَظ الزياراتُ والتركيبات. */
      diss:STATE.diss || {}, maints:STATE.maints || {}, steps:STATE.steps || [],
      photos:STATE.photos || {}, pending:STATE.pending || {}, provision:STATE.provision || {},
      att:STATE.att || {},
      siteOv:STATE.siteOv || {},
      pullAt:STATE.meta.pullAt || {},
      notifAt:STATE.meta.notifAt || 0,
      epoch:STATE.meta.epoch || 0,
      wbs:STATE.wbs || null,
      wtask:STATE.wtask || null,
      trials:STATE.trials || null,
      bugs:STATE.bugs || null
    });
  },

  loadLocal: function(){
    return idbGet('state').then(function(v){
      if (!v){ CORE.qbakRestore(); return false; }   /* لا مخزنَ: ما في الاحتياطيِّ يعود (V21.0) */
      /* ما عليه شاهدُ قبرٍ في الحفظ المحليِّ يُمحى عند التحميل */
      Object.keys(CORE.TOMB).forEach(function(k){
        var T = v[k]; if (!T || Array.isArray(T)) return;
        Object.keys(T).forEach(function(id){ if (T[id] && T[id].deleted) delete T[id]; });
      });
      ['recs','inss','tasks','moves','buys','queue','poison','diss','maints','steps','photos','pending','provision','att'].forEach(function(k){
        if (v[k]) STATE[k] = v[k];
      });
      if (v.siteOv && typeof v.siteOv === 'object'){ STATE.siteOv = v.siteOv; STATE.sites = STATE.sites.concat(STATE.hiddenSites || []); siteOvApply(); }
      if (v.cfg) Object.keys(v.cfg).forEach(function(k){ CFG[k] = v.cfg[k]; });
      if (v.pullAt && typeof v.pullAt === 'object') STATE.meta.pullAt = v.pullAt;
      if (v.notifAt) STATE.meta.notifAt = v.notifAt;
      if (v.epoch) STATE.meta.epoch = v.epoch;
      if (v.wbs && Array.isArray(v.wbs.rows)) STATE.wbs = v.wbs;
      if (v.wtask && Array.isArray(v.wtask.rows)) STATE.wtask = v.wtask;
      if (v.trials && Array.isArray(v.trials.rows)) STATE.trials = v.trials;
      if (v.bugs && typeof v.bugs === 'object') STATE.bugs = v.bugs;
      CORE.qbakRestore();   /* وما في الاحتياطيِّ ولم يصل إلى المخزن (V21.0) */
      /* يُطوى المكرَّرُ فيما حُمِّل: الطابورُ المحفوظُ قبل الطيِّ فيه مفاتيحُ
         مكرَّرة، فتُطوى مرةً هنا ولا تُرفَع مرارًا. */
      if (Array.isArray(STATE.queue) && STATE.queue.length > 1){
        var seen = {}, keep = [];
        for (var qi = STATE.queue.length - 1; qi >= 0; qi--){
          var it = STATE.queue[qi], k2 = it.kind + '/' + it.id;
          if (seen[k2]) continue;
          seen[k2] = 1; keep.unshift(it);
        }
        STATE.queue = keep;
      }
      /* وما دخل الطابورَ بمعرِّفٍ فارغٍ من نسخةٍ سابقة يُخرَج منه ويُقال — لا يُرفَع أبدًا */
      if (Array.isArray(STATE.queue)){
        var badQ = STATE.queue.filter(function(q){ return !CORE.validId(q.id); });
        if (badQ.length){
          STATE.queue = STATE.queue.filter(function(q){ return CORE.validId(q.id); });
          if (typeof logEventQuiet === 'function')
            logEventQuiet('أُخرج ' + badQ.length + ' من الطابور بمعرِّفٍ فارغ — ' + badQ.map(function(q){ return q.kind; }).join(','));
        }
      }
      /* معزولاتٌ باسمِ نوعٍ لا مجموعةَ له (أوامرُ حذفِ الأحداث باسم `events`
         من تصفيرِ V15.97 وما قبل) لا تُرفَع أبدًا مهما أُعيدت — تُسقَط ويُقال كم. */
      if (Array.isArray(STATE.poison) && STATE.poison.length && typeof FB === 'object' && FB && FB.colOf){
        var junk = STATE.poison.filter(function(p){ return FB.colOf(p.kind) === 'misc'; });
        if (junk.length){
          STATE.poison = STATE.poison.filter(function(p){ return FB.colOf(p.kind) !== 'misc'; });
          if (typeof logEventQuiet === 'function')
            logEventQuiet('أُسقط ' + junk.length + ' معزولةً لنوعٍ بلا مجموعة — ' + junk[0].kind);
        }
      }
      /* وتُعاد الشارةُ فورَ التحميل: كانت تُرسَم بما في الذاكرة ثم يُحمَّل
         المحفوظُ فلا تُعاد — فتقول سبعةً والطابورُ أربعةٌ وثلاثون، ويُقرأ
         الرقمان متناقضين وهما لحظتان مختلفتان. */
      if (typeof syncBadge === 'function') syncBadge();
      return true;
    }).catch(function(e){
      /* إن فشلت القراءةُ المحليةُ ظهر التطبيقُ فارغًا — فيظنُّ صاحبُه أن عملَه
         ضاع فيعيده. والصمتُ هنا يُنتج عملًا مكرَّرًا لا نقصًا فقط. */
      softErr('القراءة المحلية', e, 'تعذّرت قراءةُ ما حُفظ على هذا الجهاز — زامِن قبل أن تسجّل فوقه');
      return false;
    });
  },

  /* الرفع — يُحاوَل ويُترك الطابور إن فشل */
  _busy: false,
  flush: function(){
    if (!STATE.meta.online || !STATE.queue.length) return Promise.resolve(0);
    /* لا يُرفَع شيءٌ قبل أن يُعرَف العهدُ — وإلا عاد القديمُ إلى قاعدةٍ صُفِّرت */
    if (EPOCH_PENDING) return Promise.resolve(0);
    /* رفعٌ واحدٌ في كلِّ لحظة: كان الرفعُ يُستدعى من الدورة ومن الحفظ ومن
       الاتصال معًا، فتُرفَع الدفعةُ نفسُها مرتين وتُعَدُّ محاولاتُ الوثيقة
       المرفوضة ثلاثًا في ثانية. */
    /* والقفلُ يُفَكُّ بعد نصف دقيقةٍ ولو لم يعد الرفعُ السابق — فإن علق
       تهيئةُ Firebase على شبكةٍ رديئةٍ لا يعلق الطابورُ معه إلى الأبد */
    if (CORE._busy && Date.now() - (CORE._busyAt || 0) < 30000) return Promise.resolve(0);
    CORE._busy = true; CORE._busyAt = Date.now();
    /* ما لا يصلح معرِّفُه يُعزَل باسمه قبل الدفع ولا يُوقف ما بعده */
    var badIds = STATE.queue.filter(function(q){ return !CORE.validId(q.id); });
    if (badIds.length){
      STATE.poison = STATE.poison || [];
      badIds.forEach(function(q){
        if (!STATE.poison.some(function(p2){ return p2.kind === q.kind && String(p2.id) === String(q.id); }))
          STATE.poison.push({ kind:q.kind, id:String(q.id || ''), v:q.v, err:'معرِّفٌ فارغٌ أو غيرُ صالح — لا يُرفَع', at:Date.now() });
      });
      STATE.queue = STATE.queue.filter(function(q){ return CORE.validId(q.id); });
      CORE.saveSoon();
      if (!STATE.queue.length){ CORE._busy = false; return Promise.resolve(0); }
    }
    /* ما أُجِّل لا يُرفَع قبل موعده ولا يعيق ما بعده (V17.40) */
  var nowQ = Date.now();
    var batch = (STATE.queue || []).filter(function(it){ return !it.next || it.next <= nowQ; }).slice(0, 50);
    if (!batch.length){ CORE._busy = false; return Promise.resolve(0); }   /* كلُّه مؤجَّلٌ — يُنتظَر موعدُه */
    /* يُهيَّأ Firebase قبل الدفع: كان يُنادى `push` مباشرةً وهي ترفض
       بـ«not-ready» إن لم يُحمَّل بعد — وهو يُحمَّل كسولًا. فيبقى الطابورُ
       واقفًا ويُعاد الرفضُ في كلِّ دورةٍ فلا يصل شيءٌ أبدًا. */
    return FB.init().then(function(ok){
      if (!ok) return Promise.reject(new Error('offline'));
      return FB.push(batch).then(function(){ return { ok:batch, failed:[] }; })
        .catch(function(e){
          /* الدفعةُ سقطت جملةً — يُعرَف السببُ وثيقةً وثيقة */
          if (/offline|not-ready|unavailable|network/i.test(String(e && (e.message || e.code) || e))) throw e;
          return FB.pushEach(batch);
        });
    }).then(function(r){
      var okIds = {};
      r.ok.forEach(function(it){ okIds[it.kind + '|' + it.id] = 1; });
      STATE.queue = STATE.queue.filter(function(it){ return !okIds[it.kind + '|' + it.id]; });
      CORE.qbakSave();   /* (V21.4) ما رُفع يخرج من الاحتياطيّ في اللحظة — لا بعد مهلة الحفظ */
      /* نبضةٌ واحدةٌ لكلِّ دفعةٍ ناجحة: أيُّ مجموعاتٍ تغيّرت — فتسحب الأجهزةُ
         الأخرى فارقَها في ثوانٍ لا بعد عشر دقائق (V17.26). النبضةُ نفسُها
         لا تُنبِض (settings) وإلا دار الجهازُ على نفسه. */
      var kinds = {};
      r.ok.forEach(function(it){ if (it.kind !== 'cfg' && it.kind !== 'presence' && it.kind !== 'stats' && it.kind !== 'evlog') kinds[it.kind] = 1; });
      if (Object.keys(kinds).length) FB.pulse(Object.keys(kinds));
      r.failed.forEach(function(f){
        var it = f.it; it.tries = (it.tries || 0) + 1; it.err = f.msg;
        softErr('رفع وثيقة — ' + it.kind + '/' + it.id, f.msg, '');
        /* ═══ ما فشل يُعاد بمهلةٍ متزايدة لا يُعزَل بعد ثلاث (V17.40) ═══
           أكثرُ أسباب الفشل عابرٌ: شبكةٌ انقطعت أو مهلةٌ انتهت أو القاعدةُ
           مشغولة. فكان عزلُ الوثيقة بعد ثلاثِ محاولاتٍ متتاليةٍ يحبس عملًا
           صحيحًا على الجهاز لأن الشبكةَ ساءت دقيقة. صارت تُؤجَّل وتُعاد:
           دقيقةٌ ثم أربعٌ ثم خمسَ عشرةَ ثم ساعةٌ ثم ثلاثٌ — حتى اثنتي عشرةَ
           محاولة. ولا يُعزَل إلا ما لا يُصلحه التكرار: رفضُ القواعد أو حجمٌ
           فوق السقف — ذاك عزلُه فورًا وإعادتُه عبث. */
        var msg = String(f.msg || '');
        var hard = /permission|denied|PERMISSION|INVALID_ARGUMENT|invalid|too large|exceeds|maximum/i.test(msg);
        if (!hard && it.tries < 12){
          var waits = [60000, 240000, 900000, 3600000, 10800000];
          it.next = Date.now() + waits[Math.min(it.tries - 1, waits.length - 1)];
          return;
        }
        if (hard || it.tries >= 12){
          /* تُعزَل: تخرج من الطابور إلى ركنٍ يُرى — فلا تعيق ما بعدها */
          STATE.poison = STATE.poison || [];
          if (!STATE.poison.some(function(p2){ return p2.kind === it.kind && String(p2.id) === String(it.id); }))
            STATE.poison.push({ kind:it.kind, id:it.id, v:it.v, err:f.msg, at:Date.now() });
          STATE.queue = STATE.queue.filter(function(q){ return q !== it; });
          logEvent('وثيقةٌ عُزلت عن الرفع — ' + it.kind + '/' + it.id + ' \u00b7 ' + f.msg.slice(0, 80), it.id);   /* (V31.1) كان `id` غيرَ معرَّفٍ هنا فيرمي خطأً */
        }
      });
      if (r.failed.length && !SOFT_SAID['رفع الطابور']){
        SOFT_SAID['رفع الطابور'] = 1;
        /* الرسالةُ تسمّي أوّلَ مجموعةٍ رُفضت — «سبعُ وثائق» بلا اسمٍ لا تُشخَّص */
        var f0 = r.failed[0].it;
        toast(nm(r.failed.length) + ' ' + t('وثيقةً رُفضت')
              + ' \u00b7 ' + esc(f0.kind) + '/' + esc(String(f0.id)).slice(0, 24)
              + ' \u2014 ' + t('التفصيلُ في «المزامنة والتعارض»'));
      }
      if (r.ok.length){
        STATE.meta.lastSync = Date.now();
        if (typeof rollupToday === 'function') rollupToday();
        /* نجحت دفعةٌ — يُصفَّر التكتّمُ ليُقال الفشلُ التالي ولا يُبتلَع */
        if (!r.failed.length) SOFT_SAID = {};
      }
      CORE.saveLocal();
      syncBadge();
      /* صفحةُ المزامنة تعرض الطابورَ نفسَه — فإن دُفع من الدورة التلقائية بقيت
         تقول «بانتظار الرفع ١» وقد فرغ، ويضغط المستخدمُ فيُقال له «فارغ» */
      if (CUR === 'sys' || CUR === 'sync'){ clearTimeout(CORE._dr); CORE._dr = setTimeout(function(){ if (CUR === 'sys' || CUR === 'sync') render(1); }, 200); }
      CORE._busy = false;
      /* (V19.5) ما كُتب أثناء هذا الرفع وجد القفلَ مغلقًا فانتظر دورةَ الدقيقة — يُرفَع
         الآن ما صار مستحقًّا منه، مرةً بعد ثانيةٍ ونصف (ولا يدور على مؤجَّلٍ ولا فاشل) */
      var dueNow = STATE.queue.some(function(it){ return !it.next || it.next <= Date.now(); });
      if (dueNow && r.ok.length && !r.failed.length){ clearTimeout(CORE._chain); CORE._chain = setTimeout(function(){ try { CORE.flush(); } catch (e2){ LS_ERR = e2; } }, 1500); }
      return r.ok.length;
    }).catch(function(e){
      /* كان يعود صفرًا صامتًا: يبقى «ثلاثةٌ بانتظار الرفع» ولا يُعرَف لماذا،
         فينتظر المستخدمُ دورةً لن تنجح. */
      CORE._busy = false;
      softErr('رفع الطابور', e, 'تعذّر الرفعُ — ما سُجّل محفوظٌ على الجهاز ويُعاد تلقائيًّا');
      return 0;
    });
  },

  pending: function(){ return STATE.queue.length; }
};

/* ── جسر Firebase — يُحمَّل كسولًا فلا يُعطّل الإقلاع ── */
var FB = {
  app:null, auth:null, db:null, ready:false,

  /* يُحمَّل عند أول حاجةٍ إليه لا مع الصفحة: الإقلاعُ لا ينتظر شبكةً.
     وكان يُفترَض موجودًا ولا سكربتَ يُحمّله أصلًا — فتعود `init` بـ`false`
     دائمًا: لا دخولَ ولا رفعَ ولا جلسةٌ محفوظة. */
  _load: null,
  load: function(){
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.firebase && window.firebase.auth) return Promise.resolve(true);
    if (FB._load) return FB._load;
    var B = 'https://www.gstatic.com/firebasejs/9.23.0/';
    var one = function(f){
      return new Promise(function(res){
        var sc = document.createElement('script');
        sc.src = B + f;
        sc.onload = function(){ res(true); };
        sc.onerror = function(){ res(false); };
        document.head.appendChild(sc);
      });
    };
    FB._load = one('firebase-app-compat.js')
      .then(function(ok){ return ok ? one('firebase-auth-compat.js') : false; })
      .then(function(ok){ return ok ? one('firebase-firestore-compat.js') : false; })
      .then(function(ok){ return !!(ok && window.firebase && window.firebase.auth); })
      .catch(function(){ return false; });
    return FB._load;
  },
  init: function(){
    if (FB.ready) return Promise.resolve(true);
    return FB.load().then(function(ok){
      if (!ok) return false;
      return FB._start();
    });
  },
  _start: function(){
    if (FB.ready) return true;
    if (typeof window === 'undefined' || !window.firebase) return false;
    try {
      FB.app  = window.firebase.initializeApp(FB_CFG);
      FB.auth = window.firebase.auth();
      FB.db   = window.firebase.firestore();
      FB.ready = true;
      return true;
    } catch(e){ return false; }
  },

  /* إنشاءُ حسابٍ بتطبيقٍ ثانٍ: التطبيقُ الثاني له جلستُه المستقلّة، فالتسجيلُ
     فيه لا يمسُّ جلسةَ الأول — فلا يخرج المهندسُ من حسابه وهو يُنشئ حسابًا
     لغيره. ثم يُخرَج من الثاني فلا تبقى جلسةٌ معلَّقة.
     ولا يحتاج خطةً مدفوعةً ولا دالةً سحابيةً ولا مفتاحَ حسابِ خدمةٍ في
     المتصفّح — وكلُّها طرقٌ أثقلُ لنتيجةٍ واحدة. */
  createUser: function(user, pass, meta){
    return FB.init().then(function(ok){
      if (!ok) return { ok:false, err:'offline' };
      var email = user.indexOf('@') > -1 ? user : (user + '@nusuk.local');
      var second;
      try {
        second = (window.firebase.apps || []).filter(function(a){ return a.name === 'mk'; })[0]
              || window.firebase.initializeApp(FB_CFG, 'mk');
      } catch (e){ return { ok:false, err:'app' }; }
      var bye = function(r){
        return second.auth().signOut().then(function(){ return r; })
               .catch(function(){ return r; });
      };
      return second.auth().createUserWithEmailAndPassword(email, pass)
        .then(function(c){
          return DB.col('users').doc(c.user.uid).set({
            name:(meta && meta.name) || user, user:user,
            role:(meta && meta.role) || 'tech',
            at:Date.now(), by:STATE.meta.name || '',
            _by:STATE.meta.uid || '', _at:Date.now()   /* هويةُ الكاتب لا اسمُه (V17.93) */
          }).then(function(){ return { ok:true, uid:c.user.uid }; });
        })
        .then(bye)
        .catch(function(e){ return bye({ ok:false, err:String(e && e.code || e) }); });
    });
  },

  signIn: function(user, pass){
    return FB.init().then(function(ok){
      if (!ok) return { ok:false, err:'offline' };
      var email = user.indexOf('@') > -1 ? user : (user + '@nusuk.local');
      return FB.auth.signInWithEmailAndPassword(email, pass)
        .then(function(c){
          STATE.meta.uid = c.user.uid;
          STATE.meta.online = true;
          return DB.col('users').doc(c.user.uid).get();
        })
        .then(function(doc){
          var u = (doc && doc.exists) ? doc.data() : {};
          STATE.meta.role = isBossHere() ? 'admin' : (u.role || 'tech');
          STATE.meta.name = u.name || user;
          STATE.meta.kind = u.kind || '';
          if (u.mustChange) setTimeout(function(){ pwOpen(true); }, 900);
          return { ok:true, role:STATE.meta.role, name:STATE.meta.name };
        })
        .catch(function(e){ return { ok:false, err:String(e && e.code || e) }; });
    });
  },

  /* ═══ الوثيقةُ المسمومة لا توقف الطابور ═══
     الدفعةُ تُرفَع كلُّها أو لا شيء — فوثيقةٌ واحدةٌ فيها قيمةٌ غيرُ
     مقبولة (undefined) أو ترفضها القاعدةُ كانت تُسقِط الدفعةَ كلَّها، وتعود
     في الدورة التالية فتسقطها ثانيةً، إلى الأبد: «تعذّر الرفع» كلَّ دقيقةٍ ولا
     يصل شيءٌ ولا يُعرَف أيُّ وثيقةٍ السبب. صار الرفعُ إن فشل جملةً يُعاد
     وثيقةً وثيقة: ما نجح يخرج من الطابور، وما فشل ثلاثًا يُعزَل في ركنٍ
     يُرى بسببه — ويُصفّى من undefined قبل الإرسال أصلًا. */
  clean: function(v){
    if (v === undefined) return null;
    if (v === null || typeof v !== 'object') return (typeof v === 'number' && !isFinite(v)) ? null : v;
    if (Array.isArray(v)) return v.map(FB.clean);
    var o = {};
    Object.keys(v).forEach(function(k){ if (v[k] !== undefined) o[k] = FB.clean(v[k]); });
    return o;
  },
  colOf: function(kind){
    return { recs:'recs', inss:'inss', tasks:'tasks', moves:'inventory',
             buys:'purchases', cfg:'settings', users:'users',
             evlog:'events', diss:'dismantles', newsites:'newsites',
             coreqs:'coreqs', fixreqs:'fixreqs', bugs:'bugs', sites:'sites', ships:'ships',
             vehicles:'vehicles', vehAsn:'vehAsn', accounts:'accounts', photos:'photos',
             stats:'stats', teams:'teams', baseline:'baseline',
             changes:'changes', hse:'hse', ncr:'ncr', ipc:'ipc', bonus:'bonus',
             workReqs:'workreqs', maints:'maints', steps:'steps', pending:'pending', provision:'provision', att:'att', ghcfg:'ghcfg', presence:'presence' }[kind] || 'misc';
  },
  live: function(kind, v){
    /* (V28.3) بلاغُ الوزارة «مسحنا المخيم مراتٍ ولم يُضَف»: الحذفُ يكتب شاهدًا {deleted:true} بدمج، والمسحُ التالي يُكتَب بدمجٍ
       أيضًا فيبقى الشاهدُ في الوثيقة تحت المسح الجديد — فتمحوه كلُّ الأجهزة عند القراءة وكأنه لم يُسجَّل قط. كلُّ كتابةٍ حيّةٍ
       لنوعٍ له شواهد تمحو الشاهدَ صراحةً، والمسحُ الكاملُ يمحو علَمَ «السريعة» الباقيَ من قبله. */

    var vv = Object.assign({}, v);   /* الختمُ (_by/_at) عند النداء نفسِه — يفحصه جردُ الهوية */
    var roOnly = STATE.meta && (STATE.meta.role === 'viewer' || STATE.meta.role === 'exec');   /* (V28.4) اعتمادُ الوزارة تحصر قاعدتُه الحقولَ — فلا يُضاف له */
    if (!roOnly && CORE.TOMB && CORE.TOMB[kind] && vv.deleted !== true) vv.deleted = false;
    if (kind === 'recs' && vv.deleted !== true && vv.quick && typeof recIsQuick === 'function' && !recIsQuick(v)) vv.quick = 0;
    return vv;
  },
  putOne: function(it){
    var ref = DB.col(FB.colOf(it.kind)).doc(String(it.id));
    if (it.v === null) return ref.delete();
    return ref.set(FB.clean(FB.live(it.kind, Object.assign({}, it.v, { _by:STATE.meta.uid, _at:Date.now() }))), { merge:true });
  },
  /* ═══ الرفضُ يُصالَح قبل أن يُعَدَّ رفضًا ═══
     وثيقةٌ وصلت الخادمَ ثم انقطعت الشبكةُ قبل الجواب تبقى في الطابور وتُعاد
     — فإن كانت قاعدتُها «إضافةٌ لا تعديل» رُفضت الإعادةُ ثلاثًا وعُزلت،
     وامتلأت شاشةُ المزامنة أعطالًا لأثرٍ موجودٍ أصلًا. فعند رفضِ الصلاحية
     تُقرأ الوثيقةُ مرةً: إن كانت موجودةً ومحتواها هو محتوانا (عدا ختمِ
     الدفعة) فقد وصلت — تُعَدُّ ناجحةً وتُسقَط من الطابور بلا صخب. قراءةٌ
     واحدةٌ لكلِّ رفضٍ أرخصُ من ثلاث إعاداتٍ وعزلٍ ومكالمة. */
  sameDoc: function(mine, theirs){
    if (!mine || !theirs) return false;
    var skip = { _at:1, _by:1 };
    var ks = Object.keys(mine).filter(function(k){ return !skip[k]; });
    for (var i = 0; i < ks.length; i++){
      var k = ks[i];
      if (JSON.stringify(FB.clean(mine[k])) !== JSON.stringify(FB.clean(theirs[k]))) return false;
    }
    return true;
  },
  reconcile: function(it, e){
    var msg = String((e && (e.message || e.code)) || e);
    if (!/permission|PERMISSION_DENIED/i.test(msg) || it.v === null) return Promise.resolve(false);
    var ref = DB.col(FB.colOf(it.kind)).doc(String(it.id));
    return ref.get().then(function(doc){
      FB.readCount = (FB.readCount || 0) + doc.size;
      return !!(doc && doc.exists && FB.sameDoc(it.v, doc.data() || {}));
    }).catch(function(){ return false; });
  },
  /* يُرفَع كلٌّ على حدة: يُرجِع ما نجح وما فشل بسببه — وما رُفض وهو واصلٌ يُعَدُّ ناجحًا */
  /* ═══ نبضةُ التغيير (V17.26) ═══
     السحبُ الدوريُّ كلَّ عشر دقائق يُبقي الجهازَ يجهل ما تغيّر تسعَ دقائقَ
     وخمسين ثانيةً في المتوسط، وتقصيرُه إلى دقيقةٍ يعني ثمانيَ قراءاتٍ في
     الدقيقة لكلِّ جهازٍ ولو لم يتغيّر شيء (كلُّ استعلامٍ يُحاسَب بقراءةٍ على
     الأقلّ) — أي ستّون ألفَ قراءةٍ في اليوم تتجاوز الحصةَ المجانية. فصار
     الحلُّ نبضةً: بعد كلِّ رفعٍ ناجحٍ يكتب الجهازُ في وثيقةٍ واحدةٍ
     settings/pulse أيَّ مجموعاتٍ تغيّرت ومتى — كتابةٌ واحدةٌ مهما كبرت
     الدفعة. وكلُّ جهازٍ يُنصِت لهذه الوثيقة وحدَها: لا تكلّف شيئًا وهي
     ساكنة، وحين تتغيّر يسحب الجهازُ فارقَ ما تغيّر فقط. فالطزاجةُ ثوانٍ،
     والكلفةُ بقدر التغيير الحقيقيّ، والسحبُ الدوريُّ يبقى شبكةَ أمانٍ خلفها. */
  pulse: function(kinds){
    if (!FB.ready || !FB.db || !kinds || !kinds.length) return Promise.resolve();
    var now = Date.now(), doc = { at:now, by:STATE.meta.uid || '', _by:STATE.meta.uid || '', _at:now };
    kinds.forEach(function(k){ doc[FB.colOf(k)] = now; });
    return DB.col('settings').doc('pulse').set(doc, { merge:true }).catch(function(e){ softErr('إشعار التغيير', e, ''); });
  },
  pushEach: function(batch){
    var ok = [], failed = [], healed = 0;
    return batch.reduce(function(p, it){
      return p.then(function(){
        /* انفجارٌ متزامنٌ في بناء المرجع كان يُسقِط السلسلةَ كلَّها — يُحوَّل رفضًا لهذه الوثيقة وحدَها */
        return Promise.resolve().then(function(){ return FB.putOne(it); }).then(function(){ ok.push(it); })
          .catch(function(e){
            return FB.reconcile(it, e).then(function(same){
              if (same){ ok.push(it); healed++; return; }
              failed.push({ it:it, msg:String((e && (e.message || e.code)) || e).slice(0, 160) });
            });
          });
      });
    }, Promise.resolve()).then(function(){
      if (healed) logEventQuiet('صُولح ' + healed + ' وثيقةً كانت واصلةً وأُعيدت');
      return { ok:ok, failed:failed, healed:healed };
    });
  },
  push: function(batch){
    if (!FB.ready) return Promise.reject(new Error('not-ready'));
    var w = DB.batch();
    batch.forEach(function(it){
      /* لكلِّ نوعٍ مجموعتُه: كانت سبعةُ أنواعٍ تسقط في «misc» واحدةٍ فتختلط،
         ولا تُستعلَم بمفردها، ولا تُحكَم بقاعدةِ وصولٍ خاصةٍ بها. */
      var col = { recs:'recs', inss:'inss', tasks:'tasks', moves:'inventory',
                  buys:'purchases', cfg:'settings', users:'users',
                  evlog:'events', diss:'dismantles', newsites:'newsites',
                  coreqs:'coreqs', fixreqs:'fixreqs', bugs:'bugs', sites:'sites', ships:'ships',
                  vehicles:'vehicles', vehAsn:'vehAsn', accounts:'accounts', photos:'photos',
                  stats:'stats', teams:'teams', baseline:'baseline',
                  changes:'changes', hse:'hse', ncr:'ncr', ipc:'ipc', bonus:'bonus',
                  workReqs:'workreqs', maints:'maints', steps:'steps', pending:'pending', provision:'provision', att:'att', ghcfg:'ghcfg', presence:'presence' }[it.kind];
      if (!col){ console.warn('نوعٌ بلا مجموعة: ' + it.kind); col = 'misc'; }
      var ref = DB.col(col).doc(String(it.id));
      if (it.v === null) w.delete(ref);
      else w.set(ref, FB.clean(FB.live(it.kind, Object.assign({}, it.v, { _by:STATE.meta.uid, _at:Date.now() }))), { merge:true });   /* (V28.3) */
    });
    return w.commit();
  },

  /* ── جسرُ النسخة العاملة: يُقرأ ما كُتب بأسمائها القديمة ── */
  pullLegacy: function(){
    if (!FB.ready || !FB.db) return Promise.resolve(0);
    var got = 0;
    var MAP = {
      srvorders: function(id, v){
        /* أمرُ الخدمة القديم: مسحٌ أو تركيبٌ بحسب نوعه */
        if (v.kind === 'install' || v.type === 'تركيب'){
          if (!STATE.inss[v.site || id]) STATE.inss[v.site || id] = v;
        } else if (!STATE.recs[v.site || id]) STATE.recs[v.site || id] = v;
        got++;
      },
      events: function(id, v){ STATE.events.push(v); got++; },
      hb:     function(id, v){ STATE.hb = STATE.hb || {}; STATE.hb[id] = v; got++; },
      hbev:   function(id, v){ STATE.hb = STATE.hb || {}; STATE.hb[id] = v; got++; }
    };
    return Promise.all(Object.keys(MAP).map(function(c){
      return DB.col(c).limit(2000).get().then(function(snap){
        FB.readCount = (FB.readCount || 0) + snap.size;
        snap.forEach(function(doc){
          try { MAP[c](doc.id, doc.data()); }
          catch (e){ softErr('تحويل سجل قديم — ' + c, e); }
        });
      }).catch(function(e){ softErr('قراءة المجموعة القديمة — ' + c, e); });
    })).then(function(){
      if (got){
        statBump();
        CORE.saveSoon();
        lsSet('nsk14.legacy', '1');
        logEvent('استيراد من النسخة العاملة — ' + nm(got) + ' سجلًّا');
      }
      return got;
    });
  },

  legacyDone: function(){
    try{ return localStorage.getItem('nsk14.legacy') === '1'; }catch(e){ return false; }
  },

  /* سحبٌ فارقيّ: لا يُقرَأ إلا ما تغيّر بعد آخر مزامنة. والحقلُ `_at` يُكتَب
     مع كلِّ وثيقةٍ في الدفع، فالفرزُ عليه لا يحتاج فهرسًا مركّبًا.
     والميدانُ لا يقرأ إلا ما يخصّه: الفنيُّ لا يحتاج سجلَّ ألفٍ وسبعمئةِ موقع. */
  /* ═══ الثوابتُ والمراجعُ — مرةً عند الدخول وعند «مزامنة الآن» ═══
     كانت في `pull(0)` تُقرأ كلَّ دقيقةٍ على كلِّ جهاز: الإعداداتُ العشرون
     والمخزونُ والمشترياتُ والسياراتُ والشحناتُ وطبقةُ النقاط — آلافُ القراءات
     في الساعة لأشياءَ لا تتغيّر. ثم أُزيل الاستدعاءُ في V16.6 فماتت كلُّها:
     لا إعداداتٌ ولا طبقةٌ ولا مخزونٌ يصل جهازًا جديدًا. فصارت تُقرأ مرةً عند
     الدخول ومرةً عند الطلب، وطبقةُ النقاط بمؤشِّرٍ: ما تغيّر لا ما كُتب. */
  /* ═══ الثوابتُ ثمنُها أربعةٌ وثلاثون استعلامًا ═══
     `pullStatic` تقرأ الإعداداتِ والقوائمَ والنقاطَ — أربعةً وثلاثين استعلامًا،
     وكلُّ استعلامٍ يُحاسَب ولو عاد فارغًا. وكانت كلُّ عودةٍ إلى التطبيق (تبديلُ
     تطبيقٍ على الجوّال، إظهارُ تبويبٍ على الحاسوب) ترفع SYNC.pullAsk فتُجلَب كلُّها
     من جديد: فنيٌّ يبدّل التطبيقَ ثلاثين مرةً في اليوم = ألفُ استعلامٍ بلا
     فائدة، وعشرون جهازًا = عشرون ألفًا. فصار لها حدٌّ زمنيٌّ: لا تتكرر قبل
     ربع ساعةٍ إلا بأمرٍ صريح (تصفيرٌ، أو «زامِن الجميع»، أو زرُّ المزامنة). */
  pullStatic: function(force){
    if (!FB.ready || !FB.db) return Promise.resolve(false);
    var now = Date.now();
    if (!force && FB._staticAt && now - FB._staticAt < 900000) return Promise.resolve(false);
    FB._staticAt = now;
    /* خطأٌ متزامنٌ هنا (قاعدةٌ لم تُهيَّأ) كان يُسقِط سلسلةَ الدورة كلَّها ويترك
       SYNC.busy مرفوعًا — فتتوقف المزامنةُ لبقية الجلسة بلا صوت */
    try { return FB._pullStatic(); } catch (e){ softErr('قراءة الثوابت', e, ''); return Promise.resolve(false); }
  },
  _pullStatic: function(){
    /* العهدُ أوّلًا — قبل الثوابت وقبل أيِّ رفعٍ من الطابور */
    EPOCH_PENDING = true;
    /* شبكةٌ بطيئةٌ لا تحبس الطابورَ: ثمانِ ثوانٍ ثم يُرفَع ما عندنا */
    setTimeout(function(){ EPOCH_PENDING = false; }, 8000);
    var epochRead = DB.col('settings').doc('app').get().then(function(doc){
      FB.readCount = (FB.readCount || 0) + doc.size;
      var v = doc && doc.exists ? (doc.data() || {}) : {};
      if (v.epoch && epochApply(v.epoch)){ SYNC.pullAsk = true; FB._staticAt = 0; }
      if (v.syncAll) SYNC_ALL_SEEN = +v.syncAll || 0;   /* عند الدخول: تُضبَط العلامةُ بلا سحبٍ زائد */
      if (v.ver && typeof verChase === 'function') verChase(v.ver);
    }).catch(function(e){ softErr('قراءة العهد', e, ''); }).then(function(){ EPOCH_PENDING = false; });
    return epochRead.then(function(){ return FB.pullStatic2(); });
  },
  pullStatic2: function(){
    if (!FB.ready || !FB.db) return Promise.resolve(false);
    /* الميدانُ لا يقرأ ما لا يراه: المخزونُ والمشترياتُ والشحناتُ وطلباتُ الشركات
       والتصويبُ والتغييراتُ والملاحظاتُ والورشةُ للمكتب وحده — يومٌ بمئةٍ وخمسين
       جهازًا لا يدفع سبعةَ آلاف قراءةٍ لأشياءَ لا تُعرَض */
    var office = rankOf(ROLE) >= rankOf('supervisor') || effRole(ROLE) === 'exec';
    return Promise.resolve().then(function(){
      /* المستخدمون: للمهندس وحده — وهم عشراتٌ لا آلاف */
      /* والسحبُ الأوّلُ كذلك: من رتبتُه فوق الأدنى يسحب ما يحقُّ له —
         والقاعدةُ تُسقِط ما لا يحقُّ فلا يُرى ما ليس له. */
      /* الحساباتُ والمعلَّقةُ والفرقُ تصل بالإنصات الحيِّ (liveSmall) لمن يحقُّ له —
         فلا تُقرأ هنا ثانيةً: مئتا وثيقةٍ في كلِّ دخولٍ كانت تُدفَع مرتين */
      if (false && rankOf(ROLE) > 30){
        DB.col('users').limit(300).get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          if (!STATE.users) STATE.users = {};
          sn.forEach(function(d){ STATE.users[d.id] = d.data(); });
          FB.readCount = (FB.readCount || 0) + sn.size;
        }).catch(function(e){ softErr('سحب المستخدمين', e, 'تعذّر سحبُ الحسابات — الشاشةُ قد تظهر ناقصة'); });
        /* والمعلَّقةُ كذلك: من أُنشئ على جهازٍ ولم يُفعَّل يُرى في كلِّ جهاز */
        DB.col('pending').limit(200).get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          STATE.pending = STATE.pending || {};
          sn.forEach(function(d){
            STATE.pending[d.id] = d.data();
            if (!STATE.users[d.id]) STATE.users[d.id] = Object.assign({ pending:true }, d.data());
          });
          if (sn.size && CUR === 'users') render(1);
        }).catch(function(e){ softErr('سحب الحسابات المعلَّقة', e, ''); });
      }
      /* الفرقُ الفرعيةُ (نسب الأنصبة) كانت تُكتب بـ`CORE.dirty('teams',…)` ولا
         تُقرأ هنا أبدًا — فكلُّ فريقٍ يُنشأ يضيع بإعادة الفتح أو على جهازٍ آخر،
         ومن أنشأ فريقًا ظنَّ أنه محفوظ. */
      false && DB.col('teams').limit(500).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(Object.assign({ id:d.id }, d.data())); });
        TEAMS.length = 0;
        arr.forEach(function(x){ TEAMS.push(x); });
        FB.readCount = (FB.readCount || 0) + sn.size;
      }).catch(function(e){ softErr('سحب الفرق الفرعية', e, 'تعذّر سحبُ الفرق الفرعية — قد تظهر فارغة'); });
      /* عدّاد ترقيم الطلبات (SR/IR/UR/MR/DR/CR/AR): وثيقةٌ مفردةٌ بحقولٍ رقمية —
         تُقرأ بنفس الأسلوب الآمن الذي أصلح فرق الأنصبة، لا بمصفوفةٍ تفسدها
         Firestore حين تتحول كائنًا بمفاتيح رقمية. */
      DB.col('settings').doc('reqSeq').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){
          var v = doc.data();
          /* نقلُ العدّادات مرةً واحدة: التركيبُ كان DR فصار IR، والفكُّ كان
             PR فصار UR، والصرفُ كان IR فصار DR — يُقرأ القديمُ ويُبدأ من
             حيث انتهى، فلا يُولَد IR-0001 وقد سبقه DR-0001 تركيبًا. */
          ['SR','IR','UR','CR','AR','MR','DR'].forEach(function(k){
            if (typeof v[k] === 'number' && v[k] > REQSEQ[k]) REQSEQ[k] = v[k];
          });
          /* ثم يُنقَل العدّادُ القديم: الرمزُ الذي كان يُستعمَل للمعنى نفسِه
             يرفع الجديدَ إلى حيث انتهى — فلا يُولَد IR-0001 تركيبًا وقد سبقه
             DR-0001 تركيبًا في السجل القديم. */
          [['IR','DR'], ['UR','PR'], ['DR','IR']].forEach(function(pr){
            var b = cfgN(v[pr[1]]) || 0;
            if (b > REQSEQ[pr[0]]) REQSEQ[pr[0]] = b;
          });
        }
      }).catch(function(e){ softErr('سحب ترقيم الطلبات', e, 'تعذّر سحبُ آخر رقم طلب — قد يتكرّر الترقيم'); });
      /* الفكُّ والورشةُ (تهيئة وتجميع) كانا يُكتَبان في 'dismantles' و'inventory'
         ولا يُقرآن هنا قطّ — فنقاطُ الفني في هاتين المرحلتين كانت صحيحةً على
         جهاز من سجّلها فقط، وصفرًا على أي جهازٍ آخر يفتح تقرير الأداء. */
      DB.col('dismantles').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.diss) STATE.diss = {};
        sn.forEach(function(d){ STATE.diss[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب سجلات الفك', e, 'تعذّر سحبُ سجلات الفك — أداءُ الفك قد يظهر ناقصًا'); });
      office && DB.col('inventory').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.moves = [];
        sn.forEach(function(d){ STATE.moves.push(d.data()); });
      }).catch(function(e){ softErr('سحب دفتر الحركة', e, 'تعذّر سحبُ دفتر الحركة — أداءُ التهيئة والتجميع قد يظهر ناقصًا'); });
      /* نقاطُ الزيادة اليدوية: سجلٌّ صغيرٌ لا مصفوفةٌ عملاقة — يُقرأ كاملًا كلَّ مرة */
      DB.col('bonus').limit(2000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.bonus = {};
        sn.forEach(function(d){ STATE.bonus[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب نقاط الزيادة', e, 'تعذّر سحبُ نقاط الزيادة — قد تظهر ناقصة'); });
      office && DB.col('workreqs').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.workReqs = {};
        sn.forEach(function(d){ STATE.workReqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات الورشة', e, 'تعذّر سحبُ طلبات التهيئة والتجميع'); });
      /* الفرقُ والفنيون والكتالوج: نفس الباغ بالضبط، ولم يُصلَح رغم اكتشافه —
         تُكتَب في مجموعة 'settings' وتُقرأ منها 'points' و'reqSeq' فقط.
         فكلُّ فريقٍ أو موظفٍ يُضاف من صفحة «الفرق»، وكلُّ صنفٍ يُعدَّل سعرُه
         من «القطع والأسعار»، يبقى صحيحًا على من كتبه وحده. وبما أن STATE.X
         مصفوفةٌ تتحول كائنًا بمفاتيح رقمية عند الكتابة (Object.assign على
         مصفوفة)، يُعاد بناؤها بترتيب المفاتيح لا تُقرأ ككائن. */
      var arrFromDoc = function(v){
        var ks = Object.keys(v || {}).filter(function(k){ return /^\d+$/.test(k); });
        ks.sort(function(a,b){ return (+a) - (+b); });
        return ks.map(function(k){ return v[k]; });
      };
      DB.col('settings').doc('crews').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.crews = arr; }
      }).catch(function(e){ softErr('سحب الفرق', e, 'تعذّر سحبُ الفرق — قد تظهر بذورها الأصلية فقط'); });
      /* V15.35: قائمةُ الفنيين تُشتقُّ من الحسابات — الوثيقةُ القديمةُ لا
         تُقرأ، وتُترَك حتى يمسحها زرُّ التنظيف من شاشة الحسابات. */
      DB.col('settings').doc('techs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ /* موروثةٌ — تُتجاهَل */ }
      }).catch(function(e){ softErr('سحب الفنيين', e, 'تعذّر سحبُ الفنيين — قد يظهر طاقمٌ ناقص'); });
      DB.col('settings').doc('items').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.items = arr; }
      }).catch(function(e){ softErr('سحب الكتالوج', e, 'تعذّر سحبُ الكتالوج — قد تظهر أصنافه الأصلية فقط'); });
      DB.col('settings').doc('crTime').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.crTime = doc.data();
      }).catch(function(e){ softErr('سحب مواعيد التقارير', e, 'تعذّر سحبُ مواعيد التقارير الدورية'); });
      DB.col('settings').doc('jobs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.jobs = arr; }
      }).catch(function(e){ softErr('سحب الوظائف', e, 'تعذّر سحبُ الوظائف — قد تظهر بذورها الأصلية فقط'); });
      DB.col('settings').doc('vehKinds').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.vehKinds = arr; }
      }).catch(function(e){ softErr('سحب أنواع السيارات', e, 'تعذّر سحبُ أنواع السيارات'); });
      DB.col('settings').doc('lessons').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.lessons = arr; }
      }).catch(function(e){ softErr('سحب سجل الدروس', e, 'تعذّر سحبُ سجل الدروس'); });
      DB.col('settings').doc('escRules').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.escRules = arr; }
      }).catch(function(e){ softErr('سحب قواعد التصعيد', e, 'تعذّر سحبُ قواعد التصعيد'); });
      DB.col('settings').doc('raci').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.raci = arr; }
      }).catch(function(e){ softErr('سحب مصفوفة المسؤوليات', e, 'تعذّر سحبُ مصفوفة RACI'); });
      /* سجلُّ الصور يُسحَب: بدونه يبدأ الترقيمُ من واحدٍ في كلِّ جهازٍ فتُكتَب
         صورتان باسمٍ واحدٍ على الدرايف. */
      /* ═══ فارقيٌّ لا كاملٌ في كلِّ إقلاع (V17.8) ═══
         كان يُسحَب سجلُّ الصور كلُّه عند كلِّ فتحٍ للتطبيق: ستُّمئةٍ وتسعٌ
         وستون قراءةً اليومَ، وآلافٌ في الموسم — لكلِّ جهازٍ في كلِّ مرة.
         وهو لا يُراد لذاته بل لمعرفة آخر رقمٍ لكلِّ نقطةٍ فلا يتكرّر اسمُ
         صورة. والسجلُّ محفوظٌ محليًّا أصلًا، فلا يلزم إلا الجديدُ منذ آخر
         سحبة. والسحبةُ الباردةُ (أوّلُ مرةٍ على الجهاز) محدودةٌ بألفٍ
         وخمسمئةٍ مرتَّبةً بالأحدث — وهي التي تحمل أرقامَ اليوم. */
      readDelta('photos', 'photos', 1500);
      /* مفتاحُ التشغيل: يكتبه مديرُ المشروع، ويقرؤه من يُنشئ الحساباتِ ويُعيد
         الكلمات — المشرفُ فما فوق والإدارةُ العليا — فلا يُرسَل أحدٌ إلى GitHub */
      /* (V33.0) كما تسمح القواعدُ حرفًا: مديرُ المشروع والإدارةُ العليا — كان المشرفُ والمهندسُ يطلبانه فتُرفَض القراءةُ ويُسجَّل عطل */
      if (effRole(ROLE) === 'admin' || effRole(ROLE) === 'exec'){
        DB.col('ghcfg').doc('gh').get().then(function(doc){
          FB.readCount = (FB.readCount || 0) + doc.size;
          if (doc && doc.exists){ CFG.gh = doc.data() || {}; }
        }).catch(function(e){ softErr('سحب مفتاح التشغيل', e, ''); });
      }
      readDelta('maints', 'maints', 1000);
      /* آخرُ مئتَي خطوةٍ تكفي اللوحات — ولا تُثقِل الإقلاع */
      DB.col('steps').orderBy('at', 'desc').limit(200).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var L = []; sn.forEach(function(dd){ L.push(dd.data()); });
        if (L.length) STATE.steps = L;
        if (CUR === 'now' || CUR === 'over') render(1);
      }).catch(function(e){ softErr('سحب سجل ما تمّ', e, ''); });
      DB.col('settings').doc('coliaison').get().then(function(doc){ if (doc && doc.exists) CFG.coliaison = Object.assign({}, doc.data()); }).catch(function(e){ softErr('سحب ضباط اتصال الشركات', e, ''); });   /* (V28.5) */
      DB.col('settings').doc('cotel').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.cotel = Object.assign({}, doc.data());
      }).catch(function(e){ softErr('سحب دفتر جوالات الشركات', e, 'تعذّر سحبُ جوالات الشركات — أدخلها أو زامِن'); });
      DB.col('settings').doc('miles').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.mileDates = arr; }
      }).catch(function(e){ softErr('سحب مواعيد المعالم', e, 'تعذّر سحبُ مواعيد المعالم — تُشتقّ من المواعيد'); });
      /* البلاغات: من يُصلح يقرأ الكلَّ — وغيرُه لا يقرأ المجموعةَ (القاعدةُ تمنع)
         فيبقى عنده ما كتبه في جهازه */
      (function(){
        var col = DB.col('bugs');
        var q = rankOf(effRole(ROLE)) >= rankOf('engineer')
          ? col.orderBy('at', 'desc').limit(200)
          : col.where('uid', '==', myUid()).limit(50);
        q.get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          var B = {}; sn.forEach(function(dd){ B[dd.id] = dd.data(); }); STATE.bugs = B; render(1);
        }).catch(function(e){ softErr('سحب البلاغات', e, ''); });
      })();
      DB.col('settings').doc('trials').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var k = doc.data() || {}; if (Array.isArray(k.rows)) STATE.trials = { rows:k.rows, inCost:!!k.inCost, at:k.at, by:k.by }; }
      }).catch(function(e){ softErr('سحب دفتر التجارب', e, ''); });
      DB.col('settings').doc('wtask').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var k = doc.data() || {}; if (Array.isArray(k.rows)) STATE.wtask = { rows:k.rows, at:k.at, by:k.by, meetAt:k.meetAt || 0, meetBy:k.meetBy || '' }; }
      }).catch(function(e){ softErr('سحب المهام الأسبوعية', e, ''); });
      DB.col('settings').doc('wbs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var w = doc.data() || {}; if (Array.isArray(w.rows)) STATE.wbs = { rows:w.rows, keys:w.keys || [], at:w.at, by:w.by }; }
      }).catch(function(e){ softErr('سحب جدول المتابعة', e, ''); });
      DB.col('settings').doc('risks').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.risks = arr; }
      }).catch(function(e){ softErr('سحب سجل المخاطر', e, 'تعذّر سحبُ سجل المخاطر — قد يظهر بالبذرة'); });
      DB.col('settings').doc('handSeq').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var v = doc.data();
          if (typeof v.n === 'number' && v.n > HAND_SEQ) HAND_SEQ = v.n; }
      }).catch(function(e){ softErr('سحب ترقيم محاضر التسليم', e, 'تعذّر سحبُ آخر رقم محضر — قد يتكرّر الترقيم'); });
      DB.col('settings').doc('patterns').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.patterns = arr; }
      }).catch(function(e){ softErr('سحب أنماط القطع', e, 'تعذّر سحبُ أنماط القطع — قد تظهر ناقصة'); });
      DB.col('settings').doc('types').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists && Object.keys(doc.data()).length){ STATE.types = doc.data(); typesList(); }
      }).catch(function(e){ softErr('سحب أنواع المواقع', e, 'تعذّر سحبُ أنواع المواقع'); });
      DB.col('settings').doc('mxExtra').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) CFG.mxExtra = arr; }
      }).catch(function(e){ softErr('سحب التركيبات المُعلَنة', e, 'تعذّر سحبُ التركيبات المُعلَنة قبل وصول الموقع'); });
      /* الصلاحياتُ المخصَّصة: تُطبَّق فوق ROLES الافتراضية لا تستبدلها —
         فدورٌ لم يُخصَّص له شيءٌ يبقى على قيمه الأصلية. */
      /* مصفوفةُ الصلاحيات: ما تقبله القاعدةُ لكلِّ دور — تُعرَض بها الشاشة */
      DB.col('settings').doc('perms').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.perms = doc.data();
        PM_AT = Date.now();
      }).catch(function(e){ softErr('سحب مصفوفة الصلاحيات', e, ''); });
      /* الأدوارُ المخصَّصةُ أوّلًا ثم القدراتُ فوقها — أيًّا كان ترتيبُ وصولهما */
      DB.col('settings').doc('roles').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.roles = doc.data();
        rolesApply();
      }).catch(function(e){ softErr('سحب الأدوار المخصَّصة', e, ''); });
      DB.col('settings').doc('roleCaps').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (!doc || !doc.exists) return;
        CFG.roleCaps = doc.data();
        rolesApply();
      }).catch(function(e){ softErr('سحب الصلاحيات المخصَّصة', e, 'تعذّر سحبُ تعديلات الصلاحيات — قد تظهر افتراضيةً'); });

      /* بقيةُ المجموعات المكتوبة ولا تُقرأ قط — نفس الباغ في أحد عشر
         موضعًا آخر، اكتُشفت في مراجعةٍ شاملة بعد V14.79/V14.82.
         كلٌّ منها وثيقةٌ واحدةٌ لكلِّ سجلٍّ (لا مصفوفةٌ مجمَّعة) فتُقرأ
         مباشرةً بمعرِّفها. */
      var sAt = (STATE.meta.pullAt || (STATE.meta.pullAt = {})), sSince = (sAt.sites || 0) - 120000, sStart = Date.now();
      var sq = DB.col('sites'); if (sSince > 0) sq = sq.where('_at', '>', sSince);
      sq.limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        sAt.sites = sStart;
        STATE.siteOv = STATE.siteOv || {};
        sn.forEach(function(d){ STATE.siteOv[d.id] = Object.assign({}, STATE.siteOv[d.id] || {}, d.data()); });
        /* المخفيُّ يُزال من القائمة هنا — وقبل وصول القاعدة من الحفظ المحليّ */
        var all = STATE.sites.concat(STATE.hiddenSites || []);
        STATE.sites = all; siteOvApply();
        CORE.saveSoon(); statBump();
      }).catch(function(e){ softErr('سحب تعديلات المواقع', e, 'تعذّر سحبُ تعديلات المواقع (العناوين والتصحيحات)'); });

      office && DB.col('purchases').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.buys) STATE.buys = {};
        sn.forEach(function(d){ STATE.buys[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب المشتريات', e, 'تعذّر سحبُ دفتر المشتريات'); });

      DB.col('vehicles').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.vehicles) STATE.vehicles = {};
        sn.forEach(function(d){ STATE.vehicles[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب السيارات', e, 'تعذّر سحبُ سجل السيارات'); });

      DB.col('vehAsn').limit(2000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.vehAsn) STATE.vehAsn = {};
        sn.forEach(function(d){ STATE.vehAsn[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب إسناد السيارات', e, 'تعذّر سحبُ عهدة السيارات'); });

      office && DB.col('ships').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.ships) STATE.ships = {};
        sn.forEach(function(d){ STATE.ships[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب الشحنات', e, 'تعذّر سحبُ سجل الشحنات'); });

      office && DB.col('coreqs').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.coreqs) STATE.coreqs = {};
        sn.forEach(function(d){ STATE.coreqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات الشركات', e, 'تعذّر سحبُ طلبات إضافة الشركات'); });

      office && DB.col('fixreqs').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.fixreqs) STATE.fixreqs = {};
        sn.forEach(function(d){ STATE.fixreqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات التصويب', e, 'تعذّر سحبُ طلبات تصويب البيانات'); });

      office && DB.col('newsites').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.newsites) STATE.newsites = {};
        sn.forEach(function(d){ STATE.newsites[d.id] = d.data(); });
        /* ═══ الجديدُ يعود إلى السجل لا إلى رفٍّ جانبيّ (V17.46) ═══
           كانت النقطةُ تُدفَع إلى STATE.sites في الجلسة التي أُنشئت فيها ثم
           تُكتَب في newsites؛ فإذا أُعيد تحميلُ التطبيق عادت المجموعةُ إلى
           STATE.newsites وحدَها — فتختفي النقطةُ من الخريطة والقوائم وهي في
           القاعدة سليمة، ويُظنُّ أنها ضاعت. صارت تُدمَج في السجل عند كلِّ
           إقلاع: ما لم يكن فيه، ولا يُكرَّر ما هو فيه. */
        /* (V36.7) بلاغُ المالك: «المسح للنقاط لو مسح من عند مهندس بترجع تاني» — النقطةُ المضافةُ المحذوفة تُنقَل إلى «المخفية» فلا تكون
           في STATE.sites، فكان هذا الدمجُ يراها جديدةً ويعيدها إلى القائمة (والإخفاءُ في تجاوزها لا في وثيقتها). صار المخفيُّ معروفًا هنا،
           وتجاوزُ hidden يُبقيها مخفية. */
        var have = {}; (STATE.sites || []).forEach(function(x){ have[x.id] = 1; }); (STATE.hiddenSites || []).forEach(function(x){ have[x.id] = 1; });
        var add = 0;
        Object.keys(STATE.newsites).forEach(function(k){
          var v = STATE.newsites[k];
          var ovh = v && v.id && (STATE.siteOv || {})[v.id]; if (ovh && ovh.hidden) return;   /* محذوفةٌ بالإخفاء — لا تعود */
          if (v && v.id && have[v.id]){   /* (V22.9) ما دُمج من قبل يأخذ تعديلَ السحابة: الموقعُ والاسمُ والإخفاء — وإلا بقيت النقطةُ حيث كانت */
            var ex = siteFind(v.id);
            if (ex){
              if (v.hidden || v.deleted){ STATE.sites = STATE.sites.filter(function(x){ return x.id !== v.id; }); add++; return; }   /* (V25.5) والمحذوفُ نهائيًّا */
              var ovm = (STATE.siteOv || {})[v.id];   /* (V32.2) موضعٌ حرّكه أحدٌ (تجاوز) يغلب إحداثيةَ الوثيقة */
              if (!(ovm && +ovm.lat && +ovm.lng) && +v.lat && +v.lng && (+ex.lat !== +v.lat || +ex.lng !== +v.lng)){ ex.lat = +v.lat; ex.lng = +v.lng; add++; }
              if (v.name && ex.name !== v.name){ ex.name = v.name; add++; }
            }
            return;
          }
          if (!v || !v.id || v.hidden || v.deleted || have[v.id] || !(+v.lat) || !(+v.lng)) return;   /* المخفيُّ والمحذوفُ لا يُدمَجان (V22.2، V25.5) */
          var ovn = (STATE.siteOv || {})[v.id]; if (ovn) v = Object.assign({}, v, ovn);   /* تجاوزُ المكتب (التصنيف…) فوق الوثيقة (V23.0) */
          STATE.sites.push(v); have[v.id] = 1; add++;
        });
        if (add){ SITE_IX = null; SITE_TOK = null; statBump(); render(1); if (typeof mapPaint === 'function') mapPaint(); }
      }).catch(function(e){ softErr('سحب المواقع الجديدة', e, 'تعذّر سحبُ طلبات تسجيل مواقع جديدة'); });

      office && DB.col('changes').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        CHANGES.length = 0;
        arr.forEach(function(x){ CHANGES.push(x); });
      }).catch(function(e){ softErr('سحب ضبط التغيير', e, 'تعذّر سحبُ سجل طلبات التغيير'); });

      office && DB.col('ncr').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        NCRS.length = 0;
        arr.forEach(function(x){ NCRS.push(x); });
      }).catch(function(e){ softErr('سحب عدم المطابقة', e, 'تعذّر سحبُ سجل عدم المطابقة'); });

      DB.col('ipc').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        IPCS.length = 0;
        arr.forEach(function(x){ IPCS.push(x); });
      }).catch(function(e){ softErr('سحب المستخلصات', e, 'تعذّر سحبُ سجل المستخلصات'); });

      DB.col('hse').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        HSE.incidents.length = 0;
        HSE.lost = 0;
        arr.forEach(function(x){ HSE.incidents.push(x); HSE.lost += cfgN(x.lost); });
      }).catch(function(e){ softErr('سحب حوادث السلامة', e, 'تعذّر سحبُ سجل حوادث السلامة'); });

      DB.col('baseline').limit(200).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var latest = null;
        sn.forEach(function(d){
          var v = d.data();
          if (!latest || (v.ver || 0) > (latest.ver || 0)) latest = v;
        });
        if (latest) BASE = latest;
      }).catch(function(e){ softErr('سحب خط الأساس', e, 'تعذّر سحبُ خط الأساس المجمَّد'); });
      /* اللقطاتُ: ثلاثون وثيقةً تكفي اللوحةَ التاريخيةَ كلَّها */
      return DB.col('stats').orderBy('day', 'desc').limit(30).get()
        .then(function(sn){
          if (!STATE.stats) STATE.stats = {};
          sn.forEach(function(d){ STATE.stats[d.id] = d.data(); });
          FB.readCount = (FB.readCount || 0) + sn.size;
        }).catch(function(e){ softErr('سحب اللقطات اليومية', e, 'تعذّر سحبُ اللقطات — اللوحةُ التاريخيةُ قد تظهر خاليةً'); });
    }).then(function(){
      return DB.col('settings').doc('points').get();
    }).then(function(doc){
      if (doc && doc.exists){
        var v = doc.data();
        Object.keys(v).forEach(function(k){ if (k in CFG) CFG[k] = v[k]; });
      }
      STATE.meta.lastSync = Date.now();
      return true;
    }).catch(function(e){
      /* بلا إعداداتٍ يعمل النظامُ بأوزانٍ صفرٍ وحدودِ اعتمادٍ صفر — ويبدو
         سليمًا. فكلُّ رقمٍ بعدها خطأٌ لا يُشَكُّ فيه. */
      softErr('سحب الإعدادات', e, 'تعذّر جلبُ الإعدادات — الأوزانُ والحدودُ قد تكون غيرَ محدَّثة');
      return false;
    });
  }
};
/* ═══ بوابةُ البيانات (V31.5 — خطةُ التسليم، الوحدة ٣) ═══
   كلُّ حديثٍ مع القاعدة يمرّ من هنا — لا FB.db.collection في أيِّ مكانٍ آخر (جردُ الصحة يرفضه).
   الواجهةُ بشكل Firestore (collection/doc/where/orderBy/limit/get/set/batch): لنقل المنظومة إلى قاعدةٍ أخرى
   يُكتَب محوِّلٌ واحدٌ هنا يحاكي هذه الواجهة — ولا يُلمَس شيءٌ في الصفحات. */
/* (V32.0) وحدةُ التقارير والتصدير تملك حالتَها: scope/chk/secs/page/xlsAll/pptxTpl/repSide */
/* (V33.0) الترتيبُ العربيُّ بمرتّبٍ واحدٍ مخزَّن: localeCompare(…, 'ar') يبني مرتّبًا في كلِّ مقارنة — ترتيبُ ٢٢٠ اسمَ شركةٍ أخذ ٢٠٤ م.ث
   على جوالٍ مُبطّأ مقابل ٢ م.ث بالمرتّب المخزَّن، والنتيجةُ نفسُها حرفًا. ثلاثَ عشرةَ نقطةَ ترتيبٍ تستعمله (والقائمةُ عند الإقلاع منها). */
function arCmp(a, b){ return (arCmp.c || (arCmp.c = new Intl.Collator('ar'))).compare(String(a == null ? '' : a), String(b == null ? '' : b)); }
var EXP = {};
var DB = {
  ready: function(){ return !!(FB.ready && FB.db); },
  col:   function(name){ return FB.db.collection(name); },
  doc:   function(name, id){ return FB.db.collection(name).doc(id); },
  batch: function(){ return FB.db.batch(); },
  /* (V31.6، وضُيِّق في V31.8 بعد مراجعة الجودة) ذاكرةُ الرسمة الواحدة — وحدةُ البيانات، بندُ الأداء ١: الصفاتُ المشتقّةُ (حالةُ
     النقطة، قوائمُ المتابعة) تُحسَب مرةً داخل رسمِ الصفحة وحدَه — تُفتَح في أوّله وتُغلَق في آخره — ولا ذاكرةَ خارجه أبدًا.
     كانت تمتدّ إلى آخر المهمة المتزامنة، فمن كتب في الحالة مباشرةً (لا من CORE.set) ثم قرأ في المهمة نفسِها رأى حالةً قديمة. */
  memo: null,
  open: function(){ DB.memo = { life:{}, lists:{} }; },
  memoReset: function(){ DB.memo = null; }
};


/* ── اللقطةُ اليومية ─────────────────────────────────────────────────────
   لوحةُ الوزارة كانت تُبنى بقراءة كلِّ سجلٍّ في القاعدة. ومئةٌ وخمسون جهازًا
   يفعلون ذلك ثماني مراتٍ يوميًّا = مليونُ قراءةٍ والحدُّ خمسون ألفًا.
   فتُكتَب أعدادُ اليوم في وثيقةٍ واحدةٍ يقرؤها الجميع بقراءةٍ واحدة.
   وهي في الوقت نفسه سجلُّ التاريخ: يومٌ يومًا، لا يُعاد حسابُه ولا يُعدَّل. */
var ROLL_LAST = 0, ROLL_PUSH = 0;

/* (V26.1) يومُ التقارير يومُ مكة (توقيتٌ عالميٌّ +٣ ثابتًا، لا توقيتَ صيفي) — كان يومَ غرينتش في كلِّ التقارير: الزيارةُ المسجَّلةُ
   الساعةَ الواحدةَ ليلًا في منى كانت تُحسَب على اليوم السابق، فاختلفت أرقامُ الأمس واليوم بين ما رآه الميدانُ وما قالته التقارير. */
function dayKey(ts){ return new Date((+ts || Date.now()) + 10800000).toISOString().slice(0, 10); }

function rollupToday(force){
  var now = Date.now();
  if (!force && now - ROLL_LAST < 120000) return null;   /* مرةً كلَّ دقيقتين */
  ROLL_LAST = now;

  var day = dayKey(now), S = siteStats();
  var sv = 0, ins = 0, dis = 0, blocked = 0;
  Object.keys(STATE.recs).forEach(function(k){
    var r = STATE.recs[k];
    if (dayKey(r.at || r._at) !== day) return;
    if (svVisited(r)) sv++; if (svStuck(r)) blocked++;   /* (V32.6) الزيارةُ بأيِّ نتيجة؛ والمتعذّرُ منها للإيضاح */
  });
  Object.keys(STATE.inss).forEach(function(k){
    var r = STATE.inss[k];
    if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++;
  });
  Object.keys(STATE.diss || {}).forEach(function(k){
    var r = STATE.diss[k];
    if (dayKey(r.at) === day && r.status === 'تم الفك') dis++;
  });

  var doc = {
    day:day, at:now,
    total:S.total, surveyed:S.surveyed, installed:S.installed,
    daySurvey:sv, dayInstall:ins, dayDismantle:dis, dayBlocked:blocked,
    byZone:{}, pending:CORE.pending()
  };
  Object.keys(S.byKey).forEach(function(k){
    var z = k.split('|')[0];
    doc.byZone[z] = (doc.byZone[z] || 0) + S.byKey[k];
  });
  if (!STATE.stats) STATE.stats = {};
  STATE.stats[day] = doc;

  /* ═══ الحسابُ محليٌّ والكتابةُ من واحدٍ ═══
     كانت هذه السطورُ تكتب `stats/{اليوم}` من كلِّ جهازٍ كلَّ دقيقتين. وبمئةٍ
     وخمسين جهازًا: مئةٌ وثمانيةُ آلافِ كتابةٍ في اليوم على حصةٍ سقفُها عشرون
     ألفًا — يموت المشروعُ قبل الظهر.

     والأخطرُ أن الوثيقةَ واحدةٌ والكتابةُ آخرُها يفوز: كلُّ جهازٍ يكتب ما يراه
     هو. ففنيٌّ عنده سجلّاه يكتب «مسحُ اليوم = ٢» فوقَ ما كتبه المكتبُ «٣٤٠».
     فتعرض لوحةُ الوزارة آخرَ من زامن، لا حقيقةَ اليوم.

     والصوابُ أن الأرقامَ مشتقّةٌ لا مخزَّنة: كلُّ جهازٍ يحسبها من السجلات
     التي عنده. فلا يكتبها إلا جهازُ المكتب — الذي يملك الصورةَ كاملةً —
     ومرةً كلَّ ربع ساعةٍ لا كلَّ دقيقتين. */
  var mayWrite = (typeof may === 'function') && may('settings');
  if (mayWrite && (force || now - ROLL_PUSH > 900000)){
    ROLL_PUSH = now;
    CORE.dirty('stats', day, doc);
  }
  return doc;
}

/* التاريخُ: آخرُ ثلاثين يومًا مرتَّبةً — للوحة التاريخية والتقارير.
   الاسمُ `history` كان يصطدم بـ`window.history` في المتصفّح: هي في المواصفة
   قابلةٌ للاستبدال، وفي بعض المحرّكات غيرُ قابلة — فتبقى دالةُ المتصفّح مكانها
   ويسقط التاريخُ صامتًا، فتُعرَض لوحةُ التاريخ فارغةً ولا يُعرَف السبب. */
function statsHistory(days){
  var out = [], st = STATE.stats || {};
  Object.keys(st).sort().slice(-(days || 30)).forEach(function(k){ out.push(st[k]); });
  return out;
}

/* ── مؤشّر المزامنة في الشريط العلوي ── */
/* ═══ الأعطالُ الصامتة ═══
   سبعةٌ وثلاثون `catch` فارغةً في الملف. أكثرُها فحصُ توفُّرٍ مشروع: تخزينٌ
   محليٌّ يُمنَع في وضعٍ خاص، أو رسمٌ على لوحةٍ لا يدعمها المتصفّح — ولا حيلةَ
   للمستخدم فيها.

   لكن سبعةً منها كانت تبتلع أعطالًا تُغيّر ما يراه: سحبُ المستخدمين يفشل
   فتظهر الشاشةُ فارغةً بلا سبب، واللقطاتُ لا تصل فتُعرَض اللوحةُ التاريخيةُ
   خاليةً، والاستماعُ الحيُّ يموت فلا تصل المهامُّ الجديدة.

   وما لا يُقال لا يُصلَح. فصار يُسجَّل هنا محليًّا — لا يُرفَع ولا يُزعِج —
   ويُقرأ في شاشة المزامنة عند السؤال «لماذا لا تصل البيانات؟». وما يستطيع
   المستخدمُ فعلَ شيءٍ حياله يُقال له مرةً واحدةً لا كلَّ مرة. */

/* ═══ الاستماعُ الحيّ: ما يُكتَب في جهازٍ يُرى في الباقي ═══
   القاعدةُ خادمٌ مشتركٌ لا صندوقٌ في كلِّ جهاز — لكنَّ التطبيقَ كان يقرؤها
   مرةً واحدةً عند الفتح ثم لا يعود. فمن أنشأ حسابًا أو فريقًا أو غيّر دورًا
   في جهاز، لم يره الآخرون حتى يُغلقوا التطبيقَ ويفتحوه — فظُنَّ أن الحفظَ
   لم يقع، وأُنشئ الحسابُ مرتين.
     فصار يُنصَت للمجموعات الصغيرة إنصاتًا دائمًا: الحساباتُ والمعلَّقُ منها
   والفرقُ والإعدادات. وهي عشراتٌ لا آلاف، والإنصاتُ لا يُحاسَب إلا على ما
   تغيّر بعد القراءة الأولى — فلا يُثقِل الحصّة.
     أما الكبيرةُ — الزياراتُ والتركيباتُ والمهامُّ — فتُسحَب بالفارق كلَّ
   دقيقتين وعند العودة من الخلفية: كثيرةٌ ولا تحتمل إنصاتًا دائمًا. */
var LIVE_SMALL = [], LIVE_TICK = null;
/* الشاشاتُ التي تُعاد رسمُها حين يصل عملٌ جديد */
var LIVE_WORK_PAGES = ['mfu','over','exec','now','req','survey','svappr','qa','disp','maintForm','reg','mine','mywork','sites','dis','inst','pace','map','co','plan','perf','ipc'];
function liveSmallStop(){
  /* إلغاءُ إنصاتٍ مات لا يُبلَّغ عنه — لكنه يُسجَّل كي لا يُبتلَع صامتًا */
  LIVE_SMALL.forEach(function(f){
    try { f(); } catch (e){ if (typeof softErr === 'function') softErr('إغلاق إنصات', e, ''); }
  });
  LIVE_SMALL = [];
  liveTickStop();
}
function liveSmall(){
  if (!FB.ready || !FB.db) return;
  liveSmallStop();
  /* النبضةُ تُعاد مع إعادة الإنصات — مستمعٌ واحدٌ لا أكثر (V17.26) */
  pulseStop(); setTimeout(function(){ pulseWatch(); bridgeWatch(); }, 0);
  var watch = function(col, apply, cap, filt, filt2){
    try {
      var q = DB.col(col);
      /* طلباتُ الإنشاء: غيرُ المدير يُنصِت لما كتبه هو — فتُثبَت القاعدةُ
         على الشرط لا على كلِّ وثيقةٍ، ولا يرى كلماتٍ ليست له */
      if (filt) q = filt.length === 3 ? q.where(filt[0], filt[1], filt[2]) : q.where(filt[0], '==', filt[1]);
      if (filt2) q = q.where(filt2[0], filt2[1], filt2[2]);
      if (cap) q = q.limit(cap);
      LIVE_SMALL.push(q.onSnapshot(function(sn){
        var n = 0;
        sn.docChanges().forEach(function(ch){
          apply(ch.doc.id, ch.type === 'removed' ? null : ch.doc.data()); n++;
        });
        if (n && !(sn.metadata && sn.metadata.fromCache)){
          STATE.meta.lastSync = Date.now();
          statBump();
          if (CUR === 'users' || CUR === 'crews' || CUR === 'assignRole') render(1);
          else if (LIVE_WORK_PAGES.indexOf(CUR) > -1 && CUR !== 'map') render(1);
          else if (CUR === 'map' && typeof mapPaint === 'function') mapPaint();
        }
      }, function(e){ softErr('إنصات ' + col, e, ''); }));
    } catch (e){ softErr('إنصات ' + col, e, ''); }
  };
  /* الإنصاتُ لمن يرى غيرَه: كان للمهندس وحده — فالمشرفُ لا يرى فنيّيه
     ولا يعلم بمن أُضيف إلى فريقه. والقاعدةُ تحرس ما يُقرأ، فالإنصاتُ
     يُفتَح لمن فوق أدنى رتبةٍ ولا يُرجِع له إلا ما يحقُّ له. */
  /* (V36.7) تجاوزاتُ النقاط حيّة: حذفُ مهندسٍ لنقطة (أو استعادتُها أو تعديلُها) يصل كلَّ جهازٍ في ثوانٍ — كان يصلها مع «سحب الثوابت»
     الذي لا يتكرّر قبل ربع ساعة، فتبقى النقطةُ المحذوفةُ ظاهرةً عند غيره. يُنصَت لما تغيّر منذ قبيل آخر سحبٍ وحدَه. */
  watch('sites', function(id, v){ if (v) siteOvIncoming(id, v); }, 500, ['_at', '>', Math.max(0, ((STATE.meta.pullAt || {}).sites || Date.now()) - 600000)]);
  var scope = pullScope(), sig0 = scope.tree ? treeKeys().sig : '';
  try {
    LIVE_SMALL.push(DB.col('settings').doc('app').onSnapshot(function(doc){
      var dv = doc && doc.exists ? (doc.data() || {}) : {};
      if (dv.epoch && epochApply(dv.epoch)){ SYNC.pullAsk = true; FB._staticAt = 0; syncCycle(); }
      if (dv.syncAll) syncAllApply(dv.syncAll);
      if (dv.ver) verChase(dv.ver);
      verPublish();
    }, function(e){ softErr('إنصات النسخة', e, ''); }));
  } catch (e){ softErr('إنصات النسخة', e, ''); }
  /* جدولُ المتابعة: وثيقةٌ واحدةٌ يُنصِت إليها الجميع — فتحديثُ المكتب يصل الوزارةَ في ثوانٍ */
  try {
    LIVE_SMALL.push(DB.col('settings').doc('wtask').onSnapshot(function(doc){
      if (!doc || !doc.exists) return;
      var k = doc.data() || {}; if (!Array.isArray(k.rows)) return;
      STATE.wtask = { rows:k.rows, at:k.at, by:k.by, meetAt:k.meetAt || 0, meetBy:k.meetBy || '' }; CORE.saveSoon();
      wtRemind();
      if (CUR === 'wtask' && !document.querySelector('#content input:focus')) render(1);
    }, function(e){ softErr('إنصات المهام', e, ''); }));
    LIVE_SMALL.push(DB.col('settings').doc('wbs').onSnapshot(function(doc){
      if (!doc || !doc.exists) return;
      var w = doc.data() || {}; if (!Array.isArray(w.rows)) return;
      STATE.wbs = { rows:w.rows, keys:w.keys || [], at:w.at, by:w.by };
      CORE.saveSoon();
      if (CUR === 'wbs' && !document.querySelector('#content input:focus')) render(1);
    }, function(e){ softErr('إنصات جدول المتابعة', e, ''); }));
  } catch (e){ softErr('إنصات جدول المتابعة', e, ''); }
  /* ═══ وثيقتي أنا — لكلِّ دور ═══
     إنصاتُ «users» لمن رتبتُه فوق ثلاثين وحدَه، فالفنيُّ والمساعدُ والسائقُ
     والمشترياتُ والوزارةُ لا يصلهم تغييرُ دورهم إلا بخروجٍ ودخول — وهي أكثرُ
     الحالات وقوعًا (ترقيةُ فنيٍّ إلى مشرف). ووثيقةٌ واحدةٌ لا تكلّف شيئًا. */
  if (STATE.meta.uid && rankOf(ROLE) <= 30){
    try {
      LIVE_SMALL.push(DB.col('users').doc(STATE.meta.uid).onSnapshot(function(doc){
        if (!doc || !doc.exists) return;
        var mv = doc.data() || {};
        STATE.users = STATE.users || {}; STATE.users[STATE.meta.uid] = mv;
        roleWatch(mv);
      }, function(e){ softErr('إنصات حسابي', e, ''); }));
    } catch (e){ softErr('إنصات حسابي', e, ''); }
  }
  if (rankOf(ROLE) > 30){
    watch('users', function(id, v){
      STATE.users = STATE.users || {};
      if (v) STATE.users[id] = v; else delete STATE.users[id];
      /* دوري تغيّر من المكتب: يُطبَّق فورًا — كانت الوثيقةُ تُقرأ عند الدخول
         وحدَه، فيبقى المشرفُ مشرفًا على جهازه بعد ترقيته حتى يخرج ويدخل */
      if (v && id === STATE.meta.uid) roleWatch(v);
      /* شجرتي تغيّرت (وصل الناسُ بعد الدخول، أو نُقل أحد): يُعاد الإنصاتُ على
         الشجرة الجديدة ويُسحَب تاريخُ من انضمّ — مرةً، بعد سكونٍ قصير */
      if (scope.tree && treeKeys().sig !== sig0){
        clearTimeout(liveSmall._re);
        /* بصمةُ النطاق في pullDelta تكشف تبدُّلَ الشجرة وتسحب باردًا — والثوابتُ
           لم تتغيّر، فلا تُجلَب أربعةً وثلاثين استعلامًا لأن اسمَ موظفٍ عُدِّل */
        liveSmall._re = setTimeout(function(){ liveSmall(); syncCycle(); }, 1500);
      }
    }, 300);
    watch('provision', function(id, v){
      STATE.provision = STATE.provision || {};
      if (v){
        STATE.provision[id] = v;
        if (v.status === 'done' && STATE.users[id] && !uidLike(id)){
          /* الصفُّ المؤقتُ محليًّا يُزال؛ وإن كان قد كُتب في القاعدة باسم المستخدم مُحي منها */
          var wasCloud = !STATE.users[id].provisioning;
          delete STATE.users[id];
          if (wasCloud && may('users')) CORE.rm('users', id);
        }
      }
      else delete STATE.provision[id];
    }, 300, may('users') ? null : ['by', STATE.meta.name || '\u0000']);
    watch('pending', function(id, v){
      STATE.pending = STATE.pending || {};
      if (v){ STATE.pending[id] = v; if (!STATE.users[id]) STATE.users[id] = Object.assign({ pending:true }, v); }
      else { delete STATE.pending[id]; delete STATE.users[id]; }
    }, 200);
  }
  /* ═══ العملُ يصل من فوقُ لحظةً بلحظة ═══
     المشرفُ فما فوق (والإدارةُ العليا) يُنصِتون إلى ما يتغيّر في الزيارات
     والتركيبات والإسنادات والفكِّ والصيانة بعد بدء الجلسة — فيُرى الإسنادُ
     والاعتمادُ وإفادةُ الميدان في كلِّ جهازٍ في ثوانٍ، والإنصاتُ لا يكلّف إلا
     ما تغيّر لا ما يُستعلَم. والسحبةُ الدوريةُ تبقى شبكةَ أمانٍ بمؤشِّرها. */
  /* الميدانُ: ما كتبه هو — أربعةُ إنصاتاتٍ تسلّم اعتمادَ المكتب لحظةَ وقوعه، بدل
     أربعةِ استعلاماتٍ فارغةٍ كلَّ نصف ساعة */
  if (scope.mine && STATE.meta.uid){
    var tf = Date.now() - 60000;
    scope.cols.forEach(function(col){
      var key = PULL_COL[col] || col;
      watch(col, function(id, v){
        if (!STATE[key]) STATE[key] = {};
        if (v) CORE.applyDoc(key, id, v); else delete STATE[key][id];
      }, 200, ['_by', '==', STATE.meta.uid], ['_at', '>', tf]);
    });
  }
  if (rankOf(ROLE) >= rankOf('supervisor') || effRole(ROLE) === 'exec' || effRole(ROLE) === 'viewer'){
    var t0 = Date.now() - 60000, tk = scope.tree ? treeKeys() : null;
    ['recs','inss','tasks','dismantles','maints'].forEach(function(col){
      var key = PULL_COL[col] || col;
      var apply = function(id, v){
        if (!STATE[key]) STATE[key] = {};
        /* شاهدُ القبر يصل هنا **تحديثًا** لا حذفًا — الوثيقةُ قائمةٌ عليها
           {deleted:true}. فلولا applyDoc عاد ما مُحي من المكتب إلى شاشة
           المشرف والمهندس بعد لحظات، وهو العطلُ نفسُه الذي عولج في السحب. */
        if (v) CORE.applyDoc(key, id, v); else delete STATE[key][id];
      };
      /* الإدارةُ تُنصِت إلى الكلّ؛ ومن دونها إلى شجرته — ثلاثون في الاستعلام */
      if (tk){ var tq = treeQuery(col, tk); chunk30(tq.keys).forEach(function(k){ watch(col, apply, 500, [tq.fld, 'in', k], ['_at', '>', t0]); }); }
      else watch(col, apply, 500, ['_at', '>', t0]);
    });
  }
  if (rankOf(ROLE) >= rankOf('supervisor') || effRole(ROLE) === 'viewer'){
    watch('att', function(id, v){
      STATE.att = STATE.att || {};
      if (v) STATE.att[id] = v; else delete STATE.att[id];
      if (CUR === 'now') render(1);
    }, 400, ['day', dayKey(Date.now())]);
  }
  watch('teams', function(id, v){
    var i = -1;
    for (var k = 0; k < TEAMS.length; k++) if (TEAMS[k].id === id){ i = k; break; }
    if (!v){ if (i > -1) TEAMS.splice(i, 1); return; }
    var row = Object.assign({ id:id }, v);
    if (i > -1) TEAMS[i] = row; else TEAMS.push(row);
  }, 500);
  liveTick();
}
function liveTickStop(){
  if (LIVE_TICK){ clearInterval(LIVE_TICK); LIVE_TICK = null; }
  if (BADGE_TICK){ clearInterval(BADGE_TICK); BADGE_TICK = null; }
}
var BADGE_TICK = null;
/* ═══ عدّادُ المزامنة ═══
   كان الرأسُ يعرض «آخر مزامنة» وحدَها، والسحبُ الدوريُّ يجري خلف الستار كلَّ
   دقيقتين بلا أثرٍ يُرى — فيُظنُّ أنه واقف. صار في الرأس عدٌّ تنازليٌّ من ثلاث
   دقائق يُرى ثانيةً بثانية: عند الصفر يُدفَع الطابورُ ويُسحَب الفارقُ ثم يُعاد
   العدّ. والمزامنةُ اليدويةُ تُعيده أيضًا — فلا سحبتان متتاليتان. */
var SYNC = { cycle:60, left:60, busy:false, pullLast:0, pullAsk:false, day:'' };   /* (V32.1) وحدةُ المزامنة تملك حالتَها — كانت SYNC.cycle/SYNC.left/SYNC.busy/SYNC.pullLast/SYNC.pullAsk */
/* ═══ العدّادُ يعدُّ إلى السحب ═══
   كان يعدُّ ستين ثانيةً إلى «دفعة» لا تقرأ شيئًا — والسحبُ الفعليُّ كلَّ ستِّ
   ساعاتٍ للمكتب. فيبلغ الصفرَ ولا يتغيّر شيءٌ على الشاشة، ويظنُّ الناظرُ أنه
   لا يعمل. صار يعدُّ إلى السحب نفسِه (عشرُ دقائقَ للمكتب والوزارة والمشرف —
   والإنصاتُ الحيُّ يملأ ما بينها)، وعند الصفر يُدفَع ويُسحَب وتُعاد الشاشة. */
/* مؤشِّرُ النبضة في الشريط (V17.34): «⚡» حيّةٌ = التغييراتُ تصل في ثوانٍ،
   و«السحب التالي» شبكةُ أمانٍ دوريةٌ لا موعدَ الطزاجة */
function pulseBadge(){
  var on = !!PULSE_UNSUB;
  return '<span class="hint" title="' + esc(t(on ? 'المزامنةُ الحيّةُ متصلة: التغييراتُ تصل في ثوانٍ — والسحبُ الدوريُّ شبكةُ أمان' : 'المزامنةُ الحيّةُ غيرُ متصلة — يُعتمَد على السحب الدوريّ')) + '" style="margin:0 4px">'
    + (on ? '\u26A1' : '\u23F1') + '</span>';
}
function syncCdSecs(){
  var ev = ((typeof pullScope === 'function') ? pullScope().every : 600000) * (typeof readSlowFactor === 'function' ? readSlowFactor() : 1);
  var left = Math.max(0, (SYNC.pullLast || 0) + ev - Date.now());
  return Math.ceil(left / 1000);
}
function syncCdTxt(){
  var tot = syncCdSecs(), h = Math.floor(tot / 3600), m = Math.floor((tot % 3600) / 60), s = tot % 60;
  var dg = (I18N[LANG] || I18N.ar).dig;
  return ((h ? String(h) + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'))
    .replace(/\d/g, function(c){ return LANG === 'en' ? c : dg[+c]; });
}
function syncCycle(){
  SYNC.left = SYNC.cycle;
  if (SYNC.busy || !STATE.meta.online) return Promise.resolve(0);
  SYNC.busy = true;
  /* الدفعُ كلَّ دقيقة (لا يُقرأ فيه شيء)، والسحبُ حين يحين موعدُه بنطاق الدور —
     فالمكتبُ كلَّ خمسٍ والميدانُ كلَّ ربع ساعة — لأن كلَّ استعلامٍ يُحاسَب ولو
     عاد فارغًا؛ وما بين السحبتين يصل بالإنصات الحيّ. */
  var pushed = CORE.flush().catch(function(){ return 0; });
  return pushed.then(function(){
    /* الجهازُ الذي تجاوز سقفَ قراءاته يُبطَّأ سحبُه الدوريُّ إلى الربع (V17.26) */
  var kkEvery = (typeof KIOSK_ON !== 'undefined' && KIOSK_ON && CUR === 'mfu') ? 120000 : 0;   /* (V30.5) شاشةُ القاعة حيّة: كلَّ دقيقتين لا كلَّ عشر */
  var due = SYNC.pullAsk || (Date.now() - SYNC.pullLast >= (kkEvery || pullScope().every) * (typeof readSlowFactor === 'function' ? readSlowFactor() : 1));
    /* موعدُ السحب يُضبَط عند المحاولة لا عند النجاح — وإلا بقي العدّادُ صفرًا
       بعد سحبةٍ فاشلة وحاول كلَّ ثانية */
    if (due) SYNC.pullLast = Date.now();
    /* الطلبُ اليدويُّ يجلب الثوابتَ، والدورةُ تُنعشها كلَّ ستِّ ساعاتٍ وحدَها —
       فتصل الأوزانُ والأسعارُ والقوائمُ المعدَّلةُ من المكتب بلا سؤال */
    var ask = SYNC.pullAsk || (Date.now() - (FB._staticAt || 0) >= 21600000);
    FB._staticFresh = !!(due && ask);   /* (V31.9) سحبُ الثوابت يغيّر العرضَ وإن لم يأتِ سجلٌّ جديد */
    return due ? (ask ? FB.pullStatic().catch(function(){ return 0; }).then(pullDelta) : pullDelta()) : 0;
  }).then(function(n){
    syncBadge();
    /* (V31.9) خطةُ التسليم، وحدةُ الصفحات: كانت كلُّ دورةٍ (كلَّ دقيقة) تُبطل الإحصاءَ وتعيد رسمَ الخريطة كاملةً ولو لم يُسحَب شيء —
       نحوُ ٤٠٠ م.ث معالجةً على جوالٍ متوسطٍ كلَّ دقيقة بلا فائدة، وبطاريةٌ تذهب. صار ذلك حين يأتي جديدٌ أو تُسحَب الثوابتُ وحدَهما */
    var fresh = !!n || !!FB._staticFresh; FB._staticFresh = false;
    /* (V32.4) مراجعةُ الجودة: حالةُ النقطة تتبع اليوم («غدًا» تصير «مُسنَدة» بعد منتصف الليل) — فتغيّرُ يومِ مكة جديدٌ وإن لم يُسحَب شيء */
    var dk0 = dayKey(Date.now()); if (SYNC.day !== dk0){ if (SYNC.day) fresh = true; SYNC.day = dk0; }
    if (!fresh) return n;
    statBump();
    if (CUR === 'map' && typeof mapPaint === 'function') mapPaint();
    /* سحبةٌ جلبت جديدًا تُعيد رسمَ شاشات المتابعة — لا النماذجَ ولا الخريطة،
       فمن يكتب لا يُقذَف مما يكتب */
    else if (n && LIVE_WORK_PAGES.indexOf(CUR) > -1 && !document.querySelector('#content input:focus, #content textarea:focus')) render(1);
    return n;
  }).catch(function(e){ softErr('دورة المزامنة', e, ''); return 0; })
    .then(function(n){ SYNC.busy = false; SYNC.left = SYNC.cycle; return n; });
}
function liveTick(){
  /* مؤقّتٌ واحدٌ لا غير — ولو نودي مرتين. وله مُلغٍ صريحٌ يُنادى عند
     الخروج، فلا يبقى نبضٌ يسحب لحسابٍ خرج صاحبُه. */
  liveTickStop();
  SYNC.left = SYNC.cycle;
  LIVE_TICK = setInterval(function(){
    SYNC.left = Math.max(0, SYNC.left - 1);
    var cd = document.getElementById('syncCd');
    if (cd) cd.textContent = syncCdTxt();
    /* الدفعُ كلَّ دقيقة، والسحبُ عند بلوغ عدّاده الصفر — لا انتظارَ لدقيقة الدفع */
    var pullDue = STATE.meta.online && FB.ready && syncCdSecs() === 0 && !SYNC.busy;
    if (SYNC.left === 0 || pullDue){
      if (STATE.meta.online && FB.ready) syncCycle();
      else SYNC.left = SYNC.cycle;   /* بلا شبكةٍ يُعاد العدُّ ولا يُحاوَل */
    }
  }, 1000);
  if (!BADGE_TICK) BADGE_TICK = setInterval(function(){
    try { syncBadge(); } catch (e){ softErr('شارة المزامنة', e, ''); }
  }, 30000);
  /* العودةُ إلى التطبيق تسحب الجديدَ فارقيًّا — لا الثوابتَ كلَّها؛ ومرةً كلَّ
     دقيقةٍ على الأكثر، فمن يبدّل بين تطبيقين لا يفتح دورةً مع كلِّ تبديل */
  document.addEventListener('visibilitychange', function(){
    /* (V19.5) الذهابُ إلى الخلفية هو اللحظةُ التي قد يُسقِط فيها الهاتفُ التطبيق:
       يُرفَع ما ينتظر فورًا إن وُجد — كتاباتٌ كانت ستُرفَع على أيِّ حال */
    if (document.hidden){ syncOnHide(); return; }
    if (!STATE.meta.online || !FB.ready) return;
    if (Date.now() - (VIS_LAST || 0) < 60000) return;
    VIS_LAST = Date.now();
    syncCycle();
  });
}
var SOFT_ERRS = [], SOFT_SAID = {};
/* ملاحظةٌ في سجل الصامت لا حدثٌ يُرفَع — فلا يُصنَع أثرٌ عن مصالحة أثر */
function logEventQuiet(msg){
  SOFT_ERRS.unshift({ at:Date.now(), where:'مصالحة', msg:String(msg).slice(0, 120) });
  if (SOFT_ERRS.length > 50) SOFT_ERRS.length = 50;
}
/* ═══ الصندوقُ الأسود (V17.98) ═══
   آخرُ مئةِ حدثٍ على الجهاز في حلقةٍ مسقوفة: تنقّلُ الصفحات، ومعرِّفاتُ الأفعال،
   والمزامنة، والأخطاء، وحالُ المخزن، والنسخةُ والجهاز. يُحفَظ مع حالة التطبيق،
   ويُرفَق تلقائيًّا بكلِّ بلاغٍ في الكتابة نفسِها (سقفٌ ٢٠ كيلوبايت)، ويُنسَخ نصًّا
   من الأدوات للإرسال بلا شبكة. لا نصَّ حرًّا ولا اسمًا ولا جوالًا: معرِّفاتٌ
   وأزمنةٌ ورموزُ أخطاءٍ فقط — كلُّ سطرٍ يمرُّ بالتنقية قبل أن يُحفَظ. */
var BOX = null, BOX_T = 0, BOX_MAX = 100, BOX_BYTES = 20000, BOX_ERR = null;
function boxRedact(s){
  return String(s == null ? '' : s)
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')   /* لا حرفَ عربيًّا — النصُّ الحرُّ والأسماء */
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '')                                         /* لا بريد */
    .replace(/\+?\d[\d\s-]{7,}\d/g, '#')                                              /* لا جوالَ ولا رقمًا طويلًا */
    .replace(/\s+/g, ' ').trim().slice(0, 80);
}
function boxLoad(){
  if (BOX) return BOX;
  try { BOX = JSON.parse(lsGet('nsk14.box') || 'null'); } catch (e){ BOX = null; }
  if (!BOX || !Array.isArray(BOX.e)) BOX = { e:[] };
  return BOX;
}
function boxNote(kind, what){
  var B = boxLoad(), w = boxRedact(what);
  var last = B.e[B.e.length - 1];
  if (last && last.k === kind && last.w === w && Date.now() - last.t < 1000) return;   /* لا تكرارَ في الثانية نفسِها */
  B.e.push({ t:Date.now(), k:kind, w:w });
  while (B.e.length > BOX_MAX) B.e.shift();
  var now = Date.now();
  if (now - BOX_T > 2000){ BOX_T = now; try { lsSet('nsk14.box', JSON.stringify(B)); } catch (e){ B.noStore = 1; } }
}
function boxAction(e){
  var el = e && e.target && e.target.closest ? e.target.closest('button,a,[data-p],[data-goto]') : null;
  if (!el || !el.attributes) return;
  for (var i = 0; i < el.attributes.length; i++){ var a = el.attributes[i]; if (a.name.indexOf('data-') === 0){ boxNote('act', a.name.slice(5) + (a.value && a.value.length < 30 ? '=' + a.value : '')); return; } }
}
function boxText(){
  var B = boxLoad(), nav = (typeof navigator === 'object' ? navigator : {});
  var head = ['nsk-box v1', 'ver ' + appVer(), 'dev ' + (typeof DEV_ID === 'string' ? DEV_ID.slice(0, 12) : ''), 'ua ' + boxRedact(nav.userAgent || '').slice(0, 60),
              'idb ' + (IDB_BAD ? 'bad' : (_idb ? 'ok' : 'mem')) + ' persist ' + (typeof PERSIST === 'object' ? PERSIST.st : ''), 'q ' + ((STATE.queue || []).length) + ' pz ' + ((STATE.poison || []).length), '---'];
  var lines = B.e.map(function(x){ return new Date(x.t).toISOString().slice(11, 19) + ' ' + x.k + ' ' + x.w; });
  var out = head.concat(lines).join('\n');
  while (out.length > BOX_BYTES && lines.length){ lines.shift(); out = head.concat(lines).join('\n'); }
  return out;
}
function boxCopy(){
  var txt = boxText();
  var done = function(){ toast(t('نُسخ التشخيص — أرسله للمهندس')); };
  try { if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done, function(){ toast(t('تعذّر النسخ')); }); return; } } catch (e){ BOX_ERR = e; }
  try { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch (e){ toast(t('تعذّر النسخ')); }
}
function softErr(where, e, tell){
  var msg = String((e && (e.message || e.code)) || e || '').slice(0, 120);
  SOFT_ERRS.unshift({ at:Date.now(), where:where, msg:msg });
  try { boxNote('err', where + ':' + ((e && e.code) || msg)); } catch (e3){ BOX_ERR = e3; }
  if (SOFT_ERRS.length > 50) SOFT_ERRS.length = 50;
  try { console.warn('[أفاقي] ' + where + ': ' + msg); } catch (e2){}
  if (tell && !SOFT_SAID[where]){
    SOFT_SAID[where] = 1;
    toast(t(tell));
  }
}

/* السجلُّ يُعرَض حيث يُسأَل عنه: من فتح «المزامنة والتعارض» يسأل لماذا لا
   تصل البيانات — فيجد الجواب مكتوبًا لا يخمّنه. */
function softErrCard(){
  if (!SOFT_ERRS.length) return '';
  return alertBox('warn', 'أعطالٌ صامتةٌ وقعت — لم تُزعج العملَ لكنها قد تفسّر نقصًا فيما تراه.')
    + cardFlush(t('ما سقط بلا صوت') + ' — ' + nm(SOFT_ERRS.length),
        table(['الوقت','الموضع','السبب'],
          SOFT_ERRS.slice(0, 30).map(function(x){
            return ['<span class="num">'
                    + esc(fmtTime(x.at, { hour:'2-digit', minute:'2-digit' }))
                    + '</span>',
                    esc(t(x.where)),
                    '<span class="hint" style="margin:0">' + esc(x.msg || '—') + '</span>'];
          })),
        btn('امسح السجل','btn-quiet btn-sm',' data-serrclr="1"'));
}

function syncBadge(){
  var el = document.getElementById('syncMeta');
  if (!el) return;
  var n = CORE.pending();
  /* زرُّ الهاتف ولافتةُ الحفظ المحلي بالعدد نفسِه (V19.4) */
  var mb = document.getElementById('syncMN'); if (mb){ if (n){ mb.textContent = nm(n); mb.hidden = false; } else { mb.textContent = ''; mb.hidden = true; } }
  try { idbBannerUpdate(); } catch (e){ LS_ERR = e; }
  var bn = document.getElementById('idbBannerN'); if (bn) bn.textContent = n ? '(' + nm(n) + ' ' + t('بانتظار الرفع') + ')' : '';
  var on = STATE.meta.online;
  /* «آخر مزامنة» كانت طابعًا ثابتًا لا يتحرّك إلا عند كتابةٍ — فتبقى ساعاتٍ
     ويُظنُّ أنها معطّلة. صارت تُكتَب عند كلِّ إنصاتٍ وسحبٍ ودفعٍ، وتُعرَض
     «منذ كم» فيُرى أنها حيّة، والأرقامُ بلغة الواجهة. */
  var ts = '\u2014';
  if (STATE.meta.lastSync){
    var ago = Math.max(0, Math.round((Date.now() - STATE.meta.lastSync) / 60000));
    var unit = ago < 60 ? t('د') : t('س'), val = nm(ago < 60 ? ago : Math.round(ago / 60));
    ts = ago < 1 ? t('الآن')
       : (LANG === 'en' ? (val + ' ' + unit + ' ago') : (t('منذ') + ' ' + val + ' ' + unit));
  }
  var un = (typeof notifUnread === 'function') ? notifUnread() : 0;
  /* الجرسُ دائمًا بجوار المزامنة، والشارةُ الحمراءُ تعدُّ غيرَ المقروء وتزيد مع كلِّ
     إشعارٍ يصل. (كان الرمزُ يُكتَب \u1F514 — هروبًا ناقصًا يرسم «ὑ4» بدل الجرس) */
  el.innerHTML = (may('roles') ? '<button type="button" class="tb-sync" data-syncall="1" title="'
      + esc(t('زامِن كلَّ الأجهزة المفتوحة الآن')) + '">\u{1F4E1} ' + esc(t('زامِن الجميع')) + '</button> ' : '')
    + '<button type="button" class="tb-bell' + (un ? ' has' : '') + '" data-bell="1" title="'
    + esc(t('الإشعارات')) + '" aria-label="' + esc(t('الإشعارات')) + '">\u{1F514}'
    + (un ? '<span class="tb-badge">' + nm(un) + '</span>' : '') + '</button> '
    /* زرُّ المزامنة: كانت المزامنةُ اليدويةُ موجودةً بلا زرٍّ يبلغها، فيرى
       المستخدمُ «ثلاثةٌ بانتظار الرفع» ولا يجد كيف يرفعها فينتظر. */
    + '<button type="button" class="tb-sync" data-pull="1" title="'
    + esc(t('زامِن الآن')) + '" aria-label="' + esc(t('زامِن الآن')) + '">'
    + (n ? '\u21BB ' + nm(n) : '\u21BB') + '</button> '
    + '<span class="dot" style="background:'
    + (on ? 'var(--ok)' : 'var(--danger)') + '"></span>'
    /* كانت لا تظهر إلا والطابورُ ممتلئ — فمن أراد أن يطمئنَّ أن كلَّ شيءٍ
       وصل لم يجد ما يضغطه. صارت دائمةً: رقمٌ إن بقي شيء، وعلامةُ تمامٍ
       إن وصل الكلُّ — وكلتاهما تفتح نافذةَ المتابعة. */
    + ('<button type="button" class="pill ' + (n ? 'warn' : 'ok') + '" data-pq="1" '
         + 'style="border:0;cursor:pointer" title="' + esc(t('اضغط لترى ما لم يُرفَع وما وصل')) + '">'
         + (n ? (nm(n) + ' ' + esc(t(on ? 'بانتظار الرفع' : 'محفوظٌ على الجهاز')))
              : ('\u2713 ' + esc(t('الكلُّ وصل')))) + '</button> ')
    + (STATE.meta.dropped
        ? '<span class="pill off">' + esc(t('أُسقط من الطابور')) + '</span> ' : '')
    + esc(t('آخر مزامنة')) + ' <span class="num">' + esc(ts) + '</span>'
    /* العدُّ التنازليُّ للدورة التالية — يُحدَّث كلَّ ثانيةٍ من liveTick */
    + ' <span class="hint" style="margin:0" title="' + esc(t('السحبُ التالي — عند الصفر تُدفَع الطوابيرُ وتُسحَب كلُّ التغييرات وتُعاد الشاشة؛ وما بينهما يصل بالإنصات الحيّ')) + '">'
    + esc(t('السحب التالي')) + ' <span class="num" id="syncCd" dir="ltr">' + syncCdTxt() + '</span>'
    + (typeof readSlowFactor === 'function' && readSlowFactor() > 1
        ? ' <span class="pill warn" title="' + esc(t('أُبطئ السحبُ الدوريُّ لأن هذا الجهاز قرأ') + ' ' + nm(readBudget()) + ' ' + t('اليوم — والمزامنةُ الحيّةُ تُبقي التغييراتِ تصل في ثوانٍ')) + '">' + esc(t('مُبطَّأ')) + '</span>'
        : '')
    + '</span>'
    + pulseBadge();
}

/* ── الاتصال — يُراقَب فيُستأنف الرفع تلقائيًّا ── */
function watchNet(){
  function upd(){
    STATE.meta.online = (typeof navigator !== 'undefined') ? navigator.onLine !== false : false;
    syncBadge();
    if (STATE.meta.online){ CORE.flush(); if (typeof photoFlush === 'function') photoFlush(); }
  }
  if (typeof window !== 'undefined'){
    window.addEventListener('online',  upd);
    window.addEventListener('offline', upd);
  }
  upd();
}

/* ═══ بيانات المواقع — ألفٌ وسبعمئةٌ وسبعٌ وثمانون نقطةً حقيقية ═══
   مأخوذةٌ من قاعدة النظام العامل. المضلّعاتُ مطروحةٌ هنا وتُحمَّل مع الخريطة وحدها.
   الأعمدة: [٠] المعرّف [١] الاسم [٢] المشعر [٣] النوع [٤] الوجه
            [٥] العرض [٦] الطول [٧] المربع [٨] الشاخص [٩] الشركة
            [١٠] المنطقة [١١] حالة التركيب [١٢] داخل/خارج */

var SITES_RAW = {"z":["منى","عرفات","الجمرات","منشآت التسكين","قطار المشاعر","مسجد نمرة"],"t":["مخيم","ممر","كاميرا","جسر","مبنى","محطة","بوابة"],"w":["إعادة تركيب ١٤٤٧","إطار معدني جديد","نقطة ممر جديدة","تفعيل كاميرا قائمة","ترقية كاميرا","خارج النطاق"],"co":["إثراء الجود","إستضافة","إكرام الضيف","ابراج شركة مكه","اثراء الخير","الخطوط السعودية","الراجحي","الراجحي B2C","الرفادة","ام من ميلينوم","بشرى الضيافة","حجاج المجاملة","خدمات لوجستية","دليل الزوار","رحلات ومنافع","رفاد","رواف منى","سيف الاسلام","شركة اثراء الجود لخدمات الحجاج","شركة اثراء الخير لخدمات الحجاج","شركة الراجحي للخدمات التجارية المساندة","شركة الرفادة لخدمات الحجاج","شركة بشرى الضيافة","شركة رواف منى لخدمات الحجاج","شركة فندق ابراج شركة مكه الفندقية","شركة فندق هوليدي إن بكة","شركة مشارق الماسية لخدمات الحجاج","شركة مناسك المشاعر لخدمات الحجاج","ضيوف البيت","ضيوف خادم الحرمين الشريفين","فندق ام من ميلينوم","مجموعة سيرا","مخيمات الطوارئ","مشارق الذهبية","مشارق الماسية","مشارق المتميزة","مقر ومركز شركة رواف منى لخدمات الحجاج","مناسك المشاعر","مواقع الامن العام","موقع الكشافة","هوليدي ان بكة","يسر المشاعر"],"dm":["اخوان السعودية","اعمال الشاطئ","الادارة العامة للمسؤولية الاجتماعية والأعمال التطوعية","الشركة فجر النسك لخدمات الحجاج","حج الملاحق الفندقية","حجاج الداخل","شركة  إيثار المحدودة","شركة أذان لخدمات حجاج الداخل المحدودة شركة شخص واحد، شركة مواسم الغفران المحدودة، شركة ركن الاجور لخدمات حجاج الداخل المحدودة","شركة أعمال السكينة","شركة إفاضه","شركة احمد سالم الخزاعي وشريكه","شركة اضواء الايمان لخدمات الحجاج، شركة فجر المناسك المحدودة","شركة الأسواف المحدودة","شركة الإفاضة المتحدة للخدمات المحدوده","شركة الاتقان للحج","شركة الاخلاص المتحدة لخدمة حجاج الداخل المحدودة، شركة رحاب المشاعر لخدمات الحجاج","شركة الاسلام المتحدة لخدمات حجاج الداخل والمعتمرين","شركة الاطياف للحج المحدودة","شركة البدر القادم المحدودة","شركة الحمراء المحدودة","شركة الخير المكية لخدمات حجاج الداخل المحدودة، شركة فوج مكة لخدمات حجاج الداخل المحدودة، شركة أبناء محمد شافعي وأبناء ابراهيم الدباب لخدمات حجاج الداخل","شركة الذاكرين لخدمات حجاج الداخل المحدودة، شركة الفرقان المكيه المحدودة","شركة الراجحي لخدمات حجاج الداخل المحدودة","شركة الرحلة المباركة المحدودة‬‏، ‫شركة الخباري المحدودة‬‏","شركة السلام المتحدة، شركة قافلة الاتمام","شركة الطائفين","شركة الطائفين لخدمة حجاج الداخل","شركة الظافرة لخدمة حجاج الداخل المحدودة شركة ذات مسؤولية محدودة، شركه الفردوس المتحده لخدمه حجاج الداخل المحدوده، شركة المعالي لخدمات حجاج الداخل المحدودة شركة شخص واحد","شركة العطير لخدمة حجاج الداخل","شركة العهد الوطنية المحدودة","شركة الفجر","شركة الفرائض لخدمات حجاج الداخل المحدودة، شركة الخماسيه السعوديه للتنمية التجاريه، شركه الحمله الراقيه لصاحبها منصور عبدالرحمن ابوخنجر وشركاه","شركة القصواء المحدودة","شركة المأمونيه للتجاره المحدودة، شركة فاخر منصور السهيمي وشريكه","شركة المحيميد، شركة محمد الرويس","شركة المشاعر المتحدة المحدودة","شركة المقام الأمين لخدمة حجاج الداخل","شركة المنار لخدمة حجاج الداخل","شركة المناسك المحدودة","شركة المنهاج السعوديه المحدودة","شركة المهابة لخدمة حجاج الداخل","شركة الميعاد السعودية المحدودة","شركة الناصرية لنموذجية لخدمات حجاج الداخل، شركة فوج الهدى لخدمات حجاج الداخل المحدودة","شركة الهجرة العربية المحدودة","شركة بشائر الإسلام لخدمات حجاج الداخل","شركة بشائر الاسلام","شركة بيان","شركة بيت المشاعر","شركة تفويج المحدودة","شركة جمال يوسف حمد الذوادي وشركاه‬‏، ‫شركة صالح بن غازي الظفيري وشركاه المحدودة‬‏، ‫شركة الجليس الصالح‬‏","شركة حج","شركة حمد اللحياني وحمد الزايدي","شركة حملة الاحسان لخدمة حجاج الداخل المحدوده","شركة حملة البشائر لخدمات حجاج الداخل، شركة التيسير للحج والعمرة المحدودة، مؤسسة عطاالله مجول الهذلي لخدمات الحجاج","شركة حملة الرسالة لخدمات حجاج الداخل، شركة صالح الملحم وشركاه لخدمات حجاج الداخل","شركة خالد زامل الغيثي وشركاه المحدودة","شركة دار الإيمان الأولى للحج","شركة رفاق الصفوة التجارية","شركة ركاز المتقين","شركة ركن الحطيم للحج","شركة رواحل الإيمان المحدودة","شركة رواحل الحج المحدودة، ‫شركة عبدالله الرويزن ومشعل الرويزن التضامنية‬‏، ‫شركة عبدالهادي بن رويزن وشريكه‬‏","شركة سدانة لخدمات حجاج الداخل","شركة سرهد لخدمات حجاج الداخل","شركة سعد بن ابراهيم الحويجي وشركاه","شركة سعود بن عبدالعزيز الجميعه وشركاه التضامنيه","شركة سعود عابد المجنوني","شركة سلفا للحج والعمرة","شركة سلمان ويوسف غازي الظفيري لخدمة حجاج الداخل، شركة جوهرة القوافل للحج والعمرة المحدودة، شركة السلوان لخدمات حجاج الداخل المحدودة، شركة حملة الصفوة التجارية شركة شخص واحد","شركة سماء الفاروق لخدمات حجاج الداخل","شركة سيف الإسلام","شركة شمس طيبة المحدوده","شركة صفا المشاعر","شركة طريق الهجرتين المحدودة","شركة طوائف التضامنية","شركة طوى الشرق","شركة عالم البشائر المحدودة","شركة عبدالرحمن عثمان الكليب وشركاه","شركة عبدالله العصفور، شركة المسار العمراني، شركة قافلة الهاشم، شركة باب السلام","شركة عبدالله بن محفوظ وشركاه","شركة عبدالله صالح الكاف لخدمات حجاج الداخل، شركة محمد عمر بالي فلمبان وشريكه","شركة عبدالمجيد الجريسي","شركة عرفة المحدودة","شركة فجر الهدى","شركة فهد البطي وشركاه التضامنية","شركة فيض المشاعر لخدمات الحجاج","شركة قاصد المشاعر، شركة حملة المحمل","شركة قافلة الخير","شركة قافلة النخبة لخدمات الحجاج","شركة قريش المحدودة شركة شخص واحد","شركة محسن بن سالم الأحمدي وشركاه","شركة محمد خالد قديمي وشركاؤه، شركه حمله الابرار لخدمات الحجاج الداخل، شركة المقام السعودية لخدمات الحج المحدوده، شركة عبدالله بن بريك العماري وشريكه لخدمات حجاج الداخل التضامنية","شركة محمد عبدالله القرشي وشركاه التضامنية","شركة محمد وعبدالرحمن أحمد الحميري","شركة مخيم الرشاد","شركة مخيم النور لخدمات حجاج الداخل المحدوده","شركة مخيم رفادة المحدودة شركة شخص واحد، شركة مكارم لخدمات الحجاج، شركة قوافل الحجيج المحدودة","شركة مخيمات الخيرات","شركة مدى الجنوب التجارية، شركه الاخيار لخدمات حجاج الداخل","شركة مشاعل النور المحدودة، شركة نماء البركة لخدمات الحجاج","شركة ملتقى الغدير","شركة منازل الرافدين‬‏، ‫شركة محمد العلياني المحدودة لخدمات حجاج الداخل‬‏","شركة مواكب اليسر لخدمات حجاج الداخل المحدودة، شركة مخيم الوفاء الحديثه لخدمات حجاج الداخل","شركة ناصر نصار الحازمي وشركاه التضامنية","شركة نسك المشاعر لخدمات الحجاج، مؤسسة قافلة مكة لخدمات حجاج الداخل","شركة نور النسك لخدمات الحجاج","شركة نور حراء المحدوده","شركة هداية الراجحون المحدوده","شركة هشام بن بدوي سكيك وشركاه","شركة وفود الحرمين لاصحابها سعود الشريف وجمعان الثقفي ومنصور العصيمي التضامنية","شركه التقوي لخدمات حجاج الداخل المحدودة، مؤسسة ريادة الوطن لخدمات الحجاج، شركة حسن عبدالله احمد القرشي ومحمد مرزوق القرشي، شركة افاق المشاعر التجارية شركة شخص واحد، شركة مواكب الأهلة لخدمات حجاج الداخل المحدودة","شركه السندس المتحده لخدمات حجاج الداخل المحدوده، شركه الركن الخامس للحج","شركه المكرمون لخدمات حجاج الداخل المحدوده، شركه بلاد الحرمين لخدمات حجاج الداخل المحدودة، شركة قافلة المنار","شركه حمله الفرقان للحج","شركه حمله اهالي القصيم للحج، شركة سعد جميل القرشي لخدمات حجاج الداخل شركة الشخص الواحد، شركة صالح شاهر ابراهيم زيني وشركاه لخدمات حجاج الداخل","مؤسسة سعود دهيران دخيل الله الشلوي لخدمات الحجاج","مؤسسة عبداللطيف الحماد","مؤسسة عبدالله حمد العراجه","منابر الايمان","وزارة الحج والعمرة حجاج داخل"],"g":[["NSK-ARF-CMP-0001","عرفات - مربع 7-15 - شاخص 1-3-5/506",1,0,1,21.338618,39.983728,"7-15","1-3-5/506","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0002","عرفات - مربع 7-14 - شاخص 71-73/62",1,0,1,21.338145,39.984095,"7-14","71-73/62","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0003","عرفات - مربع 7-16 - شاخص 4/506",1,0,1,21.338197,39.985804,"7-16","4/506","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0004","عرفات - مربع 7-16 - شاخص 2/506",1,0,1,21.33877,39.985285,"7-16","2/506","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0005","عرفات - مربع 6-4 - شاخص 8/502",1,0,1,21.33787,39.98513,"6-4","8/502","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0006","عرفات - مربع 6-4 - شاخص 2-4/502",1,0,1,21.337164,39.984198,"6-4","2-4/502","فندق ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0007","عرفات - مربع 38 - شاخص F/204",1,0,1,21.343194,39.977694,"A2","A2/38","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0008","عرفات - مربع 38 - شاخص I/206",1,0,1,21.342808,39.979252,"38","I/206","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0009","عرفات - مربع 38 - شاخص H/204",1,0,1,21.336249,39.992922,"38","H/204","الخطوط السعودية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0010","عرفات - مربع 38 - شاخص G/206",1,0,1,21.336838,39.994068,"38","G/206","الخطوط السعودية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0011","عرفات - مربع 38 - شاخص A/206",1,0,1,21.337568,39.994963,"38","A/206","الخطوط السعودية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0012","عرفات - مربع 117E - شاخص 2/631",1,0,1,21.346826,39.981021,"117E","2/631","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0013","عرفات - مربع 117C - شاخص 4/632",1,0,1,21.348241,39.980296,"117C","4/632","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0014","عرفات - مربع 43 - شاخص 40/204",1,0,1,21.346978,39.980015,"43","40/204","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0015","عرفات - مربع 43 - شاخص 13/202",1,0,1,21.347292,39.979664,"43","13/202","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0016","عرفات - مربع 7-9B - شاخص 35/533",1,0,1,21.349563,39.973261,"7-9B","35/533","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0017","عرفات - مربع 50B - شاخص 10/56",1,0,1,21.350113,39.979055,"50B","10/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0018","عرفات - مربع 43 - شاخص 32/204",1,0,1,21.340807,39.990502,"43","32/204","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0019","عرفات - مربع 8-4 - شاخص 6/524",1,0,1,21.343995,39.991316,"8-4","6/524","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0020","عرفات - مربع 14 - شاخص 2/62",1,0,1,21.344453,39.989281,"14","2/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0021","عرفات - مربع 101D - شاخص 4/216",1,0,1,21.340332,39.989683,"101D","4/216","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0022","عرفات - مربع 14 - شاخص 1/56",1,0,1,21.344785,39.988585,"14","1/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0023","عرفات - مربع 10 - شاخص 2/114",1,0,1,21.345854,39.987452,"10","2/114","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0024","عرفات - مربع 10 - شاخص 5/112",1,0,1,21.345921,39.986596,"10","5/112","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0025","عرفات - مربع 14 - شاخص 8/114",1,0,1,21.343729,39.990058,"14","8/114","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0026","عرفات - مربع 8-4 - شاخص 7/522",1,0,1,21.345263,39.989579,"8-4","7/522","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0027","عرفات - مربع 8-7 - شاخص 10/520",1,0,1,21.346126,39.988053,"8-7","10/520","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0028","عرفات - مربع 8-8 - شاخص 13/520",1,0,1,21.346308,39.989106,"8-8","13/520","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0029","عرفات - مربع 50A - شاخص 6/56",1,0,1,21.34786,39.9842,"50A","6/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0030","عرفات - مربع 50A - شاخص 4/56",1,0,1,21.347885,39.982992,"50A","4/56","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0031","عرفات - مربع 50 - شاخص 11/50",1,0,1,21.348594,39.983653,"50","11/50","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0032","عرفات - مربع 50 - شاخص 9/50",1,0,1,21.346982,39.985026,"50","9/50","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0033","عرفات - مربع 8-9 - شاخص 13/522",1,0,1,21.346961,39.985846,"8-9","13/522","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0034","عرفات - مربع 50 - شاخص 13/50",1,0,1,21.347417,39.984491,"50","13/50","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0035","عرفات - مربع 41 - شاخص 7/62",1,0,1,21.349002,39.981941,"41","7/62","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0036","عرفات - مربع ? - شاخص ?",1,0,1,21.349883,39.982549,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0037","عرفات - مربع 8-10 - شاخص 2/529",1,0,1,21.343743,39.994036,"8-10","2/529","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0038","عرفات - مربع ? - شاخص ?",1,0,1,21.34227,39.996428,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0039","عرفات - مربع 8-7 - شاخص 12/520",1,0,1,21.344828,39.991917,"8-7","12/520","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0040","عرفات - مربع 8-8 - شاخص 9/520",1,0,1,21.345407,39.991068,"8-8","9/520","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0041","عرفات - مربع 8-8 - شاخص 12/522",1,0,1,21.345744,39.990432,"8-8","12/522","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0042","عرفات - مربع 7A - شاخص 6/112",1,0,1,21.347733,39.986962,"7A","6/112","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0043","عرفات - مربع Null - شاخص ?",1,0,1,21.348718,39.986442,"Null","","","","منطقة عرفات",""],["NSK-ARF-CMP-0044","عرفات - مربع 100B - شاخص 22/608",1,0,1,21.347905,39.988268,"100B","22/608","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0045","عرفات - مربع ? - شاخص ?",1,0,1,21.351776,39.983201,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0046","عرفات - مربع 37 - شاخص 29/204",1,0,1,21.354151,39.979267,"37","29/204","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0047","عرفات - مربع 43 - شاخص 36/204",1,0,1,21.35696,39.976796,"43","36/204","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0048","عرفات - مربع ? - شاخص 6/425",1,0,1,21.351664,39.98896,"","6/425","","","منطقة عرفات",""],["NSK-ARF-CMP-0049","عرفات - مربع 85 - شاخص 1/427",1,0,1,21.353256,39.987035,"85","1/427","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0050","عرفات - مربع 8-23 - شاخص 84/68",1,0,1,21.34956,39.992509,"8-23","84/68","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0051","عرفات - مربع 8-23 - شاخص 78/68",1,0,1,21.349207,39.992068,"8-23","78/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0052","عرفات - مربع ? - شاخص ?",1,0,1,21.351465,39.991964,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0053","عرفات - مربع 85 - شاخص 1/425",1,0,1,21.353949,39.987207,"85","1/425","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0054","عرفات - مربع 87 - شاخص 7/408",1,0,1,21.348116,39.993431,"87","7/408","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0055","عرفات - مربع 79 - شاخص 2-4/421",1,0,1,21.348158,39.995426,"79","2-4/421","حجاج المجاملة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0056","عرفات - مربع 81 - شاخص 14/406",1,0,1,21.35983,39.974447,"81","14/406","","","منطقة عرفات",""],["NSK-ARF-CMP-0057","عرفات - مربع 81 - شاخص 13/404",1,0,1,21.359193,39.975201,"81","13/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0058","عرفات - مربع 80 - شاخص 17/406",1,0,1,21.356367,39.980047,"80","17/406","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0059","عرفات - مربع 80 - شاخص 18/406",1,0,1,21.357928,39.977399,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0060","عرفات - مربع 77 - شاخص 2/404",1,0,1,21.356203,39.981468,"77","2/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0061","عرفات - مربع ? - شاخص ?",1,0,1,21.35597,39.980104,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0062","عرفات - مربع 77 - شاخص 8/404",1,0,1,21.35948,39.981144,"77","8/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0063","عرفات - مربع 77 - شاخص 6/404",1,0,1,21.359133,39.981825,"77","6/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0064","عرفات - مربع 77 - شاخص 4/404",1,0,1,21.357674,39.982838,"77","4/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0065","عرفات - مربع 77 - شاخص 12/404",1,0,1,21.360953,39.978844,"77","12/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0066","عرفات - مربع 77 - شاخص 10/404",1,0,1,21.359992,39.980431,"77","10/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0067","عرفات - مربع 8-13 - شاخص 3/528",1,0,1,21.361351,39.977815,"8-13","3/528","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0068","عرفات - مربع 8-13 - شاخص 1/528",1,0,1,21.361092,39.977972,"8-13","1/528","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0069","عرفات - مربع 8-12 - شاخص 4/528",1,0,1,21.353183,39.99164,"8-12","4/528","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0070","عرفات - مربع 8-12 - شاخص 1/526",1,0,1,21.352589,39.992501,"8-12","1/526","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0071","عرفات - مربع 8-3 - شاخص 3/524",1,0,1,21.351117,39.995324,"8-3","3/524","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0072","عرفات - مربع 8-3 - شاخص 1/527",1,0,1,21.352272,39.993327,"8-3","1/527","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0073","عرفات - مربع 8-3 - شاخص 1/524",1,0,1,21.350557,39.9959,"8-3","1/524","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0074","عرفات - مربع 7-1B - شاخص A1-A2-A3/527",1,0,1,21.355948,39.986905,"7-1B","A1-A2-A3/527","شركة اثراء الجود لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0075","عرفات - مربع 8-12 - شاخص 5/526",1,0,1,21.354444,39.989775,"8-12","5/526","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0076","عرفات - مربع 38 - شاخص J/204",1,0,1,21.35589,39.989399,"38","J/204","شركة بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0077","عرفات - مربع 8-12 - شاخص 8/528",1,0,1,21.354141,39.9907,"8-12","8/528","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0078","عرفات - مربع 8-14 - شاخص 3/531",1,0,1,21.355253,39.991281,"8-14","3/531","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0079","عرفات - مربع 8-11 - شاخص 8/526",1,0,1,21.352728,39.995568,"8-11","8/526","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0080","عرفات - مربع 8-11 - شاخص 7/524",1,0,1,21.354523,39.99168,"8-11","7/524","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0081","عرفات - مربع 8-11 - شاخص 4/526",1,0,1,21.353741,39.99334,"8-11","4/526","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0082","عرفات - مربع 8-11 - شاخص 11/524",1,0,1,21.353113,39.994369,"8-11","11/524","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0083","عرفات - مربع 8-14 - شاخص 5/531",1,0,1,21.356326,39.993607,"8-14","5/531","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0084","عرفات - مربع 8-14 - شاخص 10/529",1,0,1,21.355395,39.992638,"8-14","10/529","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0085","عرفات - مربع 8-14 - شاخص 8/529",1,0,1,21.355221,39.994697,"8-14","8/529","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0086","عرفات - مربع 116 - شاخص 19/649",1,0,1,21.361265,39.980327,"116","19/649","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0087","عرفات - مربع 116 - شاخص 20/647",1,0,1,21.363018,39.977677,"116","20/647","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0088","عرفات - مربع 116 - شاخص 23/649",1,0,1,21.363934,39.976503,"116","23/649","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0089","عرفات - مربع 116 - شاخص 22/647",1,0,1,21.360569,39.982003,"116","22/647","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0090","عرفات - مربع 96 - شاخص 8/647",1,0,1,21.368279,39.979143,"96","8/647","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0091","عرفات - مربع 96 - شاخص 7/649",1,0,1,21.368879,39.978369,"96","7/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0092","عرفات - مربع 96 - شاخص 4/647",1,0,1,21.369199,39.977707,"96","4/647","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0093","عرفات - مربع 96 - شاخص 3/649",1,0,1,21.367758,39.978024,"96","3/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0094","عرفات - مربع 96 - شاخص 1/649",1,0,1,21.367935,39.977529,"96","1/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0095","عرفات - مربع 95 - شاخص 8/649",1,0,1,21.36699,39.981046,"95","8/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0096","عرفات - مربع 95 - شاخص 6/649",1,0,1,21.367045,39.980602,"95","6/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0097","عرفات - مربع 95 - شاخص 4/649",1,0,1,21.367493,39.980186,"95","4/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0098","عرفات - مربع 95 - شاخص 2/649",1,0,1,21.367865,39.979502,"95","2/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0099","عرفات - مربع 95 - شاخص 14/649",1,0,1,21.365946,39.982599,"95","14/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0100","عرفات - مربع 95 - شاخص 12/649",1,0,1,21.366273,39.982302,"95","12/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0101","عرفات - مربع 95 - شاخص 10/649",1,0,1,21.366553,39.981642,"95","10/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0102","عرفات - مربع 113 - شاخص 10/647",1,0,1,21.365681,39.983102,"113","10/647","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0103","عرفات - مربع 113 - شاخص 17/649",1,0,1,21.363728,39.985795,"113","17/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0104","عرفات - مربع 113 - شاخص 16/647",1,0,1,21.364626,39.984988,"113","16/647","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0105","عرفات - مربع 113 - شاخص 15/649",1,0,1,21.36512,39.984606,"113","15/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0106","عرفات - مربع 113 - شاخص 14/647",1,0,1,21.365457,39.984246,"113","14/647","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0107","عرفات - مربع 113 - شاخص 13/649",1,0,1,21.36563,39.983672,"113","13/649","الراجحي B2C","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0108","عرفات - مربع 109 - شاخص 4/611",1,0,1,21.364471,39.986509,"28B","19/68","شركة فندق هوليدي إن بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0109","عرفات - مربع 8-22 - شاخص 5/550",1,0,1,21.366587,39.984057,"8-22","5/550","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0110","عرفات - مربع ? - شاخص ?",1,0,1,21.364388,39.986362,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0111","عرفات - مربع 91A - شاخص 24/616",1,0,1,21.368055,39.983759,"91A","24/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0112","عرفات - مربع 28 - شاخص 1/15",1,0,1,21.368457,39.989933,"28","1/15","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0113","عرفات - مربع 28B - شاخص 21/68",1,0,1,21.367401,39.988884,"28B","21/68","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0114","عرفات - مربع 28F - شاخص 27/68",1,0,1,21.367856,39.98983,"28F","27/68","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0115","عرفات - مربع 28A - شاخص 17/68",1,0,1,21.371227,39.990085,"28A","17/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0116","عرفات - مربع 28A - شاخص 15/68",1,0,1,21.368854,39.989424,"28A","15/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0117","عرفات - مربع 28D - شاخص 3/15",1,0,1,21.369549,39.990343,"28D","3/15","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0118","عرفات - مربع 108 - شاخص 9/610",1,0,1,21.37634,39.98767,"108","9/610","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0119","عرفات - مربع 108 - شاخص 11/610",1,0,1,21.376708,39.986715,"108","11/610","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0120","عرفات - مربع 108 - شاخص 3/610",1,0,1,21.375964,39.986076,"108","3/610","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0121","عرفات - مربع 108 - شاخص 2/608",1,0,1,21.374432,39.98839,"108","2/608","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0122","عرفات - مربع 108 - شاخص 4/612",1,0,1,21.374993,39.98762,"108","4/612","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0123","عرفات - مربع 107 - شاخص 5/612",1,0,1,21.375117,39.985242,"107","5/612","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0124","عرفات - مربع 107 - شاخص 7/612",1,0,1,21.374735,39.985748,"107","7/612","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0125","عرفات - مربع 107 - شاخص 8/614",1,0,1,21.374119,39.987018,"107","8/614","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0126","عرفات - مربع 107 - شاخص 11/612",1,0,1,21.373676,39.987442,"107","11/612","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0127","عرفات - مربع 107 - شاخص 2/614",1,0,1,21.375657,39.984517,"107","2/614","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0128","عرفات - مربع 107 - شاخص 1/612",1,0,1,21.376036,39.98344,"107","1/612","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0129","عرفات - مربع 105 - شاخص 3/604",1,0,1,21.370825,39.988604,"105","3/604","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0130","عرفات - مربع 106 - شاخص 2/604",1,0,1,21.372714,39.985808,"106","2/604","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0131","عرفات - مربع 106 - شاخص 1/602",1,0,1,21.373511,39.984965,"106","1/602","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0132","عرفات - مربع 106 - شاخص 7/613",1,0,1,21.373725,39.984486,"106","7/613","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0133","عرفات - مربع 106 - شاخص 6/611",1,0,1,21.373161,39.985331,"106","6/611","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0134","عرفات - مربع 106 - شاخص 4/604",1,0,1,21.372615,39.986348,"106","4/604","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0135","عرفات - مربع 105 - شاخص 1/604",1,0,1,21.371948,39.987564,"105","1/604","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0136","عرفات - مربع 106 - شاخص 9/613",1,0,1,21.372243,39.986837,"106","9/613","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0137","عرفات - مربع 109 - شاخص 5/613",1,0,1,21.374635,39.98302,"109","5/613","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0138","عرفات - مربع 109 - شاخص 2/611",1,0,1,21.37412,39.983523,"109","2/611","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0139","عرفات - مربع 103 - شاخص 6/622",1,0,1,21.369661,39.988451,"103","6/622","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0140","عرفات - مربع 102 - شاخص 1/618",1,0,1,21.370516,39.986452,"102","1/618","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0141","عرفات - مربع 102 - شاخص 4/620",1,0,1,21.371066,39.985841,"102","4/620","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0142","عرفات - مربع 102 - شاخص 5/618",1,0,1,21.371484,39.985045,"102","5/618","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0143","عرفات - مربع 102 - شاخص 8/620",1,0,1,21.371894,39.984736,"102","8/620","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0144","عرفات - مربع 103 - شاخص 1/620",1,0,1,21.370386,39.987327,"103","1/620","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0145","عرفات - مربع 103 - شاخص 4/622",1,0,1,21.369778,39.988002,"103","4/622","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0146","عرفات - مربع 102 - شاخص 3/608",1,0,1,21.372503,39.983988,"102","3/608","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0147","عرفات - مربع 105 - شاخص 15/613",1,0,1,21.373023,39.983001,"105","15/613","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0148","عرفات - مربع 105 - شاخص 13/613",1,0,1,21.3735,39.982414,"105","13/613","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0149","عرفات - مربع 105 - شاخص 11/613",1,0,1,21.37391,39.981417,"105","11/613","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0150","عرفات - مربع 103 - شاخص 2/616",1,0,1,21.372362,39.981195,"103","2/616","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0151","عرفات - مربع 103 - شاخص 7/620",1,0,1,21.372742,39.980521,"103","7/620","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0152","عرفات - مربع 100A - شاخص 13/608",1,0,1,21.372118,39.981616,"100A","13/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0153","عرفات - مربع 100A - شاخص 18/620",1,0,1,21.371651,39.982162,"100A","18/620","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0154","عرفات - مربع 100A - شاخص 9/608",1,0,1,21.371201,39.983325,"100A","9/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0155","عرفات - مربع 100A - شاخص 14/620",1,0,1,21.370755,39.983768,"100A","14/620","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0156","عرفات - مربع 98 - شاخص 19/608",1,0,1,21.368738,39.987233,"98","19/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0157","عرفات - مربع 98 - شاخص 17/608",1,0,1,21.368301,39.987973,"98","17/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0158","عرفات - مربع 99 - شاخص 4/616",1,0,1,21.369676,39.985579,"99","4/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0159","عرفات - مربع 100A - شاخص 5/608",1,0,1,21.370056,39.984862,"100A","5/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0160","عرفات - مربع 97 - شاخص 2/625",1,0,1,21.367288,39.986864,"97","2/625","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0161","عرفات - مربع 97 - شاخص 4/625",1,0,1,21.367838,39.986267,"97","4/625","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0162","عرفات - مربع 97 - شاخص 23/608",1,0,1,21.369202,39.983881,"97","23/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0163","عرفات - مربع 97 - شاخص 25/608",1,0,1,21.369796,39.98312,"97","25/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0164","عرفات - مربع 98 - شاخص 12/616",1,0,1,21.370367,39.982142,"98","12/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0165","عرفات - مربع 98 - شاخص 10/616",1,0,1,21.370923,39.980866,"98","10/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0166","عرفات - مربع 98 - شاخص 8/616",1,0,1,21.371302,39.980326,"98","8/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0167","عرفات - مربع 98 - شاخص 15/608",1,0,1,21.371856,39.979776,"98","15/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0168","عرفات - مربع 91A - شاخص 22/616",1,0,1,21.368722,39.98266,"91A","22/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0169","عرفات - مربع 91A - شاخص 20/616",1,0,1,21.368971,39.98206,"91A","20/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0170","عرفات - مربع 91A - شاخص 27/608",1,0,1,21.36951,39.981162,"91A","27/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0171","عرفات - مربع 91A - شاخص 29/608",1,0,1,21.370003,39.980287,"91A","29/608","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0172","عرفات - مربع 97 - شاخص 18/616",1,0,1,21.370588,39.97951,"97","18/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0173","عرفات - مربع 8-17 - شاخص 4/547",1,0,1,21.366789,39.98631,"8-17","4/547","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0174","عرفات - مربع 8-17 - شاخص 2/547",1,0,1,21.36678,39.985417,"8-17","2/547","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0175","عرفات - مربع 8-16 - شاخص 2/542",1,0,1,21.367346,39.984779,"8-16","2/542","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0176","عرفات - مربع 8-20 - شاخص 2/548",1,0,1,21.369698,39.979065,"8-20","2/548","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0177","عرفات - مربع 8-20 - شاخص 4/548",1,0,1,21.36902,39.979831,"8-20","4/548","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0178","عرفات - مربع 8-21 - شاخص 1/548",1,0,1,21.36857,39.980778,"8-21","1/548","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0179","عرفات - مربع 8-22 - شاخص 1/550",1,0,1,21.367966,39.981917,"8-22","1/550","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0180","عرفات - مربع 92 - شاخص 4/655",1,0,1,21.361373,39.986708,"92","4/655","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0181","عرفات - مربع 94 - شاخص 8/655",1,0,1,21.362977,39.98481,"94","8/655","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0182","عرفات - مربع 92 - شاخص 6/655",1,0,1,21.361846,39.986035,"92","6/655","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0183","عرفات - مربع 94 - شاخص 1/655",1,0,1,21.363342,39.984151,"94","1/655","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0184","عرفات - مربع 114A - شاخص 10/651",1,0,1,21.364634,39.982161,"114A","10/651","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0185","عرفات - مربع 114A - شاخص 8/88",1,0,1,21.364387,39.981621,"115A","22/651","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0186","عرفات - مربع 114A - شاخص 14/651",1,0,1,21.365355,39.981169,"114A","8/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0187","عرفات - مربع 114A - شاخص 18/651",1,0,1,21.3659,39.980067,"114A","18/651","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0188","عرفات - مربع 114A - شاخص 4/88",1,0,1,21.365506,39.980437,"114A","14/651","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0189","عرفات - مربع 115B - شاخص 20/649",1,0,1,21.367005,39.977457,"115B","20/649","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0190","عرفات - مربع 115A - شاخص 20/651",1,0,1,21.3671,39.978598,"115A","20/651","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0191","عرفات - مربع 93 - شاخص 7/88",1,0,1,21.359413,39.986655,"93","7/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0192","عرفات - مربع 93 - شاخص 11/88",1,0,1,21.359235,39.986117,"93","11/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0193","عرفات - مربع 93 - شاخص 13/88",1,0,1,21.360174,39.985282,"93","13/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0194","عرفات - مربع 93 - شاخص 3/88",1,0,1,21.359184,39.987785,"93","3/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0195","عرفات - مربع 9-1 - شاخص 17-19-21/88",1,0,1,21.360647,39.984925,"9-1","17-19-21/88","شركة الرفادة لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0196","عرفات - مربع 9-5 - شاخص 4/552",1,0,1,21.361652,39.98314,"9-5","4/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0197","عرفات - مربع 9-2 - شاخص 1/561",1,0,1,21.360784,39.984268,"9-2","1/561","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0198","عرفات - مربع 9-2 - شاخص 2/561",1,0,1,21.361278,39.983732,"9-2","2/561","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0199","عرفات - مربع 9-5 - شاخص 6/552",1,0,1,21.361821,39.982668,"9-5","6/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0200","عرفات - مربع 9-5 - شاخص 2/552",1,0,1,21.361366,39.983404,"9-5","2/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0201","عرفات - مربع 9-6 - شاخص 7/552",1,0,1,21.363351,39.981186,"9-6","5/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0202","عرفات - مربع 9-6 - شاخص 3/552",1,0,1,21.362369,39.981753,"9-6","3/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0203","عرفات - مربع 9-6 - شاخص 5/552",1,0,1,21.362723,39.981188,"9-6","7/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0204","عرفات - مربع 9-6 - شاخص 1/552",1,0,1,21.362169,39.982172,"9-6","1/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0205","عرفات - مربع 9-7 - شاخص 4/554",1,0,1,21.364226,39.978417,"9-7","4/554","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0206","عرفات - مربع 9-6 - شاخص 11/552",1,0,1,21.363686,39.979311,"9-6","11/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0207","عرفات - مربع 9-6 - شاخص 9/552",1,0,1,21.363305,39.979693,"9-6","9/552","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0208","عرفات - مربع 9-7 - شاخص 2/554",1,0,1,21.364103,39.9789,"9-7","2/554","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0209","عرفات - مربع 9-7 - شاخص 6/554",1,0,1,21.364411,39.977865,"9-7","6/554","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0210","عرفات - مربع 9-8 - شاخص 5/554",1,0,1,21.365243,39.977532,"9-8","5/554","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0211","عرفات - مربع 9-8 - شاخص 7/554",1,0,1,21.365657,39.977025,"9-8","7/554","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0212","عرفات - مربع 114B - شاخص 16/649",1,0,1,21.365259,39.97649,"114B","16/649","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0213","عرفات - مربع 7-1B - شاخص A3/527",1,0,1,21.357405,39.983801,"7-1B","A3/527","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0214","عرفات - مربع 8-3 - شاخص 5/524",1,0,1,21.351769,39.994341,"8-3","5/524","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0215","عرفات - مربع 8-9 - شاخص 16/524",1,0,1,21.354906,39.993315,"8-9","16/524","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0216","عرفات - مربع 8-9 - شاخص 12/524",1,0,1,21.35407,39.994555,"8-9","12/524","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0217","عرفات - مربع 79 - شاخص 16/421",1,0,1,21.349899,39.994802,"79","16/421","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0218","عرفات - مربع 79 - شاخص 10/421",1,0,1,21.349403,39.995862,"79","10/421","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0219","عرفات - مربع 79 - شاخص 18/421",1,0,1,21.350658,39.993707,"79","18/421","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0220","عرفات - مربع 86 - شاخص 13/406",1,0,1,21.35116,39.992772,"86","13/406","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0221","عرفات - مربع 85 - شاخص 3/427",1,0,1,21.353634,39.988984,"85","3/427","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0222","عرفات - مربع 86 - شاخص 2/427",1,0,1,21.351569,39.991687,"86","3/421","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0223","عرفات - مربع 86 - شاخص 12/408",1,0,1,21.353006,39.989944,"86","12/408","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0224","عرفات - مربع 85 - شاخص 2/425",1,0,1,21.352329,39.988162,"85","2/425","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0225","عرفات - مربع 86 - شاخص 3/421",1,0,1,21.351952,39.991447,"86","2/427","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0226","عرفات - مربع 87 - شاخص 13/408",1,0,1,21.351329,39.989919,"87","13/408","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0227","عرفات - مربع 87 - شاخص 11/408",1,0,1,21.350781,39.990742,"87","11/408","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0228","عرفات - مربع 79 - شاخص 8/421",1,0,1,21.350528,39.9914,"79","8/421","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0229","عرفات - مربع 38 - شاخص E/206",1,0,1,21.346233,39.998174,"38","E/206","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0230","عرفات - مربع 90 - شاخص 57/68",1,0,1,21.350663,39.988373,"90","57/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0231","عرفات - مربع 90 - شاخص 55/68",1,0,1,21.351568,39.986521,"90","55/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0232","عرفات - مربع 90 - شاخص 28/608",1,0,1,21.351256,39.986943,"90","28/608","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0233","عرفات - مربع 90 - شاخص 26/608",1,0,1,21.352246,39.986017,"90","26/608","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0234","عرفات - مربع 90 - شاخص 24/608",1,0,1,21.35231,39.985749,"90","24/608","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0235","عرفات - مربع 87 - شاخص 9/408",1,0,1,21.348415,39.992741,"87","9/408","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0236","عرفات - مربع 87 - شاخص 5/408",1,0,1,21.347538,39.99626,"87","5/408","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0237","عرفات - مربع 87 - شاخص 1/408",1,0,1,21.347812,39.994004,"87","1/408","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0238","عرفات - مربع مواقع الامن العام - شاخص مواقع الامن العام",1,0,1,21.344622,39.996213,"مواقع الامن العام","مواقع الامن العام","مواقع الامن العام","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0239","عرفات - مربع مواقع الامن العام - شاخص مواقع الامن العام",1,0,1,21.344501,39.996677,"مواقع الامن العام","مواقع الامن العام","مواقع الامن العام","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0240","عرفات - مربع 42 - شاخص 19/62",1,0,1,21.344993,39.993551,"42","19/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0241","عرفات - مربع 42 - شاخص 17/62",1,0,1,21.344639,39.994363,"42","17/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0242","عرفات - مربع 42 - شاخص 15/62",1,0,1,21.344098,39.995353,"42","15/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0243","عرفات - مربع 42 - شاخص 24/204",1,0,1,21.348083,39.990141,"42","24/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0244","عرفات - مربع 42 - شاخص 22/204",1,0,1,21.347289,39.990378,"42","22/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0245","عرفات - مربع 43 - شاخص 26/204",1,0,1,21.348596,39.989866,"43","26/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0246","عرفات - مربع 43 - شاخص 28/204",1,0,1,21.349139,39.988855,"43","28/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0247","عرفات - مربع 42 - شاخص 20/204",1,0,1,21.34674,39.990791,"42","20/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0248","عرفات - مربع 42 - شاخص 18/204",1,0,1,21.346332,39.991428,"42","18/204","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0249","عرفات - مربع 28E - شاخص 9/210",1,0,1,21.348741,39.986091,"28E","9/210","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0250","عرفات - مربع 28E - شاخص 3/210",1,0,1,21.347943,39.985748,"28E","3/210","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0251","عرفات - مربع 101A - شاخص 11/210",1,0,1,21.351406,39.9843,"101A","11/210","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0252","عرفات - مربع 101 - شاخص 39/68",1,0,1,21.350248,39.986025,"101","39/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0253","عرفات - مربع 101 - شاخص 37/68",1,0,1,21.350523,39.98513,"101","37/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0254","عرفات - مربع 38 - شاخص B/204",1,0,1,21.358141,39.974793,"80","18/406","مجموعة سيرا","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0255","عرفات - مربع 20 - شاخص 4/116",1,0,1,21.357607,39.973608,"38","B/204","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0256","عرفات - مربع 39 - شاخص 9/204",1,0,1,21.354982,39.977851,"39","9/204","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0257","عرفات - مربع 36 - شاخص 37/204",1,0,1,21.352994,39.978576,"36","37/204","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0258","عرفات - مربع 36 - شاخص 26/206",1,0,1,21.353042,39.977862,"36","26/206","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0259","عرفات - مربع 36 - شاخص 43/204",1,0,1,21.351247,39.980899,"36","43/204","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0260","عرفات - مربع 36 - شاخص 28/206",1,0,1,21.352673,39.979288,"36","28/206","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0261","عرفات - مربع 36 - شاخص 39/204",1,0,1,21.351976,39.979598,"36","39/204","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0262","عرفات - مربع 36 - شاخص 30/206",1,0,1,21.351883,39.980089,"36","30/206","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0263","عرفات - مربع 36 - شاخص 41/204",1,0,1,21.351638,39.9805,"36","41/204","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0264","عرفات - مربع 37 - شاخص 33/204",1,0,1,21.35393,39.976255,"37","33/204","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0265","عرفات - مربع 49 - شاخص 8/62",1,0,1,21.355088,39.974801,"49","8/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0266","عرفات - مربع 32 - شاخص 7/206",1,0,1,21.355722,39.973433,"32","7/206","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0267","عرفات - مربع 32 - شاخص 5/206",1,0,1,21.356041,39.972754,"32","5/206","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0268","عرفات - مربع 32 - شاخص 13/206",1,0,1,21.355467,39.974256,"32","13/206","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0269","عرفات - مربع 37 - شاخص 24/206",1,0,1,21.35392,39.977017,"37","24/206","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0270","عرفات - مربع 7-9B - شاخص 27-36/533",1,0,1,21.349972,39.976075,"7-9B","27-36/533","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0271","عرفات - مربع 38 - شاخص C/206",1,0,1,21.349622,39.977459,"38","C/206","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0272","عرفات - مربع 30 - شاخص 29/68",1,0,1,21.348792,39.978332,"30","29/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0273","عرفات - مربع 30 - شاخص 31/68",1,0,1,21.34918,39.978122,"30","31/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0274","عرفات - مربع 41 - شاخص 9/62",1,0,1,21.353606,39.973944,"41","9/62","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0275","عرفات - مربع 41 - شاخص 12/204",1,0,1,21.352838,39.975182,"41","12/204","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0276","عرفات - مربع 41 - شاخص 8/204",1,0,1,21.349474,39.980934,"41","8/204","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0277","عرفات - مربع 41 - شاخص 11/62",1,0,1,21.351584,39.977194,"41","11/62","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0278","عرفات - مربع 41 - شاخص 14/204",1,0,1,21.352016,39.976264,"41","14/204","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0279","عرفات - مربع 43 - شاخص 9/202",1,0,1,21.343798,39.982252,"43","9/202","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0280","عرفات - مربع 104A - شاخص 5/616",1,0,1,21.345697,39.97889,"104A","5/616","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0281","عرفات - مربع 111 - شاخص 3/639",1,0,1,21.344747,39.980592,"111","3/639","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0282","عرفات - مربع 104A - شاخص 3/616",1,0,1,21.346277,39.978547,"104A","3/616","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0283","عرفات - مربع 111 - شاخص 6/25",1,0,1,21.345303,39.979924,"111","6/25","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0284","عرفات - مربع 111 - شاخص 4/25",1,0,1,21.344477,39.981993,"49","4/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0285","عرفات - مربع 104A - شاخص 1/628",1,0,1,21.345442,39.979542,"104A","1/628","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0286","عرفات - مربع 88B - شاخص 44/68",1,0,1,21.34374,39.980045,"88B","44/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0287","عرفات - مربع 88B - شاخص 48/68",1,0,1,21.343351,39.98097,"111","4/25","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0288","عرفات - مربع 88B - شاخص 50/68",1,0,1,21.34096,39.987401,"88A","52/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0289","عرفات - مربع 88A - شاخص 54/68",1,0,1,21.342373,39.987347,"88A","54/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0290","عرفات - مربع 88A - شاخص 56/68",1,0,1,21.342923,39.987892,"88A","56/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0291","عرفات - مربع 88A - شاخص 58/68",1,0,1,21.343469,39.988721,"88A","58/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0292","عرفات - مربع 88B - شاخص 4/207",1,0,1,21.34356,39.98484,"88B","4/207","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0293","عرفات - مربع 88B - شاخص 2/207",1,0,1,21.342854,39.985764,"88B","2/207","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0294","عرفات - مربع 40 - شاخص 6/204",1,0,1,21.340362,39.993813,"40","6/204","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0295","عرفات - مربع 28 - شاخص 2/15",1,0,1,21.339263,39.992717,"28","2/15","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0296","عرفات - مربع 39 - شاخص 5/204",1,0,1,21.340235,39.992738,"39","5/204","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0297","عرفات - مربع 29A - شاخص 2/204",1,0,1,21.339609,39.993144,"29A","2/204","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0298","عرفات - مربع 122 - شاخص 12/643",1,0,1,21.339243,39.993919,"122","12/643","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0299","عرفات - مربع 122 - شاخص 3/652",1,0,1,21.341186,39.9926,"122","3/652","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0300","عرفات - مربع 122 - شاخص 14/643",1,0,1,21.340294,39.991406,"122","14/643","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0301","عرفات - مربع 47 - شاخص 24/62",1,0,1,21.338221,39.990918,"47","24/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0302","عرفات - مربع 48 - شاخص 13/56",1,0,1,21.33905,39.991248,"48","13/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0303","عرفات - مربع 122 - شاخص 16/643",1,0,1,21.338507,39.989916,"122","16/643","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0304","عرفات - مربع 48 - شاخص 16/62",1,0,1,21.339112,39.989394,"48","16/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0305","عرفات - مربع 48 - شاخص 17/56",1,0,1,21.337623,39.991759,"48","17/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0306","عرفات - مربع 48 - شاخص 20/62",1,0,1,21.338163,39.992218,"48","20/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0307","عرفات - مربع 48 - شاخص 7/56",1,0,1,21.337263,39.987167,"48","7/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0308","عرفات - مربع 123 - شاخص 7/643",1,0,1,21.336469,39.987727,"123","7/643","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0309","عرفات - مربع 123 - شاخص 8/641",1,0,1,21.336231,39.986823,"123","8/641","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0310","عرفات - مربع 49 - شاخص 10/62",1,0,1,21.337794,39.987294,"49","10/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0311","عرفات - مربع 48 - شاخص 12/62",1,0,1,21.338071,39.98842,"48","12/62","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0312","عرفات - مربع 47 - شاخص 21/56",1,0,1,21.337384,39.988862,"47","21/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0313","عرفات - مربع 48 - شاخص 9/56",1,0,1,21.336777,39.989996,"48","9/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0314","عرفات - مربع 34 - شاخص 25/206",1,0,1,21.344291,39.976154,"38","F/204","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0315","عرفات - مربع 34 - شاخص 23/206",1,0,1,21.344446,39.974926,"34","23/206","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0316","عرفات - مربع 34 - شاخص 21/206",1,0,1,21.344979,39.97435,"34","21/206","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0317","عرفات - مربع 34 - شاخص 19/206",1,0,1,21.345933,39.974011,"34","19/206","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0318","عرفات - مربع 35B - شاخص 47/68",1,0,1,21.34704,39.971497,"35B","47/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0319","عرفات - مربع 35A - شاخص 40/68",1,0,1,21.346636,39.972333,"35A","40/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0320","عرفات - مربع 34 - شاخص 34/68",1,0,1,21.346516,39.97282,"34","34/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0321","عرفات - مربع 34 - شاخص 17/206",1,0,1,21.346239,39.973344,"34","17/206","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0322","عرفات - مربع 38 - شاخص D/204",1,0,1,21.340611,39.9777,"101C","18A/608","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0323","عرفات - مربع 33 - شاخص 1/206",1,0,1,21.354571,39.975415,"33","1/206","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0324","عرفات - مربع 11 - شاخص 1/114",1,0,1,21.356814,39.974546,"20","4/116","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0325","عرفات - مربع 7-1B - شاخص A2/527",1,0,1,21.356648,39.985882,"7-1B","A2/527","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0326","عرفات - مربع 7-1B - شاخص A1/527",1,0,1,21.35726,39.986297,"7-1B","A1/527","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0327","عرفات - مربع 17 - شاخص 1/116",1,0,1,21.34649,39.999118,"17","1/116","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0328","عرفات - مربع 17 - شاخص 3/116",1,0,1,21.345762,39.999254,"17","3/116","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0329","عرفات - مربع 8-7 - شاخص 14/520",1,0,1,21.344593,39.992355,"8-7","14/520","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0330","عرفات - مربع 8-7 - شاخص 7/518",1,0,1,21.345953,39.988767,"8-7","7/518","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0331","عرفات - مربع 28C - شاخص 25/68",1,0,1,21.369236,39.990227,"28C","25/68","مشارق الذهبية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0332","عرفات - مربع 115A - شاخص 24/651",1,0,1,21.366134,39.979629,"114A","4/88","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0333","عرفات - مربع 115A - شاخص 22/651",1,0,1,21.366649,39.979031,"115A","24/651","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0334","عرفات - مربع 94 - شاخص 12/88",1,0,1,21.36457,39.982742,"94","12/88","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0335","عرفات - مربع 94 - شاخص 5/655",1,0,1,21.363933,39.983209,"94","5/655","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0336","عرفات - مربع 110 - شاخص 4/613",1,0,1,21.377586,39.988251,"110","4/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0337","عرفات - مربع 110 - شاخص 6/613",1,0,1,21.376738,39.989523,"110","6/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0338","عرفات - مربع 110 - شاخص 2/613",1,0,1,21.378015,39.987545,"110","2/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0339","عرفات - مربع 109 - شاخص 3/613",1,0,1,21.37474,39.982596,"109","3/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0340","عرفات - مربع 117E - شاخص 8/631",1,0,1,21.341062,39.984034,"117E","8/631","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0341","عرفات - مربع 117D - شاخص 4/634",1,0,1,21.34236,39.983955,"117D","4/634","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0342","عرفات - مربع 117E - شاخص 3/633",1,0,1,21.341253,39.98338,"117E","3/633","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0343","عرفات - مربع 117E - شاخص 4/631",1,0,1,21.341643,39.985182,"117E","4/631","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0344","عرفات - مربع 118 - شاخص 13/25",1,0,1,21.343358,39.983368,"118","13/25","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0345","عرفات - مربع 118 - شاخص 4/637",1,0,1,21.342789,39.981581,"88B","48/68","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0346","عرفات - مربع 118 - شاخص 9/25",1,0,1,21.342264,39.982986,"118","9/25","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0347","عرفات - مربع 118 - شاخص 11/25",1,0,1,21.341936,39.982389,"118","11/25","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0348","عرفات - مربع 117D - شاخص 2/634",1,0,1,21.343037,39.98428,"117D","2/634","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0349","عرفات - مربع 38 - شاخص S/204",1,0,1,21.346766,39.983708,"38","S/204","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0350","عرفات - مربع 8-1 - شاخص 1/530",1,0,1,21.351559,39.974083,"8-1","1/530","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0351","عرفات - مربع 8-1 - شاخص 3/530",1,0,1,21.351653,39.973251,"8-1","3/530","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0352","عرفات - مربع 8-2 - شاخص 2/530",1,0,1,21.350634,39.97413,"8-2","2/530","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0353","عرفات - مربع 120 - شاخص 10/643",1,0,1,21.341501,39.978177,"120","10/643","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0354","عرفات - مربع 120 - شاخص 6/643",1,0,1,21.340571,39.978414,"120","6/643","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0355","عرفات - مربع 120 - شاخص 8/643",1,0,1,21.34003,39.97922,"120","8/643","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0356","عرفات - مربع 120 - شاخص 4/643",1,0,1,21.341456,39.980733,"120","4/643","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0357","عرفات - مربع 8-2 - شاخص 4/530",1,0,1,21.350829,39.975249,"8-2","4/530","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0358","عرفات - مربع 15 - شاخص 6/114",1,0,1,21.344812,39.995686,"15","6/114","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0359","عرفات - مربع 8-10 - شاخص 4/529",1,0,1,21.343932,39.993638,"8-10","4/529","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0360","عرفات - مربع 97 - شاخص 6/625",1,0,1,21.368307,39.985556,"97","6/625","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0361","عرفات - مربع 99 - شاخص 13/620",1,0,1,21.36919,39.986406,"99","13/620","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0362","عرفات - مربع 97 - شاخص 21/608",1,0,1,21.368898,39.984559,"97","21/608","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0363","عرفات - مربع 116 - شاخص 21/649",1,0,1,21.359956,39.983077,"116","21/649","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0364","عرفات - مربع 119 - شاخص 4/641",1,0,1,21.358098,39.98829,"119","4/641","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0365","عرفات - مربع 119 - شاخص 2/641",1,0,1,21.358286,39.989202,"119","2/641","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0366","عرفات - مربع 16 - شاخص 2/116",1,0,1,21.354852,39.980144,"12F","2/102","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0367","عرفات - مربع 39 - شاخص 11/204",1,0,1,21.354729,39.978531,"39","11/204","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0368","عرفات - مربع 119 - شاخص 1/643",1,0,1,21.359022,39.984486,"119","1/643","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0369","عرفات - مربع 119 - شاخص 3/643",1,0,1,21.358451,39.985711,"119","3/643","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0370","عرفات - مربع 119 - شاخص 6/641",1,0,1,21.358074,39.986905,"119","6/641","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0371","عرفات - مربع 109 - شاخص 1/608",1,0,1,21.373138,39.988372,"109","1/608","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0372","عرفات - مربع 117C - شاخص 2/632",1,0,1,21.347965,39.978827,"117C","2/632","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0373","عرفات - مربع 117E - شاخص 1/631",1,0,1,21.347183,39.982632,"117E","1/631","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0374","عرفات - مربع 37 - شاخص 20/206",1,0,1,21.355209,39.979586,"37","20/206","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0375","عرفات - مربع 8-5 - شاخص 7/520",1,0,1,21.339708,39.990639,"8-5","7/520","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0376","عرفات - مربع 7-4 - شاخص 6/518",1,0,1,21.342776,39.989631,"7-4","6/518","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0377","عرفات - مربع 8-7 - شاخص 16/520",1,0,1,21.344918,39.991506,"8-7","16/520","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0378","عرفات - مربع 8-6 - شاخص 5/518",1,0,1,21.340815,39.988133,"8-6","5/518","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0379","عرفات - مربع 89 - شاخص 53/68",1,0,1,21.344631,39.978721,"89","53/68","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0380","عرفات - مربع 89 - شاخص 51/68",1,0,1,21.345083,39.978096,"89","51/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0381","عرفات - مربع 118 - شاخص 2/637",1,0,1,21.339377,39.982536,"118","2/637","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0382","عرفات - مربع 8-7 - شاخص 20/520",1,0,1,21.343893,39.993245,"8-7","20/520","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0383","عرفات - مربع 8-8 - شاخص 16/522",1,0,1,21.346525,39.988423,"8-8","16/522","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0384","عرفات - مربع 8-7 - شاخص 18/520",1,0,1,21.344164,39.992911,"8-7","18/520","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0385","عرفات - مربع 7-4 - شاخص 5/510",1,0,1,21.342282,39.990076,"7-4","5/510","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0386","عرفات - مربع 7-4 - شاخص 7/510",1,0,1,21.342903,39.989112,"7-4","7/510","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0387","عرفات - مربع 6-4 - شاخص 6/502",1,0,1,21.337148,39.985512,"6-4","6/502","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0388","عرفات - مربع 6-7 - شاخص 1/504",1,0,1,21.337113,39.985626,"6-7","1/504","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0389","عرفات - مربع 8-6 - شاخص 6/520",1,0,1,21.341866,39.988425,"8-6","6/520","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0390","عرفات - مربع 8-6 - شاخص 4/520",1,0,1,21.342187,39.98869,"8-6","4/520","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0391","عرفات - مربع 8-6 - شاخص 2/520",1,0,1,21.339525,39.988705,"8-6","2/520","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0392","عرفات - مربع 8-5 - شاخص 6/522",1,0,1,21.342946,39.995381,"8-5","6/522","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0393","عرفات - مربع 8-5 - شاخص 3/520",1,0,1,21.34339,39.994353,"8-5","3/520","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0394","عرفات - مربع 8-6 - شاخص 1/518",1,0,1,21.340182,39.98782,"8-6","1/518","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0395","عرفات - مربع 8-6 - شاخص 3/518",1,0,1,21.340011,39.988428,"8-6","3/518","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0396","عرفات - مربع 8-6 - شاخص 8/520",1,0,1,21.341464,39.988268,"8-6","8/520","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0397","عرفات - مربع 8-4 - شاخص 3/522",1,0,1,21.343008,39.992503,"8-4","3/522","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0398","عرفات - مربع 8-23 - شاخص 80/68",1,0,1,21.345971,39.996435,"8-23","80/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0399","عرفات - مربع 8-23 - شاخص 82/68",1,0,1,21.346573,39.99542,"8-23","82/68","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0400","عرفات - مربع 7-4 - شاخص 8/518",1,0,1,21.342426,39.988303,"7-4","8/518","بشرى الضيافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0401","عرفات - مربع 7-4 - شاخص 2/518",1,0,1,21.344662,39.987084,"7-4","2/518","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0402","عرفات - مربع 7-4 - شاخص 4/518",1,0,1,21.34412,39.987541,"7-4","4/518","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0403","عرفات - مربع 7-4 - شاخص 3/510",1,0,1,21.342277,39.995955,"7-4","3/510","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0404","عرفات - مربع 7-4 - شاخص 1/510",1,0,1,21.342369,39.995665,"7-4","1/510","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0405","عرفات - مربع 8-14 - شاخص 6/529",1,0,1,21.356914,39.991467,"8-14","6/529","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0406","عرفات - مربع 118 - شاخص 7/637",1,0,1,21.339736,39.982937,"118","7/637","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0407","عرفات - مربع 118 - شاخص 5/637",1,0,1,21.340506,39.982223,"118","5/637","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0408","عرفات - مربع 118 - شاخص 3/637",1,0,1,21.340734,39.981972,"118","3/637","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0409","عرفات - مربع 36 - شاخص 32/206",1,0,1,21.344681,39.985607,"36","32/206","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0410","عرفات - مربع 8-9 - شاخص 9/522",1,0,1,21.341655,39.98138,"118","4/637","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0411","عرفات - مربع 101D - شاخص 6/216",1,0,1,21.342251,39.993316,"101D","6/216","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0412","عرفات - مربع 101D - شاخص 2/216",1,0,1,21.34166,39.994267,"101D","2/216","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0413","عرفات - مربع 8-5 - شاخص 2/522",1,0,1,21.341574,39.993774,"8-5","2/522","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0414","عرفات - مربع 49 - شاخص 6/62",1,0,1,21.344482,39.983364,"49","6/62","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0415","عرفات - مربع 49 - شاخص 3/56",1,0,1,21.346306,39.98263,"49","3/56","ام من ميلينوم","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0416","عرفات - مربع 117A - شاخص 7/25",1,0,1,21.343816,39.996058,"117A","7/25","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0417","عرفات - مربع 117B - شاخص 1/635",1,0,1,21.343174,39.996767,"117B","1/635","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0418","عرفات - مربع 37 - شاخص 25/204",1,0,1,21.352937,39.981353,"37","25/204","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0419","عرفات - مربع 37 - شاخص 16/206",1,0,1,21.353552,39.980478,"37","16/206","رواف منى","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0420","عرفات - مربع 109 - شاخص 1/613",1,0,1,21.375104,39.982152,"109","1/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0421","عرفات - مربع 8-4 - شاخص 4/524",1,0,1,21.341349,39.989487,"8-4","4/524","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0422","عرفات - مربع 90 - شاخص 30/608",1,0,1,21.347392,39.97376,"90","30/608","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0423","عرفات - مربع 7-13A - شاخص 1/535",1,0,1,21.345858,39.976561,"7-13A","1/535","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0424","عرفات - مربع 10 - شاخص 1/112",1,0,1,21.361619,39.990112,"10","1/112","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0425","عرفات - مربع 110 - شاخص 8/613",1,0,1,21.378722,39.986289,"110","8/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0426","عرفات - مربع 108 - شاخص 8/612",1,0,1,21.377488,39.985421,"108","8/612","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0427","عرفات - مربع 124 - شاخص 3/654",1,0,1,21.341517,39.991734,"124","1/654","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0428","عرفات - مربع 124 - شاخص 1/654",1,0,1,21.342112,39.991077,"124","3/654","رحلات ومنافع","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0429","عرفات - مربع 117E - شاخص 5/631",1,0,1,21.346612,39.975377,"117E","5/631","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0430","عرفات - مربع 117E - شاخص 6/631",1,0,1,21.339116,39.97968,"117E","6/631","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0431","عرفات - مربع 101B - شاخص 4/212",1,0,1,21.349883,39.987187,"101B","4/212","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0432","عرفات - مربع 101B - شاخص 2/212",1,0,1,21.349171,39.987348,"101B","2/212","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0433","عرفات - مربع 107 - شاخص 12/614",1,0,1,21.376813,39.98481,"107","12/614","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0434","عرفات - مربع 88A - شاخص 52/68",1,0,1,21.341724,39.987132,"88B","50/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0435","عرفات - مربع 8-22 - شاخص 3/550",1,0,1,21.367554,39.982418,"8-22","3/550","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0436","عرفات - مربع 86 - شاخص 11/406",1,0,1,21.360494,39.976783,"86","11/406","مناسك المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0437","عرفات - مربع 77 - شاخص 2-4-6/404",1,0,1,21.358332,39.980472,"77","2-4-6/404","شركة مناسك المشاعر لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0438","عرفات - مربع 82 - شاخص 5-6-10/406",1,0,1,21.356669,39.981461,"82","5-6-10/406","شركة مناسك المشاعر لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0439","عرفات - مربع 82-83 - شاخص 1/406",1,0,1,21.358673,39.977777,"7-5B","T8/527","مناسك المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0440","عرفات - مربع 9-4 - شاخص 5/563",1,0,1,21.358534,39.989907,"9-4","5/563","ابراج شركة مكه","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0441","عرفات - مربع 24014 - شاخص ?",1,0,1,21.358115,39.991964,"24014","","","","منطقة عرفات",""],["NSK-ARF-CMP-0442","عرفات - مربع 108 - شاخص 10/612",1,0,1,21.375373,39.989081,"108","10/612","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0443","عرفات - مربع 97 - شاخص 16/616",1,0,1,21.371023,39.978755,"97","16/616","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0444","عرفات - مربع مواقع الامن العام - شاخص مواقع الامن العام",1,0,1,21.359433,39.991421,"مواقع الامن العام","مواقع الامن العام","مواقع الامن العام","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0445","عرفات - مربع 92 - شاخص 2/655",1,0,1,21.360907,39.987559,"92","2/655","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0446","عرفات - مربع 92 - شاخص 14/88",1,0,1,21.359389,39.989451,"92","14/88","الرفادة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0447","عرفات - مربع 9-4 - شاخص 3/563",1,0,1,21.358851,39.990361,"9-4","3/563","حجاج المجاملة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0448","عرفات - مربع 7-5B - شاخص T5/527",1,0,1,21.361895,39.97619,"7-5B","T5/527","إثراء الجود","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0449","عرفات - مربع 42 - شاخص 13/62",1,0,1,21.346062,39.992187,"42","13/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0450","عرفات - مربع 42 - شاخص 23/62",1,0,1,21.346643,39.993153,"42","23/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0451","عرفات - مربع 42 - شاخص 21/62",1,0,1,21.345654,39.992759,"42","21/62","رفاد","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0452","عرفات - مربع 29 - شاخص 1/204",1,0,1,21.354162,39.973079,"11","1/114","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0453","عرفات - مربع 29 - شاخص 3/204",1,0,1,21.354891,39.972115,"16","2/116","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0454","عرفات - مربع مواقع الامن العام - شاخص مواقع الامن العام",1,0,1,21.340885,39.995531,"مواقع الامن العام","مواقع الامن العام","مواقع الامن العام","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0455","عرفات - مربع 39A - شاخص 16/68",1,0,1,21.34555,39.977053,"39A","16/68","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0456","عرفات - مربع 49 - شاخص 4/62",1,0,1,21.345318,39.984959,"8-9","9/522","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0457","عرفات - مربع 43 - شاخص 5/202",1,0,1,21.346194,39.981595,"43","5/202","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0458","عرفات - مربع 35C - شاخص 45/68",1,0,1,21.35049,39.971572,"29","3/204","إكرام الضيف","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0459","عرفات - مربع 91B - شاخص 59/68",1,0,1,21.350521,39.972812,"29","1/204","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0460","عرفات - مربع 118 - شاخص 1/637",1,0,1,21.346091,39.97585,"118","1/637","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0461","عرفات - مربع 31A - شاخص 33/68",1,0,1,21.347919,39.972978,"91B","59/68","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0462","عرفات - مربع 7-13 - شاخص 4-2/535",1,0,1,21.336893,39.983308,"7-13","4-2/535","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0463","عرفات - مربع 7-13B - شاخص 54/533",1,0,1,21.338184,39.982782,"7-13B","54/533","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0464","عرفات - مربع 7-9A - شاخص 4/533",1,0,1,21.339428,39.981182,"7-9A","4/533","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0465","عرفات - مربع 120 - شاخص 2/643",1,0,1,21.340494,39.979788,"120","2/643","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0466","عرفات - مربع 7-9A - شاخص 2/533",1,0,1,21.337133,39.982741,"7-9A","2/533","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0467","عرفات - مربع 7-5 - شاخص 12-14-16/518",1,0,1,21.340323,39.980877,"7-5","12-14-16/518","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0468","عرفات - مربع ? - شاخص ?",1,0,1,21.346089,39.976234,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0469","عرفات - مربع مواقع الامن العام - شاخص مواقع الامن العام",1,0,1,21.347596,39.999777,"مواقع الامن العام","مواقع الامن العام","سيف الاسلام","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0470","عرفات - مربع 105 - شاخص 1/611",1,0,1,21.366306,39.986855,"109","4/611","مخيمات الطوارئ","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0471","عرفات - مربع 17 - شاخص ?",1,0,1,21.347397,39.968182,"17","","ضيوف خادم الحرمين الشريفين","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0472","عرفات - مربع S1 - شاخص S1-A",1,0,1,21.347676,39.970022,"31A","33/68","شركة مشارق الماسية لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0473","عرفات - مربع ? - شاخص ?",1,0,1,21.360563,39.991159,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0474","عرفات - مربع ? - شاخص ?",1,0,1,21.340716,39.983269,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0475","عرفات - مربع ? - شاخص ?",1,0,1,21.345371,39.970283,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0476","عرفات - مربع 109 - شاخص 1/613",1,0,1,21.372821,39.988819,"109","1/613","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0477","عرفات - مربع 88B - شاخص 48/68",1,0,1,21.349844,39.972214,"35C","45/68","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0478","عرفات - مربع 97 - شاخص 18/616",1,0,1,21.367287,39.987584,"105","1/611","مشارق المتميزة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0479","عرفات - مربع 81 - شاخص 9/404",1,0,1,21.360763,39.974171,"82-83","1/406","شركة مناسك المشاعر لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0480","عرفات - مربع 81 - شاخص 9/404",1,0,1,21.36118,39.975625,"81","9/404","","","منطقة عرفات",""],["NSK-ARF-CMP-0481","عرفات - مربع 73B - شاخص B23",1,0,1,21.341152,39.962753,"73B","B23","إستضافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0482","عرفات - مربع 12D - شاخص 12-8-6/50",1,0,1,21.344885,39.959704,"12D","12-8-6/50","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0483","عرفات - مربع 27 - شاخص 9/68",1,0,1,21.342994,39.965309,"27","9/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0484","عرفات - مربع 27 - شاخص 4/124",1,0,1,21.342659,39.964779,"27","4/124","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0485","عرفات - مربع 27 - شاخص 2/124",1,0,1,21.341862,39.964807,"27","2/124","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0486","عرفات - مربع 23B - شاخص 7/68",1,0,1,21.342044,39.964224,"23B","7/68","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0487","عرفات - مربع 5-3 - شاخص D05",1,0,1,21.335089,39.974966,"5-3","D05","إستضافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0488","عرفات - مربع 51A - شاخص 12/56",1,0,1,21.33779,39.971528,"51A","12/56","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0489","عرفات - مربع 75D - شاخص 52/62",1,0,1,21.337442,39.973166,"75D","52/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0490","عرفات - مربع 75C - شاخص 43/56",1,0,1,21.338463,39.974228,"75C","43/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0491","عرفات - مربع 75D - شاخص 49/56",1,0,1,21.338691,39.973365,"75D","49/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0492","عرفات - مربع 7-6 - شاخص 1/519",1,0,1,21.33847,39.975404,"7-6","1/519","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0493","عرفات - مربع 75C - شاخص 46/62",1,0,1,21.339078,39.974783,"75C","46/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0494","عرفات - مربع 4-4 - شاخص 62/44",1,0,1,21.346702,39.962645,"4-4","62/44","وزارة الحج والعمرة حجاج داخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0495","عرفات - مربع 46 - شاخص 29/56",1,0,1,21.34445,39.968378,"46","29/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0496","عرفات - مربع 44 - شاخص 4/202",1,0,1,21.343234,39.971675,"44","4/202","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0497","عرفات - مربع 7-3 - شاخص 6/510",1,0,1,21.33734,39.978,"Null","","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0498","عرفات - مربع 78 - شاخص 53/62",1,0,1,21.335818,39.97908,"78","53/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0499","عرفات - مربع 78 - شاخص 51/62",1,0,1,21.33746,39.979149,"78","51/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0500","عرفات - مربع 78 - شاخص 57/62",1,0,1,21.337764,39.977648,"7-3","6/510","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0501","عرفات - مربع 78 - شاخص 49/62",1,0,1,21.337103,39.97724,"78","57/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0502","عرفات - مربع 44 - شاخص 8/202",1,0,1,21.342046,39.972589,"44","8/202","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0503","عرفات - مربع 44 - شاخص 33/62",1,0,1,21.342052,39.973869,"44","33/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0504","عرفات - مربع 75B - شاخص 39/56",1,0,1,21.340795,39.973546,"75B","39/56","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0505","عرفات - مربع 45 - شاخص 14/202",1,0,1,21.337112,39.970955,"45","14/202","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0506","عرفات - مربع 45 - شاخص 12/202",1,0,1,21.339864,39.971708,"45","12/202","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0507","عرفات - مربع 47 - شاخص 32/62",1,0,1,21.34454,39.96959,"47","32/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0508","عرفات - مربع 47 - شاخص 28/62",1,0,1,21.343541,39.968831,"47","28/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0509","عرفات - مربع 47 - شاخص 25/56",1,0,1,21.343869,39.969108,"47","25/56","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0510","عرفات - مربع 51B-46 - شاخص 24-35-36/56",1,0,1,21.342386,39.969744,"101C","18/608","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0511","عرفات - مربع 74B - شاخص 38/56",1,0,1,21.337605,39.972846,"74B","38/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0512","عرفات - مربع 59C - شاخص 14-41/44-38",1,0,1,21.341138,39.966979,"59C","14-41/44-38","شركة فندق ابراج شركة مكه الفندقية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0513","عرفات - مربع 59C - شاخص 10-12-37/44",1,0,1,21.341531,39.96551,"59C","10-12-37/44","شركة فندق ابراج شركة مكه الفندقية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0514","عرفات - مربع 52 - شاخص 46/50",1,0,1,21.338885,39.969925,"52","46/50","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0515","عرفات - مربع 53 - شاخص 40-5/50",1,0,1,21.338186,39.969321,"7-9","2/521","","","منطقة عرفات",""],["NSK-ARF-CMP-0516","عرفات - مربع 52-53 - شاخص 9-42/44",1,0,1,21.339592,39.968432,"53","40-5/50","شركة فندق ابراج شركة مكه الفندقية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0517","عرفات - مربع 52 - شاخص 44/50",1,0,1,21.339489,39.970525,"52","44/50","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0518","عرفات - مربع 12D - شاخص 4/50",1,0,1,21.342554,39.961455,"12D","4/50","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0519","عرفات - مربع 2 - شاخص B05",1,0,1,21.344273,39.958623,"2","B05","إستضافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0520","عرفات - مربع 72B - شاخص 56/50",1,0,1,21.340728,39.963537,"72B","56/50","شركة الطائفين","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0521","عرفات - مربع 68 - شاخص B20",1,0,1,21.340123,39.965171,"68","B20","إستضافة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0522","عرفات - مربع 70 - شاخص 28A/44",1,0,1,21.338126,39.968333,"70","28A/44","وزارة الحج والعمرة حجاج داخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0523","عرفات - مربع 44 - شاخص 29/62",1,0,1,21.342575,39.97187,"44","29/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0524","عرفات - مربع 44 - شاخص 25/62",1,0,1,21.342481,39.971318,"44","25/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0525","عرفات - مربع 75B - شاخص 42/62",1,0,1,21.341759,39.970959,"75B","42/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0526","عرفات - مربع 45 - شاخص 16/202",1,0,1,21.342385,39.970849,"45","16/202","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0527","عرفات - مربع 75A - شاخص 43/62",1,0,1,21.343599,39.967307,"75A","43/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0528","عرفات - مربع 7-3 - شاخص 8/510",1,0,1,21.340907,39.975613,"7-3","8/510","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0529","عرفات - مربع 7-5 - شاخص 10/518",1,0,1,21.340794,39.97506,"7-5","10/518","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0530","عرفات - مربع 7-3 - شاخص 5/508",1,0,1,21.340529,39.974939,"7-3","5/508","مشارق الماسية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0531","عرفات - مربع 45 - شاخص 39/62",1,0,1,21.34054,39.972169,"45","39/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0532","عرفات - مربع 7-2 - شاخص 1-2-4/513",1,0,1,21.339106,39.975847,"7-2","1-2-4/513","شركة اثراء الخير لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0533","عرفات - مربع 74B - شاخص 34/56",1,0,1,21.338191,39.972058,"74B","34/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0534","عرفات - مربع 74B - شاخص 36/56",1,0,1,21.33847,39.972052,"74B","36/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0535","عرفات - مربع 72B - شاخص 52/50",1,0,1,21.33695,39.965041,"72B","52/50","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0536","عرفات - مربع 7-5A - شاخص 10/513",1,0,1,21.337121,39.969377,"7-5A","10/513","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0537","عرفات - مربع 7-8 - شاخص 7/521",1,0,1,21.336785,39.968935,"7-8","7/521","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0538","عرفات - مربع 7-1 - شاخص 4/513",1,0,1,21.337303,39.968894,"7-1","4/513","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0539","عرفات - مربع 7-1 - شاخص 6/513",1,0,1,21.336948,39.968697,"7-1","6/513","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0540","عرفات - مربع 7-8 - شاخص 9/521",1,0,1,21.336303,39.969328,"7-8","9/521","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0541","عرفات - مربع 7-5A - شاخص 8/513",1,0,1,21.33594,39.969852,"7-5A","8/513","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0542","عرفات - مربع 7-1A - شاخص 63/62",1,0,1,21.335832,39.968831,"7-1A","63/62","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0543","عرفات - مربع 51A - شاخص 16/56",1,0,1,21.336143,39.96637,"51A","16/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0544","عرفات - مربع 7-1A - شاخص 59-61/62",1,0,1,21.334965,39.969747,"7-1A","59-61/62","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0545","عرفات - مربع 51B - شاخص 20/56",1,0,1,21.345287,39.968005,"51B","20/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0546","عرفات - مربع 23B - شاخص 3/115",1,0,1,21.343486,39.964582,"23B","3/115","ضيوف البيت","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0547","عرفات - مربع 7-7 - شاخص 1-3-5/521",1,0,1,21.335697,39.967541,"7-7","1-3-5/521","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0548","عرفات - مربع 7-9 - شاخص 8-6-4-2/521",1,0,1,21.336411,39.967694,"7-9","8-6-4-2/521","شركة الراجحي للخدمات التجارية المساندة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0549","عرفات - مربع 78 - شاخص 55/62",1,0,1,21.339638,39.976557,"78","55/62","اثراء الخير","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0550","عرفات - مربع 7-3 - شاخص 4/510",1,0,1,21.340103,39.975453,"7-3","4/510","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0551","عرفات - مربع 7-3 - شاخص 2/510",1,0,1,21.337457,39.978644,"7-3","2/510","دليل الزوار","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0552","عرفات - مربع 7-3 - شاخص 3/508",1,0,1,21.337144,39.979935,"7-3","3/508","يسر المشاعر","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0553","عرفات - مربع ? - شاخص ?",1,0,1,21.338235,39.966314,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0554","عرفات - مربع 28B - شاخص 19/68",1,0,1,21.365742,39.989337,"97","18/616","هوليدي ان بكة","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0555","عرفات - مربع 68 - شاخص 66C/38",1,0,1,21.338436,39.965437,"68","66C/38","شركة تفويج المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0556","عرفات - مربع 6-3 - شاخص D12",1,0,1,21.335562,39.971464,"6-3","D12","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0557","عرفات - مربع 4-2 - شاخص 4/716",1,0,1,21.336548,39.970356,"4-2","4/716","شركة المهابة لخدمة حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0558","عرفات - مربع B1 - شاخص B1",1,0,1,21.345659,39.959142,"B1","B1","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0559","عرفات - مربع 2 - شاخص 1/301",1,0,1,21.344029,39.963158,"2","1/301","شركة محمد وعبدالرحمن أحمد الحميري","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0560","عرفات - مربع 6-2 - شاخص D04",1,0,1,21.335286,39.973969,"6-2","D04","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0561","عرفات - مربع 5-2 - شاخص 27/50",1,0,1,21.33612,39.973476,"5-2","27/50","شركة البدر القادم المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0562","عرفات - مربع 4-1 - شاخص 1/716",1,0,1,21.335507,39.973735,"4-1","1/716","شركة نور النسك لخدمات الحجاج","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0563","عرفات - مربع 6-5 - شاخص D15",1,0,1,21.34814,39.962634,"6-5","D15","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0564","عرفات - مربع 5-6 - شاخص D19",1,0,1,21.34855,39.961493,"5-6","D19","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0565","عرفات - مربع 2 - شاخص 22/50",1,0,1,21.348813,39.962964,"2","22/50","شركة إفاضه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0566","عرفات - مربع 26A - شاخص A06",1,0,1,21.347344,39.961933,"26A","A06","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0567","عرفات - مربع 26B - شاخص A05",1,0,1,21.348477,39.96087,"26B","A05","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0568","عرفات - مربع 5-6 - شاخص D18",1,0,1,21.348881,39.96022,"5-6","D18","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0569","عرفات - مربع 12B - شاخص B02",1,0,1,21.349715,39.960828,"12B","B02","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0570","عرفات - مربع 6-7 - شاخص 2/504",1,0,1,21.346116,39.969087,"6-7","2/504","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0571","عرفات - مربع 18A - شاخص 10/68",1,0,1,21.346338,39.957251,"18A","10/68","شركة طوائف التضامنية","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0572","عرفات - مربع 26A - شاخص A07",1,0,1,21.344688,39.958121,"26A","A07","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0573","عرفات - مربع B6 - شاخص B6",1,0,1,21.344622,39.960327,"B6","B6","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0574","عرفات - مربع A4 - شاخص A4",1,0,1,21.344303,39.960954,"A4","A4","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0575","عرفات - مربع 68 - شاخص 66B/38",1,0,1,21.339213,39.965247,"68","66B/38","شركة الاسلام المتحدة لخدمات حجاج الداخل والمعتمرين","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0576","عرفات - مربع 73C - شاخص 0/50",1,0,1,21.33855,39.965137,"73C","0/50","شركة محسن بن سالم الأحمدي وشركاه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0577","عرفات - مربع 74A - شاخص B18",1,0,1,21.343275,39.966937,"74A","B18","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0578","عرفات - مربع 74A - شاخص B19",1,0,1,21.342517,39.967853,"74A","B19","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0579","عرفات - مربع 6-1 - شاخص 1/502",1,0,1,21.336553,39.973067,"6-1","1/502","شركة الهجرة العربية المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0580","عرفات - مربع 5-1 - شاخص 21/50",1,0,1,21.336168,39.970482,"5-1","21/50","شركة الإفاضة المتحدة للخدمات المحدوده","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0581","عرفات - مربع 5-1 - شاخص 25/50",1,0,1,21.334365,39.971563,"5-1","25/50","شركة سعد بن ابراهيم الحويجي وشركاه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0582","عرفات - مربع 5-2 - شاخص D11",1,0,1,21.335466,39.973082,"5-2","D11","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0583","عرفات - مربع 5-4 - شاخص D06",1,0,1,21.336284,39.972545,"5-4","D06","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0584","عرفات - مربع A5 - شاخص A5",1,0,1,21.345816,39.958182,"A5","A5","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0585","عرفات - مربع B2 - شاخص B2",1,0,1,21.346691,39.958856,"B2","B2","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0586","عرفات - مربع 5-9 - شاخص 1B/720",1,0,1,21.345995,39.965832,"5-9","1B/720","شركة الراجحي لخدمات حجاج الداخل المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0587","عرفات - مربع 4-4 - شاخص 97/38",1,0,1,21.345677,39.965243,"4-4","97/38","شركة هشام بن بدوي سكيك وشركاه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0588","عرفات - مربع 4-5 - شاخص 51/44",1,0,1,21.345514,39.964255,"4-5","51/44","شركة الفجر","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0589","عرفات - مربع 5-7 - شاخص D20",1,0,1,21.344195,39.965606,"5-7","D20","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0590","عرفات - مربع 6-6 - شاخص D14",1,0,1,21.344584,39.964778,"6-6","D14","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0591","عرفات - مربع 4-4 - شاخص 79/38",1,0,1,21.345325,39.965238,"4-4","79/38","شركة بيت المشاعر","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0592","عرفات - مربع 12A - شاخص B3",1,0,1,21.344433,39.962727,"12A","B3","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0593","عرفات - مربع 13E - شاخص 4/38",1,0,1,21.343079,39.962056,"13E","4/38","شركة فهد البطي وشركاه التضامنية","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0594","عرفات - مربع 26A - شاخص A03",1,0,1,21.344011,39.961696,"26A","A03","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0595","عرفات - مربع 26C - شاخص A09",1,0,1,21.343647,39.96384,"26C","A09","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0596","عرفات - مربع 26C - شاخص A10",1,0,1,21.342996,39.962943,"26C","A10","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0597","عرفات - مربع A3 - شاخص A3",1,0,1,21.34382,39.962367,"A3","A3","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0598","عرفات - مربع 5-8 - شاخص D30",1,0,1,21.347906,39.95921,"5-8","D30","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0599","عرفات - مربع 4-4 - شاخص 56/44",1,0,1,21.346985,39.96173,"","","شركة هداية الراجحون المحدوده","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0600","عرفات - مربع 4-5 - شاخص 49/44",1,0,1,21.346103,39.962509,"4-5","49/44","شركة مخيمات الخيرات","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0601","عرفات - مربع 12B - شاخص B04",1,0,1,21.346808,39.9579,"12B","B04","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0602","عرفات - مربع 13D - شاخص 1/102",1,0,1,21.345815,39.957516,"13D","1/102","شركة الميعاد السعودية المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0603","عرفات - مربع 23A - شاخص A01",1,0,1,21.345035,39.958799,"23A","A01","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0604","عرفات - مربع 26B - شاخص A04",1,0,1,21.343184,39.960422,"26B","A04","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0605","عرفات - مربع 28C - شاخص 23/68",1,0,1,21.346071,39.956866,"28C","23/68","شركة سعود عابد المجنوني","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0606","عرفات - مربع 57 - شاخص B06",1,0,1,21.34344,39.959553,"57","B06","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0607","عرفات - مربع ? - شاخص ?",1,0,1,21.345126,39.957256,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0608","عرفات - مربع 101C - شاخص 20/608",1,0,1,21.34541,39.971156,"101C","20/608","شركة سلفا للحج والعمرة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0609","عرفات - مربع 35D5 - شاخص 5/208",1,0,1,21.345149,39.97263,"35D5","5/208","شركة شمس طيبة المحدوده","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0610","عرفات - مربع 118B - شاخص C02",1,0,1,21.346207,39.970481,"118B","C02","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0611","عرفات - مربع 112 - شاخص 4/639",1,0,1,21.345528,39.971885,"112","4/639","شركة فيض المشاعر لخدمات الحجاج","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0612","عرفات - مربع 35E - شاخص 1/208",1,0,1,21.344748,39.973307,"35E","1/208","شركة طريق الهجرتين المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0613","عرفات - مربع 5-4 - شاخص D09",1,0,1,21.334796,39.972827,"5-4","D09","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0614","عرفات - مربع 5-4 - شاخص D08",1,0,1,21.334669,39.972227,"5-4","D08","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0615","عرفات - مربع 118B - شاخص C01",1,0,1,21.342753,39.976343,"118B","C01","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0616","عرفات - مربع 112 - شاخص 2A/639",1,0,1,21.342476,39.974793,"112","2A/639","شركة المنهاج السعوديه المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0617","عرفات - مربع 112 - شاخص 2B/639",1,0,1,21.342909,39.974971,"112","2B/639","شركة قافلة الخير","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0618","عرفات - مربع 112 - شاخص 8/639",1,0,1,21.3434,39.97517,"112","8/639","شركة بشائر الإسلام لخدمات حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0619","عرفات - مربع 112 - شاخص 6/639",1,0,1,21.343442,39.975469,"34","25/206","شركة عالم البشائر المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0620","عرفات - مربع 31B - شاخص 35/68",1,0,1,21.343164,39.975591,"112","6/639","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0621","عرفات - مربع 101E - شاخص C08",1,0,1,21.34336,39.973304,"101E","C08","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0622","عرفات - مربع 35D5 - شاخص 9/208",1,0,1,21.342981,39.974206,"35D5","9/208","وزارة الحج والعمرة حجاج داخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0623","عرفات - مربع 101E - شاخص C11",1,0,1,21.343797,39.974075,"101E","C11","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0624","عرفات - مربع 101E - شاخص C12",1,0,1,21.344234,39.97271,"101E","C12","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0625","عرفات - مربع 104C - شاخص 1/616",1,0,1,21.344082,39.971959,"104C","1/616","شركة ناصر نصار الحازمي وشركاه التضامنية","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0626","عرفات - مربع 61A - شاخص 52/38",1,0,1,21.337424,39.96659,"61A","52/38","شركة الاطياف للحج المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0627","عرفات - مربع 101D - شاخص C13",1,0,1,21.344097,39.974463,"101D","C13","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0628","عرفات - مربع 53 - شاخص B10",1,0,1,21.340001,39.964445,"53","B10","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0629","عرفات - مربع 5-5 - شاخص D17",1,0,1,21.344363,39.966335,"5-5","D17","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0630","عرفات - مربع 5-5 - شاخص D10",1,0,1,21.345965,39.963286,"5-5","D10","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0631","عرفات - مربع A2 - شاخص A2/38",1,0,1,21.342209,39.977034,"38","D/204","شركة رواف منى لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0632","عرفات - مربع 4-4 - شاخص 95/38",1,0,1,21.346323,39.965728,"4-4","95/38","شركة خالد زامل الغيثي وشركاه المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0633","عرفات - مربع 26C - شاخص A08",1,0,1,21.346575,39.964743,"26C","A08","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0634","عرفات - مربع 55 - شاخص 28/50",1,0,1,21.343221,39.968477,"55","28/50","شركة سدانة لخدمات حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0635","عرفات - مربع 70 - شاخص B17",1,0,1,21.338774,39.966906,"70","B17","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0636","عرفات - مربع 70 - شاخص 45A-45B/38",1,0,1,21.339107,39.966306,"70","45A-45B/38","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0637","عرفات - مربع 68 - شاخص 66A/38",1,0,1,21.339673,39.965856,"68","66A/38","شركة العهد الوطنية المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0638","عرفات - مربع 72B - شاخص 15/44",1,0,1,21.337601,39.968065,"72B","15/44","شركة نور حراء المحدوده","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0639","عرفات - مربع 72B - شاخص 11/44",1,0,1,21.336882,39.968196,"72B","11/44","مؤسسة عبدالله حمد العراجه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0640","عرفات - مربع 72B - شاخص 48/50",1,0,1,21.337373,39.9677,"72B","48/50","شركة سعود بن عبدالعزيز الجميعه وشركاه التضامنيه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0641","عرفات - مربع 72B - شاخص 54/50",1,0,1,21.33779,39.967399,"72B","54/50","شركة حملة الاحسان لخدمة حجاج الداخل المحدوده","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0642","عرفات - مربع 72B - شاخص 52A/50",1,0,1,21.338219,39.967514,"72B","52A/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0643","عرفات - مربع 72B - شاخص 50/50",1,0,1,21.338583,39.966387,"72B","50/50","شركة رفاق الصفوة التجارية","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0644","عرفات - مربع A1 - شاخص A/50",1,0,1,21.347473,39.964278,"A1","A/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0645","عرفات - مربع A1 - شاخص E/50",1,0,1,21.348097,39.963408,"A1","E/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0646","عرفات - مربع A1 - شاخص D/50",1,0,1,21.34797,39.963698,"A1","D/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0647","عرفات - مربع A1 - شاخص C/50",1,0,1,21.346569,39.963816,"A1","C/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0648","عرفات - مربع A1 - شاخص B/50",1,0,1,21.346914,39.96414,"A1","B/50","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0649","عرفات - مربع 72B - شاخص 13/44",1,0,1,21.338448,39.967926,"52-53","9-42/44","شركة دار الإيمان الأولى للحج","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0650","عرفات - مربع 7-2 - شاخص 6/508",1,0,1,21.335112,39.971255,"7-2","6/508","شركة العطير لخدمة حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0651","عرفات - مربع 7-5B - شاخص T1/527",1,0,1,21.362441,39.974928,"7-5B","T1/527","مؤسسة عبداللطيف الحماد","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0652","عرفات - مربع 7-5B - شاخص T2/527",1,0,1,21.362541,39.975274,"7-5B","T2/527","شركة المنار لخدمة حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0653","عرفات - مربع 7-5B - شاخص T3/527",1,0,1,21.362366,39.975795,"7-5B","T3/527","شركة  إيثار المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0654","عرفات - مربع 7-5B - شاخص T4/527",1,0,1,21.362027,39.975984,"81","9/404","شركة قافلة النخبة لخدمات الحجاج","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0655","عرفات - مربع 7-5B - شاخص T6/527",1,0,1,21.362127,39.976546,"7-5B","T4/527","شركة المقام الأمين لخدمة حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0656","عرفات - مربع 7-5B - شاخص T7/527",1,0,1,21.361792,39.976973,"7-5B","T6/527","شركة المشاعر المتحدة المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0657","عرفات - مربع 7-5B - شاخص T8/527",1,0,1,21.361652,39.977355,"7-5B","T7/527","شركة سرهد لخدمات حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0658","عرفات - مربع 59C - شاخص 33/38",1,0,1,21.33758,39.965758,"59C","33/38","شركة رواحل الإيمان المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0659","عرفات - مربع 61 - شاخص 50/38",1,0,1,21.338017,39.965933,"61","50/38","شركة عرفة المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0660","عرفات - مربع 74C - شاخص 40/56",1,0,1,21.338683,39.963938,"74C","40/56","شركة فجر الهدى","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0661","عرفات - مربع 5-7 - شاخص D21",1,0,1,21.345772,39.966367,"5-7","D21","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0662","عرفات - مربع 5-9 - شاخص A1/720",1,0,1,21.345571,39.96718,"5-9","A1/720","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0663","عرفات - مربع 101C - شاخص 18A/608",1,0,1,21.34243,39.975712,"31B","35/68","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0664","عرفات - مربع 101C - شاخص 18/608",1,0,1,21.344514,39.971257,"51B-46","24-35-36/56","شركة احمد سالم الخزاعي وشريكه","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0665","عرفات - مربع S1 - شاخص S1-F",1,0,1,21.347819,39.969684,"S1","S1-F","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0666","عرفات - مربع S1 - شاخص S1-D",1,0,1,21.347497,39.969424,"S1","S1-D","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0667","عرفات - مربع S1 - شاخص S1-E",1,0,1,21.34747,39.9698,"S1","S1-A","خدمات لوجستية","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0668","عرفات - مربع S1 - شاخص S1-C",1,0,1,21.347201,39.969765,"S1","S1-E","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0669","عرفات - مربع 6-8 - شاخص 3/504",1,0,1,21.347334,39.970118,"S1","S1-C","شركة حمد اللحياني وحمد الزايدي","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0670","عرفات - مربع C1 - شاخص 1/3",1,0,1,21.346924,39.969371,"6-8","3/504","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0671","عرفات - مربع S1 - شاخص S1-B",1,0,1,21.348282,39.969878,"88B","48/68","","","منطقة عرفات",""],["NSK-ARF-CMP-0672","عرفات - مربع 70 - شاخص 28C/44",1,0,1,21.338092,39.965289,"70","28C/44","شركة الأسواف المحدودة","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0673","عرفات - مربع ? - شاخص ?",1,0,1,21.334672,39.968998,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0674","عرفات - مربع ? - شاخص ?",1,0,1,21.335231,39.967231,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0675","عرفات - مربع ? - شاخص ?",1,0,1,21.336136,39.96531,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0676","عرفات - مربع ? - شاخص ?",1,0,1,21.335284,39.970631,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0677","عرفات - مربع 54 - شاخص 32B/50",1,0,1,21.341205,39.96401,"54","32B/50","","","منطقة عرفات",""],["NSK-ARF-CMP-0678","عرفات - مربع 12E - شاخص 3/38",1,0,1,21.34143,39.963163,"12E","3/38","وزارة الحج والعمرة حجاج داخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0679","عرفات - مربع ? - شاخص ?",1,0,1,21.342067,39.962165,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0680","عرفات - مربع ? - شاخص ?",1,0,1,21.346068,39.957094,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0681","عرفات - مربع ? - شاخص ?",1,0,1,21.34738,39.958373,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0682","عرفات - مربع ? - شاخص ?",1,0,1,21.342557,39.963493,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0683","عرفات - مربع Null - شاخص ?",1,0,1,21.33795,39.975794,"78","49/62","شركة اثراء الخير لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0684","عرفات - مربع ? - شاخص ?",1,0,1,21.335053,39.978991,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0685","عرفات - مربع ? - شاخص ?",1,0,1,21.347061,39.965136,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0686","عرفات - مربع ? - شاخص ?",1,0,1,21.346373,39.962702,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0687","عرفات - مربع Null - شاخص ?",1,0,1,21.343564,39.966189,"Null","","","","منطقة عرفات",""],["NSK-ARF-CMP-0688","عرفات - مربع ? - شاخص ?",1,0,1,21.346019,39.966384,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0689","عرفات - مربع ? - شاخص ?",1,0,1,21.346218,39.966948,"S1","S1-B","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0690","عرفات - مربع ? - شاخص ?",1,0,1,21.34244,39.960698,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0691","عرفات - مربع ? - شاخص ?",1,0,1,21.347382,39.959602,"4-4","56/44","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0692","عرفات - مربع ? - شاخص ?",1,0,1,21.346705,39.966079,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0693","عرفات - مربع ? - شاخص ?",1,0,1,21.340921,39.964275,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0694","عرفات - مربع ? - شاخص ?",1,0,1,21.338242,39.966613,"72B","13/44","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0695","عرفات - مربع 70 - شاخص 28D/44",1,0,1,21.337828,39.965088,"70","28D/44","","","منطقة عرفات",""],["NSK-ARF-CMP-0696","عرفات - مربع 74B - شاخص 36/56",1,0,1,21.33674,39.971909,"74B","36/56","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0697","عرفات - مربع ? - شاخص ?",1,0,1,21.339311,39.972707,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0698","عرفات - مربع ? - شاخص ?",1,0,1,21.347208,39.963116,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0699","عرفات - مربع ? - شاخص ?",1,0,1,21.344987,39.966915,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0700","عرفات - مربع ? - شاخص ?",1,0,1,21.344792,39.967596,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0701","عرفات - مربع ? - شاخص ?",1,0,1,21.336722,39.981167,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0702","عرفات - مربع ? - شاخص ?",1,0,1,21.335367,39.981823,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0703","عرفات - مربع ? - شاخص ?",1,0,1,21.33505,39.975874,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0704","عرفات - مربع 7-9 - شاخص ?",1,0,1,21.334293,39.970323,"7-9","","","","منطقة عرفات",""],["NSK-ARF-CMP-0705","عرفات - مربع 7-9 - شاخص ?",1,0,1,21.33474,39.970404,"7-9","","","","منطقة عرفات",""],["NSK-ARF-CMP-0706","عرفات - مربع 54 - شاخص 32/50",1,0,1,21.33777,39.969911,"54","32/50","","","منطقة عرفات",""],["NSK-ARF-CMP-0707","عرفات - مربع 7-9 - شاخص 2/521",1,0,1,21.337112,39.966412,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0708","عرفات - مربع ? - شاخص ?",1,0,1,21.341877,39.961793,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0709","عرفات - مربع ? - شاخص ?",1,0,1,21.348093,39.988083,"","","مقر ومركز شركة رواف منى لخدمات الحجاج","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0710","عرفات - مربع 7-6 - شاخص 1/519",1,0,1,21.334835,39.969101,"7-6","1/519","الراجحي","","منطقة عرفات","خارج"],["NSK-ARF-CMP-0711","عرفات - مربع 54 - شاخص 32C/50",1,0,1,21.346552,39.9688,"C1","1/3","حجاج الداخل","","منطقة عرفات","داخل"],["NSK-ARF-CMP-0712","عرفات - مربع ? - شاخص ?",1,0,1,21.343607,39.961422,"","","","","منطقة عرفات",""],["NSK-ARF-CMP-0713","عرفات - مربع 12F - شاخص 2/102",1,0,1,21.344962,39.957672,"54","32C/50","شركة المناسك المحدودة","","منطقة عرفات","داخل"],["NSK-MIN-CMP-0001","منى - مربع 10 - شاخص 1/112",0,0,0,21.417334,39.879158,"10","1/112","ضيوف البيت","172.18.100","منطقة منى","خارج"],["NSK-MIN-CMP-0002","منى - مربع 10 - شاخص 2/114",0,0,0,21.417688,39.879158,"10","2/114","رحلات ومنافع","172.18.99","منطقة منى","خارج"],["NSK-MIN-CMP-0003","منى - مربع 10 - شاخص 5/112",0,0,0,21.416879,39.880006,"10","5/112","الرفادة","172.18.95","منطقة منى","خارج"],["NSK-MIN-CMP-0004","منى - مربع 100A - شاخص 13/608",0,0,0,21.415982,39.894749,"100A","13/608","مشارق المتميزة","172.19.114","منطقة منى","خارج"],["NSK-MIN-CMP-0005","منى - مربع 100A - شاخص 14/620",0,0,0,21.417395,39.894365,"100A","14/620","مشارق المتميزة","172.19.106","منطقة منى","خارج"],["NSK-MIN-CMP-0006","منى - مربع 100A - شاخص 18/620",0,0,0,21.41661,39.894861,"100A","18/620","مشارق المتميزة","172.19.104","منطقة منى","خارج"],["NSK-MIN-CMP-0007","منى - مربع 100A - شاخص 5/608",0,0,0,21.417815,39.894115,"100A","5/608","مشارق المتميزة","172.19.53","منطقة منى","خارج"],["NSK-MIN-CMP-0008","منى - مربع 100A - شاخص 9/608",0,0,0,21.416932,39.894433,"100A","9/608","مشارق المتميزة","172.19.49","منطقة منى","خارج"],["NSK-MIN-CMP-0009","منى - مربع 100B - شاخص 22/608",0,0,0,21.415321,39.894558,"100B","22/608","رواف منى","172.19.71","منطقة منى","خارج"],["NSK-MIN-CMP-0010","منى - مربع 101 - شاخص 37/68",0,0,0,21.417875,39.887253,"101","37/68","ضيوف البيت","172.19.6","منطقة منى","خارج"],["NSK-MIN-CMP-0011","منى - مربع 101 - شاخص 39/68",0,0,0,21.417024,39.887766,"101","39/68","ضيوف البيت","172.19.7","منطقة منى","خارج"],["NSK-MIN-CMP-0012","منى - مربع 101A - شاخص 11/210",0,0,0,21.418752,39.88618,"101A","11/210","ضيوف البيت","172.18.108","منطقة منى","خارج"],["NSK-MIN-CMP-0013","منى - مربع 101B - شاخص 2/212",0,0,0,21.41601,39.889879,"101B","2/212","ضيوف البيت","","منطقة منى","خارج"],["NSK-MIN-CMP-0014","منى - مربع 101B - شاخص 4/212",0,0,0,21.416631,39.888651,"101B","4/212","ضيوف البيت","","منطقة منى","خارج"],["NSK-MIN-CMP-0015","منى - مربع 101C - شاخص 18/608",0,0,0,21.41671,39.893575,"101C","18/608","شركة احمد سالم الخزاعي وشريكه","172.19.63","منطقة منى","داخل"],["NSK-MIN-CMP-0016","منى - مربع 101C - شاخص 18A/608",0,0,0,21.417367,39.893225,"101C","18A/608","شركة ملتقى الغدير","","منطقة منى","داخل"],["NSK-MIN-CMP-0017","منى - مربع 101C - شاخص 20/608",0,0,0,21.415774,39.893987,"101C","20/608","شركة سلفا للحج والعمرة","172.16.194","منطقة منى","داخل"],["NSK-MIN-CMP-0018","منى - مربع 101D - شاخص 2/216",0,0,0,21.417521,39.891691,"101D","2/216","رواف منى","172.16.98","منطقة منى","خارج"],["NSK-MIN-CMP-0019","منى - مربع 101D - شاخص 4/216",0,0,0,21.417704,39.892297,"101D","4/216","رحلات ومنافع","172.18.73","منطقة منى","خارج"],["NSK-MIN-CMP-0020","منى - مربع 101D - شاخص 6/216",0,0,0,21.417578,39.891947,"101D","6/216","ام من ميلينوم","172.18.106","منطقة منى","خارج"],["NSK-MIN-CMP-0021","منى - مربع 101D - شاخص C13",0,0,0,21.415096,39.893667,"101D","C13","شركة المأمونيه للتجاره المحدودة، شركة فاخر منصور السهيمي وشريكه","","منطقة منى","داخل"],["NSK-MIN-CMP-0022","منى - مربع 101E - شاخص C08",0,0,0,21.417618,39.892818,"101E","C08","شركة الناصرية لنموذجية لخدمات حجاج الداخل، شركة فوج الهدى لخدمات حجاج الداخل المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0023","منى - مربع 101E - شاخص C11",0,0,0,21.416603,39.892395,"101E","C11","شركة سلمان ويوسف غازي الظفيري لخدمة حجاج الداخل، شركة جوهرة القوافل للحج والعمرة المحدودة، شركة السلوان لخدمات حجاج الداخل المحدودة، شركة حملة الصفوة التجارية شركة شخص واحد","","منطقة منى","داخل"],["NSK-MIN-CMP-0024","منى - مربع 101E - شاخص C12",0,0,0,21.415606,39.892876,"101E","C12","شركة الفرائض لخدمات حجاج الداخل المحدودة، شركة الخماسيه السعوديه للتنمية التجاريه، شركه الحمله الراقيه لصاحبها منصور عبدالرحمن ابوخنجر وشركاه","","منطقة منى","داخل"],["NSK-MIN-CMP-0025","منى - مربع 102 - شاخص 1/618",0,0,0,21.420135,39.893561,"102","1/618","ضيوف البيت","172.18.36","منطقة منى","خارج"],["NSK-MIN-CMP-0026","منى - مربع 102 - شاخص 3/608",0,0,0,21.418364,39.894,"102","3/608","ضيوف البيت","172.19.59","منطقة منى","خارج"],["NSK-MIN-CMP-0027","منى - مربع 102 - شاخص 4/620",0,0,0,21.419588,39.893648,"102","4/620","ضيوف البيت","172.19.109","منطقة منى","خارج"],["NSK-MIN-CMP-0028","منى - مربع 102 - شاخص 5/618",0,0,0,21.419208,39.893777,"102","5/618","ضيوف البيت","172.18.41","منطقة منى","خارج"],["NSK-MIN-CMP-0029","منى - مربع 102 - شاخص 8/620",0,0,0,21.418797,39.893888,"102","8/620","ضيوف البيت","172.19.107","منطقة منى","خارج"],["NSK-MIN-CMP-0030","منى - مربع 103 - شاخص 1/620",0,0,0,21.420497,39.89463,"103","1/620","ضيوف البيت","172.19.110","منطقة منى","خارج"],["NSK-MIN-CMP-0031","منى - مربع 103 - شاخص 2/616",0,0,0,21.418846,39.895243,"103","2/616","ضيوف البيت","172.17.10","منطقة منى","خارج"],["NSK-MIN-CMP-0032","منى - مربع 103 - شاخص 4/622",0,0,0,21.420192,39.89488,"103","4/622","ضيوف البيت","172.18.57","منطقة منى","خارج"],["NSK-MIN-CMP-0033","منى - مربع 103 - شاخص 6/622",0,0,0,21.419714,39.895084,"103","6/622","ضيوف البيت","172.18.62","منطقة منى","خارج"],["NSK-MIN-CMP-0034","منى - مربع 103 - شاخص 7/620",0,0,0,21.419264,39.894937,"103","7/620","ضيوف البيت","172.19.108","منطقة منى","خارج"],["NSK-MIN-CMP-0035","منى - مربع 104A - شاخص 1/628",0,0,0,21.419107,39.896523,"104A","1/628","اثراء الخير","172.16.170","منطقة منى","خارج"],["NSK-MIN-CMP-0036","منى - مربع 104A - شاخص 3/616",0,0,0,21.418623,39.896086,"104A","3/616","اثراء الخير","172.17.12","منطقة منى","خارج"],["NSK-MIN-CMP-0037","منى - مربع 104A - شاخص 5/616",0,0,0,21.418292,39.896525,"104A","5/616","اثراء الخير","172.17.11","منطقة منى","خارج"],["NSK-MIN-CMP-0038","منى - مربع 104C - شاخص 1/616",0,0,0,21.419463,39.895993,"104C","1/616","شركة ناصر نصار الحازمي وشركاه التضامنية","172.19.118","منطقة منى","داخل"],["NSK-MIN-CMP-0039","منى - مربع 105 - شاخص 1/604",0,0,0,21.426725,39.895365,"105","1/604","ضيوف البيت","172.19.84","منطقة منى","خارج"],["NSK-MIN-CMP-0040","منى - مربع 105 - شاخص 1/611",0,0,0,21.427121,39.894388,"105","1/611","مخيمات الطوارئ","172.17.23","منطقة منى","خارج"],["NSK-MIN-CMP-0041","منى - مربع 105 - شاخص 11/613",0,0,0,21.425308,39.895312,"105","11/613","ضيوف البيت","172.16.237","منطقة منى","خارج"],["NSK-MIN-CMP-0042","منى - مربع 105 - شاخص 13/613",0,0,0,21.424707,39.895344,"105","13/613","ضيوف البيت","172.17.32","منطقة منى","خارج"],["NSK-MIN-CMP-0043","منى - مربع 105 - شاخص 15/613",0,0,0,21.423711,39.895551,"105","15/613","ضيوف البيت","172.19.121","منطقة منى","خارج"],["NSK-MIN-CMP-0044","منى - مربع 105 - شاخص 3/604",0,0,0,21.426236,39.895455,"105","3/604","ضيوف البيت","172.16.241","منطقة منى","خارج"],["NSK-MIN-CMP-0045","منى - مربع 106 - شاخص 1/602",0,0,0,21.426065,39.893599,"106","1/602","ضيوف البيت","172.16.243","منطقة منى","خارج"],["NSK-MIN-CMP-0046","منى - مربع 106 - شاخص 2/604",0,0,0,21.426263,39.894711,"106","2/604","ضيوف البيت","172.16.209","منطقة منى","خارج"],["NSK-MIN-CMP-0047","منى - مربع 106 - شاخص 4/604",0,0,0,21.425928,39.894609,"106","4/604","ضيوف البيت","172.16.208","منطقة منى","خارج"],["NSK-MIN-CMP-0048","منى - مربع 106 - شاخص 6/611",0,0,0,21.426716,39.89383,"106","6/611","ضيوف البيت","172.18.48","منطقة منى","خارج"],["NSK-MIN-CMP-0049","منى - مربع 106 - شاخص 7/613",0,0,0,21.425427,39.893554,"106","7/613","ضيوف البيت","172.16.215","منطقة منى","خارج"],["NSK-MIN-CMP-0050","منى - مربع 106 - شاخص 9/613",0,0,0,21.425451,39.894393,"106","9/613","ضيوف البيت","172.17.34","منطقة منى","خارج"],["NSK-MIN-CMP-0051","منى - مربع 107 - شاخص 1/612",0,0,0,21.4237,39.894372,"107","1/612","ضيوف البيت","172.19.36","منطقة منى","خارج"],["NSK-MIN-CMP-0052","منى - مربع 107 - شاخص 11/612",0,0,0,21.421789,39.894341,"107","11/612","ضيوف البيت","172.19.66","منطقة منى","خارج"],["NSK-MIN-CMP-0053","منى - مربع 107 - شاخص 12/614",0,0,0,21.421389,39.894552,"107","12/614","ضيوف البيت","172.19.78","منطقة منى","خارج"],["NSK-MIN-CMP-0054","منى - مربع 107 - شاخص 2/614",0,0,0,21.423291,39.894344,"107","2/614","ضيوف البيت","172.17.121","منطقة منى","خارج"],["NSK-MIN-CMP-0055","منى - مربع 107 - شاخص 5/612",0,0,0,21.422943,39.894518,"107","5/612","ضيوف البيت","172.19.41","منطقة منى","خارج"],["NSK-MIN-CMP-0056","منى - مربع 107 - شاخص 7/612",0,0,0,21.422578,39.894337,"107","7/612","ضيوف البيت","172.19.52","منطقة منى","خارج"],["NSK-MIN-CMP-0057","منى - مربع 107 - شاخص 8/614",0,0,0,21.422239,39.894584,"107","8/614","ضيوف البيت","172.17.230","منطقة منى","خارج"],["NSK-MIN-CMP-0058","منى - مربع 108 - شاخص 10/612",0,0,0,21.421846,39.893071,"108","10/612","هوليدي ان بكة","172.19.62","منطقة منى","خارج"],["NSK-MIN-CMP-0059","منى - مربع 108 - شاخص 11/610",0,0,0,21.421021,39.893108,"108","11/610","هوليدي ان بكة","172.17.248","منطقة منى","خارج"],["NSK-MIN-CMP-0060","منى - مربع 108 - شاخص 2/608",0,0,0,21.423507,39.892767,"108","2/608","هوليدي ان بكة","172.19.80","منطقة منى","خارج"],["NSK-MIN-CMP-0061","منى - مربع 108 - شاخص 3/610",0,0,0,21.422605,39.892839,"108","3/610","هوليدي ان بكة","172.18.21","منطقة منى","خارج"],["NSK-MIN-CMP-0062","منى - مربع 108 - شاخص 4/612",0,0,0,21.423031,39.892874,"108","4/612","هوليدي ان بكة","172.19.41","منطقة منى","خارج"],["NSK-MIN-CMP-0063","منى - مربع 108 - شاخص 8/612",0,0,0,21.422266,39.893096,"108","8/612","هوليدي ان بكة","172.19.56","منطقة منى","خارج"],["NSK-MIN-CMP-0064","منى - مربع 108 - شاخص 9/610",0,0,0,21.421438,39.892951,"108","9/610","هوليدي ان بكة","172.17.252","منطقة منى","خارج"],["NSK-MIN-CMP-0065","منى - مربع 109 - شاخص 1/608",0,0,0,21.423677,39.891901,"109","1/608","ابراج شركة مكه","172.19.83","منطقة منى","خارج"],["NSK-MIN-CMP-0066","منى - مربع 109 - شاخص 1/613",0,0,0,21.42424,39.892168,"109","1/613","مشارق الماسية","172.16.193","منطقة منى","خارج"],["NSK-MIN-CMP-0067","منى - مربع 109 - شاخص 2/611",0,0,0,21.425879,39.892671,"109","2/611","مشارق المتميزة","172.16.160","منطقة منى","خارج"],["NSK-MIN-CMP-0068","منى - مربع 109 - شاخص 3/613",0,0,0,21.424483,39.892089,"109","3/613","مشارق الماسية","172.16.195","منطقة منى","خارج"],["NSK-MIN-CMP-0069","منى - مربع 109 - شاخص 4/611",0,0,0,21.425474,39.891894,"109","4/611","مخيمات الطوارئ","172.17.9","منطقة منى","خارج"],["NSK-MIN-CMP-0070","منى - مربع 109 - شاخص 5/613",0,0,0,21.42499,39.892763,"109","5/613","مشارق المتميزة","172.16.154","منطقة منى","خارج"],["NSK-MIN-CMP-0071","منى - مربع 11 - شاخص 1/114",0,0,0,21.418124,39.87978,"11","1/114","الراجحي","172.16.50","منطقة منى","خارج"],["NSK-MIN-CMP-0072","منى - مربع 110 - شاخص 2/613",0,0,0,21.424234,39.893291,"110","2/613","مشارق الماسية","","منطقة منى","خارج"],["NSK-MIN-CMP-0073","منى - مربع 110 - شاخص 4/613",0,0,0,21.424811,39.893487,"110","4/613","مشارق الماسية","172.17.31","منطقة منى","خارج"],["NSK-MIN-CMP-0074","منى - مربع 110 - شاخص 6/613",0,0,0,21.424895,39.894368,"110","6/613","مشارق الماسية","172.17.29","منطقة منى","خارج"],["NSK-MIN-CMP-0075","منى - مربع 110 - شاخص 8/613",0,0,0,21.424277,39.894561,"110","8/613","مشارق الماسية","172.17.28","منطقة منى","خارج"],["NSK-MIN-CMP-0076","منى - مربع 111 - شاخص 3/639",0,0,0,21.418243,39.898059,"111","3/639","اثراء الخير","172.18.128","منطقة منى","خارج"],["NSK-MIN-CMP-0077","منى - مربع 111 - شاخص 4/25",0,0,0,21.418137,39.897307,"111","4/25","اثراء الخير","","منطقة منى","خارج"],["NSK-MIN-CMP-0078","منى - مربع 111 - شاخص 6/25",0,0,0,21.418724,39.897658,"111","6/25","اثراء الخير","","منطقة منى","خارج"],["NSK-MIN-CMP-0079","منى - مربع 112 - شاخص 2A/639",0,0,0,21.41727,39.898392,"112","2A/639","شركة المنهاج السعوديه المحدودة","172.18.119","منطقة منى","داخل"],["NSK-MIN-CMP-0080","منى - مربع 112 - شاخص 2B/639",0,0,0,21.41662,39.898275,"112","2B/639","شركة قافلة الخير","172.18.86","منطقة منى","داخل"],["NSK-MIN-CMP-0081","منى - مربع 112 - شاخص 4/639",0,0,0,21.41948,39.89818,"112","4/639","شركة فيض المشاعر لخدمات الحجاج","172.18.143","منطقة منى","داخل"],["NSK-MIN-CMP-0082","منى - مربع 112 - شاخص 6/639",0,0,0,21.420349,39.898325,"112","6/639","شركة عالم البشائر المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0083","منى - مربع 112 - شاخص 8/25",0,0,0,21.420349,39.898325,"112","8/25","حجاج الداخل","172.18.233","منطقة منى","داخل"],["NSK-MIN-CMP-0084","منى - مربع 112 - شاخص 8/639",0,0,0,21.421089,39.898587,"112","8/639","شركة بشائر الإسلام لخدمات حجاج الداخل","172.17.25","منطقة منى","داخل"],["NSK-MIN-CMP-0085","منى - مربع 113 - شاخص 10/647",0,0,0,21.41786,39.899322,"113","10/647","الراجحي B2C","172.16.234","منطقة منى","خارج"],["NSK-MIN-CMP-0086","منى - مربع 113 - شاخص 13/649",0,0,0,21.418519,39.899401,"113","13/649","الراجحي B2C","172.19.69","منطقة منى","خارج"],["NSK-MIN-CMP-0087","منى - مربع 113 - شاخص 14/647",0,0,0,21.419123,39.898809,"113","14/647","الراجحي B2C","172.19.95","منطقة منى","خارج"],["NSK-MIN-CMP-0088","منى - مربع 113 - شاخص 15/649",0,0,0,21.418855,39.899936,"113","15/649","الراجحي B2C","","منطقة منى","خارج"],["NSK-MIN-CMP-0089","منى - مربع 113 - شاخص 16/647",0,0,0,21.419623,39.898805,"113","16/647","الراجحي B2C","172.19.91","منطقة منى","خارج"],["NSK-MIN-CMP-0090","منى - مربع 113 - شاخص 17/649",0,0,0,21.419577,39.899972,"113","17/649","الراجحي B2C","172.19.89","منطقة منى","خارج"],["NSK-MIN-CMP-0091","منى - مربع 114A - شاخص 10/651",0,0,0,21.417693,39.90104,"114A","10/651","الرفادة","172.18.31","منطقة منى","خارج"],["NSK-MIN-CMP-0092","منى - مربع 114A - شاخص 14/651",0,0,0,21.418573,39.90126,"114A","14/651","الرفادة","172.18.34","منطقة منى","خارج"],["NSK-MIN-CMP-0093","منى - مربع 114A - شاخص 18/651",0,0,0,21.419436,39.901222,"114A","18/651","الرفادة","172.18.39","منطقة منى","خارج"],["NSK-MIN-CMP-0094","منى - مربع 114A - شاخص 4/88",0,0,0,21.418928,39.901386,"114A","4/88","الرفادة","172.17.30","منطقة منى","خارج"],["NSK-MIN-CMP-0095","منى - مربع 114A - شاخص 8/88",0,0,0,21.418067,39.901267,"114A","8/88","الرفادة","172.17.35","منطقة منى","خارج"],["NSK-MIN-CMP-0096","منى - مربع 114B - شاخص 16/649",0,0,0,21.418685,39.900207,"114B","16/649","الرفادة","172.19.73","منطقة منى","خارج"],["NSK-MIN-CMP-0097","منى - مربع 115A - شاخص 20/651",0,0,0,21.420114,39.901113,"115A","20/651","الرفادة","172.18.35","منطقة منى","خارج"],["NSK-MIN-CMP-0098","منى - مربع 115A - شاخص 22/651",0,0,0,21.420663,39.901207,"115A","22/651","دليل الزوار","172.18.29","منطقة منى","خارج"],["NSK-MIN-CMP-0099","منى - مربع 115A - شاخص 24/651",0,0,0,21.421261,39.901312,"115A","24/651","دليل الزوار","172.18.28","منطقة منى","خارج"],["NSK-MIN-CMP-0100","منى - مربع 115B - شاخص 20/649",0,0,0,21.420643,39.900539,"115B","20/649","الرفادة","172.19.96","منطقة منى","خارج"],["NSK-MIN-CMP-0101","منى - مربع 116 - شاخص 19/649",0,0,0,21.420153,39.899917,"116","19/649","الرفادة","172.19.92","منطقة منى","خارج"],["NSK-MIN-CMP-0102","منى - مربع 116 - شاخص 20/647",0,0,0,21.420514,39.898789,"116","20/647","الرفادة","172.19.97","منطقة منى","خارج"],["NSK-MIN-CMP-0103","منى - مربع 116 - شاخص 21/649",0,0,0,21.420809,39.900128,"116","21/649","إكرام الضيف","172.16.212","منطقة منى","خارج"],["NSK-MIN-CMP-0104","منى - مربع 116 - شاخص 22/647",0,0,0,21.421086,39.898943,"116","22/647","الرفادة","172.19.100","منطقة منى","خارج"],["NSK-MIN-CMP-0105","منى - مربع 116 - شاخص 23/649",0,0,0,21.421468,39.899704,"116","23/649","الرفادة","172.19.99","منطقة منى","خارج"],["NSK-MIN-CMP-0106","منى - مربع 117A - شاخص 7/25",0,0,0,21.421673,39.898242,"117A","7/25","مشارق الماسية","172.18.93","منطقة منى","خارج"],["NSK-MIN-CMP-0107","منى - مربع 117A - شاخص 7A/25",0,0,0,21.421275,39.898122,"117A","7A/25","الادارة العامة للمسؤولية الاجتماعية والأعمال التطوعية","","منطقة منى","داخل"],["NSK-MIN-CMP-0108","منى - مربع 117B - شاخص 1/635",0,0,0,21.420838,39.89775,"117B","1/635","مشارق الماسية","172.18.32","منطقة منى","خارج"],["NSK-MIN-CMP-0109","منى - مربع 117C - شاخص 2/632",0,0,0,21.420682,39.896514,"117C","2/632","ابراج شركة مكه","172.16.204","منطقة منى","خارج"],["NSK-MIN-CMP-0110","منى - مربع 117C - شاخص 4/632",0,0,0,21.420752,39.8969,"117C","4/632","ابراج شركة مكه","172.16.203","منطقة منى","خارج"],["NSK-MIN-CMP-0111","منى - مربع 117D - شاخص 2/634",0,0,0,21.422023,39.896436,"117D","2/634","ضيوف البيت","172.16.205","منطقة منى","خارج"],["NSK-MIN-CMP-0112","منى - مربع 117D - شاخص 4/634",0,0,0,21.422057,39.896812,"117D","4/634","ضيوف البيت","172.16.134","منطقة منى","خارج"],["NSK-MIN-CMP-0113","منى - مربع 117E - شاخص 1/631",0,0,0,21.423643,39.896909,"117E","1/631","هوليدي ان بكة","172.18.22","منطقة منى","خارج"],["NSK-MIN-CMP-0114","منى - مربع 117E - شاخص 2/631",0,0,0,21.423547,39.896461,"117E","2/631","هوليدي ان بكة","172.16.65","منطقة منى","خارج"],["NSK-MIN-CMP-0115","منى - مربع 117E - شاخص 3/633",0,0,0,21.425496,39.897503,"117E","3/633","ضيوف البيت","172.16.253","منطقة منى","خارج"],["NSK-MIN-CMP-0116","منى - مربع 117E - شاخص 4/631",0,0,0,21.424595,39.896473,"117E","4/631","ضيوف البيت","172.16.251","منطقة منى","خارج"],["NSK-MIN-CMP-0117","منى - مربع 117E - شاخص 5/631",0,0,0,21.424902,39.897028,"117E","5/631","مشارق الماسية","172.18.16","منطقة منى","خارج"],["NSK-MIN-CMP-0118","منى - مربع 117E - شاخص 6/631",0,0,0,21.425362,39.896549,"117E","6/631","ضيوف البيت","172.18.13","منطقة منى","خارج"],["NSK-MIN-CMP-0119","منى - مربع 117E - شاخص 8/631",0,0,0,21.426084,39.896632,"117E","8/631","ضيوف البيت","172.16.173","منطقة منى","خارج"],["NSK-MIN-CMP-0120","منى - مربع 118 - شاخص 1/637",0,0,0,21.4233,39.897982,"118","1/637","مشارق الماسية","172.16.107","منطقة منى","خارج"],["NSK-MIN-CMP-0121","منى - مربع 118 - شاخص 11/25",0,0,0,21.424156,39.899144,"118","11/25","رواف منى","172.16.161","منطقة منى","خارج"],["NSK-MIN-CMP-0122","منى - مربع 118 - شاخص 13/25",0,0,0,21.425091,39.89953,"118","13/25","رواف منى","172.18.70","منطقة منى","خارج"],["NSK-MIN-CMP-0123","منى - مربع 118 - شاخص 2/637",0,0,0,21.42318,39.898372,"118","2/637","مشارق الماسية","172.18.189","منطقة منى","خارج"],["NSK-MIN-CMP-0124","منى - مربع 118 - شاخص 3/637",0,0,0,21.423839,39.897881,"118","3/637","مشارق الماسية","172.18.5","منطقة منى","خارج"],["NSK-MIN-CMP-0125","منى - مربع 118 - شاخص 4/637",0,0,0,21.424358,39.898729,"118","4/637","رواف منى","172.18.2","منطقة منى","خارج"],["NSK-MIN-CMP-0126","منى - مربع 118 - شاخص 5/637",0,0,0,21.424438,39.898248,"118","5/637","مشارق الماسية","172.17.255","منطقة منى","خارج"],["NSK-MIN-CMP-0127","منى - مربع 118 - شاخص 7/637",0,0,0,21.425144,39.898457,"118","7/637","مشارق الماسية","172.17.249","منطقة منى","خارج"],["NSK-MIN-CMP-0128","منى - مربع 118 - شاخص 9/25",0,0,0,21.422894,39.898476,"118","9/25","رواف منى","172.18.90","منطقة منى","خارج"],["NSK-MIN-CMP-0129","منى - مربع 118B - شاخص C01",0,0,0,21.427282,39.900194,"118B","C01","شركة حملة الرسالة لخدمات حجاج الداخل، شركة صالح الملحم وشركاه لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0130","منى - مربع 118B - شاخص C02",0,0,0,21.426056,39.899549,"118B","C02","شركة محمد خالد قديمي وشركاؤه، شركه حمله الابرار لخدمات الحجاج الداخل، شركة المقام السعودية لخدمات الحج المحدوده، شركة عبدالله بن بريك العماري وشريكه لخدمات حجاج الداخل التضامنية","","منطقة منى","داخل"],["NSK-MIN-CMP-0131","منى - مربع 119 - شاخص 1/643",0,0,0,21.422574,39.900297,"119","1/643","إثراء الجود","172.19.43","منطقة منى","خارج"],["NSK-MIN-CMP-0132","منى - مربع 119 - شاخص 2/641",0,0,0,21.422597,39.899614,"119","2/641","إكرام الضيف","172.18.47","منطقة منى","خارج"],["NSK-MIN-CMP-0133","منى - مربع 119 - شاخص 3/643",0,0,0,21.423305,39.900525,"119","3/643","إثراء الجود","172.19.55","منطقة منى","خارج"],["NSK-MIN-CMP-0134","منى - مربع 119 - شاخص 4/641",0,0,0,21.423346,39.899723,"119","4/641","إكرام الضيف","172.18.42","منطقة منى","خارج"],["NSK-MIN-CMP-0135","منى - مربع 119 - شاخص 6/641",0,0,0,21.424049,39.900168,"119","6/641","إثراء الجود","172.18.51","منطقة منى","خارج"],["NSK-MIN-CMP-0136","منى - مربع 120 - شاخص 10/643",0,0,0,21.423894,39.901851,"120","10/643","رواف منى","172.16.162","منطقة منى","خارج"],["NSK-MIN-CMP-0137","منى - مربع 120 - شاخص 2/643",0,0,0,21.422213,39.901383,"120","2/643","الراجحي","172.19.48","منطقة منى","خارج"],["NSK-MIN-CMP-0138","منى - مربع 120 - شاخص 4/643",0,0,0,21.422745,39.901339,"120","4/643","رواف منى","172.16.178","منطقة منى","خارج"],["NSK-MIN-CMP-0139","منى - مربع 120 - شاخص 6/643",0,0,0,21.42314,39.901378,"120","6/643","رواف منى","172.19.30","منطقة منى","خارج"],["NSK-MIN-CMP-0140","منى - مربع 120 - شاخص 8/643",0,0,0,21.423586,39.901365,"120","8/643","رواف منى","172.19.27","منطقة منى","خارج"],["NSK-MIN-CMP-0141","منى - مربع 122 - شاخص 12/643",0,0,0,21.424593,39.901565,"122","12/643","ابراج شركة مكه","172.19.77","منطقة منى","خارج"],["NSK-MIN-CMP-0142","منى - مربع 122 - شاخص 14/643",0,0,0,21.424878,39.901898,"122","14/643","الراجحي","172.16.49","منطقة منى","خارج"],["NSK-MIN-CMP-0143","منى - مربع 122 - شاخص 16/643",0,0,0,21.425295,39.901774,"122","16/643","ضيوف البيت","172.19.72","منطقة منى","خارج"],["NSK-MIN-CMP-0144","منى - مربع 122 - شاخص 3/652",0,0,0,21.425777,39.901049,"122","3/652","الراجحي","172.18.46","منطقة منى","خارج"],["NSK-MIN-CMP-0145","منى - مربع 123 - شاخص 7/643",0,0,0,21.425001,39.900818,"123","7/643","ضيوف البيت","172.19.64","منطقة منى","خارج"],["NSK-MIN-CMP-0146","منى - مربع 123 - شاخص 8/641",0,0,0,21.424864,39.900237,"123","8/641","ضيوف البيت","172.16.235","منطقة منى","خارج"],["NSK-MIN-CMP-0147","منى - مربع 124 - شاخص 1/654",0,0,0,21.426209,39.90211,"124","1/654","رحلات ومنافع","172.16.135","منطقة منى","خارج"],["NSK-MIN-CMP-0148","منى - مربع 124 - شاخص 3/654",0,0,0,21.426632,39.901562,"124","3/654","رحلات ومنافع","172.18.52","منطقة منى","خارج"],["NSK-MIN-CMP-0149","منى - مربع 12A - شاخص B3",0,0,0,21.416282,39.876599,"12A","B3","شركة قريش المحدودة شركة شخص واحد","","منطقة منى","داخل"],["NSK-MIN-CMP-0150","منى - مربع 12B - شاخص B02",0,0,0,21.416103,39.875841,"12B","B02","شركة الرحلة المباركة المحدودة‬‏، ‫شركة الخباري المحدودة‬‏","","منطقة منى","داخل"],["NSK-MIN-CMP-0151","منى - مربع 12B - شاخص B04",0,0,0,21.414935,39.87682,"12B","B04","شركة منازل الرافدين‬‏، ‫شركة محمد العلياني المحدودة لخدمات حجاج الداخل‬‏","","منطقة منى","داخل"],["NSK-MIN-CMP-0152","منى - مربع 12B - شاخص B4",0,0,0,21.414935,39.87682,"12B","B4","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0153","منى - مربع 12D - شاخص 12-8-6/50",0,0,0,21.418653,39.873982,"12D","12-8-6/50","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0154","منى - مربع 12D - شاخص 4/50",0,0,0,21.419107,39.872612,"12D","4/50","الراجحي","172.18.109","منطقة منى","خارج"],["NSK-MIN-CMP-0155","منى - مربع 12E - شاخص 3/38",0,0,0,21.418488,39.872302,"12E","3/38","وزارة الحج والعمرة حجاج داخل","172.16.206","منطقة منى","داخل"],["NSK-MIN-CMP-0156","منى - مربع 12F - شاخص 2/102",0,0,0,21.419028,39.871972,"12F","2/102","شركة المناسك المحدودة","172.17.88","منطقة منى","داخل"],["NSK-MIN-CMP-0157","منى - مربع 13D - شاخص 1/102",0,0,0,21.419488,39.8717,"13D","1/102","شركة الميعاد السعودية المحدودة","172.17.225","منطقة منى","داخل"],["NSK-MIN-CMP-0158","منى - مربع 13E - شاخص 4/38",0,0,0,21.41576,39.874751,"13E","4/38","شركة فهد البطي وشركاه التضامنية","","منطقة منى","داخل"],["NSK-MIN-CMP-0159","منى - مربع 14 - شاخص 1/56",0,0,0,21.416163,39.881438,"14","1/56","ضيوف البيت","172.18.91","منطقة منى","خارج"],["NSK-MIN-CMP-0160","منى - مربع 14 - شاخص 2/62",0,0,0,21.41691,39.881998,"14","2/62","ضيوف البيت","172.18.84","منطقة منى","خارج"],["NSK-MIN-CMP-0161","منى - مربع 14 - شاخص 8/114",0,0,0,21.417015,39.881336,"14","8/114","ضيوف البيت","172.16.71","منطقة منى","خارج"],["NSK-MIN-CMP-0162","منى - مربع 15 - شاخص 6/114",0,0,0,21.417443,39.880584,"15","6/114","رفاد","172.16.59","منطقة منى","خارج"],["NSK-MIN-CMP-0163","منى - مربع 16 - شاخص 2/116",0,0,0,21.418216,39.880437,"16","2/116","إكرام الضيف","172.16.63","منطقة منى","خارج"],["NSK-MIN-CMP-0164","منى - مربع 17 - شاخص 1/116",0,0,0,21.418582,39.880421,"17","1/116","يسر المشاعر","172.18.104","منطقة منى","خارج"],["NSK-MIN-CMP-0165","منى - مربع 17 - شاخص 3/116",0,0,0,21.418905,39.87935,"17","3/116","يسر المشاعر","172.18.170","منطقة منى","خارج"],["NSK-MIN-CMP-0166","منى - مربع 18A - شاخص 10/68",0,0,0,21.419373,39.879793,"18A","10/68","شركة طوائف التضامنية","172.19.111","منطقة منى","داخل"],["NSK-MIN-CMP-0167","منى - مربع 19 - شاخص 4/15",0,0,0,21.418633,39.881206,"19","4/15","","","منطقة منى",""],["NSK-MIN-CMP-0168","منى - مربع 2 - شاخص 1/301",0,0,0,21.413431,39.880429,"2","1/301","شركة محمد وعبدالرحمن أحمد الحميري","172.16.159","منطقة منى","داخل"],["NSK-MIN-CMP-0169","منى - مربع 2 - شاخص 22/50",0,0,0,21.413659,39.880618,"2","22/50","شركة إفاضه","","منطقة منى","داخل"],["NSK-MIN-CMP-0170","منى - مربع 2 - شاخص 50/22",0,0,0,21.413659,39.880618,"2","50/22","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0171","منى - مربع 2 - شاخص B05",0,0,0,21.413863,39.879659,"2","B05","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0172","منى - مربع 20 - شاخص 4/116",0,0,0,21.417902,39.88123,"20","4/116","الراجحي","172.16.110","منطقة منى","خارج"],["NSK-MIN-CMP-0173","منى - مربع 23A - شاخص A01",0,0,0,21.425419,39.871099,"23A","A01","شركة القصواء المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0174","منى - مربع 23B - شاخص 3/115",0,0,0,21.424271,39.873067,"23B","3/115","ضيوف البيت","172.16.54","منطقة منى","خارج"],["NSK-MIN-CMP-0175","منى - مربع 23B - شاخص 7/68",0,0,0,21.424444,39.872474,"23B","7/68","ضيوف البيت","172.16.57","منطقة منى","خارج"],["NSK-MIN-CMP-0176","منى - مربع 26A - شاخص A03",0,0,0,21.425445,39.872809,"26A","A03","شركة عبدالله بن محفوظ وشركاه","","منطقة منى","داخل"],["NSK-MIN-CMP-0177","منى - مربع 26A - شاخص A06",0,0,0,21.424923,39.873449,"26A","A06","شركة رواحل الحج المحدودة، ‫شركة عبدالله الرويزن ومشعل الرويزن التضامنية‬‏، ‫شركة عبدالهادي بن رويزن وشريكه‬‏","","منطقة منى","داخل"],["NSK-MIN-CMP-0178","منى - مربع 26A - شاخص A07",0,0,0,21.424709,39.873231,"26A","A07","شركه حمله الفرقان للحج","","منطقة منى","داخل"],["NSK-MIN-CMP-0179","منى - مربع 26B - شاخص A04",0,0,0,21.424752,39.874635,"26B","A04","شركة جمال يوسف حمد الذوادي وشركاه‬‏، ‫شركة صالح بن غازي الظفيري وشركاه المحدودة‬‏، ‫شركة الجليس الصالح‬‏","","منطقة منى","داخل"],["NSK-MIN-CMP-0180","منى - مربع 26B - شاخص A05",0,0,0,21.424398,39.875609,"26B","A05","شركة أعمال السكينة","","منطقة منى","داخل"],["NSK-MIN-CMP-0181","منى - مربع 26C - شاخص A08",0,0,0,21.423358,39.874423,"26C","A08","شركة صفا المشاعر","","منطقة منى","داخل"],["NSK-MIN-CMP-0182","منى - مربع 26C - شاخص A09",0,0,0,21.423081,39.875183,"26C","A09","شركة سماء الفاروق لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0183","منى - مربع 26C - شاخص A10",0,0,0,21.423274,39.87545,"26C","A10","شركة الاتقان للحج","","منطقة منى","داخل"],["NSK-MIN-CMP-0184","منى - مربع 27 - شاخص 2/124",0,0,0,21.423708,39.873427,"27","2/124","ضيوف البيت","172.17.247","منطقة منى","خارج"],["NSK-MIN-CMP-0185","منى - مربع 27 - شاخص 4/124",0,0,0,21.423313,39.87389,"27","4/124","ضيوف البيت","172.19.115","منطقة منى","خارج"],["NSK-MIN-CMP-0186","منى - مربع 27 - شاخص 9/68",0,0,0,21.422712,39.874455,"27","9/68","ضيوف البيت","172.19.112","منطقة منى","خارج"],["NSK-MIN-CMP-0187","منى - مربع 28 - شاخص 1/15",0,0,0,21.419897,39.883577,"28","1/15","ضيوف البيت","172.16.148","منطقة منى","خارج"],["NSK-MIN-CMP-0188","منى - مربع 28 - شاخص 2/15",0,0,0,21.420229,39.884577,"28","2/15","ابراج شركة مكه","172.16.136","منطقة منى","خارج"],["NSK-MIN-CMP-0189","منى - مربع 28A - شاخص 15/68",0,0,0,21.420938,39.877461,"28A","15/68","ضيوف البيت","172.18.255","منطقة منى","خارج"],["NSK-MIN-CMP-0190","منى - مربع 28A - شاخص 17/68",0,0,0,21.420705,39.878389,"28A","17/68","ضيوف البيت","172.18.253","منطقة منى","خارج"],["NSK-MIN-CMP-0191","منى - مربع 28B - شاخص 19/68",0,0,0,21.420012,39.879509,"28B","19/68","هوليدي ان بكة","172.16.104","منطقة منى","خارج"],["NSK-MIN-CMP-0192","منى - مربع 28B - شاخص 21/68",0,0,0,21.419648,39.880495,"28B","21/68","مشارق الماسية","172.16.111","منطقة منى","خارج"],["NSK-MIN-CMP-0193","منى - مربع 28C - شاخص 23/68",0,0,0,21.419517,39.881372,"28C","23/68","شركة سعود عابد المجنوني","172.16.242","منطقة منى","داخل"],["NSK-MIN-CMP-0194","منى - مربع 28C - شاخص 25/68",0,0,0,21.41935,39.882427,"28C","25/68","مشارق الذهبية","172.16.155","منطقة منى","خارج"],["NSK-MIN-CMP-0195","منى - مربع 28D - شاخص 3/15",0,0,0,21.420478,39.883665,"28D","3/15","ضيوف البيت","172.16.156","منطقة منى","خارج"],["NSK-MIN-CMP-0196","منى - مربع 28E - شاخص 3/210",0,0,0,21.419693,39.885497,"28E","3/210","ضيوف البيت","","منطقة منى","خارج"],["NSK-MIN-CMP-0197","منى - مربع 28E - شاخص 9/210",0,0,0,21.419337,39.885941,"28E","9/210","ضيوف البيت","172.18.247","منطقة منى","خارج"],["NSK-MIN-CMP-0198","منى - مربع 28F - شاخص 27/68",0,0,0,21.419446,39.883043,"28F","27/68","بشرى الضيافة","172.16.158","منطقة منى","خارج"],["NSK-MIN-CMP-0199","منى - مربع 29 - شاخص 1/204",0,0,0,21.418273,39.881615,"29","1/204","الراجحي","172.16.83","منطقة منى","خارج"],["NSK-MIN-CMP-0200","منى - مربع 29 - شاخص 3/204",0,0,0,21.418024,39.88241,"29","3/204","الراجحي","172.16.86","منطقة منى","خارج"],["NSK-MIN-CMP-0201","منى - مربع 29A - شاخص 2/204",0,0,0,21.417707,39.881753,"29A","2/204","ابراج شركة مكه","172.16.94","منطقة منى","خارج"],["NSK-MIN-CMP-0202","منى - مربع 30 - شاخص 29/68",0,0,0,21.419411,39.884103,"30","29/68","إكرام الضيف","172.18.242","منطقة منى","خارج"],["NSK-MIN-CMP-0203","منى - مربع 30 - شاخص 31/68",0,0,0,21.419261,39.884637,"30","31/68","إكرام الضيف","172.16.108","منطقة منى","خارج"],["NSK-MIN-CMP-0204","منى - مربع 31A - شاخص 33/68",0,0,0,21.418771,39.885234,"31A","33/68","مشارق الماسية","172.16.175","منطقة منى","خارج"],["NSK-MIN-CMP-0205","منى - مربع 31B - شاخص 0/68",0,0,0,21.418245,39.88629,"31B","0/68","شركة بيان","","منطقة منى","داخل"],["NSK-MIN-CMP-0206","منى - مربع 31B - شاخص 35/68",0,0,0,21.418245,39.88629,"31B","35/68","شركة بشائر الاسلام","172.17.42","منطقة منى","داخل"],["NSK-MIN-CMP-0207","منى - مربع 32 - شاخص 13/206",0,0,0,21.415063,39.889248,"32","13/206","الراجحي","172.16.95","منطقة منى","خارج"],["NSK-MIN-CMP-0208","منى - مربع 32 - شاخص 5/206",0,0,0,21.416762,39.886835,"32","5/206","الراجحي","172.16.106","منطقة منى","خارج"],["NSK-MIN-CMP-0209","منى - مربع 32 - شاخص 7/206",0,0,0,21.415887,39.88784,"32","7/206","الراجحي","172.16.103","منطقة منى","خارج"],["NSK-MIN-CMP-0210","منى - مربع 33 - شاخص 1/206",0,0,0,21.417382,39.885907,"33","1/206","الراجحي","172.18.101","منطقة منى","خارج"],["NSK-MIN-CMP-0211","منى - مربع 34 - شاخص 17/206",0,0,0,21.414383,39.890671,"34","17/206","إكرام الضيف","172.18.230","منطقة منى","خارج"],["NSK-MIN-CMP-0212","منى - مربع 34 - شاخص 19/206",0,0,0,21.414223,39.891075,"34","19/206","إكرام الضيف","172.16.75","منطقة منى","خارج"],["NSK-MIN-CMP-0213","منى - مربع 34 - شاخص 21/206",0,0,0,21.413799,39.891481,"34","21/206","إكرام الضيف","172.18.232","منطقة منى","خارج"],["NSK-MIN-CMP-0214","منى - مربع 34 - شاخص 23/206",0,0,0,21.413498,39.891934,"34","23/206","إكرام الضيف","172.19.11","منطقة منى","خارج"],["NSK-MIN-CMP-0215","منى - مربع 34 - شاخص 25/206",0,0,0,21.412982,39.892765,"34","25/206","إكرام الضيف","172.18.234","منطقة منى","خارج"],["NSK-MIN-CMP-0216","منى - مربع 34 - شاخص 34/68",0,0,0,21.414708,39.890235,"34","34/68","إكرام الضيف","172.19.8","منطقة منى","خارج"],["NSK-MIN-CMP-0217","منى - مربع 35A - شاخص 40/68",0,0,0,21.413815,39.892608,"35A","40/68","إكرام الضيف","172.18.244","منطقة منى","خارج"],["NSK-MIN-CMP-0218","منى - مربع 35B - شاخص 47/68",0,0,0,21.414119,39.893251,"35B","47/68","إكرام الضيف","172.18.252","منطقة منى","خارج"],["NSK-MIN-CMP-0219","منى - مربع 35C - شاخص 45/68",0,0,0,21.415118,39.891559,"35C","45/68","إكرام الضيف","172.19.1","منطقة منى","خارج"],["NSK-MIN-CMP-0220","منى - مربع 35D5 - شاخص 5/208",0,0,0,21.415307,39.892107,"35D5","5/208","شركة شمس طيبة المحدوده","172.17.242","منطقة منى","داخل"],["NSK-MIN-CMP-0221","منى - مربع 35D5 - شاخص 9/208",0,0,0,21.414584,39.893365,"35D5","9/208","وزارة الحج والعمرة حجاج داخل","172.17.245","منطقة منى","داخل"],["NSK-MIN-CMP-0222","منى - مربع 35E - شاخص 1/208",0,0,0,21.415705,39.891098,"35E","1/208","شركة طريق الهجرتين المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0223","منى - مربع 36 - شاخص 26/206",0,0,0,21.413445,39.890605,"36","26/206","رواف منى","172.16.70","منطقة منى","خارج"],["NSK-MIN-CMP-0224","منى - مربع 36 - شاخص 28/206",0,0,0,21.413019,39.89136,"36","28/206","رواف منى","172.18.237","منطقة منى","خارج"],["NSK-MIN-CMP-0225","منى - مربع 36 - شاخص 30/206",0,0,0,21.412685,39.891905,"36","30/206","رواف منى","172.18.239","منطقة منى","خارج"],["NSK-MIN-CMP-0226","منى - مربع 36 - شاخص 32/206",0,0,0,21.412448,39.892359,"36","32/206","ام من ميلينوم","172.19.15","منطقة منى","خارج"],["NSK-MIN-CMP-0227","منى - مربع 36 - شاخص 37/204",0,0,0,21.412916,39.890197,"36","37/204","رواف منى","172.16.79","منطقة منى","خارج"],["NSK-MIN-CMP-0228","منى - مربع 36 - شاخص 39/204",0,0,0,21.412447,39.890929,"36","39/204","رواف منى","172.16.244","منطقة منى","خارج"],["NSK-MIN-CMP-0229","منى - مربع 36 - شاخص 41/204",0,0,0,21.41218,39.891539,"36","41/204","رواف منى","172.16.245","منطقة منى","خارج"],["NSK-MIN-CMP-0230","منى - مربع 36 - شاخص 43/204",0,0,0,21.411862,39.892046,"36","43/204","رواف منى","172.16.226","منطقة منى","خارج"],["NSK-MIN-CMP-0231","منى - مربع 37 - شاخص 16/206",0,0,0,21.414731,39.88822,"37","16/206","رواف منى","172.18.225","منطقة منى","خارج"],["NSK-MIN-CMP-0232","منى - مربع 37 - شاخص 20/206",0,0,0,21.414138,39.888851,"37","20/206","هوليدي ان بكة","172.16.66","منطقة منى","خارج"],["NSK-MIN-CMP-0233","منى - مربع 37 - شاخص 24/206",0,0,0,21.413715,39.889874,"37","24/206","مشارق الماسية","172.16.69","منطقة منى","خارج"],["NSK-MIN-CMP-0234","منى - مربع 37 - شاخص 25/204",0,0,0,21.414917,39.887613,"37","25/204","رواف منى","172.16.87","منطقة منى","خارج"],["NSK-MIN-CMP-0235","منى - مربع 37 - شاخص 29/204",0,0,0,21.414301,39.888451,"37","29/204","رحلات ومنافع","172.18.97","منطقة منى","خارج"],["NSK-MIN-CMP-0236","منى - مربع 37 - شاخص 33/204",0,0,0,21.413853,39.889388,"37","33/204","الراجحي","172.16.93","منطقة منى","خارج"],["NSK-MIN-CMP-0237","منى - مربع 38 - شاخص A/206",0,0,0,21.416937,39.885209,"38","A/206","الخطوط السعودية","172.16.167","منطقة منى","خارج"],["NSK-MIN-CMP-0238","منى - مربع 38 - شاخص B/204",0,0,0,21.416775,39.885428,"38","B/204","مجموعة سيرا","172.16.144","منطقة منى","خارج"],["NSK-MIN-CMP-0239","منى - مربع 38 - شاخص C/206",0,0,0,21.416604,39.885668,"38","C/206","الراجحي","172.16.139","منطقة منى","خارج"],["NSK-MIN-CMP-0240","منى - مربع 38 - شاخص D/204",0,0,0,21.416441,39.885893,"38","D/204","رواف منى","172.16.145","منطقة منى","خارج"],["NSK-MIN-CMP-0241","منى - مربع 38 - شاخص E/206",0,0,0,21.416274,39.886122,"38","E/206","ابراج شركة مكه","172.16.187","منطقة منى","خارج"],["NSK-MIN-CMP-0242","منى - مربع 38 - شاخص F/204",0,0,0,21.416016,39.886478,"38","F/204","إكرام الضيف","172.16.186","منطقة منى","خارج"],["NSK-MIN-CMP-0243","منى - مربع 38 - شاخص G/206",0,0,0,21.415864,39.88669,"38","G/206","الخطوط السعودية","172.16.166","منطقة منى","خارج"],["NSK-MIN-CMP-0244","منى - مربع 38 - شاخص H/204",0,0,0,21.41569,39.886936,"38","H/204","الخطوط السعودية","172.16.164","منطقة منى","خارج"],["NSK-MIN-CMP-0245","منى - مربع 38 - شاخص I/206",0,0,0,21.415556,39.88718,"38","I/206","ضيوف البيت","172.16.202","منطقة منى","خارج"],["NSK-MIN-CMP-0246","منى - مربع 38 - شاخص J/204",0,0,0,21.415293,39.887279,"38","J/204","شركة بشرى الضيافة","172.16.199","منطقة منى","خارج"],["NSK-MIN-CMP-0247","منى - مربع 38 - شاخص S/204",0,0,0,21.416047,39.886184,"38","S/204","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0248","منى - مربع 39 - شاخص 11/204",0,0,0,21.417107,39.88479,"39","11/204","إكرام الضيف","172.16.77","منطقة منى","خارج"],["NSK-MIN-CMP-0249","منى - مربع 39 - شاخص 5/204",0,0,0,21.417541,39.883573,"39","5/204","ابراج شركة مكه","172.16.88","منطقة منى","خارج"],["NSK-MIN-CMP-0250","منى - مربع 39 - شاخص 9/204",0,0,0,21.417115,39.884315,"39","9/204","إكرام الضيف","172.16.91","منطقة منى","خارج"],["NSK-MIN-CMP-0251","منى - مربع 39A - شاخص 16/68",0,0,0,21.41834,39.883856,"39A","16/68","إكرام الضيف","172.19.5","منطقة منى","خارج"],["NSK-MIN-CMP-0252","منى - مربع 4-1 - شاخص 1/716",0,0,0,21.401468,39.897489,"4-1","1/716","شركة نور النسك لخدمات الحجاج","172.16.113","منطقة منى","داخل"],["NSK-MIN-CMP-0253","منى - مربع 4-2 - شاخص 4/716",0,0,0,21.401062,39.897614,"4-2","4/716","شركة المهابة لخدمة حجاج الداخل","172.16.118","منطقة منى","داخل"],["NSK-MIN-CMP-0254","منى - مربع 4-4 - شاخص 56/44",0,0,0,21.392676,39.901809,"4-4","56/44","شركة هداية الراجحون المحدوده","172.18.115","منطقة منى","داخل"],["NSK-MIN-CMP-0255","منى - مربع 4-4 - شاخص 62/44",0,0,0,21.392139,39.901865,"4-4","62/44","وزارة الحج والعمرة حجاج داخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0256","منى - مربع 4-4 - شاخص 79/38",0,0,0,21.393968,39.901099,"4-4","79/38","شركة بيت المشاعر","172.16.227","منطقة منى","داخل"],["NSK-MIN-CMP-0257","منى - مربع 4-4 - شاخص 95/38",0,0,0,21.391679,39.902008,"4-4","95/38","شركة خالد زامل الغيثي وشركاه المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0258","منى - مربع 4-4 - شاخص 97/38",0,0,0,21.391201,39.902209,"4-4","97/38","شركة هشام بن بدوي سكيك وشركاه","","منطقة منى","داخل"],["NSK-MIN-CMP-0259","منى - مربع 4-5 - شاخص 49/44",0,0,0,21.392884,39.902144,"4-5","49/44","شركة مخيمات الخيرات","172.16.221","منطقة منى","داخل"],["NSK-MIN-CMP-0260","منى - مربع 4-5 - شاخص 51/44",0,0,0,21.392299,39.902744,"4-5","51/44","شركة الفجر","172.16.222","منطقة منى","داخل"],["NSK-MIN-CMP-0261","منى - مربع 40 - شاخص 6/204",0,0,0,21.417246,39.882731,"40","6/204","ابراج شركة مكه","172.16.92","منطقة منى","خارج"],["NSK-MIN-CMP-0262","منى - مربع 41 - شاخص 11/62",0,0,0,21.414926,39.885227,"41","11/62","بشرى الضيافة","172.18.224","منطقة منى","خارج"],["NSK-MIN-CMP-0263","منى - مربع 41 - شاخص 12/204",0,0,0,21.415928,39.884983,"41","12/204","بشرى الضيافة","172.18.160","منطقة منى","خارج"],["NSK-MIN-CMP-0264","منى - مربع 41 - شاخص 14/204",0,0,0,21.415478,39.885615,"41","14/204","بشرى الضيافة","172.18.157","منطقة منى","خارج"],["NSK-MIN-CMP-0265","منى - مربع 41 - شاخص 7/62",0,0,0,21.416116,39.884131,"41","7/62","بشرى الضيافة","172.18.211","منطقة منى","خارج"],["NSK-MIN-CMP-0266","منى - مربع 41 - شاخص 8/204",0,0,0,21.416568,39.883769,"41","8/204","بشرى الضيافة","172.16.90","منطقة منى","خارج"],["NSK-MIN-CMP-0267","منى - مربع 41 - شاخص 9/62",0,0,0,21.415472,39.884644,"41","9/62","بشرى الضيافة","172.18.220","منطقة منى","خارج"],["NSK-MIN-CMP-0268","منى - مربع 42 - شاخص 13/62",0,0,0,21.41471,39.885875,"42","13/62","رفاد","172.18.227","منطقة منى","خارج"],["NSK-MIN-CMP-0269","منى - مربع 42 - شاخص 15/62",0,0,0,21.414008,39.885984,"42","15/62","رفاد","172.18.228","منطقة منى","خارج"],["NSK-MIN-CMP-0270","منى - مربع 42 - شاخص 17/62",0,0,0,21.413572,39.886431,"42","17/62","رفاد","172.18.229","منطقة منى","خارج"],["NSK-MIN-CMP-0271","منى - مربع 42 - شاخص 18/204",0,0,0,21.414679,39.886621,"42","18/204","رفاد","172.16.82","منطقة منى","خارج"],["NSK-MIN-CMP-0272","منى - مربع 42 - شاخص 19/62",0,0,0,21.413235,39.886856,"42","19/62","رفاد","172.18.198","منطقة منى","خارج"],["NSK-MIN-CMP-0273","منى - مربع 42 - شاخص 20/204",0,0,0,21.414269,39.887118,"42","20/204","رفاد","172.16.100","منطقة منى","خارج"],["NSK-MIN-CMP-0274","منى - مربع 42 - شاخص 21/62",0,0,0,21.412853,39.887166,"42","21/62","رفاد","172.18.202","منطقة منى","خارج"],["NSK-MIN-CMP-0275","منى - مربع 42 - شاخص 22/204",0,0,0,21.414054,39.887626,"42","22/204","رفاد","172.16.85","منطقة منى","خارج"],["NSK-MIN-CMP-0276","منى - مربع 42 - شاخص 23/62",0,0,0,21.412676,39.887636,"42","23/62","رفاد","172.18.218","منطقة منى","خارج"],["NSK-MIN-CMP-0277","منى - مربع 42 - شاخص 24/204",0,0,0,21.413441,39.888207,"42","24/204","رفاد","172.16.84","منطقة منى","خارج"],["NSK-MIN-CMP-0278","منى - مربع 43 - شاخص 13/202",0,0,0,21.411021,39.89114,"43","13/202","رحلات ومنافع","172.16.74","منطقة منى","خارج"],["NSK-MIN-CMP-0279","منى - مربع 43 - شاخص 26/204",0,0,0,21.413188,39.888672,"43","26/204","رفاد","172.16.97","منطقة منى","خارج"],["NSK-MIN-CMP-0280","منى - مربع 43 - شاخص 28/204",0,0,0,21.412868,39.889132,"43","28/204","رفاد","172.16.89","منطقة منى","خارج"],["NSK-MIN-CMP-0281","منى - مربع 43 - شاخص 32/204",0,0,0,21.41224,39.889861,"43","32/204","رحلات ومنافع","172.16.96","منطقة منى","خارج"],["NSK-MIN-CMP-0282","منى - مربع 43 - شاخص 36/204",0,0,0,21.411628,39.890742,"43","36/204","ابراج شركة مكه","172.16.99","منطقة منى","خارج"],["NSK-MIN-CMP-0283","منى - مربع 43 - شاخص 40/204",0,0,0,21.41096,39.891724,"43","40/204","رحلات ومنافع","172.16.81","منطقة منى","خارج"],["NSK-MIN-CMP-0284","منى - مربع 43 - شاخص 5/202",0,0,0,21.412498,39.889339,"43","5/202","الراجحي","172.17.233","منطقة منى","خارج"],["NSK-MIN-CMP-0285","منى - مربع 43 - شاخص 9/202",0,0,0,21.411883,39.890162,"43","9/202","اثراء الخير","172.16.73","منطقة منى","خارج"],["NSK-MIN-CMP-0286","منى - مربع 44 - شاخص 25/62",0,0,0,21.412093,39.887998,"44","25/62","الراجحي","172.18.207","منطقة منى","خارج"],["NSK-MIN-CMP-0287","منى - مربع 44 - شاخص 29/62",0,0,0,21.411388,39.888868,"44","29/62","اثراء الخير","172.18.212","منطقة منى","خارج"],["NSK-MIN-CMP-0288","منى - مربع 44 - شاخص 33/62",0,0,0,21.410701,39.889687,"44","33/62","اثراء الخير","172.18.216","منطقة منى","خارج"],["NSK-MIN-CMP-0289","منى - مربع 44 - شاخص 4/202",0,0,0,21.411775,39.888531,"44","4/202","الراجحي","172.17.237","منطقة منى","خارج"],["NSK-MIN-CMP-0290","منى - مربع 44 - شاخص 8/202",0,0,0,21.411211,39.889327,"44","8/202","اثراء الخير","172.16.78","منطقة منى","خارج"],["NSK-MIN-CMP-0291","منى - مربع 45 - شاخص 12/202",0,0,0,21.410547,39.890291,"45","12/202","اثراء الخير","172.18.213","منطقة منى","خارج"],["NSK-MIN-CMP-0292","منى - مربع 45 - شاخص 14/202",0,0,0,21.410324,39.890694,"45","14/202","اثراء الخير","172.18.210","منطقة منى","خارج"],["NSK-MIN-CMP-0293","منى - مربع 45 - شاخص 16/202",0,0,0,21.40996,39.891095,"45","16/202","اثراء الخير","172.17.55","منطقة منى","خارج"],["NSK-MIN-CMP-0294","منى - مربع 45 - شاخص 39/62",0,0,0,21.40951,39.890563,"45","39/62","اثراء الخير","172.18.199","منطقة منى","خارج"],["NSK-MIN-CMP-0295","منى - مربع 46 - شاخص 29/56",0,0,0,21.410415,39.888642,"46","29/56","الراجحي","172.18.131","منطقة منى","خارج"],["NSK-MIN-CMP-0296","منى - مربع 47 - شاخص 21/56",0,0,0,21.412315,39.886753,"47","21/56","ضيوف البيت","172.16.131","منطقة منى","خارج"],["NSK-MIN-CMP-0297","منى - مربع 47 - شاخص 24/62",0,0,0,21.412651,39.886354,"47","24/62","ضيوف البيت","172.18.201","منطقة منى","خارج"],["NSK-MIN-CMP-0298","منى - مربع 47 - شاخص 25/56",0,0,0,21.411456,39.887602,"47","25/56","اثراء الخير","172.16.11","منطقة منى","خارج"],["NSK-MIN-CMP-0299","منى - مربع 47 - شاخص 28/62",0,0,0,21.411753,39.887073,"47","28/62","اثراء الخير","172.18.205","منطقة منى","خارج"],["NSK-MIN-CMP-0300","منى - مربع 47 - شاخص 32/62",0,0,0,21.410981,39.888032,"47","32/62","اثراء الخير","172.18.209","منطقة منى","خارج"],["NSK-MIN-CMP-0301","منى - مربع 48 - شاخص 12/62",0,0,0,21.41478,39.884423,"48","12/62","ضيوف البيت","172.18.222","منطقة منى","خارج"],["NSK-MIN-CMP-0302","منى - مربع 48 - شاخص 13/56",0,0,0,21.413603,39.885244,"48","13/56","ضيوف البيت","172.16.126","منطقة منى","خارج"],["NSK-MIN-CMP-0303","منى - مربع 48 - شاخص 16/62",0,0,0,21.413859,39.884897,"48","16/62","ضيوف البيت","172.18.226","منطقة منى","خارج"],["NSK-MIN-CMP-0304","منى - مربع 48 - شاخص 17/56",0,0,0,21.412969,39.885844,"48","17/56","ضيوف البيت","172.16.124","منطقة منى","خارج"],["NSK-MIN-CMP-0305","منى - مربع 48 - شاخص 20/62",0,0,0,21.413379,39.885559,"48","20/62","ضيوف البيت","172.18.219","منطقة منى","خارج"],["NSK-MIN-CMP-0306","منى - مربع 48 - شاخص 7/56",0,0,0,21.414274,39.883894,"48","7/56","ضيوف البيت","172.16.67","منطقة منى","خارج"],["NSK-MIN-CMP-0307","منى - مربع 48 - شاخص 9/56",0,0,0,21.414003,39.884478,"48","9/56","ضيوف البيت","172.18.144","منطقة منى","خارج"],["NSK-MIN-CMP-0308","منى - مربع 49 - شاخص 10/62",0,0,0,21.41522,39.883616,"49","10/62","ضيوف البيت","","منطقة منى","خارج"],["NSK-MIN-CMP-0309","منى - مربع 49 - شاخص 3/56",0,0,0,21.415475,39.882268,"49","3/56","ام من ميلينوم","172.18.130","منطقة منى","خارج"],["NSK-MIN-CMP-0310","منى - مربع 49 - شاخص 4/62",0,0,0,21.416488,39.882553,"49","4/62","الراجحي","172.16.80","منطقة منى","خارج"],["NSK-MIN-CMP-0311","منى - مربع 49 - شاخص 6/62",0,0,0,21.416037,39.88291,"49","6/62","رحلات ومنافع","172.18.204","منطقة منى","خارج"],["NSK-MIN-CMP-0312","منى - مربع 49 - شاخص 8/62",0,0,0,21.415632,39.883255,"49","8/62","الراجحي","172.18.208","منطقة منى","خارج"],["NSK-MIN-CMP-0313","منى - مربع 5-1 - شاخص 21/50",0,0,0,21.401371,39.898094,"5-1","21/50","شركة الإفاضة المتحدة للخدمات المحدوده","172.18.123","منطقة منى","داخل"],["NSK-MIN-CMP-0314","منى - مربع 5-1 - شاخص 25/50",0,0,0,21.399853,39.899666,"5-1","25/50","شركة سعد بن ابراهيم الحويجي وشركاه","172.18.221","منطقة منى","داخل"],["NSK-MIN-CMP-0315","منى - مربع 5-2 - شاخص 27/50",0,0,0,21.398882,39.900594,"5-2","27/50","شركة البدر القادم المحدودة","172.16.58","منطقة منى","داخل"],["NSK-MIN-CMP-0316","منى - مربع 5-2 - شاخص D11",0,0,0,21.396744,39.902954,"5-2","D11","شركة عبدالمجيد الجريسي","","منطقة منى","داخل"],["NSK-MIN-CMP-0317","منى - مربع 5-3 - شاخص D05",0,0,0,21.397449,39.901265,"5-3","D05","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0318","منى - مربع 5-3 - شاخص D5",0,0,0,21.397449,39.901265,"5-3","D5","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0319","منى - مربع 5-4 - شاخص D06",0,0,0,21.397799,39.900214,"5-4","D06","شركة اضواء الايمان لخدمات الحجاج، شركة فجر المناسك المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0320","منى - مربع 5-4 - شاخص D08",0,0,0,21.396872,39.900613,"5-4","D08","شركة مشاعل النور المحدودة، شركة نماء البركة لخدمات الحجاج","","منطقة منى","داخل"],["NSK-MIN-CMP-0321","منى - مربع 5-4 - شاخص D09",0,0,0,21.396019,39.901021,"5-4","D09","شركة ركاز المتقين","","منطقة منى","داخل"],["NSK-MIN-CMP-0322","منى - مربع 5-5 - شاخص D10",0,0,0,21.396236,39.901916,"5-5","D10","شركة مخيم رفادة المحدودة شركة شخص واحد، شركة مكارم لخدمات الحجاج، شركة قوافل الحجيج المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0323","منى - مربع 5-5 - شاخص D17",0,0,0,21.395373,39.902576,"5-5","D17","شركة الخير المكية لخدمات حجاج الداخل المحدودة، شركة فوج مكة لخدمات حجاج الداخل المحدودة، شركة أبناء محمد شافعي وأبناء ابراهيم الدباب لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0324","منى - مربع 5-6 - شاخص D18",0,0,0,21.395081,39.901441,"5-6","D18","شركة نسك المشاعر لخدمات الحجاج، مؤسسة قافلة مكة لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0325","منى - مربع 5-6 - شاخص D19",0,0,0,21.393732,39.902296,"5-6","D19","شركه السندس المتحده لخدمات حجاج الداخل المحدوده، شركه الركن الخامس للحج","","منطقة منى","داخل"],["NSK-MIN-CMP-0326","منى - مربع 5-7 - شاخص D20",0,0,0,21.394445,39.90302,"5-7","D20","شركه المكرمون لخدمات حجاج الداخل المحدوده، شركه بلاد الحرمين لخدمات حجاج الداخل المحدودة، شركة قافلة المنار","","منطقة منى","داخل"],["NSK-MIN-CMP-0327","منى - مربع 5-7 - شاخص D21",0,0,0,21.393457,39.90355,"5-7","D21","شركة عبدالله العصفور، شركة المسار العمراني، شركة قافلة الهاشم، شركة باب السلام","","منطقة منى","داخل"],["NSK-MIN-CMP-0328","منى - مربع 5-8 - شاخص D30",0,0,0,21.396022,39.903144,"5-8","D30","شركة مدى الجنوب التجارية، شركه الاخيار لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0329","منى - مربع 5-9 - شاخص 1A/720",0,0,0,21.394672,39.904911,"5-9","1A/720","شركة طوى الشرق","172.17.3","منطقة منى","داخل"],["NSK-MIN-CMP-0330","منى - مربع 5-9 - شاخص 1B/720",0,0,0,21.39516,39.904354,"5-9","1B/720","شركة الراجحي لخدمات حجاج الداخل المحدودة","172.17.8","منطقة منى","داخل"],["NSK-MIN-CMP-0331","منى - مربع 5-9 - شاخص A1/720",0,0,0,21.394672,39.904911,"5-9","A1/720","شركة طوى الشرق","","منطقة منى","داخل"],["NSK-MIN-CMP-0332","منى - مربع 50 - شاخص 11/50",0,0,0,21.414473,39.881729,"50","11/50","مشارق الماسية","172.18.116","منطقة منى","خارج"],["NSK-MIN-CMP-0333","منى - مربع 50 - شاخص 13/50",0,0,0,21.413601,39.882865,"50","13/50","مشارق الماسية","172.16.120","منطقة منى","خارج"],["NSK-MIN-CMP-0334","منى - مربع 50 - شاخص 9/50",0,0,0,21.41524,39.880769,"50","9/50","ضيوف البيت","172.18.112","منطقة منى","خارج"],["NSK-MIN-CMP-0335","منى - مربع 50A - شاخص 4/56",0,0,0,21.414925,39.882213,"50A","4/56","مشارق الماسية","172.18.133","منطقة منى","خارج"],["NSK-MIN-CMP-0336","منى - مربع 50A - شاخص 6/56",0,0,0,21.414313,39.882954,"50A","6/56","ضيوف البيت","172.18.139","منطقة منى","خارج"],["NSK-MIN-CMP-0337","منى - مربع 50B - شاخص 10/56",0,0,0,21.413128,39.884444,"50B","10/56","ضيوف البيت","","منطقة منى","خارج"],["NSK-MIN-CMP-0338","منى - مربع 51A - شاخص 12/56",0,0,0,21.411856,39.885955,"51A","12/56","ضيوف البيت","172.16.122","منطقة منى","خارج"],["NSK-MIN-CMP-0339","منى - مربع 51A - شاخص 16/56",0,0,0,21.410713,39.887367,"51A","16/56","الراجحي","172.16.132","منطقة منى","خارج"],["NSK-MIN-CMP-0340","منى - مربع 51B - شاخص 20/56",0,0,0,21.409281,39.888992,"51B","20/56","الراجحي","172.16.129","منطقة منى","خارج"],["NSK-MIN-CMP-0341","منى - مربع 51B-46 - شاخص 24-35-36/56",0,0,0,21.409466,39.889726,"51B-46","24-35-36/56","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0342","منى - مربع 52 - شاخص 42B/50",0,0,0,21.408599,39.887986,"52","42B/50","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0343","منى - مربع 52 - شاخص 44/50",0,0,0,21.408285,39.888785,"52","44/50","ضيوف البيت","172.16.189","منطقة منى","خارج"],["NSK-MIN-CMP-0344","منى - مربع 52 - شاخص 46/50",0,0,0,21.407794,39.88947,"52","46/50","ضيوف البيت","172.16.247","منطقة منى","خارج"],["NSK-MIN-CMP-0345","منى - مربع 52-53 - شاخص 9-42/44",0,0,0,21.409167,39.887491,"52-53","9-42/44","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0346","منى - مربع 53 - شاخص 40-5/50",0,0,0,21.40948,39.886902,"53","40-5/50","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0347","منى - مربع 53 - شاخص B10",0,0,0,21.410052,39.886402,"53","B10","شركة الحمراء المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0348","منى - مربع 54 - شاخص 32/50",0,0,0,21.410162,39.885785,"54","32/50","إستضافة","172.18.89","منطقة منى","خارج"],["NSK-MIN-CMP-0349","منى - مربع 54 - شاخص 32C/50",0,0,0,21.410992,39.885762,"54","32C/50","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0350","منى - مربع 54 - شاخص 32D/50",0,0,0,21.410837,39.88593,"54","32D/50","موقع الكشافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0351","منى - مربع 55 - شاخص 28/50",0,0,0,21.412076,39.884601,"55","28/50","شركة سدانة لخدمات حجاج الداخل","172.16.133","منطقة منى","داخل"],["NSK-MIN-CMP-0352","منى - مربع 57 - شاخص B06",0,0,0,21.412775,39.881325,"57","B06","شركة الظافرة لخدمة حجاج الداخل المحدودة شركة ذات مسؤولية محدودة، شركه الفردوس المتحده لخدمه حجاج الداخل المحدوده، شركة المعالي لخدمات حجاج الداخل المحدودة شركة شخص واحد","","منطقة منى","داخل"],["NSK-MIN-CMP-0353","منى - مربع 59C - شاخص 10-12-37/44",0,0,0,21.407721,39.888371,"59C","10-12-37/44","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0354","منى - مربع 59C - شاخص 14-41/44",0,0,0,21.406842,39.88909,"59C","14-41/44","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0355","منى - مربع 59C - شاخص 14-41/44-38",0,0,0,21.406842,39.88909,"59C","14-41/44-38","شركة فندق ابراج شركة مكه الفندقية","","منطقة منى","خارج"],["NSK-MIN-CMP-0356","منى - مربع 59C - شاخص 33/38",0,0,0,21.408071,39.887401,"59C","33/38","شركة رواحل الإيمان المحدودة","172.18.102","منطقة منى","داخل"],["NSK-MIN-CMP-0357","منى - مربع 6-1 - شاخص 1/502",0,0,0,21.400718,39.899914,"6-1","1/502","شركة الهجرة العربية المحدودة","172.16.196","منطقة منى","داخل"],["NSK-MIN-CMP-0358","منى - مربع 6-2 - شاخص D04",0,0,0,21.399309,39.901852,"6-2","D04","شركة الذاكرين لخدمات حجاج الداخل المحدودة، شركة الفرقان المكيه المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0359","منى - مربع 6-2 - شاخص D4",0,0,0,21.399309,39.901852,"6-2","D4","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0360","منى - مربع 6-3 - شاخص D12",0,0,0,21.397437,39.904034,"6-3","D12","شركة أذان لخدمات حجاج الداخل المحدودة شركة شخص واحد، شركة مواسم الغفران المحدودة، شركة ركن الاجور لخدمات حجاج الداخل المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0361","منى - مربع 6-4 - شاخص 2-4/502",0,0,0,21.398535,39.9033,"6-4","2-4/502","فندق ام من ميلينوم","","منطقة منى","خارج"],["NSK-MIN-CMP-0362","منى - مربع 6-4 - شاخص 6/502",0,0,0,21.397604,39.904398,"6-4","6/502","يسر المشاعر","172.17.109","منطقة منى","خارج"],["NSK-MIN-CMP-0363","منى - مربع 6-4 - شاخص 8/502",0,0,0,21.397165,39.904949,"6-4","8/502","إكرام الضيف","172.17.116","منطقة منى","خارج"],["NSK-MIN-CMP-0364","منى - مربع 6-5 - شاخص D15",0,0,0,21.395753,39.905952,"6-5","D15","شركه حمله اهالي القصيم للحج، شركة سعد جميل القرشي لخدمات حجاج الداخل شركة الشخص الواحد، شركة صالح شاهر ابراهيم زيني وشركاه لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0365","منى - مربع 6-6 - شاخص D14",0,0,0,21.396032,39.906312,"6-6","D14","شركة حملة البشائر لخدمات حجاج الداخل، شركة التيسير للحج والعمرة المحدودة، مؤسسة عطاالله مجول الهذلي لخدمات الحجاج","","منطقة منى","داخل"],["NSK-MIN-CMP-0366","منى - مربع 6-7 - شاخص 1/504",0,0,0,21.396927,39.907022,"6-7","1/504","رواف منى","172.17.50","منطقة منى","خارج"],["NSK-MIN-CMP-0367","منى - مربع 6-7 - شاخص 2/504",0,0,0,21.396339,39.907334,"6-7","2/504","شركة ركن الحطيم للحج","172.16.207","منطقة منى","داخل"],["NSK-MIN-CMP-0368","منى - مربع 6-8 - شاخص 3/504",0,0,0,21.396754,39.907805,"6-8","3/504","شركة حمد اللحياني وحمد الزايدي","172.16.213","منطقة منى","داخل"],["NSK-MIN-CMP-0369","منى - مربع 61 - شاخص 50/38",0,0,0,21.40604,39.888798,"61","50/38","شركة عرفة المحدودة","172.16.141","منطقة منى","داخل"],["NSK-MIN-CMP-0370","منى - مربع 61A - شاخص 52/38",0,0,0,21.405398,39.889642,"61A","52/38","شركة الاطياف للحج المحدودة","172.16.192","منطقة منى","داخل"],["NSK-MIN-CMP-0371","منى - مربع 68 - شاخص 66A/38",0,0,0,21.403073,39.893895,"68","66A/38","شركة العهد الوطنية المحدودة","172.17.102","منطقة منى","داخل"],["NSK-MIN-CMP-0372","منى - مربع 68 - شاخص 66B/38",0,0,0,21.403269,39.893339,"68","66B/38","شركة الاسلام المتحدة لخدمات حجاج الداخل والمعتمرين","172.16.255","منطقة منى","داخل"],["NSK-MIN-CMP-0373","منى - مربع 68 - شاخص 66C/38",0,0,0,21.402767,39.894572,"68","66C/38","شركة تفويج المحدودة","172.18.117","منطقة منى","داخل"],["NSK-MIN-CMP-0374","منى - مربع 68 - شاخص B20",0,0,0,21.404018,39.891094,"68","B20","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0375","منى - مربع 7-1 - شاخص 4/513",0,0,0,21.404633,39.89886,"7-1","4/513","دليل الزوار","172.17.97","منطقة منى","خارج"],["NSK-MIN-CMP-0376","منى - مربع 7-1 - شاخص 6/513",0,0,0,21.404863,39.899201,"7-1","6/513","دليل الزوار","172.17.98","منطقة منى","خارج"],["NSK-MIN-CMP-0377","منى - مربع 7-13 - شاخص 4-2/535",0,0,0,21.399759,39.903539,"7-13","4-2/535","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0378","منى - مربع 7-13A - شاخص 1/535",0,0,0,21.400543,39.903741,"7-13A","1/535","مشارق الماسية","172.16.105","منطقة منى","خارج"],["NSK-MIN-CMP-0379","منى - مربع 7-13B - شاخص 54-1/533",0,0,0,21.400973,39.902555,"7-13B","54-1/533","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0380","منى - مربع 7-13B - شاخص 54/533",0,0,0,21.400973,39.902555,"7-13B","54/533","الراجحي","","منطقة منى","خارج"],["NSK-MIN-CMP-0381","منى - مربع 7-14 - شاخص 71-73/62",0,0,0,21.398577,39.904951,"7-14","71-73/62","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0382","منى - مربع 7-15 - شاخص 1-3-5/506",0,0,0,21.397844,39.905483,"7-15","1-3-5/506","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0383","منى - مربع 7-16 - شاخص 2/506",0,0,0,21.397463,39.905703,"7-16","2/506","إكرام الضيف","172.17.227","منطقة منى","خارج"],["NSK-MIN-CMP-0384","منى - مربع 7-16 - شاخص 4/506",0,0,0,21.397173,39.906473,"7-16","4/506","إكرام الضيف","172.17.234","منطقة منى","خارج"],["NSK-MIN-CMP-0385","منى - مربع 7-1A - شاخص 59-61/62",0,0,0,21.403567,39.898115,"7-1A","59-61/62","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0386","منى - مربع 7-1A - شاخص 63/62",0,0,0,21.402931,39.898451,"7-1A","63/62","الراجحي","172.18.200","منطقة منى","خارج"],["NSK-MIN-CMP-0387","منى - مربع 7-1B - شاخص A1/527",0,0,0,21.403912,39.899234,"7-1B","A1/527","إثراء الجود","172.18.161","منطقة منى","خارج"],["NSK-MIN-CMP-0388","منى - مربع 7-1B - شاخص A2/527",0,0,0,21.403492,39.899388,"7-1B","A2/527","إثراء الجود","172.18.132","منطقة منى","خارج"],["NSK-MIN-CMP-0389","منى - مربع 7-1B - شاخص A3/527",0,0,0,21.403344,39.899812,"7-1B","A3/527","إثراء الجود","172.18.166","منطقة منى","خارج"],["NSK-MIN-CMP-0390","منى - مربع 7-2 - شاخص 1-2-4/513",0,0,0,21.405119,39.89812,"7-2","1-2-4/513","شركة اثراء الخير لخدمات الحجاج","","منطقة منى","خارج"],["NSK-MIN-CMP-0391","منى - مربع 7-2 - شاخص 6/508",0,0,0,21.405166,39.898646,"7-2","6/508","شركة العطير لخدمة حجاج الداخل","172.17.226","منطقة منى","داخل"],["NSK-MIN-CMP-0392","منى - مربع 7-3 - شاخص 2/510",0,0,0,21.406591,39.898038,"7-3","2/510","دليل الزوار","172.17.238","منطقة منى","خارج"],["NSK-MIN-CMP-0393","منى - مربع 7-3 - شاخص 3/508",0,0,0,21.405909,39.898299,"7-3","3/508","يسر المشاعر","172.17.231","منطقة منى","خارج"],["NSK-MIN-CMP-0394","منى - مربع 7-3 - شاخص 4/510",0,0,0,21.406461,39.898648,"7-3","4/510","دليل الزوار","172.17.240","منطقة منى","خارج"],["NSK-MIN-CMP-0395","منى - مربع 7-3 - شاخص 5/508",0,0,0,21.405631,39.898782,"7-3","5/508","مشارق الماسية","172.16.119","منطقة منى","خارج"],["NSK-MIN-CMP-0396","منى - مربع 7-3 - شاخص 6/510",0,0,0,21.406145,39.899142,"7-3","6/510","ضيوف البيت","172.17.243","منطقة منى","خارج"],["NSK-MIN-CMP-0397","منى - مربع 7-3 - شاخص 8/510",0,0,0,21.405749,39.899615,"7-3","8/510","مشارق الماسية","172.17.244","منطقة منى","خارج"],["NSK-MIN-CMP-0398","منى - مربع 7-4 - شاخص 1/510",0,0,0,21.407021,39.898243,"7-4","1/510","رحلات ومنافع","172.19.16","منطقة منى","خارج"],["NSK-MIN-CMP-0399","منى - مربع 7-4 - شاخص 2/518",0,0,0,21.407493,39.898527,"7-4","2/518","دليل الزوار","172.17.58","منطقة منى","خارج"],["NSK-MIN-CMP-0400","منى - مربع 7-4 - شاخص 3/510",0,0,0,21.406726,39.898712,"7-4","3/510","ضيوف البيت","172.17.239","منطقة منى","خارج"],["NSK-MIN-CMP-0401","منى - مربع 7-4 - شاخص 4/518",0,0,0,21.407237,39.899155,"7-4","4/518","يسر المشاعر","172.17.63","منطقة منى","خارج"],["NSK-MIN-CMP-0402","منى - مربع 7-4 - شاخص 5/510",0,0,0,21.406391,39.899344,"7-4","5/510","ام من ميلينوم","172.17.241","منطقة منى","خارج"],["NSK-MIN-CMP-0403","منى - مربع 7-4 - شاخص 6/518",0,0,0,21.406907,39.899734,"7-4","6/518","دليل الزوار","172.17.65","منطقة منى","خارج"],["NSK-MIN-CMP-0404","منى - مربع 7-4 - شاخص 7/510",0,0,0,21.406119,39.900003,"7-4","7/510","بشرى الضيافة","172.17.246","منطقة منى","خارج"],["NSK-MIN-CMP-0405","منى - مربع 7-4 - شاخص 8/518",0,0,0,21.406489,39.900247,"7-4","8/518","بشرى الضيافة","172.17.73","منطقة منى","خارج"],["NSK-MIN-CMP-0406","منى - مربع 7-5 - شاخص 10/518",0,0,0,21.405925,39.900798,"7-5","10/518","مشارق الماسية","172.16.64","منطقة منى","خارج"],["NSK-MIN-CMP-0407","منى - مربع 7-5 - شاخص 12-14-16/518",0,0,0,21.405502,39.901626,"7-5","12-14-16/518","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0408","منى - مربع 7-5A - شاخص 10/513",0,0,0,21.405589,39.900113,"7-5A","10/513","يسر المشاعر","172.17.105","منطقة منى","خارج"],["NSK-MIN-CMP-0409","منى - مربع 7-5A - شاخص 8/513",0,0,0,21.405258,39.899647,"7-5A","8/513","دليل الزوار","172.17.103","منطقة منى","خارج"],["NSK-MIN-CMP-0410","منى - مربع 7-5B - شاخص T1/527",0,0,0,21.405196,39.900732,"7-5B","T1/527","مؤسسة عبداللطيف الحماد","","منطقة منى","داخل"],["NSK-MIN-CMP-0411","منى - مربع 7-5B - شاخص T2/527",0,0,0,21.404742,39.901085,"7-5B","T2/527","شركة المنار لخدمة حجاج الداخل","172.18.165","منطقة منى","داخل"],["NSK-MIN-CMP-0412","منى - مربع 7-5B - شاخص T3/527",0,0,0,21.404318,39.901446,"7-5B","T3/527","شركة  إيثار المحدودة","172.18.171","منطقة منى","داخل"],["NSK-MIN-CMP-0413","منى - مربع 7-5B - شاخص T4/527",0,0,0,21.403946,39.901691,"7-5B","T4/527","شركة قافلة النخبة لخدمات الحجاج","172.18.223","منطقة منى","داخل"],["NSK-MIN-CMP-0414","منى - مربع 7-5B - شاخص T5/527",0,0,0,21.403579,39.90131,"7-5B","T5/527","إثراء الجود","172.18.236","منطقة منى","خارج"],["NSK-MIN-CMP-0415","منى - مربع 7-5B - شاخص T6/527",0,0,0,21.404056,39.900968,"7-5B","T6/527","شركة المقام الأمين لخدمة حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0416","منى - مربع 7-5B - شاخص T7/527",0,0,0,21.404336,39.900579,"7-5B","T7/527","شركة المشاعر المتحدة المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0417","منى - مربع 7-5B - شاخص T8/527",0,0,0,21.404839,39.900332,"7-5B","T8/527","شركة سرهد لخدمات حجاج الداخل","172.18.153","منطقة منى","داخل"],["NSK-MIN-CMP-0418","منى - مربع 7-6 - شاخص 1/519",0,0,0,21.402367,39.899259,"7-6","1/519","الراجحي","172.16.172","منطقة منى","خارج"],["NSK-MIN-CMP-0419","منى - مربع 7-7 - شاخص 1-3-5/521",0,0,0,21.401796,39.899725,"7-7","1-3-5/521","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0420","منى - مربع 7-8 - شاخص 7/521",0,0,0,21.402689,39.900538,"7-8","7/521","دليل الزوار","172.16.116","منطقة منى","خارج"],["NSK-MIN-CMP-0421","منى - مربع 7-8 - شاخص 9/521",0,0,0,21.403028,39.90111,"7-8","9/521","دليل الزوار","172.17.83","منطقة منى","خارج"],["NSK-MIN-CMP-0422","منى - مربع 7-9 - شاخص 8-6-4-2/521",0,0,0,21.402155,39.900747,"7-9","8-6-4-2/521","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0423","منى - مربع 7-9A - شاخص 2/533",0,0,0,21.401031,39.901413,"7-9A","2/533","الراجحي","172.16.115","منطقة منى","خارج"],["NSK-MIN-CMP-0424","منى - مربع 7-9A - شاخص 4/533",0,0,0,21.401586,39.901782,"7-9A","4/533","الراجحي","172.16.109","منطقة منى","خارج"],["NSK-MIN-CMP-0425","منى - مربع 7-9B - شاخص 27-36/533",0,0,0,21.401715,39.903293,"7-9B","27-36/533","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0426","منى - مربع 7-9B - شاخص 35/533",0,0,0,21.402227,39.902678,"7-9B","35/533","الراجحي","172.16.210","منطقة منى","خارج"],["NSK-MIN-CMP-0427","منى - مربع 7-9B - شاخص 37-36/533",0,0,0,21.401715,39.903293,"7-9B","37-36/533","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0428","منى - مربع 70 - شاخص 28A/44",0,0,0,21.404471,39.893015,"70","28A/44","وزارة الحج والعمرة حجاج داخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0429","منى - مربع 70 - شاخص 28B/44",0,0,0,21.404211,39.893398,"70","28B/44","","","منطقة منى",""],["NSK-MIN-CMP-0430","منى - مربع 70 - شاخص 28C/44",0,0,0,21.403968,39.893587,"70","28C/44","شركة الأسواف المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0431","منى - مربع 70 - شاخص 45A-45B/38",0,0,0,21.406288,39.88996,"70","45A-45B/38","شركه التقوي لخدمات حجاج الداخل المحدودة، مؤسسة ريادة الوطن لخدمات الحجاج، شركة حسن عبدالله احمد القرشي ومحمد مرزوق القرشي، شركة افاق المشاعر التجارية شركة شخص واحد، شركة مواكب الأهلة لخدمات حجاج الداخل المحدودة","","منطقة منى","داخل"],["NSK-MIN-CMP-0432","منى - مربع 70 - شاخص B17",0,0,0,21.406328,39.890695,"70","B17","شركة عبدالله صالح الكاف لخدمات حجاج الداخل، شركة محمد عمر بالي فلمبان وشريكه","","منطقة منى","داخل"],["NSK-MIN-CMP-0433","منى - مربع 72B - شاخص 11/44",0,0,0,21.406623,39.891193,"72B","11/44","مؤسسة عبدالله حمد العراجه","172.18.81","منطقة منى","داخل"],["NSK-MIN-CMP-0434","منى - مربع 72B - شاخص 13/44",0,0,0,21.406822,39.890952,"72B","13/44","شركة دار الإيمان الأولى للحج","172.16.127","منطقة منى","داخل"],["NSK-MIN-CMP-0435","منى - مربع 72B - شاخص 15/44",0,0,0,21.404145,39.893945,"72B","15/44","شركة نور حراء المحدوده","","منطقة منى","داخل"],["NSK-MIN-CMP-0436","منى - مربع 72B - شاخص 48/50",0,0,0,21.40737,39.890765,"72B","48/50","شركة سعود بن عبدالعزيز الجميعه وشركاه التضامنيه","172.16.223","منطقة منى","داخل"],["NSK-MIN-CMP-0437","منى - مربع 72B - شاخص 50/50",0,0,0,21.406876,39.891424,"72B","50/50","شركة رفاق الصفوة التجارية","","منطقة منى","داخل"],["NSK-MIN-CMP-0438","منى - مربع 72B - شاخص 52/50",0,0,0,21.4061,39.892104,"72B","52/50","اثراء الخير","172.19.3","منطقة منى","خارج"],["NSK-MIN-CMP-0439","منى - مربع 72B - شاخص 52A/50",0,0,0,21.40489,39.893754,"72B","52A/50","شركة الطائفين لخدمة حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0440","منى - مربع 72B - شاخص 54/50",0,0,0,21.404549,39.894192,"72B","54/50","شركة حملة الاحسان لخدمة حجاج الداخل المحدوده","172.17.16","منطقة منى","داخل"],["NSK-MIN-CMP-0441","منى - مربع 72B - شاخص 56/50",0,0,0,21.403904,39.894582,"72B","56/50","شركة الطائفين","","منطقة منى","داخل"],["NSK-MIN-CMP-0442","منى - مربع 72B - شاخص 72/50",0,0,0,21.40489,39.893754,"72B","72/50","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0443","منى - مربع 73B - شاخص B23",0,0,0,21.403251,39.895167,"73B","B23","إستضافة","","منطقة منى","خارج"],["NSK-MIN-CMP-0444","منى - مربع 73C - شاخص 0/50",0,0,0,21.403666,39.895589,"73C","0/50","شركة محسن بن سالم الأحمدي وشركاه","","منطقة منى","داخل"],["NSK-MIN-CMP-0445","منى - مربع 74A - شاخص B18",0,0,0,21.407387,39.891952,"74A","B18","شركة مواكب اليسر لخدمات حجاج الداخل المحدودة، شركة مخيم الوفاء الحديثه لخدمات حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0446","منى - مربع 74A - شاخص B19",0,0,0,21.406443,39.893428,"74A","B19","شركة الاخلاص المتحدة لخدمة حجاج الداخل المحدودة، شركة رحاب المشاعر لخدمات الحجاج","","منطقة منى","داخل"],["NSK-MIN-CMP-0447","منى - مربع 74B - شاخص 34/56",0,0,0,21.405519,39.894413,"74B","34/56","الراجحي","172.16.171","منطقة منى","خارج"],["NSK-MIN-CMP-0448","منى - مربع 74B - شاخص 36/56",0,0,0,21.405199,39.894786,"74B","36/56","الراجحي","172.16.197","منطقة منى","خارج"],["NSK-MIN-CMP-0449","منى - مربع 74B - شاخص 38/56",0,0,0,21.40458,39.895378,"74B","38/56","الراجحي","172.16.230","منطقة منى","خارج"],["NSK-MIN-CMP-0450","منى - مربع 74C - شاخص 40/56",0,0,0,21.403943,39.895988,"74C","40/56","شركة فجر الهدى","172.16.238","منطقة منى","داخل"],["NSK-MIN-CMP-0451","منى - مربع 74C - شاخص 56/40",0,0,0,21.403943,39.895988,"74C","56/40","حجاج الداخل","","منطقة منى","داخل"],["NSK-MIN-CMP-0452","منى - مربع 75A - شاخص 43/62",0,0,0,21.408816,39.891636,"75A","43/62","الراجحي","172.18.203","منطقة منى","خارج"],["NSK-MIN-CMP-0453","منى - مربع 75B - شاخص 39/56",0,0,0,21.407893,39.892262,"75B","39/56","اثراء الخير","172.18.141","منطقة منى","خارج"],["NSK-MIN-CMP-0454","منى - مربع 75B - شاخص 42/62",0,0,0,21.408515,39.891259,"75B","42/62","اثراء الخير","172.16.61","منطقة منى","خارج"],["NSK-MIN-CMP-0455","منى - مربع 75C - شاخص 43/56",0,0,0,21.406728,39.894138,"75C","43/56","الراجحي","172.16.229","منطقة منى","خارج"],["NSK-MIN-CMP-0456","منى - مربع 75C - شاخص 46/62",0,0,0,21.407419,39.893179,"75C","46/62","الراجحي","172.18.206","منطقة منى","خارج"],["NSK-MIN-CMP-0457","منى - مربع 75D - شاخص 49/56",0,0,0,21.404971,39.895758,"75D","49/56","الراجحي","172.16.121","منطقة منى","خارج"],["NSK-MIN-CMP-0458","منى - مربع 75D - شاخص 52/62",0,0,0,21.405912,39.895011,"75D","52/62","الراجحي","172.18.217","منطقة منى","خارج"],["NSK-MIN-CMP-0459","منى - مربع 76 - شاخص 1-1-2/415",0,0,0,21.409992,39.892599,"76","1-1-2/415","شركة مناسك المشاعر لخدمات الحجاج","","منطقة منى","خارج"],["NSK-MIN-CMP-0460","منى - مربع 77 - شاخص 10/404",0,0,0,21.407525,39.895875,"77","10/404","","172.18.238","منطقة منى",""],["NSK-MIN-CMP-0461","منى - مربع 77 - شاخص 12/404",0,0,0,21.407176,39.89648,"77","12/404","","172.18.235","منطقة منى",""],["NSK-MIN-CMP-0462","منى - مربع 77 - شاخص 2/404",0,0,0,21.408801,39.892828,"77","2/404","","172.17.251","منطقة منى",""],["NSK-MIN-CMP-0463","منى - مربع 77 - شاخص 4/404",0,0,0,21.408551,39.893517,"77","4/404","","172.18.9","منطقة منى",""],["NSK-MIN-CMP-0464","منى - مربع 77 - شاخص 6/404",0,0,0,21.408265,39.893923,"77","6/404","","172.16.174","منطقة منى",""],["NSK-MIN-CMP-0465","منى - مربع 77 - شاخص 8/404",0,0,0,21.408041,39.894811,"77","8/404","","172.16.176","منطقة منى",""],["NSK-MIN-CMP-0466","منى - مربع 78 - شاخص 49/62",0,0,0,21.407183,39.894324,"78","49/62","اثراء الخير","172.16.220","منطقة منى","خارج"],["NSK-MIN-CMP-0467","منى - مربع 78 - شاخص 51/62",0,0,0,21.406848,39.894842,"78","51/62","اثراء الخير","172.18.215","منطقة منى","خارج"],["NSK-MIN-CMP-0468","منى - مربع 78 - شاخص 53/62",0,0,0,21.406494,39.895285,"78","53/62","اثراء الخير","172.16.48","منطقة منى","خارج"],["NSK-MIN-CMP-0469","منى - مربع 78 - شاخص 55/62",0,0,0,21.406156,39.895736,"78","55/62","اثراء الخير","172.16.169","منطقة منى","خارج"],["NSK-MIN-CMP-0470","منى - مربع 78 - شاخص 57/62",0,0,0,21.405727,39.896034,"78","57/62","اثراء الخير","172.18.231","منطقة منى","خارج"],["NSK-MIN-CMP-0471","منى - مربع 79 - شاخص 10/421",0,0,0,21.409108,39.898244,"79","10/421","رواف منى","172.18.79","منطقة منى","خارج"],["NSK-MIN-CMP-0472","منى - مربع 79 - شاخص 16/421",0,0,0,21.41075,39.899029,"79","16/421","رواف منى","172.16.130","منطقة منى","خارج"],["NSK-MIN-CMP-0473","منى - مربع 79 - شاخص 18/421",0,0,0,21.412208,39.899788,"79","18/421","مشارق الماسية","172.18.71","منطقة منى","خارج"],["NSK-MIN-CMP-0474","منى - مربع 79 - شاخص 2-4/421",0,0,0,21.405667,39.896647,"79","2-4/421","حجاج المجاملة","","منطقة منى","خارج"],["NSK-MIN-CMP-0475","منى - مربع 79 - شاخص 4/421",0,0,0,21.405667,39.896647,"79","4/421","ابراج شركة مكه","172.16.128","منطقة منى","خارج"],["NSK-MIN-CMP-0476","منى - مربع 79 - شاخص 8/421",0,0,0,21.407142,39.897311,"79","8/421","ابراج شركة مكه","172.18.82","منطقة منى","خارج"],["NSK-MIN-CMP-0477","منى - مربع 7A - شاخص 6/112",0,0,0,21.415682,39.881145,"7A","6/112","ضيوف البيت","172.17.21","منطقة منى","خارج"],["NSK-MIN-CMP-0478","منى - مربع 7B - شاخص 5-7/50",0,0,0,21.415916,39.879684,"7B","5-7/50","ضيوف خادم الحرمين الشريفين","","منطقة منى","خارج"],["NSK-MIN-CMP-0479","منى - مربع 7C - شاخص 3/50",0,0,0,21.416546,39.8784,"7C","3/50","ضيوف خادم الحرمين الشريفين","","منطقة منى","خارج"],["NSK-MIN-CMP-0480","منى - مربع 8-1 - شاخص 1/530",0,0,0,21.411724,39.901737,"8-1","1/530","رواف منى","172.19.68","منطقة منى","خارج"],["NSK-MIN-CMP-0481","منى - مربع 8-1 - شاخص 3/530",0,0,0,21.411169,39.902451,"8-1","3/530","رواف منى","172.19.86","منطقة منى","خارج"],["NSK-MIN-CMP-0482","منى - مربع 8-10 - شاخص 2/529",0,0,0,21.406567,39.902777,"8-10","2/529","ام من ميلينوم","172.19.29","منطقة منى","خارج"],["NSK-MIN-CMP-0483","منى - مربع 8-10 - شاخص 4/529",0,0,0,21.40691,39.903289,"8-10","4/529","بشرى الضيافة","172.19.34","منطقة منى","خارج"],["NSK-MIN-CMP-0484","منى - مربع 8-11 - شاخص 11/524",0,0,0,21.408311,39.903153,"8-11","11/524","مشارق الذهبية","172.17.59","منطقة منى","خارج"],["NSK-MIN-CMP-0485","منى - مربع 8-11 - شاخص 4/526",0,0,0,21.408834,39.902828,"8-11","4/526","مشارق الذهبية","172.19.82","منطقة منى","خارج"],["NSK-MIN-CMP-0486","منى - مربع 8-11 - شاخص 7/524",0,0,0,21.409235,39.902483,"8-11","7/524","مشارق الذهبية","172.17.62","منطقة منى","خارج"],["NSK-MIN-CMP-0487","منى - مربع 8-11 - شاخص 8/526",0,0,0,21.407961,39.9037,"8-11","8/526","مشارق الذهبية","172.19.70","منطقة منى","خارج"],["NSK-MIN-CMP-0488","منى - مربع 8-12 - شاخص 1/526",0,0,0,21.4098,39.903194,"8-12","1/526","مشارق الذهبية","172.19.85","منطقة منى","خارج"],["NSK-MIN-CMP-0489","منى - مربع 8-12 - شاخص 4/528",0,0,0,21.4094,39.903641,"8-12","4/528","مشارق الذهبية","172.19.54","منطقة منى","خارج"],["NSK-MIN-CMP-0490","منى - مربع 8-12 - شاخص 5/526",0,0,0,21.408853,39.903916,"8-12","5/526","مشارق الذهبية","172.19.75","منطقة منى","خارج"],["NSK-MIN-CMP-0491","منى - مربع 8-12 - شاخص 8/528",0,0,0,21.408635,39.904524,"8-12","8/528","مشارق الذهبية","172.19.65","منطقة منى","خارج"],["NSK-MIN-CMP-0492","منى - مربع 8-13 - شاخص 1/528",0,0,0,21.409864,39.904064,"8-13","1/528","مشارق الذهبية","172.19.50","منطقة منى","خارج"],["NSK-MIN-CMP-0493","منى - مربع 8-13 - شاخص 3/528",0,0,0,21.409108,39.904778,"8-13","3/528","مشارق الذهبية","172.19.60","منطقة منى","خارج"],["NSK-MIN-CMP-0494","منى - مربع 8-14 - شاخص 10/529",0,0,0,21.408438,39.905332,"8-14","10/529","مشارق الذهبية","172.19.58","منطقة منى","خارج"],["NSK-MIN-CMP-0495","منى - مربع 8-14 - شاخص 3/531",0,0,0,21.407412,39.905045,"8-14","3/531","ام من ميلينوم","172.19.98","منطقة منى","خارج"],["NSK-MIN-CMP-0496","منى - مربع 8-14 - شاخص 5/531",0,0,0,21.407812,39.905864,"8-14","5/531","رواف منى","172.19.93","منطقة منى","خارج"],["NSK-MIN-CMP-0497","منى - مربع 8-14 - شاخص 6/529",0,0,0,21.407347,39.90398,"8-14","6/529","رواف منى","172.19.40","منطقة منى","خارج"],["NSK-MIN-CMP-0498","منى - مربع 8-14 - شاخص 8/529",0,0,0,21.407899,39.904472,"8-14","8/529","مشارق الذهبية","172.19.47","منطقة منى","خارج"],["NSK-MIN-CMP-0499","منى - مربع 8-16 - شاخص 2/542",0,0,0,21.410269,39.90484,"8-16","2/542","ضيوف البيت","172.18.56","منطقة منى","خارج"],["NSK-MIN-CMP-0500","منى - مربع 8-17 - شاخص 2/547",0,0,0,21.409562,39.905272,"8-17","2/547","ضيوف البيت","172.18.53","منطقة منى","خارج"],["NSK-MIN-CMP-0501","منى - مربع 8-17 - شاخص 4/547",0,0,0,21.409968,39.905994,"8-17","4/547","ضيوف البيت","172.16.51","منطقة منى","خارج"],["NSK-MIN-CMP-0502","منى - مربع 8-2 - شاخص 2/530",0,0,0,21.411691,39.901297,"8-2","2/530","رواف منى","172.19.74","منطقة منى","خارج"],["NSK-MIN-CMP-0503","منى - مربع 8-2 - شاخص 4/530",0,0,0,21.410769,39.902059,"8-2","4/530","رواف منى","172.19.79","منطقة منى","خارج"],["NSK-MIN-CMP-0504","منى - مربع 8-20 - شاخص 2/548",0,0,0,21.406756,39.908021,"8-20","2/548","مشارق المتميزة","172.18.40","منطقة منى","خارج"],["NSK-MIN-CMP-0505","منى - مربع 8-20 - شاخص 4/548",0,0,0,21.405844,39.908884,"8-20","4/548","مشارق المتميزة","172.18.30","منطقة منى","خارج"],["NSK-MIN-CMP-0506","منى - مربع 8-21 - شاخص 1/548",0,0,0,21.406842,39.908645,"8-21","1/548","مشارق المتميزة","172.18.45","منطقة منى","خارج"],["NSK-MIN-CMP-0507","منى - مربع 8-22 - شاخص 1/550",0,0,0,21.407235,39.909086,"8-22","1/550","مشارق المتميزة","172.16.142","منطقة منى","خارج"],["NSK-MIN-CMP-0508","منى - مربع 8-22 - شاخص 3/550",0,0,0,21.406439,39.909335,"8-22","3/550","ابراج شركة مكه","172.18.103","منطقة منى","خارج"],["NSK-MIN-CMP-0509","منى - مربع 8-22 - شاخص 5/550",0,0,0,21.405238,39.909465,"8-22","5/550","ابراج شركة مكه","172.18.105","منطقة منى","خارج"],["NSK-MIN-CMP-0510","منى - مربع 8-23 - شاخص 78/68",0,0,0,21.405628,39.908267,"8-23","78/68","إكرام الضيف","172.19.18","منطقة منى","خارج"],["NSK-MIN-CMP-0511","منى - مربع 8-23 - شاخص 80/68",0,0,0,21.40475,39.909002,"8-23","80/68","إكرام الضيف","172.19.19","منطقة منى","خارج"],["NSK-MIN-CMP-0512","منى - مربع 8-23 - شاخص 82/68",0,0,0,21.404218,39.90954,"8-23","82/68","بشرى الضيافة","172.19.21","منطقة منى","خارج"],["NSK-MIN-CMP-0513","منى - مربع 8-23 - شاخص 84/68",0,0,0,21.403709,39.909895,"8-23","84/68","هوليدي ان بكة","172.19.22","منطقة منى","خارج"],["NSK-MIN-CMP-0514","منى - مربع 8-3 - شاخص 1/524",0,0,0,21.410889,39.900788,"8-3","1/524","مشارق الماسية","172.17.75","منطقة منى","خارج"],["NSK-MIN-CMP-0515","منى - مربع 8-3 - شاخص 1/527",0,0,0,21.410294,39.903036,"8-3","1/527","مشارق الذهبية","172.19.44","منطقة منى","خارج"],["NSK-MIN-CMP-0516","منى - مربع 8-3 - شاخص 3/524",0,0,0,21.410084,39.901457,"8-3","3/524","مشارق الماسية","172.17.68","منطقة منى","خارج"],["NSK-MIN-CMP-0517","منى - مربع 8-3 - شاخص 5/524",0,0,0,21.409779,39.901987,"8-3","5/524","إثراء الجود","172.17.66","منطقة منى","خارج"],["NSK-MIN-CMP-0518","منى - مربع 8-4 - شاخص 3/522",0,0,0,21.410012,39.900523,"8-4","3/522","دليل الزوار","172.17.95","منطقة منى","خارج"],["NSK-MIN-CMP-0519","منى - مربع 8-4 - شاخص 4/524",0,0,0,21.410778,39.900063,"8-4","4/524","مشارق الماسية","172.17.79","منطقة منى","خارج"],["NSK-MIN-CMP-0520","منى - مربع 8-4 - شاخص 6/524",0,0,0,21.409658,39.901005,"8-4","6/524","ام من ميلينوم","172.17.71","منطقة منى","خارج"],["NSK-MIN-CMP-0521","منى - مربع 8-4 - شاخص 7/522",0,0,0,21.409078,39.901117,"8-4","7/522","ام من ميلينوم","172.17.87","منطقة منى","خارج"],["NSK-MIN-CMP-0522","منى - مربع 8-5 - شاخص 2/522",0,0,0,21.410061,39.899543,"8-5","2/522","دليل الزوار","172.18.10","منطقة منى","خارج"],["NSK-MIN-CMP-0523","منى - مربع 8-5 - شاخص 3/520",0,0,0,21.409406,39.899711,"8-5","3/520","دليل الزوار","172.17.60","منطقة منى","خارج"],["NSK-MIN-CMP-0524","منى - مربع 8-5 - شاخص 6/522",0,0,0,21.409038,39.900182,"8-5","6/522","ام من ميلينوم","172.17.92","منطقة منى","خارج"],["NSK-MIN-CMP-0525","منى - مربع 8-5 - شاخص 7/520",0,0,0,21.408553,39.900468,"8-5","7/520","مشارق الماسية","172.17.86","منطقة منى","خارج"],["NSK-MIN-CMP-0526","منى - مربع 8-6 - شاخص 1/518",0,0,0,21.408124,39.898687,"8-6","1/518","مشارق الماسية","172.17.51","منطقة منى","خارج"],["NSK-MIN-CMP-0527","منى - مربع 8-6 - شاخص 2/520",0,0,0,21.409001,39.899099,"8-6","2/520","مشارق الماسية","172.17.57","منطقة منى","خارج"],["NSK-MIN-CMP-0528","منى - مربع 8-6 - شاخص 3/518",0,0,0,21.407968,39.899048,"8-6","3/518","مشارق الماسية","172.17.56","منطقة منى","خارج"],["NSK-MIN-CMP-0529","منى - مربع 8-6 - شاخص 4/520",0,0,0,21.408791,39.899456,"8-6","4/520","مشارق الماسية","172.17.54","منطقة منى","خارج"],["NSK-MIN-CMP-0530","منى - مربع 8-6 - شاخص 5/518",0,0,0,21.407649,39.899359,"8-6","5/518","مشارق الماسية","172.17.61","منطقة منى","خارج"],["NSK-MIN-CMP-0531","منى - مربع 8-6 - شاخص 6/520",0,0,0,21.408407,39.899751,"8-6","6/520","مشارق الماسية","172.17.49","منطقة منى","خارج"],["NSK-MIN-CMP-0532","منى - مربع 8-6 - شاخص 8/520",0,0,0,21.408117,39.899959,"8-6","8/520","مشارق الماسية","172.17.64","منطقة منى","خارج"],["NSK-MIN-CMP-0533","منى - مربع 8-7 - شاخص 10/520",0,0,0,21.407695,39.900451,"8-7","10/520","دليل الزوار","172.17.90","منطقة منى","خارج"],["NSK-MIN-CMP-0534","منى - مربع 8-7 - شاخص 12/520",0,0,0,21.407175,39.900545,"8-7","12/520","ام من ميلينوم","172.19.113","منطقة منى","خارج"],["NSK-MIN-CMP-0535","منى - مربع 8-7 - شاخص 14/520",0,0,0,21.406897,39.900854,"8-7","14/520","بشرى الضيافة","172.17.74","منطقة منى","خارج"],["NSK-MIN-CMP-0536","منى - مربع 8-7 - شاخص 16/520",0,0,0,21.406621,39.901078,"8-7","16/520","رحلات ومنافع","172.17.77","منطقة منى","خارج"],["NSK-MIN-CMP-0537","منى - مربع 8-7 - شاخص 18/520",0,0,0,21.40635,39.901518,"8-7","18/520","ضيوف البيت","172.17.94","منطقة منى","خارج"],["NSK-MIN-CMP-0538","منى - مربع 8-7 - شاخص 20/520",0,0,0,21.406115,39.901961,"8-7","20/520","يسر المشاعر","172.17.93","منطقة منى","خارج"],["NSK-MIN-CMP-0539","منى - مربع 8-7 - شاخص 7/518",0,0,0,21.407348,39.899937,"8-7","7/518","ام من ميلينوم","172.17.69","منطقة منى","خارج"],["NSK-MIN-CMP-0540","منى - مربع 8-8 - شاخص 12/522",0,0,0,21.407701,39.901308,"8-8","12/522","ضيوف البيت","172.18.3","منطقة منى","خارج"],["NSK-MIN-CMP-0541","منى - مربع 8-8 - شاخص 13/520",0,0,0,21.407131,39.901584,"8-8","13/520","ضيوف البيت","172.17.72","منطقة منى","خارج"],["NSK-MIN-CMP-0542","منى - مربع 8-8 - شاخص 16/522",0,0,0,21.406766,39.902018,"8-8","16/522","رحلات ومنافع","172.17.250","منطقة منى","خارج"],["NSK-MIN-CMP-0543","منى - مربع 8-8 - شاخص 9/520",0,0,0,21.408074,39.900866,"8-8","9/520","هوليدي ان بكة","172.17.67","منطقة منى","خارج"],["NSK-MIN-CMP-0544","منى - مربع 8-9 - شاخص 12/524",0,0,0,21.408276,39.902255,"8-9","12/524","إثراء الجود","172.17.52","منطقة منى","خارج"],["NSK-MIN-CMP-0545","منى - مربع 8-9 - شاخص 13/522",0,0,0,21.407699,39.902441,"8-9","13/522","رفاد","172.17.253","منطقة منى","خارج"],["NSK-MIN-CMP-0546","منى - مربع 8-9 - شاخص 16/524",0,0,0,21.407371,39.902803,"8-9","16/524","إثراء الجود","172.17.53","منطقة منى","خارج"],["NSK-MIN-CMP-0547","منى - مربع 8-9 - شاخص 9/522",0,0,0,21.408611,39.901607,"8-9","9/522","ام من ميلينوم","172.18.7","منطقة منى","خارج"],["NSK-MIN-CMP-0548","منى - مربع 80 - شاخص 17/404",0,0,0,21.407952,39.896486,"80","17/404","","172.18.24","منطقة منى",""],["NSK-MIN-CMP-0549","منى - مربع 80 - شاخص 17/406",0,0,0,21.407843,39.896872,"80","17/406","شركة الراجحي للخدمات التجارية المساندة","","منطقة منى","خارج"],["NSK-MIN-CMP-0550","منى - مربع 80 - شاخص 18/406",0,0,0,21.408354,39.896204,"80","18/406","شركة الراجحي للخدمات التجارية المساندة","172.17.112","منطقة منى","خارج"],["NSK-MIN-CMP-0551","منى - مربع 80 - شاخص 22/406",0,0,0,21.407866,39.897081,"80","22/406","","172.17.119","منطقة منى",""],["NSK-MIN-CMP-0552","منى - مربع 81 - شاخص 13/404",0,0,0,21.408468,39.895503,"81","13/404","","172.18.15","منطقة منى",""],["NSK-MIN-CMP-0553","منى - مربع 81 - شاخص 14/406",0,0,0,21.408765,39.895199,"81","14/406","","172.17.224","منطقة منى",""],["NSK-MIN-CMP-0554","منى - مربع 81 - شاخص 9/404",0,0,0,21.408831,39.894841,"81","9/404","","172.18.12","منطقة منى",""],["NSK-MIN-CMP-0555","منى - مربع 82 - شاخص 10/406",0,0,0,21.40918,39.894341,"82","10/406","شركة مناسك المشاعر لخدمات الحجاج","172.17.104","منطقة منى","خارج"],["NSK-MIN-CMP-0556","منى - مربع 82 - شاخص 5-6-10/406",0,0,0,21.409529,39.893998,"82","5-6-10/406","شركة مناسك المشاعر لخدمات الحجاج","","منطقة منى","خارج"],["NSK-MIN-CMP-0557","منى - مربع 82 - شاخص 5/404",0,0,0,21.409367,39.893947,"82","5/404","شركة مناسك المشاعر لخدمات الحجاج","172.18.1","منطقة منى","خارج"],["NSK-MIN-CMP-0558","منى - مربع 82 - شاخص 6/406",0,0,0,21.409816,39.89368,"82","6/406","شركة مناسك المشاعر لخدمات الحجاج","172.17.101","منطقة منى","خارج"],["NSK-MIN-CMP-0559","منى - مربع 82-83 - شاخص 1/406",0,0,0,21.410712,39.894003,"82-83","1/406","مناسك المشاعر","172.17.99","منطقة منى","خارج"],["NSK-MIN-CMP-0560","منى - مربع 84 - شاخص 3-5/406",0,0,0,21.410039,39.895041,"84","3-5/406","","","منطقة منى",""],["NSK-MIN-CMP-0561","منى - مربع 84 - شاخص 6/425",0,0,0,21.410717,39.895758,"84","6/425","","172.18.85","منطقة منى",""],["NSK-MIN-CMP-0562","منى - مربع 85 - شاخص 1/425",0,0,0,21.409842,39.895993,"85","1/425","رواف منى","","منطقة منى","خارج"],["NSK-MIN-CMP-0563","منى - مربع 85 - شاخص 1/427",0,0,0,21.410516,39.897327,"85","1/427","رواف منى","172.18.61","منطقة منى","خارج"],["NSK-MIN-CMP-0564","منى - مربع 85 - شاخص 2/425",0,0,0,21.41068,39.896626,"85","2/425","مشارق الماسية","172.16.101","منطقة منى","خارج"],["NSK-MIN-CMP-0565","منى - مربع 85 - شاخص 3/427",0,0,0,21.409599,39.896771,"85","3/427","إثراء الجود","172.18.59","منطقة منى","خارج"],["NSK-MIN-CMP-0566","منى - مربع 86 - شاخص 11/406",0,0,0,21.409141,39.896981,"86","11/406","مناسك المشاعر","172.17.114","منطقة منى","خارج"],["NSK-MIN-CMP-0567","منى - مربع 86 - شاخص 12/408",0,0,0,21.41055,39.898219,"86","12/408","رواف منى","172.17.115","منطقة منى","خارج"],["NSK-MIN-CMP-0568","منى - مربع 86 - شاخص 13/406",0,0,0,21.408931,39.897509,"86","13/406","مشارق الماسية","172.17.118","منطقة منى","خارج"],["NSK-MIN-CMP-0569","منى - مربع 86 - شاخص 2/427",0,0,0,21.409859,39.897445,"86","2/427","إثراء الجود","172.16.102","منطقة منى","خارج"],["NSK-MIN-CMP-0570","منى - مربع 86 - شاخص 3/421",0,0,0,21.409717,39.898041,"86","3/421","مشارق الماسية","172.18.77","منطقة منى","خارج"],["NSK-MIN-CMP-0571","منى - مربع 86 - شاخص 4/427",0,0,0,21.410088,39.897602,"86","4/427","شركة اثراء الجود لخدمات الحجاج","","منطقة منى","خارج"],["NSK-MIN-CMP-0572","منى - مربع 87 - شاخص 1/408",0,0,0,21.411277,39.893584,"87","1/408","مشارق الماسية","172.17.228","منطقة منى","خارج"],["NSK-MIN-CMP-0573","منى - مربع 87 - شاخص 11/408",0,0,0,21.411232,39.897847,"87","11/408","ابراج شركة مكه","172.17.117","منطقة منى","خارج"],["NSK-MIN-CMP-0574","منى - مربع 87 - شاخص 13/408",0,0,0,21.411302,39.89864,"87","13/408","ابراج شركة مكه","172.17.223","منطقة منى","خارج"],["NSK-MIN-CMP-0575","منى - مربع 87 - شاخص 5/408",0,0,0,21.411336,39.895126,"87","5/408","مشارق الماسية","172.16.138","منطقة منى","خارج"],["NSK-MIN-CMP-0576","منى - مربع 87 - شاخص 7/408",0,0,0,21.411292,39.896204,"87","7/408","مشارق الماسية","172.16.56","منطقة منى","خارج"],["NSK-MIN-CMP-0577","منى - مربع 87 - شاخص 9/408",0,0,0,21.411239,39.897154,"87","9/408","إثراء الجود","172.17.113","منطقة منى","خارج"],["NSK-MIN-CMP-0578","منى - مربع 88A - شاخص 52/68",0,0,0,21.412027,39.896772,"88A","52/68","اثراء الخير","172.18.248","منطقة منى","خارج"],["NSK-MIN-CMP-0579","منى - مربع 88A - شاخص 54/68",0,0,0,21.412121,39.897489,"88A","54/68","اثراء الخير","172.19.10","منطقة منى","خارج"],["NSK-MIN-CMP-0580","منى - مربع 88A - شاخص 56/68",0,0,0,21.412285,39.89819,"88A","56/68","اثراء الخير","172.19.12","منطقة منى","خارج"],["NSK-MIN-CMP-0581","منى - مربع 88A - شاخص 58/68",0,0,0,21.412187,39.898966,"88A","58/68","اثراء الخير","172.19.17","منطقة منى","خارج"],["NSK-MIN-CMP-0582","منى - مربع 88B - شاخص 2/207",0,0,0,21.412684,39.893481,"88B","2/207","اثراء الخير","172.16.62","منطقة منى","خارج"],["NSK-MIN-CMP-0583","منى - مربع 88B - شاخص 4/207",0,0,0,21.412157,39.893607,"88B","4/207","اثراء الخير","172.16.72","منطقة منى","خارج"],["NSK-MIN-CMP-0584","منى - مربع 88B - شاخص 44/68",0,0,0,21.412905,39.894101,"88B","44/68","اثراء الخير","172.18.246","منطقة منى","خارج"],["NSK-MIN-CMP-0585","منى - مربع 88B - شاخص 48/68",0,0,0,21.412423,39.894851,"88B","48/68","اثراء الخير","172.18.249","منطقة منى","خارج"],["NSK-MIN-CMP-0586","منى - مربع 88B - شاخص 50/68",0,0,0,21.412062,39.896027,"88B","50/68","اثراء الخير","172.16.228","منطقة منى","خارج"],["NSK-MIN-CMP-0587","منى - مربع 89 - شاخص 51/68",0,0,0,21.413779,39.894611,"89","51/68","ضيوف البيت","172.18.241","منطقة منى","خارج"],["NSK-MIN-CMP-0588","منى - مربع 89 - شاخص 53/68",0,0,0,21.413518,39.894997,"89","53/68","مشارق الماسية","172.18.240","منطقة منى","خارج"],["NSK-MIN-CMP-0589","منى - مربع 9 - شاخص 2/112",0,0,0,21.416798,39.879368,"9","2/112","ضيوف خادم الحرمين الشريفين","172.18.168","منطقة منى","خارج"],["NSK-MIN-CMP-0590","منى - مربع 9-1 - شاخص 17-19-21/88",0,0,0,21.410524,39.906864,"9-1","17-19-21/88","شركة الرفادة لخدمات الحجاج","","منطقة منى","خارج"],["NSK-MIN-CMP-0591","منى - مربع 9-2 - شاخص 1/561",0,0,0,21.411006,39.907036,"9-2","1/561","الرفادة","172.18.50","منطقة منى","خارج"],["NSK-MIN-CMP-0592","منى - مربع 9-2 - شاخص 2/561",0,0,0,21.410962,39.907506,"9-2","2/561","الرفادة","172.18.55","منطقة منى","خارج"],["NSK-MIN-CMP-0593","منى - مربع 9-4 - شاخص 3/563",0,0,0,21.411961,39.909187,"9-4","3/563","حجاج المجاملة","172.18.96","منطقة منى","خارج"],["NSK-MIN-CMP-0594","منى - مربع 9-4 - شاخص 5/563",0,0,0,21.412094,39.908485,"9-4","5/563","ابراج شركة مكه","172.18.94","منطقة منى","خارج"],["NSK-MIN-CMP-0595","منى - مربع 9-5 - شاخص 2/552",0,0,0,21.410936,39.908003,"9-5","2/552","الرفادة","172.18.37","منطقة منى","خارج"],["NSK-MIN-CMP-0596","منى - مربع 9-5 - شاخص 4/552",0,0,0,21.410431,39.908343,"9-5","4/552","الرفادة","172.18.27","منطقة منى","خارج"],["NSK-MIN-CMP-0597","منى - مربع 9-5 - شاخص 6/552",0,0,0,21.409595,39.908891,"9-5","6/552","الرفادة","172.18.14","منطقة منى","خارج"],["NSK-MIN-CMP-0598","منى - مربع 9-6 - شاخص 1/552",0,0,0,21.411648,39.90841,"9-6","1/552","الرفادة","172.18.44","منطقة منى","خارج"],["NSK-MIN-CMP-0599","منى - مربع 9-6 - شاخص 11/552",0,0,0,21.408309,39.909773,"9-6","11/552","الرفادة","172.18.0","منطقة منى","خارج"],["NSK-MIN-CMP-0600","منى - مربع 9-6 - شاخص 3/552",0,0,0,21.41118,39.908949,"9-6","3/552","الرفادة","172.18.33","منطقة منى","خارج"],["NSK-MIN-CMP-0601","منى - مربع 9-6 - شاخص 5/552",0,0,0,21.410751,39.909146,"9-6","5/552","الرفادة","172.18.23","منطقة منى","خارج"],["NSK-MIN-CMP-0602","منى - مربع 9-6 - شاخص 7/552",0,0,0,21.410158,39.909263,"9-6","7/552","الرفادة","172.18.19","منطقة منى","خارج"],["NSK-MIN-CMP-0603","منى - مربع 9-6 - شاخص 9/552",0,0,0,21.409276,39.909619,"9-6","9/552","الرفادة","172.18.4","منطقة منى","خارج"],["NSK-MIN-CMP-0604","منى - مربع 9-7 - شاخص 2/554",0,0,0,21.407156,39.910046,"9-7","2/554","الرفادة","172.18.68","منطقة منى","خارج"],["NSK-MIN-CMP-0605","منى - مربع 9-7 - شاخص 4/554",0,0,0,21.405788,39.910291,"9-7","4/554","الرفادة","172.18.66","منطقة منى","خارج"],["NSK-MIN-CMP-0606","منى - مربع 9-7 - شاخص 6/554",0,0,0,21.404867,39.910504,"9-7","6/554","الرفادة","172.18.63","منطقة منى","خارج"],["NSK-MIN-CMP-0607","منى - مربع 9-8 - شاخص 5/554",0,0,0,21.4054,39.910864,"9-8","5/554","الرفادة","172.18.64","منطقة منى","خارج"],["NSK-MIN-CMP-0608","منى - مربع 9-8 - شاخص 7/554",0,0,0,21.404253,39.911104,"9-8","7/554","الرفادة","172.18.60","منطقة منى","خارج"],["NSK-MIN-CMP-0609","منى - مربع 90 - شاخص 24/608",0,0,0,21.414541,39.895575,"90","24/608","إكرام الضيف","172.19.37","منطقة منى","خارج"],["NSK-MIN-CMP-0610","منى - مربع 90 - شاخص 26/608",0,0,0,21.414025,39.896011,"90","26/608","إكرام الضيف","172.19.33","منطقة منى","خارج"],["NSK-MIN-CMP-0611","منى - مربع 90 - شاخص 28/608",0,0,0,21.4137,39.896637,"90","28/608","إكرام الضيف","172.19.31","منطقة منى","خارج"],["NSK-MIN-CMP-0612","منى - مربع 90 - شاخص 30/608",0,0,0,21.413093,39.897261,"90","30/608","مشارق الماسية","172.17.253","منطقة منى","خارج"],["NSK-MIN-CMP-0613","منى - مربع 90 - شاخص 55/68",0,0,0,21.413018,39.895833,"90","55/68","إكرام الضيف","172.17.7","منطقة منى","خارج"],["NSK-MIN-CMP-0614","منى - مربع 90 - شاخص 57/68",0,0,0,21.412846,39.896543,"90","57/68","إكرام الضيف","172.18.250","منطقة منى","خارج"],["NSK-MIN-CMP-0615","منى - مربع 91A - شاخص 20/616",0,0,0,21.414246,39.898962,"91A","20/616","مشارق المتميزة","172.17.2","منطقة منى","خارج"],["NSK-MIN-CMP-0616","منى - مربع 91A - شاخص 22/616",0,0,0,21.413734,39.899725,"91A","22/616","مشارق المتميزة","172.17.6","منطقة منى","خارج"],["NSK-MIN-CMP-0617","منى - مربع 91A - شاخص 24/616",0,0,0,21.413175,39.90027,"91A","24/616","مشارق المتميزة","172.16.140","منطقة منى","خارج"],["NSK-MIN-CMP-0618","منى - مربع 91A - شاخص 27/608",0,0,0,21.413434,39.898299,"91A","27/608","مشارق المتميزة","172.17.232","منطقة منى","خارج"],["NSK-MIN-CMP-0619","منى - مربع 91A - شاخص 29/608",0,0,0,21.412958,39.899077,"91A","29/608","مشارق المتميزة","172.19.76","منطقة منى","خارج"],["NSK-MIN-CMP-0620","منى - مربع 91B - شاخص 59/68",0,0,0,21.412858,39.898028,"91B","59/68","ضيوف البيت","172.19.13","منطقة منى","خارج"],["NSK-MIN-CMP-0621","منى - مربع 92 - شاخص 14/88",0,0,0,21.412897,39.902555,"92","14/88","الرفادة","172.18.74","منطقة منى","خارج"],["NSK-MIN-CMP-0622","منى - مربع 92 - شاخص 2/655",0,0,0,21.414056,39.902009,"92","2/655","الرفادة","172.17.254","منطقة منى","خارج"],["NSK-MIN-CMP-0623","منى - مربع 92 - شاخص 4/655",0,0,0,21.414458,39.901827,"92","4/655","الرفادة","172.18.8","منطقة منى","خارج"],["NSK-MIN-CMP-0624","منى - مربع 92 - شاخص 6/655",0,0,0,21.415084,39.901775,"92","6/655","الرفادة","172.18.11","منطقة منى","خارج"],["NSK-MIN-CMP-0625","منى - مربع 92 - شاخص 8/655",0,0,0,21.415648,39.901834,"92","8/655","الرفادة","172.18.18","منطقة منى","خارج"],["NSK-MIN-CMP-0626","منى - مربع 93 - شاخص 11/88",0,0,0,21.412994,39.903002,"93","11/88","الرفادة","172.18.76","منطقة منى","خارج"],["NSK-MIN-CMP-0627","منى - مربع 93 - شاخص 13/88",0,0,0,21.412186,39.903445,"93","13/88","الرفادة","172.18.78","منطقة منى","خارج"],["NSK-MIN-CMP-0628","منى - مربع 93 - شاخص 3/88",0,0,0,21.416502,39.902156,"93","3/88","الرفادة","172.17.36","منطقة منى","خارج"],["NSK-MIN-CMP-0629","منى - مربع 93 - شاخص 7/88",0,0,0,21.414698,39.902538,"93","7/88","الرفادة","172.17.33","منطقة منى","خارج"],["NSK-MIN-CMP-0630","منى - مربع 94 - شاخص 1/655",0,0,0,21.414541,39.901087,"94","1/655","الرفادة","172.18.6","منطقة منى","خارج"],["NSK-MIN-CMP-0631","منى - مربع 94 - شاخص 12/88",0,0,0,21.417143,39.901143,"94","12/88","رحلات ومنافع","172.17.24","منطقة منى","خارج"],["NSK-MIN-CMP-0632","منى - مربع 94 - شاخص 5/655",0,0,0,21.416353,39.9014,"94","5/655","رحلات ومنافع","172.18.17","منطقة منى","خارج"],["NSK-MIN-CMP-0633","منى - مربع 95 - شاخص 10/649",0,0,0,21.416024,39.900345,"95","10/649","الراجحي B2C","172.19.51","منطقة منى","خارج"],["NSK-MIN-CMP-0634","منى - مربع 95 - شاخص 12/649",0,0,0,21.4164,39.900374,"95","12/649","الراجحي B2C","172.19.57","منطقة منى","خارج"],["NSK-MIN-CMP-0635","منى - مربع 95 - شاخص 14/649",0,0,0,21.417,39.900158,"95","14/649","الراجحي B2C","172.19.67","منطقة منى","خارج"],["NSK-MIN-CMP-0636","منى - مربع 95 - شاخص 2/649",0,0,0,21.414205,39.900123,"95","2/649","الراجحي B2C","172.19.45","منطقة منى","خارج"],["NSK-MIN-CMP-0637","منى - مربع 95 - شاخص 4/649",0,0,0,21.414765,39.900072,"95","4/649","الراجحي B2C","172.19.32","منطقة منى","خارج"],["NSK-MIN-CMP-0638","منى - مربع 95 - شاخص 6/649",0,0,0,21.41517,39.900138,"95","6/649","الراجحي B2C","172.19.35","منطقة منى","خارج"],["NSK-MIN-CMP-0639","منى - مربع 95 - شاخص 8/649",0,0,0,21.415629,39.900332,"95","8/649","الراجحي B2C","","منطقة منى","خارج"],["NSK-MIN-CMP-0640","منى - مربع 96 - شاخص 1/649",0,0,0,21.415187,39.899158,"96","1/649","الراجحي B2C","172.19.123","منطقة منى","خارج"],["NSK-MIN-CMP-0641","منى - مربع 96 - شاخص 3/649",0,0,0,21.415889,39.898975,"96","3/649","الراجحي B2C","172.18.49","منطقة منى","خارج"],["NSK-MIN-CMP-0642","منى - مربع 96 - شاخص 4/647",0,0,0,21.416354,39.89904,"96","4/647","الراجحي B2C","172.18.54","منطقة منى","خارج"],["NSK-MIN-CMP-0643","منى - مربع 96 - شاخص 7/649",0,0,0,21.416873,39.899399,"96","7/649","الراجحي B2C","172.19.61","منطقة منى","خارج"],["NSK-MIN-CMP-0644","منى - مربع 96 - شاخص 8/647",0,0,0,21.417433,39.899175,"96","8/647","الراجحي B2C","172.18.122","منطقة منى","خارج"],["NSK-MIN-CMP-0645","منى - مربع 97 - شاخص 16/616",0,0,0,21.415383,39.898207,"97","16/616","مشارق المتميزة","172.17.5","منطقة منى","خارج"],["NSK-MIN-CMP-0646","منى - مربع 97 - شاخص 18/616",0,0,0,21.414818,39.898441,"97","18/616","مشارق المتميزة","172.17.26","منطقة منى","خارج"],["NSK-MIN-CMP-0647","منى - مربع 97 - شاخص 2/625",0,0,0,21.41579,39.897811,"97","2/625","مشارق المتميزة","172.18.65","منطقة منى","خارج"],["NSK-MIN-CMP-0648","منى - مربع 97 - شاخص 21/608",0,0,0,21.414339,39.896972,"97","21/608","إكرام الضيف","172.19.28","منطقة منى","خارج"],["NSK-MIN-CMP-0649","منى - مربع 97 - شاخص 23/608",0,0,0,21.414221,39.89754,"97","23/608","مشارق المتميزة","172.17.236","منطقة منى","خارج"],["NSK-MIN-CMP-0650","منى - مربع 97 - شاخص 25/608",0,0,0,21.414086,39.897923,"97","25/608","مشارق المتميزة","172.16.60","منطقة منى","خارج"],["NSK-MIN-CMP-0651","منى - مربع 97 - شاخص 4/625",0,0,0,21.415572,39.897432,"97","4/625","مشارق المتميزة","172.18.67","منطقة منى","خارج"],["NSK-MIN-CMP-0652","منى - مربع 97 - شاخص 6/625",0,0,0,21.414806,39.896765,"97","6/625","مشارق المتميزة","172.18.69","منطقة منى","خارج"],["NSK-MIN-CMP-0653","منى - مربع 98 - شاخص 10/616",0,0,0,21.417064,39.896898,"98","10/616","مشارق المتميزة","172.17.107","منطقة منى","خارج"],["NSK-MIN-CMP-0654","منى - مربع 98 - شاخص 12/616",0,0,0,21.416234,39.89722,"98","12/616","مشارق المتميزة","172.17.4","منطقة منى","خارج"],["NSK-MIN-CMP-0655","منى - مربع 98 - شاخص 15/608",0,0,0,21.415724,39.89548,"98","15/608","مشارق المتميزة","172.19.42","منطقة منى","خارج"],["NSK-MIN-CMP-0656","منى - مربع 98 - شاخص 17/608",0,0,0,21.415402,39.895678,"98","17/608","مشارق المتميزة","172.19.38","منطقة منى","خارج"],["NSK-MIN-CMP-0657","منى - مربع 98 - شاخص 19/608",0,0,0,21.414993,39.896158,"98","19/608","مشارق المتميزة","172.16.47","منطقة منى","خارج"],["NSK-MIN-CMP-0658","منى - مربع 98 - شاخص 8/616",0,0,0,21.417289,39.896521,"98","8/616","مشارق المتميزة","172.17.13","منطقة منى","خارج"],["NSK-MIN-CMP-0659","منى - مربع 99 - شاخص 13/620",0,0,0,21.417347,39.89559,"99","13/620","مشارق المتميزة","172.19.105","منطقة منى","خارج"],["NSK-MIN-CMP-0660","منى - مربع 99 - شاخص 4/616",0,0,0,21.418096,39.895479,"99","4/616","مشارق المتميزة","172.17.14","منطقة منى","خارج"],["NSK-MIN-CMP-0661","منى - مربع A1 - شاخص A/50",0,0,0,21.41794,39.874253,"A1","A/50","الشركة فجر النسك لخدمات الحجاج","","منطقة منى","داخل"],["NSK-MIN-CMP-0662","منى - مربع A1 - شاخص B/50",0,0,0,21.417638,39.874672,"A1","B/50","شركة عبدالرحمن عثمان الكليب وشركاه","","منطقة منى","داخل"],["NSK-MIN-CMP-0663","منى - مربع A1 - شاخص C/50",0,0,0,21.417189,39.874848,"A1","C/50","شركة مخيم النور لخدمات حجاج الداخل المحدوده","","منطقة منى","داخل"],["NSK-MIN-CMP-0664","منى - مربع A1 - شاخص D/50",0,0,0,21.417015,39.875088,"A1","D/50","شركة محمد عبدالله القرشي وشركاه التضامنية","","منطقة منى","داخل"],["NSK-MIN-CMP-0665","منى - مربع A1 - شاخص E/50",0,0,0,21.416733,39.875462,"A1","E/50","مؤسسة سعود دهيران دخيل الله الشلوي لخدمات الحجاج","172.18.164","منطقة منى","داخل"],["NSK-MIN-CMP-0666","منى - مربع A2 - شاخص A2",0,0,0,21.417951,39.873372,"A2","A2","","","منطقة منى",""],["NSK-MIN-CMP-0667","منى - مربع A2 - شاخص A2/38",0,0,0,21.417951,39.873372,"A2","A2/38","شركة الاتقان للحج","172.19.102","منطقة منى","داخل"],["NSK-MIN-CMP-0668","منى - مربع A3 - شاخص A3",0,0,0,21.420331,39.880238,"A3","A3","شركة المحيميد، شركة محمد الرويس","","منطقة منى","داخل"],["NSK-MIN-CMP-0669","منى - مربع A4 - شاخص A4",0,0,0,21.420523,39.879861,"A4","A4","شركة السلام المتحدة، شركة قافلة الاتمام","","منطقة منى","داخل"],["NSK-MIN-CMP-0670","منى - مربع A5 - شاخص A5",0,0,0,21.420686,39.879473,"A5","A5","شركة قاصد المشاعر، شركة حملة المحمل","","منطقة منى","داخل"],["NSK-MIN-CMP-0671","منى - مربع B1 - شاخص B1",0,0,0,21.420109,39.881031,"B1","B1","شركة مخيم الرشاد","","منطقة منى","داخل"],["NSK-MIN-CMP-0672","منى - مربع B2 - شاخص B2",0,0,0,21.420265,39.880643,"B2","B2","شركة سيف الإسلام","","منطقة منى","داخل"],["NSK-MIN-CMP-0673","منى - مربع B6 - شاخص B6",0,0,0,21.420906,39.879089,"B6","B6","شركة حج","","منطقة منى","داخل"],["NSK-MIN-CMP-0674","منى - مربع C1 - شاخص 1/3",0,0,0,21.420541,39.880873,"C1","1/3","حج الملاحق الفندقية","","منطقة منى","داخل"],["NSK-MIN-CMP-0675","منى - مربع S1 - شاخص S1-B",0,0,0,21.399342,39.904279,"S1","S1-B","شركة بيان","","منطقة منى","داخل"],["NSK-MIN-CMP-0676","منى - مربع S1 - شاخص S1-C",0,0,0,21.399687,39.903991,"S1","S1-C","اعمال الشاطئ","","منطقة منى","داخل"],["NSK-MIN-CMP-0677","منى - مربع S1 - شاخص S1-D",0,0,0,21.399545,39.903717,"S1","S1-D","اخوان السعودية","","منطقة منى","داخل"],["NSK-MIN-CMP-0678","منى - مربع S1 - شاخص S1-E",0,0,0,21.399272,39.903614,"S1","S1-E","شركة وفود الحرمين لاصحابها سعود الشريف وجمعان الثقفي ومنصور العصيمي التضامنية","","منطقة منى","داخل"],["NSK-MIN-CMP-0679","منى - مربع S1 - شاخص S1-F",0,0,0,21.399149,39.903971,"S1","S1-F","منابر الايمان","","منطقة منى","داخل"]],"p":[["NSK-ARF-COR-0001","عرفات - ممر AR-01",1,1,1,21.3541,39.982122,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0002","عرفات - ممر AR-02",1,1,1,21.355587,39.982382,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0003","عرفات - ممر AR-03",1,1,1,21.353377,39.982818,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0004","عرفات - ممر AR-04",1,1,1,21.353322,39.984556,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0005","عرفات - ممر AR-05",1,1,1,21.353715,39.985142,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0006","عرفات - ممر AR-06",1,1,1,21.357082,39.97781,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0007","عرفات - ممر AR-06",1,1,1,21.345853,39.977457,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0008","عرفات - ممر AR-07",1,1,1,21.359511,39.973785,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0009","عرفات - ممر AR-08",1,1,1,21.355245,39.980171,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0010","عرفات - ممر AR-09",1,1,1,21.356357,39.978254,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0011","عرفات - ممر AR-10",1,1,1,21.35796,39.975704,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0012","عرفات - ممر AR-11",1,1,1,21.359511,39.973127,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0013","عرفات - ممر AR-12",1,1,1,21.362515,39.985947,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0014","عرفات - ممر AR-13",1,1,1,21.359019,39.98361,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0015","عرفات - ممر AR-14",1,1,1,21.348592,39.972967,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0016","عرفات - ممر AR-15",1,1,1,21.350249,39.995367,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0017","عرفات - ممر AR-16",1,1,1,21.352276,39.992151,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0018","عرفات - ممر AR-17",1,1,1,21.354192,39.988901,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0019","عرفات - ممر AR-18",1,1,1,21.356125,39.985628,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0020","عرفات - ممر AR-19",1,1,1,21.350458,39.980833,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0021","عرفات - ممر AR-20",1,1,1,21.348145,39.979311,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0022","عرفات - ممر AR-21",1,1,1,21.352613,39.986509,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0023","عرفات - ممر AR-22",1,1,1,21.350838,39.989225,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0024","عرفات - ممر AR-23",1,1,1,21.350193,39.992562,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0025","عرفات - ممر AR-24",1,1,1,21.364116,39.984101,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0026","عرفات - ممر AR-25",1,1,1,21.360392,39.981158,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0027","عرفات - ممر AR-26",1,1,1,21.356696,39.978699,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0028","عرفات - ممر AR-27",1,1,1,21.353192,39.976283,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0029","عرفات - ممر AR-28",1,1,1,21.351044,39.97486,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0030","عرفات - ممر AR-29",1,1,1,21.354048,39.980085,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0031","عرفات - ممر AR-30",1,1,1,21.355428,39.977812,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0032","عرفات - ممر AR-31",1,1,1,21.351805,39.978502,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0033","عرفات - ممر AR-32",1,1,1,21.349649,39.977049,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0034","عرفات - ممر AR-33",1,1,1,21.362412,39.979382,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0035","عرفات - ممر AR-34",1,1,1,21.359736,39.977541,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0036","عرفات - ممر AR-35",1,1,1,21.356636,39.975451,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0037","عرفات - ممر AR-36",1,1,1,21.354511,39.973972,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0038","عرفات - ممر AR-37",1,1,1,21.352484,39.972542,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0039","عرفات - ممر AR-38",1,1,1,21.354969,39.966102,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0040","عرفات - ممر AR-39",1,1,1,21.352353,39.970557,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0041","عرفات - ممر AR-40",1,1,1,21.350064,39.973925,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0042","عرفات - ممر AR-41",1,1,1,21.347262,39.9784,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0043","عرفات - ممر AR-42",1,1,1,21.344917,39.976877,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0044","عرفات - ممر AR-43",1,1,1,21.347639,39.972215,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0045","عرفات - ممر AR-44",1,1,1,21.349889,39.968573,"","","","منطقة عرفات","لم يبدأ",""],["NSK-ARF-COR-0046","عرفات - ممر AR-45",1,1,1,21.35246,39.964243,"","","","منطقة عرفات","لم يبدأ",""],["NSK-MIN-CAM-0001","كاميرا وزارة A28  [2 cams] - ROUCKET",0,2,3,21.419222,39.882389,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0002","كاميرا وزارة A29 - ROUCKET",0,2,3,21.419583,39.880139,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0003","كاميرا وزارة B116 - ROUCKET",0,2,3,21.408861,39.888694,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0004","كاميرا وزارة B37 - ROUCKET",0,2,3,21.416667,39.882778,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0005","كاميرا وزارة B41 - ROUCKET",0,2,3,21.410556,39.891111,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0006","كاميرا وزارة B42 - ROUCKET",0,2,3,21.411944,39.890556,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0007","كاميرا وزارة B44 - ROUCKET",0,2,3,21.41,39.889444,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0008","كاميرا وزارة B48 (PTZ) - ROUCKET",0,2,3,21.41475,39.88275,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0009","كاميرا وزارة B50 - ROUCKET",0,2,3,21.413,39.883528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0010","كاميرا وزارة B60 - ROUCKET",0,2,3,21.417833,39.88025,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0011","كاميرا وزارة C11 - ROUCKET",0,2,3,21.400972,39.899333,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0012","كاميرا وزارة C191 - ROUCKET",0,2,3,21.400833,39.899167,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0013","كاميرا وزارة C51 - ROUCKET",0,2,3,21.401917,39.897611,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0014","كاميرا وزارة POLE 1 - ROUCKET",0,2,3,21.415222,39.881278,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0015","كاميرا وزارة POLE 2 - ROUCKET",0,2,3,21.417861,39.879861,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0016","كاميرا وزارة POLE 3 - ROUCKET",0,2,3,21.418694,39.88075,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0017","كاميرا وزارة POLE 4 - ROUCKET",0,2,3,21.419167,39.879194,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0018","كاميرا وزارة POLE 5 - ROUCKET",0,2,3,21.394639,39.905167,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0019","كاميرا وزارة A10 - ROUCKET",0,2,3,21.4175,39.87825,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0020","كاميرا وزارة A11 - ROUCKET",0,2,3,21.417861,39.880333,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0021","كاميرا وزارة A32 - ROUCKET",0,2,3,21.417111,39.878056,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0022","كاميرا وزارة A5  [2 cams] (PTZ) - ROUCKET",0,2,3,21.417806,39.882111,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0023","كاميرا وزارة B17 (PTZ) - ROUCKET",0,2,3,21.417444,39.881917,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0024","كاميرا وزارة POLE 6 - ROUCKET",0,2,3,21.420139,39.878667,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0025","كاميرا وزارة POLE 7  [2 cams] - ROUCKET",0,2,3,21.414389,39.880806,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0026","كاميرا وزارة POLE 8 (PTZ) - ROUCKET",0,2,3,21.399333,39.903083,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0027","كاميرا وزارة POLE 9  [2 cams] - ROUCKET",0,2,3,21.413417,39.893556,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0032","كاميرا وزارة A13 - BLUE 1",0,2,3,21.417722,39.880917,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0033","كاميرا وزارة C54 - BLUE 1",0,2,3,21.395167,39.904611,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0034","كاميرا وزارة POLE 10 - BLUE 1",0,2,3,21.420028,39.880806,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0035","كاميرا وزارة POLE 11 - BLUE 1",0,2,3,21.418361,39.884528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0036","كاميرا وزارة B91 - BLUE 2",0,2,3,21.409694,39.889083,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0037","كاميرا وزارة C185 - BLUE 2",0,2,3,21.405083,39.896,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0038","كاميرا وزارة C188 - BLUE 2",0,2,3,21.405667,39.895694,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0039","كاميرا وزارة C58 - BLUE 2",0,2,3,21.401667,39.8975,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0040","كاميرا وزارة POLE 12 (PTZ) - BLUE 2",0,2,3,21.401111,39.898528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0041","كاميرا وزارة POLE 13 (PTZ) - BLUE 2",0,2,3,21.421167,39.879306,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0042","كاميرا وزارة POLE 14 - BLUE 2",0,2,3,21.412833,39.886889,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0043","كاميرا وزارة POLE 15 - BLUE 2",0,2,3,21.403028,39.896583,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0044","كاميرا وزارة POLE 25  [2 cams] (PTZ) - BLUE 2",0,2,3,21.413139,39.892,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0045","كاميرا وزارة A15 - BLUE 3",0,2,3,21.416889,39.882917,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0046","كاميرا وزارة A22 (PTZ) - BLUE 3",0,2,3,21.418861,39.880111,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0047","كاميرا وزارة A25 - BLUE 3",0,2,3,21.416917,39.878694,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0048","كاميرا وزارة B117 - BLUE 3",0,2,3,21.409583,39.887806,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0049","كاميرا وزارة B45 - BLUE 3",0,2,3,21.408361,39.890361,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0050","كاميرا وزارة C176 - BLUE 3",0,2,3,21.405167,39.902222,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0051","كاميرا وزارة POLE 16 - BLUE 3",0,2,3,21.402917,39.898056,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0052","كاميرا وزارة POLE 17 (PTZ) - BLUE 3",0,2,3,21.408028,39.891583,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0053","كاميرا وزارة POLE 18 - BLUE 3",0,2,3,21.4115,39.891528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0054","كاميرا وزارة B04 - Section 2 - UNIFI",0,2,3,21.39575,39.905306,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0055","كاميرا وزارة B100 - Section 2 - UNIFI",0,2,3,21.413056,39.886583,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0056","كاميرا وزارة C186 - Section 2 - UNIFI",0,2,3,21.407972,39.891556,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0057","كاميرا وزارة C189 - Section 2 - UNIFI",0,2,3,21.408528,39.897528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0058","كاميرا وزارة POLE 20  [2 cams] - Section 2 - UNIFI",0,2,3,21.420778,39.8775,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0059","كاميرا وزارة POLE 22 (PTZ) - Section 2 - UNIFI",0,2,3,21.405944,39.891611,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0060","كاميرا وزارة POLE 25 - Section 2 - UNIFI",0,2,3,21.412333,39.885222,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0061","كاميرا وزارة B99 - Section 2 - CAMBIUM",0,2,3,21.4145,39.889389,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0062","كاميرا وزارة C182 - Section 2 - CAMBIUM",0,2,3,21.410611,39.892833,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-CAM-0063","كاميرا وزارة POLE 19 - Section 2 - CAMBIUM",0,2,3,21.420167,39.878694,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0001","منى - ممر Path-SH56-24",0,1,0,21.408017,39.891559,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0002","منى - ممر Path-Shaded-5R",0,1,0,21.407516,39.891311,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0003","منى - ممر Path-SH206-1",0,1,0,21.415386,39.888208,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0004","منى - ممر Path-Shaded-4L",0,1,0,21.408507,39.889391,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0005","منى - ممر Path-SH62-7",0,1,0,21.416467,39.883237,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0006","منى - ممر Path-SH204-19",0,1,0,21.41218,39.890631,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0007","منى - ممر Path-Shaded-1R",0,1,0,21.415375,39.881236,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0008","منى - ممر Path-SH206-12",0,1,0,21.412758,39.892584,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0009","منى - ممر Path-SH62-1",0,1,0,21.418186,39.878693,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0010","منى - ممر Path-Shaded-5L",0,1,0,21.407406,39.8912,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0011","منى - ممر Path-Shaded-3R",0,1,0,21.411078,39.886464,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0012","منى - ممر Path-SH206-7",0,1,0,21.414109,39.890061,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0013","منى - ممر Path-SH62-29",0,1,0,21.405558,39.895733,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0014","منى - ممر Path-SH56-6",0,1,0,21.41632,39.880502,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0015","منى - ممر Path-Tunnel-Al_Shuaibin",0,1,0,21.420073,39.885616,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0016","منى - ممر Path-Shaded-7R",0,1,0,21.403999,39.89566,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0017","منى - ممر Path-SH204-6",0,1,0,21.417351,39.883352,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0018","منى - ممر Path-SH62-21",0,1,0,21.411258,39.888331,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0019","منى - ممر Path-SH406-1R",0,1,0,21.410377,39.893769,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0020","منى - ممر Path-Shaded-6L",0,1,0,21.405566,39.893483,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0021","منى - ممر Path-SH406-7R",0,1,0,21.408438,39.89745,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0022","منى - ممر Path-SH56-10",0,1,0,21.413479,39.884367,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0023","منى - ممر Path-Shaded-2L",0,1,0,21.413121,39.883792,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0024","منى - ممر Path-SH204-11",0,1,0,21.414569,39.887352,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0025","منى - ممر Path-SH56-19",0,1,0,21.411252,39.887037,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0026","منى - ممر Path-SH56-1",0,1,0,21.417374,39.878489,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0027","منى - ممر Path-SH204-15",0,1,0,21.41348,39.888828,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0028","منى - ممر Path-SH56-22",0,1,0,21.409229,39.889538,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0029","منى - ممر Path-SH204-1",0,1,0,21.418499,39.879896,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0030","منى - ممر Path-SH406-7L",0,1,0,21.408272,39.897356,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0031","منى - ممر Path-Shaded-3L",0,1,0,21.410968,39.886334,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0032","منى - ممر Path-Shaded-4R",0,1,0,21.408621,39.889508,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0033","منى - ممر Path-SH56-8",0,1,0,21.414952,39.882444,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0034","منى - ممر Path-SH62-16",0,1,0,21.413287,39.886391,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0035","منى - ممر Path-SH62-22",0,1,0,21.40829,39.892147,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0036","منى - ممر Path-SH62-11",0,1,0,21.414645,39.884994,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0037","منى - ممر Path-Shaded-1L",0,1,0,21.415218,39.881132,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0038","منى - ممر Path-Shaded-7L",0,1,0,21.403836,39.895546,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0039","منى - ممر Path-SH56-31",0,1,0,21.404338,39.895865,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0040","منى - ممر Path-Shaded-6R",0,1,0,21.405676,39.893639,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0041","منى - ممر Path-SH62-25",0,1,0,21.407203,39.893937,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0042","منى - ممر Path-Shaded-2R",0,1,0,21.413209,39.883897,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0043","منى - ممر Path-SH406-1L",0,1,0,21.410233,39.893693,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0044","منى - ممر Path-SH62-5",0,1,0,21.41743,39.881544,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0045","منى - ممر RDR-002",0,1,2,21.424979,39.871973,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0046","منى - ممر RDR-003",0,1,2,21.420721,39.892507,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0047","منى - ممر RDR-005",0,1,2,21.412969,39.883558,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0048","منى - ممر RDR-008",0,1,2,21.409827,39.885449,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0049","منى - ممر RDR-009",0,1,2,21.419227,39.87312,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0050","منى - ممر RDR-010",0,1,2,21.421661,39.900242,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0051","منى - ممر RDR-011",0,1,2,21.415932,39.894241,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0052","منى - ممر RDR-012",0,1,2,21.399093,39.903143,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0053","منى - ممر RDR-013",0,1,2,21.406498,39.902269,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0054","منى - ممر RDR-015",0,1,2,21.417627,39.900408,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0055","منى - ممر RDR-016",0,1,2,21.407916,39.890055,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0056","منى - ممر RDR-017",0,1,2,21.411454,39.907968,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0057","منى - ممر RDR-018",0,1,2,21.424598,39.899883,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0058","منى - ممر RDR-021",0,1,2,21.410919,39.898681,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0059","منى - ممر RDR-022",0,1,2,21.424821,39.894806,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0060","منى - ممر RDR-023",0,1,2,21.412823,39.897415,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0061","منى - ممر RDR-027",0,1,2,21.407464,39.899546,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0062","منى - ممر RDR-033",0,1,2,21.407338,39.889622,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0063","منى - ممر RDR-035",0,1,2,21.408206,39.904493,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0064","منى - ممر RDR-036",0,1,2,21.419646,39.895435,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0065","منى - ممر RDR-038",0,1,2,21.422007,39.900271,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0066","منى - ممر RDR-040",0,1,2,21.423323,39.875789,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0067","منى - ممر RDR-044",0,1,2,21.42183,39.900249,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0068","منى - ممر RDR-047",0,1,2,21.41767,39.896629,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0069","منى - ممر RDR-052",0,1,2,21.420343,39.885702,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0070","منى - ممر RDR-055",0,1,2,21.414667,39.899479,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0071","منى - ممر RDR-056",0,1,2,21.419522,39.900212,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0072","منى - ممر RDR-058",0,1,2,21.402591,39.898149,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0073","منى - ممر RDR-059",0,1,2,21.403215,39.894598,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0074","منى - ممر RDR-061",0,1,2,21.406498,39.900611,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0075","منى - ممر RDR-063",0,1,2,21.41688,39.875971,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0076","منى - ممر RDR-064",0,1,2,21.413227,39.879691,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0077","منى - ممر RDR-067",0,1,2,21.410214,39.903259,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0078","منى - ممر RDR-068",0,1,2,21.409489,39.887953,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0079","منى - ممر RDR-071",0,1,2,21.402864,39.896166,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0080","منى - ممر RDR-074",0,1,2,21.396916,39.902181,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0081","منى - ممر RDR-075",0,1,2,21.421455,39.895638,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0082","منى - ممر RDR-076",0,1,2,21.395505,39.901794,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0083","منى - ممر RDR-077",0,1,2,21.398092,39.900676,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0084","منى - ممر RDR-080",0,1,2,21.421844,39.89759,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0085","منى - ممر RDR-082",0,1,2,21.406321,39.892369,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0086","منى - ممر RDR-083",0,1,2,21.423298,39.87263,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0087","منى - ممر RDR-085",0,1,2,21.410487,39.905772,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0088","منى - ممر RDR-086",0,1,2,21.411443,39.885588,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0089","منى - ممر RDR-089",0,1,2,21.417927,39.881678,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0090","منى - ممر RDR-090",0,1,2,21.415398,39.898558,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0091","منى - ممر RDR-091",0,1,2,21.410001,39.889616,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0092","منى - ممر RDR-092",0,1,2,21.414505,39.896114,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0093","منى - ممر RDR-093",0,1,2,21.424278,39.87439,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0094","منى - ممر RDR-094",0,1,2,21.395627,39.904049,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0095","منى - ممر RDR-095",0,1,2,21.422355,39.895095,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0096","منى - ممر RDR-096",0,1,2,21.422584,39.874812,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0097","منى - ممر RDR-097",0,1,2,21.424435,39.90095,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0098","منى - ممر RDR-098",0,1,2,21.41805,39.898773,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0099","منى - ممر RDR-099",0,1,2,21.411057,39.89393,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0100","منى - ممر RDR-100",0,1,2,21.422191,39.90063,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0101","منى - ممر RDR-101",0,1,2,21.412683,39.888143,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0102","منى - ممر RDR-102",0,1,2,21.410311,39.891468,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0103","منى - ممر RDR-103",0,1,2,21.416946,39.886039,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0104","منى - ممر RDR-104",0,1,2,21.418368,39.887068,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0105","منى - ممر RDR-105",0,1,2,21.416168,39.877541,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0106","منى - ممر RDR-106",0,1,2,21.418248,39.874372,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0107","منى - ممر RDR-107",0,1,2,21.417186,39.876095,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0108","منى - ممر RDR-108",0,1,2,21.414794,39.879546,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0109","منى - ممر RDR-109",0,1,2,21.400431,39.897958,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0110","منى - ممر RDR-110",0,1,2,21.406814,39.893528,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0111","منى - ممر RDR-111",0,1,2,21.404235,39.898069,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0112","منى - ممر RDR-112",0,1,2,21.407169,39.896844,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0113","منى - ممر RDR-113",0,1,2,21.409317,39.892793,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0114","منى - ممر RDR-114",0,1,2,21.401981,39.896045,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0115","منى - ممر RDR-115",0,1,2,21.400769,39.89833,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0116","منى - ممر RDR-116",0,1,2,21.398617,39.900645,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0117","منى - ممر RDR-117",0,1,2,21.414767,39.877157,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0118","منى - ممر RDR-118",0,1,2,21.418699,39.886888,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0119","منى - ممر RDR-119",0,1,2,21.423656,39.875734,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0120","منى - ممر RDR-120",0,1,2,21.421254,39.898743,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0121","منى - ممر RDR-121",0,1,2,21.424104,39.897371,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0122","منى - ممر RDR-122",0,1,2,21.406037,39.900391,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0123","منى - ممر RDR-123",0,1,2,21.400839,39.898404,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0124","منى - ممر RDR-124",0,1,2,21.393706,39.90416,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0125","منى - ممر RDR-125",0,1,2,21.407768,39.898459,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0126","منى - ممر RDR-126",0,1,2,21.402027,39.899302,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0127","منى - ممر RDR-127",0,1,2,21.419184,39.879157,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0128","منى - ممر RDR-128",0,1,2,21.419379,39.879204,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0129","منى - ممر RDR-129",0,1,2,21.420385,39.893028,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0130","منى - ممر RDR-130",0,1,2,21.420525,39.892968,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0131","منى - ممر RDR-131",0,1,2,21.413553,39.900492,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0132","منى - ممر RDR-132",0,1,2,21.411586,39.903504,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0133","منى - ممر RDR-133",0,1,2,21.420787,39.897243,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0134","منى - ممر RDR-134",0,1,2,21.421113,39.900934,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0135","منى - ممر RDR-135",0,1,2,21.417282,39.901825,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0136","منى - ممر RDR-136",0,1,2,21.414254,39.894063,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0137","منى - ممر RDR-137",0,1,2,21.413869,39.901155,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0138","منى - ممر RDR-138",0,1,2,21.416629,39.891712,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0139","منى - ممر RDR-139",0,1,2,21.420402,39.893988,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0140","منى - ممر RDR-140",0,1,2,21.416761,39.895387,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0141","منى - ممر RDR-141",0,1,2,21.423578,39.893527,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0142","منى - ممر RDR-142",0,1,2,21.42106,39.893839,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0143","منى - ممر RDR-143",0,1,2,21.415782,39.891646,"","","","منطقة منى","لم يبدأ",""],["NSK-MIN-RDR-0144","منى - ممر RDR-144",0,1,2,21.415471,39.890602,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0001","قطار المشاعر - محطة عرفات ١ - بوابة يمين 1",4,5,2,21.335898,39.976339,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0002","قطار المشاعر - محطة عرفات ١ - بوابة يمين 2",4,5,2,21.336167,39.975953,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0003","قطار المشاعر - محطة عرفات ١ - بوابة يمين 3",4,5,2,21.336437,39.975567,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0004","قطار المشاعر - محطة عرفات ١ - بوابة يمين 4",4,5,2,21.336706,39.975181,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0005","قطار المشاعر - محطة عرفات ١ - بوابة يمين 5",4,5,2,21.336975,39.974795,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0006","قطار المشاعر - محطة عرفات ١ - بوابة يمين 6",4,5,2,21.337244,39.974409,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0007","قطار المشاعر - محطة عرفات ١ - بوابة يسار 1",4,5,2,21.336157,39.976547,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0008","قطار المشاعر - محطة عرفات ١ - بوابة يسار 2",4,5,2,21.336427,39.976161,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0009","قطار المشاعر - محطة عرفات ١ - بوابة يسار 3",4,5,2,21.336696,39.975775,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0010","قطار المشاعر - محطة عرفات ١ - بوابة يسار 4",4,5,2,21.336965,39.975389,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0011","قطار المشاعر - محطة عرفات ١ - بوابة يسار 5",4,5,2,21.337233,39.975003,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0012","قطار المشاعر - محطة عرفات ١ - بوابة يسار 6",4,5,2,21.337502,39.974616,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0013","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 1",4,5,2,21.340097,39.970418,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0014","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 2",4,5,2,21.340347,39.970017,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0015","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 3",4,5,2,21.340597,39.969617,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0016","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 4",4,5,2,21.340847,39.969216,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0017","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 5",4,5,2,21.341097,39.968815,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0018","قطار المشاعر - محطة عرفات ٢ - بوابة يمين 6",4,5,2,21.341347,39.968414,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0019","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 1",4,5,2,21.340366,39.970611,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0020","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 2",4,5,2,21.340616,39.97021,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0021","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 3",4,5,2,21.340866,39.96981,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0022","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 4",4,5,2,21.341116,39.969409,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0023","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 5",4,5,2,21.341365,39.969008,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0024","قطار المشاعر - محطة عرفات ٢ - بوابة يسار 6",4,5,2,21.341615,39.968607,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0025","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 1",4,5,2,21.345222,39.962009,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0026","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 2",4,5,2,21.345504,39.961634,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0027","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 3",4,5,2,21.345786,39.961258,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0028","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 4",4,5,2,21.346068,39.960883,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0029","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 5",4,5,2,21.34635,39.960508,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0030","قطار المشاعر - محطة عرفات ٣ - بوابة يمين 6",4,5,2,21.346632,39.960133,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0031","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 1",4,5,2,21.345473,39.962227,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0032","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 2",4,5,2,21.345755,39.961852,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0033","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 3",4,5,2,21.346038,39.961476,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0034","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 4",4,5,2,21.34632,39.961101,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0035","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 5",4,5,2,21.346602,39.960726,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0036","قطار المشاعر - محطة عرفات ٣ - بوابة يسار 6",4,5,2,21.346884,39.96035,"","","","منطقة عرفات","لم يبدأ",""],["NSK-TRN-STN-0037","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 1",4,5,2,21.377873,39.919007,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0038","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 2",4,5,2,21.378069,39.918573,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0039","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 3",4,5,2,21.378266,39.91814,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0040","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 4",4,5,2,21.378463,39.917706,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0041","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 5",4,5,2,21.378659,39.917272,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0042","قطار المشاعر - محطة مزدلفة ١ - بوابة يمين 6",4,5,2,21.378856,39.916839,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0043","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 1",4,5,2,21.378163,39.919159,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0044","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 2",4,5,2,21.37836,39.918725,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0045","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 3",4,5,2,21.378557,39.918292,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0046","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 4",4,5,2,21.378753,39.917858,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0047","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 5",4,5,2,21.37895,39.917424,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0048","قطار المشاعر - محطة مزدلفة ١ - بوابة يسار 6",4,5,2,21.379147,39.916991,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0049","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 1",4,5,2,21.382499,39.907725,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0050","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 2",4,5,2,21.382842,39.907413,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0051","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 3",4,5,2,21.383185,39.907102,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0052","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 4",4,5,2,21.383528,39.90679,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0053","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 5",4,5,2,21.383871,39.906478,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0054","قطار المشاعر - محطة مزدلفة ٢ - بوابة يمين 6",4,5,2,21.384214,39.906167,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0055","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 1",4,5,2,21.382708,39.90799,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0056","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 2",4,5,2,21.383051,39.907678,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0057","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 3",4,5,2,21.383394,39.907367,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0058","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 4",4,5,2,21.383737,39.907055,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0059","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 5",4,5,2,21.38408,39.906744,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0060","قطار المشاعر - محطة مزدلفة ٢ - بوابة يسار 6",4,5,2,21.384423,39.906432,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0061","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 1",4,5,2,21.389665,39.900561,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0062","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 2",4,5,2,21.390099,39.900437,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0063","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 3",4,5,2,21.390533,39.900312,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0064","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 4",4,5,2,21.390967,39.900188,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0065","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 5",4,5,2,21.391401,39.900063,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0066","قطار المشاعر - محطة مزدلفة ٣ - بوابة يمين 6",4,5,2,21.391835,39.899938,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0067","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 1",4,5,2,21.389748,39.900897,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0068","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 2",4,5,2,21.390182,39.900772,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0069","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 3",4,5,2,21.390616,39.900648,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0070","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 4",4,5,2,21.39105,39.900523,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0071","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 5",4,5,2,21.391484,39.900398,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0072","قطار المشاعر - محطة مزدلفة ٣ - بوابة يسار 6",4,5,2,21.391918,39.900274,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0073","قطار المشاعر - محطة منى ١ - بوابة يمين 1",4,5,2,21.398624,39.898727,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0074","قطار المشاعر - محطة منى ١ - بوابة يمين 2",4,5,2,21.398916,39.89836,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0075","قطار المشاعر - محطة منى ١ - بوابة يمين 3",4,5,2,21.399208,39.897993,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0076","قطار المشاعر - محطة منى ١ - بوابة يمين 4",4,5,2,21.399499,39.897627,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0077","قطار المشاعر - محطة منى ١ - بوابة يمين 5",4,5,2,21.399791,39.89726,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0078","قطار المشاعر - محطة منى ١ - بوابة يمين 6",4,5,2,21.400083,39.896893,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0079","قطار المشاعر - محطة منى ١ - بوابة يسار 1",4,5,2,21.39887,39.898953,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0080","قطار المشاعر - محطة منى ١ - بوابة يسار 2",4,5,2,21.399162,39.898586,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0081","قطار المشاعر - محطة منى ١ - بوابة يسار 3",4,5,2,21.399454,39.898219,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0082","قطار المشاعر - محطة منى ١ - بوابة يسار 4",4,5,2,21.399745,39.897852,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0083","قطار المشاعر - محطة منى ١ - بوابة يسار 5",4,5,2,21.400037,39.897486,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0084","قطار المشاعر - محطة منى ١ - بوابة يسار 6",4,5,2,21.400329,39.897119,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0085","قطار المشاعر - محطة منى ٢ - بوابة يمين 1",4,5,2,21.403744,39.892449,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0086","قطار المشاعر - محطة منى ٢ - بوابة يمين 2",4,5,2,21.404006,39.892056,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0087","قطار المشاعر - محطة منى ٢ - بوابة يمين 3",4,5,2,21.404267,39.891664,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0088","قطار المشاعر - محطة منى ٢ - بوابة يمين 4",4,5,2,21.404529,39.891272,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0089","قطار المشاعر - محطة منى ٢ - بوابة يمين 5",4,5,2,21.40479,39.89088,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0090","قطار المشاعر - محطة منى ٢ - بوابة يمين 6",4,5,2,21.405052,39.890488,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0091","قطار المشاعر - محطة منى ٢ - بوابة يسار 1",4,5,2,21.404007,39.892651,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0092","قطار المشاعر - محطة منى ٢ - بوابة يسار 2",4,5,2,21.404269,39.892259,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0093","قطار المشاعر - محطة منى ٢ - بوابة يسار 3",4,5,2,21.40453,39.891866,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0094","قطار المشاعر - محطة منى ٢ - بوابة يسار 4",4,5,2,21.404792,39.891474,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0095","قطار المشاعر - محطة منى ٢ - بوابة يسار 5",4,5,2,21.405053,39.891082,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0096","قطار المشاعر - محطة منى ٢ - بوابة يسار 6",4,5,2,21.405315,39.89069,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0097","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 1",4,5,2,21.417533,39.871775,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0098","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 2",4,5,2,21.417795,39.871383,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0099","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 3",4,5,2,21.418056,39.87099,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0100","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 4",4,5,2,21.418318,39.870598,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0101","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 5",4,5,2,21.41858,39.870206,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0102","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يمين 6",4,5,2,21.418841,39.869814,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0103","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 1",4,5,2,21.417796,39.871977,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0104","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 2",4,5,2,21.418058,39.871585,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0105","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 3",4,5,2,21.418319,39.871193,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0106","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 4",4,5,2,21.418581,39.870801,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0107","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 5",4,5,2,21.418842,39.870408,"","","","منطقة منى","لم يبدأ",""],["NSK-TRN-STN-0108","قطار المشاعر - محطة منى ٣ — الجمرات - بوابة يسار 6",4,5,2,21.419104,39.870016,"","","","منطقة منى","لم يبدأ",""],["NSK-NMR-GTE-0001","مسجد نمرة - مدخل رئيسي 1",5,6,2,21.352967,39.967775,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0002","مسجد نمرة - مدخل رئيسي 2",5,6,2,21.353759,39.967498,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0003","مسجد نمرة - مدخل رئيسي 3",5,6,2,21.354248,39.966775,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0004","مسجد نمرة - مدخل رئيسي 4",5,6,2,21.354248,39.965881,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0005","مسجد نمرة - مدخل رئيسي 5",5,6,2,21.353759,39.965157,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0006","مسجد نمرة - مدخل رئيسي 6",5,6,2,21.352967,39.964881,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0007","مسجد نمرة - مدخل رئيسي 7",5,6,2,21.352175,39.965157,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0008","مسجد نمرة - مدخل رئيسي 8",5,6,2,21.351685,39.965881,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0009","مسجد نمرة - مدخل رئيسي 9",5,6,2,21.351685,39.966775,"","","","منطقة عرفات","لم يبدأ",""],["NSK-NMR-GTE-0010","مسجد نمرة - مدخل رئيسي 10",5,6,2,21.352175,39.967498,"","","","منطقة عرفات","لم يبدأ",""],["NSK-JMR-PNT-0001","منشأة الجمرات - الدور الأرضي - مدخل يسار",2,3,0,21.419659,39.874529,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0002","منشأة الجمرات - الدور الأرضي - مدخل يمين",2,3,0,21.419997,39.875053,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0003","منشأة الجمرات - الدور الأرضي - مدخل وسط",2,3,0,21.41984,39.874772,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0004","منشأة الجمرات - الدور الأول - مدخل يسار",2,3,0,21.419735,39.874522,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0005","منشأة الجمرات - الدور الأول - مدخل وسط",2,3,0,21.419907,39.874716,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0006","منشأة الجمرات - الدور الأول - مدخل يمين",2,3,0,21.420069,39.874932,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0007","منشأة الجمرات - الدور الثالث - مدخل يسار",2,3,0,21.421532,39.876253,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0008","منشأة الجمرات - الدور الثالث - مدخل يمين",2,3,0,21.421621,39.876043,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0009","منشأة الجمرات - الدور الرابع - مدخل يسار",2,3,0,21.41954,39.871111,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0010","منشأة الجمرات - الدور الرابع - مدخل يمين",2,3,0,21.419367,39.871007,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0011","منشأة الجمرات - الدور الثاني - مدخل يسار",2,3,4,21.420237,39.874332,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0012","منشأة الجمرات - الدور الثاني - مدخل وسط",2,3,4,21.420398,39.874723,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0013","منشأة الجمرات - الدور الثاني - مدخل يمين",2,3,4,21.420222,39.875129,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0014","منشأة الجمرات - الدور الأرضي - مخرج يسار",2,3,4,21.421250,39.870540,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0015","منشأة الجمرات - الدور الأرضي - مخرج وسط",2,3,4,21.421212,39.870514,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0016","منشأة الجمرات - الدور الأرضي - مخرج يمين",2,3,4,21.421175,39.870487,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0017","منشأة الجمرات - الدور الأول - مخرج يسار",2,3,4,21.421810,39.870568,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0018","منشأة الجمرات - الدور الأول - مخرج وسط",2,3,4,21.421792,39.870525,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0019","منشأة الجمرات - الدور الأول - مخرج يمين",2,3,4,21.421775,39.870481,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0020","منشأة الجمرات - الدور الثاني - مخرج يسار",2,3,4,21.419898,39.872477,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0021","منشأة الجمرات - الدور الثاني - مخرج وسط",2,3,4,21.419857,39.872457,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0022","منشأة الجمرات - الدور الثاني - مخرج يمين",2,3,4,21.419818,39.872438,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0023","منشأة الجمرات - الدور الثالث - مخرج يسار",2,3,4,21.422997,39.869773,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0024","منشأة الجمرات - الدور الثالث - مخرج وسط",2,3,4,21.422959,39.869752,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0025","منشأة الجمرات - الدور الثالث - مخرج يمين",2,3,4,21.422921,39.869730,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0026","منشأة الجمرات - الدور الرابع - مخرج يسار",2,3,4,21.421573,39.868700,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0027","منشأة الجمرات - الدور الرابع - مخرج وسط",2,3,4,21.421542,39.868666,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-PNT-0028","منشأة الجمرات - الدور الرابع - مخرج يمين",2,3,4,21.421511,39.868631,"","","","منطقة منى","لم يبدأ",""],["NSK-JMR-CAM-0001","كاميرا وزارة CAM 36 — منشأة الجمرات الدور الأرضي (PTZ) - JAMARAT",2,2,3,21.422229,39.870779,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0002","كاميرا وزارة CAM 38 — منشأة الجمرات الدور الأول (PTZ) - JAMARAT",2,2,3,21.422457,39.870359,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0003","كاميرا وزارة CAM 37 — منشأة الجمرات الدور الثاني - JAMARAT",2,2,3,21.422543,39.870294,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0004","كاميرا وزارة CAM 33 — منشأة الجمرات الدور الثالث - ROUCKET",2,2,3,21.422377,39.870848,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0005","كاميرا وزارة CAM 32 — منشأة الجمرات الدور الرابع - ROUCKET",2,2,3,21.422427,39.870871,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0006","كاميرا وزارة F144 — CAM 47 - JAMARAT",2,2,3,21.422778,39.876111,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0007","كاميرا وزارة F143 — CAM 48 - JAMARAT",2,2,3,21.423583,39.875417,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0008","كاميرا وزارة F131 — CAM 49 - JAMARAT",2,2,3,21.422444,39.874972,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0009","كاميرا وزارة CAM 50 — منشأة الجمرات الخلفي الدور الثالث (PTZ) - JAMARAT",2,2,3,21.422722,39.868889,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0010","كاميرا وزارة CAM 46 — منشأة الجمرات الدور الأرضي (PTZ) - JAMARAT",2,2,3,21.421513,39.872551,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0011","كاميرا وزارة CAM 42 — منشأة الجمرات الدور الأول - JAMARAT",2,2,3,21.4221,39.871245,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0012","كاميرا وزارة CAM 44 — منشأة الجمرات الدور الأول (PTZ) - JAMARAT",2,2,3,21.421742,39.872131,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0013","كاميرا وزارة CAM 45 — منشأة الجمرات الدور الأول - JAMARAT",2,2,3,21.421384,39.873017,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0014","كاميرا وزارة CAM 39 — منشأة الجمرات الدور الثاني - JAMARAT",2,2,3,21.422256,39.871002,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0015","كاميرا وزارة CAM 40 — منشأة الجمرات الدور الثاني - JAMARAT",2,2,3,21.42197,39.871711,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0016","كاميرا وزارة CAM 41 — منشأة الجمرات الدور الثاني - JAMARAT",2,2,3,21.421684,39.87242,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0017","كاميرا وزارة CAM 43 — منشأة الجمرات الدور الثاني - JAMARAT",2,2,3,21.421397,39.873128,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0018","كاميرا وزارة CAM 34 — منشأة الجمرات الدور الثالث - ROUCKET",2,2,3,21.421662,39.87262,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0019","كاميرا وزارة CAM 35 — منشأة الجمرات الدور الرابع - ROUCKET",2,2,3,21.421711,39.872643,"","","","منشأة الجمرات","لم يبدأ",""],["NSK-JMR-CAM-0020","كاميرا وزارة CAM 51 — منشأة الجمرات الخلفي الدور الثالث (PTZ) - JAMARAT",2,2,3,21.422752,39.868919,"","","","منشأة الجمرات","لم يبدأ",""]]};

/* المشعرُ يُدمج كما في النظام العامل: مسجدُ نمرة في عرفات،
   والجمراتُ ومنشآتُ التسكين في منى، وقطارُ المشاعر يُنسب باسم محطته. */
function zoneOf(z, name){
  if (z === 'عرفات' || z === 'مسجد نمرة') return 'عرفات';
  if (z === 'منى' || z === 'الجمرات' || z === 'منشآت التسكين') return 'منى';
  /* مكةُ والمدينةُ صارتا في النطاق (V17.45) — ولولا هذا لعاد كلُّ ما فيهما
     «منى» صامتًا: تُحسَب في مشعرٍ ليس مشعرَها وتُرشَّح معه (V17.46). */
  if (z === 'مكة' || z === 'مكة المكرمة') return 'مكة';
  if (z === 'المدينة' || z === 'المدينة المنورة') return 'المدينة';
  if (z === 'مزدلفة') return 'مزدلفة';
  if (String(name).indexOf('عرفات') >= 0) return 'عرفات';
  if (String(name).indexOf('مزدلفة') >= 0) return 'مزدلفة';
  if (String(name).indexOf('مكة') >= 0) return 'مكة';
  if (String(name).indexOf('المدينة') >= 0) return 'المدينة';
  return 'منى';
}
