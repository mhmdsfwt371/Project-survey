/* ============================================================================
   FILE    : src/03z-shared/03z-shared-14-from-tasks-office-14-pull-scope-listen-map.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-14-pull-scope-listen-map.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ALL_WORK, pullScope, treeKeys, chunk30, treeQuery, pullDelta, READ_CAP_WARN, READ_CAP_SLOW, READ_DAY, READ_DAY_N, READ_WARNED, readBudget, readSlowFactor, readDelta … (+30 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نطاقُ السحب — V16.11 ═══
   كان كلُّ من رتبتُه فوق المشرف يسحب السجلاتِ كلَّها خامًّا كلَّ خمس دقائق، ويُنصِت
   إليها كلِّها فوق ذلك — فتُحسَب القراءةُ مرتين على كلِّ جهازٍ من ثلاثةٍ وعشرين،
   وميزانيةُ اليوم تسعةُ أضعافِ الحصة. صار:
   · الإدارةُ (مديرُ المشروع والإدارةُ العليا وصاحبُ المشروع): الكلُّ خامًّا.
   · من دونها إلى المشرف: **شجرتُه** — من تحته إلى آخر الفرع (underNames)، لا غير.
   · الوزارةُ: الأرقامَ وحدَها. · الميدانُ: ما كتبه هو، كلَّ نصف ساعة.
   ومن له إنصاتٌ حيٌّ لا يسحب دوريًّا — الإنصاتُ يسلّم التغييرَ مرةً، والسحبُ
   شبكةُ أمانٍ كلَّ ستِّ ساعاتٍ وعند الطلب. */
var ALL_WORK = ['recs','inss','tasks','dismantles','maints'];

function pullScope(){
  var r = effRole(ROLE);
  /* المهندسون كالإدارة: أيُّ نقطةٍ تُنجَز تصل اعتمادُها كلَّ مهندسٍ لا مهندسَ شجرتها
     وحدَه — قرارُ صاحب المشروع، وثمنُه على Blaze سنتاتٌ لا سقف */
  /* الأثرُ التدقيقيُّ للمكتب: من فعل ماذا ومتى — يُقرأ ولا يُكتَب إلا ممن يعمل */
  if (r === 'exec' || r === 'admin' || isBossHere() || rankOf(ROLE) >= rankOf('engineer')) return { cols:ALL_WORK.concat(['events']), mine:false, tree:false, every:600000 };
  /* والمشرفون كذلك: قرارُ صاحب المشروع أن يرى المشرفُ زياراتِ الفنيّين كلَّها لا
     فنيّيه وحدَهم — فمشرفٌ يفتح الخريطةَ يرى ما تمّ في المشعر كلِّه لا جزءًا منه.
     والشجرةُ تبقى للتكليف والمتابعة (لوحةُ الفريق) لا للرؤية. */
  if (rankOf(ROLE) >= rankOf('supervisor')) return { cols:ALL_WORK, mine:false, tree:false, every:600000 };
  /* الوزارةُ: الأرقامُ لِلَوحاتها، والزياراتُ والتركيباتُ لتلوين الخريطة — قراءةً
     فقط. وكانت تسحب اللقطاتِ وحدَها فتظهر لها الخريطةُ رماديةً بلا حالة. */
  /* الوزارةُ تُسلَّم حساباتِها وتسأل: ماذا انتهى، وماذا يجري الآن ومن يفعله،
     وماذا سيحدث غدًا — والمهامُّ والفكُّ والصيانةُ جزءٌ من الجواب. تقرأ العملَ كلَّه
     كالمكتب وتُنصِت إليه لحظةً بلحظة، ولا تكتب حرفًا: القاعدةُ تمنعها. */
  if (r === 'viewer') return { cols:ALL_WORK.concat(['stats']), mine:false, tree:false, every:600000 };
  /* الميدانُ يُنصِت إلى ما كتبه هو (اعتمادٌ أو ردٌّ من المكتب يصل حيًّا) — والسحبُ
     الدوريُّ كان ثمانيةً وأربعين استعلامًا فارغًا في اليوم لكلِّ جهازٍ من مئةٍ وربع */
  return { cols:['recs','inss','dismantles','maints'], mine:true, tree:false, every:21600000 };
}

