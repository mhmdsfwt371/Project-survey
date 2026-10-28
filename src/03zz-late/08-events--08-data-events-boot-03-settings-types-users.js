/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-03-settings-types-users.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-03-settings-types-users.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : typeAdd, siteSetType, selSetType, selRename, typeMoveDel, mxDeclare, mxUndeclare, usrDel, usrSet, usrMerge, genPass, provKick, pwFlowStart, pwFlowSet, pwFlowWatch, usrRename, usrPwReset, pendDel, pendRetry, provLocal, usrAdd
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function typeAdd(){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var k = g('tyK'), l = g('tyL');
  if (!k){ toast(t('اكتب اسم النوع')); return; }
  if (typesList()[k]){ toast(t('النوعُ موجودٌ بالفعل')); return; }
  typesList()[k] = { l:l || k, i:g('tyI') || '\u25CF', c:g('tyC') || '#8A939D', s:g('tyS') || 'circle' };
  if (STATE.typesGone) delete STATE.typesGone[k];   /* نوعٌ حُذف ثم أُعيد: يُرفَع شاهدُه */
  typesSave();
  logEvent('نوع نقطة جديد — ' + k);
  toast(t('أُضيف النوع'));
  render(1);
}

/* ═══ نقلُ النقاط إلى تصنيف (V23.0) ═══
   «خليني أعرف أضيف تصنيف وأمسح وأعمل assign للنقاط في التصنيف ده»: الإضافةُ والحذفُ كانا في
   «التخطيط ← نقاط المراحل» وحدَها، ولا سبيلَ لنقل نقطةٍ من تصنيفٍ إلى آخر إلا بقرارٍ في المستودع،
   والتصنيفُ الذي عليه نقاطٌ لا يُحذَف أبدًا. صار: النقاطُ المحدَّدةُ على الخريطة تُنقَل إلى أيِّ تصنيفٍ
   من لوح الإسناد نفسِه، والتصنيفُ المستعمَلُ يُحذَف بعد نقل نقاطه إلى غيره — والبطاقةُ في «المواقع».
   النقلُ تجاوزٌ في وثيقة النقطة (sites/{id}) كتعديل البيانات: يُزامَن ويُسجَّل، والزياراتُ لا تُمَسّ. */
function siteSetType(id, to){
  var x = siteFind(id); if (!x || x.type === to) return false;
  x.type = to; siteOvSet(id, { type:to });
  return true;
}

function selSetType(to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || !typesList()[to]){ toast(t('اختر التصنيف')); return 0; }
  var n = 0;
  selIds().forEach(function(id){ if (siteSetType(id, to)) n++; });
  if (n){ logEvent('نقلُ ' + n + ' نقطةٍ إلى التصنيف «' + to + '»'); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة نُقلت إلى التصنيف') + ' «' + t((typesList()[to] || {}).l || to) + '»');
  return n;
}

/* (V23.1) «عاوز أعدّل الحاجات المرفوعة — مسميات وخلافه»: نقاطُ الميدان تصل بأسماءٍ عامة («عرفات - مربع
   - شاخص»، «كاميرا - منى - N001»). النقطةُ الواحدةُ تُعدَّل من «تعديل البيانات»، والمحدَّدُ دفعةً باسمٍ
   ورقمٍ متتابع — بالتجاوز نفسِه، فيبقى بعد الإقلاع للنقاط المسجَّلة والمرفوعة معًا. */
function selRename(pfx, from){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return 0; }
  pfx = String(pfx || '').trim(); from = Math.max(1, Math.round(cfgN(from) || 1));
  if (!pfx){ toast(t('اكتب بدايةَ الاسم')); return 0; }
  var ids = selIds().slice().sort(), n = 0, who = STATE.meta.name || '';
  ids.forEach(function(id, i){ var x = siteFind(id); if (!x) return; var nmv = pfx + ' ' + nm(from + i);
    if (x.name === nmv) return; x.name = nmv; siteOvSet(id, { name:nmv, edBy:who, edAt:Date.now() }); n++; });
  if (n){ logEvent('تسميةُ ' + n + ' نقطةٍ دفعةً — «' + pfx + '» من ' + from); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة سُمّيت'));
  return n;
}

