/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-05-forms-approvals.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-05-forms-approvals.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : svApproved, visitTaskOf, minApprove, minReturn, minResubmit, svApprove, svRevisit, svApproveMany, svUndoLast
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function svApproved(r){ return svDone(r) && r.review === 'approved'; }

/* مهمةُ الزيارة لهذه النقطة — تُغلَق بالاعتماد فتُحتسب نقاطُها */
function visitTaskOf(site){
  var T = STATE.tasks;
  for (var k in T) if (T[k] && T[k].site === site && T[k].kind === 'visit') return T[k];
  return null;
}

function minApprove(id, note){
  if (!may('minapprove')){ toast(t('اعتمادُ إعداد التركيب للوزارة')); return false; }
  var r = STATE.recs[id];
  if (minState(r) === '' ){ toast(t('لم تُعتمَد تقنيًّا بعد')); return false; }
  r.minReview = 'approved'; r.minBy = STATE.meta.name || ''; r.minAt = Date.now(); r.minNote = String(note || '').trim();
  CORE.set('recs', id, r);
  logEvent('اعتمادُ الوزارة لإعداد التركيب — ' + id + (r.minNote ? ' \u00b7 ' + r.minNote : ''), id);
  notifPush('اعتمدت الوزارة', id + ' \u2014 ' + t('جاهزةٌ للتركيب'), { site:id, lv:'مهم' });
  statBump(); return true;
}

