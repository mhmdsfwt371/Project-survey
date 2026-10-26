/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-07-layers-dismantle-svedit.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-07-layers-dismantle-svedit.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : disSave, maintSave, maintDone, maintDel, svqPhotoDel, svqSave, svqVisitPhotos, svqMove
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function disSave(){
  var id = DISF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الفك يحتاج صلاحية تعديل')); return; }
  var ins = STATE.inss[id];
  if (!ins || !insDone(id)){ toast(t('لا تركيبَ معتمدًا على هذه النقطة')); return; }
  if (typeof handDone === 'function' && !handDone(id)){
    toast(t('لم تُسلَّم بمحضر — الفكُّ إرجاعُ ما سُلِّم')); return;
  }
  if (disDone(id)){ toast(t('فُكَّت من قبل')); return; }
  var back = {}, n = 0;
  Object.keys(ins.parts || {}).forEach(function(k){
    var c = DISF.items[k] || 'سليم';
    back[k] = { qty:cfgN(ins.parts[k]), cond:c }; n += cfgN(ins.parts[k]);
  });
  if (!n){ toast(t('لا قطعَ مسجَّلةً على هذه النقطة')); return; }
  if (!DISF.photos.after){ toast(t('صورةُ الموضع بعد الفكِّ مطلوبة')); return; }
  var rec = { id:id, status:'تم الفك', items:back, note:DISF.note,
              by:STATE.meta.name || '', at:Date.now(), photos:Object.keys(DISF.photos) };
  STATE.diss = STATE.diss || {};
  STATE.diss[id] = rec;
  CORE.set('diss', id, rec);
  Object.keys(DISF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'dis_' + k, DISF.photos[k].data);
  });
  /* ما سلِم يعود مخزونًا وما تلِف يُشطَب — والعهدةُ تُقفَل بالحالة لا بالعدد */
  Object.keys(back).forEach(function(k){
    var b = back[k];
    /* (V38.69) each return is its own ledger document — the summary «dis-<point>» never reached the office as a movement */
    mvWrite({ id:'dis-' + id + '-' + k, at:Date.now(), ts:Date.now(),
      kind: b.cond === 'سليم' ? 'إرجاع' : 'شطب',
      item:k, qty:b.qty, by:rec.by, site:id, note:'فك ' + id, dis:1 });   /* (V37.99) بالرمز كالتركيب — فيُقابل استهلاكَه في صفٍّ واحد، ومِن «رُكّب» لا من العهدة */
  });
  /* المهمةُ تُغلَق: لا يبقى فكٌّ مفتوحٌ على نقطةٍ فُكَّت */
  var tk = taskKindOf(id, 'dis');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('فك — ' + id + ' \u00b7 ' + nm(n) + ' قطعة', id);
  if (typeof chSystem === 'function') chSystem(id, 'فُكَّت النقطة — ' + (STATE.meta.name || '') + ' \u00b7 ' + nm(n) + ' ' + t('قطعة'), '');   /* (V38.65) the point's history keeps its dismantling */
  stepDone('dis', id, nm(n) + ' ' + t('قطعة'), 0);
  toast(t('سُجِّل الفكُّ وأُرجعت العُهدة'));
  DISF = { site:'', items:{}, note:'', photos:{} };
  statBump(); render(1);
}

function maintSave(){
  var id = MNTF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الصيانة يحتاج صلاحية تعديل')); return; }
  if (!insDone(id)){ toast(t('الصيانةُ لما رُكِّب واعتُمد')); return; }
  if (!MNTF.fault){ toast(t('اكتب العطل')); return; }
  if (!MNTF.act){ toast(t('اكتب ما عُمل')); return; }
  var used = {}, n = 0;
  Object.keys(MNTF.parts || {}).forEach(function(k){
    var q = cfgN(MNTF.parts[k]); if (q > 0){ used[k] = q; n += q; }
  });
  var rec = { at:Date.now(), by:STATE.meta.name || '', fault:MNTF.fault,
              act:MNTF.act, parts:used, note:MNTF.note, photos:Object.keys(MNTF.photos) };
  STATE.maints = STATE.maints || {};
  var L2 = maintList(id).concat([rec]);
  STATE.maints[id] = { id:id, list:L2 };
  CORE.set('maints', id, STATE.maints[id]);
  Object.keys(MNTF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'mnt_' + Date.now() + '_' + k, MNTF.photos[k].data);
  });
  Object.keys(used).forEach(function(k){
    /* (V38.72) the maintenance's parts reach the office ledger — they were pushed on this phone only */
    mvWrite({ id:'mt-' + id + '-' + k + '-' + Date.now().toString(36), at:Date.now(), ts:Date.now(), kind:'استهلاك',
      item:itemName(k), qty:used[k], by:rec.by, site:id, note:'صيانة ' + id });
  });
  var tk = taskKindOf(id, 'maint');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('صيانة — ' + id + ' \u00b7 ' + MNTF.fault.slice(0, 40) + (n ? ' \u00b7 ' + nm(n) + ' قطعة' : ''));
  stepDone('maint', id, MNTF.fault.slice(0, 36), 0);
  toast(t('سُجِّلت الصيانة'));
  MNTF = { site:'', fault:'', act:'', parts:{}, note:'', photos:{} };
  statBump(); render(1);
}