function typeMoveDel(k, to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || to === k || !typesList()[to]){ toast(t('اختر تصنيفًا تنتقل إليه نقاطُه')); return 0; }
  var n = 0;
  (STATE.sites || []).slice().forEach(function(x){ if (x.type === k && siteSetType(x.id, to)) n++; });
  logEvent('نقلُ نقاط التصنيف «' + k + '» (' + n + ') إلى «' + to + '» ثم حذفُه');
  SITE_IX = null; SITE_TOK = null; statBump();
  typeDel(k);
  return n;
}

/* تُعلَن تركيبةُ مشعرٍ ونوعٍ قبل أن يقع فيها موقع: من أراد أن يهيّئ وزنَ
   «كاميرات الوزارة» في عرفات قبل تسجيل أوّل موقعٍ منها لم يجد صفًّا يكتب
   فيه — فالصفُّ كان يُشتَقُّ من المواقع وحدَها. وتُحذَف الإعلانُ إن جاء
   موقعٌ حقيقيٌّ فحلَّ محلَّه، أو بيدٍ ما دام لا موقعَ عليه. */
function mxDeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  zone = String(zone || '').trim();
  if (!zone || !label){ toast(t('اختر مشعرًا ونوعًا')); return; }
  var key = zone + '|' + label;
  var E = mxExtra();
  if (E.indexOf(key) > -1){ toast(t('هذه التركيبةُ مسجَّلةٌ من قبل')); return; }
  var real = mxRows().some(function(r){ return r[0] === zone && r[1] === label; });
  if (real){ toast(t('هذه التركيبةُ موجودةٌ بمواقعَ فعلًا')); return; }
  E.push(key);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إعلان تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُعلنت التركيبة — اضبط وزنَها أدناه'));
  render(1);
}

function mxUndeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  var n = mxRowInfo(zone, label);
  if (n){ toast(t('عليها مواقعُ بالفعل — لا تُحذَف')); return; }
  var E = mxExtra(), key = zone + '|' + label, i = E.indexOf(key);
  if (i < 0) return;
  E.splice(i, 1);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إلغاء تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُلغيت التركيبة'));
  render(1);
}

/* ═══ حذفُ الحساب ═══
   كان التعطيلُ وحدَه — فتبقى الحساباتُ المكرَّرةُ والخاطئةُ في القائمة إلى
   الأبد. صار الحذفُ للمهندس ومدير المشروع فما فوق: يُمحى من القاعدة فورًا
   ويختفي من كلِّ جهاز، ويُكتَب للخادم طلبُ حذفِ حسابِ الدخول فلا يدخل
   صاحبُه بعدها. ولا يحذف أحدٌ نفسَه، ولا من هو أعلى منه رتبة. */