/* شجرتي في القاعدة: المعرِّفاتُ لمن كتب، والأسماءُ لمن أُسنِد إليه — وأنا معهم */
function treeKeys(){
  var names = underNames(STATE.meta.name || ''), U = STATE.users || {}, uids = [];
  Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name && names.indexOf(u.name) > -1) uids.push(k); });
  if (STATE.meta.uid) uids.push(STATE.meta.uid);
  if (STATE.meta.name) names = names.concat([STATE.meta.name]);
  return { uids:uids, names:names, sig:uids.slice().sort().join('|') };
}

/* «in» في القاعدة ثلاثون قيمةً في الاستعلام — فتُقسَّم */
function chunk30(a){ var out = []; for (var i = 0; i < a.length; i += 30) out.push(a.slice(i, i + 30)); return out; }

function treeQuery(c, k){ return { fld: c === 'tasks' ? 'to' : '_by', keys: c === 'tasks' ? k.names : k.uids }; }

function pullDelta(opt){
  if (!FB.ready || !FB.db) return Promise.resolve(0);
  var sc = pullScope(), got = 0, me = STATE.meta.uid, T_P0 = Date.now();
  var _perfDone = function(v){ perfNote('p', Date.now() - T_P0); return v; };
  /* سحبٌ موجَّه: النبضةُ تقول أيَّ مجموعاتٍ تغيّرت فتُسحَب هي وحدَها (V17.26) */
  if (opt && Array.isArray(opt.only) && opt.only.length)
    sc = Object.assign({}, sc, { cols:sc.cols.filter(function(c){ return opt.only.indexOf(c) > -1; }) });
  var at = STATE.meta.pullAt || (STATE.meta.pullAt = {});
  var wasAsk = SYNC.pullAsk; SYNC.pullAsk = false;
  if (!sc.cols.length){ STATE.meta.lastSync = Date.now(); return Promise.resolve(0); }
  /* ═══ المؤشِّرُ يتبع النطاق ═══
     الفارقيُّ يجلب ما كُتب بعد آخر سحبة. فإن اتّسع النطاقُ — شجرةٌ تغيّرت، أو
     مشرفٌ صار يرى الكلَّ بعد أن كان يرى فنيّيه، أو رُقّي دورُه — بقي المؤشِّرُ
     على حاله فلا يُجلَب إلا الجديدُ، وما كتبه الآخرون **قبل** التوسيع لا يصل
     أبدًا: يفتح المشرفُ الخريطةَ فيرى شغلَه وحدَه ويظنُّ الصلاحيةَ ناقصة.
     فالبصمةُ صارت للنطاق كلِّه — أيُّ تبدّلٍ فيه يُصفّر المؤشِّرَ ويسحب باردًا. */
  var tk = sc.tree ? treeKeys() : null;
  var sig = effRole(ROLE) + '|' + sc.cols.join(',') + '|' + (sc.mine ? 'mine' : 'all') + '|' + (tk ? tk.sig : '-');
  if (at.__sig !== sig){ sc.cols.forEach(function(c){ delete at[c]; }); at.__sig = sig; COLD_N++; }
  /* (V37.24 المرحلة ١) السحبةُ على دفعتين: ما تحتاجه الخريطةُ والميدانُ أوّلًا (الزيارات والتركيبات والمهام والمواقع) فتُرسَم،
     ثم الباقي — فالجهازُ البطيءُ يعمل بعد ثوانٍ لا بعد السحبة كلِّها (كانت جهازٌ واحدٌ ١٠٢ ثانية) */
  var FIRST = { recs:1, inss:1, tasks:1, sites:1, newsites:1 }, colsA = sc.cols.filter(function(c){ return FIRST[c]; }), colsB = sc.cols.filter(function(c){ return !FIRST[c]; });
  var pullOne = function(c){
    var key = PULL_COL[c] || c;
    if (!STATE[key]) STATE[key] = {};
    var start = Date.now();
    var since = (at[c] || 0) - 120000;
    var qs = [];
    if (tk){
      var tq = treeQuery(c, tk);
      chunk30(tq.keys).forEach(function(k){ qs.push(DB.col(c).where(tq.fld, 'in', k)); });
    } else {
      var q = DB.col(c);
      if (sc.mine && c !== 'stats' && me) q = q.where('_by', '==', me);
      qs.push(q);
    }
    if (!qs.length) return Promise.resolve();
    /* السحبةُ الباردةُ بلا سقفٍ يقطع: ألفٌ وسبعمئةٌ زيارةٌ لا تُقصّ عند خمسمئة */
    return Promise.all(qs.map(function(q){
      if (since > 0) q = q.where('_at', '>', since);
      return q.limit(since > 0 ? 2000 : 6000).get().then(function(snap){
        FB.readCount = (FB.readCount || 0) + snap.size;
        snap.forEach(function(doc){ if (CORE.applyDoc(key, doc.id, doc.data())) got++; });   /* (V37.24) كانت القراءةُ تُعَدّ مرتين */
      });
    })).then(function(){ at[c] = start; }).catch(function(e){
      /* بلا هذا يقف السحبُ صامتًا: المكتبُ يفتح فلا يجد ما رفعه الميدانُ
         ولا يعرف أن السحبَ سقط أصلًا. */
      softErr('سحب ' + c, e, 'تعذّر سحبُ بعض البيانات — جرّب المزامنةَ يدويًّا');
    });
  };
  return Promise.all(colsA.map(pullOne)).then(function(){
    if (got && colsB.length){ statBump(); if (typeof render === 'function') render(1); }   /* الخريطةُ تُرسَم بما وصل */
    return Promise.all(colsB.map(pullOne));
  }).then(function(){
    STATE.meta.lastSync = Date.now();
    SYNC.pullLast = Date.now();
    if (got || wasAsk){ statBump(); CORE.saveSoon(); }
    return _perfDone(got);
  });
}

