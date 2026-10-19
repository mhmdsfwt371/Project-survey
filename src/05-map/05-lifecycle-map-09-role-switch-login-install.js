/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-09-role-switch-login-install.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Role switching, logout, add-to-home-screen prompts (incl. iPhone) and the login page.
   DEFINES : roleWatch, verChase, swLater, swPoll, verCheck, quotaEstimate, swClear, signOut, pwaWatch, pwaStandalone, pwaIOS, pwaAndroid, pwaInstall, iosNudgeDue … (+8 more)
   GLOBALS : VIS_LAST, LEGEND_ON, VER_CHASE, INSTALL_EVT, POP_HELP, LOGO, MANIFEST, LOGIN_CSS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الدورُ يتبدّل تحت اليد ═══
   الشاشةُ تُبنى من ROLE، والنطاقُ والإنصاتُ منه، والقاعدةُ تحكم بوثيقة الحساب.
   فإن غُيّر الدورُ من المكتب طُبِّق على الفور: الصلاحياتُ تُعاد، والشاشةُ إن
   لم تعد تُرى انتقل إلى أولى شاشاته، والإنصاتُ والسحبُ يُعادان بنطاقه الجديد. */
function roleWatch(v){
  var nr = isBossHere() ? 'admin' : (ROLES[v.role] ? v.role : 'tech');
  if (nr === ROLE) return;
  var was = (ROLES[ROLE] || {}).n || ROLE;
  ROLE = nr; STATE.meta.role = nr;
  if (v.name) STATE.meta.name = v.name;
  CORE.saveSoon();
  logEvent('تغيّر الدور — من ' + was + ' إلى ' + ((ROLES[nr] || {}).n || nr));
  toast(t('تغيّرت صلاحيتُك إلى') + ' «' + t((ROLES[nr] || {}).n || nr) + '» — ' + t('طُبِّقت الآن'));
  try { liveSmallStop(); } catch (e){ LS_ERR = e; }
  STATE.meta.pullAt = {};
  liveSmall(); presenceBeat(true); SYNC.pullAsk = true; syncCycle();
  /* شاشةٌ (أو شريحةٌ) لم تعد تُرى: نُقلَ إلى أوّلِ ما يراه دورُه الجديد */
  if (PARENT[CUR] && PARENT[CUR] !== CUR && !seesPage(CUR)) CUR = PARENT[CUR];
  if (!seesPage(CUR)) CUR = (ROLES[nr].nav || ['over']).filter(seesPage)[0] || 'acct';
  if (TABS[CUR]) PTAB[CUR] = tabCur(CUR);
  render(1); syncBadge();
}
var VIS_LAST = 0;
/* على الهاتف تبدأ مطويّةً — الشاشةُ للخريطة؛ ومن فتحها تبقى له */
var LEGEND_ON = (function(){ var v = lsGet('nsk14.legend'); if (v === '0') return false; if (v === '1') return true;
  return !(typeof window !== 'undefined' && window.innerWidth < 640); })();
var VER_CHASE = 0;
function verChase(cloud){
  STATE.appVerCloud = cloud;
  if (verNum(cloud) <= verNum(appVer())){ clearInterval(VER_CHASE); VER_CHASE = 0; return; }
  var b = document.querySelector('.ver-tag'); if (b) b.classList.add('upd');
  swPoll();
  if (!VER_CHASE) VER_CHASE = setInterval(function(){
    if (verNum(STATE.appVerCloud || '') <= verNum(appVer())){ clearInterval(VER_CHASE); VER_CHASE = 0; return; }
    swPoll();
  }, 60000);
}
function swLater(){
  swCancel();
  /* «لاحقًا» ليست «أبدًا»: يُعاد العرضُ بعد ثلاث دقائق ما دام الجديدُ منتظرًا */
  setTimeout(function(){ if (SW_STATE.waiting && !SW_RELOADED) swApply(); }, 180000);
  toast(t('أُجّل — يُطبَّق عند الفتح القادم'));
}

/* المتصفّحُ لا يسأل عن عاملٍ جديدٍ إلا نادرًا — فيُسأل كلَّ ربع ساعةٍ وعند
   العودة إلى التطبيق، فالميدانُ يفتحه ويغلقه طولَ اليوم ولا يُعيد تحميله. */
