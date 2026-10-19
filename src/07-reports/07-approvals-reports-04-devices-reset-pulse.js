/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-04-devices-reset-pulse.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Live crew list, device versions, season reset, pulse and in-app report, page usage card, cost guard, field performance card and devices needing action.
   DEFINES : appVer, agoTxt, presenceBeat, presenceFetch, presenceRows, wipeCounts, wipeGo, localStoreCard, sysReportFetch, sysReportCard, usageFetch, readsToday, usageCard, costGuardCard … (+3 more)
   GLOBALS : PRES, WIPE_KEYS, SYSREP, USAGE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الطاقمُ والفرقُ: قائمةٌ حيةٌ تُحرَّر لا بذرةٌ تُعرَض ═════════════════
   كان `TECHS` ستةَ أسماءٍ مكتوبةً في الشيفرة، وطاقمُ الموسم الماضي اثنان
   وأربعون فنيًّا مستخرجين من أوراق التنفيذ اليومية. ومن أراد إضافةَ فنيٍّ
   أو حذفَه أو نقلَه بين الفرق لم يجد أين. */



/* الفرقُ: تُضاف وتُحذَف كالفنيين */
/* ═══ نسخُ الأجهزة: كلُّ جهازٍ يقول نسختَه ═══
   كانت شريحةُ «نسخ الأجهزة» جدولًا مكتوبًا بيدٍ من عهد V14: اسمان ونسختان
   وإنذارٌ ثابت — فتقول للمكتب إن صاحبَ المشروع على إصدارٍ قديمٍ وهو على
   أحدثِ نسخة. صار كلُّ جهازٍ يكتب وثيقةَ حضوره `presence/{uid}` عند الدخول
   ثم كلَّ نصفِ ساعة: النسخةُ والدورُ والاسمُ والوقتُ ومعرِّفُ الجهاز — فيُقرأ
   من علِق على إصدارٍ قديمٍ من القاعدة لا من التخمين. والنسخةُ تُقرأ من
   الرأس نفسِه لا من ثابتٍ يشيخ. */
