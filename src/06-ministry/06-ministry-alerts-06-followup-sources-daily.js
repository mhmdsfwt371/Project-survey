/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-06-followup-sources-daily.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Challenges from three sources, everything linked and heard in the report, weekly tasks in follow-up, follow-up maturity and the daily work summary.
   DEFINES : mfuTaskState, mfuAllChal, mfuHist, mfuTaskNote, mfuReqView, mfuTimeline, mfuTaskGone, mfuDoneAt, mfuWeekBlocks, mfuBlocksCard, mfuUnseen, mfuAgeDays, mfuAgePill, mfuOpenedAt … (+19 more)
   GLOBALS : WDY, WDY_SER
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

MFU.f = { 'new':'أُنشئ', owner:'من سيحلّه', m:'آلية المعالجة', st:'الحالة', party:'على مين', u:'إفادة', task:'رُبط بمهمة', o:'المسؤول' };

/* ═══ نضجُ المتابعة (V20.9) ═══
   ما تسأله الوزارةُ بعد الأرقام: منذ متى هذا مفتوح؟ ومن عليه أكثرُ الأحمال؟ وأين كنّا
   الأسبوعَ الماضيَ والذي قبله؟ وماذا ينتظر قرارَنا نحن؟ — أعمارُ المفتوح بإنذارٍ بعد أربعة
   عشر يومًا، وحملُ كلِّ مسؤول، ومسارُ الأسابيع من اللقطات، وما ينتظر الوزارةَ نفسَها. */
function mfuAgeDays(at){ return at ? Math.floor((Date.now() - at) / 864e5) : 0; }
function mfuAgePill(at, closed){ if (closed || !at) return ''; var dd = mfuAgeDays(at); return dd >= 14 ? pill(t('مفتوحٌ منذ') + ' ' + nm(dd) + ' ' + t('يوم'), 'bad') : dd >= 7 ? pill(nm(dd) + ' ' + t('يوم'), 'wrn') : ''; }
function mfuOpenedAt(x){ var h = Array.isArray(x.hist) ? x.hist.filter(function(e){ return e.f === 'new'; })[0] : null; return (h && h.at) || x.at || 0; }

MFU.src = { field:['من المسح الميداني', '#1C3674'], task:['من المهام الأسبوعية', '#86432B'], manual:['مسجّلٌ يدويًّا', '#7F8C8D'] };

