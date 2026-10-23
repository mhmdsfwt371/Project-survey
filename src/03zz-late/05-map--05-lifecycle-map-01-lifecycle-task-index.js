/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-01-lifecycle-task-index.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-01-lifecycle-task-index.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : tasksTouched
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* من كتب مهمةً محليًّا يُبطِل الفهرسَ بهذه — فلا يُنسى النداءُ في موضعٍ جديد */
function tasksTouched(){ TK_IX = null; }