function swPoll(){
  if (!SW_STATE.reg || !SW_STATE.reg.update) return;
  try { SW_STATE.reg.update(); } catch (e){ LS_ERR = e; }
}
setInterval(swPoll, 300000);
/* الشحناتُ تُراجَع كلَّ ساعة: ما تأخّر يُنبَّه عليه مرةً في اليوم */
setInterval(function(){ try { shipWatch(); } catch (e){ LS_ERR = e; } }, 3600000);
document.addEventListener('visibilitychange', function(){
  if (!document.hidden) swPoll();
}, { passive:true });
window.addEventListener('focus', swPoll, { passive:true });
if (navigator.serviceWorker){
  /* ═══ أوّلُ تثبيتٍ ليس تحديثًا (V17.5) ═══
     عند أوّل تثبيتٍ للعامل — جهازٌ جديدٌ أو متصفّحٌ بلا ذاكرة — يقع
     controllerchange أيضًا (من لا شيءٍ إلى عامل)، فكان يُقرأ «نسخةٌ جديدةٌ
     نزلت» ويُعدُّ لإعادة تحميلٍ لا معنى لها: لا نسخةَ قديمةً معروضةً أصلًا.
     فيُميَّز: إن لم يكن ثمّةَ عاملٌ قبلَه فهو تثبيتٌ أوّل ولا تحديث. وهذا هو
     ما أسقط اختبارَ المتصفّح الحقيقيِّ ثلاثَ مرات: إعادةُ تحميلٍ في منتصفه. */
  var SW_HAD = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function(){
    if (!SW_HAD){ SW_HAD = true; return; }
    /* عاملٌ جديدٌ تولّى مكانَ قديم — الشيفرةُ المعروضةُ صارت قديمة */
    SW_STATE.waiting = true;
    swApply();
  });
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
        toast(there + ' ' + t('جاهزةٌ — أغلق التطبيق وافتحه'));
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

/* حجمُ ما خُزّن — يُعرَض في عمر البيانات */
/* ═══ الخروج ═══
   كان الزرُّ بلا معالجٍ أصلًا: يضغطه المستخدمُ فيبتلعه حارسُ الأزرار الميتة
   ويقول له نصَّه «تسجيل الخروج» — ويبقى داخلًا.

   والخروجُ لا يمسُّ ما لم يُرفَع: طابورُ المزامنة والصورُ المعلَّقةُ تبقى على
   الجهاز، ويُحذَّر منها قبل الخروج — فمن خرج وفي طابوره عملُ يومٍ ثم دخل
   بحسابٍ آخر لم يعد يجده. */
function signOut(){
  var pend = (CORE && CORE.pending) ? CORE.pending() : 0;
  var pics = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q.length : 0)
           + (typeof PHOTO_FAIL !== 'undefined' ? PHOTO_FAIL.length : 0);
  if (pend || pics){
    var msg = t('لم يُرفَع بعد') + ': '
      + (pend ? nm(pend) + ' ' + t('سجلًّا') : '')
      + (pend && pics ? ' \u00b7 ' : '')
      + (pics ? nm(pics) + ' ' + t('صورة') : '')
      + ' — ' + t('اخرج على أي حال؟');
    if (typeof confirm === 'function' && !confirm(msg)) return;
  }
  logEvent('تسجيل خروج — ' + (STATE.meta.name || ''));
  try { if (typeof liveStop === 'function') liveStop(); } catch (e){ LS_ERR = e; }
  try { if (FB && FB.auth && FB.auth.signOut) FB.auth.signOut(); } catch (e){ LS_ERR = e; }
  /* الجلسةُ وحدها تُمسَح — والبياناتُ المحليةُ تبقى لصاحبها حين يعود،
     ولا يُنصَح بمسح بيانات الموقع أبدًا. */
  try { localStorage.removeItem('nsk14.session'); } catch (e){ LS_ERR = e; }
  STATE.meta.uid = ''; STATE.meta.online = false;
  toast(t('خرجت — بياناتُك المحليةُ محفوظة'));
  /* عنصرُ الدخول يُحذَف من الهيكل عند الدخول، فلا يُعاد ببنائه بل بإعادة
     التحميل: أنظفُ وأضمن. */
  setTimeout(function(){ try { location.reload(); } catch (e){ LS_ERR = e; } }, 700);
}

/* ═══ التثبيت على الشاشة الرئيسية ═══ */
var INSTALL_EVT = null;

function pwaWatch(){
  if (typeof window === 'undefined') return;
  try { if ((pwaIOS() || pwaAndroid()) && !pwaStandalone()){ var pb = document.getElementById('pwaBtn'); if (pb) pb.hidden = false; } } catch (e){ LS_ERR = e; }   /* (V19.6، وأندرويد V19.8) */
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    INSTALL_EVT = e;
    var b = document.getElementById('pwaBtn');
    if (b) b.hidden = false;
    try { if (iosNudgeDue()) render(1); } catch (e2){ LS_ERR = e2; }   /* حثُّ أندرويد (V19.7) */
  });
  window.addEventListener('appinstalled', function(){
    INSTALL_EVT = null;
    var b = document.getElementById('pwaBtn');
    if (b) b.hidden = true;
    toast(t('ثُبِّت التطبيق'));
  });
}

