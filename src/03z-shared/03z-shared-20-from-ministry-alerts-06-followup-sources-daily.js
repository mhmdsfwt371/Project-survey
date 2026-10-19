/* ============================================================================
   FILE    : src/03z-shared/03z-shared-20-from-ministry-alerts-06-followup-sources-daily.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-06-followup-sources-daily.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : mfuTaskState, mfuAllChal, mfuHist, mfuTaskNote, mfuReqView, mfuTimeline, mfuTaskGone, mfuDoneAt, mfuWeekBlocks, mfuBlocksCard, mfuOwnersLoad, mfuOwnersCard, mfuWeeksCard, mfuMinWait … (+2 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ التحدياتُ بمصادرها الثلاثة (V20.5) ═══
   «التحدياتُ تبان إنها جاية من المسح الميداني ونعدّلها: على مين، ومين هيحلّها،
   وآليةُ المعالجة — والمهامُّ الأسبوعيةُ مربوطة: التحدي فيها يبان ولما يتحلّ يبان».
   ١) من المسح الميداني: كلُّ فئة تحدٍّ بعدد نقاطها غيرِ المركَّبة ومشاعرها، وتُضبَط جهتُها
      (own) ومن يحلّها وآليتُها وحالتُها (fch) — وتصير «تم الحل» وحدَها حين لا تبقى نقطة.
   ٢) من المهام الأسبوعية: المتوقّفةُ تحدٍّ قائم، وما توقّف ثم استؤنف في أربعة عشر يومًا
      «تم الحل» بتاريخه.
   ٣) المسجَّلُ يدويًّا. ولكلِّ تحدٍّ مهمةُ معالجةٍ أسبوعيةٌ تُنشأ بضغطة، واكتمالُها حلُّه. */
function mfuTaskState(id){ var r = id ? wtRow(id) : null; return r ? { id:r.id, st:r.st, done:r.st === 'مكتمل' } : null; }

function mfuAllChal(){
  var out = [], F = mfuData().fch || {}, now = Date.now();
  var O = mfuObstaclesF(), by = {};   /* (V26.5) بفلتر الصفحة إن وُضع */
  O.forEach(function(o){ o.cats.forEach(function(c){ var b = by[c] = by[c] || { n:0, z:{} }; b.n++; b.z[o.x.zone] = (b.z[o.x.zone] || 0) + 1; }); });
  Object.keys(F).forEach(function(c){ if (!by[c] && F[c] && !F[c].gone) by[c] = { n:0, z:{} }; });
  Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; }).forEach(function(c){
    var f = F[c] || {}, tk = mfuTaskState(f.task), n = by[c].n;
    var st = n === 0 ? 'تم الحل' : (tk && tk.done ? 'تم الحل' : (f.st || 'مفتوح'));
    out.push({ key:'F:' + c, src:'field', t:c, n:n, z:by[c].z, party:mfuOwnerOf(c), owner:f.owner || '', m:f.m || '', desc:f.desc || '', due:f.due || '', st:st, task:f.task || '', tk:tk });   /* (V26.6) desc وdue */
  });
  wtRows().forEach(function(r){
    var log = Array.isArray(r.log) ? r.log : [], stopAt = 0, backAt = 0;
    for (var i = log.length - 1; i >= 0; i--){ var e = log[i]; if (!e || !e.st) continue; if (e.st === 'متوقف') stopAt = e.at || 0; else if (stopAt && (e.at || 0) > stopAt) backAt = e.at || 0; }
    var why = (log.filter(function(e){ return e && e.note; })[0] || {}).note || r.upd || '';
    if (r.st === 'متوقف') out.push({ key:'T:' + r.id, src:'task', t:r.n, why:why, party:'', owner:r.who || '', m:'', st:'مفتوح', task:r.id, tk:mfuTaskState(r.id) });
    else if (stopAt && backAt && now - backAt < 14 * 864e5) out.push({ key:'T:' + r.id, src:'task', t:r.n, why:why, party:'', owner:r.who || '', m:'', st:'تم الحل', at:backAt, task:r.id, tk:mfuTaskState(r.id) });
  });
  mfuList('chal').forEach(function(x){
    var tk = mfuTaskState(x.task);
    out.push({ key:'M:' + x.id, id:x.id, src:'manual', t:x.t || '', r:x.r || '', party:x.party || '', owner:x.o || '', m:x.m || '', desc:x.desc || '', due:x.due || '', st:tk && tk.done && x.st !== 'مغلق' ? 'تم الحل' : (x.st || 'مفتوح'), task:x.task || '', tk:tk });
  });
  return out;
}

