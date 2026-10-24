/* ============================================================================
   FILE    : src/03z-shared/03z-shared-05-from-tasks-office-05-account-backup-continuity.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-05-account-backup-continuity.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : myUid, meInactive, meActivatedCheck, permRelease, myDocFetch, bkFetch, contRes, contLoad
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ المعرِّفُ يُقرأ من المصادقة لا من الجلسة وحدَها ═══
   `STATE.meta.uid` يُملأ في مسار الدخول — ومن دخل ثم أُعيد تحميلُ الصفحة،
   أو دخل من مسارٍ آخر، بقي فارغًا والمصادقةُ عارفةٌ به. فيقول زرُّ الإصلاح
   «سجّل الدخول أوّلًا» لمن هو داخلٌ فعلًا، ويُرفَض كلُّ ما يكتب بلا مخرج:
   الوثيقةُ لا تُقرأ لأنه «غير مسجَّل»، ولا تُنشَأ لأن الزرَّ يرفض. */
function myUid(){
  if (STATE.meta.uid) return STATE.meta.uid;
  try {
    var u = FB.auth && FB.auth.currentUser;
    if (u && u.uid){ STATE.meta.uid = u.uid; return u.uid; }
  } catch (e){
    /* المصادقةُ إن لم تُهيَّأ بعدُ فليست عطلًا — لكنها تُسجَّل كي لا يُبتلَع
       سببُ بقاء المعرِّف فارغًا صامتًا. */
    if (typeof softErr === 'function') softErr('قراءة المعرِّف', e, '');
  }
  return '';
}

/* ═══ الحسابُ الذي ينتظر التفعيل (V17.93) ═══
   من سجّل نفسَه — أو عُطِّل — يعمل على جهازه ولا تقبل القاعدةُ رفعَه؛ فما
   يرفعه يُعزَل برفض صلاحيةٍ لا يُسقَط. تُقال الحالُ في لافتةٍ ثابتة، ويُتحقَّق
   في كلِّ نبضةٍ هل فعّله المكتب — فإن فُعِّل عاد المعزولُ إلى الطابور وحدَه. */
function meInactive(){
  var u = STATE.users && STATE.users[myUid()];
  return !!(u && u.active === false);
}

function meActivatedCheck(){
  if (!meInactive() || !STATE.meta.online) return Promise.resolve(false);
  return myDocFetch(true).then(function(has){
    if (!has || meInactive()) return false;
    var back = permRelease(true);
    logEvent('فُعِّل الحساب — ' + (back ? nm(back) + ' وثيقةً عادت للرفع' : 'لا معزول'));
    toast(t('فُعِّل حسابك — يُرفَع عملُك الآن'));
    render(1); return true;
  });
}

var MYDOC = { at:0, has:null, err:'' };

/* `now=false` حين يتولّى المنادي الدفعَ بنفسه: كانت هذه تجدول دفعةً بعد
   جزءٍ من الثانية، فتسبق دفعةَ المنادي أو تُعطِّلها بالقفل — فيقول الزرُّ
   «رُفع ٠» ثم يُرفَع فعلًا بعد لحظة، فيُقرأ الرقمُ كذبًا. */
function permRelease(now){
  var PZ = STATE.poison || [], back = 0;
  STATE.poison = PZ.filter(function(x){
    if (!/permission|insufficient|PERMISSION_DENIED/i.test(String(x.err || ''))) return true;
    CORE.dirty(x.kind, x.id, x.v); back++;
    return false;
  });
  /* التكتّمُ يُصفَّر: كان يُقال مرةً واحدةً في العمر، فلا يُقال بعد الإصلاح
     إن فشل شيءٌ آخر — ولا يُقال إنه نجح. */
  SOFT_SAID = {};
  if (back) logEvent('عادت للرفع بعد إصلاح الصلاحية — ' + nm(back) + ' وثيقة');
  CORE.saveLocal();
  if (now !== false && STATE.meta.online)
    setTimeout(function(){ CORE._busy = false; CORE.flush(); }, 200);
  return back;
}