/* السقفان (V17.36): كان الإبطاءُ عند ستة آلافٍ وبمعامل أربعة — فأصاب جهازَ
   مدير المشروع في يومٍ عاديٍّ (سحبةٌ باردةٌ وسجلُّ صورٍ وسجلُّ أحداث) وصار
   «السحبُ التالي» أربعين دقيقةً بلا تفسير. الإبطاءُ لجهازٍ جامحٍ لا لمن يعمل:
   خمسةَ عشرَ ألفًا في اليوم، وبمعامل اثنين لا أربعة، ويُقال السببُ في الشريط. */
var READ_CAP_WARN = 5000, READ_CAP_SLOW = 15000, READ_DAY = '', READ_DAY_N = 0, READ_WARNED = 0;

function readBudget(){
  var day = dayKey(Date.now());
  if (READ_DAY !== day){ READ_DAY = day; READ_DAY_N = FB.readCount || 0; READ_WARNED = 0; }
  var n = (FB.readCount || 0) - READ_DAY_N;
  rdhTick();
  if (n > READ_CAP_SLOW && READ_WARNED < 2){
    READ_WARNED = 2;
    /* (V33.1) قرارُ المالك ق-٠١١: الخطةُ بالاستهلاك — يُسجَّل للعلم ولا يُبطَّأ سحبُ الجهاز (كان يُضاعَف موعدُه فيتأخّر الميدان) */
    logEvent('جهازٌ تجاوز سقفَ القراءات — ' + nm(n) + ' قراءةً اليوم · للعلم، لا إبطاء');
    toast(t('هذا الجهازُ يقرأ أكثرَ من المعتاد اليوم') + ': ' + nm(n));
  } else if (n > READ_CAP_WARN && READ_WARNED < 1){
    READ_WARNED = 1;
    toast(t('قراءاتُ هذا الجهاز اليوم') + ': ' + nm(n) + ' — ' + t('تُراقَب'));
  }
  return n;
}

function readSlowFactor(){ readBudget(); return 1; }
/* (V38.92) a live listener's reads: Google bills the documents a snapshot brings from the server (all of them the first
   time, the changed ones after) — and the counter only knew the pulls. On 22 October Google counted ~1.1 million reads,
   99% queries, in Saudi working hours, while the phones' counters summed 28 thousand: the listeners were invisible. */
function snapReads(sn){
  try {
    if (!sn || (sn.metadata && sn.metadata.fromCache)) return;
    var n = typeof sn.docChanges === 'function' ? sn.docChanges().length : 1;
    FB.readCount = (FB.readCount || 0) + Math.max(1, n);
  } catch (e){ LS_ERR = e; }
}

