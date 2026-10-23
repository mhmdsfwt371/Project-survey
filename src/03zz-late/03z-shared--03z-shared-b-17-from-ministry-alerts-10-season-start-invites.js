/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-b-17-from-ministry-alerts-10-season-start-invites.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-b-17-from-ministry-alerts-10-season-start-invites.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : ghRunNow
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function ghRunNow(quiet){
  if (!may('provision')){ if (!quiet) toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return Promise.resolve(false); }
  var tk = ghToken();
  if (!tk){
    /* لا مفتاحَ على هذا الجهاز: لا يُرسَل أحدٌ إلى GitHub — يُقال له ما ينقص ومن يملكه */
    if (!quiet) toast(t('لا مفتاحَ تشغيلٍ على هذا الجهاز — يحفظه مديرُ المشروع في ثوابت النظام، ثم يعمل الزرُّ من هنا لكلِّ من يُنشئ الحسابات'));
    return Promise.resolve(false);
  }
  toast(t('يُطلَب تشغيلُ الخادم…'));
  return fetch('https://api.github.com/repos/' + GH_REPO + '/actions/workflows/provision.yml/dispatches', {
    method:'POST',
    headers:{ 'Authorization':'Bearer ' + tk, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json' },
    body:JSON.stringify({ ref:'main' })
  }).then(function(r){
    if (r.status === 204){
      GH_RAN = Date.now();
      logEvent('تشغيلُ خادم الحسابات يدويًّا');
      toast(t('انطلق الخادم — الحساباتُ خلال دقيقة، وتصلك «تمّ» هنا فورًا'));
      render(1); return true;
    }
    if (r.status === 401 || r.status === 403){   /* (V30.7) المفتاحُ منتهٍ: الطلبُ محفوظٌ ويُنفَّذ مع أقرب دورةٍ — ويُقال ذلك بوضوح، ويُعلَّم المفتاحُ ليراه المدير */
      CFG.gh = Object.assign({}, CFG.gh || {}, { bad:Date.now(), badCode:r.status });
      toast(t('الخادمُ لم يُشغَّل (مفتاحُ التشغيل منتهٍ). اضغط «أنشئه من هذا الجهاز الآن» بجوار الحساب في القائمة'));
      logEvent('مفتاحُ تشغيل الحسابات رُفض — ' + r.status);
      render(1); return false;
    }
    toast(t('رفض GitHub التشغيل') + ' \u2014 ' + r.status);
    return false;
  }).catch(function(e){ toast(t('تعذّر الاتصال بـ GitHub') + ' \u2014 ' + String(e && e.message || '').slice(0, 40)); return false; });
}
