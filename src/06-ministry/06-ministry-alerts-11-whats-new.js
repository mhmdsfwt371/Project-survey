/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-11-whats-new.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : 'What's new' — the version log shown once per update (also the release notes source for bump.mjs).
   DEFINES : releaseNotesSince, whatsNewMaybe, wnClose, wnHtml, pwOpen, pwNeeded, pwHtml, pwSave
   GLOBALS : RELEASE_NOTES, WN
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* verNum القائمةُ (رقمُ النسخة عددًا) هي المستعمَلة — لا تعريفَ ثانيًا */

function wnClose(){ if (WN) lsSet('nsk14.seenVer', WN.v); WN = null; render(1); }

function pwNeeded(){
  var me = (STATE.users || {})[myUid()];
  return !!(me && me.mustChange);
}

function pwSave(){
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '') : ''; };
  var p0 = g('pw0'), p1 = g('pw1'), p2 = g('pw2');
  if (p1.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if (p1 !== p2){ toast(t('الكلمتان غير متطابقتين')); return; }
  if (!STATE.meta.online){ toast(t('تبديلُ الكلمة يحتاج شبكة')); return; }
  var u = FB.auth && FB.auth.currentUser;
  if (!u){ toast(t('سجّل الدخول أولًا')); return; }
  toast(t('تُبدَّل الكلمة…'));
  var go = function(){
    return u.updatePassword(p1).then(function(){
      var me = (STATE.users || {})[myUid()], now = Date.now();
      /* الحقلان وحدهما يُرفَعان — لا الوثيقةُ كلُّها: كان يُكتَب فوق النسخة
         المحليةِ كائنٌ من حقلين فيضيع الاسمُ والدورُ حتى السحبةِ التالية، والقاعدةُ
         تقبل من صاحب الحساب هذين الحقلين فقط */
      if (me){ me.mustChange = false; me.pwAt = now; }
      CORE.dirty('users', myUid(), { mustChange:false, pwAt:now });
      SESS_PW = p1;
      logEvent('تبديل كلمة المرور — ' + (STATE.meta.name || ''));
      toast(t('بُدِّلت كلمتُك — لا يعرفها أحدٌ سواك'));
      PW = null; render(1);
    });
  };
  var reauth = function(pw){
    var cred = window.firebase.auth.EmailAuthProvider.credential(u.email, pw);
    return u.reauthenticateWithCredential(cred);
  };
  var chain;
  if (PW && PW.forced){
    /* الدخولُ الأوّلُ حديثٌ فتُبدَّل مباشرة. وإن كانت الجلسةُ مستعادةً وطلبت
       المصادقةُ دخولًا حديثًا: تُثبَت بكلمة الجلسة إن عُرفت، وإلا بالمؤقتة المكتوبة،
       وإلا سُئل عنها في النافذة نفسِها — لا «ادخل من جديد» */
    var old9 = p0 || SESS_PW;
    chain = (old9 && PW.needOld ? reauth(old9).then(go) : go()).catch(function(e){
      if (!/requires-recent-login/.test(String(e && e.code || ''))) throw e;
      if (old9) return reauth(old9).then(go);
      PW.needOld = true; render(1);
      throw { code:'need-old' };
    });
  } else {
    /* الهويةُ تُثبَت بالكلمة الحالية قبل التبديل — كما تفعل كلُّ الأنظمة */
    chain = reauth(p0).then(go);
  }
  chain.catch(function(e){
    var m = String(e && e.code || '');
    toast(/wrong-password|invalid-credential/.test(m) ? t('الكلمةُ الحالية غيرُ صحيحة')
        : /weak-password/.test(m) ? t('كلمةُ المرور ضعيفة')
        : /need-old/.test(m) ? t('اكتب كلمتَك المؤقتة أوّلًا لإثبات الهوية — ثم بدّل')
        : /requires-recent-login/.test(m) ? t('ادخل من جديد ثم بدّل الكلمة')
        : t('تعذّر التبديل') + ' — ' + m.slice(0, 40));
  });
}

