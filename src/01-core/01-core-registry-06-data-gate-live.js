/* ============================================================================
   FILE    : src/01-core/01-core-registry-06-data-gate-live.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : DB gate (the only path to Firestore), silent-failure capture, live listeners that mirror other devices' writes, sync counters and pull accounting.
   DEFINES : arCmp, dayKey, rollupToday, statsHistory, liveSmallStop, liveSmall, liveTickStop, pulseBadge, syncCdSecs, syncCdTxt, syncCycle, liveTick, logEventQuiet
   GLOBALS : EXP, DB, ROLL_LAST, LIVE_SMALL, LIVE_WORK_PAGES, BADGE_TICK, SYNC, SOFT_ERRS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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
  setTimeout(regEnsure, 6000);   /* (V37.83) السجلُّ المنشورُ يُخزَّن على الجهاز بعد الدخول */
  setTimeout(function(){ try { if (typeof extBridgePendingApply === 'function') extBridgePendingApply(); } catch (eB){ LS_ERR = eB; } }, 2500);   /* (V37.94) */
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
    /* (V38.60) the field chat is live: every message of the last week arrives as it is written */
    watch('msgs', function(id, v){ STATE.msgs = STATE.msgs || {}; if (v){ var fresh = !STATE.msgs[id]; STATE.msgs[id] = v; if (fresh && typeof chIncoming === 'function') chIncoming(v); } }, 400, ['_at', '>', Date.now() - 7 * 86400000]);
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