function usrDel(uid){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الحسابات للمهندس ومدير المشروع')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u){ toast(t('لا حسابَ بهذا المعرِّف')); return false; }
  if (uid === myUid()){ toast(t('لا تحذف حسابَك')); return false; }
  if (rankOf(roleOfUser(u)) > rankOf(ROLE)){ toast(t('لا تحذف من هو أعلى منك رتبة')); return false; }
  var nm2 = u.name || u.user || uid;
  if (typeof confirm === 'function' && !confirm(t('حذفُ الحساب') + ' ' + nm2 + '\n' + t('يُمحى من القاعدة ولا يدخل صاحبُه بعدها. لا رجوع.'))){
    toast(t('أُلغي الحذف')); return false;
  }
  delete STATE.users[uid];
  CORE.rm('users', uid);
  /* حسابُ الدخول يُحذَف من الخادم — المتصفّحُ لا يملك ذلك */
  if (u.user || /^[A-Za-z0-9]{20,}$/.test(uid)){
    var key = 'del-' + uid;
    STATE.provision = STATE.provision || {};
    STATE.provision[key] = { action:'delete', uid:uid, user:u.user || '', name:nm2, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
    CORE.set('provision', key, STATE.provision[key]);
    provKick(true);
  }
  if (u.user && (STATE.pending || {})[u.user]){ delete STATE.pending[u.user]; CORE.rm('pending', u.user); }
  /* طلبُ إنشائه يُمحى معه: كان يبقى «تمّ» في القائمة بعد حذف صاحبه — ثمانيةُ
     أسطرٍ لحساباتٍ لم تعد موجودة، ومنها ما يحمل كلمةَ مرورٍ. المطابقةُ باسم
     المستخدم بلا حساسيةٍ لحالة الحروف (M.shaaraqi = m.shaaraqi). */
  var uname = String(u.user || '').toLowerCase();
  Object.keys(STATE.provision || {}).forEach(function(k){
    var pr = STATE.provision[k] || {};
    if (pr.action === 'delete') return;
    if (uname && (k.toLowerCase() === uname || String(pr.user || '').toLowerCase() === uname)){
      delete STATE.provision[k]; CORE.rm('provision', k);
    }
  });
  logEvent('حذف حساب — ' + nm2 + ' (' + (u.user || uid) + ')');
  toast(t('حُذف') + ' ' + nm2);
  statBump(); render(1);
  return true;
}

/* ═══ الحسابُ المكرَّر ═══
   كان تعديلُ الصفِّ المؤقت (باسم المستخدم ريثما يُنشئه الخادم) يكتب وثيقةً
   في القاعدة باسم المستخدم — فيصير للشخص وثيقتان: users/k.bandar بالدور
   المعدَّل، وusers/{uid} التي كتبها الخادم. فيظهر مرتين في كلِّ جهاز.
   صار تعديلُ المؤقت يذهب إلى طلبِ الإنشاء نفسِه فيطبّقه الخادمُ عند الإنشاء،
   والقديمُ المكرَّرُ يُدمَج بضغطة: تبقى وثيقةُ المعرِّف وتُمحى الباقية. */
function usrSet(uid, patch){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
  var U = STATE.users || (STATE.users = {});
  var u = Object.assign({}, U[uid] || {}, patch);
  U[uid] = u;
  if (u.provisioning && !uidLike(uid)){
    var pr = (STATE.provision || {})[uid];
    if (pr && pr.status === 'pending'){
      var pv = Object.assign({}, pr, patch, { roleExplicit:true });
      STATE.provision[uid] = pv; CORE.set('provision', uid, pv);
      provKick(true);
      logEvent('تعديل طلب حساب — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
      toast(t('حُفظ في طلب الإنشاء — يطبّقه الخادمُ عند الإنشاء'));
    } else toast(t('الحسابُ يُنشَأ — عدّله بعد أن يُنشئه الخادم'));
    render(1); return;
  }
  CORE.set('users', uid, u);
  logEvent('تعديل مستخدم — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
  toast(t('حُفظ'));
  render(1);
}

function usrMerge(un){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return false; }
  var keys = usrDupes()[String(un || '').toLowerCase()] || [];
  if (keys.length < 2){ toast(t('لا مكرَّرَ لهذا الاسم')); return false; }
  var U = STATE.users;
  /* يبقى حسابُ الدخول: المعرِّفُ الحقيقيُّ أوّلًا، وإلا الأحدث */
  var keep = keys.filter(uidLike).sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0]
          || keys.sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0];
  var merged = Object.assign({}, U[keep]);
  keys.forEach(function(k){
    if (k === keep) return;
    ['job','sup','dept','ph','email','crew','jobLog'].forEach(function(f){ if (merged[f] == null && U[k][f] != null) merged[f] = U[k][f]; });
  });
  delete merged.provisioning;
  U[keep] = merged; CORE.set('users', keep, merged);
  keys.forEach(function(k){ if (k !== keep){ delete U[k]; CORE.rm('users', k); } });
  logEvent('دمج حساب مكرَّر — ' + (merged.name || un) + ' · ' + t('بقي') + ' ' + keep + ' · ' + t('مُحي') + ' ' + nm(keys.length - 1));
  toast(t('دُمج') + ' — ' + t('بقي حسابُ الدخول ومُحي المكرَّر'));
  statBump(); render(1);
  return true;
}

