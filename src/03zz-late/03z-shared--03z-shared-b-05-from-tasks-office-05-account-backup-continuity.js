/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-b-05-from-tasks-office-05-account-backup-continuity.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-b-05-from-tasks-office-05-account-backup-continuity.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : bkAgeDays
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function bkAgeDays(o){ return o && o.at ? Math.floor((Date.now() - new Date(o.at).getTime()) / 86400000) : null; }
