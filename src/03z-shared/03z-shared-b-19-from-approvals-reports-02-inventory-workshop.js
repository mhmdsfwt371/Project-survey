/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-19-from-approvals-reports-02-inventory-workshop.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-02-inventory-workshop.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : itemRename
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function itemRename(code, name){
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  if (!x) return;
  x.name = String(name || '').trim() || x.name;
  itemSave();
}