function pwaStandalone(){
  try{
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        || window.navigator.standalone === true;
  }catch(e){ return false; }
}
function pwaIOS(){
  try{
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua)
        || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);   /* آيباد يقول Mac */
  }catch(e){ return false; }
}

/* (V19.8) أندرويد كآيفون: خطواتٌ ظاهرةٌ ولو لم يعرض المتصفّحُ حدثَ التثبيت (سامسونج،
   ومتصفّحُ واتساب، وكروم قبل أن يرضى عن الموقع) */
function pwaAndroid(){ try { return /Android/i.test(navigator.userAgent || ''); } catch (e){ return false; } }
function pwaInstall(){
  if (pwaStandalone()){ toast(t('التطبيقُ مثبَّتٌ سلفًا — أنت تعمل عليه الآن')); return; }
  if (INSTALL_EVT){ INSTALL_EVT.prompt(); INSTALL_EVT = null; return; }
  /* آيفونُ لا يُرسِل حدثَ التثبيت أبدًا — والتثبيتُ فيه متاحٌ بخطوتين.
     فقولُ «غير متاح» كذبٌ يمنع نصفَ الميدان من تثبيت التطبيق. */
  if (pwaIOS()){ POP_HELP = 'ios'; render(1); return; }
  if (pwaAndroid()){ lsSet('nsk14.iosNudge', '0'); render(1); return; }   /* خطواتُ أندرويد (V19.8) */
  toast(t('افتح قائمة المتصفّح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'));
}

/* ═══ حثُّ التثبيت على آيفون (V19.6) ═══
   التطبيقُ المفتوحُ من سفاري يفقد مخزنَه أسهلَ ويقطع آيفونُ اتصالَه به بعد الخلفية؛
   والمثبَّتُ على الشاشة الرئيسية يحفظ أثبت. ومن لا يعرف التقنية لا يبحث عن زرِّ
   التثبيت — فيُعرَض عليه بخطواتٍ مصوَّرةٍ بالكلمات بعد الدخول: «تم» يُخفيه شهرًا،
   و«ذكّرني غدًا» يومًا. لا يظهر على أندرويد ولا الحاسوب ولا في المثبَّت. */
