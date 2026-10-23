/* (V38.90) moved by scripts/split-late.mjs from src/02-catalog/02-catalog-forms-03-site-details-points.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function bonusAdd(tech, pts, note){
  if (!mayBonus()){ toast(t('نقاطُ الزيادة للمهندس ومدير المشروع فما فوق')); return; }
  tech = String(tech || '').trim();
  var p = cfgN(pts);
  if (!tech){ toast(t('اختر الفنيَّ أولًا')); return; }
  if (!p){ toast(t('اكتب عدد نقاطٍ غيرَ صفر')); return; }
  var id = 'bn' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  var b = { id:id, tech:tech, pts:p, note:String(note || '').trim(),
            by:STATE.meta.name || '', at:Date.now() };
  if (!STATE.bonus) STATE.bonus = {};
  STATE.bonus[id] = b;
  CORE.set('bonus', id, b);
  logEvent((p > 0 ? 'إضافة' : 'خصم') + ' نقاط زيادة — ' + tech + ' \u00b7 ' + nm(Math.abs(p))
           + (note ? ' \u00b7 ' + note : ''));
  toast(tech + ' \u00b7 ' + (p > 0 ? '+' : '') + nm(p) + ' ' + t('نقطة'));
  statBump();
  render(1);
}

function bonusDel(id){
  if (!mayBonus()){ toast(t('حذفُ نقاط الزيادة للمشرف أو المهندس وحدهما')); return; }
  var b = STATE.bonus && STATE.bonus[id];
  if (!b) return;
  delete STATE.bonus[id];
  CORE.dirty('bonus', id, null);
  logEvent('حذف سطر نقاط زيادة — ' + b.tech + ' \u00b7 ' + nm(b.pts));
  toast(t('حُذف السطر'));
  statBump();
  render(1);
}