function appVer(){
  var b = document.querySelector('.ver-tag');
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
  STATE.presence = STATE.presence || {};
  STATE.presence[u] = doc;
  CORE.dirty('presence', u, doc);
  return true;
}
setInterval(function(){ presenceBeat(false); }, 30 * 60000);
function presenceFetch(force){
  if (!FB.ready || !FB.db) return Promise.resolve(0);
  if (!force && Date.now() - PRES.fetchAt < 2 * 60000) return Promise.resolve(0);
  PRES.fetchAt = Date.now();
  return DB.col('presence').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    STATE.presence = STATE.presence || {};
    sn.forEach(function(d){ STATE.presence[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
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

function wipeCounts(){
  return WIPE_KEYS.map(function(k){
    var v = STATE[k[0]];
    return [k[1], Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0), k[2]];
  });
}

function wipeGo(){
  if (!may('delete')){ toast(t('التصفيرُ للمهندس وحده')); return; }
  var el = document.getElementById('wipeOk');
  if (!el || String(el.value || '').trim() !== 'مسح نهائي'){
    toast(t('اكتب «مسح نهائي» حرفًا بحرف للتأكيد')); return;
  }
  /* كان يُفرِغ الذاكرةَ المحليةَ وحدَها ثم يعد بأن «السحابةَ تُصفَّر مع أول
     مزامنة» — ولا شيءَ يصفّرها: المزامنةُ ترفع ما في الطابور ثم تسحب ما في
     القاعدة، فتعود السجلاتُ كما كانت بعد دقائق. فصار يُسجَّل لكلِّ سجلٍّ له
     مجموعةٌ أمرُ حذفٍ صريحٌ في الطابور — باسم نوعه في الطابور — قبل إفراغ
     الذاكرة؛ وما هو من الجهاز فقط يُفرَغ هنا ويُقال. */
  var n = 0, dels = [], local = 0;
  WIPE_KEYS.forEach(function(k){
    var v = STATE[k[0]];
    var cnt = Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0);
    n += cnt;
    if (k[2]){
      var ids = Array.isArray(v)
        ? v.map(function(x){ return x && x.id; }).filter(Boolean)
        : Object.keys(v || {});
      ids.forEach(function(id){ dels.push([k[2], id]); });
    } else local += cnt;
    STATE[k[0]] = Array.isArray(v) ? [] : {};
  });
  /* مرآةُ الأحداث في الطابور تُفرَغ معها — وإلا رُفعت الأحداثُ القديمةُ ثانيةً */
  STATE.evlog = {};
  /* الطابورُ القديمُ يُفرَغ: ما لم يُرفَع من بياناتٍ مُصفَّرةٍ لا معنى لرفعه —
     والمعزولُ من قبل التصفير كذلك */
  if (STATE.queue) STATE.queue.length = 0;
  STATE.poison = [];
  /* ثم تُقيَّد أوامرُ الحذف — بعد الإفراغ لئلّا تُمحى معه */
  /* ما له شاهدُ قبرٍ يُصفَّر شاهدًا فيصل كلَّ جهازٍ سحبَ نسخةً قبل التصفير؛ والمحوُ
     الصامتُ لا يصل أحدًا — فتبقى السجلاتُ عند الآخرين كأن لم يُصفَّر شيء. */
  dels.forEach(function(d){
    if (CORE.TOMB[d[0]]) CORE.dirty(d[0], d[1], { id:String(d[1]), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
    else CORE.dirty(d[0], d[1], null);
  });
  /* والحالةُ الميدانيةُ على المواقع تعود كما وُلدت */
  STATE.sites.forEach(function(x){ x.fstat = 'لم يبدأ'; });
  SITE_IX = null; SITE_TOK = null;
  /* عهدٌ جديدٌ لكلِّ الأجهزة: ما عندها يُفرَغ ولا يُرفَع — فتبدأ القاعدةُ جديدةً حقًّا */
  STATE.meta.epoch = Date.now();
  CORE.set('cfg', 'app', { epoch:STATE.meta.epoch, epochBy:STATE.meta.name || '', epochAt:STATE.meta.epoch });
  CORE.saveSoon(); statBump();
  logEvent('تصفير النظام — ' + nm(n) + ' سجلًّا · ' + nm(dels.length) + ' أمرَ حذفٍ للسحابة · '
           + nm(local) + ' أُفرغ من الجهاز');
  toast(t('صُفِّر النظام') + ' — ' + nm(n) + ' ' + t('سجلًّا'));
  render(1);
}

/* بطاقةُ المخزن المحلي (V17.93): قاعدةُ الجهاز تعمل أم الذاكرة، والتخزينُ الدائم */
function localStoreCard(){
  var idb = IDB_BAD ? pill(t('لا يعمل — الذاكرةُ فقط'), 'bad') : (_idb ? pill(t('يعمل'), 'ok') : pill(t('يُفتَح…'), ''));
  var ps = PERSIST.st === 'yes' ? pill(t('مُنح'), 'ok') : PERSIST.st === 'no' ? pill(t('لم يُمنَح'), 'wrn') : PERSIST.st === 'na' ? pill(t('غيرُ متاح'), '') : pill(t('لم يُسأل بعد'), '');
  return card('المخزنُ المحلي', '<div class="wt-row" style="gap:14px;flex-wrap:wrap">'
    + '<span>' + esc(t('قاعدةُ الجهاز')) + ': ' + idb + '</span>'
    + '<span>' + esc(t('التخزينُ الدائم')) + ': ' + ps + '</span>'
    + (IDB_BAD ? '<span class="hint" style="margin:0">' + esc(t('زامن الآن ولا تغلق التطبيق حتى يُرفَع عملُك.')) + '</span>' : '') + '</div>');
}
/* ═══ النبضُ والتقريرُ في التطبيق (V17.94) ═══
   كانا بلاغَين عامَّين في المستودع. صارا في settings/sysreport يقرؤهما المكتبُ
   هنا: نصُّ آخرِ نبضٍ وآخرِ تقريرٍ بتاريخهما — قراءةٌ واحدةٌ كلَّ عشر دقائق. */
var SYSREP = { at:0, v:null, err:'' };
function sysReportFetch(force){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return Promise.resolve(null);
  if (!force && Date.now() - SYSREP.at < 600000) return Promise.resolve(SYSREP.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  SYSREP.at = Date.now();
  return DB.col('settings').doc('sysreport').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    SYSREP.v = (doc && doc.exists) ? doc.data() : {}; SYSREP.err = '';
    if (CUR === 'sys') render(1);
    return SYSREP.v;
  }).catch(function(e){ SYSREP.err = String(e && (e.message || e.code) || e).slice(0, 80); return null; });
}
function sysReportCard(){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return '';
  if (!SYSREP.v && !SYSREP.err) sysReportFetch();
  var v = SYSREP.v || {};
  var one = function(k, title){
    var x = v[k]; if (!x || !x.text) return '<p class="hint" style="margin:0">' + esc(t(title)) + ': ' + esc(t('لم يصل بعد')) + '</p>';
    return '<details><summary><b>' + esc(t(title)) + '</b> \u00b7 <span class="num">' + esc(fmtDT(x.at)) + '</span></summary>'
      + '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.7;margin:8px 0 0">' + esc(String(x.text).slice(0, 12000)) + '</pre></details>';
  };
  return card('ملخّصُ الصباح وتقريرُ النظام', one('pulse', 'ملخّصُ الصباح') + one('report', 'تقريرُ النظام')
    + (SYSREP.err ? '<p class="hint" style="margin:6px 0 0">' + esc(SYSREP.err) + '</p>' : ''));
}
/* ═══ بطاقةُ استعمال الصفحات وقراءات اليوم (V17.95) ═══
   الأيامُ الثلاثون يجمعها النبضُ الصباحيُّ في settings/usage (كتابةٌ واحدةٌ في
   اليوم) من نبضات الحضور؛ وقراءاتُ اليوم تُجمَع هنا من وثائق الحضور المحمَّلة
   أصلًا للمكتب — لا قراءةَ جديدةً ولا مستمعًا. الحصةُ المجانية ٥٠ ألف قراءةٍ في
   اليوم، والكهرمانيُّ عند ٧٠٪. */
var USAGE = { at:0, v:null };
function usageFetch(force){
  if (!(may('users') || may('exportAll'))) return Promise.resolve(null);
  if (!force && Date.now() - USAGE.at < 600000) return Promise.resolve(USAGE.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  USAGE.at = Date.now();
  return DB.col('settings').doc('usage').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    USAGE.v = (doc && doc.exists) ? doc.data() : {}; if (CUR === 'sys') render(1); return USAGE.v;
  }).catch(function(){ return null; });
}
function readsToday(){
  var day = dayKey(), sum = 0, n = 0;
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.day === day){ sum += (+p.rd || 0); n++; } });
  return { reads:sum, devices:n };
}
function usageCard(){
  if (!(may('users') || may('exportAll'))) return '';
  if (!USAGE.v) usageFetch();
  var rt = readsToday(), QUOTA = 50000, pct = Math.round(rt.reads / QUOTA * 100);
  var days = (USAGE.v && USAGE.v.days) || {}, since = dayKey(Date.now() - 30 * 864e5);
  var keys = Object.keys(days).filter(function(k){ return k >= since; }).sort();   /* ثلاثون يومًا تقويميًّا لا آخرُ ثلاثين مفتاحًا */
  var tot = {}; keys.forEach(function(d){ var m = days[d] || {}; Object.keys(m).forEach(function(p){ tot[p] = (tot[p] || 0) + (+m[p] || 0); }); });
  var top = Object.keys(tot).sort(function(a, b){ return tot[b] - tot[a]; }).slice(0, 12);
  /* ما لم يُفتَح في ثلاثين يومًا من صفحات المكتب — لتقرّر ما يُدمَج أو يُخفى (V19.0) */
  var unused = '';
  if (keys.length >= 7){
    var vis = []; NAV.forEach(function(sct){ (sct.solo ? [[sct.id, sct.label]] : sct.items).forEach(function(i){ if (seesPage(i[0]) && vis.every(function(v){ return v[0] !== i[0]; })) vis.push(i); }); });
    var zero = vis.filter(function(i){ return !tot[i[0]]; });
    unused = '<p class="hint" style="margin:8px 0 0">' + esc(t('صفحاتٌ لم تُفتَح في ثلاثين يومًا')) + ' (' + nm(zero.length) + '): ' + (zero.length ? zero.slice(0, 20).map(function(i){ return esc(t(i[1])); }).join(' \u00b7 ') : '\u2014') + '</p>';
  }
  return card('استعمالُ الصفحات وقراءاتُ اليوم',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap;align-items:center"><span>' + esc(t('قراءاتُ اليوم تقريبًا')) + ': <b class="num">' + nm(rt.reads) + '</b> / ' + nm(QUOTA)
    + ' ' + pill(nm(pct) + '٪', pct >= 100 ? 'bad' : pct >= 70 ? 'wrn' : 'ok') + ' <span class="hint" style="margin:0">' + nm(rt.devices) + ' ' + esc(t('جهازًا أرسل بياناته اليوم')) + '</span></span></div>'
    + (top.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('الصفحة')) + '</th><th>' + esc(t('فتحاتٌ في ٣٠ يومًا')) + '</th></tr></thead><tbody>'
        + top.map(function(p){ return '<tr><td>' + esc(PAGE[p] ? t(PAGE[p].t) : p) + '</td><td class="num">' + nm(tot[p]) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="hint" style="margin:8px 0 0">' + esc(t('لا تجميعَ بعد — يكتبه ملخّصُ الصباح مرةً في اليوم.')) + '</p>') + unused);
}
/* ═══ حارسُ التكلفة (V17.96) ═══
   الحصةُ المجانيةُ تكفي الموسمَ — لكنَّ حلقةً خاطئةً على جهازٍ واحدٍ تستهلكها في
   يوم، ولا يُعلَم إلا بالفاتورة. تنبيهُ الميزانية في Google Cloud يُضبَط يدًا
   مرةً واحدة (الخطواتُ في docs/cost-guard.md) ويؤشّره المديرُ هنا فيختفي من
   الجاهزية. */
function costGuardCard(){
  var on = !!cfgGet('budgetAlert');
  return card('حارسُ التكلفة', '<div class="wt-row" style="gap:12px;flex-wrap:wrap;align-items:center">'
    + '<span>' + esc(t('تنبيهُ ميزانية Google Cloud')) + ': ' + (on ? pill(t('مضبوط'), 'ok') : pill(t('غيرُ مضبوط'), 'wrn')) + '</span>'
    + btn(on ? t('أُلغي الضبط') : '\u2713 ' + t('ضبطتُه — أشِّر'), on ? 'btn-quiet btn-sm' : 'btn-primary btn-sm', ' data-budalert="' + (on ? 0 : 1) + '"')
    + '<a class="btn btn-quiet btn-sm" href="docs/cost-guard.md" target="_blank" rel="noopener">' + esc(t('خطواتُ الضبط')) + '</a></div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحصةُ المجانية ٥٠ ألف قراءةٍ و٢٠ ألف كتابةٍ في اليوم — والتنبيهُ يبلّغك قبل أن تصل الفاتورة. قراءاتُ اليوم في صحة النظام ← الاستهلاك.')) + '</p>');
}
/* ═══ بطاقةُ أداء الميدان (V17.98) ═══
   من نبضات الحضور المحمَّلة أصلًا للمكتب: أبطأُ الأجهزة (الطرازُ من وكيل
   المستخدم، لا اسمٌ)، وأبطأُ الصفحات، والمؤشّراتُ الثلاثةُ على عتبات جوجل
   عند p75: LCP ≤ ٢٫٥ ث · INP ≤ ٢٠٠ مللي ثانية · CLS ≤ ٠٫١. غيابُ واجهةٍ = «—». */
function uaModel(ua){
  ua = String(ua || '');
  var m = /\(([^)]*)\)/.exec(ua), inner = m ? m[1] : '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  var a = /Android[^;]*;\s*([^;)]+)/.exec(inner); if (a) return a[1].replace(/\s*Build.*$/, '').trim().slice(0, 24);
  if (/Windows/.test(ua)) return 'Windows'; if (/Macintosh/.test(ua)) return 'Mac';
  return 'جهاز';
}
function perfRows(){
  var out = [];
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.pf && typeof p.pf === 'object') out.push({ uid:u, model:uaModel(p.ua), ver:p.ver, pf:p.pf }); });
  return out;
}
/* ═══ (V37.29) البندُ ١ — «أجهزةٌ تحتاج إجراءً» للمكتب: يُعرَف العطلُ قبل أن يُشكى ═══
   من نبضات الأجهزة (آخرُ سبعة أيام): نسخةٌ أقدمُ من المنشورة، أو كتاباتٌ/صورٌ واقفة، أو مخزنٌ فيه مشكلة، أو أخطاء، أو صفحةٌ بطيئة —
   ولكلِّ جهازٍ الإجراءُ الذي يُطلَب من صاحبه بالحرف. */
