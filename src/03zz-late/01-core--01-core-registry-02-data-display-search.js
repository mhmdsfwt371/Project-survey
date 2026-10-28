/* ============================================================================
   FILE    : src/03zz-late/01-core--01-core-registry-02-data-display-search.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/01-core/01-core-registry-02-data-display-search.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : fsi, fsiText
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function fsi(s){ return '\u2068' + String(s == null ? '' : s) + '\u2069'; }

function fsiText(s){ return String(s == null ? '' : s).replace(PV.BDI_TOK, function(m){ return bdiNeed(m) ? '\u2068' + m + '\u2069' : m; }); }
