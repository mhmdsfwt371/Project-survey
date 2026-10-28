/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-05-menu-shell-perf.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-05-menu-shell-perf.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : navPush, navBack
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function navPush(from){
  if (!from) return;
  if (PV.NAV_HIST[PV.NAV_HIST.length - 1] === from) return;
  PV.NAV_HIST.push(from);
  if (PV.NAV_HIST.length > 20) PV.NAV_HIST.shift();
}

function navBack(){
  CUR = PV.NAV_HIST.length ? PV.NAV_HIST.pop() : 'over';
  render();
}
