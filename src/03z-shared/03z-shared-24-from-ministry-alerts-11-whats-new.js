/* ============================================================================
   FILE    : src/03z-shared/03z-shared-24-from-ministry-alerts-11-whats-new.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-11-whats-new.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : pwOpen
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function pwOpen(forced){ PW = { forced:!!forced }; render(1); }
