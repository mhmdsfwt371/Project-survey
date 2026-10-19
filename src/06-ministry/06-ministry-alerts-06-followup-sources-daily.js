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
MFU.f = { 'new':'أُنشئ', owner:'من سيحلّه', m:'آلية المعالجة', st:'الحالة', party:'على مين', u:'إفادة', task:'رُبط بمهمة', o:'المسؤول' };
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
/* الجديدُ منذ آخر زيارةٍ لمتابعة الوزارة — على هذا الجهاز */
function mfuUnseen(){ var seen = +lsGet('nsk14.mfuSeen') || 0; return mfuTimeline(14, 200).filter(function(e){ return e.at > seen; }).length; }
/* ═══ نضجُ المتابعة (V20.9) ═══
   ما تسأله الوزارةُ بعد الأرقام: منذ متى هذا مفتوح؟ ومن عليه أكثرُ الأحمال؟ وأين كنّا
   الأسبوعَ الماضيَ والذي قبله؟ وماذا ينتظر قرارَنا نحن؟ — أعمارُ المفتوح بإنذارٍ بعد أربعة
   عشر يومًا، وحملُ كلِّ مسؤول، ومسارُ الأسابيع من اللقطات، وما ينتظر الوزارةَ نفسَها. */
function mfuAgeDays(at){ return at ? Math.floor((Date.now() - at) / 864e5) : 0; }
function mfuAgePill(at, closed){ if (closed || !at) return ''; var dd = mfuAgeDays(at); return dd >= 14 ? pill(t('مفتوحٌ منذ') + ' ' + nm(dd) + ' ' + t('يوم'), 'bad') : dd >= 7 ? pill(nm(dd) + ' ' + t('يوم'), 'wrn') : ''; }
function mfuOpenedAt(x){ var h = Array.isArray(x.hist) ? x.hist.filter(function(e){ return e.f === 'new'; })[0] : null; return (h && h.at) || x.at || 0; }
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
MFU.src = { field:['من المسح الميداني', '#1C3674'], task:['من المهام الأسبوعية', '#86432B'], manual:['مسجّلٌ يدويًّا', '#7F8C8D'] };
function mfuChalClosed(c){ return c.st === 'تم الحل' || c.st === 'مغلق'; }
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
/* ═══ ملخصُ العمل اليومي (V24.0) ═══
   كان «ملخصَ التركيبات اليومي»: منحنيَين لآخر ثلاثين يومًا وجدولَ أربعة عشر يومًا — والعملُ مسحٌ
   وتركيبٌ وفكٌّ ومعه المتعذّر. صار الأربعةَ كلَّها، وكلَّ يومٍ منذ أوّل عملٍ مسجَّل، والجدولُ صفحاتٌ
   لا تزيد على خمسة عشر سطرًا، ولكلِّ رقمٍ نسبتُه؛ وكلُّ عملٍ يُخفى ويُظهَر بضغطةٍ على اسمه،
   والمرشّحاتُ بالشهر واليوم وساعات العمل بتوقيت مكة — واليومُ الواحدُ يُعرَض ساعةً بساعة.
   الأرقامُ من diaryRows نفسِها (تعريفٌ واحد): المرشِّحُ يُمرَّر إليها ولا يُعَدُّ شيءٌ بتعريفٍ ثانٍ.
   والنسبةُ: المسحُ والتركيبُ من إجمالي النقاط (مقامُ «نسبة المسح» في الملخص)، والفكُّ من النقاط
   المركّبة، والمتعذّرُ من زيارات يومه. واليومُ يومُ غرينتش كسائر النظام — أي يومُ عملٍ يبدأ الثالثةَ
   فجرًا بمكة، فلا تنقسم ورديّةُ الليل على يومين. */
var WDY = { off:{}, pg:1, mon:'', day:'', h1:0, h2:24 };
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
