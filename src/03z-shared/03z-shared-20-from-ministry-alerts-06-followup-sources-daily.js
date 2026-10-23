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


