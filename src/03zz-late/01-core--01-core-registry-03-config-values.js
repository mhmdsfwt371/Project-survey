/* ============================================================================
   FILE    : src/03zz-late/01-core--01-core-registry-03-config-values.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/01-core/01-core-registry-03-config-values.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : cfgDate
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* حقلُ تاريخٍ موصولٌ بالمصدر — يُخزَّن رقمًا (مللي ثانية) لأن CFG رقميّة */
function cfgDate(path){
  var v = cfgGet(path);
  return '<input type="date" value="' + (v ? dayKey(v) : '') + '" data-cfgdate="' + path + '">';
}
