/* (V38.90) moved by scripts/split-late.mjs from src/08-events/08-data-events-boot-05-menu-shell-perf.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function navPush(from){
  if (!from) return;
  if (NAV_HIST[NAV_HIST.length - 1] === from) return;
  NAV_HIST.push(from);
  if (NAV_HIST.length > 20) NAV_HIST.shift();
}

function navBack(){
  CUR = NAV_HIST.length ? NAV_HIST.pop() : 'over';
  render();
}