function minReturn(id, note){
  if (!may('minapprove')){ toast(t('اعتمادُ إعداد التركيب للوزارة')); return false; }
  var r = STATE.recs[id];
  if (minState(r) === ''){ toast(t('لم تُعتمَد تقنيًّا بعد')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب ما تطلبه الوزارةُ تعديلَه')); return false; }
  r.minReview = 'returned'; r.minBy = STATE.meta.name || ''; r.minAt = Date.now(); r.minNote = note;
  CORE.set('recs', id, r);
  logEvent('ردُّ الوزارة لإعداد التركيب — ' + id + ' \u00b7 ' + note, id);
  notifPush('ردّت الوزارة', id + ' \u2014 ' + note, { site:id, lv:'عاجل' });
  statBump(); return true;
}

/* المهندسُ بعد المعالجة يرفعها ثانيةً */
function minResubmit(id, note){
  if (!may('approve')){ toast(t('الرفعُ للوزارة للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r) return false;
  r.minReview = 'pending'; r.minResubmitNote = String(note || '').trim(); r.minResubmitAt = Date.now(); r.minResubmitBy = STATE.meta.name || '';
  CORE.set('recs', id, r);
  logEvent('إعادةُ رفعٍ للوزارة — ' + id + (r.minResubmitNote ? ' \u00b7 ' + r.minResubmitNote : ''), id);
  notifPush('بانتظار اعتماد الوزارة', id + ' \u2014 ' + t('أُعيد رفعُها بعد المعالجة'), { site:id, lv:'مهم' });
  statBump(); return true;
}

function svApprove(id, opt){
  /* (V38.93) opt (from svApproveMany): the reason is kept instead of a toast per visit, and the author's notice and the
     counters wait for the end of the batch */
  var say = function(m){ if (opt) opt.why = m; else toast(m); return false; };
  if (!may('approve')) return say(t('اعتمادُ الزيارة للمهندس وحده'));
  var r = STATE.recs[id];
  /* ═══ «اعتمدها رغم ذلك» تعني: ارفع الردَّ واعتمد (V17.21) ═══
     كانت الدالةُ تشترط زيارةً منجزة، و«منجزةٌ» تعني ألّا تكون مردودةً لزيارةٍ
     أخرى — فكلُّ صفٍّ تحت «تحتاج زيارة أخرى» يُرفَض اعتمادُه بـ«لا زيارةَ
     منجزةً لهذه النقطة»، وهو بابُ التراجع عن الردِّ نفسِه. صار الاعتمادُ
     يرفع وسمَ الردِّ ويُبقي سببَه في السجل: قرارٌ يُراجَع لا طريقٌ مسدود. */
  if (!r) return say(t('لا سجلَّ زيارةٍ لهذه النقطة'));
  if (r.access && r.access !== 'تم الوصول') return say(t('لم يصل الميدانُ إلى النقطة — لا تُعتمَد زيارةٌ لم تقع'));
  /* زيارةٌ سُجِّلت بإضافة نقطةٍ ولم تُستكمَل بياناتُ مسحها لا تُعتمَد (V17.57):
     تصل الوزارةَ فارغةً ويُبنى عليها حلٌّ بلا قياس */
  if (r.src === 'newsite' && !r.mount) return say(t('بياناتُ المسح لم تُستكمَل بعد — تُستكمَل أو تُرَدّ لزيارةٍ أخرى'));
  if (r.review === 'revisit'){
    r.revisitCleared = { at:Date.now(), by:STATE.meta.name || '', was:r.revisitNote || '' };
    logEvent('تراجعٌ عن ردِّ الزيارة — ' + id, id);
  }
  r.review = 'approved';
  r.reviewBy = STATE.meta.name || '';
  r.reviewAt = Date.now();
  /* الاعتمادُ التقنيُّ يرفع النقطةَ إلى الوزارة — لا يُنهي الطريق */
  if (r.minReview !== 'approved') r.minReview = 'pending';
  CORE.set('recs', id, r);
  var tk = visitTaskOf(id);
  if (tk && tk.status !== 'معتمد'){ tk.status = 'معتمد'; CORE.set('tasks', tk.id, tk); }
  logEvent('اعتماد تقني — ' + id, id);
  if (opt) return true;
  notifPush('اعتماد تقني', 'اعتُمدت زيارةُ ' + id + ' \u2014 ' + t('رُفعت للوزارة'), { to:r.by || '', site:id, lv:'عادي' });
  statBump();
  return true;
}

/* ═══ (V38.93) اعتمادُ ما يحدّده المهندس دفعةً واحدة — قرارُ صاحب المشروع ═══
   لا اعتمادَ تلقائيًّا بمرور الوقت: المهندسُ يحدّد ما يشاء من «بانتظار اعتمادك» ويعتمده. كلُّ زيارةٍ تمرّ بشروط
   svApprove نفسِها (وصل الميدان، واكتمل مسحُ النقطة المقترحة)، وما لا يمرّ يُقال سببُه ولا يُعتمَد. صاحبُ الزيارات
   يصله إشعارٌ واحدٌ بعددها لا إشعارٌ لكلِّ زيارة. والدفعةُ الأخيرةُ يُتراجَع عنها بزرٍّ ما دامت الصفحةُ مفتوحة —
   إلا ما تغيّر بعدها (اعتمدته الوزارة أو رُدَّ)، فيبقى على حاله. لا يُمحى شيء: الحقولُ تُعاد إلى ما كانت. */
function svApproveMany(ids){
  var res = { ok:[], fail:[] }, undo = [], by = {};
  (ids || []).forEach(function(id){
    var r = STATE.recs[id], tk = r ? visitTaskOf(id) : null;
    var prev = r ? { id:id, review:r.review || '', reviewBy:r.reviewBy || '', reviewAt:r.reviewAt || 0, minReview:r.minReview || '',
                     revisitCleared:r.revisitCleared || null, tk:tk ? [tk.id, tk.status || ''] : null } : null;
    var o = {};
    if (svApprove(id, o)){ res.ok.push(id); undo.push(prev); var a = r.by || ''; by[a] = (by[a] || 0) + 1; }
    else res.fail.push([id, o.why || '']);
  });
  Object.keys(by).forEach(function(a){
    if (a) notifPush('اعتماد تقني', nm(by[a]) + ' ' + t('من زياراتك اعتُمدت ورُفعت للوزارة'), { to:a, lv:'عادي' });
  });
  if (undo.length) svApproveMany.last = { at:Date.now(), items:undo };   /* on the function: no new global */
  if (res.ok.length) logEvent('اعتمادٌ جماعيٌّ — ' + nm(res.ok.length) + ' زيارة' + (res.fail.length ? ' · لم تُعتمَد ' + nm(res.fail.length) : ''), '');
  statBump();
  return res;
}
function svUndoLast(){
  if (!may('approve')){ toast(t('الاعتمادُ للمهندس وحده')); return 0; }
  var last = svApproveMany.last;
  if (!last){ toast(t('لا دفعةَ يُتراجَع عنها')); return 0; }
  var n = 0, kept = 0;
  last.items.forEach(function(p){
    var r = STATE.recs[p.id];
    /* what changed after the batch stays: the Ministry approved it, or it was returned */
    if (!r || r.review !== 'approved' || (r.minReview === 'approved' && p.minReview !== 'approved')){ kept++; return; }
    r.review = p.review; r.reviewBy = p.reviewBy; r.reviewAt = p.reviewAt; r.minReview = p.minReview; r.revisitCleared = p.revisitCleared;
    CORE.set('recs', p.id, r);
    if (p.tk){ var tk = (STATE.tasks || {})[p.tk[0]]; if (tk && tk.status === 'معتمد'){ tk.status = p.tk[1]; CORE.set('tasks', tk.id, tk); } }
    n++;
  });
  logEvent('تراجعٌ عن اعتمادٍ جماعيّ — ' + nm(n) + ' زيارة' + (kept ? ' · بقي ' + nm(kept) + ' تغيّر بعده' : ''), '');
  svApproveMany.last = null; statBump();
  toast(t('أُعيدت') + ' ' + nm(n) + ' ' + t('زيارة إلى «بانتظار اعتمادك»') + (kept ? ' \u00b7 ' + t('وبقي') + ' ' + nm(kept) + ' ' + t('تغيّر بعد الاعتماد') : ''));
  return n;
}

function svRevisit(id, note){
  if (!may('approve') && rankOf(ROLE) < rankOf('supervisor')){ toast(t('ردُّ الزيارة للمشرف فما فوق'))   /* (V28.6) المشرفُ يردّ زيارةَ فريقه للتصحيح — والاعتمادُ يبقى للمهندس */; return false; }
  var r = STATE.recs[id];
  if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب ما ينقص الزيارةَ — ليعرف المشرفُ ما يعود لأجله')); return false; }
  r.review = 'revisit';
  r.revisitNote = note;
  r.revisitBy = STATE.meta.name || '';
  r.revisitAt = Date.now();
  CORE.set('recs', id, r);
  /* مهمةُ الزيارة تبقى مفتوحةً على صاحبها — تعود إلى «مهامي» بسببها */
  var tk = visitTaskOf(id);
  if (tk && tk.status === 'معتمد'){ tk.status = 'مطلوب'; CORE.set('tasks', tk.id, tk); }
  logEvent('ردّ زيارة — تحتاج زيارةً أخرى — ' + id + ' \u00b7 ' + note, id);
  notifPush('تحتاج زيارة أخرى', id + ' — ' + note, { to:r.by || '', site:id, lv:'مهم' });
  statBump();
  return true;
}
