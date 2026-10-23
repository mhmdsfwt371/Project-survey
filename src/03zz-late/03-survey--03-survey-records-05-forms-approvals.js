/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-05-forms-approvals.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
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

function svApprove(id){
  if (!may('approve')){ toast(t('اعتمادُ الزيارة للمهندس وحده')); return false; }
  var r = STATE.recs[id];
  /* ═══ «اعتمدها رغم ذلك» تعني: ارفع الردَّ واعتمد (V17.21) ═══
     كانت الدالةُ تشترط زيارةً منجزة، و«منجزةٌ» تعني ألّا تكون مردودةً لزيارةٍ
     أخرى — فكلُّ صفٍّ تحت «تحتاج زيارة أخرى» يُرفَض اعتمادُه بـ«لا زيارةَ
     منجزةً لهذه النقطة»، وهو بابُ التراجع عن الردِّ نفسِه. صار الاعتمادُ
     يرفع وسمَ الردِّ ويُبقي سببَه في السجل: قرارٌ يُراجَع لا طريقٌ مسدود. */
  if (!r){ toast(t('لا سجلَّ زيارةٍ لهذه النقطة')); return false; }
  if (r.access && r.access !== 'تم الوصول'){ toast(t('لم يصل الميدانُ إلى النقطة — لا تُعتمَد زيارةٌ لم تقع')); return false; }
  /* زيارةٌ سُجِّلت بإضافة نقطةٍ ولم تُستكمَل بياناتُ مسحها لا تُعتمَد (V17.57):
     تصل الوزارةَ فارغةً ويُبنى عليها حلٌّ بلا قياس */
  if (r.src === 'newsite' && !r.mount){ toast(t('بياناتُ المسح لم تُستكمَل بعد — تُستكمَل أو تُرَدّ لزيارةٍ أخرى')); return false; }
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
  notifPush('اعتماد تقني', 'اعتُمدت زيارةُ ' + id + ' \u2014 ' + t('رُفعت للوزارة'), { to:r.by || '', site:id, lv:'عادي' });
  statBump();
  return true;
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