/* ═══ كلُّ شيءٍ مربوطٌ ويُسمَع في التقرير (V20.6) ═══
   «مش التحديات بس — أيُّ تحديثٍ أو طلبٍ أو متابعةٍ لمهمة كلُّه مربوطٌ ببعضه ويُسمَع
   في التقرير؛ لأن كلَّ ده تخطيطُ المشروع الحالي». فصار:
   • للطلب مهمةُ تنفيذٍ أسبوعيةٌ تُنشأ بضغطة؛ آخرُ ملاحظةٍ في المهمة إفادةُ الطلب إن كانت
     أحدث، واكتمالُها إنجازُه، وتوقّفُها تحدٍّ قائم.
   • لكلِّ تحدٍّ وطلبٍ سجلٌّ قصير (hist) بما تغيّر ومن غيّره ومتى — لا آخرُ قيمةٍ فقط.
   • «آخر التحديثات» سجلٌّ واحدٌ يجمع سجلَّات المهام والتحديات والطلبات — في الملخّص
     وفي التقرير بكلِّ صيغه. */
function mfuHist(x, f, v){ return [{ at:Date.now(), by:STATE.meta.name || '', f:f, v:String(v == null ? '' : v).slice(0, 200) }].concat(Array.isArray(x && x.hist) ? x.hist : []).slice(0, 12); }

function mfuTaskNote(id){ var r = id ? wtRow(id) : null; if (!r) return null; var e = (Array.isArray(r.log) ? r.log : []).filter(function(x){ return x && x.note && x.note !== 'أُنشئت'; })[0]; return e ? { at:e.at || 0, note:e.note, by:e.by || '', id:r.id } : null; }

function mfuReqView(x){
  var tk = mfuTaskState(x.task), tn = mfuTaskNote(x.task);
  var uAt = (Array.isArray(x.hist) ? (x.hist.filter(function(h){ return h.f === 'u' || h.f === 'new'; })[0] || {}).at : 0) || x.at || 0;
  var fromTask = tn && tn.at > uAt;
  return { u:fromTask ? tn.note : (x.u || ''), uSrc:fromTask ? tn.id : 0, st:tk && tk.done ? 'منجز' : (x.st || 'جديد'), tk:tk, blocked:!!(tk && tk.st === 'متوقف') };
}

function mfuTimeline(days, lim){
  var since = Date.now() - (days || 7) * 864e5, out = [];
  wtRows().forEach(function(r){
    var ctx = r.chal ? ' \u2190 ' + t('تحدٍّ') : r.req ? ' \u2190 ' + t('طلب الوزارة') : '';
    (Array.isArray(r.log) ? r.log : []).forEach(function(e){ if (!e || (e.at || 0) < since) return;
      out.push({ at:e.at, by:e.by || '', k:'مهمة', ref:'#' + r.id + ' ' + r.n + ctx, txt:e.st ? t('الحالة') + ': ' + t(e.st) : e.f ? wtFieldTxt(e) : (e.note === 'أُنشئت' ? t('أُنشئت') : e.note) }); });
  });
  var fch = mfuData().fch || {};
  Object.keys(fch).forEach(function(c){ (fch[c].hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'تحدّي مسح', ref:c, txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  mfuList('chal').forEach(function(x){ (x.hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'تحدٍّ', ref:x.t || '', txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  mfuList('req').forEach(function(x){ (x.hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'طلب الوزارة', ref:x.t || '', txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  return out.sort(function(a, b){ return b.at - a.at; }).slice(0, lim || 40);
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
