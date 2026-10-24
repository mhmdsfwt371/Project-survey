/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-01-labels-colors.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-01-labels-colors.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : briefSet
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function briefSet(id, st, d, ph){
  if (!briefMay()){ toast(t('الخلاصةُ للميدان والمهندس والوزارة')); return false; }
  ph = ph || briefPhase();
  var r = briefRec(id, ph), col = ph === 'install' ? 'inss' : ph === 'dis' ? 'diss' : 'recs';
  if (!r){ toast(t(ph === 'install' ? 'تُكتَب بعد التركيب' : ph === 'dis' ? 'تُكتَب بعد الفك' : 'تُكتَب بعد نزول الميدان إلى النقطة')); return false; }
  if (st) r.bst = st;
  if (d !== null && d !== undefined) r.brief = String(d).trim();
  r.briefBy = STATE.meta.name || ''; r.briefAt = Date.now();
  /* (V39.27) the record is written whole (CORE.set replaces the local copy) and only the summary's fields differ from the
     stored one — so the ministry's write passes the rule that lets it change those fields and nothing else */
  CORE.set(col, id, r);
  logEvent('الخلاصة (' + (ph === 'install' ? 'التركيب' : ph === 'dis' ? 'الفك' : 'المسح') + ') — ' + id + (st ? ' · ' + st : ''), id);
  toast(t('حُفظت التفاصيل')); render(1);
  if (MAP) mapPaint();
  return true;
}
