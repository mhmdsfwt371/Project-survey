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

setInterval(function(){ presenceBeat(false); }, 30 * 60000);

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

/* ═══ (V38.80) Database cost by period — from Google's own counters ═══
   The owner asked what the database cost him and for any period he picks. Google bills on its own counters, which
   include the server jobs (backup, photo bridge, ministry snapshots), so the totals come from Cloud Monitoring via
   scripts/usage-cost.mjs into settings/cost (one read, on demand, every ten minutes at most). Each day is a Google
   billing day: the free quota (50,000 reads, 20,000 writes, 20,000 deletes, 1 GiB stored) is taken off that day
   alone, then the eur3 price applies. Devices are split by their own per-day logs (rdh_*), from the day they started
   sending them; what the devices do not account for is shown as the server's share. Data transfer is not in the
   counters (first 10 GiB a month free) — it shows on the invoice only, and the card says so. */
USAGE.cost = { at:0, v:null, err:'' }; USAGE.costF = { r:'all', from:'', to:'' };   /* beside the usage card's own state */
USAGE.costP0 = { loc:'eur3', r:0.06, w:0.18, d:0.02, s:0.18, fx:3.75, fr:50000, fw:20000, fd:20000, fs:1, tx:0.12, ftx:10 };
/* the office and top management only — the same circle the database rule opens settings/cost to (the Ministry
   holds the full-export permission, so that permission alone is not the test here) */
function costMay(){ return ['admin', 'engineer', 'exec'].indexOf(ROLE) > -1; }
function costPrice(v){ return Object.assign({}, USAGE.costP0, (v && v.price) || {}); }
function costFetch(force){
  if (!costMay()) return Promise.resolve(null);
  if (!force && Date.now() - USAGE.cost.at < 600000) return Promise.resolve(USAGE.cost.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  USAGE.cost.at = Date.now();
  return DB.col('settings').doc('cost').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    USAGE.cost.v = (doc && doc.exists) ? doc.data() : null; USAGE.cost.err = '';
    if (CUR === 'sys') render(1); return USAGE.cost.v;
  }).catch(function(e){ USAGE.cost.err = String((e && e.code) || e || ''); if (CUR === 'sys') render(1); return null; });
}
/* the preset periods, in billing days */
function costRange(r, now){
  var today = billDay(now), y = +today.slice(0, 4), m = +today.slice(5, 7);
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  if (r === 'month') return [today.slice(0, 8) + '01', today];
  if (r === 'prev'){
    var py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
    return [py + '-' + pad(pm) + '-01', py + '-' + pad(pm) + '-' + pad(new Date(Date.UTC(py, pm, 0)).getUTCDate())];
  }
  if (r === '30') return [billDay((now || Date.now()) - 29 * 864e5), today];
  return ['', today];
}
function costDayUsd(a, P, day){
  var r = +a[0] || 0, w = +a[1] || 0, d = +a[2] || 0, s = +a[3] || 0;
  var dim = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7), 0)).getUTCDate();
  return { r:Math.max(0, r - P.fr) / 1e5 * P.r, w:Math.max(0, w - P.fw) / 1e5 * P.w, d:Math.max(0, d - P.fd) / 1e5 * P.d,
           s:Math.max(0, s / 1073741824 - P.fs) * P.s / dim };
}
/* Google's totals for a period: each day loses its own free quota, then the price applies */
function costCalc(g, from, to, P){
  P = P || USAGE.costP0;
  var o = { days:0, reads:0, writes:0, deletes:0, br:0, bw:0, bd:0, paid:0, sMax:0, usd:0, uR:0, uW:0, uD:0, uS:0, peak:null, months:{} };
  Object.keys(g || {}).sort().forEach(function(k){
    if ((from && k < from) || (to && k > to)) return;
    var a = g[k] || [], c = costDayUsd(a, P, k), r = +a[0] || 0, usd = c.r + c.w + c.d + c.s;
    o.days++; o.reads += r; o.writes += +a[1] || 0; o.deletes += +a[2] || 0;
    o.br += Math.max(0, r - P.fr); o.bw += Math.max(0, (+a[1] || 0) - P.fw); o.bd += Math.max(0, (+a[2] || 0) - P.fd);
    if (r > P.fr) o.paid++;
    o.sMax = Math.max(o.sMax, +a[3] || 0);
    o.uR += c.r; o.uW += c.w; o.uD += c.d; o.uS += c.s; o.usd += usd;
    if (!o.peak || r > o.peak.r) o.peak = { day:k, r:r, usd:usd };
    var mo = o.months[k.slice(0, 7)] = o.months[k.slice(0, 7)] || { reads:0, paid:0, usd:0 };
    mo.reads += r; mo.usd += usd; if (r > P.fr) mo.paid++;
  });
  o.sar = o.usd * P.fx;
  return o;
}
/* each device's share of the read cost, day by day, in proportion to what it read that day */
/* (V38.84) the server's jobs by name too (settings/cost.jobs, counted by scripts/lib/reads.mjs): the phones' counters
   covered about 2% of what Google counted, and «the server» was one anonymous line */
