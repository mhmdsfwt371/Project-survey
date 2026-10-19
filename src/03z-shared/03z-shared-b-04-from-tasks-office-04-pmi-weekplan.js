/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-04-from-tasks-office-04-pmi-weekplan.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-04-pmi-weekplan.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : wplanFinal
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function wplanFinal(x){ return x.st === 'تم' || x.st === 'مغلق'; }
