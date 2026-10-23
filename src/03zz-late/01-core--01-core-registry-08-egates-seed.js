/* (V38.90) moved by scripts/split-late.mjs from src/01-core/01-core-registry-08-egates-seed.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function egSave(gateId){
  if (!(typeof maySiteEditBasic === 'function' && maySiteEditBasic())){ toast(t('تحقيقُ البوابات للمشرف فما فوق')); return false; }
  var x = siteFind(gateId); if (!x || !egIsGate(x)){ toast(t('لا بوابةَ بهذا المعرِّف')); return false; }
  var g = function(n){ var el = document.getElementById(n); return el ? String(el.value || '').trim() : ''; };
  siteOvSet(gateId, { gateNo:g('egNo'), drawRef:g('egDraw'), readers:g('egReaders'), opStatus:g('egOp'), gateNote:g('egNote'), gateAt:Date.now(), gateBy:STATE.meta.name || '' });
  logEvent('تحقيقُ بوابة ' + (x.sign || gateId) + (g('egNo') ? ' — رقمُ الرسمة ' + g('egNo') : ''), gateId);
  egCard.open = ''; toast('\u2713 ' + t('حُفظ تحقيقُ البوابة')); return true;
}
