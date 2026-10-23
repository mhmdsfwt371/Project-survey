/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-20-from-ministry-alerts-06-followup-sources-daily.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-20-from-ministry-alerts-06-followup-sources-daily.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : mfuTaskNote, mfuReqView, mfuTaskGone, mfuDoneAt, mfuWeekBlocks, mfuBlocksCard, mfuOwnersLoad, mfuOwnersCard, mfuWeeksCard, mfuMinWait, mfuTimelineCard, mfuChalClosed
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function mfuTaskNote(id){ var r = id ? wtRow(id) : null; if (!r) return null; var e = (Array.isArray(r.log) ? r.log : []).filter(function(x){ return x && x.note && x.note !== 'أُنشئت'; })[0]; return e ? { at:e.at || 0, note:e.note, by:e.by || '', id:r.id } : null; }

function mfuReqView(x){
  var tk = mfuTaskState(x.task), tn = mfuTaskNote(x.task);
  var uAt = (Array.isArray(x.hist) ? (x.hist.filter(function(h){ return h.f === 'u' || h.f === 'new'; })[0] || {}).at : 0) || x.at || 0;
  var fromTask = tn && tn.at > uAt;
  return { u:fromTask ? tn.note : (x.u || ''), uSrc:fromTask ? tn.id : 0, st:tk && tk.done ? 'منجز' : (x.st || 'جديد'), tk:tk, blocked:!!(tk && tk.st === 'متوقف') };
}

/* ═══ المهامُّ الأسبوعيةُ تُسمَع في متابعة الوزارة (V20.7) ═══
   بعد دراسة أفعال المهام: الإضافةُ والحالةُ والملاحظةُ كانت تُسمَع، أمّا تأجيلُ الموعد
   وتغييرُ المسؤول والحذفُ فكانت صامتة، ولم تكن الوزارةُ ترى ما يراه عرضُها الأسبوعيُّ
   لكلِّ مسار: «أبرز الأعمال المنجزة» و«أبرز المهام القادمة» و«الاعتمادات المطلوبة». صار:
   التعديلُ يُسجَّل بقيمتيه، والحذفُ يُكتَب على ما رُبطت به المهمةُ ويفكّ الربط، والكتلُ
   الأربعُ تُقرأ من المهام، واجتماعُ الأسبوع مرجعُ «ما تغيّر منذ آخر اجتماع». */
function mfuTaskGone(r){
  if (!r || (!r.chal && !r.req)) return;
  var k = String(r.chal || r.req), tag = '#' + r.id + ' ' + t('حُذفت');
  if (/^F:/.test(k)){ var c = k.slice(2), f = Object.assign({}, (mfuData().fch || {})[c] || {}); if (String(f.task) === String(r.id)){ f.task = ''; f.hist = mfuHist(f, 'task', tag); f.at = Date.now(); mfuPut('fch', c, f); } }
  else if (/^M:/.test(k) || /^R:/.test(k)){ var sec = /^M:/.test(k) ? 'chal' : 'req', id = k.slice(2), x = mfuList(sec).filter(function(y){ return y.id === id; })[0];
    if (x && String(x.task) === String(r.id)){ var nx = Object.assign({}, x); delete nx.id; nx.task = ''; nx.hist = mfuHist(x, 'task', tag); nx.at = Date.now(); mfuPut(sec, id, nx); } }
}

function mfuDoneAt(r){ var at = r.doneAt || 0; if (!at && Array.isArray(r.log)) r.log.forEach(function(e){ if (!at && e.st === 'مكتمل') at = e.at; }); return at; }

