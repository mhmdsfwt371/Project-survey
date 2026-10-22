/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-12-install-edit.js
   DOMAIN  : Catalog & forms — definitions, site details, forms, teams
   PURPOSE : (V38.61) «تعديل التركيب» — the installation's counterpart of «تعديل المسح»: status, parts and serials edited
             in place, installation photos deleted (engineer, or their taker before approval) and added, every change
             logged on the record and written into the point's chat. A field edit of an approved installation returns
             it to the engineer's review.
   DEFINES : insqState, insqMay, insqCanDel, insqKindLabel, insqPhotos, insqSheet, insqPhotoDel, insqSave
   NOTE    : Build order is the full path (see scripts/build.mjs). State lives on insqState() — no new globals.
   ============================================================================ */
function insqState(){ return insqState.s || (insqState.s = { id:'', delAsk:'', st:'' }); }
function insqMay(id){ var r = STATE.inss[id]; return !!r && !r.deleted && !!r.status && insStatusIs(r.status, 'مسودّة') === false && may('edit'); }
function insqCanDel(p, rec){ if (may('delete')) return true; return !!p && p.by === (STATE.meta.name || '') && !(rec || {}).approved; }
function insqKindLabel(k){ k = String(k || ''); if (/before/.test(k)) return 'قبل التركيب'; if (/after/.test(k)) return 'بعد التركيب'; if (/extra/.test(k)) return 'صورة إضافية'; return 'صورة تركيب'; }
function insqPhotos(rec){
  var id = rec.id, isIns = function(p){ return /^ins/.test(String((p[1] || {}).kind || '')); };
  var list = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del && isIns(p); });
  var q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).map(function(x, i){ return [i, x]; }).filter(function(e){ return e[1] && e[1].site === id && /^ins/.test(String(e[1].kind || '')); });
  var S = insqState();
  var row = function(thumb, label, sub, act){ return '<div class="svq-row"><div class="svq-ph">' + thumb + '</div><div class="svq-k" style="flex:1 1 50%"><b style="color:var(--ink)">' + esc(t(label)) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + sub + '</div></div>' + act + '</div>'; };
  var img = function(p, pid){ var src = p.thumb || phSrc(pid, p, 200); return src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span title="' + esc(t('وصلت وتُنقَل إلى الدرايف')) + '">\u23F3</span>'; };
  var h = '<div class="wp-sec" style="margin-top:12px">' + esc(t('صور التركيب')) + ' \u00b7 ' + nm(list.length + q.length) + '</div>';
  h += list.map(function(p){
    var ph = p[1] || {}, ask = S.delAsk === p[0];
    var act = insqCanDel(ph, rec)
      ? (ask ? btn(t('تأكيد الحذف'), 'btn-sm', ' data-insqdel="' + esc(p[0]) + '" style="background:#C0392B;color:#fff"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-insqdelx="1"')
             : btn('\u{1F5D1} ' + t('احذف'), 'btn-quiet btn-sm', ' data-insqdelask="' + esc(p[0]) + '"'))
      : '<span class="hint" style="margin:0;font-size:11px">' + esc(t('حذفُها للمهندس')) + '</span>';
    return row(img(ph, p[0]), insqKindLabel(ph.kind), esc(fmtDT(ph.at)) + (ph.by ? ' \u00b7 ' + esc(dispName(ph.by)) : '') + (ph.link || ph.driveId ? ' \u00b7 ' + esc(t('على الدرايف')) : (ph.status === 'pending' ? ' \u00b7 \u23F3 ' + esc(t('تُنقَل إلى الدرايف')) : '')), act);
  }).join('');
  h += q.map(function(e){ return row(img(e[1]), insqKindLabel(e[1].kind), esc(t('في طابور جهازك — تُرفَع مع المزامنة')), btn('\u2715 ' + t('ألغِها'), 'btn-quiet btn-sm', ' data-insqqx="' + e[0] + '"')); }).join('');
  if (!list.length && !q.length) h += '<p class="hint">' + esc(t('لا صورَ تركيبٍ لهذه النقطة بعد.')) + '</p>';
  h += '<div class="svq-add"><label class="btn btn-primary btn-sm" style="cursor:pointer">\u{1F4F7} ' + esc(t('أضف صورة'))
    + '<input type="file" accept="image/*" multiple data-insqadd="' + esc(id) + '" style="display:none" aria-label="' + esc(t('أضف صورة')) + '"></label></div>'
    + '<p class="hint" style="margin:6px 0 0">' + esc(t('لاستبدال صورةٍ: احذف القديمةَ وأضف الجديدة. والحذفُ يُسجَّل باسمك ولا يُمحى أثرُه.')) + '</p>';
  return h;
}
function insqSheet(){
  var S = insqState(); if (!S.id) return '';
  var rec = STATE.inss[S.id], s = siteFind(S.id);
  if (!rec || !s || !insqMay(S.id)){ S.id = ''; return ''; }
  var boss = may('approve'), zone = siteZone(s), parts = itemsList().filter(function(i){ return i.z === zone && i.name; });
  var cur = S.st || rec.status;
  var chips = '<div class="chips" style="margin:0 0 8px">' + ['قيد التركيب', 'مُركّب', 'متعذّر'].map(function(c){ return '<button type="button" class="chip' + (insStatusIs(cur, c) ? ' on' : '') + '" data-insqst="' + esc(c) + '">' + esc(t(c)) + '</button>'; }).join('') + '</div>';
  var rows = parts.map(function(p){
    var q = cfgN((rec.parts || {})[p.code]) || 0, sn = (rec.serials || {})[p.code] || '';
    return '<div class="svq-row"><div class="svq-k" style="flex:1 1 40%">' + esc(p.name) + '<div class="hint" style="margin:0;font-size:11px">' + esc(t('النقاط')) + ' ' + nm(itPts(p.code)) + '</div></div>'
      + '<input type="number" inputmode="numeric" min="0" class="in" style="width:64px" value="' + q + '" data-insqp="' + esc(p.code) + '" aria-label="' + esc(t('الكمية')) + '">'
      + '<input class="in" dir="ltr" style="flex:1 1 40%" value="' + esc(sn) + '" placeholder="' + esc(t('السيريال')) + '" data-insqs="' + esc(p.code) + '">' + '</div>';
  }).join('');
  var hist = (Array.isArray(rec.edits) ? rec.edits : []).slice(-5).reverse().map(function(e){ return '<li><span class="hint" style="margin:0">' + esc(fmtDT(e.at)) + ' \u00b7 ' + esc(dispName(e.by)) + '</span> — ' + esc(e.what) + '</li>'; }).join('');
  return '<div class="svq-back" id="insqSheet" role="dialog" aria-modal="true"><div class="svq-box">'
    + '<div class="svq-h"><div><b>\u270E ' + esc(t('تعديل التركيب')) + '</b><div class="hint" style="margin:2px 0 0"><span class="num">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' \u00b7 ' + esc(s.id) : '') + '</span> \u00b7 ' + esc(s.name) + '</div></div>'
    + '<button type="button" class="npop-x" data-insqx="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<p class="hint" style="margin:6px 0 10px">' + esc(t(rec.approved && !boss ? 'هذا التركيبُ معتمد — أيُّ تعديلٍ يعيده إلى تدقيق المهندس.' : 'عدّل الحالةَ أو الكمياتِ أو السيريالات ثم احفظ — والصورُ تُحذَف وتُضاف كلٌّ على حدة، ويُسجَّل كلُّ تعديلٍ باسمك.')) + '</p>'
    + '<div class="wp-sec">' + esc(t('حالة التركيب')) + '</div>' + chips
    + '<div class="wp-sec">' + esc(t('القطع والسيريالات')) + '</div>' + rows
    + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('احفظ التعديل'), 'btn-primary btn-sm', ' data-insqsave="1"') + btn(t('إغلاق'), 'btn-quiet btn-sm', ' data-insqx="1"')
    + (boss ? btn('\u2716 ' + t('إلغاء تركيبٍ سُجِّل خطأً'), 'btn-sm', ' data-insqvoid="' + esc(rec.id) + '" style="color:var(--danger);border-color:var(--danger)"') : '') + '</div>'   /* (V38.68) */
    + insqPhotos(rec) + phDeletedHtml(rec.id, true)   /* (V38.74) */
    + (hist ? '<div class="wp-sec" style="margin-top:12px">' + esc(t('آخر التعديلات')) + '</div><ul class="hint" style="margin:0;padding-inline-start:18px">' + hist + '</ul>' : '')
    + '</div></div>';
}
function insqPhotoDel(photoId){
  var p = (STATE.photos || {})[photoId], rec = p ? STATE.inss[p.site] : null;
  if (!p || !rec || p.del) return false;
  if (!insqCanDel(p, rec)){ toast(t('حذفُ هذه الصورة للمهندس')); return false; }
  var now = Date.now(), who = STATE.meta.name || '';
  if (may('delete') && typeof photoDelete === 'function') photoDelete(photoId, 'من تعديل التركيب');
  else {
    var dr = { site:p.site, kind:p.kind, at:p.at, by:p.by || p._by || '', del:{ by:who, at:now, why:'حذفها رافعُها من تعديل التركيب' } };
    STATE.photos[photoId] = dr; CORE.set('photos', photoId, dr); phTouch();
    logEvent('حذف صورة تركيب — ' + photoId, p.site);
  }
  var n = Object.assign({}, rec, { photos:(rec.photos || []).filter(function(k){ return k !== p.kind; }) });
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ what:t('حُذفت صورة') + ' — ' + t(insqKindLabel(p.kind)), by:who, at:now }]).slice(-30);
  CORE.set('inss', p.site, n); insqState().delAsk = '';
  if (typeof chSystem === 'function') chSystem(p.site, 'حُذفت صورةُ تركيب (' + t(insqKindLabel(p.kind)) + ') — ' + who, '');
  return true;
}
function insqSave(){
  var S = insqState(), rec = STATE.inss[S.id], s = siteFind(S.id); if (!rec || !s) return false;
  var who = STATE.meta.name || '', now = Date.now(), parts = {}, serials = {}, changes = [];
  document.querySelectorAll('#insqSheet [data-insqp]').forEach(function(el){ var q = Math.max(0, Math.round(cfgN(el.value) || 0)); if (q > 0) parts[el.getAttribute('data-insqp')] = q; });
  document.querySelectorAll('#insqSheet [data-insqs]').forEach(function(el){ var v = String(el.value || '').trim(); if (v) serials[el.getAttribute('data-insqs')] = v; });
  var status = S.st || rec.status;
  /* serial rules as in the form: no repeat inside the point, none registered on another live point */
  var seen = {}, dup = ''; Object.keys(serials).forEach(function(k){ if (seen[serials[k]]) dup = serials[k]; seen[serials[k]] = 1; });
  if (dup){ toast(t('رقم تسلسليٌّ مكرّر داخل النقطة') + ': ' + dup); return false; }
  var elsewhere = ''; Object.keys(seen).forEach(function(v){ if (elsewhere) return; var o = serialOwner(v, s.id); if (o && !disDone(o)) elsewhere = v + ' \u2192 ' + o; });
  if (elsewhere && !(may('approve') && typeof confirm === 'function' && confirm(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + elsewhere + ' — ' + t('سجّله هنا على أيِّ حال؟')))){ toast(t('رقمٌ تسلسليٌّ مسجَّلٌ على نقطةٍ أخرى لم تُفَكّ') + ': ' + elsewhere); return false; }
  if (!insStatusIs(status, rec.status)) changes.push(t('الحالة') + ': ' + t(rec.status || '—') + ' \u2190 ' + t(status));
  var all = {}; Object.keys(rec.parts || {}).concat(Object.keys(parts)).forEach(function(k){ all[k] = 1; });
  Object.keys(all).forEach(function(k){
    var o = cfgN((rec.parts || {})[k]) || 0, n = parts[k] || 0, so = (rec.serials || {})[k] || '', sn = serials[k] || '';
    if (o !== n) changes.push(itemName(k) + ' \u00d7' + nm(o) + ' \u2190 \u00d7' + nm(n));
    if (so !== sn) changes.push(itemName(k) + ' ' + t('سيريال') + ': ' + (so || '—') + ' \u2190 ' + (sn || '—'));
  });
  if (!changes.length){ toast(t('لا تغييرَ')); return false; }
  var pts = 0; Object.keys(parts).forEach(function(k){ pts += parts[k] * itPts(k); });
  var n2 = Object.assign({}, rec, { status:status, parts:parts, serials:serials, pts:pts, editAt:now, editBy:who });
  if (rec.approved && !may('approve')){ n2.approved = false; n2.why = 'عُدِّل بعد الاعتماد — يُراجَع ثانيةً'; changes.push(t('أُعيد إلى التدقيق')); }
  n2.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ what:changes.join(' \u00b7 '), by:who, at:now }]).slice(-30);
  CORE.set('inss', s.id, n2);
  if (n2.solution === undefined && rec.solution) STATE.inss[s.id] = Object.assign({}, n2, { solution:rec.solution });
  insConsume(s.id, insStatusIs(status, 'متعذّر') ? {} : parts, who);   /* (V38.62) net against what the point already consumed */
  logEvent('تعديل تركيب — ' + s.id + ' · ' + changes.join(' · '), s.id);
  if (typeof chSystem === 'function') chSystem(s.id, 'عُدِّل التركيب — ' + changes.join(' \u00b7 '), '');
  if (typeof statBump === 'function') statBump();
  toast(t('حُفظ التعديل')); S.st = '';
  return true;
}

