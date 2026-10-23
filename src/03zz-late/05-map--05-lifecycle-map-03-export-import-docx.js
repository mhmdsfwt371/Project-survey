/* (V38.90) moved by scripts/split-late.mjs from src/05-map/05-lifecycle-map-03-export-import-docx.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function exlLoad(){
  if (EXLJS_READY || (typeof window !== 'undefined' && window.ExcelJS)){ EXLJS_READY = true; return Promise.resolve(true); }
  if (EXLJS_LOADING){ if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…')); return EXLJS_LOADING; }   /* (V38.86) every press hears it */
  if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…'));   /* (V38.55) */
  EXLJS_LOADING = libLoad('vendor/exceljs/4.4.0/exceljs.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js', 15000)   /* (V38.54) */
    .then(function(ok){ ok = !!(ok && window.ExcelJS); EXLJS_READY = ok; if (!ok) setTimeout(function(){ EXLJS_LOADING = null; }, 60000); return ok; });
  return EXLJS_LOADING;
}