function mfuWeekBlocks(){
  var now = Date.now(), W = wtRows();
  var done = W.filter(function(r){ return r.st === 'مكتمل' && now - mfuDoneAt(r) < 7 * 864e5; }).sort(function(a, b){ return mfuDoneAt(b) - mfuDoneAt(a); });
  var doneLast = W.filter(function(r){ var a = r.st === 'مكتمل' ? mfuDoneAt(r) : 0; return a && now - a >= 7 * 864e5 && now - a < 14 * 864e5; }).length;
  var next = W.filter(function(r){ if (r.st === 'مكتمل') return false; var d = wtDue(r); return (d != null && d >= 0 && d <= 7) || (d == null && r.st === 'جاري العمل'); }).sort(function(a, b){ return String(a.due || '9').localeCompare(String(b.due || '9')); });
  var late = W.filter(function(r){ return wtLate(r); }).sort(function(a, b){ return wtDue(a) - wtDue(b); });
  var wait = W.filter(function(r){ return r.st === 'قيد الانتظار' || r.st === 'متوقف'; });
  var support = mfuList('req').filter(function(x){ return x.s && mfuReqView(x).st !== 'منجز'; });
  var W0 = STATE.wtask || {}, meet = W0.meetAt ? { at:W0.meetAt, by:W0.meetBy || '', n:wtSince().items.length } : null;
  return { done:done, doneLast:doneLast, next:next, late:late, wait:wait, support:support, stop:W.filter(function(r){ return r.st === 'متوقف'; }).length, meet:meet };
}

