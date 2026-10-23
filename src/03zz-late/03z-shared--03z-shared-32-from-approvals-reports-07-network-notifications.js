/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-32-from-approvals-reports-07-network-notifications.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-32-from-approvals-reports-07-network-notifications.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : stepDone, svClashAhead
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function stepDone(kind, siteId, detail, pts){
  var K = STEP_KINDS[kind] || { n:kind, i:'', code:'' };
  var who = STATE.meta.name || '';
  var rec = { at:Date.now(), kind:kind, site:siteId || '', by:who,
              detail:String(detail || ''), pts:cfgN(pts) || 0 };
  STATE.steps = STATE.steps || [];
  rec.id = uid36();
  STATE.steps.unshift(rec);
  if (STATE.steps.length > 300) STATE.steps.length = 300;
  /* تُرفَع: لوحةُ الوزارة على جهازها لا ترى ما بقي في جهاز الفنيّ */
  CORE.set('steps', rec.id, rec);
  CORE.saveSoon();
  /* بلا وجهةٍ: يراه المكتبُ كلُّه — ومن يدير الناسَ يرى كلَّ شيءٍ أصلًا */
  notifPush('تمّ', K.i + ' ' + t(K.n) + (siteId ? ' \u00b7 ' + siteId : '')
            + (detail ? ' \u00b7 ' + detail : '')
            + (rec.pts ? ' \u00b7 ' + nm(rec.pts) + ' ' + t('نقطة') : ''),
            /* فاعلُ الخطوة صاحبُ الجهاز نفسُه — هو من نفّذها الآن */
            { site:siteId || '', lv:'عادي' });
  return rec;
}

/* هل سبقني غيري على النقطة بعد فتحي للنموذج؟ */
function svClashAhead(id){
  var cur = STATE.recs[id];
  if (!cur || !cur._by || cur._by === STATE.meta.uid) return null;
  if (!FORM.openedAt || !(+cur._at > FORM.openedAt)) return null;
  return { by:(typeof dispName === 'function' && dispName(cur._byName || cur._by)) || cur._by, at:+cur._at };
}
