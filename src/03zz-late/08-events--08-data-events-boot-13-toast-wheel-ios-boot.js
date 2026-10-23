/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-13-toast-wheel-ios-boot.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-13-toast-wheel-ios-boot.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : supRemove, svPopRemove
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* (V37.14) نوافذُ القوائم وصورُها تُزال من مكانها — بلا رسم الصفحة */
function supRemove(){ ['supVeil', 'supBox'].forEach(function(i0){ var el0 = document.getElementById(i0); if (el0) el0.remove(); }); }

function svPopRemove(){ ['.svpop-veil', '.svpop', '#svPhoVeil', '#svPhoBox'].forEach(function(q){ document.querySelectorAll(q).forEach(function(el){ el.remove(); }); }); }