/* (V38.68) an installation recorded on the wrong point is voided — by the engineer and above, with a reason. The point returns to
   «not installed»; what it consumed goes back to the installer's custody; its installation photos are set aside with the reason;
   the voided record keeps what it held (who, when, parts, serials) so the trace stays. */
function insqVoid(id){
  if (!may('approve')){ toast(t('إلغاءُ تركيبٍ للمهندس فما فوق')); return false; }
  var rec = STATE.inss[id], s = siteFind(id); if (!rec || !s || !rec.status) return false;
  var why = (typeof prompt === 'function') ? prompt(t('سببُ الإلغاء (يبقى في السجل) — مثلًا: سُجِّل على نقطةٍ خطأ'), t('سُجِّل على نقطةٍ خطأ')) : t('سُجِّل على نقطةٍ خطأ');
  if (why === null) return false;
  var who = STATE.meta.name || '', now = Date.now();
  var prev = { status:rec.status, by:rec.by || '', at:rec.at || 0, approved:!!rec.approved, apprBy:rec.apprBy || '', parts:rec.parts || {}, serials:rec.serials || {}, prefix:rec.prefix || '' };
  var n2 = Object.assign({}, rec, { status:'', approved:false, parts:{}, serials:{}, pts:0, photos:[], prefix:'', voided:{ by:who, at:now, why:String(why || '').trim(), prev:prev } });
  n2.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ what:t('أُلغي التركيب') + ' — ' + String(why || ''), by:who, at:now }]).slice(-30);
  CORE.set('inss', id, n2);
  insConsume(id, {}, who);
  (typeof photosOf === 'function' ? photosOf(id) : []).forEach(function(p){ var ph = p[1] || {}; if (ph.del || !/^ins/.test(String(ph.kind || ''))) return; var dr = Object.assign({}, ph, { del:{ by:who, at:now, why:t('تركيبٌ أُلغي') + ' — ' + String(why || '') } }); delete dr.data; STATE.photos[p[0]] = dr; CORE.set('photos', p[0], dr); });
  if (typeof phTouch === 'function') phTouch();
  logEvent('إلغاء تركيب — ' + id + ' · ' + String(why || '') + ' · كان: ' + prev.by + ' ' + (prev.at ? fmtDT(prev.at) : ''), id);
  if (typeof chSystem === 'function') chSystem(id, 'أُلغي التركيب — ' + String(why || '') + ' — ' + who, prev.by || '');
  if (typeof statBump === 'function') statBump();
  insqState().id = ''; toast(t('أُلغي التركيب وأُعيدت القطعُ إلى العهدة'));
  return true;
}
