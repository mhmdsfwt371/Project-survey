/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-12-activity-report.js
   DOMAIN  : Reports — event log tab «نشاط المستخدمين» (V44.0 — the handover release, «V5»)
   PURPOSE : What each person did in a period, counted two ways — how many times, and how many DIFFERENT points — split by the kind
             of work (visit · install · edit · photo · move · add · delete · approve), people side by side, exported to Excel.
   DEFINES : PV.ACT_TYPES, PV.ACT_RX, actType, actSite, actRange, actEvents, actBuild, actBody, actFetch, actXlsx, actXlsxDetail
   SOURCE  : the audit log (`events`): {ts, what, by, site?}. The log keeps the TEXT of each action, so the kind is read from the text's
             first words (checked against 14 days of production: 74 distinct shapes, 5,520 events). Notifications that merely echo an
             action are ignored; the one that IS the record of a visit («إشعار — زيارة تمّت») and of an install («إشعار — تمّ») count.
             A visit counts once per person, point and day — the form and its notification both write one.
   ============================================================================ */
PV.ACT = { span:'7', from:'', to:'', who:'', ev:[], got:0, capped:false, busy:false, at:0, loaded:null };

PV.ACT_TYPES = [['visit', 'زيارات'], ['inst', 'تركيب'], ['edit', 'تعديلات'], ['photo', 'صور'], ['move', 'تحريك'], ['add', 'إضافات'], ['del', 'حذف'], ['appr', 'اعتماد وردّ']];
/* order matters: the first match wins. Texts are normalised first (no marks, one alef) so «حذفُ» and «حذفٌ» are one pattern */
PV.ACT_RX = [
  ['edit',  /^(فك دمج|مسح عناوين)/],
  ['photo', /^(رفع صورة|تعديل صورة|حذف صورة)/],
  ['visit', /^(اشعار \u2014 زيارة تمت|مسح موقع|تعذر الوصول|تمت الزيارة بقرار المهندس)/],
  ['inst',  /^(اشعار \u2014 تم \u00b7|حالة التركيب|تركيب|فك( |$)|تعديل تركيب|الغاء تركيب|تسليم نقطة|تجهيزة ديمو)/],
  ['move',  /^تحريك /],
  ['add',   /^(موقع جديد|مخيم جديد بحدوده|طلب اضافة شركة|اضافة شركة|نوع نقطة جديد|صنف جديد|خطر جديد|مسار جديد)/],
  ['del',   /^(حذف|مسح (?!موقع|عناوين))/],
  ['appr',  /^(اعتماد|رد |قرار بلاغ)/],
  ['edit',  /^(تعديل|الخلاصة|خطة حساسات|اعادة توزيع|بيانات جهاز|دمج|استعادة نقطة|تجاوز قبول|عنوان شبكة|تسمية|نقل|توحيد|صارت نقطة)/]
];
function actNorm(w){ return String(w || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[\u0623\u0625\u0622]/g, '\u0627').trim(); }
function actType(what){
  var w = actNorm(what);
  for (var i = 0; i < PV.ACT_RX.length; i++) if (PV.ACT_RX[i][1].test(w)) return PV.ACT_RX[i][0];
  return '';
}
function actSite(e){
  if (e && e.site) return String(e.site);
  var m = /NSK-[A-Z]{3}-[A-Z]{3}-[A-Z0-9]+/.exec(String((e && e.what) || ''));
  return m ? m[0] : '';
}
/* the period: days are Riyadh days (dayKey), «to» is the end of its day */
function actRange(){
  var A = PV.ACT, today = dayKey(), from, to;
  var dts = function(k, end){ return Date.parse(k + (end ? 'T23:59:59.999+03:00' : 'T00:00:00+03:00')); };
  if (A.span === 'custom'){ from = dts(A.from || today, 0); to = dts(A.to || A.from || today, 1); }
  else { var n = +A.span || 7; from = dts(dayKey(Date.now() - (n - 1) * 864e5), 0); to = dts(today, 1); }
  if (from > to){ var x = from; from = to; to = x; }
  return { from:from, to:to };
}
function actEvents(){
  var R = actRange(), byId = {}, out = [];
  var add = function(e){ if (!e || !e.ts || e.ts < R.from || e.ts > R.to) return; var k = e.id || (e.ts + '|' + e.what); if (byId[k]) return; byId[k] = 1; out.push(e); };
  evAll().forEach(add); (PV.ACT.ev || []).forEach(add);
  return out;
}
function actBuild(list, who){
  var P = {};
  list.forEach(function(e){
    var ty = actType(e.what); if (!ty) return;
    var a = (typeof evActor === 'function' ? evActor(e).name : e.by) || e.by || '\u2014';
    if (who && a !== who) return;
    var site = actSite(e), day = dayKey(e.ts);
    var p = P[a] = P[a] || { name:a, n:0, t:{}, sites:{}, days:{}, first:0, last:0, seen:{} };
    if (ty === 'visit' && site){ var k = site + '|' + day; if (p.seen[k]) return; p.seen[k] = 1; }
    var c = p.t[ty] = p.t[ty] || { n:0, s:{} };
    c.n++; p.n++; if (site){ c.s[site] = 1; p.sites[site] = 1; }
    p.days[day] = 1; p.first = p.first ? Math.min(p.first, e.ts) : e.ts; p.last = Math.max(p.last, e.ts);
  });
  return Object.keys(P).map(function(k){ return P[k]; }).sort(function(x, y){ return y.n - x.n || (x.name < y.name ? -1 : 1); });
}
function actRoleOf(name){
  var r = ''; Object.keys(STATE.users || {}).forEach(function(k){ var u = STATE.users[k] || {}; if (u.name === name) r = u.role || ''; });
  return r;
}
function actWhen(ts){ return ts ? dayKey(ts) + ' ' + new Date(ts + 10800000).toISOString().slice(11, 16) : '\u2014'; }