/* كلمةُ مرورٍ جديدة: عشرةُ أحرفٍ بلا ما يلتبس (0/O، 1/l) */
function genPass(){
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', o = '';
  for (var i = 0; i < 10; i++) o += A[Math.floor(Math.random() * A.length)];
  return o;
}

function provKick(quiet){
  if (!may('provision') || !FB.ready) return;
  /* بلا مفتاح تشغيلٍ على هذا الجهاز (مفتاحُ السيور للإدارة وحدها — V17.93): الطلبُ
     مكتوبٌ في القاعدة والخادمُ المجدولُ يتولّاه خلال دقائق — يُقال ذلك لا يُسكَت */
  if (!ghToken()){ if (!quiet) toast(t('كُتب الطلب — يُنشئ الخادمُ الحسابَ خلال دقائق')); return; }
  if (quiet) PV.PROV_QUIET = true;
  clearTimeout(PV.PROV_KICK);
  PV.PROV_KICK = setTimeout(function(){
    var gap = Date.now() - PV.PROV_LAST;
    if (gap < 20000){ PV.PROV_KICK = setTimeout(function(){ provKick(PV.PROV_QUIET); }, 20000 - gap); return; }
    PV.PROV_LAST = Date.now();
    var q = PV.PROV_QUIET; PV.PROV_QUIET = false;
    ghRunNow(true).then(function(ok){
      if (!ok) return;
      if (!q) toast(t('أُرسل إلى الخادم — يُنفَّذ خلال دقيقة'));
      if (PV.PW_FLOW && PV.PW_FLOW.st !== 'done') pwFlowSet('wait');
      if (PV.PW_FLOW && typeof pwFlowWatch === 'function') pwFlowWatch();
    });
  }, 2000);
}

function pwFlowStart(u, pass){
  PV.PW_FLOW = { user:u.user, name:u.name || u.user, pass:pass, st:'writing', at:Date.now(), why:'' };
  clearInterval(PV.PW_POLL); PV.PW_POLL = 0;
  render(1);
}

function pwFlowSet(st, why){ if (!PV.PW_FLOW) return; PV.PW_FLOW.st = st; PV.PW_FLOW.why = why || ''; render(1); }

function pwFlowWatch(){
  clearInterval(PV.PW_POLL);
  var tries = 0;
  PV.PW_POLL = setInterval(function(){
    if (!PV.PW_FLOW || !FB.ready || !FB.db){ clearInterval(PV.PW_POLL); PV.PW_POLL = 0; return; }
    tries++;
    DB.col('provision').doc(PV.PW_FLOW.user).get().then(function(d){
      FB.readCount = (FB.readCount || 0) + d.size;
      var v = d && d.exists ? (d.data() || {}) : {};
      if (v.status === 'done'){ clearInterval(PV.PW_POLL); PV.PW_POLL = 0; STATE.provision[PV.PW_FLOW.user] = v; pwFlowSet('done'); logEvent('كلمةٌ جديدةٌ ضُبطت — ' + PV.PW_FLOW.user); }
      else if (v.status === 'error'){ clearInterval(PV.PW_POLL); PV.PW_POLL = 0; pwFlowSet('error', v.why || ''); }
      else if (tries > 36){ clearInterval(PV.PW_POLL); PV.PW_POLL = 0; pwFlowSet('slow'); }
    }).catch(function(e){ LS_ERR = e; });
  }, 5000);
}