function devActRows(){
  var P = STATE.presence || {}, now = Date.now(), mine = verNum(appVer()), cloud = Math.max(mine, verNum(STATE.appVerCloud || ''));
  return Object.keys(P).map(function(k){ var x = P[k] || {}; return x; }).filter(function(x){ return x && x.name && now - (+x.at || 0) < 7 * 864e5; }).map(function(x){
    var iss = [], act = [], sev = 0, v = verNum(x.ver), mfu = x.pf && x.pf.pages && x.pf.pages.mfu && x.pf.pages.mfu.p75;
    if (v && cloud && v < cloud){ iss.push(t('نسخة قديمة') + ' ' + x.ver); act.push(t('يقفل التطبيق ويفتحه على نت')); sev += cloud - v > 5 ? 2 : 1; }
    if (+x.ib){ iss.push(t('مخزن الجهاز فيه مشكلة')); act.push(t('يفضّي الطابور ثم «إعادة ضبط التطبيق»')); sev += 3; }
    if (+x.q > 0){ iss.push(nm(+x.q) + ' ' + t('كتابة واقفة')); if (!+x.ib) act.push(t('يفتح على نت ويضغط «زامِن الآن»')); sev += +x.q > 5 ? 2 : 1; }
    if (+x.pq > 0 || +x.pfl > 0){ iss.push(nm((+x.pq || 0) + (+x.pfl || 0)) + ' ' + t('صورة لم تُرفع')); act.push(t('يفتح على نت ويضغط «ارفع الآن»')); sev += 2; }
    if (+x.pz > 0){ iss.push(nm(+x.pz) + ' ' + t('كتابة مرفوضة')); act.push(t('يراجعها المهندس من «ما ينتظر الرفع»')); sev += 2; }
    if (+x.err > 0){ iss.push(nm(+x.err) + ' ' + t('خطأ اليوم')); sev += 1; }
    var slowPg = Object.keys((x.pf && x.pf.pages) || {}).map(function(k){ return [k, x.pf.pages[k] && x.pf.pages[k].p75]; }).filter(function(e){ return e[1] > 1500; }).sort(function(a, b){ return b[1] - a[1]; })[0];   /* (V37.34) أيُّ صفحة */
    if (slowPg){ var pgName = (SPEED_PAGES.filter(function(p){ return p[0] === slowPg[0]; })[0] || [0, (PAGE[slowPg[0]] && PAGE[slowPg[0]].t) || slowPg[0]])[1]; iss.push(t(pgName) + ' ' + t('بطيئة') + ' ' + nm(Math.round(slowPg[1] / 100) / 10) + t('ث')); if (!(v && v < cloud)) act.push(t('«الوضع الخفيف» من المساعد')); sev += 1; }
    return { name:x.name, role:x.role || '', ver:x.ver || '', at:+x.at || 0, iss:iss, act:act.filter(function(a, i, A){ return A.indexOf(a) === i; }), sev:sev };
  }).filter(function(r){ return r.iss.length; }).sort(function(a, b){ return b.sev - a.sev || b.at - a.at; });
}
