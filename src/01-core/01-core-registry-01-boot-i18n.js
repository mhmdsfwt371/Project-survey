/* ============================================================================
   FILE    : src/01-core/01-core-registry-01-boot-i18n.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : Boot guard (crash-loop breaker), language engine (Arabic/English/Urdu), number and date formatting per language, barcode scan of serials, screen wake-lock during forms, and the shared dictionary tail.
   DEFINES : bootStage, bootOk, i18nLoad, i18nThen, i18nFlush, i18nReady, noTashkeel, t, locOf, fmtDate, fmtTime, fmtDT, fmtDT2, nm … (+22 more)
   GLOBALS : BOOT_GUARD, I18N, D, I18N_FILE, LANG, TASHKEEL_RE, NM_CACHE, SCAN, WAKE, SUN_ON
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* (V38.55) swallowed errors are counted and recorded, not just the last one kept. 228 «catch (e){ LS_ERR = e; }» sites
   keep the field running; LS_ERR is now an accessor on the global object, so each assignment also feeds the soft-error
   log (per place, rate-limited) and the black box — shown in «Sync and conflicts» and attached to bug reports.
   It must stay the first statement of the core: a `var LS_ERR` anywhere would be hoisted and make it a plain field. */
(function(){
  var G = (typeof globalThis !== 'undefined') ? globalThis : this;
  try { Object.defineProperty(G, 'LS_ERR', { configurable:true, get:function(){ return lsErrNote.last || null; }, set:function(v){ lsErrNote.last = v; if (v) lsErrNote(v); } }); }
  catch (e){ G.LS_ERR = null; }
})();
function lsErrWhere(e){
  var st = String((e && e.stack) || ''), m = /\n\s*at (?:new )?([A-Za-z_$][\w$.]*) /.exec(st) || /^([A-Za-z_$][\w$]*)@/m.exec(st);
  return m ? m[1].replace(/^Object\./, '') : 'catch';
}
function lsErrNote(e){
  if (lsErrNote.busy) return; lsErrNote.busy = true;
  try {
    var N = lsErrNote.n || (lsErrNote.n = { total:0, by:{}, since:Date.now() }), w = lsErrWhere(e);
    N.total++; N.by[w] = (N.by[w] || 0) + 1;
    var lastAt = (lsErrNote.at || (lsErrNote.at = {}))[w] || 0;
    if (Date.now() - lastAt > 60000 && typeof softErr === 'function' && typeof SOFT_ERRS !== 'undefined' && SOFT_ERRS){ lsErrNote.at[w] = Date.now(); softErr('مبتلَع: ' + w, e); }
  } catch (e2){ /* never let the recorder throw */ }
  lsErrNote.busy = false;
}

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
/* (V38.39) core + chunks: index.html carries the core (01–03z, 05, 08); the office, ministry and reports domains
   arrive in app-office.js (deferred, precached by the service worker for offline). Nothing in the core needs them at
   boot (verified by scripts/split-shared.mjs); screens and clicks that need them wait for nskChunkReady(). */
function nskChunkState(){ return nskChunkReady.s || (nskChunkReady.s = { ready:false, replay:null, at:0 }); }
function nskChunkReady(){
  var st = nskChunkState(); st.ready = true; st.at = Date.now();
  var el = st.replay; st.replay = null;
  /* re-render only when someone is looking at the loading card — a page the core already drew is left alone */
  try { if (st.waiting && typeof render === 'function'){ st.waiting = ''; render(1); } } catch (e){ LS_ERR = e; }
  if (el && el.isConnected){ try { el.click(); } catch (e2){ LS_ERR = e2; } }
  /* (V38.51) the what's-new sheet waits for the release-notes log that ships in the chunk */
  try { if (typeof whatsNewMaybe === 'function' && whatsNewMaybe.pending){ whatsNewMaybe.pending = false; if (whatsNewMaybe() && typeof render === 'function') render(1); } } catch (e3){ LS_ERR = e3; }
}
var I18N_FILE = 'i18n/dict-2448b95fb7.js', I18N_STATE = 0, I18N_WAIT = [];   /* الحالة: ٠ لم يُطلَب · ١ يُحمَّل · ٢ جاهز · ٣ تعذّر */
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

