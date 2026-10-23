/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-01-labels-colors.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-01-labels-colors.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : briefSet
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function briefSet(id, st, d){
  if (!briefMay()){ toast(t('التفاصيلُ المختصرة للميدان والمهندس والوزارة')); return false; }
  var r = STATE.recs[id];
  if (!r){ toast(t('تُكتَب بعد نزول الميدان إلى النقطة')); return false; }
  if (st) r.bst = st;
  if (d !== null && d !== undefined) r.brief = String(d).trim();
  r.briefBy = STATE.meta.name || ''; r.briefAt = Date.now();
  CORE.set('recs', id, r);
  logEvent('تفاصيل مختصرة — ' + id + (st ? ' · ' + st : ''), id);
  toast(t('حُفظت التفاصيل')); render(1);
  if (MAP) mapPaint();
  return true;
}
