/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-10-season-start-invites.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Season start values, invitations (single and bulk), creation requests, run-server-now, requests when the screen lies, and first-login password change.
   DEFINES : seedPlan, seedApply, seedCard, readyRows, readyCard, passGen, normAr, roleGuess, jobGuess, bulkParse, bulkApply, bulkCard, ghToken, ghSetToken … (+11 more)
   GLOBALS : BULK_TXT, ROLE_ALIAS, GH_REPO, GH_RAN, PROV_CANCEL, BOARD_ROLE, PW, SESS_PW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function seedApply(){
  if (!may('settings')){ toast(t('بدءُ الموسم للمهندس وحده')); return; }
  var P = seedPlan(), n = 0;
  P.wRows.forEach(function(r){ if (!cfgGet('w', r.k)){ cfgSet('w', r.k, r.w); n++; } });
  Object.keys(P.vals).forEach(function(k){
    if (!cfgGet(k)){ cfgSet(k, null, P.vals[k]); n++; }
  });
  if (!cfgGet('tgtSurvey')){ cfgSet('tgtSurvey', null, P.tgtSurvey); n++; }
  if (!cfgGet('dueSurvey')){ cfgSet('dueSurvey', null, P.dueS); n++; }
  if (!cfgGet('dueInstall')){ cfgSet('dueInstall', null, P.dueI); n++; }
  logEvent('بدء الموسم — كُتب مقترحٌ في ' + nm(n) + ' حقلًا');
  toast(nm(n) + ' ' + t('حقلًا كُتب بمقترحه — راجعه في شاشته'));
  statBump(); render(1);
  return n;
}

/* ═══ الدعوةُ يفعّلها صاحبُها ═══
   الحسابُ يُسجَّل في «المدعوّون» باسمه ودوره — بلا كلمةِ مرور. ويفتح صاحبُه
   التطبيقَ ويضع كلمتَه هو، فيُنشَأ حسابُ دخوله وتُكتَب وثيقتُه بالدور الذي
   دُعي به، ثم تُمحى الدعوة. والقاعدةُ تحرس ذلك: لا يكتب أحدٌ لنفسه دورًا
   غيرَ الذي في دعوته، ولا يفعّل دعوةَ غيره. */

function bulkApply(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var rows = bulkParse(BULK_TXT).filter(function(r){ return !r.why; });
  if (!rows.length){ toast(t('لا سطرَ صالحٌ للكتابة')); return; }
  STATE.provision = STATE.provision || {};
  rows.forEach(function(r){
    var v = { name:r.name, user:r.user, role:r.role, pass:r.pass, status:'pending',
              at:Date.now(), by:STATE.meta.name || '' };
    if (r.job)   v.job   = r.job;
    if (r.crew)  v.crew  = r.crew;
    if (r.email) v.email = r.email;
    if (r.reissue) v.reissue = true;
    STATE.provision[r.user] = v;
    /* الحسابُ القائمُ لا يُكرَّر صفًّا «يُنشَأ» — الطلبُ يضبط كلمتَه فقط */
    if (!r.reissue)
      STATE.users[r.user] = { name:r.name, user:r.user, role:r.role, active:true, at:Date.now(), provisioning:true };
    CORE.set('provision', r.user, v);
  });
  provKick();
  logEvent('طلبُ حساباتٍ جماعيّ — ' + nm(rows.length) + ' حسابًا');
  toast(nm(rows.length) + ' ' + t('طلبًا كُتب — يُنشئها الخادمُ خلال دقائق، ثم صدِّر ورقةَ الدخول'));
  BULK_TXT = ''; statBump(); render(1);
}

/* ═══ طلباتُ الإنشاء وورقةُ الدخول ═══
   المكتبُ يرى حالَ كلِّ طلب — يُنشَأ · تمّ · خطأ بسببه — ويُصدِر ورقةَ
   الدخول إكسل: الاسمُ والمستخدمُ والكلمةُ والدور، ورقةٌ لكلِّ فريق يوزّعها
   مشرفُه. ثم يمسح الكلماتِ من الطلبات بضغطة — فلا تبقى في القاعدة. */

function ghSetToken(v){
  if (!may('roles')){ toast(t('مفتاحُ التشغيل لمدير المشروع وحده')); return; }
  var tk = String(v || '').trim();
  CFG.gh = Object.assign({}, CFG.gh || {}, { tok:tk, at:Date.now() });
  /* وثيقةٌ مستقلةٌ لا تُخلَط بالإعدادات العامّة التي يقرؤها الجميع */
  CORE.set('ghcfg', 'gh', { tok:tk, at:Date.now() });
  toast(tk ? t('حُفظ مفتاحُ التشغيل') : t('مُسح المفتاح'));
}