function mfuChal(){
  var A = mfuAllChal(), ed = may('settings'), ST = ['مفتوح', 'قيد المعالجة', 'مغلق'];
  /* تحدّي المسح يُحفَظ أوّلَ ما يُرى — فيبقى في القائمة «تم الحل» بعد أن تُركَّب نقاطُه
     لا يختفي كأنه لم يكن (على القاعدة الحقيقية، دفعةً واحدة) */
  if (ed && FB.ready && FB.db){ var F0 = mfuData().fch || {}, nw = {}; A.forEach(function(c){ if (c.src === 'field' && !F0[c.t]) nw[c.t] = { seen:Date.now() }; });
    if (Object.keys(nw).length){ MFU.v = MFU.v || {}; MFU.v.fch = Object.assign(MFU.v.fch || {}, nw); STATE.mfu = MFU.v; CORE.set('cfg', 'mfu', { fch:nw }); } }
  var openN = A.filter(function(c){ return !mfuChalClosed(c); }).length;
  var sel = function(attr, cur, opts){ return '<select ' + attr + ' style="min-height:30px;font-size:12px;width:auto">' + opts.map(function(v){ return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>'; };
  var rows = A.map(function(c){
    var S0 = MFU.src[c.src], done = mfuChalClosed(c);
    var what = '<b>' + esc(t(c.t)) + '</b>'
      + (c.src === 'field' ? '<div class="hint" style="margin:2px 0 0">' + nm(c.n) + ' ' + esc(t('نقطة')) + (Object.keys(c.z).length ? ' \u00b7 ' + Object.keys(c.z).map(function(z){ return esc(t(z)) + ' ' + nm(c.z[z]); }).join(' \u00b7 ') : '') + '</div>' : '')
      + (c.src === 'task' && c.why ? '<div class="hint" style="margin:2px 0 0">' + esc(String(c.why).slice(0, 120)) + '</div>' : '');
    var fk = c.src === 'field' ? c.t : '', edr = ed && MFU.edit === c.key;   /* الحقولُ للصفِّ المفتوح وحدَه (V21.5) — أربعون صفًّا بحقولها كانت تُثقل الهاتف */
    var party = c.src === 'field' ? (edr ? '<select data-mfuown="' + esc(fk) + '" style="min-height:30px;font-size:12px;width:auto">' + mfuParties().map(function(p){ return '<option value="' + esc(p) + '"' + (c.party === p ? ' selected' : '') + '>' + esc(t(mfuPartyLabel(p))) + '</option>'; }).join('') + '</select>' : esc(t(c.party)))
      : c.src === 'manual' ? (edr ? sel('data-mchalf="' + esc(c.id) + '|party"', c.party || 'شركة الخدمة', mfuParties()) : esc(t(c.party || '—'))) : '\u2014';
    var owner = (c.src !== 'task' && edr) ? '<input data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|owner" value="' + esc(c.owner) + '" style="min-width:110px">' : esc(c.owner || '\u2014');
    var mit = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|m" rows="2" style="min-width:170px">' + esc(c.m) + '</textarea>' : esc(c.m || '\u2014');
    /* (V26.6) وصفُ المعالجة وآخرُ تاريخٍ لها — يُحمَلان إلى مهمة المعالجة الأسبوعية */
    var dsc = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|desc" rows="2" style="min-width:170px">' + esc(c.desc || '') + '</textarea>' : esc(c.desc || '\u2014');
    var due = (c.src !== 'task' && edr) ? '<input type="date" data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|due" value="' + esc(c.due || '') + '" style="min-width:140px">' : (c.due ? '<span class="num' + (!done && c.due < dayKey() ? ' bad' : '') + '">' + esc(c.due) + '</span>' : '\u2014');
    if (c.src === 'field' && c.n){
      var PTS = mfuObstaclesF().filter(function(o){ return o.cats.indexOf(c.t) > -1; });
      what += '<details class="mfu-pts"><summary class="hint" style="cursor:pointer">' + esc(t('النقاط')) + ' (' + nm(PTS.length) + ')</summary><div class="hint" style="margin:4px 0 0;max-height:260px;overflow:auto">'
        + PTS.map(function(o){ var x = o.x, r = STATE.recs[x.id] || {}, nt = String(r.chal_note || r.note || '').trim(); return '<div style="padding:2px 0;border-bottom:1px solid var(--line)"><b>' + esc(x.name || x.id) + '</b>' + (x.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign) : '') + ' <span class="num">' + esc(x.id) + '</span> \u00b7 ' + esc(t(x.zone || '')) + ' \u00b7 ' + esc(typeLabel(x.type || '')) + (r.access && r.access !== 'تم الوصول' ? ' \u00b7 ' + esc(t(r.access)) : '') + (nt ? '<div>' + esc(nt.slice(0, 160)) + '</div>' : '') + '</div>'; }).join('') + '</div></details>';
    }
    var age = c.src === 'manual' ? mfuAgePill(mfuOpenedAt(mfuList('chal').filter(function(x){ return x.id === c.id; })[0] || {}), done) : c.src === 'field' ? mfuAgePill(((mfuData().fch || {})[c.t] || {}).seen || ((mfuData().fch || {})[c.t] || {}).at, done) : '';
    var st = (age ? age + ' ' : '') + (done ? pill(t('تم الحل') + (c.at ? ' \u00b7 ' + fmtDate(c.at) : ''), 'ok')
      : (c.src === 'task' ? pill(t('متوقفة'), 'bad') : (edr ? (c.src === 'field' ? sel('data-fch="' + esc(fk) + '|st"', c.st, ST) : sel('data-mfuchalst="' + esc(c.id) + '"', c.st, ST)) : pill(t(c.st), 'wrn'))));
    var task = c.tk ? pill('#' + c.tk.id + ' \u00b7 ' + t(c.tk.st), c.tk.done ? 'ok' : (c.tk.st === 'متوقف' ? 'bad' : 'wrn'))
      : (c.src !== 'task' && !done && wtMay() ? btn('\uFF0B ' + t('مهمة معالجة'), 'btn-quiet btn-sm', ' data-chaltask="' + esc(c.key) + '"') : '\u2014');
    var upd = chalUpdBox(c.src === 'field' ? c.t : (c.src === 'manual' ? 'M:' + c.id : c.key));   /* (V27.0) */
    return ['<span class="pill" style="background:' + S0[1] + '22;color:' + S0[1] + ';border:1px solid ' + S0[1] + '55">' + esc(t(S0[0])) + '</span>', what, party, owner, mit, dsc, due, st, task, upd,
            (ed && c.src !== 'task' ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="' + esc(c.key) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
            + ((c.src === 'manual' && ed) ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="chal|' + esc(c.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
  });
  var form = (ed ? card('تحدٍّ جديد', '<div class="grid2"><label>' + esc(t('التحدي')) + '<textarea id="mcT" rows="2"></textarea></label><label>' + esc(t('آلية المعالجة')) + '<textarea id="mcM" rows="2"></textarea></label></div>'
        + '<div class="grid2"><label>' + esc(t('المسؤول')) + '<input id="mcO"></label><label>' + esc(t('المسار')) + '<select id="mcR">' + ['التركيبات', 'التوريدات', 'المسح', 'المواءمة مع الشركات'].map(function(v){ return '<option value="' + esc(v) + '">' + esc(t(v)) + '</option>'; }).join('') + '</select></label></div>'
        + '<div class="actions">' + btn(t('سجّل التحدي'), 'btn-primary btn-sm', ' data-mfuchal="1"') + '</div>') : '');
  return '<div class="mfu-kpis"><div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تحدياتٌ مفتوحة')) + '</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(openN) + '</div></div>'
    + ['field', 'task', 'manual'].map(function(k){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t(MFU.src[k][0])) + '</div><div class="mfu-kpi-v">' + nm(A.filter(function(c){ return c.src === k && !mfuChalClosed(c); }).length) + '</div></div>'; }).join('')
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تم الحل')) + '</div><div class="mfu-kpi-v" style="color:#27AE60">' + nm(A.length - openN) + '</div></div></div>'
    + '<div class="actions" style="margin:6px 0">' + btn('\u2B07 ' + t('تصدير نقاط التحديات') + ((MFU.flt.z || MFU.flt.t) ? ' (' + t('بالفلتر') + ')' : ''), 'btn-secondary btn-sm', ' data-xls="chalpts"') + ' <span class="hint">' + esc(t('كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومشعرها ومعالجته — بالفلتر الحالي إن وُضع')) + '</span></div>'   /* (V26.6) */
    + (A.length ? cardFlush(t('التحديات وآليات المعالجة') + ' \u2014 ' + nm(A.length), table(['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'وصف المعالجة', 'آخر تاريخ', 'الحالة', 'مهمة المعالجة', 'الميدان ↔ المكتب', ''], rows)) : '<p class="hint">' + esc(t('لا تحدياتٍ مسجّلةٌ بعد.')) + '</p>')
    + '<p class="hint">' + esc(t('تحدياتُ المسح الميداني تُقرأ من النقاط غير المركَّبة وتصير «تم الحل» حين لا تبقى نقطة؛ والمهمةُ الأسبوعيةُ المتوقّفةُ تحدٍّ قائم؛ واكتمالُ مهمة المعالجة حلُّ تحدّيها.')) + '</p>'
    + (form ? '<details class="mfu-add"' + (A.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('تحدٍّ جديد')) + '</summary>' + form + '</details>' : '');
}
function mfuReq(){
  var L = mfuList('req'), ed = may('settings'), ST = ['جديد', 'قيد التنفيذ', 'منجز'];
  var form = (ed ? card('طلبٌ جديد', '<label>' + esc(t('الطلب')) + '<textarea id="mrT" rows="2"></textarea></label><div class="grid2"><label>' + esc(t('الإفادة / آخر تحديث')) + '<textarea id="mrU" rows="2"></textarea></label><label>' + esc(t('المقترح / الدعم المطلوب')) + '<textarea id="mrS" rows="2"></textarea></label></div>'
        + '<div class="actions">' + btn(t('سجّل الطلب'), 'btn-primary btn-sm', ' data-mfureq="1"') + '</div>') : '');
  return (L.length ? cardFlush(t('طلبات الوزارة') + ' \u2014 ' + nm(L.length), table(['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ', ''], L.map(function(x, i){
        var V = mfuReqView(x);
        var edr = ed && MFU.edit === 'R:' + x.id;
        var up = V.uSrc ? '<div>' + esc(V.u) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('من المهمة')) + ' #' + nm(V.uSrc) + '</div>'
          : (edr ? '<textarea data-mfurequ="' + esc(x.id) + '" rows="2" style="min-width:160px">' + esc(x.u || '') + '</textarea>' : esc(x.u || '\u2014'));
        var stc = V.tk && V.tk.done ? pill(t('منجز'), 'ok') : (edr ? '<select data-mfureqst="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + ST.map(function(v){ return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>' : pill(t(V.st), V.st === 'منجز' ? 'ok' : 'wrn'));
        var tk = V.tk ? pill('#' + V.tk.id + ' \u00b7 ' + t(V.tk.st), V.tk.done ? 'ok' : (V.blocked ? 'bad' : 'wrn')) : (V.st !== 'منجز' && wtMay() ? btn('\uFF0B ' + t('مهمة تنفيذ'), 'btn-quiet btn-sm', ' data-reqtask="' + esc(x.id) + '"') : '\u2014');
        return [N(i + 1), '<b>' + esc(x.t || '') + '</b>' + (V.st !== 'منجز' ? '<div style="margin:3px 0 0">' + mfuAgePill(mfuOpenedAt(x), false) + '</div>' : ''), up, esc(x.s || ''), stc + (V.blocked ? ' ' + pill(t('متوقفة'), 'bad') : ''), tk,
                (ed ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="R:' + esc(x.id) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
                + (ed ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="req|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
      }))) : '<p class="hint">' + esc(t('لا طلباتٍ مسجّلةٌ بعد.')) + '</p>')
    + (form ? '<details class="mfu-add"' + (L.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('طلبٌ جديد')) + '</summary>' + form + '</details>' : '');
}

var WDY_SER = [['sv', 'تمت الزيارة', 'var(--min-gold)'], ['ins', 'التركيب', 'var(--min-green)'], ['dis', 'الفك', 'var(--min-teal)'], ['stuck', 'المتعذر', 'var(--min-red)']];
function wdyHour(ms){ return (new Date(+ms).getUTCHours() + 3) % 24; }   /* ساعةُ مكة: +٣ بلا توقيتٍ صيفي */
function wdyHourLbl(h){ var s = (h < 10 ? '0' : '') + h + ':00'; return LANG === 'en' ? s : s.replace(/\d/g, function(c){ return nm(+c); }); }
function wdyKeep(){
  var a = +WDY.h1 || 0, b = WDY.h2 == null ? 24 : +WDY.h2;
  if (a <= 0 && b >= 24) return null;
  return function(ms){ var h = wdyHour(ms); return a < b ? (h >= a && h < b) : (h >= a || h < b); };   /* (٢٠ ← ٤) نافذةٌ تعبر منتصفَ الليل */
}
function wdyPct(n, base){
  if (!n || !(base > 0)) return '';
  var v = n / base * 100; v = v < 10 ? Math.max(0.1, Math.round(v * 10) / 10) : Math.round(v);
  return nm(v) + '\u066A';
}
function wdyDayLbl(day, o){ return fmtDate(Date.parse(day + 'T12:00:00Z'), o || { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' }); }
function wdyBase(){ var S = STATE.sites || [], n = 0; S.forEach(function(x){ if (mfuInstalled(x)) n++; }); return { sv:S.length, ins:S.length, dis:n }; }
function wdyCellPct(r, k, B){ return k === 'stuck' ? wdyPct(r.stuck, r.sv) : wdyPct(r[k], B[k]); }
function wdyNice(v){ if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function wdyHourRow(a, i, keep){
  var b = a + 36e5, day = dayKey(a);
  var x = diaryRows(function(ms){ return ms >= a && ms < b && (!keep || keep(ms)); }).filter(function(q){ return q.day === day; })[0] || {};
  return { key:String(i), lbl:wdyHourLbl((i + 3) % 24), sv:x.sv || 0, ins:x.ins || 0, dis:x.dis || 0, stuck:x.stuck || 0 };
}
function wdyChart(rows, vis, hourly, B){
  var n = rows.length; if (!n) return '';
  if (!vis.length) return '<p class="hint">' + esc(t('اختر عملا واحدا على الأقل لعرض الرسم.')) + '</p>';
  /* إحداثياتٌ من ألفٍ في ألف: الرسمُ يتمدّد بعرض البطاقة وارتفاعٍ ثابت، والخطوطُ بسُمكٍ ثابت (non-scaling-stroke)،
     والأرقامُ والتواريخُ والنقاطُ طبقاتٌ فوقه بمقاسٍ ثابت — فتُقرأ على الهاتف كما على الشاشة الكبيرة */
  var mx = 0, g = '', yl = '', dots = '', xl = '';
  rows.forEach(function(r){ vis.forEach(function(s){ if (r[s[0]] > mx) mx = r[s[0]]; }); });
  mx = wdyNice(mx);
  var X = function(i){ return n > 1 ? 20 + i * 960 / (n - 1) : 500; }, Y = function(v){ return 70 + 920 * (1 - v / mx); };
  var pc = function(v){ return (v / 10).toFixed(2) + '%'; };
  [0, 0.5, 1].forEach(function(f){ var y = Y(mx * f);
    g += '<line class="wd-grid" x1="0" x2="1000" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"></line>';
    yl += '<span class="wd-yl" style="top:' + pc(y) + '">' + nm(Math.round(mx * f)) + '</span>'; });
  var step = Math.max(1, Math.ceil(n / (hourly ? 12 : 8)));
  var li = 0;   /* على الهاتف يُكتفى بتاريخٍ بعد تاريخ فلا تتزاحم */
  rows.forEach(function(r, i){ if (i % step) return; var x = X(i) / 10, cl = (x < 6 ? 's' : x > 94 ? 'e' : '') + (li++ % 2 ? ' alt' : '');
    xl += '<span' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + ' style="left:' + x.toFixed(2) + '%">' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { day:'numeric', month:'short', timeZone:'UTC' })) + '</span>'; });
  g += vis.map(function(s){ var k = s[0];
    if (n <= 62) rows.forEach(function(r, i){ if (r[k]) dots += '<i class="wd-dot" style="--c:' + s[2] + ';left:' + pc(X(i)) + ';top:' + pc(Y(r[k])) + '"></i>'; });
    return '<g class="wd-s" style="--c:' + s[2] + '"><polyline points="' + rows.map(function(r, i){ return X(i).toFixed(1) + ',' + Y(r[k]).toFixed(1); }).join(' ') + '"></polyline></g>'; }).join('');
  /* المرورُ على أيِّ يومٍ يُظهر أرقامَه ونسبَها: طبقةُ أعمدةٍ فوق الرسم، بلا شيفرةٍ تُشغَّل */
  var cw = n > 1 ? 960 / (n - 1) : 960;
  var hov = rows.map(function(r, i){
    var a = Math.max(0, X(i) - cw / 2), b = Math.min(1000, X(i) + cw / 2);
    var tip = '<b>' + esc(hourly ? wdyDayLbl(WDY.day, { day:'numeric', month:'long', timeZone:'UTC' }) + ' \u00B7 ' + r.lbl : wdyDayLbl(r.key)) + '</b>'
      + vis.map(function(s){ var p = wdyCellPct(r, s[0], B); return '<span style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(r[s[0]]) + '</b>' + (p ? ' <em>' + p + '</em>' : '') + '</span>'; }).join('');
    return '<div class="wd-c ' + (X(i) > 500 ? 'wd-r' : 'wd-l') + '" style="left:' + pc(a) + ';width:' + pc(b - a) + '"><div class="wd-tip">' + tip + '</div></div>';
  }).join('');
  return '<div class="wd-chart" role="img" aria-label="' + esc(t('ملخص العمل اليومي')) + '"><div class="wd-plot"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + g + '</svg>'
    + yl + dots + '<div class="wd-hov" aria-hidden="true">' + hov + '</div></div><div class="wd-xax" aria-hidden="true">' + xl + '</div></div>';
}
function mfuDaily(){
  var keep = wdyKeep(), all = diaryRows(keep);
  if (!all.length && !keep) return '<p class="hint">' + esc(t('لا أعمالَ مسجّلةٌ بعد.')) + '</p>';
  var B = wdyBase(), months = [];
  all.forEach(function(r){ var m = r.day.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
  months.reverse();
  if (WDY.mon && months.indexOf(WDY.mon) < 0) WDY.mon = '';
  var inMon = WDY.mon ? all.filter(function(r){ return r.day.slice(0, 7) === WDY.mon; }) : all;
  if (WDY.day && !inMon.some(function(r){ return r.day === WDY.day; })) WDY.day = '';
  var hourly = !!WDY.day, rows = [];
  if (hourly){ var d0 = Date.parse(WDY.day + 'T00:00:00Z'); for (var i = 0; i < 24; i++) rows.push(wdyHourRow(d0 + i * 36e5, i, keep)); }
  else rows = inMon.map(function(r){ return { key:r.day, lbl:r.day, sv:r.sv, ins:r.ins, dis:r.dis, stuck:r.stuck || 0 }; });
  var vis = WDY_SER.filter(function(s){ return !WDY.off[s[0]]; }), tot = { sv:0, ins:0, dis:0, stuck:0 };
  rows.forEach(function(r){ tot.sv += r.sv; tot.ins += r.ins; tot.dis += r.dis; tot.stuck += r.stuck; });
  var act = function(r){ return r.sv + r.ins + r.dis + r.stuck > 0; };
  var work = rows.filter(function(r){ return r.sv + r.ins + r.dis > 0; }), prim = vis[0] || WDY_SER[0];
  var best = work.slice().sort(function(a, b){ return b[prim[0]] - a[prim[0]]; })[0];
  var monLbl = function(m){ return fmtDate(Date.parse(m + '-15T12:00:00Z'), { month:'long', year:'numeric', timeZone:'UTC' }); };
  var opt = function(v, lb, on){ return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(lb) + '</option>'; };
  var hs = []; for (var h = 0; h <= 24; h++) hs.push(h);
  var flt = '<div class="wd-flt">'
    + '<label>' + esc(t('الشهر')) + '<select id="wdyMon">' + opt('', t('كل الشهور'), !WDY.mon) + months.map(function(m){ return opt(m, monLbl(m), WDY.mon === m); }).join('') + '</select></label>'
    + '<label>' + esc(t('اليوم')) + '<select id="wdyDay">' + opt('', t('كل الأيام'), !WDY.day) + inMon.slice().reverse().map(function(r){ return opt(r.day, wdyDayLbl(r.day, { weekday:'short', day:'numeric', month:'short', timeZone:'UTC' }), WDY.day === r.day); }).join('') + '</select></label>'
    + '<label>' + esc(t('من الساعة')) + '<select id="wdyH1">' + hs.slice(0, 24).map(function(x){ return opt(String(x), wdyHourLbl(x), (+WDY.h1 || 0) === x); }).join('') + '</select></label>'
    + '<label>' + esc(t('إلى الساعة')) + '<select id="wdyH2">' + hs.slice(1).map(function(x){ return opt(String(x), wdyHourLbl(x), (WDY.h2 == null ? 24 : +WDY.h2) === x); }).join('') + '</select></label>'
    + '<span class="hint">' + esc(t('بتوقيت مكة')) + '</span>'
    + (WDY.mon || WDY.day || keep ? btn('إعادة الضبط', 'btn-quiet btn-sm', ' data-wdyreset="1"') : '') + '</div>';
  var lg = '<div class="wd-lgs">' + WDY_SER.map(function(s){ var on = !WDY.off[s[0]];
      return '<button type="button" class="wd-lg' + (on ? '' : ' off') + '" data-wdyser="' + s[0] + '" aria-pressed="' + on + '" title="' + esc(t('اضغط للإخفاء أو الإظهار')) + '" style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(tot[s[0]]) + '</b></button>'; }).join('') + '</div>';
  var st = '<div class="wd-stats"><span>' + esc(t(hourly ? 'ساعات العمل' : 'أيام العمل')) + ' <b>' + nm(work.length) + '</b></span>'
    + (best ? '<span>' + esc(t(hourly ? 'أعلى ساعة' : 'أعلى يوم')) + ' <b>' + esc(hourly ? best.lbl : wdyDayLbl(best.key, { day:'numeric', month:'long', timeZone:'UTC' })) + '</b>: ' + esc(t(prim[1])) + ' <b>' + nm(best[prim[0]]) + '</b></span>'
      + '<span>' + esc(t('المتوسط')) + ': ' + esc(t(prim[1])) + ' <b>' + nm(Math.round(tot[prim[0]] / work.length)) + '</b></span>' : '') + '</div>';
  var list = hourly ? rows.filter(act) : rows.slice().reverse(), PG = 15, P = Math.max(1, Math.ceil(list.length / PG));
  WDY.pg = Math.min(Math.max(1, +WDY.pg || 1), P);
  var part = EXP.xlsAll ? list : list.slice((WDY.pg - 1) * PG, WDY.pg * PG);   /* إكسلُ الصفحة يأخذ الأيامَ كلَّها لا صفحتَها */
  var cell = function(r, k){ var p = wdyCellPct(r, k, B); return N(r[k]) + (p ? ' <small class="wd-p">' + p + '</small>' : ''); };
  var tb = list.length ? table([hourly ? 'الساعة' : 'اليوم'].concat(vis.map(function(s){ return s[1]; })),
      part.map(function(r){ return { raw:'<tr' + (act(r) ? '' : ' class="wd-z"') + '><td>' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' })) + '</td>'
        + vis.map(function(s){ return '<td>' + cell(r, s[0]) + '</td>'; }).join('') + '</tr>' }; }),
      ['الإجمالي'].concat(vis.map(function(s){ return cell(tot, s[0]); })))
    : '<p class="hint">' + esc(t('لا عمل في هذا النطاق.')) + '</p>';
  var pg = '';
  if (P > 1){ var nums = []; for (var q = 1; q <= P; q++) nums.push(q);
    pg = '<div class="wd-pager"><button type="button" class="btn btn-quiet btn-sm" data-wdypg="p"' + (WDY.pg <= 1 ? ' disabled' : '') + '>' + esc(t('السابق')) + '</button>'
      + nums.map(function(q2){ return '<button type="button" class="btn btn-sm ' + (q2 === WDY.pg ? 'btn-primary' : 'btn-quiet') + '" data-wdypg="' + q2 + '"' + (q2 === WDY.pg ? ' aria-current="page"' : '') + '>' + nm(q2) + '</button>'; }).join('')
      + '<button type="button" class="btn btn-quiet btn-sm" data-wdypg="n"' + (WDY.pg >= P ? ' disabled' : '') + '>' + esc(t('التالي')) + '</button>'
      + '<span class="hint">' + nm((WDY.pg - 1) * PG + 1) + '\u2013' + nm(Math.min(list.length, WDY.pg * PG)) + ' ' + esc(t('من')) + ' ' + nm(list.length) + '</span></div>'; }
  var rng = hourly ? wdyDayLbl(WDY.day) + ' \u2014 ' + t('ساعة بساعة')
    : WDY.mon ? monLbl(WDY.mon)
    : rows.length ? t('من') + ' ' + wdyDayLbl(rows[0].key, { day:'numeric', month:'long', timeZone:'UTC' }) + ' ' + t('إلى') + ' ' + wdyDayLbl(rows[rows.length - 1].key, { day:'numeric', month:'long', timeZone:'UTC' }) : t('كل الأيام');
  if (keep) rng += ' \u00B7 ' + t('من الساعة') + ' ' + wdyHourLbl(+WDY.h1 || 0) + ' ' + t('إلى الساعة') + ' ' + wdyHourLbl(WDY.h2 == null ? 24 : +WDY.h2);
  var note = '<p class="hint" style="margin:10px 0 0">' + esc(t('النسبة من إجمالي النقاط للزيارة والتركيب، ومن النقاط المركبة للفك، ومن زيارات اليوم لما تحتاج زيارة أخرى.')) + ' ' + esc(t('إجمالي النقاط')) + ': ' + nm(B.sv) + '</p>';
  return cardFlush(t('ملخص العمل اليومي') + ' \u2014 ' + rng, flt + lg + st + wdyChart(rows, vis, hourly, B) + tb + pg + note);
}