/* (V19.7) وأندرويد كذلك: حين يعرض المتصفّحُ حدثَ التثبيت — ضغطةٌ واحدةٌ تثبّت */
function iosNudgeDue(){
  try { if (pwaStandalone() || !(pwaIOS() || pwaAndroid() || INSTALL_EVT)) return false; } catch (e){ return false; }
  if (typeof ROLE !== 'string' || !ROLE || (typeof KIOSK_ON !== 'undefined' && KIOSK_ON)) return false;   /* بعد الدخول فقط */
  return Date.now() > (+lsGet('nsk14.iosNudge') || 0);
}
function iosNudgeHtml(){
  if (!pwaIOS()){   /* أندرويد (V19.8): الزرُّ حين يعرضه المتصفّح، والخطواتُ دائمًا — كآيفون */
    var st2 = function(n, txt){ return '<div style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><b style="flex:0 0 32px;height:32px;border-radius:50%;background:var(--brand);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:17px">' + n + '</b><span style="font-size:16px;line-height:1.7">' + txt + '</span></div>'; };
    return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);z-index:97">'
      + '<div class="pop" style="width:min(520px,100vw);border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">'
      + '<div class="pop-head"><div><h3 style="margin:0;font-size:19px">\u{1F4F2} ' + esc(t('ثبّت التطبيق على جهازك — مرةً واحدة')) + '</h3></div>'
      + btn('\u2715', 'btn-quiet btn-sm', ' data-iosnudge="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
      + '<div class="pop-body" style="padding:14px 18px 8px">'
      + '<p class="hint" style="margin:0 0 6px;font-size:14px">' + esc(t('هكذا يحفظ الجهازُ عملَك فلا يضيع، ويفتح أسرع.')) + '</p>'
      + (INSTALL_EVT ? '<div class="actions" style="margin:6px 0 4px">' + btn('\u2B07 ' + t('ثبّت الآن'), 'btn-primary', ' data-iosnudge="install"') + '</div><p class="hint" style="margin:4px 0 0;font-size:13px">' + esc(t('أو يدويًّا:')) + '</p>' : '')
      + st2('١', esc(t('افتح التطبيقَ في متصفّح Chrome — إن فتحتَه من واتساب: اضغط ⋮ ثم «فتح في Chrome».')))
      + st2('٢', esc(t('اضغط زرَّ القائمة')) + ' <b style="font-size:20px">\u22EE</b> ' + esc(t('أعلى الشاشة.')))
      + st2('٣', esc(t('اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» ثم «تثبيت».')))
      + st2('٤', esc(t('افتح التطبيقَ من الأيقونة الجديدة دائمًا.')))
      + '<p class="hint" style="margin:6px 0 0;font-size:13px">' + esc(t('في متصفّح سامسونج: القائمة ≡ ثم «إضافة صفحة إلى» ثم «الشاشة الرئيسية».')) + '</p>'
      + '<div class="actions" style="margin-top:12px">' + btn(t('تم'), 'btn-primary', ' data-iosnudge="done"') + btn(t('ذكّرني غدًا'), 'btn-quiet', ' data-iosnudge="later"') + '</div>'
      + '</div></div></div>';
  }
  var step = function(n, txt){ return '<div style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><b style="flex:0 0 32px;height:32px;border-radius:50%;background:var(--brand);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:17px">' + n + '</b><span style="font-size:16px;line-height:1.7">' + txt + '</span></div>'; };
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);z-index:97">'
    + '<div class="pop" style="width:min(520px,100vw);border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">'
    + '<div class="pop-head"><div><h3 style="margin:0;font-size:19px">\u{1F4F2} ' + esc(t('ثبّت التطبيق على جهازك — مرةً واحدة')) + '</h3></div>'
    + btn('\u2715', 'btn-quiet btn-sm', ' data-iosnudge="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div class="pop-body" style="padding:14px 18px 8px">'
    + '<p class="hint" style="margin:0 0 6px;font-size:14px">' + esc(t('هكذا يحفظ الجهازُ عملَك فلا يضيع، ويفتح أسرع.')) + '</p>'
    + step('١', esc(t('اضغط زرَّ المشاركة')) + ' <b style="font-size:20px">\u2B06\uFE0E</b> ' + esc(t('أسفلَ الشاشة.')))
    + step('٢', esc(t('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».')))
    + step('٣', esc(t('افتح التطبيقَ من الأيقونة الجديدة دائمًا.')))
    + '<p class="hint" style="margin:6px 0 0;font-size:13px">' + esc(t('إن فتحتَ الرابطَ من واتساب: اضغط ⋯ ثم «فتح في Safari» أولًا.')) + '</p>'
    + '<div class="actions" style="margin-top:12px">' + btn(t('تم'), 'btn-primary', ' data-iosnudge="done"') + btn(t('ذكّرني غدًا'), 'btn-quiet', ' data-iosnudge="later"') + '</div>'
    + '</div></div></div>';
}
/* شرحُ التثبيت على آيفون — خطوتان لا أكثر */
var POP_HELP = '';
function iosHelpCard(){
  if (POP_HELP !== 'ios') return '';
  return card('تثبيت التطبيق على آيفون',
    '<div class="pop-rows" style="margin:0">'
    + '<div><span class="k">١</span><span>'
    +   esc(t('افتح الصفحة في متصفّح Safari — لا يعمل التثبيت من متصفّحٍ آخر على آيفون.'))
    + '</span></div>'
    + '<div><span class="k">٢</span><span>'
    +   esc(t('اضغط زرَّ المشاركة (المربّع بسهمٍ لأعلى) أسفل الشاشة.'))
    + '</span></div>'
    + '<div><span class="k">٣</span><span>'
    +   esc(t('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».'))
    + '</span></div>'
    + '</div>'
    + '<p class="hint">' + esc(t('بعدها يفتح التطبيقُ ملءَ الشاشة ويعمل بلا شبكة، وتصله الإشعارات.')) + '</p>',
    btn('فهمت','btn-quiet btn-sm',' data-poph="0"'));
}

/* العلامةُ مرةً واحدةً في الملف — يقرؤها البيانُ والدخولُ والتقارير */
var LOGO = document.querySelector('.brand-mark img') ? document.querySelector('.brand-mark img').src : '';

var MANIFEST = {
  name:'قارئات أفاقي', short_name:'أفاقي',
  start_url:'./', display:'standalone', orientation:'any',
  background_color:'#0A0D10', theme_color:'#185FA5', dir:'rtl', lang:'ar',
  /* الأيقونةُ ملفَّان حقيقيّان في المستودع بالعلامة نفسِها — والـSVG المؤقّتُ
     لا يصلح لآيفون (V16.99) */
  icons:[{ src:'icon-192.png', sizes:'192x192', type:'image/png', purpose:'any' },
         { src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'any' },
         { src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'maskable' }]
};

