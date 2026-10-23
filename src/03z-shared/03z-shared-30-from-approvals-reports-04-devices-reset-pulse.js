/* ============================================================================
   FILE    : src/03z-shared/03z-shared-30-from-approvals-reports-04-devices-reset-pulse.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-04-devices-reset-pulse.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : appVer, agoTxt, PRES, presenceBeat, presenceFetch, presenceRows, WIPE_KEYS, SYSREP, sysReportFetch
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نسخُ الأجهزة: كلُّ جهازٍ يقول نسختَه ═══
   كانت شريحةُ «نسخ الأجهزة» جدولًا مكتوبًا بيدٍ من عهد V14: اسمان ونسختان
   وإنذارٌ ثابت — فتقول للمكتب إن صاحبَ المشروع على إصدارٍ قديمٍ وهو على
   أحدثِ نسخة. صار كلُّ جهازٍ يكتب وثيقةَ حضوره `presence/{uid}` عند الدخول
   ثم كلَّ نصفِ ساعة: النسخةُ والدورُ والاسمُ والوقتُ ومعرِّفُ الجهاز — فيُقرأ
   من علِق على إصدارٍ قديمٍ من القاعدة لا من التخمين. والنسخةُ تُقرأ من
   الرأس نفسِه لا من ثابتٍ يشيخ. */
function appVer(){
  var b = document.querySelector('.ver-tag');
  if (b && b.getAttribute('data-v')) return b.getAttribute('data-v');   /* (V39.5) the pill shows it in the user's language */
  var m = /V\d+\.\d+/.exec((b && b.textContent) || document.title || '');
  return m ? m[0] : '';
}

function agoTxt(ts){
  if (!ts) return '—';
  var m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t('الآن');
  if (m < 60) return t('منذ') + ' ' + nm(m) + ' ' + t('د');
  var h = Math.round(m / 60);
  if (h < 48) return t('منذ') + ' ' + nm(h) + ' ' + t('س');
  return t('منذ') + ' ' + nm(Math.round(h / 24)) + ' ' + t('يوم');
}

var PRES = { at:0, ver:'', fetchAt:0 };

function presenceBeat(force){
  var u = myUid();
  if (!u) return false;
  try { if (typeof meActivatedCheck === 'function') meActivatedCheck(); } catch (e){ if (typeof softErr === 'function') softErr('activatedCheck', e, ''); }   /* هل فُعِّل الحسابُ؟ (V17.93) */
  var ver = appVer();
  if (!force && PRES.ver === ver && Date.now() - PRES.at < 10 * 60000) return false;
  PRES.at = Date.now(); PRES.ver = ver;
  var doc = { uid:u, name:STATE.meta.name || '', role:ROLE, ver:ver, at:Date.now(), reads:(typeof FB === 'object' && FB.readCount) || 0,
              day:dayKey(), dev:DEV_ID,
              ua:String((typeof navigator === 'object' && navigator.userAgent) || '').slice(0, 80),
              /* الاستهلاكُ والأداءُ والأعطالُ من الجهاز نفسِه (V17.34) */
              q:(STATE.queue || []).filter(function(it){ return it.kind !== 'presence' && it.kind !== 'stats'; }).length,
              pz:(STATE.poison || []).length,
              pq:(typeof PHOTO_Q === 'object' && PHOTO_Q.length) || 0, pqAge:phQueueAge() /* (V37.8) دقائقُ أقدمِ صورةٍ معلّقة */, pfl:(typeof PHOTO_FAIL === 'object' && PHOTO_FAIL.length) || 0 /* (V31.1) كان `pf` فيمحوه مفتاحُ الأداء */,
              err:Object.keys(typeof ERR_SEEN === 'object' ? ERR_SEEN : {}).length,
              rms:perfAvg('r'), pms:perfAvg('p'), pulse:!!PULSE_UNSUB, up:Math.round((Date.now() - BOOT_AT) / 60000),
              /* قراءاتُ اليوم لا الجلسة — الجلسةُ قد تمتدّ أيامًا فيبدو الرقمُ فادحًا (V17.36) —
                 وعددُ السحبات الباردة: هي ما يرفع القراءاتِ بالآلاف */
              rd:(typeof readBudget === 'function' ? readBudget() : 0), cp:COLD_N,
              ps:(typeof PERSIST === 'object' ? PERSIST.st : ''), ib:IDB_BAD ? 1 : 0,   /* التخزينُ الدائمُ والمخزنُ المحلي (V17.93) */
              pg:(typeof pageUse === 'function' ? pageUse().n : {}),                       /* فتحُ الصفحات اليومَ (V17.95) */
              pf:(typeof perfSummary === 'function' ? perfSummary() : null),               /* مؤشّراتُ الأداء (V17.98) */
              on:(typeof navigator === 'object' && navigator.onLine !== false) };
  if (typeof rdhLast === 'function') doc[rdhKey()] = rdhLast(7);   /* (V38.80) this device's reads per billing day — one string field per device */
  if (typeof pghLast === 'function' && typeof rdhKey === 'function') doc['pgh_' + rdhKey().slice(4)] = pghLast(7);   /* (V38.84) its page opens per day, the same way */
  try { if (typeof reqClaimRun === 'function') reqClaimRun(); } catch (eQ){ LS_ERR = eQ; }   /* (V39.2) a request number still unclaimed tries again with the heartbeat */
  doc.reg = lsGet('nsk14.regver') || '';   /* (V38.88) the points registry this device holds for offline work — checked on every active device before it leaves the app file */
  STATE.presence = STATE.presence || {};
  STATE.presence[u] = doc;
  CORE.dirty('presence', u, doc);
  return true;
}

