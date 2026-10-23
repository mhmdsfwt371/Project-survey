/* ============================================================================
   FILE    : src/03zz-late/01-core--01-core-registry-08-egates-seed.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/01-core/01-core-registry-08-egates-seed.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : egSave
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function egSave(gateId){
  if (!(typeof maySiteEditBasic === 'function' && maySiteEditBasic())){ toast(t('تحقيقُ البوابات للمشرف فما فوق')); return false; }
  var x = siteFind(gateId); if (!x || !egIsGate(x)){ toast(t('لا بوابةَ بهذا المعرِّف')); return false; }
  var g = function(n){ var el = document.getElementById(n); return el ? String(el.value || '').trim() : ''; };
  siteOvSet(gateId, { gateNo:g('egNo'), drawRef:g('egDraw'), readers:g('egReaders'), opStatus:g('egOp'), gateNote:g('egNote'), gateAt:Date.now(), gateBy:STATE.meta.name || '' });
  logEvent('تحقيقُ بوابة ' + (x.sign || gateId) + (g('egNo') ? ' — رقمُ الرسمة ' + g('egNo') : ''), gateId);
  egCard.open = ''; toast('\u2713 ' + t('حُفظ تحقيقُ البوابة')); return true;
}