function mfuBlocksCard(){
  var B = mfuWeekBlocks();
  var li = function(txt, sub, c){ return '<li style="margin:0 0 6px"><b style="color:' + (c || 'inherit') + '">' + esc(txt) + '</b>' + (sub ? '<div class="hint" style="margin:1px 0 0">' + esc(sub) + '</div>' : '') + '</li>'; };
  var col = function(title, color, items){ return '<div class="mfu-blk"><div class="mfu-blk-h" style="background:' + color + '">' + esc(t(title)) + ' \u00b7 ' + nm(items.length) + '</div><ul>' + (items.length ? items.join('') : '<li class="hint">\u2014</li>') + '</ul></div>'; };
  var dl = B.done.length - B.doneLast;
  return '<div class="mfu-kpis">'
    + '<div class="mfu-kpi" data-svlist="wdone" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('أُنجز هذا الأسبوع')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#27AE60">' + nm(B.done.length) + '</div><div style="font-size:12px;font-weight:700;color:' + (dl >= 0 ? '#27AE60' : '#C0392B') + '">' + (dl > 0 ? '\u25B2 +' : dl < 0 ? '\u25BC ' : '') + nm(dl) + ' ' + esc(t('عن الأسبوع الماضي')) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wnext" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('مستحقٌّ خلال ٧ أيام')) + ' \u203A</div><div class="mfu-kpi-v">' + nm(B.next.length) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wlate" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('متأخرة')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(B.late.length) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wwait" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('متوقفة أو بانتظار قرار')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#E2B33C">' + nm(B.wait.length) + '</div></div>'
    + (B.meet ? '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('آخر اجتماع')) + '</div><div class="mfu-kpi-v" style="font-size:18px">' + esc(fmtDate(B.meet.at)) + '</div><div class="hint" style="margin:2px 0 0">' + esc(dispName(B.meet.by)) + ' \u00b7 ' + nm(B.meet.n) + ' ' + esc(t('تغييرًا منذه')) + '</div></div>' : '')
    + '</div><div class="mfu-blks">'
    + col('أبرز الأعمال المنجزة', '#27AE60', B.done.slice(0, 8).map(function(r){ return li(r.n, (r.who ? r.who + ' \u00b7 ' : '') + fmtDate(mfuDoneAt(r))); }))
    + col('أبرز المهام القادمة', '#C8943E', B.next.slice(0, 8).map(function(r){ return li(r.n, (r.who || t('بلا مسؤول')) + (r.due ? ' \u00b7 ' + r.due : '')); }))
    + col('الاعتمادات والدعم المطلوب', '#1C3674', B.wait.slice(0, 5).map(function(r){ return li(r.n, t(r.st) + (r.who ? ' \u00b7 ' + r.who : '')); }).concat(B.support.slice(0, 4).map(function(x){ return li(x.s, t('طلب الوزارة') + ': ' + String(x.t || '').slice(0, 60)); })))
    + col('المهام المتأخرة', '#C0392B', B.late.slice(0, 8).map(function(r){ return li(r.n, (r.who || t('بلا مسؤول')) + ' \u00b7 ' + t('تأخّر') + ' ' + nm(-wtDue(r)) + ' ' + t('يوم'), '#C0392B'); }))
    + '</div>';
}

function mfuOwnersLoad(){
  var by = {};
  var add = function(n, k){ n = String(n || '').trim(); if (!n) return; var o = by[n] = by[n] || { chal:0, task:0, late:0 }; o[k]++; };
  mfuAllChal().forEach(function(c){ if (!mfuChalClosed(c) && c.owner) add(c.owner, 'chal'); });
  wtRows().forEach(function(r){ if (r.st === 'مكتمل') return; add(r.who, 'task'); if (wtLate(r)) add(r.who, 'late'); });
  return Object.keys(by).map(function(n){ var o = by[n]; o.n = n; o.all = o.chal + o.task; return o; }).sort(function(a, b){ return b.late - a.late || b.all - a.all; });
}

function mfuOwnersCard(){
  var L = mfuOwnersLoad().slice(0, 8); if (!L.length) return '';
  return cardFlush(t('الحملُ على المسؤولين'), table(['المسؤول', 'تحدياتٌ مفتوحة', 'مهامٌّ مفتوحة', 'متأخرة'], L.map(function(o){ return ['<b>' + esc(dispName(o.n)) + '</b>', N(o.chal), N(o.task), o.late ? '<b class="num" style="color:#C0392B">' + nm(o.late) + '</b>' : N(0)]; })));
}

function mfuWeeksCard(){
  var snap = mfuData().snap || {}, keys = Object.keys(snap).sort().slice(-8); if (keys.length < 2) return '';
  return cardFlush(t('مسارُ الأسابيع'), table(['الأسبوع', 'تمت الزيارة', 'تركيب المخيمات', 'تركيب الممرات', 'المعوقات'], keys.map(function(k, i){
    var v = snap[k], p = i ? snap[keys[i - 1]] : null, dv = function(f){ return p && p[f] != null ? ' <span class="hint" style="margin:0">(' + (v[f] - p[f] >= 0 ? '+' : '') + nm(v[f] - p[f]) + ')</span>' : ''; };
    return ['<span class="num">' + esc(k) + '</span>', N(v.sv || 0) + dv('sv'), N(v.campIns || 0) + dv('campIns'), N(v.corIns || 0) + dv('corIns'), N(v.obs || 0) + dv('obs')];
  })));
}

function mfuMinWait(){ var n = 0; (STATE.sites || []).forEach(function(x){ if (lifeOf(x) === 'minwait') n++; }); return n; }

function mfuTimelineCard(){
  var W0 = STATE.wtask || {}, sinceMeet = W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5;
  var L = mfuTimeline(sinceMeet ? Math.max(1, (Date.now() - W0.meetAt) / 864e5) : 7, 12), seen = +lsGet('nsk14.mfuSeen') || 0;
  if (CUR === 'mfu' && tabCur('mfu') === 'mfu') setTimeout(function(){ lsSet('nsk14.mfuSeen', String(Date.now())); }, 1500);   /* رآها */
  return cardFlush((sinceMeet ? t('ما تغيّر منذ آخر اجتماع') + ' (' + fmtDate(W0.meetAt) + ')' : t('آخر التحديثات — هذا الأسبوع')) + ' \u2014 ' + nm(L.length), L.length ? table(['متى', 'النوع', 'البند', 'التحديث', 'بواسطة'], L.map(function(e){
    return ['<span class="num">' + esc(fmtDate(e.at)) + '</span>' + (e.at > seen ? ' ' + pill(t('جديد'), 'ok') : ''), pill(t(e.k), e.k === 'مهمة' ? '' : e.k === 'طلب الوزارة' ? 'ok' : 'wrn'), esc(String(e.ref).slice(0, 60)), esc(String(e.txt).slice(0, 90)), esc(dispName(e.by))];
  })) : '<p class="hint" style="margin:10px 14px">' + esc(t('لا تحديثاتٍ في سبعة أيام.')) + '</p>');
}

function mfuChalClosed(c){ return c.st === 'تم الحل' || c.st === 'مغلق'; }