/* ═══ تبديلُ اسم الدخول ═══
   حقلُ «اسم المستخدم» في الشاشة كان يُعرَض ولا يُحفَظ: الاسمُ هويةٌ في
   المصادقة لا حقلٌ في الوثيقة، فتعديلُه بيدٍ يغيّر ما يُقرَأ ولا يغيّر ما
   يُدخَل به — يبقى القديمُ عاملًا ويظنُّ المكتبُ أنه بدّله. صار طلبًا للخادم
   كطلب الكلمة: يبدّل بريدَ المصادقة وحقلَ الوثيقة معًا، والمعرِّفُ لا يتغيّر
   فيبقى كلُّ ما كتبه صاحبُه منسوبًا إليه. */
function usrRename(uid, to){
  if (!canProvision()){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا حسابَ لتبديله')); return false; }
  to = String(to || '').trim().toLowerCase();
  if (!/^[A-Za-z0-9._-]{3,}$/.test(to)){ toast(t('اسمُ الدخول: حروفٌ لاتينيةٌ وأرقامٌ ونقطةٌ — ثلاثةٌ فأكثر')); return false; }
  if (to === String(u.user).toLowerCase()){ toast(t('الاسمُ نفسُه')); return false; }
  var taken = Object.keys(STATE.users || {}).some(function(k){ return k !== uid && String((STATE.users[k] || {}).user || '').toLowerCase() === to; });
  if (taken){ toast(t('الاسمُ مستعملٌ لحسابٍ آخر')); return false; }
  /* الفحصُ المستعمَلُ يسبق فحصَ الصيغة في القراءة لا في التنفيذ — والترتيبُ
     هنا: صيغةٌ ثم تكرارٌ ثم تطابق. أُعيد ترتيبُه ليقول السببَ الصحيح. */
  var req = { user:u.user, newUser:to, action:'rename', uid:uid, name:u.name || '', role:u.role || 'tech',
              roleExplicit:false, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {}; STATE.provision[u.user] = req;
  logEvent('طلبُ تبديلِ اسم الدخول — ' + u.user + ' \u2190 ' + to);
  pwFlowStart({ user:u.user + ' \u2190 ' + to, name:u.name || '' }, '');
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey'); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}

function usrPwReset(uid){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u || !u.user){ toast(t('لا اسمَ مستخدمٍ لهذا الحساب')); return false; }
  if (!canMakeRole(roleOfUser(u) || u.role || 'tech')){ toast(t('لا تُعيد كلمةَ من هو أعلى منك رتبة')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, role:u.role || 'tech', roleExplicit:false, pass:pass, reissue:true,
              status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادة إصدار كلمة مرور — ' + (u.name || u.user) + ' (' + u.user + ')');
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); statBump(); return pass; }
  /* مباشرةً إلى القاعدة — لا طابورَ يقف على شبكةٍ بطيئة، والرفضُ يُرى بسببه */
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  statBump();
  return pass;
}

function pendDel(user){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  if (STATE.pending) delete STATE.pending[user];
  CORE.rm('pending', user);
  var U = STATE.users || {};
  if (U[user] && U[user].pending) delete U[user];
  logEvent('حذفُ حسابٍ معلَّق — ' + user);
  toast(user + ' \u00b7 ' + t('حُذف'));
  statBump(); render(1);
  return true;
}

function pendRetry(user, pass){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return; }
  var v = (STATE.pending || {})[user];
  if (!v){ toast(t('لا حسابَ معلَّقٌ بهذا الاسم')); return; }
  if (!pass || String(pass).length < 10){ toast(t('اكتب كلمةَ مرورٍ عشرةَ أحرفٍ فأكثر')); return; }
  toast(t('يُنشَأ الحساب…'));
  FB.createUser(user, pass, { name:v.name, role:v.role, doc:Object.assign({}, v, { pending:undefined }) })
    .then(function(res){
      if (res && res.ok && res.uid){
        var nv = Object.assign({}, v); delete nv.pending;
        STATE.users[res.uid] = nv;
        delete STATE.users[user];
        delete STATE.pending[user];
        CORE.rm('pending', user);
        logEvent('تفعيل حساب معلَّق — ' + user);
        toast(user + ' \u00b7 ' + t('يدخل بكلمته الآن'));
        statBump(); render(1);
        return;
      }
      softErr('تفعيل حساب معلَّق', new Error(res && res.err || 'unknown'),
        'لم يُفعَّل — راجع الشبكةَ أو اسمَ المستخدم');
    });
}

/* ═══ (V30.7) إنشاءُ الحساب من هذا الجهاز الآن — لا ينتظر الخادم ═══
   بلاغُ المالك «مش عارف أضيف يوزر»: الطلبُ يُكتَب للخادم، والخادمُ سيرٌ في GitHub — فإن تعطّلت مشغّلاتُه
   (كما وقع: «لم يلتقطه مشغّل») أو رُفض مفتاحُ تشغيله بقي الحسابُ «يُنشَأ» ساعات. صار من يملك الإنشاءَ يُنشئه
   من جهازه فورًا بتطبيقٍ ثانٍ لا يمسّ جلسته (FB.createUser)، ثم يُعلَّم الطلبُ «تمّ» وتُمحى كلمتُه من القاعدة
   فلا يكرّره الخادمُ إن عاد. */
function provLocal(u){
  if (!may('users')){ toast(t('الإنشاءُ من الجهاز للمهندس فما فوق — الطلبُ محفوظٌ وينفّذه الخادم')); return; }
  var req = Object.assign({}, (STATE.provision || {})[u] || {});
  var tmp = (STATE.users || {})[u] || {};
  var pass = String(req.pass || '');
  if (pass.length < 10){
    pass = String(window.prompt(t('كلمةُ مرورٍ للحساب (عشرةُ أحرفٍ فأكثر):'), '') || '');
    if (pass.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  }
  var name = req.name || tmp.name || u, role = req.role || tmp.role || 'tech';
  if (!canMakeRole(role)){ toast(t('لا تُنشئ دورًا أعلى من دورك')); return; }
  toast(t('يُنشَأ الحسابُ من هذا الجهاز…'));
  return FB.createUser(u, pass, { name:name, role:role }).then(function(res){
    if (!res || !res.ok || !res.uid){
      var why = String(res && res.err || '');
      toast(/email-already-in-use/.test(why) ? t('الاسمُ موجودٌ في الدخول بالفعل — الحسابُ أُنشئ من قبل أو من الخادم') : (t('تعذّر الإنشاءُ من الجهاز') + ' \u2014 ' + why.slice(0, 60)));
      return false;
    }
    var docv = { name:name, user:u, role:role, active:true, at:Date.now(), by:STATE.meta.name || '', made:'device' };
    ['job','sup','dept','email'].forEach(function(f){ if (req[f] || tmp[f]) docv[f] = req[f] || tmp[f]; });
    if (docv.job) docv.jobLog = [{ job:docv.job, at:Date.now(), by:STATE.meta.name || '' }];
    STATE.users = STATE.users || {}; STATE.users[res.uid] = docv; delete STATE.users[u];
    CORE.set('users', res.uid, docv);
    var done = Object.assign({}, req, { status:'done', uid:res.uid, doneAt:Date.now(), doneBy:'device', pass:'' });
    STATE.provision = STATE.provision || {}; STATE.provision[u] = done; CORE.set('provision', u, done);
    logEvent('إنشاءُ حسابٍ من الجهاز — ' + name + ' (' + u + ')');
    toast(u + ' \u00b7 ' + t('أُنشئ الآن — يدخل بكلمته'));
    statBump(); render(1); return true;
  });
}

function usrAdd(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var u = g('uU'), n = g('uN'), p = g('uP'), r = g('uR') || 'tech';
  var jb = g('uJ'), sup = g('uS'), dp = g('uD');
  /* الوظيفةُ تُغني عن اختيار الدور: دورُ الحساب دورُ وظيفته إن اختيرت */
  if (jb && jobOf(jb)) r = jobOf(jb).role || r;
  if (!canMakeRole(r)){ toast(t('لا تُنشئ دورًا أعلى من دورك') + ' — ' + t((ROLES[r] || {}).n || r)); return; }
  if (!u){ toast(t('اكتب اسم المستخدم')); return; }
  if (!n){ toast(t('اكتب الاسم الكامل')); return; }
  if (p.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if ((STATE.users || {})[u] || usersList().some(function(p){ return p[1] && p[1].user === u; })){
    toast(t('اسمُ المستخدم موجودٌ بالفعل')); return;
  }
  /* يُسجَّل الحسابُ في مجموعته ويُرفَع — ولا يُنشَأ في Auth من المتصفّح:
     إنشاءُ حسابٍ هناك يُبدّل الجلسةَ الحاليةَ إلى الجديد، فيخرج المهندسُ من
     حسابه وهو يُنشئ حسابًا لغيره. */
  var made = { n:n, u:u, p:p, role:r, roleAr:(ROLES[r] ? ROLES[r].n : r),
               by:STATE.meta.name || '', at:Date.now() };
  CORE.set('accounts', u, made);
  STATE.users = STATE.users || {};
  /* الوثيقةُ باسم uid لا باسم المستخدم: القاعدةُ تقرأ users/{uid}، ووثيقةٌ
     باسم «m.safwat» لا يجدها أحد — فيُقرأ الدورُ من العدم ويُرفَض كلُّ شيء.
     وactive:true يُكتَب صراحةً. تُكتَب محليًّا باسم المستخدم ريثما يُعرَف uid،
     ثم تُنقَل إليه. */
  var docv = { name:n, user:u, role:r, active:true, at:Date.now() };
  if (jb){ docv.job = jb; docv.jobLog = [{ job:jb, at:Date.now(), by:STATE.meta.name || '' }]; }
  if (sup) docv.sup = sup;
  if (dp)  docv.dept = dp;
  /* ═══ الطلبُ إلى الخادم ═══
     المتصفّحُ لا يُنشئ حسابَ دخولٍ لغير صاحبه بثبات — يحتاج تطبيقًا ثانيًا
     يتعثّر بالشبكة والمتصفّح واسمٍ موجود، فبقيت حساباتٌ معلَّقةً في أجهزة.
     صار المكتبُ يكتب الطلبَ كاملًا — الاسمُ والمستخدمُ والكلمةُ والدورُ
     والوظيفةُ والقسمُ والبريد — والخادمُ يُنشئ حسابَ الدخول بمفتاح المشروع
     كلَّ عشر دقائق، ويُعلِّم الطلبَ «تمّ» فيراه المكتبُ ويُصدِر ورقةَ
     الدخول. ولا يُنشئ المتصفّحُ شيئًا بعد اليوم. */
  var em = (document.getElementById('uE') || {}).value || '';
  var req = { user:u, name:n, pass:p, role:r, status:'pending', at:Date.now(),
              by:STATE.meta.name || '' };
  if (jb)  req.job  = jb;
  if (sup) req.sup  = sup;
  if (dp)  req.dept = dp;
  if (em)  req.email = String(em).trim();
  STATE.provision = STATE.provision || {};
  STATE.provision[u] = req;
  CORE.set('provision', u, req);
  provKick();
  /* يظهر في القائمة فورًا معلَّمًا «يُنشَأ» — لا ينتظر المكتبُ ليتأكّد */
  /* الصفُّ المؤقتُ يحمل ما طُلب كلَّه — فيُرى القسمُ والمديرُ من لحظة الطلب */
  STATE.users[u] = { name:n, user:u, role:r, active:true, at:Date.now(), provisioning:true };
  if (jb)  STATE.users[u].job  = jb;
  if (sup) STATE.users[u].sup  = sup;
  if (dp)  STATE.users[u].dept = dp;
  if (em)  STATE.users[u].email = String(em).trim();
  USR.q = '';
  logEvent('طلب حساب — ' + n + ' (' + u + ') · ' + t(made.roleAr));
  toast(u + ' \u00b7 ' + t('طُلب من الخادم — يُنشَأ خلال دقائق'));
  ['uU','uN','uP','uE'].forEach(function(id){
    var e = document.getElementById(id); if (e) e.value = '';
  });
  statBump();
  render(1);
}