/* البيانُ ملفٌّ موصولٌ في الرأس — كان يُولَّد هنا `blob:` أيضًا فيزاحمه،
   وأيقونتُه SVG في بيانٍ مؤقّتٍ لا تصلح لآيفون. أُبقيت الدالةُ حارسةً:
   إن غاب الوسمُ من الرأس يومًا وصلته، ولا تُضيف ثانيًا إن وُجد. */
function manifestInject(){
  try{
    if (document.querySelector('link[rel="manifest"]')) return;
    var l = document.createElement('link');
    l.rel = 'manifest'; l.href = 'manifest.webmanifest';
    document.head.appendChild(l);
  }catch(e){}
}
/* ═══ صفحة الدخول — خلفية حية مبنية بالكود ═══
   ١٧٨٧ نقطة تُرسم على شبكة وتنوّر بالتدريج: المشروع يحكي نفسه
   بدل صورة مستعارة. خفيفة، وتحترم prefers-reduced-motion. */

var LOGIN_CSS = `
#login{position:fixed;inset:0;z-index:100;display:grid;place-items:center;
  background:#070A0D;overflow:hidden}
#loginCv{position:absolute;inset:0;width:100%;height:100%}
#login .veil{position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 40%,rgba(7,10,13,.15),rgba(7,10,13,.92) 72%)}
/* أثناء استئناف الجلسة لا يُعرَض النموذج — كان يومض ثم يختفي فيظنّ المستخدمُ أنه خرج */
#login.resuming .box{visibility:hidden}
#login .lg-note{position:relative;z-index:3;color:#fff;font-size:15px}
#login .box{position:relative;z-index:2;width:min(390px,92vw);
  background:rgba(15,20,25,.93);border:1px solid #232B33;border-radius:16px;
  padding:26px 24px;backdrop-filter:blur(10px);box-shadow:0 24px 70px rgba(0,0,0,.6)}
#login .lg{display:flex;align-items:center;gap:11px;margin-bottom:18px}
#login .lgm{width:64px;height:46px;border-radius:11px;background:#fff;
  display:grid;place-items:center;padding:5px 7px;flex:0 0 auto;overflow:hidden}
.lgm img{width:100%;height:auto;display:block}
#login h1{font-size:19px;color:#E8EBEE;line-height:1.3}
#login .sub{font-size:12.5px;color:#8A939D;margin-top:2px}
#login .cnt{font-size:12px;color:#5FA8E8;margin:0 0 16px;font-variant-numeric:tabular-nums}
#login label{display:block;font-size:12.5px;color:#9BA5AF;margin:0 0 5px}
#login input,#login select{width:100%;background:#0B1014;border:1px solid #2A333C;
  border-radius:9px;padding:11px 12px;color:#E8EBEE;font:inherit;min-height:44px;margin-bottom:13px}
#login input:focus,#login select:focus{outline:2px solid #185FA5;border-color:#185FA5}
#login .rem{display:flex;align-items:center;gap:9px;margin:2px 0 14px;
  font-size:13px;color:#C6CFD7;cursor:pointer;user-select:none}
#login .rem input{width:18px;height:18px;accent-color:#185FA5;cursor:pointer;margin:0}
#login .go{width:100%;background:#185FA5;color:#fff;border:0;border-radius:9px;
  padding:13px;font:inherit;font-weight:600;cursor:pointer;min-height:48px}
#login .go:active{transform:scale(.99)}
#login .note{font-size:11.5px;color:#6C757E;text-align:center;margin:14px 0 0;line-height:1.6}
#login .langs{display:flex;gap:6px;justify-content:center;margin:16px 0 0}
#login .langs button{background:transparent;border:1px solid #2A333C;color:#9BA5AF;
  border-radius:99px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer;min-height:34px}
#login .langs button.on{background:#185FA5;border-color:#185FA5;color:#fff}
`;

/* الاسمُ المحفوظُ من آخر دخولٍ — إن أذن صاحبُه */
function lgRemembered(){
  try { return localStorage.getItem('nsk14.user') || ''; } catch (e){ return ''; }
}

/* جلسةٌ محفوظةٌ تُفتَح بلا كلمة: Firebase يحفظ الجلسةَ في المتصفّح بطبعه،
   ونحن كنّا لا نسأل عنها فنطلب الكلمةَ في كلِّ فتحة — والفنيُّ في المشاعر
   يفتح التطبيقَ عشرين مرةً في اليوم.
   والكلمةُ لا تُخزَّن على الجهاز أبدًا: جهازُ الميدان يُفقَد ويُعار،
   والجلسةُ تُبطَل من لوحة Firebase أمّا الكلمةُ المخزَّنةُ فلا تُبطَل. */
