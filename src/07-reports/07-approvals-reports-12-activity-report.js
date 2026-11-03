/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-12-activity-report.js
   DOMAIN  : Reports — event log tab «نشاط المستخدمين» (V44.0 — the handover release, «V5»)
   PURPOSE : What each person did in a period, counted two ways — how many times, and how many DIFFERENT points — split by the kind
             of work (visit · install · edit · photo · move · add · delete · approve), people side by side, exported to Excel.
   DEFINES : PV.ACT_TYPES, PV.ACT_RX, PV.ACT_COL, actMeta, actRows, actBar, actType, actSite, actRange, actEvents, actBuild, actBody, actFetch, actXlsx, actXlsxDetail
   SOURCE  : the audit log (`events`): {ts, what, by, site?}. The log keeps the TEXT of each action, so the kind is read from the text's
             first words (checked against 14 days of production: 74 distinct shapes, 5,520 events). Notifications that merely echo an
             action are ignored; the one that IS the record of a visit («إشعار — زيارة تمّت») and of an install («إشعار — تمّ») count.
             A visit counts once per person, point and day — the form and its notification both write one.
   ============================================================================ */
PV.ACT = { span:'7', from:'', to:'', who:'', zone:'', ptype:'', wtype:'', ev:[], got:0, capped:false, busy:false, at:0, loaded:null };

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

/* ═══ (V44.1) the dashboard: filters by period, holy site, point type, kind of work and person; charts that filter when clicked ═══
   Owner: «داش بورد وفلتر بالوقت والمشعر ونوع النقطة، تفاعلي ومناسب للسيستم زي داش بورد متابعة الوزارة». The holy site and the
   point type come from the point itself (the registry), so an action with no point (a company request…) drops out once either
   filter is set. */