function myDocFetch(force){
  if (!myUid()) return Promise.resolve(null);
  /* بلا شبكةٍ تبقى الحالةُ «تُقرأ…» إلى الأبد — فيُظنُّ أن القراءةَ معلّقةٌ
     وهي لم تبدأ. تُهيَّأ الوصلةُ إن أمكن، وإلا قيلت الحالُ كما هي. */
  if (!FB.ready || !FB.db){
    if (!STATE.meta.online){ MYDOC.err = 'offline'; return Promise.resolve(null); }
    return FB.init().then(function(ok){ return ok ? myDocFetch(true) : null; }).catch(function(){ return null; });
  }
  if (!force && Date.now() - MYDOC.at < 60000) return Promise.resolve(MYDOC.has);
  MYDOC.at = Date.now();
  return DB.col('users').doc(myUid()).get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    MYDOC.has = !!(doc && doc.exists);
    if (MYDOC.has){
      STATE.users = STATE.users || {};
      STATE.users[myUid()] = Object.assign({}, doc.data());
    }
    return MYDOC.has;
  }).catch(function(e){
    MYDOC.err = String(e && (e.message || e.code) || e).slice(0, 120);
    return null;
  });
}

/* ═══ حالةُ النسخ الاحتياطي والدرايف — تُقرأ من المستودع ═══
   السيرُ اليوميُّ ينجح كلَّ يوم ويقول «نجح» — وهو لا يحفظ شيئًا حين تغيب
   الأسرار: يكتب أعدادًا ويتخطّى الرفعَ بإشعارٍ لطيفٍ لا يقرؤه أحد. فظُنَّ
   أن النسخَ يعمل وهو لا يعمل. صار يكتب حالتَه في ملفّين علنيَّين لا بياناتَ
   فيهما (_meta.json و_drive.json)، والتطبيقُ يقرؤهما ويعرضهما حيث يُرى:
   هل أُخذت نسخةُ اليوم؟ وهل وصلت درايف؟ وإن لا — ما الذي ينقص بالحرف. */
var BK_STATE = { at:0, meta:null, drive:null, err:'' };

var BK_RAW = 'https://raw.githubusercontent.com/mhmdsfwt371/-Project-survey/main/backups/latest/';

function bkFetch(force){
  if (!force && Date.now() - BK_STATE.at < 30 * 60 * 1000) return;
  BK_STATE.at = Date.now();
  if (typeof fetch !== 'function' || !navigator.onLine) return;
  var got = 0;
  ['_meta.json','_drive.json'].forEach(function(f){
    fetch(BK_RAW + f + '?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (f === '_meta.json') BK_STATE.meta = j; else BK_STATE.drive = j; got++; if (got === 2 && CUR === 'sys') render(1); })
      .catch(function(e){ BK_STATE.err = String(e && e.message || e); });
  });
}

/* ═══ (V38.8) «ما يعتمد على شخص» — الاستمراريةُ بنظرةٍ واحدة ═══
   من يخلف صاحبَ المشروع يحتاج أن يعرف من أوّل يوم: هل الجسرُ يُشغَّل؟ هل النسخُ يُؤخَذ؟ متى ينتهي مفتاحُ الدفع؟
   ومن البديلُ المسمّى لكلِّ موردٍ لا يملكه إلا واحد؟ البدائلُ تُكتَب هنا (settings/continuity) فتُرى لكلِّ المكتب. */
function contRes(){ return [['gh', 'GitHub — المستودع والأسرار'], ['fb', 'Firebase — القاعدة والحسابات'], ['nk', 'حساب نظام البطاقات (الجسر)'],
                ['bk', 'مفتاح النسخ الاحتياطي'], ['dec', 'قرارات الأوزان والسجلّ والاعتماد']]; }

function contLoad(){
  if (!FB.ready || !FB.db || (contLoad.at && Date.now() - contLoad.at < 60000)) return;
  contLoad.at = Date.now();
  DB.col('settings').doc('continuity').get().then(function(doc){ contLoad.d = (doc && doc.exists) ? doc.data() : {}; if (CUR === 'sys') render(1); })
    .catch(function(e){ softErr('الاستمرارية', e, ''); });
  if (!contLoad.dl && typeof fetch === 'function'){
    contLoad.dl = { items:[] };
    fetch('docs/deadlines.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (j && j.items) contLoad.dl = j; if (CUR === 'sys') render(1); }).catch(function(e2){ LS_ERR = e2; });
  }
}