function autoSignIn(){
  /* لا يُشتَرَط «تذكّرني»: جلسةُ Firebase قائمةٌ بعد إعادة التحميل سواءٌ حُفظ
     الاسمُ أم لا — وحفظُ الاسم زينةٌ لملء الحقل لا شرطٌ لبقاء الجلسة.
     وكان الشرطُ يُطلَب معه الدخولُ من جديدٍ بعد كلِّ تحديثٍ للصفحة. */
  return FB.init().then(function(ok){
    if (!ok || !FB.auth) return false;
    return new Promise(function(res){
      var done = false;
      var stop = setTimeout(function(){ if (!done){ done = true; res(false); } }, 6000);
      try {
        FB.auth.onAuthStateChanged(function(u){
          if (done) return;
          done = true; clearTimeout(stop);
          if (!u){ res(false); return; }
          STATE.meta.uid = u.uid;
          STATE.meta.online = true;
          DB.col('users').doc(u.uid).get().then(function(doc){
            FB.readCount = (FB.readCount || 0) + doc.size;
            var v = doc.exists ? (doc.data() || {}) : {};
            /* الوثيقةُ تُحفَظ في مكانها ليُرى وجودُها في بطاقة الهوية —
               ولئلّا يُقال «لم تُسحَب» عن موجودة. */
            MYDOC.at = Date.now(); MYDOC.has = !!doc.exists;
            if (doc.exists){ STATE.users = STATE.users || {}; STATE.users[u.uid] = Object.assign({}, v); }
            STATE.meta.name = v.name || lgRemembered();
            ROLE = isBossHere() ? 'admin' : (ROLES[v.role] ? v.role : 'tech');
            STATE.meta.role = ROLE;
            /* كلمةٌ مؤقتةٌ من الورقة: تُبدَّل قبل أيِّ عمل */
            if (v.mustChange) setTimeout(function(){ pwOpen(true); }, 600);
            res(true);
          }).catch(function(){ res(true); });
        });
      } catch (e){ done = true; clearTimeout(stop); res(false); }
    });
  }).catch(function(){ return false; });
}

function bootAuto(){
  var lg = document.getElementById('login');
  if (!lg) return;
  var note = document.createElement('div');
  note.className = 'hint lg-note';
  note.style.cssText = 'text-align:center;margin:12px 0 0';
  note.textContent = t('يُبحَث عن جلسةٍ مفتوحة…');
  /* من دخل من قبلُ على هذا الجهاز لا يرى النموذجَ يومض — يرى «يُستأنَف الدخول»
     ثم صفحتَه التي كان عليها. ومن لا جلسةَ له يرى النموذجَ كما كان. */
  var had = lsGet('nsk14.session') === '1';
  if (had){ lg.classList.add('resuming'); note.textContent = t('يُستأنَف الدخول…'); }
  try { lg.appendChild(note); } catch (e){ LS_ERR = e; }
  autoSignIn().then(function(ok){
    try { note.remove(); } catch (e){ LS_ERR = e; }
    if (!ok){ lg.classList.remove('resuming'); return; }
    /* يُظهَر الهيكلُ كما يفعل الدخولُ اليدويّ: `#app` يبدأ `display:none`،
       وكان يُخفى الدخولُ ولا يُظهَر الهيكل — فتبقى الصفحةُ فارغةً تمامًا،
       لا شاشةَ دخولٍ ولا تطبيق. */
    enterShell();
    /* كانتا تُنادَيان على CORE وهما على FB — فينفجر الوعدُ بعد الدخول التلقائيِّ
       ولا يُنصَت ولا يُسحَب ولا يُدفَع الطابورُ حتى يُضغَط بيد. */
    bootStage('pull');   /* (V34.2) */
    var first = FB.legacyDone() ? Promise.resolve(0) : FB.pullLegacy();
    first.then(function(){ return FB.pullStatic().catch(function(){ return 0; }); })
         .then(function(){ return pullDelta(); }).then(function(){ liveWatch(); liveSmall(); pulseWatch(); presenceBeat(true); return 0; })
         .then(function(){ statBump(); render(1); syncBadge(); })
         .catch(function(e){
           softErr('بدء الجلسة', e, 'دخلتَ — وتعذّر جلبُ البيانات، جرّب المزامنة');
           render(1);
         });
    logEvent('دخولٌ بجلسةٍ محفوظة');
  });
}