PV.ACT_COL = { visit:'#3B82F6', inst:'#22C55E', edit:'#F59E0B', photo:'#A855F7', move:'#06B6D4', add:'#84CC16', del:'#EF4444', appr:'#94A3B8' };
function actMeta(site){
  if (!site) return { zone:'', ptype:'' };
  var x = typeof siteFind === 'function' ? siteFind(site) : null;
  if (x) return { zone:(typeof taxOf === 'function' ? taxOf(x).g : '') || x.zone || '', ptype:x.type || '' };
  var z = ({ MIN:'منى', ARF:'عرفات', MUZ:'المزدلفة', JAM:'الجمرات' })[String(site).split('-')[1] || ''] || '';
  return { zone:z, ptype:'' };
}
/* the period's events with their kind, person, point, holy site and type — then the dashboard's filters */
function actRows(list){
  var A = PV.ACT, out = [];
  list.forEach(function(e){
    var ty = actType(e.what); if (!ty) return;
    var site = actSite(e), m = actMeta(site), who = (typeof evActor === 'function' ? evActor(e).name : e.by) || e.by || '\u2014';
    if (A.zone && m.zone !== A.zone) return;
    if (A.ptype && m.ptype !== A.ptype) return;
    if (A.wtype && ty !== A.wtype) return;
    out.push({ e:e, ty:ty, who:who, site:site, zone:m.zone, ptype:m.ptype, day:dayKey(e.ts) });
  });
  return out;
}
function actBar(lbl, n, max, col, attr, sub){
  return '<button type="button" ' + attr + ' style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:0;padding:3px 0;cursor:pointer;color:inherit;text-align:start">'
    + '<span style="flex:0 0 34%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(lbl) + '</span>'
    + '<span style="flex:1;height:14px;border-radius:7px;background:var(--surface-2, rgba(127,127,127,.15));overflow:hidden"><span style="display:block;height:100%;width:' + Math.max(2, Math.round(100 * n / Math.max(1, max))) + '%;background:' + col + '"></span></span>'
    + '<b style="flex:0 0 auto;min-width:3.2em;text-align:end">' + nm(n) + '</b>' + (sub ? '<span class="hint" style="margin:0;flex:0 0 auto;white-space:nowrap">' + esc(sub) + '</span>' : '') + '</button>';
}
function actBody(){
  var A = PV.ACT, R = actRange(), list = actEvents();
  A.zone = A.zone || ''; A.ptype = A.ptype || ''; A.wtype = A.wtype || '';
  var base = actRows(list), rows = A.who ? base.filter(function(r){ return r.who === A.who; }) : base;
  var P = actBuild(rows.map(function(r){ return r.e; }), A.who), lab = {}; PV.ACT_TYPES.forEach(function(x){ lab[x[0]] = x[1]; });
  /* filters */
  var opt = function(v, cur, label){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; };
  var zones = {}, ptypes = {}, people = {};
  actRows(list.slice()).forEach(function(r){ if (r.zone) zones[r.zone] = 1; if (r.ptype) ptypes[r.ptype] = 1; people[r.who] = 1; });
  ['منى', 'عرفات', 'المزدلفة', 'الجمرات'].forEach(function(z){ zones[z] = 1; });
  var sel = function(key, cur, items, lblAll){ return '<label style="display:flex;flex-direction:column;gap:2px;min-width:150px;flex:1"><span class="hint" style="margin:0">' + esc(t(lblAll)) + '</span><select data-actf="' + key + '">' + opt('', cur, '\u2014 ' + t('الكل') + ' \u2014') + items.join('') + '</select></label>'; };
  var sp = function(k, l){ return '<button type="button" class="chip' + (A.span === k ? ' on' : '') + '" data-actspan="' + k + '">' + esc(t(l)) + '</button>'; };
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('كم عمل كلُّ واحدٍ، بأيِّ نوع، وفي كم نقطةٍ مختلفة — لا كم مرة. الفترةُ من')) + ' <b>' + esc(dayKey(R.from)) + '</b> ' + esc(t('إلى')) + ' <b>' + esc(dayKey(R.to)) + '</b>.</p>'
    + '<div class="chips" style="margin:0 0 8px">' + sp('1', 'اليوم') + sp('7', '٧ أيام') + sp('30', '٣٠ يومًا') + sp('custom', 'فترة محددة')
    + (A.span === 'custom' ? ' <input type="date" data-actf="from" value="' + esc(A.from || dayKey()) + '"> <input type="date" data-actf="to" value="' + esc(A.to || A.from || dayKey()) + '">' : '') + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 8px">'
    + sel('zone', A.zone, Object.keys(zones).sort().map(function(z){ return opt(z, A.zone, t(z)); }), 'المشعر')
    + sel('ptype', A.ptype, Object.keys(ptypes).sort().map(function(z){ return opt(z, A.ptype, t(z)); }), 'نوع النقطة')
    + sel('wtype', A.wtype, PV.ACT_TYPES.map(function(x){ return opt(x[0], A.wtype, t(x[1])); }), 'نوع العمل')
    + sel('who', A.who, Object.keys(people).sort().map(function(z){ return opt(z, A.who, z); }), 'الشخص') + '</div>'
    + '<div class="actions" style="margin:0 0 6px;gap:8px;flex-wrap:wrap;align-items:center">'
    + '<button type="button" class="btn btn-primary btn-sm" data-actfetch="1"' + (A.busy ? ' disabled' : '') + '>' + esc(A.busy ? t('يُجلَب…') : '\u2B07 ' + t('اجلب الفترة من القاعدة')) + '</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" data-actxl="sum">\u2B07 Excel \u2014 ' + esc(t('الملخّص')) + '</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" data-actxl="det">\u2B07 Excel \u2014 ' + esc(t('التفصيل')) + '</button>'
    + ((A.zone || A.ptype || A.wtype || A.who) ? '<button type="button" class="btn btn-quiet btn-sm" data-actclear="1">\u2715 ' + esc(t('امسح التصفية')) + '</button>' : '') + '</div>';
  var src = A.loaded && A.loaded.from === R.from && A.loaded.to === R.to
    ? t('جُلب من القاعدة') + ': ' + nm(A.got) + ' ' + t('حدثًا') + (A.capped ? ' \u2014 ' + t('وثمّةَ أكثر، ضيّق الفترة') : '')
    : t('من الأحداث المحمَّلة على هذا الجهاز') + ' (' + nm(list.length) + ') \u2014 ' + t('اجلب الفترةَ كاملةً من القاعدة لتكتمل');
  h += '<p class="hint" style="margin:0 0 10px">' + esc(src) + '</p>';
  /* indicators */
  var tot = 0, sites = {}, days = {}; P.forEach(function(p){ tot += p.n; Object.keys(p.sites).forEach(function(x){ sites[x] = 1; }); Object.keys(p.days).forEach(function(x){ days[x] = 1; }); });
  h += stats([['الأشخاص', nm(P.length)], ['إجراءاتُ العمل', nm(tot)], ['نقاطٌ مختلفة لُمست', nm(Object.keys(sites).length)], ['أيامٌ نشطة', nm(Object.keys(days).length)]]);
  if (!P.length) return h + '<p class="hint">' + esc(t('لا نشاطَ في هذه الفترة على ما هو محمَّل')) + '</p>';
  /* counted the same way as the table: visits once per person, point and day */
  var seen = {}, cnt = function(r){ if (r.ty !== 'visit' || !r.site) return true; var k = r.who + '|' + r.site + '|' + r.day; if (seen[k]) return false; seen[k] = 1; return true; };
  var R2 = rows.filter(cnt);
  /* by day — a click narrows the period to that day */
  var byDay = {}, d0 = Math.max(R.from, R.to - 61 * 864e5); for (var d = d0; d <= R.to; d += 864e5) byDay[dayKey(d)] = 0;
  R2.forEach(function(r){ if (r.day in byDay) byDay[r.day]++; });
  var dk = Object.keys(byDay).sort(), dMax = dk.reduce(function(m, k){ return Math.max(m, byDay[k]); }, 1);
  var card2 = function(title, body){ return '<div class="card" style="margin:0;flex:1 1 320px;min-width:0"><h4 style="margin:0 0 8px">' + esc(t(title)) + '</h4>' + body + '</div>'; };
  h += '<div class="card" style="margin:10px 0"><h4 style="margin:0 0 8px">' + esc(t('الإجراءات يومًا بيوم')) + ' <span class="hint" style="margin:0">\u2014 ' + esc(t('اضغط يومًا لتراه وحده')) + '</span></h4>'
    + '<div style="display:flex;align-items:flex-end;gap:2px;height:150px;overflow-x:auto;padding-bottom:2px">'
    + dk.map(function(k){ var n = byDay[k];
        return '<button type="button" data-actday="' + k + '" title="' + esc(k + ' \u00b7 ' + n) + '" style="flex:1 0 10px;min-width:10px;height:' + Math.max(2, Math.round(140 * n / dMax)) + 'px;background:' + (n ? 'var(--acc, #3CC5B5)' : 'rgba(127,127,127,.25)') + ';border:0;border-radius:3px 3px 0 0;cursor:pointer;padding:0"></button>'; }).join('')
    + '</div><div class="hint" style="display:flex;justify-content:space-between;margin:4px 0 0"><span>' + esc(dk[0] || '') + '</span><span>' + esc(dk[dk.length - 1] || '') + '</span></div></div>';
  /* by kind of work · by holy site · by point type — each bar filters */
  var by = function(key){ var o = {}; R2.forEach(function(r){ var k = r[key] || '\u2014'; var g = o[k] = o[k] || { n:0, s:{} }; g.n++; if (r.site) g.s[r.site] = 1; }); return o; };
  var T1 = by('ty'), Z1 = by('zone'), Y1 = by('ptype');
  var bars = function(o, attr, lblF, colF){ var ks = Object.keys(o).sort(function(a, b){ return o[b].n - o[a].n; }), mx = ks.length ? o[ks[0]].n : 1;
    return ks.slice(0, 12).map(function(k){ var pts = Object.keys(o[k].s).length; return actBar(lblF(k), o[k].n, mx, colF(k), attr + '="' + esc(k) + '"', pts && pts !== o[k].n ? nm(pts) + ' ' + t('نقطة') : ''); }).join(''); };
  h += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 10px">'
    + card2('حسب نوع العمل', bars(T1, 'data-actt', function(k){ return t(lab[k] || k); }, function(k){ return PV.ACT_COL[k] || '#888'; }))
    + card2('حسب المشعر', bars(Z1, 'data-actz', function(k){ return t(k); }, function(){ return '#3B82F6'; }))
    + card2('حسب نوع النقطة', bars(Y1, 'data-actp', function(k){ return t(k); }, function(){ return '#A855F7'; })) + '</div>';
  /* people side by side: one stacked bar each, by kind of work */
  var pMax = P.reduce(function(m, p){ return Math.max(m, p.n); }, 1);
  h += '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 6px">' + esc(t('الأشخاص جنبًا إلى جنب')) + ' <span class="hint" style="margin:0">\u2014 ' + esc(t('اضغط اسمًا لترى إجراءاته')) + '</span></h4>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 8px">' + PV.ACT_TYPES.map(function(x){ return '<span class="hint" style="margin:0;display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:' + PV.ACT_COL[x[0]] + ';display:inline-block"></span>' + esc(t(x[1])) + '</span>'; }).join('') + '</div>'
    + P.map(function(p){
        var role = actRoleOf(p.name);
        return '<button type="button" data-actwho="' + esc(p.name) + '" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:0;padding:4px 0;cursor:pointer;color:inherit;text-align:start">'
          + '<span style="flex:0 0 30%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>' + esc(p.name) + '</b>' + (role ? ' <span class="hint" style="margin:0">' + esc(t(typeof roleName === 'function' ? roleName(role) : role)) + '</span>' : '') + '</span>'
          + '<span style="flex:1;display:flex;height:16px;border-radius:8px;overflow:hidden;background:rgba(127,127,127,.15)"><span style="display:flex;width:' + Math.max(2, Math.round(100 * p.n / pMax)) + '%">'
          + PV.ACT_TYPES.map(function(x){ var c = p.t[x[0]]; return c ? '<span title="' + esc(t(x[1]) + ' \u00b7 ' + c.n) + '" style="flex:' + c.n + ' 0 0;background:' + PV.ACT_COL[x[0]] + '"></span>' : ''; }).join('')
          + '</span></span><b style="flex:0 0 auto;min-width:3.2em;text-align:end">' + nm(p.n) + '</b><span class="hint" style="margin:0;flex:0 0 auto;white-space:nowrap">' + nm(Object.keys(p.sites).length) + ' ' + esc(t('نقطة')) + '</span></button>';
      }).join('') + '</div>';
  /* the table — its own styles, so it reads the same on every screen and language */
  var th = 'style="padding:8px 10px;text-align:start;white-space:nowrap;border-bottom:2px solid var(--line, #ccc);font-size:13px"';
  var td = 'style="padding:8px 10px;border-bottom:1px solid var(--line, #e5e5e5);vertical-align:top;white-space:nowrap"';
  h += '<div class="card" style="margin:0 0 10px;padding:0"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr><th ' + th + '>' + esc(t('الاسم')) + '</th>'
    + PV.ACT_TYPES.map(function(x){ return '<th ' + th + '>' + esc(t(x[1])) + '</th>'; }).join('')
    + '<th ' + th + '>' + esc(t('نقاطٌ مختلفة')) + '</th><th ' + th + '>' + esc(t('أيامٌ نشطة')) + '</th><th ' + th + '>' + esc(t('آخر نشاط')) + '</th></tr></thead><tbody>'
    + P.map(function(p){
        return '<tr><td ' + td + '><b>' + esc(p.name) + '</b></td>'
          + PV.ACT_TYPES.map(function(x){ var c = p.t[x[0]]; if (!c) return '<td ' + td + '><span class="hint" style="margin:0">\u2014</span></td>';
              var k = Object.keys(c.s).length; return '<td ' + td + '><b>' + nm(c.n) + '</b>' + (k && k !== c.n ? '<div class="hint" style="margin:0">' + nm(k) + ' ' + esc(t('نقطة')) + '</div>' : '') + '</td>'; }).join('')
          + '<td ' + td + '><b>' + nm(Object.keys(p.sites).length) + '</b></td><td ' + td + '>' + nm(Object.keys(p.days).length) + '</td><td ' + td + '>' + esc(actWhen(p.last)) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>'
    + '<p class="hint">' + esc(t('الرقمُ الكبيرُ كم مرة، وتحته كم نقطةً مختلفة حين يختلفان. الزيارةُ تُعَدّ مرةً لكلِّ نقطةٍ في اليوم.')) + '</p>';
  /* one person chosen: the actions themselves */
  if (A.who){
    var mine = rows.slice().sort(function(a, b){ return b.e.ts - a.e.ts; }).slice(0, 150);
    h += '<h4 style="margin:14px 0 6px">' + esc(A.who) + ' \u2014 ' + esc(t('آخر الإجراءات')) + '</h4>'
      + mine.map(function(r){ return '<div style="display:flex;gap:8px;border-top:1px solid var(--line, #e2e2e2);padding:6px 0;align-items:baseline"><span class="pill" style="border-color:' + PV.ACT_COL[r.ty] + '">' + esc(t(lab[r.ty])) + '</span>'
          + '<span style="flex:1;min-width:0">' + esc(String(r.e.what || '').slice(0, 140)) + '</span><span class="hint" style="margin:0;white-space:nowrap">' + esc(actWhen(r.e.ts)) + '</span>'
          + (r.site ? btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-fly="' + esc(r.site) + '"') : '') + '</div>'; }).join('');
  }
  return h;
}

function actXlsx(){
  var list = actRows(actEvents()).map(function(r){ return r.e; }), P = actBuild(list, PV.ACT.who || ''), R = actRange();
  var head = ['الاسم', 'الدور'].concat(PV.ACT_TYPES.map(function(x){ return x[1]; }), PV.ACT_TYPES.map(function(x){ return x[1] + ' — نقاطٌ مختلفة'; }), ['إجمالي الإجراءات', 'نقاطٌ مختلفة', 'أيامٌ نشطة', 'أول نشاط', 'آخر نشاط']);
  var rows = P.map(function(p){
    return [p.name, actRoleOf(p.name)].concat(PV.ACT_TYPES.map(function(x){ return (p.t[x[0]] || { n:0 }).n; }), PV.ACT_TYPES.map(function(x){ return Object.keys((p.t[x[0]] || { s:{} }).s).length; }),
      [p.n, Object.keys(p.sites).length, Object.keys(p.days).length, actWhen(p.first), actWhen(p.last)]);
  });
  logEvent('تصدير نشاط المستخدمين \u2014 ' + dayKey(R.from) + ' \u2192 ' + dayKey(R.to) + ' \u00b7 ' + P.length);
  return mtXlsx('نشاط المستخدمين', head, rows);
}
function actXlsxDetail(){
  var R = actRange(), lab = {}; PV.ACT_TYPES.forEach(function(x){ lab[x[0]] = x[1]; });
  var rows = actRows(actEvents()).filter(function(r){ return !PV.ACT.who || r.who === PV.ACT.who; }).sort(function(a, b){ return b.e.ts - a.e.ts; }).map(function(r){
    return [actWhen(r.e.ts), r.who, lab[r.ty], r.site, r.zone, r.ptype, String(r.e.what || '').slice(0, 240)];
  });
  logEvent('تصدير تفصيل النشاط \u2014 ' + dayKey(R.from) + ' \u2192 ' + dayKey(R.to) + ' \u00b7 ' + rows.length);
  return mtXlsx('تفصيل النشاط', ['الوقت', 'الاسم', 'النوع', 'النقطة', 'المشعر', 'نوع النقطة', 'الحدث'], rows);
}
