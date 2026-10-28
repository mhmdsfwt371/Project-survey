/* ============================================================================
   FILE    : src/01-core/01-core-registry-05-sync-scale.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : CORE: the write queue, deduplication, upload with backoff and poison isolation, pending-upload limit and pending-file export/import, pull scheduling and scale-out to 150 concurrent devices.
   DEFINES : uid36
   GLOBALS : FB_PLAN, DEV_ID, _uidSeq, CORE, FB
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الاتساعُ إلى مئةٍ وخمسين جهازًا ═══
   معرّفٌ ثابتٌ لكلِّ جهاز: بلا معرّفٍ يشترك جهازان في معرّفٍ متسلسلٍ واحدٍ
   فيمحو أحدُهما الآخر، ولا يُعرَف أيُّهما كتب. */
/* خطةُ القاعدة — يقرؤها جردُ السعة: على Spark السقفُ يوقف الخدمة، وعلى Blaze
   يُحاسَب ما فوق الحصة نفسِها ولا يوقف. رُفعت إلى Blaze في ٧ سبتمبر ٢٠٢٦ بعد
   نفاد حصة يومٍ واحد. */
var FB_PLAN = 'blaze';
var DEV_ID = (function(){
  try {
    var k = 'nsk14.dev';
    var v = localStorage.getItem(k);
    if (!v){
      v = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(k, v);
    }
    return v;
  } catch(e){ return 'd' + Math.random().toString(36).slice(2, 10); }
})();
PV._uidSeq = 0;
function uid36(){ return DEV_ID + '-' + Date.now().toString(36) + '-' + (++PV._uidSeq).toString(36); }