function loginPaint(){
  var el = document.getElementById('login');
  if (!el) return;
  el.innerHTML =
      '<canvas id="loginCv" aria-hidden="true"></canvas><div class="veil"></div>'
    + '<div class="box">'
    +   '<div class="lg"><div class="lgm"><img src="' + LOGO + '" alt="AFAQY" width="380" height="133"></div><div>'
    +     '<h1>'+esc(t('قارئات أفاقي'))+'</h1>'
    +     '<div class="sub">'+esc(t('نظام متابعة تركيب قارئات الحجاج'))+'</div></div></div>'
    +   '<p class="cnt" id="lgCount">'+nm(0)+' / '+nm(siteStats().total)+' '+esc(t('نقطة'))+' · '+esc(t('المشاعر المقدسة'))+'</p>'
    +   '<label for="lgU">'+esc(t('اسم المستخدم'))+'</label>'
    +   '<input id="lgU" dir="ltr" autocomplete="username" placeholder="m.safwat">'
    +   '<label for="lgP">'+esc(t('كلمة المرور'))+'</label>'
    +   '<input id="lgP" type="password" dir="ltr" autocomplete="current-password" placeholder="••••••••">'
    +   '<label class="rem" for="lgRem">'
    +     '<input type="checkbox" id="lgRem"' + (lgRemembered() ? ' checked' : '') + '>'
    +     '<span>' + esc(t('تذكّرني على هذا الجهاز')) + '</span></label>'
    +   '<button type="button" class="go" id="lgGo">'+esc(t('دخول'))+'</button>'
    /* ═══ التفعيلُ الذاتيّ ═══
       بمئةٍ وخمسين شخصًا لا يصحُّ أن يقف كلُّ حسابٍ على المكتب: يُسجّل
       المهندسُ الاسمَ والدورَ فحسب، ويفتح صاحبُه التطبيقَ فيضع كلمتَه هو
       ويدخل. فلا كلمةَ تُرسَل في محادثة، ولا يُنتظَر أحدٌ ليفعّل، ولا
       يُعاد الإنشاءُ حين تتعثّر الشبكةُ لحظة. */

    +   '<div class="langs" id="lgLangs">'
    +     ['ar','en','ur'].map(function(l){
            return '<button type="button" data-l="'+l+'" class="'+(LANG===l?'on':'')+'">'+I18N[l].name+'</button>';
          }).join('')
    +   '</div>'
    +   '<p class="note">'+esc(t('لا تسجيل ذاتي — الحسابات تُنشأ من المكتب'))+'</p>'
    + '</div>';

  function go(){
    var u = (document.getElementById('lgU') || {}).value || '';
    var p = (document.getElementById('lgP') || {}).value || '';
    var rm = document.getElementById('lgRem');
    /* يُحفَظ الاسمُ لا الكلمة. وكلمةُ المرور لا تُخزَّن على الجهاز أبدًا:
       جهازُ الميدان يُفقَد ويُعار، والاسمُ وحده لا يفتح شيئًا. */
    try {
      /* الاسمُ يُحفَظ ليُملأ الحقلُ في المرة القادمة. والكلمةُ لا تُحفَظ
         أبدًا — جهازُ الميدان يُفقَد ويُعار. */
      if (rm && rm.checked) localStorage.setItem('nsk14.user', u);
      else localStorage.removeItem('nsk14.user');
    } catch (e){ LS_ERR = e; }
    enterApp(u, p);
  }
  var lastU = lgRemembered();
  if (lastU){
    var uEl = document.getElementById('lgU');
    if (uEl) uEl.value = lastU;
    var pEl = document.getElementById('lgP');
    if (pEl) try { pEl.focus(); } catch (e){ LS_ERR = e; }
  }
  document.getElementById('lgGo').onclick = go;

  document.getElementById('lgP').onkeydown = function(e){ if (e.key === 'Enter') go(); };
  document.getElementById('lgLangs').onclick = function(e){
    var b = e.target.closest('[data-l]');
    if (b){ setLang(b.getAttribute('data-l')); }
  };
  loginBg();
}