function maintDone(id){ return maintList(id).length > 0; }

/* (V29.5) قيدُ صيانةٍ يُحذف للمهندس والمدير (قرارُ المالك) — بتأكيد، ويبقى أثرُه في سجل الأحداث؛ والقطعُ المستهلَكةُ تبقى حركةً في المخزون */
function maintDel(id, at){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الصيانة للمهندس والمدير')); return; }
  var L = maintList(id), r = L.filter(function(x){ return String(x.at) === String(at); })[0]; if (!r) return;
  if (!confirm(t('حذفُ قيد الصيانة') + ' ' + id + ' \u2014 «' + String(r.fault || '').slice(0, 40) + '»؟')) return;
  var L2 = L.filter(function(x){ return x !== r; });
  STATE.maints = STATE.maints || {};
  STATE.maints[id] = { id:id, list:L2 }; CORE.set('maints', id, STATE.maints[id]);
  logEvent('حذف قيد صيانة — ' + id + ' \u00b7 ' + String(r.fault || '').slice(0, 40) + ' \u00b7 ' + (r.by || ''));
  toast(t('حُذف قيدُ الصيانة')); render(1);
}

function svqPhotoDel(photoId){
  var p = (STATE.photos || {})[photoId], rec = p ? STATE.recs[p.site] : null;
  if (!p || !rec || p.del) return false;
  if (!svqCanDel(p, rec)){ toast(t('حذفُ هذه الصورة للمهندس')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  if (may('delete') && typeof photoDelete === 'function') photoDelete(photoId, 'من تعديل المسح');
  else {
    var dr = { site:p.site, kind:p.kind, at:p.at, by:p.by || p._by || '', del:{ by:who, at:now, why:'حذفها رافعُها من تعديل المسح' } };
    STATE.photos[photoId] = dr; CORE.set('photos', photoId, dr);  phTouch();   /* (V37.22) */
    logEvent('حذف صورة — ' + photoId + ' · من تعديل المسح', p.site);
  }
  var n = Object.assign({}, rec);
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:'ph:' + (p.kind || 'extra'), o:'صورة', v:'حُذفت', by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var left = svqPhotoCount(p.site);
  n.phN = left;
  if (p.kind && !(typeof photosOf === 'function' ? photosOf(p.site) : []).some(function(e){ return !(e[1] || {}).del && e[1].kind === p.kind; })) n.photos = (Array.isArray(rec.photos) ? rec.photos : []).filter(function(k){ return k !== p.kind; });
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', p.site, n);
  SVQ.delAsk = ''; statBump();
  toast(t(back ? 'حُذفت الصورة — وعاد المسحُ لانتظار الاعتماد' : 'حُذفت الصورة'));
  return true;
}

function svqSave(id, key, val, quiet){   /* (V38.20) quiet: جزءٌ من حفظٍ مركّب (التحديات + وصفُها) فلا يقول «لم يتغيّر شيء» */
  var rec = STATE.recs[id]; if (!rec || !svqMay(id)) return false;
  var old = key === 'chals' ? (rec.chals || []).slice() : key === 'loc' ? locList(rec.loc) : rec[key];
  if (SVQ_NUM[key]){ var nv = cfgN(val); if (!(nv > 0)){ toast(t('اكتب رقمًا أكبر من صفر')); return false; } val = nv; }
  else if (key === 'chals'){ if (!val || !val.length){ toast(t('اختر تحديًا واحدًا على الأقل — أو «لا توجد تحديات»')); return false; } }
  else if (key === 'loc'){ val = Array.isArray(val) ? val.slice() : locList(val); }   /* (V38.25) قائمة */
  else val = String(val == null ? '' : val).trim();
  if (JSON.stringify(old) === JSON.stringify(val)){ if (!quiet) toast(t('لم يتغيّر شيء')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  var n = Object.assign({}, rec);
  n[key] = val;
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:key, o:old, v:val, by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', id, n);
  var line = t(svqLabel(key)) + ': ' + svqFmt(old) + ' \u2190 ' + svqFmt(val);
  logEvent('تعديلُ مسح — ' + id + ' \u00b7 ' + line, id);
  if (rec.review === 'approved') notifPush('تعديلُ مسحٍ معتمد', line + ' — ' + id + (back ? ' — ' + t('عاد لانتظار الاعتماد') : ''), { site:id, lv:'مهم' });
  SVQ.key = ''; SVQ.tmp = null; SVQ.tmpL = null; SVQ.note = null; SVQ.err = ''; SVQ.holdTill = Date.now() + 1500;   /* (V39.66) */
  statBump();
  if (!quiet) toast(t(back ? 'عُدِّل الحقل — وعاد المسحُ لانتظار الاعتماد' : 'عُدِّل الحقل — والباقي كما هو'));   /* (V38.21) الحفظُ المركّب يقول جملةً واحدة */
  return true;
}

/* (V38.70) a visit saved on the wrong point (the formSite() fallback put 15 on Arafat 0001) moves to its right point: the
   record goes there for review again (marked with where it came from), the visit's own photos follow it (and the server moves
   their Drive files: rehome), and the wrong point returns to «not visited» with the move written on it. */
function svqVisitPhotos(src, rec){
  var day = dayKey(rec.at || 0);
  return (typeof photosOf === 'function' ? photosOf(src) : []).filter(function(p){ var ph = p[1] || {}; return !ph.del && !/^ins|^dis/.test(String(ph.kind || '')) && (ph.by || '') === (rec.by || '') && dayKey(ph.at || 0) === day; });
}

function svqMove(src){
  if (!may('approve')){ toast(t('نقلُ زيارةٍ للمهندس فما فوق')); return false; }
  var rec = STATE.recs[src], from = siteFind(src); if (!rec || !from) return false;
  var q = (typeof prompt === 'function') ? prompt(t('إلى أيِّ نقطة؟ — اكتب معرِّفها أو شاخصها (مثل 38/56)'), '') : '';
  if (!q) return false; q = String(q).trim();
  var to = siteFind(q) || (siteSearch(q, 2).length === 1 ? siteSearch(q, 1)[0] : null);
  if (!to){ toast(t('لم تُعرَف النقطة — اكتب المعرِّفَ كاملًا') + ': ' + q); return false; }
  if (to.id === src){ toast(t('هي النقطةُ نفسُها')); return false; }
  var ph = svqVisitPhotos(src, rec), has = !!STATE.recs[to.id] && !STATE.recs[to.id].deleted;
  var ok = (typeof confirm === 'function') ? confirm(t('تُنقَل زيارةُ') + ' ' + (rec.by || '') + ' (' + fmtDT(rec.at) + ') ' + t('ومعها') + ' ' + nm(ph.length) + ' ' + t('صورة') + ' ' + t('إلى') + ' ' + siteKey(to) + ' \u00b7 ' + to.name + (has ? '\n' + t('وللنقطة الهدف زيارةٌ ستُستبدَل') : '') + '\n' + t('متابعة؟')) : true;
  if (!ok) return false;
  var who = STATE.meta.name || '', now = Date.now();
  var moved = Object.assign({}, rec, { id:to.id, review:'pending', movedFrom:{ site:src, by:who, at:now } });
  delete moved.deleted;
  STATE.recs[to.id] = moved; CORE.set('recs', to.id, moved);
  ph.forEach(function(p){ var np = Object.assign({}, p[1], { site:to.id, rehome:true, movedFrom:src }); delete np.data; STATE.photos[p[0]] = np; CORE.set('photos', p[0], np); });
  if (typeof phTouch === 'function') phTouch();
  var gone = { id:src, deleted:true, movedTo:to.id, movedAt:now, movedBy:who, was:{ by:rec.by || '', at:rec.at || 0 } };
  STATE.recs[src] = gone; CORE.set('recs', src, gone);
  logEvent('نقل زيارة — ' + src + ' \u2192 ' + to.id + ' · ' + (rec.by || '') + ' ' + fmtDT(rec.at) + ' · ' + ph.length + ' صورة', src);
  logEvent('زيارةٌ وصلت بالنقل من ' + src + ' — ' + (rec.by || ''), to.id);
  if (typeof statBump === 'function') statBump();
  SVQ = { id:'', key:'', tmp:null };
  toast(t('نُقلت الزيارة إلى') + ' ' + siteKey(to) + ' — ' + t('بانتظار اعتمادها'));
  return true;
}