var CORE = {
  get:  function(kind, id){ var b = STATE[kind]; return b ? b[id] : undefined; },
  all:  function(kind){ return STATE[kind]; },
  set:  function(kind, id, v){
    if (typeof PV === 'object' && PV.VIEW_AS){ if (typeof toast === 'function') toast(t('وضعُ العرض — لا شيءَ يُحفَظ')); return v; }   /* (V39.92) view-as is read-only */
    if (!STATE[kind]) STATE[kind] = {};
    STATE[kind][id] = v; DB.memoReset();   /* (V31.6) */
    /* كلُّ كتابةٍ محليةٍ للمهامِّ تُبطِل فهرسَها — الفهرسُ سريعٌ لأنه مبنيٌّ
       مرةً، فلا يصحُّ أن يُقرأ قديمًا بعد إسنادٍ أو إنجاز (V17.47) */
    if (kind === 'tasks' && typeof TK_IX !== 'undefined') TK_IX = null;
    CORE.dirty(kind, id, v);
    return v;
  },
  /* ═══ الحذفُ شاهدُ قبرٍ لا محوٌ ═══
     المحوُ لا يصل الأجهزةَ الأخرى: السحبُ الفارقيُّ يجلب ما كُتب بعد آخر
     مزامنةٍ — والممحوُّ لم يُكتَب. فمُسح خمسةَ عشرَ إسنادًا من مكتبٍ وبقيت
     على هاتفَي مهندسٍ وفنيّ. صار الحذفُ كتابةَ شاهدٍ صغيرٍ {deleted:true}
     يصل كأيِّ تحديث، وكلُّ جهازٍ يمحو ما عليه شاهد. (الحساباتُ تُمحى محوًا —
     لها قاعدتُها وطلبُ خادمٍ.) */
  TOMB: { tasks:1, recs:1, inss:1, diss:1, maints:1, ncr:1, issues:1, moves:1, buys:1 },
  rm:   function(kind, id){
    delete STATE[kind][id];
    if (CORE.TOMB[kind]) CORE.dirty(kind, id, { id:String(id), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
    else CORE.dirty(kind, id, null);
  },
  /* ما عليه شاهدٌ يُمحى محليًّا بدل أن يُخزَّن */
  applyDoc: function(kind, id, v){
    if (!STATE[kind]) STATE[kind] = {};
    /* فهرسُ المهامِّ يُبطَل عند وصول أيِّ مهمةٍ من المزامنة — وإلا قرأ الفهرسُ
       القديمُ حالةً قديمةً: نقطةٌ أُسندت في جهازٍ آخرَ تبقى «لم تُزر» هنا
       حتى يُبطِله شيءٌ آخر. وكذلك أيُّ كتابةٍ مباشرةٍ على STATE.tasks. */
    if (kind === 'tasks' && typeof TK_IX !== 'undefined') TK_IX = null;
    if (kind === 'newsites' && typeof propIs === 'function' && (propIs(v) || (v && v.rejected))) propKeep(v);   /* (V37.69) الحيُّ يُحدّث المقترحات */ if (v && v.deleted){ delete STATE[kind][id]; if (kind === 'newsites' && typeof siteDropLocal === 'function') siteDropLocal(id); return false; }   /* (V25.5) شاهدُ نقطةٍ مضافةٍ يرفعها من السجل */
    /* ═══ التعديلُ المتزامن يُقال ولا يُبتلَع (V17.79) ═══
       كان تعديلُ جهازين على السجلِّ نفسِه يمرُّ صامتًا: آخرُ من رفع كسب، ولا
       يعرف الأوّلُ أن ما كتبه ذهب. فإن وصلت وثيقةٌ كتبها غيري وفي طابوري
       تعديلٌ لها لم يُرفَع بعد — يُسجَّل التصادمُ ويُنبَّه صاحبُ الجهاز،
       ويبقى ما في الطابور يُرفَع كما هو: القرارُ له لا للجهاز. */
    try { if (typeof clashNote === 'function') clashNote(kind, id, STATE[kind][id], v); }
    catch (e2){ if (typeof softErr === 'function') softErr('تصادم', e2, ''); }
    /* الإشعارُ لصاحب الشأن يُولَد هنا — حيث تصل الوثيقةُ لا حيث كُتبت */
    try { if (typeof notifOnArrival === 'function') notifOnArrival(kind, id, STATE[kind][id], v); }
    catch (e){ if (typeof softErr === 'function') softErr('إشعار الوصول', e, ''); }
    STATE[kind][id] = v; return true;
  },
  push: function(kind, v){ STATE[kind].push(v); CORE.dirty(kind, v.id || String(STATE[kind].length-1), v); return v; },
  total:function(){ return STATE.sites.length; },

  /* كل تغييرٍ يدخل الطابور. والحفظُ مؤجَّلٌ: خمسون كتابةً حفظٌ واحدٌ بعد سكون،
     فلا يُثقَل القرصُ بخمسين كتابةً كاملةً للحالة. والطابور محدودٌ بألفين
     فلا يملأ الذاكرةَ انقطاعٌ طويل — وأقدمُه يُسقَط أولًا مع تحذير. */
  dirty: function(kind, id, v){
    /* معرِّفٌ فارغٌ أو فيه «/» ينفجر عند بناء المرجع فيُسقِط الدفعةَ كلَّها —
       يُرفَض هنا ويُقال، ولا يدخل الطابور */
    if (!CORE.validId(id)){
      if (typeof softErr === 'function') softErr('طابور — ' + kind, 'معرِّفٌ فارغٌ أو غيرُ صالح: «' + String(id) + '»', 'وثيقةٌ بلا معرِّفٍ لم تدخل الطابور — ' + kind);
      return;
    }
    if (typeof statBump === 'function') statBump();
    /* المفتاحُ الواحدُ لا يدخل الطابورَ مرتين: الإعدادُ يُكتَب مرارًا وهو
       يُقرَأ — فيتضخّم الطابورُ بكتاباتٍ لقيمةٍ واحدة، ويُرفَع القديمُ ثم
       الجديدُ بلا فائدة. تُطوى: آخرُ كتابةٍ هي الصحيحة. */
    for (var qi = STATE.queue.length - 1; qi >= 0; qi--){
      if (STATE.queue[qi].kind === kind && STATE.queue[qi].id === id){
        STATE.queue.splice(qi, 1);
        break;
      }
    }
    STATE.queue.push({ kind:kind, id:id, v:v, at:Date.now() });
    /* صفحةُ المزامنة تُحدَّث لحظةً بلحظة — بمهلةٍ قصيرة تجمع دفعةً واحدة */
    if (CUR === 'sys' && typeof render === 'function'){ clearTimeout(CORE._dr); CORE._dr = setTimeout(function(){ if (CUR === 'sys') render(1); }, 200); }
    /* لا يُسقَط شيء: أقدمُ ما في الطابور أوّلُ ما لم يُرفَع — أي أقدمُ عملٍ
       ميدانيٍّ لم يصل. كان يُقتطَع صامتًا فيضيع يومُ فنيٍّ ولا يعلم.
       فيُبقى كلُّه، ويُصاح إن طال، ويُمنَع النموُّ بلا حدٍّ بإيقاف قبولِ
       الجديد لا بمحو القديم. */
    if (STATE.queue.length > QUEUE_CAP){
      STATE.meta.backlog = STATE.queue.length;
      if (!STATE.meta.warned || Date.now() - STATE.meta.warned > 60000){
        STATE.meta.warned = Date.now();
        if (typeof toast === 'function')
          toast(t('الطابور متضخّم') + ': ' + nm(STATE.queue.length) + ' — ' + t('اتصل بالشبكة ليُرفَع'));
      }
    }
    CORE.saveSoon();
    CORE.flush();
  },

  /* حفظٌ مؤجَّل — يُجمَّع ما تتابع من كتابات */
  validId: function(id){
    var sId = (id === undefined || id === null) ? '' : String(id);
    return !!sId && sId.indexOf('/') < 0 && sId !== '.' && sId !== '..';
  },
  saveSoon: function(){
    if (PV._saveT) return;
    PV._saveT = setTimeout(function(){ PV._saveT = 0; CORE.saveLocal(); }, 400);
  },

  /* ═══ احتياطيُّ الطابور في localStorage (V21.0) ═══
     بلاغٌ من الميدان: «سجّلت النقطةَ ثلاثَ مراتٍ ولم تُسجَّل». المتصفّحُ غيرُ المثبَّت حين
     يقطع آيفونُ اتصالَه بالمخزن أو يعيد تحميلَ الصفحة يُسقِط ما في الذاكرة — والزيارةُ
     التي لم تُرفَع بعد (بلا شبكةٍ في الميدان) تضيع. localStorage يبقى حيث يسقط المخزن:
     يُكتَب فيه الطابورُ (بلا صور) مع كلِّ حفظ، ويُستعاد عند الإقلاع إن لم يكن في المخزن،
     ويُمحى حين يُرفَع كلُّ شيء. */
  qbakSave: function(){
    try {
      var q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'photos' && CORE.validId(it.id); }).slice(-150).map(function(it){
        var v = it.v;
        if (v && typeof v === 'object'){ var c = {}; Object.keys(v).forEach(function(k){ var val = v[k]; if (typeof val === 'string' && val.length > 4000) return; c[k] = val; }); v = c; }
        return { kind:it.kind, id:it.id, v:v, at:it.at || 0 };
      });
      lsSet('nsk14.qbak', q.length ? JSON.stringify(q) : '');
    } catch (e){ LS_ERR = e; }
  },
  qbakRestore: function(){
    try {
      try { var st0 = lsGet('nsk14.stale'); if (st0 && !(STATE.stale || []).length) STATE.stale = JSON.parse(st0) || []; } catch (e0){ LS_ERR = e0; }   /* (V38.30) ركنُ المتجاهَل يعود مع الجهاز */
      var raw = lsGet('nsk14.qbak'); if (!raw) return 0;
      var q = JSON.parse(raw); if (!Array.isArray(q) || !q.length) return 0;
      var have = {}; (STATE.queue || []).forEach(function(it){ if (it) have[it.kind + '/' + it.id] = 1; });
      var n = 0;
      q.forEach(function(it){
        if (!it || !it.kind || !CORE.validId(it.id) || have[it.kind + '/' + it.id]) return;
        var col = STATE[it.kind];
        if (col && typeof col === 'object' && !Array.isArray(col) && it.v && typeof it.v === 'object' && !col[it.id]) col[it.id] = it.v;   /* يعود إلى مكانه إن لم يكن */
        STATE.queue.push({ kind:it.kind, id:it.id, v:it.v, at:it.at || Date.now() }); n++;
      });
      if (n && typeof logEventQuiet === 'function') logEventQuiet('استُعيد ' + n + ' من احتياطيِّ الطابور بعد فقد المخزن', '');
      return n;
    } catch (e){ LS_ERR = e; return 0; }
  },
  saveLocal: function(){
    CORE.qbakSave();
    if (PV.PH_DIRTY){ PV.PH_DIRTY = false; var PHS = {}; Object.keys(STATE.photos || {}).forEach(function(k){ PHS[k] = photoSlim(STATE.photos[k]); }); idbSet('photos', PHS); }   /* (V37.18) */
    return idbSet('state', {
      recs:STATE.recs, inss:STATE.inss, tasks:STATE.tasks,
      moves:STATE.moves, buys:STATE.buys, cfg:CFG, queue:STATE.queue,
      poison:STATE.poison || [],
      /* ما بُني حديثًا كان يضيع مع إعادة التحميل: الفكُّ والصيانةُ وسجلُّ
         ما تمّ — تُحفَظ كما تُحفَظ الزياراتُ والتركيبات. */
      diss:STATE.diss || {}, maints:STATE.maints || {}, steps:STATE.steps || [], msgs:STATE.msgs || {},   /* (V38.60) the field chat */
      pending:STATE.pending || {}, provision:STATE.provision || {},   /* (V37.18) الصورُ في مفتاحها photos — لا تُنسَخ مع كلِّ حفظ */
      att:STATE.att || {},
      siteOv:STATE.siteOv || {},
      pullAt:STATE.meta.pullAt || {},
      notifAt:STATE.meta.notifAt || 0,
      epoch:STATE.meta.epoch || 0,
      wbs:STATE.wbs || null,
      wtask:STATE.wtask || null,
      trials:STATE.trials || null,
      bugs:STATE.bugs || null
    });
  },

  loadLocal: function(){
    return idbGet('state').then(function(v){
      if (!v){ CORE.qbakRestore(); return false; }   /* لا مخزنَ: ما في الاحتياطيِّ يعود (V21.0) */
      /* ما عليه شاهدُ قبرٍ في الحفظ المحليِّ يُمحى عند التحميل */
      Object.keys(CORE.TOMB).forEach(function(k){
        var T = v[k]; if (!T || Array.isArray(T)) return;
        Object.keys(T).forEach(function(id){ if (T[id] && T[id].deleted) delete T[id]; });
      });
      ['recs','inss','tasks','moves','buys','queue','poison','diss','maints','steps','photos','pending','provision','att','msgs'].forEach(function(k){
        if (v[k]) STATE[k] = v[k];
      });
      if (v.photos){ var oldP = {}; Object.keys(v.photos).forEach(function(k){ oldP[k] = photoSlim(v.photos[k]); }); STATE.photos = oldP; PV.PH_DIRTY = true, phTouch(); }   /* (V37.18) لقطةٌ قديمةٌ تحمل الصورَ: تُجرَّد مرةً */
      if (v.siteOv && typeof v.siteOv === 'object'){ STATE.siteOv = v.siteOv; STATE.sites = STATE.sites.concat(STATE.hiddenSites || []); siteOvApply(); }
      if (v.cfg) Object.keys(v.cfg).forEach(function(k){ CFG[k] = v.cfg[k]; });
      if (v.pullAt && typeof v.pullAt === 'object') STATE.meta.pullAt = v.pullAt;
      if (v.notifAt) STATE.meta.notifAt = v.notifAt;
      if (v.epoch) STATE.meta.epoch = v.epoch;
      if (v.wbs && Array.isArray(v.wbs.rows)) STATE.wbs = v.wbs;
      if (v.wtask && Array.isArray(v.wtask.rows)) STATE.wtask = v.wtask;
      if (v.trials && Array.isArray(v.trials.rows)) STATE.trials = v.trials;
      if (v.bugs && typeof v.bugs === 'object') STATE.bugs = v.bugs;
      CORE.qbakRestore();   /* وما في الاحتياطيِّ ولم يصل إلى المخزن (V21.0) */
      /* يُطوى المكرَّرُ فيما حُمِّل: الطابورُ المحفوظُ قبل الطيِّ فيه مفاتيحُ
         مكرَّرة، فتُطوى مرةً هنا ولا تُرفَع مرارًا. */
      if (Array.isArray(STATE.queue) && STATE.queue.length > 1){
        var seen = {}, keep = [];
        for (var qi = STATE.queue.length - 1; qi >= 0; qi--){
          var it = STATE.queue[qi], k2 = it.kind + '/' + it.id;
          if (seen[k2]) continue;
          seen[k2] = 1; keep.unshift(it);
        }
        STATE.queue = keep;
      }
      /* وما دخل الطابورَ بمعرِّفٍ فارغٍ من نسخةٍ سابقة يُخرَج منه ويُقال — لا يُرفَع أبدًا */
      if (Array.isArray(STATE.queue)){
        var badQ = STATE.queue.filter(function(q){ return !CORE.validId(q.id); });
        if (badQ.length){
          STATE.queue = STATE.queue.filter(function(q){ return CORE.validId(q.id); });
          if (typeof logEventQuiet === 'function')
            logEventQuiet('أُخرج ' + badQ.length + ' من الطابور بمعرِّفٍ فارغ — ' + badQ.map(function(q){ return q.kind; }).join(','));
        }
      }
      /* معزولاتٌ باسمِ نوعٍ لا مجموعةَ له (أوامرُ حذفِ الأحداث باسم `events`
         من تصفيرِ V15.97 وما قبل) لا تُرفَع أبدًا مهما أُعيدت — تُسقَط ويُقال كم. */
      if (Array.isArray(STATE.poison) && STATE.poison.length && typeof FB === 'object' && FB && FB.colOf){
        var junk = STATE.poison.filter(function(p){ return FB.colOf(p.kind) === 'misc'; });
        if (junk.length){
          STATE.poison = STATE.poison.filter(function(p){ return FB.colOf(p.kind) !== 'misc'; });
          if (typeof logEventQuiet === 'function')
            logEventQuiet('أُسقط ' + junk.length + ' معزولةً لنوعٍ بلا مجموعة — ' + junk[0].kind);
        }
      }
      /* وتُعاد الشارةُ فورَ التحميل: كانت تُرسَم بما في الذاكرة ثم يُحمَّل
         المحفوظُ فلا تُعاد — فتقول سبعةً والطابورُ أربعةٌ وثلاثون، ويُقرأ
         الرقمان متناقضين وهما لحظتان مختلفتان. */
      if (typeof syncBadge === 'function') syncBadge();
      /* (V37.18) الصورُ في مفتاحها الخاصّ — تُقرأ بعد الحالة، ولقطةٌ قديمةٌ تحملها تبقى حتى تُحفَظ مرةً */
      return idbGet('photos').then(function(ph){ if (ph && typeof ph === 'object' && !v.photos) STATE.photos = ph; return true; }).catch(function(){ return true; });
    }).catch(function(e){
      /* إن فشلت القراءةُ المحليةُ ظهر التطبيقُ فارغًا — فيظنُّ صاحبُه أن عملَه
         ضاع فيعيده. والصمتُ هنا يُنتج عملًا مكرَّرًا لا نقصًا فقط. */
      softErr('القراءة المحلية', e, 'تعذّرت قراءةُ ما حُفظ على هذا الجهاز — زامِن قبل أن تسجّل فوقه');
      return false;
    });
  },

  /* (V38.30) مهلةُ ما ينتظر الرفع — بالأيام من الثوابت؛ ٠ أو فارغ = لا تجاهل */
  queueTtlDays: function(){ var v = typeof cfgGet === 'function' ? cfgGet('queueTtl') : 0; return v > 0 ? Math.round(v) : 0; },
  queueTtlApply: function(){
    var d = CORE.queueTtlDays(); if (!d || !Array.isArray(STATE.queue) || !STATE.queue.length) return 0;
    var cut = Date.now() - d * 86400000, old = STATE.queue.filter(function(q){ return q && (+q.at || 0) && q.at < cut && q.kind !== 'presence' && q.kind !== 'stats'; });
    if (!old.length) return 0;
    STATE.stale = STATE.stale || [];
    old.forEach(function(q){ STATE.stale.push({ kind:q.kind, id:q.id, v:q.v, at:q.at, dropAt:Date.now(), why:'أقدمُ من ' + d + ' يومًا' }); });
    STATE.queue = STATE.queue.filter(function(q){ return old.indexOf(q) < 0; });
    try { lsSet('nsk14.stale', JSON.stringify(STATE.stale.slice(-500))); } catch (e){ LS_ERR = e; }
    if (typeof logEventQuiet === 'function') logEventQuiet('تُجوهل ' + old.length + ' مما ينتظر الرفع لأنه أقدمُ من ' + d + ' يومًا — محفوظٌ على الجهاز للتصدير', '');
    CORE.saveSoon();
    return old.length;
  },
  /* (V38.30) ملفُّ انتظار: ما لم يُرفَع — وما تُجوهل — يخرج ملفًّا يُنقَل إلى جهازٍ أو عنوانٍ آخر ويُستورَد من المكتب */
  queueExport: function(){
    var Q = (STATE.queue || []).filter(function(q){ return q && q.kind !== 'presence' && q.kind !== 'stats'; });
    return { v:1, kind:'nsk-pending', at:Date.now(), by:STATE.meta.name || '', dev:(STATE.meta.dev || ''), ver:(typeof APP_VER !== 'undefined' ? APP_VER : ''),
             items:Q.map(function(q){ return { kind:q.kind, id:q.id, v:q.v, at:q.at }; }), stale:(STATE.stale || []).map(function(q){ return { kind:q.kind, id:q.id, v:q.v, at:q.at, dropAt:q.dropAt }; }) };
  },
  queueImport: function(o){
    if (!o || o.kind !== 'nsk-pending' || !Array.isArray(o.items)) return { n:0, bad:1 };
    var all = o.items.concat(Array.isArray(o.stale) ? o.stale : []), n = 0, skipped = 0, seen = {};
    all.forEach(function(it){
      if (!it || !it.kind || !CORE.validId(it.id) || !it.v || typeof it.v !== 'object'){ skipped++; return; }
      if (it.kind === 'presence' || it.kind === 'stats' || it.kind === 'cfg'){ skipped++; return; }   /* لا إعداداتٍ ولا نبضاتٍ من ملف */
      var k = it.kind + '/' + it.id; if (seen[k]){ skipped++; return; } seen[k] = 1;
      var col = STATE[it.kind], cur = col && typeof col === 'object' && !Array.isArray(col) ? col[it.id] : null;
      if (cur && (+cur.at || +cur.updatedAt || 0) > (+it.v.at || +it.v.updatedAt || +it.at || 0)){ skipped++; return; }   /* الأحدثُ في القاعدة يبقى */
      if (col && typeof col === 'object' && !Array.isArray(col)) col[it.id] = it.v;
      CORE.set(it.kind, it.id, it.v); n++;
    });
    CORE.saveSoon();
    if (n && typeof logEvent === 'function') logEvent('استُورد ملفُّ انتظار من جهاز ' + (o.by || '') + ' — ' + n + ' سجلًّا' + (skipped ? ' · تُرك ' + skipped : ''));
    return { n:n, skipped:skipped };
  },
  /* الرفع — يُحاوَل ويُترك الطابور إن فشل */
  _busy: false,
  flush: function(){
    if (typeof PV === 'object' && PV.VIEW_AS) return Promise.resolve({ ok:[], failed:[], viewAs:true });   /* (V39.92) the queue waits while the admin views as someone */
    if (typeof pzInssRetry === 'function') pzInssRetry();   /* (V38.57) installs the old rule refused come back to the queue */
    if (!STATE.meta.online || !STATE.queue.length) return Promise.resolve(0);
    /* لا يُرفَع شيءٌ قبل أن يُعرَف العهدُ — وإلا عاد القديمُ إلى قاعدةٍ صُفِّرت */
    if (EPOCH_PENDING) return Promise.resolve(0);
    /* رفعٌ واحدٌ في كلِّ لحظة: كان الرفعُ يُستدعى من الدورة ومن الحفظ ومن
       الاتصال معًا، فتُرفَع الدفعةُ نفسُها مرتين وتُعَدُّ محاولاتُ الوثيقة
       المرفوضة ثلاثًا في ثانية. */
    /* والقفلُ يُفَكُّ بعد نصف دقيقةٍ ولو لم يعد الرفعُ السابق — فإن علق
       تهيئةُ Firebase على شبكةٍ رديئةٍ لا يعلق الطابورُ معه إلى الأبد */
    if (CORE._busy && Date.now() - (CORE._busyAt || 0) < 30000) return Promise.resolve(0);
    CORE._busy = true; CORE._busyAt = Date.now();
    /* (V38.30) قرارُ المالك: ما طال انتظارُه فوق المهلة (الثوابت ← «مهلةُ ما ينتظر الرفع» — أيام، ٠ = لا تجاهل) يُتجاهَل:
       يخرج من الطابور إلى ركنٍ يُرى ويُصدَّر (STATE.stale) ويُقال في السجلّ — لا يُمحى صامتًا. كان المبدأُ «لا يُسقَط شيء»،
       والمالكُ قرّر مهلةً حتى لا يحمل جهازٌ هجرَ الشبكةَ شهورًا عملًا قديمًا يعود فجأةً فوق الأحدث. */
    /* ما لا يصلح معرِّفُه يُعزَل باسمه قبل الدفع ولا يُوقف ما بعده */
    var badIds = STATE.queue.filter(function(q){ return !CORE.validId(q.id); });
    if (badIds.length){
      STATE.poison = STATE.poison || [];
      badIds.forEach(function(q){
        if (!STATE.poison.some(function(p2){ return p2.kind === q.kind && String(p2.id) === String(q.id); }))
          STATE.poison.push({ kind:q.kind, id:String(q.id || ''), v:q.v, err:'معرِّفٌ فارغٌ أو غيرُ صالح — لا يُرفَع', at:Date.now() });
      });
      STATE.queue = STATE.queue.filter(function(q){ return CORE.validId(q.id); });
      CORE.saveSoon();
      if (!STATE.queue.length){ CORE._busy = false; return Promise.resolve(0); }
    }
    CORE.queueTtlApply();   /* (V38.30) بعد عزل المعطوب: المهلةُ على الصالح وحدَه */
    if (!STATE.queue.length){ CORE._busy = false; return Promise.resolve(0); }
    /* ما أُجِّل لا يُرفَع قبل موعده ولا يعيق ما بعده (V17.40) */
  var nowQ = Date.now();
    var batch = (STATE.queue || []).filter(function(it){ return !it.next || it.next <= nowQ; }).slice(0, 50);
    if (!batch.length){ CORE._busy = false; return Promise.resolve(0); }   /* كلُّه مؤجَّلٌ — يُنتظَر موعدُه */
    /* يُهيَّأ Firebase قبل الدفع: كان يُنادى `push` مباشرةً وهي ترفض
       بـ«not-ready» إن لم يُحمَّل بعد — وهو يُحمَّل كسولًا. فيبقى الطابورُ
       واقفًا ويُعاد الرفضُ في كلِّ دورةٍ فلا يصل شيءٌ أبدًا. */
    return FB.init().then(function(ok){
      if (!ok) return Promise.reject(new Error('offline'));
      return Promise.resolve().then(function(){ return FB.push(batch); }).then(function(){ return { ok:batch, failed:[] }; })   /* (V39.53) a throw while the batch is built is a rejection like any other — then each document on its own */
        .catch(function(e){
          /* الدفعةُ سقطت جملةً — يُعرَف السببُ وثيقةً وثيقة */
          if (/offline|not-ready|unavailable|network/i.test(String(e && (e.message || e.code) || e))) throw e;
          return FB.pushEach(batch);
        });
    }).then(function(r){
      var okIds = {};
      r.ok.forEach(function(it){ okIds[it.kind + '|' + it.id] = 1; });
      STATE.queue = STATE.queue.filter(function(it){ return !okIds[it.kind + '|' + it.id]; });
      CORE.qbakSave();   /* (V21.4) ما رُفع يخرج من الاحتياطيّ في اللحظة — لا بعد مهلة الحفظ */
      /* نبضةٌ واحدةٌ لكلِّ دفعةٍ ناجحة: أيُّ مجموعاتٍ تغيّرت — فتسحب الأجهزةُ
         الأخرى فارقَها في ثوانٍ لا بعد عشر دقائق (V17.26). النبضةُ نفسُها
         لا تُنبِض (settings) وإلا دار الجهازُ على نفسه. */
      var kinds = {};
      r.ok.forEach(function(it){ if (it.kind !== 'cfg' && it.kind !== 'presence' && it.kind !== 'stats' && it.kind !== 'evlog') kinds[it.kind] = 1; });
      if (Object.keys(kinds).length) FB.pulse(Object.keys(kinds));
      r.failed.forEach(function(f){
        var it = f.it; it.tries = (it.tries || 0) + 1; it.err = f.msg;
        softErr('رفع وثيقة — ' + it.kind + '/' + it.id, f.msg, '');
        /* ═══ ما فشل يُعاد بمهلةٍ متزايدة لا يُعزَل بعد ثلاث (V17.40) ═══
           أكثرُ أسباب الفشل عابرٌ: شبكةٌ انقطعت أو مهلةٌ انتهت أو القاعدةُ
           مشغولة. فكان عزلُ الوثيقة بعد ثلاثِ محاولاتٍ متتاليةٍ يحبس عملًا
           صحيحًا على الجهاز لأن الشبكةَ ساءت دقيقة. صارت تُؤجَّل وتُعاد:
           دقيقةٌ ثم أربعٌ ثم خمسَ عشرةَ ثم ساعةٌ ثم ثلاثٌ — حتى اثنتي عشرةَ
           محاولة. ولا يُعزَل إلا ما لا يُصلحه التكرار: رفضُ القواعد أو حجمٌ
           فوق السقف — ذاك عزلُه فورًا وإعادتُه عبث. */
        var msg = String(f.msg || '');
        var hard = /permission|denied|PERMISSION|INVALID_ARGUMENT|invalid|too large|exceeds|maximum/i.test(msg);
        if (!hard && it.tries < 12){
          var waits = [60000, 240000, 900000, 3600000, 10800000];
          it.next = Date.now() + waits[Math.min(it.tries - 1, waits.length - 1)];
          return;
        }
        if (hard || it.tries >= 12){
          /* تُعزَل: تخرج من الطابور إلى ركنٍ يُرى — فلا تعيق ما بعدها */
          STATE.poison = STATE.poison || [];
          if (!STATE.poison.some(function(p2){ return p2.kind === it.kind && String(p2.id) === String(it.id); }))
            STATE.poison.push({ kind:it.kind, id:it.id, v:it.v, err:f.msg, at:Date.now() });
          STATE.queue = STATE.queue.filter(function(q){ return q !== it; });
          logEvent('وثيقةٌ عُزلت عن الرفع — ' + it.kind + '/' + it.id + ' \u00b7 ' + f.msg.slice(0, 80), it.id);
          if (typeof notifPush === 'function' && it.kind !== 'presence' && it.kind !== 'stats') notifPush('وثيقة رُفضت على جهاز', it.kind + '/' + it.id + ' — ' + f.msg.slice(0, 100), { site:it.kind === 'sites' || it.kind === 'recs' || it.kind === 'inss' ? String(it.id) : '', lv:'مهم' });   /* (V39.54) owner: «أي كونفليكت يحصل عرّفني» */   /* (V31.1) كان `id` غيرَ معرَّفٍ هنا فيرمي خطأً */
        }
      });
      if (r.failed.length && !SOFT_SAID['رفع الطابور']){
        SOFT_SAID['رفع الطابور'] = 1;
        /* الرسالةُ تسمّي أوّلَ مجموعةٍ رُفضت — «سبعُ وثائق» بلا اسمٍ لا تُشخَّص */
        var f0 = r.failed[0].it;
        toast(nm(r.failed.length) + ' ' + t('وثيقةً رُفضت')
              + ' \u00b7 ' + esc(f0.kind) + '/' + esc(String(f0.id)).slice(0, 24)
              + ' \u2014 ' + t('التفصيلُ في «المزامنة والتعارض»'));
      }
      if (r.ok.length){
        STATE.meta.lastSync = Date.now();
        if (typeof rollupToday === 'function') rollupToday();
        /* نجحت دفعةٌ — يُصفَّر التكتّمُ ليُقال الفشلُ التالي ولا يُبتلَع */
        if (!r.failed.length) SOFT_SAID = {};
      }
      CORE.saveLocal();
      syncBadge();
      /* صفحةُ المزامنة تعرض الطابورَ نفسَه — فإن دُفع من الدورة التلقائية بقيت
         تقول «بانتظار الرفع ١» وقد فرغ، ويضغط المستخدمُ فيُقال له «فارغ» */
      if (CUR === 'sys' || CUR === 'sync'){ clearTimeout(CORE._dr); CORE._dr = setTimeout(function(){ if (CUR === 'sys' || CUR === 'sync') render(1); }, 200); }
      CORE._busy = false;
      /* (V19.5) ما كُتب أثناء هذا الرفع وجد القفلَ مغلقًا فانتظر دورةَ الدقيقة — يُرفَع
         الآن ما صار مستحقًّا منه، مرةً بعد ثانيةٍ ونصف (ولا يدور على مؤجَّلٍ ولا فاشل) */
      var dueNow = STATE.queue.some(function(it){ return !it.next || it.next <= Date.now(); });
      if (dueNow && r.ok.length && !r.failed.length){ clearTimeout(CORE._chain); CORE._chain = setTimeout(function(){ try { CORE.flush(); } catch (e2){ LS_ERR = e2; } }, 1500); }
      return r.ok.length;
    }).catch(function(e){
      /* كان يعود صفرًا صامتًا: يبقى «ثلاثةٌ بانتظار الرفع» ولا يُعرَف لماذا،
         فينتظر المستخدمُ دورةً لن تنجح. */
      CORE._busy = false;
      softErr('رفع الطابور', e, 'تعذّر الرفعُ — ما سُجّل محفوظٌ على الجهاز ويُعاد تلقائيًّا');
      return 0;
    });
  },

  pending: function(){ return STATE.queue.length; }
};

