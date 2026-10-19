/* ============================================================================
   FILE    : src/01-core/01-core-registry-04-engine-storage.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : Local-first storage engine: IndexedDB/localStorage persistence, resilience when the local store fails, and the save banner when data is at risk.
   DEFINES : idbWhyText, idbAtRisk, idbBannerUpdate, idbWatchStart, idbTellBad, idbAdopt, idbDrop, idbRetryNow, idbRetryLater, idbStart, idbOpen, idbUnsynced, idbGet, idbSet
   GLOBALS : FB_CFG, IDB_NAME, IDB_LOG_ERR, IDB_WHY, IDB_WATCH_T, STATE, QUEUE_CAP
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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

