/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-02-from-tasks-office-02-newsite-schedule.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-02-from-tasks-office-02-newsite-schedule.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : typeCode
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function typeCode(ty){
  if (TYPE_CODE[ty]) return TYPE_CODE[ty];
  var a = String(ty || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return a ? a.slice(0, 4) : 'NEW';
}