USAGE.costJobs = { photos:'نقل الصور إلى الدرايف', provision:'تجهيز الحسابات', bugs:'مزامنة البلاغات', bridge:'جسر ماي أفاقي', ministry:'ملفات الوزارة',
  weekly:'التحديث الأسبوعي للوزارة', backup:'النسخ الاحتياطي', devices:'صحة الأجهزة', pulse:'نبض الصباح', report:'تقرير النظام',
  sysreport:'حفظ التقارير', season:'تغذية الموسم', cost:'حساب التكلفة' };
function costDevices(v, from, to, P){
  P = P || USAGE.costP0;
  var g = (v && v.g) || {}, dev = (v && v.dev) || {}, jobs = (v && v.jobs) || {}, devDay = {}, jobDay = {}, rows = [], jrows = [], first = '';
  var inRange = function(day){ return !((from && day < from) || (to && day > to)); };
  Object.keys(dev).forEach(function(k){
    Object.keys((dev[k] && dev[k].d) || {}).forEach(function(day){
      if (!first || day < first) first = day;
      if (inRange(day)) devDay[day] = (devDay[day] || 0) + (+dev[k].d[day] || 0);
    });
  });
  Object.keys(jobs).forEach(function(j){
    Object.keys(jobs[j] || {}).forEach(function(day){ if (inRange(day)) jobDay[day] = (jobDay[day] || 0) + (+jobs[j][day] || 0); });
  });
  /* a share of the day's read cost in proportion to the reads — never more than the day, even if the counters overshoot Google */
  var share = function(day, n){
    var a = g[day]; if (!a) return 0;
    var gr = +a[0] || 0, den = Math.max(gr, (devDay[day] || 0) + (jobDay[day] || 0));
    return den ? costDayUsd(a, P, day).r * n / den : 0;
  };
  Object.keys(dev).forEach(function(k){
    var x = dev[k] || {}, reads = 0, usd = 0;
    Object.keys(x.d || {}).forEach(function(day){ if (!inRange(day)) return; var n = +x.d[day] || 0; reads += n; usd += share(day, n); });
    if (reads > 0) rows.push({ k:k, n:x.n || '', ro:x.ro || '', ua:x.ua || '', reads:reads, usd:usd });
  });
  Object.keys(jobs).forEach(function(j){
    var reads = 0, usd = 0;
    Object.keys(jobs[j] || {}).forEach(function(day){ if (!inRange(day)) return; var n = +jobs[j][day] || 0; reads += n; usd += share(day, n); });
    if (reads > 0) jrows.push({ job:j, name:USAGE.costJobs[j] || j, reads:reads, usd:usd });
  });
  var days = {}; Object.keys(devDay).concat(Object.keys(jobDay)).forEach(function(d){ days[d] = 1; });
  var covered = 0, devTot = 0, jobTot = 0, otherUsd = 0;
  Object.keys(days).forEach(function(day){
    var a = g[day]; if (!a) return;
    var gr = +a[0] || 0, dn = devDay[day] || 0, jn = jobDay[day] || 0;
    covered += gr; devTot += dn; jobTot += jn;
    otherUsd += share(day, Math.max(0, gr - dn - jn));
  });
  rows.sort(function(a, b){ return b.reads - a.reads; }); jrows.sort(function(a, b){ return b.reads - a.reads; });
  return { rows:rows, jobs:jrows, first:first, covered:covered, devTot:devTot, jobTot:jobTot,
           other:Math.max(0, covered - devTot - jobTot), otherUsd:otherUsd };
}
function costMoney(usd, P){ return '$' + nm(+usd.toFixed(2)) + ' = ' + nm(+(usd * P.fx).toFixed(1)) + ' ' + t('ريال'); }
function costCard(){
  if (!costMay()) return '';
  if (!USAGE.cost.v && !USAGE.cost.err) costFetch();
  var v = USAGE.cost.v, P = costPrice(v);
  var rg = USAGE.costF.r === 'custom' ? [USAGE.costF.from, USAGE.costF.to] : costRange(USAGE.costF.r), from = rg[0], to = rg[1];
  var flt = '<div class="chips" style="margin-bottom:8px">'
    + [['all', 'منذ البداية'], ['month', 'هذا الشهر'], ['prev', 'الشهر الماضي'], ['30', 'آخر ٣٠ يومًا']].map(function(c){
        return '<button type="button" class="chip' + (USAGE.costF.r === c[0] ? ' on' : '') + '" data-ucr="' + c[0] + '">' + esc(t(c[1])) + '</button>'; }).join('')
    + '</div><div class="wt-row" style="gap:10px;flex-wrap:wrap;align-items:center">'
    + '<label>' + esc(t('من')) + ' <input type="date" data-ucf="1" value="' + esc(from) + '"></label>'
    + '<label>' + esc(t('إلى')) + ' <input type="date" data-uct="1" value="' + esc(to) + '"></label></div>';
  if (!v || !v.g) return card('تكلفةُ قاعدة البيانات', flt + '<p class="hint" style="margin:8px 0 0">'
    + esc(USAGE.cost.err ? t('تعذّر تحميلُ الأرقام') + ': ' + USAGE.cost.err : t('لا أرقامَ بعد — تسحبها مهمّةُ الخادم من جوجل كلَّ ثلاث ساعات.')) + '</p>');
  var c = costCalc(v.g, from, to, P), dv = costDevices(v, from, to, P);
  var mb = function(b){ return nm(Math.round(b / 1048576)) + ' ' + t('ميغابايت'); };
  var sum = table(['البند', 'في المدّة', 'المجانيُّ في اليوم'], [
      [esc(t('القراءات')), '<b class="num">' + nm(c.reads) + '</b>', nm(P.fr)],
      [esc(t('منها فوق المجاني')), '<span class="num">' + nm(c.br) + '</span> <span class="hint" style="margin:0">(' + nm(c.paid) + ' ' + esc(t('يومًا')) + ')</span>', '—'],
      [esc(t('الكتابة')), '<span class="num">' + nm(c.writes) + '</span>', nm(P.fw)],
      [esc(t('الحذف')), '<span class="num">' + nm(c.deletes) + '</span>', nm(P.fd)],
      [esc(t('أعلى حجمٍ مخزَّن')), mb(c.sMax), nm(P.fs) + ' ' + esc(t('غيغابايت'))]
    ], [esc(t('التكلفة')), '<b>' + esc(costMoney(c.usd, P)) + '</b>', '']);
  var mos = Object.keys(c.months).sort();
  var mt = mos.length > 1 ? table(['الشهر', 'القراءات', 'أيامٌ فوق المجاني', 'التكلفة'], mos.map(function(k){
      var x = c.months[k]; return [esc(k), nm(x.reads), nm(x.paid), esc(costMoney(x.usd, P))]; })) : '';
  var dt;
  if (dv.rows.length || dv.jobs.length){
    var model = function(ua){ return (typeof uaModel === 'function' && ua) ? uaModel(ua) : '—'; };
    var pct = function(n){ return nm(dv.covered ? Math.round(n / dv.covered * 100) : 0) + '٪'; };
    var rows = dv.rows.slice(0, 30).map(function(x){
      return [esc(x.n || x.k), esc(t(roleName(x.ro))), esc(model(x.ua)), nm(x.reads), pct(x.reads), esc(costMoney(x.usd, P))]; });
    dv.jobs.forEach(function(x){ rows.push([esc(t('الخادم')) + ' — ' + esc(t(x.name)), '—', '—', nm(x.reads), pct(x.reads), esc(costMoney(x.usd, P))]); });
    rows.push([esc(t(dv.jobs.length ? 'ما لا يعدّه جهازٌ ولا مهمّة' : 'الخادمُ والمهامُّ الآلية وما لا يعدّه الجهاز')), '—', '—', nm(dv.other), pct(dv.other), esc(costMoney(dv.otherUsd, P))]);
    dt = table(['المستخدم', 'الدور', 'الجهاز', 'القراءات', 'النسبة', 'نصيبُه من التكلفة'], rows);
  } else {
    dt = '<p class="hint" style="margin:8px 0 0">' + esc(t('تقسيمُ القراءات على الأجهزة يبدأ من يوم وصول الإصدار ٣٨٫٨٠ إلى الجوالات — قبله الإجماليُّ من جوجل وحدَه.')) + '</p>';
  }
  var note = '<p class="hint" style="margin:8px 0 0">'
    + esc(t('الحسبةُ لكلِّ يومٍ وحدَه: (قراءاتُ اليوم − ٥٠٬٠٠٠) ÷ ١٠٠٬٠٠٠ × سعرِ القراءة، ومثلُها الكتابةُ والحذف فوق ٢٠ ألفًا — ثم × سعرِ الدولار بالريال.'))
    + ' ' + esc(t('الأسعار')) + ' (' + esc(P.loc) + '): ' + esc(t('القراءة')) + ' $' + nm(P.r) + ' · ' + esc(t('الكتابة')) + ' $' + nm(P.w) + ' · ' + esc(t('الحذف')) + ' $' + nm(P.d) + ' ' + esc(t('لكلِّ ١٠٠ ألف')) + ' · ' + esc(t('الدولار')) + ' = ' + nm(P.fx) + ' ' + esc(t('ريال')) + '.'
    + '<br>' + esc(t('اليومُ يومُ فوترة جوجل: يبدأ مع تجدّد الحصة المجانية نحو العاشرة صباحًا بمكة.'))
    + '<br>' + esc(t('نقلُ البيانات إلى الجوالات لا تُظهره العدّادات: أوّلُ ١٠ غيغابايت في الشهر مجانية ثم $٠٫١٢ للغيغابايت — يظهر في الفاتورة وحدَها مع الضريبة إن وُجدت.'))
    + (c.peak ? '<br>' + esc(t('أعلى يوم')) + ': ' + esc(c.peak.day) + ' — ' + nm(c.peak.r) + ' ' + esc(t('قراءة')) + ' (' + esc(costMoney(c.peak.usd, P)) + ')' : '')
    + '<br>' + esc(t('آخرُ سحبٍ من جوجل')) + ': ' + esc(agoTxt(v.at)) + '</p>';
  return card('تكلفةُ قاعدة البيانات', flt + sum + mt + '<h3 style="margin:12px 0 4px">' + esc(t('من قرأ كم')) + '</h3>' + dt + note);
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