/* ═══ (V38.80) Each device's reads, day by day ═══
   readBudget counted today's reads for this session only, and the presence beat sent that one number — overwritten
   the next day — so nothing kept a device's reads per day, and the owner could not tell what a period cost.
   Each device now adds what it read since the last tick into a per-day map in localStorage, keyed by Google's
   billing day (America/Los_Angeles: the free quota resets at midnight Pacific, ~10:00 in Makkah), and the beat
   carries the last seven days as one string field per device (rdh_<device>). A string is replaced whole on the
   merged write, so the field never grows, and a second device of the same user writes its own field. The server
   job (scripts/usage-cost.mjs) folds these into settings/cost next to Google's own totals. */
function billDay(ts){
  var d = new Date(+ts || Date.now());
  try {
    if (!billDay.fmt) billDay.fmt = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Los_Angeles', year:'numeric', month:'2-digit', day:'2-digit' });
    var s = billDay.fmt.format(d);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  } catch (e){}
  return new Date(d.getTime() - 7 * 3600000).toISOString().slice(0, 10);
}
function rdhTick(save){
  var RDH = FB.rdh || (FB.rdh = { last:0, map:null, saved:0 });   /* the day log sits beside the counter it reads */
  if (!RDH.map){ try { RDH.map = JSON.parse(lsGet('nsk14.rdh') || '{}') || {}; } catch (e){ RDH.map = {}; } }
  var cur = (typeof FB === 'object' && FB.readCount) || 0;
  if (cur < RDH.last) RDH.last = 0;                       /* the session counter was reset */
  var inc = cur - RDH.last;
  if (inc > 0){ var d = billDay(); RDH.map[d] = (+RDH.map[d] || 0) + inc; RDH.last = cur; }
  if (save || Date.now() - RDH.saved > 60000){
    RDH.saved = Date.now();
    var o = {}; Object.keys(RDH.map).sort().slice(-40).forEach(function(k){ o[k] = RDH.map[k]; });
    RDH.map = o; lsSet('nsk14.rdh', JSON.stringify(o));
  }
  return RDH.map;
}
function rdhLast(n){
  var m = rdhTick(true), o = {};
  Object.keys(m).sort().slice(-(n || 7)).forEach(function(k){ o[k] = m[k]; });
  return JSON.stringify(o);
}
function rdhKey(){ return 'rdh_' + (String(typeof DEV_ID === 'string' ? DEV_ID : '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16) || 'dev'); }
if (typeof document === 'object' && document.addEventListener)
  document.addEventListener('visibilitychange', function(){ if (document.hidden) rdhTick(true); }, { passive:true });

/* (V33.1) ق-٠١١: لا إبطاءَ — العدُّ والتنبيهُ يبقيان */
function readDelta(col, key, cap){
  if (!FB.ready || !FB.db) return;
  if (!STATE[key]) STATE[key] = {};
  var at = STATE.meta.pullAt || (STATE.meta.pullAt = {});
  var since = (at['@' + col] || 0) - 120000, start = Date.now();
  var q = DB.col(col);
  q = since > 0 ? q.where('_at', '>', since).limit(cap)
                : q.orderBy('_at', 'desc').limit(cap);
  q.get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    sn.forEach(function(dd){ STATE[key][dd.id] = key === 'photos' ? photoSlim(dd.data()) : dd.data(); });   /* (V37.13) كانت القراءةُ تُعَدّ مرتين · (V37.18) الصورُ بلا خام */
    if (key === 'photos' && sn.size) PH_DIRTY = true, phTouch();
    at['@' + col] = start; CORE.saveSoon();
  }).catch(function(e){
    /* لا مؤشِّرَ على وثائقَ قديمةٍ كُتبت قبل المؤشِّر: تُسحَب مرةً بالأحدث */
    if (since > 0){ at['@' + col] = 0; readDelta(col, key, cap); return; }
    softErr('سحب ' + col, e, '');
  });
}

/* ═══ الإنصاتُ لنبضة التغيير (V17.26) ═══
   وثيقةٌ واحدةٌ تُراقَب: settings/pulse. لا تكلّف قراءةً وهي ساكنة، وحين
   تتغيّر يُقارَن وقتُ كلِّ مجموعةٍ فيها بمؤشِّر سحبِ هذا الجهاز؛ فإن كان في
   القاعدة أحدثُ مما عندنا سُحب فارقُ تلك المجموعة وحدَها — مجمَّعًا بثانيتين
   حتى لا تتوالى السحباتُ على دفعةٍ من عشر وثائق. */
var PULSE_UNSUB = null, PULSE_T = 0, PULSE_LAST = 0;

function pulseWatch(){
  if (!FB.ready || !FB.db || PULSE_UNSUB) return;
  try {
    PULSE_UNSUB = DB.col('settings').doc('pulse').onSnapshot(function(doc){
      snapReads(doc);
      if (!doc.exists || (doc.metadata && doc.metadata.fromCache)) return;
      FB.readCount = (FB.readCount || 0) + 1;
      var p = doc.data() || {}, at = STATE.meta.pullAt || {}, mine = pullScope().cols || [];
      var stale = mine.filter(function(col){ return (+p[col] || 0) > (+at[col] || 0); });
      if (!stale.length) return;
      PULSE_LAST = Date.now();
      clearTimeout(PULSE_T);
      PULSE_T = setTimeout(function(){
        if (typeof pullDelta === 'function') pullDelta({ only:stale, why:'pulse' }).then(function(n){
          if (n && CUR === 'map' && typeof mapPaint === 'function') mapPaint();
          else if (n) render(1);
        }).catch(function(e){ softErr('سحب التغييرات', e, ''); });
      }, 2000);
    }, function(e){ softErr('الإنصاتُ للتغييرات', e, ''); });
  } catch (e){ softErr('الإنصاتُ للتغييرات', e, ''); }
}

function pulseStop(){ if (PULSE_UNSUB){ try { PULSE_UNSUB(); } catch (e){ LS_ERR = e; } PULSE_UNSUB = null; }
  if (BRIDGE_UNSUB){ try { BRIDGE_UNSUB(); } catch (e){ LS_ERR = e; } BRIDGE_UNSUB = null; } }

/* ختمُ الجسر: وثيقةٌ واحدةٌ يكتبها الخادمُ بعد كلِّ تشغيلٍ — تُقرأ عند تغيّرها فقط (V17.39) */
var BRIDGE_UNSUB = null;

function bridgeWatch(){
  if (!FB.ready || !FB.db || BRIDGE_UNSUB) return;
  try {
    BRIDGE_UNSUB = DB.col('settings').doc('bridge').onSnapshot(function(doc){
      snapReads(doc);
      if (!doc.exists || (doc.metadata && doc.metadata.fromCache)) return;
      FB.readCount = (FB.readCount || 0) + 1;
      STATE.bridge = doc.data() || {};
      if (CUR === 'sys') render(1);
    }, function(e){ softErr('ختم الجسر', e, ''); });
  } catch (e){ softErr('ختم الجسر', e, ''); }
}

/* استماعٌ حيٌّ محدودٌ بما يخصّ المستخدم — لا بالمجموعة كلها */
var LIVE = [];

function liveWatch(){
  if (!FB.ready || !FB.db || LIVE.length) return;
  try{
    /* الحقلُ في المهمة اسمٌ (to/assignedTo) والمقارنةُ كانت بالمعرِّف — فلم
       يُطابَق شيءٌ قطُّ ولم تصل مهمةٌ ولا حذفٌ حيًّا: يرى الفنيُّ إسنادًا
       مُسح من المكتب أيامًا. */
    var me = STATE.meta.name || '\u0000';
    LIVE.push(DB.col('tasks').where('assignedTo', '==', me).limit(200)
      .onSnapshot(function(snap){
        snapReads(snap);
        snap.docChanges().forEach(function(ch){
          if (ch.type === 'removed'){ delete STATE.tasks[ch.doc.id]; if (typeof TK_IX !== 'undefined') TK_IX = null; }
          else CORE.applyDoc('tasks', ch.doc.id, ch.doc.data());
        });
        statBump();
        if (['map','sites','mywork'].indexOf(CUR) > -1) render();
      }, function(e){
        /* الاستماعُ إن مات لم تصل المهامُّ الجديدةُ ولا شيءَ يقول */
        softErr('الاستماع الحيّ', e, 'انقطع الاستماعُ الحيّ — المهامُّ الجديدةُ قد تتأخّر');
      }));
  }catch(e){
    /* التجهيزُ إن مات لم يُنشَأ استماعٌ أصلًا — فلا مهامَّ تصل ولا خطأ يُرى */
    softErr('تجهيز الاستماع', e, 'تعذّر الاستماعُ الحيّ — زامِن يدويًّا لتصلك المهامّ');
  }
}

function liveStop(){
  LIVE.forEach(function(u){ try{ u(); }catch(e){} });
  LIVE = [];
}

/* ═══ الخريطة — Leaflet بطبقتين ومضلّعات المخيمات ═══
   البلاطات بلا مفتاح: OpenStreetMap أساسًا وEsri بديلًا عند التعثّر.
   والوضع الليلي مرشّحٌ على طبقة الأساس وحدها فلا يُقلَب ما فوقها. */

var MAP_ME = null;

var MAP = null, MAP_LAYER = null, MAP_TMP = null, MAP_BASE = null, MAP_POLY = null, MAP_CV = null, MAP_ME_LL = null;

var MAP_READY = false, MAP_LOADING = false;

/* حدُّ رسمِ حدود المخيمات — مصدرٌ واحدٌ يقرؤه الرسمُ والتحميلُ معًا (قرارٌ قائم: المخيمُ بحدوده عند ١٢ فتبقى متفرّدةً).
   (V25.3) قياس: عند ١٢ نحو ١٬٤٠٠ مضلّعٍ تُنشأ وتُقصّ وتُرسَم مع كلِّ حركة — رفعُ الحدِّ إلى ١٤ يُسرّع التبعيدَ كثيرًا، وهو قرارٌ للمالك */
var POLY_Z = 12;

var POLY = null, POLY_LOADING = null;

/* بيانةُ الموسم الماضي التي كان الفنيُّ يقرؤها في القديم: الجنسيةُ والسعةُ
   المسجَّلةُ والجهةُ والمتعهّد وما بقي مفتوحًا. سقطت عند إعادة البناء لأن
   الأعمدةَ اختُصرت، فصار الفنيُّ يقف أمام مخيمٍ لا يعرف عنه ما كان يعرفه. */
var S47 = null, S47_LOADING = null;

function s47Of(id){ return S47 ? (S47[id] || null) : null; }

function s47Load(){
  if (S47) return Promise.resolve(true);
  if (S47_LOADING) return S47_LOADING;
  S47_LOADING = idbGet('s47').then(function(v){
    if (v){ S47 = v; return true; }
    return fetch('season1447.json').then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (!j) return false; S47 = j; idbSet('s47', j); return true; });
  }).catch(function(e){
    softErr('بيانة الموسم الماضي', e, 'تعذّر جلبُ بيانة الموسم الماضي — النموذجُ يعمل بدونها');
    return false;
  }).then(function(ok){ if (ok && CUR === 'svForm') render(1); return ok; });
  return S47_LOADING;
}

/* المضلّعات ملفٌّ خارجيٌّ يُطلَب مرةً ويُخزَّن محليًّا */
function polyLoad(){
  if (POLY) return Promise.resolve(true);
  if (POLY_LOADING) return POLY_LOADING;
  POLY_LOADING = idbGet('poly').then(function(v){
    if (v){ POLY = v; return true; }
    return fetch('poly.json').then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if (!j) return false;
        POLY = j;
        idbSet('poly', j);
        return true;
      });
  }).catch(function(e){
    softErr('حدود المخيمات', e, 'تعذّر جلبُ حدود المخيمات — الخريطةُ تعمل بلا حدود');
    return false;
  }).then(function(ok){ if (ok && MAP) mapPaint(); return ok; });
  return POLY_LOADING;
}

var TILES = {
  osm:  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

/* ألوان الحالة — المسح ثنائيٌّ والتركيب رباعي */
var MAP_COL = {
  survey:  { 'لم يُزر':'#E8C34B', 'تمت الزيارة':'#4BC9F5' },
  install: { 'لم يبدأ':'#9FB0AA', 'مجدول':'#FF8C42', 'مُركّب':'#3AD6A0', 'متعذّر':'#E05252' }
};
