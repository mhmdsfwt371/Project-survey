/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-07-from-tasks-office-07-incidents-milestones.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function mileLate(m){
  var d = mileDateOf(m);
  return !!(d && d < dayKey(Date.now()) && mileDone(m) < 0.999);
}
