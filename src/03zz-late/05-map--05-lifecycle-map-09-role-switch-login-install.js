/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-09-role-switch-login-install.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-09-role-switch-login-install.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : swLater, verCheck, quotaEstimate, swClear, pwaInstall
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function swLater(){
  swCancel();
  /* «لاحقًا» ليست «أبدًا»: يُعاد العرضُ بعد ثلاث دقائق ما دام الجديدُ منتظرًا */
  setTimeout(function(){ if (SW_STATE.waiting && !SW_RELOADED) swApply(); }, 180000);
  toast(t('أُجّل — يُطبَّق عند الفتح القادم'));
}

/* فحصُ التحديثات: يسأل عاملَ الخدمة أن يعيد جلبَ نفسِه، ويقارن رقمَ الكاش
   في `sw.js` بالمحمَّل. فالمستخدمُ لا يُترَك يخمّن أعنده أحدثُ نسخةٍ أم لا،
   ولا يُنصَح بمسح بيانات الموقع — فذلك يمحو ما لم يُرفَع بعد. */
function verCheck(){
  toast(t('يُفحَص التحديث…'));
  var here = (String(document.title).match(/V\d+\.\d+/) || [''])[0];
  fetch('sw.js?ts=' + Date.now(), { cache:'reload' })
    .then(function(r){ return r.ok ? r.text() : ''; })
    .then(function(txt){
      var m = /nusuk-survey-v(\d+\.\d+)/.exec(txt || '');
      var there = m ? ('V' + m[1]) : '';
      var mine = (typeof APP_VER === 'string' && APP_VER) || here || '';
      if (SW_STATE.reg && SW_STATE.reg.update) { try { SW_STATE.reg.update(); } catch (e){ LS_ERR = e; } }
      if (there && mine && there !== mine){
        var b = document.querySelector('.ver-tag');
        if (b) b.classList.add('upd');
        toast(t('نسخة') + ' ' + verShow(there) + ' ' + t('جاهزةٌ — أغلق التطبيق وافتحه'));
      } else if (SW_STATE.waiting){
        toast(t('نسخةٌ جديدةٌ جاهزة — أغلق التطبيق وافتحه'));
      } else {
        toast(t('أنت على أحدث نسخة'));
      }
    })
    .catch(function(){ toast(t('تعذّر الفحص — لا شبكة')); });
}

function quotaEstimate(){
  var users = cfgGet('users') || 150;
  var perDay = { survey:20, install:8, syncs:8 };
  var writes = users * (perDay.survey * 3 + perDay.install * 5 + 6 /* أحداثٌ وطوابع */);
  /* القراءةُ تُحسب من مسار الشيفرة لا من التمنّي: سحبٌ كاملٌ أوّلَ اليوم
     مقصورٌ على ما يخصُّ المستخدم، ثم فوارقُ ما تغيّر في بقية المزامنات. */
  var docs   = Object.keys(STATE.recs).length + Object.keys(STATE.inss).length
             + Object.keys(STATE.tasks).length;
  var firstPull = Math.max(60, Math.round(docs / Math.max(1, users)));  /* حصةُ الفرد */
  var delta     = Math.round(users * 0.6);        /* ما يكتبه الآخرون في الفترة */
  var reads  = users * (firstPull + (perDay.syncs - 1) * delta);
  var photos = users * (perDay.survey * 2 + perDay.install * 2);
  return {
    users:users, writes:writes, reads:reads, photos:photos,
    writeCap:20000, readCap:50000,
    writeOver: writes > 20000, readOver: reads > 50000,
    storeDay: Math.round(photos * 180 / 1024)   /* ميجا يوميًّا */
  };
}

function swClear(){
  if (SW_STATE.reg && SW_STATE.reg.active) SW_STATE.reg.active.postMessage('clear');
  if (typeof caches !== 'undefined') caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); });
  toast(t('أُفرغ الكاش'));
}

function pwaInstall(){
  if (pwaStandalone()){ toast(t('التطبيقُ مثبَّتٌ سلفًا — أنت تعمل عليه الآن')); return; }
  if (INSTALL_EVT){ INSTALL_EVT.prompt(); INSTALL_EVT = null; return; }
  /* آيفونُ لا يُرسِل حدثَ التثبيت أبدًا — والتثبيتُ فيه متاحٌ بخطوتين.
     فقولُ «غير متاح» كذبٌ يمنع نصفَ الميدان من تثبيت التطبيق. */
  if (pwaIOS()){ POP_HELP = 'ios'; render(1); return; }
  if (pwaAndroid()){ lsSet('nsk14.iosNudge', '0'); render(1); return; }   /* خطواتُ أندرويد (V19.8) */
  toast(t('افتح قائمة المتصفّح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'));
}