function actFetch(){
  if (typeof FB === 'undefined' || !FB.ready || !FB.db || PV.ACT.busy){ toast(t('الاتصالُ بالقاعدة غير جاهز')); return; }
  var R = actRange(), A = PV.ACT; A.busy = true; A.ev = []; A.capped = false; render(1);
  var base = DB.col('events').orderBy('ts', 'desc').where('ts', '>=', R.from).where('ts', '<=', R.to), got = 0;
  (function page(after){
    var q = after ? base.startAfter(after).limit(1000) : base.limit(1000);
    q.get().then(function(sn){
      sn.forEach(function(d){ A.ev.push(d.data()); got++; });
      FB.readCount = (FB.readCount || 0) + sn.size;
      if (sn.size >= 1000 && got < 20000){ page(sn.docs[sn.docs.length - 1]); return; }
      A.capped = sn.size >= 1000; A.busy = false; A.got = got; A.at = Date.now(); A.loaded = R; render(1);
    }).catch(function(err){ A.busy = false; softErr('جلب نشاط المستخدمين', err, ''); render(1); });
  })(null);
}

function actCell(p, ty){
  var c = p.t[ty]; if (!c) return '<td class="num" style="color:var(--mut, #888)">\u2014</td>';
  var k = Object.keys(c.s).length;
  return '<td class="num"><b>' + nm(c.n) + '</b>' + (k && k !== c.n ? '<div class="hint" style="margin:0">' + nm(k) + ' ' + esc(t('نقطة')) + '</div>' : '') + '</td>';
}
function actBody(){
  var A = PV.ACT, R = actRange(), list = actEvents(), all = actBuild(list, ''), P = A.who ? actBuild(list, A.who) : all;
  var sp = function(k, lbl){ return '<button type="button" class="chip' + (A.span === k ? ' on' : '') + '" data-actspan="' + k + '">' + esc(t(lbl)) + '</button>'; };
  var who = '<select data-actf="who"><option value="">\u2014 ' + esc(t('الكل')) + ' \u2014</option>' + all.map(function(p){ return '<option value="' + esc(p.name) + '"' + (A.who === p.name ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>';
  var top = sp('1', 'اليوم') + sp('7', '٧ أيام') + sp('30', '٣٠ يومًا') + sp('custom', 'فترة محددة')
    + (A.span === 'custom' ? ' <input type="date" data-actf="from" value="' + esc(A.from || dayKey()) + '"> <input type="date" data-actf="to" value="' + esc(A.to || A.from || dayKey()) + '">' : '');
  var tot = 0, sites = {}; all.forEach(function(p){ tot += p.n; Object.keys(p.sites).forEach(function(s){ sites[s] = 1; }); });
  var src = A.loaded && A.loaded.from === R.from && A.loaded.to === R.to
    ? t('جُلب من القاعدة') + ': ' + nm(A.got) + ' ' + t('حدثًا') + (A.capped ? ' \u2014 ' + t('وثمّةَ أكثر، ضيّق الفترة') : '')
    : t('من الأحداث المحمَّلة على هذا الجهاز') + ' (' + nm(list.length) + ') \u2014 ' + t('اجلب الفترةَ كاملةً من القاعدة لتكتمل');
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('كم عمل كلُّ واحدٍ، بأيِّ نوع، وفي كم نقطةٍ مختلفة — لا كم مرة. الفترةُ من')) + ' <b>' + esc(dayKey(R.from)) + '</b> ' + esc(t('إلى')) + ' <b>' + esc(dayKey(R.to)) + '</b>.</p>'
    + '<div class="chips" style="margin:0 0 8px">' + top + '</div>'
    + '<div class="actions" style="margin:0 0 8px;gap:8px;flex-wrap:wrap;align-items:center">' + who
    + '<button type="button" class="btn btn-primary btn-sm" data-actfetch="1"' + (A.busy ? ' disabled' : '') + '>' + esc(A.busy ? t('يُجلَب…') : '\u2B07 ' + t('اجلب الفترة من القاعدة')) + '</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" data-actxl="sum">\u2B07 ' + esc(t('Excel')) + ' \u2014 ' + esc(t('الملخّص')) + '</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" data-actxl="det">\u2B07 ' + esc(t('Excel')) + ' \u2014 ' + esc(t('التفصيل')) + '</button></div>'
    + '<p class="hint" style="margin:0 0 10px">' + esc(src) + '</p>'
    + stats([['الأشخاص', nm(all.length)], ['إجراءاتُ العمل', nm(tot)], ['نقاطٌ مختلفة لُمست', nm(Object.keys(sites).length), '']]);
  if (!P.length) return h + '<p class="hint">' + esc(t('لا نشاطَ في هذه الفترة على ما هو محمَّل')) + '</p>';
  var maxN = P.reduce(function(m, p){ return Math.max(m, p.n); }, 1);
  h += '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + esc(t('الاسم')) + '</th>' + PV.ACT_TYPES.map(function(x){ return '<th>' + esc(t(x[1])) + '</th>'; }).join('')
    + '<th>' + esc(t('نقاطٌ مختلفة')) + '</th><th>' + esc(t('أيامٌ نشطة')) + '</th><th>' + esc(t('آخر نشاط')) + '</th></tr></thead><tbody>'
    + P.map(function(p){
        var role = actRoleOf(p.name);
        return '<tr><td><b>' + esc(p.name) + '</b>' + (role ? ' <span class="hint" style="margin:0">' + esc(t(typeof roleName === 'function' ? roleName(role) : role)) + '</span>' : '')
          + '<div style="height:6px;border-radius:3px;background:var(--acc, #3CC5B5);width:' + Math.max(4, Math.round(100 * p.n / maxN)) + '%;margin-top:4px" aria-hidden="true"></div></td>'
          + PV.ACT_TYPES.map(function(x){ return actCell(p, x[0]); }).join('')
          + '<td class="num"><b>' + nm(Object.keys(p.sites).length) + '</b></td><td class="num">' + nm(Object.keys(p.days).length) + '</td><td>' + esc(actWhen(p.last)) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    + '<p class="hint">' + esc(t('الرقمُ الكبيرُ كم مرة، وتحته كم نقطةً مختلفة حين يختلفان. الزيارةُ تُعَدّ مرةً لكلِّ نقطةٍ في اليوم.')) + '</p>';
  /* one person chosen: the actions themselves, newest first, each with its point */
  if (A.who){
    var rows = list.filter(function(e){ return actType(e.what) && ((typeof evActor === 'function' ? evActor(e).name : e.by) === A.who); }).sort(function(a, b){ return b.ts - a.ts; }).slice(0, 150);
    var lab = {}; PV.ACT_TYPES.forEach(function(x){ lab[x[0]] = x[1]; });
    h += '<h4 style="margin:14px 0 6px">' + esc(A.who) + ' \u2014 ' + esc(t('آخر الإجراءات')) + '</h4>'
      + rows.map(function(e){ var s = actSite(e);
          return '<div style="display:flex;gap:8px;border-top:1px solid var(--line, #e2e2e2);padding:6px 0;align-items:baseline"><span class="pill">' + esc(t(lab[actType(e.what)])) + '</span>'
            + '<span style="flex:1;min-width:0">' + esc(String(e.what || '').slice(0, 140)) + '</span><span class="hint" style="margin:0;white-space:nowrap">' + esc(actWhen(e.ts)) + '</span>'
            + (s ? btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-fly="' + esc(s) + '"') : '') + '</div>'; }).join('');
  }
  return h;
}

function actXlsx(){
  var list = actEvents(), P = actBuild(list, ''), R = actRange();
  var head = ['الاسم', 'الدور'].concat(PV.ACT_TYPES.map(function(x){ return x[1]; }), PV.ACT_TYPES.map(function(x){ return x[1] + ' — نقاطٌ مختلفة'; }), ['إجمالي الإجراءات', 'نقاطٌ مختلفة', 'أيامٌ نشطة', 'أول نشاط', 'آخر نشاط']);
  var rows = P.map(function(p){
    return [p.name, actRoleOf(p.name)].concat(PV.ACT_TYPES.map(function(x){ return (p.t[x[0]] || { n:0 }).n; }), PV.ACT_TYPES.map(function(x){ return Object.keys((p.t[x[0]] || { s:{} }).s).length; }),
      [p.n, Object.keys(p.sites).length, Object.keys(p.days).length, actWhen(p.first), actWhen(p.last)]);
  });
  logEvent('تصدير نشاط المستخدمين \u2014 ' + dayKey(R.from) + ' \u2192 ' + dayKey(R.to) + ' \u00b7 ' + P.length);
  return mtXlsx('نشاط المستخدمين', head, rows);
}
function actXlsxDetail(){
  var list = actEvents(), R = actRange(), lab = {}; PV.ACT_TYPES.forEach(function(x){ lab[x[0]] = x[1]; });
  var rows = list.filter(function(e){ return actType(e.what); }).sort(function(a, b){ return b.ts - a.ts; }).map(function(e){
    return [actWhen(e.ts), (typeof evActor === 'function' ? evActor(e).name : e.by) || '', lab[actType(e.what)], actSite(e), String(e.what || '').slice(0, 240)];
  });
  logEvent('تصدير تفصيل النشاط \u2014 ' + dayKey(R.from) + ' \u2192 ' + dayKey(R.to) + ' \u00b7 ' + rows.length);
  return mtXlsx('تفصيل النشاط', ['الوقت', 'الاسم', 'النوع', 'النقطة', 'الحدث'], rows);
}
