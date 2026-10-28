/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-03-export-import-docx.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-03-export-import-docx.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : exlLoad
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function exlLoad(){
  if (PV.EXLJS_READY || (typeof window !== 'undefined' && window.ExcelJS)){ PV.EXLJS_READY = true; return Promise.resolve(true); }
  if (PV.EXLJS_LOADING){ if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…')); return PV.EXLJS_LOADING; }   /* (V38.86) every press hears it */
  if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…'));   /* (V38.55) */
  PV.EXLJS_LOADING = libLoad('vendor/exceljs/4.4.0/exceljs.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js', 15000)   /* (V38.54) */
    .then(function(ok){ ok = !!(ok && window.ExcelJS); PV.EXLJS_READY = ok; if (!ok) setTimeout(function(){ PV.EXLJS_LOADING = null; }, 60000); return ok; });
  return PV.EXLJS_LOADING;
}
