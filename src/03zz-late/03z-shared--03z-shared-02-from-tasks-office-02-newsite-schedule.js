/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-02-from-tasks-office-02-newsite-schedule.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function typeCode(ty){
  if (TYPE_CODE[ty]) return TYPE_CODE[ty];
  var a = String(ty || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return a ? a.slice(0, 4) : 'NEW';
}