/* ── جسر Firebase — يُحمَّل كسولًا فلا يُعطّل الإقلاع ── */
/* (V38.54) vendored libraries — the app's own copy under vendor/ first (kept by the service worker in the persistent
   «nusuk-lib» cache, so it works with no network), the public CDN only as a fallback when the own copy cannot load.
   Order matters for chained loads (Firebase compat: app → auth → firestore), so callers chain the promises. */
/* (V38.57) installation records the old database rule refused (an approved solution in the merged document) sit isolated
   on the installers' phones. Once the corrected rule is live they go through: re-send them — every 30 minutes while online,
   at most 8 rounds per record, so a phone that updates before the rule is deployed still delivers later. */
function pzInssRetry(){
  try {
    if (!STATE.meta.online || !Array.isArray(STATE.poison) || !STATE.poison.length) return 0;
    var R = {}; try { R = JSON.parse(lsGet('nsk14.pzIns') || '{}'); } catch (e0){ R = {}; }
    var now = Date.now(), back = 0;
    STATE.poison = STATE.poison.filter(function(p){
      if (!p || p.kind !== 'inss' || !/permission|insufficient|PERMISSION_DENIED/i.test(String(p.err || ''))) return true;
      var k = String(p.id), r = R[k] || { n:0, at:0 };
      if (r.n >= 20 || now - r.at < 30000) return true;   /* (V38.62) every 30 s, up to 20 rounds */
      R[k] = { n:r.n + 1, at:now }; CORE.dirty(p.kind, p.id, p.v); back++; return false;
    });
    if (back){ lsSet('nsk14.pzIns', JSON.stringify(R)); CORE.saveSoon(); logEventQuiet('أُعيد إرسالُ ' + back + ' تركيبٍ رفضته القاعدةُ القديمة'); }
    return back;
  } catch (e){ LS_ERR = e; return 0; }
}
function libLoad(local, cdn, ms){
  /* one deadline for both attempts (the caller's ms, as before vendoring): a local copy that errors fast leaves the rest
     of the budget to the CDN; a local copy that hangs until the deadline does not double the wait */
  var t0 = Date.now();
  var one = function(src, budget){ return new Promise(function(res){
    var sc = document.createElement('script'), done = false, fin = function(ok){ if (done) return; done = true; if (!ok && sc.parentNode) sc.parentNode.removeChild(sc); res(ok); };
    sc.src = src; sc.onload = function(){ fin(true); }; sc.onerror = function(){ fin(false); };
    document.head.appendChild(sc); if (budget) setTimeout(function(){ fin(false); }, budget);
  }); };
  return one(local, ms).then(function(ok){
    if (ok || !cdn) return ok;
    var left = ms ? ms - (Date.now() - t0) : 0;
    if (ms && left < 1000) return false;
    libLoad.fellBack = (libLoad.fellBack || 0) + 1; libLoad.last = local;   /* visible in the device diagnostics */
    return one(cdn, left);
  });
}
var FB = {
  app:null, auth:null, db:null, ready:false,

  /* يُحمَّل عند أول حاجةٍ إليه لا مع الصفحة: الإقلاعُ لا ينتظر شبكةً.
     وكان يُفترَض موجودًا ولا سكربتَ يُحمّله أصلًا — فتعود `init` بـ`false`
     دائمًا: لا دخولَ ولا رفعَ ولا جلسةٌ محفوظة. */
  _load: null,
  load: function(){
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.firebase && window.firebase.auth) return Promise.resolve(true);
    if (FB._load) return FB._load;
    /* (V38.54) the app's own copy first; gstatic only if it cannot load */
    var one = function(f){ return libLoad('vendor/firebase/9.23.0/' + f, 'https://www.gstatic.com/firebasejs/9.23.0/' + f); };
    FB._load = one('firebase-app-compat.js')
      .then(function(ok){ return ok ? one('firebase-auth-compat.js') : false; })
      .then(function(ok){ return ok ? one('firebase-firestore-compat.js') : false; })
      .then(function(ok){ return !!(ok && window.firebase && window.firebase.auth); })
      .catch(function(){ return false; });
    return FB._load;
  },
  init: function(){
    if (FB.ready) return Promise.resolve(true);
    return FB.load().then(function(ok){
      if (!ok) return false;
      return FB._start();
    });
  },
  _start: function(){
    if (FB.ready) return true;
    if (typeof window === 'undefined' || !window.firebase) return false;
    try {
      FB.app  = window.firebase.initializeApp(PV.FB_CFG);
      FB.auth = window.firebase.auth();
      FB.db   = window.firebase.firestore();
      FB.ready = true;
      return true;
    } catch(e){ return false; }
  },

  /* إنشاءُ حسابٍ بتطبيقٍ ثانٍ: التطبيقُ الثاني له جلستُه المستقلّة، فالتسجيلُ
     فيه لا يمسُّ جلسةَ الأول — فلا يخرج المهندسُ من حسابه وهو يُنشئ حسابًا
     لغيره. ثم يُخرَج من الثاني فلا تبقى جلسةٌ معلَّقة.
     ولا يحتاج خطةً مدفوعةً ولا دالةً سحابيةً ولا مفتاحَ حسابِ خدمةٍ في
     المتصفّح — وكلُّها طرقٌ أثقلُ لنتيجةٍ واحدة. */
  createUser: function(user, pass, meta){
    return FB.init().then(function(ok){
      if (!ok) return { ok:false, err:'offline' };
      var email = user.indexOf('@') > -1 ? user : (user + '@nusuk.local');
      var second;
      try {
        second = (window.firebase.apps || []).filter(function(a){ return a.name === 'mk'; })[0]
              || window.firebase.initializeApp(PV.FB_CFG, 'mk');
      } catch (e){ return { ok:false, err:'app' }; }
      var bye = function(r){
        return second.auth().signOut().then(function(){ return r; })
               .catch(function(){ return r; });
      };
      return second.auth().createUserWithEmailAndPassword(email, pass)
        .then(function(c){
          return DB.col('users').doc(c.user.uid).set({
            name:(meta && meta.name) || user, user:user,
            role:(meta && meta.role) || 'tech',
            at:Date.now(), by:STATE.meta.name || '',
            _by:STATE.meta.uid || '', _at:Date.now()   /* هويةُ الكاتب لا اسمُه (V17.93) */
          }).then(function(){ return { ok:true, uid:c.user.uid }; });
        })
        .then(bye)
        .catch(function(e){ return bye({ ok:false, err:String(e && e.code || e) }); });
    });
  },

  signIn: function(user, pass){
    return FB.init().then(function(ok){
      if (!ok) return { ok:false, err:'offline' };
      var email = user.indexOf('@') > -1 ? user : (user + '@nusuk.local');
      return FB.auth.signInWithEmailAndPassword(email, pass)
        .then(function(c){
          STATE.meta.uid = c.user.uid;
          STATE.meta.online = true;
          return DB.col('users').doc(c.user.uid).get();
        })
        .then(function(doc){
          var u = (doc && doc.exists) ? doc.data() : {};
          STATE.meta.role = isBossHere() ? 'admin' : (u.role || 'tech');
          STATE.meta.name = u.name || user;
          STATE.meta.kind = u.kind || '';
          if (u.mustChange) setTimeout(function(){ pwOpen(true); }, 900);
          return { ok:true, role:STATE.meta.role, name:STATE.meta.name };
        })
        .catch(function(e){ return { ok:false, err:String(e && e.code || e) }; });
    });
  },

  /* ═══ الوثيقةُ المسمومة لا توقف الطابور ═══
     الدفعةُ تُرفَع كلُّها أو لا شيء — فوثيقةٌ واحدةٌ فيها قيمةٌ غيرُ
     مقبولة (undefined) أو ترفضها القاعدةُ كانت تُسقِط الدفعةَ كلَّها، وتعود
     في الدورة التالية فتسقطها ثانيةً، إلى الأبد: «تعذّر الرفع» كلَّ دقيقةٍ ولا
     يصل شيءٌ ولا يُعرَف أيُّ وثيقةٍ السبب. صار الرفعُ إن فشل جملةً يُعاد
     وثيقةً وثيقة: ما نجح يخرج من الطابور، وما فشل ثلاثًا يُعزَل في ركنٍ
     يُرى بسببه — ويُصفّى من undefined قبل الإرسال أصلًا. */
  clean: function(v){
    if (v === undefined) return null;
    if (v === null || typeof v !== 'object') return (typeof v === 'number' && !isFinite(v)) ? null : v;
    if (Array.isArray(v)) return v.map(FB.clean);
    var o = {};
    Object.keys(v).forEach(function(k){ if (v[k] !== undefined) o[k] = FB.clean(v[k]); });
    return o;
  },
  colOf: function(kind){
    return { recs:'recs', inss:'inss', tasks:'tasks', moves:'inventory',
             buys:'purchases', cfg:'settings', users:'users',
             evlog:'events', diss:'dismantles', newsites:'newsites',
             coreqs:'coreqs', fixreqs:'fixreqs', bugs:'bugs', sites:'sites', ships:'ships',
             vehicles:'vehicles', vehAsn:'vehAsn', accounts:'accounts', photos:'photos', photoblobs:'photoblobs',
             stats:'stats', teams:'teams', baseline:'baseline',
             changes:'changes', hse:'hse', ncr:'ncr', ipc:'ipc', bonus:'bonus',
             workReqs:'workreqs', maints:'maints', steps:'steps', pending:'pending', provision:'provision', att:'att', ghcfg:'ghcfg', presence:'presence', msgs:'msgs' }[kind] || 'misc';
  },
  live: function(kind, v){
    /* (V28.3) بلاغُ الوزارة «مسحنا المخيم مراتٍ ولم يُضَف»: الحذفُ يكتب شاهدًا {deleted:true} بدمج، والمسحُ التالي يُكتَب بدمجٍ
       أيضًا فيبقى الشاهدُ في الوثيقة تحت المسح الجديد — فتمحوه كلُّ الأجهزة عند القراءة وكأنه لم يُسجَّل قط. كلُّ كتابةٍ حيّةٍ
       لنوعٍ له شواهد تمحو الشاهدَ صراحةً، والمسحُ الكاملُ يمحو علَمَ «السريعة» الباقيَ من قبله. */

    var vv = Object.assign({}, v);   /* الختمُ (_by/_at) عند النداء نفسِه — يفحصه جردُ الهوية */
    var roOnly = STATE.meta && (STATE.meta.role === 'viewer' || STATE.meta.role === 'exec');   /* (V28.4) اعتمادُ الوزارة تحصر قاعدتُه الحقولَ — فلا يُضاف له */
    if (!roOnly && CORE.TOMB && CORE.TOMB[kind] && vv.deleted !== true) vv.deleted = false;
    if (kind === 'recs' && vv.deleted !== true && vv.quick && typeof recIsQuick === 'function' && !recIsQuick(v)) vv.quick = 0;
    /* (V39.53) the camp's sensor plan holds coordinate pairs (sensors:[[lat,lng],…]) — arrays inside an array, which the database
       refuses. The SDK threw before the commit, outside the per-document handling, so one saved or moved plan held every later write
       on the device (owner: «١٧ كتابة لم ترفع من أكثر من ساعة»; a colleague's sensor moves never arrived). It travels as one JSON
       string, like the registry (V38.88), and is read back where site documents come in (siteOvDec). */
    if (kind === 'sites' && vv.iot && typeof vv.iot === 'object'){ vv.iotJ = JSON.stringify(vv.iot); delete vv.iot; }
    return vv;
  },
  putOne: function(it){
    var ref = DB.col(FB.colOf(it.kind)).doc(String(it.id));
    if (it.v === null) return ref.delete();
    return ref.set(FB.clean(FB.live(it.kind, Object.assign({}, it.v, { _by:STATE.meta.uid, _at:Date.now() }))), { merge:true });
  },
  /* ═══ الرفضُ يُصالَح قبل أن يُعَدَّ رفضًا ═══
     وثيقةٌ وصلت الخادمَ ثم انقطعت الشبكةُ قبل الجواب تبقى في الطابور وتُعاد
     — فإن كانت قاعدتُها «إضافةٌ لا تعديل» رُفضت الإعادةُ ثلاثًا وعُزلت،
     وامتلأت شاشةُ المزامنة أعطالًا لأثرٍ موجودٍ أصلًا. فعند رفضِ الصلاحية
     تُقرأ الوثيقةُ مرةً: إن كانت موجودةً ومحتواها هو محتوانا (عدا ختمِ
     الدفعة) فقد وصلت — تُعَدُّ ناجحةً وتُسقَط من الطابور بلا صخب. قراءةٌ
     واحدةٌ لكلِّ رفضٍ أرخصُ من ثلاث إعاداتٍ وعزلٍ ومكالمة. */
  sameDoc: function(mine, theirs){
    if (!mine || !theirs) return false;
    var skip = { _at:1, _by:1 };
    var ks = Object.keys(mine).filter(function(k){ return !skip[k]; });
    for (var i = 0; i < ks.length; i++){
      var k = ks[i];
      if (JSON.stringify(FB.clean(mine[k])) !== JSON.stringify(FB.clean(theirs[k]))) return false;
    }
    return true;
  },
  reconcile: function(it, e){
    var msg = String((e && (e.message || e.code)) || e);
    if (!/permission|PERMISSION_DENIED/i.test(msg) || it.v === null) return Promise.resolve(false);
    var ref = DB.col(FB.colOf(it.kind)).doc(String(it.id));
    return ref.get().then(function(doc){
      FB.readCount = (FB.readCount || 0) + doc.size;
      return !!(doc && doc.exists && FB.sameDoc(it.v, doc.data() || {}));
    }).catch(function(){ return false; });
  },
  /* يُرفَع كلٌّ على حدة: يُرجِع ما نجح وما فشل بسببه — وما رُفض وهو واصلٌ يُعَدُّ ناجحًا */
  /* ═══ نبضةُ التغيير (V17.26) ═══
     السحبُ الدوريُّ كلَّ عشر دقائق يُبقي الجهازَ يجهل ما تغيّر تسعَ دقائقَ
     وخمسين ثانيةً في المتوسط، وتقصيرُه إلى دقيقةٍ يعني ثمانيَ قراءاتٍ في
     الدقيقة لكلِّ جهازٍ ولو لم يتغيّر شيء (كلُّ استعلامٍ يُحاسَب بقراءةٍ على
     الأقلّ) — أي ستّون ألفَ قراءةٍ في اليوم تتجاوز الحصةَ المجانية. فصار
     الحلُّ نبضةً: بعد كلِّ رفعٍ ناجحٍ يكتب الجهازُ في وثيقةٍ واحدةٍ
     settings/pulse أيَّ مجموعاتٍ تغيّرت ومتى — كتابةٌ واحدةٌ مهما كبرت
     الدفعة. وكلُّ جهازٍ يُنصِت لهذه الوثيقة وحدَها: لا تكلّف شيئًا وهي
     ساكنة، وحين تتغيّر يسحب الجهازُ فارقَ ما تغيّر فقط. فالطزاجةُ ثوانٍ،
     والكلفةُ بقدر التغيير الحقيقيّ، والسحبُ الدوريُّ يبقى شبكةَ أمانٍ خلفها. */
  pulse: function(kinds){
    if (!FB.ready || !FB.db || !kinds || !kinds.length) return Promise.resolve();
    var now = Date.now(), doc = { at:now, by:STATE.meta.uid || '', _by:STATE.meta.uid || '', _at:now };
    kinds.forEach(function(k){ doc[FB.colOf(k)] = now; });
    return DB.col('settings').doc('pulse').set(doc, { merge:true }).catch(function(e){ softErr('إشعار التغيير', e, ''); });
  },
  pushEach: function(batch){
    var ok = [], failed = [], healed = 0;
    return batch.reduce(function(p, it){
      return p.then(function(){
        /* انفجارٌ متزامنٌ في بناء المرجع كان يُسقِط السلسلةَ كلَّها — يُحوَّل رفضًا لهذه الوثيقة وحدَها */
        return Promise.resolve().then(function(){ return FB.putOne(it); }).then(function(){ ok.push(it); })
          .catch(function(e){
            return FB.reconcile(it, e).then(function(same){
              if (same){ ok.push(it); healed++; return; }
              failed.push({ it:it, msg:String((e && (e.message || e.code)) || e).slice(0, 160) });
            });
          });
      });
    }, Promise.resolve()).then(function(){
      if (healed) logEventQuiet('صُولح ' + healed + ' وثيقةً كانت واصلةً وأُعيدت');
      return { ok:ok, failed:failed, healed:healed };
    });
  },
  push: function(batch){
    if (!FB.ready) return Promise.reject(new Error('not-ready'));
    var w = DB.batch();
    batch.forEach(function(it){
      /* لكلِّ نوعٍ مجموعتُه: كانت سبعةُ أنواعٍ تسقط في «misc» واحدةٍ فتختلط،
         ولا تُستعلَم بمفردها، ولا تُحكَم بقاعدةِ وصولٍ خاصةٍ بها. */
      var col = { recs:'recs', inss:'inss', tasks:'tasks', moves:'inventory',
                  buys:'purchases', cfg:'settings', users:'users',
                  evlog:'events', diss:'dismantles', newsites:'newsites',
                  coreqs:'coreqs', fixreqs:'fixreqs', bugs:'bugs', sites:'sites', ships:'ships',
                  vehicles:'vehicles', vehAsn:'vehAsn', accounts:'accounts', photos:'photos', photoblobs:'photoblobs',
                  stats:'stats', teams:'teams', baseline:'baseline',
                  changes:'changes', hse:'hse', ncr:'ncr', ipc:'ipc', bonus:'bonus',
                  workReqs:'workreqs', maints:'maints', steps:'steps', pending:'pending', provision:'provision', att:'att', ghcfg:'ghcfg', presence:'presence', msgs:'msgs' }[it.kind];
      if (!col){ console.warn('نوعٌ بلا مجموعة: ' + it.kind); col = 'misc'; }
      var ref = DB.col(col).doc(String(it.id));
      if (it.v === null) w.delete(ref);
      else w.set(ref, FB.clean(FB.live(it.kind, Object.assign({}, it.v, { _by:STATE.meta.uid, _at:Date.now() }))), { merge:true });   /* (V28.3) */
    });
    return w.commit();
  },

  /* ── جسرُ النسخة العاملة: يُقرأ ما كُتب بأسمائها القديمة ── */
  pullLegacy: function(){
    if (!FB.ready || !FB.db) return Promise.resolve(0);
    var got = 0;
    var MAP = {
      srvorders: function(id, v){
        /* أمرُ الخدمة القديم: مسحٌ أو تركيبٌ بحسب نوعه */
        if (v.kind === 'install' || v.type === 'تركيب'){
          if (!STATE.inss[v.site || id]) STATE.inss[v.site || id] = v;
        } else if (!STATE.recs[v.site || id]) STATE.recs[v.site || id] = v;
        got++;
      },
      events: function(id, v){ STATE.events.push(v); got++; },
      hb:     function(id, v){ STATE.hb = STATE.hb || {}; STATE.hb[id] = v; got++; },
      hbev:   function(id, v){ STATE.hb = STATE.hb || {}; STATE.hb[id] = v; got++; }
    };
    return Promise.all(Object.keys(MAP).map(function(c){
      return DB.col(c).limit(2000).get().then(function(snap){
        FB.readCount = (FB.readCount || 0) + snap.size;
        snap.forEach(function(doc){
          try { MAP[c](doc.id, doc.data()); }
          catch (e){ softErr('تحويل سجل قديم — ' + c, e); }
        });
      }).catch(function(e){ softErr('قراءة المجموعة القديمة — ' + c, e); });
    })).then(function(){
      if (got){
        statBump();
        CORE.saveSoon();
        lsSet('nsk14.legacy', '1');
        logEvent('استيراد من النسخة العاملة — ' + nm(got) + ' سجلًّا');
      }
      return got;
    });
  },

  legacyDone: function(){
    try{ return localStorage.getItem('nsk14.legacy') === '1'; }catch(e){ return false; }
  },

  /* سحبٌ فارقيّ: لا يُقرَأ إلا ما تغيّر بعد آخر مزامنة. والحقلُ `_at` يُكتَب
     مع كلِّ وثيقةٍ في الدفع، فالفرزُ عليه لا يحتاج فهرسًا مركّبًا.
     والميدانُ لا يقرأ إلا ما يخصّه: الفنيُّ لا يحتاج سجلَّ ألفٍ وسبعمئةِ موقع. */
  /* ═══ الثوابتُ والمراجعُ — مرةً عند الدخول وعند «مزامنة الآن» ═══
     كانت في `pull(0)` تُقرأ كلَّ دقيقةٍ على كلِّ جهاز: الإعداداتُ العشرون
     والمخزونُ والمشترياتُ والسياراتُ والشحناتُ وطبقةُ النقاط — آلافُ القراءات
     في الساعة لأشياءَ لا تتغيّر. ثم أُزيل الاستدعاءُ في V16.6 فماتت كلُّها:
     لا إعداداتٌ ولا طبقةٌ ولا مخزونٌ يصل جهازًا جديدًا. فصارت تُقرأ مرةً عند
     الدخول ومرةً عند الطلب، وطبقةُ النقاط بمؤشِّرٍ: ما تغيّر لا ما كُتب. */
  /* ═══ الثوابتُ ثمنُها أربعةٌ وثلاثون استعلامًا ═══
     `pullStatic` تقرأ الإعداداتِ والقوائمَ والنقاطَ — أربعةً وثلاثين استعلامًا،
     وكلُّ استعلامٍ يُحاسَب ولو عاد فارغًا. وكانت كلُّ عودةٍ إلى التطبيق (تبديلُ
     تطبيقٍ على الجوّال، إظهارُ تبويبٍ على الحاسوب) ترفع SYNC.pullAsk فتُجلَب كلُّها
     من جديد: فنيٌّ يبدّل التطبيقَ ثلاثين مرةً في اليوم = ألفُ استعلامٍ بلا
     فائدة، وعشرون جهازًا = عشرون ألفًا. فصار لها حدٌّ زمنيٌّ: لا تتكرر قبل
     ربع ساعةٍ إلا بأمرٍ صريح (تصفيرٌ، أو «زامِن الجميع»، أو زرُّ المزامنة). */
  pullStatic: function(force){
    if (!FB.ready || !FB.db) return Promise.resolve(false);
    var now = Date.now();
    if (!force && FB._staticAt && now - FB._staticAt < 900000) return Promise.resolve(false);
    FB._staticAt = now;
    /* خطأٌ متزامنٌ هنا (قاعدةٌ لم تُهيَّأ) كان يُسقِط سلسلةَ الدورة كلَّها ويترك
       SYNC.busy مرفوعًا — فتتوقف المزامنةُ لبقية الجلسة بلا صوت */
    try { return FB._pullStatic(); } catch (e){ softErr('قراءة الثوابت', e, ''); return Promise.resolve(false); }
  },
  _pullStatic: function(){
    /* العهدُ أوّلًا — قبل الثوابت وقبل أيِّ رفعٍ من الطابور */
    EPOCH_PENDING = true;
    /* شبكةٌ بطيئةٌ لا تحبس الطابورَ: ثمانِ ثوانٍ ثم يُرفَع ما عندنا */
    setTimeout(function(){ EPOCH_PENDING = false; }, 8000);
    var epochRead = DB.col('settings').doc('app').get().then(function(doc){
      FB.readCount = (FB.readCount || 0) + doc.size;
      var v = doc && doc.exists ? (doc.data() || {}) : {};
      if (v.epoch && epochApply(v.epoch)){ SYNC.pullAsk = true; FB._staticAt = 0; }
      if (v.syncAll) PV.SYNC_ALL_SEEN = +v.syncAll || 0;   /* عند الدخول: تُضبَط العلامةُ بلا سحبٍ زائد */
      if (v.ver && typeof verChase === 'function') verChase(v.ver);
    }).catch(function(e){ softErr('قراءة العهد', e, ''); }).then(function(){ EPOCH_PENDING = false; });
    return epochRead.then(function(){ return FB.pullStatic2(); });
  },
  pullStatic2: function(){
    if (!FB.ready || !FB.db) return Promise.resolve(false);
    /* الميدانُ لا يقرأ ما لا يراه: المخزونُ والمشترياتُ والشحناتُ وطلباتُ الشركات
       والتصويبُ والتغييراتُ والملاحظاتُ والورشةُ للمكتب وحده — يومٌ بمئةٍ وخمسين
       جهازًا لا يدفع سبعةَ آلاف قراءةٍ لأشياءَ لا تُعرَض */
    var office = rankOf(ROLE) >= rankOf('supervisor') || effRole(ROLE) === 'exec';
    return Promise.resolve().then(function(){
      /* المستخدمون: للمهندس وحده — وهم عشراتٌ لا آلاف */
      /* والسحبُ الأوّلُ كذلك: من رتبتُه فوق الأدنى يسحب ما يحقُّ له —
         والقاعدةُ تُسقِط ما لا يحقُّ فلا يُرى ما ليس له. */
      /* الحساباتُ والمعلَّقةُ والفرقُ تصل بالإنصات الحيِّ (liveSmall) لمن يحقُّ له —
         فلا تُقرأ هنا ثانيةً: مئتا وثيقةٍ في كلِّ دخولٍ كانت تُدفَع مرتين */
      if (false && rankOf(ROLE) > 30){
        DB.col('users').limit(300).get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          if (!STATE.users) STATE.users = {};
          sn.forEach(function(d){ STATE.users[d.id] = d.data(); });
          FB.readCount = (FB.readCount || 0) + sn.size;
        }).catch(function(e){ softErr('سحب المستخدمين', e, 'تعذّر سحبُ الحسابات — الشاشةُ قد تظهر ناقصة'); });
        /* والمعلَّقةُ كذلك: من أُنشئ على جهازٍ ولم يُفعَّل يُرى في كلِّ جهاز */
        DB.col('pending').limit(200).get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          STATE.pending = STATE.pending || {};
          sn.forEach(function(d){
            STATE.pending[d.id] = d.data();
            if (!STATE.users[d.id]) STATE.users[d.id] = Object.assign({ pending:true }, d.data());
          });
          if (sn.size && CUR === 'users') render(1);
        }).catch(function(e){ softErr('سحب الحسابات المعلَّقة', e, ''); });
      }
      /* الفرقُ الفرعيةُ (نسب الأنصبة) كانت تُكتب بـ`CORE.dirty('teams',…)` ولا
         تُقرأ هنا أبدًا — فكلُّ فريقٍ يُنشأ يضيع بإعادة الفتح أو على جهازٍ آخر،
         ومن أنشأ فريقًا ظنَّ أنه محفوظ. */
      false && DB.col('teams').limit(500).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(Object.assign({ id:d.id }, d.data())); });
        TEAMS.length = 0;
        arr.forEach(function(x){ TEAMS.push(x); });
        FB.readCount = (FB.readCount || 0) + sn.size;
      }).catch(function(e){ softErr('سحب الفرق الفرعية', e, 'تعذّر سحبُ الفرق الفرعية — قد تظهر فارغة'); });
      /* عدّاد ترقيم الطلبات (SR/IR/UR/MR/DR/CR/AR): وثيقةٌ مفردةٌ بحقولٍ رقمية —
         تُقرأ بنفس الأسلوب الآمن الذي أصلح فرق الأنصبة، لا بمصفوفةٍ تفسدها
         Firestore حين تتحول كائنًا بمفاتيح رقمية. */
      DB.col('settings').doc('reqSeq').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){
          var v = doc.data();
          /* نقلُ العدّادات مرةً واحدة: التركيبُ كان DR فصار IR، والفكُّ كان
             PR فصار UR، والصرفُ كان IR فصار DR — يُقرأ القديمُ ويُبدأ من
             حيث انتهى، فلا يُولَد IR-0001 وقد سبقه DR-0001 تركيبًا. */
          ['SR','IR','UR','CR','AR','MR','DR'].forEach(function(k){
            if (typeof v[k] === 'number' && v[k] > REQSEQ[k]) REQSEQ[k] = v[k];
          });
          /* ثم يُنقَل العدّادُ القديم: الرمزُ الذي كان يُستعمَل للمعنى نفسِه
             يرفع الجديدَ إلى حيث انتهى — فلا يُولَد IR-0001 تركيبًا وقد سبقه
             DR-0001 تركيبًا في السجل القديم. */
          [['IR','DR'], ['UR','PR'], ['DR','IR']].forEach(function(pr){
            var b = cfgN(v[pr[1]]) || 0;
            if (b > REQSEQ[pr[0]]) REQSEQ[pr[0]] = b;
          });
        }
      }).catch(function(e){ softErr('سحب ترقيم الطلبات', e, 'تعذّر سحبُ آخر رقم طلب — قد يتكرّر الترقيم'); });
      /* الفكُّ والورشةُ (تهيئة وتجميع) كانا يُكتَبان في 'dismantles' و'inventory'
         ولا يُقرآن هنا قطّ — فنقاطُ الفني في هاتين المرحلتين كانت صحيحةً على
         جهاز من سجّلها فقط، وصفرًا على أي جهازٍ آخر يفتح تقرير الأداء. */
      DB.col('dismantles').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.diss) STATE.diss = {};
        sn.forEach(function(d){ STATE.diss[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب سجلات الفك', e, 'تعذّر سحبُ سجلات الفك — أداءُ الفك قد يظهر ناقصًا'); });
      office && DB.col('inventory').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.moves = [];
        sn.forEach(function(d){ STATE.moves.push(d.data()); });
      }).catch(function(e){ softErr('سحب دفتر الحركة', e, 'تعذّر سحبُ دفتر الحركة — أداءُ التهيئة والتجميع قد يظهر ناقصًا'); });
      /* نقاطُ الزيادة اليدوية: سجلٌّ صغيرٌ لا مصفوفةٌ عملاقة — يُقرأ كاملًا كلَّ مرة */
      DB.col('bonus').limit(2000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.bonus = {};
        sn.forEach(function(d){ STATE.bonus[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب نقاط الزيادة', e, 'تعذّر سحبُ نقاط الزيادة — قد تظهر ناقصة'); });
      office && DB.col('workreqs').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        STATE.workReqs = {};
        sn.forEach(function(d){ STATE.workReqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات الورشة', e, 'تعذّر سحبُ طلبات التهيئة والتجميع'); });
      /* الفرقُ والفنيون والكتالوج: نفس الباغ بالضبط، ولم يُصلَح رغم اكتشافه —
         تُكتَب في مجموعة 'settings' وتُقرأ منها 'points' و'reqSeq' فقط.
         فكلُّ فريقٍ أو موظفٍ يُضاف من صفحة «الفرق»، وكلُّ صنفٍ يُعدَّل سعرُه
         من «القطع والأسعار»، يبقى صحيحًا على من كتبه وحده. وبما أن STATE.X
         مصفوفةٌ تتحول كائنًا بمفاتيح رقمية عند الكتابة (Object.assign على
         مصفوفة)، يُعاد بناؤها بترتيب المفاتيح لا تُقرأ ككائن. */
      var arrFromDoc = function(v){
        var ks = Object.keys(v || {}).filter(function(k){ return /^\d+$/.test(k); });
        ks.sort(function(a,b){ return (+a) - (+b); });
        return ks.map(function(k){ return v[k]; });
      };
      DB.col('settings').doc('crews').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.crews = arr; }
      }).catch(function(e){ softErr('سحب الفرق', e, 'تعذّر سحبُ الفرق — قد تظهر بذورها الأصلية فقط'); });
      /* V15.35: قائمةُ الفنيين تُشتقُّ من الحسابات — الوثيقةُ القديمةُ لا
         تُقرأ، وتُترَك حتى يمسحها زرُّ التنظيف من شاشة الحسابات. */
      DB.col('settings').doc('techs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ /* موروثةٌ — تُتجاهَل */ }
      }).catch(function(e){ softErr('سحب الفنيين', e, 'تعذّر سحبُ الفنيين — قد يظهر طاقمٌ ناقص'); });
      DB.col('settings').doc('items').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.items = arr; }
      }).catch(function(e){ softErr('سحب الكتالوج', e, 'تعذّر سحبُ الكتالوج — قد تظهر أصنافه الأصلية فقط'); });
      DB.col('settings').doc('crTime').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.crTime = doc.data();
      }).catch(function(e){ softErr('سحب مواعيد التقارير', e, 'تعذّر سحبُ مواعيد التقارير الدورية'); });
      DB.col('settings').doc('jobs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.jobs = arr; }
      }).catch(function(e){ softErr('سحب الوظائف', e, 'تعذّر سحبُ الوظائف — قد تظهر بذورها الأصلية فقط'); });
      DB.col('settings').doc('vehKinds').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.vehKinds = arr; }
      }).catch(function(e){ softErr('سحب أنواع السيارات', e, 'تعذّر سحبُ أنواع السيارات'); });
      DB.col('settings').doc('lessons').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.lessons = arr; }
      }).catch(function(e){ softErr('سحب سجل الدروس', e, 'تعذّر سحبُ سجل الدروس'); });
      DB.col('settings').doc('escRules').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.escRules = arr; }
      }).catch(function(e){ softErr('سحب قواعد التصعيد', e, 'تعذّر سحبُ قواعد التصعيد'); });
      DB.col('settings').doc('raci').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.raci = arr; }
      }).catch(function(e){ softErr('سحب مصفوفة المسؤوليات', e, 'تعذّر سحبُ مصفوفة RACI'); });
      /* سجلُّ الصور يُسحَب: بدونه يبدأ الترقيمُ من واحدٍ في كلِّ جهازٍ فتُكتَب
         صورتان باسمٍ واحدٍ على الدرايف. */
      /* ═══ فارقيٌّ لا كاملٌ في كلِّ إقلاع (V17.8) ═══
         كان يُسحَب سجلُّ الصور كلُّه عند كلِّ فتحٍ للتطبيق: ستُّمئةٍ وتسعٌ
         وستون قراءةً اليومَ، وآلافٌ في الموسم — لكلِّ جهازٍ في كلِّ مرة.
         وهو لا يُراد لذاته بل لمعرفة آخر رقمٍ لكلِّ نقطةٍ فلا يتكرّر اسمُ
         صورة. والسجلُّ محفوظٌ محليًّا أصلًا، فلا يلزم إلا الجديدُ منذ آخر
         سحبة. والسحبةُ الباردةُ (أوّلُ مرةٍ على الجهاز) محدودةٌ بألفٍ
         وخمسمئةٍ مرتَّبةً بالأحدث — وهي التي تحمل أرقامَ اليوم. */
      if (photosPullAllowed()) readDelta('photos', 'photos', 1500);   /* (V37.18) الميدانُ لا يحمل فهرسَ صور الآخرين */
      /* مفتاحُ التشغيل: يكتبه مديرُ المشروع، ويقرؤه من يُنشئ الحساباتِ ويُعيد
         الكلمات — المشرفُ فما فوق والإدارةُ العليا — فلا يُرسَل أحدٌ إلى GitHub */
      /* (V33.0) كما تسمح القواعدُ حرفًا: مديرُ المشروع والإدارةُ العليا — كان المشرفُ والمهندسُ يطلبانه فتُرفَض القراءةُ ويُسجَّل عطل */
      if (effRole(ROLE) === 'admin' || effRole(ROLE) === 'exec'){
        DB.col('ghcfg').doc('gh').get().then(function(doc){
          FB.readCount = (FB.readCount || 0) + doc.size;
          if (doc && doc.exists){ CFG.gh = doc.data() || {}; }
        }).catch(function(e){ softErr('سحب مفتاح التشغيل', e, ''); });
      }
      readDelta('maints', 'maints', 1000);
      readDelta('msgs', 'msgs', 600);   /* (V38.60) the field chat — history; the last days arrive live */
      /* آخرُ مئتَي خطوةٍ تكفي اللوحات — ولا تُثقِل الإقلاع */
      DB.col('steps').orderBy('at', 'desc').limit(200).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var L = []; sn.forEach(function(dd){ L.push(dd.data()); });
        if (L.length) STATE.steps = L;
        if (CUR === 'now' || CUR === 'over') render(1);
      }).catch(function(e){ softErr('سحب سجل ما تمّ', e, ''); });
      DB.col('settings').doc('coliaison').get().then(function(doc){ if (doc && doc.exists) CFG.coliaison = Object.assign({}, doc.data()); }).catch(function(e){ softErr('سحب ضباط اتصال الشركات', e, ''); });   /* (V28.5) */
      DB.col('settings').doc('cotel').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.cotel = Object.assign({}, doc.data());
      }).catch(function(e){ softErr('سحب دفتر جوالات الشركات', e, 'تعذّر سحبُ جوالات الشركات — أدخلها أو زامِن'); });
      DB.col('settings').doc('miles').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.mileDates = arr; }
      }).catch(function(e){ softErr('سحب مواعيد المعالم', e, 'تعذّر سحبُ مواعيد المعالم — تُشتقّ من المواعيد'); });
      /* البلاغات: من يُصلح يقرأ الكلَّ — وغيرُه لا يقرأ المجموعةَ (القاعدةُ تمنع)
         فيبقى عنده ما كتبه في جهازه */
      (function(){
        var col = DB.col('bugs');
        var q = rankOf(effRole(ROLE)) >= rankOf('engineer')
          ? col.orderBy('at', 'desc').limit(200)
          : col.where('uid', '==', myUid()).limit(50);
        q.get().then(function(sn){
          FB.readCount = (FB.readCount || 0) + sn.size;
          var B = {}; sn.forEach(function(dd){ B[dd.id] = dd.data(); }); STATE.bugs = B; render(1);
        }).catch(function(e){ softErr('سحب البلاغات', e, ''); });
      })();
      DB.col('settings').doc('trials').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var k = doc.data() || {}; if (Array.isArray(k.rows)) STATE.trials = { rows:k.rows, inCost:!!k.inCost, at:k.at, by:k.by }; }
      }).catch(function(e){ softErr('سحب دفتر التجارب', e, ''); });
      DB.col('settings').doc('wtask').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var k = doc.data() || {}; if (Array.isArray(k.rows)) STATE.wtask = { rows:k.rows, at:k.at, by:k.by, meetAt:k.meetAt || 0, meetBy:k.meetBy || '' }; }
      }).catch(function(e){ softErr('سحب المهام الأسبوعية', e, ''); });
      DB.col('settings').doc('wbs').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var w = doc.data() || {}; if (Array.isArray(w.rows)) STATE.wbs = { rows:w.rows, keys:w.keys || [], at:w.at, by:w.by }; }
      }).catch(function(e){ softErr('سحب جدول المتابعة', e, ''); });
      DB.col('settings').doc('risks').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.risks = arr; }
      }).catch(function(e){ softErr('سحب سجل المخاطر', e, 'تعذّر سحبُ سجل المخاطر — قد يظهر بالبذرة'); });
      DB.col('settings').doc('handSeq').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var v = doc.data();
          if (typeof v.n === 'number' && v.n > PV.HAND_SEQ) PV.HAND_SEQ = v.n; }
      }).catch(function(e){ softErr('سحب ترقيم محاضر التسليم', e, 'تعذّر سحبُ آخر رقم محضر — قد يتكرّر الترقيم'); });
      DB.col('settings').doc('patterns').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) STATE.patterns = arr; }
      }).catch(function(e){ softErr('سحب أنماط القطع', e, 'تعذّر سحبُ أنماط القطع — قد تظهر ناقصة'); });
      DB.col('settings').doc('types').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists && Object.keys(doc.data()).length){ STATE.types = doc.data(); typesList(); }
      }).catch(function(e){ softErr('سحب أنواع المواقع', e, 'تعذّر سحبُ أنواع المواقع'); });
      DB.col('settings').doc('mxExtra').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists){ var arr = arrFromDoc(doc.data()); if (arr.length) CFG.mxExtra = arr; }
      }).catch(function(e){ softErr('سحب التركيبات المُعلَنة', e, 'تعذّر سحبُ التركيبات المُعلَنة قبل وصول الموقع'); });
      /* الصلاحياتُ المخصَّصة: تُطبَّق فوق ROLES الافتراضية لا تستبدلها —
         فدورٌ لم يُخصَّص له شيءٌ يبقى على قيمه الأصلية. */
      /* مصفوفةُ الصلاحيات: ما تقبله القاعدةُ لكلِّ دور — تُعرَض بها الشاشة */
      DB.col('settings').doc('perms').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.perms = doc.data();
        PV.PM_AT = Date.now();
      }).catch(function(e){ softErr('سحب مصفوفة الصلاحيات', e, ''); });
      /* الأدوارُ المخصَّصةُ أوّلًا ثم القدراتُ فوقها — أيًّا كان ترتيبُ وصولهما */
      DB.col('settings').doc('roles').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (doc && doc.exists) CFG.roles = doc.data();
        rolesApply();
      }).catch(function(e){ softErr('سحب الأدوار المخصَّصة', e, ''); });
      DB.col('settings').doc('roleCaps').get().then(function(doc){
        FB.readCount = (FB.readCount || 0) + doc.size;
        if (!doc || !doc.exists) return;
        CFG.roleCaps = doc.data();
        rolesApply();
      }).catch(function(e){ softErr('سحب الصلاحيات المخصَّصة', e, 'تعذّر سحبُ تعديلات الصلاحيات — قد تظهر افتراضيةً'); });

      /* بقيةُ المجموعات المكتوبة ولا تُقرأ قط — نفس الباغ في أحد عشر
         موضعًا آخر، اكتُشفت في مراجعةٍ شاملة بعد V14.79/V14.82.
         كلٌّ منها وثيقةٌ واحدةٌ لكلِّ سجلٍّ (لا مصفوفةٌ مجمَّعة) فتُقرأ
         مباشرةً بمعرِّفها. */
      var sAt = (STATE.meta.pullAt || (STATE.meta.pullAt = {})), sSince = (sAt.sites || 0) - 120000, sStart = Date.now();
      var sq = DB.col('sites'); if (sSince > 0) sq = sq.where('_at', '>', sSince);
      sq.limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        sAt.sites = sStart;
        STATE.siteOv = STATE.siteOv || {};
        sn.forEach(function(d){ STATE.siteOv[d.id] = Object.assign({}, STATE.siteOv[d.id] || {}, siteOvDec(d.data())); });   /* (V39.53) */
        /* المخفيُّ يُزال من القائمة هنا — وقبل وصول القاعدة من الحفظ المحليّ */
        var all = STATE.sites.concat(STATE.hiddenSites || []);
        STATE.sites = all; siteOvApply();
        CORE.saveSoon(); statBump();
      }).catch(function(e){ softErr('سحب تعديلات المواقع', e, 'تعذّر سحبُ تعديلات المواقع (العناوين والتصحيحات)'); });

      office && DB.col('purchases').limit(3000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.buys) STATE.buys = {};
        sn.forEach(function(d){ STATE.buys[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب المشتريات', e, 'تعذّر سحبُ دفتر المشتريات'); });

      DB.col('vehicles').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.vehicles) STATE.vehicles = {};
        sn.forEach(function(d){ STATE.vehicles[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب السيارات', e, 'تعذّر سحبُ سجل السيارات'); });

      DB.col('vehAsn').limit(2000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.vehAsn) STATE.vehAsn = {};
        sn.forEach(function(d){ STATE.vehAsn[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب إسناد السيارات', e, 'تعذّر سحبُ عهدة السيارات'); });

      office && DB.col('ships').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.ships) STATE.ships = {};
        sn.forEach(function(d){ STATE.ships[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب الشحنات', e, 'تعذّر سحبُ سجل الشحنات'); });

      office && DB.col('coreqs').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.coreqs) STATE.coreqs = {};
        sn.forEach(function(d){ STATE.coreqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات الشركات', e, 'تعذّر سحبُ طلبات إضافة الشركات'); });

      office && DB.col('fixreqs').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.fixreqs) STATE.fixreqs = {};
        sn.forEach(function(d){ STATE.fixreqs[d.id] = d.data(); });
      }).catch(function(e){ softErr('سحب طلبات التصويب', e, 'تعذّر سحبُ طلبات تصويب البيانات'); });

      (office || ROLE === 'viewer') && DB.col('newsites').limit(1000).get().then(function(sn){   /* (V37.69) والوزارةُ ترى مقترحاتِها */
        FB.readCount = (FB.readCount || 0) + sn.size;
        if (!STATE.newsites) STATE.newsites = {};
        sn.forEach(function(d){ STATE.newsites[d.id] = d.data(); });
        /* ═══ الجديدُ يعود إلى السجل لا إلى رفٍّ جانبيّ (V17.46) ═══
           كانت النقطةُ تُدفَع إلى STATE.sites في الجلسة التي أُنشئت فيها ثم
           تُكتَب في newsites؛ فإذا أُعيد تحميلُ التطبيق عادت المجموعةُ إلى
           STATE.newsites وحدَها — فتختفي النقطةُ من الخريطة والقوائم وهي في
           القاعدة سليمة، ويُظنُّ أنها ضاعت. صارت تُدمَج في السجل عند كلِّ
           إقلاع: ما لم يكن فيه، ولا يُكرَّر ما هو فيه. */
        /* (V36.7) بلاغُ المالك: «المسح للنقاط لو مسح من عند مهندس بترجع تاني» — النقطةُ المضافةُ المحذوفة تُنقَل إلى «المخفية» فلا تكون
           في STATE.sites، فكان هذا الدمجُ يراها جديدةً ويعيدها إلى القائمة (والإخفاءُ في تجاوزها لا في وثيقتها). صار المخفيُّ معروفًا هنا،
           وتجاوزُ hidden يُبقيها مخفية. */
        var have = {}; (STATE.sites || []).forEach(function(x){ have[x.id] = 1; }); (STATE.hiddenSites || []).forEach(function(x){ have[x.id] = 1; });
        var add = 0;
        Object.keys(STATE.newsites).forEach(function(k){
          var v = STATE.newsites[k];
          if (typeof propIs === 'function' && propIs(v)){ propKeep(v); return; }   /* (V37.69) مقترحةُ الوزارة لا تدخل السجلَّ قبل الاعتماد */
          var ovh = v && v.id && (STATE.siteOv || {})[v.id]; if (ovh && (ovh.hidden || ovh.deleted)) return;   /* محذوفةٌ (إخفاءً أو نهائيًّا) — لا تعود */
          if (v && v.id && have[v.id]){   /* (V22.9) ما دُمج من قبل يأخذ تعديلَ السحابة: الموقعُ والاسمُ والإخفاء — وإلا بقيت النقطةُ حيث كانت */
            var ex = siteFind(v.id);
            if (ex){
              if (v.hidden || v.deleted){ STATE.sites = STATE.sites.filter(function(x){ return x.id !== v.id; }); add++; return; }   /* (V25.5) والمحذوفُ نهائيًّا */
              var ovm = (STATE.siteOv || {})[v.id];   /* (V32.2) موضعٌ حرّكه أحدٌ (تجاوز) يغلب إحداثيةَ الوثيقة */
              if (!(ovm && +ovm.lat && +ovm.lng) && +v.lat && +v.lng && (+ex.lat !== +v.lat || +ex.lng !== +v.lng)){ ex.lat = +v.lat; ex.lng = +v.lng; add++; }
              if (v.name && ex.name !== v.name){ ex.name = v.name; add++; }
            }
            return;
          }
          if (!v || !v.id || v.hidden || v.deleted || have[v.id] || !(+v.lat) || !(+v.lng)) return;   /* المخفيُّ والمحذوفُ لا يُدمَجان (V22.2، V25.5) */
          var ovn = (STATE.siteOv || {})[v.id]; if (ovn) v = Object.assign({}, v, ovn);   /* تجاوزُ المكتب (التصنيف…) فوق الوثيقة (V23.0) */
          STATE.sites.push(v); have[v.id] = 1; add++;
        });
        if (add){ SITE_IX = null; SITE_TOK = null; statBump(); render(1); if (typeof mapPaint === 'function') mapPaint(); }
      }).catch(function(e){ softErr('سحب المواقع الجديدة', e, 'تعذّر سحبُ طلبات تسجيل مواقع جديدة'); });

      office && DB.col('changes').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        CHANGES.length = 0;
        arr.forEach(function(x){ CHANGES.push(x); });
      }).catch(function(e){ softErr('سحب ضبط التغيير', e, 'تعذّر سحبُ سجل طلبات التغيير'); });

      office && DB.col('ncr').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        NCRS.length = 0;
        arr.forEach(function(x){ NCRS.push(x); });
      }).catch(function(e){ softErr('سحب عدم المطابقة', e, 'تعذّر سحبُ سجل عدم المطابقة'); });

      DB.col('ipc').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        IPCS.length = 0;
        arr.forEach(function(x){ IPCS.push(x); });
      }).catch(function(e){ softErr('سحب المستخلصات', e, 'تعذّر سحبُ سجل المستخلصات'); });

      DB.col('hse').limit(1000).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var arr = [];
        sn.forEach(function(d){ arr.push(d.data()); });
        arr.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
        HSE.incidents.length = 0;
        HSE.lost = 0;
        arr.forEach(function(x){ HSE.incidents.push(x); HSE.lost += cfgN(x.lost); });
      }).catch(function(e){ softErr('سحب حوادث السلامة', e, 'تعذّر سحبُ سجل حوادث السلامة'); });

      DB.col('baseline').limit(200).get().then(function(sn){
        FB.readCount = (FB.readCount || 0) + sn.size;
        var latest = null;
        sn.forEach(function(d){
          var v = d.data();
          if (!latest || (v.ver || 0) > (latest.ver || 0)) latest = v;
        });
        if (latest) BASE = latest;
      }).catch(function(e){ softErr('سحب خط الأساس', e, 'تعذّر سحبُ خط الأساس المجمَّد'); });
      /* اللقطاتُ: ثلاثون وثيقةً تكفي اللوحةَ التاريخيةَ كلَّها */
      return DB.col('stats').orderBy('day', 'desc').limit(30).get()
        .then(function(sn){
          if (!STATE.stats) STATE.stats = {};
          sn.forEach(function(d){ STATE.stats[d.id] = d.data(); });
          FB.readCount = (FB.readCount || 0) + sn.size;
        }).catch(function(e){ softErr('سحب اللقطات اليومية', e, 'تعذّر سحبُ اللقطات — اللوحةُ التاريخيةُ قد تظهر خاليةً'); });
    }).then(function(){
      return DB.col('settings').doc('points').get();
    }).then(function(doc){
      if (doc && doc.exists){
        var v = doc.data();
        Object.keys(v).forEach(function(k){ if (k in CFG) CFG[k] = v[k]; });
      }
      PV.CFG_PULLED = true; STATE.meta.lastSync = Date.now();
      return true;
    }).catch(function(e){
      /* بلا إعداداتٍ يعمل النظامُ بأوزانٍ صفرٍ وحدودِ اعتمادٍ صفر — ويبدو
         سليمًا. فكلُّ رقمٍ بعدها خطأٌ لا يُشَكُّ فيه. */
      softErr('سحب الإعدادات', e, 'تعذّر جلبُ الإعدادات — الأوزانُ والحدودُ قد تكون غيرَ محدَّثة');
      return false;
    });
  }
};
