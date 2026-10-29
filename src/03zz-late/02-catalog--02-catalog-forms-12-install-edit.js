/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-12-install-edit.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-12-install-edit.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : insqPhotoDel, insqSave, insqVoid
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function insqPhotoDel(photoId){
  var p = (STATE.photos || {})[photoId], rec = p ? STATE.inss[p.site] : null;
  if (!p || !rec || p.del) return false;
  if (!insqCanDel(p, rec)){ toast(t('حذفُ هذه الصورة للمشرف فما فوق')); return false; }
  var now = Date.now(), who = STATE.meta.name || '';
  if (mayPhotoEdit() && typeof photoDelete === 'function') photoDelete(photoId, 'من تعديل التركيب');
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
  /* (V39.14) the coverage fields — a change is a change like any other */
  var cov = Object.assign({}, rec.cov || {});
  document.querySelectorAll('#insqSheet [data-insqcov]').forEach(function(el){ var k = el.getAttribute('data-insqcov'), v = String(el.value || '').trim(); if (v === '') delete cov[k]; else cov[k] = Math.round(cfgN(v)); });
  if (JSON.stringify(cov) !== JSON.stringify(rec.cov || {})) changes.push(t('التغطية') + ': ' + [cov.dir != null ? t('اتجاه') + ' ' + nm(cov.dir) : '', cov.fov ? t('زاوية') + ' ' + nm(cov.fov) : '', cov.rdr ? t('مدى') + ' ' + nm(cov.rdr) : ''].filter(Boolean).join(' \u00b7 '));
  if (!changes.length){ toast(t('لا تغييرَ')); return false; }
  var pts = 0; Object.keys(parts).forEach(function(k){ pts += parts[k] * itPts(k); });
  var n2 = Object.assign({}, rec, { status:status, parts:parts, serials:serials, pts:pts, editAt:now, editBy:who, cov:cov });
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