function loginBg(){
  var cv = document.getElementById('loginCv');
  if (!cv) return;
  var ctx = null;
  try{ ctx = cv.getContext('2d'); }catch(e){}
  if (!ctx) { cv.style.display = 'none'; return; }   /* زينة تُهمَل لا تُسقط الصفحة */
  var pts = [], lastN = -1, TOT = siteStats().total;
  var slow = false;
  try{ slow = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  /* (V32.9) الوحدة ١٠ — أوّلُ فتحٍ أسرع: الخلفيةُ كانت ترسم ١٬٩٠٠ نقطةٍ في كلِّ إطارٍ بلا توقّف وتكتب العدّادَ في الصفحة كلَّ إطار —
     نحوُ ثانيةٍ من المعالج على جوالٍ متوسطٍ قبل ظهور نموذج الدخول وأثناء الكتابة فيه. صارت: دورةً واحدةً ثم تقف على الصورة الكاملة،
     بعشرين إطارًا في الثانية، والعدّادُ يُكتب حين يتغيّر، وتبدأ بعد ظهور النموذج؛ والجهازُ الضعيفُ يرى الصورةَ الكاملةَ ثابتة. */
  /* (V33.9) بلاغُ المالك «كانت ديناميك في الفتحة وبقت ثابتة»: قاعدةُ «المعالجُ ≤ ٤ أنوية = صورةٌ ثابتة» كانت تُطفئ الحركةَ على الآيفون
     (يُبلّغ أربعةً أو أقل) — أُلغيت؛ ولا تُطفَأ إلا بإعداد «تقليل الحركة». والحركةُ مستمرةٌ ما دامت شاشةُ الدخول ظاهرة (وأثناء «يُستأنَف الدخول»)
     بعشرين إطارًا، وتقف وحدَها حين تختفي الشاشة — فلا تأكل المعالجَ بعد الدخول كما كان قبل V32.9. */

  function build(){
    var w = cv.width = cv.offsetWidth * (window.devicePixelRatio || 1);
    var h = cv.height = cv.offsetHeight * (window.devicePixelRatio || 1);
    pts = [];
    var cols = Math.max(24, Math.round(w / 26));
    var rows = Math.ceil(TOT / cols);
    var gx = w / (cols + 1), gy = Math.min(gx, h / (rows + 1));
    var oy = (h - gy * (rows - 1)) / 2;
    for (var i = 0; i < TOT; i++){
      var c = i % cols, r = Math.floor(i / cols);
      pts.push({
        x: gx * (c + 1) + (Math.sin(i * 12.9898) * gx * 0.18),
        y: oy + gy * r + (Math.cos(i * 78.233) * gy * 0.18),
        d: (i / TOT) + Math.abs(Math.sin(i * 4.1)) * 0.12
      });
    }
  }

  function draw(prog){
    var w = cv.width, h = cv.height, dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    var n = 0;
    for (var i = 0; i < pts.length; i++){
      var p = pts[i], on = p.d <= prog;
      if (on) n++;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (on ? 1.9 : 1.05) * dpr, 0, 6.2832);
      ctx.fillStyle = on ? 'rgba(55,138,221,.9)' : 'rgba(90,102,115,.24)';
      ctx.fill();
      if (on && i % 17 === 0){
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5 * dpr, 0, 6.2832);
        ctx.fillStyle = 'rgba(55,138,221,.10)';
        ctx.fill();
      }
    }
    if (n !== lastN){ lastN = n; var c = document.getElementById('lgCount');
      if (c) c.textContent = nm(n) + ' / ' + nm(TOT) + ' ' + t('نقطة') + ' \u00b7 ' + t('المشاعر المقدسة'); }
  }

  build();
  if (slow){ draw(1.2); return; }

  /* ═══ (V34.1) بلاغُ المالك: «A problem repeatedly occurred» على الآيفون بعد V33.9 ═══
     الحركةُ المستمرةُ كانت ترسم ١٬٩٠٠ نقطةٍ عشرين مرةً في الثانية على لوحةٍ بكثافة شاشة الآيفون (×٣) — وأثناء «يُستأنَف الدخول»
     نفسِه حين يحمّل التطبيقُ بياناته — فيختنق محرّكُ الصفحة ويُقتَل. والحركةُ الآن بلا رسمٍ متكرّر: الصورةُ تُرسَم مرةً واحدة،
     وفوقها وهجٌ يتحرّك بـCSS (تتولّاه بطاقةُ الرسوم لا المعالج). وبعد أيِّ إقلاعٍ مات فجأةً (BOOT_GUARD) لا وهجَ ولا حركة. */
  draw(1.2);
  var calm = slow || (typeof BOOT_GUARD === 'object' && BOOT_GUARD.crashes > 0);
  if (!calm && !document.getElementById('lgShine')){
    var sh = document.createElement('div'); sh.id = 'lgShine'; sh.setAttribute('aria-hidden', 'true');
    /* بعد الستار المعتِم وقبل بطاقة الدخول — ترتيبُ الصفحة يضعه فوق النقاط وتحت البطاقة */
    try { var veil = cv.parentNode.querySelector('.veil'); cv.parentNode.insertBefore(sh, (veil || cv).nextSibling); } catch (e){ LS_ERR = e; }
  }
  window.addEventListener('resize', function(){ build(); draw(1.2); }, { passive:true });
  cv.__stop = function(){ var e = document.getElementById('lgShine'); if (e) e.remove(); };
}

