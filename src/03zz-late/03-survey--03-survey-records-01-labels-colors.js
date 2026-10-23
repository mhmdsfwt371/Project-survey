/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-01-labels-colors.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
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