function provWipe(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var n = 0;
  provList().forEach(function(r){
    if (r.status === 'done' && r.pass){
      var v = Object.assign({}, STATE.provision[r.key], { pass:'' });
      STATE.provision[r.key] = v; CORE.set('provision', r.key, v); n++;
    }
  });
  logEvent('مسحُ كلمات المرور من الطلبات — ' + nm(n));
  toast(nm(n) + ' ' + t('كلمةً مُسحت — الورقةُ المصدَّرةُ هي النسخةُ الوحيدة'));
  render(1);
}
/* المنتهيةُ (تمّ/خطأ) تُمسَح بضغطة — تاريخُ الإنشاء في سجل الأحداث لا هنا */
function provClear(){
  if (!may('users')){ toast(t('مسحُ الطلبات للمهندس فما فوق')); return; }
  var n = 0;
  provList().forEach(function(r){
    /* المنتهيةُ وحدَها — وطلبُ حذفِ الدخول يبقى حتى ينفّذه الخادم (status: done) */
    if (r.status === 'done' || r.status === 'error'){
      delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    }
  });
  logEvent('مسحُ طلبات الإنشاء المنتهية — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا مُسح'));
  render(1);
}

   
function provSync(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return Promise.resolve(false); }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return Promise.resolve(false); }
  toast(t('يُجلَب من القاعدة…'));
  return DB.col('provision').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    var cloud = {}; sn.forEach(function(d){ cloud[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    var local = STATE.provision || {}, dropped = 0;
    Object.keys(local).forEach(function(k){ if (!cloud[k]) dropped++; });
    STATE.provision = cloud;
    /* والحساباتُ كما في القاعدة: صفٌّ لحسابٍ حُذف بقي في الجهاز يزول، ودورٌ تغيّر يصل */
    return DB.col('users').limit(500).get().then(function(us){
      FB.readCount = (FB.readCount || 0) + us.size;
      var U = STATE.users || {}, keepTemp = {};
      Object.keys(U).forEach(function(k){ if (U[k] && U[k].provisioning && !uidLike(k)) keepTemp[k] = U[k]; });
      var fresh = {}; us.forEach(function(d){ fresh[d.id] = d.data(); });
      FB.readCount = (FB.readCount || 0) + us.size;
      STATE.users = Object.assign(fresh, keepTemp);
      return { sn:sn, cloud:cloud, dropped:dropped };
    });
  }).then(function(r){
    var sn = r.sn, cloud = r.cloud, dropped = r.dropped;
    /* صفٌّ مؤقتٌ في الحسابات بلا طلبٍ منتظرٍ في القاعدة: ميتٌ — يُزال */
    var U = STATE.users || {}, gone = 0;
    Object.keys(U).forEach(function(k){
      var u = U[k]; if (!u || !u.provisioning || uidLike(k)) return;
      var pr = cloud[k] || cloud[u.user || ''];
      if (!pr || pr.status !== 'pending'){ delete U[k]; gone++; }
    });
    CORE.saveSoon(); statBump(); render(1);
    toast(nm(sn.size) + ' ' + t('طلبًا من القاعدة') + ' \u00b7 ' + nm(dropped) + ' ' + t('محليًّا لم يكن هناك') + ' \u00b7 ' + nm(gone) + ' ' + t('صفًّا مؤقتًا أُزيل'));
    logEvent('جلبُ الطلبات من القاعدة — ' + nm(sn.size) + ' · أُسقط ' + nm(dropped) + ' · أُزيل ' + nm(gone));
    return true;
  }).catch(function(e){ softErr('جلب الطلبات', e, 'تعذّر الجلبُ من القاعدة'); return false; });
}
function provCancelAll(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return; }
  var n = 0, U = STATE.users || {};
  provList().forEach(function(r){
    if (r.status !== 'pending') return;
    delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    var un = String(r.user || r.key || '');
    if (un && U[un] && U[un].provisioning) delete U[un];
  });
  /* وما في الطابور من طلباتٍ لم تُرفَع يُسقَط معها — وإلا رُفعت بعد الإلغاء */
  if (STATE.queue) STATE.queue = STATE.queue.filter(function(q){ return !(q && q.kind === 'provision' && q.v && q.v.status === 'pending'); });
  PROV_CANCEL = 0; CORE.saveSoon(); statBump();
  logEvent('إلغاءُ الطلبات المعلّقة — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا أُلغي'));
  render(1);
}
/* من الصفِّ المؤقت: يُعاد الطلبُ بكلمةٍ جديدةٍ — لمن ضاع طلبُه بين الجهاز والقاعدة */
function provReask(uid){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا صفَّ مؤقتًا')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, pass:pass, role:u.role || 'tech', roleExplicit:true, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  ['job','sup','dept','email','crew'].forEach(function(k){ if (u[k]) req[k] = u[k]; });
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادةُ طلب إنشاء — ' + (u.name || u.user) + ' (' + u.user + ')');
  /* مباشرةً إلى القاعدة ثم الخادم — كما في «كلمة جديدة»؛ وكان يمرُّ بالطابور
     فيقف على شبكةٍ بطيئة ولا يعلم أحدٌ أين وقف */
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}

   /* { forced:true } عند الدخول الأوّل — أو {} من القائمة */