function presenceFetch(force){
  if (!FB.ready || !FB.db) return Promise.resolve(0);
  if (!force && Date.now() - PRES.fetchAt < 2 * 60000) return Promise.resolve(0);
  PRES.fetchAt = Date.now();
  return DB.col('presence').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    STATE.presence = STATE.presence || {};
    sn.forEach(function(d){ STATE.presence[d.id] = d.data(); });   /* (V38.80) the size was added twice — the read is counted once above */
    if (CUR === 'sys') render(1);
    return sn.size;
  }).catch(function(e){ softErr('سحب نسخ الأجهزة', e, ''); return 0; });
}

function presenceRows(){
  var P = STATE.presence || {};
  return Object.keys(P).map(function(k){ return Object.assign({ uid:k }, P[k] || {}); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}

/* ═══ التصفير: بدايةُ الموسم من صفر ═══
   البياناتُ تتراكم من التجارب قبل أن يبدأ العمل — سجلاتٌ وحركاتٌ وأحداثٌ
   ومقترحات. والبدءُ بها يفسد كلَّ رقمٍ بعدها. والتصفيرُ لا يمسّ المواقعَ
   ولا الطاقمَ ولا الإعدادات: يمسح ما سُجِّل لا ما عُرِّف.
   ═══ كلُّ بندٍ باسمه في الطابور لا باسمه في الحالة ═══
   كان أمرُ الحذف يُقيَّد باسم البند في الحالة (`events`) والطابورُ يعرفه
   باسمٍ آخر (`evlog`) — فيذهب إلى «متفرقات» المقفولة، يُرفَض ثلاثًا ويُعزَل،
   وتمتلئ شاشةُ المزامنة بأحدَ عشرَ رفضًا يُنسَب إلى الحساب وسببُه اسمٌ.
   والإشعاراتُ محليةٌ لا مجموعةَ لها أصلًا. وسجلُّ الأحداث أثرٌ لا يُحذَف من
   القاعدة بقرار (V15.90): يُفرَغ من الجهاز ويبقى هناك — والتصفيرُ نفسُه
   أوّلُ ما يُكتَب فيه. */
var WIPE_KEYS = [
  /* [مفتاحُ الحالة، الاسم، نوعُ الطابور — null: يُفرَغ من هذا الجهاز فقط] */
  ['recs','سجلات المسح','recs'], ['inss','سجلات التركيب','inss'], ['diss','الفك','diss'],
  ['tasks','المهام','tasks'], ['photos','الصور','photos'], ['moves','حركات المخزون','moves'],
  ['buys','المشتريات','buys'], ['events','سجل الأحداث', null], ['notifs','الإشعارات', null],
  ['coreqs','طلبات الشركات','coreqs'], ['fixreqs','طلبات التصويب','fixreqs'],
  ['newsites','المواقع المقترحة','newsites'], ['stats','اللقطات اليومية','stats'],
  ['bonus','نقاط الزيادة','bonus'], ['workReqs','طلبات الورشة','workReqs']];

/* ═══ النبضُ والتقريرُ في التطبيق (V17.94) ═══
   كانا بلاغَين عامَّين في المستودع. صارا في settings/sysreport يقرؤهما المكتبُ
   هنا: نصُّ آخرِ نبضٍ وآخرِ تقريرٍ بتاريخهما — قراءةٌ واحدةٌ كلَّ عشر دقائق. */
var SYSREP = { at:0, v:null, err:'' };


